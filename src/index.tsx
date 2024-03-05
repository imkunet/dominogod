/* @refresh reload */
import '@/styles/index.css';
import Game from './pages/Game';
import { render } from 'solid-js/web';

const root = document.getElementById('root');

render(() => <Game />, root!);
