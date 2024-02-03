import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase.config';
import SongModel, { CreateSongRequestDataType, SongInfoResponseDataType } from '../models/song.model';
import AlbumModel from '../models/album.model';
import { NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';
import SongDto from '../dtos/song.dto';
import ArtistModel from '../models/artist.model';
import { ArtistShortDataType } from '../models/artist.model';

class SongService {

    async upload(songData: CreateSongRequestDataType, file: Express.Multer.File): Promise<void> {
        const album = await AlbumModel.findOne({ _id: songData.albumId }).lean();
        if (!album) {
            throw new NotFoundError(`Album with id ${songData.albumId} not found`);
        }

        const songId = randomstring.generate(16);
        const songLink = `songs/${songData.artistId}/${album._id}/${songId}`;
        const storageRef = ref(storage, songLink);
        await uploadBytes(storageRef, file.buffer, {contentType: 'audio/mpeg'});

        await SongModel.create({
            ...songData,
            _id: songId,
            coverImageLink: album.coverImageLink,
            artistId: songData.artistId,
            coArtistIds: songData.coArtistIds,
            albumId: album._id,
            link: songLink,
            date: new Date()
        });
    }

    async loadSong(songId: string): Promise<SongInfoResponseDataType> {
        const song = await SongModel.findOne({_id: songId}).lean();
        if (!song) {
            throw new NotFoundError(`Song with id ${songId} not found`);
        }
        const album = await AlbumModel.findOne({_id: song.albumId}).lean();
        const artist = await ArtistModel.findOne({_id: song.albumId}).lean();
        const artists: Array<ArtistShortDataType> = [{
            id: song.artistId,
            name: artist.name
        }]
        for (const songCoArtistId of song.coArtistIds) {
            const coArtist = await ArtistModel.findOne({_id: songCoArtistId}).lean();
            artists.push({
                id: coArtist._id,
                name: coArtist.name
            })
        }
        const storageCoverImageRef = ref(storage, song.coverImageLink);
        const coverImageurl = await getDownloadURL(storageCoverImageRef);
        const storageSongRef = ref(storage, song.link);
        const songUrl = await getDownloadURL(storageSongRef);
        const songDto = new SongDto(song);
        return {
            ...songDto,
            album: {
                id: song.albumId,
                name: album.name
            },
            artists,
            coverImageurl, 
            songUrl
        };
    }

}

const songService = new SongService();
export default songService;