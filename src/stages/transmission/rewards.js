export function scienceFindings(state) {
  const actions=state.stageData.research?.[state.selectedDestinationId]?.actions??[];
  const findings=new Map();
  for(const finding of state.scientificDiscoveries) {
    if(finding.destinationId===state.selectedDestinationId && state.selectedEquipment.includes(finding.instrumentId)
      && actions.some(a=>a.instrumentId===finding.instrumentId && a.siteId===finding.siteId && a.kind===finding.kind)) findings.set(finding.discoveryId,finding);
  }
  return [...findings.values()];
}

export function prepareFinding(state,discoveryId,instrumentId) {
  const data=state.stageData.research, finding=scienceFindings(state).find(item=>item.discoveryId===discoveryId);
  if(!finding) return {ok:false,reason:'Choose a finding you discovered while exploring.'};
  if(finding.instrumentId!==instrumentId || !state.selectedEquipment.includes(instrumentId)) return {ok:false,reason:'Choose the installed tool that collected this finding.'};
  if(data.preparedFindings?.some(item=>item.discoveryId===discoveryId)) return {ok:false,reason:'This finding is already prepared. No extra energy was used.'};
  if(data.expeditionFailed) return {ok:false,reason:'This expedition has ended.'};
  if(!data.scans?.some(scan=>scan.sourceDiscoveryId===discoveryId)) return {ok:false,reason:'There are no saved packets left to prepare for this finding.'};
  if(state.remainingEnergy<2) return {ok:false,reason:'You need 2 energy to prepare this finding.'};
  state.remainingEnergy-=2;
  (data.preparedFindings??=[]).push({discoveryId,instrumentId});
  return {ok:true,points:5,finding};
}

export function alignmentReward(accuracy) {
  return accuracy>=90 ? {points:30,label:'Excellent connection'} : accuracy>=75 ? {points:20,label:'Good connection'} : accuracy>=50 ? {points:10,label:'Weak connection'} : {points:0,label:'Keep trying'};
}

export function transmissionRewards(state) {
  const data=state.stageData.research??{}, findings=scienceFindings(state);
  const prepared=new Set((data.preparedFindings??[]).map(item=>item.discoveryId));
  const sent=findings.filter(f=>{
    const receipts=data.transmittedFindings?.filter(r=>r.sourceDiscoveryId===f.discoveryId)??[];
    const manifest=data.packetManifest?.[f.discoveryId];
    return receipts.length>0 && (manifest?.length ? manifest.every(id=>receipts.some(r=>r.scanId===id))
      : !data.scans?.some(s=>s.sourceDiscoveryId===f.discoveryId) && !data.expeditionFailed);
  });
  const accuracies=sent.map(f=>{
    const receipts=data.transmittedFindings.filter(r=>r.sourceDiscoveryId===f.discoveryId);
    return receipts.every(r=>Number.isFinite(r.alignmentAccuracy)) ? Math.min(...receipts.map(r=>r.alignmentAccuracy)) : null;
  }).filter(value=>value!==null);
  const accuracy=accuracies.length?Math.max(...accuracies):null;
  const scanPoints=Math.min(6,findings.filter(f=>prepared.has(f.discoveryId)).length)*5;
  const signalPoints=accuracy===null?0:alignmentReward(accuracy).points;
  const dataPoints=Math.min(6,sent.length)*10;
  // New value bonus only for prepared data: old saved mission scores stay valid.
  const valuable=sent.filter(f=>prepared.has(f.discoveryId) && ['sample','infrared'].includes(f.kind));
  const valuablePoints=Math.min(4,valuable.length)*5;
  return {scanPoints,signalPoints,dataPoints,valuablePoints,total:scanPoints+signalPoints+dataPoints+valuablePoints,
    findings:sent.length,valuable:valuable.length,accuracy};
}
