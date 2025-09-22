import { createRoot } from 'react-dom/client';
import AppRouter from '@/app/router';
import './index.css';
import './assets/fonts/fonts.css'

if (import.meta.env.DEV) console.log("BASE =", import.meta.env.VITE_API_BASE_URL);

createRoot(document.getElementById('root')!).render(<AppRouter />);