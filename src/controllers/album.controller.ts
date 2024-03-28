import { CreateAlbumRequestDataType } from '../models/album.model';
import albumService from '../services/album.service'

class AlbumController {
    async create(req, res, next) {
        try {
            const image: Express.Multer.File = req.file;
            const albumData: CreateAlbumRequestDataType = req.body;
            await albumService.create(albumData, image);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async getAlbumsByArtistId(req, res, next) {
        try {
            const { artistId } = req.params;
            const { listenerId } = req.query;
            const album = await albumService.getAlbumsByArtistId(listenerId, artistId);
            return res.json(album);
        } catch (error) {
            next(error);
        }
    }

    async getAlbumsWhereArtistAppears(req, res, next) {
        try {
            const { artistId } = req.params;
            const { listenerId } = req.query;
            const album = await albumService.getAlbumsWhereArtistAppears(listenerId, artistId);
            return res.json(album);
        } catch (error) {
            next(error);
        }
    }

    async getAlbumById(req, res, next) {
        try {
            const { albumId } = req.params;
            const { listenerId } = req.query;
            const album = await albumService.getAlbumById(listenerId, albumId);
            return res.json(album);
        } catch (error) {
            next(error);
        }
    }

    async addAlbumToLibrary(req, res, next) {
        try {
            const { albumId } = req.body;
            const { listenerId } = req.query;
            const album = await albumService.addAlbumToLibrary(listenerId, albumId);
            return res.json(album);
        } catch (error) {
            next(error);
        }
    }

    async removeAlbumFromLibrary(req, res, next) {
        try {
            const { albumId } = req.body;
            const { listenerId } = req.query;
            const album = await albumService.removeAlbumFromLibrary(listenerId, albumId);
            return res.json(album);
        } catch (error) {
            next(error);
        }
    }

    async getAlbumsInListenerLibrary(req, res, next) {
        try {
            const { listenerId } = req.params;
            const { offset, limit, search } = req.query;
            const response = await albumService.getAlbumsInListenerLibrary(listenerId, offset, limit, search);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getAlbums(req, res, next) {
        try {
            const { offset, limit, search } = req.query;
            const response = await albumService.getAlbums(offset, limit, search);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

}

const albumController = new AlbumController();
export default albumController;