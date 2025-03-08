import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    //   required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/.+\@.+\..+/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    mobile_number:String,
    age:Number,
    dob:Date,
    googleid:String,
    verificationCode: String,
    verificationCodeExpires: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


// Pre-save middleware to hash password and calculate age
UserSchema.pre('save', async function (next) {
    // Hash the password only if it has been modified or is new
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  
    // Calculate age if dob is provided
    if (this.dob) {
      const today = new Date();
      const birthDate = new Date(this.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if the birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
  
      this.age = age; // Set the calculated age
    }
  
    next();
  });

// This function will match the actual passsword with the 
// enteredPassword or the password passed in the function
// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//  Generate JWT token
UserSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export default mongoose.model('User', UserSchema);
