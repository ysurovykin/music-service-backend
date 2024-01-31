import { storage } from '../../firebase.config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AlbumArtistDataType, AlbumFullResponseDataType, AlbumInfoResponseDataType, AlbumSongDataType, CreateAlbumRequestDataType } from '../models/album.model';
import ArtistModel from '../models/artist.model';
import AlbumModel from '../models/album.model';
import SongModel from '../models/song.model';
import { ForbiddenError, NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';

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
        const coverImageLink = `album-covers/${artist._id}/${albumId}`;
        await AlbumModel.create({
            _id: albumId,
            name: albumData.name,
            artistId: artist._id,
            coverImageLink,
            languages: albumData.languages,
            genres: albumData.genres,
            date: new Date()
        });

        const storageRef = ref(storage, coverImageLink);
        await uploadBytes(storageRef, file.buffer, { contentType: 'image/jpeg' });
    }

    async getAlbumsByArtistId(artistId: string): Promise<Array<AlbumInfoResponseDataType>> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const artistData: AlbumArtistDataType = {
            name: artist.name,
            link: artist._id
        };

        const albums = await AlbumModel.find({ artistId }).lean();
        const albumDatas: Array<AlbumInfoResponseDataType> = [];
        for (const album of albums) {
            const storageCoverImageRef = ref(storage, `${album.coverImageLink}`);
            const coverImageUrl = await getDownloadURL(storageCoverImageRef);
            albumDatas.push({
                albumId: album._id,
                artist: artistData,
                name: album.name,
                date: album.date,
                downloadUrl: coverImageUrl
            });
        }
        return albumDatas;
    }

    async getAlbumById(albumId: string): Promise<AlbumFullResponseDataType> {
        const album = await AlbumModel.findOne({ _id: albumId }).lean();
        if (!albumId) {
            throw new NotFoundError(`Artist with id ${album.artistId} not found`);
        }
        const storageCoverImageRef = ref(storage, `${album.coverImageLink}`);
        const coverImageUrl = await getDownloadURL(storageCoverImageRef);

        const albumSongs = await SongModel.find({ albumId: albumId }).lean();
        const albumSongUrls: Array<AlbumSongDataType> = [];
        for (const albumSong of albumSongs) {
            const storageSongRef = ref(storage, `${albumSong.link}`);
            const url = await getDownloadURL(storageSongRef);
            albumSongUrls.push({
                name: albumSong.name,
                plays: albumSong.plays,
                coArtistIds: albumSong.coArtistIds,
                downloadUrl: url
            });
        }

        const artist = await ArtistModel.findOne({ _id: album.artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${album.artistId} not found`);
        }
        const artistData: AlbumArtistDataType = {
            name: artist.name,
            link: artist._id
        };
        return {
            name: album.name,
            date: album.date,
            songs: albumSongUrls,
            downloadUrl: coverImageUrl,
            artist: artistData
        };
    }

}

const albumService = new AlbumService();
export default albumService;