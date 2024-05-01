import moment from "moment";
import randomstring from "randomstring";
import CreditCardsModel, { CardDetailsType } from "../creditCards/creditCards.model";
import SubscriptionsModel from "./subscriptions.model";
import ListenerModel from "../../api/listener/listener.model";
import ArtistModel from "../../api/artist/artist.model";
import ArtistProfileModel from "../../api/artistProfile/artistProfile.model";

class SubscriptionService {

  async updateSubscription(userId: string, subscription: string, cardDetails: CardDetailsType, creditCardId: string, profileType: string) {
    const isListenerProfile = profileType === 'listener';
    if (subscription === 'free') {
      await this._cancelSubscription(userId, profileType);
    } else {
      if (creditCardId) {
        await this._updateActiveUserCreditCard(userId, creditCardId, isListenerProfile);
        if (isListenerProfile) {
          await ListenerModel.updateOne({ _id: userId }, { $set: { subscription: subscription } }).lean();
          if (subscription === 'ultimate') {
            await ArtistProfileModel.updateOne({ _id: userId }, { $set: { subscription: subscription } }).lean();
          }
        } else {
          await ArtistProfileModel.updateOne({ _id: userId }, { $set: { subscription: subscription } }).lean();
          if (subscription === 'ultimate') {
            await ListenerModel.updateOne({ _id: userId }, { $set: { subscription: subscription } }).lean();
          }
        }
        await this._registerSubscription(userId, subscription, creditCardId, profileType);
      } else if (cardDetails) {
        await this._unsetActiveUserCreditCard(userId, isListenerProfile);
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
          if (subscription === 'ultimate') {
            await ArtistProfileModel.updateOne({ _id: userId }, { $set: { subscription: subscription } }).lean();
          }
        } else {
          await ArtistProfileModel.updateOne({ _id: userId }, { $set: { subscription: subscription } }).lean();
          if (subscription === 'ultimate') {
            await ListenerModel.updateOne({ _id: userId }, { $set: { subscription: subscription } }).lean();
          }
        }
        await this._registerSubscription(userId, subscription, newCardId, profileType);
      }
    }
  }

  async _cancelSubscription(userId: string, profileType: string): Promise<void> {
    const isListenerProfile = profileType === 'listener';
    const subscriptionInfo = await SubscriptionsModel.findOne({ userId: userId, profileType: profileType }).lean();

    await SubscriptionsModel.updateOne({ userId: userId, profileType: profileType }, { $set: { canceled: true } }).lean();
    if (isListenerProfile) {
      await CreditCardsModel.updateOne({ userId: userId, activeForListener: true }, { $set: { activeForListener: false } }).lean();
    } else {
      await CreditCardsModel.updateOne({ userId: userId, activeForArtist: true }, { $set: { activeForArtist: false } }).lean();
    }

    if (subscriptionInfo.subscription === 'ultimate') {
      await SubscriptionsModel.updateOne({
        userId: userId,
        ...(profileType === 'listener' ? { profileType: 'artist' } : { profileType: 'listener' })
      }, {
        $set: { canceled: true }
      }).lean();
      if (isListenerProfile) {
        await CreditCardsModel.updateOne({ userId: userId, activeForArtist: true }, { $set: { activeForArtist: false } }).lean();
      } else {
        await CreditCardsModel.updateOne({ userId: userId, activeForListener: true }, { $set: { activeForListener: false } }).lean();
      }
    }
  }

  async _unsetActiveUserCreditCard(userId: string, isListenerProfile: boolean): Promise<void> {
    const activeUserCreditCard = await CreditCardsModel.findOne({
      userId: userId,
      ...(isListenerProfile ? { activeForListener: true } : { activeForArtist: true })
    }).lean();
    if (activeUserCreditCard) {
      if (activeUserCreditCard.deleted) {
        await CreditCardsModel.deleteOne({ userId: userId });
      } else {
        await CreditCardsModel.updateOne({ userId: userId }, {
          $set: { ...(isListenerProfile ? { activeForListener: false } : { activeForArtist: false }) }
        }).lean();
      }
    }
  }

  async _updateActiveUserCreditCard(userId: string, creditCardId: string, isListenerProfile: boolean): Promise<void> {
    const sameActiveUserCreditCard = await CreditCardsModel.findOne({
      _id: creditCardId,
      ...(isListenerProfile ? { activeForListener: true } : { activeForArtist: true })
    }).lean();
    if (!sameActiveUserCreditCard) {
      await this._unsetActiveUserCreditCard(userId, isListenerProfile);
      await CreditCardsModel.updateOne({ _id: creditCardId }, {
        $set: { ...(isListenerProfile ? { activeForListener: true } : { activeForArtist: true }) }
      }).lean();
    }
  }

  async _registerSubscription(userId: string, subscription: string, creditCardId: string, profileType: string): Promise<void> {
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