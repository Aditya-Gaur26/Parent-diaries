# Instructions to Run This Code

## Setup Steps

1) **Start ngrok for exposing the backend**
   - Open a terminal and run: `ngrok http 4444`
   - Copy the https URL provided by ngrok (e.g., https://abc123.ngrok.io)
   - You'll need this URL in the next steps for environment variables

2) **Configure Environment Variables**
   - Get the required .env files for both backend and frontend
   - Update the backend .env file with the ngrok URL
   - Update the frontend .env file with the ngrok URL
   - For Google login functionality, add the ngrok URL to Google Developer Console as an authorized redirect URI

3) **Start the Backend Server**
   - Navigate to the backend directory: `cd code/backend`
   - Run the server using: `nodemon index.js`

4) **Run the Frontend Application**
   - Navigate to the frontend directory: `cd code/frontend/MyApp`
   - Start the application: `npm start`
   - Download the Expo Go app on your mobile device
   - Scan the QR code to launch the app
   - Ensure your mobile device and laptop are connected to the same WiFi network

## Backend Overview
- Built with Express.js, Node.js, and MongoDB.
- Includes middleware for request parsing, authentication, logging, error handling, and file uploads.
- Utilizes a microservice-like approach with modular routes for ASR, TTS, LLM, vaccination, and user services, promoting scalability and easier maintenance.

### Architecture
The backend is built with Express.js and Node.js, using MongoDB as the database. It follows a modular structure with routes, controllers, models, and middleware components.

### Core Features

#### User Management
- **Authentication**: Email/password login, Google OAuth integration
- **Profile Management**: User profiles with children information
- **Subscription Handling**: Free/premium subscription management

#### Child Health Management
- **Child Profiles**: Store and manage multiple children's information
- **Vaccination Tracking**: Comprehensive vaccination schedules and records
- **Medical History**: Track allergies and medical conditions

#### AI & Speech Services
- **Speech-to-Text (ASR)**: Convert audio recordings to text using OpenAI Whisper
- **Text-to-Speech (TTS)**: Generate spoken audio from text responses
- **Language Models (LLM)**: Powered by GPT-4o for intelligent responses
- **Speech-to-Speech**: End-to-end voice conversation capabilities
- **Chat Sessions**: Persistent conversation history and management

### API Endpoints

The backend exposes several main API routes:
- `/api/users`: User authentication and profile management
- `/auth`: OAuth authentication flows (Google)
- `/asr`: Audio Speech Recognition endpoints
- `/llm`: Language Learning Model interactions
- `/tts`: Text-to-Speech conversion
- `/speech2speech`: End-to-end voice conversation
- `/vaccination`: Vaccination record management

### Technologies
- **Express.js**: Web framework
- **MongoDB/Mongoose**: Database and ORM
- **Passport.js**: Authentication middleware
- **JWT**: Token-based authentication
- **OpenAI API**: For AI capabilities (GPT-4o, Whisper, TTS)
- **Multer**: File upload handling

## Detailed Backend Report

Below is an outline of the backend structure, highlighting key files and their roles:

### config Folder
• passport.js – Sets up and configures Passport.js for authentication.  
• db.js – Establishes and configures the MongoDB connection.

### models Folder
• User.js – Defines the User schema, including password hashing, JWT logic, and verification codes.  
• Vaccination.js – Stores vaccination records, including disease, dose, and date details.  
• Subscription.js – Manages subscription plans (free/premium), renewal options, and payment history.  
• Report.js – Holds bug/issue reports created by users for tracking and resolution.  
• ChatSession.js & ChatHistory.js – Manages chat session metadata and conversation transcripts for the LLM.

### controllers Folder
• User.js – Handles onboarding (signup, login), profile changes, email verification, subscriptions, and more.  
• vaccination.js – Manages vaccine records, schedules, and retrieving vaccination metadata.  
• tts.js – Integrates with OpenAI for text-to-speech functionalities.  
• llm.js – Orchestrates chatbot sessions, storing and retrieving conversation histories.  
• asr.js – Implements audio transcription logic using OpenAI’s Whisper API.

- Controllers further separate business logic from the route handlers, keeping the code clean and modular.  
- Middlewares include Passport for OAuth, logger for requests, and custom error handling.  
- Database interactions use Mongoose for schema definitions, validations, and advanced query building with indexes.  
- For real-time or scheduled tasks, consider using CRON jobs or similar mechanisms to update vaccination reminders or subscription statuses.

### services Folder
• send_otp.js & send_reset_otp.js – Responsible for sending verification or reset codes via email.

### utils Folder
• vaccinationSchedule.js – Contains helper functions to generate or manage vaccination charts and schedules.

### routes Folder
• authRoutes.js – Defines routes for OAuth-based logins.  
• asr.js, tts.js, llm.js, speech2speech.js – Exposes endpoints for ASR, TTS, language model interactions, and speech-to-speech.  
• User.js & vaccination.js – Provides user profile/endpoints and vaccination management endpoints.

### index.js
• Entrypoint of the backend. Initializes Express, applies middleware, sets up routes, and starts the server.


### Note : For a detailed documentation refer to docs folder

## Frontend Overview
- Created with React Native and Expo for a cross-platform mobile experience.
- Leverages a combination of functional components and hooks (useState, useEffect, useRouter) for state and navigation.

The frontend is developed using React Native with Expo. Each screen component serves a distinct user flow, from authentication to managing children's health data. It communicates with the backend via REST APIs and uses async storage for local caching.

## Detailed Frontend Report
• voice-chat.tsx, chat2.tsx – Implements AI-based chat, speech-to-speech, TTS, and node-based conversation flows.  
• vaccination.tsx, manage-children.tsx, growth-tracker.tsx – Tracks child data, vaccination schedules, and growth metrics.  
• login.tsx, email-signup.tsx, email-verification.tsx, forgotPassword.tsx, resetPassword.tsx, complete-registration.tsx – Handles user authentication, account creation, and credential recovery.  
• homeScreen.tsx, history.tsx, settings.tsx, upload_prescription.tsx, edit-profile.tsx – Provides features like user settings, medical history, prescription uploads, and profile editing.

- Each screen (e.g., “manage-children.tsx”) uses local state to capture user input, while advanced features (e.g., voice-chat) integrate directly with device audio APIs.  
- Redux (or Context API) can be applied for global state management (currently not shown here).  
- Custom hooks can be added to handle repeated logic such as fetching remote data, updating local storage, or managing chat sessions.

