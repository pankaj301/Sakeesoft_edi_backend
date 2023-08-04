## Project
   Project : sakeesoft-edi-backend
   released-1.0.2-2023.06.26

  

## Usage
    version:  v18.14.2
    Run 'node server.js' To start the application
    will get : connection to the Port 3000
    urlPath : 'http://localhost:3000/'

## API details
I . Register and login;-
    1. method       : post
       api          : /login
       modules      :('bcrypt'), ('mongodb')
       Database     : MySql
       req.parameter: email and password       
       status       : Done
       /* User can login with correct email id and password */

    2. method       : post
       api          : /register
       modules       : ('bcrypt'), ('mongodb')
       Database     : MySql
       req.parameter: firstname, lastname, email, password, confirm password
       status       : Done
       /* User can register with firstname, lastname, email, password, confirm password */


II . Import data CSV to MongoDB;-
    1. method       : post
       api          : /uploadfile
       modules       : ('csvtojson'),('exceljs'),("fs")
       req.parameter: base64 (excel data)
       response     : excel header value
       staus        :  Done
       /* to convert base64 to csv file formate, and get the header value and excel value */

    2. method       : post
       api          : /csvupload
       modules      :  ('csvtojson'), ('mongodb') ,("fs")
       req.parameter: Indexvalue of header
       staus        : Done
       /* based on the indexvalue and type of upload data will store in  MongoDB */

III. Edi-IDOC File transfer:-
    1. method      : get
       api         :/getidocdirectoires
       modules     : ('ftp')
       response    : list of directories from the sourcePath with JSON
       status      : Done
       /* connect to ftp server then file the directory list from the SourcePath (In Angular side for DropDown in editoIdoc page)  */

    2. method      :post
       api         : /getidocdirectorydetails
       modules     : ('ftp')
       req.parameter: directoryname or (customername)
       response    : list of files from the directory with JSON
       status      : Done
       /*  connect to the ftp server, to get the list of file from the parameter directory (In Angular side for display table data)*/

    3. method           : post
       api              : /moveallidocfiles
       modules          : ('basic-ftp')
       req.parameter    : directoryname or(customer name)
       status           : Done
       /*  check the platform of server
            if: linux
               Connect to the ftp server, 
               Get the file list form the parameter directory, 
               Give the 777 Permission for all file from the directory,
               To Move All file from SourcePath to DestinationPath
            if: window
               Connect to the ftp server, 
               Get the file list form the parameter directory, 
               To Move All file from SourcePath to DestinationPath

        */
    
    4. method           : post
       api              : /moveoneidocfile
       modules          : ('basic-ftp')
       req.parameter    : directoryname or(customername) , filename
       status           : Done
       /*   check the platform of server
            if: linux
               Connect to the ftp server, 
               To check file is exsiting in the directory or Not,
               Give the 777 permission for the parameter file.
               take the backup
               To move the file from SourcePath to DestinationPath
            if:window
               Connect to the ftp server, 
               To check file is exsiting in the directory or Not,           
               take the backup
               To move the file from SourcePath to DestinationPath
        */


IV . Outbound File transfer;-
    1. method      : get
       api         :/getoutbounddirectories
       modules     : ('ftp')
       response    : list of directories from the sourcePath with JSON
       status      : Done
       /* connect to ftp server then file the directory list from the SourcePath (In Angular side for DropDown in editoIdoc page)  */

    2. method      : post
       api         : /getoutbounddirectorydetails
       modules     : ('ftp')
       req.parameter: directoryname or (customername)
       response    : list of file from the directory with JSON
       status      : Done
       /*  connect to the ftp server, to get the list of file from the parameter directory (In Angular side for display table data)*/

    3. method           : post
       api              : /movealloutboundfiles
       modules          : ('basic-ftp')
       req.parameter    : directoryname or(customer name)
       status           : Done
       /*   Connect to the ftp server, 
            Get the file list form the parameter directory, 
            Take the backup for All file,
            To Move All file from SourcePath to DestinationPath
        */
    
    4. method           : post
       api              : /moveoneoutboundfile
       modules          : ('basic-ftp')
       req.parameter    : directoryname or(customername) , filename
       status           : Done
       /*   Connect to the ftp server, 
            To check file is exsiting in the directory or Not,
            Take the backup.
            To move the file from SourcePath to DestinationPath
        */

V . Backup details
      1. method      : get
         api         :/idoctoedilistofdirectory
         modules     : ('ftp')
         response    : list of directories from the sourcePath with JSON
         status      : Done (Not developed from angular side)
         /* connect to ftp server then file the directory list from the SourcePath (In Angular side for DropDown in editoIdoc page)  */

      2. method         :post
         api            : /idoctoedibackuplistoffile
         modules        : ('ftp')
         req.parameter  : directoryname or (customername)
         response       : BACKUP file list 
         status         : Done  (Not developed from angular side)
         /*  connect to the ftp server, to get the list of file from the parameter directory (In Angular side for display table data)*/ 

      3. method      : get
         api         :/outboundbackupdirectorylist
         modules     : ('ftp')
         response    : list of directories from the outbound sourcePath with JSON
         status      : Done (Not developed from angular side)
         /* connect to ftp server then file the directory list from the SourcePath (In Angular side for DropDown in editoIdoc page)  */

      4. method         : post
         api            : /outboundbackuplistoffile
         modules        : ('ftp')
         req.parameter  : directoryname or (customername)
         response       : BACKUP file list 
         status         : Done (Not developed from angular side)
         /*  connect to the ftp server, to get the list of file from the parameter directory (In Angular side for display table data)*/


 VI . Create945 files
      1. method          : Post
         api             : /create945
         req.parameter   : .txt file
         status          : Done
         /* To create the 945 file */

      2. method          : get
         api             : /download945file
         status          : Done
         /*  to download the 945 file*/

VII. Chart Page
    1. method         : post
       api            : /importsalesdata
       modules        : ('mysql'),(csvtojson)
       req            : base64 csv
       status         : Done
       /* to convert base64 to string
       string to csv file formate 
       to connect to the MySql DB,
        Get data from csv file,
        import the data csv to mysql DB       
        */

    2. method         : get
       api            : /Toptencustomers
       modules        : ('mysql')
       status         : Done
       /* to connect the Mysql DB , To get Top ten customer detail*/

   
    3. method         : get
       api            : /ndctable
       modules        : ('mysql')
       status         : Done
       /*to connect the Mysql DB , To get total of ndc and ndc Amount*/

VIII. CASH_APPLICATION UPLOAD OUTSTANDING

   1.method           : get
      api             :/cashappuploaddata
      req.parameter   : customername and excel data in base64.
      modules         : ('mysql')
      status          : Done
      /*Based on the customer name data will import in database*/

IX. 940 files api

   1.methos         : get
      api           :/get940filelist
      module         :ssh2-sftp-client
      status         : Done
      /*Get 940 file list from the sourePath*/

   2.method          :post
      api            :/moveone940file
      module         :ssh2-sftp-client
      status         : Done
      /* move one file

   3.method         : post
      api           : /moveall940file
      module        : ssh2-sftp-client
      status        : Done
      /* Move all file
