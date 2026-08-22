import pool from '../../config/db.js';
import crypto from 'node:crypto';

export interface CreateOrderItemInput {
  cart_item_id?: number;
  program_id: number;
  quantity: number;
}

export interface RecipientInfoInput {
  full_name: string;
  email?: string;
  phone?: string;
}

export interface CreateOrderPayload {
  items: CreateOrderItemInput[];
  is_gift?: boolean;
  recipient_info?: RecipientInfoInput;
  payment_method?: string;
  auto_pay?: boolean;
}

export interface GetCustomerOrdersFilter {
  page?: number;
  limit?: number;
  status?: string;
}

/**
 * Generate a unique voucher code format: EV-XXXX-XXXX
 */
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'EV-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Map payment method string to DB enum value
 */
export function normalizePaymentMethod(method?: string): string {
  if (!method) return 'VNPAY';
  const m = method.toUpperCase();
  if (m.includes('PAYPAL')) return 'PAYPAL';
  if (m.includes('STRIPE')) return 'STRIPE';
  if (m.includes('ZALO') || m.includes('ZALOPAY')) return 'ZALOPAY';
  if (m.includes('MOMO')) return 'ZALOPAY';
  if (m.includes('VN') || m.includes('VNPAY')) return 'VNPAY';
  if (m.includes('VISA') || m.includes('MASTER') || m.includes('CREDIT') || m.includes('CARD')) return 'STRIPE';
  if (m.includes('BANK') || m.includes('CHUYỂN') || m.includes('TRANSFER')) return 'BANK_TRANSFER';
  if (m.includes('TIỀN MẶT') || m.includes('CASH')) return 'CASH';
  return 'VNPAY';
}

/**
 * 1. Tạo đơn hàng (mặc định UNPAID + PENDING, hoặc PAID + COMPLETED nếu auto_pay = true)
 */
export async function createCustomerOrder(buyerUserId: number, payload: CreateOrderPayload) {
  const { items, is_gift, recipient_info, payment_method, auto_pay } = payload;
  const dbPaymentMethod = normalizePaymentMethod(payment_method);
  const isPaidNow = Boolean(auto_pay);

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: 'Danh sách sản phẩm tạo đơn hàng không được để trống.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Kiểm tra từng chương trình voucher (tồn kho, ngày bán, trạng thái)
    let totalAmount = 0;
    const validatedItems: Array<{
      program_id: number;
      quantity: number;
      sale_price: number;
      discount_amount: number;
      use_end_at: Date | string;
      program_name: string;
      cart_item_id?: number;
    }> = [];

    for (const item of items) {
      if (!item.program_id || !item.quantity || item.quantity <= 0) {
        throw { status: 400, message: 'Số lượng sản phẩm tạo đơn phải lớn hơn 0.' };
      }

      // Khóa bản ghi voucher program để tính toán tồn kho chính xác (concurrency check)
      const progRes = await client.query(
        `SELECT 
           vp.program_id,
           vp.program_name,
           vp.original_price,
           vp.sale_price,
           vp.discount_amount,
           vp.issue_quantity,
           vp.display_status,
           vp.sale_start_at,
           vp.sale_end_at,
           vp.use_start_at,
           vp.use_end_at,
           (vp.issue_quantity - COALESCE((
             SELECT COUNT(iv.issued_voucher_id)
             FROM issued_vouchers iv
             WHERE iv.program_id = vp.program_id
           ), 0))::int as available_stock
         FROM voucher_programs vp
         WHERE vp.program_id = $1
         FOR UPDATE OF vp`,
        [item.program_id]
      );

      if (progRes.rows.length === 0) {
        throw { status: 404, message: `Chương trình voucher (ID: ${item.program_id}) không tồn tại.` };
      }

      const prog = progRes.rows[0];

      if (prog.display_status !== 'PUBLISHED') {
        throw { status: 400, message: `Chương trình "${prog.program_name}" hiện không khả dụng để bán.` };
      }

      const now = new Date();
      if (prog.sale_start_at && new Date(prog.sale_start_at) > now) {
        throw { status: 400, message: `Chương trình "${prog.program_name}" chưa mở bán.` };
      }

      if (prog.sale_end_at && new Date(prog.sale_end_at) < now) {
        throw { status: 400, message: `Chương trình "${prog.program_name}" đã kết thúc thời gian bán.` };
      }

      const availableStock = Number(prog.available_stock);
      if (availableStock < item.quantity) {
        throw {
          status: 400,
          message: `Chương trình "${prog.program_name}" không đủ tồn kho (còn lại ${availableStock}, yêu cầu ${item.quantity}).`,
        };
      }

      const salePrice = Number(prog.sale_price);
      totalAmount += salePrice * item.quantity;

      validatedItems.push({
        program_id: Number(prog.program_id),
        quantity: item.quantity,
        sale_price: salePrice,
        discount_amount: Number(prog.discount_amount),
        use_end_at: prog.use_end_at,
        program_name: prog.program_name,
        cart_item_id: item.cart_item_id,
      });
    }

    // 2. Xác định người nhận (Recipient) nếu là quà tặng
    let recipientUserId = buyerUserId;
    if (is_gift && recipient_info && (recipient_info.email || recipient_info.phone)) {
      const email = recipient_info.email ? recipient_info.email.trim() : null;
      const phone = recipient_info.phone ? recipient_info.phone.trim() : null;
      const fullName = recipient_info.full_name ? recipient_info.full_name.trim() : 'Người nhận quà';

      let userCheckQuery = `SELECT user_id FROM users WHERE (1=0`;
      const userCheckParams: any[] = [];
      let paramIdx = 1;

      if (email) {
        userCheckQuery += ` OR email = $${paramIdx}`;
        userCheckParams.push(email);
        paramIdx++;
      }
      if (phone) {
        userCheckQuery += ` OR phone = $${paramIdx}`;
        userCheckParams.push(phone);
        paramIdx++;
      }
      userCheckQuery += `) AND role = 'CUSTOMER' LIMIT 1`;

      const recipientRes = await client.query(userCheckQuery, userCheckParams);

      if (recipientRes.rows.length > 0) {
        recipientUserId = Number(recipientRes.rows[0].user_id);
      } else {
        // Tạo tài khoản mặc định cho người nhận
        const dummyPasswordHash = crypto.randomBytes(16).toString('hex');
        const defaultEmail = email || `gift_${Date.now()}@evoucher.local`;
        const newUserRes = await client.query(
          `INSERT INTO users (email, phone, full_name, role, status, password_hash)
           VALUES ($1, $2, $3, 'CUSTOMER', 'ACTIVE', $4)
           RETURNING user_id`,
          [defaultEmail, phone, fullName, dummyPasswordHash]
        );
        recipientUserId = Number(newUserRes.rows[0].user_id);
      }
    }

    // 3. Tạo Đơn hàng (`orders`)
    const initialPaymentStatus = isPaidNow ? 'PAID' : 'UNPAID';
    const initialOrderStatus = isPaidNow ? 'COMPLETED' : 'PENDING';

    const orderRes = await client.query(
      `INSERT INTO orders (
         buyer_user_id,
         recipient_user_id,
         total_amount,
         payment_method,
         payment_status,
         order_status,
         created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING order_id, created_at, total_amount, payment_method, payment_status, order_status`,
      [buyerUserId, recipientUserId, totalAmount, dbPaymentMethod, initialPaymentStatus, initialOrderStatus]
    );

    const order = orderRes.rows[0];
    const orderId = Number(order.order_id);

    // 4. Tạo `order_items` và phát hành `issued_vouchers` (nếu đã thanh toán)
    const issuedVouchersList: any[] = [];

    for (const item of validatedItems) {
      const orderItemRes = await client.query(
        `INSERT INTO order_items (order_id, program_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)
         RETURNING order_item_id`,
        [orderId, item.program_id, item.quantity, item.sale_price]
      );
      const orderItemId = Number(orderItemRes.rows[0].order_item_id);

      if (isPaidNow) {
        for (let i = 0; i < item.quantity; i++) {
          let code = generateVoucherCode();
          let isUnique = false;
          let attempts = 0;
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
              orderItemId,
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

      if (item.cart_item_id) {
        await client.query(
          `DELETE FROM cart_items WHERE cart_item_id = $1 AND customer_id = $2`,
          [item.cart_item_id, buyerUserId]
        );
      } else {
        await client.query(
          `DELETE FROM cart_items WHERE customer_id = $1 AND program_id = $2`,
          [buyerUserId, item.program_id]
        );
      }
    }

    await client.query('COMMIT');

    const nowIso = new Date().toISOString();

    return {
      success: true,
      message: isPaidNow
        ? 'Tạo đơn hàng và phát hành voucher thành công.'
        : 'Tạo đơn hàng thành công. Vui lòng tiến hành thanh toán.',
      order: {
        order_id: orderId,
        created_at: nowIso,
        elapsed_seconds: 0,
        total_amount: Number(order.total_amount),
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_status: order.order_status,
        is_gift: Boolean(is_gift),
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
 * 2. Thanh toán đơn hàng (Chuyển UNPAID / PENDING sang PAID / COMPLETED và phát hành voucher)
 */
export async function payCustomerOrder(customerId: number, orderId: number, paymentMethod?: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Khóa đơn hàng để xử lý thanh toán
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

    if (order.order_status === 'CANCELLED') {
      throw { status: 400, message: 'Không thể thanh toán đơn hàng đã bị hủy.' };
    }

    // Kiểm tra thời hạn thanh toán 5 phút (300 giây)
    const elapsedSeconds = Number(order.elapsed_seconds || 0);
    if (elapsedSeconds > 300) {
      // Đơn hàng quá 5 phút chưa thanh toán -> Hủy đơn
      await client.query(
        `UPDATE orders SET order_status = 'CANCELLED' WHERE order_id = $1`,
        [orderId]
      );
      await client.query('COMMIT');
      throw {
        status: 400,
        message: 'Đơn hàng đã hết hạn thời gian thanh toán (5 phút). Vui lòng tạo lại đơn hàng mới.',
      };
    }

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

    // Lấy các order_items và thông tin voucher program tương ứng
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
    const dbPaymentMethod = paymentMethod ? normalizePaymentMethod(paymentMethod) : order.payment_method;
    const issuedVouchersList: any[] = [];

    for (const item of itemsRes.rows) {
      const quantity = Number(item.quantity);
      for (let i = 0; i < quantity; i++) {
        let code = generateVoucherCode();
        let isUnique = false;
        let attempts = 0;
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

    // Cập nhật trạng thái đơn hàng thành PAID / COMPLETED
    await client.query(
      `UPDATE orders 
       SET payment_status = 'PAID', 
           order_status = 'COMPLETED',
           payment_method = $1
       WHERE order_id = $2`,
      [dbPaymentMethod, orderId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Thanh toán đơn hàng và phát hành voucher thành công.',
      order: {
        order_id: orderId,
        created_at: order.created_at,
        total_amount: Number(order.total_amount),
        payment_method: dbPaymentMethod,
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
 * 3. Lấy danh sách Đơn hàng của Khách hàng
 */
export async function getCustomerOrders(customerId: number, filter: GetCustomerOrdersFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(filter.limit) || 10));
  const offset = (page - 1) * limit;

  const countRes = await pool.query(
    `SELECT COUNT(*) as total FROM orders WHERE buyer_user_id = $1 OR recipient_user_id = $1`,
    [customerId]
  );
  const total = parseInt(countRes.rows[0].total, 10);

  const dataQuery = `
    SELECT 
      o.order_id,
      o.created_at,
      EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.created_at))::int as elapsed_seconds,
      o.total_amount,
      o.payment_method,
      o.payment_status,
      o.order_status,
      o.buyer_user_id,
      o.recipient_user_id,
      ub.full_name as buyer_name,
      ur.full_name as recipient_name,
      (
        SELECT json_agg(json_build_object(
          'order_item_id', oi.order_item_id,
          'program_id', oi.program_id,
          'program_name', vp.program_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'line_total', oi.quantity * oi.unit_price
        ) ORDER BY oi.order_item_id ASC)
        FROM order_items oi
        JOIN voucher_programs vp ON vp.program_id = oi.program_id
        WHERE oi.order_id = o.order_id
      ) as items
    FROM orders o
    JOIN users ub ON ub.user_id = o.buyer_user_id
    LEFT JOIN users ur ON ur.user_id = o.recipient_user_id
    WHERE o.buyer_user_id = $1 OR o.recipient_user_id = $1
    ORDER BY o.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const dataRes = await pool.query(dataQuery, [customerId, limit, offset]);

  return {
    orders: dataRes.rows.map((row) => ({
      ...row,
      elapsed_seconds: Math.max(0, Number(row.elapsed_seconds || 0)),
      total_amount: Number(row.total_amount),
      items: row.items || [],
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * 4. Chi tiết 1 đơn hàng của Khách hàng
 */
export async function getCustomerOrderById(customerId: number, orderId: number) {
  const orderQuery = `
    SELECT 
      o.order_id,
      o.created_at,
      EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.created_at))::int as elapsed_seconds,
      o.total_amount,
      o.payment_method,
      o.payment_status,
      o.order_status,
      o.buyer_user_id,
      o.recipient_user_id,
      ub.full_name as buyer_name,
      ub.email as buyer_email,
      ur.full_name as recipient_name,
      ur.email as recipient_email,
      ur.phone as recipient_phone
    FROM orders o
    JOIN users ub ON ub.user_id = o.buyer_user_id
    LEFT JOIN users ur ON ur.user_id = o.recipient_user_id
    WHERE o.order_id = $1 AND (o.buyer_user_id = $2 OR o.recipient_user_id = $2)
  `;
  const orderRes = await pool.query(orderQuery, [orderId, customerId]);

  if (orderRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền xem.' };
  }

  const order = orderRes.rows[0];

  const itemsQuery = `
    SELECT 
      oi.order_item_id,
      oi.program_id,
      oi.quantity,
      oi.unit_price,
      vp.program_name,
      vp.original_price,
      p.business_name,
      (
        SELECT json_agg(json_build_object(
          'issued_voucher_id', iv.issued_voucher_id,
          'voucher_code', iv.voucher_code,
          'usage_status', iv.usage_status,
          'issued_at', iv.issued_at,
          'expires_at', iv.expires_at,
          'used_at', iv.used_at
        ) ORDER BY iv.issued_voucher_id ASC)
        FROM issued_vouchers iv
        WHERE iv.order_item_id = oi.order_item_id
      ) as vouchers
    FROM order_items oi
    JOIN voucher_programs vp ON vp.program_id = oi.program_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    WHERE oi.order_id = $1
    ORDER BY oi.order_item_id ASC
  `;
  const itemsRes = await pool.query(itemsQuery, [orderId]);

  return {
    ...order,
    elapsed_seconds: Math.max(0, Number(order.elapsed_seconds || 0)),
    total_amount: Number(order.total_amount),
    items: itemsRes.rows.map((item) => ({
      ...item,
      unit_price: Number(item.unit_price),
      original_price: Number(item.original_price),
      vouchers: item.vouchers || [],
    })),
  };
}
