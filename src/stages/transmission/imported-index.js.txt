import { getDestination } from '../../data/destinations.js';

export const GAMEPLAY_VALUES = Object.freeze({
  scanEnergyCost: 2,
  transmissionBaseEnergy: 2,
  transmissionEnergyPerMb: 1.5,
  storageCapacityMb: 100,
  scanSizesMb: Object.freeze([3.2, 5.5, 8]),
  defaultAntenna: Object.freeze({
    id: 'high-gain-dish',
    name: 'High-gain dish',
    massKg: 5.2,
    maxDataPerContactMb: 6,
  }),
  otherLoadoutMassKg: 18.4,
  loadoutLimitKg: 30,
  frequencyTarget: 1.14,
  phaseTargetDegrees: 35,
  frequencyTolerance: 0.08,
  phaseToleranceDegrees: 16,
  weakFrequencyRange: 0.25,
  weakPhaseRangeDegrees: 50,
});

const SIGNAL_WIDTH = 760;
const SIGNAL_HEIGHT = 190;
const SIGNAL_PADDING = 12;

export function transmissionCost(scan) {
  return Math.ceil(GAMEPLAY_VALUES.transmissionBaseEnergy + scan.sizeMb * GAMEPLAY_VALUES.transmissionEnergyPerMb);
}

export function getSignalStatus(frequency, phaseDegrees) {
  const frequencyError = Math.abs(frequency - GAMEPLAY_VALUES.frequencyTarget);
  const phaseError = phaseDistance(phaseDegrees, GAMEPLAY_VALUES.phaseTargetDegrees);
  if (frequencyError <= GAMEPLAY_VALUES.frequencyTolerance && phaseError <= GAMEPLAY_VALUES.phaseToleranceDegrees) {
    return 'Locked';
  }
  if (frequencyError <= GAMEPLAY_VALUES.weakFrequencyRange && phaseError <= GAMEPLAY_VALUES.weakPhaseRangeDegrees) {
    return 'Weak signal';
  }
  return 'Searching';
}

export function getTransmissionBlockers(gameState, scan) {
  const data = researchData(gameState);
  if (!scan) return ['Select an unsent scan first.'];
  if (data.transmittedFindings.some(finding => finding.scanId === scan.id)) {
    return ['This scan has already been transmitted.'];
  }
  if (data.expeditionFailed) return ['This expedition has failed.'];
  if (!data.relayAvailable) return ['The relay is unavailable.'];
  if (!data.scans.some(item => item.id === scan.id)) return ['This scan is no longer in onboard storage.'];

  const antenna = getAntenna(gameState);
  if (!Number.isFinite(antenna.maxDataPerContactMb)) return ['The selected antenna has no valid data limit.'];
  if (scan.sizeMb > antenna.maxDataPerContactMb) {
    return [`Scan is ${formatMb(scan.sizeMb)}; this antenna limit is ${formatMb(antenna.maxDataPerContactMb)} per contact.`];
  }
  if (!Number.isFinite(gameState.remainingEnergy) || gameState.remainingEnergy < transmissionCost(scan)) {
    return [`Insufficient battery energy: need ${transmissionCost(scan)}; have ${formatNumber(gameState.remainingEnergy)}.`];
  }
  if (!Number.isFinite(gameState.remainingStorage) || gameState.remainingStorage < 0 || gameState.remainingStorage > GAMEPLAY_VALUES.storageCapacityMb) {
    return ['Onboard storage is not available.'];
  }
  return [];
}

export function transmitScan(gameState, scanId, signalLocked) {
  const data = researchData(gameState);
  const previousFinding = data.transmittedFindings.find(finding => finding.scanId === scanId);
  if (previousFinding) return { ok: false, reason: 'This scan has already been transmitted.' };
  if (!signalLocked) return { ok: false, reason: 'Signal is not locked.' };

  const scan = data.scans.find(item => item.id === scanId);
  const blockers = getTransmissionBlockers(gameState, scan);
  if (blockers.length) return { ok: false, reason: blockers.join(' ') };

  const energyCost = transmissionCost(scan);
  const finding = {
    scanId: scan.id,
    name: scan.name,
    sizeMb: scan.sizeMb,
    destinationId: gameState.selectedDestinationId,
    transmittedAt: new Date().toISOString(),
  };
  gameState.remainingEnergy -= energyCost;
  gameState.remainingStorage += scan.sizeMb;
  data.scans = data.scans.filter(item => item.id !== scan.id);
  data.transmittedFindings.push(finding);
  gameState.scientificDiscoveries.push({
    destinationId: finding.destinationId,
    discoveryId: finding.scanId,
    name: finding.name,
    sizeMb: finding.sizeMb,
    transmittedAt: finding.transmittedAt,
  });
  return { ok: true, finding, energyCost };
}

export function failResearchExpedition(gameState) {
  const data = researchData(gameState);
  if (data.expeditionFailed) return false;
  data.scans = [];
  data.expeditionFailed = true;
  gameState.remainingStorage = GAMEPLAY_VALUES.storageCapacityMb;
  return true;
}

export function mount(container, gameState, onComplete) {
  const data = researchData(gameState);
  const destination = getDestination(gameState.selectedDestinationId);
  if (!destination) throw new Error('Research requires a selected destination.');

  let selectedScanId = data.scans[0]?.id ?? null;
  let activeScanId = null;
  let frequency = 0.72;
  let phaseDegrees = -42;
  let completionRequested = false;
  const controller = new AbortController();
  const root = document.createElement('section');
  root.className = 'stage-research';
  root.innerHTML = `
    <div class="research-shell">
      <header class="research-header">
        <div>
          <div class="research-eyebrow">Mission stage 03 / Research</div>
          <h1>Research &amp; data relay</h1>
          <p class="research-subtitle">Collect science scans, align your signal with the relay, and transmit discoveries from ${escapeHtml(destination.name)}.</p>
        </div>
        <div class="research-location">
          <span class="research-label">Destination</span>
          <strong>${escapeHtml(destination.name)}</strong>
          <span>${escapeHtml(destination.mission.agency)} · ${escapeHtml(destination.mission.name)}</span>
        </div>
      </header>
      <p class="research-failure" data-role="failure" hidden>Expedition failed. Unsent scans were lost; transmitted findings remain recorded.</p>
      <section class="research-resources" aria-label="Mission resources">
        <div class="research-resource"><span>Battery energy</span><strong data-role="energy"></strong><small>Scanning and transmissions share this battery.</small></div>
        <div class="research-resource"><span>Onboard storage</span><strong data-role="storage"></strong><div class="research-storage-track"><div data-role="storage-fill"></div></div><small>Unsent scans occupy storage.</small></div>
        <div class="research-resource"><span>Transmitted findings</span><strong data-role="finding-count"></strong><small>Recorded in shared discovery state.</small></div>
      </section>
      <div class="research-layout">
        <div>
          <section class="research-panel">
            <header class="research-panel-heading"><div><span class="research-eyebrow">Unsent science</span><h2>Onboard scans</h2></div><span data-role="scan-count"></span></header>
            <div class="research-scan-list" data-role="scan-list"></div>
            <div class="research-actions">
              <button type="button" data-action="collect">Collect scan <span>(−${GAMEPLAY_VALUES.scanEnergyCost} energy)</span></button>
              <button class="research-primary" type="button" data-action="transmit">Transmit selected scan</button>
            </div>
            <div class="research-details" data-role="scan-details" aria-live="polite"></div>
            <p class="research-message" data-role="action-message" role="status"></p>
          </section>
          <section class="research-panel">
            <header class="research-panel-heading"><div><span class="research-eyebrow">Preparation Part 2</span><h2>Selected antenna</h2></div><span data-role="relay-state"></span></header>
            <div class="research-antenna" data-role="antenna"></div>
            <p class="research-note" data-role="loadout"></p>
            <p class="research-note">Gameplay values: placeholder antenna stats, storage capacity, and energy costs are defined together in GAMEPLAY_VALUES until Preparation Part 2 supplies antenna details.</p>
          </section>
        </div>
        <div>
          <section class="research-console" data-role="console" hidden>
            <header class="research-panel-heading"><div><span class="research-eyebrow">Signal tuning console</span><h2>Match the relay carrier</h2></div><span class="research-signal-status" data-role="signal-status">Searching</span></header>
            <div class="research-wave-legend"><span><i class="research-key research-relay-key"></i>Relay signal (fixed reference)</span><span><i class="research-key research-player-key"></i>Player signal</span></div>
            <svg class="research-signal-graph" viewBox="0 0 ${SIGNAL_WIDTH} ${SIGNAL_HEIGHT}" role="img" aria-label="Relay and player signal waves">
              <line class="research-grid-line" x1="0" y1="48" x2="${SIGNAL_WIDTH}" y2="48"></line>
              <line class="research-axis-line" x1="0" y1="${SIGNAL_HEIGHT / 2}" x2="${SIGNAL_WIDTH}" y2="${SIGNAL_HEIGHT / 2}"></line>
              <line class="research-grid-line" x1="0" y1="142" x2="${SIGNAL_WIDTH}" y2="142"></line>
              <path data-role="relay-wave" class="research-relay-wave"></path>
              <path data-role="player-wave" class="research-player-wave"></path>
            </svg>
            <div class="research-slider">
              <label for="research-frequency">Frequency <output data-role="frequency-value"></output></label>
              <input id="research-frequency" data-role="frequency" type="range" min="0.5" max="1.5" step="0.01" value="${frequency}">
            </div>
            <div class="research-slider">
              <label for="research-phase">Phase <output data-role="phase-value"></output></label>
              <input id="research-phase" data-role="phase" type="range" min="-180" max="180" step="1" value="${phaseDegrees}">
            </div>
            <div class="research-details" data-role="requirements" aria-live="polite"></div>
            <p class="research-message" data-role="console-message" role="status"></p>
            <div class="research-console-actions"><button type="button" data-action="cancel">Cancel</button><button class="research-primary" type="button" data-action="send" disabled>Send Data</button></div>
          </section>
          <details class="research-test-controls">
            <summary>Development test controls</summary>
            <p>These controls are for testing send-time checks and expedition failure.</p>
            <div class="research-actions">
              <button type="button" data-action="toggle-relay"></button>
              <button type="button" data-action="drain-energy">Set energy to 0</button>
              <button type="button" data-action="restore-energy">Restore energy to 100</button>
              <button type="button" data-action="duplicate" disabled>Attempt duplicate send</button>
              <button class="research-danger" type="button" data-action="fail">Simulate expedition failure</button>
            </div>
            <p class="research-message" data-role="test-message" role="status"></p>
          </details>
          <footer class="research-complete"><p data-role="stage-status">Research is in progress.</p><button class="research-primary" type="button" data-action="complete">Finish Research</button></footer>
        </div>
      </div>
    </div>
  `;
  container.append(root);

  const $ = selector => root.querySelector(selector);
  const elements = {
    energy: $('[data-role="energy"]'),
    storage: $('[data-role="storage"]'),
    storageFill: $('[data-role="storage-fill"]'),
    findingCount: $('[data-role="finding-count"]'),
    scanCount: $('[data-role="scan-count"]'),
    scanList: $('[data-role="scan-list"]'),
    scanDetails: $('[data-role="scan-details"]'),
    actionMessage: $('[data-role="action-message"]'),
    console: $('[data-role="console"]'),
    signalStatus: $('[data-role="signal-status"]'),
    frequency: $('[data-role="frequency"]'),
    frequencyValue: $('[data-role="frequency-value"]'),
    phase: $('[data-role="phase"]'),
    phaseValue: $('[data-role="phase-value"]'),
    relayWave: $('[data-role="relay-wave"]'),
    playerWave: $('[data-role="player-wave"]'),
    requirements: $('[data-role="requirements"]'),
    consoleMessage: $('[data-role="console-message"]'),
    sendData: $('[data-action="send"]'),
    relayState: $('[data-role="relay-state"]'),
    antenna: $('[data-role="antenna"]'),
    loadout: $('[data-role="loadout"]'),
    failure: $('[data-role="failure"]'),
    testMessage: $('[data-role="test-message"]'),
    toggleRelay: $('[data-action="toggle-relay"]'),
    duplicate: $('[data-action="duplicate"]'),
    complete: $('[data-action="complete"]'),
  };
  elements.frequency.value = frequency;
  elements.phase.value = phaseDegrees;

  root.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'collect') collectScan();
    if (action === 'transmit') beginTransmission();
    if (action === 'cancel') cancelTransmission();
    if (action === 'send') sendActiveScan();
    if (action === 'toggle-relay') toggleRelay();
    if (action === 'drain-energy') {
      gameState.remainingEnergy = 0;
      setMessage(elements.testMessage, 'Battery energy set to 0. The send-time check will block transmission.', '');
      render();
    }
    if (action === 'restore-energy') {
      gameState.remainingEnergy = 100;
      setMessage(elements.testMessage, 'Battery energy restored to 100.', '');
      render();
    }
    if (action === 'duplicate') attemptDuplicate();
    if (action === 'fail') simulateFailure();
    if (action === 'complete' && !completionRequested && !data.expeditionFailed) {
      completionRequested = true;
      elements.complete.disabled = true;
      onComplete(gameState);
    }
    const scanButton = event.target.closest('[data-scan-id]');
    if (scanButton) {
      selectedScanId = scanButton.dataset.scanId;
      render();
    }
  }, { signal: controller.signal });
  elements.frequency.addEventListener('input', () => {
    frequency = Number(elements.frequency.value);
    renderSignal();
  }, { signal: controller.signal });
  elements.phase.addEventListener('input', () => {
    phaseDegrees = Number(elements.phase.value);
    renderSignal();
  }, { signal: controller.signal });

  render();
  return () => {
    controller.abort();
    root.remove();
  };

  function collectScan() {
    if (data.expeditionFailed) return setMessage(elements.actionMessage, 'The expedition has failed; no more scans can be collected.', 'error');
    if (gameState.remainingEnergy < GAMEPLAY_VALUES.scanEnergyCost) {
      return setMessage(elements.actionMessage, `Insufficient battery energy to scan (need ${GAMEPLAY_VALUES.scanEnergyCost}).`, 'error');
    }
    const sequence = data.nextScanSequence;
    const sizeMb = GAMEPLAY_VALUES.scanSizesMb[(sequence - 1) % GAMEPLAY_VALUES.scanSizesMb.length];
    if (gameState.remainingStorage < sizeMb) return setMessage(elements.actionMessage, 'Not enough onboard storage for another scan.', 'error');
    const scan = {
      id: `research-${gameState.selectedDestinationId}-${sequence}`,
      name: `Spectral survey ${sequence}`,
      sizeMb,
    };
    gameState.remainingEnergy -= GAMEPLAY_VALUES.scanEnergyCost;
    gameState.remainingStorage -= sizeMb;
    data.scans.push(scan);
    data.nextScanSequence += 1;
    selectedScanId = scan.id;
    setMessage(elements.actionMessage, `Scan collected for ${GAMEPLAY_VALUES.scanEnergyCost} energy.`, 'success');
    render();
  }

  function beginTransmission() {
    const scan = data.scans.find(item => item.id === selectedScanId);
    const blockers = getTransmissionBlockers(gameState, scan);
    if (blockers.length) {
      setMessage(elements.actionMessage, blockers.join(' '), 'error');
      return;
    }
    activeScanId = scan.id;
    setMessage(elements.actionMessage, '', '');
    setMessage(elements.consoleMessage, '', '');
    render();
  }

  function cancelTransmission() {
    activeScanId = null;
    setMessage(elements.actionMessage, 'Tuning cancelled. No energy or storage was changed.', '');
    setMessage(elements.consoleMessage, '', '');
    render();
  }

  function sendActiveScan() {
    const result = transmitScan(gameState, activeScanId, getSignalStatus(frequency, phaseDegrees) === 'Locked');
    if (!result.ok) {
      setMessage(elements.consoleMessage, result.reason, 'error');
      render();
      return;
    }
    activeScanId = null;
    selectedScanId = data.scans[0]?.id ?? null;
    setMessage(elements.actionMessage, `${result.finding.name} transmitted. ${result.energyCost} energy spent; storage released.`, 'success');
    setMessage(elements.consoleMessage, '', '');
    setMessage(elements.testMessage, 'Transmission recorded in shared game state.', 'success');
    render();
  }

  function toggleRelay() {
    data.relayAvailable = !data.relayAvailable;
    setMessage(elements.testMessage, `Relay is now ${data.relayAvailable ? 'available' : 'unavailable'}.`, '');
    render();
  }

  function attemptDuplicate() {
    const finding = data.transmittedFindings.at(-1);
    if (!finding) return;
    const result = transmitScan(gameState, finding.scanId, true);
    setMessage(elements.testMessage, result.reason ?? 'Unexpected duplicate transmission.', result.ok ? 'error' : 'success');
  }

  function simulateFailure() {
    if (!failResearchExpedition(gameState)) {
      setMessage(elements.testMessage, 'This expedition is already marked as failed.', 'error');
      return;
    }
    selectedScanId = null;
    activeScanId = null;
    setMessage(elements.testMessage, `${data.transmittedFindings.length} transmitted finding(s) retained; unsent scans discarded.`, 'success');
    render();
  }

  function render() {
    const used = GAMEPLAY_VALUES.storageCapacityMb - gameState.remainingStorage;
    const selected = data.scans.find(scan => scan.id === selectedScanId);
    const active = data.scans.find(scan => scan.id === activeScanId);
    const antenna = getAntenna(gameState);
    const loadoutMass = getOtherLoadoutMass(gameState) + (antenna.massKg ?? 0);
    const selectedBlockers = selected ? getTransmissionBlockers(gameState, selected) : [];

    elements.energy.textContent = `${formatNumber(gameState.remainingEnergy)} / 100`;
    elements.storage.textContent = `${formatMb(used)} used · ${formatMb(gameState.remainingStorage)} available / ${formatMb(GAMEPLAY_VALUES.storageCapacityMb)}`;
    elements.storageFill.style.width = `${Math.max(0, Math.min(100, (used / GAMEPLAY_VALUES.storageCapacityMb) * 100))}%`;
    elements.findingCount.textContent = String(data.transmittedFindings.length);
    elements.scanCount.textContent = `${data.scans.length} unsent`;
    elements.scanList.innerHTML = data.scans.length
      ? data.scans.map(scan => `<button class="research-scan${scan.id === selectedScanId ? ' is-selected' : ''}" type="button" data-scan-id="${escapeHtml(scan.id)}" aria-pressed="${scan.id === selectedScanId}"><span><strong>${escapeHtml(scan.name)}</strong><small>${escapeHtml(scan.id)}</small></span><span>${formatMb(scan.sizeMb)}</span></button>`).join('')
      : '<p class="research-muted">No unsent scans onboard.</p>';
    $('[data-action="collect"]').disabled = data.expeditionFailed || gameState.remainingEnergy < GAMEPLAY_VALUES.scanEnergyCost;
    $('[data-action="transmit"]').disabled = !selected || Boolean(active);
    elements.scanDetails.innerHTML = selected
      ? `<div><strong>Selected:</strong> ${escapeHtml(selected.name)} (${formatMb(selected.sizeMb)})</div><div><strong>Transmission cost:</strong> ${transmissionCost(selected)} energy (available: ${formatNumber(gameState.remainingEnergy)})</div><div><strong>Antenna check:</strong> ${escapeHtml(getAntennaCheck(antenna, selected))}</div><div><strong>Relay:</strong> ${data.relayAvailable ? 'Available' : 'Unavailable'}</div>${selectedBlockers.length ? `<div class="research-message is-error">${escapeHtml(selectedBlockers.join(' '))}</div>` : ''}`
      : '<div>Select an unsent scan to review transmission requirements.</div>';
    elements.antenna.innerHTML = `<strong>${escapeHtml(antenna.name ?? antenna.id ?? 'Selected antenna')}</strong><span>Limit: ${Number.isFinite(antenna.maxDataPerContactMb) ? `${formatMb(antenna.maxDataPerContactMb)} / contact` : 'not configured'}</span><span>Antenna mass</span><span>${Number.isFinite(antenna.massKg) ? `${formatNumber(antenna.massKg)} kg` : 'not configured'}</span>`;
    elements.relayState.textContent = data.relayAvailable ? 'Relay available' : 'Relay unavailable';
    const limit = getLoadoutLimit(gameState);
    elements.loadout.textContent = `Mission loadout: ${formatNumber(loadoutMass)} / ${formatNumber(limit)} kg (includes antenna mass)${loadoutMass > limit ? ' — over the loadout limit' : ''}`;
    elements.failure.hidden = !data.expeditionFailed;
    $('[data-role="stage-status"]').textContent = data.expeditionFailed ? 'Expedition has failed.' : 'Research is in progress.';
    elements.duplicate.disabled = data.transmittedFindings.length === 0;
    elements.toggleRelay.textContent = data.relayAvailable ? 'Make relay unavailable' : 'Restore relay';
    elements.complete.disabled = completionRequested || data.expeditionFailed;
    elements.console.hidden = !active;
    if (active) renderSignal();
  }

  function renderSignal() {
    const status = getSignalStatus(frequency, phaseDegrees);
    const active = data.scans.find(scan => scan.id === activeScanId);
    const blockers = getTransmissionBlockers(gameState, active);
    elements.signalStatus.textContent = status;
    elements.signalStatus.className = `research-signal-status${status === 'Locked' ? ' is-locked' : status === 'Weak signal' ? ' is-weak' : ''}`;
    elements.frequencyValue.value = Number(frequency).toFixed(2);
    elements.phaseValue.value = `${Math.round(phaseDegrees)}°`;
    elements.relayWave.setAttribute('d', makeWave(1, 0));
    elements.playerWave.setAttribute('d', makeWave(frequency, phaseDegrees));
    elements.requirements.innerHTML = `<div><strong>Selected scan:</strong> ${active ? `${escapeHtml(active.name)} · ${formatMb(active.sizeMb)}` : 'none'}</div><div><strong>Energy required:</strong> ${active ? `${transmissionCost(active)} (available: ${formatNumber(gameState.remainingEnergy)})` : '—'}</div><div><strong>Requirements:</strong> ${blockers.length ? escapeHtml(blockers.join(' ')) : 'Relay, antenna, scan, and energy checks passed.'}</div>`;
    elements.sendData.disabled = status !== 'Locked' || blockers.length > 0;
  }

  function setMessage(element, message, kind) {
    element.textContent = message;
    element.className = `research-message${kind ? ` is-${kind}` : ''}`;
  }
}

function researchData(gameState) {
  gameState.stageData.research ??= {};
  const data = gameState.stageData.research;
  data.scans ??= [];
  data.transmittedFindings ??= [];
  data.nextScanSequence ??= 1;
  if (typeof data.relayAvailable !== 'boolean') data.relayAvailable = true;
  if (typeof data.expeditionFailed !== 'boolean') data.expeditionFailed = false;
  return data;
}

function getAntenna(gameState) {
  return gameState.stageData.preparation2?.antenna ?? GAMEPLAY_VALUES.defaultAntenna;
}

function getOtherLoadoutMass(gameState) {
  return gameState.stageData.preparation2?.otherLoadoutMassKg ?? GAMEPLAY_VALUES.otherLoadoutMassKg;
}

function getLoadoutLimit(gameState) {
  return gameState.stageData.preparation2?.loadoutLimitKg ?? GAMEPLAY_VALUES.loadoutLimitKg;
}

function getAntennaCheck(antenna, scan) {
  if (!Number.isFinite(antenna.maxDataPerContactMb)) return 'Antenna data limit missing.';
  if (scan.sizeMb > antenna.maxDataPerContactMb) return `No — exceeds ${formatMb(antenna.maxDataPerContactMb)} per contact.`;
  return `Yes — within ${formatMb(antenna.maxDataPerContactMb)} per contact.`;
}

function makeWave(waveFrequency, phaseDegrees) {
  const phase = phaseDegrees * Math.PI / 180;
  const centerY = SIGNAL_HEIGHT / 2;
  const amplitude = SIGNAL_HEIGHT * 0.34;
  const usableWidth = SIGNAL_WIDTH - SIGNAL_PADDING * 2;
  const points = [];
  for (let index = 0; index <= 180; index += 1) {
    const x = SIGNAL_PADDING + usableWidth * index / 180;
    const angle = index / 180 * Math.PI * 4 * waveFrequency + phase;
    const y = centerY - Math.sin(angle) * amplitude;
    points.push(`${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
}

function phaseDistance(first, second) {
  const difference = Math.abs(first - second) % 360;
  return Math.min(difference, 360 - difference);
}

function formatMb(value) {
  return `${formatNumber(value)} MB`;
}

function formatNumber(value) {
  return Number.isFinite(value) ? Number(value).toFixed(Number.isInteger(value) ? 0 : 1) : 'unavailable';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}
