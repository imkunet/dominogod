/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import Game from './Game';

const root = document.getElementById('root');

render(() => <Game />, root!);
