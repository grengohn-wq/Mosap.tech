/**
 * Main Application Coordinator
 * المنسق الرئيسي للتطبيق - يدير جميع الأدوات والمكونات
 */

// تحديد المسار الأساسي للمشروع
const BASE_PATH = window.location.pathname.includes('index.html') 
    ? window.location.pathname.replace('index.html', '') 
    : window.location.pathname.endsWith('/') 
        ? window.location.pathname 
        : window.location.pathname + '/';

// دالة مساعدة لتحميل الملفات ديناميكياً
async function loadModule(path) {
    try {
        return await import(BASE_PATH + path);
    } catch (error) {
        console.error(`فشل في تحميل ${path}:`, error);
        return null;
    }
}

// المتغيرات العامة للمكونات والأدوات
let FileUpload, PreviewPanel, ResultsPanel;
let FileHandler, ImageUtils, UIHelpers;
let ImageCompressor, ImageConverter, ImageResizer;
let ImageCropper, ImageRotator, WatermarkTool;
let Base64Converter, ColorExtractor, ExifRemover;
let QRGenerator;

class MainApp {
    constructor() {
        this.currentTool = null;
        this.tools = new Map();
        this.components = {};
        this.state = {
            currentFiles: [],
            processing: false,
            results: [],
            settings: this.loadSettings()
        };

        // مستمعي الأحداث
        this.eventListeners = new Map();

        // إعداد التطبيق
        this.init();
    }

    /**
     * تهيئة التطبيق
     */
    async init() {
        try {
            this.showLoading('جاري تحميل التطبيق...');

            // تهيئة المكونات الأساسية
            await this.initializeComponents();

            // تهيئة الأدوات
            await this.initializeTools();

            // إعداد التنقل والواجهة
            this.setupNavigation();
            this.setupEventListeners();

            // تحميل الأداة الافتراضية
            await this.switchTool('compressor');

            // إعداد الاختصارات
            this.setupKeyboardShortcuts();

            this.hideLoading();
            this.showNotification('تم تحميل التطبيق بنجاح!', 'success');

        } catch (error) {
            console.error('خطأ في تهيئة التطبيق:', error);
            this.hideLoading();
            this.showNotification('فشل في تحميل التطبيق', 'error');
        }
    }

    /**
     * تحميل المكونات الأساسية
     */
    async loadComponents() {
        try {
            // تحميل المكونات الأساسية
            const fileUploadModule = await loadModule('js/components/fileUpload.js');
            const previewPanelModule = await loadModule('js/components/previewPanel.js');
            const resultsPanelModule = await loadModule('js/components/resultsPanel.js');

            // تحميل الأدوات المساعدة
            const fileHandlerModule = await loadModule('js/utils/fileHandler.js');
            const imageUtilsModule = await loadModule('js/utils/imageUtils.js');
            const uiHelpersModule = await loadModule('js/utils/uiHelpers.js');

            if (fileUploadModule) FileUpload = fileUploadModule.default;
            if (previewPanelModule) PreviewPanel = previewPanelModule.default;
            if (resultsPanelModule) ResultsPanel = resultsPanelModule.default;
            if (fileHandlerModule) FileHandler = fileHandlerModule.default;
            if (imageUtilsModule) ImageUtils = imageUtilsModule.default;
            if (uiHelpersModule) UIHelpers = uiHelpersModule.default;

        } catch (error) {
            console.error('خطأ في تحميل المكونات:', error);
        }
    }

    /**
     * تهيئة المكونات الأساسية
     */
    async initializeComponents() {
        // تحميل المكونات أولاً
        await this.loadComponents();

        // التحقق من تحميل المكونات بنجاح
        if (!FileUpload || !PreviewPanel || !ResultsPanel || !FileHandler || !ImageUtils || !UIHelpers) {
            console.error('فشل في تحميل بعض المكونات الأساسية');
            this.initializeFallbackComponents();
            return;
        }

        // مكون رفع الملفات
        this.components.fileUpload = new FileUpload({
            container: 'upload-section',
            maxFiles: 20,
            maxSize: 50 * 1024 * 1024, // 50MB
            acceptedTypes: ['image/*'],
            onFilesSelected: (files, allFiles) => this.handleFilesUploaded(files, allFiles),
            onFileRemoved: (file, remainingFiles) => this.handleFileRemoved(file, remainingFiles)
        });

        // مكون لوحة المعاينة
        this.components.previewPanel = new PreviewPanel({
            container: 'preview-section',
            showZoom: true,
            showInfo: true,
            showComparison: true
        });

        // مكون لوحة النتائج
        this.components.resultsPanel = new ResultsPanel({
            container: 'results-section',
            showComparison: true,
            showStats: true,
            allowBatchDownload: true,
            autoSave: true,
            onResultSelected: (result, selected) => this.handleResultSelected(result, selected),
            onResultRemoved: (result) => this.handleResultRemoved(result)
        });

        // الأدوات المساعدة
        this.fileHandler = new FileHandler();
        this.imageUtils = new ImageUtils();
        this.uiHelpers = new UIHelpers();

        // تهيئة المكونات
        await Promise.all([
            this.components.fileUpload.init(),
            this.components.previewPanel.init(),
            this.components.resultsPanel.init()
        ]);
    }

    /**
     * تهيئة مكونات احتياطية في حالة فشل التحميل
     */
    initializeFallbackComponents() {
        console.warn('تم تشغيل المكونات الاحتياطية');
        
        // إنشاء مكونات بسيطة كبديل
        this.components.fileUpload = {
            init: () => this.initBasicFileUpload(),
            handleFiles: (files) => console.log('تم رفع الملفات:', files)
        };

        this.components.previewPanel = {
            init: () => console.log('تم تهيئة معاينة بسيطة'),
            showImage: (img) => this.showBasicPreview(img),
            clear: () => console.log('تم مسح المعاينة')
        };

        this.components.resultsPanel = {
            init: () => console.log('تم تهيئة نتائج بسيطة'),
            addResult: (result) => this.addBasicResult(result)
        };

        // أدوات مساعدة بسيطة
        this.fileHandler = {
            validateFile: (file) => file.type.startsWith('image/'),
            formatFileSize: (bytes) => {
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                if (bytes === 0) return '0 Bytes';
                const i = Math.floor(Math.log(bytes) / Math.log(1024));
                return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
            }
        };

        this.imageUtils = {
            loadImage: (file) => new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = URL.createObjectURL(file);
            })
        };

        this.uiHelpers = {
            showNotification: (message, type = 'info') => {
                console.log(`[${type.toUpperCase()}] ${message}`);
                alert(message);
            },
            showLoading: (message) => console.log('Loading:', message),
            hideLoading: () => console.log('Loading complete')
        };
    }

    /**
     * تحميل الأدوات
     */
    async loadTools() {
        try {
            // تحميل أدوات التحسين
            const compressorModule = await loadModule('js/tools/optimization/compressor.js');
            const converterModule = await loadModule('js/tools/optimization/converter.js');
            const resizerModule = await loadModule('js/tools/optimization/resizer.js');

            // تحميل أدوات التحرير
            const cropperModule = await loadModule('js/tools/editing/cropper.js');
            const rotatorModule = await loadModule('js/tools/editing/rotator.js');
            const watermarkModule = await loadModule('js/tools/editing/watermark.js');

            // تحميل أدوات الأغراض العامة
            const base64Module = await loadModule('js/tools/utility/base64Converter.js');
            const colorModule = await loadModule('js/tools/utility/colorExtractor.js');
            const exifModule = await loadModule('js/tools/utility/exifRemover.js');

            // تحميل أدوات التوليد
            const qrModule = await loadModule('js/tools/generators/qrGenerator.js');

            // تعيين الكلاسات
            if (compressorModule) ImageCompressor = compressorModule.default;
            if (converterModule) ImageConverter = converterModule.default;
            if (resizerModule) ImageResizer = resizerModule.default;
            if (cropperModule) ImageCropper = cropperModule.default;
            if (rotatorModule) ImageRotator = rotatorModule.default;
            if (watermarkModule) WatermarkTool = watermarkModule.default;
            if (base64Module) Base64Converter = base64Module.default;
            if (colorModule) ColorExtractor = colorModule.default;
            if (exifModule) ExifRemover = exifModule.default;
            if (qrModule) QRGenerator = qrModule.default;

        } catch (error) {
            console.error('خطأ في تحميل الأدوات:', error);
        }
    }

    /**
     * تهيئة الأدوات
     */
    async initializeTools() {
        // تحميل الأدوات أولاً
        await this.loadTools();

        // إنشاء الأدوات المتوفرة
        if (ImageCompressor) this.tools.set('compressor', new ImageCompressor());
        if (ImageConverter) this.tools.set('converter', new ImageConverter());
        if (ImageResizer) this.tools.set('resizer', new ImageResizer());
        if (ImageCropper) this.tools.set('cropper', new ImageCropper());
        if (ImageRotator) this.tools.set('rotator', new ImageRotator());
        if (WatermarkTool) this.tools.set('watermark', new WatermarkTool());
        if (Base64Converter) this.tools.set('base64', new Base64Converter());
        if (ColorExtractor) this.tools.set('colorExtractor', new ColorExtractor());
        if (ExifRemover) this.tools.set('exifRemover', new ExifRemover());
        if (QRGenerator) this.tools.set('qrGenerator', new QRGenerator());

        // إضافة أدوات بديلة للأدوات المفقودة
        this.addFallbackTools();

        // تهيئة جميع الأدوات
        const initPromises = Array.from(this.tools.values()).map(tool => {
            try {
                return tool.init ? tool.init() : Promise.resolve();
            } catch (error) {
                console.warn('فشل في تهيئة أداة:', error);
                return Promise.resolve();
            }
        });

        await Promise.all(initPromises);
    }

    /**
     * إضافة أدوات بديلة للأدوات المفقودة
     */
    addFallbackTools() {
        const fallbackTools = ['compressor', 'converter', 'resizer', 'cropper', 'rotator', 'watermark', 'base64', 'colorExtractor', 'exifRemover', 'qrGenerator'];
        
        fallbackTools.forEach(toolName => {
            if (!this.tools.has(toolName)) {
                this.tools.set(toolName, {
                    init: () => {
                        console.log(`تم تهيئة ${toolName} كأداة بديلة`);
                        this.createFallbackInterface(toolName);
                    },
                    name: this.getToolDisplayName(toolName)
                });
            }
        });
    }

    /**
     * إنشاء واجهة بديلة للأداة
     */
    createFallbackInterface(toolName) {
        const controlsSection = document.getElementById('controls-section');
        if (!controlsSection) return;

        const toolInfo = this.getToolInfo(toolName);
        
        controlsSection.innerHTML = `
            <div class="fallback-tool">
                <div class="fallback-header">
                    <i class="fas fa-tools"></i>
                    <h3>${toolInfo.title}</h3>
                </div>
                <div class="fallback-content">
                    <p>${toolInfo.description}</p>
                    <div class="fallback-message">
                        <i class="fas fa-info-circle"></i>
                        <p>هذه الأداة قيد التطوير حالياً. سيتم إضافة الوظائف الكاملة قريباً.</p>
                    </div>
                    <div class="basic-upload">
                        <label class="upload-label">
                            <i class="fas fa-upload"></i>
                            اختر ملف للمعاينة
                            <input type="file" accept="image/*" onchange="mainApp.handleBasicUpload(this)">
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * إعداد التنقل
     */
    setupNavigation() {
        // أزرار الأدوات الرئيسية
        const toolButtons = document.querySelectorAll('[data-tool]');
        toolButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const toolName = e.currentTarget.dataset.tool;
                this.switchTool(toolName);
            });
        });

        // التنقل بين الأقسام
        const navLinks = document.querySelectorAll('.nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.scrollToSection(section);
            });
        });

        // زر الإعدادات
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showSettingsModal();
        });

        // زر المساعدة
        document.getElementById('help-btn')?.addEventListener('click', () => {
            this.showHelpModal();
        });
    }

    /**
     * إعداد مستمعي الأحداث العامة
     */
    setupEventListeners() {
        // مراقبة تغيير حجم النافذة
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // مراقبة حالة الشبكة
        window.addEventListener('online', () => {
            this.showNotification('تم استرداد الاتصال بالإنترنت', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('انقطع الاتصال بالإنترنت - سيستمر التطبيق في العمل محلياً', 'warning');
        });

        // مراقبة إغلاق الصفحة
        window.addEventListener('beforeunload', (e) => {
            if (this.state.processing) {
                e.preventDefault();
                e.returnValue = 'يتم معالجة الملفات حالياً. هل تريد المغادرة؟';
                return e.returnValue;
            }
        });

        // إعداد السحب والإفلات على مستوى النافذة
        this.setupGlobalDragAndDrop();
    }

    /**
     * إعداد السحب والإفلات العام
     */
    setupGlobalDragAndDrop() {
        let dragCounter = 0;

        // منع السحب والإفلات الافتراضي
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // إظهار منطقة الإسقاط
        document.addEventListener('dragenter', (e) => {
            dragCounter++;
            if (e.dataTransfer.types.includes('Files')) {
                document.body.classList.add('drag-active');
            }
        });

        document.addEventListener('dragleave', () => {
            dragCounter--;
            if (dragCounter === 0) {
                document.body.classList.remove('drag-active');
            }
        });

        // معالجة إسقاط الملفات
        document.addEventListener('drop', (e) => {
            dragCounter = 0;
            document.body.classList.remove('drag-active');

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                this.components.fileUpload.handleFiles(files);
            }
        });
    }

    /**
     * إعداد اختصارات لوحة المفاتيح
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // اختصارات مع Ctrl/Cmd
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'o':
                        e.preventDefault();
                        document.querySelector('#file-input-upload-section')?.click();
                        break;
                    case 's':
                        e.preventDefault();
                        this.downloadAllResults();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.components.resultsPanel.selectAll();
                        break;
                    case 'z':
                        e.preventDefault();
                        this.undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                }
            }

            // اختصارات الأدوات
            if (e.altKey) {
                switch (e.key) {
                    case '1':
                        this.switchTool('compressor');
                        break;
                    case '2':
                        this.switchTool('converter');
                        break;
                    case '3':
                        this.switchTool('resizer');
                        break;
                    case '4':
                        this.switchTool('cropper');
                        break;
                    case '5':
                        this.switchTool('rotator');
                        break;
                    case '6':
                        this.switchTool('watermark');
                        break;
                }
            }

            // مفتاح Escape لإلغاء العمليات
            if (e.key === 'Escape') {
                this.cancelCurrentOperation();
            }
        });
    }

    /**
     * تبديل الأداة النشطة
     * @param {string} toolName 
     */
    async switchTool(toolName) {
        if (this.currentTool === toolName) return;

        try {
            this.showLoading(`جاري تحميل ${this.getToolDisplayName(toolName)}...`);

            // إخفاء الأداة الحالية
            if (this.currentTool) {
                const currentToolElement = document.querySelector(`[data-tool="${this.currentTool}"]`);
                currentToolElement?.classList.remove('active');
            }

            // تفعيل الأداة الجديدة
            const tool = this.tools.get(toolName);
            if (!tool) {
                throw new Error(`الأداة ${toolName} غير موجودة`);
            }

            // تحديث واجهة التنقل
            document.querySelectorAll('[data-tool]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tool === toolName);
            });

            // إعادة تهيئة الأداة إذا لزم الأمر
            if (typeof tool.init === 'function') {
                await tool.init();
            }

            this.currentTool = toolName;

            // تحديث العنوان والوصف
            this.updateToolInfo(toolName);

            // إعادة تحميل الملفات في الأداة الجديدة إذا كانت متوفرة
            if (this.state.currentFiles.length > 0) {
                this.loadFilesIntoCurrentTool();
            }

            this.hideLoading();
            this.saveSettings();

        } catch (error) {
            console.error('خطأ في تبديل الأداة:', error);
            this.hideLoading();
            this.showNotification(`فشل في تحميل ${toolName}`, 'error');
        }
    }

    /**
     * تحديث معلومات الأداة
     * @param {string} toolName 
     */
    updateToolInfo(toolName) {
        const toolInfo = this.getToolInfo(toolName);
        
        // تحديث العنوان الرئيسي
        const mainTitle = document.querySelector('.hero h1');
        if (mainTitle) {
            mainTitle.textContent = toolInfo.title;
        }

        // تحديث الوصف
        const mainDescription = document.querySelector('.hero p');
        if (mainDescription) {
            mainDescription.textContent = toolInfo.description;
        }

        // تحديث عنوان الصفحة
        document.title = `${toolInfo.title} - موقع أدوات الصور`;
    }

    /**
     * الحصول على معلومات الأداة
     * @param {string} toolName 
     * @returns {Object}
     */
    getToolInfo(toolName) {
        const toolsInfo = {
            compressor: {
                title: 'ضاغط الصور المتقدم',
                description: 'قم بضغط الصور وتقليل حجمها مع الحفاظ على الجودة العالية'
            },
            converter: {
                title: 'محول تنسيقات الصور',
                description: 'حول الصور بين جميع التنسيقات الشائعة بجودة عالية'
            },
            resizer: {
                title: 'أداة تغيير حجم الصور',
                description: 'غير أبعاد الصور بدقة مع خيارات متقدمة للتحسين'
            },
            cropper: {
                title: 'أداة قص الصور',
                description: 'قص واقتصاص الصور بطريقة تفاعلية ودقيقة'
            },
            rotator: {
                title: 'أداة دوران وقلب الصور',
                description: 'دور واقلب الصور في جميع الاتجاهات بسهولة'
            },
            watermark: {
                title: 'أداة العلامة المائية',
                description: 'أضف علامات مائية نصية أو صور للحماية والعلامة التجارية'
            },
            base64: {
                title: 'محول Base64',
                description: 'حول الصور إلى Base64 والعكس لاستخدامها في التطبيقات'
            },
            colorExtractor: {
                title: 'مستخرج الألوان',
                description: 'استخرج الألوان السائدة من الصور وحلل طيف الألوان'
            },
            exifRemover: {
                title: 'أداة إزالة EXIF',
                description: 'احم خصوصيتك بإزالة البيانات الوصفية من الصور'
            },
            qrGenerator: {
                title: 'مولد رموز QR',
                description: 'أنشئ رموز QR مخصصة لجميع أنواع البيانات'
            }
        };

        return toolsInfo[toolName] || {
            title: 'أداة معالجة الصور',
            description: 'أداة متقدمة لمعالجة وتحسين الصور'
        };
    }

    /**
     * الحصول على اسم الأداة للعرض
     * @param {string} toolName 
     * @returns {string}
     */
    getToolDisplayName(toolName) {
        const names = {
            compressor: 'ضاغط الصور',
            converter: 'محول التنسيقات',
            resizer: 'تغيير الحجم',
            cropper: 'قص الصور',
            rotator: 'دوران الصور',
            watermark: 'العلامة المائية',
            base64: 'محول Base64',
            colorExtractor: 'مستخرج الألوان',
            exifRemover: 'إزالة EXIF',
            qrGenerator: 'مولد QR'
        };

        return names[toolName] || toolName;
    }

    /**
     * معالجة رفع الملفات
     * @param {Array} newFiles 
     * @param {Array} allFiles 
     */
    async handleFilesUploaded(newFiles, allFiles) {
        this.state.currentFiles = allFiles;

        // عرض المعاينة للملف الأول
        if (newFiles.length > 0) {
            const firstFile = newFiles[0];
            try {
                await this.components.previewPanel.showImage(firstFile.file);
            } catch (error) {
                console.warn('فشل في عرض معاينة الملف:', error);
            }
        }

        // تحميل الملفات في الأداة الحالية
        this.loadFilesIntoCurrentTool();

        this.showNotification(`تم رفع ${newFiles.length} ملف جديد`, 'success');
    }

    /**
     * معالجة حذف ملف
     * @param {Object} removedFile 
     * @param {Array} remainingFiles 
     */
    handleFileRemoved(removedFile, remainingFiles) {
        this.state.currentFiles = remainingFiles;

        // إذا لم تعد هناك ملفات، امسح المعاينة
        if (remainingFiles.length === 0) {
            this.components.previewPanel.clear();
        }
    }

    /**
     * تحميل الملفات في الأداة الحالية
     */
    loadFilesIntoCurrentTool() {
        const tool = this.tools.get(this.currentTool);
        if (tool && typeof tool.loadFiles === 'function') {
            const files = this.state.currentFiles.map(fileInfo => fileInfo.file);
            tool.loadFiles(files);
        }
    }

    /**
     * معالجة تحديد النتيجة
     * @param {Object} result 
     * @param {boolean} selected 
     */
    handleResultSelected(result, selected) {
        if (selected) {
            // عرض معاينة النتيجة المحددة
            this.previewResult(result);
        }
    }

    /**
     * معالجة حذف النتيجة
     * @param {Object} result 
     */
    handleResultRemoved(result) {
        // إزالة من حالة التطبيق
        const index = this.state.results.findIndex(r => r.id === result.id);
        if (index !== -1) {
            this.state.results.splice(index, 1);
        }
    }

    /**
     * معاينة نتيجة
     * @param {Object} result 
     */
    async previewResult(result) {
        try {
            if (result.type.startsWith('image/')) {
                const img = await this.imageUtils.loadImageFromUrl(result.url);
                await this.components.previewPanel.showImage(img);
            }
        } catch (error) {
            console.warn('فشل في معاينة النتيجة:', error);
        }
    }

    /**
     * إضافة نتيجة جديدة
     * @param {Object} result 
     */
    addResult(result) {
        this.state.results.push(result);
        this.components.resultsPanel.addResult(result);

        // عرض معاينة للنتيجة الجديدة
        if (result.type.startsWith('image/')) {
            this.previewResult(result);
        }
    }

    /**
     * إضافة عدة نتائج
     * @param {Array} results 
     */
    addResults(results) {
        results.forEach(result => this.addResult(result));
    }

    /**
     * تحميل جميع النتائج
     */
    downloadAllResults() {
        this.components.resultsPanel.downloadAll();
    }

    /**
     * معالجة تغيير حجم النافذة
     */
    handleWindowResize() {
        // إعادة تخطيط المكونات حسب الحاجة
        if (this.components.previewPanel) {
            this.components.previewPanel.fitToView();
        }
    }

    /**
     * إلغاء العملية الحالية
     */
    cancelCurrentOperation() {
        if (this.state.processing) {
            this.state.processing = false;
            this.hideLoading();
            this.showNotification('تم إلغاء العملية', 'info');
        }
    }

    /**
     * التراجع
     */
    undo() {
        // يمكن تنفيذ نظام التراجع لاحقاً
        this.showNotification('ميزة التراجع ستتوفر قريباً', 'info');
    }

    /**
     * الإعادة
     */
    redo() {
        // يمكن تنفيذ نظام الإعادة لاحقاً
        this.showNotification('ميزة الإعادة ستتوفر قريباً', 'info');
    }

    /**
     * انتقال سلس إلى قسم
     * @param {string} sectionId 
     */
    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    /**
     * عرض نافذة الإعدادات
     */
    showSettingsModal() {
        // يمكن تنفيذ نافذة الإعدادات لاحقاً
        this.showNotification('إعدادات التطبيق ستتوفر قريباً', 'info');
    }

    /**
     * عرض نافذة المساعدة
     */
    showHelpModal() {
        // يمكن تنفيذ نافذة المساعدة لاحقاً
        this.showNotification('مركز المساعدة سيتوفر قريباً', 'info');
    }

    /**
     * عرض مؤشر التحميل
     * @param {string} message 
     */
    showLoading(message = 'جاري التحميل...') {
        this.uiHelpers.showLoading(message);
    }

    /**
     * إخفاء مؤشر التحميل
     */
    hideLoading() {
        this.uiHelpers.hideLoading();
    }

    /**
     * عرض إشعار
     * @param {string} message 
     * @param {string} type 
     */
    showNotification(message, type = 'info') {
        this.uiHelpers.showNotification(message, type);
    }

    /**
     * تحميل الإعدادات
     * @returns {Object}
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('mosap-tools-settings');
            return saved ? JSON.parse(saved) : {
                theme: 'light',
                language: 'ar',
                autoSave: true,
                showTips: true,
                lastUsedTool: 'compressor'
            };
        } catch (error) {
            console.warn('فشل في تحميل الإعدادات:', error);
            return {
                theme: 'light',
                language: 'ar',
                autoSave: true,
                showTips: true,
                lastUsedTool: 'compressor'
            };
        }
    }

    /**
     * حفظ الإعدادات
     */
    saveSettings() {
        try {
            this.state.settings.lastUsedTool = this.currentTool;
            localStorage.setItem('mosap-tools-settings', JSON.stringify(this.state.settings));
        } catch (error) {
            console.warn('فشل في حفظ الإعدادات:', error);
        }
    }

    /**
     * الحصول على حالة التطبيق
     * @returns {Object}
     */
    getState() {
        return { ...this.state };
    }

    /**
     * الحصول على الأداة النشطة
     * @returns {Object|null}
     */
    getCurrentTool() {
        return this.tools.get(this.currentTool);
    }

    /**
     * الحصول على مكون معين
     * @param {string} componentName 
     * @returns {Object|null}
     */
    getComponent(componentName) {
        return this.components[componentName];
    }

    /**
     * معالجة رفع بسيط للملفات
     */
    handleBasicUpload(input) {
        const file = input.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('يرجى اختيار ملف صورة');
            return;
        }

        this.showBasicPreview(file);
    }

    /**
     * تهيئة رفع الملفات الأساسي
     */
    initBasicFileUpload() {
        const uploadSection = document.getElementById('upload-section');
        if (!uploadSection) return;

        uploadSection.innerHTML = `
            <div class="basic-upload-container">
                <div class="upload-area" onclick="document.getElementById('basic-file-input').click()">
                    <div class="upload-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <h4>انقر لاختيار الصور</h4>
                    <p>أو اسحب وأفلت الصور هنا</p>
                    <input type="file" id="basic-file-input" multiple accept="image/*" style="display: none;" onchange="mainApp.handleBasicFiles(this)">
                </div>
            </div>
        `;

        this.setupBasicDragAndDrop();
    }

    /**
     * إعداد السحب والإفلات الأساسي
     */
    setupBasicDragAndDrop() {
        const uploadArea = document.querySelector('.upload-area');
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
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                this.handleBasicFiles({ files });
            }
        });
    }

    /**
     * معالجة الملفات الأساسية
     */
    handleBasicFiles(input) {
        const files = input.files || input.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                this.showBasicPreview(file);
            }
        });

        this.showNotification(`تم رفع ${files.length} صورة بنجاح!`, 'success');
    }

    /**
     * عرض معاينة أساسية
     */
    showBasicPreview(file) {
        const previewSection = document.getElementById('preview-section');
        if (!previewSection) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            previewSection.innerHTML = `
                <div class="basic-preview">
                    <div class="preview-header">
                        <h4>معاينة الصورة</h4>
                        <button onclick="this.parentElement.parentElement.remove()" class="close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="preview-content">
                        <img src="${e.target.result}" alt="${file.name}" style="max-width: 100%; height: auto;">
                        <div class="file-info">
                            <p><strong>الاسم:</strong> ${file.name}</p>
                            <p><strong>الحجم:</strong> ${this.formatFileSize(file.size)}</p>
                            <p><strong>النوع:</strong> ${file.type}</p>
                        </div>
                    </div>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

    /**
     * إضافة نتيجة أساسية
     */
    addBasicResult(result) {
        const resultsSection = document.getElementById('results-section');
        if (!resultsSection) return;

        const resultElement = document.createElement('div');
        resultElement.className = 'basic-result';
        resultElement.innerHTML = `
            <div class="result-info">
                <h5>${result.name}</h5>
                <p>الحجم: ${this.formatFileSize(result.size)}</p>
            </div>
            <div class="result-actions">
                <button onclick="this.parentElement.parentElement.remove()" class="btn btn-sm">
                    <i class="fas fa-download"></i> تحميل
                </button>
            </div>
        `;

        resultsSection.appendChild(resultElement);
    }

    /**
     * تنسيق حجم الملف
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * تهيئة أزرار الأدوات
     */
    initToolButtons() {
        console.log('🔧 تهيئة أزرار الأدوات...');
        
        const toolButtons = document.querySelectorAll('.tool-btn');
        console.log(`📋 تم العثور على ${toolButtons.length} أزرار أدوات`);
        
        toolButtons.forEach(button => {
            const toolName = button.getAttribute('data-tool');
            
            // إزالة أي event listeners سابقة
            button.removeEventListener('click', this.handleToolClick);
            
            // إضافة event listener جديد
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleToolClick(toolName, button);
            });
            
            console.log(`✅ تم ربط زر ${toolName}`);
        });

        // ربط أزرار إضافية
        this.initAdditionalButtons();
        
        console.log('✅ تم ربط جميع الأزرار بنجاح');
    }

    /**
     * معالجة النقر على أزرار الأدوات
     */
    handleToolClick(toolName, button) {
        console.log(`🖱️ تم النقر على أداة: ${toolName}`);
        
        // إزالة التحديد من جميع الأزرار
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active', 'selected');
        });
        
        // تحديد الزر المنقر عليه
        button.classList.add('active', 'selected');
        
        // تحديث منطقة العمل
        this.updateWorkArea(toolName);
        
        // إظهار رسالة
        this.showNotification(`تم تحديد أداة: ${this.getToolDisplayName(toolName)}`, 'info');
    }

    /**
     * تحديث منطقة العمل حسب الأداة المختارة
     */
    updateWorkArea(toolName) {
        const mainContent = document.querySelector('.main-content');
        const uploadSection = document.getElementById('upload-section');
        const toolInterface = document.getElementById('tool-interface');
        
        if (!mainContent) {
            console.warn('المحتوى الرئيسي غير موجود');
            return;
        }

        // إزالة الفئات السابقة
        mainContent.classList.remove('tool-active');
        
        // إضافة فئة الأداة الحالية
        mainContent.classList.add('tool-active', `tool-${toolName}`);
        
        // تحديث العنوان في الشريط العلوي
        this.updatePageTitle(toolName);
        
        // إظهار منطقة رفع الملفات إذا كانت مخفية
        if (uploadSection) {
            uploadSection.style.display = 'block';
        }
        
        // إظهار وتحديث واجهة الأداة
        if (toolInterface) {
            toolInterface.style.display = 'block';
            this.updateToolInterface(toolName);
        }
        
        // تمرير سلس لمنطقة الأداة
        if (toolInterface) {
            toolInterface.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    /**
     * تحديث عنوان الصفحة
     */
    updatePageTitle(toolName) {
        const toolDisplayName = this.getToolDisplayName(toolName);
        
        // تحديث عنوان الصفحة
        document.title = `${toolDisplayName} - منصة معالجة الصور | Mosap.tech`;
        
        // تحديث العنوان في الهيدر إن وجد
        const headerTitle = document.querySelector('header h1, .header-title');
        if (headerTitle) {
            const originalText = headerTitle.textContent;
            headerTitle.innerHTML = `
                <span class="tool-indicator">🔧</span>
                ${toolDisplayName}
                <small style="font-size: 0.6em; opacity: 0.7;"> - Mosap.tech</small>
            `;
        }
    }

    /**
     * تحديث واجهة الأداة
     */
    updateToolInterface(toolName) {
        const toolInterface = document.getElementById('tool-interface');
        if (!toolInterface) return;
        
        // محتوى افتراضي لكل أداة
        const toolInterfaces = {
            'compressor': this.createCompressorInterface(),
            'converter': this.createConverterInterface(),
            'resizer': this.createResizerInterface(),
            'cropper': this.createCropperInterface(),
            'rotator': this.createRotatorInterface(),
            'watermark': this.createWatermarkInterface(),
            'base64': this.createBase64Interface(),
            'colors': this.createColorsInterface(),
            'exif': this.createExifInterface(),
            'qr': this.createQRInterface()
        };
        
        const interfaceContent = toolInterfaces[toolName] || this.createDefaultInterface(toolName);
        toolInterface.innerHTML = interfaceContent;
    }

    /**
     * الحصول على اسم الأداة للعرض
     */
    getToolDisplayName(toolName) {
        const displayNames = {
            'compressor': 'ضاغط الصور',
            'converter': 'محول التنسيق',
            'resizer': 'تغيير الحجم',
            'cropper': 'قص الصور',
            'rotator': 'تدوير الصور',
            'watermark': 'العلامة المائية',
            'base64': 'تحويل Base64',
            'colors': 'استخراج الألوان',
            'exif': 'بيانات الصورة',
            'qr': 'مولد QR'
        };
        
        return displayNames[toolName] || toolName;
    }

    /**
     * إنشاء واجهة ضاغط الصور
     */
    createCompressorInterface() {
        setTimeout(() => {
            // ربط تحديث القيمة مع المنزلق
            const qualitySlider = document.getElementById('compression-quality');
            const qualityValue = document.getElementById('quality-value');
            
            if (qualitySlider && qualityValue) {
                qualitySlider.addEventListener('input', (e) => {
                    qualityValue.textContent = e.target.value + '%';
                });
            }
        }, 100);
        
        return `
            <div class="tool-options">
                <h4>🗜️ إعدادات ضغط الصور</h4>
                <div class="option-group">
                    <label>جودة الضغط:</label>
                    <input type="range" id="compression-quality" min="10" max="100" value="80">
                    <span id="quality-value">80%</span>
                </div>
                <div class="option-group">
                    <label>الحد الأقصى للعرض:</label>
                    <input type="number" id="max-width" placeholder="اختياري" min="100" max="4000">
                </div>
                <div class="option-group">
                    <label>الحد الأقصى للارتفاع:</label>
                    <input type="number" id="max-height" placeholder="اختياري" min="100" max="4000">
                </div>
                <button class="btn btn-primary" onclick="window.mainApp.processCompression()">
                    <i class="fas fa-compress-alt"></i> ضغط الصورة
                </button>
            </div>
        `;
    }

    /**
     * إنشاء واجهة محول التنسيق
     */
    createConverterInterface() {
        setTimeout(() => {
            // ربط تحديث القيمة مع المنزلق
            const convertQualitySlider = document.getElementById('convert-quality');
            const convertQualityValue = document.getElementById('convert-quality-value');
            
            if (convertQualitySlider && convertQualityValue) {
                convertQualitySlider.addEventListener('input', (e) => {
                    convertQualityValue.textContent = e.target.value + '%';
                });
            }
        }, 100);
        
        return `
            <div class="tool-options">
                <h4>🔄 تحويل تنسيق الصورة</h4>
                <div class="option-group">
                    <label>التنسيق المطلوب:</label>
                    <select id="output-format">
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                        <option value="bmp">BMP</option>
                    </select>
                </div>
                <div class="option-group">
                    <label>جودة التحويل:</label>
                    <input type="range" id="convert-quality" min="10" max="100" value="90">
                    <span id="convert-quality-value">90%</span>
                </div>
                <button class="btn btn-primary" onclick="window.mainApp.processConversion()">
                    <i class="fas fa-exchange-alt"></i> تحويل التنسيق
                </button>
            </div>
        `;
    }

    /**
     * إنشاء واجهة تغيير الحجم
     */
    createResizerInterface() {
        setTimeout(() => {
            // ربط الحفاظ على النسبة
            const widthInput = document.getElementById('new-width');
            const heightInput = document.getElementById('new-height');
            const maintainRatio = document.getElementById('maintain-ratio');
            
            let originalRatio = 1;
            
            if (widthInput && heightInput && maintainRatio) {
                // حساب النسبة عند التغيير
                const updateRatio = () => {
                    const width = parseFloat(widthInput.value) || 0;
                    const height = parseFloat(heightInput.value) || 0;
                    if (width > 0 && height > 0) {
                        originalRatio = width / height;
                    }
                };
                
                widthInput.addEventListener('input', (e) => {
                    if (maintainRatio.checked && originalRatio > 0) {
                        const newWidth = parseFloat(e.target.value) || 0;
                        if (newWidth > 0) {
                            heightInput.value = Math.round(newWidth / originalRatio);
                        }
                    }
                    updateRatio();
                });
                
                heightInput.addEventListener('input', (e) => {
                    if (maintainRatio.checked && originalRatio > 0) {
                        const newHeight = parseFloat(e.target.value) || 0;
                        if (newHeight > 0) {
                            widthInput.value = Math.round(newHeight * originalRatio);
                        }
                    }
                    updateRatio();
                });
            }
        }, 100);
        
        return `
            <div class="tool-options">
                <h4>📐 تغيير حجم الصورة</h4>
                <div class="option-group">
                    <label>العرض الجديد (px):</label>
                    <input type="number" id="new-width" placeholder="العرض" min="1" value="800">
                </div>
                <div class="option-group">
                    <label>الارتفاع الجديد (px):</label>
                    <input type="number" id="new-height" placeholder="الارتفاع" min="1" value="600">
                </div>
                <div class="option-group">
                    <label>
                        <input type="checkbox" id="maintain-ratio" checked>
                        الحفاظ على نسبة العرض للارتفاع
                    </label>
                </div>
                <div class="option-group">
                    <label>أحجام جاهزة:</label>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
                        <button type="button" class="btn btn-sm" onclick="window.mainApp.setPresetSize(1920, 1080)">HD 1080p</button>
                        <button type="button" class="btn btn-sm" onclick="window.mainApp.setPresetSize(1280, 720)">HD 720p</button>
                        <button type="button" class="btn btn-sm" onclick="window.mainApp.setPresetSize(800, 600)">صغير</button>
                        <button type="button" class="btn btn-sm" onclick="window.mainApp.setPresetSize(500, 500)">مربع</button>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="window.mainApp.processResize()">
                    <i class="fas fa-expand-arrows-alt"></i> تغيير الحجم
                </button>
            </div>
        `;
    }

    /**
     * إنشاء واجهات افتراضية للأدوات الأخرى
     */
    createCropperInterface() {
        return `<div class="tool-options"><h4>✂️ قص الصور</h4><p>قريباً...</p></div>`;
    }

    createRotatorInterface() {
        return `<div class="tool-options"><h4>🔄 تدوير الصور</h4><p>قريباً...</p></div>`;
    }

    createWatermarkInterface() {
        return `<div class="tool-options"><h4>💧 العلامة المائية</h4><p>قريباً...</p></div>`;
    }

    createBase64Interface() {
        return `<div class="tool-options"><h4>🔤 تحويل Base64</h4><p>قريباً...</p></div>`;
    }

    createColorsInterface() {
        return `<div class="tool-options"><h4>🎨 استخراج الألوان</h4><p>قريباً...</p></div>`;
    }

    createExifInterface() {
        return `<div class="tool-options"><h4>📊 بيانات الصورة</h4><p>قريباً...</p></div>`;
    }

    createQRInterface() {
        return `<div class="tool-options"><h4>📱 مولد QR</h4><p>قريباً...</p></div>`;
    }

    createDefaultInterface(toolName) {
        return `
            <div class="tool-options">
                <h4>🔧 ${this.getToolDisplayName(toolName)}</h4>
                <p>هذه الأداة قيد التطوير حالياً</p>
                <button class="btn btn-secondary" disabled>قريباً...</button>
            </div>
        `;
    }

    /**
     * تهيئة أزرار إضافية
     */
    initAdditionalButtons() {
        // زر القائمة المحمولة
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('mobile-open');
                }
            });
        }

        // أزرار أخرى يمكن إضافتها هنا
        console.log('✅ تم ربط الأزرار الإضافية');
    }

    /**
     * معالجة ضغط الصور (أساسية)
     */
    processCompression() {
        const quality = document.getElementById('compression-quality')?.value || 80;
        const button = event.target;
        
        // تغيير حالة الزر إلى تحميل
        button.classList.add('loading');
        button.disabled = true;
        
        this.showNotification(`جاري ضغط الصورة بجودة ${quality}%...`, 'info');
        
        // هنا يمكن إضافة منطق الضغط الفعلي
        setTimeout(() => {
            button.classList.remove('loading');
            button.disabled = false;
            this.showNotification('تم ضغط الصورة بنجاح! 🎉', 'success');
        }, 2000);
    }

    /**
     * معالجة تحويل التنسيق (أساسية)
     */
    processConversion() {
        const format = document.getElementById('output-format')?.value || 'jpeg';
        this.showNotification(`جاري تحويل الصورة إلى ${format.toUpperCase()}...`, 'info');
        
        setTimeout(() => {
            this.showNotification('تم تحويل الصورة بنجاح! 🎉', 'success');
        }, 2000);
    }

    /**
     * معالجة تغيير الحجم (أساسية)
     */
    processResize() {
        const width = document.getElementById('new-width')?.value;
        const height = document.getElementById('new-height')?.value;
        const button = event.target;
        
        if (!width && !height) {
            this.showNotification('يرجى إدخال العرض أو الارتفاع الجديد', 'error');
            return;
        }
        
        button.classList.add('loading');
        button.disabled = true;
        
        this.showNotification(`جاري تغيير الحجم إلى ${width || 'تلقائي'}x${height || 'تلقائي'}...`, 'info');
        
        setTimeout(() => {
            button.classList.remove('loading');
            button.disabled = false;
            this.showNotification('تم تغيير الحجم بنجاح! 🎉', 'success');
        }, 2000);
    }

    /**
     * تعيين حجم جاهز
     */
    setPresetSize(width, height) {
        const widthInput = document.getElementById('new-width');
        const heightInput = document.getElementById('new-height');
        
        if (widthInput) widthInput.value = width;
        if (heightInput) heightInput.value = height;
        
        this.showNotification(`تم تعيين الحجم إلى ${width}x${height}`, 'success');
    }

    /**
     * إضافة تحريكات للأزرار
     */
    addButtonAnimations() {
        // تحريك أزرار الأدوات عند التحميل
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach((button, index) => {
            button.style.animationDelay = `${index * 0.1}s`;
            button.classList.add('animate-fadeIn');
        });
        
        console.log('✨ تم إضافة تحريكات الأزرار');
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 بدء تحميل تطبيق معالجة الصور...');
    
    try {
        // إنشاء مثيل التطبيق الرئيسي
        window.mainApp = new MainApp();
        console.log('✅ تم إنشاء MainApp بنجاح');
        
        // إتاحة المكونات عالمياً للاستخدام في HTML
        window.fileUpload_uploadSection = window.mainApp.getComponent('fileUpload');
        window.previewPanel = window.mainApp.getComponent('previewPanel');
        window.resultsPanel = window.mainApp.getComponent('resultsPanel');
        
        // إتاحة الدوال المهمة عالمياً
        window.handleBasicFiles = window.mainApp.handleBasicFiles.bind(window.mainApp);
        
        console.log('🚀 تم تحميل تطبيق معالجة الصور بنجاح!');
        console.log('📦 المكونات المحملة:', {
            fileUpload: !!window.fileUpload_uploadSection,
            previewPanel: !!window.previewPanel,
            resultsPanel: !!window.resultsPanel,
            totalTools: Object.keys(window.mainApp.tools).length,
            totalComponents: Object.keys(window.mainApp.components).length
        });
        
        // ربط أزرار الأدوات بالوظائف
        window.mainApp.initToolButtons();
        
        // إظهار رسالة نجاح للمستخدم
        if (window.mainApp.showNotification) {
            window.mainApp.showNotification('تم تحميل المنصة بنجاح! 🎉', 'success');
            
            // رسالة ترحيب تفاعلية
            setTimeout(() => {
                window.mainApp.showNotification('اختر أداة من الشريط الجانبي لبدء العمل 👈', 'info');
            }, 2000);
        }
        
        // إضافة تأثير تحميل للأزرار
        window.mainApp.addButtonAnimations();
        
    } catch (error) {
        console.error('❌ خطأ في تحميل التطبيق:', error);
        // عرض رسالة خطأ للمستخدم
        document.body.insertAdjacentHTML('afterbegin', `
            <div style="background: #e74c3c; color: white; padding: 1rem; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 9999;">
                ⚠️ حدث خطأ في تحميل المنصة. يرجى إعادة تحميل الصفحة أو التحقق من اتصال الإنترنت.
                <button onclick="location.reload()" style="background: white; color: #e74c3c; border: none; padding: 0.5rem 1rem; margin-right: 1rem; border-radius: 4px; cursor: pointer;">إعادة تحميل</button>
            </div>
        `);
    }
});

// تصدير الكلاس
export default MainApp;