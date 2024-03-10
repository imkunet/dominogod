use boardgen::Board;

fn main() {
    print_board(&Board {
        ones: 0,
        twos: 0,
        nope: 0,
    });
}

static one: char = '⚀';
static one_complement: char = '⊔';

static two: char = '⚁';
static two_complement: char = '⊏';

// the bits for the boards are laid out like so:
// 0 0 0 0 0 0 0
// 0 0 0 0 0 0 0
// 0 0 0 0 0 0 0
// 0 0 0 0 0 0 0
// 0 0 0 0 0 0 0
// 0 0 0 0 0 0 0
// 0 0 0 0 0 0 0

fn print_board(board: &Board) {
    let mut top = [0; 7];
    let mut side = [0; 7];

    for (x, x_ptr) in top.iter_mut().enumerate() {
        let mut current = 0;
        for y in 0..7 {
            if get_board(board.ones, x, y) {
                current += 1;
            }

            if get_board(board.twos, x, y) {
                current += 2;
            }
        }
        *x_ptr = current;
    }

    for (y, y_ptr) in side.iter_mut().enumerate() {
        let mut current = 0;
        for x in 0..7 {
            if get_board(board.ones, x, y) {
                current += 1;
            }

            if get_board(board.twos, x, y) {
                current += 2;
            }
        }
        *y_ptr = current;
    }

    let mut top_row = "    ".to_string();
    for col_number in top.iter() {
        top_row += &format!(" {: >2} ", col_number);
    }
    println!("{}", top_row);
}

fn get_board(board: u64, x: usize, y: usize) -> bool {
    let index = (y * 7) + x;
    board << index & 1 == 1
}
