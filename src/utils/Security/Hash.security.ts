import bcryptjs from "bcryptjs";

export const generateHash = async ({ plainText = "", saltRound = process.env.SALT } = {}) => {
    return bcryptjs.hashSync(plainText, parseInt(saltRound as string));
};

export const compareHash = async ({ plainText = "", hashValue = "" } = {}) => {
    return bcryptjs.compareSync(plainText, hashValue);
};