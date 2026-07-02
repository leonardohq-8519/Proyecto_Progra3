#include <algorithm>
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <thread>
#include "preprocesamiento.h"

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

unordered_map<int,Pelicula*> process_movie_data(const string& input_filename, const string& output_filename) {
    unordered_map<int,Pelicula*> movies_titles;

    /*
     * El archivo de input_filename se llama "wiki_movie_plots_deduped.csv"
     * El archivo de output_filename se llama "movies.txt"
     * Ambos nombres son puestos en la interfaz, pero se hace la aclaración como comentario
     */

    ifstream inputFile(input_filename);
    ofstream outputFile(output_filename);
    if (!inputFile.is_open()) {
        cout << "Error opening file" << endl;
        return movies_titles;
    }

    string headers;
    getline(inputFile, headers);
    cout << headers << endl;

    // --- Fase 1: lectura secuencial (obligatoria por las comillas multilínea) ---
    vector<string> raw_lines;
    string line;
    while (getline(inputFile, line)) {
        int quote_count = count(line.begin(), line.end(), '"');
        while (quote_count % 2 != 0) {
            string next_line;
            if (!getline(inputFile, next_line)) break;
            line += " " + next_line;
            quote_count += count(next_line.begin(), next_line.end(), '"');
        }
        raw_lines.push_back(move(line));
    }
    inputFile.close();

    size_t n = raw_lines.size();
    vector<Pelicula*> peliculas(n, nullptr);
    vector<string> final_texts(n);

    // --- Fase 2: procesamiento en paralelo (cada hilo escribe en su propio índice, sin choques) ---
    parallel_for(0, n, [&](size_t i) {
        vector<string> raw_data = parse_data(raw_lines[i]);

        Pelicula* p = new Pelicula();
        p->titulo = raw_data[1];
        p->sinopsis = raw_data[7];
        p->tags.push_back(!raw_data[2].empty() ? raw_data[2] : "NULL"); // Origen
        p->tags.push_back(!raw_data[3].empty() ? raw_data[3] : "NULL"); // Director
        p->tags.push_back(!raw_data[4].empty() ? raw_data[4] : "NULL"); // Cast
        p->tags.push_back(!raw_data[5].empty() ? raw_data[5] : "NULL");
        peliculas[i] = p;

        string raw_text = concat(raw_data, " ");
        transform(raw_text.begin(), raw_text.end(), raw_text.begin(), [](unsigned char c) {
            if (ispunct(c)) return (int)' ';
            return tolower(c);
        });
        auto new_end = unique(raw_text.begin(), raw_text.end(), [](char a, char b) {
            return a == ' ' && b == ' ';
        });
        raw_text.erase(new_end, raw_text.end());
        if (!raw_text.empty() && raw_text.back() == ' ') {
            raw_text.pop_back();
        }

        final_texts[i] = raw_text + '$' + to_string(i) + "\n";
    });

    // --- Fase 3: escritura secuencial (mantiene el orden y evita condiciones de carrera en I/O) ---
    for (size_t i = 0; i < n; ++i) {
        outputFile << final_texts[i];
        movies_titles[static_cast<int>(i)] = peliculas[i];
    }
    outputFile.close();

    return movies_titles;
}

vector<string> parse_data(const string& line) {
    vector<string> data;
    string current_part = "";
    bool in_between_quotes = false;
    for (char c : line) {
        if (c == '"') in_between_quotes = !in_between_quotes;
        else if (c == ',' && !in_between_quotes) {
            data.push_back(current_part);
            current_part = "";
        }
        else current_part += c;
    }
    data.push_back(current_part);
    return data;
}

string concat(vector<string>& v1, const string& sep ) {
    if (v1.empty()) return "";

    size_t total_size = 0;
    for (const string& s : v1) {
        total_size += s.size();
    }

    if (!sep.empty()) {
        total_size += sep.size()*(v1.size()-1);
    }
    string result;
    result.reserve(total_size);
    for (size_t i = 0; i < v1.size(); ++i) {
        if (i == 6) continue;
        if (i != 7 && (v1[i] == "unknown" || v1[i] == "Unknown")) continue;
        result += v1[i];
        if (i < v1.size()-1 && !sep.empty()) result += sep;
    }

    return result;
}