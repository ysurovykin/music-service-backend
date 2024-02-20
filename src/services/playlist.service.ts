import { storage } from '../../firebase.config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { PlaylistFullResponseDataType, PlaylistInfoResponseDataType, CreatePlaylistRequestDataType, PlaylistTagEnum } from '../models/playlist.model';
import ListenerModel from '../models/listener.model';
import PlaylistModel from '../models/playlist.model';
import SongModel, { SongInfoResponseDataType } from '../models/song.model';
import { NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';
import songService from './song.service'
import { getCoverDominantColor } from '../helpers/image-cover-color.helper';

class PlaylistService {

    async create(playlistData: CreatePlaylistRequestDataType, file: Express.Multer.File): Promise<any> {
        const listener = await ListenerModel.findOne({ _id: playlistData.listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${playlistData.listenerId} not found`);
        }
        const playlistId = randomstring.generate(16);

        const songs: Array<SongInfoResponseDataType> = [];
        if (playlistData.songIds?.length) {
            const songsToAdd = await SongModel.find({ _id: { $in: playlistData.songIds } }).lean();
            for (const song of songsToAdd) {
                const formatedSong = await songService.formatSongData(song);
                songs.push(formatedSong);
            }
        }

        const downloadUrl = `playlist-covers/${listener._id}/${playlistId}`;
        const storageRef = ref(storage, downloadUrl);
        await uploadBytes(storageRef, file.buffer, { contentType: 'image/jpeg' });
        let coverImageUrl = await getDownloadURL(storageRef);
        const indexOfTokenQuery = coverImageUrl.indexOf('&token')
        if (indexOfTokenQuery) {
            coverImageUrl = coverImageUrl.slice(0, indexOfTokenQuery);
        }
        const backgroundColor = await getCoverDominantColor(coverImageUrl);

        await PlaylistModel.create({
            _id: playlistId,
            name: playlistData.name,
            listenerId: listener._id,
            coverImageUrl,
            date: new Date(),
            backgroundColor,
            songs
        });
    }

    async getPlaylistsByListenerId(listenerId: string): Promise<Array<PlaylistInfoResponseDataType>> {
        const artist = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!artist) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        const playlists = await PlaylistModel.find({ listenerId }).lean();
        const playlistDatas: Array<PlaylistInfoResponseDataType> = [];
        for (const playlist of playlists) {
            playlistDatas.push({
                playlistId: playlist._id,
                name: playlist.name,
                date: playlist.date,
                tag: playlist.tag as PlaylistTagEnum,
                coverImageUrl: playlist.coverImageUrl,
                backgroundColor: playlist.backgroundColor
            });
        }
        return playlistDatas;
    }

    async getPlaylistById(playlistId: string): Promise<PlaylistFullResponseDataType> {
        const playlist = await PlaylistModel.findOne({ _id: playlistId }).lean();
        if (!playlistId) {
            throw new NotFoundError(`Playlist with id ${playlistId} not found`);
        }

        return {
            playlistId,
            name: playlist.name,
            date: playlist.date,
            songs: playlist.songs,
            coverImageUrl: playlist.coverImageUrl,
            backgroundColor: playlist.backgroundColor,
            tag: playlist.tag as PlaylistTagEnum
        };
    }

}

const playlistService = new PlaylistService();
export default playlistService;