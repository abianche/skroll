use crate::{
    ast,
    diagnostic::Diagnostics,
    span::Span,
    tokens,
};

pub fn parse(src: &str) -> Result<ast::File, Diagnostics> {
    tokens::lex(src).map(|_| ast::File::default())
}

/// Debug helper for Task 2: run the lexer and pretty-print tokens.
pub fn debug_lex(src: &str) -> String {
    match tokens::lex(src) {
        Ok(v) => v
            .into_iter()
            .map(|(t, Span { start, end })| format!("{t:?}@{start}..{end}"))
            .collect::<Vec<_>>()
            .join("\n"),
        Err(diags) => {
            if let Some(first) = diags.first() {
                if let Some(span) = first.span {
                    format!(
                        "LEX ERROR [{}] {} @ {}..{}",
                        first.code, first.message, span.start, span.end
                    )
                } else {
                    format!("LEX ERROR [{}] {}", first.code, first.message)
                }
            } else {
                "LEX ERROR: <unknown>".to_string()
            }
        }
    }
}
