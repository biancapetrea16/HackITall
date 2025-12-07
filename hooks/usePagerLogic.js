import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import pagerMessages from '../app/(tabs)/data';

const SERVER_URL = "https://unrefunded-asteriated-jairo.ngrok-free.dev"; 
const MAX_GROUP_LENGTH = 10;
const MAX_AI_PROMPT_LENGTH = 120;

const MENU_ITEMS = ["CONTACTS", "GROUPS", "CREATE GROUP", "LOGOUT"];
const MESSAGE_MENU_ITEMS = ["CUSTOM AI PROMPT", "SENT HISTORY"];

// Modificat: Adăugat "START GAME"
const GROUP_MGMT_OPTIONS = ["ADD PEOPLE", "VIEW MEMBERS", "SEND MESSAGE", "START GAME"];

// --- FUNCȚIE HELPER PENTRU NORMALIZARE ---
const normalizePhoneNumber = (phone) => {
    if (!phone) return "";
    let cleaned = phone.replace(/\D/g, ''); 
    if (cleaned.startsWith('40') && cleaned.length >= 11) {
        cleaned = cleaned.substring(2);
    }
    if (cleaned.startsWith('7') && cleaned.length === 9) {
        cleaned = '0' + cleaned;
    }
    return cleaned;
};

export function usePagerLogic() {
  
  const [myPhoneNumber, setMyPhoneNumber] = useState(null);
  const [isLogged, setIsLogged] = useState(false);

  const initialMessages = pagerMessages && pagerMessages.length > 0 ? pagerMessages : [];
  const [messages, setMessages] = useState(["WELCOME", ...initialMessages]);
  const [contacts, setContacts] = useState(["LOADING..."]);
  const [contactsMap, setContactsMap] = useState({});
  const [groups, setGroups] = useState([]); 

  
  const [newGroupName, setNewGroupName] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [targetRecipient, setTargetRecipient] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [notificationData, setNotificationData] = useState(null);
  const [decryptedText, setDecryptedText] = useState(null); 
  const [currentTheme, setCurrentTheme] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [menuIndex, setMenuIndex] = useState(0); 
  const [messageMenuIndex, setMessageMenuIndex] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(0); 
  const [groupMgmtIndex, setGroupMgmtIndex] = useState(0);
  const [addMemberIndex, setAddMemberIndex] = useState(0);
  const [groupMemberViewIndex, setGroupMemberViewIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  
  // Stări pentru funcționalitatea de căutare
  const [searchTerm, setSearchTerm] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);

  //game variables
  const [gameMission, setGameMission] = useState(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [mode, setMode] = useState('READ'); 
  const BEEP_SOUND_ASSET = require('../assets/images/beep.mp3');

  // Lista de coduri de pager cu semnificațiile lor
  const predefinedHistory = [
    "17 (No)",   
    "25 (Sorry)", 
    "99 (Nighty night)", 
    "100 (Available)",  
    "121 (Need 2 talk)",  
    "143 (I love you)",  
    "157 (Keep in touch)", 
    "187 (I hate you)",  
    "220 (Where are you?)", 
    "265 (Check mail)",  
    "290 (No pager)",  
    "333 (Whats up?)",  
    "345 (Thank you)",  
    "346 (Call back)",  
    "370 (Congrats)",  
    "411 (Question)",  
    "424 (Call me)",  
    "435 (Yes)",  
    "4673 (Sweet dreams)", 
    "480 (Let me know)",  
    "504 (Urgent)",  
    "505 (SOS)",  
    "601 (Happy bday)",  
    "607 (Miss you)",  
    "911 (Emergency)",
  ];

 const [sentHistory, setSentHistory] = useState([
    ...predefinedHistory,
    "HELLO!", "RUNNING LATE", "NEED HELP ASAP", "WHERE ARE YOU?"
  ]);

  // --- 1. ÎNCĂRCARE DATE LA PORNIRE (User + Grupuri) ---
  useEffect(() => {
      const loadData = async () => {
          try {
              // Încărcăm numărul de telefon
              const savedNumber = await AsyncStorage.getItem('MY_PHONE_NUMBER');
              if (savedNumber) {
                  setMyPhoneNumber(savedNumber);
                  setIsLogged(true);
              }

              // Încărcăm grupurile salvate local (cache)
              const savedGroups = await AsyncStorage.getItem('SAVED_GROUPS');
              if (savedGroups) {
                  setGroups(JSON.parse(savedGroups));
              }
          } catch (e) { console.log(e); }
      };
      loadData();
  }, []);

  // --- 2. SALVARE AUTOMATĂ A GRUPURILOR CÂND SE SCHIMBĂ ---
  useEffect(() => {
      const saveGroupsLocal = async () => {
          try {
              if (groups.length > 0) {
                  await AsyncStorage.setItem('SAVED_GROUPS', JSON.stringify(groups));
              }
          } catch (e) { console.log(e); }
      };
      saveGroupsLocal();
  }, [groups]);


  const loginUser = async (numberInput) => {
      if (!numberInput || numberInput.length < 3) return;
      const cleanNumber = normalizePhoneNumber(numberInput);
      
      try {
          await AsyncStorage.setItem('MY_PHONE_NUMBER', cleanNumber);
          setMyPhoneNumber(cleanNumber);
          setIsLogged(true);
          setTimeout(() => fetchMyGroups(cleanNumber), 1000);
      } catch (e) { console.log(e); }
  };

  const logoutUser = async () => {
      await AsyncStorage.removeItem('MY_PHONE_NUMBER');
      await AsyncStorage.removeItem('SAVED_GROUPS'); // Opțional: ștergem și grupurile la logout
      setMyPhoneNumber(null);
      setIsLogged(false);
      setGroups([]);
      setMode('READ');
  };

  async function playBeep() {
    try {
      const { sound } = await Audio.Sound.createAsync( BEEP_SOUND_ASSET );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) { sound.unloadAsync(); }
      });
    } catch (error) { }
  }

  const sendDataToServer = (data) => {
      fetch(`${SERVER_URL}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      }).catch((e) => {
          setFeedbackMessage("server err");
      });
  };

  const fetchMyGroups = async (phoneOverride = null) => {
    if (!SERVER_URL.includes("ngrok")) return;
    const phone = phoneOverride || myPhoneNumber;
    if (!phone) return;

    try {
        const response = await fetch(`${SERVER_URL}/groups/my-groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: phone })
        });
        const data = await response.json();
        if (data && data.groups) {
            // Verificăm dacă sunt modificări față de ce avem local
            if (JSON.stringify(data.groups) !== JSON.stringify(groups)) {
                setGroups(data.groups);
                // Salvarea în AsyncStorage se face automat prin useEffect-ul de la punctul 2
            }
        }
    } catch (e) {}
  };

  const createGroupOnServer = async (groupName) => {
      try {
          const newGroup = { name: groupName, members: [myPhoneNumber] };
          // Adăugăm local instant (Optimistic UI) - asta declanșează salvarea în AsyncStorage
          setGroups(prev => [...prev, newGroup]);

          await fetch(`${SERVER_URL}/groups/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ group_name: groupName, creator_id: myPhoneNumber })
          });
      } catch (e) { console.log("Create group error", e); }
  };

  const addMemberOnServer = async (groupName, memberName) => {
      try {
          const memberPhone = contactsMap[memberName];
          if (!memberPhone) { setFeedbackMessage("NO PHONE NR!"); return; }

          setGroups(prevGroups => 
            prevGroups.map(group => {
                if (group.name === groupName && !group.members.includes(memberName)) {
                    return { ...group, members: [...group.members, memberPhone] };
                }
                return group;
            })
          );

          await fetch(`${SERVER_URL}/groups/add-member`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ group_name: groupName, new_member_id: memberPhone })
          });
      } catch (e) { console.log("Add member error", e); }
  };

  const decryptMessage = async (encryptedCode) => {
      setFeedbackMessage("DECRYPTING...");
      try {
          const response = await fetch(`${SERVER_URL}/ai/decrypt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: encryptedCode })
          });
          const result = await response.json();
          if (result.decrypted_text) {
              setDecryptedText(result.decrypted_text);
              setFeedbackMessage(null);
          } else {
              setDecryptedText(null); // Clear previous decryption text on failure
              setFeedbackMessage("DECRYPT FAILED");
          }
      } catch (e) { 
        setDecryptedText(null);
        setFeedbackMessage("SERVER ERROR"); 
    }
      setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // --- LOGICĂ NOUĂ ȘI CORECTATĂ PENTRU BUTONUL AI ---
  const handleAIDecrypt = async () => {
    // 1. Dacă textul decriptat este afișat, o a doua apăsare a butonului AI îl ascunde.
    if (decryptedText) {
        setDecryptedText(null);
        return;
    }

    // 2. Permitem decriptarea doar în modul READ și dacă nu există un mesaj de feedback activ.
    if (mode !== 'READ' || feedbackMessage) return;

    const currentMsg = messages[currentIndex]; // Mesajul afișat curent
    
    // 3. Verificăm dacă mesajul este un cod scurt (max 10 caractere)
    if (currentMsg && currentMsg.length <= 10) {
        await decryptMessage(currentMsg);
    } else {
        setFeedbackMessage("NOT A SHORT CODE");
        setTimeout(() => setFeedbackMessage(null), 1500);
    }
  };


  // --- LOAD CONTACTS ---
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({ 
            fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers], 
            sort: Contacts.SortTypes.FirstName
        });
        if (data.length > 0) {
           let map = {};
           let namesList = [];
           data.forEach(contact => {
               if (contact.name && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                   const name = contact.name.toUpperCase().slice(0, 12);
                   let cleanPhone = normalizePhoneNumber(contact.phoneNumbers[0].number);
                   if (cleanPhone.length >= 9) {
                       map[name] = cleanPhone;
                       namesList.push(name);
                   }
               }
           });
           namesList.sort((a, b) => a.localeCompare(b));
           namesList = [...new Set(namesList)];
           setContacts(namesList);
           setContactsMap(map);
        } else {
           setContacts(["NO CONTACTS"]);
        }
      }
    })();
  }, []);

  // --- POLLING & AFISARE PERSISTENTA A MESAJELOR CORECTATA ---
// --- POLLING ---
  useEffect(() => {
    const checkInboxAndGroups = async () => {
        if (!SERVER_URL.includes("ngrok") || !myPhoneNumber) return; 
        try {
            const response = await fetch(`${SERVER_URL}/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ me: myPhoneNumber })
            });
            const data = await response.json();
            
            if (data.has_messages) {
                let hasNew = false;
                
                data.messages.forEach(msgItem => {
                    // 1. Extragem Textul și Expeditorul
                    // Serverul poate trimite string simplu SAU obiect { text: "...", from: "..." }
                    const msgText = typeof msgItem === 'object' ? msgItem.text : msgItem;
                    const msgSender = typeof msgItem === 'object' ? (msgItem.from || msgItem.sender) : null;

                    // 2. Verificăm dacă mesajul există deja în lista locală
                    // Comparăm textul (sau ideal un ID dacă ai avea)
                    const alreadyExists = messages.some(m => {
                        const existingText = typeof m === 'object' ? m.text : m;
                        return existingText === msgText;
                    });

                    if (!alreadyExists && msgText !== "WELCOME") { 
                        // Adăugăm în lista de mesaje
                        setMessages(prev => [...prev, msgText]);
                        hasNew = true;

                        // 3. Căutăm Numele în Agendă (Reverse Lookup)
                        let displayName = "UNKNOWN";
                        if (msgSender) {
                            // contactsMap e de forma { "NUME": "07..." }
                            // Căutăm Cheia (Numele) care are Valoarea (Numărul) egală cu msgSender
                            const foundName = Object.keys(contactsMap).find(key => contactsMap[key] === msgSender);
                            displayName = foundName || msgSender; // Dacă nu e în agendă, afișăm numărul
                        } else {
                            displayName = "INCOMING"; // Fallback dacă serverul nu trimite 'from'
                        }

                        // 4. Setăm Notificarea cu Numele Găsit
                        setNotificationData({ sender: displayName, text: msgText });
                        
                        // Ascunde notificarea după 4 secunde
                        setTimeout(() => setNotificationData(null), 4000); 
                    }
                });

                if (hasNew) {
                    playBeep();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setFeedbackMessage(null); 
                    // Setăm indexul la ultimul mesaj (mesajele noi se adaugă la final)
                    setCurrentIndex(messages.length); 
                }
            }
        } catch (e) { }
        await fetchMyGroups();
    };
    const intervalId = setInterval(checkInboxAndGroups, 3000); 
    return () => clearInterval(intervalId);
  }, [messages, groups, myPhoneNumber, contactsMap]); // 🔥 IMPORTANT: Am adăugat contactsMap la dependency array
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((prev) => !prev), 500);
    return () => clearInterval(interval);
  }, []);


  const addMemberToGroup = (groupName, memberName) => {
      setGroups(prevGroups => 
          prevGroups.map(group => {
              if (group.name === groupName) {
                  if (!group.members.includes(memberName)) {
                      return { ...group, members: [...group.members, memberName] };
                  }
              }
              return group;
          })
      );
  };

const getCurrentGroupMembers = () => {
    const g = groups.find(grp => grp.name === currentGroup);
    if (!g) return [];

    return g.members.map(memberPhone => {
        // 1. Verificăm dacă e numărul meu
        if (memberPhone === myPhoneNumber) {
            return "ME"; 
        }

        // 2. Căutăm numărul în agenda de contacte (contactsMap: { NUME: TEL })
        const contactName = Object.keys(contactsMap).find(key => contactsMap[key] === memberPhone);

        // 3. Dacă am găsit numele, îl returnăm. Dacă nu, returnăm numărul simplu.
        return contactName || memberPhone;
    });
};
  // 3. Logică Start Game 
  const startGameWithGroup = async () => {
      setFeedbackMessage("CONTACTING HQ..."); 
      try {
          const members = getCurrentGroupMembers().filter(m => m !== 'ME'); // Excludem "ME" din lista de jucători
          const response = await fetch(`${SERVER_URL}/game/start`, { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  group_name: currentGroup, 
                  players: members, 
                  user_id: myPhoneNumber 
              })
          });
          
          const data = await response.json();
          if (response.ok) {
              setGameMission(`GAME STARTED! Check inbox.`); 
              setIsGameActive(true);        
              setMode('GAME_VIEW');         
          } else {
              setFeedbackMessage(`GAME ERROR: ${data.error || response.status}`);
          }
      } catch (e) {
          setFeedbackMessage("CONNECTION ERROR");
          console.log("GAME START ERROR:", e);
      }
      setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleButtonPress = async (label) => { 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!isLogged) return; 

    if (isSending) return;
    if (notificationData || feedbackMessage) {
        setNotificationData(null); 
        setFeedbackMessage(null);
        if (label !== 'BTN_MENU') return; 
    }
    
    // LOGICĂ DECRIPTARE: Dacă textul decriptat este afișat, orice buton (inclusiv SEND) îl șterge.
    if (decryptedText && label !== 'AI') { // AI e gestionat separat in handleAIDecrypt
        setDecryptedText(null);
        if (mode === 'READ') return; 
    }
    
    if ((mode === 'GROUP_TYPING' || mode === 'AI_PROMPT') && label !== 'SEND' && label !== 'BTN_MENU') return;
    
    if (mode === 'READ' && currentIndex === 0) {
        if (label === 'UP' || label === 'DOWN') return; 
    }
    if (mode === 'GAME_VIEW') {
        if (label === 'SEND' || label === 'BTN_MENU') {
            setTargetRecipient({name: currentGroup, mode: 'GROUPS', index: -1}); 
            setMode('MSG_MENU');
        }
        return; 
    }
    
    switch (label) {
      case 'BTN_MENU':
        if (mode === 'GROUP_TYPING' || mode === 'AI_PROMPT') { 
            const prevMode = mode === 'GROUP_TYPING' ? 'MENU' : 'MSG_MENU';
            setMode(prevMode);
            setNewGroupName(''); 
            setAiPrompt('');
        }
        else if (mode === 'SENT_HISTORY_VIEW') { setMode('MSG_MENU'); }
        else if (mode === 'MSG_MENU') { setMode(targetRecipient.mode); setTargetRecipient(null); }
        else if (mode === 'GROUP_MGMT_MENU') { setMode('GROUPS'); setCurrentGroup(null); }
        else if (mode === 'ADD_MEMBER_SELECTION') { setMode('GROUP_MGMT_MENU'); }
        else if (mode === 'GROUP_MEMBERS_VIEW') { setMode('GROUP_MGMT_MENU'); }
        else if (mode === 'MENU') { setMode('READ'); setCurrentIndex(messages.length > 0 ? messages.length - 1 : 0); } // Corectie: revine la ultimul mesaj
        else if (mode === 'READ' && currentIndex !== 0) { setCurrentIndex(0); }
        else { setMode('MENU'); setMenuIndex(0); }
        break;

      case 'UP':
        if (mode === 'MENU') setMenuIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'MSG_MENU') setMessageMenuIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'GROUP_MGMT_MENU') setGroupMgmtIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'SENT_HISTORY_VIEW') setHistoryIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'ADD_MEMBER_SELECTION') setAddMemberIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'GROUP_MEMBERS_VIEW') setGroupMemberViewIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'READ') setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0));
        else { setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0)); }
        break;

      case 'DOWN':
        if (mode === 'READ' && currentIndex === messages.length - 1) return; // Limita de jos in READ
        if (mode === 'MENU') setMenuIndex(prev => (prev < MENU_ITEMS.length - 1 ? prev + 1 : prev));
        else if (mode === 'MSG_MENU') setMessageMenuIndex(prev => (prev < MESSAGE_MENU_ITEMS.length - 1 ? prev + 1 : prev));
        // Corectat: Max index pentru GROUP_MGMT_OPTIONS
        else if (mode === 'GROUP_MGMT_MENU') setGroupMgmtIndex(prev => (prev < GROUP_MGMT_OPTIONS.length - 1 ? prev + 1 : prev));
        else if (mode === 'SENT_HISTORY_VIEW') setHistoryIndex(prev => (prev < sentHistory.length - 1 ? prev + 1 : prev));
        else if (mode === 'ADD_MEMBER_SELECTION') setAddMemberIndex(prev => (prev < contacts.length - 1 ? prev + 1 : prev));
        else if (mode === 'GROUP_MEMBERS_VIEW') {
            const mems = getCurrentGroupMembers();
            setGroupMemberViewIndex(prev => (prev < mems.length - 1 ? prev + 1 : prev));
        }
        else { 
            const currentList = mode === 'READ' ? messages : (mode === 'GROUPS' ? groups : contacts);
            let maxIndex = currentList.length - 1;
            setCurrentIndex(prev => (prev < maxIndex ? prev + 1 : maxIndex));
        }
        break;

      case 'SEND':
        if (mode === 'GROUP_TYPING') {
            if (newGroupName.trim().length === 0) { setFeedbackMessage("NAME REQUIRED"); } 
            else {
                createGroupOnServer(newGroupName.toUpperCase());
                setFeedbackMessage(`GROUP ${newGroupName.toUpperCase()} CREATED!`);
                setMode('READ');
                setNewGroupName(''); 
            }
            return;
        }
if (mode === 'AI_PROMPT') {
            if (aiPrompt.trim().length === 0) { setFeedbackMessage("PROMPT REQUIRED"); return; }
            setFeedbackMessage("ENCRYPTING..."); 
            try {
                const aiResponse = await fetch(`${SERVER_URL}/ai/encrypt`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ long_message: aiPrompt, sender: myPhoneNumber })
                });
                const result = await aiResponse.json();
                const finalCode = result.encrypted_code; 
                if (!finalCode) {
                    setFeedbackMessage("ENCRYPT FAILED!");
                    setTimeout(() => setFeedbackMessage(null), 3000);
                    return;
                }
                
                // --- MODIFICARE: Logica de trimitere Grup vs Contact ---
                if (targetRecipient.mode === 'GROUPS') {
                    const groupObj = groups.find(g => g.name === targetRecipient.name);
                    if (groupObj && groupObj.members) {
                        groupObj.members.forEach(memberPhone => {
                            if (memberPhone !== myPhoneNumber) {
                                sendDataToServer({ 
                                    to: memberPhone, 
                                    text: finalCode, 
                                    type: 'ENCRYPTED', 
                                    from: myPhoneNumber 
                                });
                            }
                        });
                        setFeedbackMessage(`SENT TO GROUP!`);
                    } else {
                         setFeedbackMessage("ERR: EMPTY GROUP");
                    }
                } else {
                    const realRecipient = contactsMap[targetRecipient.name]; 
                    if (realRecipient) {
                        sendDataToServer({ 
                            to: realRecipient, 
                            text: finalCode, 
                            type: 'ENCRYPTED', 
                            from: myPhoneNumber
                        });
                        setFeedbackMessage(`SENT: ${finalCode}`);
                    } else {
                        setFeedbackMessage("ERR: NO NUMBER");
                    }
                }
                // -----------------------------------------------------

            } catch(e) { setFeedbackMessage("AI SERVER ERROR!"); }
            setAiPrompt('');
            setTargetRecipient(null);
            setMode('READ');
            setTimeout(() => setFeedbackMessage(null), 2000); 
            return;
        }

        if (mode === 'MENU') {
            const selectedOption = MENU_ITEMS[menuIndex];
            if (selectedOption === 'CONTACTS') { setMode('CONTACTS'); setCurrentIndex(0); }
            else if (selectedOption === 'GROUPS') { setMode('GROUPS'); setCurrentIndex(0); }
            else if (selectedOption === 'CREATE GROUP') { setMode('GROUP_TYPING'); setNewGroupName(''); }
            else if (selectedOption === 'LOGOUT') { logoutUser(); }
        } 
        
        else if (mode === 'MSG_MENU') {
             const selectedOption = MESSAGE_MENU_ITEMS[messageMenuIndex];
             if (selectedOption === 'CUSTOM AI PROMPT') { setMode('AI_PROMPT'); setAiPrompt(''); } 
             else if (selectedOption === 'SENT HISTORY') { setMode('SENT_HISTORY_VIEW'); setHistoryIndex(0); }
        }
        else if (mode === 'GROUP_MGMT_MENU') {
            const selectedOption = GROUP_MGMT_OPTIONS[groupMgmtIndex];
            if (selectedOption === 'ADD PEOPLE') {
                if (contacts.length === 0 || contacts[0] === "NO CONTACTS") {
                     setFeedbackMessage("NO CONTACTS!");
                     return;
                }
                setMode('ADD_MEMBER_SELECTION');
                setAddMemberIndex(0);
            } else if (selectedOption === 'SEND MESSAGE') {
                setTargetRecipient({name: currentGroup, mode: 'GROUPS', index: -1}); 
                setMode('MSG_MENU');
            } else if (selectedOption === 'VIEW MEMBERS') {
                const mems = getCurrentGroupMembers();
                if (mems.length === 0) {
                    setFeedbackMessage("NO MEMBERS!");
                    return;
                }
                setMode('GROUP_MEMBERS_VIEW');
                setGroupMemberViewIndex(0);
            } else if (selectedOption === 'START GAME') {
                await startGameWithGroup();
            }
        } else if (mode === 'ADD_MEMBER_SELECTION') {
             const memberToAddName = contactsForSelectionFinal[addMemberIndex]; // Folosim lista filtrata
             addMemberOnServer(currentGroup, memberToAddName);
             setFeedbackMessage(`${memberToAddName} ADDED!`);
             setMode('GROUP_MGMT_MENU');
        }
else if (mode === 'SENT_HISTORY_VIEW') {
            const messageToSend = sentHistory[historyIndex];
            
            // --- MODIFICARE: Logica de trimitere Grup vs Contact ---
            if (targetRecipient.mode === 'GROUPS') {
                const groupObj = groups.find(g => g.name === targetRecipient.name);
                if (groupObj && groupObj.members) {
                    groupObj.members.forEach(memberPhone => {
                        if (memberPhone !== myPhoneNumber) {
                            sendDataToServer({ 
                                to: memberPhone, 
                                text: messageToSend,
                                type: 'HISTORY_MSG',
                                from: myPhoneNumber
                            });
                        }
                    });
                    setFeedbackMessage(`GROUP SENT!`);
                } else {
                     setFeedbackMessage("ERR: EMPTY GROUP");
                }
            } else {
                const realRecipient = contactsMap[targetRecipient.name];
                if (realRecipient) {
                    sendDataToServer({ 
                        to: realRecipient, 
                        text: messageToSend,
                        type: 'HISTORY_MSG',
                        from: myPhoneNumber
                    });
                    setFeedbackMessage(`SENT: ${messageToSend.slice(0, 10)}...`);
                } else {
                    setFeedbackMessage("ERR: NO NUMBER");
                }
            }
            // -----------------------------------------------------

            setTargetRecipient(null);
            setMode('READ');
            setTimeout(() => setFeedbackMessage(null), 2000); 
        }
        else if (mode === 'CONTACTS') {
            const targetName = contacts[currentIndex];
            setTargetRecipient({name: targetName, mode: mode, index: currentIndex});
            setMode('MSG_MENU');
            setMessageMenuIndex(0); 
        }
        else if (mode === 'GROUPS') {
            const targetGroupObject = groups[currentIndex]; 
            if (!targetGroupObject) {
                 setFeedbackMessage("NO GROUP SELECTED!");
                 return;
            }
            setCurrentGroup(targetGroupObject.name); 
            setMode('GROUP_MGMT_MENU');
            setGroupMgmtIndex(0);
        }
        else if (mode === 'READ') {
            setFeedbackMessage("PRESS MENU TO START");
            setTimeout(() => setFeedbackMessage(null), 1500); 
        }
        break;
        
      default:
        console.log("Pressed:", label);
    }
  };

  // Logica de filtrare a contactelor
  const contactsForSelectionBase = contacts.filter(contactName => {
      if (searchTerm.length > 0) {
          return contactName.includes(searchTerm.toUpperCase());
      }
      return true;
  });

  const contactsForSelectionFinal = contactsForSelectionBase.filter(contactName => {
      const groupMembers = groups.find(g => g.name === currentGroup)?.members;
      const contactPhone = contactsMap[contactName];
      if (mode === 'ADD_MEMBER_SELECTION') {
          return currentGroup && contactPhone && !groupMembers.includes(contactPhone);
      }
      return true;
  });
  
  let displayText;
  let currentListLength = 0;
  let currentDisplayIndex = 0;

  if (decryptedText) { 
      displayText = decryptedText;
    } else if (mode === 'GAME_VIEW') {
      displayText = `MISSION: ${gameMission}`; 
  } else if (isSending) { 
      displayText = "SENDING..."; 
  } else if (feedbackMessage) { 
      displayText = feedbackMessage; 
  } else if (mode === 'GROUP_TYPING') { 
      displayText = 'Type Group Name...'; 
  } else if (mode === 'AI_PROMPT') { 
      displayText = 'Type Long Message...'; 
  } else if (mode === 'CONTACTS') { 
      displayText = contacts[currentIndex] || "EMPTY"; 
      currentListLength = contacts.length;
      currentDisplayIndex = currentIndex;
  } else if (mode === 'GROUPS') { 
      displayText = groups[currentIndex]?.name || "NO GROUPS"; 
      currentListLength = groups.length;
      currentDisplayIndex = currentIndex;
  } else if (mode === 'SENT_HISTORY_VIEW') {
      displayText = sentHistory[historyIndex] || "NO HISTORY";
      currentListLength = sentHistory.length;
      currentDisplayIndex = historyIndex;
  } else if (mode === 'MENU') { 
      displayText = "MAIN MENU"; 
  } else if (mode === 'MSG_MENU') { 
      displayText = `MSG TO: ${targetRecipient?.name || 'ERR'}`; 
  } else if (mode === 'GROUP_MGMT_MENU') {
      displayText = `MANAGE: ${currentGroup || 'ERR'}`;
  } else if (mode === 'ADD_MEMBER_SELECTION') {
       displayText = contactsForSelectionFinal[addMemberIndex] || `ADD TO ${currentGroup}:`;
       currentListLength = contactsForSelectionFinal.length;
       currentDisplayIndex = addMemberIndex;
  } 
  else if (mode === 'GROUP_MEMBERS_VIEW') {
       const mems = getCurrentGroupMembers(); 
       displayText = mems[groupMemberViewIndex] || "EMPTY GROUP";
       currentListLength = mems.length;
       currentDisplayIndex = groupMemberViewIndex;
  }
  else {
      displayText = messages[currentIndex] || "NO MSGS";
      currentListLength = messages.length;
      currentDisplayIndex = currentIndex;
  }
  
  const totalItems = feedbackMessage || isSending || mode.includes('TYPING') ? -1 : currentListLength;
    const MENU_PAGE_SIZE = 3; 
  let windowStart = 0;
  
  if (groupMgmtIndex >= MENU_PAGE_SIZE) {
      windowStart = groupMgmtIndex - (MENU_PAGE_SIZE - 1);
  }

  const visibleGroupOptions = GROUP_MGMT_OPTIONS
    .map((label, index) => ({ label, originalIndex: index })) 
    .slice(windowStart, windowStart + MENU_PAGE_SIZE); 
  return {
    displayText,
    decryptMessage,
    decryptedText,
    handleAIDecrypt,
    showCursor: !mode.includes('TYPING') && mode !== 'MSG_MENU' && mode !== 'GROUP_MGMT_MENU' && mode !== 'ADD_MEMBER_SELECTION' && mode !== 'GROUP_MEMBERS_VIEW' && mode !== 'GAME_VIEW', 
    handleButtonPress,
    currentIndex: currentDisplayIndex,
    totalMessages: totalItems,
    mode,
    myToken: myPhoneNumber,
    currentTheme,
    setCurrentTheme,
    menuItems: MENU_ITEMS, 
    menuIndex,
    messageMenuIndex,
    messageMenuItems: MESSAGE_MENU_ITEMS,
    groupMgmtOptions: GROUP_MGMT_OPTIONS,
    groupMgmtIndex,
    contactsForSelection: contactsForSelectionFinal, 
    addMemberIndex,
    sentHistory, historyIndex, feedbackMessage,
    newGroupName, setNewGroupName, aiPrompt, setAiPrompt,
    searchTerm, setSearchTerm, searchIndex, contactsForSelectionBase: contactsForSelectionBase, 
    MAX_GROUP_LENGTH, MAX_AI_PROMPT_LENGTH, notificationData,
    currentGroupMembers: getCurrentGroupMembers(),
    groupMemberViewIndex,
    isLogged, 
    loginUser,
    visibleGroupOptions,
  };
}