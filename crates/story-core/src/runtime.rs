use std::collections::HashMap;
use std::sync::Arc;

use crate::error::StoryError;
use crate::model::{ChoiceView, Story, StoryChoice, StoryNode, Value};

#[derive(Debug, Clone)]
pub struct StoryState {
    story: Arc<Story>,
    story_start: String,
    current_id: String,
    vars: HashMap<String, Value>,
    initial_vars: HashMap<String, Value>,
}

impl StoryState {
    pub fn new(story: Arc<Story>) -> Self {
        let mut s = Self {
            story: story.clone(),
            story_start: story.start.clone(),
            current_id: story.start.clone(),
            vars: story.variables.clone(),
            initial_vars: story.variables.clone(),
        };
        // apply effects of initial node
        if let Some(n) = s.story.node(&s.current_id).cloned() {
            s.apply_enter_effects(&n);
        }
        s
    }

    pub fn current_node(&self) -> &StoryNode {
        self.story
            .node(&self.current_id)
            .expect("node must exist after validation")
    }

    pub fn available_choices(&self) -> Vec<ChoiceView> {
        let node = self.current_node();
        node.choices
            .iter()
            .filter(|c| c.cond.as_ref().map_or(true, |e| eval(&self.vars, e)))
            .map(|c| ChoiceView {
                text: c.text.clone(),
                next: c.next.clone(),
            })
            .collect()
    }

    pub fn choose(&mut self, filtered_index: usize) -> Result<(), StoryError> {
        let node = self.current_node().clone();
        let avail: Vec<&StoryChoice> = node
            .choices
            .iter()
            .filter(|c| c.cond.as_ref().map_or(true, |e| eval(&self.vars, e)))
            .collect();

        if filtered_index >= avail.len() {
            return Err(StoryError::Runtime {
                code: "choice_oob",
                message: format!("Choice index {} out of range", filtered_index),
            });
        }
        self.current_id = avail[filtered_index].next.clone();

        // enter next node and apply effects
        let next = self.current_node().clone();
        self.apply_enter_effects(&next);
        Ok(())
    }

    pub fn is_end(&self) -> bool {
        self.current_node().end
    }

    pub fn reset(&mut self) {
        self.current_id = self.story_start.clone();
        self.vars = self.initial_vars.clone();
        if let Some(n) = self.story.node(&self.current_id).cloned() {
            self.apply_enter_effects(&n);
        }
    }

    pub fn to_json(&self) -> Result<String, StoryError> {
        #[derive(serde::Serialize)]
        struct Snap<'a> {
            current_id: &'a str,
            vars: &'a HashMap<String, Value>,
        }
        Ok(serde_json::to_string(&Snap {
            current_id: &self.current_id,
            vars: &self.vars,
        })?)
    }

    pub fn from_json(story: Arc<Story>, s: &str) -> Result<Self, StoryError> {
        #[derive(serde::Deserialize)]
        struct Snap {
            current_id: String,
            vars: HashMap<String, Value>,
        }
        let snap: Snap = serde_json::from_str(s)?;
        if story.node(&snap.current_id).is_none() {
            return Err(StoryError::InvalidStory {
                code: "snapshot_unknown_node",
                path: "/current_id".into(),
                message: format!("Snapshot references unknown node '{}'", snap.current_id),
            });
        }
        let mut st = Self {
            story: story.clone(),
            story_start: story.start.clone(),
            current_id: snap.current_id,
            vars: snap.vars,
            initial_vars: story.variables.clone(),
        };
        // Re-apply enter effects for the current node to ensure consistency if needed
        if let Some(n) = st.story.node(&st.current_id).cloned() {
            st.apply_enter_effects(&n);
        }
        Ok(st)
    }

    // ---------- internals ----------

    fn apply_enter_effects(&mut self, n: &StoryNode) {
        for (k, v) in &n.set {
            self.vars.insert(k.clone(), v.clone());
        }
        for (k, add) in &n.inc {
            let cur = self.vars.get(k).and_then(|v| v.as_num()).unwrap_or(0.0);
            self.vars.insert(k.clone(), Value::Num(cur + add));
        }
    }
}

// ---- Simple eval for conditions: supports one comparison op ----
fn eval(vars: &HashMap<String, Value>, expr: &str) -> bool {
    const OPS: [&str; 6] = [">=", "<=", "==", "!=", ">", "<"];
    let (op, lhs, rhs) = match OPS.iter().find_map(|op| expr.find(op).map(|i| (*op, i))) {
        Some((op, idx)) => {
            let left = expr[..idx].trim();
            let right = expr[idx + op.len()..].trim();
            (op, left, right)
        }
        None => return false,
    };

    let lv = read_term(vars, lhs);
    let rv = read_term(vars, rhs);

    match (op, lv, rv) {
        ("==", Some(a), Some(b)) => a == b,
        ("!=", Some(a), Some(b)) => a != b,
        (">=", Some(Value::Num(a)), Some(Value::Num(b))) => a >= b,
        ("<=", Some(Value::Num(a)), Some(Value::Num(b))) => a <= b,
        (">", Some(Value::Num(a)), Some(Value::Num(b))) => a > b,
        ("<", Some(Value::Num(a)), Some(Value::Num(b))) => a < b,
        _ => false,
    }
}

fn read_term(vars: &HashMap<String, Value>, s: &str) -> Option<Value> {
    if s.eq_ignore_ascii_case("true") {
        return Some(Value::Bool(true));
    }
    if s.eq_ignore_ascii_case("false") {
        return Some(Value::Bool(false));
    }
    if let Ok(n) = s.parse::<f64>() {
        return Some(Value::Num(n));
    }
    // quoted string?
    if (s.starts_with('"') && s.ends_with('"')) || (s.starts_with('\'') && s.ends_with('\'')) {
        let inner = &s[1..s.len() - 1];
        return Some(Value::Str(inner.to_string()));
    }
    // variable
    vars.get(s).cloned()
}
