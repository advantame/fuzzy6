import '/src/explorer/explorer.css';
import { createExplorer } from '/src/explorer/index.js';
import deck from './deck.js';
createExplorer(document.querySelector('#app'), deck);
