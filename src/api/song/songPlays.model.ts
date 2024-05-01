import { Schema, model } from 'mongoose';

const songPlayRawDataSchema = new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  songId: { type: String, required: true },
  lastPlayedDate: { type: Date, required: true },
  // plays: {'yyyy/MM': number}
  plays: { type: Object, required: true }
});

songPlayRawDataSchema.index({ listenerId: 1, songId: 1 });
songPlayRawDataSchema.index({ listenerId: 1, lastPlayedDate: 1 });

const SongPlaysModel = model('SongPlays', songPlayRawDataSchema);

export default SongPlaysModel;
