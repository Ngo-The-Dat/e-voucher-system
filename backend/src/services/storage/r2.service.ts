import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

type R2Config = {
  bucket: string;
  publicBaseUrl: string;
  client: S3Client;
};

const EXTENSIONS_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

let cachedConfig: R2Config | null = null;

const getConfig = (): R2Config => {
  if (cachedConfig) return cachedConfig;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, '');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    throw new Error('Cloudflare R2 chưa được cấu hình đầy đủ.');
  }

  let parsedPublicUrl: URL;
  try {
    parsedPublicUrl = new URL(publicBaseUrl);
  } catch {
    throw new Error('R2_PUBLIC_BASE_URL không hợp lệ.');
  }
  if (parsedPublicUrl.protocol !== 'https:') {
    throw new Error('R2_PUBLIC_BASE_URL phải sử dụng HTTPS.');
  }

  cachedConfig = {
    bucket,
    publicBaseUrl,
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
  return cachedConfig;
};

export const uploadVoucherImage = async (
  programId: number,
  file: Express.Multer.File
): Promise<string> => {
  const extension = EXTENSIONS_BY_MIME[file.mimetype];
  if (!extension) {
    throw { status: 400, message: 'Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.' };
  }

  const config = getConfig();
  const objectKey = `vouchers/${programId}/${randomUUID()}.${extension}`;
  await config.client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return `${config.publicBaseUrl}/${objectKey}`;
};

const objectKeyFromPublicUrl = (imageUrl: string, publicBaseUrl: string): string => {
  const base = new URL(`${publicBaseUrl}/`);
  const image = new URL(imageUrl);
  if (image.origin !== base.origin || !image.pathname.startsWith(base.pathname)) {
    throw new Error('URL ảnh không thuộc bucket R2 đã cấu hình.');
  }

  const objectKey = decodeURIComponent(image.pathname.slice(base.pathname.length));
  if (!objectKey || objectKey.includes('..')) {
    throw new Error('Không thể xác định object key của ảnh R2.');
  }
  return objectKey;
};

export const deleteR2Image = async (imageUrl: string): Promise<void> => {
  const config = getConfig();
  const objectKey = objectKeyFromPublicUrl(imageUrl, config.publicBaseUrl);
  await config.client.send(new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
  }));
};

