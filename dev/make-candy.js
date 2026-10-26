// Builds the pixel-art candy tile behind DOST: node dev/make-candy.js src/renderer/candy-tile.svg
const fs = require('fs');

const C = {
  o: '#5a3a9e', w: '#ffffff', p: '#ff8fc4', b: '#8fd3ff', y: '#ffe27a', m: '#9be7c4',
  s: '#f6efff', r: '#ff6f9d', l: '#c9b3ff'
};
const lollipop = [
  '..oooo..',
  '.oppwpo.',
  'oppwwppo',
  'opwpppwo',
  'owppwpwo',
  '.opwwpo.',
  '..oooo..',
  '...os...',
  '...os...',
  '...os...',
  '...oo...'
];
const wrapped = [
  'o....oooo....o',
  'oyo.obbbbo.oyo',
  'oyyobwbbbboyyo',
  'oyyobbbbwboyyo',
  'oyo.obbbbo.oyo',
  'o....oooo....o'
];
const heart = [
  '.oo...oo.',
  'owpo.oppo',
  'opppopppo',
  'opppppppo',
  '.opppppo.',
  '..opppo..',
  '...opo...',
  '....o....'
];
const sparkle = ['.w.', 'www', '.w.'];
const swap = (rows, from, to) => rows.map((row) => row.split('').map((c) => (c === from ? to : c)).join(''));

function sprite(rows, x, y, px = 3) {
  let out = '';
  rows.forEach((row, j) => row.split('').forEach((c, i) => {
    if (C[c]) out += `<rect x="${x + i * px}" y="${y + j * px}" width="${px}" height="${px}" fill="${C[c]}"/>`;
  }));
  return out;
}

const size = 480;
const body = [
  sprite(lollipop, 34, 42),
  sprite(wrapped, 250, 96),
  sprite(heart, 140, 250),
  sprite(swap(swap(lollipop, 'p', 'm'), 'w', 'y'), 372, 300),
  sprite(swap(wrapped, 'b', 'l'), 40, 400),
  sprite(swap(heart, 'p', 'y'), 400, 30),
  sprite(sparkle, 180, 60, 3),
  sprite(sparkle, 330, 210, 3),
  sprite(sparkle, 90, 170, 2),
  sprite(sparkle, 270, 420, 2),
  sprite(sparkle, 450, 180, 2)
].join('');

fs.writeFileSync(process.argv[2], `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${body}</svg>\n`);
