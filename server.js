const http = require('http');
const fs = require('fs');
const path = require('path');

// HTTP 서버 생성
const server = http.createServer((req, res) => {
    // 요청된 URL에서 파일 경로 생성
    let filePath = '.' + req.url;
    // 루트 경로일 경우 index.html로 설정
    if (filePath === './') {
        filePath = './index.html';
    }

    // 파일 확장자 추출 및 소문자로 변환
    const extname = String(path.extname(filePath)).toLowerCase();
    // MIME 타입 매핑 정의
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.svg': 'application/image/svg+xml'
    };

    // 파일 확장자에 따른 Content-Type 결정
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // 파일 읽기
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // 파일이 없을 경우 404 페이지 제공
                fs.readFile('./404.html', (error, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                // 서버 에러 발생 시 500 에러 응답
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                res.end();
            }
        } else {
            // 파일을 성공적으로 읽었을 경우 200 응답과 함께 컨텐츠 전송
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
}); 