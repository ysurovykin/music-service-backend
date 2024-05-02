import { CreateSongRequestDataType, GetSongsResponseDataType, SongInfoResponseDataType } from './song.model';
import songService from './song.service'

class SongController {
    async upload(req, res, next) {
        try {
            const file: Express.Multer.File = req.file;
            const songData: CreateSongRequestDataType = req.body;
            await songService.upload(songData, file);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async getSongById(req, res, next) {
        try {
            const { songId } = req.params;
            const { listenerId, playlistId } = req.query;
            const song: SongInfoResponseDataType = await songService.getSongById(listenerId, songId, playlistId);
            return res.json(song);
        } catch (error) {
            next(error);
        }
    }

    async getSongs(req, res, next) {
        try {
            const { listenerId, offset, limit, options, onlyLiked, sortingOptions, search } = req.query;
            const songs: GetSongsResponseDataType = await songService.getSongs(listenerId, offset, limit, options, onlyLiked, sortingOptions, search);
            return res.json(songs);
        } catch (error) {
            next(error);
        }
    }

    async recordSongPlayRowData(req, res, next) {
        try {
            const { songId, time } = req.body;
            const { listenerId } = req.query;
            await songService.recordSongPlayRowData(listenerId, songId, time);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async hideSong(req, res, next) {
        try {
            const { songId } = req.params;
            const { artistId } = req.query;
            await songService.hideSong(artistId, songId);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async unhideSong(req, res, next) {
        try {
            const { songId } = req.params;
            const { artistId } = req.query;
            await songService.unhideSong(artistId, songId);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

}

const songController = new SongController();
export default songController;