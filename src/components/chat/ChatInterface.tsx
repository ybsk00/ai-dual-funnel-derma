"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, ArrowLeft, Paperclip, ArrowUp, Sun, Moon, Activity, Heart, Baby, Calendar } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ConditionReport from "@/components/healthcare/ConditionReport";
import ReservationModal from "@/components/medical/ReservationModal";
import { createClient } from "@/lib/supabase/client";
import SmileResultCard from "@/components/healthcare/results/SmileResultCard";
import MbtiResultCard from "@/components/healthcare/results/MbtiResultCard";
import TeethAgeCard from "@/components/healthcare/results/TeethAgeCard";
import StainCard from "@/components/healthcare/results/StainCard";
import KidsHeroCard from "@/components/healthcare/results/KidsHeroCard";

type Message = {
    role: "user" | "ai";
    content: string;
    result?: any; // For structured results
};

type ChatInterfaceProps = {
    isEmbedded?: boolean;
    isLoggedIn?: boolean;
};

// Flow Definitions
const FLOWS: any = {
    smile_test: {
        title: "AI 스마일 인상체크",
        initialMessage: "당신의 미소 사진을 올려주시면, AI가 인상을 분석해 드려요! (재미용)",
        steps: [
            { id: "image_upload", question: "사진을 업로드해주세요." }
        ]
    },
    breath_mbti: {
        title: "입냄새 MBTI",
        initialMessage: "몇 가지 질문으로 나의 입냄새 유형을 알아볼까요?",
        steps: [
            { id: "q1", question: "평소 양치질은 하루에 몇 번 하시나요?" },
            { id: "q2", question: "치실이나 치간칫솔은 사용하시나요?" },
            { id: "q3", question: "혀 클리너도 사용하시나요?" },
            { id: "q4", question: "입이 자주 마르다고 느끼시나요?" },
            { id: "q5", question: "커피나 탄산음료를 자주 드시나요?" }
        ]
    },
    teeth_age: {
        title: "치아 나이 테스트",
        initialMessage: "실제 나이와 치아 나이는 다를 수 있어요. 테스트를 시작할까요?",
        steps: [
            { id: "age_input", question: "현재 나이가 어떻게 되시나요?" },
            { id: "q1", question: "이가 시린 증상이 있나요?" },
            { id: "q2", question: "잇몸에서 피가 난 적이 있나요?" },
            { id: "q3", question: "단단한 음식을 씹을 때 불편한가요?" }
        ]
    },
    stain_risk: {
        title: "커피 착색 카드",
        initialMessage: "평소 커피 습관을 알려주시면 착색 위험도를 알려드려요.",
        steps: [
            { id: "q1", question: "하루에 커피를 몇 잔 드시나요?" },
            { id: "q2", question: "커피를 마신 후 바로 양치를 하시나요?" }
        ]
    },
    kids_mission: {
        title: "양치 히어로",
        initialMessage: "안녕! 나는 치아를 지키는 닥터 래빗이야. 오늘 양치 미션을 완료했니?",
        steps: [
            { id: "mission_check", question: "오늘 아침, 점심, 저녁 양치를 모두 했나요?" }
        ]
    }
};

export default function ChatInterface(props: ChatInterfaceProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const topic = searchParams.get("topic") || "resilience";
    const isDentalFlow = Object.keys(FLOWS).includes(topic);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [turnCount, setTurnCount] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginModalContent, setLoginModalContent] = useState({
        title: "상세한 상담이 필요하신가요?",
        desc: "더 정확한 건강 분석과 맞춤형 조언을 위해<br />로그인이 필요합니다."
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [flowState, setFlowState] = useState({
        stepIndex: 0,
        answers: {} as any,
        image: null as string | null
    });

    // Fetch Patient ID if logged in
    const [patientId, setPatientId] = useState<number | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchPatientId = async () => {
            if (props.isLoggedIn) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: patient } = await supabase
                        .from('patients')
                        .select('id')
                        .eq('user_id', user.id)
                        .maybeSingle();
                    if (patient) {
                        setPatientId(patient.id);
                    }
                }
            }
        };
        fetchPatientId();
    }, [props.isLoggedIn, supabase]);

    // Welcome message based on topic
    useEffect(() => {
        let welcomeMsg = "안녕하세요, AI 스마일 덴탈케어입니다. 궁금한 점을 체크해 보세요.";

        if (isDentalFlow) {
            welcomeMsg = FLOWS[topic].initialMessage;
        }

        setMessages([{ role: "ai", content: welcomeMsg }]);
        setFlowState({ stepIndex: 0, answers: {}, image: null });
    }, [topic, isDentalFlow]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleImageClick = () => {
        if (["smile_test", "stain_risk"].includes(topic) || props.isLoggedIn) {
            fileInputRef.current?.click();
            return;
        }

        setLoginModalContent({
            title: "이미지 분석 기능",
            desc: "이미지 분석을 통한 건강 상담은<br />로그인 후 이용 가능합니다."
        });
        setShowLoginModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("이미지 파일만 업로드 가능합니다.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;

            if (isDentalFlow) {
                setFlowState(prev => ({ ...prev, image: base64String }));
                setMessages(prev => [...prev, { role: "user", content: "📷 [사진이 업로드되었습니다]" }]);

                if (topic === "smile_test") {
                    handleDentalFlow("📷 [사진 분석 요청]");
                }
            } else {
                setMessages(prev => [...prev, { role: "user", content: "📷 [사진 전송됨]" }]);
            }
        };
        reader.readAsDataURL(file);
    };

    const [showReservationModal, setShowReservationModal] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() && !flowState.image) return;
        if (isLoading) return;

        const userMessage = input.trim() || (flowState.image ? "📷 [사진 분석 요청]" : "");
        setInput("");

        const newTurnCount = turnCount + 1;
        setTurnCount(newTurnCount);
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);

        if (isDentalFlow) {
            await handleDentalFlow(userMessage);
            return;
        }

        if (!props.isLoggedIn && [3, 7].includes(newTurnCount)) {
            setLoginModalContent({
                title: "상세한 상담이 필요하신가요?",
                desc: "더 정확한 건강 분석과 맞춤형 조언을 위해<br />로그인이 필요합니다."
            });
            setShowLoginModal(true);
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages,
                    topic
                }),
            });

            if (!response.ok) throw new Error("Failed to send message");

            const data = await response.json();
            let aiContent = data.content;

            if (aiContent.includes("[RESERVATION_TRIGGER]")) {
                aiContent = aiContent.replace("[RESERVATION_TRIGGER]", "").trim();
                setShowReservationModal(true);
            }

            setMessages(prev => [...prev, { role: "ai", content: aiContent }]);

            if (!props.isLoggedIn && data.content.includes("로그인이 필요합니다")) {
                setLoginModalContent({
                    title: "상세한 상담이 필요하신가요?",
                    desc: "더 정확한 건강 분석과 맞춤형 조언을 위해<br />로그인이 필요합니다."
                });
                setShowLoginModal(true);
            }
        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => [...prev, { role: "ai", content: "죄송합니다. 잠시 문제가 발생했습니다. 다시 시도해주세요." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDentalFlow = async (userMessage: string) => {
        setIsLoading(true);

        const currentFlow = FLOWS[topic];
        // Determine current step based on flowState.stepIndex
        // Note: stepIndex 0 is usually the start, but we might want to track which question we are ON.
        // Let's assume stepIndex corresponds to the index in the steps array.

        const currentStepIdx = flowState.stepIndex;
        const currentStep = currentFlow.steps[currentStepIdx];

        // Store answer for the *current* step (which the user just answered)
        // If stepIndex is 0, it means we are answering the first question (or initial prompt).
        // Actually, the initial message is displayed, then user answers.
        // So userMessage is the answer to the *previous* question (or initial).

        // Logic:
        // 1. User answers.
        // 2. We store that answer.
        // 3. We check if there are more steps.
        // 4. If yes, we ask the NEXT question via API (for empathy).
        // 5. If no, we submit all answers for final analysis.

        const updatedAnswers = { ...flowState.answers, [`step_${currentStepIdx}`]: userMessage };

        // Calculate next step index
        const nextStepIdx = currentStepIdx + 1;
        const totalSteps = currentFlow.steps.length;
        const isComplete = (topic === 'smile_test' && (flowState.image || userMessage.includes("사진"))) ||
            (nextStepIdx >= totalSteps);

        setFlowState(prev => ({
            ...prev,
            stepIndex: nextStepIdx,
            answers: updatedAnswers
        }));

        if (isComplete) {
            // Final Analysis
            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        flow_type: topic,
                        answers: updatedAnswers,
                        image: flowState.image,
                        is_final: true // Flag for final analysis
                    }),
                });

                if (!response.ok) throw new Error("Failed to analyze");

                const data = await response.json();
                setMessages(prev => [...prev, {
                    role: "ai",
                    content: data.content,
                    result: data.result
                }]);

            } catch (error) {
                console.error("Error:", error);
                setMessages(prev => [...prev, { role: "ai", content: "분석 중 오류가 발생했습니다." }]);
            }
        } else {
            // Intermediate Step: Ask AI to generate empathy + next question
            const nextStep = currentFlow.steps[nextStepIdx];
            const nextQuestion = nextStep.question;

            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        flow_type: topic,
                        answers: updatedAnswers, // Pass all answers so far
                        current_answer: userMessage, // The latest answer to react to
                        next_question: nextQuestion, // The question AI should ask next
                        is_final: false
                    }),
                });

                if (!response.ok) throw new Error("Failed to get next question");

                const data = await response.json();
                setMessages(prev => [...prev, { role: "ai", content: data.content }]);

            } catch (error) {
                console.error("Error:", error);
                // Fallback if API fails
                setMessages(prev => [...prev, { role: "ai", content: nextQuestion }]);
            }
        }

        setIsLoading(false);
    };

    // Report Logic
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    if (showReport && reportData) {
        return <ConditionReport result={reportData} onRetry={() => setShowReport(false)} />;
    }

    const modules = [
        {
            id: "smile_test",
            label: "스마일 인상체크",
            desc: "AI 미소 분석",
            theme: "from-amber-500/20 to-orange-600/20"
        },
        {
            id: "breath_mbti",
            label: "입냄새 MBTI",
            desc: "구취 유형 분석",
            theme: "from-rose-400/20 to-pink-600/20"
        },
        {
            id: "teeth_age",
            label: "치아 나이",
            desc: "생활습관 분석",
            theme: "from-blue-400/20 to-slate-600/20"
        },
        {
            id: "stain_risk",
            label: "착색 위험도",
            desc: "커피 습관 체크",
            theme: "from-emerald-400/20 to-teal-600/20"
        },
        {
            id: "kids_mission",
            label: "양치 히어로",
            desc: "어린이 양치 습관",
            theme: "from-violet-400/20 to-purple-600/20"
        },
    ];

    return (
        <div className={`${props.isEmbedded ? "h-full" : "min-h-screen"} bg-traditional-bg font-sans flex flex-col selection:bg-traditional-accent selection:text-white`}>
            {/* Header - Hidden if embedded */}
            {!props.isEmbedded && (
                <header className="bg-white/80 backdrop-blur-md border-b border-traditional-muted/50 px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-all duration-300">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 bg-traditional-primary rounded-lg flex items-center justify-center shadow-sm group-hover:bg-traditional-accent transition-colors duration-300">
                            <span className="text-white text-xs font-bold font-serif">AI</span>
                        </div>
                        <span className="text-lg font-bold text-traditional-text tracking-tight group-hover:text-traditional-primary transition-colors">AI 스마일 덴탈케어</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-traditional-subtext">
                        <Link href="/login" className="px-6 py-2 bg-traditional-primary text-white text-sm font-medium rounded-full hover:bg-traditional-accent hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            로그인
                        </Link>
                    </div>
                </header>
            )}



            <main className={`flex-1 w-full mx-auto ${props.isEmbedded ? "flex flex-col overflow-hidden p-0" : "max-w-5xl px-4 pb-20 pt-6"}`}>
                {/* Hero Banner - Hidden if embedded */}
                {!props.isEmbedded && (
                    <div className="relative rounded-3xl overflow-hidden mb-8 h-[300px] md:h-[380px] shadow-2xl group">
                        <video
                            src="/1.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
                        <div className="absolute inset-0 bg-traditional-primary/20 mix-blend-multiply"></div>

                        <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12">
                            <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-medium mb-4 w-fit">
                                AI Dental Analysis
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg font-serif leading-tight">
                                AI 스마일 덴탈케어로<br />시작하는 치아 건강
                            </h2>
                            <p className="text-white/90 text-sm md:text-base font-light mb-4 max-w-lg leading-relaxed">
                                최첨단 AI 기술로 당신의 미소를 분석하고<br />맞춤형 치아 관리 솔루션을 제공합니다.
                            </p>

                            {/* Module List (Overlay on Hero) */}
                            <div className="flex gap-3 overflow-x-auto pb-4 p-1 no-scrollbar mask-linear-fade">
                                {modules.map((mod) => (
                                    <Link
                                        key={mod.id}
                                        href={`/healthcare/chat?topic=${mod.id}`}
                                        className={`flex-shrink-0 flex flex-col items-center justify-center px-5 py-3 rounded-xl border backdrop-blur-md transition-all duration-300 ${topic === mod.id
                                            ? "bg-white text-traditional-primary border-white shadow-lg scale-105 font-bold"
                                            : "bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/40"
                                            }`}
                                    >
                                        <span className="text-sm whitespace-nowrap">{mod.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <div className={`bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 space-y-8 shadow-xl ${props.isEmbedded ? "flex-1 overflow-y-auto rounded-none border-x-0 border-t-0 bg-transparent shadow-none" : "min-h-[500px]"}`}>
                    {messages.map((msg, idx) => (
                        <div key={idx}>
                            <div
                                className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden border-2 ${msg.role === "ai"
                                        ? "border-traditional-primary bg-traditional-bg"
                                        : "border-traditional-accent bg-traditional-bg"
                                        }`}
                                >
                                    {msg.role === "ai" ? (
                                        <img
                                            src="/images/character-doctor.jpg"
                                            alt="Doctor"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-traditional-accent flex items-center justify-center text-white">
                                            <User size={20} />
                                        </div>
                                    )}
                                </div>

                                {/* Bubble */}
                                <div className="flex flex-col gap-1 max-w-[80%]">
                                    <span className={`text-xs font-medium ${msg.role === "user" ? "text-right text-traditional-subtext" : "text-left text-traditional-primary"}`}>
                                        {msg.role === "ai" ? "AI 닥터" : "나"}
                                    </span>
                                    <div
                                        className={`px-6 py-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "ai"
                                            ? "bg-white text-traditional-text border border-traditional-muted rounded-tl-none"
                                            : "bg-traditional-primary text-white rounded-tr-none shadow-md"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            </div>

                            {/* Result Cards */}
                            {msg.result && (
                                <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    {topic === 'smile_test' && <SmileResultCard result={msg.result} isLoggedIn={props.isLoggedIn || false} />}
                                    {topic === 'breath_mbti' && <MbtiResultCard result={msg.result} isLoggedIn={props.isLoggedIn || false} />}
                                    {topic === 'teeth_age' && <TeethAgeCard result={msg.result} isLoggedIn={props.isLoggedIn || false} />}
                                    {topic === 'stain_risk' && <StainCard result={msg.result} isLoggedIn={props.isLoggedIn || false} />}
                                    {topic === 'kids_mission' && <KidsHeroCard result={msg.result} isLoggedIn={props.isLoggedIn || false} />}
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full border-2 border-traditional-primary bg-traditional-bg flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                                <img
                                    src="/images/character-doctor.jpg"
                                    alt="Doctor"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="bg-white px-6 py-4 rounded-2xl rounded-tl-none border border-traditional-muted shadow-sm">
                                <div className="flex gap-1.5">
                                    <span className="w-2 h-2 bg-traditional-primary/40 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-traditional-primary/40 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-2 h-2 bg-traditional-primary/40 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <div className={`${props.isEmbedded ? "relative bg-white border-t border-gray-100" : "fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-traditional-muted/50"} p-4 z-40`}>
                <div className={`${props.isEmbedded ? "w-full" : "max-w-4xl mx-auto"} relative`}>
                    <form onSubmit={handleSubmit} className="relative bg-white rounded-full shadow-xl border border-traditional-muted/50 flex items-center p-2 pl-6 transition-shadow hover:shadow-2xl">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="증상이나 궁금한 점을 입력해주세요..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-traditional-text placeholder:text-traditional-subtext/50 text-base"
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            onClick={handleImageClick}
                            className="p-3 text-traditional-subtext hover:text-traditional-primary transition-colors hover:bg-traditional-bg rounded-full"
                        >
                            <Paperclip size={20} />
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || (!input.trim() && !flowState.image)}
                            className="p-3 bg-traditional-primary text-white rounded-full hover:bg-traditional-accent transition-all disabled:opacity-50 disabled:hover:bg-traditional-primary ml-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        >
                            <ArrowUp size={20} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center transform transition-all scale-100 border border-white/20">
                        <div className="w-16 h-16 bg-traditional-bg rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <User className="w-8 h-8 text-traditional-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-traditional-text mb-3 font-serif">
                            {loginModalContent.title}
                        </h3>
                        <p
                            className="text-traditional-subtext text-sm mb-8 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: loginModalContent.desc }}
                        />
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/login"
                                className="w-full py-3.5 bg-traditional-primary text-white rounded-xl font-bold hover:bg-traditional-accent transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                로그인하고 계속하기
                            </Link>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="w-full py-3.5 bg-traditional-bg text-traditional-subtext rounded-xl font-medium hover:bg-traditional-muted transition-colors"
                            >
                                나중에 하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reservation Modal */}
            <ReservationModal
                isOpen={showReservationModal}
                onClose={() => setShowReservationModal(false)}
                initialTab="book"
                patientId={patientId}
            />
        </div >
    );
}
