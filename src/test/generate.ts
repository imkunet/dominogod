import { decodeGrid, encodeGrid, generateGrid, printGrid } from '../utils/grids';

const grid = generateGrid();
printGrid(grid);
const encoded = encodeGrid(grid);
console.log(encoded);
console.log(decodeGrid(encoded));
