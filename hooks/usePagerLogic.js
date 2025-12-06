import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import * as Contacts from 'expo-contacts';
import pagerMessages from '../app/(tabs)/data'; 

// ⚠️ SCHIMBĂ AICI CU NUMELE TĂU (BIANCA sau ALEX)
const MY_ID = "BIANCA"; 

// ⚠️ SCHIMBĂ AICI CU LINK-UL DE NGROK (Fără slash la final)
const SERVER_URL = "https://LINKUL-TAU-DE-LA-MEMBRU-3.ngrok-free.app"; 

export function usePagerLogic() {
  const [messages, setMessages] = useState(pagerMessages || ["WELCOME"]);
  const [contacts, setContacts] = useState(["LOADING..."]);
  
  // 1. AICI ERA LIPSA: State-ul pentru Temă!
  const [currentTheme, setCurrentTheme] = useState(null); 
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [mode, setMode] = useState('READ'); 

  // 2. SETUP CONTACTS
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Name] });
        if (data.length > 0) {
           const cleanContacts = data
             .map(c => c.name ? c.name.toUpperCase().slice(0, 15) : "")
             .filter(Boolean);
           setContacts(cleanContacts);
        } else {
           setContacts(["NO CONTACTS"]);
        }
      }
    })();
  }, []);

  // 3. POLLING (Mesaje de la server)
  useEffect(() => {
    const checkInbox = async () => {
        if (!SERVER_URL.includes("ngrok")) return; // Nu face request dacă nu e setat linkul
        try {
            const response = await fetch(`${SERVER_URL}/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ me: MY_ID })
            });
            const data = await response.json();

            if (data.has_messages) {
                data.messages.forEach(msg => {
                    setMessages(prev => [...prev, msg]);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                });
                setCurrentIndex(prev => prev + 1);
            }
        } catch (e) {
            // Silent error
        }
    };

    const intervalId = setInterval(checkInbox, 3000); 
    return () => clearInterval(intervalId);
  }, []);

  // 4. Cursor Effect
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((prev) => !prev), 500);
    return () => clearInterval(interval);
  }, []);

  const handleButtonPress = (label) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSending) return;

    switch (label) {
      case 'MODE':
        setMode((prev) => prev === 'READ' ? 'CONTACTS' : 'READ');
        setCurrentIndex(0);
        break;
      case 'UP':
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'DOWN':
        const currentList = mode === 'READ' ? messages : contacts;
        setCurrentIndex((prev) => (prev < currentList.length - 1 ? prev + 1 : prev));
        break;
      case 'SEND':
        setIsSending(true);
        
        if (mode === 'CONTACTS') {
            const target = contacts[currentIndex];
            
            // Trimitem la server
            fetch(`${SERVER_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: target,
                    text: "PAGER MSG FROM " + MY_ID 
                })
            })
            .then(res => res.json())
            .then(() => {
                setIsSending(false);
                setMode('READ');
                setMessages(prev => [...prev, "SENT TO " + target]);
                setCurrentIndex(prev => prev.length); 
            })
            .catch(() => {
                setIsSending(false);
                setMode('READ');
                setMessages(prev => [...prev, "ERROR SENDING"]); // Fallback dacă nu merge serverul
            });

        } else {
            // Fake send (dacă nu ești în contacte)
            setTimeout(() => {
                setIsSending(false);
                setMessages(prev => [...prev, "SENT OK"]);
                setCurrentIndex(prev => prev.length);
            }, 1000);
        }
        break;
      default:
        console.log("Pressed:", label);
    }
  };

  let displayText;
  if (isSending) displayText = "SENDING...";
  else if (mode === 'CONTACTS') displayText = contacts[currentIndex] || "NO CONTACTS";
  else displayText = messages[currentIndex] || "NO MSGS";

  return {
    displayText,
    showCursor,
    handleButtonPress,
    currentIndex,
    totalMessages: mode === 'READ' ? messages.length : contacts.length,
    mode,
    myToken: MY_ID,
    
    // 👇 AICI TREBUIAU EXPORTATE!
    currentTheme,
    setCurrentTheme
  };
}