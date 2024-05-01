import { Router } from 'express';
import listenerAuthMiddleware from '../../middlewares/listenerAuth.middleware';
import listenerController from './listener.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.get('/:listenerId', listenerAuthMiddleware, listenerController.getListenerById);
router.get('/recent-most-visited-content/:listenerId', listenerAuthMiddleware, listenerController.getRecentMostVisitedContent);
router.get('/home-page-content/:listenerId', listenerAuthMiddleware, listenerController.getHomePageContent);
router.post('/edit-profile', listenerAuthMiddleware, upload.single('image'), listenerController.editProfile);
router.get('/account-content-count/:listenerId', listenerAuthMiddleware, listenerController.getAccountContentCount);
router.get('/existing-genres/:listenerId', listenerController.getExistingGenres);
router.get('/recommended-artists/:listenerId', listenerAuthMiddleware, listenerController.getRecommendedArtists);
router.post('/get-started', listenerAuthMiddleware, listenerController.saveGetStartedResults);

export default router;