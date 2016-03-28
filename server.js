var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passport	= require('passport');
var config      = require('./config/database');
var User        = require('./app/models/user');
var port        = process.env.PORT || 8000;
var jwt         = require('jwt-simple');

 
// obtention de parametres de la requete
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
// log pour la console
app.use(morgan('dev'));
 
// initialisation de passport
app.use(passport.initialize());
 
// route par default
app.get('/', function(req, res) {
  res.send("Documentation : https://github.com/Alatreon/api-node-js");
});

// connection a la base de donnée
mongoose.connect(config.database);
 
require('./config/passport')(passport);

// creation de la variable qui va contenir les routes
var apiRoutes = express.Router();

// place les routes contenues dans "apiRoutes" avant /api/*
app.use('/api', apiRoutes);

// creer un nouveau compte (POST http://localhost:8080/api/signup)
apiRoutes.post('/signup', function(req, res) {
  if (!req.body.name || !req.body.password) {
    res.json({success: false, msg: 'Formulaire non valide.'});
  } else {
    var newUser = new User({
      name: req.body.name,
      password: req.body.password
    });
    // sauvegarde de l'utilisateur
    newUser.save(function(err) {
      if (err) {
        return res.json({success: false, msg: "L'utilisateur existe déjà."});
      }
      res.json({success: true, msg: 'Utilisateur créer.'});
    });
  }
});
 

// create a new user account (POST http://localhost:8080/signup)

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) throw err;
 
    if (!user) {
      res.send({success: false, msg: "L'utilisateur n'existe pas."});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.encode(user, config.secret);
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token});
        } else {
          res.send({success: false, msg: 'Mauvais mot de passe.'});
        }
      });
    }
  });
});

// route to authenticate a user (POST http://localhost:8080/api/authenticate)

// route to a restricted info (GET http://localhost:8080/api/memberinfo)
apiRoutes.get('/memberinfo', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findOne({
      name: decoded.name
    }, function(err, user) {
        if (err) throw err;
 
        if (!user) {
          return res.status(403).send({success: false, msg: "L'utilisateur n'existe pas."});
        } else {
          res.json({success: true, msg: 'Bienvenue dans la zone de ' + user.name + '!'});
        }
    });
  } else {
    return res.status(403).send({success: false, msg: 'Aucun token fournie.'});
  }
});
 
getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

// demarage du serveur
app.listen(port);
console.log("test d'un console.log: http://localhost:" + port);












