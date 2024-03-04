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
  const grid = emptyGrid();
  const passes = 500;
  // is vertical?
  let generation = Math.random() > 0.5;
  for (let pass = 0; pass < passes; pass++) {
    const availableSpots = generation
      ? countPossibleVerticalSpots(grid)
      : countPossibleHorizontalSpots(grid);
    const amountSpots = Math.floor(Math.random() * availableSpots) / 2;

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

export { emptyGrid, cellToValue, printGrid, generateGrid };
export type { Cell, Grid };
