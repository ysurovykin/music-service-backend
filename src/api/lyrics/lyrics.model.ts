import { Schema, model } from 'mongoose';

export type LyricsInfoResponseDataType = {
  synchronized: boolean;
  lyrics: Array<LyricsDataType>;
};

export type LyricsDataType = {
  text: string;
  start?: string;
  end?: string;
};

const LyricsSchema = new Schema({
  text: { type: String, required: true },
  start: { type: String, required: false },
  end: { type: String, required: false },
});

const lyricsSchema = new Schema({
  _id: { type: String },
  lyrics: [LyricsSchema],
  synchronized: { type: Boolean, required: true }
});

const LyricsModel = model('Lyrics', lyricsSchema);

export default LyricsModel;
