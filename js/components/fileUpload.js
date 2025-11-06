/**
 * File Upload Component
 * مكون رفع الملفات مع السحب والإفلات
 */

import UIHelpers from '../utils/uiHelpers.js';
import FileHandler from '../utils/fileHandler.js';

class FileUpload {
    constructor(options = {}) {
        this.uiHelpers = new UIHelpers();
        this.fileHandler = new FileHandler();
        
        // إعدادات افتراضية
        this.options = {
            container: options.container || 'upload-section',
            maxFiles: options.maxFiles || 10,
            maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB
            acceptedTypes: options.acceptedTypes || ['image/*'],
            allowMultiple: options.allowMultiple !== false,
            showPreview: options.showPreview !== false,
            onFilesSelected: options.onFilesSelected || null,
            onFileRemoved: options.onFileRemoved || null,
            ...options
        };

        this.uploadedFiles = [];
        this.isDragActive = false;
    }

    /**
     * تهيئة مكون رفع الملفات
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    /**
     * إنشاء واجهة رفع الملفات
     */
    createInterface() {
        const container = document.getElementById(this.options.container);
        if (!container) return;

        container.innerHTML = `
            <div class="file-upload-component">
                <!-- منطقة رفع الملفات -->
                <div class="upload-zone" id="upload-zone-${this.options.container}">
                    <div class="upload-content">
                        <div class="upload-icon">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <h4 class="upload-title">اسحب وأفلت الملفات هنا</h4>
                        <p class="upload-subtitle">أو انقر لاختيار الملفات</p>
                        
                        <input type="file" 
                               id="file-input-${this.options.container}"
                               class="file-input" 
                               ${this.options.allowMultiple ? 'multiple' : ''}
                               accept="${this.options.acceptedTypes.join(',')}"
                               style="display: none;">
                        
                        <button class="btn btn-primary select-files-btn">
                            <i class="fas fa-folder-open"></i>
                            اختيار ملفات
                        </button>
                        
                        <div class="upload-limits">
                            <small>
                                الحد الأقصى: ${this.options.maxFiles} ملفات، 
                                ${this.formatFileSize(this.options.maxSize)} لكل ملف
                            </small>
                            <div class="accepted-types">
                                <span>الأنواع المقبولة:</span>
                                ${this.options.acceptedTypes.map(type => 
                                    `<span class="type-badge">${this.getTypeDisplayName(type)}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <!-- مؤشر التحميل -->
                    <div class="upload-progress" id="upload-progress-${this.options.container}" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <div class="progress-text">جاري رفع الملفات...</div>
                    </div>
                </div>

                <!-- قائمة الملفات المرفوعة -->
                <div class="files-list" id="files-list-${this.options.container}" style="display: none;">
                    <div class="files-header">
                        <h4>الملفات المرفوعة</h4>
                        <div class="files-actions">
                            <span class="files-count">0 ملفات</span>
                            <button class="btn btn-sm btn-outline clear-all-btn">
                                <i class="fas fa-trash"></i>
                                مسح الكل
                            </button>
                        </div>
                    </div>
                    
                    <div class="files-container" id="files-container-${this.options.container}">
                        <!-- سيتم إنشاء الملفات هنا ديناميكياً -->
                    </div>
                </div>

                <!-- معلومات إضافية -->
                <div class="upload-info" id="upload-info-${this.options.container}">
                    <div class="info-stats">
                        <div class="stat-item">
                            <label>إجمالي الملفات:</label>
                            <span class="total-files">0</span>
                        </div>
                        <div class="stat-item">
                            <label>الحجم الكلي:</label>
                            <span class="total-size">0 KB</span>
                        </div>
                        <div class="stat-item">
                            <label>الملفات الصالحة:</label>
                            <span class="valid-files">0</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.uploadZone = document.getElementById(`upload-zone-${this.options.container}`);
        this.fileInput = document.getElementById(`file-input-${this.options.container}`);
        this.filesList = document.getElementById(`files-list-${this.options.container}`);
        this.filesContainer = document.getElementById(`files-container-${this.options.container}`);
        this.uploadProgress = document.getElementById(`upload-progress-${this.options.container}`);
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // اختيار الملفات
        this.uploadZone?.addEventListener('click', (e) => {
            if (e.target.closest('.select-files-btn') || e.target === this.uploadZone) {
                this.fileInput?.click();
            }
        });

        this.fileInput?.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
        });

        // مسح جميع الملفات
        document.querySelector(`#${this.options.container} .clear-all-btn`)?.addEventListener('click', () => {
            this.clearAllFiles();
        });
    }

    /**
     * إعداد السحب والإفلات
     */
    setupDragAndDrop() {
        if (!this.uploadZone) return;

        // منع السلوك الافتراضي
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // تأثيرات بصرية عند السحب
        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, () => {
                this.uploadZone.classList.add('drag-active');
                this.isDragActive = true;
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, () => {
                this.uploadZone.classList.remove('drag-active');
                this.isDragActive = false;
            });
        });

        // معالجة إفلات الملفات
        this.uploadZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });
    }

    /**
     * معالجة الملفات المختارة
     * @param {Array} files 
     */
    async handleFiles(files) {
        if (!files || files.length === 0) return;

        this.showProgress(true);

        // فلترة وتحقق من الملفات
        const validFiles = [];
        const errors = [];

        for (const file of files) {
            const validation = this.validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push({ file: file.name, error: validation.error });
            }
        }

        // فحص العدد الإجمالي
        if (this.uploadedFiles.length + validFiles.length > this.options.maxFiles) {
            const allowedCount = this.options.maxFiles - this.uploadedFiles.length;
            errors.push({
                file: 'عام',
                error: `يمكن رفع ${allowedCount} ملف إضافي فقط (الحد الأقصى: ${this.options.maxFiles})`
            });
            validFiles.splice(allowedCount);
        }

        // إضافة الملفات الصالحة
        for (const file of validFiles) {
            await this.addFile(file);
        }

        // عرض الأخطاء إن وجدت
        if (errors.length > 0) {
            this.showErrors(errors);
        }

        this.showProgress(false);
        this.updateDisplay();
        this.updateStats();

        // استدعاء callback إذا كان متوفراً
        if (this.options.onFilesSelected && validFiles.length > 0) {
            this.options.onFilesSelected(validFiles, this.uploadedFiles);
        }

        // إعادة تعيين input
        this.fileInput.value = '';
    }

    /**
     * التحقق من صحة الملف
     * @param {File} file 
     * @returns {Object}
     */
    validateFile(file) {
        // فحص الحجم
        if (file.size > this.options.maxSize) {
            return {
                valid: false,
                error: `الملف كبير جداً (الحد الأقصى: ${this.formatFileSize(this.options.maxSize)})`
            };
        }

        // فحص النوع
        const isValidType = this.options.acceptedTypes.some(type => {
            if (type === '*') return true;
            if (type.endsWith('/*')) {
                const category = type.split('/')[0];
                return file.type.startsWith(category + '/');
            }
            return file.type === type;
        });

        if (!isValidType) {
            return {
                valid: false,
                error: 'نوع الملف غير مدعوم'
            };
        }

        // فحص التكرار
        if (this.uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
            return {
                valid: false,
                error: 'الملف موجود مسبقاً'
            };
        }

        return { valid: true };
    }

    /**
     * إضافة ملف جديد
     * @param {File} file 
     */
    async addFile(file) {
        const fileInfo = {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            status: 'ready', // ready, processing, done, error
            progress: 0,
            preview: null,
            error: null
        };

        // إنشاء معاينة للصور
        if (this.options.showPreview && file.type.startsWith('image/')) {
            try {
                fileInfo.preview = await this.createImagePreview(file);
            } catch (error) {
                console.warn('فشل في إنشاء معاينة للصورة:', error);
            }
        }

        this.uploadedFiles.push(fileInfo);
    }

    /**
     * إنشاء معاينة للصورة
     * @param {File} file 
     * @returns {Promise<string>}
     */
    createImagePreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // حساب الأبعاد (thumbnail 80x80)
                    const maxSize = 80;
                    let { width, height } = img;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * تحديث العرض
     */
    updateDisplay() {
        if (this.uploadedFiles.length === 0) {
            this.filesList.style.display = 'none';
            return;
        }

        this.filesList.style.display = 'block';
        
        this.filesContainer.innerHTML = this.uploadedFiles.map((fileInfo, index) => `
            <div class="file-item ${fileInfo.status}" data-file-id="${fileInfo.id}">
                <div class="file-preview">
                    ${fileInfo.preview ? 
                        `<img src="${fileInfo.preview}" alt="Preview">` :
                        `<i class="fas ${this.getFileIcon(fileInfo.type)}"></i>`
                    }
                    
                    ${fileInfo.status === 'processing' ? `
                        <div class="file-progress">
                            <div class="progress-circle">
                                <span>${fileInfo.progress}%</span>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${fileInfo.status === 'error' ? `
                        <div class="file-error-overlay">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                    ` : ''}
                </div>
                
                <div class="file-details">
                    <div class="file-name" title="${fileInfo.name}">${fileInfo.name}</div>
                    <div class="file-meta">
                        <span class="file-size">${this.formatFileSize(fileInfo.size)}</span>
                        <span class="file-type">${this.getTypeDisplayName(fileInfo.type)}</span>
                    </div>
                    
                    ${fileInfo.status === 'error' ? `
                        <div class="file-error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            ${fileInfo.error}
                        </div>
                    ` : ''}
                    
                    <div class="file-status">
                        ${this.getStatusDisplay(fileInfo.status)}
                    </div>
                </div>
                
                <div class="file-actions">
                    ${fileInfo.status === 'ready' || fileInfo.status === 'done' ? `
                        <button class="btn btn-xs btn-outline file-action-btn" 
                                onclick="fileUpload_${this.options.container}.previewFile('${fileInfo.id}')"
                                title="معاينة">
                            <i class="fas fa-eye"></i>
                        </button>
                    ` : ''}
                    
                    <button class="btn btn-xs btn-outline file-action-btn" 
                            onclick="fileUpload_${this.options.container}.removeFile('${fileInfo.id}')"
                            title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // تحديث عداد الملفات
        document.querySelector(`#${this.options.container} .files-count`).textContent = 
            `${this.uploadedFiles.length} ملف`;
    }

    /**
     * تحديث الإحصائيات
     */
    updateStats() {
        const totalSize = this.uploadedFiles.reduce((sum, file) => sum + file.size, 0);
        const validFiles = this.uploadedFiles.filter(file => file.status !== 'error').length;

        document.querySelector(`#${this.options.container} .total-files`).textContent = 
            this.uploadedFiles.length;
        document.querySelector(`#${this.options.container} .total-size`).textContent = 
            this.formatFileSize(totalSize);
        document.querySelector(`#${this.options.container} .valid-files`).textContent = 
            validFiles;
    }

    /**
     * الحصول على أيقونة الملف
     * @param {string} mimeType 
     * @returns {string}
     */
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fa-image';
        if (mimeType.startsWith('video/')) return 'fa-video';
        if (mimeType.startsWith('audio/')) return 'fa-music';
        if (mimeType.includes('pdf')) return 'fa-file-pdf';
        if (mimeType.includes('word')) return 'fa-file-word';
        if (mimeType.includes('excel')) return 'fa-file-excel';
        if (mimeType.includes('powerpoint')) return 'fa-file-powerpoint';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return 'fa-file-archive';
        return 'fa-file';
    }

    /**
     * الحصول على اسم نوع الملف للعرض
     * @param {string} type 
     * @returns {string}
     */
    getTypeDisplayName(type) {
        if (type === 'image/*') return 'صور';
        if (type === 'video/*') return 'فيديو';
        if (type === 'audio/*') return 'صوت';
        if (type.startsWith('image/')) return 'صورة';
        if (type.startsWith('video/')) return 'فيديو';
        if (type.startsWith('audio/')) return 'صوت';
        return type.split('/')[1] || type;
    }

    /**
     * الحصول على عرض الحالة
     * @param {string} status 
     * @returns {string}
     */
    getStatusDisplay(status) {
        switch (status) {
            case 'ready':
                return '<i class="fas fa-check-circle text-success"></i> جاهز';
            case 'processing':
                return '<i class="fas fa-spinner fa-spin text-primary"></i> يتم المعالجة';
            case 'done':
                return '<i class="fas fa-check-circle text-success"></i> منتهي';
            case 'error':
                return '<i class="fas fa-exclamation-circle text-danger"></i> خطأ';
            default:
                return status;
        }
    }

    /**
     * معاينة ملف
     * @param {string} fileId 
     */
    previewFile(fileId) {
        const fileInfo = this.uploadedFiles.find(f => f.id == fileId);
        if (!fileInfo) return;

        // يمكن توسيع هذه الوظيفة لعرض معاينة في modal
        if (fileInfo.file.type.startsWith('image/')) {
            const url = URL.createObjectURL(fileInfo.file);
            const img = new Image();
            img.onload = () => URL.revokeObjectURL(url);
            img.src = url;
            
            // فتح في تبويب جديد للمعاينة السريعة
            const newWindow = window.open();
            newWindow.document.write(`
                <html>
                    <head><title>معاينة: ${fileInfo.name}</title></head>
                    <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
                        <img src="${url}" style="max-width:100%; max-height:100vh; object-fit:contain;">
                    </body>
                </html>
            `);
        }
    }

    /**
     * حذف ملف
     * @param {string} fileId 
     */
    removeFile(fileId) {
        const index = this.uploadedFiles.findIndex(f => f.id == fileId);
        if (index === -1) return;

        const removedFile = this.uploadedFiles[index];
        this.uploadedFiles.splice(index, 1);

        this.updateDisplay();
        this.updateStats();

        // استدعاء callback إذا كان متوفراً
        if (this.options.onFileRemoved) {
            this.options.onFileRemoved(removedFile, this.uploadedFiles);
        }

        this.uiHelpers.showNotification(`تم حذف الملف: ${removedFile.name}`, 'info');
    }

    /**
     * مسح جميع الملفات
     */
    clearAllFiles() {
        if (this.uploadedFiles.length === 0) return;

        const count = this.uploadedFiles.length;
        this.uploadedFiles = [];
        
        this.updateDisplay();
        this.updateStats();

        this.uiHelpers.showNotification(`تم حذف ${count} ملف`, 'info');
    }

    /**
     * عرض شريط التقدم
     * @param {boolean} show 
     */
    showProgress(show) {
        if (this.uploadProgress) {
            this.uploadProgress.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * عرض الأخطاء
     * @param {Array} errors 
     */
    showErrors(errors) {
        const errorMessage = errors.map(error => 
            `${error.file}: ${error.error}`
        ).join('\n');
        
        this.uiHelpers.showNotification(`أخطاء في الملفات:\n${errorMessage}`, 'error');
    }

    /**
     * تنسيق حجم الملف
     * @param {number} bytes 
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * الحصول على الملفات المرفوعة
     * @returns {Array}
     */
    getFiles() {
        return this.uploadedFiles.filter(file => file.status !== 'error');
    }

    /**
     * الحصول على ملفات جاهزة للمعالجة
     * @returns {Array}
     */
    getReadyFiles() {
        return this.uploadedFiles.filter(file => file.status === 'ready');
    }

    /**
     * تحديث حالة ملف
     * @param {string} fileId 
     * @param {string} status 
     * @param {number} progress 
     * @param {string} error 
     */
    updateFileStatus(fileId, status, progress = 0, error = null) {
        const file = this.uploadedFiles.find(f => f.id == fileId);
        if (!file) return;

        file.status = status;
        file.progress = progress;
        file.error = error;

        this.updateDisplay();
    }

    /**
     * إعادة تعيين المكون
     */
    reset() {
        this.clearAllFiles();
        this.showProgress(false);
        
        // إعادة تعيين واجهة الرفع
        this.uploadZone?.classList.remove('drag-active');
        
        if (this.fileInput) {
            this.fileInput.value = '';
        }
    }
}

// تصدير الكلاس
export default FileUpload;