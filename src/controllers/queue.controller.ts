import { QueueInfoResponseDataType } from '../models/queue.model';
import queueService from '../services/queue.service'

class QueueController {
    async getQueue(req, res, next) {
        try {
            const { listenerId, songId } = req.query;
            const response: QueueInfoResponseDataType = await queueService.getQueue(listenerId, songId);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async generateQueue(req, res, next) {
        try {
            const { songId, shuffleEnabled, isNewQueue, extendForward, options } = req.body;
            const { listenerId } = req.query;
            const response: QueueInfoResponseDataType = await queueService.generateQueue(listenerId, songId, shuffleEnabled, 
                isNewQueue, extendForward, options);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }
}

const queueController = new QueueController();
export default queueController;