import { Schema, model } from 'mongoose';

export type CardDetailsType = {
  holderName: string;
  number: string;
  date: string;
  cvv: string;
}

export type UserCreditCardInfoType = {
  cardId: string;
  lastDigits: string;
  active: boolean;
}

const creditCardsSchema = new Schema({
  _id: { type: String },
  userId: { type: String, required: true },
  holderName: { type: String, required: true },
  number: { type: String, required: true },
  date: { type: String, required: true },
  cvv: { type: String, required: true },
  deleted: { type: Boolean, required: false },
  activeForListener: { type: Boolean, required: false },
  activeForArtist: { type: Boolean, required: false },
});

creditCardsSchema.index({userId: 1, deleted: 1});
creditCardsSchema.index({userId: 1, activeForListener: 1});
creditCardsSchema.index({userId: 1, activeForArtist: 1});

const CreditCardsModel = model('CreditCards', creditCardsSchema);

export default CreditCardsModel;
