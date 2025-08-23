import jwt from 'jsonwebtoken';


export const generateToken = async ({ payLoad = {}, signature = "",
    options = { expiresIn: 0 } } = {}) => {
    return jwt.sign(payLoad, signature, options);
};
