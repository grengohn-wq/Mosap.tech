/**
 * Image Resizer Tool
 * مغير حجم الصور - تغيير الأبعاد والحجم بطرق متعددة
 */

import ImageUtils from '../utils/imageUtils.js';
import UIHelpers from '../utils/uiHelpers.js';

class ImageResizer {
    constructor() {
        this.imageUtils = new ImageUtils();
        this.uiHelpers = new UIHelpers();
        this.currentImage = null;
        this.aspectRatio = 1;
        this.isProcessing = false;
        this.presetSizes = {
            social: {
                name: 'وسائل التواصل الاجتماعي',
                sizes: {
                    'facebook-cover': { width: 851, height: 315, name: 'غلاف فيسبوك' },
                    'facebook-post': { width: 1200, height: 630, name: 'منشور فيسبوك' },
                    'instagram-post': { width: 1080, height: 1080, name: 'منشور إنستغرام' },
                    'instagram-story': { width: 1080, height: 1920, name: 'ستوري إنستغرام' },
                    'twitter-post': { width: 1024, height: 512, name: 'منشور تويتر' },
                    'linkedin-post': { width: 1200, height: 627, name: 'منشور لينكد إن' },
                    'youtube-thumbnail': { width: 1280, height: 720, name: 'صورة مصغرة يوتيوب' }
                }
            },
            web: {
                name: 'تطوير الويب',
                sizes: {
                    'hero-banner': { width: 1920, height: 1080, name: 'بانر رئيسي' },
                    'blog-featured': { width: 1200, height: 630, name: 'صورة مقال مميز' },
                    'product-image': { width: 800, height: 800, name: 'صورة منتج' },
                    'avatar-large': { width: 300, height: 300, name: 'صورة شخصية كبيرة' },
                    'avatar-small': { width: 100, height: 100, name: 'صورة شخصية صغيرة' }
                }
            },
            print: {
                name: 'الطباعة',
                sizes: {
                    'a4-portrait': { width: 2480, height: 3508, name: 'A4 عمودي' },
                    'a4-landscape': { width: 3508, height: 2480, name: 'A4 أفقي' },
                    'business-card': { width: 1050, height: 600, name: 'بطاقة عمل' },
                    'poster-small': { width: 2480, height: 3508, name: 'ملصق صغير' },
                    'poster-large': { width: 4961, height: 7016, name: 'ملصق كبير' }
                }
            }
        };
    }

    /**
     * تهيئة مغير الحجم
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
    }

    /**
     * إنشاء واجهة مغير الحجم
     */
    createInterface() {
        const controlsSection = document.getElementById('controls-section');
        if (!controlsSection) return;

        controlsSection.innerHTML = `
            <div class="control-panel">
                <div class="control-header">
                    <i class="fas fa-expand-arrows-alt"></i>
                    <h3>مغير حجم الصور</h3>
                </div>
                
                <div class="control-group">
                    <!-- معلومات الصورة الحالية -->
                    <div class="current-image-info" id="current-image-info" style="display: none;">
                        <div class="info-row">
                            <span>الأبعاد الحالية:</span>
                            <span id="current-dimensions">-</span>
                        </div>
                        <div class="info-row">
                            <span>نسبة العرض للارتفاع:</span>
                            <span id="current-aspect-ratio">-</span>
                        </div>
                        <div class="info-row">
                            <span>الدقة:</span>
                            <span id="current-megapixels">-</span>
                        </div>
                    </div>

                    <!-- طرق تغيير الحجم -->
                    <div class="resize-methods">
                        <div class="method-tabs">
                            <button class="method-tab active" data-method="custom">مخصص</button>
                            <button class="method-tab" data-method="preset">أحجام جاهزة</button>
                            <button class="method-tab" data-method="percentage">نسبة مئوية</button>
                            <button class="method-tab" data-method="fit">ملائمة الحجم</button>
                        </div>

                        <!-- الطريقة المخصصة -->
                        <div class="method-content active" data-method="custom">
                            <div class="control-row">
                                <label class="control-label">الأبعاد الجديدة</label>
                                <div class="dimensions-input">
                                    <input type="number" id="custom-width" class="form-input" placeholder="العرض" min="1" max="8000">
                                    <span class="dimensions-separator">×</span>
                                    <input type="number" id="custom-height" class="form-input" placeholder="الارتفاع" min="1" max="8000">
                                    <button type="button" id="lock-aspect-ratio" class="aspect-lock-btn" title="قفل نسبة العرض للارتفاع">
                                        <i class="fas fa-link"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- الأحجام الجاهزة -->
                        <div class="method-content" data-method="preset">
                            <div class="control-row">
                                <label class="control-label">الفئة</label>
                                <select id="preset-category" class="form-select">
                                    <option value="">اختر الفئة</option>
                                    <option value="social">وسائل التواصل الاجتماعي</option>
                                    <option value="web">تطوير الويب</option>
                                    <option value="print">الطباعة</option>
                                </select>
                            </div>
                            <div class="control-row">
                                <label class="control-label">الحجم</label>
                                <select id="preset-size" class="form-select" disabled>
                                    <option value="">اختر الحجم</option>
                                </select>
                            </div>
                            <div class="preset-preview" id="preset-preview"></div>
                        </div>

                        <!-- النسبة المئوية -->
                        <div class="method-content" data-method="percentage">
                            <div class="control-row">
                                <label class="control-label">نسبة التغيير</label>
                                <div class="control-input-group">
                                    <input type="range" id="percentage-slider" class="form-range" 
                                           min="10" max="300" step="5" value="100">
                                    <span class="range-value" id="percentage-value">100%</span>
                                </div>
                            </div>
                            <div class="percentage-shortcuts">
                                <button class="percentage-btn" data-percentage="25">25%</button>
                                <button class="percentage-btn" data-percentage="50">50%</button>
                                <button class="percentage-btn" data-percentage="75">75%</button>
                                <button class="percentage-btn" data-percentage="150">150%</button>
                                <button class="percentage-btn" data-percentage="200">200%</button>
                            </div>
                        </div>

                        <!-- ملائمة الحجم -->
                        <div class="method-content" data-method="fit">
                            <div class="control-row">
                                <label class="control-label">ملائمة داخل</label>
                                <div class="fit-dimensions">
                                    <input type="number" id="fit-width" class="form-input" placeholder="العرض الأقصى" min="1" max="8000">
                                    <span class="dimensions-separator">×</span>
                                    <input type="number" id="fit-height" class="form-input" placeholder="الارتفاع الأقصى" min="1" max="8000">
                                </div>
                            </div>
                            <div class="control-row">
                                <label class="control-label">طريقة الملائمة</label>
                                <select id="fit-method" class="form-select">
                                    <option value="contain">احتواء (حفظ النسبة)</option>
                                    <option value="cover">تغطية (قص إذا لزم)</option>
                                    <option value="fill">ملء (تمدد)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- إعدادات الجودة -->
                    <div class="control-row">
                        <label class="control-label">طريقة إعادة العينة</label>
                        <select id="resampling-method" class="form-select">
                            <option value="auto">تلقائي (مُوصى)</option>
                            <option value="lanczos">Lanczos (جودة عالية)</option>
                            <option value="bicubic">Bicubic (متوازن)</option>
                            <option value="bilinear">Bilinear (سريع)</option>
                        </select>
                    </div>

                    <!-- إعدادات متقدمة -->
                    <details class="advanced-settings">
                        <summary>إعدادات متقدمة</summary>
                        
                        <div class="control-row">
                            <label class="control-label">تحسين للعرض</label>
                            <select id="optimization-target" class="form-select">
                                <option value="balanced">متوازن</option>
                                <option value="quality">أولوية للجودة</option>
                                <option value="speed">أولوية للسرعة</option>
                                <option value="size">أولوية لحجم الملف</option>
                            </select>
                        </div>

                        <div class="control-row">
                            <label class="control-label">معالج الحواف</label>
                            <input type="checkbox" id="edge-enhancement" checked>
                        </div>

                        <div class="control-row">
                            <label class="control-label">معاينة مباشرة</label>
                            <input type="checkbox" id="live-preview-resize" checked>
                        </div>
                    </details>

                    <!-- أزرار التحكم -->
                    <div class="control-actions">
                        <button id="resize-btn" class="btn btn-primary" disabled>
                            <i class="fas fa-expand-arrows-alt"></i>
                            تغيير الحجم
                        </button>
                        
                        <button id="batch-resize-btn" class="btn btn-secondary" disabled>
                            <i class="fas fa-layer-group"></i>
                            تغيير مجموعة
                        </button>
                        
                        <button id="smart-resize-btn" class="btn btn-outline" disabled>
                            <i class="fas fa-brain"></i>
                            تغيير ذكي
                        </button>
                    </div>

                    <!-- معاينة النتيجة -->
                    <div class="resize-preview" id="resize-preview" style="display: none;">
                        <h4>النتيجة المتوقعة</h4>
                        <div class="preview-stats">
                            <div class="stat">
                                <label>الأبعاد الجديدة:</label>
                                <span id="new-dimensions">-</span>
                            </div>
                            <div class="stat">
                                <label>الحجم التقديري:</label>
                                <span id="estimated-size">-</span>
                            </div>
                            <div class="stat">
                                <label>نسبة التغيير:</label>
                                <span id="scale-ratio">-</span>
                            </div>
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
        // تبديل طرق تغيير الحجم
        const methodTabs = document.querySelectorAll('.method-tab');
        methodTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchMethod(e.target.dataset.method);
            });
        });

        // الأبعاد المخصصة
        const customWidth = document.getElementById('custom-width');
        const customHeight = document.getElementById('custom-height');
        const aspectLockBtn = document.getElementById('lock-aspect-ratio');
        
        if (customWidth && customHeight) {
            customWidth.addEventListener('input', () => {
                if (aspectLockBtn?.classList.contains('locked') && this.aspectRatio) {
                    customHeight.value = Math.round(customWidth.value / this.aspectRatio);
                }
                this.updatePreview();
            });

            customHeight.addEventListener('input', () => {
                if (aspectLockBtn?.classList.contains('locked') && this.aspectRatio) {
                    customWidth.value = Math.round(customHeight.value * this.aspectRatio);
                }
                this.updatePreview();
            });
        }

        // قفل نسبة العرض للارتفاع
        if (aspectLockBtn) {
            aspectLockBtn.addEventListener('click', () => {
                aspectLockBtn.classList.toggle('locked');
                const icon = aspectLockBtn.querySelector('i');
                if (aspectLockBtn.classList.contains('locked')) {
                    icon.className = 'fas fa-link';
                } else {
                    icon.className = 'fas fa-unlink';
                }
            });
        }

        // الأحجام الجاهزة
        const presetCategory = document.getElementById('preset-category');
        const presetSize = document.getElementById('preset-size');
        
        if (presetCategory) {
            presetCategory.addEventListener('change', (e) => {
                this.updatePresetSizes(e.target.value);
            });
        }

        if (presetSize) {
            presetSize.addEventListener('change', () => {
                this.applyPresetSize();
            });
        }

        // النسبة المئوية
        const percentageSlider = document.getElementById('percentage-slider');
        const percentageValue = document.getElementById('percentage-value');
        
        if (percentageSlider && percentageValue) {
            percentageSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                percentageValue.textContent = `${value}%`;
                this.updatePreview();
            });
        }

        // أزرار النسب المختصرة
        const percentageBtns = document.querySelectorAll('.percentage-btn');
        percentageBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const percentage = e.target.dataset.percentage;
                percentageSlider.value = percentage;
                percentageValue.textContent = `${percentage}%`;
                this.updatePreview();
            });
        });

        // ملائمة الحجم
        const fitInputs = document.querySelectorAll('#fit-width, #fit-height, #fit-method');
        fitInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updatePreview();
            });
        });

        // زر تغيير الحجم
        const resizeBtn = document.getElementById('resize-btn');
        if (resizeBtn) {
            resizeBtn.addEventListener('click', () => {
                this.resizeImage();
            });
        }

        // زر التغيير الذكي
        const smartResizeBtn = document.getElementById('smart-resize-btn');
        if (smartResizeBtn) {
            smartResizeBtn.addEventListener('click', () => {
                this.smartResize();
            });
        }

        // المعاينة المباشرة
        const livePreview = document.getElementById('live-preview-resize');
        if (livePreview) {
            livePreview.addEventListener('change', (e) => {
                if (e.target.checked && this.currentImage) {
                    this.updatePreview();
                }
            });
        }
    }

    /**
     * تبديل طريقة تغيير الحجم
     * @param {string} method 
     */
    switchMethod(method) {
        // تحديث التبويبات
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.method === method);
        });

        // تحديث المحتوى
        document.querySelectorAll('.method-content').forEach(content => {
            content.classList.toggle('active', content.dataset.method === method);
        });

        this.currentMethod = method;
        this.updatePreview();
    }

    /**
     * تحميل صورة لتغيير حجمها
     * @param {File|HTMLImageElement} image 
     */
    async loadImage(image) {
        try {
            this.uiHelpers.showLoading('جاري تحليل الصورة...');
            
            if (image instanceof File) {
                this.currentImage = await this.imageUtils.loadImage(image);
            } else {
                this.currentImage = image;
            }

            this.aspectRatio = this.currentImage.width / this.currentImage.height;
            
            this.updateCurrentImageInfo();
            this.setDefaultValues();
            this.enableControls();
            this.updatePreview();
            
            this.uiHelpers.hideLoading();
            
        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في تحميل الصورة: ' + error.message, 'error');
        }
    }

    /**
     * تحديث معلومات الصورة الحالية
     */
    updateCurrentImageInfo() {
        const imageInfo = document.getElementById('current-image-info');
        const dimensions = document.getElementById('current-dimensions');
        const aspectRatio = document.getElementById('current-aspect-ratio');
        const megapixels = document.getElementById('current-megapixels');

        if (imageInfo && dimensions && aspectRatio && megapixels) {
            const mp = (this.currentImage.width * this.currentImage.height / 1000000).toFixed(2);
            
            dimensions.textContent = `${this.currentImage.width} × ${this.currentImage.height}`;
            aspectRatio.textContent = `${this.aspectRatio.toFixed(2)}:1`;
            megapixels.textContent = `${mp} MP`;
            
            imageInfo.style.display = 'block';
        }
    }

    /**
     * تعيين القيم الافتراضية
     */
    setDefaultValues() {
        const customWidth = document.getElementById('custom-width');
        const customHeight = document.getElementById('custom-height');
        
        if (customWidth && customHeight) {
            customWidth.value = this.currentImage.width;
            customHeight.value = this.currentImage.height;
        }
    }

    /**
     * تحديث أحجام البريسيت
     * @param {string} category 
     */
    updatePresetSizes(category) {
        const presetSize = document.getElementById('preset-size');
        if (!presetSize) return;

        presetSize.innerHTML = '<option value="">اختر الحجم</option>';
        presetSize.disabled = !category;

        if (category && this.presetSizes[category]) {
            const sizes = this.presetSizes[category].sizes;
            Object.entries(sizes).forEach(([key, size]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = `${size.name} (${size.width}×${size.height})`;
                presetSize.appendChild(option);
            });
            presetSize.disabled = false;
        }
    }

    /**
     * تطبيق حجم البريسيت
     */
    applyPresetSize() {
        const category = document.getElementById('preset-category')?.value;
        const sizeKey = document.getElementById('preset-size')?.value;
        
        if (!category || !sizeKey) return;

        const sizeInfo = this.presetSizes[category]?.sizes[sizeKey];
        if (sizeInfo) {
            const preview = document.getElementById('preset-preview');
            if (preview) {
                preview.innerHTML = `
                    <div class="preset-info">
                        <h5>${sizeInfo.name}</h5>
                        <p>الأبعاد: ${sizeInfo.width} × ${sizeInfo.height}</p>
                        <p>النسبة: ${(sizeInfo.width / sizeInfo.height).toFixed(2)}:1</p>
                    </div>
                `;
            }
            
            this.updatePreview();
        }
    }

    /**
     * حساب الأبعاد الجديدة
     * @returns {Object}
     */
    calculateNewDimensions() {
        if (!this.currentImage) return null;

        const method = this.currentMethod || 'custom';
        let width, height;

        switch (method) {
            case 'custom':
                width = parseInt(document.getElementById('custom-width')?.value) || this.currentImage.width;
                height = parseInt(document.getElementById('custom-height')?.value) || this.currentImage.height;
                break;

            case 'preset':
                const category = document.getElementById('preset-category')?.value;
                const sizeKey = document.getElementById('preset-size')?.value;
                const sizeInfo = this.presetSizes[category]?.sizes[sizeKey];
                
                if (sizeInfo) {
                    width = sizeInfo.width;
                    height = sizeInfo.height;
                } else {
                    width = this.currentImage.width;
                    height = this.currentImage.height;
                }
                break;

            case 'percentage':
                const percentage = parseInt(document.getElementById('percentage-slider')?.value) || 100;
                width = Math.round(this.currentImage.width * percentage / 100);
                height = Math.round(this.currentImage.height * percentage / 100);
                break;

            case 'fit':
                const fitWidth = parseInt(document.getElementById('fit-width')?.value);
                const fitHeight = parseInt(document.getElementById('fit-height')?.value);
                const fitMethod = document.getElementById('fit-method')?.value || 'contain';
                
                if (fitWidth && fitHeight) {
                    const scale = this.calculateFitScale(fitWidth, fitHeight, fitMethod);
                    width = Math.round(this.currentImage.width * scale);
                    height = Math.round(this.currentImage.height * scale);
                } else {
                    width = this.currentImage.width;
                    height = this.currentImage.height;
                }
                break;

            default:
                width = this.currentImage.width;
                height = this.currentImage.height;
        }

        return { width, height };
    }

    /**
     * حساب مقياس الملائمة
     * @param {number} fitWidth 
     * @param {number} fitHeight 
     * @param {string} method 
     * @returns {number}
     */
    calculateFitScale(fitWidth, fitHeight, method) {
        const scaleX = fitWidth / this.currentImage.width;
        const scaleY = fitHeight / this.currentImage.height;

        switch (method) {
            case 'contain':
                return Math.min(scaleX, scaleY);
            case 'cover':
                return Math.max(scaleX, scaleY);
            case 'fill':
                return 1; // سيتم التمدد لاحقاً
            default:
                return Math.min(scaleX, scaleY);
        }
    }

    /**
     * تحديث المعاينة
     */
    updatePreview() {
        if (!this.currentImage || !document.getElementById('live-preview-resize')?.checked) return;

        const newDimensions = this.calculateNewDimensions();
        if (!newDimensions) return;

        // تحديث معاينة النتيجة
        this.updateResizePreview(newDimensions);

        // تحديث المعاينة المرئية إذا كانت مفعلة
        if (document.getElementById('live-preview-resize')?.checked) {
            this.updateVisualPreview(newDimensions);
        }
    }

    /**
     * تحديث معاينة النتيجة
     * @param {Object} dimensions 
     */
    updateResizePreview(dimensions) {
        const previewSection = document.getElementById('resize-preview');
        const newDimensionsElement = document.getElementById('new-dimensions');
        const estimatedSizeElement = document.getElementById('estimated-size');
        const scaleRatioElement = document.getElementById('scale-ratio');

        if (previewSection && newDimensionsElement && estimatedSizeElement && scaleRatioElement) {
            const { width, height } = dimensions;
            const scaleRatio = ((width * height) / (this.currentImage.width * this.currentImage.height)).toFixed(2);
            const estimatedSize = this.estimateFileSize(width, height);
            
            newDimensionsElement.textContent = `${width} × ${height}`;
            estimatedSizeElement.textContent = estimatedSize;
            scaleRatioElement.textContent = `${(scaleRatio * 100).toFixed(0)}%`;
            
            previewSection.style.display = 'block';
        }
    }

    /**
     * تحديث المعاينة المرئية
     * @param {Object} dimensions 
     */
    async updateVisualPreview(dimensions) {
        try {
            const resizedCanvas = this.imageUtils.resizeImage(this.currentImage, {
                width: dimensions.width,
                height: dimensions.height,
                maintainAspectRatio: false,
                resizeMethod: document.getElementById('resampling-method')?.value || 'auto'
            });

            const event = new CustomEvent('imagePreviewUpdate', {
                detail: {
                    type: 'comparison',
                    original: this.currentImage,
                    processed: resizedCanvas,
                    info: {
                        originalDimensions: { 
                            width: this.currentImage.width, 
                            height: this.currentImage.height 
                        },
                        newDimensions: dimensions
                    }
                }
            });
            
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error('خطأ في المعاينة:', error);
        }
    }

    /**
     * تقدير حجم الملف
     * @param {number} width 
     * @param {number} height 
     * @returns {string}
     */
    estimateFileSize(width, height) {
        // تقدير تقريبي بناء على عدد البكسلات
        const pixels = width * height;
        const bytesPerPixel = 3; // متوسط للصور المضغوطة
        const estimatedBytes = pixels * bytesPerPixel * 0.3; // عامل ضغط تقريبي
        
        return this.formatFileSize(estimatedBytes);
    }

    /**
     * تغيير حجم الصورة
     */
    async resizeImage() {
        if (!this.currentImage) return;

        try {
            this.isProcessing = true;
            this.uiHelpers.showLoading('جاري تغيير حجم الصورة...');

            const newDimensions = this.calculateNewDimensions();
            if (!newDimensions) {
                throw new Error('لا يمكن حساب الأبعاد الجديدة');
            }

            const result = await this.performResize(newDimensions);
            
            // إرسال النتيجة إلى results panel
            this.sendToResults(result);
            
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('تم تغيير حجم الصورة بنجاح', 'success');
            
        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في تغيير حجم الصورة: ' + error.message, 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * تنفيذ عملية تغيير الحجم
     * @param {Object} dimensions 
     * @returns {Promise<Object>}
     */
    async performResize(dimensions) {
        const { width, height } = dimensions;
        const resamplingMethod = document.getElementById('resampling-method')?.value || 'auto';
        const edgeEnhancement = document.getElementById('edge-enhancement')?.checked || false;
        
        let resizeOptions = {
            width,
            height,
            maintainAspectRatio: false,
            resizeMethod: resamplingMethod
        };

        // تطبيق خوارزمية التغيير المناسبة
        const canvas = this.imageUtils.resizeImage(this.currentImage, resizeOptions);
        
        // تحسين الحواف إذا كان مفعلاً
        if (edgeEnhancement) {
            this.applyEdgeEnhancement(canvas);
        }

        // تحويل إلى Blob
        const blob = await this.imageUtils.canvasToBlob(canvas, {
            format: 'image/png', // استخدام PNG للحفاظ على الجودة
            quality: 1
        });

        return {
            blob,
            canvas,
            originalDimensions: {
                width: this.currentImage.width,
                height: this.currentImage.height
            },
            newDimensions: { width, height },
            size: blob.size,
            method: this.currentMethod,
            resamplingMethod
        };
    }

    /**
     * تطبيق تحسين الحواف
     * @param {HTMLCanvasElement} canvas 
     */
    applyEdgeEnhancement(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // تطبيق فلتر تحسين الحواف البسيط
        const kernel = [-1, -1, -1, -1, 9, -1, -1, -1, -1];
        const output = new Uint8ClampedArray(data);
        
        for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
                for (let c = 0; c < 3; c++) { // RGB only
                    let sum = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const idx = ((y + ky) * canvas.width + (x + kx)) * 4 + c;
                            const kernelIdx = (ky + 1) * 3 + (kx + 1);
                            sum += data[idx] * kernel[kernelIdx];
                        }
                    }
                    const outputIdx = (y * canvas.width + x) * 4 + c;
                    output[outputIdx] = Math.max(0, Math.min(255, sum));
                }
            }
        }
        
        const enhancedImageData = new ImageData(output, canvas.width, canvas.height);
        ctx.putImageData(enhancedImageData, 0, 0);
    }

    /**
     * تغيير ذكي للحجم
     */
    async smartResize() {
        if (!this.currentImage) return;

        try {
            this.uiHelpers.showLoading('جاري التحليل الذكي...');

            // تحليل الصورة واقتراح الحجم الأمثل
            const suggestion = this.analyzeAndSuggest();
            
            if (suggestion) {
                // تطبيق الاقتراح
                this.applySuggestion(suggestion);
                
                // تنفيذ التغيير
                await this.resizeImage();
                
                this.uiHelpers.showNotification(
                    `تم التغيير الذكي: ${suggestion.reason}`, 
                    'success'
                );
            } else {
                this.uiHelpers.showNotification('لا توجد اقتراحات للتحسين', 'info');
            }
            
        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في التحليل الذكي: ' + error.message, 'error');
        }
    }

    /**
     * تحليل الصورة واقتراح التحسين
     * @returns {Object|null}
     */
    analyzeAndSuggest() {
        const { width, height } = this.currentImage;
        const megapixels = (width * height) / 1000000;
        const aspectRatio = width / height;

        // اقتراحات بناء على الحجم والاستخدام المتوقع
        if (megapixels > 10) {
            // صور كبيرة جداً - اقتراح تقليل للويب
            return {
                width: Math.min(width, 1920),
                height: Math.min(height, 1920 / aspectRatio),
                reason: 'تقليل الحجم للاستخدام على الويب'
            };
        } else if (width > 4000 || height > 4000) {
            // صور عالية الدقة - اقتراح تحسين للعرض
            return {
                width: Math.min(width, 2048),
                height: Math.min(height, 2048 / aspectRatio),
                reason: 'تحسين للعرض السريع'
            };
        } else if (width < 500 && height < 500) {
            // صور صغيرة - اقتراح تكبير معقول
            const scale = Math.min(2, 800 / Math.max(width, height));
            return {
                width: Math.round(width * scale),
                height: Math.round(height * scale),
                reason: 'تحسين الحجم للوضوح'
            };
        }

        return null;
    }

    /**
     * تطبيق اقتراح التحسين
     * @param {Object} suggestion 
     */
    applySuggestion(suggestion) {
        // التبديل إلى الطريقة المخصصة
        this.switchMethod('custom');
        
        // تطبيق الأبعاد المقترحة
        const customWidth = document.getElementById('custom-width');
        const customHeight = document.getElementById('custom-height');
        
        if (customWidth && customHeight) {
            customWidth.value = suggestion.width;
            customHeight.value = suggestion.height;
        }
        
        this.updatePreview();
    }

    /**
     * إرسال النتيجة إلى results panel
     * @param {Object} result 
     */
    sendToResults(result) {
        const event = new CustomEvent('imageProcessed', {
            detail: {
                type: 'resize',
                blob: result.blob,
                originalDimensions: result.originalDimensions,
                newDimensions: result.newDimensions,
                size: result.size,
                method: result.method,
                filename: this.generateFilename()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * توليد اسم الملف
     * @returns {string}
     */
    generateFilename() {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        return `resized_image_${timestamp}.png`;
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
        document.getElementById('resize-btn').disabled = false;
        document.getElementById('smart-resize-btn').disabled = false;
        document.getElementById('batch-resize-btn').disabled = false;
    }

    /**
     * إعادة تعيين
     */
    reset() {
        this.currentImage = null;
        this.aspectRatio = 1;
        this.currentMethod = 'custom';
        
        // إخفاء المعلومات
        const imageInfo = document.getElementById('current-image-info');
        const previewSection = document.getElementById('resize-preview');
        
        if (imageInfo) imageInfo.style.display = 'none';
        if (previewSection) previewSection.style.display = 'none';
        
        // إعادة تعيين النماذج
        this.switchMethod('custom');
        
        // تعطيل الأزرار
        document.getElementById('resize-btn').disabled = true;
        document.getElementById('smart-resize-btn').disabled = true;
        document.getElementById('batch-resize-btn').disabled = true;
        
        this.uiHelpers.showNotification('تم إعادة تعيين مغير الحجم', 'info');
    }
}

// تصدير الكلاس
export default ImageResizer;