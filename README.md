# ProxiSpeak

## Real-Time Peer-to-Peer Voice Communication

ProxiSpeak is a web application focused on real-time voice communication using WebRTC.

## About the Project

The project allows users to join a voice room and communicate through their microphones.

React is used for the frontend, while Node.js and Socket.IO handle signaling between participants.

WebRTC enables peer-to-peer audio communication between connected users.

## Features

- Browser-based microphone access using `getUserMedia()`.
- Peer-to-peer audio communication using WebRTC.
- Room-based joining using a room ID.
- Signaling through Socket.IO.
- WebRTC offer and answer exchange.
- ICE candidate exchange.
- Microphone mute and unmute controls.
- End Voice functionality.
- Microphone stream cleanup.
- Remote audio playback.
- Connection status and error messages.
- Support for two participants per room in the current server configuration.

## Technologies Used

- React
- JavaScript
- Vite
- WebRTC API
- `getUserMedia()` API
- Node.js
- Socket.IO
- Socket.IO Client
- HTML5 Audio
- Git and GitHub

## Project Structure

```text
ProxiSpeak/
├── src/
│   ├── components/
│   │   └── office/
│   │       └── VoiceControls.jsx
│   ├── hooks/
│   │   └── useWebRTC.js
│   └── App.jsx
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

## Prerequisites

- Node.js and npm
- A modern web browser
- Microphone permission
- Git

## Installation

Clone the repository:

```bash
git clone https://github.com/saksham-123-byte/ProxiSpeak.git
```

Navigate to the project directory:

```bash
cd ProxiSpeak
```

Install dependencies:

```bash
npm install
```

## Running the Application

Start the signaling server in one terminal:

```bash
node server.js
```

Start the frontend in another terminal:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## How to Use

1. Start the signaling server.
2. Start the frontend development server.
3. Open the application in your browser.
4. Allow microphone access when prompted.
5. Enter a room ID and join the voice room.
6. Open a second browser tab and join the same room.
7. Use the microphone controls to mute or unmute audio.
8. Select End Voice to leave the session.

## Development Progress

The core WebRTC audio communication functionality has been implemented.

The application includes microphone access, peer connection handling, room-based signaling, remote audio playback, voice controls, and connection cleanup.

Basic audio communication, mute/unmute, leaving a voice session, and reconnection have been checked using browser tabs.

## Future Improvements

- Test audio communication across separate devices.
- Improve network error handling and reconnection.
- Improve the user interface and accessibility.
- Add production deployment configuration.
- Explore support for additional participants.

## Learning Outcomes

This project provides practical experience with WebRTC, browser media APIs, peer-to-peer communication, Socket.IO signaling, and audio stream management.

It also demonstrates integration between a React frontend and a Node.js signaling server.

## Repository

[ProxiSpeak on GitHub](https://github.com/saksham-123-byte/ProxiSpeak)

## License

A project license has not yet been specified.