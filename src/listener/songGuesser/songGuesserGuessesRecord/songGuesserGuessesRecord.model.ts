import { Schema, model } from 'mongoose';

const guessesSchema = new Schema({
  guesserSongName: { type: String, required: true },
  guesserArtistName: { type: String, required: true },
  skippedAnswers: { type: Number, required: true, default: 0 },
  closeAnswers: { type: Number, required: true, default: 0 },
  incorrectAnswers: { type: Number, required: true, default: 0 },
  correctAnswers: { type: Number, required: true, default: 0 },
});

const songGuesserGuessesRecordSchema = new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  guesses: [guessesSchema],
});

songGuesserGuessesRecordSchema.index({ listenerId: 1 });

const SongGuesserGuessesRecordModel = model('SongGuesserGuessesRecord', songGuesserGuessesRecordSchema);

export default SongGuesserGuessesRecordModel;
