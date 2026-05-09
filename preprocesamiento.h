//
// Created by leona on 8/05/2026.
//

#ifndef PROYECTO_PROGRA3_PREPROCESAMIENTO_H
#define PROYECTO_PROGRA3_PREPROCESAMIENTO_H

using namespace std;

#include <string>
#include <vector>

bool process_movie_data(const string& input_filename, const string& output_filename);

vector<string> parse_data(const string& line);
string concat(vector<string>& v1, const string& sep = "");


#endif //PROYECTO_PROGRA3_PREPROCESAMIENTO_H

