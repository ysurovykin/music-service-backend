import { Router } from 'express';
import queueController from '../controllers/queue.controller';

const router = Router();

router.get('/', queueController.getQueue);
router.post('/generate', queueController.generateQueue);
router.post('/add-song', queueController.addSongToQueue);
router.post('/remove-song', queueController.removeSongFromQueue);

export default router;