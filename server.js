const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const BASE_DIR = __dirname;

// تحديد أنواع الملفات
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
    // السماح بـ CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let filePath = decodeURIComponent(req.url);
    
    // إذا كان الطلب للجذر، اعرض index.html
    if (filePath === '/' || filePath === '') {
        filePath = '/index.html';
    }
    
    const fullPath = path.join(BASE_DIR, filePath);
    
    // التحقق من أن المسار آمن
    if (!fullPath.startsWith(BASE_DIR)) {
        res.writeHead(403);
        res.end('محظور');
        return;
    }
    
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end(`الملف غير موجود: ${filePath}`);
            } else {
                res.writeHead(500);
                res.end(`خطأ في الخادم: ${err.message}`);
            }
            return;
        }
        
        const ext = path.extname(fullPath).toLowerCase();
        const mimeType = mimeTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على: http://localhost:${PORT}`);
    console.log(`📁 مجلد المشروع: ${BASE_DIR}`);
    
    // فتح المتصفح تلقائياً
    const url = `http://localhost:${PORT}`;
    const start = process.platform === 'darwin' ? 'open' : 
                  process.platform === 'win32' ? 'start' : 'xdg-open';
    
    exec(`${start} ${url}`, (err) => {
        if (err) {
            console.log(`يرجى فتح المتصفح وزيارة: ${url}`);
        }
    });
});

// إيقاف الخادم عند الضغط على Ctrl+C
process.on('SIGINT', () => {
    console.log('\n⛔ إيقاف الخادم...');
    server.close(() => {
        console.log('✅ تم إيقاف الخادم بنجاح');
        process.exit(0);
    });
});