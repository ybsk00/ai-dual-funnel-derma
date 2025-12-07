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

        let initialContent = "안녕하세요. AI 스마일 덴탈케어 상담실입니다. \n더 정확한 진료를 위해 현재 불편하신 치아/구강 증상을 구체적으로 말씀해 주세요. (예: 통증 부위, 시작된 시기, 악화 요인 등)";

        if (source) {
            switch (source) {
                case "smile_test":
                    initialContent = `스마일 인상 체크 결과(${context})를 보고 오셨군요. \n치아 교정이나 미백, 잇몸 성형 등 더 아름다운 미소를 위한 전문 상담을 도와드릴까요?`;
                    break;
                case "breath_mbti":
                    initialContent = `입냄새 MBTI 결과(${context})에 대해 더 궁금하신가요? \n구취의 근본적인 원인(위장, 구강 건조 등)을 찾고 치료하는 방법에 대해 안내해 드릴 수 있습니다.`;
                    break;
                case "teeth_age":
                    initialContent = `치아 나이 테스트 결과(${context})를 확인하셨군요. \n현재 치아 상태를 정확히 진단하고, 노화를 늦추는 맞춤형 관리법이나 치료가 필요한지 상담해 드릴까요?`;
                    break;
                case "stain_risk":
                    initialContent = `커피 착색 위험도(${context})가 걱정되시나요? \n치아 미백이나 착색 예방을 위한 스케일링, 생활 습관 교정에 대해 전문적인 조언을 드릴 수 있습니다.`;
                    break;
                case "kids_mission":
                    initialContent = `우리 아이 양치 히어로 미션(${context})을 완료했군요! \n아이의 충치 예방, 불소 도포, 올바른 양치 습관 교육에 대해 부모님과 상담을 진행해 드릴까요?`;
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
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans max-w-md mx-auto shadow-2xl overflow-hidden border-x border-slate-200">
            {/* Medical Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center">
                    <Link href="/medical/dashboard" className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="ml-2">
                        <h1 className="text-lg font-bold text-slate-800">치과 AI 상담 (Dental Chat)</h1>
                        <p className="text-xs text-blue-600 flex items-center font-medium">
                            <span className="w-2 h-2 rounded-full bg-blue-600 mr-1"></span>
                            치과 전문의 감독 하에 운영
                        </p>
                    </div>
                </div>
                <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <FileText size={20} />
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
                {messages.map((msg, idx) => (
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
                ))}
                {isLoading && (
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
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
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
            </div>
        </div>
    );
}
