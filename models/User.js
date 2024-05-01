const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const User = mongoose.model('User', {
    _id: {
        type: String,
        default: () => uuidv4().replace(/\-/g, ''),
    },

    name: String,
    email: String,
    password: String
});

module.exports = User