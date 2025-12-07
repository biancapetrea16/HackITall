from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import random
from collections import deque 
import random 

app = Flask(__name__)
CORS(app)

# --- BAZA DE DATE ȘI STĂRI DE JOC GLOBALE ---

# Stocăm mesajele care așteaptă să fie preluate de un destinatar (ID-ul = cheia)
messages_queue = {}

# Stările jocurilor active pe grup (Cheia = Numele Grupului)
game_states = {}

# Sete de cuvinte cheie din aceeași categorie (Pentru jocul Cameleonul)
WORD_SETS = [
    {"A": "BANANE", "B": "PORTOCALE"},
    {"A": "AVION", "B": "ELICOPTER"},
    {"A": "DOCTOR", "B": "ASISTENT"},
    {"A": "CHITARA", "B": "PIAN"},
    {"A": "OCEAN", "B": "LAC"}
]

# 🚨 NOU: TABELUL DE CRIPTARE AI (SIMULARE)
AI_ENCRYPTION_TABLE = {
    # Mesaj lung : Cod scurt (Max 10 chars)
    "CE MAI FACI?": "333WSUP",
    "AM NEVOIE SA VORBIM URGENT DESPRE HACKATHON.": "504CALLNOW",
    "M-AM INDRAGOSTIT DE JOCUL ASTA!": "143ILY",
    "NU POT AJUNGE LA INTALNIRE": "17SORRY"
}

# --- FUNCȚIE AJUTĂTOARE (PENTRU MESAJE PRIVATE/JOC) ---

def _send_private_message(recipient_id, message, sender="GAME MASTER"):
    """Adaugă un mesaj direct în coada unui singur destinatar."""
    if recipient_id not in messages_queue:
        messages_queue[recipient_id] = []
    messages_queue[recipient_id].append({"text": message, "sender": sender})
    print(f"   [MSG-PRIVATE] Trimis '{message[:15]}...' către {recipient_id}")


# --- 1. RUTE DE MESAGERIE DE BAZĂ (SEND & CHECK) ---

@app.route('/send', methods=['POST'])
def send_message_to_recipient():
    # Frontend-ul trimite: { to: 'ALEX', text: 'BUZZ', from: 'BIANCA' }
    data = request.json
    recipient = data.get('to') 
    text_content = data.get('text') 
    sender = data.get('from')

    if not recipient or not text_content:
        return jsonify({"error": "Missing recipient or text"}), 400

    # Adăugăm mesajul în coada destinatarului
    if recipient not in messages_queue:
        messages_queue[recipient] = []
        
    messages_queue[recipient].append({
        "text": text_content,
        "sender": sender 
    })
    
    print(f"✅ Mesaj în Coadă: Către '{recipient}' de la '{sender}' ({text_content[:20]}...)")
    return jsonify({"message": f"Message queued for {recipient}"}), 201


@app.route('/check', methods=['POST'])
def check_inbox():
    # Frontend-ul trimite ID-ul său (ex: BIANCA)
    data = request.json
    my_id = data.get('me')

    if not my_id or my_id not in messages_queue:
        return jsonify({"has_messages": False, "messages": []})

    messages_for_me = messages_queue[my_id]
    simple_messages_list = [msg['text'] for msg in messages_for_me]

    response = {
        "has_messages": len(simple_messages_list) > 0,
        "messages": simple_messages_list
    }

    # IMPORTANT: Golim coada după ce am trimis mesajele
    messages_queue[my_id] = []
    
    print(f"📧 Mesaje verificate pentru '{my_id}': {len(simple_messages_list)} noi.")
    return jsonify(response)


# --- 2. RUTE PENTRU JOCUL "CAMELEONUL SECRET" ---

@app.route('/game/start', methods=['POST'])
def start_game():
    data = request.json
    group_name = data.get('group_name')
    players = data.get('players') 

    if not group_name or len(players) < 3:
        return jsonify({"error": "Need at least 3 players to start"}), 400
    
    if group_name in game_states and game_states[group_name]['status'] == 'active':
        return jsonify({"error": "Game already active in this group"}), 400

    # 1. Distribuirea rolurilor și cuvintelor
    chosen_words = random.choice(WORD_SETS)
    impostor_id = random.choice(players)
    turn_order = random.sample(players, len(players))
    
    # 2. Setarea stării de joc
    game_states[group_name] = {
        "status": "active",
        "impostor_id": impostor_id,
        "word_A": chosen_words['A'], 
        "word_B": chosen_words['B'],
        "turn_order": deque(turn_order),
        "turn_current": turn_order[0],
        "clues_given": [],
        "players": players
    }
    
    # 3. Trimiterea mesajelor private de notificare
    for player in players:
        if player == impostor_id:
            msg = f"GAME STARTED! ROLE: IMPOSTOR. WORD: {chosen_words['B']}. YOUR TURN: {turn_order[0]}"
        else:
            msg = f"GAME STARTED! ROLE: REAL. WORD: {chosen_words['A']}. CURRENT TURN: {turn_order[0]}"
        
        _send_private_message(player, msg)
    
    print(f"🎮 Joc nou: '{group_name}'. Impostor: {impostor_id}. Cuvânt A: {chosen_words['A']}")
    return jsonify({"message": f"Game started in {group_name}. Check your private messages."}), 200

@app.route('/game/clue', methods=['POST'])
def submit_clue():
    data = request.json
    group_name = data.get('group_name')
    sender_id = data.get('sender_id')
    clue = data.get('clue')

    state = game_states.get(group_name)

    if not state or state['status'] != 'active':
        return jsonify({"error": "Game not active"}), 400
    
    if state['turn_current'] != sender_id:
        return jsonify({"error": f"It is not {sender_id}'s turn."}), 400
    
    # 1. Înregistrează indiciul
    state['clues_given'].append({"player": sender_id, "clue": clue})
    print(f"🧩 Indiciu: {sender_id} -> {clue}")

    # 2. Anunță pe toată lumea (broadcast)
    broadcast_msg = f"CLUE FROM {sender_id}: {clue}"
    for player in state['players']:
         _send_private_message(player, broadcast_msg, sender="GAME MESSAGE")
    
    # 3. Schimbă rândul
    current_player = state['turn_order'].popleft()
    state['turn_order'].append(current_player)
    state['turn_current'] = state['turn_order'][0]
    
    # Notifică următorul jucător (private)
    _send_private_message(state['turn_current'], "IT IS YOUR TURN!")

    return jsonify({"message": "Clue submitted and turn advanced"}), 200


@app.route('/game/guess', methods=['POST'])
def submit_guess():
    # ... (Logica de ghicire rămâne la fel) ...
    data = request.json
    group_name = data.get('group_name')
    sender_id = data.get('sender_id')
    guess_word = data.get('guess')

    state = game_states.get(group_name)

    if not state or state['status'] != 'active':
        return jsonify({"error": "Game not active"}), 400

    if sender_id == state['impostor_id']:
        if guess_word.upper() == state['word_A']:
            state['status'] = 'impostor_won'
            broadcast_msg = f"🎉 IMPOSTOR WINS! {sender_id} guessed the word: {state['word_A']}"
        else:
            broadcast_msg = f"❌ Impostor's guess was WRONG! ({guess_word})"
            
        for player in state['players']:
            _send_private_message(player, broadcast_msg, sender="GAME RESULT")
        
        return jsonify({"message": broadcast_msg}), 200

    return jsonify({"error": "Only the Impostor can submit a guess here."}), 400


# --- 3. RUTE PENTRU CRIPTAREA/DECRIPTAREA AI ---

@app.route('/ai/encrypt', methods=['POST'])
def ai_encrypt():
    data = request.json
    long_message = data.get('long_message', '').upper()
    
    # Simulare criptare: căutăm un cod predefinit
    encrypted_code = None
    for long_msg, code in AI_ENCRYPTION_TABLE.items():
        if long_msg in long_message:
            encrypted_code = code
            break
            
    if not encrypted_code:
        # Dacă nu găsim cod, luăm primele 10 caractere, capitalizate, + codul 411
        # Asigurăm max 10 caractere în total
        base_code = long_message[:7].upper()
        encrypted_code = base_code.ljust(7, '#') + "411"
        encrypted_code = encrypted_code[:10] # Siguranță: Max 10 chars
    
    # Salvăm perechea pentru decriptare inversă (dacă nu era deja în tabel)
    if long_message not in AI_ENCRYPTION_TABLE and len(long_message) < 50: # Evităm mesaje spam
        AI_ENCRYPTION_TABLE[long_message] = encrypted_code
    
    print(f"🤖 AI ENCRYPT: '{long_message[:15]}...' -> {encrypted_code}")
    return jsonify({"encrypted_code": encrypted_code}), 200

@app.route('/ai/decrypt', methods=['POST'])
def ai_decrypt():
    data = request.json
    encrypted_code = data.get('code', '').upper()
    
    # Simulare decriptare: căutăm codul scurt în valorile tabelului
    decrypted_text = None
    
    # Caută codul în valorile tabelului (inversare)
    for long_msg, code in AI_ENCRYPTION_TABLE.items():
        if code == encrypted_code:
            decrypted_text = long_msg
            break
    
    if not decrypted_text:
        return jsonify({"error": "Code not recognized by AI."}), 404
        
    print(f"🤖 AI DECRYPT: {encrypted_code} -> {decrypted_text}")
    return jsonify({"decrypted_text": decrypted_text}), 200


# --- RUTE ADIȚIONALE ---

@app.route('/reset_game', methods=['POST'])
def reset_db():
    global messages_queue, game_states
    messages_queue = {}
    game_states = {}
    print("🗑️ Database and Game States cleared.")
    return jsonify({"message": "Database and Game States cleared"}), 200


@app.route('/game/mission', methods=['POST'])
def generate_mission():
    data = request.json
    target_name = data.get('contact_name', 'TARGET')
    
    missions = [
        f"AGENT! Group {target_name} is compromised. Send a code meaning 'DANGER' but disguise it as 'LOVE'.",
        f"HQ here. {target_name} needs extraction. Use AI to generate a code for 'HELICOPTER'.",
        f"Mole detected in {target_name}. Send '187' (Hate) to warn the loyalists.",
        f"Operation Shadow: Convince {target_name} to meet you using only numeric codes."
    ]
    
    return jsonify({"mission": random.choice(missions)})
if __name__ == '__main__':
    print("🎮 Server Cameleonul Secret pornit pe portul 5002...")
    messages_queue['TEST'] = [{"text": "SERVER UP!", "sender": "SYSTEM"}]
    app.run(host='0.0.0.0', port=5002, debug=True)