import { Router } from 'express';
import listenerAuthMiddleware from '../../middlewares/listenerAuth.middleware';
import artistController from './artist.controller';

const router = Router();

router.get('/artists', listenerAuthMiddleware, artistController.getArtists);
router.get('/:artistId', listenerAuthMiddleware, artistController.getArtistById);
router.post('/follow', listenerAuthMiddleware, artistController.followArtist);
router.post('/unfollow', listenerAuthMiddleware, artistController.unfollowArtist);
router.get('/genres/:artistId', listenerAuthMiddleware, artistController.getGenres);
router.get('/most-recent-release/:artistId', listenerAuthMiddleware, artistController.getMostRecentRelease);
router.get('/artists-in-library/:listenerId', listenerAuthMiddleware, artistController.getArtistsInListenerLibrary);
router.get('/top-artists-this-month/:listenerId', listenerAuthMiddleware, artistController.getListenerTopArtistsThisMonth);
router.get('/fans-also-like/:artistId', listenerAuthMiddleware, artistController.getFansAlsoLikeArtists);


export default router;