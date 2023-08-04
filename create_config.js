const { MongoClient } = require('mongodb');

// Replace the connection string with your MongoDB URI
const mongoURI = 'mongodb://192.168.1.9:27017/Lifestar_edi';

async function getSecretValueFromMongoDB() {
  try {
    const client = await MongoClient.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = client.db();
    const collection = db.collection('Credentials');

    // Assuming you have a document with a field 'secretValue'
    const document = await collection.findOne({ user: 'root' });

    if (document) {
      // return document.password;
      return document;

    } else {
      throw new Error('Secret value not found in the database.');
    }
  } catch (error) {
    console.error('Error fetching secret value from MongoDB:', error);
    throw error;
  }
}


const fs = require('fs');

async function writeConfigFile(secretValue) {
  try {
    const config = `module.exports = {
      ftpserver:{
        password: decodePassword("${secretValue.password}"),
        username: "${secretValue.user}",
        host: "${secretValue.host}",
        port: "${secretValue.port}"
      }
    };`;
    console.log(__dirname);
    fs.writeFileSync(__dirname + '/config_file/newconfig.js', config);
    console.log('Config file successfully created.');
  } catch (error) {
    console.error('Error writing config file:', error);
    throw error;
  }
}


async function main() {
  try {
    const secretValue = await getSecretValueFromMongoDB();
    await writeConfigFile(secretValue);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();