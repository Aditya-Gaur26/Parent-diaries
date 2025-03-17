import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Child schema embedded directly in User schema
const ChildSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: null
  },
  medicalConditions: [{
    type: String
  }],
  allergies: [{
    type: String
  }]
}, { _id: true }); // Ensure each child gets an _id

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
    mobile_number: String,
    age: Number,
    dob: Date,
    googleid: String,
    verificationCode: String,
    verificationCodeExpires: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
    forgotPasswordCode: String,
    forgotPasswordCodeExpires: Date,
    notificationSettings: {
      pushEnabled: {
        type: Boolean,
        default: true
      },
      emailEnabled: {
        type: Boolean,
        default: true
      },
      notificationTypes: {
        newMessages: {
          type: Boolean,
          default: true
        },
        reminders: {
          type: Boolean,
          default: true
        },
        updates: {
          type: Boolean,
          default: true
        },
        marketingEmails: {
          type: Boolean,
          default: false
        },
        activitySummary: {
          type: Boolean,
          default: true
        }
      }
    },
    
    // Simplify subscription to just the type
    subscriptionType: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    // Add children array to User schema
    children: [ChildSchema],
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

UserSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export default mongoose.model('User', UserSchema);
