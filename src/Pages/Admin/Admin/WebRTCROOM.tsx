import React, { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { User, VideoOff, MicOff } from "lucide-react";
import ControlBar from "./ControlBar";
import ChatModal from "./ChatModal";
import { motion } from "framer-motion";

interface User {
  id?: any;
  username: string;
  screensharingid?: string;
  screenshared?: boolean;
  roomId?: string;
  isHandRaised?: boolean;
  userId?: string;
  isShowVideo?: boolean;
  isMuted?: boolean;
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
  interface RemotePeer {
    id?: any;
    stream: any;
    username: string;
    isScreenSharing?: boolean;
    screensharingid?: string;
    screenshared?: boolean;
    roomId?: string;
    isHandRaised?: boolean;
    userId?: string;
    isShowVideo?: boolean;
    isMuted?: boolean;
  }
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionsRef = useRef<PeerConnectionMap>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isStartingLocalStream = useRef(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<{ [userId: string]: string }>({});
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");

  const [screenShareInfo, setScreenShareInfo] = useState<{
    id: any;
    userId: string;
    username: string;
    stream: MediaStream | null;
  } | null>(null);

  const screenShareVideoRef = useRef<HTMLVideoElement>(null);

  const [peerData, setPeerData] = useState<PeerDataMap>({});
  const [status, setStatus] = useState(
    "Enter a Room ID and username, then click Join."
  );

  const screenStreamRef = useRef<MediaStream | null>(null);

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

  const addRemoteVideo = (
    id: string,
    stream: MediaStream,
    username?: string
  ) => {
    if (id === userId) return; // skip self

    setRemotePeers((prev) => {
      const existing = prev.find((p) => p.id === id);
      console.log(`📤 existing`, existing, prev);

      if (existing) {
        // DO NOT REMOVE, DO NOT RESET — only update stream + username
        return prev.map((p) =>
          p.id === id
            ? {
                ...p, // keep all existing fields
                stream, // update stream only
                userId: userId || p.userId,
                username: username || p.username,
                isScreenSharing: p.isScreenSharing, // preserve current state
                isMuted: p.isMuted,
                isShowVideo: p.isShowVideo,
                isHandRaised: p.isHandRaised,
                screenshared: p.screenshared,
              }
            : p
        );
      }

      return [
        ...prev,
        {
          id,
          stream,
          username: username || `Peer: ${id.slice(0, 6)}`,
          isScreenSharing: id === screenSharingPeer,
          isMuted: false,
          isShowVideo: true,
          isHandRaised: false,
        },
      ];
    });
  };
  const removeRemoteVideo = (id: string) => {
    console.log("Removing peer from state:", id);

    setRemotePeers((prev) => prev.filter((p) => p.id !== id));

    // Close peer connection
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
      console.log("Creating RTCPeerConnection for peer:", remoteSocketId);
      console.log("Is initiator?", isInitiator);

      const pc = new RTCPeerConnection(iceConfiguration);
      peerConnectionsRef.current[remoteSocketId] = pc;

      console.log("Local stream tracks:", localStreamRef.current?.getTracks());

      if (localStreamRef.current) {
        const localStream = localStreamRef.current;
        Object.keys(peerConnectionsRef.current).forEach((peerId) => {
          if (peerId === userId) return; // skip sending to self
          const pc = peerConnectionsRef.current[peerId];
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream); // <-- ERROR occurs here
          });
        });
      }
      pc.ontrack = (event) => {
        const stream = event.streams[0];

        setRemotePeers((prev) => {
          const peer = prev.find((p) => p.id === remoteSocketId);
          if (!peer) return prev;

          // If this peer is the current screen sharer → put stream in big screen
          if (screenShareInfo && peer.userId === screenShareInfo.userId) {
            setTimeout(() => {
              if (screenShareVideoRef.current) {
                screenShareVideoRef.current.srcObject = stream;
                playVideoSafely(screenShareVideoRef.current);
              }
            }, 100);
          }

          return prev.map((p) =>
            p.id === remoteSocketId ? { ...p, stream } : p
          );
        });
      };
      const userData = {
        id: socketRef.current!.id,
        userId,
        username,
        roomId,
        screenshared: false,
        isHandRaised: false,
        isShowVideo: true,
        isMuted: false,
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log(
            "🟢 Sending ICE candidate:",
            event.candidate,
            "to",
            remoteSocketId
          );
          socketRef.current.emit(
            "ice-candidate",
            event.candidate,
            remoteSocketId,
            userData
          );
        }
      };
      if (isInitiator) {
        console.log("Initiator: starting negotiation with", remoteSocketId);
        negotiate(pc, remoteSocketId);
      }

      return pc;
    },
    [roomId]
  );

  const negotiate = async (pc: RTCPeerConnection, remoteId: string) => {
    const socket = socketRef.current!;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("session-description", pc.localDescription, remoteId);
  };

  const playVideo = async (el: HTMLVideoElement) => {
    try {
      if (el.paused) await el.play();
    } catch (e) {}
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,

        audio: false,
      });

      screenStreamRef.current = stream;

      setScreenStream(stream);

      setIsScreenSharing(true);

      // SHOW SCREEN LOCALLY (only for you)

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;

        await playVideo(localVideoRef.current);
      }

      // SEND SCREEN TO OTHERS (replace track in peer connections)

      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const videoSender = pc
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (videoSender && stream.getVideoTracks()[0]) {
          videoSender.replaceTrack(stream.getVideoTracks()[0]);
        }
      });

      // Tell server

      socketRef.current?.emit("start-screen-share", {
        roomId,
        userId,
        username,
      });

      stream.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch (err) {
      console.log("Screen share cancelled");
    }
  };
  const stopScreenShare = () => {
    if (!screenStreamRef.current || !localStreamRef.current) return;

    // Stop screen tracks

    screenStreamRef.current.getTracks().forEach((t) => t.stop());

    screenStreamRef.current = null;

    setScreenStream(null);

    setIsScreenSharing(false);

    // SHOW CAMERA AGAIN LOCALLY

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;

      playVideo(localVideoRef.current);
    }

    // SEND CAMERA BACK TO EVERYONE

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      const videoSender = pc
        .getSenders()
        .find((s) => s.track?.kind === "video");

      const camTrack = localStreamRef.current!.getVideoTracks()[0];

      if (videoSender && camTrack) {
        videoSender.replaceTrack(camTrack);
      }
    });

    socketRef.current?.emit("stop-screen-share", { roomId, userId });
  };
  const setupSocketListeners = useCallback(
    (socket: Socket) => {
      socket.on("new-user-joined", (newUser: User) => {
        // Store username
        console.log("📄 Candidate newUser:", newUser);
        setPeerData((prev) => ({ ...prev, [newUser.id]: newUser.username }));

        addRemoteVideo(newUser.id, null as any, newUser.username);

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
            // Store username
            setPeerData((prev) => ({ ...prev, [user.id]: user.username }));

            addRemoteVideo(user.id, null as any, user.username);
          });

          if (currentScreenSharer && currentScreenSharer !== userId) {
            setScreenSharingPeer(currentScreenSharer);
            socket.emit("request-screen-stream", currentScreenSharer);
          }
        }
      );
      socket.on("request-screen-share", async (newUserId: string) => {
        if (!screenStream || !peerConnectionsRef.current[newUserId]) return;

        const pc = peerConnectionsRef.current[newUserId];
        screenStream
          .getTracks()
          .forEach((track) => pc.addTrack(track, screenStream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("session-description", pc.localDescription, newUserId);
      });

      socket.on(
        "peer-media-update",
        (data: {
          id: string;
          username: string;
          isMuted: boolean;
          isShowVideo: boolean;
          isHandRaised: boolean;
        }) => {
          console.log("Peer media update received:", data);

          // Update remotePeers state
          setRemotePeers((prev) => {
            // Check if the peer exists
            const peerExists = prev.some((peer) => peer.id === data.id);

            if (peerExists) {
              // Update existing peer
              return prev.map((peer) =>
                peer.id === data.id
                  ? {
                      ...peer,
                      username: data.username,
                      isMuted: data.isMuted,
                      isShowVideo: data.isShowVideo,
                      isHandRaised: data.isHandRaised,
                      isScreenSharing: peer.isScreenSharing, // preserve screen sharing
                    }
                  : peer
              );
            } else {
              // Add new peer if not exists
              return [
                ...prev,
                {
                  id: data.id,
                  stream: null, // stream will be set later when track arrives
                  username: data.username,
                  isMuted: data.isMuted,
                  isShowVideo: data.isShowVideo,
                  isHandRaised: data.isHandRaised,
                  isScreenSharing: false,
                },
              ];
            }
          });

          // Update raisedHands set for UI
          setRaisedHands((prev) => {
            const newSet = new Set(prev);
            if (data.isHandRaised) newSet.add(data.id);
            else newSet.delete(data.id);
            return newSet;
          });
        }
      );

      socket.on(
        "session-description",
        async (senderId: string, sdp: SessionDescription) => {
          let pc = peerConnectionsRef.current[senderId];
          if (!pc) {
            pc = createPeerConnection(senderId, false);
          }

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));

          if (sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("session-description", pc.localDescription, senderId);
          }
        }
      );
      socket.on("ice-candidate", (candidate, user) => {
        console.log(
          "🟢 ICE candidate received from:",
          user.username,
          "| ID:",
          user.userId,
          candidate
        );

        const pc = peerConnectionsRef.current[user.id];
        if (pc && candidate) {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });
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
        console.log("Received chat message:", msg);
        console.log("From user:", msg.username, "| ID:", msg.id);
        console.log("Message text:", msg.message);

        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) {
            console.log("Duplicate message detected, ignoring:", msg.id);
            return prev;
          }
          console.log("Adding new message to state:", msg);
          return [...prev, msg];
        });
      });

      socket.on(
        "reaction",
        (data: { userId: string; username: string; reaction: string }) => {
          const { userId, reaction } = data;

          console.log("🟢 Received reaction:", data);

          // Update reactions state
          setReactions((prev) => ({ ...prev, [userId]: reaction }));

          // Automatically remove reaction after 3 seconds
          setTimeout(() => {
            setReactions((prev) => {
              const copy = { ...prev };
              delete copy[userId];
              return copy;
            });
          }, 3000);
        }
      );

      // ---------------- RAISE HAND ----------------
      socket.on("raise-hand", (data: { userId: string; username: string }) => {
        const { userId } = data;

        setRaisedHands((prev) => {
          const set = new Set(prev);
          set.add(userId);
          return set;
        });
      });

      // ---------------- LOWER HAND ----------------
      socket.on("lower-hand", (data: { userId: string; username: string }) => {
        const { userId } = data;

        setRaisedHands((prev) => {
          const set = new Set(prev);
          set.delete(userId);
          return set;
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
      // Someone started sharing
      socket.on("start-screen-share", (data: { sharer: any; users: any[] }) => {
        try {
          const sharer = data.sharer;

          // Update the big screen tile
          setScreenShareInfo({
            id: sharer.id,
            userId: sharer.userId,
            username: sharer.username,
            stream: null, // will be replaced when track arrives
          });

          console.log("📢 Someone started sharing:", data);

          // Map users and ensure proper flags
          const updatedPeers = data.users.map((peer) => ({
            ...peer,
            isScreenSharing: !!peer.isScreenSharing,
            screenshared: !!peer.screenshared,
          }));

          console.log("🔹 Updating remote peers with:", updatedPeers);

          // Check if we actually have a change
          setRemotePeers((prevPeers) => {
            const isDifferent =
              prevPeers.length !== updatedPeers.length ||
              prevPeers.some(
                (p, i) =>
                  p.userId !== updatedPeers[i].userId ||
                  p.isScreenSharing !== updatedPeers[i].isScreenSharing ||
                  p.screenshared !== updatedPeers[i].screenshared
              );

            if (isDifferent) {
              console.log("✅ Remote peers updated successfully.");
              return updatedPeers;
            } else {
              console.error(
                "⚠️ Remote peers not updated — no changes detected!"
              );
              return prevPeers; // return previous state if no change
            }
          });
        } catch (err) {
          console.error("❌ Error updating remote peers:", err);
        }
      });
      // Someone stopped sharing
      socket.on("stop-screen-share", () => {
        setScreenShareInfo(null);

        // Remove sharing flag from all peers
        setRemotePeers((prev) =>
          prev.map((p) => ({ ...p, isScreenSharing: false }))
        );

        // Clear the big screen
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = null;
        }
      });
    },
    [userId, isScreenSharing, screenStream, screenSharingPeer]
  );

  const handleJoinRoom = async () => {
    if (!roomId.trim() || !username.trim() || !userId.trim()) {
      setStatus("Enter a valid Room ID, User ID, Username, and Class ID");
      return;
    }

    try {
      await startLocalStream();
      if (!socketRef.current) socketRef.current = io(SERVER_URL);

      setupSocketListeners(socketRef.current);

      socketRef.current.on("connect", () => {
        setPeerData((prev) => ({
          ...prev,
          [socketRef?.current?.id as any]: username,
        }));

        console.log("A user connected:", socketRef?.current?.id);

        const userData = {
          id: socketRef.current!.id,
          userId,
          username,
          roomId,
          screenshared: false,
          isHandRaised: false,
          isShowVideo: true,
          isMuted: false,
        };
        socketRef.current!.emit("join", userData);

        socketRef?.current?.emit(
          "request-current-screen-share",
          socketRef.current.id
        );

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

  const muteAll = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("mute-all");
  };
  // Example: toggling mic
  const toggleMic = () => {
    if (!localStreamRef.current || !socketRef.current) return;
    console.log("📤 Emitting media-toggle (mic):", socketRef);
    const newMicState = !micEnabled;
    localStreamRef.current
      .getAudioTracks()
      .forEach((t) => (t.enabled = newMicState));
    setMicEnabled(newMicState);

    const payload = {
      mic: newMicState,
      video: videoEnabled,
      isHandRaised: raisedHands.has(userId),
      roomId,
      userId,
    };

    console.log("📤 Emitting media-toggle (mic):", newMicState, payload);
    socketRef.current.emit("media-toggle", payload);
  };

  // Example: toggling video
  const toggleVideo = () => {
    if (!localStreamRef.current || !socketRef.current) return;

    const newVideoState = !videoEnabled;
    localStreamRef.current
      .getVideoTracks()
      .forEach((t) => (t.enabled = newVideoState));
    setVideoEnabled(newVideoState);

    socketRef.current.emit("media-toggle", {
      mic: micEnabled,
      video: newVideoState,
      isHandRaised: raisedHands.has(userId),
      roomId,
      userId,
    });
  };

  // Example: raise hand
  const raiseHand = () => {
    if (!socketRef.current) return;

    socketRef.current.emit("media-toggle", {
      mic: micEnabled,
      video: videoEnabled,
      isHandRaised: true,
      roomId,
      userId,
    });
    setRaisedHands((prev) => new Set(prev).add(userId));
  };

  // Example: lower hand
  const lowerHand = () => {
    if (!socketRef.current) return;

    socketRef.current.emit("media-toggle", {
      mic: micEnabled,
      video: videoEnabled,
      isHandRaised: false,
      roomId,
      userId,
    });
    setRaisedHands((prev) => {
      const copy = new Set(prev);
      copy.delete(userId);
      return copy;
    });
  };
  const sendChatMessage = () => {
    if (!chatInput.trim() || !socketRef.current) {
      console.log("Message not sent. Empty input or socket missing.");
      return;
    }

    const msg: ChatMessage = {
      id: userId + "-" + Date.now(),
      username,
      message: chatInput,
    };

    console.log("Sending chat message:", msg);

    socketRef.current.emit("chat-message", msg);

    setChatMessages((prev) => {
      console.log("Previous messages:", prev);
      const updated = [...prev, msg];
      console.log("Updated messages:", updated);
      return updated;
    });

    setChatInput("");
    console.log("Chat input cleared.");
  };

  // useEffect(() => {
  //   return () => {
  //     socketRef.current?.disconnect();
  //     localStreamRef.current?.getTracks().forEach((t) => t.stop());
  //     Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
  //     peerConnectionsRef.current = {};
  //   };
  // }, []);

  useEffect(() => {
    if (localStreamRef.current && userId && username) {
      setRemotePeers((prev) => [
        ...prev.filter((p) => p.id !== userId),
        {
          id: socketRef?.current!.id,
          userId: userId,
          stream: localStreamRef.current,
          username: username,
          isScreenSharing: false,
          isMuted: false,
          isShowVideo: true,
          isHandRaised: false,
        },
      ]);
    }
  }, [localStreamRef.current, userId, username]);

  useEffect(() => {
    if (!screenSharingPeer || !screenStream) return;

    const pc = peerConnectionsRef.current[screenSharingPeer];
    if (!pc) return;

    // Find the sender that is sending video (not audio)
    const videoSender = pc
      .getSenders()
      .find((s) => s.track && s.track.kind === "video");

    if (videoSender) {
      // Replace track with new screen-sharing video track
      videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
    }
  }, [screenSharingPeer, screenStream]);

  useEffect(() => {
    if (localStreamRef.current && userId && username && socketRef.current?.id) {
      const selfId = socketRef.current.id;

      console.log("Local stream ready:", localStreamRef.current);
      console.log("Self info:", { selfId, userId, username });

      setRemotePeers((prev) => {
        const exists = prev.find((p) => p.id === selfId);

        if (exists) {
          console.log("Updating self peer in list...");
          // Only update fields, keep everything else (mute, video, hand, etc)
          return prev.map((p) =>
            p.id === selfId
              ? {
                  ...p,
                  stream: localStreamRef.current!,
                  username,
                }
              : p
          );
        }

        console.log("Adding self peer to list...");

        // Add self as a new peer
        return [
          ...prev,
          {
            id: selfId,
            stream: localStreamRef.current!,
            username,
            isMuted: false,
            isShowVideo: true,
            isHandRaised: false,
          },
        ];
      });
    }
  }, [localStreamRef.current, userId, username]);

  const uniqueRemotePeers = Array.from(
    new Map(remotePeers.map((p) => [p.id, p])).values()
  );
  console.log(uniqueRemotePeers, remotePeers, "remotePeers");


  useEffect(() => {
    if (!localVideoRef.current) return;

    if (isScreenSharing && screenStreamRef.current) {
      localVideoRef.current.srcObject = screenStreamRef.current;
    } else if (localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [
    isScreenSharing,
    localVideoRef,
    screenStreamRef.current,
    localStreamRef.current,
  ]);

  return (
    <div className="bg-[#071F0C] text-white flex flex-col items-center justify-center py-8 px-4 min-h-screen w-full">
      {!isConnected ? (
        <div className="">
          <h2 className="text-xl font-semibold mb-4">Join a Room</h2>
          <input
            type="text"
            placeholder="User ID (e.g., student-456)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className=""
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className=""
          />
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className=""
          />

          <button
            onClick={handleJoinRoom}
            disabled={!roomId.trim() || !username.trim() || !userId.trim()}
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
        <div className="w-full">
          <div className="w-full">
            <div className="flex-1 p-4 pb-20 overflow-hidden">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-semibold text-center mb-6 opacity-90">
                  Participants ({uniqueRemotePeers.length})
                </h2>
                <div
                  className="
  grid
  justify-center              /* centers the grid when it doesn't fill the row */
  w-full
  min-h-[60vh]
  gap-6
  px-4
  grid-cols-[repeat(auto-fit,minmax(280px,1fr))]
  auto-rows-[minmax(200px,auto)]
"
                >
                  {screenShareInfo &&
                    isScreenSharing &&
                    screenShareInfo.userId === userId && (
                      <motion.div
                        layout
                        className="relative aspect-video rounded-2xl overflow-hidden bg-black/80 border-2 border-gray-600"
                      >
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-3 left-3 bg-black/70 px-4 py-2 rounded-full text-sm backdrop-blur">
                          You ({username}) • Presenting
                        </div>
                      </motion.div>
                    )}

                  <div
                    className={`
    grid
    gap-4
    w-full
    auto-rows-[minmax(200px,auto)]
    ${
      uniqueRemotePeers.some((p) => p.isScreenSharing && p.userId !== userId)
        ? "grid-cols-1 lg:grid-cols-[70%_30%]" // someone sharing
        : "grid-cols-[repeat(auto-fit,minmax(280px,1fr))]"
    }
  `}
                  >
                    {uniqueRemotePeers.map((peer, index) => {
                      const isBigScreen =
                        peer.isScreenSharing && peer.userId !== userId;

                      return (
                        <motion.div
                          key={peer.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.35, delay: index * 0.05 }}
                          className={`
        relative
        aspect-video
        rounded-2xl
        overflow-hidden
        shadow-2xl
        bg-black/50
        border-2
        ${
          peer.isScreenSharing && peer.userId !== userId
            ? "border-red-500"
            : "border-gray-700"
        }
        w-full lg:col-span-1
      `}
                          style={{
                            gridColumn: isBigScreen ? "span 1" : undefined,
                          }}
                        >
                          {/* VIDEO */}
                          <video
                            autoPlay
                            playsInline
                            muted={peer.id === userId}
                            ref={(el) =>
                              el && peer.stream && (el.srcObject = peer.stream)
                            }
                            className="w-full h-full object-cover"
                          />

                          {/* USERNAME */}
                          <div className="absolute z-20 bottom-3 left-3 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium pointer-events-none">
                            {peer.username || peer.id.slice(0, 6)}
                          </div>

                          {/* Muted indicator */}
                          {peer.isMuted && (
                            <div className="absolute top-3 right-3 bg-red-600 p-2 rounded-full pointer-events-none">
                              <MicOff className="w-5 h-5 text-white" />
                            </div>
                          )}

                          {/* Video off overlay */}
                          {!peer.isShowVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
                              <div className="flex flex-col items-center text-white">
                                <VideoOff className="w-6 h-6 mb-2" />
                                <span className="text-[14px]">Video Off</span>
                              </div>
                            </div>
                          )}

                          {/* Hand raised */}
                          {peer.isHandRaised && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none">
                              <motion.div
                                animate={{
                                  scale: [1, 1.2, 1],
                                  rotate: [0, -10, 10, 0],
                                }}
                                transition={{
                                  duration: 1.4,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                                className="text-5xl mb-4"
                              >
                                ✋
                              </motion.div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <ControlBar
              socket={socketRef.current}
              micEnabled={!micEnabled}
              videoEnabled={videoEnabled}
              toggleMic={toggleMic}
              toggleVideo={toggleVideo}
              startScreenShare={startScreenShare}
              stopScreenShare={stopScreenShare}
              isScreenSharing={isScreenSharing}
              raisedHands={raisedHands}
              userId={userId}
              raiseHand={raiseHand}
              lowerHand={lowerHand}
              muteAll={muteAll}
              username={username}
              roomId={roomId}
            />

            <ChatModal
              username={username}
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              sendChatMessage={sendChatMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoChat;