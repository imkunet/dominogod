import { Show } from 'solid-js';

interface MinoProps {
  two?: boolean;
  row: number;
  col: number;
}

function Mino(props: MinoProps) {
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
      <div class={`mino mino-${props.two ? 'two' : 'one'}`} style={style()}>
        <div />
        <Show when={props.two}>
          <div />
        </Show>
      </div>
    </>
  );
}

export default Mino;
