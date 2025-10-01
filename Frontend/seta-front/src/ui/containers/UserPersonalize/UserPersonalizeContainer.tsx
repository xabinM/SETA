import {useEffect, useState} from "react";
import {createPortal} from "react-dom";
import UserPersonalize, {type PersonalizeValues} from "@/ui/components/Modal/UserPersonalize/UserPersonalize";
import {
    getMyUserSetting,
    type UserSettingServer,
    createMyUserSetting,
    patchMyUserSetting,
    type UserSettingCreatePayload,
} from "@/features/user-setting/api";
import {parseTraits, joinTraits} from "@/features/user-setting/normalize";
import CustomToast from "@/ui/components/Toast/CustomToast";

const UI2CODE = {
    "기본": "neutral",
    "친근한": "friendly",
    "정중한": "polite",
    "유쾌한": "cheerful",
    "차분한": "calm",
    "냉소적인": "cynical"
} as const;

type ToneUI = keyof typeof UI2CODE;

const CODE2UI: Record<string, ToneUI> = {
    neutral: "기본",
    friendly: "친근한",
    polite: "정중한",
    cheerful: "유쾌한",
    calm: "차분한",
    cynical: "냉소적인"
};

function toUI(v?: string | null): ToneUI {
    if (!v) return "기본";
    if ((UI2CODE as Record<string, string>)[v]) return v as ToneUI;
    const key = v.toLowerCase?.() ?? v;
    return CODE2UI[key] ?? "기본";
}

function toCode(v: ToneUI): string {
    return UI2CODE[v] ?? "neutral";
}

function mapServerToValues(data: UserSettingServer | null): Partial<PersonalizeValues> | undefined {
    if (!data) return undefined;
    return {
        callMe: data.callMe ?? "",
        roleDescription: data.roleDescription ?? "",
        preferredTone: toUI(data.preferredTone) as PersonalizeValues["preferredTone"],
        traits: parseTraits(data.traits),
        additionalContext: data.additionalContext ?? "",
    };
}

function mapValuesToCreatePayload(v: PersonalizeValues): UserSettingCreatePayload {
    return {
        callMe: v.callMe.trim(),
        roleDescription: v.roleDescription.trim(),
        preferredTone: toCode(v.preferredTone as ToneUI),
        traits: joinTraits(v.traits),
        additionalContext: v.additionalContext.trim(),
    };
}

function buildDiffPayload(
    next: PersonalizeValues,
    prev: Partial<PersonalizeValues> | undefined
): Partial<UserSettingCreatePayload> {
    const diff: Partial<UserSettingCreatePayload> = {};
    const prevCallMe = (prev?.callMe ?? "").trim();
    const prevRole = (prev?.roleDescription ?? "").trim();
    const prevToneUI = (prev?.preferredTone ?? "기본") as ToneUI;
    const prevTraitsStr = joinTraits(prev?.traits ?? []);
    const prevCtx = (prev?.additionalContext ?? "").trim();
    const nextCallMe = next.callMe.trim();
    const nextRole = next.roleDescription.trim();
    const nextToneUI = next.preferredTone as ToneUI;
    const nextTraitsStr = joinTraits(next.traits);
    const nextCtx = next.additionalContext.trim();

    if (nextCallMe !== prevCallMe) diff.callMe = nextCallMe;
    if (nextRole !== prevRole) diff.roleDescription = nextRole;
    if (nextToneUI !== prevToneUI) diff.preferredTone = toCode(nextToneUI); // 변경시에만 영문 코드로
    if (nextTraitsStr !== prevTraitsStr) diff.traits = nextTraitsStr;
    if (nextCtx !== prevCtx) diff.additionalContext = nextCtx;

    return diff;
}

export default function UserPersonalizeContainer({
                                                     open,
                                                     onClose,
                                                 }: {
    open: boolean;
    onClose: () => void;
}) {
    const [initialValues, setInitialValues] = useState<Partial<PersonalizeValues> | undefined>(undefined);
    const [ready, setReady] = useState(false);
    const [hasSetting, setHasSetting] = useState(false);
    const [toast, setToast] = useState<{ message: string; description?: string } | null>(null);

    useEffect(() => {
        if (!open) {
            setReady(false);
            return;
        }
        (async () => {
            try {
                const data = await getMyUserSetting();
                setInitialValues(mapServerToValues(data));
                setHasSetting(!!data);
            } catch (e) {
                console.error("유저 설정 조회 실패:", e);
                setInitialValues(undefined);
                setHasSetting(false);
            } finally {
                setReady(true);
            }
        })();
    }, [open]);

    const handleSave = async (values: PersonalizeValues) => {
        try {
            if (hasSetting) {
                const diff = buildDiffPayload(values, initialValues);
                if (Object.keys(diff).length === 0) {
                    setToast({message: "변경사항 없음", description: "수정된 내용이 없습니다."});
                    return;
                }
                await patchMyUserSetting(diff);
            } else {
                const payload = mapValuesToCreatePayload(values);
                await createMyUserSetting(payload);
                setHasSetting(true);
            }

            setInitialValues(values);
            setToast({message: "저장 완료", description: "개인 맞춤 설정이 적용되었습니다."});
            requestAnimationFrame(() => onClose());
        } catch (e) {
            console.error("설정 저장 실패:", e);
            setToast({message: "저장 실패", description: "잠시 후 다시 시도해 주세요."});
        }
    };

    return (
        <>
            {open && ready && (
                <UserPersonalize
                    open={true}
                    onClose={onClose}
                    onSave={handleSave}
                    initialValues={initialValues ?? {}}
                />
            )}

            {toast &&
                createPortal(
                    <CustomToast
                        message={toast.message}
                        description={toast.description}
                        duration={2000}
                        onClose={() => setToast(null)}
                    />,
                    document.body
                )}
        </>
    );
}
