import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../models/db';

export const signUp = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
       res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin: Họ tên, Email, Mật khẩu.' });
       return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await db.users.findOne({ email: normalizedEmail });

    if (existingUser) {
       res.status(400).json({ message: 'Email này đã được sử dụng. Vui lòng chọn email khác.' });
       return;
    }

    // Simplistic password hash (simulated for container environment)
    const passwordHash = Buffer.from(password).toString('base64');

    const newUser = await db.users.create({
      email: normalizedEmail,
      passwordHash,
      name: name.trim()
    });

    const token = Buffer.from(newUser._id).toString('base64');

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Lỗi khi đăng ký tài khoản:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi đăng ký.' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
       res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ Email và Mật khẩu.' });
       return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.users.findOne({ email: normalizedEmail });

    if (!user) {
       res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác.' });
       return;
    }

    const passwordHash = Buffer.from(password).toString('base64');
    if (user.passwordHash !== passwordHash) {
       res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác.' });
       return;
    }

    const token = Buffer.from(user._id).toString('base64');

    res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi đăng nhập.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Chưa xác thực người dùng.' });
       return;
    }

    res.status(200).json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        createdAt: req.user.createdAt,
        notifications: req.user.notifications
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const verifyNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Chưa xác thực người dùng.' });
       return;
    }

    // Mark notifications as read
    const user = req.user;
    const updatedNotifications = user.notifications.map(n => ({ ...n, read: true }));
    await db.users.findByIdAndUpdate(user._id, { notifications: updatedNotifications });

    res.json({ message: 'Đã đánh dấu thông báo là đã đọc.' });
  } catch (error) {
    console.error('Lỗi khi làm sạch thông báo:', error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};
