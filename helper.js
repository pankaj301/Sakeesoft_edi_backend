
const ftp = require("basic-ftp");
const ftpconfig = require('../config_file/config');
const ftpServer = {
  host:  ftpconfig.ftpserver.host,
  user: ftpconfig.ftpserver.user,
  password: ftpconfig.ftpserver.password,
  protocol:ftpconfig.ftpserver.protocol          
};
async function getServerPlatform() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    await client.access(ftpServer);
    const response = await client.send("SYST");
    const Platform = response.message;
    if(Platform == '215 Windows_NT' ){
      return 'Windows';
    } else if( Platform =='215 UNIX Type: L8' ){
      return 'Linux';
    }else {
      return Platform;
    }
   
  } catch (error) {
    console.error("connecting to FTP server:", error);
    client.close();
    res.send({"status":"404",
                "message":"Error connecting to FTP server:" });
   
  } finally {
    
  }
}
module.exports = { getServerPlatform };









