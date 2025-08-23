import CryptoJS from "crypto-js";

export const generateEncryption = async ({ plainText = "", secretKey = process.env.ENCRYPTION_KEY } = {}) => {
    return CryptoJS.AES.encrypt(plainText, secretKey as string).toString();
};

export const decryptEncryption = async ({ cipherText = "", secretKey = process.env.ENCRYPTION_KEY } = {}) => {
    return CryptoJS.AES.decrypt(cipherText, secretKey as string).toString(CryptoJS.enc.Utf8);
};