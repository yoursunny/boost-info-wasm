#include <boost/property_tree/info_parser.hpp>
#include <boost/property_tree/ptree.hpp>
#include <emscripten.h>
#include <sstream>

namespace pt = boost::property_tree;

EMSCRIPTEN_KEEPALIVE
extern "C" pt::ptree*
load(const char* input) {
  std::istringstream stream(input);
  auto* tree = new pt::ptree;
  pt::info_parser::read_info(stream, *tree, pt::ptree());
  return tree;
}

EMSCRIPTEN_KEEPALIVE
extern "C" void
unload(pt::ptree* tree) {
  delete tree;
}

EMSCRIPTEN_KEEPALIVE
extern "C" int
count(pt::ptree* tree, const char* path, const char* key) {
  auto child = tree->get_child_optional(path);
  if (!child) {
    return 0;
  }

  return child->count(key);
}

EMSCRIPTEN_KEEPALIVE
extern "C" pt::ptree*
get(pt::ptree* tree, const char* path, const char* key, int index) {
  auto child = tree->get_child_optional(path);
  if (!child) {
    return nullptr;
  }

  auto range = child->equal_range(key);
  int i = -1;
  for (auto it = range.first; it != range.second; ++it) {
    if (++i == index) {
      pt::ptree* sub = new pt::ptree;
      *sub = it->second;
      return sub;
    }
  }
  return nullptr;
}

EMSCRIPTEN_KEEPALIVE
extern "C" const char*
value(pt::ptree* tree) {
  std::string s = tree->data();
  uint32_t len = static_cast<uint32_t>(s.size());

  char* room = reinterpret_cast<char*>(malloc(sizeof(len) + s.size()));
  memcpy(room, &len, sizeof(len));
  memcpy(room + sizeof(len), s.data(), len);
  return room;
}
