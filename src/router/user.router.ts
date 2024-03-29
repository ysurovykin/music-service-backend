import userController from '../controllers/user.controller';
import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/registration', userController.registration);
router.get('/refresh', userController.refresh);

router.get('/:email', authMiddleware, userController.getUserByEmail);

export default router;