import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import * as Contacts from 'expo-contacts'; // 1. IMPORTĂM CONTACTE
import pagerMessages from '../app/(tabs)/data'; 

export function usePagerLogic() {
  const [messages, setMessages] = useState(pagerMessages);
  // Pornim cu o listă goală sau cu un mesaj de așteptare
  const [contacts, setContacts] = useState(["LOADING..."]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [mode, setMode] = useState('READ'); 

  // --- NOU: ÎNCĂRCAREA CONTACTELOR REALE ---
  useEffect(() => {
    (async () => {
      // A. Cerem Permisiune
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        // B. Dacă ne lasă, tragem contactele
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name], // Ne interesează doar numele
        });

        if (data.length > 0) {
          // C. Le formatăm pentru Pager (Doar nume, Majuscule, max 20 caractere)
          const formattedContacts = data
            .map(c => c.name ? c.name.toUpperCase().slice(0, 15) : "UNKNOWN")
            .filter(name => name !== "UNKNOWN"); // Eliminăm contacte fără nume
          
          setContacts(formattedContacts);
        } else {
          setContacts(["NO CONTACTS"]);
        }
      } else {
        setContacts(["NO PERMISSION"]);
      }
    })();
  }, []);

  // --- RESTUL LOGICII RĂMÂNE LA FEL ---
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((prev) => !prev), 500);
    return () => clearInterval(interval);
  }, []);

  const handleButtonPress = (label) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSending) return;

    switch (label) {
      case 'MODE':
        setMode((prevMode) => prevMode === 'READ' ? 'CONTACTS' : 'READ');
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
        setTimeout(() => {
          setIsSending(false);
          
          if (mode === 'CONTACTS') {
              setMode('READ');
              // Aici luăm numele contactului real
              setMessages([...messages, "SENT TO " + contacts[currentIndex]]);
              setCurrentIndex(messages.length); 
          } else {
              const newCode = "SENT OK " + Math.floor(Math.random() * 100); 
              setMessages([...messages, newCode]); 
              setCurrentIndex(messages.length); 
          }
        }, 2000);
        break;
        
      default:
        console.log("Pressed:", label);
    }
  };

  let displayText;
  if (isSending) {
    displayText = "SENDING...";
  } else if (mode === 'CONTACTS') {
    displayText = contacts[currentIndex]; 
  } else {
    displayText = messages[currentIndex];
  }

  const totalItems = mode === 'READ' ? messages.length : contacts.length;

  return {
    displayText,
    showCursor,
    handleButtonPress,
    currentIndex,
    totalMessages: totalItems,
    mode
  };
}