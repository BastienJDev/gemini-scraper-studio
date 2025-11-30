import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, ExternalHyperlink, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

interface ExportOptions {
  title: string;
  content: string;
  format: "pdf" | "docx" | "excel";
}

// Parse markdown-style links [text](url) and return segments
function parseLinks(text: string): Array<{ type: "text" | "link"; content: string; url?: string }> {
  const segments: Array<{ type: "text" | "link"; content: string; url?: string }> = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "link", content: match[1], url: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}

// Extract sources from markdown footer
function extractSources(content: string): Array<{ index: string; label: string; url?: string }> {
  const sources: Array<{ index: string; label: string; url?: string }> = [];
  const lines = content.split("\n");
  const sourcesIndex = lines.findIndex((line) => line.toLowerCase().includes("sources citées"));

  if (sourcesIndex !== -1) {
    for (let i = sourcesIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(/-\s*\*\*\[(\d+)\]\*\*\s*\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        sources.push({
          index: match[1],
          label: match[2],
          url: match[3],
        });
      }
    }
  }

  return sources;
}

// Robust download helper with multiple fallbacks
function downloadBlob(blob: Blob, filename: string) {
  // Try file-saver first
  try {
    saveAs(blob, filename);
    return;
  } catch (err) {
    console.warn("saveAs failed, fallback to anchor download", err);
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  } catch (err) {
    console.error("Anchor download failed", err);
  }

  try {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error("Final download fallback failed", err);
  }
}

// Export to PDF with clickable links
export async function exportToPDF(content: string, title: string = "Rapport ScrapAI"): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, margin, 35);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(11);
  let y = 50;
  const lineHeight = 6;
  const lines = content.split("\n");

  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = 20;
    }

    if (line.startsWith("## ") || (line.startsWith("**") && line.endsWith("**"))) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      const headerText = line.replace(/^##\s*/, "").replace(/\*\*/g, "");
      doc.text(headerText, margin, y);
      y += lineHeight + 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      continue;
    }

    if (line.startsWith("---")) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += lineHeight;
      continue;
    }

    const segments = parseLinks(line);
    let x = margin;

    for (const segment of segments) {
      if (segment.type === "link" && segment.url) {
        doc.setTextColor(0, 100, 200);
        const linkText = segment.content;
        const textWidth = doc.getTextWidth(linkText);

        if (x + textWidth > pageWidth - margin) {
          y += lineHeight;
          x = margin;
          if (y > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            y = 20;
          }
        }

        doc.textWithLink(linkText, x, y, { url: segment.url });
        x += textWidth;
        doc.setTextColor(0, 0, 0);
      } else {
        const words = segment.content.split(" ");
        for (const word of words) {
          const wordWidth = doc.getTextWidth(word + " ");
          if (x + wordWidth > pageWidth - margin && x > margin) {
            y += lineHeight;
            x = margin;
            if (y > doc.internal.pageSize.getHeight() - 30) {
              doc.addPage();
              y = 20;
            }
          }
          doc.text(word + " ", x, y);
          x += wordWidth;
        }
      }
    }

    y += lineHeight;
    x = margin;
  }

  const pdfBlob = doc.output("blob");
  downloadBlob(pdfBlob, `${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

// Export to Word with clickable links
export async function exportToWord(content: string, title: string = "Rapport ScrapAI"): Promise<void> {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 36,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
          color: "808080",
          size: 20,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  const lines = content.split("\n");

  for (const line of lines) {
    if (line.startsWith("## ") || (line.startsWith("**") && line.endsWith("**"))) {
      const headerText = line.replace(/^##\s*/, "").replace(/\*\*/g, "");
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: headerText,
              bold: true,
              size: 26,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
      continue;
    }

    if (line.startsWith("---")) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "────────────────────────────────", color: "CCCCCC" })],
          spacing: { before: 200, after: 200 },
        })
      );
      continue;
    }

    const segments = parseLinks(line);
    const children: (TextRun | ExternalHyperlink)[] = [];

    for (const segment of segments) {
      if (segment.type === "link" && segment.url) {
        children.push(
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: segment.content,
                color: "0066CC",
                underline: { type: "single" },
              }),
            ],
            link: segment.url,
          })
        );
      } else {
        const parts = segment.content.split(/(\*\*[^*]+\*\*)/);
        for (const part of parts) {
          if (part.startsWith("**") && part.endsWith("**")) {
            children.push(
              new TextRun({
                text: part.slice(2, -2),
                bold: true,
              })
            );
          } else if (part) {
            children.push(new TextRun({ text: part }));
          }
        }
      }
    }

    if (children.length > 0 || line.trim() === "") {
      paragraphs.push(
        new Paragraph({
          children: children.length > 0 ? children : [new TextRun({ text: "" })],
          spacing: { after: 120 },
        })
      );
    }
  }

  const sources = extractSources(content);

  if (sources.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Notes de bas de page optimisées",
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    sources.forEach((source) => {
      const displayUrl = source.url || source.label || `Source ${source.index}`;
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${source.index}. `,
              bold: true,
            }),
            source.url
              ? new ExternalHyperlink({
                  children: [
                    new TextRun({
                      text: displayUrl,
                      color: "0066CC",
                      underline: { type: "single" },
                    }),
                  ],
                  link: source.url,
                })
              : new TextRun({ text: displayUrl }),
          ],
          spacing: { after: 120 },
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${title.replace(/[^a-zA-Z0-9]/g, "_")}.docx`);
}

// Export to Excel (CSV) with sources appended
export async function exportToExcel(content: string, title: string = "Rapport ScrapAI"): Promise<void> {
  const rows: string[][] = [];
  const now = `${new Date().toLocaleDateString("fr-FR")} ${new Date().toLocaleTimeString("fr-FR")}`;

  rows.push(["Titre", title]);
  rows.push(["Généré le", now]);
  rows.push([]);
  rows.push(["Section", "Contenu"]);

  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("## ")) {
      rows.push([trimmed.replace(/^##\s*/, ""), ""]);
    } else {
      rows.push(["", trimmed.replace(/\s+/g, " ")]);
    }
  });

  const sources = extractSources(content);
  if (sources.length > 0) {
    rows.push([]);
    rows.push(["Sources citées", "URL"]);
    sources.forEach((source) => {
      rows.push([source.label || `Source ${source.index}`, source.url || ""]);
    });
  }

  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${title.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
}

export async function exportDocument({ title, content, format }: ExportOptions): Promise<void> {
  if (format === "pdf") {
    await exportToPDF(content, title);
  } else if (format === "docx") {
    await exportToWord(content, title);
  } else {
    await exportToExcel(content, title);
  }
}
