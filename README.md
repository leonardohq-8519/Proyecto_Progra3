# PROYECTO PROGRAMACIÓN III


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
		sufijo = palabra.subcadena(i, n)            
        para cada caracter c en sufijo:
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
```

## Explicacion del funcionamiento

El programa se divide en dos fases: un pre-procesamiento que se ejecuta una sola vez y la plataforma interactiva que usa el usuario. 

Se lee el archivo wiki_movie_plots_deduped.csv y se genera un archivo intermedio movies.txt con los datos limpios. Se implementa un parser que respeta las comillas dobles del CSV, se descarta la columna de URL de Wikipedia por no aportar a la búsqueda, y se normaliza la sinopsis (minúsculas, sin puntuación, sin espacios duplicados). Los demás campos se conservan en su forma original para mostrarlos al usuario. El archivo de salida usa tabulador como separador, lo que simplifica la carga posterior. 

### Carga e indexación
Al iniciar la plataforma, cada película se almacena en un vector indexado por su id y simultáneamente se indexa en un Trie de sufijos. El Trie no guarda los datos completos, solo los id, lo que mantiene la estructura liviana.
Se eligió un Trie de sufijos porque el enunciado exige búsqueda por sub-palabra (ej. "bar" debe encontrar "barco"), cosa que un Trie clásico de prefijos no resuelve. Al insertar cada palabra se insertan también todos sus sufijos, de modo que cualquier sub-palabra aparece como prefijo de algún sufijo y se encuentra con un descenso estándar.

### Algoritmo de importancia
Cada campo de la película tiene un peso distinto al indexarse: título (10), director y género (6), cast (4), origen (2) y sinopsis (1). Al buscar, los scores se acumulan automáticamente en cada nodo del Trie, así que la búsqueda es O(m) sin recorrer subárboles. La frecuencia se incorpora naturalmente porque cada aparición suma. Para búsquedas de varias palabras, las películas que contienen todas las palabras de la frase reciben un bono ×2 sobre el score total.

### Algoritmo de recomendaciones
A partir de las películas con Like, se construye un perfil del usuario contando frecuencias de director y género. Cada película no likeada recibe un score por solapamiento (+5 por director coincidente, +2 por género). El director pesa más que el género porque es una señal más específica del gusto. Las 10 películas con mayor score se devuelven como recomendaciones.

### Búsqueda por tag
No requiere lógica especial: como el Trie indexa director, cast y género con pesos altos, escribir un nombre o un género en la búsqueda normal ya prioriza esos matches por encima de coincidencias casuales en la sinopsis.

### Persistencia
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
