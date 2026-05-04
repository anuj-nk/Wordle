import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
