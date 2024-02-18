import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/auth.middleware';
import songController from '../controllers/song.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/:songId', songController.getSongById);
router.post('/upload', upload.single('song'), songController.upload);
router.post('/edit-paylists', songController.editPlaylists);

export default router;