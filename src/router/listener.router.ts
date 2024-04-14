import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import listenerController from '../controllers/listener.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.get('/:listenerId', authMiddleware, listenerController.getListenerById);
router.get('/recent-most-visited-content/:listenerId', authMiddleware, listenerController.getRecentMostVisitedContent);
router.get('/home-page-content/:listenerId', authMiddleware, listenerController.getHomePageContent);
router.post('/edit-profile', authMiddleware, upload.single('image'), listenerController.editProfile);
router.get('/account-content-count/:listenerId', authMiddleware, listenerController.getAccountContentCount);
router.get('/existing-genres/:listenerId', listenerController.getExistingGenres);
router.get('/recommended-artists/:listenerId', authMiddleware, listenerController.getRecommendedArtists);
router.post('/get-started', authMiddleware, listenerController.saveGetStartedResults);
router.get('/credit-cards/:listenerId', authMiddleware, listenerController.getUserCreditCards);
router.post('/change-subscription', authMiddleware, listenerController.changeSubscription);
router.delete('/:listenerId/delete-credit-card/:cardId', authMiddleware, listenerController.deleteUserCreditCard);

export default router;