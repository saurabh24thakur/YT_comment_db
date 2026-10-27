require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5434),
  database: process.env.DB_NAME || 'demo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    await client.query('DROP TABLE IF EXISTS comments CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE
      );
    `);

    await client.query(`
      CREATE TABLE comments (
        id SERIAL PRIMARY KEY,
        comment TEXT NOT NULL,
        video_id INT NOT NULL,
        user_id INT NOT NULL REFERENCES users(id),
        parent_id INT REFERENCES comments(id)
      );
    `);

    const users = [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
      { name: 'Charlie', email: 'charlie@example.com' },
      { name: 'Diana', email: 'diana@example.com' },
      { name: 'Ethan', email: 'ethan@example.com' },
      { name: 'Fiona', email: 'fiona@example.com' },
    ];

    const userIds = [];
    for (const user of users) {
      const result = await client.query(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
        [user.name, user.email]
      );
      userIds.push(result.rows[0].id);
    }

    const comments = [
      { comment: 'nice video', video_id: 3, user_id: userIds[1], parent_id: null },
      { comment: 'ok sir', video_id: 3, user_id: userIds[5], parent_id: null },
      { comment: 'hmm', video_id: 3, user_id: userIds[1], parent_id: null },
      { comment: 'thanks', video_id: 3, user_id: userIds[5], parent_id: null },
    ];

    const commentRows = [];
    for (const item of comments) {
      const result = await client.query(
        'INSERT INTO comments (comment, video_id, user_id, parent_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [item.comment, item.video_id, item.user_id, item.parent_id]
      );
      commentRows.push(result.rows[0].id);
    }

    // add the nested discussion pattern from the reference image
    const nestedReplies = [
      { comment: 'ok sir', video_id: 3, user_id: userIds[5], parent_id: commentRows[0] },
      { comment: 'hmm', video_id: 3, user_id: userIds[1], parent_id: commentRows[1] },
      { comment: 'thanks', video_id: 3, user_id: userIds[5], parent_id: commentRows[2] },
    ];

    for (const item of nestedReplies) {
      await client.query(
        'INSERT INTO comments (comment, video_id, user_id, parent_id) VALUES ($1, $2, $3, $4)',
        [item.comment, item.video_id, item.user_id, item.parent_id]
      );
    }

    console.log('Seed complete: 6 users and 7 threaded comments inserted.');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seed();
