// Import package
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const initializePassport = require('./passport-config'); // Pastikan path sesuai


// Database connection
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Terhubung ke database!"))
    .catch(err => console.error("Koneksi database gagal:", err));

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware untuk parsing request body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Middleware untuk mengizinkan method override
app.use(methodOverride('_method'));

// Setup session
app.use(session({
    secret: process.env.SESSION_SECRET || 'kunci rahasiaku', // Ganti dengan kunci yang lebih kuat di produksi
    saveUninitialized: false,
    resave: false,
}));

// Inisialisasi Passport
initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// Setup flash
app.use(flash());

// Middleware untuk menyimpan pesan flash di locals
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

// Static files
app.use(express.static("uploads"));

// Set template engine
app.set('view engine', 'ejs');

// Route prefix
app.use("", require('./routes/routes')); // Pastikan rute diatur dengan benar

// Start server
app.listen(PORT, () => {
    console.log(`Server sedang berjalan pada port http://localhost:${PORT}`);
});
