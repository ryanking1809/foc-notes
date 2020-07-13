import { observable, computed } from "mobx";
import { Messages } from "./message";

export class User {
    @observable id = "";
    @observable name = "";
    @observable realName = "";
    @observable avatar = "";
    constructor({id, name, real_name, profile}) {
        this.id = id;
        this.name = name;
        this.realName = real_name
        this.avatar = profile.image_72
    }
    @computed get messages() {
        return Messages.messagesByUserId[this.id]
    }
}

class UserList {
	@observable usersById = {};

	import(json) {
		json.forEach((j) => {
			const u = new User(j);
			this.usersById[u.id] = u;
		});
	}

	@computed get users() {
		return Object.values(this.usersById);
    }
}

export const Users = new UserList();