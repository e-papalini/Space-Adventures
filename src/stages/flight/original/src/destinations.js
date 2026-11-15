(function () {
  const destinations = {
    bennu: { id: 'bennu', name: '101955 Bennu', mission: 'NASA / OSIRIS-REx', year: '2016—2023', radius: 126, color: '#b8865c', seed: 11, fact: 'OSIRIS-REx returned samples containing water-bearing minerals and carbon-rich material.', targetName: 'BENNU / 101955' },
    ryugu: { id: 'ryugu', name: '162173 Ryugu', mission: 'JAXA / Hayabusa2', year: '2014—2020', radius: 118, color: '#a16e51', seed: 23, fact: 'Hayabusa2 returned carbon-rich samples from this primitive, spinning-top asteroid.', targetName: 'RYUGU / 162173' },
    'comet-67p': { id: 'comet-67p', name: 'Comet 67P', mission: 'ESA / Rosetta', year: '2004—2016', radius: 145, color: '#797d66', seed: 37, fact: 'Rosetta and Philae studied a bilobed comet and detected a rich inventory of organic molecules.', targetName: '67P / CHURYUMOV-GERASIMENKO' },
    itokawa: { id: 'itokawa', name: '25143 Itokawa', mission: 'JAXA / Hayabusa', year: '2003—2010', radius: 112, color: '#9e805e', seed: 49, fact: 'Hayabusa brought back the first samples ever collected from an asteroid surface.', targetName: 'ITOKAWA / 25143' },
    dimorphos: { id: 'dimorphos', name: 'Dimorphos', mission: 'NASA / DART', year: '2021—2022', radius: 132, color: '#8a755e', seed: 61, fact: 'DART intentionally struck Dimorphos, demonstrating that a spacecraft can alter an asteroid’s orbit.', targetName: 'DIMORPHOS / DIDYMOS SYSTEM' }
  };
  window.GameDestinations = destinations;
})();