ESP-32 Smart Bridge Dashboard (PHP + SQL)

This project is a starter dashboard that provides real-time monitoring, live charts, critical alerts, historical logs, and mobile-responsive UI using PHP and a SQL database (SQLite by default).

Quick start:

1. PHP 8+ with PDO_SQLITE enabled (or adjust `src/config.php` for MySQL).
2. From project root, create `data/` directory and make it writable by the web server.
3. Import schema (if using SQLite it's created automatically) or run `php src/api/insert_sample.php` to seed sample data.
4. Serve `public/` as your webroot (Apache, Nginx, or PHP built-in server):

```bash
php -S localhost:8000 -t public
```

XAMPP instructions:
- Place the project under `C:\xampp\htdocs\`.
- Open `http://localhost/Micro%20Project/` if you keep the redirect file, or `http://localhost/Micro%20Project/public/` otherwise.
- Enable `pdo` and `pdo_sqlite` in `php.ini`.

Features included:
- Real-time monitoring via Server-Sent Events (SSE)
- Live charts (Chart.js)
- Critical alerts with SMS placeholder (Twilio integration example)
- Historical logs view
- Mobile responsive UI using Bootstrap
- Interactive SVG visualization scaffold
- Animated gauges and auto-updating live cards

Next steps:
- Replace Twilio placeholders in `src/notify.php` with real credentials.
- Switch to MySQL by editing `src/config.php` and updating `src/db.php`.
