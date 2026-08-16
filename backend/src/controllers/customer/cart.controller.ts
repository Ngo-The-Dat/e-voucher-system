import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as cartService from '../../services/customer/cart.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const items = await cartService.getCart(customerId);

    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);

    res.status(200).json({
      items,
      subtotal,
      total_items: items.length
    });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const { programId, quantity } = req.body;

    const parsedProgramId = Number(programId);
    const parsedQuantity = quantity !== undefined ? Number(quantity) : 1;

    if (!parsedProgramId || isNaN(parsedProgramId)) {
      res.status(400).json({ message: 'Mã chương trình (programId) không hợp lệ.' });
      return;
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      res.status(400).json({ message: 'Số lượng phải là số dương lớn hơn 0.' });
      return;
    }

    const result = await cartService.addToCart(customerId, parsedProgramId, parsedQuantity);

    res.status(200).json({
      message: result.message || 'Thêm vào giỏ hàng thành công.',
      adjusted: result.adjusted,
      cart_item: result.cart_item
    });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    const parsedCartItemId = Number(cartItemId);
    const parsedQuantity = Number(quantity);

    if (!parsedCartItemId || isNaN(parsedCartItemId)) {
      res.status(400).json({ message: 'Mã mục giỏ hàng (cartItemId) không hợp lệ.' });
      return;
    }

    if (isNaN(parsedQuantity)) {
      res.status(400).json({ message: 'Số lượng không hợp lệ.' });
      return;
    }

    const result = await cartService.updateCartItem(customerId, parsedCartItemId, parsedQuantity);

    res.status(200).json({
      message: result.message || 'Cập nhật số lượng giỏ hàng thành công.',
      adjusted: result.adjusted,
      cart_item: result.cart_item
    });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const { cartItemId } = req.params;

    const parsedCartItemId = Number(cartItemId);
    if (!parsedCartItemId || isNaN(parsedCartItemId)) {
      res.status(400).json({ message: 'Mã mục giỏ hàng (cartItemId) không hợp lệ.' });
      return;
    }

    await cartService.removeFromCart(customerId, parsedCartItemId);

    res.status(200).json({
      message: 'Đã xóa sản phẩm khỏi giỏ hàng thành công.'
    });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user!.id;
    await cartService.clearCart(customerId);

    res.status(200).json({
      message: 'Đã làm sạch giỏ hàng.'
    });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
