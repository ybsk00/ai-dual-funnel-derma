"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, ArrowLeft, Paperclip, ArrowUp, Sun, Moon, Activity, Heart, Baby, Calendar } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ConditionReport from "@/components/healthcare/ConditionReport";
import ReservationModal from "@/components/medical/ReservationModal";
import { createClient } from "@/lib/supabase/client";
import SkinMbtiCard from "@/components/healthcare/results/SkinMbtiCard";
import SkinAgeCard from "@/components/healthcare/results/SkinAgeCard";
import UvScoreCard from "@/components/healthcare/results/UvScoreCard";
import CleansingCard from "@/components/healthcare/results/CleansingCard";
import TroubleMapCard from "@/components/healthcare/results/TroubleMapCard";

type Message = {
    role: "user" | "ai";
    content: string;
    result?: any; // For structured results
};

type ChatInterfaceProps = {
    isEmbedded?: boolean;
    isLoggedIn?: boolean;
};

// Dermatology Flow Definitions
const FLOWS: any = {
    skin_mbti: {
        title: "피부 컨디션 MBTI",
        initialMessage: "안녕하세요! 당신의 피부 성격을 찾아주는 AI 스킨 코치입니다.\n\n먼저, 평소 세안과 보습 습관이 궁금해요. 하루에 세안은 몇 번 하시고, 보습제는 바로 바르시나요?",
    },
    skin_age: {
        title: "피부 나이 테스트",
        initialMessage: "내 피부 나이는 몇 살일까요? AI 스킨 코치가 계산해 드릴게요.\n\n평소 야외 활동은 얼마나 하시고, 선크림은 꼼꼼히 바르시는 편인가요?",
    },
    uv_score: {
        title: "자외선 생활 점수",
        initialMessage: "자외선 관리, 얼마나 잘하고 계신가요? 점수로 알려드릴게요.\n\n평일과 주말, 야외에 머무는 시간은 대략 어느 정도인가요?",
    },
    cleansing_lab: {
        title: "세안 루틴 연구소",
        initialMessage: "매일 하는 세안, 내 피부에 딱 맞을까요? 클렌징 연구소입니다.\n\n아침, 저녁 세안은 각각 어떻게(물세안/폼/오일 등) 하고 계신가요?",
    },
    trouble_map: {
        title: "피부 트러블 지도",
        initialMessage: "트러블이 자주 나는 위치와 패턴을 분석해 드릴게요.\n\n주로 얼굴의 어느 부위(이마/볼/턱 등)에 트러블이 자주 생기나요?",
    }
};

export default function ChatInterface(props: ChatInterfaceProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const topic = searchParams.get("topic") || "skin_mbti";
    const isDermatologyFlow = Object.keys(FLOWS).includes(topic);

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
        let welcomeMsg = "안녕하세요, AI 스킨 코치입니다. 궁금한 점을 체크해 보세요.";

        if (isDermatologyFlow) {
            welcomeMsg = FLOWS[topic].initialMessage;
        }

        setMessages([{ role: "ai", content: welcomeMsg }]);
        setFlowState({ stepIndex: 0, answers: {}, image: null });
        setTurnCount(0);
    }, [topic, isDermatologyFlow]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleImageClick = () => {
        // For dermatology, maybe enable for Trouble Map later?
        // For now, keep it simple or require login.
        if (props.isLoggedIn) {
            fileInputRef.current?.click();
            return;
        }

        setLoginModalContent({
            title: "이미지 분석 기능",
            desc: "이미지 분석을 통한 피부 상담은<br />로그인 후 이용 가능합니다."
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
            setMessages(prev => [...prev, { role: "user", content: "📷 [사진 전송됨]" }]);
            // Logic to handle image can be added here if needed
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

        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages,
                    service_mode: topic // Pass the service mode (skin_mbti, etc.)
                }),
            });

            if (!response.ok) throw new Error("Failed to send message");

            const data = await response.json();
            let aiContent = data.content;
            const result = data.result;

            if (aiContent.includes("[RESERVATION_TRIGGER]")) {
                aiContent = aiContent.replace("[RESERVATION_TRIGGER]", "").trim();
                setShowReservationModal(true);
            }

            setMessages(prev => [...prev, { role: "ai", content: aiContent, result: result }]);

            if (!props.isLoggedIn && data.content.includes("로그인이 필요합니다")) {
                setLoginModalContent({
                    title: "상세한 상담이 필요하신가요?",
                    desc: "더 정확한 피부 분석과 맞춤형 조언을 위해<br />로그인이 필요합니다."
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

    // Modules List
    const modules = [
        {
            id: "skin_mbti",
            label: "피부 MBTI",
            desc: "내 피부 성격은?",
            theme: "from-amber-500/20 to-orange-600/20"
        },
        {
            id: "skin_age",
            label: "피부 나이",
            desc: "10년 후 내 피부는?",
            theme: "from-rose-400/20 to-pink-600/20"
        },
        {
            id: "uv_score",
            label: "자외선 점수",
            desc: "선크림 잘 바르고 있나?",
            theme: "from-blue-400/20 to-slate-600/20"
        },
        {
            id: "cleansing_lab",
            label: "세안 연구소",
            desc: "내 세안법 점검",
            theme: "from-emerald-400/20 to-teal-600/20"
        },
        {
            id: "trouble_map",
            label: "트러블 지도",
            desc: "왜 자꾸 거기에 날까?",
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
                        <span className="text-lg font-bold text-traditional-text tracking-tight group-hover:text-traditional-primary transition-colors">AI 피부 헬스케어</span>
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
                            src="/2.mp4"
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
                                AI Skin Analysis
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg font-serif leading-tight">
                                AI 스킨 코치와 함께<br />찾아가는 내 피부 정답
                            </h2>
                            <p className="text-white/90 text-sm md:text-base font-light mb-4 max-w-lg leading-relaxed">
                                생활 습관부터 피부 고민까지, AI가 분석하고<br />맞춤형 관리 루틴을 제안해 드립니다.
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
                                        {msg.role === "ai" ? "AI 스킨 코치" : "나"}
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
                                    {topic === 'skin_mbti' && <SkinMbtiCard result={msg.result} isLoggedIn={props.isLoggedIn || false} />}
                                    {topic === 'skin_age' && <SkinAgeCard result={msg.result} isLoggedIn={props.isLoggedIn || false} />}
                                    {topic === 'uv_score' && <UvScoreCard result={msg.result} isLoggedIn={props.isLoggedIn || false} />}
                                    {topic === 'cleansing_lab' && <CleansingCard result={msg.result} isLoggedIn={props.isLoggedIn || false} />}
                                    {topic === 'trouble_map' && <TroubleMapCard result={msg.result} isLoggedIn={props.isLoggedIn || false} />}
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
                            placeholder="답변을 입력해주세요..."
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
