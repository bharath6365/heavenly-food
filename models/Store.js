const mongoose = require('mongoose');
// To generate friendly urls
const slug = require('slugs');
mongoose.Promise = global.Promise;
const storeSchema =new  mongoose.Schema({
    name : {
        type: String,
        required: 'Please enter your store name',
        trim: true
    },
    slug: String,
    created:{
        type: Date,
        default: Date.now
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        // Referencing the User model
        ref: 'User',
        required: 'You must pass an author'
    },
    location: {
        type: {
          type: String,
          default: 'Point'
        },
        coordinates: [{
          type: Number,
          required: 'You must supply coordinates'
        }],
        address: {
            type: String,
            required: true
        },
    },
    
    description: {
        type: String,
        required: true
    },
    tags: [String] // Array of strings
}, {
    // By default virtuals are not visible. Now we have to set it explicitly if we wanna.
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
})
// We index our name,description so that it wil be faster 
storeSchema.index({
    'name': 'text',
    'description': 'text'
});
// Save wont happen until pre is run. But run it only if name is modified.

storeSchema.pre('save',async function(next){
    if (!this.isModified('name')){
        return next();
    }
  // Slug is set
    this.slug = slug(this.name);
    // Find other stores that have a a slug  ending with exp , exp-1 , exp-2
    const slugRegex = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`,'i');
    const storesWithSlug = await this.constructor.find({slug: slugRegex});
    if (storesWithSlug.length){
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`
        console.log('Slugs with similar name found');
    }
    next();
});

storeSchema.statics.getTagsList = function(){
  return this.aggregate([
      // Unwind will create seperate rows. Say one store has 2 tags.Wifi,Vegetarian
      // Two records will be created for same store. one with tag wifi and other veg.
      {$unwind: '$tags'},
      {
        $group: {
          _id: '$tags',
          count : {
              $sum : 1
          }
       }
    },
    {$sort: {count: -1}}
  ])
}

storeSchema.statics.getTopStores = function (){
    return this.aggregate([
    // Virtual is supported by mongoose but not by mongodb.So first we need to get all the reviews
    // which is a virtual field
    {
        $lookup:{
        // Mongodb lower cases the model and adds an s.  
          from: 'reviews',
          localField: '_id',
          foreignField: 'store',
        //   Virtual is saved as reviews.
          as: 'reviews'
       } 
    },
    // Filter for only items that have 3 or more reviews
    {
       $match:{
        //    reviews.2 => reviews[2] in mongodb.
        //  So now we are checking if three reviews exists 
           'reviews.2': {$exists: true}
       }
    },

//     // Sort it our by new field , highest reviews first
//     // Project creates a new field called averageRating. But project removes the other fields.
//     //  So we should add the other fields manaully.
//     // From mongodb version 3.4 we can use addToField
    { $project: {
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        reviews: '$$ROOT.reviews',
        slug: '$$ROOT.slug',
        averageRating:{$avg:'$reviews.rating'},

      }
   },
   {
       $sort:{
           averageRating:-1
       }
   },

    // Limit to 10 fields
     {
         $limit:10
     }
    ]);
}

//  We have a review model which has a field called store which is referencing the current model.
//  But inside our store.js we dont have a link to reviews. Now we could include this in the model 
//  But we would be managing data in multiple places. Hence whenever we query a store we create a 
//  virtual field and search for reviews in the review model with the current store id. This is like
//  a primary key and a secondary key reference in sql.

// Find reviews where store._id = reviews.store
// Virtual fields are not visible whenever you convert it into an object.

storeSchema.virtual('reviews', {
    ref: 'Review',
    // Which field on store should match with foriegnField
    localField: '_id',
    foreignField: 'store'
})
module. exports = mongoose.model('Store',storeSchema);