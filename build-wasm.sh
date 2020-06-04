#!/bin/bash
em++ \
  -s STRICT=1 -s MODULARIZE=1 \
  -s USE_BOOST_HEADERS=1 \
  -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap", "UTF8ToString"]' \
  -s TOTAL_STACK=262144 -s INITIAL_MEMORY=1048576 -s MALLOC=emmalloc -s FILESYSTEM=0 \
  -O3 \
  --no-entry -o wasm-mod.js wasm-mod.cpp
