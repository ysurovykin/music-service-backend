import { Schema, model } from 'mongoose';

const subscriptionsModelSchema = new Schema({
  _id: { type: String },
  userId: { type: String, required: true },
  subscription: { type: String, required: true },
  profileType: { type: String, required: true },
  creditCardId: { type: String, required: true },
  nextPaymentDate: { type: Date, required: true },
  canceled: { type: Boolean, required: false }
});

subscriptionsModelSchema.index({ userId: 1, profileType: 1 });
subscriptionsModelSchema.index({ nextPaymentDate: 1, canceled: 1 });

const SubscriptionsModel = model('Subscriptions', subscriptionsModelSchema);

export default SubscriptionsModel;
