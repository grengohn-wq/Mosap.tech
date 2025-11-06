/**
 * Image Utilities
 * مكتبة الأدوات المساعدة للتعامل مع الصور
 */

class ImageUtils {
    constructor() {
        this.canvas = null;
        this.ctx = null;
    }

    /**
     * إنشاء canvas جديد
     * @param {number} width 
     * @param {number} height 
     * @returns {HTMLCanvasElement}
     */
    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    /**
     * تحميل صورة من ملف أو URL
     * @param {File|string} source 
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(source) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('فشل في تحميل الصورة'));
            
            if (source instanceof File) {
                img.src = URL.createObjectURL(source);
            } else {
                img.src = source;
            }
        });
    }

    /**
     * تحويل صورة إلى Canvas
     * @param {HTMLImageElement} img 
     * @param {Object} options 
     * @returns {HTMLCanvasElement}
     */
    imageToCanvas(img, options = {}) {
        const { width = img.width, height = img.height, quality = 1 } = options;
        
        const canvas = this.createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // تحسين جودة الرسم
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // رسم الصورة
        ctx.drawImage(img, 0, 0, width, height);
        
        return canvas;
    }

    /**
     * تحويل Canvas إلى Blob
     * @param {HTMLCanvasElement} canvas 
     * @param {Object} options 
     * @returns {Promise<Blob>}
     */
    canvasToBlob(canvas, options = {}) {
        const { format = 'image/jpeg', quality = 0.9 } = options;
        
        return new Promise((resolve, reject) => {
            canvas.toBlob(resolve, format, quality);
        });
    }

    /**
     * تحويل Canvas إلى Base64
     * @param {HTMLCanvasElement} canvas 
     * @param {Object} options 
     * @returns {string}
     */
    canvasToBase64(canvas, options = {}) {
        const { format = 'image/jpeg', quality = 0.9 } = options;
        return canvas.toDataURL(format, quality);
    }

    /**
     * تغيير حجم الصورة
     * @param {HTMLImageElement|HTMLCanvasElement} source 
     * @param {Object} options 
     * @returns {HTMLCanvasElement}
     */
    resizeImage(source, options = {}) {
        const { width, height, maintainAspectRatio = true, resizeMethod = 'lanczos' } = options;
        
        let newWidth, newHeight;
        
        if (maintainAspectRatio) {
            const aspectRatio = source.width / source.height;
            
            if (width && height) {
                const targetRatio = width / height;
                if (aspectRatio > targetRatio) {
                    newWidth = width;
                    newHeight = width / aspectRatio;
                } else {
                    newWidth = height * aspectRatio;
                    newHeight = height;
                }
            } else if (width) {
                newWidth = width;
                newHeight = width / aspectRatio;
            } else if (height) {
                newWidth = height * aspectRatio;
                newHeight = height;
            } else {
                newWidth = source.width;
                newHeight = source.height;
            }
        } else {
            newWidth = width || source.width;
            newHeight = height || source.height;
        }

        // استخدام خوارزمية تغيير الحجم المناسبة
        if (resizeMethod === 'lanczos' && (newWidth < source.width || newHeight < source.height)) {
            return this.lanczosResize(source, newWidth, newHeight);
        } else {
            return this.simpleResize(source, newWidth, newHeight);
        }
    }

    /**
     * تغيير حجم بسيط
     * @param {HTMLImageElement|HTMLCanvasElement} source 
     * @param {number} width 
     * @param {number} height 
     * @returns {HTMLCanvasElement}
     */
    simpleResize(source, width, height) {
        const canvas = this.createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, width, height);
        
        return canvas;
    }

    /**
     * تغيير حجم باستخدام Lanczos
     * @param {HTMLImageElement|HTMLCanvasElement} source 
     * @param {number} targetWidth 
     * @param {number} targetHeight 
     * @returns {HTMLCanvasElement}
     */
    lanczosResize(source, targetWidth, targetHeight) {
        // تطبيق متدرج لتحسين الجودة
        let currentWidth = source.width;
        let currentHeight = source.height;
        let canvas = this.imageToCanvas(source);

        // تصغير تدريجي إذا كان الحجم المطلوب أصغر كثيراً
        while (currentWidth > targetWidth * 2 || currentHeight > targetHeight * 2) {
            currentWidth = Math.max(targetWidth, Math.floor(currentWidth * 0.5));
            currentHeight = Math.max(targetHeight, Math.floor(currentHeight * 0.5));
            
            canvas = this.simpleResize(canvas, currentWidth, currentHeight);
        }

        // التحجيم النهائي
        return this.simpleResize(canvas, targetWidth, targetHeight);
    }

    /**
     * قص الصورة
     * @param {HTMLImageElement|HTMLCanvasElement} source 
     * @param {Object} cropArea 
     * @returns {HTMLCanvasElement}
     */
    cropImage(source, cropArea) {
        const { x, y, width, height } = cropArea;
        
        const canvas = this.createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(source, x, y, width, height, 0, 0, width, height);
        
        return canvas;
    }

    /**
     * تدوير الصورة
     * @param {HTMLImageElement|HTMLCanvasElement} source 
     * @param {number} angle - الزاوية بالدرجات
     * @returns {HTMLCanvasElement}
     */
    rotateImage(source, angle) {
        const radians = (angle * Math.PI) / 180;
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));
        
        const newWidth = source.width * cos + source.height * sin;
        const newHeight = source.width * sin + source.height * cos;
        
        const canvas = this.createCanvas(newWidth, newHeight);
        const ctx = canvas.getContext('2d');
        
        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(radians);
        ctx.drawImage(source, -source.width / 2, -source.height / 2);
        
        return canvas;
    }

    /**
     * انعكاس الصورة
     * @param {HTMLImageElement|HTMLCanvasElement} source 
     * @param {string} direction - 'horizontal' أو 'vertical'
     * @returns {HTMLCanvasElement}
     */
    flipImage(source, direction) {
        const canvas = this.createCanvas(source.width, source.height);
        const ctx = canvas.getContext('2d');
        
        if (direction === 'horizontal') {
            ctx.scale(-1, 1);
            ctx.drawImage(source, -source.width, 0);
        } else if (direction === 'vertical') {
            ctx.scale(1, -1);
            ctx.drawImage(source, 0, -source.height);
        }
        
        return canvas;
    }

    /**
     * تطبيق فلتر على الصورة
     * @param {HTMLImageElement|HTMLCanvasElement} source 
     * @param {string} filterType 
     * @param {number} intensity 
     * @returns {HTMLCanvasElement}
     */
    applyFilter(source, filterType, intensity = 1) {
        const canvas = this.imageToCanvas(source);
        const ctx = canvas.getContext('2d');
        
        switch (filterType) {
            case 'brightness':
                ctx.filter = `brightness(${1 + intensity})`;
                break;
            case 'contrast':
                ctx.filter = `contrast(${1 + intensity})`;
                break;
            case 'saturate':
                ctx.filter = `saturate(${1 + intensity})`;
                break;
            case 'grayscale':
                ctx.filter = `grayscale(${intensity})`;
                break;
            case 'blur':
                ctx.filter = `blur(${intensity}px)`;
                break;
            case 'sepia':
                ctx.filter = `sepia(${intensity})`;
                break;
        }
        
        ctx.drawImage(source, 0, 0);
        return canvas;
    }

    /**
     * استخراج الألوان السائدة من الصورة
     * @param {HTMLImageElement|HTMLCanvasElement} source 
     * @param {number} colorCount 
     * @returns {Array}
     */
    extractDominantColors(source, colorCount = 5) {
        // تصغير الصورة لتسريع المعالجة
        const smallCanvas = this.resizeImage(source, { width: 100, height: 100 });
        const ctx = smallCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, smallCanvas.width, smallCanvas.height);
        const pixels = imageData.data;
        
        const colorMap = {};
        
        // حساب تكرار الألوان
        for (let i = 0; i < pixels.length; i += 16) { // تخطي بكسلات للسرعة
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const alpha = pixels[i + 3];
            
            if (alpha < 128) continue; // تجاهل البكسلات الشفافة
            
            // تقريب القيم لتقليل عدد الألوان
            const roundedR = Math.round(r / 10) * 10;
            const roundedG = Math.round(g / 10) * 10;
            const roundedB = Math.round(b / 10) * 10;
            
            const colorKey = `${roundedR},${roundedG},${roundedB}`;
            colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
        }
        
        // ترتيب الألوان حسب التكرار
        const sortedColors = Object.entries(colorMap)
            .sort(([,a], [,b]) => b - a)
            .slice(0, colorCount)
            .map(([color, count]) => {
                const [r, g, b] = color.split(',').map(Number);
                return {
                    rgb: [r, g, b],
                    hex: this.rgbToHex(r, g, b),
                    hsl: this.rgbToHsl(r, g, b),
                    count
                };
            });
        
        return sortedColors;
    }

    /**
     * تحويل RGB إلى HEX
     * @param {number} r 
     * @param {number} g 
     * @param {number} b 
     * @returns {string}
     */
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * تحويل RGB إلى HSL
     * @param {number} r 
     * @param {number} g 
     * @param {number} b 
     * @returns {Array}
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
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

        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    /**
     * الحصول على معلومات الصورة
     * @param {HTMLImageElement|HTMLCanvasElement} source 
     * @returns {Object}
     */
    getImageInfo(source) {
        return {
            width: source.width,
            height: source.height,
            aspectRatio: source.width / source.height,
            megapixels: (source.width * source.height / 1000000).toFixed(2),
            orientation: source.width > source.height ? 'landscape' : 
                        source.width < source.height ? 'portrait' : 'square'
        };
    }

    /**
     * حساب الحجم الأمثل للصورة
     * @param {Object} currentSize 
     * @param {Object} constraints 
     * @returns {Object}
     */
    calculateOptimalSize(currentSize, constraints = {}) {
        const { maxWidth, maxHeight, maxFileSize, quality = 0.9 } = constraints;
        let { width, height } = currentSize;
        
        const aspectRatio = width / height;
        
        // تطبيق قيود الحد الأقصى للأبعاد
        if (maxWidth && width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
        }
        
        if (maxHeight && height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        // تقدير حجم الملف وتعديل الجودة إذا لزم الأمر
        let estimatedQuality = quality;
        if (maxFileSize) {
            const estimatedSize = (width * height * 3 * estimatedQuality) / 1024; // تقدير تقريبي
            if (estimatedSize > maxFileSize) {
                estimatedQuality = Math.max(0.1, (maxFileSize * 1024) / (width * height * 3));
            }
        }
        
        return {
            width: Math.round(width),
            height: Math.round(height),
            quality: estimatedQuality
        };
    }

    /**
     * إضافة علامة مائية نصية
     * @param {HTMLImageElement|HTMLCanvasElement} source 
     * @param {Object} options 
     * @returns {HTMLCanvasElement}
     */
    addTextWatermark(source, options = {}) {
        const {
            text = 'Watermark',
            fontSize = 24,
            fontFamily = 'Arial',
            color = 'rgba(255, 255, 255, 0.7)',
            position = 'bottom-right',
            margin = 20
        } = options;
        
        const canvas = this.imageToCanvas(source);
        const ctx = canvas.getContext('2d');
        
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'bottom';
        
        const textMetrics = ctx.measureText(text);
        let x, y;
        
        switch (position) {
            case 'top-left':
                x = margin;
                y = fontSize + margin;
                break;
            case 'top-right':
                x = canvas.width - textMetrics.width - margin;
                y = fontSize + margin;
                break;
            case 'bottom-left':
                x = margin;
                y = canvas.height - margin;
                break;
            case 'bottom-right':
                x = canvas.width - textMetrics.width - margin;
                y = canvas.height - margin;
                break;
            case 'center':
                x = (canvas.width - textMetrics.width) / 2;
                y = canvas.height / 2;
                break;
        }
        
        // إضافة ظل للنص لتحسين الوضوح
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillText(text, x, y);
        
        return canvas;
    }

    /**
     * تنظيف الذاكرة
     */
    cleanup() {
        if (this.canvas) {
            this.canvas = null;
            this.ctx = null;
        }
    }
}

// تصدير الكلاس
export default ImageUtils;