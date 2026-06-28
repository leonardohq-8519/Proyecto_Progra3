cmake_minimum_required(VERSION 4.0)
project(Proyecto_Progra3)

set(CMAKE_CXX_STANDARD 20)

add_executable(Preprocesamiento preprocesamiento.cpp)
add_executable(interfaz interfaz.cpp preprocesamiento.cpp
        preprocesamiento.h
        trie.cpp
        trie.h)
