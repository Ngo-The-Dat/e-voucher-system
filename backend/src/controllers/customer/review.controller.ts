import { type Request, type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as reviewService from '../../services/customer/review.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const { issuedVoucherId, rating, reviewContent, complaintContent } = req.body;

    if (!issuedVoucherId) {
      res.status(400).json({ message: 'Thiếu mã voucher phát hành (issuedVoucherId).' });
      return;
    }

    const newReview = await reviewService.createCustomerReview({
      issuedVoucherId,
      customerId,
      rating,
      reviewContent,
      complaintContent
    });

    res.status(201).json({
      message: 'Gửi phiếu đánh giá & phản hồi thành công. Cảm ơn ý kiến đóng góp của bạn!',
      review: newReview
    });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const getProgramReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId } = req.params;
    if (!programId) {
      res.status(400).json({ message: 'Thiếu programId.' });
      return;
    }

    const data = await reviewService.getProgramReviews(programId);
    res.status(200).json(data);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const getMyReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const reviews = await reviewService.getCustomerReviews(customerId);
    res.status(200).json(reviews);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
