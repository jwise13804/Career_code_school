// Entry point bundled into assets/vendor/codemirror.js by tools/build-vendor.mjs.
export { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, placeholder } from "@codemirror/view";
export { EditorState, Compartment } from "@codemirror/state";
export { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
export { indentOnInput, bracketMatching, syntaxHighlighting, HighlightStyle, indentUnit } from "@codemirror/language";
export { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
export { tags } from "@lezer/highlight";
export { python } from "@codemirror/lang-python";
export { sql, SQLite } from "@codemirror/lang-sql";
