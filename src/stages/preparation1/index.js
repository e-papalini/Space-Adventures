import { renderDestinationMap } from '../preparation2/rover-building/destinationMap.mjs';
import { destinations } from '../preparation2/rover-building/data/destinations.mjs';
import { levels, canStartDestination, nextLevel, progressStore } from '../../core/progression.js';

export function mount(container, state, onComplete) {
  const root = document.createElement('section'); root.id = 'rover-building-root';
  let selected = state.selectedDestinationId, done = false;
  function render() {
    const profile=progressStore.load(), next=nextLevel(profile);
    root.innerHTML = renderDestinationMap(destinations, selected)
      .replace('Every destination is open for selection.', 'Bennu is ready for the complete five-stage mission.')
      .replace('Select any map marker', 'Select Bennu’s map marker');
    for (const button of root.querySelectorAll('[data-action="select-destination"]')) {
      const level=levels.find(item=>item.id===button.dataset.destinationId), unlocked=profile.totalPoints>=level.points;
      button.disabled=!canStartDestination(level.id,profile);
      button.title=unlocked ? level.playable?'Ready to explore!':'Unlocked! This destination’s gameplay is being built.' : `Locked · ${level.points-profile.totalPoints} more points to unlock`;
      button.setAttribute('aria-label',`${level.name}. ${button.title}`);
      button.classList.toggle('earth-unlocked',unlocked);
    }
    const panel=document.createElement('div'); panel.className='earth-progress';
    const total=document.createElement('h3'); total.textContent=`Your space adventure · ${profile.totalPoints} points`; panel.append(total);
    for (const level of levels) {
      const row=document.createElement('p'), unlocked=profile.totalPoints>=level.points;
      row.textContent=`Level ${levels.indexOf(level)+1}: ${level.name} · ${unlocked?level.playable?'Ready!':'Unlocked · mission being built':`Locked · ${level.points-profile.totalPoints} more points`}`;
      panel.append(row);
    }
    const hint=document.createElement('p');hint.textContent=next?`${next.points-profile.totalPoints} more points unlock ${next.name}. Replays earn extra points when you beat your best score.`:'You have unlocked every destination!';panel.append(hint);
    if (next) {
      const bar=document.createElement('progress'); bar.max=next.points; bar.value=profile.totalPoints;
      bar.setAttribute('aria-label',`Points toward unlocking ${next.name}`); panel.append(bar);
    }
    root.querySelector('.preparation1__destination-info').prepend(panel);
    const notice = document.createElement('p'); notice.className = 'earth-integration-note';
    notice.textContent = progressStore.warning || 'Bennu is playable now. Earn points for future destinations; unfinished missions never open a placeholder screen.';
    root.append(notice);
  }
  function click(event) {
    const action = event.target.closest('[data-action]');
    if (!action || done) return;
    if (action.dataset.action === 'select-destination' && canStartDestination(action.dataset.destinationId,progressStore.load())) { selected = action.dataset.destinationId; render(); }
    if (action.dataset.action === 'confirm-destination' && canStartDestination(selected,progressStore.load())) { done = true; state.selectedDestinationId = selected; onComplete(state); }
  }
  root.addEventListener('click', click); container.append(root); render();
  return () => { done = true; root.removeEventListener('click', click); root.remove(); };
}
