"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, ArrowLeft, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Message = {
    role: "user" | "ai";
    content: string;
    imageUrl?: string;
};

export default function MedicalChatInterface() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Initial Medical Greeting - Customized based on source
        const params = new URLSearchParams(window.location.search);
        const source = params.get("source");
        const context = params.get("context");

        let initialContent = "안녕하세요. AI 스킨 코치 메디컬 상담실입니다. \n더 정확한 진료를 위해 현재 고민이신 피부 증상을 구체적으로 말씀해 주세요. (예: 여드름 부위, 색소 침착, 가려움 등)";

        if (source) {
            switch (source) {
                case "skin_mbti":
                    initialContent = `피부 MBTI 결과(${context})를 보고 오셨군요. \n내 피부 성격에 맞는 더 전문적인 관리법이나 시술 상담이 필요하신가요?`;
                    break;
                case "skin_age":
                    initialContent = `피부 나이 테스트 결과(${context})가 신경 쓰이시나요? \n피부 노화를 늦추고 탄력을 되찾는 전문적인 리프팅/안티에이징 상담을 도와드릴까요?`;
                    break;
                case "uv_score":
                    initialContent = `자외선 생활 점수(${context})를 확인하셨군요. \n이미 생긴 기미/잡티나 칙칙한 톤을 개선하기 위한 미백/색소 치료 상담이 필요하신가요?`;
                    break;
                case "cleansing_lab":
                    initialContent = `세안 루틴 점검 결과(${context})는 어떠셨나요? \n잘못된 세안으로 무너진 피부 장벽을 회복하거나, 내 피부에 딱 맞는 스킨케어 처방을 도와드릴 수 있습니다.`;
                    break;
                case "trouble_map":
                    initialContent = `트러블 지도 분석 결과(${context})를 가지고 오셨네요. \n반복되는 트러블의 근본 원인을 찾고, 흉터 없이 깨끗하게 치료하는 방법에 대해 상담해 드릴까요?`;
                    break;
            }
        }

        setMessages([{
            role: "ai",
            content: initialContent
        }]);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/medical/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages,
                }),
            });

            if (!response.ok) throw new Error("Failed to send message");

            const data = await response.json();
            setMessages(prev => [...prev, { role: "ai", content: data.content }]);
        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => [...prev, { role: "ai", content: "죄송합니다. 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Show preview immediately
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setMessages(prev => [...prev, {
                role: "user",
                content: "이미지를 전송했습니다.",
                imageUrl: base64String
            }]);
            setIsLoading(true);

            try {
                // 2. Send to Analysis API
                const response = await fetch("/api/medical/analyze-image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        image: base64String.split(",")[1], // Remove data:image/jpeg;base64,
                        mimeType: file.type,
                        history: messages
                    }),
                });

                if (!response.ok) throw new Error("Analysis failed");

                const data = await response.json();
                setMessages(prev => [...prev, { role: "ai", content: data.content }]);
            } catch (error) {
                console.error("Error:", error);
                setMessages(prev => [...prev, { role: "ai", content: "이미지 분석 중 오류가 발생했습니다." }]);
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsDataURL(file);
                </button >
            </header >

        {/* Chat Area */ }
        < div className = "flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50" >
        {
            messages.map((msg, idx) => (
                <div
                    key={idx}
                    className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""
                        } animate-slide-up`}
                >
                    {/* Avatar */}
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === "ai"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-500"
                            }`}
                    >
                        {msg.role === "ai" ? <Bot size={18} /> : <User size={18} />}
                    </div>

                    {/* Bubble */}
                    <div
                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "ai"
                            ? "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                            : "bg-blue-600 text-white rounded-tr-none"
                            }`}
                    >
                        {msg.imageUrl && (
                            <img src={msg.imageUrl} alt="Uploaded" className="max-w-full rounded-lg mb-2 border border-white/20" />
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                </div>
            ))
        }
    {
        isLoading && (
            <div className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Bot size={18} />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                </div>
            </div>
        )
    }
    <div ref={messagesEndRef} />
            </div >

        {/* Input Area */ }
        < div className = "p-4 bg-white border-t border-slate-200" >
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="이미지 업로드"
                >
                    <Plus size={20} />
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="증상을 상세히 입력하세요..."
                    className="w-full pl-4 pr-12 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 text-slate-800"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    <Send size={18} />
                </button>
            </form>
            </div >
        </div >
    );
}
