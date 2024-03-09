import { base58 } from '@scure/base';

type Cell = null | 'one' | 'one_complement' | 'two' | 'two_complement' | 'block';
type Grid = Cell[][];

const emptyGrid = (): Grid => [...Array(7)].map(() => Array(7).fill(null));
const cellToChar = (cell: Cell): string => {
  if (cell == null) return ' ';
  if (cell == 'one') return '┳';
  if (cell == 'one_complement') return '┃';
  if (cell == 'two') return '┫';
  if (cell == 'two_complement') return '━';
  return 'X';
};
const cellToValue = (cell: Cell) => {
  if (cell == 'one') return 1;
  if (cell == 'two') return 2;
  return 0;
};

const printGrid = (grid: Grid) => {
  const topRow = [];
  for (let x = 0; x < 7; x++) {
    let current = 0;
    for (let y = 0; y < 7; y++) {
      const cell = grid[x][y];
      current += cellToValue(cell);
    }
    topRow.push(current);
  }

  let builder = '    ';
  for (const rowNumber of topRow) {
    builder += ` ${rowNumber.toString().padEnd(2, ' ')} `;
  }
  console.log(builder);

  for (let y = 0; y < 7; y++) {
    let current = 0;
    let builder = '';
    for (let x = 0; x < 7; x++) {
      const cell = grid[x][y];
      current += cellToValue(cell);
      builder += ` ${cellToChar(cell)}  `;
    }
    console.log(` ${current.toString().padEnd(2, ' ')} ${builder}`);
  }
};

const countPossibleVerticalSpots = (grid: Grid): number => {
  let matches = 0;
  for (let x = 0; x < 7; x++) {
    for (let y = 0; y < 6; y++) {
      const cellTop = grid[x][y];
      const cellBottom = grid[x][y + 1];
      if (cellTop == null && cellBottom == null) ++matches;
    }
  }
  return matches;
};

const countPossibleHorizontalSpots = (grid: Grid): number => {
  let matches = 0;
  for (let x = 0; x < 6; x++) {
    for (let y = 0; y < 7; y++) {
      const cellTop = grid[x][y];
      const cellBottom = grid[x + 1][y];
      if (cellTop == null && cellBottom == null) ++matches;
    }
  }
  return matches;
};

const generateGrid = (): Grid => {
  let grid = generateInside();

  while (
    calcColNumbers(grid).findIndex((v) => v === 0) != -1 ||
    calcRowNumbers(grid).findIndex((v) => v === 0) != -1
  ) {
    grid = generateInside();
  }

  return grid;
};

const generateInside = (): Grid => {
  const grid = emptyGrid();
  const passes = 1000;
  // is vertical?
  let generation = Math.random() > 0.5;
  for (let pass = 0; pass < passes; pass++) {
    const availableSpots = generation
      ? countPossibleVerticalSpots(grid)
      : countPossibleHorizontalSpots(grid);
    const amountSpots = Math.floor(Math.random() * availableSpots) / 3;

    for (let placeAttempt = 0; placeAttempt < amountSpots; placeAttempt++) {
      const x = Math.floor(Math.random() * (generation ? 7 : 6));
      const y = Math.floor(Math.random() * (generation ? 6 : 7));

      const cellTop = grid[x][y];
      const cellBottom = generation ? grid[x][y + 1] : grid[x + 1][y];

      if (cellTop == null && cellBottom == null) {
        grid[x][y] = generation ? 'one' : 'two_complement';
        if (generation) grid[x][y + 1] = 'one_complement';
        else grid[x + 1][y] = 'two';
      }
    }

    generation = !generation;
  }

  for (let x = 0; x < 7; x++) {
    for (let y = 0; y < 7; y++) {
      if (grid[x][y] == null) {
        grid[x][y] = 'block';
      }
    }
  }

  return grid;
};

const calcColNumbers = (grid: Grid): number[] => {
  const numbers = [];
  for (let x = 0; x < 7; x++) {
    let current = 0;
    for (let y = 0; y < 7; y++) current += cellToValue(grid[x][y]);
    numbers.push(current);
  }
  return numbers;
};

const calcRowNumbers = (grid: Grid): number[] => {
  const numbers = [];
  for (let y = 0; y < 7; y++) {
    let current = 0;
    for (let x = 0; x < 7; x++) current += cellToValue(grid[x][y]);
    numbers.push(current);
  }
  return numbers;
};

const isOutOfBounds = (x: number, y: number) => x < 0 || y < 0 || x > 6 || y > 6;

/*const encodeGrid = async (grid: Grid) => {
  const tiles: number[] = [];
  for (let x = 0; x < 7; x++) {
    for (let y = 0; y < 7; y++) {
      const tile = grid[x][y];
      if (tile != 'one' && tile != 'two') continue;
      const slot = x * 7 + y;
      tiles.push((slot << 1) | (tile == 'one' ? 0 : 1));
    }
  }

  console.log(base58.encode(new Uint8Array(tiles)));
  const compressedData = deflateSync(new Uint8Array(tiles), { level: 9 });
  console.log(base58.encode(compressedData));
};*/

const encodeGrid = (grid: Grid): string => {
  // null | 'block' | 'one' | 'two'

  // row encoding first
  const tileStates: boolean[] = [];
  for (let y = 0; y < 7; y++) {
    let found = false;
    for (let x = 0; x < 7; x++) {
      const tile = grid[x][y];
      if (tile === 'block') {
        found = true;
        break;
      }
    }
    tileStates.push(found);
    for (let x = 0; x < 7; x++) {
      const tile = grid[x][y];

      if (tile == 'block') {
        tileStates.push(true);
        continue;
      }

      if (tile == 'one') {
        if (found) tileStates.push(false);
        tileStates.push(false);
        continue;
      }

      if (tile == 'two_complement') {
        if (found) tileStates.push(false);
        tileStates.push(true);
      }
    }
  }

  console.log(tileStates.length + ': ' + tileStates.map((v) => (v ? 1 : 0)).join(' '));

  let i = 0;
  const output = new Uint8Array(Math.ceil(tileStates.length / 8) + 2);

  // version 0
  output[i++] = 0;
  // row encoding
  output[i++] = 0;
  let current = 0;
  let n = 0;

  for (const v of tileStates) {
    if (v) current |= 1 << n;
    ++n;

    if (n == 8) {
      output[i++] = current;
      current = 0;
      n = 0;
    }
  }

  if (n != 0) output[i++] = current;
  console.log(output);

  return base58.encode(output);
};

const decodeGrid = (encoded: string): Grid | null => {
  const decoded = base58.decode(encoded);

  // out of date
  if (decoded[0] != 0) return null;
  // wrong metadata
  if (decoded[1] != 0) return null;

  const raw = [];
  for (let i = 0; i < decoded.length; i++) {
    const byte = decoded[i];
    for (let n = 0; n < 8; n++) {
      raw.push(((byte >> n) & 1) === 1);
    }
  }

  console.log(
    raw.slice(16).length +
      ': ' +
      raw
        .slice(16)
        .map((v) => (v ? 1 : 0))
        .join(' '),
  );

  const outputGrid = emptyGrid();

  let expectingBlockIndicator = true;
  let currentRowHasBlocks = false;

  let x = 0;
  let y = 0;

  out: for (let i = 16; i < raw.length; i++) {
    let current = raw[i];
    if (current === undefined) {
      console.log('no1');
      return null;
    }

    while (y < 6) {
      if (x > 6) {
        expectingBlockIndicator = true;
        x = 0;
        ++y;

        if (y > 6) break out;
      }

      if (outputGrid[x][y] != null) ++x;
      else break;
    }

    if (expectingBlockIndicator) {
      currentRowHasBlocks = current;
      expectingBlockIndicator = false;
      console.log('crhb: ' + currentRowHasBlocks);
      console.log('i: ' + (i - 16));
      console.log('c: ' + current);
      continue;
    }

    if (currentRowHasBlocks) {
      if (current) {
        console.log('pb');
        outputGrid[x++][y] = 'block';
        continue;
      }

      current = raw[i++];
      if (current === undefined) {
        console.log('no2');
        return null;
      }
    }

    if (current) {
      console.log(`vertatt ${i}`);
      if (x == 6 || outputGrid[x + 1][y] != null) {
        console.log(printGrid(outputGrid));
        console.log('no3');
        return null;
      }
      outputGrid[x++][y] = 'two_complement';
      outputGrid[x++][y] = 'two';
      continue;
    }

    console.log(`horiatt ${i}`);
    if (y == 6 || outputGrid[x][y + 1] != null) {
      console.log('no4');
      return null;
    }
    outputGrid[x][y] = 'one';
    outputGrid[x++][y + 1] = 'one_complement';
    continue;
  }

  return outputGrid;
};

export {
  emptyGrid,
  calcColNumbers,
  calcRowNumbers,
  cellToValue,
  encodeGrid,
  decodeGrid,
  printGrid,
  generateGrid,
  isOutOfBounds,
};
export type { Cell, Grid };
