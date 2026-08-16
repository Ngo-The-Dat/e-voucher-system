import type { Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as authService from '../../services/customer/auth.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    sendHttpError(res, err);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    sendHttpError(res, err);
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await authService.getMe(userId);
    res.status(200).json(user);
  } catch (err) {
    sendHttpError(res, err);
  }
};
