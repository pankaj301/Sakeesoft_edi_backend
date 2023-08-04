var nodemailer = require('nodemailer');

    var transporter = nodemailer.createTransport({
// mail.HOST=smtp.gmail.com
// mail.PORT=465
// mail.user=sakeesoft.testemail@gmail.com
// mail.PASSWORD = kklmmpooqwmkmhsc\r\n
// mail.from=sakeesoft.testemail@gmail.com 
        service: 'gmail',
        auth: {
          user: 'sakeesoft.testemail@gmail.com',
          pass: 'kklmmpooqwmkmhsc\r\n'
        }
      });
      
      var mailOptions = {
        from: 'sakeesoft.testemail@gmail.com ',
        to: 'indhuja@sakeesoft.com',
        subject: 'sas Updated Message',
        text: 'File Uploaded and converted to the ISO date format'
      };
async function getmailer() {   
   transporter.sendMail(mailOptions,async function (error, info) {
           if (error) {
               console.log(error);
               return 'failed';
           } else {
               console.log('Email sent: ' + info.response);
              return 'sucess';
           }
       });
    
  }
  module.exports = { getmailer };