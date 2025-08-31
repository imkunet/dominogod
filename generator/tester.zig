// zig build-exe tester.zig -fllvm -OReleaseFast

const std = @import("std");
const dominoboard = @import("root.zig");

const board = dominoboard.DominoBoard(8);

pub fn main() void {
    board.generate(std.crypto.random.int(u64)).print();
}
