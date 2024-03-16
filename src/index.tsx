/* @refresh reload */
import '@/styles/index.css';
import { BattlePassProvider } from './components/BattlePass';
import Game from './pages/Game';
import { render } from 'solid-js/web';

const root = document.getElementById('root');

render(
  () => (
    <BattlePassProvider>
      <Game />
    </BattlePassProvider>
  ),
  root!,
);
