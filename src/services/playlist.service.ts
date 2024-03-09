import { storage } from '../../firebase.config';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { PlaylistInfoResponseDataType, CreatePlaylistRequestDataType, PlaylistTagEnum, EditedPlaylistType, EditPlaylistRequestDataType } from '../models/playlist.model';
import ListenerModel from '../models/listener.model';
import PlaylistModel from '../models/playlist.model';
import SongModel, { SongInfoResponseDataType } from '../models/song.model';
import { NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';
import songService from './song.service'
import { getCoverDominantColor } from '../helpers/image-cover-color.helper';

class PlaylistService {

    async create(listenerId: string, playlistData: CreatePlaylistRequestDataType, file: Express.Multer.File): Promise<any> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        const playlistId = randomstring.generate(16);

        const songs: Array<SongInfoResponseDataType> = [];
        if (playlistData.songIds?.length) {
            const songsToAdd = await SongModel.find({ _id: { $in: playlistData.songIds } }).lean();
            for (const song of songsToAdd) {
                const formatedSong = await songService.formatSongData(listener._id, song);
                songs.push(formatedSong);
            }
        }
        let coverImageUrl: string;
        let backgroundColor: string;
        if (file) {
            const downloadUrl = `playlist-covers/${listener._id}/${playlistId}`;
            const storageRef = ref(storage, downloadUrl);
            await uploadBytes(storageRef, file.buffer, { contentType: 'image/jpeg' });
            coverImageUrl = await getDownloadURL(storageRef);
            const indexOfTokenQuery = coverImageUrl.indexOf('&token')
            if (indexOfTokenQuery) {
                coverImageUrl = coverImageUrl.slice(0, indexOfTokenQuery);
            }
            backgroundColor = await getCoverDominantColor(coverImageUrl);
        } else {
            backgroundColor = playlistData.backgroundColor || 'rgb(17, 102, 11)';
        }
        await PlaylistModel.create({
            _id: playlistId,
            name: playlistData.name,
            description: playlistData.description,
            listenerId: listener._id,
            coverImageUrl,
            songIds: playlistData.songIds,
            editable: true,
            date: new Date(),
            backgroundColor,
            songs
        });
    }

    async editPlaylistById(listenerId: string, playlistData: EditPlaylistRequestDataType, file: Express.Multer.File): Promise<any> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        const playlist = await PlaylistModel.findOne({ _id: playlistData.playlistId }).lean();
        if (!playlist) {
            throw new NotFoundError(`Playlist with id ${playlistData.playlistId} not found`);
        }
        let fieldsToSet: {};
        let fieldsToUnset: {};
        if (file) {
            const downloadUrl = `playlist-covers/${listener._id}/${playlistData.playlistId}`;
            const storageRef = ref(storage, downloadUrl);
            await uploadBytes(storageRef, file.buffer, { contentType: 'image/jpeg' });
            let coverImageUrl = await getDownloadURL(storageRef);
            const indexOfTokenQuery = coverImageUrl.indexOf('&token')
            if (indexOfTokenQuery) {
                coverImageUrl = coverImageUrl.slice(0, indexOfTokenQuery);
            }
            const backgroundColor = await getCoverDominantColor(coverImageUrl);
            fieldsToSet = {
                ...fieldsToSet,
                coverImageUrl: coverImageUrl,
                backgroundColor: backgroundColor
            };
        } else if (playlistData.backgroundColor !== playlist.backgroundColor) {
            if (playlist.coverImageUrl) {
                try {
                    const downloadUrl = `playlist-covers/${listener._id}/${playlistData.playlistId}`;
                    const storageRef = ref(storage, downloadUrl);
                    await deleteObject(storageRef);
                } catch (error) {
                    console.error('Error while deleting playlist cover image', error);
                }
            }
            const backgroundColor = playlistData.backgroundColor || 'rgb(17, 102, 11)';
            fieldsToSet = {
                ...fieldsToSet,
                backgroundColor: backgroundColor
            };
            fieldsToUnset = {
                ...fieldsToUnset,
                coverImageUrl: 1
            };
        }

        if (playlistData.name !== playlist.name) {
            fieldsToSet = {
                ...fieldsToSet,
                name: playlistData.name
            };
        }

        if (playlistData.description !== playlist.description) {
            fieldsToSet = {
                ...fieldsToSet,
                description: playlistData.description
            };
        }

        if (fieldsToUnset && fieldsToSet) {
            await PlaylistModel.updateOne({ _id: playlistData.playlistId }, { $set: fieldsToSet, $unset: fieldsToUnset });
        } else if (fieldsToSet) {
            await PlaylistModel.updateOne({ _id: playlistData.playlistId }, { $set: fieldsToSet });
        }
    }

    async getPlaylistsByListenerId(listenerId: string): Promise<Array<PlaylistInfoResponseDataType>> {
        const artist = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!artist) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        const playlists = await PlaylistModel.find({ listenerId }).lean();
        const playlistDatas: Array<PlaylistInfoResponseDataType> = [];
        for (const playlist of playlists) {
            const coverImageUrl = playlist.coverImageUrl ?
                playlist.coverImageUrl + '&token=' + randomstring.generate(16) :
                '';
            playlistDatas.push({
                playlistId: playlist._id,
                name: playlist.name,
                description: playlist.description,
                date: playlist.date,
                editable: playlist.editable,
                tag: playlist.tag as PlaylistTagEnum,
                coverImageUrl: coverImageUrl,
                backgroundColor: playlist.backgroundColor
            });
        }
        return playlistDatas;
    }

    async getPlaylistById(playlistId: string): Promise<PlaylistInfoResponseDataType> {
        const playlist = await PlaylistModel.findOne({ _id: playlistId }).lean();
        if (!playlistId) {
            throw new NotFoundError(`Playlist with id ${playlistId} not found`);
        }
        const coverImageUrl = playlist.coverImageUrl ?
            playlist.coverImageUrl + '&token=' + randomstring.generate(16) :
            '';
        return {
            playlistId,
            name: playlist.name,
            description: playlist.description,
            date: playlist.date,
            editable: playlist.editable,
            coverImageUrl: coverImageUrl,
            backgroundColor: playlist.backgroundColor,
            tag: playlist.tag as PlaylistTagEnum
        };
    }

    async editSongPlaylists(listenerId: string, songId: string, editedPlaylists: Array<EditedPlaylistType>): Promise<Array<string>> {
        for (let playlistToEdit of editedPlaylists) {
            if (playlistToEdit.added) {
                await PlaylistModel.updateOne({ _id: playlistToEdit.playlistId }, { $push: { songIds: songId } });
            } else {
                await PlaylistModel.updateOne({ _id: playlistToEdit.playlistId }, { $pull: { songIds: songId } });
            }
        }
        const playlists = await PlaylistModel.find({ listenerId, songIds: { $elemMatch: { $eq: songId } } }).lean();
        const playlistIds = playlists.map(playlist => playlist._id);

        return playlistIds;
    }

}

const playlistService = new PlaylistService();
export default playlistService;