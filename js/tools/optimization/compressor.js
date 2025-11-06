/**
 * Image Compressor Tool
 * ضاغط الصور - يقلل حجم الملف مع الحفاظ على الجودة
 */

import ImageUtils from '../utils/imageUtils.js';
import UIHelpers from '../utils/uiHelpers.js';

class ImageCompressor {
    constructor() {
        this.imageUtils = new ImageUtils();
        this.uiHelpers = new UIHelpers();
        this.currentImage = null;
        this.originalSize = 0;
        this.compressedSize = 0;
        this.isProcessing = false;
    }

    /**
     * تهيئة ضاغط الصور
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
    }

    /**
     * إنشاء واجهة ضاغط الصور
     */
    createInterface() {
        const controlsSection = document.getElementById('controls-section');
        if (!controlsSection) return;

        controlsSection.innerHTML = `
            <div class="control-panel">
                <div class="control-header">
                    <i class="fas fa-compress-arrows-alt"></i>
                    <h3>ضاغط الصور</h3>
                </div>
                
                <div class="control-group">
                    <!-- إعدادات الضغط -->
                    <div class="control-row">
                        <label class="control-label">جودة الضغط</label>
                        <div class="control-input-group">
                            <input type="range" id="quality-slider" class="form-range" 
                                   min="0.1" max="1" step="0.05" value="0.8">
                            <span class="range-value" id="quality-value">80%</span>
                        </div>
                    </div>

                    <div class="control-row">
                        <label class="control-label">صيغة الإخراج</label>
                        <select id="output-format" class="form-select">
                            <option value="image/jpeg">JPEG (أصغر حجم)</option>
                            <option value="image/png">PNG (جودة عالية)</option>
                            <option value="image/webp">WebP (متوازن)</option>
                        </select>
                    </div>

                    <div class="control-row">
                        <label class="control-label">حد أقصى للحجم (MB)</label>
                        <div class="control-input-group">
                            <input type="number" id="max-file-size" class="form-input" 
                                   min="0.1" max="50" step="0.1" value="2">
                            <span>MB</span>
                        </div>
                    </div>

                    <!-- إعدادات متقدمة -->
                    <details class="advanced-settings">
                        <summary>إعدادات متقدمة</summary>
                        
                        <div class="control-row">
                            <label class="control-label">تقليل الأبعاد</label>
                            <div class="control-input-group">
                                <input type="checkbox" id="resize-enabled">
                                <label for="resize-enabled">تفعيل تقليل الأبعاد</label>
                            </div>
                        </div>

                        <div class="control-row" id="resize-options" style="display: none;">
                            <label class="control-label">الحد الأقصى للعرض</label>
                            <input type="number" id="max-width" class="form-input" 
                                   value="1920" min="100" max="4000">
                        </div>

                        <div class="control-row">
                            <label class="control-label">إزالة البيانات الوصفية</label>
                            <input type="checkbox" id="remove-metadata" checked>
                        </div>

                        <div class="control-row">
                            <label class="control-label">تحسين للويب</label>
                            <input type="checkbox" id="web-optimization" checked>
                        </div>
                    </details>

                    <!-- أزرار التحكم -->
                    <div class="control-actions">
                        <button id="compress-btn" class="btn btn-primary" disabled>
                            <i class="fas fa-compress"></i>
                            ضغط الصورة
                        </button>
                        
                        <button id="auto-compress-btn" class="btn btn-secondary" disabled>
                            <i class="fas fa-magic"></i>
                            ضغط تلقائي
                        </button>
                        
                        <button id="reset-btn" class="btn btn-outline">
                            <i class="fas fa-undo"></i>
                            إعادة تعيين
                        </button>
                    </div>

                    <!-- معلومات الضغط -->
                    <div id="compression-info" class="compression-stats" style="display: none;">
                        <div class="stat-card">
                            <div class="stat-value" id="original-size">0 KB</div>
                            <div class="stat-label">الحجم الأصلي</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="compressed-size">0 KB</div>
                            <div class="stat-label">الحجم بعد الضغط</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="compression-ratio">0%</div>
                            <div class="stat-label">نسبة التوفير</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // تحديث قيمة الجودة
        const qualitySlider = document.getElementById('quality-slider');
        const qualityValue = document.getElementById('quality-value');
        
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', (e) => {
                const value = Math.round(e.target.value * 100);
                qualityValue.textContent = `${value}%`;
                
                if (this.currentImage) {
                    this.updatePreview();
                }
            });
        }

        // تغيير صيغة الإخراج
        const outputFormat = document.getElementById('output-format');
        if (outputFormat) {
            outputFormat.addEventListener('change', () => {
                if (this.currentImage) {
                    this.updatePreview();
                }
            });
        }

        // تفعيل/إلغاء تقليل الأبعاد
        const resizeEnabled = document.getElementById('resize-enabled');
        const resizeOptions = document.getElementById('resize-options');
        
        if (resizeEnabled && resizeOptions) {
            resizeEnabled.addEventListener('change', (e) => {
                resizeOptions.style.display = e.target.checked ? 'block' : 'none';
                
                if (this.currentImage) {
                    this.updatePreview();
                }
            });
        }

        // تغيير العرض الأقصى
        const maxWidth = document.getElementById('max-width');
        if (maxWidth) {
            maxWidth.addEventListener('input', () => {
                if (this.currentImage && resizeEnabled?.checked) {
                    this.updatePreview();
                }
            });
        }

        // زر الضغط
        const compressBtn = document.getElementById('compress-btn');
        if (compressBtn) {
            compressBtn.addEventListener('click', () => {
                this.compressImage();
            });
        }

        // زر الضغط التلقائي
        const autoCompressBtn = document.getElementById('auto-compress-btn');
        if (autoCompressBtn) {
            autoCompressBtn.addEventListener('click', () => {
                this.autoCompress();
            });
        }

        // زر إعادة التعيين
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.reset();
            });
        }
    }

    /**
     * تحميل صورة للضغط
     * @param {File|HTMLImageElement} image 
     */
    async loadImage(image) {
        try {
            this.uiHelpers.showLoading('جاري تحميل الصورة...');
            
            if (image instanceof File) {
                this.currentImage = await this.imageUtils.loadImage(image);
                this.originalSize = image.size;
            } else {
                this.currentImage = image;
                // تقدير الحجم الأصلي للصورة
                const canvas = this.imageUtils.imageToCanvas(image);
                const blob = await this.imageUtils.canvasToBlob(canvas, { quality: 1 });
                this.originalSize = blob.size;
            }

            this.enableControls();
            this.updateOriginalInfo();
            this.updatePreview();
            
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('تم تحميل الصورة بنجاح', 'success');
            
        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في تحميل الصورة: ' + error.message, 'error');
        }
    }

    /**
     * تحديث معاينة الضغط
     */
    async updatePreview() {
        if (!this.currentImage || this.isProcessing) return;

        try {
            const settings = this.getCompressionSettings();
            const compressed = await this.performCompression(this.currentImage, settings);
            
            // عرض النتيجة في panel المعاينة
            this.displayPreview(compressed);
            
            // تحديث معلومات الضغط
            this.updateCompressionInfo(compressed.size);
            
        } catch (error) {
            console.error('خطأ في المعاينة:', error);
        }
    }

    /**
     * ضغط الصورة
     */
    async compressImage() {
        if (!this.currentImage || this.isProcessing) return;

        try {
            this.isProcessing = true;
            this.uiHelpers.showLoading('جاري ضغط الصورة...');

            const settings = this.getCompressionSettings();
            const result = await this.performCompression(this.currentImage, settings);
            
            // إرسال النتيجة إلى results panel
            this.sendToResults(result);
            
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('تم ضغط الصورة بنجاح', 'success');
            
        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في ضغط الصورة: ' + error.message, 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * ضغط تلقائي ذكي
     */
    async autoCompress() {
        if (!this.currentImage) return;

        try {
            this.uiHelpers.showLoading('جاري تحليل الصورة...');

            const maxFileSize = parseFloat(document.getElementById('max-file-size')?.value || 2) * 1024 * 1024;
            const optimalSettings = await this.findOptimalSettings(maxFileSize);
            
            // تطبيق الإعدادات المثلى
            this.applySettings(optimalSettings);
            
            // ضغط الصورة
            await this.compressImage();
            
            this.uiHelpers.showNotification('تم العثور على الإعدادات المثلى وتطبيقها', 'success');
            
        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في الضغط التلقائي: ' + error.message, 'error');
        }
    }

    /**
     * الحصول على إعدادات الضغط الحالية
     * @returns {Object}
     */
    getCompressionSettings() {
        const quality = parseFloat(document.getElementById('quality-slider')?.value || 0.8);
        const format = document.getElementById('output-format')?.value || 'image/jpeg';
        const resizeEnabled = document.getElementById('resize-enabled')?.checked || false;
        const maxWidth = parseInt(document.getElementById('max-width')?.value || 1920);
        const removeMetadata = document.getElementById('remove-metadata')?.checked || true;
        const webOptimization = document.getElementById('web-optimization')?.checked || true;

        return {
            quality,
            format,
            resizeEnabled,
            maxWidth,
            removeMetadata,
            webOptimization
        };
    }

    /**
     * تنفيذ عملية الضغط
     * @param {HTMLImageElement} image 
     * @param {Object} settings 
     * @returns {Promise<Object>}
     */
    async performCompression(image, settings) {
        let processedImage = image;

        // تقليل الأبعاد إذا كان مفعلاً
        if (settings.resizeEnabled && image.width > settings.maxWidth) {
            const canvas = this.imageUtils.resizeImage(image, {
                width: settings.maxWidth,
                maintainAspectRatio: true,
                resizeMethod: 'lanczos'
            });
            
            // تحويل Canvas إلى Image
            const dataUrl = this.imageUtils.canvasToBase64(canvas, { 
                format: settings.format, 
                quality: settings.quality 
            });
            processedImage = await this.imageUtils.loadImage(dataUrl);
        }

        // إنشاء canvas للمعالجة النهائية
        const canvas = this.imageUtils.imageToCanvas(processedImage);
        
        // تحسين للويب
        if (settings.webOptimization) {
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }

        // تحويل إلى Blob
        const blob = await this.imageUtils.canvasToBlob(canvas, {
            format: settings.format,
            quality: settings.quality
        });

        return {
            blob,
            canvas,
            size: blob.size,
            format: settings.format,
            quality: settings.quality,
            dimensions: {
                width: canvas.width,
                height: canvas.height
            }
        };
    }

    /**
     * العثور على الإعدادات المثلى
     * @param {number} targetSize 
     * @returns {Promise<Object>}
     */
    async findOptimalSettings(targetSize) {
        const originalCanvas = this.imageUtils.imageToCanvas(this.currentImage);
        let bestSettings = {
            quality: 0.8,
            format: 'image/jpeg',
            resizeEnabled: false,
            maxWidth: this.currentImage.width
        };

        // اختبار صيغ مختلفة
        const formats = ['image/webp', 'image/jpeg', 'image/png'];
        
        for (let format of formats) {
            for (let quality = 0.9; quality >= 0.3; quality -= 0.1) {
                const blob = await this.imageUtils.canvasToBlob(originalCanvas, { format, quality });
                
                if (blob.size <= targetSize) {
                    return {
                        quality,
                        format,
                        resizeEnabled: false,
                        maxWidth: this.currentImage.width
                    };
                }
            }
        }

        // إذا لم تنجح الطرق السابقة، جرب تقليل الأبعاد
        const reductionFactors = [0.9, 0.8, 0.7, 0.6, 0.5];
        
        for (let factor of reductionFactors) {
            const newWidth = Math.floor(this.currentImage.width * factor);
            const resizedCanvas = this.imageUtils.resizeImage(this.currentImage, {
                width: newWidth,
                maintainAspectRatio: true
            });

            for (let quality = 0.9; quality >= 0.3; quality -= 0.1) {
                const blob = await this.imageUtils.canvasToBlob(resizedCanvas, { 
                    format: 'image/jpeg', 
                    quality 
                });
                
                if (blob.size <= targetSize) {
                    return {
                        quality,
                        format: 'image/jpeg',
                        resizeEnabled: true,
                        maxWidth: newWidth
                    };
                }
            }
        }

        return bestSettings;
    }

    /**
     * تطبيق الإعدادات
     * @param {Object} settings 
     */
    applySettings(settings) {
        document.getElementById('quality-slider').value = settings.quality;
        document.getElementById('quality-value').textContent = `${Math.round(settings.quality * 100)}%`;
        document.getElementById('output-format').value = settings.format;
        document.getElementById('resize-enabled').checked = settings.resizeEnabled;
        document.getElementById('max-width').value = settings.maxWidth;
        document.getElementById('resize-options').style.display = settings.resizeEnabled ? 'block' : 'none';
    }

    /**
     * عرض المعاينة
     * @param {Object} result 
     */
    displayPreview(result) {
        // إرسال إلى preview panel
        const event = new CustomEvent('imagePreviewUpdate', {
            detail: {
                type: 'comparison',
                original: this.currentImage,
                processed: result.canvas,
                info: {
                    originalSize: this.originalSize,
                    processedSize: result.size,
                    format: result.format,
                    quality: result.quality,
                    dimensions: result.dimensions
                }
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * إرسال النتيجة إلى results panel
     * @param {Object} result 
     */
    sendToResults(result) {
        const event = new CustomEvent('imageProcessed', {
            detail: {
                type: 'compression',
                blob: result.blob,
                originalSize: this.originalSize,
                processedSize: result.size,
                savings: this.originalSize - result.size,
                savingsPercentage: ((this.originalSize - result.size) / this.originalSize * 100).toFixed(1),
                format: result.format,
                quality: result.quality,
                dimensions: result.dimensions,
                filename: this.generateFilename(result.format)
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
        const extension = format.split('/')[1];
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        return `compressed_image_${timestamp}.${extension}`;
    }

    /**
     * تحديث معلومات الحجم الأصلي
     */
    updateOriginalInfo() {
        const originalSizeElement = document.getElementById('original-size');
        if (originalSizeElement) {
            originalSizeElement.textContent = this.formatFileSize(this.originalSize);
        }
    }

    /**
     * تحديث معلومات الضغط
     * @param {number} compressedSize 
     */
    updateCompressionInfo(compressedSize) {
        this.compressedSize = compressedSize;
        
        const compressedSizeElement = document.getElementById('compressed-size');
        const compressionRatioElement = document.getElementById('compression-ratio');
        const compressionInfo = document.getElementById('compression-info');

        if (compressedSizeElement && compressionRatioElement) {
            compressedSizeElement.textContent = this.formatFileSize(compressedSize);
            
            const savings = ((this.originalSize - compressedSize) / this.originalSize * 100);
            compressionRatioElement.textContent = `${savings.toFixed(1)}%`;
            
            // تغيير اللون حسب نسبة التوفير
            compressionRatioElement.style.color = 
                savings > 50 ? 'var(--success-color)' :
                savings > 25 ? 'var(--warning-color)' :
                'var(--error-color)';
        }

        if (compressionInfo) {
            compressionInfo.style.display = 'grid';
        }
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
        document.getElementById('compress-btn').disabled = false;
        document.getElementById('auto-compress-btn').disabled = false;
    }

    /**
     * إعادة تعيين
     */
    reset() {
        this.currentImage = null;
        this.originalSize = 0;
        this.compressedSize = 0;
        
        // إعادة تعيين القيم الافتراضية
        document.getElementById('quality-slider').value = 0.8;
        document.getElementById('quality-value').textContent = '80%';
        document.getElementById('output-format').value = 'image/jpeg';
        document.getElementById('resize-enabled').checked = false;
        document.getElementById('resize-options').style.display = 'none';
        document.getElementById('max-width').value = 1920;
        document.getElementById('remove-metadata').checked = true;
        document.getElementById('web-optimization').checked = true;
        
        // إخفاء معلومات الضغط
        const compressionInfo = document.getElementById('compression-info');
        if (compressionInfo) {
            compressionInfo.style.display = 'none';
        }
        
        // تعطيل الأزرار
        document.getElementById('compress-btn').disabled = true;
        document.getElementById('auto-compress-btn').disabled = true;
        
        this.uiHelpers.showNotification('تم إعادة تعيين الإعدادات', 'info');
    }
}

// تصدير الكلاس
export default ImageCompressor;