import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import mm from 'music-metadata';
import { storage } from '../../firebase.config';
import SongModel, { CreateSongRequestDataType, EditedPlaylistType, SongInfoResponseDataType, SongRecordType } from '../models/song.model';
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
            coverImageUrl: album.coverImageUrl,
            artistId: songData.artistId,
            coArtistIds: songData.coArtistIds,
            albumId: album._id,
            songUrl,
            duration,
            date: new Date()
        });
    }

    async getSongById(songId: string): Promise<SongInfoResponseDataType> {
        const song = await SongModel.findOne({ _id: songId }).lean();
        if (!song) {
            throw new NotFoundError(`Song with id ${songId} not found`);
        }
        const songInfo = await this.formatSongData(song);
        return songInfo;
    }

    async editPlaylists(songId: string, editedPlaylists: Array<EditedPlaylistType>): Promise<void> {
        const song = await SongModel.findOne({ _id: songId }).lean();
        if (!song) {
            throw new NotFoundError(`Song with id ${songId} not found`);
        }
        const formatedSong = await this.formatSongData(song);
        for (let playlistToEdit of editedPlaylists) {
            if (playlistToEdit.added) {
                await PlaylistModel.updateOne({ _id: playlistToEdit.playlistId }, { $push: { songs: formatedSong } });
            } else {
                await PlaylistModel.updateOne({ _id: playlistToEdit.playlistId }, { $pull: { songs: { songId } } });
            }
        }
    }

    async formatSongData(song: SongRecordType): Promise<SongInfoResponseDataType> {
        const album = await AlbumModel.findOne({ _id: song.albumId }).lean();
        const artists = await this._getSongArtists(song);

        const playlists = await PlaylistModel.find({ songs: { $elemMatch: { songId: song._id } } }).lean();
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