import moment from "moment";
import ListenerModel from "../../models/listener.model";
import SongPlaysRawDataModel from "../../models/songPlaysRawData.model";
import SongPlaysModel from "../../models/songPlays.model";
import SongModel from "../../models/song.model";
import ArtistPlaysModel from "../../models/artistPlays.model";

export async function processSongPlayRawDataJob() {
  try {
    const dayAgoDate = moment().subtract(1, 'day');
    const listeners = await ListenerModel.find({
      $or: [
        { lastProcessedSongPlayDataAt: { $lt: dayAgoDate } },
        { lastProcessedSongPlayDataAt: { $exists: false } },
      ],
    }, { _id: 1 }).lean();
    for (const listener of listeners) {
      await processListenerSongPlayData(listener._id);
    }
  } catch (error) {
    console.log('Error while processing processSongPlayRawDataJob', error);
  }
}

async function processListenerSongPlayData(listenerId: string) {
  try {
    const songPlaysRawData = await SongPlaysRawDataModel.aggregate([
      { $match: { listenerId } },
      {
        $group: {
          _id: {
            songId: "$songId",
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          totalPlayTime: { $sum: "$time" },
          latestDate: { $max: "$date" }
        },
      },
      {
        $project: {
          _id: 0,
          songId: "$_id.songId",
          month: "$_id.month",
          year: "$_id.year",
          totalPlayTime: "$totalPlayTime",
          latestDate: "$latestDate"
        },
      },
    ]);
    for (const data of songPlaysRawData) {
      const songPlayDate = `${data.year}/${data.month}`;
      const song = await SongModel.findOne({ _id: data.songId }).lean();
      const songPlays = data.totalPlayTime / song.duration;

      await SongPlaysModel.updateOne(
        { listenerId: listenerId, songId: data.songId },
        { $inc: { [`plays.${songPlayDate}`]: songPlays, } },
        { upsert: true }
      );
      await ArtistPlaysModel.updateOne(
        { listenerId: listenerId, artistId: song.artistId },
        { $set: { lastPlayedDate: data.latestDate || new Date() } },
        { upsert: true }
      );
      await SongModel.updateOne({ _id: data.songId }, { $inc: { plays: songPlays } });

      await SongPlaysRawDataModel.deleteMany({ listenerId: listenerId });
      console.log('Successfully processed songs play data for listener with id ' + listenerId);
    }
  } catch (error) {
    console.log('Error while processing processSongPlayRawDataJob for listener with id ' + listenerId, error);
  }
}