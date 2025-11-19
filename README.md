# 🇰🇪 Kenya Chat Connect - Real-Time Chat Application

![Kenya Chat Connect](https://img.shields.io/badge/Kenya-Chat%20Connect-green?style=for-the-badge&color=006600)
![React](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7.0-white?style=for-the-badge&logo=socket.io)
![Node.js](https://img.shields.io/badge/Node.js-18.0-green?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

A full-stack real-time chat application built with React, Node.js, and Socket.io featuring Kenyan-themed design and advanced chat functionalities. Connect with Kenyans worldwide in real-time with a beautiful, responsive interface.

## 🎯 Features

### ✅ Core Chat Functionality
- **Real-time Messaging** - Instant message delivery across all connected clients
- **User Authentication** - Simple username-based registration system
- **Multiple Chat Rooms** - Kenyan-themed rooms: General, Nairobi, Mombasa, Kisumu, Coastal
- **Online User Presence** - See who's online in real-time
- **Typing Indicators** - Visual feedback when users are typing
- **Message Timestamps** - All messages include sender and time information

### 🔒 Advanced Features
- **Private Messaging** - 1-on-1 private conversations between users
- **File & Image Sharing** - Upload and share files with automatic previews
- **Message Reactions** - Express yourself with emoji reactions (👍, ❤️, 😂, 😮, 😢, 👏)
- **Read Receipts** - See who has read your messages
- **Message Search** - Search through chat history by content, user, or files

### 🔔 Smart Notifications
- **Sound Alerts** - Custom notification sounds for new messages
- **Browser Notifications** - Desktop notifications when app is in background
- **Unread Message Counts** - Visual indicators for unread messages
- **Smart Notification Logic** - No self-notifications, context-aware alerts

### 📱 Performance & UX
- **Mobile Responsive** - Beautiful on all devices and screen sizes
- **Message Pagination** - Load older messages with "Load More" button
- **Auto-reconnection** - Automatic recovery from network disruptions
- **Performance Optimized** - React.memo, useCallback, and useMemo implementations
- **Kenyan-themed Design** - Beautiful color scheme inspired by Kenyan flag

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/kenya-chat-connect.git
cd kenya-chat-connect
Setup Backend

bash
cd server
npm install
npm start
# Server runs on http://localhost:5001
Setup Frontend

bash
cd client
npm install
npm start
# Client runs on http://localhost:3000
Open your browser and navigate to http://localhost:3000

🛠️ Technology Stack
Frontend
React 18.2.0 - Modern UI framework with hooks

Socket.io-client 4.7.0 - Real-time bidirectional communication

CSS3 - Custom Kenyan-themed styling with animations

React Hooks - useState, useEffect, useCallback, useMemo, useRef

Backend
Node.js - JavaScript runtime environment

Express.js 4.18.0 - Minimal web framework

Socket.io 4.7.0 - Real-time engine for WebSocket communication

CORS - Cross-origin resource sharing middleware

📁 Project Structure
text
kenya-chat-connect/
├── client/                 # React frontend application
│   ├── public/            # Static files
│   ├── src/
│   │   ├── App.js         # Main application component
│   │   ├── App.css        # Kenyan-themed styles and animations
│   │   └── index.js       # React application entry point
│   └── package.json       # Frontend dependencies and scripts
├── server/                 # Node.js backend application
│   ├── server.js          # Socket.io server and Express setup
│   └── package.json       # Backend dependencies and scripts
├── screenshots/           # Application screenshots
├── README.md              # Project documentation
└── SUBMISSION_CHECKLIST.md # Development progress tracker
🎮 How to Use
Getting Started
Register: Enter your preferred username on the welcome screen

Choose Room: Select from multiple Kenyan-themed chat rooms

Start Chatting: Send messages, share files, and react to conversations

Advanced Features
Private Chat: Click on any online user to start a private conversation

File Sharing: Use the paperclip icon (📎) to attach and share files

Message Reactions: Click emojis below messages to add reactions

Search: Use the search icon (🔍) to find specific messages or files

Notifications: Toggle sound and browser notifications with the bell icon (🔔)

Room Descriptions
🌍 General - Main chat room for all users

🏙️ Nairobi - Discuss Kenya's capital city and central region

🏖️ Mombasa - Coastal topics and beach discussions

🐟 Kisumu - Lake Victoria region and western Kenya

🌊 Coastal - General coastal and marine topics

🔌 API & Socket Events
Socket Events Emitted (Client → Server)
register - User registration with username

chat message - Send public room messages

private message - Send private messages to specific users

file message - Share files and images

typing / stop typing - Typing indicator management

message reaction - Add emoji reactions to messages

message read - Mark messages as read

join room - Switch between chat rooms

Socket Events Received (Server → Client)
chat message / file message - New message notifications

private message - Private message delivery

user joined / user left - User presence updates

typing / stop typing - Typing indicator updates

message reaction - Reaction updates

message read - Read receipt updates

room users - Room-specific user lists

🎨 Design Philosophy
Kenyan Theme
Color Scheme: Inspired by Kenyan flag (Black, Red, Green, White, Gold)

Cultural Elements: Kenyan patterns and motifs throughout the interface

Local Relevance: Room names based on Kenyan regions and cities

User Experience
Intuitive Interface: Clean, modern design with clear visual hierarchy

Responsive Design: Seamless experience across desktop, tablet, and mobile

Accessibility: Keyboard navigation and screen reader friendly

Performance: Optimized rendering and efficient state management

🚀 Deployment
Backend Deployment (Render/Railway/Heroku)
bash
# Set environment variables
PORT=5001
NODE_ENV=production

# Deploy with your preferred platform
Frontend Deployment (Vercel/Netlify)
bash
cd client
npm run build
# Deploy the 'build' folder to your platform
Environment Variables
env
# Backend (.env)
PORT=5001
NODE_ENV=production

# Frontend (build-time)
REACT_APP_SERVER_URL=https://your-backend-url.herokuapp.com
📸 Screenshots
Login Screen	Main Chat	Private Messaging
https://screenshots/login.png	https://screenshots/main-chat.png	https://screenshots/private-chat.png
File Sharing	Mobile View	Notifications
https://screenshots/file-sharing.png	https://screenshots/mobile.png	https://screenshots/notifications.png
🤝 Contributing
We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

Fork the repository

Create your feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add some amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

Development Guidelines
Follow React best practices and hooks patterns

Maintain the Kenyan theme and color scheme

Ensure mobile responsiveness

Add appropriate error handling

Include comments for complex logic

🐛 Troubleshooting
Common Issues
Port Already in Use

bash
# Change port in server/server.js
const PORT = process.env.PORT || 5001;
Socket Connection Failed

Ensure backend server is running on port 5001

Check CORS configuration matches your frontend URL

Verify network connectivity

File Upload Issues

Files are limited to 10MB maximum size

Supported formats: images, documents, and common file types

Check browser console for specific error messages

Getting Help
Check the browser console for error messages

Verify both client and server are running

Ensure all dependencies are installed

Check network connectivity between client and server

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

👨‍💻 Author
Your Name

GitHub: wacuk-a

Email: wacuka.karu@gmail.com



🙏 Acknowledgments
Socket.io Team - For excellent real-time communication library

React Team - For the amazing frontend framework

Kenyan Community - For inspiration and cultural context

Open Source Community - For countless tools and libraries that made this possible

🎓 Academic Context
This project was developed as part of a full-stack web development curriculum, demonstrating mastery of:

Real-time communication patterns

React state management and hooks

Node.js backend development

Socket.io bidirectional communication

Responsive web design principles

Performance optimization techniques

Project architecture and deployment

<div align="center">
Made with ❤️ in Kenya

Connecting Kenyans worldwide, one message at a time
