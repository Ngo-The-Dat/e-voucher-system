import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as partnerService from '../../services/admin/partner.service.js';

export async function getPendingPartners(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, start_date, end_date, page, limit } = req.query;
    const result = await partnerService.getPendingPartners({
      search: search as string,
      status: status as string,
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

export async function getPendingPartnerById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const partner = await partnerService.getPendingPartnerById(partnerId);
    if (!partner) {
      res.status(404).json({ message: 'Không tìm thấy hồ sơ đối tác chờ duyệt' });
      return;
    }

    res.json(partner);
  } catch (error) {
    next(error);
  }
}

export async function approvePartner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const result = await partnerService.approvePartner(partnerId, adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function rejectPartner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const { reason } = req.body;
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const result = await partnerService.rejectPartner(partnerId, reason || '', adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function requestRevisionPartner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const { note } = req.body;
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const result = await partnerService.requestRevisionPartner(partnerId, note || '', adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function getManagedPartners(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, start_date, end_date, page, limit } = req.query;
    const result = await partnerService.getManagedPartners({
      search: search as string,
      status: status as string,
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

export async function getManagedPartnerById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const partner = await partnerService.getManagedPartnerById(partnerId);
    if (!partner) {
      res.status(404).json({ message: 'Không tìm thấy thông tin đối tác' });
      return;
    }

    res.json(partner);
  } catch (error) {
    next(error);
  }
}

export async function lockPartner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const { reason } = req.body;
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ message: 'Vui lòng cung cấp lý do khóa đối tác' });
      return;
    }

    const result = await partnerService.lockPartner(partnerId, reason.trim(), adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function unlockPartner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const result = await partnerService.unlockPartner(partnerId, adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function createBranch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const { branch_name, address, region, phone, status } = req.body;
    if (!branch_name || !branch_name.trim()) {
      res.status(400).json({ message: 'Tên chi nhánh không được để trống' });
      return;
    }
    if (!address || !address.trim()) {
      res.status(400).json({ message: 'Địa chỉ chi nhánh không được để trống' });
      return;
    }

    const branch = await partnerService.createBranch(
      partnerId,
      { branch_name: branch_name.trim(), address: address.trim(), region, phone, status },
      adminId
    );
    res.status(201).json(branch);
  } catch (error: any) {
    if (error.message === 'Đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function updateBranch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const branchId = Number(req.params.branchId);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0 || !Number.isSafeInteger(branchId) || branchId <= 0) {
      res.status(400).json({ message: 'Mã đối tác hoặc mã chi nhánh không hợp lệ' });
      return;
    }

    const { branch_name, address, region, phone, status } = req.body;
    const updated = await partnerService.updateBranch(
      partnerId,
      branchId,
      {
        branch_name: branch_name ? branch_name.trim() : undefined,
        address: address ? address.trim() : undefined,
        region,
        phone,
        status,
      },
      adminId
    );
    res.json(updated);
  } catch (error: any) {
    if (error.message.includes('không tồn tại')) {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function deleteBranch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const branchId = Number(req.params.branchId);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0 || !Number.isSafeInteger(branchId) || branchId <= 0) {
      res.status(400).json({ message: 'Mã đối tác hoặc mã chi nhánh không hợp lệ' });
      return;
    }

    const result = await partnerService.deleteBranch(partnerId, branchId, adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('không tồn tại')) {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

