import userService from './user.service';

class UserController {
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            const { isRetry, profileType } = req.query;
            const userData = await userService.refresh(refreshToken, profileType, isRetry);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
            return res.json(userData);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password, profileType, remember } = req.body;
            const userData = await userService.login(email, password, profileType);
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

    async switchProfileType(req, res, next) {
        try {
            const { userId, newProfileType, shouldCreateNew } = req.body;
            const userData = await userService.switchProfileType(userId, newProfileType, shouldCreateNew);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
            return res.json(userData);
        } catch (error) {
            next(error);
        }
    }

    async getUserCreditCards(req, res, next) {
        try {
            const { userId } = req.params;
            const creditCards = await userService.getUserCreditCards(userId);
            return res.json(creditCards);
        } catch (error) {
            next(error);
        }
    }

    async changeSubscription(req, res, next) {
        try {
            const { userId } = req.query;
            const { subscription, cardId, cardDetails, profileType } = req.body;
            await userService.changeSubscription(userId, subscription, cardId, cardDetails, profileType);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async deleteUserCreditCard(req, res, next) {
        try {
            const { userId, cardId } = req.params;
            await userService.deleteUserCreditCard(userId, cardId);
            return res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    }

}

const userController = new UserController();
export default userController;