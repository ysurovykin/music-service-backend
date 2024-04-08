import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/auth.middleware';
import albumController from '../controllers/album.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/albums', authMiddleware, albumController.getAlbums);
router.post('/create', authMiddleware, upload.single('image'), albumController.create);
router.post('/add-to-library', authMiddleware, albumController.addAlbumToLibrary);
router.post('/remove-from-library', authMiddleware, albumController.removeAlbumFromLibrary);
router.get('/albums/:artistId', authMiddleware, albumController.getAlbumsByArtistId);
router.get('/albums/artist-appears/:artistId', authMiddleware, albumController.getAlbumsWhereArtistAppears);
router.get('/:albumId', authMiddleware, albumController.getAlbumById);
router.get('/albums-in-library/:listenerId', authMiddleware, albumController.getAlbumsInListenerLibrary);
router.get('/top-albums-this-month/:listenerId', authMiddleware, albumController.getListenerTopAlbumsThisMonth);


export default router;