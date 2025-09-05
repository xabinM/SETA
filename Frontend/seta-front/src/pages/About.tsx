import { Link } from 'react-router-dom'

export default function About() {
    return (
        <main style={{ padding: 24 }}>
            <h1>About</h1>
            <p>라우팅 동작 확인용 페이지</p>
            <nav>
                <Link to="/">← Back to Home</Link>
            </nav>
        </main>
    )
}
