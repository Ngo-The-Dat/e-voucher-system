import type { Response } from 'express';

type HttpError = {
  status?: number;
  message?: string;
  field?: string;
  retry_after?: number;
};

export const sendHttpError = (res: Response, err: unknown): void => {
  const error = err as HttpError;
  const status = Number.isInteger(error.status) && error.status! >= 400 && error.status! < 600
    ? error.status!
    : 500;

  if (status === 500) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
    return;
  }

  res.status(status).json({
    message: error.message || 'Yêu cầu không hợp lệ.',
    ...(error.field ? { field: error.field } : {}),
    ...(Number.isFinite(error.retry_after) ? { retry_after: error.retry_after } : {}),
  });
};
