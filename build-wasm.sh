#!/bin/bash
set -euo pipefail
em++ \
  -s EXPORT_ES6=1 \
  -s EXPORTED_FUNCTIONS='["_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap", "UTF8ToString"]' \
  -s FILESYSTEM=0 \
  -s INITIAL_MEMORY=$((1024 * 1024)) \
  -s INVOKE_RUN=1 \
  -s MALLOC=emmalloc \
  -s MODULARIZE=1 \
  -s SAFE_HEAP=1 \
  -s STACK_OVERFLOW_CHECK=1 \
  -s STACK_SIZE=$((256 * 1024)) \
  -s STRICT=1 \
  -s TEXTDECODER=2 \
  -s USE_BOOST_HEADERS=1 \
  -s WASM_BIGINT=1 \
  -std=c++17 -O3 --no-entry \
  -o wasm-mod.js wasm-mod.cpp
