const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password', // Add your MySQL password here
    database: 'attendance_management' // Use your DB name
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Fetch all students
app.get('/students', (req, res) => {
    const query = 'SELECT * FROM students';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).send('Database query error');
            return;
        }
        res.json(results);
    });
});

// Add a student
app.post('/students', (req, res) => {
    const { student_id, name } = req.body;
    const query = 'INSERT INTO students (student_id, name) VALUES (?, ?)';
    db.query(query, [student_id, name], (err, result) => {
        if (err) {
            res.status(500).send('Error adding student');
            return;
        }
        res.json({ message: 'Student added successfully!' });
    });
});

// Delete a student (handle foreign key constraint)
// Delete student by ID
app.delete('/students/:id', (req, res) => {
    const { id } = req.params;
    
    // First, delete attendance records for this student
    const deleteAttendanceQuery = 'DELETE FROM attendance WHERE student_id = ?';
    db.query(deleteAttendanceQuery, [id], (err) => {
        if (err) {
            console.error('Error deleting attendance records:', err);
            return res.status(500).json({ message: 'Error deleting attendance records' });
        }

        // Then, delete the student
        const query = 'DELETE FROM students WHERE student_id = ?';
        db.query(query, [id], (err, result) => {
            if (err) {
                console.error('Error deleting student:', err);
                return res.status(500).json({ message: 'Error deleting student' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Student not found' });
            }
            res.json({ message: 'Student deleted successfully!' });
        });
    });
});

// Update a student
app.put('/students/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const query = 'UPDATE students SET name = ? WHERE student_id = ?';
    db.query(query, [name, id], (err, result) => {
        if (err) {
            res.status(500).send('Error updating student');
            return;
        }
        res.json({ message: 'Student updated successfully!' });
    });
});

// Mark Attendance
app.post('/attendance', (req, res) => {
    const attendanceRecords = req.body;
    const today = new Date().toISOString().slice(0, 10); // Format to YYYY-MM-DD
    const query = 'INSERT INTO attendance (student_id, attendance_date, status) VALUES ?';
    
    const values = attendanceRecords.map(record => [record.student_id, today, record.status]);

    db.query(query, [values], (err, result) => {
        if (err) {
            res.status(500).send('Error marking attendance');
            return;
        }
        res.json({ message: 'Attendance marked successfully!' });
    });
});

// Fetch Attendance
app.get('/attendance', (req, res) => {
    const query = `
        SELECT a.id, a.student_id, s.name, a.attendance_date, a.status 
        FROM attendance a 
        JOIN students s ON a.student_id = s.student_id
    `;
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Database query error');
        }
        res.json(results);
    });
});

// Update attendance by ID
app.put('/attendance/:id', (req, res) => {
    const { id } = req.params;
    const { student_id, status } = req.body;

    // Check if the attendance record exists
    const checkQuery = 'SELECT * FROM attendance WHERE id = ?';
    db.query(checkQuery, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching attendance record' });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }
        // Proceed with the update
        const updateQuery = 'UPDATE attendance SET status = ? WHERE id = ? AND student_id = ?';
        db.query(updateQuery, [status, id, student_id], (err, result) => {
            if (err) {
                console.error('Error updating attendance:', err);
                return res.status(500).json({ message: 'Error updating attendance' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Attendance record not found' });
            }
            res.json({ message: 'Attendance updated successfully!' });
        });
    });
});

// Fetch total students count
app.get('/students/count', (req, res) => {
    const query = 'SELECT COUNT(*) AS total FROM students';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Database query error');
        }
        res.json({ total: results[0].total });
    });
});

// Fetch present count for today
app.get('/attendance/present/count', (req, res) => {
    const today = new Date().toISOString().slice(0, 10); // Format to YYYY-MM-DD
    const query = 'SELECT COUNT(*) AS present FROM attendance WHERE attendance_date = ? AND status = "Present"';
    db.query(query, [today], (err, results) => {
        if (err) {
            return res.status(500).send('Database query error');
        }
        res.json({ present: results[0].present });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
