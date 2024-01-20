import userController from '../controllers/user.controller';
import {body} from 'express-validator';
import {Router} from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/registration', 
  body('email').isEmail(), 
  body('password').isLength({min: 4, max: 20}),
  upload.single('image'),
  userController.registration
);

router.get('/refresh', userController.refresh);
router.get('/:email', userController.getUserByEmail);

export default router;