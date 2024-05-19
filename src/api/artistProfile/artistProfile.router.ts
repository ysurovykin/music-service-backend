import { Router } from 'express';
import multer from 'multer';
import artistAuthMiddleware from '../../middlewares/artistAuth.middleware';
import artistController from './artistProfile.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/:artistProfileId', artistAuthMiddleware, artistController.getArtistProfileById);
router.post('/edit-profile', artistAuthMiddleware, upload.single('image'), artistController.editProfile);
router.get('/stats/:artistId', artistAuthMiddleware, artistController.getArtistStats);

export default router;