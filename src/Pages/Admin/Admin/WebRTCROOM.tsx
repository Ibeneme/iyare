import React, { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Send,
  Users,
  MessageSquare,
  Hand,
  ScreenShare,
  ScreenShareOff,
  X,
  ThumbsUp,
  Heart,
  Laugh,
} from "lucide-react";
import clsx from "clsx";

interface User {
  id: string;
  username: string;
}

interface SessionDescription {
  type: "offer" | "answer";
}

type PeerConnectionMap = { [key: string]: RTCPeerConnection };
type PeerDataMap = { [key: string]: string };

const SERVER_URL = "http://localhost:5001";

const iceConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface ChatMessage {
  id: string;
  username: string;
  message: string;
}

const VideoChat: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null);
  const peerConnectionsRef = useRef<PeerConnectionMap>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isStartingLocalStream = useRef(false);

  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [peerData, setPeerData] = useState<PeerDataMap>({});
  const [status, setStatus] = useState(
    "Enter a Room ID and username, then click Join."
  );

  const [isConnected, setIsConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenSharingPeer, setScreenSharingPeer] = useState<string | null>(
    null
  );

  const playVideoSafely = async (videoEl: HTMLVideoElement) => {
    try {
      if (videoEl.paused) await videoEl.play();
    } catch (err: any) {
      if (err.name !== "AbortError") console.warn("Video play failed:", err);
    }
  };

  const startLocalStream = useCallback(async () => {
    if (localStreamRef.current || isStartingLocalStream.current)
      return localStreamRef.current!;
    isStartingLocalStream.current = true;

    
    try {
      setStatus("Requesting camera and microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true },
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        await playVideoSafely(localVideoRef.current);
      }

      stream.getAudioTracks().forEach((t) => (t.enabled = micEnabled));
      stream.getVideoTracks().forEach((t) => (t.enabled = videoEnabled));

      return stream;
    } catch (err) {
      alert("Cannot access camera/microphone. Check browser permissions!");
      throw err;
    } finally {
      isStartingLocalStream.current = false;
    }
  }, [micEnabled, videoEnabled]);

  const addRemoteVideo = (id: string, stream: MediaStream, label?: string) => {
    if (!remoteVideoContainerRef.current) return;

    let video = document.getElementById(`video-${id}`) as HTMLVideoElement;
    if (!video) {
      const container = document.createElement("div");
      container.id = `container-${id}`;
      container.className = "w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-2 relative";

      video = document.createElement("video");
      video.id = `video-${id}`;
      video.autoplay = true;
      video.playsInline = true;
      video.className = "w-full h-auto rounded-lg shadow-lg bg-gray-700";

      const labelEl = document.createElement("p");
      labelEl.id = `label-${id}`;
      labelEl.className = "text-center text-sm mt-1 text-gray-400 truncate";
      labelEl.textContent =
        label || peerData[id] || `Peer: ${id.substring(0, 6)}...`;

      // Add screen sharing badge
      const badgeEl = document.createElement("span");
      badgeEl.id = `badge-${id}`;
      badgeEl.className =
        "absolute top-1 right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded hidden";
      badgeEl.textContent = "Screen";

      container.appendChild(video);
      container.appendChild(labelEl);
      container.appendChild(badgeEl);
      remoteVideoContainerRef.current.appendChild(container);
    }

    video.srcObject = stream;
  };

  const removeRemoteVideo = (id: string) => {
    const container = document.getElementById(`container-${id}`);
    if (container) remoteVideoContainerRef.current?.removeChild(container);

    if (peerConnectionsRef.current[id]) {
      peerConnectionsRef.current[id].close();
      delete peerConnectionsRef.current[id];
    }

    setPeerData((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });

    setStatus(`Peer ${peerData[id] || id} left the room.`);
  };

  const createPeerConnection = useCallback(
    (remoteSocketId: string, isInitiator: boolean) => {
      const socket = socketRef.current!;
      const pc = new RTCPeerConnection(iceConfiguration);
      peerConnectionsRef.current[remoteSocketId] = pc;

      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => pc.addTrack(track, localStreamRef.current!));
      }

      pc.ontrack = (event) => addRemoteVideo(remoteSocketId, event.streams[0]);
      pc.onicecandidate = (event) => {
        if (event.candidate)
          socket.emit("ice-candidate", event.candidate, remoteSocketId);
      };

      if (isInitiator) negotiate(pc, remoteSocketId);
      return pc;
    },
    []
  );

  const negotiate = async (pc: RTCPeerConnection, remoteSocketId: string) => {
    const socket = socketRef.current!;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("session-description", pc.localDescription, remoteSocketId);
  };

  const setupSocketListeners = useCallback(
    (socket: Socket) => {
      const processUser = (user: User) => {
        setPeerData((prev) => ({ ...prev, [user.id]: user.username }));
        const labelEl = document.getElementById(`label-${user.id}`);
        if (labelEl) labelEl.textContent = user.username;
      };

      socket.on("new-user-joined", (newUser: User) => {
        processUser(newUser);
        createPeerConnection(newUser.id, true);

        if (localStreamRef.current)
          addRemoteVideo(socket.id, localStreamRef.current, username);
      });

      socket.on("existing-users", (existingUsers: User[]) => {
        existingUsers.forEach((user) => {
          processUser(user);
          createPeerConnection(user.id, false);
        });

        if (localStreamRef.current && socket.id)
          addRemoteVideo(socket.id, localStreamRef.current, username);
      });

      socket.on(
        "session-description",
        async (senderId: string, sdp: SessionDescription) => {
          let pc = peerConnectionsRef.current[senderId];
          if (!pc) pc = createPeerConnection(senderId, false);
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          if (sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("session-description", pc.localDescription, senderId);
          }
        }
      );

      socket.on(
        "ice-candidate",
        async (senderId: string, candidate: RTCIceCandidate) => {
          const pc = peerConnectionsRef.current[senderId];
          if (pc) await pc.addIceCandidate(candidate);
        }
      );

      socket.on("user-left", removeRemoteVideo);

      socket.on("chat-message", (msg: ChatMessage) => {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });

      // 🔹 Screen share notifications
      socket.on("start-screen-share", (peerId: string) => {
        // If there is already a screen sharing peer and it's not the same as the new one
        if (screenSharingPeer && screenSharingPeer !== peerId) {
          // Stop the previous sharer's badge
          const prevBadge = document.getElementById(
            `badge-${screenSharingPeer}`
          );
          if (prevBadge) prevBadge.style.display = "none";

          // Optionally, you can also emit a stop event to the server
          // socket.emit("stop-screen-share", screenSharingPeer);
        }

        setScreenSharingPeer(peerId);

        const badge = document.getElementById(`badge-${peerId}a`);
        if (badge) badge.style.display = "inline-block";
      });

      socket.on("stop-screen-share", (peerId: string) => {
        setScreenSharingPeer(null);
        const badge = document.getElementById(`badge-${peerId}`);
        if (badge) badge.style.display = "none";
      });
    },
    [username]
  );

  const handleJoinRoom = async () => {
    if (!roomId.trim() || !username.trim()) {
      setStatus("Enter a valid Room ID and username");
      return;
    }

    try {
      const stream = await startLocalStream();
      if (!socketRef.current) socketRef.current = io(SERVER_URL);

      setupSocketListeners(socketRef.current);

      socketRef.current.on("connect", () => {
        const localId = socketRef.current!.id;
        setPeerData((prev) => ({ ...prev, [localId]: username }));
        addRemoteVideo(localId, stream, username);
        socketRef.current!.emit("join", roomId, username);
        setIsConnected(true);
        setStatus(`Joined room "${roomId}" as ${username}`);
      });
    } catch (err) {
      console.error(err);
      setStatus("Failed to join room.");
    }
  };

  const toggleMic = () => {
    if (!localStreamRef.current || !socketRef.current) return;

    const newState = !micEnabled;
    localStreamRef.current
      .getAudioTracks()
      .forEach((t) => (t.enabled = newState));
    setMicEnabled(newState);
    socketRef.current.emit("media-toggle", {
      mic: newState,
      video: videoEnabled,
    });
  };

  const toggleVideo = () => {
    if (!localStreamRef.current || !socketRef.current) return;

    const newState = !videoEnabled;
    localStreamRef.current
      .getVideoTracks()
      .forEach((t) => (t.enabled = newState));
    setVideoEnabled(newState);
    socketRef.current.emit("media-toggle", {
      mic: micEnabled,
      video: newState,
    });
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    const msg: ChatMessage = {
      id: socketRef.current.id + "-" + Date.now(),
      username,
      message: chatInput,
    };
    socketRef.current.emit("chat-message", msg);
    setChatMessages((prev) => [...prev, msg]);
    setChatInput("");
  };

  const startScreenShare = async () => {
    if (!socketRef.current || !localStreamRef.current) {
      console.log("Socket or local stream not available");
      return;
    }

    try {
      console.log("Requesting screen share...");
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true,
        audio: false,
      });
      console.log("Screen stream obtained:", stream);

      setScreenStream(stream);
      setIsScreenSharing(true);

      // Send screen track to all peers
      Object.entries(peerConnectionsRef.current).forEach(([peerId, pc]) => {
        console.log("Replacing video track for peer:", peerId);
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          console.log("Old sender track:", sender.track);
          sender.replaceTrack(stream.getVideoTracks()[0]);
          console.log("New screen track sent to peer:", peerId);
        } else {
          console.log("No video sender found for peer:", peerId);
        }
      });

      // Notify others
      console.log("Emitting start-screen-share event");
      socketRef.current.emit("start-screen-share");

      // When screen sharing stops
      stream.getVideoTracks()[0].onended = () => {
        console.log("Screen sharing stopped by user");
        stopScreenShare();
      };
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  };

  const stopScreenShare = () => {
    if (!localStreamRef.current || !socketRef.current) return;

    // Restore local video track for all peers
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender)
        sender.replaceTrack(localStreamRef.current!.getVideoTracks()[0]);
    });

    screenStream?.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    setIsScreenSharing(false);
    socketRef.current.emit("stop-screen-share");
  };

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">
        WebRTC Group Video Chat 🌐
      </h1>
      <p className="text-center mb-4 text-gray-400">Status: {status}</p>

      {!isConnected ? (
        <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Join a Room</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 mb-4 rounded-lg bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-3 mb-4 rounded-lg bg-gray-700 text-white placeholder-gray-400"
          />
          <button
            onClick={handleJoinRoom}
            disabled={!roomId.trim() || !username.trim()}
            className={`w-full p-3 rounded-lg font-bold ${
              roomId && username
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-500 cursor-not-allowed"
            }`}
          >
            Join
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row flex-1 gap-4">
          <div className="flex-1 bg-gray-800 p-4 rounded-lg shadow-xl flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Participants ({Object.keys(peerData).length})
            </h2>

            <div
              ref={remoteVideoContainerRef}
              className="flex flex-wrap justify-center -m-2 flex-1 overflow-y-auto"
            ></div>
            <div className="flex justify-center mt-4 gap-4">
              <button
                onClick={toggleMic}
                className="p-2 bg-gray-700 rounded-full"
              >
                {micEnabled ? <Mic /> : <MicOff />}
              </button>
              <button
                onClick={toggleVideo}
                className="p-2 bg-gray-700 rounded-full"
              >
                {videoEnabled ? <Video /> : <VideoOff />}
              </button>
              {!isScreenSharing ? (
                <button
                  onClick={startScreenShare}
                  className="p-2 bg-blue-600 rounded-full"
                >
                  Share Screen
                </button>
              ) : (
                <button
                  onClick={stopScreenShare}
                  className="p-2 bg-red-600 rounded-full"
                >
                  Stop Sharing
                </button>
              )}
            </div>
          </div>

          <div className="w-full md:w-80 bg-gray-800 p-4 rounded-lg shadow-xl flex flex-col">
            <h2 className="text-xl font-semibold mb-2">Chat</h2>
            <div className="flex-1 overflow-y-auto mb-2 space-y-1">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-bold">{msg.username}: </span>
                  {msg.message}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 p-2 rounded bg-gray-700 text-white"
                placeholder="Type a message..."
              />
              <button
                onClick={sendChatMessage}
                className="p-2 bg-green-600 rounded"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoChat;
