import { Router } from 'express';
import * as branchController from '../../controllers/partner/branch.controller.js';

const router = Router();

// POST   /api/partner/branches
router.post('/', branchController.createBranch);

// GET    /api/partner/branches
router.get('/', branchController.getBranches);

// GET    /api/partner/branches/:id
router.get('/:id', branchController.getBranchById);

// PUT    /api/partner/branches/:id
router.put('/:id', branchController.updateBranch);

// DELETE /api/partner/branches/:id  (soft delete)
router.delete('/:id', branchController.deleteBranch);

export default router;
