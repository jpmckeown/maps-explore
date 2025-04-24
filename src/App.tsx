import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'
import L from 'leaflet'


// Fix for default marker icons
delete (L.Icon.Default.prototype as {_getIconUrl?: unknown})._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
})


type Message = {
  id: number
  text: string
  sender: 'user' | 'system'
  location?: {
    address: string
    lat: number
    lng: number
    displayName?: string
    type?: string
    importance?: number
  }
}


// Geocoding interface for Nominatim API
type NominatimResponse = {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  boundingbox: string[]
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  importance: number
}


async function geocodeAddress(query: string): Promise<Message['location'] | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en',
          'User-Agent': 'BPPCityExplorer/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding API request failed')
    }

    const data: NominatimResponse[] = await response.json()

    if (data.length === 0) {
      return null
    }

    const location = data[0]
    return {
      address: query,
      lat: parseFloat(location.lat),
      lng: parseFloat(location.lon),
      displayName: location.display_name,
      type: location.type,
      importance: location.importance
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}


// Map controller component to handle map view changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom, {
      animate: true,
      duration: 1
    })
  }, [center, zoom, map])
  
  return null
}


function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Welcome! Mention a street address to see it on the map.", sender: 'system' }
  ])
  const [inputText, setInputText] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<Message['location'] | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09])
  const [zoom, setZoom] = useState(13)
  const [isLoading, setIsLoading] = useState(false)
  const [activeMessageId, setActiveMessageId] = useState<number | null>(null)


  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return
    
    const newMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user'
    }
    
    setMessages([...messages, newMessage])
    setIsLoading(true)
    
    // Use real geocoding
    const location = await geocodeAddress(inputText)
    
    if (location) {
      const systemResponse: Message = {
        id: messages.length + 2,
        text: `I found this location: ${location.displayName || inputText}`,
        sender: 'system',
        location
      }
      
      setMessages(prev => [...prev, systemResponse])
      setSelectedLocation(location)
      setMapCenter([location.lat, location.lng])
      setZoom(16) // Zoom in closer for found addresses
      setActiveMessageId(messages.length + 2) // Set the new message as active
    } else {
      const systemResponse: Message = {
        id: messages.length + 2,
        text: "I couldn't find that location. Please try a more specific address or landmark.",
        sender: 'system'
      }
      
      setMessages(prev => [...prev, systemResponse])
    }
    
    setInputText('')
    setIsLoading(false)
  }


  const handleNewChat = () => {
    setMessages([{ id: 1, text: "Welcome! Mention a street address to see it on the map.", sender: 'system' }])
    setSelectedLocation(null)
    setMapCenter([51.505, -0.09])
    setZoom(13)
    setActiveMessageId(null)
  }


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }


  const handleLocationClick = (messageId: number, location: Message['location']) => {
    if (!location) return
    
    setSelectedLocation(location)
    setMapCenter([location.lat, location.lng])
    setZoom(16)
    setActiveMessageId(messageId) // Track which message's location is active
  }


  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="header-title">Explore Geography</h1>
      </header>
      
      <div className="content-container">
        <div className="info-panel">
          <h2 className="panel-title">Location Info</h2>
          {selectedLocation ? (
            <div className="location-card">
              <h3 className="location-title">{selectedLocation.displayName || selectedLocation.address}</h3>
              <p className="location-coords">
                Latitude: {selectedLocation.lat.toFixed(6)}<br />
                Longitude: {selectedLocation.lng.toFixed(6)}
              </p>
              <div className="location-details">
                {selectedLocation.type && (
                  <p className="location-description">
                    <strong>Type:</strong> {selectedLocation.type}
                  </p>
                )}
                <p className="location-description">
                  This location can be found at the coordinates shown above.
                  You can explore nearby areas by moving the map.
                </p>
              </div>
            </div>
          ) : (
            <p className="placeholder-text">Select a location to see details</p>
          )}
        </div>
        
        <div className="map-container">
          <MapContainer 
            center={mapCenter} 
            zoom={zoom} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                <Popup>{selectedLocation.displayName || selectedLocation.address}</Popup>
              </Marker>
            )}
            <MapController center={mapCenter} zoom={zoom} />
          </MapContainer>
        </div>
        
        <div className="chat-panel">
          <div className="messages-container">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.sender === 'user' ? 'user-message' : 'system-message'}`}
              >
                <p>{message.text}</p>
                {message.location && (
                  <div 
                    className={`location-link ${activeMessageId === message.id ? 'active-location' : ''}`}
                    onClick={() => {
                      if (message.location) {
                        handleLocationClick(message.id, message.location)
                      }
                    }}
                  >
                    View on map: {message.location.displayName || message.location.address}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message system-message">
                <p>Searching for location...</p>
              </div>
            )}
          </div>
          
          <div className="input-container">
            <textarea
              className="message-input"
              rows={3}
              placeholder="Type an address or landmark (e.g., 'Eiffel Tower, Paris' or 'Times Square, NYC')"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <div className="button-container">
              <button
                className="new-chat-button"
                onClick={handleNewChat}
                disabled={isLoading}
              >
                New Chat
              </button>
              <button
                className="send-button"
                onClick={handleSendMessage}
                disabled={isLoading}
              >
                {isLoading ? 'Searching...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default App
