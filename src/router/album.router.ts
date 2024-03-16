import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/auth.middleware';
import albumController from '../controllers/album.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/albums', albumController.getAlbums);
router.post('/create', upload.single('image'), albumController.create);
router.post('/add-to-library', albumController.addAlbumToLibrary);
router.post('/remove-from-library', albumController.removeAlbumFromLibrary);
router.get('/albums/:artistId', albumController.getAlbumsByArtistId);
router.get('/albums/artist-appears/:artistId', albumController.getAlbumsWhereArtistAppears);
router.get('/:albumId', albumController.getAlbumById);
router.get('/albums-in-library/:listenerId', albumController.getAlbumsInListenerLibrary);


export default router;