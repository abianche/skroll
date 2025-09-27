;; Keywords
((story_declaration "story" @keyword))
((scene_declaration "scene" @keyword))
((beat_declaration "beat" @keyword))
((choice_block "choice" @keyword))
((option_entry "option" @keyword))
((goto_transition "goto" @keyword))
((end_transition) @keyword)
((return_transition) @keyword)
((when_clause "when" @keyword))
((include_directive "include" @keyword))
((config_block "config" @keyword))
((set_action "set" @keyword))
((emit_action "emit" @keyword))
((emit_action "with" @keyword))
((say_action "say" @keyword))
((stage_action "stage" @keyword))

((binary_expression operator: ("and" @keyword)))
((binary_expression operator: ("or" @keyword)))
((unary_expression operator: ("not" @keyword)))

((boolean) @boolean)
((number) @number)
((string) @string)

((story_declaration name: (identifier) @function))
((scene_declaration name: (identifier) @function))
((beat_declaration name: (identifier) @function))

((set_action state: (identifier) @constant))
((goto_transition target: (identifier) @constant))
((emit_action event: (identifier) @constant))
((option_entry target: (identifier) @constant))
((metadata_entry key: (identifier) @constant))

((identifier) @constant)

((metadata_fence) @comment)
((comment) @comment)

((inline_strong) @markup.strong)
((inline_emphasis) @markup.emphasis)
