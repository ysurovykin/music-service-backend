import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import listenerController from '../controllers/listener.controller';

const router = Router();

router.get('/:listenerId', authMiddleware, listenerController.getListenerById);
router.get('/recent-most-visited-content/:listenerId', authMiddleware, listenerController.getRecentMostVisitedContent);

export default router;