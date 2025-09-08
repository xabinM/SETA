import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Landing from '@/pages/Landing';
import NotFound from '@/pages/NotFound/NotFound';
import Home from '@/pages/Home/Home';
import Login from '@/pages/Login/Login';

const router = createBrowserRouter([
    { path: '/', element: <Landing /> },
    { path: '*', element: <NotFound /> },
    {path: '/home', element: <Home />},
    {path: '/login', element: <Login />}
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}