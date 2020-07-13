import { Users } from "./user"
import { observable, computed } from "mobx"
import { Filters } from "./filters";
import { Tags } from "./tag";
import { Notes } from "./note";
import {boundMethod} from 'autobind-decorator'

export class Message {
			@observable text = "";
			@observable ts = 0;
			@observable replyIds = [];
			@observable userId = null;
			@observable parentId = null;
			@observable channel = "general";
			@observable tagIds = new Set();
			@observable noteIds = new Set();
			constructor({
				text,
				user,
				ts,
				replies,
				thread_ts,
				parent_user_id,
				channel,
				tags = [],
				notes = [],
			}) {
				this.text = text;
				this.userId = user;
				this.ts = ts;
				this.replyIds = replies && replies.map((r) => r.ts + r.user);
				this.parentId =
					thread_ts && parent_user_id && thread_ts + parent_user_id;
				this.channel = channel;
				this.tagIds = new Set(tags);
				this.noteIds = new Set(notes);
			}
			@computed get id() {
				// slack threads refer to each other using userId & timestamps
				// but not the existing message id
				return this.ts + this.userId;
			}
			@computed get replies() {
				return (
					(this.replyIds &&
						this.replyIds.map(
							(rId) => Messages.messagesById[rId]
						)) ||
					[]
				);
			}
			@computed get parent() {
				return Messages.messagesById[this.parentId];
			}
			@computed get isReply() {
				return this.parentId ? true : false;
			}
			@computed get user() {
				return Users.usersById[this.userId];
			}
			@computed get date() {
				return new Date(parseInt(this.ts * 1000));
			}
			@computed get selected() {
				return Messages.selectedMessageIds.has(this.id);
			}
			@computed get tags() {
				return [...this.tagIds].map((tId) => Tags.tagsById[tId]);
			}
			@computed get notes() {
				return [...this.noteIds].map((nId) => Notes.notesById[nId]);
			}
		}

class MessageList {
	@observable messagesById = {};
	@observable selectedMessageIds = new Set();
	@observable selectedMessageIndex = null;
	@observable selectedReplyIndex = null;

	import(json = []) {
		json.forEach((j) => {
			const m = new Message(j);
			this.messagesById[m.id] = m;
		});
	}

	importTagsNotes(data = []) {
		data.forEach((d) => {
			this.messagesById[d.messageId].tagIds = new Set(d.tags);
			this.messagesById[d.messageId].noteIds = new Set(d.notes);
		});
	}

	@computed get messages() {
		return Object.values(this.messagesById);
	}

	@computed get messagesByUserId() {
		const messagesByUserId = {};
		this.messages.forEach((m) => {
			messagesByUserId[m.userId] = messagesByUserId[m.userId] || [];
			messagesByUserId[m.userId].push(m);
		});
		return messagesByUserId;
	}

	@computed get displayedMessages() {
		const displayedMessages = new Set();
		this.messages.filter((m) => {
			if (Filters.checkMessage(m)) {
				displayedMessages.add((Filters.showContext && m.parent) || m);
			}
		});
		return [...displayedMessages].sort((a, b) => a.date - b.date);
	}

	@computed get selectedMessages() {
		return [...this.selectedMessageIds].map(
			(mId) => this.messagesById[mId]
		);
	}

	@computed get isMessageSelected() {
		return this.selectedMessageIds.size > 0;
	}
	@boundMethod
	selectMessageBelow() {
		if (this.selectedMessageIndex === null) return;
		if (
			this.selectedMessageIndex &&
			(!Filters.showContext ||
				!this.displayedMessages[this.selectedMessageIndex]?.replies
					.length)
		) {
			this.selectedMessageIndex++;
			this.selectedReplyIndex = null;
		} else if (this.selectedReplyIndex === null) {
			this.selectedReplyIndex = 0;
		} else {
			this.selectedReplyIndex++;
			if (
				this.displayedMessages[this.selectedMessageIndex]?.replies
					.length === this.selectedReplyIndex
			) {
				this.selectedMessageIndex++;
				this.selectedReplyIndex = null;
			}
		}
        this.selectMessageFromIndicies();
	}
	@boundMethod
	selectMessageAbove() {
		if (this.selectedMessageIndex === null) return;
		if (this.selectedMessageIndex && !Filters.showContext) {
			this.selectedMessageIndex--;
			this.selectedReplyIndex = null;
		} else if (this.selectedReplyIndex === null) {
			this.selectedMessageIndex--;
			this.selectedReplyIndex = this.displayedMessages[
				this.selectedMessageIndex
			]?.replies.length
				? this.displayedMessages[this.selectedMessageIndex].replies
						.length -1
				: null;
		} else {
			this.selectedReplyIndex--;
			if (this.selectedReplyIndex < 0) {
				this.selectedReplyIndex = null;
			}
        }
        this.selectMessageFromIndicies();
    }
    @boundMethod
    selectMessageFromIndicies() {
        if (this.selectedMessageIndex === null) return;
        if (this.selectedReplyIndex === null) {
            const newId = this.displayedMessages[this.selectedMessageIndex]?.id;
			if (newId) this.selectedMessageIds = new Set([newId]);
        } else {
            const newId = this.displayedMessages[this.selectedMessageIndex]
				?.replies[this.selectedReplyIndex]?.id;
			if (newId) this.selectedMessageIds = new Set([newId]);
        }
    }
}

export const Messages = new MessageList();