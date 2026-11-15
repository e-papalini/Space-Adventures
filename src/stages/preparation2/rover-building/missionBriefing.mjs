import { resourceLimits } from "./data/missionConfig.mjs";
import { scienceObjectives } from "./data/scienceObjectives.mjs";
import { escapeHtml } from "./formatters.mjs";

export function renderMissionBriefing(destination) {
  const primary = scienceObjectives[destination.id]
    .find((objective) => objective.id === destination.primaryObjectiveId);
  return `
    <div class="preparation1__shell preparation1__briefing">
      <p class="preparation1__eyebrow">Incoming transmission / Mission Control</p>
      <p class="preparation1__brief-destination">${escapeHtml(destination.name)} · ${escapeHtml(destination.classification)}</p>
      <div class="preparation1__brief-object">
        <span class="preparation1__brief-orbit" aria-hidden="true"></span>
        <span class="preparation1__brief-rock preparation1__brief-rock--${escapeHtml(destination.id)}" aria-hidden="true"></span>
      </div>
      <div class="preparation1__brief-copy">
        <p class="preparation1__eyebrow">Primary science objective</p>
        <h1>${escapeHtml(primary.missionTitle)}</h1>
        <p>${escapeHtml(primary.missionPrompt)}</p>
        <div class="preparation1__brief-mission">
          <span>DESIGN A PAYLOAD FOR</span>
          <strong>${resourceLimits.mass} kg mass · ${resourceLimits.power} W power · ${resourceLimits.data} MB / measurement</strong>
        </div>
        <button class="preparation1__button preparation1__button--primary" type="button" data-action="begin-assembly">
          Begin timed assembly <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  `;
}

export function renderPreparationFailure(destination, reason) {
  return `
    <div class="preparation1__shell preparation1__result preparation1__result--failed">
      <p class="preparation1__eyebrow">Mission Control / Assembly window closed</p>
      <h1>Preparation incomplete.</h1>
      <p class="preparation1__intro">
        The ${escapeHtml(destination.shortName || destination.name)} payload did not meet authorization requirements before time ran out.
        No equipment has been added automatically.
      </p>
      <p class="preparation1__failure-reason">${escapeHtml(reason)}</p>
      <button class="preparation1__button preparation1__button--primary" type="button" data-action="retry-assembly">
        Retry assembly <span aria-hidden="true">↻</span>
      </button>
    </div>
  `;
}

export function renderMissionResult(destination, primaryObjective, selectedEquipment, totals, science, result) {
  return `
    <div class="preparation1__shell preparation1__result preparation1__result--authorized" role="status">
      <p class="preparation1__eyebrow">Mission Control / Payload finalized</p>
      <h1>Mission authorized.</h1>
      <p class="preparation1__intro">
        ${escapeHtml(destination.shortName || destination.name)} is ready for the next stage.
        ${result.autoAuthorized ? "Mission Control finalized the valid payload when the assembly window closed." : ""}
      </p>
      <section class="preparation1__result-summary">
        <div class="preparation1__result-readiness">
          <div><span>MISSION READINESS</span><strong>100%</strong></div>
          <div class="preparation1__readiness-meter" role="progressbar" aria-label="Mission readiness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span style="width:100%"></span></div>
        </div>
        <div class="preparation1__result-objective">
          <span>PRIMARY OBJECTIVE</span>
          <strong>${escapeHtml(primaryObjective.missionTitle)}</strong>
          <p>${escapeHtml(primaryObjective.missionPrompt)}</p>
        </div>
        <dl class="preparation1__confirmation-resources">
          <div><dt>Payload mass</dt><dd>${totals.mass} / ${resourceLimits.mass} kg</dd></div>
          <div><dt>Combined power</dt><dd>${totals.power} / ${resourceLimits.power} W</dd></div>
          <div><dt>Data / measurement cycle</dt><dd>${totals.data} / ${resourceLimits.data} MB</dd></div>
          <div><dt>Science coverage</dt><dd>${science.availableObjectives.length} / ${science.objectives.length} objectives</dd></div>
          <div><dt>Preparation time left</dt><dd>${Math.floor(result.remainingSeconds / 60)}:${String(result.remainingSeconds % 60).padStart(2, "0")}</dd></div>
        </dl>
        <p class="preparation1__result-label">FINALIZED PAYLOAD</p>
        <ul class="preparation1__confirmation-kit">
          ${selectedEquipment.map((item) => `<li>${escapeHtml(item.name)}</li>`).join("")}
        </ul>
      </section>
      <p class="preparation1__result-handoff">Passing mission plan to the host game.</p>
    </div>
  `;
}
