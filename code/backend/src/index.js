import express from "express" ;
import bcrypt from "bcryptjs"
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/User.js"; 
import passport  from './config/passport.js';
import authRoutes from './routes/authRoutes.js';


const app = express();

// Allow all cross-origin requests (Temporary setup) -- In permanent setup we try to allow request only from frontend ..
app.use(cors());

// Initialize Passport middleware
app.use(passport.initialize());

dotenv.config()
connectDB()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));


app.use('/api/users',userRoutes)
app.use('/auth',authRoutes);
// app.use('/sentiment_analysis',sentimentAnalysisRoutes);

connectDB().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Local URL: http://localhost:${PORT}`);
      console.log(`Using Ngrok URL: ${process.env.ngrok_base_url}`);
      console.log(`Google OAuth callback: ${process.env.GOOGLE_CALLBACK_URL}`);
      console.log('Make sure you have configured this URL in your Google Cloud Console');
    });
  }).catch(error => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1); // Stop the process if DB connection fails
  });
