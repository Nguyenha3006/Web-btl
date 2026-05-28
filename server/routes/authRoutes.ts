import { Router } from 'express';
import { signUp, login, getMe, verifyNotifications } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/signup', signUp);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.post('/notifications/read', authMiddleware, verifyNotifications);

export default router;
