import { QueueInfoResponseDataType, QueueSongInfoResponseDataType } from '../models/queue.model';
import queueService from '../services/queue.service'

class QueueController {
    async getQueue(req, res, next) {
        try {
            const { listenerId, songQueueId } = req.query;
            const response: QueueInfoResponseDataType = await queueService.getQueue(listenerId, songQueueId);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async generateQueue(req, res, next) {
        try {
            const { songId, songQueueId, shuffleEnabled, isNewQueue, extendForward, options, onlyLiked, sortingOptions } = req.body;
            const { listenerId } = req.query;
            const response: QueueInfoResponseDataType = await queueService.generateQueue(listenerId, songId, songQueueId, 
                shuffleEnabled, isNewQueue, extendForward, options, onlyLiked, sortingOptions);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async addSongToQueue(req, res, next) {
        try {
            const { songId, currentSongQueueId } = req.body;
            const { listenerId } = req.query;
            const response: QueueSongInfoResponseDataType = await queueService.addSongToQueue(listenerId, currentSongQueueId, songId);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async removeSongFromQueue(req, res, next) {
        try {
            const { songQueueId } = req.body;
            const { listenerId } = req.query;
            await queueService.removeSongFromQueue(listenerId, songQueueId);
            return res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    }
}

const queueController = new QueueController();
export default queueController;