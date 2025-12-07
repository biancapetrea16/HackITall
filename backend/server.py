import os
import random
import re
import json 
from collections import deque
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

import google.generativeai as genai

load_dotenv()

app = Flask(__name__)
CORS(app)

api_key = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = None

if not api_key:
    print("GEMINI_API_KEY lipseste!")
else:
    try:
        genai.configure(api_key=api_key)
        GEMINI_MODEL = genai.GenerativeModel('gemini-2.0-flash')
        print("Gemini AI conectat.")
    except Exception as e:
        print(f"Eroare Gemini: {e}")

CACHE_FILE = "pager_cache.json"

PREDEFINED_CODES = {
    "17": "No",
    "25": "Sorry",
    "99": "Nighty night",
    "100": "Available",
    "121": "Need 2 talk",
    "143": "I love you",
    "157": "Keep in touch",
    "187": "I hate you",
    "220": "Where are you?",
    "265": "Check mail",
    "290": "No pager",
    "333": "Whats up?",
    "345": "Thank you",
    "346": "Call back",
    "370": "Congrats",
    "411": "Question",
    "424": "Call me",
    "435": "Yes",
    "4673": "Sweet dreams",
    "480": "Let me know",
    "504": "Urgent",
    "505": "SOS",
    "601": "Happy bday",
    "607": "Miss you",
    "911": "Emergency"
}

def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                learned_codes = json.load(f)
                PREDEFINED_CODES.update(learned_codes)
                return learned_codes
        except:
            return {}
    return {}

def save_new_code(code, label):
    global AI_CACHE
    
    AI_CACHE[code] = label
    PREDEFINED_CODES[code] = label
    with open(CACHE_FILE, 'w') as f:
        json.dump(AI_CACHE, f)

AI_CACHE = load_cache()
print(f"Memorie Pager: {len(PREDEFINED_CODES)} coduri active ({len(AI_CACHE)} generate de AI).")

messages_queue = {}
groups_db = {}
game_states = {}

GAME_VOCABULARY = [
    "AIRPORT", "HOSPITAL", "BEACH", "RESTAURANT", "SCHOOL", 
    "GUITAR", "PIZZA", "SMARTPHONE", "DOCTOR", "SPY", "ALIEN"
]

#functii ajutatoare
def _clean_text(text):
    if not text: return ""
    text = re.sub(r'[^\w\s@?!-]', '', text.upper()) 
    return re.sub(r'\s+', ' ', text).strip()

def _send_private_message(recipient_id, message, sender="SYSTEM"):
    if recipient_id not in messages_queue:
        messages_queue[recipient_id] = []
    
    meaning = PREDEFINED_CODES.get(message, None)
    
    messages_queue[recipient_id].append({
        "text": message,   # codul (ex: 143 sau A1B2)
        "meaning": meaning, # label-ul (ex: I love you)
        "sender": sender,
        "timestamp": datetime.now().isoformat()
    })
    print(f"[MSG] -> {recipient_id}: Code='{message}' Label='{meaning}'")


@app.route('/ai/encrypt', methods=['POST'])
def ai_encrypt():
    data = request.json
    label_text = data.get('long_message', '') 
    
    if not label_text: return jsonify({"error": "Empty"}), 400

    clean_label = label_text.strip() 
    if not GEMINI_MODEL:
        fallback_code = f"TXT-{random.randint(1000,9999)}"
        save_new_code(fallback_code, clean_label)
        return jsonify({"encrypted_code": fallback_code}), 200

    #PROMPT-UL SPECIAL PENTRU GENERARE COD
    prompt = f"""
    Act as a creative 90s Pager Encoder.
    
    INPUT (LABEL): "{clean_label}"
    
    TASK: Create a short, unique alphanumeric CODE (max 8 chars) for this label.
    STYLE: Use phonetic numbers (2=to, 4=for), abbreviations, and pager slang.
    Examples: 
    - "See you later" -> "CUL8R"
    - "I love you" -> "143"
    - "Meeting at 5" -> "MEET@5"
    
    OUTPUT: STRICTLY ONLY THE CODE. NO OTHER TEXT.
    """

    try:
        response = GEMINI_MODEL.generate_content(prompt)
        
        if not response.text: raise ValueError("Empty AI response")
            
        # curatcodul generat
        generated_code = _clean_text(response.text)[:10] 

        save_new_code(generated_code, clean_label)
        
        print(f"AI GENERATED: Label='{clean_label}' -> Code='{generated_code}'")
        return jsonify({"encrypted_code": generated_code}), 200

    except Exception as e:
        print(f" AI Error: {e}")
        # Fallback in caz de eroare (Hash)
        import hashlib
        hash_code = hashlib.md5(clean_label.encode()).hexdigest()[:6].upper()
        save_new_code(hash_code, clean_label)
        return jsonify({"encrypted_code": hash_code}), 200


@app.route('/ai/decrypt', methods=['POST'])
def ai_decrypt():
    data = request.json
    code = data.get('code', '').upper()
    
    if not code: return jsonify({"error": "No code"}), 400

    if code in PREDEFINED_CODES:
        original_label = PREDEFINED_CODES[code]
        print(f"⚡ DEC (Found in DB): [{code}] -> '{original_label}'")
        return jsonify({"decrypted_text": original_label}), 200
    
    if GEMINI_MODEL:
        try:
            prompt = f"Decode this pager code: '{code}'. What does it likely mean in English? Reply ONLY with the meaning."
            response = GEMINI_MODEL.generate_content(prompt)
            guess = response.text.strip()
            return jsonify({"decrypted_text": f"[AI GUESS]: {guess}"}), 200
        except:
            pass

    return jsonify({"decrypted_text": "UNKNOWN CODE"}), 200


@app.route('/check', methods=['POST'])
def check_inbox():
    data = request.json
    my_id = data.get('me')
    if not my_id or my_id not in messages_queue:
        return jsonify({"has_messages": False, "messages": []})

    msgs = [m['text'] for m in messages_queue[my_id]]
    messages_queue[my_id] = [] 
    return jsonify({"has_messages": True, "messages": msgs})

@app.route('/send', methods=['POST'])
def send_message():
    data = request.json
    recipient = data.get('to')
    text = data.get('text')
    sender = data.get('from', 'Unknown')
    _send_private_message(recipient, text, sender)
    return jsonify({"status": "sent"}), 201

@app.route('/groups/create', methods=['POST'])
def create_group():
    data = request.json
    name = data.get('group_name', '').upper()
    creator = data.get('creator_id')
    if name not in groups_db:
        groups_db[name] = [creator]
    elif creator not in groups_db[name]:
        groups_db[name].append(creator)
    return jsonify({"message": "Group created", "group": {"name": name, "members": groups_db[name]}}), 200

@app.route('/groups/add-member', methods=['POST'])
def add_member():
    data = request.json
    group = data.get('group_name')
    member = data.get('new_member_id')
    if group in groups_db:
        if member not in groups_db[group]:
            groups_db[group].append(member)
            _send_private_message(member, f"ADDED TO GROUP: {group}", "SYSTEM")
        return jsonify({"message": "Added"}), 200
    return jsonify({"error": "Group not found"}), 404

@app.route('/groups/my-groups', methods=['POST'])
def my_groups():
    user = request.json.get('user_id')
    user_groups = [{"name": k, "members": v} for k, v in groups_db.items() if user in v]
    return jsonify({"groups": user_groups})


@app.route('/game/mission', methods=['POST'])
def generate_mission():
    target = request.json.get('contact_name', 'TARGET')
    missions = [
        f"AGENT! Group {target} is compromised. Use AI to encrypt 'MEET ME NOW'.",
        f"Extraction needed for {target}. Send code for HELICOPTER."
    ]
    return jsonify({"mission": random.choice(missions)})

@app.route('/game/start', methods=['POST'])
def start_game():
    data = request.json
    group_name = data.get('group_name')
    players = data.get('players')

    if not players and group_name in groups_db:
        players = groups_db[group_name]

    if not players or len(players) < 3:
        return jsonify({"error": "Need 3+ players"}), 400

    secret_word = random.choice(GAME_VOCABULARY)
    impostor = random.choice(players)

    for p in players:
        msg = "TOP SECRET: YOU ARE THE SPY. BLEND IN!" if p == impostor else f"TOP SECRET: THE WORD IS [{secret_word}]."
        _send_private_message(p, msg, "GAME MASTER")

    game_states[group_name] = {"word": secret_word, "spy": impostor}
    return jsonify({"message": "Game started"}), 200

@app.route('/game/guess', methods=['POST'])
def game_guess():
    data = request.json
    actual = game_states.get(data.get('group_name'), {}).get('word')
    res = f"VICTORY! SPY GUESSED '{actual}'" if data.get('guess', '').upper().strip() == actual else f"FAILED! WORD WAS '{actual}'"
    return jsonify({"result": res})

@app.route('/reset_db', methods=['POST'])
def reset_db():
    global messages_queue, groups_db, game_states, AI_CACHE, PREDEFINED_CODES
    messages_queue.clear()
    groups_db.clear()
    game_states.clear()
    AI_CACHE = {}
    if os.path.exists(CACHE_FILE):
        os.remove(CACHE_FILE) 
    print("Database Cleared.")
    return jsonify({"message": "Reset complete"}), 200

if __name__ == '__main__':
    print("Server NeoPager running on 5002...")
    app.run(host='0.0.0.0', port=5002, debug=True)