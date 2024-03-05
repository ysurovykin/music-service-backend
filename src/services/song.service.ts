import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import mm from 'music-metadata';
import { storage } from '../../firebase.config';
import SongModel, {
    CreateSongRequestDataType,
    GetSongsOptionsType,
    GetSongsResponseDataType,
    SongInfoResponseDataType,
    SongRecordType
} from '../models/song.model';
import AlbumModel from '../models/album.model';
import { NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';
import SongDto from '../dtos/song.dto';
import ArtistModel from '../models/artist.model';
import PlaylistModel from '../models/playlist.model';
import { ArtistShortDataType } from '../models/artist.model';

class SongService {

    async upload(songData: CreateSongRequestDataType, file: Express.Multer.File): Promise<void> {
        const album = await AlbumModel.findOne({ _id: songData.albumId }).lean();
        if (!album) {
            throw new NotFoundError(`Album with id ${songData.albumId} not found`);
        }
        const songMetadata = await mm.parseBuffer(file.buffer, 'audio/mpeg');
        const duration = songMetadata.format.duration;
        const songId = randomstring.generate(16);

        const artist = await ArtistModel.findOne({ _id: album.artistId }, { genres: 1, languages: 1 }).lean();
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
        songIds.length = Math.max(songIds.length, songData.indexInAlbum);
        songIds[songData.indexInAlbum - 1] = songId;
        await AlbumModel.updateOne({ _id: album._id }, {
            $set: { genres: albumGenres, languages: albumLanguages, songIds }
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
        let coArtistIds = []
        if (songData.coArtistIds) {
            coArtistIds = typeof songData.coArtistIds === 'string' ? JSON.parse(songData.coArtistIds) : songData.coArtistIds;
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
            lyricsBackgroundShadow: album.lyricsBackgroundShadow,
            songUrl,
            duration,
            date: new Date()
        });
    }

    async getSongById(listenerId: string, songId: string): Promise<SongInfoResponseDataType> {
        const song = await SongModel.findOne({ _id: songId }).lean();
        if (!song) {
            throw new NotFoundError(`Song with id ${songId} not found`);
        }
        const songInfo = await this.formatSongData(listenerId, song);
        return songInfo;
    }

    async getSongs(listenerId: string, options: GetSongsOptionsType, offset: number = 0,
        limit: number = 10): Promise<GetSongsResponseDataType> {
        let songs: Array<SongRecordType> = [];
        options = typeof options === 'object' ? options : JSON.parse(options);
        const songsToSkip = limit * offset;
        if (options.playlistId) {
            const playlistSongs = await PlaylistModel.findOne({ _id: options.playlistId }, { songIds: 1 }).lean();
            const songIds = playlistSongs.songIds.slice(songsToSkip, limit + (songsToSkip));
            songs = await SongModel.find({ _id: { $in: songIds } }).lean();
        } else {
            songs = await SongModel.find({ ...options }).skip(songsToSkip).limit(limit).lean();
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

    async formatSongData(listenerId: string, song: SongRecordType): Promise<SongInfoResponseDataType> {
        const album = await AlbumModel.findOne({ _id: song.albumId }).lean();
        const artists = await this._getSongArtists(song);

        const playlists = await PlaylistModel.find({ listenerId, songIds: { $elemMatch: { $eq: song._id } } }).lean();
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

}

const songService = new SongService();
export default songService;