import { Schema, model } from 'mongoose';

export type CreateListenerRequestDataType = {
  name: string;
};

export type ListenerInfoResponseDataType = {
  name: string;
}

const ListenerSchema = model('Listener', new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  profileImageUrl: { type: String, required: false },
  backgroundColor: { type: String, required: false }
}));

export default ListenerSchema;
