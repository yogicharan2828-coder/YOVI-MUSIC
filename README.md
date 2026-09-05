🎵 YOVI Music

AI-First Music Streaming & Social Listening Platform

YOVI Music is a modern full-stack music streaming and social listening platform designed to provide a personalized and interactive music experience. The platform combines multi-provider music discovery, personalized recommendations, audio playback, YouTube video integration, lyrics, playlists, and real-time collaborative Jam sessions into a unified music experience.

YOVI is built with a scalable React + FastAPI architecture and integrates multiple music services while using caching, normalized provider responses, and asynchronous API requests to provide fast and reliable music discovery.

🚀 Live Demo: https://yovi-music.netlify.app/
After staring the webpage pls wait for a minute as render takes 60 -90 seconds to start free tier services

📌 Features

🎵 Music Discovery
Search songs across multiple music providers
Unified music search experience
JioSaavn integration
iTunes integration
YouTube music/video search
Provider result normalization
Duplicate song detection and merging
Fast asynchronous provider requests
API response caching
Album and song metadata
Artist and album information
Search history
Responsive search experience


▶️ Music Playback

Full Now Playing experience
Song playback controls
Play / pause
Previous / next
Seek through songs
Progress tracking
Queue management
Volume controls
Shuffle and repeat controls
Current song state management
Responsive music player
Mobile-optimized playback interface
🎧 Personalized Music Experience

Personalized Home experience
User-specific music discovery
Recommendation-driven music sections
Listening-based recommendations
Personalized song discovery
Recommendation system designed around user listening behavior
📺 YouTube Video Experience

Integrated YouTube music video experience
YouTube song/video search
Video playback inside the music experience
Current-song video integration
Responsive mobile video layout
Separate video and playback control experience
📝 Lyrics

Song lyrics search
Dedicated lyrics panel
Lyrics integrated into the Now Playing experience
Responsive lyrics interface
Mobile-friendly lyrics experience

👥 Real-Time Jam


YOVI's Jam feature enables users to listen to music together in a shared session.

Create Jam sessions
Join existing Jam sessions
Real-time session state
Synchronized playback experience
Host and guest roles
Guest playback permissions
Collaborative queue
Song-change permissions
Shared listening experience
Real-time room interactions

The Jam architecture is designed to allow multiple users to participate in the same music session while maintaining synchronized playback state.

📚 Library & Playlists

Save songs to personal library
Playlist management
Add songs to playlists
Queue-based listening
Personal music organization
Recently played music
📱 Responsive Design

Desktop music experience
Mobile-responsive interface
Mobile Now Playing experience
Mobile lyrics interface
Mobile YouTube video experience
Responsive navigation
Adaptive music controls
Touch-friendly controls

🧠 Recommendation System

YOVI includes a personalized recommendation layer designed to improve music discovery based on user preferences and listening behavior.

The recommendation system is intended to move beyond basic keyword-based search by helping users discover music that matches their individual listening patterns.

Recommendation workflow
User interacts with songs and music content.
Relevant listening/preferences data is considered by the recommendation system.
Music preferences are processed to identify relevant patterns.
Candidate songs are generated.
Recommendations are presented through the personalized YOVI experience.
Continued interaction can provide additional signals for future recommendations.

🛠️ Tech Stack
Frontend
React.js
Vite
JavaScript
CSS
React Context
Axios
Lucide React
Responsive UI
Backend

Python
FastAPI
Pydantic
REST APIs
AsyncIO
HTTPX
Music Services

JioSaavn API
iTunes Search API
YouTube integration
Database & Authentication

Supabase
PostgreSQL
User authentication
Persistent user data

AI & Recommendation
Personalized recommendation system
Listening-based recommendation logic
User preference processing
Caching & Performance
Backend API caching
Provider response caching
Asynchronous API requests
Result normalization
Duplicate result detection
Provider fallback/merging
Deployment & Tools
Git
GitHub
VS Code
Netlify
Render
Supabase

📂 Project Structure

YOVI-MUSIC/

│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── contexts/
│   ├── services/
│   ├── hooks/
│   ├── styles/
│   └── assets/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   │       └── music/
│   │
│   └── main.py
│
└── README.md

🔍 How It Works

Music Search Workflow
User searches for a song through the YOVI frontend.
The request is sent to the FastAPI backend.
YOVI queries supported music providers asynchronously.
Provider responses are normalized into a common format.
Duplicate results are identified and merged.
Cached results are reused when available.
The unified results are returned to the frontend.
The user can select a song and start the music experience.

🎧 Playback Workflow

User selects a song.
YOVI loads the selected song into the player.
Player state is maintained across the music experience.
Users can play, pause, seek, skip, and manage the queue.
The Now Playing interface updates according to the current playback state.
Additional experiences such as lyrics and YouTube video can be opened for the current song.

👥 Jam Workflow

User creates a Jam session.
A unique Jam session is created.
Other users can join the session.
Participants receive the shared session state.
Host and guest permissions determine available controls.
Playback and queue interactions are synchronized through the Jam system.
Participants can listen to music together in the shared session.

📺 YouTube Workflow

User searches for or selects a song.
YOVI identifies the corresponding YouTube content.
The video is loaded through the official YouTube player.
The video is displayed inside the YOVI music experience.
The responsive player adapts to desktop and mobile layouts.
⚡ Performance & Reliability

YOVI was designed to minimize unnecessary network overhead.

Implemented optimizations
Asynchronous music-provider requests
API response caching
Normalized provider responses
Duplicate result merging
Limited provider retries
Graceful provider failure handling
Direct JioSaavn API integration

The JioSaavn integration was later moved directly into the main YOVI backend instead of using a separate Render service. This removed an unnecessary backend-to-backend network hop and improved search responsiveness.

📱 Mobile Experience

YOVI includes a dedicated responsive experience rather than simply scaling the desktop UI down.

Mobile-specific improvements include:

Responsive Now Playing panel
Touch-friendly playback controls
Mobile lyrics navigation
Taller mobile video experience
Responsive queue controls
Mobile search experience
Adaptive layouts for smaller screens
🚀 Future Enhancements

YOVI is designed to continue evolving into a complete real-time music platform.

📱 Native Mobile Application

Develop a dedicated real-time Android/mobile application using:

React Native
Expo
Native background audio
Lock-screen playback
Bluetooth/media controls
💬 Real-Time Jam Chat

Add real-time messaging directly inside Jam sessions so participants can communicate while listening together.

🎧 Advanced Social Listening
Live reactions
Currently-listening indicators
Improved collaborative queue
Richer host/guest controls
Jam activity feed
🤖 Advanced Recommendations
Improved recommendation models
More listening signals
Better personalization
Context-aware recommendations
Smarter discovery
🔔 Social Notifications
Jam invitations
Friend activity
Playlist sharing
Listening activity
Social notifications
🌟 Key Highlights
AI-First Music Streaming Platform
React + FastAPI Full-Stack Architecture
Multi-Provider Music Search
JioSaavn Integration
iTunes Integration
YouTube Integration
Personalized Recommendation System
Real-Time Jam Sessions
Collaborative Music Listening
Synchronized Playback Experience
Lyrics Integration
YouTube Video Experience
Queue Management
Search History
API Caching
Provider Result Normalization
Responsive Desktop & Mobile UI
Supabase Integration
RESTful Backend APIs
Cloud Deployment
Netlify Frontend
Render Backend
📌 Architecture Highlights

YOVI was designed around a provider-independent music architecture.

Instead of tightly coupling the application to a single music provider, each provider follows a common music-provider contract. This allows YOVI to normalize different provider responses and combine them into a unified experience.

This architecture also makes it easier to add additional music providers in the future without rewriting the entire frontend.

⚙️ Installation
Clone the repository
git clone YOUR_YOVI_GITHUB_REPOSITORY
Navigate to the project
cd YOVI-MUSIC
Backend Setup
cd backend

Create a virtual environment:

python -m venv venv

Activate it on Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Start the FastAPI server:

uvicorn app.main:app --reload
Frontend Setup
cd ../frontend/frontend

Install dependencies:

npm install

Start the development server:

npm run dev

Open:

http://localhost:5173

🔑 Environment Variables

Create the required environment configuration for the backend and frontend.

Example:

DATABASE_URL=your_database_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
YOUTUBE_API_KEY=your_youtube_api_key

Use the actual variables from the final YOVI repository when publishing the README. Never commit secret API keys.

📡 API Documentation

YOVI provides REST APIs through FastAPI.

Major API areas include:

Authentication
GET  /auth/me
POST /auth/register
POST /auth/login
Music
GET /music/search
GET /music/youtube/search
GET /music/youtube/health
YouTube
GET /youtube/search
Player
GET  /player/state
POST /player/load
POST /player/play
POST /player/pause
POST /player/seek
Lyrics
GET /lyrics/search
Jam Sessions
POST /jam/create
POST /jam/{session_id}/join

The uploaded YOVI API documentation confirms these core API areas and endpoints.

👨‍💻 Author

Yogi Charan Sharma

Portfolio:
https://yogicharansharma.netlify.app/

LinkedIn:
https://www.linkedin.com/in/yogi-charan-sharma-235b62282/

GitHub:
https://github.com/yogicharan2828-coder/

if you like the work pls drop a star and support 
