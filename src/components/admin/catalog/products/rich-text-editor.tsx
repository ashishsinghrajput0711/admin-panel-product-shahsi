"use client";

import { useEffect, useRef, useState } from "react";
import { NodeSelection } from "@tiptap/pm/state";
import type { ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
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
  ChevronDown,
  Code2,
  Eye,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  PaintBucket,
  Redo2,
  Table2,
  Type,
  UnderlineIcon,
  Undo2,
  Upload,
  Video,
  X,
} from "lucide-react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (attributes: {
        src: string;
        poster?: string | null;
        title?: string | null;
        style?: string | null;
      }) => ReturnType;
    };
  }
}

const CustomLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("title"),
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return { title: attributes.title };
        },
      },
      target: {
        default: "_self",
        parseHTML: (element) => element.getAttribute("target") || "_self",
        renderHTML: (attributes) => ({
          target: attributes.target === "_blank" ? "_blank" : "_self",
        }),
      },
      rel: {
        default: null,
        parseHTML: (element) => element.getAttribute("rel"),
        renderHTML: (attributes) => {
          if (attributes.target === "_blank") {
            return { rel: "noopener noreferrer" };
          }
          return { rel: null };
        },
      },
    };
  },
});

const CustomImage = Image.extend({
  inline: false,
  group: "block",
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute("alt"),
        renderHTML: (attributes) => {
          if (!attributes.alt) return {};
          return { alt: attributes.alt };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("title"),
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return { title: attributes.title };
        },
      },
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width"),
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("height"),
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
      class: {
        default: "max-w-full rounded-lg",
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) => {
          if (!attributes.class) return {};
          return { class: attributes.class };
        },
      },
      linkHref: {
        default: null,
        parseHTML: (element) =>
          element.closest("a")?.getAttribute("href") || null,
        renderHTML: () => ({}),
      },
      linkTitle: {
        default: null,
        parseHTML: (element) =>
          element.closest("a")?.getAttribute("title") || null,
        renderHTML: () => ({}),
      },
      linkTarget: {
        default: "_self",
        parseHTML: (element) =>
          element.closest("a")?.getAttribute("target") || "_self",
        renderHTML: () => ({}),
      },
    };
  },

   renderHTML({ node, HTMLAttributes }): DOMOutputSpec {
    const imageAttrs = { ...HTMLAttributes } as Record<string, unknown>;

    delete imageAttrs.linkHref;
    delete imageAttrs.linkTitle;
    delete imageAttrs.linkTarget;

    const imageNode: DOMOutputSpec = [
      "img",
      mergeAttributes({ class: "max-w-full rounded-lg" }, imageAttrs),
    ];

    const linkHref =
      typeof node.attrs.linkHref === "string" ? node.attrs.linkHref : "";

    if (!linkHref) return imageNode;

    const linkAttrs: Record<string, string> = {
      href: linkHref,
      target: node.attrs.linkTarget === "_blank" ? "_blank" : "_self",
    };

    if (typeof node.attrs.linkTitle === "string" && node.attrs.linkTitle) {
      linkAttrs.title = node.attrs.linkTitle;
    }

    if (node.attrs.linkTarget === "_blank") {
      linkAttrs.rel = "noopener noreferrer";
    }

    return ["a", linkAttrs, imageNode];
  },

  addNodeView() {
    return ({ node, view, getPos }) => {
      const wrapper = document.createElement("span");
      wrapper.className = "rte-image-resize-wrapper";
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";
      wrapper.style.maxWidth = "100%";
      wrapper.style.lineHeight = "0";

      const image = document.createElement("img");
      const handle = document.createElement("span");
      handle.className = "rte-image-resize-handle";
      handle.contentEditable = "false";
      handle.title = "Drag to resize image";
      handle.style.position = "absolute";
      handle.style.right = "-6px";
      handle.style.bottom = "-6px";
      handle.style.width = "14px";
      handle.style.height = "14px";
      handle.style.border = "2px solid #2563eb";
      handle.style.borderRadius = "999px";
      handle.style.background = "#fff";
      handle.style.cursor = "nwse-resize";
      handle.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2)";
      handle.style.zIndex = "2";

      function applyAttrs() {
        const attrs = node.attrs as Record<string, string | null>;
        const layoutStyle =
          attrs.style ||
          "max-width:100%;border-radius:8px;height:auto;width:400px;display:block;margin-top:16px;margin-right:auto;margin-bottom:16px;margin-left:0;";

        wrapper.setAttribute(
          "style",
          `position:relative;line-height:0;${layoutStyle}`,
        );
        wrapper.className = `rte-image-resize-wrapper ${attrs.linkHref ? "rte-image-linked" : ""}`;
        wrapper.title = attrs.linkHref
          ? `Linked image: ${attrs.linkHref}`
          : "Click to select image. Drag the blue corner to resize.";

        image.src = attrs.src || "";
        image.alt = attrs.alt || "";
        if (attrs.title) image.title = attrs.title;
        else image.removeAttribute("title");
        image.removeAttribute("width");
        image.removeAttribute("height");
        image.setAttribute("class", attrs.class || "max-w-full rounded-lg");
        image.setAttribute(
          "style",
          "display:block;width:100%;max-width:100%;height:auto;border-radius:8px;",
        );
      }

      applyAttrs();
      wrapper.appendChild(image);
      wrapper.appendChild(handle);

      handle.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const startX = event.clientX;
        const startWidth =
          image.getBoundingClientRect().width ||
          Number(node.attrs.width) ||
          400;
        const maxWidth = wrapper.parentElement?.clientWidth || 1200;

        const onMouseMove = (moveEvent: MouseEvent) => {
          const delta = moveEvent.clientX - startX;
          const nextWidth = Math.max(
            80,
            Math.min(maxWidth, Math.round(startWidth + delta)),
          );
          wrapper.style.width = `${nextWidth}px`;
          image.style.width = "100%";
          image.removeAttribute("width");
        };

        const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);

          const finalWidth = Math.round(wrapper.getBoundingClientRect().width);
          const currentStyle = String(node.attrs.style || "");
          const withoutWidth = currentStyle
            .split(";")
            .map((item) => item.trim())
            .filter(Boolean)
            .filter((item) => {
              const cleanItem = item.toLowerCase();
              return (
                !cleanItem.startsWith("width:") &&
                !cleanItem.startsWith("--rte-custom-width:")
              );
            });
          const nextStyle = `${withoutWidth.join(";")};width:${finalWidth}px;--rte-custom-width:1;`;
          const position = typeof getPos === "function" ? getPos() : null;

          if (typeof position === "number") {
            const transaction = view.state.tr.setNodeMarkup(
              position,
              undefined,
              {
                ...node.attrs,
                width: String(finalWidth),
                style: nextStyle,
              },
            );
            view.dispatch(transaction);
          }
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });

      return {
        dom: wrapper,
        update(updatedNode) {
          if (updatedNode.type.name !== node.type.name) return false;
          node = updatedNode;
          applyAttrs();
          return true;
        },
      };
    };
  },
});

const VideoNode = Node.create({
  name: "video",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
      },
      poster: {
        default: null,
        parseHTML: (element) => element.getAttribute("poster"),
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("title"),
      },
      style: {
        default: "max-width:100%;border-radius:8px;",
        parseHTML: (element) => element.getAttribute("style"),
      },
      controls: {
        default: true,
        parseHTML: (element) => element.hasAttribute("controls"),
      },
    };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(
        {
          controls: "true",
          style: "max-width:100%;border-radius:8px;",
        },
        HTMLAttributes,
      ),
    ];
  },

  addCommands() {
    return {
      setVideo:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});

type LinkTarget = "_self" | "_blank";
type ImageSize = "original" | "small" | "medium" | "large" | "full" | "custom";
type ImageAlignment = "left" | "center" | "right";

type LinkDraft = {
  href: string;
  title: string;
  target: LinkTarget;
};

type ImageEditDraft = {
  size: ImageSize;
  customWidth: string;
  altText: string;
  alignment: ImageAlignment;
  wrapText: boolean;
  spacingTop: string;
  spacingRight: string;
  spacingBottom: string;
  spacingLeft: string;
};

function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");
  }

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

  if (typeof value === "string") {
    const cleanValue = value.trim();

    if (/^https?:\/\//i.test(cleanValue)) return cleanValue;
    if (/^\/uploads\//i.test(cleanValue)) return cleanValue;
    if (/^\/media\//i.test(cleanValue)) return cleanValue;
    if (/^\/assets\//i.test(cleanValue)) return cleanValue;

    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findMediaUrl(item);
      if (found) return found;
    }

    return null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    const directUrlKeys = [
      "secureUrl",
      "secure_url",
      "url",
      "src",
      "href",
      "path",
      "location",
      "publicUrl",
      "public_url",
      "fileUrl",
      "file_url",
      "mediaUrl",
      "media_url",
      "imageUrl",
      "image_url",
      "videoUrl",
      "video_url",
      "assetUrl",
      "asset_url",
      "downloadUrl",
      "download_url",
      "originalUrl",
      "original_url",
      "thumbnail",
      "thumbnailUrl",
      "thumbnail_url",
    ];

    for (const key of directUrlKeys) {
      const found = findMediaUrl(record[key]);
      if (found) return found;
    }

    const nestedKeys = [
      "data",
      "file",
      "files",
      "media",
      "uploaded",
      "upload",
      "result",
      "results",
      "asset",
      "assets",
      "image",
      "video",
      "attachment",
      "attachments",
      "payload",
      "response",
    ];

    for (const key of nestedKeys) {
      const found = findMediaUrl(record[key]);
      if (found) return found;
    }

    for (const item of Object.values(record)) {
      const found = findMediaUrl(item);
      if (found) return found;
    }
  }

  return null;
}

function getHeadingSelectValue(
  editor: NonNullable<ReturnType<typeof useEditor>>,
) {
  if (editor.isActive("heading", { level: 1 })) return "h1";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  if (editor.isActive("heading", { level: 4 })) return "h4";
  if (editor.isActive("heading", { level: 5 })) return "h5";
  if (editor.isActive("heading", { level: 6 })) return "h6";

  return "p";
}

function normalizeLinkUrl(value: string) {
  const cleanValue = value.trim();
  if (!cleanValue) return "";
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(cleanValue)) return cleanValue;
  return `https://${cleanValue}`;
}

function parseNumber(value: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number);
}

function getStyleNumber(style: string, property: string) {
  const regex = new RegExp(`${property}\\s*:\\s*([0-9.]+)px`, "i");
  const match = style.match(regex);
  return match?.[1] || "0";
}

function detectImageSize(
  width?: string | null,
  style?: string | null,
): ImageSize {
  const cleanWidth = `${width || ""}`.trim().toLowerCase();
  const cleanStyle = `${style || ""}`.toLowerCase();

  if (cleanStyle.includes("--rte-custom-width:1")) return "custom";

  const styleWidth =
    cleanStyle.match(/width\s*:\s*([0-9.]+px|100%)/i)?.[1] || "";
  const effectiveWidth = cleanWidth || styleWidth;

  if (effectiveWidth === "100%" || cleanStyle.includes("width:100%"))
    return "full";
  if (effectiveWidth === "200" || effectiveWidth === "200px") return "small";
  if (effectiveWidth === "400" || effectiveWidth === "400px") return "medium";
  if (effectiveWidth === "600" || effectiveWidth === "600px") return "large";

  const numericWidth = Number(effectiveWidth.replace("px", ""));
  if (Number.isFinite(numericWidth) && numericWidth > 0) return "custom";

  return "original";
}

function getImageCustomWidth(width?: string | null, style?: string | null) {
  const cleanWidth = `${width || ""}`.trim();
  const styleWidth = `${style || ""}`.match(/width\s*:\s*([0-9.]+)px/i)?.[1];
  const numericWidth = Number(styleWidth || cleanWidth.replace("px", ""));

  if (Number.isFinite(numericWidth) && numericWidth > 0) {
    return String(Math.round(numericWidth));
  }

  return "";
}

function detectImageAlignment(style?: string | null): ImageAlignment {
  const cleanStyle = `${style || ""}`.toLowerCase();

  if (cleanStyle.includes("--rte-align:center")) return "center";
  if (
    cleanStyle.includes("--rte-wrap:1") &&
    cleanStyle.includes("display:inline-block") &&
    cleanStyle.includes("float:none")
  ) {
    return "center";
  }
  if (cleanStyle.includes("--rte-align:right")) return "right";
  if (cleanStyle.includes("--rte-align:left")) return "left";

  if (
    cleanStyle.includes("margin-left:auto") &&
    cleanStyle.includes("margin-right:auto")
  ) {
    return "center";
  }
  if (cleanStyle.includes("float:right")) return "right";
  if (cleanStyle.includes("float:left")) return "left";
  if (cleanStyle.includes("margin-left:auto")) return "right";

  return "left";
}
function detectImageWrapText(style?: string | null) {
  const cleanStyle = `${style || ""}`.toLowerCase();

  if (cleanStyle.includes("--rte-align:center")) return false;
  if (cleanStyle.includes("float:left") || cleanStyle.includes("float:right")) {
    return true;
  }

  return cleanStyle.includes("--rte-wrap:1") && !cleanStyle.includes("float:none");
}

function selectedTextOrNodeExists(
  editor: NonNullable<ReturnType<typeof useEditor>>,
) {
  return (
    !editor.state.selection.empty ||
    editor.isActive("image") ||
    editor.isActive("link")
  );
}

function getImageSizeFromAttrs(attrs: {
  width?: string | null;
  style?: string | null;
}): ImageSize {
  return detectImageSize(attrs.width, attrs.style);
}

function updateSelectedImageAttributes(
  editor: NonNullable<ReturnType<typeof useEditor>>,
  attributes: Record<string, unknown>,
) {
  const { state, view } = editor;
  const { selection } = state;

  if (selection instanceof NodeSelection && selection.node.type.name === "image") {
    const transaction = state.tr.setNodeMarkup(selection.from, undefined, {
      ...selection.node.attrs,
      ...attributes,
    });

    view.dispatch(transaction);
    return true;
  }

  return editor.chain().focus().updateAttributes("image", attributes).run();
}
function buildImageStyle(draft: ImageEditDraft) {
  const top = parseNumber(draft.spacingTop);
  const right = parseNumber(draft.spacingRight);
  const bottom = parseNumber(draft.spacingBottom);
  const left = parseNumber(draft.spacingLeft);
  const customWidth = parseNumber(draft.customWidth);
  const declarations: string[] = [
    "max-width:100%",
    "border-radius:8px",
    "height:auto",
    `--rte-align:${draft.alignment}`,
  ];

  if (draft.size === "small") declarations.push("width:200px");
  if (draft.size === "medium") declarations.push("width:400px");
  if (draft.size === "large") declarations.push("width:600px");
  if (draft.size === "full") declarations.push("width:100%");
  if (draft.size === "custom" && customWidth > 0) {
    declarations.push(`width:${customWidth}px`);
    declarations.push("--rte-custom-width:1");
  }

  if (draft.wrapText && draft.alignment !== "center") {
    declarations.push("--rte-wrap:1");
    declarations.push("display:inline-block");
    declarations.push("clear:none");
    declarations.push(
      `float:${draft.alignment === "right" ? "right" : "left"}`,
    );
    declarations.push(`margin-top:${top || 0}px`);
    declarations.push(
      `margin-right:${right || (draft.alignment === "left" ? 16 : 0)}px`,
    );
    declarations.push(`margin-bottom:${bottom || 16}px`);
    declarations.push(
      `margin-left:${left || (draft.alignment === "right" ? 16 : 0)}px`,
    );
  } else {
    declarations.push("display:block");
    declarations.push("float:none");

    if (draft.alignment === "center") {
      declarations.push("margin-left:auto", "margin-right:auto");
    } else if (draft.alignment === "right") {
      declarations.push("margin-left:auto", "margin-right:0");
    } else {
      declarations.push("margin-left:0", "margin-right:auto");
    }

    declarations.push(`margin-top:${top || 16}px`);
    declarations.push(`margin-bottom:${bottom || 16}px`);

    if (left) declarations.push(`margin-left:${left}px`);
    if (right) declarations.push(`margin-right:${right}px`);
  }

  return `${declarations.join(";")};`;
}

function getImageWidthAttribute(size: ImageSize, customWidth?: string) {
  if (size === "small") return "200";
  if (size === "medium") return "400";
  if (size === "large") return "600";
  if (size === "full") return "100%";
  if (size === "custom") {
    const parsed = parseNumber(customWidth || "");
    return parsed > 0 ? String(parsed) : null;
  }
  return null;
}

function getDefaultInsertedImageAttributes(fileName = "") {
  return {
    width: 400,
    height: undefined,
    alt: fileName || undefined,
    title: undefined,
    class: "max-w-full rounded-lg",
    style:
      "max-width:100%;border-radius:8px;height:auto;width:400px;display:block;margin-top:16px;margin-right:auto;margin-bottom:16px;margin-left:0;",
  };
}

export function RichTextEditor({
  value,
  onChange,
  productId,
  minHeightClass = "min-h-[420px]",
  maxHeightClass = "",
  compact = false,
}: {
  value: string;
  onChange: (html: string) => void;
  productId?: string;
  minHeightClass?: string;
  maxHeightClass?: string;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<"visual" | "html" | "preview">("visual");
  const [, forceRender] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);

  const [isAlignmentMenuOpen, setIsAlignmentMenuOpen] = useState(false);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [videoDraft, setVideoDraft] = useState("");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState<LinkDraft>({
    href: "",
    title: "",
    target: "_self",
  });

  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const [isImageEditDialogOpen, setIsImageEditDialogOpen] = useState(false);
  const [imageEditDraft, setImageEditDraft] = useState<ImageEditDraft>({
    size: "original",
    customWidth: "",
    altText: "",
    alignment: "left",
    wrapText: false,
    spacingTop: "0",
    spacingRight: "0",
    spacingBottom: "0",
    spacingLeft: "0",
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      CustomLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-700 underline underline-offset-2",
        },
      }),
      CustomImage.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg",
        },
      }),
      VideoNode,
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
        placeholder: "Write description...",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
      class: `${minHeightClass} ${
  compact
    ? "px-3 py-3 text-sm leading-6"
    : "px-5 py-5 text-sm leading-7"
} text-neutral-950 outline-none [&_.ProseMirror-selectednode]:outline [&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-blue-500 [&_.ProseMirror-selectednode]:outline-offset-2 [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-4 [&_h1]:mb-4 [&_h1]:text-4xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-2xl [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:text-xl [&_h4]:font-semibold [&_h5]:mb-2 [&_h5]:text-lg [&_h5]:font-semibold [&_h6]:mb-2 [&_h6]:text-base [&_h6]:font-semibold [&_iframe]:my-4 [&_iframe]:max-w-full [&_.rte-image-resize-wrapper]:my-4 [&_.rte-image-resize-wrapper_img]:cursor-pointer [&_.rte-image-resize-wrapper_img]:max-w-full [&_.rte-image-resize-handle]:opacity-0 [&_.rte-image-resize-wrapper:hover_.rte-image-resize-handle]:opacity-100 [&_.ProseMirror-selectednode_.rte-image-resize-handle]:opacity-100 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-neutral-300 [&_td]:p-2 [&_th]:border [&_th]:border-neutral-300 [&_th]:bg-neutral-100 [&_th]:p-2 [&_ul]:list-disc [&_video]:my-4 [&_video]:max-w-full`,
      },
    },
    onSelectionUpdate() {
      forceRender((current) => current + 1);
    },
    onTransaction() {
      forceRender((current) => current + 1);
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
      forceRender((current) => current + 1);
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    const nextHtml = value || "";

    if (currentHtml !== nextHtml) {
      editor.commands.setContent(nextHtml, {
        emitUpdate: false,
      });
    }
  }, [editor, value]);

  async function uploadEditorFile(file: File) {
    const formData = new FormData();

    formData.append("files", file);
    formData.append("folder", "product-descriptions");

    if (productId) {
      formData.append("productId", productId);
    }

    const token = getToken();

    const response = await fetch(
      `${getApiRootUrl()}/admin/editor-media/upload`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      },
    );

    const json = await response.json().catch(() => null);
    console.log("EDITOR_MEDIA_UPLOAD_RESPONSE:", json);

    if (!response.ok) {
      throw new Error(json?.message || "Editor media upload failed.");
    }

    const url = findMediaUrl(json);

    if (!url) {
      throw new Error("Upload response me media URL nahi mila.");
    }

    if (url.startsWith("/")) {
      return `${getApiRootUrl()}${url}`;
    }

    return url;
  }

  async function handleFileUpload(files: FileList | null) {
    if (!editor || !files?.length) return;

    try {
      for (const file of Array.from(files)) {
        const url = await uploadEditorFile(file);

        if (file.type.startsWith("video/")) {
          editor.chain().focus().setVideo({ src: url }).run();
        } else {
        editor
  .chain()
  .focus()
  .setImage({
    src: url,
    ...getDefaultInsertedImageAttributes(file.name),
    alt: file.name,
    title: undefined,
  })
  .run();
        }
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageUploadInputRef.current) imageUploadInputRef.current.value = "";
      setIsImageUploading(false);
    }
  }

  if (!editor) return null;

  const activeEditor = editor;
  const isImageSelected = activeEditor.isActive("image");
  const canUseLink = selectedTextOrNodeExists(activeEditor);

  function setBlockType(selectedValue: string) {
    activeEditor.chain().focus().run();

    if (selectedValue === "p") {
      activeEditor.chain().focus().setParagraph().run();
      forceRender((current) => current + 1);
      return;
    }

    const headingLevel = Number(selectedValue.replace("h", "")) as
      1 | 2 | 3 | 4 | 5 | 6;

    activeEditor.chain().focus().setHeading({ level: headingLevel }).run();
    forceRender((current) => current + 1);
  }

  function openLinkDialog() {
    if (!canUseLink) return;

    if (isImageSelected) {
      const attrs = activeEditor.getAttributes("image") as {
        linkHref?: string;
        linkTitle?: string;
        linkTarget?: string;
      };

      setLinkDraft({
        href: attrs.linkHref || "",
        title: attrs.linkTitle || "",
        target: attrs.linkTarget === "_blank" ? "_blank" : "_self",
      });
      setIsLinkDialogOpen(true);
      return;
    }

    const attrs = activeEditor.getAttributes("link") as {
      href?: string;
      title?: string;
      target?: string;
    };

    setLinkDraft({
      href: attrs.href || "",
      title: attrs.title || "",
      target: attrs.target === "_blank" ? "_blank" : "_self",
    });
    setIsLinkDialogOpen(true);
  }

  function applyLink() {
    const href = normalizeLinkUrl(linkDraft.href);

    if (isImageSelected) {
      updateSelectedImageAttributes(activeEditor, {
        linkHref: href || null,
        linkTitle: linkDraft.title.trim() || null,
        linkTarget: linkDraft.target,
      });
      setIsLinkDialogOpen(false);
      return;
    }

    if (!href) {
      activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsLinkDialogOpen(false);
      return;
    }

    activeEditor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href,
        title: linkDraft.title.trim() || null,
        target: linkDraft.target,
        rel: linkDraft.target === "_blank" ? "noopener noreferrer" : null,
      } as any)
      .run();

    setIsLinkDialogOpen(false);
  }

  function removeLink() {
    if (isImageSelected) {
      updateSelectedImageAttributes(activeEditor, {
        linkHref: null,
        linkTitle: null,
        linkTarget: "_self",
      });
      setIsLinkDialogOpen(false);
      return;
    }

    activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
    setIsLinkDialogOpen(false);
  }

  function openImageInsertDialog() {
    setIsImageDialogOpen(true);
  }

  async function uploadImageFromDialog(files: FileList | null) {
    if (!files?.length) return;
    setIsImageUploading(true);
    await handleFileUpload(files);
    setIsImageDialogOpen(false);
  }

  function openImageEditDialog() {
    if (!activeEditor.isActive("image")) {
      window.alert("Please click/select an image first.");
      return;
    }

    const attrs = activeEditor.getAttributes("image") as {
      alt?: string | null;
      title?: string | null;
      style?: string | null;
      width?: string | null;
    };
    const style = attrs.style || "";

    setImageEditDraft({
      size: getImageSizeFromAttrs(attrs),
      customWidth: getImageCustomWidth(attrs.width, style),
      altText: attrs.alt || "",
      alignment: detectImageAlignment(style),
      wrapText: detectImageWrapText(style),
      spacingTop: getStyleNumber(style, "margin-top"),
      spacingRight: getStyleNumber(style, "margin-right"),
      spacingBottom: getStyleNumber(style, "margin-bottom"),
      spacingLeft: getStyleNumber(style, "margin-left"),
    });
    setIsImageEditDialogOpen(true);
  }

  function applyImageEdit() {
    const width = getImageWidthAttribute(
      imageEditDraft.size,
      imageEditDraft.customWidth,
    );

    updateSelectedImageAttributes(activeEditor, {
      alt: imageEditDraft.altText.trim() || null,
      title: null,
      width,
      height: null,
      style: buildImageStyle(imageEditDraft),
      class: "max-w-full rounded-lg",
    });

    setIsImageEditDialogOpen(false);
  }

  function removeSelectedImage() {
    activeEditor.chain().focus().deleteSelection().run();
    setIsImageEditDialogOpen(false);
  }

  function openVideoDialog() {
    setVideoDraft("");
    setIsVideoDialogOpen(true);
  }

  function extractVideoSource(value: string) {
    const cleanValue = value.trim();
    if (!cleanValue) return "";

    const iframeMatch = cleanValue.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch?.[1]) return iframeMatch[1];

    const videoMatch = cleanValue.match(/<video[^>]+src=["']([^"']+)["']/i);
    if (videoMatch?.[1]) return videoMatch[1];

    const sourceMatch = cleanValue.match(/<source[^>]+src=["']([^"']+)["']/i);
    if (sourceMatch?.[1]) return sourceMatch[1];

    return cleanValue;
  }

  function applyVideo() {
    const source = extractVideoSource(videoDraft);
    if (!source) return;

    if (source.includes("youtube.com") || source.includes("youtu.be")) {
      activeEditor.commands.setYoutubeVideo({ src: source });
    } else {
      activeEditor.chain().focus().setVideo({ src: source }).run();
    }

    setIsVideoDialogOpen(false);
    setVideoDraft("");
  }

return (
  <div className="min-w-0 max-w-full overflow-visible rounded-lg border border-neutral-300 bg-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(event) => handleFileUpload(event.target.files)}
      />
      <input
        ref={imageUploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => uploadImageFromDialog(event.target.files)}
      />

<div
  className={[
    "relative z-20 flex min-w-0 max-w-full flex-wrap items-center border-b border-neutral-200 bg-neutral-50",
    compact
      ? "gap-0.5 p-1.5"
      : "gap-1 p-2",
  ].join(" ")}
>
      <select
  value={getHeadingSelectValue(activeEditor)}
  onChange={(event) => setBlockType(event.target.value)}
 className={[
  "min-w-0 shrink-0 rounded-md border border-neutral-200 bg-white font-medium outline-none",
  compact
    ? "h-7 max-w-[110px] px-1.5 text-xs"
    : "h-8 max-w-[140px] px-2 text-sm",
].join(" ")}
>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
        </select>

        <ToolbarDivider />

        <ToolbarButton
          active={activeEditor.isActive("bold")}
          title="Bold"
          onClick={() => activeEditor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={activeEditor.isActive("italic")}
          title="Italic"
          onClick={() => activeEditor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={activeEditor.isActive("underline")}
          title="Underline"
          onClick={() => activeEditor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton title="Text color" onClick={() => undefined}>
          <label className="flex h-full w-full cursor-pointer items-center justify-center">
            <Type className="h-4 w-4" />
            <input
              type="color"
              className="hidden"
              onChange={(event) =>
                activeEditor.chain().focus().setColor(event.target.value).run()
              }
            />
          </label>
        </ToolbarButton>

        <ToolbarButton title="Highlight" onClick={() => undefined}>
          <label className="flex h-full w-full cursor-pointer items-center justify-center">
            <PaintBucket className="h-4 w-4" />
            <input
              type="color"
              className="hidden"
              onChange={(event) =>
                activeEditor
                  .chain()
                  .focus()
                  .setHighlight({ color: event.target.value })
                  .run()
              }
            />
          </label>
        </ToolbarButton>

        <ToolbarDivider />

        <div className="relative shrink-0">
          <ToolbarButton
            active={
              activeEditor.isActive({ textAlign: "left" }) ||
              activeEditor.isActive({ textAlign: "center" }) ||
              activeEditor.isActive({ textAlign: "right" })
            }
            title="Alignment"
            onClick={() => setIsAlignmentMenuOpen((prev) => !prev)}
          >
            <AlignLeft className="h-4 w-4" />
            <ChevronDown className="ml-0.5 h-3 w-3" />
          </ToolbarButton>

          {isAlignmentMenuOpen ? (
            <ToolbarDropdown>
              <DropdownButton
                active={activeEditor.isActive({ textAlign: "left" })}
                onClick={() => {
                  activeEditor.chain().focus().setTextAlign("left").run();
                  setIsAlignmentMenuOpen(false);
                }}
              >
                <AlignLeft className="h-4 w-4" />
                Left
              </DropdownButton>
              <DropdownButton
                active={activeEditor.isActive({ textAlign: "center" })}
                onClick={() => {
                  activeEditor.chain().focus().setTextAlign("center").run();
                  setIsAlignmentMenuOpen(false);
                }}
              >
                <AlignCenter className="h-4 w-4" />
                Center
              </DropdownButton>
              <DropdownButton
                active={activeEditor.isActive({ textAlign: "right" })}
                onClick={() => {
                  activeEditor.chain().focus().setTextAlign("right").run();
                  setIsAlignmentMenuOpen(false);
                }}
              >
                <AlignRight className="h-4 w-4" />
                Right
              </DropdownButton>
            </ToolbarDropdown>
          ) : null}
        </div>

        <ToolbarDivider />

        <div className="relative shrink-0">
          <ToolbarButton
            active={
              activeEditor.isActive("bulletList") ||
              activeEditor.isActive("orderedList")
            }
            title="Lists"
            onClick={() => setIsListMenuOpen((prev) => !prev)}
          >
            <List className="h-4 w-4" />
            <ChevronDown className="ml-0.5 h-3 w-3" />
          </ToolbarButton>

          {isListMenuOpen ? (
            <ToolbarDropdown>
              <DropdownButton
                active={activeEditor.isActive("bulletList")}
                onClick={() => {
                  activeEditor.chain().focus().toggleBulletList().run();
                  setIsListMenuOpen(false);
                }}
              >
                <List className="h-4 w-4" />
                Dot list
              </DropdownButton>
              <DropdownButton
                active={activeEditor.isActive("orderedList")}
                onClick={() => {
                  activeEditor.chain().focus().toggleOrderedList().run();
                  setIsListMenuOpen(false);
                }}
              >
                <ListOrdered className="h-4 w-4" />
                Number list
              </DropdownButton>
            </ToolbarDropdown>
          ) : null}
        </div>

        <ToolbarDivider />

        <ToolbarButton
          active={
            activeEditor.isActive("link") ||
            Boolean(
              (activeEditor.getAttributes("image") as { linkHref?: string })
                .linkHref,
            )
          }
          disabled={!canUseLink}
          title={
            canUseLink ? "Insert link" : "Select text or an image to add a link"
          }
          onClick={openLinkDialog}
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={isImageSelected}
          title={isImageSelected ? "Edit selected image" : "Insert image"}
          onClick={
            isImageSelected ? openImageEditDialog : openImageInsertDialog
          }
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton title="Insert video" onClick={openVideoDialog}>
          <Video className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Insert table"
          onClick={() =>
            activeEditor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <Table2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Undo"
          onClick={() => activeEditor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Redo"
          onClick={() => activeEditor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

      <div className="ml-auto flex shrink-0 items-center gap-1 max-sm:ml-0">
          <ToolbarButton
            active={mode === "html"}
            title={mode === "html" ? "Switch to preview" : "Switch to HTML"}
            onClick={() => setMode(mode === "html" ? "visual" : "html")}
          >
            {mode === "html" ? (
              <Code2 className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </ToolbarButton>
        </div>
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
       className={`${minHeightClass} ${maxHeightClass} w-full bg-neutral-950 ${
  compact ? "p-3" : "p-4"
} font-mono text-sm leading-6 text-white outline-none ${
            maxHeightClass ? "overflow-y-auto" : ""
          }`}
          spellCheck={false}
        />
      ) : mode === "preview" ? (
        <div
        className={`${minHeightClass} ${maxHeightClass} ${
  compact
    ? "px-3 py-3 text-sm leading-6"
    : "px-5 py-5 text-sm leading-7"
} text-neutral-950 [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-4 [&_h1]:text-4xl [&_h1]:font-semibold [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:text-2xl [&_h3]:font-semibold [&_h4]:text-xl [&_h4]:font-semibold [&_h5]:text-lg [&_h5]:font-semibold [&_h6]:text-base [&_h6]:font-semibold [&_iframe]:my-4 [&_iframe]:max-w-full [&_img]:max-w-full [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_ul]:list-disc [&_video]:my-4 [&_video]:max-w-full ${
            maxHeightClass ? "overflow-y-auto" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: value || "" }}
        />
      ) : (
        <div
          className={`${maxHeightClass} ${maxHeightClass ? "overflow-y-auto" : ""}`}
        >
          <EditorContent editor={activeEditor} />
        </div>
      )}

      {isLinkDialogOpen ? (
        <Modal title="Insert link" onClose={() => setIsLinkDialogOpen(false)}>
          <div className="space-y-4">
            <Field label="Link to">
              <input
                value={linkDraft.href}
                onChange={(event) =>
                  setLinkDraft((prev) => ({
                    ...prev,
                    href: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
                placeholder="https://example.com"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Use http:// or https:// for external links.
              </p>
            </Field>

            <Field label="Link title">
              <input
                value={linkDraft.title}
                onChange={(event) =>
                  setLinkDraft((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
                placeholder="Used for accessibility and SEO"
              />
            </Field>

            <Field label="Open this link in">
              <select
                value={linkDraft.target}
                onChange={(event) =>
                  setLinkDraft((prev) => ({
                    ...prev,
                    target: event.target.value as LinkTarget,
                  }))
                }
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              >
                <option value="_self">the same window</option>
                <option value="_blank">a new window</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 flex justify-between gap-2">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              onClick={removeLink}
            >
              Remove link
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                onClick={() => setIsLinkDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
                onClick={applyLink}
              >
                Insert link
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {isImageDialogOpen ? (
        <Modal title="Select image" onClose={() => setIsImageDialogOpen(false)}>
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
              onClick={() => imageUploadInputRef.current?.click()}
              disabled={isImageUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isImageUploading ? "Uploading..." : "Upload image"}
            </button>
            <p className="mx-auto mt-3 max-w-sm text-xs leading-5 text-neutral-500">
              Upload an image from your device. It will be inserted at medium
              width. After upload, click the image and drag the blue corner
              handle to resize it manually, or use Edit image to set exact size,
              alt text, alignment and spacing.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
              onClick={() => setIsImageDialogOpen(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      ) : null}

      {isVideoDialogOpen ? (
        <Modal title="Insert video" onClose={() => setIsVideoDialogOpen(false)}>
          <div className="space-y-3">
            <p className="text-sm leading-6 text-neutral-600">
              Insert a video by pasting the embed snippet in the box below. You
              can also paste a YouTube or video URL.
            </p>
            <textarea
              value={videoDraft}
              onChange={(event) => setVideoDraft(event.target.value)}
              className="min-h-28 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm leading-6 outline-none focus:border-neutral-950"
            />
            <p className="text-xs leading-5 text-neutral-500">
              The embed snippet usually starts with &quot;&lt;iframe ...&quot;
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
              onClick={() => setIsVideoDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
              onClick={applyVideo}
            >
              Insert video
            </button>
          </div>
        </Modal>
      ) : null}

      {isImageEditDialogOpen ? (
        <Modal
          title="Edit image"
          onClose={() => setIsImageEditDialogOpen(false)}
          wide
        >
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-4">
              <Field label="Image size">
                <select
                  value={imageEditDraft.size}
                  onChange={(event) =>
                    setImageEditDraft((prev) => ({
                      ...prev,
                      size: event.target.value as ImageSize,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                >
                  <option value="original">Original size</option>
                  <option value="small">Small - 200px</option>
                  <option value="medium">Medium - 400px</option>
                  <option value="large">Large - 600px</option>
                  <option value="full">Full width</option>
                  <option value="custom">Custom size</option>
                </select>
                {imageEditDraft.size === "custom" ? (
                  <div className="mt-2">
                    <input
                      type="number"
                      min={80}
                      value={imageEditDraft.customWidth}
                      onChange={(event) =>
                        setImageEditDraft((prev) => ({
                          ...prev,
                          customWidth: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
                      placeholder="Custom width in px"
                    />
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      Manual image resize will reopen as custom size with its
                      current width.
                    </p>
                  </div>
                ) : null}
              </Field>

              <Field label="Alt text">
                <input
                  value={imageEditDraft.altText}
                  onChange={(event) =>
                    setImageEditDraft((prev) => ({
                      ...prev,
                      altText: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
                  placeholder="Write a brief description of the image"
                />
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Write a brief description for accessibility and SEO.
                </p>
              </Field>

              <div>
                <p className="mb-2 text-sm font-medium text-neutral-950">
                  Alignment
                </p>
                <div className="flex items-center gap-4">
                  <RadioButton
                    label="Left"
                    checked={imageEditDraft.alignment === "left"}
                    onChange={() =>
                      setImageEditDraft((prev) => ({
                        ...prev,
                        alignment: "left",
                      }))
                    }
                  >
                    <AlignLeft className="h-4 w-4" />
                  </RadioButton>
                  <RadioButton
                    label="Center"
                    checked={imageEditDraft.alignment === "center"}
                    onChange={() =>
                      setImageEditDraft((prev) => ({
                        ...prev,
                        alignment: "center",
                        wrapText: false,
                      }))
                    }
                  >
                    <AlignCenter className="h-4 w-4" />
                  </RadioButton>
                  <RadioButton
                    label="Right"
                    checked={imageEditDraft.alignment === "right"}
                    onChange={() =>
                      setImageEditDraft((prev) => ({
                        ...prev,
                        alignment: "right",
                      }))
                    }
                  >
                    <AlignRight className="h-4 w-4" />
                  </RadioButton>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={imageEditDraft.alignment !== "center" && imageEditDraft.wrapText}
                  disabled={imageEditDraft.alignment === "center"}
                  onChange={(event) =>
                    setImageEditDraft((prev) => ({
                      ...prev,
                      wrapText: prev.alignment === "center" ? false : event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {imageEditDraft.alignment === "center"
                  ? "Wrap text is available only for left/right image alignment"
                  : "Wrap text around image"}
              </label>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-center text-base font-semibold text-neutral-950">
                Spacing
              </p>
              <div className="mt-4 grid grid-cols-3 items-center gap-3 text-center text-sm text-neutral-600">
                <span />
                <SpacingInput
                  label="Top"
                  value={imageEditDraft.spacingTop}
                  onChange={(value) =>
                    setImageEditDraft((prev) => ({
                      ...prev,
                      spacingTop: value,
                    }))
                  }
                />
                <span />
                <SpacingInput
                  label="Left"
                  value={imageEditDraft.spacingLeft}
                  onChange={(value) =>
                    setImageEditDraft((prev) => ({
                      ...prev,
                      spacingLeft: value,
                    }))
                  }
                />
                <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-2 py-6 text-xs text-neutral-400">
                  Image
                </div>
                <SpacingInput
                  label="Right"
                  value={imageEditDraft.spacingRight}
                  onChange={(value) =>
                    setImageEditDraft((prev) => ({
                      ...prev,
                      spacingRight: value,
                    }))
                  }
                />
                <span />
                <SpacingInput
                  label="Bottom"
                  value={imageEditDraft.spacingBottom}
                  onChange={(value) =>
                    setImageEditDraft((prev) => ({
                      ...prev,
                      spacingBottom: value,
                    }))
                  }
                />
                <span />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between gap-2">
            <button
              type="button"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              onClick={removeSelectedImage}
            >
              Remove image
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                onClick={() => setIsImageEditDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
                onClick={applyImageEdit}
              >
                Edit image
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-neutral-200" />;
}

function ToolbarButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-0.5 rounded-md px-1.5 transition ${
        disabled
          ? "cursor-not-allowed text-neutral-300"
          : active
            ? "bg-neutral-950 text-white"
            : "text-neutral-700 hover:bg-white hover:text-neutral-950"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDropdown({ children }: { children: ReactNode }) {
  return (
    <div className="absolute left-0 top-10 z-[999] w-48 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl">
      {children}
    </div>
  );
}

function DropdownButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-neutral-950 text-white"
          : "text-neutral-700 hover:bg-neutral-50"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-6">
      <div
        className={`max-h-[90vh] w-full overflow-hidden rounded-2xl bg-white shadow-2xl ${wide ? "max-w-3xl" : "max-w-xl"}`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
          <button
            type="button"
            className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-72px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-950">
        {label}
      </span>
      {children}
    </label>
  );
}

function RadioButton({
  label,
  checked,
  onChange,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-sm text-neutral-700"
      onClick={onChange}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border ${checked ? "border-neutral-950" : "border-neutral-300"}`}
      >
        {checked ? (
          <span className="h-2 w-2 rounded-full bg-neutral-950" />
        ) : null}
      </span>
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function SpacingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs text-neutral-600">
      <span className="mb-1 block">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-2 text-center text-sm outline-none focus:border-neutral-950"
      />
    </label>
  );
}

export default RichTextEditor;