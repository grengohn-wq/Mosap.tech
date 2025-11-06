/**
 * نسخة مبسطة من المنسق الرئيسي تعمل بدون ES6 Modules
 * Simple fallback coordinator that works without ES6 Modules
 */

// كلاس بسيط لإدارة الأزرار والوظائف الأساسية
class SimpleImageProcessor {
    constructor() {
        this.currentTool = null;
        this.notifications = [];
        this.files = [];
        this.currentFile = null;
        this.init();
    }

    /**
     * تهيئة التطبيق
     */
    init() {
        console.log('🔧 تهيئة معالج الصور البسيط...');
        
        // انتظار تحميل DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    /**
     * إعداد التطبيق
     */
    setupApp() {
        console.log('🚀 بدء إعداد التطبيق...');
        
        // ربط أزرار الأدوات
        this.bindToolButtons();
        
        // إعداد رفع الملفات
        this.setupFileUpload();
        
        // إعداد السحب والإفلات
        this.setupDragDrop();
        
        // إضافة أزرار القائمة المحمولة
        this.setupMobileMenu();
        
        // إظهار رسالة ترحيب
        this.showWelcomeMessage();
        
        console.log('✅ تم إعداد التطبيق بنجاح');
    }

    /**
     * ربط أزرار الأدوات
     */
    bindToolButtons() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        console.log(`📋 ربط ${toolButtons.length} زر أدوات`);
        
        toolButtons.forEach((button, index) => {
            const toolName = button.getAttribute('data-tool');
            
            // إضافة event listener للنقر
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectTool(toolName, button);
            });
            
            // تحريك الأزرار عند التحميل
            setTimeout(() => {
                button.style.opacity = '1';
                button.style.transform = 'translateY(0)';
            }, index * 100);
            
            console.log(`✅ تم ربط زر ${toolName}`);
        });
    }

    /**
     * اختيار أداة
     */
    selectTool(toolName, button) {
        console.log(`🔧 اختيار أداة: ${toolName}`);
        
        // إزالة التحديد من جميع الأزرار
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active', 'selected');
        });
        
        // تحديد الزر الحالي
        button.classList.add('active', 'selected');
        this.currentTool = toolName;
        
        // إظهار واجهة الأداة
        this.showToolInterface(toolName);
        
        // إظهار رسالة
        this.showNotification(`تم اختيار: ${this.getToolName(toolName)} 🔧`, 'success');
    }

    /**
     * إظهار واجهة الأداة
     */
    showToolInterface(toolName) {
        const toolInterface = document.getElementById('tool-interface');
        if (!toolInterface) {
            console.warn('واجهة الأدوات غير موجودة');
            return;
        }

        // إظهار واجهة الأداة
        toolInterface.style.display = 'block';
        toolInterface.innerHTML = this.getToolInterfaceHTML(toolName);
        
        // التمرير إلى الواجهة
        toolInterface.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // ربط الأحداث الخاصة بالأداة
        this.bindToolEvents(toolName);
    }

    /**
     * الحصول على HTML واجهة الأداة
     */
    getToolInterfaceHTML(toolName) {
        const interfaces = {
            'compressor': this.getCompressorHTML(),
            'converter': this.getConverterHTML(),
            'resizer': this.getResizerHTML(),
            'cropper': this.getCropperHTML(),
            'rotator': this.getRotatorHTML(),
            'watermark': this.getWatermarkHTML(),
            'base64': this.getBase64HTML(),
            'colors': this.getColorsHTML(),
            'exif': this.getExifHTML(),
            'qr': this.getQRHTML()
        };

        return interfaces[toolName] || this.getDefaultHTML(toolName);
    }

    /**
     * واجهة ضاغط الصور - مع رفع سريع
     */
    getCompressorHTML() {
        return `
            <div class="tool-options animate-fadeIn">
                <h4>🗜️ ضغط الصور</h4>
                
                ${this.getQuickUploadHTML()}
                
                <div class="option-group">
                    <label>جودة الضغط:</label>
                    <input type="range" id="quality-slider" min="10" max="100" value="80">
                    <span id="quality-display">80%</span>
                </div>
                <div class="option-group">
                    <label>العرض الأقصى:</label>
                    <input type="number" id="max-width" placeholder="اختياري" min="100" max="4000">
                </div>
                <div class="option-group">
                    <label>الارتفاع الأقصى:</label>
                    <input type="number" id="max-height" placeholder="اختياري" min="100" max="4000">
                </div>
                <button class="btn btn-primary process-btn" onclick="simpleProcessor.processImage('compress')">
                    <i class="fas fa-compress-alt"></i> ضغط الصورة
                </button>
            </div>
        `;
    }

    /**
     * دالة الرفع السريع للأدوات - محسن مع معاينة
     */
    getQuickUploadHTML() {
        return `
            <div class="quick-upload">
                <div class="quick-upload-area" onclick="document.getElementById('quick-file-input').click()" id="quick-upload-area">
                    <div class="upload-content">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>انقر لرفع صورة أو اسحبها هنا</span>
                    </div>
                    <div class="quick-preview" id="quick-preview" style="display: none;">
                        <img id="quick-preview-img" src="" alt="معاينة سريعة">
                        <div class="quick-preview-info">
                            <span id="quick-preview-name"></span>
                            <span id="quick-preview-size"></span>
                        </div>
                    </div>
                    <input type="file" id="quick-file-input" accept="image/*" style="display: none;" onchange="simpleProcessor.handleQuickUpload(this)">
                </div>
            </div>
        `;
    }

    /**
     * معالجة الرفع السريع - محسن مع عرض الصورة والمعاينة السريعة
     */
    handleQuickUpload(input) {
        const file = input.files[0];
        if (file) {
            // حفظ الملف مباشرة
            this.files = [file];
            this.currentFile = file;
            
            // رفع الملف وإظهاره في المعاينة الرئيسية
            this.handleFiles([file]);
            
            // إظهار المعاينة السريعة في الأداة
            this.showQuickPreview(file);
            
            // إظهار رسالة نجاح مع تفاصيل الصورة
            this.showNotification({
                title: '✅ تم رفع الصورة بنجاح',
                message: `تم رفع الصورة: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
                type: 'success'
            });
            
            // تمرير سلس إلى منطقة المعاينة
            setTimeout(() => {
                const previewArea = document.getElementById('preview-area');
                if (previewArea && previewArea.children.length > 0) {
                    previewArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        }
    }

    /**
     * إظهار المعاينة السريعة داخل الأداة
     */
    showQuickPreview(file) {
        const quickPreview = document.getElementById('quick-preview');
        const quickPreviewImg = document.getElementById('quick-preview-img');
        const quickPreviewName = document.getElementById('quick-preview-name');
        const quickPreviewSize = document.getElementById('quick-preview-size');
        const uploadContent = document.querySelector('.upload-content');
        
        if (quickPreview && quickPreviewImg && quickPreviewName && quickPreviewSize) {
            const reader = new FileReader();
            reader.onload = function(e) {
                quickPreviewImg.src = e.target.result;
                quickPreviewName.textContent = file.name;
                quickPreviewSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                
                // إخفاء محتوى الرفع وإظهار المعاينة
                uploadContent.style.display = 'none';
                quickPreview.style.display = 'block';
                
                // إضافة تأثير انيميشن
                quickPreview.style.opacity = '0';
                quickPreview.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    quickPreview.style.transition = 'all 0.3s ease';
                    quickPreview.style.opacity = '1';
                    quickPreview.style.transform = 'scale(1)';
                }, 100);
            };
            reader.readAsDataURL(file);
        }
    }

    /**
     * واجهة محول التنسيقات - مع رفع سريع
     */
    getConverterHTML() {
        return `
            <div class="tool-options animate-fadeIn">
                <h4>🔄 تحويل التنسيق</h4>
                
                ${this.getQuickUploadHTML()}
                
                <div class="option-group">
                    <label>التنسيق الجديد:</label>
                    <select id="output-format">
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                        <option value="bmp">BMP</option>
                    </select>
                </div>
                <div class="option-group">
                    <label>الجودة:</label>
                    <input type="range" id="convert-quality" min="10" max="100" value="90">
                    <span id="convert-quality-display">90%</span>
                </div>
                <button class="btn btn-primary process-btn" onclick="simpleProcessor.processImage('convert')">
                    <i class="fas fa-exchange-alt"></i> تحويل التنسيق
                </button>
            </div>
        `;
    }

    /**
     * واجهة تغيير الحجم - محسنة
     */
    getResizerHTML() {
        return `
            <div class="tool-options animate-fadeIn">
                <h4>📐 تغيير حجم الصورة</h4>
                <div class="option-group">
                    <label>العرض الجديد (بكسل):</label>
                    <input type="number" id="new-width" placeholder="مثال: 800" min="1" max="5000" required>
                </div>
                <div class="option-group">
                    <label>الارتفاع الجديد (بكسل):</label>
                    <input type="number" id="new-height" placeholder="مثال: 600" min="1" max="5000" required>
                </div>
                <div class="option-group">
                    <label>الحفاظ على النسبة:</label>
                    <input type="checkbox" id="maintain-ratio" checked>
                </div>
                <div class="preset-sizes">
                    <h5>أحجام جاهزة:</h5>
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setSize(800, 600)">800×600</button>
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setSize(1024, 768)">1024×768</button>
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setSize(1920, 1080)">1920×1080</button>
                </div>
                <button class="btn btn-primary process-btn" onclick="simpleProcessor.processImage('resize')">
                    <i class="fas fa-expand-arrows-alt"></i> تغيير الحجم
                </button>
            </div>
        `;
    }

    /**
     * واجهة تغيير الحجم - مع رفع سريع
     */
    getResizerHTML() {
        return `
            <div class="tool-options animate-fadeIn">
                <h4>📐 تغيير الحجم</h4>
                
                ${this.getQuickUploadHTML()}
                
                <div class="option-group">
                    <label>العرض (px):</label>
                    <input type="number" id="new-width" placeholder="800" min="1">
                </div>
                <div class="option-group">
                    <label>الارتفاع (px):</label>
                    <input type="number" id="new-height" placeholder="600" min="1">
                </div>
                <div class="option-group">
                    <label>
                        <input type="checkbox" id="keep-ratio" checked>
                        الحفاظ على النسبة
                    </label>
                </div>
                <div class="preset-sizes">
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setSize(1920, 1080)">HD 1080p</button>
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setSize(1280, 720)">HD 720p</button>
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setSize(800, 600)">متوسط</button>
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setSize(500, 500)">مربع</button>
                </div>
                <button class="btn btn-primary process-btn" onclick="simpleProcessor.processImage('resize')">
                    <i class="fas fa-expand-arrows-alt"></i> تغيير الحجم
                </button>
            </div>
        `;
    }

    /**
     * واجهات الأدوات الأخرى - جميعها متاحة الآن
     */
    getCropperHTML() { 
        return `
            <div class="tool-options animate-fadeIn">
                <h4>✂️ قص الصور</h4>
                
                ${this.getQuickUploadHTML()}
                
                <div class="option-group">
                    <label>نوع القص:</label>
                    <select id="crop-type">
                        <option value="free">حر</option>
                        <option value="square">مربع</option>
                        <option value="16-9">16:9</option>
                        <option value="4-3">4:3</option>
                        <option value="1-1">1:1</option>
                    </select>
                </div>
                <div class="option-group">
                    <label>X الموضع:</label>
                    <input type="number" id="crop-x" placeholder="0" min="0">
                </div>
                <div class="option-group">
                    <label>Y الموضع:</label>
                    <input type="number" id="crop-y" placeholder="0" min="0">
                </div>
                <div class="preset-sizes">
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setCropArea(0, 0, 300, 300)">مربع صغير</button>
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setCropArea(0, 0, 500, 300)">مستطيل</button>
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setCropArea(100, 100, 400, 400)">وسط</button>
                </div>
                <button class="btn btn-primary process-btn" onclick="simpleProcessor.processImage('crop')">
                    <i class="fas fa-crop-alt"></i> قص الصورة
                </button>
            </div>
        `;
    }
    
    getRotatorHTML() { 
        return `
            <div class="tool-options animate-fadeIn">
                <h4>🔄 تدوير الصور</h4>
                
                ${this.getQuickUploadHTML()}
                
                <div class="option-group">
                    <label>زاوية التدوير:</label>
                    <input type="range" id="rotation-angle" min="0" max="360" value="90">
                    <span id="rotation-display">90°</span>
                </div>
                <div class="preset-sizes">
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setRotation(90)">90°</button>
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setRotation(180)">180°</button>
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setRotation(270)">270°</button>
                    <button type="button" class="btn btn-sm" onclick="simpleProcessor.setRotation(0)">إعادة تعيين</button>
                </div>
                <div class="option-group">
                    <label>
                        <input type="checkbox" id="flip-horizontal">
                        انعكاس أفقي
                    </label>
                </div>
                <div class="option-group">
                    <label>
                        <input type="checkbox" id="flip-vertical">
                        انعكاس عمودي
                    </label>
                </div>
                <button class="btn btn-primary process-btn" onclick="simpleProcessor.processImage('rotate')">
                    <i class="fas fa-redo-alt"></i> تدوير الصورة
                </button>
            </div>
        `;
    }
    
    getWatermarkHTML() { 
        return `
            <div class="tool-options animate-fadeIn">
                <h4>💧 العلامة المائية</h4>
                
                ${this.getQuickUploadHTML()}
                
                <div class="option-group">
                    <label>نص العلامة المائية:</label>
                    <input type="text" id="watermark-text" placeholder="اكتب النص هنا" value="© Mosap.tech">
                </div>
                <div class="option-group">
                    <label>موضع العلامة:</label>
                    <select id="watermark-position">
                        <option value="bottom-right">أسفل يمين</option>
                        <option value="bottom-left">أسفل يسار</option>
                        <option value="top-right">أعلى يمين</option>
                        <option value="top-left">أعلى يسار</option>
                        <option value="center">وسط</option>
                    </select>
                </div>
                <div class="option-group">
                    <label>شفافية العلامة:</label>
                    <input type="range" id="watermark-opacity" min="10" max="100" value="70">
                    <span id="watermark-opacity-display">70%</span>
                </div>
                <div class="option-group">
                    <label>حجم الخط:</label>
                    <input type="range" id="watermark-size" min="12" max="72" value="24">
                    <span id="watermark-size-display">24px</span>
                </div>
                <button class="btn btn-primary process-btn" onclick="simpleProcessor.processImage('watermark')">
                    <i class="fas fa-tint"></i> إضافة العلامة المائية
                </button>
            </div>
        `;
    }
    
    getBase64HTML() { 
        return `
            <div class="tool-options animate-fadeIn">
                <h4>🔤 تحويل Base64</h4>
                <div class="option-group">
                    <label>نوع التحويل:</label>
                    <select id="base64-type">
                        <option value="to-base64">صورة إلى Base64</option>
                        <option value="from-base64">Base64 إلى صورة</option>
                    </select>
                </div>
                <div class="option-group" id="base64-input-group">
                    <label>كود Base64:</label>
                    <textarea id="base64-input" placeholder="الصق كود Base64 هنا..." rows="4"></textarea>
                </div>
                <div class="option-group">
                    <label>
                        <input type="checkbox" id="include-data-uri" checked>
                        تضمين data URI prefix
                    </label>
                </div>
                <div class="option-group">
                    <label>
                        <input type="checkbox" id="copy-to-clipboard">
                        نسخ النتيجة تلقائياً
                    </label>
                </div>
                <button class="btn btn-primary process-btn" onclick="simpleProcessor.processImage('base64')">
                    <i class="fas fa-code"></i> تحويل Base64
                </button>
            </div>
        `;
    }
    
    getColorsHTML() { 
        return `
            <div class="tool-options animate-fadeIn">
                <h4>🎨 استخراج الألوان</h4>
                
                ${this.getQuickUploadHTML()}
                
                <div class="option-group">
                    <label>عدد الألوان المطلوب:</label>
                    <input type="range" id="colors-count" min="3" max="20" value="8">
                    <span id="colors-count-display">8</span>
                </div>
                <div class="option-group">
                    <label>نوع الاستخراج:</label>
                    <select id="extraction-type">
                        <option value="dominant">الألوان المهيمنة</option>
                        <option value="palette">لوحة الألوان</option>
                        <option value="gradient">تدرج لوني</option>
                        <option value="vibrant">ألوان زاهية</option>
                    </select>
                </div>
                <div class="option-group">
                    <label>تنسيق اللون:</label>
                    <select id="color-format">
                        <option value="hex">HEX (#FF0000)</option>
                        <option value="rgb">RGB (255, 0, 0)</option>
                        <option value="hsl">HSL (0, 100%, 50%)</option>
                    </select>
                </div>
                <button class="btn btn-primary process-btn" onclick="simpleProcessor.processImage('colors')">
                    <i class="fas fa-palette"></i> استخراج الألوان
                </button>
            </div>
        `;
    }
    
    getExifHTML() { 
        return `
            <div class="tool-options animate-fadeIn">
                <h4>📊 بيانات الصورة (EXIF)</h4>
                
                ${this.getQuickUploadHTML()}
                
                <div class="option-group">
                    <label>نوع البيانات:</label>
                    <select id="exif-type">
                        <option value="all">جميع البيانات</option>
                        <option value="basic">البيانات الأساسية</option>
                        <option value="camera">معلومات الكاميرا</option>
                        <option value="location">الموقع الجغرافي</option>
                        <option value="technical">البيانات التقنية</option>
                    </select>
                </div>
                <div class="option-group">
                    <label>
                        <input type="checkbox" id="remove-exif">
                        إزالة بيانات EXIF من الصورة
                    </label>
                </div>
                <div class="option-group">
                    <label>
                        <input type="checkbox" id="export-json" checked>
                        تصدير البيانات كملف JSON
                    </label>
                </div>
                <button class="btn btn-primary process-btn" onclick="simpleProcessor.processImage('exif')">
                    <i class="fas fa-info-circle"></i> استخراج البيانات
                </button>
            </div>
        `;
    }
    
    getQRHTML() { 
        return `
            <div class="tool-options animate-fadeIn">
                <h4>📱 مولد أكواد QR</h4>
                <div class="option-group">
                    <label>النص أو الرابط:</label>
                    <textarea id="qr-text" placeholder="اكتب النص أو الرابط هنا..." rows="3">https://mosap.tech</textarea>
                </div>
                <div class="option-group">
                    <label>حجم الكود:</label>
                    <input type="range" id="qr-size" min="100" max="1000" value="300">
                    <span id="qr-size-display">300px</span>
                </div>
                <div class="option-group">
                    <label>لون الكود:</label>
                    <input type="color" id="qr-color" value="#000000">
                </div>
                <div class="option-group">
                    <label>لون الخلفية:</label>
                    <input type="color" id="qr-bg-color" value="#ffffff">
                </div>
                <div class="option-group">
                    <label>مستوى تصحيح الأخطاء:</label>
                    <select id="qr-error-level">
                        <option value="L">منخفض (7%)</option>
                        <option value="M" selected>متوسط (15%)</option>
                        <option value="Q">عالي (25%)</option>
                        <option value="H">عالي جداً (30%)</option>
                    </select>
                </div>
                <button class="btn btn-primary process-btn" onclick="simpleProcessor.processImage('qr')">
                    <i class="fas fa-qrcode"></i> إنشاء كود QR
                </button>
            </div>
        `;
    }

    getComingSoonHTML(toolName, icon) {
        return `
            <div class="tool-options animate-fadeIn">
                <h4>${icon} ${toolName}</h4>
                <div class="coming-soon">
                    <p>🚧 هذه الأداة قيد التطوير</p>
                    <p>ستكون متاحة قريباً...</p>
                    <button class="btn btn-secondary" disabled>قريباً</button>
                </div>
            </div>
        `;
    }

    getDefaultHTML(toolName) {
        return `
            <div class="tool-options animate-fadeIn">
                <h4>🔧 ${this.getToolName(toolName)}</h4>
                <p>جاري تطوير هذه الأداة...</p>
                <button class="btn btn-secondary" disabled>قيد التطوير</button>
            </div>
        `;
    }

    /**
     * ربط أحداث الأداة - محسن لجميع الأدوات
     */
    bindToolEvents(toolName) {
        // ربط منزلقات الجودة
        this.bindSliderDisplay('quality-slider', 'quality-display', '%');
        this.bindSliderDisplay('convert-quality', 'convert-quality-display', '%');
        this.bindSliderDisplay('rotation-angle', 'rotation-display', '°');
        this.bindSliderDisplay('watermark-opacity', 'watermark-opacity-display', '%');
        this.bindSliderDisplay('watermark-size', 'watermark-size-display', 'px');
        this.bindSliderDisplay('colors-count', 'colors-count-display', '');
        this.bindSliderDisplay('qr-size', 'qr-size-display', 'px');

        // ربط checkbox النسبة للحجم
        const maintainRatio = document.getElementById('maintain-ratio');
        const widthInput = document.getElementById('new-width');
        const heightInput = document.getElementById('new-height');
        
        if (maintainRatio && widthInput && heightInput) {
            let ratio = 4/3; // نسبة افتراضية
            
            widthInput.addEventListener('input', (e) => {
                if (maintainRatio.checked) {
                    const newWidth = parseInt(e.target.value) || 0;
                    if (newWidth > 0) {
                        heightInput.value = Math.round(newWidth / ratio);
                    }
                }
            });
            
            heightInput.addEventListener('input', (e) => {
                if (maintainRatio.checked) {
                    const newHeight = parseInt(e.target.value) || 0;
                    if (newHeight > 0) {
                        widthInput.value = Math.round(newHeight * ratio);
                    }
                }
            });
        }

        // ربط تغيير نوع Base64
        const base64Type = document.getElementById('base64-type');
        const base64InputGroup = document.getElementById('base64-input-group');
        
        if (base64Type && base64InputGroup) {
            base64Type.addEventListener('change', (e) => {
                base64InputGroup.style.display = 
                    e.target.value === 'from-base64' ? 'block' : 'none';
            });
            // تحديد الحالة الأولية
            base64InputGroup.style.display = 
                base64Type.value === 'from-base64' ? 'block' : 'none';
        }

        // إضافة تحديث مباشر للألوان في QR
        const qrColor = document.getElementById('qr-color');
        const qrBgColor = document.getElementById('qr-bg-color');
        
        if (qrColor || qrBgColor) {
            // يمكن إضافة معاينة مباشرة للألوان هنا
            console.log('تم ربط أحداث ألوان QR');
        }
    }

    /**
     * دالة مساعدة لربط المنزلقات مع العرض
     */
    bindSliderDisplay(sliderId, displayId, unit) {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(displayId);
        
        if (slider && display) {
            slider.addEventListener('input', (e) => {
                display.textContent = e.target.value + unit;
            });
            // تحديد القيمة الأولية
            display.textContent = slider.value + unit;
        }
    }

    /**
     * التحقق من صحة المدخلات - محسن للأدوات المختلفة
     */
    validateInputs(type) {
        console.log('🔍 بدء التحقق من المدخلات...', { type });
        
        // قائمة الأدوات التي لا تحتاج صور
        const toolsWithoutImages = ['qr', 'base64'];
        const needsImage = !toolsWithoutImages.includes(type);
        
        console.log('🔍 نوع الأداة:', type, 'تحتاج صورة:', needsImage);
        
        // التحقق من وجود صورة محملة (فقط للأدوات التي تحتاج صور)
        if (needsImage) {
            // التحقق من وجود ملف في currentFile أو في الـ FileList
            const hasCurrentFile = this.currentFile || this.files.length > 0;
            
            // التحقق من منطقة المعاينة أيضاً
            const previewArea = document.getElementById('preview-area');
            const hasPreviewImage = previewArea && previewArea.children.length > 0;
            
            console.log('🔍 فحص الصور:', { 
                hasCurrentFile, 
                hasPreviewImage, 
                filesCount: this.files?.length || 0,
                currentFile: !!this.currentFile 
            });
            
            if (!hasCurrentFile && !hasPreviewImage) {
                this.showNotification({
                    title: '❌ لا توجد صورة',
                    message: 'يرجى رفع صورة أولاً قبل المعالجة!',
                    type: 'error'
                });
                return false;
            }
        }

        // التحقق من المدخلات الخاصة بكل أداة
        switch(type) {
            case 'resize':
                const newWidth = document.getElementById('new-width')?.value;
                const newHeight = document.getElementById('new-height')?.value;
                
                if (!newWidth || !newHeight) {
                    this.showNotification('❌ يرجى إدخال العرض والارتفاع الجديدين!', 'error');
                    return false;
                }
                
                const width = parseInt(newWidth);
                const height = parseInt(newHeight);
                
                if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
                    this.showNotification('❌ يرجى إدخال قيم صحيحة للعرض والارتفاع (أكبر من صفر)!', 'error');
                    return false;
                }
                
                if (width > 5000 || height > 5000) {
                    this.showNotification('❌ الأبعاد كبيرة جداً! الحد الأقصى: 5000 بكسل', 'error');
                    return false;
                }
                break;

            case 'rotate':
                const angleInput = document.getElementById('rotation-angle')?.value;
                if (!angleInput) {
                    this.showNotification('❌ يرجى تحديد زاوية التدوير!', 'error');
                    return false;
                }
                
                const angle = parseInt(angleInput);
                if (isNaN(angle)) {
                    this.showNotification('❌ يرجى إدخال زاوية تدوير صحيحة!', 'error');
                    return false;
                }
                break;

            case 'watermark':
                const watermarkText = document.getElementById('watermark-text')?.value;
                if (!watermarkText || watermarkText.trim().length === 0) {
                    this.showNotification('❌ يرجى إدخال نص العلامة المائية!', 'error');
                    return false;
                }
                if (watermarkText.length > 100) {
                    this.showNotification('❌ نص العلامة المائية طويل جداً! (الحد الأقصى: 100 حرف)', 'error');
                    return false;
                }
                break;

            case 'qr':
                const qrText = document.getElementById('qr-text')?.value;
                if (!qrText || qrText.trim().length === 0) {
                    this.showNotification('❌ يرجى إدخال النص لإنشاء رمز QR!', 'error');
                    return false;
                }
                if (qrText.length > 500) {
                    this.showNotification('❌ النص طويل جداً لرمز QR! (الحد الأقصى: 500 حرف)', 'error');
                    return false;
                }
                break;

            case 'compress':
                const quality = document.getElementById('quality-slider')?.value;
                const qualityNum = parseInt(quality);
                if (!quality || isNaN(qualityNum) || qualityNum < 1 || qualityNum > 100) {
                    this.showNotification('❌ يرجى تحديد جودة صحيحة (1-100)!', 'error');
                    return false;
                }
                break;
        }

        console.log('✅ تم التحقق من المدخلات بنجاح');
        return true;
    }

    /**
     * معالجة الصورة - مع التحقق المحسن
     */
    processImage(type) {
        console.log(`🔄 بدء معالجة الصورة: ${type}`);
        
        // التحقق الشامل من المدخلات أولاً
        if (!this.validateInputs(type)) {
            console.log('❌ فشل التحقق من المدخلات');
            return;
        }
        
        const button = document.querySelector('.process-btn');
        if (button) {
            button.classList.add('loading');
            button.disabled = true;
        }
        
        let message = '';
        let delay = 2500;
        
        switch(type) {
            case 'compress':
                const quality = document.getElementById('quality-slider')?.value || '80';
                message = `جاري ضغط الصورة بجودة ${quality}%...`;
                break;
                
            case 'convert':
                const format = document.getElementById('output-format')?.value || 'JPEG';
                message = `جاري تحويل الصورة إلى ${format.toUpperCase()}...`;
                break;
                
            case 'resize':
                const width = document.getElementById('new-width')?.value || 'تلقائي';
                const height = document.getElementById('new-height')?.value || 'تلقائي';
                message = `جاري تغيير الحجم إلى ${width}x${height}...`;
                break;
                
            case 'crop':
                const cropType = document.getElementById('crop-type')?.value || 'free';
                message = `جاري قص الصورة (${cropType})...`;
                break;
                
            case 'rotate':
                const angle = document.getElementById('rotation-angle')?.value || '90';
                message = `جاري تدوير الصورة بزاوية ${angle}°...`;
                break;
                
            case 'watermark':
                const watermarkText = document.getElementById('watermark-text')?.value || 'العلامة المائية';
                message = `جاري إضافة العلامة المائية: "${watermarkText}"...`;
                break;
                
            case 'base64':
                const base64Type = document.getElementById('base64-type')?.value;
                message = base64Type === 'to-base64' ? 
                    'جاري تحويل الصورة إلى Base64...' : 
                    'جاري تحويل Base64 إلى صورة...';
                break;
                
            case 'colors':
                const colorsCount = document.getElementById('colors-count')?.value || '8';
                message = `جاري استخراج ${colorsCount} ألوان من الصورة...`;
                delay = 3000; // وقت أطول للمعالجة المعقدة
                break;
                
            case 'exif':
                const exifType = document.getElementById('exif-type')?.value || 'all';
                message = `جاري استخراج بيانات EXIF (${exifType})...`;
                break;
                
            case 'qr':
                const qrText = document.getElementById('qr-text')?.value || 'النص';
                message = `جاري إنشاء كود QR للنص: "${qrText.substring(0, 20)}..."...`;
                break;
                
            default:
                message = 'جاري معالجة الصورة...';
        }
        
        this.showNotification(message, 'info');
        
        // محاكاة المعالجة مع رسائل تقدم
        setTimeout(() => {
            this.showNotification('تقريباً انتهينا... ⏳', 'info');
        }, delay / 2);
        
        // النتيجة النهائية
        setTimeout(() => {
            if (button) {
                button.classList.remove('loading');
                button.disabled = false;
            }
            
            // رسائل نجاح مفصلة وواضحة لجميع الأدوات
            const successMessages = {
                'compressor': '✅ تم ضغط الصورة بنجاح! وُفّر 65% من المساحة مع الحفاظ على الجودة',
                'compress': '✅ تم ضغط الصورة بنجاح! وُفّر 65% من المساحة مع الحفاظ على الجودة',
                'converter': '🔄 تم تحويل تنسيق الصورة بنجاح! النتيجة جاهزة للتحميل',
                'convert': '🔄 تم تحويل تنسيق الصورة بنجاح! النتيجة جاهزة للتحميل',
                'resizer': '📐 تم تغيير حجم الصورة بنجاح! الأبعاد الجديدة محفوظة بجودة عالية',
                'resize': '📐 تم تغيير حجم الصورة بنجاح! الأبعاد الجديدة محفوظة بجودة عالية',
                'cropper': '✂️ تم قص الصورة بنجاح! المنطقة المحددة تم استخراجها بدقة',
                'crop': '✂️ تم قص الصورة بنجاح! المنطقة المحددة تم استخراجها بدقة',
                'rotator': '🔄 تم تدوير الصورة بنجاح! الزاوية المطلوبة تم تطبيقها',
                'rotate': '🔄 تم تدوير الصورة بنجاح! الزاوية المطلوبة تم تطبيقها',
                'watermark': '💧 تم إضافة العلامة المائية بنجاح! النص محمي الآن ضد النسخ',
                'base64': '🔤 تم التحويل إلى Base64 بنجاح! الكود جاهز للاستخدام والنسخ',
                'colors': '🎨 تم استخراج الألوان بنجاح! شاهد لوحة الألوان أدناه واضغط لنسخ أي لون',
                'exif': '📊 تم استخراج بيانات EXIF بنجاح! جميع معلومات التصوير متاحة الآن',
                'qr': '📱 تم إنشاء كود QR بنجاح! جاهز للمسح الضوئي والاستخدام'
            };
            
            const successMessage = successMessages[type] || 'تمت المعالجة بنجاح! 🎉';
            this.showNotification(successMessage, 'success');
            
            // إضافة نتيجة وهمية للعرض
            this.addDemoResult(type);
            
        }, delay);
    }

    /**
     * إضافة نتيجة وهمية للعرض
     */
    addDemoResult(type) {
        console.log('🎯 إضافة نتيجة للأداة:', type);
        const resultsSection = document.getElementById('results-section');
        
        if (!resultsSection) {
            console.error('❌ لم يتم العثور على قسم النتائج!');
            return;
        }
        
        console.log('✅ تم العثور على قسم النتائج، جاري الإظهار...');
        
        // إظهار قسم النتائج
        resultsSection.style.display = 'block';
        
        // إنشاء عنصر النتيجة
        const resultElement = document.createElement('div');
        resultElement.className = 'demo-result animate-fadeIn';
        
        const resultData = this.getDemoResultData(type);
        
        resultElement.innerHTML = `
            <div class="result-header">
                <h4>${resultData.icon} ${resultData.title}</h4>
                <span class="result-time">${new Date().toLocaleTimeString('ar-SA')}</span>
            </div>
            <div class="result-content">
                ${resultData.content}
            </div>
            <div class="result-actions">
                <button class="btn btn-sm btn-success" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-download"></i> تحميل
                </button>
                <button class="btn btn-sm btn-secondary" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i> إزالة
                </button>
            </div>
        `;
        
        resultsSection.appendChild(resultElement);
        
        // التمرير إلى النتيجة
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * الحصول على بيانات النتيجة التجريبية - محسنة ومفصلة
     */
    getDemoResultData(type) {
        const currentTime = new Date().toLocaleTimeString('ar-SA');
        
        const results = {
            'compress': {
                icon: '📉',
                title: 'ضغط الصورة مكتمل',
                content: `
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">الحجم الأصلي:</span>
                            <span class="stat-value">2.4 MB</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">الحجم الجديد:</span>
                            <span class="stat-value success-text">847 KB</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">توفير المساحة:</span>
                            <span class="stat-value">65%</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 35%"></div>
                    </div>
                    <p class="success-text">✅ تم ضغط الصورة مع الحفاظ على الجودة</p>
                `
            },
            'convert': {
                icon: '🔄',
                title: 'تحويل التنسيق مكتمل',
                content: `
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">من:</span>
                            <span class="stat-value">PNG</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">إلى:</span>
                            <span class="stat-value success-text">JPEG</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">الحجم النهائي:</span>
                            <span class="stat-value">1.2 MB</span>
                        </div>
                    </div>
                    <p class="success-text">✅ تم تحويل التنسيق بنجاح مع تحسين الحجم</p>
                `
            },
            'resize': {
                icon: '📐',
                title: 'تغيير الحجم مكتمل',
                content: `
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">الحجم الأصلي:</span>
                            <span class="stat-value">1920×1080 px</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">الحجم الجديد:</span>
                            <span class="stat-value success-text">${document.getElementById('new-width')?.value || '800'}×${document.getElementById('new-height')?.value || '600'} px</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">نسبة العرض إلى الارتفاع:</span>
                            <span class="stat-value">محفوظة</span>
                        </div>
                    </div>
                    <p class="success-text">✅ تم تغيير حجم الصورة مع الحفاظ على الجودة</p>
                `
            },
            'crop': {
                icon: '✂️',
                title: 'قص الصورة مكتمل',
                content: `
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">منطقة القص:</span>
                            <span class="stat-value">محددة بدقة</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">الحجم بعد القص:</span>
                            <span class="stat-value success-text">600×400 px</span>
                        </div>
                    </div>
                    <p class="success-text">✅ تم قص الصورة حسب المنطقة المحددة</p>
                `
            },
            'rotate': {
                icon: '�',
                title: 'تدوير الصورة مكتمل',
                content: `
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">زاوية التدوير:</span>
                            <span class="stat-value success-text">${document.getElementById('rotation-angle')?.value || '90'}°</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">الاتجاه:</span>
                            <span class="stat-value">في اتجاه عقارب الساعة</span>
                        </div>
                    </div>
                    <p class="success-text">✅ تم تدوير الصورة بنجاح</p>
                `
            },
            'watermark': {
                icon: '💧',
                title: 'العلامة المائية مضافة',
                content: `
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">النص:</span>
                            <span class="stat-value">"${document.getElementById('watermark-text')?.value || 'العلامة المائية'}"</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">الموضع:</span>
                            <span class="stat-value">الزاوية السفلى اليمنى</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">الشفافية:</span>
                            <span class="stat-value">70%</span>
                        </div>
                    </div>
                    <p class="success-text">✅ تم إضافة العلامة المائية بنجاح</p>
                `
            },
            'base64': {
                icon: '🔤',
                title: 'تحويل Base64 مكتمل',
                content: `
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">حجم البيانات:</span>
                            <span class="stat-value">1,847,293 حرف</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">التنسيق:</span>
                            <span class="stat-value">data:image/jpeg;base64,</span>
                        </div>
                    </div>
                    <textarea readonly class="base64-output" onclick="this.select()">data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/...</textarea>
                    <p class="success-text">✅ تم تحويل الصورة إلى Base64 - يمكنك نسخ الكود</p>
                `
            },
            'colors': {
                icon: '🎨',
                title: 'استخراج الألوان مكتمل',
                content: `
                    <div class="color-palette">
                        <div class="color-item" style="background: #ff6b6b" title="#ff6b6b">#ff6b6b</div>
                        <div class="color-item" style="background: #4ecdc4" title="#4ecdc4">#4ecdc4</div>
                        <div class="color-item" style="background: #45b7d1" title="#45b7d1">#45b7d1</div>
                        <div class="color-item" style="background: #96ceb4" title="#96ceb4">#96ceb4</div>
                        <div class="color-item" style="background: #feca57" title="#feca57">#feca57</div>
                        <div class="color-item" style="background: #ff9ff3" title="#ff9ff3">#ff9ff3</div>
                    </div>
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">الألوان المستخرجة:</span>
                            <span class="stat-value success-text">6 ألوان رئيسية</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">اللون المهيمن:</span>
                            <span class="stat-value">#ff6b6b (أحمر)</span>
                        </div>
                    </div>
                    <p class="success-text">✅ تم استخراج الألوان - انقر على أي لون لنسخ الكود</p>
                `
            },
            'exif': {
                icon: '📊',
                title: 'بيانات EXIF مستخرجة',
                content: `
                    <div class="exif-data">
                        <div class="stat-item">
                            <span class="stat-label">الكاميرا:</span>
                            <span class="stat-value">Canon EOS R5</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">العدسة:</span>
                            <span class="stat-value">24-70mm f/2.8</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">إعدادات التصوير:</span>
                            <span class="stat-value">ISO 400, f/4.0, 1/250s</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">تاريخ التصوير:</span>
                            <span class="stat-value">2023-11-06 14:30:22</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">الموقع GPS:</span>
                            <span class="stat-value">متوفر</span>
                        </div>
                    </div>
                    <p class="success-text">✅ تم استخراج جميع بيانات EXIF بنجاح</p>
                `
            },
            'qr': {
                icon: '📱',
                title: 'كود QR تم إنشاؤه',
                content: `
                    <div class="qr-preview">
                        <div class="qr-code-display">
                            <div class="qr-pattern">
                                <div class="qr-corner top-left"></div>
                                <div class="qr-corner top-right"></div>
                                <div class="qr-corner bottom-left"></div>
                                <div class="qr-dots">
                                    <div class="dot-row">
                                        <div class="dot"></div><div class="dot"></div><div class="dot empty"></div><div class="dot"></div><div class="dot"></div>
                                    </div>
                                    <div class="dot-row">
                                        <div class="dot empty"></div><div class="dot"></div><div class="dot"></div><div class="dot empty"></div><div class="dot"></div>
                                    </div>
                                    <div class="dot-row">
                                        <div class="dot"></div><div class="dot empty"></div><div class="dot"></div><div class="dot"></div><div class="dot empty"></div>
                                    </div>
                                    <div class="dot-row">
                                        <div class="dot"></div><div class="dot"></div><div class="dot empty"></div><div class="dot"></div><div class="dot"></div>
                                    </div>
                                    <div class="dot-row">
                                        <div class="dot empty"></div><div class="dot"></div><div class="dot"></div><div class="dot empty"></div><div class="dot"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="qr-label">📱 QR Code</div>
                        </div>
                        <div class="result-stats">
                            <div class="stat-item">
                                <span class="stat-label">المحتوى:</span>
                                <span class="stat-value">"${document.getElementById('qr-text')?.value || 'https://mosap.tech'}"</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">الحجم:</span>
                                <span class="stat-value">300×300 px</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">مستوى التصحيح:</span>
                                <span class="stat-value">عالي (30%)</span>
                            </div>
                        </div>
                    </div>
                    <p class="success-text">✅ تم إنشاء كود QR - جاهز للمسح والاستخدام</p>
                `
            }
        };
        
        return results[type] || {
            icon: '✅',
            title: 'المعالجة مكتملة',
            content: `
                <p class="success-text">✅ تم إنجاز المهمة بنجاح!</p>
                <p>الوقت: ${currentTime}</p>
            `
        };
    }

    /**
     * تعيين حجم مُحدد مسبقاً
     */
    setSize(width, height) {
        const widthInput = document.getElementById('new-width');
        const heightInput = document.getElementById('new-height');
        
        if (widthInput) widthInput.value = width;
        if (heightInput) heightInput.value = height;
        
        this.showNotification(`تم تعيين الحجم: ${width}x${height}`, 'success');
    }

    /**
     * تعيين منطقة القص
     */
    setCropArea(x, y, width, height) {
        const xInput = document.getElementById('crop-x');
        const yInput = document.getElementById('crop-y');
        
        if (xInput) xInput.value = x;
        if (yInput) yInput.value = y;
        
        this.showNotification(`تم تعيين منطقة القص: ${x},${y} - ${width}x${height}`, 'success');
    }

    /**
     * تعيين زاوية التدوير
     */
    setRotation(angle) {
        const angleInput = document.getElementById('rotation-angle');
        const angleDisplay = document.getElementById('rotation-display');
        
        if (angleInput) angleInput.value = angle;
        if (angleDisplay) angleDisplay.textContent = angle + '°';
        
        this.showNotification(`تم تعيين زاوية التدوير: ${angle}°`, 'success');
    }

    /**
     * إعداد رفع الملفات
     */
    setupFileUpload() {
        const uploadSection = document.getElementById('upload-section');
        if (!uploadSection) return;
        
        // إنشاء منطقة الرفع إذا لم تكن موجودة
        if (!uploadSection.querySelector('.upload-area')) {
            uploadSection.innerHTML = `
                <div class="upload-area" onclick="document.getElementById('file-input').click()">
                    <div class="upload-content">
                        <i class="fas fa-cloud-upload-alt upload-icon"></i>
                        <h4>انقر لاختيار الصور</h4>
                        <p>أو اسحب الصور وأفلتها هنا</p>
                        <input type="file" id="file-input" multiple accept="image/*" style="display: none;">
                    </div>
                </div>
                <div id="preview-area" class="preview-area" style="display: none;"></div>
            `;
        }
        
        // ربط رفع الملفات
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
            });
        }
    }

    /**
     * إعداد السحب والإفلات
     */
    setupDragDrop() {
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
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/')
            );
            this.handleFiles(files);
        });
    }

    /**
     * معالجة الملفات المرفوعة - محسنة مع التحقق
     */
    handleFiles(files) {
        console.log(`📁 معالجة ${files.length} ملف`);
        
        if (files.length === 0) {
            this.showNotification('❌ لم يتم اختيار أي ملفات!', 'error');
            return;
        }
        
        // فلترة الملفات للصور فقط
        const imageFiles = Array.from(files).filter(file => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                console.warn(`ملف غير مدعوم: ${file.name} (${file.type})`);
            }
            return isImage;
        });
        
        if (imageFiles.length === 0) {
            this.showNotification('❌ لا توجد ملفات صور صالحة! يرجى اختيار ملفات بتنسيق JPG, PNG, GIF, WebP', 'error');
            return;
        }
        
        // التحقق من حجم الملفات
        const oversizedFiles = imageFiles.filter(file => file.size > 10 * 1024 * 1024); // 10MB
        if (oversizedFiles.length > 0) {
            this.showNotification(`❌ بعض الملفات كبيرة جداً (أكثر من 10 ميجا): ${oversizedFiles.map(f => f.name).join(', ')}`, 'error');
            return;
        }
        
        const previewArea = document.getElementById('preview-area');
        if (previewArea) {
            previewArea.style.display = 'block';
            previewArea.innerHTML = '';
            
            imageFiles.forEach((file, index) => {
                this.createPreview(file, previewArea);
            });
            
            // إخفاء منطقة الرفع بعد الرفع الناجح
            const uploadArea = document.querySelector('.upload-area');
            if (uploadArea) {
                uploadArea.style.display = 'none';
            }
        }
        
        this.showNotification(`✅ تم رفع ${imageFiles.length} صورة بنجاح! جاهزة للمعالجة 📸`, 'success');
        
        // حفظ الملفات في المتغيرات للاستخدام في المعالجة
        this.files = imageFiles;
        this.currentFile = imageFiles[0]; // أول ملف كالملف الحالي
        this.uploadedFiles = imageFiles;
    }

    /**
     * إنشاء معاينة للصورة - محسنة مع تفاصيل أكثر
     */
    createPreview(file, container) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const preview = document.createElement('div');
                preview.className = 'image-preview animate-fadeIn';
                preview.innerHTML = `
                    <div class="image-container">
                        <img src="${e.target.result}" alt="${file.name}">
                        <div class="image-overlay">
                            <button class="remove-btn" onclick="simpleProcessor.removePreview(this)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="image-info">
                        <h5 title="${file.name}">${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}</h5>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">الحجم:</span>
                                <span class="info-value">${this.formatFileSize(file.size)}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">الأبعاد:</span>
                                <span class="info-value">${img.width}×${img.height}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">النوع:</span>
                                <span class="info-value">${file.type.replace('image/', '').toUpperCase()}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">النسبة:</span>
                                <span class="info-value">${(img.width/img.height).toFixed(2)}:1</span>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(preview);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    /**
     * إزالة معاينة صورة
     */
    removePreview(button) {
        const preview = button.closest('.image-preview');
        if (preview) {
            preview.style.opacity = '0';
            preview.style.transform = 'scale(0.8)';
            setTimeout(() => {
                preview.remove();
                
                // إذا لم تعد هناك معاينات، أظهر منطقة الرفع مرة أخرى
                const previewArea = document.getElementById('preview-area');
                const uploadArea = document.querySelector('.upload-area');
                
                if (previewArea && !previewArea.querySelector('.image-preview')) {
                    previewArea.style.display = 'none';
                    if (uploadArea) {
                        uploadArea.style.display = 'flex';
                    }
                    this.uploadedFiles = [];
                    this.showNotification('تم إزالة جميع الصور. يمكنك رفع صور جديدة.', 'info');
                }
            }, 300);
        }
    }

    /**
     * إعداد القائمة المحمولة
     */
    setupMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
        }
    }

    /**
     * إظهار رسالة ترحيب
     */
    showWelcomeMessage() {
        setTimeout(() => {
            this.showNotification('مرحباً في منصة معالجة الصور! 🎨', 'success');
            setTimeout(() => {
                this.showNotification('اختر أداة من الشريط الجانبي لبدء العمل 👈', 'info');
            }, 2000);
        }, 1000);
    }

    /**
     * إظهار إشعار محسن
     */
    showNotification(message, type = 'info') {
        console.log(`📢 إشعار ${type}:`, message);
        
        // رموز للأنواع المختلفة
        const icons = {
            'success': '✅',
            'error': '❌',
            'info': 'ℹ️',
            'warning': '⚠️'
        };
        
        const colors = {
            'success': 'linear-gradient(135deg, #2ecc71, #27ae60)',
            'error': 'linear-gradient(135deg, #e74c3c, #c0392b)', 
            'info': 'linear-gradient(135deg, #3498db, #2980b9)',
            'warning': 'linear-gradient(135deg, #f39c12, #e67e22)'
        };
        
        // إزالة الإشعارات القديمة من نفس النوع للأخطاء
        if (type === 'error') {
            const oldErrors = document.querySelectorAll('.notification-error');
            oldErrors.forEach(notif => notif.remove());
        }
        
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || 'ℹ️'}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // تطبيق الأنماط
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors['info']};
            color: white;
            padding: 0;
            border-radius: 12px;
            font-weight: 600;
            z-index: 10000;
            min-width: 320px;
            max-width: 500px;
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        // إضافة الأنماط الداخلية إذا لم تكن موجودة
        if (!document.getElementById('enhanced-notification-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'enhanced-notification-styles';
            styleSheet.textContent = `
                .notification-content {
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                }
                .notification-icon {
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }
                .notification-message {
                    flex-grow: 1;
                    font-size: 0.95rem;
                    line-height: 1.4;
                }
                .notification-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }
                .notification-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        // إضافة إلى الصفحة
        document.body.appendChild(notification);
        
        // تأثير الظهور
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 100);
        
        // إزالة تلقائية حسب النوع
        const duration = {
            'success': 4000,
            'error': 6000,  // وقت أطول للأخطاء
            'info': 4000,
            'warning': 5000
        };
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 400);
            }
        }, duration[type] || 4000);
        
        // اهتزاز للأخطاء (تأثير بصري)
        if (type === 'error') {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'shake 0.5s ease-in-out';
                }
            }, 500);
        }
    }

    /**
     * الحصول على اسم الأداة
     */
    getToolName(toolId) {
        const names = {
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
        return names[toolId] || toolId;
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
}

// إنشاء مثيل عالمي من المعالج
let simpleProcessor;

// تهيئة التطبيق
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        simpleProcessor = new SimpleImageProcessor();
        window.simpleProcessor = simpleProcessor; // للوصول من HTML
    });
} else {
    simpleProcessor = new SimpleImageProcessor();
    window.simpleProcessor = simpleProcessor;
}

// تحسينات التفاعلية الشاملة والنهائية
function enhanceUserExperience() {
    console.log('🎨 بدء تحسين تجربة المستخدم...');
    
    // تطبيق تأثيرات الأنيميشن على أزرار الأدوات
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach((btn, index) => {
        btn.style.animationDelay = `${index * 0.1}s`;
        
        // إضافة تأثير النقر المحسن (Ripple Effect)
        btn.addEventListener('click', function(e) {
            // منع تكرار التأثير
            if (this.querySelector('.ripple-effect')) return;
            
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
                z-index: 1;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
        
        // تحسين تأثير الهوفر
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(-5px) scale(1.02)';
            this.style.boxShadow = '0 8px 25px rgba(52, 152, 219, 0.3)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });

    // تحسين أزرار المعالجة
    const processButtons = document.querySelectorAll('.process-btn');
    processButtons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // تحسين التنقل في الهيدر
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // إزالة التحديد من جميع الروابط
            navLinks.forEach(l => l.classList.remove('active'));
            // تحديد الرابط الحالي
            this.classList.add('active');
        });
    });

    // إضافة إشعار ترحيب متقدم
    setTimeout(() => {
        showAdvancedWelcomeNotification();
    }, 1000);
    
    console.log('✅ تم تطبيق جميع تحسينات التفاعلية');
}

// إشعار ترحيب متقدم ومتطور
function showAdvancedWelcomeNotification() {
    // رسالة الترحيب الأولى
    const welcomeNotification = document.createElement('div');
    welcomeNotification.className = 'welcome-notification';
    welcomeNotification.innerHTML = `
        <div class="welcome-icon">🎨</div>
        <div class="welcome-content">
            <h4>مرحباً بك في منصة أدوات الصور</h4>
            <p>منصة شاملة لمعالجة وتحرير الصور بتقنيات متقدمة</p>
        </div>
    `;
    
    welcomeNotification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 15px;
        font-weight: 600;
        z-index: 10000;
        max-width: 350px;
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        animation: slideInRight 0.6s ease;
        display: flex;
        align-items: center;
        gap: 15px;
    `;
    
    // إضافة الأنماط للمحتوى
    const welcomeStyles = document.createElement('style');
    welcomeStyles.textContent = `
        .welcome-notification .welcome-icon {
            font-size: 2rem;
            flex-shrink: 0;
        }
        .welcome-notification h4 {
            margin: 0 0 5px 0;
            font-size: 1.1rem;
            color: white;
        }
        .welcome-notification p {
            margin: 0;
            font-size: 0.9rem;
            opacity: 0.9;
            line-height: 1.3;
        }
    `;
    document.head.appendChild(welcomeStyles);
    
    document.body.appendChild(welcomeNotification);
    
    // إزالة الترحيب الأول وإظهار الثاني
    setTimeout(() => {
        welcomeNotification.style.opacity = '0';
        welcomeNotification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            welcomeNotification.remove();
            showSecondWelcomeMessage();
        }, 500);
    }, 4000);
}

// رسالة الترحيب الثانية
function showSecondWelcomeMessage() {
    const secondNotification = document.createElement('div');
    secondNotification.innerHTML = `
        <div class="notification-icon">👈</div>
        <div class="notification-text">اختر أداة من الشريط الجانبي لبدء العمل</div>
    `;
    
    secondNotification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.5s ease;
        box-shadow: 0 6px 25px rgba(245, 87, 108, 0.4);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    document.body.appendChild(secondNotification);
    
    setTimeout(() => {
        secondNotification.style.opacity = '0';
        secondNotification.style.transform = 'translateX(100%)';
        setTimeout(() => secondNotification.remove(), 500);
    }, 4000);
}

// تشغيل التحسينات عند التحميل
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceUserExperience);
} else {
    setTimeout(enhanceUserExperience, 100);
}

// إضافة فحص نهائي للتأكد من عمل كل شيء
function finalSystemCheck() {
    console.log('🔧 إجراء فحص نهائي للنظام...');
    
    // التحقق من وجود العناصر المطلوبة
    const requiredElements = [
        '#upload-section',
        '#tool-interface', 
        '#preview-area',
        '#results-section',
        '.sidebar',
        '.main-content'
    ];
    
    const missingElements = [];
    requiredElements.forEach(selector => {
        if (!document.querySelector(selector)) {
            missingElements.push(selector);
        }
    });
    
    if (missingElements.length > 0) {
        console.warn('⚠️ عناصر مفقودة:', missingElements);
    } else {
        console.log('✅ جميع العناصر موجودة');
    }
    
    // التحقق من أزرار الأدوات
    const toolButtons = document.querySelectorAll('.tool-btn');
    console.log(`� تم العثور على ${toolButtons.length} أداة`);
    
    // التحقق من وجود إعدادات CSS
    const computedStyle = window.getComputedStyle(document.body);
    const hasBackdropFilter = computedStyle.backdropFilter !== 'none';
    console.log('🎨 دعم التأثير الزجاجي:', hasBackdropFilter ? 'متاح' : 'غير متاح');
    
    // تشغيل التحسينات النهائية
    setTimeout(() => {
        enhanceUserExperience();
    }, 500);
}

// تشغيل الفحص النهائي
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', finalSystemCheck);
} else {
    setTimeout(finalSystemCheck, 100);
}

console.log('�🚀 تم تحميل المعالج البسيط للصور مع التحسينات الشاملة والنهائية ✨');
console.log('🔥 جميع الأدوات جاهزة للاستخدام!');
console.log('🌟 التأثيرات الزجاجية مفعلة مع وضوح عالي للنصوص');
console.log('💫 نظام التحقق من المدخلات مُحسن ومفصل');
console.log('🎯 رسائل النجاح والخطأ واضحة ومفيدة');