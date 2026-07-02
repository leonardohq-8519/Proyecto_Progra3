# Frontend — Plataforma Streaming

React + TypeScript + Vite. Mientras el backend en C++ no exponga una API HTTP, cada
página funciona con una muestra del catálogo real (`public/movies.json`, generado
desde `wiki_movie_plots_deduped.csv`) para poder desarrollar la UI con datos reales
de forma independiente.

## Desarrollo

```bash
npm install
npm run build:catalog   # genera public/movies.json a partir de ../wiki_movie_plots_deduped.csv
npm run dev
```

`build:catalog` corre [scripts/build-movies-catalog.mjs](scripts/build-movies-catalog.mjs),
que lee el CSV de la raíz del repo (no está versionado por su tamaño, ver `.gitignore`)
y genera:
- `public/movies.json`: `[title, year, genre, director, wikiSlug]` por fila, usando el
  mismo id (índice de fila) que el Trie de sufijos en `preprocesamiento.cpp`.
- `public/plots/shard-<n>.json`: la sinopsis (columna Plot del CSV) repartida en shards
  de 1000 películas (`id -> texto`), pedidos bajo demanda al abrir el modal de una
  película ([src/data/catalog.ts](src/data/catalog.ts) `getSynopsis`) — el texto completo
  pesa ~75MB y no tiene sentido cargarlo todo de una.

Hay que volver a correr `build:catalog` si el CSV cambia; nada de esto se versiona.

## Login (demo, sin backend de autenticación)

No hay backend de autenticación todavía, así que el login usa credenciales fijas para
demostrar el patrón Decorator (cuenta Básica = catálogo limitado a 20, Premium = completo):

| Usuario   | Contraseña   | Tipo    |
|-----------|--------------|---------|
| `basico`  | `basico123`  | Básico  |
| `premium` | `premium123` | Premium |

Una cuenta Básica logueada ve un botón "Obtener Premium" que sube de plan al instante
(sin pago real, es solo demo). La sesión se guarda en `localStorage`.

Variables de entorno (ver `.env.example`):

```
VITE_API_BASE_URL=http://localhost:8080/api
```

## Páginas

- `/` — Home: filas "Ver más tarde" y "Te recomendamos".
- `/buscar` — Buscador por título/director/género/tag.
- `/favoritos` — Películas con Like.

## Contrato de API esperado por el backend

Toda la lógica de red vive en [src/services/api.ts](src/services/api.ts). El frontend
intenta pegarle a estos endpoints y, si fallan (porque el backend no existe todavía o
no responde), cae automáticamente a los datos mock — no rompe la UI.

Base URL: `VITE_API_BASE_URL` (por defecto `http://localhost:8080/api`).

| Método | Endpoint                       | Uso                              | Respuesta                  |
|--------|---------------------------------|-----------------------------------|-----------------------------|
| GET    | `/watch-later`                  | Lista "Ver más tarde"            | `Movie[]`                  |
| GET    | `/recommendations`              | Recomendaciones basadas en likes | `Movie[]`                  |
| GET    | `/likes`                        | Películas con like (favoritos)   | `Movie[]`                  |
| GET    | `/search?q=<texto>`             | Búsqueda por sub-palabra/tag     | `Movie[]`                  |
| POST   | `/movies/:id/like`               | Marca una película como Like     | `204` / sin body            |
| POST   | `/movies/:id/watch-later`        | Agrega a "Ver más tarde"         | `204` / sin body            |

Forma de `Movie` (ver [src/types.ts](src/types.ts)):

```ts
interface Movie {
  id: number;          // mismo id usado en el Trie / vector de películas
  title: string;
  posterSeed: string;  // string arbitrario y estable (ej. slug del título); se usa
                        // para generar un poster placeholder mientras no haya imágenes reales
  badge?: string;       // ej. fecha de estreno, opcional
  releaseInfo?: string; // ej. "Netflix", opcional
}
```

Todos los endpoints GET deben responder `Content-Type: application/json` con un
array (posiblemente vacío) de `Movie`. CORS debe estar habilitado para el origen del
dev server (`http://localhost:5183` u otro puerto de Vite).
