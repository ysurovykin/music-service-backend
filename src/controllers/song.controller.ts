import { Song } from '../models/song.model';
import songService from '../services/song.service'

class SongController {
    async upload(req, res, next) {
        try {
            const file: Express.Multer.File = req.file;
            const songData: Song = req.body;
            await songService.upload(songData, file);
            return res.json(204);
        } catch (error) {
            next(error);
        }
    }
}

const songController = new SongController();
export default songController;