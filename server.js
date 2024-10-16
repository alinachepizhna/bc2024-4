const http = require('http');
const { Command } = require('commander');

const program = new Command();

// Налаштування аргументів командного рядка
program
  .requiredOption('-h, --host <address>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера')
  .requiredOption('-c, --cache <path>', 'шлях до директорії для закешованих файлів');

program.parse(process.argv);

const options = program.opts();

// Перевірка обовʼязкових параметрів
if (!options.host || !options.port || !options.cache) {
  console.error("Please specify host, port and cache directory.");
  process.exit(1);
}

// Створення сервера
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
});

// Запуск сервера
server.listen(options.port, options.host, () => {
  console.log(`Сервер запущено на http://${options.host}:${options.port}`);
});
