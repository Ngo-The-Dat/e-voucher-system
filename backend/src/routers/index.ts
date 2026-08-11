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

const router = Router();

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

export default router;
