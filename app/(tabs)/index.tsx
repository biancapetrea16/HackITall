import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { useFonts, VT323_400Regular } from '@expo-google-fonts/vt323';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import { usePagerLogic } from '../../hooks/usePagerLogic'; 

const { width, height } = Dimensions.get('window');

export default function RetroPagerUI() {
  let [fontsLoaded] = useFonts({ VT323_400Regular });

  const { 
    displayText, 
    showCursor, 
    handleButtonPress, 
    currentIndex, 
    totalMessages,
    mode 
  } = usePagerLogic();

  if (!fontsLoaded) return <View style={styles.loading}><Text>Loading...</Text></View>;

  // Verificări pentru UI dinamic
  const isTransmitting = displayText === 'SENDING...';
  const isContactMode = mode === 'CONTACTS'; // Verificăm dacă suntem în Agendă

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} style="light" />

      <View style={styles.pagerBody}>
        
        {/* Partea de Sus */}
        <View style={styles.topSection}>
            <View style={styles.brandingRow}>
              <View>
                <Text style={styles.brandText}>MOTOROLA</Text>
                <Text style={styles.modelText}>ADVISOR Gold</Text>
              </View>

              {/* LED-ul */}
              <View style={[
                  styles.ledLight, 
                  { 
                    backgroundColor: isTransmitting ? '#ff3333' : '#330000',
                    shadowOpacity: isTransmitting ? 0.8 : 0,
                  }
              ]}>
                 {isTransmitting && <View style={styles.ledGlow} />}
              </View>
            </View>

            {/* Ecranul LCD (Acum mai Mare) */}
            <View style={styles.screenBezel}>
            <LinearGradient 
                colors={['#2b382b', '#364736', '#2b382b']} 
                style={styles.lcdScreen}
            >
                <View style={styles.textContainer}>
                  {/* Ghost Text */}
                  <Text style={[styles.pixelText, styles.ghostText]}>
                      8888888888888888888
                  </Text>
                  
                  {/* Real Text (Acum mai Mic) */}
                  <Text style={[styles.pixelText, styles.realText]}>
                      {isContactMode && <Text style={{fontSize: 30}}>▸ </Text>}
                      {displayText}
                      <Text style={{ opacity: showCursor ? 1 : 0 }}>_</Text>
                  </Text>
                </View>

                <View style={styles.lcdIcons}>
                  <Text style={styles.iconText}>
                    {isContactMode ? 'ADDR BOOK' : `Msg ${currentIndex + 1}/${totalMessages}`}
                  </Text>
                  <Text style={styles.iconText}>BAT OK</Text>
                </View>

                <View style={styles.scanline} />
            </LinearGradient>
            </View>
        </View>

        {/* Instrucțiuni */}
        <View style={styles.middleDeco}>
            <View style={styles.decoLines} />
            <Text style={styles.instructionText}>
               {isContactMode ? '< SELECT DESTINATION >' : 'INCOMING MESSAGES'}
            </Text>
            <View style={styles.decoLines} />
        </View>

        {/* Controalele */}
        <View style={styles.controlsArea}>
          <TouchableOpacity 
            style={[styles.bigButton, {backgroundColor: '#333'}]} 
            onPress={() => handleButtonPress('MODE')}
            activeOpacity={0.6}
          >
            <View style={styles.buttonInset} /><Text style={styles.btnLabel}>MODE</Text>
          </TouchableOpacity>
          
          <View style={styles.arrowsContainer}>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => handleButtonPress('UP')} activeOpacity={0.6}>
                <Text style={styles.arrowText}>▲</Text>
            </TouchableOpacity>
            <View style={styles.horizontalArrows}>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => handleButtonPress('LEFT')} activeOpacity={0.6}>
                <Text style={styles.arrowText}>◀</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => handleButtonPress('RIGHT')} activeOpacity={0.6}>
                <Text style={styles.arrowText}>▶</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => handleButtonPress('DOWN')} activeOpacity={0.6}>
                <Text style={styles.arrowText}>▼</Text>
            </TouchableOpacity>
          </View>
          
          {/* --- BUTONUL DINAMIC (OK vs SEND) --- */}
          <TouchableOpacity 
            style={[
                styles.bigButton, 
                // Dacă e Contact -> Verde (#006400), Altfel -> Roșu (#8B0000)
                { backgroundColor: isContactMode ? '#005500' : '#8B0000' }
            ]} 
            onPress={() => handleButtonPress('SEND')}
            activeOpacity={0.6}
          >
            <View style={styles.buttonInset} />
            {/* Schimbăm Textul */}
            <Text style={styles.btnLabel}>
                {isContactMode ? 'OK' : 'SEND'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.speakerGrill}><View style={styles.grillLine} /><View style={styles.grillLine} /><View style={styles.grillLine} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  
  pagerBody: { 
    width: width * 0.90, 
    height: height * 0.70, // Am mărit puțin corpul să aibă loc ecranul
    backgroundColor: '#222', 
    borderRadius: 25,    
    padding: 25, 
    justifyContent: 'space-between', 
    borderTopWidth: 2, borderTopColor: '#555', 
    borderLeftWidth: 2, borderLeftColor: '#555',
    borderRightWidth: 6, borderRightColor: '#111', 
    borderBottomWidth: 8, borderBottomColor: '#111', 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.7,
    shadowRadius: 25,
    elevation: 30,
  },
  
  topSection: {},
  
  brandingRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 10, // Mai puțin spațiu aici
      paddingHorizontal: 5 
  },
  brandText: { color: '#666', fontWeight: 'bold', fontSize: 14, fontStyle: 'italic', textShadowColor: '#000', textShadowOffset:{width:1,height:1}, textShadowRadius:1 },
  modelText: { color: '#C0A062', fontWeight: 'bold', fontSize: 14, textShadowColor: '#000', textShadowOffset:{width:1,height:1}, textShadowRadius:1 },

  ledLight: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#000', backgroundColor: '#330000', justifyContent: 'center', alignItems: 'center', shadowColor: "#ff0000", shadowOffset: { width: 0, height: 0 }, shadowRadius: 8 },
  ledGlow: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },

  screenBezel: { 
    backgroundColor: '#151515', 
    padding: 12, 
    borderRadius: 12, 
    borderBottomWidth: 3, 
    borderBottomColor: '#333',
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  
  // --- ECRAN MAI MARE ---
  lcdScreen: { 
    height: 150, // Crescut de la 130
    backgroundColor: '#364736', 
    borderRadius: 4, 
    padding: 15, 
    justifyContent: 'space-between', 
    borderWidth: 3,           
    borderColor: '#1a241a',   
    overflow: 'hidden',       
    position: 'relative'
  },
  
  textContainer: { position: 'relative', height: 80, justifyContent: 'center', marginTop: 5 },
  
  // --- SCRIS MAI MIC ---
  pixelText: { 
      fontFamily: 'VT323_400Regular', 
      fontSize: 35, // Scăzut de la 45 pentru aspect mai "Sharp"
      letterSpacing: 3, 
      position: 'absolute', 
      left: 0,
      lineHeight: 40 
  },
  
  ghostText: { color: 'rgba(43, 56, 43, 0.35)', zIndex: 1 },
  realText: { color: '#39ff14', zIndex: 2, textShadowColor: 'rgba(57, 255, 20, 0.9)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  
  lcdIcons: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(57, 255, 20, 0.3)', paddingTop: 5 },
  iconText: { fontFamily: 'VT323_400Regular', fontSize: 18, color: 'rgba(57, 255, 20, 0.6)' },
  scanline: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', zIndex: 3, borderWidth: 0, opacity: 0.1, backgroundColor: '#000' },
  
  middleDeco: { alignItems: 'center', justifyContent: 'center', opacity: 0.3, marginTop: 15, marginBottom: 15 },
  instructionText: { color: '#888', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginVertical: 5 },
  decoLines: { height: 2, width: '80%', backgroundColor: '#444' },
  
  controlsArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 5, marginBottom: 10 },
  bigButton: { width: 75, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 5, borderRightWidth: 3, borderColor: 'rgba(0,0,0,0.5)', backgroundColor: '#333' },
  buttonInset: { width: '80%', height: '40%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, position: 'absolute', top: 2 },
  btnLabel: { color: '#888', fontSize: 11, fontWeight: 'bold', marginTop: 15 },
  
  arrowsContainer: { alignItems: 'center', justifyContent: 'center', transform: [{scale: 1.1}] },
  horizontalArrows: { flexDirection: 'row', justifyContent: 'space-between', width: 90 },
  arrowBtn: { width: 35, height: 28, backgroundColor: '#3a3a3a', margin: 2, borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 3, borderRightWidth: 1, borderColor: '#111' },
  arrowText: { color: '#aaa', fontSize: 10 },
  
  speakerGrill: { position: 'absolute', bottom: 15, right: 25, width: 35, gap: 4 },
  grillLine: { height: 3, backgroundColor: '#111', borderRadius: 2 }
});