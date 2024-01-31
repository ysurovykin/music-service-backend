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

    async getArtistById(req, res, next) {
        try {
            const {artistId} = req.body;
            const artist = await artistService.getArtistById(artistId);
            return res.json(artist);
        } catch (error) {
            next(error);
        }
    }
}

const artistController = new ArtistController();
export default artistController;