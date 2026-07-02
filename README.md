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

## Pseudocódigo inicial de la inserción de datos

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

void insertarSufijosDePalabra(string palabra, string id_pelicula) {
    n = palabra.longitud
    para i desde 0 hasta n - 1:
        nodoActual = raiz
		para cada j desde i hasta n-1:
			c = palabra[ j ]
            indice = (int) c
            si nodoActual->hijos[indice] == nullptr:
                nodoActual->hijos[indice] = new TrieNode()
            nodoActual = nodoActual->hijos[indice]       
        nodoActual->id_peliculas.insertar(id_pelicula)
    }

void insertarTexto(string textoFuente) {
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
        linea = leerLineaCompleta()  
        trie.insertarTexto(linea)
    cerrar archivo
}

int main() {
    SuffixTrie buscarPelicula
    cargarDesdeTXT(buscarPelicula, "movies.txt")
    string busqueda = "bar"
    resultados = buscarPelicula.buscar(busqueda)  
    si resultados no está vacío:
        imprimir "Se encontraron las siguientes películas:"
        para cada id en resultados:
            imprimir "- " + peliculas[id].titulo
    sino:
        imprimir "No se encontraron coincidencias para: " + busqueda
    regresar 0
}
```
## Implementación de programación paralela

Para poder implementar programación paralela en nuestro proyecto, se creó primero una función genérica llamada **parallel_for**, la cual simplemente se utilizará cuando se necesiten hilos.

```
template <typename Func>
void parallel_for(size_t begin, size_t end, Func&& func) {
    size_t total = end - begin;
    if (total == 0) return;

    unsigned int num_threads = std::thread::hardware_concurrency();
    if (num_threads == 0) num_threads = 4; 
    num_threads = std::min<size_t>(num_threads, total);

    size_t chunk_size = total / num_threads;
    size_t remainder   = total % num_threads;

    std::vector<std::thread> threads;
    size_t start = begin;
    for (unsigned int t = 0; t < num_threads; ++t) {
        size_t extra = (t < remainder) ? 1 : 0;
        size_t stop = start + chunk_size + extra;
        threads.emplace_back([start, stop, &func]() {
            for (size_t i = start; i < stop; ++i) func(i);
        });
        start = stop;
    }
    for (auto& th : threads) th.join();
}
```

Los fragmentos de código en el que se implementó dicha función se encuentran en el Trie.cpp, al momento de realizar consultas y buscar palabras en Search y al cargar todos los datos del txt creado en LoadFromTXT.

```
parallel_for(0, n, [&](size_t i) {
        TrieNode* currentNode = root;
        for (char c : words[i]) {
            int index = (int) c;
            if (index >= 128) continue;
            if (currentNode->children[index] == nullptr) {
                found[i] = false;
                return;
            }
            currentNode = currentNode->children[index];
        }
        results[i] = fetchNodes(currentNode);
    });
```
> **Nota:** *Búsqueda de palabras en Search*


```
parallel_for(0, n, [&](size_t i) {
        stringstream ss(lines[i]);
        string part;
        vector<string> result;
        while (getline(ss, part, '$')) result.push_back(part);
        if (result.size() != 2) return;

        string cleanText = normalize(result[0]);
        int movie_id;
        try {
            movie_id = stoi(result[1]);
        } catch (...) {
            return;
        }

        vector<string> words;
        stringstream ss_words(cleanText);
        string word;
        while (getline(ss_words, word, ' ')) {
            if (word.length() >= 2) words.push_back(word);
        }

        parsedWords[i] = move(words);
        movieIds[i] = movie_id;
        valid[i] = true;
    });
```

> **Nota:** *Carga de palabras en LoadFromTXT*



## Implementación de patrones de diseño

Se consideró implementar patrones de diseño a la sección de la interfaz para optimizar el proceso.Los patrones que se agregaron, sus usos y los fragmentos en los que se encuentran son los siguientes:

- **Proxy**

Caché de búsquedas recurrentes para evitar repetir búsquedas y gastar recursos.

```
class BuscadorReal {
public:
    vector<Pelicula> buscar(const string& query, const vector<Pelicula>& bd) {
        vector<int> index_resultados = suffixTrie.search(query);
        unordered_set<int> index_no_rep(index_resultados.begin(), index_resultados.end());
        vector<Pelicula> resultados;

        for (int index : index_no_rep) {
            resultados.push_back(*(movies_titles[index]));
        }
        return resultados;
    }
};

class BuscadorProxy {
private:
    map<string, vector<Pelicula>> cache;
    BuscadorReal buscadorReal;
public:
    vector<Pelicula> buscar(const string& query, const vector<Pelicula>& bd) {
        if (cache.count(query)) {
            cout << "[PROXY] Resultado obtenido del cache (busqueda repetida)\n";
            return cache[query];
        }
        cout << "[PROXY] Buscando en base de datos...\n";
        auto resultado = buscadorReal.buscar(query, bd);
        cache[query] = resultado;
        return resultado;
    }
};
```

- **Decorator**

 Distinguir tipos de usuario en dos: Usuario Básico y Usuario Premium.

```
class IUsuario {
public:
    virtual vector<Pelicula> getCatalogo(const vector<Pelicula>& todas) = 0;
    virtual string getTipo() = 0;
    virtual ~IUsuario() = default;
};

class UsuarioBase : public IUsuario {
public:
    vector<Pelicula> getCatalogo(const vector<Pelicula>& todas) override {
        return todas;
    }
    string getTipo() override { return "Invitado"; }
};

class UsuarioDecorator : public IUsuario {
protected:
    IUsuario* usuario;
public:
    explicit UsuarioDecorator(IUsuario* u) : usuario(u) {}
    ~UsuarioDecorator() override { delete usuario; }
};

class UsuarioBasico : public UsuarioDecorator {
public:
    explicit UsuarioBasico(IUsuario* u) : UsuarioDecorator(u) {}
    vector<Pelicula> getCatalogo(const vector<Pelicula>& todas) override {
        auto cat = usuario->getCatalogo(todas);
        int limite = min((int)cat.size(), 20);
        return vector<Pelicula>(cat.begin(), cat.begin() + limite);
    }
    string getTipo() override { return "Basico (catalogo reducido - 20 peliculas)"; }
};

class UsuarioPremium : public UsuarioDecorator {
public:
    explicit UsuarioPremium(IUsuario* u) : UsuarioDecorator(u) {}
    vector<Pelicula> getCatalogo(const vector<Pelicula>& todas) override {
        return usuario->getCatalogo(todas);
    }
    string getTipo() override { return "Premium (catalogo completo)"; }
};
```

- **Iterator**

Recorrido del catálogo de películas en orden alfabético.

```
class CatalogoIterator {
private:
    vector<Pelicula> peliculasOrdenadas;
    size_t indice;
public:
    explicit CatalogoIterator(const vector<Pelicula>& catalogo) : indice(0) {
        peliculasOrdenadas = catalogo;
        sort(peliculasOrdenadas.begin(), peliculasOrdenadas.end(),
             [](const Pelicula& a, const Pelicula& b) {
                 return a.titulo < b.titulo;
             });
    }
    bool hasNext() const { return indice < peliculasOrdenadas.size(); }
    Pelicula next()      { return peliculasOrdenadas[indice++]; }
    void reset()         { indice = 0; }
    size_t posicion()    const { return indice; }
    size_t total()       const { return peliculasOrdenadas.size(); }
};
```

- **Memento**

Capturar búsquedas y guardarlas en un historial que se puede volver a visitar.

```
struct BusquedaMemento {
    string query;
    vector<Pelicula> resultados;
};

class HistorialBusquedas {
private:
    vector<BusquedaMemento> historial;
public:
    void guardar(const string& query, const vector<Pelicula>& resultados) {
        historial.push_back({query, resultados});
        cout << "[MEMENTO] Estado de busqueda guardado: \"" << query << "\"\n";
    }
    bool puedeDeshacer() const { return historial.size() > 1; }
    BusquedaMemento deshacer() {
        historial.pop_back();
        return historial.back();
    }
    bool vacio() const { return historial.empty(); }
};
```

## Código de implementación del árbol

```
#include <iostream>
#include <sstream>
#include <fstream>
#include <vector>
#include "trie.h"

#include <algorithm>
#include <set>
#include <thread>
#include <unordered_set>

using namespace std;

template <typename Func>
void parallel_for(size_t begin, size_t end, Func&& func) {
    size_t total = end - begin;
    if (total == 0) return;

    unsigned int num_threads = std::thread::hardware_concurrency();
    if (num_threads == 0) num_threads = 4; // fallback si no se puede detectar
    num_threads = std::min<size_t>(num_threads, total);

    size_t chunk_size = total / num_threads;
    size_t remainder   = total % num_threads;

    std::vector<std::thread> threads;
    size_t start = begin;
    for (unsigned int t = 0; t < num_threads; ++t) {
        size_t extra = (t < remainder) ? 1 : 0;
        size_t stop = start + chunk_size + extra;
        threads.emplace_back([start, stop, &func]() {
            for (size_t i = start; i < stop; ++i) func(i);
        });
        start = stop;
    }
    for (auto& th : threads) th.join();
}

void SuffixTrie::destructor(TrieNode *node) {
    if (node == nullptr) return;
    for (int i = 0; i < 128; i++) {
        destructor(node->children[i]);
    }
    delete node;
}

SuffixTrie::SuffixTrie() {
    root = new TrieNode();
}

SuffixTrie::~SuffixTrie() {
    destructor(root);
}

string SuffixTrie::normalize(string text) {
    string result = "";
    for (char c : text) {
        if (isalnum(c)) {
            result += tolower(c);
        }
        else if (isspace(c)) {
            result += " ";
        }
    }
    return result;
}

void SuffixTrie::insertWordSuffixes(string word, int movie_id) {
    int n = word.length();
    for (int i = 0; i < n; i++) {
        TrieNode* node = root;
        for (int j = i; j < n; j++) {
            char c = word[j];
            int index = (int) c;
            if (node->children[index] == nullptr) {
                node->children[index] = new TrieNode();
            }
            node = node->children[index];
        }
        node->movies_id.push_back(movie_id);
    }
}

void SuffixTrie::insertText(string text) {
    stringstream ss(text);
    string part;
    vector<string> result;
    while (getline(ss, part, '$')) {
        result.push_back(part);
    }
    if (result.size() != 2) return;
    string cleanText = normalize(result[0]);
    int movie_id = stoi(result[1]);
    stringstream ss_words(cleanText);
    string word;
    while (getline(ss_words, word, ' ')) {
        if (word.length() < 2) continue;
        insertWordSuffixes(word, movie_id);
    }
}

vector<int> SuffixTrie::search(string query) {
    string normalized = normalize(query);
    stringstream ss(normalized);
    string word;
    vector<string> words;
    while (getline(ss, word, ' ')) {
        if (!word.empty()) words.push_back(word);
    }
    if (words.empty()) return vector<int>();

    size_t n = words.size();
    vector<vector<int>> results(n);
    vector<bool> found(n, true);

    parallel_for(0, n, [&](size_t i) {
        TrieNode* currentNode = root;
        for (char c : words[i]) {
            int index = (int) c;
            if (index >= 128) continue;
            if (currentNode->children[index] == nullptr) {
                found[i] = false;
                return;
            }
            currentNode = currentNode->children[index];
        }
        results[i] = fetchNodes(currentNode);
    });

    for (bool f : found) {
        if (!f) return vector<int>();
    }

    vector<int> finalResult = results[0];
    for (size_t i = 1; i < n; i++) {
        unordered_set<int> lookup(finalResult.begin(), finalResult.end());
        vector<int> intersection;

        for (int num : results[i]) {
            if (lookup.erase(num)) intersection.push_back(num);
        }
        finalResult = intersection;
    }

    return vector<int>(finalResult.begin(), finalResult.end());
}

vector<int> SuffixTrie::fetchNodes(TrieNode* node) {
    vector<int> result;
    result = vector<int>(node->movies_id);
    for (TrieNode* children : node->children) {
        if (children != nullptr) {
            vector<int> childResults = fetchNodes(children);
            result.insert(result.end(), childResults.begin(), childResults.end());
        }
    }
    return result;
}

bool SuffixTrie::loadfromTXT(string fileName) {
    ifstream inputFile(fileName);
    if (!inputFile.is_open()) return false;

    vector<string> lines;
    string line;
    while (getline(inputFile, line)) {
        lines.push_back(move(line));
    }
    inputFile.close();

    size_t n = lines.size();
    vector<vector<string>> parsedWords(n);
    vector<int> movieIds(n, -1);
    vector<bool> valid(n, false);


    parallel_for(0, n, [&](size_t i) {
        stringstream ss(lines[i]);
        string part;
        vector<string> result;
        while (getline(ss, part, '$')) result.push_back(part);
        if (result.size() != 2) return;

        string cleanText = normalize(result[0]);
        int movie_id;
        try {
            movie_id = stoi(result[1]);
        } catch (...) {
            return;
        }

        vector<string> words;
        stringstream ss_words(cleanText);
        string word;
        while (getline(ss_words, word, ' ')) {
            if (word.length() >= 2) words.push_back(word);
        }

        parsedWords[i] = move(words);
        movieIds[i] = movie_id;
        valid[i] = true;
    });

    for (size_t i = 0; i < n; i++) {
        if (!valid[i]) continue;
        for (const string& w : parsedWords[i]) {
            insertWordSuffixes(w, movieIds[i]);
        }
    }

    return true;
}
```

## Explicación del funcionamiento
El programa se divide en dos fases: un pre-procesamiento que se ejecuta una sola vez y la plataforma interactiva que usa el usuario.
En la fase de pre-procesamiento se lee el archivo wiki_movie_plots_deduped.csv mediante la función process_movie_data y se genera un archivo intermedio movies.txt con los datos limpios. El parser (parse_data) respeta las comillas dobles del CSV para que las comas internas no rompan las filas, se descarta la columna de URL de Wikipedia por no aportar a la búsqueda, y los campos relevantes se concatenan y normalizan con concat() junto con transform(), unique() y erase() (minúsculas, sin puntuación, sin espacios duplicados). Al final de cada línea se agrega un id incremental que identifica de forma única a cada película, separado del texto por el carácter $, formato que luego consume directamente la función insertarTexto del Trie.

### Carga e indexación
Al iniciar la plataforma, cada película se almacena en un vector indexado por su id y simultáneamente su texto normalizado se inserta en un Trie de sufijos. El Trie no guarda los datos completos de la película, solo los id en el conjunto id_peliculas de cada nodo, lo que mantiene la estructura liviana.

Se eligió un Trie de sufijos porque el enunciado exige búsqueda por sub-palabra (ej. "bar" debe encontrar "barco"), cosa que un Trie clásico de prefijos no resuelve. Al insertar cada palabra se insertan también todos sus sufijos (insertarSufijosDePalabra), de modo que cualquier sub-palabra aparece como prefijo de algún sufijo y se encuentra con un descenso estándar en O(m) sobre la longitud de la consulta. Se descartan las palabras de longitud menor a 2 para no saturar el Trie con tokens irrelevantes.

### Búsqueda
La función buscar normaliza la consulta y desciende por el Trie carácter a carácter. Si en algún punto no existe el hijo correspondiente, retorna un conjunto vacío. Si llega al final de la consulta, se invoca recolectarNodos sobre el nodo alcanzado, que recorre recursivamente todo el subárbol y une los id_peliculas de cada nodo descendiente. Esto devuelve todas las películas cuyo texto contiene la sub-palabra buscada.

### Algoritmo de recomendaciones
A partir de las películas con Like, se construye un perfil del usuario contando frecuencias de director y género. Cada película no likeada recibe un score por solapamiento (+5 por director coincidente, +2 por género). El director pesa más que el género porque es una señal más específica del gusto. Las películas con mayor score se devuelven como recomendaciones.

### Búsqueda por tag
No requiere lógica especial: como el texto indexado incluye director, cast y género además de la sinopsis, escribir un nombre o un género en la búsqueda normal recupera las películas correspondientes a través del mismo recorrido del Trie de sufijos.

### Persistencia
Los id de likes y ver-más-tarde se guardan en archivos de texto plano al salir y se recargan al iniciar. La pantalla de bienvenida muestra la lista de "Ver más tarde" y una vista previa de recomendaciones basadas en los likes históricos.



## Fuentes bibliográficas:


Cormen, T., Leiserson, C., Rivest, R., Stein, C.(2009) Introduction to Algorithms. Massachusetts Institute of Technology. https://www.cs.mcgill.ca/~akroit/math/compsci/Cormen%20Introduction%20to%20Algorithms.pdf

El catálogo de ejemplos en C++ (2026) Refactoring Guru. https://refactoring.guru/es/design-patterns/cpp




