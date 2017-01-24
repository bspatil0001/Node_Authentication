var express = require('express');
var router = express.Router();
var multer = require('multer');

var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser');

var User = require('../models/user');





var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads')
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})
var limits = { fileSize: 10 * 1024 * 1024 * 1024 }

var upload = multer({ storage: storage, limits: limits });


/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('register', { title: 'Register' });
});

router.get('/register', function(req, res, next) {
    res.render('register', { title: 'Register' });
});

router.post('/register', upload.single('profileImage'), function(req, res, next) {
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password1 = req.body.password1;

    console.log(req.file);
    if (req.file) {
        console.log("Uploading files....");

        var profileImageOriginalName = req.file.originalname;
        var profileImageName = req.file.filename;
        var profileImageMime = req.file.mimetype;
        var profileImagePath = req.file.path;
        // var profileImageExt = req.files.extension;
        var profileImageSize = req.file.size;
    } else {
        var profileImageName = 'noImage.png';
    }

    req.checkBody('name', 'Name field is required').notEmpty();
    req.checkBody('email', 'Name field is required').notEmpty();
    req.checkBody('email', 'Enter valid Email id').isEmail();
    req.checkBody('username', 'Name field is required').notEmpty();
    req.checkBody('password', 'Name field is required').notEmpty();
    req.checkBody('password1', 'Password do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        res.render('register', {
            errors: errors,
            name: name,
            email: email,
            username: username,
            password: password,
            password1: password1
        })
    } else {
        var newUser = new User({
            name: name,
            email: email,
            username: username,
            password: password,
            password1: password1,
            profileImage: profileImageName
        });

        User.createUser(newUser, function(err, user) {
            if (err) throw err;
            console.log(user);
        });

        req.flash('flash', 'You are now registered and may log in');

        res.location('/');
        res.redirect('/');
    }

});

router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Login' });
});


// router.get('/logout', function(req, res, next) {
//     res.redirect('/users/login');
// });

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});


passport.use(new localStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function(email, password, done) {
        User.getUserByUsername(email, function(err, user) {
            if (err) throw err;
            if (!user) {
                console.log('Unknown User');
                return done(null, false, { message: 'Unknown User' });
            }

            User.comparePassword(password, user.password, function(err, isMatch) {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    console.log('Invalid Password');
                    return done(null, false, { message: 'Invalid Password' });
                }
            })
        })
    }
));

router.post('/login', passport.authenticate('local', { failureRedirect: '/users/login', failureFlash: 'Invalid username or password' }),
    function(req, res) {
        console.log('Authenticate Sucessful');
        req.flash('success', 'You are logged in');
        res.redirect('/');
    });

router.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        res.redirect('/users/login'); //Inside a callback… bulletproof!
    });
    // req.logout();
    // req.flash('success', 'You are successfully logged out');
    // res.redirect('/users/login');
});




module.exports = router;