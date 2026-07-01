#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <algorithm>
#include <fstream>
#include "preprocesamiento.h"
#include <chrono>
using namespace std;

vector<Pelicula> baseDatos;
vector<Pelicula> verMasTarde;
vector<Pelicula> likes;


class BuscadorReal {
public:
    vector<Pelicula> buscar(const string& query, const vector<Pelicula>& bd) {
        vector<Pelicula> resultados;
        string q = query;
        transform(q.begin(), q.end(), q.begin(), ::tolower);

        for (const auto& p : bd) {
            string titulo = p.titulo;
            transform(titulo.begin(), titulo.end(), titulo.begin(), ::tolower);
            bool enTitulo = titulo.find(q) != string::npos;

            bool enTag = false;
            for (const auto& t : p.tags) {
                string tag = t;
                transform(tag.begin(), tag.end(), tag.begin(), ::tolower);
                if (tag.find(q) != string::npos) { enTag = true; break; }
            }

            if (enTitulo || enTag)
                resultados.push_back(p);
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


BuscadorProxy    proxy;
HistorialBusquedas historial;
IUsuario*        usuarioActual = nullptr;


void cargarDatos() {
    cout << "Cargando datos...\n";

    process_movie_data("wiki_movie_plots_deduped.csv", "movies.txt");

    ifstream archivo("wiki_movie_plots_deduped.csv");
    if (!archivo.is_open()) {
        cout << "Error: no se pudo abrir el csv\n";
        return;
    }

    string linea;
    getline(archivo, linea);

    while (getline(archivo, linea)) {
        int quote_count = count(linea.begin(), linea.end(), '"');
        while (quote_count % 2 != 0) {
            string next_line;
            if (!getline(archivo, next_line)) break;
            linea += " " + next_line;
            quote_count += count(next_line.begin(), next_line.end(), '"');
        }
        vector<string> campos = parse_data(linea);
        if (campos.size() < 8) continue;

        Pelicula p;
        p.titulo   = campos[1];
        p.sinopsis = campos[7];
        if (!campos[2].empty()) p.tags.push_back(campos[2]); // Origen
        if (!campos[3].empty()) p.tags.push_back(campos[3]); // Director
        if (!campos[4].empty()) p.tags.push_back(campos[4]); // Cast
        if (!campos[5].empty()) p.tags.push_back(campos[5]); // Genero

        baseDatos.push_back(p);
    }
    archivo.close();

    cout << "Se cargaron " << baseDatos.size() << " peliculas.\n";
}

void guardarDatos() {
    cout << "Guardando datos...\n";
}

void mostrarPelicula(const Pelicula& p) {
    cout << "\n=== " << p.titulo << " ===\n";
    cout << p.sinopsis << "\n";
    cout << "Tags: ";
    for (const auto& t : p.tags) cout << t << "  ";
    cout << "\n";

    int op;
    cout << "\n1. Like\n2. Ver mas tarde\n3. Volver\nOpcion: ";
    cin >> op;

    if (op == 1) { likes.push_back(p);       cout << "Agregado a Likes!\n"; }
    if (op == 2) { verMasTarde.push_back(p); cout << "Agregado a Ver mas tarde!\n"; }
}

void mostrarResultados(const string& query, const vector<Pelicula>& resultados) {
    int pagina = 0;

    while (true) {
        cout << "\n--- Resultados para \"" << query << "\" ---\n";

        int mostrados = 0;
        for (int i = pagina; i < (int)resultados.size() && i < pagina + 5; i++) {
            cout << (i - pagina + 1) << ". " << resultados[i].titulo << "\n";
            mostrados++;
        }

        if (mostrados == 0) {
            cout << "No se encontraron peliculas.\n";
            return;
        }

        cout << "6. Siguientes 5\n0. Volver\nOpcion: ";
        int op;
        cin >> op;

        if (op == 0) break;
        else if (op == 6 && pagina + 5 < (int)resultados.size()) pagina += 5;
        else if (op >= 1 && op <= mostrados) mostrarPelicula(resultados[pagina + op - 1]);
    }
}

void buscarPeliculas() {
    auto catalogo = usuarioActual->getCatalogo(baseDatos);

    string query;
    cout << "\nIngrese busqueda (0 para cancelar): ";
    cin.ignore();
    getline(cin, query);
    if (query == "0") return;

    auto resultados = proxy.buscar(query, catalogo);

    historial.guardar(query, resultados);

    mostrarResultados(query, resultados);

    if (historial.puedeDeshacer()) {
        cout << "\n[MEMENTO] Desea volver a la busqueda anterior? (1=Si / 0=No): ";
        int op;
        cin >> op;
        if (op == 1) {
            auto previo = historial.deshacer();
            cout << "[MEMENTO] Restaurando busqueda: \"" << previo.query << "\"\n";
            mostrarResultados(previo.query, previo.resultados);
        }
    }
}

void verMasTardeMenu() {
    cout << "\n=== VER MAS TARDE ===\n";
    if (verMasTarde.empty()) {
        cout << "Tu lista esta vacia.\n";
        return;
    }
    for (int i = 0; i < (int)verMasTarde.size(); i++)
        cout << i + 1 << ". " << verMasTarde[i].titulo << "\n";

    cout << "0. Volver\nOpcion: ";
    int op;
    cin >> op;
    if (op > 0 && op <= (int)verMasTarde.size())
        mostrarPelicula(verMasTarde[op - 1]);
}

void verRecomendaciones() {
    cout << "\n=== RECOMENDACIONES ===\n";
    auto catalogo = usuarioActual->getCatalogo(baseDatos);
    for (const auto& p : catalogo)
        cout << "- " << p.titulo << "\n";
}

void verCatalogoAlfabetico() {
    auto catalogo = usuarioActual->getCatalogo(baseDatos);
    CatalogoIterator it(catalogo);

    cout << "\n=== CATALOGO COMPLETO (Orden Alfabetico) ===\n";
    cout << "Total: " << it.total() << " peliculas\n\n";

    while (it.hasNext()) {
        Pelicula p = it.next();
        cout << "[" << it.posicion() << "/" << it.total() << "] " << p.titulo << "\n";

        cout << "1=Ver detalles | 2=Siguiente | 0=Salir al menu\nOpcion: ";
        int op;
        cin >> op;

        if (op == 0) return;
        if (op == 1) mostrarPelicula(p);
        // TODO: modificar para que op == 2: el bucle continúa automáticamente y si es distinto, mandar un cout error y volver a preguntar
    }

    cout << "\nFin del catalogo.\n";
}

IUsuario* seleccionarTipoUsuario() {
    cout << "\n=== BIENVENIDO A LA PLATAFORMA DE STREAMING ===\n";
    cout << "Seleccione su tipo de cuenta:\n";
    cout << "1. Usuario Basico  (acceso a catalogo reducido - 20 peliculas)\n";
    cout << "2. Usuario Premium (acceso al catalogo completo)\n";
    cout << "Opcion: ";

    int op;
    cin >> op;

    if (op == 2) {
        cout << "[DECORATOR] Cuenta Premium activada - acceso completo al catalogo\n";
        return new UsuarioPremium(new UsuarioBase());
    }
    cout << "[DECORATOR] Cuenta Basica activada - catalogo reducido a 20 peliculas\n";
    return new UsuarioBasico(new UsuarioBase());
}

void menuPrincipal() {
    int op;

    do {
        cout << "\n==== PLATAFORMA STREAMING ====\n";
        cout << "Usuario: " << usuarioActual->getTipo() << "\n";
        cout << "1. Buscar pelicula\n";
        cout << "2. Ver 'Ver mas tarde'\n";
        cout << "3. Ver recomendaciones\n";
        cout << "4. Ver catalogo alfabetico\n";
        cout << "5. Salir\n";
        cout << "Opcion: ";
        cin >> op;

        switch (op) {
            case 1: buscarPeliculas();        break;
            case 2: verMasTardeMenu();        break;
            case 3: verRecomendaciones();     break;
            case 4: verCatalogoAlfabetico();  break;
            case 5: guardarDatos();           break;
            default: cout << "Opcion invalida\n";
        }

    } while (op != 5);
}

int main() {
    auto inicio = chrono::high_resolution_clock::now();
    cargarDatos();
    auto fin = chrono::high_resolution_clock::now();
    auto duracion = chrono::duration_cast<chrono::microseconds>(fin - inicio);
    cout << "Tiempo transcurrido: " << duracion.count() << " microsegundos\n";

    usuarioActual = seleccionarTipoUsuario();
    menuPrincipal();
    delete usuarioActual;
    return 0;
}

