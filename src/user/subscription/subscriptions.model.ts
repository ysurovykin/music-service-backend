import { Schema, model } from 'mongoose';

const subscriptionsSchema = new Schema({
  _id: { type: String },
  userId: { type: String, required: true },
  subscription: { type: String, required: true },
  profileType: { type: String, required: true },
  creditCardId: { type: String, required: true },
  nextPaymentDate: { type: Date, required: true },
  canceled: { type: Boolean, required: false }
});

subscriptionsSchema.index({ userId: 1, profileType: 1 });
subscriptionsSchema.index({ nextPaymentDate: 1, canceled: 1 });

const SubscriptionsModel = model('Subscriptions', subscriptionsSchema);

export default SubscriptionsModel;
