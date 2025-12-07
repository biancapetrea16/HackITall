import { Audio } from 'expo-av';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import pagerMessages from '../app/(tabs)/data';

// --- CONFIGURARE ---
const MY_ID = "AAA"; 
const SERVER_URL = "https://unrefunded-asteriated-jairo.ngrok-free.dev"; 
const MAX_GROUP_LENGTH = 10;
const MAX_AI_PROMPT_LENGTH = 120;

const MENU_ITEMS = ["CONTACTS", "GROUPS", "CREATE GROUP"];
const MESSAGE_MENU_ITEMS = ["CUSTOM AI PROMPT", "SENT HISTORY"];
const GROUP_MGMT_OPTIONS = ["ADD PEOPLE", "SEND MESSAGE"];


export function usePagerLogic() {
  
  const initialMessages = pagerMessages && pagerMessages.length > 0 ? pagerMessages : [];
  const [messages, setMessages] = useState(["WELCOME", ...initialMessages]);
  
  const [contacts, setContacts] = useState(["LOADING..."]);
  const [groups, setGroups] = useState([]); // [{name: string, members: string[]}]
  const [sentHistory, setSentHistory] = useState(["HELLO!", "RUNNING LATE", "NEED HELP ASAP", "WHERE ARE YOU?"]);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [targetRecipient, setTargetRecipient] = useState(null);
  
  const [currentGroup, setCurrentGroup] = useState(null);
  const [notificationData, setNotificationData] = useState(null);
  
  const [decryptedText, setDecryptedText] = useState(null); // Text decriptat
  

  const [currentTheme, setCurrentTheme] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [menuIndex, setMenuIndex] = useState(0); 
  const [messageMenuIndex, setMessageMenuIndex] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(0); 
  const [groupMgmtIndex, setGroupMgmtIndex] = useState(0);
  const [addMemberIndex, setAddMemberIndex] = useState(0);

  const [showCursor, setShowCursor] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const [mode, setMode] = useState('READ'); 
  
  // --- ASSET SOUND (Mutat static pentru a evita erorile de path) ---
  const BEEP_SOUND_ASSET = require('../assets/images/beep.mp3');

  // --- FUNCȚIA DE SUNET ---
  async function playBeep() {
    try {
      const { sound } = await Audio.Sound.createAsync( BEEP_SOUND_ASSET );
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log("Nu am găsit fișierul beep.mp3 sau eroare audio:", error);
    }
  }

  // 🚨 FUNCȚIE DEDICATĂ PENTRU SEND (IZOLEAZĂ EROAREA DE FETCH)
  const sendDataToServer = (data) => {
      fetch(`${SERVER_URL}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      }).catch((e) => {
          console.log("FETCH ERROR:", e);
          setFeedbackMessage("FETCH ERR! CHECK URL!");
      });
  };

  // 🚨 FUNCȚIE DE DECRYPTARE
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
              setFeedbackMessage("DECRYPT FAILED: Code not recognized.");
          }

      } catch (e) {
          setFeedbackMessage("DECRYPT FAILED: Server error.");
      }
      setTimeout(() => setFeedbackMessage(null), 3000);
  };


  // 1. SETUP CONTACTS (restul la fel)
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({ 
            fields: [Contacts.Fields.Name],
            sort: Contacts.SortTypes.FirstName
        });

        if (data.length > 0) {
           let formattedList = data
                .map(c => c.name ? c.name.toUpperCase().slice(0, 12) : "")
                .filter(Boolean);

           formattedList.sort((a, b) => a.localeCompare(b));
           formattedList = [...new Set(formattedList)];

           setContacts(formattedList);
        } else {
           setContacts(["NO CONTACTS"]);
        }
      }
    })();
  }, []);

  // 2. POLLING (restul la fel)
  useEffect(() => {
    const checkInbox = async () => {
        if (!SERVER_URL.includes("ngrok")) return; 
        try {
            const response = await fetch(`${SERVER_URL}/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ me: MY_ID })
            });
            const data = await response.json();
            if (data.has_messages) {
                let hasNew = false;
                data.messages.forEach(msg => {
                    if (!messages.includes(msg) && msg !== "WELCOME") { 
                        setMessages(prev => [...prev, msg]);
                        hasNew = true;
                        
                        setNotificationData({ sender: "INCOMING", text: msg });
                        setTimeout(() => setNotificationData(null), 4000); 
                    }
                });
                if (hasNew) {
                    playBeep();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setTimeout(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }, 200);
                    setFeedbackMessage(null); 
                    setCurrentIndex(messages.length - 1); 
                }
            }
        } catch (e) { }
    };
    const intervalId = setInterval(checkInbox, 3000); 
    return () => clearInterval(intervalId);
  }, [messages]); 

  // Cursor (restul la fel)
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((prev) => !prev), 500);
    return () => clearInterval(interval);
  }, []);


  // --- LOGICĂ ADĂUGARE MEMBRU ÎN GRUP ---
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


  // 🚨 FUNCȚIA PRINCIPALĂ DE GESTIONARE A BUTOANELOR ESTE ASYNC
  const handleButtonPress = async (label) => { 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSending) return;

    if (notificationData || feedbackMessage) {
        setNotificationData(null); 
        setFeedbackMessage(null);
        if (label !== 'BTN_MENU') return; 
    }
    
    // NOU: Dacă textul decriptat este afișat, BACK/MENU/SEND îl șterge
    if (decryptedText) {
        setDecryptedText(null);
        // Dacă suntem în modul READ și decriptăm, ne oprim aici
        if (mode === 'READ') return; 
    }
    
    // NOU: Decriptare la apăsarea SEND în modul READ
    if (mode === 'READ' && label === 'SEND') {
        const currentMsg = messages[currentIndex];
        // Presupunem că orice mesaj de max 10 caractere e un cod criptat
        if (currentMsg && currentMsg.length <= 10) {
            await decryptMessage(currentMsg); 
            return;
        }
    }


    if ((mode === 'GROUP_TYPING' || mode === 'AI_PROMPT') && label !== 'SEND' && label !== 'BTN_MENU') return;
    
    // Blocare Săgeți pe "WELCOME"
    if (mode === 'READ' && currentIndex === 0) {
        if (label === 'UP' || label === 'DOWN') return; 
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
        else if (mode === 'MENU') { setMode('READ'); setCurrentIndex(0); } 
        else if (mode === 'READ' && currentIndex !== 0) { setCurrentIndex(0); }
        else { setMode('MENU'); setMenuIndex(0); }
        break;

      case 'UP':
        if (mode === 'MENU') setMenuIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'MSG_MENU') setMessageMenuIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'GROUP_MGMT_MENU') setGroupMgmtIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'SENT_HISTORY_VIEW') setHistoryIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'ADD_MEMBER_SELECTION') setAddMemberIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'READ') setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0));
        else { setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0)); }
        break;

      case 'DOWN':
        if (mode === 'READ' && currentIndex === 0) return; 
        if (mode === 'MENU') setMenuIndex(prev => (prev < MENU_ITEMS.length - 1 ? prev + 1 : prev));
        else if (mode === 'MSG_MENU') setMessageMenuIndex(prev => (prev < MESSAGE_MENU_ITEMS.length - 1 ? prev + 1 : prev));
        else if (mode === 'GROUP_MGMT_MENU') setGroupMgmtIndex(prev => (prev < GROUP_MGMT_OPTIONS.length - 1 ? prev + 1 : prev));
        else if (mode === 'SENT_HISTORY_VIEW') setHistoryIndex(prev => (prev < SENT_HISTORY_MESSAGES.length - 1 ? prev + 1 : prev));
        else if (mode === 'ADD_MEMBER_SELECTION') setAddMemberIndex(prev => (prev < contactsForSelectionFinal.length - 1 ? prev + 1 : prev));
        else { 
            const currentList = mode === 'READ' ? messages : (mode === 'GROUPS' ? groups : contacts);
            let maxIndex = currentList.length - 1;
            setCurrentIndex(prev => (prev < maxIndex ? prev + 1 : maxIndex));
        }
        break;

      case 'SEND':
        // CAZUL A: SUBMIT GROUP NAME (CREARE GRUP)
        if (mode === 'GROUP_TYPING') {
            if (newGroupName.trim().length === 0) { setFeedbackMessage("NAME REQUIRED"); } 
            else {
                setGroups(prev => [...prev, {name: newGroupName.toUpperCase(), members: []}]);
                setFeedbackMessage(`GROUP ${newGroupName.toUpperCase()} ADDED!`);
                setMode('READ');
                setNewGroupName(''); 
            }
            return;
        }

        // 🚨 CAZUL B: SUBMIT AI PROMPT (CRIPTAT)
        if (mode === 'AI_PROMPT') {
            if (aiPrompt.trim().length === 0) { setFeedbackMessage("PROMPT REQUIRED"); return; }
            setFeedbackMessage("ENCRYPTING..."); 
            
            try {
                const aiResponse = await fetch(`${SERVER_URL}/ai/encrypt`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ long_message: aiPrompt, sender: MY_ID })
                });
                const result = await aiResponse.json();
                
                const finalCode = result.encrypted_code; 
                
                if (!finalCode) {
                    setFeedbackMessage("ENCRYPT FAILED!");
                    setTimeout(() => setFeedbackMessage(null), 3000);
                    return;
                }
                
                sendDataToServer({ 
                    to: targetRecipient.name, 
                    text: finalCode, 
                    type: 'ENCRYPTED', 
                    from: MY_ID
                });
                setFeedbackMessage(`SENT: ${finalCode} to ${targetRecipient.name}`);

            } catch(e) {
                 setFeedbackMessage("AI SERVER ERROR!");
            }
            
            setAiPrompt('');
            setTargetRecipient(null);
            setMode('READ');
            setTimeout(() => setFeedbackMessage(null), 2000); 
            return;
        }

        // CAZUL C: SELECTARE OPȚIUNE MENIU PRINCIPAL
        if (mode === 'MENU') {
            const selectedOption = MENU_ITEMS[menuIndex];
            if (selectedOption === 'CONTACTS') { setMode('CONTACTS'); setCurrentIndex(0); }
            else if (selectedOption === 'GROUPS') { setMode('GROUPS'); setCurrentIndex(0); }
            else if (selectedOption === 'CREATE GROUP') { setMode('GROUP_TYPING'); setNewGroupName(''); }
        } 
        
        // CAZUL D: SELECTARE OPȚIUNE MENIU DE MESAJE (MSG_MENU)
        else if (mode === 'MSG_MENU') {
             const selectedOption = MESSAGE_MENU_ITEMS[messageMenuIndex];
             if (selectedOption === 'CUSTOM AI PROMPT') { setMode('AI_PROMPT'); setAiPrompt(''); } 
             else if (selectedOption === 'SENT HISTORY') { setMode('SENT_HISTORY_VIEW'); setHistoryIndex(0); }
        }

        // CAZUL E: SELECTARE OPȚIUNE MENIU DE MANAGEMENT GRUP (GROUP_MGMT_MENU)
        else if (mode === 'GROUP_MGMT_MENU') {
            const selectedOption = GROUP_MGMT_OPTIONS[groupMgmtIndex];
            if (selectedOption === 'ADD PEOPLE') {
                if (contactsForSelectionFinal.length === 0) {
                     setFeedbackMessage("NO NEW MEMBERS!");
                     return;
                }
                setMode('ADD_MEMBER_SELECTION');
                setAddMemberIndex(0);
            } else if (selectedOption === 'SEND MESSAGE') {
                setTargetRecipient({name: currentGroup, mode: 'GROUPS', index: -1}); 
                setMode('MSG_MENU');
            }
        }

        // CAZUL F: SELECTARE MEMBRU NOU -> ADĂUGARE ÎN GRUP (ADD_MEMBER_SELECTION)
        else if (mode === 'ADD_MEMBER_SELECTION') {
             const memberToAdd = contactsForSelectionFinal[addMemberIndex];
             addMemberToGroup(currentGroup, memberToAdd);
             setFeedbackMessage(`${memberToAdd} ADDED TO ${currentGroup}!`);
             setMode('GROUP_MGMT_MENU');
        }
        
        // CAZUL G: SELECTARE MESAJ DIN ISTORIC -> TRIMITERE FINALĂ
        else if (mode === 'SENT_HISTORY_VIEW') {
            const messageToSend = sentHistory[historyIndex];
            
            sendDataToServer({ 
                to: targetRecipient.name, 
                text: messageToSend,
                type: 'HISTORY_MSG',
                from: MY_ID
            });

            setFeedbackMessage(`SENT: ${messageToSend.slice(0, 10)}... to ${targetRecipient.name}`);
            setTargetRecipient(null);
            setMode('READ');
            setTimeout(() => setFeedbackMessage(null), 2000); 
        }

        // CAZUL H: SELECTARE CONTACT/GRUP -> DESCHIDE MENIU (PREGĂTIRE)
        else if (mode === 'CONTACTS') {
            const target = contacts[currentIndex];
            setTargetRecipient({name: target, mode: mode, index: currentIndex});
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
        
        // CAZUL I: APĂSARE OK DIN MODUL READ (Dacă nu e cod criptat, afișează menu)
        else if (mode === 'READ') {
            setFeedbackMessage("PRESS MENU TO START");
            setTimeout(() => setFeedbackMessage(null), 1500); 
        }
        break;
        
      default:
        console.log("Pressed:", label);
    }
  };


  // --- CALCUL LOGICĂ AFIȘARE ---
  
  const contactsForSelectionFinal = contacts.filter(contact => {
      const groupMembers = groups.find(g => g.name === currentGroup)?.members;
      return currentGroup && groupMembers && !groupMembers.includes(contact);
  });
  
  // --- LOGICĂ AFIȘARE ---
  let displayText;
  let currentListLength = 0;
  let currentDisplayIndex = 0;

  if (decryptedText) { // NOU: Prioritate decriptării
      displayText = decryptedText;
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
  } else {
      displayText = messages[currentIndex] || "NO MSGS";
      currentListLength = messages.length;
      currentDisplayIndex = currentIndex;
  }
  
  const totalItems = feedbackMessage || isSending || mode.includes('TYPING') ? -1 : currentListLength;


  return {
    displayText,
    decryptMessage,
    decryptedText,
    showCursor: !mode.includes('TYPING') && mode !== 'MSG_MENU' && mode !== 'GROUP_MGMT_MENU' && mode !== 'ADD_MEMBER_SELECTION', 
    handleButtonPress,
    currentIndex: currentDisplayIndex,
    totalMessages: totalItems,
    mode,
    myToken: MY_ID,
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
    MAX_GROUP_LENGTH, MAX_AI_PROMPT_LENGTH, notificationData 
  };
}