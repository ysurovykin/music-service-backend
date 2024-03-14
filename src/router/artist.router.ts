import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/auth.middleware';
import artistController from '../controllers/artist.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/artists', artistController.getArtists);
router.get('/:artistId', artistController.getArtistById);
router.post('/change-profile-image', upload.single('image'), artistController.changeArtistProfileImage);
router.post('/remove-profile-image', artistController.removeArtistProfileImage);
router.post('/follow', artistController.followArtist);
router.post('/unfollow', artistController.unfollowArtist);
router.get('/genres/:artistId', artistController.getGenres);
router.get('/most-recent-release/:artistId', artistController.getMostRecentRelease);


export default router;