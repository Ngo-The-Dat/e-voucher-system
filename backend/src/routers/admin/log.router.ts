import { Router } from 'express';
import * as logController from '../../controllers/admin/log.controller.js';

const router = Router();

router.get('/', logController.getLogs);
router.get('/:id', logController.getLogById);

export default router;
