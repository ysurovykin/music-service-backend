import { Schema, model } from 'mongoose';

export type CreatePlaylistRequestDataType = {
  name: string;
  description?: string;
  songIds?: Array<string>;
  backgroundColor?: string;
};

export type EditPlaylistRequestDataType = CreatePlaylistRequestDataType & {
  playlistId: string;
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
  description: string;
  date: Date;
  editable: boolean;
  pinned: boolean;
  coverImageUrl: string;
  tag: PlaylistTagEnum;
  backgroundColor: string;
}

export type PlaylistFullResponseDataType = PlaylistInfoResponseDataType & {
  songsCount: number;
  songsTimeDuration: number; 
}

export type EditedPlaylistType = {
  playlistId: string;
  added: boolean;
}

export type PlaylistSongIdType = {
  id: string;
  date: Date;
}

const PlaylistSongIdSchema = new Schema({
  id: { type: String, required: true },
  date: { type: Date, required: true }
});

const PlaylistModel = model('Playlist', new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  description: { type: String, required: false },
  listenerId: { type: String, required: true },
  coverImageUrl: { type: String, required: false },
  date: { type: Date, required: true },
  editable: { type: Boolean, required: true },
  pinned: { type: Boolean, required: false },
  songIds: [PlaylistSongIdSchema],
  /**
   * @type {PlaylistTagEnum} playlist tag
   */
  tag: { type: String, required: false },
  backgroundColor: { type: String, required: true }
}));

export default PlaylistModel;
