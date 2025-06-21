import { useRef, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
// Removed: import { FiVideo, FiVideoOff, FiMic, FiMicOff } from "react-icons/fi";
// Removed: import "./WebRTCComponent.css";

// WebRTC STUN servers for NAT traversal
const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

// Initialize Socket.IO client
// IMPORTANT: Replace "http://localhost:5001" with your actual backend server URL
const socket = io("http://localhost:5001", { transports: ["websocket"] });

// Global variables to manage local media stream and peer connections
let localStream: MediaStream | null = null;
let currentRoomId: string | null = null;
const peerConnections: Record<string, RTCPeerConnection> = {}; // Stores RTCPeerConnection objects by participant ID

function App() {
  // Refs for video elements and control buttons
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const hangupButtonRef = useRef<HTMLButtonElement | null>(null);
  const muteAudButtonRef = useRef<HTMLButtonElement | null>(null);

  // State variables for UI and media control
  const [showModal, setShowModal] = useState(true); // Controls visibility of the room join modal
  const [inputRoomId, setInputRoomId] = useState(""); // Input for room ID
  const [audioEnabled, setAudioEnabled] = useState(true); // State of local audio
  const [videoEnabled, setVideoEnabled] = useState(true); // State of local video
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({}); // Stores remote participants' streams

  /**
   * Creates and configures a new RTCPeerConnection for a given participant.
   * This function sets up ICE candidate and track handlers, and the crucial
   * onnegotiationneeded event to initiate SDP offers.
   * @param participantId The socket ID of the remote participant.
   * @returns The configured RTCPeerConnection object.
   */
  const createPeerConnection = useCallback((participantId: string) => {
    console.log(`[PC] Creating PeerConnection for ${participantId}`);
    const pc = new RTCPeerConnection(configuration);

    // Handler for gathering ICE candidates. Candidates are sent to the remote peer.
    pc.onicecandidate = (e) => {
      if (e.candidate && currentRoomId) {
        console.log(`[ICE] Sending ICE candidate to ${participantId}`);
        socket.emit("message", {
          type: "candidate",
          candidate: e.candidate,
          room: currentRoomId,
          targetId: participantId, // Ensure candidate reaches the correct peer
          from: socket.id,
        });
      } else if (e.candidate === null) {
        console.log(`[ICE] ICE gathering complete for ${participantId}`);
      }
    };

    // Handler for receiving remote tracks (audio/video streams).
    // The received stream is added to the remoteStreams state for rendering.
    pc.ontrack = (e) => {
      console.log(
        `[Media] Received remote stream track from ${participantId}:`,
        e.streams[0]
      );
      setRemoteStreams((prev) => ({
        ...prev,
        [participantId]: e.streams[0], // Use the first stream in the array
      }));
    };

    // This event fires when negotiation is needed (e.g., after adding a track).
    // It's responsible for creating and sending SDP offers.
    pc.onnegotiationneeded = async () => {
      console.log(`[Negotiation] onnegotiationneeded for ${participantId}`);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer); // Set local offer
        socket.emit("message", {
          type: "offer",
          sdp: offer.sdp,
          room: currentRoomId,
          targetId: participantId, // Send offer to the specific participant
          from: socket.id,
        });
        console.log(`[Negotiation] Sent offer to ${participantId}`);
      } catch (e) {
        console.error(`[Error] Error creating offer for ${participantId}:`, e);
      }
    };

    // Add local media tracks to the peer connection.
    // This addition is what primarily triggers `onnegotiationneeded` for the first time.
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        // Use non-null assertion (!) because localStream is checked.
        pc.addTrack(track, localStream!);
        console.log(
          `[Media] Added local track to PC for ${participantId}:`,
          track.kind,
          track.id
        );
      });
    }

    return pc;
  }, []); // `localStream` is a global `let`, so it doesn't need to be in `useCallback` deps for re-creation.

  /**
   * Handles all incoming WebSocket messages from the signaling server.
   * This is the core logic for SDP offer/answer/candidate exchange and peer management.
   */
  useEffect(() => {
    socket.on("message", async (e: any) => {
      // Ignore messages if not for the current room, unless it's a 'room_full' notification.
      if (
        currentRoomId &&
        e.room &&
        e.room !== currentRoomId &&
        e.type !== "room_full"
      ) {
        console.warn(
          `[Socket] Ignoring message for another room (${e.room}). Current room: ${currentRoomId}`
        );
        return;
      }

      // Handle 'room_full' scenario: alert user and clean up.
      if (e.type === "room_full") {
        // Using a basic alert here as per original code, consider a custom modal in production.
        window.alert(`Room ${e.room} is full. Please try another ID.`);
        hangupAll(); // Clean up connections
        return;
      }

      const sender = e.from; // ID of the sender of the message
      if (!sender) {
        console.error("[Socket] Received message without 'from' sender ID:", e);
        return;
      }

      // If a message comes from a new participant, create a peer connection for them.
      if (!peerConnections[sender]) {
        console.log(
          `[PC Mgmt] Creating new PeerConnection for ${sender} due to incoming message.`
        );
        peerConnections[sender] = createPeerConnection(sender);
      }

      const pc = peerConnections[sender];
      if (!pc) {
        console.error(
          `[Error] PeerConnection not found for sender: ${sender} after creation attempt. Message type: ${e.type}`
        );
        return;
      }

      try {
        if (e.type === "offer") {
          console.log(
            `[SDP] Received offer from ${sender}:`,
            e.sdp.substring(0, 50) + "..."
          );
          // Apply 'polite' flag to handle SDP offer collisions gracefully.
          // The 'polite' peer defers to the 'impolite' peer in case of a collision.
          // This prevents both sides from trying to create an offer simultaneously.
          const polite = socket.id > sender; // Arbitrarily define politeness based on socket ID
          const makingOffer = pc.signalingState !== "stable"; // Are we currently in the process of making an offer?

          // Collision detected if we're also trying to make an offer AND we're impolite.
          const offerCollision = makingOffer || pc.signalingState === "have-local-offer";

          // If a collision occurs and we are impolite, roll back our local description and then
          // process the remote offer.
          if (offerCollision && !polite) {
            console.warn(
              `[Negotiation] Offer collision with ${sender}. Rolling back local description (impolite).`
            );
            await Promise.all([
              pc.setLocalDescription({ type: "rollback" }), // Rollback our own half-formed offer
              pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: e.sdp })),
            ]);
          } else {
             await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: e.sdp }));
          }

          // Create and set answer, then send it back to the sender.
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("message", {
            type: "answer",
            sdp: answer.sdp,
            room: currentRoomId,
            targetId: sender,
            from: socket.id,
          });
          console.log(`[SDP] Sent answer to ${sender}`);
        } else if (e.type === "answer") {
            console.log(
              `[SDP] Received answer from ${sender}:`,
              e.sdp.substring(0, 50) + "..."
            );
            // Set the remote answer if we already sent an offer.
            // Check if `pc.currentRemoteDescription` is null or not to avoid errors
            // if an answer arrives before an offer is fully processed or an answer is received unexpectedly.
            if (!pc.currentRemoteDescription || pc.currentRemoteDescription.type !== "answer") {
                 await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: e.sdp }));
            } else {
                console.warn(`[SDP] Ignoring unexpected answer from ${sender}.`);
            }
        } else if (e.type === "candidate" && e.candidate) {
          console.log(
            `[ICE] Received ICE candidate from ${sender}:`,
            e.candidate.candidate.substring(0, 50) + "..."
          );
          await pc.addIceCandidate(new RTCIceCandidate(e.candidate));
        } else if (e.type === "bye") {
          console.log(`[Peer] ${sender} sent 'bye' message.`);
          // Close and remove the peer connection for the participant who left.
          if (peerConnections[sender]) {
            peerConnections[sender].close();
            delete peerConnections[sender];
          }
          // Remove their video stream from the state.
          setRemoteStreams((prev) => {
            const copy = { ...prev };
            delete copy[sender];
            return copy;
          });
        }
      } catch (err) {
        console.error(
          `[Error] Error processing message type ${e.type} from ${sender}:`,
          err
        );
      }
    });

    // Handler for when we successfully join a room.
    socket.on("room_joined", ({ roomId, existingParticipants }: any) => {
      console.log(
        `[Socket] Successfully joined room ${roomId}. Existing participants:`,
        existingParticipants
      );
      currentRoomId = roomId; // Store the current room ID.

      // For each existing participant in the room, create a PeerConnection.
      // `createPeerConnection` will automatically add local tracks and trigger `onnegotiationneeded`
      // to send offers to these existing peers.
      existingParticipants.forEach((id: string) => {
        if (id === socket.id) return; // Don't create PC for self
        console.log(
          `[Room Joined] Initiating PC for existing participant: ${id}`
        );
        const pc = createPeerConnection(id);
        peerConnections[id] = pc;
      });

      setShowModal(false); // Hide the modal after joining.
      // Enable control buttons once in a call.
      if (hangupButtonRef.current) hangupButtonRef.current.disabled = false;
      if (muteAudButtonRef.current) muteAudButtonRef.current.disabled = false;
    });

    // Handler for when a new participant joins the room after us.
    socket.on("new_participant", (id: string) => {
      if (id === socket.id) return; // Don't create PC for self
      console.log(
        `[Socket] New participant ${id} joined the room. Initiating PC.`
      );
      // Create a PeerConnection for the new participant.
      // This will trigger `onnegotiationneeded` to send them an offer.
      const pc = createPeerConnection(id);
      peerConnections[id] = pc;
    });

    // Handler for when a participant leaves the room.
    socket.on("participant_left", (id: string) => {
      console.log(`[Socket] Participant ${id} left the room.`);
      // Close and remove their PeerConnection.
      if (peerConnections[id]) {
        peerConnections[id].close();
        delete peerConnections[id];
      }
      // Remove their stream from the display.
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    });

    // Cleanup function: remove all socket event listeners when the component unmounts.
    return () => {
      socket.off("message");
      socket.off("room_joined");
      socket.off("new_participant");
      socket.off("participant_left");
    };
  }, [createPeerConnection]); // Dependency on createPeerConnection to ensure latest version is used.

  // Effect to set initial button states (disabled) on component mount.
  useEffect(() => {
    if (hangupButtonRef.current) hangupButtonRef.current.disabled = true;
    if (muteAudButtonRef.current) muteAudButtonRef.current.disabled = true;
  }, []);

  /**
   * Initiates joining a video call: gets user media, sets local video,
   * and emits 'join_room' to the signaling server.
   */
  const joinCall = async () => {
    if (!inputRoomId.trim()) {
      window.alert("Please enter a Room ID to join.");
      return;
    }

    try {
      // Only get user media if localStream is not already active.
      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { echoCancellation: true }, // Enable echo cancellation for better audio
        });
        console.log("[Media] Local stream obtained.");
      }

      // Attach local stream to the local video element.
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current
          .play()
          .catch((e) => console.error("Error playing local video:", e));
        console.log("[Media] Local stream set to local video element.");
      }
      // Set initial media control states.
      setVideoEnabled(true);
      setAudioEnabled(true);

      // Emit 'join_room' event to the signaling server.
      socket.emit("join_room", inputRoomId.trim());
      console.log(`[Socket] Attempting to join room: ${inputRoomId.trim()}`);
    } catch (err) {
      console.error("[Error] Error getting user media:", err);
      // Inform the user if media access fails.
      window.alert(
        "Could not access camera or microphone. Please ensure permissions are granted and no other app is using them."
      );
    }
  };

  /**
   * Cleans up all active peer connections, stops local media tracks,
   * and resets UI state. This is a local cleanup, typically called after a hangup.
   */
  const hangupAll = useCallback(() => {
    // Close all peer connections.
    Object.values(peerConnections).forEach((pc) => {
      if (pc.iceConnectionState !== "closed") {
        pc.close();
      }
    });
    // Clear the peerConnections object.
    for (const key in peerConnections) {
      if (peerConnections.hasOwnProperty(key)) {
        delete peerConnections[key];
      }
    }
    // Stop local media tracks.
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      localStream = null; // Clear local stream reference.
    }
    // Reset state variables.
    setRemoteStreams({});
    currentRoomId = null;
    setShowModal(true);
    setInputRoomId("");
    // Detach local stream from video element.
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    console.log("[UI] Call hung up. UI reset.");
  }, []);

  /**
   * Handles the hangup button click: emits 'bye' message, disconnects socket,
   * and performs full client-side cleanup.
   */
  const hangB = () => {
    if (currentRoomId) {
      // Emit a 'bye' message to inform other peers.
      socket.emit("message", {
        type: "bye",
        room: currentRoomId,
        from: socket.id,
        targetId: "all_peers_in_room", // Server should handle this to broadcast to all.
      });
    }
    socket.disconnect(); // Disconnect socket to trigger server-side cleanup (e.g., 'disconnect' event).
    hangupAll(); // Perform client-side cleanup immediately.
    socket.connect(); // Reconnect the socket for potential new calls.
  };

  /**
   * Toggles the local audio track's enabled state.
   */
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        console.log(`[Media] Audio enabled state: ${audioTrack.enabled}`);
      }
    }
  };

  /**
   * Toggles the local video track's enabled state.
   */
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        console.log(`[Media] Video enabled state: ${videoTrack.enabled}`);
      }
    }
  };

  return (
    <>
      {/* Tailwind CSS CDN for styling */}
      <script src="https://cdn.tailwindcss.com"></script>
      {/* Font Awesome for icons */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"></link>
      <style>
        {`
          body {
            font-family: 'Inter', sans-serif;
            background-color: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .modal-content {
            background-color: #fff;
            padding: 2.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            text-align: center;
            width: 90%;
            max-width: 450px;
            animation: fadeIn 0.3s ease-out;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .modal-content h2 {
            font-size: 2.25rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 1rem;
          }

          .modal-content input {
            padding: 1rem 1.25rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1.1rem;
            width: 100%;
            box-sizing: border-box;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }

          .modal-content input:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
          }

          .modal-content button {
            padding: 1.2rem 2rem;
            background-image: linear-gradient(to right, #6366f1, #8b5cf6);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.2rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
          }

          .modal-content button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
          }

          .modal-content p {
            font-size: 0.95rem;
            color: #777;
            line-height: 1.4;
          }

          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 1200px; /* Max width for larger screens */
            padding: 20px;
            box-sizing: border-box;
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            position: relative;
          }

          .video-display-area {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            width: 100%;
            padding: 20px;
            border-radius: 10px;
            background-color: #e2e8f0; /* Light blue-gray background */
            min-height: 300px;
            align-items: start; /* Align videos to the top */
            justify-content: center;
          }

          .video-stream-wrapper {
            position: relative;
            width: 100%;
            padding-top: 75%; /* 4:3 Aspect Ratio */
            background-color: #333; /* Dark background for empty video */
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s ease-in-out;
            border: 3px solid #6366f1; /* default border */
          }

          .video-stream-wrapper:hover {
            transform: translateY(-5px);
          }

          .video-item {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover; /* Maintain aspect ratio and cover area */
            transform: scaleX(-1); /* Flip horizontally for mirror effect */
          }

          .local-video-wrapper {
            border-color: #8b5cf6; /* Distinct border for local video */
            grid-column: span 2; /* Local video spans 2 columns on larger screens */
            max-width: 50%; /* Constrain max width for local video */
            margin: 0 auto; /* Center local video */
          }
          
          @media (max-width: 768px) {
            .local-video-wrapper {
              grid-column: span 1; /* On smaller screens, local video takes 1 column */
              max-width: 100%; /* Allow full width on smaller screens */
            }
          }

          .video-label {
            position: absolute;
            bottom: 5px;
            left: 5px;
            background-color: rgba(0, 0, 0, 0.5);
            color: white;
            padding: 5px 8px;
            border-radius: 5px;
            font-size: 0.85rem;
            z-index: 10;
          }

          .control-bar {
            display: flex;
            gap: 15px;
            margin-top: 30px;
            background-color: #334155; /* Darker background for control bar */
            padding: 15px 30px;
            border-radius: 50px; /* Pill shape */
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          }

          .btn-item {
            background-color: #64748b; /* Medium gray for buttons */
            border: none;
            border-radius: 50%;
            width: 55px;
            height: 55px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: background-color 0.2s ease, transform 0.2s ease;
            color: white;
            font-size: 1.5rem;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          }

          .btn-item:hover {
            background-color: #475569; /* Darker gray on hover */
            transform: translateY(-2px);
          }

          .btn-item.video-off,
          .btn-item.mic-off {
            background-color: #ef4444; /* Red for disabled/off state */
          }

          .btn-item.hangup-btn {
            background-color: #dc2626; /* Distinct red for hangup */
          }

          .btn-item.hangup-btn:hover {
            background-color: #b91c1c; /* Darker red on hover */
          }

          /* General responsiveness */
          @media (max-width: 768px) {
            .container {
              padding: 15px;
            }
            .video-display-area {
              grid-template-columns: 1fr; /* Stack videos vertically on small screens */
            }
            .control-bar {
              flex-wrap: wrap;
              justify-content: center;
              padding: 15px;
              border-radius: 15px; /* Less rounded on small screens */
            }
            .btn-item {
              width: 50px;
              height: 50px;
              font-size: 1.3rem;
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      {/* Room Joining Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Join a Call</h2>
            <input
              placeholder="Room ID"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && joinCall()} // Join on Enter key press
            />
            <button onClick={joinCall}>Join Call</button>
            <p>
              * Enter any ID to start a new call or join an existing one.
            </p>
            <p>
              * All participants in the same room will see each other.
            </p>
          </div>
        </div>
      )}

      {/* Main Video Call Interface */}
      <main className="container">
        <div className="video-display-area">
          {/* Local Video Stream */}
          <div className="video-stream-wrapper local-video-wrapper">
            <video
              ref={localVideoRef}
              className="video-item local-video"
              autoPlay
              playsInline
              muted // Mute local video to prevent echo for self
            />
            <div className="video-label">You ({socket.id?.slice(0, 4)}...)</div>
          </div>

          {/* Remote Video Streams */}
          {Object.entries(remoteStreams).map(([id, stream]) => (
            <div key={id} className="video-stream-wrapper remote-video-wrapper">
              <video
                className="video-item remote-video"
                autoPlay
                playsInline
                ref={(el) => {
                  if (el) {
                    el.srcObject = stream;
                    el.play().catch((e) =>
                      console.error(
                        `[Error] Error playing remote video for ${id}:`,
                        e
                      )
                    );
                  }
                }}
              />
              <div className="video-label">{`Participant: ${id.slice(
                0,
                4
              )}...`}</div>
            </div>
          ))}
        </div>

        {/* Call Control Bar */}
        <div className="control-bar">
          {/* Video Toggle Button */}
          <button
            className={`btn-item ${videoEnabled ? "video-on" : "video-off"}`}
            onClick={toggleVideo}
            disabled={!localStream} // Disable if no local stream
          >
            {videoEnabled ? <i className="fas fa-video"></i> : <i className="fas fa-video-slash"></i>}
          </button>

          {/* Audio Toggle Button */}
          <button
            className={`btn-item ${audioEnabled ? "mic-on" : "mic-off"}`}
            ref={muteAudButtonRef}
            onClick={toggleAudio}
            disabled={!localStream} // Disable if no local stream
          >
            {audioEnabled ? <i className="fas fa-microphone"></i> : <i className="fas fa-microphone-slash"></i>}
          </button>

          {/* Hangup Button */}
          <button
            className="btn-item hangup-btn"
            ref={hangupButtonRef}
            onClick={hangB}
            disabled={showModal} // Disable if modal is shown (not in a call)
          >
            <i className="fas fa-phone-slash"></i> {/* Phone slash icon for hangup */}
          </button>
        </div>
      </main>
    </>
  );
}

export default App;
