import "./Landing.css";

export default function Landing() {

    return (
        <main className="frame" role="main">
            <section className="overlap-group-wrapper">
                <div className="overlap-group">
                    <div className="ellipse" role="presentation" aria-hidden="true"></div>
                    <div className="div" role="presentation" aria-hidden="true"></div>
                    <div className="ellipse-2" role="presentation" aria-hidden="true"></div>
                    <div className="ellipse-3" role="presentation" aria-hidden="true"></div>
                    <div className="ellipse-4" role="presentation" aria-hidden="true"></div>

                    <div className="star" role="presentation" aria-hidden="true"></div>
                    <div className="star-2" role="presentation" aria-hidden="true"></div>
                    <div className="star-3" role="presentation" aria-hidden="true"></div>
                    <div className="star-4" role="presentation" aria-hidden="true"></div>
                    <div className="star-5" role="presentation" aria-hidden="true"></div>

                    <h1 className="text-wrapper">SETA</h1>
                    <div className="text-wrapper-2" role="presentation" aria-hidden="true">SETA</div>
                    <div className="text-wrapper-3" role="presentation" aria-hidden="true">SETA</div>
                    <div className="text-wrapper-4" role="presentation" aria-hidden="true">SETA</div>
                </div>
            </section>
        </main>
    );
}