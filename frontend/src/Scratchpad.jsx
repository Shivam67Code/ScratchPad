import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPad, savePad, socket } from './api';

const Scratchpad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Flag to prevent loops when receiving socket updates
  const isUpdatingFromSocket = useRef(false);
  const saveTimeoutRef = useRef(null);

  // Load pad content
  const loadPad = async () => {
    try {
      setLoading(true);
      setError(null);
      const padData = await getPad(id);
      setContent(padData.content);
      setLastSaved(padData.lastModified);
    } catch (error) {
      console.error('Error loading pad:', error);
      setError('Failed to load pad');
    } finally {
      setLoading(false);
    }
  };

  // Save pad content with debounce
  const savePadContent = useCallback(async (newContent) => {
    if (isUpdatingFromSocket.current) return;
    
    try {
      setSaving(true);
      const response = await savePad(id, newContent);
      setLastSaved(response.lastModified);
      setError(null);
    } catch (error) {
      console.error('Error saving pad:', error);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }, [id]);

  // Handle content changes - THIS IS CRUCIAL FOR REAL-TIME
  const handleContentChange = (newContent) => {
    // If this change is from a socket update, don't emit again
    if (isUpdatingFromSocket.current) {
      isUpdatingFromSocket.current = false;
      return;
    }

    console.log('User typing, emitting update:', newContent);
    
    setContent(newContent);
    
    // Emit real-time update to other users immediately
    if (socket.connected) {
      socket.emit('pad-update', {
        padId: id,
        content: newContent
      });
    }
    
    // Clear existing save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set debounced save
    saveTimeoutRef.current = setTimeout(() => {
      savePadContent(newContent);
    }, 300);
  };

  // Socket.IO setup - THIS IS WHERE THE MAGIC HAPPENS
  useEffect(() => {
    if (!id) return;

    console.log('Setting up socket for pad:', id);
    
    // Track connection status
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Socket connected, joining pad:', id);
      socket.emit('join-pad', id);
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    };

    const handlePadUpdate = (data) => {
      console.log('Received real-time update:', data);
      
      // flag to prevent emitting this change back
      isUpdatingFromSocket.current = true;
      
      // Update the content
      setContent(data.content);
      setLastSaved(data.lastModified);
    };

    // Set up event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('pad-updated', handlePadUpdate);

    // If already connected-> join immediately
    if (socket.connected) {
      handleConnect();
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up socket listeners for pad:', id);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('pad-updated', handlePadUpdate);
      socket.emit('leave-pad', id);
      
      // Clear save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (id) {
      loadPad();
    }
  }, [id]);

  // Copy link to clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              ← Back to Home
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Pad: {id}
                <span className={`ml-2 text-xs px-2 py-1 rounded ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </h1>
              <p className="text-sm text-gray-500">
                {lastSaved && `Last saved: ${new Date(lastSaved).toLocaleString()}`}
                {saving && <span className="text-blue-500 ml-2">Saving...</span>}
              </p>
            </div>
          </div>
          
          <button
            onClick={copyLink}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2"
          >
            📋 Copy Link
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          {error}
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start typing your notes here... Changes are synced in real-time!"
            className="w-full h-[70vh] p-6 border-none resize-none focus:outline-none text-gray-700 leading-relaxed"
            style={{ fontFamily: 'monospace' }}
          />
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Share this link with others to collaborate: <strong>{window.location.href}</strong></p>
          <p className="mt-1">Real-time collaboration is {isConnected ? 'ACTIVE' : 'INACTIVE'}</p>
        </div>
      </div>
    </div>
  );
};

export default Scratchpad;