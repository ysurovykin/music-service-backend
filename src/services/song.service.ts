import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase.config';
import SongModel, { Song } from '../models/song.model';
import AlbumModel from '../models/album.model';
import { NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';

class SongService {

    async upload(songData: Song, file: Express.Multer.File): Promise<any> {
        const album = await AlbumModel.findOne({ _id: songData.albumId }).lean();
        if (!album) {
            throw new NotFoundError(`Album with id ${songData.albumId} not found`);
        }

        const songId = randomstring.generate(16);
        const songLink = `songs/${songData.artistId}/${album._id}/${songId}`;
        const storageRef = ref(storage, songLink);
        await uploadBytes(storageRef, file.buffer, {contentType: 'audio/mpeg'});

        await SongModel.create({
            ...songData,
            _id: songId,
            coverImageLink: album.coverImageLink,
            artistId: songData.artistId,
            coArtistIds: songData.coArtistIds,
            albumId: album._id,
            link: songLink,
            date: new Date()
        });
    }

    async loadSong(artistId: string, albumId: string, songId: string): Promise<any> {
        const storageRef = ref(storage, `/songs/${artistId}/${albumId}/${songId}`);
        const url = await getDownloadURL(storageRef)
        return url;
    }

}

const songService = new SongService();
export default songService;