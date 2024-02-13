import UserDto from './user.dto';

export default class AuthorizedUserDto {
    accessToken: string;
    refreshToken: string;
    user: UserDto;

    constructor(model: any) {
        this.accessToken = model.accessToken;
        this.refreshToken = model.refreshToken;
        this.user = model.user;
    }
}