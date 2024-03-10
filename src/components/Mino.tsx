import { Motion } from 'solid-motionone';
import { Show } from 'solid-js';

interface MinoProps {
  two?: boolean;
  row: number;
  col: number;
}

export default function Mino(props: MinoProps) {
  const style = () => {
    return {
      'grid-row-start': props.row,
      'grid-row-end': props.two ? 'span 1' : 'span 2',
      'grid-column-start': props.two ? props.col - 1 : props.col,
      'grid-column-end': props.two ? 'span 2' : 'span 1',
    };
  };

  return (
    <>
      <Motion.div
        class={`mino mino-${props.two ? 'two' : 'one'}`}
        style={style()}
        initial={{ rotate: 2, y: -10, opacity: 0 }}
        animate={{ rotate: 0, y: 0, opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <div />
        <Show when={props.two}>
          <div />
        </Show>
      </Motion.div>
    </>
  );
}
