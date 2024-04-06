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
            const listener = await listenerService.getRecentMostVisitedContent(listenerId);
            return res.json(listener);
        } catch (error) {
            next(error);
        }
    }

    async getHomePageContent(req, res, next) {
        try {
            const { listenerId } = req.params;
            const listener = await listenerService.getHomePageContent(listenerId);
            return res.json(listener);
        } catch (error) {
            next(error);
        }
    }

    async editProfile(req, res, next) {
        try {
            const image: Express.Multer.File = req.file;
            const { listenerId } = req.query;
            const profileData: EditProfileRequestDataType = req.body;
            const listener = await listenerService.editProfile(listenerId, image, profileData);
            return res.json(listener);
        } catch (error) {
            next(error);
        }
    }
    
    async getAccountContentCount(req, res, next) {
        try {
            const { listenerId } = req.params;
            const listener = await listenerService.getAccountContentCount(listenerId);
            return res.json(listener);
        } catch (error) {
            next(error);
        }
    }

}

const listenerController = new ListenerController();
export default listenerController;