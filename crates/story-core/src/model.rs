use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum Value {
    Bool(bool),
    Num(f64),
    Str(String),
}

impl Value {
    pub fn as_bool(&self) -> Option<bool> {
        match self {
            Value::Bool(b) => Some(*b),
            _ => None,
        }
    }
    pub fn as_num(&self) -> Option<f64> {
        match self {
            Value::Num(n) => Some(*n),
            _ => None,
        }
    }
    pub fn as_str(&self) -> Option<&str> {
        match self {
            Value::Str(s) => Some(s),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Story {
    pub start: String,
    pub variables: HashMap<String, Value>,
    #[serde(skip)]
    pub(crate) nodes: HashMap<String, StoryNode>,
    #[serde(skip)]
    pub(crate) raw_nodes: Vec<StoryNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoryNode {
    pub id: String,
    pub text: String,
    #[serde(default)]
    pub choices: Vec<StoryChoice>,
    #[serde(default)]
    pub set: HashMap<String, Value>,
    #[serde(default)]
    pub inc: HashMap<String, f64>,
    #[serde(default)]
    pub end: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoryChoice {
    pub text: String,
    #[serde(rename = "if")]
    #[serde(default)]
    pub cond: Option<String>,
    pub next: String,
}

/// Serializable “view” of a choice for frontends.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChoiceView {
    pub text: String,
    pub next: String,
}

#[derive(Debug, Clone, Deserialize)]
struct StoryFile {
    #[serde(default)]
    variables: HashMap<String, Value>,
    start: String,
    nodes: Vec<StoryNode>,
}

use crate::error::StoryError;

impl Story {
    pub fn from_json_str(s: &str) -> Result<Self, StoryError> {
        let file: StoryFile = serde_json::from_str(s)?;
        let mut map = HashMap::new();
        for n in &file.nodes {
            map.insert(n.id.clone(), n.clone());
        }
        Ok(Story {
            start: file.start,
            variables: file.variables,
            nodes: map,
            raw_nodes: file.nodes,
        })
    }

    pub fn node(&self, id: &str) -> Option<&StoryNode> {
        self.nodes.get(id)
    }
}
