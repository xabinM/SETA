import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./ConfirmModal.css";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  disableOutsideClose?: boolean; // 필요시 옵션
};

export default function ConfirmModal({
                                       open,
                                       title,
                                       description,
                                       confirmText = "확인",
                                       cancelText = "취소",
                                       danger,
                                       onConfirm,
                                       onClose,
                                       disableOutsideClose,
                                     }: Props) {
  // 열릴 때 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const { scrollY } = window;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // 모바일 레이아웃 흔들림 방지
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
      <div
          className="cmodal-root"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cmodal-title"
          aria-describedby={description ? "cmodal-desc" : undefined}
      >
        {/* 배경 스크림: blur + dim */}
        <div
            className="cmodal-scrim"
            onClick={() => {
              if (!disableOutsideClose) onClose();
            }}
            aria-hidden
        />

        {/* 모달 패널 */}
        <div className="cmodal-panel" role="document">
          <h3 id="cmodal-title" className="cmodal-title">
            {title}
          </h3>
          {description && (
              <p id="cmodal-desc" className="cmodal-desc">
                {description}
              </p>
          )}

          <div className="cmodal-actions">
            <button className="btn ghost" onClick={onClose}>
              {cancelText}
            </button>
            <button
                className={`btn ${danger ? "danger" : "primary"}`}
                onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>,
      document.body
  );
}
