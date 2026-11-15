import { bennu } from './config.js';
import { initialize, missionReady } from './model.js';

export function missionFor(state) {
  const trip = initialize(state);
  if (!trip.mission) {
    const duration = state.stageData.researchSettings?.missionDurationSeconds;
    trip.mission = {
      durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : bennu.missionDurationSeconds,
      elapsedSeconds: 0, phase: 'briefing', initialEnergy: state.remainingEnergy,
      initialStorage: state.remainingStorage, warnedMinute: false,
    };
  }
  return trip.mission;
}

export function startMission(state) {
  const mission = missionFor(state);
  if (mission.phase === 'briefing') mission.phase = 'exploring';
}

export function endMission(state, reason) {
  const mission = missionFor(state);
  if (mission.phase !== 'exploring') return;
  mission.phase = 'results'; mission.endReason = reason;
  mission.objectivesAchieved = missionReady(state);
  initialize(state).completed = mission.objectivesAchieved;
}

export function advanceMission(state, seconds) {
  const mission = missionFor(state);
  if (mission.phase !== 'exploring') return;
  mission.elapsedSeconds = Math.min(mission.durationSeconds, mission.elapsedSeconds + Math.max(0, seconds));
  if (mission.elapsedSeconds >= mission.durationSeconds) endMission(state, 'time-limit');
}

export function remainingSeconds(state) {
  const mission = missionFor(state);
  return Math.max(0, mission.durationSeconds - mission.elapsedSeconds);
}

export function formatTime(seconds) {
  const whole = Math.ceil(Math.max(0, seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}
