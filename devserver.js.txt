// devserver.js
const express = require('express');
const app = express();

app.use((req, res, next) => { console.log('DEV REQ', req.method, req.url); next(); });

app.get('/__ping', (_req, res) => res.json({ ok: true, from: 'devserver' }));

app.use((_req, res) => res.status(404).json({ error: '404 from devserver' }));

app.listen(3000, () => console.log('DEVSERVER UP on http://localhost:3000'));
