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

// search: paraleliza el recorrido por cada palabra de la query (lectura pura)
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

    // Fase paralela: parsear "$", normalizar texto y tokenizar palabras.
    // No toca el trie todavía, así que es seguro en paralelo.
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

    // Fase secuencial: inserción real en el trie compartido (sin locks)
    for (size_t i = 0; i < n; i++) {
        if (!valid[i]) continue;
        for (const string& w : parsedWords[i]) {
            insertWordSuffixes(w, movieIds[i]);
        }
    }

    return true;
}





