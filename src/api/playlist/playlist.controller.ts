import { CreatePlaylistRequestDataType, EditPlaylistRequestDataType } from './playlist.model';
import playlistService from './playlist.service'

class PlaylistController {
    async create(req, res, next) {
        try {
            const image: Express.Multer.File = req.file;
            const { listenerId } = req.query;
            const playlistData: CreatePlaylistRequestDataType = req.body;
            await playlistService.create(listenerId, playlistData, image);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async editPlaylistById(req, res, next) {
        try {
            const image: Express.Multer.File = req.file;
            const { listenerId } = req.query;
            const playlistData: EditPlaylistRequestDataType = req.body;
            await playlistService.editPlaylistById(listenerId, playlistData, image);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async getPlaylistsByListenerId(req, res, next) {
        try {
            const { listenerId } = req.params;
            const { search } = req.query;
            const playlist = await playlistService.getPlaylistsByListenerId(listenerId, search);
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

    async editSongPlaylists(req, res, next) {
        try {
            const { songId, editedPlaylists } = req.body;
            const { listenerId } = req.query;
            const playlistIds: Array<string> = await playlistService.editSongPlaylists(listenerId, songId, editedPlaylists);
            return res.json(playlistIds);
        } catch (error) {
            next(error);
        }
    }

    async pinPlaylist(req, res, next) {
        try {
            const { playlistId } = req.body;
            const { listenerId } = req.query;
            await playlistService.pinPlaylist(listenerId, playlistId);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async unpinPlaylist(req, res, next) {
        try {
            const { playlistId } = req.body;
            const { listenerId } = req.query;
            await playlistService.unpinPlaylist(listenerId, playlistId);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }
}

const playlistController = new PlaylistController();
export default playlistController;