import {createRoot} from 'react-dom/client';
import AppRouter from '@/app/router';
import './index.css';
import './assets/fonts/fonts.css'
import "@/styles/highlight.css";

createRoot(document.getElementById('root')!).render(<AppRouter/>);