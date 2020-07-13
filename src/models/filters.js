import { observable, computed } from "mobx"

class filters {
	@observable includeKeywords = ["zett", "roam", " note", " wiki"];
	@observable excludeKeywords = [];
	@observable includeTags = [];
	@observable excludeTags = [];
	@observable includeUsers = [];
	@observable excludeUsers = [];
	@observable onlyTagged = false;
	@observable showContext = true;
	checkMessage(m) {
		return (
            this.checkMessageHasTags(m) &&
			this.checkMessageIncludesUsers(m) &&
			this.checkMessageExcludesUsers(m) &&
			this.checkMessageIncludesTags(m) &&
			this.checkMessageExcludesTags(m) &&
			this.checkMessageIncludesKeywords(m) &&
			this.checkMessageExcludesKeywords(m)
		);
	}
	checkMessageHasTags(m) {
		if (!this.onlyTagged) return true;
		return Boolean(m.tags.length);
	}
	checkMessageIncludesUsers(m) {
		if (!this.includeUsers.length) return true;
		return this.includeUsers.includes(m.userId);
	}
	checkMessageExcludesUsers(m) {
		if (!this.excludeUsers.length) return true;
		return !this.excludeUsers.includes(m.userId);
	}
	checkMessageIncludesTags(m) {
		if (!this.includeTags.length) return true;
		return [...m.tags].some((t) => this.includeTags.includes(t));
	}
	checkMessageExcludesTags(m) {
		if (!this.excludeTags.length || !m.tags.size) return true;
		return ![...m.tags].some((t) => this.excludeTags.includes(t));
	}
	checkMessageIncludesKeywords(m) {
		if (!this.includeKeywords.length) return true;
		return this.includeKeywords.some((k) => m.text.includes(k));
	}
	checkMessageExcludesKeywords(m) {
		if (!this.excludeKeywords.length) return true;
		return !this.excludeKeywords.some((k) => m.text.includes(k));
	}
}

export const Filters = new filters();