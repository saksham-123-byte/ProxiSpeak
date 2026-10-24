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
## WebRTC Voice Integration

ProxiSpeak includes real-time peer-to-peer audio communication powered by WebRTC and Socket.IO signaling.

### Features

- **Microphone Access:** Uses the browser's `getUserMedia()` API to request microphone access.
- **Peer-to-Peer Audio:** Establishes WebRTC connections for real-time audio communication between users.
- **Room-Based Communication:** Users can join a voice room using a shared Room ID.
- **Microphone Controls:** Enable, mute, and unmute the microphone during a voice session.
- **Connection Status:** Displays the current room and voice connection state.
- **Leave Room:** Stops the voice session and releases microphone resources through the cleanup flow.
- **Room ID Validation:** Displays feedback when the Room ID is empty.
- **Signaling:** Uses Socket.IO to exchange the information required to establish WebRTC connections.

### Running the Application

Start the frontend:

```bash
npm install
npm run dev
```

Start the signaling server in a separate terminal:

```bash
node server.js
```

### Using Voice Rooms

1. Open ProxiSpeak in your browser.
2. Allow microphone access when prompted.
3. Enter a Room ID and select **Join Voice Room**.
4. Have the other participant join using the same Room ID.
5. Use the microphone controls to mute or unmute audio.
6. Select **End Voice / Leave Room** to end the session.

### Requirements

- Node.js and npm
- A modern browser with WebRTC support
- Microphone access permission
- The Socket.IO signaling server running

**Note:** Microphone access generally requires `localhost` or a secure HTTPS context. Network configuration and browser permissions can affect connections between different devices.
## Development Log — October 24, 2026

### Voice Communication Improvements

ProxiSpeak's voice communication workflow supports room-based audio sessions using WebRTC and Socket.IO signaling.

Recent development work focuses on improving usability and documenting the voice connection workflow.

- Added Room ID validation feedback to help users identify empty room input.
- Improved voice connection status visibility in the interface.
- Documented the procedure for checking audio communication between two browser sessions.
- Documented microphone permissions, connection setup, mute and unmute controls, and session cleanup.

### Next Development Goals

- Verify two-way audio communication across separate devices and networks.
- Improve connection error feedback and recovery behavior.
- Continue refining the voice interface and user experience.
