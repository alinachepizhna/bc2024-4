const http = require('http');
const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const superagent = require('superagent');

const program = new Command();
program
    .requiredOption('-h, --host <address>', 'server address')
    .requiredOption('-p, --port <number>', 'server port')
    .requiredOption('-c, --cache <path>', 'path to the directory for cached files');

program.parse(process.argv);
const options = program.opts();

if (!options.host || !options.port || !options.cache) {
    console.error("Error: Please specify required parameters: -h <address> -p <number> -c <path>");
    process.exit(1);
}

const requestListener = async (req, res) => {
    const { url, method } = req;
    const statusCode = url === '/' ? '200' : url.slice(1);

    if (!/^\d{3}$/.test(statusCode)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request: Invalid status code');
        return;
    }

    const filePath = path.join(options.cache, `${statusCode}.jpg`);

    try {
        switch (method) {
            case 'GET':
                try {
                    const image = await fs.readFile(filePath);
                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                    res.end(image);
                } catch (error) {
                    try {
                        const response = await superagent.get(`https://http.cat/${statusCode}`);
                        const image = response.body;
                        await fs.writeFile(filePath, image);
                        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                        res.end(image);
                    } catch (fetchError) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Not Found');
                    }
                }
                break;

            case 'PUT':
                const chunks = [];
                req.on('data', chunk => chunks.push(chunk));
                req.on('end', async () => {
                    const imageBuffer = Buffer.concat(chunks);
                    await fs.writeFile(filePath, imageBuffer);
                    res.writeHead(201, { 'Content-Type': 'text/plain' });
                    res.end('Created');
                });
                break;

            case 'DELETE':
                try {
                    await fs.unlink(filePath);
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Deleted');
                } catch (deleteError) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                }
                break;

            default:
                res.writeHead(405, { 'Content-Type': 'text/plain' });
                res.end('Method Not Allowed');
                break;
        }
    } catch (serverError) {
        console.error("Server error:", serverError);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
};

const server = http.createServer(requestListener);
server.listen(options.port, options.host, () => {
    console.log(`Server is running on http://${options.host}:${options.port}`);
});
