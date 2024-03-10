import { decodeGrid, encodeGrid, generateGrid, printGrid } from '@/utils/grids';

const grid = generateGrid();
printGrid(grid);
const encoded = encodeGrid(grid);
console.log(encoded);
const decoded = decodeGrid(encoded);
if (decoded != null) {
  console.log(printGrid(decoded));
  console.log('equal?: ' + (JSON.stringify(grid) == JSON.stringify(decoded)));
} else console.log(decoded);
