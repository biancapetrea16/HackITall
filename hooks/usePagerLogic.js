import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Contacts from 'expo-contacts';
import pagerMessages from '../app/(tabs)/data'; // Asigură-te că data.js există în app/(tabs)/

// Configurare Notificări
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePagerLogic() {
  const [messages, setMessages] = useState(pagerMessages || ["WELCOME"]);
  const [contacts, setContacts] = useState(["LOADING..."]);
  const [myToken, setMyToken] = useState("");
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [mode, setMode] = useState('READ'); 

  // 1. SETUP: Contacte și Notificări
  useEffect(() => {
    (async () => {
      // Permisiuni Contacte
      const { status: contactStatus } = await Contacts.requestPermissionsAsync();
      if (contactStatus === 'granted') {
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

      // Permisiuni Notificări
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      if (notifStatus === 'granted') {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        console.log("MY TOKEN:", tokenData.data);
        setMyToken(tokenData.data);
      }
    })();

    // Ascultător Notificări
    const subscription = Notifications.addNotificationReceivedListener(notification => {
       const text = notification.request.content.body;
       setMessages(prev => [...prev, text.toUpperCase()]);
       setCurrentIndex(prev => prev + 1);
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    return () => subscription.remove();
  }, []);

  // Cursor effect
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
        // Simulare trimitere (Aici Membru 2 va pune fetch-ul real către server)
        setTimeout(() => {
          setIsSending(false);
          if (mode === 'CONTACTS') {
              const target = contacts[currentIndex];
              setMode('READ');
              setMessages(prev => [...prev, "SENT TO " + target]);
              setCurrentIndex(prev => prev.length); 
          } else {
              setMessages(prev => [...prev, "SENT OK " + Math.floor(Math.random()*100)]);
              setCurrentIndex(prev => prev.length);
          }
        }, 1500);
        break;
        
      default:
        console.log("Pressed:", label);
    }
  };

  // Logică de afișare text
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
    myToken
  };
}