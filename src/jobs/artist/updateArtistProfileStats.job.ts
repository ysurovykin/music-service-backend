import moment from "moment";
import ArtistProfileModel, { ArtistAdvancedStatsType, ArtistGeneralStatsType } from "../../api/artistProfile/artistProfile.model";
import ArtistModel from "../../api/artist/artist.model";
import SongModel from "../../api/song/song.model";
import AlbumModel from "../../api/album/album.model";
import ArtistPlaysModel from "../../api/artist/artistPlays.model";
import SongRadioModel from "../../api/songRadio/songRadio.model";
import SongGuesserModel from "../../api/songGuesser/songGuesser.model";

export async function updateArtistProfileStatsJob() {
  try {
    const dayAgoDate = moment().subtract(1, 'day').toDate();
    const artists = await ArtistProfileModel.find({
      $or: [
        { artistProfileStatsUpdatedAt: { $lt: dayAgoDate } },
        { artistProfileStatsUpdatedAt: { $exists: false } },
      ],
    }, { _id: 1, subscription: 1 }).lean();
    for (const artist of artists) {
      await updateArtistProfileStats(artist._id, artist.subscription);
    }
  } catch (error) {
    console.log('Error while processing updateArtistProfileStatsJob', error);
  }
}

async function updateArtistProfileStats(artistId: string, subscription: string) {
  try {
    const artist = await ArtistModel.findOne({ _id: artistId }).lean();
    const albums = await AlbumModel.find({ artistId: artistId }).lean();
    const albumLikes = albums.reduce((accumulator, album) => accumulator + album.likes, 0)
    const songsInfo = await SongModel.aggregate([
      { $match: { artistId: artistId } },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration' },
          totalCount: { $count: {} }
        }
      },
    ]);
    const generalStats: ArtistGeneralStatsType = {
      likes: albumLikes,
      followers: artist.followers,
      listeners: artist.monthlyListeners,
      songsDuration: songsInfo[0]?.totalDuration,
      songsCount: songsInfo[0]?.totalCount
    };

    let advancedStats: ArtistAdvancedStatsType;
    if (subscription !== 'free') {
      const today = moment();
      const playDateThisMonth = `${today.year()}/${today.month() + 1}`;
      const playDatePreviousMonth = `${today.year()}/${today.month()}`;
      const plays = await ArtistPlaysModel.aggregate([
        { $match: { artistId: artistId } },
        {
          $project: {
            _id: 1,
            playsSum: {
              $sum: {
                $map: {
                  input: { $objectToArray: "$plays" },
                  as: "play",
                  in: { $add: ["$$play.v"] },
                },
              },
            },
            thisMonthPlays: `$plays.${playDateThisMonth}`,
            previousMonthPlays: `$plays.${playDatePreviousMonth}`
          },
        },
        {
          $group: {
            _id: null,
            totalPlaysSum: { $sum: "$playsSum" },
            totalThisMonthPlays: { $sum: "$thisMonthPlays" },
            totalPreviousMonthPlays: { $sum: "$previousMonthPlays" },
          },
        },
      ]);

      const playsDynamics = +plays[0]?.totalThisMonthPlays - +plays[0]?.totalPreviousMonthPlays
      const playsDynamicsString = playsDynamics < 0 ? `-${Math.abs(playsDynamics) || 0}` : `+${Math.abs(playsDynamics) || 0}`;

      const songRadios = await SongRadioModel.count({ artistId: artistId });
      const songGuessers = await SongGuesserModel.count({ 'filter.artist.id': artistId });

      advancedStats = {
        plays: +plays[0]?.totalPlaysSum || 0,
        playsDynamics: playsDynamicsString,
        songGuessers: songGuessers,
        songRadios: songRadios,
      };
    }
    await ArtistProfileModel.updateOne({ _id: artistId }, {
      $set: {
        artistProfileStatsUpdatedAt: new Date(),
        generalStats: generalStats,
        advancedStats: advancedStats
      }
    });
    console.log('Successfully update artist profile stats for artist with id ' + artistId);
  } catch (error) {
    console.log('Error while processing updateArtistProfileStats job for artist with id ' + artistId, error);
  }
}