import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/auth.middleware';
import songController from '../controllers/song.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/songs', authMiddleware, songController.getSongs);
router.get('/:songId', authMiddleware, songController.getSongById);
router.post('/upload', authMiddleware, upload.single('song'), songController.upload);
router.post('/record-song-play-row-data', authMiddleware, songController.recordSongPlayRowData);

export default router;