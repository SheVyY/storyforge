import { type Component, type ParentProps } from 'solid-js';
import { A } from '@solidjs/router';
import './Layout.css';

const Layout: Component<ParentProps> = (props) => {
  return (
    <div class="app-layout">
      <header class="app-header">
        <div class="header-content">
          <h1 class="app-title">StoryForge</h1>
          <nav class="app-nav">
            <A href="/" class="nav-link">Play</A>
            <A href="/settings" class="nav-link">Settings</A>
            <A href="/saves" class="nav-link">Saves</A>
          </nav>
        </div>
      </header>
      
      <main class="app-main">
        {props.children}
      </main>
      
      <footer class="app-footer">
        <div class="footer-content">
          <p class="footer-text">Powered by AI • Running locally in your browser</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;