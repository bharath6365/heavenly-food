// Here we require passport. We need to create a passport strategy here.
const passport = require('passport');
const mongoose =require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

const crypto = require('crypto');

exports.login = passport.authenticate('local', {
    failiureRedirect: '/login',
    failiureFlash: 'Login Failed',
    successRedirect: '/',
    successFlash: 'Login Success'
})

exports.logout = (req,res) => {
    req.logout();
    req.flash('success', 'You are now logged out');
    res.redirect('/');
}

exports.isLoggedIn = (req,res,next) => {
    if (req.isAuthenticated()) {
       return next();
    } else {
      req.flash('error', 'You must login first');
      res.redirect('/');
    }
}

exports.forgot = async (req,res,next) => {
    // 1. See if the user exists
    const user = await User.findOne({
        email: req.body.email
    })
    if (!user) {
        req.flash('error', 'No account with this email exists');
        return res.redirect('/login');
    }
    // 2.Set reset token and expiry token on their account
     user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
     user.resetPasswordExpires = Date.now() + 3600000 // Will expire after one hour
     await user.save();    
    // 3.Send them the email with the user token
    // req.headers.host gives you the operating url
     const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
     req.flash('success', `You have been emailed a password reset token. ${resetUrl}`);
     res.redirect('/login');
    // 4.Update their account and redirect them to login. Run update password

}

exports.resetPassword = async (req,res,next) => {
    const token = req.params.token;
    const user = await User.findOne({
        // We also make sure that resetPasswordExpires is greater than the current date
        resetPasswordToken : token,
        resetPasswordExpires: { $gt: Date.now()}
    })
    if (!user) {
       req.flash('Error', 'Invalid token or token expired');
       return res.redirect('/login');
    }
    // If there is a user, show the reset password form

    res.render('reset',{tilte:'Reset Form'});
}

exports.confirmPasswords = (req, res, next) => {
    req.checkBody('password', 'Password cannot be blank').notEmpty();
    req.checkBody('confirm-password', 'Confirm password is incorrect').equals(req.body.password);
    const errors = req.validationErrors();
    if (errors) {
        req.flash('error', errors.map(err => err.msg));
        return res.redirect('/login');
    } else {
       return next();
    }
}

exports.updatePassword = async (req,res,next) => {
    const user = User.findOne({
        resetPasswordToken : req.params.token,
        resetPasswordExpires: { $gt: Date.now()}
    })
    if (!user) {
        req.flash('Error', 'Invalid token or token expired');
        return res.redirect('/login');
     } 
       // Plugin gives us access to setPassword() but it returns callback
       const setPassword = promisify(user.setPassword, user);
       await setPassword(req.body.password);

       // Now we have to make sure we get rid of token and expiry cookie
       // We do this in mongodb by setting them to undefined

       user.resetPasswordToken = undefined;
       user.resetPasswordExpires = undefined;
       const updatedUser = await user.save();
       // .login() is a passport function and it will automatically log us in when passed 
       //  the user object   
       await req.login(updatedUser);
       req.flash('success','Password updated. You are now logged in');
       res.redirect('/');
}
