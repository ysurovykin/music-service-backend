import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import lyricsController from '../controllers/lyrics.controller';

const router = Router();

router.get('/:songId', authMiddleware, lyricsController.getSongLyrics);

export default router;