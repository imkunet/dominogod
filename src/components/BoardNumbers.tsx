import { Accessor, For } from 'solid-js';
import { Motion, Presence } from 'solid-motionone';

interface BoardNumbersProps {
  inGame: Accessor<boolean>;
  solved: Accessor<boolean>;
  numbers: Accessor<number[]>;
  solvedNumbers: Accessor<number[]>;
}

const numberStyles = (solved: boolean, c: number, g: number) => {
  return {
    color: solved
      ? 'inherit'
      : c > g
        ? 'var(--color-text-red)'
        : c == g
          ? 'var(--color-text-green)'
          : 'inherit',
    transition: 'color 250ms',
  };
};

export function TopNumbers(props: BoardNumbersProps) {
  return (
    <div class="numbers numbers-top">
      <For each={props.solvedNumbers()}>
        {(v, i) => (
          <Presence exitBeforeEnter>
            {props.inGame() && (
              <Motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
              >
                <span style={numberStyles(props.solved(), props.numbers()[i()], v)}>{v}</span>
              </Motion.p>
            )}
          </Presence>
        )}
      </For>
    </div>
  );
}

interface SideBoardNumbersProps extends BoardNumbersProps {
  startSign: number;
}

export function SideNumbers(props: SideBoardNumbersProps) {
  return (
    <div class="numbers numbers-side">
      <For each={props.solvedNumbers()}>
        {(v, i) => (
          <Presence exitBeforeEnter>
            {props.inGame() && (
              <Motion.p
                initial={{ x: 10 * props.startSign, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 10 * props.startSign, opacity: 0 }}
              >
                <span style={numberStyles(props.solved(), props.numbers()[i()], v)}>{v}</span>
              </Motion.p>
            )}
          </Presence>
        )}
      </For>
    </div>
  );
}
