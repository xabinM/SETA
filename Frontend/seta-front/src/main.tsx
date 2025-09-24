import {createRoot} from 'react-dom/client';
import AppRouter from '@/app/router';
import './index.css';
import './assets/fonts/fonts.css'

createRoot(document.getElementById('root')!).render(<AppRouter/>);