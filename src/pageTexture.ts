import * as THREE from "three";
import type { ChapterNode } from "./data";

export interface PageRenderOptions {
  theme: "dark" | "light";
  type: "table-of-contents" | "chapter-detail";
  chapters?: ChapterNode[];
  selectedChapter?: ChapterNode | null;
  pageIndex?: number;
  totalPages?: number;
}

/**
 * Creates an HTML5 CanvasTexture containing crisp vector-rendered typography
 * for left/right open book pages.
 */
export function createPageTexture(options: PageRenderOptions): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1433; // ~1:1.4 aspect ratio matching physical page dimensions
  const ctx = canvas.getContext("2d")!;

  // 1. Theme Design Token Colors
  const isDark = options.theme === "dark";
  const bgColor = isDark ? "#1e1b18" : "#f7f4ed";
  const textColor = isDark ? "#f2ece4" : "#24201f";
  const subtextColor = isDark ? "#ada095" : "#6e6259";
  const accentColor = isDark ? "#c5917c" : "#8d644a";
  const borderColor = isDark ? "#38322e" : "#e0d8cd";

  // Fill Background Canvas
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative Inner Page Border / Margin Lines
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  // 2. Render Page Header
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

  // 3. Render Page Content Logic
  if (options.type === "table-of-contents" && options.chapters) {
    // --- TABLE OF CONTENTS PAGE ---
    ctx.fillStyle = textColor;
    ctx.font = "bold 38px 'Fraunces', serif";
    ctx.fillText("CHAPTERS INDEX", 70, 170);

    let yOffset = 230;
    const maxDisplayed = 12; // Prevent canvas overflow
    const visibleChapters = options.chapters.slice(0, maxDisplayed);

    visibleChapters.forEach((ch) => {
      const isSelected = options.selectedChapter?.number === ch.number;

      // Selection Highlight Box
      if (isSelected) {
        ctx.fillStyle = isDark ? "rgba(197, 145, 124, 0.15)" : "rgba(141, 100, 74, 0.12)";
        ctx.fillRect(65, yOffset - 28, canvas.width - 130, 48);
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = textColor;
      }

      ctx.font = "bold 24px 'Inter', sans-serif";
      const chapterLabel = `Chapter ${ch.number}`;
      ctx.fillText(chapterLabel, 80, yOffset);

      ctx.fillStyle = subtextColor;
      ctx.font = "20px 'Inter', sans-serif";
      // Truncate long chapter titles to fit width
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
      ctx.fillText(`+ ${options.chapters.length - maxDisplayed} more chapters...`, 80, yOffset + 10);
    }

  } else if (options.type === "chapter-detail" && options.selectedChapter) {
    // --- CHAPTER DETAIL PAGE ---
    const ch = options.selectedChapter;

    ctx.fillStyle = accentColor;
    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.fillText(`CHAPTER ${ch.number}`, 70, 160);

    ctx.fillStyle = textColor;
    ctx.font = "bold 34px 'Fraunces', serif";
    
    // Wrap Chapter Title across multiple lines if needed
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

    let yOffset = titleY + 50;

    // Render Articles
    const articles = ch.articles || [];
    if (articles.length === 0) {
      ctx.fillStyle = subtextColor;
      ctx.font = "italic 22px 'Inter', sans-serif";
      ctx.fillText("No articles listed under this chapter.", 70, yOffset);
    } else {
      ctx.fillStyle = textColor;
      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.fillText(`Articles (${articles.length})`, 70, yOffset);
      yOffset += 40;

      // Render top articles list
      const maxArticles = 8;
      articles.slice(0, maxArticles).forEach((art) => {
        ctx.fillStyle = accentColor;
        ctx.font = "bold 20px 'Inter', sans-serif";
        ctx.fillText(`${art.number}.`, 80, yOffset);

        ctx.fillStyle = textColor;
        ctx.font = "20px 'Inter', sans-serif";
        let artTitle = art.title || "Untitled Provision";
        if (artTitle.length > 42) {
          artTitle = artTitle.substring(0, 39) + "...";
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
  } else {
    // Default Cover Page / Intro
    ctx.fillStyle = textColor;
    ctx.font = "bold 36px 'Fraunces', serif";
    ctx.fillText("REPUBLIC OF KENYA", 70, 200);
    ctx.fillStyle = subtextColor;
    ctx.font = "24px 'Inter', sans-serif";
    ctx.fillText("Promulgated 27th August 2010", 70, 250);
  }

  // 4. Render Page Footer / Page Numbering
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(70, canvas.height - 90);
  ctx.lineTo(canvas.width - 70, canvas.height - 90);
  ctx.stroke();

  ctx.fillStyle = subtextColor;
  ctx.font = "20px 'Inter', sans-serif";
  ctx.textAlign = "center";
  const pageNumStr = options.pageIndex ? `Page ${options.pageIndex}` : "Katiba 3D";
  ctx.fillText(pageNumStr, canvas.width / 2, canvas.height - 55);

  // Return generated CanvasTexture
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
