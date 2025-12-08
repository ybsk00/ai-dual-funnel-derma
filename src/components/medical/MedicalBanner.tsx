import Image from "next/image";

export default function MedicalBanner() {
    return (
        <div className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden shadow-lg group">
            {/* Background Image */}
            <Image
                src="/assets/images/medical_dashboard_banner.png"
                alt="AI Skin Analysis"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
            />

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex flex-col justify-center px-8 md:px-12">
                <div className="max-w-2xl space-y-4 animate-fade-in-up">
                    <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs text-white font-medium mb-2">
                        AI Skin Analysis
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight font-serif">
                        AI 스킨 코치와 함께<br />
                        찾아가는 내 피부 정답
                    </h2>

                    <p className="text-white/80 text-sm md:text-base max-w-lg leading-relaxed">
                        생활 습관부터 피부 고민까지, AI가 분석하고<br className="hidden md:block" />
                        맞춤형 관리 루틴을 제안해 드립니다.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {["피부 MBTI", "피부 나이", "자외선 점수", "세안 연구소", "트러블 지도"].map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-xs text-white hover:bg-white/20 transition-colors cursor-default"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
