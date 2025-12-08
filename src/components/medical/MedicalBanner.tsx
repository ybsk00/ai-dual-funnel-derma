

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


        </div>
    );
}
