import { storage } from '../../firebase.config';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { PlaylistInfoResponseDataType, CreatePlaylistRequestDataType, PlaylistTagEnum, EditedPlaylistType, EditPlaylistRequestDataType, PlaylistFullResponseDataType } from '../models/playlist.model';
import ListenerModel from '../models/listener.model';
import PlaylistModel from '../models/playlist.model';
import SongModel from '../models/song.model';
import { NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';
import { getCoverDominantColor } from '../helpers/image-cover-color.helper';
import listenerService from './listener.service';
import PlaylistDto from '../dtos/playlist.dto';

class PlaylistService {

    async create(listenerId: string, playlistData: CreatePlaylistRequestDataType, file: Express.Multer.File): Promise<void> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        const playlistId = randomstring.generate(16);
        let songIds = [];
        if (playlistData.songIds?.length) {
            songIds = playlistData.songIds.map(songId => ({ id: songId, date: new Date() }));
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
            songIds: songIds,
            editable: true,
            date: new Date(),
            backgroundColor
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
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        const playlists = await PlaylistModel.find({ listenerId }).sort({ pinned: -1, date: -1 }).lean();
        const playlistDatas: Array<PlaylistInfoResponseDataType> = [];
        for (const playlist of playlists) {
            const coverImageUrl = playlist.coverImageUrl ?
                playlist.coverImageUrl + '&token=' + randomstring.generate(16) :
                '';
            const playlistDto = new PlaylistDto(playlist)
            playlistDatas.push({
                ...playlistDto,
                coverImageUrl: coverImageUrl
            });
        }
        return playlistDatas;
    }

    async getPlaylistById(playlistId: string): Promise<PlaylistFullResponseDataType> {
        const playlist = await PlaylistModel.findOne({ _id: playlistId }).lean();
        if (!playlistId) {
            throw new NotFoundError(`Playlist with id ${playlistId} not found`);
        }
        const coverImageUrl = playlist.coverImageUrl ?
            playlist.coverImageUrl + '&token=' + randomstring.generate(16) :
            '';
        const songIds = playlist.songIds.map(song => song.id);
        const songsInfo = await SongModel.aggregate([
            { $match: { _id: { $in: songIds } } },
            {
                $group: {
                    _id: null,
                    totalDuration: { $sum: '$duration' },
                    totalCount: { $count: {} }
                }
            },
        ]);

        const playlistDto = new PlaylistDto(playlist);

        await listenerService._updateVisitedContent(playlist.listenerId, 'playlist', {
            ...playlistDto,
            coverImageUrl: coverImageUrl,
            type: 'playlist'
        });

        return {
            ...playlistDto,
            coverImageUrl: coverImageUrl,
            songsTimeDuration: +songsInfo[0]?.totalDuration,
            songsCount: +songsInfo[0]?.totalCount
        };
    }

    async editSongPlaylists(listenerId: string, songId: string, editedPlaylists: Array<EditedPlaylistType>): Promise<Array<string>> {
        for (let playlistToEdit of editedPlaylists) {
            if (playlistToEdit.added) {
                await PlaylistModel.updateOne({ _id: playlistToEdit.playlistId }, {
                    $push: { songIds: { id: songId, date: new Date() } }
                });
            } else {
                await PlaylistModel.updateOne({ _id: playlistToEdit.playlistId }, {
                    $pull: { songIds: { id: songId } }
                });
            }
        }
        const playlists = await PlaylistModel.find({ listenerId, songIds: { $elemMatch: { id: songId } } }).lean();
        const playlistIds = playlists.map(playlist => playlist._id);

        return playlistIds;
    }

    async pinPlaylist(listenerId: string, playlistId: string): Promise<void> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        await PlaylistModel.updateOne({ listenerId: listenerId, _id: playlistId }, { $set: { pinned: true } });
    }

    async unpinPlaylist(listenerId: string, playlistId: string): Promise<void> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        await PlaylistModel.updateOne({ listenerId: listenerId, _id: playlistId }, { $unset: { pinned: 1 } });
    }

}

const playlistService = new PlaylistService();
export default playlistService;