/**
 * Preview Panel Component  
 * مكون لوحة المعاينة للصور والنتائج
 */

import UIHelpers from '../utils/uiHelpers.js';
import ImageUtils from '../utils/imageUtils.js';

class PreviewPanel {
    constructor(options = {}) {
        this.uiHelpers = new UIHelpers();
        this.imageUtils = new ImageUtils();
        
        // إعدادات افتراضية
        this.options = {
            container: options.container || 'preview-section',
            showZoom: options.showZoom !== false,
            showInfo: options.showInfo !== false,
            showComparison: options.showComparison !== false,
            maxZoom: options.maxZoom || 3,
            minZoom: options.minZoom || 0.1,
            zoomStep: options.zoomStep || 0.1,
            ...options
        };

        this.currentImages = {
            original: null,
            processed: null
        };

        this.viewState = {
            zoom: 1,
            rotation: 0,
            position: { x: 0, y: 0 },
            isDragging: false,
            lastMousePos: { x: 0, y: 0 },
            viewMode: 'single' // single, split, overlay
        };

        this.isInitialized = false;
    }

    /**
     * تهيئة لوحة المعاينة
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
        this.isInitialized = true;
    }

    /**
     * إنشاء واجهة لوحة المعاينة
     */
    createInterface() {
        const container = document.getElementById(this.options.container);
        if (!container) return;

        container.innerHTML = `
            <div class="preview-panel">
                <!-- شريط الأدوات -->
                <div class="preview-toolbar">
                    <div class="toolbar-section">
                        <h4><i class="fas fa-eye"></i> المعاينة</h4>
                    </div>
                    
                    ${this.options.showComparison ? `
                        <div class="toolbar-section view-modes">
                            <label>وضع العرض:</label>
                            <div class="view-mode-buttons">
                                <button class="btn btn-sm view-mode-btn active" data-mode="single">
                                    <i class="fas fa-image"></i>
                                    واحدة
                                </button>
                                <button class="btn btn-sm view-mode-btn" data-mode="split">
                                    <i class="fas fa-columns"></i>
                                    مقارنة
                                </button>
                                <button class="btn btn-sm view-mode-btn" data-mode="overlay">
                                    <i class="fas fa-layer-group"></i>
                                    تراكب
                                </button>
                            </div>
                        </div>
                    ` : ''}

                    ${this.options.showZoom ? `
                        <div class="toolbar-section zoom-controls">
                            <label>التكبير:</label>
                            <div class="zoom-buttons">
                                <button class="btn btn-sm zoom-out-btn" title="تصغير">
                                    <i class="fas fa-search-minus"></i>
                                </button>
                                <span class="zoom-value">100%</span>
                                <button class="btn btn-sm zoom-in-btn" title="تكبير">
                                    <i class="fas fa-search-plus"></i>
                                </button>
                                <button class="btn btn-sm zoom-fit-btn" title="ملائمة">
                                    <i class="fas fa-expand-arrows-alt"></i>
                                </button>
                                <button class="btn btn-sm zoom-reset-btn" title="إعادة تعيين">
                                    <i class="fas fa-undo"></i>
                                </button>
                            </div>
                        </div>
                    ` : ''}

                    <div class="toolbar-section actions">
                        <button class="btn btn-sm btn-outline fullscreen-btn" title="ملء الشاشة">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="btn btn-sm btn-outline download-preview-btn" title="تحميل المعاينة">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>

                <!-- منطقة المعاينة -->
                <div class="preview-viewport" id="preview-viewport">
                    <!-- المعاينة المفردة -->
                    <div class="preview-container single-view active" id="single-preview">
                        <div class="image-container">
                            <canvas class="preview-canvas" id="preview-canvas"></canvas>
                            <div class="preview-placeholder" id="preview-placeholder">
                                <i class="fas fa-image"></i>
                                <p>لا توجد صورة للمعاينة</p>
                            </div>
                        </div>
                    </div>

                    <!-- المعاينة المقسمة -->
                    <div class="preview-container split-view" id="split-preview">
                        <div class="split-pane original-pane">
                            <div class="pane-header">
                                <h5><i class="fas fa-image"></i> الأصلية</h5>
                            </div>
                            <div class="image-container">
                                <canvas class="preview-canvas" id="original-canvas"></canvas>
                                <div class="preview-placeholder">
                                    <i class="fas fa-image"></i>
                                    <p>الصورة الأصلية</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="split-divider"></div>
                        
                        <div class="split-pane processed-pane">
                            <div class="pane-header">
                                <h5><i class="fas fa-magic"></i> المعالجة</h5>
                            </div>
                            <div class="image-container">
                                <canvas class="preview-canvas" id="processed-canvas"></canvas>
                                <div class="preview-placeholder">
                                    <i class="fas fa-magic"></i>
                                    <p>الصورة المعالجة</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- المعاينة المتراكبة -->
                    <div class="preview-container overlay-view" id="overlay-preview">
                        <div class="overlay-container">
                            <canvas class="preview-canvas original-layer" id="overlay-original"></canvas>
                            <canvas class="preview-canvas processed-layer" id="overlay-processed"></canvas>
                            <div class="overlay-controls">
                                <label>شفافية المعالجة:</label>
                                <input type="range" class="opacity-slider" min="0" max="100" value="50">
                                <span class="opacity-value">50%</span>
                            </div>
                        </div>
                    </div>

                    <!-- أدوات المعاينة المتقدمة -->
                    <div class="preview-tools" id="preview-tools" style="display: none;">
                        <div class="tool-item">
                            <button class="btn btn-sm tool-btn" data-tool="crop">
                                <i class="fas fa-crop"></i>
                                قص
                            </button>
                        </div>
                        <div class="tool-item">
                            <button class="btn btn-sm tool-btn" data-tool="rotate">
                                <i class="fas fa-redo"></i>
                                دوران
                            </button>
                        </div>
                        <div class="tool-item">
                            <button class="btn btn-sm tool-btn" data-tool="flip-h">
                                <i class="fas fa-arrows-alt-h"></i>
                                قلب أفقي
                            </button>
                        </div>
                        <div class="tool-item">
                            <button class="btn btn-sm tool-btn" data-tool="flip-v">
                                <i class="fas fa-arrows-alt-v"></i>
                                قلب عمودي
                            </button>
                        </div>
                    </div>
                </div>

                ${this.options.showInfo ? `
                    <!-- معلومات الصورة -->
                    <div class="preview-info" id="preview-info">
                        <div class="info-tabs">
                            <button class="info-tab active" data-tab="details">التفاصيل</button>
                            <button class="info-tab" data-tab="histogram">الرسم البياني</button>
                            <button class="info-tab" data-tab="metadata">البيانات الوصفية</button>
                        </div>
                        
                        <div class="info-content">
                            <!-- تفاصيل الصورة -->
                            <div class="info-panel active" id="details-panel">
                                <div class="info-grid">
                                    <div class="info-item">
                                        <label>الأبعاد:</label>
                                        <span id="image-dimensions">-</span>
                                    </div>
                                    <div class="info-item">
                                        <label>الحجم:</label>
                                        <span id="image-size">-</span>
                                    </div>
                                    <div class="info-item">
                                        <label>النوع:</label>
                                        <span id="image-type">-</span>
                                    </div>
                                    <div class="info-item">
                                        <label>نسبة العرض للارتفاع:</label>
                                        <span id="image-ratio">-</span>
                                    </div>
                                    <div class="info-item">
                                        <label>عدد البكسل:</label>
                                        <span id="pixel-count">-</span>
                                    </div>
                                    <div class="info-item">
                                        <label>الدقة المقدرة:</label>
                                        <span id="estimated-dpi">-</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- الرسم البياني -->
                            <div class="info-panel" id="histogram-panel">
                                <canvas id="histogram-canvas" width="300" height="200"></canvas>
                                <div class="histogram-controls">
                                    <label>
                                        <input type="checkbox" checked> الأحمر
                                    </label>
                                    <label>
                                        <input type="checkbox" checked> الأخضر
                                    </label>
                                    <label>
                                        <input type="checkbox" checked> الأزرق
                                    </label>
                                    <label>
                                        <input type="checkbox" checked> الإضاءة
                                    </label>
                                </div>
                            </div>
                            
                            <!-- البيانات الوصفية -->
                            <div class="info-panel" id="metadata-panel">
                                <div id="metadata-content">
                                    <p>لا توجد بيانات وصفية متاحة</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- مؤشر التحميل -->
                <div class="preview-loading" id="preview-loading" style="display: none;">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>جاري تحميل المعاينة...</p>
                    </div>
                </div>
            </div>
        `;

        this.initializeCanvases();
    }

    /**
     * تهيئة canvas elements
     */
    initializeCanvases() {
        this.canvases = {
            preview: document.getElementById('preview-canvas'),
            original: document.getElementById('original-canvas'),
            processed: document.getElementById('processed-canvas'),
            overlayOriginal: document.getElementById('overlay-original'),
            overlayProcessed: document.getElementById('overlay-processed'),
            histogram: document.getElementById('histogram-canvas')
        };

        // إعداد السياقات
        Object.keys(this.canvases).forEach(key => {
            if (this.canvases[key]) {
                this.canvases[key].getContext('2d').imageSmoothingEnabled = true;
                this.canvases[key].getContext('2d').imageSmoothingQuality = 'high';
            }
        });
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // أوضاع العرض
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.setViewMode(mode);
            });
        });

        // أدوات التكبير
        document.querySelector('.zoom-in-btn')?.addEventListener('click', () => this.zoomIn());
        document.querySelector('.zoom-out-btn')?.addEventListener('click', () => this.zoomOut());
        document.querySelector('.zoom-fit-btn')?.addEventListener('click', () => this.fitToView());
        document.querySelector('.zoom-reset-btn')?.addEventListener('click', () => this.resetView());

        // ملء الشاشة
        document.querySelector('.fullscreen-btn')?.addEventListener('click', () => this.toggleFullscreen());

        // تحميل المعاينة
        document.querySelector('.download-preview-btn')?.addEventListener('click', () => this.downloadPreview());

        // تحكم الشفافية
        document.querySelector('.opacity-slider')?.addEventListener('input', (e) => {
            this.setOverlayOpacity(e.target.value);
        });

        // تبويبات المعلومات
        document.querySelectorAll('.info-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchInfoTab(e.target.dataset.tab);
            });
        });

        // أحداث الماوس للسحب والتكبير
        this.setupMouseEvents();
        this.setupKeyboardEvents();
    }

    /**
     * إعداد أحداث الماوس
     */
    setupMouseEvents() {
        const viewport = document.getElementById('preview-viewport');
        if (!viewport) return;

        // عجلة الماوس للتكبير
        viewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            this.zoom(delta * this.options.zoomStep);
        });

        // بداية السحب
        viewport.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // زر الماوس الأيسر
                this.viewState.isDragging = true;
                this.viewState.lastMousePos = { x: e.clientX, y: e.clientY };
                viewport.style.cursor = 'grabbing';
            }
        });

        // السحب
        viewport.addEventListener('mousemove', (e) => {
            if (this.viewState.isDragging) {
                const deltaX = e.clientX - this.viewState.lastMousePos.x;
                const deltaY = e.clientY - this.viewState.lastMousePos.y;
                
                this.viewState.position.x += deltaX;
                this.viewState.position.y += deltaY;
                
                this.viewState.lastMousePos = { x: e.clientX, y: e.clientY };
                this.updateViewTransform();
            }
        });

        // نهاية السحب
        viewport.addEventListener('mouseup', () => {
            this.viewState.isDragging = false;
            viewport.style.cursor = 'default';
        });

        viewport.addEventListener('mouseleave', () => {
            this.viewState.isDragging = false;
            viewport.style.cursor = 'default';
        });
    }

    /**
     * إعداد أحداث لوحة المفاتيح
     */
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.isInitialized) return;

            switch (e.key) {
                case '+':
                case '=':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    this.resetView();
                    break;
                case 'f':
                case 'F':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.fitToView();
                    }
                    break;
            }
        });
    }

    /**
     * عرض صورة واحدة
     * @param {HTMLImageElement|File|string} image 
     * @param {Object} options 
     */
    async showImage(image, options = {}) {
        try {
            this.showLoading(true);

            let imageElement;
            if (typeof image === 'string') {
                imageElement = await this.imageUtils.loadImageFromUrl(image);
            } else if (image instanceof File) {
                imageElement = await this.imageUtils.loadImage(image);
            } else {
                imageElement = image;
            }

            this.currentImages.original = imageElement;
            this.currentImages.processed = null;

            await this.renderImage(imageElement, this.canvases.preview);
            
            if (this.options.showInfo) {
                this.updateImageInfo(imageElement);
                this.generateHistogram(imageElement);
            }

            this.setViewMode('single');
            this.fitToView();
            
            this.showLoading(false);

        } catch (error) {
            console.error('خطأ في عرض الصورة:', error);
            this.showError('فشل في تحميل الصورة');
            this.showLoading(false);
        }
    }

    /**
     * عرض مقارنة بين صورتين
     * @param {HTMLImageElement} original 
     * @param {HTMLImageElement} processed 
     */
    async showComparison(original, processed) {
        try {
            this.showLoading(true);

            this.currentImages.original = original;
            this.currentImages.processed = processed;

            // رسم الصور في canvas المناسب
            await this.renderImage(original, this.canvases.original);
            await this.renderImage(processed, this.canvases.processed);
            
            // إعداد العرض المتراكب
            await this.renderImage(original, this.canvases.overlayOriginal);
            await this.renderImage(processed, this.canvases.overlayProcessed);

            if (this.options.showInfo) {
                this.updateImageInfo(processed); // عرض معلومات الصورة المعالجة
                this.generateHistogram(processed);
            }

            this.setViewMode('split');
            this.fitToView();
            
            this.showLoading(false);

        } catch (error) {
            console.error('خطأ في عرض المقارنة:', error);
            this.showError('فشل في تحميل المقارنة');
            this.showLoading(false);
        }
    }

    /**
     * رسم صورة في canvas
     * @param {HTMLImageElement} image 
     * @param {HTMLCanvasElement} canvas 
     */
    async renderImage(image, canvas) {
        if (!image || !canvas) return;

        const ctx = canvas.getContext('2d');
        
        // تحديد الحجم المناسب
        const maxWidth = canvas.parentElement.clientWidth || 800;
        const maxHeight = canvas.parentElement.clientHeight || 600;
        
        const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;
        
        // مسح canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // رسم الصورة
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // إظهار canvas وإخفاء placeholder
        canvas.style.display = 'block';
        const placeholder = canvas.parentElement.querySelector('.preview-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    }

    /**
     * تحديد وضع العرض
     * @param {string} mode 
     */
    setViewMode(mode) {
        this.viewState.viewMode = mode;

        // تحديث الأزرار
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // تحديث المحتوى
        document.querySelectorAll('.preview-container').forEach(container => {
            container.classList.remove('active');
        });

        const activeContainer = document.getElementById(`${mode}-preview`);
        if (activeContainer) {
            activeContainer.classList.add('active');
        }

        // إعادة ضبط العرض
        this.resetView();
    }

    /**
     * تكبير
     */
    zoomIn() {
        this.zoom(this.options.zoomStep);
    }

    /**
     * تصغير
     */
    zoomOut() {
        this.zoom(-this.options.zoomStep);
    }

    /**
     * تكبير/تصغير
     * @param {number} delta 
     */
    zoom(delta) {
        const newZoom = Math.max(this.options.minZoom, 
                        Math.min(this.options.maxZoom, this.viewState.zoom + delta));
        
        if (newZoom !== this.viewState.zoom) {
            this.viewState.zoom = newZoom;
            this.updateZoomDisplay();
            this.updateViewTransform();
        }
    }

    /**
     * ملائمة للعرض
     */
    fitToView() {
        this.viewState.zoom = 1;
        this.viewState.position = { x: 0, y: 0 };
        this.updateZoomDisplay();
        this.updateViewTransform();
    }

    /**
     * إعادة تعيين العرض
     */
    resetView() {
        this.viewState.zoom = 1;
        this.viewState.rotation = 0;
        this.viewState.position = { x: 0, y: 0 };
        this.updateZoomDisplay();
        this.updateViewTransform();
    }

    /**
     * تحديث عرض التكبير
     */
    updateZoomDisplay() {
        const zoomValue = document.querySelector('.zoom-value');
        if (zoomValue) {
            zoomValue.textContent = Math.round(this.viewState.zoom * 100) + '%';
        }
    }

    /**
     * تحديث تحويل العرض
     */
    updateViewTransform() {
        const containers = document.querySelectorAll('.image-container');
        containers.forEach(container => {
            const transform = `
                translate(${this.viewState.position.x}px, ${this.viewState.position.y}px)
                scale(${this.viewState.zoom})
                rotate(${this.viewState.rotation}deg)
            `;
            container.style.transform = transform;
        });
    }

    /**
     * تحديد شفافية التراكب
     * @param {number} opacity 
     */
    setOverlayOpacity(opacity) {
        const processedLayer = this.canvases.overlayProcessed;
        if (processedLayer) {
            processedLayer.style.opacity = opacity / 100;
        }
        
        const opacityValue = document.querySelector('.opacity-value');
        if (opacityValue) {
            opacityValue.textContent = opacity + '%';
        }
    }

    /**
     * تبديل تبويب المعلومات
     * @param {string} tab 
     */
    switchInfoTab(tab) {
        // تحديث الأزرار
        document.querySelectorAll('.info-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        // تحديث المحتوى
        document.querySelectorAll('.info-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        const activePanel = document.getElementById(`${tab}-panel`);
        if (activePanel) {
            activePanel.classList.add('active');
        }
    }

    /**
     * تحديث معلومات الصورة
     * @param {HTMLImageElement} image 
     */
    updateImageInfo(image) {
        if (!image) return;

        const dimensions = `${image.width} × ${image.height}`;
        const ratio = (image.width / image.height).toFixed(2);
        const pixelCount = (image.width * image.height).toLocaleString();
        
        document.getElementById('image-dimensions').textContent = dimensions;
        document.getElementById('image-ratio').textContent = ratio;
        document.getElementById('pixel-count').textContent = pixelCount;
        document.getElementById('estimated-dpi').textContent = '72 DPI'; // تقديري
    }

    /**
     * إنشاء رسم بياني للألوان
     * @param {HTMLImageElement} image 
     */
    generateHistogram(image) {
        const canvas = this.canvases.histogram;
        if (!canvas || !image) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        // إنشاء canvas مؤقت لتحليل البكسل
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        tempCtx.drawImage(image, 0, 0);

        const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
        const data = imageData.data;

        // حساب الرسم البياني
        const histogram = {
            red: new Array(256).fill(0),
            green: new Array(256).fill(0),
            blue: new Array(256).fill(0),
            luminance: new Array(256).fill(0)
        };

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

            histogram.red[r]++;
            histogram.green[g]++;
            histogram.blue[b]++;
            histogram.luminance[luminance]++;
        }

        // رسم الرسم البياني
        ctx.clearRect(0, 0, width, height);

        const maxValue = Math.max(...histogram.luminance);
        const scale = (height - 20) / maxValue;

        // رسم الخلفية
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);

        // رسم الخطوط
        const drawHistogram = (data, color, alpha = 0.7) => {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();

            for (let i = 0; i < 256; i++) {
                const x = (i / 255) * width;
                const y = height - (data[i] * scale) - 10;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        // رسم الألوان
        drawHistogram(histogram.red, '#ff0000');
        drawHistogram(histogram.green, '#00ff00');
        drawHistogram(histogram.blue, '#0000ff');
        drawHistogram(histogram.luminance, '#000000', 0.5);
    }

    /**
     * تحميل المعاينة
     */
    downloadPreview() {
        const activeCanvas = this.getActiveCanvas();
        if (!activeCanvas) {
            this.uiHelpers.showNotification('لا توجد صورة للتحميل', 'warning');
            return;
        }

        try {
            activeCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `preview-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                this.uiHelpers.showNotification('تم تحميل المعاينة', 'success');
            }, 'image/png');
        } catch (error) {
            this.uiHelpers.showNotification('فشل في تحميل المعاينة', 'error');
        }
    }

    /**
     * الحصول على canvas النشط
     * @returns {HTMLCanvasElement}
     */
    getActiveCanvas() {
        switch (this.viewState.viewMode) {
            case 'single':
                return this.canvases.preview;
            case 'split':
                return this.canvases.processed || this.canvases.original;
            case 'overlay':
                return this.canvases.overlayProcessed;
            default:
                return null;
        }
    }

    /**
     * تبديل ملء الشاشة
     */
    toggleFullscreen() {
        const viewport = document.getElementById('preview-viewport');
        if (!viewport) return;

        if (!document.fullscreenElement) {
            viewport.requestFullscreen().then(() => {
                viewport.classList.add('fullscreen-mode');
            }).catch(err => {
                console.warn('فشل في تفعيل ملء الشاشة:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                viewport.classList.remove('fullscreen-mode');
            });
        }
    }

    /**
     * عرض مؤشر التحميل
     * @param {boolean} show 
     */
    showLoading(show) {
        const loading = document.getElementById('preview-loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * عرض رسالة خطأ
     * @param {string} message 
     */
    showError(message) {
        this.uiHelpers.showNotification(message, 'error');
    }

    /**
     * مسح المعاينة
     */
    clear() {
        // مسح الصور
        this.currentImages.original = null;
        this.currentImages.processed = null;

        // مسح جميع canvas
        Object.values(this.canvases).forEach(canvas => {
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.display = 'none';
            }
        });

        // إظهار placeholders
        document.querySelectorAll('.preview-placeholder').forEach(placeholder => {
            placeholder.style.display = 'flex';
        });

        // إعادة تعيين العرض
        this.resetView();
    }

    /**
     * الحصول على الصورة الحالية
     * @param {string} type - 'original' أو 'processed'
     * @returns {HTMLImageElement|null}
     */
    getCurrentImage(type = 'processed') {
        return this.currentImages[type] || this.currentImages.original;
    }

    /**
     * تحديث الصورة المعالجة
     * @param {HTMLImageElement} processedImage 
     */
    updateProcessedImage(processedImage) {
        this.currentImages.processed = processedImage;
        
        if (this.viewState.viewMode === 'split' || this.viewState.viewMode === 'overlay') {
            this.renderImage(processedImage, this.canvases.processed);
            this.renderImage(processedImage, this.canvases.overlayProcessed);
        } else {
            this.renderImage(processedImage, this.canvases.preview);
        }

        if (this.options.showInfo) {
            this.updateImageInfo(processedImage);
            this.generateHistogram(processedImage);
        }
    }
}

// تصدير الكلاس
export default PreviewPanel;