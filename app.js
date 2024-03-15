const express = require("express")
const cors=require("cors")
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');


const app = express()
app.use(cors())
app.use(bodyParser.json());

mongoose.connect("mongodb://localhost:27017/taskmanagemenetDB")
.then(()=>{console.log("connected to DB");

app.listen(3000,()=>console.log("server is listening on port 3000"))})
.catch((err)=>console.log(err))

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    priority: { type: Number, required: true },
  });
  
const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["TODO", "IN_PROGRESS", "DONE"], default: "TODO" },
    priority: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  });
  
const subTaskSchema = new mongoose.Schema({
    task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    status: { type: Number, enum: [0, 1], default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null },
  });

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);
const SubTask = mongoose.model('SubTask', subTaskSchema);

app.post("/register", async (req, res) => {
    const { username, password, phoneNumber, priority } = req.body;
  
    try {
      // Check if the user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).send("User already exists");
      }
  
      // Validate password length
      if (password.length < 6) {
        return res.status(400).send("Password is too short");
      }
  
      // Hash the password and create the user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, password: hashedPassword, phoneNumber, priority });
      await newUser.save();
      
      res.status(201).send("User created successfully");
    } catch (err) {
      console.error("Error registering user:", err);
      res.status(500).send("Internal Server Error");
    }
  });



  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Find user in the database
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).send('Invalid password');
        }

        // Generate JWT token
        const accessToken = jwt.sign({ userId: user._id }, "SECRET_KEY");
        
        // Send token in response
        res.json({ accessToken });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    console.log("Token:", token);
    if (!token) return res.status(401).send("Access Denied");

    jwt.verify(token, "SECRET_KEY", (err, user) => {
        if (err) {
            console.error("JWT verification error:", err);
            return res.status(403).send("Invalid token");
        }
        console.log("Decoded user:", user);
        req.user = user;
        next();
    });
};

  // Function to get user ID by username
// const getUserIdByUserId = async (userId) => {
//     try {
//         console.log("Searching for user with userId:", userId);
//         const user = await User.findById(userId);
//         console.log("Found user:", user);
//         return user ? user._id : null;
//     } catch (error) {
//         console.error("Error retrieving user ID by userId:", error);
//         throw error;
//     }
// };


// GET tasks for a particular user with optional filtering by priority, due date, and proper pagination
app.get("/tasks", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId; // Extract userId from decoded token
        let { priority, dueDate, page, limit } = req.query;

        // Set default values for page and limit
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;

        // Construct query based on userId and optional filters
        const query = { userId };
        if (priority) {
            query.priority = parseInt(priority);
        }
        if (dueDate) {
            query.dueDate = new Date(dueDate);
        }

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Fetch tasks based on query, skip, and limit
        const tasks = await Task.find(query)
            .skip(skip)
            .limit(limit);

        res.status(200).json(tasks);
    } catch (err) {
        console.error("Error fetching tasks:", err);
        res.status(500).send("Internal Server Error");
    }
});


  
  // Create task
app.post("/tasks", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId; // Extract userId from decoded token
      console.log("Decoded user:", req.user);
      console.log("Searching for user with userId:", userId);
      
      const { title, description, dueDate, priority } = req.body;
      
      // Assuming Task is your Mongoose model for tasks
      const task = new Task({ title, description, dueDate, priority, userId });
      await task.save();
      
      res.status(201).json(task);
    } catch (err) {
      console.error("Error creating task:", err);
      res.status(500).send("Internal Server Error");
    }
});

// GET THE TASKS FOR A PARTICULAR USER
app.get("/tasks", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId; // Extract userId from decoded token

        // Find tasks associated with the userId
        const tasks = await Task.find({ userId });

        // Send tasks as response
        res.status(200).json(tasks);
    } catch (err) {
        console.error("Error fetching tasks:", err);
        res.status(500).send("Internal Server Error");
    }
});

  

// API endpoint to create a subtask
app.post("/subtasks", async (req, res) => {
    try {
        // Extract task_id from the request body
        const { task_id } = req.body;

        // Validate task_id
        if (!task_id) {
            return res.status(400).json({ error: "Task ID is required" });
        }

        // Create a new subtask with the provided task_id
        const subTask = new SubTask({ task_id });

        // Save the subtask to the database
        await subTask.save();

        // Send the response
        res.status(201).json(subTask);
    } catch (error) {
        console.error("Error creating subtask:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update task
app.put("/tasks/:taskId", authenticateToken, async (req, res) => {
  try {
      const { taskId } = req.params;
      const { dueDate, status } = req.body;

      // Find the task by ID
      const task = await Task.findById(taskId);
      if (!task) {
          return res.status(404).send("Task not found");
      }

      // Update task fields if provided
      if (dueDate) {
          task.dueDate = dueDate;
      }
      if (status) {
          task.status = status;
      }

      // Save the updated task
      await task.save();

      res.status(200).json(task);
  } catch (err) {
      console.error("Error updating task:", err);
      res.status(500).send("Internal Server Error");
  }
});

// Update subtask
app.put("/subtasks/:subtaskId", async (req, res) => {
  try {
      const { subtaskId } = req.params;
      const { status } = req.body;

      // Find the subtask by ID
      const subtask = await SubTask.findById(subtaskId);
      if (!subtask) {
          return res.status(404).send("Subtask not found");
      }

      // Update subtask status if provided
      if (status !== undefined && (status === 0 || status === 1)) {
          subtask.status = status;
      } else {
          return res.status(400).send("Invalid status value");
      }

      // Save the updated subtask
      await subtask.save();

      res.status(200).json(subtask);
  } catch (err) {
      console.error("Error updating subtask:", err);
      res.status(500).send("Internal Server Error");
  }
});

// Delete Task
app.delete("/tasks/:taskId", authenticateToken, async (req, res) => {
  try {
      const taskId = req.params.taskId;

      // Check if the task exists
      const task = await Task.findById(taskId);
      if (!task) {
          return res.status(404).json({ error: "Task not found" });
      }

      // Delete the task from the database
      await Task.deleteOne({ _id: taskId });

      res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
      console.error("Error deleting task:", err);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Subtask
app.delete("/subtasks/:subtaskId", async (req, res) => {
    try {
        const subtaskId = req.params.subtaskId;
  
        // Check if the subtask exists
        const subtask = await SubTask.findById(subtaskId);
        if (!subtask) {
            return res.status(404).json({ error: "Subtask not found" });
        }
  
        // Delete the subtask from the database
        await SubTask.deleteOne({ _id: subtaskId });
  
        res.status(200).json({ message: "Subtask deleted successfully" });
    } catch (err) {
        console.error("Error deleting subtask:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

app.get("/",(req,res)=>{
    res.send("Hello Server 101");
})
