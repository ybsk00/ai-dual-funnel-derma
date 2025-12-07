import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { image, mimeType, history } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Use Gemini 1.5 Flash for multimodal analysis (fast & efficient)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
[역할]
당신은 "치과 AI 분석가"입니다.
사용자가 업로드한 이미지를 분석하여 객관적인 특징을 설명하고, 치과적 관점에서 의심되는 상태를 조심스럽게 제시하세요.

[분석 가이드]
1. **객관적 관찰**: 이미지에서 보이는 치아 색상, 배열, 잇몸 상태(부기, 발적), 치석 여부 등을 있는 그대로 서술하세요.
2. **치과적 연관성**: 해당 특징이 치과적으로 어떤 상태(예: 충치, 치은염, 치석, 부정교합, 착색 등)와 연관될 수 있는지 설명하세요.
3. **주의사항**: "진단"하지 마세요. "가능성이 있습니다", "의심됩니다" 등의 추측성 표현을 사용하세요. 반드시 "정확한 진단은 내원하여 원장님의 진료가 필요합니다"라고 덧붙이세요.

[답변 형식]
- **관찰 소견**: (2~3문장)
- **의심되는 상태**: (1~2문장)
- **권고 사항**: (내원 권유)

[대화 내역]
${history.map((msg: any) => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`).join("\n")}
`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: image,
                    mimeType: mimeType || "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
            role: "ai",
            content: text.trim()
        });

    } catch (error) {
        console.error("Image Analysis API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
