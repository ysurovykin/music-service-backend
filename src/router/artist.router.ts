import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import artistController from '../controllers/artist.controller';

const router = Router();

router.get('/artists', artistController.getArtists);
router.get('/:artistId', artistController.getArtistById);


export default router;