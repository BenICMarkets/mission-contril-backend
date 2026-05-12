const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Routes

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new project
app.post('/api/projects', async (req, res) => {
  const { name, description, status, priority, due_date, client, hourly_rate } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description, status, priority, due_date, client, hourly_rate) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description, status, priority, due_date, client, hourly_rate]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get project by ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  const { name, description, status, priority, due_date, client, hourly_rate } = req.body;
  try {
    const result = await pool.query(
      'UPDATE projects SET name=$1, description=$2, status=$3, priority=$4, due_date=$5, client=$6, hourly_rate=$7 WHERE id=$8 RETURNING *',
      [name, description, status, priority, due_date, client, hourly_rate, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all milestones for a project
app.get('/api/projects/:id/milestones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM milestones WHERE project_id = $1 ORDER BY due_date', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add milestone
app.post('/api/milestones', async (req, res) => {
  const { project_id, name, due_date, completed } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO milestones (project_id, name, due_date, completed) VALUES ($1, $2, $3, $4) RETURNING *',
      [project_id, name, due_date, completed || false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log time entry
app.post('/api/time-entries', async (req, res) => {
  const { project_id, hours, description, date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO time_entries (project_id, hours, description, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [project_id, hours, description, date || new Date()]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get time entries for a project
app.get('/api/projects/:id/time-entries', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM time_entries WHERE project_id = $1 ORDER BY date DESC', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
