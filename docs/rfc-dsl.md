# RFC: Skroll Story DSL (`.skr`)

## Summary
This RFC proposes the Skroll Story DSL, a domain-specific language for writing
interactive narrative experiences that compile into Skroll's runtime scene graph
model. It defines the language's syntax, lexical rules, diagnostics, runtime
concepts, and `.skr` source file conventions.

## Motivation
Content designers need a focused authoring format that keeps narrative structure
explicit while remaining easy to version control and review. The DSL must bridge
creative intent with an executable runtime model so that tooling, previews, and
localization can rely on deterministic structure.

## Goals
- Express stories as structured collections of scenes, beats, and transitions.
- Provide predictable lexical rules for whitespace, identifiers, literals, and
  comments.
- Support metadata for packaging, localization hints, and tooling integration.
- Compile to a runtime representation that matches Skroll's scene graph engine.
- Surface actionable diagnostics when parsing or validating `.skr` files.

## Non-goals
- Defining editor UX or authoring tooling implementation details.
- Describing the runtime renderer or animation system internals.
- Providing full grammar formalization; this RFC stays at a conceptual level.

## Source File Conventions
- **Extension:** Story files use the `.skr` extension.
- **Encoding:** Files must be UTF-8 encoded without byte-order marks (BOM).
- **Line endings:** `\n` (LF) is recommended; CRLF is tolerated but normalized
  during parsing.
- **Whitespace:** Tabs and spaces are allowed; indentation is significant only
  inside block constructs and is normalized to logical indent levels.
- **Comments:**
  - Single-line comments begin with `//` and continue to end of line.
  - Block comments are delimited by `/*` and `*/` and may span multiple lines.
  - Comments may appear wherever whitespace is permitted and are ignored by the
    parser.
- **Metadata fences:** Files may begin with an optional metadata block fenced by
  triple colons:
  
  ```
  :::meta
  key: value
  :::
  ```
  
  The metadata block uses YAML-like key/value pairs with string literals,
  numbers, or booleans. Metadata applies to the whole file and is surfaced to
  tooling during compilation.
- **Includes (future-facing):** Reserve the directive `include "path"` for
  importing reusable fragments (characters, shared beats). Implementations may
  initially warn that includes are unsupported, but the syntax should parse
  without error to allow forward compatibility.

## Language Overview
A `.skr` file defines a `story` root block. Inside the story, authors declare
participants, assets, and a set of `scene` blocks. Each scene contains ordered
`beat` blocks, optional branching via `choice`, and transitions to other scenes
or special terminals (`end`, `return`). The language favors declarative syntax
with explicit identifiers and string literals.

### Core Constructs
- `story <identifier>`: Declares the story root. It may include nested
  `using` statements to reference shared libraries (future use), `config` blocks
  for runtime tuning, and one or more `scene` definitions.
- `scene <identifier>`: Defines a narrative unit with a title, optional
  conditions, entry actions, and an ordered list of beats.
- `beat <identifier>`: Represents a single moment, typically containing dialogue
  lines, stage directions, and optional branching logic.
- `choice`: Introduces player-facing decisions within a beat. Choices contain
  `option` entries that reference target beats or scenes.
- `goto`: Explicit transition to another beat or scene by identifier.
- `end`: Terminates the story or the enclosing scene when encountered.
- `return`: Exits the current scene and returns control to the caller (used when
  scenes are invoked as subroutines by the runtime).

### Lexical Rules
- **Identifiers:** Start with an ASCII letter or underscore, followed by letters,
  digits, or underscores. Identifiers are case-sensitive.
- **String literals:** Enclosed in double quotes (`"`). Escape sequences use a
  backslash (`\`) followed by a recognized escape (`\n`, `\t`, `\"`, `\\`).
- **Numbers:** Decimal integers or floats (e.g., `42`, `3.14`). Used in metadata
  and numeric parameters.
- **Booleans:** `true` or `false` (lowercase) for flags.
- **Keywords:** Reserved words include `story`, `scene`, `beat`, `choice`,
  `option`, `goto`, `end`, `return`, `when`, `on`, `config`, `include`, `using`.
  Keywords cannot be reused as identifiers.
- **Whitespace:** Separates tokens. Newlines terminate statements unless a block
  or continuation symbol indicates otherwise.

### Block Structure
Blocks use indentation to group nested statements. A block begins after a colon
(`:`) and continues until the indentation level decreases. For example:

```
scene marketplace:
  beat arrival:
    say narrator "You arrive at the bustling market."
```

The parser normalizes indentation to logical levels; mixing tabs and spaces is
allowed but discouraged. Implementations should provide diagnostics for
inconsistent indentation that changes the interpreted structure.

### Dialogue and Actions
Within a beat, authors express content via commands:
- `say <speaker> "<text>"`
- `stage "<direction>"`
- `set <state> = <value>`
- `emit <event> [with <payload>]`

These commands translate to runtime actions executed sequentially.

### Conditions and Branching
- `when <expression>` guards beats, choices, or options.
- Expressions use infix notation with logical (`and`, `or`, `not`) and
  comparison operators (`==`, `!=`, `<`, `<=`, `>`, `>=`).
- `choice` blocks contain `option` entries with optional `when` guards and
  `goto` or inline beat bodies.

## Diagnostics
The compiler surface diagnostics across three phases:
1. **Lexing/Parsing errors:** Unexpected tokens, unterminated strings, invalid
   indentation. Report the line, column, and offending lexeme with a short code
   (`SKR001` etc.).
2. **Semantic validation:** Undefined identifiers, duplicate scene or beat
   names, unreachable transitions, type mismatches in expressions. Diagnostics
   include suggestions, such as closest matching identifier.
3. **Runtime verification:** Warn about long-running loops, missing `end`
   transitions, or optional assets not resolved. These warnings carry severity
   (`warning`, `error`, `info`) and suggest corrective action.

Diagnostics should support rich formatting (code frames, highlights) to aid in
editor integrations.

## Runtime Model
Compilation transforms the DSL into a structured runtime manifest:
- **Story graph:** A directed graph where nodes represent beats and scenes; edges
  represent transitions (`goto`, `choice` options, implicit sequencing).
- **Action queue:** Each beat yields an ordered list of actions (dialogue,
  stage directions, state updates) executed by the runtime.
- **State schema:** Declarative `config` and `set` statements define initial and
  mutated state variables. The runtime tracks state in a key/value store with
  type hints.
- **Event channels:** `emit` statements enqueue events consumed by subsystems
  (audio, achievements, analytics).
- **Invocation stack:** Scenes can call other scenes (future feature). `return`
  unwinds the stack, resuming the caller's beat sequence.

The runtime manifest is serialized as JSON for consumption by the Skroll engine
and tooling. It includes metadata, localized string references, and asset
bindings.

## Example
### Source (`.skr`)
```
:::meta
id: "market-day"
locale: "en-US"
version: 1
:::

story market_day:
  config:
    starting_scene = marketplace

  scene marketplace:
    beat arrival:
      say narrator "You arrive at the bustling market."
      stage "Merchants haggle under colorful awnings."
      choice:
        option "Browse the stalls" goto browse
        option "Meet a friend" when hasInvitation goto meet_friend

    beat browse:
      say narrator "You sample spices and fabrics."
      emit analytics_event with { action: "browse" }
      end

    beat meet_friend:
      say friend "Glad you made it!"
      goto celebration

    beat celebration:
      say narrator "The festival drums begin to play."
      end
```

### Compiled Runtime Manifest (conceptual JSON)
```
{
  "id": "market-day",
  "version": 1,
  "metadata": {
    "locale": "en-US"
  },
  "story": {
    "config": {
      "starting_scene": "marketplace"
    },
    "scenes": {
      "marketplace": {
        "beats": {
          "arrival": {
            "actions": [
              { "type": "say", "speaker": "narrator", "text": "You arrive at the bustling market." },
              { "type": "stage", "text": "Merchants haggle under colorful awnings." }
            ],
            "choices": [
              {
                "text": "Browse the stalls",
                "condition": null,
                "target": { "type": "beat", "id": "browse" }
              },
              {
                "text": "Meet a friend",
                "condition": "hasInvitation",
                "target": { "type": "beat", "id": "meet_friend" }
              }
            ]
          },
          "browse": {
            "actions": [
              { "type": "say", "speaker": "narrator", "text": "You sample spices and fabrics." },
              { "type": "emit", "channel": "analytics_event", "payload": { "action": "browse" } }
            ],
            "transition": { "type": "end" }
          },
          "meet_friend": {
            "actions": [
              { "type": "say", "speaker": "friend", "text": "Glad you made it!" }
            ],
            "transition": { "type": "goto", "target": { "type": "beat", "id": "celebration" } }
          },
          "celebration": {
            "actions": [
              { "type": "say", "speaker": "narrator", "text": "The festival drums begin to play." }
            ],
            "transition": { "type": "end" }
          }
        }
      }
    }
  }
}
```

## Future Extensions
- **Localization bundles:** Link string literals to localization keys with inline
  annotations.
- **Asset pipelines:** Allow `using assetpack` declarations to bind art, audio,
  or animation resources.
- **Macros & includes:** Expand the `include` directive to support partials and
  shared configuration across stories.
- **Type definitions:** Provide schema declarations for complex state payloads.

## Open Questions
- How should includes resolve relative to package boundaries in large projects?
- Should the runtime manifest support incremental compilation artifacts for
  editor previews?
- What validation rules are necessary to prevent circular scene invocations?

