import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import "./ConfirmModal.css";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;              // 삭제 같은 위험 동작일 때 강조
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmModal({
                                       open,
                                       title = "확인",
                                       description = "이 채팅방을 삭제하시겠어요?",
                                       confirmText = "확인",
                                       cancelText = "취소",
                                       danger = false,
                                       onConfirm,
                                       onClose,
                                     }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
      <div className="cm-backdrop" role="dialog" aria-modal="true" aria-labelledby="cm-title" onClick={onClose}>
        <div
            className="cm-panel"
            role="document"
            ref={panelRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
        >
          <div className="cm-header">
            <h3 id="cm-title">{title}</h3>
          </div>

          {description && <p className="cm-desc">{description}</p>}

          <div className="cm-actions">
            <button className="cm-btn cm-cancel" onClick={onClose} type="button">
              {cancelText}
            </button>
            <button
                className={`cm-btn cm-confirm ${danger ? "cm-danger" : ""}`}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                type="button"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>,
      document.body
  );
}