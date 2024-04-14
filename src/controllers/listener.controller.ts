import { EditProfileRequestDataType } from '../models/listener.model';
import listenerService from '../services/listener.service'

class ListenerController {

    async getListenerById(req, res, next) {
        try {
            const { listenerId } = req.params;
            const listener = await listenerService.getListenerById(listenerId);
            return res.json(listener);
        } catch (error) {
            next(error);
        }
    }

    async getRecentMostVisitedContent(req, res, next) {
        try {
            const { listenerId } = req.params;
            const content = await listenerService.getRecentMostVisitedContent(listenerId);
            return res.json(content);
        } catch (error) {
            next(error);
        }
    }

    async getHomePageContent(req, res, next) {
        try {
            const { listenerId } = req.params;
            const { forceUpdate } = req.query;
            const content = await listenerService.getHomePageContent(listenerId, forceUpdate);
            return res.json(content);
        } catch (error) {
            next(error);
        }
    }

    async editProfile(req, res, next) {
        try {
            const image: Express.Multer.File = req.file;
            const { listenerId } = req.query;
            const profileData: EditProfileRequestDataType = req.body;
            await listenerService.editProfile(listenerId, image, profileData);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async getAccountContentCount(req, res, next) {
        try {
            const { listenerId } = req.params;
            const contentCount = await listenerService.getAccountContentCount(listenerId);
            return res.json(contentCount);
        } catch (error) {
            next(error);
        }
    }

    async getExistingGenres(req, res, next) {
        try {
            const { listenerId } = req.params;
            const { choosenGenres, search } = req.query;
            const genres = await listenerService.getExistingGenres(listenerId, choosenGenres, search);
            return res.json(genres);
        } catch (error) {
            next(error);
        }
    }

    async getRecommendedArtists(req, res, next) {
        try {
            const { listenerId } = req.params;
            const { genres, offset, limit } = req.query;
            const artists = await listenerService.getRecommendedArtists(listenerId, genres, offset, limit);
            return res.json(artists);
        } catch (error) {
            next(error);
        }
    }

    async saveGetStartedResults(req, res, next) {
        try {
            const { listenerId } = req.query;
            const { genres, artistIds } = req.body;
            await listenerService.saveGetStartedResults(listenerId, genres, artistIds);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async getUserCreditCards(req, res, next) {
        try {
            const { listenerId } = req.params;
            const creditCards = await listenerService.getUserCreditCards(listenerId);
            return res.json(creditCards);
        } catch (error) {
            next(error);
        }
    }

    async changeSubscription(req, res, next) {
        try {
            const { listenerId } = req.query;
            const { subscription, cardId, cardDetails } = req.body;
            await listenerService.changeSubscription(listenerId, subscription, cardId, cardDetails);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async deleteUserCreditCard(req, res, next) {
        try {
            const { listenerId, cardId } = req.params;
            await listenerService.deleteUserCreditCard(listenerId, cardId);
            return res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    }

}

const listenerController = new ListenerController();
export default listenerController;