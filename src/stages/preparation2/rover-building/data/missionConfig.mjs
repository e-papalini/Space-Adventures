export const resourceLimits = {
  mass: 15,
  power: 40,
  data: 50,
};

export const assemblyTimeLimitSeconds = 180;
export const spacecraftAttachmentPointCount = 4;

export const resourceLabels = {
  mass: { name: "Payload mass", unit: "kg" },
  power: { name: "Simultaneous power", unit: "W" },
  data: { name: "Data / measurement cycle", unit: "MB" },
};

export const capabilityLabels = {
  imaging: "Surface imaging",
  mapping: "Surface mapping",
  navigation: "Close navigation",
  mineral_analysis: "Mineral analysis",
  chemical_analysis: "Chemical analysis",
  sample_return: "Sample return",
  sampling: "Surface sampling",
  multispectral: "Multispectral survey",
  thermal_analysis: "Thermal analysis",
  subsurface_access: "Subsurface access",
  elemental_analysis: "Elemental analysis",
  volatile_analysis: "Volatile analysis",
  dust_detection: "Dust detection",
  dust_analysis: "Dust analysis",
  dust_collection: "Dust collection",
};
