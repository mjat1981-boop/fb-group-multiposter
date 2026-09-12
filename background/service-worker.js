const FREE_GROUP_LIMIT = 3;

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get([
    "templates",
    "groups",
    "proUnlocked",
  ]);
  const patch = {};
  if (!Array.isArray(data.templates)) {
    patch.templates = [
      {
        id: crypto.randomUUID(),
        title: "Sample local ad",
        body: "Hi all — offering [service] in [area]. Message me if interested!",
      },
    ];
  }
  if (!Array.isArray(data.groups)) patch.groups = [];
  if (typeof data.proUnlocked !== "boolean") patch.proUnlocked = false;
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GET_LIMITS") {
    chrome.storage.local.get(["proUnlocked"]).then((d) => {
      sendResponse({
        freeGroupLimit: FREE_GROUP_LIMIT,
        proUnlocked: !!d.proUnlocked,
      });
    });
    return true;
  }
});
