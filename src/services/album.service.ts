import { storage } from '../../firebase.config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AlbumInfoResponseDataType, CreateAlbumRequestDataType } from '../models/album.model';
import ArtistModel, { ArtistShortDataType } from '../models/artist.model';
import AlbumModel from '../models/album.model';
import LikedAlbumstModel from '../models/liked-albums.model';
import { ForbiddenError, NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';
import SongDto from '../dtos/song.dto';
import { getDominantColorWithShadow } from '../helpers/image-cover-color.helper';
import AlbumDto from '../dtos/album.dto';

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

    async getAlbumById(listenerId: string, albumId: string): Promise<AlbumInfoResponseDataType> {
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
        const albumDto = new AlbumDto(album);
        return {
            ...albumDto,
            artist: artistData,
            isAddedToLibrary: !!likedAlbumInfo
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

}

const albumService = new AlbumService();
export default albumService;