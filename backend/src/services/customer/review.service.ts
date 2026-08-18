import pool from '../../config/db.js';

export interface CreateReviewInput {
  issuedVoucherId?: number | string;
  programId?: number | string;
  customerId: number | string;
  rating?: number | null;
  reviewContent?: string | null;
  complaintContent?: string | null;
}

/**
 * Kiểm tra quyền đánh giá voucher của khách hàng (Phải đã mua và thanh toán đơn hàng)
 */
export async function checkCustomerReviewEligibility(customerId: number | string, programId: number | string) {
  // 1. Kiểm tra khách hàng có sở hữu voucher đã thanh toán thuộc chương trình này không
  const purchaseQuery = `
    SELECT 
      iv.issued_voucher_id, 
      iv.owner_user_id, 
      iv.program_id,
      iv.voucher_code,
      o.payment_status
    FROM issued_vouchers iv
    LEFT JOIN order_items oi ON oi.order_item_id = iv.order_item_id
    LEFT JOIN orders o ON o.order_id = oi.order_id
    WHERE iv.program_id = $1 AND iv.owner_user_id = $2
      AND (o.payment_status = 'PAID' OR o.payment_status IS NULL)
    ORDER BY iv.issued_at DESC
    LIMIT 1
  `;
  const purchaseRes = await pool.query(purchaseQuery, [programId, customerId]);

  if (purchaseRes.rows.length === 0) {
    return {
      canReview: false,
      hasPurchased: false,
      hasReviewed: false,
      message: 'Bạn chưa mua sản phẩm này. Chỉ những khách hàng đã mua mới có thể gửi đánh giá.',
    };
  }

  const issuedVoucher = purchaseRes.rows[0];

  // 2. Kiểm tra xem khách hàng đã từng đánh giá chương trình này chưa
  const reviewQuery = `
    SELECT 
      rf.review_id,
      rf.rating,
      rf.review_content,
      rf.complaint_content,
      rf.submitted_at
    FROM reviews_feedback rf
    JOIN issued_vouchers iv ON rf.issued_voucher_id = iv.issued_voucher_id
    WHERE iv.program_id = $1 AND rf.customer_id = $2
    ORDER BY rf.submitted_at DESC
    LIMIT 1
  `;
  const reviewRes = await pool.query(reviewQuery, [programId, customerId]);

  return {
    canReview: true,
    hasPurchased: true,
    hasReviewed: reviewRes.rows.length > 0,
    issuedVoucherId: Number(issuedVoucher.issued_voucher_id),
    voucherCode: issuedVoucher.voucher_code,
    existingReview: reviewRes.rows[0] || null,
  };
}

export async function createCustomerReview(input: CreateReviewInput) {
  const { customerId, rating, reviewContent, complaintContent } = input;
  let targetIssuedVoucherId = input.issuedVoucherId;

  // Nếu truyền programId mà chưa có issuedVoucherId -> Tự động tìm voucher hợp lệ của khách hàng
  if (!targetIssuedVoucherId && input.programId) {
    const eligibility = await checkCustomerReviewEligibility(customerId, input.programId);
    if (!eligibility.hasPurchased || !eligibility.issuedVoucherId) {
      throw { status: 403, message: 'Bạn chưa mua sản phẩm này nên không thể gửi đánh giá.' };
    }
    targetIssuedVoucherId = eligibility.issuedVoucherId;
  }

  if (!targetIssuedVoucherId) {
    throw { status: 400, message: 'Thiếu thông tin voucher hoặc chương trình để đánh giá.' };
  }

  // 1. Kiểm tra voucher phát hành có thuộc sở hữu của khách hàng và đã thanh toán không
  const voucherRes = await pool.query(
    `SELECT 
       iv.issued_voucher_id, 
       iv.owner_user_id, 
       iv.program_id,
       o.payment_status
     FROM issued_vouchers iv
     LEFT JOIN order_items oi ON oi.order_item_id = iv.order_item_id
     LEFT JOIN orders o ON o.order_id = oi.order_id
     WHERE iv.issued_voucher_id = $1`,
    [targetIssuedVoucherId]
  );

  if (voucherRes.rows.length === 0) {
    throw { status: 404, message: 'Voucher không tồn tại trên hệ thống.' };
  }

  const voucher = voucherRes.rows[0];
  if (String(voucher.owner_user_id) !== String(customerId)) {
    throw { status: 403, message: 'Bạn không có quyền đánh giá voucher này vì không phải người sở hữu.' };
  }

  if (voucher.payment_status && voucher.payment_status !== 'PAID') {
    throw { status: 403, message: 'Đơn hàng của voucher này chưa được thanh toán thành công.' };
  }

  // 2. Validate rating if provided
  let numericRating: number = 5;
  if (rating !== undefined && rating !== null) {
    numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      throw { status: 400, message: 'Đánh giá sao phải từ 1 đến 5 sao.' };
    }
  }

  const cleanReviewContent = reviewContent && reviewContent.trim() ? reviewContent.trim() : null;
  const cleanComplaintContent = complaintContent && complaintContent.trim() ? complaintContent.trim() : null;

  // 3. Lưu bản ghi reviews_feedback
  const result = await pool.query(
    `INSERT INTO reviews_feedback (issued_voucher_id, customer_id, rating, review_content, complaint_content, submitted_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
     RETURNING review_id, issued_voucher_id, customer_id, rating, review_content, complaint_content, submitted_at`,
    [targetIssuedVoucherId, customerId, numericRating, cleanReviewContent, cleanComplaintContent]
  );

  return result.rows[0];
}

export async function getProgramReviews(programId: number | string) {
  const query = `
    SELECT 
      rf.review_id,
      rf.issued_voucher_id,
      rf.rating,
      rf.review_content,
      rf.complaint_content,
      rf.submitted_at,
      u.full_name AS customer_name,
      u.user_id AS customer_id
    FROM reviews_feedback rf
    JOIN issued_vouchers iv ON rf.issued_voucher_id = iv.issued_voucher_id
    JOIN users u ON rf.customer_id = u.user_id
    WHERE iv.program_id = $1
    ORDER BY rf.submitted_at DESC
  `;

  const result = await pool.query(query, [programId]);

  // Calculate rating summary
  const summaryRes = await pool.query(
    `SELECT 
       COUNT(rf.review_id) AS total_reviews,
       COALESCE(AVG(rf.rating), 0) AS average_rating,
       COUNT(CASE WHEN rf.rating = 5 THEN 1 END) AS star_5,
       COUNT(CASE WHEN rf.rating = 4 THEN 1 END) AS star_4,
       COUNT(CASE WHEN rf.rating = 3 THEN 1 END) AS star_3,
       COUNT(CASE WHEN rf.rating = 2 THEN 1 END) AS star_2,
       COUNT(CASE WHEN rf.rating = 1 THEN 1 END) AS star_1,
       COUNT(CASE WHEN rf.complaint_content IS NOT NULL AND rf.complaint_content <> '' THEN 1 END) AS total_complaints
     FROM reviews_feedback rf
     JOIN issued_vouchers iv ON rf.issued_voucher_id = iv.issued_voucher_id
     WHERE iv.program_id = $1`,
    [programId]
  );

  return {
    reviews: result.rows,
    summary: summaryRes.rows[0]
  };
}

export async function getCustomerReviews(customerId: number | string) {
  const query = `
    SELECT 
      rf.review_id,
      rf.issued_voucher_id,
      rf.rating,
      rf.review_content,
      rf.complaint_content,
      rf.submitted_at,
      iv.voucher_code,
      vp.program_id,
      vp.program_name
    FROM reviews_feedback rf
    JOIN issued_vouchers iv ON rf.issued_voucher_id = iv.issued_voucher_id
    JOIN voucher_programs vp ON iv.program_id = vp.program_id
    WHERE rf.customer_id = $1
    ORDER BY rf.submitted_at DESC
  `;

  const result = await pool.query(query, [customerId]);
  return result.rows;
}
