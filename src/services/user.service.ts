import bcrypt from 'bcrypt';
import randomstring from 'randomstring';
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase.config';
import UserModel, { CreateUserRequestDataType } from '../models/user.model';
import ArtistModel from '../models/artist.model';
import ListenerModel from '../models/listener.model';
import PlaylistModel from '../models/playlist.model';
import UserDto from '../dtos/user.dto';
import { NotFoundError, UnauthorizedError, ValidationError } from '../errors/api-errors';
import tokenService from './token.service';

type AuthorizedUserData = {
    accessToken: string;
    refreshToken: string;
    user: UserDto;
}

class UserService {

    async registration(userData: CreateUserRequestDataType): Promise<AuthorizedUserData> {
        const pretender = await UserModel.findOne({ email: userData.email }).lean();
        if (pretender) {
            throw new NotFoundError(`User with email ${userData.email} already exists`);
        }
        const hashedPassword = await bcrypt.hash(userData.password, 3);

        const birthDate = new Date(userData.birthDate);
        const userId = randomstring.generate(16);
        const newUser = await UserModel.create({
            _id: userId,
            country: userData.country,
            email: userData.email,
            gender: userData.gender,
            name: userData.name,
            password: hashedPassword,
            birthDate: {
                day: birthDate.getDate(),
                month: birthDate.getMonth() + 1,
                year: birthDate.getFullYear()
            },
            profileType: userData.profileType
        });

        if (userData.profileType === 'listener') {
            await ListenerModel.create({
                _id: userId,
                name: userData.name,
                date: new Date()
            });
            const playlistId = randomstring.generate(16);
            await PlaylistModel.create({
                _id: playlistId,
                name: 'Liked Songs',
                editable: false,
                pinned: true,
                listenerId: userId,
                backgroundColor: 'rgb(65, 177, 56)',
                date: new Date()
            });
        } else if (userData.profileType === 'artist') {
            await ArtistModel.create({
                _id: userId,
                name: userData.name,
                date: new Date()
            });
        }

        const userDto = new UserDto(newUser);
        const tokens = tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(userDto.userId, tokens.refreshToken);

        return { ...tokens, user: userDto }
    }

    async login(email: string, password: string): Promise<AuthorizedUserData> {
        const user = await UserModel.findOne({ email }).lean();
        if (!user) {
            throw new NotFoundError(`User with email ${email} not found`);
        }
        const isCorrectPassword = await bcrypt.compare(password, user.password);
        if (!isCorrectPassword) {
            throw new ValidationError('Incorrect password');
        }
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto })
        await tokenService.saveToken(userDto.userId, tokens.refreshToken);

        return { ...tokens, user: userDto }
    }

    async logout(refreshToken: string): Promise<void> {
        await tokenService.removeToken(refreshToken);
    }

    async refresh(refreshToken: string, isRetry: boolean): Promise<AuthorizedUserData> {
        if (!refreshToken) {
            throw new UnauthorizedError(undefined, { isRetry });
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const currentToken = await tokenService.findToken(refreshToken);
        if (!userData || !currentToken) {
            throw new UnauthorizedError(undefined, { isRetry });
        }
        const user = await UserModel.findById(userData.userId).lean();
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto })
        await tokenService.saveToken(userDto.userId, tokens.refreshToken);

        return { ...tokens, user: userDto }
    }

    async getUserByEmail(email: string): Promise<UserDto> {
        const userData = await UserModel.findOne({ email }).lean();
        if (!userData) {
            throw new NotFoundError(`User with email ${email} not found`);
        }
        const userDto = new UserDto(userData);
        return userDto;
    }
}

const userService = new UserService();
export default userService;