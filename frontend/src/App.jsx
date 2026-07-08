import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'
import { httpClient } from './config/AxiosHelper'

const JoinCreateChat = () => {
  const [activeTab, setActiveTab] = useState('join') // 'join' or 'create'
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const navigate = useNavigate()

  const handleJoin = async () => {
    if (!name.trim() || !roomId.trim()) {
      toast.error('Please enter name and room ID')
      return
    }
    try {
      await httpClient.get(`/api/v1/rooms/${roomId}`)
      toast.success('Joined successfully')
      navigate('/chat', { state: { roomId, name } })
    } catch (error) {
      toast.error(error.response?.data || 'Error joining room')
    }
  }

  const handleCreate = async () => {
    if (!name.trim() || !roomId.trim()) {
      toast.error('Please enter name and room ID')
      return
    }
    try {
      await httpClient.post(`/api/v1/rooms`, roomId, {
        headers: { 'Content-Type': 'text/plain' }
      })
      toast.success('Room created successfully')
      navigate('/chat', { state: { roomId, name } })
    } catch (error) {
      toast.error(error.response?.data || 'Error creating room')
    }
  }

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left side - Image */}
        <div className="hidden md:block md:w-1/2 relative">
          <img
            src="https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=800&q=80"
            alt="Chat illustration"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-white text-2xl font-bold tracking-tight">
              Connect Instantly
            </h2>
            <p className="text-zinc-300 text-sm mt-2">
              Join a room or create your own space to chat with anyone, anywhere.
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
          
          {/* Logo / Title */}
          <div className="mb-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-white font-semibold text-lg">ChatSpace</span>
            </div>
            <h1 className="text-white text-2xl font-bold">Welcome</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Join an existing room or start a new one
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-zinc-800 rounded-xl p-1 mb-6">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'join'
                  ? 'bg-white text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('join')}
            >
              Join Room
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('create')}
            >
              Create Room
            </button>
          </div>

          {/* Join Room Form */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="text-zinc-300 text-sm font-medium mb-1.5 block">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500 transition-all"
                />
              </div>
              <div>
                <label className="text-zinc-300 text-sm font-medium mb-1.5 block">
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room ID"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500 transition-all"
                />
              </div>
              <button onClick={handleJoin} className="w-full bg-white text-black font-semibold rounded-xl py-3 text-sm mt-2 hover:bg-zinc-200 transition-all">
                Join Room
              </button>
            </div>
          )}

          {/* Create Room Form */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="text-zinc-300 text-sm font-medium mb-1.5 block">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500 transition-all"
                />
              </div>
              <div>
                <label className="text-zinc-300 text-sm font-medium mb-1.5 block">
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Create a room ID"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500 transition-all"
                />
              </div>
              <button onClick={handleCreate} className="w-full bg-white text-black font-semibold rounded-xl py-3 text-sm mt-2 hover:bg-zinc-200 transition-all">
                Create New Room
              </button>
            </div>
          )}

          {/* Footer note */}
          <p className="text-zinc-500 text-xs text-center md:text-left mt-6">
            Rooms are temporary and auto-delete when everyone leaves.
          </p>
        </div>
      </div>
    </div>
  )
}

export default JoinCreateChat