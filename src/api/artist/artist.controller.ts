import artistService from './artist.service'

class ArtistController {
    async getArtists(req, res, next) {
        try {
            const { offset, limit, search } = req.query;
            const artists = await artistService.getArtists(offset, limit, search);
            return res.json(artists);
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

    async getArtistsInListenerLibrary(req, res, next) {
        try {
            const { listenerId } = req.params;
            const { offset, limit, search } = req.query;
            const response = await artistService.getArtistsInListenerLibrary(listenerId, offset, limit, search);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getListenerTopArtistsThisMonth(req, res, next) {
        try {
            const { listenerId } = req.params;
            const { offset, limit, search } = req.query;
            const response = await artistService.getListenerTopArtistsThisMonth(listenerId, offset, limit, search);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getFansAlsoLikeArtists(req, res, next) {
        try {
            const { artistId } = req.params;
            const { listenerId } = req.query;
            const response = await artistService.getFansAlsoLikeArtists(listenerId, artistId);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }
}

const artistController = new ArtistController();
export default artistController;