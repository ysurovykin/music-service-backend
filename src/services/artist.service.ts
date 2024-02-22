import ArtistModel, { ArtistFullResponseDataType, ArtistInfoResponseDataType } from '../models/artist.model';
import AlbumModel, { AlbumWithoutArtistType } from '../models/album.model';
import { NotFoundError } from '../errors/api-errors';
import ArtistDto from '../dtos/artist.dto';

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
        const artistAlbumUrls: Array<AlbumWithoutArtistType> = [];
        for (const artistAlbum of artistAlbums) {
            artistAlbumUrls.push({
                albumId: artistAlbum._id,
                name: artistAlbum.name,
                date: artistAlbum.date,
                coverImageUrl: artistAlbum.coverImageUrl,
                backgroundColor: artistAlbum.backgroundColor,
                lyricsBackgroundShadow: artistAlbum.lyricsBackgroundShadow
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