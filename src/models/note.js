import cuid from "cuid";
import { observable, computed } from "mobx";
import { Messages } from "./message";

export class Note {
			@observable id = cuid();
			@observable text = "";
			@observable messageIds = [];
			@observable tags = [];
			constructor(text = "", note = cuid()) {
				this.id = cuid();
				this.text = text;
			}
			@computed get focused() {
				return this.id === Notes.focussedNoteId;
			}
		}

class NoteCollection {
    @observable notesById = {};
    @observable newNote = new Note();
    @observable focussedNoteId = null;
	@computed get selectedNoteIds() {
        let selectedNotes = new Set()
		Messages.selectedMessages.forEach((m) => m.noteIds.forEach(n => selectedNotes.add(n)));
		return [...selectedNotes];
	}
	@computed get selectedNotes() {
		return [...this.selectedNoteIds.map((nId) => this.notesById[nId]), this.newNote];
	}
	@computed get notes() {
		return Object.values(this.notesById);
    }
    import(data) {
        data.forEach(n => (this.notesById[n.id] = new Note(n.text, n.id)))
    }
}

export const Notes = new NoteCollection();
