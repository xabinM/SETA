// UserPersonalize.tsx
import type React from "react";
import {
    useEffect,
    useRef,
    useState,
    Children,
    isValidElement,
    cloneElement,
} from "react";
import { createPortal } from "react-dom";
import "./UserPersonalize.css";

export type PersonalizeValues = {
    callMe: string;
    roleDescription: string;
    preferredTone: "neutral" | "friendly" | "polite" | "cheerful" | "calm";
    traits: string[];
    additionalContext: string;
};

type Props = {
    open: boolean; // 부모에서 조건부 렌더링으로 true만 들어옴
    initialValues?: Partial<PersonalizeValues>;
    onClose: () => void;
    onSave: (values: PersonalizeValues) => void;
};

/* --- 슬롯형 톤 선택 컴포넌트(타입 안전) --- */
type ToneValue = PersonalizeValues["preferredTone"];
type ToneProps = React.PropsWithChildren<{ value: ToneValue }>;

function hasValueProp(
    p: unknown
): p is { value: unknown; children?: React.ReactNode } {
    return typeof p === "object" && p !== null && "value" in (p as Record<string, unknown>);
}

/** className 병합 유틸 */
const cx = (...v: Array<string | undefined | null | false>) =>
    v.filter(Boolean).join(" ");

function ToneChoices({
                         value,
                         onChange,
                         children,
                     }: {
    value: ToneValue;
    onChange: (v: ToneValue) => void;
    children: React.ReactNode;
}) {
    const items = Children.toArray(children);

    return (
        <div className="tone-seg" role="group" aria-label="응답 톤 선택">
            {items.map((node, idx) => {
                // 1) React 엘리먼트인지
                if (!isValidElement(node)) return null;

                // 2) value prop이 있는지 (타입가드)
                const propsUnknown: unknown = node.props;
                if (!hasValueProp(propsUnknown)) return null;

                const val = propsUnknown.value as ToneValue;

                // 3) 첫 번째 자식 = 아이콘, 두 번째 자식 = 라벨
                const kids = Children.toArray(propsUnknown.children as React.ReactNode);
                const iconNode = kids[0] ?? null;
                const labelNode = kids[1] ?? val;

                const iconWrapped = iconNode ? (
                    <span className="tone-emoji-wrap" aria-hidden>
            {iconNode}
          </span>
                ) : null;

                const labelWrapped = isValidElement(labelNode)
                    ? cloneElement(
                        labelNode as React.ReactElement<{ className?: string }>,
                        {
                            className: cx(
                                "tone-label",
                                (labelNode as React.ReactElement<{ className?: string }>)
                                    .props.className
                            ),
                        }
                    )
                    : ( <span className="tone-label">{labelNode as React.ReactNode}</span> );

                const active = value === val;
                const labelStr =
                    typeof labelNode === "string" ? labelNode : (val as string);

                return (
                    <button
                        key={`${val}-${idx}`}
                        type="button"
                        className={`tone-pill ${active ? "active" : ""}`}
                        onClick={() => onChange(val)}
                        aria-pressed={active}
                        aria-label={`응답 톤 ${labelStr}`}
                    >
                        {iconWrapped}
                        {labelWrapped}
                    </button>
                );
            })}
        </div>
    );
}

// 자식 마크업만 전달하는 래퍼
function Tone(_props: ToneProps) {
    return <>{_props.children}</>;
}
/* --- /슬롯형 컴포넌트 --- */

const LIMITS = {
    callMe: 24,
    roleDescription: 48,
    trait: 16,
    traitsMax: 8,
    additionalContext: 400,
};

export default function UserPersonalize({
                                            open,
                                            initialValues,
                                            onClose,
                                            onSave,
                                        }: Props) {
    const shellRef = useRef<HTMLDivElement>(null);
    const firstFieldRef = useRef<HTMLInputElement>(null);
    const traitInputRef = useRef<HTMLInputElement>(null);

    // 마운트 시 초기값 세팅 (닫히면 언마운트되어 리셋됨)
    const [callMe, setCallMe] = useState(initialValues?.callMe ?? "");
    const [roleDescription, setRoleDescription] = useState(
        initialValues?.roleDescription ?? ""
    );
    const [preferredTone, setPreferredTone] = useState<
        PersonalizeValues["preferredTone"]
    >(initialValues?.preferredTone ?? "neutral");
    const [traits, setTraits] = useState<string[]>(initialValues?.traits ?? []);
    const [traitDraft, setTraitDraft] = useState("");
    const [additionalContext, setAdditionalContext] = useState(
        initialValues?.additionalContext ?? ""
    );
    const [saving, setSaving] = useState(false);

    // 오픈 시 포커스 + 페이지 스크롤 잠금
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const t = setTimeout(() => firstFieldRef.current?.focus(), 0);
        return () => {
            document.body.style.overflow = prev;
            clearTimeout(t);
        };
    }, [open]);

    // ESC/바깥 클릭 닫기
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        const onClick = (e: MouseEvent) => {
            const s = shellRef.current;
            if (s && e.target instanceof Node && !s.contains(e.target)) onClose();
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClick);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClick);
        };
    }, [onClose]);

    // traits
    const addTrait = () => {
        const v = traitDraft.trim();
        if (!v) return;
        if (v.length > LIMITS.trait) return;
        if (traits.includes(v)) return;
        if (traits.length >= LIMITS.traitsMax) return;
        setTraits((prev) => [...prev, v]);
        setTraitDraft("");
        traitInputRef.current?.focus();
    };
    const removeTrait = (t: string) => setTraits((prev) => prev.filter((x) => x !== t));
    const onTraitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTrait();
        } else if (e.key === "Backspace" && !traitDraft) {
            if (traits.length) removeTrait(traits[traits.length - 1]);
        }
    };

    const canSave =
        !!callMe.trim() &&
        callMe.length <= LIMITS.callMe &&
        roleDescription.length <= LIMITS.roleDescription &&
        additionalContext.length <= LIMITS.additionalContext &&
        !traits.some((t) => t.length > LIMITS.trait);

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            const values: PersonalizeValues = {
                callMe: callMe.trim(),
                roleDescription: roleDescription.trim(),
                preferredTone,
                traits,
                additionalContext: additionalContext.trim(),
            };
            onSave(values);
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div
            className="pmodal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pmodal-title"
        >
            <div className="pmodal-shell" ref={shellRef}>
                {/* 헤더 */}
                <div className="pmodal-header">
                    <div className="pmodal-titlewrap">
            <span className="material-icons" aria-hidden>
              tune
            </span>
                        <div>
                            <h2 id="pmodal-title">개인 맞춤 설정</h2>
                            <p className="pmodal-sub">
                                AI가 나를 어떻게 부르고, 어떤 톤/성격으로 응답할지 정해요.
                            </p>
                        </div>
                    </div>
                    <button className="iconbtn" onClick={onClose} aria-label="닫기">
            <span className="material-icons" aria-hidden>
              close
            </span>
                    </button>
                </div>

                <div className="pmodal-divider" />

                {/* 바디 */}
                <div className="pmodal-body">
                    {/* Call me */}
                    <label className="pfield">
                        <div className="pfield-top">
                            <span className="pfield-label">호칭</span>
                            <span className="pfield-hint">
                내 이름을 뭐라고 불러줄까? (최대 {LIMITS.callMe}자)
              </span>
                        </div>
                        <input
                            ref={firstFieldRef}
                            className="pinput"
                            placeholder="예: 시연님 / 팀장님 / Alex"
                            value={callMe}
                            onChange={(e) => setCallMe(e.target.value.slice(0, LIMITS.callMe))}
                        />
                    </label>

                    {/* Role description */}
                    <label className="pfield">
                        <div className="pfield-top">
                            <span className="pfield-label">역할/직무 설명</span>
                            <span className="pfield-hint">
                예: 프론트엔드 개발자 · PM · 데이터 엔지니어 (최대 {LIMITS.roleDescription}자)
              </span>
                        </div>
                        <input
                            className="pinput"
                            placeholder="예: 프론트엔드 개발자"
                            value={roleDescription}
                            onChange={(e) =>
                                setRoleDescription(e.target.value.slice(0, LIMITS.roleDescription))
                            }
                        />
                    </label>

                    {/* ✅ Preferred tone — 자유 슬롯형 사용 */}
                    <div className="pfield">
                        <div className="pfield-top">
                            <span className="pfield-label">응답 톤/말투</span>
                            <span className="pfield-hint">클릭해서 선택</span>
                        </div>

                        <ToneChoices value={preferredTone} onChange={setPreferredTone}>
                            <Tone value="neutral">
                                <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Balance%20Scale.png" alt="Balance Scale" width="25" height="25" />
                                <span>neutral</span>
                            </Tone>

                            <Tone value="friendly">
                                <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Beaming%20Face%20with%20Smiling%20Eyes.png" alt="Beaming Face with Smiling Eyes" width="25" height="25" />
                                <div>friendly</div>
                            </Tone>

                            <Tone value="polite">
                                <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Person%20Bowing.png" alt="Person Bowing" width="25" height="25" />
                                <div>polite</div>
                            </Tone>

                            <Tone value="cheerful">
                                <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Party%20Popper.png" alt="Party Popper" width="25" height="25" />
                                <div>cheerful</div>
                            </Tone>

                            {/* 🔥 외부 PNG 그대로 복붙 */}
                            <Tone value="calm">
                                <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Dove.png" alt="Dove" width="25" height="25" />
                                <div>calm</div>
                            </Tone>
                        </ToneChoices>
                    </div>

                    {/* Traits */}
                    <div className="pfield">
                        <div className="pfield-top">
                            <span className="pfield-label">성격/특성</span>
                            <span className="pfield-hint">
                최대 {LIMITS.traitsMax}개, 칩당 {LIMITS.trait}자
              </span>
                        </div>
                        <div className="traits-row">
                            {traits.map((t) => (
                                <span className="trait-chip" key={t}>
                  <span className="material-icons" aria-hidden>
                    star
                  </span>
                                    {t}
                                    <button
                                        className="chip-x"
                                        onClick={() => removeTrait(t)}
                                        aria-label={`${t} 제거`}
                                    >
                    <span className="material-icons" aria-hidden>
                      close
                    </span>
                  </button>
                </span>
                            ))}
                            <input
                                ref={traitInputRef}
                                className="trait-input"
                                placeholder="예: 간결함"
                                value={traitDraft}
                                onChange={(e) =>
                                    setTraitDraft(e.target.value.slice(0, LIMITS.trait))
                                }
                                onKeyDown={onTraitKeyDown}
                            />
                            <button type="button" className="addchip-btn" onClick={addTrait}>
                <span className="material-icons" aria-hidden>
                  add
                </span>
                                추가
                            </button>
                        </div>
                    </div>

                    {/* Additional context */}
                    <label className="pfield">
                        <div className="pfield-top">
                            <span className="pfield-label">추가 상황/배경</span>
                            <span className="pfield-hint">
                {additionalContext.length}/{LIMITS.additionalContext}
              </span>
                        </div>
                        <textarea
                            className="pinput textarea"
                            rows={4}
                            placeholder="현재 프로젝트 맥락, 팀 구성, 피해야 할 표현 등…"
                            value={additionalContext}
                            onChange={(e) =>
                                setAdditionalContext(
                                    e.target.value.slice(0, LIMITS.additionalContext)
                                )
                            }
                        />
                    </label>
                </div>

                <div className="pmodal-divider" />

                {/* 푸터 */}
                <div className="pmodal-footer">
                    <div className="preview">
                        <span className="preview-label">미리보기:</span>
                        <span className="preview-text">
              {callMe
                  ? `${callMe}에게 ${toneKorean(preferredTone)} 톤으로 응답합니다.`
                  : `호칭을 입력하면 미리보기가 표시됩니다.`}
            </span>
                    </div>
                    <div className="actions">
                        <button className="btn ghost" onClick={onClose}>
                            취소
                        </button>
                        <button
                            className="btn primary"
                            disabled={!canSave || saving}
                            onClick={handleSave}
                        >
                            {saving ? "저장 중…" : "저장"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function toneKorean(t: PersonalizeValues["preferredTone"]) {
    switch (t) {
        case "neutral":
            return "기본";
        case "friendly":
            return "친근한";
        case "polite":
            return "정중한";
        case "cheerful":
            return "유쾌한";
        case "calm":
            return "차분한";
    }
}
