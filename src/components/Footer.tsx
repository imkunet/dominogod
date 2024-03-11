import { Accessor, Show } from 'solid-js';
import { Motion, Presence } from 'solid-motionone';
import { TbDice } from 'solid-icons/tb';

interface FooterProps {
  solved: Accessor<boolean>;
  inGame: Accessor<boolean>;
  twoMode: Accessor<boolean>;

  reset: () => void;
  setOrToggleTwoMode: (two: boolean) => void;
}

export default function Footer(props: FooterProps) {
  return (
    <Presence exitBeforeEnter>
      <Show when={!props.solved() && props.inGame()}>
        <Motion.div
          class="info-container mino-picker"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div onClick={() => props.setOrToggleTwoMode(false)}>
            <Motion.div
              animate={{
                opacity: props.twoMode() ? 0.5 : 1.0,
                scale: props.twoMode() ? 0.9 : 1.0,
              }}
              transition={{ duration: 0.08 }}
              class={`mino mino-one`}
            >
              <div />
            </Motion.div>
          </div>
          <div onClick={() => props.setOrToggleTwoMode(true)}>
            <Motion.div
              animate={{
                opacity: !props.twoMode() ? 0.5 : 1.0,
                scale: !props.twoMode() ? 0.9 : 1.0,
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
      <Show when={props.solved()}>
        <Motion.div
          class="info-container button-bar button-bar-bottom"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <button onClick={() => props.reset()}>
            <TbDice style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </Motion.div>
      </Show>
    </Presence>
  );
}
