import pool from '../../config/db.js';

export interface CreateReviewInput {
  issuedVoucherId: number | string;
  customerId: number | string;
  rating?: number | null;
  reviewContent?: string | null;
  complaintContent?: string | null;
}

export async function createCustomerReview(input: CreateReviewInput) {
  const { issuedVoucherId, customerId, rating, reviewContent, complaintContent } = input;

  // 1. Check if issued voucher exists and belongs to customer
  const voucherRes = await pool.query(
    `SELECT issued_voucher_id, owner_user_id, program_id
     FROM issued_vouchers
     WHERE issued_voucher_id = $1`,
    [issuedVoucherId]
  );

  if (voucherRes.rows.length === 0) {
    throw new Error('Voucher không tồn tại trên hệ thống.');
  }

  const voucher = voucherRes.rows[0];
  if (String(voucher.owner_user_id) !== String(customerId)) {
    throw new Error('Bạn không có quyền đánh giá voucher này.');
  }

  // 2. Validate rating if provided
  let numericRating: number | null = null;
  if (rating !== undefined && rating !== null) {
    numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      throw new Error('Đánh giá sao phải từ 1 đến 5.');
    }
  }

  const cleanReviewContent = reviewContent && reviewContent.trim() ? reviewContent.trim() : null;
  const cleanComplaintContent = complaintContent && complaintContent.trim() ? complaintContent.trim() : null;

  // 3. Insert review_feedback record
  const result = await pool.query(
    `INSERT INTO reviews_feedback (issued_voucher_id, customer_id, rating, review_content, complaint_content, submitted_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
     RETURNING review_id, issued_voucher_id, customer_id, rating, review_content, complaint_content, submitted_at`,
    [issuedVoucherId, customerId, numericRating, cleanReviewContent, cleanComplaintContent]
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
