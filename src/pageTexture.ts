import * as THREE from "three";
import type { ChapterNode } from "./data";

export interface PageRenderOptions {
  theme: "dark" | "light";
  type: "table-of-contents" | "chapter-detail";
  chapters?: ChapterNode[];
  selectedChapter?: ChapterNode | null;
  pageIndex?: number;
}

/**
 * Renders high-resolution vector canvas textures for book pages.
 * Optimized page heights and margins to prevent UI overlap at bottom.
 */
export function createPageTexture(options: PageRenderOptions): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1433;
  const ctx = canvas.getContext("2d")!;

  const isDark = options.theme === "dark";
  const bgColor = isDark ? "#1e1b18" : "#f7f4ed";
  const textColor = isDark ? "#f2ece4" : "#24201f";
  const subtextColor = isDark ? "#ada095" : "#6e6259";
  const accentColor = isDark ? "#c5917c" : "#8d644a";
  const borderColor = isDark ? "#38322e" : "#e0d8cd";

  // Fill Page Canvas
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Margin Border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  // Page Header
  ctx.fillStyle = accentColor;
  ctx.font = "bold 24px 'Fraunces', serif";
  ctx.textAlign = "left";
  ctx.fillText("CONSTITUTION OF KENYA (2010)", 70, 90);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(70, 110);
  ctx.lineTo(canvas.width - 70, 110);
  ctx.stroke();

  if (options.type === "table-of-contents" && options.chapters) {
    // --- TABLE OF CONTENTS PAGE ---
    ctx.fillStyle = textColor;
    ctx.font = "bold 38px 'Fraunces', serif";
    ctx.fillText("CHAPTERS INDEX", 70, 170);

    let yOffset = 230;
    const maxDisplayed = 12;
    const visibleChapters = options.chapters.slice(0, maxDisplayed);

    visibleChapters.forEach((ch) => {
      const isSelected = options.selectedChapter?.number === ch.number;

      if (isSelected) {
        ctx.fillStyle = isDark ? "rgba(197, 145, 124, 0.15)" : "rgba(141, 100, 74, 0.12)";
        ctx.fillRect(65, yOffset - 28, canvas.width - 130, 48);
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = textColor;
      }

      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.fillText(`Chapter ${ch.number}`, 80, yOffset);

      ctx.fillStyle = subtextColor;
      ctx.font = "20px 'Inter', sans-serif";
      let titleText = ch.title;
      if (titleText.length > 34) {
        titleText = titleText.substring(0, 31) + "...";
      }
      ctx.fillText(titleText, 250, yOffset);

      yOffset += 56;
    });

    if (options.chapters.length > maxDisplayed) {
      ctx.fillStyle = subtextColor;
      ctx.font = "italic 20px 'Inter', sans-serif";
      ctx.fillText(`+ ${options.chapters.length - maxDisplayed} additional chapters...`, 80, yOffset + 10);
    }

  } else if (options.type === "chapter-detail" && options.selectedChapter) {
    // --- CHAPTER DETAIL PAGE ---
    const ch = options.selectedChapter;

    ctx.fillStyle = accentColor;
    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.fillText(`CHAPTER ${ch.number}`, 70, 160);

    ctx.fillStyle = textColor;
    ctx.font = "bold 34px 'Fraunces', serif";
    
    // Wrap Chapter Title
    const words = ch.title.split(" ");
    let line = "";
    let titleY = 210;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > canvas.width - 140 && n > 0) {
        ctx.fillText(line, 70, titleY);
        line = words[n] + " ";
        titleY += 42;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 70, titleY);

    let yOffset = titleY + 45;

    // Render Articles list with safe vertical bounds
    const articles = ch.articles || [];
    if (articles.length === 0) {
      ctx.fillStyle = subtextColor;
      ctx.font = "italic 22px 'Inter', sans-serif";
      ctx.fillText("No provisions listed under this chapter.", 70, yOffset);
    } else {
      ctx.fillStyle = textColor;
      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.fillText(`Articles (${articles.length})`, 70, yOffset);
      yOffset += 40;

      // Limit items so article text doesn't overflow footer
      const maxArticles = 7;
      articles.slice(0, maxArticles).forEach((art) => {
        ctx.fillStyle = accentColor;
        ctx.font = "bold 20px 'Inter', sans-serif";
        ctx.fillText(`${art.number}.`, 80, yOffset);

        ctx.fillStyle = textColor;
        ctx.font = "20px 'Inter', sans-serif";
        let artTitle = art.title || "Untitled Provision";
        if (artTitle.length > 40) {
          artTitle = artTitle.substring(0, 37) + "...";
        }
        ctx.fillText(artTitle, 130, yOffset);

        yOffset += 42;
      });

      if (articles.length > maxArticles) {
        ctx.fillStyle = subtextColor;
        ctx.font = "italic 20px 'Inter', sans-serif";
        ctx.fillText(`... and ${articles.length - maxArticles} additional articles.`, 80, yOffset + 10);
      }
    }
  }

  // Page Footer / Page Numbering
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(70, canvas.height - 120);
  ctx.lineTo(canvas.width - 70, canvas.height - 120);
  ctx.stroke();

  ctx.fillStyle = subtextColor;
  ctx.font = "20px 'Inter', sans-serif";
  ctx.textAlign = "center";
  const pageNumStr = options.pageIndex ? `Page ${options.pageIndex}` : "Katiba 3D";
  ctx.fillText(pageNumStr, canvas.width / 2, canvas.height - 80);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
