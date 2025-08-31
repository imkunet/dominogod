// zig build-exe tester.zig -fllvm -OReleaseFast

const std = @import("std");
const dominoboard = @import("root.zig");

const board = dominoboard.DominoBoard(8);

pub fn main() void {
    // outer: while (true) {
    //     const seed = std.crypto.random.int(u64);
    //     var generated = board.generate(seed);
    //     for (0..5) |row| {
    //         for (0..5) |col| {
    //             if (generated.getBounded(row, col) == dominoboard.cs_t and generated.getBounded(row + 2, col + 1) == dominoboard.cs_tt and generated.getBounded(row, col + 2) == dominoboard.cs_tt and generated.getBounded(row + 1, col + 2) == dominoboard.cs_t) {
    //                 generated.print();
    //                 std.debug.print("seed: {d}\n", .{seed});

    //                 board.generate(seed).print();

    //                 break :outer;
    //             }
    //         }
    //     }
    // }

    board.generate().print();
}
