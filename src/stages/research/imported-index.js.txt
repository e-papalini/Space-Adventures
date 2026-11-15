import { element, button } from '../../ui/dom.js';
import { bennu, instrumentsFor, toolGuides } from './config.js';
import { initialize, returnToFlag, nearbySite, inspectSite, performAction, actionError, taskProgress, missionReady } from './model.js';
import { createWorldRenderer } from './world.js';
import { direction, stepMotion } from './motion.js';
import { bindControls } from './controls.js';
import { missionFor, startMission, advanceMission, endMission, remainingSeconds, formatTime } from './mission.js';

const instrumentLabels = { camera: 'Take picture', infrared: 'Study the rock', lidar: 'Map the ground', sample: 'Pick up sample' };
const glyphs = { camera: '▣', infrared: '⌁', lidar: '◎', sample: '⚒' };

export function mount(container, state, onComplete) {
  const root = element('section', undefined, 'stage-research'); container.append(root);
  if (state.selectedDestinationId !== 'bennu') {
    root.append(element('p', 'This prototype supports Bennu only. Select Bennu in the development harness.'));
    return () => root.remove();
  }
  const trip = initialize(state), mission = missionFor(state), instruments = instrumentsFor(state);
  const motion = { vx: 0, vy: 0, angle: 0 };
  let selected = instruments[0]?.id, disposed = false, submitted = false;
  let frame, last, panelTime = -Infinity, operation = null, returning = null, flash = 0, inspected = null;
  let resultsShown = false, toastUntil = 0;

  const canvas = element('canvas', undefined, 'research-world');
  canvas.setAttribute('aria-label', 'Top-down Bennu rover exploration. Use WASD or arrows, E to investigate, and 1–4 to select instruments.');
  root.append(canvas);
  const top = element('header', undefined, 'research-top research-glass');
  const title = element('div'); title.append(element('small', 'OSIRIS-REx / A SCIENCE GAME'), element('h2', 'EXPLORE BENNU'));
  const timer = element('strong', formatTime(remainingSeconds(state)), 'research-timer'); timer.setAttribute('aria-label', 'Mission time remaining');
  function meter(label, max, className) {
    const box = element('label', undefined, className), text = element('span'), bar = element('meter');
    bar.min = 0; bar.max = Math.max(1, max); bar.setAttribute('aria-label', label); box.append(text, bar); return { box, text, bar };
  }
  const energy = meter('Remaining energy', mission.initialEnergy, 'research-meter');
  const storage = meter('Storage free', mission.initialStorage, 'research-meter');
  top.append(title, timer, energy.box, storage.box);
  const side = element('aside', undefined, 'research-side research-glass');
  const taskHeader = element('h3', 'YOUR SCIENCE TASKS'), tasks = element('div'), progress = element('small');
  const taskRows = bennu.tasks.map(task => {
    const row = element('div', undefined, 'research-task'), count = element('b'), label = element('span', task.label);
    row.append(count, label); tasks.append(row); return { task, row, count };
  });
  const info = element('details'), infoText = element('p', 'The real OSIRIS-REx collected rocks from a spacecraft, not a rover. Our rover and repeating map are game ideas, not a model of Bennu’s shape. Gold rings show places to study. You can drive over small rocks and shallow craters, but not large boulders. Finish any one task you have a tool for.');
  const fieldLog = element('ol', undefined, 'research-log');
  info.append(element('summary', 'Help & your findings'), infoText,
    element('p', 'WASD / arrows: drive · 1–4: choose a tool · E: look closer, then use a tool. Each tool use costs energy and space to save data. Looking at a place, driving and returning to base are free. Samples need more study in a lab.'), fieldLog);
  if (state.stageData.developmentFixture) info.append(element('p', 'Development equipment loadout — replaceable harness fixture.'));
  const returnButton = button('↩ Return to flag', () => beginReturn());
  const finishButton = button('End mission early', () => showResults('objectives-achieved'));
  side.append(taskHeader, progress, tasks, info, returnButton, finishButton);
  const tripHud = element('div', undefined, 'research-trip research-glass');
  const notice = element('div', undefined, 'research-notice research-glass'); notice.hidden = true; notice.setAttribute('role', 'alert');
  const toast = element('div', undefined, 'research-toast research-glass'); toast.hidden = true; toast.setAttribute('role', 'status');
  const toastTitle = element('strong'), toastText = element('p'), photo = element('canvas', undefined, 'research-photo');
  photo.width = 180; photo.height = 116; photo.hidden = true; photo.setAttribute('aria-label', 'Your picture of this rocky place');
  toast.append(toastTitle, toastText, photo);
  const bottom = element('footer', undefined, 'research-bottom research-glass'), toolbar = element('div', undefined, 'research-toolbar');
  toolbar.setAttribute('role', 'group'); toolbar.setAttribute('aria-label', 'Installed scientific instruments');
  const instrumentButtons = instruments.map((item, index) => {
    const node = button('', () => selectInstrument(index));
    const icon = element('span', glyphs[item.kind], 'research-icon'); icon.setAttribute('aria-hidden', 'true');
    const status = element('small');
    node.append(icon, element('span', `${index + 1} · ${item.name}`), status);
    node.title = `${item.name} · ${item.watts} W · ${item.mb} MB per action${item.singleUse ? ' · Single use' : ''}`;
    toolbar.append(node); return { item, node, status };
  });
  if (!instruments.length) toolbar.append(element('p', 'No tools were installed in Preparation. You can still explore and look at places. Your mission ends when time runs out.'));
  const context = element('p', undefined, 'research-context'), interactButton = button('E · Investigate', interact);
  const actionProgress = element('progress'); actionProgress.max = 1; actionProgress.value = 0; actionProgress.hidden = true; actionProgress.setAttribute('aria-label', 'Instrument operation progress');
  const interactionRow = element('div', undefined, 'research-interaction'); interactionRow.append(context, interactButton);
  bottom.append(toolbar, interactionRow, actionProgress);
  const pad = element('div', undefined, 'research-pad'); pad.setAttribute('aria-label', 'Touch movement controls');
  for (const [label, key, name] of [['↑', 'arrowup', 'up'], ['←', 'arrowleft', 'left'], ['↓', 'arrowdown', 'down'], ['→', 'arrowright', 'right']]) {
    const node = button(label, () => {}); node.dataset.direction = key; node.className = `research-pad-${name}`; node.setAttribute('aria-label', `Drive ${name}`); pad.append(node);
  }
  const overlay = element('div', undefined, 'research-overlay');
  const inspection = element('div', undefined, 'research-inspection research-glass'); inspection.hidden = true;
  inspection.setAttribute('role', 'region'); inspection.setAttribute('aria-label', 'Look closer at this place');
  const inspectionTitle = element('h3'), inspectionDescription = element('p'), inspectionQuestion = element('p'), inspectionWhy = element('p'), inspectionTools = element('p');
  const closeInspection = button('×', () => { inspected = null; inspection.hidden = true; refresh(); });
  closeInspection.setAttribute('aria-label', 'Close place information'); closeInspection.className = 'research-inspection-close';
  inspection.append(closeInspection, inspectionTitle, inspectionDescription, inspectionQuestion, inspectionWhy, inspectionTools);
  root.append(top, side, tripHud, notice, toast, inspection, bottom, pad, overlay);
  const renderer = createWorldRenderer(canvas);
  function inspectCanvas(event) {
    if (mission.phase !== 'exploring' || operation || returning) return;
    const rect = canvas.getBoundingClientRect(), site = renderer.siteAtScreen(event.clientX - rect.left, event.clientY - rect.top);
    if (site) inspect(site.id);
  }
  canvas.addEventListener('click', inspectCanvas);
  const resizeObserver = new ResizeObserver(() => renderer.resize()); resizeObserver.observe(canvas);
  const controls = bindControls({ host: root, pad,
    active: () => !disposed && mission.phase === 'exploring', interact, select: selectInstrument,
    onBlur: () => { motion.vx = 0; motion.vy = 0; },
  });

  function notify(title, text, duration = 6500) {
    toastTitle.textContent = title; toastText.textContent = text; photo.hidden = true;
    toast.hidden = false; toastUntil = performance.now() + duration;
  }
  function renderLog() {
    fieldLog.replaceChildren();
    for (const discovery of state.scientificDiscoveries.filter(d => d.destinationId === 'bennu')) fieldLog.append(element('li', discovery.explanation ?? discovery.discoveryId));
  }
  function selectInstrument(index) {
    if (!instruments[index] || operation || returning || mission.phase !== 'exploring') return;
    selected = instruments[index].id; refresh();
  }
  function interact() {
    if (mission.phase !== 'exploring' || operation || returning) return;
    const site = nearbySite(state);
    if (site && inspected !== site.id) { inspect(site.id); return; }
    const error = actionError(state, selected, site?.id);
    if (error) { notify('Try another tool', error); return; }
    const instrument = instruments.find(item => item.id === selected);
    controls.clear();
    operation = { instrumentId: selected, siteId: site.id, kind: instrument.kind, elapsed: 0, progress: 0 };
    refresh();
  }
  function inspect(siteId) {
    const result = inspectSite(state, siteId);
    if (result.error) { notify('A little closer!', result.error); return; }
    inspected = result.site.id; toast.hidden = true;
    controls.clear();
    inspectionTitle.textContent = result.site.name;
    inspectionDescription.textContent = result.site.hint;
    inspectionQuestion.textContent = result.site.question;
    inspectionWhy.textContent = result.site.why;
    inspectionTools.textContent = result.recommended.length
      ? `Try: ${result.recommended.map(item => item.name).join(' or ')}. Choose a glowing tool below. Press E or tap the action button to use it.`
      : 'You did not install a tool for this place in Preparation. You can still look around. Other places may suit your tools.';
    inspection.hidden = false; refresh();
  }
  function beginReturn() {
    if (mission.phase !== 'exploring' || returning) return;
    operation = null; inspected = null; inspection.hidden = true; controls.clear();
    returning = { elapsed: 0, relocated: false };
    notify('Heading back!', 'Your rover is returning to the red flag. You keep your findings and samples. Energy, storage and the clock stay as they are.');
    refresh();
  }
  function showBriefing() {
    const panel = element('div', undefined, 'research-dialog');
    panel.append(element('small', 'SURFACE SCIENCE / BENNU'), element('h1', 'Read the rocks.'),
      element('p', `Explore for ${formatTime(mission.durationSeconds)}. Drive to gold markers. Press E or tap a place to look closer. Then choose a tool and use it. Finish any one task that matches your tools.`),
      element('p', 'WASD / arrows to drive · 1–4 to choose a tool · E to look closer or use a tool. On touch screens, hold the direction buttons. Keep going: the map repeats at its edges. You can return to the red flag whenever you like.'),
      element('p', 'The real OSIRIS-REx collected samples from a spacecraft. Our rover and repeating map are just for this game. Your clock waits until you start.'));
    const introduction = element('div', undefined, 'research-tool-intro');
    for (const item of instruments) {
      const guide = toolGuides[item.kind], entry = element('div');
      const icon = element('span', glyphs[item.kind], 'research-icon'); icon.setAttribute('aria-hidden', 'true');
      entry.append(icon, element('strong', item.name), element('p', guide.description), element('small', guide.example));
      introduction.append(entry);
    }
    if (!instruments.length) introduction.append(element('p', 'No tools were installed in Preparation. You can explore and look at places, but cannot do tool-based tasks.'));
    panel.append(element('h3', 'MEET YOUR TOOLS'), introduction,
      button('Start Exploring →', () => {
        startMission(state); last = performance.now(); overlay.hidden = true; controls.clear(); refresh();
      }));
    overlay.replaceChildren(panel);
  }
  function showResults(reason) {
    if (disposed || resultsShown) return;
    if (mission.phase !== 'results') {
      if (reason === 'objectives-achieved' && !missionReady(state)) return;
      endMission(state, reason);
    }
    resultsShown = true; operation = null; returning = null; inspected = null; inspection.hidden = true; controls.clear();
    toast.hidden = true; notice.hidden = true;
    const panel = element('div', undefined, 'research-dialog research-results');
    const achieved = mission.objectivesAchieved;
    panel.append(element('small', 'OSIRIS-REx / BENNU'), element('h1', achieved ? 'Great exploring! Task complete.' : 'Your trip is complete'),
      element('p', `${mission.endReason === 'time-limit' ? 'Time is up.' : 'You finished early.'} ${achieved ? 'You finished a science task!' : 'No full task finished this time.'} All your findings and samples are saved.`));
    const summary = element('div', undefined, 'research-summary');
    const completed = bennu.tasks.filter(task => taskProgress(state, task) >= task.target).length;
    const discoveries = state.scientificDiscoveries.filter(d => d.destinationId === 'bennu');
    const samples = state.collectedSamples.filter(s => s.destinationId === 'bennu').reduce((sum, s) => sum + (s.quantity ?? 1), 0);
    for (const [label, value] of [
      ['Tasks completed', `${completed} / ${bennu.tasks.filter(t => instruments.some(i => i.kind === t.kind)).length} available`],
      ['Findings saved', discoveries.length], ['Samples picked up', samples],
      ['Energy remaining', `${state.remainingEnergy.toFixed(2)} Wh`],
      ['Storage used this mission', `${Math.max(0, mission.initialStorage - state.remainingStorage).toFixed(0)} MB`],
      ['Storage remaining', `${state.remainingStorage.toFixed(0)} MB`], ['Time used', formatTime(mission.elapsedSeconds)],
    ]) { const entry = element('div'); entry.append(element('small', label), element('strong', String(value))); summary.append(entry); }
    panel.append(summary);
    const list = element('ul');
    for (const task of bennu.tasks) {
      const available = instruments.some(i => i.kind === task.kind), count = taskProgress(state, task);
      list.append(element('li', `${!available ? 'Not equipped' : count >= task.target ? 'Complete' : `Incomplete ${count}/${task.target}`} · ${task.label}`));
    }
    const findings = element('details'), findingsList = element('ol');
    for (const discovery of discoveries) findingsList.append(element('li', discovery.explanation ?? discovery.discoveryId));
    findings.append(element('summary', 'Look at your findings'), findingsList);
    const continueButton = button('Finish Research & continue →', () => {
      if (submitted || disposed) return;
      submitted = true; continueButton.disabled = true; cleanup(); onComplete(state);
    });
    panel.append(list, findings, continueButton); overlay.replaceChildren(panel); overlay.hidden = false;
    panel.tabIndex = -1; panel.focus({ preventScroll: true }); refresh();
  }

  function refresh() {
    const remaining = remainingSeconds(state), site = nearbySite(state), active = mission.phase === 'exploring';
    timer.textContent = formatTime(remaining);
    timer.classList.toggle('research-urgent', active && remaining <= 30);
    timer.classList.toggle('research-caution', active && remaining <= 60 && remaining > 30);
    energy.text.textContent = `ENERGY ${state.remainingEnergy.toFixed(2)} Wh`; energy.bar.value = state.remainingEnergy;
    storage.text.textContent = `DATA ${state.remainingStorage.toFixed(0)} MB free`; storage.bar.value = state.remainingStorage;
    let completed = 0, available = 0;
    for (const { task, row, count } of taskRows) {
      const installed = instruments.some(item => item.kind === task.kind), value = taskProgress(state, task), done = value >= task.target;
      if (installed) available++; if (installed && done) completed++;
      row.classList.toggle('research-task-done', installed && done); row.classList.toggle('research-task-unavailable', !installed);
      count.textContent = !installed ? '—' : done ? '✓' : `${value}/${task.target}`;
      row.title = !installed ? 'Unavailable: required instrument was not installed' : done ? 'Task complete' : 'Task available';
    }
    progress.textContent = `${completed} / ${available} available tasks complete`;
    tripHud.textContent = `TRAVELLED ${Math.floor(trip.tripDistance)} m · MAP REPEATS`;
    if (inspected && inspected !== site?.id) { inspected = null; inspection.hidden = true; }
    const busy = Boolean(operation || returning);
    for (const { item, node, status } of instrumentButtons) {
      const consumed = item.singleUse && trip.actions.some(a => a.instrumentId === item.id);
      const error = actionError(state, item.id, site?.id);
      node.setAttribute('aria-pressed', String(item.id === selected));
      node.disabled = !active || Boolean(operation || returning) || Boolean(consumed);
      node.classList.toggle('research-compatible', !error && !busy && active);
      node.classList.toggle('research-recommended', inspected === site?.id && Boolean(site?.kinds.includes(item.kind)));
      status.textContent = consumed ? 'Single use · used' : operation?.instrumentId === item.id ? 'Working…' : !error && !busy ? 'Ready here' : site?.kinds.includes(item.kind) ? error?.includes('already') ? 'Saved' : 'Cannot use here' : item.singleUse ? 'Single use' : 'Choose tool';
    }
    const chosen = instruments.find(item => item.id === selected);
    const error = actionError(state, selected, site?.id);
    const needsInspection = site && inspected !== site.id;
    context.textContent = returning ? 'Heading back to the flag…' : operation ? `${chosen?.name} is working…` : site ? `${site.name} · ${needsInspection ? 'Press E or tap to look closer. Looking is free!' : error ?? 'Press E or tap to use your tool.'}` : 'Find gold markers on the small map. WASD / arrows to drive; 1–4 to choose a tool.';
    interactButton.textContent = needsInspection ? 'E · Look closer' : `E · ${instrumentLabels[chosen?.kind] ?? 'Use tool'}`;
    interactButton.disabled = !active || busy || !site || (!needsInspection && Boolean(error));
    returnButton.disabled = !active || Boolean(returning);
    finishButton.disabled = !active || !missionReady(state) || Boolean(operation || returning);
    actionProgress.hidden = !operation; actionProgress.value = operation?.progress ?? 0;
    if (active && remaining <= 60) {
      notice.hidden = false; notice.textContent = remaining <= 30 ? `LAST ${Math.ceil(remaining)} SECONDS · Time for one more look?` : 'ONE MINUTE LEFT · Your findings are safe.';
    } else notice.hidden = true;
    pad.hidden = !active;
  }

  function tick(now) {
    if (disposed) return;
    const elapsed = last === undefined ? 0 : Math.max(0, (now - last) / 1000); last = now;
    // The clock uses real elapsed time, including a background tab. Physics is
    // capped to avoid a large movement jump after focus or visibility changes.
    advanceMission(state, elapsed);
    const dt = Math.min(elapsed, .05);
    if (mission.phase === 'results' && !resultsShown) showResults('time-limit');
    if (mission.phase === 'exploring') {
      if (remainingSeconds(state) <= 60 && !mission.warnedMinute) {
        mission.warnedMinute = true; notify('One minute left!', 'Finish what you can. You keep your findings even if some tasks are not done.');
      }
      if (returning) {
        returning.elapsed += dt;
        if (returning.elapsed >= bennu.returnAnimationSeconds / 2 && !returning.relocated) {
          returnToFlag(state); returning.relocated = true;
        }
        if (returning.elapsed >= bennu.returnAnimationSeconds) { returning = null; notify('Back at the red flag', 'Ready to go again! Your findings are saved and the clock keeps running.'); }
      } else if (operation) {
        operation.elapsed += dt; operation.progress = Math.min(1, operation.elapsed / bennu.actionDurationSeconds);
        if (operation.progress >= 1) {
          const completedBefore = bennu.tasks.filter(t => taskProgress(state, t) >= t.target).length;
          const result = performAction(state, operation.instrumentId, operation.siteId);
          if (result.error) notify('Tool stopped', result.error);
          else {
            const completedAfter = bennu.tasks.filter(t => taskProgress(state, t) >= t.target).length;
            notify(completedAfter > completedBefore ? '✓ You finished a science task!' : 'New finding saved!', result.discovery.explanation, 12000);
            inspected = null; inspection.hidden = true;
            if (operation.kind === 'camera') { flash = 1; photo.hidden = false; renderer.photograph(operation.siteId, photo); }
            if (completedAfter > completedBefore) { side.classList.remove('research-reward'); void side.offsetWidth; side.classList.add('research-reward'); }
            renderLog();
          }
          operation = null;
        }
      } else {
        stepMotion(state, motion, direction(controls.keys()), dt);
      }
    }
    flash = Math.max(0, flash - dt * 3);
    if (!toast.hidden && now >= toastUntil) toast.hidden = true;
    if (now - panelTime >= 100) { refresh(); panelTime = now; }
    renderer.draw(trip, { angle: motion.angle, siteId: nearbySite(state)?.id, operation, flash,
      returning: Boolean(returning), returnFade: returning ? Math.sin(Math.min(1, returning.elapsed / bennu.returnAnimationSeconds) * Math.PI) : 0,
    }, dt, now);
    frame = requestAnimationFrame(tick);
  }
  function cleanup() {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frame); controls.destroy(); resizeObserver.disconnect(); canvas.removeEventListener('click', inspectCanvas); root.remove();
  }
  renderLog();
  if (mission.phase === 'briefing') showBriefing(); else if (mission.phase === 'results') showResults(mission.endReason); else overlay.hidden = true;
  refresh(); frame = requestAnimationFrame(tick);
  return cleanup;
}
