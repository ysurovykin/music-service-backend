import { CreateSongRequestDataType, GetSongsResponseDataType, SongInfoResponseDataType } from '../models/song.model';
import songService from '../services/song.service'

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
            const { listenerId } = req.query;
            const song: SongInfoResponseDataType = await songService.getSongById(listenerId, songId);
            return res.json(song);
        } catch (error) {
            next(error);
        }
    }

    async getSongs(req, res, next) {
        try {
            const { listenerId, options, offset, limit } = req.query;
            const songs: GetSongsResponseDataType = await songService.getSongs(listenerId, options, offset, limit);
            return res.json(songs);
        } catch (error) {
            next(error);
        }
    }

}

const songController = new SongController();
export default songController;