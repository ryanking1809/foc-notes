import { observable, computed } from "mobx";
import { Messages } from "./message";
class Tag {
	@observable name = "";
	@observable shortcut = "";
	constructor(name, shortcut) {
		this.name = name;
		this.shortcut = shortcut;
    }
    @computed get selected() {
        return Tags.selectedTagIds.includes(this.name);
    }
}

class TagCollection {
	// shortcuts can technically be konami, eg. "z e" -> "zettel"
	// however I haven't figured out how the system should act
	// if there is a "z" code and a "z e" code
	// for reference https://github.com/ryanking1809/hyper-interactive
	@observable tagsById = {
		"zettel-related": new Tag("zettel-related", "z"),
		"not-zettel": new Tag("not-zettel", "x"),
		"investigate-later": new Tag("investigate-later", "i"),
		"link-list": new Tag("link-list", "l"),
		"roam-research": new Tag("roam-research", "r"),
	};
	@computed get selectedTagIds() {
		const tagsArray = Messages.selectedMessages.map((m) => [...m.tagIds]);
		// find intersection of all tags
		return tagsArray.reduce((a, b) => a.filter((c) => b.includes(c)));
	}
	@computed get selectedTags() {
		return this.selectedTagIds.map((tId) => this.tagsById[tId]);
	}
	@computed get tags() {
		return Object.values(this.tagsById);
	}
}

export const Tags = new TagCollection();