const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    due_date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['TODO', 'IN_PROGRESS', 'DONE'],
        default: 'TODO'
    },
    priority: {
        type: Number,
        required: true,
        enum: [0, 1, 2, 3]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
