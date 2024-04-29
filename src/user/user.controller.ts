import userService from './user.service';

class UserController {
    async getUserByEmail(req, res, next) {
        try {
            const { email } = req.params;
            const user = await userService.getUserByEmail(email);
            return res.json(user);
        } catch (error) {
            next(error);
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            const { isRetry } = req.query;
            const userData = await userService.refresh(refreshToken, isRetry);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
            return res.json(userData);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password, remember } = req.body;
            const userData = await userService.login(email, password);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 0, httpOnly: true })
            return res.json(userData);
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            await userService.logout(refreshToken);
            res.clearCookie('refreshToken');
            return res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    }

    async registration(req, res, next) {
        try {
            const userData = req.body;
            const user = await userService.registration(userData);
            res.cookie('refreshToken', user.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
            return res.json(user);
        } catch (error) {
            next(error);
        }
    }
}

const userController = new UserController();
export default userController;