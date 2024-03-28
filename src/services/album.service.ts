import { storage } from '../../firebase.config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import AlbumModel, { AlbumFullResponseDataType, AlbumInfoResponseDataType, CreateAlbumRequestDataType, GetAlbumsInListenerLibraryResponseType, GetAlbumsResponseType } from '../models/album.model';
import ArtistModel, { ArtistShortDataType } from '../models/artist.model';
import LikedAlbumstModel from '../models/likedAlbums.model';
import { ForbiddenError, NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';
import SongModel from '../models/song.model';
import { getDominantColorWithShadow } from '../helpers/imageCoverColor.helper';
import AlbumDto from '../dtos/album.dto';
import listenerService from './listener.service';

class AlbumService {

    async create(albumData: CreateAlbumRequestDataType, file: Express.Multer.File): Promise<any> {
        const artist = await ArtistModel.findOne({ _id: albumData.artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${albumData.artistId} not found`);
        }
        const album = await AlbumModel.findOne({ artistId: artist._id, name: albumData.name }).lean();
        if (album) {
            throw new ForbiddenError(`Album ${albumData.name} already exists for artist with id ${albumData.artistId}`);
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
            languages: [],
            genres: [],
            backgroundColor: backgroundColor.backgroundColor,
            lyricsBackgroundShadow: backgroundColor.lyricsBackgroundShadow,
            date: new Date()
        });
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

        const albums = await AlbumModel.find({ artistId }).lean();
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
        const albums = await AlbumModel.find({ _id: { $in: albumIds } }).lean();
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
        const likedAlbums = await LikedAlbumstModel.find({ listenerId: listenerId })
            .sort({ date: -1 }).skip(+offset * +limit).limit(+limit).lean();
        const albumIds = likedAlbums.map(likedAlbum => likedAlbum.albumId);
        search = search.replace('/', '');
        const albums = await AlbumModel.find({ _id: { $in: albumIds }, name: { $regex: search, $options: 'i' } }).lean();
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

    async getAlbums(offset: number = 0, limit: number = 10, search: string = ''): Promise<GetAlbumsResponseType> {
        search = search.replace('/', '');
        const albums = await AlbumModel.find({ name: { $regex: search, $options: 'i' } }).sort({ likes: -1 })
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


}

const albumService = new AlbumService();
export default albumService;