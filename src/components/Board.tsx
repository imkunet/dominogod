import { Accessor, For, Show } from 'solid-js';
import { Grid } from '@/utils/grids';
import Mino from './Mino';
import { Motion } from 'solid-motionone';

interface BoardProps {
  twoMode: Accessor<boolean>;
  holding: Accessor<boolean>;
  createMode: Accessor<boolean>;
  audioCtx: Accessor<AudioContext | null>;
  startTime: Accessor<number>;
  inGame: Accessor<boolean>;
  grid: Accessor<Grid>;

  hoveredXY: () => [number, number] | null;
  start: () => void;

  boardElement: HTMLDivElement;
}

export default function Board(props: BoardProps) {
  const hoverStyles = () => {
    const pos = props.hoveredXY();
    if (pos == null) return {};

    return {
      'grid-row-start': pos[1] + 1,
      'grid-row-end': props.twoMode() ? 'span 1' : 'span 2',
      'grid-column-start': pos[0] + 1,
      'grid-column-end': props.twoMode() ? 'span 2' : 'span 1',
      background: `var(${props.holding() && !props.createMode() ? '--game-tile-removed' : '--game-tile-selected'})`,
    };
  };

  return (
    <>
      <Show when={props.audioCtx() == null || props.startTime() == -1}>
        <Motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          class="audio-request"
          onClick={() => props.start()}
        >
          Click to start
        </Motion.button>
      </Show>
      <Show when={props.inGame()}>
        <Show when={props.hoveredXY() != null && !(props.holding() && props.createMode())}>
          <div class="mino-select" style={hoverStyles()} />
        </Show>

        <For each={props.grid().flat()}>
          {(v, i) => {
            if (v == 'one' || v == 'two')
              return (
                <Mino
                  col={Math.floor(i() / 7) + 1}
                  row={Math.floor(i() % 7) + 1}
                  two={v == 'two'}
                />
              );
            if (v == 'block')
              return (
                <Motion.div
                  style={{
                    'grid-column-start': Math.floor(i() / 7) + 1,
                    'grid-row-start': Math.floor(i() % 7) + 1,
                  }}
                  class="block"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.15 }}
                />
              );
            return <></>;
          }}
        </For>
      </Show>
    </>
  );
}
