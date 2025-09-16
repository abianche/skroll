//! Versioned JSON document types emitted by the compiler.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

pub const SCHEMA_VERSION: &str = "1.0.0";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoryDoc {
    pub schema_version: String,
    #[serde(rename = "$schema")]
    pub schema_url: String,
    pub entry: String,
    pub variables: BTreeMap<String, ValueDoc>,
    pub nodes: Vec<StoryNodeDoc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "t", content = "v")]
pub enum ValueDoc {
    Bool(bool),
    Int(i64),
    Str(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StoryNodeDoc {
    pub id: String,
    pub lines: Vec<String>,
    pub choices: Vec<ChoiceDoc>,
    pub divert: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ChoiceDoc {
    pub text: String,
    pub condition: Option<String>,
    pub target: String,
}

impl StoryDoc {
    pub fn empty_with_entry(entry: impl Into<String>) -> Self {
        Self {
            schema_version: SCHEMA_VERSION.to_string(),
            schema_url: "https://example.com/schemas/skroll-story-1.0.0.json".to_string(),
            entry: entry.into(),
            variables: BTreeMap::new(),
            nodes: Vec::new(),
        }
    }
}
