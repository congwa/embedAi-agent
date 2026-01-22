"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { Bold, Italic, List, Code, ArrowUp, Square } from "lucide-react";
import { htmlToMarkdown } from "@/components/rich-editor/helpers/markdown-converter";

interface EmbedRichInputProps {
  value: string;
  onChange: (markdown: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function EmbedRichInput({
  value,
  onChange,
  onSubmit,
  placeholder = "输入消息...",
  disabled = false,
  isLoading = false,
}: EmbedRichInputProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const updateContent = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const md = htmlToMarkdown(html);
    setIsEmpty(!md.trim());
    onChange(md);
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isEmpty && !isLoading) {
          onSubmit();
        }
      }
    },
    [isEmpty, isLoading, onSubmit]
  );

  const execCommand = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    updateContent();
  }, [updateContent]);

  const handleBold = () => execCommand("bold");
  const handleItalic = () => execCommand("italic");
  const handleCode = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const code = document.createElement("code");
      code.appendChild(range.extractContents());
      range.insertNode(code);
      updateContent();
    }
  };
  const handleList = () => execCommand("insertUnorderedList");

  // 清空内容
  useEffect(() => {
    if (!value && editorRef.current && editorRef.current.innerHTML !== "") {
      editorRef.current.innerHTML = "";
    }
  }, [value]);

  const canSubmit = !isEmpty || isLoading;

  return (
    <div className="embed-rich-input">
      <div
        ref={editorRef}
        className="embed-rich-editor"
        contentEditable={!disabled}
        onInput={updateContent}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      <div className="embed-rich-toolbar">
        <div className="embed-rich-actions">
          <button
            type="button"
            className="embed-rich-btn"
            onClick={handleBold}
            disabled={disabled}
            title="粗体"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            className="embed-rich-btn"
            onClick={handleItalic}
            disabled={disabled}
            title="斜体"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            className="embed-rich-btn"
            onClick={handleList}
            disabled={disabled}
            title="列表"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            className="embed-rich-btn"
            onClick={handleCode}
            disabled={disabled}
            title="代码"
          >
            <Code size={14} />
          </button>
        </div>
        <button
          className={`embed-send-btn ${isLoading ? "embed-send-btn-stop" : ""}`}
          onClick={onSubmit}
          disabled={!canSubmit || disabled}
        >
          {isLoading ? <Square size={14} /> : <ArrowUp size={14} />}
        </button>
      </div>
    </div>
  );
}
