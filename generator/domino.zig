const std = @import("std");
const dominoboard = @import("root.zig");

fn edgeboardOf(n: comptime_int, seed: u64, buffer: [*]u8) void {
    const EdgeBoard = dominoboard.EdgeBoard(n);
    const board = EdgeBoard.generate(seed);
    for (board.board, 0..) |v, i| {
        buffer[i] = v;
    }
}

export fn generate6(seed: u64, buffer: [*]u8) void {
    return edgeboardOf(6, seed, buffer);
}

export fn generate7(seed: u64, buffer: [*]u8) void {
    return edgeboardOf(7, seed, buffer);
}

export fn generate8(seed: u64, buffer: [*]u8) void {
    return edgeboardOf(8, seed, buffer);
}
