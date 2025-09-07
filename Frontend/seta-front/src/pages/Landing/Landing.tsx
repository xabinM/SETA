import { useEffect } from "react";
import "./Landing.css";

export default function Landing() {
  useEffect(() => {
    // 폰트 로딩
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Knewave:wght@400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  return (
    <main className="frame" role="main">
      <section className="overlap-group-wrapper">
        <div className="overlap-group">
          {/* 배경 블러 요소들 */}
          <div className="ellipse" role="presentation" aria-hidden="true"></div>
          <div className="div" role="presentation" aria-hidden="true"></div>
          <div className="ellipse-2" role="presentation" aria-hidden="true"></div>
          <div className="ellipse-3" role="presentation" aria-hidden="true"></div>
          <div className="ellipse-4" role="presentation" aria-hidden="true"></div>
          
          {/* 별들 */}
          <div className="star" role="presentation" aria-hidden="true"></div>
          <div className="star-2" role="presentation" aria-hidden="true"></div>
          <div className="star-3" role="presentation" aria-hidden="true"></div>
          <div className="star-4" role="presentation" aria-hidden="true"></div>
          <div className="star-5" role="presentation" aria-hidden="true"></div>
          
          {/* SETA 텍스트들 - 4개 레이어 */}
          <h1 className="text-wrapper">SETA</h1>
          <div className="text-wrapper-2" role="presentation" aria-hidden="true">SETA</div>
          <div className="text-wrapper-3" role="presentation" aria-hidden="true">SETA</div>
          <div className="text-wrapper-4" role="presentation" aria-hidden="true">SETA</div>
        </div>
      </section>
    </main>
  );
}