import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
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
  }
}


function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Welcome! Mention a street address to see it on the map.", sender: 'system' }
  ])
  const [inputText, setInputText] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<Message['location'] | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09])
  const [zoom, setZoom] = useState(13)


  const handleSendMessage = () => {
    if (!inputText.trim()) return
    
    const newMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user'
    }
    
    setMessages([...messages, newMessage])
    
    // Simulate checking for address and responding
    setTimeout(() => {
      // This would be replaced with actual geocoding logic
      if (inputText.toLowerCase().includes('london') || inputText.toLowerCase().includes('street')) {
        const fakeLocation = {
          address: inputText,
          lat: 51.505 + (Math.random() * 0.01 - 0.005),
          lng: -0.09 + (Math.random() * 0.01 - 0.005)
        }
        
        const systemResponse: Message = {
          id: messages.length + 2,
          text: `I found this location: ${inputText}`,
          sender: 'system',
          location: fakeLocation
        }
        
        setMessages(prev => [...prev, systemResponse])
        setSelectedLocation(fakeLocation)
        setMapCenter([fakeLocation.lat, fakeLocation.lng])
      } else {
        const systemResponse: Message = {
          id: messages.length + 2,
          text: "I couldn't identify a specific address. Try mentioning a street name or city.",
          sender: 'system'
        }
        
        setMessages(prev => [...prev, systemResponse])
      }
    }, 500)
    
    setInputText('')
  }


  const handleNewChat = () => {
    setMessages([{ id: 1, text: "Welcome! Mention a street address to see it on the map.", sender: 'system' }])
    setSelectedLocation(null)
    setMapCenter([51.505, -0.09])
    setZoom(13)
  }


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
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
              <h3 className="location-title">{selectedLocation.address}</h3>
              <p className="location-coords">
                Latitude: {selectedLocation.lat.toFixed(6)}<br />
                Longitude: {selectedLocation.lng.toFixed(6)}
              </p>
              <div className="location-details">
                <p className="location-description">
                  This location is in the vicinity of central London. 
                  The area features historic architecture, cultural landmarks, 
                  and urban amenities.
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
                <Popup>{selectedLocation.address}</Popup>
              </Marker>
            )}
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
                    className="location-link"
                    onClick={() => {
                      if (message.location) {
                        setSelectedLocation(message.location)
                        setMapCenter([message.location.lat, message.location.lng])
                      }
                    }}
                  >
                    View on map: {message.location.address}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="input-container">
            <textarea
              className="message-input"
              rows={3}
              placeholder="Type a message mentioning a street address..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="button-container">
              <button
                className="new-chat-button"
                onClick={handleNewChat}
              >
                New Chat
              </button>
              <button
                className="send-button"
                onClick={handleSendMessage}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default App
