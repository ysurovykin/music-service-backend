import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../../middlewares/auth.middleware';
import playlistController from './playlist.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/create', authMiddleware, upload.single('image'), playlistController.create);
router.post('/edit', authMiddleware, upload.single('image'), playlistController.editPlaylistById);
router.get('/playlists/:listenerId', authMiddleware, playlistController.getPlaylistsByListenerId);
router.get('/:playlistId', authMiddleware, playlistController.getPlaylistById);
router.post('/edit-song-paylists', authMiddleware, playlistController.editSongPlaylists);
router.post('/pin', authMiddleware, playlistController.pinPlaylist);
router.post('/unpin', authMiddleware, playlistController.unpinPlaylist);

export default router;