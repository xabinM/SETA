package com.AIce.Backend.chat.service;

import com.AIce.Backend.chat.contracts.FilterResultV1;
import com.AIce.Backend.domain.usersetting.entity.UserSetting;
import com.AIce.Backend.global.enums.IntentType;
import com.AIce.Backend.global.enums.PreferredTone;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import static java.util.Map.entry;

@Service
public class DropResponder {
    // intent → tone → 3가지 후보
    private static final Map<IntentType, Map<PreferredTone, List<String>>> RESP = build();

    public String buildText(FilterResultV1 fr, Optional<UserSetting> userSettingOpt) {
        IntentType intent = mapReason(fr);
        Map<PreferredTone, List<String>> byTone = RESP.getOrDefault(intent, RESP.get(IntentType.UNKNOWN));

        // 톤이 비어있으면 폴백
        PreferredTone tone = userSettingOpt
                .map(UserSetting::getPreferredTone)
                .orElse(PreferredTone.POLITE);

        List<String> candidates = byTone.getOrDefault(tone, byTone.get(PreferredTone.POLITE));
        return pickOne(candidates);
    }

    private static IntentType mapReason(FilterResultV1 fr) {
        String rt = fr.getDecision() != null ? fr.getDecision().getReason_type() : null;
        if (rt == null) return IntentType.UNKNOWN;
        rt = rt.toLowerCase(Locale.ROOT);

        // reason_type 표준화 매핑
        return switch (rt) {
            case "thank" -> IntentType.THANK;
            case "apology" -> IntentType.APOLOGY;
            case "goodbye" -> IntentType.GOODBYE;
            case "greeting" -> IntentType.GREETING;
            case "call_only" -> IntentType.CALL_ONLY;
            case "reaction_only" -> IntentType.REACTION_ONLY;
            case "no_meaning" -> IntentType.NO_MEANING;
            case "connector_filler" -> IntentType.CONNECTOR_FILLER;
            default -> IntentType.UNKNOWN;
        };
    }

    private static String pickOne(List<String> xs) {
        if (xs == null || xs.isEmpty()) return "확인했습니다.";
        int i = ThreadLocalRandom.current().nextInt(xs.size()); // 0,1,2 중 하나
        return xs.get(i);
    }

    private static Map<IntentType, Map<PreferredTone, List<String>>> build() {
        // 헬퍼
        var P = PreferredTone.NEUTRAL;
        var C = PreferredTone.FRIENDLY;
        var F = PreferredTone.POLITE;
        var H = PreferredTone.CHEERFUL;
        var M = PreferredTone.CALM;
        var W = PreferredTone.CYNICAL;

        Map<IntentType, Map<PreferredTone, List<String>>> m = new EnumMap<>(IntentType.class);

        // 감사(THANK)
        m.put(IntentType.THANK, Map.ofEntries(
                entry(P, List.of("별말씀을요. 도움이 되었다니 기쁩니다.", "천만에요, 언제든 말씀해주세요.", "도움이 되었다면 다행입니다.")),
                entry(C, List.of("에이~ 뭐 이런 거 가지고 😆", "언제든지 불러줘! 🙌", "나도 고마워 💙")),
                entry(F, List.of("천만에요. 도움이 되어 다행입니다.", "편히 말씀해주셔서 감사합니다.", "언제든 도움이 필요하면 말씀해주세요.")),
                entry(H, List.of("와! 고마워 해주셔서 제가 더 기뻐요 🎉", "도움이 됐다니 뿌듯하네요 😊", "또 필요하면 언제든 불러주세요! ✨")),
                entry(M, List.of("천만에요. 도움이 되셨다니 다행입니다.", "네, 언제든 편히 말씀 주세요.", "필요하실 때 다시 요청하셔도 됩니다.")),
                entry(W, List.of("고맙단 말은 좋지만, 자주 듣다 보니 익숙하네 😏", "또 고맙다니, 이번엔 진심이지? 🙃", "그래, 뭐 나도 나쁘진 않았어."))
        ));

        // 사과(APOLOGY)
        m.put(IntentType.APOLOGY, Map.ofEntries(
                entry(P, List.of("괜찮습니다. 너무 걱정하지 마세요.", "신경 쓰지 않으셔도 됩니다.", "이해합니다. 괜찮아요.")),
                entry(C, List.of("에이~ 괜찮아, 신경 쓰지 마! 😊", "오히려 고마워, 사과해줘서!", "아무 일도 아니야~ 걱정 붙들어매! 🙌")),
                entry(F, List.of("사과해 주셔서 감사합니다. 괜찮습니다.", "충분히 이해합니다. 걱정하지 않으셔도 됩니다.", "괜찮습니다. 마음 편히 가지세요.")),
                entry(H, List.of("괜찮아요! 다 잘 될 거예요 🌸", "사과해 줘서 고마워요 😊", "신경 쓰지 말고 기분 좋게 지내요 ✨")),
                entry(M, List.of("괜찮습니다. 마음에 두지 않으셔도 됩니다.", "이해합니다. 천천히 생각하셔도 괜찮습니다.", "사과하실 필요 없어요. 괜찮습니다.")),
                entry(W, List.of("이제 와서 사과해도 뭐 달라지진 않죠 😅", "괜찮아, 뭐 항상 그러더라…", "사과는 했으니 됐다고 치자."))
        ));

        // 작별/마무리(GOODBYE)
        m.put(IntentType.GOODBYE, Map.ofEntries(
                entry(P, List.of("네, 안녕히 계세요.", "다음에 또 뵙겠습니다.", "좋은 하루 보내세요.")),
                entry(C, List.of("잘 가~ 또 보자! 👋", "바이바이 😄 즐거운 하루 보내!", "내일 또 얘기하자 ✨")),
                entry(F, List.of("함께 이야기 나눠 주셔서 감사합니다. 안녕히 계세요.", "좋은 하루 되시길 바랍니다. 다음에 뵙겠습니다.", "오늘 수고 많으셨습니다. 편안한 시간 보내세요.")),
                entry(H, List.of("안녕~! 오늘도 즐거웠어 🎶", "내일 또 만나요! 🌟", "좋은 하루 되세요~ 😍")),
                entry(M, List.of("그럼, 오늘은 이만 인사드리겠습니다.", "평안한 하루 보내시길 바랍니다.", "다음에 다시 이야기 나누도록 하죠.")),
                entry(W, List.of("또 가는 거야? 뭐, 그럴 줄 알았지 😏", "벌써 끝? 나만 아쉽네…", "그래, 잘 가. 잊지 마라~ 🙃"))
        ));

        // 인사(GREETING)
        m.put(IntentType.GREETING, Map.ofEntries(
                entry(P, List.of("안녕하세요. 오늘도 궁금한 게 있으신가요?", "반갑습니다. 무엇을 도와드릴까요?", "안녕하세요, 잘 지내셨나요?")),
                entry(C, List.of("안녕~ 😄 오늘 기분 어때?", "오랜만이야! 잘 지냈어?", "하이하이 🙌 뭐 하고 있었어?")),
                entry(F, List.of("안녕하십니까. 오늘 하루도 평안하시길 바랍니다.", "만나 뵙게 되어 반갑습니다. 어떤 도움을 드릴까요?", "안녕하세요, 기분 좋은 하루 보내고 계신가요?")),
                entry(H, List.of("안녕! 오늘도 활기차게 시작해볼까요? ☀️", "오! 반가워요 🎶", "하이~ 좋은 하루 되길 바라요 🌸")),
                entry(M, List.of("안녕하세요. 오늘 하루도 차분하게 시작해볼까요?", "반갑습니다. 어떤 이야기를 나누고 싶으신가요?", "안녕히 오셨습니다. 편안히 말씀해주세요.")),
                entry(W, List.of("또 인사네… 할 말은 있지? 🤔", "안녕, 오늘도 그냥 인사만 하고 끝낼 거야?", "오랜만이라니, 내가 보고 싶었구나? 😏"))
        ));

        // 이름만 호출(CALL_ONLY)
        m.put(IntentType.CALL_ONLY, Map.ofEntries(
                entry(P, List.of("네, 안녕하세요! 무엇을 도와드릴까요?", "부르셨나요? 말씀해주세요.", "네, 여기 있습니다.")),
                entry(C, List.of("불렀어? 😊 뭐 도와줄까?", "오! 나 여기 있어 ✨", "응 나 불렀지? 😆")),
                entry(F, List.of("네, 불러주셔서 감사합니다. 무엇을 도와드릴까요?", "네. 말씀해 주시겠어요?", "안녕하세요. 필요하신 부분이 있으신가요?")),
                entry(H, List.of("짜잔! 저 여기 있어요 🎉", "불러주셨군요! 😍", "등장! 뭐든 물어보세요 ✨")),
                entry(M, List.of("네, 부르셨군요. 무엇을 말씀해 주시겠어요?", "여기 있습니다. 편하게 말씀해주세요.", "언제든 준비되어 있습니다.")),
                entry(W, List.of("또 찾으셨군요… 뭐가 궁금하세요? 🙃", "네, 안 부르면 심심할 뻔했네요.", "이번엔 무슨 일이죠? 😏"))
        ));

        // 감탄사만(RESPONSE_ONLY)
        m.put(IntentType.REACTION_ONLY, Map.ofEntries(
                entry(P, List.of("네, 그렇게 느끼셨군요.", "그렇군요.", "흥미로운 반응이에요.")),
                entry(C, List.of("오! 신기하지? 😆", "헉! 놀랐구나~", "와, 대박이지? 🤩")),
                entry(F, List.of("그렇게 느끼실 수 있습니다.", "놀라실 만한 부분이네요.", "저도 그렇게 느낍니다. 더 필요하신 부분 있으신가요?")),
                entry(H, List.of("와~ 멋지죠? 🎉", "헉! 정말 재밌네요 😍", "오~ 기대돼요 ✨")),
                entry(M, List.of("네, 놀라셨군요. 천천히 살펴보면 괜찮습니다.", "그렇군요. 차분히 볼 수 있어요.", "네, 이해했습니다.")),
                entry(W, List.of("뭐 그렇게 놀랄 일도 아닌데… 🙃", "와, 매번 똑같은 반응이네 😏", "그래그래, 놀랄 만하지 뭐."))
        ));

        // 의미 없음(NO_MEANING)
        m.put(IntentType.NO_MEANING, Map.ofEntries(
                entry(P, List.of("잘 못 알아들었어요.", "혹시 다시 말씀해 주시겠어요?", "이해하기 어려워요.")),
                entry(C, List.of("엥? 뭐라고 한 거야? 😅", "오타 난 것 같아~ 다시 말해줄래? 🙃", "음… 무슨 뜻이지?")),
                entry(F, List.of("말씀을 이해하기가 어렵습니다.", "다시 한번 정확히 말씀해 주시겠습니까?", "죄송하지만 의미를 파악하기 힘듭니다.")),
                entry(H, List.of("오잉? 무슨 말인지 궁금해요 🤔", "헉, 다시 알려주면 좋겠어요!", "오타인 것 같은데 한번 더 말해줄래요? ✨")),
                entry(M, List.of("조금 더 명확히 말씀해 주시면 좋겠습니다.", "이해하기 어려운 부분이 있어요.", "천천히 다시 말씀해 주시겠어요?")),
                entry(W, List.of("무슨 암호라도 쓰신 건가요? 😏", "나도 해독기는 없는데… 🙃", "이건… 글자 맞아?"))
        ));

        // 연결어/머뭇거림(CONNECTOR_FILLER)
        m.put(IntentType.CONNECTOR_FILLER, Map.ofEntries(
                entry(P, List.of("이어서 말씀해 주세요.", "네, 듣고 있어요.", "계속 말씀해 주시면 됩니다.")),
                entry(C, List.of("말 시작했네 😆 이어서 말해줘!", "오, 뭔가 말하려는 거구나 🙌", "음~ 듣고 있어 👂")),
                entry(F, List.of("이어서 설명해 주시겠습니까?", "말씀을 계속 이어가 주셔도 됩니다.", "네, 준비되어 있습니다. 계속 말씀해 주세요.")),
                entry(H, List.of("오! 뭔가 흥미로운 얘기 시작인가요? 🎉", "자자~ 이어서 말해주세요 ✨", "음~ 기대돼요 😍")),
                entry(M, List.of("네, 천천히 말씀 이어가셔도 괜찮습니다.", "이어서 차분히 얘기해 주셔도 됩니다.", "네, 듣고 있습니다. 계속 말씀해주세요.")),
                entry(W, List.of("또 서론 길게 시작하는 거 아냐? 😏", "본론은 언제 나올까… 🙃", "알았어, 계속 들어볼게."))
        ));

        // 폴백(UNKNOWN)
        m.put(IntentType.UNKNOWN, Map.ofEntries(
                entry(P, List.of("요청이 모호해 응답 생성을 생략했습니다.", "필요하신 내용을 조금만 더 구체적으로 알려주세요.", "다음 지시를 부탁드립니다.")),
                entry(C, List.of("음… 뭐라고 해야 할까? 😅", "조금만 더 자세히 말해줄래?", "어떤 걸 도와주면 될까?")),
                entry(F, List.of("요청이 불명확하여 답변 생성을 생략합니다.", "구체적인 요구사항을 알려주시면 감사하겠습니다.", "필요 정보를 명확히 해주시면 진행하겠습니다.")),
                entry(H, List.of("이해했어요! 조금만 더 알려주면 바로 도와드릴게요 ✨", "좋아요, 방향만 더 잡아줘요 😊", "조금만 더 구체화하면 금방 해결해요!")),
                entry(M, List.of("요청이 다소 모호합니다. 추가 설명을 부탁드립니다.", "천천히 설명해 주셔도 괜찮습니다.", "필요 사항을 정리해 주시면 돕겠습니다.")),
                entry(W, List.of("암호문 퀴즈인가요? 😏", "내가 점쟁이는 아니라서… 🙃", "힌트 조금만 더 주시죠?"))
        ));

        return m;
    }
}
