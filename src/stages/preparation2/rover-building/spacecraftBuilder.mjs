import {
  assemblyTimeLimitSeconds,
  capabilityLabels,
  resourceLabels,
  resourceLimits,
  spacecraftAttachmentPointCount,
} from "./data/missionConfig.mjs";
import { escapeHtml, formatCapability } from "./formatters.mjs";
import { calculateResources, evaluateScience, validateMission } from "./missionValidation.mjs";

function getAssemblyStatus(destination, catalog, slots) {
  const selectedEquipment = slots
    .map((equipmentId) => catalog.find((item) => item.id === equipmentId))
    .filter(Boolean);
  const totals = calculateResources(selectedEquipment);
  const science = evaluateScience(destination.id, selectedEquipment);
  const primaryObjective = science.objectives.find(
    (objective) => objective.id === destination.primaryObjectiveId,
  );
  const resourcesValid = Object.keys(resourceLimits)
    .every((resource) => totals[resource] <= resourceLimits[resource]);
  const primaryObjectiveSupported = primaryObjective?.status === "available";
  const hasEquipment = selectedEquipment.length > 0;

  return {
    selectedEquipment,
    totals,
    science,
    primaryObjective,
    resourcesValid,
    primaryObjectiveSupported,
    valid: hasEquipment && resourcesValid && primaryObjectiveSupported,
  };
}

function renderInstrument(item, slots, selectedInstrumentId) {
  const installedSlot = slots.indexOf(item.id);
  const selected = selectedInstrumentId === item.id;
  const state = installedSlot >= 0 ? `INSTALLED · SLOT 0${installedSlot + 1}` : selected ? "SELECTED" : "SELECT";

  return `
    <button
      class="preparation1__gear${installedSlot >= 0 ? " is-installed" : ""}${selected ? " is-selected" : ""}"
      type="button"
      draggable="true"
      data-action="select-equipment"
      data-equipment-id="${escapeHtml(item.id)}"
      aria-pressed="${selected}"
      aria-label="${installedSlot >= 0 ? `Remove ${escapeHtml(item.name)} from slot ${installedSlot + 1}` : `Select ${escapeHtml(item.name)} to install`}"
      title="${escapeHtml(item.description)}"
    >
      <span class="preparation1__gear-icon" aria-hidden="true">${escapeHtml(item.symbol)}</span>
      <span class="preparation1__gear-main">
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(item.description)}</small>
        <span class="preparation1__gear-tags">
          ${item.capabilities.map((capability) => `<i>${escapeHtml(formatCapability(capability, capabilityLabels))}</i>`).join("")}
        </span>
      </span>
      <span class="preparation1__gear-meta">
        <strong>${item.mass}<small>kg</small></strong>
        <strong>${item.power}<small>W</small></strong>
        <strong>${item.data}<small>MB</small></strong>
        <i>${state}</i>
      </span>
    </button>
  `;
}

function renderResource(resource, total) {
  const limit = resourceLimits[resource];
  const percentage = Math.min(100, (total[resource] / limit) * 100);
  const state = total[resource] > limit ? "over" : total[resource] >= limit * 0.85 ? "near" : "safe";
  const excess = Math.max(0, total[resource] - limit);
  const label = resourceLabels[resource];

  return `
    <div class="preparation1__resource" data-resource-state="${state}">
      <div class="preparation1__resource-head">
        <span>${escapeHtml(label.name)}</span>
        <strong>${total[resource]} <i>/ ${limit} ${escapeHtml(label.unit)}</i></strong>
      </div>
      <div class="preparation1__meter" role="progressbar" aria-label="${escapeHtml(label.name)}" aria-valuemin="0" aria-valuemax="${limit}" aria-valuenow="${Math.min(total[resource], limit)}">
        <span style="width:${percentage}%"></span>
      </div>
      ${excess > 0
        ? `<p class="preparation1__resource-message">${excess} ${escapeHtml(label.unit)} over limit</p>`
        : `<p class="preparation1__resource-message">${state === "near" ? "Approaching capacity" : "Within capacity"}</p>`}
    </div>
  `;
}

function renderSpacecraft(slots, catalog, selectedInstrumentId) {
  const points = [
    { x: 33, y: 29 },
    { x: 67, y: 29 },
    { x: 33, y: 68.5 },
    { x: 67, y: 68.5 },
  ];

  return `
    <div class="preparation1__craft-stage" data-dropzone="spacecraft">
      <svg class="preparation1__craft-large" viewBox="0 0 420 268" role="img" aria-label="Spacecraft assembly bay with four equipment attachment points">
        <defs>
          <linearGradient id="p1-hull" x1="0" x2="1">
            <stop offset="0" stop-color="#b7c8c9"></stop>
            <stop offset="1" stop-color="#536c76"></stop>
          </linearGradient>
          <linearGradient id="p1-bus" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#bdcbd0"></stop>
            <stop offset=".48" stop-color="#607681"></stop>
            <stop offset="1" stop-color="#263b49"></stop>
          </linearGradient>
        </defs>
        <circle class="preparation1__craft-aura" cx="210" cy="128" r="95"></circle>
        <path class="preparation1__craft-boom" d="M197 128H223M197 128L112 78M223 128L308 78M197 132L112 190M223 132L308 190"></path>
        <rect class="preparation1__craft-panel" x="27" y="58" width="82" height="38" rx="3"></rect>
        <path class="preparation1__craft-grid" d="M47 58v38m20-38v38m20-38v38M27 77h82"></path>
        <rect class="preparation1__craft-panel" x="311" y="58" width="82" height="38" rx="3"></rect>
        <path class="preparation1__craft-grid" d="M331 58v38m20-38v38m20-38v38m-60-19h82"></path>
        <rect class="preparation1__craft-panel" x="27" y="172" width="82" height="38" rx="3"></rect>
        <path class="preparation1__craft-grid" d="M47 172v38m20-38v38m20-38v38m-60-19h82"></path>
        <rect class="preparation1__craft-panel" x="311" y="172" width="82" height="38" rx="3"></rect>
        <path class="preparation1__craft-grid" d="M331 172v38m20-38v38m20-38v38m-60-19h82"></path>
        <path class="preparation1__craft-bus" d="M210 78l30 22v62l-30 20-30-20v-62z"></path>
        <circle class="preparation1__craft-window" cx="210" cy="124" r="12"></circle>
        <path class="preparation1__craft-antenna" d="M210 78V54m-11 0h22m-11-8v8"></path>
        <path class="preparation1__craft-dish" d="M225 86q25-24 47 0q-22 7-47 0z"></path>
        <path class="preparation1__craft-nozzle" d="M201 181l9 17 9-17"></path>
        ${points.map((point, index) => {
          const item = catalog.find((candidate) => candidate.id === slots[index]);
          const isCompatible = selectedInstrumentId !== null && (item === undefined || item.id !== selectedInstrumentId);
          return `
            <circle class="preparation1__craft-port${item ? " is-installed" : ""}${isCompatible ? " is-compatible" : ""}" cx="${point.x * 4.2}" cy="${point.y * 2.68}" r="16"></circle>
          `;
        }).join("")}
      </svg>
      <div class="preparation1__attachment-points">
        ${points.map((point, index) => {
          const equipmentId = slots[index];
          const item = catalog.find((candidate) => candidate.id === equipmentId);
          const isCompatible = selectedInstrumentId !== null && (!item || item.id !== selectedInstrumentId);
          return `
            <button
              class="preparation1__attachment${item ? " is-installed" : ""}${isCompatible ? " is-compatible" : ""}${item && item.id === selectedInstrumentId ? " is-selected" : ""}"
              type="button"
              data-action="select-slot"
              data-slot-index="${index}"
              data-drop-slot="${index}"
              aria-label="${item ? `Remove ${escapeHtml(item.name)} from attachment point ${index + 1}` : `Install selected instrument at attachment point ${index + 1}`}"
              style="--slot-x:${point.x}%;--slot-y:${point.y}%"
            >
              <span>${item ? escapeHtml(item.symbol) : "+"}</span>
              <small>${item ? `0${index + 1}` : `SLOT 0${index + 1}`}</small>
            </button>
          `;
        }).join("")}
      </div>
      <p class="preparation1__craft-caption">${slots.filter(Boolean).length} / ${spacecraftAttachmentPointCount} PAYLOAD MOUNTS OCCUPIED</p>
    </div>
  `;
}

function renderReadiness(status, finalized) {
  const conditions = [
    { id: "destination", label: "Destination selected", ready: true },
    { id: "objective", label: "Primary objective supported", ready: status.primaryObjectiveSupported },
    { id: "resources", label: "Payload within limits", ready: status.resourcesValid },
    { id: "finalized", label: "Payload finalized", ready: finalized },
  ];
  const completeCount = conditions.filter((condition) => condition.ready).length;

  return `
    <section class="preparation1__readiness" aria-label="Mission readiness">
      <div class="preparation1__readiness-head">
        <div><p class="preparation1__eyebrow">Mission readiness</p><strong>${Math.round((completeCount / conditions.length) * 100)}%</strong></div>
        <span>${completeCount} / ${conditions.length} checks complete</span>
      </div>
      <div class="preparation1__readiness-meter" role="progressbar" aria-label="Mission readiness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round((completeCount / conditions.length) * 100)}">
        <span style="width:${(completeCount / conditions.length) * 100}%"></span>
      </div>
      <ol class="preparation1__readiness-steps">
        ${conditions.map((condition) => `
          <li data-readiness="${condition.ready ? "complete" : "pending"}">
            <span aria-hidden="true">${condition.ready ? "✓" : "0" + (conditions.indexOf(condition) + 1)}</span>
            <small>${escapeHtml(condition.label)}</small>
          </li>
        `).join("")}
      </ol>
    </section>
  `;
}

function renderScience(status) {
  const objectives = status.science.objectives;
  return `
    <section class="preparation1__science" aria-labelledby="preparation1-science-heading">
      <div class="preparation1__subheading">
        <h3 id="preparation1-science-heading">Scientific coverage</h3>
        <span>${objectives.filter((objective) => objective.status === "available").length} / ${objectives.length} objectives</span>
      </div>
      <ul class="preparation1__objective-list">
        ${objectives.map((objective) => `
          <li data-objective-state="${objective.status}"${objective.id === status.primaryObjective?.id ? ' data-primary-objective="true"' : ""}>
            <span class="preparation1__objective-indicator" aria-hidden="true"></span>
            <span><strong>${escapeHtml(objective.name)}${objective.id === status.primaryObjective?.id ? " · PRIMARY" : ""}</strong><small>${objective.status === "available" ? "Supported" : objective.status === "partial" ? "Partially supported" : "Not supported"}</small></span>
          </li>
        `).join("")}
      </ul>
      <div class="preparation1__capability-summary">
        <span>ENABLED CAPABILITIES</span>
        ${status.science.capabilities.length
          ? status.science.capabilities.map((capability) => `<i>${escapeHtml(formatCapability(capability, capabilityLabels))}</i>`).join("")
          : "<i>None yet</i>"}
      </div>
    </section>
  `;
}

export function renderSpacecraftBuilder(
  destination,
  catalog,
  slots,
  selectedInstrumentId,
  remainingSeconds,
  missionControlMessage,
  finalized = false,
) {
  const status = getAssemblyStatus(destination, catalog, slots);
  const objective = status.primaryObjective;
  const seconds = Math.max(0, remainingSeconds);
  const timeState = seconds <= 10 ? "critical" : seconds <= 30 ? "warning" : "normal";
  const timerProgress = Math.min(100, (seconds / assemblyTimeLimitSeconds) * 100);
  const resourceWarnings = validateMission(status.selectedEquipment, status.totals).violations;
  const missingMessage = !status.selectedEquipment.length
    ? "Install at least one instrument."
    : !status.primaryObjectiveSupported
      ? `Primary objective needs: ${objective.requires
        .filter((capability) => !status.science.capabilities.includes(capability))
        .map((capability) => formatCapability(capability, capabilityLabels)).join(", ")}.`
      : resourceWarnings.join(" ");

  return {
    valid: status.valid,
    html: `
      <div class="preparation1__shell preparation1__assembly" data-time-state="${timeState}">
        <header class="preparation1__assembly-header">
          <div class="preparation1__assembly-brand">
            <p class="preparation1__eyebrow">Mission Control / Payload Assembly</p>
            <h1>${escapeHtml(destination.shortName || destination.name)} mission</h1>
          </div>
          <div class="preparation1__timer" aria-live="off">
            <span>ASSEMBLY WINDOW</span>
            <strong data-timer-countdown>${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}</strong>
            <div class="preparation1__timer-meter" role="progressbar" aria-label="Assembly time remaining" aria-valuemin="0" aria-valuemax="${assemblyTimeLimitSeconds}" aria-valuenow="${seconds}">
              <span style="width:${timerProgress}%"></span>
            </div>
          </div>
        </header>

        ${renderReadiness(status, finalized)}

        <section class="preparation1__mission-directive" aria-label="Primary mission objective">
          <span class="preparation1__directive-mark" aria-hidden="true">01</span>
          <div><p class="preparation1__eyebrow">Primary objective / ${escapeHtml(destination.shortName || destination.name)}</p>
            <h2>${escapeHtml(objective.missionTitle)}</h2>
            <p>${escapeHtml(objective.missionPrompt)}</p>
          </div>
          <strong class="preparation1__objective-state" data-supported="${status.primaryObjectiveSupported}">
            ${status.primaryObjectiveSupported ? "OBJECTIVE SUPPORTED" : "OBJECTIVE NOT YET SUPPORTED"}
          </strong>
        </section>

        <div class="preparation1__assembly-grid">
          <section class="preparation1__assembly-inventory" aria-labelledby="preparation1-inventory-heading">
            <div class="preparation1__assembly-panel-head">
              <div><p class="preparation1__eyebrow">Flight inventory / 01</p><h2 id="preparation1-inventory-heading">Scientific instruments</h2></div>
              <span>${catalog.length} AVAILABLE</span>
            </div>
            <p class="preparation1__assembly-hint">Select a unit, then click a lit mount. Drag it directly onto the spacecraft, too.</p>
            <div class="preparation1__gear-list" data-dropzone="inventory">
              ${catalog.map((item) => renderInstrument(item, slots, selectedInstrumentId)).join("")}
            </div>
          </section>

          <section class="preparation1__assembly-craft" aria-labelledby="preparation1-craft-heading">
            <div class="preparation1__assembly-panel-head">
              <div><p class="preparation1__eyebrow">Spacecraft / 02</p><h2 id="preparation1-craft-heading">Payload mounts</h2></div>
              <span>${slots.filter(Boolean).length} / ${spacecraftAttachmentPointCount} INSTALLED</span>
            </div>
            <p class="preparation1__assembly-hint">${selectedInstrumentId
              ? "Compatible mounts are highlighted. Select an occupied mount to replace its instrument."
              : "Select or drag an instrument onto a highlighted mount. Select an installed unit to remove it."}</p>
            ${renderSpacecraft(slots, catalog, selectedInstrumentId)}
          </section>

          <aside class="preparation1__assembly-status" aria-label="Mission resources and science coverage">
            <section class="preparation1__resource-section">
              <div class="preparation1__assembly-panel-head">
                <div><p class="preparation1__eyebrow">Capacity / 03</p><h2>Payload limits</h2></div>
              </div>
              ${["mass", "power", "data"].map((resource) => renderResource(resource, status.totals)).join("")}
            </section>
            ${renderScience(status)}
            <div class="preparation1__mission-control" role="status" aria-live="polite">
              <span class="preparation1__control-indicator"></span>
              <span><small>MISSION CONTROL</small><strong data-mission-control>${escapeHtml(missionControlMessage)}</strong></span>
            </div>
            <p class="preparation1__objective-message" data-state="${status.primaryObjectiveSupported ? "ready" : "missing"}">
              ${escapeHtml(status.primaryObjectiveSupported ? "Primary objective capability online." : missingMessage)}
            </p>
            <button
              class="preparation1__authorize"
              type="button"
              data-action="authorize-mission"
              ${status.valid ? "" : "disabled"}
            >
              AUTHORIZE MISSION <span aria-hidden="true">→</span>
            </button>
          </aside>
        </div>
        <footer class="preparation1__assembly-footer">
          <span>DRAG TO INSTALL · CLICK TO SELECT / MOUNT</span>
          <span>MISSION INSPIRATION: ${escapeHtml(destination.historicalMission).toUpperCase()}</span>
        </footer>
      </div>
    `,
  };
}
