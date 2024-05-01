import { Router } from 'express';
import listenerAuthMiddleware from '../../middlewares/listenerAuth.middleware';
import lyricsController from './lyrics.controller';

const router = Router();

router.get('/:songId', listenerAuthMiddleware, lyricsController.getSongLyrics);

export default router;