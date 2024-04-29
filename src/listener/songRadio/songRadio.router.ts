import { Router } from 'express';
import authMiddleware from '../../middlewares/auth.middleware';
import songRadioController from './songRadio.controller';

const router = Router();

router.get('/:songId', authMiddleware, songRadioController.getSongRadio);
router.get('/listener-song-radios/:listenerId', authMiddleware, songRadioController.getListenerSongRadios);
router.post('/create', authMiddleware, songRadioController.createSongRadio);

export default router;