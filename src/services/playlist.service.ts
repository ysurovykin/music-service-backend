import { storage } from '../../firebase.config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { PlaylistFullResponseDataType, PlaylistInfoResponseDataType, CreatePlaylistRequestDataType } from '../models/playlist.model';
import ListenerModel from '../models/listener.model';
import PlaylistModel from '../models/playlist.model';
import SongModel, { SongInfoResponseDataType, SongRecordType } from '../models/song.model';
import { ForbiddenError, NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';
import songService from './song.service'

class PlaylistService {

    async create(playlistData: CreatePlaylistRequestDataType, file: Express.Multer.File): Promise<any> {
        const listener = await ListenerModel.findOne({ _id: playlistData.listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${playlistData.listenerId} not found`);
        }
        const playlistId = randomstring.generate(16);
        const coverImageUrl = `playlist-covers/${listener._id}/${playlistId}`;

        const songs: Array<SongInfoResponseDataType> = [];
        if (playlistData.songIds?.length) {
            const songsToAdd = await SongModel.find({ _id: { $in: playlistData.songIds } }).lean();
            for (const song of songsToAdd) {
                const formatedSong = await songService.formatSongData(song);
                songs.push(formatedSong);
            }
        }
        await PlaylistModel.create({
            _id: playlistId,
            name: playlistData.name,
            listenerId: listener._id,
            coverImageUrl,
            date: new Date(),
            songs
        });

        const storageRef = ref(storage, coverImageUrl);
        await uploadBytes(storageRef, file.buffer, { contentType: 'image/jpeg' });
    }

    async getPlaylistsByListenerId(listenerId: string): Promise<Array<PlaylistInfoResponseDataType>> {
        const artist = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!artist) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        const playlists = await PlaylistModel.find({ listenerId }).lean();
        const playlistDatas: Array<PlaylistInfoResponseDataType> = [];
        for (const playlist of playlists) {
            const storageCoverImageRef = ref(storage, `${playlist.coverImageUrl}`);
            const coverImageUrl = await getDownloadURL(storageCoverImageRef);
            playlistDatas.push({
                playlistId: playlist._id,
                name: playlist.name,
                date: playlist.date,
                coverImageUrl
            });
        }
        return playlistDatas;
    }

    async getPlaylistById(playlistId: string): Promise<PlaylistFullResponseDataType> {
        const playlist = await PlaylistModel.findOne({ _id: playlistId }).lean();
        if (!playlistId) {
            throw new NotFoundError(`Playlist with id ${playlistId} not found`);
        }
        const storageCoverImageRef = ref(storage, `${playlist.coverImageUrl}`);
        const coverImageUrl = await getDownloadURL(storageCoverImageRef);

        return {
            playlistId,
            name: playlist.name,
            date: playlist.date,
            songs: playlist.songs,
            coverImageUrl
        };
    }

}

const playlistService = new PlaylistService();
export default playlistService;