const mongoose = require('mongoose');
const crypto = require('crypto');
mongoose.Promise = global.Promise;

// To hash the email address of the user for the gravatar picture
const md5= require('md5');
// Validator is a subset of express validator.
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
// Passport package for local signup
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  email:{
    type: String,
    unique: true,
    required: 'Please supply an email id',
    trim: true,
    // Email can be either uppercase or lower case. So we lowercase it.
    lowercase: true,
    // Validate takes an array.First value is the check and the 2nd one is the error string.
    validate: [validator.isEmail, 'Invalid email id']
  },
  name: {
      type: String,
      required: 'Please supply a name',
      trim: true
  },
  // Hearts is an array of stores
  hearts: [
     {
       type: mongoose.Schema.ObjectId,
       ref: 'stores'
     }
  ],
  resetPasswordToken: String,
  resetPasswordExpires: Date
  // Password field is stored as salt and hash in the db. We use passport to do it for us.
});

// We create something called a virtual field here. Virtual fields are not stored in the db.

userSchema.virtual('gravatar').get(function (){
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});


// We add the passport local plugin to our schema and we set username field as the email field.
userSchema.plugin(passportLocalMongoose, {
    usernameField: 'email'
})
;
// Email with unique true will throw error if its duplicated. Mongodb error handler will show n
// nice errors when compared to built in mongo db error.
userSchema.plugin(mongodbErrorHandler);
module.exports = mongoose.model('User', userSchema);