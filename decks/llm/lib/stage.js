// A retained clip of this deck (docs/stage.md): src/stage's, on the theme's paper as every clip of the deck is
// (lib/clip.js). stage({ …meta, from, prepare, scene, grid }).

import { stage as retained } from '../../../src/stage/index.js';
import { paper } from './parts.js';

export const stage = ({ grid = true, ...def }) => retained({ background: (ctx) => paper(ctx, grid), ...def });
