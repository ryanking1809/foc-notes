import React, { useEffect, useRef } from 'react';
import './App.css';
// specific channels, for example "./focData/messages/general.json"
import messageJson from "./focData/messages.json"
import userJson from "./focData/users.json"
import {Messages} from "./models/message"
import {Users} from "./models/user"
import { Tags } from "./models/tag";
import {format} from "date-fns"
import emoji from './models/emoji';
import { observer } from "mobx-react"
import { Filters } from './models/filters';
import localforage from "localforage";
import { Notes, Note } from './models/note';

import HyperInteractive from "hyper-interactive";
const hyper = new HyperInteractive();

// please forgive the mess of components below

Users.import(userJson)
Messages.import(messageJson)
localforage.getItem('zettel-tags').then(function(value) {
    // This code runs once the value has been loaded
    // from the offline store.
    value.notes && Notes.import(value.notes);
    value.messages && Messages.importTagsNotes(value.messages)
}).catch(function(err) {
    console.log(err);
});

const App = observer(() => {
  useEffect(() => {
	  	// TODO - add save shortcut
		hyper.addInteraction({
			formula: "down",
			// bug in hyper-interactive, fix later
			// repeat: true,
			reaction: () => {
			if (!Notes.focussedNoteId) Messages.selectMessageBelow();
		},
		});
		hyper.addInteraction({
			formula: "up",
			// bug in hyper-interactive, fix later
			// repeat: true,
			reaction: () => {
				if (!Notes.focussedNoteId) Messages.selectMessageAbove();
			},
		});
		hyper.addInteraction({
			formula: "right",
			reaction: () => {
        if (!Notes.focussedNoteId) Notes.focussedNoteId = Notes.newNote.id;
      },
		});
		hyper.addInteraction({
			formula: "esc",
			reaction: () => (Notes.focussedNoteId = null),
		});
    Tags.tags.forEach(t => {
      hyper.addInteraction({
        formula: t.shortcut,
        reaction: () => {
          if (t.selected) {
            Messages.selectedMessages.forEach((m) =>
              m.tagIds.delete(t.name)
            );
          } else {
            Messages.selectedMessages.forEach((m) => m.tagIds.add(t.name));
          }
        },
      });
    })
  }, []);
	return (
		<div className="App">
			<SaveButton />
			<FilterBlock />
			<div className="feed">
				{Messages.displayedMessages.map((m, i) => (
					<Message key={m.id} message={m} index={i} />
				))}
			</div>
			<div className="properties">
				{Messages.isMessageSelected && <PropertyPanel />}
			</div>
		</div>
	);
});

const SaveButton = observer(() => {
  return (
		<button
			onClick={
        () => localforage.setItem("zettel-tags", {
          messages: Messages.messages.filter(m => m.tags.length || m.notes.length).map(
            m => ({
              messageId: m.id,
              tags: [...m.tagIds],
              notes: [...m.noteIds]
            })
          ),
          notes: Notes.notes.filter(n => n.text?.length).map(n => ({id: n.id, text: n.text}))
        }).then((data) => console.log("saved!", data))
      }
			className="save-btn"
		>
			Save Data
		</button>
  );
})

const FilterBlock = observer(() => {
  return (
		<>
			<div className="filter-block">
				<div className="filter">
					<label>Include Search Terms:</label>
					<input
						onChange={(e) =>
							(Filters.includeKeywords = e.target.value.split(
								","
							))
						}
						value={Filters.includeKeywords.join(",")}
					/>
				</div>
				<div className="filter">
					<label>Exclude Search Terms:</label>
					<input
						onChange={(e) =>
							(Filters.excludeKeywords = e.target.value.split(
								","
							))
						}
						value={Filters.excludeKeywords.join(",")}
					/>
				</div>
				<div className="filter">
					<label>Include Tags:</label>
					<input
						onChange={(e) =>
							(Filters.includeTags = e.target.value.split(","))
						}
						value={Filters.includeTags.join(",")}
					/>
				</div>
				<div className="filter">
					<label>Exclude Tags:</label>
					<input
						onChange={(e) =>
							(Filters.excludeTags = e.target.value.split(","))
						}
						value={Filters.excludeTags.join(",")}
					/>
				</div>
			</div>
			<div className="filter-block">
				<div className="filter">
					<label>Only Tagged:</label>
					<input
						type="checkbox"
						checked={Filters.onlyTagged}
						onChange={(e) => (Filters.onlyTagged = e.target.checked)}
					/>
				</div>
				<div className="filter">
					<label>Show Context:</label>
					<input
						type="checkbox"
						checked={Filters.showContext}
						onChange={(e) => (Filters.showContext = e.target.checked)}
					/>
				</div>
			</div>
		</>
  );
})

const PropertyPanel = observer(() => {
  return (
		<div>
			{Tags.tags.map((t) => (
				<div
					key={t.name}
					className={t.selected ? "tag selected" : "tag"}
					onClick={() => {
						if (t.selected) {
							Messages.selectedMessages.forEach((m) =>
								m.tagIds.delete(t.name)
							);
						} else {
							Messages.selectedMessages.forEach((m) =>
								m.tagIds.add(t.name)
							);
						}
					}}
				>
					[ {t.shortcut} ] - {t.name}
				</div>
			))}
			{Notes.selectedNotes.map((n, i) => (
				<NoteBox key={n.id} note={n} index={i} />
			))}
		</div>
  );
})

const NoteBox = observer(({note}) => {
  const noteRef = useRef(null);
  useEffect(() => {
		if (note.focused) {
			noteRef.current.focus();
		} else {
      noteRef.current.blur();
    }
  }, [note.focused]);
  return (
		<textarea
      ref={noteRef}
			className="note-box"
      value={note.text}
      onChange={e => {
        note.text = e.target.value
        if (note === Notes.newNote) {
          Notes.notesById[note.id] = note;
          Messages.selectedMessages.forEach(m => m.noteIds.add(note.id));
          Notes.newNote = new Note();
        }
      }}
		/>
  );
})

const Message = observer(({ message, index }) => {
  const { id, selected, user, channel, date, text, replies } = message;
  const messageRef = useRef(null);
  useEffect(() => {
		if (!Notes.focusNewNote && selected) {
			messageRef.current.focus();
      messageRef.current.scrollIntoView({block: "center"});
		}
  }, [selected]);
	return (
		<div className="message-block">
			<div
				ref={messageRef}
				className={selected ? "message selected" : "message"}
				onClick={(e) => {
					console.log("Message -> e", e);
					if (selected) {
						Messages.selectedMessageIds.delete(id);
						Messages.selectedMessageIndex = null;
						Messages.selectedReplyIndex = null;
					} else if(e.shiftKey) {
						Messages.selectedMessageIds.add(id);
						Messages.selectedMessageIndex = index;
						Messages.selectedReplyIndex = null;
					} else {
						Messages.selectedMessageIds = new Set([id]);
						Messages.selectedMessageIndex = index;
						Messages.selectedReplyIndex = null;
					}
				}}
			>
				<div className="message-image">
					<img src={user.avatar} />
				</div>
				<div className="message-text">
					<div className="user-name">{user.realName}</div>
					<div className="date">
						<b>#{channel}</b> - {format(date, "YYY/MM/dd")}
					</div>
					<ProcessedText text={text} />
					{message.tags.length ? (
						<MessageTags message={message} />
					) : null}
					{message.notes.length ? (
						<MessageNotes message={message} />
					) : null}
				</div>
			</div>
			{Filters.showContext && (
				<div className="replies">
					{replies.map(
						(r, i) =>
							r && (
								<Reply
									key={r.id}
									message={r}
									index={index}
									replyIndex={i}
								/>
							)
					)}
				</div>
			)}
		</div>
	);
});

const Reply = observer(({ message, index, replyIndex }) => {
	const { id, selected, user, channel, date, text } = message;
  const messageRef = useRef(null);
  useEffect(() => {
		if (!Notes.focusNewNote && selected) {
			messageRef.current.focus();
			messageRef.current.scrollIntoView({ block: "center" });
		}
  }, [selected]);
	return (
		<div
			ref={messageRef}
			className={selected ? "reply selected" : "reply"}
			onClick={e => {
				if (selected) {
					Messages.selectedMessageIds.delete(id);
					Messages.selectedMessageIndex = null;
					Messages.selectedReplyIndex = null;
				} else if(e.shiftKey) {
					Messages.selectedMessageIds.add(id);
					Messages.selectedMessageIndex = index;
					Messages.selectedReplyIndex = replyIndex;
				} else {
					Messages.selectedMessageIds = new Set([id]);
					Messages.selectedMessageIndex = index;
					Messages.selectedReplyIndex = replyIndex;
				}
			}}
		>
			<div className="reply-image">
				<img src={user.avatar} />
			</div>
			<div className="reply-text">
				<div className="user-name">{user.realName}</div>
				<div className="date">
					<b>#{channel}</b> - {format(date, "YYY/MM/dd")}
				</div>
				<ProcessedText text={text} />
				{message.tags.length ? <MessageTags message={message} /> : null}
				{message.notes.length ? (
					<MessageNotes message={message} />
				) : null}
			</div>
		</div>
	);
});

const MessageTags = observer(({message}) => {
  return <div className="message-tags">
    {message.tags.map(t => <div className="message-tag">{t.name}</div>)}
  </div>
})

const MessageNotes = observer(({message}) => {
  return <div className="message-notes">
    {message.notes.map(n => <div className="message-note">{n.text}</div>)}
  </div>
})

const ProcessedText = observer(({ text }) => {
	const textChunks = text.split(/[<>]+/).filter((tc) => tc);
	return (
		<div className="text">
			{textChunks.map((tc) => {
				if (tc.startsWith("@")) {
					return <UserRef text={tc} />;
				} else if (tc.startsWith("!")) {
					return <Tag text={tc} />;
				} else if (tc.startsWith("http")) {
					return <ExternalLink text={tc} />;
				} else {
					return (
						<span>
							{tc.replace(/\:[a-z0-9-_+]+\:/g, (m) => {
								return emoji[m.replace(/\:/g, "")] || m;
							})}
						</span>
					);
				}
			})}
		</div>
	);
});

const UserRef = observer(({ text }) => {
	const uId = text.split("@")[1];
	return <b>@{Users.usersById[uId]?.realName || "user"}</b>;
});

const Tag = observer(({ text }) => {
	const tag = text.split("!")[1];
	return <b>{tag}</b>;
});

const ExternalLink = observer(({ text }) => {
	const link = text.split("|");
	return (
		<a target="_blank" href={link[0]}>
			{link[1] || link[0]}
		</a>
	);
});

export default App;
