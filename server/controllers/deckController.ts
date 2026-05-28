import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db, Deck, Card } from '../models/db';

// --- DECK CRUD ---

export const getDecks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Chưa xác thực người dùng.' });
       return;
    }
    const userDecks = await db.decks.findByUser(req.user._id);
    
    // Supplement each deck with its card count and how many are due for review
    const allCards = await db.cards.find();
    const now = new Date();

    const decksWithStats = userDecks.map(deck => {
      const cardsInDeck = allCards.filter(c => c.deckId === deck._id);
      const dueCardsCount = cardsInDeck.filter(c => new Date(c.nextReview) <= now).length;
      return {
        ...deck,
        cardCount: cardsInDeck.length,
        dueCount: dueCardsCount
      };
    });

    res.json(decksWithStats);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bộ thẻ:', error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const getDeck = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Chưa xác thực người dùng.' });
       return;
    }
    const { id } = req.params;
    const deck = await db.decks.findById(id);

    if (!deck || deck.userId !== req.user._id) {
       res.status(404).json({ message: 'Không tìm thấy bộ thẻ được yêu cầu.' });
       return;
    }

    const cards = await db.cards.findByDeck(id);
    res.json({ deck, cards });
  } catch (error) {
    console.error('Lỗi khi tải chi tiết bộ thẻ:', error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const createDeck = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Chưa xác thực người dùng.' });
       return;
    }
    const { name, description } = req.body;
    if (!name) {
       res.status(400).json({ message: 'Tên bộ thẻ là bắt buộc.' });
       return;
    }

    const newDeck = await db.decks.create({
      name: name.trim(),
      description: (description || '').trim(),
      userId: req.user._id
    });

    res.status(201).json({
      message: 'Tạo bộ thẻ học tập thành công!',
      deck: newDeck
    });
  } catch (error) {
    console.error('Lỗi khi tạo bộ thẻ:', error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const updateDeck = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Chưa xác thực người dùng.' });
       return;
    }
    const { id } = req.params;
    const { name, description } = req.body;

    const deck = await db.decks.findById(id);
    if (!deck || deck.userId !== req.user._id) {
       res.status(404).json({ message: 'Không tìm thấy bộ thẻ hoặc bạn không có quyền sửa.' });
       return;
    }

    const updated = await db.decks.findByIdAndUpdate(id, {
      name: (name || deck.name).trim(),
      description: description !== undefined ? description.trim() : deck.description
    });

    res.json({
      message: 'Cập nhật bộ thẻ thành công!',
      deck: updated
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật bộ thẻ:', error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const deleteDeck = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Chưa xác thực người dùng.' });
       return;
    }
    const { id } = req.params;

    const deck = await db.decks.findById(id);
    if (!deck || deck.userId !== req.user._id) {
       res.status(404).json({ message: 'Không tìm thấy bộ thẻ.' });
       return;
    }

    await db.decks.findByIdAndDelete(id);
    res.json({ message: 'Xóa bộ thẻ và các thẻ học con thành công!' });
  } catch (error) {
    console.error('Lỗi khi xóa bộ thẻ:', error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

// --- CARD CRUD ---

export const createCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Chưa xác thực người dùng.' });
       return;
    }
    const { deckId, question, answer } = req.body;

    if (!deckId || !question || !answer) {
       res.status(400).json({ message: 'Thiếu thông tin bắt buộc: Bộ thẻ, Câu hỏi, Câu trả lời.' });
       return;
    }

    const deck = await db.decks.findById(deckId);
    if (!deck || deck.userId !== req.user._id) {
       res.status(404).json({ message: 'Không tìm thấy bộ thẻ tương ứng hoặc bạn không sở hữu bộ thẻ này.' });
       return;
    }

    const newCard = await db.cards.create({
      deckId,
      question: question.trim(),
      answer: answer.trim()
    });

    res.status(201).json({
      message: 'Thêm thẻ Flashcard mới thành công!',
      card: newCard
    });
  } catch (error) {
    console.error('Lỗi khi thêm thẻ mới:', error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const updateCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Chưa xác thực người dùng.' });
       return;
    }
    const { id } = req.params;
    const { question, answer } = req.body;

    const card = await db.cards.findById(id);
    if (!card) {
       res.status(404).json({ message: 'Không tìm thấy thẻ Flashcard này.' });
       return;
    }

    // Verify deck ownership
    const deck = await db.decks.findById(card.deckId);
    if (!deck || deck.userId !== req.user._id) {
       res.status(403).json({ message: 'Bạn không có quyền sửa đổi thẻ này.' });
       return;
    }

    const updated = await db.cards.findByIdAndUpdate(id, {
      question: question !== undefined ? question.trim() : card.question,
      answer: answer !== undefined ? answer.trim() : card.answer
    });

    res.json({
      message: 'Cập nhật thẻ ghi nhớ thành công!',
      card: updated
    });
  } catch (error) {
    console.error('Lỗi khi nâng cấp thẻ:', error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const deleteCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Chưa xác thực người dùng.' });
       return;
    }
    const { id } = req.params;

    const card = await db.cards.findById(id);
    if (!card) {
       res.status(404).json({ message: 'Không tìm thấy thẻ cần xóa.' });
       return;
    }

    // Verify ownership
    const deck = await db.decks.findById(card.deckId);
    if (!deck || deck.userId !== req.user._id) {
       res.status(403).json({ message: 'Bạn không sở hữu thẻ này.' });
       return;
    }

    await db.cards.findByIdAndDelete(id);
    res.json({ message: 'Xóa thẻ Flashcard thành công!' });
  } catch (error) {
    console.error('Lỗi khi xóa thẻ:', error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

// --- SPACED REPETITION ENGINE (SM-2 ALGORITHM) ---

export const reviewCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Chưa xác thực người dùng.' });
       return;
    }
    const { id } = req.params; // cardId
    const { quality } = req.body; // 'easy' (5) | 'medium' (4) | 'hard' (2)

    if (!quality || !['easy', 'medium', 'hard'].includes(quality)) {
       res.status(400).json({ message: 'Mức độ ghi nhớ không hợp lệ. Chọn: easy, medium, hard.' });
       return;
    }

    const card = await db.cards.findById(id);
    if (!card) {
       res.status(404).json({ message: 'Không tìm thấy thẻ cần ôn tập.' });
       return;
    }

    const deck = await db.decks.findById(card.deckId);
    if (!deck || deck.userId !== req.user._id) {
       res.status(403).json({ message: 'Quyền sở hữu bộ thẻ không hợp lý.' });
       return;
    }

    // Convert string quality to logical numerical recall score
    // quality: easy=5, medium=4, hard=2
    let score = 4; // default medium
    if (quality === 'easy') score = 5;
    if (quality === 'hard') score = 2;

    let repetitions = card.repetition;
    let interval = card.interval;
    let efactor = card.efactor;

    // SM-2 Algorithm computation
    if (score >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * efactor);
      }
      repetitions++;
    } else {
      repetitions = 0;
      interval = 1;
    }

    // Adjust ease factor
    efactor = efactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    if (efactor < 1.3) {
      efactor = 1.3;
    }

    // Calculate next review timestamp
    const nextReviewDate = new Date();
    // In order for developers to test easily in real time, let's add interval * days
    // Add interval days
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    
    // Optionally we can set minutes/seconds offset for immediate testing if interval is 1
    // Let's set it to exactly interval days
    const nextReviewStr = nextReviewDate.toISOString();

    const updatedCard = await db.cards.findByIdAndUpdate(id, {
      repetition: repetitions,
      interval: interval,
      efactor: parseFloat(efactor.toFixed(2)),
      nextReview: nextReviewStr
    });

    res.json({
      message: `Đánh giá thành công! Lịch ôn tập tiếp theo: Sau ${interval} ngày.`,
      card: updatedCard
    });
  } catch (error) {
    console.error('Lỗi khi tính toán thuật toán lặp ngắt quãng SM-2:', error);
    res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};
