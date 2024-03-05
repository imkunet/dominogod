import '@/styles/game.css';
import '@/styles/mino.css';

import { For, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import {
  Grid,
  calcColNumbers,
  calcRowNumbers,
  emptyGrid,
  generateGrid,
  isOutOfBounds,
} from '@/utils/grids';
import { Motion, Presence } from 'solid-motionone';
import { TbCheck, TbDice, TbTrash } from 'solid-icons/tb';
import { playDingSound, playPlaceSound } from '@/utils/audio';

import Mino from '@/components/Mino';
import { clamp } from '@/utils/math';

function Game() {
  // audio engine stuff
  const [audioCtx, setAudioCtx] = createSignal<AudioContext | null>(null);

  // game grid stuff
  const [gridSolution, setGridSolution] = createSignal<Grid>(generateGrid());
  const [grid, setGrid] = createSignal<Grid>(emptyGrid());

  const [colNumbers, setColNumbers] = createSignal<number[]>([]);
  const [colSolvedNumbers, setColSolvedNumbers] = createSignal<number[]>([]);
  const [rowNumbers, setRowNumbers] = createSignal<number[]>([]);
  const [rowSolvedNumbers, setRowSolvedNumbers] = createSignal<number[]>([]);

  // mouse state tracking
  const [holding, setHolding] = createSignal(false);
  const [createMode, setCreateMode] = createSignal(true);
  const [relativeMouseXY, setRelativeMouseXY] = createSignal<[number, number] | null>(null);

  // other game state
  const [twoMode, setTwoMode] = createSignal(false);
  const [solved, setSolved] = createSignal(false);
  const [startTime, setStartTime] = createSignal(-1);
  const [currentTime, setCurrentTime] = createSignal(-1);
  const [wizard, setWizard] = createSignal(true);
  const [solutionShown, setSolutionShown] = createSignal(false);

  const inGame = () => startTime() != -1;
  const isOccupied = (x: number, y: number): boolean => {
    if (isOutOfBounds(x, y)) return true;
    return grid()[x][y] != null;
  };
  const checkFit = (x: number, y: number): boolean => {
    if (isOccupied(x, y)) return false;
    if (twoMode()) return !isOccupied(x + 1, y);
    return !isOccupied(x, y + 1);
  };
  const toggleTwoMode = () => setTwoMode(!twoMode());
  const rawCoordinates = (): [number, number, number, number] | null => {
    const mouse = relativeMouseXY();
    if (mouse == null) return null;
    if (mouse[0] < 0 || mouse[1] < 0) return null;

    const absX = (mouse[0] / boardElement.clientWidth) * 7;
    const absY = (mouse[1] / boardElement.clientHeight) * 7;

    if (absX > 7 || absY > 7) return null;

    return [absX, absY, Math.floor(absX), Math.floor(absY)];
  };
  const hoveredXY = (): [number, number] | null => {
    const coordinates = rawCoordinates();
    if (coordinates == null) return null;

    let wholeX = coordinates[2];
    const fractX = coordinates[0] - wholeX;

    let wholeY = coordinates[3];
    const fractY = coordinates[1] - wholeY;

    const current = grid()[wholeX][wholeY];
    if (!(current != 'block' || current != null)) return null;

    if (current == 'block') {
      // ok now we're in a predicament where we need to shift based on fract
      if (twoMode())
        wholeX = clamp(0, 6, wholeX + ((fractX > 0.5 && wholeX != 6) || wholeX == 0 ? 1 : -2));
      else wholeY = clamp(0, 6, wholeY + ((fractY > 0.5 && wholeY != 6) || wholeY == 0 ? 1 : -2));

      if (!checkFit(wholeX, wholeY)) return null;
      return [wholeX, wholeY];
    }

    if (isOccupied(wholeX, wholeY)) return null;

    if (twoMode()) {
      const right = checkFit(wholeX, wholeY);
      const left = checkFit(wholeX - 1, wholeY);
      if (fractX > 0.5 && right) return [wholeX, wholeY];
      if (fractX <= 0.5 && left) return [wholeX - 1, wholeY];
      if (right || left) return [wholeX + (right ? 0 : -1), wholeY];
      return null;
    }

    const bottom = checkFit(wholeX, wholeY);
    const top = checkFit(wholeX, wholeY - 1);
    if (fractY > 0.5 && bottom) return [wholeX, wholeY];
    if (fractY <= 0.5 && top) return [wholeX, wholeY - 1];
    if (bottom || top) return [wholeX, wholeY + (bottom ? 0 : -1)];
    return null;
  };
  const hoverStyles = () => {
    const pos = hoveredXY();
    if (pos == null) return {};

    return {
      'grid-row-start': pos[1] + 1,
      'grid-row-end': twoMode() ? 'span 1' : 'span 2',
      'grid-column-start': pos[0] + 1,
      'grid-column-end': twoMode() ? 'span 2' : 'span 1',
      background: `var(${holding() && !createMode() ? '--game-tile-removed' : '--game-tile-selected'})`,
    };
  };
  const numberStyles = (c: number, g: number) => {
    return {
      color: solved() ? 'inherit' : c > g ? 'red' : c == g ? 'green' : 'inherit',
      transition: 'color 250ms',
    };
  };
  const reset = () => {
    setStartTime(-1);
    setSolved(false);
    setGridSolution(generateGrid);
    setWizard(true);
    setSolutionShown(false);
  };

  let boardElement: HTMLDivElement;

  onMount(() => {
    const loop = (t: number) => {
      frame = requestAnimationFrame(loop);
      if (!solved()) setCurrentTime(t);
    };

    let frame = requestAnimationFrame(loop);
    onCleanup(() => cancelAnimationFrame(frame));
  });

  onMount(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (!inGame()) return;
      if (event.ctrlKey && event.key == 'r') {
        event.preventDefault();
        reset();
      }
      if (event.repeat) return;
      if (event.key == '1' || event.key == '2' || event.key == ' ') toggleTwoMode();
    };
    document.addEventListener('keydown', keyHandler);

    const handleMove = (x: number, y: number) => {
      const elementRect = boardElement.getBoundingClientRect();
      const elementX = x - elementRect.left;
      const elementY = y - elementRect.top;

      setRelativeMouseXY([elementX, elementY]);
    };

    const moveHandler = (event: MouseEvent) => handleMove(event.clientX, event.clientY);
    boardElement.addEventListener('mousemove', moveHandler);

    const touchMoveHandler = (event: TouchEvent) =>
      handleMove(event.touches[0]?.clientX || -1, event.touches[0]?.clientY || -1);
    boardElement.addEventListener('touchmove', touchMoveHandler);

    const offHandler = () => setRelativeMouseXY(null);
    boardElement.addEventListener('mouseout', offHandler);

    const rightSwitchHandler = (event: MouseEvent) => {
      if (!inGame()) return;
      event.preventDefault();
      toggleTwoMode();
    };
    document.addEventListener('contextmenu', rightSwitchHandler);

    const handleMouseDown = () => {
      if (!inGame()) return;
      const coordinates = rawCoordinates();
      if (coordinates == null) return;

      const tile = grid()[coordinates[2]][coordinates[3]];
      if (tile == 'block') return;

      setCreateMode(tile == null);
      setHolding(true);
    };

    const mouseDownHandler = (event: MouseEvent) => {
      if (event.button != 0) return;
      handleMouseDown();
    };
    boardElement.addEventListener('mousedown', mouseDownHandler);

    const touchDownHandler = (event: TouchEvent) => {
      if (!inGame()) return;
      event.preventDefault();
      handleMove(event.touches[0]?.clientX || -1, event.touches[0]?.clientY || -1);
      handleMouseDown();
    };
    boardElement.addEventListener('touchstart', touchDownHandler);

    const handleMouseUp = () => {
      if (!holding()) return;
      setHolding(false);
    };
    const mouseUpHandler = () => handleMouseUp();
    const touchUpHandler = () => {
      handleMouseUp();
      offHandler();
    };
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('touchend', touchUpHandler);

    onCleanup(() => {
      document.removeEventListener('keydown', keyHandler);
      boardElement.removeEventListener('mousemove', moveHandler);
      boardElement.removeEventListener('touchmove', touchMoveHandler);
      boardElement.removeEventListener('mouseout', offHandler);
      document.removeEventListener('contextmenu', rightSwitchHandler);
      boardElement.removeEventListener('mousedown', mouseDownHandler);
      boardElement.removeEventListener('touchstart', touchDownHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      document.removeEventListener('touchend', touchUpHandler);
    });
  });

  createEffect(() => {
    setGrid(gridSolution().map((v) => v.map((v1) => (v1 == 'block' ? 'block' : null))));
  });

  createEffect(() => {
    if (solved()) return;
    if (!holding()) return;

    if (createMode()) {
      const hovered = hoveredXY();
      if (hovered == null) return;

      const currentGrid = [...grid()];

      if (twoMode()) {
        currentGrid[hovered[0]][hovered[1]] = 'two_complement';
        currentGrid[hovered[0] + 1][hovered[1]] = 'two';
      } else {
        currentGrid[hovered[0]][hovered[1]] = 'one';
        currentGrid[hovered[0]][hovered[1] + 1] = 'one_complement';
      }

      setGrid(currentGrid);
      playPlaceSound(audioCtx(), true);
      return;
    }

    const coordinates = rawCoordinates();
    if (coordinates == null) return;

    const currentGrid = [...grid()];
    const tile = currentGrid[coordinates[2]][coordinates[3]];

    if (tile == null || tile == 'block') return;

    currentGrid[coordinates[2]][coordinates[3]] = null;
    if (tile == 'one') currentGrid[coordinates[2]][coordinates[3] + 1] = null;
    if (tile == 'one_complement') currentGrid[coordinates[2]][coordinates[3] - 1] = null;
    if (tile == 'two') currentGrid[coordinates[2] - 1][coordinates[3]] = null;
    if (tile == 'two_complement') currentGrid[coordinates[2] + 1][coordinates[3]] = null;
    setWizard(false);
    setGrid(currentGrid);

    playPlaceSound(audioCtx(), false);
  });

  createEffect(() => {
    const solve = gridSolution();
    setColSolvedNumbers(calcColNumbers(solve));
    setRowSolvedNumbers(calcRowNumbers(solve));
  });

  createEffect(() => {
    const board = grid();
    setColNumbers(calcColNumbers(board));
    setRowNumbers(calcRowNumbers(board));
  });

  createEffect(() => {
    if (!inGame()) return;
    if (colNumbers().find((v, i) => v != colSolvedNumbers()[i]) != undefined) return;
    if (rowNumbers().find((v, i) => v != rowSolvedNumbers()[i]) != undefined) return;
    setSolved(true);
    playDingSound(audioCtx());
  });

  return (
    <>
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
              {solutionShown() && '🤖'}
              {wizard() && !solutionShown() && '🧙‍♂️'}
              <button onClick={reset}>
                <TbDice style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              <button
                onClick={() => {
                  if (solutionShown() || !inGame()) return;
                  setGrid(emptyGrid());
                  setGrid([...gridSolution().map((v) => v.map((v1) => v1))]);
                  setSolutionShown(true);
                  playPlaceSound(audioCtx(), true);
                }}
              >
                <TbCheck
                  style={{
                    color:
                      solutionShown() || !inGame()
                        ? 'var(--color-text-disabled)'
                        : 'var(--color-text-secondary)',
                    transition: 'color 250ms',
                  }}
                />
              </button>
              <button
                onClick={() => {
                  if (solved() || !inGame()) return;
                  setGrid(
                    gridSolution().map((v) => v.map((v1) => (v1 == 'block' ? 'block' : null))),
                  );
                  setWizard(false);
                  playPlaceSound(audioCtx(), false);
                }}
              >
                <TbTrash
                  style={{
                    color:
                      solved() || !inGame()
                        ? 'var(--color-text-disabled)'
                        : 'var(--color-text-secondary)',
                    transition: 'color 250ms',
                  }}
                />
              </button>
            </div>
          </div>
        </div>
        <div class="container">
          <Show when={inGame()}>
            <div class="numbers numbers-top">
              <For each={colSolvedNumbers()}>
                {(v, i) => (
                  <Motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <span style={numberStyles(colNumbers()[i()], v)}>{v}</span>
                  </Motion.p>
                )}
              </For>
            </div>
            <div class="numbers numbers-side">
              <For each={rowSolvedNumbers()}>
                {(v, i) => (
                  <Motion.p initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <span style={numberStyles(rowNumbers()[i()], v)}>{v}</span>
                  </Motion.p>
                )}
              </For>
            </div>
            <div class="numbers numbers-side">
              <For each={rowSolvedNumbers()}>
                {(v, i) => (
                  <Motion.p initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <span style={numberStyles(rowNumbers()[i()], v)}>{v}</span>
                  </Motion.p>
                )}
              </For>
            </div>
          </Show>

          <div class="board" ref={boardElement!}>
            <Show when={audioCtx() == null || startTime() == -1}>
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
              <Show when={hoveredXY() != null && !(holding() && createMode())}>
                <div class="mino-select" style={hoverStyles()} />
              </Show>

              <For each={grid().flat()}>
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
          </div>
        </div>
        <Presence exitBeforeEnter>
          <Show when={!solved() && inGame()}>
            <Motion.div
              class="info-container mino-picker"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div onClick={toggleTwoMode}>
                <Motion.div
                  animate={{
                    opacity: twoMode() ? 0.5 : 1.0,
                    scale: twoMode() ? 0.9 : 1.0,
                  }}
                  transition={{ duration: 0.08 }}
                  class={`mino mino-one`}
                >
                  <div />
                </Motion.div>
              </div>
              <div onClick={toggleTwoMode}>
                <Motion.div
                  animate={{
                    opacity: !twoMode() ? 0.5 : 1.0,
                    scale: !twoMode() ? 0.9 : 1.0,
                  }}
                  transition={{ duration: 0.08 }}
                  class={`mino mino-two`}
                >
                  <div />
                  <div />
                </Motion.div>
              </div>
            </Motion.div>
          </Show>
          <Show when={solved()}>
            <Motion.div
              class="info-container button-bar button-bar-bottom"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button onClick={reset}>
                <TbDice style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </Motion.div>
          </Show>
        </Presence>
      </div>
      <span class="version">
        {import.meta.env.PACKAGE_VERSION} {import.meta.env.COMMIT_HASH}
      </span>
    </>
  );
}

export default Game;
