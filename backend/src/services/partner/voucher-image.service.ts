import pool from '../../config/db.js';
import { deleteR2Image, uploadVoucherImage } from '../storage/r2.service.js';

type VoucherImageRow = {
  image_id: string | number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
};

export type VoucherImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

const mapImage = (row: VoucherImageRow): VoucherImage => ({
  id: String(row.image_id),
  url: row.image_url,
  isPrimary: row.is_primary,
  sortOrder: row.sort_order,
});

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
    const isPrimary = imageCount === 0 || requestedPrimary;
    const sortOrder = requestedSortOrder ?? Number(imageState.rows[0].max_sort_order) + 1;

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

    await deleteR2Image(image.image_url);
    await client.query(
      'DELETE FROM voucher_program_images WHERE image_id = $1 AND program_id = $2',
      [imageId, programId]
    );
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

