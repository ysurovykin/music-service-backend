export const maxPlaylists = 20;

// Match genres and the language of requested song
export const mainSampleSizeMultiplier = 0.65;

// Match main artist of requested song
export const mainArtistSampleSizeMultiplier = 0.2;

// Can be any language and artists with simmilar genres to requested song genres
export const secondarySampleSizeMultiplier = 1 - (mainArtistSampleSizeMultiplier + mainSampleSizeMultiplier);

// Match co-artists of requested song
export const coArtistSampleSizeMultiplier = 0.1;