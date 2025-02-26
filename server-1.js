const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());  // Replaces body-parser

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ajesh',
    database: 'student_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL database.');
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Default route to serve registration page as a fallback
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registration of student.html'));
});

// Registration route
app.post('/register', (req, res) => {
    const { name, rollNo, email, password } = req.body;

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ message: 'Error hashing password' });

        const query = 'INSERT INTO users (name, rollNo, email, password) VALUES (?, ?, ?, ?)';
        db.query(query, [name, rollNo, email, hashedPassword], (error, results) => {
            if (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Email already exists' });
                }
                return res.status(500).json({ message: 'Database error' });
            }
            res.json({ message: 'User registered successfully' });
        });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (error, results) => {
        if (error) return res.status(500).json({ message: 'Database error' });

        if (results.length === 0) return res.status(400).json({ message: 'Invalid email or password' });

        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ message: 'Error comparing passwords' });

            if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

            res.json({ message: 'Login successful', success: true });
        });
    });
});

// Route for submitting a complaint
app.post('/submit-complaint', (req, res) => {
    const { student_id, room_no, complaint_type, complaint_description, complaint_date } = req.body;

    const query = `
        INSERT INTO complaint (student_id, room_no, complaint_type, complaint_description, complaint_date, status)
        VALUES (?, ?, ?, ?, ?, 'Pending')
    `;

    db.query(query, [student_id, room_no, complaint_type, complaint_description, complaint_date], (error, results) => {
        if (error) {
            console.error('Error submitting complaint:', error.message);
            return res.status(500).json({ message: 'Failed to submit complaint' });
        }
        res.json({ message: 'Complaint submitted successfully' });
    });
});

// Route for submitting inventory booking
app.post('/submit-inventory', (req, res) => {
    const { name, rollno, roomno, phoneno, item, studentfeedback, timein, timeout } = req.body;

    const query = `
        INSERT INTO inventory (name, rollno, roomno, phoneno, item, studentfeedback, timein, timeout)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [name, rollno, roomno, phoneno, item, studentfeedback, timein, timeout], (error, results) => {
        if (error) {
            console.error('Error booking inventory:', error.message);
            return res.status(500).json({ message: 'Failed to book inventory' });
        }
        res.json({ message: 'Inventory booked successfully' });
    });
});

// Start server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
