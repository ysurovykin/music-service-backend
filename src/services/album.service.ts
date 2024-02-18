import { storage } from '../../firebase.config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AlbumFullResponseDataType, AlbumInfoResponseDataType, CreateAlbumRequestDataType } from '../models/album.model';
import ArtistModel, { ArtistShortDataType } from '../models/artist.model';
import AlbumModel from '../models/album.model';
import SongModel, { SongInfoResponseDataType } from '../models/song.model';
import { ForbiddenError, NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';
import songService from '../services/song.service'

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
        const coverImageUrl = `album-covers/${artist._id}/${albumId}`;
        await AlbumModel.create({
            _id: albumId,
            name: albumData.name,
            artistId: artist._id,
            coverImageUrl,
            languages: albumData.languages,
            genres: albumData.genres,
            date: new Date()
        });

        const storageRef = ref(storage, coverImageUrl);
        await uploadBytes(storageRef, file.buffer, { contentType: 'image/jpeg' });
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
            let coverImageUrl: string;
            if (album.coverImageUrl) {
                const storageCoverImageRef = ref(storage, `${album.coverImageUrl}`);
                coverImageUrl = await getDownloadURL(storageCoverImageRef);
            }
            albumDatas.push({
                albumId: album._id,
                artist: artistData,
                name: album.name,
                date: album.date,
                coverImageUrl
            });
        }
        return albumDatas;
    }

    async getAlbumById(albumId: string): Promise<AlbumFullResponseDataType> {
        const album = await AlbumModel.findOne({ _id: albumId }).lean();
        if (!albumId) {
            throw new NotFoundError(`Album with id ${albumId} not found`);
        }
        
        let coverImageUrl: string;
        if (album.coverImageUrl) {
            const storageCoverImageRef = ref(storage, `${album.coverImageUrl}`);
            coverImageUrl = await getDownloadURL(storageCoverImageRef);
        }

        const artist = await ArtistModel.findOne({ _id: album.artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${album.artistId} not found`);
        }
        const artistData: ArtistShortDataType = {
            name: artist.name,
            id: artist._id
        };

        const albumSongs = await SongModel.find({ albumId: albumId }).lean();
        const albumSongUrls: Array<SongInfoResponseDataType> = [];
        for (const albumSong of albumSongs) {
            const formatedSong = await songService.formatSongData(albumSong);
            albumSongUrls.push(formatedSong);
        }

        return {
            albumId,
            likes: album.likes,
            name: album.name,
            date: album.date,
            songs: albumSongUrls,
            coverImageUrl,
            artist: artistData
        };
    }

}

const albumService = new AlbumService();
export default albumService;