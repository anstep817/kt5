import { useEffect, useState } from "react"

function App() {
  const [name, setName] = useState("")
  const [ready, setReady] = useState(false)
  const [text, setText] = useState("")
  const [list, setList] = useState([])
  const [socket, setSocket] = useState(null)

  function enterChat(event) {
    event.preventDefault()
    const user = name.trim()
    if (!user) {
      return
    }
    const ws = new WebSocket("ws://127.0.0.1:8001/ws/" + encodeURIComponent(user))
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data)
      setList((old) => [...old, data])
    }
    setSocket(ws)
    setReady(true)
  }

  function send(event) {
    event.preventDefault()
    if (!socket || !text.trim()) {
      return
    }
    socket.send(JSON.stringify({ text: text.trim() }))
    setText("")
  }

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [socket])

  if (!ready) {
    return (
      <div className="page">
        <h1>Общий чат</h1>
        <form onSubmit={enterChat}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Имя"
          />
          <button>Начать</button>
        </form>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Комната: {name}</h1>
      <div className="list">
        {list.map((item, index) => (
          <p key={index} className={item.type === "system" ? "system" : "message"}>
            <span>{item.timestamp} </span>
            {item.type === "system" ? item.text : item.username + ": " + item.text}
          </p>
        ))}
      </div>
      <form onSubmit={send}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Напишите текст"
        />
        <button>Послать</button>
      </form>
    </div>
  )
}

export default App
