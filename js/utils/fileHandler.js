/**
 * File Handler Utility
 * يدير رفع الملفات والتحقق من صحتها
 */

class FileHandler {
    constructor() {
        this.allowedTypes = {
            images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'],
            maxSize: 50 * 1024 * 1024, // 50MB
            maxFiles: 10
        };
        
        this.currentFiles = [];
        this.callbacks = {
            onFileSelect: null,
            onFileError: null,
            onFilesChange: null
        };
    }

    /**
     * تهيئة معالج الملفات
     * @param {Object} options - إعدادات المعالج
     */
    init(options = {}) {
        this.allowedTypes = { ...this.allowedTypes, ...options };
        this.setupEventListeners();
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // منع السلوك الافتراضي للسحب والإفلات
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, this.preventDefaults, false);
        });

        // إعداد منطقة السحب والإفلات
        this.setupDropZones();
    }

    /**
     * منع السلوك الافتراضي للأحداث
     * @param {Event} e 
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * إعداد مناطق السحب والإفلات
     */
    setupDropZones() {
        const dropZones = document.querySelectorAll('.file-upload-container, [data-drop-zone="true"]');
        
        dropZones.forEach(zone => {
            zone.addEventListener('dragenter', this.handleDragEnter.bind(this));
            zone.addEventListener('dragover', this.handleDragOver.bind(this));
            zone.addEventListener('dragleave', this.handleDragLeave.bind(this));
            zone.addEventListener('drop', this.handleDrop.bind(this));
        });
    }

    /**
     * معالج دخول السحب
     * @param {Event} e 
     */
    handleDragEnter(e) {
        e.target.classList.add('dragover');
    }

    /**
     * معالج تحريك السحب
     * @param {Event} e 
     */
    handleDragOver(e) {
        e.dataTransfer.dropEffect = 'copy';
    }

    /**
     * معالج خروج السحب
     * @param {Event} e 
     */
    handleDragLeave(e) {
        e.target.classList.remove('dragover');
    }

    /**
     * معالج إفلات الملفات
     * @param {Event} e 
     */
    handleDrop(e) {
        e.target.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files);
    }

    /**
     * معالج اختيار الملفات من input
     * @param {Event} e 
     */
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.handleFiles(files);
    }

    /**
     * معالج الملفات الرئيسي
     * @param {Array} files - قائمة الملفات
     */
    async handleFiles(files) {
        try {
            // التحقق من عدد الملفات
            if (files.length > this.allowedTypes.maxFiles) {
                throw new Error(`يمكن رفع ${this.allowedTypes.maxFiles} ملفات كحد أقصى`);
            }

            const validFiles = [];
            const errors = [];

            // التحقق من كل ملف
            for (let file of files) {
                try {
                    await this.validateFile(file);
                    validFiles.push(file);
                } catch (error) {
                    errors.push({ file: file.name, error: error.message });
                }
            }

            // إضافة الملفات الصحيحة
            if (validFiles.length > 0) {
                this.currentFiles = [...this.currentFiles, ...validFiles];
                
                if (this.callbacks.onFileSelect) {
                    this.callbacks.onFileSelect(validFiles);
                }
                
                if (this.callbacks.onFilesChange) {
                    this.callbacks.onFilesChange(this.currentFiles);
                }
            }

            // عرض الأخطاء إن وجدت
            if (errors.length > 0 && this.callbacks.onFileError) {
                this.callbacks.onFileError(errors);
            }

        } catch (error) {
            if (this.callbacks.onFileError) {
                this.callbacks.onFileError([{ error: error.message }]);
            }
        }
    }

    /**
     * التحقق من صحة الملف
     * @param {File} file 
     */
    async validateFile(file) {
        // التحقق من نوع الملف
        if (!this.allowedTypes.images.includes(file.type)) {
            throw new Error(`نوع الملف غير مدعوم: ${file.type}`);
        }

        // التحقق من حجم الملف
        if (file.size > this.allowedTypes.maxSize) {
            const maxSizeMB = (this.allowedTypes.maxSize / 1024 / 1024).toFixed(1);
            throw new Error(`حجم الملف كبير جداً. الحد الأقصى: ${maxSizeMB}MB`);
        }

        // التحقق من سلامة الصورة
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                // التحقق من أبعاد الصورة
                if (img.width < 1 || img.height < 1) {
                    reject(new Error('الصورة تالفة أو أبعادها غير صحيحة'));
                } else if (img.width > 8000 || img.height > 8000) {
                    reject(new Error('أبعاد الصورة كبيرة جداً (الحد الأقصى: 8000x8000)'));
                } else {
                    resolve(true);
                }
            };
            
            img.onerror = () => {
                reject(new Error('لا يمكن قراءة الصورة - الملف قد يكون تالفاً'));
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * تحويل الملف إلى Base64
     * @param {File} file 
     * @returns {Promise<string>}
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * تحويل الملف إلى ArrayBuffer
     * @param {File} file 
     * @returns {Promise<ArrayBuffer>}
     */
    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * تحويل Base64 إلى Blob
     * @param {string} base64 
     * @param {string} mimeType 
     * @returns {Blob}
     */
    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: mimeType });
    }

    /**
     * إنشاء رابط تحميل للملف
     * @param {Blob} blob 
     * @param {string} filename 
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * الحصول على معلومات الملف
     * @param {File} file 
     * @returns {Object}
     */
    getFileInfo(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            sizeFormatted: this.formatFileSize(file.size),
            extension: this.getFileExtension(file.name)
        };
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
     * الحصول على امتداد الملف
     * @param {string} filename 
     * @returns {string}
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * مسح الملفات الحالية
     */
    clearFiles() {
        this.currentFiles = [];
        
        if (this.callbacks.onFilesChange) {
            this.callbacks.onFilesChange(this.currentFiles);
        }
    }

    /**
     * حذف ملف محدد
     * @param {number} index 
     */
    removeFile(index) {
        if (index >= 0 && index < this.currentFiles.length) {
            this.currentFiles.splice(index, 1);
            
            if (this.callbacks.onFilesChange) {
                this.callbacks.onFilesChange(this.currentFiles);
            }
        }
    }

    /**
     * تسجيل معالج الأحداث
     * @param {string} event 
     * @param {Function} callback 
     */
    on(event, callback) {
        if (this.callbacks.hasOwnProperty('on' + event.charAt(0).toUpperCase() + event.slice(1))) {
            this.callbacks['on' + event.charAt(0).toUpperCase() + event.slice(1)] = callback;
        }
    }

    /**
     * الحصول على الملفات الحالية
     * @returns {Array}
     */
    getFiles() {
        return this.currentFiles;
    }

    /**
     * التحقق من وجود ملفات
     * @returns {boolean}
     */
    hasFiles() {
        return this.currentFiles.length > 0;
    }
}

// تصدير الكلاس
export default FileHandler;