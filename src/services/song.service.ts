import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase.config';
import SongModel, { Song, SongArtist } from '../models/song.model';
import UserModel from '../models/user.model';
import AlbumModel from '../models/album.model';
import { ForbiddenError, NotFoundError } from '../errors/api-errors';

class SongService {

    async upload(songData: Song, file: Express.Multer.File): Promise<any> {
        const artist = await UserModel.findOne({ name: songData.artist }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist ${songData.artist} not found`);
        }
        if (artist) {
            throw new ForbiddenError(`User ${songData.artist} is not an approved artist`);
        }
        const album = await AlbumModel.findOne({ artist: songData.artist, name: songData.albumName }).lean();
        if (!album) {
            throw new NotFoundError(`Album ${songData.albumName} not found for artist ${songData.artist}`);
        }
        let coArtists: Array<SongArtist> = [];
        for (const artist in songData.coArtists) {
            const existingArtist = await UserModel.findOne({ name: artist });
            if (!existingArtist) {
                throw new NotFoundError(`Artist ${artist} not found`);
            }
            coArtists.push({name: artist, link: existingArtist._id.toString()});
        }
        await SongModel.create({
            ...songData,
            coverImageLink: album.coverImageLink,
            artist: {name: artist.name, link: artist._id.toString()},
            coArtists: [...coArtists],
            album: {
                name: album.name, 
                link: album.coverImageLink
            }, 
            link: `songs/${artist.name}/${album.name}/${songData.name}`,
            date: new Date()
        });

        const storageRef = ref(storage, `songs/${artist.name}/${album.name}/${songData.name}`);
        await uploadBytes(storageRef, file.buffer, {contentType: 'audio/mpeg'});
    }

}

const songService = new SongService();
export default songService;