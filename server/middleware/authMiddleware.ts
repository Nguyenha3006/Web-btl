import { Request, Response, NextFunction } from 'express';
import { db, User } from '../models/db';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
       res.status(401).json({ message: 'Không tìm thấy mã xác thực. Vui lòng đăng nhập.' });
       return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
       res.status(401).json({ message: 'Mã xác thực không hợp lệ.' });
       return;
    }

    // Decode token: We can parse base64 to extract the userId
    let userId = '';
    try {
      userId = Buffer.from(token, 'base64').toString('utf-8');
    } catch (e) {
      // Fallback if token was passed raw
      userId = token;
    }

    const user = await db.users.findById(userId);
    if (!user) {
       res.status(401).json({ message: 'Tài khoản không tồn tại hoặc đã bị xóa.' });
       return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Lỗi xác thực trung gian AuthMiddleware:', error);
    res.status(500).json({ message: 'Lỗi hệ thống trong quá trình xác thực.' });
  }
}
