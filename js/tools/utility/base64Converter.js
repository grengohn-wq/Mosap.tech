/**
 * Base64 Converter Tool
 * أداة تحويل الصور إلى Base64 والعكس مع خيارات متقدمة
 */

import ImageUtils from '../utils/imageUtils.js';
import UIHelpers from '../utils/uiHelpers.js';

class Base64Converter {
    constructor() {
        this.imageUtils = new ImageUtils();
        this.uiHelpers = new UIHelpers();
        this.currentImage = null;
        this.base64Result = '';
        this.conversionHistory = [];
        this.maxHistorySize = 10;
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    }

    /**
     * تهيئة أداة تحويل Base64
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
    }

    /**
     * إنشاء واجهة أداة التحويل
     */
    createInterface() {
        const controlsSection = document.getElementById('controls-section');
        if (!controlsSection) return;

        controlsSection.innerHTML = `
            <div class="control-panel">
                <div class="control-header">
                    <i class="fas fa-code"></i>
                    <h3>تحويل Base64</h3>
                </div>
                
                <div class="control-group">
                    <!-- طرق التحويل -->
                    <div class="conversion-modes">
                        <div class="mode-tabs">
                            <button class="mode-tab active" data-mode="image-to-base64">
                                <i class="fas fa-image"></i>
                                صورة إلى Base64
                            </button>
                            <button class="mode-tab" data-mode="base64-to-image">
                                <i class="fas fa-code"></i>
                                Base64 إلى صورة
                            </button>
                        </div>
                    </div>

                    <!-- تحويل الصورة إلى Base64 -->
                    <div class="conversion-section" id="image-to-base64-section">
                        <!-- معاينة الصورة -->
                        <div class="image-preview-container">
                            <div class="image-preview" id="image-preview" style="display: none;">
                                <img id="preview-image" alt="معاينة الصورة">
                                <div class="image-info">
                                    <span id="image-size-info"></span>
                                    <span id="image-format-info"></span>
                                </div>
                            </div>
                            <div class="upload-placeholder" id="upload-placeholder">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>اسحب وأفلت صورة هنا أو انقر للرفع</p>
                                <input type="file" id="image-input" accept="image/*" style="display: none;">
                                <button class="btn btn-outline" id="select-image-btn">
                                    <i class="fas fa-folder-open"></i>
                                    اختيار صورة
                                </button>
                            </div>
                        </div>

                        <!-- إعدادات التحويل -->
                        <div class="conversion-settings">
                            <div class="control-row">
                                <label class="control-label">تنسيق الإخراج</label>
                                <select id="output-format" class="form-select">
                                    <option value="image/jpeg">JPEG</option>
                                    <option value="image/png" selected>PNG</option>
                                    <option value="image/webp">WebP</option>
                                </select>
                            </div>

                            <div class="control-row" id="quality-row">
                                <label class="control-label">جودة الصورة</label>
                                <div class="control-input-group">
                                    <input type="range" id="image-quality" class="form-range" 
                                           min="0.1" max="1" step="0.05" value="0.9">
                                    <span class="range-value" id="quality-value">90%</span>
                                </div>
                            </div>

                            <div class="control-row">
                                <label class="control-label">تضمين Data URL</label>
                                <input type="checkbox" id="include-data-url" checked>
                                <small>تضمين بادئة data:image/type;base64,</small>
                            </div>

                            <div class="control-row">
                                <label class="control-label">تقسيم النتيجة</label>
                                <input type="checkbox" id="split-lines">
                                <div class="split-settings" id="split-settings" style="display: none;">
                                    <label>عدد الأحرف لكل سطر:</label>
                                    <input type="number" id="line-length" class="form-input" 
                                           min="50" max="200" value="76">
                                </div>
                            </div>
                        </div>

                        <!-- نتيجة Base64 -->
                        <div class="base64-result" id="base64-result" style="display: none;">
                            <div class="result-header">
                                <h4>نتيجة Base64</h4>
                                <div class="result-actions">
                                    <button class="btn btn-sm btn-outline" id="copy-base64">
                                        <i class="fas fa-copy"></i>
                                        نسخ
                                    </button>
                                    <button class="btn btn-sm btn-outline" id="download-base64">
                                        <i class="fas fa-download"></i>
                                        تحميل
                                    </button>
                                    <button class="btn btn-sm btn-outline" id="clear-base64">
                                        <i class="fas fa-trash"></i>
                                        مسح
                                    </button>
                                </div>
                            </div>
                            <div class="result-stats">
                                <span id="base64-size">الحجم: -</span>
                                <span id="compression-ratio">نسبة الضغط: -</span>
                            </div>
                            <textarea id="base64-output" class="base64-textarea" readonly></textarea>
                        </div>
                    </div>

                    <!-- تحويل Base64 إلى صورة -->
                    <div class="conversion-section" id="base64-to-image-section" style="display: none;">
                        <div class="base64-input-container">
                            <label class="control-label">أدخل كود Base64</label>
                            <textarea id="base64-input" class="base64-textarea" 
                                      placeholder="الصق كود Base64 هنا... (مع أو بدون بادئة data:image)"></textarea>
                            
                            <div class="input-actions">
                                <button class="btn btn-outline" id="paste-base64">
                                    <i class="fas fa-paste"></i>
                                    لصق من الحافظة
                                </button>
                                <button class="btn btn-outline" id="load-base64-file">
                                    <i class="fas fa-file-import"></i>
                                    تحميل من ملف
                                </button>
                                <input type="file" id="base64-file-input" accept=".txt,.json" style="display: none;">
                            </div>

                            <div class="validation-info" id="validation-info" style="display: none;">
                                <div class="info-item">
                                    <label>صحة الكود:</label>
                                    <span id="validation-status">-</span>
                                </div>
                                <div class="info-item">
                                    <label>نوع الصورة:</label>
                                    <span id="detected-format">-</span>
                                </div>
                                <div class="info-item">
                                    <label>حجم البيانات:</label>
                                    <span id="data-size">-</span>
                                </div>
                            </div>
                        </div>

                        <!-- نتيجة الصورة -->
                        <div class="image-result" id="image-result" style="display: none;">
                            <div class="result-header">
                                <h4>الصورة المحولة</h4>
                                <div class="result-actions">
                                    <button class="btn btn-sm btn-primary" id="download-image">
                                        <i class="fas fa-download"></i>
                                        تحميل الصورة
                                    </button>
                                    <button class="btn btn-sm btn-outline" id="copy-image">
                                        <i class="fas fa-copy"></i>
                                        نسخ الصورة
                                    </button>
                                </div>
                            </div>
                            <div class="converted-image-container">
                                <img id="converted-image" alt="الصورة المحولة">
                                <div class="image-details">
                                    <span id="converted-size">الأبعاد: -</span>
                                    <span id="converted-format">التنسيق: -</span>
                                    <span id="file-size">حجم الملف: -</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- أزرار التحكم -->
                    <div class="control-actions">
                        <button id="convert-btn" class="btn btn-primary" disabled>
                            <i class="fas fa-exchange-alt"></i>
                            تحويل
                        </button>
                        
                        <button id="validate-btn" class="btn btn-secondary" disabled>
                            <i class="fas fa-check-circle"></i>
                            التحقق من الصحة
                        </button>
                        
                        <button id="reset-converter-btn" class="btn btn-outline">
                            <i class="fas fa-refresh"></i>
                            إعادة تعيين
                        </button>
                    </div>

                    <!-- سجل التحويل -->
                    <details class="conversion-history">
                        <summary>سجل التحويل</summary>
                        <div class="history-list" id="history-list">
                            <p class="empty-history">لا يوجد تحويلات سابقة</p>
                        </div>
                        <div class="history-actions">
                            <button class="btn btn-sm btn-outline" id="clear-history">
                                <i class="fas fa-trash"></i>
                                مسح السجل
                            </button>
                            <button class="btn btn-sm btn-outline" id="export-history">
                                <i class="fas fa-file-export"></i>
                                تصدير السجل
                            </button>
                        </div>
                    </details>

                    <!-- معلومات إضافية -->
                    <details class="additional-info">
                        <summary>معلومات Base64</summary>
                        <div class="info-content">
                            <h5>ما هو Base64؟</h5>
                            <p>Base64 هو نظام تشفير يحول البيانات الثنائية إلى نص ASCII. يستخدم عادة لتضمين الصور في HTML أو CSS أو JSON.</p>
                            
                            <h5>الاستخدامات:</h5>
                            <ul>
                                <li>تضمين الصور في CSS أو HTML</li>
                                <li>إرسال الصور عبر JSON APIs</li>
                                <li>تخزين الصور في قواعد البيانات</li>
                                <li>تقليل طلبات HTTP للصور الصغيرة</li>
                            </ul>

                            <h5>ملاحظات:</h5>
                            <ul>
                                <li>Base64 يزيد حجم الصورة بـ 33% تقريباً</li>
                                <li>مناسب للصور الصغيرة فقط (أقل من 100KB)</li>
                                <li>لا يدعم الضغط مثل ملفات الصور العادية</li>
                            </ul>
                        </div>
                    </details>
                </div>
            </div>
        `;

        this.setupDragAndDrop();
    }

    /**
     * إعداد السحب والإفلات
     */
    setupDragAndDrop() {
        const placeholder = document.getElementById('upload-placeholder');
        if (!placeholder) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            placeholder.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            placeholder.addEventListener(eventName, () => {
                placeholder.classList.add('drag-active');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            placeholder.addEventListener(eventName, () => {
                placeholder.classList.remove('drag-active');
            });
        });

        placeholder.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.loadImage(files[0]);
            }
        });
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // تبديل أوضاع التحويل
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchMode(e.target.dataset.mode);
            });
        });

        // رفع الصورة
        document.getElementById('select-image-btn')?.addEventListener('click', () => {
            document.getElementById('image-input').click();
        });

        document.getElementById('image-input')?.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadImage(e.target.files[0]);
            }
        });

        // إعدادات التحويل
        document.getElementById('output-format')?.addEventListener('change', (e) => {
            const qualityRow = document.getElementById('quality-row');
            qualityRow.style.display = e.target.value === 'image/png' ? 'none' : 'block';
            this.updatePreview();
        });

        document.getElementById('image-quality')?.addEventListener('input', (e) => {
            const quality = Math.round(parseFloat(e.target.value) * 100);
            document.getElementById('quality-value').textContent = quality + '%';
            this.updatePreview();
        });

        document.getElementById('include-data-url')?.addEventListener('change', () => {
            this.updateBase64Output();
        });

        document.getElementById('split-lines')?.addEventListener('change', (e) => {
            const splitSettings = document.getElementById('split-settings');
            splitSettings.style.display = e.target.checked ? 'block' : 'none';
            this.updateBase64Output();
        });

        document.getElementById('line-length')?.addEventListener('input', () => {
            this.updateBase64Output();
        });

        // Base64 إلى صورة
        document.getElementById('base64-input')?.addEventListener('input', () => {
            this.validateBase64();
        });

        document.getElementById('paste-base64')?.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                document.getElementById('base64-input').value = text;
                this.validateBase64();
            } catch (error) {
                this.uiHelpers.showNotification('فشل في لصق النص من الحافظة', 'error');
            }
        });

        document.getElementById('load-base64-file')?.addEventListener('click', () => {
            document.getElementById('base64-file-input').click();
        });

        document.getElementById('base64-file-input')?.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadBase64File(e.target.files[0]);
            }
        });

        // أزرار الإجراءات
        this.setupActionButtons();

        // أزرار التحكم
        document.getElementById('convert-btn')?.addEventListener('click', () => {
            this.performConversion();
        });

        document.getElementById('validate-btn')?.addEventListener('click', () => {
            this.validateBase64();
        });

        document.getElementById('reset-converter-btn')?.addEventListener('click', () => {
            this.reset();
        });

        // سجل التحويل
        document.getElementById('clear-history')?.addEventListener('click', () => {
            this.clearHistory();
        });

        document.getElementById('export-history')?.addEventListener('click', () => {
            this.exportHistory();
        });
    }

    /**
     * إعداد أزرار الإجراءات
     */
    setupActionButtons() {
        // أزرار Base64
        document.getElementById('copy-base64')?.addEventListener('click', () => {
            this.copyBase64();
        });

        document.getElementById('download-base64')?.addEventListener('click', () => {
            this.downloadBase64();
        });

        document.getElementById('clear-base64')?.addEventListener('click', () => {
            this.clearBase64Result();
        });

        // أزرار الصورة
        document.getElementById('download-image')?.addEventListener('click', () => {
            this.downloadConvertedImage();
        });

        document.getElementById('copy-image')?.addEventListener('click', () => {
            this.copyConvertedImage();
        });
    }

    /**
     * تبديل وضع التحويل
     * @param {string} mode 
     */
    switchMode(mode) {
        // تحديث الأزرار
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // إظهار/إخفاء الأقسام
        document.getElementById('image-to-base64-section').style.display = 
            mode === 'image-to-base64' ? 'block' : 'none';
        document.getElementById('base64-to-image-section').style.display = 
            mode === 'base64-to-image' ? 'block' : 'none';

        // تحديث أزرار التحكم
        this.updateControlButtons(mode);
        
        this.currentMode = mode;
    }

    /**
     * تحميل صورة
     * @param {File} file 
     */
    async loadImage(file) {
        try {
            this.uiHelpers.showLoading('جاري تحميل الصورة...');

            // التحقق من نوع الملف
            if (!this.supportedFormats.includes(file.type)) {
                throw new Error(`نوع الملف غير مدعوم: ${file.type}`);
            }

            // التحقق من حجم الملف (تحذير للملفات الكبيرة)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                const proceed = confirm(`حجم الملف كبير (${this.formatFileSize(file.size)}). قد يؤثر ذلك على الأداء. هل تريد المتابعة؟`);
                if (!proceed) {
                    this.uiHelpers.hideLoading();
                    return;
                }
            }

            this.currentImage = await this.imageUtils.loadImage(file);
            this.showImagePreview(file);
            this.updateControlButtons('image-to-base64');

            this.uiHelpers.hideLoading();

        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في تحميل الصورة: ' + error.message, 'error');
        }
    }

    /**
     * عرض معاينة الصورة
     * @param {File} file 
     */
    showImagePreview(file) {
        const preview = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-image');
        const placeholder = document.getElementById('upload-placeholder');

        previewImg.src = URL.createObjectURL(file);
        document.getElementById('image-size-info').textContent = 
            `${this.currentImage.width} × ${this.currentImage.height}`;
        document.getElementById('image-format-info').textContent = file.type;

        placeholder.style.display = 'none';
        preview.style.display = 'block';
    }

    /**
     * تحديث المعاينة
     */
    updatePreview() {
        if (!this.currentImage) return;

        // تحويل تلقائي للمعاينة
        setTimeout(() => {
            this.convertImageToBase64();
        }, 300);
    }

    /**
     * تحويل الصورة إلى Base64
     */
    async convertImageToBase64() {
        if (!this.currentImage) return;

        try {
            const format = document.getElementById('output-format').value;
            const quality = parseFloat(document.getElementById('image-quality').value);

            // إنشاء canvas مؤقت
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = this.currentImage.width;
            canvas.height = this.currentImage.height;
            
            ctx.drawImage(this.currentImage, 0, 0);

            // تحويل إلى Base64
            const base64 = canvas.toDataURL(format, quality);
            this.base64Result = base64.split(',')[1]; // إزالة البادئة

            this.showBase64Result();
            this.updateBase64Stats(base64);

        } catch (error) {
            this.uiHelpers.showNotification('فشل في التحويل: ' + error.message, 'error');
        }
    }

    /**
     * عرض نتيجة Base64
     */
    showBase64Result() {
        this.updateBase64Output();
        document.getElementById('base64-result').style.display = 'block';
        document.getElementById('convert-btn').disabled = false;
    }

    /**
     * تحديث إخراج Base64
     */
    updateBase64Output() {
        if (!this.base64Result) return;

        let output = this.base64Result;
        
        // إضافة بادئة Data URL إذا كانت مطلوبة
        if (document.getElementById('include-data-url')?.checked) {
            const format = document.getElementById('output-format').value;
            output = `data:${format};base64,${output}`;
        }

        // تقسيم الأسطر إذا كان مطلوباً
        if (document.getElementById('split-lines')?.checked) {
            const lineLength = parseInt(document.getElementById('line-length').value) || 76;
            output = this.splitIntoLines(output, lineLength);
        }

        document.getElementById('base64-output').value = output;
    }

    /**
     * تقسيم النص إلى أسطر
     * @param {string} text 
     * @param {number} lineLength 
     * @returns {string}
     */
    splitIntoLines(text, lineLength) {
        const lines = [];
        for (let i = 0; i < text.length; i += lineLength) {
            lines.push(text.substr(i, lineLength));
        }
        return lines.join('\n');
    }

    /**
     * تحديث إحصائيات Base64
     * @param {string} fullBase64 
     */
    updateBase64Stats(fullBase64) {
        const base64Size = fullBase64.length;
        const imageSize = this.currentImage.width * this.currentImage.height * 4; // RGBA
        const compressionRatio = ((imageSize - base64Size) / imageSize * 100).toFixed(1);

        document.getElementById('base64-size').textContent = 
            `الحجم: ${this.formatFileSize(base64Size)}`;
        document.getElementById('compression-ratio').textContent = 
            `نسبة الضغط: ${compressionRatio}%`;
    }

    /**
     * تحميل ملف Base64
     * @param {File} file 
     */
    async loadBase64File(file) {
        try {
            this.uiHelpers.showLoading('جاري تحميل الملف...');

            const text = await file.text();
            document.getElementById('base64-input').value = text;
            this.validateBase64();

            this.uiHelpers.hideLoading();

        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في تحميل الملف: ' + error.message, 'error');
        }
    }

    /**
     * التحقق من صحة Base64
     */
    validateBase64() {
        const input = document.getElementById('base64-input').value.trim();
        if (!input) {
            this.hideValidationInfo();
            return;
        }

        try {
            let base64Data = input;
            let detectedFormat = 'غير محدد';

            // فحص وجود بادئة Data URL
            const dataUrlMatch = input.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
            if (dataUrlMatch) {
                detectedFormat = `image/${dataUrlMatch[1]}`;
                base64Data = dataUrlMatch[2];
            }

            // التحقق من صحة Base64
            const isValid = this.isValidBase64(base64Data);
            
            if (isValid) {
                // محاولة فك التشفير لحساب الحجم
                const binaryString = atob(base64Data);
                const dataSize = this.formatFileSize(binaryString.length);

                this.showValidationInfo(true, detectedFormat, dataSize);
                this.updateControlButtons('base64-to-image');
            } else {
                this.showValidationInfo(false, 'غير صحيح', '-');
            }

        } catch (error) {
            this.showValidationInfo(false, 'خطأ في التحليل', '-');
        }
    }

    /**
     * فحص صحة Base64
     * @param {string} str 
     * @returns {boolean}
     */
    isValidBase64(str) {
        try {
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            return base64Regex.test(str) && (str.length % 4 === 0);
        } catch {
            return false;
        }
    }

    /**
     * إظهار معلومات التحقق
     * @param {boolean} isValid 
     * @param {string} format 
     * @param {string} size 
     */
    showValidationInfo(isValid, format, size) {
        const validationInfo = document.getElementById('validation-info');
        const statusSpan = document.getElementById('validation-status');

        statusSpan.textContent = isValid ? '✓ صحيح' : '✗ غير صحيح';
        statusSpan.className = isValid ? 'valid' : 'invalid';

        document.getElementById('detected-format').textContent = format;
        document.getElementById('data-size').textContent = size;

        validationInfo.style.display = 'block';
    }

    /**
     * إخفاء معلومات التحقق
     */
    hideValidationInfo() {
        document.getElementById('validation-info').style.display = 'none';
    }

    /**
     * تحويل Base64 إلى صورة
     */
    async convertBase64ToImage() {
        const input = document.getElementById('base64-input').value.trim();
        if (!input) return;

        try {
            this.uiHelpers.showLoading('جاري التحويل...');

            let base64Data = input;
            let mimeType = 'image/png';

            // استخراج نوع MIME من Data URL
            const dataUrlMatch = input.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
            if (dataUrlMatch) {
                mimeType = `image/${dataUrlMatch[1]}`;
                base64Data = dataUrlMatch[2];
            }

            // إنشاء صورة من Base64
            const img = new Image();
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = `data:${mimeType};base64,${base64Data}`;
            });

            this.showConvertedImage(img, mimeType);

            // إضافة إلى السجل
            this.addToHistory({
                type: 'base64-to-image',
                timestamp: Date.now(),
                format: mimeType,
                size: `${img.width} × ${img.height}`
            });

            this.uiHelpers.hideLoading();

        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في تحويل Base64 إلى صورة: ' + error.message, 'error');
        }
    }

    /**
     * عرض الصورة المحولة
     * @param {HTMLImageElement} img 
     * @param {string} mimeType 
     */
    showConvertedImage(img, mimeType) {
        const resultSection = document.getElementById('image-result');
        const convertedImg = document.getElementById('converted-image');

        convertedImg.src = img.src;
        
        document.getElementById('converted-size').textContent = 
            `الأبعاد: ${img.width} × ${img.height}`;
        document.getElementById('converted-format').textContent = 
            `التنسيق: ${mimeType}`;

        // حساب حجم الملف التقريبي
        const approximateSize = (img.width * img.height * 4 * 0.75); // تقدير تقريبي
        document.getElementById('file-size').textContent = 
            `حجم الملف: ~${this.formatFileSize(approximateSize)}`;

        resultSection.style.display = 'block';
        this.convertedImageData = img.src;
    }

    /**
     * تنفيذ التحويل
     */
    async performConversion() {
        if (this.currentMode === 'image-to-base64') {
            await this.convertImageToBase64();
            
            // إضافة إلى السجل
            const format = document.getElementById('output-format').value;
            this.addToHistory({
                type: 'image-to-base64',
                timestamp: Date.now(),
                format: format,
                size: `${this.currentImage.width} × ${this.currentImage.height}`
            });

            this.uiHelpers.showNotification('تم تحويل الصورة إلى Base64 بنجاح', 'success');
        } else {
            await this.convertBase64ToImage();
            this.uiHelpers.showNotification('تم تحويل Base64 إلى صورة بنجاح', 'success');
        }
    }

    /**
     * نسخ Base64
     */
    async copyBase64() {
        const output = document.getElementById('base64-output').value;
        try {
            await navigator.clipboard.writeText(output);
            this.uiHelpers.showNotification('تم نسخ Base64 إلى الحافظة', 'success');
        } catch (error) {
            this.uiHelpers.showNotification('فشل في النسخ', 'error');
        }
    }

    /**
     * تحميل Base64
     */
    downloadBase64() {
        const output = document.getElementById('base64-output').value;
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `base64_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * مسح نتيجة Base64
     */
    clearBase64Result() {
        document.getElementById('base64-output').value = '';
        document.getElementById('base64-result').style.display = 'none';
        this.base64Result = '';
    }

    /**
     * تحميل الصورة المحولة
     */
    downloadConvertedImage() {
        if (!this.convertedImageData) return;

        const link = document.createElement('a');
        link.href = this.convertedImageData;
        link.download = `converted_image_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * نسخ الصورة المحولة
     */
    async copyConvertedImage() {
        if (!this.convertedImageData) return;

        try {
            // تحويل Data URL إلى Blob
            const response = await fetch(this.convertedImageData);
            const blob = await response.blob();

            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);

            this.uiHelpers.showNotification('تم نسخ الصورة إلى الحافظة', 'success');
        } catch (error) {
            this.uiHelpers.showNotification('فشل في نسخ الصورة', 'error');
        }
    }

    /**
     * تحديث أزرار التحكم
     * @param {string} mode 
     */
    updateControlButtons(mode) {
        const convertBtn = document.getElementById('convert-btn');
        const validateBtn = document.getElementById('validate-btn');

        if (mode === 'image-to-base64') {
            convertBtn.disabled = !this.currentImage;
            validateBtn.disabled = true;
        } else {
            const input = document.getElementById('base64-input').value.trim();
            convertBtn.disabled = !input;
            validateBtn.disabled = !input;
        }
    }

    /**
     * إضافة إلى السجل
     * @param {Object} entry 
     */
    addToHistory(entry) {
        this.conversionHistory.unshift(entry);
        
        if (this.conversionHistory.length > this.maxHistorySize) {
            this.conversionHistory = this.conversionHistory.slice(0, this.maxHistorySize);
        }

        this.updateHistoryDisplay();
    }

    /**
     * تحديث عرض السجل
     */
    updateHistoryDisplay() {
        const historyList = document.getElementById('history-list');
        
        if (this.conversionHistory.length === 0) {
            historyList.innerHTML = '<p class="empty-history">لا يوجد تحويلات سابقة</p>';
            return;
        }

        historyList.innerHTML = this.conversionHistory.map(entry => {
            const date = new Date(entry.timestamp).toLocaleString('ar');
            const typeText = entry.type === 'image-to-base64' ? 'صورة → Base64' : 'Base64 → صورة';
            
            return `
                <div class="history-item">
                    <div class="history-type">${typeText}</div>
                    <div class="history-details">
                        <span>التنسيق: ${entry.format}</span>
                        <span>الحجم: ${entry.size}</span>
                    </div>
                    <div class="history-date">${date}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * مسح السجل
     */
    clearHistory() {
        this.conversionHistory = [];
        this.updateHistoryDisplay();
        this.uiHelpers.showNotification('تم مسح سجل التحويل', 'info');
    }

    /**
     * تصدير السجل
     */
    exportHistory() {
        if (this.conversionHistory.length === 0) {
            this.uiHelpers.showNotification('لا يوجد سجل لتصديره', 'warning');
            return;
        }

        const historyData = {
            exportDate: new Date().toISOString(),
            conversions: this.conversionHistory
        };

        const blob = new Blob([JSON.stringify(historyData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `base64_conversion_history_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * تنسيق حجم الملف
     * @param {number} bytes 
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * إعادة تعيين
     */
    reset() {
        // إعادة تعيين البيانات
        this.currentImage = null;
        this.base64Result = '';
        this.convertedImageData = null;

        // إعادة تعيين الواجهة
        document.getElementById('upload-placeholder').style.display = 'flex';
        document.getElementById('image-preview').style.display = 'none';
        document.getElementById('base64-result').style.display = 'none';
        document.getElementById('image-result').style.display = 'none';
        
        document.getElementById('image-input').value = '';
        document.getElementById('base64-input').value = '';
        document.getElementById('base64-output').value = '';

        this.hideValidationInfo();

        // إعادة تعيين الإعدادات
        document.getElementById('output-format').value = 'image/png';
        document.getElementById('image-quality').value = 0.9;
        document.getElementById('quality-value').textContent = '90%';
        document.getElementById('include-data-url').checked = true;
        document.getElementById('split-lines').checked = false;
        document.getElementById('split-settings').style.display = 'none';

        // تحديث أزرار التحكم
        this.updateControlButtons(this.currentMode || 'image-to-base64');

        this.uiHelpers.showNotification('تم إعادة تعيين أداة التحويل', 'info');
    }
}

// تصدير الكلاس
export default Base64Converter;