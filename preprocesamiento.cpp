#include <algorithm>
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include "preprocesamiento.h"

using namespace std;

unordered_map<int,Pelicula*> process_movie_data(const string& input_filename, const string& output_filename) {
    /*
     * El archivo de input_filename se llama "wiki_movie_plots_deduped.csv"
     * El archivo de output_filename se llama "movies.txt"
     * Ambos nombres son puestos en la interfaz, pero se hace la aclaración como comentario
     */
    unordered_map<int,Pelicula*> movies_titles;

    ifstream inputFile(input_filename);
    ofstream outputFile(output_filename);
    string line;
    if (!inputFile.is_open()) {
        cout << "Error opening file" << endl;
        return movies_titles;
    }
    string headers;
    getline(inputFile, headers);
    cout << headers << endl;
    int id = 0;
    while (getline(inputFile, line)) {

        int quote_count = count(line.begin(), line.end(), '"');
        while (quote_count % 2 != 0) {
            string next_line;
            if (!getline(inputFile, next_line)) break;
            line += " " + next_line;
            quote_count += count(next_line.begin(), next_line.end(), '"');
        }

        vector<string> raw_data = parse_data(line);
        movies_titles[id] = new Pelicula();
        movies_titles[id]->titulo = raw_data[1];
        movies_titles[id]->sinopsis = raw_data[7];

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

        string final_text = raw_text + '$' + to_string(id) + "\n";
        outputFile << final_text;
        id++;
    }
    inputFile.close();
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