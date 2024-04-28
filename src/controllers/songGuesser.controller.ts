import songGuesserService from '../services/songGuesser.service'

class SongGuesserController {
    async countAvailableSongs(req, res, next) {
        try {
            const { listenerId, filter } = req.query;
            const response = await songGuesserService.countAvailableSongs(listenerId, filter);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async startSongGuesser(req, res, next) {
        try {
            const { filter, difficulty } = req.body;
            const { listenerId } = req.query;
            const response = await songGuesserService.startSongGuesser(listenerId, filter, difficulty);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async checkAnswer(req, res, next) {
        try {
            const { songGuesserId, answer } = req.body;
            const { listenerId } = req.query;
            const response = await songGuesserService.checkAnswer(listenerId, songGuesserId, answer);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async skipSong(req, res, next) {
        try {
            const { songGuesserId } = req.body;
            const { listenerId } = req.query;
            const response = await songGuesserService.skipSong(listenerId, songGuesserId);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getFinishedSongGuesserStats(req, res, next) {
        try {
            const { listenerId } = req.params;
            const response = await songGuesserService.getFinishedSongGuesserStats(listenerId);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getFinishedSongGuessers(req, res, next) {
        try {
            const { listenerId } = req.params;
            const { offset, limit, difficulties, filter, sort } = req.query;
            const response = await songGuesserService.getFinishedSongGuessers(listenerId, offset, limit, difficulties, filter, sort);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getFinishedSongGuesserById(req, res, next) {
        try {
            const { songGuesserId } = req.params;
            const response = await songGuesserService.getFinishedSongGuesserById(songGuesserId);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

}

const songGuesserController = new SongGuesserController();
export default songGuesserController;