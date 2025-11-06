/**
 * نظام إدارة الإعدادات المركزي - Mosap.tech
 * يدير جميع إعدادات الموقع من لوحة الإدارة
 */

class SiteManager {
    constructor() {
        this.settings = this.loadSettings();
        this.adsenseSettings = this.loadAdSenseSettings();
        this.stats = this.loadStats();
        
        // تطبيق الإعدادات عند تحميل الصفحة
        this.applySettings();
    }

    // تحميل الإعدادات العامة
    loadSettings() {
        const saved = localStorage.getItem('site-settings');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            siteTitle: 'Mosap.tech - أدوات معالجة الصور المجانية',
            siteDescription: 'موقع متخصص في أدوات معالجة الصور المجانية والآمنة',
            googleAnalytics: '',
            maintenanceMode: 'off',
            lastUpdated: new Date().toISOString()
        };
    }

    // تحميل إعدادات AdSense
    loadAdSenseSettings() {
        const saved = localStorage.getItem('adsense-settings');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            publisherId: '',
            headerCode: '',
            sidebarCode: '',
            footerCode: '',
            enabled: false,
            lastUpdated: new Date().toISOString()
        };
    }

    // تحميل الإحصائيات (مع إحصائيات حقيقية بسيطة)
    loadStats() {
        let saved = localStorage.getItem('site-stats');
        if (saved) {
            saved = JSON.parse(saved);
        } else {
            saved = {
                totalVisitors: 0,
                todayVisitors: 0,
                totalDownloads: 0,
                todayDownloads: 0,
                toolUsage: {},
                lastReset: new Date().toDateString()
            };
        }

        // إعادة تعيين إحصائيات اليوم إذا تغير التاريخ
        const today = new Date().toDateString();
        if (saved.lastReset !== today) {
            saved.todayVisitors = 0;
            saved.todayDownloads = 0;
            saved.lastReset = today;
            this.saveStats(saved);
        }

        return saved;
    }

    // حفظ الإحصائيات
    saveStats(stats) {
        localStorage.setItem('site-stats', JSON.stringify(stats));
        this.stats = stats;
    }

    // تسجيل زيارة جديدة
    recordVisit() {
        if (!sessionStorage.getItem('visit-recorded')) {
            this.stats.totalVisitors++;
            this.stats.todayVisitors++;
            sessionStorage.setItem('visit-recorded', 'true');
            this.saveStats(this.stats);
        }
    }

    // تسجيل تحميل
    recordDownload(toolName = 'unknown') {
        this.stats.totalDownloads++;
        this.stats.todayDownloads++;
        
        if (!this.stats.toolUsage[toolName]) {
            this.stats.toolUsage[toolName] = 0;
        }
        this.stats.toolUsage[toolName]++;
        
        this.saveStats(this.stats);
    }

    // تطبيق إعدادات الموقع
    applySettings() {
        // تطبيق عنوان الصفحة
        if (this.settings.siteTitle) {
            document.title = this.settings.siteTitle;
            
            // تحديث عنوان الصفحة في العناصر
            const titleElements = document.querySelectorAll('h1.hero-title');
            titleElements.forEach(el => {
                if (el.textContent.includes('منصة أدوات الصور')) {
                    el.textContent = this.settings.siteTitle.split(' - ')[0];
                }
            });
        }

        // تطبيق وصف الصفحة
        if (this.settings.siteDescription) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', this.settings.siteDescription);
            }
        }

        // تطبيق Google Analytics
        if (this.settings.googleAnalytics && this.settings.googleAnalytics.trim() !== '') {
            this.injectGoogleAnalytics();
        }

        // تطبيق وضع الصيانة
        if (this.settings.maintenanceMode === 'on') {
            this.enableMaintenanceMode();
        }

        // تطبيق إعلانات AdSense
        if (this.adsenseSettings.enabled) {
            this.injectAdSenseAds();
        }
        
        // تطبيق الإعلانات النصية
        this.loadTextAdSettings();
    }

    // حقن Google Analytics
    injectGoogleAnalytics() {
        if (this.settings.googleAnalytics.includes('gtag')) {
            const script = document.createElement('div');
            script.innerHTML = this.settings.googleAnalytics;
            document.head.appendChild(script);
        }
    }

    // تفعيل وضع الصيانة
    enableMaintenanceMode() {
        const maintenanceHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: 'Cairo', sans-serif;
            ">
                <i class="fas fa-tools" style="font-size: 4rem; margin-bottom: 2rem; color: #007AFF;"></i>
                <h1 style="margin: 0 0 1rem 0;">الموقع قيد الصيانة</h1>
                <p style="margin: 0; color: #ccc;">نعمل على تحسين الخدمة. نعتذر عن الإزعاج.</p>
                <p style="margin: 1rem 0 0 0; font-size: 0.9rem; color: #999;">سنعود قريباً...</p>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', maintenanceHTML);
    }

    // حقن إعلانات AdSense
    injectAdSenseAds() {
        // إعلان الهيدر
        if (this.adsenseSettings.headerCode) {
            const headerAd = document.querySelector('.header-ad');
            if (headerAd) {
                headerAd.innerHTML = this.adsenseSettings.headerCode;
            }
        }

        // إعلان السايدبار (إذا وجد)
        if (this.adsenseSettings.sidebarCode) {
            const sidebarAd = document.querySelector('.sidebar-ad');
            if (sidebarAd) {
                sidebarAd.innerHTML = this.adsenseSettings.sidebarCode;
            }
        }

        // إعلان الفوتر
        if (this.adsenseSettings.footerCode) {
            const footerAd = document.querySelector('.footer-ad');
            if (footerAd) {
                footerAd.innerHTML = this.adsenseSettings.footerCode;
            }
        }
    }

    // تحديث إعدادات الموقع
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.settings.lastUpdated = new Date().toISOString();
        localStorage.setItem('site-settings', JSON.stringify(this.settings));
        
        // إعادة تطبيق الإعدادات
        setTimeout(() => {
            this.applySettings();
        }, 100);
    }

    // تحديث إعدادات AdSense
    updateAdSenseSettings(newSettings) {
        this.adsenseSettings = { ...this.adsenseSettings, ...newSettings };
        this.adsenseSettings.lastUpdated = new Date().toISOString();
        localStorage.setItem('adsense-settings', JSON.stringify(this.adsenseSettings));
        
        // إعادة تطبيق الإعلانات
        setTimeout(() => {
            this.injectAdSenseAds();
        }, 100);
    }

    // الحصول على الإحصائيات الحالية
    getStats() {
        return {
            visitorsToday: this.stats.todayVisitors,
            totalVisitors: this.stats.totalVisitors,
            downloadsToday: this.stats.todayDownloads,
            totalDownloads: this.stats.totalDownloads,
            toolUsage: this.stats.toolUsage,
            uptime: '99.8%', // يمكن حسابها بناءً على وقت تشغيل الخادم
            earnings: '$0.00' // يحتاج ربط مع AdSense API
        };
    }

    // تحميل وتطبيق إعدادات الإعلانات النصية
    loadTextAdSettings() {
        const textAdSettings = localStorage.getItem('text-ad-settings');
        if (textAdSettings) {
            try {
                const settings = JSON.parse(textAdSettings);
                if (settings.enabled) {
                    this.displayTextAd(settings);
                } else {
                    this.hideTextAd();
                }
            } catch (e) {
                console.warn('فشل في تحميل إعدادات الإعلان النصي:', e);
            }
        } else {
            this.hideTextAd();
        }
    }

    // إخفاء الإعلان النصي
    hideTextAd() {
        const textAdBanner = document.getElementById('text-ad-banner');
        if (textAdBanner) {
            textAdBanner.classList.add('hidden');
            // إزالة العنصر بالكامل بعد الانيميشن
            setTimeout(() => {
                if (textAdBanner.parentNode) {
                    textAdBanner.parentNode.removeChild(textAdBanner);
                }
            }, 300);
        }
    }

    // عرض الإعلان النصي
    displayTextAd(settings) {
        // إنشاء الإعلان النصي إذا لم يكن موجوداً
        let textAdBanner = document.getElementById('text-ad-banner');
        if (!textAdBanner) {
            const header = document.querySelector('.header');
            if (!header) return;

            textAdBanner = document.createElement('div');
            textAdBanner.id = 'text-ad-banner';
            textAdBanner.className = 'text-ad-banner';
            textAdBanner.innerHTML = `
                <button class="text-ad-close" onclick="this.parentElement.classList.add('hidden'); siteManager.recordTextAdClose();">&times;</button>
                <div class="text-ad-content">
                    <div class="text-ad-title"></div>
                    <div class="text-ad-description"></div>
                    <a href="#" class="text-ad-cta" target="_blank" onclick="siteManager.recordTextAdClick();"></a>
                </div>
            `;
            header.insertAdjacentElement('afterend', textAdBanner);
        }

        // تطبيق المحتوى
        const title = textAdBanner.querySelector('.text-ad-title');
        const description = textAdBanner.querySelector('.text-ad-description');
        const cta = textAdBanner.querySelector('.text-ad-cta');

        if (title) title.textContent = settings.title || '';
        if (description) description.textContent = settings.description || '';
        if (cta) {
            cta.textContent = settings.ctaText || 'اضغط هنا';
            cta.href = settings.ctaUrl || '#';
        }

        // تطبيق اللون
        if (settings.color) {
            const colorMap = {
                blue: '#007AFF',
                green: '#28a745',
                red: '#dc3545',
                orange: '#fd7e14',
                purple: '#6f42c1',
                gray: '#6c757d'
            };
            
            if (title) title.style.color = colorMap[settings.color];
            if (cta) cta.style.backgroundColor = colorMap[settings.color];
        }

        // إظهار الإعلان مع تسجيل ظهور
        textAdBanner.classList.remove('hidden');
        textAdBanner.classList.add('fade-in');
        this.recordTextAdImpression();
    }

    // تسجيل ظهور الإعلان النصي
    recordTextAdImpression() {
        const stats = JSON.parse(localStorage.getItem('text-ad-stats') || '{"impressions": 0, "clicks": 0}');
        stats.impressions++;
        localStorage.setItem('text-ad-stats', JSON.stringify(stats));
    }

    // تسجيل نقرة على الإعلان النصي
    recordTextAdClick() {
        const stats = JSON.parse(localStorage.getItem('text-ad-stats') || '{"impressions": 0, "clicks": 0}');
        stats.clicks++;
        localStorage.setItem('text-ad-stats', JSON.stringify(stats));
    }

    // تسجيل إغلاق الإعلان النصي
    recordTextAdClose() {
        // يمكن إضافة إحصائيات إضافية هنا
        console.log('تم إغلاق الإعلان النصي');
    }

    // إضافة مناطق للإعلانات في الصفحة
    addAdZones() {
        // إضافة منطقة إعلان في الهيدر
        const header = document.querySelector('.header');
        if (header && !document.querySelector('.header-ad')) {
            const headerAd = document.createElement('div');
            headerAd.className = 'header-ad';
            headerAd.style.cssText = 'text-align: center; padding: 10px; background: #f8f9fa;';
            header.insertAdjacentElement('afterend', headerAd);
        }

        // إضافة منطقة إعلان في الفوتر
        const footer = document.querySelector('.footer');
        if (footer && !document.querySelector('.footer-ad')) {
            const footerAd = document.createElement('div');
            footerAd.className = 'footer-ad';
            footerAd.style.cssText = 'text-align: center; padding: 20px; background: #f8f9fa; border-top: 1px solid #e0e0e0;';
            footer.insertAdjacentElement('beforebegin', footerAd);
        }
    }

    // إعادة تحميل الإعلانات النصية (للاستخدام الخارجي)
    refreshTextAd() {
        this.loadTextAdSettings();
    }
}

// إنشاء مثيل عام من مدير الموقع
let siteManager;

// تهيئة المدير عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    siteManager = new SiteManager();
    
    // تسجيل الزيارة
    siteManager.recordVisit();
    
    // إضافة مناطق الإعلانات
    siteManager.addAdZones();
});

// مراقبة تغييرات الإعلانات النصية
setInterval(function() {
    if (window.siteManager) {
        const textAdSettings = localStorage.getItem('text-ad-settings');
        const currentAd = document.getElementById('text-ad-banner');
        
        if (!textAdSettings || !JSON.parse(textAdSettings).enabled) {
            // إذا تم حذف الإعلان أو تعطيله، إخفاؤه فوراً
            if (currentAd && !currentAd.classList.contains('hidden')) {
                window.siteManager.hideTextAd();
            }
        } else {
            // إذا تم تفعيل إعلان جديد أو تحديث موجود
            const settings = JSON.parse(textAdSettings);
            if (!currentAd || currentAd.classList.contains('hidden')) {
                window.siteManager.displayTextAd(settings);
            }
        }
    }
}, 2000); // فحص كل ثانيتين

// تصدير للاستخدام العام
window.SiteManager = SiteManager;