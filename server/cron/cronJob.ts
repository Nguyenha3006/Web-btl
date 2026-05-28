import cron from 'node-cron';
import { db } from '../models/db';

export function startCronJobs() {
  console.log('[HustMemo Cron] Khởi chạy hàng đợi dịch vụ kiểm lịch chạy ngầm...');

  // 1. Core daily job (runs exactly at midnight 00:00 every day)
  cron.schedule('0 0 * * *', async () => {
    console.log('[HustMemo Cron] Đang chạy quét định kỳ hằng ngày lúc 00:00...');
    await performDueCardsScanning();
  });

  // 2. Demonstration job (runs every 5 minutes so users can see actual activity logs in console)
  cron.schedule('*/5 * * * *', async () => {
    console.log('[HustMemo Cron Debug] Đang định kỳ quét nhanh tối ưu hóa trạng thái học tập...');
    await performDueCardsScanning();
  });
}

export async function performDueCardsScanning() {
  try {
    const cards = await db.cards.find();
    const now = new Date();
    
    // Filter cards past due for review
    const dueCards = cards.filter(c => new Date(c.nextReview) <= now);
    if (dueCards.length === 0) {
      console.log('[HustMemo Cron] Không phát hiện thấy thẻ nào quá hạn ôn tập.');
      return;
    }

    console.log(`[HustMemo Cron] Phát hiện thấy ${dueCards.length} thẻ quá hạn cần ôn tập.`);

    // Group due cards by deck owner (UserId)
    const cardsByOwner: Record<string, number> = {};

    for (const card of dueCards) {
      const deck = await db.decks.findById(card.deckId);
      if (deck) {
        cardsByOwner[deck.userId] = (cardsByOwner[deck.userId] || 0) + 1;
      }
    }

    // For each owner, append an alerts notification if they have any due cards
    for (const [userId, count] of Object.entries(cardsByOwner)) {
      const user = await db.users.findById(userId);
      if (user) {
        // Only append notification if the last notification wasn't already warning about reviews,
        // or check to avoid duplicates within a short period
        const hasRecentWarning = user.notifications.some(
          n => n.type === 'cron' && !n.read && n.message.includes('đến hạn cần ôn tập')
        );

        if (!hasRecentWarning) {
          const updatedNotifications = [
            {
              id: 'notif_cron_' + Date.now(),
              message: `Hệ thống nhắc nhở tự động: Bạn đang có ${count} thẻ Flashcards quá hạn cần ôn tập hôm nay! Đừng bỏ lỡ bài học nhé.`,
              type: 'cron',
              timestamp: new Date().toISOString(),
              read: false
            },
            ...user.notifications
          ];

          await db.users.findByIdAndUpdate(userId, { notifications: updatedNotifications });
          console.log(`[HustMemo Cron] Đã gửi thông báo nhắc học bài tới người dùng: ${user.name} (${user.email}) với ${count} thẻ sắp hết hạn.`);
        }
      }
    }
  } catch (error) {
    console.error('[HustMemo Cron Error] Xuất hiện lỗi khi quét thẻ ôn tập:', error);
  }
}
