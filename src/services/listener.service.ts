import ListenerModel, { ListenerInfoResponseDataType, MostVisitedContentDataType, VisitedContentDataType } from '../models/listener.model';
import { NotFoundError } from '../errors/api-errors';
import ListenerDto from '../dtos/listener.dto';
import ArtistDto from '../dtos/artist.dto';
import ArtistModel, { ArtistInfoResponseDataType, ArtistShortDataType } from '../models/artist.model';
import AlbumModel, { AlbumInfoResponseDataType } from '../models/album.model';
import AlbumDto from '../dtos/album.dto';
import PlaylistModel, { PlaylistInfoResponseDataType, PlaylistTagEnum } from '../models/playlist.model';

class ListenerService {

    async getListenerById(listenerId: string): Promise<ListenerInfoResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }

        const listenerDto = new ListenerDto(listener);
        return {
            ...listenerDto
        };
    }

    async getRecentMostVisitedContent(listenerId: string): Promise<Array<MostVisitedContentDataType>> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }
        const visitedContent = listener.visitedContent;
        let mostVisitedContent: Array<MostVisitedContentDataType> = [];
        let visitedContentFormated: Array<VisitedContentDataType> = [];
        if (!visitedContent || !visitedContent.length) {
            visitedContentFormated = [];
        } else if (visitedContent.length <= 8) {
            visitedContentFormated = visitedContent.sort((a, b) => b.visitsCounter - a.visitsCounter).map(content => ({
                contnetId: content.contnetId,
                lastVisited: content.lastVisited,
                type: content.type,
                visitsCounter: content.visitsCounter
            }));
        } else {
            let visitedContentToParse = [];
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const mostRecentVisited = visitedContent.filter(contnet => contnet.lastVisited > oneWeekAgo);
            if (mostRecentVisited.length >= 8) {
                mostRecentVisited.sort((a, b) => b.visitsCounter - a.visitsCounter);
                visitedContentToParse = visitedContentToParse.slice(0, 8);
            } else {
                const oldVisited = visitedContent.filter(contnet => contnet.lastVisited < oneWeekAgo);
                const mostRecentVisitedSorted = mostRecentVisited
                    .sort((a, b) => b.visitsCounter - a.visitsCounter);
                const oldVisitedSorted = oldVisited.sort((a, b) => b.visitsCounter - a.visitsCounter)
                    .slice(0, 8 - mostRecentVisitedSorted.length);
                visitedContentToParse = [...mostRecentVisited, ...oldVisitedSorted];
            }
            visitedContentFormated = visitedContentToParse.map(content => ({
                contnetId: content.contnetId,
                lastVisited: content.lastVisited,
                type: content.type,
                visitsCounter: content.visitsCounter
            }));
        }
        for (let place of visitedContentFormated) {
            if (place.type === 'artist') {
                const artist = await ArtistModel.findOne({ _id: place.contnetId }).lean();
                const artistDto = new ArtistDto(artist);
                mostVisitedContent.push({
                    ...artistDto,
                    type: 'artist'
                });
            } else if (place.type === 'album') {
                const album = await AlbumModel.findOne({ _id: place.contnetId }).lean();
                const artist = await ArtistModel.findOne({ _id: album.artistId }).lean();
                if (!artist) {
                    throw new NotFoundError(`Artist with id ${album.artistId} not found`);
                }
                const artistData: ArtistShortDataType = {
                    name: artist.name,
                    id: artist._id
                };

                const albumDto = new AlbumDto(album);
                mostVisitedContent.push({
                    ...albumDto,
                    artist: artistData,
                    type: 'album'
                });
            } else if (place.type === 'playlist') {
                const playlist = await PlaylistModel.findOne({ _id: place.contnetId }).lean();
                mostVisitedContent.push({
                    playlistId: playlist._id,
                    name: playlist.name,
                    description: playlist.description,
                    date: playlist.date,
                    editable: playlist.editable,
                    pinned: playlist.pinned,
                    tag: playlist.tag as PlaylistTagEnum,
                    coverImageUrl: playlist.coverImageUrl,
                    backgroundColor: playlist.backgroundColor,
                    type: 'playlist'
                });
            }
        }
        return mostVisitedContent;
    }

    async _updateVisitedContent(listenerId: string, contentType: 'artist' | 'album' | 'playlist',
        content: ArtistInfoResponseDataType & { type: 'artist' } |
            AlbumInfoResponseDataType & { type: 'album' } |
            PlaylistInfoResponseDataType & { type: 'playlist' }) {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        const visitedContent = listener.visitedContent;
        let contentId: string;
        if (content.type === 'album') {
            contentId = content.albumId;
        } else if (content.type === 'artist') {
            contentId = content.artistId;
        } else if (content.type === 'playlist') {
            contentId = content.playlistId;
        }
        const visitedContentInfo = visitedContent && visitedContent.find(item => item.type === contentType && item.contnetId === contentId);
        if (visitedContentInfo) {
            await ListenerModel.updateOne({ _id: listenerId },
                {
                    $set: { "visitedContent.$[updateElement].lastVisited": new Date() },
                    $inc: { "visitedContent.$[updateElement].visitsCounter": 1 }
                },
                {
                    arrayFilters: [
                        {
                            'updateElement.contnetId': contentId,
                            'updateElement.type': contentType
                        }
                    ]
                }
            )
        } else {
            await ListenerModel.updateOne({ _id: listenerId },
                {
                    $push: {
                        "visitedContent": {
                            type: contentType,
                            contnetId: contentId,
                            lastVisited: new Date(),
                            visitsCounter: 1
                        }
                    },
                }
            )
        }
    }

}

const listenerService = new ListenerService();
export default listenerService;