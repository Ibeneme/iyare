import React, { useEffect, useRef, useState, useCallback } from "react";
import ControlBar from "./ControlBar";
import ChatModal from "./ChatModal";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../../../contexts/SocketContext";

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
}

const VideoTile: React.FC<VideoTileProps> = ({
  id,
  stream,
  username,
  isMuted,
  isScreenShare,
  isLocalUser,
  isVideoEnabled,
  isHandRaised,
}) => {
  console.log(id)
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      const playVideoSafely = async (videoEl: HTMLVideoElement) => {
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
      playVideoSafely(videoRef.current);
    }
  }, [stream, isVideoEnabled, isScreenShare]);

  return (
    <div className="relative w-full h-full min-h-0 rounded-[24px] overflow-hidden bg-black/80 flex items-center justify-center shadow-2xl border border-white/5">
      {isVideoEnabled || isScreenShare ? (
        <video
          ref={videoRef}
          className={`w-full h-full ${
            isScreenShare ? "object-contain" : "object-cover"
          } `}
          autoPlay
          playsInline
          muted={isMuted}
        />
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-green-900/50 flex items-center justify-center border border-yellow-500/30">
            <span className="text-3xl font-bold text-yellow-500 uppercase">
              {username.charAt(0)}
            </span>
          </div>
          <p className="mt-4 text-white/30 text-xs font-semibold tracking-widest uppercase">
            Feed Off
          </p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
        <span className="text-[10px] text-white/90 font-bold uppercase tracking-tight">
          {username} {isLocalUser ? "(You)" : ""}{" "}
          {isScreenShare ? "• SCREEN" : ""}
        </span>
      </div>

      {isHandRaised && (
        <div className="absolute top-4 right-4 p-2 rounded-full animate-bounce z-10">
          <span className="text-[64px]">✋</span>
        </div>
      )}
    </div>
  );
};

// --- Main VideoChat Component ---
const VideoChat: React.FC = () => {
  const { socket } = useSocket(); // Using the Global Socket Context
  const peerConnectionsRef = useRef<PeerConnectionMap>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isStartingLocalStream = useRef(false);
  // Tracks late-joiner ids the presenter still needs to sync a screen
  // track to, in case "prepare-late-joiner-screen" arrives before the
  // peer connection for that joiner has been created.
  const pendingScreenSyncRef = useRef<Set<string>>(new Set());
  // Guards against overlapping start/stop screen-share calls.
  const screenShareBusyRef = useRef(false);

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
  const [focusTarget, setFocusTarget] = useState<"screen" | "video">("screen");
  const [peerMediaStatus, setPeerMediaStatus] = useState<PeerMediaStatusMap>(
    {}
  );
  const [isForceMutedByHost, setIsForceMutedByHost] = useState(false);

  const screenSharingPeerRef = useRef<string | null>(null);
  useEffect(() => {
    screenSharingPeerRef.current = screenSharingPeer;
  }, [screenSharingPeer]);

  const displayClassTitle = classTitle
    ? decodeURIComponent(classTitle)
    : "Greenroom Session";

  const updateActiveStream = useCallback(
    (socketId: string, stream: MediaStream, username: string) => {
      setActiveStreams((prev) => ({
        ...prev,
        [socketId]: { stream, username },
      }));
    },
    []
  );
  console.log(peerData, isStartingLocalStream)

  const removeActiveStream = useCallback((socketId: string) => {
    setActiveStreams((prev) => {
      const { [socketId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

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

  // Defensive re-sync: make sure a given peer connection actually carries
  // our current screen-share track. Used both right after a late joiner's
  // peer connection is created, and when the server explicitly asks us to
  // double check (via "prepare-late-joiner-screen").
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

  // --- Socket Listeners Setup ---
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

    // Presenter-only: the server tells us a late joiner is arriving so we
    // can double check the screen track actually made it to them.
    socket.on("prepare-late-joiner-screen", (lateJoinerId: string) => {
      if (peerConnectionsRef.current[lateJoinerId]) {
        syncScreenShareToPeer(lateJoinerId);
      } else {
        // Peer connection for this joiner doesn't exist yet — remember to
        // sync as soon as "new-user-joined" creates it.
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
    // NOTE: screenSharingPeer is intentionally NOT a dependency here — the
    // ref above keeps handlers current without re-subscribing every socket
    // listener on every screen-share change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, createPeerConnection, removeActiveStream, syncScreenShareToPeer]);

  // --- Handlers ---
  const handleJoinRoom = async () => {
    if (!classId || !socket) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;

      updateActiveStream(socket.id!, stream, usernameJoined);
      socket.emit("join", classId, usernameJoined, socket.id);
      socket.emit("media-toggle", { mic: micEnabled, video: videoEnabled });
      setIsConnected(true);
    } catch (err) {
      alert("Media access denied!");
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
      return; // Prevent interference with active screen share
    }

    const next = !videoEnabled;
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setVideoEnabled(next);
    socket?.emit("media-toggle", { mic: micEnabled, video: next });
  };
  // --- Screen Sharing (rewritten to be resilient) ---
  const startScreenShare = async () => {
    if (isScreenSharing || screenShareBusyRef.current) return;
    screenShareBusyRef.current = true;

    try {
      // === FORCE TURN ON VIDEO IF IT'S OFF ===
      if (!videoEnabled && localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.enabled = true;
        });
        setVideoEnabled(true);
        socket?.emit("media-toggle", {
          mic: micEnabled,
          video: true,
        });
        console.log("Camera forced ON for screen sharing");
      }

      // Now start screen sharing
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { cursor: "always" },
      });

      const screenTrack: MediaStreamTrack = stream.getVideoTracks()[0];
      if (!screenTrack) throw new Error("No screen video track");

      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      updateActiveStream(socket!.id!, stream, usernameJoined);

      // Replace video track with screen on all peers
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

      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (localStreamRef.current) {
        updateActiveStream(socket!.id!, localStreamRef.current, usernameJoined);
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
    // Stop sharing cleanly so we don't leave a ghost presenter behind.
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      socket?.emit("stop-screen-share");
    }

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};

    // Tell the server we're gone — the socket itself stays alive since
    // it's shared globally across the app.
    socket?.emit("leave-room");

    navigate(-1);
  }, [navigate, socket]);

  // Best-effort cleanup if the component unmounts some other way (browser
  // back button, route change, etc.) without the user hitting "Leave Room".
  useEffect(() => {
    return () => {
      socket?.emit("leave-room");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Grid Logic ---
  const streamsArray = Object.entries(activeStreams).filter(
    ([id]) => id !== screenSharingPeer
  );
  const presenterData = screenSharingPeer
    ? activeStreams[screenSharingPeer]
    : null;
  const userCount = streamsArray.length;

  const getGridCols = () => {
    if (screenSharingPeer)
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

  return (
    <div className="bg-emerald-950 text-white h-screen max-h-screen flex flex-col relative overflow-hidden font-sans">
      {!isConnected ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-green-950/20 p-12 rounded-[48px] border border-green-800/30 w-full max-w-md shadow-2xl backdrop-blur-2xl text-center">
            <h1 className="text-4xl font-black text-yellow-500 mb-2 tracking-tighter">
              {displayClassTitle} - {subject || ""} Class
            </h1>
            <p className="text-white/40 text-[10px] font-black tracking-[0.4em] mb-10 uppercase">
              Classroom Session
            </p>
            <div className="space-y-4">
              <button
                className="w-full bg-yellow-500 text-green-950 font-black py-5 rounded-2xl hover:bg-yellow-400 active:scale-95 transition-all shadow-xl shadow-yellow-500/20"
                onClick={handleJoinRoom}
              >
                JOIN NOW
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="absolute top-6 left-10 z-[60] flex gap-3">
            <button
              onClick={handleLeave}
              className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase"
            >
              Leave Room
            </button>
            {(userType === "teacher" || userType === "admin") && (
              <button
                onClick={() => socket?.emit("remove-all-users")}
                className="bg-red-600/80 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase"
              >
                End Class
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative h-full p-4 md:p-10 overflow-hidden">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em] mb-8">
              {displayClassTitle}
            </p>

            <div
              className={`grid gap-8 transition-all duration-1000 flex-1 overflow-hidden ${getGridCols()} justify-center`}
            >
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
                  />
                </div>
              ))}
            </div>

            {screenSharingPeer && presenterData && (
              <div className="absolute inset-0 z-40 p-6 md:p-16 flex items-center justify-center">
                <div className="w-full h-full max-h-[82vh] bg-white/[0.02] backdrop-blur-[120px] rounded-[60px] border border-white/10 shadow-[0_0_150px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-700">
                  <div className="px-10 py-6 flex items-center justify-between border-b border-white/5 bg-black/60">
                    <div className="flex items-center gap-6">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase text-yellow-500 tracking-[0.5em]">
                          Stage Focus
                        </span>
                      </div>
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        <button
                          onClick={() => setFocusTarget("screen")}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            focusTarget === "screen"
                              ? "bg-yellow-500 text-black shadow-lg"
                              : "text-white/40 hover:text-white"
                          }`}
                        >
                          Screen
                        </button>
                        <button
                          onClick={() => setFocusTarget("video")}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            focusTarget === "video"
                              ? "bg-yellow-500 text-black shadow-lg"
                              : "text-white/40 hover:text-white"
                          }`}
                        >
                          Presenter
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-6 md:p-10 overflow-hidden flex items-center justify-center">
                    <VideoTile
                      id={screenSharingPeer}
                      stream={presenterData.stream}
                      username={presenterData.username}
                      isMuted={true}
                      isScreenShare={focusTarget === "screen"}
                      isLocalUser={screenSharingPeer === socket?.id}
                      isVideoEnabled={true}
                      isHandRaised={false}
                    />
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
