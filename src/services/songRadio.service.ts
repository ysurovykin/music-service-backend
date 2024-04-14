import ListenerModel from '../models/listener.model';
import SongModel, { SongRecordType } from '../models/song.model';
import { ForbiddenError, NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';
import moment from 'moment';
import SongRadioModel, {
    ApproveRequestResponseDataType,
    GetListenerSongRadiosResponseDataType,
    SongRadioFullResponseDataType,
    SongRadioInfoResponseDataType,
    SongRadioRecordType
} from '../models/songRadio.model';
import { mainSampleSizeMultiplier, mainArtistSampleSizeMultiplier, coArtistSampleSizeMultiplier, secondarySampleSizeMultiplier, freeSubscriptionSongRadioLimit, paidSubscriptionSongRadioLimit } from '../../config';
import GenresModel from '../models/genres.model';

class SongRadioService {

    async createSongRadio(listenerId: string, songId: string, shouldRefresh: boolean): Promise<SongRadioFullResponseDataType | ApproveRequestResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        const oneDayAgoDate = moment().subtract(1, 'day');
        if (listener.subscription === 'free' && listener.lastSongRadioGeneratedAt &&
            moment(listener.lastSongRadioGeneratedAt).isAfter(oneDayAgoDate)) {
            throw new ForbiddenError('You can generate only one song radio per 24 hours on free subscription');
        }
        const songRadioExists = await SongRadioModel.findOne({ listenerId: listenerId, baseSongId: songId }).lean();
        if (songRadioExists && !shouldRefresh) {
            return { status: 300, approveRefresh: true };
        }
        let songRadio: SongRadioRecordType;
        let songIdsToExclude = songRadioExists?.songIds || [songId];
        const song = await SongModel.findOne({ _id: songId }).lean();
        const songRadioTotalSize = listener.subscription === 'free' ? freeSubscriptionSongRadioLimit : paidSubscriptionSongRadioLimit;
        const songIds = await this._generateSongRadio(song, songRadioTotalSize, songIdsToExclude);
        if (songRadioExists) {
            songRadio = await SongRadioModel
                .findOneAndUpdate({ _id: songRadioExists._id }, { $set: { songIds: songIds, lastUpdatedAt: new Date() } }, { new: true });
        } else {
            const songRadioId = randomstring.generate(16);
            songRadio = await SongRadioModel.create({
                _id: songRadioId,
                baseSongId: songId,
                listenerId: listenerId,
                lastUpdatedAt: new Date(),
                songIds: songIds,
                name: `${song.name} song radio`,
                baseSongName: song.name
            });
        }
        const songsInfo = await SongModel.aggregate([
            { $match: { _id: { $in: songRadio.songIds } } },
            {
                $group: {
                    _id: null,
                    totalDuration: { $sum: '$duration' },
                    totalCount: { $count: {} }
                }
            },
        ]);
        await ListenerModel.updateOne({ _id: listenerId }, { $set: { lastSongRadioGeneratedAt: new Date() } })
        return {
            status: 204,
            lastUpdatedAt: songRadio.lastUpdatedAt,
            coverImageUrl: song.coverImageUrl,
            backgroundColor: song.backgroundColor,
            name: songRadio.name,
            songName: song.name,
            baseSongId: songRadio.baseSongId,
            songsTimeDuration: songsInfo[0]?.totalDuration,
            songsCount: songsInfo[0]?.totalCount
        };
    }

    async getSongRadio(listenerId: string, songId: string): Promise<SongRadioFullResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        const songRadio = await SongRadioModel.findOne({ listenerId: listenerId, baseSongId: songId }).lean();
        if (!songRadio) {
            throw new NotFoundError(`Song radio by song with id ${songId} not found`);
        }
        const baseSong = await SongModel.findOne({ _id: songRadio.baseSongId }, { coverImageUrl: 1, backgroundColor: 1, name: 1 }).lean();
        const songsInfo = await SongModel.aggregate([
            { $match: { _id: { $in: songRadio.songIds } } },
            {
                $group: {
                    _id: null,
                    totalDuration: { $sum: '$duration' },
                    totalCount: { $count: {} }
                }
            },
        ]);
        return {
            status: 204,
            lastUpdatedAt: songRadio.lastUpdatedAt,
            coverImageUrl: baseSong.coverImageUrl,
            backgroundColor: baseSong.backgroundColor,
            name: songRadio.name,
            songName: baseSong.name,
            baseSongId: songRadio.baseSongId,
            songsTimeDuration: songsInfo[0]?.totalDuration,
            songsCount: songsInfo[0]?.totalCount
        };
    }

    async getListenerSongRadios(listenerId: string, offset: number = 0, limit: number = 10,
        search: string = ''): Promise<GetListenerSongRadiosResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        search = search.replace('/', '');
        const songRadios = await SongRadioModel.find({ listenerId: listenerId, baseSongName: { $regex: search, $options: 'i' } })
            .sort({ lastUpdatedAt: -1 }).skip(+offset * +limit).limit(+limit).lean();
        const listenerSongRadios: Array<SongRadioInfoResponseDataType> = [];
        for (const songRadio of songRadios) {
            const song = await SongModel.findOne({ _id: songRadio.baseSongId }, { coverImageUrl: 1, backgroundColor: 1, name: 1 }).lean();
            listenerSongRadios.push({
                lastUpdatedAt: songRadio.lastUpdatedAt,
                coverImageUrl: song.coverImageUrl,
                backgroundColor: song.backgroundColor,
                name: songRadio.name,
                songName: song.name,
                baseSongId: songRadio.baseSongId
            })
        }
        return {
            listenerSongRadios: listenerSongRadios,
            isMoreListenerSongRadiosForLoading: listenerSongRadios.length === +limit
        };
    }

    async _generateSongRadio(song: SongRecordType, totalSize: number, songIdsToExclude: Array<String>): Promise<Array<string>> {
        const language = song.language;
        const genres = song.genres;
        const artistId = song.artistId;
        const coArtistIds = song.coArtistIds;

        const mainSampleSize = Math.ceil(totalSize * mainSampleSizeMultiplier);
        const mainArtistSampleSize = Math.ceil(totalSize * mainArtistSampleSizeMultiplier);
        const secondarySampleSize = Math.ceil(totalSize * secondarySampleSizeMultiplier);

        let songRadioSongIds = [];

        const coArtistCount = coArtistIds.length;
        if (coArtistCount) {
            const coArtistSampleSize = Math.ceil(totalSize * coArtistSampleSizeMultiplier);
            for (const coArtistId of coArtistIds) {
                const coArtistSongs = await SongModel.aggregate([
                    {
                        $match: {
                            artistId: coArtistId,
                            genres: { $in: genres }
                        },
                    },
                    { $project: { weight: { $multiply: ['$plays', { $rand: {} }] }, songId: '$songId' } },
                    { $sort: { weight: -1 } },
                    { $limit: coArtistSampleSize }
                ]);
                songRadioSongIds.push(...coArtistSongs.map(song => song._id));
            }
        }

        let mainSampleSongs = await SongModel.aggregate([
            {
                $match: {
                    _id: { $nin: [...songRadioSongIds, ...songIdsToExclude] },
                    language: language,
                    genres: { $in: genres }
                }
            },
            { $project: { weight: { $multiply: ['$plays', { $rand: {} }] }, songId: '$songId' } },
            { $sort: { weight: -1 } },
            { $limit: mainSampleSize }
        ]);
        songRadioSongIds.push(...mainSampleSongs.map(song => song._id));

        if (mainSampleSongs.length < mainSampleSize) {
            const additionalMainSampleSongs = await SongModel.aggregate([
                {
                    $match: {
                        _id: { $nin: [...songRadioSongIds, ...songIdsToExclude] },
                        genres: { $in: genres }
                    }
                },
                { $project: { weight: { $multiply: ['$plays', { $rand: {} }] }, songId: '$songId' } },
                { $sort: { weight: -1 } },
                { $limit: mainSampleSize }
            ]);
            songRadioSongIds.push(...additionalMainSampleSongs.map(song => song._id));
        }

        const mainArtistSampleSongs = await SongModel.aggregate([
            {
                $match: {
                    _id: { $nin: [...songRadioSongIds, ...songIdsToExclude] },
                    artistId: artistId,
                    genres: { $in: genres }
                }
            },
            { $project: { weight: { $multiply: ['$plays', { $rand: {} }] }, songId: '$songId' } },
            { $sort: { weight: -1 } },
            { $limit: mainArtistSampleSize }
        ]);
        songRadioSongIds.push(...mainArtistSampleSongs.map(song => song._id));

        const similarGenres = [];
        for (const genre of genres) {
            const similarGenre = await GenresModel.aggregate([
                { $match: { _id: genre } },
                { $unwind: '$similarGenres' },
                { $project: { weight: { $multiply: ['$similarGenres.similarity', { $rand: {} }] }, genreId: '$similarGenres.genreId' } },
                { $sort: { weight: -1 } },
                { $limit: 3 },
                { $project: { _id: 0, genreId: 1 } },
            ]);
            similarGenres.push(...similarGenre);
        }
        const similarGenresSet = new Set(similarGenres.map(genre => genre.genreId));

        const secondarySampleSongs = await SongModel.aggregate([
            {
                $match: {
                    _id: { $nin: [...songRadioSongIds, ...songIdsToExclude] },
                    genres: { $in: [...similarGenresSet] }
                }
            },
            { $project: { weight: { $multiply: ['$plays', { $rand: {} }] }, songId: '$songId' } },
            { $sort: { weight: -1 } },
            { $limit: secondarySampleSize }
        ]);
        songRadioSongIds.push(...secondarySampleSongs.map(song => song._id));

        if (songRadioSongIds.length < totalSize) {
            const allSimilarGenres = await GenresModel.aggregate([
                { $match: { _id: { $in: genres } } },
                { $unwind: '$similarGenres' },
                { $project: { _id: 0, genreId: '$similarGenres.genreId' } },
            ]);
            const allSimilarGenresSet = new Set(allSimilarGenres.map(genre => genre.genreId));
            const fillerSampleSongs = await SongModel.aggregate([
                {
                    $match: {
                        _id: { $nin: [...songRadioSongIds, ...songIdsToExclude] },
                        genres: { $in: [...allSimilarGenresSet] }
                    }
                },
                { $project: { weight: { $multiply: ['$plays', { $rand: {} }] }, songId: '$songId' } },
                { $sort: { weight: -1 } },
                { $limit: totalSize - songRadioSongIds.length }
            ]);
            songRadioSongIds.push(...fillerSampleSongs.map(song => song._id));
        }

        if (songRadioSongIds.length > totalSize) {
            const shuffledArray = [...songRadioSongIds].sort(() => Math.random() - 0.5);
            songRadioSongIds = shuffledArray.slice(0, songRadioSongIds.length - totalSize);
        }
        songRadioSongIds[0] = song._id;

        return songRadioSongIds;
    }
}

const playlistService = new SongRadioService();
export default playlistService;