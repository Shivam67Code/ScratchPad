import axios from 'axios'
import { io } from 'socket.io-client'

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Initialize socket connection immediately
export const socket = io(API_BASE_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
})

// Add connection logging
socket.on('connect', () => {
  console.log('Connected to server:', socket.id)
})

socket.on('disconnect', () => {
  console.log('Disconnected from server')
})

socket.on('connect_error', (error) => {
  console.log('Connection error:', error)
})

export const getPad = async (id) => {
  const response = await api.get(`/pad/${id}`)
  return response.data
}

export const savePad = async (id, content) => {
  const response = await api.post(`/pad/${id}`, { content })
  return response.data
}

export const getAllPads = async () => {
  const response = await api.get('/pads')
  return response.data
}

export const deletePad = async (id) => {
  const response = await api.delete(`/pad/${id}`)
  return response.data
}

