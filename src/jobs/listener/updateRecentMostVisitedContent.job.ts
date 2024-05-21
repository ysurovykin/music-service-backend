import moment from "moment";
import ListenerModel, { VisitedContentDataType } from "../../api/listener/listener.model";
import { NotFoundError } from "../../errors/api-errors";
import AlbumModel from "../../api/album/album.model";

export async function updateRecentMostVisitedContentJob() {
  try {
    const dayAgoDate = moment().subtract(1, 'day').toDate();
    const listeners = await ListenerModel.find({
      $or: [
        { recentMostVisitedContentGeneratedAt: { $lt: dayAgoDate } },
        { recentMostVisitedContentGeneratedAt: { $exists: false } },
      ],
    }, { _id: 1 }).lean();
    for (const listener of listeners) {
      await updateRecentMostVisitedContent(listener._id);
    }
  } catch (error) {
    console.log('Error while processing updateRecentMostVisitedContentJob', error);
  }
}

async function updateRecentMostVisitedContent(listenerId: string) {
  try {
    const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
    if (!listener) {
      throw new NotFoundError(`Listener with id ${listenerId} not found`);
    }
    const visitedContent = listener.visitedContent;
    let visitedContentFormated: Array<VisitedContentDataType> = [];
    if (!visitedContent || !visitedContent.length) {
      visitedContentFormated = [];
    } else if (visitedContent.length <= 8) {
      visitedContentFormated = visitedContent.sort((a, b) => b.visitsCounter - a.visitsCounter).map(content => ({
        contentId: content.contentId,
        lastVisited: content.lastVisited,
        type: content.type,
        visitsCounter: content.visitsCounter
      }));
      const visitedAlbums = visitedContentFormated.filter(content => content.type === 'album');
      if (visitedAlbums) {
        const albumIds = visitedAlbums.map(album => album.contentId);
        const hiddenAlbums = await AlbumModel.find({
          _id: { $in: albumIds },
          $or: [{ hidden: true }, { releaseDate: { $lt: new Date() } }]
        }, { _id: 1 }).lean();
        if (hiddenAlbums.length) {
          const hiddenAlbumIds = hiddenAlbums.map(hiddenAlbum => hiddenAlbum._id);
          visitedContentFormated = visitedContentFormated.filter(content => !hiddenAlbumIds.includes(content.contentId));
        }
      }
    } else {
      let visitedContentToParse = [];
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const mostRecentVisited = visitedContent.filter(content => content.lastVisited > oneWeekAgo);
      if (mostRecentVisited.length >= 8) {
        mostRecentVisited.sort((a, b) => b.visitsCounter - a.visitsCounter);
        visitedContentToParse = mostRecentVisited.slice(0, 8);
        let startIndex = 8;
        let startIndexForOldContent = 0;
        do {
          const visitedAlbums = visitedContentToParse.filter(content => content.type === 'album');
          if (visitedAlbums) {
            const albumIds = visitedAlbums.map(album => album.contentId);
            const hiddenAlbums = await AlbumModel.find({
              _id: { $in: albumIds },
              $or: [{ hidden: true }, { releaseDate: { $lt: new Date() } }]
            }, { _id: 1 }).lean();
            if (hiddenAlbums.length) {
              const hiddenAlbumIds = hiddenAlbums.map(hiddenAlbum => hiddenAlbum._id);
              visitedContentToParse = visitedContentToParse.filter(content => !hiddenAlbumIds.includes(content.contentId));
              let additionalContent = mostRecentVisited.slice(startIndex, startIndex + hiddenAlbums.length);
              if (!additionalContent.length) {
                const oldVisited = visitedContent.filter(content => content.lastVisited < oneWeekAgo);
                oldVisited.sort((a, b) => b.visitsCounter - a.visitsCounter)
                additionalContent = oldVisited.slice(startIndexForOldContent, startIndexForOldContent + hiddenAlbums.length);
                startIndexForOldContent += hiddenAlbums.length;
                if (!additionalContent.length) {
                  break;
                }
              }
              visitedContentToParse = [...visitedContentToParse, ...additionalContent]
              startIndex += hiddenAlbums.length;
            }
          }
        } while (visitedContentToParse.length < 8);
      } else {
        const oldVisited = visitedContent.filter(content => content.lastVisited < oneWeekAgo);
        mostRecentVisited.sort((a, b) => b.visitsCounter - a.visitsCounter);
        oldVisited.sort((a, b) => b.visitsCounter - a.visitsCounter)
        const oldVisitedSorted = oldVisited.slice(0, 8 - mostRecentVisited.length);
        visitedContentToParse = [...mostRecentVisited, ...oldVisitedSorted];
        let startIndex = 8 - mostRecentVisited.length;
        do {
          const visitedAlbums = visitedContentToParse.filter(content => content.type === 'album');
          if (visitedAlbums) {
            const albumIds = visitedAlbums.map(album => album.contentId);
            const hiddenAlbums = await AlbumModel.find({
              _id: { $in: albumIds },
              $or: [{ hidden: true }, { releaseDate: { $lt: new Date() } }]
            }, { _id: 1 }).lean();
            if (hiddenAlbums.length) {
              const hiddenAlbumIds = hiddenAlbums.map(hiddenAlbum => hiddenAlbum._id);
              visitedContentToParse = visitedContentToParse.filter(content => !hiddenAlbumIds.includes(content.contentId));
              const additionalContent = oldVisited.slice(startIndex, startIndex + hiddenAlbums.length);
              if (!additionalContent.length) {
                break;
              }
              visitedContentToParse = [...visitedContentToParse, ...additionalContent]
              startIndex += hiddenAlbums.length;
            }
          }
        } while (visitedContentToParse.length < 8);
      }
      visitedContentFormated = visitedContentToParse.map(content => ({
        contentId: content.contentId,
        lastVisited: content.lastVisited,
        type: content.type,
        visitsCounter: content.visitsCounter
      }));
    }
    await ListenerModel.updateOne({ _id: listenerId }, {
      $set: {
        recentMostVisitedContentGeneratedAt: new Date(),
        recentMostVisitedContent: visitedContentFormated
      }
    });
    console.log('Successfully update recent most visited content for listener with id ' + listenerId);
  } catch (error) {
    console.log('Error while processing updateRecentMostVisitedContent job for listener with id ' + listenerId, error);
  }
}