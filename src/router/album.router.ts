import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/auth.middleware';
import albumController from '../controllers/album.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/create', upload.single('image'), albumController.create);
router.get('/albums/:artistId', albumController.getAlbumsByArtistId);
router.get('/:albumId', albumController.getAlbumById);


export default router;