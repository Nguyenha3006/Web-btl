import { Router } from 'express';
import { getDecks, getDeck, createDeck, updateDeck, deleteDeck, createCard, updateCard, deleteCard, reviewCard } from '../controllers/deckController';
import { generateSmartCards } from '../controllers/geminiController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Apply auth protection to all routes in this router
router.use(authMiddleware);

// Deck CRUD
router.get('/', getDecks);
router.get('/:id', getDeck);
router.post('/', createDeck);
router.put('/:id', updateDeck);
router.delete('/:id', deleteDeck);

// Card CRUD
router.post('/cards', createCard);
router.put('/cards/:id', updateCard);
router.delete('/cards/:id', deleteCard);

// SM-2 Spaced Repetition action
router.post('/cards/:id/review', reviewCard);

// AI Smart Cards generator with Gemini
router.post('/cards/generate', generateSmartCards);

export default router;
