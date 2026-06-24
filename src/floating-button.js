const floatingButton = document.querySelector("[data-floating-button]");

let floatingButtonDrag = null;

function hasFiniteScreenPoint(event) {
  return Number.isFinite(event.screenX) && Number.isFinite(event.screenY);
}

floatingButton?.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return;
  }

  event.preventDefault();
  const startScreenX = hasFiniteScreenPoint(event) ? event.screenX : 0;
  const startScreenY = hasFiniteScreenPoint(event) ? event.screenY : 0;
  floatingButton.setPointerCapture(event.pointerId);
  floatingButtonDrag = {
    pointerId: event.pointerId,
    startScreenX,
    startScreenY,
    moved: false
  };
  window.clipboardHistory.beginFloatingWindowDrag(startScreenX, startScreenY);
});

floatingButton?.addEventListener("pointermove", (event) => {
  if (!floatingButtonDrag || floatingButtonDrag.pointerId !== event.pointerId) {
    return;
  }

  if (!hasFiniteScreenPoint(event)) {
    floatingButtonDrag.moved = true;
    return;
  }

  const deltaX = Math.abs(event.screenX - floatingButtonDrag.startScreenX);
  const deltaY = Math.abs(event.screenY - floatingButtonDrag.startScreenY);

  if (deltaX > 4 || deltaY > 4) {
    floatingButtonDrag.moved = true;
  }
});

floatingButton?.addEventListener("pointerup", (event) => {
  if (!floatingButtonDrag || floatingButtonDrag.pointerId !== event.pointerId) {
    return;
  }

  const deltaX = hasFiniteScreenPoint(event) ? Math.abs(event.screenX - floatingButtonDrag.startScreenX) : 0;
  const deltaY = hasFiniteScreenPoint(event) ? Math.abs(event.screenY - floatingButtonDrag.startScreenY) : 0;
  const wasMoved = floatingButtonDrag.moved || deltaX > 4 || deltaY > 4;

  if (floatingButton.hasPointerCapture(event.pointerId)) {
    floatingButton.releasePointerCapture(event.pointerId);
  }

  floatingButtonDrag = null;
  window.clipboardHistory.endFloatingWindowDrag();

  if (!wasMoved) {
    window.clipboardHistory.openFloatingPanel();
  }
});

floatingButton?.addEventListener("pointercancel", (event) => {
  if (floatingButtonDrag && floatingButton.hasPointerCapture(event.pointerId)) {
    floatingButton.releasePointerCapture(event.pointerId);
  }

  floatingButtonDrag = null;
  window.clipboardHistory.endFloatingWindowDrag();
});
