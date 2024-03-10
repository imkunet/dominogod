import { TbCpu, TbDice, TbTrash } from 'solid-icons/tb';
import { Accessor } from 'solid-js';
import { Motion } from 'solid-motionone';

interface HeaderProps {
  inGame: Accessor<boolean>;
  currentTime: Accessor<number>;
  startTime: Accessor<number>;
  solutionShown: Accessor<boolean>;
  solved: Accessor<boolean>;
  wizard: Accessor<boolean>;

  solve: () => void;
  trash: () => void;
  reset: () => void;
}

export default function Header(props: HeaderProps) {
  return (
    <div class="info-container">
      <div class="header">
        <img src="/favicon.svg" />
        <h1>dominogod</h1>
      </div>
      <a target="_blank" href="https://dominofit.isotropic.us/">
        go play the original by isotropic.us »
      </a>
      <div class="util-bar">
        <h3>
          {!props.inGame() ? '∞' : ((props.currentTime() - props.startTime()) / 1000).toFixed(1)}{' '}
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
          <button onClick={() => props.reset()}>
            <TbDice style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
