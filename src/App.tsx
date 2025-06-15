import { type Component } from 'solid-js';
import { Route, Router } from '@solidjs/router';
import { GameStateProvider } from './lib/simpleState';
import Layout from './components/Layout';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Saves from './pages/Saves';

const App: Component = () => {
  return (
    <GameStateProvider>
      <Router root={Layout}>
        <Route path="/" component={Home} />
        <Route path="/settings" component={Settings} />
        <Route path="/saves" component={Saves} />
      </Router>
    </GameStateProvider>
  );
};

export default App;