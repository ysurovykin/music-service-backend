import { storage } from '../../../firebase.config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import AlbumModel, {
    AlbumFullResponseDataType,
    AlbumInfoResponseDataType,
    AlbumStatsResponseDataType,
    ArtistAlbumFullResponseDataType,
    CreateAlbumRequestDataType,
    EditAlbumRequestDataType,
    GetAlbumsInListenerLibraryResponseType,
    GetAlbumsResponseType,
    GetArtistAlbumsResponseType,
    GetListenerTopAlbumsThisMonthResponseType
} from './album.model';
import ArtistModel, { ArtistShortDataType } from '../artist/artist.model';
import LikedAlbumstModel from './likedAlbums.model';
import { ForbiddenError, NotFoundError } from '../../errors/api-errors';
import randomstring from 'randomstring';
import SongModel from '../song/song.model';
import { getCoverDominantColor, getDominantColorWithShadow } from '../../helpers/imageCoverColor.helper';
import AlbumDto from './album.dto';
import listenerService from '../listener/listener.service';
import ListenerModel from '../listener/listener.model';
import ArtistProfileModel from '../artistProfile/artistProfile.model';
import { freeSubscriptionMaxArtistAlbums, paidSubscriptionMaxArtistAlbums } from '../../../config';

class AlbumService {

    async create(artistId: string, albumData: CreateAlbumRequestDataType, file: Express.Multer.File): Promise<void> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        const artistProfile = await ArtistProfileModel.findOne({ _id: artistId }).lean();
        if (!artist || !artistProfile) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const album = await AlbumModel.findOne({ artistId: artist._id, name: albumData.name }).lean();
        if (album) {
            throw new ForbiddenError(`Album ${albumData.name} already exists for artist with id ${artistId}`);
        }
        const artistAlbumsCount = await AlbumModel.count({ artistId: artistId });
        const maxAlbumsLimit = artistProfile.subscription === 'free' ? freeSubscriptionMaxArtistAlbums : paidSubscriptionMaxArtistAlbums;
        if (artistAlbumsCount >= maxAlbumsLimit) {
            throw new ForbiddenError(`Your subscription does not allow to create more than ${maxAlbumsLimit} albums`);
        }
        const albumId = randomstring.generate(16);

        const downloadUrl = `album-covers/${artist._id}/${albumId}`;
        const storageRef = ref(storage, downloadUrl);
        await uploadBytes(storageRef, file.buffer, { contentType: 'image/jpeg' });
        let coverImageUrl = await getDownloadURL(storageRef);
        const indexOfTokenQuery = coverImageUrl.indexOf('&token')
        if (indexOfTokenQuery) {
            coverImageUrl = coverImageUrl.slice(0, indexOfTokenQuery);
        }
        const backgroundColor = await getDominantColorWithShadow(coverImageUrl);

        await AlbumModel.create({
            _id: albumId,
            name: albumData.name,
            artistId: artist._id,
            coverImageUrl,
            languages: {},
            genres: {},
            backgroundColor: backgroundColor.backgroundColor,
            lyricsBackgroundShadow: backgroundColor.lyricsBackgroundShadow,
            date: new Date()
        });
    }

    async edit(artistId: string, albumData: EditAlbumRequestDataType, file: Express.Multer.File): Promise<void> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        const artistProfile = await ArtistProfileModel.findOne({ _id: artistId }).lean();
        if (!artist || !artistProfile) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const album = await AlbumModel.findOne({ _id: albumData.albumId }).lean();
        if (!album) {
            throw new NotFoundError(`Album with id ${albumData.albumId} not found`);
        }
        const artistAlbumsCount = await AlbumModel.count({ artistId: artistId, hidden: { $ne: true } });
        const maxAlbumsLimit = artistProfile.subscription === 'free' ? freeSubscriptionMaxArtistAlbums : paidSubscriptionMaxArtistAlbums;
        if (artistAlbumsCount > maxAlbumsLimit) {
            throw new ForbiddenError(`Your subscription does not allow to have more than ${maxAlbumsLimit} albums active`);
        }
        let fieldsToSet: {};

        if (albumData.name !== album.name) {
            fieldsToSet = {
                ...fieldsToSet,
                name: albumData.name
            };
        }

        if (file) {
            const downloadUrl = `album-covers/${artist._id}/${albumData.albumId}`;
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
        }

        await AlbumModel.updateOne({ _id: albumData.albumId }, { $set: fieldsToSet });
    }

    async getAlbumsByArtistId(listenerId: string, artistId: string): Promise<Array<AlbumInfoResponseDataType>> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const artistData: ArtistShortDataType = {
            name: artist.name,
            id: artist._id
        };

        const albums = await AlbumModel.find({ artistId, hidden: { $ne: true } }).lean();
        const albumDatas: Array<AlbumInfoResponseDataType> = [];
        for (const album of albums) {
            const albumDto = new AlbumDto(album);
            const likedAlbumInfo = await LikedAlbumstModel.findOne({ listenerId: listenerId, albumId: album._id }).lean();
            albumDatas.push({
                ...albumDto,
                artist: artistData,
                isAddedToLibrary: !!likedAlbumInfo
            });
        }
        return albumDatas;
    }

    async getAlbumsWhereArtistAppears(listenerId: string, artistId: string): Promise<Array<AlbumInfoResponseDataType>> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }

        const albumIds = await SongModel.distinct(('albumId'), { coArtistIds: artistId }).lean();
        const albums = await AlbumModel.find({ _id: { $in: albumIds }, hidden: { $ne: true } }).lean();
        const albumDatas: Array<AlbumInfoResponseDataType> = [];
        for (const album of albums) {
            const albumDto = new AlbumDto(album);
            const artist = await ArtistModel.findOne({ _id: album.artistId }, { _id: 1, name: 1 }).lean();
            const likedAlbumInfo = await LikedAlbumstModel.findOne({ listenerId: listenerId, albumId: album._id }).lean();
            albumDatas.push({
                ...albumDto,
                artist: {
                    name: artist.name,
                    id: artist._id
                },
                isAddedToLibrary: !!likedAlbumInfo
            });
        }
        return albumDatas;
    }

    async getAlbumById(listenerId: string, albumId: string): Promise<AlbumFullResponseDataType> {
        const album = await AlbumModel.findOne({ _id: albumId }).lean();
        if (!albumId) {
            throw new NotFoundError(`Album with id ${albumId} not found`);
        }
        if (album.hidden) {
            throw new ForbiddenError(`Album "${album.name}" is currently unavailable`, { hidden: true });
        }
        const artist = await ArtistModel.findOne({ _id: album.artistId }, { _id: 1, name: 1 });
        if (!artist) {
            throw new NotFoundError(`Artist with id ${album.artistId} not found`);
        }
        const artistData: ArtistShortDataType = {
            name: artist.name,
            id: artist._id
        };
        const likedAlbumInfo = await LikedAlbumstModel.findOne({ listenerId: listenerId, albumId: album._id }).lean();
        const songsInfo = await SongModel.aggregate([
            { $match: { albumId: albumId } },
            {
                $group: {
                    _id: null,
                    totalDuration: { $sum: '$duration' },
                    totalCount: { $count: {} }
                }
            },
        ]);
        const albumDto = new AlbumDto(album);

        await listenerService._updateVisitedContent(listenerId, 'album', { ...albumDto, artist: artistData, type: 'album' });

        return {
            ...albumDto,
            artist: artistData,
            isAddedToLibrary: !!likedAlbumInfo,
            songsTimeDuration: songsInfo[0]?.totalDuration,
            songsCount: songsInfo[0]?.totalCount
        };
    }

    async addAlbumToLibrary(listenerId: string, albumId: string): Promise<void> {
        const album = await AlbumModel.findOne({ _id: albumId }).lean();
        if (!album) {
            throw new NotFoundError(`Album with id ${albumId} not found`);
        }
        const id = randomstring.generate(16);
        await LikedAlbumstModel.create({
            _id: id,
            albumId: album._id,
            artistId: album.artistId,
            listenerId: listenerId,
            date: new Date()
        });
    }

    async removeAlbumFromLibrary(listenerId: string, albumId: string): Promise<void> {
        const album = await AlbumModel.findOne({ _id: albumId }).lean();
        if (!album) {
            throw new NotFoundError(`Album with id ${albumId} not found`);
        }
        await LikedAlbumstModel.deleteMany({ listenerId: listenerId, albumId: albumId });
    }

    async getAlbumsInListenerLibrary(listenerId: string, offset: number = 0,
        limit: number = 10, search: string = ''): Promise<GetAlbumsInListenerLibraryResponseType> {
        const likedAlbums = await LikedAlbumstModel.find({ listenerId: listenerId }).sort({ date: -1 }).lean();
        const albumIds = likedAlbums.map(likedAlbum => likedAlbum.albumId);
        search = search.replace('/', '');
        const albums = await AlbumModel.find({ _id: { $in: albumIds }, name: { $regex: search, $options: 'i' }, hidden: { $ne: true } })
            .skip(+offset * +limit).limit(+limit).lean();
        const sortedAlbums = albums.sort((a, b) => albumIds.indexOf(a._id) - albumIds.indexOf(b._id));
        const albumDatas: Array<AlbumInfoResponseDataType> = [];
        for (const album of sortedAlbums) {
            const artist = await ArtistModel.findOne({ _id: album.artistId }, { _id: 1, name: 1 });
            const artistData: ArtistShortDataType = {
                name: artist.name,
                id: artist._id
            };
            const albumDto = new AlbumDto(album);
            albumDatas.push({
                ...albumDto,
                artist: artistData,
                isAddedToLibrary: true
            });
        }
        return {
            likedAlbums: albumDatas,
            isMoreLikedAlbumsForLoading: albumDatas.length === +limit
        };
    }

    async getListenerTopAlbumsThisMonth(listenerId: string, offset: number = 0,
        limit: number = 10, search: string = ''): Promise<GetListenerTopAlbumsThisMonthResponseType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        search = search.replace('/', '');
        const albumIds = listener.topAlbumsThisMonth || [];
        const albums = await AlbumModel.find({ _id: { $in: albumIds }, name: { $regex: search, $options: 'i' }, hidden: { $ne: true } })
            .skip(+offset * +limit).limit(+limit).lean();
        const sortedAlbums = albums.sort((a, b) => albumIds.indexOf(a._id) - albumIds.indexOf(b._id));
        const albumDatas: Array<AlbumInfoResponseDataType> = [];
        for (const album of sortedAlbums) {
            const artist = await ArtistModel.findOne({ _id: album.artistId }, { _id: 1, name: 1 });
            const artistData: ArtistShortDataType = {
                name: artist.name,
                id: artist._id
            };
            const albumDto = new AlbumDto(album);
            albumDatas.push({
                ...albumDto,
                artist: artistData,
                isAddedToLibrary: true
            });
        }
        return {
            topAlbumsThisMonth: albumDatas,
            isMoreTopAlbumsThisMonthForLoading: albumDatas.length === +limit
        };
    }

    async getAlbums(offset: number = 0, limit: number = 10, search: string = ''): Promise<GetAlbumsResponseType> {
        search = search.replace('/', '');
        const albums = await AlbumModel.find({ name: { $regex: search, $options: 'i' }, hidden: { $ne: true } }).sort({ likes: -1 })
            .skip(+offset * +limit).limit(+limit).lean();
        const albumDatas: Array<AlbumInfoResponseDataType> = [];
        for (const album of albums) {
            const artist = await ArtistModel.findOne({ _id: album.artistId }, { _id: 1, name: 1 });
            const artistData: ArtistShortDataType = {
                name: artist.name,
                id: artist._id
            };
            const albumDto = new AlbumDto(album);
            albumDatas.push({
                ...albumDto,
                artist: artistData,
                isAddedToLibrary: false
            });
        }
        return {
            albums: albumDatas,
            isMoreAlbumsForLoading: albumDatas.length === +limit
        };
    }

    async getArtistAlbumById(artistId: string, albumId: string): Promise<ArtistAlbumFullResponseDataType> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        const artistProfile = await ArtistProfileModel.findOne({ _id: artistId }).lean();
        if (!artist || !artistProfile) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const album = await AlbumModel.findOne({ _id: albumId, artistId: artistId }).lean();
        if (!album) {
            throw new NotFoundError(`Album with id ${albumId} not found for artist with id ${artistId}`);
        }
        const albumDto = new AlbumDto(album);
        return {
            ...albumDto
        };
    }

    async getArtistAlbums(artistId: string, offset: number = 0, limit: number = 10, search: string = ''): Promise<GetArtistAlbumsResponseType> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        const artistProfile = await ArtistProfileModel.findOne({ _id: artistId }).lean();
        if (!artist || !artistProfile) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        search = search.replace('/', '');
        const albums = await AlbumModel.find({ artistId: artistId, name: { $regex: search, $options: 'i' } }).sort({ likes: -1 })
            .skip(+offset * +limit).limit(+limit).lean();
        const albumDatas = albums.map(album => new AlbumDto(album));
        return {
            albums: albumDatas,
            isMoreAlbumsForLoading: albumDatas.length === +limit
        };
    }

    async hideAlbum(artistId: string, albumId: string): Promise<void> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        const artistProfile = await ArtistProfileModel.findOne({ _id: artistId }).lean();
        if (!artist || !artistProfile) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const album = await AlbumModel.findOne({ _id: albumId, artistId: artistId }).lean();
        if (!album) {
            throw new NotFoundError(`Album with id ${albumId} not found for artist with id ${artistId}`);
        }
        await AlbumModel.updateOne({ _id: albumId, artistId: artistId }, { $set: { hidden: true } });
        if (album.songIds) {
            await SongModel.updateMany({ _id: { $in: album.songIds } }, { $set: { hidden: true } });
        }
    }

    async unhideAlbum(artistId: string, albumId: string): Promise<void> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        const artistProfile = await ArtistProfileModel.findOne({ _id: artistId }).lean();
        if (!artist || !artistProfile) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const album = await AlbumModel.findOne({ _id: albumId, artistId: artistId }).lean();
        if (!album) {
            throw new NotFoundError(`Album with id ${albumId} not found for artist with id ${artistId}`);
        }
        await AlbumModel.updateOne({ _id: albumId, artistId: artistId }, { $set: { hidden: false } });
        if (album.songIds) {
            await SongModel.updateMany({ _id: { $in: album.songIds } }, { $set: { hidden: false } });
        }
    }

    async getArtistAlbumsStats(artistId: string): Promise<Array<AlbumStatsResponseDataType>> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        const artistProfile = await ArtistProfileModel.findOne({ _id: artistId }).lean();
        if (!artist || !artistProfile) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const albums = await AlbumModel.find({ artistId: artistId }).lean();
        const isFreeSubscription = artistProfile?.subscription == 'free';
        const parsedAlbums = albums.map(album => ({
            albumId: album._id,
            name: album.name,
            date: album.date,
            coverImageUrl: album.coverImageUrl,
            hidden: album.hidden,
            backgroundColor: album.backgroundColor,
            generalStats: album.generalStats,
            advancedStats: isFreeSubscription ? undefined : album.advancedStats
        }));
        return parsedAlbums;
    }

}

const albumService = new AlbumService();
export default albumService;