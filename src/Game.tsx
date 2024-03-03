import { TbRefresh } from 'solid-icons/tb';
import { For, Show, createSignal, onCleanup, onMount } from 'solid-js';

import './game.css';
import './mino.css';
import Mino from './components/Mino';

type Cell = null | 'one' | 'one_complement' | 'two' | 'two_complement' | 'block';

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
  const [grid, setGrid] = createSignal<Cell[][]>(
    new Array(7).map(() => new Array(7).map(() => null)),
  );

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
  const isOccupied = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x > 6 || y > 6) return true;
    return grid()[x][y] != null;
  };
  const toggleTwoMode = () => setTwoMode(!twoMode());

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
            <For each={new Array(7)}>{() => <p>1</p>}</For>
          </div>
          <div class="numbers numbers-side">
            <For each={new Array(7)}>{() => <p>1</p>}</For>
          </div>
          <div class="numbers numbers-side">
            <For each={new Array(7)}>{() => <p>1</p>}</For>
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
            <Mino row={2} col={2} />
            <Mino row={1} col={5} two />
          </Show>
        </div>
      </div>
      <div class="info-container mino-picker">
        <Show when={inGame()}>
          <div
            onClick={toggleTwoMode}
            class={`mino mino-one ${twoMode() ? 'mino-picker-inactive' : 'mino-picker-active'}`}
          >
            <div />
          </div>
          <div
            onClick={toggleTwoMode}
            class={`mino mino-two ${twoMode() ? 'mino-picker-active' : 'mino-picker-inactive'}`}
          >
            <div />
            <div />
          </div>
        </Show>
      </div>
    </div>
  );
}

export default Game;
