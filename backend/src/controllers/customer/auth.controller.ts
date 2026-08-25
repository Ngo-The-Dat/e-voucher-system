import type { Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as authService from '../../services/customer/auth.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const requestRegistrationOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await authService.requestRegistrationOtp(email);
    res.status(200).json(result);
  } catch (err) {
    sendHttpError(res, err);
  }
};

export const verifyRegistrationOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, challenge_id, code } = req.body;
    const result = await authService.verifyRegistrationOtp(email, challenge_id, code);
    res.status(200).json(result);
  } catch (err) {
    sendHttpError(res, err);
  }
};

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

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    res.status(200).json(result);
  } catch (err) {
    sendHttpError(res, err);
  }
};

export const verifyResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, challenge_id, code } = req.body;
    const result = await authService.verifyPasswordResetOtp(email, challenge_id, code);
    res.status(200).json(result);
  } catch (err) {
    sendHttpError(res, err);
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, challenge_id, new_password } = req.body;
    const result = await authService.resetPassword(email, challenge_id, new_password);
    res.status(200).json(result);
  } catch (err) {
    sendHttpError(res, err);
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { current_password, new_password } = req.body;
    const result = await authService.changePassword(userId, current_password, new_password);
    res.status(200).json(result);
  } catch (err) {
    sendHttpError(res, err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await authService.updateProfile(userId, req.body);
    res.status(200).json(result);
  } catch (err) {
    sendHttpError(res, err);
  }
};
