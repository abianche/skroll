// @ts-check

const PREC = {
  assignment: 1,
  or: 2,
  and: 3,
  equality: 4,
  comparison: 5,
  additive: 6,
  multiplicative: 7,
  unary: 8,
};

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

function block($, rule) {
  return seq(
    $._newline,
    alias($._indent, $.block_start),
    repeat1(choice(
      seq(rule, $._newline),
      $.blank_line
    )),
    alias($._dedent, $.block_end)
  );
}

function optional_block($, rule) {
  return seq(
    $._newline,
    alias($._indent, $.block_start),
    repeat(choice(
      seq(rule, $._newline),
      $.blank_line
    )),
    alias($._dedent, $.block_end)
  );
}

module.exports = grammar({
  name: 'skroll',

  externals: $ => [
    $._indent,
    $._dedent,
    $._newline,
    $.indentation_error
  ],

  extras: $ => [
    $.comment,
    /[\f\r\t \u00A0\uFEFF]+/
  ],

  supertypes: $ => [
    $._statement,
    $._declaration,
    $._beat_statement,
    $._action,
    $._expression,
    $._literal
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => seq(
      optional($.metadata_fence),
      optional($._newline),
      repeat(choice(
        seq($._statement, optional($._newline)),
        $.blank_line,
        $.inconsistent_indentation
      ))
    ),

    metadata_fence: $ => seq(
      ':::meta',
      $._newline,
      repeat(choice($.metadata_entry, $.blank_line)),
      ':::'
    ),

    metadata_entry: $ => seq(
      field('key', $.identifier),
      ':',
      field('value', choice(
        $.metadata_object,
        $.inline_strong,
        $.inline_emphasis,
        $._literal,
        $.identifier
      )),
      $._newline
    ),

    metadata_object: $ => seq(
      '{',
      optional(sep1($.object_pair, ',')),
      optional(','),
      '}'
    ),

    blank_line: $ => prec(1, alias($._newline, $.blank_line)),

    inconsistent_indentation: $ => $.indentation_error,

    comment: $ => token(choice(
      seq('//', /[^\n\r]*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    )),

    _statement: $ => choice(
      $._declaration,
      $.assignment,
      $.choice_block,
      $.goto_transition,
      $.end_transition,
      $.return_transition,
      $.include_directive,
      $.when_guard
    ),

    _declaration: $ => choice(
      $.story_declaration,
      $.scene_declaration,
      $.beat_declaration,
      $.config_block
    ),

    story_declaration: $ => seq(
      'story',
      field('name', $.identifier),
      ':',
      block($, choice($._declaration, $.include_directive, $.blank_line, $.inconsistent_indentation))
    ),

    scene_declaration: $ => seq(
      'scene',
      field('name', $.identifier),
      optional($.when_clause),
      ':',
      block($, choice($._scene_item, $.blank_line, $.inconsistent_indentation))
    ),

    beat_declaration: $ => seq(
      'beat',
      field('name', $.identifier),
      optional($.when_clause),
      ':',
      block($, choice($._beat_statement, $.blank_line, $.inconsistent_indentation))
    ),

    config_block: $ => seq(
      'config',
      ':',
      block($, choice($.assignment, $.blank_line, $.inconsistent_indentation))
    ),

    include_directive: $ => seq(
      'include',
      field('path', $.string)
    ),

    when_guard: $ => seq(
      'when',
      field('condition', $._expression)
    ),

    _scene_item: $ => choice(
      $.beat_declaration,
      $.choice_block,
      $.goto_transition,
      $.end_transition,
      $.return_transition,
      $.when_guard
    ),

    _beat_statement: $ => choice(
      $._action,
      $.choice_block,
      $.goto_transition,
      $.end_transition,
      $.return_transition,
      $.when_guard,
      $.assignment
    ),

    _action: $ => choice(
      $.say_action,
      $.stage_action,
      $.set_action,
      $.emit_action
    ),

    say_action: $ => seq(
      'say',
      field('speaker', $.identifier),
      field('text', $.string)
    ),

    stage_action: $ => seq(
      'stage',
      field('direction', $.string)
    ),

    set_action: $ => seq(
      'set',
      field('state', $.identifier),
      '=',
      field('value', $._expression)
    ),

    emit_action: $ => seq(
      'emit',
      field('event', $.identifier),
      optional(seq('with', field('payload', $._expression)))
    ),

    choice_block: $ => seq(
      'choice',
      optional($.when_clause),
      ':',
      block($, choice($.option_entry, $.blank_line, $.inconsistent_indentation, $.beat_declaration))
    ),

    option_entry: $ => seq(
      'option',
      field('label', $.string),
      optional($.when_clause),
      choice(
        seq('goto', field('target', $.identifier)),
        seq(':', optional_block($, choice($._beat_statement, $.blank_line, $.inconsistent_indentation)))
      )
    ),

    goto_transition: $ => seq('goto', field('target', $.identifier)),

    end_transition: $ => 'end',

    return_transition: $ => 'return',

    when_clause: $ => seq('when', field('condition', $._expression)),

    assignment: $ => seq(
      field('name', $.identifier),
      '=',
      field('value', $._expression)
    ),

    _expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.parenthesized_expression,
      $.object_literal,
      $.array_literal,
      $._literal,
      $.identifier
    ),

    unary_expression: $ => prec(PREC.unary, seq(
      field('operator', choice('not', '-', '+')),
      field('operand', $._expression)
    )),

    binary_expression: $ => choice(
      prec.left(PREC.or, seq($._expression, field('operator', 'or'), $._expression)),
      prec.left(PREC.and, seq($._expression, field('operator', 'and'), $._expression)),
      prec.left(PREC.equality, seq($._expression, field('operator', choice('==', '!=')), $._expression)),
      prec.left(PREC.comparison, seq($._expression, field('operator', choice('<', '<=', '>', '>=')), $._expression)),
      prec.left(PREC.additive, seq($._expression, field('operator', choice('+', '-')), $._expression)),
      prec.left(PREC.multiplicative, seq($._expression, field('operator', choice('*', '/', '%')), $._expression))
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    object_literal: $ => seq(
      '{',
      optional(sep1($.object_pair, ',')),
      optional(','),
      '}'
    ),

    object_pair: $ => seq(
      field('key', choice($.identifier, $.string)),
      ':',
      field('value', $._expression)
    ),

    array_literal: $ => seq(
      '[',
      optional(sep1($._expression, ',')),
      optional(','),
      ']'
    ),

    _literal: $ => choice(
      $.string,
      $.number,
      $.boolean
    ),

    identifier: $ => token(seq(
      /[A-Za-z_]/,
      repeat(/[A-Za-z0-9_]/)
    )),

    string: $ => token(seq(
      '"',
      repeat(choice(
        /[^"\\\n\r]+/,
        /\\./
      )),
      '"'
    )),

    number: $ => token(seq(
      optional('-'),
      choice(
        '0',
        seq(/[1-9]/, repeat(/[0-9]/))
      ),
      optional(seq('.', repeat1(/[0-9]/)))
    )),

    boolean: $ => choice('true', 'false'),

    inline_strong: $ => token(seq('**', /[^*\n\r][^*\n\r]*/, '**')),

    inline_emphasis: $ => token(seq('*', /[^*\n\r]+/, '*'))
  }
});
