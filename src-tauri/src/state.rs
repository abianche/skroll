use std::sync::Arc;

/// App-scoped state to hold the loaded story and runtime state.
pub struct AppState {
    pub story: Option<Arc<story_core::Story>>,
    pub state: Option<story_core::StoryState>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            story: None,
            state: None,
        }
    }
}

