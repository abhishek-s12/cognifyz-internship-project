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
        title: 'Cognifyz Registration',
        submissions,
        errors: [],
        formData: {}
    });
});

app.post('/submit', (req, res) => {
    const { name, email, age, phone, gender, password, confirmPassword, message } = req.body;
    const errors = [];

    if (!name || name.trim().length < 2)
        errors.push('Name must be at least 2 characters.');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim()))
        errors.push('A valid email address is required.');

    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120)
        errors.push('Age must be between 1 and 120.');

    const phoneRegex = /^[0-9]{10}$/;
    if (!phone || !phoneRegex.test(phone.trim()))
        errors.push('Phone must be a valid 10-digit number.');

    if (!gender || gender === '')
        errors.push('Gender selection is required.');

    // Password validation
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password || !passRegex.test(password))
        errors.push('Password must be 8+ chars with uppercase, lowercase, number & special character.');

    if (password !== confirmPassword)
        errors.push('Passwords do not match.');

    if (!message || message.trim().length < 10)
        errors.push('Message must be at least 10 characters.');

    if (errors.length > 0) {
        return res.render('index', {
            title: 'Cognifyz Registration',
            submissions,
            errors,
            formData: { name, email, age, phone, gender, message }
        });
    }

    const newEntry = {
        name: name.trim(),
        email: email.trim(),
        age: ageNum,
        phone: phone.trim(),
        gender,
        message: message.trim()
    };

    submissions.push(newEntry);
    res.render('success', { title: 'Success!', data: newEntry });
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));