import { Schema, model } from 'mongoose';

export type ArtistSocialLinks = {
  name: string;
  link: string;
}

export type ArtistShortDataType = {
  name: string;
  id: string;
}

export type ArtistInfoResponseDataType = {
  artistId: string;
  name: string;
  country: string;
  description: string;
  socialLinks: Array<ArtistSocialLinks>;
  followers: number;
  monthlyListeners: number;
  profileImageUrl: string;
  backgroundColor: string;
  songsCount: number;
}

export type ArtistFullResponseDataType = ArtistInfoResponseDataType & {
  isFollowed: boolean;
  songsCount: number;
  songsTimeDuration: number;
  likedSongsTimeDuration: number;
  likedSongsCount: number;
  albumsCount: number;
  albumsWhereAppearsCount: number;
}

export type ArtistGenresType = {
  name: string;
  percentage: number;
}

export type GetArtistsResponseType = {
  artists: Array<ArtistInfoResponseDataType>;
  isMoreArtistsForLoading: boolean;
}

export type GetArtistsInListenerLibraryResponseType = {
  followedArtists: Array<ArtistInfoResponseDataType>;
  isMoreFollowedArtistsForLoading: boolean;
}

export type GetListenerTopArtistsThisMonthResponseType = {
  topArtistsThisMonth: Array<ArtistInfoResponseDataType>;
  isMoreTopArtistsThisMonthForLoading: boolean;
}

const artistSchema = new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  description: { type: String, required: false },
  /**
   * type: Array<ArtistSocialLinks>
   */
  socialLinks: { type: Object, required: false },
  /**
   * Object structure: { [key: string]: number }
   */
  languages: { type: Object, required: false },
  /**
   * Object structure: { [key: string]: number }
   */
  genres: { type: Object, required: false },
  followers: { type: Number, required: true, default: 0 },
  followersUpdatedAt: { type: Date, required: false },
  monthlyListeners: { type: Number, required: true, default: 0 },
  monthlyListenersUpdatedAt: { type: Date, required: false },
  date: { type: Date, required: true },
  profileImageUrl: { type: String, required: false },
  backgroundColor: { type: String, required: false },
  songsCount: { type: Number, required: true, default: 0 },
});

artistSchema.index({ followersUpdatedAt: 1 });
artistSchema.index({ monthlyListenersUpdatedAt: 1 });
artistSchema.index({ name: 1 });
artistSchema.index({ _id: 1, name: 1 });

const ArtistModel = model('Artist', artistSchema);

export default ArtistModel;
