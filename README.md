```
yarn install
yarn start
```

A little slow because it loads all 50mb of messages and I haven't optimised things.

Customise what messages are loaded at `src/App.js`
Setup custom tags via `src/models/tag.js`

Can navigate messages using the arrow keys.
Tag shortcuts are displayed on the right panel.
`Right arrrow` focusses the note input.
`Esc` goes back to navigating messages.

Clicking `save` will save notes and tags in local storage.
