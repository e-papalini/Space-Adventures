import { renderDestinationMap } from "./destinationMap.mjs";
import { destinations } from "./data/destinations.mjs";
import { equipment } from "./data/equipment.mjs";
import {
  assemblyTimeLimitSeconds,
  capabilityLabels,
  resourceLimits,
  resourceLabels,
  spacecraftAttachmentPointCount,
} from "./data/missionConfig.mjs";
import { escapeHtml, formatCapability } from "./formatters.mjs";
import {
  renderMissionBriefing,
  renderMissionResult,
  renderPreparationFailure,
} from "./missionBriefing.mjs";
import { renderSpacecraftBuilder } from "./spacecraftBuilder.mjs";
import { calculateResources, evaluateScience, validateMission } from "./missionValidation.mjs";

export function mount(container, gameState, onComplete) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("Rover Building requires a DOM container.");
  }
  if (!gameState || typeof gameState !== "object" || Array.isArray(gameState)) {
    throw new TypeError("Rover Building requires gameState to be an object.");
  }
  if (typeof onComplete !== "function") {
    throw new TypeError("Rover Building requires an onComplete callback.");
  }
  if (!destinations.some((destination) => destination.id === gameState.selectedDestinationId)) {
    throw new TypeError("Rover Building requires a valid selected destination.");
  }

  const root = document.createElement("section");
  root.id = "rover-building-root";
  root.className = "preparation1";
  root.setAttribute("aria-label", "Rover Building");

  let selectedDestinationId = gameState.selectedDestinationId;
  let equipmentSlots = Array(spacecraftAttachmentPointCount).fill(null);
  let selectedEquipmentId = null;
  let screen = "briefing";
  let completed = false;
  let unmounted = false;
  let remainingSeconds = assemblyTimeLimitSeconds;
  let timerDeadline = null;
  let timerIntervalId = null;
  let zoomTimeoutId = null;
  let draggedEquipment = null;
  let missionControlMessage = "Stand by for the destination science directive.";

  function getDestination() {
    return destinations.find((destination) => destination.id === selectedDestinationId);
  }

  function getCatalog() {
    return equipment.filter((item) => item.destinationId === selectedDestinationId);
  }

  function getAssemblyState() {
    const catalog = getCatalog();
    const selectedEquipment = equipmentSlots
      .map((id) => catalog.find((item) => item.id === id))
      .filter(Boolean);
    const totals = calculateResources(selectedEquipment);
    const science = evaluateScience(selectedDestinationId, selectedEquipment);
    const destination = getDestination();
    const primaryObjective = science.objectives.find(
      (objective) => objective.id === destination?.primaryObjectiveId,
    );
    const resourceValidation = validateMission(selectedEquipment, totals);
    const resourcesValid = Object.keys(resourceLimits)
      .every((resource) => totals[resource] <= resourceLimits[resource]);
    const valid = selectedEquipment.length > 0
      && resourcesValid
      && primaryObjective?.status === "available";

    return {
      selectedEquipment,
      totals,
      science,
      primaryObjective,
      resourcesValid,
      resourceValidation,
      valid,
    };
  }

  function updateMissionControl(message) {
    missionControlMessage = message;
    const display = root.querySelector("[data-mission-control]");
    if (display) display.textContent = message;
  }

  function render(focusTarget) {
    root.classList.toggle("is-zooming", screen === "zoom");

    if (screen === "map" || screen === "zoom") {
      root.innerHTML = renderDestinationMap(destinations, selectedDestinationId);
    } else if (screen === "briefing") {
      root.innerHTML = renderMissionBriefing(getDestination());
    } else if (screen === "builder") {
      root.innerHTML = renderSpacecraftBuilder(
        getDestination(),
        getCatalog(),
        equipmentSlots,
        selectedEquipmentId,
        remainingSeconds,
        missionControlMessage,
      ).html;
    } else if (screen === "failed") {
      root.innerHTML = renderPreparationFailure(getDestination(), getFailureReason());
    }

    if (focusTarget) {
      const target = [...root.querySelectorAll(focusTarget.selector)]
        .find((element) => element.dataset[focusTarget.dataKey] === focusTarget.value);
      if (target) target.focus();
    }
  }

  function stopTimer() {
    if (timerIntervalId !== null) {
      window.clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
  }

  function getFailureReason() {
    const state = getAssemblyState();
    if (!state.selectedEquipment.length) return "Install at least one scientific instrument.";
    if (state.primaryObjective?.status !== "available") {
      const missing = state.primaryObjective?.requires
        .filter((capability) => !state.science.capabilities.includes(capability))
        .map((capability) => formatCapability(capability, capabilityLabels)) || [];
      return `The primary objective still needs ${missing.join(" and ")}.`;
    }
    return state.resourceValidation.violations.join(" ");
  }

  function updateTimer() {
    if (screen !== "builder" || timerDeadline === null) return;
    remainingSeconds = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));

    const countdown = root.querySelector("[data-timer-countdown]");
    const meter = root.querySelector(".preparation1__timer-meter");
    const assembly = root.querySelector(".preparation1__assembly");
    if (!countdown || !meter || !assembly) return;

    countdown.textContent = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
    meter.setAttribute("aria-valuenow", String(remainingSeconds));
    meter.firstElementChild.style.width = `${Math.min(100, (remainingSeconds / assemblyTimeLimitSeconds) * 100)}%`;

    const timeState = remainingSeconds <= 10 ? "critical" : remainingSeconds <= 30 ? "warning" : "normal";
    if (assembly.dataset.timeState !== timeState) {
      assembly.dataset.timeState = timeState;
      if (timeState === "warning") updateMissionControl("30 seconds remain. Confirm the primary objective and payload limits.");
      if (timeState === "critical") updateMissionControl("Final 10 seconds. Authorize a valid payload now.");
    }

    if (remainingSeconds === 0) {
      stopTimer();
      timerDeadline = null;
      const state = getAssemblyState();
      if (state.valid) {
        completeMission(true);
      } else {
        screen = "failed";
        missionControlMessage = "Assembly window closed. Review the missing requirement and try again.";
        render();
      }
    }
  }

  function startTimer() {
    stopTimer();
    remainingSeconds = assemblyTimeLimitSeconds;
    timerDeadline = Date.now() + assemblyTimeLimitSeconds * 1000;
    screen = "builder";
    missionControlMessage = "Assembly window open. Build for the primary science objective.";
    render({
      selector: '[data-action="select-equipment"]',
      dataKey: "equipmentId",
      value: getCatalog()[0]?.id,
    });
    timerIntervalId = window.setInterval(updateTimer, 250);
    updateTimer();
  }

  function completeMission(autoAuthorized = false) {
    const destination = getDestination();
    const state = getAssemblyState();
    if (!destination || !state.valid || completed) return;

    stopTimer();
    if (timerDeadline !== null) {
      remainingSeconds = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
    }
    timerDeadline = null;

    const updatedState = {
      ...gameState,
      selectedDestinationId: destination.id,
      selectedEquipment: state.selectedEquipment.map((item) => item.id),
      payloadMass: state.totals.mass,
      combinedPower: state.totals.power,
      dataPerMeasurementCycle: state.totals.data,
      supportedCapabilities: state.science.capabilities,
      availableResearchObjectives: state.science.availableObjectives.map((objective) => objective.id),
      missionResult: {
        authorized: true,
        primaryObjectiveId: destination.primaryObjectiveId,
        scienceCoverageCount: state.science.availableObjectives.length,
        scienceObjectiveCount: state.science.objectives.length,
        preparationTimeRemainingSeconds: remainingSeconds,
        autoAuthorized,
      },
    };

    completed = true;
    screen = "complete";
    root.innerHTML = renderMissionResult(
      destination,
      state.primaryObjective,
      state.selectedEquipment,
      state.totals,
      state.science,
      { remainingSeconds, autoAuthorized },
    );
    console.log("[Rover Building] Updated game state:", updatedState);
    onComplete(updatedState);
  }

  function beginZoom() {
    screen = "zoom";
    render();
    zoomTimeoutId = window.setTimeout(() => {
      zoomTimeoutId = null;
      if (unmounted || screen !== "zoom") return;
      screen = "briefing";
      render({ selector: '[data-action="begin-assembly"]', dataKey: "action", value: "begin-assembly" });
    }, 720);
  }

  function getResourceLimitMessage(state) {
    for (const resource of Object.keys(state.totals)) {
      if (state.totals[resource] > resourceLimits[resource]) {
        return `${resourceLabels[resource].name} limit exceeded.`;
      }
    }
    return null;
  }

  function installEquipment(equipmentId, slotIndex) {
    const catalog = getCatalog();
    const item = catalog.find((candidate) => candidate.id === equipmentId);
    if (!item || slotIndex < 0 || slotIndex >= equipmentSlots.length) return;

    const alreadyInstalled = equipmentSlots.indexOf(equipmentId);
    if (alreadyInstalled >= 0 && alreadyInstalled !== slotIndex) {
      equipmentSlots[alreadyInstalled] = equipmentSlots[slotIndex];
    }

    const previousState = getAssemblyState();
    const replacedId = equipmentSlots[slotIndex];
    equipmentSlots[slotIndex] = equipmentId;
    selectedEquipmentId = null;
    const nextState = getAssemblyState();

    const resourceMessage = getResourceLimitMessage(nextState);
    const newlySupportedObjective = nextState.science.availableObjectives.find(
      (objective) => !previousState.science.availableObjectives.some((previous) => previous.id === objective.id),
    );
    if (resourceMessage) {
      updateMissionControl(resourceMessage);
    } else if (newlySupportedObjective) {
      updateMissionControl(newlySupportedObjective.id === getDestination().primaryObjectiveId
        ? "Primary objective supported."
        : `Science objective enabled: ${newlySupportedObjective.name}.`);
    } else if (!previousState.primaryObjective?.status || previousState.primaryObjective.status !== "available") {
      if (nextState.primaryObjective?.status === "available") {
        updateMissionControl("Primary objective supported.");
      } else {
        const newCapability = item.capabilities.find(
          (capability) => !previousState.science.capabilities.includes(capability),
        );
        updateMissionControl(newCapability
          ? `${formatCapability(newCapability, capabilityLabels)} capability enabled.`
          : `${item.name} installed in mount 0${slotIndex + 1}.`);
      }
    } else {
      updateMissionControl(`${item.name} installed${replacedId ? "; previous unit returned to inventory." : ` in mount 0${slotIndex + 1}.`}`);
    }

    render({
      selector: '[data-action="select-slot"]',
      dataKey: "slotIndex",
      value: String(slotIndex),
    });
  }

  function removeEquipment(slotIndex) {
    const removedId = equipmentSlots[slotIndex];
    if (!removedId) return;
    const item = getCatalog().find((candidate) => candidate.id === removedId);
    const previousState = getAssemblyState();
    equipmentSlots[slotIndex] = null;
    if (selectedEquipmentId === removedId) selectedEquipmentId = null;
    const nextState = getAssemblyState();
    const disabledObjective = previousState.science.availableObjectives.find(
      (objective) => !nextState.science.availableObjectives.some((next) => next.id === objective.id),
    );

    if (disabledObjective?.id === getDestination().primaryObjectiveId) {
      updateMissionControl("Primary objective no longer supported. Select an analysis instrument.");
    } else if (disabledObjective) {
      updateMissionControl(`Removing ${item?.name || "this instrument"} disables ${disabledObjective.name.toLowerCase()}.`);
    } else if (!nextState.valid) {
      updateMissionControl("Instrument removed. Payload needs adjustment before authorization.");
    } else {
      updateMissionControl(`${item?.name || "Instrument"} returned to inventory.`);
    }

    render({
      selector: '[data-action="select-equipment"]',
      dataKey: "equipmentId",
      value: removedId,
    });
  }

  function handleClick(event) {
    if (!(event.target instanceof Element) || completed || screen === "zoom") return;
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget || !root.contains(actionTarget)) return;

    switch (actionTarget.dataset.action) {
      case "select-destination": {
        const destinationId = actionTarget.dataset.destinationId;
        if (!destinations.some((destination) => destination.id === destinationId)) return;
        selectedDestinationId = destinationId;
        render({
          selector: '[data-action="select-destination"]',
          dataKey: "destinationId",
          value: destinationId,
        });
        break;
      }
      case "confirm-destination":
        if (screen === "map" && getDestination()) beginZoom();
        break;
      case "return-to-map":
        screen = "map";
        render();
        break;
      case "begin-assembly":
        if (screen === "briefing") startTimer();
        break;
      case "retry-assembly":
        if (screen === "failed") {
          equipmentSlots = Array(spacecraftAttachmentPointCount).fill(null);
          selectedEquipmentId = null;
          startTimer();
        }
        break;
      case "select-equipment": {
        if (screen !== "builder") return;
        const itemId = actionTarget.dataset.equipmentId;
        const installedSlot = equipmentSlots.indexOf(itemId);
        if (installedSlot >= 0) {
          removeEquipment(installedSlot);
          break;
        }
        selectedEquipmentId = selectedEquipmentId === itemId ? null : itemId;
        const selectedItem = getCatalog().find((item) => item.id === selectedEquipmentId);
        updateMissionControl(selectedItem
          ? `${selectedItem.name} selected. Place it on a highlighted mount.`
          : "Instrument selection cleared.");
        render({
          selector: '[data-action="select-equipment"]',
          dataKey: "equipmentId",
          value: itemId,
        });
        break;
      }
      case "select-slot": {
        if (screen !== "builder") return;
        const slotIndex = Number(actionTarget.dataset.slotIndex);
        if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= equipmentSlots.length) return;
        if (selectedEquipmentId) {
          installEquipment(selectedEquipmentId, slotIndex);
        } else if (equipmentSlots[slotIndex]) {
          removeEquipment(slotIndex);
        } else {
          updateMissionControl("Select an instrument from inventory, then choose a highlighted mount.");
        }
        break;
      }
      case "authorize-mission":
        if (screen === "builder") completeMission(false);
        break;
    }
  }

  function handleDragStart(event) {
    if (!(event.target instanceof Element) || screen !== "builder" || !event.dataTransfer) return;
    const source = event.target.closest('[data-action="select-equipment"]');
    const slot = event.target.closest("[data-drop-slot]");
    if (source) {
      const itemId = source.dataset.equipmentId;
      draggedEquipment = {
        equipmentId: itemId,
        sourceSlotIndex: equipmentSlots.indexOf(itemId),
      };
    } else if (slot) {
      const sourceSlotIndex = Number(slot.dataset.dropSlot);
      const equipmentId = equipmentSlots[sourceSlotIndex];
      if (!equipmentId) return;
      draggedEquipment = { equipmentId, sourceSlotIndex };
    } else {
      return;
    }

    event.dataTransfer.effectAllowed = draggedEquipment.sourceSlotIndex >= 0 ? "move" : "copy";
    event.dataTransfer.setData("text/plain", draggedEquipment.equipmentId);
  }

  function handleDragOver(event) {
    if (!(event.target instanceof Element) || !draggedEquipment) return;
    const dropTarget = event.target.closest("[data-drop-slot], [data-dropzone]");
    if (!dropTarget || !root.contains(dropTarget)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    dropTarget.classList.add("is-drop-target");
  }

  function handleDragLeave(event) {
    if (!(event.target instanceof Element)) return;
    const dropTarget = event.target.closest(".is-drop-target");
    if (dropTarget && !dropTarget.contains(event.relatedTarget)) {
      dropTarget.classList.remove("is-drop-target");
    }
  }

  function handleDrop(event) {
    if (!(event.target instanceof Element) || !draggedEquipment) return;
    const dropSlot = event.target.closest("[data-drop-slot]");
    const inventory = event.target.closest('[data-dropzone="inventory"]');
    if (!dropSlot && !inventory) return;
    event.preventDefault();
    root.querySelectorAll(".is-drop-target").forEach((target) => target.classList.remove("is-drop-target"));

    const { equipmentId, sourceSlotIndex } = draggedEquipment;
    if (dropSlot) {
      const targetSlotIndex = Number(dropSlot.dataset.dropSlot);
      if (sourceSlotIndex >= 0) {
        if (sourceSlotIndex !== targetSlotIndex) {
          [equipmentSlots[sourceSlotIndex], equipmentSlots[targetSlotIndex]] =
            [equipmentSlots[targetSlotIndex], equipmentSlots[sourceSlotIndex]];
          missionControlMessage = `Payload moved to mount 0${targetSlotIndex + 1}.`;
          render({ selector: "[data-drop-slot]", dataKey: "dropSlot", value: String(targetSlotIndex) });
        }
      } else if (getCatalog().some((item) => item.id === equipmentId)) {
        installEquipment(equipmentId, targetSlotIndex);
      }
    } else if (inventory && sourceSlotIndex >= 0) {
      removeEquipment(sourceSlotIndex);
    }
    draggedEquipment = null;
  }

  function handleDragEnd() {
    draggedEquipment = null;
    root.querySelectorAll(".is-drop-target").forEach((target) => target.classList.remove("is-drop-target"));
  }

  root.addEventListener("click", handleClick);
  root.addEventListener("dragstart", handleDragStart);
  root.addEventListener("dragover", handleDragOver);
  root.addEventListener("dragleave", handleDragLeave);
  root.addEventListener("drop", handleDrop);
  root.addEventListener("dragend", handleDragEnd);
  container.replaceChildren(root);
  render();

  return function unmount() {
    unmounted = true;
    stopTimer();
    if (zoomTimeoutId !== null) {
      window.clearTimeout(zoomTimeoutId);
      zoomTimeoutId = null;
    }
    root.removeEventListener("click", handleClick);
    root.removeEventListener("dragstart", handleDragStart);
    root.removeEventListener("dragover", handleDragOver);
    root.removeEventListener("dragleave", handleDragLeave);
    root.removeEventListener("drop", handleDrop);
    root.removeEventListener("dragend", handleDragEnd);
    if (root.parentNode === container) {
      container.removeChild(root);
    }
  };
}
