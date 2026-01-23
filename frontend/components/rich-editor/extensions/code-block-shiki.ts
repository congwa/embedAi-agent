import { textblockTypeInputRule } from "@tiptap/core";
import CodeBlock, { type CodeBlockOptions } from "@tiptap/extension-code-block";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface CodeBlockShikiOptions extends CodeBlockOptions {
  defaultLanguage: string;
  theme: string;
}

export const CodeBlockShiki = CodeBlock.extend<CodeBlockShikiOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      languageClassPrefix: "language-",
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      defaultLanguage: "text",
      theme: "github-dark",
      enableTabIndentation: false,
      tabSize: 2,
      HTMLAttributes: {
        class: "code-block-shiki",
      },
    };
  },

  addInputRules() {
    const parent = this.parent?.();

    return [
      ...(parent || []),
      textblockTypeInputRule({
        find: /^```([a-zA-Z0-9#+\-_.]+)\s/,
        type: this.type,
        getAttributes: (match) => {
          const inputLanguage = match[1]?.toLowerCase().trim();
          if (!inputLanguage) return {};
          return { language: inputLanguage };
        },
      }),
      textblockTypeInputRule({
        find: /^~~~([a-zA-Z0-9#+\-_.]+)\s/,
        type: this.type,
        getAttributes: (match) => {
          const inputLanguage = match[1]?.toLowerCase().trim();
          if (!inputLanguage) return {};
          return { language: inputLanguage };
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive(this.name)) {
          return this.editor.commands.insertContent("  ");
        }
        return false;
      },
      "Shift-Tab": () => {
        if (this.editor.isActive(this.name)) {
          const { selection } = this.editor.state;
          const { $from } = selection;
          const start = $from.start();
          const content = $from.parent.textContent;

          const beforeCursor = content.slice(0, $from.pos - start - 1);
          const lines = beforeCursor.split("\n");
          const currentLineIndex = lines.length - 1;
          const currentLine = lines[currentLineIndex];

          if (currentLine.startsWith("  ")) {
            const lineStart = start + 1 + beforeCursor.length - currentLine.length;
            return this.editor.commands.deleteRange({
              from: lineStart,
              to: lineStart + 2,
            });
          }
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const codeBlockEventPlugin = new Plugin({
      key: new PluginKey("codeBlockEvents"),
      props: {
        handleKeyDown: (view, event) => {
          const { selection } = view.state;
          const { $from } = selection;

          if ($from.parent.type.name === this.name && event.key === "Enter") {
            const content = $from.parent.textContent;
            const beforeCursor = content.slice(0, $from.pos - $from.start() - 1);
            const lines = beforeCursor.split("\n");
            const currentLine = lines[lines.length - 1];

            const indent = currentLine.match(/^\s*/)?.[0] || "";

            const tr = view.state.tr.insertText("\n" + indent, selection.from, selection.to);
            view.dispatch(tr);
            return true;
          }
          return false;
        },
      },
    });

    return [...(this.parent?.() || []), codeBlockEventPlugin];
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: this.options.defaultLanguage,
        parseHTML: (element) => {
          const prefix = this.options.languageClassPrefix ?? "language-";
          const classNames = [...(element.firstElementChild?.classList || [])];
          const languages = classNames
            .filter((name) => name.startsWith(prefix))
            .map((name) => name.replace(prefix, ""));
          const language = languages[0];
          if (!language) return this.options.defaultLanguage;
          return language;
        },
        renderHTML: (attributes) => {
          if (!attributes.language) {
            return {};
          }
          return {
            class: `${this.options.languageClassPrefix}${attributes.language}`,
          };
        },
      },
      theme: {
        default: this.options.theme,
        parseHTML: (element) => element.getAttribute("data-theme"),
        renderHTML: (attrs) => (attrs.theme ? { "data-theme": attrs.theme } : {}),
      },
    };
  },
});

export default CodeBlockShiki;
