import { useFonts, VT323_400Regular } from '@expo-google-fonts/vt323';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { usePagerLogic } from '../../hooks/usePagerLogic';

const { width, height } = Dimensions.get('window');

// --- HOOK PENTRU PÂLPÂIT NEON ---
function useNeonFlicker() {
  const [opacity, setOpacity] = useState(1);
  useEffect(() => {
    const flicker = () => {
      const states = [1, 0.8, 0.6, 1, 0.9, 0.3, 1, 0.8, 1];
      const randomState = states[Math.floor(Math.random() * states.length)];
      setOpacity(randomState);
      setTimeout(flicker, Math.random() * 400 + 50);
    };
    flicker();
    return () => {}; 
  }, []);
  return opacity;
}

// --- CONFIGURAREA CELOR 4 TEME ---
const THEMES = {
  CLASSIC: { 
    body: '#111', bodyBorder: '#333', bezel: '#000', screen: '#0f1f0f', 
    textGhost: 'rgba(57, 255, 20, 0.15)', textReal: '#39ff14', 
    button: '#222', buttonBorder: '#444', buttonAction: '#005500',
    arrows: '#333', branding: '#666',
    bgColors: ['#001a00', '#000000'], neonColor: '#39ff14', titleColor: '#39ff14'
  },
  DARK: { 
    body: '#0a0a0a', bodyBorder: '#00FFFF', bezel: '#1a0526', screen: '#150021',
    textGhost: 'rgba(0, 255, 255, 0.2)', textReal: '#00FFFF',
    button: '#1F1F1F', buttonBorder: '#FF00FF', buttonAction: '#FF00FF',
    arrows: '#2D2D2D', branding: '#E0B0FF',
    bgColors: ['#12001F', '#000000'], neonColor: '#00FFFF', titleColor: '#E0B0FF'
  },
  FUNKY: { 
    body: '#40E0D0', bodyBorder: '#008B8B', bezel: '#FF1493', screen: '#C3D9C3',
    textGhost: 'rgba(47, 79, 47, 0.1)', textReal: '#2F4F2F',
    button: '#FF007F', buttonBorder: 'rgba(0,0,0,0.1)', buttonAction: '#00C853',
    arrows: '#FFD700', branding: '#006666',
    bgColors: ['#FF69B4', '#8A2BE2'], neonColor: '#FFD700', titleColor: '#00FFFF'
  },
  LIGHT: { 
    body: '#FFFFFF', bodyBorder: '#000000', bezel: '#DDDDDD', screen: '#F0F0F0', 
    textGhost: 'rgba(0,0,0,0.05)', textReal: '#000000', 
    button: '#FFFFFF', buttonBorder: '#000', buttonAction: '#000', 
    arrows: '#FFFFFF', branding: '#000000',
    bgColors: ['#E0E0E0', '#FFFFFF'], neonColor: '#000000', titleColor: '#555555'
  }
};

export default function RetroPagerUI() {
  let [fontsLoaded] = useFonts({ VT323_400Regular });

  const { 
    displayText, showCursor, handleButtonPress, currentIndex, totalMessages, mode,
    currentTheme, setCurrentTheme, menuItems, menuIndex, feedbackMessage,
    newGroupName, setNewGroupName, MAX_GROUP_LENGTH,
    messageMenuIndex, messageMenuItems, sentHistory, historyIndex,
    aiPrompt, setAiPrompt, MAX_AI_PROMPT_LENGTH,
    notificationData,
    groupMgmtOptions, groupMgmtIndex,
    contactsForSelection, addMemberIndex,
  } = usePagerLogic();

  const flickerOpacity = useNeonFlicker();
  const [blink, setBlink] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 800);
    return () => clearInterval(interval);
  }, []);

  if (!fontsLoaded) return <View style={styles.loading}><Text>Loading...</Text></View>;

  // --- ECRAN INTRO (Dacă currentTheme nu e setat, arătăm meniul de teme) ---
  if (!currentTheme) {
      return (
          <View style={styles.mainContainer}>
              <StatusBar hidden={true} />
              <LinearGradient colors={['#09000F', '#1A0024', '#000']} style={StyleSheet.absoluteFill} />
              <View style={[styles.bgFlickerLines, { opacity: flickerOpacity }]} pointerEvents="none">
                {[...Array(12)].map((_, i) => (
                    <View key={i} style={[styles.neonLine, { top: i * 70 + 20, backgroundColor: 'rgba(189, 0, 255, 0.4)', shadowColor: '#bd00ff' }]} />
                ))}
              </View>

              <View style={styles.introContent}>
                  <Text style={[styles.introTitle, { opacity: blink ? 1 : 0.8, textShadowColor: '#bd00ff' }]}>
                      NEOPAGER_OS
                  </Text>
                  <Text style={[styles.introSubtitle, {color: '#E0B0FF'}]}>
                      SELECT INTERFACE PROTOCOL:_
                  </Text>

                  <View style={styles.introButtonList}>
                      <TouchableOpacity onPress={() => setCurrentTheme('CLASSIC')} style={[styles.terminalBtn, {borderColor: '#39ff14'}]}>
                          <Text style={[styles.terminalBtnText, {color: '#39ff14'}]}>[1] CLASSIC</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setCurrentTheme('DARK')} style={[styles.terminalBtn, {borderColor: '#00FFFF'}]}>
                          <Text style={[styles.terminalBtnText, {color: '#00FFFF'}]}>[2] DARK</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setCurrentTheme('FUNKY')} style={[styles.terminalBtn, {borderColor: '#FF007F'}]}>
                          <Text style={[styles.terminalBtnText, {color: '#FF007F'}]}>[3] FUNKY</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setCurrentTheme('LIGHT')} style={[styles.terminalBtn, {borderColor: '#FFF', backgroundColor: '#333'}]}>
                          <Text style={[styles.terminalBtnText, {color: '#FFF'}]}>[4] LIGHT</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      );
  }

  // --- ECRAN PAGER (Dacă currentTheme este setat) ---
  
  const theme = THEMES[currentTheme]; 
  
  // 🚨 CLAUZĂ DE SIGURANȚĂ (GUARD CLAUSE) FIX (Eroarea de la linia 133)
  if (!theme) {
      // Dacă se întâmplă o eroare de reload (currentTheme e corupt), revenim la intro.
      setCurrentTheme(null);
      return <View style={styles.loading}><Text style={{color: 'red'}}>ERROR: Resetting Theme...</Text></View>;
  }

  const isTransmitting = displayText === 'SENDING...';
  const isMenuMode = mode === 'MENU';
  const isMessageMenuMode = mode === 'MSG_MENU';
  const isHistoryMode = mode === 'SENT_HISTORY_VIEW';
  const isGroupMgmtMode = mode === 'GROUP_MGMT_MENU';
  const isAddMemberMode = mode === 'ADD_MEMBER_SELECTION';
  const isTypingMode = mode === 'GROUP_TYPING' || mode === 'AI_PROMPT';
  const isSelectionMode = mode === 'CONTACTS' || mode === 'GROUPS';
  const isFeedbackMode = totalMessages === -1; 

  // LOGICĂ AFIȘARE MENIU/LISTĂ
  let currentList = [];
  let currentSelectionIndex = 0;
  let headerText = '';

  if (isMenuMode) {
      currentList = menuItems;
      currentSelectionIndex = menuIndex;
      headerText = 'MAIN MENU';
  } else if (isMessageMenuMode) {
      currentList = messageMenuItems;
      currentSelectionIndex = messageMenuIndex;
      headerText = 'MSG SELECT';
  } else if (isGroupMgmtMode) {
      currentList = groupMgmtOptions;
      currentSelectionIndex = groupMgmtIndex;
      headerText = 'GROUP MGMT';
  } else if (isHistoryMode) {
      currentList = sentHistory;
      currentSelectionIndex = historyIndex;
      headerText = 'SENT HISTORY';
  } else if (isAddMemberMode) {
      currentList = contactsForSelection;
      currentSelectionIndex = addMemberIndex;
      headerText = 'ADD MEMBER';
  }


  // LOGICĂ INPUT
  const currentInput = mode === 'GROUP_TYPING' ? newGroupName : aiPrompt;
  const setInputFunction = mode === 'GROUP_TYPING' ? setNewGroupName : setAiPrompt;
  const maxInputLength = mode === 'GROUP_TYPING' ? MAX_GROUP_LENGTH : MAX_AI_PROMPT_LENGTH;

  return (
    <View style={styles.mainContainer}>
      <StatusBar hidden={true} style="light" />

      {/* FUNDAL */}
      <LinearGradient colors={theme.bgColors} style={StyleSheet.absoluteFill} />
      
      <View style={[styles.bgFlickerLines, { opacity: flickerOpacity }]} pointerEvents="none">
        {[...Array(12)].map((_, i) => (
            <View key={i} style={[styles.neonLine, { top: i * 70 + 20, backgroundColor: theme.neonColor, opacity: 0.2, shadowColor: theme.neonColor }]} />
        ))}
      </View>

      <Text style={[styles.bgMainTitle, { color: theme.titleColor, textShadowColor: theme.neonColor, opacity: flickerOpacity }]}>
          NEOPAGER
      </Text>

      <TouchableOpacity onPress={() => setCurrentTheme(null)} style={styles.backBtn}>
          <Text style={{color: theme.branding, fontSize: 10, fontWeight:'bold', backgroundColor: currentTheme==='LIGHT'?'#fff':'transparent'}}> REBOOT SYSTEM </Text>
      </TouchableOpacity>

      <View style={[styles.pagerBody, { 
          backgroundColor: theme.body, borderColor: theme.bodyBorder, shadowOpacity: currentTheme === 'LIGHT' ? 0.2 : 0.6,
          borderWidth: currentTheme === 'LIGHT' ? 4 : 2, shadowColor: theme.neonColor
      }]}>
        
        {/* --- POP-UP NOTIFICARE --- */}
        {notificationData && (
             <View style={[styles.notificationPopup, {borderColor: theme.neonColor, backgroundColor: theme.body}]}>
                 <Text style={[styles.notificationTitle, {color: theme.neonColor}]}>*** NEW MESSAGE ***</Text>
                 <Text style={[styles.notificationText, {color: theme.branding}]}>FROM: {notificationData.sender}</Text>
                 <Text style={[styles.notificationText, {color: theme.textReal, marginTop: 5}]}>{notificationData.text.slice(0, 20)}...</Text>
             </View>
        )}
        
        <View style={styles.topSection}>
            <View style={styles.brandingRow}>
              <View>
                <Text style={[styles.brandText, {color: theme.branding}]}>MOTOROLA</Text>
                <Text style={styles.modelText}>ADVISOR {currentTheme}</Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  <TouchableOpacity style={[styles.aiButton, {borderColor: theme.branding, backgroundColor: currentTheme==='LIGHT'?'#000':'#FFD700'}]} onPress={() => alert("AI Magic!")} activeOpacity={0.6}>
                     <Text style={[styles.aiButtonText, {color: currentTheme==='LIGHT'?'#fff':'#000'}]}>AI ✨</Text>
                  </TouchableOpacity>
                  <View style={[styles.ledLight, { backgroundColor: isTransmitting ? '#ff3333' : '#330000', borderColor: theme.branding }]}>
                     {isTransmitting && <View style={styles.ledGlow} />}
                  </View>
              </View>
            </View>

            <View style={[styles.screenBezel, { backgroundColor: theme.bezel, borderWidth: currentTheme==='LIGHT'?2:0, borderColor:'#000' }]}>
                <View style={[styles.lcdScreen, { backgroundColor: theme.screen, borderColor: theme.branding }]}>
                    
                    <View style={styles.textContainer}>
                      {isTypingMode ? (
                        // MODUL DE TASTARE INPUT NATIV
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={[styles.pixelText, {color: theme.textReal, fontSize: 18, lineHeight: 20, position: 'relative', top: -30}]}>
                                {mode === 'GROUP_TYPING' ? `ENTER GROUP NAME (MAX ${MAX_GROUP_LENGTH}):` : `ENTER AI PROMPT (MAX ${MAX_AI_PROMPT_LENGTH}):`}
                            </Text>
                            <TextInput 
                                autoFocus={true}
                                value={currentInput}
                                onChangeText={setInputFunction}
                                maxLength={maxInputLength}
                                style={[ styles.inputField, { borderColor: theme.textReal, color: theme.textReal, backgroundColor: theme.screen } ]}
                                selectionColor={theme.textReal}
                                keyboardAppearance={currentTheme === 'DARK' ? 'dark' : 'light'}
                                placeholderTextColor={theme.textGhost}
                                placeholder={mode === 'GROUP_TYPING' ? "e.g. ALPHA_TEAM" : "e.g. write message for running late"}
                            />
                             <Text style={[styles.pixelText, {color: theme.textReal, fontSize: 16, position: 'relative', top: 30}]}>
                                {maxInputLength - currentInput.length} chars left
                            </Text>
                        </View>
                      ) : isMenuMode || isMessageMenuMode || isHistoryMode || isGroupMgmtMode || isAddMemberMode ? (
                          // MODUL DE MENIU LISTĂ SAU ISTORIC SAU ADĂUGARE MEMBRU
                          <View style={{flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', height: '100%', paddingLeft: 10}}>
                              {currentList.map((item, idx) => (
                                  <Text key={idx} style={{ 
                                      fontFamily: 'VT323_400Regular', 
                                      fontSize: isHistoryMode ? 18 : 22, 
                                      lineHeight: isHistoryMode ? 20 : 24, 
                                      position: 'relative', 
                                      color: idx === currentSelectionIndex ? theme.textReal : theme.branding,
                                      opacity: idx === currentSelectionIndex ? 1 : 0.5,
                                      textShadowColor: idx === currentSelectionIndex ? theme.textReal : 'transparent', textShadowRadius: 5
                                  }}>
                                      {idx === currentSelectionIndex ? "> " : "  "}{item}
                                  </Text>
                              ))}
                          </View>
                      ) : (
                          // MODUL STANDARD (MESAJE/FEEDBACK)
                          <>
                            <Text style={[styles.pixelText, { color: theme.textGhost }]}>88888888888888</Text>
                            <Text style={[styles.pixelText, { color: theme.textReal, textShadowColor: theme.textReal, textShadowRadius: currentTheme === 'CLASSIC' || currentTheme === 'DARK' ? 8 : 0 }]}>
                                {isSelectionMode && <Text style={{fontSize: 30}}>To: </Text>}
                                {displayText}
                                {(!isFeedbackMode && !isTransmitting) && <Text style={{ opacity: showCursor ? 1 : 0 }}>_</Text>}
                            </Text>
                          </>
                      )}
                    </View>

                    <View style={[styles.lcdIcons, { borderTopColor: theme.branding }]}>
                      <Text style={[styles.iconText, { color: theme.textReal, opacity: 0.7 }]}>
                        {headerText || (isSelectionMode ? 'SELECT CONTACT' : `Msg ${currentIndex + 1}/${totalMessages}`)}
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
               {isMenuMode || isMessageMenuMode || isHistoryMode || isGroupMgmtMode || isAddMemberMode ? 'NAVIGATE' : isTypingMode ? 'PRESS OK TO SAVE' : isFeedbackMode ? 'SENT' : '1-WAY PAGING'}
            </Text>
            <View style={[styles.decoLines, { backgroundColor: theme.branding }]} />
        </View>

        <View style={styles.controlsArea}>
          
          <TouchableOpacity 
            style={[styles.bigButton, {backgroundColor: theme.button, borderColor: theme.buttonBorder}]} 
            onPress={() => handleButtonPress('BTN_MENU')} 
            activeOpacity={0.6}>
            <View style={styles.buttonInset} />
            <Text style={[styles.btnLabel, {color: currentTheme==='LIGHT'?'#000':'#FFF'}]}>{isMenuMode || isTypingMode || isMessageMenuMode || isHistoryMode || isGroupMgmtMode || isAddMemberMode ? 'BACK' : 'MENU'}</Text>
          </TouchableOpacity>
          
          <View style={styles.arrowsContainer}>
            <TouchableOpacity style={[styles.arrowBtn, {backgroundColor: theme.arrows, borderColor: theme.buttonBorder}]} onPress={() => handleButtonPress('UP')} disabled={isTypingMode}>
                <Text style={[styles.arrowText, {color: currentTheme==='LIGHT'?'#000':theme.textReal, opacity: isTypingMode ? 0.2 : 0.8}]}>▲</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.arrowBtn, {backgroundColor: theme.arrows, borderColor: theme.buttonBorder}]} onPress={() => handleButtonPress('DOWN')} disabled={isTypingMode}>
                <Text style={[styles.arrowText, {color: currentTheme==='LIGHT'?'#000':theme.textReal, opacity: isTypingMode ? 0.2 : 0.8}]}>▼</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.bigButton, { backgroundColor: (isMenuMode || isSelectionMode || isTypingMode || isMessageMenuMode || isHistoryMode || isGroupMgmtMode || isAddMemberMode) ? theme.buttonAction : theme.button, borderColor: theme.buttonBorder }]} 
            onPress={() => handleButtonPress('SEND')} 
            activeOpacity={0.6}>
            <View style={styles.buttonInset} />
            <Text style={[styles.btnLabel, {color: currentTheme==='LIGHT' && !isMenuMode && !isSelectionMode ? '#000' : '#FFF'}]}>
                {isTypingMode || isMenuMode || isMessageMenuMode || isHistoryMode || isGroupMgmtMode || isAddMemberMode ? 'SELECT' : isSelectionMode ? 'OK' : 'SEND'}
            </Text>
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  mainContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  bgMainTitle: { fontSize: 45, position: 'absolute', top: '10%', width: '100%', textAlign: 'center', zIndex: 2, letterSpacing: 10, fontWeight: 'bold' },
  bgFlickerLines: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  neonLine: { position: 'absolute', width: '100%', height: 2, shadowOffset: { width: 0, height: 0 }, shadowRadius: 10 },
  introContent: { width: '100%', alignItems: 'center', zIndex: 5 },
  introTitle: { fontFamily: 'VT323_400Regular', color: '#E0B0FF', fontSize: 55, marginBottom: 5, textShadowColor: '#bd00ff', textShadowRadius: 15 },
  introSubtitle: { fontFamily: 'VT323_400Regular', fontSize: 18, marginBottom: 40, opacity: 0.8 },
  introButtonList: { width: '100%', gap: 20, alignItems: 'center' },
  terminalBtn: { borderWidth: 2, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.5)', width: '80%', alignItems: 'center', borderRadius: 10 },
  terminalBtnText: { fontFamily: 'VT323_400Regular', fontSize: 28, letterSpacing: 2 },
  backBtn: { position: 'absolute', top: 50, padding: 10, zIndex: 10 },
  pagerBody: { width: width * 0.85,  height: height * 0.55, marginTop: 60, borderRadius: 25, padding: 15, justifyContent: 'space-between', borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 6, borderBottomWidth: 8, shadowOffset: { width: 0, height: 10 }, shadowRadius: 15, elevation: 20, zIndex: 5, position: 'relative' },
  topSection: {},
  brandingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, paddingHorizontal: 5 },
  brandText: { fontWeight: 'bold', fontSize: 12, fontStyle: 'italic' },
  modelText: { fontWeight: 'bold', fontSize: 12 }, 
  aiButton: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 20, borderWidth: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.6, shadowRadius: 4, elevation: 5 },
  aiButtonText: { fontWeight: 'bold', fontSize: 9 },
  ledLight: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  ledGlow: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },
  screenBezel: { padding: 10, borderRadius: 12, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.5)', borderTopWidth: 2, borderTopColor: 'rgba(255,255,255,0.1)' },
  lcdScreen: { height: 120, borderRadius: 6, padding: 10, justifyContent: 'space-between', borderWidth: 2, overflow: 'hidden', position: 'relative' },
  textContainer: { position: 'relative', height: 70, justifyContent: 'center', marginTop: 2 },
  pixelText: { fontFamily: 'VT323_400Regular', fontSize: 32, letterSpacing: 3, position: 'absolute', left: 0, lineHeight: 36 },
  
  inputField: { height: 40, width: '90%', fontFamily: 'VT323_400Regular', fontSize: 30, borderBottomWidth: 2, textAlign: 'center', paddingBottom: 5, position: 'absolute', top: '50%' },
  
  lcdIcons: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, paddingTop: 2 },
  iconText: { fontFamily: 'VT323_400Regular', fontSize: 14 }, 
  middleDeco: { alignItems: 'center', justifyContent: 'center', opacity: 0.5, marginTop: 8, marginBottom: 8 },
  instructionText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 2, marginVertical: 3 },
  decoLines: { height: 2, width: '80%' },
  controlsArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 5, marginBottom: 5 },
  bigButton: { width: 65, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 5, borderRightWidth: 3 },
  buttonInset: { width: '80%', height: '40%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, position: 'absolute', top: 3 },
  btnLabel: { fontSize: 10, fontWeight: 'bold', marginTop: 12, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset:{width:1,height:1}, textShadowRadius:1 },
  
  arrowsContainer: { alignItems: 'center', justifyContent: 'center', gap: 10, transform: [{scale: 1.1}] },
  arrowBtn: { width: 35, height: 28, margin: 2, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 4, borderRightWidth: 2 },
  arrowText: { fontSize: 10, fontWeight: 'bold', opacity: 0.8 },
  speakerGrill: { position: 'absolute', bottom: 10, right: 20, width: 30, gap: 3 },
  grillLine: { height: 2, borderRadius: 2 },

  notificationPopup: { 
      position: 'absolute', 
      top: '40%', 
      left: '5%', 
      width: '90%', 
      padding: 10, 
      borderRadius: 5,
      borderWidth: 2, 
      zIndex: 10
  },
  notificationTitle: { fontFamily: 'VT323_400Regular', fontSize: 18, marginBottom: 3 },
  notificationText: { fontFamily: 'VT323_400Regular', fontSize: 14 }
});