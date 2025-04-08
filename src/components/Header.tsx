import { Accessor, Setter, Show } from 'solid-js';
import { TbCpu, TbDice, TbSettings, TbTrash } from 'solid-icons/tb';
import { BattlePassDisplay } from './BattlePass';
import { Motion } from 'solid-motionone';
import { Settings } from '@/utils/settings';

interface HeaderProps {
  inGame: Accessor<boolean>;
  currentTime: Accessor<number>;
  startTime: Accessor<number>;
  solutionShown: Accessor<boolean>;
  solved: Accessor<boolean>;
  wizard: Accessor<boolean>;
  settings: Accessor<Settings>;
  gridSize: Accessor<number>;

  setSettingsOpen: Setter<boolean>;
  setGridSize: Setter<number>;

  solve: () => void;
  trash: () => void;
  reset: () => void;
}

export default function Header(props: HeaderProps) {
  const displayTime = () => {
    let displayTime = ((props.currentTime() - props.startTime()) / 1000).toFixed(1);
    if (!props.inGame() || (props.settings().hideTime && !props.solved()) || props.solutionShown())
      displayTime = '∞';
    return displayTime;
  };

  const isSelected = (n: number): boolean => props.gridSize() === n;

  return (
    <div class="info-container">
      <div class="header">
        <Show when={props.settings().showBranding}>
          <img src="/favicon.svg" />
          <h1>dominogod</h1>
        </Show>
      </div>
      <Show when={!props.settings().hideEndorsement}>
        <a target="_blank" href="https://dominofit.isotropic.us/">
          go play the original by isotropic.us »
        </a>
      </Show>
      <div class="util-bar">
        <h3>
          {displayTime()}{' '}
          {props.solutionShown() && (
            <Motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              🤖
            </Motion.span>
          )}
          {props.solved() && props.wizard() && !props.solutionShown() && (
            <Motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              🧙‍♂️
            </Motion.span>
          )}
          {props.solved() && !props.wizard() && !props.solutionShown() && (
            <Motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ✅
            </Motion.span>
          )}
        </h3>

        <div class="button-bar">
          <select
            onChange={(e) => {
              props.setGridSize(parseInt(e.target.value));
              props.reset();
            }}
          >
            <option value="6" selected={isSelected(6)}>
              6x6
            </option>
            <option value="7" selected={isSelected(7)}>
              7x7
            </option>
            <option value="8" selected={isSelected(8)}>
              8x8
            </option>
          </select>
          <button onClick={() => props.setSettingsOpen(true)}>
            <TbSettings style={{ color: 'var(--color-text-secondary)' }} />
          </button>
          <Show when={props.settings().showSolveButton}>
            <button onClick={() => props.solve()}>
              <TbCpu
                style={{
                  color:
                    props.solutionShown() || !props.inGame()
                      ? 'var(--color-text-disabled)'
                      : 'var(--color-text-secondary)',
                  transition: 'color 250ms',
                }}
              />
            </button>
          </Show>
          <Show when={!props.settings().hideTrash}>
            <button onClick={() => props.trash()}>
              <TbTrash
                style={{
                  color:
                    props.solved() || !props.inGame()
                      ? 'var(--color-text-disabled)'
                      : 'var(--color-text-secondary)',
                  transition: 'color 250ms',
                }}
              />
            </button>
          </Show>
          <button onClick={() => props.reset()}>
            <TbDice style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>
      </div>
      <Show when={!props.settings().hideBattlePass}>
        <BattlePassDisplay />
      </Show>
    </div>
  );
}
