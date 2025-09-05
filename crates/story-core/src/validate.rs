use std::collections::HashSet;

use crate::error::{Diagnostic, DiagnosticLevel};
use crate::model::Story;

pub fn validate_story(story: &Story) -> Vec<Diagnostic> {
    let mut out: Vec<Diagnostic> = Vec::new();

    // start exists
    if story.node(&story.start).is_none() {
        out.push(Diagnostic::error(
            "start_not_found",
            "/start",
            format!("Start node '{}' does not exist", story.start),
        ));
    }

    // duplicate ids (defensive: map already dedupes; check raw for reporting)
    let mut seen = HashSet::new();
    for (i, n) in story.raw_nodes.iter().enumerate() {
        if !seen.insert(&n.id) {
            out.push(Diagnostic::error(
                "duplicate_node_id",
                format!("/nodes[{}].id", i),
                format!("Duplicate node id '{}'", n.id),
            ));
        }
    }

    // choices next targets must exist
    for (i, n) in story.raw_nodes.iter().enumerate() {
        for (j, c) in n.choices.iter().enumerate() {
            if story.node(&c.next).is_none() {
                out.push(Diagnostic::error(
                    "unknown_target",
                    format!("/nodes[{}]/choices[{}]/next", i, j),
                    format!("Choice points to unknown node '{}'", c.next),
                ));
            }
        }
    }

    // naive check: referenced vars in conditions should exist
    for (i, n) in story.raw_nodes.iter().enumerate() {
        for (j, c) in n.choices.iter().enumerate() {
            if let Some(cond) = &c.cond {
                if let Some(var) = lhs_ident(cond) {
                    if !story.variables.contains_key(var) {
                        out.push(Diagnostic {
                            level: DiagnosticLevel::Warning,
                            code: "unknown_variable",
                            path: format!("/nodes[{}]/choices[{}]/if", i, j),
                            message: format!("Condition references unknown variable '{}'", var),
                        });
                    }
                }
            }
        }
    }

    out
}

// Extract the left-hand identifier before an operator.
fn lhs_ident(expr: &str) -> Option<&str> {
    const OPS: [&str; 6] = [">=", "<=", "==", "!=", ">", "<"];
    for op in OPS {
        if let Some(idx) = expr.find(op) {
            return Some(expr[..idx].trim());
        }
    }
    None
}
