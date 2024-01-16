#include <boost/property_tree/info_parser.hpp>
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/xml_parser.hpp>
#include <emscripten.h>
#include <sstream>

namespace pt = boost::property_tree;

enum Format { FMT_INFO = 0, FMT_XML = 1 };

static const char*
toLengthString(const std::string& s) {
  uint32_t len = static_cast<uint32_t>(s.size());
  char* output = reinterpret_cast<char*>(malloc(sizeof(len) + s.size()));
  memcpy(output, &len, sizeof(len));
  memcpy(output + sizeof(len), s.data(), len);
  return output;
}

EMSCRIPTEN_KEEPALIVE
extern "C" pt::ptree*
load(const char* input, Format fmt) {
  std::istringstream stream(input);
  auto* tree = new pt::ptree;
  try {
    switch (fmt) {
      case FMT_INFO:
        pt::info_parser::read_info(stream, *tree);
        break;
      case FMT_XML:
        pt::xml_parser::read_xml(stream, *tree,
                                 pt::xml_parser::no_comments | pt::xml_parser::trim_whitespace);
        break;
    }
  } catch (const pt::file_parser_error&) {
  }
  return tree;
}

EMSCRIPTEN_KEEPALIVE
extern "C" const char*
save(pt::ptree* tree, Format fmt) {
  std::ostringstream stream;
  try {
    switch (fmt) {
      case FMT_INFO:
        pt::info_parser::write_info(stream, *tree);
        break;
      case FMT_XML:
        pt::xml_parser::write_xml(stream, *tree,
                                  pt::xml_parser::xml_writer_make_settings<std::string>(' ', 4));
        break;
    }
  } catch (const pt::file_parser_error&) {
    return nullptr;
  }
  return toLengthString(stream.str());
}

EMSCRIPTEN_KEEPALIVE
extern "C" void
dispose(pt::ptree* tree) {
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
  return toLengthString(tree->data());
}
