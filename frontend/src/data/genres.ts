// Géneros principales para filtrar el catálogo. El campo de género (releaseInfo)
// es texto libre y desordenado (ej. "comedy, drama", "sci-fi", "romantic comedy"),
// así que cada género se define por palabras clave que buscamos como subcadena.
export interface Genero {
  label: string;
  keywords: string[];
}

export const GENEROS: Genero[] = [
  { label: 'Drama', keywords: ['drama'] },
  { label: 'Comedia', keywords: ['comedy', 'comedia'] },
  { label: 'Terror', keywords: ['horror', 'terror'] },
  { label: 'Acción', keywords: ['action'] },
  { label: 'Thriller', keywords: ['thriller'] },
  { label: 'Romance', keywords: ['romance', 'romantic'] },
  { label: 'Western', keywords: ['western'] },
  { label: 'Crimen', keywords: ['crime'] },
  { label: 'Aventura', keywords: ['adventure'] },
  { label: 'Musical', keywords: ['musical', 'music'] },
  { label: 'Ciencia ficción', keywords: ['science fiction', 'sci-fi', 'sci fi'] },
  { label: 'Cine negro', keywords: ['film noir', 'noir'] },
  { label: 'Misterio', keywords: ['mystery', 'suspense'] },
  { label: 'Guerra', keywords: ['war'] },
  { label: 'Animación', keywords: ['animation', 'animated', 'anime'] },
  { label: 'Fantasía', keywords: ['fantasy'] },
  { label: 'Documental', keywords: ['documentary'] },
];
