export function findClosing(chars: string[], start: number, pattern: string) {
  const text = chars.join("");
  const patLen = pattern.length;

  for (let i = start; i < chars.length; i++) {
    if (i + patLen > chars.length) break;
    if (text.slice(i, i + patLen) === pattern) return i;
  }

  return null;
}

export function findChar(chars: string[], start: number, target: string) {
  return chars.slice(start).findIndex((c) => c === target) + start;
}
