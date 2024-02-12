import {Router} from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import listenerController from '../controllers/listener.controller';

const router = Router();

router.get('/:listenerId', listenerController.getListenerById);

router.put('/update-song-player-data', listenerController.updateSongPlayerData);
router.put('/change-repeat-song-state', listenerController.changeRepeatSongState);
router.put('/change-shuffle-state', listenerController.changeShuffleState);
router.put('/save-play-time', listenerController.savePlayTime);
router.put('/change-volume', listenerController.changeVolume);
router.put('/change-muting', listenerController.changeMuting);


export default router;