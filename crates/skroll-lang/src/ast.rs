use crate::span::Span;

#[derive(Debug, Clone, Default)]
pub struct File {
    pub sections: Vec<Section>,
}

#[derive(Debug, Clone)]
pub struct Section {
    pub name: String,
    pub name_span: Span,
    pub header_span: Span,
    pub items: Vec<Item>,
}

#[derive(Debug, Clone)]
pub enum Item {
    Line(Line),
    Choice(Choice),
    Divert(Divert),
    Stmt(Stmt),
}

#[derive(Debug, Clone)]
pub struct Line {
    pub text: String,
    pub span: Span,
}

#[derive(Debug, Clone)]
pub struct Choice {
    pub text: String,
    pub condition: Option<String>, // placeholder
    pub target: String,
    pub span: Span,
}

#[derive(Debug, Clone)]
pub struct Divert {
    pub target: String,
    pub span: Span,
}

#[derive(Debug, Clone)]
pub enum Stmt {
    // { set x = 1 } etc. Placeholder until Task 3.
    Raw { text: String, span: Span },
}
