// server/index.js
const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// --- 路由编写区域 ---

// 1. 测试路由
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// ================= CASES 接口 =================

// 获取所有 Case
app.get('/api/cases', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cases ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 新增 Case
app.post('/api/cases', async (req, res) => {
  // 我们直接使用前端生成的 ID (基于时间戳)
  const { id, title, category, priority, description, resolution, created_at, resolved_at } = req.body;
  try {
    await db.query(
      'INSERT INTO cases (id, title, category, priority, description, resolution, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, category, priority, description, resolution, created_at, resolved_at]
    );
    res.status(201).json({ message: 'Case created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

// 更新 Case
app.put('/api/cases/:id', async (req, res) => {
  const { id } = req.params;
  const { title, category, priority, description, resolution, resolved_at } = req.body;
  try {
    await db.query(
      'UPDATE cases SET title=?, category=?, priority=?, description=?, resolution=?, resolved_at=? WHERE id=?',
      [title, category, priority, description, resolution, resolved_at, id]
    );
    res.json({ message: 'Case updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

// 删除 Case
app.delete('/api/cases/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM cases WHERE id=?', [id]);
    res.json({ message: 'Case deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// ================= NOTES 接口 =================

// 获取所有 Notes
app.get('/api/notes', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM notes ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 新增 Note
app.post('/api/notes', async (req, res) => {
  const { category, content } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO notes (category, content) VALUES (?, ?)',
      [category, content]
    );
    // 返回新生成的 ID，方便前端立刻使用
    res.status(201).json({ id: result.insertId, category, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// 更新 Note (只更新内容)
app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    await db.query('UPDATE notes SET content=? WHERE id=?', [content, id]);
    res.json({ message: 'Note updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// 删除 Note
app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM notes WHERE id=?', [id]);
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// --- 启动服务器 ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
