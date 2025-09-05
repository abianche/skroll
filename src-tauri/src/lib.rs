// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Validate a story JSON string using story-core and return diagnostics.
#[tauri::command]
fn validate_story(story_json: &str) -> Result<Vec<story_core::Diagnostic>, String> {
    let story = story_core::load_story_from_str(story_json).map_err(|e| e.to_string())?;
    Ok(story_core::validate(&story))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, validate_story])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
