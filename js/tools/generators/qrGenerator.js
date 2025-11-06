/**
 * QR Code Generator Tool
 * أداة توليد رموز QR مع خيارات تخصيص متقدمة
 */

import UIHelpers from '../utils/uiHelpers.js';

class QRGenerator {
    constructor() {
        this.uiHelpers = new UIHelpers();
        this.currentQRCode = null;
        this.qrHistory = [];
        this.maxHistoryItems = 10;
        
        // إعدادات افتراضية
        this.defaultSettings = {
            size: 256,
            margin: 4,
            colorDark: '#000000',
            colorLight: '#ffffff',
            errorCorrectionLevel: 'M',
            format: 'png'
        };

        // أنواع البيانات المدعومة
        this.dataTypes = {
            text: { name: 'نص عادي', icon: 'fas fa-font' },
            url: { name: 'رابط URL', icon: 'fas fa-link' },
            email: { name: 'بريد إلكتروني', icon: 'fas fa-envelope' },
            phone: { name: 'رقم هاتف', icon: 'fas fa-phone' },
            wifi: { name: 'شبكة WiFi', icon: 'fas fa-wifi' },
            contact: { name: 'جهة اتصال', icon: 'fas fa-user' },
            sms: { name: 'رسالة SMS', icon: 'fas fa-sms' },
            location: { name: 'موقع جغرافي', icon: 'fas fa-map-marker-alt' }
        };
    }

    /**
     * تهيئة أداة توليد QR
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
        this.loadQRLibrary();
    }

    /**
     * تحميل مكتبة QR Code
     */
    async loadQRLibrary() {
        try {
            if (typeof QRCode === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js');
            }
        } catch (error) {
            console.error('فشل في تحميل مكتبة QR Code:', error);
            this.uiHelpers.showNotification('فشل في تحميل مكتبة QR Code', 'error');
        }
    }

    /**
     * تحميل سكريبت خارجي
     * @param {string} src 
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * إنشاء واجهة أداة توليد QR
     */
    createInterface() {
        const controlsSection = document.getElementById('controls-section');
        if (!controlsSection) return;

        controlsSection.innerHTML = `
            <div class="control-panel">
                <div class="control-header">
                    <i class="fas fa-qrcode"></i>
                    <h3>مولد رموز QR</h3>
                </div>
                
                <div class="control-group">
                    <!-- اختيار نوع البيانات -->
                    <div class="data-type-selector">
                        <h4>نوع البيانات</h4>
                        <div class="data-types-grid">
                            ${Object.keys(this.dataTypes).map(type => `
                                <div class="data-type-item ${type === 'text' ? 'active' : ''}" data-type="${type}">
                                    <i class="${this.dataTypes[type].icon}"></i>
                                    <span>${this.dataTypes[type].name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- إدخال البيانات -->
                    <div class="data-input-section">
                        <h4>محتوى الرمز</h4>
                        
                        <!-- نموذج النص العادي -->
                        <div class="data-form active" id="text-form">
                            <div class="control-row">
                                <label class="control-label">النص</label>
                                <textarea id="text-content" class="form-textarea" 
                                         placeholder="أدخل النص المراد تحويله إلى رمز QR..." 
                                         rows="4"></textarea>
                            </div>
                        </div>

                        <!-- نموذج الرابط -->
                        <div class="data-form" id="url-form">
                            <div class="control-row">
                                <label class="control-label">عنوان URL</label>
                                <input type="url" id="url-content" class="form-input" 
                                       placeholder="https://example.com">
                            </div>
                        </div>

                        <!-- نموذج البريد الإلكتروني -->
                        <div class="data-form" id="email-form">
                            <div class="control-row">
                                <label class="control-label">البريد الإلكتروني</label>
                                <input type="email" id="email-address" class="form-input" 
                                       placeholder="example@domain.com">
                            </div>
                            <div class="control-row">
                                <label class="control-label">الموضوع (اختياري)</label>
                                <input type="text" id="email-subject" class="form-input" 
                                       placeholder="موضوع الرسالة">
                            </div>
                            <div class="control-row">
                                <label class="control-label">الرسالة (اختياري)</label>
                                <textarea id="email-body" class="form-textarea" 
                                         placeholder="نص الرسالة..." rows="3"></textarea>
                            </div>
                        </div>

                        <!-- نموذج الهاتف -->
                        <div class="data-form" id="phone-form">
                            <div class="control-row">
                                <label class="control-label">رقم الهاتف</label>
                                <input type="tel" id="phone-number" class="form-input" 
                                       placeholder="+966501234567">
                            </div>
                        </div>

                        <!-- نموذج WiFi -->
                        <div class="data-form" id="wifi-form">
                            <div class="control-row">
                                <label class="control-label">اسم الشبكة (SSID)</label>
                                <input type="text" id="wifi-ssid" class="form-input" 
                                       placeholder="اسم شبكة WiFi">
                            </div>
                            <div class="control-row">
                                <label class="control-label">كلمة المرور</label>
                                <input type="text" id="wifi-password" class="form-input" 
                                       placeholder="كلمة مرور الشبكة">
                            </div>
                            <div class="control-row">
                                <label class="control-label">نوع التشفير</label>
                                <select id="wifi-security" class="form-select">
                                    <option value="WPA">WPA/WPA2</option>
                                    <option value="WEP">WEP</option>
                                    <option value="nopass">بدون كلمة مرور</option>
                                </select>
                            </div>
                        </div>

                        <!-- نموذج جهة الاتصال -->
                        <div class="data-form" id="contact-form">
                            <div class="control-row">
                                <label class="control-label">الاسم</label>
                                <input type="text" id="contact-name" class="form-input" 
                                       placeholder="الاسم الكامل">
                            </div>
                            <div class="control-row">
                                <label class="control-label">الهاتف</label>
                                <input type="tel" id="contact-phone" class="form-input" 
                                       placeholder="+966501234567">
                            </div>
                            <div class="control-row">
                                <label class="control-label">البريد الإلكتروني</label>
                                <input type="email" id="contact-email" class="form-input" 
                                       placeholder="email@example.com">
                            </div>
                            <div class="control-row">
                                <label class="control-label">المنظمة</label>
                                <input type="text" id="contact-org" class="form-input" 
                                       placeholder="اسم الشركة أو المنظمة">
                            </div>
                        </div>

                        <!-- نموذج SMS -->
                        <div class="data-form" id="sms-form">
                            <div class="control-row">
                                <label class="control-label">رقم الهاتف</label>
                                <input type="tel" id="sms-number" class="form-input" 
                                       placeholder="+966501234567">
                            </div>
                            <div class="control-row">
                                <label class="control-label">نص الرسالة</label>
                                <textarea id="sms-message" class="form-textarea" 
                                         placeholder="نص رسالة SMS..." rows="3"></textarea>
                            </div>
                        </div>

                        <!-- نموذج الموقع -->
                        <div class="data-form" id="location-form">
                            <div class="control-row">
                                <label class="control-label">خط العرض (Latitude)</label>
                                <input type="number" id="location-lat" class="form-input" 
                                       placeholder="24.7136" step="any">
                            </div>
                            <div class="control-row">
                                <label class="control-label">خط الطول (Longitude)</label>
                                <input type="number" id="location-lng" class="form-input" 
                                       placeholder="46.6753" step="any">
                            </div>
                        </div>
                    </div>

                    <!-- إعدادات التصميم -->
                    <div class="design-settings">
                        <h4>إعدادات التصميم</h4>
                        
                        <div class="settings-grid">
                            <div class="control-row">
                                <label class="control-label">الحجم</label>
                                <div class="control-input-group">
                                    <input type="range" id="qr-size" class="form-range" 
                                           min="128" max="512" step="32" value="256">
                                    <span class="range-value" id="size-value">256px</span>
                                </div>
                            </div>

                            <div class="control-row">
                                <label class="control-label">الهامش</label>
                                <div class="control-input-group">
                                    <input type="range" id="qr-margin" class="form-range" 
                                           min="0" max="10" step="1" value="4">
                                    <span class="range-value" id="margin-value">4</span>
                                </div>
                            </div>

                            <div class="control-row">
                                <label class="control-label">لون المقدمة</label>
                                <div class="color-input-group">
                                    <input type="color" id="color-dark" class="form-color" value="#000000">
                                    <input type="text" id="color-dark-text" class="form-input color-text" value="#000000">
                                </div>
                            </div>

                            <div class="control-row">
                                <label class="control-label">لون الخلفية</label>
                                <div class="color-input-group">
                                    <input type="color" id="color-light" class="form-color" value="#ffffff">
                                    <input type="text" id="color-light-text" class="form-input color-text" value="#ffffff">
                                </div>
                            </div>

                            <div class="control-row">
                                <label class="control-label">مستوى تصحيح الأخطاء</label>
                                <select id="error-correction" class="form-select">
                                    <option value="L">منخفض (~7%)</option>
                                    <option value="M" selected>متوسط (~15%)</option>
                                    <option value="Q">عالي (~25%)</option>
                                    <option value="H">عالي جداً (~30%)</option>
                                </select>
                            </div>

                            <div class="control-row">
                                <label class="control-label">تنسيق التصدير</label>
                                <select id="export-format" class="form-select">
                                    <option value="png" selected>PNG</option>
                                    <option value="jpeg">JPEG</option>
                                    <option value="svg">SVG</option>
                                </select>
                            </div>
                        </div>

                        <!-- ألوان جاهزة -->
                        <div class="color-presets">
                            <h5>ألوان جاهزة</h5>
                            <div class="preset-colors">
                                <div class="color-preset active" data-dark="#000000" data-light="#ffffff">
                                    <div class="preset-dark" style="background: #000000;"></div>
                                    <div class="preset-light" style="background: #ffffff;"></div>
                                </div>
                                <div class="color-preset" data-dark="#1a365d" data-light="#e6fffa">
                                    <div class="preset-dark" style="background: #1a365d;"></div>
                                    <div class="preset-light" style="background: #e6fffa;"></div>
                                </div>
                                <div class="color-preset" data-dark="#742a2a" data-light="#fed7d7">
                                    <div class="preset-dark" style="background: #742a2a;"></div>
                                    <div class="preset-light" style="background: #fed7d7;"></div>
                                </div>
                                <div class="color-preset" data-dark="#2d3748" data-light="#f7fafc">
                                    <div class="preset-dark" style="background: #2d3748;"></div>
                                    <div class="preset-light" style="background: #f7fafc;"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- معاينة مباشرة -->
                    <div class="qr-preview-section">
                        <h4>المعاينة</h4>
                        <div class="qr-preview-container">
                            <div class="qr-canvas-wrapper">
                                <canvas id="qr-canvas" width="256" height="256"></canvas>
                                <div class="qr-placeholder" id="qr-placeholder">
                                    <i class="fas fa-qrcode"></i>
                                    <p>أدخل المحتوى لإنشاء رمز QR</p>
                                </div>
                            </div>
                            <div class="qr-info" id="qr-info" style="display: none;">
                                <div class="info-item">
                                    <label>الحجم:</label>
                                    <span id="qr-size-info">-</span>
                                </div>
                                <div class="info-item">
                                    <label>البيانات:</label>
                                    <span id="qr-data-length">-</span>
                                </div>
                                <div class="info-item">
                                    <label>النوع:</label>
                                    <span id="qr-type-info">-</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- أزرار التحكم -->
                    <div class="control-actions">
                        <button id="generate-qr-btn" class="btn btn-primary" disabled>
                            <i class="fas fa-magic"></i>
                            إنشاء رمز QR
                        </button>
                        
                        <button id="download-qr-btn" class="btn btn-success" disabled>
                            <i class="fas fa-download"></i>
                            تحميل الرمز
                        </button>
                        
                        <button id="save-to-history-btn" class="btn btn-secondary" disabled>
                            <i class="fas fa-save"></i>
                            حفظ في السجل
                        </button>
                        
                        <button id="reset-qr-btn" class="btn btn-outline">
                            <i class="fas fa-refresh"></i>
                            إعادة تعيين
                        </button>
                    </div>

                    <!-- سجل الرموز -->
                    <div class="qr-history-section" id="qr-history-section" style="display: none;">
                        <h4>سجل الرموز المحفوظة</h4>
                        <div class="history-container" id="history-container">
                            <!-- سيتم إنشاؤه ديناميكياً -->
                        </div>
                    </div>

                    <!-- إرشادات الاستخدام -->
                    <details class="usage-guide">
                        <summary>دليل الاستخدام</summary>
                        <div class="guide-content">
                            <h5>كيفية استخدام مولد QR Code:</h5>
                            
                            <div class="guide-steps">
                                <div class="step">
                                    <span class="step-number">1</span>
                                    <div class="step-content">
                                        <h6>اختر نوع البيانات</h6>
                                        <p>حدد نوع المحتوى المراد تحويله إلى رمز QR (نص، رابط، إلخ.)</p>
                                    </div>
                                </div>
                                
                                <div class="step">
                                    <span class="step-number">2</span>
                                    <div class="step-content">
                                        <h6>أدخل المحتوى</h6>
                                        <p>املأ الحقول المطلوبة حسب نوع البيانات المختار</p>
                                    </div>
                                </div>
                                
                                <div class="step">
                                    <span class="step-number">3</span>
                                    <div class="step-content">
                                        <h6>خصص التصميم</h6>
                                        <p>اختر الألوان، الحجم، ومستوى تصحيح الأخطاء</p>
                                    </div>
                                </div>
                                
                                <div class="step">
                                    <span class="step-number">4</span>
                                    <div class="step-content">
                                        <h6>إنشاء وتحميل</h6>
                                        <p>انقر "إنشاء رمز QR" ثم قم بتحميل النتيجة</p>
                                    </div>
                                </div>
                            </div>

                            <h5>نصائح هامة:</h5>
                            <ul>
                                <li><strong>تصحيح الأخطاء:</strong> مستوى أعلى = أمان أكثر + حجم أكبر</li>
                                <li><strong>الألوان:</strong> تأكد من التباين الكافي بين المقدمة والخلفية</li>
                                <li><strong>الحجم:</strong> رموز أكبر أسهل في القراءة للأجهزة</li>
                                <li><strong>البيانات:</strong> محتوى أكثر = رمز أعقد ووقت قراءة أطول</li>
                            </ul>

                            <h5>أنواع البيانات المدعومة:</h5>
                            <div class="data-types-info">
                                ${Object.keys(this.dataTypes).map(type => `
                                    <div class="data-type-info">
                                        <i class="${this.dataTypes[type].icon}"></i>
                                        <span>${this.dataTypes[type].name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        `;
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // اختيار نوع البيانات
        document.querySelectorAll('.data-type-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.switchDataType(type);
            });
        });

        // إعدادات التصميم
        document.getElementById('qr-size')?.addEventListener('input', (e) => {
            document.getElementById('size-value').textContent = e.target.value + 'px';
            this.generatePreview();
        });

        document.getElementById('qr-margin')?.addEventListener('input', (e) => {
            document.getElementById('margin-value').textContent = e.target.value;
            this.generatePreview();
        });

        // ألوان
        document.getElementById('color-dark')?.addEventListener('change', (e) => {
            document.getElementById('color-dark-text').value = e.target.value;
            this.generatePreview();
        });

        document.getElementById('color-light')?.addEventListener('change', (e) => {
            document.getElementById('color-light-text').value = e.target.value;
            this.generatePreview();
        });

        document.getElementById('color-dark-text')?.addEventListener('input', (e) => {
            document.getElementById('color-dark').value = e.target.value;
            this.generatePreview();
        });

        document.getElementById('color-light-text')?.addEventListener('input', (e) => {
            document.getElementById('color-light').value = e.target.value;
            this.generatePreview();
        });

        // ألوان جاهزة
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                this.applyColorPreset(e.currentTarget);
            });
        });

        // إعدادات أخرى
        document.getElementById('error-correction')?.addEventListener('change', () => {
            this.generatePreview();
        });

        // مراقبة تغيير المحتوى
        this.setupContentListeners();

        // أزرار التحكم
        document.getElementById('generate-qr-btn')?.addEventListener('click', () => {
            this.generateQRCode();
        });

        document.getElementById('download-qr-btn')?.addEventListener('click', () => {
            this.downloadQRCode();
        });

        document.getElementById('save-to-history-btn')?.addEventListener('click', () => {
            this.saveToHistory();
        });

        document.getElementById('reset-qr-btn')?.addEventListener('click', () => {
            this.reset();
        });
    }

    /**
     * إعداد مستمعي محتوى النماذج
     */
    setupContentListeners() {
        // مراقبة جميع حقول الإدخال
        const inputs = document.querySelectorAll('.data-form input, .data-form textarea, .data-form select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateAndPreview();
            });
        });
    }

    /**
     * تبديل نوع البيانات
     * @param {string} type 
     */
    switchDataType(type) {
        // تحديث الأزرار
        document.querySelectorAll('.data-type-item').forEach(item => {
            item.classList.toggle('active', item.dataset.type === type);
        });

        // تحديث النماذج
        document.querySelectorAll('.data-form').forEach(form => {
            form.classList.toggle('active', form.id === `${type}-form`);
        });

        this.currentDataType = type;
        this.validateAndPreview();
    }

    /**
     * تطبيق لون جاهز
     * @param {Element} preset 
     */
    applyColorPreset(preset) {
        const darkColor = preset.dataset.dark;
        const lightColor = preset.dataset.light;

        document.getElementById('color-dark').value = darkColor;
        document.getElementById('color-light').value = lightColor;
        document.getElementById('color-dark-text').value = darkColor;
        document.getElementById('color-light-text').value = lightColor;

        // تحديث حالة active
        document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
        preset.classList.add('active');

        this.generatePreview();
    }

    /**
     * التحقق من صحة البيانات وإنشاء معاينة
     */
    validateAndPreview() {
        const content = this.getFormContent();
        const generateBtn = document.getElementById('generate-qr-btn');
        
        if (content && content.trim()) {
            generateBtn.disabled = false;
            this.generatePreview();
        } else {
            generateBtn.disabled = true;
            this.hidePreview();
        }
    }

    /**
     * الحصول على محتوى النموذج النشط
     * @returns {string}
     */
    getFormContent() {
        const type = this.currentDataType || 'text';
        
        switch (type) {
            case 'text':
                return document.getElementById('text-content')?.value || '';
                
            case 'url':
                return document.getElementById('url-content')?.value || '';
                
            case 'email':
                const email = document.getElementById('email-address')?.value || '';
                const subject = document.getElementById('email-subject')?.value || '';
                const body = document.getElementById('email-body')?.value || '';
                
                if (!email) return '';
                
                let emailContent = `mailto:${email}`;
                const params = [];
                if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
                if (body) params.push(`body=${encodeURIComponent(body)}`);
                if (params.length > 0) {
                    emailContent += `?${params.join('&')}`;
                }
                return emailContent;
                
            case 'phone':
                const phone = document.getElementById('phone-number')?.value || '';
                return phone ? `tel:${phone}` : '';
                
            case 'wifi':
                const ssid = document.getElementById('wifi-ssid')?.value || '';
                const password = document.getElementById('wifi-password')?.value || '';
                const security = document.getElementById('wifi-security')?.value || 'WPA';
                
                if (!ssid) return '';
                
                return `WIFI:T:${security};S:${ssid};P:${password};;`;
                
            case 'contact':
                const name = document.getElementById('contact-name')?.value || '';
                const contactPhone = document.getElementById('contact-phone')?.value || '';
                const contactEmail = document.getElementById('contact-email')?.value || '';
                const org = document.getElementById('contact-org')?.value || '';
                
                if (!name && !contactPhone && !contactEmail) return '';
                
                return `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL:${contactPhone}
EMAIL:${contactEmail}
ORG:${org}
END:VCARD`;
                
            case 'sms':
                const smsNumber = document.getElementById('sms-number')?.value || '';
                const smsMessage = document.getElementById('sms-message')?.value || '';
                
                if (!smsNumber) return '';
                
                return `sms:${smsNumber}${smsMessage ? `?body=${encodeURIComponent(smsMessage)}` : ''}`;
                
            case 'location':
                const lat = document.getElementById('location-lat')?.value || '';
                const lng = document.getElementById('location-lng')?.value || '';
                
                if (!lat || !lng) return '';
                
                return `geo:${lat},${lng}`;
                
            default:
                return '';
        }
    }

    /**
     * إنشاء معاينة
     */
    async generatePreview() {
        const content = this.getFormContent();
        if (!content || !content.trim()) {
            this.hidePreview();
            return;
        }

        try {
            await this.renderQRCode(content, true);
            this.showPreview(content);
        } catch (error) {
            console.error('خطأ في إنشاء المعاينة:', error);
            this.hidePreview();
        }
    }

    /**
     * رسم رمز QR
     * @param {string} content 
     * @param {boolean} isPreview 
     */
    async renderQRCode(content, isPreview = false) {
        const canvas = document.getElementById('qr-canvas');
        const ctx = canvas.getContext('2d');
        
        // الحصول على الإعدادات
        const size = parseInt(document.getElementById('qr-size')?.value || '256');
        const margin = parseInt(document.getElementById('qr-margin')?.value || '4');
        const colorDark = document.getElementById('color-dark')?.value || '#000000';
        const colorLight = document.getElementById('color-light')?.value || '#ffffff';
        const errorCorrection = document.getElementById('error-correction')?.value || 'M';

        // تحديث حجم canvas
        canvas.width = size;
        canvas.height = size;

        try {
            // استخدام مكتبة QRCode إذا كانت متوفرة
            if (typeof QRCode !== 'undefined') {
                await QRCode.toCanvas(canvas, content, {
                    width: size,
                    margin: margin,
                    color: {
                        dark: colorDark,
                        light: colorLight
                    },
                    errorCorrectionLevel: errorCorrection
                });
            } else {
                // رسم placeholder إذا لم تكن المكتبة متوفرة
                this.drawQRPlaceholder(ctx, size, content);
            }

            this.currentQRCode = {
                content,
                size,
                margin,
                colorDark,
                colorLight,
                errorCorrection,
                canvas: canvas
            };

        } catch (error) {
            console.error('خطأ في رسم QR Code:', error);
            this.drawQRPlaceholder(ctx, size, 'خطأ في الإنشاء');
        }
    }

    /**
     * رسم placeholder لـ QR Code
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} size 
     * @param {string} text 
     */
    drawQRPlaceholder(ctx, size, text) {
        // مسح canvas
        ctx.clearRect(0, 0, size, size);
        
        // رسم خلفية
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, size, size);
        
        // رسم حدود
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, size - 2, size - 2);
        
        // رسم نص
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR Code', size / 2, size / 2 - 10);
        ctx.fillText(text.substring(0, 20) + '...', size / 2, size / 2 + 10);
    }

    /**
     * إظهار المعاينة
     * @param {string} content 
     */
    showPreview(content) {
        document.getElementById('qr-placeholder').style.display = 'none';
        document.getElementById('qr-canvas').style.display = 'block';
        
        const qrInfo = document.getElementById('qr-info');
        qrInfo.style.display = 'block';
        
        // تحديث معلومات الرمز
        document.getElementById('qr-size-info').textContent = 
            document.getElementById('qr-size').value + 'px';
        document.getElementById('qr-data-length').textContent = 
            content.length + ' حرف';
        document.getElementById('qr-type-info').textContent = 
            this.dataTypes[this.currentDataType || 'text'].name;
        
        // تفعيل أزرار التحميل والحفظ
        document.getElementById('download-qr-btn').disabled = false;
        document.getElementById('save-to-history-btn').disabled = false;
    }

    /**
     * إخفاء المعاينة
     */
    hidePreview() {
        document.getElementById('qr-placeholder').style.display = 'flex';
        document.getElementById('qr-canvas').style.display = 'none';
        document.getElementById('qr-info').style.display = 'none';
        
        // تعطيل أزرار التحميل والحفظ
        document.getElementById('download-qr-btn').disabled = true;
        document.getElementById('save-to-history-btn').disabled = true;
    }

    /**
     * إنشاء رمز QR
     */
    async generateQRCode() {
        const content = this.getFormContent();
        if (!content || !content.trim()) {
            this.uiHelpers.showNotification('يرجى إدخال المحتوى المطلوب', 'warning');
            return;
        }

        try {
            this.uiHelpers.showLoading('جاري إنشاء رمز QR...');
            
            await this.renderQRCode(content, false);
            
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('تم إنشاء رمز QR بنجاح!', 'success');
            
        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في إنشاء رمز QR: ' + error.message, 'error');
        }
    }

    /**
     * تحميل رمز QR
     */
    downloadQRCode() {
        if (!this.currentQRCode) {
            this.uiHelpers.showNotification('لا يوجد رمز QR للتحميل', 'warning');
            return;
        }

        const format = document.getElementById('export-format')?.value || 'png';
        const canvas = this.currentQRCode.canvas;
        
        try {
            if (format === 'svg') {
                // تصدير SVG (يتطلب تنفيذ خاص)
                this.downloadSVG();
            } else {
                // تصدير كـ image
                const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
                const quality = format === 'jpeg' ? 0.9 : undefined;
                
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `qr-code-${Date.now()}.${format}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    this.uiHelpers.showNotification(`تم تحميل رمز QR كـ ${format.toUpperCase()}`, 'success');
                }, mimeType, quality);
            }
        } catch (error) {
            this.uiHelpers.showNotification('فشل في تحميل رمز QR: ' + error.message, 'error');
        }
    }

    /**
     * تحميل كـ SVG
     */
    downloadSVG() {
        // هذا يتطلب تحويل canvas إلى SVG
        // أو استخدام QRCode.toString مع خيار SVG
        this.uiHelpers.showNotification('تصدير SVG سيتوفر قريباً', 'info');
    }

    /**
     * حفظ في السجل
     */
    saveToHistory() {
        if (!this.currentQRCode) {
            this.uiHelpers.showNotification('لا يوجد رمز QR للحفظ', 'warning');
            return;
        }

        const historyItem = {
            id: Date.now(),
            content: this.currentQRCode.content,
            type: this.currentDataType || 'text',
            settings: {
                size: this.currentQRCode.size,
                margin: this.currentQRCode.margin,
                colorDark: this.currentQRCode.colorDark,
                colorLight: this.currentQRCode.colorLight,
                errorCorrection: this.currentQRCode.errorCorrection
            },
            timestamp: new Date(),
            preview: this.currentQRCode.canvas.toDataURL('image/png', 0.5) // معاينة مضغوطة
        };

        // إضافة للسجل
        this.qrHistory.unshift(historyItem);
        
        // الحد من عدد العناصر
        if (this.qrHistory.length > this.maxHistoryItems) {
            this.qrHistory = this.qrHistory.slice(0, this.maxHistoryItems);
        }

        // حفظ في localStorage
        try {
            localStorage.setItem('qr-generator-history', JSON.stringify(
                this.qrHistory.map(item => ({
                    ...item,
                    preview: undefined // لا نحفظ المعاينة في localStorage لتوفير المساحة
                }))
            ));
        } catch (error) {
            console.warn('فشل في حفظ السجل:', error);
        }

        this.updateHistoryDisplay();
        this.uiHelpers.showNotification('تم حفظ رمز QR في السجل', 'success');
    }

    /**
     * تحديث عرض السجل
     */
    updateHistoryDisplay() {
        const container = document.getElementById('history-container');
        const section = document.getElementById('qr-history-section');
        
        if (this.qrHistory.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        
        container.innerHTML = this.qrHistory.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-preview">
                    ${item.preview ? `<img src="${item.preview}" alt="QR Preview">` : '<i class="fas fa-qrcode"></i>'}
                </div>
                <div class="history-info">
                    <div class="history-type">
                        <i class="${this.dataTypes[item.type].icon}"></i>
                        ${this.dataTypes[item.type].name}
                    </div>
                    <div class="history-content">${this.truncateText(item.content, 50)}</div>
                    <div class="history-date">${this.formatDate(item.timestamp)}</div>
                </div>
                <div class="history-actions">
                    <button class="btn btn-xs btn-outline load-history" data-index="${index}">
                        <i class="fas fa-redo"></i>
                        استخدام
                    </button>
                    <button class="btn btn-xs btn-outline delete-history" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // إضافة مستمعي الأحداث
        container.querySelectorAll('.load-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.loadFromHistory(index);
            });
        });

        container.querySelectorAll('.delete-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteFromHistory(index);
            });
        });
    }

    /**
     * تحميل من السجل
     * @param {number} index 
     */
    loadFromHistory(index) {
        const item = this.qrHistory[index];
        if (!item) return;

        // تبديل نوع البيانات
        this.switchDataType(item.type);

        // ملء النموذج
        this.fillFormFromHistoryItem(item);

        // تطبيق الإعدادات
        document.getElementById('qr-size').value = item.settings.size;
        document.getElementById('qr-margin').value = item.settings.margin;
        document.getElementById('color-dark').value = item.settings.colorDark;
        document.getElementById('color-light').value = item.settings.colorLight;
        document.getElementById('color-dark-text').value = item.settings.colorDark;
        document.getElementById('color-light-text').value = item.settings.colorLight;
        document.getElementById('error-correction').value = item.settings.errorCorrection;

        // تحديث العرض
        document.getElementById('size-value').textContent = item.settings.size + 'px';
        document.getElementById('margin-value').textContent = item.settings.margin;

        // إنشاء معاينة
        this.validateAndPreview();

        this.uiHelpers.showNotification('تم تحميل الإعدادات من السجل', 'success');
    }

    /**
     * ملء النموذج من عنصر السجل
     * @param {Object} item 
     */
    fillFormFromHistoryItem(item) {
        // هذا يتطلب تحليل المحتوى حسب النوع
        // لبساطة التنفيذ، سنضع المحتوى في حقل النص
        switch (item.type) {
            case 'text':
                document.getElementById('text-content').value = item.content;
                break;
            case 'url':
                document.getElementById('url-content').value = item.content;
                break;
            // يمكن إضافة باقي الأنواع لاحقاً
            default:
                // استخدام النص العادي كـ fallback
                this.switchDataType('text');
                document.getElementById('text-content').value = item.content;
        }
    }

    /**
     * حذف من السجل
     * @param {number} index 
     */
    deleteFromHistory(index) {
        this.qrHistory.splice(index, 1);
        
        // حفظ التغيير
        try {
            localStorage.setItem('qr-generator-history', JSON.stringify(this.qrHistory));
        } catch (error) {
            console.warn('فشل في حفظ السجل:', error);
        }

        this.updateHistoryDisplay();
        this.uiHelpers.showNotification('تم حذف العنصر من السجل', 'success');
    }

    /**
     * اختصار النص
     * @param {string} text 
     * @param {number} maxLength 
     * @returns {string}
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * تنسيق التاريخ
     * @param {Date} date 
     * @returns {string}
     */
    formatDate(date) {
        return new Intl.DateTimeFormat('ar', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }

    /**
     * تحميل السجل من localStorage
     */
    loadHistoryFromStorage() {
        try {
            const saved = localStorage.getItem('qr-generator-history');
            if (saved) {
                this.qrHistory = JSON.parse(saved);
                this.updateHistoryDisplay();
            }
        } catch (error) {
            console.warn('فشل في تحميل السجل:', error);
            this.qrHistory = [];
        }
    }

    /**
     * إعادة تعيين
     */
    reset() {
        // إعادة تعيين النماذج
        document.querySelectorAll('.data-form input, .data-form textarea, .data-form select').forEach(input => {
            input.value = '';
        });

        // إعادة تعيين الإعدادات
        document.getElementById('qr-size').value = 256;
        document.getElementById('qr-margin').value = 4;
        document.getElementById('color-dark').value = '#000000';
        document.getElementById('color-light').value = '#ffffff';
        document.getElementById('color-dark-text').value = '#000000';
        document.getElementById('color-light-text').value = '#ffffff';
        document.getElementById('error-correction').value = 'M';
        document.getElementById('export-format').value = 'png';

        // تحديث العرض
        document.getElementById('size-value').textContent = '256px';
        document.getElementById('margin-value').textContent = '4';

        // إعادة تعيين نوع البيانات
        this.switchDataType('text');

        // إخفاء المعاينة
        this.hidePreview();

        // إعادة تعيين البيانات
        this.currentQRCode = null;

        this.uiHelpers.showNotification('تم إعادة تعيين مولد QR', 'info');
    }
}

// تصدير الكلاس
export default QRGenerator;