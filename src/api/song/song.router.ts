import { Router } from 'express';
import multer from 'multer';
import listenerAuthMiddleware from '../../middlewares/listenerAuth.middleware';
import songController from './song.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/songs', listenerAuthMiddleware, songController.getSongs);
router.get('/:songId', listenerAuthMiddleware, songController.getSongById);
router.post('/upload', listenerAuthMiddleware, upload.single('song'), songController.upload);
router.post('/record-song-play-row-data', listenerAuthMiddleware, songController.recordSongPlayRowData);

export default router;