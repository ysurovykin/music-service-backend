import { CreateAlbumRequestDataType } from '../models/album.model';
import albumService from '../services/album.service'

class AlbumController {
    async create(req, res, next) {
        try {
            const image: Express.Multer.File = req.file;
            const albumData: CreateAlbumRequestDataType = req.body;
            await albumService.create(albumData, image);
            return res.json(204);
        } catch (error) {
            next(error);
        }
    }

    async getAlbumsByArtistId(req, res, next) {
        try {
            const {artistId} = req.params;
            const album = await albumService.getAlbumsByArtistId(artistId);
            return res.json(album);
        } catch (error) {
            next(error);
        }
    }

    async getAlbumById(req, res, next) {
        try {
            const {albumId} = req.params;
            const album = await albumService.getAlbumById(albumId);
            return res.json(album);
        } catch (error) {
            next(error);
        }
    }
}

const albumController = new AlbumController();
export default albumController;