import { Album } from '../models/album.model';
import albumService from '../services/album.service'

class AlbumController {
    async create(req, res, next) {
        try {
            const image: Express.Multer.File = req.file;
            const albumData: Album = req.body;
            await albumService.create(albumData, image);
            return res.json(204);
        } catch (error) {
            next(error);
        }
    }
}

const albumController = new AlbumController();
export default albumController;