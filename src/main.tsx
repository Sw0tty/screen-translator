import React from "react";
import ReactDOM from "react-dom/client";
import { invoke } from '@tauri-apps/api/core';
import { Window } from '@tauri-apps/api/window';
import { App } from "./components/app/app.component";
import { APIEndpoints } from "./enums/api-endpoints.enum";


async function captureAndOpen() {
  try {
    const dataUrl: string = await invoke(APIEndpoints.capture_monitor_screenshot);
    const win = await Window.getCurrent();
    if (win) {
      await win.show();
      await win.setFocus();
      ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
        <React.StrictMode>
          <App dataUrl={dataUrl} />
        </React.StrictMode>
      );
      // (document.getElementById("root") as HTMLElement).innerHTML = '';
    }
  } catch (err) {
    console.error('Ошибка при открытии окна: ', err);
  }
}

captureAndOpen();
