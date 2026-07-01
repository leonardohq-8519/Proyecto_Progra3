//
// Created by leona on 8/05/2026.
//

#include <iostream>
#include <vector>
#include <string>
#include <unordered_set>

#include "preprocesamiento.h"
#include "trie.h"

using namespace std;

// ===== BASE DE DATOS =====
vector<Pelicula> baseDatos;
vector<Pelicula> verMasTarde;
vector<Pelicula> likes;
unordered_map<int,Pelicula*> movies_titles;
SuffixTrie suffixTrie;

// ===== FUNCIONES =====
void cargarDatos() {
    cout << "Cargando datos...\n";
    // TODO: leer CSV y llenar baseDatos
    // Se tendrá otro archivo con la estructura de datos (Trie)
    movies_titles = process_movie_data("wiki_movie_plots_deduped.csv","movies.txt");
    if (!movies_titles.empty()) {
        cout << "Los datos se preprocesaron correctamente!" << std::endl;
    } else {
        cout << "Hubo un error al preprocesar los datos." << std::endl;
    }

    if (suffixTrie.loadfromTXT("movies.txt")) {
        cout << "Datos cargados al Trie correctamente" << std::endl;
    } else {
        cout << "Hubo un error al cargar los datos." << std::endl;
    }
}

void guardarDatos() {
    cout << "Guardando datos...\n";
    // TODO: guardar likes y verMasTarde
}

void mostrarPelicula(Pelicula p) {
    cout << "\n=== " << p.titulo << " ===\n";
    cout << p.sinopsis << "\n";

    int op;
    cout << "\n1. Like\n2. Ver más tarde\n3. Volver\nOpcion: ";
    cin >> op;

    if (op == 1) likes.push_back(p);
    if (op == 2) verMasTarde.push_back(p);
}

void buscarPeliculas() {
    string query;
    cout << "\nIngrese busqueda: ";
    cin.ignore();
    getline(cin, query);

    // TODO: usar árbol para buscar
    vector<int> index_resultados = suffixTrie.search(query);
    unordered_set<int> index_no_rep(index_resultados.begin(), index_resultados.end());
    vector<Pelicula> resultados;

    // mock
    for (int index : index_no_rep) {
        resultados.push_back(*(movies_titles[index]));
    }

    int pagina = 0;

    while (true) {
        cout << "\nResultados:\n";

        for (int i = 0; i < 5 && i + pagina < resultados.size(); i++) {
            cout << i + 1 << ". " << resultados[i + pagina].titulo << "\n";
        }

        cout << "6. Siguientes 5\n0. Volver\nOpcion: ";

        int op;
        cin >> op;

        if (op == 0) break;
        else if (op == 6) pagina += 5;
        else if (op >= 1 && op <= 5) {
            mostrarPelicula(resultados[pagina + op - 1]);
        }
    }
}

void verMasTardeMenu() {
    cout << "\n=== VER MÁS TARDE ===\n";

    for (int i = 0; i < verMasTarde.size(); i++) {
        cout << i + 1 << ". " << verMasTarde[i].titulo << "\n";
    }

    cout << "0. Volver\nOpcion: ";
    int op;
    cin >> op;

    if (op > 0 && op <= verMasTarde.size()) {
        mostrarPelicula(verMasTarde[op - 1]);
    }
}

void verRecomendaciones() {
    cout << "\n=== RECOMENDACIONES ===\n";

    // todo el algoritmo real
    for (auto &p : baseDatos) {
        cout << "- " << p.titulo << "\n";
    }
}

void menuPrincipal() {
    char op;

    do {
        cout << "\n==== PLATAFORMA STREAMING ====\n";
        cout << "1. Buscar pelicula\n";
        cout << "2. Ver 'Ver mas tarde'\n";
        cout << "3. Ver recomendaciones\n";
        cout << "4. Salir\n";
        cout << "Opcion: ";
        cin >> op;

        switch (op) {
            case '1': buscarPeliculas(); break;
            case '2': verMasTardeMenu(); break;
            case '3': verRecomendaciones(); break;
            case '4': guardarDatos(); break;
            default: cout << "Opcion invalida\n";
        }

    } while (op != '4');
}

int main() {
    cargarDatos();
    cout<<"\nAVISO: Actualmente esto es una simulacion ya que no se cuenta con el Trie implementado\n";
    menuPrincipal();
    return 0;
}

