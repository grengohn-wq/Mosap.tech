/**
 * Results Panel Component
 * مكون لوحة النتائج لعرض وإدارة الملفات المعالجة
 */

import UIHelpers from '../utils/uiHelpers.js';

class ResultsPanel {
    constructor(options = {}) {
        this.uiHelpers = new UIHelpers();
        
        // إعدادات افتراضية
        this.options = {
            container: options.container || 'results-section',
            showComparison: options.showComparison !== false,
            showStats: options.showStats !== false,
            allowBatchDownload: options.allowBatchDownload !== false,
            maxResults: options.maxResults || 50,
            autoSave: options.autoSave || false,
            onResultSelected: options.onResultSelected || null,
            onResultRemoved: options.onResultRemoved || null,
            ...options
        };

        this.results = [];
        this.selectedResults = new Set();
        this.currentView = 'grid'; // grid, list, comparison
        this.sortBy = 'date'; // date, name, size, type
        this.sortOrder = 'desc'; // asc, desc
        this.filterBy = 'all'; // all, images, videos, documents
    }

    /**
     * تهيئة لوحة النتائج
     */
    init() {
        this.createInterface();
        this.setupEventListeners();
        this.loadSavedResults();
    }

    /**
     * إنشاء واجهة لوحة النتائج
     */
    createInterface() {
        const container = document.getElementById(this.options.container);
        if (!container) return;

        container.innerHTML = `
            <div class="results-panel">
                <!-- رأس اللوحة -->
                <div class="results-header">
                    <div class="header-info">
                        <h3><i class="fas fa-download"></i> النتائج</h3>
                        <span class="results-count">0 نتيجة</span>
                    </div>
                    
                    <div class="header-controls">
                        <!-- أدوات العرض -->
                        <div class="view-controls">
                            <div class="view-modes">
                                <button class="btn btn-sm view-mode-btn active" data-view="grid" title="عرض شبكي">
                                    <i class="fas fa-th"></i>
                                </button>
                                <button class="btn btn-sm view-mode-btn" data-view="list" title="عرض قائمة">
                                    <i class="fas fa-list"></i>
                                </button>
                                <button class="btn btn-sm view-mode-btn" data-view="comparison" title="عرض مقارنة">
                                    <i class="fas fa-columns"></i>
                                </button>
                            </div>
                        </div>

                        <!-- أدوات الترتيب والفلترة -->
                        <div class="filter-controls">
                            <select class="form-select form-select-sm" id="sort-by">
                                <option value="date">ترتيب: التاريخ</option>
                                <option value="name">ترتيب: الاسم</option>
                                <option value="size">ترتيب: الحجم</option>
                                <option value="type">ترتيب: النوع</option>
                            </select>
                            
                            <button class="btn btn-sm btn-outline" id="sort-order" data-order="desc" title="اتجاه الترتيب">
                                <i class="fas fa-sort-amount-down"></i>
                            </button>
                            
                            <select class="form-select form-select-sm" id="filter-by">
                                <option value="all">جميع الملفات</option>
                                <option value="images">الصور</option>
                                <option value="videos">الفيديو</option>
                                <option value="documents">المستندات</option>
                            </select>
                        </div>

                        <!-- أدوات الإجراءات -->
                        <div class="action-controls">
                            ${this.options.allowBatchDownload ? `
                                <button class="btn btn-sm btn-primary" id="download-selected-btn" disabled>
                                    <i class="fas fa-download"></i>
                                    تحميل المحدد
                                </button>
                                
                                <button class="btn btn-sm btn-success" id="download-all-btn" disabled>
                                    <i class="fas fa-file-archive"></i>
                                    تحميل الكل
                                </button>
                            ` : ''}
                            
                            <button class="btn btn-sm btn-outline" id="clear-results-btn">
                                <i class="fas fa-trash"></i>
                                مسح النتائج
                            </button>
                        </div>
                    </div>
                </div>

                <!-- شريط الإحصائيات -->
                ${this.options.showStats ? `
                    <div class="results-stats" id="results-stats" style="display: none;">
                        <div class="stats-grid">
                            <div class="stat-item">
                                <label>إجمالي النتائج:</label>
                                <span class="stat-value" id="total-results">0</span>
                            </div>
                            <div class="stat-item">
                                <label>الحجم الكلي:</label>
                                <span class="stat-value" id="total-size">0 KB</span>
                            </div>
                            <div class="stat-item">
                                <label>النتائج المحددة:</label>
                                <span class="stat-value" id="selected-count">0</span>
                            </div>
                            <div class="stat-item">
                                <label>نسبة الضغط:</label>
                                <span class="stat-value" id="compression-ratio">-</span>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- أدوات التحديد المجمع -->
                <div class="bulk-selection" id="bulk-selection" style="display: none;">
                    <div class="selection-controls">
                        <button class="btn btn-xs btn-outline" id="select-all-results">
                            <i class="fas fa-check-square"></i>
                            تحديد الكل
                        </button>
                        <button class="btn btn-xs btn-outline" id="select-none-results">
                            <i class="fas fa-square"></i>
                            إلغاء التحديد
                        </button>
                        <button class="btn btn-xs btn-outline" id="invert-selection">
                            <i class="fas fa-exchange-alt"></i>
                            عكس التحديد
                        </button>
                    </div>
                </div>

                <!-- منطقة عرض النتائج -->
                <div class="results-viewport">
                    <!-- العرض الشبكي -->
                    <div class="results-container grid-view active" id="grid-view">
                        <div class="results-grid" id="results-grid">
                            <!-- سيتم إنشاؤها ديناميكياً -->
                        </div>
                        
                        <div class="empty-results" id="empty-results">
                            <div class="empty-icon">
                                <i class="fas fa-folder-open"></i>
                            </div>
                            <h4>لا توجد نتائج</h4>
                            <p>ستظهر الملفات المعالجة هنا بعد انتهاء المعالجة</p>
                        </div>
                    </div>

                    <!-- عرض القائمة -->
                    <div class="results-container list-view" id="list-view">
                        <div class="results-table">
                            <div class="table-header">
                                <div class="table-cell checkbox-cell">
                                    <input type="checkbox" id="select-all-checkbox">
                                </div>
                                <div class="table-cell name-cell">الاسم</div>
                                <div class="table-cell size-cell">الحجم</div>
                                <div class="table-cell type-cell">النوع</div>
                                <div class="table-cell date-cell">التاريخ</div>
                                <div class="table-cell actions-cell">الإجراءات</div>
                            </div>
                            <div class="table-body" id="results-table-body">
                                <!-- سيتم إنشاؤها ديناميكياً -->
                            </div>
                        </div>
                    </div>

                    <!-- عرض المقارنة -->
                    <div class="results-container comparison-view" id="comparison-view">
                        <div class="comparison-selector">
                            <div class="selector-group">
                                <label>النتيجة الأولى:</label>
                                <select class="form-select" id="compare-first">
                                    <option value="">اختر نتيجة...</option>
                                </select>
                            </div>
                            <div class="selector-group">
                                <label>النتيجة الثانية:</label>
                                <select class="form-select" id="compare-second">
                                    <option value="">اختر نتيجة...</option>
                                </select>
                            </div>
                            <button class="btn btn-primary" id="start-comparison" disabled>
                                <i class="fas fa-columns"></i>
                                مقارنة
                            </button>
                        </div>
                        
                        <div class="comparison-results" id="comparison-results" style="display: none;">
                            <!-- سيتم إنشاؤها ديناميكياً -->
                        </div>
                    </div>
                </div>

                <!-- مؤشر التحميل -->
                <div class="results-loading" id="results-loading" style="display: none;">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>جاري معالجة النتائج...</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // أوضاع العرض
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.setView(view);
            });
        });

        // الترتيب والفلترة
        document.getElementById('sort-by')?.addEventListener('change', (e) => {
            this.setSortBy(e.target.value);
        });

        document.getElementById('sort-order')?.addEventListener('click', (e) => {
            const currentOrder = e.target.dataset.order;
            const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
            this.setSortOrder(newOrder);
        });

        document.getElementById('filter-by')?.addEventListener('change', (e) => {
            this.setFilter(e.target.value);
        });

        // إجراءات مجمعة
        document.getElementById('download-selected-btn')?.addEventListener('click', () => {
            this.downloadSelected();
        });

        document.getElementById('download-all-btn')?.addEventListener('click', () => {
            this.downloadAll();
        });

        document.getElementById('clear-results-btn')?.addEventListener('click', () => {
            this.clearResults();
        });

        // تحديد مجمع
        document.getElementById('select-all-results')?.addEventListener('click', () => {
            this.selectAll();
        });

        document.getElementById('select-none-results')?.addEventListener('click', () => {
            this.selectNone();
        });

        document.getElementById('invert-selection')?.addEventListener('click', () => {
            this.invertSelection();
        });

        document.getElementById('select-all-checkbox')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.selectAll();
            } else {
                this.selectNone();
            }
        });

        // المقارنة
        document.getElementById('compare-first')?.addEventListener('change', () => {
            this.updateComparisonButton();
        });

        document.getElementById('compare-second')?.addEventListener('change', () => {
            this.updateComparisonButton();
        });

        document.getElementById('start-comparison')?.addEventListener('click', () => {
            this.startComparison();
        });
    }

    /**
     * إضافة نتيجة جديدة
     * @param {Object} result 
     */
    addResult(result) {
        const resultInfo = {
            id: result.id || Date.now() + Math.random(),
            name: result.name,
            originalName: result.originalName || result.name,
            size: result.size,
            originalSize: result.originalSize,
            type: result.type,
            blob: result.blob,
            originalBlob: result.originalBlob,
            url: result.url || URL.createObjectURL(result.blob),
            originalUrl: result.originalUrl,
            thumbnail: result.thumbnail,
            metadata: result.metadata || {},
            processingInfo: result.processingInfo || {},
            timestamp: new Date(),
            selected: false,
            ...result
        };

        this.results.unshift(resultInfo); // إضافة في المقدمة

        // تحديد عدد النتائج
        if (this.results.length > this.options.maxResults) {
            const removed = this.results.splice(this.options.maxResults);
            removed.forEach(r => {
                if (r.url) URL.revokeObjectURL(r.url);
                if (r.originalUrl) URL.revokeObjectURL(r.originalUrl);
            });
        }

        this.updateDisplay();
        this.updateStats();
        this.updateComparisonOptions();

        if (this.options.autoSave) {
            this.saveResults();
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
     * تحديث العرض
     */
    updateDisplay() {
        this.sortResults();
        this.filterResults();

        switch (this.currentView) {
            case 'grid':
                this.updateGridView();
                break;
            case 'list':
                this.updateListView();
                break;
            case 'comparison':
                this.updateComparisonView();
                break;
        }

        this.updateResultsCount();
        this.updateBulkActions();
    }

    /**
     * تحديث العرض الشبكي
     */
    updateGridView() {
        const container = document.getElementById('results-grid');
        const emptyState = document.getElementById('empty-results');
        
        if (this.filteredResults.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        
        container.innerHTML = this.filteredResults.map((result, index) => `
            <div class="result-card ${result.selected ? 'selected' : ''}" data-result-id="${result.id}">
                <div class="card-header">
                    <div class="card-checkbox">
                        <input type="checkbox" ${result.selected ? 'checked' : ''} 
                               onchange="resultsPanel.toggleResult('${result.id}', this.checked)">
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-xs btn-outline" onclick="resultsPanel.previewResult('${result.id}')" title="معاينة">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-xs btn-outline" onclick="resultsPanel.downloadResult('${result.id}')" title="تحميل">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-xs btn-outline" onclick="resultsPanel.removeResult('${result.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="card-preview">
                    ${result.thumbnail ? 
                        `<img src="${result.thumbnail}" alt="${result.name}" onclick="resultsPanel.previewResult('${result.id}')">` :
                        `<div class="file-icon"><i class="fas ${this.getFileIcon(result.type)}"></i></div>`
                    }
                    
                    ${this.options.showComparison && result.originalUrl ? `
                        <div class="comparison-toggle" onclick="resultsPanel.showComparison('${result.id}')">
                            <i class="fas fa-columns"></i>
                        </div>
                    ` : ''}
                </div>
                
                <div class="card-info">
                    <div class="card-title" title="${result.name}">${this.truncateText(result.name, 20)}</div>
                    <div class="card-meta">
                        <span class="file-size">${this.formatFileSize(result.size)}</span>
                        ${result.originalSize && result.originalSize !== result.size ? `
                            <span class="compression-info">
                                (${this.calculateCompressionRatio(result.originalSize, result.size)}% ضغط)
                            </span>
                        ` : ''}
                    </div>
                    <div class="card-date">${this.formatDate(result.timestamp)}</div>
                    
                    ${result.processingInfo && Object.keys(result.processingInfo).length > 0 ? `
                        <div class="processing-tags">
                            ${Object.entries(result.processingInfo).map(([key, value]) => 
                                `<span class="tag">${key}: ${value}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * تحديث عرض القائمة
     */
    updateListView() {
        const container = document.getElementById('results-table-body');
        
        if (this.filteredResults.length === 0) {
            container.innerHTML = `
                <div class="table-empty">
                    <div class="empty-message">
                        <i class="fas fa-folder-open"></i>
                        <p>لا توجد نتائج للعرض</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredResults.map(result => `
            <div class="table-row ${result.selected ? 'selected' : ''}" data-result-id="${result.id}">
                <div class="table-cell checkbox-cell">
                    <input type="checkbox" ${result.selected ? 'checked' : ''} 
                           onchange="resultsPanel.toggleResult('${result.id}', this.checked)">
                </div>
                <div class="table-cell name-cell">
                    <div class="file-info">
                        ${result.thumbnail ? 
                            `<img src="${result.thumbnail}" alt="${result.name}" class="file-thumbnail">` :
                            `<i class="fas ${this.getFileIcon(result.type)} file-icon"></i>`
                        }
                        <span class="file-name" title="${result.name}">${result.name}</span>
                    </div>
                </div>
                <div class="table-cell size-cell">
                    <div class="size-info">
                        <span class="current-size">${this.formatFileSize(result.size)}</span>
                        ${result.originalSize && result.originalSize !== result.size ? `
                            <small class="original-size">(${this.formatFileSize(result.originalSize)})</small>
                        ` : ''}
                    </div>
                </div>
                <div class="table-cell type-cell">
                    <span class="file-type">${this.getTypeDisplayName(result.type)}</span>
                </div>
                <div class="table-cell date-cell">
                    <span class="file-date">${this.formatDate(result.timestamp)}</span>
                </div>
                <div class="table-cell actions-cell">
                    <div class="action-buttons">
                        <button class="btn btn-xs btn-outline" onclick="resultsPanel.previewResult('${result.id}')" title="معاينة">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-xs btn-outline" onclick="resultsPanel.downloadResult('${result.id}')" title="تحميل">
                            <i class="fas fa-download"></i>
                        </button>
                        ${this.options.showComparison && result.originalUrl ? `
                            <button class="btn btn-xs btn-outline" onclick="resultsPanel.showComparison('${result.id}')" title="مقارنة">
                                <i class="fas fa-columns"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-xs btn-outline" onclick="resultsPanel.removeResult('${result.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * ترتيب النتائج
     */
    sortResults() {
        const sortedResults = [...this.results];
        
        sortedResults.sort((a, b) => {
            let aValue, bValue;
            
            switch (this.sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'size':
                    aValue = a.size;
                    bValue = b.size;
                    break;
                case 'type':
                    aValue = a.type;
                    bValue = b.type;
                    break;
                case 'date':
                default:
                    aValue = a.timestamp.getTime();
                    bValue = b.timestamp.getTime();
                    break;
            }
            
            if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        this.sortedResults = sortedResults;
    }

    /**
     * فلترة النتائج
     */
    filterResults() {
        let filtered = this.sortedResults || this.results;
        
        if (this.filterBy !== 'all') {
            filtered = filtered.filter(result => {
                switch (this.filterBy) {
                    case 'images':
                        return result.type.startsWith('image/');
                    case 'videos':
                        return result.type.startsWith('video/');
                    case 'documents':
                        return !result.type.startsWith('image/') && !result.type.startsWith('video/');
                    default:
                        return true;
                }
            });
        }
        
        this.filteredResults = filtered;
    }

    /**
     * تحديد وضع العرض
     * @param {string} view 
     */
    setView(view) {
        this.currentView = view;

        // تحديث الأزرار
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // تحديث المحتوى
        document.querySelectorAll('.results-container').forEach(container => {
            container.classList.remove('active');
        });

        const activeContainer = document.getElementById(`${view}-view`);
        if (activeContainer) {
            activeContainer.classList.add('active');
        }

        this.updateDisplay();
    }

    /**
     * تحديد طريقة الترتيب
     * @param {string} sortBy 
     */
    setSortBy(sortBy) {
        this.sortBy = sortBy;
        this.updateDisplay();
    }

    /**
     * تحديد اتجاه الترتيب
     * @param {string} order 
     */
    setSortOrder(order) {
        this.sortOrder = order;
        
        const btn = document.getElementById('sort-order');
        btn.dataset.order = order;
        
        const icon = btn.querySelector('i');
        icon.className = order === 'asc' ? 'fas fa-sort-amount-up' : 'fas fa-sort-amount-down';
        
        this.updateDisplay();
    }

    /**
     * تحديد الفلتر
     * @param {string} filter 
     */
    setFilter(filter) {
        this.filterBy = filter;
        this.updateDisplay();
    }

    /**
     * تبديل تحديد نتيجة
     * @param {string} resultId 
     * @param {boolean} selected 
     */
    toggleResult(resultId, selected) {
        const result = this.results.find(r => r.id == resultId);
        if (result) {
            result.selected = selected;
            
            if (selected) {
                this.selectedResults.add(resultId);
            } else {
                this.selectedResults.delete(resultId);
            }
            
            this.updateBulkActions();
            
            if (this.options.onResultSelected) {
                this.options.onResultSelected(result, selected);
            }
        }
    }

    /**
     * تحديد جميع النتائج
     */
    selectAll() {
        this.filteredResults.forEach(result => {
            result.selected = true;
            this.selectedResults.add(result.id);
        });
        this.updateDisplay();
        this.updateBulkActions();
    }

    /**
     * إلغاء تحديد جميع النتائج
     */
    selectNone() {
        this.results.forEach(result => {
            result.selected = false;
        });
        this.selectedResults.clear();
        this.updateDisplay();
        this.updateBulkActions();
    }

    /**
     * عكس التحديد
     */
    invertSelection() {
        this.filteredResults.forEach(result => {
            result.selected = !result.selected;
            if (result.selected) {
                this.selectedResults.add(result.id);
            } else {
                this.selectedResults.delete(result.id);
            }
        });
        this.updateDisplay();
        this.updateBulkActions();
    }

    /**
     * معاينة نتيجة
     * @param {string} resultId 
     */
    previewResult(resultId) {
        const result = this.results.find(r => r.id == resultId);
        if (!result) return;

        // يمكن توسيع هذا لعرض معاينة في modal أو لوحة منفصلة
        if (result.type.startsWith('image/')) {
            const newWindow = window.open();
            newWindow.document.write(`
                <html>
                    <head><title>معاينة: ${result.name}</title></head>
                    <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
                        <img src="${result.url}" style="max-width:100%; max-height:100vh; object-fit:contain;">
                    </body>
                </html>
            `);
        } else {
            // فتح الملف في تبويب جديد
            window.open(result.url, '_blank');
        }
    }

    /**
     * تحميل نتيجة
     * @param {string} resultId 
     */
    downloadResult(resultId) {
        const result = this.results.find(r => r.id == resultId);
        if (!result) return;

        const link = document.createElement('a');
        link.href = result.url;
        link.download = result.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.uiHelpers.showNotification(`تم تحميل: ${result.name}`, 'success');
    }

    /**
     * حذف نتيجة
     * @param {string} resultId 
     */
    removeResult(resultId) {
        const index = this.results.findIndex(r => r.id == resultId);
        if (index === -1) return;

        const result = this.results[index];
        
        // تحرير الذاكرة
        if (result.url) URL.revokeObjectURL(result.url);
        if (result.originalUrl) URL.revokeObjectURL(result.originalUrl);
        
        // إزالة من المصفوفة والتحديد
        this.results.splice(index, 1);
        this.selectedResults.delete(resultId);
        
        this.updateDisplay();
        this.updateStats();
        this.updateComparisonOptions();

        if (this.options.onResultRemoved) {
            this.options.onResultRemoved(result);
        }

        this.uiHelpers.showNotification(`تم حذف: ${result.name}`, 'info');
    }

    /**
     * تحميل النتائج المحددة
     */
    async downloadSelected() {
        const selectedResults = this.results.filter(r => r.selected);
        if (selectedResults.length === 0) {
            this.uiHelpers.showNotification('لم يتم تحديد أي نتائج', 'warning');
            return;
        }

        // تحميل فردي أو مضغوط حسب العدد
        if (selectedResults.length === 1) {
            this.downloadResult(selectedResults[0].id);
        } else {
            await this.downloadAsZip(selectedResults);
        }
    }

    /**
     * تحميل جميع النتائج
     */
    async downloadAll() {
        if (this.results.length === 0) {
            this.uiHelpers.showNotification('لا توجد نتائج للتحميل', 'warning');
            return;
        }

        if (this.results.length === 1) {
            this.downloadResult(this.results[0].id);
        } else {
            await this.downloadAsZip(this.results);
        }
    }

    /**
     * تحميل كملف مضغوط
     * @param {Array} results 
     */
    async downloadAsZip(results) {
        try {
            this.uiHelpers.showLoading('جاري إنشاء الملف المضغوط...');
            
            // هذا يتطلب مكتبة JSZip
            // يمكن تنفيذه لاحقاً أو استخدام تحميل متعدد
            
            // تحميل متعدد مؤقت
            for (const result of results) {
                setTimeout(() => this.downloadResult(result.id), 100);
            }
            
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification(`بدء تحميل ${results.length} ملف`, 'success');
            
        } catch (error) {
            this.uiHelpers.hideLoading();
            this.uiHelpers.showNotification('فشل في إنشاء الملف المضغوط', 'error');
        }
    }

    /**
     * مسح جميع النتائج
     */
    clearResults() {
        if (this.results.length === 0) return;

        // تأكيد الحذف
        if (!confirm('هل تريد مسح جميع النتائج؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            return;
        }

        // تحرير الذاكرة
        this.results.forEach(result => {
            if (result.url) URL.revokeObjectURL(result.url);
            if (result.originalUrl) URL.revokeObjectURL(result.originalUrl);
        });

        // مسح البيانات
        this.results = [];
        this.selectedResults.clear();

        this.updateDisplay();
        this.updateStats();
        this.updateComparisonOptions();

        this.uiHelpers.showNotification('تم مسح جميع النتائج', 'info');
    }

    /**
     * تحديث عداد النتائج
     */
    updateResultsCount() {
        const count = this.filteredResults ? this.filteredResults.length : this.results.length;
        document.querySelector('.results-count').textContent = `${count} نتيجة`;
    }

    /**
     * تحديث الإجراءات المجمعة
     */
    updateBulkActions() {
        const selectedCount = this.selectedResults.size;
        
        document.getElementById('download-selected-btn').disabled = selectedCount === 0;
        document.getElementById('download-all-btn').disabled = this.results.length === 0;
        
        if (this.options.showStats) {
            document.getElementById('selected-count').textContent = selectedCount;
        }

        // إظهار أدوات التحديد المجمع
        const bulkSelection = document.getElementById('bulk-selection');
        if (bulkSelection) {
            bulkSelection.style.display = this.results.length > 0 ? 'block' : 'none';
        }
    }

    /**
     * تحديث الإحصائيات
     */
    updateStats() {
        if (!this.options.showStats) return;

        const totalSize = this.results.reduce((sum, result) => sum + result.size, 0);
        const totalOriginalSize = this.results.reduce((sum, result) => 
            sum + (result.originalSize || result.size), 0);
        
        const compressionRatio = totalOriginalSize > 0 ? 
            ((totalOriginalSize - totalSize) / totalOriginalSize * 100).toFixed(1) : 0;

        document.getElementById('total-results').textContent = this.results.length;
        document.getElementById('total-size').textContent = this.formatFileSize(totalSize);
        document.getElementById('compression-ratio').textContent = compressionRatio + '%';

        const statsSection = document.getElementById('results-stats');
        statsSection.style.display = this.results.length > 0 ? 'block' : 'none';
    }

    /**
     * تحديث خيارات المقارنة
     */
    updateComparisonOptions() {
        const firstSelect = document.getElementById('compare-first');
        const secondSelect = document.getElementById('compare-second');
        
        if (!firstSelect || !secondSelect) return;

        const options = this.results.map(result => 
            `<option value="${result.id}">${result.name}</option>`
        ).join('');

        firstSelect.innerHTML = '<option value="">اختر نتيجة...</option>' + options;
        secondSelect.innerHTML = '<option value="">اختر نتيجة...</option>' + options;

        this.updateComparisonButton();
    }

    /**
     * تحديث زر المقارنة
     */
    updateComparisonButton() {
        const firstSelect = document.getElementById('compare-first');
        const secondSelect = document.getElementById('compare-second');
        const button = document.getElementById('start-comparison');
        
        if (button && firstSelect && secondSelect) {
            button.disabled = !firstSelect.value || !secondSelect.value || 
                             firstSelect.value === secondSelect.value;
        }
    }

    /**
     * بدء المقارنة
     */
    startComparison() {
        const firstId = document.getElementById('compare-first').value;
        const secondId = document.getElementById('compare-second').value;
        
        const firstResult = this.results.find(r => r.id == firstId);
        const secondResult = this.results.find(r => r.id == secondId);
        
        if (!firstResult || !secondResult) return;

        this.showComparisonResults(firstResult, secondResult);
    }

    /**
     * عرض نتائج المقارنة
     * @param {Object} first 
     * @param {Object} second 
     */
    showComparisonResults(first, second) {
        const container = document.getElementById('comparison-results');
        
        container.innerHTML = `
            <div class="comparison-panel">
                <div class="comparison-item">
                    <div class="comparison-header">
                        <h5>${first.name}</h5>
                        <span class="file-size">${this.formatFileSize(first.size)}</span>
                    </div>
                    <div class="comparison-preview">
                        ${first.type.startsWith('image/') ? 
                            `<img src="${first.url}" alt="${first.name}">` :
                            `<div class="file-icon"><i class="fas ${this.getFileIcon(first.type)}"></i></div>`
                        }
                    </div>
                </div>
                
                <div class="comparison-divider">
                    <i class="fas fa-exchange-alt"></i>
                </div>
                
                <div class="comparison-item">
                    <div class="comparison-header">
                        <h5>${second.name}</h5>
                        <span class="file-size">${this.formatFileSize(second.size)}</span>
                    </div>
                    <div class="comparison-preview">
                        ${second.type.startsWith('image/') ? 
                            `<img src="${second.url}" alt="${second.name}">` :
                            `<div class="file-icon"><i class="fas ${this.getFileIcon(second.type)}"></i></div>`
                        }
                    </div>
                </div>
            </div>
            
            <div class="comparison-stats">
                <div class="stat-row">
                    <label>الفرق في الحجم:</label>
                    <span>${this.formatFileSize(Math.abs(first.size - second.size))}</span>
                </div>
                <div class="stat-row">
                    <label>نسبة الحجم:</label>
                    <span>${((first.size / second.size) * 100).toFixed(1)}%</span>
                </div>
            </div>
        `;
        
        container.style.display = 'block';
    }

    /**
     * الحصول على أيقونة نوع الملف
     * @param {string} mimeType 
     * @returns {string}
     */
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fa-image';
        if (mimeType.startsWith('video/')) return 'fa-video';
        if (mimeType.startsWith('audio/')) return 'fa-music';
        if (mimeType.includes('pdf')) return 'fa-file-pdf';
        return 'fa-file';
    }

    /**
     * الحصول على اسم نوع الملف
     * @param {string} type 
     * @returns {string}
     */
    getTypeDisplayName(type) {
        const typeMap = {
            'image/jpeg': 'JPEG',
            'image/png': 'PNG', 
            'image/webp': 'WebP',
            'image/gif': 'GIF'
        };
        return typeMap[type] || type.split('/')[1]?.toUpperCase() || type;
    }

    /**
     * حساب نسبة الضغط
     * @param {number} originalSize 
     * @param {number} newSize 
     * @returns {string}
     */
    calculateCompressionRatio(originalSize, newSize) {
        if (!originalSize || originalSize === newSize) return '0';
        return (((originalSize - newSize) / originalSize) * 100).toFixed(1);
    }

    /**
     * اختصار النص
     * @param {string} text 
     * @param {number} maxLength 
     * @returns {string}
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
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
     * تنسيق التاريخ
     * @param {Date} date 
     * @returns {string}
     */
    formatDate(date) {
        return new Intl.DateTimeFormat('ar', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    /**
     * حفظ النتائج في localStorage
     */
    saveResults() {
        try {
            const resultsToSave = this.results.map(result => ({
                id: result.id,
                name: result.name,
                originalName: result.originalName,
                size: result.size,
                originalSize: result.originalSize,
                type: result.type,
                metadata: result.metadata,
                processingInfo: result.processingInfo,
                timestamp: result.timestamp
            }));

            localStorage.setItem('results-panel-data', JSON.stringify(resultsToSave));
        } catch (error) {
            console.warn('فشل في حفظ النتائج:', error);
        }
    }

    /**
     * تحميل النتائج من localStorage
     */
    loadSavedResults() {
        try {
            const saved = localStorage.getItem('results-panel-data');
            if (saved) {
                const results = JSON.parse(saved);
                // يمكن استرداد البيانات الأساسية فقط
                // الملفات الفعلية لا يمكن استردادها من localStorage
                console.log('تم العثور على نتائج محفوظة:', results.length);
            }
        } catch (error) {
            console.warn('فشل في تحميل النتائج المحفوظة:', error);
        }
    }

    /**
     * الحصول على النتائج
     * @returns {Array}
     */
    getResults() {
        return this.results;
    }

    /**
     * الحصول على النتائج المحددة
     * @returns {Array}
     */
    getSelectedResults() {
        return this.results.filter(r => r.selected);
    }

    /**
     * مسح لوحة النتائج
     */
    clear() {
        this.clearResults();
    }
}

// تصدير الكلاس
export default ResultsPanel;