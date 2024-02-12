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

    async updateSongPlayerData(req, res, next) {
        try {
            const {listenerId, songData} = req.body;
            const listener = await listenerService.updateSongPlayerData(listenerId, songData);
            return res.json(listener);
        } catch (error) {
            next(error);
        }
    }

    async savePlayTime(req, res, next) {
        try {
            const {listenerId, playTime} = req.body;
            const listener = await listenerService.savePlayTime(listenerId, playTime);
            return res.json(listener);
        } catch (error) {
            next(error);
        }
    }

    async changeVolume(req, res, next) {
        try {
            const {listenerId, volume} = req.body;
            const listener = await listenerService.changeVolume(listenerId, volume);
            return res.json(listener);
        } catch (error) {
            next(error);
        }
    }
    
    async changeMuting(req, res, next) {
        try {
            const {listenerId, muted} = req.body;
            const listener = await listenerService.changeMuting(listenerId, muted);
            return res.json(listener);
        } catch (error) {
            next(error);
        }
    }

    async changeShuffleState(req, res, next) {
        try {
            const {listenerId, shuffleEnabled} = req.body;
            const listener = await listenerService.changeShuffleState(listenerId, shuffleEnabled);
            return res.json(listener);
        } catch (error) {
            next(error);
        }
    }
    
    async changeRepeatSongState(req, res, next) {
        try {
            const {listenerId, repeatSongState} = req.body;
            const listener = await listenerService.changeRepeatSongState(listenerId, repeatSongState);
            return res.json(listener);
        } catch (error) {
            next(error);
        }
    }
}

const listenerController = new ListenerController();
export default listenerController;