#include <tree_sitter/parser.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

enum TokenType {
  TOKEN_INDENT,
  TOKEN_DEDENT,
  TOKEN_NEWLINE,
  TOKEN_INDENTATION_ERROR,
};

#define MAX_INDENT_LEVELS 1024

typedef struct {
  uint16_t stack[MAX_INDENT_LEVELS];
  uint16_t stack_size;
  uint16_t dedent_count;
  uint16_t newline_count;
  uint16_t pending_indent_length;
  bool pending_indent;
  bool indentation_error;
} Scanner;

static inline void scanner_reset(Scanner *scanner) {
  scanner->stack_size = 1;
  scanner->stack[0] = 0;
  scanner->dedent_count = 0;
  scanner->newline_count = 0;
  scanner->pending_indent_length = 0;
  scanner->pending_indent = false;
  scanner->indentation_error = false;
}

static inline uint16_t current_indent(const Scanner *scanner) {
  return scanner->stack[scanner->stack_size - 1];
}

static inline void push_indent(Scanner *scanner, uint16_t length) {
  if (scanner->stack_size < MAX_INDENT_LEVELS) {
    scanner->stack[scanner->stack_size++] = length;
  }
}

static inline void pop_indent(Scanner *scanner) {
  if (scanner->stack_size > 1) {
    scanner->stack_size--;
  }
}

static uint16_t read_indentation_length(TSLexer *lexer) {
  uint16_t length = 0;
  for (;;) {
    int32_t c = lexer->lookahead;
    if (c == ' ') {
      length++;
      lexer->advance(lexer, true);
    } else if (c == '\t') {
      length += 8 - (length % 8);
      lexer->advance(lexer, true);
    } else if (c == '\r') {
      lexer->advance(lexer, true);
    } else {
      break;
    }
  }
  return length;
}

static unsigned serialize_state(Scanner *scanner, char *buffer) {
  unsigned size = 0;
  buffer[size++] = (char)scanner->stack_size;
  for (uint16_t i = 0; i < scanner->stack_size; i++) {
    uint16_t value = scanner->stack[i];
    buffer[size++] = (char)(value & 0xFF);
    buffer[size++] = (char)((value >> 8) & 0xFF);
  }
  buffer[size++] = (char)(scanner->dedent_count & 0xFF);
  buffer[size++] = (char)((scanner->dedent_count >> 8) & 0xFF);
  buffer[size++] = (char)(scanner->newline_count & 0xFF);
  buffer[size++] = (char)((scanner->newline_count >> 8) & 0xFF);
  buffer[size++] = scanner->pending_indent ? 1 : 0;
  buffer[size++] = (char)(scanner->pending_indent_length & 0xFF);
  buffer[size++] = (char)((scanner->pending_indent_length >> 8) & 0xFF);
  buffer[size++] = scanner->indentation_error ? 1 : 0;
  return size;
}

static void deserialize_state(Scanner *scanner, const char *buffer, unsigned length) {
  if (length == 0) {
    scanner_reset(scanner);
    return;
  }

  unsigned index = 0;
  uint8_t stack_size_byte = (uint8_t)buffer[index++];
  if (stack_size_byte == 0) {
    stack_size_byte = 1;
  }
  scanner->stack_size = stack_size_byte;
  if (scanner->stack_size > MAX_INDENT_LEVELS) {
    scanner->stack_size = MAX_INDENT_LEVELS;
  }
  for (uint16_t i = 0; i < scanner->stack_size && index + 1 < length; i++) {
    uint16_t value = (uint8_t)buffer[index++];
    value |= (uint16_t)((uint8_t)buffer[index++]) << 8;
    scanner->stack[i] = value;
  }
  if (scanner->stack_size == 0) {
    scanner->stack_size = 1;
    scanner->stack[0] = 0;
  }
  if (index + 1 < length) {
    scanner->dedent_count = (uint8_t)buffer[index++];
    scanner->dedent_count |= (uint16_t)((uint8_t)buffer[index++]) << 8;
  } else {
    scanner->dedent_count = 0;
  }
  if (index + 1 < length) {
    scanner->newline_count = (uint8_t)buffer[index++];
    scanner->newline_count |= (uint16_t)((uint8_t)buffer[index++]) << 8;
  } else {
    scanner->newline_count = 0;
  }
  if (index < length) {
    scanner->pending_indent = buffer[index++] != 0;
  } else {
    scanner->pending_indent = false;
  }
  if (index + 1 < length) {
    scanner->pending_indent_length = (uint8_t)buffer[index++];
    scanner->pending_indent_length |= (uint16_t)((uint8_t)buffer[index++]) << 8;
  } else {
    scanner->pending_indent_length = 0;
  }
  if (index < length) {
    scanner->indentation_error = buffer[index++] != 0;
  } else {
    scanner->indentation_error = false;
  }
}

static bool emit_newline(Scanner *scanner, TSLexer *lexer, const bool *valid_symbols) {
  if (scanner->newline_count > 0) {
    if (!valid_symbols[TOKEN_NEWLINE]) {
      return false;
    }
    scanner->newline_count--;
    lexer->result_symbol = TOKEN_NEWLINE;
    return true;
  }
  return false;
}

static bool emit_dedent(Scanner *scanner, TSLexer *lexer, const bool *valid_symbols) {
  if (scanner->dedent_count > 0 && scanner->newline_count == 0) {
    if (!valid_symbols[TOKEN_DEDENT]) {
      return false;
    }
    if (scanner->stack_size > 1) {
      pop_indent(scanner);
    }
    scanner->dedent_count--;
    lexer->result_symbol = TOKEN_DEDENT;
    return true;
  }
  return false;
}

static bool emit_indent(Scanner *scanner, TSLexer *lexer, const bool *valid_symbols) {
  if (scanner->pending_indent && scanner->newline_count == 0) {
    if (!valid_symbols[TOKEN_INDENT]) {
      return false;
    }
    push_indent(scanner, scanner->pending_indent_length);
    scanner->pending_indent = false;
    scanner->pending_indent_length = 0;
    lexer->result_symbol = TOKEN_INDENT;
    return true;
  }
  return false;
}

static bool emit_error(Scanner *scanner, TSLexer *lexer, const bool *valid_symbols) {
  if (scanner->indentation_error && scanner->newline_count == 0 && scanner->dedent_count == 0 && !scanner->pending_indent) {
    if (!valid_symbols[TOKEN_INDENTATION_ERROR]) {
      return false;
    }
    scanner->indentation_error = false;
    lexer->result_symbol = TOKEN_INDENTATION_ERROR;
    return true;
  }
  return false;
}

static bool scan(Scanner *scanner, TSLexer *lexer, const bool *valid_symbols) {
  if (emit_newline(scanner, lexer, valid_symbols)) {
    return true;
  }
  if (emit_dedent(scanner, lexer, valid_symbols)) {
    return true;
  }
  if (emit_indent(scanner, lexer, valid_symbols)) {
    return true;
  }
  if (emit_error(scanner, lexer, valid_symbols)) {
    return true;
  }

  while (lexer->lookahead == '\r') {
    lexer->advance(lexer, true);
  }

  if (lexer->lookahead == '\n') {
    lexer->advance(lexer, true);
    scanner->newline_count++;

    uint16_t indent_length = 0;
    for (;;) {
      indent_length = read_indentation_length(lexer);
      while (lexer->lookahead == '\r') {
        lexer->advance(lexer, true);
      }
      if (lexer->lookahead != '\n') {
        break;
      }
      lexer->advance(lexer, true);
      scanner->newline_count++;
    }

    if (lexer->lookahead == 0) {
      if (scanner->stack_size > 1) {
        scanner->dedent_count += scanner->stack_size - 1;
        scanner->stack_size = 1;
      }
      return true;
    }

    uint16_t current = current_indent(scanner);
    if (indent_length > current) {
      scanner->pending_indent = true;
      scanner->pending_indent_length = indent_length;
    } else if (indent_length < current) {
      uint16_t index = scanner->stack_size;
      while (index > 0 && indent_length < scanner->stack[index - 1]) {
        scanner->dedent_count++;
        index--;
      }
      if (index == 0) {
        scanner->indentation_error = true;
        scanner->pending_indent = true;
        scanner->pending_indent_length = indent_length;
      } else if (indent_length == scanner->stack[index - 1]) {
        scanner->stack_size = index;
      } else if (indent_length > scanner->stack[index - 1]) {
        scanner->indentation_error = true;
        scanner->pending_indent = true;
        scanner->pending_indent_length = indent_length;
        scanner->stack_size = index;
      } else {
        scanner->indentation_error = true;
        scanner->stack_size = index;
      }
    }
    return true;
  }

  if (lexer->lookahead == 0) {
    if (scanner->stack_size > 1) {
      if (!valid_symbols[TOKEN_DEDENT]) {
        return false;
      }
      pop_indent(scanner);
      lexer->result_symbol = TOKEN_DEDENT;
      return true;
    }
    return false;
  }

  return false;
}

void *tree_sitter_skroll_external_scanner_create(void) {
  Scanner *scanner = (Scanner *)malloc(sizeof(Scanner));
  if (scanner != NULL) {
    scanner_reset(scanner);
  }
  return scanner;
}

void tree_sitter_skroll_external_scanner_destroy(void *payload) {
  Scanner *scanner = (Scanner *)payload;
  free(scanner);
}

unsigned tree_sitter_skroll_external_scanner_serialize(void *payload, char *buffer) {
  Scanner *scanner = (Scanner *)payload;
  return serialize_state(scanner, buffer);
}

void tree_sitter_skroll_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  Scanner *scanner = (Scanner *)payload;
  deserialize_state(scanner, buffer, length);
}

bool tree_sitter_skroll_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  Scanner *scanner = (Scanner *)payload;
  return scan(scanner, lexer, valid_symbols);
}
