import ArtistModel, {
    ArtistFullResponseDataType,
    ArtistGenresType,
    ArtistInfoResponseDataType,
    ArtistShortDataType,
    GetArtistsInListenerLibraryResponseType,
    GetArtistsResponseType,
    GetListenerTopArtistsThisMonthResponseType
} from './artist.model';
import FollowedArtistsModel from './followedArtists.model';
import { NotFoundError } from '../../errors/api-errors';
import ArtistDto from './artist.dto';
import SongModel from '../song/song.model';
import LikedAlbumstModel from '../album/likedAlbums.model';
import AlbumModel, { AlbumFullResponseDataType } from '../album/album.model';
import PlaylistModel from '../playlist/playlist.model';
import randomstring from 'randomstring';
import AlbumDto from '../album/album.dto';
import listenerService from '../listener/listener.service';
import ListenerModel from '../listener/listener.model';

class ArtistService {

    async getArtists(offset: number, limit: number, search: string): Promise<GetArtistsResponseType> {
        let artstDtos: Array<ArtistInfoResponseDataType>;
        if (search) {
            search = search.replace('/', '');
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
        const likedSongIds = likedPlaylist?.songIds?.map(song => song.id) || [];
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
        const albumsCount = await AlbumModel.count({ artistId: artist, hidden: { $ne: true } });
        const albumsWhereAppearsCount = await SongModel.distinct(('albumId'), { coArtistIds: artistId }).count();

        const artistDto = new ArtistDto(artist);

        await listenerService._updateVisitedContent(listenerId, 'artist', { ...artistDto, type: 'artist' });

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
        const artistMostRecentRelease = await AlbumModel.findOne({ artistId: artistId, hidden: { $ne: true } }).sort({ date: -1 }).lean();
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
        limit: number = 10, search: string = ''): Promise<GetArtistsInListenerLibraryResponseType> {
        const followedArtists = await FollowedArtistsModel.find({ listenerId: listenerId }).sort({ date: -1 }).lean();
        const artistIds = followedArtists.map(followedArtist => followedArtist.artistId);
        search = search.replace('/', '');
        const artists = await ArtistModel.find({ _id: { $in: artistIds }, name: { $regex: search, $options: 'i' } })
            .skip(+offset * +limit).limit(+limit).lean();
        const sortedArtists = artists.sort((a, b) => artistIds.indexOf(a._id) - artistIds.indexOf(b._id));
        const artstDtos: Array<ArtistInfoResponseDataType> = sortedArtists.map(artstData => new ArtistDto(artstData));
        return {
            followedArtists: artstDtos,
            isMoreFollowedArtistsForLoading: artstDtos.length === +limit
        };
    }

    async getListenerTopArtistsThisMonth(listenerId: string, offset: number = 0,
        limit: number = 10, search: string = ''): Promise<GetListenerTopArtistsThisMonthResponseType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        const artistIds = listener.topArtistsThisMonth || [];
        search = search.replace('/', '');
        const artists = await ArtistModel.find({ _id: { $in: artistIds }, name: { $regex: search, $options: 'i' } })
            .skip(+offset * +limit).limit(+limit).lean();
        const sortedArtists = artists.sort((a, b) => artistIds.indexOf(a._id) - artistIds.indexOf(b._id));
        const artstDtos: Array<ArtistInfoResponseDataType> = sortedArtists.map(artstData => new ArtistDto(artstData));
        return {
            topArtistsThisMonth: artstDtos,
            isMoreTopArtistsThisMonthForLoading: artstDtos.length === +limit
        };
    }

    async getFansAlsoLikeArtists(listenerId: string, artistId: string): Promise<Array<ArtistInfoResponseDataType>> {
        const fans = await FollowedArtistsModel.find({ listenerId: { $ne: listenerId }, artistId: artistId }, { listenerId: 1 }).lean();
        const fansIds = fans.map(fan => fan.listenerId);
        const results = await FollowedArtistsModel.aggregate([
            { $match: { listenerId: { $in: fansIds }, artistId: { $ne: artistId } } },
            {
                $group: {
                    _id: '$artistId',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    artistId: '$_id',
                    count: '$count',
                },
            },
        ]);
        const artistIds = results.map(artist => artist.artistId);
        const artists = await ArtistModel.find({ _id: { $in: artistIds } }).lean();
        const artstDtos: Array<ArtistInfoResponseDataType> = artists.map(artstData => new ArtistDto(artstData));
        return artstDtos;
    }

}

const artistService = new ArtistService();
export default artistService;