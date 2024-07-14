/**
 * @file makeRGB
 * @description Create RGB values out of an audio dataset and anticipated intensity.
 */

import shuffleArray from "./shuffle.js";

export function makeRGBColors(index, height) {
  return {
    red: Math.abs((index * height) / 10),
    green: Math.abs(index * 4),
    blue: Math.abs(height / 4 - 12),
  };
}

export function makeRGBString(...colors) {
  return `rgb(${colors[0]} ${colors[1]} ${colors[2]})`;
}

export default function makeRGB(index, height, randomize = false) {
  const { red, green, blue } = makeRGBColors(index, height);

  if (!randomize) return makeRGBString(green, blue, red);

  return makeRGBString(...shuffleArray([red, green, blue]));
}
