import moment from "moment";
import ListenerModel from "../../models/listener.model";
import ArtistPlaysModel from "../../models/artistPlays.model";
import AlbumPlaysModel from "../../models/albumPlays.model";
import SongPlaysModel from "../../models/songPlays.model";
import { freeSubscriptionTopAlbumsThisMonthCount, freeSubscriptionTopArtistsThisMonthCount, freeSubscriptionTopSongsThisMonthCount, paidSubscriptionTopAlbumsThisMonthCount, paidSubscriptionTopArtistsThisMonthCount, paidSubscriptionTopSongsThisMonthCount } from "../../../config";

export async function updateListenerTopContentThisMonthJob() {
  try {
    const dayAgoDate = moment().subtract(1, 'day').toDate();
    const listeners = await ListenerModel.find({
      $or: [
        { topContentThisMonthUpdatedAt: { $lt: dayAgoDate } },
        { topContentThisMonthUpdatedAt: { $exists: false } },
      ],
    }, { _id: 1 }).lean();
    for (const listener of listeners) {
      await updateListenerTopContentThisMonth(listener._id, listener.subscription);
    }
  } catch (error) {
    console.log('Error while processing updateListenerTopContentThisMonthJob', error);
  }
}

async function updateListenerTopContentThisMonth(listenerId: string, subscription: string) {
  try {
    const today = moment();
    const startMonthDate = new Date(today.year(), today.month(), 1);
    const playDateThisMonth = `${today.year()}/${today.month() + 1}`;
    const topSongsThisMonthLimit = subscription === 'free' ?
      freeSubscriptionTopSongsThisMonthCount :
      paidSubscriptionTopSongsThisMonthCount;
    const topSongsThisMonth = await SongPlaysModel.aggregate([
      { $match: { listenerId: listenerId, lastPlayedDate: { $gte: startMonthDate } } },
      {
        $project: {
          weight: `$plays.${playDateThisMonth}`,
          songId: '$songId'
        }
      },
      { $sort: { weight: -1 } },
      { $limit: topSongsThisMonthLimit },
    ]);
    const topSongsThisMonthIds = topSongsThisMonth.map(song => song.songId);

    const topArtistsThisMonthLimit = subscription === 'free' ?
      freeSubscriptionTopArtistsThisMonthCount :
      paidSubscriptionTopArtistsThisMonthCount;
    const topArtistsThisMonth = await ArtistPlaysModel.aggregate([
      { $match: { listenerId: listenerId, lastPlayedDate: { $gte: startMonthDate } } },
      {
        $project: {
          weight: `$plays.${playDateThisMonth}`,
          artistId: '$artistId'
        }
      },
      { $sort: { weight: -1 } },
      { $limit: topArtistsThisMonthLimit },
    ]);
    const topArtistsThisMonthIds = topArtistsThisMonth.map(artist => artist.artistId);

    const topAlbumsThisMonthLimit = subscription === 'free' ?
      freeSubscriptionTopAlbumsThisMonthCount :
      paidSubscriptionTopAlbumsThisMonthCount;
    const topAlbumsThisMonth = await AlbumPlaysModel.aggregate([
      { $match: { listenerId: listenerId, lastPlayedDate: { $gte: startMonthDate } } },
      {
        $project: {
          weight: `$plays.${playDateThisMonth}`,
          albumId: '$albumId'
        }
      },
      { $sort: { weight: -1 } },
      { $limit: topAlbumsThisMonthLimit },
    ]);
    const topAlbumsThisMonthIds = topAlbumsThisMonth.map(album => album.albumId);
    await ListenerModel.updateOne(
      { _id: listenerId },
      {
        $set: {
          topSongsThisMonth: topSongsThisMonthIds,
          topArtistsThisMonth: topArtistsThisMonthIds,
          topAlbumsThisMonth: topAlbumsThisMonthIds,
          topContentThisMonthUpdatedAt: new Date()
        }
      }
    );
    console.log('Successfully update top monthly content for listener with id ' + listenerId);
  } catch (error) {
    console.log('Error while processing updateListenerTopContentThisMonth job for listener with id ' + listenerId, error);
  }
}