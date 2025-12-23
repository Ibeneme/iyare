// import React, { useEffect, useRef, useState, useCallback } from "react";
// import { io, Socket } from "socket.io-client";
// import ControlBar from "./ControlBar";
// import ChatModal from "./ChatModal";
// import { BASE_URL } from "../../../Redux/baseurl";
// import { useSearchParams, useParams, useNavigate } from "react-router-dom";

// // --- Interfaces ---
// interface User {
//   id: string;
//   username: string;
//   email?: string;
//   screensharingid?: string;
//   screenshared?: boolean;
//   roomId?: string;
// }

// interface SessionDescription {
//   type: "offer" | "answer";
// }

// type PeerConnectionMap = { [key: string]: RTCPeerConnection };
// type PeerDataMap = { [key: string]: string };
// type ActiveStreamMap = {
//   [key: string]: { stream: MediaStream; username: string };
// };

// interface ChatMessage {
//   id: string;
//   username: string;
//   message: string;
// }

// interface PeerMediaStatus {
//   mic: boolean;
//   video: boolean;
// }
// type PeerMediaStatusMap = { [key: string]: PeerMediaStatus };

// const SERVER_URL = BASE_URL;

// const iceConfiguration: RTCConfiguration = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     { urls: "stun:stun1.l.google.com:19302" },
//   ],
// };

// interface VideoTileProps {
//   id: string;
//   stream: MediaStream;
//   username: string;
//   isMuted: boolean;
//   isScreenShare: boolean;
//   isLocalUser: boolean;
//   isVideoEnabled: boolean;
//   isHandRaised: boolean;
// }

// const VideoTile: React.FC<VideoTileProps> = ({
//   id,
//   stream,
//   username,
//   isMuted,
//   isScreenShare,
//   isLocalUser,
//   isVideoEnabled,
//   isHandRaised,
// }) => {
//   const videoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     if (videoRef.current) {
//       videoRef.current.srcObject = stream;
//       const playVideoSafely = async (videoEl: HTMLVideoElement) => {
//         try {
//           if (videoEl.paused && (isVideoEnabled || isScreenShare))
//             await videoEl.play();
//         } catch (err: any) {
//           if (err.name !== "AbortError")
//             console.warn("Video play failed:", err);
//         }
//       };
//       playVideoSafely(videoRef.current);
//     }
//   }, [stream, isVideoEnabled, isScreenShare]);

//   return (
//     <div className="relative w-full h-full min-h-0 rounded-[24px] overflow-hidden bg-black/80 flex items-center justify-center shadow-2xl border border-white/5">
//       {isVideoEnabled || isScreenShare ? (
//         <video
//           ref={videoRef}
//           className={`w-full h-full ${
//             isScreenShare ? "object-contain" : "object-cover"
//           } ${isLocalUser && !isScreenShare ? "scale-x-[-1]" : ""}`}
//           autoPlay
//           playsInline
//           muted={isMuted}
//         />
//       ) : (
//         <div className="flex flex-col items-center">
//           <div className="w-20 h-20 rounded-full bg-green-900/50 flex items-center justify-center border border-yellow-500/30">
//             <span className="text-3xl font-bold text-yellow-500 uppercase">
//               {username.charAt(0)}
//             </span>
//           </div>
//           <p className="mt-4 text-white/30 text-xs font-semibold tracking-widest uppercase">
//             Feed Off
//           </p>
//         </div>
//       )}

//       <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
//         <span className="text-[10px] text-white/90 font-bold uppercase tracking-tight">
//           {username} {isLocalUser ? "(You)" : ""}{" "}
//           {isScreenShare ? "• SCREEN" : ""}
//         </span>
//       </div>

//       {isHandRaised && (
//         <div className="absolute top-4 right-4 bg-yellow-500 p-2 rounded-full shadow-lg animate-bounce z-10">
//           <span className="text-xl">✋</span>
//         </div>
//       )}
//     </div>
//   );
// };

// const VideoChat: React.FC = () => {
//   const navigate = useNavigate();
//   const peerConnectionsRef = useRef<PeerConnectionMap>({});
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const socketRef = useRef<Socket | null>(null);
//   const isStartingLocalStream = useRef(false);
//   const isJoiningRef = useRef(false); // To prevent double-mount joining

//   const [searchParams] = useSearchParams();

//   const { classId, classTitle } = useParams<{
//     classId: string;
//     classTitle?: string;
//   }>();

//   const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
//   const userEmail = storedUser?.email || "unknown@email.com";
//   const urlUsername =
//     searchParams.get("username") || storedUser?.firstName || "Anonymous";
//   const username = `${urlUsername} (${userEmail})`;

//   const roomId = classId || "";
//   const displayClassTitle = classTitle
//     ? decodeURIComponent(classTitle)
//     : "Greenroom Session";

//   const [activeStreams, setActiveStreams] = useState<ActiveStreamMap>({});
//   const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
//   const [peerData, setPeerData] = useState<PeerDataMap>({});
//   const [isConnected, setIsConnected] = useState(false);
//   const [micEnabled, setMicEnabled] = useState(true);
//   const [videoEnabled, setVideoEnabled] = useState(true);
//   const [chatInput, setChatInput] = useState("");
//   const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
//   const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [screenSharingPeer, setScreenSharingPeer] = useState<string | null>(
//     null
//   );
//   const [focusTarget, setFocusTarget] = useState<"screen" | "video">("screen");
//   const [peerMediaStatus, setPeerMediaStatus] = useState<PeerMediaStatusMap>(
//     {}
//   );
//   const [isForceMutedByHost, setIsForceMutedByHost] = useState(false);

//   const screenStreamRef = useRef<MediaStream | null>(null);

//   // --- CLEANUP LOGIC ---
//   const cleanupConnections = useCallback(() => {
//     Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
//     peerConnectionsRef.current = {};
//     if (socketRef.current) {
//       socketRef.current.disconnect();
//       socketRef.current = null;
//     }
//     isJoiningRef.current = false;
//   }, []);

//   const handleLeave = useCallback(() => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((track) => track.stop());
//     }
//     if (screenStreamRef.current) {
//       screenStreamRef.current.getTracks().forEach((track) => track.stop());
//     }
//     cleanupConnections();
//     navigate(-1);
//   }, [navigate, cleanupConnections]);

//   const updateActiveStream = useCallback(
//     (socketId: string, stream: MediaStream, username: string) => {
//       setActiveStreams((prev) => ({
//         ...prev,
//         [socketId]: { stream, username },
//       }));
//     },
//     []
//   );

//   const removeActiveStream = useCallback((socketId: string) => {
//     setActiveStreams((prev) => {
//       const { [socketId]: _, ...rest } = prev;
//       return rest;
//     });
//   }, []);

//   const negotiate = async (pc: RTCPeerConnection, remoteId: string) => {
//     try {
//       const offer = await pc.createOffer();
//       await pc.setLocalDescription(offer);
//       socketRef.current?.emit(
//         "session-description",
//         pc.localDescription,
//         remoteId
//       );
//     } catch (error) {
//       console.error("Negotiation failed:", error);
//     }
//   };

//   const startLocalStream = useCallback(
//     async (isInitial = false) => {
//       if (localStreamRef.current && !isInitial) return localStreamRef.current;
//       if (isStartingLocalStream.current) return;
//       isStartingLocalStream.current = true;

//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: true,
//           audio: { echoCancellation: true, noiseSuppression: true },
//         });
//         localStreamRef.current = stream;
//         if (socketRef.current)
//           updateActiveStream(socketRef.current.id!, stream, username);
//         stream.getAudioTracks().forEach((t) => (t.enabled = micEnabled));
//         stream.getVideoTracks().forEach((t) => (t.enabled = videoEnabled));
//         return stream;
//       } catch (err) {
//         alert("Media access denied!");
//         throw err;
//       } finally {
//         isStartingLocalStream.current = false;
//       }
//     },
//     [micEnabled, videoEnabled, username, updateActiveStream]
//   );

//   const createPeerConnection = useCallback(
//     (remoteSocketId: string, isInitiator: boolean) => {
//       const pc = new RTCPeerConnection(iceConfiguration);
//       peerConnectionsRef.current[remoteSocketId] = pc;
//       const streamToShare = screenStreamRef.current || localStreamRef.current;

//       if (streamToShare) {
//         streamToShare.getTracks().forEach((track) => {
//           pc.addTrack(track, streamToShare);
//         });
//       }

//       pc.ontrack = (event) => {
//         // Use functional state update to ensure we have latest peerData
//         setPeerData((currentPeers) => {
//           const name = currentPeers[remoteSocketId] || "User";
//           updateActiveStream(remoteSocketId, event.streams[0], name);
//           return currentPeers;
//         });
//       };

//       pc.onicecandidate = (event) => {
//         if (event.candidate)
//           socketRef.current?.emit(
//             "ice-candidate",
//             event.candidate,
//             remoteSocketId
//           );
//       };

//       if (isInitiator)
//         pc.onnegotiationneeded = () => negotiate(pc, remoteSocketId);
//       return pc;
//     },
//     [updateActiveStream]
//   );

//   const setupSocketListeners = useCallback(
//     (socket: Socket) => {
//       socket.on("new-user-joined", (newUser: User) => {
//         setPeerData((prev) => ({ ...prev, [newUser.id]: newUser.username }));
//         createPeerConnection(newUser.id, true);
//       });

//       socket.on(
//         "existing-users",
//         (existingUsers: User[], currentScreenSharerId: string | null) => {
//           // --- FIXED: MERGE LOGIC ---
//           // Filter out any existing entries that match our current identity
//           // to prevent showing ourselves as a remote peer.
//           const actualPeers = existingUsers.filter(
//             (u) => u.username !== username && u.id !== socket.id
//           );

//           actualPeers.forEach((user) => {
//             setPeerData((prev) => ({ ...prev, [user.id]: user.username }));
//             createPeerConnection(user.id, false);
//           });

//           if (currentScreenSharerId) {
//             setScreenSharingPeer(currentScreenSharerId);
//             setFocusTarget("screen");
//           }
//         }
//       );

//       socket.on(
//         "session-description",
//         async (senderId: string, sdp: SessionDescription) => {
//           let pc =
//             peerConnectionsRef.current[senderId] ||
//             createPeerConnection(senderId, false);
//           if (sdp.type === "answer" && pc.signalingState !== "have-local-offer")
//             return;
//           try {
//             await pc.setRemoteDescription(new RTCSessionDescription(sdp));
//             if (sdp.type === "offer") {
//               const answer = await pc.createAnswer();
//               await pc.setLocalDescription(answer);
//               socket.emit("session-description", pc.localDescription, senderId);
//             }
//           } catch (err) {
//             console.error("SDP Error:", err);
//           }
//         }
//       );

//       socket.on(
//         "ice-candidate",
//         async (senderId: string, candidate: RTCIceCandidate) => {
//           const pc = peerConnectionsRef.current[senderId];
//           if (pc) await pc.addIceCandidate(candidate);
//         }
//       );

//       socket.on("user-left", (id) => {
//         removeActiveStream(id);
//         peerConnectionsRef.current[id]?.close();
//         delete peerConnectionsRef.current[id];
//         if (screenSharingPeer === id) setScreenSharingPeer(null);
//       });

//       socket.on("chat-message", (msg: ChatMessage) =>
//         setChatMessages((prev) => [...prev, msg])
//       );

//       socket.on("media-toggle", ({ senderId, mediaStatus }) => {
//         setPeerMediaStatus((prev) => ({ ...prev, [senderId]: mediaStatus }));
//       });

//       socket.on("start-screen-share", (id) => {
//         setScreenSharingPeer(id);
//         setFocusTarget("screen");
//       });

//       socket.on("stop-screen-share", () => {
//         setScreenSharingPeer(null);
//       });

//       socket.on("raise-hand", (id) =>
//         setRaisedHands((prev) => new Set(prev).add(id))
//       );
//       socket.on("lower-hand", (id) =>
//         setRaisedHands((prev) => {
//           const next = new Set(prev);
//           next.delete(id);
//           return next;
//         })
//       );

//       socket.on("force-mute", () => {
//         if (localStreamRef.current) {
//           localStreamRef.current
//             .getAudioTracks()
//             .forEach((t) => (t.enabled = false));
//           setMicEnabled(false);
//           setIsForceMutedByHost(true);
//         }
//       });
//     },
//     [createPeerConnection, removeActiveStream, screenSharingPeer, username]
//   );

//   useEffect(() => {
//     if (!roomId || !username || isJoiningRef.current) return;

//     const joinRoom = async () => {
//       isJoiningRef.current = true;
//       try {
//         const stream = await startLocalStream(true);
//         socketRef.current = io(SERVER_URL);
//         setupSocketListeners(socketRef.current);

//         socketRef.current.on("connect", () => {
//           const id = socketRef.current!.id!;
//           updateActiveStream(id, stream!, username);
//           socketRef.current!.emit("join", roomId, username, id);
//           socketRef.current!.emit("media-toggle", {
//             mic: micEnabled,
//             video: videoEnabled,
//           });
//           setIsConnected(true);
//         });
//       } catch (err) {
//         console.error("Join failed:", err);
//         isJoiningRef.current = false;
//       }
//     };

//     joinRoom();

//     return () => {
//       // Cleanup when component unmounts
//       cleanupConnections();
//     };
//   }, [roomId]);

//   const toggleMic = () => {
//     const next = !micEnabled;
//     localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
//     setMicEnabled(next);
//     socketRef.current?.emit("media-toggle", { mic: next, video: videoEnabled });
//   };

//   const toggleVideo = () => {
//     const next = !videoEnabled;
//     localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
//     setVideoEnabled(next);
//     socketRef.current?.emit("media-toggle", { mic: micEnabled, video: next });
//   };

//   const startScreenShare = async () => {
//     try {
//       const stream = await (navigator.mediaDevices as any).getDisplayMedia({
//         video: true,
//       });
//       screenStreamRef.current = stream;
//       setScreenStream(stream);
//       setIsScreenSharing(true);
//       updateActiveStream(socketRef.current!.id!, stream, username);
//       Object.entries(peerConnectionsRef.current).forEach(([id, pc]) => {
//         const sender = pc.getSenders().find((s) => s.track?.kind === "video");
//         if (sender) sender.replaceTrack(stream.getVideoTracks()[0]);
//       });
//       socketRef.current?.emit("start-screen-share");
//       stream.getVideoTracks()[0].onended = stopScreenShare;
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const stopScreenShare = () => {
//     screenStreamRef.current?.getTracks().forEach((t) => t.stop());
//     screenStreamRef.current = null;
//     setScreenStream(null);
//     setIsScreenSharing(false);
//     updateActiveStream(
//       socketRef.current!.id!,
//       localStreamRef.current!,
//       username
//     );
//     Object.entries(peerConnectionsRef.current).forEach(([id, pc]) => {
//       const sender = pc.getSenders().find((s) => s.track?.kind === "video");
//       sender?.replaceTrack(localStreamRef.current!.getVideoTracks()[0]);
//     });
//     socketRef.current?.emit("stop-screen-share");
//   };

//   const sendChatMessage = () => {
//     if (!chatInput.trim()) return;
//     const msg = { id: Date.now().toString(), username, message: chatInput };
//     socketRef.current?.emit("chat-message", msg);
//     setChatMessages((prev) => [...prev, msg]);
//     setChatInput("");
//   };

//   const streamsArray = Object.entries(activeStreams).filter(
//     ([id]) => id !== screenSharingPeer
//   );
//   const presenterData = screenSharingPeer
//     ? activeStreams[screenSharingPeer]
//     : null;

//   const getGridCols = () => {
//     if (screenSharingPeer)
//       return "opacity-10 scale-90 blur-[100px] pointer-events-none";
//     const userCount = streamsArray.length;
//     if (userCount <= 1) return "grid-cols-1 max-w-4xl mx-auto";
//     if (userCount <= 2) return "grid-cols-1 sm:grid-cols-2 max-w-5xl mx-auto";
//     return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-8xl mx-auto";
//   };

//   return (
//     <div className="bg-[#020803] text-white h-screen max-h-screen flex flex-col relative overflow-hidden font-sans">
//       <div className="absolute top-6 left-10 z-[60]">
//         <button
//           onClick={handleLeave}
//           className="bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-500 border border-white/10 hover:border-red-500/50 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all backdrop-blur-md"
//         >
//           Leave Room
//         </button>
//       </div>

//       <div className="flex-1 flex flex-col items-center justify-center relative h-full p-4 md:p-10 overflow-hidden">
//         <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em] mb-8">
//           {displayClassTitle}
//         </p>

//         <div
//           className={`grid gap-8 transition-all duration-1000 flex-1 overflow-hidden ${getGridCols()} justify-center`}
//         >
//           {streamsArray.map(([id, data]) => (
//             <div
//               key={id}
//               className="w-full h-full min-h-0 flex items-center justify-center"
//             >
//               <div className="w-full aspect-video max-h-[60vh]">
//                 <VideoTile
//                   id={id}
//                   stream={data.stream}
//                   username={data.username}
//                   isMuted={id === socketRef.current?.id}
//                   isScreenShare={false}
//                   isLocalUser={id === socketRef.current?.id}
//                   isVideoEnabled={
//                     id === socketRef.current?.id
//                       ? videoEnabled
//                       : peerMediaStatus[id]?.video ?? true
//                   }
//                   isHandRaised={raisedHands.has(id)}
//                 />
//               </div>
//             </div>
//           ))}
//         </div>

//         {screenSharingPeer && presenterData && (
//           <div className="absolute inset-0 z-40 p-6 md:p-16 flex items-center justify-center">
//             <div className="w-full h-full max-h-[82vh] bg-white/[0.02] backdrop-blur-[120px] rounded-[60px] border border-white/10 shadow-[0_0_150px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-700">
//               <div className="px-10 py-6 flex items-center justify-between border-b border-white/5 bg-black/60">
//                 <div className="flex items-center gap-6">
//                   <div className="flex gap-1.5">
//                     <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
//                     <span className="text-[10px] font-black uppercase text-yellow-500 tracking-[0.5em]">
//                       Stage Focus
//                     </span>
//                   </div>
//                   <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
//                     <button
//                       onClick={() => setFocusTarget("screen")}
//                       className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
//                         focusTarget === "screen"
//                           ? "bg-yellow-500 text-black shadow-lg"
//                           : "text-white/40 hover:text-white"
//                       }`}
//                     >
//                       Screen
//                     </button>
//                     <button
//                       onClick={() => setFocusTarget("video")}
//                       className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
//                         focusTarget === "video"
//                           ? "bg-yellow-500 text-black shadow-lg"
//                           : "text-white/40 hover:text-white"
//                       }`}
//                     >
//                       Presenter
//                     </button>
//                   </div>
//                 </div>
//               </div>
//               <div className="flex-1 p-6 md:p-10 overflow-hidden flex items-center justify-center">
//                 <VideoTile
//                   id={screenSharingPeer}
//                   stream={presenterData.stream}
//                   username={presenterData.username}
//                   isMuted={true}
//                   isScreenShare={focusTarget === "screen"}
//                   isLocalUser={screenSharingPeer === socketRef.current?.id}
//                   isVideoEnabled={true}
//                   isHandRaised={false}
//                 />
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="z-50 mt-auto pt-8">
//           <ControlBar
//             socket={socketRef.current}
//             micEnabled={micEnabled}
//             videoEnabled={videoEnabled}
//             toggleMic={toggleMic}
//             toggleVideo={toggleVideo}
//             startScreenShare={startScreenShare}
//             stopScreenShare={stopScreenShare}
//             isScreenSharing={isScreenSharing}
//             raisedHands={raisedHands}
//             userId={socketRef.current?.id || ""}
//             raiseHand={() => socketRef.current?.emit("raise-hand")}
//             lowerHand={() => socketRef.current?.emit("lower-hand")}
//             muteAll={() => socketRef.current?.emit("mute-all")}
//             unmuteAll={() => socketRef.current?.emit("unmute-all")}
//             username={username}
//             roomId={roomId}
//             isForceMutedByHost={isForceMutedByHost}
//           />
//         </div>

//         <ChatModal
//           username={username}
//           chatMessages={chatMessages}
//           chatInput={chatInput}
//           setChatInput={setChatInput}
//           sendChatMessage={sendChatMessage}
//         />
//       </div>
//     </div>
//   );
// };

// export default VideoChat;
