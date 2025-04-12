import { useEffect } from "react";
import * as monaco from "monaco-editor";

const useAutoCloseTags = (editor: monaco.editor.IStandaloneCodeEditor | null) => {
  useEffect(() => {
    if (!editor) return;

    const enabledLanguages = ["html", "javascript"];
    const isSelfClosing = (tag: string) =>
      [
        "area",
        "base",
        "br",
        "col",
        "command",
        "embed",
        "hr",
        "img",
        "input",
        "keygen",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
        "circle",
        "ellipse",
        "line",
        "path",
        "polygon",
        "polyline",
        "rect",
        "stop",
        "use",
      ].includes(tag);

    const handleKeyDown = (event: monaco.IKeyboardEvent) => {
      const model = editor.getModel();
      if (!model || !enabledLanguages.includes(model.getLanguageId())) {
        return;
      }

      if (event.browserEvent.key === ">") {
        const selections = editor.getSelections() || [];
        const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];
        const newSelections: monaco.Selection[] = [];

        selections.forEach((selection) => {
          newSelections.push(
            new monaco.Selection(
              selection.selectionStartLineNumber,
              selection.selectionStartColumn + 1,
              selection.endLineNumber,
              selection.endColumn + 1,
            ),
          );

          const contentBeforeChange = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn,
          });

          const match = contentBeforeChange.match(/<([\w-]+)(?![^>]*\/>)[^>]*$/);
          if (!match) return;

          const [fullMatch, tag] = match;

          if (isSelfClosing(tag) || fullMatch.trim().endsWith("/")) return;

          edits.push({
            range: {
              startLineNumber: selection.endLineNumber,
              startColumn: selection.endColumn + 1,
              endLineNumber: selection.endLineNumber,
              endColumn: selection.endColumn + 1,
            },
            text: `</${tag}>`,
          });
        });

        setTimeout(() => {
          editor.executeEdits("auto-close-tags", edits, newSelections);
        }, 0);
      }
    };

    const disposable = editor.onKeyDown(handleKeyDown);

    return () => {
      disposable.dispose();
    };
  }, [editor]);
};

export default useAutoCloseTags;
