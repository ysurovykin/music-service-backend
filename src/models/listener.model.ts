import { Schema, model } from 'mongoose';
import { ArtistInfoResponseDataType } from './artist.model';
import { AlbumInfoResponseDataType } from './album.model';
import { PlaylistInfoResponseDataType } from './playlist.model';

export type CreateListenerRequestDataType = {
  name: string;
};

export type ListenerInfoResponseDataType = {
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

export type HomePageContentResponseDataType= {
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

const HomePageContentSchema = new Schema({
  contentSectionId: { type: String, required: true },
  contentType: { type: String, required: true },
  contentTitle: { type: String, required: true },
  contentIds: [String]
});

const ListenerModel = model('Listener', new Schema({
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
}));

export default ListenerModel;
