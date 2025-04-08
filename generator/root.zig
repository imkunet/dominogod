const std = @import("std");

// null / 1 / 2 / undefined
pub const EdgeState = u2;

fn toIndex(comptime N: usize, row: comptime_int, col: comptime_int) usize {
    return row * N + col;
}

fn toCoords(comptime N: usize, index: usize) struct { isize, isize } {
    return .{ @intCast(index / N), @intCast(index % N) };
}

pub fn EdgeBoard(comptime N: usize) type {
    if (N <= 2) @compileError("Ring detection relies on 3x3+ sized boards");
    const N2 = N * N;

    var search_vector_count = 0;
    for (1..N - 1) |i| search_vector_count += i * i * i;
    search_vector_count *= 2;

    const SearchVector = @Vector(N2, u2);
    var vectors: [search_vector_count]SearchVector = undefined;

    var j = 0;
    // this is not real math this is just high enough for the
    // 8x8 case and I figure that's good enough no worth
    // in thinking about branch evaluation depth, whatever
    // that means stop thinking about it NOW NOW NOW
    @setEvalBranchQuota(search_vector_count * N);
    for (0..N - 2) |r1| {
        for (0..N - 2) |c1| {
            for (r1 + 2..N) |r2| {
                for (c1 + 2..N) |c2| {
                    // top left = (r1, c1)
                    // bottom right = (r2, c2)
                    var t: SearchVector = @splat(0);
                    t[toIndex(N, r1, c1)] = 1;
                    t[toIndex(N, r2 - 1, c2)] = 1;
                    t[toIndex(N, r2, c1)] = 2;
                    t[toIndex(N, r1, c2 - 1)] = 2;
                    vectors[j] = t;
                    j += 1;

                    var tt: SearchVector = @splat(0);
                    tt[toIndex(N, r1, c1)] = 2;
                    tt[toIndex(N, r2, c2 - 1)] = 2;
                    tt[toIndex(N, r1, c2)] = 1;
                    tt[toIndex(N, r2 - 1, c1)] = 1;
                    vectors[j] = tt;
                    j += 1;
                }
            }
        }
    }

    const search_vectors = vectors;

    return struct {
        n: usize = N,
        board: [N2]EdgeState,

        pub fn get(self: @This(), row: isize, col: isize) EdgeState {
            if (row < 0 or row >= N or col < 0 or col >= N) return 0;
            return self.board[N * @as(usize, @intCast(row)) + @as(usize, @intCast(col))];
        }

        pub fn occupied(self: @This(), edge_type: EdgeState, row: isize, col: isize) bool {
            if (self.get(row, col) != 0 or self.get(row - 1, col) == 1 or self.get(row, col - 1) == 2) return true;
            if (edge_type == 1) return row == N - 1 or self.get(row + 1, col) != 0 or self.occupied(0, row + 1, col);
            if (edge_type == 2) return col == N - 1 or self.get(row, col + 1) != 0 or self.occupied(0, row, col + 1);
            return false;
        }

        pub fn has_rings(self: @This()) bool {
            const board_vector: SearchVector = self.board;
            for (search_vectors) |vector| {
                if (@reduce(.And, (board_vector & vector) == vector)) {
                    return true;
                }
            }
            return false;
        }

        pub fn init() @This() {
            return .{
                .board = std.mem.zeroes([N2]EdgeState),
            };
        }

        pub fn print(self: @This()) void {
            for (0..N) |row| {
                for (0..N) |col| {
                    const edge = self.get(@intCast(row), @intCast(col));
                    if (edge == 1) {
                        std.debug.print("┳", .{});
                        continue;
                    }
                    if (edge == 2) {
                        std.debug.print("━", .{});
                        continue;
                    }
                    if (self.get(@intCast(row - 1), @intCast(col)) == 1) {
                        std.debug.print("┃", .{});
                        continue;
                    }
                    if (self.get(@intCast(row), @intCast(col - 1)) == 2) {
                        std.debug.print("┫", .{});
                        continue;
                    }
                    if (edge == 0) std.debug.print("X", .{});
                }

                std.debug.print("\n", .{});
            }
        }

        pub fn generate(seed: u64) @This() {
            var rng = std.Random.DefaultPrng.init(seed);
            var random = rng.random();
            const maximumBlockers = (N * 4) / 3;
            const maximumFailures = N2;

            retry: while (true) {
                var failures: usize = 0;
                var board = init();

                var placements: usize = 0;
                var zero_indexes: [N2]usize = undefined;
                for (0..N2) |i| zero_indexes[i] = i;
                var zero_indexes_partition: usize = 0;

                while (N2 - 2 * placements > maximumBlockers) {
                    if (zero_indexes_partition >= N2) break;
                    if (failures >= maximumFailures) continue :retry;

                    random.shuffle(usize, zero_indexes[zero_indexes_partition..]);
                    const target_index = zero_indexes[zero_indexes_partition];
                    const target_type = random.intRangeAtMost(EdgeState, 1, 2);

                    const row, const col = toCoords(N, target_index);

                    if (board.occupied(target_type, row, col)) {
                        failures += 1;
                        continue;
                    }

                    board.board[target_index] = target_type;

                    placements += 1;
                    zero_indexes_partition += 1;
                }

                if (board.has_rings()) continue;

                return board;
            }
        }
    };
}
