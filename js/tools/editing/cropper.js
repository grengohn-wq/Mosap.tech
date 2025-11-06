/**
 * Image Cropper Tool
 * أداة قص الصور - قص بنسب محددة أو حرة مع معاينة تفاعلية
 */

import ImageUtils from '../utils/imageUtils.js';
import UIHelpers from '../utils/uiHelpers.js';

class ImageCropper {
    constructor() {
        this.imageUtils = new ImageUtils();
        this.uiHelpers = new UIHelpers();
        this.currentImage = null;
        this.cropCanvas = null;
        this.cropCtx = null;
        this.cropArea = { x: 0, y: 0, width: 0, height: 0 };
        this.isDrawing = false;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.aspectRatios = {
            'free': { name: 'حر', ratio: null },
            '1:1': { name: '1:1 (مربع)', ratio: 1 },
            '4:3': { name: '4:3 (تقليدي)', ratio: 4/3 },
            '3:4': { name: '3:4 (عمودي)', ratio: 3/4 },
            '16:9': { name: '16:9 (عريض)', ratio: 16/9 },
            '9:16': { name: '9:16 (ستوري)', ratio: 9/16 },
            '3:2': { name: '3:2 (فوتوغرافي)', ratio: 3/2 },
            '2:3': { name: '2:3 (عمودي)', ratio: 2/3 }
        };
        this.selectedRatio = 'free';
        this.scale = 1;
    }

    /**
     * تهيئة أداة القص
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
    }

    /**
     * إنشاء واجهة أداة القص
     */
    createInterface() {
        const controlsSection = document.getElementById('controls-section');
        if (!controlsSection) return;

        controlsSection.innerHTML = `
            <div class="control-panel">
                <div class="control-header">
                    <i class="fas fa-crop"></i>
                    <h3>قص الصور</h3>
                </div>
                
                <div class="control-group">
                    <!-- معاينة القص التفاعلية -->
                    <div class="crop-preview-container">
                        <canvas id="crop-canvas" class="crop-canvas" style="display: none;"></canvas>
                        <div class="crop-placeholder" id="crop-placeholder">
                            <i class="fas fa-image"></i>
                            <p>ارفع صورة لبدء القص</p>
                        </div>
                    </div>

                    <!-- نسب القص -->
                    <div class="control-row">
                        <label class="control-label">نسبة القص</label>
                        <div class="aspect-ratio-grid" id="aspect-ratio-grid">
                            <!-- سيتم إنشاؤها ديناميكياً -->
                        </div>
                    </div>

                    <!-- إعدادات القص المخصص -->
                    <div class="custom-crop-settings" id="custom-crop-settings">
                        <div class="control-row">
                            <label class="control-label">منطقة القص (بكسل)</label>
                            <div class="crop-coordinates">
                                <div class="coordinate-input">
                                    <label>س:</label>
                                    <input type="number" id="crop-x" class="form-input" min="0" value="0">
                                </div>
                                <div class="coordinate-input">
                                    <label>ص:</label>
                                    <input type="number" id="crop-y" class="form-input" min="0" value="0">
                                </div>
                                <div class="coordinate-input">
                                    <label>العرض:</label>
                                    <input type="number" id="crop-width" class="form-input" min="1" value="100">
                                </div>
                                <div class="coordinate-input">
                                    <label>الارتفاع:</label>
                                    <input type="number" id="crop-height" class="form-input" min="1" value="100">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- أحجام قص سريعة -->
                    <div class="control-row">
                        <label class="control-label">أحجام سريعة</label>
                        <div class="quick-sizes">
                            <button class="quick-size-btn" data-size="center-50">وسط 50%</button>
                            <button class="quick-size-btn" data-size="center-75">وسط 75%</button>
                            <button class="quick-size-btn" data-size="full">كامل</button>
                            <button class="quick-size-btn" data-size="face">وجه تلقائي</button>
                        </div>
                    </div>

                    <!-- إعدادات متقدمة -->
                    <details class="advanced-settings">
                        <summary>إعدادات متقدمة</summary>
                        
                        <div class="control-row">
                            <label class="control-label">شبكة الإرشاد</label>
                            <select id="guide-grid" class="form-select">
                                <option value="none">بدون شبكة</option>
                                <option value="thirds" selected>قاعدة الثلث</option>
                                <option value="golden">النسبة الذهبية</option>
                                <option value="square">مربعات</option>
                            </select>
                        </div>

                        <div class="control-row">
                            <label class="control-label">شفافية الخلفية</label>
                            <div class="control-input-group">
                                <input type="range" id="overlay-opacity" class="form-range" 
                                       min="0.3" max="0.9" step="0.1" value="0.7">
                                <span class="range-value" id="overlay-opacity-value">70%</span>
                            </div>
                        </div>

                        <div class="control-row">
                            <label class="control-label">دقة القص</label>
                            <select id="crop-precision" class="form-select">
                                <option value="pixel">دقة البكسل</option>
                                <option value="smooth" selected>ناعم</option>
                            </select>
                        </div>

                        <div class="control-row">
                            <label class="control-label">معاينة مباشرة</label>
                            <input type="checkbox" id="live-crop-preview" checked>
                        </div>
                    </details>

                    <!-- أزرار التحكم -->
                    <div class="control-actions">
                        <button id="crop-btn" class="btn btn-primary" disabled>
                            <i class="fas fa-crop"></i>
                            قص الصورة
                        </button>
                        
                        <button id="rotate-crop-btn" class="btn btn-secondary" disabled>
                            <i class="fas fa-undo"></i>
                            تدوير 90°
                        </button>
                        
                        <button id="reset-crop-btn" class="btn btn-outline" disabled>
                            <i class="fas fa-refresh"></i>
                            إعادة تعيين
                        </button>
                    </div>

                    <!-- معلومات القص -->
                    <div class="crop-info" id="crop-info" style="display: none;">
                        <div class="info-grid">
                            <div class="info-item">
                                <label>الأبعاد الأصلية:</label>
                                <span id="original-dimensions">-</span>
                            </div>
                            <div class="info-item">
                                <label>أبعاد القص:</label>
                                <span id="crop-dimensions">-</span>
                            </div>
                            <div class="info-item">
                                <label>نسبة القص:</label>
                                <span id="crop-ratio">-</span>
                            </div>
                            <div class="info-item">
                                <label>النسبة المئوية:</label>
                                <span id="crop-percentage">-</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.createAspectRatioGrid();
        this.setupCropCanvas();
    }

    /**
     * إنشاء شبكة نسب القص
     */
    createAspectRatioGrid() {
        const grid = document.getElementById('aspect-ratio-grid');
        if (!grid) return;

        grid.innerHTML = '';

        Object.entries(this.aspectRatios).forEach(([key, ratio]) => {
            const ratioBtn = document.createElement('button');
            ratioBtn.className = `aspect-ratio-btn ${key === 'free' ? 'active' : ''}`;
            ratioBtn.dataset.ratio = key;
            ratioBtn.textContent = ratio.name;
            
            ratioBtn.addEventListener('click', () => {
                this.selectAspectRatio(key);
            });

            grid.appendChild(ratioBtn);
        });
    }

    /**
     * إعداد لوحة القص
     */
    setupCropCanvas() {
        this.cropCanvas = document.getElementById('crop-canvas');
        if (!this.cropCanvas) return;

        this.cropCtx = this.cropCanvas.getContext('2d');
        
        // إضافة مستمعي أحداث الماوس
        this.cropCanvas.addEventListener('mousedown', this.startCrop.bind(this));
        this.cropCanvas.addEventListener('mousemove', this.updateCrop.bind(this));
        this.cropCanvas.addEventListener('mouseup', this.endCrop.bind(this));
        this.cropCanvas.addEventListener('mouseleave', this.endCrop.bind(this));

        // إضافة دعم اللمس للأجهزة المحمولة
        this.cropCanvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.cropCanvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.cropCanvas.addEventListener('touchend', this.endCrop.bind(this));
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // تحديث شفافية الخلفية
        const overlayOpacity = document.getElementById('overlay-opacity');
        const overlayValue = document.getElementById('overlay-opacity-value');
        
        if (overlayOpacity && overlayValue) {
            overlayOpacity.addEventListener('input', (e) => {
                const value = Math.round(e.target.value * 100);
                overlayValue.textContent = `${value}%`;
                this.redrawCanvas();
            });
        }

        // تحديث إحداثيات القص يدوياً
        const coords = ['crop-x', 'crop-y', 'crop-width', 'crop-height'];
        coords.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    this.updateCropFromInputs();
                });
            }
        });

        // الأحجام السريعة
        const quickSizeBtns = document.querySelectorAll('.quick-size-btn');
        quickSizeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyQuickSize(e.target.dataset.size);
            });
        });

        // أزرار التحكم
        document.getElementById('crop-btn')?.addEventListener('click', () => {
            this.cropImage();
        });

        document.getElementById('rotate-crop-btn')?.addEventListener('click', () => {
            this.rotateCrop();
        });

        document.getElementById('reset-crop-btn')?.addEventListener('click', () => {
            this.resetCrop();
        });

        // شبكة الإرشاد
        document.getElementById('guide-grid')?.addEventListener('change', () => {
            this.redrawCanvas();
        });

        // المعاينة المباشرة
        document.getElementById('live-crop-preview')?.addEventListener('change', (e) => {
            if (e.target.checked && this.currentImage) {
                this.updateLivePreview();
            }
        });
    }

    /**
     * تحميل صورة للقص
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
            this.initializeCropArea();
            this.updateImageInfo();
            this.enableControls();
            this.redrawCanvas();
            
            // إخفاء placeholder وإظهار canvas
            document.getElementById('crop-placeholder').style.display = 'none';
            this.cropCanvas.style.display = 'block';
            
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
        const container = this.cropCanvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = 400; // ارتفاع ثابت

        // حساب المقياس لملائمة الصورة
        const scaleX = containerWidth / this.currentImage.width;
        const scaleY = containerHeight / this.currentImage.height;
        this.scale = Math.min(scaleX, scaleY, 1); // لا تكبر الصورة

        // تعيين أبعاد اللوحة
        this.cropCanvas.width = this.currentImage.width * this.scale;
        this.cropCanvas.height = this.currentImage.height * this.scale;
    }

    /**
     * تهيئة منطقة القص
     */
    initializeCropArea() {
        const canvasWidth = this.cropCanvas.width;
        const canvasHeight = this.cropCanvas.height;
        
        // البدء بمنطقة تغطي 80% من الصورة في الوسط
        const margin = 0.1;
        this.cropArea = {
            x: canvasWidth * margin,
            y: canvasHeight * margin,
            width: canvasWidth * (1 - 2 * margin),
            height: canvasHeight * (1 - 2 * margin)
        };

        this.updateInputsFromCrop();
    }

    /**
     * اختيار نسبة العرض للارتفاع
     * @param {string} ratioKey 
     */
    selectAspectRatio(ratioKey) {
        // تحديث الأزرار
        document.querySelectorAll('.aspect-ratio-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ratio === ratioKey);
        });

        this.selectedRatio = ratioKey;
        const ratio = this.aspectRatios[ratioKey];

        // تعديل منطقة القص لتتناسب مع النسبة الجديدة
        if (ratio.ratio) {
            this.adjustCropAreaToRatio(ratio.ratio);
        }

        this.redrawCanvas();
    }

    /**
     * تعديل منطقة القص لتتناسب مع النسبة
     * @param {number} targetRatio 
     */
    adjustCropAreaToRatio(targetRatio) {
        const currentRatio = this.cropArea.width / this.cropArea.height;
        
        if (currentRatio > targetRatio) {
            // تقليل العرض
            const newWidth = this.cropArea.height * targetRatio;
            const widthDiff = this.cropArea.width - newWidth;
            this.cropArea.x += widthDiff / 2;
            this.cropArea.width = newWidth;
        } else {
            // تقليل الارتفاع
            const newHeight = this.cropArea.width / targetRatio;
            const heightDiff = this.cropArea.height - newHeight;
            this.cropArea.y += heightDiff / 2;
            this.cropArea.height = newHeight;
        }

        // التأكد من عدم تجاوز حدود اللوحة
        this.constrainCropArea();
        this.updateInputsFromCrop();
    }

    /**
     * بدء القص
     * @param {MouseEvent} e 
     */
    startCrop(e) {
        const rect = this.cropCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // فحص ما إذا كان النقر داخل منطقة القص للسحب
        if (this.isInsideCropArea(x, y)) {
            this.isDragging = true;
            this.dragStart = { x: x - this.cropArea.x, y: y - this.cropArea.y };
        } else {
            // بدء رسم منطقة قص جديدة
            this.isDrawing = true;
            this.cropArea.x = x;
            this.cropArea.y = y;
            this.cropArea.width = 0;
            this.cropArea.height = 0;
        }

        this.cropCanvas.style.cursor = this.isDragging ? 'move' : 'crosshair';
    }

    /**
     * تحديث القص
     * @param {MouseEvent} e 
     */
    updateCrop(e) {
        if (!this.isDrawing && !this.isDragging) return;

        const rect = this.cropCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDragging) {
            // سحب منطقة القص
            this.cropArea.x = x - this.dragStart.x;
            this.cropArea.y = y - this.dragStart.y;
            this.constrainCropArea();
        } else if (this.isDrawing) {
            // رسم منطقة قص جديدة
            this.cropArea.width = Math.abs(x - this.cropArea.x);
            this.cropArea.height = Math.abs(y - this.cropArea.y);
            
            // تعديل الإحداثيات إذا كان الماوس إلى اليسار أو أعلى نقطة البداية
            if (x < this.cropArea.x) {
                this.cropArea.x = x;
            }
            if (y < this.cropArea.y) {
                this.cropArea.y = y;
            }

            // تطبيق نسبة العرض للارتفاع إذا كانت محددة
            const ratio = this.aspectRatios[this.selectedRatio];
            if (ratio.ratio) {
                this.cropArea.height = this.cropArea.width / ratio.ratio;
            }

            this.constrainCropArea();
        }

        this.updateInputsFromCrop();
        this.redrawCanvas();
        
        if (document.getElementById('live-crop-preview')?.checked) {
            this.updateLivePreview();
        }
    }

    /**
     * إنهاء القص
     */
    endCrop() {
        this.isDrawing = false;
        this.isDragging = false;
        this.cropCanvas.style.cursor = 'default';
        this.updateCropInfo();
    }

    /**
     * معالجة اللمس للأجهزة المحمولة
     * @param {TouchEvent} e 
     */
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        if (!touch) return;

        const mouseEvent = new MouseEvent(e.type.replace('touch', 'mouse'), {
            clientX: touch.clientX,
            clientY: touch.clientY
        });

        this.cropCanvas.dispatchEvent(mouseEvent);
    }

    /**
     * فحص ما إذا كانت النقطة داخل منطقة القص
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isInsideCropArea(x, y) {
        return x >= this.cropArea.x && 
               x <= this.cropArea.x + this.cropArea.width &&
               y >= this.cropArea.y && 
               y <= this.cropArea.y + this.cropArea.height;
    }

    /**
     * تقييد منطقة القص داخل حدود اللوحة
     */
    constrainCropArea() {
        // تقييد الموقع
        this.cropArea.x = Math.max(0, Math.min(this.cropArea.x, this.cropCanvas.width - this.cropArea.width));
        this.cropArea.y = Math.max(0, Math.min(this.cropArea.y, this.cropCanvas.height - this.cropArea.height));
        
        // تقييد الحجم
        this.cropArea.width = Math.max(10, Math.min(this.cropArea.width, this.cropCanvas.width - this.cropArea.x));
        this.cropArea.height = Math.max(10, Math.min(this.cropArea.height, this.cropCanvas.height - this.cropArea.y));
    }

    /**
     * تحديث الحقول من منطقة القص
     */
    updateInputsFromCrop() {
        // تحويل إلى إحداثيات الصورة الأصلية
        const originalX = Math.round(this.cropArea.x / this.scale);
        const originalY = Math.round(this.cropArea.y / this.scale);
        const originalWidth = Math.round(this.cropArea.width / this.scale);
        const originalHeight = Math.round(this.cropArea.height / this.scale);

        document.getElementById('crop-x').value = originalX;
        document.getElementById('crop-y').value = originalY;
        document.getElementById('crop-width').value = originalWidth;
        document.getElementById('crop-height').value = originalHeight;
    }

    /**
     * تحديث منطقة القص من الحقول
     */
    updateCropFromInputs() {
        const x = parseInt(document.getElementById('crop-x').value) || 0;
        const y = parseInt(document.getElementById('crop-y').value) || 0;
        const width = parseInt(document.getElementById('crop-width').value) || 100;
        const height = parseInt(document.getElementById('crop-height').value) || 100;

        // تحويل إلى إحداثيات اللوحة
        this.cropArea.x = x * this.scale;
        this.cropArea.y = y * this.scale;
        this.cropArea.width = width * this.scale;
        this.cropArea.height = height * this.scale;

        this.constrainCropArea();
        this.redrawCanvas();
        
        if (document.getElementById('live-crop-preview')?.checked) {
            this.updateLivePreview();
        }
    }

    /**
     * تطبيق حجم سريع
     * @param {string} size 
     */
    applyQuickSize(size) {
        const canvasWidth = this.cropCanvas.width;
        const canvasHeight = this.cropCanvas.height;

        switch (size) {
            case 'center-50':
                this.cropArea = {
                    x: canvasWidth * 0.25,
                    y: canvasHeight * 0.25,
                    width: canvasWidth * 0.5,
                    height: canvasHeight * 0.5
                };
                break;
            case 'center-75':
                this.cropArea = {
                    x: canvasWidth * 0.125,
                    y: canvasHeight * 0.125,
                    width: canvasWidth * 0.75,
                    height: canvasHeight * 0.75
                };
                break;
            case 'full':
                this.cropArea = {
                    x: 0,
                    y: 0,
                    width: canvasWidth,
                    height: canvasHeight
                };
                break;
            case 'face':
                // محاولة اكتشاف الوجه (مبسط - في منتصف الثلث العلوي)
                this.cropArea = {
                    x: canvasWidth * 0.2,
                    y: canvasHeight * 0.1,
                    width: canvasWidth * 0.6,
                    height: canvasHeight * 0.6
                };
                break;
        }

        // تطبيق نسبة العرض للارتفاع إذا كانت محددة
        const ratio = this.aspectRatios[this.selectedRatio];
        if (ratio.ratio) {
            this.adjustCropAreaToRatio(ratio.ratio);
        }

        this.updateInputsFromCrop();
        this.redrawCanvas();
        this.updateCropInfo();
    }

    /**
     * إعادة رسم اللوحة
     */
    redrawCanvas() {
        if (!this.currentImage || !this.cropCtx) return;

        // مسح اللوحة
        this.cropCtx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);

        // رسم الصورة
        this.cropCtx.drawImage(
            this.currentImage, 
            0, 0, 
            this.cropCanvas.width, 
            this.cropCanvas.height
        );

        // رسم التراكب الشفاف
        const overlayOpacity = parseFloat(document.getElementById('overlay-opacity').value) || 0.7;
        this.drawOverlay(overlayOpacity);

        // رسم منطقة القص
        this.drawCropArea();

        // رسم شبكة الإرشاد
        this.drawGuideGrid();

        // رسم مقابض التحكم
        this.drawHandles();
    }

    /**
     * رسم التراكب الشفاف
     * @param {number} opacity 
     */
    drawOverlay(opacity) {
        this.cropCtx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        
        // رسم أربعة مستطيلات حول منطقة القص
        // أعلى
        this.cropCtx.fillRect(0, 0, this.cropCanvas.width, this.cropArea.y);
        // أسفل
        this.cropCtx.fillRect(0, this.cropArea.y + this.cropArea.height, this.cropCanvas.width, this.cropCanvas.height - (this.cropArea.y + this.cropArea.height));
        // يسار
        this.cropCtx.fillRect(0, this.cropArea.y, this.cropArea.x, this.cropArea.height);
        // يمين
        this.cropCtx.fillRect(this.cropArea.x + this.cropArea.width, this.cropArea.y, this.cropCanvas.width - (this.cropArea.x + this.cropArea.width), this.cropArea.height);
    }

    /**
     * رسم منطقة القص
     */
    drawCropArea() {
        this.cropCtx.strokeStyle = '#ffffff';
        this.cropCtx.lineWidth = 2;
        this.cropCtx.strokeRect(this.cropArea.x, this.cropArea.y, this.cropArea.width, this.cropArea.height);

        // إضافة خط داخلي
        this.cropCtx.strokeStyle = '#000000';
        this.cropCtx.lineWidth = 1;
        this.cropCtx.strokeRect(this.cropArea.x + 1, this.cropArea.y + 1, this.cropArea.width - 2, this.cropArea.height - 2);
    }

    /**
     * رسم شبكة الإرشاد
     */
    drawGuideGrid() {
        const gridType = document.getElementById('guide-grid').value;
        if (gridType === 'none') return;

        this.cropCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.cropCtx.lineWidth = 1;

        const x = this.cropArea.x;
        const y = this.cropArea.y;
        const width = this.cropArea.width;
        const height = this.cropArea.height;

        switch (gridType) {
            case 'thirds':
                // خطوط عمودية
                this.cropCtx.beginPath();
                this.cropCtx.moveTo(x + width / 3, y);
                this.cropCtx.lineTo(x + width / 3, y + height);
                this.cropCtx.moveTo(x + 2 * width / 3, y);
                this.cropCtx.lineTo(x + 2 * width / 3, y + height);
                // خطوط أفقية
                this.cropCtx.moveTo(x, y + height / 3);
                this.cropCtx.lineTo(x + width, y + height / 3);
                this.cropCtx.moveTo(x, y + 2 * height / 3);
                this.cropCtx.lineTo(x + width, y + 2 * height / 3);
                this.cropCtx.stroke();
                break;

            case 'golden':
                const goldenRatio = 0.618;
                this.cropCtx.beginPath();
                // خطوط عمودية
                this.cropCtx.moveTo(x + width * goldenRatio, y);
                this.cropCtx.lineTo(x + width * goldenRatio, y + height);
                this.cropCtx.moveTo(x + width * (1 - goldenRatio), y);
                this.cropCtx.lineTo(x + width * (1 - goldenRatio), y + height);
                // خطوط أفقية
                this.cropCtx.moveTo(x, y + height * goldenRatio);
                this.cropCtx.lineTo(x + width, y + height * goldenRatio);
                this.cropCtx.moveTo(x, y + height * (1 - goldenRatio));
                this.cropCtx.lineTo(x + width, y + height * (1 - goldenRatio));
                this.cropCtx.stroke();
                break;

            case 'square':
                const gridSize = Math.min(width, height) / 4;
                this.cropCtx.beginPath();
                for (let i = 1; i < 4; i++) {
                    // خطوط عمودية
                    this.cropCtx.moveTo(x + i * gridSize, y);
                    this.cropCtx.lineTo(x + i * gridSize, y + height);
                    // خطوط أفقية
                    this.cropCtx.moveTo(x, y + i * gridSize);
                    this.cropCtx.lineTo(x + width, y + i * gridSize);
                }
                this.cropCtx.stroke();
                break;
        }
    }

    /**
     * رسم مقابض التحكم
     */
    drawHandles() {
        const handleSize = 8;
        const x = this.cropArea.x;
        const y = this.cropArea.y;
        const width = this.cropArea.width;
        const height = this.cropArea.height;

        // رسم المقابض في الزوايا والوسط
        const handles = [
            { x: x - handleSize/2, y: y - handleSize/2 }, // أعلى يسار
            { x: x + width/2 - handleSize/2, y: y - handleSize/2 }, // أعلى وسط
            { x: x + width - handleSize/2, y: y - handleSize/2 }, // أعلى يمين
            { x: x + width - handleSize/2, y: y + height/2 - handleSize/2 }, // يمين وسط
            { x: x + width - handleSize/2, y: y + height - handleSize/2 }, // أسفل يمين
            { x: x + width/2 - handleSize/2, y: y + height - handleSize/2 }, // أسفل وسط
            { x: x - handleSize/2, y: y + height - handleSize/2 }, // أسفل يسار
            { x: x - handleSize/2, y: y + height/2 - handleSize/2 }, // يسار وسط
        ];

        handles.forEach(handle => {
            // رسم المقبض
            this.cropCtx.fillStyle = '#ffffff';
            this.cropCtx.fillRect(handle.x, handle.y, handleSize, handleSize);
            this.cropCtx.strokeStyle = '#000000';
            this.cropCtx.lineWidth = 1;
            this.cropCtx.strokeRect(handle.x, handle.y, handleSize, handleSize);
        });
    }

    /**
     * تحديث معلومات القص
     */
    updateCropInfo() {
        const originalWidth = Math.round(this.cropArea.width / this.scale);
        const originalHeight = Math.round(this.cropArea.height / this.scale);
        const totalPixels = this.currentImage.width * this.currentImage.height;
        const cropPixels = originalWidth * originalHeight;
        const percentage = ((cropPixels / totalPixels) * 100).toFixed(1);

        document.getElementById('original-dimensions').textContent = `${this.currentImage.width} × ${this.currentImage.height}`;
        document.getElementById('crop-dimensions').textContent = `${originalWidth} × ${originalHeight}`;
        document.getElementById('crop-ratio').textContent = (originalWidth / originalHeight).toFixed(2);
        document.getElementById('crop-percentage').textContent = `${percentage}%`;

        document.getElementById('crop-info').style.display = 'block';
    }

    /**
     * تحديث المعاينة المباشرة
     */
    updateLivePreview() {
        if (!this.currentImage) return;

        try {
            const croppedCanvas = this.getCroppedCanvas();
            
            const event = new CustomEvent('imagePreviewUpdate', {
                detail: {
                    type: 'comparison',
                    original: this.currentImage,
                    processed: croppedCanvas,
                    info: {
                        cropArea: {
                            x: Math.round(this.cropArea.x / this.scale),
                            y: Math.round(this.cropArea.y / this.scale),
                            width: Math.round(this.cropArea.width / this.scale),
                            height: Math.round(this.cropArea.height / this.scale)
                        }
                    }
                }
            });
            
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error('خطأ في المعاينة المباشرة:', error);
        }
    }

    /**
     * الحصول على اللوحة المقصوصة
     * @returns {HTMLCanvasElement}
     */
    getCroppedCanvas() {
        const originalX = Math.round(this.cropArea.x / this.scale);
        const originalY = Math.round(this.cropArea.y / this.scale);
        const originalWidth = Math.round(this.cropArea.width / this.scale);
        const originalHeight = Math.round(this.cropArea.height / this.scale);

        return this.imageUtils.cropImage(this.currentImage, {
            x: originalX,
            y: originalY,
            width: originalWidth,
            height: originalHeight
        });
    }

    /**
     * قص الصورة
     */
    async cropImage() {
        if (!this.currentImage) return;

        try {
            this.uiHelpers.showLoading('جاري قص الصورة...');

            const croppedCanvas = this.getCroppedCanvas();
            const blob = await this.imageUtils.canvasToBlob(croppedCanvas, {
                format: 'image/png',
                quality: 1
            });

            // إرسال النتيجة إلى results panel
            this.sendToResults({
                blob,
                canvas: croppedCanvas,
                cropArea: {
                    x: Math.round(this.cropArea.x / this.scale),
                    y: Math.round(this.cropArea.y / this.scale),
                    width: Math.round(this.cropArea.width / this.scale),
                    height: Math.round(this.cropArea.height / this.scale)
                },
                originalDimensions: {
                    width: this.currentImage.width,
                    height: this.currentImage.height
                }
            });

            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('تم قص الصورة بنجاح', 'success');

        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في قص الصورة: ' + error.message, 'error');
        }
    }

    /**
     * تدوير منطقة القص
     */
    rotateCrop() {
        // تبديل العرض والارتفاع
        const temp = this.cropArea.width;
        this.cropArea.width = this.cropArea.height;
        this.cropArea.height = temp;

        // إعادة توسيط المنطقة
        this.cropArea.x = Math.max(0, (this.cropCanvas.width - this.cropArea.width) / 2);
        this.cropArea.y = Math.max(0, (this.cropCanvas.height - this.cropArea.height) / 2);

        this.constrainCropArea();
        this.updateInputsFromCrop();
        this.redrawCanvas();
        this.updateCropInfo();
    }

    /**
     * إعادة تعيين القص
     */
    resetCrop() {
        this.initializeCropArea();
        this.selectedRatio = 'free';
        
        // إعادة تحديد نسبة حرة
        document.querySelectorAll('.aspect-ratio-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ratio === 'free');
        });

        this.redrawCanvas();
        this.updateCropInfo();
        this.uiHelpers.showNotification('تم إعادة تعيين القص', 'info');
    }

    /**
     * تحديث معلومات الصورة
     */
    updateImageInfo() {
        this.updateCropInfo();
    }

    /**
     * إرسال النتيجة إلى results panel
     * @param {Object} result 
     */
    sendToResults(result) {
        const event = new CustomEvent('imageProcessed', {
            detail: {
                type: 'crop',
                blob: result.blob,
                cropArea: result.cropArea,
                originalDimensions: result.originalDimensions,
                newDimensions: {
                    width: result.cropArea.width,
                    height: result.cropArea.height
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
        return `cropped_image_${timestamp}.png`;
    }

    /**
     * تفعيل أزرار التحكم
     */
    enableControls() {
        document.getElementById('crop-btn').disabled = false;
        document.getElementById('rotate-crop-btn').disabled = false;
        document.getElementById('reset-crop-btn').disabled = false;
    }

    /**
     * إعادة تعيين كاملة
     */
    reset() {
        this.currentImage = null;
        this.cropArea = { x: 0, y: 0, width: 0, height: 0 };
        this.selectedRatio = 'free';
        
        // إخفاء canvas وإظهار placeholder
        this.cropCanvas.style.display = 'none';
        document.getElementById('crop-placeholder').style.display = 'flex';
        document.getElementById('crop-info').style.display = 'none';

        // تعطيل الأزرار
        document.getElementById('crop-btn').disabled = true;
        document.getElementById('rotate-crop-btn').disabled = true;
        document.getElementById('reset-crop-btn').disabled = true;

        this.uiHelpers.showNotification('تم إعادة تعيين أداة القص', 'info');
    }
}

// تصدير الكلاس
export default ImageCropper;