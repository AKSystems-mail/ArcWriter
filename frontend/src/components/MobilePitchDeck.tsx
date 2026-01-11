import React, { useState, useRef, useEffect } from 'react';

interface MobilePitchDeckProps {
    projectTitle?: string;
    tagline?: string;
    synopsis?: string;
    posterUrl?: string;
    teaserUrl?: string | null;
    characterUrl?: string;
}

const MobilePitchDeck: React.FC<MobilePitchDeckProps> = ({
    projectTitle = 'ArcWriter - The Genesis',
    tagline = 'A new beginning for humanity.',
    synopsis = 'Year 2077. The megacity of Neo-Veridia thrives under the iron fist of the omniscient Aethel Corp, a company that controls every aspect of its citizens\' lives through advanced neural implants. Kael, a former data architect now living off-grid, stumbles upon a suppressed historical archive revealing Aethel Corp\'s true origins: a brutal coup that erased the true founding principles of the city.',
    posterUrl = 'https://via.placeholder.com/600x900?text=Movie+Poster',
    teaserUrl = null,
    characterUrl = 'https://via.placeholder.com/150?text=Character',
}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const slides = [
        { id: 'poster', title: 'Poster' },
        { id: 'logline', title: 'Logline' },
        { id: 'teaser', title: 'Teaser' },
        { id: 'characters', title: 'Characters' },
    ];

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
        if (isRightSwipe && currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-obsidian-black overflow-hidden select-none">
            {/* Slide Container */}
            <div
                ref={containerRef}
                className="h-full w-full relative"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Slides */}
                <div
                    className="flex h-full transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {/* Slide 1: Poster */}
                    <div className="min-w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-obsidian-black via-gray-900 to-obsidian-black">
                        <div className="w-full max-w-sm animate-fade-in">
                            <div className="relative group rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-gray-800">
                                <img
                                    src={posterUrl}
                                    alt="Movie Poster"
                                    className="w-full h-auto object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-black via-transparent to-transparent opacity-60"></div>
                            </div>
                            <h1 className="text-4xl font-black text-white text-center mt-8 tracking-tighter">
                                {projectTitle.toUpperCase()}
                            </h1>
                            <div className="h-1 w-12 bg-arc-orange mx-auto mt-4 rounded-full"></div>
                        </div>
                    </div>

                    {/* Slide 2: Logline & Synopsis */}
                    <div className="min-w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-obsidian-black via-gray-900 to-obsidian-black">
                        <div className="w-full max-w-2xl animate-fade-in">
                            <h2 className="text-sm font-black text-arc-orange uppercase tracking-[0.3em] mb-4 text-center">
                                The Story
                            </h2>
                            <h3 className="text-3xl font-bold text-white mb-8 text-center leading-tight">
                                {tagline}
                            </h3>
                            <div className="bg-gray-900/40 backdrop-blur-md rounded-3xl p-8 border border-gray-800 shadow-2xl">
                                <p className="text-xl text-gray-300 leading-relaxed font-light italic text-center">
                                    {synopsis}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Slide 3: Teaser */}
                    <div className="min-w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-obsidian-black via-gray-900 to-obsidian-black">
                        <div className="w-full max-w-2xl animate-fade-in">
                            <h2 className="text-sm font-black text-arc-teal uppercase tracking-[0.3em] mb-8 text-center">
                                Motion Teaser
                            </h2>
                            {teaserUrl ? (
                                <div className="rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,128,128,0.2)] border border-gray-800">
                                    <video
                                        controls
                                        src={teaserUrl}
                                        className="w-full h-auto"
                                        playsInline
                                    />
                                </div>
                            ) : (
                                <div className="bg-gray-900/40 backdrop-blur-md rounded-3xl p-16 border border-gray-800 flex flex-col items-center justify-center min-h-[400px]">
                                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                        <span className="text-gray-600 text-3xl">▷</span>
                                    </div>
                                    <p className="text-gray-400 text-center text-xl font-medium">
                                        Teaser In Production
                                    </p>
                                    <p className="text-gray-600 text-center text-sm mt-4 uppercase tracking-widest font-black">
                                        Ready for Pitch
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Slide 4: Character Gallery */}
                    <div className="min-w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-obsidian-black via-gray-900 to-obsidian-black">
                        <div className="w-full max-w-2xl animate-fade-in">
                            <h2 className="text-sm font-black text-arc-orange uppercase tracking-[0.3em] mb-12 text-center">
                                Principal Cast
                            </h2>
                            <div className="grid grid-cols-1 gap-8 px-4">
                                <div className="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
                                    <img
                                        src={characterUrl}
                                        alt="Main Character"
                                        className="w-full h-80 object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian-black p-8 flex flex-col justify-end">
                                        <p className="text-arc-orange text-xs font-black uppercase tracking-widest mb-1">Lead Character</p>
                                        <p className="text-white font-bold text-2xl uppercase tracking-tighter">The Protagonist</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slide Indicators */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-4 z-10">
                {slides.map((slide, index) => (
                    <button
                        key={slide.id}
                        onClick={() => setCurrentSlide(index)}
                        className={`transition-all duration-500 ${currentSlide === index
                            ? 'bg-arc-teal w-12 h-1.5'
                            : 'bg-gray-800 w-3 h-1.5'
                            } rounded-full`}
                        aria-label={`Go to ${slide.title} slide`}
                    />
                ))}
            </div>

            {/* Swipe Hint (only on first slide) */}
            {currentSlide === 0 && (
                <div className="absolute bottom-24 left-0 right-0 flex justify-center animate-bounce">
                    <div className="text-gray-500 uppercase tracking-[0.4em] text-[10px] font-black">
                        Swipe to Reveal
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobilePitchDeck;
