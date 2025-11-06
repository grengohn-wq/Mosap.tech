/**
 * Image Watermark Tool
 * أداة إضافة العلامة المائية - نص أو صورة مع تحكم كامل في التنسيق والموقع
 */

import ImageUtils from '../utils/imageUtils.js';
import UIHelpers from '../utils/uiHelpers.js';

class ImageWatermark {
    constructor() {
        this.imageUtils = new ImageUtils();
        this.uiHelpers = new UIHelpers();
        this.currentImage = null;
        this.watermarkImage = null;
        this.canvas = null;
        this.ctx = null;
        this.watermarkSettings = {
            type: 'text', // text, image
            text: 'العلامة المائية',
            fontSize: 24,
            fontFamily: 'Arial',
            fontStyle: 'normal', // normal, bold, italic
            color: '#ffffff',
            opacity: 0.7,
            position: 'bottom-right',
            customX: 50,
            customY: 50,
            rotation: 0,
            scale: 1,
            strokeWidth: 0,
            strokeColor: '#000000',
            shadow: false,
            shadowColor: '#000000',
            shadowBlur: 4,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            repeat: false,
            repeatSpacingX: 150,
            repeatSpacingY: 150
        };
        this.presetPositions = {
            'top-left': { x: 20, y: 30 },
            'top-center': { x: 50, y: 30 },
            'top-right': { x: 80, y: 30 },
            'center-left': { x: 20, y: 50 },
            'center': { x: 50, y: 50 },
            'center-right': { x: 80, y: 50 },
            'bottom-left': { x: 20, y: 80 },
            'bottom-center': { x: 50, y: 80 },
            'bottom-right': { x: 80, y: 80 }
        };
    }

    /**
     * تهيئة أداة العلامة المائية
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
    }

    /**
     * إنشاء واجهة أداة العلامة المائية
     */
    createInterface() {
        const controlsSection = document.getElementById('controls-section');
        if (!controlsSection) return;

        controlsSection.innerHTML = `
            <div class="control-panel">
                <div class="control-header">
                    <i class="fas fa-signature"></i>
                    <h3>العلامة المائية</h3>
                </div>
                
                <div class="control-group">
                    <!-- معاينة العلامة المائية -->
                    <div class="watermark-preview-container">
                        <canvas id="watermark-canvas" class="watermark-canvas" style="display: none;"></canvas>
                        <div class="watermark-placeholder" id="watermark-placeholder">
                            <i class="fas fa-image"></i>
                            <p>ارفع صورة لإضافة العلامة المائية</p>
                        </div>
                    </div>

                    <!-- نوع العلامة المائية -->
                    <div class="control-row">
                        <label class="control-label">نوع العلامة المائية</label>
                        <div class="watermark-type-tabs">
                            <button class="watermark-type-tab active" data-type="text">
                                <i class="fas fa-font"></i>
                                نص
                            </button>
                            <button class="watermark-type-tab" data-type="image">
                                <i class="fas fa-image"></i>
                                صورة
                            </button>
                        </div>
                    </div>

                    <!-- إعدادات النص -->
                    <div class="watermark-settings" id="text-settings">
                        <div class="control-row">
                            <label class="control-label">النص</label>
                            <textarea id="watermark-text" class="form-textarea" rows="2" 
                                      placeholder="أدخل نص العلامة المائية">${this.watermarkSettings.text}</textarea>
                        </div>

                        <div class="control-row">
                            <label class="control-label">الخط</label>
                            <div class="font-controls">
                                <select id="font-family" class="form-select">
                                    <option value="Arial">Arial</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Verdana">Verdana</option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Tahoma">Tahoma</option>
                                    <option value="Comic Sans MS">Comic Sans MS</option>
                                    <option value="Impact">Impact</option>
                                    <option value="Courier New">Courier New</option>
                                </select>
                                
                                <div class="font-style-group">
                                    <button class="font-style-btn" data-style="normal" title="عادي">N</button>
                                    <button class="font-style-btn" data-style="bold" title="عريض"><strong>B</strong></button>
                                    <button class="font-style-btn" data-style="italic" title="مائل"><em>I</em></button>
                                </div>
                            </div>
                        </div>

                        <div class="control-row">
                            <label class="control-label">حجم الخط</label>
                            <div class="control-input-group">
                                <input type="range" id="font-size" class="form-range" 
                                       min="8" max="200" step="1" value="24">
                                <input type="number" id="font-size-input" class="form-input" 
                                       min="8" max="200" value="24">
                                <span class="input-unit">px</span>
                            </div>
                        </div>

                        <div class="control-row">
                            <label class="control-label">لون النص</label>
                            <div class="color-controls">
                                <input type="color" id="text-color" class="color-picker" value="#ffffff">
                                <div class="color-presets">
                                    <button class="color-preset" data-color="#ffffff" style="background: #ffffff;" title="أبيض"></button>
                                    <button class="color-preset" data-color="#000000" style="background: #000000;" title="أسود"></button>
                                    <button class="color-preset" data-color="#ff0000" style="background: #ff0000;" title="أحمر"></button>
                                    <button class="color-preset" data-color="#0000ff" style="background: #0000ff;" title="أزرق"></button>
                                    <button class="color-preset" data-color="#008000" style="background: #008000;" title="أخضر"></button>
                                </div>
                            </div>
                        </div>

                        <!-- إعدادات الحدود والظلال -->
                        <details class="text-effects">
                            <summary>تأثيرات النص</summary>
                            
                            <div class="control-row">
                                <label class="control-label">حدود النص</label>
                                <div class="stroke-controls">
                                    <input type="range" id="stroke-width" class="form-range" 
                                           min="0" max="10" step="0.5" value="0">
                                    <input type="color" id="stroke-color" class="color-picker" value="#000000">
                                    <span class="range-value" id="stroke-width-value">0px</span>
                                </div>
                            </div>

                            <div class="control-row">
                                <label class="control-label">ظل النص</label>
                                <div class="shadow-controls">
                                    <input type="checkbox" id="text-shadow">
                                    <div class="shadow-settings" id="shadow-settings" style="display: none;">
                                        <input type="color" id="shadow-color" class="color-picker" value="#000000">
                                        <div class="shadow-params">
                                            <div>
                                                <label>الضبابية:</label>
                                                <input type="range" id="shadow-blur" min="0" max="20" value="4">
                                                <span id="shadow-blur-value">4px</span>
                                            </div>
                                            <div>
                                                <label>الإزاحة X:</label>
                                                <input type="range" id="shadow-offset-x" min="-20" max="20" value="2">
                                                <span id="shadow-offset-x-value">2px</span>
                                            </div>
                                            <div>
                                                <label>الإزاحة Y:</label>
                                                <input type="range" id="shadow-offset-y" min="-20" max="20" value="2">
                                                <span id="shadow-offset-y-value">2px</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </details>
                    </div>

                    <!-- إعدادات الصورة -->
                    <div class="watermark-settings" id="image-settings" style="display: none;">
                        <div class="control-row">
                            <label class="control-label">صورة العلامة المائية</label>
                            <div class="watermark-image-upload">
                                <input type="file" id="watermark-image-input" accept="image/*" style="display: none;">
                                <button class="btn btn-outline" id="select-watermark-image">
                                    <i class="fas fa-upload"></i>
                                    اختيار صورة
                                </button>
                                <div class="watermark-image-preview" id="watermark-image-preview" style="display: none;">
                                    <img id="watermark-image-thumb" alt="معاينة العلامة المائية">
                                    <button class="remove-watermark-image" id="remove-watermark-image" title="إزالة الصورة">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="control-row">
                            <label class="control-label">حجم الصورة</label>
                            <div class="control-input-group">
                                <input type="range" id="watermark-scale" class="form-range" 
                                       min="0.1" max="2" step="0.05" value="1">
                                <span class="range-value" id="watermark-scale-value">100%</span>
                            </div>
                        </div>
                    </div>

                    <!-- إعدادات الموضع والشفافية -->
                    <div class="control-row">
                        <label class="control-label">الشفافية</label>
                        <div class="control-input-group">
                            <input type="range" id="watermark-opacity" class="form-range" 
                                   min="0.1" max="1" step="0.05" value="0.7">
                            <span class="range-value" id="opacity-value">70%</span>
                        </div>
                    </div>

                    <div class="control-row">
                        <label class="control-label">الموضع</label>
                        <div class="position-controls">
                            <div class="position-grid">
                                <button class="position-btn" data-position="top-left" title="أعلى يسار">↖</button>
                                <button class="position-btn" data-position="top-center" title="أعلى وسط">↑</button>
                                <button class="position-btn" data-position="top-right" title="أعلى يمين">↗</button>
                                <button class="position-btn" data-position="center-left" title="وسط يسار">←</button>
                                <button class="position-btn" data-position="center" title="الوسط">⊙</button>
                                <button class="position-btn" data-position="center-right" title="وسط يمين">→</button>
                                <button class="position-btn" data-position="bottom-left" title="أسفل يسار">↙</button>
                                <button class="position-btn" data-position="bottom-center" title="أسفل وسط">↓</button>
                                <button class="position-btn active" data-position="bottom-right" title="أسفل يمين">↘</button>
                            </div>
                            <button class="position-btn custom-position" data-position="custom">مخصص</button>
                        </div>
                    </div>

                    <!-- الموضع المخصص -->
                    <div class="custom-position-controls" id="custom-position-controls" style="display: none;">
                        <div class="control-row">
                            <label class="control-label">الموضع المخصص (نسبة مئوية)</label>
                            <div class="position-inputs">
                                <div class="input-group">
                                    <label>X:</label>
                                    <input type="range" id="custom-x" class="form-range" min="0" max="100" value="50">
                                    <span id="custom-x-value">50%</span>
                                </div>
                                <div class="input-group">
                                    <label>Y:</label>
                                    <input type="range" id="custom-y" class="form-range" min="0" max="100" value="50">
                                    <span id="custom-y-value">50%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="control-row">
                        <label class="control-label">التدوير</label>
                        <div class="control-input-group">
                            <input type="range" id="watermark-rotation" class="form-range" 
                                   min="-180" max="180" step="1" value="0">
                            <input type="number" id="rotation-input" class="form-input" 
                                   min="-180" max="180" value="0">
                            <span class="input-unit">°</span>
                        </div>
                    </div>

                    <!-- التكرار -->
                    <div class="control-row">
                        <label class="control-label">تكرار العلامة المائية</label>
                        <div class="repeat-controls">
                            <input type="checkbox" id="watermark-repeat">
                            <div class="repeat-settings" id="repeat-settings" style="display: none;">
                                <div class="spacing-controls">
                                    <div class="input-group">
                                        <label>المسافة الأفقية:</label>
                                        <input type="range" id="repeat-spacing-x" min="50" max="500" value="150">
                                        <span id="spacing-x-value">150px</span>
                                    </div>
                                    <div class="input-group">
                                        <label>المسافة العمودية:</label>
                                        <input type="range" id="repeat-spacing-y" min="50" max="500" value="150">
                                        <span id="spacing-y-value">150px</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- أزرار التحكم -->
                    <div class="control-actions">
                        <button id="apply-watermark-btn" class="btn btn-primary" disabled>
                            <i class="fas fa-signature"></i>
                            تطبيق العلامة المائية
                        </button>
                        
                        <button id="preview-watermark-btn" class="btn btn-secondary" disabled>
                            <i class="fas fa-eye"></i>
                            معاينة
                        </button>
                        
                        <button id="reset-watermark-btn" class="btn btn-outline" disabled>
                            <i class="fas fa-refresh"></i>
                            إعادة تعيين
                        </button>
                    </div>

                    <!-- معلومات العلامة المائية -->
                    <div class="watermark-info" id="watermark-info" style="display: none;">
                        <div class="info-grid">
                            <div class="info-item">
                                <label>النوع:</label>
                                <span id="watermark-type-info">نص</span>
                            </div>
                            <div class="info-item">
                                <label>الموضع:</label>
                                <span id="watermark-position-info">أسفل يمين</span>
                            </div>
                            <div class="info-item">
                                <label>الشفافية:</label>
                                <span id="watermark-opacity-info">70%</span>
                            </div>
                            <div class="info-item">
                                <label>التدوير:</label>
                                <span id="watermark-rotation-info">0°</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupCanvas();
    }

    /**
     * إعداد اللوحة
     */
    setupCanvas() {
        this.canvas = document.getElementById('watermark-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        
        // إعداد خصائص السياق للحصول على أفضل جودة
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // تبديل نوع العلامة المائية
        document.querySelectorAll('.watermark-type-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchWatermarkType(e.target.dataset.type);
            });
        });

        // إعدادات النص
        document.getElementById('watermark-text')?.addEventListener('input', (e) => {
            this.watermarkSettings.text = e.target.value;
            this.updatePreview();
        });

        document.getElementById('font-family')?.addEventListener('change', (e) => {
            this.watermarkSettings.fontFamily = e.target.value;
            this.updatePreview();
        });

        document.querySelectorAll('.font-style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.font-style-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.watermarkSettings.fontStyle = e.target.dataset.style;
                this.updatePreview();
            });
        });

        // حجم الخط
        const fontSizeSlider = document.getElementById('font-size');
        const fontSizeInput = document.getElementById('font-size-input');
        
        fontSizeSlider?.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            fontSizeInput.value = size;
            this.watermarkSettings.fontSize = size;
            this.updatePreview();
        });

        fontSizeInput?.addEventListener('input', (e) => {
            const size = parseInt(e.target.value) || 24;
            fontSizeSlider.value = size;
            this.watermarkSettings.fontSize = size;
            this.updatePreview();
        });

        // لون النص
        document.getElementById('text-color')?.addEventListener('change', (e) => {
            this.watermarkSettings.color = e.target.value;
            this.updatePreview();
        });

        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                document.getElementById('text-color').value = color;
                this.watermarkSettings.color = color;
                this.updatePreview();
            });
        });

        // الحدود والظلال
        this.setupTextEffectsListeners();

        // رفع صورة العلامة المائية
        this.setupImageWatermarkListeners();

        // الشفافية
        document.getElementById('watermark-opacity')?.addEventListener('input', (e) => {
            const opacity = parseFloat(e.target.value);
            this.watermarkSettings.opacity = opacity;
            document.getElementById('opacity-value').textContent = Math.round(opacity * 100) + '%';
            this.updatePreview();
        });

        // الموضع
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const position = e.target.dataset.position;
                this.watermarkSettings.position = position;
                
                if (position === 'custom') {
                    document.getElementById('custom-position-controls').style.display = 'block';
                } else {
                    document.getElementById('custom-position-controls').style.display = 'none';
                }
                
                this.updatePreview();
            });
        });

        // الموضع المخصص
        this.setupCustomPositionListeners();

        // التدوير
        this.setupRotationListeners();

        // التكرار
        this.setupRepeatListeners();

        // أزرار التحكم
        document.getElementById('apply-watermark-btn')?.addEventListener('click', () => {
            this.applyWatermark();
        });

        document.getElementById('preview-watermark-btn')?.addEventListener('click', () => {
            this.updatePreview();
        });

        document.getElementById('reset-watermark-btn')?.addEventListener('click', () => {
            this.reset();
        });
    }

    /**
     * إعداد مستمعي تأثيرات النص
     */
    setupTextEffectsListeners() {
        // الحدود
        const strokeWidth = document.getElementById('stroke-width');
        const strokeWidthValue = document.getElementById('stroke-width-value');
        
        strokeWidth?.addEventListener('input', (e) => {
            const width = parseFloat(e.target.value);
            this.watermarkSettings.strokeWidth = width;
            strokeWidthValue.textContent = width + 'px';
            this.updatePreview();
        });

        document.getElementById('stroke-color')?.addEventListener('change', (e) => {
            this.watermarkSettings.strokeColor = e.target.value;
            this.updatePreview();
        });

        // الظل
        document.getElementById('text-shadow')?.addEventListener('change', (e) => {
            this.watermarkSettings.shadow = e.target.checked;
            const shadowSettings = document.getElementById('shadow-settings');
            shadowSettings.style.display = e.target.checked ? 'block' : 'none';
            this.updatePreview();
        });

        document.getElementById('shadow-color')?.addEventListener('change', (e) => {
            this.watermarkSettings.shadowColor = e.target.value;
            this.updatePreview();
        });

        // إعدادات الظل
        const shadowParams = ['shadow-blur', 'shadow-offset-x', 'shadow-offset-y'];
        shadowParams.forEach(param => {
            const input = document.getElementById(param);
            const valueSpan = document.getElementById(param + '-value');
            
            input?.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                valueSpan.textContent = value + 'px';
                
                switch (param) {
                    case 'shadow-blur':
                        this.watermarkSettings.shadowBlur = value;
                        break;
                    case 'shadow-offset-x':
                        this.watermarkSettings.shadowOffsetX = value;
                        break;
                    case 'shadow-offset-y':
                        this.watermarkSettings.shadowOffsetY = value;
                        break;
                }
                
                this.updatePreview();
            });
        });
    }

    /**
     * إعداد مستمعي صورة العلامة المائية
     */
    setupImageWatermarkListeners() {
        const selectBtn = document.getElementById('select-watermark-image');
        const fileInput = document.getElementById('watermark-image-input');
        const removeBtn = document.getElementById('remove-watermark-image');

        selectBtn?.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    this.watermarkImage = await this.imageUtils.loadImage(file);
                    this.showWatermarkImagePreview(this.watermarkImage);
                    this.updatePreview();
                } catch (error) {
                    this.uiHelpers.showNotification('فشل في تحميل صورة العلامة المائية: ' + error.message, 'error');
                }
            }
        });

        removeBtn?.addEventListener('click', () => {
            this.watermarkImage = null;
            document.getElementById('watermark-image-preview').style.display = 'none';
            this.updatePreview();
        });

        // حجم الصورة
        document.getElementById('watermark-scale')?.addEventListener('input', (e) => {
            const scale = parseFloat(e.target.value);
            this.watermarkSettings.scale = scale;
            document.getElementById('watermark-scale-value').textContent = Math.round(scale * 100) + '%';
            this.updatePreview();
        });
    }

    /**
     * إعداد مستمعي الموضع المخصص
     */
    setupCustomPositionListeners() {
        const customX = document.getElementById('custom-x');
        const customY = document.getElementById('custom-y');

        customX?.addEventListener('input', (e) => {
            const x = parseInt(e.target.value);
            this.watermarkSettings.customX = x;
            document.getElementById('custom-x-value').textContent = x + '%';
            this.updatePreview();
        });

        customY?.addEventListener('input', (e) => {
            const y = parseInt(e.target.value);
            this.watermarkSettings.customY = y;
            document.getElementById('custom-y-value').textContent = y + '%';
            this.updatePreview();
        });
    }

    /**
     * إعداد مستمعي التدوير
     */
    setupRotationListeners() {
        const rotationSlider = document.getElementById('watermark-rotation');
        const rotationInput = document.getElementById('rotation-input');

        rotationSlider?.addEventListener('input', (e) => {
            const rotation = parseInt(e.target.value);
            rotationInput.value = rotation;
            this.watermarkSettings.rotation = rotation;
            this.updatePreview();
        });

        rotationInput?.addEventListener('input', (e) => {
            const rotation = parseInt(e.target.value) || 0;
            rotationSlider.value = rotation;
            this.watermarkSettings.rotation = rotation;
            this.updatePreview();
        });
    }

    /**
     * إعداد مستمعي التكرار
     */
    setupRepeatListeners() {
        document.getElementById('watermark-repeat')?.addEventListener('change', (e) => {
            this.watermarkSettings.repeat = e.target.checked;
            const repeatSettings = document.getElementById('repeat-settings');
            repeatSettings.style.display = e.target.checked ? 'block' : 'none';
            this.updatePreview();
        });

        // المسافات
        const spacingX = document.getElementById('repeat-spacing-x');
        const spacingY = document.getElementById('repeat-spacing-y');

        spacingX?.addEventListener('input', (e) => {
            const spacing = parseInt(e.target.value);
            this.watermarkSettings.repeatSpacingX = spacing;
            document.getElementById('spacing-x-value').textContent = spacing + 'px';
            this.updatePreview();
        });

        spacingY?.addEventListener('input', (e) => {
            const spacing = parseInt(e.target.value);
            this.watermarkSettings.repeatSpacingY = spacing;
            document.getElementById('spacing-y-value').textContent = spacing + 'px';
            this.updatePreview();
        });
    }

    /**
     * تبديل نوع العلامة المائية
     * @param {string} type 
     */
    switchWatermarkType(type) {
        // تحديث الأزرار
        document.querySelectorAll('.watermark-type-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });

        // إظهار/إخفاء الإعدادات
        document.getElementById('text-settings').style.display = type === 'text' ? 'block' : 'none';
        document.getElementById('image-settings').style.display = type === 'image' ? 'block' : 'none';

        this.watermarkSettings.type = type;
        this.updatePreview();
    }

    /**
     * تحميل صورة أساسية
     * @param {File|HTMLImageElement} image 
     */
    async loadImage(image) {
        try {
            this.uiHelpers.showLoading('جاري تحميل الصورة...');
            
            if (image instanceof File) {
                this.currentImage = await this.imageUtils.loadImage(image);
            } else {
                this.currentImage = image;
            }

            this.setupCanvasForImage();
            this.updateImageInfo();
            this.enableControls();
            this.drawImage();
            
            // إخفاء placeholder وإظهار canvas
            document.getElementById('watermark-placeholder').style.display = 'none';
            this.canvas.style.display = 'block';
            
            this.uiHelpers.hideLoading();
            
        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في تحميل الصورة: ' + error.message, 'error');
        }
    }

    /**
     * إعداد اللوحة للصورة
     */
    setupCanvasForImage() {
        const container = this.canvas.parentElement;
        const maxWidth = container.clientWidth - 40;
        const maxHeight = 500;

        // حساب المقياس
        const scaleX = maxWidth / this.currentImage.width;
        const scaleY = maxHeight / this.currentImage.height;
        const scale = Math.min(scaleX, scaleY, 1);

        // تعيين أبعاد اللوحة
        this.canvas.width = this.currentImage.width * scale;
        this.canvas.height = this.currentImage.height * scale;
        
        // تحديث خصائص السياق
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    /**
     * رسم الصورة مع العلامة المائية
     */
    drawImage() {
        if (!this.currentImage || !this.ctx) return;

        // مسح اللوحة
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // رسم الصورة الأساسية
        this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);

        // رسم العلامة المائية
        this.drawWatermark();
    }

    /**
     * رسم العلامة المائية
     */
    drawWatermark() {
        if (this.watermarkSettings.repeat) {
            this.drawRepeatedWatermark();
        } else {
            this.drawSingleWatermark();
        }
    }

    /**
     * رسم علامة مائية واحدة
     */
    drawSingleWatermark() {
        const position = this.getWatermarkPosition();
        
        this.ctx.save();
        
        // تطبيق الشفافية
        this.ctx.globalAlpha = this.watermarkSettings.opacity;
        
        // الانتقال إلى نقطة الرسم
        this.ctx.translate(position.x, position.y);
        
        // تطبيق التدوير
        if (this.watermarkSettings.rotation !== 0) {
            this.ctx.rotate(this.watermarkSettings.rotation * Math.PI / 180);
        }
        
        if (this.watermarkSettings.type === 'text') {
            this.drawTextWatermark(0, 0);
        } else if (this.watermarkSettings.type === 'image' && this.watermarkImage) {
            this.drawImageWatermark(0, 0);
        }
        
        this.ctx.restore();
    }

    /**
     * رسم علامات مائية متكررة
     */
    drawRepeatedWatermark() {
        const spacingX = this.watermarkSettings.repeatSpacingX * (this.canvas.width / this.currentImage.width);
        const spacingY = this.watermarkSettings.repeatSpacingY * (this.canvas.height / this.currentImage.height);
        
        this.ctx.save();
        this.ctx.globalAlpha = this.watermarkSettings.opacity;
        
        for (let x = 0; x < this.canvas.width + spacingX; x += spacingX) {
            for (let y = 0; y < this.canvas.height + spacingY; y += spacingY) {
                this.ctx.save();
                
                this.ctx.translate(x, y);
                
                if (this.watermarkSettings.rotation !== 0) {
                    this.ctx.rotate(this.watermarkSettings.rotation * Math.PI / 180);
                }
                
                if (this.watermarkSettings.type === 'text') {
                    this.drawTextWatermark(0, 0);
                } else if (this.watermarkSettings.type === 'image' && this.watermarkImage) {
                    this.drawImageWatermark(0, 0);
                }
                
                this.ctx.restore();
            }
        }
        
        this.ctx.restore();
    }

    /**
     * رسم نص العلامة المائية
     * @param {number} x 
     * @param {number} y 
     */
    drawTextWatermark(x, y) {
        const scale = this.canvas.width / this.currentImage.width;
        const fontSize = this.watermarkSettings.fontSize * scale;
        
        // إعداد الخط
        let fontStyle = '';
        if (this.watermarkSettings.fontStyle === 'bold') {
            fontStyle = 'bold ';
        } else if (this.watermarkSettings.fontStyle === 'italic') {
            fontStyle = 'italic ';
        }
        
        this.ctx.font = `${fontStyle}${fontSize}px ${this.watermarkSettings.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // رسم الظل إذا كان مطلوباً
        if (this.watermarkSettings.shadow) {
            this.ctx.save();
            this.ctx.shadowColor = this.watermarkSettings.shadowColor;
            this.ctx.shadowBlur = this.watermarkSettings.shadowBlur * scale;
            this.ctx.shadowOffsetX = this.watermarkSettings.shadowOffsetX * scale;
            this.ctx.shadowOffsetY = this.watermarkSettings.shadowOffsetY * scale;
            
            this.ctx.fillStyle = this.watermarkSettings.color;
            this.ctx.fillText(this.watermarkSettings.text, x, y);
            
            this.ctx.restore();
        }
        
        // رسم الحدود إذا كانت مطلوبة
        if (this.watermarkSettings.strokeWidth > 0) {
            this.ctx.strokeStyle = this.watermarkSettings.strokeColor;
            this.ctx.lineWidth = this.watermarkSettings.strokeWidth * scale;
            this.ctx.strokeText(this.watermarkSettings.text, x, y);
        }
        
        // رسم النص
        this.ctx.fillStyle = this.watermarkSettings.color;
        this.ctx.fillText(this.watermarkSettings.text, x, y);
    }

    /**
     * رسم صورة العلامة المائية
     * @param {number} x 
     * @param {number} y 
     */
    drawImageWatermark(x, y) {
        const scale = (this.canvas.width / this.currentImage.width) * this.watermarkSettings.scale;
        
        const width = this.watermarkImage.width * scale;
        const height = this.watermarkImage.height * scale;
        
        this.ctx.drawImage(
            this.watermarkImage,
            x - width / 2,
            y - height / 2,
            width,
            height
        );
    }

    /**
     * الحصول على موضع العلامة المائية
     * @returns {Object}
     */
    getWatermarkPosition() {
        if (this.watermarkSettings.position === 'custom') {
            return {
                x: (this.watermarkSettings.customX / 100) * this.canvas.width,
                y: (this.watermarkSettings.customY / 100) * this.canvas.height
            };
        }
        
        const position = this.presetPositions[this.watermarkSettings.position];
        return {
            x: (position.x / 100) * this.canvas.width,
            y: (position.y / 100) * this.canvas.height
        };
    }

    /**
     * إظهار معاينة صورة العلامة المائية
     * @param {HTMLImageElement} image 
     */
    showWatermarkImagePreview(image) {
        const preview = document.getElementById('watermark-image-preview');
        const thumb = document.getElementById('watermark-image-thumb');
        
        thumb.src = image.src;
        preview.style.display = 'block';
    }

    /**
     * تحديث المعاينة
     */
    updatePreview() {
        if (!this.currentImage) return;
        
        this.drawImage();
        this.updateImageInfo();
        
        // إرسال المعاينة المباشرة
        this.updateLivePreview();
    }

    /**
     * تحديث المعاينة المباشرة
     */
    updateLivePreview() {
        if (!this.currentImage) return;

        try {
            const watermarkedCanvas = this.getWatermarkedCanvas();
            
            const event = new CustomEvent('imagePreviewUpdate', {
                detail: {
                    type: 'comparison',
                    original: this.currentImage,
                    processed: watermarkedCanvas,
                    info: {
                        watermark: this.watermarkSettings
                    }
                }
            });
            
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error('خطأ في المعاينة المباشرة:', error);
        }
    }

    /**
     * الحصول على اللوحة مع العلامة المائية
     * @returns {HTMLCanvasElement}
     */
    getWatermarkedCanvas() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.currentImage.width;
        canvas.height = this.currentImage.height;
        
        // رسم الصورة الأساسية
        ctx.drawImage(this.currentImage, 0, 0);
        
        // رسم العلامة المائية بالحجم الأصلي
        this.drawWatermarkOnCanvas(ctx, canvas.width, canvas.height);
        
        return canvas;
    }

    /**
     * رسم العلامة المائية على لوحة محددة
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} width 
     * @param {number} height 
     */
    drawWatermarkOnCanvas(ctx, width, height) {
        if (this.watermarkSettings.repeat) {
            this.drawRepeatedWatermarkOnCanvas(ctx, width, height);
        } else {
            this.drawSingleWatermarkOnCanvas(ctx, width, height);
        }
    }

    /**
     * رسم علامة مائية واحدة على لوحة محددة
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} width 
     * @param {number} height 
     */
    drawSingleWatermarkOnCanvas(ctx, width, height) {
        const position = this.getWatermarkPositionForCanvas(width, height);
        
        ctx.save();
        ctx.globalAlpha = this.watermarkSettings.opacity;
        
        ctx.translate(position.x, position.y);
        
        if (this.watermarkSettings.rotation !== 0) {
            ctx.rotate(this.watermarkSettings.rotation * Math.PI / 180);
        }
        
        if (this.watermarkSettings.type === 'text') {
            this.drawTextWatermarkOnCanvas(ctx, 0, 0);
        } else if (this.watermarkSettings.type === 'image' && this.watermarkImage) {
            this.drawImageWatermarkOnCanvas(ctx, 0, 0);
        }
        
        ctx.restore();
    }

    /**
     * رسم علامات مائية متكررة على لوحة محددة
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} width 
     * @param {number} height 
     */
    drawRepeatedWatermarkOnCanvas(ctx, width, height) {
        const spacingX = this.watermarkSettings.repeatSpacingX;
        const spacingY = this.watermarkSettings.repeatSpacingY;
        
        ctx.save();
        ctx.globalAlpha = this.watermarkSettings.opacity;
        
        for (let x = 0; x < width + spacingX; x += spacingX) {
            for (let y = 0; y < height + spacingY; y += spacingY) {
                ctx.save();
                
                ctx.translate(x, y);
                
                if (this.watermarkSettings.rotation !== 0) {
                    ctx.rotate(this.watermarkSettings.rotation * Math.PI / 180);
                }
                
                if (this.watermarkSettings.type === 'text') {
                    this.drawTextWatermarkOnCanvas(ctx, 0, 0);
                } else if (this.watermarkSettings.type === 'image' && this.watermarkImage) {
                    this.drawImageWatermarkOnCanvas(ctx, 0, 0);
                }
                
                ctx.restore();
            }
        }
        
        ctx.restore();
    }

    /**
     * رسم نص العلامة المائية على لوحة محددة
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x 
     * @param {number} y 
     */
    drawTextWatermarkOnCanvas(ctx, x, y) {
        const fontSize = this.watermarkSettings.fontSize;
        
        // إعداد الخط
        let fontStyle = '';
        if (this.watermarkSettings.fontStyle === 'bold') {
            fontStyle = 'bold ';
        } else if (this.watermarkSettings.fontStyle === 'italic') {
            fontStyle = 'italic ';
        }
        
        ctx.font = `${fontStyle}${fontSize}px ${this.watermarkSettings.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // رسم الظل
        if (this.watermarkSettings.shadow) {
            ctx.save();
            ctx.shadowColor = this.watermarkSettings.shadowColor;
            ctx.shadowBlur = this.watermarkSettings.shadowBlur;
            ctx.shadowOffsetX = this.watermarkSettings.shadowOffsetX;
            ctx.shadowOffsetY = this.watermarkSettings.shadowOffsetY;
            
            ctx.fillStyle = this.watermarkSettings.color;
            ctx.fillText(this.watermarkSettings.text, x, y);
            
            ctx.restore();
        }
        
        // رسم الحدود
        if (this.watermarkSettings.strokeWidth > 0) {
            ctx.strokeStyle = this.watermarkSettings.strokeColor;
            ctx.lineWidth = this.watermarkSettings.strokeWidth;
            ctx.strokeText(this.watermarkSettings.text, x, y);
        }
        
        // رسم النص
        ctx.fillStyle = this.watermarkSettings.color;
        ctx.fillText(this.watermarkSettings.text, x, y);
    }

    /**
     * رسم صورة العلامة المائية على لوحة محددة
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x 
     * @param {number} y 
     */
    drawImageWatermarkOnCanvas(ctx, x, y) {
        const width = this.watermarkImage.width * this.watermarkSettings.scale;
        const height = this.watermarkImage.height * this.watermarkSettings.scale;
        
        ctx.drawImage(
            this.watermarkImage,
            x - width / 2,
            y - height / 2,
            width,
            height
        );
    }

    /**
     * الحصول على موضع العلامة المائية للوحة محددة
     * @param {number} width 
     * @param {number} height 
     * @returns {Object}
     */
    getWatermarkPositionForCanvas(width, height) {
        if (this.watermarkSettings.position === 'custom') {
            return {
                x: (this.watermarkSettings.customX / 100) * width,
                y: (this.watermarkSettings.customY / 100) * height
            };
        }
        
        const position = this.presetPositions[this.watermarkSettings.position];
        return {
            x: (position.x / 100) * width,
            y: (position.y / 100) * height
        };
    }

    /**
     * تطبيق العلامة المائية
     */
    async applyWatermark() {
        if (!this.currentImage) return;

        // التحقق من وجود محتوى للعلامة المائية
        if (this.watermarkSettings.type === 'text' && !this.watermarkSettings.text.trim()) {
            this.uiHelpers.showNotification('يرجى إدخال نص للعلامة المائية', 'warning');
            return;
        }

        if (this.watermarkSettings.type === 'image' && !this.watermarkImage) {
            this.uiHelpers.showNotification('يرجى اختيار صورة للعلامة المائية', 'warning');
            return;
        }

        try {
            this.uiHelpers.showLoading('جاري تطبيق العلامة المائية...');

            const watermarkedCanvas = this.getWatermarkedCanvas();
            const blob = await this.imageUtils.canvasToBlob(watermarkedCanvas, {
                format: 'image/png',
                quality: 1
            });

            // إرسال النتيجة
            this.sendToResults({
                blob,
                canvas: watermarkedCanvas,
                watermark: { ...this.watermarkSettings },
                originalDimensions: {
                    width: this.currentImage.width,
                    height: this.currentImage.height
                }
            });

            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('تم تطبيق العلامة المائية بنجاح', 'success');

        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في تطبيق العلامة المائية: ' + error.message, 'error');
        }
    }

    /**
     * تحديث معلومات الصورة
     */
    updateImageInfo() {
        if (!this.currentImage) return;

        const positionNames = {
            'top-left': 'أعلى يسار',
            'top-center': 'أعلى وسط',
            'top-right': 'أعلى يمين',
            'center-left': 'وسط يسار',
            'center': 'الوسط',
            'center-right': 'وسط يمين',
            'bottom-left': 'أسفل يسار',
            'bottom-center': 'أسفل وسط',
            'bottom-right': 'أسفل يمين',
            'custom': `مخصص (${this.watermarkSettings.customX}%, ${this.watermarkSettings.customY}%)`
        };

        document.getElementById('watermark-type-info').textContent = 
            this.watermarkSettings.type === 'text' ? 'نص' : 'صورة';
        document.getElementById('watermark-position-info').textContent = 
            positionNames[this.watermarkSettings.position] || 'غير محدد';
        document.getElementById('watermark-opacity-info').textContent = 
            Math.round(this.watermarkSettings.opacity * 100) + '%';
        document.getElementById('watermark-rotation-info').textContent = 
            this.watermarkSettings.rotation + '°';

        document.getElementById('watermark-info').style.display = 'block';
    }

    /**
     * إرسال النتيجة
     * @param {Object} result 
     */
    sendToResults(result) {
        const event = new CustomEvent('imageProcessed', {
            detail: {
                type: 'watermark',
                blob: result.blob,
                watermark: result.watermark,
                originalDimensions: result.originalDimensions,
                newDimensions: {
                    width: result.canvas.width,
                    height: result.canvas.height
                },
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
        const type = this.watermarkSettings.type;
        return `watermarked_${type}_${timestamp}.png`;
    }

    /**
     * تفعيل أزرار التحكم
     */
    enableControls() {
        document.getElementById('apply-watermark-btn').disabled = false;
        document.getElementById('preview-watermark-btn').disabled = false;
        document.getElementById('reset-watermark-btn').disabled = false;
    }

    /**
     * إعادة تعيين
     */
    reset() {
        // إعادة تعيين الإعدادات
        this.watermarkSettings = {
            type: 'text',
            text: 'العلامة المائية',
            fontSize: 24,
            fontFamily: 'Arial',
            fontStyle: 'normal',
            color: '#ffffff',
            opacity: 0.7,
            position: 'bottom-right',
            customX: 50,
            customY: 50,
            rotation: 0,
            scale: 1,
            strokeWidth: 0,
            strokeColor: '#000000',
            shadow: false,
            shadowColor: '#000000',
            shadowBlur: 4,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            repeat: false,
            repeatSpacingX: 150,
            repeatSpacingY: 150
        };

        // إعادة تعيين الواجهة
        this.switchWatermarkType('text');
        document.getElementById('watermark-text').value = this.watermarkSettings.text;
        document.getElementById('font-family').value = this.watermarkSettings.fontFamily;
        document.getElementById('font-size').value = this.watermarkSettings.fontSize;
        document.getElementById('font-size-input').value = this.watermarkSettings.fontSize;
        document.getElementById('text-color').value = this.watermarkSettings.color;
        document.getElementById('watermark-opacity').value = this.watermarkSettings.opacity;
        document.getElementById('opacity-value').textContent = '70%';
        
        // إعادة تعيين الموضع
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.position === 'bottom-right');
        });
        
        // إعادة رسم الصورة
        if (this.currentImage) {
            this.drawImage();
            this.updateImageInfo();
        }

        this.uiHelpers.showNotification('تم إعادة تعيين إعدادات العلامة المائية', 'info');
    }

    /**
     * إعادة تعيين كاملة
     */
    fullReset() {
        this.currentImage = null;
        this.watermarkImage = null;
        
        // إخفاء canvas وإظهار placeholder
        this.canvas.style.display = 'none';
        document.getElementById('watermark-placeholder').style.display = 'flex';
        document.getElementById('watermark-info').style.display = 'none';
        document.getElementById('watermark-image-preview').style.display = 'none';

        // تعطيل الأزرار
        document.getElementById('apply-watermark-btn').disabled = true;
        document.getElementById('preview-watermark-btn').disabled = true;
        document.getElementById('reset-watermark-btn').disabled = true;

        this.reset();
        this.uiHelpers.showNotification('تم إعادة تعيين أداة العلامة المائية', 'info');
    }
}

// تصدير الكلاس
export default ImageWatermark;