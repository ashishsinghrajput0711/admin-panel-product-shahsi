"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import {Table} from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  Eye,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  PaintBucket,
  Pilcrow,
  Quote,
  Redo2,
  Table2,
  Type,
  UnderlineIcon,
  Undo2,
  Unlink,
  Upload,
  Video,
} from "lucide-react";

function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;
  if (!rawUrl) throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");

  const cleanUrl = rawUrl.replace(/\/$/, "");
  if (cleanUrl.endsWith("/admin/catalog")) {
    return cleanUrl.replace(/\/admin\/catalog$/, "");
  }
  return cleanUrl;
}

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function findMediaUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findMediaUrl(item);
      if (found) return found;
    }
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of ["secureUrl", "url", "src", "location", "path"]) {
      const found = findMediaUrl(record[key]);
      if (found) return found;
    }

    for (const key of ["data", "file", "files", "media", "uploaded", "result"]) {
      const found = findMediaUrl(record[key]);
      if (found) return found;
    }
  }

  return null;
}

export function RichTextEditor({
  value,
  onChange,
  productId,
}: {
  value: string;
  onChange: (html: string) => void;
  productId?: string;
}) {
  const [mode, setMode] = useState<"visual" | "html" | "preview">("visual");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-700 underline underline-offset-2",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg",
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "Write product description...",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[420px] px-5 py-5 text-sm leading-7 text-neutral-950 outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-4 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_img]:my-4 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-neutral-300 [&_td]:p-2 [&_th]:border [&_th]:border-neutral-300 [&_th]:bg-neutral-100 [&_th]:p-2 [&_ul]:list-disc",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== (value || "")) {
    editor.commands.setContent(value || "", {
  emitUpdate: false,
});
    }
  }, [editor, value]);

  async function uploadEditorFile(file: File) {
    const formData = new FormData();
    formData.append("files", file);
    formData.append("folder", "product-descriptions");
    if (productId) formData.append("productId", productId);

    const token = getToken();

    const response = await fetch(`${getApiRootUrl()}/admin/editor-media/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(json?.message || "Editor media upload failed.");
    }

    const url = findMediaUrl(json);
    if (!url) throw new Error("Upload response me media URL nahi mila.");

    return url;
  }

  async function handleFileUpload(files: FileList | null) {
    if (!editor || !files?.length) return;

    try {
      for (const file of Array.from(files)) {
        const url = await uploadEditorFile(file);

        if (file.type.startsWith("video/")) {
          editor
            .chain()
            .focus()
            .insertContent(`<video controls src="${url}" style="max-width:100%;border-radius:8px;"></video>`)
            .run();
        } else {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!editor) return null;
  const activeEditor = editor;

  function setLink() {
    const previousUrl = activeEditor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl || "");

    if (url === null) return;

    if (!url.trim()) {
      activeEditor.chain().focus().unsetLink().run();
      return;
    }

    activeEditor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function insertImageUrl() {
    const url = window.prompt("Enter image URL");
    if (!url) return;
    activeEditor.chain().focus().setImage({ src: url }).run();
  }

  function insertYoutube() {
    const url = window.prompt("Enter YouTube/video URL");
    if (!url) return;

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      activeEditor.commands.setYoutubeVideo({ src: url });
      return;
    }

    activeEditor
      .chain()
      .focus()
      .insertContent(`<video controls src="${url}" style="max-width:100%;border-radius:8px;"></video>`)
      .run();
  }

  function smartFormat() {
    const text = activeEditor.getText();
    const parts = text
      .split(/\n{2,}|(?=\bDetails:)|(?=\bFeatures:)|(?=\bProduct Features\b)/g)
      .map((item) => item.trim())
      .filter(Boolean);

    const html = parts
      .map((part) => {
        if (/^(details|features|product features)\s*:?$/i.test(part)) {
          return `<h3>${part.replace(/:$/, "")}</h3>`;
        }
        return `<p>${part}</p>`;
      })
      .join("");

    activeEditor.commands.setContent(html || value || "");
    onChange(activeEditor.getHTML());
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(event) => handleFileUpload(event.target.files)}
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 p-2">
        <select
          value={
            activeEditor.isActive("heading", { level: 2 })
              ? "h2"
              : activeEditor.isActive("heading", { level: 3 })
                ? "h3"
                : activeEditor.isActive("heading", { level: 4 })
                  ? "h4"
                  : "p"
          }
          onChange={(event) => {
            const value = event.target.value;
            if (value === "p") activeEditor.chain().focus().setParagraph().run();
            if (value === "h2") activeEditor.chain().focus().toggleHeading({ level: 2 }).run();
            if (value === "h3") activeEditor.chain().focus().toggleHeading({ level: 3 }).run();
            if (value === "h4") activeEditor.chain().focus().toggleHeading({ level: 4 }).run();
          }}
          className="h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm font-medium outline-none"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
          <option value="h4">Small heading</option>
        </select>

        <ToolbarButton active={activeEditor.isActive("bold")} title="Bold" onClick={() => activeEditor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={activeEditor.isActive("italic")} title="Italic" onClick={() => activeEditor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={activeEditor.isActive("underline")} title="Underline" onClick={() => activeEditor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton title="Text color" onClick={() => null}>
          <label className="flex h-full w-full cursor-pointer items-center justify-center">
            <Type className="h-4 w-4" />
            <input type="color" className="hidden" onChange={(event) => activeEditor.chain().focus().setColor(event.target.value).run()} />
          </label>
        </ToolbarButton>

        <ToolbarButton title="Highlight" onClick={() => null}>
          <label className="flex h-full w-full cursor-pointer items-center justify-center">
            <PaintBucket className="h-4 w-4" />
            <input type="color" className="hidden" onChange={(event) => activeEditor.chain().focus().setHighlight({ color: event.target.value }).run()} />
          </label>
        </ToolbarButton>

        <ToolbarButton title="Align left" onClick={() => activeEditor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Align center" onClick={() => activeEditor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Align right" onClick={() => activeEditor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton active={activeEditor.isActive("bulletList")} title="Bullet list" onClick={() => activeEditor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={activeEditor.isActive("orderedList")} title="Number list" onClick={() => activeEditor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton title="Link" onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Unlink" onClick={() => activeEditor.chain().focus().unsetLink().run()}>
          <Unlink className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton title="Upload image/video" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Image URL" onClick={insertImageUrl}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Video URL" onClick={insertYoutube}>
          <Video className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton title="Table" onClick={() => activeEditor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Table2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Horizontal line" onClick={() => activeEditor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Quote" onClick={() => activeEditor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton title="Undo" onClick={() => activeEditor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => activeEditor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Clear format" onClick={() => activeEditor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Smart format" onClick={smartFormat}>
          <Pilcrow className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="HTML" onClick={() => setMode(mode === "html" ? "visual" : "html")}>
          <Code2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Preview" onClick={() => setMode(mode === "preview" ? "visual" : "preview")}>
          <Eye className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {mode === "html" ? (
        <textarea
          value={value || ""}
          onChange={(event) => {
            onChange(event.target.value);
            activeEditor.commands.setContent(event.target.value, {
              emitUpdate: false,
            });
          }}
          className="min-h-[420px] w-full bg-neutral-950 p-4 font-mono text-sm leading-6 text-white outline-none"
          spellCheck={false}
        />
      ) : mode === "preview" ? (
        <div
          className="min-h-[420px] px-5 py-5 text-sm leading-7 text-neutral-950 [&_a]:text-blue-700 [&_blockquote]:border-l-4 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_img]:max-w-full [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: value || "" }}
        />
      ) : (
        <EditorContent editor={activeEditor} />
      )}
    </div>
  );
}

function ToolbarButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition ${
        active
          ? "bg-neutral-950 text-white"
          : "text-neutral-700 hover:bg-white hover:text-neutral-950"
      }`}
    >
      {children}
    </button>
  );
}
