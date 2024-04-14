import ListenerModel, {
    HomePageContentDataType,
    HomePageContentTypesEnum,
    ListenerInfoResponseDataType,
    ContentDataType,
    VisitedContentDataType,
    HomePageContentResponseDataType,
    EditProfileRequestDataType,
    GetAccountContentCountResponseDataType,
    GetExistingGenresResponseDataType,
    GetRecommendedArtistsResponseDataType
} from '../models/listener.model';
import { NotFoundError, ValidationError } from '../errors/api-errors';
import ListenerDto from '../dtos/listener.dto';
import ArtistDto from '../dtos/artist.dto';
import ArtistModel, { ArtistInfoResponseDataType, ArtistShortDataType } from '../models/artist.model';
import AlbumModel, { AlbumInfoResponseDataType } from '../models/album.model';
import AlbumDto from '../dtos/album.dto';
import PlaylistModel, { PlaylistTagEnum } from '../models/playlist.model';
import LikedAlbumstModel from '../models/likedAlbums.model';
import { generateHomePageContent } from '../jobs/listener/generateHomePageContent.job';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase.config';
import { getCoverDominantColor } from '../helpers/imageCoverColor.helper';
import FollowedArtistsModel from '../models/followedArtists.model';
import GenresModel from '../models/genres.model';
import UserModel from '../models/user.model';
import randomstring from 'randomstring';
import CreditCardsModel, { CardDetailsType, UserCreditCardInfoType } from '../models/creditCards.model';
import SubscriptionsModel from '../models/subscriptions.model';
import moment from 'moment';
import subscriptionService from './subscription.service';

class ListenerService {

    async getListenerById(listenerId: string): Promise<ListenerInfoResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }

        const listenerDto = new ListenerDto(listener);
        const subscriptionState = await SubscriptionsModel.findOne({ userId: listenerId, profileType: 'listener' }).lean();
        let subscriptionCanceledAtDate: string;
        if (subscriptionState?.canceled) {
            subscriptionCanceledAtDate = moment(subscriptionState.nextPaymentDate).format('DD.MM.YYYY');
        }
        return {
            ...listenerDto,
            subscriptionCanceledAtDate
        };
    }

    async getRecentMostVisitedContent(listenerId: string): Promise<Array<ContentDataType>> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }
        const visitedContent = listener.visitedContent;
        let mostVisitedContent: Array<ContentDataType> = [];
        let visitedContentFormated: Array<VisitedContentDataType> = [];
        if (!visitedContent || !visitedContent.length) {
            visitedContentFormated = [];
        } else if (visitedContent.length <= 8) {
            visitedContentFormated = visitedContent.sort((a, b) => b.visitsCounter - a.visitsCounter).map(content => ({
                contentId: content.contentId,
                lastVisited: content.lastVisited,
                type: content.type,
                visitsCounter: content.visitsCounter
            }));
        } else {
            let visitedContentToParse = [];
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const mostRecentVisited = visitedContent.filter(content => content.lastVisited > oneWeekAgo);
            if (mostRecentVisited.length >= 8) {
                mostRecentVisited.sort((a, b) => b.visitsCounter - a.visitsCounter);
                visitedContentToParse = visitedContentToParse.slice(0, 8);
            } else {
                const oldVisited = visitedContent.filter(content => content.lastVisited < oneWeekAgo);
                const mostRecentVisitedSorted = mostRecentVisited
                    .sort((a, b) => b.visitsCounter - a.visitsCounter);
                const oldVisitedSorted = oldVisited.sort((a, b) => b.visitsCounter - a.visitsCounter)
                    .slice(0, 8 - mostRecentVisitedSorted.length);
                visitedContentToParse = [...mostRecentVisited, ...oldVisitedSorted];
            }
            visitedContentFormated = visitedContentToParse.map(content => ({
                contentId: content.contentId,
                lastVisited: content.lastVisited,
                type: content.type,
                visitsCounter: content.visitsCounter
            }));
        }
        for (let place of visitedContentFormated) {
            if (place.type === 'artist') {
                const artist = await ArtistModel.findOne({ _id: place.contentId }).lean();
                const artistDto = new ArtistDto(artist);
                mostVisitedContent.push({
                    ...artistDto,
                    type: 'artist'
                });
            } else if (place.type === 'album') {
                const album = await AlbumModel.findOne({ _id: place.contentId }).lean();
                const artist = await ArtistModel.findOne({ _id: album.artistId }).lean();
                if (!artist) {
                    throw new NotFoundError(`Artist with id ${album.artistId} not found`);
                }
                const artistData: ArtistShortDataType = {
                    name: artist.name,
                    id: artist._id
                };

                const albumDto = new AlbumDto(album);
                mostVisitedContent.push({
                    ...albumDto,
                    artist: artistData,
                    type: 'album'
                });
            } else if (place.type === 'playlist') {
                const playlist = await PlaylistModel.findOne({ _id: place.contentId }).lean();
                mostVisitedContent.push({
                    playlistId: playlist._id,
                    name: playlist.name,
                    description: playlist.description,
                    date: playlist.date,
                    editable: playlist.editable,
                    pinned: playlist.pinned,
                    tag: playlist.tag as PlaylistTagEnum,
                    coverImageUrl: playlist.coverImageUrl,
                    backgroundColor: playlist.backgroundColor,
                    type: 'playlist'
                });
            }
        }
        return mostVisitedContent;
    }

    async getHomePageContent(listenerId: string, forceUpdate: boolean): Promise<Array<HomePageContentResponseDataType>> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }
        let homePageContent: Array<HomePageContentDataType> = listener.homePageContent
            .map(content => ({ ...content, contentType: content.contentType as HomePageContentTypesEnum }));
        if (!homePageContent || forceUpdate) {
            homePageContent = await generateHomePageContent(listenerId);
        }
        const homePageContentResponse: Array<HomePageContentResponseDataType> = [];
        for (const content of homePageContent) {
            if (content.contentType === 'album') {
                const albums = await AlbumModel.find({ _id: { $in: content.contentIds } }).lean();
                const albumDatas: Array<AlbumInfoResponseDataType> = [];
                for (const album of albums) {
                    const albumDto = new AlbumDto(album);
                    const artist = await ArtistModel.findOne({ _id: album.artistId }, { _id: 1, name: 1 }).lean();
                    const likedAlbumInfo = await LikedAlbumstModel.findOne({ listenerId: listenerId, albumId: album._id }).lean();
                    albumDatas.push({
                        ...albumDto,
                        artist: {
                            name: artist.name,
                            id: artist._id
                        },
                        isAddedToLibrary: !!likedAlbumInfo
                    });
                }
                homePageContentResponse.push({
                    contentTitle: content.contentTitle,
                    contentType: HomePageContentTypesEnum.artist,
                    content: albumDatas.map(album => ({ ...album, type: 'album' }))
                });
            } else if (content.contentType === 'artist') {
                const artists = await ArtistModel.find({ _id: { $in: content.contentIds } }).lean();
                homePageContentResponse.push({
                    contentTitle: content.contentTitle,
                    contentType: HomePageContentTypesEnum.artist,
                    content: artists.map(artist => ({ ...new ArtistDto(artist), type: 'artist' }))
                });
            } else if (content.contentType === 'playlist') {
                const playlists = await PlaylistModel.find({ _id: { $in: content.contentIds } }).lean();
                homePageContentResponse.push({
                    contentTitle: content.contentTitle,
                    contentType: HomePageContentTypesEnum.artist,
                    content: playlists.map(playlist => ({
                        playlistId: playlist._id,
                        name: playlist.name,
                        description: playlist.description,
                        date: playlist.date,
                        editable: playlist.editable,
                        pinned: playlist.pinned,
                        tag: playlist.tag as PlaylistTagEnum,
                        coverImageUrl: playlist.coverImageUrl,
                        backgroundColor: playlist.backgroundColor,
                        type: 'playlist'
                    }))
                });
            }
        }
        return homePageContentResponse;
    }

    async editProfile(listenerId: string, file: Express.Multer.File, profileData: EditProfileRequestDataType): Promise<void> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }
        if (file) {
            const downloadUrl = `listener-profile-images/${listener._id}`;
            const storageRef = ref(storage, downloadUrl);
            await uploadBytes(storageRef, file.buffer, { contentType: 'image/jpeg' });
            let profileImageUrl = await getDownloadURL(storageRef);
            const indexOfTokenQuery = profileImageUrl.indexOf('&token')
            if (indexOfTokenQuery) {
                profileImageUrl = profileImageUrl.slice(0, indexOfTokenQuery);
            }
            const backgroundColor = await getCoverDominantColor(profileImageUrl);
            await ListenerModel.updateOne({ _id: listenerId }, {
                $set: {
                    name: profileData.name,
                    profileImageUrl: profileImageUrl,
                    backgroundColor: backgroundColor
                }
            })
        } else {
            const downloadUrl = `listener-profile-images/${listener._id}`;
            const storageRef = ref(storage, downloadUrl);
            await deleteObject(storageRef);
            await ListenerModel.updateOne({ _id: listenerId }, {
                $set: { name: profileData.name },
                $unset: { profileImageUrl: 1, backgroundColor: 1 }
            })
        }
    }

    async getAccountContentCount(listenerId: string): Promise<GetAccountContentCountResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }

        const playlistCount = await PlaylistModel.count({ listenerId: listenerId });
        const followedArtistsCount = await FollowedArtistsModel.count({ listenerId: listenerId });
        const likedAlbumsCount = await LikedAlbumstModel.count({ listenerId: listenerId });

        return {
            playlistCount: playlistCount,
            followedArtistsCount: followedArtistsCount,
            likedAlbumsCount: likedAlbumsCount,
        }
    }

    async getExistingGenres(listenerId: string, choosenGenres: Array<string> = [],
        search: string = ''): Promise<GetExistingGenresResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }
        search = search.replace('/', '');
        choosenGenres = !choosenGenres || typeof choosenGenres === 'object' ? choosenGenres : JSON.parse(choosenGenres);
        let recommendedGenres = [];
        if (choosenGenres.length === 0) {
            const currentUser = await UserModel.findOne({ _id: listenerId }).lean();
            if (!currentUser) {
                throw new NotFoundError(`User with id ${listenerId} not found`);
            }
            const simmilarListenersGenres = await ListenerModel.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $match: {
                        'user._id': { $ne: currentUser._id },
                        'user.country': currentUser.country,
                        ...(currentUser.gender !== 'unknown' && { 'user.gender': currentUser.gender })
                    }
                },
                {
                    $project: {
                        _id: 0,
                        genres: { $objectToArray: '$favoriteGenres' }
                    }
                },
                { $unwind: '$genres' },
                {
                    $group: {
                        _id: '$genres.k',
                        genreValue: { $sum: '$genres.v' }
                    }
                },
                { $sort: { genreValue: -1 } },
                { $limit: search ? 15 : Number.MAX_SAFE_INTEGER }
            ]);
            if (search) {
                const simmilarListenersGenreIds = simmilarListenersGenres.map(genre => genre._id);
                const simmilarGenres = await GenresModel.find({ _id: { $in: simmilarListenersGenreIds }, name: { $regex: search, $options: 'i' } },
                    { _id: 1 }).lean();
                recommendedGenres = simmilarGenres.map(genre => genre._id);
            } else {
                recommendedGenres = simmilarListenersGenres.map(genre => genre._id);
            }
        } else {
            const simmilarGenres = await GenresModel.aggregate([
                { $match: { _id: { $in: choosenGenres } } },
                { $unwind: '$similarGenres' },
                {
                    $project: {
                        _id: 0,
                        similarGenre: '$similarGenres.genreId',
                        similarGenreName: '$similarGenres.name',
                        similarity: '$similarGenres.similarity'
                    }
                },
                {
                    $group: {
                        _id: '$similarGenre',
                        totalSimilarity: { $sum: '$similarity' },
                        genreName: { $first: '$similarGenreName' },
                    }
                },
                { $match: { _id: { $nin: choosenGenres }, genreName: { $regex: search, $options: 'i' } } },
                { $sort: { totalSimilarity: -1 } },
                { $limit: 15 }
            ]);
            recommendedGenres = simmilarGenres.map(genre => genre._id);
        }
        const otherGenresAggregation = await GenresModel.aggregate([
            { $match: { _id: { $nin: [...choosenGenres, ...recommendedGenres] }, name: { $regex: search, $options: 'i' } } },
            { $project: { weight: { $rand: {} } } },
            { $sort: { weight: -1 } },
            { $limit: 15 }
        ])
        const otherGenres = otherGenresAggregation.map(genre => genre._id);

        return {
            otherGenres: otherGenres,
            recommendedGenres: recommendedGenres
        }
    }

    async getRecommendedArtists(listenerId: string, genres: Array<string> = [], offset: number = 0,
        limit: number = 10): Promise<GetRecommendedArtistsResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }
        const recommendedArtistsAggregation = await ArtistModel.aggregate([
            { $addFields: { genresArray: { $objectToArray: "$genres" } } },
            { $match: { 'genresArray.k': { $in: genres } } },
            { $sort: { followers: -1, monthlyListeners: -1 } },
            { $skip: +limit * +offset },
            { $limit: +limit }
        ]);
        const artstDtos: Array<ArtistInfoResponseDataType> = recommendedArtistsAggregation.map(artstData => new ArtistDto(artstData));

        return {
            recommendedArtists: artstDtos,
            isMoreRecommendedArtistsForLoading: artstDtos.length === +limit
        }
    }

    async saveGetStartedResults(listenerId: string, genres: Array<string> = [],
        artistIds: Array<string> = []): Promise<void> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }

        let genresToUpdate = {};
        for (const genre of genres) {
            genresToUpdate[`favoriteGenres.${genre}`] = 100;
        }

        await ListenerModel.updateOne(
            { _id: listenerId },
            { $inc: genresToUpdate, $set: { getStartedCompleted: true } },
            { upsert: true }
        );

        const artistsToFollow = artistIds.map(id => ({
            _id: randomstring.generate(16),
            artistId: id,
            listenerId: listenerId,
            date: new Date()
        }));
        await FollowedArtistsModel.insertMany(artistsToFollow);
    }

    async getUserCreditCards(listenerId: string): Promise<Array<UserCreditCardInfoType>> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }
        const userCreditCards = await CreditCardsModel.find({ userId: listenerId, deleted: { $ne: true } }).lean();
        const formatedCreditCards: Array<UserCreditCardInfoType> = userCreditCards.map(card => ({
            cardId: card._id,
            lastDigits: card.number.slice(-4),
            active: card.activeForListener || card.activeForArtist
        }));
        return formatedCreditCards;
    }

    async changeSubscription(listenerId: string, subscription: string, cardId: string,
        cardDetails: CardDetailsType): Promise<void> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }
        await subscriptionService.updateSubscription(listenerId, subscription, cardDetails, cardId, 'listener');
    }

    async deleteUserCreditCard(listenerId: string, cardId: string): Promise<void> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }
        await CreditCardsModel.deleteOne({ _id: cardId });
    }

    async _updateVisitedContent(listenerId: string, contentType: 'artist' | 'album' | 'playlist', content: ContentDataType) {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        const visitedContent = listener.visitedContent;
        let contentId: string;
        if (content.type === 'album') {
            contentId = content.albumId;
        } else if (content.type === 'artist') {
            contentId = content.artistId;
        } else if (content.type === 'playlist') {
            contentId = content.playlistId;
        }
        const visitedContentInfo = visitedContent && visitedContent.find(item => item.type === contentType && item.contentId === contentId);
        if (visitedContentInfo) {
            await ListenerModel.updateOne({ _id: listenerId },
                {
                    $set: { "visitedContent.$[updateElement].lastVisited": new Date() },
                    $inc: { "visitedContent.$[updateElement].visitsCounter": 1 }
                },
                {
                    arrayFilters: [
                        {
                            'updateElement.contentId': contentId,
                            'updateElement.type': contentType
                        }
                    ]
                }
            )
        } else {
            await ListenerModel.updateOne({ _id: listenerId },
                {
                    $push: {
                        "visitedContent": {
                            type: contentType,
                            contentId: contentId,
                            lastVisited: new Date(),
                            visitsCounter: 1
                        }
                    },
                }
            )
        }
    }

}

const listenerService = new ListenerService();
export default listenerService;