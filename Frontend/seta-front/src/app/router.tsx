import {lazy, Suspense, type ReactElement} from "react";
import {createBrowserRouter, RouterProvider, Outlet} from "react-router-dom";
import AppBootstrap from "@/app/AppBootstrap";
import ProtectedRoute from "@/app/ProtectedRoute";

const Landing = lazy(() => import("@/pages/Landing"));
const Home = lazy(() => import("@/pages/Home/Home"));
const Login = lazy(() => import("@/pages/Login/Login"));
const SignUp = lazy(() => import("@/pages/SignUp/SignUp"));
const NotFound = lazy(() => import("@/pages/NotFound/NotFound"));
const Chat = lazy(() => import("@/pages/Chat/Chat"));
const ChatRoom = lazy(() => import("@/pages/Chat/ChatRoom"));
const Dashboard = lazy(() => import("@/pages/Dashboard/Dashboard"));

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">페이지를 불러오는 중...</p>
        </div>
    </div>
);

const withSuspense = (element: ReactElement) => (
    <Suspense fallback={<LoadingFallback/>}>{element}</Suspense>
);

function RootLayout() {
    return (
        <>
            <AppBootstrap/>
            <Outlet/>
        </>
    );
}

const router = createBrowserRouter([
    {
        element: <RootLayout/>,
        children: [
            {path: "/", element: withSuspense(<Landing/>)},
            {path: "/home", element: withSuspense(<Home/>)},
            {path: "/login", element: withSuspense(<Login/>)},
            {path: "/signup", element: withSuspense(<SignUp/>)},

            {
                element: <ProtectedRoute/>,
                children: [
                    {path: "/chat", element: withSuspense(<Chat/>)},
                    {path: "/chat/:threadId", element: withSuspense(<ChatRoom/>)},
                    {path: "/dashboard", element: withSuspense(<Dashboard/>)},
                ]
            },

            {path: "*", element: withSuspense(<NotFound/>)},
        ],
    },
]);

export default function AppRouter() {
    return <RouterProvider router={router}/>;
}
