//! Compiler front-end crate.
//! For Task 1 we provide a minimal placeholder compile function that returns a valid StoryDoc.

use skroll_schema::StoryDoc;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum CompileError {
    #[error("io error: {0}")]
    Io(std::io::Error),
    #[error("internal: {0}")]
    Internal(String),
}

#[derive(Debug, Clone, Copy)]
pub struct Span {
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone)]
pub struct Diagnostic {
    pub message: String,
    pub span: Option<Span>,
}

pub type Diagnostics = Vec<Diagnostic>;

/// Placeholder compile step: emit a minimal StoryDoc with entry "start".
/// Next tasks will parse and validate the actual `.skr` source.
pub fn compile_to_document(_source: &str) -> Result<StoryDoc, Diagnostics> {
    let doc = StoryDoc::empty_with_entry("start");
    Ok(doc)
}
