import { Schema, model } from 'mongoose';
import { ArtistInfoResponseDataType } from './artist.model';
import { AlbumInfoResponseDataType } from './album.model';
import { PlaylistInfoResponseDataType } from './playlist.model';
import { CardDetailsType } from './creditCards.model';

export type CreateListenerRequestDataType = {
  name: string;
};

export type ListenerInfoResponseDataType = {
  name: string;
  profileImageUrl: string;
  backgroundColor: string;
  subscription: string;
  getStartedCompleted: boolean;
  subscriptionCanceledAtDate: string;
}

export type EditProfileRequestDataType = {
  name: string;
}

export type ContentDataType =
  ArtistInfoResponseDataType & { type: 'artist' } |
  AlbumInfoResponseDataType & { type: 'album' } |
  PlaylistInfoResponseDataType & { type: 'playlist' };

export type VisitedContentDataType = {
  contentId: string;
  type: string;
  lastVisited: Date;
  visitsCounter: number;
}

const VisitedContentSchema = new Schema({
  contentId: { type: String, required: true },
  type: { type: String, required: true },
  lastVisited: { type: Date, required: true },
  visitsCounter: { type: Number, required: true },
});

export enum HomePageContentTypesEnum {
  'artist' = 'artist',
  'album' = 'album',
  'playlist' = 'playlist'
}

export type HomePageContentResponseDataType = {
  contentType: HomePageContentTypesEnum,
  contentTitle: string,
  content: Array<ContentDataType>
}

export type HomePageContentDataType = {
  contentSectionId: string,
  contentType: HomePageContentTypesEnum,
  contentTitle: string,
  contentIds: Array<string>
}

export type GetAccountContentCountResponseDataType = {
  playlistCount: number;
  followedArtistsCount: number;
  likedAlbumsCount: number;
}

export type GetExistingGenresRequestDataType = {
  choosenGenres: Array<string>;
  search: string;
}

export type GetExistingGenresResponseDataType = {
  recommendedGenres: Array<string>;
  otherGenres: Array<string>;
}

export type GetRecommendedArtistsRequestDataType = {
  genres: Array<string>;
  offset: number;
  limit: number;
}

export type GetRecommendedArtistsResponseDataType = {
  recommendedArtists: Array<ArtistInfoResponseDataType>;
  isMoreRecommendedArtistsForLoading: boolean;
}

export type ChangeSubscriptionRequestDataType = {
  subscription: string;
  cardId?: string; //if cardDetails is undefined
  cardDetails?: CardDetailsType; //if cardId is undefined
}

const HomePageContentSchema = new Schema({
  contentSectionId: { type: String, required: true },
  contentType: { type: String, required: true },
  contentTitle: { type: String, required: true },
  contentIds: [String]
});

const listenerSchema = new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  profileImageUrl: { type: String, required: false },
  backgroundColor: { type: String, required: false },
  lastProcessedSongPlayDataAt: { type: Date, required: false },
  lastSongRadioGeneratedAt: { type: Date, required: false },
  visitedContent: [VisitedContentSchema],
  homePageContentGeneratedAt: { type: Date, required: false },
  subscription: { type: String, required: true },
  homePageContent: [HomePageContentSchema],
  /**
   * Object structure: { [key: string]: number }
   */
  favoriteGenres: { type: Object, required: false },
  topSongsThisMonth: [String],
  topArtistsThisMonth: [String],
  topAlbumsThisMonth: [String],
  topContentThisMonthUpdatedAt: { type: Date, required: false },
  getStartedCompleted: { type: Boolean, required: true, default: false },
  lastSongGuesserStatsUpdatedAt: { type: Date, required: false },
  lastSongGuesserGuessesRecordsUpdatedAt: { type: Date, required: false }
});

listenerSchema.index({ homePageContentGeneratedAt: 1 });
listenerSchema.index({ topContentThisMonthUpdatedAt: 1 });
listenerSchema.index({ lastProcessedSongPlayDataAt: 1 });
listenerSchema.index({ _id: 1, country: 1, gender: 1 });

const ListenerModel = model('Listener', listenerSchema);

export default ListenerModel;
