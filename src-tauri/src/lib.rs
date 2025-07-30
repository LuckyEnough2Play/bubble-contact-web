use serde::Serialize;
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tauri_plugin_dialog::DialogExt;
use tauri::Manager;

#[tauri::command]
fn load_contacts(app: tauri::AppHandle) -> Result<Value, String> {
  let path = data_file(&app);
  match fs::read_to_string(&path) {
    Ok(contents) => serde_json::from_str(&contents).map_err(|e| e.to_string()),
    Err(_) => Ok(Value::Array(vec![])),
  }
}

#[tauri::command]
fn save_contacts(app: tauri::AppHandle, contacts: Value) -> Result<(), String> {
  let path = data_file(&app);
  if let Some(dir) = path.parent() {
    if let Err(e) = fs::create_dir_all(dir) {
      return Err(e.to_string());
    }
  }
  fs::write(path, serde_json::to_string_pretty(&contacts).unwrap()).map_err(|e| e.to_string())
}

#[derive(Serialize)]
struct CsvResult {
  canceled: bool,
  content: String,
}

#[tauri::command]
fn import_csv(app: tauri::AppHandle) -> Result<CsvResult, String> {
  if let Some(path) = app.dialog().file().add_filter("CSV", &["csv"]).blocking_pick_file() {
    let path = path.into_path().map_err(|e| e.to_string())?;
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    Ok(CsvResult { canceled: false, content })
  } else {
    Ok(CsvResult { canceled: true, content: String::new() })
  }
}

#[tauri::command]
fn export_csv(app: tauri::AppHandle, csv: String) -> Result<(), String> {
  if let Some(path) = app.dialog().file().add_filter("CSV", &["csv"]).blocking_save_file() {
    let path = path.into_path().map_err(|e| e.to_string())?;
    fs::write(path, csv).map_err(|e| e.to_string())
  } else {
    Ok(())
  }
}

fn data_file(app: &tauri::AppHandle) -> PathBuf {
  app.path().app_data_dir().unwrap().join("contacts.json")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![load_contacts, save_contacts, import_csv, export_csv])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      let _ = app.handle().plugin(tauri_plugin_dialog::init());
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
