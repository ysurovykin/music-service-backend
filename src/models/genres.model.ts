import { Schema, model } from 'mongoose';

const SimilarGenresSchema = new Schema({
  genreId: { type: String, required: true },
  similarity: { type: Number, required: true }
});

const GenresModel = model('Genres', new Schema({
  _id: { type: String },
  similarGenres: [SimilarGenresSchema]
}));

export default GenresModel;
