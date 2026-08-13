import { Router } from 'express';
import * as userController from '../../controllers/admin/user.controller.js';

const router = Router();

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/:id/lock', userController.lockUser);
router.post('/:id/unlock', userController.unlockUser);
router.put('/:id/role', userController.changeUserRole);

export default router;
