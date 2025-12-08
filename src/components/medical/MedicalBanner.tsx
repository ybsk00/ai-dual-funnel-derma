

export default function MedicalBanner() {
    return (
        <div className="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden shadow-lg group">
            {/* Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            >
                <source src="/3.mp4" type="video/mp4" />
            </video>

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center px-4">
                <div className="animate-fade-in-up">
                    <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight font-serif drop-shadow-md">
                        피부진단 및 시술 상담 AI
                    </h2>
                </div>
            </div>
        </div>
    );
}
