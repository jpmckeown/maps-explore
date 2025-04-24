import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  function handleClick() {
    setCount(count + 1)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">React + Vite + TypeScript</h1>
      <div className="p-4 border rounded">
        <p className="mb-2">Count: {count}</p>
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded" 
          onClick={handleClick}
        >
          Increment
        </button>
      </div>
    </div>
  )
}

export default App
