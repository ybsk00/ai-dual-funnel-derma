
"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, X, MessageSquare, CheckCircle2, Clock, User, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DoctorDashboard() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("전체");
    const supabase = createClient();

    // Define Visit type (joined with Patient)
    type Visit = {
        id: string;
        visit_date: string;
        visit_type: string;
        status: "scheduled" | "in_progress" | "completed" | "cancelled";
        chief_complaint: string;
        patient: {
            name: string;
            phone: string;
            gender: string;
            birth_date: string;
        };
    };

    const [visits, setVisits] = useState<Visit[]>([]);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showReservationModal, setShowReservationModal] = useState(false);

    const filters = ["전체", "대기", "완료", "취소"];

    useEffect(() => {
        fetchVisits();
    }, []);

    const fetchVisits = async () => {
        const { data, error } = await supabase
            .from('visits')
            .select(`
                *,
                patient:patients (
                    name,
                    phone,
                    gender,
                    birth_date
                )
            `)
            .order('visit_date', { ascending: true });

        if (error) {
            console.error('Error fetching visits:', error);
        } else {
            setVisits(data || []);
        }
    };

    const handleStatusClick = async (visit: Visit) => {
        if (visit.status === "completed") {
            setSelectedVisit(visit);
            setShowReservationModal(true);
        } else {
            // Toggle status logic
            const newStatus = visit.status === 'scheduled' ? 'completed' : 'scheduled';
            const { error } = await supabase
                .from('visits')
                .update({ status: newStatus })
                .eq('id', visit.id);

            if (!error) {
                fetchVisits(); // Refresh data
            }
        }
    };

    const handleComplaintClick = (visit: Visit) => {
        setSelectedVisit(visit);
        setShowChatModal(true);
    };

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-traditional-text font-serif mb-2">진료 대시보드</h1>
                    <p className="text-traditional-subtext text-sm">오늘의 예약 환자 및 진료 현황을 관리합니다.</p>
                </div>
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-traditional-muted/50 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-traditional-text">실시간 연동 중</span>
                </div>
            </header>

            {/* Top Filters & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                    <button className="px-4 py-2 rounded-full bg-traditional-primary text-white text-sm font-medium shadow-md hover:bg-traditional-primary/90 transition-colors">
                        오늘
                    </button>
                    <div className="w-px h-6 bg-traditional-muted mx-2"></div>
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter === activeFilter ? "" : filter)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${activeFilter === filter
                                ? "bg-traditional-accent text-white shadow-md"
                                : "bg-white border border-traditional-muted text-traditional-subtext hover:bg-traditional-bg hover:text-traditional-text"
                                }`}
                        >
                            {filter}
                            {activeFilter === filter && <X size={14} />}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-traditional-subtext" size={18} />
                    <input
                        type="text"
                        placeholder="환자 이름 또는 키워드 검색"
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-traditional-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-traditional-accent/50 focus:border-traditional-accent transition-all shadow-sm text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Patient Table */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-traditional-bg/50 border-b border-traditional-muted/50">
                        <tr>
                            <th className="px-8 py-5 text-sm font-bold text-traditional-text/80 uppercase tracking-wider">시간</th>
                            <th className="px-8 py-5 text-sm font-bold text-traditional-text/80 uppercase tracking-wider">환자 정보</th>
                            <th className="px-8 py-5 text-sm font-bold text-traditional-text/80 uppercase tracking-wider">주호소</th>
                            <th className="px-8 py-5 text-sm font-bold text-traditional-text/80 uppercase tracking-wider">상태</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-traditional-muted/30">
                        {visits
                            .filter(visit => {
                                if (activeFilter === "전체") return true;
                                if (activeFilter === "대기") return visit.status === "scheduled";
                                if (activeFilter === "완료") return visit.status === "completed";
                                if (activeFilter === "취소") return visit.status === "cancelled";
                                return true;
                            })
                            .length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-16 text-center text-traditional-subtext">
                                    <div className="flex flex-col items-center gap-3">
                                        <Calendar className="w-10 h-10 text-traditional-muted" />
                                        <p>
                                            {activeFilter === "전체" ? "예약된 환자가 없습니다." :
                                                activeFilter === "대기" ? "대기 중인 환자가 없습니다." :
                                                    activeFilter === "완료" ? "진료 완료된 환자가 없습니다." :
                                                        "취소된 예약이 없습니다."}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            visits
                                .filter(visit => {
                                    if (activeFilter === "전체") return true;
                                    if (activeFilter === "대기") return visit.status === "scheduled";
                                    if (activeFilter === "완료") return visit.status === "completed";
                                    if (activeFilter === "취소") return visit.status === "cancelled";
                                    return true;
                                })
                                .map((visit) => (
                                    <tr key={visit.id} className={`hover:bg-white/50 transition-colors group ${visit.status === 'cancelled' ? 'opacity-60 bg-gray-50' : ''}`}>
                                        <td className="px-8 py-5 text-traditional-text font-medium font-mono text-base">
                                            {new Date(visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-traditional-bg border border-traditional-muted flex items-center justify-center text-traditional-subtext">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold text-base ${visit.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-traditional-text'}`}>{visit.patient.name}</span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                                                            {visit.visit_type}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-traditional-subtext mt-0.5">
                                                        {visit.patient.phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <button
                                                onClick={() => { setSelectedVisit(visit); setShowChatModal(true); }}
                                                className="text-traditional-subtext hover:text-traditional-primary hover:underline text-left flex items-center gap-2 group-hover:translate-x-1 transition-all"
                                            >
                                                <MessageSquare size={16} className="text-traditional-muted group-hover:text-traditional-primary" />
                                                <span className="line-clamp-1">{visit.chief_complaint}</span>
                                            </button>
                                        </td>
                                        <td className="px-8 py-5">
                                            <button
                                                onClick={() => handleStatusClick(visit)}
                                                disabled={visit.status === 'cancelled'}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm 
                                                    ${visit.status === 'completed'
                                                        ? 'bg-traditional-primary/10 text-traditional-primary border border-traditional-primary/20 hover:bg-traditional-primary/20'
                                                        : visit.status === 'cancelled'
                                                            ? 'bg-red-50 text-red-500 border border-red-100 cursor-not-allowed'
                                                            : 'bg-white border border-traditional-muted text-traditional-subtext hover:bg-traditional-bg'
                                                    }`}
                                            >
                                                {visit.status === 'completed' ? (
                                                    <>
                                                        <CheckCircle2 size={16} />
                                                        진료 완료
                                                    </>
                                                ) : visit.status === 'cancelled' ? (
                                                    <>
                                                        <X size={16} />
                                                        예약 취소
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock size={16} />
                                                        진료 대기
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Chat History Modal */}
            {showChatModal && selectedVisit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between px-8 py-5 border-b border-traditional-muted/30 bg-traditional-bg/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-traditional-primary/10 rounded-lg">
                                    <MessageSquare className="text-traditional-primary" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-traditional-text">주호소 상세</h3>
                                    <p className="text-xs text-traditional-subtext">환자: {selectedVisit.patient.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowChatModal(false)}
                                className="p-2 text-traditional-subtext hover:text-traditional-text hover:bg-traditional-muted/20 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto bg-traditional-bg/30 flex-1">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-traditional-muted/50 text-traditional-text text-base leading-relaxed">
                                {selectedVisit.chief_complaint}
                            </div>
                        </div>
                        <div className="p-5 border-t border-traditional-muted/30 bg-white flex justify-end">
                            <button
                                onClick={() => setShowChatModal(false)}
                                className="px-6 py-2.5 bg-traditional-bg text-traditional-text border border-traditional-muted rounded-xl font-medium hover:bg-traditional-muted/30 transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reservation Confirmation Modal */}
            {showReservationModal && selectedVisit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-traditional-muted/30">
                            <h3 className="text-lg font-bold text-traditional-text">진료 완료 처리</h3>
                            <button
                                onClick={() => setShowReservationModal(false)}
                                className="text-traditional-subtext hover:text-traditional-text transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2 ring-8 ring-green-50/50">
                                <CheckCircle2 className="text-green-600" size={40} />
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-xl font-bold text-traditional-text">{selectedVisit.patient.name}님</h4>
                                <p className="text-traditional-subtext text-sm">진료가 완료되었습니다.</p>
                            </div>

                            <div className="bg-traditional-bg rounded-2xl p-5 space-y-4 text-left border border-traditional-muted/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-traditional-subtext text-sm">날짜</span>
                                    <span className="font-bold text-traditional-text">{new Date(selectedVisit.visit_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-traditional-muted/20 pt-3">
                                    <span className="text-traditional-subtext text-sm">시간</span>
                                    <span className="font-bold text-traditional-primary text-lg">{new Date(selectedVisit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-traditional-muted/30 bg-white">
                            <button
                                onClick={() => setShowReservationModal(false)}
                                className="w-full py-3.5 bg-traditional-primary text-white rounded-xl font-bold hover:bg-traditional-primary/90 transition-colors shadow-lg shadow-traditional-primary/20"
                            >
                                확인 완료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
