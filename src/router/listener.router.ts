import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import listenerController from '../controllers/listener.controller';

const router = Router();

router.get('/:listenerId', listenerController.getListenerById);
router.get('/recent-most-visited-content/:listenerId', listenerController.getRecentMostVisitedContent);

export default router;