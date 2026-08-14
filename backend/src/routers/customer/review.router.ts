import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as reviewController from '../../controllers/customer/review.controller.js';

const router = Router();

// Public: Xem danh sách & thống kê đánh giá của một chương trình voucher
router.get('/program/:programId', reviewController.getProgramReviews);

// Customer protected routes: Gửi phiếu đánh giá & xem lịch sử phiếu của tôi
router.post('/', authenticate, requireRole('CUSTOMER'), reviewController.createReview);
router.get('/my', authenticate, requireRole('CUSTOMER'), reviewController.getMyReviews);

export default router;
