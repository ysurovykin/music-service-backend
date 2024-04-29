import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../../middlewares/auth.middleware';
import artistController from './artist.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/artists', authMiddleware, artistController.getArtists);
router.get('/:artistId', authMiddleware, artistController.getArtistById);
router.post('/change-profile-image', upload.single('image'), authMiddleware, artistController.changeArtistProfileImage);
router.post('/remove-profile-image', authMiddleware, artistController.removeArtistProfileImage);
router.post('/follow', authMiddleware, artistController.followArtist);
router.post('/unfollow', authMiddleware, artistController.unfollowArtist);
router.get('/genres/:artistId', authMiddleware, artistController.getGenres);
router.get('/most-recent-release/:artistId', authMiddleware, artistController.getMostRecentRelease);
router.get('/artists-in-library/:listenerId', authMiddleware, artistController.getArtistsInListenerLibrary);
router.get('/top-artists-this-month/:listenerId', authMiddleware, artistController.getListenerTopArtistsThisMonth);
router.get('/fans-also-like/:artistId',  artistController.getFansAlsoLikeArtists);


export default router;