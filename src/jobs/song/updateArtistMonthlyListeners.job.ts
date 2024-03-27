import moment from "moment";
import ArtistPlaysModel from "../../models/artistPlays.model";
import ArtistModel from "../../models/artist.model";

export async function updateArtistMonthlyListenersJob() {
  try {
    const weekAgoDate = moment().subtract(7, 'days');
    const artists = await ArtistModel.find({
      $or: [
        { monthlyListenersUpdatedAt: { $lt: weekAgoDate } },
        { monthlyListenersUpdatedAt: { $exists: false } },
      ],
    }, { _id: 1 }).lean();
    for (const artist of artists) {
      await updateArtistMonthlyListeners(artist._id);
    }
  } catch (error) {
    console.log('Error while processing updateArtistMonthlyListenersJob', error);
  }
}

async function updateArtistMonthlyListeners(artistId: string) {
  try {
    const thresholdDate = moment().subtract(1, 'month');
    const monthlyListeners = await ArtistPlaysModel.count({ artistId: artistId, lastPlayedDate: { $gt: thresholdDate } });
    await ArtistModel.updateOne(
      { _id: artistId },
      { $set: { monthlyListeners: monthlyListeners, monthlyListenersUpdatedAt: new Date() } }
    );
    console.log('Successfully updated monthly listeners for artist with id ' + artistId);
  } catch (error) {
    console.log('Error while processing updateArtistMonthlyListenersJob for artist with id ' + artistId, error);
  }
}