// use libretranslate::{translate, Language};
use base64::{engine::general_purpose, Engine as _};
use image::ImageFormat;
use std::{io::Cursor};
use xcap::Monitor;
// use std::sync::Mutex;
// use tokio;


#[tauri::command]
pub async fn capture_monitor_screenshot() -> Result<String, String> {
    // 1. Получаем список всех мониторов
    let monitors = Monitor::all()
        .map_err(|e| format!("Не удалось получить список мониторов: {e}"))?;

    // 2. Берём основной (первый) монитор
    let monitor = monitors
        .first()
        .ok_or("Мониторы не найдены")?;

    // 3. Захватываем изображение
    let image = monitor
        .capture_image()
        .map_err(|e| format!("Не удалось сделать скриншот: {e}"))?;

    // 4. Кодируем в PNG
    let mut buffer = Vec::new();
    image
        .write_to(&mut Cursor::new(&mut buffer), ImageFormat::Png)
        .map_err(|e| format!("Ошибка кодирования PNG: {e}"))?;

    // 5. Конвертируем в base64 и формируем data URL
    let base64_str = general_purpose::STANDARD.encode(&buffer);

    //*state.0.lock().map_err(|e| format!("Lock: {e}"))? = Some(base64_str);

    Ok(format!("data:image/png;base64,{base64_str}"))
}
