import React, { useState, useEffect, useCallback } from 'react';
import { IstighfarData } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Languages, CheckCircle2 } from 'lucide-react';

interface ReadingViewProps {
    item: IstighfarData;
    currentIndex: number;
    total: number;
    onNext: () => void;
    onPrev: () => void;
    onComplete: () => void;
}

const milestoneMessages: Record<number, string> = {
    10: '۱۰ بند خوندی، عالیه! 🌟',
    20: '۲۰ بند، ثابت قدم هستی! 💪',
    30: 'نصف راه رو رفتی! ✨',
    40: 'فقط ۳۰ بند مونده! 🎯',
    50: '۵۰ بند، چه خوب! 🌙',
    60: 'نزدیک خط پایانی! 🏁',
    70: 'تموم شد، مبارکه! 🎉',
};

const ReadingView: React.FC<ReadingViewProps> = ({
    item,
    currentIndex,
    total,
    onNext,
    onPrev,
    onComplete
}) => {
    const [focusMode, setFocusMode] = useState(false);
    const [showMilestone, setShowMilestone] = useState(false);
    const [milestoneText, setMilestoneText] = useState('');
    const [direction, setDirection] = useState(0);

    const [showArabic, setShowArabic] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('showArabic');
            return saved ? JSON.parse(saved) : false;
        }
        return false;
    });

    const toggleArabic = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newState = !showArabic;
        setShowArabic(newState);
        localStorage.setItem('showArabic', JSON.stringify(newState));
    };

    const isLastItem = currentIndex + 1 === total;
    const progress = ((currentIndex + 1) / total) * 100;

    useEffect(() => {
        const milestone = milestoneMessages[currentIndex + 1];
        if (milestone) {
            setMilestoneText(milestone);
            setShowMilestone(true);
            if (navigator.vibrate) navigator.vibrate(50);
            const timer = setTimeout(() => setShowMilestone(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [currentIndex]);

    const handleNext = useCallback(() => {
        if (isLastItem) {
            onComplete();
        } else {
            setDirection(1); // جهت انیمیشن: ورودی از چپ (چون RTL میریم بعدی)
            onNext();
        }
    }, [isLastItem, onComplete, onNext]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setDirection(-1);
            onPrev();
        }
    }, [currentIndex, onPrev]);

    // 🛠 Senior Fix: تنظیم دقیق Swipe
    const swipeHandlers = useSwipeable({
        // ✅ اصلاح جهت RTL:
        // سوایپ به راست (کشیدن انگشت از چپ به راست) -> یعنی "ورق زدن به صفحه بعد" در کتاب فارسی
        onSwipedRight: handleNext, 
        // سوایپ به چپ (کشیدن انگشت از راست به چپ) -> یعنی "برگشتن به صفحه قبل"
        onSwipedLeft: handlePrev,
        
        trackMouse: false,
        trackTouch: true,
        delta: 70, // کمی حساسیت را کم کردیم تا با اسکرول اشتباه نشود
        preventScrollOnSwipe: false, // 🛠 حیاتی: اجازه اسکرول عمودی
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                 // در کیبورد ArrowLeft معمولا یعنی "عقب" در UI، اما در اسلایدرها یعنی "چپ"
                 // برای جلوگیری از گیجی، Space و Enter را برای "بعدی" بگذاریم
                handleNext(); 
            } else if (e.key === 'ArrowRight') {
                handlePrev();
            } else if (e.key === ' ' || e.key === 'Enter') {
                handleNext();
            } else if (e.key === 'f') {
                setFocusMode(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev]);

    const slideVariants = {
        // اصلاح انیمیشن‌ها برای RTL
        enter: (direction: number) => ({
            x: direction > 0 ? -50 : 50, // اگر دایرکشن مثبت (بعدی) باشه، از چپ میاد
            opacity: 0,
            scale: 0.95
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            x: direction > 0 ? 50 : -50, // به راست خارج میشه
            opacity: 0,
            scale: 0.95
        }),
    };

    return (
        <div
            {...swipeHandlers}
            // 🛠 touch-pan-y: حیاتی‌ترین بخش برای اسکرول نرم در موبایل
            className="fixed inset-0 flex flex-col overflow-hidden bg-slate-900 text-slate-100 touch-pan-y"
            dir="rtl" // ✅ تنظیم دایرکشن کل صفحه
        >
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-0" />

            {/* Header */}
            <motion.header
                className="relative z-20 px-6 pt-6 pb-4 shrink-0"
                animate={{ opacity: focusMode ? 0 : 1, y: focusMode ? -20 : 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-bold text-lg">بند {item.id}</span>
                        <span className="text-slate-500 text-sm">از {total}</span>
                    </div>

                    <button
                        onClick={() => setFocusMode(!focusMode)}
                        className="p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-emerald-400 transition-colors backdrop-blur-md"
                    >
                        {focusMode ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                </div>

                <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden" dir="ltr"> 
                    {/* پراگرس بار معمولا LTR پر میشه حتی در سایت فارسی، اما سلیقه‌ایه */}
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                </div>
            </motion.header>

            {/* Main Content Area (Scrollable) */}
            <div className="relative flex-1 z-10 w-full overflow-y-auto no-scrollbar scroll-smooth">
                <div className="min-h-full flex items-center justify-center px-4 py-8">
                    
                    {/* --- Tap Zones --- */}
                    {/* 🛠 Senior Fix: این دکمه‌های نامرئی در موبایل حذف شدند (hidden) تا مزاحم اسکرول و تاچ نباشند.
                        در دسکتاپ (md:block) که موس هست، نمایش داده می‌شوند. */}
                    
                    {/* Next (Right side in RTL logic for visual symmetry, but physically Previous) */}
                    <div 
                        className="hidden md:block fixed right-0 top-[100px] bottom-[100px] w-24 z-30 cursor-pointer group hover:bg-gradient-to-l from-black/20 to-transparent" 
                        onClick={handlePrev}
                    >
                        <motion.div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <ChevronRight size={40} className="text-slate-400" />
                        </motion.div>
                    </div>

                    {/* Prev (Left side) */}
                    <div 
                        className="hidden md:block fixed left-0 top-[100px] bottom-[100px] w-24 z-30 cursor-pointer group hover:bg-gradient-to-r from-black/20 to-transparent" 
                        onClick={handleNext}
                    >
                        <motion.div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <ChevronLeft size={40} className="text-slate-400" />
                        </motion.div>
                    </div>


                    {/* --- The Card --- */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            // 🛠 z-40 برای اینکه بالاتر از هر لایه مزاحمی باشه
                            className="w-full max-w-lg mx-auto relative z-40"
                        >
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                                
                                {item.arabicText && (
                                    <div className="flex justify-center mb-4">
                                        <button
                                            onClick={toggleArabic}
                                            className={`
                                                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all duration-300 border
                                                ${showArabic 
                                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                                                    : 'bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-700'
                                                }
                                            `}
                                        >
                                            <Languages size={14} />
                                            <span>{showArabic ? 'مخفی کردن عربی' : 'مشاهده متن عربی'}</span>
                                        </button>
                                    </div>
                                )}

                                {item.arabicText && (
                                    <motion.div
                                        initial={false}
                                        animate={{ 
                                            height: showArabic ? 'auto' : 0,
                                            opacity: showArabic ? 1 : 0,
                                            marginBottom: showArabic ? 24 : 0
                                        }}
                                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                        className="overflow-hidden"
                                    >
                                        <p className="font-arabic text-2xl md:text-3xl leading-loose text-amber-100/90 text-center select-none drop-shadow-md" dir="rtl">
                                            {item.arabicText}
                                        </p>
                                        <div className="w-1/2 mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-6" />
                                    </motion.div>
                                )}

                                <p 
                                    className={`
                                        text-lg md:text-xl leading-9 text-justify transition-colors duration-500
                                        ${showArabic ? 'text-slate-300' : 'text-slate-100 font-medium'}
                                    `}
                                >
                                    {item.text}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Milestone Toast Notification */}
                <AnimatePresence>
                    {showMilestone && (
                        <motion.div
                            initial={{ opacity: 0, x: -100, scale: 0.9 }} // RTL: ورود از چپ (یا راست بسته به سلیقه، ولی اینجا وسط یا گوشه چپ بهتره در فارسی)
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -100, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            // RTL: نوتیفیکیشن سمت چپ بالا باشه بهتره یا راست؟ در فارسی معمولا راست استانداردتره
                            className="fixed top-6 left-6 z-[60] max-w-[85vw] md:max-w-sm pointer-events-none"
                            dir="rtl"
                        >
                            <div className="bg-slate-800/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl border-r-4 border-emerald-500 flex items-center gap-3">
                                <div className="bg-emerald-500/20 p-2 rounded-full shrink-0">
                                    <CheckCircle2 size={20} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-emerald-400 font-bold text-sm mb-0.5">تبریک!</p>
                                    <p className="text-slate-200 text-sm font-medium leading-tight">
                                        {milestoneText.replace(/🎉|🌟|💪|✨|🎯|🌙|🏁/g, '')}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <motion.footer
                className="relative z-20 px-6 pb-8 pt-4 shrink-0"
                animate={{ opacity: focusMode ? 0 : 1, y: focusMode ? 20 : 0 }}
                transition={{ duration: 0.3 }}
            >
                <button
                    onClick={handleNext}
                    className={`
                        w-full py-4 rounded-2xl text-lg font-bold shadow-lg transition-all transform active:scale-[0.98] 
                        flex items-center justify-center gap-3
                        ${isLastItem
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/20'
                            : 'bg-white/10 text-slate-200 hover:bg-white/15 backdrop-blur-md'
                        }
                    `}
                >
                    {isLastItem ? (
                        <>
                            <span>پایان و ثبت</span>
                            <span className="text-2xl">✓</span>
                        </>
                    ) : (
                        <>
                            <span>بعدی</span>
                            <ChevronLeft size={22} />
                        </>
                    )}
                </button>

                <p className="text-center text-slate-600 text-xs mt-4">
                    بکش به راست یا ضربه بزن
                </p>
            </motion.footer>

            {focusMode && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
                >
                    <button
                        onClick={() => setFocusMode(false)}
                        className="text-slate-400 text-xs px-4 py-2 rounded-full bg-black/50 backdrop-blur"
                    >
                        ضربه برای نمایش کنترل‌ها
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default ReadingView;