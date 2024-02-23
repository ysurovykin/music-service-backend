import { Schema, model } from 'mongoose';

export type CreatePlaylistRequestDataType = {
  name: string;
  listenerId: string;
  songIds?: Array<string>;
};

export type PlaylistShortDataType = {
  name: string;
  id: string;
}

export enum PlaylistTagEnum {
  'liked' = 'liked'
}

export type PlaylistInfoResponseDataType = {
  playlistId: string;
  name: string;
  date: Date;
  coverImageUrl: string;
  tag: PlaylistTagEnum;
  backgroundColor: string;
}

const PlaylistSchema = model('Playlist', new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  listenerId: { type: String, required: true },
  coverImageUrl: { type: String, required: true },
  date: { type: Date, required: true },
  editable: { type: Boolean, required: true },
  songIds: [String],
  /**
   * @type {PlaylistTagEnum} playlist tag
   */
  tag: { type: String, required: false },
  backgroundColor: { type: String, required: true }
}));

export default PlaylistSchema;
