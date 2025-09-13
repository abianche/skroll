use std::sync::{Arc, Mutex};

use tauri::State;

use crate::{state::AppState, types::NodeView};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Validate a story JSON string using story-core and return diagnostics.
#[tauri::command]
pub fn validate_story(story_json: &str) -> Result<Vec<story_core::Diagnostic>, String> {
    let story = story_core::load_story_from_str(story_json).map_err(|e| e.to_string())?;
    Ok(story_core::validate(&story))
}

/// Load a story from JSON content and initialize StoryState.
#[tauri::command]
pub fn load_story(state: State<'_, Mutex<AppState>>, content: &str) -> Result<(), String> {
    let story = Arc::new(story_core::load_story_from_str(content).map_err(|e| e.to_string())?);
    let st = story_core::new_state(story.clone());
    let mut guard = state.lock().map_err(|_| "state poisoned".to_string())?;
    guard.story = Some(story);
    guard.state = Some(st);
    Ok(())
}

/// Get the current node view (id, text, end flag).
#[tauri::command]
pub fn get_current_node(state: State<'_, Mutex<AppState>>) -> Result<NodeView, String> {
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

/// Get available choices as simple views.
#[tauri::command]
pub fn get_choices(
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<story_core::ChoiceView>, String> {
    let guard = state.lock().map_err(|_| "state poisoned".to_string())?;
    let st = guard
        .state
        .as_ref()
        .ok_or_else(|| "no story loaded".to_string())?;
    Ok(st.available_choices())
}

/// Choose a choice by filtered index.
#[tauri::command]
pub fn choose(state: State<'_, Mutex<AppState>>, index: usize) -> Result<(), String> {
    let mut guard = state.lock().map_err(|_| "state poisoned".to_string())?;
    let st = guard
        .state
        .as_mut()
        .ok_or_else(|| "no story loaded".to_string())?;
    st.choose(index).map_err(|e| e.to_string())
}

/// Reset to the start node and initial variables.
#[tauri::command]
pub fn reset(state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let mut guard = state.lock().map_err(|_| "state poisoned".to_string())?;
    let st = guard
        .state
        .as_mut()
        .ok_or_else(|| "no story loaded".to_string())?;
    st.reset();
    Ok(())
}
