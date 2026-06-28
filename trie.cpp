#include <iostream>
#include <sstream>
#include <fstream>
#include <vector>
#include "trie.h"

#include <algorithm>
#include <set>

using namespace std;

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
        node->movies_id.insert(movie_id);
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

    vector<set<int>> results;

    while (getline(ss, word, ' ')) {
        if (word.empty()) continue;
        TrieNode* currentNode = root;
        bool found = true;
        for (char c : word) {
            int index = (int) c;
            if (index >= 128) continue;
            if (currentNode->children[index] == nullptr) {
                found = false;
                break;
            }
            currentNode = currentNode->children[index];
        }

        if (!found) {
            return vector<int>();
        }

        set<int> currentWordResults = fetchNodes(currentNode);
        results.push_back(currentWordResults);
    }

    if (results.empty()) {
        return vector<int>();
    }

    set<int> finalResult = results[0];

    for (int i = 1; i < results.size(); i++) {
        set<int> intersection;
        set_intersection(finalResult.begin(), finalResult.end(), results[i].begin(), results[i].end(),inserter(intersection,intersection.begin()));
        finalResult = intersection;
    }

    return vector<int>(finalResult.begin(), finalResult.end());
}

set<int> SuffixTrie::fetchNodes(TrieNode* node) {
    set<int> result;
    result = set<int>(node->movies_id);
    for (TrieNode* children : node->children) {
        if (children != nullptr) {
            set<int> childResults = fetchNodes(children);
            result.merge(childResults);
        }
    }
    return result;
}

bool SuffixTrie::loadfromTXT(string fileName) {
    ifstream inputFile(fileName);
    if (!inputFile.is_open()) {
        return false;
    }
    string line;
    while (getline(inputFile, line)) {
        insertText(line);
    }
    inputFile.close();
    return true;
}





