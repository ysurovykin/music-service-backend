import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose, { ConnectOptions } from 'mongoose';
import userRouter from './src/router/user.router.ts';
import songRouter from './src/router/song.router.ts';
import albumRouter from './src/router/album.router.ts';
import artistRouter from './src/router/artist.router.ts';
import listenerRouter from './src/router/listener.router.ts';
import playlistRouter from './src/router/playlist.router.ts';
import queueRouter from './src/router/queue.router.ts';
import lyricsRouter from './src/router/lyrics.router.ts';

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

const start = async () => {
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(process.env.DB_URL!, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        } as ConnectOptions);
        app.listen(PORT, () => console.log(`Server started on PORT = ${PORT}`));
    } catch (error) {
        console.log(error);
    }
}

start();