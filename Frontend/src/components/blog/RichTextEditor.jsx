import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Tooltip } from "@mui/material";
import { useEffect, useCallback, useRef } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code2, Link2, ImageIcon,
  Table2, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, Heading1, Heading2, Heading3, Minus,
} from "lucide-react";

const lowlight = createLowlight(common);

const ToolBtn = ({ onClick, active, title, children, disabled }) => (
  <Tooltip title={title} placement="top" arrow>
    <span>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        disabled={disabled}
        className={`
          flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold transition-all border
          ${active
            ? "bg-green-600/40 text-green-300 border-green-500/40"
            : "text-white/60 bg-white/5 hover:bg-green-600/20 hover:text-green-300 border-white/10"}
          ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {children}
      </button>
    </span>
  </Tooltip>
);

const Sep = () => <span className="w-px h-5 bg-white/10 self-center mx-0.5 shrink-0" />;

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-green-400 underline cursor-pointer" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: { class: "tiptap-rte" },
    },
  });

  const prevRef = useRef(value);
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value !== prevRef.current && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
    prevRef.current = value;
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  const wordCount = editor.getText().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex flex-col gap-2">
      <style>{EDITOR_STYLES}</style>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1 p-2 rounded-xl bg-white/[0.04] border border-white/10">
        <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 size={12} />
        </ToolBtn>
        <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 size={12} />
        </ToolBtn>

        <Sep />

        <ToolBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={12} />
        </ToolBtn>
        <ToolBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={12} />
        </ToolBtn>
        <ToolBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={12} />
        </ToolBtn>

        <Sep />

        <ToolBtn title="Bold" active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={12} />
        </ToolBtn>
        <ToolBtn title="Italic" active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={12} />
        </ToolBtn>
        <ToolBtn title="Underline" active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={12} />
        </ToolBtn>
        <ToolBtn title="Strikethrough" active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={12} />
        </ToolBtn>

        <Sep />

        <ToolBtn title="Bullet List" active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={12} />
        </ToolBtn>
        <ToolBtn title="Numbered List" active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={12} />
        </ToolBtn>

        <Sep />

        <ToolBtn title="Align Left" active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft size={12} />
        </ToolBtn>
        <ToolBtn title="Align Center" active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter size={12} />
        </ToolBtn>
        <ToolBtn title="Align Right" active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight size={12} />
        </ToolBtn>
        <ToolBtn title="Justify" active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <AlignJustify size={12} />
        </ToolBtn>

        <Sep />

        <ToolBtn title="Blockquote" active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={12} />
        </ToolBtn>
        <ToolBtn title="Code Block" active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 size={12} />
        </ToolBtn>
        <ToolBtn title="Horizontal Rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={12} />
        </ToolBtn>

        <Sep />

        <ToolBtn title="Insert / Edit Link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 size={12} />
        </ToolBtn>
        <ToolBtn title="Insert Image (URL)" onClick={addImage}>
          <ImageIcon size={12} />
        </ToolBtn>
        <ToolBtn title="Insert Table" onClick={insertTable}>
          <Table2 size={12} />
        </ToolBtn>
      </div>

      {/* EDITOR AREA */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <EditorContent editor={editor} />
      </div>

      <p className="text-xs text-white/30 select-none">
        {wordCount} words · ~{readTime} min read
      </p>
    </div>
  );
}

const EDITOR_STYLES = `
  .tiptap-rte {
    min-height: 340px;
    padding: 1rem 1.1rem;
    outline: none;
    color: rgba(255,255,255,0.85);
    font-size: 14px;
    line-height: 1.8;
    caret-color: #22c55e;
  }
  .tiptap-rte > * + * { margin-top: 0.6rem; }
  .tiptap-rte h1 { font-size: 1.65rem; font-weight: 700; color: #fff; line-height: 1.3; }
  .tiptap-rte h2 { font-size: 1.35rem; font-weight: 700; color: rgba(255,255,255,0.95); line-height: 1.35; }
  .tiptap-rte h3 { font-size: 1.1rem; font-weight: 600; color: rgba(255,255,255,0.9); line-height: 1.4; }
  .tiptap-rte p { margin: 0; }
  .tiptap-rte ul { list-style: disc; padding-left: 1.5rem; }
  .tiptap-rte ol { list-style: decimal; padding-left: 1.5rem; }
  .tiptap-rte li + li { margin-top: 0.2rem; }
  .tiptap-rte strong { color: rgba(255,255,255,0.95); font-weight: 700; }
  .tiptap-rte em { color: rgba(255,255,255,0.75); font-style: italic; }
  .tiptap-rte u { text-decoration: underline; }
  .tiptap-rte s { text-decoration: line-through; color: rgba(255,255,255,0.45); }
  .tiptap-rte a { color: #4ade80; text-decoration: underline; cursor: pointer; }
  .tiptap-rte code { background: rgba(0,0,0,0.45); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.82em; font-family: monospace; color: #86efac; }
  .tiptap-rte pre { background: rgba(0,0,0,0.55); padding: 0.85rem 1rem; border-radius: 10px; overflow-x: auto; border: 1px solid rgba(255,255,255,0.06); }
  .tiptap-rte pre code { background: none; padding: 0; border-radius: 0; font-size: 0.84em; color: #d4d4d4; }
  .tiptap-rte blockquote { border-left: 3px solid #22c55e; padding: 0.35rem 0.85rem; background: rgba(34,197,94,0.07); border-radius: 0 8px 8px 0; color: rgba(255,255,255,0.7); }
  .tiptap-rte hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 1.25rem 0; }
  .tiptap-rte img { max-width: 100%; border-radius: 8px; display: block; }
  .tiptap-rte table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  .tiptap-rte th, .tiptap-rte td { border: 1px solid rgba(255,255,255,0.12); padding: 0.4rem 0.7rem; min-width: 60px; vertical-align: top; }
  .tiptap-rte th { background: rgba(255,255,255,0.07); font-weight: 600; color: #fff; }
  .tiptap-rte td { color: rgba(255,255,255,0.75); }
  .tiptap-rte .selectedCell { background: rgba(34,197,94,0.12) !important; }
  .tiptap-rte .ProseMirror-selectednode { outline: 2px solid #22c55e; outline-offset: 2px; border-radius: 4px; }
  .tiptap-rte p.is-empty::before { content: attr(data-placeholder); color: rgba(255,255,255,0.2); pointer-events: none; float: left; height: 0; }
`;
