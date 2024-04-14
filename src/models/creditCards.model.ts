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

const CreditCardsModel = model('CreditCards', new Schema({
  _id: { type: String },
  userId: { type: String, required: true },
  holderName: { type: String, required: true },
  number: { type: String, required: true },
  date: { type: String, required: true },
  cvv: { type: String, required: true },
  deleted: { type: Boolean, required: false },
  activeForListener: { type: Boolean, required: false },
  activeForArtist: { type: Boolean, required: false },
}));

export default CreditCardsModel;
