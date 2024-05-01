import { EditProfileRequestDataType } from './artistProfile.model';
import artistProfileService from './artistProfile.service'

class ArtistProfileController {
    async getArtistProfileById(req, res, next) {
        try {
            const { artistProfileId } = req.params;
            const artistProfile = await artistProfileService.getArtistProfileProfileById(artistProfileId);
            return res.json(artistProfile);
        } catch (error) {
            next(error);
        }
    }

    async editProfile(req, res, next) {
        try {
            const image: Express.Multer.File = req.file;
            const { artistProfileId } = req.query;
            const profileData: EditProfileRequestDataType = req.body;
            await artistProfileService.editProfile(artistProfileId, image, profileData);
            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }
}

const artistProfileController = new ArtistProfileController();
export default artistProfileController;