import { CreatePlaylistRequestDataType } from '../models/playlist.model';
import playlistService from '../services/playlist.service'

class PlaylistController {
    async create(req, res, next) {
        try {
            const image: Express.Multer.File = req.file;
            const playlistData: CreatePlaylistRequestDataType = req.body;
            await playlistService.create(playlistData, image);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async getPlaylistsByListenerId(req, res, next) {
        try {
            const { listenerId } = req.params;
            const playlist = await playlistService.getPlaylistsByListenerId(listenerId);
            return res.json(playlist);
        } catch (error) {
            next(error);
        }
    }

    async getPlaylistById(req, res, next) {
        try {
            const { playlistId } = req.params;
            const playlist = await playlistService.getPlaylistById(playlistId);
            return res.json(playlist);
        } catch (error) {
            next(error);
        }
    }
}

const playlistController = new PlaylistController();
export default playlistController;