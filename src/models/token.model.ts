import { Schema, model } from 'mongoose';

export type TokenType = {
    userId: string;
    refreshToken: string;
};

const TokenModel = model('Token', new Schema({
    userId: { type: String, required: true },
    refreshToken: { type: String, required: true }
}));

export default TokenModel;