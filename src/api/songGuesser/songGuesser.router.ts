import { Router } from 'express';
import listenerAuthMiddleware from '../../middlewares/listenerAuth.middleware';
import songGuesserController from './songGuesser.controller';

const router = Router();

router.get('/stats/:listenerId', listenerAuthMiddleware, songGuesserController.getFinishedSongGuesserStats);
router.get('/finished-guessers/:listenerId', listenerAuthMiddleware, songGuesserController.getFinishedSongGuessers);
router.get('/finished-guesser-details/:songGuesserId', listenerAuthMiddleware, songGuesserController.getFinishedSongGuesserById);
router.get('/available-songs', listenerAuthMiddleware, songGuesserController.countAvailableSongs);
router.post('/start', listenerAuthMiddleware, songGuesserController.startSongGuesser);
router.post('/check', listenerAuthMiddleware, songGuesserController.checkAnswer);
router.post('/skip-song', listenerAuthMiddleware, songGuesserController.skipSong);

export default router;