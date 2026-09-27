import React, { useEffect, useRef, useState, useCallback } from "react";
import ControlBar from "./ControlBar";
import ChatModal from "./ChatModal";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../../../contexts/SocketContext";
import {
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

// --- Interfaces ---
interface User {
  id: string;
  username: string;
}

type PeerConnectionMap = { [key: string]: RTCPeerConnection };
type PeerDataMap = { [key: string]: string };
type ActiveStreamMap = {
  [key: string]: { stream: MediaStream; username: string };
};

interface ChatMessage {
  id: string;
  username: string;
  message: string;
}

interface PeerMediaStatus {
  mic: boolean;
  video: boolean;
}
type PeerMediaStatusMap = { [key: string]: PeerMediaStatus };

const iceConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// --- VideoTile Component ---
interface VideoTileProps {
  id: string;
  stream: MediaStream;
  username: string;
  isMuted: boolean;
  isScreenShare: boolean;
  isLocalUser: boolean;
  isVideoEnabled: boolean;
  isHandRaised: boolean;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  username,
  isMuted,
  isScreenShare,
  isLocalUser,
  isVideoEnabled,
  isHandRaised,
  isMaximized = false,
  onToggleMaximize,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.srcObject = stream;

    const playVideoSafely = async () => {
      try {
        if (videoEl.paused && (isVideoEnabled || isScreenShare)) {
          await videoEl.play();
        }
      } catch (err: any) {
        if (err.name !== "AbortError" && err.name !== "NotAllowedError") {
          console.warn("Video play failed:", err);
        }
      }
    };

    playVideoSafely();

    return () => {
      videoEl.srcObject = null;
    };
  }, [stream, isVideoEnabled, isScreenShare]);

  return (
    <div className="relative w-full h-full min-h-0 rounded-2xl overflow-hidden bg-black/80 flex items-center justify-center border border-white/10 group">
      {isVideoEnabled || isScreenShare ? (
        <video
          ref={videoRef}
          className={`w-full h-full ${
            isScreenShare ? "object-contain" : "object-cover"
          }`}
          autoPlay
          playsInline
          muted={isMuted}
        />
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-green-900/40 flex items-center justify-center border border-yellow-500/30">
            <span className="text-2xl font-bold text-yellow-500 uppercase">
              {username.charAt(0)}
            </span>
          </div>
          <p className="mt-3 text-white/40 text-xs font-semibold tracking-widest uppercase">
            Feed Off
          </p>
        </div>
      )}

      {onToggleMaximize && (
        <button
          onClick={onToggleMaximize}
          aria-label={isMaximized ? "Minimize video" : "Maximize video"}
          className="absolute top-3 left-3 z-20 p-2 rounded-full bg-black/70 text-white border border-white/10 hover:bg-black/90 active:scale-95 transition-all opacity-80 group-hover:opacity-100"
        >
          {isMaximized ? (
            <Minimize2 className="w-4 h-4 text-yellow-500" />
          ) : (
            <Maximize2 className="w-4 h-4 text-white" />
          )}
        </button>
      )}

      <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1 rounded-full border border-white/10">
        <span className="text-[10px] text-white/90 font-bold uppercase tracking-tight">
          {username} {isLocalUser ? "(You)" : ""}{" "}
          {isScreenShare ? "• SCREEN" : ""}
        </span>
      </div>

      {isHandRaised && (
        <div className="absolute top-3 right-3 p-2 rounded-full animate-bounce z-10">
          <span className="text-[48px]">✋</span>
        </div>
      )}
    </div>
  );
};

// --- Main VideoChat Component ---
const VideoChat: React.FC = () => {
  const { socket } = useSocket();
  const peerConnectionsRef = useRef<PeerConnectionMap>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  //const isStartingLocalStream = useRef(false);
  const pendingScreenSyncRef = useRef<Set<string>>(new Set());
  const screenShareBusyRef = useRef(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const { classId, classTitle, subject } = useParams<{
    classId: string;
    classTitle?: string;
    subject?: any;
  }>();

  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = storedUser?.email || "unknown@email.com";
  const userType = localStorage.getItem("userType");
  const usernameJoined = `${userEmail}-${userType}`;

  const [activeStreams, setActiveStreams] = useState<ActiveStreamMap>({});
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [peerData, setPeerData] = useState<PeerDataMap>({});
  const [isConnected, setIsConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenSharingPeer, setScreenSharingPeer] = useState<string | null>(
    null
  );
  const [focusTarget, setFocusTarget] = useState<"screen" | "people">("screen");
  const [peerMediaStatus, setPeerMediaStatus] = useState<PeerMediaStatusMap>(
    {}
  );
  const [isForceMutedByHost, setIsForceMutedByHost] = useState(false);
  const [maximizedTileId, setMaximizedTileId] = useState<string | null>(null);

  // Pre-join states
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [mediaPermissionGranted, setMediaPermissionGranted] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  const screenSharingPeerRef = useRef<string | null>(null);
  useEffect(() => {
    screenSharingPeerRef.current = screenSharingPeer;
  }, [screenSharingPeer]);

  const displayClassTitle = classTitle
    ? decodeURIComponent(classTitle)
    : "Greenroom Session";
  console.log(peerData);
  // --- Request media + notification permissions on mount ---
  useEffect(() => {
    let mounted = true;

    const requestPermissions = async () => {
      setIsRequestingPermissions(true);
      setPermissionError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setPreviewStream(stream);
        setMediaPermissionGranted(true);

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Media permission denied:", err);
        setMediaPermissionGranted(false);
        setPermissionError(
          "Camera and microphone access is required to join the call.\n\n" +
          "How to allow:\n" +
          "1. Click the lock or info icon next to the website URL\n" +
          "2. Set Camera to Allow\n" +
          "3. Set Microphone to Allow\n" +
          "4. Refresh this page"
        );
      }

      if ("Notification" in window) {
        try {
          const perm = await Notification.requestPermission();
          if (mounted) setNotificationPermission(perm);
        } catch (e) {
          console.warn("Notification permission request failed", e);
        }
      }

      if (mounted) setIsRequestingPermissions(false);
    };

    requestPermissions();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (previewVideoRef.current && previewStream) {
      previewVideoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  const togglePreviewMic = () => {
    if (!localStreamRef.current) return;
    const next = !micEnabled;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicEnabled(next);
  };

  const togglePreviewVideo = () => {
    if (!localStreamRef.current) return;
    const next = !videoEnabled;
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = next));
    setVideoEnabled(next);
  };

  const updateActiveStream = useCallback(
    (socketId: string, stream: MediaStream, username: string) => {
      setActiveStreams((prev) => ({
        ...prev,
        [socketId]: { stream, username },
      }));
    },
    []
  );

  const removeActiveStream = useCallback((socketId: string) => {
    setActiveStreams((prev) => {
      const { [socketId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleToggleMaximize = (id: string) => {
    setMaximizedTileId((prev) => (prev === id ? null : id));
  };

  const negotiate = useCallback(
    async (pc: RTCPeerConnection, remoteId: string) => {
      try {
        if (pc.signalingState !== "stable") return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit("session-description", pc.localDescription, remoteId);
      } catch (error) {
        console.error("Negotiation failed:", error);
      }
    },
    [socket]
  );

  const createPeerConnection = useCallback(
    (remoteSocketId: string, isInitiator: boolean) => {
      const pc = new RTCPeerConnection(iceConfiguration);
      peerConnectionsRef.current[remoteSocketId] = pc;

      const streamToShare = screenStreamRef.current || localStreamRef.current;
      if (streamToShare) {
        streamToShare
          .getTracks()
          .forEach((track) => pc.addTrack(track, streamToShare));
      }

      pc.ontrack = (event) => {
        setPeerData((prev) => {
          const name = prev[remoteSocketId] || "User";
          updateActiveStream(remoteSocketId, event.streams[0], name);
          return prev;
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate)
          socket?.emit("ice-candidate", event.candidate, remoteSocketId);
      };

      if (isInitiator)
        pc.onnegotiationneeded = () => negotiate(pc, remoteSocketId);
      return pc;
    },
    [socket, negotiate, updateActiveStream]
  );

  const syncScreenShareToPeer = useCallback(
    (peerId: string) => {
      if (!screenStreamRef.current) return;
      const pc = peerConnectionsRef.current[peerId];
      const screenTrack = screenStreamRef.current.getVideoTracks()[0];
      if (!pc || !screenTrack) return;

      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        if (sender.track !== screenTrack) sender.replaceTrack(screenTrack);
      } else {
        pc.addTrack(screenTrack, screenStreamRef.current);
      }
      negotiate(pc, peerId);
    },
    [negotiate]
  );

  // --- Socket Listeners ---
  useEffect(() => {
    if (!socket) return;

    socket.on("new-user-joined", (newUser: User) => {
      setPeerData((prev) => ({ ...prev, [newUser.id]: newUser.username }));
      createPeerConnection(newUser.id, true);

      if (pendingScreenSyncRef.current.has(newUser.id)) {
        pendingScreenSyncRef.current.delete(newUser.id);
        syncScreenShareToPeer(newUser.id);
      }
    });

    socket.on(
      "existing-users",
      (existingUsers: User[], currentScreenSharerId: string | null) => {
        existingUsers.forEach((user) => {
          setPeerData((prev) => ({ ...prev, [user.id]: user.username }));
          createPeerConnection(user.id, false);
        });
        if (currentScreenSharerId) {
          setScreenSharingPeer(currentScreenSharerId);
          setFocusTarget("screen");
        }
      }
    );

    socket.on(
      "session-description",
      async (senderId: string, sdp: RTCSessionDescriptionInit) => {
        let pc =
          peerConnectionsRef.current[senderId] ||
          createPeerConnection(senderId, false);
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
      async (senderId: string, candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionsRef.current[senderId];
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    );

    socket.on("user-left", (id: string) => {
      removeActiveStream(id);
      peerConnectionsRef.current[id]?.close();
      delete peerConnectionsRef.current[id];
      pendingScreenSyncRef.current.delete(id);
      if (screenSharingPeerRef.current === id) setScreenSharingPeer(null);
      if (maximizedTileId === id) setMaximizedTileId(null);
    });

    socket.on("chat-message", (msg: ChatMessage) =>
      setChatMessages((prev) => [...prev, msg])
    );

    socket.on("media-toggle", ({ senderId, mediaStatus }) => {
      setPeerMediaStatus((prev) => ({ ...prev, [senderId]: mediaStatus }));
    });

    socket.on("start-screen-share", (id: string) => {
      setScreenSharingPeer(id);
      setFocusTarget("screen");
    });

    socket.on("stop-screen-share", () => setScreenSharingPeer(null));

    socket.on("raise-hand", (id: string) =>
      setRaisedHands((prev) => new Set(prev).add(id))
    );
    socket.on("lower-hand", (id: string) =>
      setRaisedHands((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      })
    );

    socket.on("force-mute", () => {
      localStreamRef.current
        ?.getAudioTracks()
        .forEach((t) => (t.enabled = false));
      setMicEnabled(false);
      setIsForceMutedByHost(true);
    });

    socket.on("force-unmute", () => {
      localStreamRef.current
        ?.getAudioTracks()
        .forEach((t) => (t.enabled = true));
      setMicEnabled(true);
      setIsForceMutedByHost(false);
    });

    socket.on("prepare-late-joiner-screen", (lateJoinerId: string) => {
      if (peerConnectionsRef.current[lateJoinerId]) {
        syncScreenShareToPeer(lateJoinerId);
      } else {
        pendingScreenSyncRef.current.add(lateJoinerId);
      }
    });

    socket.on("force-leave-room", () => handleLeave());
    socket.on("room-ended", () => handleLeave());

    return () => {
      socket.off("new-user-joined");
      socket.off("existing-users");
      socket.off("session-description");
      socket.off("ice-candidate");
      socket.off("user-left");
      socket.off("chat-message");
      socket.off("media-toggle");
      socket.off("start-screen-share");
      socket.off("stop-screen-share");
      socket.off("raise-hand");
      socket.off("lower-hand");
      socket.off("force-mute");
      socket.off("force-unmute");
      socket.off("prepare-late-joiner-screen");
      socket.off("force-leave-room");
      socket.off("room-ended");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    socket,
    createPeerConnection,
    removeActiveStream,
    syncScreenShareToPeer,
    maximizedTileId,
  ]);

  const handleJoinRoom = async () => {
    if (!classId || !socket) return;

    if (!mediaPermissionGranted || !localStreamRef.current) {
      setPermissionError(
        "Camera and microphone access is required. Please allow access and try again."
      );
      return;
    }

    try {
      updateActiveStream(socket.id!, localStreamRef.current, usernameJoined);
      socket.emit("join", classId, usernameJoined, socket.id);
      socket.emit("media-toggle", { mic: micEnabled, video: videoEnabled });
      setIsConnected(true);
    } catch (err) {
      alert("Failed to join the room.");
    }
  };

  const toggleMic = () => {
    const next = !micEnabled;
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicEnabled(next);
    socket?.emit("media-toggle", { mic: next, video: videoEnabled });
  };

  const toggleVideo = () => {
    if (isScreenSharing) {
      console.warn("Camera toggle disabled during screen sharing");
      return;
    }

    const next = !videoEnabled;
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setVideoEnabled(next);
    socket?.emit("media-toggle", { mic: micEnabled, video: next });
  };

  const startScreenShare = async () => {
    if (isScreenSharing || screenShareBusyRef.current) return;
    screenShareBusyRef.current = true;

    try {
      if (!videoEnabled && localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.enabled = true;
        });
        setVideoEnabled(true);
        socket?.emit("media-toggle", {
          mic: micEnabled,
          video: true,
        });
      }

      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { cursor: "always" },
      });

      const screenTrack: MediaStreamTrack = stream.getVideoTracks()[0];
      if (!screenTrack) throw new Error("No screen video track");

      screenStreamRef.current = stream;
      setIsScreenSharing(true);

      if (localStreamRef.current && socket?.id) {
        updateActiveStream(socket.id, localStreamRef.current, usernameJoined);
      }

      const localScreenId = `${socket?.id || "local"}-screen`;
      setMaximizedTileId(localScreenId);

      Object.entries(peerConnectionsRef.current).forEach(([id, pc]) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack).catch(console.error);
        } else if (screenStreamRef.current) {
          pc.addTrack(screenTrack, screenStreamRef.current);
        }
        negotiate(pc, id);
      });

      socket?.emit("start-screen-share");

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn("Screen share failed:", err);
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    } finally {
      screenShareBusyRef.current = false;
    }
  };

  const stopScreenShare = () => {
    if (!screenStreamRef.current || screenShareBusyRef.current) return;
    screenShareBusyRef.current = true;

    try {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      setMaximizedTileId(null);

      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (localStreamRef.current && socket?.id) {
        updateActiveStream(socket.id, localStreamRef.current, usernameJoined);
      }

      Object.entries(peerConnectionsRef.current).forEach(([id, pc]) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (camTrack) {
          if (sender) {
            sender.replaceTrack(camTrack);
          } else if (localStreamRef.current) {
            pc.addTrack(camTrack, localStreamRef.current);
          }
        }
        negotiate(pc, id);
      });

      socket?.emit("stop-screen-share");
    } finally {
      screenShareBusyRef.current = false;
    }
  };

  const handleLeave = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      socket?.emit("stop-screen-share");
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop();
      });
      pc.close();
    });
    peerConnectionsRef.current = {};

    setActiveStreams({});
    setScreenSharingPeer(null);
    setMaximizedTileId(null);
    setIsScreenSharing(false);
    setIsConnected(false);
    setRaisedHands(new Set());
    setPeerData({});
    setPeerMediaStatus({});
    setChatMessages([]);
    setPreviewStream(null);

    socket?.emit("leave-room");
    navigate(-1);
  }, [navigate, socket]);

  useEffect(() => {
    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        pc.getSenders().forEach((s) => s.track?.stop());
        pc.close();
      });
      peerConnectionsRef.current = {};
      socket?.emit("leave-room");
    };
  }, [socket]);

  const streamsArray = Object.entries(activeStreams).filter(
    ([id]) => id !== screenSharingPeer
  );
  const presenterData = screenSharingPeer
    ? activeStreams[screenSharingPeer]
    : null;
  const userCount = streamsArray.length + (isScreenSharing ? 1 : 0);

  const getGridCols = () => {
    if (screenSharingPeer && screenSharingPeer !== socket?.id)
      return "opacity-10 scale-90 blur-[100px] pointer-events-none";

    switch (userCount) {
      case 1:
        return "grid-cols-1 max-w-4xl mx-auto";
      case 2:
        return "grid-cols-1 sm:grid-cols-2 max-w-5xl mx-auto";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 max-w-7xl mx-auto";
      case 5:
      case 6:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 max-w-7xl mx-auto";
      case 7:
      case 8:
      case 9:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-8xl mx-auto";
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-9xl mx-auto";
    }
  };

  const localScreenId = `${socket?.id || "local"}-screen`;

  const canJoin =
    mediaPermissionGranted &&
    !!localStreamRef.current &&
    !isRequestingPermissions;

  return (
<div
    className={`bg-emerald-950 text-white h-screen max-h-screen flex flex-col relative font-sans ${
      isConnected ? "overflow-hidden" : "overflow-y-auto"
    }`}
  >
    {!isConnected ? (
      /* ===================== PRE-JOIN SCREEN ===================== */
      <div className="flex-1 flex items-start justify-center p-4 md:p-6 min-h-full">
        <div className="w-full max-w-md space-y-5 py-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-yellow-500 tracking-tight">
              {displayClassTitle}
            </h1>
            <p className="text-white/40 text-[10px] font-black tracking-[0.35em] uppercase">
              {subject || "Classroom"} Session
            </p>
          </div>

          {/* Live Preview */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/50 border border-white/10">
            {previewStream && videoEnabled ? (
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <div className="w-16 h-16 rounded-full bg-green-900/40 flex items-center justify-center border border-yellow-500/30">
                  <span className="text-2xl font-bold text-yellow-500 uppercase">
                    {usernameJoined.charAt(0)}
                  </span>
                </div>
                <p className="text-white/40 text-xs font-semibold tracking-widest uppercase">
                  {videoEnabled ? "Starting camera…" : "Camera Off"}
                </p>
              </div>
            )}

            {/* Mic / Video toggles */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              <button
                onClick={togglePreviewMic}
                className={`p-2.5 rounded-full border transition-all ${
                  micEnabled
                    ? "bg-black/60 border-white/20 text-white"
                    : "bg-red-600/90 border-red-500 text-white"
                }`}
              >
                {micEnabled ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={togglePreviewVideo}
                className={`p-2.5 rounded-full border transition-all ${
                  videoEnabled
                    ? "bg-black/60 border-white/20 text-white"
                    : "bg-red-600/90 border-red-500 text-white"
                }`}
              >
                {videoEnabled ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Permission Alerts */}
          <div className="space-y-2.5">
            {/* Camera & Mic Alert */}
            <div
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                mediaPermissionGranted
                  ? "bg-green-950/40 border-green-700/40"
                  : "bg-red-950/40 border-red-700/40"
              }`}
            >
              {mediaPermissionGranted ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Camera & Microphone</p>
                <p className="text-xs text-white/60 mt-0.5">
                  {mediaPermissionGranted
                    ? "Access granted. You can join the call."
                    : "Required for the video call. Please allow access."}
                </p>

                {!mediaPermissionGranted && (
                  <button
                    onClick={async () => {
                      setIsRequestingPermissions(true);
                      setPermissionError(null);
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                          video: true,
                          audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                          },
                        });
                        localStreamRef.current = stream;
                        setPreviewStream(stream);
                        setMediaPermissionGranted(true);
                        if (previewVideoRef.current) {
                          previewVideoRef.current.srcObject = stream;
                        }
                      } catch (err) {
                        setMediaPermissionGranted(false);
                        setPermissionError(
                          "Camera and microphone access is required to join the call.\n\n" +
                            "How to allow:\n" +
                            "1. Click the lock or info icon next to the website URL\n" +
                            "2. Set Camera to Allow\n" +
                            "3. Set Microphone to Allow\n" +
                            "4. Refresh this page"
                        );
                      } finally {
                        setIsRequestingPermissions(false);
                      }
                    }}
                    className="mt-2 text-xs font-semibold text-yellow-400 hover:text-yellow-300 underline"
                  >
                    Allow Camera & Mic
                  </button>
                )}
              </div>
            </div>

            {/* Notifications Alert */}
            <div
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                notificationPermission === "granted"
                  ? "bg-green-950/40 border-green-700/40"
                  : notificationPermission === "denied"
                  ? "bg-red-950/40 border-red-700/40"
                  : "bg-yellow-950/30 border-yellow-700/40"
              }`}
            >
              {notificationPermission === "granted" ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              ) : notificationPermission === "denied" ? (
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Notifications</p>
                <p className="text-xs text-white/60 mt-0.5">
                  {notificationPermission === "granted"
                    ? "Enabled. You will receive class alerts."
                    : notificationPermission === "denied"
                    ? "Blocked. You must enable them manually in browser settings."
                    : "Recommended so you don’t miss important class alerts."}
                </p>

                {notificationPermission !== "granted" && (
                  <button
                    onClick={async () => {
                      const perm = await Notification.requestPermission();
                      setNotificationPermission(perm);

                      if (perm === "denied") {
                        setPermissionError(
                          "Notifications are blocked. To enable them:\n\n" +
                            "1. Click the lock / info icon next to the URL in your browser\n" +
                            "2. Find Notifications and set to Allow\n" +
                            "3. Refresh this page"
                        );
                      }
                    }}
                    className="mt-2 text-xs font-semibold text-yellow-400 hover:text-yellow-300 underline"
                  >
                    Allow Notifications
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error message */}
          {permissionError && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl border bg-red-950/50 border-red-700/50">
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 whitespace-pre-line">
                {permissionError}
              </p>
            </div>
          )}

          {isRequestingPermissions && (
            <p className="text-center text-white/50 text-sm">
              Requesting permissions…
            </p>
          )}

          {/* Join Button */}
          <button
            className={`w-full font-black py-4 rounded-xl transition-all text-sm tracking-wide ${
              canJoin
                ? "bg-yellow-500 text-green-950 hover:bg-yellow-400 active:scale-[0.98]"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            }`}
            onClick={handleJoinRoom}
            disabled={!canJoin}
          >
            {canJoin ? "JOIN NOW" : "ALLOW CAMERA & MIC TO JOIN"}
          </button>

          <p className="text-center text-white/30 text-[11px] leading-relaxed px-2 pb-4">
            Camera and microphone are required to join. Notifications are
            optional but help you stay updated.
          </p>
        </div>
      </div>
      ) : (
        /* ===================== IN-CALL UI ===================== */
        <>
          <div className="absolute top-5 left-6 z-[60] flex gap-2">
            <button
              onClick={handleLeave}
              className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-colors"
            >
              Leave Room
            </button>
            {(userType === "teacher" || userType === "admin") && (
              <button
                onClick={() => socket?.emit("remove-all-users")}
                className="bg-red-600/80 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 transition-colors"
              >
                End Class
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative h-full p-4 md:p-8 overflow-hidden">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-6">
              {displayClassTitle}
            </p>

            <div
              className={`grid gap-6 transition-all duration-700 flex-1 overflow-hidden ${getGridCols()} justify-center`}
            >
              {isScreenSharing && screenStreamRef.current && (
                <div
                  key={localScreenId}
                  className="w-full aspect-video max-h-[60vh]"
                >
                  <VideoTile
                    id={localScreenId}
                    stream={screenStreamRef.current}
                    username={`${usernameJoined} (Screen)`}
                    isMuted={true}
                    isScreenShare={true}
                    isLocalUser={true}
                    isVideoEnabled={true}
                    isHandRaised={false}
                    isMaximized={maximizedTileId === localScreenId}
                    onToggleMaximize={() => handleToggleMaximize(localScreenId)}
                  />
                </div>
              )}

              {streamsArray.map(([id, data]) => (
                <div key={id} className="w-full aspect-video max-h-[60vh]">
                  <VideoTile
                    id={id}
                    stream={data.stream}
                    username={data.username}
                    isMuted={id === socket?.id}
                    isScreenShare={false}
                    isLocalUser={id === socket?.id}
                    isVideoEnabled={
                      id === socket?.id
                        ? videoEnabled
                        : peerMediaStatus[id]?.video ?? true
                    }
                    isHandRaised={raisedHands.has(id)}
                    isMaximized={maximizedTileId === id}
                    onToggleMaximize={() => handleToggleMaximize(id)}
                  />
                </div>
              ))}
            </div>

            {/* Fullscreen Overlay */}
            {maximizedTileId && (
              <div className="absolute inset-0 z-[55] bg-black/95 p-4 md:p-8 flex items-center justify-center">
                <div className="w-full h-full max-w-7xl max-h-[85vh] relative">
                  {maximizedTileId === localScreenId &&
                  screenStreamRef.current ? (
                    <VideoTile
                      id={localScreenId}
                      stream={screenStreamRef.current}
                      username={`${usernameJoined} (Screen)`}
                      isMuted={true}
                      isScreenShare={true}
                      isLocalUser={true}
                      isVideoEnabled={true}
                      isHandRaised={false}
                      isMaximized={true}
                      onToggleMaximize={() => setMaximizedTileId(null)}
                    />
                  ) : activeStreams[maximizedTileId] ? (
                    <VideoTile
                      id={maximizedTileId}
                      stream={activeStreams[maximizedTileId].stream}
                      username={activeStreams[maximizedTileId].username}
                      isMuted={maximizedTileId === socket?.id}
                      isScreenShare={false}
                      isLocalUser={maximizedTileId === socket?.id}
                      isVideoEnabled={
                        maximizedTileId === socket?.id
                          ? videoEnabled
                          : peerMediaStatus[maximizedTileId]?.video ?? true
                      }
                      isHandRaised={raisedHands.has(maximizedTileId)}
                      isMaximized={true}
                      onToggleMaximize={() => setMaximizedTileId(null)}
                    />
                  ) : null}
                </div>
              </div>
            )}

            {/* Remote Screen Share Overlay */}
            {screenSharingPeer &&
              screenSharingPeer !== socket?.id &&
              presenterData && (
                <div className="absolute inset-0 z-40 p-4 md:p-12 flex items-center justify-center">
                  <div className="w-full h-full max-h-[82vh] bg-black/40 rounded-3xl border border-white/10 flex flex-col overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase text-yellow-500 tracking-[0.3em]">
                            Stage Focus
                          </span>
                        </div>
                        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                          <button
                            onClick={() => setFocusTarget("screen")}
                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                              focusTarget === "screen"
                                ? "bg-yellow-500 text-black"
                                : "text-white/40 hover:text-white"
                            }`}
                          >
                            Screen
                          </button>
                          <button
                            onClick={() => setFocusTarget("people")}
                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                              focusTarget === "people"
                                ? "bg-yellow-500 text-black"
                                : "text-white/40 hover:text-white"
                            }`}
                          >
                            People
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-4 md:p-6 overflow-hidden flex items-center justify-center">
                      {focusTarget === "screen" ? (
                        <VideoTile
                          id={screenSharingPeer}
                          stream={presenterData.stream}
                          username={presenterData.username}
                          isMuted={true}
                          isScreenShare={true}
                          isLocalUser={screenSharingPeer === socket?.id}
                          isVideoEnabled={true}
                          isHandRaised={false}
                          isMaximized={maximizedTileId === screenSharingPeer}
                          onToggleMaximize={() =>
                            handleToggleMaximize(screenSharingPeer)
                          }
                        />
                      ) : (
                        <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto p-1">
                          {Object.entries(activeStreams).map(([id, data]) => (
                            <div key={id} className="w-full aspect-video">
                              <VideoTile
                                id={id}
                                stream={data.stream}
                                username={data.username}
                                isMuted={id === socket?.id}
                                isScreenShare={false}
                                isLocalUser={id === socket?.id}
                                isVideoEnabled={
                                  id === socket?.id
                                    ? videoEnabled
                                    : peerMediaStatus[id]?.video ?? true
                                }
                                isHandRaised={raisedHands.has(id)}
                                isMaximized={maximizedTileId === id}
                                onToggleMaximize={() =>
                                  handleToggleMaximize(id)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            <ControlBar
              socket={socket}
              micEnabled={micEnabled}
              videoEnabled={videoEnabled}
              toggleMic={toggleMic}
              toggleVideo={toggleVideo}
              startScreenShare={startScreenShare}
              stopScreenShare={stopScreenShare}
              isScreenSharing={isScreenSharing}
              raisedHands={raisedHands}
              userId={socket?.id || ""}
              raiseHand={() => socket?.emit("raise-hand")}
              lowerHand={() => socket?.emit("lower-hand")}
              muteAll={() => socket?.emit("mute-all")}
              unmuteAll={() => socket?.emit("unmute-all")}
              username={usernameJoined}
              roomId={classId || ""}
              isForceMutedByHost={isForceMutedByHost}
              userType={userType}
            />

            <ChatModal
              username={usernameJoined}
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              sendChatMessage={() => {
                if (!chatInput.trim()) return;
                const msg = {
                  id: Date.now().toString(),
                  username: usernameJoined,
                  message: chatInput,
                };
                socket?.emit("chat-message", msg);
                setChatMessages((prev) => [...prev, msg]);
                setChatInput("");
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default VideoChat;
