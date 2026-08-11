import { Router } from 'express';
import * as partnerController from '../../controllers/admin/partner.controller.js';

const router = Router();

// Pending partners routes
router.get('/pending', partnerController.getPendingPartners);
router.get('/pending/:id', partnerController.getPendingPartnerById);

// Managed partners routes
router.get('/manage', partnerController.getManagedPartners);
router.get('/manage/:id', partnerController.getManagedPartnerById);

// Partner actions routes
router.post('/:id/approve', partnerController.approvePartner);
router.post('/:id/reject', partnerController.rejectPartner);
router.post('/:id/request-revision', partnerController.requestRevisionPartner);
router.post('/:id/lock', partnerController.lockPartner);
router.post('/:id/unlock', partnerController.unlockPartner);

// Branch management routes
router.post('/:id/branches', partnerController.createBranch);
router.put('/:id/branches/:branchId', partnerController.updateBranch);
router.delete('/:id/branches/:branchId', partnerController.deleteBranch);

export default router;
