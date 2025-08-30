// zig build-exe tester.zig -fllvm -OReleaseFast

const std = @import("std");
const dominoboard = @import("root.zig");

pub fn main() void {
    const board = dominoboard.DominoBoard(10);
    board.generate(std.crypto.random.int(u64)).print();
}
