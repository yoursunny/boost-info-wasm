# Read Boost INFO file format via WebAssembly

Boost INFO is a simple file format used in [Boost Property Tree](https://www.boost.org/doc/libs/1_74_0/doc/html/property_tree.html) C++ library.
This package provides a parser for Boost INFO file format, which allows reading Boost INFO from JavaScript code.

Features:

* Load Boost INFO format from a string.
* Read value at given path.
* Visit nodes at given path.

The implementation runs Boost C++ code in a WebAssembly module, so that it supports almost all features of Boost INFO file format.
It does not support keys that contain `.` or `\0` characters, and values that contain `\0` character.

API documentation is available in Visual Studio Code and other editors after installation.
See [test.js](test.js) for demonstrations on how to use this library.
