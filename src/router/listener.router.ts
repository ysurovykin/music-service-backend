import {Router} from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import listenerController from '../controllers/listener.controller';

const router = Router();

router.get('/:listenerId', listenerController.getListenerById);

export default router;