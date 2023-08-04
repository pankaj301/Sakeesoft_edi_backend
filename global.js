function decodePassword(encodedPassword) {
    
    const decodedPassword = Buffer.from(encodedPassword, 'base64').toString('utf8');
    return decodedPassword;
  }
  
  module.exports = decodePassword;