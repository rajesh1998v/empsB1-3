var express = require("express");

let passport = require("passport");
let jwt = require("jsonwebtoken");
let JWTStrategy = require("passport-jwt").Strategy;
let ExtractJWT = require("passport-jwt").ExtractJwt;
let {emps} = require("./emps");


var app = express();
app.use(express.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept,Authorization"
  );  
  res.header("Access-Control-Expose-Headers","Authorization")
  res.header("Access-Control-Expose-Headers","X-Auth-Token")
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
  next();
});

let port =2410;

app.use(passport.initialize());

app.listen(port, () => console.log(`Node app listening on port ${port}`));

const parama = {
    jwtFromRequest:ExtractJWT.fromAuthHeaderAsBearerToken(),secretOrKey:"jwtsecret23647832"
};

const jwtExpirySeconds = 3000;

let strategyAll = new JWTStrategy(parama,function(token,done){
    console.log("In JWTStrategy-All", token);
    console.log(token.empcode);
    let user1 = emps.find((u)=>u.empCode==token.empcode);
    console.log("user",user1);
    if(!user1)
    return done(null, false,{message: "Incorrect username or password"});
    else return done(null,user1);
});

let strategyAdmin = new JWTStrategy(parama,function(token,done){
    // console.log("In JWTStrategy-All", token);
    let user1 = emps.find((u)=>u.empCode==token.empCode);
    // console.log("emp",user1);
    if(!user1)
    return done(null, false,{message: "Incorrect username or password"});
    else if(user1.role!=="admin")
    return done(null, false,{message: "You do not have admin"});
    else return done(null,user1);
});


passport.use("roleAll",strategyAll);
passport.use("roleAdmin",strategyAdmin);

app.post("/login",function(req,res){
    let {empCode,name} = req.body;
    let user = emps.find((u)=>u.empCode==empCode && u.name===name);
    if(user){
        let payload = {empcode:user.empCode};
        let token = jwt.sign(payload,parama.secretOrKey,{
            algorithm: "HS256",
            expiresIn:jwtExpirySeconds,
        });
        res.setHeader("X-Auth-Token",token)
        res.send(payload);
    }else res.sendStatus(401);
});


app.get("/myDetails",passport.authenticate("roleAll",{session: false}),function(req,res){
    res.send(req.user);
});


app.get("/company",passport.authenticate("roleAll",{session: false}),function(req,res){
    res.send("Welcome to the Employee Portal of XYZ Compan");
})


app.get("/myJuniors",passport.authenticate("roleAll",{session: false}),function(req,res){
    let user1 = req.user;
    // console.log("user1",user1);
  
    if(!user1)
      res.status(401).send("No access. Please login first");
      else{
        if(user1.designation==="VP"){
          let user = emps.filter(e=>e.designation==="Manager" || e.designation==="Trainee");
          res.send(user)
        }
        else if(user1.designation==="Manager"){
          let user = emps.filter(e=>e.designation==="Trainee");
          res.send(user)
        }
        else {
          let user=[]
          res.send(user)
        }
  
      }
  });