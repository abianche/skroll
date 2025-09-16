#[test]
fn lexes_basic_constructs() {
    let src = r#"=== start ===
Hello, Skroll!
// comment
* Continue -> end
"#;
    let dump = skroll_lang::parser::debug_lex(src);
    assert!(dump.contains("SectionEqEqEq"));
    assert!(dump.contains("Star"));
    assert!(dump.contains("Arrow"));
    assert!(dump.contains("Newline"));
}
