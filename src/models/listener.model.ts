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

export type MostVisitedContentDataType =
  ArtistInfoResponseDataType & { type: 'artist' } |
  AlbumInfoResponseDataType & { type: 'album' } |
  PlaylistInfoResponseDataType & { type: 'playlist' };

export type VisitedContentDataType = {
  contnetId: string;
  type: string;
  lastVisited: Date;
  visitsCounter: number;
}

const VisitedContentSchema = new Schema({
  contnetId: { type: String, required: true },
  type: { type: String, required: true },
  lastVisited: { type: Date, required: true },
  visitsCounter: { type: Number, required: true },
});

const ListenerModel = model('Listener', new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  profileImageUrl: { type: String, required: false },
  backgroundColor: { type: String, required: false },
  lastProcessedSongPlayDataAt: { type: Date, required: false },
  lastSongRadioGeneratedAt: { type: Date, required: false },
  visitedContent: [VisitedContentSchema]
}));

export default ListenerModel;
