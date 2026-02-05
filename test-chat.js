
console.log('Testing Chat Stream with fetch...');

async function testChat() {
  try {
    const response = await fetch('http://localhost:3001/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: "Halo, tes local",
        model: "gemini-2.5-flash", // Testing auto-correct logic (should become 1.5)
        history: []
      })
    });

    console.log(`STATUS: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.log('Error Body:', text);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log(`CHUNK: ${decoder.decode(value)}`);
    }
    console.log('Stream finished.');
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testChat();
