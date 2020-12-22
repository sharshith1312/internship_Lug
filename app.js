var express=require("express")
var app=express()

var fs = require('fs');
var path = require("path") 
var multer=require('multer')
var methodOverride=require("method-override")
app.use(methodOverride("_method"));
var bodyParser = require('body-parser');
var cookieParser=require("cookie-parser");
var mongoose=require("mongoose");
app.set("views",path.join(__dirname,"views"))
app.set("view engine","ejs")
app.use(bodyParser.urlencoded({extended:true}));

app.use(bodyParser.json());
app.use(cookieParser());

mongoose.connect('mongodb://localhost:27017/internship_work',{ useNewUrlParser: true,useUnifiedTopology: true } );

// Models
var { Employee }=require("./models/employee");
var { User }=require("./models/user");
// Middleware
var { auth }=require("./middleware/auth");
var { admin }=require("./middleware/admin");

var storage = multer.diskStorage({ 
    destination: function (req, file, cb) { 
  
        cb(null, "uploads/") 
    }, 
    filename: function (req, file, cb) { 
        console.log(file)
      cb(null, file.originalname) 
    } 
  }) 

var upload=multer({storage:storage})

app.get("/",function(req,res){
    res.render("login")
})
app.get("/register",function(req,res){
    res.render("register")
})
app.get("/create",auth,function(req,res){
    res.render("createEmployee")
})
app.get("/home",auth,function(req,res){
    res.render("fileupload")
})

app.post("/uploadFiles",upload.array('filename',50),function(req,res,next){
    var fileinfo=req.files
    console.log(fileinfo)
    Employee.find({},function(err,allEmps){
        if(err){
            console.log("some thing went wrong")
            console.log(err)
        }
        else{
            var arr=[]
            console.log(allEmps)
            for(var i=0;i<allEmps.length;i++){
                arr.push(allEmps[i]['employee_id'])
            }
            
            // fileinfo is array
            count=0
            for(var j=0;j<fileinfo.length;j++){
                file_name=fileinfo[j]["originalname"]
                fn=file_name.split(".")[0]
                console.log(fn)
                if(arr.includes(fn)){
                    count+=1
                    console.log(count)
                    Employee.findOneAndUpdate(
                        {
                            "employee_id":fn
                        },
                        {
                            "file":{
                                data: fs.readFileSync(path.join(__dirname + '/uploads/' + file_name)),
                                contentType: 'application/pdf'
                            },
                            "filename":file_name
                        },function(err,result){
                            if (err) return res.json({success:false,err});
                                // return res.status(200).send({
                                //     success:true,
                                //     data:result
                                // })
                                console.log(result)
                        }
                    )
                }

            }
        }
    })
    // res.send(fileinfo)

})

app.get("/allemps",function(req,res){
    Employee.find({},function(err,allEmps){
        if(err){
            console.log("some thing went wrong")
            console.log(err)
        }
        else{
            res.render('allemps',{allEmps:allEmps})
        }
    })
})
app.post("/create",auth,admin,function(req,res){
    
    var emp={employee_id:req.body.eid}
    console.log(emp)
    Employee.create(emp,function(err,newemp){
        if(err){
            res.send(err)
        }
        else{
            console.log(newemp)
            res.redirect("/allemps")
        }
    })
})


app.get("/download/:id",function(req,res){
    Employee.findOne({'_id':req.params.id},function(err,emp){
        var buf=emp.file.data
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Length', buf.length)
        res.setHeader('Content-Disposition', `attachment; filename=${emp.filename}`)
        return res.end(buf)
    })
})
app.delete("/allemps/:id",auth,admin,function(req,res){
    Employee.findByIdAndRemove(req.params.id,function(err){
        if(err){
            console.log(err)
            res.redirect("/allemps")
        }
        else{
            
            res.redirect("/allemps");
        }
    })
})

app.post("/register",function(req,res){
    
    const user=new User(req.body);
    user.save(function(err,doc){
        if(err){
            console.log(err)
            return res.json({success:false,err})
        }
        // res.status(200).json({
        //     success:true,
        //     // userdata:doc
        // })
        res.render("login")
    })
    // res.status(200);
});

app.post('/login',function(req,res){
   
    User.findOne({'email':req.body.email},function(err,user){
  
        if(!user){
            return res.json({loginSuccess:false,message:'Oh Auth fails email is incorrect'});
        }
        // match the password
        user.comparePassword(req.body.password,function(err,isMatch){
            if(!isMatch) return res.json({loginSuccess:false,message:'wrong password'})

            // generate Token
            user.generateToken(function(err,user){
                if (err){
                    return res.status(400).send(err);
                }
               
                // res.cookie('w_auth',user.token).status(200).json({
                //     loginSuccess:true,
                //     message:'You successfully logged in'
                // })
                res.cookie('w_auth',user.token).redirect("/allemps")
            })

        })
        
    })
    
})


app.get("/logout",auth,function(req,res){
    User.findOneAndUpdate(
        {
            "_id":req.user._id
        },
        {"token":""},function(err,doc){
            if (err) return res.json({success:false,err});
            return res.status(200).send({
                success:true
            })
        }
    )
})
var port = process.env.PORT || 3008;
app.listen(port, function (){
  console.log("Server Has Started!")
})