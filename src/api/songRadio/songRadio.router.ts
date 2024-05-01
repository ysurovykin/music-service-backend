import { Router } from 'express';
import listenerAuthMiddleware from '../../middlewares/listenerAuth.middleware';
import songRadioController from './songRadio.controller';

const router = Router();

router.get('/:songId', listenerAuthMiddleware, songRadioController.getSongRadio);
router.get('/listener-song-radios/:listenerId', listenerAuthMiddleware, songRadioController.getListenerSongRadios);
router.post('/create', listenerAuthMiddleware, songRadioController.createSongRadio);

export default router;