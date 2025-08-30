const std = @import("std");
const zero = std.mem.zeroes;
const Random = std.Random;
const prng = Random.DefaultPrng;

pub const CellState = u3;

const cs_undefined: CellState = 0b000; // 000 0   0
const cs_t: CellState = 0b010; // ........010 t   2
const cs_t0: CellState = 0b001; // .......001 t'  1
const cs_tt: CellState = 0b110; // .......110 tt  6
const cs_tt0: CellState = 0b101; // ......101 tt' 5

const cs_orientation_t: CellState = 0b000;
const cs_orientation_tt: CellState = 0b100;

inline fn negate(state: CellState) CellState {
    return orientation(state) | ~(0b011 & state);
}

inline fn flip(state: CellState) CellState {
    return ~orientation(state) | (0b011 & state);
}

inline fn orientation(state: CellState) CellState {
    return state & 0b100;
}

pub fn DominoBoard(comptime N: usize) type {
    if (N <= 2) @compileError("Board too small!");
    const N2 = N * N;

    return struct {
        n: usize = N,
        board: [N2]CellState,

        pub fn init() @This() {
            return .{
                .board = zero([N2]CellState),
            };
        }

        inline fn idx(r: usize, c: usize) usize {
            return r * N + c;
        }

        inline fn coords(i: usize) struct { usize, usize } {
            return .{ i / N, i % N };
        }

        inline fn getBounded(self: *@This(), row: usize, col: usize) CellState {
            return self.board[N * row + col];
        }

        fn check_place(self: *@This(), row: usize, col: usize, state: CellState) bool {
            for (self.board, 0..) |v, i| {
                // find negated corner
                if (v != negate(state)) continue;

                const r = i / N;
                const c = i % N;
                if (row == r or col == c) continue;

                // grab other corners, assuming they exist
                const sameRow = self.getBounded(row, c);
                if (sameRow == cs_undefined) continue;
                const sameCol = self.getBounded(r, col);
                if (sameCol == cs_undefined) continue;

                // other corners must be same orientation
                if (orientation(sameRow) != orientation(sameCol)) continue;
                // and the corners must be the opposite orientation from the placement
                if (orientation(sameRow) == orientation(state)) continue;
                // the other corners must have opposing signs
                if (sameRow == sameCol) continue;

                // std.debug.print("discarding ring {d} - {d} / {d}\n", .{ state, sameRow, sameCol });
                return false;
            }

            return true;
        }

        fn place(self: *@This(), row: usize, col: usize, state: CellState) bool {
            // the obvious cases
            if (self.getBounded(row, col) != cs_undefined) return false;
            if (!self.check_place(row, col, state)) return false;
            const ori = orientation(state);
            switch (ori) {
                cs_orientation_t => {
                    if (row == N - 1 or self.getBounded(row + 1, col) != cs_undefined) return false;
                    if (!self.check_place(row + 1, col, cs_t0)) return false;
                    self.board[idx(row + 1, col)] = cs_t0;
                },
                cs_orientation_tt => {
                    if (col == 0 or self.getBounded(row, col - 1) != cs_undefined) return false;
                    if (!self.check_place(row, col - 1, cs_tt0)) return false;
                    self.board[idx(row, col - 1)] = cs_tt0;
                },
                else => return false,
            }
            self.board[idx(row, col)] = state;

            return true;
        }

        pub fn print(self: *const @This()) void {
            for (self.board, 0..) |v, i| {
                if (i % N == 0 and i != 0) std.debug.print("\n", .{});
                const rendered = switch (v) {
                    cs_undefined => "X",
                    cs_t => "┳",
                    cs_t0 => "┃",
                    cs_tt => "┫",
                    cs_tt0 => "━",
                    else => "?",
                };
                std.debug.print("{s}", .{rendered});
            }
            std.debug.print("\n", .{});
        }

        pub fn generate(seed: u64) @This() {
            var rng = prng.init(seed);
            var random = rng.random();
            var maxBlocks: usize = 1;
            var totalFails: usize = 0;

            retry: while (true) {
                var board = init();

                var placements: usize = 0;
                var zero_indexes: [N2]usize = undefined;
                for (0..N2) |i| zero_indexes[i] = i;
                var zero_indexes_partition: usize = 0;
                var tried = zero([N2]u2);

                while (N2 - placements > maxBlocks) {
                    if (zero_indexes_partition >= N2) {
                        totalFails += 1;
                        maxBlocks += 1;
                        // std.debug.print("retry of DOOM! {d}\n", .{totalFails});
                        continue :retry;
                    }

                    random.shuffle(usize, zero_indexes[zero_indexes_partition..]);
                    const target_index = zero_indexes[zero_indexes_partition];
                    const tried_state = tried[target_index];
                    const target_type =
                        if (tried_state == 0b00) (if (random.boolean()) cs_t else cs_tt) else if (tried_state == 0b01) cs_tt else cs_t;
                    tried[target_index] |= if (target_type == cs_t) 0b01 else 0b10;

                    if (tried[target_index] == 0b11) zero_indexes_partition += 1;

                    const row, const col = coords(target_index);
                    if (!board.place(row, col, target_type)) {
                        continue;
                    }

                    placements += 2;
                }

                return board;
            }
        }
    };
}
