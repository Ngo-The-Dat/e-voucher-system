/**
 * @file voucher-image.service.ts
 * @description Service quản lý lưu trữ và thao tác với hình ảnh chương trình voucher:
 * upload file lên Cloudflare R2 (S3-compatible), lưu URL và metadata vào bảng `voucher_program_images`,
 * đồng bộ trạng thái ảnh chính (`is_primary`), sắp xếp thứ tự và dọn dẹp file R2 khi xóa.
 */

import pool from '../../config/db.js';
import { deleteR2Image, uploadVoucherImage } from '../storage/r2.service.js';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

/** Kiểu dữ liệu một dòng trong bảng voucher_program_images */
type VoucherImageRow = {
  image_id: string | number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
};

/** Kiểu dữ liệu hình ảnh voucher trả về cho frontend */
export type VoucherImage = {
  id: string;          // ID ảnh dạng chuỗi
  url: string;         // Đường dẫn URL ảnh công khai trên R2
  isPrimary: boolean;  // Có phải là ảnh đại diện chính không
  sortOrder: number;   // Thứ tự hiển thị
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Ánh xạ dữ liệu thô từ database sang format frontend */
const mapImage = (row: VoucherImageRow): VoucherImage => ({
  id: String(row.image_id),
  url: row.image_url,
  isPrimary: row.is_primary,
  sortOrder: row.sort_order,
});

/**
 * Khóa dòng bản ghi voucher `FOR UPDATE` và kiểm tra điều kiện cho phép sửa đổi ảnh:
 * - Voucher phải tồn tại và thuộc về đối tác đang thao tác.
 * - Trạng thái của voucher phải là `DRAFT`.
 * 
 * @param client Database client đang trong transaction
 * @param programId ID chương trình voucher
 * @param partnerId User ID của đối tác
 */
const lockEditableVoucher = async (
  client: { query: (text: string, values?: unknown[]) => Promise<{ rows: any[] }> },
  programId: number,
  partnerId: number
) => {
  const result = await client.query(
    `SELECT program_id, display_status
     FROM voucher_programs
     WHERE program_id = $1 AND partner_id = $2
     FOR UPDATE`,
    [programId, partnerId]
  );
  const voucher = result.rows[0];
  if (!voucher) {
    throw { status: 404, message: 'Voucher không tồn tại hoặc không thuộc về bạn.' };
  }
  if (voucher.display_status !== 'DRAFT') {
    throw { status: 400, message: 'Chỉ có thể chỉnh sửa ảnh khi voucher ở trạng thái DRAFT.' };
  }
};

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Lấy toàn bộ danh sách hình ảnh của một chương trình voucher.
 * Sắp xếp: ảnh chính (is_primary = true) lên đầu tiên, sau đó theo `sort_order` tăng dần.
 * 
 * @param programId ID chương trình voucher
 * @returns Danh sách hình ảnh
 */
export const getVoucherImages = async (programId: number): Promise<VoucherImage[]> => {
  const result = await pool.query(
    `SELECT image_id, image_url, is_primary, sort_order
     FROM voucher_program_images
     WHERE program_id = $1
     ORDER BY is_primary DESC, sort_order ASC, image_id ASC`,
    [programId]
  );
  return result.rows.map(mapImage);
};

/**
 * Upload ảnh mới và thêm vào bộ sưu tập của voucher.
 * 
 * @description
 * 1. Kiểm tra trạng thái DRAFT của voucher.
 * 2. Upload file stream lên Cloudflare R2 bucket.
 * 3. Mở transaction: Khóa voucher, tính toán `sort_order` tiếp theo.
 * 4. Nếu là ảnh đầu tiên hoặc được yêu cầu `is_primary = true`, cập nhật các ảnh trước đó về `is_primary = false`.
 * 5. Thêm bản ghi mới vào `voucher_program_images`.
 * 6. Nếu database rollback, tự động gọi `deleteR2Image` để dọn dẹp file rác trên R2.
 * 
 * @param programId ID voucher
 * @param partnerId User ID đối tác
 * @param file File ảnh từ Multer
 * @param requestedPrimary Có đặt làm ảnh chính hay không
 * @param requestedSortOrder Vị trí sắp xếp tùy chọn
 * @returns Thông tin ảnh vừa thêm
 */
export const addVoucherImage = async (
  programId: number,
  partnerId: number,
  file: Express.Multer.File,
  requestedPrimary: boolean,
  requestedSortOrder?: number
): Promise<VoucherImage> => {
  const ownership = await pool.query(
    `SELECT display_status FROM voucher_programs
     WHERE program_id = $1 AND partner_id = $2`,
    [programId, partnerId]
  );
  if (!ownership.rows[0]) {
    throw { status: 404, message: 'Voucher không tồn tại hoặc không thuộc về bạn.' };
  }
  if (ownership.rows[0].display_status !== 'DRAFT') {
    throw { status: 400, message: 'Chỉ có thể chỉnh sửa ảnh khi voucher ở trạng thái DRAFT.' };
  }

  // Upload file lên Cloudflare R2
  const imageUrl = await uploadVoucherImage(programId, file);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await lockEditableVoucher(client, programId, partnerId);

    const imageState = await client.query(
      `SELECT COUNT(*)::int AS image_count,
              COALESCE(MAX(sort_order), -1)::int AS max_sort_order
       FROM voucher_program_images
       WHERE program_id = $1`,
      [programId]
    );
    const imageCount = Number(imageState.rows[0].image_count);
    // Nếu chưa có ảnh nào thì ảnh mới mặc định là ảnh chính
    const isPrimary = imageCount === 0 || requestedPrimary;
    const sortOrder = requestedSortOrder ?? Number(imageState.rows[0].max_sort_order) + 1;

    // Đặt lại các ảnh khác về non-primary nếu ảnh này là ảnh chính
    if (isPrimary) {
      await client.query(
        'UPDATE voucher_program_images SET is_primary = FALSE WHERE program_id = $1 AND is_primary = TRUE',
        [programId]
      );
    }

    const inserted = await client.query(
      `INSERT INTO voucher_program_images (program_id, image_url, is_primary, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING image_id, image_url, is_primary, sort_order`,
      [programId, imageUrl, isPrimary, sortOrder]
    );
    await client.query('COMMIT');
    return mapImage(inserted.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    // Dọn dẹp ảnh trên R2 nếu ghi database thất bại
    try {
      await deleteR2Image(imageUrl);
    } catch (cleanupError) {
      console.error('Không thể dọn ảnh R2 sau khi lưu database thất bại:', cleanupError);
    }
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Đặt một ảnh làm ảnh đại diện chính của voucher.
 * 
 * @param programId ID voucher
 * @param imageId ID ảnh muốn đặt làm chính
 * @param partnerId User ID đối tác
 * @returns Danh sách ảnh sau cập nhật
 */
export const setPrimaryImage = async (
  programId: number,
  imageId: number,
  partnerId: number
): Promise<VoucherImage[]> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await lockEditableVoucher(client, programId, partnerId);
    const target = await client.query(
      `SELECT image_id FROM voucher_program_images
       WHERE image_id = $1 AND program_id = $2`,
      [imageId, programId]
    );
    if (!target.rows[0]) {
      throw { status: 404, message: 'Không tìm thấy ảnh của voucher.' };
    }
    await client.query(
      'UPDATE voucher_program_images SET is_primary = FALSE WHERE program_id = $1 AND is_primary = TRUE',
      [programId]
    );
    await client.query(
      'UPDATE voucher_program_images SET is_primary = TRUE WHERE image_id = $1 AND program_id = $2',
      [imageId, programId]
    );
    await client.query('COMMIT');
    return getVoucherImages(programId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Cập nhật thứ tự sắp xếp (sort_order) cho danh sách ảnh của voucher.
 * 
 * @param programId ID voucher
 * @param partnerId User ID đối tác
 * @param imageIds Mảng ID ảnh theo thứ tự mới
 * @returns Danh sách ảnh sau khi sắp xếp
 */
export const reorderVoucherImages = async (
  programId: number,
  partnerId: number,
  imageIds: number[]
): Promise<VoucherImage[]> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await lockEditableVoucher(client, programId, partnerId);
    const current = await client.query(
      'SELECT image_id FROM voucher_program_images WHERE program_id = $1 FOR UPDATE',
      [programId]
    );
    const currentIds = current.rows.map((row) => Number(row.image_id)).sort((a, b) => a - b);
    const requestedIds = [...imageIds].sort((a, b) => a - b);
    if (currentIds.length !== requestedIds.length ||
        currentIds.some((id, index) => id !== requestedIds[index])) {
      throw { status: 400, message: 'Danh sách ảnh sắp xếp không khớp với gallery hiện tại.' };
    }

    for (const [sortOrder, imageId] of imageIds.entries()) {
      await client.query(
        `UPDATE voucher_program_images SET sort_order = $1
         WHERE image_id = $2 AND program_id = $3`,
        [sortOrder, imageId, programId]
      );
    }
    await client.query('COMMIT');
    return getVoucherImages(programId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Xóa một ảnh khỏi voucher và xóa file trên R2 storage.
 * Nếu ảnh bị xóa là ảnh chính (`is_primary`), hệ thống sẽ tự động gán ảnh kế tiếp làm ảnh chính mới.
 * 
 * @param programId ID voucher
 * @param imageId ID ảnh cần xóa
 * @param partnerId User ID đối tác
 * @returns Danh sách ảnh còn lại
 */
export const deleteVoucherImage = async (
  programId: number,
  imageId: number,
  partnerId: number
): Promise<VoucherImage[]> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await lockEditableVoucher(client, programId, partnerId);
    const target = await client.query(
      `SELECT image_url, is_primary FROM voucher_program_images
       WHERE image_id = $1 AND program_id = $2
       FOR UPDATE`,
      [imageId, programId]
    );
    const image = target.rows[0] as { image_url: string; is_primary: boolean } | undefined;
    if (!image) {
      throw { status: 404, message: 'Không tìm thấy ảnh của voucher.' };
    }

    // Xóa file trên Cloudflare R2
    await deleteR2Image(image.image_url);

    // Xóa bản ghi trong database
    await client.query(
      'DELETE FROM voucher_program_images WHERE image_id = $1 AND program_id = $2',
      [imageId, programId]
    );

    // Nếu ảnh vừa xóa là ảnh chính thì tự động chọn ảnh đầu tiên còn lại làm ảnh chính
    if (image.is_primary) {
      await client.query(
        `UPDATE voucher_program_images SET is_primary = TRUE
         WHERE image_id = (
           SELECT image_id FROM voucher_program_images
           WHERE program_id = $1
           ORDER BY sort_order ASC, image_id ASC
           LIMIT 1
         )`,
        [programId]
      );
    }
    await client.query('COMMIT');
    return getVoucherImages(programId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
