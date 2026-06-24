const floatingPanel = document.querySelector("[data-floating-panel]");
const floatingClose = document.querySelector("[data-floating-close]");
const floatingList = document.querySelector("[data-floating-list]");
const floatingStatus = document.querySelector("[data-floating-status]");

let floatingItems = [];
let isPanelOpen = false;

function formatFloatingTime(copiedAt) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(copiedAt));
}

function renderFloatingItems(items) {
  if (!floatingList) {
    return;
  }

  floatingList.replaceChildren();

  const recentItems = items.slice(0, 8);

  if (recentItems.length === 0) {
    const emptyElement = document.createElement("div");
    emptyElement.className = "floating-empty";
    emptyElement.textContent = "暂无剪贴板记录";
    floatingList.append(emptyElement);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const item of recentItems) {
    const itemButton = document.createElement("button");
    itemButton.className = "floating-item";
    itemButton.type = "button";
    itemButton.dataset.floatingItem = item.id;

    const previewElement = document.createElement("span");

    if (item.type === "image") {
      previewElement.className = "floating-item__image";

      const imageElement = document.createElement("img");
      imageElement.src = item.imageDataUrl;
      imageElement.alt = "图片剪贴板记录";

      const labelElement = document.createElement("span");
      labelElement.textContent = `图片 ${(item.byteSize / 1024).toFixed(1)} KB`;

      previewElement.append(imageElement, labelElement);
    } else {
      previewElement.className = "floating-item__text";
      previewElement.textContent = item.text;
    }

    const timeElement = document.createElement("span");
    timeElement.className = "floating-item__meta";
    timeElement.textContent = formatFloatingTime(item.copiedAt);

    itemButton.append(previewElement, timeElement);
    itemButton.addEventListener("click", async () => {
      const copied = await window.clipboardHistory.copyItem(item.id);

      if (floatingStatus) {
        floatingStatus.textContent = copied ? "已复制回剪贴板" : "记录不存在";
      }

      if (copied) {
        await window.clipboardHistory.closeFloatingPanel();
      }
    });

    fragment.append(itemButton);
  }

  floatingList.append(fragment);
}

function renderFloatingPanel(nextIsPanelOpen) {
  isPanelOpen = nextIsPanelOpen;

  if (floatingPanel) {
    floatingPanel.hidden = !isPanelOpen;
  }

  if (isPanelOpen) {
    renderFloatingItems(floatingItems);
  }
}

floatingClose?.addEventListener("click", () => {
  window.clipboardHistory.closeFloatingPanel();
});

window.clipboardHistory.getHistory().then((items) => {
  floatingItems = items;
  renderFloatingItems(floatingItems);
});

window.clipboardHistory.onHistoryChanged((items) => {
  floatingItems = items;

  if (isPanelOpen) {
    renderFloatingItems(floatingItems);
  }
});

window.clipboardHistory.onFloatingPanelChanged(renderFloatingPanel);
