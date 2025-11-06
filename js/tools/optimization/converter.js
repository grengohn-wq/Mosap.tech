/**
 * Image Format Converter Tool
 * محول صيغ الصور - تحويل بين جميع الصيغ المدعومة
 */

import ImageUtils from '../utils/imageUtils.js';
import UIHelpers from '../utils/uiHelpers.js';

class ImageConverter {
    constructor() {
        this.imageUtils = new ImageUtils();
        this.uiHelpers = new UIHelpers();
        this.currentImage = null;
        this.supportedFormats = {
            'image/jpeg': { name: 'JPEG', extension: 'jpg', quality: true, transparency: false },
            'image/png': { name: 'PNG', extension: 'png', quality: false, transparency: true },
            'image/webp': { name: 'WebP', extension: 'webp', quality: true, transparency: true },
            'image/gif': { name: 'GIF', extension: 'gif', quality: false, transparency: true, animation: true },
            'image/bmp': { name: 'BMP', extension: 'bmp', quality: false, transparency: false }
        };
        this.isProcessing = false;
    }

    /**
     * تهيئة محول الصيغ
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
        this.checkBrowserSupport();
    }

    /**
     * إنشاء واجهة محول الصيغ
     */
    createInterface() {
        const controlsSection = document.getElementById('controls-section');
        if (!controlsSection) return;

        controlsSection.innerHTML = `
            <div class="control-panel">
                <div class="control-header">
                    <i class="fas fa-exchange-alt"></i>
                    <h3>محول صيغ الصور</h3>
                </div>
                
                <div class="control-group">
                    <!-- معلومات الصورة الحالية -->
                    <div class="current-format-info" id="current-format-info" style="display: none;">
                        <div class="info-card">
                            <h4>الصيغة الحالية</h4>
                            <div class="format-details">
                                <span class="format-name" id="current-format-name">-</span>
                                <span class="format-size" id="current-format-size">-</span>
                            </div>
                        </div>
                    </div>

                    <!-- اختيار الصيغة المستهدفة -->
                    <div class="control-row">
                        <label class="control-label">تحويل إلى</label>
                        <div class="format-grid" id="format-grid">
                            <!-- سيتم إنشاؤها ديناميكياً -->
                        </div>
                    </div>

                    <!-- إعدادات الجودة (للصيغ التي تدعم الجودة) -->
                    <div class="control-row" id="quality-settings" style="display: none;">
                        <label class="control-label">جودة الصورة</label>
                        <div class="control-input-group">
                            <input type="range" id="conversion-quality" class="form-range" 
                                   min="0.1" max="1" step="0.05" value="0.9">
                            <span class="range-value" id="conversion-quality-value">90%</span>
                        </div>
                    </div>

                    <!-- إعدادات الشفافية -->
                    <div class="control-row" id="transparency-settings" style="display: none;">
                        <label class="control-label">معالجة الشفافية</label>
                        <div class="transparency-options">
                            <label>
                                <input type="radio" name="transparency" value="preserve" checked>
                                <span>الاحتفاظ بالشفافية</span>
                            </label>
                            <label>
                                <input type="radio" name="transparency" value="white">
                                <span>خلفية بيضاء</span>
                            </label>
                            <label>
                                <input type="radio" name="transparency" value="black">
                                <span>خلفية سوداء</span>
                            </label>
                            <label>
                                <input type="radio" name="transparency" value="custom">
                                <span>لون مخصص</span>
                            </label>
                            <input type="color" id="custom-background" value="#ffffff" style="display: none;">
                        </div>
                    </div>

                    <!-- إعدادات متقدمة -->
                    <details class="advanced-settings">
                        <summary>إعدادات متقدمة</summary>
                        
                        <div class="control-row">
                            <label class="control-label">تحسين الحجم</label>
                            <input type="checkbox" id="optimize-size" checked>
                        </div>

                        <div class="control-row">
                            <label class="control-label">معلومات EXIF</label>
                            <select id="exif-handling" class="form-select">
                                <option value="remove">إزالة جميع البيانات</option>
                                <option value="preserve">الاحتفاظ بالبيانات</option>
                                <option value="minimal">الاحتفاظ بالأساسيات فقط</option>
                            </select>
                        </div>

                        <div class="control-row">
                            <label class="control-label">معاينة مباشرة</label>
                            <input type="checkbox" id="live-preview" checked>
                        </div>
                    </details>

                    <!-- أزرار التحكم -->
                    <div class="control-actions">
                        <button id="convert-btn" class="btn btn-primary" disabled>
                            <i class="fas fa-exchange-alt"></i>
                            تحويل الصورة
                        </button>
                        
                        <button id="batch-convert-btn" class="btn btn-secondary" disabled>
                            <i class="fas fa-layer-group"></i>
                            تحويل مجموعة
                        </button>
                        
                        <button id="compare-formats-btn" class="btn btn-outline" disabled>
                            <i class="fas fa-balance-scale"></i>
                            مقارنة الصيغ
                        </button>
                    </div>

                    <!-- مقارنة الصيغ -->
                    <div id="format-comparison" class="format-comparison" style="display: none;">
                        <h4>مقارنة الصيغ</h4>
                        <div class="comparison-grid" id="comparison-grid">
                            <!-- سيتم إنشاؤها ديناميكياً -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.createFormatGrid();
    }

    /**
     * إنشاء شبكة اختيار الصيغ
     */
    createFormatGrid() {
        const formatGrid = document.getElementById('format-grid');
        if (!formatGrid) return;

        formatGrid.innerHTML = '';

        Object.entries(this.supportedFormats).forEach(([mimeType, info]) => {
            const formatCard = document.createElement('div');
            formatCard.className = 'format-card';
            formatCard.dataset.format = mimeType;
            
            formatCard.innerHTML = `
                <div class="format-icon">
                    <i class="fas fa-file-image"></i>
                </div>
                <div class="format-info">
                    <div class="format-name">${info.name}</div>
                    <div class="format-features">
                        ${info.quality ? '<span class="feature">جودة متغيرة</span>' : ''}
                        ${info.transparency ? '<span class="feature">شفافية</span>' : ''}
                        ${info.animation ? '<span class="feature">حركة</span>' : ''}
                    </div>
                </div>
                <div class="format-select">
                    <i class="fas fa-check"></i>
                </div>
            `;

            formatCard.addEventListener('click', () => {
                this.selectFormat(mimeType);
            });

            formatGrid.appendChild(formatCard);
        });
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // تحديث قيمة الجودة
        const qualitySlider = document.getElementById('conversion-quality');
        const qualityValue = document.getElementById('conversion-quality-value');
        
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', (e) => {
                const value = Math.round(e.target.value * 100);
                qualityValue.textContent = `${value}%`;
                
                if (this.currentImage && document.getElementById('live-preview')?.checked) {
                    this.updatePreview();
                }
            });
        }

        // معالجة الشفافية
        const transparencyRadios = document.querySelectorAll('input[name="transparency"]');
        const customBackground = document.getElementById('custom-background');
        
        transparencyRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (customBackground) {
                    customBackground.style.display = e.target.value === 'custom' ? 'inline-block' : 'none';
                }
                
                if (this.currentImage && document.getElementById('live-preview')?.checked) {
                    this.updatePreview();
                }
            });
        });

        // زر التحويل
        const convertBtn = document.getElementById('convert-btn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => {
                this.convertImage();
            });
        }

        // زر المقارنة
        const compareBtn = document.getElementById('compare-formats-btn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                this.compareFormats();
            });
        }

        // المعاينة المباشرة
        const livePreview = document.getElementById('live-preview');
        if (livePreview) {
            livePreview.addEventListener('change', (e) => {
                if (e.target.checked && this.currentImage) {
                    this.updatePreview();
                }
            });
        }
    }

    /**
     * فحص دعم المتصفح للصيغ
     */
    checkBrowserSupport() {
        // فحص دعم WebP
        const webpSupported = this.imageUtils.checkBrowserSupport?.('webp') || 
                             this.createTestCanvas().toDataURL('image/webp').indexOf('data:image/webp') === 0;
        
        if (!webpSupported) {
            const webpCard = document.querySelector('[data-format="image/webp"]');
            if (webpCard) {
                webpCard.classList.add('unsupported');
                webpCard.title = 'غير مدعوم في هذا المتصفح';
            }
        }
    }

    /**
     * إنشاء canvas للاختبار
     * @returns {HTMLCanvasElement}
     */
    createTestCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas;
    }

    /**
     * تحميل صورة للتحويل
     * @param {File|HTMLImageElement} image 
     */
    async loadImage(image) {
        try {
            this.uiHelpers.showLoading('جاري تحليل الصورة...');
            
            if (image instanceof File) {
                this.currentImage = await this.imageUtils.loadImage(image);
                this.currentFormat = image.type;
            } else {
                this.currentImage = image;
                this.currentFormat = 'image/png'; // افتراضي
            }

            this.updateCurrentFormatInfo();
            this.enableControls();
            this.uiHelpers.hideLoading();
            
        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في تحميل الصورة: ' + error.message, 'error');
        }
    }

    /**
     * تحديث معلومات الصيغة الحالية
     */
    updateCurrentFormatInfo() {
        const formatInfo = document.getElementById('current-format-info');
        const formatName = document.getElementById('current-format-name');
        const formatSize = document.getElementById('current-format-size');

        if (formatInfo && formatName && formatSize) {
            const info = this.supportedFormats[this.currentFormat] || { name: 'غير معروف' };
            
            formatName.textContent = info.name || 'غير معروف';
            formatSize.textContent = `${this.currentImage.width} × ${this.currentImage.height}`;
            
            formatInfo.style.display = 'block';
        }
    }

    /**
     * اختيار صيغة الهدف
     * @param {string} format 
     */
    selectFormat(format) {
        // إلغاء التحديد السابق
        document.querySelectorAll('.format-card').forEach(card => {
            card.classList.remove('selected');
        });

        // تحديد الصيغة الجديدة
        const selectedCard = document.querySelector(`[data-format="${format}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        this.selectedFormat = format;
        this.updateFormatSettings(format);
        
        // تحديث المعاينة إذا كانت مفعلة
        if (this.currentImage && document.getElementById('live-preview')?.checked) {
            this.updatePreview();
        }
    }

    /**
     * تحديث إعدادات الصيغة
     * @param {string} format 
     */
    updateFormatSettings(format) {
        const formatInfo = this.supportedFormats[format];
        if (!formatInfo) return;

        // إعدادات الجودة
        const qualitySettings = document.getElementById('quality-settings');
        if (qualitySettings) {
            qualitySettings.style.display = formatInfo.quality ? 'flex' : 'none';
        }

        // إعدادات الشفافية
        const transparencySettings = document.getElementById('transparency-settings');
        if (transparencySettings) {
            transparencySettings.style.display = formatInfo.transparency ? 'block' : 'none';
        }
    }

    /**
     * تحويل الصورة
     */
    async convertImage() {
        if (!this.currentImage || !this.selectedFormat) {
            this.uiHelpers.showNotification('يرجى اختيار صيغة الهدف', 'warning');
            return;
        }

        try {
            this.isProcessing = true;
            this.uiHelpers.showLoading('جاري تحويل الصورة...');

            const result = await this.performConversion(this.currentImage, this.selectedFormat);
            
            // إرسال النتيجة إلى results panel
            this.sendToResults(result);
            
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('تم تحويل الصورة بنجاح', 'success');
            
        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في تحويل الصورة: ' + error.message, 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * تنفيذ عملية التحويل
     * @param {HTMLImageElement} image 
     * @param {string} targetFormat 
     * @returns {Promise<Object>}
     */
    async performConversion(image, targetFormat) {
        const formatInfo = this.supportedFormats[targetFormat];
        const canvas = this.imageUtils.imageToCanvas(image);
        const ctx = canvas.getContext('2d');

        // معالجة الشفافية للصيغ التي لا تدعمها
        if (!formatInfo.transparency && this.hasTransparency(image)) {
            const backgroundOption = document.querySelector('input[name="transparency"]:checked')?.value || 'white';
            const backgroundColor = this.getBackgroundColor(backgroundOption);
            
            // إنشاء canvas جديد بخلفية
            const newCanvas = this.imageUtils.createCanvas(canvas.width, canvas.height);
            const newCtx = newCanvas.getContext('2d');
            
            newCtx.fillStyle = backgroundColor;
            newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
            newCtx.drawImage(canvas, 0, 0);
            
            canvas = newCanvas;
        }

        // إعدادات التحويل
        const options = {
            format: targetFormat,
            quality: formatInfo.quality ? parseFloat(document.getElementById('conversion-quality')?.value || 0.9) : undefined
        };

        // تحسين الحجم إذا كان مفعلاً
        if (document.getElementById('optimize-size')?.checked) {
            options.quality = Math.min(options.quality || 1, 0.85);
        }

        const blob = await this.imageUtils.canvasToBlob(canvas, options);

        return {
            blob,
            canvas,
            originalFormat: this.currentFormat,
            targetFormat,
            size: blob.size,
            dimensions: {
                width: canvas.width,
                height: canvas.height
            },
            settings: options
        };
    }

    /**
     * فحص وجود شفافية في الصورة
     * @param {HTMLImageElement} image 
     * @returns {boolean}
     */
    hasTransparency(image) {
        const canvas = this.imageUtils.imageToCanvas(image);
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // فحص قناة الألفا
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) {
                return true;
            }
        }

        return false;
    }

    /**
     * الحصول على لون الخلفية
     * @param {string} option 
     * @returns {string}
     */
    getBackgroundColor(option) {
        switch (option) {
            case 'white':
                return '#ffffff';
            case 'black':
                return '#000000';
            case 'custom':
                return document.getElementById('custom-background')?.value || '#ffffff';
            default:
                return '#ffffff';
        }
    }

    /**
     * مقارنة الصيغ
     */
    async compareFormats() {
        if (!this.currentImage) return;

        try {
            this.uiHelpers.showLoading('جاري إنشاء المقارنة...');

            const comparisons = [];
            const formatsToCompare = Object.keys(this.supportedFormats);

            for (let format of formatsToCompare) {
                try {
                    const result = await this.performConversion(this.currentImage, format);
                    comparisons.push({
                        format,
                        name: this.supportedFormats[format].name,
                        size: result.size,
                        blob: result.blob,
                        quality: result.settings.quality
                    });
                } catch (error) {
                    console.warn(`فشل في تحويل إلى ${format}:`, error);
                }
            }

            this.displayComparison(comparisons);
            this.uiHelpers.hideLoading();

        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في إنشاء المقارنة: ' + error.message, 'error');
        }
    }

    /**
     * عرض مقارنة الصيغ
     * @param {Array} comparisons 
     */
    displayComparison(comparisons) {
        const comparisonSection = document.getElementById('format-comparison');
        const comparisonGrid = document.getElementById('comparison-grid');

        if (!comparisonSection || !comparisonGrid) return;

        // ترتيب حسب الحجم
        comparisons.sort((a, b) => a.size - b.size);

        comparisonGrid.innerHTML = '';

        comparisons.forEach((comp, index) => {
            const comparisonCard = document.createElement('div');
            comparisonCard.className = 'comparison-card';
            
            comparisonCard.innerHTML = `
                <div class="comparison-header">
                    <span class="format-name">${comp.name}</span>
                    <span class="rank">#${index + 1}</span>
                </div>
                <div class="comparison-stats">
                    <div class="stat">
                        <label>الحجم:</label>
                        <span>${this.formatFileSize(comp.size)}</span>
                    </div>
                    ${comp.quality ? `
                        <div class="stat">
                            <label>الجودة:</label>
                            <span>${Math.round(comp.quality * 100)}%</span>
                        </div>
                    ` : ''}
                </div>
                <div class="comparison-actions">
                    <button class="btn btn-sm btn-primary" onclick="this.selectThis('${comp.format}')">
                        اختيار هذه الصيغة
                    </button>
                </div>
            `;

            comparisonGrid.appendChild(comparisonCard);
        });

        comparisonSection.style.display = 'block';
        this.uiHelpers.scrollIntoView(comparisonSection);
    }

    /**
     * تحديث المعاينة
     */
    async updatePreview() {
        if (!this.currentImage || !this.selectedFormat || this.isProcessing) return;

        try {
            const result = await this.performConversion(this.currentImage, this.selectedFormat);
            
            // عرض النتيجة في panel المعاينة
            const event = new CustomEvent('imagePreviewUpdate', {
                detail: {
                    type: 'comparison',
                    original: this.currentImage,
                    processed: result.canvas,
                    info: {
                        originalFormat: this.currentFormat,
                        targetFormat: this.selectedFormat,
                        originalSize: null, // سيتم حسابه في المعاينة
                        processedSize: result.size,
                        dimensions: result.dimensions
                    }
                }
            });
            
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error('خطأ في المعاينة:', error);
        }
    }

    /**
     * إرسال النتيجة إلى results panel
     * @param {Object} result 
     */
    sendToResults(result) {
        const event = new CustomEvent('imageProcessed', {
            detail: {
                type: 'conversion',
                blob: result.blob,
                originalFormat: result.originalFormat,
                targetFormat: result.targetFormat,
                size: result.size,
                dimensions: result.dimensions,
                filename: this.generateFilename(result.targetFormat)
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * توليد اسم الملف
     * @param {string} format 
     * @returns {string}
     */
    generateFilename(format) {
        const extension = this.supportedFormats[format]?.extension || 'img';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        return `converted_image_${timestamp}.${extension}`;
    }

    /**
     * تنسيق حجم الملف
     * @param {number} bytes 
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * تفعيل أزرار التحكم
     */
    enableControls() {
        document.getElementById('convert-btn').disabled = false;
        document.getElementById('compare-formats-btn').disabled = false;
    }

    /**
     * إعادة تعيين
     */
    reset() {
        this.currentImage = null;
        this.selectedFormat = null;
        this.currentFormat = null;
        
        // إخفاء المعلومات
        const formatInfo = document.getElementById('current-format-info');
        if (formatInfo) {
            formatInfo.style.display = 'none';
        }
        
        const comparisonSection = document.getElementById('format-comparison');
        if (comparisonSection) {
            comparisonSection.style.display = 'none';
        }
        
        // إلغاء التحديد
        document.querySelectorAll('.format-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // تعطيل الأزرار
        document.getElementById('convert-btn').disabled = true;
        document.getElementById('compare-formats-btn').disabled = true;
        
        this.uiHelpers.showNotification('تم إعادة تعيين المحول', 'info');
    }
}

// تصدير الكلاس
export default ImageConverter;