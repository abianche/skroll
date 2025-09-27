{
  "targets": [
    {
      "target_name": "tree_sitter_skroll_binding",
        "sources": [
          "src/parser.c",
          "src/scanner.c"
        ],
      "cflags_c": ["-std=c11"],
      "cflags_cc": ["-std=c++17"],
      "include_dirs": ["src"]
    }
  ]
}
