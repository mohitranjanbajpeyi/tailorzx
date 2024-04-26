var express = require('express');
var passport = require("passport");
var bodyParser  = require("body-parser");
var mongoose = require("mongoose");
var LocalStrategy= require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var flash = require("connect-flash");
var {v4: uuidV4} = require('uuid');


var app = express();

mongoose.connect('mongodb://localhost/tailorzx', {useNewUrlParser: true, useUnifiedTopology: true});
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
mongoose.set('useFindAndModify', false);

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    type: String
});

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", userSchema);

var portfolioSchema = new mongoose.Schema({
    user: String,
    pic1: String,
    pic2: String,
    pic3: String,
    desc: String,
    location: String
});

var Portfolio = mongoose.model("Portfolio", portfolioSchema);

var orderSchema = new mongoose.Schema({
    title: String,
    body: String,
    range: String,
    type: String,
    pattern: String,
    delivery: String,
    color: String,
    size: String,
    tailor: String,
    username: String,
    Phone: String,
    Address: String,
    reference: String
});

var Order = mongoose.model("Order", orderSchema);

var contactSchema = new mongoose.Schema({
    user: String,
    message: String,
    email: String,
    tailor: String
});

var Contact = mongoose.model("Contact", contactSchema);

//PASSPORT CONFIG
app.use(require('express-session')({
    secret: "I can do it!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(flash());


app.use(function(req,res,next){   
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

isLoggedIn = function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Please Login first!");
    res.redirect("/login");
}

isTailor = function(req, res, next){
    if(req.user.type == "Tailor"){
        return next();
    }
    req.flash("error", "You do not have the permission to do that!");
    res.redirect('/login');
}

app.get('/', function(req,res){
    res.render('home.ejs');
});

app.get("/login", function(req, res){
    res.render("login.ejs");
});

app.get("/signup", function(req, res){
    res.render("signup.ejs");
});

app.post("/signup", function(req, res){
    User.register(new User({username: req.body.username, email: req.body.email, type: req.body.type}), req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            res.redirect("/signup");
        }
        passport.authenticate("local")(req,res, function(){
            res.redirect("/");
        });    
    });
})

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}), function(req,res){
});

app.get("/logout" ,function(req,res){
    req.logOut();
    req.flash("success", "Successfully logged out!");
    res.redirect("/");
});

app.post('/dashboard',isLoggedIn, function(req, res){
    Portfolio.find({}, function(err, portf){
        if(err){
            res.send("Something went Wrong!");
            console.log(err);
        } else {
            if(req.user.username == portf.username){
                req.flash("error", "Your portfolio already exists!");
                res.redirect('/dashboard');
            } else {
                var portnew = {
                    user: req.user.username,
                    pic1: req.body.pic1,
                    pic2: req.body.pic2,
                    pic3: req.body.pic3,
                    desc: req.body.desc,
                    location: req.body.location
                }
                Portfolio.create(portnew, function(err, result){
                    if(err){
                        res.send("Something went Wrong!");
                        console.log(err);
                    } else {
                        req.flash("success", "Portfolio created successfully!");
                        res.redirect('/dashboard');
                    }
                });
            }
        }
    })
});

app.get('/dashboard', isLoggedIn, isTailor, function(req, res){
    Contact.find({}, function(err, contact){
        Order.find({}, function(err, order){
            if(err){
                res.send("Something went Wrong!");
                console.log(err);
            } else {
                Portfolio.find({}, function(err, portf){
                    if(err){
                        res.send("Something went Wrong!");
                        console.log(err);
                    } else {
                        res.render('portfolio.ejs', {portf: portf, order: order, contact: contact});
                    }
                });
            }
        })
    })
});

app.get('/tailors', function(req, res){
    Portfolio.find({}, function(err, portf){
        if(err){
            res.send("Something went wrong!");
            console.log(err);
        } else {
            res.render("tailors.ejs", {portf: portf});
        }
    });
});

app.get('/tailor/:id', function(req, res){
    Portfolio.find({}, function(err, portf){
        if(err){
            res.send("Something went wrong!");
            console.log(err);
        } else {
            Portfolio.findById(req.params.id, function(err, show){
                if(err){
                    res.send("Something went Wrong!");
                    console.log(err);
                } else {
                    res.render('show.ejs', {show: show, portf: portf});
                }
            })
        }
    })
})

app.post('/search', function(req, res){
    var input = req.body.input;

    Portfolio.find({}, function(err, portf){
        if(err){
            res.send("Something went wrong!");
            console.log(err);
        } else {
            res.render("search.ejs", {portf: portf, input: input});
        }
    })
})

app.get('/order/:id',isLoggedIn, function(req, res){
    Portfolio.findById(req.params.id, function(err, result){
        if(err){
            res.send("Something went wrong!");
            console.log(err);
        } else {
            res.render("order.ejs", {result: result});
        }
    });
})

app.post('/order/:id',isLoggedIn, function(req, res){
    Portfolio.findById(req.params.id, function(err, result){
        if(err){
            res.send("Something went wrong!");
            console.log(err);
        } else {

            var order = {
                title: req.body.title,
                body: req.body.body,
                range: req.body.range,
                type: req.body.type,
                pattern: req.body.pattern,
                delivery: req.body.delivery,
                color: req.body.color,
                size: req.body.size,
                tailor: result.user,
                username: req.user.username,
                Phone: req.body.phone,
                Address: req.body.address,
                reference: req.body.reference
            }

            Order.create(order, function(err, result){
                if(err){
                    res.send("Something went wrong!");
                    console.log(err);
                } else {
                    res.redirect('/payment');
                }
            });
        }
    });
})

app.get('/contact/:id',isLoggedIn, function(req, res){
    Portfolio.findById(req.params.id, function(err, result){
        if(err){
            res.send("Something went wrong!");
            console.log(err);
        } else {
            res.render("Contact.ejs", {result: result});
        }
    });
})

app.post('/contact/:id',isLoggedIn, function(req, res){
    Portfolio.findById(req.params.id, function(err, result){
        if(err){
            res.send("Something went wrong!");
            console.log(err);
        } else {

            var contact = {
                user: req.user.username,
                message: req.body.message,
                email: req.body.email,
                tailor: result.user
            }

            Contact.create(contact, function(err, result){
                if(err){
                    res.send("Something went wrong!");
                    console.log(err);
                } else {
                    req.flash('success', 'Tailor contacted successfully!');
                    res.redirect('/tailors');
                }
            });
        }
    });
})

app.get('/ordershow/:id', isLoggedIn, isTailor, function(req, res){
    Order.findById(req.params.id, function(err, result){
        if(err){
            res.send("Something went wrong!");
            console.log(err);
        } else {
            res.render("ordershow.ejs", {result: result});
        }
    })
});

app.get('/payment',isLoggedIn, function(req, res){
    res.render('payment.ejs');
});

app.listen(3000, function(){
    console.log("Tailorzx Server started...");
});