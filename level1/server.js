const express = require('express');
const app = express();
const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let submissions = [];

app.get('/', (req, res) => {
    res.render('index', {
        title: 'Registration Form',
        submissions,
        errors: [],
        formData: {}
    });
});

app.post('/submit', (req, res) => {
    const { name, email, age, phone, gender, message } = req.body;
    const errors = [];

    // Server-side validation
    if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
        errors.push('A valid email address is required.');
    }

    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        errors.push('Age must be a number between 1 and 120.');
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phone || !phoneRegex.test(phone.trim())) {
        errors.push('Phone must be a valid 10-digit number.');
    }

    if (!gender || gender === '') {
        errors.push('Gender selection is required.');
    }

    if (!message || message.trim().length < 10) {
        errors.push('Message must be at least 10 characters.');
    }

    // If errors exist → re-render form with errors + preserve input
    if (errors.length > 0) {
        return res.render('index', {
            title: 'Registration Form',
            submissions,
            errors,
            formData: { name, email, age, phone, gender, message }
        });
    }

    // All good → save and show success
    const newEntry = {
        name: name.trim(),
        email: email.trim(),
        age: ageNum,
        phone: phone.trim(),
        gender,
        message: message.trim()
    };

    submissions.push(newEntry);
    res.render('success', { title: 'Submission Successful', data: newEntry });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});