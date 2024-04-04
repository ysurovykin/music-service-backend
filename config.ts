import { HomePageContentTypesEnum } from "./src/models/listener.model";

// Maximum number of playlists for one listener
export const maxPlaylists = 20;

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