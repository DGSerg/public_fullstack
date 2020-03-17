const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const keys = require('../config/keys');
const errorHandler = require('../utils/errorHandler');

module.exports.login = async function (req, res) {
    const candidate = await User.findOne({email: req.body.email});

    if (candidate){
        const passResult = bcrypt.compareSync(req.body.password, candidate.password);
        if (passResult){
            const token = jwt.sign({
                email: candidate.email,
                userId: candidate._id
            }, keys.jwt, {expiresIn: 60*60});
            res.status(200).json({
                token: `Bearer ${token}`
            })
        } else {
            res.status(401).json({
                message: 'The password is incorrect'
            })
        }
    }else {
        res.status(404).json({
            message: 'User cannot be found.'
        })
    }

};

module.exports.register = async function (req, res) {
    // email password
    const candidate = await User.findOne({email: req.body.email});

    if (candidate) {
        res.status(409).json({
            message: 'This email already exists'
        });
    } else {
        const salt = bcrypt.genSaltSync(10);
        const pass = req.body.password
        const user = new User({
            email: req.body.email,
            password: bcrypt.hashSync(pass, salt)
        });
        try {
            await user.save();
            res.status(201).json({
                message: 'User has been created'
            })
        }catch (e) {
            errorHandler(res, e)
        }

    }
};