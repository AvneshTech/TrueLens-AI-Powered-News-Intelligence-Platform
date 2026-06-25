/**
 * PHASE 7: client-side export for a single note — PDF, JPG, PNG, and print.
 *
 * All four paths render the same offscreen, print-friendly DOM node (built by
 * `buildExportNode`) rather than capturing the live card from the page: the on-screen
 * card has truncated content (`line-clamp-4`), a dropdown menu, and edit/delete
 * buttons that have no business appearing in an exported document.
 */
import { jsPDF } from "jspdf";
// NOTE: html2canvas-pro (drop-in fork) is used instead of html2canvas because the
// app's Tailwind v4 theme defines colors with the oklch() CSS function. The stock
// html2canvas parses every stylesheet on the page and throws
// "Attempting to parse an unsupported color function 'oklch'", breaking PDF/PNG/JPG
// export. html2canvas-pro has the same API but understands oklch/lab/lch/color().
import html2canvas from "html2canvas-pro";

export interface ExportableNote {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt?: string;
}

const EXPORT_NODE_WIDTH_PX = 760;

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Builds an offscreen, fully-styled DOM node for the note and appends it to the
 * document so html2canvas can rasterize it, then returns it for the caller to
 * remove afterward. Positioned off-screen (not display:none — html2canvas can't
 * capture unrendered elements) so it never flashes visibly for the user.
 */
function buildExportNode(note: ExportableNote): HTMLDivElement {
  const node = document.createElement("div");
  node.style.position = "fixed";
  node.style.top = "0";
  node.style.left = "-99999px"; // off-screen, but still laid out/rendered
  node.style.width = `${EXPORT_NODE_WIDTH_PX}px`;
  node.style.padding = "40px";
  node.style.background = "#ffffff";
  node.style.fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  node.style.color = "#18181b";
  node.style.boxSizing = "border-box";

  const title = document.createElement("h1");
  title.textContent = note.title;
  title.style.fontSize = "24px";
  title.style.fontWeight = "700";
  title.style.margin = "0 0 4px 0";
  title.style.wordBreak = "break-word";
  node.appendChild(title);

  const dateEl = document.createElement("div");
  dateEl.textContent = formatDate(note.createdAt);
  dateEl.style.fontSize = "13px";
  dateEl.style.color = "#71717a";
  dateEl.style.marginBottom = "16px";
  node.appendChild(dateEl);

  if (note.category) {
    const badge = document.createElement("span");
    badge.textContent = note.category;
    badge.style.display = "inline-block";
    badge.style.fontSize = "12px";
    badge.style.fontWeight = "600";
    badge.style.padding = "4px 10px";
    badge.style.borderRadius = "9999px";
    badge.style.background = "#f4f4f5";
    badge.style.color = "#27272a";
    badge.style.marginBottom = "16px";
    node.appendChild(badge);
  }

  const contentEl = document.createElement("p");
  contentEl.textContent = note.content;
  contentEl.style.fontSize = "15px";
  contentEl.style.lineHeight = "1.6";
  contentEl.style.whiteSpace = "pre-wrap";
  contentEl.style.wordBreak = "break-word";
  contentEl.style.margin = "16px 0";
  node.appendChild(contentEl);

  const tags = (note.tags ?? []).filter((t) => t.trim());
  if (tags.length > 0) {
    const tagWrap = document.createElement("div");
    tagWrap.style.display = "flex";
    tagWrap.style.flexWrap = "wrap";
    tagWrap.style.gap = "6px";
    tagWrap.style.marginTop = "20px";
    tagWrap.style.paddingTop = "16px";
    tagWrap.style.borderTop = "1px solid #e4e4e7";

    for (const tag of tags) {
      const tagEl = document.createElement("span");
      tagEl.textContent = `#${tag.trim()}`;
      tagEl.style.fontSize = "12px";
      tagEl.style.padding = "3px 9px";
      tagEl.style.borderRadius = "9999px";
      tagEl.style.border = "1px solid #d4d4d8";
      tagEl.style.color = "#52525b";
      tagWrap.appendChild(tagEl);
    }
    node.appendChild(tagWrap);
  }

  document.body.appendChild(node);
  return node;
}

async function captureNoteAsCanvas(note: ExportableNote): Promise<HTMLCanvasElement> {
  const node = buildExportNode(note);
  try {
    // scale: 2 roughly doubles the rendered resolution so exported text isn't
    // blurry on high-DPI screens — the standard html2canvas sharpness fix.
    return await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
  } finally {
    node.remove();
  }
}

function sanitizeFilename(title: string): string {
  return (title || "note").trim().replace(/[^a-z0-9-_ ]/gi, "").replace(/\s+/g, "-").slice(0, 80) || "note";
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportNoteAsImage(
  note: ExportableNote,
  format: "png" | "jpg",
): Promise<void> {
  const canvas = await captureNoteAsCanvas(note);
  const mime = format === "jpg" ? "image/jpeg" : "image/png";
  const dataUrl = canvas.toDataURL(mime, 0.95);
  downloadDataUrl(dataUrl, `${sanitizeFilename(note.title)}.${format}`);
}

export async function exportNoteAsPdf(note: ExportableNote): Promise<void> {
  const canvas = await captureNoteAsCanvas(note);
  const imgData = canvas.toDataURL("image/png", 1.0);

  // A4 in points (jsPDF default unit below), with a margin on every side.
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 28;

  const renderWidth = pageWidth - margin * 2;
  const renderHeight = (canvas.height * renderWidth) / canvas.width;

  let heightRemaining = renderHeight;
  let position = margin;

  // First page.
  pdf.addImage(imgData, "PNG", margin, position, renderWidth, renderHeight);
  heightRemaining -= pageHeight - margin * 2;

  // Long notes need more than one page — keep stamping the same full image at a
  // progressively negative y-offset (jsPDF clips to the page bounds, so only the
  // unprinted slice of the image actually shows on each new page).
  while (heightRemaining > 0) {
    position = -(renderHeight - heightRemaining) + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, renderWidth, renderHeight);
    heightRemaining -= pageHeight - margin * 2;
  }

  pdf.save(`${sanitizeFilename(note.title)}.pdf`);
}

/**
 * Opens a clean, isolated print view in a new tab and triggers the browser's print
 * dialog. Deliberately doesn't reuse html2canvas (printing a rasterized image
 * wastes ink/toner and produces fuzzier text than letting the browser's own print
 * engine lay out real, selectable text).
 */
export function printNote(note: ExportableNote): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error(
      "Could not open the print window — please check your browser's pop-up blocker",
    );
  }

  const tags = (note.tags ?? []).filter((t) => t.trim());
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(note.title)}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #18181b;
            max-width: 700px;
            margin: 40px auto;
            padding: 0 20px;
          }
          h1 { font-size: 24px; margin: 0 0 4px 0; word-break: break-word; }
          .meta { font-size: 13px; color: #71717a; margin-bottom: 16px; }
          .category {
            display: inline-block; font-size: 12px; font-weight: 600;
            padding: 4px 10px; border-radius: 9999px;
            background: #f4f4f5; color: #27272a; margin-bottom: 16px;
          }
          .content { font-size: 15px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
          .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e4e4e7; }
          .tag { font-size: 12px; padding: 3px 9px; border-radius: 9999px; border: 1px solid #d4d4d8; color: #52525b; }
          @media print { body { margin: 0; padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(note.title)}</h1>
        <div class="meta">${escapeHtml(formatDate(note.createdAt))}</div>
        ${note.category ? `<div class="category">${escapeHtml(note.category)}</div>` : ""}
        <div class="content">${escapeHtml(note.content)}</div>
        ${
          tags.length > 0
            ? `<div class="tags">${tags.map((t) => `<span class="tag">#${escapeHtml(t.trim())}</span>`).join("")}</div>`
            : ""
        }
      </body>
    </html>
  `);
  printWindow.document.close();

  // Wait for layout/paint before invoking print — calling it immediately on some
  // browsers prints a blank page because the document hasn't finished rendering.
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
