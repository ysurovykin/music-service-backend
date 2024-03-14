import artistService from '../services/artist.service'

class ArtistController {
    async getArtists(req, res, next) {
        try {
            const artists = await artistService.getArtists();
            return res.json(artists);
        } catch (error) {
            next(error);
        }
    }

    async changeArtistProfileImage(req, res, next) {
        try {
            const image: Express.Multer.File = req.file;
            const { artistId } = req.body;
            await artistService.changeArtistProfileImage(artistId, image);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async removeArtistProfileImage(req, res, next) {
        try {
            const { artistId } = req.body;
            await artistService.removeArtistProfileImage(artistId);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async getArtistById(req, res, next) {
        try {
            const { artistId } = req.params;
            const { listenerId } = req.query;
            const artist = await artistService.getArtistById(listenerId, artistId);
            return res.json(artist);
        } catch (error) {
            next(error);
        }
    }

    async followArtist(req, res, next) {
        try {
            const { artistId } = req.body;
            const { listenerId } = req.query;
            const album = await artistService.followArtist(listenerId, artistId);
            return res.json(album);
        } catch (error) {
            next(error);
        }
    }

    async unfollowArtist(req, res, next) {
        try {
            const { artistId } = req.body;
            const { listenerId } = req.query;
            const album = await artistService.unfollowArtist(listenerId, artistId);
            return res.json(album);
        } catch (error) {
            next(error);
        }
    }

    async getGenres(req, res, next) {
        try {
            const { artistId } = req.params;
            const genres = await artistService.getGenres(artistId);
            return res.json(genres);
        } catch (error) {
            next(error);
        }
    }

    async getMostRecentRelease(req, res, next) {
        try {
            const { artistId } = req.params;
            const { listenerId } = req.query;
            const albums = await artistService.getMostRecentRelease(listenerId, artistId);
            return res.json(albums);
        } catch (error) {
            next(error);
        }
    }
}

const artistController = new ArtistController();
export default artistController;