//
// Created by leona on 26/06/2026.
//

#ifndef PROYECTO_PROGRA3_TRIE_H
#define PROYECTO_PROGRA3_TRIE_H

#include <iostream>
#include <sstream>
#include <fstream>
#include <set>
#include <vector>

using namespace std;

struct TrieNode {
    TrieNode* children[128];
    vector<int> movies_id;
};

class SuffixTrie {
    TrieNode* root;
    void destructor(TrieNode* node);
    public:
    SuffixTrie();
    ~SuffixTrie();
    string normalize(string text);
    void insertWordSuffixes(string word, int movie_id);
    void insertText(string text);
    vector<int> search(string query);
    vector<int> fetchNodes(TrieNode* node);
    bool loadfromTXT(string fileName);
};
#endif //PROYECTO_PROGRA3_TRIE_H