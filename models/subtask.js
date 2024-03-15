const mongoose = require('mongoose');

const subTaskSchema = new mongoose.Schema({
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    status: {
        type: Number,
        required: true,
        enum: [0, 1],
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    deleted_at: {
        type: Date,
        default: null
    }
});

const SubTask = mongoose.model('SubTask', subTaskSchema);

module.exports = SubTask;
