import { generateText } from "@/lib/ai/client";

export type SummaryResult = {
    pattern_tags: string[];
    rhythm_score: number;
    summary_text: string;
    main_concern: string;
};

export async function generateSummary(history: any[], topic: string): Promise<SummaryResult> {
    const systemPrompt = `
[역할]
당신은 "치과 AI 헬스케어 분석가"입니다.
사용자와 AI의 대화 내역을 분석하여, 사용자의 구강 건강 상태를 요약하고 '리듬 점수'를 산출해주세요.

[분석 주제]
${topic}

[출력 형식 (JSON Only)]
반드시 아래 JSON 형식으로만 출력하세요. 마크다운이나 추가 설명 금지.
{
  "pattern_tags": ["태그1", "태그2", "태그3"], // 사용자의 증상/패턴을 나타내는 핵심 키워드 3~5개 (예: "충치위험", "잇몸염증", "치석", "착색", "시린이")
  "rhythm_score": 75, // 0~100점 사이의 정수. (100점: 매우 건강, 0점: 매우 심각). 대화 내용을 바탕으로 추정.
  "summary_text": "사용자는 최근 양치 시 잇몸 출혈과 찬물 섭취 시 시린 증상을 호소합니다. 치석 침착으로 인한 초기 치은염이 의심되며, 정기적인 스케일링과 잇몸 관리가 필요한 상태입니다.", // 2~3문장 요약
  "main_concern": "잇몸 출혈 및 시린 이" // 주호소 (가장 불편한 점)
}

[채점 기준 (Rhythm Score)]
- 90~100: 생활 습관이 규칙적이고 컨디션이 좋음.
- 70~89: 약간의 불편함이 있으나 생활 관리로 개선 가능.
- 50~69: 명확한 증상이 있고 일상에 지장을 줌. (적극적 관리 필요)
- 0~49: 심각한 증상, 통증, 또는 만성적인 불균형 상태. (전문가 진료 필수)

[대화 내역]
${history.map((msg: any) => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`).join("\n")}
`;

    try {
        const response = await generateText(systemPrompt, "healthcare");
        // Clean up response if it contains markdown code blocks
        const cleanedResponse = response.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedResponse);
    } catch (error) {
        console.error("Summary Generation Error:", error);
        // Fallback in case of error
        return {
            pattern_tags: ["분석 실패"],
            rhythm_score: 50,
            summary_text: "분석 중 오류가 발생했습니다.",
            main_concern: "알 수 없음"
        };
    }
}
