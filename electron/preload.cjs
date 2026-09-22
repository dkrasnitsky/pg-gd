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
  onItemsUpdated: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("items:updated", listener);
    return () => ipcRenderer.removeListener("items:updated", listener);
  },
});

contextBridge.exposeInMainWorld("workspaceGoogle", {
  getStatus: () => ipcRenderer.invoke("google:get-status"),
  connect: () => ipcRenderer.invoke("google:connect"),
  createLotteryConfig: (title) => ipcRenderer.invoke("google:create-lottery-config", title),
  buildLotteryConfig: (sheetName, items) => ipcRenderer.invoke("google:build-lottery-config", sheetName, items),
  fetchTier: (tag) => ipcRenderer.invoke("google:fetch-tier", tag),
  getNextLotteryId: () => ipcRenderer.invoke("google:get-next-lottery-id"),
  getSegments: () => ipcRenderer.invoke("google:get-segments"),
  getSegmentExpressions: () => ipcRenderer.invoke("google:get-segment-expressions"),
  syncEventCenter: () => ipcRenderer.invoke("google:sync-event-center"),
  setEventEnabled: (payload) => ipcRenderer.invoke("google:set-event-enabled", payload),
  syncOffers: () => ipcRenderer.invoke("google:sync-offers"),
  saveOffer: (payload) => ipcRenderer.invoke("google:save-offer", payload),
  deleteOffer: (payload) => ipcRenderer.invoke("google:delete-offer", payload),
  applyOfferCampaign: (payload) => ipcRenderer.invoke("google:apply-offer-campaign", payload),
  applyOfferCampaignTest: (payload) => ipcRenderer.invoke("google:apply-offer-campaign-test", payload),
  syncActiveMaps: () => ipcRenderer.invoke("google:sync-active-maps"),
  getNextTraderVanId: () => ipcRenderer.invoke("google:get-next-trader-van-id"),
  applyTraderVan: (payload) => ipcRenderer.invoke("google:apply-trader-van", payload),
  syncTemplateEvents: (target) => ipcRenderer.invoke("google:sync-template-events", target),
  loadTemplateEvent: (payload) => ipcRenderer.invoke("google:load-template-event", payload),
  saveTemplateEvent: (payload) => ipcRenderer.invoke("google:save-template-event", payload),
  getRewardPools: () => ipcRenderer.invoke("google:get-reward-pools"),
  applyLotteryPartition: (partition) => ipcRenderer.invoke("google:apply-lottery-partition", partition),
  getNextCardRouletteId: (isTest) => ipcRenderer.invoke("google:get-next-card-roulette-id", isTest),
  applyCardRoulettePartition: (partition) => ipcRenderer.invoke("google:apply-card-roulette-partition", partition),
  getNextPersonalEventId: (eventType) => ipcRenderer.invoke("google:get-next-personal-event-id", eventType),
  applyPersonalEventBoard: (partition) => ipcRenderer.invoke("google:apply-personal-event-board", partition),
  applyPersonalEventLinear: (partition) => ipcRenderer.invoke("google:apply-personal-event-linear", partition),
  applyPersonalEventTasksHorizontal: (partition) => ipcRenderer.invoke("google:apply-personal-event-tasks-horizontal", partition),
  applyPersonalEventTasksVertical: (partition) => ipcRenderer.invoke("google:apply-personal-event-tasks-vertical", partition),
  applyPersonalEventTopUp: (partition) => ipcRenderer.invoke("google:apply-personal-event-topup", partition),
  applyPersonalEventWheel: (partition) => ipcRenderer.invoke("google:apply-personal-event-wheel", partition),
  getTaskReference: () => ipcRenderer.invoke("google:get-task-reference"),
});

contextBridge.exposeInMainWorld("workspaceJira", {
  getStatus: () => ipcRenderer.invoke("jira:get-status"),
  setCredentials: (email, token) => ipcRenderer.invoke("jira:set-credentials", email, token),
  clearCredentials: () => ipcRenderer.invoke("jira:clear-credentials"),
});

contextBridge.exposeInMainWorld("iconLibrary", {
  list: () => ipcRenderer.invoke("icons:list"),
});

contextBridge.exposeInMainWorld("workspaceCatalog", {
  syncFromXlsx: () => ipcRenderer.invoke("catalog:sync-from-xlsx"),
  refreshAnalytics: () => ipcRenderer.invoke("catalog:refresh-analytics"),
  syncRealNames: () => ipcRenderer.invoke("catalog:sync-real-names"),
});
