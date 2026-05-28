import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environmental parameters
dotenv.config();

// Imports and setup
import authRoutes from './server/routes/authRoutes';
import deckRoutes from './server/routes/deckRoutes';
import { startCronJobs, performDueCardsScanning } from './server/cron/cronJob';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic middleware configuration
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes registration
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      service: 'hustmemo-core'
    });
  });

  // Manual cron trigger for demonstration and verification purposes
  app.post('/api/cron/trigger', async (req, res) => {
    try {
      console.log('[HustMemo Manual API Trigger] Kích hoạt quét quá hạn bằng tay...');
      await performDueCardsScanning();
      res.json({ message: 'Đã kích hoạt quét thẻ quá hạn thành công! Vui lòng tải lại thông báo.' });
    } catch (e: any) {
      res.status(500).json({ message: 'Không thể kích hoạt quét thẻ: ' + e.message });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/decks', deckRoutes);

  // Initialize automatic background cron automation processes
  startCronJobs();

  // Integrated Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    console.log('[HustMemo Server] Đang tải cấu hình phát triển (Vite Dev Server)...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[HustMemo Server] Đang chạy cấu hình phân phối tĩnh (Production Mode)...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HustMemo Server] Đang chạy thành công trên cổng: http://localhost:${PORT}`);
  });
}

startServer();
