const { Binary } = require("bson");
var mongoose=require("mongoose");
// var passportLocalMongoose=require("passport-local-mongoose");
var EmployeeSchema=new mongoose.Schema({
    employee_id:{
        type:String,
        required:true
    },
    file:{
        data: Buffer,
        contentType:String,
    },
    filename:{
        type:String
    }
})
// UserSchema.plugin(passportLocalMongoose)
var Employee=mongoose.model("Employee",EmployeeSchema);
module.exports={ Employee }