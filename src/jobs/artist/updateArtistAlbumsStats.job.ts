import moment from "moment";
import ArtistProfileModel from "../../api/artistProfile/artistProfile.model";
import AlbumModel, { AlbumAdvancedStatsType, AlbumGeneralStatsType } from "../../api/album/album.model";
import SongModel from "../../api/song/song.model";
import AlbumPlaysModel from "../../api/album/albumPlays.model";
import SongRadioModel from "../../api/songRadio/songRadio.model";
import SongGuesserModel from "../../api/songGuesser/songGuesser.model";

export async function updateArtistAlbumsStatsJob() {
  try {
    const dayAgoDate = moment().subtract(1, 'day').toDate();
    const artists = await ArtistProfileModel.find({
      $or: [
        { artistAlbumsStatsUpdatedAt: { $lt: dayAgoDate } },
        { artistAlbumsStatsUpdatedAt: { $exists: false } },
      ],
    }, { _id: 1, subscription: 1 }).lean();
    for (const artist of artists) {
      await updateArtistAlbumsStats(artist._id, artist.subscription);
    }
  } catch (error) {
    console.log('Error while processing updateArtistAlbumsStatsJob', error);
  }
}

async function updateArtistAlbumsStats(artistId: string, subscription: string) {
  try {
    const albums = await AlbumModel.find({ artistId: artistId }, { _id: 1, likes: 1 }).lean();
    for (const album of albums) {
      const songsInfo = await SongModel.aggregate([
        { $match: { albumId: album._id } },
        {
          $group: {
            _id: null,
            totalDuration: { $sum: '$duration' },
            totalCount: { $count: {} }
          }
        },
      ]);
      const generalStats: AlbumGeneralStatsType = {
        likes: album.likes,
        songsTimeDuration: songsInfo[0]?.totalDuration,
        songsCount: songsInfo[0]?.totalCount
      };

      let advancedStats: AlbumAdvancedStatsType;
      if (subscription !== 'free') {
        const today = moment();
        const playDateThisMonth = `${today.year()}/${today.month() + 1}`;
        const playDatePreviousMonth = `${today.year()}/${today.month()}`;
        const plays = await AlbumPlaysModel.aggregate([
          { $match: { albumId: album._id } },
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

        const songRadios = await SongRadioModel.count({ albumId: album._id });
        const songGuessers = await SongGuesserModel.count({ 'filter.album.id': album._id });

        advancedStats = {
          plays: +plays[0]?.totalPlaysSum || 0,
          playsDynamics: playsDynamicsString,
          songGuessers: songGuessers,
          songRadios: songRadios,
        };
      }
      await AlbumModel.updateOne({ _id: album._id }, { $set: { generalStats: generalStats, advancedStats: advancedStats } });
      await ArtistProfileModel.updateOne({ _id: artistId }, { $set: { artistAlbumsStatsUpdatedAt: new Date() } });
    }
    console.log('Successfully update artist profile stats for artist with id ' + artistId);
  } catch (error) {
    console.log('Error while processing updateArtistAlbumsStats job for artist with id ' + artistId, error);
  }
}