import { type Request, type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as reviewService from '../../services/customer/review.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const checkEligibility = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const programId = Array.isArray(req.params.programId) ? req.params.programId[0] : req.params.programId;
    if (!programId) {
      res.status(400).json({ message: 'Thiếu programId.' });
      return;
    }

    const data = await reviewService.checkCustomerReviewEligibility(customerId, programId);
    res.status(200).json(data);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const { issuedVoucherId, programId, rating, reviewContent, complaintContent } = req.body;

    if (!issuedVoucherId && !programId) {
      res.status(400).json({ message: 'Thiếu mã voucher phát hành (issuedVoucherId) hoặc mã chương trình (programId).' });
      return;
    }

    const newReview = await reviewService.createCustomerReview({
      issuedVoucherId,
      programId,
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
    const programId = Array.isArray(req.params.programId) ? req.params.programId[0] : req.params.programId;
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
