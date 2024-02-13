export default class ListenerDto {
    name: string;

    constructor(model: any) {
        this.name = model.name;
    }
}