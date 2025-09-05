import { Link } from 'react-router-dom'

export default function NotFound() {
    return (
        <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
            textAlign: 'center',
        }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '1rem', color: '#ff6b6b' }}>404</h1>
            <p style={{ marginBottom: '2rem', fontSize: '1.25rem' }}>
                죄송합니다, 요청하신 페이지를 찾을 수 없습니다.
            </p>
            <Link
                to="/"
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#4dabf7',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                }}
            >
                홈으로 돌아가기
            </Link>
        </main>
    )
}