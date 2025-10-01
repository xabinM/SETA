import {useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {useNavigate} from "react-router-dom";
import UserPersonalize from "@/ui/components/Modal/UserPersonalize/UserPersonalize";
import type {PersonalizeValues} from "@/ui/components/Modal/UserPersonalize/UserPersonalize";
import {logout} from "@/features/auth/api";
import {tokenStore} from "@/shared/auth/token";
import {ApiError} from "@/shared/api/http";
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
    const navigate = useNavigate();
    const [loggingOut, setLoggingOut] = useState(false);

    const [personalizeOpen, setPersonalizeOpen] = useState(false);
    const [personalizeSeed, setPersonalizeSeed] = useState<Partial<PersonalizeValues>>({});

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
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

    const loadPersonalizeSeed = (): Partial<PersonalizeValues> => {
        try {
            const raw = localStorage.getItem("seta:personalize");
            return raw ? (JSON.parse(raw) as Partial<PersonalizeValues>) : {};
        } catch {
            return {};
        }
    };

    const handleOpenPersonalize = () => {
        setPersonalizeSeed(loadPersonalizeSeed());
        setPersonalizeOpen(true);
        onOpenPersonalize?.();
        onClose();
    };

    const handleLogoutClick = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await (onLogout ? onLogout() : logout());
        } catch (err) {
            if (err instanceof ApiError) {
                console.warn(`logout API failed: ${err.status} ${err.message}`);
            } else {
                console.warn("logout error:", err);
            }
        } finally {
            tokenStore.clear();
            setLoggingOut(false);
            onClose();
            navigate("/home", {replace: true});
        }
    };


    const menuPortal =
        open && !personalizeOpen && anchorRef.current
            ? createPortal(
                <div className={`usermenu-wrap ${align}`} aria-modal="true" role="dialog">
                    <div className="usermenu-panel" ref={panelRef}>
                        <button className="usermenu-item" onClick={handleOpenPersonalize}>
                            <span className="material-icons" aria-hidden>tune</span>
                            개인 맞춤 설정
                        </button>
                        <div className="usermenu-divider"/>
                        <button
                            className="usermenu-item danger"
                            onClick={handleLogoutClick}
                            disabled={loggingOut}
                            aria-busy={loggingOut}
                        >
                            <span className="material-icons" aria-hidden>logout</span>
                            {loggingOut ? "로그아웃…" : "로그아웃"}
                        </button>
                    </div>
                </div>,
                anchorRef.current
            )
            : null;

    return (
        <>
            {menuPortal}

            {personalizeOpen && (
                <UserPersonalize
                    open
                    initialValues={personalizeSeed}
                    onClose={() => setPersonalizeOpen(false)}
                    onSave={(values) => {
                        localStorage.setItem("seta:personalize", JSON.stringify(values));
                        setPersonalizeOpen(false);
                    }}
                />
            )}
        </>
    );
}
