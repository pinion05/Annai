import { createSignal } from 'solid-js';
import solidLogo from '@/assets/solid.svg';
import wxtLogo from '/wxt.svg';
import './App.css';

function App() {
  const [count, setCount] = createSignal(0);

  return (
    <div class="bg-zinc-950 text-gray-100 min-h-screen">
      <div>
        <a href="https://wxt.dev" target="_blank">
          <img src={wxtLogo} class="logo" alt="WXT logo" />
        </a>
        <a href="https://solidjs.com" target="_blank">
          <img src={solidLogo} class="logo solid" alt="Solid logo" />
        </a>
      </div>
      <h1 class="text-white">WXT + Solid</h1>
      <div class="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count()}
        </button>
        <p class="text-gray-300">
          Edit <code class="text-violet-400">popup/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p class="read-the-docs">
        Click on the WXT and Solid logos to learn more
      </p>
    </div>
  );
}

export default App;
