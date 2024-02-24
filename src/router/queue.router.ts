import { Router } from 'express';
import queueController from '../controllers/queue.controller';

const router = Router();

router.get('/', queueController.getQueue);
router.post('/generate', queueController.generateQueue);

export default router;