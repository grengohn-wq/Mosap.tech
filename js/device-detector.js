/**
 * نظام كشف الجهاز والتكيف التلقائي - Mosap.tech
 * يحدد نوع الجهاز ويطبق التخصيصات المناسبة
 */

class DeviceDetector {
    constructor() {
        this.deviceInfo = this.detectDevice();
        this.init();
    }

    // كشف نوع الجهاز ومواصفاته
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const devicePixelRatio = window.devicePixelRatio || 1;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        let deviceType = 'desktop';
        let deviceCategory = 'computer';
        let orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';

        // تحديد نوع الجهاز بناءً على User Agent وحجم الشاشة
        if (/android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent)) {
            if (screenWidth <= 480) {
                deviceType = 'mobile';
                deviceCategory = 'phone';
            } else if (screenWidth <= 768) {
                deviceType = 'tablet-small';
                deviceCategory = 'tablet';
            } else if (screenWidth <= 1024) {
                deviceType = 'tablet-large';
                deviceCategory = 'tablet';
            } else {
                deviceType = 'desktop';
                deviceCategory = 'computer';
            }
        } else {
            if (screenWidth <= 480) {
                deviceType = 'mobile';
                deviceCategory = 'phone';
            } else if (screenWidth <= 768) {
                deviceType = 'tablet-small';
                deviceCategory = 'tablet';
            } else if (screenWidth <= 1024) {
                deviceType = 'tablet-large';
                deviceCategory = 'tablet';
            } else if (screenWidth <= 1366) {
                deviceType = 'laptop';
                deviceCategory = 'laptop';
            } else {
                deviceType = 'desktop';
                deviceCategory = 'desktop';
            }
        }

        // كشف نوع النظام
        let os = 'unknown';
        if (/android/i.test(userAgent)) os = 'android';
        else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'ios';
        else if (/windows/i.test(userAgent)) os = 'windows';
        else if (/macintosh|mac os x/i.test(userAgent)) os = 'macos';
        else if (/linux/i.test(userAgent)) os = 'linux';

        // كشف المتصفح
        let browser = 'unknown';
        if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'chrome';
        else if (/firefox/i.test(userAgent)) browser = 'firefox';
        else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'safari';
        else if (/edge/i.test(userAgent)) browser = 'edge';

        return {
            type: deviceType,
            category: deviceCategory,
            os: os,
            browser: browser,
            width: screenWidth,
            height: screenHeight,
            orientation: orientation,
            pixelRatio: devicePixelRatio,
            isTouch: isTouchDevice,
            isRetina: devicePixelRatio > 1,
            isMobile: deviceCategory === 'phone',
            isTablet: deviceCategory === 'tablet',
            isDesktop: deviceCategory === 'computer' || deviceCategory === 'laptop' || deviceCategory === 'desktop'
        };
    }

    // تهيئة النظام
    init() {
        this.applyDeviceClasses();
        this.setupEventListeners();
        this.optimizeForDevice();
        this.setupTextAd();
        
        console.log('🔍 تم كشف الجهاز:', this.deviceInfo);
    }

    // إضافة classes مناسبة لنوع الجهاز
    applyDeviceClasses() {
        const body = document.body;
        const html = document.documentElement;
        
        // إضافة معلومات الجهاز كـ classes
        body.classList.add(
            `device-${this.deviceInfo.type}`,
            `os-${this.deviceInfo.os}`,
            `browser-${this.deviceInfo.browser}`,
            `orientation-${this.deviceInfo.orientation}`
        );

        if (this.deviceInfo.isTouch) body.classList.add('touch-device');
        if (this.deviceInfo.isRetina) body.classList.add('retina-device');
        if (this.deviceInfo.isMobile) body.classList.add('mobile-device');
        if (this.deviceInfo.isTablet) body.classList.add('tablet-device');
        if (this.deviceInfo.isDesktop) body.classList.add('desktop-device');

        // إضافة متغيرات CSS مخصصة
        html.style.setProperty('--device-width', `${this.deviceInfo.width}px`);
        html.style.setProperty('--device-height', `${this.deviceInfo.height}px`);
        html.style.setProperty('--pixel-ratio', this.deviceInfo.pixelRatio);
    }

    // مراقبة التغييرات (تدوير الشاشة، تغيير حجم النافذة)
    setupEventListeners() {
        let resizeTimer;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.deviceInfo = this.detectDevice();
                this.applyDeviceClasses();
                this.optimizeForDevice();
            }, 250);
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.deviceInfo = this.detectDevice();
                this.applyDeviceClasses();
                this.optimizeForDevice();
            }, 500);
        });
    }

    // تحسينات خاصة بنوع الجهاز
    optimizeForDevice() {
        if (this.deviceInfo.isMobile) {
            this.optimizeForMobile();
        } else if (this.deviceInfo.isTablet) {
            this.optimizeForTablet();
        } else {
            this.optimizeForDesktop();
        }
    }

    // تحسينات للهواتف
    optimizeForMobile() {
        // تقليل عدد الأدوات المعروضة
        const toolsGrid = document.querySelector('.tools-grid');
        if (toolsGrid) {
            toolsGrid.style.gridTemplateColumns = '1fr';
        }

        // تكبير أزرار اللمس
        const buttons = document.querySelectorAll('.tool-btn, .btn');
        buttons.forEach(btn => {
            btn.style.minHeight = '48px';
            btn.style.padding = '12px 20px';
        });

        // تحسين مناطق الرفع
        const uploadAreas = document.querySelectorAll('.upload-area');
        uploadAreas.forEach(area => {
            area.style.minHeight = '120px';
            area.style.padding = '20px';
        });

        // إخفاء عناصر غير ضرورية
        const desktopOnly = document.querySelectorAll('.desktop-only');
        desktopOnly.forEach(el => el.style.display = 'none');
    }

    // تحسينات للأجهزة اللوحية
    optimizeForTablet() {
        const toolsGrid = document.querySelector('.tools-grid');
        if (toolsGrid) {
            if (this.deviceInfo.width <= 768) {
                toolsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            } else {
                toolsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            }
        }

        // تحسين للوحة المفاتيح الافتراضية
        if (this.deviceInfo.os === 'ios') {
            this.handleVirtualKeyboard();
        }
    }

    // تحسينات لأجهزة الكمبيوتر
    optimizeForDesktop() {
        const toolsGrid = document.querySelector('.tools-grid');
        if (toolsGrid) {
            if (this.deviceInfo.width <= 1366) {
                toolsGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
            } else {
                toolsGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
            }
        }

        // إظهار عناصر الكمبيوتر فقط
        const desktopOnly = document.querySelectorAll('.desktop-only');
        desktopOnly.forEach(el => el.style.display = 'block');

        // إخفاء عناصر الهاتف
        const mobileOnly = document.querySelectorAll('.mobile-only');
        mobileOnly.forEach(el => el.style.display = 'none');
    }

    // التعامل مع لوحة المفاتيح الافتراضية في iOS
    handleVirtualKeyboard() {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });
    }

    // إعداد الإعلان النصي
    setupTextAd() {
        this.createTextAdBanner();
        this.loadTextAdContent();
    }

    // إنشاء منطقة الإعلان النصي
    createTextAdBanner() {
        // البحث عن مكان الإعلان (بعد الهيدر مباشرة)
        const header = document.querySelector('.header');
        if (!header) return;

        // إنشاء الإعلان النصي
        const textAdBanner = document.createElement('div');
        textAdBanner.id = 'text-ad-banner';
        textAdBanner.className = 'text-ad-banner hidden';
        textAdBanner.innerHTML = `
            <button class="text-ad-close" onclick="this.parentElement.classList.add('hidden')">&times;</button>
            <div class="text-ad-content">
                <div class="text-ad-title"></div>
                <div class="text-ad-description"></div>
                <a href="#" class="text-ad-cta" target="_blank"></a>
            </div>
        `;

        // إدراج الإعلان بعد الهيدر
        header.insertAdjacentElement('afterend', textAdBanner);
    }

    // تحميل محتوى الإعلان من إعدادات الإدارة
    loadTextAdContent() {
        const textAdSettings = localStorage.getItem('text-ad-settings');
        if (textAdSettings) {
            try {
                const settings = JSON.parse(textAdSettings);
                this.displayTextAd(settings);
            } catch (e) {
                console.warn('فشل في تحميل إعدادات الإعلان النصي:', e);
            }
        }
    }

    // عرض الإعلان النصي
    displayTextAd(settings) {
        const banner = document.getElementById('text-ad-banner');
        if (!banner || !settings.enabled) return;

        const title = banner.querySelector('.text-ad-title');
        const description = banner.querySelector('.text-ad-description');
        const cta = banner.querySelector('.text-ad-cta');

        if (title) title.textContent = settings.title || '';
        if (description) description.textContent = settings.description || '';
        if (cta) {
            cta.textContent = settings.ctaText || 'اضغط هنا';
            cta.href = settings.ctaUrl || '#';
        }

        // إظهار الإعلان مع تأخير بسيط
        setTimeout(() => {
            banner.classList.remove('hidden');
            banner.classList.add('fade-in');
        }, 1000);
    }

    // الحصول على معلومات الجهاز
    getDeviceInfo() {
        return this.deviceInfo;
    }

    // تحديث إعدادات الجهاز
    updateSettings() {
        this.deviceInfo = this.detectDevice();
        this.applyDeviceClasses();
        this.optimizeForDevice();
    }
}

// تهيئة كاشف الجهاز عند تحميل الصفحة
let deviceDetector;

document.addEventListener('DOMContentLoaded', function() {
    deviceDetector = new DeviceDetector();
    
    // ربط مع نظام إدارة الموقع
    if (window.siteManager) {
        window.siteManager.deviceDetector = deviceDetector;
    }
});

// تصدير للاستخدام العام
window.DeviceDetector = DeviceDetector;

// تحسينات إضافية للأداء
document.addEventListener('DOMContentLoaded', function() {
    // إضافة تأثيرات الحركة التدريجية
    const elements = document.querySelectorAll('.tool-card, .hero, .about-section');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
        el.classList.add('fade-in');
    });

    // تحسين الصور للأجهزة المختلفة
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (deviceDetector && deviceDetector.deviceInfo.isRetina) {
            // تحسين للشاشات عالية الدقة
            img.style.imageRendering = 'crisp-edges';
        }
    });
});

// مراقبة تغيير اتجاه الشاشة
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        if (deviceDetector) {
            deviceDetector.updateSettings();
        }
    }, 500);
});