import { resourceLabels, resourceLimits } from "./data/missionConfig.mjs";
import { scienceObjectives } from "./data/scienceObjectives.mjs";

export function calculateResources(selectedEquipment) {
  return selectedEquipment.reduce((totals, item) => ({
    mass: totals.mass + item.mass,
    power: totals.power + item.power,
    data: totals.data + item.data,
  }), { mass: 0, power: 0, data: 0 });
}

export function evaluateScience(destinationId, selectedEquipment) {
  const capabilities = [...new Set(selectedEquipment.flatMap((item) => item.capabilities))].sort();
  const objectives = (scienceObjectives[destinationId] || []).map((objective) => {
    const supportedCount = objective.requires.filter((capability) => capabilities.includes(capability)).length;
    return {
      ...objective,
      status: supportedCount === objective.requires.length
        ? "available"
        : supportedCount > 0
          ? "partial"
          : "unavailable",
    };
  });

  return {
    capabilities,
    objectives,
    availableObjectives: objectives.filter((objective) => objective.status === "available"),
    unavailableObjectives: objectives.filter((objective) => objective.status !== "available"),
  };
}

export function validateMission(selectedEquipment, totals) {
  const violations = [];
  if (selectedEquipment.length === 0) {
    violations.push("Install at least one scientific instrument.");
  }
  for (const resource of Object.keys(resourceLimits)) {
    if (totals[resource] > resourceLimits[resource]) {
      const { name, unit } = resourceLabels[resource];
      violations.push(`${name} exceeds its ${resourceLimits[resource]} ${unit} limit by ${totals[resource] - resourceLimits[resource]} ${unit}.`);
    }
  }
  return { valid: violations.length === 0, violations };
}
