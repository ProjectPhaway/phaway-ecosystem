export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function skuPart(text: string): string {
  return slugify(text).replace(/-/g, '').toUpperCase().slice(0, 10) || 'X';
}
