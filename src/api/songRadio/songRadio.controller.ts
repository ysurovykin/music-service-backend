import songRadioService from './songRadio.service'

class SongRadioController {
    async createSongRadio(req, res, next) {
        try {
            const { songId, shouldRefresh } = req.body;
            const { listenerId } = req.query;
            const response = await songRadioService.createSongRadio(listenerId, songId, shouldRefresh);
            if (response.status === 300 && response.approveRefresh) {
                return res.json({ status: 300, approveRefresh: true });
            }
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getSongRadio(req, res, next) {
        try {
            const { songId } = req.params;
            const { listenerId } = req.query;
            const response = await songRadioService.getSongRadio(listenerId, songId);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getListenerSongRadios(req, res, next) {
        try {
            const { listenerId } = req.params;
            const { offset, limit, search } = req.query;
            const response = await songRadioService.getListenerSongRadios(listenerId, offset, limit, search);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

}

const songRadioController = new SongRadioController();
export default songRadioController;