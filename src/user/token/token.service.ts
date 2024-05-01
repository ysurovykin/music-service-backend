import jwt from 'jsonwebtoken';
import TokenModel, { TokenType } from './token.model';
import UserDto from '../user.dto';

type TokensType = {
    accessToken: string;
    refreshToken: string;
}

class TokenService {

    generateTokens(payload: UserDto): TokensType {
        const accessToken = jwt.sign(payload,
            payload.profileType === 'listener' ?
                process.env.LISTENER_JWT_ACCESS_SECRET :
                process.env.ARTIST_JWT_ACCESS_SECRET,
            { expiresIn: '24h' })
        const refreshToken = jwt.sign(payload,
            payload.profileType === 'listener' ?
                process.env.LISTENER_JWT_REFRESH_SECRET :
                process.env.ARTIST_JWT_REFRESH_SECRET,
            { expiresIn: '30d' })

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

    validateListenerAccessToken(token: string): UserDto | null {
        try {
            const userData = jwt.verify(token, process.env.LISTENER_JWT_ACCESS_SECRET);
            return userData as UserDto;
        } catch (error) {
            return null;
        }
    }

    validateArtistAccessToken(token: string): UserDto | null {
        try {
            const userData = jwt.verify(token, process.env.ARTIST_JWT_ACCESS_SECRET);
            return userData as UserDto;
        } catch (error) {
            return null;
        }
    }

    validateAccessToken(token: string): UserDto | null {
        try {
            const listenerUserData = jwt.verify(token, process.env.LISTENER_JWT_ACCESS_SECRET);
            return listenerUserData as UserDto;
        } catch {
            try {
                const artistUserData = jwt.verify(token, process.env.ARTIST_JWT_ACCESS_SECRET);
                return artistUserData as UserDto;
            } catch {
                return null;
            }
        }
    }

    validateRefreshToken(token: string, profileType: string): UserDto | null {
        try {
            const userData = jwt.verify(token, profileType === 'listener' ?
                process.env.LISTENER_JWT_REFRESH_SECRET :
                process.env.ARTIST_JWT_REFRESH_SECRET,);
            return userData as UserDto;
        } catch (error) {
            return null;
        }
    }

}

const tokenService = new TokenService();
export default tokenService;