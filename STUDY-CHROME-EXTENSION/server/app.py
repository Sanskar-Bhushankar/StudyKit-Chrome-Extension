from flask import Flask, jsonify, request
from summary import get_video_transcript, generate_summary,process_and_answer,aisummmary
from flask_cors import CORS
import time


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variable to store YouTube link
youtube_link = None

@app.route('/receive-link', methods=['POST'])
def receive_link():
    global youtube_link
    data = request.get_json()
    youtube_link = data.get('youtube_link')
    if youtube_link:
        print(f"Received YouTube Link: {youtube_link}")
    else:
        print("No YouTube link received.")
    return 'OK'

@app.route('/')
def index():
    global youtube_link
    if youtube_link:
        transcript_text = get_video_transcript(youtube_link)
        if transcript_text:
            summary_text = generate_summary(transcript_text)
            question="generate a summary such that it covers all essential points and important key points of summary "
            aigen=aisummmary(summary_text,question)
            print(aigen)
            return jsonify({"summary of this is ": aigen})  # Return the summary text with the appropriate key
        else:
            return jsonify({"error": "Failed to retrieve transcript."})
    else:
        return jsonify({"error": "No YouTube link received."})


# Captured text from website
@app.route('/capturetext', methods=['POST'])
def receive_text():
    data = request.json
    captured_text = data.get('text')
    # Generate summary using the captured text
    summary = generate_summary(captured_text)
    #print("Summary:", summary)  # Print the summary

    # Process the summary and answer questions
    question = "generate a summary in 50 words and give 10 major points"
    answer = process_and_answer(summary, question)
    print("Answer:", answer)  # Print the answer
    
    # Introduce a delay of 5 seconds
    time.sleep(5)
    
    return {'message': 'Text received successfully', 'answer': answer}


if __name__ == '__main__':
    app.run(debug=True)
