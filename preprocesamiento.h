//
// Created by leona on 8/05/2026.
//

#ifndef PROYECTO_PROGRA3_PREPROCESAMIENTO_H
#define PROYECTO_PROGRA3_PREPROCESAMIENTO_H
#include <unordered_map>

using namespace std;

#include <string>
#include <vector>

struct Pelicula {
    string titulo;
    string sinopsis;
    vector<string> tags;
};

unordered_map<int,Pelicula*> process_movie_data(const string& input_filename, const string& output_filename);

vector<string> parse_data(const string& line);
string concat(vector<string>& v1, const string& sep = "");


#endif //PROYECTO_PROGRA3_PREPROCESAMIENTO_H

