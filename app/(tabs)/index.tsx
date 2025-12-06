import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { useFonts, VT323_400Regular } from '@expo-google-fonts/vt323';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import { usePagerLogic } from '../../hooks/usePagerLogic'; 

const { width, height } = Dimensions.get('window');

export default function RetroPagerUI() {
  let [fontsLoaded] = useFonts({ VT323_400Regular });

  // 👇 AICI E MAGIA: Tu doar ceri datele, nu le calculezi
  const { 
    displayText, 
    showCursor, 
    handleButtonPress, 
    currentIndex, 
    totalMessages 
  } = usePagerLogic();

  if (!fontsLoaded) return <View style={styles.loading}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} style="light" />

      {/* CARCASA PAGERULUI */}
      <View style={styles.pagerBody}>
        
        {/* Partea de sus (Branding) */}
        <View style={styles.topSection}>
            <View style={styles.brandingRow}>
              <Text style={styles.brandText}>MOTOROLA</Text>
              <Text style={styles.modelText}>ADVISOR Gold</Text>
            </View>

            {/* --- ECRANUL LCD RETRO --- */}
            <View style={styles.screenBezel}>
            <LinearGradient 
                colors={['#2b382b', '#364736', '#2b382b']} 
                style={styles.lcdScreen}
            >
                <View style={styles.textContainer}>
                  {/* Ghost Text */}
                  <Text style={[styles.pixelText, styles.ghostText]}>
                      88888888888888
                  </Text>
                  
                  {/* Real Text */}
                  <Text style={[styles.pixelText, styles.realText]}>
                      {displayText}
                      <Text style={{ opacity: showCursor ? 1 : 0 }}>_</Text>
                  </Text>
                </View>

                {/* Icons */}
                <View style={styles.lcdIcons}>
                  <Text style={styles.iconText}>Msg {currentIndex + 1}/{totalMessages}</Text>
                  <Text style={styles.iconText}>BAT OK</Text>
                </View>

                {/* Scanlines */}
                <View style={styles.scanline} />
            </LinearGradient>
            </View>
        </View>


        {/* Zona de Mijloc */}
        <View style={styles.middleDeco}>
            <View style={styles.decoLines} />
            <Text style={styles.instructionText}></Text>
            <View style={styles.decoLines} />
        </View>

        {/* Controalele */}
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
    </View>
  );
}

// --- STILURILE TALE (NU LE-AM MODIFICAT) ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#050505', 
    alignItems: 'center',       
    justifyContent: 'center',   
  },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  pagerBody: { 
    width: width * 0.90, 
    height: height * 0.65, 
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
  brandingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 5 },
  brandText: { color: '#666', fontWeight: 'bold', fontSize: 14, fontStyle: 'italic', textShadowColor: '#000', textShadowOffset:{width:1,height:1}, textShadowRadius:1 },
  modelText: { color: '#C0A062', fontWeight: 'bold', fontSize: 14, textShadowColor: '#000', textShadowOffset:{width:1,height:1}, textShadowRadius:1 },
  screenBezel: { 
    backgroundColor: '#151515', 
    padding: 12, 
    borderRadius: 12, 
    borderBottomWidth: 3, 
    borderBottomColor: '#333',
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  lcdScreen: { 
    height: 130, 
    backgroundColor: '#364736', 
    borderRadius: 4, 
    padding: 15, 
    justifyContent: 'space-between', 
    borderWidth: 3,           
    borderColor: '#1a241a',   
    overflow: 'hidden',       
    position: 'relative'
  },
  textContainer: { position: 'relative', height: 60, justifyContent: 'center', marginTop: 5 },
  pixelText: { fontFamily: 'VT323_400Regular', fontSize: 45, letterSpacing: 4, position: 'absolute', left: 0 },
  ghostText: { color: 'rgba(43, 56, 43, 0.35)', zIndex: 1 },
  realText: { color: '#39ff14', zIndex: 2, textShadowColor: 'rgba(57, 255, 20, 0.9)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  lcdIcons: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(57, 255, 20, 0.3)', paddingTop: 5 },
  iconText: { fontFamily: 'VT323_400Regular', fontSize: 18, color: 'rgba(57, 255, 20, 0.6)' },
  scanline: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', zIndex: 3, borderWidth: 0, opacity: 0.1, backgroundColor: '#000' },
  middleDeco: {
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.3,
      marginTop: 20,
      marginBottom: 20,
  },
  instructionText: {
      color: '#888',
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 2,
      marginVertical: 5,
  },
  decoLines: {
      height: 2,
      width: '80%',
      backgroundColor: '#444',
  },
  controlsArea: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 5,
    marginBottom: 10, 
  },
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