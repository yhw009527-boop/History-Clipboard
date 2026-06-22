const statusElement = document.querySelector("[data-status]");
const listElement = document.querySelector("[data-history-list]");
const searchInput = document.querySelector("[data-search]");
const totalCountElement = document.querySelector("[data-total-count]");
const retentionSelect = document.querySelector("[data-retention-days]");
const launchAtLoginInput = document.querySelector("[data-launch-at-login]");

let currentItems = [];
let currentSearchQuery = "";
let currentSettings = {
  retentionDays: 3,
  launchAtLogin: false
};

if (statusElement) {
  statusElement.textContent = "正在监听剪贴板";
}

function formatCopiedAt(copiedAt) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(copiedAt));
}

function renderHistory(items) {
  if (!listElement) {
    return;
  }

  listElement.replaceChildren();

  const visibleItems = items.filter((item) => {
    if (item.type === "image") {
      return currentSearchQuery.length === 0;
    }

    return item.text.toLowerCase().includes(currentSearchQuery.toLowerCase());
  });

  if (totalCountElement) {
    totalCountElement.textContent = `共 ${items.length} 条`;
  }

  if (visibleItems.length === 0) {
    const emptyElement = document.createElement("section");
    emptyElement.className = "empty-state";
    emptyElement.setAttribute("aria-label", "剪贴板历史");

    const titleElement = document.createElement("h2");
    titleElement.textContent = items.length === 0 ? "暂无剪贴板记录" : "没有匹配的文字记录";

    emptyElement.append(titleElement);
    listElement.append(emptyElement);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const item of visibleItems) {
    const card = document.createElement("article");
    card.className = "history-card";
    card.dataset.historyItem = item.id;
    card.dataset.pinned = String(item.pinned);

    const contentButton = document.createElement("button");
    contentButton.className = "history-card__content";
    contentButton.type = "button";
    contentButton.dataset.copyAction = item.id;

    const previewElement = document.createElement("span");

    if (item.type === "image") {
      previewElement.className = "history-card__image-wrap";

      const imageElement = document.createElement("img");
      imageElement.className = "history-card__image";
      imageElement.src = item.imageDataUrl;
      imageElement.alt = "图片剪贴板记录";

      const labelElement = document.createElement("span");
      labelElement.className = "history-card__image-label";
      labelElement.textContent = `图片 ${(item.byteSize / 1024).toFixed(1)} KB`;

      previewElement.append(imageElement, labelElement);
    } else {
      previewElement.className = "history-card__text";
      previewElement.textContent = item.text;
    }

    const timeElement = document.createElement("span");
    timeElement.className = "history-card__time";
    timeElement.textContent = formatCopiedAt(item.copiedAt);

    contentButton.append(previewElement, timeElement);
    contentButton.addEventListener("click", async () => {
      const copied = await window.clipboardHistory.copyItem(item.id);

      if (statusElement) {
        statusElement.textContent = copied ? "已复制回剪贴板" : "记录不存在";
      }
    });

    const actionsElement = document.createElement("div");
    actionsElement.className = "history-card__actions";

    const pinButton = document.createElement("button");
    pinButton.className = "icon-button";
    pinButton.type = "button";
    pinButton.title = item.pinned ? "取消置顶" : "置顶";
    pinButton.setAttribute("aria-label", item.pinned ? "取消置顶" : "置顶");
    pinButton.textContent = item.pinned ? "★" : "☆";
    pinButton.addEventListener("click", async () => {
      const toggled = await window.clipboardHistory.toggleItemPinned(item.id);

      if (statusElement) {
        statusElement.textContent = toggled ? "置顶状态已更新" : "记录不存在";
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-button icon-button--danger";
    deleteButton.type = "button";
    deleteButton.title = "删除";
    deleteButton.setAttribute("aria-label", "删除");
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", async () => {
      const deleted = await window.clipboardHistory.deleteItem(item.id);

      if (statusElement) {
        statusElement.textContent = deleted ? "记录已删除" : "记录不存在";
      }
    });

    actionsElement.append(pinButton, deleteButton);
    card.append(contentButton, actionsElement);
    fragment.append(card);
  }

  listElement.append(fragment);
}

function renderSettings(settings) {
  currentSettings = settings;

  if (retentionSelect) {
    retentionSelect.value = String(settings.retentionDays);
  }

  if (launchAtLoginInput) {
    launchAtLoginInput.checked = settings.launchAtLogin;
  }
}

searchInput?.addEventListener("input", () => {
  currentSearchQuery = searchInput.value.trim();
  renderHistory(currentItems);
});

retentionSelect?.addEventListener("change", async () => {
  const retentionDays = Number(retentionSelect.value);

  if (![1, 3, 5].includes(retentionDays)) {
    renderSettings(currentSettings);
    return;
  }

  const settings = await window.clipboardHistory.setRetentionDays(retentionDays);
  renderSettings(settings);

  if (statusElement) {
    statusElement.textContent = `已设置保留 ${settings.retentionDays} 天`;
  }
});

launchAtLoginInput?.addEventListener("change", async () => {
  const settings = await window.clipboardHistory.setLaunchAtLogin(launchAtLoginInput.checked);
  renderSettings(settings);

  if (statusElement) {
    statusElement.textContent = settings.launchAtLogin ? "已开启开机自启" : "已关闭开机自启";
  }
});

window.clipboardHistory.getHistory().then((items) => {
  currentItems = items;
  renderHistory(currentItems);
});

window.clipboardHistory.getSettings().then(renderSettings);

window.clipboardHistory.onHistoryChanged((items) => {
  currentItems = items;
  renderHistory(currentItems);

  if (statusElement) {
    statusElement.textContent = `已记录 ${items.length} 条`;
  }
});

window.clipboardHistory.onSettingsChanged(renderSettings);
