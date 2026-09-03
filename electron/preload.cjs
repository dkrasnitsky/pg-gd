const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopWindow", {
  minimize: () => ipcRenderer.send("window:minimize"),
  toggleMaximize: () => ipcRenderer.send("window:toggle-maximize"),
  close: () => ipcRenderer.send("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
  onMaximizedChange: (callback) => {
    const listener = (_event, maximized) => callback(maximized);
    ipcRenderer.on("window:maximized-change", listener);
    return () => ipcRenderer.removeListener("window:maximized-change", listener);
  },
  onPopupClosed: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("workspace:popup-closed", listener);
    return () => ipcRenderer.removeListener("workspace:popup-closed", listener);
  },
});

contextBridge.exposeInMainWorld("workspaceStore", {
  read: (key) => ipcRenderer.invoke("store:read", key),
  write: (key, value) => ipcRenderer.invoke("store:write", key, value),
});

contextBridge.exposeInMainWorld("workspaceGoogle", {
  createLotteryConfig: (title) => ipcRenderer.invoke("google:create-lottery-config", title),
  buildLotteryConfig: (sheetName, items) => ipcRenderer.invoke("google:build-lottery-config", sheetName, items),
  fetchTier: (tag) => ipcRenderer.invoke("google:fetch-tier", tag),
  getNextLotteryId: () => ipcRenderer.invoke("google:get-next-lottery-id"),
  getSegments: () => ipcRenderer.invoke("google:get-segments"),
  getRewardPools: () => ipcRenderer.invoke("google:get-reward-pools"),
  applyLotteryPartition: (partition) => ipcRenderer.invoke("google:apply-lottery-partition", partition),
});

contextBridge.exposeInMainWorld("iconLibrary", {
  list: () => ipcRenderer.invoke("icons:list"),
});

contextBridge.exposeInMainWorld("workspaceCatalog", {
  syncFromXlsx: () => ipcRenderer.invoke("catalog:sync-from-xlsx"),
});
