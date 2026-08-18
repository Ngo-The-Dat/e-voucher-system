import type { Request, Response } from 'express';
import * as authService from '../../services/common/auth.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.unifiedLogin(req.body);
    res.status(200).json(result);
  } catch (err) {
    sendHttpError(res, err);
  }
};
