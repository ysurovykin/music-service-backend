import { Router } from 'express';
import authMiddleware from '../../middlewares/auth.middleware';
import queueController from './queue.controller';

const router = Router();

router.get('/', authMiddleware, queueController.getQueue);
router.post('/generate', authMiddleware, queueController.generateQueue);
router.post('/add-song', authMiddleware, queueController.addSongToQueue);
router.post('/remove-song', authMiddleware, queueController.removeSongFromQueue);

export default router;