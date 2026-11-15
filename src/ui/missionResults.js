import { element, button } from './dom.js';
import { levels, nextLevel, awardMission, progressStore } from '../core/progression.js';

export function renderMissionResults(container, state, returnToEarth) {
  const result=awardMission(progressStore.load(),state); progressStore.save(result.profile);
  const root=element('section',undefined,'mission-results');
  root.append(element('small','MISSION RESULTS'),element('h1','Great exploring!'),
    element('p',`Mission complete · ${levels.find(level=>level.id===state.selectedDestinationId)?.name}`),
    element('h2',`+${result.earned} new points · ${result.profile.totalPoints} total`),
    element('p',`Mission score: ${result.score}. Your best here: ${result.profile.bestScores[state.selectedDestinationId]??0}.`));
  const list=element('ul');
  for (const item of result.breakdown) list.append(element('li',`${item.label}: ${item.points}`));
  root.append(list,element('p',`${result.discoveries} different clues found · ${result.samples} sample places · ${result.transmitted} full findings sent to Earth.`),
    element('p','Your first score adds points. On replays, you earn the amount you improve your best score. Repeating the same action or sending extra packets does not add extra reward.'));
  if (result.newlyUnlocked.length) root.append(element('p',`New levels unlocked: ${result.newlyUnlocked.map(id=>levels.find(level=>level.id===id).name).join(', ')}! These exploration missions still need gameplay before they can be played.`));
  const next=nextLevel(result.profile);
  root.append(element('p',next?`${next.points-result.profile.totalPoints} more points to unlock ${next.name}.`:'All destinations unlocked!'));
  const findings=element('details'), findingsList=element('ul');
  findings.append(element('summary','Your scientific findings'));
  for (const discovery of state.scientificDiscoveries.filter(item=>item.destinationId===state.selectedDestinationId && item.instrumentId)) findingsList.append(element('li',discovery.explanation));
  findings.append(findingsList);root.append(findings);
  if (progressStore.warning) root.append(element('p',progressStore.warning,'app-error'));
  root.append(button('Return to Earth · choose your next adventure',returnToEarth));
  container.append(root);
}
