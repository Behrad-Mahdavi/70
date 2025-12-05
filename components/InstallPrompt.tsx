import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, PlusSquare, Download, Smartphone } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        // 1. چک کردن اینکه آیا اپ قبلاً نصب شده یا نه
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) return; // اگر نصب بود، چیزی نشان نده

        // 2. چک کردن اینکه آیا کاربر قبلاً این پیام را بسته است؟
        const hasDismissed = localStorage.getItem('install_prompt_dismissed');
        if (hasDismissed) {
            // بررسی اینکه آیا ۱۰ روز گذشته یا نه
            const dismissedTime = parseInt(hasDismissed, 10);
            const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedTime < tenDaysInMs) {
                return; // هنوز ۱۰ روز نگذشته، نشان نده
            }
        }

        // 3. تشخیص سیستم عامل iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        if (ios) {
            // برای iOS بلافاصله نشان بده (چون رویداد سیستمی ندارد)
            setTimeout(() => setShowPrompt(true), 3000);
        } else {
            // برای اندروید/کروم منتظر رویداد سیستم باش
            const handleBeforeInstallPrompt = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e as BeforeInstallPromptEvent);
                setTimeout(() => setShowPrompt(true), 3000);
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            };
        }
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // ذخیره زمان بستن تا ۱۰ روز دیگر نشان ندهد
        localStorage.setItem('install_prompt_dismissed', Date.now().toString());
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 500 }}
                    className="fixed bottom-4 left-4 right-4 z-[100] md:max-w-sm md:mx-auto"
                    dir="rtl"
                >
                    <div className="bg-slate-800/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400">
                                    <Smartphone size={24} />
                                </div>
                                <div>
                                    <h3 className="text-slate-100 font-bold text-sm">نصب اپلیکیشن</h3>
                                    <p className="text-slate-400 text-xs mt-0.5">
                                        برای دسترسی راحت‌تر و بدون اینترنت
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="text-slate-500 hover:text-slate-300 p-1 transition-colors"
                                aria-label="بستن"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content based on OS */}
                        {isIOS ? (
                            // iOS Instructions
                            <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
                                <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
                                    <span className="flex items-center justify-center w-5 h-5 bg-slate-700 rounded text-blue-400">
                                        <Share size={12} />
                                    </span>
                                    <span>۱. دکمه <b>Share</b> در پایین مرورگر را بزنید</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                    <span className="flex items-center justify-center w-5 h-5 bg-slate-700 rounded text-slate-200">
                                        <PlusSquare size={12} />
                                    </span>
                                    <span>۲. گزینه <b>Add to Home Screen</b> را انتخاب کنید</span>
                                </div>
                            </div>
                        ) : (
                            // Android Button
                            <button
                                onClick={handleInstallClick}
                                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-[0.98]"
                            >
                                <Download size={18} />
                                <span>نصب و افزودن به صفحه اصلی</span>
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPrompt;
