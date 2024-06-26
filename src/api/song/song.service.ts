import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import mm from 'music-metadata';
import { storage } from '../../../firebase.config';
import SongModel, {
    UploadSongRequestDataType,
    GetSongsOptionsType,
    GetSongsResponseDataType,
    GetSongsSortingOptionsType,
    SongInfoResponseDataType,
    SongRecordType,
    ArtistSongInfoResponseDataType,
    GetArtistSongsResponseDataType
} from './song.model';
import AlbumModel from '../album/album.model';
import { NotFoundError, ValidationError } from '../../errors/api-errors';
import randomstring from 'randomstring';
import SongDto from './song.dto';
import ArtistModel from '../artist/artist.model';
import PlaylistModel from '../playlist/playlist.model';
import { ArtistShortDataType } from '../artist/artist.model';
import SongPlaysRawDataModel from './songPlaysRawData.model';
import SongRadioModel from '../songRadio/songRadio.model';
import ListenerModel from '../listener/listener.model';
import ArtistProfileModel from '../artistProfile/artistProfile.model';

class SongService {

    async upload(songData: UploadSongRequestDataType, file: Express.Multer.File): Promise<void> {
        const album = await AlbumModel.findOne({ _id: songData.albumId }).lean();
        if (!album) {
            throw new NotFoundError(`Album with id ${songData.albumId} not found`);
        }
        const songMetadata = await mm.parseBuffer(file.buffer, 'audio/mpeg');
        const duration = songMetadata.format.duration;
        const songId = randomstring.generate(16);

        const artist = await ArtistModel.findOne({ _id: album.artistId }, { genres: 1, languages: 1 }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${album.artistId} not found`);
        }
        const songGenres = typeof songData.genres === 'string' ? JSON.parse(songData.genres) : songData.genres;
        const albumGenres = album.genres || {};
        const artistGenres = artist.genres || {};
        if (songGenres.length) {
            for (const genreId of songGenres) {
                albumGenres[genreId] = ++albumGenres[genreId] || 1;
                artistGenres[genreId] = ++artistGenres[genreId] || 1;
            }
        }
        const albumLanguages = album.languages || {};
        const artistLanguages = artist.languages || {};
        if (songData.language) {
            albumLanguages[songData.language] = ++albumLanguages[songData.language] || 1;
            artistLanguages[songData.language] = ++artistLanguages[songData.language] || 1;
        }
        const songIds = album.songIds || [];
        if (!isNaN(songData.indexInAlbum)) {
            songIds.length = Math.max(songIds.length, songData.indexInAlbum);
            songIds[songData.indexInAlbum - 1] = songId;
        } else {
            songIds.push(songId);
        }
        let coArtistIds = []
        if (songData.coArtistIds) {
            coArtistIds = typeof songData.coArtistIds === 'string' ? JSON.parse(songData.coArtistIds) : songData.coArtistIds;
            for (let coArtistId of coArtistIds) {
                if (coArtistId === artist._id) {
                    throw new ValidationError('You cannot add yourself as coArtist to your song');
                }
                const coArtist = await ArtistModel.findOne({ _id: coArtistId }, { _id: 1 }).lean();
                if (!coArtist) {
                    throw new NotFoundError(`Artist with id ${coArtistId} not found`);
                }
            }
        }
        await AlbumModel.updateOne({ _id: album._id }, {
            $set: { genres: albumGenres, languages: albumLanguages, songIds },
            $inc: { songsCount: 1 }
        });
        await ArtistModel.updateOne({ _id: artist._id }, {
            $set: { genres: artistGenres, languages: artistLanguages },
            $inc: { songsCount: 1 }
        });

        const downloadUrl = `songs/${songData.artistId}/${album._id}/${songId}`;
        const storageRef = ref(storage, downloadUrl);
        await uploadBytes(storageRef, file.buffer, { contentType: 'audio/mpeg' });
        let songUrl = await getDownloadURL(storageRef);
        const indexOfTokenQuery = songUrl.indexOf('&token')
        if (indexOfTokenQuery) {
            songUrl = songUrl.slice(0, indexOfTokenQuery);
        }

        await SongModel.create({
            ...songData,
            _id: songId,
            name: songData.name,
            coverImageUrl: album.coverImageUrl,
            artistId: songData.artistId,
            coArtistIds,
            albumId: album._id,
            genres: songGenres,
            language: songData.language,
            backgroundColor: album.backgroundColor,
            explicit: !!songData.explicit,
            lyricsBackgroundShadow: album.lyricsBackgroundShadow,
            songUrl,
            duration,
            date: new Date()
        });
    }

    async getSongById(listenerId: string, songId: string, playlistId: string): Promise<SongInfoResponseDataType> {
        const song = await SongModel.findOne({ _id: songId }).lean();
        if (!song) {
            throw new NotFoundError(`Song with id ${songId} not found`);
        }
        const songInfo = await this.formatSongData(listenerId, song);
        if (playlistId) {
            songInfo.date = new Date();
        }
        return songInfo;
    }

    async getSongs(listenerId: string, offset: number = 0, limit: number = 10, options?: GetSongsOptionsType,
        onlyLiked?: boolean, sortingOptions?: GetSongsSortingOptionsType, search: string = ''): Promise<GetSongsResponseDataType> {
        let songs: Array<SongRecordType> = [];
        options = !options || typeof options === 'object' ? options : JSON.parse(options);
        const songsToSkip = +limit * +offset;
        let likedSongIds: Array<string>;
        if (onlyLiked) {
            const likedSongs = await PlaylistModel.findOne({ listenerId: listenerId, tag: 'liked' }).lean();
            likedSongIds = likedSongs.songIds.map(song => song.id);
        }
        if (!options) {
            search = search.replace('/', '');
            songs = await SongModel.find({ name: { $regex: search, $options: 'i' } })
                .sort({ plays: -1 }).skip(songsToSkip).limit(+limit).lean();
        } else {
            const playlistId = options.playlistId;
            const albumId = options.albumId;
            const artistId = options.artistId;
            const optionsListenerId = options.listenerId;
            const songRadioBaseSongId = options.songRadioBaseSongId;
            if (playlistId) {
                const songsAggregate = await PlaylistModel.aggregate([
                    { $match: { _id: playlistId } },
                    { $unwind: '$songIds' },
                    {
                        $lookup: {
                            from: 'songs',
                            localField: 'songIds.id',
                            foreignField: '_id',
                            as: 'matchedSong'
                        }
                    },
                    { $unwind: '$matchedSong' },
                    {
                        $project: {
                            _id: 0,
                            song: {
                                $mergeObjects: [
                                    '$matchedSong',
                                    { date: '$songIds.date' }
                                ]
                            }
                        }
                    },
                    { $match: { 'song.date': { $exists: true } } },
                    { $sort: { 'song.date': -1 } },
                    { $skip: songsToSkip },
                    { $limit: +limit }
                ]);
                songs = songsAggregate.map(songAggregate => ({ ...songAggregate.song }));
            } else if (albumId) {
                const album = await AlbumModel.findOne({ _id: albumId }).lean();
                const allSongs = await SongModel.find({ _id: { $in: album.songIds } }).lean();
                const sortedSongs = allSongs.sort((a, b) => album.songIds.indexOf(a._id) - album.songIds.indexOf(b._id));
                songs = sortedSongs.slice(songsToSkip, +limit + songsToSkip);
            } else if (artistId) {
                const sortingRequest = this.getSortingRequest(sortingOptions);
                const findRequest: any = { artistId: artistId };
                if (likedSongIds) {
                    findRequest._id = { $in: likedSongIds };
                }
                songs = await SongModel.find(findRequest).sort(sortingRequest).skip(songsToSkip).limit(+limit).lean();
            } else if (songRadioBaseSongId) {
                const songRadio = await SongRadioModel.findOne({ listenerId: listenerId, baseSongId: songRadioBaseSongId }).lean();
                const allSongs = await SongModel.find({ _id: { $in: songRadio.songIds } }).lean();
                const sortedSongs = allSongs.sort((a, b) => songRadio.songIds.indexOf(a._id) - songRadio.songIds.indexOf(b._id));
                songs = sortedSongs.slice(songsToSkip, +limit + songsToSkip);
            } else if (optionsListenerId) {
                const listenerData = await ListenerModel.findOne({ _id: optionsListenerId }, { topSongsThisMonth: 1 }).lean();
                if (listenerData.topSongsThisMonth?.length) {
                    const allSongs = await SongModel.find({ _id: { $in: listenerData.topSongsThisMonth } }).lean();
                    const sortedSongs = allSongs.sort((a, b) => listenerData.topSongsThisMonth.indexOf(a._id) - listenerData.topSongsThisMonth.indexOf(b._id));
                    songs = sortedSongs.slice(songsToSkip, +limit + songsToSkip);
                }
            }
        }
        const songsResponse: Array<SongInfoResponseDataType> = [];
        for (const song of songs) {
            const songFormated: SongInfoResponseDataType = await this.formatSongData(listenerId, song);
            songsResponse.push(songFormated);
        }

        return {
            songs: songsResponse,
            isMoreSongsForLoading: songs.length === +limit
        };
    }

    async recordSongPlayRowData(listenerId: string, songId: string, time: number) {
        const rowDataId = randomstring.generate(16);
        await SongPlaysRawDataModel.create({
            _id: rowDataId,
            listenerId: listenerId,
            songId: songId,
            time: time,
            date: new Date()
        })
    }

    async formatSongData(listenerId: string, song: SongRecordType): Promise<SongInfoResponseDataType> {
        const album = await AlbumModel.findOne({ _id: song.albumId }).lean();
        const artists = await this._getSongArtists(song);

        const playlists = await PlaylistModel.find({ listenerId, songIds: { $elemMatch: { id: song._id } } }).lean();
        const playlistIds = playlists.map(playlist => playlist._id);

        const songDto = new SongDto(song);
        return {
            ...songDto,
            album: {
                id: song.albumId,
                name: album.name
            },
            artists,
            coverImageUrl: song.coverImageUrl,
            backgroundColor: song.backgroundColor,
            lyricsBackgroundShadow: song.lyricsBackgroundShadow,
            songUrl: song.songUrl,
            playlistIds
        };
    }

    async _getSongArtists(song: SongRecordType): Promise<Array<ArtistShortDataType>> {
        const artist = await ArtistModel.findOne({ _id: song.artistId }).lean();
        const artists: Array<ArtistShortDataType> = [{
            id: song.artistId,
            name: artist.name
        }]
        for (const songCoArtistId of song.coArtistIds) {
            const coArtist = await ArtistModel.findOne({ _id: songCoArtistId }).lean();
            artists.push({
                id: coArtist._id,
                name: coArtist.name
            })
        }
        return artists;
    }

    getSortingRequest(sortingOptions: GetSongsSortingOptionsType) {
        const sortingRequest: any = {};
        if (sortingOptions) {

            if (sortingOptions.plays) {
                sortingRequest.plays = sortingOptions.plays;
            } else if (sortingOptions.name) {

            } else if (sortingOptions.album) {

            } else if (sortingOptions.date) {

            } else if (sortingOptions.duration) {

            }
        }
        sortingRequest.date = -1;
        return sortingRequest;
    }

    async getArtistAlbumSongs(artistId: string, albumId: string): Promise<GetArtistSongsResponseDataType> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        const artistProfile = await ArtistProfileModel.findOne({ _id: artistId }).lean();
        if (!artist || !artistProfile) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const album = await AlbumModel.findOne({ _id: albumId }).lean();
        if (!album) {
            throw new NotFoundError(`Album with id ${albumId} not found`);
        }
        const allSongs = await SongModel.find({ _id: { $in: album.songIds } }).lean();
        const sortedSongs = allSongs.sort((a, b) => album.songIds.indexOf(a._id) - album.songIds.indexOf(b._id));
        const responseSongs: Array<ArtistSongInfoResponseDataType> = [];
        for (let song of sortedSongs) {
            let coArtists = [];
            for (const songCoArtistId of song.coArtistIds) {
                const coArtist = await ArtistModel.findOne({ _id: songCoArtistId }).lean();
                coArtists.push({
                    id: coArtist._id,
                    name: coArtist.name
                })
            }
            responseSongs.push({ ...song, songId: song._id, coArtists: coArtists });
        };
        return { songs: responseSongs };
    }

    async hideSong(artistId: string, songId: string): Promise<void> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        const artistProfile = await ArtistProfileModel.findOne({ _id: artistId }).lean();
        if (!artist || !artistProfile) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const song = await SongModel.findOne({ _id: songId, artistId: artistId }).lean();
        if (!song) {
            throw new NotFoundError(`Song with id ${songId} not found for artist with id ${artistId}`);
        }
        await SongModel.updateOne({ _id: songId }, { $set: { hidden: true } });
    }

    async unhideSong(artistId: string, songId: string): Promise<void> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        const artistProfile = await ArtistProfileModel.findOne({ _id: artistId }).lean();
        if (!artist || !artistProfile) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const song = await SongModel.findOne({ _id: songId, artistId: artistId }).lean();
        if (!song) {
            throw new NotFoundError(`Song with id ${songId} not found for artist with id ${artistId}`);
        }
        await SongModel.updateOne({ _id: songId }, { $set: { hidden: false } });
    }

}

const songService = new SongService();
export default songService;