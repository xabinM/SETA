import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Landing from '@/pages/Landing';
import NotFound from '@/pages/NotFound/NotFound';

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '*', element: <NotFound /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}