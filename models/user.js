var mongoose=require("mongoose");
var bcrypt=require("bcrypt");
var SALT_I=10;
var jwt=require("jsonwebtoken");
var SECRET="HELLO WORLDS SBJKC BVJBVDH V"


var userSchema=mongoose.Schema({
    email:{
        type:String,
        required:true,
        trim:true,
        unique:1

    },
    password:{
        type:String,
        required:true,
        minlength:3
    },
   
    role:{
        type:Number,
        default:0
    },
    token:{
        type:String
    }
})


userSchema.pre('save',function(next){
    var user=this;
    
    if(user.isModified('password')){
       
        bcrypt.genSalt(SALT_I,function(err,salt){
            if(err) return next(err);
            bcrypt.hash(user.password,salt,function(err,hash){
                if(err) return next(err);
                user.password=hash;
                next();
                
            })
        })
    }
    else{
        next();
    }
})


userSchema.methods.comparePassword=function(candidatePassword,cb){
    bcrypt.compare(candidatePassword,this.password,function(err,isMatch){
        if(err) return cb(err);
        cb(null,isMatch)
    })
}

userSchema.methods.generateToken=function(cb){
    var user=this;
    var token=jwt.sign(user._id.toHexString(),SECRET);

    user.token=token;
    // save to database
    user.save(function(err,user){
        if (err) return cb(err);

        cb(null,user);
    })
}

userSchema.statics.findByToken=function(token,cb){
    var user=this;
   

    jwt.verify(token,SECRET,function(err,decode){
        // here decode is user_id
        user.findOne({"_id":decode,"token":token},function(err,user){
            if(err) return cb(err);
            cb(null,user)
        })
    })
}

var User=mongoose.model('User',userSchema);

module.exports={ User }