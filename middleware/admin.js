var admin=function(req,res,next){
    if(req.user.role===0){
        return res.send("You are not admin you are not allowed here")
    }
    next();
}

module.exports={ admin };