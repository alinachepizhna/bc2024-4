const http = require('http');
const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');

// Налаштування командного рядка
const program = new Command();
program
    .requiredOption('-h, --host <host>', 'address of the server')
    .requiredOption('-p, --port <port>', 'port of the server')
    .requiredOption('-c, --cache <path>', 'path to cache directory')
    .parse(process.argv);

const options = program.opts();

// Створення кешу, якщо його не існує
fs.mkdir(options.cache, { recursive: true }).catch(err => {
    console.error('Error creating cache directory:', err);
});

// Створення HTTP сервера
const server = http.createServer(async (req, res) => {
    const urlPath = req.url;
    const httpCode = urlPath.slice(1); // Отримуємо код HTTP з URL
    const filePath = path.join(options.cache, `${httpCode}.jpg`); // Підготовка шляху до файлу

    if (req.method === 'GET') {
        // GET запит
        try {
            const data = await fs.readFile(filePath);
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(data);
        } catch (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } else if (req.method === 'PUT') {
        // PUT запит
        const chunks = [];

        req.on('data', chunk => {
            chunks.push(chunk);
        });

        req.on('end', async () => {
            try {
                const imageBuffer = Buffer.concat(chunks);
                await fs.writeFile(filePath, imageBuffer);
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end('Image created');
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
        });
    } else if (req.method === 'DELETE') {
        // DELETE запит
        try {
            await fs.unlink(filePath);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Image deleted');
        } catch (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } else {
        // Інші методи
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
});

// Запуск сервера
server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
});
