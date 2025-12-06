import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useFonts, VT323_400Regular } from '@expo-google-fonts/vt323';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- BAZA DE DATE LOCALĂ ---
const INITIAL_MESSAGES = [
  "READY...",
  "LOVE 123",
  "911 URGENT",
  "MEET @ 8",
  "BUY PIZZA",
];

export default function RetroPagerUI() {
  let [fontsLoaded] = useFonts({ VT323_400Regular });
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
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

  if (!fontsLoaded) return <View style={styles.loading}><Text>Loading...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pagerBody}>
        <View style={styles.brandingRow}>
          <Text style={styles.brandText}>hackitall</Text>
          <Text style={styles.modelText}>ADVISOR Gold</Text>
        </View>

        <View style={styles.screenBezel}>
          <LinearGradient colors={['#2b382b', '#364736']} style={styles.lcdScreen}>
            <Text style={styles.pixelText}>
              {displayText}
              <Text style={{ opacity: showCursor ? 1 : 0 }}>_</Text>
            </Text>
            <View style={styles.lcdIcons}>
              <Text style={styles.iconText}>Msg {currentIndex + 1}/{messages.length}</Text>
              <Text style={styles.iconText}>BAT OK</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.controlsArea}>
          <TouchableOpacity style={[styles.bigButton, {backgroundColor: '#333'}]} onPress={() => handleButtonPress('MODE')}>
            <View style={styles.buttonInset} /><Text style={styles.btnLabel}>MODE</Text>
          </TouchableOpacity>
          <View style={styles.arrowsContainer}>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => handleButtonPress('UP')}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
            <View style={styles.horizontalArrows}>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => handleButtonPress('LEFT')}><Text style={styles.arrowText}>◀</Text></TouchableOpacity>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => handleButtonPress('RIGHT')}><Text style={styles.arrowText}>▶</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => handleButtonPress('DOWN')}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.bigButton, {backgroundColor: '#8B0000'}]} onPress={() => handleButtonPress('SEND')}>
            <View style={styles.buttonInset} /><Text style={styles.btnLabel}>SEND</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.speakerGrill}><View style={styles.grillLine} /><View style={styles.grillLine} /><View style={styles.grillLine} /></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  pagerBody: { width: width * 0.9, height: width * 0.7, backgroundColor: '#222', borderRadius: 20, padding: 15, borderWidth: 4, borderColor: '#444', borderBottomColor: '#111', borderRightColor: '#111', shadowColor: "#000", shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 20, justifyContent: 'space-between' },
  brandingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, paddingHorizontal: 5 },
  brandText: { color: '#888', fontWeight: 'bold', fontSize: 12, fontStyle: 'italic' },
  modelText: { color: '#C0A062', fontWeight: 'bold', fontSize: 12 },
  screenBezel: { backgroundColor: '#111', padding: 8, borderRadius: 8, borderBottomWidth: 1, borderBottomColor: '#555' },
  lcdScreen: { height: 80, backgroundColor: '#364736', borderRadius: 4, padding: 10, justifyContent: 'space-between', borderWidth: 2, borderColor: '#202020' },
  pixelText: { fontFamily: 'VT323_400Regular', fontSize: 32, color: '#39ff14', textShadowColor: 'rgba(57, 255, 20, 0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10, letterSpacing: 2 },
  lcdIcons: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(57, 255, 20, 0.3)', paddingTop: 2 },
  iconText: { fontFamily: 'VT323_400Regular', fontSize: 14, color: 'rgba(57, 255, 20, 0.6)' },
  controlsArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingHorizontal: 5 },
  bigButton: { width: 60, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 4, borderRightWidth: 2, borderColor: 'rgba(0,0,0,0.5)' },
  buttonInset: { width: '80%', height: '40%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, position: 'absolute', top: 2 },
  btnLabel: { color: '#ddd', fontSize: 10, fontWeight: 'bold', marginTop: 15 },
  arrowsContainer: { alignItems: 'center', justifyContent: 'center' },
  horizontalArrows: { flexDirection: 'row', justifyContent: 'space-between', width: 90 },
  arrowBtn: { width: 35, height: 25, backgroundColor: '#444', margin: 2, borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 3, borderRightWidth: 1, borderColor: '#111' },
  arrowText: { color: '#aaa', fontSize: 10 },
  speakerGrill: { position: 'absolute', bottom: 10, right: 15, width: 30, gap: 3 },
  grillLine: { height: 2, backgroundColor: '#111', borderRadius: 1 }
});