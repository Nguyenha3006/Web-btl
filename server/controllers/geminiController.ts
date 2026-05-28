import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../models/db';

// Safely lazy-initialize the client to prevent startup crashes if key is omitted
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined. Please add it to your secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export const generateSmartCards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
       res.status(401).json({ message: 'Chưa xác thực người dùng.' });
       return;
    }

    const { topic, deckId } = req.body;
    if (!topic || !deckId) {
       res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ Chủ đề và Bộ thẻ đích.' });
       return;
    }

    // Verify deck ownership
    const deck = await db.decks.findById(deckId);
    if (!deck || deck.userId !== req.user._id) {
       res.status(404).json({ message: 'Không tìm thấy bộ thẻ tương ứng hoặc bạn không sở hữu bộ thẻ này.' });
       return;
    }

    const prompt = `Bạn là một trợ lý giáo dục thông minh. Hãy tạo đúng 5 thẻ flashcard chất lượng cao bằng tiếng Việt xoay quanh chủ đề/bài học: "${topic}".
Mỗi thẻ phải bao gồm câu hỏi/thuật ngữ ngắn gọn súc tích ở mặt trước, và câu trả lời/định nghĩa khoa học, dễ hiểu ở mặt sau.`;

    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Bạn là chuyên gia thiết kế câu hỏi trắc nghiệm và thẻ ghi nhớ ôn học hiệu quả. Chỉ trả về mảng JSON chứa các câu hỏi theo lược đồ quy định.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "Mặt trước của thẻ - Câu hỏi, khái niệm hoặc từ khóa chính (bằng tiếng Việt)"
              },
              answer: {
                type: Type.STRING,
                description: "Mặt sau của thẻ - Giải nghĩa, định nghĩa, câu trả lời chi tiết chính xác (bằng tiếng Việt)"
              }
            },
            required: ["question", "answer"]
          }
        }
      }
    });

    const jsonStr = response.text || '[]';
    const parsedCards = JSON.parse(jsonStr.trim());

    if (!Array.isArray(parsedCards) || parsedCards.length === 0) {
       res.status(500).json({ message: 'AI không tạo đúng cấu trúc thẻ flashcard. Vui lòng thử lại.' });
       return;
    }

    // Insert these generated cards to DB automatically!
    const createdCards = [];
    for (const card of parsedCards) {
      if (card.question && card.answer) {
        const newCard = await db.cards.create({
          deckId,
          question: card.question.trim(),
          answer: card.answer.trim()
        });
        createdCards.push(newCard);
      }
    }

    // Add a specific notification that cards were successfully made with Gemini
    const updatedNotifications = [
      {
        id: 'notif_gemini_' + Date.now(),
        message: `HustMemo AI đã tạo thành công ${createdCards.length} thẻ flashcard mới cho chủ đề "${topic}". Bắt đầu ôn ngay!`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false
      },
      ...req.user.notifications
    ];
    await db.users.findByIdAndUpdate(req.user._id, { notifications: updatedNotifications });

    res.status(200).json({
      message: `Đã dùng AI tạo thành công ${createdCards.length} thẻ ghi nhớ trong bộ thẻ "${deck.name}"!`,
      cards: createdCards
    });

  } catch (error: any) {
    console.error('Lỗi khi gọi Gemini API để sinh thẻ:', error);
    if (error.message && error.message.includes('GEMINI_API_KEY')) {
       res.status(403).json({ message: 'Vui lòng cấu hình GEMINI_API_KEY trong Settings > Secrets rảnh tay trước khi sử dụng tính năng thông minh này.' });
    } else {
       res.status(500).json({ message: 'Không thể kết nối với trí tuệ nhân tạo Gemini tại thời điểm này. Vui lòng kiểm tra khóa API hoặc thử lại sau.' });
    }
  }
};
