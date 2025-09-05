mod error;
mod model;
mod runtime;
mod validate;

pub use error::{Diagnostic, DiagnosticLevel, StoryError};
pub use model::{ChoiceView, Story, StoryChoice, StoryNode, Value};
pub use runtime::StoryState;
pub use validate::validate_story;

use std::sync::Arc;

/// Convenience: parse Story from a JSON string.
pub fn load_story_from_str(s: &str) -> Result<Story, StoryError> {
    Story::from_json_str(s)
}

/// Validate a Story and return diagnostics (errors/warnings).
pub fn validate(story: &Story) -> Vec<Diagnostic> {
    validate_story(story)
}

/// Create a new StoryState starting at `story.start` and applying enter effects.
pub fn new_state(story: Arc<Story>) -> StoryState {
    StoryState::new(story)
}

/// JSON (string) snapshot of current state.
pub fn state_to_json(state: &StoryState) -> Result<String, StoryError> {
    state.to_json()
}

/// Restore state from JSON snapshot (validates node id).
pub fn state_from_json(story: Arc<Story>, s: &str) -> Result<StoryState, StoryError> {
    StoryState::from_json(story, s)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;

    const SAMPLE: &str = r#"
    {
      "variables": { "hasKey": false, "courage": 0 },
      "start": "intro",
      "nodes": [
        { "id":"intro","text":"You wake up.","choices":[
          {"text":"Search","next":"search"},
          {"text":"Knock","next":"knock"}
        ]},
        { "id":"search","text":"You find a key.","set":{"hasKey":true},"choices":[
          {"text":"Back","next":"door"}
        ]},
        { "id":"knock","text":"Silence. Courage +1.","inc":{"courage":1},"choices":[
          {"text":"Back","next":"door"}
        ]},
        { "id":"door","text":"A locked door.","choices":[
          {"text":"Use key","if":"hasKey == true","next":"open"},
          {"text":"Force it","if":"courage >= 2","next":"force"},
          {"text":"Keep knocking","next":"knock"}
        ]},
        { "id":"open","text":"Freedom.","end":true },
        { "id":"force","text":"Broken latch. Freedom.","end":true }
      ]
    }"#;

    #[test]
    fn smoke() {
        let story = Arc::new(load_story_from_str(SAMPLE).unwrap());
        let diags = validate(&story);
        assert!(diags.iter().all(|d| d.level != DiagnosticLevel::Error));

        let mut st = new_state(story.clone());
        assert_eq!(st.current_node().id, "intro");
        // choose "Search"
        st.choose(0).unwrap();
        assert_eq!(st.current_node().id, "search");
        // back to door
        st.choose(0).unwrap();
        assert_eq!(st.current_node().id, "door");
        // now "Use key" visible
        let choices = st.available_choices();
        assert!(choices.iter().any(|c| c.text == "Use key"));
        st.choose(0).unwrap(); // filtered order keeps "Use key" first
        assert!(st.is_end());

        // save / load
        let snap = state_to_json(&st).unwrap();
        let st2 = state_from_json(story.clone(), &snap).unwrap();
        assert!(st2.is_end());
    }
}
