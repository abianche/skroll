use crate::span::{Source, Span};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Level {
    Error,
    Warning,
    Note,
}

#[derive(Debug, Clone)]
pub struct Diagnostic {
    pub level: Level,
    pub code: &'static str,
    pub message: String,
    pub span: Option<Span>,
    pub notes: Vec<(Option<Span>, String)>,
}

pub type Diagnostics = Vec<Diagnostic>;

impl Diagnostic {
    pub fn error(code: &'static str, span: Option<Span>, msg: impl Into<String>) -> Self {
        Self { level: Level::Error, code, message: msg.into(), span, notes: vec![] }
    }
}

pub fn format_with_source(diag: &Diagnostic, src: &Source) -> String {
    let mut s = format!("{:?} [{}]: {}", diag.level, diag.code, diag.message);
    if let Some(sp) = diag.span {
        let (l, c) = src.line_col(sp.start);
        s.push_str(&format!(" at {l}:{c}"));
    }
    s
}
