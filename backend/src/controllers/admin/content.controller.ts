import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as contentService from '../../services/admin/content.service.js';

// ─── 1. Categories Controller ────────────────────────────────────────────────

export async function getCategories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, page, limit } = req.query;
    const result = await contentService.getCategories({
      search: search as string,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCategoryById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Mã danh mục không hợp lệ.' });
      return;
    }
    const category = await contentService.getCategoryById(id);
    res.json(category);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function createCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const { category_name, description, status } = req.body;

    if (!category_name || !category_name.trim()) {
      res.status(400).json({ message: 'Vui lòng nhập tên danh mục.' });
      return;
    }

    const result = await contentService.createCategory(adminId, {
      category_name,
      description,
      status,
    });
    res.status(201).json(result);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ message: 'Tên danh mục này đã tồn tại trên hệ thống.' });
      return;
    }
    next(error);
  }
}

export async function updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Mã danh mục không hợp lệ.' });
      return;
    }

    const { category_name, description, status } = req.body;

    if (category_name !== undefined && !category_name.trim()) {
      res.status(400).json({ message: 'Tên danh mục không được để trống.' });
      return;
    }

    const result = await contentService.updateCategory(adminId, id, {
      category_name,
      description,
      status,
    });
    res.json(result);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ message: 'Tên danh mục này đã tồn tại trên hệ thống.' });
      return;
    }
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Mã danh mục không hợp lệ.' });
      return;
    }

    const result = await contentService.deleteCategory(adminId, id);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function assignVouchersToCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const categoryId = Number(req.params.id);

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      res.status(400).json({ message: 'Mã danh mục không hợp lệ.' });
      return;
    }

    const { program_ids } = req.body;
    if (!Array.isArray(program_ids)) {
      res.status(400).json({ message: 'Danh sách mã chương trình voucher không hợp lệ.' });
      return;
    }

    const result = await contentService.assignVouchersToCategory(
      adminId,
      categoryId,
      program_ids.map(Number)
    );
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function removeVoucherFromCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const categoryId = Number(req.params.id);
    const programId = Number(req.params.programId);

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      res.status(400).json({ message: 'Mã danh mục không hợp lệ.' });
      return;
    }

    if (!Number.isSafeInteger(programId) || programId <= 0) {
      res.status(400).json({ message: 'Mã chương trình voucher không hợp lệ.' });
      return;
    }

    const result = await contentService.removeVoucherFromCategory(adminId, categoryId, programId);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

// ─── 2. Banners Controller ──────────────────────────────────────────────────

export async function getBanners(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, display_position, page, limit } = req.query;
    const result = await contentService.getBanners({
      search: search as string,
      status: status as string,
      displayPosition: display_position as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getBannerById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Mã banner không hợp lệ.' });
      return;
    }
    const banner = await contentService.getBannerById(id);
    res.json(banner);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function createBanner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const {
      program_id,
      title,
      image_url,
      target_url,
      display_position,
      display_from,
      display_to,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ message: 'Vui lòng nhập tiêu đề banner.' });
      return;
    }
    if (!program_id) {
      res.status(400).json({ message: 'Vui lòng chọn chương trình voucher liên kết.' });
      return;
    }
    if (!image_url || !image_url.trim()) {
      res.status(400).json({ message: 'Vui lòng nhập đường dẫn hình ảnh banner.' });
      return;
    }

    const result = await contentService.createBanner(adminId, {
      program_id: Number(program_id),
      title,
      image_url,
      target_url,
      display_position,
      display_from,
      display_to,
      status,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateBanner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Mã banner không hợp lệ.' });
      return;
    }

    const {
      program_id,
      title,
      image_url,
      target_url,
      display_position,
      display_from,
      display_to,
      status,
    } = req.body;

    const result = await contentService.updateBanner(adminId, id, {
      program_id: program_id !== undefined ? Number(program_id) : undefined,
      title,
      image_url,
      target_url,
      display_position,
      display_from,
      display_to,
      status,
    });
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function deleteBanner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Mã banner không hợp lệ.' });
      return;
    }

    const result = await contentService.deleteBanner(adminId, id);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

// ─── 3. Popups Controller ───────────────────────────────────────────────────

export async function getPopups(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, page, limit } = req.query;
    const result = await contentService.getPopups({
      search: search as string,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getPopupById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Mã popup không hợp lệ.' });
      return;
    }
    const popup = await contentService.getPopupById(id);
    res.json(popup);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function createPopup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const {
      program_id,
      title,
      content,
      target_url,
      image_url,
      start_at,
      end_at,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ message: 'Vui lòng nhập tiêu đề popup.' });
      return;
    }
    if (!program_id) {
      res.status(400).json({ message: 'Vui lòng chọn chương trình voucher liên kết.' });
      return;
    }

    const result = await contentService.createPopup(adminId, {
      program_id: Number(program_id),
      title,
      content,
      target_url,
      image_url,
      start_at,
      end_at,
      status,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updatePopup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Mã popup không hợp lệ.' });
      return;
    }

    const {
      program_id,
      title,
      content,
      target_url,
      image_url,
      start_at,
      end_at,
      status,
    } = req.body;

    const result = await contentService.updatePopup(adminId, id, {
      program_id: program_id !== undefined ? Number(program_id) : undefined,
      title,
      content,
      target_url,
      image_url,
      start_at,
      end_at,
      status,
    });
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function deletePopup(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Mã popup không hợp lệ.' });
      return;
    }

    const result = await contentService.deletePopup(adminId, id);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

// ─── 4. Contents / Articles Controller ──────────────────────────────────────

export async function getContents(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, content_type, page, limit } = req.query;
    const result = await contentService.getContents({
      search: search as string,
      status: status as string,
      contentType: content_type as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getContentById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Mã bài viết/chính sách không hợp lệ.' });
      return;
    }
    const content = await contentService.getContentById(id);
    res.json(content);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function createContent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const { program_id, title, body, content_type, status } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ message: 'Vui lòng nhập tiêu đề bài viết.' });
      return;
    }
    if (!body || !body.trim()) {
      res.status(400).json({ message: 'Vui lòng nhập nội dung bài viết.' });
      return;
    }
    if (!program_id) {
      res.status(400).json({ message: 'Vui lòng chọn chương trình voucher liên kết.' });
      return;
    }

    const result = await contentService.createContent(adminId, {
      program_id: Number(program_id),
      title,
      body,
      content_type,
      status,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateContent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Mã bài viết/chính sách không hợp lệ.' });
      return;
    }

    const { program_id, title, body, content_type, status } = req.body;

    const result = await contentService.updateContent(adminId, id, {
      program_id: program_id !== undefined ? Number(program_id) : undefined,
      title,
      body,
      content_type,
      status,
    });
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function deleteContent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id || 1;
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Mã bài viết/chính sách không hợp lệ.' });
      return;
    }

    const result = await contentService.deleteContent(adminId, id);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

// ─── 5. Voucher Options Helper Controller ────────────────────────────────────

export async function getVoucherProgramOptions(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const options = await contentService.getVoucherProgramOptions();
    res.json({ options });
  } catch (error) {
    next(error);
  }
}
