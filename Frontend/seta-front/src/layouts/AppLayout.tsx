import { NavLink, Outlet } from 'react-router-dom'

export default function AppLayout() {
    const linkStyle = ({ isActive }: { isActive: boolean }) => ({
        marginRight: 12,
        textDecoration: isActive ? 'underline' : 'none',
    })

    return (
        <>
            <header style={{ padding: 16, borderBottom: '1px solid #eee' }}>
                <NavLink to="/" style={linkStyle}>
                    Home
                </NavLink>
                <NavLink to="/about" style={linkStyle}>
                    About
                </NavLink>
            </header>
            <Outlet />
        </>
    )
}
