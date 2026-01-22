import { marked } from "marked";
import TurndownService from "turndown";

// 创建 Turndown 实例并配置
const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  fence: "```",
  emDelimiter: "*",
  strongDelimiter: "**",
  linkStyle: "inlined",
});

// 添加 GFM 表格支持
turndownService.addRule("table", {
  filter: ["table"],
  replacement: function (_content, node) {
    const table = node as HTMLTableElement;
    const rows = Array.from(table.rows);
    if (rows.length === 0) return "";

    const result: string[] = [];
    
    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.cells);
      const cellContents = cells.map((cell) => {
        const text = cell.textContent?.trim() || "";
        return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
      });
      result.push("| " + cellContents.join(" | ") + " |");
      
      // 在第一行后添加分隔行
      if (rowIndex === 0) {
        const separator = cells.map(() => "---").join(" | ");
        result.push("| " + separator + " |");
      }
    });

    return "\n\n" + result.join("\n") + "\n\n";
  },
});

// 添加任务列表支持
turndownService.addRule("taskListItem", {
  filter: (node) => {
    return (
      node.nodeName === "LI" &&
      (node.getAttribute("data-type") === "taskItem" ||
        node.querySelector('input[type="checkbox"]') !== null)
    );
  },
  replacement: function (_content, node) {
    const checkbox = (node as HTMLElement).querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement | null;
    const isChecked =
      checkbox?.checked || node.getAttribute("data-checked") === "true";
    const textContent = node.textContent?.trim() || "";
    return "- " + (isChecked ? "[x]" : "[ ]") + " " + textContent + "\n";
  },
});

// 添加代码块语言支持
turndownService.addRule("fencedCodeBlock", {
  filter: (node) => {
    return (
      node.nodeName === "PRE" &&
      node.firstChild !== null &&
      node.firstChild.nodeName === "CODE"
    );
  },
  replacement: function (_content, node) {
    const code = node.firstChild as HTMLElement;
    const className = code.getAttribute("class") || "";
    const languageMatch = className.match(/language-(\w+)/);
    const language = languageMatch ? languageMatch[1] : "";
    const codeContent = code.textContent || "";
    return "\n\n```" + language + "\n" + codeContent + "\n```\n\n";
  },
});

// 添加删除线支持
turndownService.addRule("strikethrough", {
  filter: (node) => ["DEL", "S", "STRIKE"].includes(node.nodeName),
  replacement: function (content) {
    return "~~" + content + "~~";
  },
});

// 添加下划线支持 (转为强调，因为标准 Markdown 不支持下划线)
turndownService.addRule("underline", {
  filter: ["u"],
  replacement: function (content) {
    return "*" + content + "*";
  },
});

// 添加高亮支持
turndownService.addRule("highlight", {
  filter: ["mark"],
  replacement: function (content) {
    return "==" + content + "==";
  },
});

/**
 * Convert Markdown to HTML
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";
  try {
    return marked.parse(markdown, { async: false }) as string;
  } catch (error) {
    console.error("Error converting markdown to HTML:", error);
    return markdown;
  }
}

/**
 * Convert HTML to Markdown using Turndown
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return "";

  try {
    let result = turndownService.turndown(html);

    // 清理多余的空行
    result = result.replace(/\n{3,}/g, "\n\n");
    result = result.trim();

    return result;
  } catch (error) {
    console.error("Error converting HTML to markdown:", error);
    return html;
  }
}

/**
 * Check if content appears to be Markdown
 */
export function isMarkdownContent(content: string): boolean {
  if (!content) return false;
  
  // Check for common Markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m,           // Headings
    /\*\*[^*]+\*\*/,        // Bold
    /\*[^*]+\*/,            // Italic
    /\[([^\]]+)\]\([^)]+\)/, // Links
    /!\[([^\]]*)\]\([^)]+\)/, // Images
    /^[-*+]\s/m,            // Unordered lists
    /^\d+\.\s/m,            // Ordered lists
    /^>\s/m,                // Blockquotes
    /`[^`]+`/,              // Inline code
    /^```/m,                // Code blocks
  ];
  
  return markdownPatterns.some((pattern) => pattern.test(content));
}

/**
 * Get preview text from Markdown content
 */
export function markdownToPreviewText(markdown: string, maxLength = 50): string {
  if (!markdown) return "";
  
  // Remove Markdown formatting
  let text = markdown;
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`[^`]+`/g, "");
  
  // Remove headings markers
  text = text.replace(/^#{1,6}\s+/gm, "");
  
  // Remove bold/italic markers
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");
  
  // Remove links, keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  
  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");
  
  // Remove blockquote markers
  text = text.replace(/^>\s+/gm, "");
  
  // Remove list markers
  text = text.replace(/^[-*+]\s+/gm, "");
  text = text.replace(/^\d+\.\s+/gm, "");
  
  // Clean up whitespace
  text = text.replace(/\n+/g, " ");
  text = text.replace(/\s+/g, " ");
  text = text.trim();
  
  // Truncate
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + "...";
  }
  
  return text;
}
