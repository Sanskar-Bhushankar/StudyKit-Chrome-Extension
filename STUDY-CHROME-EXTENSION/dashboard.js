//importing the summaryof youtube from chrome storage
//var youtubesum = chrome.storage.sync.get(['summary']);

document.addEventListener('DOMContentLoaded', function () {

  const captureButton = document.getElementById('capture');
  const downloadAllButton = document.getElementById('downloadAll');
  const pdfNameInput = document.getElementById('pdfN');
  const clearAllButton = document.getElementById('clearAll'); // New button
  const deleteButton = document.getElementById('deleteButton'); // Define deleteButton
  const textArea = document.getElementById('inputText'); // Reference to the textarea

  //let txt;
  let tabTitle;
  let savedText = '';
  let screenshotCounter = 0;
  let screenshots = [];
  let pdfFileName = 'screenshots.pdf';

  let youtubesummary=''
  chrome.storage.sync.get(['summary'], function(result) {
    if (result.summary) {
        //document.getElementById('ytsum').innerText = "Summary from last capture: " + result.summary;
        youtubesummary+=result.summary;
        return youtubesummary;
        //console.log("indise result sum",youtubesummary);
        //txt=senddata(youtubesummary);
    } else {
        document.getElementById('ytsum').innerText = "No summary available.";
    }
    
});

// function senddata(data){
//   return data;

// }


    

  const screenshotCountElement = document.createElement('span');
  screenshotCountElement.textContent = 'Screenshots taken: 0';
  document.body.appendChild(screenshotCountElement);


  chrome.storage.sync.get(['savedText'], function (result) {
    if (result.savedText) {
      textArea.value = result.savedText;
      savedText = result.savedText;
    }
  });

  textArea.addEventListener('input', function () {
    const text = textArea.value.trim();
    savedText = text;
    // Save the text to Chrome's storage
    chrome.storage.sync.set({ savedText: text });
  });

  function updateScreenshotCount() {
    screenshotCountElement.textContent = `Screenshots taken: ${screenshotCounter}`;
  }

  chrome.storage.local.get(['screenshots'], (storedData) => {
    if (storedData.screenshots) {
      screenshotCounter = storedData.screenshots.length;
      screenshots = storedData.screenshots;
      updateScreenshotCount();
    }
  });

  captureButton.addEventListener('click', () => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      screenshotCounter++;
      updateScreenshotCount();
      screenshots.push(dataUrl);
      chrome.storage.local.set({ screenshots }, () => {
        console.log('Screenshots saved to storage');
      });

      if (screenshotCounter === 50) {
        captureButton.disabled = true;
      }
    });
  });

 
  function captureTitleAndAddToPDF(pdfDocument, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
       tabTitle = currentTab.title;

      pdfDocument.setFont('helvetica', 'bold');
      pdfDocument.setFontSize(40);
      // pdfDocument.text(20, 20, tabTitle);

      pdfDocument.setFont('helvetica', 'normal');
      pdfDocument.setFontSize(12);

      callback(tabTitle); // Call the callback function with the tab title
    });
  }

  downloadAllButton.addEventListener('click', () => {

    const text = savedText.trim(); 

    // if (screenshotCounter === 0) {
    //   console.log('No screenshots captured yet.');
    //   return;
    // }

    const pdfDocument = new jsPDF();


    if (text !== '' && screenshots.length == 0) {

      const doc = new jsPDF();
      const textLines = doc.splitTextToSize(text, doc.internal.pageSize.width - 20);
      let cursor = 10;
      textLines.forEach(line => {
        if (cursor > 280) {
          doc.addPage();
          cursor = 10;
        }
        doc.text(10, cursor, line);
        cursor += 10; // Increase cursor position for next line
      });
      doc.save('generated_pdf.pdf');


    }



    else if (screenshots.length > 0 && text !== '') {
      captureTitleAndAddToPDF(pdfDocument, (tabTitle) => {
        function addScreenshotsToPdf() {
          let currentIndex = 0;
          while (currentIndex < screenshots.length) {
            const pageWidth = pdfDocument.internal.pageSize.width;
            const pageHeight = pdfDocument.internal.pageSize.height;
            const imageHeight = (pageHeight - 20) / 2;

            const screenshotDataUrl = screenshots[currentIndex];
            pdfDocument.rect(5, 5, pageWidth - 10, imageHeight, 'S');
            pdfDocument.addImage(screenshotDataUrl, 'PNG', 10, 10, pageWidth - 25, imageHeight - 15);

            if (currentIndex + 1 < screenshots.length) {
              const secondScreenshotDataUrl = screenshots[currentIndex + 1];
              pdfDocument.rect(5, imageHeight + 15, pageWidth - 10, imageHeight, 'S');
              pdfDocument.addImage(secondScreenshotDataUrl, 'PNG', 10, imageHeight + 20, pageWidth - 25, imageHeight - 15);
              currentIndex += 2;
            } else {
              currentIndex += 1;
            }

            if (currentIndex < screenshots.length) {
              pdfDocument.addPage();
            }
          }
        }

        addScreenshotsToPdf();
        // Calculate total number of pages used by screenshots
        const pagesUsedByScreenshots = pdfDocument.internal.getNumberOfPages();

        // Add text from the next page onwards
        for (let i = pagesUsedByScreenshots + 1; i <= pagesUsedByScreenshots + 1; i++) {
          pdfDocument.addPage();
          const textLines = pdfDocument.splitTextToSize(text, pdfDocument.internal.pageSize.width - 20);
          let cursor = 10;
          textLines.forEach(line => {
            if (cursor > 280) {
              pdfDocument.addPage();
              cursor = 10;
            }
            pdfDocument.text(10, cursor, line);
            cursor += 10; // Increase cursor position for next line
          });


        }

        let userInputName = pdfNameInput.value.trim();
        if (userInputName === '') {
          // If user doesn't enter a PDF name, use the current tab title
          userInputName = tabTitle+'.pdf';
          //userInputName = 'usb.pdf';
        }
        pdfFileName = userInputName || pdfFileName;

        const pdfDataUri = pdfDocument.output('datauristring');
        screenshots.push(pdfDataUri);
        chrome.storage.local.set({ screenshots }, () => {
          console.log('Screenshots updated in storage');
        });

        const downloadLink = document.createElement('a');
        downloadLink.href = pdfDataUri;
        downloadLink.download = pdfFileName;
        //downloadLink.setAttribute('download', 'pdfs/' + pdfFileName);
        downloadLink.click();

        chrome.storage.local.remove(['screenshots'], () => {
          console.log('Screenshots cleared from storage');
          screenshotCounter = 0; // Reset the counter to zero
          updateScreenshotCount(); // Update the counter display
        });
      });
    }



    else if (screenshots.length > 0 && text == '') {
      captureTitleAndAddToPDF(pdfDocument, (tabTitle) => {
        function addScreenshotsToPdf() {
          let currentIndex = 0;
          while (currentIndex < screenshots.length) {
            const pageWidth = pdfDocument.internal.pageSize.width;
            const pageHeight = pdfDocument.internal.pageSize.height;
            const imageHeight = (pageHeight - 20) / 2;

            const screenshotDataUrl = screenshots[currentIndex];
            pdfDocument.rect(5, 5, pageWidth - 10, imageHeight, 'S');
            pdfDocument.addImage(screenshotDataUrl, 'PNG', 10, 10, pageWidth - 25, imageHeight - 15);

            if (currentIndex + 1 < screenshots.length) {
              const secondScreenshotDataUrl = screenshots[currentIndex + 1];
              pdfDocument.rect(5, imageHeight + 15, pageWidth - 10, imageHeight, 'S');
              pdfDocument.addImage(secondScreenshotDataUrl, 'PNG', 10, imageHeight + 20, pageWidth - 25, imageHeight - 15);
              currentIndex += 2;
            } else {
              currentIndex += 1;
            }

            if (currentIndex < screenshots.length) {
              pdfDocument.addPage();
            }
          }
        }

        addScreenshotsToPdf();

        let userInputName = pdfNameInput.value.trim();
        if (userInputName === '') {
          // If user doesn't enter a PDF name, use the current tab title
          userInputName = tabTitle+'.pdf';
          //userInputName = 'usb.pdf';
        }
        pdfFileName = userInputName || pdfFileName;

        const pdfDataUri = pdfDocument.output('datauristring');
        screenshots.push(pdfDataUri);
        chrome.storage.local.set({ screenshots }, () => {
          console.log('Screenshots updated in storage');
        });

        const downloadLink = document.createElement('a');
        downloadLink.href = pdfDataUri;
        downloadLink.download = pdfFileName;
        //downloadLink.setAttribute('download', 'pdfs/' + pdfFileName);
        downloadLink.click();

        chrome.storage.local.remove(['screenshots'], () => {
          console.log('Screenshots cleared from storage');
          screenshotCounter = 0; // Reset the counter to zero
          updateScreenshotCount(); // Update the counter display
        });
      });
    }

    else {
      console.log('No screenshots or text available.');
    }


  });

  clearAllButton.addEventListener('click', () => {
    screenshots = [];
    screenshotCounter = 0;
    updateScreenshotCount();
    captureButton.disabled = false;
    chrome.storage.local.set({ screenshots }, () => {
      console.log('All screenshots cleared from storage');
    });
  });

  deleteButton.addEventListener('click', () => {
    if (screenshotCounter > 0) {
      screenshots.pop();
      screenshotCounter--;
      updateScreenshotCount();

      if (screenshotCounter < 50) {
        captureButton.disabled = false;
      }
    } else {
      console.log('No screenshots to delete.');
    }

    chrome.storage.local.set({ screenshots }, () => {
      console.log('Screenshots updated in storage');
    });
  });


});

// ---- ---- ---- ---- ---- //
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



