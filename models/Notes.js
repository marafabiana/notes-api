const mongoose = require('mongoose');

const Note = mongoose.model('Note', {
    title: {
        type: String,
        required: true,
        maxlength: 50
    },
    text: {
        type: String,
        required: true,
        maxlength: 300
    },
    user: {
        type: String,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    modifiedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = Note