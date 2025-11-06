/**
 * UI Helpers
 * مساعدات واجهة المستخدم والتفاعل
 */

class UIHelpers {
    constructor() {
        this.notifications = [];
        this.loadingStates = new Map();
        this.modals = new Map();
    }

    /**
     * عرض إشعار للمستخدم
     * @param {string} message 
     * @param {string} type 
     * @param {number} duration 
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notification = this.createNotificationElement(message, type);
        const container = this.getNotificationContainer();
        
        container.appendChild(notification);
        this.notifications.push(notification);
        
        // إضافة الأنيميشن
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // إزالة الإشعار تلقائياً
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
        
        return notification;
    }

    /**
     * إنشاء عنصر الإشعار
     * @param {string} message 
     * @param {string} type 
     * @returns {HTMLElement}
     */
    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="${iconMap[type] || iconMap.info}"></i>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // إضافة معالج الإغلاق
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        return notification;
    }

    /**
     * الحصول على حاوي الإشعارات
     * @returns {HTMLElement}
     */
    getNotificationContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * إزالة إشعار
     * @param {HTMLElement} notification 
     */
    removeNotification(notification) {
        notification.classList.add('removing');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    /**
     * مسح جميع الإشعارات
     */
    clearAllNotifications() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
    }

    /**
     * إظهار شاشة التحميل
     * @param {string} message 
     * @param {string} key 
     */
    showLoading(message = 'جاري المعالجة...', key = 'default') {
        this.loadingStates.set(key, true);
        
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = this.createLoadingOverlay();
            document.body.appendChild(overlay);
        }
        
        const messageElement = overlay.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        overlay.classList.add('show');
    }

    /**
     * إنشاء overlay التحميل
     * @returns {HTMLElement}
     */
    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        
        overlay.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p class="loading-message">جاري المعالجة...</p>
            </div>
        `;
        
        return overlay;
    }

    /**
     * إخفاء شاشة التحميل
     * @param {string} key 
     */
    hideLoading(key = 'default') {
        this.loadingStates.delete(key);
        
        // إخفاء التحميل فقط إذا لم تكن هناك عمليات أخرى قيد التشغيل
        if (this.loadingStates.size === 0) {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.classList.remove('show');
            }
        }
    }

    /**
     * إنشاء شريط تقدم
     * @param {string} containerId 
     * @param {Object} options 
     * @returns {Object}
     */
    createProgressBar(containerId, options = {}) {
        const { 
            showPercentage = true, 
            animated = true,
            color = 'var(--primary-color)'
        } = options;
        
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.backgroundColor = color;
        progressBar.style.width = '0%';
        
        if (animated) {
            progressBar.classList.add('animated');
        }
        
        progressContainer.appendChild(progressBar);
        
        let percentageDisplay;
        if (showPercentage) {
            percentageDisplay = document.createElement('div');
            percentageDisplay.className = 'progress-percentage';
            percentageDisplay.textContent = '0%';
            progressContainer.appendChild(percentageDisplay);
        }
        
        container.appendChild(progressContainer);
        
        return {
            update: (percentage) => {
                const clampedPercentage = Math.max(0, Math.min(100, percentage));
                progressBar.style.width = `${clampedPercentage}%`;
                
                if (percentageDisplay) {
                    percentageDisplay.textContent = `${Math.round(clampedPercentage)}%`;
                }
            },
            complete: () => {
                progressBar.style.width = '100%';
                if (percentageDisplay) {
                    percentageDisplay.textContent = '100%';
                }
                
                setTimeout(() => {
                    if (progressContainer.parentNode) {
                        progressContainer.parentNode.removeChild(progressContainer);
                    }
                }, 1000);
            },
            remove: () => {
                if (progressContainer.parentNode) {
                    progressContainer.parentNode.removeChild(progressContainer);
                }
            }
        };
    }

    /**
     * إنشاء نافذة منبثقة (Modal)
     * @param {string} id 
     * @param {Object} options 
     * @returns {Object}
     */
    createModal(id, options = {}) {
        const {
            title = '',
            content = '',
            closable = true,
            width = '600px',
            height = 'auto'
        } = options;
        
        // إنشاء الـ overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = `modal-overlay-${id}`;
        
        // إنشاء الـ modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.width = width;
        modal.style.height = height;
        
        // إنشاء المحتوى
        modal.innerHTML = `
            ${title ? `
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    ${closable ? '<button class="modal-close"><i class="fas fa-times"></i></button>' : ''}
                </div>
            ` : ''}
            <div class="modal-body">
                ${content}
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // إضافة معالجات الإغلاق
        if (closable) {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeModal(id);
                });
            }
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal(id);
                }
            });
        }
        
        const modalObj = {
            show: () => {
                overlay.classList.add('show');
            },
            hide: () => {
                overlay.classList.remove('show');
            },
            close: () => {
                this.closeModal(id);
            },
            updateContent: (newContent) => {
                const body = modal.querySelector('.modal-body');
                if (body) {
                    body.innerHTML = newContent;
                }
            },
            updateTitle: (newTitle) => {
                const titleElement = modal.querySelector('.modal-title');
                if (titleElement) {
                    titleElement.textContent = newTitle;
                }
            },
            getElement: () => modal,
            getOverlay: () => overlay
        };
        
        this.modals.set(id, modalObj);
        return modalObj;
    }

    /**
     * إغلاق النافذة المنبثقة
     * @param {string} id 
     */
    closeModal(id) {
        const modal = this.modals.get(id);
        if (modal) {
            const overlay = modal.getOverlay();
            overlay.classList.remove('show');
            
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                this.modals.delete(id);
            }, 300);
        }
    }

    /**
     * إنشاء علامات التبويب (Tabs)
     * @param {string} containerId 
     * @param {Array} tabs 
     * @returns {Object}
     */
    createTabs(containerId, tabs) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container';
        
        // إنشاء navigation
        const tabsNav = document.createElement('div');
        tabsNav.className = 'tabs-nav';
        
        // إنشاء المحتوى
        const tabsContent = document.createElement('div');
        tabsContent.className = 'tabs-content';
        
        tabs.forEach((tab, index) => {
            // إنشاء زر التبويب
            const tabBtn = document.createElement('button');
            tabBtn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            tabBtn.textContent = tab.label;
            tabBtn.addEventListener('click', () => {
                this.switchTab(tabsContainer, index);
            });
            
            tabsNav.appendChild(tabBtn);
            
            // إنشاء محتوى التبويب
            const tabContent = document.createElement('div');
            tabContent.className = `tab-content ${index === 0 ? 'active' : ''}`;
            tabContent.innerHTML = tab.content;
            
            tabsContent.appendChild(tabContent);
        });
        
        tabsContainer.appendChild(tabsNav);
        tabsContainer.appendChild(tabsContent);
        container.appendChild(tabsContainer);
        
        return {
            switchTo: (index) => {
                this.switchTab(tabsContainer, index);
            },
            addTab: (tab) => {
                // TODO: تطبيق إضافة تبويب جديد
            },
            removeTab: (index) => {
                // TODO: تطبيق حذف تبويب
            }
        };
    }

    /**
     * التبديل بين التبويبات
     * @param {HTMLElement} tabsContainer 
     * @param {number} activeIndex 
     */
    switchTab(tabsContainer, activeIndex) {
        const tabBtns = tabsContainer.querySelectorAll('.tab-btn');
        const tabContents = tabsContainer.querySelectorAll('.tab-content');
        
        tabBtns.forEach((btn, index) => {
            btn.classList.toggle('active', index === activeIndex);
        });
        
        tabContents.forEach((content, index) => {
            content.classList.toggle('active', index === activeIndex);
        });
    }

    /**
     * إنشاء tooltip
     * @param {HTMLElement} element 
     * @param {string} text 
     * @param {string} position 
     */
    addTooltip(element, text, position = 'top') {
        element.classList.add('tooltip');
        element.setAttribute('data-tooltip', text);
        element.setAttribute('data-tooltip-position', position);
    }

    /**
     * نسخ نص إلى الحافظة
     * @param {string} text 
     * @returns {Promise<boolean>}
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('تم النسخ إلى الحافظة', 'success', 2000);
            return true;
        } catch (error) {
            console.error('فشل في النسخ:', error);
            
            // طريقة بديلة للنسخ
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                    this.showNotification('تم النسخ إلى الحافظة', 'success', 2000);
                    return true;
                } else {
                    throw new Error('فشل في النسخ');
                }
            } catch (err) {
                document.body.removeChild(textArea);
                this.showNotification('فشل في النسخ إلى الحافظة', 'error');
                return false;
            }
        }
    }

    /**
     * تحريك العنصر إلى منطقة الرؤية
     * @param {HTMLElement} element 
     * @param {Object} options 
     */
    scrollIntoView(element, options = {}) {
        const { behavior = 'smooth', block = 'center' } = options;
        
        element.scrollIntoView({
            behavior,
            block,
            inline: 'nearest'
        });
    }

    /**
     * إضافة رسوم متحركة لعنصر
     * @param {HTMLElement} element 
     * @param {string} animationType 
     * @param {number} duration 
     */
    animateElement(element, animationType, duration = 500) {
        element.classList.add(`animate-${animationType}`);
        
        setTimeout(() => {
            element.classList.remove(`animate-${animationType}`);
        }, duration);
    }

    /**
     * التحقق من دعم المتصفح لميزة معينة
     * @param {string} feature 
     * @returns {boolean}
     */
    checkBrowserSupport(feature) {
        const supportMap = {
            webp: () => {
                const canvas = document.createElement('canvas');
                return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
            },
            clipboard: () => navigator.clipboard && typeof navigator.clipboard.writeText === 'function',
            canvas: () => {
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext && canvas.getContext('2d'));
            },
            fileAPI: () => window.File && window.FileReader && window.FileList && window.Blob
        };
        
        const checkFunction = supportMap[feature];
        return checkFunction ? checkFunction() : false;
    }

    /**
     * تنظيف جميع العناصر المؤقتة
     */
    cleanup() {
        // إغلاق جميع النوافذ المنبثقة
        this.modals.forEach((modal, id) => {
            this.closeModal(id);
        });
        
        // مسح الإشعارات
        this.clearAllNotifications();
        
        // إخفاء التحميل
        this.loadingStates.clear();
        this.hideLoading();
    }
}

// تصدير الكلاس
export default UIHelpers;