"use client";

import Link from "next/link";

type TroubleMapResult = {
    headline: string;
    summary: string;
    lifestyle_tips: string[];
    disclaimer: string;
    cta: {
        type: string;
        title: string;
        body: string;
    };
};

export default function TroubleMapCard({ result, isLoggedIn }: { result: TroubleMapResult, isLoggedIn: boolean }) {
    if (!result) return null;

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-violet-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="bg-gradient-to-br from-violet-400 to-purple-600 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-sm"></div>
                <div className="relative z-10">
                    <h3 className="text-sm font-medium opacity-90 mb-1">피부 트러블 지도</h3>
                    <h2 className="text-2xl font-bold font-serif leading-tight">{result.headline}</h2>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Summary */}
                <div className="bg-violet-50 p-4 rounded-2xl border border-violet-100">
                    <p className="text-violet-900 text-sm leading-relaxed font-medium">
                        {result.summary}
                    </p>
                </div>

                {/* Tips */}
                <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                        트러블 진정 팁
                    </h4>
                    <ul className="space-y-2">
                        {result.lifestyle_tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                                <span className="text-violet-500 mt-0.5">✔</span>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-gray-400 text-center leading-relaxed px-2">
                    {result.disclaimer}
                </p>

                {/* CTA */}
                <div className="pt-2 border-t border-gray-100">
                    <div className="text-center mb-4">
                        <h4 className="text-sm font-bold text-gray-800 mb-1">{result.cta.title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{result.cta.body}</p>
                    </div>

                    {isLoggedIn ? (
                        <Link href="/medical/chat?source=trouble_map&context=result" className="block w-full py-3 bg-violet-500 text-white text-center rounded-xl font-bold hover:bg-violet-600 transition-colors shadow-md hover:shadow-lg">
                            피부과 전문 상담 이어가기
                        </Link>
                    ) : (
                        <Link href="/login" className="block w-full py-3 bg-violet-500 text-white text-center rounded-xl font-bold hover:bg-violet-600 transition-colors shadow-md hover:shadow-lg">
                            로그인하고 상세 상담 받기
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
