import LyricsModel, { LyricsInfoResponseDataType } from "./lyrics.model";

class LyricsService {

    async getSongLyric(songId: string): Promise<LyricsInfoResponseDataType> {
        const songLyrics = await LyricsModel.findOne({ _id: songId }).lean();
        if (!songLyrics) {
            return {
                lyrics: [],
                synchronized: false
            };
        }
        return {
            lyrics: songLyrics.lyrics,
            synchronized: songLyrics.synchronized
        };

        // [{ "_id": "songId01", "text": "♪", "start": "00:00:00", "end": "00:00:00" }]
    }

}

const lyricsService = new LyricsService();
export default lyricsService;