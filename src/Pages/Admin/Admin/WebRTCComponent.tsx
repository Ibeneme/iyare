import React, { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Send,
  ThumbsUp,
  Heart,
  Laugh,
} from "lucide-react";

interface User {
  id: string;
  username: string;
  screensharingid?: string;
  screenshared?: boolean;

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
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<{ [userId: string]: string }>({});
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  // ADDED: State for custom User ID and Class ID
  const [userId, setUserId] = useState("");

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
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.volume = 0;
        localVideoRef.current.setAttribute("muted", "true");
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
      video.muted = false;
      video.volume = 1;
      video.className = "w-full h-auto rounded-lg shadow-lg bg-gray-700";

      const labelEl = document.createElement("p");
      labelEl.id = `label-${id}`;
      labelEl.className = "text-center text-sm mt-1 text-gray-400 truncate";
      labelEl.textContent =
        label || peerData[id] || `Peer: ${id.slice(0, 6)}...`;

      container.appendChild(video);
      container.appendChild(labelEl);

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
    (remoteId: string, isInitiator: boolean) => {
      const socket = socketRef.current!;
      const pc = new RTCPeerConnection(iceConfiguration);
      peerConnectionsRef.current[remoteId] = pc;

      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => pc.addTrack(track, localStreamRef.current!));
      }

      if (isScreenSharing && screenStream) {
        screenStream
          .getTracks()
          .forEach((track) => pc.addTrack(track, screenStream));
      }

      pc.ontrack = (event) => addRemoteVideo(remoteId, event.streams[0]);

      pc.onicecandidate = (event) => {
        if (event.candidate)
          socket.emit("ice-candidate", event.candidate, remoteId);
      };

      if (isInitiator) negotiate(pc, remoteId);
      return pc;
    },
    [isScreenSharing, screenStream]
  );

  const negotiate = async (pc: RTCPeerConnection, remoteId: string) => {
    const socket = socketRef.current!;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("session-description", pc.localDescription, remoteId);
  };

  const setupSocketListeners = useCallback(
    (socket: Socket) => {
      socket.on("new-user-joined", (newUser: User) => {
        setPeerData((prev) => ({ ...prev, [newUser.id]: newUser.username }));

        const pc = createPeerConnection(newUser.id, true);
        console.log(newUser, "userObject");

        if (screenSharingPeer && screenStream) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
      });

      socket.on(
        "existing-users",
        (existingUsers: User[], currentScreenSharer: string | null) => {
          existingUsers.forEach((user) => {
            setPeerData((prev) => ({ ...prev, [user.id]: user.username }));
          });

          if (currentScreenSharer && currentScreenSharer !== userId) {
            setScreenSharingPeer(currentScreenSharer);
            socket.emit("request-screen-stream", currentScreenSharer);
          }
        }
      );

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

      socket.on("send-screen-stream", async (requesterId: string) => {
        if (!isScreenSharing || !screenStream) return;

        const pc = peerConnectionsRef.current[requesterId];
        if (pc) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            await sender.replaceTrack(screenStream.getVideoTracks()[0]);
            negotiate(pc, requesterId);
          }
        }
      });

      socket.on("user-left", removeRemoteVideo);

      socket.on("chat-message", (msg: ChatMessage) => {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });

      socket.on(
        "reaction",
        ({ userId, reaction }: { userId: string; reaction: string }) => {
          setReactions((prev) => ({ ...prev, [userId]: reaction }));
          setTimeout(() => {
            setReactions((prev) => {
              const newState = { ...prev };
              delete newState[userId];
              return newState;
            });
          }, 3000);
        }
      );

      socket.on("raise-hand", (id: string) => {
        setRaisedHands((prev) => new Set(prev).add(id));
      });

      socket.on("lower-hand", (id: string) => {
        setRaisedHands((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      });

      socket.on("mute-all", () => {
        if (localStreamRef.current) {
          localStreamRef.current
            .getAudioTracks()
            .forEach((t) => (t.enabled = false));
          setMicEnabled(false);
        }
      });

      socket.on("start-screen-share", (peerId: string) => {
        if (screenSharingPeer && screenSharingPeer !== peerId) {
          const prevBadge = document.getElementById(
            `badge-${screenSharingPeer}`
          );
          if (prevBadge) prevBadge.style.display = "none";
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
    [userId, isScreenSharing, screenStream]
  );

  const handleJoinRoom = async () => {
    if (
      !roomId.trim() ||
      !username.trim() ||
      !userId.trim()
    ) {
      setStatus("Enter a valid Room ID, User ID, Username, and Class ID");
      return;
    }

    try {
      await startLocalStream();
      if (!socketRef.current) socketRef.current = io(SERVER_URL);

      setupSocketListeners(socketRef.current);

      socketRef.current.on("connect", () => {
        const userObject: User = {
          id: userId,
          username: username,
          roomId:roomId,
          screensharingid: undefined,
          screenshared: false,
        };

        setPeerData((prev) => ({ ...prev, [userId]: username }));

        socketRef.current!.emit("join", roomId, username, userId);

        setIsConnected(true);
        setStatus(
          `Joined room "${roomId}" as ${username} (User ID: ${userId})`
        );
      });
    } catch (err) {
      console.error(err);
      setStatus("Failed to join room.");
    }
  };

  const sendReaction = (reaction: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit("reaction", {
      userId: userId,
      reaction,
    });
  };

  const raiseHand = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("raise-hand");
  };

  const lowerHand = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("lower-hand");
  };

  const muteAll = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("mute-all");
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
      id: userId + "-" + Date.now(),
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
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true,
        audio: false,
      });
      setScreenStream(stream);
      setIsScreenSharing(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        playVideoSafely(localVideoRef.current);
      }

      Object.entries(peerConnectionsRef.current).forEach(([peerId, pc]) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(stream.getVideoTracks()[0]);
        }
      });

      socketRef.current.emit("start-screen-share");

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  };

  const stopScreenShare = () => {
    if (!localStreamRef.current || !socketRef.current) return;

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender)
        sender.replaceTrack(localStreamRef.current!.getVideoTracks()[0]);
    });

    screenStream?.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    setIsScreenSharing(false);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.muted = true;
      playVideoSafely(localVideoRef.current);
    }

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

  useEffect(() => {
    if (!screenSharingPeer || !screenStream) return;

    const pc = peerConnectionsRef.current[screenSharingPeer];
    if (pc) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(screenStream.getVideoTracks()[0]);
    }
  }, [screenSharingPeer, screenStream]);

  useEffect(() => {
    if (!localStreamRef.current || !localVideoRef.current) return;

    const stream = localStreamRef.current;
    const video = localVideoRef.current;

    video.srcObject = stream;

    const canvas = document.getElementById("selfCanvas") as HTMLCanvasElement;
    const ctx = canvas?.getContext("2d");

    if (!ctx) return;

    video.onloadedmetadata = () => {
      video.play().catch(() => {});
    };

    video.onplaying = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const draw = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(draw);
      };

      draw();
    };
  }, [localStreamRef.current]);

  useEffect(() => {
    if (!socketRef.current || !localStreamRef.current) return;

    if (screenSharingPeer) {
      const pc = peerConnectionsRef.current[screenSharingPeer];

      if (pc && screenStream) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
      }
    }
  }, [screenSharingPeer, screenStream]);

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
            placeholder="User ID (e.g., student-456)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full p-3 mb-4 rounded-lg bg-gray-700 text-white placeholder-gray-400"
          />
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
            disabled={
              !roomId.trim() ||
              !username.trim() ||
              !userId.trim()
            }
            className={`w-full p-3 rounded-lg font-bold ${
              roomId && username && userId 
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
              id="selfViewContainer"
              className="w-40 h-32 rounded-xl overflow-hidden shadow-lg bg-black relative"
            >
              <canvas
                id="selfCanvas"
                className="absolute inset-0 w-full h-full"
              ></canvas>

              <video
                ref={localVideoRef}
                className="hidden"
                autoPlay
                muted
                playsInline
              />
            </div>

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
            <div className="flex justify-center mt-4 gap-2 flex-wrap">
              <button
                onClick={() => sendReaction("👍")}
                className="p-2 bg-yellow-500 rounded-full"
              >
                <ThumbsUp />
              </button>
              <button
                onClick={() => sendReaction("❤️")}
                className="p-2 bg-pink-500 rounded-full"
              >
                <Heart />
              </button>
              <button
                onClick={() => sendReaction("😂")}
                className="p-2 bg-green-500 rounded-full"
              >
                <Laugh />
              </button>

              {!raisedHands.has(userId || "") ? (
                <button
                  onClick={raiseHand}
                  className="p-2 bg-blue-500 rounded-full"
                >
                  Raise Hand
                </button>
              ) : (
                <button
                  onClick={lowerHand}
                  className="p-2 bg-gray-500 rounded-full"
                >
                  Lower Hand
                </button>
              )}

              <button onClick={muteAll} className="p-2 bg-red-600 rounded-full">
                Mute All
              </button>
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
