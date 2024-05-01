import moment from "moment";
import ArtistModel from "../../api/artist/artist.model";
import FollowedArtistsModel from "../../api/artist/followedArtists.model";

export async function updateArtistFollowersJob() {
  try {
    const weekAgoDate = moment().subtract(7, 'days').toDate();
    const artists = await ArtistModel.find({
      $or: [
        { followersUpdatedAt: { $lt: weekAgoDate } },
        { followersUpdatedAt: { $exists: false } },
      ],
    }, { _id: 1 }).lean();
    for (const artist of artists) {
      await updateArtistFollowers(artist._id);
    }
  } catch (error) {
    console.log('Error while processing updateArtistFollowersJob', error);
  }
}

async function updateArtistFollowers(artistId: string) {
  try {
    const followers = await FollowedArtistsModel.count({ artistId: artistId });
    await ArtistModel.updateOne(
      { _id: artistId },
      { $set: { followers: followers, followersUpdatedAt: new Date() } }
    );
    console.log('Successfully updated followers for artist with id ' + artistId);
  } catch (error) {
    console.log('Error while processing updateArtistFollowers job for artist with id ' + artistId, error);
  }
}