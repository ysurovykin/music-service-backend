import { Router } from 'express';
import multer from 'multer';
import listenerAuthMiddleware from '../../middlewares/listenerAuth.middleware';
import playlistController from './playlist.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/create', listenerAuthMiddleware, upload.single('image'), playlistController.create);
router.post('/edit', listenerAuthMiddleware, upload.single('image'), playlistController.editPlaylistById);
router.get('/playlists/:listenerId', listenerAuthMiddleware, playlistController.getPlaylistsByListenerId);
router.get('/:playlistId', listenerAuthMiddleware, playlistController.getPlaylistById);
router.post('/edit-song-paylists', listenerAuthMiddleware, playlistController.editSongPlaylists);
router.post('/pin', listenerAuthMiddleware, playlistController.pinPlaylist);
router.post('/unpin', listenerAuthMiddleware, playlistController.unpinPlaylist);

export default router;