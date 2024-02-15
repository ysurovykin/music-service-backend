import ArtistModel, { ArtistAlbumDataType, ArtistFullResponseDataType, ArtistInfoResponseDataType } from '../models/artist.model';
import AlbumModel from '../models/album.model';
import { NotFoundError } from '../errors/api-errors';
import ArtistDto from '../dtos/artist.dto';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../firebase.config';

class ArtistService {

    async getArtists(): Promise<Array<ArtistInfoResponseDataType>> {
        const artists = await ArtistModel.find().limit(10).lean();
        const artstDtos = artists.map(artstData => new ArtistDto(artstData));
        return artstDtos;
    }

    async getArtistById(artistId: string): Promise<ArtistFullResponseDataType> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }

        const artistAlbums = await AlbumModel.find({ artistId: artistId }).lean();
        const artistAlbumUrls: Array<ArtistAlbumDataType> = [];
        for (const artistAlbum of artistAlbums) {
            const storageCoverImageRef = ref(storage, `${artistAlbum.coverImageUrl}`);
            const url = await getDownloadURL(storageCoverImageRef);
            artistAlbumUrls.push({
                albumId: artistAlbum._id,
                name: artistAlbum.name,
                likes: artistAlbum.likes,
                date: artistAlbum.date,
                coverImageUrl: url
            });
        }

        const artistDto = new ArtistDto(artist);
        return {
            ...artistDto,
            albums: artistAlbumUrls
        };
    }

}

const artistService = new ArtistService();
export default artistService;