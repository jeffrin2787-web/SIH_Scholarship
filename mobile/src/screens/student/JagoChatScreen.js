import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import Header from '../../components/Header';

const SUPPORTED_LANGUAGES = [
  { key: 'en', label: 'English', native: 'English' },
  { key: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { key: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { key: 'as', label: 'Assami', native: 'অসমীয়া' },
  { key: 'bho', label: 'Bihari', native: 'बिहारी / भोजपुरी' }
];

const LOCALIZED_DATA = {
  en: {
    welcome: (name) => `Hello ${name}! I am JAGO, your Ministry of Tribal Affairs (MoTA) AI Assistant.\n\nI can check your live application status across all 5 schemes, track DBT disbursements, explain deficiencies, and check eligibility. How can I help you today?`,
    prompts: [
      'When will I get my scholarship money?',
      'What is my application status?',
      'Why is my application pending / stuck?',
      'Am I eligible for NFST Fellowship?'
    ],
    placeholder: 'Ask JAGO about scholarship status, DBT...',
    actions: [
      { label: 'Check Application Status', route: 'Dashboard' },
      { label: 'DBT Payment Details', route: 'Dashboard' },
      { label: 'Document Wallet', route: 'Wallet' }
    ]
  },
  hi: {
    welcome: (name) => `नमस्ते ${name}! मैं 'जागो' (JAGO) हूँ, जनजातीय कार्य मंत्रालय (MoTA) का संवादात्मक एआई सहायक।\n\nमैं आपकी छात्रवृत्ति स्थिति, डीबीटी भुगतान और दस्तावेज़ सत्यापन से संबंधित व्यक्तिगत जानकारी दे सकता हूँ। आप क्या पूछना चाहते हैं?`,
    prompts: [
      'छात्रवृत्ति का पैसा कब तक आएगा?',
      'मेरे आवेदन की स्थिति क्या है?',
      'क्या दस्तावेजों में कोई कमी है?',
      'क्या मैं NFST फैलोशिप के लिए पात्र हूँ?'
    ],
    placeholder: 'अपना प्रश्न यहां लिखें...',
    actions: [
      { label: 'आवेदन स्थिति जांचें', route: 'Dashboard' },
      { label: 'डीबीटी भुगतान विवरण', route: 'Dashboard' },
      { label: 'दस्तावेज़ वॉलेट', route: 'Wallet' }
    ]
  },
  ta: {
    welcome: (name) => `வணக்கம் ${name}! நான் 'ஜாகோ' (JAGO), பழங்குடியினர் விவகார அமைச்சகத்தின் (MoTA) AI உரையாடல் உதவியாளர்.\n\n5 திட்டங்களுக்கான உங்கள் நேரடி விண்ணப்ப நிலை, DBT வங்கி வரவு, மற்றும் ஆவண சரிபார்ப்பு பற்றிய தகவல்களை நான் வழங்க முடியும். உங்களுக்கு எவ்வாறு உதவ வேண்டும்?`,
    prompts: [
      'கல்வி உதவித்தொகை பணம் எப்போது வரும்?',
      'என் விண்ணப்பத்தின் நிலை என்ன?',
      'ஆவணங்களில் ஏதேனும் குறைபாடு உள்ளதா?',
      'NFST பெல்லோஷிப்பிற்கு நான் தகுதியானவரா?'
    ],
    placeholder: 'உங்கள் கேள்வியை இங்கே தட்டச்சு செய்யவும்...',
    actions: [
      { label: 'விண்ணப்ப நிலை', route: 'Dashboard' },
      { label: 'DBT வங்கி வரவு', route: 'Dashboard' },
      { label: 'ஆவண வாலட்', route: 'Wallet' }
    ]
  },
  as: {
    welcome: (name) => `নমস্কাৰ ${name}! মই 'জাগো' (JAGO), জনজাতীয় পৰিক্ৰমা মন্ত্ৰালয়ৰ (MoTA) AI সহায়ক।\n\nমই ৫ খন আঁচনিৰ বাবে আপোনাৰ লাইভ আবেদন স্থিতি, DBT ধন পৰিশোধ আৰু নথি পৰীক্ষাৰ তথ্য প্ৰদান কৰিব পাৰোঁ। আজি মই আপোনাক কিদৰে সহায় কৰিব পাৰোঁ?`,
    prompts: [
      'বৃত্তিৰ ধন কেতিয়া পোৱা যাব?',
      'মোৰ আবেদনৰ স্থিতি কি?',
      'নথিপত্ৰত কিবা বিসংগতি আছে নেকি?',
      'মই NFST ফেল\'শ্বিপৰ বাবে যোগ্য নেকি?'
    ],
    placeholder: 'আপোনাৰ প্ৰশ্ন ইয়াত লিখক...',
    actions: [
      { label: 'আবেদন স্থিতি চাওক', route: 'Dashboard' },
      { label: 'DBT পৰিশোধ সবিশেষ', route: 'Dashboard' },
      { label: 'নথি ৱালেট', route: 'Wallet' }
    ]
  },
  bho: {
    welcome: (name) => `प्रणाम ${name}! हम 'जागो' (JAGO) हईं, जनजातीय कार्य मंत्रालय (MoTA) के AI सहायक।\n\nहम रउआ छात्रवृत्ति आवेदन स्थिति, DBT पइसा, आ दस्तावेज़ जांच से जुड़ल व्यक्तिगत जानकारी दे सकत बानी। रउआ का जानल चाहत बानी?`,
    prompts: [
      'छात्रवृत्ति के पइसा कब ले आई?',
      'हमार आवेदन के का स्थिति बा?',
      'दस्तावेज़ में कवनो कमी बा का?',
      'का हम NFST फेलोशिप खातिर योग्य बानी?'
    ],
    placeholder: 'अपन सवाल इहाँ लिखीं...',
    actions: [
      { label: 'आवेदन स्थिति देखीं', route: 'Dashboard' },
      { label: 'DBT पइसा विवरण', route: 'Dashboard' },
      { label: 'दस्तावेज़ वॉलेट', route: 'Wallet' }
    ]
  }
};

export default function JagoChatScreen({ navigation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState('en'); // 'en', 'hi', 'ta', 'as', 'bho'
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  const currentLoc = LOCALIZED_DATA[language] || LOCALIZED_DATA.en;
  const userName = user?.name || 'Student';

  useEffect(() => {
    // Initial welcome message from JAGO localized to selected language
    setMessages([
      {
        id: '1',
        sender: 'jago',
        text: currentLoc.welcome(userName),
        actions: currentLoc.actions
      }
    ]);
  }, [language, user]);

  const handleSend = async (textToSend) => {
    const message = textToSend || inputText;
    if (!message || message.trim() === '') return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: message
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/jago/chat', {
        message,
        language
      });

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'jago',
        text: res.data.reply,
        actions: res.data.actions || []
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'jago',
          text:
            language === 'hi'
              ? 'क्षमा करें, सर्वर से छात्रवृत्ति डेटा प्राप्त करने में समस्या आई। कृपया पुनः प्रयास करें।'
              : language === 'ta'
              ? 'மன்னிக்கவும், சேவையகத்திலிருந்து தரவைப் பெறுவதில் சிக்கல் ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
              : language === 'as'
              ? 'ক্ষমা কৰিব, চাৰ্ভাৰৰ পৰা তথ্য সংগ্ৰহ কৰাত সমস্যা হৈছে। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।'
              : language === 'bho'
              ? 'माफ करीं, सर्वर से डेटा लेवे में दिक्कत भइल। फेर से कोशिश करीं।'
              : 'Sorry, I encountered an issue accessing your live records. Please try again.',
          actions: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    if (action.route) {
      navigation.navigate(action.route);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="JAGO AI Assistant"
        subtitle="MoTA Multilingual Conversational Skill"
      />

      {/* MULTILINGUAL LANGUAGE SELECTOR (English, Hindi, Tamil, Assami, Bihari) */}
      <View style={styles.langBar}>
        <Text style={styles.langLabel}>Language / மொழி / ভাষা / भाषा:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = language === lang.key;
            return (
              <TouchableOpacity
                key={lang.key}
                style={[styles.langBtn, isActive && styles.langBtnActive]}
                onPress={() => setLanguage(lang.key)}
              >
                <Text style={[styles.langBtnText, isActive && styles.langBtnTextActive]}>
                  {lang.native}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* CHAT MESSAGES */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowJago
              ]}
            >
              {!isUser && (
                <View style={styles.jagoAvatar}>
                  <Text style={styles.jagoAvatarText}>🤖</Text>
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.bubbleUser : styles.bubbleJago
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.textUser : styles.textJago
                  ]}
                >
                  {msg.text}
                </Text>

                {msg.actions && msg.actions.length > 0 && (
                  <View style={styles.actionLinksContainer}>
                    {msg.actions.map((act, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.actionChip}
                        onPress={() => handleActionClick(act)}
                      >
                        <Text style={styles.actionChipText}>{act.label} →</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {loading && (
          <View style={[styles.messageRow, styles.messageRowJago]}>
            <View style={styles.jagoAvatar}>
              <Text style={styles.jagoAvatarText}>🤖</Text>
            </View>
            <View style={[styles.messageBubble, styles.bubbleJago]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* LOCALIZED QUICK PROMPT CHIPS */}
      <View style={styles.quickPromptsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {currentLoc.prompts.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.promptChip}
              onPress={() => handleSend(prompt)}
            >
              <Text style={styles.promptChipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* INPUT BAR */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={currentLoc.placeholder}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
        />

        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  langBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  langLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    marginRight: 6
  },
  langScroll: {
    flexGrow: 1
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.border
  },
  langBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  langBtnTextActive: {
    color: '#FFFFFF'
  },
  chatArea: {
    flex: 1
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end'
  },
  messageRowUser: {
    justifyContent: 'flex-end'
  },
  messageRowJago: {
    justifyContent: 'flex-start'
  },
  jagoAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4
  },
  jagoAvatarText: {
    fontSize: 16
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 12,
    elevation: 1
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4
  },
  bubbleJago: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19
  },
  textUser: {
    color: '#FFFFFF'
  },
  textJago: {
    color: colors.text
  },
  actionLinksContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  actionChip: {
    backgroundColor: colors.primaryLighter,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginVertical: 3
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  quickPromptsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  promptChip: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  promptChipText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.borderLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: colors.textMuted
  },
  sendIcon: {
    color: '#FFF',
    fontSize: 14
  }
});
