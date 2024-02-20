import { getPaletteFromURL } from "color-thief-node";
import colorsea from "colorsea";

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

function getRequiredRatio() {
  return 4;
}

function formatPallete(color: Array<number>): {color: Array<number>, ratio: number, isContrast: boolean} {
  const textColor = [255, 255, 255];
  const ratio = contrastRatio(color, textColor);
  return {
    color,
    ratio,
    isContrast: ratio >= getRequiredRatio()
  };
}

function getContrastColor(pallete: Array<{color: Array<number>, ratio: number, isContrast: boolean}>) {
  const contrastPallete = pallete.filter(currentPallete => currentPallete.isContrast);
  if (contrastPallete.length) {
    contrastPallete.sort((color1, color2) => color1.ratio - color2.ratio);
    return contrastPallete[0].color;
  } else {
    pallete.sort((color1, color2) => color2.ratio - color1.ratio);
    let finalPallete = pallete[0].color;
    while (contrastRatio(finalPallete, [255, 255, 255]) < getRequiredRatio()) {
      finalPallete = colorsea.rgb(finalPallete[0], finalPallete[1], finalPallete[2]).darken().rgb();
    }
    return finalPallete;
  }
}

export async function getCoverDominantColor(coverImageUrl: string) {
  const colorPalette = await getPaletteFromURL(coverImageUrl);
  const formatedPallete = colorPalette.map(pallete => formatPallete(pallete));
  const color = getContrastColor(formatedPallete);
  return `rgb(${color.join(', ')})`;
}