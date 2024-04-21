
document.getElementById('captureButton').addEventListener('click', function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];

      if (isYouTubeTab(currentTab)) {
          const youtubeLink = currentTab.url;

          // Send the YouTube link to the Flask app
          fetch('http://127.0.0.1:5000/receive-link', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ youtube_link: youtubeLink }),
          })
          .then(response => response.text())
          .then(data => {
              console.log(data);
              // Fetch the summary and display it below the button
              fetch('http://127.0.0.1:5000/')
                  .then(response => response.json())
                  .then(summaryData => {
                      const summary = summaryData["summary of this is "]; // Access the summary text using the appropriate key
                      if (summary) {
                          // Display summary
                          document.getElementById('result').innerText = "YouTube Link captured! Summary: " + summary;
                          // Save summary in Chrome storage
                          chrome.storage.sync.set({ 'summary': summary }, function() {
                              console.log('Summary saved in Chrome storage.');
                          });
                      } else {
                          document.getElementById('result').innerText = "Failed to retrieve summary.";
                      }
                  })
                  .catch(error => {
                      console.error('Error fetching summary:', error);
                      document.getElementById('result').innerText = 'Error fetching summary.';
                  });
          })
          .catch(error => {
              console.error('Error capturing YouTube link:', error);
              document.getElementById('result').innerText = 'Error capturing YouTube link.';
          });
      } else {
          document.getElementById('result').innerText = "Works only for YouTube tabs.";
      }
  });
});

// Function to check if the tab is a YouTube tab
function isYouTubeTab(tab) {
  return tab.url.startsWith("https://www.youtube.com/") || tab.url.startsWith("http://www.youtube.com/");
}

let txtarea=document.getElementById('result');
// Retrieve and display summary from Chrome storage when popup is opened
document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.sync.get(['summary'], function(result) {
      if (result.summary) {
          document.getElementById('result').innerText = "Summary from last capture: " + result.summary;
      } else {
          document.getElementById('result').innerText = "No summary available.";
      }
  });
});




async function getActiveTabURL() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });
  
    return tabs[0];
  }
  
  const addNewBookmark = (bookmarks, bookmark) => {
    const bookmarkTitleElement = document.createElement('div');
    const controlsElement = document.createElement('div');
    const newBookmarkElement = document.createElement('div');
  
    bookmarkTitleElement.textContent = bookmark.desc;
    bookmarkTitleElement.className = 'bookmark-title';
    controlsElement.className = 'bookmark-controls';
  
    setBookmarkAttributes('play', onPlay, controlsElement);
    setBookmarkAttributes('delete', onDelete, controlsElement);
  
    newBookmarkElement.id = 'bookmark-' + bookmark.time;
    newBookmarkElement.className = 'bookmark';
    newBookmarkElement.setAttribute('timestamp', bookmark.time);
  
    newBookmarkElement.appendChild(bookmarkTitleElement);
    newBookmarkElement.appendChild(controlsElement);
    bookmarks.appendChild(newBookmarkElement);
  };
  
  const viewBookmarks = (currentBookmarks = []) => {
    const bookmarksElement = document.getElementById('bookmarks');
    bookmarksElement.innerHTML = '';
  
    if (currentBookmarks.length > 0) {
      for (let i = 0; i < currentBookmarks.length; i++) {
        const bookmark = currentBookmarks[i];
        addNewBookmark(bookmarksElement, bookmark);
      }
    } else {
      bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
    }
  
    return;
  };
  
  const onPlay = async (e) => {
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute('timestamp');
    const activeTab = await getActiveTabURL();
  
    chrome.tabs.sendMessage(activeTab.id, {
      type: 'PLAY',
      value: bookmarkTime,
    });
  };
  
  const onDelete = async (e) => {
    const activeTab = await getActiveTabURL();
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute('timestamp');
    const bookmarkElementToDelete = document.getElementById(
      'bookmark-' + bookmarkTime
    );
  
    bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);
  
    chrome.tabs.sendMessage(
      activeTab.id,
      {
        type: 'DELETE',
        value: bookmarkTime,
      },
      viewBookmarks
    );
  };
  
  const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
    const controlElement = document.createElement('img');
  
    controlElement.src = 'images/' + src + '.png';
    controlElement.title = src;
    controlElement.addEventListener('click', eventListener);
    controlParentElement.appendChild(controlElement);
  };
  
  //DOMContentLoaded is fired when an HTML document has innitially been loaded
  document.addEventListener('DOMContentLoaded', async () => {
    const activeTab = await getActiveTabURL();
    const queryParameters = activeTab.url.split('?')[1];
    const urlParameters = new URLSearchParams(queryParameters);
  
    const currentVideo = urlParameters.get('v');
  
    if (activeTab.url.includes('youtube.com/watch') && currentVideo) {
      chrome.storage.sync.get([currentVideo], (data) => {
        const currentVideoBookmarks = data[currentVideo]
          ? JSON.parse(data[currentVideo])
          : [];
  
        viewBookmarks(currentVideoBookmarks);
      });
    } else {
      const container = document.getElementsByClassName('container')[0];
  
      container.innerHTML =
        '<div class="title" style="color:black">This is not a youtube video page.</div>';
    }
  });
  