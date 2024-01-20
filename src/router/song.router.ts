import {Router} from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/auth.middleware';
import songController from '../controllers/song.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('song'), songController.upload);

export default router;