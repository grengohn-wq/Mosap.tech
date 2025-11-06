/**
 * Image Rotator Tool
 * أداة تدوير الصور - تدوير بزوايا مختلفة مع إعدادات متقدمة
 */

import ImageUtils from '../utils/imageUtils.js';
import UIHelpers from '../utils/uiHelpers.js';

class ImageRotator {
    constructor() {
        this.imageUtils = new ImageUtils();
        this.uiHelpers = new UIHelpers();
        this.currentImage = null;
        this.currentRotation = 0;
        this.canvas = null;
        this.ctx = null;
        this.presetAngles = [90, 180, 270, 45, -45, 30, -30, 15, -15];
        this.history = [];
        this.historyIndex = -1;
    }

    /**
     * تهيئة أداة التدوير
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
    }

    /**
     * إنشاء واجهة أداة التدوير
     */
    createInterface() {
        const controlsSection = document.getElementById('controls-section');
        if (!controlsSection) return;

        controlsSection.innerHTML = `
            <div class="control-panel">
                <div class="control-header">
                    <i class="fas fa-undo"></i>
                    <h3>تدوير الصور</h3>
                </div>
                
                <div class="control-group">
                    <!-- معاينة التدوير -->
                    <div class="rotation-preview-container">
                        <canvas id="rotation-canvas" class="rotation-canvas" style="display: none;"></canvas>
                        <div class="rotation-placeholder" id="rotation-placeholder">
                            <i class="fas fa-image"></i>
                            <p>ارفع صورة لبدء التدوير</p>
                        </div>
                        
                        <!-- مؤشر التدوير -->
                        <div class="rotation-indicator" id="rotation-indicator" style="display: none;">
                            <div class="rotation-dial">
                                <div class="dial-line" id="dial-line"></div>
                                <div class="dial-center"></div>
                            </div>
                            <span class="rotation-angle" id="rotation-angle-display">0°</span>
                        </div>
                    </div>

                    <!-- تدوير سريع -->
                    <div class="control-row">
                        <label class="control-label">تدوير سريع</label>
                        <div class="quick-rotation-grid">
                            <button class="rotation-btn" data-angle="90" title="تدوير 90° يميناً">
                                <i class="fas fa-undo"></i>
                                90°
                            </button>
                            <button class="rotation-btn" data-angle="180" title="تدوير 180°">
                                <i class="fas fa-exchange-alt"></i>
                                180°
                            </button>
                            <button class="rotation-btn" data-angle="270" title="تدوير 90° يساراً">
                                <i class="fas fa-redo"></i>
                                270°
                            </button>
                            <button class="rotation-btn" data-angle="-90" title="تدوير 90° عكس اتجاه الساعة">
                                <i class="fas fa-redo fa-flip-horizontal"></i>
                                -90°
                            </button>
                        </div>
                    </div>

                    <!-- تدوير مخصص -->
                    <div class="control-row">
                        <label class="control-label">زاوية مخصصة</label>
                        <div class="custom-rotation-controls">
                            <div class="rotation-input-group">
                                <input type="range" id="rotation-slider" class="rotation-slider" 
                                       min="-180" max="180" step="1" value="0">
                                <input type="number" id="rotation-input" class="rotation-number-input" 
                                       min="-180" max="180" step="0.1" value="0">
                                <span class="input-unit">درجة</span>
                            </div>
                            
                            <div class="rotation-fine-controls">
                                <button class="fine-control-btn" data-increment="-1">
                                    <i class="fas fa-minus"></i>
                                    1°-
                                </button>
                                <button class="fine-control-btn" data-increment="-0.1">
                                    <i class="fas fa-angle-left"></i>
                                    0.1°-
                                </button>
                                <button class="fine-control-btn" data-increment="0.1">
                                    0.1°+
                                    <i class="fas fa-angle-right"></i>
                                </button>
                                <button class="fine-control-btn" data-increment="1">
                                    1°+
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- زوايا محددة مسبقاً -->
                    <div class="control-row">
                        <label class="control-label">زوايا شائعة</label>
                        <div class="preset-angles">
                            <button class="preset-angle-btn" data-angle="45">45°</button>
                            <button class="preset-angle-btn" data-angle="30">30°</button>
                            <button class="preset-angle-btn" data-angle="15">15°</button>
                            <button class="preset-angle-btn" data-angle="-15">-15°</button>
                            <button class="preset-angle-btn" data-angle="-30">-30°</button>
                            <button class="preset-angle-btn" data-angle="-45">-45°</button>
                        </div>
                    </div>

                    <!-- إعدادات التدوير -->
                    <details class="advanced-settings">
                        <summary>إعدادات متقدمة</summary>
                        
                        <div class="control-row">
                            <label class="control-label">نقطة الدوران</label>
                            <select id="rotation-center" class="form-select">
                                <option value="center" selected>الوسط</option>
                                <option value="top-left">أعلى يسار</option>
                                <option value="top-right">أعلى يمين</option>
                                <option value="bottom-left">أسفل يسار</option>
                                <option value="bottom-right">أسفل يمين</option>
                                <option value="custom">مخصص</option>
                            </select>
                        </div>

                        <div class="control-row" id="custom-center-row" style="display: none;">
                            <label class="control-label">نقطة مخصصة (نسبة مئوية)</label>
                            <div class="custom-center-inputs">
                                <div class="input-group">
                                    <label>X:</label>
                                    <input type="range" id="center-x" min="0" max="100" value="50">
                                    <span id="center-x-value">50%</span>
                                </div>
                                <div class="input-group">
                                    <label>Y:</label>
                                    <input type="range" id="center-y" min="0" max="100" value="50">
                                    <span id="center-y-value">50%</span>
                                </div>
                            </div>
                        </div>

                        <div class="control-row">
                            <label class="control-label">لون الخلفية</label>
                            <div class="background-color-options">
                                <input type="color" id="bg-color-picker" class="color-picker" value="#ffffff">
                                <button class="bg-preset-btn active" data-bg="white">أبيض</button>
                                <button class="bg-preset-btn" data-bg="black">أسود</button>
                                <button class="bg-preset-btn" data-bg="transparent">شفاف</button>
                            </div>
                        </div>

                        <div class="control-row">
                            <label class="control-label">خوارزمية التدوير</label>
                            <select id="rotation-algorithm" class="form-select">
                                <option value="bilinear" selected>ثنائي الخطية (سريع)</option>
                                <option value="bicubic">ثلاثي المكعب (عالي الجودة)</option>
                                <option value="lanczos">Lanczos (أعلى جودة)</option>
                            </select>
                        </div>

                        <div class="control-row">
                            <label class="control-label">تلقائي التوسيط</label>
                            <input type="checkbox" id="auto-center" checked>
                            <small>توسيط الصورة تلقائياً بعد التدوير</small>
                        </div>

                        <div class="control-row">
                            <label class="control-label">قفل النسب</label>
                            <input type="checkbox" id="lock-aspect-ratio">
                            <small>المحافظة على نسبة العرض للارتفاع</small>
                        </div>

                        <div class="control-row">
                            <label class="control-label">معاينة مباشرة</label>
                            <input type="checkbox" id="live-rotation-preview" checked>
                        </div>
                    </details>

                    <!-- أزرار التحكم -->
                    <div class="control-actions">
                        <button id="apply-rotation-btn" class="btn btn-primary" disabled>
                            <i class="fas fa-undo"></i>
                            تطبيق التدوير
                        </button>
                        
                        <button id="undo-rotation-btn" class="btn btn-secondary" disabled>
                            <i class="fas fa-arrow-left"></i>
                            تراجع
                        </button>
                        
                        <button id="redo-rotation-btn" class="btn btn-secondary" disabled>
                            <i class="fas fa-arrow-right"></i>
                            إعادة
                        </button>
                        
                        <button id="reset-rotation-btn" class="btn btn-outline" disabled>
                            <i class="fas fa-refresh"></i>
                            إعادة تعيين
                        </button>
                    </div>

                    <!-- معلومات التدوير -->
                    <div class="rotation-info" id="rotation-info" style="display: none;">
                        <div class="info-grid">
                            <div class="info-item">
                                <label>الأبعاد الأصلية:</label>
                                <span id="original-rotation-dimensions">-</span>
                            </div>
                            <div class="info-item">
                                <label>أبعاد جديدة:</label>
                                <span id="new-rotation-dimensions">-</span>
                            </div>
                            <div class="info-item">
                                <label>الزاوية الإجمالية:</label>
                                <span id="total-rotation">0°</span>
                            </div>
                            <div class="info-item">
                                <label>نقطة الدوران:</label>
                                <span id="rotation-point-info">الوسط</span>
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
        this.canvas = document.getElementById('rotation-canvas');
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
        // أزرار التدوير السريع
        document.querySelectorAll('.rotation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const angle = parseFloat(e.target.dataset.angle);
                this.rotateByAngle(angle);
            });
        });

        // التحكم في التدوير المخصص
        const rotationSlider = document.getElementById('rotation-slider');
        const rotationInput = document.getElementById('rotation-input');
        
        rotationSlider?.addEventListener('input', (e) => {
            const angle = parseFloat(e.target.value);
            rotationInput.value = angle;
            this.setRotation(angle);
        });

        rotationInput?.addEventListener('input', (e) => {
            const angle = parseFloat(e.target.value) || 0;
            const clampedAngle = Math.max(-180, Math.min(180, angle));
            rotationSlider.value = clampedAngle;
            this.setRotation(clampedAngle);
        });

        // أزرار التحكم الدقيق
        document.querySelectorAll('.fine-control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const increment = parseFloat(e.target.dataset.increment);
                this.adjustRotation(increment);
            });
        });

        // الزوايا المحددة مسبقاً
        document.querySelectorAll('.preset-angle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const angle = parseFloat(e.target.dataset.angle);
                this.setRotation(angle);
            });
        });

        // نقطة الدوران
        document.getElementById('rotation-center')?.addEventListener('change', (e) => {
            const customRow = document.getElementById('custom-center-row');
            if (e.target.value === 'custom') {
                customRow.style.display = 'block';
            } else {
                customRow.style.display = 'none';
            }
            this.updatePreview();
        });

        // نقطة الدوران المخصصة
        const centerX = document.getElementById('center-x');
        const centerY = document.getElementById('center-y');
        
        centerX?.addEventListener('input', (e) => {
            document.getElementById('center-x-value').textContent = e.target.value + '%';
            this.updatePreview();
        });

        centerY?.addEventListener('input', (e) => {
            document.getElementById('center-y-value').textContent = e.target.value + '%';
            this.updatePreview();
        });

        // لون الخلفية
        document.getElementById('bg-color-picker')?.addEventListener('change', () => {
            this.updateBackgroundButtons('custom');
            this.updatePreview();
        });

        document.querySelectorAll('.bg-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateBackgroundButtons(e.target.dataset.bg);
                this.updatePreview();
            });
        });

        // الخوارزمية
        document.getElementById('rotation-algorithm')?.addEventListener('change', () => {
            this.updatePreview();
        });

        // الإعدادات الأخرى
        document.getElementById('auto-center')?.addEventListener('change', () => {
            this.updatePreview();
        });

        document.getElementById('lock-aspect-ratio')?.addEventListener('change', () => {
            this.updatePreview();
        });

        document.getElementById('live-rotation-preview')?.addEventListener('change', (e) => {
            if (e.target.checked && this.currentImage) {
                this.updatePreview();
            }
        });

        // أزرار التحكم الرئيسية
        document.getElementById('apply-rotation-btn')?.addEventListener('click', () => {
            this.applyRotation();
        });

        document.getElementById('undo-rotation-btn')?.addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('redo-rotation-btn')?.addEventListener('click', () => {
            this.redo();
        });

        document.getElementById('reset-rotation-btn')?.addEventListener('click', () => {
            this.reset();
        });

        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (!this.currentImage) return;

            switch (e.key) {
                case 'ArrowLeft':
                    if (e.ctrlKey) this.adjustRotation(-1);
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey) this.adjustRotation(1);
                    break;
                case 'r':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.rotateByAngle(90);
                    }
                    break;
                case 'z':
                    if (e.ctrlKey && !e.shiftKey) {
                        e.preventDefault();
                        this.undo();
                    } else if (e.ctrlKey && e.shiftKey) {
                        e.preventDefault();
                        this.redo();
                    }
                    break;
            }
        });
    }

    /**
     * تحميل صورة للتدوير
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
            this.resetRotation();
            this.updateImageInfo();
            this.enableControls();
            this.drawImage();
            
            // إخفاء placeholder وإظهار canvas
            document.getElementById('rotation-placeholder').style.display = 'none';
            this.canvas.style.display = 'block';
            document.getElementById('rotation-indicator').style.display = 'flex';
            
            // إضافة إلى التاريخ
            this.addToHistory();
            
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
        const maxHeight = 400;

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
     * إعادة تعيين التدوير
     */
    resetRotation() {
        this.currentRotation = 0;
        this.updateRotationControls(0);
        this.updateRotationIndicator(0);
        this.history = [];
        this.historyIndex = -1;
        this.updateHistoryButtons();
    }

    /**
     * تدوير بزاوية محددة
     * @param {number} angle 
     */
    rotateByAngle(angle) {
        this.currentRotation += angle;
        
        // تطبيع الزاوية بين -180 و 180
        while (this.currentRotation > 180) this.currentRotation -= 360;
        while (this.currentRotation <= -180) this.currentRotation += 360;
        
        this.updateRotationControls(this.currentRotation);
        this.updateRotationIndicator(this.currentRotation);
        this.updatePreview();
    }

    /**
     * تعيين زاوية التدوير
     * @param {number} angle 
     */
    setRotation(angle) {
        this.currentRotation = angle;
        this.updateRotationIndicator(angle);
        this.updatePreview();
    }

    /**
     * تعديل التدوير
     * @param {number} increment 
     */
    adjustRotation(increment) {
        const newAngle = this.currentRotation + increment;
        const clampedAngle = Math.max(-180, Math.min(180, newAngle));
        this.setRotation(clampedAngle);
        this.updateRotationControls(clampedAngle);
    }

    /**
     * تحديث أزرار التحكم في التدوير
     * @param {number} angle 
     */
    updateRotationControls(angle) {
        document.getElementById('rotation-slider').value = angle;
        document.getElementById('rotation-input').value = angle;
    }

    /**
     * تحديث مؤشر التدوير
     * @param {number} angle 
     */
    updateRotationIndicator(angle) {
        const dialLine = document.getElementById('dial-line');
        const angleDisplay = document.getElementById('rotation-angle-display');
        
        if (dialLine) {
            dialLine.style.transform = `rotate(${angle}deg)`;
        }
        
        if (angleDisplay) {
            angleDisplay.textContent = `${angle.toFixed(1)}°`;
        }
    }

    /**
     * تحديث أزرار الخلفية
     * @param {string} type 
     */
    updateBackgroundButtons(type) {
        document.querySelectorAll('.bg-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const targetBtn = document.querySelector(`[data-bg="${type}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }

        // تحديث لون الخلفية
        const colorPicker = document.getElementById('bg-color-picker');
        switch (type) {
            case 'white':
                colorPicker.value = '#ffffff';
                break;
            case 'black':
                colorPicker.value = '#000000';
                break;
        }
    }

    /**
     * تحديث المعاينة
     */
    updatePreview() {
        if (!this.currentImage || !document.getElementById('live-rotation-preview')?.checked) {
            return;
        }

        this.drawImage();
        this.updateImageInfo();
        this.updateLivePreview();
    }

    /**
     * رسم الصورة
     */
    drawImage() {
        if (!this.currentImage || !this.ctx) return;

        // مسح اللوحة
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // تعيين لون الخلفية
        this.setBackgroundColor();

        // حفظ حالة السياق
        this.ctx.save();

        // الحصول على نقطة الدوران
        const rotationCenter = this.getRotationCenter();

        // الانتقال إلى نقطة الدوران
        this.ctx.translate(rotationCenter.x, rotationCenter.y);
        
        // التدوير
        this.ctx.rotate(this.currentRotation * Math.PI / 180);
        
        // رسم الصورة (مع الإزاحة بحيث تكون نقطة الدوران في المركز المناسب)
        const offsetX = -rotationCenter.x;
        const offsetY = -rotationCenter.y;
        
        this.ctx.drawImage(this.currentImage, offsetX, offsetY, this.canvas.width, this.canvas.height);

        // استعادة حالة السياق
        this.ctx.restore();
    }

    /**
     * تعيين لون الخلفية
     */
    setBackgroundColor() {
        const activeBtn = document.querySelector('.bg-preset-btn.active');
        const bgType = activeBtn?.dataset.bg || 'white';
        
        if (bgType === 'transparent') {
            // رسم نمط الشفافية
            this.drawTransparencyPattern();
        } else {
            const colorPicker = document.getElementById('bg-color-picker');
            this.ctx.fillStyle = colorPicker.value;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * رسم نمط الشفافية
     */
    drawTransparencyPattern() {
        const size = 10;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#cccccc';
        for (let x = 0; x < this.canvas.width; x += size) {
            for (let y = 0; y < this.canvas.height; y += size) {
                if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) {
                    this.ctx.fillRect(x, y, size, size);
                }
            }
        }
    }

    /**
     * الحصول على نقطة الدوران
     * @returns {Object}
     */
    getRotationCenter() {
        const rotationCenter = document.getElementById('rotation-center').value;
        
        switch (rotationCenter) {
            case 'top-left':
                return { x: 0, y: 0 };
            case 'top-right':
                return { x: this.canvas.width, y: 0 };
            case 'bottom-left':
                return { x: 0, y: this.canvas.height };
            case 'bottom-right':
                return { x: this.canvas.width, y: this.canvas.height };
            case 'custom':
                const centerX = parseInt(document.getElementById('center-x').value) / 100;
                const centerY = parseInt(document.getElementById('center-y').value) / 100;
                return { 
                    x: this.canvas.width * centerX, 
                    y: this.canvas.height * centerY 
                };
            default: // center
                return { 
                    x: this.canvas.width / 2, 
                    y: this.canvas.height / 2 
                };
        }
    }

    /**
     * تحديث المعاينة المباشرة
     */
    updateLivePreview() {
        if (!this.currentImage) return;

        try {
            const rotatedCanvas = this.getRotatedCanvas();
            
            const event = new CustomEvent('imagePreviewUpdate', {
                detail: {
                    type: 'comparison',
                    original: this.currentImage,
                    processed: rotatedCanvas,
                    info: {
                        rotation: this.currentRotation,
                        center: this.getRotationCenter()
                    }
                }
            });
            
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error('خطأ في المعاينة المباشرة:', error);
        }
    }

    /**
     * الحصول على اللوحة المدورة
     * @returns {HTMLCanvasElement}
     */
    getRotatedCanvas() {
        const algorithm = document.getElementById('rotation-algorithm').value;
        const lockAspect = document.getElementById('lock-aspect-ratio').checked;
        const autoCenter = document.getElementById('auto-center').checked;
        
        const options = {
            algorithm,
            lockAspectRatio: lockAspect,
            autoCenter,
            backgroundColor: this.getBackgroundColor(),
            rotationCenter: this.getRotationCenter()
        };

        return this.imageUtils.rotateImage(this.currentImage, this.currentRotation, options);
    }

    /**
     * الحصول على لون الخلفية
     * @returns {string}
     */
    getBackgroundColor() {
        const activeBtn = document.querySelector('.bg-preset-btn.active');
        const bgType = activeBtn?.dataset.bg || 'white';
        
        if (bgType === 'transparent') {
            return 'transparent';
        }
        
        return document.getElementById('bg-color-picker').value;
    }

    /**
     * تطبيق التدوير
     */
    async applyRotation() {
        if (!this.currentImage) return;

        try {
            this.uiHelpers.showLoading('جاري تطبيق التدوير...');

            const rotatedCanvas = this.getRotatedCanvas();
            const format = this.getBackgroundColor() === 'transparent' ? 'image/png' : 'image/jpeg';
            const blob = await this.imageUtils.canvasToBlob(rotatedCanvas, {
                format,
                quality: 0.95
            });

            // إضافة إلى التاريخ
            this.addToHistory();

            // إرسال النتيجة
            this.sendToResults({
                blob,
                canvas: rotatedCanvas,
                rotation: this.currentRotation,
                center: this.getRotationCenter(),
                originalDimensions: {
                    width: this.currentImage.width,
                    height: this.currentImage.height
                }
            });

            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('تم تطبيق التدوير بنجاح', 'success');

        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في تطبيق التدوير: ' + error.message, 'error');
        }
    }

    /**
     * إضافة إلى التاريخ
     */
    addToHistory() {
        // إزالة العناصر بعد الفهرس الحالي
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // إضافة الحالة الحالية
        this.history.push({
            rotation: this.currentRotation,
            timestamp: Date.now()
        });
        
        this.historyIndex = this.history.length - 1;
        
        // تحديد عدد العناصر في التاريخ
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
        
        this.updateHistoryButtons();
    }

    /**
     * التراجع
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            
            this.currentRotation = state.rotation;
            this.updateRotationControls(this.currentRotation);
            this.updateRotationIndicator(this.currentRotation);
            this.updatePreview();
            this.updateHistoryButtons();
            
            this.uiHelpers.showNotification('تم التراجع', 'info');
        }
    }

    /**
     * الإعادة
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            
            this.currentRotation = state.rotation;
            this.updateRotationControls(this.currentRotation);
            this.updateRotationIndicator(this.currentRotation);
            this.updatePreview();
            this.updateHistoryButtons();
            
            this.uiHelpers.showNotification('تم الإعادة', 'info');
        }
    }

    /**
     * تحديث أزرار التاريخ
     */
    updateHistoryButtons() {
        const undoBtn = document.getElementById('undo-rotation-btn');
        const redoBtn = document.getElementById('redo-rotation-btn');
        
        if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    /**
     * تحديث معلومات الصورة
     */
    updateImageInfo() {
        if (!this.currentImage) return;

        const rotatedCanvas = this.getRotatedCanvas();
        const center = this.getRotationCenter();
        
        let centerText = 'الوسط';
        const rotationCenter = document.getElementById('rotation-center').value;
        
        switch (rotationCenter) {
            case 'top-left': centerText = 'أعلى يسار'; break;
            case 'top-right': centerText = 'أعلى يمين'; break;
            case 'bottom-left': centerText = 'أسفل يسار'; break;
            case 'bottom-right': centerText = 'أسفل يمين'; break;
            case 'custom': 
                const x = parseInt(document.getElementById('center-x').value);
                const y = parseInt(document.getElementById('center-y').value);
                centerText = `مخصص (${x}%, ${y}%)`;
                break;
        }

        document.getElementById('original-rotation-dimensions').textContent = 
            `${this.currentImage.width} × ${this.currentImage.height}`;
        document.getElementById('new-rotation-dimensions').textContent = 
            `${rotatedCanvas.width} × ${rotatedCanvas.height}`;
        document.getElementById('total-rotation').textContent = `${this.currentRotation.toFixed(1)}°`;
        document.getElementById('rotation-point-info').textContent = centerText;

        document.getElementById('rotation-info').style.display = 'block';
    }

    /**
     * إرسال النتيجة
     * @param {Object} result 
     */
    sendToResults(result) {
        const event = new CustomEvent('imageProcessed', {
            detail: {
                type: 'rotate',
                blob: result.blob,
                rotation: result.rotation,
                center: result.center,
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
        const angle = Math.abs(this.currentRotation);
        return `rotated_${angle}deg_${timestamp}.${this.getBackgroundColor() === 'transparent' ? 'png' : 'jpg'}`;
    }

    /**
     * تفعيل أزرار التحكم
     */
    enableControls() {
        document.getElementById('apply-rotation-btn').disabled = false;
        document.getElementById('reset-rotation-btn').disabled = false;
    }

    /**
     * إعادة تعيين
     */
    reset() {
        if (!this.currentImage) return;

        this.resetRotation();
        this.drawImage();
        this.updateImageInfo();
        
        // إعادة تعيين الإعدادات
        document.getElementById('rotation-center').value = 'center';
        document.getElementById('custom-center-row').style.display = 'none';
        document.getElementById('center-x').value = 50;
        document.getElementById('center-y').value = 50;
        document.getElementById('center-x-value').textContent = '50%';
        document.getElementById('center-y-value').textContent = '50%';
        
        this.updateBackgroundButtons('white');
        
        document.getElementById('rotation-algorithm').value = 'bilinear';
        document.getElementById('auto-center').checked = true;
        document.getElementById('lock-aspect-ratio').checked = false;
        
        this.uiHelpers.showNotification('تم إعادة تعيين أداة التدوير', 'info');
    }

    /**
     * إعادة تعيين كاملة
     */
    fullReset() {
        this.currentImage = null;
        this.currentRotation = 0;
        this.history = [];
        this.historyIndex = -1;
        
        // إخفاء canvas وإظهار placeholder
        this.canvas.style.display = 'none';
        document.getElementById('rotation-placeholder').style.display = 'flex';
        document.getElementById('rotation-indicator').style.display = 'none';
        document.getElementById('rotation-info').style.display = 'none';

        // تعطيل الأزرار
        document.getElementById('apply-rotation-btn').disabled = true;
        document.getElementById('undo-rotation-btn').disabled = true;
        document.getElementById('redo-rotation-btn').disabled = true;
        document.getElementById('reset-rotation-btn').disabled = true;

        this.reset();
        this.uiHelpers.showNotification('تم إعادة تعيين أداة التدوير', 'info');
    }
}

// تصدير الكلاس
export default ImageRotator;