//! Compiler front-end crate.

pub mod span;
pub mod diagnostic;
pub mod tokens;
pub mod ast;
pub mod parser;

use skroll_schema::StoryDoc;

/// Placeholder compile step: will parse in Task 3.
pub fn compile_to_document(_source: &str) -> Result<StoryDoc, Vec<diagnostic::Diagnostic>> {
    Ok(StoryDoc::empty_with_entry("start"))
}
