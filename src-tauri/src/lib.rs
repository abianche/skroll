use std::sync::Mutex;

mod state;
mod types;
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(Mutex::new(state::AppState::default()))
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::validate_story,
            commands::load_story,
            commands::get_current_node,
            commands::get_choices,
            commands::choose,
            commands::reset
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
