import { compare, hash } from "bcrypt";

export const generateHash = async (plainText: string, saltRound: number = Number(process.env.SALT)): Promise<string> => {
    return hash(plainText, saltRound);
};

export const compareHash = async (plainText: string, hashValue: string): Promise<boolean> => {
    return compare(plainText, hashValue);
};