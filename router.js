const express = require("express");
let router = express.Router();
const ftp = require('basic-ftp');
var Client = require('ftp');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
var fs = require("fs");
const csvtojson = require('csvtojson');
const { MongoClient } = require('mongodb');
const ExcelJS = require('exceljs');
const csv = require('csv-parser');
const readline = require('readline');
const sftpClient = require('ssh2-sftp-client');
const { exec } = require('child_process');


const ftpconfig = require('../config_file/config');
const config = require('../config_file/config');
const configloacldb = require('../config_file/config');
const { json } = require("body-parser");
const { getServerPlatform } = require('../helper/helper');
const { getmailer } = require('../helper/mailer');
const header = require('../helper/standaredtemplate');
const query = require('../query_file/query');

const ftpServer = {
  host: ftpconfig.ftpserver.host,
  user: ftpconfig.ftpserver.user,
  password: ftpconfig.ftpserver.password,
  protocol: ftpconfig.ftpserver.protocol
};

const mysqlServer = {
  host: config.mysqldb.host,
  user: config.mysqldb.user,
  password: config.mysqldb.password,
  database: config.mysqldb.database
};


const mysqlServer_cashapp_server = {
  host: configloacldb.mysqlcashapp.host,
  user: configloacldb.mysqlcashapp.user,
  password: configloacldb.mysqlcashapp.password,
  database: configloacldb.mysqlcashapp.databasecashapp
};


const insertquery1 = query.mysqldb_query.insert;
const selectallQuery = query.mysqldb_query.selectAllcustomerQuery;
const selecttoptencustomer = query.mysqldb_query.selecttoptencustomer;
const selectndcQuery = query.mysqldb_query.selectndc;
const cardinaltruncate=query.mysqldb_query.cashappCardinalTruncate;
const cardinalinsert=query.mysqldb_query.cashappCardinalInsert;
const cardinalcount=query.mysqldb_query.cashappCardinalCount;

const abctruncate=query.mysqldb_query.cashappABCTruncate;
const abcinsert=query.mysqldb_query.cashappABCInsert;
const abccount=query.mysqldb_query.cashappABCCount;

const mcktruncate=query.mysqldb_query.cashappMckessonTruncate;
const mckinsert=query.mysqldb_query.cashappMckessonInsert;
const mckcount=query.mysqldb_query.cashappMckessonCount;

const mongodbname = config.mongodb.dbname;
const mongosalescollection = config.mongodb.collectionsales;
const mongoserver = config.mongodb.host;
const mongochargebackcollection = config.mongodb.collectionchargeback;
const mongondccollection = config.mongodb.collectionndc;
const mongoregistercollection = config.mongodb.collectionregister;
const mongoSalesReportCollection = config.mongodb.collectionSalesReport;
const mongorxtplsalescollection = config.mongodb.collectionrxtplsales;
const mongoordercollection = config.mongodb.collectionorderdetail;


const sales_html = header.Headerlist.sales_html;
const chargeback_html = header.Headerlist.chargeback_html;
const ndc_html = header.Headerlist.ndc_html;
const rxtpl_Sales_html=header.Headerlist.LifestarRxtpl_Sales_html;


function findDuplicates(arr) {
  return arr.filter((currentValue, currentIndex) =>
    arr.indexOf(currentValue) !== currentIndex);

}

// To get duplicate values from array
function findDuplicates1(arr) {
  return arr.map((e, _i, a) => a.filter(f => f === e).length)
    .reduce((p, c, i) => c === 1 ? p : p.concat(arr[i]), []);

}

function findDuplicatesFinal(arr) {
  return arr.filter((currentValue, currentIndex) =>
    arr.indexOf(currentValue) !== currentIndex + 1);
}


router.getstart = (_req, res) => {
  res.send("Welcome to node js");
}



//for registration
router.getregistration = async (req, res) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const email = req.body.email;
  const password = req.body.password;
  const confirmpassword = req.body.correctpassword;



  try {
    const client = new MongoClient(mongoserver);
    await client.connect();//try
    console.log('MongoDB connected successfully!');
    const db = client.db(mongodbname);
    const collectionName = mongoregistercollection;
    const collection = db.collection(collectionName);
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      console.log('Email already exists');
      res.send({
        "status": "404",
        "message": "Email already exists"
      });

    } else {

      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(firstname + lastname + email + password + confirmpassword);
      const newUser = {
        firstname,
        lastname,
        email,
        password: hashedPassword,
        confirmpassword,
      };
      console.log(newUser);
      try {
        const result = await collection.insertOne(newUser);
        console.log('User registered successfully' + result);
        res.send({
          "status": "200",
          "message": "User registered successfully"
        });

      } catch (error) {
        console.log('Failed to register user', error);
        res.send({
          "status": "500",
          "message": "Failed to register user"
        });
      }

    }
  } catch (err) {
    console.error('Failed to connect MongoDB:', err);
    res.send({
      "status": "500",
      "message": "Failed to connect MongoDB"
    });
  }

}



//code for login
router.getlogin = async (req, res) => {
  try {
    const client = new MongoClient(mongoserver);
    await client.connect();
    console.log('MongoDB connected successfully!');
    const db = client.db(mongodbname);
    const collectionName = mongoregistercollection;
    const collection = db.collection(collectionName);
    const email = req.body.email;
    const password = req.body.password;
    const user = await collection.findOne({ email });
    if (!user) {
      console.log('User not found');
      res.send({
        "status": "404",
        "message": "Invalid mail Id"
      });

    } else {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        console.log('Invalid password');
        res.send({
          "status": "404",
          "message": "Invalid password"
        });
      } else {
        console.log('Login successful');
        res.send({
          "status": "200",
          "message": "Login successful"
        });
      }
    }
  } catch (err) {
    console.error('Failed to connect MongoDB:', err);
    res.send({
      "status": "500",
      "message": "Failed to connect MongoDB"
    });
  }

}


// 940 list of file( for 940 table) sftp
router.get940files = async (req, res) =>{
  
  sourcePath = ftpconfig.ftpserver.edisapcePath;
  
   console.log("940 files Source path ",sourcePath)
     const sftp = new sftpClient();
  sftp.connect(ftpServer)
   .then(() => {
     return sftp.exists(sourcePath);
   })
   .then(async data => {
     const lists = await sftp.list(sourcePath);
       const files = lists.filter(item => item.type === '-' && item.name.startsWith("SHPORD"));
       totalFiles = files.length;
       console.log(`No.of 940 Files "-" in the  ${sourcePath} : ` + totalFiles);     
       if(totalFiles == 0){
         res.send({
           "status": "404",
           "message": "No files in this directory"
         });
       }else{
         const obj = [
           { "filepath": "edispace" },
           { "filedata": files },
           
         ];
         res.send(obj);
       }
   })
   
   .catch(err => {
     console.error(err.message);
   res.send({
           "status": "404",
           "message": err.message
         });
   });
   
  
  
  
  }
  
  // Move one 940 file from edispace (onclick 940 move) sftp
  router.tomove940file = async (req, res) => {
    const inputfilename =req.body.selectedfile;
    const source940filepath=req.body.selectedpath;
    console.log("940 file path and , file name :- ", source940filepath , "  :",inputfilename )
    //selectedpath,selectedfile
    // const inputfilename ="SHPORD_1010101.TXT";
  
      const sourcePath = ftpconfig.ftpserver.edisapcePath;    
      console.log("940 file Source Path : ",sourcePath  );  
      try {
        const sftp = new sftpClient();
        await sftp.connect(ftpServer);
      const lists = await sftp.list(sourcePath);   
      const fileExists = lists.some(file => file.name === inputfilename);
      if (fileExists) {
        console.log('File exists!');          
          const file = inputfilename;
      if (file.startsWith('SHPORD')) {
        console.log('"940"  file name   ' + inputfilename);
        try {
          const filePath = sourcePath + inputfilename;
          await sftp.chmod(filePath, 0o777); 
          console.log("Permission setup successfully:  ", inputfilename);
          try {
            const destinationcopypath=sourcePath+'940backup/'+inputfilename;
            await sftp.rcopy(filePath,destinationcopypath) ;  
            console.log("file copied sucessfully: ",inputfilename );
                try {
                  const destinationreame940path= ftpconfig.ftpserver.edispace940destinationpath + inputfilename;
                  console.log('940 file Destinationpath : ' , destinationreame940path)
                  await sftp.rename(filePath, destinationreame940path);
                  console.log("file moved successfully: ", inputfilename);
                  try {
                    const orderdate =new Date().toLocaleDateString();
                    orderInboundcount= 1;                                    
                    const client = new MongoClient(mongoserver);
                    await client.connect();
                    console.log('MongoDB connected successfully!');
                    const db = client.db(mongodbname);
                    const collectionName = mongoordercollection;
                    const collection = db.collection(collectionName);
                    console.log("Today DAte", orderdate , " Inbound Moved file count" , orderInboundcount);
                      const order = {
                        orderdate,
                        orderInboundcount,                                     
                      };
                      console.log(order);
                try {
                   const result = await collection.insertOne(order);
                   console.log("Order count updated IDOCTOEDI one MOVE...",orderInboundcount )
                } catch (error) {
                  console.log("exception upload order count in MongoDB",error);
                  console.log("File Moved count Does not stored in MongoDB")
                }
                   
                  } catch (err) {
                    console.error('Failed to connect MongoDB:', err);
                   console.log("File Moved count Does not stored in MongoDB")
                  }
                  res.send({
                            "status": "200",
                            "message": "File moved successfully..."
                          });
                } catch (error) {
                  console.log("Exception while moving file", error);
                  res.send({
                    "status": "400",
                    "message": error.message
                  });
                  
                }
  
          } catch (error) {
            console.log("Error while taking the backup... " + error);
  
            res.send({
              "status": "400",
              "message": error.message
            });
            
          }
                          
                          
             
        } catch (error) {
          console.log("Error while Change the Permission... " + error)
          res.send({
            "status": "400",
            "message":error.message
          });
         
        }
          
      } else{
        console.log("file is not a correct formate ")
        res.send({
          "status": "400",
          "message": "File name is not a correct format"
        });
      }
    }
    else{
        console.log("File not exsit");
        res.send({
          "status": "404",
          "message": "File not exsit"
        });
      }
    } catch (error) {
        console.log("Connection error", error);
        res.send({
          "status": "500",
          "message": "Connection is not there, Please check your VPN connection"
        });
  
    }
  
  }
  
  // Move all 940 files from edispace (onclick 940 moveall) sftp
  router.tomoveall940file = async (req, res) =>{
    const inputfoldername = req.body.filename;
        var movedfile=0;
      console.log("940 move all req. path is :", inputfoldername)
      // var folderPath = req.body.customername;
      sourcePath = ftpconfig.ftpserver.edisapcePath;  
      console.log("940 files Source path ",sourcePath)
      try {
        const sftp = new sftpClient();
        await sftp.connect(ftpServer);
        try {
          const lists = await sftp.list(sourcePath);
          const files = lists.filter(item => item.type === '-'&& item.name.startsWith("SHPORD"));
  
          totalFiles = files.length;
          console.log(`No.of 940 Files "-" in the  ${sourcePath} : ` + totalFiles);     
          if(totalFiles == 0){
            res.send({
              "status": "404",
              "message": "No files in this directory"
            });
          }else{
            console.log("list of 940 files:  ", files);
            const filenmaelist  = files.filter(entry => entry.type === '-').map(entry => entry.name);            
            for(i=0; i<totalFiles;i++){
              const inputfilename =filenmaelist[i];                      
                const sourcePath = ftpconfig.ftpserver.edisapcePath;    
                console.log("940 file Source Path : ",sourcePath  );  
                      
                  console.log('filename ',i ,":"  +inputfilename); 
                  try {
                    const filePath = sourcePath + inputfilename;
                    await sftp.chmod(filePath, 0o777); 
                    console.log("Permission setup successfully:  ", inputfilename);
                    try {
                      const destinationcopypath=sourcePath+'940backup/'+inputfilename;
                      await sftp.rcopy(filePath,destinationcopypath) ;  
                      console.log("file copied sucessfully: ",inputfilename );
                          try {
                            const destinationreame940path= ftpconfig.ftpserver.edispace940destinationpath + inputfilename;
                            console.log('940 file Destinationpath : ' , destinationreame940path)
                            await sftp.rename(filePath, destinationreame940path);
                            console.log("file moved successfully: ", inputfilename);
                            movedfile ++;
                            console.log("Moved file count is: ",movedfile , "  ,Total file count is ", totalFiles );
                            if(totalFiles == movedfile){
                              try {
                                const orderdate =new Date().toLocaleDateString();
                                orderInboundcount= movedfile;                                    
                                const client = new MongoClient(mongoserver);
                                await client.connect();
                                console.log('MongoDB connected successfully!');
                                const db = client.db(mongodbname);
                                const collectionName = mongoordercollection;
                                const collection = db.collection(collectionName);
                                console.log("Today DAte", orderdate , " Inbound Moved file count" , orderInboundcount);
                                  const order = {
                                    orderdate,
                                    orderInboundcount,                                     
                                  };
                                  console.log(order);
                            try {
                               const result = await collection.insertOne(order);
                               console.log("Order count updated IDOCTOEDI one MOVE...",orderInboundcount )
                            } catch (error) {
                              console.log("exception upload order count in MongoDB",error);
                              console.log("File Moved count Does not stored in MongoDB")
                            }
                               
                              } catch (err) {
                                console.error('Failed to connect MongoDB:', err);
                               console.log("File Moved count Does not stored in MongoDB")
                              }
                              res.send({
                                "status": "200",
                                "message": "All File moved successfully..."
                              });
                            }
                            
                          } catch (error) {
                            console.log("Exception while moving file", error);
                            res.send({
                              "status": "400",
                              "message": error.message
                            });
                            break
                            
                          }
            
                    } catch (error) {
                      console.log("Error while taking the backup... " + error);
            
                      res.send({
                        "status": "400",
                        "message": error.message
                      });
                      break
                      
                    }
                                    
                                    
                       
                  } catch (error) {
                    console.log("Error while Change the Permission... " + error)
                    res.send({
                      "status": "400",
                      "message":error.message
                    });
                    break
                   
                  }
                  
            } // for end here
  
          }
         
        } catch (error) {
          console.error('Error While listing the file:', error.message);
          res.send({
            "status": "404",
            "message": "Error listing files:"
          });
    
        }
        
      } catch (error) {
        console.error('Error Connection:', error.message);
        res.send({
          "status": "500",
          "message": "Connection is not Available Please Check VPN Connection"
        });
        
      }
   
  }
  
  //get directory list from edisapcePath..(for dropdown) sftp
  router.getIDOCdirectories = async (_req, res) => {
    
      sourcePath = ftpconfig.ftpserver.edisapcePath;
      const sftp = new sftpClient();
  sftp.connect(ftpServer)
    .then(() => {
      return sftp.exists(sourcePath);
    })
    .then(async data => {   
      const list = await sftp.list(sourcePath);
            const files = list.filter(item => item.type === 'd');
          console.log('List of files:', files);
         res.send(files);
  
    })  
    .catch(err => {
      console.error(err.message);
    res.send({
            "status": "404",
            "message": err.message
          });
    });
  
  
  }
  
  //get directory detail from edisapcePath...(for table) sftp
  router.getIDOCdirectorydetails = async (req, res) => { 
  
    var folderPath = req.body.customername;
    sourcePath = ftpconfig.ftpserver.edisapcePath + folderPath + '/';
  
    console.log(sourcePath)
      const sftp = new sftpClient();
  sftp.connect(ftpServer)
    .then(() => {
      return sftp.exists(sourcePath);
    })
    .then(async data => {
     const lists = await sftp.list(sourcePath);
        const files = lists.filter(item => item.type === '-');
        totalFiles = files.length;
        console.log(`No.of Files "-" in the  ${sourcePath} : ` + totalFiles);
        if(totalFiles == 0){
          res.send({
            "status": "404",
            "message": "No files in this directory"
          });
        }else{
          res.send(files);
        }
    })
    
    .catch(err => {
      console.error(err.message);
    res.send({
            "status": "404",
            "message": err.message
          });
    });
    
  }
  
  
  // Move single file from edisapcePath to edispacedestPath....(onclick move button) sftp server
  router.toMoveoneidocfile = async (req, res) => {
    const sftp = new sftpClient();
    var inputfoldername = req.body.customernamess;
    var inputfilename = req.body.movetofiles;  
    sourcePath = ftpconfig.ftpserver.edisapcePath + inputfoldername + '/';
    const destinationcopypath = sourcePath + 'backup/'+ inputfilename;
   const destinationreame810path= ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/810/' + inputfilename;
   const destinationreame880path= ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/880/' + inputfilename;
   const destinationreame849path= ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/849/' + inputfilename;
   const destinationreame856path= ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/856/' + inputfilename;
  
    const filePath = sourcePath + inputfilename;
  sftp.connect(ftpServer)
    .then(() => {
      return sftp.exists(sourcePath);
    })
    .then(async data => {
        const lists = await sftp.list(sourcePath);
      const fileExists = lists.some(file => file.name === inputfilename);
      if (fileExists) {
        console.log('File exists!');
       try {       
          const file = inputfilename;
          if (file.startsWith('INVOIC')) {
            console.log('"810"  file name   ' + inputfilename);
            try {
              await sftp.chmod(filePath, 0o777); 
              console.log("Permission setup successfully:  ", inputfilename);
              try {
                await sftp.rcopy(filePath,destinationcopypath) ;  
                console.log("file copied sucessfully: ",inputfilename );
                    try {
                        console.log("Customer name",inputfoldername)
                        if(inputfoldername == "KVAT" || inputfoldername == "HyVee"){
                                    await sftp.rename(filePath, destinationreame880path);
                                console.log("file moved successfully: ", inputfilename);
                                try {
                                  const orderdate =new Date().toLocaleDateString();
                                  orderInboundcount= 1;  
                                  // orderoutboundcount = 1;  
                                  const client = new MongoClient(mongoserver);
                                  await client.connect();
                                  console.log('MongoDB connected successfully!');
                                  const db = client.db(mongodbname);
                                  const collectionName = mongoordercollection;
                                  const collection = db.collection(collectionName);
                                  console.log("Today DAte", orderdate , " Inbound Moved file count" , orderInboundcount);
                                    const order = {
                                      orderdate,
                                      orderInboundcount,
                                      // orderoutboundcount
                                    };
                                    console.log(order);
                              try {
                                 const result = await collection.insertOne(order);
                                 console.log("Order count updated IDOCTOEDI one MOVE...",orderInboundcount )
                              } catch (error) {
                                console.log("exception upload order count in MongoDB",error);
                                console.log("File Moved count Does not stored in MongoDB")
                              }
                                 
                                } catch (err) {
                                  console.error('Failed to connect MongoDB:', err);
                                 console.log("File Moved count Does not stored in MongoDB")
                                }
                                res.send({
                                          "status": "200",
                                          "message": "File moved successfully..."
                                        });
  
                        }else{
                                  await sftp.rename(filePath, destinationreame810path);
                                  console.log("file moved successfully: ", inputfilename);
                                  try {
                                    const orderdate =new Date().toLocaleDateString();
                                    orderInboundcount= 1;                                    
                                    const client = new MongoClient(mongoserver);
                                    await client.connect();
                                    console.log('MongoDB connected successfully!');
                                    const db = client.db(mongodbname);
                                    const collectionName = mongoordercollection;
                                    const collection = db.collection(collectionName);
                                    console.log("Today DAte", orderdate , " Inbound Moved file count" , orderInboundcount);
                                      const order = {
                                        orderdate,
                                        orderInboundcount,                                     
                                      };
                                      console.log(order);
                                try {
                                   const result = await collection.insertOne(order);
                                   console.log("Order count updated IDOCTOEDI one MOVE...",orderInboundcount )
                                } catch (error) {
                                  console.log("exception upload order count in MongoDB",error);
                                  console.log("File Moved count Does not stored in MongoDB")
                                }
                                   
                                  } catch (err) {
                                    console.error('Failed to connect MongoDB:', err);
                                   console.log("File Moved count Does not stored in MongoDB")
                                  }
                                  res.send({
                                            "status": "200",
                                            "message": "File moved successfully..."
                                          });
                        }
                    } catch (error) {
                      console.log("Exception while moving file", error);
                      res.send({
                        "status": "400",
                        "message": error.message
                      });
                      
                    }
  
              } catch (error) {
                console.log("Error while taking the backup... " + error);
  
                res.send({
                  "status": "400",
                  "message": error.message
                });
                
              }
                              
                              
                 
            } catch (error) {
              console.log("Error while Change the Permission... " + error)
              res.send({
                "status": "400",
                "message":error.message
              });
             
            }
              
          } else if (file.startsWith('DESADV')) {
            console.log('File starts with "856" --->  ' + inputfilename);
            try {
              await sftp.chmod(filePath, 0o777); 
              console.log("Permission setup successfully");
              try {
                await sftp.rcopy(filePath,destinationcopypath) ;  
                console.log("file copied sucessfully");
                    try {
                      await sftp.rename(filePath, destinationreame856path);
                      console.log("file moved successfully");
                      try {
                        const orderdate =new Date().toLocaleDateString();
                        orderInboundcount= 1;  
                        // orderoutboundcount = 1;  
                        const client = new MongoClient(mongoserver);
                        await client.connect();
                        console.log('MongoDB connected successfully!');
                        const db = client.db(mongodbname);
                        const collectionName = mongoordercollection;
                        const collection = db.collection(collectionName);
                        console.log("Today DAte", orderdate , " Inbound Moved file count" , orderInboundcount);
                          const order = {
                            orderdate,
                            orderInboundcount,                          
                          };
                          console.log(order);
                                  try {
                                    const result = await collection.insertOne(order);
                                    console.log("Order count updated IDOCTOEDI one MOVE...",orderInboundcount )
                                  } catch (error) {
                                    console.log("exception upload order count in MongoDB",error);
                                    console.log("File Moved count Does not stored in MongoDB")
                                  }
                       
                      } catch (err) {
                        console.error('Failed to connect MongoDB:', err);
                       console.log("File Moved count Does not stored in MongoDB")
                      }
                      res.send({
                                "status": "200",
                                "message": "File moved successfully..."
                              });
                    } catch (error) {
                      res.send({
                        "status": "400",
                        "message": error.message
                      });
                      
                    }
  
              } catch (error) {
                console.log("Error while taking the backup... " + error)
                res.send({
                  "status": "400",
                  "message": error.message
                });
                
              }
                         
                              
            } catch (error) {
              console.log("Error while Change the Permission... " + error)
              res.send({
                "status": "400",
                "message": error.message
              });            
            }
          } else if (file.startsWith('ZRECCBKOUT')) {
            console.log('File starts with "849"     ' + inputfilename);
            try {
              await sftp.chmod(filePath, 0o777); 
              console.log("Permission setup successfully");
              try {
                await sftp.rcopy(filePath,destinationcopypath) ;  
                console.log("file copied sucessfully");
                    try {
                      await sftp.rename(filePath, destinationreame849path);
                      console.log("file moved successfully");
                      try {
                        const orderdate =new Date().toLocaleDateString();
                        orderInboundcount= 1;                        
                        const client = new MongoClient(mongoserver);
                        await client.connect();
                        console.log('MongoDB connected successfully!');
                        const db = client.db(mongodbname);
                        const collectionName = mongoordercollection;
                        const collection = db.collection(collectionName);
                        console.log("Today DAte", orderdate , " Inbound Moved file count" , orderInboundcount);
                          const order = {
                            orderdate,
                            orderInboundcount,                         
                          };
                          console.log(order);
                    try {
                       const result = await collection.insertOne(order);
                       console.log("Order count updated IDOCTOEDI one MOVE...",orderInboundcount )
                    } catch (error) {
                      console.log("exception upload order count in MongoDB",error);
                      console.log("File Moved count Does not stored in MongoDB")
                    }
                       
                      } catch (err) {
                        console.error('Failed to connect MongoDB:', err);
                       console.log("File Moved count Does not stored in MongoDB")
                      }
                      res.send({
                                "status": "200",
                                "message": "File moved successfully..."
                              });
                    } catch (error) {
                      
                      res.send({
                        "status": "400",
                        "message": error.message
                      });
                     
                    }
  
              } catch (error) {
                console.log("Error while taking the backup... " + error)
                sftp.end();
                res.send({
                  "status": "400",
                  "message": error.message
                });
                
                
              }
                              
                             
            } catch (error) {
              console.log("Error while Change the Permission... " + error)
              sftp.end();
              res.send({
                "status": "400",
                "message":error.message
              });
              
            }
          }else{
            console.log("File Name is not correct")
            res.send({
              "status": "400",
              "message": "File Name is not correct"  });
  
          }
        } catch (error) {       
          res.send({
            "status": "404",
            "message": error.message
          });
        }
      }else{
        console.log("File not exsit");
         res.send({
        "status": "404",
        "message": "File does not exists in this directory..Please try Again..."
      });
      }
      
      
    })
    
    .catch(err => {
      console.error(err.message);
    res.send({
            "status": "404",
            "message": err.message
          });
    });
    
    
    
    
  }
  
  // Move all file from edisapcePath to edispacedestPath....(onclick moveall button) sftp
  router.toMoveallidocfiles= async (req, res) => {
    const sftp = new sftpClient();
    const inputfoldername = req.body.movetodirectory;  
    console.log("Parameter of moveall" ,inputfoldername )
    const sourcePath = ftpconfig.ftpserver.edisapcePath + inputfoldername + '/';  
    console.log("Source Path of Moveall IDOCTOEDI", sourcePath );
  sftp.connect(ftpServer)
    .then(() => {
      return sftp.exists(sourcePath);
    })
    .then(async data => {
      try {
          const list = await sftp.list(sourcePath);
          const directories = list.filter(entry => entry.type === 'd').map(entry => entry.name);
          const files = list.filter(entry => entry.type === '-').map(entry => entry.name);
          console.log('Move all file customer name',inputfoldername );
          var totalFiles=files.length;
          var movedfile = 0;
          console.log(`Number of files in the edispace directory: `, inputfoldername , ' : ',totalFiles);
         if(files.length == 0){
          res.send({
            "status": "404",
            "message":"No files in this directory"
          });
         }else{
         for(i=0; i<totalFiles;i++){
            const inputfilename = files[i];
            console.log('filename ',i ,":"  +files[i] );
            const filePath = sourcePath + inputfilename;
            const destinationcopypath = sourcePath + 'backup/'+ inputfilename;
            const destinationreame810path= ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/810/' + inputfilename;
            const destinationreame880path= ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/880/' + inputfilename;
            const destinationreame849path= ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/849/' + inputfilename;
            const destinationreame856path= ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/856/' + inputfilename;
            if (inputfilename.startsWith('INVOIC')) {
              console.log('"810"  file name --->  ' + inputfilename);
              try {
                await sftp.chmod(filePath, 0o777); 
                console.log(inputfilename ," === Permission setup successfully");
                try {
                  await sftp.rcopy(filePath,destinationcopypath) ;  
                  console.log(inputfilename ," --- file copied sucessfully");
                      try {
                        console.log("Customer Name : ", inputfoldername)
                        if(inputfoldername == "KVAT" || inputfoldername == "HyVee"){
                          await sftp.rename(filePath, destinationreame880path);
                          console.log(inputfilename , " ... file moved successfully");
                          movedfile++
                        }else{
                              await sftp.rename(filePath, destinationreame810path);
                              console.log(inputfilename , " ... file moved successfully");
                              movedfile++
                        }
                        
                      } catch (error) {
                        console.log("Exception while moving file", error);
                        
                        res.send({
                          "status": "400",
                          "message": "Please try Again...File not moved"
                        });
                        break
                      }
    
  
                } catch (error) {
                  console.log("Error while taking the backup... " + error);
                  
                  res.send({
                    "status": "400",
                    "message":error.message
                  });
                  break 
                }
                                
                                
                   
              } catch (error) {
                console.log("Error while Change the Permission... " + error)
                res.send({
                  "status": "400",
                  "message": error.message
                });
                break
              }
                
              } else if (inputfilename.startsWith('DESADV')) {
              console.log('File starts with "856" --->  ' + inputfilename);
              try {
                await sftp.chmod(filePath, 0o777); 
                console.log(inputfilename ," === Permission setup successfully");
                try {
                  await sftp.rcopy(filePath,destinationcopypath) ;  
                  console.log(inputfilename ," --- file copied sucessfully");
                      try {
                        await sftp.rename(filePath, destinationreame856path);
                        console.log(inputfilename ," ... file moved successfully");
                        movedfile++
                      } catch (error) {
                        res.send({
                          "status": "400",
                          "message": error.message
                        });
                        break
                      }
    
                } catch (error) {
                  console.log("Error while taking the backup... " + error)
                  res.send({
                    "status": "400",
                    "message": error.message
                  });
                  break
                }
                                
                              
              } catch (error) {
                console.log("Error while Change the Permission... " + error)
                res.send({
                  "status": "400",
                  "message": error.message
                });
                break
              }
            } else if (inputfilename.startsWith('ZRECCBKOUT')) {
              console.log('File starts with "849" --->    ' + inputfilename);
              try {
                await sftp.chmod(filePath, 0o777); 
                console.log(inputfilename, " === Permission setup successfully");
                try {
                  await sftp.rcopy(filePath,destinationcopypath) ;  
                  console.log(inputfilename, " --- file copied sucessfully");
                      try {
                        await sftp.rename(filePath, destinationreame849path);
                        console.log(inputfilename ,"... file moved successfully");
                        movedfile++
                      } catch (error) {                      
                        res.send({
                          "status": "400",
                          "message": error.meassage
                        });
                        break
                      }
    
                } catch (error) {
                  console.log("Error while taking the backup... " + error)
                  
                  res.send({
                    "status": "400",
                    "message": error.message
                  });
                  break
                }                          
                                
    
                                
                                
              } catch (error) {
                console.log("Error while Change the Permission... " + error)
                
                res.send({
                  "status": "400",
                  "message": "Exception while Change the Permission"
                });
                break
              }
            }else{
              console.log(inputfilename ,"  - File Name is not correct")
              movedfile++
    
            }
  
            if(movedfile == totalFiles){
              console.log("Move file count:", movedfile , " , Total number of file: ",totalFiles )
              try {
                const orderdate =new Date().toLocaleDateString();
                orderInboundcount= movedfile;                                    
                const client = new MongoClient(mongoserver);
                await client.connect();
                console.log('MongoDB connected successfully!');
                const db = client.db(mongodbname);
                const collectionName = mongoordercollection;
                const collection = db.collection(collectionName);
                console.log("Today DAte", orderdate , " Inbound Moved file count" , orderInboundcount);
                  const order = {
                    orderdate,
                    orderInboundcount,                                     
                  };
                  console.log(order);
            try {
               const result = await collection.insertOne(order);
               console.log("Order count updated IDOCTOEDI one MOVE...",orderInboundcount )
            } catch (error) {
              console.log("exception upload order count in MongoDB",error);
              console.log("File Moved count Does not stored in MongoDB")
            }
               
              } catch (err) {
                console.error('Failed to connect MongoDB:', err);
               console.log("File Moved count Does not stored in MongoDB")
              }
                          res.send({
                            "status": "200",
                          "message": "All File moved sucessfully:"
                          })
  
                        }
          }
  
         
  
         }
        
          
         
        } catch (error) {
          console.error('Error While listing the file:', error.message);
          res.send({
            "status": "404",
            "message": "Error listing files:"
          });
    
        }
    })
    
    .catch(err => {
      console.error(err.message);
    res.send({
            "status": "404",
            "message": err.message
          });
    });
    
    
                   
  }
  
  //get directory list from outboundsrcPath..(for dropdown) sftp
  router.getoutbounddirectories = async (_req, res) => {
    const sftp = new sftpClient();
   sourcePath = ftpconfig.ftpserver.outboundsrcPath;
  sftp.connect(ftpServer)
    .then(() => {
      return sftp.exists(sourcePath);
    })
    .then(async data => {
        const list = await sftp.list(sourcePath);
        const files = list.filter(item => item.type === 'd');
        console.log('List of files:', files);
       res.send(files);
            
      
    })
    
    .catch(err => {
      console.error(err.message);
    res.send({
            "status": "404",
            "message": err.message
          });
    });
    
    
    
  
  
  }
  
  
  //get directory detail from outboundsrcPath...(for table) sftp
  router.getoutbounddirectorydetail = async (req, res) => {
    const sftp = new sftpClient();
    var folderPath = req.body.outcustomername;
    sourcePath = ftpconfig.ftpserver.outboundsrcPath + folderPath + '/'
    console.log("Outbound SourcePath:  " + sourcePath);
  
  sftp.connect(ftpServer)
  .then(() => {
    return sftp.exists(sourcePath);
  })
  .then(async data => {
     const list = await sftp.list(sourcePath);
        const files = list.filter(item => item.type === '-');
        totalFiles = files.length;
      console.log(`No.of Files "-" in the  ${sourcePath} : ` + totalFiles);
      if(totalFiles == 0){
        res.send({
          "status": "404",
          "message": "No files in this directory"
        });
      }else{
        res.send(files);
      }
          
    
  })
  
  .catch(err => {
    console.error(err.message);
  res.send({
          "status": "404",
          "message": err.message
        });
  });
  
   
  }
  
  
  
  //  Move all file from outboundsrcPath to outboundsrcPath/----/Outbound....(for moveall) sftp
  router.toMovealloutboundfiles = async (req, res) => {
    const sftp = new sftpClient();
    var folderPath = req.body.moveouttodirectory;
    const sourceDirectory = ftpconfig.ftpserver.outboundsrcPath + folderPath + '/';;
    const destinationDirectory = ftpconfig.ftpserver.outboundsrcPath + folderPath + '/backup/';
    const renamedSourceDirectory = ftpconfig.ftpserver.outboundsrcPath + folderPath + '/outbound/';
    let filemoved = 0;
    console.log("Out bound move all customer name", folderPath)
    console.log("sourceDirectory:  ", sourceDirectory)
  sftp.connect(ftpServer)
    .then(() => {
      return sftp.exists(sourceDirectory);
    })
    .then(async data => {
      console.log("sourceDirectory:  ", sourceDirectory)
        const list = await sftp.list(sourceDirectory);
       const files= list.filter(entry => entry.type === '-').map(entry => entry.name);
             const totalFiles = files.length;
              console.log("Total number files from the directory:", folderPath , ": ",totalFiles )
              if (totalFiles == 0) {
                res.send({
                  "status": "404",
                  "message": "There is no file in the Directory.."
                });
              } else {            
               
               for(i=0 ; i< totalFiles; i++) {
                const filename=files[i];
                  const sourceFile = sourceDirectory + filename;
                  const destinationFile = destinationDirectory + filename;
                 try{
                    console.log("File Name : ", i , ": " ,filename);
                    await sftp.rcopy(sourceFile,destinationFile);
                    try {
                      const sourcemoveFile = sourceDirectory + filename;
                      const destinationmoveFile = renamedSourceDirectory + filename;
                      await sftp.rename(sourcemoveFile, destinationmoveFile);
                      filemoved++;
                      console.log("total move file length" + totalFiles + "total moved file length" + filemoved);
  
                      if (filemoved == totalFiles) {
                        console.log('All files moved successfully.');
                        try {
                          const orderdate =new Date().toLocaleDateString();
                          
                          orderoutboundcount = filemoved;  
                          const client = new MongoClient(mongoserver);
                          await client.connect();
                          console.log('MongoDB connected successfully!');
                          const db = client.db(mongodbname);
                          const collectionName = mongoordercollection;
                          const collection = db.collection(collectionName);
                          console.log("Today DAte", orderdate , " Inbound Moved file count" , orderoutboundcount);
                            const order = {
                              orderdate,                           
                              orderoutboundcount
                            };
                            console.log(order);
                      try {
                         const result = await collection.insertOne(order);
                         console.log("Order count updated OUTBOUNT one MOVE...",orderoutboundcount )
                      } catch (error) {
                        console.log("exception upload order count in MongoDB",error);
                        console.log("File Moved count Does not stored in MongoDB")
                      }
                         
                        } catch (err) {
                          console.error('Failed to connect MongoDB:', err);
                         console.log("File Moved count Does not stored in MongoDB")
                        }
                        res.send({
                          "status": "200",
                          "message": "All files moved successfully"
                        });
                       }
                    } catch (error) {
                      console.log("Error while moving the file", error)
                  res.send({
                    "status": "404",
                    "message": error.message
                  });
                  break
                      
                    }
  
  
                } catch (error) {
                  console.log("Error while taking backup", error)
                  res.send({
                    "status": "404",
                    "message": error.message
                  });
                  break
                }
  
                } //for end
              }
  
            
      
    })
    
    .catch(err => {
      console.error(err.message);
    res.send({
            "status": "404",
            "message": err.message
          });
    });
    
    
  }
  
  
  
  // Move single file from outboundsrcPath to outboundsrcPath/----/Outbound....(for move) sftp
  router.toMoveoneoutboundfile = async (req, res) => {
    const sftp = new sftpClient();
    var inputfoldername = req.body.outcustomernamess;
    var inputfilename = req.body.moveouttofiles;
    const sourcePath = ftpconfig.ftpserver.outboundsrcPath + inputfoldername + '/';
    const destinationFilePath = ftpconfig.ftpserver.outboundsrcPath + inputfoldername + '/backup/';
    
  sftp.connect(ftpServer)
    .then(() => {
      return sftp.exists(sourcePath);
    })
    .then(async data => {
        const lists = await sftp.list(sourcePath);
      const fileExists = lists.some(file => file.name === inputfilename);
      if (fileExists) {
        console.log('File exists!');
        try {
          const  filePath=  sourcePath + inputfilename;
          destinationcopypath=destinationFilePath+inputfilename;
          await sftp.rcopy(filePath,destinationcopypath) ;  
          console.log("file copied sucessfully");
              try {
             const destinationreamepath=sourcePath + 'outbound/' + inputfilename
                await sftp.rename(filePath, destinationreamepath);
                console.log("file moved successfully");
                try {
                  const orderdate =new Date().toLocaleDateString();
                  
                  orderoutboundcount = 1;  
                  const client = new MongoClient(mongoserver);
                  await client.connect();
                  console.log('MongoDB connected successfully!');
                  const db = client.db(mongodbname);
                  const collectionName = mongoordercollection;
                  const collection = db.collection(collectionName);
                  console.log("Today DAte", orderdate , " Inbound Moved file count" , orderoutboundcount);
                    const order = {
                      orderdate,
                      // orderInboundcount,
                      orderoutboundcount
                    };
                    console.log(order);
              try {
                 const result = await collection.insertOne(order);
                 console.log("Order count updated OUTBOUNT one MOVE...",orderoutboundcount )
              } catch (error) {
                console.log("exception upload order count in MongoDB",error);
                console.log("File Moved count Does not stored in MongoDB")
              }
                 
                } catch (err) {
                  console.error('Failed to connect MongoDB:', err);
                 console.log("File Moved count Does not stored in MongoDB")
                }
                res.send({
                          "status": "200",
                          "message": "File moved successfully..."
                        });
              } catch (error) {
                console.log("Exception while moving file", error)
                res.send({
                  "status": "400",
                  "message": error.message
                });
              }
  
        } catch (error) {
          console.log("Error while taking the backup... " + error)
          sftp.end();
          res.send({
            "status": "400",
            "message": error.message
          });
        }
  
  
      }else{
        console.log("File not exsit");
        res.send({
       "status": "404",
       "message": "File does not exists in this directory..Please try Again..."
     });
      }
    
  
    })
    
    .catch(err => {
      console.error(err.message);
    res.send({
            "status": "404",
            "message": err.message
          });
    });
    
    
    
    
  }
  
  


router.getapi = (_req, res) => {
  res.end('File catcher');
}


//POST FILE
router.getpostfile = (req, res) => {
  if (!req.file) {
    console.log("No file is available!");
    return res.send({
      success: false
    });

  } else {
    console.log('File is available!');
    return res.send({
      success: true
    })
  }
}


router.getuploadfile = (req, res) => {
  var outputFileName = "out.txt";
  var inputData = []
  console.log(req.body);
  inputData = req.body.value;
  // res.end();
  console.log(inputData);
  var substring = "N9*LI*";
  var lineArr = [];
  var duplicate_Value;
  for (var i = 0; i < inputData.length; i++) {
    if (inputData[i].includes(substring)) {
      lineNumber = inputData[i].split("*");
      lineArr.push(lineNumber[2]);
      // To get the duplicate values from array.
      duplicate_Value = findDuplicates(lineArr);
    }
  }
  // If there are no duplicate line number with file it will exit 
  if (duplicate_Value == '') {
    var file = fs.createWriteStream(outputFileName);
    file.on('error', function (_err) { /* error handling */ });
    inputData.forEach(function (v) { file.write(v + '\n'); });
    file.end();
    console.log("This file doesn't have any duplicates with line number...!")
    return;
  }

  var quantitySum = 0;
  for (var i = 0; i < inputData.length; i++) {
    if (inputData[i].includes(substring)) {
      lineNumberNew = inputData[i].split("*");
      if (duplicate_Value[1] == lineNumberNew[2]) {
        quantity = inputData[i - 1].split("**");
        ndc = inputData[i - 1].split("*");
        console.log("ndc number", ndc[8]);
        var number = parseInt(quantity[1]);
        quantitySum += number;
        console.log(quantitySum);
        // To update the line
        inputData[i - 1] = "W12*CC**" + `${quantitySum}` + "**EA**ND*" + `${ndc[8]}`;
      }
    }
  }

  // To remove the duplicates
  var finalarray = [];
  finalarray = inputData;
  var finalLineNumberArr = [];
  for (var i = 0; i < finalarray.length; i++) {
    if (finalarray[i].includes(substring)) {
      finalLineNumberArr.push(finalarray[i]);
      var duplicateLinenumbers11 = findDuplicates1(finalLineNumberArr);
      console.log("#######", duplicateLinenumbers11);
      const index = finalarray.indexOf(finalarray[i]);
      console.log("index is ", index);
      console.log(finalarray[i]);
      console.log(duplicateLinenumbers11[0]);
      if (finalarray[i] == duplicateLinenumbers11[0]) {
        var x = finalarray.splice(index - 1, 6);
      }
    }

  }

  var file = fs.createWriteStream(outputFileName);
  file.on('error', function (_err) { /* error handling */ });
  finalarray.forEach(function (v) { file.write(v + '\n'); });
  file.end();


  res.send({
    "status": "200",
    "message": "New file created successfully."
  });


}


router.getdownload = (_req, res) => {
  // const file = `${__dirname}/out.txt`;
  const file = `out.txt`;
  res.download(file); // Set disposition and send it.
}



router.getorderdetail =async(req, res)=>{
  try {
    const specificdate =new Date().toLocaleDateString();    
    const client = new MongoClient(mongoserver);
    await client.connect();
    console.log('MongoDB connected successfully!');
    const db = client.db(mongodbname);
    const collectionName = mongoordercollection;
    const collection = db.collection(collectionName);
    console.log("DATE.....", specificdate);
try { 

      const result =await collection.aggregate([
        {
          $match: {
            orderdate: specificdate
          }
        },
        {
          $group: {
            _id: {
              Orderdate: "$orderdate",              
            },
            orderInboundcount: {
              $sum: "$orderInboundcount"
            },
            orderOutboundcount: {
              $sum: "$orderoutboundcount"
            },
           
          }
        },
        {
          $sort: {
            "_id.todaydate": 1,
           
          }
        }
        
      ])
      .toArray();
      console.log("Orderdetail...", result);
      res.send(result);
    } catch (error) {
      console.error('Exceprion getting data', err);
      res.send({
        "status": "500",
        "message": err.meassage
      });
    }


  } catch (err) {
    console.error('Failed to connect MongoDB:', err);
    res.send({
      "status": "500",
      "message": "Failed to connect MongoDB"
    });
  }

}

// import the data for cash_application(ABC, Cardinal, Mckesson)
router.getcashupload =async (req, res) => {
  const typeofcustomer = req.body.Typeofcustomername;
  const base64Data =req.body.base64;
  const outputPath = 'result.csv';
  async function base64ToCsv(base64Data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const buffer = Buffer.from(base64Data, 'base64');
    try {
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      const rows = [];
      worksheet.eachRow((row, _rowNumber) => {
        const rowData = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          rowData.push(cell.value);
        });
        rows.push(rowData);
      });
      const csvString = rows.map(row_1 => row_1.join(',')).join('\n');
      fs.writeFileSync(outputPath, csvString, 'utf8');
      console.log('result.CSV file generated:', outputPath);
      if(typeofcustomer == 'ABC'){
        console.log("Customer name", typeofcustomer);      
        // const connection = mysql.createConnection(mysqlServer_cashapp);  
        const connection = mysql.createConnection(mysqlServer_cashapp_server);  
        connection.connect(function(err) {        
        
          if(err){
            console.log("Database not connected"+err);
            res.send({
              status: '500',
              message: 'Database not connected',
            });
          }
          else{
          console.log("Database Connected!");    
          const fileName = "result.csv"; //csv filename
          
          csvtojson().fromFile(fileName).then(async source => { 
            try{     
              droptablequery=abctruncate;
            connection.query(droptablequery ,
              (err, _results, _fields) => {
          
              if (err) {
                  console.log("not turncate ", err);
                  res.send({
                    status: '400',
                    message: 'Table Not Turncate...',
                  });
              
              } else{
                console.log("Table turncated ");   
       
            //  console.log("Total no of line items",source.length);
             var j=0,k=0;
              for (var i = 0; i < source.length; i++) {
                 var CUSTOMER_CODE = source[i]["Account"],
                 REFERENCE =source[i]["Reference"],
                 DOCUMENT_NUMBER=source[i]["Document Number"],
                 ASSIGNMENT=source[i]["Assignment"],
                 DOCUMENT_TYPE=source[i]["Document type"],
                 AMOUNT_IN_LOCAL_CURRENCY=source[i]["Amount in Local Currency"],
                 CURRENCY=source[i]["Local Currency"],
                 TEXT=source[i]["Text"]                   
                    
                 
                  var items = [CUSTOMER_CODE,REFERENCE,DOCUMENT_NUMBER,ASSIGNMENT,DOCUMENT_TYPE,AMOUNT_IN_LOCAL_CURRENCY,CURRENCY,TEXT];                 
                  // console.log("Data",items);
                 
                  insertStatementquery =abcinsert;
                connection.query(insertStatementquery, items,
                  (err, _results, _fields) => {
                    if (err) {
                      k++;
                      console.log("Unable to insert item at row ", k);                     
                      // res.send({
                      //   status: '500',
                      //   message: 'ALL data imported successlfuly',
                      // });
                    }
                    else {
                     
                      j++;
                      console.log("imported line itme: ",j , "     ABC  Number of line item:",source.length);
                      if(j == source.length){
                        console.log("ALL data upload successlfuly");
                        res.send({
                          status: '200',
                          message: 'ALL data imported successlfuly',
                        });
                      countquery=abccount;
                      connection.query(countquery, (err, rows , result) => {
                        
                        if(err) {
                          console.log(err);
                        }else{                       
                        console.log(result);
                        
                        
                      }
                    });
                  }
                    }
      
                  }); 
                
                    
              }  
             
             
          }
        });
          }catch(err){
            console.log("Exception while Truncate the table"+ err);
            res.send({
              status: '400',
              message: 'Exception while Truncate the table',
            });

             }       
             
            })
          }
          
        })
    
      }else if(typeofcustomer == 'Cardinal'){
        console.log("Customer name", typeofcustomer);
        // const connection = mysql.createConnection(mysqlServer_cashapp); 
        const connection = mysql.createConnection(mysqlServer_cashapp_server);   
        connection.connect(function(err) {        
        
          if(err){
            console.log("Database not connected"+err);
            res.send({
              status: '500',
              message: 'Database not connected',
            });
          }
          else{
          console.log("Database Connected!");    
          const fileName = "result.csv"; //csv filename
          
          csvtojson().fromFile(fileName).then(async source => { 
            try{     
              droptablequery=cardinaltruncate;
            connection.query(droptablequery ,
              (err, _results, _fields) => {
          
              if (err) {
                  console.log("not turncate ", err);
                  res.send({
                    status: '400',
                    message: 'Table Not Turncate...',
                  });
              
              } else{
                console.log("Table turncated ");   
       
             console.log("Total no of line items",source.length);
             var j=0,k=0;
              for (var i = 0; i < source.length; i++) {
                 var CUSTOMER_CODE = source[i]["Account"],
                 REFERENCE =source[i]["Reference"],
                 DOCUMENT_NUMBER=source[i]["Document Number"],
                 ASSIGNMENT=source[i]["Assignment"],
                 DOCUMENT_TYPE=source[i]["Document type"],
                 AMOUNT_IN_LOCAL_CURRENCY=source[i]["Amount in Local Currency"],
                 CURRENCY=source[i]["Local Currency"],
                 TEXT=source[i]["Text"]                   
                    
                 
                  var items = [CUSTOMER_CODE,REFERENCE,DOCUMENT_NUMBER,ASSIGNMENT,DOCUMENT_TYPE,AMOUNT_IN_LOCAL_CURRENCY,CURRENCY,TEXT];                 
                  // console.log("Data",items);
                 
                  insertStatementquery =cardinalinsert;
                connection.query(insertStatementquery, items,
                  (err, _results, _fields) => {
                    if (err) {
                      k++;
                      console.log("Unable to insert item at row ", k);
                      return ;
                    }
                    else {
                      // console.log("Able to insert item at row ", i);
                      j++;
                      console.log("imported line itme",j+ "Cardinal Number of line item",source.length);
                      if(j == source.length){
                        console.log("ALL data upload successfully");
                        countquery=cardinalcount;
                        connection.query(countquery, (err, rows , result) => {
                          
                          if(err) {
                            console.log(err);
                          }else{                         
                          console.log(result);
                          res.send({
                            status: '500',
                            message: 'ALL data imported successlfuly',
                          });
                          
                        }
                      });

                      }
                    }
      
                  }); 
                
                    
              }  
              
             
          }
        });
          }catch(err){
            console.log("Exception while Truncate the table"+ err);
            res.send({
              status: '400',
              message: 'Exception while Truncate the table',
            });
             }       
             
            })
          }
          
        })
    
      }else if(typeofcustomer == 'Mckesson'){
        console.log("Customer Name", typeofcustomer);
        // const connection = mysql.createConnection(mysqlServer_cashapp);  
        const connection = mysql.createConnection(mysqlServer_cashapp_server);  
        connection.connect(function(err) {        
        
          if(err){
            console.log("Database not connected"+err);
            res.send({
              status: '500',
              message: 'Database not connected',
            });
          }
          else{
          console.log("Database Connected!");    
          const fileName = "result.csv"; //csv filename
          
          csvtojson().fromFile(fileName).then(async source => { 
            try{     
              droptablequery=mcktruncate;
            connection.query(droptablequery ,
              (err, _results, _fields) => {
          
              if (err) {
                  console.log("not turncate ", err);
                  res.send({
                    status: '400',
                    message: 'Table Not Turncate...',
                  });
              
              } else{
                console.log("Table turncated ");   
       
             console.log("Total no of line items",source.length);
             var j=0,k=0;
              for (var i = 0; i < source.length; i++) {
                 var CUSTOMER_CODE = source[i]["Account"],
                 REFERENCE =source[i]["Reference"],
                 DOCUMENT_NUMBER=source[i]["Document Number"],
                 ASSIGNMENT=source[i]["Assignment"],
                 DOCUMENT_TYPE=source[i]["Document type"],
                 AMOUNT_IN_LOCAL_CURRENCY=source[i]["Amount in Local Currency"],
                 CURRENCY=source[i]["Local Currency"],
                 TEXT=source[i]["Text"]                   
                    
                 
                  var items = [CUSTOMER_CODE,REFERENCE,DOCUMENT_NUMBER,ASSIGNMENT,DOCUMENT_TYPE,AMOUNT_IN_LOCAL_CURRENCY,CURRENCY,TEXT];                 
                  // console.log("Data",items);
                 
                  insertStatementquery =mckinsert;
                connection.query(insertStatementquery, items,
                  (err, _results, _fields) => {
                    if (err) {
                      k++;
                      console.log("Unable to insert item at row ", k);
                      return ;
                    }
                    else {
                      // console.log("Able to insert item at row ", i);
                      j++;
                      console.log("imported line item: ",j+ "   Mckesson total Number of line item:",source.length);
                      if(j == source.length){
                        console.log("ALL data upload successfully");
                        res.send({
                          status: '200',
                          message: 'ALL data imported successlfuly',
                        });
                        countquery=mckcount;
                        connection.query(countquery, (err, rows , result) => {
                          
                          if(err) {
                            console.log(err);
                          }else{                         
                          console.log(result);
                         
                          
                        }
                      });

                      }
                    }
      
                  }); 
                
                    
              }  
              
             
          }
        });
          }catch(err){
            console.log("Exception while Truncate the table"+ err);
            res.send({
              status: '400',
              message: 'Exception while Truncate the table',
            });
             }       
             
            })
          }
          
        })
    
      }
      
    } catch (err) {
      console.error('Error converting file:', err);
      res.send({
        status: '400',
        message: 'Error converting file:',
      });
    }
  }
  await base64ToCsv(base64Data, outputPath);
 
}

// /get all value from the upload csv file(for sales, ndc, chargeback) 1st
router.getencodeduploadfile = async (req, res) => {
  var typeofupload = req.body.Typeofupload;
  const base64Data = req.body.data;
  var html_headervalue;
  if (typeofupload == 'sales') {
    html_headervalue = sales_html;
  } else if (typeofupload == 'chargeback') {
    html_headervalue = chargeback_html;
  } else if (typeofupload == 'ndc') {
    html_headervalue = ndc_html;
  }
  console.log("header value==", html_headervalue);
  console.log("typeof upload==", typeofupload);

  const outputPath = 'output.csv';
  async function base64ToCsv(base64Data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const buffer = Buffer.from(base64Data, 'base64');
    try {
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      const rows = [];
      worksheet.eachRow((row, _rowNumber) => {
        const rowData = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          rowData.push(cell.value);
        });
        rows.push(rowData);
      });
      const csvString = rows.map(row_1 => row_1.join(',')).join('\n');
      fs.writeFileSync(outputPath, csvString, 'utf8');
      console.log('CSV file generated:', outputPath);
    } catch (err) {
      console.error('Error converting file:', err);
    }
  }
  await base64ToCsv(base64Data, outputPath);
  const result = {};
  const Outputfilename = 'output.csv';
  fs.readFile(Outputfilename, 'utf8', async (_err, data) => {
    console.log(data + "<----")
    const firstline = data.split('\n')[0];
    const headervalue = firstline.split(',').map(header => header + '@@@').join('');

    await csvtojson().fromFile(Outputfilename).then(async fileData => {
      fileData.forEach((row) => {
        for (const [header, value] of Object.entries(row)) {
          if (!result[header]) {
            result[header] = [];
          }
          result[header].push(value);
        }
      });
      const obj = [
        { "Header_template": html_headervalue },
        { "header": headervalue },
        { "exceldata": result },
        { "type_of_upload": typeofupload }
      ];
      console.log(obj);
      res.status(200).json(obj)
    });
  });

}


// to upload all data from csv file to MongoDB based on index value(for sales, ndc, chargeback) 2nd
router.getcsvupload = async (req, res) => { 

  var typeofupload = req.body.Typeofupload;
  var data = req.body.exceldata;
  
  console.log("type of upload parameter", typeofupload);
  console.log("data parameter value", data);
  var html_headervalue;
  const client = new MongoClient(mongoserver);
  const db = client.db(mongodbname);


  try {

    await client.connect(mongoserver);
    console.log('Connected to MongoDB');
    try {


      if (typeofupload == 'sales') {
        html_headervalue = sales_html;
        try {
          const collectionName = mongosalescollection;
          const collection = db.collection(collectionName);
          console.log("html_headervalue value", html_headervalue);
          const headers = html_headervalue;
          const values = Object.values(data);
          console.log("header value", headers);
          console.log("data value", values);
          const documents = values[0].map((_, index) => {
            const obj = {};
            headers.forEach((header) => {
              obj[header] = values[headers.indexOf(header)][index];
            });
            return obj;
          });

          console.log(documents);
          try {
            const result = await collection.insertMany(documents);
            console.log('Data inserted successfully:', result);
            const countresult = await collection.countDocuments();
            console.log("Data inserted successfully.... , " + 'Total number of records from sales collection : ' + countresult);
            res.send({
              "status": "200",
              "message": "Data inserted Sucessfully...."
            });

          } catch (error) {
            console.error('Failed to insert data in MongoDB:', error);
            res.send({
              "status": "404",
              "message": "Failed to insert data in MongoDB:"
            });
          }

        } catch (error) {
          console.error('exception', error);
          res.send({
            "status": "400",
            "message": "Please...Try again..."
          });
        }



      } else if (typeofupload == 'chargeback') {
        html_headervalue = chargeback_html;
        try {
          const collectionName = mongochargebackcollection;
          const collection = db.collection(collectionName);
          console.log("html_headervalue value", html_headervalue);
          const headers = html_headervalue;
          const values = Object.values(data);
          console.log("header value", headers);
          console.log("data value", values);
          const documents = values[0].map((_, index) => {
            const obj = {};
            headers.forEach((header) => {
              obj[header] = values[headers.indexOf(header)][index];
            });
            return obj;
          });

          console.log(documents);
          try {
            const result = await collection.insertMany(documents);
            console.log('Data inserted successfully:', result);
            const countresult = await collection.countDocuments();
            console.log("Data inserted successfully.... , " + 'Total number of records from chargeback collection: ' + countresult);
            res.send({
              "status": "200",
              "message": "Data inserted Sucessfully...."
            });

          } catch (error) {
            console.error('Failed to insert data in MongoDB:', error);
            res.send({
              "status": "404",
              "message": "Failed to insert data in MongoDB:"
            });
          }

        } catch (error) {
          console.error('exception', error);
          res.send({
            "status": "400",
            "message": "Please...Try again..."
          });
        }



      } else if (typeofupload == 'ndc') {
        try {
          const collectionName = mongondccollection;
          const collection = db.collection(collectionName);
          html_headervalue = ndc_html;
          console.log("html_headervalue value", html_headervalue);
          const headers = html_headervalue;
          const values = Object.values(data);
          console.log("header value", headers);
          console.log("data value", values);
          const documents = values[0].map((_, index) => {
            const obj = {};
            headers.forEach((header) => {
              obj[header] = values[headers.indexOf(header)][index];
            });
            return obj;
          });

          console.log(documents);
          try {
            const result = await collection.insertMany(documents);
            console.log('Data inserted successfully:', result);
            const countresult = await collection.countDocuments();
            console.log("Data inserted successfully.... , " + 'Total number of records ndc collection: ' + countresult);
            res.send({
              "status": "200",
              "message": "Data inserted Sucessfully...."
            });

          } catch (error) {
            console.error('Failed to insert data in MongoDB:', error);
            res.send({
              "status": "404",
              "message": "Failed to insert data in MongoDB:"
            });
          }

        } catch (error) {
          console.error('exception', error);
          res.send({
            "status": "400",
            "message": "Please...Try again..."
          });
        }

      }
    } catch (error) {
      console.error('Exception after connection:', error);
      res.send({
        "status": "404",
        "message": "Please try again"
      });
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    res.send({
      "status": "500",
      "message": "Error connecting to MongoDB"
    });
    return;

  }




}
       

//-----------IDOC to edi started here(for 1st table)------------//

// //get directory list from edisapcePath..(for dropdown)
// router.getIDOCdirectoriesftp = async (_req, res) => {
//   var connection = new Client();
//   connection.connect(ftpServer);
//   connection.on('error', error => {
//     console.error('FTP connection error:', error);
//   });

//   sourcePath = ftpconfig.ftpserver.edisapcePath;
//   connection.on('ready', () => {
//     connection.cwd(sourcePath, (error, _currentDir) => {
//       if (error) {
//         console.error('Error changing directory:', error);
//         connection.end();
//         res.send({
//           "status": "404",
//           "message": "Please...Try Again"
//         });
//         return;
//       } else {

//         connection.list((error, lists) => {
//           if (error) {
//             console.error('Error listing files:', error);
//             connection.end();
//             res.send({
//               "status": "404",
//               "message": "Please...Try Again"
//             });
//             return;
//           }
//           else {
//             // console.log(JSON.stringify(lists));                
//             const directory = lists.filter((file) => file.type === 'd');
//             totalFiles = directory.length;
//             console.log(`No.of Directroy "d" in the  ${sourcePath} ` + totalFiles);
//             res.send(directory)

//           }

//         });
//       }
//     });
//   });
// }



// //get directory detail from edisapcePath...(for table)
// router.getIDOCdirectorydetailsftp = (req, res) => {
//   var connection = new Client();
//   connection.connect(ftpServer);
//   connection.on('error', error => {
//     console.error('FTP connection error:', error);
//     res.send({
//       "status": "500",
//       "message": "Connection is not Available Please Check VPN Connection"
//     });
//   });

//   var folderPath = req.body.customername;
//   sourcePath = ftpconfig.ftpserver.edisapcePath + folderPath + '/';
//   connection.on('ready', () => {
//     connection.cwd(sourcePath, (error, _currentDir) => {
//       if (error) {
//         console.error('Error changing directory:', error);
//         connection.end();
//         res.send({
//           "status": "404",
//           "message": "Please...Try Again"
//         });
//         return;
//       } else {

//         connection.list((error, lists) => {
//           if (error) {
//             console.error('Error listing files:', error);
//             connection.end();
//             res.send({
//               "status": "404",
//               "message": "Please...Try Again"
//             });
//             return;
//           }
//           else {
//             // console.log(JSON.stringify(lists));                
//             const files = lists.filter((file) => file.type === '-');
//             totalFiles = files.length;
//             console.log(`No.of Files "-" in the  ${sourcePath} ` + totalFiles);
//             res.send(files)

//           }

//         });
//       }
//     });
//   });
// }

// // Move single file from edisapcePath to edispacedestPath....(onclick move button) ftp
// router.toMoveoneidocfileftp = (req, res) => {
//   async function main() {
//     const serverPlatform = await getServerPlatform();
//     if (serverPlatform) {
//       console.log(`Server platform: ${serverPlatform}`);
//       var inputfoldername = req.body.customernamess;
//       var inputfilename = req.body.movetofiles;
//       if (serverPlatform === 'Windows') {
//         var connection = new Client();
//         connection.connect(ftpServer);
//         sourcePath = ftpconfig.ftpserver.edisapcePath + inputfoldername + '/';
//         connection.on('ready', () => {
//           connection.cwd(sourcePath, (error, _currentDir) => {
//             if (error) {
//               console.error('Error changing directory:', error);
//               connection.end();
//               res.send({
//                 "status": "404",
//                 "message": "Please...Try Again"
//               });
//               return;
//             } else {

//               connection.list((error, lists) => {
//                 if (error) {
//                   console.error('Error listing files:', error);
//                   connection.end();
//                   res.send({
//                     "status": "404",
//                     "message": "Please...Try Again"
//                   });
//                   return;
//                 }
//                 else {
//                   console.log(JSON.stringify(lists));

//                   const fileExists = lists.some(file => file.name === inputfilename);
//                   if (fileExists) {
//                     console.log('File exists!');

//                     const filePath = sourcePath + inputfilename;
//                     const destinationcopypath = sourcePath + '/backup/'


//                     try {
//                       connection.get(filePath, async (err, stream) => {
//                         if (err) {
//                           console.error('Error retrieving file from FTP server:', err);
//                           res.send({
//                             "status": "404",
//                             "message": "Please...Try Again"
//                           });
//                         } else {
//                           connection.put(stream, destinationcopypath + inputfilename, (err) => {
//                             if (err) {
//                               console.error('Error copying file on FTP server:', err);
//                               res.send({
//                                 "status": "404",
//                                 "message": "Error copying file on FTP server"
//                               });
//                             } else {
//                               console.log('File copied successfully!');
//                               try {
//                                 const file = inputfilename;
//                                 if (file.startsWith('INVOIC')) {
//                                   console.log('"810"  file name   ' + inputfilename);
//                                   try {
//                                     connection.rename(ftpconfig.ftpserver.edisapcePath + inputfoldername + '/' + inputfilename, ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/810/' + inputfilename, (err) => {
//                                       if (err) {
//                                         console.error('Error moving file on FTP server:', err);
//                                         res.send({
//                                           "status": "404",
//                                           "message": "Try Again...Error copying file on FTP server"
//                                         });
//                                       } else {
//                                         console.log('File moved successfully...:');
//                                         res.send({
//                                           "status": "200",
//                                           "message": "File moved successfully..."
//                                         });
//                                       }
//                                     });

//                                   } catch (error) {
//                                     console.log("Error while moving file... " + error)
//                                     res.send({
//                                       "status": "404",
//                                       "message": "Try Again...File not Moved..."
//                                     });

//                                   }

//                                 }

//                                 else if (file.startsWith('DESADV')) {
//                                   console.log('File starts with "856" --->  ' + inputfilename);
//                                   try {
//                                     connection.rename(ftpconfig.ftpserver.edisapcePath + inputfoldername + '/' + inputfilename, ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/856/' + inputfilename, (err) => {
//                                       if (err) {
//                                         console.error('Error moving file on FTP server:', err);
//                                         res.send({
//                                           "status": "404",
//                                           "message": "Try Again...Error copying file on FTP server"
//                                         });
//                                       } else {
//                                         console.log('File moved successfully...:');
//                                         res.send({
//                                           "status": "200",
//                                           "message": "File moved successfully..."
//                                         });
//                                       }
//                                     });


//                                   } catch (error) {
//                                     console.log("Error while moving file... " + error)
//                                     res.send({
//                                       "status": "404",
//                                       "message": "Try Again...File not Moved..."
//                                     });
//                                   }

//                                 }

//                                 else if (file.startsWith('ZRECCBKOUT')) {
//                                   console.log('File starts with "849"     ' + inputfilename);
//                                   try {
//                                     connection.rename(ftpconfig.ftpserver.edisapcePath + inputfoldername + '/' + inputfilename, ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/849/' + inputfilename, (err) => {
//                                       if (err) {
//                                         console.error('Error moving file on FTP server:', err);
//                                         res.send({
//                                           "status": "404",
//                                           "message": "Try Again...File Not moved"
//                                         });
//                                       } else {
//                                         console.log('File moved successfully...:');
//                                         res.send({
//                                           "status": "200",
//                                           "message": "File moved successfully..."
//                                         });
//                                       }
//                                     });

//                                   } catch (error) {
//                                     console.log("Error while moving file... " + error)
//                                     res.send({
//                                       "status": "404",
//                                       "message": "Try Again...File not Moved..."
//                                     });
//                                   }

//                                 }

//                                 else {
//                                   console.log("file name is not a correct formate...")

//                                   res.send({
//                                     "status": "404",
//                                     "message": "File name is not a correct formate..."
//                                   });
//                                 }


//                               } catch (err) {
//                                 console.log("Err while moving file..." + err)
//                                 res.send({
//                                   "status": "404",
//                                   "message": "Try Again...File not Moved..."
//                                 });
//                               }


//                             }

//                           });
//                         }
//                       });



//                     }

//                     catch (error) {
//                       console.log("Exception while taking the Backup" + error);
//                       res.send({
//                         "status": "404",
//                         "message  ": "Exception while taking the Backup"
//                       });
//                     }

//                   } else {
//                     console.log("file is not exists in the directory");
//                     res.send({
//                       "status": "404",
//                       "message  ": "file is not exists in the directory"
//                     });
//                   }

//                 }

//               });
//             }
//           });
//         });

//         connection.on('error', error => {
//           console.error('FTP connection error:', error);
//           res.send({
//             "status": "500",
//             "message": "Connection is not Available Please Check VPN Connection"
//           });
//         });



//       } else if (serverPlatform === 'Linux') {


//         var connection = new Client();


//         connection.connect(ftpServer);

//         sourcePath = ftpconfig.ftpserver.edisapcePath + inputfoldername + '/';
//         connection.on('ready', () => {
//           connection.cwd(sourcePath, (error, _currentDir) => {
//             if (error) {
//               console.error('Error changing directory:', error);
//               connection.end();
//               res.send({
//                 "status": "404",
//                 "message": "Please...Try Again"
//               });
//               return;
//             } else {

//               connection.list((error, lists) => {
//                 if (error) {
//                   console.error('Error listing files:', error);
//                   connection.end();
//                   res.send({
//                     "status": "404",
//                     "message": "Please...Try Again"
//                   });
//                   return;
//                 }
//                 else {
//                   console.log(JSON.stringify(lists));

//                   const fileExists = lists.some(file => file.name === inputfilename);
//                   if (fileExists) {
//                     console.log('File exists!');

//                     const filePath = sourcePath + inputfilename;
//                     const destinationcopypath = sourcePath + '/backup/'
//                     const permissions = '777';

//                     try {

//                       connection.site(`CHMOD ${permissions} ${filePath}`, (error, response) => {
//                         if (error) {
//                           console.error('Error while changing permissions:', error);
//                           res.send({
//                             "status": "404",
//                             "message": "Error while changing permissions"
//                           });

//                         } else {
//                           console.log('Permissions changed successfully:', response);
//                           connection.get(filePath, async (err, stream) => {
//                             if (err) {
//                               console.error('Error retrieving file from FTP server:', err);
//                               res.send({
//                                 "status": "404",
//                                 "message": "Please...Try Again"
//                               });
//                             } else {
//                               connection.put(stream, destinationcopypath + inputfilename, (err) => {
//                                 if (err) {
//                                   console.error('Error copying file on FTP server:', err);
//                                   res.send({
//                                     "status": "404",
//                                     "message": "Error copying file on FTP server"
//                                   });
//                                 } else {
//                                   console.log('File copied successfully!');
//                                   try {
//                                     const file = inputfilename;
//                                     if (file.startsWith('INVOIC')) {
//                                       console.log('"810"  file name   ' + inputfilename);
//                                       try {
//                                         connection.rename(ftpconfig.ftpserver.edisapcePath + inputfoldername + '/' + inputfilename, ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/810/' + inputfilename, (err) => {
//                                           if (err) {
//                                             console.error('Error moving file on FTP server:', err);
//                                             res.send({
//                                               "status": "404",
//                                               "message": "Try Again...Error copying file on FTP server"
//                                             });
//                                           } else {
//                                             console.log('File moved successfully...:');
//                                             res.send({
//                                               "status": "200",
//                                               "message": "File moved successfully..."
//                                             });
//                                           }
//                                         });

//                                       } catch (error) {
//                                         console.log("Error while moving file... " + error)
//                                         res.send({
//                                           "status": "404",
//                                           "message": "Try Again...File not Moved..."
//                                         });

//                                       }

//                                     }

//                                     else if (file.startsWith('DESADV')) {
//                                       console.log('File starts with "856" --->  ' + inputfilename);
//                                       try {
//                                         connection.rename(ftpconfig.ftpserver.edisapcePath + inputfoldername + '/' + inputfilename, ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/856/' + inputfilename, (err) => {
//                                           if (err) {
//                                             console.error('Error moving file on FTP server:', err);
//                                             res.send({
//                                               "status": "404",
//                                               "message": "Try Again...Error copying file on FTP server"
//                                             });
//                                           } else {
//                                             console.log('File moved successfully...:');
//                                             res.send({
//                                               "status": "200",
//                                               "message": "File moved successfully..."
//                                             });
//                                           }
//                                         });


//                                       } catch (error) {
//                                         console.log("Error while moving file... " + error)
//                                         res.send({
//                                           "status": "404",
//                                           "message": "Try Again...File not Moved..."
//                                         });
//                                       }

//                                     }

//                                     else if (file.startsWith('ZRECCBKOUT')) {
//                                       console.log('File starts with "849"     ' + inputfilename);
//                                       try {
//                                         connection.rename(ftpconfig.ftpserver.edisapcePath + inputfoldername + '/' + inputfilename, ftpconfig.ftpserver.edispacedestPath + inputfoldername + '/849/' + inputfilename, (err) => {
//                                           if (err) {
//                                             console.error('Error moving file on FTP server:', err);
//                                             res.send({
//                                               "status": "404",
//                                               "message": "Try Again...File Not moved"
//                                             });
//                                           } else {
//                                             console.log('File moved successfully...:');
//                                             res.send({
//                                               "status": "200",
//                                               "message": "File moved successfully..."
//                                             });
//                                           }
//                                         });

//                                       } catch (error) {
//                                         console.log("Error while moving file... " + error)
//                                         res.send({
//                                           "status": "404",
//                                           "message": "Try Again...File not Moved..."
//                                         });
//                                       }

//                                     }

//                                     else {
//                                       console.log("file name is not a correct formate...")

//                                       res.send({
//                                         "status": "404",
//                                         "message": "File name is not a correct formate..."
//                                       });
//                                     }


//                                   } catch (err) {
//                                     console.log("Err while moving file..." + err)
//                                     res.send({
//                                       "status": "404",
//                                       "message": "Try Again...File not Moved..."
//                                     });
//                                   }


//                                 }

//                               });
//                             }
//                           });



//                         }
//                       });
//                     } catch (error) {
//                       console.log("Exception while giving the permission" + error);
//                       res.send({
//                         "status": "404",
//                         "message  ": "Exception while giving the permission"
//                       });
//                     }

//                   } else {
//                     console.log("file is not exists in the directory");
//                     res.send({
//                       "status": "404",
//                       "message  ": "file is not exists in the directory"
//                     });
//                   }

//                 }

//               });
//             }
//           });
//         });

//         connection.on('error', error => {
//           console.error('FTP connection error:', error);
//           res.send({
//             "status": "500",
//             "message": "Connection is not Available Please Check VPN Connection"
//           });
//         });



//       } else {
//         res.send({
//           "status": "404",
//           "message": "Unknown server platform logic"
//         });
//       }
//     } else {
//       console.log('Failed to retrieve server platform.');
//       res.send({
//         "status": "404",
//         "message": "Failed to retrieve server platform."
//       });
//     }
//   }
//   main();

// }

// // Move all file from edisapcePath to edispacedestPath....(onclick moveall button) ftp
// router.toMoveallidocfilesftp = async (req, res) => {
//   async function main() {
//     const serverPlatform = await getServerPlatform();
//     if (serverPlatform) {
//       console.log(`Server platform: ${serverPlatform}`);
//       var folderPath = req.body.movetodirectory;

//       if (serverPlatform === 'Windows') {
//         console.log("Server Platform is Windows")
//         var connection = new Client();

//         connection.connect(ftpServer);
//         var totaluploadFiles; //before copy
//         var filescopied = 0;//after coped
//         sourcePath = ftpconfig.ftpserver.edisapcePath + folderPath + '/';
//         copydestinationDirectory = ftpconfig.ftpserver.edisapcePath + folderPath + '/backup/';
//         connection.on('ready', () => {
//           connection.cwd(sourcePath, (error, _currentDir) => {
//             if (error) {
//               console.error('Error changing directory:', error);
//               connection.end();
//               res.send({
//                 "status": "404",
//                 "message": "Please...Try Again"
//               });
//               return;
//             } else {

//               connection.list((error, lists) => {
//                 if (error) {
//                   console.error('Error listing files:', error);
//                   connection.end();
//                   res.send({
//                     "status": "404",
//                     "message": "Please...Try Again"
//                   });
//                   return;
//                 }
//                 else {

//                   const files = lists.filter((file) => file.type === '-');
//                   console.log(files);
//                   totalFiles = files.length;
//                   console.log("Number of files from the directory.." + totalFiles);
//                   if (totalFiles == 0) {
//                     res.send({
//                       "status": "404",
//                       "message": "There is no file in the Directory.."
//                     });
//                   } else {
//                     files.forEach((file) => {

//                       const filename = file.name;
//                       console.log('filename' + file.name);
//                       try {


//                         connection.cwd(sourcePath, (error, _currentDir) => {
//                           if (error) {
//                             console.error('Error changing directory:', error);
//                             connection.end();
//                             res.send({
//                               "status": "404",
//                               "message": "Please...Try Again"
//                             });
//                             return;
//                           } else {
//                             connection.list((error, list) => {
//                               if (error) {
//                                 console.error('Error listing files:', error);
//                                 connection.end();
//                                 res.send({
//                                   "status": "550",
//                                   "message": "Please...Try Again...."
//                                 });
//                               }
//                               else {
//                                 const filesTocopy = list.filter((file) => file.type === '-');
//                                 totaluploadFiles = filesTocopy.length;
//                                 console.log("Number of files from the directory for take copy.." + totaluploadFiles);
//                                 if (totaluploadFiles == 0) {
//                                   res.send({
//                                     "status": "404",
//                                     "message": "There is no file in the Directory.."
//                                   });
//                                 } else {
//                                   filesTocopy.forEach((file) => {
//                                     const sourceFile = sourcePath + file.name;
//                                     const destinationFile = copydestinationDirectory + file.name;

//                                     try {

//                                       connection.get(sourceFile, (error, stream) => {
//                                         if (error) {
//                                           console.error(`Error downloading file ${sourceFile}:`, error);
//                                           connection.end();
//                                         }
//                                         else {
//                                           try {

//                                             connection.put(stream, destinationFile, (error) => {
//                                               if (error) {
//                                                 console.error(`Error uploading file:`, error);
//                                                 connection.end();
//                                                 res.send({
//                                                   "status": "404",
//                                                   "message": "Please...Try Again...."
//                                                 });
//                                               } else {
//                                                 filescopied++;
//                                                 console.log("total file  for copy " + totaluploadFiles + " copied file count" + filescopied)
//                                                 if (filescopied == totaluploadFiles) {
//                                                   console.log('All files uploaded successfully!');
//                                                   moveallfilewithpermission();


//                                                 }


//                                               }
//                                             });
//                                           } catch (error) {
//                                             console.log("while taking the file for copy" + error);
//                                             res.send({
//                                               "status": "404",
//                                               "message": "Please...Try Again...."
//                                             });

//                                           }

//                                         }
//                                       })
//                                     } catch (error) {
//                                       console.log("while getting the file for copy" + error);
//                                       res.send({
//                                         "status": "404",
//                                         "message": "Please...Try Again...."
//                                       });


//                                     }


//                                   })

//                                 }


//                               }
//                             })



//                           }
//                         })








//                       } catch (error) {
//                         console.log("Exception While changeing the permission " + error)
//                         res.send({
//                           "status": "404",
//                           "message": "permissions Not Updated"
//                         });
//                       }




//                     })


//                   }
//                 }

//               });
//             }
//           });
//         });
//         async function moveallfilewithpermission() {
//           const client = new ftp.Client()
//           client.ftp.verbose = true;
//           console.log("Move All IDOC files from the customer  " + folderPath);
//           try {
//             await client.access(ftpServer);
//             console.log("ftp server connected");
//             const lists = await client.list(ftpconfig.ftpserver.edisapcePath + folderPath + '/');
//             const files = lists.filter(entry => entry.type === 1).map(entry => entry);
//             console.log(files);
//             if (files.length == 0) {
//               console.log("There is no file in the directory....")
//               client.end();
//               res.send({
//                 "status": "404",
//                 "message": "There is no file in the directory...."
//               });
//             } else {
//               let finalresult = [];
//               for (let file of files) {
//                 const inputfilename = file.name;
//                 try {

//                   if (inputfilename.startsWith('INVOIC')) {
//                     console.log("'810' file is" + inputfilename);
//                     sourcePath810 = ftpconfig.ftpserver.edisapcePath + folderPath + '/' + inputfilename;
//                     destinationPath810 = ftpconfig.ftpserver.edispacedestPath + folderPath + '/810/' + inputfilename;
//                     await client.rename(sourcePath810, destinationPath810);
//                     finalresult.push(0);

//                   }
//                   else if (inputfilename.startsWith('DESADV')) {
//                     console.log("'856' file is" + inputfilename);
//                     sourcePath856 = ftpconfig.ftpserver.edisapcePath + folderPath + '/' + inputfilename;
//                     destinationPath856 = ftpconfig.ftpserver.edispacedestPath + folderPath + '/856/' + inputfilename;
//                     await client.rename(sourcePath856, destinationPath856);
//                     finalresult.push(0);


//                   }
//                   else if (inputfilename.startsWith('ZRECCBKOUT')) {
//                     console.log("'849' file is" + inputfilename);
//                     sourcePath849 = ftpconfig.ftpserver.edisapcePath + folderPath + '/' + inputfilename;
//                     destinationPath849 = ftpconfig.ftpserver.edispacedestPath + folderPath + '/849/' + inputfilename;
//                     await client.rename(sourcePath849, destinationPath849);
//                     finalresult.push(0);

//                   }

//                   else {
//                     console.log("file name is Not a correct formate...")
//                   }
//                 } catch (error) {
//                   console.log("Error While move all IDOC file from  Directory....");
//                   finalresult.push(1);

//                 }
//               }

//               console.log("array of Final result------" + finalresult);
//               let checkresult;
//               if (finalresult.length != 0) {
//                 checkresult = finalresult.every(element => element === 0);
//                 if (checkresult === true) {
//                   console.log('All files moved successfully....');
//                   res.send({
//                     "status": "200",
//                     "message": "All files moved Successfully......"
//                   });
//                 }
//                 else {
//                   console.log('All files Not moved Successfully....');
//                   res.send({
//                     "status": "404",
//                     "message": "Please..Try Again..All Files is not moved"
//                   });
//                 }
//               }
//               else {
//                 {
//                   console.log('All files Not moved Successfully....');
//                   res.send({
//                     "status": "404",
//                     "message": "Please...Try Again, All files is Not moved"
//                   });
//                 }

//               }
//             }

//           } catch (error) {
//             console.log("Exception While finding the file list...." + error)
//             res.send({
//               "status": "404",
//               "message": "Please...Try Again"
//             });
//           }


//         }
//         connection.on('error', error => {
//           console.error('FTP connection error:', error);

//         });


//       } else if (serverPlatform === 'Linux') {

//         console.log("Server Platform is Linux");
//         var connection = new Client();
//         connection.connect(ftpServer);
//         var filepermissioncount = 0; //after permission
//         var totalFiles; // before permission
//         var totaluploadFiles; //before copy
//         var filescopied = 0;//after coped
//         sourcePath = ftpconfig.ftpserver.edisapcePath + folderPath + '/';
//         copydestinationDirectory = ftpconfig.ftpserver.edisapcePath + folderPath + '/backup/';
//         connection.on('ready', () => {
//           connection.cwd(sourcePath, (error, _currentDir) => {
//             if (error) {
//               console.error('Error changing directory:', error);
//               connection.end();
//               res.send({
//                 "status": "404",
//                 "message": "Please...Try Again"
//               });
//               return;
//             } else {

//               connection.list((error, lists) => {
//                 if (error) {
//                   console.error('Error listing files:', error);
//                   connection.end();
//                   res.send({
//                     "status": "404",
//                     "message": "Please...Try Again"
//                   });
//                   return;
//                 }
//                 else {

//                   const files = lists.filter((file) => file.type === '-');
//                   console.log(files);
//                   totalFiles = files.length;
//                   console.log("Number of files from the directory.." + totalFiles);
//                   if (totalFiles == 0) {
//                     res.send({
//                       "status": "404",
//                       "message": "There is no file in the Directory.."
//                     });
//                   } else {
//                     files.forEach((file) => {
//                       console.log(file.name);

//                       const filename = file.name;
//                       console.log('filename' + file.name);
//                       try {
//                         connection.site("chmod +x ${filename}", (error, _response) => {
//                           if (error) {
//                             console.error(`Error updating permissions for ${filename}:`, error);
//                             return;
//                           } else {
//                             console.log(`Permissions updated for ${filename}`);
//                             filepermissioncount++;
//                             console.log("total file length  " + totalFiles + "  permission file length" + filepermissioncount);

//                             if (filepermissioncount == totalFiles) {
//                               console.log('Permission Updated successfully For all files.');
//                               connection.cwd(sourcePath, (error, _currentDir) => {
//                                 if (error) {
//                                   console.error('Error changing directory:', error);
//                                   connection.end();
//                                   res.send({
//                                     "status": "404",
//                                     "message": "Please...Try Again"
//                                   });
//                                   return;
//                                 } else {
//                                   connection.list((error, list) => {
//                                     if (error) {
//                                       console.error('Error listing files:', error);
//                                       connection.end();
//                                       res.send({
//                                         "status": "550",
//                                         "message": "Please...Try Again...."
//                                       });
//                                     }
//                                     else {
//                                       const filesTocopy = list.filter((file) => file.type === '-');
//                                       totaluploadFiles = filesTocopy.length;
//                                       console.log("Number of files from the directory for take copy.." + totaluploadFiles);
//                                       if (totaluploadFiles == 0) {
//                                         res.send({
//                                           "status": "404",
//                                           "message": "There is no file in the Directory.."
//                                         });
//                                       } else {
//                                         filesTocopy.forEach((file) => {
//                                           const sourceFile = sourcePath + file.name;
//                                           const destinationFile = copydestinationDirectory + file.name;

//                                           try {

//                                             connection.get(sourceFile, (error, stream) => {
//                                               if (error) {
//                                                 console.error(`Error downloading file ${sourceFile}:`, error);
//                                                 connection.end();
//                                               }
//                                               else {
//                                                 try {

//                                                   connection.put(stream, destinationFile, (error) => {
//                                                     if (error) {
//                                                       console.error(`Error uploading file:`, error);
//                                                       connection.end();
//                                                       res.send({
//                                                         "status": "404",
//                                                         "message": "Please...Try Again...."
//                                                       });
//                                                     } else {
//                                                       filescopied++;
//                                                       console.log("total file  for copy " + totaluploadFiles + " copied file count" + filescopied)
//                                                       if (filescopied == totaluploadFiles) {
//                                                         console.log('All files uploaded successfully!');
//                                                         moveallfilewithpermission();


//                                                       }


//                                                     }
//                                                   });
//                                                 } catch (error) {
//                                                   console.log("while taking the file for copy" + error);
//                                                   res.send({
//                                                     "status": "404",
//                                                     "message": "Please...Try Again...."
//                                                   });

//                                                 }

//                                               }
//                                             }) //
//                                           } catch (error) {
//                                             console.log("while getting the file for copy" + error);
//                                             res.send({
//                                               "status": "404",
//                                               "message": "Please...Try Again...."
//                                             });


//                                           }


//                                         })

//                                       }


//                                     }
//                                   })



//                                 }
//                               })




//                             }

//                           }
//                         })

//                       } catch (error) {
//                         console.log("Exception While changeing the permission " + error)
//                         res.send({
//                           "status": "404",
//                           "message": "permissions Not Updated"
//                         });
//                       }




//                     })


//                   }
//                 }

//               });
//             }
//           });
//         });
//         async function moveallfilewithpermission() {
//           const client = new ftp.Client()
//           client.ftp.verbose = true;
//           console.log("Move All IDOC files from the customer  " + folderPath);
//           try {
//             await client.access(ftpServer);
//             console.log("ftp server connected");
//             const lists = await client.list(ftpconfig.ftpserver.edisapcePath + folderPath + '/');
//             const files = lists.filter(entry => entry.type === 1).map(entry => entry);
//             console.log(files);
//             if (files.length == 0) {
//               console.log("There is no file in the directory....")
//               client.end();
//               res.send({
//                 "status": "404",
//                 "message": "There is no file in the directory...."
//               });
//             } else {
//               let finalresult = [];
//               for (let file of files) {
//                 const inputfilename = file.name;
//                 try {

//                   if (inputfilename.startsWith('INVOIC')) {
//                     console.log("'810' file is" + inputfilename);
//                     sourcePath810 = ftpconfig.ftpserver.edisapcePath + folderPath + '/' + inputfilename;
//                     destinationPath810 = ftpconfig.ftpserver.edispacedestPath + folderPath + '/810/' + inputfilename;
//                     await client.rename(sourcePath810, destinationPath810);
//                     finalresult.push(0);

//                   }
//                   else if (inputfilename.startsWith('DESADV')) {
//                     console.log("'856' file is" + inputfilename);
//                     sourcePath856 = ftpconfig.ftpserver.edisapcePath + folderPath + '/' + inputfilename;
//                     destinationPath856 = ftpconfig.ftpserver.edispacedestPath + folderPath + '/856/' + inputfilename;
//                     await client.rename(sourcePath856, destinationPath856);
//                     finalresult.push(0);


//                   }
//                   else if (inputfilename.startsWith('ZRECCBKOUT')) {
//                     console.log("'849' file is" + inputfilename);
//                     sourcePath849 = ftpconfig.ftpserver.edisapcePath + folderPath + '/' + inputfilename;
//                     destinationPath849 = ftpconfig.ftpserver.edispacedestPath + folderPath + '/849/' + inputfilename;
//                     await client.rename(sourcePath849, destinationPath849);
//                     finalresult.push(0);

//                   }

//                   else {
//                     console.log("file name is Not a correct formate...")
//                   }
//                 } catch (error) {
//                   console.log("Error While move all IDOC file from  Directory....");
//                   finalresult.push(1);

//                 }
//               }

//               console.log("array of Final result------" + finalresult);
//               let checkresult;
//               if (finalresult.length != 0) {
//                 checkresult = finalresult.every(element => element === 0);
//                 if (checkresult === true) {
//                   console.log('All files moved successfully....');
//                   res.send({
//                     "status": "200",
//                     "message": "All files moved Successfully......"
//                   });
//                 }
//                 else {
//                   console.log('All files Not moved Successfully....');
//                   res.send({
//                     "status": "404",
//                     "message": "Please..Try Again..All Files is not moved"
//                   });
//                 }
//               }
//               else {
//                 {
//                   console.log('All files Not moved Successfully....');
//                   res.send({
//                     "status": "404",
//                     "message": "Please...Try Again, All files is Not moved"
//                   });
//                 }

//               }
//             }

//           } catch (error) {
//             console.log("Exception While finding the file list...." + error)
//             res.send({
//               "status": "404",
//               "message": "Please...Try Again"
//             });
//           }


//         }
//         connection.on('error', error => {
//           console.error('FTP connection error:', error);

//         });


//       } else {
//         res.send({
//           "status": "404",
//           "message": "Unknown server platform"
//         });

//       }

//     } else {
//       console.log('Failed to retrieve server platform.');
//       res.send({
//         "status": "404",
//         "message": "Failed to retrieve server platform."
//       });
//     }
//   }
//   main();


// }





// //Outbound -----------------
// //get directory list from outboundsrcPath..(for dropdown) ftp
// router.getoutbounddirectoriesftp = (_req, res) => {
//   var connection = new Client();
//   connection.connect(ftpServer);
//   connection.on('error', error => {
//     console.error('FTP connection error:', error);
//   });

//   sourcePath = ftpconfig.ftpserver.outboundsrcPath;
//   connection.on('ready', () => {
//     connection.cwd(sourcePath, (error, _currentDir) => {
//       if (error) {
//         console.error('Error changing directory:', error);
//         connection.end();
//         res.send({
//           "status": "404",
//           "message": "Please...Try Again"
//         });
//         return;
//       } else {

//         connection.list((error, lists) => {
//           if (error) {
//             console.error('Error listing files:', error);
//             connection.end();
//             res.send({
//               "status": "404",
//               "message": "Please...Try Again"
//             });
//             return;
//           }
//           else {
//             console.log(JSON.stringify(lists));
//             const directory = lists.filter((file) => file.type === 'd');
//             totalFiles = directory.length;
//             console.log("No.of Directroy in the source Path :  " + totalFiles);
//             res.send(directory)

//           }

//         });
//       }
//     });
//   });
// }


// //get directory detail from outboundsrcPath...(to display tables with file name) ftp
// router.getoutbounddirectorydetailftp = (req, res) => {
//   var connection = new Client();
//   connection.connect(ftpServer);
//   connection.on('error', error => {
//     console.error('FTP connection error:', error);

//   });

//   connection.on('ready', () => {
//     var folderPath = req.body.outcustomername;
//     sourcePath = ftpconfig.ftpserver.outboundsrcPath + folderPath + '/'
//     console.log("Outbound SourcePath:  " + sourcePath);
//     connection.cwd(sourcePath, (error, _currentDir) => {
//       if (error) {
//         console.error('Error changing directory:', error);
//         connection.end();
//         res.send({
//           "status": "404",
//           "message": "Please...Try Again"
//         });
//         return;
//       } else {

//         connection.list((error, lists) => {
//           if (error) {
//             console.error('Error listing files:', error);
//             connection.end();
//             res.send({
//               "status": "404",
//               "message": "Please...Try Again"
//             });
//             return;
//           }
//           else {
//             console.log(JSON.stringify(lists));
//             const files = lists.filter((file) => file.type === '-');
//             totalFiles = files.length;
//             console.log("No.of Files in the directory :  " + totalFiles);
//             res.send(files)

//           }

//         });
//       }
//     });
//   });
// }

// //  Move all file from outboundsrcPath to outboundsrcPath/----/Outbound....(onclick moveall button) ftp
// router.toMovealloutboundfilesftp = async (req, res) => {
//   var connection = new Client();

//   var folderPath = req.body.moveouttodirectory;
//   const sourceDirectory = ftpconfig.ftpserver.outboundsrcPath + folderPath + '/';;
//   const destinationDirectory = ftpconfig.ftpserver.outboundsrcPath + folderPath + '/backup/';
//   const renamedSourceDirectory = ftpconfig.ftpserver.outboundsrcPath + folderPath + '/Outbound/';


//   let filesUploaded = 0;
//   let totalFiles = 0;
//   let totalmoveFiles = 0;
//   let filemoved = 0;
//   connection.on('ready', () => {
//     connection.cwd(sourceDirectory, (error, _currentDir) => {
//       if (error) {
//         console.error('Error changing directory:', error);
//         connection.end();
//         res.send({
//           "status": "404",
//           "message": "Please...Try Again"
//         });
//         return;
//       } else {

//         connection.list((error, list) => {
//           if (error) {
//             console.error('Error listing files:', error);
//             connection.end();
//             res.send({
//               "status": "550",
//               "message": "Please...Try Again...."
//             });
//           }
//           else {
//             const filesToMove = list.filter((file) => file.type === '-');
//             totalFiles = filesToMove.length;
//             console.log("Number of files from the directory.." + totalFiles);
//             if (totalFiles == 0) {
//               res.send({
//                 "status": "404",
//                 "message": "There is no file in the Directory.."
//               });
//             } else {
//               filesToMove.forEach((file) => {
//                 const sourceFile = sourceDirectory + file.name;
//                 const destinationFile = destinationDirectory + file.name;

//                 connection.get(sourceFile, (error, stream) => {
//                   if (error) {
//                     console.error(`Error downloading file ${sourceFile}:`, error);
//                     connection.end();
//                     res.send({
//                       "status": "404",
//                       "message": "Please...Try Again...."
//                     });
//                   }
//                   else {
//                     connection.put(stream, destinationFile, (error) => {
//                       if (error) {
//                         console.error(`Error uploading file:`, error);
//                         connection.end();
//                         res.send({
//                           "status": "404",
//                           "message": "Please...Try Again...."
//                         });
//                       } else {
//                         console.log(`File ${sourceFile} uploaded successfully to ${destinationFile}`);
//                         filesUploaded++;
//                         if (filesUploaded == totalFiles) {
//                           console.log('All files uploaded successfully!');
//                           connection.list(sourceDirectory, (error, list) => {
//                             if (error) {
//                               console.error('Error listing files:', error);
//                               connection.end();
//                               res.send({
//                                 "status": "550",
//                                 "message": "Please...Try Again...."
//                               });
//                             }
//                             else {
//                               const filesTorename = list.filter((file) => file.type === '-');
//                               totalmoveFiles = filesTorename.length;
//                               filesTorename.forEach((file) => {
//                                 const sourcemoveFile = sourceDirectory + file.name;
//                                 const destinationmoveFile = renamedSourceDirectory + file.name;

//                                 connection.rename(sourcemoveFile, destinationmoveFile, (error) => {
//                                   if (error) {
//                                     console.error(`Failed to move file: ${error}`);
//                                     res.send({
//                                       "status": "404",
//                                       "message": "Please...Try Again...."
//                                     });
//                                     return;

//                                   } else {
//                                     console.log(`${file.name} :file Moved`);
//                                     filemoved++;
//                                     console.log("total move file length" + totalmoveFiles + "total moved file length" + filemoved);

//                                     if (filemoved == totalmoveFiles) {
//                                       console.log('All files moved successfully.');
//                                       res.send({
//                                         "status": "200",
//                                         "message": "All files moved successfully"
//                                       });

//                                     }
//                                   }
//                                 });



//                               });
//                             }
//                           })

//                         }
//                       }

//                     });
//                   }
//                 });
//               });
//             }
//           }
//         });



//       }

//     })
//   });
//   connection.on('error', (error) => {
//     console.error('FTP connection error:', error);
//     res.send({
//       "status": "500",
//       "message": "Connection is not Available Please Check VPN Connection"
//     });

//   });
//   connection.connect(ftpServer);

// }

// // Move single file from outboundsrcPath to outboundsrcPath/----/Outbound....(onclick move button) ftp
// router.toMoveoneoutboundfileftp = async (req, res) => {

//   var connection = new Client();
//   var inputfoldername = req.body.outcustomernamess;
//   var inputfilename = req.body.moveouttofiles;
//   const sourceFilePath = ftpconfig.ftpserver.outboundsrcPath + inputfoldername + '/';
//   const destinationFilePath = ftpconfig.ftpserver.outboundsrcPath + inputfoldername + '/backup/';

//   connection.on('ready', () => {
//     connection.cwd(sourceFilePath, (error, _currentDir) => {
//       if (error) {
//         console.error('Error changing directory:', error);
//         connection.end();
//         res.send({
//           "status": "404",
//           "message": "Please...Try Again"
//         });
//         return;
//       } else {

//         connection.list((err, list) => {
//           if (err) {
//             console.log("err while getting list" + err);
//             res.send({
//               "status": "404",
//               "message": "Please...Try Again"
//             });
//           } else {
//             console.log(list);
//             const fileExists = list.some(file => file.name === inputfilename);
//             console.log(fileExists);
//             if (fileExists) {
//               connection.get(sourceFilePath + inputfilename, async (err, stream) => {
//                 if (err) {
//                   console.error('Error retrieving file from FTP server:', err);
//                   res.send({
//                     "status": "404",
//                     "message": "Please...Try Again"
//                   });
//                 } else {
//                   connection.put(stream, destinationFilePath + inputfilename, (err) => {
//                     if (err) {
//                       console.error('Error copying file on FTP server:', err);
//                       res.send({
//                         "status": "404",
//                         "message": "Error copying file on FTP server"
//                       });
//                     } else {
//                       console.log('File copied successfully!');
//                       connection.rename(sourceFilePath + inputfilename, sourceFilePath + 'Outbound/' + inputfilename, (err) => {
//                         if (err) {
//                           console.error('Error moving file on FTP server:', err);
//                           res.send({
//                             "status": "404",
//                             "message": "Try Again...Error copying file on FTP server"
//                           });
//                         } else {
//                           console.log('File moved successfully...:');
//                           res.send({
//                             "status": "200",
//                             "message": "File moved successfully..."
//                           });
//                         }
//                       });

//                     }

//                   });
//                 }
//               });

//             } else {
//               console.log("file does not exist...");
//               res.send({
//                 "status": "404",
//                 "message": "File not found in this directory"
//               });
//             }
//           }
//         });
//       }
//     })
//   })
//   connection.on('error', (error) => {
//     console.error('FTP connection error:', error);
//     res.send({
//       "status": "500",
//       "message": "Connection is not Available Please Check VPN Connection"
//     });

//   });
//   connection.connect(ftpServer);
// }


//Pending
router.gettencust = async (req, res) =>{
 try {  
    const client = new MongoClient(mongoserver);
    await client.connect();
    console.log('MongoDB connected successfully!');
    const db = client.db(mongodbname);
    const collectionName = mongoSalesReportCollection;
    const collection = db.collection(collectionName);

  } catch (error) {
    console.error('Mongo DB connection error:', error);
    res.send({
      "status": "500",
      "message": "Mongo DB Server Down"
    });
  }

}


// for getting ndc amount
router.getndc = (_req, res) => {
  const connection = mysql.createConnection(mysqlServer);
  connection.connect((error) => {
    if (error) {
      console.error('Database connection error:', error);
      res.send({
        "status": "500",
        "message": "Database Not connected"
      });
    }
    else {
      console.log('Database connected!');

      connection.query(selectndcQuery, (error, results) => {
        if (error) {
          console.error('Error executing query:', error);
          res.send({
            "status": "500",
            "message": "Error executing query..."
          });
        }
        console.log('Fetched data:', results);
        res.send(results);
      });
    }
  })

}



// get top ten customer detail
router.getCustomers = (_req, res) => {
  const connection = mysql.createConnection(mysqlServer);
  connection.connect((error) => {
    if (error) {
      console.error('Database connection error:', error);
      res.send({
        "status": "500",
        "message": "Database Not connected"
      });
    } else {
      console.log('Database connected!');

      connection.query(selecttoptencustomer, (error, results) => {
        if (error) {
          console.error('Error executing query:', error);
          res.send({
            "status": "500",
            "message": "Error executing query..."
          });
        }
        console.log('Fetched data:', results);
        res.send(results);
      });
    }
  });
}

// Sales register upload mongo DB
router.importbase64 = async (req, res) => {
  try {
    const base64Data = req.body.Base64;
    const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
    const csvData = await csvtojson().fromString(decodedData);
    console.log("data", csvData);
    const columnNames = Object.keys(csvData[0]);

    // replacing spaces with underscores
    const modifiedColumnNames = columnNames.map((columnName) => columnName.replace(/\s+/g, '_'));

    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    const client = new MongoClient(mongoserver, mongoOptions);
    await client.connect();
    console.log('MongoDB connected successfully!');
    const db = client.db(mongodbname);
    const collectionName = mongoSalesReportCollection;
    const collection = db.collection(collectionName);

    // await collection.deleteMany({});

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const modifiedRow = {};

      for (const key in row) {
        const modifiedKey = key.replace(/\s+/g, '_');
        modifiedRow[modifiedKey] = row[key];
      }
        console.log(modifiedRow);
      await collection.insertOne(modifiedRow);
      
    }
    const countresult = await collection.countDocuments();
      console.log("Data inserted successfully.... , " + 'Total number of records from sales collection : ' + countresult);
    res.send({
      status: '200',
      message: 'Data imported successfully to MongoDB',
    });

   
  } catch (error) {
    console.error('Error converting to CSV:', error);
    res.status(500).json({ error: 'Failed to convert data to CSV' });
  }
};


router.getuploadrxtrpldata=async (req, res) =>{
  csvFilePath='LifestarRxtpl_upload.csv';  
  const client = new MongoClient(mongoserver);
  const db = client.db(mongodbname);
  try {
    await client.connect(mongoserver);
    console.log('Connected to MongoDB');
          try {
            csvtojson().fromFile(csvFilePath).then(async fileData => {     
              const datavalue=JSON.parse(JSON.stringify(fileData));                         
              const collectionName = mongorxtplsalescollection;              
              const collection = db.collection(collectionName);
              try {
                const result = await collection.insertMany(datavalue);
                console.log('Data inserted successfully:', result);
                const countresult = await collection.countDocuments();
                console.log("Data inserted successfully.... , " + 'Total number of records Rxtpl_Sales collection: ' + countresult);
                              
                try {                 
                i=0;
                 await collection.find().forEach(async function(doc) {
                    doc.actual_shipment_date = new Date(doc.actual_shipment_date);
                    await collection.updateOne(
                      { _id: doc._id }, 
                      { $set: { actual_shipment_date: doc.actual_shipment_date } 
                    }
                    )
                    
                    i++;
                  
                    if(i == countresult ){
                      console.log("ISO date updated line items", i , 'total data from sales collection', countresult);
                      try {                       
                     
                     const mailerresult = await getmailer();
                    
                      console.log("mail function result", mailerresult);
                      res.send({
                        "status": "200",
                        "message": "File updated & converted to the ISO date format"
                      });
                      
                    } catch (error) {
                        console.log("error", error)
                    }
                    }
                })
                
              } catch (error) {
                console.error('Exception while run the ISO query:', error);
                res.send({
                  "status": "404",
                  "message": "ISO date not updated"
                });
              }
    
              } catch (error) {
                console.error('Failed to insert data in MongoDB:', error);
                res.send({
                  "status": "404",
                  "message": "Failed to insert data in MongoDB:"
                });
              }

            })
          }catch(err){
            console.log(err);
          }
        }catch(err){
          console.log("connection error ", err);
        }
       


}


module.exports = router;
