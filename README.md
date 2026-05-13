# PROYECTO PROGRAMACIÓN III PARTE 1


## Integrantes

Adrian Piero Gavino Navarrete

Joseph Paulo Geraldo Soto 

Rafaella Ariana Cano Ramos

Emily Alessandra Chacón Ttito

Leonardo Julian Huanay Quiroz


## Preprocesamiento de datos

Se decidió crear un .txt intermedio donde se almacenarían la data limpia para facilitar la lectura y reducir el tiempo consumido cuando se pase al Trie. En la funcion process_movie_data, el archivo es procesado linea por linea mediante el uso de getline() para evitar tener que almacenar el .csv en un buffer mientras se va operando. Se descarta la fila de los encabezados y se procede a almacenar la data de cada fila siguiente en un vector de strings para posteriormente ser normalizada. 

Mediante parse_data se asegura de que las comas solamente separen los strings cuando no se encuentran entre comillas. La data posteriormente es concatenada en un único string, limpiada de signos de puntuación y espacios duplicados usando la funcion definida concat() junto con transform(), unique() y erase().
Finalmente se agrega un id que va aumentando conforme se pasa cada fila del csv, esto servirá para identificar cada película con mayor facilidad.

## Pseudocódigo de la inserción de datos

```
struct TrieNode {
    TrieNode* hijos[128]
    Set<int> id_peliculas 
}

clase SuffixTrie {
privado:
TrieNode* raiz
void destruir(TrieNode* nodo) {
    si nodo == nullptr: regresar
    para cada i en [0 hasta 127]:
        destruir(nodo->hijos[i])
    delete nodo
}
publico:
Constructor() {
raiz = new TrieNode()
}
Destructor() {
destruir(raiz)
}

string normalizar(string texto) {
    resultado = ""
    para cada caracter c en texto:
        si c es letra o numero:
            resultado += tolower(c)
        sino si c es espacio:
            resultado += ' '
    return resultado
}

void insertarSufijosDePalabra(string palabra, string titulo) {
    n = palabra.longitud
    para i desde 0 hasta n - 1:
        nodoActual = raiz
		para cada j desde i hasta n-1:
			c = palabra[ j ]
            indice = (int) c
            si nodoActual->hijos[indice] == nullptr:
                nodoActual->hijos[indice] = new TrieNode()
            nodoActual = nodoActual->hijos[indice]       
        nodoActual->id_peliculas.insertar(id)
    }

void insertarTexto(string textoFuente, string tituloPrincipal) {
	partes = dividir linea por '$'
	si partes.longitud != 2: regresar
	
    textoLimpio = normalizar(partes[0])
	id_pelicula = int(partes[1])
	
    palabras = dividir textoLimpio por ' '
    para cada palabra en palabras:
        si palabra.longitud < 2: continuar
        insertarSufijosDePalabra(palabra, id_pelicula)
    }

Set<int> buscar(string consulta) {
    consulta = normalizar(consulta)
    nodoActual = raiz
    para cada caracter c en consulta:
        indice = (int) c
        si nodoActual->hijos[indice] == nullptr:
            return SetVacio()
        nodoActual = nodoActual->hijos[indice]
    return recolectarNodos(nodoActual)
    }
Set<int> recolectarNodos(TrieNode* nodo){
    resultado = Set(nodo->id_peliculas)
    para cada hijo en nodo->hijos:
        si hijo != nullptr:
            resultado = resultado.merge(recolectarNodos(hijo))
    return resultado	
    }
}

void cargarDesdeTXT(SuffixTrie& trie, string nombreArchivo) {
    archivo = abrir(nombreArchivo)
    si archivo no abre: regresar error
    mientras haya líneas en archivo:
        linea = leerLineaCompleta()   // formato: "texto_concatenado$id"
        trie.insertarTexto(linea)
    cerrar archivo
}

int main() {
    SuffixTrie buscarPelicula
    cargarDesdeTXT(buscarPelicula, "movies.txt")
    string busqueda = "bar"
    resultados = buscarPelicula.buscar(busqueda)   // Set<int> de ids
    si resultados no está vacío:
        imprimir "Se encontraron las siguientes películas:"
        para cada id en resultados:
            imprimir "- " + peliculas[id].titulo
    sino:
        imprimir "No se encontraron coincidencias para: " + busqueda
    regresar 0
}
```

## Explicacion del funcionamiento
El programa se divide en dos fases: un pre-procesamiento que se ejecuta una sola vez y la plataforma interactiva que usa el usuario.
En la fase de pre-procesamiento se lee el archivo wiki_movie_plots_deduped.csv mediante la función process_movie_data y se genera un archivo intermedio movies.txt con los datos limpios. El parser (parse_data) respeta las comillas dobles del CSV para que las comas internas no rompan las filas, se descarta la columna de URL de Wikipedia por no aportar a la búsqueda, y los campos relevantes se concatenan y normalizan con concat() junto con transform(), unique() y erase() (minúsculas, sin puntuación, sin espacios duplicados). Al final de cada línea se agrega un id incremental que identifica de forma única a cada película, separado del texto por el carácter $, formato que luego consume directamente la función insertarTexto del Trie.

## Carga e indexación
Al iniciar la plataforma, cada película se almacena en un vector indexado por su id y simultáneamente su texto normalizado se inserta en un Trie de sufijos. El Trie no guarda los datos completos de la película, solo los id en el conjunto id_peliculas de cada nodo, lo que mantiene la estructura liviana.

Se eligió un Trie de sufijos porque el enunciado exige búsqueda por sub-palabra (ej. "bar" debe encontrar "barco"), cosa que un Trie clásico de prefijos no resuelve. Al insertar cada palabra se insertan también todos sus sufijos (insertarSufijosDePalabra), de modo que cualquier sub-palabra aparece como prefijo de algún sufijo y se encuentra con un descenso estándar en O(m) sobre la longitud de la consulta. Se descartan las palabras de longitud menor a 2 para no saturar el Trie con tokens irrelevantes.

## Búsqueda
La función buscar normaliza la consulta y desciende por el Trie carácter a carácter. Si en algún punto no existe el hijo correspondiente, retorna un conjunto vacío. Si llega al final de la consulta, se invoca recolectarNodos sobre el nodo alcanzado, que recorre recursivamente todo el subárbol y une los id_peliculas de cada nodo descendiente. Esto devuelve todas las películas cuyo texto contiene la sub-palabra buscada.

## Algoritmo de recomendaciones
A partir de las películas con Like, se construye un perfil del usuario contando frecuencias de director y género. Cada película no likeada recibe un score por solapamiento (+5 por director coincidente, +2 por género). El director pesa más que el género porque es una señal más específica del gusto. Las películas con mayor score se devuelven como recomendaciones.

## Búsqueda por tag
No requiere lógica especial: como el texto indexado incluye director, cast y género además de la sinopsis, escribir un nombre o un género en la búsqueda normal recupera las películas correspondientes a través del mismo recorrido del Trie de sufijos.

## Persistencia
Los id de likes y ver-más-tarde se guardan en archivos de texto plano al salir y se recargan al iniciar. La pantalla de bienvenida muestra la lista de "Ver más tarde" y una vista previa de recomendaciones basadas en los likes históricos.

## Interfaz
Por el momento se estará controlando el funcionamiento de la aplicación mediante la terminal (cmd) usando el código en el archivo interfaz.cpp
Sin embargo se planea que para la entrega final la aplicación tenga una apariencia similar a este mockup hecho en Figma:
<img width="1280" height="720" alt="Frame 1" src="https://github.com/user-attachments/assets/97e0775b-c455-40b2-9e14-5aced69f6031" />

### Visualización actual en terminal:
```
Pantalla principal:

==== PLATAFORMA STREAMING ====

1. Buscar película
2. Ver "Ver más tarde"
3. Ver recomendaciones
4. Salir

Seleccione opción: 

Opción 1:

Ingrese palabra/frase/tag:
> barco 

Output:


1. Piratas del Caribe
2. Barco Fantasma
3. ...
4. ...
5. ...

6. Siguientes 5
0. Volver 

Si elige una película (ejemplo: la 1):

=== Piratas del Caribe ===
[Sinopsis aquí]

1. Like 
2. Ver más tarde 
3. Volver 

Si elige 6. Siguientes:

1. Pelicula 6
2. Pelicula 7
3. ...
4. ...
5. ...

6. Siguientes 5
0. Volver 

Opción 2: VER “VER MÁS TARDE”

=== VER MÁS TARDE ===

1. Película A
2. Película B
...

Seleccione una película o 0 para volver: 
→ Si selecciona:
Mostrar sinopsis
Opciones (igual que antes)

Opción 3: RECOMENDACIONES

=== RECOMENDACIONES ===

Basado en tus Likes:

1. Película similar A
2. Película similar B
... 

Opción 4: SALIR

Guardar datos (likes, ver más tarde)
Terminar programa
```
