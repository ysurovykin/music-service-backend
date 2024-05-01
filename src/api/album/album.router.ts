import { Router } from 'express';
import multer from 'multer';
import listenerAuthMiddleware from '../../middlewares/listenerAuth.middleware';
import albumController from './album.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/albums', listenerAuthMiddleware, albumController.getAlbums);
router.post('/create', listenerAuthMiddleware, upload.single('image'), albumController.create);
router.post('/add-to-library', listenerAuthMiddleware, albumController.addAlbumToLibrary);
router.post('/remove-from-library', listenerAuthMiddleware, albumController.removeAlbumFromLibrary);
router.get('/albums/:artistId', listenerAuthMiddleware, albumController.getAlbumsByArtistId);
router.get('/albums/artist-appears/:artistId', listenerAuthMiddleware, albumController.getAlbumsWhereArtistAppears);
router.get('/:albumId', listenerAuthMiddleware, albumController.getAlbumById);
router.get('/albums-in-library/:listenerId', listenerAuthMiddleware, albumController.getAlbumsInListenerLibrary);
router.get('/top-albums-this-month/:listenerId', listenerAuthMiddleware, albumController.getListenerTopAlbumsThisMonth);


export default router;