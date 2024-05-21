import { Router } from 'express';
import multer from 'multer';
import listenerAuthMiddleware from '../../middlewares/listenerAuth.middleware';
import songController from './song.controller';
import artistAuthMiddleware from '../../middlewares/artistAuth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/songs', listenerAuthMiddleware, songController.getSongs);
router.get('/:songId', listenerAuthMiddleware, songController.getSongById);
router.post('/record-song-play-row-data', listenerAuthMiddleware, songController.recordSongPlayRowData);

router.post('/upload', artistAuthMiddleware, upload.single('song'), songController.upload);
router.get('/artist-album-songs/:albumId', artistAuthMiddleware, songController.getArtistAlbumSongs);
router.post('/hide/:songId', artistAuthMiddleware, songController.hideSong);
router.post('/unhide/:songId', artistAuthMiddleware, songController.unhideSong);

export default router;