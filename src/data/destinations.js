/** Shared catalogue. IDs are stable; add entries rather than destination-specific code.
 * Dates describe the original exploration/sample-return phase, not extended missions.
 * Materials are evidence from missions and laboratory analyses, not guaranteed finds
 * at every surface location. No finding here establishes extraterrestrial life.
 */
const material = (id, name, significance) => ({ id, name, significance });
const organic = material('organics', 'Organic compounds', 'Carbon chemistry helps investigate prebiotic ingredients; it is not evidence of life.');
const carbonate = material('carbonates', 'Carbonates', 'These minerals can preserve evidence of past reactions involving liquid water.');
const olivine = material('olivine', 'Olivine', 'A silicate mineral used to investigate rocky material and its thermal history.');
const pyroxene = material('pyroxene', 'Pyroxene', 'A silicate mineral whose composition helps compare space samples with meteorites.');
const source = (title, url) => ({ title, url });

export const destinations = [
  {
    id: 'bennu', name: 'Bennu', type: 'asteroid',
    mission: { name: 'OSIRIS-REx', agency: 'NASA', phase: '2016–2023' },
    environment: 'A rocky rubble-pile asteroid with very weak gravity.',
    objective: 'Investigate primitive asteroid material and return samples for laboratory analysis.',
    materials: [
      material('hydrated-clays', 'Water-bearing clay minerals (including serpentine)', 'Water bound in minerals records alteration in an ancient parent body; it does not mean liquid water is present today.'),
      carbonate,
      material('magnetite', 'Magnetite', 'This iron oxide contributes evidence about chemical alteration.'),
      material('phosphates', 'Phosphates', 'Phosphorus-bearing minerals help reconstruct the sample’s chemical history.'), organic,
    ],
    discoveries: [
      { id: 'sample-return', text: 'Asteroid samples reached Earth in September 2023.' },
      { id: 'ancient-water', text: 'Mineral evidence indicates that Bennu’s parent body experienced liquid-water alteration.' },
      { id: 'prebiotic-chemistry', text: 'Organic material helps scientists study chemistry relevant to the origins of life, without demonstrating life.' },
    ],
    sources: [source('NASA: Bennu sample mineralogy', 'https://www.nasa.gov/missions/osiris-rex/surprising-phosphate-finding-in-nasas-osiris-rex-asteroid-sample/')],
  },
  {
    id: 'ryugu', name: 'Ryugu', type: 'asteroid',
    mission: { name: 'Hayabusa2', agency: 'JAXA', phase: '2014–2020' },
    environment: 'A dark, boulder-covered rubble-pile asteroid.',
    objective: 'Compare primitive asteroid samples and investigate water and organic chemistry.',
    materials: [
      material('phyllosilicates', 'Water-bearing phyllosilicates', 'Layered silicates record reactions involving water in the parent body.'),
      carbonate, material('sulfides', 'Sulfides', 'Sulfur-bearing minerals help reconstruct chemical conditions.'), organic,
    ],
    discoveries: [
      { id: 'sampling', text: 'Hayabusa2 deployed small rovers and sampled two locations before returning material in 2020.' },
      { id: 'impactor', text: 'An impactor made an artificial crater to expose subsurface material.' },
      { id: 'amino-acids', text: 'Laboratory analyses found amino acids and other organic molecules; these are not proof of life.' },
    ],
    sources: [
      source('JAXA: Hayabusa2 and Ryugu research', 'https://curation.isas.jaxa.jp/en/research/hayabusa2/'),
      source('JAXA: Soluble organic molecules', 'https://www.isas.jaxa.jp/en/topics/003331.html'),
      source('Returned-sample mineralogy study', 'https://www.nature.com/articles/s41550-022-01745-5'),
    ],
  },
  {
    id: 'itokawa', name: 'Itokawa', type: 'asteroid',
    mission: { name: 'Hayabusa', agency: 'JAXA', phase: '2003–2010' },
    environment: 'A rubble pile of loosely connected rocky material.',
    objective: 'Return asteroid grains and compare them with meteorites found on Earth.',
    materials: [olivine, pyroxene,
      material('plagioclase', 'Plagioclase', 'A feldspar mineral used alongside other grains to compare rock compositions.'),
      material('iron-sulfides', 'Iron sulfides', 'Minerals such as troilite help characterize the asteroid’s rocky material.'),
    ],
    discoveries: [
      { id: 'first-return', text: 'Hayabusa achieved the first successful asteroid sample return in 2010.' },
      { id: 'rubble-pile', text: 'Itokawa is an aggregate of rocky fragments rather than one solid rock.' },
      { id: 'meteorite-link', text: 'Its grains link this asteroid’s material to LL ordinary chondrite meteorites.' },
    ],
    sources: [
      source('JAXA: Hayabusa curation', 'https://curation.isas.jaxa.jp/en/'),
      source('Itokawa grain composition study', 'https://doi.org/10.1111/maps.12418'),
      source('Itokawa micrograin study', 'https://doi.org/10.1073/pnas.1116236109'),
    ],
  },
  {
    id: '67p', name: '67P/Churyumov–Gerasimenko', type: 'comet',
    mission: { name: 'Rosetta / Philae', agency: 'ESA', phase: '2004–2016' },
    environment: 'An icy, dusty comet that releases gas and dust as it warms.',
    objective: 'Follow a comet and investigate its nucleus, dust, and surrounding gas.',
    materials: [
      material('water-ice', 'Water ice', 'Frozen water can become gas when the comet is heated.'),
      material('mineral-dust', 'Mineral dust', 'Dust provides evidence about the solids incorporated into comets.'), organic,
      material('water-vapour', 'Water vapour', 'Measurements of gas reveal the composition of escaping water.'),
      material('carbon-monoxide', 'Carbon monoxide', 'A volatile gas measured in the comet’s environment.'),
      material('carbon-dioxide', 'Carbon dioxide', 'Another volatile contributing to comet activity.'),
    ],
    discoveries: [
      { id: 'orbit-and-landing', text: 'Rosetta first orbited a comet; Philae achieved the first comet landing, bouncing before coming to rest.' },
      { id: 'glycine-phosphorus', text: 'Glycine and phosphorus were detected in the coma. These ingredients do not establish the presence of life.' },
      { id: 'water-isotopes', text: 'Rosetta measured water enriched in deuterium compared with Earth’s oceans; interpreting comet water requires care about sampling and variability.' },
    ],
    sources: [
      source('ESA: Rosetta factsheet', 'https://www.esa.int/nb/articles/about-us/directorates/science/rosetta/rosetta-factsheet'),
      source('ESA: Glycine and phosphorus', 'https://www.esa.int/Science_Exploration/Space_Science/Rosetta/Rosetta_s_comet_contains_ingredients_for_life'),
      source('Rosetta comet-phase science overview', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5454230/'),
    ],
  },
  {
    id: 'wild2', name: '81P/Wild 2', type: 'comet',
    mission: { name: 'Stardust', agency: 'NASA', phase: '1999–2006' },
    environment: 'A comet sampled by flying through its surrounding dust.',
    objective: 'Capture comet dust and return it to Earth for laboratory investigation.',
    materials: [olivine, pyroxene,
      material('iron-nickel-sulfides', 'Iron-nickel sulfides', 'Sulfur-bearing grains provide clues to the conditions in which comet solids formed.'),
      material('iron-nickel-metal', 'Iron-nickel metal', 'Metal grains help characterize the mixture of cometary dust.'),
    ],
    discoveries: [
      { id: 'aerogel', text: 'Stardust captured high-speed comet dust in aerogel.' },
      { id: 'sample-return', text: 'The sample capsule returned to Earth in 2006.' },
      { id: 'solar-system-mixing', text: 'High-temperature minerals in cold comet material support transport and mixing in the early solar system.' },
    ],
    sources: [source('Stardust returned-sample findings (Brownlee et al.)', 'https://science.gsfc.nasa.gov/sed/content/uploadFiles/publication_files/BrownleeEtal2006.pdf')],
  },
];

// Protect the shared catalogue from accidental stage mutation.
function freezeDeep(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') freezeDeep(child);
  }
  return Object.freeze(value);
}
freezeDeep(destinations);

export function getDestination(id) {
  return destinations.find(destination => destination.id === id) ?? null;
}
