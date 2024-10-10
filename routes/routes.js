const express = require('express');
const router = express.Router();
const User = require('../models/users');  // Model User
const multer = require('multer');
const bcrypt = require('bcrypt');
const passport = require('passport');
const fs = require('fs');
const flash = require('connect-flash');

// Multer setup for image upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});

const upload = multer({
    storage: storage,
}).single("image");

// Route: Register user
router.get("/register", (req, res) => {
    res.render("register", { title: "Register" });
});

router.post("/register", upload, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone || '', // Allow empty string if no phone number is provided
            image: req.file ? '/uploads/' + req.file.filename : '', // Simpan jalur lengkap
            username: req.body.username, 
            password: hashedPassword, 
            level_user: req.body.level_user || 'user', 
        });

        await newUser.save();
        req.flash('success', "User berhasil ditambahkan!"); // Gunakan flash message
        res.redirect('/login');
    } catch (err) {
        req.flash('error', "Terjadi kesalahan saat mendaftar: " + err.message);
        res.redirect('/register');
    }
});

// Route: Login user
router.get("/login", (req, res) => {
    res.render("login", { title: "Login", messages: req.flash('error') }); // Pastikan menggunakan flash untuk mengirim error
});

router.post("/login", passport.authenticate('local', {
  successRedirect: '/', // Redirect ke halaman utama jika sukses
  failureRedirect: '/login', // Redirect kembali ke login jika gagal
  failureFlash: true // Mengaktifkan flash message untuk kesalahan
}));


// Route: Logout user (ubah ke POST atau GET)
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
      if (err) {
        return next(err); // Jika terjadi error, kirim ke middleware berikutnya untuk ditangani
      }
      req.session.destroy((err) => {
        if (err) {
          console.log('Error destroying session:', err);
        }
        res.clearCookie('connect.sid'); // Hapus cookie session
        res.redirect('/login'); // Redirect ke halaman login setelah logout berhasil
      });
    });
  });
  
  
  
// Route: Get all users
router.get("/users", (req, res) => {
    User.find().exec()
        .then(users => {
            res.render('index', {
                title: "Home Page",
                users: users,
                message: req.flash('success'), // Tampilkan pesan sukses
            });
        })
        .catch(err => {
            req.flash('error', err.message);
            res.redirect('/'); // Redirect atau tangani kesalahan dengan sesuai
        });
});

// Route: Home
router.get("/", (req, res) => {
    User.find().exec()
        .then(users => {
            res.render('index', {
                title: "Home Page",
                users: users,
                message: req.flash('success'), // Tampilkan pesan sukses
            });
        })
        .catch(err => {
            req.flash('error', err.message);
            res.redirect('/'); // Redirect atau tangani kesalahan dengan sesuai
        });
});

// Route: Add user (manual, from a form)
router.get("/add", (req, res) => {
    res.render("add_users", { title: "Add Users" });
});

router.post("/add", upload, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file ? '/uploads/' + req.file.filename : '', // Simpan jalur lengkap
            username: req.body.username,  // Tambahkan username
            password: hashedPassword,  // Tambahkan password yang di-hash
            level_user: req.body.level_user || 'user',  // Default "user"
        });

        await user.save();
        req.flash('success', "User berhasil ditambahkan");
        res.redirect("/users");
    } catch (err) {
        req.flash('error', "Terjadi kesalahan saat menambahkan user: " + err.message);
        res.redirect('/add'); // Redirect atau tangani kesalahan dengan sesuai
    }
});

// Route: Edit user
router.get("/edit/:id", (req, res) => {
    let id = req.params.id;
    User.findById(id)
        .then(user => {
            if (!user) {
                req.flash('error', "User tidak ditemukan");
                return res.redirect("/users");
            }
            res.render("edit_users", {
                title: "Edit User",
                user: user,
            });
        })
        .catch(err => {
            req.flash('error', err.message);
            res.redirect("/users");
        });
});

// Route: Update user
router.post("/update/:id", upload, async (req, res) => {
    let id = req.params.id;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.unlinkSync(`./uploads/${req.body.old_image}`);
        } catch (err) {
            console.error(`Error deleting old image: ${err}`);
        }
    } else {
        new_image = req.body.old_image;
    }

    let hashedPassword;
    if (req.body.password) {
        hashedPassword = await bcrypt.hash(req.body.password, 10);  // Re-hash jika ada perubahan password
    } else {
        hashedPassword = req.body.old_password;  // Gunakan password lama jika tidak ada perubahan
    }

    User.findByIdAndUpdate(id, {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: new_image,
        username: req.body.username,  // Update username
        password: hashedPassword,  // Update password (hashed)
        level_user: req.body.level_user || 'user',  // Update level_user
    })
    .then(result => {
        req.flash('success', "User berhasil di-update");
        res.redirect("/users");
    })
    .catch(err => {
        req.flash('error', "Terjadi kesalahan saat meng-update user: " + err.message);
        res.redirect(`/edit/${id}`); // Redirect jika terjadi kesalahan
    });
});

// Route: Delete user
router.get("/delete/:id", (req, res) => {
    let id = req.params.id;
    User.findByIdAndDelete(id)
        .then(result => {
            if (result.image != '') {
                try {
                    fs.unlinkSync("./uploads/" + result.image);
                } catch (err) {
                    console.log(err);
                }
            }
            req.flash('success', "User berhasil dihapus");
            res.redirect("/users");
        })
        .catch(err => {
            req.flash('error', "Terjadi kesalahan saat menghapus user: " + err.message);
            res.redirect("/users");
        });
});

module.exports = router;
