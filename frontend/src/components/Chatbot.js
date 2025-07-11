import React, { useState } from 'react';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! Ask me anything about your finances.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() === '') return;
    setMessages([...messages, { sender: 'user', text: input }]);
    setInput('');
    // Placeholder: Add bot response logic here
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, maxWidth: 400, margin: '20px auto' }}>
      <div style={{ minHeight: 120, maxHeight: 200, overflowY: 'auto', marginBottom: 8 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.sender === 'bot' ? 'left' : 'right', margin: '4px 0' }}>
            <b>{msg.sender === 'bot' ? 'FinSight Bot' : 'You'}:</b> {msg.text}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        <input
          style={{ flex: 1, marginRight: 8 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your question..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot; 