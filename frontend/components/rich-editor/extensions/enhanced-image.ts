import { mergeAttributes, Node } from "@tiptap/core";
import Image from "@tiptap/extension-image";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imagePlaceholder: {
      insertImagePlaceholder: () => ReturnType;
    };
  }
}

export const EnhancedImage = Image.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      inline: false,
      allowBase64: true,
      resize: false as const,
      HTMLAttributes: {
        class: "rich-editor-image max-w-full rounded-lg my-2",
      },
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
        renderHTML: (attributes) => {
          if (!attributes.src) {
            return {};
          }
          return {
            src: attributes.src,
          };
        },
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      insertImagePlaceholder:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: "imagePlaceholder",
            attrs: {},
          });
        },
    };
  },

  addExtensions() {
    const base = this.parent?.() || [];
    return [
      ...base,
      Node.create({
        name: "imagePlaceholder",
        group: "block",
        atom: true,
        draggable: true,

        addOptions() {
          return {
            HTMLAttributes: {},
          };
        },

        parseHTML() {
          return [
            {
              tag: 'div[data-type="image-placeholder"]',
            },
          ];
        },

        renderHTML({ HTMLAttributes }) {
          return [
            "div",
            mergeAttributes(HTMLAttributes, {
              "data-type": "image-placeholder",
              class:
                "border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg p-8 text-center text-zinc-500 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors",
            }),
            ["span", {}, "点击上传图片"],
          ];
        },

        addCommands() {
          return {
            insertImagePlaceholder:
              () =>
              ({ commands }) => {
                return commands.insertContent({
                  type: this.name,
                  attrs: {},
                });
              },
          };
        },
      }),
    ];
  },
});
