import { Router } from 'express';
import listenerAuthMiddleware from '../../middlewares/listenerAuth.middleware';
import queueController from './queue.controller';

const router = Router();

router.get('/', listenerAuthMiddleware, queueController.getQueue);
router.post('/generate', listenerAuthMiddleware, queueController.generateQueue);
router.post('/add-song', listenerAuthMiddleware, queueController.addSongToQueue);
router.post('/remove-song', listenerAuthMiddleware, queueController.removeSongFromQueue);

export default router;