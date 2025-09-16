#[test]
fn cli_wire_works() {
    let doc = skroll_lang::compile_to_document("=== start ===\nHello");
    assert!(doc.is_ok());
    let json = serde_json::to_string(&doc.unwrap()).unwrap();
    assert!(json.contains("\"schema_version\""));
}
