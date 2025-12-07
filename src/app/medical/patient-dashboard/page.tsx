"use client";

import { useState, Suspense, useEffect } from "react";
import { Calendar, Clock, MoreHorizontal, Send } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";
import PatientHeader from "@/components/medical/PatientHeader";
import ReservationModal from "@/components/medical/ReservationModal";
import { createClient } from "@/lib/supabase/client";

export default function PatientDashboard() {
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
    const [patientId, setPatientId] = useState<number | null>(null);
    const [appointment, setAppointment] = useState({
        date: "예약 없음",
        time: "",
        type: "예정된 진료가 없습니다.",
        doctor: ""
    });
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get Patient ID
            let currentPatientId = null;
            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select('id, name')
                .eq('user_id', user.id)
                .maybeSingle();

            if (patientData) {
                currentPatientId = patientData.id;
                setPatientId(patientData.id);
            } else {
                // Auto-create patient record if not exists (optional, but good for UX)
                const { data: newPatient, error: createError } = await supabase
                    .from('patients')
                    .insert({
                        user_id: user.id,
                        name: user.user_metadata.full_name || user.email?.split('@')[0] || '환자',
                        status: 'active'
                    })
                    .select()
                    .single();

                if (newPatient) {
                    currentPatientId = newPatient.id;
                    setPatientId(newPatient.id);
                }
            }

            // 2. Get Latest Appointment
            if (currentPatientId) {
                const { data: visitData } = await supabase
                    .from('visits')
                    .select('*')
                    .eq('patient_id', currentPatientId)
                    .in('status', ['scheduled', 'in_progress'])
                    .order('visit_date', { ascending: true })
                    .limit(1)
                    .maybeSingle();

                if (visitData) {
                    const date = new Date(visitData.visit_date);
                    setAppointment({
                        date: `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`,
                        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        type: visitData.visit_type === 'consultation' ? '일반 진료' : visitData.visit_type,
                        doctor: "담당의"
                    });
                }
            }
        };

        fetchData();
    }, [supabase, isReservationModalOpen]); // Refresh when modal closes (to update appointment card)

    return (
        <div className="min-h-screen bg-traditional-bg font-sans selection:bg-traditional-accent selection:text-white">
            <PatientHeader />

            <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

                {/* Header / Appointment Card */}
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${appointment.date === "예약 없음" ? "bg-traditional-muted/20 text-traditional-subtext" : "bg-traditional-primary/10 text-traditional-primary"}`}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 className="text-sm text-traditional-subtext font-medium mb-1">다음 예약 안내</h2>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-xl font-bold font-serif ${appointment.date === "예약 없음" ? "text-traditional-subtext/60" : "text-traditional-text"}`}>{appointment.date}</span>
                                {appointment.time && <span className="text-xl font-bold text-traditional-text font-serif">{appointment.time}</span>}
                            </div>
                            <p className={`${appointment.date === "예약 없음" ? "text-traditional-subtext/60" : "text-traditional-primary"} text-sm font-medium mt-1`}>{appointment.type}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setIsReservationModalOpen(true)}
                            className="flex-1 md:flex-none px-6 py-2.5 bg-traditional-bg text-traditional-subtext border border-traditional-muted/50 rounded-xl text-sm font-medium hover:bg-traditional-muted/20 hover:text-traditional-text transition-all shadow-sm"
                        >
                            예약관리
                        </button>
                    </div>
                </div>

                <ReservationModal
                    isOpen={isReservationModalOpen}
                    onClose={() => setIsReservationModalOpen(false)}
                    patientId={patientId}
                />

                {/* Main Chat Interface Area */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden h-[650px] flex flex-col">
                    <div className="p-5 border-b border-traditional-muted/20 flex justify-between items-center bg-white/40">
                        <div>
                            <h3 className="font-bold text-traditional-text font-serif text-lg">예진 상담 (Medical Chat)</h3>
                            <p className="text-xs text-traditional-primary font-medium flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-traditional-primary rounded-full animate-pulse"></span>
                                전문의 감독 하에 운영
                            </p>
                        </div>
                        <button className="text-traditional-subtext hover:text-traditional-text p-2 hover:bg-traditional-bg rounded-full transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <Suspense fallback={<div className="flex items-center justify-center h-full text-traditional-subtext">Loading...</div>}>
                            <ChatInterface isEmbedded={true} isLoggedIn={true} />
                        </Suspense>
                    </div>
                </div>

            </div>
        </div>
    );
}
