import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [raisedHands, setRaisedHands] = useState(new Set());
  const [socket, setSocket] = useState(null);
  const [peerConnections, setPeerConnections] = useState({});
  const [localPeerId, setLocalPeerId] = useState('');
  
  const localVideoRef = useRef(null);
  const screenShareRef = useRef(null);
  const peersRef = useRef({});
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);

  const token = localStorage.getItem('employeeToken');
  const API_URL = 'http://localhost:5000';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchMeetingDetails();
    initializeSocket();
    initializeLocalMedia();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (socket && meeting) {
      joinMeeting();
    }
  }, [socket, meeting]);

  const fetchMeetingDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/meetings/${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeeting(response.data);
    } catch (error) {
      console.error('Error fetching meeting details:', error);
      const prefix = localStorage.getItem('userRole') === 'admin' ? '/admin' : '/employee';
      navigate(`${prefix}/meetings`);
    }
  };

  const initializeSocket = () => {
    const newSocket = io(API_URL);
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('meeting-participants', (data) => {
      setParticipants(data.participants);
      data.participants.forEach(participant => {
        if (participant.userId !== userId) {
          createPeerConnection(participant.userId, participant.peerId);
        }
      });
    });

    newSocket.on('participant-joined', (data) => {
      if (data.userId !== userId) {
        createPeerConnection(data.userId, data.peerId);
      }
    });

    newSocket.on('participant-left', (data) => {
      removePeerConnection(data.userId);
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    });

    newSocket.on('offer', handleOffer);
    newSocket.on('answer', handleAnswer);
    newSocket.on('ice-candidate', handleIceCandidate);

    newSocket.on('user-audio-changed', (data) => {
      updateParticipantMedia(data.userId, 'audio', data.enabled);
    });

    newSocket.on('user-video-changed', (data) => {
      updateParticipantMedia(data.userId, 'video', data.enabled);
    });

    newSocket.on('screen-share-started', (data) => {
      handleScreenShareStarted(data);
    });

    newSocket.on('screen-share-stopped', (data) => {
      handleScreenShareStopped(data);
    });

    newSocket.on('meeting-chat-message', (data) => {
      setChatMessages(prev => [...prev, data]);
    });

    newSocket.on('meeting-reaction', (data) => {
      // Handle reactions
    });

    newSocket.on('hand-raised', (data) => {
      setRaisedHands(prev => {
        const newHands = new Set(prev);
        if (data.raised) {
          newHands.add(data.userId);
        } else {
          newHands.delete(data.userId);
        }
        return newHands;
      });
    });

    newSocket.on('meeting-error', (data) => {
      alert(data.message);
      const prefix = localStorage.getItem('userRole') === 'admin' ? '/admin' : '/employee';
      navigate(`${prefix}/meetings`);
    });
  };

  const initializeLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Generate peer ID
      const peerId = `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setLocalPeerId(peerId);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Unable to access camera and microphone');
    }
  };

  const joinMeeting = () => {
    if (socketRef.current && localPeerId) {
      socketRef.current.emit('join-meeting', {
        meetingId,
        userId,
        peerId: localPeerId
      });
    }
  };

  const createPeerConnection = (remoteUserId, remotePeerId) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      handleRemoteStream(remoteUserId, event.streams[0]);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          targetSocketId: peersRef.current[remoteUserId]?.socketId,
          candidate: event.candidate
        });
      }
    };

    // Create and send offer
    peerConnection.createOffer()
      .then(offer => peerConnection.setLocalDescription(offer))
      .then(() => {
        if (socketRef.current) {
          socketRef.current.emit('offer', {
            targetSocketId: peersRef.current[remoteUserId]?.socketId,
            fromPeerId: localPeerId,
            offer: peerConnection.localDescription
          });
        }
      });

    peersRef.current[remoteUserId] = {
      peerConnection,
      socketId: participants.find(p => p.userId === remoteUserId)?.socketId
    };

    setPeerConnections(prev => ({
      ...prev,
      [remoteUserId]: peerConnection
    }));
  };

  const handleOffer = async (data) => {
    const { from, fromPeerId, offer } = data;
    
    if (!peersRef.current[from]) {
      createPeerConnection(from, fromPeerId);
    }

    const peerConnection = peersRef.current[from]?.peerConnection;
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      if (socketRef.current) {
        socketRef.current.emit('answer', {
          targetSocketId: data.from,
          fromPeerId: localPeerId,
          answer: peerConnection.localDescription
        });
      }
    }
  };

  const handleAnswer = async (data) => {
    const { from, answer } = data;
    const peerConnection = peersRef.current[from]?.peerConnection;
    
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (data) => {
    const { from, candidate } = data;
    const peerConnection = peersRef.current[from]?.peerConnection;
    
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const handleRemoteStream = (remoteUserId, stream) => {
    const videoElement = document.getElementById(`video-${remoteUserId}`);
    if (videoElement) {
      videoElement.srcObject = stream;
    }
  };

  const updateParticipantMedia = (userId, type, enabled) => {
    const videoElement = document.getElementById(`video-${userId}`);
    if (videoElement) {
      if (type === 'audio') {
        videoElement.muted = !enabled;
      } else if (type === 'video') {
        videoElement.style.display = enabled ? 'block' : 'none';
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
        
        if (socketRef.current) {
          socketRef.current.emit('toggle-audio', {
            meetingId,
            userId,
            enabled: !isAudioEnabled
          });
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
        
        if (socketRef.current) {
          socketRef.current.emit('toggle-video', {
            meetingId,
            userId,
            enabled: !isVideoEnabled
          });
        }
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = screenStream;
        }

        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
        
        if (socketRef.current) {
          socketRef.current.emit('start-screen-share', {
            meetingId,
            userId,
            streamId: 'screen-share'
          });
        }
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const stopScreenShare = () => {
    if (screenShareRef.current) {
      screenShareRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
    
    if (socketRef.current) {
      socketRef.current.emit('stop-screen-share', {
        meetingId,
        userId
      });
    }
  };

  const handleScreenShareStarted = (data) => {
    const screenElement = document.getElementById(`screen-${data.userId}`);
    if (screenElement) {
      // Handle remote screen share
    }
  };

  const handleScreenShareStopped = (data) => {
    const screenElement = document.getElementById(`screen-${data.userId}`);
    if (screenElement) {
      screenElement.srcObject = null;
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit('meeting-chat', {
        meetingId,
        userId,
        message: newMessage
      });
      setNewMessage('');
    }
  };

  const toggleRaiseHand = () => {
    if (socketRef.current) {
      const isRaised = raisedHands.has(userId);
      socketRef.current.emit('raise-hand', {
        meetingId,
        userId,
        raised: !isRaised
      });
    }
  };

  const leaveMeeting = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-meeting', {
        meetingId,
        userId
      });
    }
    const prefix = localStorage.getItem('userRole') === 'admin' ? '/admin' : '/employee';
    navigate(`${prefix}/meetings`);
  };

  const removePeerConnection = (userId) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].peerConnection.close();
      delete peersRef.current[userId];
      
      setPeerConnections(prev => {
        const newConnections = { ...prev };
        delete newConnections[userId];
        return newConnections;
      });
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    Object.values(peersRef.current).forEach(({ peerConnection }) => {
      peerConnection.close();
    });
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  if (!meeting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading meeting...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">{meeting.title}</h1>
          <span className="px-2 py-1 bg-blue-600 rounded-full text-sm">
            {participants.length + 1} participants
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            💬
          </button>
          <button
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            👥
          </button>
          <button
            onClick={leaveMeeting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Leave Meeting
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 text-white text-sm">
                You
              </div>
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-white text-4xl">👤</div>
                </div>
              )}
            </div>

            {/* Remote Videos */}
            {participants.map((participant) => (
              <div key={participant.userId} className="relative bg-gray-800 rounded-lg overflow-hidden">
                <video
                  id={`video-${participant.userId}`}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 text-white text-sm">
                  {participant.user?.name}
                </div>
                {raisedHands.has(participant.userId) && (
                  <div className="absolute top-2 right-2 text-yellow-400 text-2xl">✋</div>
                )}
              </div>
            ))}

            {/* Screen Share */}
            {isScreenSharing && (
              <div className="col-span-2 relative bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={screenShareRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 left-2 text-white bg-red-600 px-2 py-1 rounded">
                  Sharing Screen
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 flex flex-col">
          {/* Chat Panel */}
          {isChatOpen && (
            <div className="flex-1 flex flex-col border-b border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-white font-semibold">Chat</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chatMessages.map((message, index) => (
                  <div key={index} className="text-white">
                    <span className="font-semibold">{message.userId}: </span>
                    <span>{message.message}</span>
                  </div>
                ))}
              </div>
              
              <div className="p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-gray-700 text-white rounded focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Participants Panel */}
          {isParticipantsOpen && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="text-white font-semibold mb-4">Participants</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-white">
                  <span>You (Host)</span>
                </div>
                {participants.map((participant) => (
                  <div key={participant.userId} className="flex items-center justify-between text-white">
                    <span>{participant.user?.name}</span>
                    {raisedHands.has(participant.userId) && (
                      <span className="text-yellow-400">✋</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${
              isAudioEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
            } text-white`}
          >
            {isAudioEnabled ? '🎤' : '🔇'}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              isVideoEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
            } text-white`}
          >
            {isVideoEnabled ? '📹' : '📹'}
          </button>
          
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full ${
              isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white`}
          >
            🖥️
          </button>
          
          <button
            onClick={toggleRaiseHand}
            className={`p-3 rounded-full ${
              raisedHands.has(userId) ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white`}
          >
            ✋
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
