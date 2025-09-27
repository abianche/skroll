{
  "targets": [
    {
      "target_name": "tree_sitter_skroll_binding",
      "sources": [
        "bindings/node/binding.cc",
        "src/parser.c",
        "src/scanner.c"
      ],
      "include_dirs": [
        "src",
        "<!(node -p \"require('node-addon-api').include_dir\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": ["NAPI_CPP_EXCEPTIONS"],
      "cflags_c": ["-std=c11"],
      "cflags_cc": ["-std=c++17"],
      "cflags_cc!": ["-fno-exceptions", "-fno-rtti"]
    }
  ]
}
