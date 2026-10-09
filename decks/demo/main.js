import '@fontsource/ibm-plex-sans-jp/400.css';
import '../../src/explorer/explorer.css';
import './theme.css';
import { createExplorer } from '../../src/explorer/index.js';
import deck from './deck.js';
createExplorer(document.querySelector('#app'), deck);
