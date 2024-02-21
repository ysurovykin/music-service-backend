import { getPaletteFromURL, getColorFromURL } from "color-thief-node";

const whiteContrastRatio = 3;
const blackContrastRatio = 4;

type FormatedPallete = {
  color: Array<number>,
  whiteRatio: number,
  blackRatio: number,
  isWhiteContrast: boolean,
  isBlackContrast: boolean
}

function luminance(r: number, g: number, b: number): number {
  const rFormated = r / 255;
  const gFormated = g / 255;
  const bFormated = b / 255;
  const rL = rFormated <= 0.03928 ? rFormated / 12.92 : Math.pow((rFormated + 0.055) / 1.055, 2.4);
  const gL = gFormated <= 0.03928 ? gFormated / 12.92 : Math.pow((gFormated + 0.055) / 1.055, 2.4);
  const bL = bFormated <= 0.03928 ? bFormated / 12.92 : Math.pow((bFormated + 0.055) / 1.055, 2.4);
  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

function contrastRatio(color1: Array<number>, color2: Array<number>): number {
  const [r1, g1, b1] = color1;
  const [r2, g2, b2] = color2;
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const maxL = Math.max(l1, l2);
  const minL = Math.min(l1, l2);
  return (maxL + 0.05) / (minL + 0.05);
}

function formatPallete(color: Array<number>): FormatedPallete {
  const whiteTextColor = [255, 255, 255];
  const blackTextColor = [0, 0, 0];
  const whiteRatio = contrastRatio(color, whiteTextColor);
  const blackRatio = contrastRatio(color, blackTextColor);
  const isWhiteContrast = whiteRatio >= whiteContrastRatio;
  const isBlackContrast = blackRatio >= blackContrastRatio;
  return {
    color,
    whiteRatio,
    blackRatio,
    isWhiteContrast,
    isBlackContrast,
  };
}

function averageDifference(color: Array<number>) {
  let totalDifference = Math.abs(color[0] - color[1]) + Math.abs(color[1] - color[2]) + Math.abs(color[2] - color[0]);
  return totalDifference / 3;
}

function getContrastPallete(pallete: Array<FormatedPallete>) {
  const sortedByContrastPalleteDesc = pallete
    .sort((color1, color2) => Math.abs(color1.blackRatio - color1.whiteRatio) - Math.abs(color2.blackRatio - color2.whiteRatio));
  for (const pallete of sortedByContrastPalleteDesc) {
    if (averageDifference(pallete.color) > 40) {
      return pallete;
    }
  }
  return sortedByContrastPalleteDesc[0];
}

function getRGBA(pallete: FormatedPallete, isBlackContrast: boolean, maximumAlpha: number) {
  if (isBlackContrast) {
    const whiteContrastRatioDiff = pallete.whiteRatio / whiteContrastRatio;
    const blackContrastRatioDiff = blackContrastRatio / pallete.blackRatio;
    const alpha = Math.min(1 - whiteContrastRatioDiff, blackContrastRatioDiff - 1, maximumAlpha);
    return `rgba(0, 0, 0, ${alpha})`;
  } else {
    const blackContrastRatioDiff = pallete.blackRatio / blackContrastRatio;
    const whiteContrastRatioDiff = whiteContrastRatio / pallete.whiteRatio;
    const alpha = Math.min(1 - blackContrastRatioDiff, whiteContrastRatioDiff - 1, maximumAlpha);
    return `rgba(255, 255, 255, ${alpha})`;
  }
}

function getColorShadow(pallete: FormatedPallete): string {
  if (pallete.isBlackContrast && pallete.isWhiteContrast) {
    return `rgba(0, 0, 0, 0)`;
  } else if (pallete.isBlackContrast && !pallete.isWhiteContrast) {
    return getRGBA(pallete, true, 0.6);
  } else if (!pallete.isBlackContrast && pallete.isWhiteContrast) {
    return getRGBA(pallete, false, 0.6);
  } else {
    if (pallete.blackRatio > pallete.whiteRatio) {
      return getRGBA(pallete, true, 0.6);
    } else if (pallete.blackRatio < pallete.whiteRatio) {
      return getRGBA(pallete, false, 0.6);
    } else {
      return `rgba(0, 0, 0, 0)`;
    }
  }
}

export async function getDominantColorWithShadow(coverImageUrl: string) {
  const colorPalette = await getPaletteFromURL(coverImageUrl);
  const formatedPallete = colorPalette.map(pallete => formatPallete(pallete));
  const pallete = getContrastPallete(formatedPallete);
  const backgroundShadow = getColorShadow(pallete);
  return {
    backgroundColor: `rgb(${pallete.color.join(', ')})`,
    backgroundShadow: backgroundShadow
  };
}

export async function getCoverDominantColor(coverImageUrl: string) {
  const colorPalette = await getPaletteFromURL(coverImageUrl);
  const formatedPallete = colorPalette.map(pallete => formatPallete(pallete));
  const pallete = getContrastPallete(formatedPallete);
  return `rgb(${pallete.color.join(', ')})`;
}