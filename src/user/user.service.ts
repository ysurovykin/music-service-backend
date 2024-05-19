import bcrypt from 'bcrypt';
import randomstring from 'randomstring';
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase.config';
import UserModel, { CreateUserRequestDataType } from './user.model';
import ArtistModel from '../api/artist/artist.model';
import ListenerModel from '../api/listener/listener.model';
import PlaylistModel from '../api/playlist/playlist.model';
import UserDto from './user.dto';
import { NotFoundError, UnauthorizedError, ValidationError } from '../errors/api-errors';
import tokenService from './token/token.service';
import ArtistProfileModel from '../api/artistProfile/artistProfile.model';
import SubscriptionsModel from './subscription/subscriptions.model';
import CreditCardsModel, { CardDetailsType, UserCreditCardInfoType } from './creditCards/creditCards.model';
import subscriptionService from './subscription/subscription.service';

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

        const userId = randomstring.generate(16);
        const newUser = await UserModel.create({
            _id: userId,
            country: userData.country,
            email: userData.email,
            gender: userData.gender,
            name: userData.name,
            password: hashedPassword,
            birthDate: {
                day: +userData.birthDate.day,
                month: +userData.birthDate.month,
                year: +userData.birthDate.year
            },
            profileType: userData.profileType,
            hasListenerProfile: userData.profileType === 'listener',
            hasArtistProfile: userData.profileType === 'artist',
        });

        if (userData.profileType === 'listener') {
            await ListenerModel.create({
                _id: userId,
                name: userData.name,
                subscription: 'free',
                date: new Date()
            });
            const playlistId = randomstring.generate(16);
            await PlaylistModel.create({
                _id: playlistId,
                name: 'Liked Songs',
                tag: 'liked',
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
            await ArtistProfileModel.create({
                _id: userId,
                name: userData.name,
                subscription: 'free',
                date: new Date()
            });
        }

        const userDto = new UserDto(newUser);
        const tokens = tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(userDto.userId, tokens.refreshToken);

        return { ...tokens, user: userDto }
    }

    async login(email: string, password: string, profileType: string): Promise<AuthorizedUserData> {
        const user = await UserModel.findOne({ email }).lean();
        if (!user) {
            throw new NotFoundError(`User with email ${email} not found`);
        }
        await UserModel.updateOne({ _id: user._id }, { $set: { profileType: profileType } });
        const isCorrectPassword = await bcrypt.compare(password, user.password);
        if (!isCorrectPassword) {
            throw new ValidationError('Incorrect password');
        }
        const userDto = new UserDto({ ...user, profileType: profileType });
        const tokens = tokenService.generateTokens({ ...userDto })
        await tokenService.saveToken(userDto.userId, tokens.refreshToken);

        return { ...tokens, user: userDto }
    }

    async logout(refreshToken: string): Promise<void> {
        await tokenService.removeToken(refreshToken);
    }

    async refresh(refreshToken: string, profileType: string, isRetry: boolean): Promise<AuthorizedUserData> {
        if (!refreshToken) {
            throw new UnauthorizedError(undefined, { isRetry });
        }
        const userData = tokenService.validateRefreshToken(refreshToken, profileType);
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

    async switchProfileType(userId: string, newProfileType: string, shouldCreateNew: boolean): Promise<AuthorizedUserData> {
        const user = await UserModel.findOne({ _id: userId }).lean();
        if (!user) {
            throw new NotFoundError(`User with id ${userId} not found`);
        }
        user.profileType = newProfileType;

        if (shouldCreateNew) {
            if ((newProfileType === 'listener') && !user.hasListenerProfile) {
                const subscription = await SubscriptionsModel.findOne({ userId: userId, profileType: 'listener' }).lean();
                await ListenerModel.create({
                    _id: userId,
                    name: user.name,
                    subscription: subscription?.subscription ? subscription.subscription : 'free',
                    date: new Date()
                });
                const playlistId = randomstring.generate(16);
                await PlaylistModel.create({
                    _id: playlistId,
                    name: 'Liked Songs',
                    tag: 'liked',
                    editable: false,
                    pinned: true,
                    listenerId: userId,
                    backgroundColor: 'rgb(65, 177, 56)',
                    date: new Date()
                });
                await UserModel.updateOne({ _id: userId }, { $set: { profileType: newProfileType, hasArtistProfile: true } });
                user.hasListenerProfile = true;
            } else if ((newProfileType === 'artist') && !user.hasArtistProfile) {
                const subscription = await SubscriptionsModel.findOne({ userId: userId, profileType: 'artist' }).lean();
                await ArtistModel.create({
                    _id: userId,
                    name: user.name,
                    date: new Date()
                });
                await ArtistProfileModel.create({
                    _id: userId,
                    name: user.name,
                    subscription: subscription?.subscription ? subscription.subscription : 'free',
                    date: new Date()
                });
                await UserModel.updateOne({ _id: userId }, { $set: { profileType: newProfileType, hasListenerProfile: true } });
                user.hasArtistProfile = true;
            }
        } else {
            await UserModel.updateOne({ _id: userId }, { $set: { profileType: newProfileType } });
        }
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto })
        await tokenService.saveToken(userDto.userId, tokens.refreshToken);

        return { ...tokens, user: userDto }
    }

    async getUserCreditCards(userId: string): Promise<Array<UserCreditCardInfoType>> {
        const user = await UserModel.findOne({ _id: userId }).lean();
        if (!user) {
            throw new NotFoundError(`User with id ${userId} not found`);
        }
        const userCreditCards = await CreditCardsModel.find({ userId: userId, deleted: { $ne: true } }).lean();
        const formatedCreditCards: Array<UserCreditCardInfoType> = userCreditCards.map(card => ({
            cardId: card._id,
            lastDigits: card.number.slice(-4),
            active: card.activeForListener || card.activeForArtist
        }));
        return formatedCreditCards;
    }

    async changeSubscription(userId: string, subscription: string, cardId: string,
        cardDetails: CardDetailsType, profileType: string): Promise<void> {
        const user = await UserModel.findOne({ _id: userId }).lean();
        if (!user) {
            throw new NotFoundError(`User with id ${userId} not found`);
        }
        await subscriptionService.updateSubscription(userId, subscription, cardDetails, cardId, profileType);
    }

    async deleteUserCreditCard(userId: string, cardId: string): Promise<void> {
        const user = await UserModel.findOne({ _id: userId }).lean();
        if (!user) {
            throw new NotFoundError(`User with id ${userId} not found`);
        }
        await CreditCardsModel.deleteOne({ _id: cardId });
    }

}

const userService = new UserService();
export default userService;