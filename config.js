module.exports ={
    //ftp credentials
    ftpserver:{ 
        // host: '192.168.40.39',
        // user: 'US_FTP',
        // password: 'MnkSys@456',
        // protocol: '21' , 
        
        // host: '192.168.40.204',
        // user: 'edi',
        // password: 'Sspledi@125',
        // protocol: '22' ,
        host: '192.168.1.9',
        user: 'root',
        password: 'Jaiganesh',
        protocol: '22' ,
        
        outboundsrcPath: '/home/edi/IBM/SterlingIntegrator/install/as2partner/LifeStarProd/All_Outbound2023/',       //for outbound table        
        edisapcePath:'/edispace/', //for IDOC to edi table
        edispacedestPath:'/edispace/prod/outbound/collect/',  //for IDOC to edi table       
        edispace940destinationpath: '/edispace/test/outbound/mail/RXTPL/940/'
    },

    

    //My sql database credentials 
    mysqldb:{ 
       host: "192.168.1.9",
       user: "root",
       password: "admin123",
       database: "edidev",
       databasecashapp: "sapdevdb" 


      
        },
        //CASH APP
    mysqlcashapp:{
    //local
        host: "127.0.0.1",
        user: "root",
        password: "root",        
        databasecashapp: "som" 

// server
    //     host: "192.168.1.9",
    //    user: "root",
    //    password: "admin123",
    //     database: "edidev",
    },

    // MongoDB credentials
    mongodb:{
        host: "mongodb://192.168.1.9:27017",
        dbname: "Lifestar_edi",
        collectionregister : "Register_data", //Register api
        collectionsales: "Lifestar_sales", // Sales
        collectionchargeback : "Lifestar_chargeback", //Chargeback
        collectionndc: "Lifestar_ndc", //ndc
        collectionSalesReport:"Lifestar_Sales_Report_chartdata", //charts
        collectionrxtplsales:"LifestarRxtpl_Sales",  // rxtplsales report
        collectionorderdetail:"Lifestar_ediorderdetail"  //orderdetail moved count devlopment
        // collectionorderdetail:"Lifestar_ediorderdetail_prod"  //orderdetail moved count production 
    }
   };
