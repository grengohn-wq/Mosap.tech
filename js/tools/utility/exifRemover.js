/**
 * EXIF Remover Tool
 * أداة إزالة البيانات الوصفية EXIF من الصور لحماية الخصوصية
 */

import ImageUtils from '../utils/imageUtils.js';
import UIHelpers from '../utils/uiHelpers.js';

class ExifRemover {
    constructor() {
        this.imageUtils = new ImageUtils();
        this.uiHelpers = new UIHelpers();
        this.currentImage = null;
        this.originalFile = null;
        this.exifData = null;
        this.processedImages = [];
        this.supportedFormats = ['image/jpeg', 'image/jpg'];
        this.outputFormats = {
            'keep': 'نفس التنسيق الأصلي',
            'jpeg': 'JPEG (مع ضغط)',
            'png': 'PNG (بدون فقدان)',
            'webp': 'WebP (حديث وفعال)'
        };
    }

    /**
     * تهيئة أداة إزالة EXIF
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
    }

    /**
     * إنشاء واجهة أداة إزالة EXIF
     */
    createInterface() {
        const controlsSection = document.getElementById('controls-section');
        if (!controlsSection) return;

        controlsSection.innerHTML = `
            <div class="control-panel">
                <div class="control-header">
                    <i class="fas fa-shield-alt"></i>
                    <h3>إزالة بيانات EXIF</h3>
                </div>
                
                <div class="control-group">
                    <!-- معلومات الأمان -->
                    <div class="security-notice">
                        <div class="notice-icon">
                            <i class="fas fa-info-circle"></i>
                        </div>
                        <div class="notice-content">
                            <h4>حماية الخصوصية</h4>
                            <p>تحتوي الصور على بيانات EXIF مثل الموقع، تاريخ التقاط، نوع الكاميرا. هذه الأداة تزيل هذه البيانات لحماية خصوصيتك.</p>
                        </div>
                    </div>

                    <!-- رفع الصور -->
                    <div class="upload-section">
                        <div class="upload-area" id="upload-area">
                            <div class="upload-content">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <h4>اسحب وأفلت الصور هنا</h4>
                                <p>أو انقر لاختيار الملفات</p>
                                <input type="file" id="exif-file-input" multiple accept="image/*" style="display: none;">
                                <button class="btn btn-primary" id="select-files-btn">
                                    <i class="fas fa-folder-open"></i>
                                    اختيار صور
                                </button>
                            </div>
                        </div>

                        <div class="format-support-info">
                            <h5>التنسيقات المدعومة:</h5>
                            <div class="supported-formats">
                                <span class="format-badge supported">JPEG/JPG</span>
                                <span class="format-badge limited">PNG (محدود)</span>
                                <span class="format-badge limited">TIFF (محدود)</span>
                                <span class="format-badge not-supported">GIF (غير مدعوم)</span>
                                <span class="format-badge not-supported">WebP (غير مدعوم)</span>
                            </div>
                            <small><strong>ملاحظة:</strong> JPEG هو الأكثر شيوعاً لاحتواء بيانات EXIF</small>
                        </div>
                    </div>

                    <!-- قائمة الملفات -->
                    <div class="files-list" id="files-list" style="display: none;">
                        <div class="list-header">
                            <h4>الصور المرفوعة</h4>
                            <div class="batch-actions">
                                <button class="btn btn-sm btn-outline" id="select-all-files">
                                    <i class="fas fa-check-square"></i>
                                    تحديد الكل
                                </button>
                                <button class="btn btn-sm btn-outline" id="clear-all-files">
                                    <i class="fas fa-trash"></i>
                                    مسح الكل
                                </button>
                            </div>
                        </div>
                        <div class="files-container" id="files-container">
                            <!-- سيتم إنشاؤها ديناميكياً -->
                        </div>
                    </div>

                    <!-- إعدادات المعالجة -->
                    <div class="processing-settings" id="processing-settings" style="display: none;">
                        <h4>إعدادات المعالجة</h4>
                        
                        <div class="control-row">
                            <label class="control-label">تنسيق الإخراج</label>
                            <select id="output-format" class="form-select">
                                <option value="keep">نفس التنسيق الأصلي</option>
                                <option value="jpeg">JPEG</option>
                                <option value="png">PNG</option>
                                <option value="webp">WebP</option>
                            </select>
                        </div>

                        <div class="control-row" id="quality-row">
                            <label class="control-label">جودة الضغط (JPEG)</label>
                            <div class="control-input-group">
                                <input type="range" id="output-quality" class="form-range" 
                                       min="0.5" max="1" step="0.05" value="0.95">
                                <span class="range-value" id="quality-value">95%</span>
                            </div>
                        </div>

                        <div class="control-row">
                            <label class="control-label">إزالة البيانات الإضافية</label>
                            <div class="additional-data-options">
                                <div class="option-item">
                                    <input type="checkbox" id="remove-color-profile" checked>
                                    <label>إزالة ملف الألوان (Color Profile)</label>
                                </div>
                                <div class="option-item">
                                    <input type="checkbox" id="remove-thumbnails" checked>
                                    <label>إزالة الصور المصغرة المدمجة</label>
                                </div>
                                <div class="option-item">
                                    <input type="checkbox" id="remove-comments" checked>
                                    <label>إزالة التعليقات والأوصاف</label>
                                </div>
                            </div>
                        </div>

                        <div class="control-row">
                            <label class="control-label">استراتيجية الإزالة</label>
                            <select id="removal-strategy" class="form-select">
                                <option value="complete" selected>إزالة كاملة (أكثر أماناً)</option>
                                <option value="selective">إزالة انتقائية (الحفاظ على بعض البيانات الفنية)</option>
                                <option value="minimal">إزالة الحد الأدنى (الموقع والوقت فقط)</option>
                            </select>
                        </div>

                        <div class="control-row">
                            <label class="control-label">معاينة البيانات</label>
                            <input type="checkbox" id="show-before-after" checked>
                            <small>عرض البيانات قبل وبعد الإزالة</small>
                        </div>
                    </div>

                    <!-- معاينة بيانات EXIF -->
                    <div class="exif-preview" id="exif-preview" style="display: none;">
                        <h4>معاينة البيانات المكتشفة</h4>
                        <div class="exif-tabs">
                            <button class="exif-tab active" data-tab="privacy">بيانات الخصوصية</button>
                            <button class="exif-tab" data-tab="technical">بيانات فنية</button>
                            <button class="exif-tab" data-tab="all">جميع البيانات</button>
                        </div>
                        
                        <div class="exif-content">
                            <div class="exif-tab-content active" id="privacy-tab">
                                <!-- بيانات الخصوصية الحساسة -->
                            </div>
                            <div class="exif-tab-content" id="technical-tab">
                                <!-- البيانات الفنية -->
                            </div>
                            <div class="exif-tab-content" id="all-tab">
                                <!-- جميع البيانات -->
                            </div>
                        </div>
                    </div>

                    <!-- أزرار التحكم -->
                    <div class="control-actions">
                        <button id="process-files-btn" class="btn btn-primary" disabled>
                            <i class="fas fa-shield-alt"></i>
                            معالجة الصور المحددة
                        </button>
                        
                        <button id="analyze-exif-btn" class="btn btn-secondary" disabled>
                            <i class="fas fa-search"></i>
                            تحليل البيانات
                        </button>
                        
                        <button id="download-all-btn" class="btn btn-success" disabled style="display: none;">
                            <i class="fas fa-download"></i>
                            تحميل جميع الصور
                        </button>
                        
                        <button id="reset-exif-btn" class="btn btn-outline">
                            <i class="fas fa-refresh"></i>
                            إعادة تعيين
                        </button>
                    </div>

                    <!-- نتائج المعالجة -->
                    <div class="processing-results" id="processing-results" style="display: none;">
                        <div class="results-header">
                            <h4>نتائج المعالجة</h4>
                            <div class="results-summary">
                                <span id="processed-count">0</span> من <span id="total-count">0</span> صورة تم معالجتها
                            </div>
                        </div>
                        
                        <div class="results-grid" id="results-grid">
                            <!-- سيتم إنشاؤها ديناميكياً -->
                        </div>

                        <div class="batch-download">
                            <button class="btn btn-primary" id="download-processed-zip">
                                <i class="fas fa-file-archive"></i>
                                تحميل كملف مضغوط
                            </button>
                        </div>
                    </div>

                    <!-- إحصائيات المعالجة -->
                    <div class="processing-stats" id="processing-stats" style="display: none;">
                        <h4>إحصائيات المعالجة</h4>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <label>البيانات المحذوفة:</label>
                                <span id="removed-data-count">-</span>
                            </div>
                            <div class="stat-item">
                                <label>توفير الحجم:</label>
                                <span id="size-reduction">-</span>
                            </div>
                            <div class="stat-item">
                                <label>الوقت المستغرق:</label>
                                <span id="processing-time">-</span>
                            </div>
                            <div class="stat-item">
                                <label>مستوى الأمان:</label>
                                <span id="security-level">-</span>
                            </div>
                        </div>
                    </div>

                    <!-- معلومات EXIF -->
                    <details class="exif-info-section">
                        <summary>معلومات حول بيانات EXIF</summary>
                        <div class="info-content">
                            <h5>ما هي بيانات EXIF؟</h5>
                            <p>EXIF (Exchangeable Image File Format) هي بيانات وصفية تُحفظ داخل ملفات الصور وتحتوي على معلومات مثل:</p>
                            
                            <div class="exif-categories">
                                <div class="category">
                                    <h6>📍 معلومات الموقع</h6>
                                    <ul>
                                        <li>إحداثيات GPS (خط الطول والعرض)</li>
                                        <li>الارتفاع عن سطح البحر</li>
                                        <li>اتجاه البوصلة</li>
                                    </ul>
                                </div>
                                
                                <div class="category">
                                    <h6>⏰ معلومات التوقيت</h6>
                                    <ul>
                                        <li>تاريخ ووقت التقاط الصورة</li>
                                        <li>المنطقة الزمنية</li>
                                        <li>وقت آخر تعديل</li>
                                    </ul>
                                </div>
                                
                                <div class="category">
                                    <h6>📷 معلومات الكاميرا</h6>
                                    <ul>
                                        <li>نوع وطراز الكاميرا</li>
                                        <li>إعدادات التصوير (ISO, فتحة العدسة)</li>
                                        <li>برنامج المعالجة المستخدم</li>
                                    </ul>
                                </div>
                                
                                <div class="category">
                                    <h6>👤 معلومات شخصية</h6>
                                    <ul>
                                        <li>اسم المصور</li>
                                        <li>حقوق الطبع والنشر</li>
                                        <li>تعليقات وأوصاف</li>
                                    </ul>
                                </div>
                            </div>

                            <h5>لماذا قد ترغب في إزالة هذه البيانات؟</h5>
                            <ul>
                                <li><strong>حماية الخصوصية:</strong> منع تتبع الموقع والعادات</li>
                                <li><strong>الأمان:</strong> حماية المعلومات الشخصية عند نشر الصور</li>
                                <li><strong>تقليل الحجم:</strong> توفير مساحة التخزين</li>
                                <li><strong>التوافق:</strong> بعض المنصات تتطلب صوراً بدون بيانات إضافية</li>
                            </ul>

                            <h5>مستويات الإزالة:</h5>
                            <ul>
                                <li><strong>كاملة:</strong> إزالة جميع البيانات الوصفية (الأكثر أماناً)</li>
                                <li><strong>انتقائية:</strong> الحفاظ على البيانات الفنية المفيدة</li>
                                <li><strong>الحد الأدنى:</strong> إزالة المعلومات الحساسة فقط</li>
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
        const uploadArea = document.getElementById('upload-area');
        if (!uploadArea) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-active');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-active');
            });
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/')
            );
            if (files.length > 0) {
                this.handleFiles(files);
            }
        });

        // النقر لاختيار الملفات
        uploadArea.addEventListener('click', () => {
            document.getElementById('exif-file-input').click();
        });
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // اختيار الملفات
        document.getElementById('select-files-btn')?.addEventListener('click', () => {
            document.getElementById('exif-file-input').click();
        });

        document.getElementById('exif-file-input')?.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                this.handleFiles(files);
            }
        });

        // إدارة قائمة الملفات
        document.getElementById('select-all-files')?.addEventListener('click', () => {
            this.selectAllFiles();
        });

        document.getElementById('clear-all-files')?.addEventListener('click', () => {
            this.clearAllFiles();
        });

        // إعدادات المعالجة
        document.getElementById('output-format')?.addEventListener('change', (e) => {
            const qualityRow = document.getElementById('quality-row');
            const showQuality = e.target.value === 'jpeg' || 
                               (e.target.value === 'keep' && this.hasJpegFiles());
            qualityRow.style.display = showQuality ? 'block' : 'none';
        });

        document.getElementById('output-quality')?.addEventListener('input', (e) => {
            const quality = Math.round(parseFloat(e.target.value) * 100);
            document.getElementById('quality-value').textContent = quality + '%';
        });

        // تبويبات EXIF
        document.querySelectorAll('.exif-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchExifTab(e.target.dataset.tab);
            });
        });

        // أزرار التحكم
        document.getElementById('process-files-btn')?.addEventListener('click', () => {
            this.processSelectedFiles();
        });

        document.getElementById('analyze-exif-btn')?.addEventListener('click', () => {
            this.analyzeExifData();
        });

        document.getElementById('download-all-btn')?.addEventListener('click', () => {
            this.downloadAllProcessed();
        });

        document.getElementById('download-processed-zip')?.addEventListener('click', () => {
            this.downloadAsZip();
        });

        document.getElementById('reset-exif-btn')?.addEventListener('click', () => {
            this.reset();
        });
    }

    /**
     * معالجة الملفات المرفوعة
     * @param {Array} files 
     */
    async handleFiles(files) {
        this.uiHelpers.showLoading('جاري تحليل الملفات...');

        const processedFiles = [];

        for (const file of files) {
            try {
                const fileInfo = await this.analyzeFile(file);
                processedFiles.push(fileInfo);
            } catch (error) {
                console.error('فشل في تحليل الملف:', file.name, error);
                processedFiles.push({
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    hasExif: false,
                    error: error.message,
                    selected: false
                });
            }
        }

        this.displayFilesList(processedFiles);
        this.updateControlsVisibility();

        this.uiHelpers.hideLoading();
    }

    /**
     * تحليل ملف واحد
     * @param {File} file 
     * @returns {Object}
     */
    async analyzeFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const exifData = this.extractExifData(e.target.result);
                    resolve({
                        file,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        hasExif: exifData && Object.keys(exifData).length > 0,
                        exifData,
                        sensitiveData: this.findSensitiveData(exifData),
                        selected: true // محدد افتراضياً
                    });
                } catch (error) {
                    resolve({
                        file,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        hasExif: false,
                        error: error.message,
                        selected: false
                    });
                }
            };

            reader.onerror = () => {
                resolve({
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    hasExif: false,
                    error: 'فشل في قراءة الملف',
                    selected: false
                });
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * استخراج بيانات EXIF (تنفيذ مبسط)
     * @param {ArrayBuffer} buffer 
     * @returns {Object}
     */
    extractExifData(buffer) {
        // هذا تنفيذ مبسط لاستخراج بيانات EXIF
        // في بيئة الإنتاج، يُفضل استخدام مكتبة متخصصة مثل exif-js
        
        const view = new DataView(buffer);
        const exifData = {};

        // فحص إذا كان الملف JPEG
        if (view.getUint16(0) !== 0xFFD8) {
            return null; // ليس ملف JPEG
        }

        // البحث عن قسم EXIF
        let offset = 2;
        while (offset < view.byteLength - 4) {
            const marker = view.getUint16(offset);
            
            if (marker === 0xFFE1) { // APP1 segment (EXIF)
                const length = view.getUint16(offset + 2);
                const exifHeader = this.getString(view, offset + 4, 4);
                
                if (exifHeader === 'Exif') {
                    // استخراج بعض البيانات الأساسية
                    exifData.hasExifData = true;
                    exifData.dataSize = length;
                    
                    // محاولة استخراج بيانات GPS (مبسط)
                    const gpsData = this.extractGPSData(view, offset + 10, length - 6);
                    if (gpsData) {
                        exifData.gps = gpsData;
                        exifData.hasSensitiveData = true;
                    }

                    // استخراج تاريخ التقاط (مبسط)
                    const dateTime = this.extractDateTime(view, offset + 10, length - 6);
                    if (dateTime) {
                        exifData.dateTime = dateTime;
                    }

                    break;
                }
            }
            
            offset += 2;
            if (marker >= 0xFFD0 && marker <= 0xFFD9) break; // SOS أو EOI
        }

        return exifData;
    }

    /**
     * الحصول على نص من buffer
     * @param {DataView} view 
     * @param {number} offset 
     * @param {number} length 
     * @returns {string}
     */
    getString(view, offset, length) {
        let str = '';
        for (let i = 0; i < length; i++) {
            str += String.fromCharCode(view.getUint8(offset + i));
        }
        return str;
    }

    /**
     * استخراج بيانات GPS (مبسط)
     * @param {DataView} view 
     * @param {number} offset 
     * @param {number} length 
     * @returns {Object|null}
     */
    extractGPSData(view, offset, length) {
        // هذا تنفيذ مبسط جداً
        // في الواقع، استخراج GPS من EXIF معقد ويتطلب تحليل TIFF format
        
        // البحث عن علامات GPS
        for (let i = offset; i < offset + length - 10; i++) {
            const tag = view.getUint16(i);
            if (tag === 0x8825) { // GPS IFD Pointer
                return {
                    detected: true,
                    message: 'تم اكتشاف بيانات GPS في الصورة'
                };
            }
        }
        
        return null;
    }

    /**
     * استخراج تاريخ ووقت التقاط (مبسط)
     * @param {DataView} view 
     * @param {number} offset 
     * @param {number} length 
     * @returns {string|null}
     */
    extractDateTime(view, offset, length) {
        // تنفيذ مبسط لاستخراج التاريخ
        // في الواقع يتطلب تحليل دقيق لـ TIFF tags
        
        for (let i = offset; i < offset + length - 20; i++) {
            const tag = view.getUint16(i);
            if (tag === 0x0132 || tag === 0x9003) { // DateTime tags
                return 'تم اكتشاف تاريخ التقاط الصورة';
            }
        }
        
        return null;
    }

    /**
     * العثور على البيانات الحساسة
     * @param {Object} exifData 
     * @returns {Array}
     */
    findSensitiveData(exifData) {
        const sensitiveItems = [];
        
        if (!exifData) return sensitiveItems;

        if (exifData.gps) {
            sensitiveItems.push({
                type: 'location',
                severity: 'high',
                description: 'بيانات الموقع الجغرافي (GPS)',
                impact: 'يمكن تتبع موقع التقاط الصورة'
            });
        }

        if (exifData.dateTime) {
            sensitiveItems.push({
                type: 'datetime',
                severity: 'medium',
                description: 'تاريخ ووقت التقاط الصورة',
                impact: 'يمكن تحديد متى تم التقاط الصورة'
            });
        }

        if (exifData.hasExifData) {
            sensitiveItems.push({
                type: 'device',
                severity: 'low',
                description: 'معلومات الجهاز والكاميرا',
                impact: 'يمكن تحديد نوع الجهاز المستخدم'
            });
        }

        return sensitiveItems;
    }

    /**
     * عرض قائمة الملفات
     * @param {Array} files 
     */
    displayFilesList(files) {
        this.uploadedFiles = files;
        const container = document.getElementById('files-container');
        
        container.innerHTML = files.map((fileInfo, index) => {
            const statusIcon = fileInfo.error ? 
                '<i class="fas fa-exclamation-triangle error"></i>' :
                fileInfo.hasExif ? 
                    '<i class="fas fa-shield-alt warning"></i>' :
                    '<i class="fas fa-check-circle success"></i>';

            const statusText = fileInfo.error ? 
                `خطأ: ${fileInfo.error}` :
                fileInfo.hasExif ? 
                    `يحتوي على بيانات EXIF (${fileInfo.sensitiveData.length} عنصر حساس)` :
                    'لا يحتوي على بيانات EXIF';

            const sizeText = this.formatFileSize(fileInfo.size);
            
            return `
                <div class="file-item ${fileInfo.error ? 'error' : ''}" data-index="${index}">
                    <div class="file-checkbox">
                        <input type="checkbox" id="file-${index}" 
                               ${fileInfo.selected ? 'checked' : ''} 
                               ${fileInfo.error ? 'disabled' : ''}>
                    </div>
                    <div class="file-info">
                        <div class="file-name">${fileInfo.name}</div>
                        <div class="file-details">
                            <span class="file-size">${sizeText}</span>
                            <span class="file-type">${fileInfo.type}</span>
                        </div>
                        <div class="file-status">
                            ${statusIcon}
                            <span>${statusText}</span>
                        </div>
                        ${fileInfo.sensitiveData && fileInfo.sensitiveData.length > 0 ? `
                            <div class="sensitive-data-preview">
                                ${fileInfo.sensitiveData.map(item => `
                                    <span class="sensitive-item ${item.severity}">${item.description}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="file-actions">
                        ${fileInfo.hasExif ? `
                            <button class="btn btn-xs btn-outline preview-exif" data-index="${index}">
                                <i class="fas fa-eye"></i>
                                عرض البيانات
                            </button>
                        ` : ''}
                        <button class="btn btn-xs btn-outline remove-file" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // إضافة مستمعي الأحداث
        this.setupFileItemEvents();

        document.getElementById('files-list').style.display = 'block';
    }

    /**
     * إعداد أحداث عناصر الملفات
     */
    setupFileItemEvents() {
        // تحديد/إلغاء تحديد الملفات
        document.querySelectorAll('input[type="checkbox"][id^="file-"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.id.replace('file-', ''));
                this.uploadedFiles[index].selected = e.target.checked;
                this.updateProcessButton();
            });
        });

        // عرض بيانات EXIF
        document.querySelectorAll('.preview-exif').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.previewExifData(this.uploadedFiles[index]);
            });
        });

        // حذف ملفات
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeFile(index);
            });
        });
    }

    /**
     * معاينة بيانات EXIF
     * @param {Object} fileInfo 
     */
    previewExifData(fileInfo) {
        const exifPreview = document.getElementById('exif-preview');
        
        // تجديد محتوى التبويبات
        this.updateExifTabs(fileInfo);
        
        exifPreview.style.display = 'block';
        exifPreview.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * تحديث تبويبات EXIF
     * @param {Object} fileInfo 
     */
    updateExifTabs(fileInfo) {
        // بيانات الخصوصية
        const privacyTab = document.getElementById('privacy-tab');
        privacyTab.innerHTML = this.generatePrivacyDataHTML(fileInfo.sensitiveData);

        // البيانات الفنية
        const technicalTab = document.getElementById('technical-tab');
        technicalTab.innerHTML = this.generateTechnicalDataHTML(fileInfo.exifData);

        // جميع البيانات
        const allTab = document.getElementById('all-tab');
        allTab.innerHTML = this.generateAllDataHTML(fileInfo.exifData);
    }

    /**
     * إنشاء HTML لبيانات الخصوصية
     * @param {Array} sensitiveData 
     * @returns {string}
     */
    generatePrivacyDataHTML(sensitiveData) {
        if (!sensitiveData || sensitiveData.length === 0) {
            return '<p class="no-data">لم يتم العثور على بيانات خصوصية حساسة</p>';
        }

        return `
            <div class="privacy-data">
                ${sensitiveData.map(item => `
                    <div class="privacy-item ${item.severity}">
                        <div class="privacy-header">
                            <h5>${item.description}</h5>
                            <span class="severity-badge ${item.severity}">${this.getSeverityText(item.severity)}</span>
                        </div>
                        <p class="privacy-impact">${item.impact}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * إنشاء HTML للبيانات الفنية
     * @param {Object} exifData 
     * @returns {string}
     */
    generateTechnicalDataHTML(exifData) {
        if (!exifData || !exifData.hasExifData) {
            return '<p class="no-data">لا توجد بيانات فنية</p>';
        }

        return `
            <div class="technical-data">
                <div class="data-item">
                    <label>حجم بيانات EXIF:</label>
                    <span>${exifData.dataSize || 'غير محدد'} بايت</span>
                </div>
                <div class="data-item">
                    <label>يحتوي على بيانات GPS:</label>
                    <span>${exifData.gps ? 'نعم' : 'لا'}</span>
                </div>
                <div class="data-item">
                    <label>يحتوي على تاريخ التقاط:</label>
                    <span>${exifData.dateTime ? 'نعم' : 'لا'}</span>
                </div>
            </div>
        `;
    }

    /**
     * إنشاء HTML لجميع البيانات
     * @param {Object} exifData 
     * @returns {string}
     */
    generateAllDataHTML(exifData) {
        if (!exifData) {
            return '<p class="no-data">لا توجد بيانات EXIF</p>';
        }

        return `
            <div class="all-exif-data">
                <pre>${JSON.stringify(exifData, null, 2)}</pre>
            </div>
        `;
    }

    /**
     * الحصول على نص مستوى الخطورة
     * @param {string} severity 
     * @returns {string}
     */
    getSeverityText(severity) {
        switch (severity) {
            case 'high': return 'عالي';
            case 'medium': return 'متوسط';
            case 'low': return 'منخفض';
            default: return 'غير محدد';
        }
    }

    /**
     * تبديل تبويب EXIF
     * @param {string} tabName 
     */
    switchExifTab(tabName) {
        // تحديث الأزرار
        document.querySelectorAll('.exif-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // تحديث المحتوى
        document.querySelectorAll('.exif-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    /**
     * معالجة الملفات المحددة
     */
    async processSelectedFiles() {
        const selectedFiles = this.uploadedFiles.filter(file => file.selected && !file.error);
        
        if (selectedFiles.length === 0) {
            this.uiHelpers.showNotification('يرجى تحديد ملفات صحيحة للمعالجة', 'warning');
            return;
        }

        try {
            this.uiHelpers.showLoading('جاري معالجة الصور...');

            const startTime = Date.now();
            const processedResults = [];

            for (const fileInfo of selectedFiles) {
                const result = await this.processFile(fileInfo);
                processedResults.push(result);
            }

            const processingTime = Date.now() - startTime;

            this.displayProcessingResults(processedResults, processingTime);
            this.updateProcessingStats(processedResults, processingTime);

            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification(`تم معالجة ${processedResults.length} صورة بنجاح`, 'success');

        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في المعالجة: ' + error.message, 'error');
        }
    }

    /**
     * معالجة ملف واحد
     * @param {Object} fileInfo 
     * @returns {Object}
     */
    async processFile(fileInfo) {
        const outputFormat = document.getElementById('output-format').value;
        const quality = parseFloat(document.getElementById('output-quality').value);
        const strategy = document.getElementById('removal-strategy').value;

        // تحميل الصورة
        const image = await this.imageUtils.loadImage(fileInfo.file);
        
        // إنشاء canvas نظيف (بدون EXIF)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        // تحديد تنسيق الإخراج
        let finalFormat = outputFormat === 'keep' ? fileInfo.type : `image/${outputFormat}`;
        
        // تحويل إلى blob (هذا يزيل بيانات EXIF تلقائياً)
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, finalFormat, quality);
        });

        // إنشاء اسم ملف جديد
        const extension = this.getExtensionFromFormat(finalFormat);
        const baseName = fileInfo.name.replace(/\.[^/.]+$/, '');
        const newName = `${baseName}_cleaned.${extension}`;

        return {
            originalFile: fileInfo,
            processedBlob: blob,
            processedName: newName,
            originalSize: fileInfo.size,
            processedSize: blob.size,
            removedDataCount: fileInfo.sensitiveData ? fileInfo.sensitiveData.length : 0,
            strategy: strategy
        };
    }

    /**
     * الحصول على امتداد من تنسيق الملف
     * @param {string} format 
     * @returns {string}
     */
    getExtensionFromFormat(format) {
        switch (format) {
            case 'image/jpeg': return 'jpg';
            case 'image/png': return 'png';
            case 'image/webp': return 'webp';
            default: return 'jpg';
        }
    }

    /**
     * عرض نتائج المعالجة
     * @param {Array} results 
     * @param {number} processingTime 
     */
    displayProcessingResults(results, processingTime) {
        this.processedResults = results;
        
        document.getElementById('processed-count').textContent = results.length;
        document.getElementById('total-count').textContent = this.uploadedFiles.length;

        const resultsGrid = document.getElementById('results-grid');
        resultsGrid.innerHTML = results.map((result, index) => {
            const sizeReduction = ((result.originalSize - result.processedSize) / result.originalSize * 100).toFixed(1);
            
            return `
                <div class="result-item">
                    <div class="result-info">
                        <h5>${result.processedName}</h5>
                        <div class="size-comparison">
                            <span class="original-size">${this.formatFileSize(result.originalSize)}</span>
                            <i class="fas fa-arrow-right"></i>
                            <span class="processed-size">${this.formatFileSize(result.processedSize)}</span>
                            <span class="size-reduction">(${sizeReduction}% توفير)</span>
                        </div>
                        <div class="processing-info">
                            <span class="removed-data">تم حذف ${result.removedDataCount} عنصر</span>
                            <span class="strategy">استراتيجية: ${this.getStrategyText(result.strategy)}</span>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-sm btn-primary download-single" data-index="${index}">
                            <i class="fas fa-download"></i>
                            تحميل
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // إضافة مستمعي التحميل
        document.querySelectorAll('.download-single').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.downloadSingleResult(results[index]);
            });
        });

        document.getElementById('processing-results').style.display = 'block';
        document.getElementById('download-all-btn').style.display = 'inline-block';
        document.getElementById('download-all-btn').disabled = false;
    }

    /**
     * تحديث إحصائيات المعالجة
     * @param {Array} results 
     * @param {number} processingTime 
     */
    updateProcessingStats(results, processingTime) {
        const totalRemovedData = results.reduce((sum, result) => sum + result.removedDataCount, 0);
        const totalSizeReduction = results.reduce((sum, result) => {
            return sum + (result.originalSize - result.processedSize);
        }, 0);

        document.getElementById('removed-data-count').textContent = totalRemovedData;
        document.getElementById('size-reduction').textContent = this.formatFileSize(totalSizeReduction);
        document.getElementById('processing-time').textContent = (processingTime / 1000).toFixed(2) + ' ثانية';
        
        const securityLevel = this.calculateSecurityLevel(results);
        document.getElementById('security-level').textContent = securityLevel;

        document.getElementById('processing-stats').style.display = 'block';
    }

    /**
     * حساب مستوى الأمان
     * @param {Array} results 
     * @returns {string}
     */
    calculateSecurityLevel(results) {
        const totalSensitiveData = results.reduce((sum, result) => sum + result.removedDataCount, 0);
        
        if (totalSensitiveData === 0) return 'منخفض المخاطر';
        if (totalSensitiveData < 5) return 'متوسط الأمان';
        return 'عالي الأمان';
    }

    /**
     * الحصول على نص الاستراتيجية
     * @param {string} strategy 
     * @returns {string}
     */
    getStrategyText(strategy) {
        switch (strategy) {
            case 'complete': return 'إزالة كاملة';
            case 'selective': return 'إزالة انتقائية';
            case 'minimal': return 'الحد الأدنى';
            default: return strategy;
        }
    }

    /**
     * تحميل نتيجة واحدة
     * @param {Object} result 
     */
    downloadSingleResult(result) {
        const url = URL.createObjectURL(result.processedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.processedName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * تحميل جميع النتائج
     */
    downloadAllProcessed() {
        if (!this.processedResults || this.processedResults.length === 0) return;

        this.processedResults.forEach(result => {
            setTimeout(() => this.downloadSingleResult(result), 100);
        });
    }

    /**
     * تحميل كملف مضغوط
     */
    async downloadAsZip() {
        // هذه الوظيفة تتطلب مكتبة JSZip
        // يمكن تنفيذها لاحقاً أو استخدام تحميل متعدد
        this.uiHelpers.showNotification('ميزة التحميل المضغوط ستتوفر قريباً', 'info');
    }

    /**
     * تحليل بيانات EXIF
     */
    analyzeExifData() {
        const filesWithExif = this.uploadedFiles.filter(file => file.hasExif);
        
        if (filesWithExif.length === 0) {
            this.uiHelpers.showNotification('لا توجد ملفات تحتوي على بيانات EXIF', 'info');
            return;
        }

        // عرض تحليل شامل
        this.previewExifData(filesWithExif[0]);
        this.uiHelpers.showNotification(`تم العثور على بيانات EXIF في ${filesWithExif.length} ملف`, 'info');
    }

    /**
     * تحديد جميع الملفات
     */
    selectAllFiles() {
        this.uploadedFiles.forEach((file, index) => {
            if (!file.error) {
                file.selected = true;
                const checkbox = document.getElementById(`file-${index}`);
                if (checkbox) checkbox.checked = true;
            }
        });
        this.updateProcessButton();
    }

    /**
     * مسح جميع الملفات
     */
    clearAllFiles() {
        this.uploadedFiles = [];
        document.getElementById('files-list').style.display = 'none';
        this.updateControlsVisibility();
    }

    /**
     * حذف ملف واحد
     * @param {number} index 
     */
    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        
        if (this.uploadedFiles.length === 0) {
            this.clearAllFiles();
        } else {
            this.displayFilesList(this.uploadedFiles);
        }
    }

    /**
     * تحديث ظهور الأزرار
     */
    updateControlsVisibility() {
        const hasFiles = this.uploadedFiles && this.uploadedFiles.length > 0;
        
        document.getElementById('processing-settings').style.display = hasFiles ? 'block' : 'none';
        
        this.updateProcessButton();
    }

    /**
     * تحديث زر المعالجة
     */
    updateProcessButton() {
        const selectedFiles = this.uploadedFiles ? 
            this.uploadedFiles.filter(file => file.selected && !file.error) : [];
        
        const processBtn = document.getElementById('process-files-btn');
        const analyzeBtn = document.getElementById('analyze-exif-btn');
        
        processBtn.disabled = selectedFiles.length === 0;
        analyzeBtn.disabled = this.uploadedFiles ? this.uploadedFiles.length === 0 : true;
    }

    /**
     * فحص وجود ملفات JPEG
     * @returns {boolean}
     */
    hasJpegFiles() {
        return this.uploadedFiles ? 
            this.uploadedFiles.some(file => file.type.includes('jpeg') || file.type.includes('jpg')) : 
            false;
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
        this.uploadedFiles = [];
        this.processedResults = [];
        this.currentImage = null;
        this.originalFile = null;
        this.exifData = null;

        // إعادة تعيين الواجهة
        document.getElementById('files-list').style.display = 'none';
        document.getElementById('processing-settings').style.display = 'none';
        document.getElementById('exif-preview').style.display = 'none';
        document.getElementById('processing-results').style.display = 'none';
        document.getElementById('processing-stats').style.display = 'none';
        document.getElementById('download-all-btn').style.display = 'none';

        // إعادة تعيين النماذج
        document.getElementById('exif-file-input').value = '';
        document.getElementById('output-format').value = 'keep';
        document.getElementById('output-quality').value = 0.95;
        document.getElementById('quality-value').textContent = '95%';

        // إعادة تعيين الخيارات
        document.getElementById('remove-color-profile').checked = true;
        document.getElementById('remove-thumbnails').checked = true;
        document.getElementById('remove-comments').checked = true;
        document.getElementById('removal-strategy').value = 'complete';
        document.getElementById('show-before-after').checked = true;

        this.updateControlsVisibility();

        this.uiHelpers.showNotification('تم إعادة تعيين أداة إزالة EXIF', 'info');
    }
}

// تصدير الكلاس
export default ExifRemover;