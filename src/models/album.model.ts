import { Schema, model } from 'mongoose';
import { ArtistShortDataType } from './artist.model';
import { SongInfoResponseDataType } from './song.model';

export type CreateAlbumRequestDataType = {
  name: string;
  artistId: string;
};

export type AlbumShortDataType = {
  name: string;
  id: string;
}

export type AlbumWithoutArtistType = {
  albumId: string;
  name: string;
  date: Date;
  coverImageUrl: string;
  backgroundColor: string;
  lyricsBackgroundShadow: string;
  isAddedToLibrary?: boolean;
}

export type AlbumInfoResponseDataType = AlbumWithoutArtistType & {
  artist: ArtistShortDataType;
}

export type AlbumFullResponseDataType = AlbumInfoResponseDataType & {
  songsCount: number;
  songsTimeDuration: number;
}

export type GetAlbumsResponseType = {
  albums: Array<AlbumInfoResponseDataType>;
  isMoreAlbumsForLoading: boolean;
}

export type GetAlbumsInListenerLibraryResponseType = {
  likedAlbums: Array<AlbumInfoResponseDataType>;
  isMoreLikedAlbumsForLoading: boolean;
}

export type GetListenerTopAlbumsThisMonthResponseType = {
  topAlbumsThisMonth: Array<AlbumInfoResponseDataType>;
  isMoreTopAlbumsThisMonthForLoading: boolean;
}

const albumSchema = new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  artistId: { type: String, required: true },
  coverImageUrl: { type: String, required: true },
  likes: { type: Number, default: 0, required: true },
  /**
   * Object structure: { [key: string]: number }
   */
  languages: { type: Object, required: false },
  /**
   * Object structure: { [key: string]: number }
   */
  genres: { type: Object, required: false },
  date: { type: Date, required: true },
  backgroundColor: { type: String, required: true },
  lyricsBackgroundShadow: { type: String, required: true },
  songsCount: { type: Number, required: true, default: 0 },
  songIds: [String]
});

albumSchema.index({ artistId: 1 });
albumSchema.index({ name: 1 });
albumSchema.index({ artistId: 1, name: 1 });
albumSchema.index({ _id: 1, name: 1 });

const AlbumModel = model('Album', albumSchema);

export default AlbumModel;
