import { createRoot } from 'react-dom/client';
import './app/fonts.css';
import { App } from './app/App';
import './app/global.css';

createRoot(document.getElementById('root')!).render(<App />);
