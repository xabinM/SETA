import { Link } from 'react-router-dom'

export default function Home() {
    return (
        <main style={{ padding: 24 }}>
        <h1>Home</h1>
        <p>Vite + React Router 테스트</p>
        <nav>
        <Link to="/about">Go to About →</Link>
        </nav>
        </main>
    )
}
