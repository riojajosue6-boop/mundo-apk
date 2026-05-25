const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos segura en el Volumen de Railway
const dbDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname;
const dbPath = path.join(dbDir, 'base_de_datos.db');
const db = new Database(dbPath);

// Crear la tabla de APKs si no existe
db.prepare(`
    CREATE TABLE IF NOT EXISTS apks (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        version TEXT,
        peso TEXT,
        link_mediafire TEXT NOT NULL,
        link_mega TEXT,
        categoria TEXT
    )
`).run();

app.use(express.json());

// 1. RUTA PRINCIPAL: Listar todas las APKs (Para tu portada de descargas)
app.get('/apks', (req, res) => {
    try {
        const rows = db.prepare('SELECT id, titulo, version, peso, categoria FROM apks').all();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las aplicaciones' });
    }
});

// 2. RUTA DINÁMICA: Obtener los links de una APK específica (Ej: /apks/whatsapp-plus)
app.get('/apks/:id', (req, res) => {
    const { id } = req.params;
    try {
        const apk = db.prepare('SELECT * FROM apks WHERE id = ?').get(id);
        if (!apk) {
            return res.status(404).json({ error: 'Aplicación no encontrada' });
        }
        res.json(apk);
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// 3. RUTA ADMIN: Para que tú puedas subir nuevas APKs desde Postman o tu frontend
app.post('/apks/agregar', (express.json()), (req, res) => {
    const { id, titulo, descripcion, version, peso, link_mediafire, link_mega, categoria } = req.body;
    
    if (!id || !titulo || !link_mediafire) {
        return res.status(400).json({ error: 'Faltan campos obligatorios (id, titulo, link_mediafire)' });
    }

    try {
        const insert = db.prepare(`
            INSERT INTO apks (id, titulo, descripcion, version, peso, link_mediafire, link_mega, categoria)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        insert.run(id, titulo, descripcion, version, peso, link_mediafire, link_mega, categoria);
        res.json({ success: true, message: 'APK registrada con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'El ID ya existe o hubo un error en la base de datos' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de descargas corriendo en http://localhost:${PORT}`);
    console.log(`Base de datos SQLite activa en: ${dbPath}`);
});
