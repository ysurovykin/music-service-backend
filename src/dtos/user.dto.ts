export default class UserDto{
    userId: string;
    email: string;
    password: string;
    name: string;
    gender: string;
    country: string;
    role: string;
    birthDate: Object;
 
    constructor(model: any){
        this.userId = model._id || model.userId;
        this.email = model.email;
        this.password = model.password;
        this.name = model.name;
        this.gender = model.gender;
        this.country = model.country;
        this.role = model.role;
        this.birthDate = model.birthDate;
    }
}