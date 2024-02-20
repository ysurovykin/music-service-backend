export default class ListenerDto {
    name: string;
    profileImageUrl: string;
    backgroundColor: string;

    constructor(model: any) {
        this.name = model.name;
        this.profileImageUrl = model.profileImageUrl;
        this.backgroundColor = model.backgroundColor;
    }
}