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

function mapServerToValues(
    data: UserSettingServer | null
): Partial<PersonalizeValues> | undefined {
    if (!data) return undefined;
    return {
        callMe: data.callMe ?? "",
        roleDescription: data.roleDescription ?? "",
        preferredTone: (data.preferredTone as PersonalizeValues["preferredTone"]) ?? "기본",
        traits: parseTraits(data.traits),
        additionalContext: data.additionalContext ?? "",
    };
}

function mapValuesToCreatePayload(v: PersonalizeValues): UserSettingCreatePayload {
    return {
        callMe: v.callMe.trim(),
        roleDescription: v.roleDescription.trim(),
        preferredTone: v.preferredTone,
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
    const prevTone = prev?.preferredTone ?? "기본";
    const prevTraits = joinTraits(prev?.traits ?? []);
    const prevCtx = (prev?.additionalContext ?? "").trim();

    if (next.callMe.trim() !== prevCallMe) diff.callMe = next.callMe.trim();
    if (next.roleDescription.trim() !== prevRole) diff.roleDescription = next.roleDescription.trim();
    if (next.preferredTone !== prevTone) diff.preferredTone = next.preferredTone;
    if (joinTraits(next.traits) !== prevTraits) diff.traits = joinTraits(next.traits);
    if (next.additionalContext.trim() !== prevCtx) diff.additionalContext = next.additionalContext.trim();

    return diff;
}

export default function UserPersonalizeContainer({
                                                     open,
                                                     onClose,
                                                 }: {
    open: boolean;
    onClose: () => void;
}) {
    const [initialValues, setInitialValues] =
        useState<Partial<PersonalizeValues> | undefined>(undefined);
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

    if (!open) return null;
    if (!ready) return null;

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
            onClose();
        } catch (e) {
            console.error("설정 저장 실패:", e);
            setToast({message: "저장 실패", description: "잠시 후 다시 시도해 주세요."});
        }
    };

    return (
        <>
            <UserPersonalize
                open={true}
                onClose={onClose}
                onSave={handleSave}
                initialValues={initialValues}
            />

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
