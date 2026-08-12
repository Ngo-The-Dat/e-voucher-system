import { Router } from 'express';
import * as contentController from '../../controllers/admin/content.controller.js';

// 1. Categories Router
export const categoryRouter = Router();
categoryRouter.get('/', contentController.getCategories);
categoryRouter.get('/:id', contentController.getCategoryById);
categoryRouter.post('/', contentController.createCategory);
categoryRouter.put('/:id', contentController.updateCategory);
categoryRouter.delete('/:id', contentController.deleteCategory);
categoryRouter.post('/:id/vouchers', contentController.assignVouchersToCategory);
categoryRouter.delete('/:id/vouchers/:programId', contentController.removeVoucherFromCategory);

// 2. Banners Router
export const bannerRouter = Router();
bannerRouter.get('/', contentController.getBanners);
bannerRouter.get('/:id', contentController.getBannerById);
bannerRouter.post('/', contentController.createBanner);
bannerRouter.put('/:id', contentController.updateBanner);
bannerRouter.delete('/:id', contentController.deleteBanner);

// 3. Popups Router
export const popupRouter = Router();
popupRouter.get('/', contentController.getPopups);
popupRouter.get('/:id', contentController.getPopupById);
popupRouter.post('/', contentController.createPopup);
popupRouter.put('/:id', contentController.updatePopup);
popupRouter.delete('/:id', contentController.deletePopup);

// 4. Contents / Articles Router
export const articleRouter = Router();
articleRouter.get('/', contentController.getContents);
articleRouter.get('/:id', contentController.getContentById);
articleRouter.post('/', contentController.createContent);
articleRouter.put('/:id', contentController.updateContent);
articleRouter.delete('/:id', contentController.deleteContent);

// 5. Content Options Helper Router
export const contentHelperRouter = Router();
contentHelperRouter.get('/voucher-options', contentController.getVoucherProgramOptions);

export default {
  categoryRouter,
  bannerRouter,
  popupRouter,
  articleRouter,
  contentHelperRouter,
};
