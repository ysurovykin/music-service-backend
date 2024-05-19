import ArtistProfileModel, {
    ArtistProfileInfoResponseDataType,
    ArtistStatsResponseDataType,
    EditProfileRequestDataType,
} from './artistProfile.model';
import { NotFoundError } from '../../errors/api-errors';
import ArtistProfileDto from './artistProfile.dto';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../../firebase.config';
import randomstring from 'randomstring';
import { getCoverDominantColor, getDominantColorWithShadow } from '../../helpers/imageCoverColor.helper';
import SubscriptionsModel from '../../user/subscription/subscriptions.model';
import moment from 'moment';
import ArtistModel from '../artist/artist.model';

class ArtistProfileService {

    async getArtistProfileProfileById(artistProfileId: string): Promise<ArtistProfileInfoResponseDataType> {
        const artist = await ArtistProfileModel.findOne({ _id: artistProfileId }).lean();
        if (!artist) {
            throw new NotFoundError(`ArtistProfile with id ${artistProfileId} not found`);
        }
        const artistDto = new ArtistProfileDto(artist);
        const subscriptionState = await SubscriptionsModel.findOne({ userId: artistProfileId, profileType: 'artist' }).lean();
        let subscriptionCanceledAtDate: string;
        if (subscriptionState?.canceled) {
            subscriptionCanceledAtDate = moment(subscriptionState.nextPaymentDate).format('DD.MM.YYYY');
        }
        return {
            ...artistDto,
            subscriptionCanceledAtDate
        };
    }

    async editProfile(artistProfileId: string, file: Express.Multer.File, profileData: EditProfileRequestDataType): Promise<void> {
        const artistProfile = await ArtistProfileModel.findOne({ _id: artistProfileId }).lean();
        const artist = await ArtistModel.findOne({ _id: artistProfileId }).lean();
        if (!artist || !artistProfile) {
            throw new NotFoundError(`Artist profile with id ${artistProfileId} not found`);
        }
        if (file) {
            const downloadUrl = `artist-profile-images/${artistProfileId}`;
            const storageRef = ref(storage, downloadUrl);
            await uploadBytes(storageRef, file.buffer, { contentType: 'image/jpeg' });
            let profileImageUrl = await getDownloadURL(storageRef);
            const indexOfTokenQuery = profileImageUrl.indexOf('&token')
            if (indexOfTokenQuery) {
                profileImageUrl = profileImageUrl.slice(0, indexOfTokenQuery);
            }
            const backgroundColor = await getCoverDominantColor(profileImageUrl);
            await ArtistProfileModel.updateOne({ _id: artistProfileId }, {
                $set: {
                    name: profileData.name,
                    profileImageUrl: profileImageUrl,
                    backgroundColor: backgroundColor
                }
            });
            await ArtistModel.updateOne({ _id: artistProfileId }, {
                $set: {
                    name: profileData.name,
                    profileImageUrl: profileImageUrl,
                    backgroundColor: backgroundColor
                }
            });
        } else {
            const downloadUrl = `artist-profile-images/${artistProfileId}`;
            const storageRef = ref(storage, downloadUrl);
            await deleteObject(storageRef);
            await ArtistProfileModel.updateOne({ _id: artistProfileId }, {
                $set: { name: profileData.name },
                $unset: { profileImageUrl: 1, backgroundColor: 1 }
            });
            await ArtistModel.updateOne({ _id: artistProfileId }, {
                $set: { name: profileData.name },
                $unset: { profileImageUrl: 1, backgroundColor: 1 }
            });
        }
    }

    async getArtistStats(artistId: string): Promise<ArtistStatsResponseDataType> {
        const artist = await ArtistModel.findOne({ _id: artistId }).lean();
        const artistProfile = await ArtistProfileModel.findOne({ _id: artistId }).lean();
        if (!artist || !artistProfile) {
            throw new NotFoundError(`Artist with id ${artistId} not found`);
        }
        const response: ArtistStatsResponseDataType = {
            generalStats: artistProfile.generalStats
        }
        if (artistProfile.subscription && artistProfile.subscription !== 'free') {
            response.advancedStats = artistProfile.advancedStats
        }
        return response;
    }

}

const artistService = new ArtistProfileService();
export default artistService;