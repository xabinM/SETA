import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./UserMenu.css";

export type UserMenuProps = {
  open: boolean;
  anchorRef:
      | React.MutableRefObject<HTMLDivElement | null>
      | React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onOpenPersonalize: () => void;             // 개인화 모달 열기(나중에 구현)
  onLogout: () => void;                      // 로그아웃 액션
  email?: string;
  align?: "left" | "right";                  // 필요 시 정렬 옵션
};

export default function UserMenu({
                                   open, anchorRef, onClose, onOpenPersonalize, onLogout, align = "left",
                                 }: UserMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC/바깥 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onClick = (e: MouseEvent) => {
      const p = panelRef.current;
      if (p && !p.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  if (!open || !anchorRef.current) return null;

  return createPortal(
      <div className={`usermenu-wrap ${align}`} aria-modal="true" role="dialog">
        <div className="usermenu-panel" ref={panelRef}>
          <button className="usermenu-item" onClick={onOpenPersonalize}>
            <span className="material-icons" aria-hidden>tune</span>
            개인 맞춤 설정
          </button>
          <div className="usermenu-divider" />
          <button className="usermenu-item danger" onClick={onLogout}>
            <span className="material-icons" aria-hidden>logout</span>
            로그아웃
          </button>
        </div>
      </div>,
      anchorRef.current
  );
}
