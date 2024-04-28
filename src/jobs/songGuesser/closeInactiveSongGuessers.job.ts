import moment from "moment";
import SongGuesserModel, { SongGuesserDifficultyEnum, SongGuesserRecordType } from "../../models/songGuesser.model";

export async function closeInactiveSongGuessersJob() {
  try {
    const hourAgoDate = moment().subtract(1, 'hour').toDate();
    const songGuessers = await SongGuesserModel.find({ finished: { $ne: true }, attemptStartedAt: { $lt: hourAgoDate } }).lean();
    for (const songGuesser of songGuessers) {
      await closeInactiveSongGuessers({ ...songGuesser, difficulty: songGuesser.difficulty as SongGuesserDifficultyEnum });
    }
  } catch (error) {
    console.log('Error while processing closeInactiveSongGuessersJob', error);
  }
}

async function closeInactiveSongGuessers(songGuesser: SongGuesserRecordType) {
  try {
    if (songGuesser) {
      if (songGuesser.answers?.length === 0 && songGuesser.mistakes === 0 && songGuesser.currentAttempt === 1) {
        await SongGuesserModel.deleteOne({ _id: songGuesser._id });
        return;
      }
      let correctAnswers: number = 0;
      let skippedAnswers: number = 0;
      let closeAnswers: number = 0;
      let timeSpentInSeconds: number = 0;
      for (const answer of songGuesser.answers) {
        if (answer.answered) {
          correctAnswers += 1;
        }
        if (answer.skipped) {
          skippedAnswers += 1;
        }
        if (answer.isCloseAnswer) {
          closeAnswers += 1;
        }
        if (answer.spentTimeInSeconds) {
          timeSpentInSeconds += answer.spentTimeInSeconds;
        }
      }

      await SongGuesserModel.updateOne({ _id: songGuesser._id }, {
        $set: {
          finished: true,
          finishedAt: new Date(),
          timeSpentInSeconds: timeSpentInSeconds,
          skippedAnswers: skippedAnswers,
          closeAnswers: closeAnswers,
          mistakes: songGuesser.mistakes,
          correctAnswers: correctAnswers
        }
      });
      console.log('Successfully closed song guesser with id ' + songGuesser?._id);
    }
  } catch (error) {
    console.log('Error while processing closeInactiveSongGuessers job for song guesser with id ' + songGuesser?._id, error);
  }
}