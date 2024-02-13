import listenerService from '../services/listener.service'

class ListenerController {

    async getListenerById(req, res, next) {
        try {
            const {listenerId} = req.params;
            const listener = await listenerService.getListenerById(listenerId);
            return res.json(listener);
        } catch (error) {
            next(error);
        }
    }
}

const listenerController = new ListenerController();
export default listenerController;