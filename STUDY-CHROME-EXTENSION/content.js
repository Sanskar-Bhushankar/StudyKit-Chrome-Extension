function addButton() {
    const metadataElement = document.querySelector('yt-formatted-string.style-scope.ytd-watch-metadata');
    if (metadataElement && !document.getElementById('customButton')) {
        const buttonHTML = `<button id="customButton">focus</button>`;
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = buttonHTML;
        const button = tempContainer.firstElementChild;
  
        button.addEventListener('click', () => {
            // Toggle visibility of the specific <div> with class 'style-scope ytd-watch-flexy'
            //const secondaryDiv = document.getElementById('columns');
            //const menuRenderer = document.getElementById('comments');
            const menuRenderer = document.querySelector('ytd-item-section-renderer#sections[initial-count="2"].style-scope.ytd-comments[section-identifier="comment-item-section"]');
  
            if (menuRenderer) {
                if (menuRenderer.style.display === 'none') {
                    menuRenderer.style.display = 'block';
                } else {
                    menuRenderer.style.display = 'none';
                }
            }
           
            const secondaryDiv = document.getElementById('secondary');
            
            if (secondaryDiv) {
                if (secondaryDiv.style.display === 'none') {
                    secondaryDiv.style.display = 'block';
                } else {
                    secondaryDiv.style.display = 'none';
                }
            }
  
            const ythead = document.getElementById('masthead-container');
            
            if (ythead) {
                if (ythead.style.display === 'none') {
                    ythead.style.display = 'block';
                } else {
                    ythead.style.display = 'none';
                }
            }
  
            const desc = document.getElementById('bottom-row');
            
            if (desc) {
                if (desc.style.display === 'none') {
                    desc.style.display = 'block';
                } else {
                    desc.style.display = 'none';
                }
            }
  
        });
  
        // Add CSS style to the button
        button.style.cssText = `
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin-left: 10px;
        cursor: pointer;
        border-radius: 5px;
        transition-duration: 0.4s;
      `;
  
        // Add button to the DOM
        metadataElement.parentNode.insertBefore(button, metadataElement.nextSibling);
    }
  }
  
  // Function to handle mutations
  function mutationHandler(mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            addButton();
        }
    }
  }
  
  // Observer configuration
  const observerConfig = { childList: true, subtree: true };
  
  // Create a new mutation observer
  const observer = new MutationObserver(mutationHandler);
  
  // Start observing the document
  observer.observe(document.body, observerConfig);
  
  // Initial action when the extension is loaded
  addButton();
  
  (() => {
    let youtubeLeftControls, youtubePlayer;
    let currentVideo = '';
    let currentVideoBookmarks = [];
  
    const fetchBookmarks = () => {
      return new Promise((resolve) => {
        chrome.storage.sync.get([currentVideo], (obj) => {
          resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
        });
      });
    };
  
    const addNewBookmarkEventHandler = async () => {
      const currentTime = youtubePlayer.currentTime;
      const message = prompt(`Bookmark added, Add note ?`);
      const newBookmark = {
        time: currentTime,
        desc: `Bookmark at: ${getTime(currentTime)} ${message}`,
      };
  
      currentVideoBookmarks = await fetchBookmarks();
  
      chrome.storage.sync.set({
        [currentVideo]: JSON.stringify(
          [...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)
        ),
      });
    };
  
    const newVideoLoaded = async () => {
      const bookmarkBtnExists =
        document.getElementsByClassName('bookmark-btn')[0];
  
      currentVideoBookmarks = await fetchBookmarks();
  
      if (!bookmarkBtnExists) {
        const bookmarkBtn = document.createElement('img');
  
        bookmarkBtn.src = chrome.runtime.getURL('images/bookmark.png');
        bookmarkBtn.className = 'ytp-button ' + 'bookmark-btn';
        bookmarkBtn.title = 'Click to bookmark current timestamp';
  
        youtubeLeftControls =
          document.getElementsByClassName('ytp-left-controls')[0];
        youtubePlayer = document.getElementsByClassName('video-stream')[0];
  
        youtubeLeftControls.appendChild(bookmarkBtn);
        bookmarkBtn.addEventListener('click', addNewBookmarkEventHandler);
      }
    };
  
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
      const { type, value, videoId } = obj;
  
      if (type === 'NEW') {
        currentVideo = videoId;
        newVideoLoaded();
      } else if (type === 'PLAY') {
        youtubePlayer.currentTime = value;
      } else if (type === 'DELETE') {
        currentVideoBookmarks = currentVideoBookmarks.filter(
          (b) => b.time != value
        );
        chrome.storage.sync.set({
          [currentVideo]: JSON.stringify(currentVideoBookmarks),
        });
  
        response(currentVideoBookmarks);
      }
    });
  
    newVideoLoaded();
  })();
  
  const getTime = (t) => {
    var date = new Date(0);
    date.setSeconds(t);
  
    return date.toISOString().substr(11, 8);
  };
  