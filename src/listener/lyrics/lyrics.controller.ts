import lyricsService from './lyrics.service'

class LyricsController {
    async getSongLyrics(req, res, next) {
        try {
            const { songId } = req.params;
            const response = await lyricsService.getSongLyric(songId);
            return res.json(response);
        } catch (error) {
            next(error);
        }
    }

}

const lyricsController = new LyricsController();
export default lyricsController;