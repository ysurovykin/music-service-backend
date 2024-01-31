import ArtistModel from '../models/artist.model';
import { NotFoundError } from '../errors/api-errors';
import ArtistDto from '../dtos/artist.dto';

class ArtistService {

    async getArtists(): Promise<Array<ArtistDto>> {
        const artists = await ArtistModel.find().limit(10).lean();
        const artstDtos = artists.map(artstData => new ArtistDto(artstData));
        return artstDtos;
    }

    async getArtistById(artistId: string): Promise<ArtistDto> {
        const artist = await ArtistModel.findOne({_id: artistId}).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const artistDto = new ArtistDto(artist);
        return artistDto;
    }

}

const artistService = new ArtistService();
export default artistService;