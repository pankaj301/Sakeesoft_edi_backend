const { dir, Console } = require('console');

const express = require('express'),
path = require('path'),
cors = require('cors'),

bodyParser = require('body-parser');
var fs = require("fs");
var morgan = require('morgan')
const PATH = './uploads';
const routerpath =require('./router_file/router');
// Express settings
const app = express();
app.use(morgan('combined'))
app.use(cors());
let router = express.Router();
app.use(router);

app.use(bodyParser.urlencoded({limit: "100mb", extended: true, parameterLimit: 500000000 }))
app.use(bodyParser.json({limit: "100mb", extended: true}));
app.use(function(req, res, next){
  res.setTimeout(120000000, function(){
      console.log('Request has timed out.');
          res.send({
            "status": "408",
            "message": "Connection timeout..Please try Again"
          });
      });

  next();
});

app.get("/", routerpath.getstart); // * start
app.post("/api", routerpath.getapi);
app.post("/api/upload", routerpath.getpostfile); // POST File
app.post("/create945", routerpath.getuploadfile); //to create945 file
app.get("/download945file", routerpath.getdownload); //download945
app.post("/register", routerpath.getregistration); // for registration 
app.post("/login", routerpath.getlogin); // for login 

//IDOC to EDI TABLE api
app.get("/getidocdirectoires", routerpath.getIDOCdirectories);   //get idoc directories ..(for dropdown)
app.post("/getidocdirectorydetails", routerpath.getIDOCdirectorydetails); //get idoc directory detail (for idoc to edi table)
app.post("/moveallidocfiles", routerpath.toMoveallidocfiles); //idoc Move all files ....(onclick idoc moveall button)
app.post("/moveoneidocfile", routerpath.toMoveoneidocfile); //idoc Move one file....(onclick idoc move button)

//940 files api
app.get("/get940filelist", routerpath.get940files); //get 940 file list form /edispace/
app.post("/moveone940file", routerpath.tomove940file);// on click move button for 940
app.post("/moveall940file", routerpath.tomoveall940file); // on move all button for 940

//Outbound TABLE api
app.get("/getoutbounddirectories", routerpath.getoutbounddirectories);//get outbound directories..(for dropdown)
app.post("/getoutbounddirectorydetails", routerpath.getoutbounddirectorydetail); //get outbound directory details...(for outbound table)
app.post("/movealloutboundfiles", routerpath.toMovealloutboundfiles); //  outbound moveall files(onclick moveall button)
app.post("/moveoneoutboundfile", routerpath.toMoveoneoutboundfile); // outbound move file (onclick move button)

//upload data csv to mongodb[ SALes, ndc , chargeback]
app.post("/uploadfile", routerpath.getencodeduploadfile);//get base64 value for (Sales,ndc,Chargeback)
app.post("/csvupload", routerpath.getcsvupload);//import data in MongoDB(sales,ndc,Chargeback)

//Cash app[ abc, cardinal, mckesson]
app.post('/cashappuploaddata', routerpath.getcashupload); // import the data for cash_application(ABC, Cardinal, Mckesson)

//for home page [orderdetail, chart upload, top ndc, top cust]
app.get('/orderdetail',routerpath.getorderdetail);

//top ndc customer and top 10 customer
app.get('/Toptencustomers', routerpath.getCustomers); // to get the top ten customer
app.get('/ndctable',routerpath.getndc);
app.post('/importbase',routerpath.importbase64)//for mongoDB





app.get('/importRxtplData', routerpath.getuploadrxtrpldata);// upload file, cahnge ISO formate, send the mail


app.get('/toptencust', routerpath.gettencust); //from mongoDB





// Create PORT
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log('Connected to port ' + PORT);
});

// Find 404 and hand over to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  console.error(err.message);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).send(err.message);
});

// app.use(function (err, req, res, next) {
//   console.error(err);
//   console.log(err);
//   if(newError){
//     console.log("*********Error connection",newError)
//     res.send("COnnection Error")
//   }
// });

