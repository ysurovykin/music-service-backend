import SubscriptionsModel from "../../user/subscription/subscriptions.model";
import moment from "moment";

export async function continueSubscriptionJob() {
  try {
    const subscriptionsToContinue = await SubscriptionsModel.find({
      nextPaymentDate: { $lt: new Date() },
      $or: [
        { canceled: false },
        { canceled: { $exists: false } },
      ],
    }).lean();
    for (const subscription of subscriptionsToContinue) {
      await continueSubscription(subscription.userId, subscription.subscription, subscription.profileType, subscription.creditCardId);
    }
  } catch (error) {
    console.log('Error while processing continueSubscriptionJob', error);
  }
}

async function continueSubscription(userId: string, subscription: string, profileType: string, cardId: string) {
  try {
    //Actual attempt to purchase the subscription price from the card
    await SubscriptionsModel.updateOne(
      { userId: userId, subscription: subscription, profileType: profileType },
      { $set: { nextPaymentDate: moment().add(1, 'month').toDate() } }
    );
    console.log(`Successfully continued ${subscription} subscription for ${profileType} with id ${userId}`);
  } catch (error) {
    console.log(`Error while processing continueSubscription job for ${profileType} with id ${userId}`, error);
  }
}