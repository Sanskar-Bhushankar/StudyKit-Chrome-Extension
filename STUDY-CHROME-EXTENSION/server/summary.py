from youtube_transcript_api import YouTubeTranscriptApi
import spacy
from spacy.lang.en.stop_words import STOP_WORDS
from string import punctuation
from heapq import nlargest
import spacy
import google.generativeai as genai

def generate_summary(captured_text):
    stopwords = list(STOP_WORDS)
    nlp = spacy.load('en_core_web_sm')
    doc = nlp(captured_text)

    tokens = [token.text for token in doc]

    word_freq = {}
    for word in doc:
        if word.text.lower() not in stopwords and word.text.lower() not in punctuation:
            if word.text not in word_freq.keys():
                word_freq[word.text] = 1
            else:
                word_freq[word.text] += 1

    max_freq = max(word_freq.values())

    for word in word_freq.keys():
        word_freq[word] = word_freq[word] / max_freq
        
    sent_tokens = [sent for sent in doc.sents]

    sent_scores = {}
    for sent in sent_tokens:
        for word in sent:
            if word.text in word_freq.keys():
                if sent not in sent_scores.keys():
                    sent_scores[sent] = word_freq[word.text]
                else:
                    sent_scores[sent] += word_freq[word.text]

    select_len = int(len(sent_tokens) * 0.3)

    summary = nlargest(select_len, sent_scores, key=sent_scores.get)

    final_summary = [word.text for word in summary]
    summary = ' '.join(final_summary)

    return summary

def get_video_transcript(video_url):
    try:
        # Extract video ID from the URL
        video_id = video_url.split("v=")[1].split("&")[0]

        # Call YouTubeTranscriptApi with the extracted video ID
        transcript = YouTubeTranscriptApi.get_transcript(video_id)

        txt = ''
        for entry in transcript:
            txt += entry['text'] + " "

        return txt.strip()  # Remove leading and trailing whitespaces
    except Exception as e:
        return str(e)
    
    

genai.configure(api_key="YOUR_API_KEY")
generation_config = {
    "temperature": 0.9,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 2048,
}

safety_settings = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
]

model = genai.GenerativeModel(model_name="gemini-pro",
                              generation_config=generation_config,
                              safety_settings=safety_settings)


def process_and_answer(context, question):
    prompt_parts = [
        f"process the text and ans the questions\n{context}\n",
        question, "\n"
    ]
    response = model.generate_content(prompt_parts)
    return response.text


def aisummmary(context, question):
    prompt_parts = [
        f"process the text and ans the questions\n{context}\n",
        question, "\n"
    ]
    response = model.generate_content(prompt_parts)
    return response.text



