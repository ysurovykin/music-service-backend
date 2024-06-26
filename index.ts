import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose, { ConnectOptions } from 'mongoose';
import userRouter from './src/user/user.router.ts';
import songRouter from './src/api/song/song.router.ts';
import albumRouter from './src/api/album/album.router.ts';
import artistRouter from './src/api/artist/artist.router.ts';
import listenerRouter from './src/api/listener/listener.router.ts';
import playlistRouter from './src/api/playlist/playlist.router.ts';
import queueRouter from './src/api/queue/queue.router.ts';
import lyricsRouter from './src/api/lyrics/lyrics.router.ts';
import songRadioRouter from './src/api/songRadio/songRadio.router.ts';
import songGuesserRouter from './src/api/songGuesser/songGuesser.router.ts';
import artistProfileRouter from './src/api/artistProfile/artistProfile.router.ts';
import { registerJob } from './src/jobs/jobRegister.ts';
import { processSongPlayRawDataJob } from './src/jobs/song/processSongPlayRawData.job.ts';
import { updateArtistMonthlyListenersJob } from './src/jobs/song/updateArtistMonthlyListeners.job.ts';
import { updateArtistFollowersJob } from './src/jobs/song/updateArtistFollowers.job.ts';
import errorMiddleware from './src/middlewares/error.middleware.ts';
import { generateHomePageContentJob } from './src/jobs/listener/generateHomePageContent.job.ts';
import { updateListenerTopContentThisMonthJob } from './src/jobs/listener/updateListenerTopContentThisMonth.job.ts';
import { continueSubscriptionJob } from './src/jobs/subscription/continueSubscription.job.ts';
import { cancelSubscriptionJob } from './src/jobs/subscription/cancelSubscription.job.ts';
import { updateSongGuesserStatsJob } from './src/jobs/songGuesser/updateSongGuesserStats.job.ts';
import { updateSongGuesserGuessesRecordsJob } from './src/jobs/songGuesser/updateSongGuesserGuessesRecords.job.ts';
import { closeInactiveSongGuessersJob } from './src/jobs/songGuesser/closeInactiveSongGuessers.job.ts';
import { updateArtistAlbumsStatsJob } from './src/jobs/artist/updateArtistAlbumsStats.job.ts';
import { updateArtistProfileStatsJob } from './src/jobs/artist/updateArtistProfileStats.job.ts';
import { updateRecentMostVisitedContentJob } from './src/jobs/listener/updateRecentMostVisitedContent.job.ts';

config();
const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}));
app.use('/user', userRouter);
app.use('/song', songRouter);
app.use('/album', albumRouter);
app.use('/artist', artistRouter);
app.use('/listener', listenerRouter);
app.use('/playlist', playlistRouter);
app.use('/queue', queueRouter);
app.use('/lyrics', lyricsRouter);
app.use('/song-radio', songRadioRouter);
app.use('/song-guesser', songGuesserRouter);
app.use('/artist-profile', artistProfileRouter);
app.use(errorMiddleware);

const start = async () => {
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(process.env.DB_URL!, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        } as ConnectOptions);
        registerJob(processSongPlayRawDataJob, 60 * 24); //once a day
        registerJob(updateArtistMonthlyListenersJob, 60 * 24); //once a day
        registerJob(updateArtistFollowersJob, 60 * 24); //once a day
        registerJob(generateHomePageContentJob, 60 * 6); //every 6 hours
        registerJob(updateListenerTopContentThisMonthJob, 60 * 6); //every 6 hours
        registerJob(continueSubscriptionJob, 60); //every hour
        registerJob(cancelSubscriptionJob, 60); //every hour
        registerJob(updateSongGuesserStatsJob, 60); //every hour
        registerJob(updateSongGuesserGuessesRecordsJob, 60); //every hour
        registerJob(closeInactiveSongGuessersJob, 60); //every hour
        registerJob(updateArtistAlbumsStatsJob, 60 * 6); //every 6 hours
        registerJob(updateArtistProfileStatsJob, 60 * 6); //every 6 hours
        registerJob(updateRecentMostVisitedContentJob, 60); //every hour
        app.listen(PORT, () => console.log(`Server started on PORT = ${PORT}`));
    } catch (error) {
        console.log(error);
    }
}

start();