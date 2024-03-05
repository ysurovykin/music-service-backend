import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/auth.middleware';
import playlistController from '../controllers/playlist.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/create', upload.single('image'), playlistController.create);
router.post('/edit', upload.single('image'), playlistController.editPlaylistById);
router.get('/playlists/:listenerId', playlistController.getPlaylistsByListenerId);
router.get('/:playlistId', playlistController.getPlaylistById);
router.post('/edit-song-paylists', playlistController.editSongPlaylists);


export default router;