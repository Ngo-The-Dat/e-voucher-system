import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

// Partner sub-routers
import partnerAuthRouter from './partner/auth.router.js';
import partnerProfileRouter from './partner/profile.router.js';
import partnerBranchRouter from './partner/branch.router.js';
import partnerVoucherRouter from './partner/voucher.router.js';
import partnerRedeemRouter from './partner/redeem.router.js';
import partnerDashboardRouter from './partner/dashboard.router.js';

// Admin sub-routers
import adminUserRouter from './admin/user.router.js';
import adminLogRouter from './admin/log.router.js';
import adminPartnerRouter from './admin/partner.router.js';
import adminVoucherRouter from './admin/voucher.router.js';
import adminOrderRouter from './admin/order.router.js';
import adminDashboardRouter from './admin/dashboard.router.js';
import {
  categoryRouter as adminCategoryRouter,
  bannerRouter as adminBannerRouter,
  popupRouter as adminPopupRouter,
  articleRouter as adminArticleRouter,
  contentHelperRouter as adminContentHelperRouter,
} from './admin/content.router.js';

import customerAuthRouter from './customer/auth.router.js';
import customerReviewRouter from './customer/review.router.js';
import customerCartRouter from './customer/cart.router.js';
import customerOrderRouter from './customer/order.router.js';
import customerVoucherRouter from './customer/voucher.router.js';
import customerCatalogRouter from './customer/catalog.router.js';

import commonAuthRouter from './common/auth.router.js';
const router = Router();

// ─── Common Auth ─────────────────────────────────────────────────────────────
router.use('/auth', commonAuthRouter);

// ─── Customer Routes ─────────────────────────────────────────────────────────
router.use('/customer/auth', customerAuthRouter);
router.use('/customer/reviews', customerReviewRouter);
router.use('/customer/cart', customerCartRouter);
router.use('/customer/orders', customerOrderRouter);
router.use('/customer/my-vouchers', customerVoucherRouter);
router.use('/customer', customerCatalogRouter);


// ─── Partner Auth (Public) ────────────────────────────────────────────────────
router.use('/partner/auth', partnerAuthRouter);

// ─── Partner Protected Routes ─────────────────────────────────────────────────
router.use('/partner/profile',
  authenticate,
  requireRole('PARTNER'),
  partnerProfileRouter
);

router.use('/partner/branches',
  authenticate,
  requireRole('PARTNER'),
  partnerBranchRouter
);

router.use('/partner/vouchers',
  authenticate,
  requireRole('PARTNER'),
  partnerVoucherRouter
);

// Redeem: cả PARTNER lẫn PARTNER_EMPLOYEE đều dùng được
router.use('/partner/redeem',
  authenticate,
  requireRole('PARTNER', 'PARTNER_EMPLOYEE'),
  partnerRedeemRouter
);

router.use('/partner/dashboard',
  authenticate,
  requireRole('PARTNER'),
  partnerDashboardRouter
);

// ─── Admin Protected Routes ───────────────────────────────────────────────────
router.use('/admin/dashboard',
  authenticate,
  requireRole('ADMIN'),
  adminDashboardRouter
);

router.use('/admin/users',
  authenticate,
  requireRole('ADMIN'),
  adminUserRouter
);

router.use('/admin/logs',
  authenticate,
  requireRole('ADMIN'),
  adminLogRouter
);

router.use('/admin/partners',
  authenticate,
  requireRole('ADMIN'),
  adminPartnerRouter
);

router.use('/admin/vouchers',
  authenticate,
  requireRole('ADMIN'),
  adminVoucherRouter
);

router.use('/admin/orders',
  authenticate,
  requireRole('ADMIN'),
  adminOrderRouter
);

router.use('/admin/categories',
  authenticate,
  requireRole('ADMIN'),
  adminCategoryRouter
);

router.use('/admin/banners',
  authenticate,
  requireRole('ADMIN'),
  adminBannerRouter
);

router.use('/admin/popups',
  authenticate,
  requireRole('ADMIN'),
  adminPopupRouter
);

router.use('/admin/contents',
  authenticate,
  requireRole('ADMIN'),
  adminArticleRouter
);

router.use('/admin/content',
  authenticate,
  requireRole('ADMIN'),
  adminContentHelperRouter
);

export default router;
