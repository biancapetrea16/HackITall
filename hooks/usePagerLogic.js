import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import pagerMessages from '../app/(tabs)/data'; // Verifică calea către data.js!

export function usePagerLogic() {
  const [messages, setMessages] = useState(pagerMessages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((prev) => !prev), 500);
    return () => clearInterval(interval);
  }, []);

  const handleButtonPress = (label) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSending) return;

    switch (label) {
      case 'UP':
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'DOWN':
        setCurrentIndex((prev) => (prev < messages.length - 1 ? prev + 1 : prev));
        break;
      case 'SEND':
        setIsSending(true);
        setTimeout(() => {
          setIsSending(false);
          const newCode = "SENT OK " + Math.floor(Math.random() * 100); 
          setMessages([...messages, newCode]); 
          setCurrentIndex(messages.length); 
        }, 2000);
        break;
      case 'MODE':
        setCurrentIndex(0);
        break;
      default:
        console.log("Pressed:", label);
    }
  };

  const displayText = isSending ? "SENDING..." : messages[currentIndex];

  return {
    displayText,
    showCursor,
    handleButtonPress,
    currentIndex,
    totalMessages: messages.length,
  };
}