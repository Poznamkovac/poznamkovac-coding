export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  const saturation = 65 + (Math.abs(hash) % 20);
  const lightness = 50 + (Math.abs(hash >> 8) % 15);
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function isNumeric(value: string): boolean {
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
}

export function parseUrlPath(path: string): { segments: string[]; isChallenge: boolean } {
  const segments = path.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const isChallenge = lastSegment ? isNumeric(lastSegment) : false;
  
  return { segments, isChallenge };
}
