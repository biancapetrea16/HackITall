import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import pagerMessages from '../app/(tabs)/data';

// CONFIGURARE
const MY_ID = "AAA"; 
const SERVER_URL = "https://unrefunded-asteriated-jairo.ngrok-free.dev"; 
const MAX_GROUP_LENGTH = 10;
const MAX_AI_PROMPT_LENGTH = 120;

const MENU_ITEMS = ["CONTACTS", "GROUPS", "CREATE GROUP"];
const MESSAGE_MENU_ITEMS = ["CUSTOM AI PROMPT", "SENT HISTORY"];
const SENT_HISTORY_MESSAGES = ["HELLO!", "RUNNING LATE", "NEED HELP ASAP", "WHERE ARE YOU?"];

export function usePagerLogic() {
  
  const initialMessages = pagerMessages && pagerMessages.length > 0 ? pagerMessages : [];
  const [messages, setMessages] = useState(["WELCOME", ...initialMessages]);
  
  const [contacts, setContacts] = useState(["LOADING..."]);
  const [groups, setGroups] = useState([]);
  const [sentHistory, setSentHistory] = useState(SENT_HISTORY_MESSAGES);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [targetRecipient, setTargetRecipient] = useState(null);
  
  const [notificationData, setNotificationData] = useState(null);

  const [currentTheme, setCurrentTheme] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [menuIndex, setMenuIndex] = useState(0); 
  const [messageMenuIndex, setMessageMenuIndex] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(0); 

  const [showCursor, setShowCursor] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const [mode, setMode] = useState('READ'); 

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
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  // 🎯 FUNCȚIA PRINCIPALĂ DE GESTIONARE A BUTOANELOR
  const handleButtonPress = (label) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSending) return;

    if (notificationData || feedbackMessage) {
        setNotificationData(null); 
        setFeedbackMessage(null);
        if (label !== 'BTN_MENU') return; 
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
        else if (mode === 'SENT_HISTORY_VIEW') {
            setMode('MSG_MENU');
        }
        else if (mode === 'MSG_MENU') {
            setMode(targetRecipient.mode); 
            setTargetRecipient(null);
        }
        else if (mode === 'MENU') {
            setMode('READ'); 
            setCurrentIndex(0);
        } 
        else if (mode === 'READ' && currentIndex !== 0) { 
             setCurrentIndex(0);
        }
        else { 
            setMode('MENU');
            setMenuIndex(0);
        }
        break;

      case 'UP':
        if (mode === 'MENU') setMenuIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'MSG_MENU') setMessageMenuIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'SENT_HISTORY_VIEW') setHistoryIndex(prev => (prev > 0 ? prev - 1 : 0));
        else if (mode === 'READ') setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0));
        else { // CONTACTS / GROUPS
             setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
        break;

      case 'DOWN':
        if (mode === 'READ' && currentIndex === 0) return; 
        if (mode === 'MENU') setMenuIndex(prev => (prev < MENU_ITEMS.length - 1 ? prev + 1 : prev));
        else if (mode === 'MSG_MENU') setMessageMenuIndex(prev => (prev < MESSAGE_MENU_ITEMS.length - 1 ? prev + 1 : prev));
        else if (mode === 'SENT_HISTORY_VIEW') setHistoryIndex(prev => (prev < SENT_HISTORY_MESSAGES.length - 1 ? prev + 1 : prev));
        else { // READ / CONTACTS / GROUPS
            const currentList = mode === 'READ' ? messages : (mode === 'GROUPS' ? groups : contacts);
            let maxIndex = currentList.length - 1;
            setCurrentIndex(prev => (prev < maxIndex ? prev + 1 : maxIndex));
        }
        break;
        
      // 🎯 CAZUL SEND (Butonul OK/SELECT/SEND din dreapta)
      case 'SEND':
        // CAZUL A: SUBMIT GROUP NAME
        if (mode === 'GROUP_TYPING') {
            if (newGroupName.trim().length === 0) { setFeedbackMessage("NAME REQUIRED"); } 
            else {
                setGroups(prev => [...prev, newGroupName.toUpperCase()]);
                setFeedbackMessage(`GROUP ${newGroupName.toUpperCase()} ADDED!`);
                setMode('READ');
                setNewGroupName(''); 
            }
            return;
        }
        
        // CAZUL B: SUBMIT AI PROMPT
        if (mode === 'AI_PROMPT') {
            if (aiPrompt.trim().length === 0) { setFeedbackMessage("PROMPT REQUIRED"); return; }
            
            // Logica AI (Fetch către server cu promptul)
            setFeedbackMessage(`AI PROMPT SENT to ${targetRecipient.name}`);
            setSentHistory(prev => [...prev, aiPrompt.toUpperCase()]); // Adaugă promptul la istoric
            
            // 🚨 Fetch-ul REAL de AI se face AICI:
            fetch(`${SERVER_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    to: targetRecipient.name, 
                    text: aiPrompt,
                    type: 'AI_PROMPT', // Indicăm serverului că e mesaj AI
                    from: MY_ID
                })
            }).catch((e) => console.log("AI Send Error:", e));

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
        
        // CAZUL E: SELECTARE MESAJ DIN ISTORIC -> TRIMITERE FINALĂ
        else if (mode === 'SENT_HISTORY_VIEW') {
            const messageToSend = sentHistory[historyIndex];
            
            // 🚨 Fetch-ul REAL de istoric se face AICI:
            fetch(`${SERVER_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    to: targetRecipient.name, 
                    text: messageToSend,
                    type: 'HISTORY_MSG',
                    from: MY_ID
                })
            }).catch((e) => console.log("History Send Error:", e));

            setFeedbackMessage(`SENT: ${messageToSend.slice(0, 10)}... to ${targetRecipient.name}`);
            setTargetRecipient(null);
            setMode('READ');
            setTimeout(() => setFeedbackMessage(null), 2000); 
        }

        // CAZUL F: SELECTARE CONTACT/GRUP -> DESCHIDE MENIU DE MESAJE (MSG_MENU)
        else if (mode === 'CONTACTS' || mode === 'GROUPS') {
            const target = mode === 'CONTACTS' ? contacts[currentIndex] : groups[currentIndex];
            setTargetRecipient({name: target, mode: mode, index: currentIndex});
            setMode('MSG_MENU');
            setMessageMenuIndex(0); 
        }
        
        // CAZUL G: APĂSARE OK DIN MODUL READ (Nu face nimic)
        else if (mode === 'READ') {
            setFeedbackMessage("PRESS MENU TO START");
            setTimeout(() => setFeedbackMessage(null), 1500); 
        }
        break;
        
      default:
        console.log("Pressed:", label);
    }
  };

  // Logică de Afișare
  let displayText;
  let currentListLength = 0;
  let currentDisplayIndex = 0;

  if (isSending) { displayText = "SENDING..."; } 
  else if (feedbackMessage) { displayText = feedbackMessage; }
  else if (mode === 'GROUP_TYPING') { displayText = 'Type Group Name...'; } 
  else if (mode === 'AI_PROMPT') { displayText = 'Type AI Prompt...'; } 
  else if (mode === 'CONTACTS') { 
      displayText = contacts[currentIndex] || "EMPTY"; 
      currentListLength = contacts.length;
      currentDisplayIndex = currentIndex;
  } else if (mode === 'GROUPS') { 
      displayText = groups[currentIndex] || "NO GROUPS";
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
  } else {
      displayText = messages[currentIndex] || "NO MSGS";
      currentListLength = messages.length;
      currentDisplayIndex = currentIndex;
  }
  
  const totalItems = feedbackMessage || isSending || mode === 'GROUP_TYPING' || mode === 'AI_PROMPT' ? -1 : currentListLength;


  return {
    displayText,
    showCursor: mode !== 'GROUP_TYPING' && mode !== 'AI_PROMPT' && mode !== 'MSG_MENU', 
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
    sentHistory, 
    historyIndex,
    feedbackMessage,
    newGroupName, 
    setNewGroupName,
    aiPrompt,
    setAiPrompt,
    MAX_GROUP_LENGTH,
    MAX_AI_PROMPT_LENGTH,
    notificationData 
  };
}