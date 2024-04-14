import ListenerModel from "../../models/listener.model";
import SubscriptionsModel from "../../models/subscriptions.model";
import ArtistModel from "../../models/artist.model";

export async function cancelSubscriptionJob() {
  try {
    const subscriptionsToCancel = await SubscriptionsModel.find({
      nextPaymentDate: { $lt: new Date() },
      canceled: true
    }).lean();
    for (const subscription of subscriptionsToCancel) {
      await cancelSubscription(subscription.userId, subscription.subscription, subscription.profileType);
    }
  } catch (error) {
    console.log('Error while processing cancelSubscriptionJob', error);
  }
}

async function cancelSubscription(userId: string, subscription: string, profileType: string) {
  try {
    if (profileType === 'listener') {
      await SubscriptionsModel.deleteOne({ userId: userId, subscription: subscription, profileType: profileType });
      await ListenerModel.updateOne({ _id: userId }, { $set: { subscription: 'free' } });
    } else {
      await SubscriptionsModel.deleteOne({ userId: userId, subscription: subscription, profileType: profileType });
      await ArtistModel.updateOne({ _id: userId }, { $set: { subscription: 'free' } });
    }
    console.log(`Successfully cancel ${subscription} subscription for ${profileType} with id ${userId}`);
  } catch (error) {
    console.log(`Error while processing cancelSubscription job for ${profileType} with id ${userId}`, error);
  }
}