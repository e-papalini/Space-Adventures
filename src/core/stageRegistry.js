import { mount as preparation1 } from '../stages/preparation1/index.js';
import { mount as preparation2 } from '../stages/preparation2/index.js';
import { mount as research } from '../stages/research/index.js';
import { mount as flight } from '../stages/flight/index.js';
import { mount as transmission } from '../stages/transmission/index.js';

// Ordered extension point. location is 'earth' or 'destination'.
export const stages = [
  { id: 'preparation1', title: 'Choose destination', location: 'earth', requiresDestination: true, mount: preparation1, stylesheet: new URL('../stages/preparation1/style.css', import.meta.url).href },
  { id: 'preparation2', title: 'Rover Building', location: 'earth', requiresDestination: true, mount: preparation2, stylesheet: new URL('../stages/preparation2/style.css', import.meta.url).href },
  { id: 'flight', title: 'Flight', location: 'destination', requiresDestination: true, mount: flight, stylesheet: new URL('../stages/flight/style.css', import.meta.url).href },
  { id: 'research', title: 'Exploration', location: 'destination', requiresDestination: true, mount: research, stylesheet: new URL('../stages/research/style.css', import.meta.url).href },
  { id: 'transmission', title: 'Data Transmission', location: 'destination', requiresDestination: true, mount: transmission, stylesheet: new URL('../stages/transmission/style.css', import.meta.url).href },
];
