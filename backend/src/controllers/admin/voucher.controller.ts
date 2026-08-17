import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as voucherService from '../../services/admin/voucher.service.js';

export async function getPendingVouchers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, start_date, end_date, page, limit } = req.query;
    const result = await voucherService.getPendingVouchers({
      search: search as string,
      startDate: start_date as string,
      endDate: end_date as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getPendingVoucherById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isSafeInteger(requestId) || requestId <= 0) {
      res.status(400).json({ message: 'Mã yêu cầu duyệt không hợp lệ.' });
      return;
    }

    const voucher = await voucherService.getPendingVoucherById(requestId);
    res.json(voucher);
  } catch (error: any) {
    if (error.status === 404) {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function approveVoucher(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const requestId = Number(req.params.id);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(requestId) || requestId <= 0) {
      res.status(400).json({ message: 'Mã yêu cầu duyệt không hợp lệ.' });
      return;
    }

    const result = await voucherService.approveVoucher(requestId, adminId);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function rejectVoucher(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const requestId = Number(req.params.id);
    const adminId = req.user?.id || 1;
    const { reason } = req.body;

    if (!Number.isSafeInteger(requestId) || requestId <= 0) {
      res.status(400).json({ message: 'Mã yêu cầu duyệt không hợp lệ.' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ message: 'Vui lòng cung cấp lý do từ chối duyệt voucher.' });
      return;
    }

    const result = await voucherService.rejectVoucher(requestId, adminId, reason);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function getManagedVouchers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, category_id, page, limit } = req.query;
    const result = await voucherService.getManagedVouchers({
      search: search as string,
      status: status as string,
      categoryId: category_id ? Number(category_id) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getManagedVoucherById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const programId = Number(req.params.id);
    if (!Number.isSafeInteger(programId) || programId <= 0) {
      res.status(400).json({ message: 'Mã chương trình voucher không hợp lệ.' });
      return;
    }
    const result = await voucherService.getManagedVoucherById(programId);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function updateVoucherStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const programId = Number(req.params.id);
    const adminId = req.user?.id || 1;
    const { status } = req.body;

    if (!Number.isSafeInteger(programId) || programId <= 0) {
      res.status(400).json({ message: 'Mã chương trình voucher không hợp lệ.' });
      return;
    }

    if (!status || !['PUBLISHED', 'HIDDEN', 'ENDED'].includes(status)) {
      res.status(400).json({ message: 'Trạng thái hiển thị không hợp lệ. Chỉ chấp nhận PUBLISHED, HIDDEN, ENDED.' });
      return;
    }

    const result = await voucherService.updateVoucherDisplayStatus(programId, adminId, status);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}
