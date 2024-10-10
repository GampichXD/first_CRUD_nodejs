const { name } = require('ejs');
const mongoose = require('mongoose');

// Definisi skema untuk pengguna
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Email harus unik
    },
    phone: {
        type: String,
        required: false,
    },
    image: {
        type: String,
        required: false,
    },
    username: {
        type: String,
        required: true, // Menambahkan properti username
        unique: true,   // Username juga harus unik
    },
    password: {
        type: String,
        required: true, // Menambahkan properti password
    },
    level_user: {
        type: String,
        enum: ['user', 'admin'], // Hanya boleh 'user' atau 'admin'
        default: 'user', // Default adalah 'user'
    },
    lastLogin: {
        type: Date, // Menyimpan informasi waktu login terakhir
        default: null
    },
    created: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

// Ekspor model User
module.exports = mongoose.model("User", userSchema);






