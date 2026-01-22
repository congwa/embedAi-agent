import { mergeAttributes } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import type { MarkType, ResolvedPos } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const linkHoverPlugin = new PluginKey("linkHover");
const linkAutoUpdatePlugin = new PluginKey("linkAutoUpdate");

function getMarkRange(
  $pos: ResolvedPos,
  markType: MarkType,
  attrs?: Record<string, unknown>
): { from: number; to: number } | null {
  const { doc } = $pos;
  let foundRange: { from: number; to: number } | null = null;

  doc.descendants((node, pos) => {
    if (node.isText && node.marks) {
      for (const mark of node.marks) {
        if (
          mark.type === markType &&
          (!attrs || Object.keys(attrs).every((key) => mark.attrs[key] === attrs[key]))
        ) {
          const from = pos;
          const to = pos + node.nodeSize;

          if ($pos.pos >= from && $pos.pos < to) {
            foundRange = { from, to };
            return false;
          }
        }
      }
    }
    return true;
  });

  return foundRange;
}

interface LinkHoverPluginOptions {
  onLinkHover?: (
    attrs: { href: string; text: string; title?: string },
    position: DOMRect,
    element: HTMLElement,
    linkRange?: { from: number; to: number }
  ) => void;
  onLinkHoverEnd?: () => void;
  editable?: boolean;
  hoverDelay?: number;
}

const createLinkHoverPlugin = (options: LinkHoverPluginOptions) => {
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
  const hoverDelay = options.hoverDelay ?? 500;

  const calculateSmartPosition = (rect: DOMRect): DOMRect => {
    const viewportHeight = window.innerHeight;
    const editorOffset = 200;

    const isNearBottom = rect.bottom > viewportHeight - editorOffset;

    if (isNearBottom) {
      return new DOMRect(rect.left, rect.top - editorOffset, rect.width, rect.height);
    }
    return rect;
  };

  return new Plugin({
    key: linkHoverPlugin,
    props: {
      handleDOMEvents: {
        mouseover: (view, event) => {
          if (!options.editable) return false;

          const target = event.target as HTMLElement;
          const linkElement = target.closest("a[href]") as HTMLAnchorElement;

          if (linkElement) {
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
            }

            hoverTimeout = setTimeout(() => {
              const href = linkElement.getAttribute("href") || "";
              const text = linkElement.textContent || "";
              const title = linkElement.getAttribute("title") || "";

              let linkRange: { from: number; to: number } | undefined;
              let linkRect = linkElement.getBoundingClientRect();

              try {
                const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });

                if (coords) {
                  const pos = coords.pos;
                  const $pos = view.state.doc.resolve(pos);

                  const linkMark = $pos
                    .marks()
                    .find(
                      (mark) =>
                        (mark.type.name === "enhancedLink" || mark.type.name === "link") &&
                        mark.attrs.href === href
                    );

                  if (linkMark) {
                    const range = getMarkRange($pos, linkMark.type, linkMark.attrs);
                    if (range) {
                      linkRange = range;

                      const docSize = view.state.doc.content.size;
                      const isNearDocEnd = range.to >= docSize - 10;

                      if (!isNearDocEnd) {
                        try {
                          const startCoords = view.coordsAtPos(range.from);
                          const endCoords = view.coordsAtPos(range.to);
                          linkRect = new DOMRect(
                            startCoords.left,
                            startCoords.top,
                            endCoords.right - startCoords.left,
                            Math.max(endCoords.bottom - startCoords.top, 16)
                          );
                        } catch {
                          linkRect = linkElement.getBoundingClientRect();
                        }
                      }
                    }
                  }
                }

                if (!linkRange) {
                  const startPos = view.posAtDOM(linkElement, 0);
                  if (startPos >= 0) {
                    const $pos = view.state.doc.resolve(startPos);
                    const linkMark = $pos
                      .marks()
                      .find(
                        (mark) =>
                          (mark.type.name === "enhancedLink" || mark.type.name === "link") &&
                          mark.attrs.href === href
                      );

                    if (linkMark) {
                      const range = getMarkRange($pos, linkMark.type, linkMark.attrs);
                      if (range) {
                        linkRange = range;
                      }
                    }
                  }
                }

                if (!linkRange && text) {
                  const pos = view.posAtDOM(linkElement, 0);
                  if (pos >= 0) {
                    linkRange = { from: pos, to: pos + text.length };
                  }
                }
              } catch {
                const pos = view.posAtDOM(linkElement, 0);
                if (pos >= 0 && text) {
                  linkRange = { from: pos, to: pos + text.length };
                }
              }

              const smartRect = calculateSmartPosition(linkRect);
              options.onLinkHover?.({ href, text, title }, smartRect, linkElement, linkRange);
              hoverTimeout = null;
            }, hoverDelay);
          }

          return false;
        },
        mouseout: (_, event) => {
          const target = event.target as HTMLElement;
          const linkElement = target.closest("a[href]");

          if (linkElement) {
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              hoverTimeout = null;
            }

            const relatedTarget = event.relatedTarget as HTMLElement;
            const isMovingToPopup = relatedTarget?.closest("[data-link-editor]");
            const isStillInLink = relatedTarget?.closest("a[href]") === linkElement;

            if (!isMovingToPopup && !isStillInLink) {
              options.onLinkHoverEnd?.();
            }
          }

          return false;
        },
      },
    },
  });
};

const createLinkAutoUpdatePlugin = () => {
  return new Plugin({
    key: linkAutoUpdatePlugin,
    appendTransaction: (transactions, _oldState, newState) => {
      let tr = newState.tr;
      let hasUpdates = false;

      const hasDocChanges = transactions.some((transaction) => transaction.docChanged);
      if (!hasDocChanges) return null;

      newState.doc.descendants((node, pos) => {
        if (node.isText && node.marks) {
          node.marks.forEach((mark) => {
            if (mark.type.name === "enhancedLink") {
              const text = node.text || "";
              const currentHref = mark.attrs.href || "";

              if (text.trim()) {
                let expectedHref = text.trim();
                if (
                  !expectedHref.startsWith("http://") &&
                  !expectedHref.startsWith("https://") &&
                  !expectedHref.startsWith("mailto:") &&
                  !expectedHref.startsWith("tel:")
                ) {
                  if (expectedHref.includes(".")) {
                    expectedHref = `https://${expectedHref}`;
                  }
                }

                const shouldUpdate =
                  currentHref !== expectedHref &&
                  (currentHref === "" ||
                    currentHref === text.trim() ||
                    currentHref === `https://${text.trim()}` ||
                    text.trim().startsWith(currentHref.replace(/^https?:\/\//, "")));

                if (shouldUpdate) {
                  tr = tr.removeMark(pos, pos + node.nodeSize, mark.type);
                  tr = tr.addMark(
                    pos,
                    pos + node.nodeSize,
                    mark.type.create({ ...mark.attrs, href: expectedHref })
                  );
                  hasUpdates = true;
                }
              }
            }
          });
        }
      });

      return hasUpdates ? tr : null;
    },
  });
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    enhancedLink: {
      setEnhancedLink: (attributes: { href: string; title?: string }) => ReturnType;
      toggleEnhancedLink: (attributes: { href: string; title?: string }) => ReturnType;
      unsetEnhancedLink: () => ReturnType;
      updateLinkText: (text: string) => ReturnType;
    };
  }
}

export interface EnhancedLinkOptions {
  onLinkHover?: (
    attrs: { href: string; text: string; title?: string },
    position: DOMRect,
    element: HTMLElement,
    linkRange?: { from: number; to: number }
  ) => void;
  onLinkHoverEnd?: () => void;
  editable?: boolean;
  hoverDelay?: number;
}

export const EnhancedLink = Link.extend<EnhancedLinkOptions>({
  name: "enhancedLink",

  addOptions() {
    return {
      ...this.parent?.(),
      protocols: ["http", "https", "mailto", "tel"],
      openOnClick: true,
      onLinkHover: undefined,
      onLinkHoverEnd: undefined,
      editable: true,
      hoverDelay: 500,
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setEnhancedLink:
        (attributes) =>
        ({ commands }) => {
          return commands.setLink(attributes);
        },
      toggleEnhancedLink:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleLink(attributes);
        },
      unsetEnhancedLink:
        () =>
        ({ commands }) => {
          return commands.unsetLink();
        },
      updateLinkText:
        (text: string) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          if (dispatch) {
            tr.insertText(text, from, to);
          }

          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() || []),
      createLinkHoverPlugin({
        onLinkHover: this.options.onLinkHover,
        onLinkHoverEnd: this.options.onLinkHoverEnd,
        editable: this.options.editable,
        hoverDelay: this.options.hoverDelay,
      }),
      createLinkAutoUpdatePlugin(),
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        class: "rich-editor-link text-blue-600 underline hover:text-blue-800",
      }),
      0,
    ];
  },

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (element) => element.getAttribute("href"),
        renderHTML: (attributes) => {
          if (!attributes.href) {
            return {};
          }
          return {
            href: attributes.href,
          };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("title"),
        renderHTML: (attributes) => {
          if (!attributes.title) {
            return {};
          }
          return {
            title: attributes.title,
          };
        },
      },
    };
  },
});
