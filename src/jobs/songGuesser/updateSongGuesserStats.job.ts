import moment from "moment";
import ListenerModel from "../../api/listener/listener.model";
import SongGuesserModel from "../../api/songGuesser/songGuesser.model";
import SongGuesserStatsModel from "../../api/songGuesser/songGuesserStats/songGuesserStats.model";
import randomstring from "randomstring";
import SongGuesserGuessesRecordModel from "../../api/songGuesser/songGuesserGuessesRecord/songGuesserGuessesRecord.model";

export async function updateSongGuesserStatsJob() {
  try {
    const dayAgoDate = moment().subtract(1, 'day').toDate();
    const listeners = await ListenerModel.find({
      $or: [
        { lastSongGuesserStatsUpdatedAt: { $lt: dayAgoDate } },
        { lastSongGuesserStatsUpdatedAt: { $exists: false } },
      ],
    }, { _id: 1 }).lean();
    for (const listener of listeners) {
      await updateSongGuesserStats(listener._id);
    }
  } catch (error) {
    console.log('Error while processing updateSongGuesserStatsJob', error);
  }
}

async function updateSongGuesserStats(listenerId: string) {
  try {
    const songGuessers = await SongGuesserModel.find({ listenerId: listenerId, finished: true, isIncludedInStats: { $ne: true } }).lean();
    if (songGuessers.length) {
      let songGuesserStats = await SongGuesserStatsModel.findOne({ listenerId: listenerId }).lean();
      if (!songGuesserStats) {
        const songGuesserStatsId = randomstring.generate(16);
        songGuesserStats = await SongGuesserStatsModel.create({
          _id: songGuesserStatsId,
          listenerId: listenerId
        });
      }
      let totalGames = songGuesserStats.totalGames;
      let bestScore = songGuesserStats.bestScore;
      let bestGameId = songGuesserStats.bestGameId;
      let timeSpentInGuesserInSeconds = songGuesserStats.timeSpentInGuesserInSeconds;
      let correctGuesses = songGuesserStats.correctGuesses;
      let closeGuesses = songGuesserStats.closeGuesses;
      let incorrectGuesses = songGuesserStats.incorrectGuesses;
      let skippedGuesses = songGuesserStats.skippedGuesses;

      for (const songGuesser of songGuessers) {
        totalGames += 1;
        let correctAnswers: number = 0;
        let skippedAnswers: number = 0;
        let closeAnswers: number = 0;

        for (const answer of songGuesser.answers) {
          let fieldsToIncrement: any = {};
          let fieldsToIncert: any = {};
          if (answer.answered) {
            correctAnswers += 1;
            fieldsToIncrement['guesses.$.correctAnswers'] = 1;
            fieldsToIncert.correctAnswers = 1;
          } else {
            fieldsToIncrement['guesses.$.incorrectAnswers'] = 1;
            fieldsToIncert.incorrectAnswers = 1;
          }
          if (answer.skipped) {
            skippedAnswers += 1;
            fieldsToIncrement['guesses.$.skippedAnswers'] = 1;
            fieldsToIncert.skippedAnswers = 1;
          }
          if (answer.isCloseAnswer) {
            closeAnswers += 1;
            fieldsToIncrement['guesses.$.closeAnswers'] = 1;
            fieldsToIncert.closeAnswers = 1;
          }

          const guesserRecordToUpdate = await SongGuesserGuessesRecordModel.findOne({
            listenerId: listenerId, guesses: {
              $elemMatch: {
                guesserSongName: answer.song.name,
                guesserArtistName: answer.artist.name,
              }
            }
          }).lean();

          if (guesserRecordToUpdate) {
            await SongGuesserGuessesRecordModel.updateOne({
              listenerId: listenerId, guesses: {
                $elemMatch: {
                  guesserSongName: answer.song.name,
                  guesserArtistName: answer.artist.name,
                }
              }
            }, {
              $inc: fieldsToIncrement
            });
          } else {
            await SongGuesserGuessesRecordModel.updateOne({ listenerId: listenerId }, {
              $push: {
                guesses: {
                  guesserSongName: answer.song.name,
                  guesserArtistName: answer.artist.name,
                  ...fieldsToIncert
                }
              },
            }, {
              upsert: true
            });
          }
        }

        if (bestScore < correctAnswers) {
          bestScore = correctAnswers;
          bestGameId = songGuesser._id;
        }
        timeSpentInGuesserInSeconds += songGuesser.timeSpentInSeconds;
        correctGuesses += correctAnswers;
        closeGuesses += closeAnswers;
        incorrectGuesses += songGuesser.mistakes;
        skippedGuesses += skippedAnswers;
      }

      await SongGuesserStatsModel.updateOne({ listenerId: listenerId }, {
        $set: {
          totalGames: totalGames,
          bestScore: bestScore,
          bestGameId: bestGameId,
          timeSpentInGuesserInSeconds: timeSpentInGuesserInSeconds,
          correctGuesses: correctGuesses,
          closeGuesses: closeGuesses,
          incorrectGuesses: incorrectGuesses,
          skippedGuesses: skippedGuesses,
        }
      }).lean();
      await SongGuesserModel.updateMany({ listenerId: listenerId, finished: true, isIncludedInStats: { $ne: true } }, {
        $set: { isIncludedInStats: true }
      });
      await ListenerModel.updateOne({ _id: listenerId }, { $set: { lastSongGuesserStatsUpdatedAt: new Date() } });

      console.log('Successfully updated song guesser stats for listener with id ' + listenerId);
    }
  } catch (error) {
    console.log('Error while processing updateSongGuesserStats job for listener with id ' + listenerId, error);
  }
}