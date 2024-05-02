import { Router } from 'express';
import multer from 'multer';
import listenerAuthMiddleware from '../../middlewares/listenerAuth.middleware';
import albumController from './album.controller';
import artistAuthMiddleware from '../../middlewares/artistAuth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/albums', listenerAuthMiddleware, albumController.getAlbums);
router.post('/add-to-library', listenerAuthMiddleware, albumController.addAlbumToLibrary);
router.post('/remove-from-library', listenerAuthMiddleware, albumController.removeAlbumFromLibrary);
router.get('/albums/:artistId', listenerAuthMiddleware, albumController.getAlbumsByArtistId);
router.get('/albums/artist-appears/:artistId', listenerAuthMiddleware, albumController.getAlbumsWhereArtistAppears);
router.get('/:albumId', listenerAuthMiddleware, albumController.getAlbumById);
router.get('/albums-in-library/:listenerId', listenerAuthMiddleware, albumController.getAlbumsInListenerLibrary);
router.get('/top-albums-this-month/:listenerId', listenerAuthMiddleware, albumController.getListenerTopAlbumsThisMonth);

router.post('/create', artistAuthMiddleware, upload.single('image'), albumController.create);
router.post('/edit', artistAuthMiddleware, upload.single('image'), albumController.edit);
router.get('/artist-albums/:artistId', artistAuthMiddleware, albumController.getArtistAlbums);
router.get('/artist-album/:albumId', artistAuthMiddleware, albumController.getArtistAlbumById);

export default router;