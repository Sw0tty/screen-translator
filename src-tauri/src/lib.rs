mod api_commands;
use api_commands::{
  capture_monitor_screenshot,
};
use tauri::{
  menu::{Menu, MenuItem},
  tray::TrayIconBuilder,
};
use uuid::Uuid;


fn create_window(app: &tauri::AppHandle) -> tauri::Result<()> {
  tauri::WebviewWindowBuilder::new(
      app,
      Uuid::new_v4(),
      tauri::WebviewUrl::App("index.html".into())
  )
  .visible(false)
  .title("Screenshot")
  .resizable(true)
  .center()
  .maximized(true)
  .min_inner_size(800.0, 600.0)
  .build()?;

  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      // #[cfg(debug_assertions)] // only include this code on debug builds
      // {
      //   use tauri::Manager;

      //   let window = app.get_webview_window("main").unwrap();
      //   window.open_devtools();
      //   window.close_devtools();
      // }

      #[cfg(desktop)]
      {
        use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

        let ctrl_n_shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyN);
        app.handle().plugin(
          tauri_plugin_global_shortcut::Builder::new().with_handler(move |_app, shortcut, event| {
            if shortcut == &ctrl_n_shortcut {
              match event.state() {
                ShortcutState::Pressed => {
                  let _result = create_window(_app);
                }
                ShortcutState::Released => {}
              }
            }
          })
          .build(),
        )?;

        app.global_shortcut().register(ctrl_n_shortcut)?;
      }
      

      let make_screenshot_i = MenuItem::with_id(app, "screenshot", "Make screenshot", true, Some("Ctrl+Shift+N")).unwrap();
      let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&make_screenshot_i, &quit_i])?;
      let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .on_menu_event(move |app_clone, event| match event.id.as_ref() {
          "screenshot" => {
            let _result = create_window(app_clone);
          }
          "quit" => {
            app_clone.exit(0);
          }
          _ => {}
        })
        .icon(app.default_window_icon().unwrap().clone())
        .build(app)?;
      Ok(())
    })
    .plugin(tauri_plugin_http::init()) 
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_screenshots::init())
    .plugin(tauri_plugin_cors_fetch::init())
    .invoke_handler(tauri::generate_handler![capture_monitor_screenshot])
    .build(tauri::generate_context!())
    .expect("error while running tauri application")
    .run(|_app_handle, event| {
      match event {
        tauri::RunEvent::ExitRequested { code, api, .. } => {
          if code.is_none() {
            api.prevent_exit();
          }
        }
        _ => {}
      }
    });
}


// {
//   "title": "test-app",
//   "width": 800,
//   "height": 600
// }

// pub fn run() {
//     tauri::Builder::default()
//         .setup(|app| {
//             #[cfg(desktop)]
//             {
//                 use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

//                 let ctrl_n_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyN);
//                 app.handle().plugin(
//                     tauri_plugin_global_shortcut::Builder::new().with_handler(move |_app, shortcut, event| {
//                         println!("{:?}", shortcut);
//                         if shortcut == &ctrl_n_shortcut {
//                             match event.state() {
//                               ShortcutState::Pressed => {
//                                 println!("Ctrl-N Pressed!");
//                               }
//                               ShortcutState::Released => {
//                                 println!("Ctrl-N Released!");
//                               }
//                             }
//                         }
//                     })
//                     .build(),
//                 )?;

//                 app.global_shortcut().register(ctrl_n_shortcut)?;
//             }
//             Ok(())
//         })
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");
// }

// // change-menu-status
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// use tauri::{
//     image::Image,
//     menu::{CheckMenuItemBuilder, IconMenuItem, MenuBuilder, MenuItem, SubmenuBuilder},
// };

// fn main() {
//     tauri::Builder::default()
//         .setup(|app| {
//             let check_sub_item_en = CheckMenuItemBuilder::with_id("en", "EN")
//                 .checked(true)
//                 .build(app)?;

//             let check_sub_item_zh = CheckMenuItemBuilder::with_id("zh", "ZH")
//                 .checked(false)
//                 .build(app)?;

//             let text_menu = MenuItem::with_id(
//                 app,
//                 "change_text",
//                 &"Change menu".to_string(),
//                 true,
//                 Some("Ctrl+Z"),
//             )
//             .unwrap();

//             let icon_menu = IconMenuItem::with_id(
//                 app,
//                 "change_icon",
//                 &"Change icon menu",
//                 true,
//                 Some(Image::from_bytes(include_bytes!("../icons/icon.png")).unwrap()),
//                 Some("Ctrl+F"),
//             )
//             .unwrap();

//             let menu_item = SubmenuBuilder::new(app, "Change menu")
//                 .item(&text_menu)
//                 .item(&icon_menu)
//                 .items(&[&check_sub_item_en, &check_sub_item_zh])
//                 .build()?;
//             let menu = MenuBuilder::new(app).items(&[&menu_item]).build()?;
//             app.set_menu(menu)?;
//             app.on_menu_event(move |_app_handle: &tauri::AppHandle, event| {
//                 match event.id().0.as_str() {
//                     "change_text" => {
//                         text_menu
//                             .set_text("changed menu text")
//                             .expect("Change text error");

//                         text_menu
//                             .set_text("changed menu text")
//                             .expect("Change text error");
//                     }
//                     "change_icon" => {
//                         icon_menu
//                             .set_text("changed menu-icon text")
//                             .expect("Change text error");
//                         icon_menu
//                             .set_icon(Some(
//                                 Image::from_bytes(include_bytes!("../icons/icon-2.png")).unwrap(),
//                             ))
//                             .expect("Change icon error");
//                     }

//                     "en" | "zh" => {
//                         check_sub_item_en
//                             .set_checked(event.id().0.as_str() == "en")
//                             .expect("Change check error");
//                         check_sub_item_zh
//                             .set_checked(event.id().0.as_str() == "zh")
//                             .expect("Change check error");
//                         check_sub_item_zh.set_accelerator(Some("Ctrl+L"))
//                         .expect("Change accelerator error");
//                     }
//                     _ => {
//                         println!("unexpected menu event");
//                     }
//                 }
//             });

//             Ok(())
//         })
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");
// }
