import '@/styles/game.css';
import '@/styles/mino.css';

import {
  Grid,
  calcColNumbers,
  calcRowNumbers,
  emptyGrid,
  generateGrid,
  isOutOfBounds,
} from '@/utils/grids';
import { SideNumbers, TopNumbers } from '@/components/BoardNumbers';
import { batch, createEffect, createSignal, onCleanup, onMount, useContext } from 'solid-js';
import { playDingSound, playPlaceSound } from '@/utils/audio';

import { BattlePassContext } from '@/components/BattlePass';
import Board from '@/components/Board';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Portal } from 'solid-js/web';
import SettingsPanel from '@/components/SettingsPanel';
import Version from '@/components/Version';
import { clamp } from '@/utils/math';
import { loadSettings } from '@/utils/settings';

export default function Game() {
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

  // settings
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [settings, setSettings] = createSignal(loadSettings());

  // battle pass
  const battlePassContext = useContext(BattlePassContext);

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
  const setOrToggleTwoMode = (two: boolean) =>
    settings().strictControls ? setTwoMode(two) : toggleTwoMode();
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
      if (settings().blockPushing) return null;
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

  const reset = () => {
    batch(() => {
      if (!solved()) battlePassContext?.resetSessionSolveStreak();

      setStartTime(-1);
      setSolved(false);
      setGrid(emptyGrid());
      setWizard(true);
      setSolutionShown(false);
      setTwoMode(false);
    });
  };
  const start = () => {
    setAudioCtx(new AudioContext());
    setStartTime(currentTime());
    setGridSolution(generateGrid);
    battlePassContext?.handleCheckIn();
  };
  const solve = () => {
    if (solutionShown() || !inGame()) return;
    batch(() => {
      setSolutionShown(true);
      battlePassContext?.resetSessionSolveStreak();
    });
    // really cursed reactivity stuff going on here
    // this will FORCE an update so that way animations aren't bugged :)
    setGrid(emptyGrid());
    setGrid([...gridSolution().map((v) => v.map((v1) => v1))]);
    if (!settings().muted) playPlaceSound(audioCtx(), true);
  };
  const trash = () => {
    if (solved() || !inGame()) return;
    setGrid(gridSolution().map((v) => v.map((v1) => (v1 == 'block' ? 'block' : null))));
    setWizard(false);
    if (!settings().muted) playPlaceSound(audioCtx(), false);
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
      if (event.key == 'r' || event.key == 'R') {
        event.preventDefault();
        reset();
      }
      if (event.repeat) return;
      if (event.key == 'c') return trash();
      if (event.key == '1') return setOrToggleTwoMode(false);
      if (event.key == '2') return setOrToggleTwoMode(true);
      if (event.key == ' ') toggleTwoMode();
    };
    document.addEventListener('keydown', keyHandler);

    const handleMove = (x: number, y: number) => {
      // this is a concession I gotta make for all you touchscreen players out there
      // which I will now dub "touchies"... >:(
      // it is slightly problematic since this doesn't create the highlight for those
      // who aren't on mobile... oh well!
      if (!inGame()) return;
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
      // to be honest i have no idea how this is implemented on browsers :)
      if (event.touches[0] == undefined) {
        handleMove(-1, -1);
      } else {
        for (const touch of event.touches) {
          handleMove(touch.clientX, touch.clientY);
        }
      }

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
      if (!settings().muted) playPlaceSound(audioCtx(), true);
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

    if (!settings().muted) playPlaceSound(audioCtx(), false);
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
    if (!inGame() || solved()) return;
    if (grid().find((v) => v === null) != undefined) return;
    if (colNumbers().find((v, i) => v != colSolvedNumbers()[i]) != undefined) return;
    if (rowNumbers().find((v, i) => v != rowSolvedNumbers()[i]) != undefined) return;
    batch(() => {
      setSolved(true);
      if (!solutionShown()) {
        if (wizard()) battlePassContext?.reward('🧙 wizardry', 250);
        battlePassContext?.reward('✅ puzzle solved', 150);
        battlePassContext?.incrementSessionSolveStreak();

        const solveTime = currentTime() - startTime();
        if (solveTime <= 10_000) battlePassContext?.reward('✈️ 10s instant solve', 75);
        else if (solveTime <= 15_000) battlePassContext?.reward('🏍️ 15s fast solve', 50);
        else if (solveTime <= 30_000) battlePassContext?.reward('🚂 30s quick solve', 25);
      }
    });

    if (settings().muted) return;
    playDingSound(audioCtx());
  });

  return (
    <>
      <Portal>
        <SettingsPanel
          settings={settings}
          settingsOpen={settingsOpen}
          setSettings={setSettings}
          setSettingsOpen={setSettingsOpen}
        />
      </Portal>

      <div class={`game ${settings().colorBlindMode ? 'colorblind' : ''}`}>
        <Header
          inGame={inGame}
          currentTime={currentTime}
          startTime={startTime}
          solutionShown={solutionShown}
          solved={solved}
          wizard={wizard}
          settings={settings}
          setSettingsOpen={setSettingsOpen}
          solve={solve}
          trash={trash}
          reset={reset}
        />
        <div class="container">
          <TopNumbers
            inGame={inGame}
            solved={solved}
            numbers={colNumbers}
            solvedNumbers={colSolvedNumbers}
          />

          <SideNumbers
            inGame={inGame}
            solved={solved}
            numbers={rowNumbers}
            solvedNumbers={rowSolvedNumbers}
            startSign={1}
          />
          <SideNumbers
            inGame={inGame}
            solved={solved}
            numbers={rowNumbers}
            solvedNumbers={rowSolvedNumbers}
            startSign={-1}
          />

          <div class="board" ref={boardElement!}>
            <Board
              twoMode={twoMode}
              holding={holding}
              createMode={createMode}
              audioCtx={audioCtx}
              startTime={startTime}
              inGame={inGame}
              grid={grid}
              hoveredXY={hoveredXY}
              start={start}
              boardElement={boardElement!}
            />
          </div>
        </div>
        <Footer
          solved={solved}
          inGame={inGame}
          twoMode={twoMode}
          setOrToggleTwoMode={setOrToggleTwoMode}
          reset={reset}
        />
      </div>
      <Version />
    </>
  );
}
