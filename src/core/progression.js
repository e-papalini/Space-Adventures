import { transmissionRewards } from '../stages/transmission/rewards.js';
// Unlock rules are independent of which destination worlds have been built.
export const levels = [
  { id:'bennu', name:'Bennu', points:0, playable:true },
  { id:'itokawa', name:'Itokawa', points:60, playable:false },
  { id:'ryugu', name:'Ryugu', points:140, playable:false },
  { id:'wild2', name:'Wild 2', points:220, playable:false },
  { id:'67p', name:'Comet 67P', points:300, playable:false },
];
export const unlockedDestinations = points => levels.filter(level => points >= level.points).map(level => level.id);
export const emptyProgress = () => ({ version:1, totalPoints:0, unlockedDestinations:['bennu'], completedMissions:[], bestScores:{} });
export function canStartDestination(id, profile) {
  const level = levels.find(level => level.id === id);
  return Boolean(level?.playable && unlockedDestinations(profile.totalPoints).includes(id));
}
export function nextLevel(profile) { return levels.find(level => profile.totalPoints < level.points) ?? null; }

// Score only real, installed-tool observations from the action log. Generated
// relay scans and packet splitting cannot multiply scientific achievements.
export function scoreMission(state) {
  const id = state.selectedDestinationId, data = state.stageData.research ?? {}, trip = data[id];
  const actions = new Map();
  for (const action of trip?.actions ?? []) {
    if (state.selectedEquipment.includes(action.instrumentId)) actions.set(`${action.siteId}:${action.kind}`, action);
  }
  const findings = new Map();
  for (const finding of state.scientificDiscoveries) {
    if (finding.destinationId === id && actions.has(`${finding.siteId}:${finding.kind}`)
      && state.selectedEquipment.includes(finding.instrumentId)) findings.set(finding.discoveryId, finding);
  }
  const counts = new Map();
  for (const action of actions.values()) counts.set(action.kind,(counts.get(action.kind)??0)+1);
  // Bennu rules; other worlds will supply their own tasks when implemented.
  const objectives = id === 'bennu' ? [['camera',3],['infrared',1],['lidar',1],['sample',1]].filter(([kind,target]) => (counts.get(kind)??0)>=target).length : 0;
  const samples = new Set(state.collectedSamples.filter(sample=>sample.destinationId===id
    && actions.has(`${sample.siteId}:sample`)).map(sample=>sample.siteId));
  const reachedFinish = state.missionStatus === 'complete' && state.completedStages.includes('transmission');
  const meaningful = findings.size>0;
  const relayRewards=transmissionRewards(state);
  const breakdown = [
    {label:'Finish a mission with a finding',points:reachedFinish && meaningful?20:0},
    {label:'Science tasks · 20 each',points:Math.min(4,objectives)*20},
    {label:'Different science clues · 10 each',points:Math.min(6,findings.size)*10},
    {label:'Sample places · 10 each',points:Math.min(2,samples.size)*10},
    {label:'Findings prepared · 5 each',points:relayRewards.scanPoints},
    {label:'Best complete signal connection · once per mission',points:relayRewards.signalPoints},
    {label:'Findings sent home · 10 each',points:relayRewards.dataPoints},
    {label:'Water clues and sample data sent · 5 extra each',points:relayRewards.valuablePoints},
    {label:'Keep some energy and storage',points:meaningful && state.remainingEnergy>=20 && state.remainingStorage>=10?5:0},
  ];
  if (!reachedFinish) for (const item of breakdown) item.points=0;
  return { score:breakdown.reduce((sum,item)=>sum+item.points,0), breakdown, discoveries:findings.size, objectives, samples:samples.size, transmitted:relayRewards.findings, relayRewards };
}

export function awardMission(profile, state) {
  const score = scoreMission(state), previousBest = profile.bestScores[state.selectedDestinationId] ?? 0;
  const duplicate = profile.completedMissions.some(mission=>mission.id===state.missionId);
  const earned = duplicate || !state.missionId || state.missionStatus!=='complete' ? 0 : Math.max(0,score.score-previousBest);
  const updated = structuredClone(profile);
  if (!duplicate && state.missionId && state.missionStatus==='complete') {
    updated.completedMissions.push({id:state.missionId,destinationId:state.selectedDestinationId,score:score.score,earned});
    updated.bestScores[state.selectedDestinationId] = Math.max(previousBest,score.score);
  }
  updated.totalPoints += earned; updated.unlockedDestinations=unlockedDestinations(updated.totalPoints);
  return { profile:updated, earned, previousBest, ...score,
    newlyUnlocked:updated.unlockedDestinations.filter(id=>!unlockedDestinations(profile.totalPoints).includes(id)) };
}

const saveKey = 'space-adventures-progress-v1';
export function createProgressStore(providedStorage) {
  let memory = emptyProgress(), warning = '';
  function storage() { return providedStorage ?? globalThis.localStorage; }
  return {
    load() {
      try {
        const raw=storage()?.getItem(saveKey);
        if (!raw) return structuredClone(memory);
        const profile=JSON.parse(raw);
        if (profile.version!==1 || !Array.isArray(profile.completedMissions) || !profile.bestScores || typeof profile.bestScores!=='object') throw Error('Unknown progress format');
        if (profile.completedMissions.some(m=>typeof m.id!=='string' || !levels.some(l=>l.id===m.destinationId) || !Number.isFinite(m.score) || m.score<0 || m.score>325)) throw Error('Invalid saved missions');
        const best={};
        for (const level of levels) { const value=profile.bestScores[level.id]??0; if (!Number.isFinite(value)||value<0||value>325) throw Error('Invalid saved score'); best[level.id]=value; }
        const totalPoints=Object.values(best).reduce((sum,value)=>sum+value,0);
        memory={version:1,totalPoints,bestScores:best,completedMissions:profile.completedMissions,unlockedDestinations:unlockedDestinations(totalPoints)};
      } catch { warning='Progress could not be read from this browser. This session can still be played.'; }
      return structuredClone(memory);
    },
    save(profile) {
      memory=structuredClone(profile);
      try { const target=storage(); if (!target) throw Error('Storage unavailable'); target.setItem(saveKey,JSON.stringify(profile)); warning=''; }
      catch { warning='Your browser could not save progress. Keep this page open; refreshing may lose new points.'; }
    },
    get warning() { return warning; },
  };
}
export const progressStore = createProgressStore();
