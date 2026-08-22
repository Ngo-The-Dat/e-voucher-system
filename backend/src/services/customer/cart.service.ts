import pool from '../../config/db.js';

export interface CartItemResponse {
  cart_item_id: number;
  program_id: number;
  quantity: number;
  program_name: string;
  original_price: number;
  sale_price: number;
  discount_amount: number;
  sale_start_at: string;
  sale_end_at: string;
  use_start_at: string;
  use_end_at: string;
  display_status: string;
  category_name?: string;
  business_name?: string;
  brand_logo?: string | null;
  images?: string[];
  thumbnail?: string;
  available_stock: number;
  line_total: number;
}

export interface AddToCartResult {
  cart_item: CartItemResponse;
  adjusted: boolean;
  message?: string;
}

/**
 * Get available stock for a voucher program
 */
export async function getVoucherAvailableStock(programId: number): Promise<{
  exists: boolean;
  issue_quantity: number;
  sold_count: number;
  available_stock: number;
  display_status: string;
}> {
  const query = `
    SELECT 
      vp.program_id,
      vp.issue_quantity,
      vp.display_status,
      COALESCE((
        SELECT COUNT(iv.issued_voucher_id) 
        FROM issued_vouchers iv 
        WHERE iv.program_id = vp.program_id
      ), 0)::int as sold_count
    FROM voucher_programs vp
    WHERE vp.program_id = $1
  `;
  const result = await pool.query(query, [programId]);
  if (result.rows.length === 0) {
    return { exists: false, issue_quantity: 0, sold_count: 0, available_stock: 0, display_status: '' };
  }

  const row = result.rows[0];
  const issueQuantity = Number(row.issue_quantity);
  const soldCount = Number(row.sold_count);
  const availableStock = Math.max(0, issueQuantity - soldCount);

  return {
    exists: true,
    issue_quantity: issueQuantity,
    sold_count: soldCount,
    available_stock: availableStock,
    display_status: row.display_status
  };
}

/**
 * Get all cart items for a customer
 */
export async function getCart(customerId: number): Promise<CartItemResponse[]> {
  const query = `
    SELECT 
      ci.cart_item_id,
      ci.customer_id,
      ci.program_id,
      ci.quantity,
      vp.program_name,
      vp.original_price,
      vp.sale_price,
      vp.discount_amount,
      vp.sale_start_at,
      vp.sale_end_at,
      vp.use_start_at,
      vp.use_end_at,
      vp.display_status,
      c.category_name,
      p.business_name,
      p.brand_logo as brand_logo,
      (
        SELECT json_agg(vpi.image_url ORDER BY vpi.is_primary DESC, vpi.sort_order ASC)
        FROM voucher_program_images vpi
        WHERE vpi.program_id = vp.program_id
      ) as images,
      (vp.issue_quantity - COALESCE((
        SELECT COUNT(iv.issued_voucher_id) 
        FROM issued_vouchers iv 
        WHERE iv.program_id = vp.program_id
      ), 0))::int as available_stock
    FROM cart_items ci
    JOIN voucher_programs vp ON ci.program_id = vp.program_id
    LEFT JOIN categories c ON c.category_id = vp.category_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    WHERE ci.customer_id = $1
    ORDER BY ci.cart_item_id ASC
  `;

  const result = await pool.query(query, [customerId]);

  const defaultThumbnail = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80";

  return result.rows.map((row) => {
    const salePrice = Number(row.sale_price);
    const quantity = Number(row.quantity);
    const imagesList = Array.isArray(row.images) && row.images.length > 0 ? row.images : [];
    const thumbnail = imagesList.length > 0 ? imagesList[0] : defaultThumbnail;

    return {
      cart_item_id: Number(row.cart_item_id),
      program_id: Number(row.program_id),
      quantity,
      program_name: row.program_name,
      original_price: Number(row.original_price),
      sale_price: salePrice,
      discount_amount: Number(row.discount_amount),
      sale_start_at: row.sale_start_at,
      sale_end_at: row.sale_end_at,
      use_start_at: row.use_start_at,
      use_end_at: row.use_end_at,
      display_status: row.display_status,
      category_name: row.category_name,
      business_name: row.business_name,
      brand_logo: row.brand_logo || null,
      images: imagesList,
      thumbnail: thumbnail,
      available_stock: Math.max(0, Number(row.available_stock)),
      line_total: salePrice * quantity
    };
  });
}

/**
 * Add or increment voucher in customer cart with stock validation
 */
export async function addToCart(
  customerId: number,
  programId: number,
  quantityToAdd: number = 1
): Promise<AddToCartResult> {
  const stockInfo = await getVoucherAvailableStock(programId);
  if (!stockInfo.exists) {
    throw new Error('Chương trình voucher không tồn tại trên hệ thống.');
  }

  if (stockInfo.display_status !== 'PUBLISHED') {
    throw new Error('Chương trình voucher hiện không khả dụng để mua.');
  }

  if (stockInfo.available_stock <= 0) {
    throw new Error('Chương trình voucher này đã hết hàng.');
  }

  // Check existing cart item
  const existingRes = await pool.query(
    `SELECT cart_item_id, quantity FROM cart_items WHERE customer_id = $1 AND program_id = $2`,
    [customerId, programId]
  );

  let targetQuantity = quantityToAdd;
  if (existingRes.rows.length > 0) {
    targetQuantity += Number(existingRes.rows[0].quantity);
  }

  let finalQuantity = targetQuantity;
  let adjusted = false;
  let message: string | undefined;

  if (targetQuantity > stockInfo.available_stock) {
    finalQuantity = stockInfo.available_stock;
    adjusted = true;
    message = `Số lượng trong giỏ hàng đã được điều chỉnh về số lượng khả dụng tối đa (${stockInfo.available_stock}).`;
  }

  if (existingRes.rows.length > 0) {
    const cartItemId = existingRes.rows[0].cart_item_id;
    await pool.query(
      `UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND customer_id = $3`,
      [finalQuantity, cartItemId, customerId]
    );
  } else {
    await pool.query(
      `INSERT INTO cart_items (customer_id, program_id, quantity) VALUES ($1, $2, $3)`,
      [customerId, programId, finalQuantity]
    );
  }

  const cartItems = await getCart(customerId);
  const updatedItem = cartItems.find((item) => item.program_id === programId)!;

  return {
    cart_item: updatedItem,
    adjusted,
    message
  };
}

/**
 * Update cart item quantity with stock validation
 */
export async function updateCartItem(
  customerId: number,
  cartItemId: number,
  newQuantity: number
): Promise<AddToCartResult> {
  if (newQuantity <= 0) {
    await removeFromCart(customerId, cartItemId);
    return {
      cart_item: null as unknown as CartItemResponse,
      adjusted: false,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng.'
    };
  }

  // Find item
  const itemRes = await pool.query(
    `SELECT cart_item_id, program_id FROM cart_items WHERE cart_item_id = $1 AND customer_id = $2`,
    [cartItemId, customerId]
  );

  if (itemRes.rows.length === 0) {
    throw new Error('Sản phẩm giỏ hàng không tồn tại.');
  }

  const programId = Number(itemRes.rows[0].program_id);
  const stockInfo = await getVoucherAvailableStock(programId);

  if (!stockInfo.exists) {
    throw new Error('Chương trình voucher không tồn tại.');
  }

  let finalQuantity = newQuantity;
  let adjusted = false;
  let message: string | undefined;

  if (newQuantity > stockInfo.available_stock) {
    finalQuantity = Math.max(1, stockInfo.available_stock);
    adjusted = true;
    message = `Không đủ hàng. Số lượng đã được điều chỉnh về tồn kho khả dụng (${stockInfo.available_stock}).`;
  }

  await pool.query(
    `UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND customer_id = $3`,
    [finalQuantity, cartItemId, customerId]
  );

  const cartItems = await getCart(customerId);
  const updatedItem = cartItems.find((item) => item.cart_item_id === cartItemId)!;

  return {
    cart_item: updatedItem,
    adjusted,
    message
  };
}

/**
 * Remove an item from customer cart
 */
export async function removeFromCart(customerId: number, cartItemId: number): Promise<void> {
  const result = await pool.query(
    `DELETE FROM cart_items WHERE cart_item_id = $1 AND customer_id = $2`,
    [cartItemId, customerId]
  );

  if (result.rowCount === 0) {
    throw new Error('Sản phẩm giỏ hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn.');
  }
}

/**
 * Clear all items in customer cart
 */
export async function clearCart(customerId: number): Promise<void> {
  await pool.query(`DELETE FROM cart_items WHERE customer_id = $1`, [customerId]);
}
