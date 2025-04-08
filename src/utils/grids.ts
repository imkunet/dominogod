const { instance } = await WebAssembly.instantiateStreaming(fetch('domino.wasm'));

const wasmGenerate = (n: 6 | 7 | 8): number[] => {
  const board = new Uint8Array((instance.exports.memory as WebAssembly.Memory).buffer, 0, n * n);
  const seed = BigInt(Math.floor(Math.random() * 2 ** 52));
  const generateFn = instance.exports['generate' + n] as (seed: BigInt, board: Uint8Array) => void;
  generateFn(seed, board);
  return Array.from(board);
};

type Cell = null | 'one' | 'one_complement' | 'two' | 'two_complement' | 'block';
type Grid = Cell[][];

const emptyGrid = (n: number): Grid => [...Array(n)].map(() => Array(n).fill(null));
// const cellToChar = (cell: Cell): string => {
//   if (cell == null) return ' ';
//   if (cell == 'one') return '┳';
//   if (cell == 'one_complement') return '┃';
//   if (cell == 'two') return '┫';
//   if (cell == 'two_complement') return '━';
//   return 'X';
// };
const cellToValue = (cell: Cell) => {
  if (cell == 'one') return 1;
  if (cell == 'two') return 2;
  return 0;
};

// const printGrid = (grid: Grid) => {
//   const topRow = [];
//   for (let x = 0; x < 7; x++) {
//     let current = 0;
//     for (let y = 0; y < 7; y++) {
//       const cell = grid[x][y];
//       current += cellToValue(cell);
//     }
//     topRow.push(current);
//   }

//   let builder = '    ';
//   for (const rowNumber of topRow) {
//     builder += ` ${rowNumber.toString().padEnd(2, ' ')} `;
//   }
//   console.log(builder);

//   for (let y = 0; y < 7; y++) {
//     let current = 0;
//     let builder = '';
//     for (let x = 0; x < 7; x++) {
//       const cell = grid[x][y];
//       current += cellToValue(cell);
//       builder += ` ${cellToChar(cell)}  `;
//     }
//     console.log(` ${current.toString().padEnd(2, ' ')} ${builder}`);
//   }
// };

const generateGrid = (n: 6 | 7 | 8 = 7): Grid => {
  while (true) {
    const generated = wasmGenerate(n);
    const grid = emptyGrid(n);

    generated.forEach((v, i) => {
      const row = Math.floor(i / n);
      const col = i % n;
      if (v === 1) {
        grid[col][row] = 'one';
        grid[col][row + 1] = 'one_complement';
      }
      if (v === 2) {
        grid[col][row] = 'two_complement';
        grid[col + 1][row] = 'two';
      }
    });

    if (
      calcRowNumbers(grid).find((v) => v === 0) !== undefined ||
      calcColNumbers(grid).find((v) => v === 0) !== undefined
    )
      continue;

    grid.forEach((a) => {
      a.forEach((v, i) => {
        if (v === null) a[i] = 'block';
      });
    });

    return grid;
  }
};

const calcColNumbers = (grid: Grid): number[] => {
  const numbers = [];
  for (let x = 0; x < grid.length; x++) {
    let current = 0;
    for (let y = 0; y < grid.length; y++) current += cellToValue(grid[x][y]);
    numbers.push(current);
  }
  return numbers;
};

const calcRowNumbers = (grid: Grid): number[] => {
  const numbers = [];
  for (let y = 0; y < grid.length; y++) {
    let current = 0;
    for (let x = 0; x < grid.length; x++) current += cellToValue(grid[x][y]);
    numbers.push(current);
  }
  return numbers;
};

const isOutOfBounds = (n: number, x: number, y: number) => x < 0 || y < 0 || x >= n || y >= n;

export {
  emptyGrid,
  calcColNumbers,
  calcRowNumbers,
  cellToValue,
  // printGrid,
  generateGrid,
  isOutOfBounds,
};

export type { Cell, Grid };
