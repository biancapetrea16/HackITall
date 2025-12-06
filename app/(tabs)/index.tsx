import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { useFonts, VT323_400Regular } from '@expo-google-fonts/vt323';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

// Importăm logica
import { usePagerLogic } from '../../hooks/usePagerLogic'; 

const { width, height } = Dimensions.get('window');

// --- 1. DEFINIREA TEMELOR (Asta lipsea!) ---
const THEMES = {
  DARK: { 
    body: '#222222', bezel: '#111111', screen: '#364736', textGhost: 'rgba(57, 255, 20, 0.1)',
    textReal: '#39ff14', button: '#333333', buttonAction: '#8B0000', arrows: '#444444',
    branding: '#888888', bg: '#050505'
  },
  FUNKY: { 
    body: '#40E0D0', bezel: '#FF1493', screen: '#C3D9C3', textGhost: 'rgba(47, 79, 47, 0.1)',
    textReal: '#2F4F2F', button: '#FF007F', buttonAction: '#00C853', arrows: '#FFD700',
    branding: '#006666', bg: '#222'
  },
  LIGHT: { 
    body: '#E0E0E0', bezel: '#999999', screen: '#F0FFF0', textGhost: 'rgba(0, 0, 0, 0.05)',
    textReal: '#006400', button: '#BBBBBB', buttonAction: '#2E8B57', arrows: '#AAAAAA',
    branding: '#555555', bg: '#FFFFFF'
  }
};

export default function RetroPagerUI() {
  let [fontsLoaded] = useFonts({ VT323_400Regular });

  // 2. Extragem datele + TEMA CURENTĂ din logică
  const { 
    displayText, 
    showCursor, 
    handleButtonPress, 
    currentIndex, 
    totalMessages, 
    mode,
    currentTheme,    // <-- Asta ne trebuie
    setCurrentTheme  // <-- Si asta
  } = usePagerLogic();

  if (!fontsLoaded) return <View style={styles.loading}><Text>Loading...</Text></View>;

  // --- ECRANUL 1: INTRO (Dacă nu e selectată nicio temă) ---
  if (!currentTheme) {
      return (
          <View style={styles.introContainer}>
              <StatusBar hidden={true} />
              <Text style={styles.introTitle}>NEOPAGER OS</Text>
              <Text style={styles.introSubtitle}>SELECT YOUR VIBE</Text>

              <TouchableOpacity onPress={() => setCurrentTheme('DARK')} style={[styles.introBtn, {borderColor: '#39ff14'}]}>
                  <Text style={[styles.introBtnText, {color: '#39ff14'}]}>MATRIX RETRO</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setCurrentTheme('FUNKY')} style={[styles.introBtn, {borderColor: '#FF007F'}]}>
                  <Text style={[styles.introBtnText, {color: '#FF007F'}]}>Y2K POP</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setCurrentTheme('LIGHT')} style={[styles.introBtn, {borderColor: '#fff'}]}>
                  <Text style={[styles.introBtnText, {color: '#fff'}]}>CLEAN OS</Text>
              </TouchableOpacity>
          </View>
      );
  }

  // --- ECRANUL 2: PAGERUL ---
  // Aici definim variabila 'theme' pe care o căuta codul tău
  const theme = THEMES[currentTheme]; 
  const isTransmitting = displayText === 'SENDING...';
  const isContactMode = mode === 'CONTACTS';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar hidden={true} style="light" />

      {/* Buton Back to Themes */}
      <TouchableOpacity onPress={() => setCurrentTheme(null)} style={styles.backBtn}>
          <Text style={{color: theme.branding, fontSize: 10, fontWeight:'bold'}}>CHANGE THEME</Text>
      </TouchableOpacity>

      <View style={[styles.pagerBody, { backgroundColor: theme.body, borderColor: theme.body === '#222222' ? '#333' : theme.bezel }]}>
        
        {/* Top Section */}
        <View style={styles.topSection}>
            <View style={styles.brandingRow}>
              <View>
                <Text style={[styles.brandText, {color: theme.branding}]}>MOTOROLA</Text>
                <Text style={styles.modelText}>ADVISOR {currentTheme}</Text>
              </View>

              {/* Grup Dreapta: AI + LED */}
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  <TouchableOpacity 
                     style={styles.aiButton}
                     onPress={() => alert("AI Magic: Voi scrie mesajul pentru tine!")}
                     activeOpacity={0.6}
                  >
                     <Text style={styles.aiButtonText}>AI ✨</Text>
                  </TouchableOpacity>

                  <View style={[styles.ledLight, { backgroundColor: isTransmitting ? '#ff3333' : '#330000', borderColor: theme.branding }]}>
                     {isTransmitting && <View style={styles.ledGlow} />}
                  </View>
              </View>
            </View>

            {/* Ecran */}
            <View style={[styles.screenBezel, { backgroundColor: theme.bezel }]}>
                {/* Folosim LinearGradient doar daca e tema Dark pt reflexii, altfel culoare plata */}
                <View style={[styles.lcdScreen, { backgroundColor: theme.screen, borderColor: theme.branding }]}>
                    <View style={styles.textContainer}>
                      <Text style={[styles.pixelText, { color: theme.textGhost }]}>8888888888888888888</Text>
                      <Text style={[styles.pixelText, { color: theme.textReal }]}>
                          {isContactMode && <Text style={{fontSize: 30}}>▸ </Text>}
                          {displayText}
                          <Text style={{ opacity: showCursor ? 1 : 0 }}>_</Text>
                      </Text>
                    </View>
                    <View style={[styles.lcdIcons, { borderTopColor: theme.branding }]}>
                      <Text style={[styles.iconText, { color: theme.textReal, opacity: 0.7 }]}>
                        {isContactMode ? 'ADDR BOOK' : `Msg ${currentIndex + 1}/${totalMessages}`}
                      </Text>
                      <Text style={[styles.iconText, { color: isTransmitting ? 'red' : theme.textReal, opacity: 0.7 }]}>
                        {isTransmitting ? 'TX >>>' : 'BAT OK'}
                      </Text>
                    </View>
                </View>
            </View>
        </View>

        <View style={styles.middleDeco}>
            <View style={[styles.decoLines, { backgroundColor: theme.branding }]} />
            <Text style={[styles.instructionText, { color: theme.branding }]}>
               {isContactMode ? '< SELECT DESTINATION >' : 'INCOMING MESSAGES'}
            </Text>
            <View style={[styles.decoLines, { backgroundColor: theme.branding }]} />
        </View>

        {/* Controale */}
        <View style={styles.controlsArea}>
          <TouchableOpacity style={[styles.bigButton, {backgroundColor: theme.button}]} onPress={() => handleButtonPress('MODE')}>
            <View style={styles.buttonInset} /><Text style={styles.btnLabel}>MODE</Text>
          </TouchableOpacity>
          
          <View style={styles.arrowsContainer}>
            <TouchableOpacity style={[styles.arrowBtn, {backgroundColor: theme.arrows}]} onPress={() => handleButtonPress('UP')}>
                <Text style={styles.arrowText}>▲</Text>
            </TouchableOpacity>
            <View style={styles.horizontalArrows}>
              <TouchableOpacity style={[styles.arrowBtn, {backgroundColor: theme.arrows}]} onPress={() => handleButtonPress('LEFT')}>
                <Text style={styles.arrowText}>◀</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.arrowBtn, {backgroundColor: theme.arrows}]} onPress={() => handleButtonPress('RIGHT')}>
                <Text style={styles.arrowText}>▶</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.arrowBtn, {backgroundColor: theme.arrows}]} onPress={() => handleButtonPress('DOWN')}>
                <Text style={styles.arrowText}>▼</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.bigButton, { backgroundColor: isContactMode ? theme.buttonAction : (currentTheme === 'FUNKY' ? '#FF007F' : '#8B0000') }]} 
            onPress={() => handleButtonPress('SEND')}>
            <View style={styles.buttonInset} /><Text style={styles.btnLabel}>{isContactMode ? 'OK' : 'SEND'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.speakerGrill}>
            <View style={[styles.grillLine, {backgroundColor: theme.branding}]} />
            <View style={[styles.grillLine, {backgroundColor: theme.branding}]} />
            <View style={[styles.grillLine, {backgroundColor: theme.branding}]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  
  introContainer: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', width: '100%' },
  introTitle: { fontFamily: 'VT323_400Regular', color: '#fff', fontSize: 50, marginBottom: 10, textShadowColor: '#39ff14', textShadowRadius: 10 },
  introSubtitle: { color: '#888', marginBottom: 40, letterSpacing: 5, fontSize: 12 },
  introBtn: { width: 250, padding: 20, marginBottom: 15, borderRadius: 10, borderWidth: 2, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  introBtnText: { fontFamily: 'VT323_400Regular', fontSize: 30 },

  backBtn: { position: 'absolute', top: 50, padding: 10, zIndex: 10 },

  pagerBody: { width: width * 0.90, height: height * 0.70, borderRadius: 30, padding: 25, justifyContent: 'space-between', borderTopWidth: 3, borderLeftWidth: 3, borderRightWidth: 5, borderBottomWidth: 7, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 20 },
  topSection: {},
  brandingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 5 },
  brandText: { fontWeight: 'bold', fontSize: 14, fontStyle: 'italic' },
  modelText: { color: '#C0A062', fontWeight: 'bold', fontSize: 14 }, 
  
  aiButton: { backgroundColor: '#FFD700', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 20, borderWidth: 2, borderColor: '#DAA520', shadowColor: "yellow", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.6, shadowRadius: 4, elevation: 5 },
  aiButtonText: { color: '#000', fontWeight: 'bold', fontSize: 10 },

  ledLight: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  ledGlow: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },

  screenBezel: { padding: 10, borderRadius: 15, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.2)', borderTopWidth: 2, borderTopColor: 'rgba(255,255,255,0.1)' },
  lcdScreen: { height: 150, borderRadius: 8, padding: 15, justifyContent: 'space-between', borderWidth: 2, overflow: 'hidden', position: 'relative' },
  textContainer: { position: 'relative', height: 80, justifyContent: 'center', marginTop: 5 },
  pixelText: { fontFamily: 'VT323_400Regular', fontSize: 35, letterSpacing: 3, position: 'absolute', left: 0, lineHeight: 40 },
  lcdIcons: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, paddingTop: 5 },
  iconText: { fontFamily: 'VT323_400Regular', fontSize: 18 },
  middleDeco: { alignItems: 'center', justifyContent: 'center', opacity: 0.5, marginTop: 15, marginBottom: 15 },
  instructionText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginVertical: 5 },
  decoLines: { height: 2, width: '80%' },
  controlsArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 5, marginBottom: 10 },
  bigButton: { width: 75, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 5, borderRightWidth: 3, borderColor: 'rgba(0,0,0,0.2)' },
  buttonInset: { width: '80%', height: '40%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, position: 'absolute', top: 3 },
  btnLabel: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginTop: 15, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset:{width:1,height:1}, textShadowRadius:1 },
  arrowsContainer: { alignItems: 'center', justifyContent: 'center', transform: [{scale: 1.1}] },
  horizontalArrows: { flexDirection: 'row', justifyContent: 'space-between', width: 90 },
  arrowBtn: { width: 35, height: 28, margin: 2, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 4, borderRightWidth: 2, borderColor: 'rgba(0,0,0,0.2)' },
  arrowText: { color: '#000', fontSize: 12, fontWeight: 'bold', opacity: 0.6 },
  speakerGrill: { position: 'absolute', bottom: 15, right: 25, width: 35, gap: 4 },
  grillLine: { height: 3, borderRadius: 2 }
});