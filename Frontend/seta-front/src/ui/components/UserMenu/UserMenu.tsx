import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import UserPersonalize from "@/ui/components/Modal/UserPersonalize/UserPersonalize";
import type { PersonalizeValues } from "@/ui/components/Modal/UserPersonalize/UserPersonalize";
import "./UserMenu.css";

type AnchorRef = { current: HTMLDivElement | null };

export type UserMenuProps = {
    open: boolean;
    anchorRef: AnchorRef;
    onClose: () => void;
    onOpenPersonalize?: () => void;
    onLogout: () => void;
    email?: string;
    align?: "left" | "right";
};

export default function UserMenu({
                                     open,
                                     anchorRef,
                                     onClose,
                                     onOpenPersonalize,
                                     onLogout,
                                     align = "left",
                                 }: UserMenuProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    // 개인화 모달 상태 + 이번에 열 때만 사용할 시드값
    const [personalizeOpen, setPersonalizeOpen] = useState(false);
    const [personalizeSeed, setPersonalizeSeed] = useState<Partial<PersonalizeValues>>({});

    // ESC/바깥 클릭으로 메뉴 닫기
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        const onClick = (e: MouseEvent) => {
            const p = panelRef.current;
            const target = e.target as Node | null;
            if (p && target && !p.contains(target)) onClose();
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClick);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClick);
        };
    }, [open, onClose]);

    // (임시) 저장된 개인화 값을 로드 — API 붙기 전까지 사용
    const loadPersonalizeSeed = (): Partial<PersonalizeValues> => {
        try {
            const raw = localStorage.getItem("seta:personalize");
            return raw ? (JSON.parse(raw) as Partial<PersonalizeValues>) : {};
        } catch {
            return {};
        }
    };

    const handleOpenPersonalize = () => {
        // 이번 오픈 시점에서만 시드값 로드
        setPersonalizeSeed(loadPersonalizeSeed());
        setPersonalizeOpen(true);
        onOpenPersonalize?.();
        // 메뉴는 즉시 언마운트 (모달과 완전 분리 → 깜빡임 방지)
        onClose();
    };

    // 메뉴는 모달 열려있는 동안엔 아예 렌더하지 않음
    const menuPortal =
        open && !personalizeOpen && anchorRef.current
            ? createPortal(
                <div className={`usermenu-wrap ${align}`} aria-modal="true" role="dialog">
                    <div className="usermenu-panel" ref={panelRef}>
                        <button className="usermenu-item" onClick={handleOpenPersonalize}>
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
            )
            : null;

    return (
        <>
            {menuPortal}

            {/* 닫으면 언마운트되어 내부 state 초기화 */}
            {personalizeOpen && (
                <UserPersonalize
                    open
                    initialValues={personalizeSeed}
                    onClose={() => setPersonalizeOpen(false)}
                    onSave={(values) => {
                        // TODO: API POST 연결 예정
                        localStorage.setItem("seta:personalize", JSON.stringify(values));
                        setPersonalizeOpen(false);
                    }}
                />
            )}
        </>
    );
}
