import moment from "moment";
import ListenerModel from "../../models/listener.model";
import SongGuesserStatsModel from "../../models/songGuesserStats.model";
import SongGuesserGuessesRecordModel from "../../models/songGuesserGuessesRecord.model";

export async function updateSongGuesserGuessesRecordsJob() {
  try {
    const dayAgoDate = moment().subtract(1, 'day').toDate();
    const listeners = await ListenerModel.find({
      $or: [
        { lastSongGuesserGuessesRecordsUpdatedAt: { $lt: dayAgoDate } },
        { lastSongGuesserGuessesRecordsUpdatedAt: { $exists: false } },
      ],
    }, { _id: 1 }).lean();
    for (const listener of listeners) {
      await updateSongGuesserGuessesRecords(listener._id);
    }
  } catch (error) {
    console.log('Error while processing updateSongGuesserGuessesRecordsJob', error);
  }
}

async function updateSongGuesserGuessesRecords(listenerId: string) {
  try {
    const mostSkippedGuesser = await getMostGuesse(listenerId, 'guesses.skippedAnswers');
    const mostCloseGuesser = await getMostGuesse(listenerId, 'guesses.closeAnswers');
    const mostIncorrectGuesser = await getMostGuesse(listenerId, 'guesses.incorrectAnswers');
    const mostCorrectGuesser = await getMostGuesse(listenerId, 'guesses.correctAnswers');

    await SongGuesserStatsModel.updateOne({ listenerId }, {
      $set: {
        mostSkippedGuesser: mostSkippedGuesser?.[0],
        mostCloseGuesser: mostCloseGuesser?.[0],
        mostIncorrectGuesser: mostIncorrectGuesser?.[0],
        mostCorrectGuesser: mostCorrectGuesser?.[0],
      }
    })
    console.log('Successfully updated song guesser guesses records for listener with id ' + listenerId);
    await ListenerModel.updateOne({ _id: listenerId }, { $set: { lastSongGuesserGuessesRecordsUpdatedAt: new Date() } });
  } catch (error) {
    console.log('Error while processing updateSongGuesserGuessesRecords job for listener with id ' + listenerId, error);
  }
}

async function getMostGuesse(listenerId: string, field: string) {
  return await SongGuesserGuessesRecordModel.aggregate([
    { $match: { listenerId } },
    { $unwind: '$guesses' },
    { $sort: { [field]: -1 }, },
    { $limit: 1 },
    {
      $project: {
        _id: 0,
        guesserSongName: '$guesses.guesserSongName',
        guesserArtistName: '$guesses.guesserArtistName',
        guesses: `$${field}`
      }
    }
  ]);
}