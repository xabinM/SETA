import { Link } from "react-router-dom";
import logoSrc from "@/assets/seta.png";

export default function Header() {
    return (
        <nav
            role="navigation"
            aria-label="Main navigation"
            className="
        fixed left-1/2 -translate-x-1/2 z-[64]
        flex items-center justify-between
        text-white
        [&_a]:!text-white [&_a:visited]:!text-white
        [&_a]:!no-underline [&_a:hover]:!no-underline
        [&_a]:opacity-90 [&_a:hover]:opacity-100
      "
            style={{
                top: "20px",
                width: "457px",
                height: "66px",
                padding: "0 24px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "9999px",
                backdropFilter: "blur(6px)",
                boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
        >
            {/* 로고 영역: 클릭/포커스 불가(탭 이동도 없음) */}
            <div
                className="flex items-center gap-3 select-none cursor-default"
                aria-label="SETA"
            >
        <span
            aria-hidden="true"
            className="flex items-center justify-center"
            style={{
                width: "33px",
                height: "33px",
                background:
                    "linear-gradient(45deg, rgba(168, 85, 247, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)",
                borderRadius: "9999px",
                boxShadow: "0px 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
        >
          <img
              src={logoSrc}
              alt=""
              className="select-none"
              draggable={false}
              style={{ width: "22px", height: "23px", objectFit: "contain" }}
          />
        </span>
                <span
                    className="font-bold"
                    style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: "24px",
                        lineHeight: "32px",
                        marginLeft: "10px",
                    }}
                >
          SETA
        </span>
            </div>

            {/* 네비게이션: 이 링크들만 이동 */}
            <div className="h-full flex items-center whitespace-nowrap space-x-6">
                <Link
                    to="/chat"
                    className="transition-opacity opacity-90 hover:opacity-100"
                    style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: "20px",
                        lineHeight: "24px",
                        marginRight: "70px",
                        marginTop: "3px",
                    }}
                >
                    Chat
                </Link>
                <Link
                    to="/dashboard"
                    className="transition-opacity opacity-90 hover:opacity-100"
                    style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: "20px",
                        lineHeight: "24px",
                        marginRight: "45px",
                        marginTop: "3px",
                    }}
                >
                    Dashboard
                </Link>
            </div>
        </nav>
    );
}
