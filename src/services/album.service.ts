import { storage } from '../../firebase.config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AlbumInfoResponseDataType, CreateAlbumRequestDataType } from '../models/album.model';
import ArtistModel, { ArtistShortDataType } from '../models/artist.model';
import AlbumModel from '../models/album.model';
import PlaylistModel from '../models/playlist.model';
import SongModel, { SongInfoResponseDataType } from '../models/song.model';
import { ForbiddenError, NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';
import SongDto from '../dtos/song.dto';
import { getDominantColorWithShadow } from '../helpers/image-cover-color.helper';

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
            languages: albumData.languages,
            genres: albumData.genres,
            backgroundColor: backgroundColor.backgroundColor,
            lyricsBackgroundShadow: backgroundColor.lyricsBackgroundShadow,
            date: new Date()
        });
    }

    async getAlbumsByArtistId(artistId: string): Promise<Array<AlbumInfoResponseDataType>> {
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
            albumDatas.push({
                albumId: album._id,
                artist: artistData,
                name: album.name,
                date: album.date,
                coverImageUrl: album.coverImageUrl,
                backgroundColor: album.backgroundColor,
                lyricsBackgroundShadow: album.lyricsBackgroundShadow
            });
        }
        return albumDatas;
    }

    async getAlbumById(albumId: string): Promise<AlbumInfoResponseDataType> {
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

        return {
            albumId,
            name: album.name,
            date: album.date,
            coverImageUrl: album.coverImageUrl,
            backgroundColor: album.backgroundColor,
            lyricsBackgroundShadow: album.lyricsBackgroundShadow,
            artist: artistData
        };
    }

}

const albumService = new AlbumService();
export default albumService;