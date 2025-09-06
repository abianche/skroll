use std::sync::{Arc, Mutex};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Simple app-scoped state to hold the loaded story and runtime state.
struct AppState {
    story: Option<Arc<story_core::Story>>,
    state: Option<story_core::StoryState>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            story: None,
            state: None,
        }
    }
}

// Validate a story JSON string using story-core and return diagnostics.
#[tauri::command]
fn validate_story(story_json: &str) -> Result<Vec<story_core::Diagnostic>, String> {
    let story = story_core::load_story_from_str(story_json).map_err(|e| e.to_string())?;
    Ok(story_core::validate(&story))
}

// Load a story from JSON content and initialize StoryState.
#[tauri::command]
fn load_story(state: tauri::State<'_, Mutex<AppState>>, content: &str) -> Result<(), String> {
    let story = Arc::new(story_core::load_story_from_str(content).map_err(|e| e.to_string())?);
    let st = story_core::new_state(story.clone());
    let mut guard = state.lock().map_err(|_| "state poisoned".to_string())?;
    guard.story = Some(story);
    guard.state = Some(st);
    Ok(())
}

// Get the current node view (id, text, end flag).
#[derive(serde::Serialize)]
struct NodeView {
    id: String,
    text: String,
    end: bool,
}

#[tauri::command]
fn get_current_node(state: tauri::State<'_, Mutex<AppState>>) -> Result<NodeView, String> {
    let guard = state.lock().map_err(|_| "state poisoned".to_string())?;
    let st = guard
        .state
        .as_ref()
        .ok_or_else(|| "no story loaded".to_string())?;
    let id = st.current_node().id.clone();
    let text = st.current_node().text.clone();
    let end = st.is_end();
    drop(guard);
    Ok(NodeView { id, text, end })
}

// Get available choices as simple views.
#[tauri::command]
fn get_choices(
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<Vec<story_core::ChoiceView>, String> {
    let guard = state.lock().map_err(|_| "state poisoned".to_string())?;
    let st = guard
        .state
        .as_ref()
        .ok_or_else(|| "no story loaded".to_string())?;
    Ok(st.available_choices())
}

// Choose a choice by filtered index.
#[tauri::command]
fn choose(state: tauri::State<'_, Mutex<AppState>>, index: usize) -> Result<(), String> {
    let mut guard = state.lock().map_err(|_| "state poisoned".to_string())?;
    let st = guard
        .state
        .as_mut()
        .ok_or_else(|| "no story loaded".to_string())?;
    st.choose(index).map_err(|e| e.to_string())
}

// Reset to the start node and initial variables.
#[tauri::command]
fn reset(state: tauri::State<'_, Mutex<AppState>>) -> Result<(), String> {
    let mut guard = state.lock().map_err(|_| "state poisoned".to_string())?;
    let st = guard
        .state
        .as_mut()
        .ok_or_else(|| "no story loaded".to_string())?;
    st.reset();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            greet,
            validate_story,
            load_story,
            get_current_node,
            get_choices,
            choose,
            reset
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
