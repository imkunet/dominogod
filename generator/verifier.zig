// zig build-exe verifier.zig -fllvm -OReleaseFast

const std = @import("std");
const dominoboard = @import("root.zig");

const board = dominoboard.DominoBoard(8);
const thread_count = 10;
var iterations = std.atomic.Value(usize).init(0);
var t_start: i128 = undefined;
var killswitch: bool = false;
var reset = std.Thread.ResetEvent{};

fn print_ms(ns: i128) void {
    const f_ns: f64 = @floatFromInt(ns);
    const deno: f64 = @floatFromInt(std.time.ns_per_ms);
    std.debug.print("{d}ms\n", .{f_ns / deno});
}

fn handle_signal(sig_num: c_int) callconv(.C) void {
    _ = sig_num;

    const t_duration = std.time.nanoTimestamp() - t_start;
    std.debug.print("took ", .{});
    print_ms(t_duration);
    std.debug.print("iterated over {d} boards\n", .{iterations.load(.monotonic)});
    killswitch = true;
    reset.set();
}

fn worker() void {
    outer: while (!killswitch) {
        const seed = std.crypto.random.int(u64);
        var generated = board.generate(seed);
        for (0..(generated.n - 3)) |row| {
            for (0..(generated.n - 3)) |col| {
                if (generated.getBounded(row, col) == dominoboard.cs_t and generated.getBounded(row + 2, col + 1) == dominoboard.cs_tt and generated.getBounded(row, col + 2) == dominoboard.cs_tt and generated.getBounded(row + 1, col + 2) == dominoboard.cs_t) {
                    generated.print();
                    std.debug.print("seed: {d}\n", .{seed});
                    board.generate(seed).print();
                    reset.set();

                    break :outer;
                }
            }
        }

        _ = iterations.fetchAdd(1, .monotonic);
    }
}

pub fn main() !void {
    t_start = std.time.nanoTimestamp();

    const action = std.posix.Sigaction{
        .handler = .{ .handler = handle_signal },
        .mask = std.posix.empty_sigset,
        .flags = 0,
    };

    std.posix.sigaction(std.posix.SIG.INT, &action, null);

    for (0..thread_count) |_| {
        (try std.Thread.spawn(.{}, worker, .{})).detach();
    }

    reset.wait();
    std.time.sleep(100 * std.time.ns_per_ms);
}
