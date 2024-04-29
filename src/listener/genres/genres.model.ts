import { Schema, model } from 'mongoose';

const SimilarGenresSchema = new Schema({
  genreId: { type: String, required: true },
  name: { type: String, required: true },
  similarity: { type: Number, required: true }
});

const genresSchema = new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  similarGenres: [SimilarGenresSchema]
});

genresSchema.index({ _id: 1, name: 1 });

const GenresModel = model('Genres', genresSchema);

export default GenresModel;
