const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true
    },
    priority: {
        type: Number,
        required: true,
        enum: [0, 1, 2]
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
