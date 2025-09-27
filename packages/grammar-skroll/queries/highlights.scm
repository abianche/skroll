;; Keywords
[("story") ("scene") ("beat") ("choice") ("option") ("goto") ("end") ("return") ("when") ("include") ("config") ("set") ("emit") ("say") ("stage") ("with") ("and") ("or") ("not")] @keyword

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
