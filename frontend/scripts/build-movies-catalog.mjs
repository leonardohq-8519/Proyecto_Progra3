// Parsea wiki_movie_plots_deduped.csv (raíz del repo) y genera public/movies.json
// con el mismo id (índice de fila, 0-based) que usa el Trie en preprocesamiento.cpp.
// Formato compacto: cada película es una tupla [title, year, genre, director, wikiSlug]
// para mantener el JSON liviano; el resto de campos (posterSeed, etc.) se derivan
// en el frontend a partir de esta tupla. wikiSlug (ej. "Kansas_Saloon_Smashers") se usa
// para pedirle el poster a la API pública de Wikipedia (page/summary) en runtime.
//
// El campo Plot (sinopsis) es demasiado pesado para meterlo en movies.json (~75MB en
// total), así que se reparte en shards de public/plots/shard-<n>.json (id -> texto),
// que el frontend pide de a uno bajo demanda (ver src/data/catalog.ts getSynopsis).
import { createReadStream, writeFileSync, mkdirSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(__dirname, '../../wiki_movie_plots_deduped.csv');
const outPath = path.resolve(__dirname, '../public/movies.json');
const plotsDir = path.resolve(__dirname, '../public/plots');
const SHARD_SIZE = 1000;

function parseCsvRow(row) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (const c of row) {
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else current += c;
  }
  fields.push(current);
  return fields;
}

function cleanValue(value) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'unknown') return null;
  return trimmed;
}

function extractWikiSlug(wikiPageUrl) {
  const trimmed = wikiPageUrl?.trim();
  if (!trimmed) return null;
  const marker = '/wiki/';
  const index = trimmed.indexOf(marker);
  if (index === -1) return null;
  return trimmed.slice(index + marker.length) || null;
}

async function main() {
  const rl = createInterface({ input: createReadStream(csvPath, 'utf8'), crlfDelay: Infinity });

  const movies = [];
  let shard = {};
  let isFirstLine = true;
  let buffer = '';

  mkdirSync(plotsDir, { recursive: true });

  const flushShard = (shardIndex) => {
    if (Object.keys(shard).length > 0) {
      writeFileSync(path.join(plotsDir, `shard-${shardIndex}.json`), JSON.stringify(shard));
    }
    shard = {};
  };

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    buffer = buffer ? `${buffer} ${line}` : line;
    const quoteCount = (buffer.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) continue; // campo entre comillas partido en varias líneas

    const fields = parseCsvRow(buffer);
    buffer = '';

    const id = movies.length;

    // Release Year(0), Title(1), Origin(2), Director(3), Cast(4), Genre(5), Wiki Page(6), Plot(7)
    const title = cleanValue(fields[1]);
    if (title) {
      movies.push([
        title,
        cleanValue(fields[0]),
        cleanValue(fields[5]),
        cleanValue(fields[3]),
        extractWikiSlug(fields[6]),
      ]);
      const plot = cleanValue(fields[7]);
      if (plot) shard[id] = plot;
    } else {
      movies.push(null); // conserva el índice para que id siga coincidiendo con el Trie
    }

    if ((id + 1) % SHARD_SIZE === 0) flushShard(Math.floor(id / SHARD_SIZE));
  }
  flushShard(Math.floor((movies.length - 1) / SHARD_SIZE));

  writeFileSync(outPath, JSON.stringify(movies));
  console.log(`Catálogo generado: ${movies.length} filas -> ${outPath}`);
  console.log(`Sinopsis generadas en ${plotsDir} (shards de ${SHARD_SIZE})`);
}

main();
