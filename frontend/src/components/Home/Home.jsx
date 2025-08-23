import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPads } from '../../api';

const Home = () =>{
  const [padId, setPadId] = useState('');
  const [recentPads, setRecentPads] = useState([]);
  const [loading,setLoading] = useState(false);

  const navigate = useNavigate();

  // Generate random pad ID
  const generatePadId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const createNewPad = ()=>{
    const newPadId = generatePadId();
    navigate(`/pad/${newPadId}`);
  };

  // Join existing pad - FIXED FUNCTION
  const joinPad = () => {
    if(padId.trim()){
      navigate(`/pad/${padId.trim()}`);
    }
  };

  // load recent pads 
  const loadRecentPads = async()=>{
    try{
      setLoading(true);
      const response = await getAllPads();
      setRecentPads(response.pads || []);
    }catch (error) {
      console.error('Error loading recent pads:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(()=>{
    loadRecentPads();
  },[]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📝 ScratchPad</h1>
          <p className="text-gray-600">Collaborative online notepad</p>
        </div>

        {/* Create New Pad */}
        <div className="mb-6">
          <button
            onClick={createNewPad}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            ✨ Create New Pad 
          </button>
        </div>

        {/* Join Existing Pad */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={padId}
              onChange={(e) => setPadId(e.target.value)}
              placeholder="Enter pad ID..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && joinPad()}
            />
            <button
              onClick={joinPad}
              disabled={!padId.trim()}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              Join
            </button>
          </div>
        </div>

        {/* Recent Pads */}
        {recentPads.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Pads</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentPads.map((pad) => (
                <div
                  key={pad.id}
                  onClick={() => navigate(`/pad/${pad.id}`)}
                  className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition duration-200 border border-gray-200"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800 truncate">
                      {pad.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(pad.lastModified).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;