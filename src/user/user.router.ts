import userController from './user.controller';
import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import multer from 'multer';

const router = Router();

router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/registration', userController.registration);
router.get('/refresh', userController.refresh);
router.post('/switch-profile-type', authMiddleware, userController.switchProfileType);
router.get('/credit-cards/:userId', authMiddleware, userController.getUserCreditCards);
router.post('/change-subscription', authMiddleware, userController.changeSubscription);
router.delete('/:userId/delete-credit-card/:cardId', authMiddleware, userController.deleteUserCreditCard);

export default router;