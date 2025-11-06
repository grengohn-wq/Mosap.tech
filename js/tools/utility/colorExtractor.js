/**
 * Color Extractor Tool
 * أداة استخراج الألوان من الصور مع تحليل متقدم واستخراج اللوحات اللونية
 */

import ImageUtils from '../utils/imageUtils.js';
import UIHelpers from '../utils/uiHelpers.js';

class ColorExtractor {
    constructor() {
        this.imageUtils = new ImageUtils();
        this.uiHelpers = new UIHelpers();
        this.currentImage = null;
        this.canvas = null;
        this.ctx = null;
        this.imageData = null;
        this.extractedColors = [];
        this.colorHistory = [];
        this.extractionMethods = {
            'dominant': 'الألوان المهيمنة',
            'palette': 'لوحة الألوان',
            'average': 'اللون المتوسط',
            'corners': 'ألوان الزوايا',
            'grid': 'شبكة الألوان',
            'histogram': 'مخطط الألوان'
        };
    }

    /**
     * تهيئة أداة استخراج الألوان
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
    }

    /**
     * إنشاء واجهة أداة استخراج الألوان
     */
    createInterface() {
        const controlsSection = document.getElementById('controls-section');
        if (!controlsSection) return;

        controlsSection.innerHTML = `
            <div class="control-panel">
                <div class="control-header">
                    <i class="fas fa-palette"></i>
                    <h3>استخراج الألوان</h3>
                </div>
                
                <div class="control-group">
                    <!-- معاينة الصورة مع اختيار الألوان -->
                    <div class="color-extraction-container">
                        <canvas id="color-canvas" class="color-canvas" style="display: none;"></canvas>
                        <div class="color-placeholder" id="color-placeholder">
                            <i class="fas fa-image"></i>
                            <p>ارفع صورة لاستخراج الألوان</p>
                            <input type="file" id="color-image-input" accept="image/*" style="display: none;">
                            <button class="btn btn-outline" id="select-color-image">
                                <i class="fas fa-upload"></i>
                                اختيار صورة
                            </button>
                        </div>
                        
                        <!-- أداة اختيار اللون -->
                        <div class="color-picker-overlay" id="color-picker-overlay" style="display: none;">
                            <div class="crosshair" id="crosshair"></div>
                            <div class="color-info-tooltip" id="color-info-tooltip">
                                <div class="color-preview" id="tooltip-color-preview"></div>
                                <div class="color-values" id="tooltip-color-values"></div>
                            </div>
                        </div>
                    </div>

                    <!-- طرق الاستخراج -->
                    <div class="control-row">
                        <label class="control-label">طريقة الاستخراج</label>
                        <select id="extraction-method" class="form-select">
                            <option value="dominant">الألوان المهيمنة</option>
                            <option value="palette">لوحة الألوان</option>
                            <option value="average">اللون المتوسط</option>
                            <option value="corners">ألوان الزوايا</option>
                            <option value="grid">شبكة الألوان</option>
                            <option value="histogram">مخطط الألوان</option>
                        </select>
                    </div>

                    <!-- إعدادات الاستخراج -->
                    <div class="extraction-settings">
                        <div class="control-row">
                            <label class="control-label">عدد الألوان المطلوب</label>
                            <div class="control-input-group">
                                <input type="range" id="color-count" class="form-range" 
                                       min="1" max="20" step="1" value="5">
                                <span class="range-value" id="color-count-value">5</span>
                            </div>
                        </div>

                        <div class="control-row">
                            <label class="control-label">دقة التحليل</label>
                            <select id="analysis-quality" class="form-select">
                                <option value="low">منخفضة (سريع)</option>
                                <option value="medium" selected>متوسطة</option>
                                <option value="high">عالية (دقيق)</option>
                            </select>
                        </div>

                        <div class="control-row">
                            <label class="control-label">تجاهل الألوان المتشابهة</label>
                            <input type="checkbox" id="ignore-similar" checked>
                            <div class="similarity-settings" id="similarity-settings">
                                <label>حساسية التشابه:</label>
                                <input type="range" id="similarity-threshold" min="5" max="50" value="20">
                                <span id="similarity-value">20</span>
                            </div>
                        </div>

                        <div class="control-row">
                            <label class="control-label">تصفية الألوان</label>
                            <div class="color-filters">
                                <input type="checkbox" id="exclude-grayscale"> استبعاد الرمادي
                                <input type="checkbox" id="exclude-very-dark"> استبعاد الداكن جداً
                                <input type="checkbox" id="exclude-very-light"> استبعاد الفاتح جداً
                            </div>
                        </div>
                    </div>

                    <!-- أزرار التحكم -->
                    <div class="control-actions">
                        <button id="extract-colors-btn" class="btn btn-primary" disabled>
                            <i class="fas fa-palette"></i>
                            استخراج الألوان
                        </button>
                        
                        <button id="pick-color-btn" class="btn btn-secondary" disabled>
                            <i class="fas fa-eyedropper"></i>
                            اختيار لون
                        </button>
                        
                        <button id="analyze-image-btn" class="btn btn-secondary" disabled>
                            <i class="fas fa-chart-bar"></i>
                            تحليل الصورة
                        </button>
                        
                        <button id="reset-colors-btn" class="btn btn-outline">
                            <i class="fas fa-refresh"></i>
                            إعادة تعيين
                        </button>
                    </div>

                    <!-- نتائج الألوان المستخرجة -->
                    <div class="extracted-colors" id="extracted-colors" style="display: none;">
                        <div class="colors-header">
                            <h4>الألوان المستخرجة</h4>
                            <div class="colors-actions">
                                <button class="btn btn-sm btn-outline" id="export-palette">
                                    <i class="fas fa-file-export"></i>
                                    تصدير اللوحة
                                </button>
                                <button class="btn btn-sm btn-outline" id="copy-all-colors">
                                    <i class="fas fa-copy"></i>
                                    نسخ الكل
                                </button>
                            </div>
                        </div>

                        <div class="color-palette" id="color-palette">
                            <!-- سيتم إنشاؤها ديناميكياً -->
                        </div>

                        <!-- تحليل الألوان -->
                        <div class="color-analysis" id="color-analysis">
                            <div class="analysis-grid">
                                <div class="analysis-item">
                                    <label>اللون المهيمن:</label>
                                    <div class="dominant-color-display">
                                        <div class="color-swatch" id="dominant-color-swatch"></div>
                                        <span id="dominant-color-value">-</span>
                                    </div>
                                </div>
                                <div class="analysis-item">
                                    <label>الحرارة العامة:</label>
                                    <span id="color-temperature">-</span>
                                </div>
                                <div class="analysis-item">
                                    <label>السطوع المتوسط:</label>
                                    <span id="average-brightness">-</span>
                                </div>
                                <div class="analysis-item">
                                    <label>التشبع المتوسط:</label>
                                    <span id="average-saturation">-</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- مخطط توزيع الألوان -->
                    <div class="color-histogram" id="color-histogram" style="display: none;">
                        <h4>مخطط توزيع الألوان</h4>
                        <canvas id="histogram-canvas" width="300" height="150"></canvas>
                        <div class="histogram-controls">
                            <button class="histogram-channel active" data-channel="rgb">RGB</button>
                            <button class="histogram-channel" data-channel="red">أحمر</button>
                            <button class="histogram-channel" data-channel="green">أخضر</button>
                            <button class="histogram-channel" data-channel="blue">أزرق</button>
                        </div>
                    </div>

                    <!-- سجل الألوان -->
                    <details class="color-history">
                        <summary>سجل الألوان</summary>
                        <div class="history-colors" id="history-colors">
                            <p class="empty-history">لا يوجد ألوان محفوظة</p>
                        </div>
                        <div class="history-actions">
                            <button class="btn btn-sm btn-outline" id="clear-color-history">
                                <i class="fas fa-trash"></i>
                                مسح السجل
                            </button>
                            <button class="btn btn-sm btn-outline" id="export-color-history">
                                <i class="fas fa-file-export"></i>
                                تصدير السجل
                            </button>
                        </div>
                    </details>

                    <!-- معلومات إضافية -->
                    <details class="color-info-section">
                        <summary>نصائح حول الألوان</summary>
                        <div class="info-content">
                            <h5>طرق الاستخراج:</h5>
                            <ul>
                                <li><strong>الألوان المهيمنة:</strong> يستخرج الألوان الأكثر ظهوراً في الصورة</li>
                                <li><strong>لوحة الألوان:</strong> ينشئ لوحة متوازنة من الألوان المختلفة</li>
                                <li><strong>اللون المتوسط:</strong> يحسب اللون المتوسط للصورة كاملة</li>
                                <li><strong>ألوان الزوايا:</strong> يستخرج الألوان من زوايا الصورة</li>
                                <li><strong>شبكة الألوان:</strong> يقسم الصورة إلى شبكة ويستخرج لون كل خلية</li>
                            </ul>

                            <h5>نصائح للاستخدام:</h5>
                            <ul>
                                <li>استخدم دقة عالية للصور المعقدة</li>
                                <li>قم بتصفية الألوان المتشابهة للحصول على نتائج أوضح</li>
                                <li>جرب طرق استخراج مختلفة للحصول على نتائج متنوعة</li>
                                <li>استخدم أداة اختيار اللون للحصول على ألوان محددة</li>
                            </ul>
                        </div>
                    </details>
                </div>
            </div>
        `;

        this.setupCanvas();
        this.setupDragAndDrop();
    }

    /**
     * إعداد اللوحة
     */
    setupCanvas() {
        this.canvas = document.getElementById('color-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    /**
     * إعداد السحب والإفلات
     */
    setupDragAndDrop() {
        const placeholder = document.getElementById('color-placeholder');
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
        // رفع الصورة
        document.getElementById('select-color-image')?.addEventListener('click', () => {
            document.getElementById('color-image-input').click();
        });

        document.getElementById('color-image-input')?.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadImage(e.target.files[0]);
            }
        });

        // إعدادات الاستخراج
        document.getElementById('color-count')?.addEventListener('input', (e) => {
            document.getElementById('color-count-value').textContent = e.target.value;
        });

        document.getElementById('ignore-similar')?.addEventListener('change', (e) => {
            const settings = document.getElementById('similarity-settings');
            settings.style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('similarity-threshold')?.addEventListener('input', (e) => {
            document.getElementById('similarity-value').textContent = e.target.value;
        });

        // أزرار التحكم
        document.getElementById('extract-colors-btn')?.addEventListener('click', () => {
            this.extractColors();
        });

        document.getElementById('pick-color-btn')?.addEventListener('click', () => {
            this.toggleColorPicker();
        });

        document.getElementById('analyze-image-btn')?.addEventListener('click', () => {
            this.analyzeImage();
        });

        document.getElementById('reset-colors-btn')?.addEventListener('click', () => {
            this.reset();
        });

        // اختيار الألوان من الصورة
        this.setupColorPickerEvents();

        // أزرار الألوان المستخرجة
        document.getElementById('export-palette')?.addEventListener('click', () => {
            this.exportPalette();
        });

        document.getElementById('copy-all-colors')?.addEventListener('click', () => {
            this.copyAllColors();
        });

        // مخطط الألوان
        this.setupHistogramEvents();

        // سجل الألوان
        document.getElementById('clear-color-history')?.addEventListener('click', () => {
            this.clearColorHistory();
        });

        document.getElementById('export-color-history')?.addEventListener('click', () => {
            this.exportColorHistory();
        });
    }

    /**
     * إعداد أحداث اختيار الألوان
     */
    setupColorPickerEvents() {
        this.canvas?.addEventListener('mousemove', (e) => {
            if (this.colorPickerActive) {
                this.updateColorPicker(e);
            }
        });

        this.canvas?.addEventListener('click', (e) => {
            if (this.colorPickerActive) {
                this.pickColorAtPosition(e);
            }
        });

        this.canvas?.addEventListener('mouseleave', () => {
            if (this.colorPickerActive) {
                this.hideColorPicker();
            }
        });
    }

    /**
     * إعداد أحداث مخطط الألوان
     */
    setupHistogramEvents() {
        document.querySelectorAll('.histogram-channel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.histogram-channel').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.drawHistogram(e.target.dataset.channel);
            });
        });
    }

    /**
     * تحميل صورة
     * @param {File} file 
     */
    async loadImage(file) {
        try {
            this.uiHelpers.showLoading('جاري تحميل الصورة...');

            this.currentImage = await this.imageUtils.loadImage(file);
            this.setupCanvasForImage();
            this.drawImage();
            this.getImageData();
            this.enableControls();
            
            // إخفاء placeholder وإظهار canvas
            document.getElementById('color-placeholder').style.display = 'none';
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
        const maxHeight = 400;

        // حساب المقياس
        const scaleX = maxWidth / this.currentImage.width;
        const scaleY = maxHeight / this.currentImage.height;
        const scale = Math.min(scaleX, scaleY, 1);

        // تعيين أبعاد اللوحة
        this.canvas.width = this.currentImage.width * scale;
        this.canvas.height = this.currentImage.height * scale;
        
        this.scale = scale;
    }

    /**
     * رسم الصورة
     */
    drawImage() {
        if (!this.currentImage || !this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * الحصول على بيانات الصورة
     */
    getImageData() {
        this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * استخراج الألوان
     */
    async extractColors() {
        if (!this.imageData) return;

        try {
            this.uiHelpers.showLoading('جاري استخراج الألوان...');

            const method = document.getElementById('extraction-method').value;
            const colorCount = parseInt(document.getElementById('color-count').value);
            const quality = document.getElementById('analysis-quality').value;

            let colors = [];

            switch (method) {
                case 'dominant':
                    colors = this.extractDominantColors(colorCount, quality);
                    break;
                case 'palette':
                    colors = this.extractColorPalette(colorCount, quality);
                    break;
                case 'average':
                    colors = [this.calculateAverageColor()];
                    break;
                case 'corners':
                    colors = this.extractCornerColors();
                    break;
                case 'grid':
                    colors = this.extractGridColors(colorCount);
                    break;
                case 'histogram':
                    colors = this.extractFromHistogram(colorCount);
                    break;
            }

            // تطبيق مرشحات الألوان
            colors = this.applyColorFilters(colors);

            // إزالة الألوان المتشابهة إذا كانت مطلوبة
            if (document.getElementById('ignore-similar').checked) {
                colors = this.removeSimilarColors(colors);
            }

            this.extractedColors = colors;
            this.displayExtractedColors(colors);
            this.analyzeExtractedColors(colors);

            this.uiHelpers.hideLoading();

        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في استخراج الألوان: ' + error.message, 'error');
        }
    }

    /**
     * استخراج الألوان المهيمنة
     * @param {number} count 
     * @param {string} quality 
     * @returns {Array}
     */
    extractDominantColors(count, quality) {
        const step = this.getQualityStep(quality);
        const colorMap = new Map();

        // عد تكرار الألوان
        for (let i = 0; i < this.imageData.data.length; i += 4 * step) {
            const r = this.imageData.data[i];
            const g = this.imageData.data[i + 1];
            const b = this.imageData.data[i + 2];
            const a = this.imageData.data[i + 3];

            if (a < 128) continue; // تجاهل البكسلات الشفافة

            // تقريب الألوان لتجميع المتشابهة
            const roundedR = Math.round(r / 16) * 16;
            const roundedG = Math.round(g / 16) * 16;
            const roundedB = Math.round(b / 16) * 16;

            const colorKey = `${roundedR},${roundedG},${roundedB}`;
            colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
        }

        // ترتيب حسب التكرار
        const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([colorKey]) => {
                const [r, g, b] = colorKey.split(',').map(Number);
                return { r, g, b };
            });

        return sortedColors;
    }

    /**
     * استخراج لوحة الألوان
     * @param {number} count 
     * @param {string} quality 
     * @returns {Array}
     */
    extractColorPalette(count, quality) {
        // استخدام خوارزمية K-means لإنشاء لوحة متوازنة
        return this.kMeansColors(count, quality);
    }

    /**
     * خوارزمية K-means لتجميع الألوان
     * @param {number} k 
     * @param {string} quality 
     * @returns {Array}
     */
    kMeansColors(k, quality) {
        const step = this.getQualityStep(quality);
        const pixels = [];

        // جمع عينات من البكسلات
        for (let i = 0; i < this.imageData.data.length; i += 4 * step) {
            const r = this.imageData.data[i];
            const g = this.imageData.data[i + 1];
            const b = this.imageData.data[i + 2];
            const a = this.imageData.data[i + 3];

            if (a > 128) {
                pixels.push({ r, g, b });
            }
        }

        if (pixels.length === 0) return [];

        // تهيئة المراكز عشوائياً
        let centroids = [];
        for (let i = 0; i < k; i++) {
            const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
            centroids.push({ ...randomPixel });
        }

        // تكرار K-means
        for (let iteration = 0; iteration < 20; iteration++) {
            const clusters = Array(k).fill().map(() => []);

            // تجميع البكسلات حول أقرب مركز
            pixels.forEach(pixel => {
                let minDistance = Infinity;
                let closestCentroid = 0;

                centroids.forEach((centroid, index) => {
                    const distance = this.colorDistance(pixel, centroid);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCentroid = index;
                    }
                });

                clusters[closestCentroid].push(pixel);
            });

            // تحديث المراكز
            const newCentroids = clusters.map(cluster => {
                if (cluster.length === 0) return centroids[0]; // منع المجموعات الفارغة

                const sum = cluster.reduce((acc, pixel) => ({
                    r: acc.r + pixel.r,
                    g: acc.g + pixel.g,
                    b: acc.b + pixel.b
                }), { r: 0, g: 0, b: 0 });

                return {
                    r: Math.round(sum.r / cluster.length),
                    g: Math.round(sum.g / cluster.length),
                    b: Math.round(sum.b / cluster.length)
                };
            });

            // فحص التقارب
            const converged = centroids.every((centroid, index) => {
                const newCentroid = newCentroids[index];
                return this.colorDistance(centroid, newCentroid) < 5;
            });

            centroids = newCentroids;

            if (converged) break;
        }

        return centroids;
    }

    /**
     * حساب اللون المتوسط
     * @returns {Object}
     */
    calculateAverageColor() {
        let totalR = 0, totalG = 0, totalB = 0, count = 0;

        for (let i = 0; i < this.imageData.data.length; i += 4) {
            const a = this.imageData.data[i + 3];
            if (a > 128) {
                totalR += this.imageData.data[i];
                totalG += this.imageData.data[i + 1];
                totalB += this.imageData.data[i + 2];
                count++;
            }
        }

        return {
            r: Math.round(totalR / count),
            g: Math.round(totalG / count),
            b: Math.round(totalB / count)
        };
    }

    /**
     * استخراج ألوان الزوايا
     * @returns {Array}
     */
    extractCornerColors() {
        const corners = [
            { x: 0, y: 0 }, // أعلى يسار
            { x: this.canvas.width - 1, y: 0 }, // أعلى يمين
            { x: 0, y: this.canvas.height - 1 }, // أسفل يسار
            { x: this.canvas.width - 1, y: this.canvas.height - 1 } // أسفل يمين
        ];

        return corners.map(corner => {
            const index = (corner.y * this.canvas.width + corner.x) * 4;
            return {
                r: this.imageData.data[index],
                g: this.imageData.data[index + 1],
                b: this.imageData.data[index + 2]
            };
        });
    }

    /**
     * استخراج ألوان الشبكة
     * @param {number} count 
     * @returns {Array}
     */
    extractGridColors(count) {
        const gridSize = Math.ceil(Math.sqrt(count));
        const colors = [];
        
        const stepX = Math.floor(this.canvas.width / gridSize);
        const stepY = Math.floor(this.canvas.height / gridSize);

        for (let y = 0; y < gridSize && colors.length < count; y++) {
            for (let x = 0; x < gridSize && colors.length < count; x++) {
                const centerX = Math.floor(x * stepX + stepX / 2);
                const centerY = Math.floor(y * stepY + stepY / 2);
                
                const index = (centerY * this.canvas.width + centerX) * 4;
                colors.push({
                    r: this.imageData.data[index],
                    g: this.imageData.data[index + 1],
                    b: this.imageData.data[index + 2]
                });
            }
        }

        return colors;
    }

    /**
     * استخراج من مخطط الألوان
     * @param {number} count 
     * @returns {Array}
     */
    extractFromHistogram(count) {
        const histogram = this.calculateHistogram();
        const peakColors = [];

        // العثور على القمم في المخطط
        Object.entries(histogram).forEach(([color, frequency]) => {
            const [r, g, b] = color.split(',').map(Number);
            peakColors.push({ r, g, b, frequency });
        });

        return peakColors
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, count)
            .map(({ r, g, b }) => ({ r, g, b }));
    }

    /**
     * حساب مخطط الألوان
     * @returns {Object}
     */
    calculateHistogram() {
        const histogram = {};

        for (let i = 0; i < this.imageData.data.length; i += 4) {
            const r = Math.round(this.imageData.data[i] / 32) * 32;
            const g = Math.round(this.imageData.data[i + 1] / 32) * 32;
            const b = Math.round(this.imageData.data[i + 2] / 32) * 32;
            const a = this.imageData.data[i + 3];

            if (a > 128) {
                const key = `${r},${g},${b}`;
                histogram[key] = (histogram[key] || 0) + 1;
            }
        }

        return histogram;
    }

    /**
     * تطبيق مرشحات الألوان
     * @param {Array} colors 
     * @returns {Array}
     */
    applyColorFilters(colors) {
        let filteredColors = [...colors];

        if (document.getElementById('exclude-grayscale').checked) {
            filteredColors = filteredColors.filter(color => !this.isGrayscale(color));
        }

        if (document.getElementById('exclude-very-dark').checked) {
            filteredColors = filteredColors.filter(color => this.getBrightness(color) > 30);
        }

        if (document.getElementById('exclude-very-light').checked) {
            filteredColors = filteredColors.filter(color => this.getBrightness(color) < 225);
        }

        return filteredColors;
    }

    /**
     * إزالة الألوان المتشابهة
     * @param {Array} colors 
     * @returns {Array}
     */
    removeSimilarColors(colors) {
        const threshold = parseInt(document.getElementById('similarity-threshold').value);
        const uniqueColors = [];

        colors.forEach(color => {
            const isSimilar = uniqueColors.some(uniqueColor => 
                this.colorDistance(color, uniqueColor) < threshold
            );

            if (!isSimilar) {
                uniqueColors.push(color);
            }
        });

        return uniqueColors;
    }

    /**
     * حساب المسافة بين لونين
     * @param {Object} color1 
     * @param {Object} color2 
     * @returns {number}
     */
    colorDistance(color1, color2) {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    /**
     * فحص ما إذا كان اللون رمادي
     * @param {Object} color 
     * @returns {boolean}
     */
    isGrayscale(color) {
        const threshold = 15;
        return Math.abs(color.r - color.g) < threshold && 
               Math.abs(color.g - color.b) < threshold && 
               Math.abs(color.r - color.b) < threshold;
    }

    /**
     * حساب سطوع اللون
     * @param {Object} color 
     * @returns {number}
     */
    getBrightness(color) {
        return (color.r * 0.299 + color.g * 0.587 + color.b * 0.114);
    }

    /**
     * الحصول على خطوة الجودة
     * @param {string} quality 
     * @returns {number}
     */
    getQualityStep(quality) {
        switch (quality) {
            case 'low': return 8;
            case 'medium': return 4;
            case 'high': return 1;
            default: return 4;
        }
    }

    /**
     * عرض الألوان المستخرجة
     * @param {Array} colors 
     */
    displayExtractedColors(colors) {
        const palette = document.getElementById('color-palette');
        if (!palette) return;

        palette.innerHTML = colors.map((color, index) => {
            const hex = this.rgbToHex(color.r, color.g, color.b);
            const hsl = this.rgbToHsl(color.r, color.g, color.b);
            
            return `
                <div class="color-item" data-color="${hex}">
                    <div class="color-swatch" style="background-color: ${hex}"></div>
                    <div class="color-info">
                        <div class="color-formats">
                            <div class="color-format">
                                <label>HEX:</label>
                                <span class="color-value selectable">${hex}</span>
                            </div>
                            <div class="color-format">
                                <label>RGB:</label>
                                <span class="color-value selectable">rgb(${color.r}, ${color.g}, ${color.b})</span>
                            </div>
                            <div class="color-format">
                                <label>HSL:</label>
                                <span class="color-value selectable">hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)</span>
                            </div>
                        </div>
                        <div class="color-actions">
                            <button class="btn btn-xs btn-outline copy-color" data-color="${hex}" title="نسخ HEX">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="btn btn-xs btn-outline save-color" data-color="${hex}" title="حفظ">
                                <i class="fas fa-bookmark"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // إضافة مستمعي الأحداث لأزرار الألوان
        this.setupColorItemEvents();

        document.getElementById('extracted-colors').style.display = 'block';
    }

    /**
     * إعداد أحداث عناصر الألوان
     */
    setupColorItemEvents() {
        // نسخ الألوان
        document.querySelectorAll('.copy-color').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const color = e.target.closest('.copy-color').dataset.color;
                try {
                    await navigator.clipboard.writeText(color);
                    this.uiHelpers.showNotification(`تم نسخ ${color}`, 'success');
                } catch {
                    this.uiHelpers.showNotification('فشل في النسخ', 'error');
                }
            });
        });

        // حفظ الألوان
        document.querySelectorAll('.save-color').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.closest('.save-color').dataset.color;
                this.saveColorToHistory(color);
            });
        });

        // نسخ النص القابل للتحديد
        document.querySelectorAll('.color-value.selectable').forEach(span => {
            span.addEventListener('click', async (e) => {
                try {
                    await navigator.clipboard.writeText(e.target.textContent);
                    this.uiHelpers.showNotification('تم نسخ القيمة', 'success');
                } catch {
                    this.uiHelpers.showNotification('فشل في النسخ', 'error');
                }
            });
        });
    }

    /**
     * تحليل الألوان المستخرجة
     * @param {Array} colors 
     */
    analyzeExtractedColors(colors) {
        if (colors.length === 0) return;

        // اللون المهيمن (الأول في القائمة)
        const dominantColor = colors[0];
        const dominantHex = this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);
        
        document.getElementById('dominant-color-swatch').style.backgroundColor = dominantHex;
        document.getElementById('dominant-color-value').textContent = dominantHex;

        // حساب الحرارة العامة
        const avgTemp = this.calculateAverageTemperature(colors);
        document.getElementById('color-temperature').textContent = 
            avgTemp > 0 ? 'دافئة' : avgTemp < 0 ? 'باردة' : 'متعادلة';

        // السطوع المتوسط
        const avgBrightness = colors.reduce((sum, color) => 
            sum + this.getBrightness(color), 0) / colors.length;
        document.getElementById('average-brightness').textContent = 
            `${Math.round(avgBrightness)} (${Math.round(avgBrightness / 255 * 100)}%)`;

        // التشبع المتوسط
        const avgSaturation = colors.reduce((sum, color) => {
            const hsl = this.rgbToHsl(color.r, color.g, color.b);
            return sum + hsl.s;
        }, 0) / colors.length;
        document.getElementById('average-saturation').textContent = `${Math.round(avgSaturation)}%`;
    }

    /**
     * حساب الحرارة المتوسطة للألوان
     * @param {Array} colors 
     * @returns {number}
     */
    calculateAverageTemperature(colors) {
        return colors.reduce((sum, color) => {
            // حساب مؤشر الحرارة (الأحمر والأصفر = دافئ، الأزرق = بارد)
            const warmth = (color.r + color.g * 0.5) - color.b;
            return sum + warmth;
        }, 0) / colors.length;
    }

    /**
     * تبديل أداة اختيار الألوان
     */
    toggleColorPicker() {
        this.colorPickerActive = !this.colorPickerActive;
        const btn = document.getElementById('pick-color-btn');
        
        if (this.colorPickerActive) {
            btn.textContent = 'إلغاء الاختيار';
            btn.classList.add('active');
            this.canvas.style.cursor = 'crosshair';
            document.getElementById('color-picker-overlay').style.display = 'block';
        } else {
            btn.textContent = 'اختيار لون';
            btn.classList.remove('active');
            this.canvas.style.cursor = 'default';
            this.hideColorPicker();
        }
    }

    /**
     * تحديث اختيار الألوان
     * @param {MouseEvent} e 
     */
    updateColorPicker(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);

        if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) return;

        const index = (y * this.canvas.width + x) * 4;
        const r = this.imageData.data[index];
        const g = this.imageData.data[index + 1];
        const b = this.imageData.data[index + 2];

        // تحديث الشعيرة المتقاطعة
        const crosshair = document.getElementById('crosshair');
        crosshair.style.left = (e.clientX - rect.left) + 'px';
        crosshair.style.top = (e.clientY - rect.top) + 'px';

        // تحديث معلومات اللون
        const hex = this.rgbToHex(r, g, b);
        document.getElementById('tooltip-color-preview').style.backgroundColor = hex;
        document.getElementById('tooltip-color-values').innerHTML = `
            <div>HEX: ${hex}</div>
            <div>RGB: (${r}, ${g}, ${b})</div>
        `;

        // تحديث موقع التلميح
        const tooltip = document.getElementById('color-info-tooltip');
        tooltip.style.left = (e.clientX - rect.left + 20) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 60) + 'px';
        tooltip.style.display = 'block';
    }

    /**
     * اختيار لون في موضع محدد
     * @param {MouseEvent} e 
     */
    pickColorAtPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);

        const index = (y * this.canvas.width + x) * 4;
        const r = this.imageData.data[index];
        const g = this.imageData.data[index + 1];
        const b = this.imageData.data[index + 2];

        const hex = this.rgbToHex(r, g, b);
        
        // إضافة اللون إلى القائمة
        this.extractedColors.unshift({ r, g, b });
        this.displayExtractedColors(this.extractedColors);
        
        this.saveColorToHistory(hex);
        this.uiHelpers.showNotification(`تم اختيار اللون ${hex}`, 'success');
    }

    /**
     * إخفاء اختيار الألوان
     */
    hideColorPicker() {
        document.getElementById('color-picker-overlay').style.display = 'none';
        document.getElementById('color-info-tooltip').style.display = 'none';
    }

    /**
     * تحليل الصورة
     */
    analyzeImage() {
        this.drawHistogram('rgb');
        document.getElementById('color-histogram').style.display = 'block';
    }

    /**
     * رسم مخطط الألوان
     * @param {string} channel 
     */
    drawHistogram(channel) {
        const histogramCanvas = document.getElementById('histogram-canvas');
        const histogramCtx = histogramCanvas.getContext('2d');
        
        const width = histogramCanvas.width;
        const height = histogramCanvas.height;

        histogramCtx.clearRect(0, 0, width, height);

        // حساب المخطط
        const histogramData = this.calculateChannelHistogram(channel);
        const maxValue = Math.max(...histogramData);

        // رسم المخطط
        const barWidth = width / histogramData.length;

        histogramData.forEach((value, index) => {
            const barHeight = (value / maxValue) * height * 0.8;
            const x = index * barWidth;
            const y = height - barHeight;

            // تحديد لون الشريط
            let color;
            switch (channel) {
                case 'red': color = `rgb(${index}, 0, 0)`; break;
                case 'green': color = `rgb(0, ${index}, 0)`; break;
                case 'blue': color = `rgb(0, 0, ${index})`; break;
                default: color = `rgb(${index}, ${index}, ${index})`;
            }

            histogramCtx.fillStyle = color;
            histogramCtx.fillRect(x, y, barWidth - 1, barHeight);
        });

        // رسم المحاور
        histogramCtx.strokeStyle = '#666';
        histogramCtx.lineWidth = 1;
        histogramCtx.beginPath();
        histogramCtx.moveTo(0, height);
        histogramCtx.lineTo(width, height);
        histogramCtx.stroke();
    }

    /**
     * حساب مخطط قناة محددة
     * @param {string} channel 
     * @returns {Array}
     */
    calculateChannelHistogram(channel) {
        const histogram = new Array(256).fill(0);

        for (let i = 0; i < this.imageData.data.length; i += 4) {
            const a = this.imageData.data[i + 3];
            if (a < 128) continue;

            let value;
            switch (channel) {
                case 'red': value = this.imageData.data[i]; break;
                case 'green': value = this.imageData.data[i + 1]; break;
                case 'blue': value = this.imageData.data[i + 2]; break;
                default: // RGB average
                    value = Math.round((this.imageData.data[i] + 
                                     this.imageData.data[i + 1] + 
                                     this.imageData.data[i + 2]) / 3);
            }

            histogram[value]++;
        }

        return histogram;
    }

    /**
     * نسخ جميع الألوان
     */
    async copyAllColors() {
        const hexColors = this.extractedColors.map(color => 
            this.rgbToHex(color.r, color.g, color.b)
        );
        
        try {
            await navigator.clipboard.writeText(hexColors.join(', '));
            this.uiHelpers.showNotification('تم نسخ جميع الألوان', 'success');
        } catch {
            this.uiHelpers.showNotification('فشل في النسخ', 'error');
        }
    }

    /**
     * تصدير اللوحة
     */
    exportPalette() {
        const paletteData = {
            colors: this.extractedColors.map(color => ({
                hex: this.rgbToHex(color.r, color.g, color.b),
                rgb: `rgb(${color.r}, ${color.g}, ${color.b})`,
                hsl: (() => {
                    const hsl = this.rgbToHsl(color.r, color.g, color.b);
                    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
                })()
            })),
            extractedAt: new Date().toISOString(),
            method: document.getElementById('extraction-method').value
        };

        const blob = new Blob([JSON.stringify(paletteData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `color_palette_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * حفظ لون في السجل
     * @param {string} hex 
     */
    saveColorToHistory(hex) {
        if (!this.colorHistory.includes(hex)) {
            this.colorHistory.unshift(hex);
            if (this.colorHistory.length > 50) {
                this.colorHistory = this.colorHistory.slice(0, 50);
            }
            this.updateColorHistoryDisplay();
        }
    }

    /**
     * تحديث عرض سجل الألوان
     */
    updateColorHistoryDisplay() {
        const historyContainer = document.getElementById('history-colors');
        
        if (this.colorHistory.length === 0) {
            historyContainer.innerHTML = '<p class="empty-history">لا يوجد ألوان محفوظة</p>';
            return;
        }

        historyContainer.innerHTML = this.colorHistory.map(hex => `
            <div class="history-color-item">
                <div class="color-swatch" style="background-color: ${hex}"></div>
                <span class="color-value">${hex}</span>
                <button class="btn btn-xs btn-outline copy-history-color" data-color="${hex}">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        `).join('');

        // إضافة مستمعي نسخ الألوان من السجل
        document.querySelectorAll('.copy-history-color').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const color = e.target.closest('.copy-history-color').dataset.color;
                try {
                    await navigator.clipboard.writeText(color);
                    this.uiHelpers.showNotification(`تم نسخ ${color}`, 'success');
                } catch {
                    this.uiHelpers.showNotification('فشل في النسخ', 'error');
                }
            });
        });
    }

    /**
     * مسح سجل الألوان
     */
    clearColorHistory() {
        this.colorHistory = [];
        this.updateColorHistoryDisplay();
        this.uiHelpers.showNotification('تم مسح سجل الألوان', 'info');
    }

    /**
     * تصدير سجل الألوان
     */
    exportColorHistory() {
        if (this.colorHistory.length === 0) {
            this.uiHelpers.showNotification('لا يوجد ألوان لتصديرها', 'warning');
            return;
        }

        const historyData = {
            colors: this.colorHistory,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(historyData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `color_history_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * تحويل RGB إلى HEX
     * @param {number} r 
     * @param {number} g 
     * @param {number} b 
     * @returns {string}
     */
    rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    }

    /**
     * تحويل RGB إلى HSL
     * @param {number} r 
     * @param {number} g 
     * @param {number} b 
     * @returns {Object}
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    /**
     * تفعيل أزرار التحكم
     */
    enableControls() {
        document.getElementById('extract-colors-btn').disabled = false;
        document.getElementById('pick-color-btn').disabled = false;
        document.getElementById('analyze-image-btn').disabled = false;
    }

    /**
     * إعادة تعيين
     */
    reset() {
        // إعادة تعيين البيانات
        this.currentImage = null;
        this.imageData = null;
        this.extractedColors = [];
        this.colorPickerActive = false;

        // إعادة تعيين الواجهة
        document.getElementById('color-placeholder').style.display = 'flex';
        this.canvas.style.display = 'none';
        document.getElementById('extracted-colors').style.display = 'none';
        document.getElementById('color-histogram').style.display = 'none';

        this.hideColorPicker();

        // إعادة تعيين الإعدادات
        document.getElementById('extraction-method').value = 'dominant';
        document.getElementById('color-count').value = 5;
        document.getElementById('color-count-value').textContent = '5';
        document.getElementById('analysis-quality').value = 'medium';
        document.getElementById('ignore-similar').checked = true;
        document.getElementById('similarity-threshold').value = 20;
        document.getElementById('similarity-value').textContent = '20';

        // تعطيل الأزرار
        document.getElementById('extract-colors-btn').disabled = true;
        document.getElementById('pick-color-btn').disabled = true;
        document.getElementById('analyze-image-btn').disabled = true;

        this.uiHelpers.showNotification('تم إعادة تعيين أداة استخراج الألوان', 'info');
    }
}

// تصدير الكلاس
export default ColorExtractor;