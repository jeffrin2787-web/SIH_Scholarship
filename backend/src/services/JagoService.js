const { query } = require('../config/db');

class JagoService {
  /**
   * Process a conversational prompt from a logged-in student
   * Supports: English ('en'), Hindi ('hi'), Tamil ('ta'), Assamese ('as'), Bihari/Bhojpuri ('bho')
   */
  static async handleStudentMessage(userId, userMessage, language = 'en') {
    const text = (userMessage || '').trim().toLowerCase();

    // Normalize language key
    let lang = (language || 'en').toLowerCase();
    if (lang === 'tamil') lang = 'ta';
    if (lang === 'assami' || lang === 'assamese') lang = 'as';
    if (lang === 'bihari' || lang === 'bhojpuri') lang = 'bho';
    if (lang === 'hindi') lang = 'hi';

    // Auto-detect script if prompt contains Indic characters
    if (/[\u0B80-\u0BFF]/.test(text)) lang = 'ta'; // Tamil script
    else if (/[\u0980-\u09FF]/.test(text)) lang = 'as'; // Bengali/Assamese script
    else if (lang === 'en' && (/[\u0900-\u097F]/.test(text) || text.includes('kya') || text.includes('paisa'))) lang = 'hi';

    // Fetch student's real context from database
    const user = await query.get(
      `SELECT * FROM users WHERE id = ?`,
      [userId]
    );

    const applications = await query.all(
      `SELECT a.*, s.name as scheme_name
       FROM applications a
       JOIN schemes s ON a.scheme_id = s.id
       WHERE a.user_id = ?
       ORDER BY a.applied_at DESC`,
      [userId]
    );

    const deficiencies = await query.all(
      `SELECT d.*, a.application_number, s.name as scheme_name
       FROM deficiencies d
       JOIN applications a ON d.application_id = a.id
       JOIN schemes s ON a.scheme_id = s.id
       WHERE a.user_id = ? AND d.is_resolved = 0`,
      [userId]
    );

    const documents = await query.all(
      `SELECT * FROM documents WHERE user_id = ?`,
      [userId]
    );

    const userName = user?.name || 'Student';

    // Helper for multi-language response dictionary
    const t = (dict) => dict[lang] || dict['en'];

    // 1. DISBURSEMENT / DBT / PAYMENT INTENT
    if (
      text.includes('paisa') ||
      text.includes('money') ||
      text.includes('disburse') ||
      text.includes('dbt') ||
      text.includes('payment') ||
      text.includes('rupees') ||
      text.includes('bank') ||
      text.includes('utr') ||
      text.includes('பணம்') ||
      text.includes('ধন') ||
      text.includes('पइसा')
    ) {
      if (!applications.length) {
        return {
          reply: t({
            en: 'You do not have any active scholarship applications on record yet. You can apply directly from the home dashboard.',
            hi: 'आपके नाम पर वर्तमान में कोई सक्रिय छात्रवृत्ति आवेदन दर्ज नहीं है। आप सीधे होम स्क्रीन से आवेदन कर सकते हैं।',
            ta: 'தற்போது உங்கள் பெயரில் எந்தவொரு செயலில் உள்ள கல்வி உதவித்தொகை விண்ணப்பமும் இல்லை. நீங்கள் முகப்புத் திரையிலிருந்து நேரடியாக விண்ணப்பிக்கலாம்.',
            as: 'আপোনাৰ নামত বৰ্তমান কোনো সক্ৰিয় বৃত্তি আবেদন নাই। আপুনি পোনপটীয়াকৈ হোম স্ক্ৰীণৰ পৰা আবেদন কৰিব পাৰে।',
            bho: 'राउर नाम पर अभिन ले कवनो छात्रवृत्ति आवेदन दर्ज नइखे। रउआ सोझे होम स्क्रीन से आवेदन कर सकत बानी।'
          }),
          actions: [{ label: t({ en: 'Apply for Scholarship', hi: 'छात्रवृत्ति हेतु आवेदन करें', ta: 'விண்ணப்பிக்கவும்', as: 'আবেদন কৰক', bho: 'आवेदन करीं' }), route: 'Apply' }]
        };
      }

      const activeApp = applications[0];
      if (activeApp.current_stage === 'DISBURSED') {
        const amt = activeApp.disbursed_amount.toLocaleString('en-IN');
        const utr = activeApp.utr_number || 'PFMS-PROCESSED';
        const reply = t({
          en: `Great news ${userName}! The sanctioned amount of ₹${amt} for ${activeApp.scheme_name} has already been credited to your Aadhaar-linked bank account. PFMS UTR: ${utr}.`,
          hi: `बधाई हो ${userName}! आपकी ${activeApp.scheme_name} की राशि ₹${amt} आपके आधार-सीडेड बैंक खाते में जमा कर दी गई है। संदर्भ UTR संख्या: ${utr}।`,
          ta: `வாழ்த்துகள் ${userName}! உங்கள் ${activeApp.scheme_name} திட்டத்திற்கான ₹${amt} தொகை உங்கள் ஆதார் இணைக்கப்பட்ட வங்கிக் கணக்கில் வரவு வைக்கப்பட்டுள்ளது. UTR: ${utr}.`,
          as: `অভিনন্দন ${userName}! আপোনাৰ ${activeApp.scheme_name} ৰ মঞ্জুৰ কৰা ধন ₹${amt} আপোনাৰ আধাৰ সংযোগিত বেংক একাউণ্টত জমা হৈছে। UTR: ${utr}।`,
          bho: `बधाई हो ${userName}! राउर ${activeApp.scheme_name} के राशि ₹${amt} राउर आधार से जुड़ल बैंक खाता में जमा हो गइल बा। UTR: ${utr}।`
        });

        return {
          reply,
          actions: [{ label: t({ en: 'View Payment Details', hi: 'भुगतान विवरण देखें', ta: 'பண விவரங்கள்', as: 'পৰিশোধ সবিশেষ', bho: 'भुगतान देखीं' }), route: 'Dashboard' }]
        };
      } else {
        const amt = activeApp.sanctioned_amount.toLocaleString('en-IN');
        const stageStr = activeApp.current_stage.replace(/_/g, ' ');
        const reply = t({
          en: `Hello ${userName}, your ${activeApp.scheme_name} application is currently at the '${stageStr}' stage. The sanctioned amount is ₹${amt}. DBT credit to your bank account will trigger immediately upon final State Sanction clearance.`,
          hi: `नमस्ते ${userName}, आपका ${activeApp.scheme_name} आवेदन वर्तमान में '${stageStr}' स्तर पर है। स्वीकृत राशि ₹${amt} है। राज्य स्तरीय स्वीकृति और पीएफएमएस क्लीयरेंस के बाद यह राशि सीधे आपके बैंक खाते में अंतरित कर दी जाएगी।`,
          ta: `வணக்கம் ${userName}, உங்கள் ${activeApp.scheme_name} விண்ணப்பம் தற்போது '${stageStr}' நிலையில் உள்ளது. அனுமதிக்கப்பட்ட தொகை ₹${amt}. இறுதி அனுமதிக்குப் பிறகு DBT மூலம் உங்கள் வங்கிக் கணக்கில் வரவு வைக்கப்படும்.`,
          as: `নমস্কাৰ ${userName}, আপোনাৰ ${activeApp.scheme_name} আবেদন বৰ্তমান '${stageStr}' পৰ্যায়ত আছে। মঞ্জুৰ কৰা ধন ₹${amt}। ৰাজ্যিক অনুমোদনৰ পাছত DBT যোগে আপোনাৰ একাউণ্টত ধন প্ৰেৰণ কৰা হ'ব।`,
          bho: `प्रणाम ${userName}, राउर ${activeApp.scheme_name} आवेदन अभी '${stageStr}' स्तर पर बा। स्वीकृत राशि ₹${amt} बा। राज्य से मंजूरी मिलला के बाद DBT से पइसा सोझे बैंक खाता में आ जाई।`
        });

        return {
          reply,
          actions: [{ label: t({ en: 'Track Application Status', hi: 'आवेदन स्थिति ट्रैक करें', ta: 'விண்ணப்ப நிலை', as: 'আবেদন স্থিতি', bho: 'आवेदन ट्रैक करीं' }), route: 'Dashboard' }]
        };
      }
    }

    // 2. DEFICIENCY / PENDING ACTION INTENT
    if (
      text.includes('deficiency') ||
      text.includes('stuck') ||
      text.includes('pending') ||
      text.includes('problem') ||
      text.includes('missing') ||
      text.includes('reject') ||
      text.includes('ruka') ||
      text.includes('kharab') ||
      text.includes('குறைபாடு') ||
      text.includes('বিসংগতি') ||
      text.includes('कमी')
    ) {
      if (deficiencies.length > 0) {
        const def = deficiencies[0];
        const reply = t({
          en: `Action required on your ${def.scheme_name} application: "${def.title}". Details: ${def.message}. You can resolve this easily by updating documents in your Document Wallet.`,
          hi: `आपके आवेदन में एक ध्यान देने योग्य कार्य है: "${def.title}"। संदेश: ${def.message}। कृपया इसे डिजिटल दस्तावेज़ वॉलेट से तुरंत हल करें।`,
          ta: `உங்கள் ${def.scheme_name} விண்ணப்பத்தில் நடவடிக்கை தேவை: "${def.title}". விவரம்: ${def.message}. உங்கள் ஆவண வாலட்டில் இதை நீங்கள் உடனடியாகத் தீர்க்கலாம்.`,
          as: `আপোনাৰ ${def.scheme_name} আবেদনত প্ৰয়োজনীয় পদক্ষেপ: "${def.title}"। সবিশেষ: ${def.message}। নথিপত্ৰ ৱালেটৰ পৰা ইয়াৰ সমাধান কৰক।`,
          bho: `राउर ${def.scheme_name} आवेदन में एगो सुधार जरूरी बा: "${def.title}". सन्देश: ${def.message}. रउआ एकरा के दस्तावेज़ वॉलेट से तुरंत हल कर सकत बानी।`
        });

        return {
          reply,
          actions: [{ label: t({ en: 'Resolve in Document Wallet', hi: 'दस्तावेज़ वॉलेट में हल करें', ta: 'ஆவண வாலட்', as: 'নথি ৱালেট', bho: 'वॉलेट में ठीक करीं' }), route: 'Wallet' }]
        };
      } else {
        const reply = t({
          en: `Good news ${userName}! There are zero flagged deficiencies on any of your scholarship applications. Everything is proceeding smoothly.`,
          hi: `शुभ समाचार ${userName}! आपके किसी भी आवेदन पर कोई त्रुटि या दस्तावेज़ की कमी (Deficiency) लंबित नहीं है। सब कुछ सुचारू रूप से आगे बढ़ रहा है।`,
          ta: `நற்செய்தி ${userName}! உங்கள் விண்ணப்பங்களில் எந்தவித குறைபாடுகளும் இல்லை. அனைத்தும் சீராக நடந்து வருகிறது.`,
          as: `ভাল খবৰ ${userName}! আপোনাৰ কোনো আবেদনতে কোনো বিসংগতি নাই। সকলো কাম সঠিকভাৱে চলি আছে।`,
          bho: `शुभ समाचार ${userName}! राउर कवनो आवेदन पर कवनो कमी भा गलती नइखे। सब काम ठीक से चल रहल बा।`
        });

        return {
          reply,
          actions: [{ label: t({ en: 'View Dashboard', hi: 'डैशबोर्ड देखें', ta: 'டாஷ்போர்டு', as: "ডেশ্বব'ৰ্ড", bho: 'डैशबोर्ड देखीं' }), route: 'Dashboard' }]
        };
      }
    }

    // 3. STATUS / TIMELINE INTENT
    if (
      text.includes('status') ||
      text.includes('kahan') ||
      text.includes('where') ||
      text.includes('stage') ||
      text.includes('progress') ||
      text.includes('track') ||
      text.includes('நிலை') ||
      text.includes('স্থিতি')
    ) {
      if (!applications.length) {
        return {
          reply: t({
            en: 'You do not have any active applications under tracking. Would you like to check eligibility for any of the 5 tribal scholarship schemes?',
            hi: 'आपके पास अभी कोई सक्रिय आवेदन नहीं है। क्या आप 5 जनजातीय छात्रवृत्ति योजनाओं में से किसी के लिए पात्रता जांचना चाहते हैं?',
            ta: 'தற்போது கண்காணிக்க எந்த விண்ணப்பமும் இல்லை. 5 பழங்குடியினர் கல்வி உதவித்தொகை திட்டங்களின் தகுதியை சரிபார்க்க விரும்புகிறீர்களா?',
            as: 'আপোনাৰ কোনো সক্ৰিয় আবেদন ট্ৰেকিং কৰিবলৈ নাই। আপুনি ৫ খন জনজাতীয় বৃত্তিৰ যোগ্যতা পৰীক্ষা কৰিব বিচাৰে নেকি?',
            bho: 'रउआ लगे अभिन कवनो सक्रिय आवेदन नइखे। का रउआ 5 गो जनजातीय छात्रवृत्ति योजना खातिर पात्रता जाँचल चाहत बानी?'
          }),
          actions: [{ label: t({ en: 'Browse Schemes', hi: 'योजनाएं देखें', ta: 'திட்டங்கள்', as: 'আঁচনিসমূহ', bho: 'योजना देखीं' }), route: 'Apply' }]
        };
      }

      const appSummaries = applications.map((a) => {
        return `${a.scheme_name}: ${a.current_stage.replace(/_/g, ' ')} (${a.dbt_status})`;
      }).join('; ');

      const reply = t({
        en: `Hello ${userName}! Here is your unified application status: ${appSummaries}. Tap below to view your full 5-stage timeline from submission to DBT disbursement.`,
        hi: `नमस्ते ${userName}! आपके आवेदन की स्थिति: ${appSummaries}। आप नीचे दिए गए बटन पर क्लिक करके 5-चरणों वाली विस्तृत समय-रेखा (Timeline) देख सकते हैं।`,
        ta: `வணக்கம் ${userName}! உங்கள் விண்ணப்பத்தின் நிலை: ${appSummaries}. முழு 5-நிலை காலவரிசையைக் காண கீழே தட்டவும்.`,
        as: `নমস্কাৰ ${userName}! আপোনাৰ আবেদনৰ স্থিতি: ${appSummaries}। আবেদনৰ পৰা DBT পৰ্যন্ত ৫ টা স্তৰৰ সম্পূৰ্ণ সময়ৰেখা চাবলৈ তলত ক্লিক কৰক।`,
        bho: `प्रणाम ${userName}! राउर आवेदन के स्थिति: ${appSummaries}। नीचे दिहल बटन पर क्लिक करके पूरा 5-चरण के टाइमलाइन देखीं।`
      });

      return {
        reply,
        actions: [{ label: t({ en: 'View Detailed Timeline', hi: 'विस्तृत समय-रेखा देखें', ta: 'காலவரிசை', as: 'সময়ৰেখা চাওক', bho: 'टाइमलाइन देखीं' }), route: 'Dashboard' }]
      };
    }

    // 4. ELIGIBILITY INTENT
    if (
      text.includes('eligib') ||
      text.includes('qualif') ||
      text.includes('apply') ||
      text.includes('patra') ||
      text.includes('rule') ||
      text.includes('koun') ||
      text.includes('தகுதி') ||
      text.includes('যোগ্যতা')
    ) {
      const activeApp = applications.find(a => a.current_stage !== 'DISBURSED');
      let warningNote = '';
      if (activeApp) {
        warningNote = t({
          en: ` (Important note: You currently have an active application for ${activeApp.scheme_name}. Under MoTA guidelines, a student can avail only one scholarship at a time.)`,
          hi: ` (ध्यान दें: आपके पास पहले से ही सक्रिय ${activeApp.scheme_name} आवेदन है। मंत्रालय के नियमानुसार एक समय में केवल एक छात्रवृत्ति ली जा सकती है।)`,
          ta: ` (குறிப்பு: உங்களிடம் ஏற்கனவே ${activeApp.scheme_name} விண்ணப்பம் உள்ளது. ஒரு நேரத்தில் ஒரு கல்வி உதவித்தொகை மட்டுமே பெற முடியும்.)`,
          as: ` (মন কৰিব: আপোনাৰ ইতিমধ্যে ${activeApp.scheme_name} আবেদন সক্ৰিয় হৈ আছে। নিয়ম অনুসৰি একে সময়তে এখনহে বৃত্তি ল'ব পাৰি।)`,
          bho: ` (ध्यान दीं: रउआ लगे पहिले से सक्रिय ${activeApp.scheme_name} आवेदन बा। नियम से एके समय में एगो छात्रवृत्ति मिल सकेला।)`
        });
      }

      const reply = t({
        en: `Ministry of Tribal Affairs runs 5 core ST scholarship schemes:\n1. Pre-Matric (Classes 9–10)\n2. Post-Matric (Class 11 to PG/PhD; income ceiling ₹2.5 Lakh)\n3. Top Class Education (Premier institutes like IIT/IIM)\n4. NFST Fellowship (M.Phil/PhD with UGC-NET)\n5. National Overseas Scholarship (NOS for abroad study)${warningNote}`,
        hi: `जनजातीय कार्य मंत्रालय (MoTA) 5 प्रमुख योजनाएं संचालित करता है:\n1. प्री-मैट्रिक (कक्षा 9-10)\n2. पोस्ट-मैट्रिक (कक्षा 11 से स्नातकोत्तर/पीएचडी, आय सीमा ₹2.5 लाख)\n3. टॉप क्लास शिक्षा (आईआईटी/आईआईएम आदि)\n4. राष्ट्रीय फैलोशिप (एनएफएसटी - एम.फिल/पीएचडी हेतु यूजीसी-नेट)\n5. राष्ट्रीय विदेशी छात्रवृत्ति (एनओएस)${warningNote}`,
        ta: `பழங்குடியினர் விவகார அமைச்சகம் (MoTA) 5 முக்கிய கல்வி உதவித்தொகை திட்டங்களை செயல்படுத்துகிறது:\n1. ப்ரீ-மெட்ரிக் (வகுப்பு 9-10)\n2. போஸ்ட்-மெட்ரிக் (வகுப்பு 11 முதல் PG/PhD வரை; வருமான வரம்பு ₹2.5 லட்சம்)\n3. டாப் கிளாஸ் கல்வி (IIT/IIM போன்ற முதன்மை நிறுவனங்கள்)\n4. NFST பெல்லோஷிப் (UGC-NET உடன் ஆராய்ச்சி)\n5. NOS வெளிநாட்டு கல்வி உதவித்தொகை${warningNote}`,
        as: `জনজাতীয় পৰিক্ৰমা মন্ত্ৰালয়ে ৫ খন মূল জনজাতীয় বৃত্তি আঁচনি পৰিচালনা কৰে:\n১. প্ৰি-মেট্ৰিক (৯ম-১০ম শ্ৰেণী)\n২. পষ্ট-মেট্ৰিক (১১শ শ্ৰেণীৰ পৰা স্নাতকোত্তৰ/পিএইচডি; আয়ৰ সীমা ₹২.৫ লাখ)\n৩. টপ ক্লাছ শিক্ষা (IIT/IIM ইত্যাদি)\n৪. NFST ফেল'শ্বিপ (UGC-NET সহ গৱেষণা)\n৫. NOS বিদেশত শিক্ষাৰ বৃত্তি${warningNote}`,
        bho: `जनजातीय कार्य मंत्रालय (MoTA) 5 गो मुख्य छात्रवृत्ति योजना चलावेला:\n1. प्री-मैट्रिक (कक्षा 9-10)\n2. पोस्ट-मैट्रिक (कक्षा 11 से पीजी/पीएचडी, आमदनी सीमा ₹2.5 लाख)\n3. टॉप क्लास शिक्षा (आईआईटी/आईआईएम आदि)\n4. NFST फेलोशिप (UGC-NET के साथ रिसर्च)\n5. NOS बिदेस में पढ़ाई खातिर छात्रवृत्ति${warningNote}`
      });

      return {
        reply,
        actions: [{ label: t({ en: 'Check Scheme Details & Apply', hi: 'योजना विवरण देखें और आवेदन करें', ta: 'விண்ணப்பிக்க', as: 'আঁচনি বিৱৰণ', bho: 'योजना देखीं आ आवेदन करीं' }), route: 'Apply' }]
      };
    }

    // 5. DIGILOCKER / WALLET INTENT
    if (
      text.includes('digilocker') ||
      text.includes('doc') ||
      text.includes('caste') ||
      text.includes('income') ||
      text.includes('certificate') ||
      text.includes('upload') ||
      text.includes('wallet') ||
      text.includes('சான்றிதழ்') ||
      text.includes('নথি') ||
      text.includes('प्रमाणपत्र')
    ) {
      const docCount = documents.length;
      const reply = t({
        en: `You have ${docCount} documents in your Digital Document Wallet. Once fetched through DigiLocker or uploaded with verification, you never have to re-upload them—they can be reused across all 5 MoTA schemes.`,
        hi: `आपके डिजिटल दस्तावेज़ वॉलेट में ${docCount} सत्यापित दस्तावेज़ उपलब्ध हैं। डिजिलॉकर या अपलोड के माध्यम से एक बार प्राप्त होने के बाद, आप इन्हें सभी 5 योजनाओं में बिना दोबारा अपलोड किए सीधे पुन: उपयोग कर सकते हैं।`,
        ta: `உங்கள் டிஜிட்டல் ஆவண வாலட்டில் ${docCount} ஆவணங்கள் உள்ளன. டிஜிலாக்கர் அல்லது நேரடி பதிவேற்றம் மூலம், இவற்றை அனைத்து 5 திட்டங்களிலும் மீண்டும் மீண்டும் பதிவேற்றாமல் மறுபயன்பாடு செய்யலாம்.`,
        as: `আপোনাৰ ডিজিটেল নথিপত্ৰ ৱালেটত ${docCount} খন নথিপত্ৰ মজুত আছে। ডিজি্লকাৰৰ জৰিয়তে বা আপলোড কৰাৰ পাছত, এই নথিসমূহ ৫ খন আঁচনিতে পুনৰ ব্যৱহাৰ কৰিব পাৰিব।`,
        bho: `राउर डिजिटल दस्तावेज़ वॉलेट में ${docCount} गो दस्तावेज़ उपलब्ध बा। डिजिलॉकर चाहे अपलोड कइला के बाद, रउआ सब 5 गो योजना में बिना दोबारा अपलोड कइले इस्तेमाल कर सकत बानी।`
      });

      return {
        reply,
        actions: [{ label: t({ en: 'Open Document Wallet', hi: 'दस्तावेज़ वॉलेट खोलें', ta: 'ஆவண வாலட்', as: 'নথি ৱালেট খোলক', bho: 'दस्तावेज़ वॉलेट खोलीं' }), route: 'Wallet' }]
      };
    }

    // DEFAULT GUIDANCE GREETING
    const defaultReply = t({
      en: `Hello ${userName}! I am JAGO, your Ministry of Tribal Affairs AI Assistant. I can track your real-time scholarship status across all 5 schemes, check DBT payment progress, resolve document deficiencies, and verify scheme eligibility. How can I help you today?`,
      hi: `नमस्ते ${userName}! मैं 'जागो' (JAGO) हूँ, जनजातीय कार्य मंत्रालय का एआई सहायक। मैं आपके छात्रवृत्ति आवेदन, डीबीटी भुगतान, दस्तावेज़ सत्यापन और योजनाओं की पात्रता से जुड़े सवालों का उत्तर दे सकता हूँ। आप क्या जानना चाहते हैं?`,
      ta: `வணக்கம் ${userName}! நான் 'ஜாகோ' (JAGO), பழங்குடியினர் விவகார அமைச்சகத்தின் AI உதவியாளர். உங்கள் கல்வி உதவித்தொகை, DBT வங்கிப் பணம், ஆவணங்கள் மற்றும் தகுதி பற்றிய தகவல்களை வழங்க முடியும். நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?`,
      as: `নমস্কাৰ ${userName}! মই 'জাগো' (JAGO), জনজাতীয় পৰিক্ৰমা মন্ত্ৰালয়ৰ AI সহায়ক। মই আপোনাৰ বৃত্তি স্থিতি, DBT ধন আৰু নথি পৰীক্ষাৰ তথ্য দিব পাৰো। আপোনাক কিদৰে সহায় কৰিব পাৰোঁ?`,
      bho: `प्रणाम ${userName}! हम 'जागो' (JAGO) हईं, जनजातीय कार्य मंत्रालय के AI सहायक। हम राउर छात्रवृत्ति आवेदन, DBT पइसा, दस्तावेज़ जांच आ योजना पात्रता से जुड़ल सवालन के जवाब दे सकत बानी। रउआ का जानल चाहत बानी?`
    });

    return {
      reply: defaultReply,
      actions: [
        { label: t({ en: 'Application Status', hi: 'आवेदन स्थिति', ta: 'விண்ணப்ப நிலை', as: 'আবেদন স্থিতি', bho: 'आवेदन स्थिति' }), route: 'Dashboard' },
        { label: t({ en: 'DBT Payment Details', hi: 'डीबीटी भुगतान', ta: 'DBT பணம்', as: 'DBT ধন', bho: 'DBT पइसा' }), route: 'Dashboard' },
        { label: t({ en: 'Document Wallet', hi: 'दस्तावेज़ वॉलेट', ta: 'ஆவண வாலட்', as: 'নথি ৱালেট', bho: 'दस्तावेज़ वॉलेट' }), route: 'Wallet' }
      ]
    };
  }
}

module.exports = JagoService;
