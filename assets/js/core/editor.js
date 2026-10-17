// Thin wrapper around CodeMirror 6 (bundled in assets/vendor/codemirror.js).
// Colours come from CSS variables, so the editor follows light/dark theme.
let cmPromise = null;
function loadCM() {
  if (!cmPromise) cmPromise = import("../../vendor/codemirror.js");
  return cmPromise;
}

export async function createEditor(parent, { doc = "", language = "python", onChange, label = "Code editor", minLines = 6 } = {}) {
  const cm = await loadCM();
  const {
    EditorView, EditorState, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection,
    defaultKeymap, history, historyKeymap, indentWithTab, indentOnInput, bracketMatching, syntaxHighlighting,
    HighlightStyle, indentUnit, closeBrackets, closeBracketsKeymap, tags, python, sql, SQLite,
  } = cm;

  const highlight = HighlightStyle.define([
    { tag: tags.keyword, color: "var(--code-keyword)", fontWeight: "600" },
    { tag: [tags.string, tags.special(tags.string)], color: "var(--code-string)" },
    { tag: [tags.number, tags.bool, tags.null], color: "var(--code-number)" },
    { tag: tags.comment, color: "var(--code-comment)", fontStyle: "italic" },
    { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "var(--code-function)" },
    { tag: [tags.definition(tags.variableName), tags.className], color: "var(--code-def)" },
    { tag: tags.operator, color: "var(--code-operator)" },
  ]);

  const theme = EditorView.theme({
    "&": { fontSize: "16px", backgroundColor: "var(--code-bg)", color: "var(--code-text)", borderRadius: "12px" },
    ".cm-content": { fontFamily: "var(--font-mono)", padding: "12px 0", minHeight: `${minLines * 1.5}em`, caretColor: "var(--accent)" },
    ".cm-gutters": { backgroundColor: "var(--code-bg)", color: "var(--code-comment)", border: "none", borderRadius: "12px 0 0 12px" },
    ".cm-activeLine": { backgroundColor: "var(--code-active)" },
    ".cm-activeLineGutter": { backgroundColor: "var(--code-active)" },
    "&.cm-focused": { outline: "3px solid var(--focus)", outlineOffset: "2px" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "var(--code-selection) !important" },
    ".cm-cursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
    ".cm-matchingBracket": { backgroundColor: "var(--code-selection)", outline: "none" },
  });

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        history(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        indentUnit.of("    "),
        EditorState.tabSize.of(4),
        syntaxHighlighting(highlight),
        language === "sql" ? sql({ dialect: SQLite, upperCaseKeywords: true }) : python(),
        // Tab indents; Escape then Tab leaves the editor (CodeMirror's built-in escape hatch).
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        theme,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ "aria-label": `${label}. Press Escape then Tab to move out of the editor.`, autocapitalize: "off", autocorrect: "off", spellcheck: "false" }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) onChange(update.state.doc.toString());
        }),
      ],
    }),
  });

  return {
    view,
    getValue: () => view.state.doc.toString(),
    setValue: (text) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } }),
    focus: () => view.focus(),
  };
}
