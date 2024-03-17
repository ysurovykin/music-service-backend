import ArtistModel, {
    ArtistFullResponseDataType,
    ArtistGenresType,
    ArtistInfoResponseDataType,
    ArtistShortDataType,
    GetArtistsInListenerLibraryResponseType,
    GetArtistsResponseType
} from '../models/artist.model';
import FollowedArtistsModel from '../models/followed-artists.model';
import { NotFoundError } from '../errors/api-errors';
import ArtistDto from '../dtos/artist.dto';
import SongModel from '../models/song.model';
import LikedAlbumstModel from '../models/liked-albums.model';
import AlbumModel, { AlbumFullResponseDataType } from '../models/album.model';
import PlaylistModel from '../models/playlist.model';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase.config';
import randomstring from 'randomstring';
import { getDominantColorWithShadow } from '../helpers/image-cover-color.helper';
import AlbumDto from '../dtos/album.dto';

class ArtistService {

    async getArtists(offset: number, limit: number, search: string): Promise<GetArtistsResponseType> {
        let artstDtos: Array<ArtistInfoResponseDataType>;
        if (search) {
            const artists = await ArtistModel.find({ name: { $regex: search, $options: 'i' } }).sort({ followers: -1 })
                .skip(+offset * +limit).limit(+limit).lean();
            artstDtos = artists.map(artstData => new ArtistDto(artstData));
        } else {
            const artists = await ArtistModel.find().skip(+offset * +limit).limit(+limit).lean();
            artstDtos = artists.map(artstData => new ArtistDto(artstData));
        }
        return {
            artists: artstDtos,
            isMoreArtistsForLoading: artstDtos.length === limit
        }
    }

    async changeArtistProfileImage(artistId: string, file: Express.Multer.File): Promise<void> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }

        const downloadUrl = `artist-profile-images/${artist._id}`;
        const storageRef = ref(storage, downloadUrl);
        await uploadBytes(storageRef, file.buffer, { contentType: 'image/jpeg' });
        let profileImageUrl = await getDownloadURL(storageRef);
        const indexOfTokenQuery = profileImageUrl.indexOf('&token')
        if (indexOfTokenQuery) {
            profileImageUrl = profileImageUrl.slice(0, indexOfTokenQuery);
        }
        const backgroundColor = await getDominantColorWithShadow(profileImageUrl);

        await ArtistModel.updateOne({ _id: artistId }, {
            $set: { profileImageUrl: profileImageUrl, backgroundColor: backgroundColor.backgroundColor }
        });
    }

    async removeArtistProfileImage(artistId: string): Promise<void> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        if (artist.profileImageUrl) {
            try {
                const downloadUrl = `artist-profile-images/${artist._id}`;
                const storageRef = ref(storage, downloadUrl);
                await deleteObject(storageRef);
            } catch (error) {
                console.error('Error while deleting artist profile image', error);
            }
        }
        await ArtistModel.updateOne({ _id: artistId }, {
            $unset: { profileImageUrl: 1, backgroundColor: 1 }
        });
    }

    async getArtistById(listenerId: string, artistId: string): Promise<ArtistFullResponseDataType> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }

        const followedArtistInfo = await FollowedArtistsModel.findOne({ listenerId: listenerId, artistId: artist._id }).lean();
        const songsInfo = await SongModel.aggregate([
            { $match: { artistId: artistId } },
            {
                $group: {
                    _id: null,
                    totalDuration: { $sum: '$duration' },
                    totalCount: { $count: {} }
                }
            },
        ]);
        const likedPlaylist = await PlaylistModel.findOne({ listenerId: listenerId, tag: 'liked' }, { songIds: 1 }).lean();
        const likedSongIds = likedPlaylist.songIds.map(song => song.id);
        const likedSongsInfo = await SongModel.aggregate([
            { $match: { _id: { $in: likedSongIds }, artistId: artistId } },
            {
                $group: {
                    _id: null,
                    totalDuration: { $sum: '$duration' },
                    totalCount: { $count: {} }
                }
            },
        ]);
        const albumsCount = await AlbumModel.count({ artistId: artist });
        const albumsWhereAppearsCount = await SongModel.distinct(('albumId'), { coArtistIds: artistId }).count();

        const artistDto = new ArtistDto(artist);
        return {
            ...artistDto,
            isFollowed: !!followedArtistInfo,
            songsTimeDuration: songsInfo[0]?.totalDuration,
            songsCount: songsInfo[0]?.totalCount || 0,
            likedSongsTimeDuration: likedSongsInfo[0]?.totalDuration,
            likedSongsCount: likedSongsInfo[0]?.totalCount || 0,
            albumsCount: albumsCount,
            albumsWhereAppearsCount: albumsWhereAppearsCount,
        };
    }

    async followArtist(listenerId: string, artistId: string): Promise<void> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const id = randomstring.generate(16);
        await FollowedArtistsModel.create({
            _id: id,
            artistId: artistId,
            listenerId: listenerId,
            date: new Date()
        });
    }

    async unfollowArtist(listenerId: string, artistId: string): Promise<void> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        await FollowedArtistsModel.deleteMany({ listenerId: listenerId, artistId: artistId });
    }

    async getGenres(artistId: string): Promise<Array<ArtistGenresType>> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const songsCount = await SongModel.count({ artistId: artistId });
        let genres: Array<ArtistGenresType> = [];
        if (artist.genres) {
            const genreNames = Object.keys(artist.genres);
            for (const genre of genreNames) {
                genres.push({ name: genre, percentage: +(artist.genres[genre] / songsCount * 100).toFixed(1) });
            }
            genres = genres.sort((a, b) => b.percentage - a.percentage);
        }
        return genres;
    }

    async getMostRecentRelease(listenerId: string, artistId: string): Promise<AlbumFullResponseDataType> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        if (!artist) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const artistMostRecentRelease = await AlbumModel.findOne({ artistId: artistId }).sort({ date: -1 }).lean();
        const artistData: ArtistShortDataType = {
            name: artist.name,
            id: artist._id
        };
        const likedAlbumInfo = await LikedAlbumstModel.findOne({ listenerId: listenerId, albumId: artistMostRecentRelease._id }).lean();
        const songsInfo = await SongModel.aggregate([
            { $match: { albumId: artistMostRecentRelease._id } },
            {
                $group: {
                    _id: null,
                    totalDuration: { $sum: '$duration' },
                    totalCount: { $count: {} }
                }
            },
        ]);
        const albumDto = new AlbumDto(artistMostRecentRelease);
        return {
            ...albumDto,
            artist: artistData,
            isAddedToLibrary: !!likedAlbumInfo,
            songsTimeDuration: songsInfo[0]?.totalDuration,
            songsCount: songsInfo[0]?.totalCount
        };
    }

    async getArtistsInListenerLibrary(listenerId: string, offset: number = 0,
        limit: number = 10): Promise<GetArtistsInListenerLibraryResponseType> {
        const followedArtists = await FollowedArtistsModel.find({ listenerId: listenerId })
            .sort({ date: -1 }).skip(+offset * +limit).limit(+limit).lean();
        const artistIds = followedArtists.map(followedArtist => followedArtist.artistId);
        const artists = await ArtistModel.find({ _id: { $in: artistIds } }).lean();
        const sortedArtists = artists.sort((a, b) => artistIds.indexOf(a._id) - artistIds.indexOf(b._id));
        const artstDtos: Array<ArtistInfoResponseDataType> = sortedArtists.map(artstData => new ArtistDto(artstData));
        return {
            followedArtists: artstDtos,
            isMoreFollowedArtistsForLoading: artstDtos.length === +limit
        };
    }

}

const artistService = new ArtistService();
export default artistService;