export interface PageSize {
  id: string;
  label: string;
  widthCm: number;
  heightCm: number;
}

export const PAGE_SIZES: PageSize[] = [
  { id: 'carta', label: 'Carta (21.6 x 27.9 cm)', widthCm: 21.59, heightCm: 27.94 },
  { id: 'a4', label: 'A4 (21 x 29.7 cm)', widthCm: 21, heightCm: 29.7 },
];
