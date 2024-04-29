import { HomePageContentTypesEnum } from "./src/listener/listener/listener.model";
import { SongGuesserDifficultyEnum } from "./src/listener/songGuesser/songGuesser.model";

// Maximum number of playlists for free subscription
export const freeSubscriptionMaxPlaylists = 5;

// Maximum number of playlists for paid subscription
export const paidSubscriptionMaxPlaylists = 10;

// Top songs this month count for free subscription
export const freeSubscriptionTopSongsThisMonthCount = 20;

// Top artists this month count for free subscription
export const freeSubscriptionTopArtistsThisMonthCount = 5;

// Top albums this month count for free subscription
export const freeSubscriptionTopAlbumsThisMonthCount = 5;

// Top songs this month count for pain subscription
export const paidSubscriptionTopSongsThisMonthCount = 50;

// Top artists this month count for pain subscription
export const paidSubscriptionTopArtistsThisMonthCount = 10;

// Top albums this month count for pain subscription
export const paidSubscriptionTopAlbumsThisMonthCount = 10;

// Song radio content limit for free subscription
export const freeSubscriptionSongRadioLimit = 20;

// Song radio content limit for paid subscription
export const paidSubscriptionSongRadioLimit = 50;

// Match genres and the language of requested song
export const mainSampleSizeMultiplier = 0.65;

// Match main artist of requested song
export const mainArtistSampleSizeMultiplier = 0.2;

// Can be any language and artists with simmilar genres to requested song genres
export const secondarySampleSizeMultiplier = 1 - (mainArtistSampleSizeMultiplier + mainSampleSizeMultiplier);

// Match co-artists of requested song
export const coArtistSampleSizeMultiplier = 0.1;

// Home page content sections amount for free subscription
export const freeSubscriptionHomePageContentSectionCount = 2;

// Home page content sections amount for paid subscription
export const paidSubscriptionHomePageContentSectionCount = 4;

// Home page section content limit for free subscription
export const freeSubscriptionHomePageSectionContentLimit = 5;

// Home page section content limit for paid subscription
export const paidSubscriptionHomePageSectionContentLimit = 10;

// Home page content sections: {sectionId: {title: string, type: HomePageContentTypesEnum}, ...}
export const homePageContentSections = {
  'MORE_LIKE_ARTIST': { title: 'More artists like /NAME/', type: HomePageContentTypesEnum.artist },
  'JUMP_BACK_TO_ARTISTS': { title: 'Jump back to these artists', type: HomePageContentTypesEnum.artist },
  'JUMP_BACK_TO_ALBUMS': { title: 'Jump back to these albums', type: HomePageContentTypesEnum.artist },
  'POPULAR_ARTISTS': { title: 'Your might like these artists', type: HomePageContentTypesEnum.artist },
  'POPULAR_ALBUMS': { title: 'Your might like these albums', type: HomePageContentTypesEnum.album },
  'FAVORITE_ARTISTS': { title: 'Your favorite artists', type: HomePageContentTypesEnum.artist },
  'FAVORITE_ALBUMS': { title: 'Your favorite albums', type: HomePageContentTypesEnum.album },
};

export const songGuesserDifficultiesInSeconds: { [key in SongGuesserDifficultyEnum]: number } = {
  [SongGuesserDifficultyEnum.NEW_TO_MUSIC]: 15,
  [SongGuesserDifficultyEnum.FREQUENT_LISTENER]: 10,
  [SongGuesserDifficultyEnum.TRUE_FAN]: 5,
}