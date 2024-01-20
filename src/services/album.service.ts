import { storage } from '../../firebase.config';
import { ref, uploadBytes } from 'firebase/storage';
import { Album } from '../models/album.model';
import UserModel from '../models/user.model';
import AlbumModel from '../models/album.model';
import { ForbiddenError, NotFoundError } from '../errors/api-errors';

class AlbumService {

    async create(albumData: Album, file: Express.Multer.File): Promise<any> {
        const artist = await UserModel.findOne({ name: albumData.artist }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist ${albumData.artist} not found`);
        }
        if (artist.role !== 'artist') {
            throw new ForbiddenError(`User ${albumData.artist} is not an approved artist`);
        }
        const album = await AlbumModel.findOne({ artist: albumData.artist, name: albumData.name }).lean();
        if (album) {
            throw new ForbiddenError(`Album ${albumData.name} already exists for artist ${albumData.artist}`);
        }
        await AlbumModel.create({
            name: albumData.name,
            artist: albumData.artist,
            coverImageLink: `album-covers/${artist.name}/${albumData.name}`,
            languages: albumData.languages,
            genres: albumData.genres,
            date: new Date()
        });

        const storageRef = ref(storage, `album-covers/${artist.name}/${albumData.name}`);
        await uploadBytes(storageRef, file.buffer, {contentType: 'image/jpeg'});
    }

}

const albumService = new AlbumService();
export default albumService;