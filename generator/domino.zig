const std = @import("std");
const dominoboard = @import("root.zig");

fn boardOf(n: comptime_int, seed: u64, buffer: [*]u8) void {
    const DominoBoard = dominoboard.DominoBoard(n);
    const board = DominoBoard.generate(seed);
    for (board.board, 0..) |v, i| {
        buffer[i] = v;
    }
}

export fn generate6(seed: u64, buffer: [*]u8) void {
    return boardOf(6, seed, buffer);
}

export fn generate7(seed: u64, buffer: [*]u8) void {
    return boardOf(7, seed, buffer);
}

export fn generate8(seed: u64, buffer: [*]u8) void {
    return boardOf(8, seed, buffer);
}

// export fn generate9(seed: u64, buffer: [*]u8) void {
//     return boardOf(9, seed, buffer);
// }

export fn generate10(seed: u64, buffer: [*]u8) void {
    return boardOf(10, seed, buffer);
}

// export fn generate11(seed: u64, buffer: [*]u8) void {
//     return boardOf(11, seed, buffer);
// }

// export fn generate12(seed: u64, buffer: [*]u8) void {
//     return boardOf(12, seed, buffer);
// }
