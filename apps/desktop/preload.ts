import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("parallel", {
  onStatus: (callback: (status: unknown) => void) => {
    ipcRenderer.on("workspace-status", (_event, status) => callback(status));
  },
  runSmokeTest: (task: "google" | "youtube", query: string) => {
    return ipcRenderer.invoke("run-smoke-test", task, query);
  },
});
