const mongoose = require('mongoose');
// Multer will store the image in server memory before being resized by jimp
const multer = require('multer');
const User = mongoose.model('User');
const jimp = require('jimp');
// We use uuid to differentiate between the file names (for eg there can be two dogs.png)
const uuid = require('uuid');
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter: function(req,file,next) {
    const isPhotoSupported = file.mimetype.startsWith('image/');
    if (isPhotoSupported) {
      next(null, true);
    } else {
      next({message: 'File type not suppported'}, false);
    }
  }
}
const Store = mongoose.model('Store');
exports.home = (req,res) => {
  res.render('index');
};

exports.addStore = (req,res) => {
  return res.render('editStore');
};

// Multer middleware configuration
exports.photoUpload = multer(multerOptions).single('photo');

exports.photoResize = async(req,res,next) => {
  // Check if there is a file to resize
  if (!req.file) {
   return next();
  }
 const extension = req.file.mimetype.split('/')[1];
 // To pass it on to createStore middleware and eventually saved to db from req.body
 req.body.photo = `${uuid.v4()}.${extension}`;
 //Resize 
 const photo = await jimp.read(req.file.buffer);
 await photo.resize(800, jimp.AUTO);
 await photo.write(`./public/uploads/${req.body.photo}`);
 // Now invoke next phew.......
 next();
}

exports.createStore = async (req,res) => {
  // Other data on req.body wont be saved because we use a strict schema.
  // We set the stores author to the person who's currently creating the store
  req.body.author = req.user._id;
  const store = await (new Store(req.body)).save();
  req.flash('success',`Succesfully created the store`);
  res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req,res) => {
  // Pagination
  const page = req.params.page || 1;
  const limit = 4;
  const skip = (page * limit) - limit
  // Query the database for a list of stores
  const storesPromise =  Store
   .find()
   .skip(skip)
   .limit(limit)
   .populate('reviews');
  const storeCountPromise = Store.count();
  const [stores, storeCount] = await Promise.all([storesPromise, storeCountPromise])
  const pages = Math.ceil(storeCount / limit);
  if (!stores.length && skip) {
    req.flash(`You asked for page ${page}. That doesn't exist. Redirecting you to page ${pages}`)
    return res.redirect('/stores/page/${pages}');
  }
  res.render('stores',{
    title: 'Stores',
    stores,
    page,
    storeCount,
    pages
  });
};



const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store to edit it');
  }
};

exports.editStore = async (req,res) => {
  // Query the database for a list of stores
  const storeId = req.params.id;
  const store = await Store.findOne({
    _id:storeId
  })
  // Now check if the user who has come to edit is the owner of the store
  confirmOwner(store, req.user);
  res.render('editStore',{
    title: 'Edit Store',
    store
  });
};

exports.updateStore  = async (req,res) => {
  // When updated defaults do not kick in :(
    req.body.location.type = 'Point';
  // Query the database for a list of stores
  const storeId = req.params.id;
   const store = await Store.findOneAndUpdate({
      _id:storeId
    },req.body,{
       new: true, // Return new store instead of the old one
       runValidators: true
    }).exec();
    req.flash('success',`Successfully updated ${store.name}. Link : <a href="/stores/${store.slug}">View store </a>`)
    res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug  = async (req, res, next) => {
  const slug = req.params.slug
  // We populate by author because we dont need the id. We need details of user
   const store = await Store.findOne({
      slug
    }).populate('author reviews');
    if (!store) {
      return next();
    }
    res.render('store',{
      store,
      title: store.name
    })
};

exports.getStoresByTag = async(req , res, next) =>{
  //Static method on our store model
  const tagsPromise =  Store.getTagsList();
  const activeTag = req.params.tag;
  // If there is a single tag display it for individual tags page
  // or get all the stores for the tags page
  const tagQuery = activeTag || {$exists: true}; 
  const storesPromise = Store.find({
    tags: tagQuery
  })
  const result = await Promise.all([tagsPromise, storesPromise]);
  
  res.render('tags', {
    tags : result[0],
    title: 'Tags',
    activeTag,
    stores: result[1]
  })
}

exports.searchStores = async (req, res) => {
  // When we index name,description as text we get to search by $text.
  // But also we wanna make sure search results with the maximum keywords occour
  // first. This is where mongo db meta data comes in. We create a meta field called store
  // and we make it a count of the number of times the text has appeared in name or desc.
  // Finally we sort in the descending order and then limit it to 5
  const stores = await Store.find({
    $text: {
      $search: req.query.q
    }
  },{
     score: { $meta: 'textScore'}
  })
  .sort({
    score: {$meta: 'textScore'}
  })
  .limit(6);
  res.json(stores);
}

// We need to toggle the hearts. If they hearted it unheart it and vice versa
exports.heartStore = async (req,res,next) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  // Pull and addtoSet are the operators that are used for this
  // It is similar to set.
  // Check if hearts array has the id already

  // Toggle functionality
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet'
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {[operator]: {hearts:req.params.id}},
    {
      'new':true
    }
  )
  res.json(user);
}

exports.getHearts = async (req,res) => {
  const stores = await Store.find({
    _id:{$in:req.user.hearts}
  })
  res.render('stores',{
    title:'Hearted stores',
    stores
  })
}

exports.getTopStores = async (req,res) => {
  const stores = await Store.getTopStores();
   res.render('topStores', {stores, title: '😀 Top Stores'})
}