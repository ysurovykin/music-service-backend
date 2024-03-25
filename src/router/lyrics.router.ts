import { Router } from 'express';
import lyricsController from '../controllers/lyrics.controller';

const router = Router();

router.get('/:songId', lyricsController.getSongLyrics);

export default router;