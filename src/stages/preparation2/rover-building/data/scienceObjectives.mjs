export const scienceObjectives = {
  bennu: [
    { id: "surface-survey", name: "Survey the surface", requires: ["imaging"] },
    {
      id: "mineral-signatures",
      name: "Identify mineral and organic signatures",
      missionTitle: "Traces of ancient water",
      missionPrompt: "Equip your spacecraft to investigate water-bearing minerals and organic signatures on Bennu.",
      requires: ["mineral_analysis"],
    },
    { id: "sampling-site", name: "Map and assess a sampling site", requires: ["imaging", "navigation"] },
    { id: "sample-return", name: "Collect material for return", requires: ["sampling", "sample_return"] },
  ],
  ryugu: [
    { id: "surface-variations", name: "Compare surface variations", requires: ["imaging", "multispectral"] },
    {
      id: "hydrated-minerals",
      name: "Investigate hydrated minerals",
      missionTitle: "Read the hydrated surface",
      missionPrompt: "Choose an instrument that can examine hydrated minerals on Ryugu.",
      requires: ["mineral_analysis"],
    },
    { id: "thermal-behavior", name: "Measure surface thermal behavior", requires: ["thermal_analysis"] },
    { id: "subsurface-material", name: "Access subsurface material", requires: ["sampling", "subsurface_access"] },
  ],
  itokawa: [
    { id: "shape-map", name: "Map shape and surface structure", requires: ["imaging", "mapping"] },
    { id: "mineralogy", name: "Identify surface minerals", requires: ["mineral_analysis"] },
    { id: "safe-approach", name: "Navigate near irregular terrain", requires: ["navigation"] },
    {
      id: "elemental-composition",
      name: "Measure elemental composition",
      missionTitle: "Read the rocky record",
      missionPrompt: "Equip a payload to investigate the elemental makeup of Itokawa's surface.",
      requires: ["elemental_analysis"],
    },
  ],
  "67p": [
    { id: "comet-morphology", name: "Document comet surface features", requires: ["imaging", "mapping"] },
    {
      id: "volatile-chemistry",
      name: "Analyze gases and volatile chemistry",
      missionTitle: "Sample cometary chemistry",
      missionPrompt: "Prepare to analyze gases and volatile compounds released by comet 67P.",
      requires: ["chemical_analysis", "volatile_analysis"],
    },
    { id: "subsurface-ice", name: "Investigate subsurface material", requires: ["sampling", "subsurface_access"] },
    { id: "surface-temperature", name: "Measure surface temperature", requires: ["thermal_analysis"] },
  ],
  wild2: [
    { id: "flyby-imaging", name: "Document the comet flyby", requires: ["imaging", "navigation"] },
    { id: "dust-environment", name: "Measure the surrounding dust", requires: ["dust_detection"] },
    { id: "dust-chemistry", name: "Investigate dust composition", requires: ["dust_analysis", "chemical_analysis"] },
    {
      id: "dust-sample",
      name: "Capture dust for return",
      missionTitle: "Catch dust from the early solar system",
      missionPrompt: "Equip the flyby spacecraft to capture cometary dust for return and analysis.",
      requires: ["dust_collection", "sample_return"],
    },
  ],
};
