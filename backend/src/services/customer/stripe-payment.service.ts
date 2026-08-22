/**
 * =========================================================================================
 * FILE: stripe-payment.service.ts
 * VỊ TRÍ: backend/src/services/customer/
 * VAI TRÒ:
 *   - Xử lý toàn bộ logic nghiệp vụ cho cổng thanh toán Stripe Checkout:
 *     1. `createStripeCheckoutSession`: Kiểm tra tính hợp lệ của đơn hàng và tạo phiên thanh toán Stripe Checkout (tiền tệ VND).
 *     2. `verifyAndCaptureStripeOrder`: Đối soát trạng thái thanh toán từ máy chủ Stripe, thực hiện Database Transaction ACID để cập nhật đơn hàng thành PAID / COMPLETED và phát hành mã E-Voucher an toàn.
 *     3. `getStripeStatus`: Truy vấn thông tin và trạng thái thanh toán Stripe của đơn hàng.
 * =========================================================================================
 */

import pool from '../../config/db.js';
import stripe, { getStripeConfig } from '../../config/stripe.js';
import { generateVoucherCode } from './order.service.js';

/**
 * 1. Khởi tạo phiên thanh toán Stripe Checkout Session cho đơn hàng
 * 
 * @param customerId - ID người dùng khách hàng đang đăng nhập
 * @param orderId - ID đơn hàng cần thanh toán
 * @returns Object chứa `session_id`, `checkout_url` để chuyển hướng người dùng sang trang Stripe
 */
export async function createStripeCheckoutSession(customerId: number, orderId: number) {
  if (!orderId || isNaN(orderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  // Bước 1: Kiểm tra đơn hàng có tồn tại và thuộc quyền sở hữu của khách hàng không
  const orderRes = await pool.query(
    `SELECT 
       o.order_id,
       o.buyer_user_id,
       o.recipient_user_id,
       o.total_amount,
       o.payment_method,
       o.payment_status,
       o.order_status,
       o.created_at,
       u.email as buyer_email,
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.created_at))::int AS elapsed_seconds
     FROM orders o
     JOIN users u ON u.user_id = o.buyer_user_id
     WHERE o.order_id = $1 AND (o.buyer_user_id = $2 OR o.recipient_user_id = $2)`,
    [orderId, customerId]
  );

  if (orderRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền thanh toán đơn hàng này.' };
  }

  const order = orderRes.rows[0];

  // Không cho phép thanh toán đơn hàng đã bị hủy
  if (order.order_status === 'CANCELLED') {
    throw { status: 400, message: 'Không thể thanh toán đơn hàng đã bị hủy.' };
  }

  // Bước 2: Kiểm tra thời hạn thanh toán 5 phút (300 giây) theo quy định hệ thống
  const elapsedSeconds = Number(order.elapsed_seconds || 0);
  if (elapsedSeconds > 300) {
    // Quá 5 phút tự động chuyển sang trạng thái CANCELLED
    await pool.query(
      `UPDATE orders SET order_status = 'CANCELLED' WHERE order_id = $1`,
      [orderId]
    );
    throw {
      status: 400,
      message: 'Đơn hàng đã hết hạn thời gian thanh toán (5 phút). Vui lòng tạo lại đơn hàng mới.',
    };
  }

  // Idempotency: Nếu đơn hàng đã hoàn tất trước đó thì trả về kết quả thành công ngay
  if (order.order_status === 'COMPLETED' && order.payment_status === 'PAID') {
    return {
      success: true,
      message: 'Đơn hàng đã được thanh toán hoàn tất trước đó.',
      payment: {
        order_id: orderId,
        status: 'COMPLETED',
        payment_status: 'PAID',
        order_status: 'COMPLETED',
        total_amount: Number(order.total_amount),
      },
    };
  }

  // Bước 3: Lấy danh sách sản phẩm trong đơn để định dạng thành `line_items` cho Stripe
  const itemsRes = await pool.query(
    `SELECT 
       oi.order_item_id,
       oi.program_id,
       oi.quantity,
       oi.unit_price,
       vp.program_name
     FROM order_items oi
     JOIN voucher_programs vp ON vp.program_id = oi.program_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  // Định dạng danh sách mặt hàng cho Stripe (tiền tệ VND không có đơn vị thập phân nên dùng số nguyên)
  const lineItems = itemsRes.rows.map((item: any) => ({
    price_data: {
      currency: 'vnd',
      product_data: {
        name: item.program_name || `Voucher #${item.program_id}`,
      },
      unit_amount: Math.round(Number(item.unit_price)),
    },
    quantity: Number(item.quantity),
  }));

  const config = getStripeConfig();

  // Bước 4: Gọi Stripe API tạo Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // Chấp nhận thanh toán qua thẻ quốc tế Visa / Mastercard / JCB / Amex
    line_items: lineItems,
    mode: 'payment',
    customer_email: order.buyer_email || undefined,
    client_reference_id: String(orderId),
    metadata: {
      order_id: String(orderId),
      customer_id: String(customerId),
    },
    // URL redirect kèm tham số để Frontend tự động khớp lệnh khi quay lại
    success_url: `${config.returnUrl}?order_id=${orderId}&stripe_success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.cancelUrl}?order_id=${orderId}&stripe_cancelled=true`,
  });

  return {
    success: true,
    message: 'Khởi tạo phiên thanh toán Stripe Checkout thành công.',
    payment: {
      order_id: orderId,
      session_id: session.id,
      checkout_url: session.url,
      amount_vnd: Number(order.total_amount),
      currency: 'VND',
      status: 'OPEN',
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * 2. Xác thực và Capture đơn hàng từ Stripe sau khi khách hàng hoàn tất thanh toán
 * 
 * @param customerId - ID người dùng khách hàng
 * @param orderId - ID đơn hàng
 * @param sessionId - Session ID nhận được từ Stripe để đối soát trực tiếp
 * @returns Object chứa đơn hàng đã cập nhật và danh sách mã voucher được phát hành
 */
export async function verifyAndCaptureStripeOrder(
  customerId: number,
  orderId: number,
  sessionId?: string
) {
  if (!orderId || isNaN(orderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  // Bước 1: Đối soát trạng thái thanh toán từ máy chủ Stripe nếu có sessionId
  if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      throw {
        status: 400,
        message: `Giao dịch Stripe chưa hoàn tất thanh toán (Trạng thái: ${session.payment_status}).`,
      };
    }
  }

  // Bước 2: Bắt đầu Database Transaction để đảm bảo tính toàn vẹn (ACID)
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Khóa dòng đơn hàng (FOR UPDATE) để ngăn chặn race-condition khi gọi đối soát đồng thời
    const orderRes = await client.query(
      `SELECT 
         *, 
         EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))::int AS elapsed_seconds 
       FROM orders 
       WHERE order_id = $1 AND buyer_user_id = $2 
       FOR UPDATE`,
      [orderId, customerId]
    );

    if (orderRes.rows.length === 0) {
      throw { status: 404, message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền thanh toán đơn hàng này.' };
    }

    const order = orderRes.rows[0];

    // Idempotency: Nếu đơn hàng đã được cập nhật PAID trước đó, trả về ngay tránh tạo voucher trùng
    if (order.order_status === 'COMPLETED' && order.payment_status === 'PAID') {
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Đơn hàng đã được thanh toán hoàn tất trước đó.',
        order: {
          order_id: orderId,
          created_at: order.created_at,
          total_amount: Number(order.total_amount),
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          order_status: order.order_status,
          recipient_user_id: order.recipient_user_id,
        },
      };
    }

    if (order.order_status === 'CANCELLED') {
      throw { status: 400, message: 'Không thể thanh toán đơn hàng đã bị hủy.' };
    }

    // Bước 3: Lấy danh sách sản phẩm trong đơn để phát hành mã voucher
    const itemsRes = await client.query(
      `SELECT 
         oi.order_item_id,
         oi.program_id,
         oi.quantity,
         oi.unit_price,
         vp.program_name,
         vp.discount_amount,
         vp.use_end_at
       FROM order_items oi
       JOIN voucher_programs vp ON vp.program_id = oi.program_id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    const recipientUserId = order.recipient_user_id || order.buyer_user_id;
    const issuedVouchersList: any[] = [];

    // Bước 4: Phát hành từng mã voucher ngẫu nhiên duy nhất vào bảng `issued_vouchers`
    for (const item of itemsRes.rows) {
      const quantity = Number(item.quantity);
      for (let i = 0; i < quantity; i++) {
        let code = generateVoucherCode();
        let isUnique = false;
        let attempts = 0;
        // Kiểm tra chống trùng lặp mã code
        while (!isUnique && attempts < 5) {
          const codeCheck = await client.query(
            `SELECT 1 FROM issued_vouchers WHERE voucher_code = $1`,
            [code]
          );
          if (codeCheck.rows.length === 0) {
            isUnique = true;
          } else {
            code = generateVoucherCode();
            attempts++;
          }
        }

        const voucherRes = await client.query(
          `INSERT INTO issued_vouchers (
             program_id,
             order_item_id,
             owner_user_id,
             voucher_code,
             qr_code,
             usage_status,
             issued_at,
             expires_at,
             discount_amount
           ) VALUES ($1, $2, $3, $4, $5, 'UNUSED', CURRENT_TIMESTAMP, $6, $7)
           RETURNING issued_voucher_id, voucher_code, qr_code, usage_status, issued_at, expires_at`,
          [
            item.program_id,
            item.order_item_id,
            recipientUserId,
            code,
            code,
            item.use_end_at,
            item.discount_amount,
          ]
        );

        issuedVouchersList.push({
          ...voucherRes.rows[0],
          program_name: item.program_name,
        });
      }
    }

    // Bước 5: Cập nhật trạng thái đơn hàng sang PAID và COMPLETED
    await client.query(
      `UPDATE orders 
       SET payment_status = 'PAID', 
           order_status = 'COMPLETED',
           payment_method = 'STRIPE'
       WHERE order_id = $1`,
      [orderId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Thanh toán Stripe thành công. Voucher đã được phát hành.',
      order: {
        order_id: orderId,
        created_at: order.created_at,
        total_amount: Number(order.total_amount),
        payment_method: 'STRIPE',
        payment_status: 'PAID',
        order_status: 'COMPLETED',
        recipient_user_id: recipientUserId,
        vouchers: issuedVouchersList,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * 3. Tra cứu trạng thái đơn hàng thanh toán qua Stripe
 */
export async function getStripeStatus(customerId: number, orderId: number) {
  if (!orderId || isNaN(orderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  const orderRes = await pool.query(
    `SELECT 
       o.order_id,
       o.total_amount,
       o.payment_method,
       o.payment_status,
       o.order_status,
       o.created_at,
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.created_at))::int AS elapsed_seconds
     FROM orders o
     WHERE o.order_id = $1 AND (o.buyer_user_id = $2 OR o.recipient_user_id = $2)`,
    [orderId, customerId]
  );

  if (orderRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy đơn hàng.' };
  }

  const order = orderRes.rows[0];

  return {
    order_id: Number(order.order_id),
    total_amount_vnd: Number(order.total_amount),
    currency: 'VND',
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    order_status: order.order_status,
    elapsed_seconds: Math.max(0, Number(order.elapsed_seconds || 0)),
    created_at: order.created_at,
  };
}
