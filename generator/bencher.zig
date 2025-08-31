const std = @import("std");
const dominoboard = @import("root.zig");

const DominoBoard = dominoboard.DominoBoard(32);
const runs = 1;

fn print_ms(ns: i128) void {
    const f_ns: f64 = @floatFromInt(ns);
    const deno: f64 = @floatFromInt(std.time.ns_per_ms);
    std.debug.print("{d}ms\n", .{f_ns / deno});
}

pub fn main() !void {
    // const seed = std.crypto.random.int(u64);
    // const board = EdgeBoard8.init();
    // std.debug.print("it's {} by {}\n", .{ board.n, board.n });
    // std.debug.print("[", .{});
    //
    // for (board.board) |value| {
    //     std.debug.print(" {}, ", .{value});
    // }
    //
    // std.debug.print("]\n", .{});

    // const t_start = std.time.nanoTimestamp();
    // const generated = lib.EdgeBoard(8).generate(seed);
    // const t_duration = std.time.nanoTimestamp() - t_start;
    // generated.print();
    // std.debug.print("{}ns\n", .{t_duration});

    var max: i128 = 0;
    var min: i128 = std.math.maxInt(i128);
    var sum: i128 = 0;

    for (0..runs) |_| {
        const t_start = std.time.nanoTimestamp();
        _ = DominoBoard.generate(std.crypto.random.int(u64));
        const t_duration = std.time.nanoTimestamp() - t_start;
        if (t_duration > max) max = t_duration;
        if (t_duration < min) min = t_duration;
        sum += t_duration;
    }

    std.debug.print("avg. ", .{});
    print_ms(@divTrunc(sum, runs));
    std.debug.print("max ", .{});
    print_ms(max);
    std.debug.print("min ", .{});
    print_ms(min);
}
