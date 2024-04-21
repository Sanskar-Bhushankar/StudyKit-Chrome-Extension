let capturedText = "";

document.getElementById("websum").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: captureText
        });
    });
});

function captureText() {
    const text = document.body.innerText;
    chrome.runtime.sendMessage({ method: "getText", data: text });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.method === "getText") {
        capturedText = request.data;
        //document.getElementById("summary").textContent = capturedText;
        
        // Send the captured text to the Flask app
        sendTextToFlask(capturedText);
    }
});

function sendTextToFlask(text) {
    fetch('http://127.0.0.1:5000/capturetext', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Response from Flask app:', data);
        // Update the summary in the HTML after 5 seconds
        setTimeout(() => {
            document.getElementById("gensum").textContent = data.answer;
        }, 5000);
    })
    .catch(error => {
        console.error('There was a problem with your fetch operation:', error);
    });
}






const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let interval = null;

document.querySelector('.title').onmouseover = (event) => {
  let iteration = 0;

  clearInterval(interval);

  interval = setInterval(() => {
    event.target.innerText = event.target.innerText
      .split('')
      .map((letter, index) => {
        if (index < iteration) {
          return event.target.dataset.value[index];
        }
        return letters[Math.floor(Math.random() * 26)];
      })
      .join('');
    if (iteration >= event.target.dataset.value.length) {
      clearInterval(interval);
    }
    iteration += 1 / 3;
  }, 50);
};
