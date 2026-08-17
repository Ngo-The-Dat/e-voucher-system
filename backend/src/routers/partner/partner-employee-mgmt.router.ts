import { Router } from 'express';
import * as partnerEmployeeMgmtController from '../../controllers/partner/partner-employee-mgmt.controller.js';

const router = Router();

// GET  /api/partner/employees
router.get('/', partnerEmployeeMgmtController.getEmployees);

// POST /api/partner/employees
router.post('/', partnerEmployeeMgmtController.createEmployee);

// PUT  /api/partner/employees/:id
router.put('/:id', partnerEmployeeMgmtController.updateEmployee);

// PATCH /api/partner/employees/:id/status
router.patch('/:id/status', partnerEmployeeMgmtController.toggleEmployeeStatus);

export default router;
