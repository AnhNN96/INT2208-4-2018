var User                  = require("./models/User"),          // User model
    Deck                  = require("./models/Deck"),          // Deck model
    express               = require("express"),                // express framework
    mongoose              = require("mongoose"),               // mongo database
    passport              = require("passport"),               // authentication
    bodyParser            = require("body-parser"),
    cookieParser          = require("cookie-parser"),
    LocalStrategy         = require("passport-local"),         // authentication
    expressSession        = require("express-session"),        // user session
    passportLocalMongoose = require("passport-local-mongoose"),// authentication
    multer                = require('multer');

var url = "mongodb+srv://admin:nopassword@cluster0-bmqym.mongodb.net";
mongoose.connect(url, {dbName: 'tinycards'});

var app = express();

// DUY allow post from other server (for angular development only)
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    next();
});
//DUY JSON PARSER
var jsonParser = bodyParser.json();

// app configuration
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSession({
    secret: "123456",       // random text
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize()); // authentication configuration
app.use(passport.session());    // authentication configuration

passport.use(new LocalStrategy(User.authenticate()));   // authentication
passport.serializeUser(User.serializeUser());           // authentication
passport.deserializeUser(User.deserializeUser());       // authentication

// ROUTES
// home (not logged in)

app.get("/home", isNotLoggedIn1, function (req, res) {
    User.find({}, function (error, users) {
        if (!error) {
            Deck.find({}, function (error1, decks) {
                if (!error1) {
                    return res.render("1", {users: users, decks: decks})
                } else res.send("SOMETHING WENT WRONG WITH DECKS!")
            })
        } else res.send("SOMETHING WENT WRONG WITH USERS!")
    })
});

// home (after logged in)
app.get("/home/:username", isLoggedIn, function (req, res) {
    if (req.params.username !== req._passport.session.user) {
        return res.redirect("/home/" + req._passport.session.user);
    }
    User.findOne({username: req._passport.session.user}).populate("learningData.deck").exec(function (error, user) {
        if (!error) {
            Deck.find({}).populate("author").exec(function (error1, decks) {
                if (!error1) {
                    res.cookie('userID', user._id);
                    res.render("2", {user: user, decks: decks});
                } else res.send("SOWETHING WENT WRONG WHEN LOAD DECKS DATA!")
            })
        } else res.send("SOMETHING WENT WRONG WHEN LOAD USERS DATA!")
    });
});

// about page (duy)
app.get("/press", function (req, res) {
    res.render("1-2");
});

// lesson page
app.get("/learn/:deckID", isLoggedIn, function (req, res) {
    User.findOne({username: req._passport.session.user}, function (error, user) {
       if (!error) {
           Deck.findById(req.params.deckID, function (error, deck) {
               if (!error && deck) {
                   res.render("2-4", {user: user, deck: deck})
               } else console.log(error);
           });
       } else console.log(error);
    });
});

// DUY multer
var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null,  '' + Date.now() + '-' + file.originalname)
    }
});
// DUY multer
var upload = multer({ storage: storage }).single('image'); //multer settings
// DUY multer
app.post('/api/upload/image/', upload, function (req, res, next) {
    console.log(req.file);
    if (req.file.mimetype === "image/jpg" || req.file.mimetype === "image/png"){
        res.send({
            message: "done",
            fileName: req.file.filename
        });
    } else {
        res.send({
            err: "type_not_match"
        });
    }

});
// DUY get user data for ANGULAR
app.get("/api/user/currentUser", isLoggedIn, function (req, res) {
    User.findOne({username: req._passport.session.user}, function (error, user) {
        if (!error) {
            //res.setHeader('Content-Type', 'application/json');
            res.send(user);
        } else {
            res.send({message: "SOMETHING WENT WRONG WHEN YOU GET USER!"});
            console.log(error);
        }
    })
});
// DUY get user data for ANGULAR
app.get("/api/user/:username", function (req, res) {
    User.findOne({username: req.params.username}, function (error, user) {
        if (!error) {
            res.send(user);
        } else {
            res.send({message: "SOMETHING WENT WRONG WHEN YOU GET USER!"});
            console.log(error);
        }
    })
});
// DUY set user data for ANGULAR
app.put("/api/user/currentUser", jsonParser, function (req, res) {
    console.log("SET PROFILE DATA");
    User.findOneAndUpdate({ _id: req.body.id }, {
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        bio: req.body.bio
    }, function (error, user) {
        if (!error) {
            res.send({message: "Chỉnh sửa thông tin thành công!"});
        } else {
            res.send({message: "SOMETHING WENT WRONG WHEN YOU UPDATE USER!"});
            console.log(error);
        }
    })
});
// DUY get ALL decks data for ANGULAR
app.get("/api/currentUser/desks", isLoggedIn, function (req, res) {

    User.findOne({username: req._passport.session.user}, function (error, user) {
        if (!error) {
            Deck.find({author: user._id}, function (error1, decks) {
                if (!error1) {
                    res.send(decks);
                } else console.log(error1)
            })
        } else console.log(error)
    });
});
// DUY get ALL decks data of USER for ANGULAR
app.get("/api/:username/desks", function (req, res) {
    User.findOne({username: req.params.username}, function (error, user) {
        if (!error) {
            Deck.find({author: user._id}, function (error1, decks) {
                if (!error1) {
                    res.send(decks);
                } else console.log(error1)
            })
        } else console.log(error)
    });
});
// DUY get FAVdecks data for ANGULAR
app.get("/api/currentUser/desks/favorite", isLoggedIn, function (req, res) {
    User.findOne({username: req._passport.session.user}).populate("learningData.deck").exec(function (error, user) {
        if (!error) {
            var favouriteDecks = [];
            for (var i = 0; i < user.learningData.length; i++) {
                if (user.learningData[i].favourite) {
                    favouriteDecks.push(user.learningData[i].deck);
                }
            }
            res.send(favouriteDecks);
        } else console.log(error);
    });
});
// DUY get deck data for ANGULAR
app.get("/api/deck/:id", function (req, res) {
    Deck.findOne({ _id: req.params.id }).populate("author").exec(function (error, deck) {
        if (!error && deck) {
            User.findOne({ username: deck.author.username }).populate("learningData.deck").exec(function (error1, author) {
                if (!error1) {
                    res.send(deck);
                } else {
                    res.send({
                        err: "id_not_found",
                        message: "IO ERROR: deck id "
                    });
                    console.log(error1);
                }
            })
        } else console.log(error);
    });
});
//DUY delete deck for ANGULAR
app.delete("/api/deck/:id", function (req, res) {
    console.log("DELETE DECK: "+req.params.id);
    Deck.findOneAndRemove({_id: req.params.id}, function (error, deck) {
        if (!error) {
            res.send({message: "Đã xóa thành công!"});
        } else {
            res.send({message: "SOMETHING WENT WRONG WHEN DELETE DECK!"});
            console.log(error);
        }
    });
});
//DUY create deck for ANGULAR
app.post("/api/deck", jsonParser, function (req, res) {
    User.findOne({username: req._passport.session.user}, function (error, user) {
        Deck.create({
            name: req.body.title,
            author: user._id,
            description: req.body.description,
            themeImage: req.body.coverImage,
            cards: req.body.cardArray,
            favourites: req.body.numberOfUsers
        }, function (error, deck) {
            if (!error) {
                // res.send({message: "Đã tạo thành công!"});
                res.redirect("/deck" + deck._id);
            } else console.log(error)
        })
    })
});

//DUY update deck for ANGULAR
app.put("/api/deck/:id", jsonParser, function (req, res) {
    Deck.findOne({_id: req.params.id}, function (error, deck) {
        if (!error)  {
            deck.name = req.body.title;
            deck.favourites = req.body.numberOfUsers;
            deck.description = req.body.description;
            deck.themeImage = req.body.coverImage;
            deck.cards = req.body.cardArray;
            deck.save();
            res.send({message: "Đã cập nhật thành công!"});
        } else console.log(error)
    });
});
// DUY change user's password for ANGULAR
app.put("/api/user/currentUser/password", jsonParser, function (req, res) {
    User.findByUsername(req._passport.session.user).then(function(user){
        if (user){
            user.setPassword(req.body.newPass, function(){
                user.save();
                res.send({message: "Đã cập nhật mật khẩu thành công!"});
            });
        } else {
            res.send({message: "SOMETHING WENT WRONG WITH CHANGE PASSWORD!"});
        }
    },function(err){
        console.error(err);
    });
});

// handle user sign up
app.post("/register", function (req, res) {
    User.register({username: req.body.username, name: req.body.name.substr(0, 35), email: req.body.email}, req.body.password, function (error, user) {
        if (error) {
            return res.send(error);
        }
        passport.authenticate("local")(req, res, function () {
            res.redirect("/home/" + user.username);
        })
    })
});

// handle user log in
app.post("/login", passport.authenticate("local", {
    failureRedirect: "/home"
}), function(req, res){
    res.redirect("/home/" + req.body.username);
});


// handle user logout
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

// DUY DEFAULT ROUTE
app.all("/", function (req, res) {
    res.redirect("/home");
});

// all other routes if not logged in yet
// app.get("/*", isNotLoggedIn2, function (req, res) {
//     res.redirect("/home");
// });


// DUY ANGULAR routing
app.all('*', function (req, res) {
    res.status(200).sendFile(__dirname + "/public/ng/index.html");
});


// middleware
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } res.redirect("/");
}

function isNotLoggedIn1(req, res, next) {
    if (req.isUnauthenticated()) {
        return next();
    }
    res.redirect("/home/" + req._passport.session.user);
}

function isNotLoggedIn2(req, res, next) {
    if (req.isUnauthenticated()) {
        return next();
    }
    res.status(200).sendFile(__dirname + "/public/ng/index.html");
}

// Running app
app.listen(3000, function () {
    console.log("App is running!");
});

// add decks
// Deck.create({
//     name: "House",
//     themeImage: "https://d9np3dj86nsu2.cloudfront.net/image/e53dcbd93f705d72c23fbac007760b84",
//     description: '',
//     favourites: 106
// });