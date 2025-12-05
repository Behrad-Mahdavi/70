// global.d.ts - تایپ‌های سفارشی برای TypeScript
interface Window {
    deferredPrompt: any;
}

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
}
