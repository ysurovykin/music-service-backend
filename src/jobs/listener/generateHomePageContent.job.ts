import moment from "moment";
import ArtistModel from "../../api/artist/artist.model";
import ListenerModel, { HomePageContentDataType } from "../../api/listener/listener.model";
import {
  freeSubscriptionHomePageContentSectionCount,
  freeSubscriptionHomePageSectionContentLimit,
  homePageContentSections,
  paidSubscriptionHomePageContentSectionCount,
  paidSubscriptionHomePageSectionContentLimit
} from "../../../config";
import ArtistPlaysModel from "../../api/artist/artistPlays.model";
import AlbumPlaysModel from "../../api/album/albumPlays.model";
import AlbumModel from "../../api/album/album.model";
import LikedAlbumsModel from "../../api/album/likedAlbums.model";
import FollowedArtistsModel from "../../api/artist/followedArtists.model";

const GetHomePageContentMap = new Map([
  ['MORE_LIKE_ARTIST', async (listenerId: string, homePageSectionContentLimit: number) =>
    await getMoreLikeArtistsContent(listenerId, homePageSectionContentLimit)],
  ['JUMP_BACK_TO_ARTISTS', async (listenerId: string, homePageSectionContentLimit: number) =>
    await getJumpBackToArtistsContent(listenerId, homePageSectionContentLimit)],
  ['JUMP_BACK_TO_ALBUMS', async (listenerId: string, homePageSectionContentLimit: number) =>
    await getJumpBackToAlbumsContent(listenerId, homePageSectionContentLimit)],
  ['POPULAR_ARTISTS', async (listenerId: string, homePageSectionContentLimit: number) =>
    await getPopularArtistsContent(listenerId, homePageSectionContentLimit)],
  ['POPULAR_ALBUMS', async (listenerId: string, homePageSectionContentLimit: number) =>
    await getPopularAlbumsContent(listenerId, homePageSectionContentLimit)],
  ['FAVORITE_ARTISTS', async (listenerId: string, homePageSectionContentLimit: number) =>
    await getFavoriteArtistsContent(listenerId, homePageSectionContentLimit)],
  ['FAVORITE_ALBUMS', async (listenerId: string, homePageSectionContentLimit: number) =>
    await getFavoriteAlbumsContent(listenerId, homePageSectionContentLimit)],
]);

export async function generateHomePageContentJob() {
  try {
    const dayAgoDate = moment().subtract(1, 'day').toDate();
    const listeners = await ListenerModel.find({
      $or: [
        { homePageContentGeneratedAt: { $lt: dayAgoDate } },
        { homePageContentGeneratedAt: { $exists: false } },
      ],
    }, { _id: 1 }).lean();
    for (const listener of listeners) {
      await generateHomePageContent(listener._id);
    }
  } catch (error) {
    console.log('Error while processing generateHomePageContentJob', error);
  }
}

export async function generateHomePageContent(listenerId: string): Promise<Array<HomePageContentDataType>> {
  try {
    let homePageContent: Array<HomePageContentDataType> = [];
    const listener = await ListenerModel.findOne({ _id: listenerId }).lean();

    const homePageContentSectionIds = Object.keys(homePageContentSections).sort(() => Math.random() - 0.5);
    const homePageContentSectionCount = listener.subscription === 'free' ?
      freeSubscriptionHomePageContentSectionCount :
      paidSubscriptionHomePageContentSectionCount;
    const homePageSectionContentLimit = listener.subscription === 'free' ?
      freeSubscriptionHomePageSectionContentLimit :
      paidSubscriptionHomePageSectionContentLimit;

    for (const contentSectionId of homePageContentSectionIds) {
      if (homePageContent.length === homePageContentSectionCount) {
        break;
      }
      const content: HomePageContentDataType = await GetHomePageContentMap.get(contentSectionId)(listenerId, homePageSectionContentLimit);
      if (content) {
        homePageContent.push(content);
      }
    }
    console.log('Successfully generated home page content for listener with id ' + listenerId);
    await ListenerModel.updateOne({ _id: listenerId },
      { $set: { homePageContent: homePageContent, homePageContentGeneratedAt: new Date() } }).lean();
    return homePageContent;
  } catch (error) {
    console.log('Error while processing generateHomePageContent job for listener with id ' + listenerId, error);
  }
}

const getMoreLikeArtistsContent = async (listenerId: string, homePageSectionContentLimit: number): Promise<HomePageContentDataType> => {
  const today = moment();
  const playDateThisMonth = `${today.year()}/${today.month() + 1}`;
  const playDatePreviousMonth = `${today.year()}/${today.month() + 1}`;
  const baseArtistId = await ArtistPlaysModel.aggregate([
    { $match: { listenerId } },
    { $sort: { lastPlayedDate: -1 } },
    { $limit: 5 },
    {
      $project: {
        weight: {
          $multiply: [{ $sum: [`$plays.${playDateThisMonth}`, `$plays.${playDatePreviousMonth}`] }, { $rand: {} }]
        },
        artistId: '$artistId'
      }
    },
    { $sort: { weight: -1 } },
    { $limit: 1 },
  ]);

  const artist = await ArtistModel.findOne({ _id: baseArtistId[0]?.artistId }).lean();
  if (artist) {
    const genresSorted = Object.keys(artist.genres).sort((a, b) => artist.genres[a] - artist.genres[b]);
    const languagesSorted = Object.keys(artist.languages).sort((a, b) => artist.languages[a] - artist.languages[b]);
    const mainGenres = genresSorted.slice(0, 3);
    let moreLikeArtist = [];

    const moreSameLanguageArtistsLikeArtist = await ArtistModel.aggregate([
      {
        $addFields: {
          genresArray: { $objectToArray: "$genres" },
          languagesArray: { $objectToArray: "$languages" }
        }
      },
      {
        $match: {
          _id: { $ne: baseArtistId[0].artistId },
          'genresArray.k': { $in: mainGenres },
          'languages.k': languagesSorted[0]
        }
      },
      { $sort: { followers: -1, monthlyListeners: -1 } },
      { $limit: homePageSectionContentLimit }
    ]);
    moreLikeArtist = [...moreSameLanguageArtistsLikeArtist];

    if (moreSameLanguageArtistsLikeArtist.length < homePageSectionContentLimit) {
      const artistIdsToExclude = moreSameLanguageArtistsLikeArtist.map(artist => artist._id);
      const extendedMoreLikeArtist = await ArtistModel.aggregate([
        {
          $addFields: {
            genresArray: { $objectToArray: "$genres" }
          }
        },
        {
          $match: {
            _id: { $nin: [baseArtistId[0].artistId, ...artistIdsToExclude] },
            'genresArray.k': { $in: mainGenres }
          }
        },
        { $sort: { followers: -1, monthlyListeners: -1 } },
        { $limit: homePageSectionContentLimit - moreSameLanguageArtistsLikeArtist.length }
      ]);
      moreLikeArtist = [...moreLikeArtist, ...extendedMoreLikeArtist];
    }

    const artistIds = moreLikeArtist.map(artist => artist._id);
    if (artistIds?.length) {
      return {
        contentSectionId: 'MORE_LIKE_ARTIST',
        contentType: homePageContentSections.MORE_LIKE_ARTIST.type,
        contentTitle: homePageContentSections.MORE_LIKE_ARTIST.title.replace('/NAME/', artist.name),
        contentIds: artistIds
      }
    } else {
      return null;
    }
  }
  return null;
}

const getJumpBackToArtistsContent = async (listenerId: string, homePageSectionContentLimit: number): Promise<HomePageContentDataType> => {
  const monthAgo = moment().subtract(1, 'month').toDate();
  const yearAgo = moment().subtract(1, 'year').toDate();
  const artists = await ArtistPlaysModel.aggregate([
    { $match: { listenerId: listenerId, lastPlayedDate: { $lte: monthAgo, $gte: yearAgo } } },
    { $sort: { lastPlayedDate: -1 } },
    { $limit: 20 },
    {
      $project: {
        weight: { $rand: {} },
        artistId: '$artistId'
      }
    },
    { $sort: { weight: -1 } },
    { $limit: homePageSectionContentLimit },
  ]);

  if (artists?.length) {
    const artistIds = artists.map(artist => artist.artistId);
    return {
      contentSectionId: 'JUMP_BACK_TO_ARTISTS',
      contentType: homePageContentSections.JUMP_BACK_TO_ARTISTS.type,
      contentTitle: homePageContentSections.JUMP_BACK_TO_ARTISTS.title,
      contentIds: artistIds
    }
  }
  return null;
}

const getJumpBackToAlbumsContent = async (listenerId: string, homePageSectionContentLimit: number): Promise<HomePageContentDataType> => {
  const monthAgo = moment().subtract(1, 'month').toDate();
  const yearAgo = moment().subtract(1, 'year').toDate();
  const albums = await AlbumPlaysModel.aggregate([
    { $match: { listenerId: listenerId, lastPlayedDate: { $lte: monthAgo, $gte: yearAgo } } },
    { $sort: { lastPlayedDate: -1 } },
    { $limit: 20 },
    {
      $project: {
        weight: { $rand: {} },
        albumId: '$albumId'
      }
    },
    { $sort: { weight: -1 } },
    { $limit: homePageSectionContentLimit },
  ]);

  if (albums?.length) {
    const albumIds = albums.map(artist => artist.albumId);
    return {
      contentSectionId: 'JUMP_BACK_TO_ALBUMS',
      contentType: homePageContentSections.JUMP_BACK_TO_ALBUMS.type,
      contentTitle: homePageContentSections.JUMP_BACK_TO_ALBUMS.title,
      contentIds: albumIds
    }
  }
  return null;
}

const getPopularArtistsContent = async (listenerId: string, homePageSectionContentLimit: number): Promise<HomePageContentDataType> => {
  const listener = await ListenerModel.findOne({ _id: listenerId }, { favoriteGenres: 1 }).lean();
  const favoriteGenres = Object.keys(listener.favoriteGenres)
    .sort((a, b) => listener.favoriteGenres[a] - listener.favoriteGenres[b]);
  const followedArtists = await FollowedArtistsModel.find({ listenerId: listenerId }, { artistId: 1 }).lean();
  const followedArtistIds = followedArtists.map(artist => artist.artistId);
  const popularArtists = await ArtistModel.aggregate([
    {
      $addFields: {
        genresArray: { $objectToArray: "$genres" }
      }
    },
    {
      $match: {
        _id: { $nin: followedArtistIds },
        'genresArray.k': favoriteGenres[0]
      }
    },
    { $sort: { [`genres.${favoriteGenres[0]}`]: -1, followers: -1, monthlyListeners: -1 } },
    { $limit: homePageSectionContentLimit }
  ]);

  if (popularArtists?.length) {
    const popularArtistIds = popularArtists.map(artist => artist._id);
    return {
      contentSectionId: 'POPULAR_ARTISTS',
      contentType: homePageContentSections.POPULAR_ARTISTS.type,
      contentTitle: homePageContentSections.POPULAR_ARTISTS.title,
      contentIds: popularArtistIds
    }
  }
  return null;
}

const getPopularAlbumsContent = async (listenerId: string, homePageSectionContentLimit: number): Promise<HomePageContentDataType> => {
  const listener = await ListenerModel.findOne({ _id: listenerId }, { favoriteGenres: 1 }).lean();
  const favoriteGenres = Object.keys(listener.favoriteGenres)
    .sort((a, b) => listener.favoriteGenres[a] - listener.favoriteGenres[b]);
  const likedAlbums = await LikedAlbumsModel.find({ listenerId: listenerId }, { albumId: 1 }).lean();
  const likedAlbumIds = likedAlbums.map(album => album.albumId);
  const popularAlbums = await AlbumModel.aggregate([
    {
      $addFields: {
        genresArray: { $objectToArray: "$genres" }
      }
    },
    {
      $match: {
        _id: { $nin: likedAlbumIds },
        hidden: { $ne: true },
        'genresArray.k': favoriteGenres[0]
      }
    },
    { $sort: { [`genres.${favoriteGenres[0]}`]: -1, likes: -1 } },
    { $limit: homePageSectionContentLimit }
  ]);

  if (popularAlbums?.length) {
    const popularAlbumIds = popularAlbums.map(artist => artist._id);
    return {
      contentSectionId: 'POPULAR_ALBUMS',
      contentType: homePageContentSections.POPULAR_ALBUMS.type,
      contentTitle: homePageContentSections.POPULAR_ALBUMS.title,
      contentIds: popularAlbumIds
    }
  }
  return null;
}

const getFavoriteArtistsContent = async (listenerId: string, homePageSectionContentLimit: number): Promise<HomePageContentDataType> => {
  const today = moment();
  const playDateThisMonth = `${today.year}/${today.month}`;
  const playDatePreviousMonth = `${today.year}/${today.month}`;
  const artists = await ArtistPlaysModel.aggregate([
    { $match: { listenerId } },
    {
      $project: {
        plays: {
          $sum: [[`$plays.${playDateThisMonth}`], [`$plays.${playDatePreviousMonth}`]]
        },
        artistId: '$artistId'
      }
    },
    { $sort: { plays: -1 } },
    { $limit: homePageSectionContentLimit },
  ]);

  if (artists?.length) {
    const artistIds = artists.map(artist => artist.artistId);
    return {
      contentSectionId: 'FAVORITE_ARTISTS',
      contentType: homePageContentSections.FAVORITE_ARTISTS.type,
      contentTitle: homePageContentSections.FAVORITE_ARTISTS.title,
      contentIds: artistIds
    }
  }
  return null;
}

const getFavoriteAlbumsContent = async (listenerId: string, homePageSectionContentLimit: number): Promise<HomePageContentDataType> => {
  const today = moment();
  const playDateThisMonth = `${today.year}/${today.month}`;
  const playDatePreviousMonth = `${today.year}/${today.month}`;
  const albums = await AlbumPlaysModel.aggregate([
    { $match: { listenerId } },
    {
      $project: {
        plays: { $sum: [[`$plays.${playDateThisMonth}`], [`$plays.${playDatePreviousMonth}`]] },
        albumId: '$albumId'
      }
    },
    { $sort: { plays: -1 } },
    { $limit: homePageSectionContentLimit },
  ]);

  if (albums?.length) {
    const albumIds = albums.map(album => album.albumId);
    return {
      contentSectionId: 'FAVORITE_ALBUMS',
      contentType: homePageContentSections.FAVORITE_ALBUMS.type,
      contentTitle: homePageContentSections.FAVORITE_ALBUMS.title,
      contentIds: albumIds
    }
  }
  return null;
}
