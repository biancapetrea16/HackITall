from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# --- 1. BAZA DE DATE GLOBALĂ ȘI COZI DE AȘTEPTARE ---

# Stocăm mesajele care așteaptă să fie preluate de un destinatar
# Format: { 'ALEX': [{"text": "Hello"}, {"text": "Urgent"}], 'BIANCA': [...] }
messages_queue = {}

# Baza de date a codurilor predefinite
PREDEFINED_CODES = {
    "17": "No", "25": "Sorry", "99": "Nighty night", "100": "Available", 
    "121": "Need 2 talk", "143": "I love you", "157": "Keep in touch", 
    "187": "I hate you", "220": "Where are you?", "265": "Check mail", 
    "290": "No pager", "333": "Whats up?", "345": "Thank you", 
    "346": "Call back", "370": "Congrats", "411": "Question", 
    "424": "Call me", "435": "Yes", "4673": "Sweet dreams", 
    "480": "Let me know", "504": "Urgent", "505": "SOS", 
    "601": "Happy bday", "607": "Miss you", "911": "Emergency"
}

# --- 2. RUTE (ENDPOINTS) ---

# RUTA NOUĂ: Trimitere către un destinatar specific (Folosită de frontend)
@app.route('/send', methods=['POST'])
def send_message_to_recipient():
    # Frontend-ul trimite: { to: 'ALEX', text: 'BUZZ FROM BIANCA' }
    data = request.json
    recipient = data.get('to') # Destinatar (ex: ALEX)
    text_content = data.get('text') # Mesajul de trimis

    if not recipient or not text_content:
        return jsonify({"error": "Missing recipient or text"}), 400

    # Adăugăm mesajul în coada destinatarului
    if recipient not in messages_queue:
        messages_queue[recipient] = []
        
    messages_queue[recipient].append({
        "text": text_content,
        "sender": "Pager User" 
    })
    
    print(f"✅ Mesaj în Coadă: Trimitere către '{recipient}' ({text_content})")
    return jsonify({"message": f"Message queued for {recipient}"}), 201


# RUTA MODIFICATĂ: Verificare Inbox (Polling)
@app.route('/check', methods=['POST'])
def check_inbox():
    # Frontend-ul trimite ID-ul său (ex: BIANCA)
    data = request.json
    my_id = data.get('me')

    if not my_id or my_id not in messages_queue:
        # Nu există mesaje sau ID-ul nu este în sistem
        return jsonify({
            "has_messages": False,
            "messages": []
        })

    # Extragem mesajele
    messages_for_me = messages_queue[my_id]
    
    # Lista de mesaje (doar textul, cum se așteaptă frontend-ul)
    simple_messages_list = [msg['text'] for msg in messages_for_me]

    response = {
        "has_messages": len(simple_messages_list) > 0,
        "messages": simple_messages_list
    }

    # IMPORTANT: Golim coada după ce am trimis mesajele
    messages_queue[my_id] = []
    
    print(f"📧 Mesaje verificate pentru '{my_id}': {len(simple_messages_list)} noi.")
    return jsonify(response)


# RUTA: Resetare Bază de Date (coada)
@app.route('/reset', methods=['POST'])
def reset_db():
    global messages_queue
    messages_queue = {}
    print("🗑️ Coadă mesaje resetată.")
    return jsonify({"message": "Queue cleared"}), 200

if __name__ == '__main__':
    print("📟 Server Pager pornit pe portul 5002...")
    # ATENȚIE: Numele trebuie să fie în CAPS LOCK (Ex: ALEX)
    messages_queue['TEST'] = [{"text": "SERVER UP!"}]
    app.run(host='0.0.0.0', port=5002, debug=True)