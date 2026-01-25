// server/index.js
const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 允许跨域
app.use(express.json()); // 允许解析 JSON 请求体

// --- 路由编写区域 ---

// 1. 测试路由
app.get('/', (req, res) => {
  res.send('Hello! Backend is running.');
});

// 2. 获取所有 Case (GET /api/cases)
// 修改 server/index.js 中的第 21 行左右
app.get('/api/cases', async (req, res) => {
  try {
    // 增加一个简单的日志，看看请求有没有进来
    console.log('收到前端请求数据请求...');
    const [rows] = await db.query('SELECT * FROM support_tickets ORDER BY created_at DESC');
    console.log('数据库查询成功，返回行数:', rows.length);
    res.json(rows);
  } catch (err) {
    // ⚠️ 这一行非常重要，它会把真正的错误直接喷在浏览器页面上
    console.error("❌ 数据库查询失败:", err);
    res.status(500).json({ 
      error: 'Database error', 
      message: err.message, 
      code: err.code 
    });
  }
});

// 3. 新增 Case (POST /api/cases)
app.post('/api/cases', async (req, res) => {
  const { title, category, priority, description, resolution } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO support_tickets (title, category, priority, description, resolution) VALUES (?, ?, ?, ?, ?)',
      [title, category, priority, description, resolution]
    );
    // 返回新创建的数据 ID
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

// 4. 更新 Case (PUT /api/cases/:id)
app.put('/api/cases/:id', async (req, res) => {
  const { id } = req.params;
  const { title, category, priority, description, resolution } = req.body;
  try {
    await db.query(
      'UPDATE support_tickets SET title=?, category=?, priority=?, description=?, resolution=? WHERE id=?',
      [title, category, priority, description, resolution, id]
    );
    res.json({ message: 'Case updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

// 5. 删除 Case (DELETE /api/cases/:id)
app.delete('/api/cases/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM support_tickets WHERE id=?', [id]);
    res.json({ message: 'Case deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// --- 启动服务器 ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});