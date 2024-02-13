import jwt from 'jsonwebtoken';
import TokenModel, { TokenType } from '../models/token.model';
import UserDto from '../dtos/user.dto';

type TokensType = {
    accessToken: string;
    refreshToken: string;
}

class TokenService {

    generateTokens(payload: UserDto): TokensType {
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '30s' })
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' })

        return {
            accessToken,
            refreshToken
        };
    }

    async saveToken(userId: string, refreshToken: string): Promise<void> {
        await TokenModel.updateOne({ userId }, { $set: { refreshToken } }, { upsert: true });
    }

    async removeToken(refreshToken: string): Promise<void> {
        await TokenModel.deleteOne({ refreshToken });
    }

    async findToken(refreshToken: string): Promise<TokenType | null> {
        const token = await TokenModel.findOne({ refreshToken }).lean();
        return token ? { userId: token.userId, refreshToken: token.refreshToken } : null;
    }

    validateAccessToken(token: string): UserDto | null {
        try {
            const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            return userData as UserDto;
        } catch (error) {
            return null;
        }
    }

    validateRefreshToken(token: string): UserDto | null {
        try {
            const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            return userData as UserDto;
        } catch (error) {
            return null;
        }
    }

}

const tokenService = new TokenService();
export default tokenService;