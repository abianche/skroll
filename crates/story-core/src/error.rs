use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum StoryError {
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Invalid story: {message} (code: {code}, path: {path})")]
    InvalidStory {
        code: &'static str,
        message: String,
        path: String,
    },

    #[error("Runtime error: {message} (code: {code})")]
    Runtime { code: &'static str, message: String },
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DiagnosticLevel {
    Error,
    Warning,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Diagnostic {
    pub level: DiagnosticLevel,
    pub code: &'static str,
    pub message: String,
    pub path: String,
}

impl Diagnostic {
    pub fn error(code: &'static str, path: impl Into<String>, msg: impl Into<String>) -> Self {
        Self {
            level: DiagnosticLevel::Error,
            code,
            message: msg.into(),
            path: path.into(),
        }
    }
    pub fn warn(code: &'static str, path: impl Into<String>, msg: impl Into<String>) -> Self {
        Self {
            level: DiagnosticLevel::Warning,
            code,
            message: msg.into(),
            path: path.into(),
        }
    }
}
