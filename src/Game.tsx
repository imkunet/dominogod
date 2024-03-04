import { TbRefresh } from 'solid-icons/tb';
import { For, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js';

import './game.css';
import './mino.css';
import Mino from './components/Mino';
import { Motion } from 'solid-motionone';
import { Cell, Grid, cellToValue, emptyGrid, generateGrid } from './generator';

function Game() {
  // audio engine stuff
  const [audioCtx, setAudioCtx] = createSignal<AudioContext | null>(null);
  const playSound = (high: boolean) => {
    const ctx = audioCtx();
    if (ctx == null) return;
    const oscillator = ctx.createOscillator();

    oscillator.type = 'sine';
    oscillator.frequency.value = high ? 400 : 200;

    const gain = ctx.createGain();
    gain.gain.value = 0.6;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(0);
    gain.gain.exponentialRampToValueAtTime(1e-5, ctx.currentTime + 0.03);
  };

  // game grid stuff
  const [gridSolution, setGridSolution] = createSignal<Grid>(generateGrid());
  const [grid, setGrid] = createSignal<Grid>(emptyGrid());

  // mouse state tracking
  const [holding, setHolding] = createSignal(false);
  const [createMode, setCreateMode] = createSignal(true);
  const [relativeMouseXY, setRelativeMouseXY] = createSignal<[number, number] | null>(null);

  // other game state
  const [twoMode, setTwoMode] = createSignal(false);
  const [startTime, setStartTime] = createSignal(-1);
  const [currentTime, setCurrentTime] = createSignal(-1);
  const [wizard, setWizard] = createSignal(true);

  const inGame = () => startTime() != -1;
  const colNumbers = () => {
    const solve = gridSolution();
    const numbers = [];
    for (let x = 0; x < 7; x++) {
      let current = 0;
      for (let y = 0; y < 7; y++) {
        const cell = solve[x][y];
        current += cellToValue(cell);
      }
      numbers.push(current);
    }
    return numbers;
  };
  const rowNumbers = () => {
    const solve = gridSolution();
    const numbers = [];
    for (let y = 0; y < 7; y++) {
      let current = 0;
      for (let x = 0; x < 7; x++) {
        const cell = solve[x][y];
        current += cellToValue(cell);
      }
      numbers.push(current);
    }
    return numbers;
  };
  const isOutOfBounds = (x: number, y: number) => x < 0 || y < 0 || x > 6 || y > 6;
  const isOccupied = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x > 6 || y > 6) return true;
    return grid()[x][y] != null;
  };
  const toggleTwoMode = () => setTwoMode(!twoMode());
  const hoveredRowCol = (): [number, number] | null => {
    const mouse = relativeMouseXY();
    if (mouse == null) return null;

    if (mouse[0] < 0 || mouse[1] < 0) return null;
    const absX = (mouse[0] / boardElement.clientWidth) * 7;
    let wholeX = Math.floor(absX);
    const fractX = absX - wholeX;

    const absY = (mouse[1] / boardElement.clientHeight) * 7;
    let wholeY = Math.floor(absY);
    const fractY = absY - wholeY;

    if (grid()[wholeX][wholeY] == 'block') {
      // ok now we're in a predicament where we need to shift based on fract
      if (twoMode()) {
        if (wholeX == 0) wholeX++;
        if (fractX > 0.5) {
          // test
        }
      }
    }

    if (twoMode()) {
      if (wholeX > 0 && wholeX < 6) {
        if (fractX < 0.5) --wholeX;
      }
      if (wholeX == 6) --wholeX;
    } else {
      if (wholeY > 0 && wholeY < 6) {
        if (fractY < 0.5) --wholeY;
      }
      if (wholeY == 6) --wholeY;
    }

    return [wholeX, wholeY];
  };
  const hoverStyles = () => {
    const pos = hoveredRowCol();
    if (pos == null) return {};

    return {
      'grid-row-start': pos[1] + 1,
      'grid-row-end': twoMode() ? 'span 1' : 'span 2',
      'grid-column-start': pos[0] + 1,
      'grid-column-end': twoMode() ? 'span 2' : 'span 1',
    };
  };

  let boardElement: HTMLDivElement;

  onMount(() => {
    const loop = (t: number) => {
      frame = requestAnimationFrame(loop);
      setCurrentTime(t);
    };

    let frame = requestAnimationFrame(loop);
    onCleanup(() => cancelAnimationFrame(frame));
  });

  onMount(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key == '1' || event.key == '2' || event.key == ' ') toggleTwoMode();
    };
    document.addEventListener('keydown', keyHandler);

    const moveHandler = (event: MouseEvent) => {
      const elementRect = boardElement.getBoundingClientRect();
      const elementX = event.clientX - elementRect.left;
      const elementY = event.clientY - elementRect.top;

      setRelativeMouseXY([elementX, elementY]);
    };
    boardElement.addEventListener('mousemove', moveHandler);

    const offHandler = () => setRelativeMouseXY(null);
    boardElement.addEventListener('mouseout', offHandler);

    const rightSwitchHandler = (event: MouseEvent) => {
      event.preventDefault();
      toggleTwoMode();
    };
    document.addEventListener('contextmenu', rightSwitchHandler);

    onCleanup(() => {
      document.removeEventListener('keydown', keyHandler);
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseout', offHandler);
      document.removeEventListener('contextmenu', rightSwitchHandler);
    });
  });

  createEffect(() => {
    setGrid(gridSolution().map((v) => v.map((v1) => (v1 == 'block' ? 'block' : null))));
  });

  return (
    <div class="game">
      <div class="info-container">
        <div class="header">
          <img src="/favicon.svg" />
          <h1>dominogod</h1>
        </div>
        <a target="_blank" href="https://dominofit.isotropic.us/?ref=dominogod">
          go play the original by isotropic.us »
        </a>
        <div class="util-bar">
          <h3>{!inGame() ? '∞' : ((currentTime() - startTime()) / 1000).toFixed(1)}</h3>
          <div class="button-bar">
            {wizard() && '🧙‍♂️'}
            <button>
              <TbRefresh />
            </button>
          </div>
        </div>
      </div>
      <div class="container">
        <Show when={inGame()}>
          <div class="numbers numbers-top">
            <For each={colNumbers()}>
              {(v) => (
                <Motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  {v}
                </Motion.p>
              )}
            </For>
          </div>
          <div class="numbers numbers-side">
            <For each={rowNumbers()}>
              {(v) => (
                <Motion.p initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                  {v}
                </Motion.p>
              )}
            </For>
          </div>
          <div class="numbers numbers-side">
            <For each={rowNumbers()}>
              {(v) => (
                <Motion.p initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                  {v}
                </Motion.p>
              )}
            </For>
          </div>
        </Show>

        <div class="board" ref={boardElement!}>
          <Show when={audioCtx() == null || !inGame()}>
            <button
              class="audio-request"
              onClick={() => {
                setAudioCtx(new AudioContext());
                setStartTime(currentTime());
              }}
            >
              Click to start
            </button>
          </Show>
          <Show when={inGame()}>
            <Show when={hoveredRowCol() != null}>
              <div class="mino-select" style={hoverStyles()} />
            </Show>
            <For each={grid()}>
              {(col, x) => (
                <For each={col}>
                  {(v, y) => {
                    if (v == 'one' || v == 'two')
                      return <Mino row={y() + 1} col={x() + 1} two={v == 'two'} />;
                    if (v == 'block')
                      return (
                        <Motion.div
                          style={{
                            'grid-row-start': y() + 1,
                            'grid-column-start': x() + 1,
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
              )}
            </For>
          </Show>
        </div>
      </div>
      <Show when={inGame()}>
        <Motion.div
          class="info-container mino-picker"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Motion.div
            animate={{
              opacity: twoMode() ? 0.5 : 1.0,
              scale: twoMode() ? 0.9 : 1.0,
            }}
            transition={{ duration: 0.08 }}
            onClick={toggleTwoMode}
            class={`mino mino-one`}
          >
            <div />
          </Motion.div>
          <Motion.div
            animate={{
              opacity: !twoMode() ? 0.5 : 1.0,
              scale: !twoMode() ? 0.9 : 1.0,
            }}
            transition={{ duration: 0.08 }}
            onClick={toggleTwoMode}
            class={`mino mino-two`}
          >
            <div />
            <div />
          </Motion.div>
        </Motion.div>
      </Show>
    </div>
  );
}

export default Game;
