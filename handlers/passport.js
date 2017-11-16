const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
// This comes from the plugin in the schema
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

