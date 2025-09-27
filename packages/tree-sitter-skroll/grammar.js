// @ts-nocheck
// Skroll grammar definition. This describes the indentation-sensitive DSL used
// by the project and is consumed by the Tree-sitter generator to produce the
// parser C sources.
//
// Notes on style:
// - Indentation is significant (Python-like). A custom external scanner emits
//   _indent/_dedent/_newline tokens and can flag inconsistent indentation.
// - Blocks use helpers (block / optional_block) to make indentation handling
//   reusable and safe.
// - Most nodes have explicit fields for better editor queries (field('name', …)).

// ─────────────────────────────────────────────────────────────────────────────
// Operator precedence tiers used by the expression rules.
// Lower numbers bind weaker; larger numbers bind tighter.
const PREC = {
  assignment: 1, // name = value
  or: 2, // a or b
  and: 3, // a and b
  equality: 4, // ==, !=
  comparison: 5, // <, <=, >, >=
  additive: 6, // +, -
  multiplicative: 7, // *, /, %
  unary: 8, // not, unary +/-
};

// Helper to express one-or-more sequences separated by a token (e.g. commas).
//   sep1(x, ',') matches: x (',' x)*
// Useful for object pairs and array elements.
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

// Blocks in Skroll are indentation-based. The helper below allows nested
// declarations to omit a trailing newline while still permitting purely blank
// lines inside the block. Each caller should *not* include $.blank_line in the
// rule set, otherwise blank lines would be consumed twice.
//
// Example matched shape:
//   \n INDENT
//     ( rule (\n)? | blank_line )+
//   DEDENT
function block($, rule) {
  return seq(
    $._newline,
    alias($._indent, $.block_start), // aliased for nicer concrete syntax trees in editors
    repeat1(choice(seq(rule, optional($._newline)), $.blank_line)),
    alias($._dedent, $.block_end)
  );
}

// Some constructs (choice options) can contain an optional block. This mirrors
// the behaviour of block() but allows the content to be entirely absent while
// still tolerating blank lines inside when present.
//
// Example:
// option "Take the key":
//   <optional nested statements here, or nothing at all>
function optional_block($, rule) {
  return seq(
    $._newline,
    alias($._indent, $.block_start),
    repeat(choice(seq(rule, optional($._newline)), $.blank_line)),
    alias($._dedent, $.block_end)
  );
}

module.exports = grammar({
  // Language name as seen by Tree-sitter clients
  name: "skroll",

  // External tokens exported by the scanner. These track indentation levels
  // and flag inconsistent indentation for recovery/highlighting.
  // Implemented in the C scanner that accompanies the grammar.
  externals: ($) => [$._indent, $._dedent, $._newline, $.indentation_error],

  // Allow comments and leading whitespace between tokens without affecting the
  // parse tree (i.e., they're "extras").
  extras: ($) => [
    $.comment,
    /[\f\r\t \u00A0\uFEFF]+/, // form feed, carriage return, tabs, spaces, non-breaking spaces, BOM
  ],

  // Convenience groupings that Tree-sitter uses for injection queries and
  // editor features (folding, text objects, etc.).
  // These don't create nodes; they help classify families of nodes.
  supertypes: ($) => [
    $._statement,
    $._declaration,
    $._beat_statement,
    $._action,
    $._expression,
    $._literal,
  ],

  // Tokens to use for word-wise motions/selection in editors
  word: ($) => $.identifier,

  // ───────────────────────────────────────────────────────────────────────────
  // Top-level grammar rules
  rules: {
    // Entire file: optional metadata fence, then zero+ statements/blank lines.
    // Inconsistent indentation is surfaced as a recoverable node.
    source_file: ($) =>
      seq(
        optional($.metadata_fence),
        optional($._newline),
        repeat(
          choice(seq($._statement, optional($._newline)), $.blank_line, $.inconsistent_indentation)
        )
      ),

    // Frontmatter describing the story metadata. A fence is optional but, when
    // present, anchors the rest of the document.
    //
    // :::meta
    //   title: "My Story"
    //   authors: { main: "A. Dev", co: "B. Writer" }
    // :::
    metadata_fence: ($) =>
      seq(":::meta", $._newline, repeat(choice($.metadata_entry, $.blank_line)), ":::"),

    // key: value entries inside metadata. Values can be objects, inline
    // formatting tokens, literals, or bare identifiers.
    metadata_entry: ($) =>
      seq(
        field("key", $.identifier),
        ":",
        field(
          "value",
          choice($.metadata_object, $.inline_strong, $.inline_emphasis, $._literal, $.identifier)
        ),
        $._newline
      ),

    // { key: value, ... } object literal used only in metadata
    metadata_object: ($) => seq("{", optional(sep1($.object_pair, ",")), optional(","), "}"),

    // A single blank logical line (represented with the external _newline).
    // prec(1) keeps it from merging with other newline usages during conflict resolution.
    blank_line: ($) => prec(1, alias($._newline, $.blank_line)),

    // Surfaces scanner-reported indentation errors as a node.
    inconsistent_indentation: ($) => $.indentation_error,

    // Single-line (// …) and multi-line (/* … */) comments.
    // token() prevents backtracking inside their bodies for performance.
    comment: ($) =>
      token(choice(seq("//", /[^\n\r]*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"))), // NOSONAR: Tree-sitter compiles this regex into a DFA, so there's no pathological backtracking

    // Top-level elements that can appear in a story file outside of metadata.
    _statement: ($) =>
      choice(
        $._declaration,
        $.assignment, // top-level assigns allowed (e.g., config vars)
        $.choice_block,
        $.goto_transition,
        $.end_transition,
        $.return_transition,
        $.include_directive,
        $.when_guard
      ),

    // Declarations form the structural backbone: story/scene/beat/config.
    _declaration: ($) =>
      choice($.story_declaration, $.scene_declaration, $.beat_declaration, $.config_block),

    // Story-level declarations can contain nested declarations and includes.
    //
    // story MyAdventure:
    //   include "prologue.skr"
    //   scene Intro:
    //     …
    story_declaration: ($) =>
      seq(
        "story",
        field("name", $.identifier),
        ":",
        block($, choice($._declaration, $.include_directive, $.inconsistent_indentation))
      ),

    // Scenes may be guarded with a `when` clause and can contain beats,
    // transitions, and nested choice blocks.
    //
    // scene Cave when hasTorch:
    //   beat Entrance:
    //     …
    scene_declaration: ($) =>
      seq(
        "scene",
        field("name", $.identifier),
        optional($.when_clause),
        ":",
        block($, choice($._scene_item, $.inconsistent_indentation))
      ),

    // Beats carry the playable content: actions, transitions, and assignments.
    //
    // beat Entrance:
    //   say narrator "It's dark here."
    //   choice:
    //     option "Light the torch" goto TorchLit
    beat_declaration: ($) =>
      seq(
        "beat",
        field("name", $.identifier),
        optional($.when_clause),
        ":",
        block($, choice($._beat_statement, $.inconsistent_indentation))
      ),

    // Configuration blocks only allow assignments (plus blank lines) inside.
    //
    // config:
    //   difficulty = "hard"
    config_block: ($) =>
      seq("config", ":", block($, choice($.assignment, $.inconsistent_indentation))),

    // Include another .skr file (string path). This is a preprocessor-like directive.
    include_directive: ($) => seq("include", field("path", $.string)),

    // Standalone guard expression (e.g., used as a readability aid between items).
    // Example:
    // when hasKey
    when_guard: ($) => seq("when", field("condition", $._expression)),

    // Items valid in a scene body (beats, choices, transitions, guards).
    _scene_item: ($) =>
      choice(
        $.beat_declaration,
        $.choice_block,
        $.goto_transition,
        $.end_transition,
        $.return_transition,
        $.when_guard
      ),

    // Statements allowed inside beats. These map directly to runtime actions.
    _beat_statement: ($) =>
      choice(
        $._action,
        $.choice_block,
        $.goto_transition,
        $.end_transition,
        $.return_transition,
        $.when_guard,
        $.assignment
      ),

    // Runtime actions (say text, stage directions, set state, emit events).
    _action: ($) => choice($.say_action, $.stage_action, $.set_action, $.emit_action),

    // say <speaker> "<text>"
    // Example: say narrator "Welcome to Skroll!"
    say_action: ($) => seq("say", field("speaker", $.identifier), field("text", $.string)),

    // stage "<direction>"
    // Example: stage "Lights fade in"
    stage_action: ($) => seq("stage", field("direction", $.string)),

    // set <state> = <expr>
    // Example: set health = health - 10
    set_action: ($) => seq("set", field("state", $.identifier), "=", field("value", $._expression)),

    // emit <event> [with <payload-expr>]
    // Example: emit door_opened with { id: 3 }
    emit_action: ($) =>
      seq(
        "emit",
        field("event", $.identifier),
        optional(seq("with", field("payload", $._expression)))
      ),

    // Choice blocks collect multiple options and can be conditionally
    // displayed via `when`. Options either jump directly (`goto`) or nest a
    // block of beat statements.
    //
    // choice when canChoose:
    //   option "Go left" goto LeftPath
    //   option "Examine room":
    //     say player "Hmm…"
    choice_block: ($) =>
      seq(
        "choice",
        optional($.when_clause),
        ":",
        block($, choice($.option_entry, $.inconsistent_indentation, $.beat_declaration))
      ),

    // option "<label>" [when <cond>] (goto <target> | : <optional block>)
    option_entry: ($) =>
      seq(
        "option",
        field("label", $.string),
        optional($.when_clause),
        choice(
          seq("goto", field("target", $.identifier)),
          seq(":", optional_block($, choice($._beat_statement, $.inconsistent_indentation)))
        )
      ),

    // Flow-control transitions
    goto_transition: ($) => seq("goto", field("target", $.identifier)),
    end_transition: ($) => "end", // terminate story/scene/beat as per runtime semantics
    return_transition: ($) => "return", // return to caller/previous context (engine-defined)

    // Inline guard attached to constructs (scene/beat/option and also standalone above).
    when_clause: ($) => seq("when", field("condition", $._expression)),

    // Plain assignment anywhere it's allowed by the parent rule.
    assignment: ($) => seq(field("name", $.identifier), "=", field("value", $._expression)),

    // ─────────────────────────────────────────────────────────────────────────
    // Expressions

    _expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.parenthesized_expression,
        $.object_literal,
        $.array_literal,
        $._literal,
        $.identifier
      ),

    // not x | -x | +x
    unary_expression: ($) =>
      prec(
        PREC.unary,
        seq(field("operator", choice("not", "-", "+")), field("operand", $._expression))
      ),

    // Left-associative binary operators grouped by precedence.
    binary_expression: ($) =>
      choice(
        // a or b
        prec.left(PREC.or, seq($._expression, field("operator", "or"), $._expression)),
        // a and b
        prec.left(PREC.and, seq($._expression, field("operator", "and"), $._expression)),
        // a == b | a != b
        prec.left(
          PREC.equality,
          seq($._expression, field("operator", choice("==", "!=")), $._expression)
        ),
        // a < b | a <= b | a > b | a >= b
        prec.left(
          PREC.comparison,
          seq($._expression, field("operator", choice("<", "<=", ">", ">=")), $._expression)
        ),
        // a + b | a - b
        prec.left(
          PREC.additive,
          seq($._expression, field("operator", choice("+", "-")), $._expression)
        ),
        // a * b | a / b | a % b
        prec.left(
          PREC.multiplicative,
          seq($._expression, field("operator", choice("*", "/", "%")), $._expression)
        )
      ),

    // Parentheses for explicit grouping: (expr)
    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    // General object literal usable in expressions (not just metadata).
    object_literal: ($) => seq("{", optional(sep1($.object_pair, ",")), optional(","), "}"),

    // key: value inside object_literal; key can be identifier or string
    object_pair: ($) =>
      seq(field("key", choice($.identifier, $.string)), ":", field("value", $._expression)),

    // Array literal: [a, b, c]
    array_literal: ($) => seq("[", optional(sep1($._expression, ",")), optional(","), "]"),

    // ─────────────────────────────────────────────────────────────────────────
    // Terminals & simple literals

    _literal: ($) => choice($.string, $.number, $.boolean),

    // Identifiers: ASCII letters/underscore followed by alphanumerics/underscore
    identifier: ($) => token(seq(/[A-Za-z_]/, repeat(/[A-Za-z0-9_]/))),

    // Double-quoted strings with standard escape support (\" \\ \n etc.)
    string: ($) =>
      token(
        seq(
          '"',
          repeat(
            choice(
              /[^"\\\n\r]+/, // any run excluding quote, backslash, newline
              /\\./ // escape sequence
            )
          ),
          '"'
        )
      ),

    // Numbers: optional leading '-', integer part (0 or non-zero with digits),
    // optional fractional part (.digits). No exponent support for now.
    number: ($) =>
      token(
        seq(
          optional("-"),
          choice("0", seq(/[1-9]/, repeat(/[0-9]/))),
          optional(seq(".", repeat1(/[0-9]/)))
        )
      ),

    // Booleans are keywords
    boolean: ($) => choice("true", "false"),

    // Lightweight inline markup for metadata values:
    // **strong** and *emphasis*
    inline_strong: ($) => token(seq("**", /[^*\n\r][^*\n\r]*/, "**")),
    inline_emphasis: ($) => token(seq("*", /[^*\n\r]+/, "*")),
  },
});
