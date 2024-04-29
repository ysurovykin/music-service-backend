import moment from "moment";
import randomstring from "randomstring";
import CreditCardsModel, { CardDetailsType } from "../creditCards/creditCards.model";
import SubscriptionsModel from "./subscriptions.model";
import ListenerModel from "../../listener/listener/listener.model";
import ArtistModel from "../../listener/artist/artist.model";

class SubscriptionService {

  async updateSubscription(userId: string, subscription: string, cardDetails: CardDetailsType, creditCardId: string, profileType: string) {
    const isListenerProfile = profileType === 'listener';
    if (subscription === 'free') {
      await SubscriptionsModel.updateOne({ userId: userId, profileType: profileType }, { $set: { canceled: true } }).lean();
      if (isListenerProfile) {
        await CreditCardsModel.updateOne({ userId: userId, activeForListener: true }, { $set: { activeForListener: false } }).lean();
      } else {
        await CreditCardsModel.updateOne({ userId: userId, activeForArtist: true }, { $set: { activeForArtist: false } }).lean();
      }
    } else {
      if (creditCardId) {
        await this._unsetActiveUserCreditCard(userId);
        await CreditCardsModel.updateOne({ _id: creditCardId }, { $set: { activate: true } }).lean();
        if (isListenerProfile) {
          await ListenerModel.updateOne({ _id: userId }, { $set: { subscription: subscription } }).lean();
        } else {
          await ArtistModel.updateOne({ _id: userId }, { $set: { subscription: subscription } }).lean();
        }
        await this._registerSubscription(userId, subscription, creditCardId, profileType);
      } else if (cardDetails) {
        await this._unsetActiveUserCreditCard(userId);
        const newCardId = randomstring.generate(16);
        await CreditCardsModel.create({
          _id: newCardId,
          userId: userId,
          ...(isListenerProfile ? { activeForListener: true } : { activeForArtist: true }),
          holderName: cardDetails.holderName,
          number: cardDetails.number,
          date: cardDetails.date,
          cvv: cardDetails.cvv
        });
        if (isListenerProfile) {
          await ListenerModel.updateOne({ _id: userId }, { $set: { subscription: subscription } }).lean();
        } else {
          await ArtistModel.updateOne({ _id: userId }, { $set: { subscription: subscription } }).lean();
        }
        await this._registerSubscription(userId, subscription, newCardId, profileType);
      }
    }
  }
  async _unsetActiveUserCreditCard(userId: string): Promise<void> {
    const activeForListenerUserCreditCard = await CreditCardsModel.findOne({ userId: userId, activeForListener: true }).lean();
    if (activeForListenerUserCreditCard) {
      if (activeForListenerUserCreditCard.deleted) {
        await CreditCardsModel.deleteOne({ userId: userId });
      } else {
        await CreditCardsModel.updateOne({ userId: userId }, { $set: { activate: false } }).lean();
      }
    }
  }

  async _registerSubscription(userId: string, subscription: string, creditCardId: string, profileType: string): Promise<void> {
    await SubscriptionsModel.findOne({ userId: userId, profileType: 'listener' }).lean();
    if (subscription === 'premium') {
      await SubscriptionsModel.updateOne(
        { userId: userId, profileType: profileType },
        { $set: { subscription: subscription, creditCardId: creditCardId, nextPaymentDate: moment().add(1, 'month').toDate() } },
        { upsert: true }
      );
    } else if (subscription === 'ultimate') {
      await SubscriptionsModel.updateOne(
        { userId: userId, profileType: 'listener' },
        { $set: { subscription: subscription, creditCardId: creditCardId, nextPaymentDate: moment().add(1, 'month').toDate() } },
        { upsert: true }
      );
      await SubscriptionsModel.updateOne(
        { userId: userId, profileType: 'artist' },
        { $set: { subscription: subscription, creditCardId: creditCardId, nextPaymentDate: moment().add(1, 'month').toDate() } },
        { upsert: true }
      );
    }
  }


}

const subscriptionService = new SubscriptionService();
export default subscriptionService;