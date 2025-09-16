use crate::{diagnostic::{Diagnostic, Diagnostics}, span::Span};
use chumsky::{error::Simple, prelude::*};

#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    SectionEqEqEq,   // "==="
    Star,            // "*"
    Arrow,           // "->"
    LBrace,          // "{"
    RBrace,          // "}"
    Ident(String),
    String(String),
    Number(i64),
    Newline,
    Text(String),    // generic text line content
    Comment,         // //...
    Eq,              // "=" (for future set statements)
    Gt,
    Ge,
    Lt,
    Le,
    EqEq,
    Ne,
}

pub type SpannedToken = (Token, Span);

pub fn lexer() -> impl Parser<char, Vec<SpannedToken>, Error = chumsky::error::Cheap<char>> {
    let newline = just('\n').to(Token::Newline);
    let whitespace = one_of(" \t\r").repeated().ignored();

    let comment = just("//")
        .then(take_until(text::newline().or(end())))
        .to(Token::Comment);

    let eqeq = just("==").to(Token::EqEq);
    let ne = just("!=").to(Token::Ne);
    let ge = just(">=").to(Token::Ge);
    let le = just("<=").to(Token::Le);

    let arrow = just("->").to(Token::Arrow);
    let three_eq = just("===").to(Token::SectionEqEqEq);
    let lbrace = just('{').to(Token::LBrace);
    let rbrace = just('}').to(Token::RBrace);
    let star = just('*').to(Token::Star);
    let gt = just('>').to(Token::Gt);
    let lt = just('<').to(Token::Lt);
    let eq = just('=').to(Token::Eq);

    let ident = text::ident().map(Token::Ident);

    let number = text::int(10).from_str().unwrapped().map(Token::Number);

    let string = just('"')
        .ignore_then(filter(|c| *c != '"').repeated().collect::<String>())
        .then_ignore(just('"'))
        .map(Token::String);

    let text_line = filter(|c| *c != '\n')
        .repeated()
        .collect::<String>()
        .map(|s| Token::Text(s.trim_end().to_string()));

    let token = choice((
        comment,
        three_eq,
        arrow,
        lbrace,
        rbrace,
        star,
        eqeq,
        ne,
        ge,
        le,
        gt,
        lt,
        eq,
        string,
        number,
        ident,
        newline,
        text_line,
    ));

    token
        .map_with_span(|tok, span| (tok, Span::new(span.start, span.end)))
        .padded_by(whitespace.repeated())
        .repeated()
}

pub fn lex(src: &str) -> Result<Vec<SpannedToken>, Diagnostics> {
    lexer().parse(src).map_err(|errs| {
        errs.into_iter()
            .map(|err: Simple<char>| {
                let span = err.span();
                Diagnostic::error("E0001", Some(Span::new(span.start, span.end)), err.to_string())
            })
            .collect()
    })
}
