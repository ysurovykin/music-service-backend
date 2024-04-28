import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import songGuesserController from '../controllers/songGuesser.controller';

const router = Router();

router.get('/stats/:listenerId', authMiddleware, songGuesserController.getFinishedSongGuesserStats);
router.get('/finished-guessers/:listenerId', authMiddleware, songGuesserController.getFinishedSongGuessers);
router.get('/finished-guesser-details/:songGuesserId', authMiddleware, songGuesserController.getFinishedSongGuesserById);
router.get('/available-songs', authMiddleware, songGuesserController.countAvailableSongs);
router.post('/start', authMiddleware, songGuesserController.startSongGuesser);
router.post('/check', authMiddleware, songGuesserController.checkAnswer);
router.post('/skip-song', authMiddleware, songGuesserController.skipSong);

export default router;