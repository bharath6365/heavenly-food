const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const User = mongoose.model('User');
// We use promisify to change functions that return a callback to return a promise instead
const promisify = require('es6-promisify');


exports.loginForm = (req,res) => {
  res.render('login',{ title: 'Login'});
}

exports.registerForm = (req,res) => {
    res.render('register',{ title: 'Register'});
}

exports.validateRegister = (req,res,next) => {
    // This comes from express validator
    // We can check body,params,query etc
    req.sanitizeBody('name')
    req.checkBody('name','You must supply a name').notEmpty();
    req.checkBody('email', 'That email is not valid').isEmail().notEmpty();
    // Sometimes useer a@gmail.com ,a@googlemail.com etc. So we need to normalize email ids.
    req.sanitizeBody('email').normalizeEmail({
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'Password cannot be blank').notEmpty();
    req.checkBody('confirm-password', 'Confirm password is incorrect').equals(req.body.password);
    // After validatiing check for errors by calling req.validationErrors()
    const errors = req.validationErrors();
    if (errors) { 
        req.flash('error', errors.map(err => err.msg));
        // If there are errors re render the page but please dont clear the form data
        res.render('register',{
            title: 'Register',
            body: req.body,
            // We also need to send the flashes along because it is another request.
            flashes: req.flash()
        })
    }
    next();
}

exports.register = async (req,res,next) => {
  const user = new User ({
      email: req.body.email,
      name: req.body.name
  })
//  Now we dont call save() on it because we dont have password  yet. We call register()
//  which comes from the localmongoosepassport plugin registered to the schema.
//  User.register(user, req.body.password, function(err, user){

//  });
// We can use call back or promisify it
// First the method to change to promise and second the object to bind to
const registerWithPromise = promisify(User.register, User);
 await registerWithPromise(user, req.body.password);
 // We store just the hash of the password and not the password itelf
 next();
}

exports.account = (req,res) => {
  res.render('account',{title: 'Edit your account'});
}

exports.updateAccount = async (req,res) => {
    const updateData = {
        name: req.body.name,
        email: req.body.email
    }
    const user = await User.findOneAndUpdate(
      {_id: req.user.id},
      {$set: updateData},
      { 
        // Returns the new user instead of the old data
          new: true,
          runValidators: true,
        //   Context is also required to run update properly
          context: 'query'
      }
    );
    res.redirect('/account');
}


