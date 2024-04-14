import { Schema, model } from 'mongoose';

export type TokenType = {
    userId: string;
    refreshToken: string;
};

const tokenSchema = new Schema({
    userId: { type: String, required: true },
    refreshToken: { type: String, required: true }
});

tokenSchema.index({ userId: 1 });
tokenSchema.index({ refreshToken: 1 });

const TokenModel = model('Token', tokenSchema);

export default TokenModel;