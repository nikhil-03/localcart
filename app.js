require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs= require("ejs");
const _=require("lodash");
const passport=require("passport");
const session=require("express-session");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app=express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine','ejs');

app.use(session({
    secret:"xyz",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
// mongoose.connect('mongodb://localhost:27017/shop', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect("mongodb+srv://admin-nikhil:Nikhil-03@nikhil-yoevb.mongodb.net/healthDB", {useNewUrlParser: true, useUnifiedTopology: true});
const shop=
{
    upi:String,
    shop_name:String,
    mobile:String,
    address:String,
    googleId:String,
    product:
     [{
         wt:String,
         brand:String,
         name:String,
         barcode:String,
         price:String
     }]
};
const Shop=mongoose.model("Shop",shop);
const wish=
{
    shop_name:String,
    mobile:String,
    address:String,
    googleId:String,
    
    product:
     [{
         wt:String,
         shopid:String,
         brand:String,
         name:String,
         barcode:String,
         price:String
     }]
};

const Wish=mongoose.model("Wish",wish);
const userSchema = new mongoose.Schema({
    img:String,
    name:String,
    googleId:String
});
userSchema.plugin(findOrCreate);
const User = new mongoose.model('User', userSchema);
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://localcart.herokuapp.com/auth/google/localcart",
    // callbackURL :  "http://localhost:3000/auth/google/localcart",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb)    {
      // console.log(profile.photos[0].value);
    User.findOrCreate({ googleId: profile.id,name:profile.displayName,img:profile.photos[0].value }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get("/",function(req,res)
{

    res.render("register")
});
app.get("/logged-in",function(req,res){
    
    if(req.isAuthenticated())
    {
       Wish.findOne({googleId:req.user.id},function(err,foundlist){
        if(!err)
        {
            if(!foundlist){
                const list=new Wish({
                    googleId:req.user.id
                });
                list.save();
            }
        }
      })
     Shop.find({},function(err,shops){
        res.render("home",{ shops:shops})
    });  
    }
    else res.redirect("/");
});

app.post("/add-cart",function(req,res){
  const x=req.body.gid;

  // console.log(req.body.product);
  // console.log(req.body.gid);
  const user=req.user.id;
  //   // console.log(user);
  // const list=new Wish({
  //   user_id:user , product:req.body.product , shop_id:req.body.gid
  // });
  // list.save();
  Wish.findOne({googleId:req.user.id},function(err,foundlist){
    if(!err)
    {
        if(!foundlist){
            const list=new Wish({
                googleId:req.user.id
            });
            list.save();
        }
    }
  })

  Wish.findOneAndUpdate({googleId:user},
    {
     $push:
     {
         product:{
             name:req.body.name, 
             brand:req.body.brand, 
              wt:req.body.wt,
              price:req.body.price,
              shopid:x
         }
     }
      
 }).then(function (post) {
         console.log(post);
        //  res.json({success: true});
        });



  Shop.findOne({ googleId:x},function(err,products)
  {
    if(products){
   res.render("products",{ products:products.product, gid:x , gid:x });  }
  }); 

});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

 app.get('/auth/google/localcart', 
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/logged-in");
  });


app.get("/my-order",function(req,res){
  const x=req.user.id;
  Wish.findOne({ googleId:x},function(err,products)
  {
    if(products){
   res.render("myorder",{ products:products.product });  }
  }); 
});

app.post("/delete",function(req,res){
//   const id=req.body.id


// Wish.update(
//   {},
//   {
//     $pull: 
//     {
//       product: {_id : id}
//     }
//   },{multi:true}
//   )




//   console.log(id);
  // Wish.findByIdAndRemove(id,function(err){
  //   if(err)console.log(err);
  // });


  res.redirect("/my-order");
});




app.get("/:custom",function(req,res)
{
    // console.log("Here"+req.params.custom);
    const x=req.params.custom;
    // console.log(x);
    
      Shop.findOne({ googleId:x},function(err,products)
      {
        if(products){
       res.render("products",{ products:products.product,gid:x , gid:x });  }
      }); 
});



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,function()
{
    console.log("Connected");
});