/**
 * Class 7 History — NCERT "Our Pasts II", chapter by chapter, through the
 * conceptual engine. The medieval thousand years: manuscripts that drift,
 * kings read through their own praise, and a sultanate that fixed prices
 * and minted promises. Every fact carries its evidence habit — who wrote
 * it, why, and with what axe to grind.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Our Pasts – II (Class 7)";
const LICENCE = "CC-BY-SA-4.0";

export const G7_HISTORY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Tracing Changes Through a Thousand Years                    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-7-tracing-changes",
    subject: "HISTORY",
    classLevel: 7,
    chapter: {
      en: "Chapter 1 — Tracing Changes Through a Thousand Years",
      hi: "अध्याय 1 — हज़ार वर्षों के दौरान हुए परिवर्तनों की पड़ताल",
      mr: "प्रकरण 1 — हजार वर्षांतील बदलांचा मागोवा",
    },
    name: {
      en: "Tracing Changes Through a Thousand Years",
      hi: "हज़ार वर्षों के परिवर्तनों की पड़ताल",
      mr: "हजार वर्षांतील बदलांचा मागोवा",
    },
    summary: {
      en: "How the medieval past is read: hand-copied books that drift, a map drawn south-side-up, words whose meanings migrate — and the archives where the paperwork of centuries waits.",
      hi: "मध्यकालीन अतीत कैसे पढ़ा जाता है: हाथ की नक़लों में बहकती किताबें, दक्षिण-ऊपर खिंचा नक़्शा, अर्थ बदलते शब्द — और वे अभिलेखागार जहाँ सदियों की काग़ज़ी कार्रवाई प्रतीक्षा करती है।",
      mr: "मध्ययुगीन भूतकाळ कसा वाचला जातो: हातनकलांत भरकटणारी पुस्तके, दक्षिण-वर काढलेला नकाशा, अर्थ स्थलांतर करणारे शब्द — आणि जिथे शतकांचे दप्तर वाट पाहते ते अभिलेखागार.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "manuscripts",
        name: { en: "Medieval manuscripts", hi: "मध्यकालीन पांडुलिपियाँ", mr: "मध्ययुगीन हस्तलिखिते" },
        kind: "source",
        prompt: {
          en: "Before printing, scribes copied every book by hand on palm leaf and paper. What are these handwritten books called?",
          hi: "छपाई से पहले हर किताब ताड़पत्र और काग़ज़ पर हाथ से नक़ल होती थी। इन हस्तलिखित पुस्तकों को क्या कहते हैं?",
          mr: "छपाईपूर्वी प्रत्येक पुस्तक ताडपत्रावर आणि कागदावर हाताने नक्कल होई. या हस्तलिखित पुस्तकांना काय म्हणतात?",
        },
        statement: {
          en: "Manuscripts are hand-copied books — and every copyist's slip made the versions drift a little further apart.",
          hi: "पांडुलिपियाँ हाथ से नक़ल की गई किताबें हैं — और हर नक़लनवीस की चूक ने प्रतियों को थोड़ा और दूर बहा दिया।",
          mr: "हस्तलिखिते म्हणजे हाताने नक्कल केलेली पुस्तके — आणि प्रत्येक नकलनविसाच्या चुकीने प्रती थोड्या अधिक भरकटल्या.",
        },
        detail: {
          en: "Historians set many copies of one text side by side and reason backwards to what the author probably wrote.",
          hi: "इतिहासकार एक ही पाठ की कई प्रतियाँ आमने-सामने रखते हैं और उल्टा तर्क कर वहाँ पहुँचते हैं जो लेखक ने शायद लिखा था।",
          mr: "इतिहासकार एकाच मजकुराच्या अनेक प्रती शेजारी ठेवतात आणि उलटा तर्क करत लेखकाने बहुधा काय लिहिले असावे तिथे पोहोचतात.",
        },
        extra: {
          en: "No printing press meant no two identical books — every library was a library of cousins.",
          hi: "छापाख़ाना न होने का अर्थ था कोई दो एक-सी किताबें नहीं — हर पुस्तकालय चचेरे भाइयों का पुस्तकालय था।",
          mr: "छापखाना नसणे म्हणजे कोणतीही दोन सारखी पुस्तके नाहीत — प्रत्येक ग्रंथालय चुलतभावंडांचे ग्रंथालय होते.",
        },
        pair: {
          left: {
            en: "The scribe's hand-copied book",
            hi: "नक़लनवीस की हस्तलिखित किताब",
            mr: "नकलनविसाचे हस्तलिखित पुस्तक",
          },
          right: { en: "versions that drift", hi: "बहकती प्रतियाँ", mr: "भरकटणाऱ्या प्रती" },
        },
      },
      {
        id: "idrisi",
        name: { en: "Al-Idrisi's map", hi: "अल-इदरीसी का नक़्शा", mr: "अल-इद्रिसीचा नकाशा" },
        kind: "source",
        prompt: {
          en: "Which Arab geographer's map of 1154 drew India with the SOUTH at the top, faithful to its own convention?",
          hi: "किस अरब भूगोलवेत्ता का 1154 का नक़्शा भारत को दक्षिण ऊपर रखकर खींचता है, अपनी ही रीति का पक्का?",
          mr: "कोणत्या अरब भूगोलतज्ज्ञाचा 1154 चा नकाशा भारताला दक्षिण वर ठेवून काढतो, आपल्याच रीतीशी प्रामाणिक?",
        },
        statement: {
          en: "Al-Idrisi's 1154 map shows India upside-down to our eyes — a reminder that map conventions are choices, not laws.",
          hi: "अल-इदरीसी का 1154 का नक़्शा हमारी आँखों को उल्टा भारत दिखाता है — याद दिलाता हुआ कि नक़्शों की रीतियाँ चुनाव हैं, नियम नहीं।",
          mr: "अल-इद्रिसीचा 1154 चा नकाशा आपल्या डोळ्यांना उलटा भारत दाखवतो — आठवण देत की नकाशांच्या रीती निवडी आहेत, नियम नाहीत.",
        },
        pair: {
          left: {
            en: "South drawn at the top",
            hi: "ऊपर खिंचा दक्षिण",
            mr: "वर काढलेली दक्षिण",
          },
          right: {
            en: "a convention, not an error",
            hi: "रीति, ग़लती नहीं",
            mr: "रीत, चूक नव्हे",
          },
        },
      },
      {
        id: "hindustan",
        name: { en: "The word 'Hindustan'", hi: "'हिंदुस्तान' शब्द", mr: "'हिंदुस्थान' शब्द" },
        kind: "idea",
        prompt: {
          en: "Which word meant the Punjab-Ganga plains to thirteenth-century writers, and only slowly stretched to name the whole subcontinent?",
          hi: "कौन-सा शब्द तेरहवीं सदी के लेखकों के लिए पंजाब-गंगा के मैदान भर था, और धीरे-धीरे ही पूरे उपमहाद्वीप का नाम बना?",
          mr: "कोणता शब्द तेराव्या शतकातील लेखकांसाठी फक्त पंजाब-गंगेची मैदाने होता, आणि हळूहळूच सबंध उपखंडाचे नाव झाला?",
        },
        statement: {
          en: "'Hindustan' stretched over the centuries — a river-plain's name that slowly grew into a subcontinent's.",
          hi: "'हिंदुस्तान' सदियों में फैला — नदी-मैदान का नाम जो धीरे-धीरे उपमहाद्वीप का नाम बन गया।",
          mr: "'हिंदुस्थान' शतकांत विस्तारला — नदी-मैदानाचे नाव हळूहळू उपखंडाचे नाव झाले.",
        },
        detail: {
          en: "Words are sources too — track a word's reach across texts and you track an idea's growth.",
          hi: "शब्द भी स्रोत हैं — ग्रंथों में किसी शब्द की पहुँच का पीछा कीजिए और आप एक विचार की बाढ़त का पीछा करेंगे।",
          mr: "शब्दही साधने आहेत — ग्रंथांत एखाद्या शब्दाच्या पोहोचेचा माग काढा आणि तुम्ही एका कल्पनेच्या वाढीचा माग काढाल.",
        },
        extra: {
          en: "'Foreigner' once meant any stranger to one's own village, whatever their country — meanings migrate.",
          hi: "'परदेसी' का अर्थ कभी अपने गाँव का कोई भी अजनबी था, देश चाहे जो हो — अर्थ प्रवास करते हैं।",
          mr: "'परदेशी' म्हणजे कधी आपल्या गावाला अनोळखी असा कोणीही, देश कोणताही असो — अर्थ स्थलांतर करतात.",
        },
        pair: {
          left: { en: "A word that grew", hi: "बढ़ता हुआ शब्द", mr: "वाढलेला शब्द" },
          right: {
            en: "plains first, subcontinent later",
            hi: "पहले मैदान, फिर उपमहाद्वीप",
            mr: "आधी मैदाने, मग उपखंड",
          },
        },
      },
      {
        id: "persian-wheel",
        name: { en: "The Persian wheel", hi: "रहट (फ़ारसी चक्र)", mr: "रहाटगाडगे (पर्शियन चाक)" },
        kind: "technology",
        prompt: {
          en: "Which water-lifting wheel, new to this thousand years, let fields drink steadily from deep wells?",
          hi: "इस हज़ार साल में आया कौन-सा जल-उठाऊ चक्र खेतों को गहरे कुओं से लगातार पिलाने लगा?",
          mr: "या हजार वर्षांत आलेले कोणते पाणी-उपसणारे चाक शेतांना खोल विहिरींतून सतत पाजू लागले?",
        },
        statement: {
          en: "The Persian wheel lifted well-water for irrigation — one of the era's quiet, field-changing arrivals, with the spinning wheel and firearms beside it.",
          hi: "रहट ने सिंचाई के लिए कुएँ का पानी उठाया — उस दौर की ख़ामोश, खेत बदल देने वाली आमदों में से एक; चरखा और आग्नेयास्त्र उसके साथ आए।",
          mr: "रहाटगाडग्याने सिंचनासाठी विहिरीचे पाणी उपसले — त्या काळातील शांत, शेते बदलणाऱ्या आगमनांपैकी एक; चरखा आणि बंदुका त्याच्यासोबत आल्या.",
        },
        pair: {
          left: { en: "The wheel at the well", hi: "कुएँ पर चक्र", mr: "विहिरीवरचे चाक" },
          right: {
            en: "fields drinking deeper",
            hi: "गहरा पीते खेत",
            mr: "खोलवर पिणारी शेते",
          },
        },
      },
      {
        id: "jatis",
        name: { en: "Jatis", hi: "जातियाँ", mr: "जाती" },
        kind: "society",
        prompt: {
          en: "As society grew more complex, people were graded into which sub-castes ranked by occupation and birth?",
          hi: "समाज के जटिल होते जाने पर लोग किन उप-वर्गों में बाँटे गए, जिनका दर्जा पेशे और जन्म से तय होता था?",
          mr: "समाज गुंतागुंतीचा होत गेल्यावर लोक कोणत्या पोट-वर्गांत विभागले गेले, ज्यांचा दर्जा धंद्याने आणि जन्माने ठरे?",
        },
        statement: {
          en: "Jatis were sub-castes ranked by work and birth — their rules framed and enforced by village and caste councils.",
          hi: "जातियाँ काम और जन्म से क्रमबद्ध उप-वर्ग थीं — उनके नियम गाँव और जाति की पंचायतें गढ़ती और लागू करती थीं।",
          mr: "जाती म्हणजे काम आणि जन्माने क्रम लावलेले पोट-वर्ग — त्यांचे नियम गाव आणि जातीच्या पंचायती घडवत आणि राबवत.",
        },
        pair: {
          left: {
            en: "Rank written by birth",
            hi: "जन्म से लिखा दर्जा",
            mr: "जन्माने लिहिलेला दर्जा",
          },
          right: {
            en: "councils enforcing rules",
            hi: "नियम लागू करतीं पंचायतें",
            mr: "नियम राबवणाऱ्या पंचायती",
          },
        },
      },
      {
        id: "archive",
        name: { en: "The archive", hi: "अभिलेखागार", mr: "अभिलेखागार" },
        kind: "source",
        prompt: {
          en: "Which storehouse keeps old documents safe — the historian's treasury of letters, orders and account-books?",
          hi: "कौन-सा भंडार पुराने दस्तावेज़ सहेजता है — चिट्ठियों, फ़रमानों और बही-खातों का इतिहासकार का ख़ज़ाना?",
          mr: "कोणते कोठार जुनी कागदपत्रे जपते — पत्रे, हुकूम आणि जमाखर्चाच्या वह्यांचा इतिहासकाराचा खजिना?",
        },
        statement: {
          en: "An archive is a storehouse of documents — where the past's paperwork sits filed, waiting for its readers.",
          hi: "अभिलेखागार दस्तावेज़ों का भंडार है — जहाँ अतीत की काग़ज़ी कार्रवाई फ़ाइलों में बैठी अपने पाठकों की राह देखती है।",
          mr: "अभिलेखागार म्हणजे कागदपत्रांचे कोठार — जिथे भूतकाळाचे दप्तर फायलींत बसून आपल्या वाचकांची वाट पाहते.",
        },
        pair: {
          left: {
            en: "The document storehouse",
            hi: "दस्तावेज़ों का भंडार",
            mr: "कागदपत्रांचे कोठार",
          },
          right: {
            en: "paperwork awaiting readers",
            hi: "पाठकों की राह देखते काग़ज़",
            mr: "वाचकांची वाट पाहणारे कागद",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the source to what it best reveals: A-a manuscript copied five times, B-a temple's carved praise of its king, C-a merchant's account-book in an archive. Which trio is right?",
          hi: "स्रोत को उसकी सबसे अच्छी गवाही से मिलाइए: अ-पाँच बार नक़ल हुई पांडुलिपि, ब-मंदिर पर राजा की तराशी स्तुति, स-अभिलेखागार में व्यापारी की बही। कौन-सी तिकड़ी सही है?",
          mr: "साधनाला त्याच्या उत्तम साक्षीशी जुळवा: अ-पाचदा नक्कल झालेले हस्तलिखित, ब-मंदिरावरची राजाची कोरलेली स्तुती, क-अभिलेखागारातली व्यापाऱ्याची वही. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: how texts change in copying · B: how kings wished to be seen · C: what things actually cost",
            hi: "अ: नक़ल में पाठ कैसे बदलते हैं · ब: राजा कैसे दिखना चाहते थे · स: चीज़ों के असली दाम",
            mr: "अ: नकलेत मजकूर कसे बदलतात · ब: राजांना कसे दिसायचे होते · क: वस्तूंच्या खऱ्या किमती",
          },
          {
            en: "A: what things cost · B: how texts change · C: how kings wished to be seen",
            hi: "अ: चीज़ों के दाम · ब: पाठ कैसे बदलते हैं · स: राजा कैसे दिखना चाहते थे",
            mr: "अ: वस्तूंच्या किमती · ब: मजकूर कसे बदलतात · क: राजांना कसे दिसायचे होते",
          },
          {
            en: "A: how kings wished to be seen · B: what things cost · C: how texts change",
            hi: "अ: राजा कैसे दिखना चाहते थे · ब: चीज़ों के दाम · स: पाठ कैसे बदलते हैं",
            mr: "अ: राजांना कसे दिसायचे होते · ब: वस्तूंच्या किमती · क: मजकूर कसे बदलतात",
          },
          {
            en: "A: how texts change · B: what things cost · C: how kings wished to be seen",
            hi: "अ: पाठ कैसे बदलते हैं · ब: चीज़ों के दाम · स: राजा कैसे दिखना चाहते थे",
            mr: "अ: मजकूर कसे बदलतात · ब: वस्तूंच्या किमती · क: राजांना कसे दिसायचे होते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each source answers the question it was made for. Five copies of a manuscript, laid side by side, show the drift of scribes' hands. Carved praise was commissioned by the throne — it testifies to ambition, not events. And the account-book, written for no audience but the ledger, is the most honest about prices and wages. Ask a source only what it can know.",
          hi: "हर स्रोत उसी सवाल का जवाब देता है जिसके लिए वह बना। पांडुलिपि की पाँच प्रतियाँ आमने-सामने रखिए तो नक़लनवीसों के हाथों का बहाव दिखता है। तराशी स्तुति सिंहासन ने बनवाई — वह घटनाओं की नहीं, महत्वाकांक्षा की गवाह है। और बही, जो सिवा खाते के किसी पाठक के लिए नहीं लिखी गई, दामों-मज़दूरियों पर सबसे ईमानदार है। स्रोत से वही पूछिए जो वह जान सकता है।",
          mr: "प्रत्येक साधन ज्यासाठी बनले त्याच प्रश्नाचे उत्तर देते. हस्तलिखिताच्या पाच प्रती शेजारी ठेवा आणि नकलनविसांच्या हातांचा प्रवाह दिसतो. कोरलेली स्तुती सिंहासनाने करवली — ती घटनांची नव्हे, महत्त्वाकांक्षेची साक्षीदार. आणि वही, जी खात्याशिवाय कोणा वाचकासाठी लिहिली नाही, किमती-मजुरीबद्दल सर्वांत प्रामाणिक. साधनाला तेच विचारा जे त्याला ठाऊक असू शकते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A historian reads a 1300s text that says a king ruled 'all of Hindustan' — and refuses to conclude he ruled the whole subcontinent. Why is the refusal good history?",
          hi: "एक इतिहासकार 1300 के दशक का पाठ पढ़ता है जिसमें राजा 'पूरे हिंदुस्तान' का शासक कहा गया है — और यह निष्कर्ष निकालने से इनकार करता है कि वह पूरे उपमहाद्वीप पर राज करता था। यह इनकार अच्छा इतिहास क्यों है?",
          mr: "एक इतिहासकार 1300 च्या दशकातला मजकूर वाचतो ज्यात राजा 'साऱ्या हिंदुस्थानचा' शासक म्हटला आहे — आणि तो सबंध उपखंडावर राज्य करत होता असा निष्कर्ष काढायला नकार देतो. हा नकार चांगला इतिहास का?",
        },
        choices: [
          {
            en: "Because in the 1300s 'Hindustan' named only the northern plains — reading today's meaning into an old word plants a modern idea in a medieval mouth",
            hi: "क्योंकि 1300 के दशक में 'हिंदुस्तान' केवल उत्तरी मैदानों का नाम था — पुराने शब्द में आज का अर्थ पढ़ना मध्यकालीन मुँह में आधुनिक विचार रखना है",
            mr: "कारण 1300 च्या दशकात 'हिंदुस्थान' फक्त उत्तरेच्या मैदानांचे नाव होते — जुन्या शब्दात आजचा अर्थ वाचणे म्हणजे मध्ययुगीन तोंडात आधुनिक कल्पना घालणे",
          },
          {
            en: "Because medieval writers always lied about their kings",
            hi: "क्योंकि मध्यकालीन लेखक अपने राजाओं के बारे में हमेशा झूठ बोलते थे",
            mr: "कारण मध्ययुगीन लेखक आपल्या राजांबद्दल नेहमी खोटे बोलत",
          },
          {
            en: "Because no king in that era ruled anything at all",
            hi: "क्योंकि उस दौर में कोई राजा कुछ भी शासित नहीं करता था",
            mr: "कारण त्या काळात कोणी राजा काहीच शासत नव्हता",
          },
          {
            en: "Because old texts should never be used as evidence",
            hi: "क्योंकि पुराने पाठ कभी प्रमाण नहीं बनाए जाने चाहिए",
            mr: "कारण जुने मजकूर कधी पुरावा म्हणून वापरू नयेत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Words carry dates the way coins do. 'Hindustan' in a 1300s chronicle is the Punjab-Ganga plains; the same word today spans the subcontinent. The claim in the text may be perfectly true in ITS dictionary and false in ours. Good history translates the vocabulary before weighing the claim — otherwise the historian, not the source, invents the empire.",
          hi: "शब्दों पर सिक्कों की तरह तारीख़ें होती हैं। 1300 के इतिवृत्त में 'हिंदुस्तान' पंजाब-गंगा के मैदान हैं; वही शब्द आज उपमहाद्वीप नापता है। पाठ का दावा उसके शब्दकोश में बिलकुल सच और हमारे में झूठ हो सकता है। अच्छा इतिहास दावा तौलने से पहले शब्दावली का अनुवाद करता है — वरना साम्राज्य स्रोत नहीं, इतिहासकार गढ़ बैठता है।",
          mr: "शब्दांवर नाण्यांसारख्या तारखा असतात. 1300 च्या बखरीतला 'हिंदुस्थान' म्हणजे पंजाब-गंगेची मैदाने; तोच शब्द आज उपखंड मोजतो. मजकुरातला दावा त्याच्या शब्दकोशात पूर्ण खरा आणि आपल्यात खोटा असू शकतो. चांगला इतिहास दावा तोलण्याआधी शब्दसंग्रहाचे भाषांतर करतो — नाहीतर साम्राज्य साधन नव्हे, इतिहासकार घडवून बसतो.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — New Kings and Kingdoms (samantas, Kanauj and the Cholas)    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-7-new-kings-kingdoms",
    subject: "HISTORY",
    classLevel: 7,
    chapter: {
      en: "Chapter 2 — New Kings and Kingdoms",
      hi: "अध्याय 2 — नए राजा और उनके राज्य",
      mr: "प्रकरण 2 — नवे राजे आणि त्यांची राज्ये",
    },
    name: {
      en: "New Kings and Kingdoms",
      hi: "नए राजा और उनके राज्य",
      mr: "नवे राजे आणि त्यांची राज्ये",
    },
    summary: {
      en: "Chiefs who grew into kings, three dynasties quarrelling over one city, praise carved to order — and the Chola south, where temples ran towns and village committees were drawn from a pot.",
      hi: "सरदार जो राजा बन बैठे, एक शहर पर झगड़ते तीन राजवंश, फ़रमाइश पर तराशी स्तुति — और चोल दक्षिण, जहाँ मंदिर नगर चलाते थे और गाँव की समितियाँ घड़े से निकलती थीं।",
      mr: "राजे झालेले सरदार, एका शहरावर भांडणारे तीन राजवंश, हुकुमावरून कोरलेली स्तुती — आणि चोल दक्षिण, जिथे मंदिरे नगरे चालवत आणि गावच्या समित्या घड्यातून निघत.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "samantas",
        name: { en: "The samantas", hi: "सामंत", mr: "सामंत" },
        kind: "power",
        prompt: {
          en: "Which subordinate chiefs supplied their overlord kings with troops and tribute — and, growing strong, sometimes crowned themselves?",
          hi: "कौन-से अधीनस्थ सरदार अपने अधिपति राजाओं को सेना और नज़राना देते थे — और ताक़त बढ़ते ही कभी-कभी ख़ुद को ताज पहना बैठते थे?",
          mr: "कोणते दुय्यम सरदार आपल्या अधिपती राजांना सैन्य आणि नजराणा देत — आणि बळ वाढताच कधी स्वतःलाच मुकुट घालत?",
        },
        statement: {
          en: "Samantas were subordinate chiefs — loyal suppliers of tribute who, when strong enough, declared themselves maha-samanta and even king.",
          hi: "सामंत अधीनस्थ सरदार थे — नज़राने के वफ़ादार आपूर्तिकर्ता, जो पर्याप्त बलवान होते ही स्वयं को महासामंत और राजा तक घोषित कर देते थे।",
          mr: "सामंत हे दुय्यम सरदार — नजराण्याचे इमानी पुरवठादार, जे पुरेसे बलवान होताच स्वतःला महासामंत आणि राजाही घोषित करत.",
        },
        detail: {
          en: "The Rashtrakutas began exactly so — subordinates of the Chalukyas who overthrew their own overlord.",
          hi: "राष्ट्रकूट ठीक ऐसे ही उठे — चालुक्यों के अधीनस्थ, जिन्होंने अपने ही अधिपति को उलट दिया।",
          mr: "राष्ट्रकूट नेमके असेच उठले — चालुक्यांचे दुय्यम, ज्यांनी आपल्याच अधिपतीला उलथवले.",
        },
        extra: {
          en: "The ladder worked both ways: today's king could become tomorrow's tribute-payer.",
          hi: "सीढ़ी दोनों ओर चलती थी: आज का राजा कल का नज़राना-दाता बन सकता था।",
          mr: "शिडी दोन्हीकडे चाले: आजचा राजा उद्याचा नजराणा-दाता होऊ शके.",
        },
        pair: {
          left: { en: "The subordinate chief", hi: "अधीनस्थ सरदार", mr: "दुय्यम सरदार" },
          right: {
            en: "tribute today, a crown tomorrow",
            hi: "आज नज़राना, कल ताज",
            mr: "आज नजराणा, उद्या मुकुट",
          },
        },
      },
      {
        id: "tripartite",
        name: { en: "The tripartite struggle", hi: "त्रिपक्षीय संघर्ष", mr: "त्रिपक्षीय संघर्ष" },
        kind: "power",
        prompt: {
          en: "Three dynasties — Gurjara-Pratihara, Rashtrakuta and Pala — fought for which prized Ganga-valley city for generations?",
          hi: "तीन राजवंश — गुर्जर-प्रतिहार, राष्ट्रकूट और पाल — किस बेशक़ीमती गंगा-घाटी नगर के लिए पीढ़ियों लड़ते रहे?",
          mr: "तीन राजवंश — गुर्जर-प्रतिहार, राष्ट्रकूट आणि पाल — कोणत्या मौल्यवान गंगा-खोऱ्यातील नगरासाठी पिढ्यानपिढ्या लढले?",
        },
        statement: {
          en: "The tripartite struggle was a three-cornered contest for Kanauj — command of the rich Ganga valley was the prize.",
          hi: "त्रिपक्षीय संघर्ष कन्नौज के लिए तिकोनी होड़ थी — समृद्ध गंगा-घाटी की कमान ही इनाम थी।",
          mr: "त्रिपक्षीय संघर्ष ही कनौजसाठीची तिकोनी चढाओढ — समृद्ध गंगा-खोऱ्याची सूत्रे हेच बक्षीस.",
        },
        detail: {
          en: "Kanauj meant fertile revenue and imperial prestige — a capital worth three empires' quarrel.",
          hi: "कन्नौज का अर्थ था उपजाऊ राजस्व और साम्राज्यी प्रतिष्ठा — तीन साम्राज्यों के झगड़े लायक़ राजधानी।",
          mr: "कनौज म्हणजे सुपीक महसूल आणि साम्राज्यी प्रतिष्ठा — तीन साम्राज्यांच्या भांडणाइतकी राजधानी.",
        },
        extra: {
          en: "None of the three could hold it long — a centuries-long lesson in overreach.",
          hi: "तीनों में से कोई उसे देर तक न थाम सका — हद से बढ़ने का सदियों लंबा सबक़।",
          mr: "तिघांतले कोणीही ते फार काळ धरू शकले नाही — मर्यादा ओलांडण्याचा शतकांचा धडा.",
        },
        pair: {
          left: {
            en: "Three dynasties, one city",
            hi: "तीन राजवंश, एक नगर",
            mr: "तीन राजवंश, एक नगर",
          },
          right: { en: "Kanauj as the prize", hi: "इनाम में कन्नौज", mr: "बक्षीस म्हणून कनौज" },
        },
      },
      {
        id: "prashastis7",
        name: { en: "Prashastis", hi: "प्रशस्तियाँ", mr: "प्रशस्ती" },
        kind: "source",
        prompt: {
          en: "Which praise-poems, composed and carved for kings, tell us what rulers WANTED to be remembered as?",
          hi: "राजाओं के लिए रची और तराशी गई कौन-सी स्तुति-कविताएँ बताती हैं कि शासक किस रूप में याद किए जाना चाहते थे?",
          mr: "राजांसाठी रचलेल्या आणि कोरलेल्या कोणत्या स्तुति-कविता सांगतात की शासकांना कोणत्या रूपात आठवले जायचे होते?",
        },
        statement: {
          en: "Prashastis are carved praise — history as kings wished it read: valuable evidence, to be handled with tongs.",
          hi: "प्रशस्तियाँ तराशी हुई स्तुति हैं — इतिहास जैसा राजा पढ़वाना चाहते थे: क़ीमती गवाही, चिमटे से थामने लायक़।",
          mr: "प्रशस्ती म्हणजे कोरलेली स्तुती — राजांना वाचवायचा होता तसा इतिहास: मोलाची साक्ष, चिमट्याने धरण्याजोगी.",
        },
        pair: {
          left: {
            en: "Praise carved in stone",
            hi: "पत्थर में तराशी स्तुति",
            mr: "दगडात कोरलेली स्तुती",
          },
          right: {
            en: "how kings wished to be read",
            hi: "राजा जैसा पढ़ा जाना चाहते थे",
            mr: "राजांना हवे तसे वाचले जाणे",
          },
        },
      },
      {
        id: "rajaraja",
        name: { en: "Rajaraja Chola", hi: "राजराज चोल", mr: "राजराज चोल" },
        kind: "ruler",
        prompt: {
          en: "Which Chola king raised the great Brihadishvara temple at Thanjavur and rebuilt his dynasty's power with it?",
          hi: "किस चोल राजा ने तंजावुर में विशाल बृहदीश्वर मंदिर खड़ा किया और उसके साथ अपने वंश की शक्ति फिर गढ़ी?",
          mr: "कोणत्या चोल राजाने तंजावरला भव्य बृहदीश्वर मंदिर उभारले आणि त्यासोबत आपल्या घराण्याची सत्ता पुन्हा घडवली?",
        },
        statement: {
          en: "Rajaraja Chola raised the Thanjavur temple and Chola power together — empire and architecture in a single reign.",
          hi: "राजराज चोल ने तंजावुर का मंदिर और चोल शक्ति साथ-साथ उठाई — एक ही शासन में साम्राज्य और स्थापत्य।",
          mr: "राजराज चोलने तंजावरचे मंदिर आणि चोल सत्ता एकत्र उभारली — एकाच कारकिर्दीत साम्राज्य आणि स्थापत्य.",
        },
        detail: {
          en: "His son Rajendra marched armies to the Ganga and sailed them to Southeast Asia — and took a title naming the feat.",
          hi: "उसके पुत्र राजेंद्र ने सेनाएँ गंगा तक चलाईं और दक्षिण-पूर्व एशिया तक तैराईं — और कारनामे के नाम की उपाधि ली।",
          mr: "त्याचा पुत्र राजेंद्रने सैन्ये गंगेपर्यंत नेली आणि आग्नेय आशियापर्यंत वल्हवली — आणि पराक्रमाच्या नावाची पदवी घेतली.",
        },
        extra: {
          en: "The temple's walls double as a ledger — his officials' records are carved into the stone itself.",
          hi: "मंदिर की दीवारें बही का भी काम करती हैं — उसके अधिकारियों के अभिलेख स्वयं पत्थर में खुदे हैं।",
          mr: "मंदिराच्या भिंती वहीचेही काम करतात — त्याच्या अधिकाऱ्यांच्या नोंदी खुद्द दगडात कोरल्या आहेत.",
        },
        pair: {
          left: { en: "The Thanjavur builder", hi: "तंजावुर का निर्माता", mr: "तंजावरचा उभारणारा" },
          right: {
            en: "empire and temple together",
            hi: "साम्राज्य और मंदिर साथ-साथ",
            mr: "साम्राज्य आणि मंदिर एकत्र",
          },
        },
      },
      {
        id: "temple-hub",
        name: { en: "The temple as a hub", hi: "केंद्र के रूप में मंदिर", mr: "केंद्र म्हणून मंदिर" },
        kind: "society",
        prompt: {
          en: "Chola temples were more than shrines. Which role made them landowner, employer, banker and school in one?",
          hi: "चोल मंदिर पूजाघर भर नहीं थे। किस भूमिका ने उन्हें एक साथ भूस्वामी, नियोक्ता, महाजन और पाठशाला बना दिया?",
          mr: "चोल मंदिरे नुसती देवळे नव्हती. कोणत्या भूमिकेने त्यांना एकाच वेळी जमीनदार, मालक, सावकार आणि पाठशाळा केले?",
        },
        statement: {
          en: "The Chola temple was an economic hub — it owned land, employed hundreds of craftspeople and anchored the whole town around it.",
          hi: "चोल मंदिर आर्थिक केंद्र था — उसके पास ज़मीनें थीं, सैकड़ों कारीगर उसके रोज़गार में थे, और पूरा नगर उसी के गिर्द टिका था।",
          mr: "चोल मंदिर हे आर्थिक केंद्र — त्याच्याकडे जमिनी होत्या, शेकडो कारागीर त्याच्या रोजगारात होते, आणि सारे नगर त्याच्याभोवती वसले होते.",
        },
        pair: {
          left: {
            en: "The shrine that employed",
            hi: "रोज़गार देता पूजाघर",
            mr: "रोजगार देणारे देऊळ",
          },
          right: {
            en: "landowner, bank and school",
            hi: "भूस्वामी, महाजन और पाठशाला",
            mr: "जमीनदार, सावकार आणि पाठशाळा",
          },
        },
      },
      {
        id: "sabha-committees",
        name: {
          en: "The village sabha's committees",
          hi: "गाँव की सभा की समितियाँ",
          mr: "गावसभेच्या समित्या",
        },
        kind: "society",
        prompt: {
          en: "In Chola villages like Uttaramerur, which assemblies ran tanks, gardens and temples through committees drawn by lot?",
          hi: "उत्तरमेरुर जैसे चोल गाँवों में कौन-सी सभाएँ तालाब, बाग़ और मंदिर पर्ची से चुनी समितियों के ज़रिए चलाती थीं?",
          mr: "उत्तरमेरूरसारख्या चोल गावांत कोणत्या सभा तळी, बागा आणि मंदिरे चिठ्ठीने निवडलेल्या समित्यांमार्फत चालवत?",
        },
        statement: {
          en: "The sabha ran Chola village affairs by committee — names drawn by lot from a pot, with eligibility rules carved on the temple wall.",
          hi: "सभा चोल गाँव का कामकाज समितियों से चलाती थी — घड़े से पर्ची निकालकर नाम, और पात्रता के नियम मंदिर की दीवार पर खुदे हुए।",
          mr: "सभा चोल गावाचा कारभार समित्यांनी चालवी — घड्यातून चिठ्ठी काढून नावे, आणि पात्रतेचे नियम मंदिराच्या भिंतीवर कोरलेले.",
        },
        detail: {
          en: "Candidates needed land, learning and clean accounts — and a cooling-off period after each term served.",
          hi: "उम्मीदवारों को चाहिए थी ज़मीन, विद्या और बेदाग़ हिसाब — और हर कार्यकाल के बाद विश्राम की अवधि।",
          mr: "उमेदवारांना हवी होती जमीन, विद्या आणि स्वच्छ हिशेब — आणि प्रत्येक कारकिर्दीनंतर विश्रांतीचा काळ.",
        },
        extra: {
          en: "A young boy drew the palm-leaf ballots from the pot — selection made hard to rig by design.",
          hi: "घड़े से ताड़पत्र की पर्चियाँ एक बालक निकालता था — चयन को धाँधली से बचाने की सोची-समझी बनावट।",
          mr: "घड्यातून ताडपत्राच्या चिठ्ठ्या एक मुलगा काढी — निवड हेराफेरीपासून वाचवण्याची विचारपूर्वक रचना.",
        },
        pair: {
          left: {
            en: "Names drawn from a pot",
            hi: "घड़े से निकले नाम",
            mr: "घड्यातून निघालेली नावे",
          },
          right: {
            en: "committees for tanks and temples",
            hi: "तालाबों-मंदिरों की समितियाँ",
            mr: "तळी-मंदिरांच्या समित्या",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Place each dynasty in its home region: A-Palas, B-Rashtrakutas, C-Gurjara-Pratiharas. Which trio is right?",
          hi: "हर राजवंश को उसके घर-क्षेत्र में रखिए: अ-पाल, ब-राष्ट्रकूट, स-गुर्जर-प्रतिहार। कौन-सी तिकड़ी सही है?",
          mr: "प्रत्येक राजवंशाला त्याच्या घर-प्रदेशात ठेवा: अ-पाल, ब-राष्ट्रकूट, क-गुर्जर-प्रतिहार. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: Bengal · B: the Deccan · C: the western plains",
            hi: "अ: बंगाल · ब: दक्कन · स: पश्चिमी मैदान",
            mr: "अ: बंगाल · ब: दख्खन · क: पश्चिमेची मैदाने",
          },
          {
            en: "A: the Deccan · B: the western plains · C: Bengal",
            hi: "अ: दक्कन · ब: पश्चिमी मैदान · स: बंगाल",
            mr: "अ: दख्खन · ब: पश्चिमेची मैदाने · क: बंगाल",
          },
          {
            en: "A: the western plains · B: Bengal · C: the Deccan",
            hi: "अ: पश्चिमी मैदान · ब: बंगाल · स: दक्कन",
            mr: "अ: पश्चिमेची मैदाने · ब: बंगाल · क: दख्खन",
          },
          {
            en: "A: Bengal · B: the western plains · C: the Deccan",
            hi: "अ: बंगाल · ब: पश्चिमी मैदान · स: दक्कन",
            mr: "अ: बंगाल · ब: पश्चिमेची मैदाने · क: दख्खन",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Palas in Bengal to the east, Rashtrakutas in the Deccan to the south, Gurjara-Pratiharas across the western plains — three home bases ringing the one city they all coveted. Kanauj sat in the middle like a prize on a table with three chairs; the geography explains the quarrel.",
          hi: "पूरब में बंगाल के पाल, दक्षिण में दक्कन के राष्ट्रकूट, पश्चिमी मैदानों में गुर्जर-प्रतिहार — तीन घर-अड्डे उस एक नगर को घेरे हुए जिसकी तीनों को चाह थी। कन्नौज बीच में यों बैठा था जैसे तीन कुर्सियों वाली मेज़ पर इनाम; भूगोल ही झगड़े की व्याख्या है।",
          mr: "पूर्वेला बंगालचे पाल, दक्षिणेला दख्खनचे राष्ट्रकूट, पश्चिमेच्या मैदानांत गुर्जर-प्रतिहार — तिघांनाही हव्या असलेल्या एका नगराभोवती तीन घर-तळ. कनौज मध्ये असे बसले होते जसे तीन खुर्च्यांच्या टेबलावरचे बक्षीस; भूगोलच भांडणाचे स्पष्टीकरण.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A prashasti says its king 'conquered the whole earth up to the oceans'. The historian keeps the inscription but rejects the claim. What is the inscription still good evidence FOR?",
          hi: "एक प्रशस्ति कहती है कि उसके राजा ने 'समुद्रों तक सारी धरती जीत ली'। इतिहासकार अभिलेख रखता है पर दावा नकार देता है। वह अभिलेख फिर भी किस बात की अच्छी गवाही है?",
          mr: "एक प्रशस्ती म्हणते की तिच्या राजाने 'सागरांपर्यंत सारी पृथ्वी जिंकली'. इतिहासकार शिलालेख ठेवतो पण दावा नाकारतो. तो शिलालेख तरीही कशाची चांगली साक्ष आहे?",
        },
        choices: [
          {
            en: "For what kings and their courts VALUED — the ideals, boasts and audiences of power — even where the deeds themselves are inflated",
            hi: "इस बात की कि राजा और उनके दरबार किसे मूल्य देते थे — सत्ता के आदर्श, डींगें और श्रोता — भले कारनामे बढ़ा-चढ़ाकर लिखे हों",
            mr: "राजे आणि त्यांचे दरबार कशाला किंमत देत याची — सत्तेचे आदर्श, बढाया आणि श्रोते — जरी पराक्रम फुगवलेले असले तरी",
          },
          {
            en: "For the exact borders of the kingdom that year",
            hi: "उस वर्ष राज्य की ठीक-ठीक सीमाओं की",
            mr: "त्या वर्षीच्या राज्याच्या नेमक्या सीमांची",
          },
          {
            en: "For nothing — exaggerated sources must be discarded whole",
            hi: "किसी की नहीं — बढ़ा-चढ़ाए स्रोत पूरे फेंकने चाहिए",
            mr: "कशाचीच नाही — फुगवलेली साधने पूर्ण टाकावीत",
          },
          {
            en: "For proof that oceans were closer in those days",
            hi: "इसका प्रमाण कि उन दिनों समुद्र पास थे",
            mr: "त्या काळी समुद्र जवळ होते याचा पुरावा",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A boast is a fact about the boaster. The carved claim misreports geography but reports ambition exactly: what a king wished the world to believe, which gods he invoked, which audience he addressed. Historians split every source into what it SAYS and what it SHOWS — and a prashasti shows the theatre of kingship even when its script exaggerates. Discarding it whole would throw away the best window into how power presented itself.",
          hi: "डींग डींग मारने वाले के बारे में तथ्य है। तराशा दावा भूगोल ग़लत बताता है पर महत्वाकांक्षा ठीक-ठीक दर्ज करता है: राजा दुनिया से क्या मनवाना चाहता था, किन देवताओं को पुकारता था, किन श्रोताओं से बोलता था। इतिहासकार हर स्रोत को दो हिस्सों में बाँटते हैं — वह जो कहता है, और वह जो दिखाता है — और प्रशस्ति राजत्व का रंगमंच दिखाती है, भले उसकी पटकथा बढ़ा-चढ़ाकर लिखी हो। उसे पूरा फेंकना सत्ता की आत्म-प्रस्तुति की सबसे अच्छी खिड़की फेंक देना होता।",
          mr: "बढाई ही बढाई मारणाऱ्याबद्दलचे तथ्य. कोरलेला दावा भूगोल चुकीचा सांगतो पण महत्त्वाकांक्षा नेमकी नोंदवतो: राजाला जगाकडून काय मानवून घ्यायचे होते, कोणत्या देवांना तो हाक मारी, कोणत्या श्रोत्यांशी बोले. इतिहासकार प्रत्येक साधन दोन भागांत वाटतात — ते काय म्हणते, आणि काय दाखवते — आणि प्रशस्ती राजेपणाचा रंगमंच दाखवते, तिची संहिता फुगवलेली असली तरी. ती पूर्ण टाकणे म्हणजे सत्तेच्या आत्म-सादरीकरणाची उत्तम खिडकी फेकून देणे.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — The Delhi Sultans (a throne, its markets and its coins)     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-7-delhi-sultans",
    subject: "HISTORY",
    classLevel: 7,
    chapter: {
      en: "Chapter 3 — The Delhi Sultans",
      hi: "अध्याय 3 — दिल्ली के सुल्तान",
      mr: "प्रकरण 3 — दिल्लीचे सुलतान",
    },
    name: { en: "The Delhi Sultans", hi: "दिल्ली के सुल्तान", mr: "दिल्लीचे सुलतान" },
    summary: {
      en: "Delhi becomes a capital: a queen resented for her sex, prices fixed to feed an army, bronze coins declared silver — and the old circle chaining every throne to its peasants.",
      hi: "दिल्ली राजधानी बनती है: अपने स्त्री होने पर कोसी गई एक सुल्तान, सेना पालने को बाँधे गए दाम, चाँदी घोषित काँसे के सिक्के — और वह पुराना चक्र जो हर सिंहासन को उसके किसानों से बाँधता है।",
      mr: "दिल्ली राजधानी होते: स्त्री असण्यावरून दूषणे दिली गेलेली एक सुलतान, सैन्य पोसण्यासाठी बांधलेल्या किमती, चांदी घोषित केलेली कांस्य नाणी — आणि प्रत्येक सिंहासनाला त्याच्या शेतकऱ्यांशी बांधणारे जुने चक्र.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "raziyya",
        name: { en: "Raziyya Sultan", hi: "रज़िया सुल्तान", mr: "रझिया सुलतान" },
        kind: "ruler",
        prompt: {
          en: "Which ruler, Iltutmish's daughter, took Delhi's throne in 1236 — and was resented by the nobles simply for being a woman?",
          hi: "इल्तुतमिश की बेटी, कौन-सी शासक 1236 में दिल्ली के तख़्त पर बैठी — और अमीरों की आँखों में केवल स्त्री होने के कारण खटकी?",
          mr: "इल्तुतमिशची मुलगी, कोणती शासक 1236 मध्ये दिल्लीच्या तख्तावर बसली — आणि केवळ स्त्री असल्यामुळे सरदारांच्या डोळ्यांत खुपली?",
        },
        statement: {
          en: "Raziyya ruled Delhi from 1236 to 1240 — able by her own chronicler's admission, unacceptable to the nobles for her sex alone.",
          hi: "रज़िया ने 1236 से 1240 तक दिल्ली पर शासन किया — स्वयं इतिवृत्तकार के क़बूल में योग्य, अमीरों को केवल स्त्रीत्व के कारण नामंज़ूर।",
          mr: "रझियाने 1236 ते 1240 दिल्लीवर राज्य केले — खुद्द बखरकाराच्या कबुलीत सक्षम, सरदारांना केवळ स्त्रीत्वामुळे नामंजूर.",
        },
        detail: {
          en: "The chronicler Minhaj wrote she was more able than her brothers — and still judged her reign improper.",
          hi: "इतिवृत्तकार मिनहाज ने लिखा कि वह अपने भाइयों से अधिक योग्य थी — और फिर भी उसके शासन को अनुचित ठहराया।",
          mr: "बखरकार मिनहाजने लिहिले की ती आपल्या भावांहून अधिक सक्षम होती — आणि तरीही तिची कारकीर्द अनुचित ठरवली.",
        },
        extra: {
          en: "She rode and dressed as sultans did, refusing seclusion — the throne, she held, had no gender.",
          hi: "वह सुल्तानों की तरह सवार होती और वस्त्र पहनती थी, परदे से इनकार करती हुई — उसका मत था, तख़्त का कोई लिंग नहीं।",
          mr: "ती सुलतानांसारखी स्वार होई आणि पोशाख करी, पडदा नाकारत — तिचे मत होते, तख्ताला लिंग नसते.",
        },
        pair: {
          left: {
            en: "Iltutmish's abler child",
            hi: "इल्तुतमिश की अधिक योग्य संतान",
            mr: "इल्तुतमिशचे अधिक सक्षम अपत्य",
          },
          right: { en: "resented for her sex", hi: "स्त्रीत्व पर खटकी", mr: "स्त्रीत्वावरून खुपलेली" },
        },
      },
      {
        id: "alauddin-markets",
        name: {
          en: "Alauddin Khalji's market control",
          hi: "अलाउद्दीन ख़लजी का बाज़ार-नियंत्रण",
          mr: "अलाउद्दीन खल्जीचे बाजार-नियंत्रण",
        },
        kind: "policy",
        prompt: {
          en: "Which sultan fixed Delhi's grain prices by decree and paid his huge army in cash, watching the markets with spies?",
          hi: "किस सुल्तान ने फ़रमान से दिल्ली के अनाज के दाम बाँधे और अपनी विशाल सेना को नक़द वेतन दिया, जासूसों से बाज़ार पर नज़र रखते हुए?",
          mr: "कोणत्या सुलतानाने हुकुमाने दिल्लीच्या धान्याच्या किमती बांधल्या आणि आपल्या प्रचंड सैन्याला रोख पगार दिला, हेरांकरवी बाजारावर नजर ठेवत?",
        },
        statement: {
          en: "Alauddin Khalji fixed prices and paid soldiers in cash — cheap, controlled grain kept his great army affordable.",
          hi: "अलाउद्दीन ख़लजी ने दाम बाँधे और सिपाहियों को नक़द दिया — सस्ता, नियंत्रित अनाज ही उसकी बड़ी सेना को सधने देता था।",
          mr: "अलाउद्दीन खल्जीने किमती बांधल्या आणि शिपायांना रोख दिले — स्वस्त, नियंत्रित धान्यच त्याचे मोठे सैन्य परवडण्याजोगे ठेवी.",
        },
        detail: {
          en: "His spies reported every overcharge; merchants obeyed because the surveillance was real and the punishments prompt.",
          hi: "उसके जासूस हर ज़्यादा वसूली की ख़बर देते; व्यापारी मानते थे क्योंकि निगरानी असली थी और सज़ा फ़ौरी।",
          mr: "त्याचे हेर प्रत्येक जादा वसुलीची खबर देत; व्यापारी ऐकत कारण पाळत खरी होती आणि शिक्षा तत्काळ.",
        },
        extra: {
          en: "The system served the army first — the consumer's relief was a by-product of military arithmetic.",
          hi: "व्यवस्था पहले सेना की सेवा करती थी — उपभोक्ता की राहत सैन्य-गणित की उप-उपज थी।",
          mr: "व्यवस्था आधी सैन्याची सेवा करी — ग्राहकाचा दिलासा हे लष्करी गणिताचे उप-उत्पादन.",
        },
        pair: {
          left: {
            en: "Prices fixed by decree",
            hi: "फ़रमान से बँधे दाम",
            mr: "हुकुमाने बांधलेल्या किमती",
          },
          right: { en: "an army fed cheaply", hi: "सस्ते में पली सेना", mr: "स्वस्तात पोसलेले सैन्य" },
        },
      },
      {
        id: "token-currency",
        name: { en: "The token currency", hi: "सांकेतिक मुद्रा", mr: "प्रतीक चलन" },
        kind: "policy",
        prompt: {
          en: "Which Tughluq experiment declared cheap bronze coins equal in value to silver — until forgers minted them at home?",
          hi: "किस तुग़लक़ी प्रयोग ने सस्ते काँसे के सिक्कों को चाँदी के बराबर घोषित किया — जब तक जालसाज़ों ने उन्हें घर पर ढालना न शुरू किया?",
          mr: "कोणत्या तुघलकी प्रयोगाने स्वस्त कांस्य नाण्यांना चांदीच्या मोलाची घोषित केले — बनावटखोरांनी ती घरी पाडेपर्यंत?",
        },
        statement: {
          en: "Muhammad Tughluq's token currency made bronze stand for silver — forgeries flooded the bazaars and the experiment collapsed.",
          hi: "मुहम्मद तुग़लक़ की सांकेतिक मुद्रा में काँसा चाँदी के बदले खड़ा हुआ — जालसाज़ी बाज़ारों में उमड़ पड़ी और प्रयोग ढह गया।",
          mr: "मुहम्मद तुघलकाच्या प्रतीक चलनात कांस्य चांदीच्या जागी उभे राहिले — बनावट नाणी बाजारांत लोटली आणि प्रयोग कोसळला.",
        },
        detail: {
          en: "He bought the fakes back in true silver — an honest retreat that bled the treasury white.",
          hi: "उसने नक़ली सिक्के असली चाँदी में वापस ख़रीदे — ईमानदार पीछेहट, जिसने ख़ज़ाना निचोड़ डाला।",
          mr: "त्याने बनावट नाणी खऱ्या चांदीत परत विकत घेतली — प्रामाणिक माघार, जिने खजिना पिळून काढला.",
        },
        extra: {
          en: "The idea outran its tools: money-by-declaration works only where copying is hard and trust is organised.",
          hi: "विचार अपने औज़ारों से आगे निकल गया: घोषणा-भर की मुद्रा वहीं चलती है जहाँ नक़ल कठिन और भरोसा संगठित हो।",
          mr: "कल्पना आपल्या हत्यारांच्या पुढे निघाली: घोषणेचे चलन तिथेच चालते जिथे नक्कल कठीण आणि विश्वास संघटित असतो.",
        },
        pair: {
          left: { en: "Bronze declared silver", hi: "चाँदी घोषित काँसा", mr: "चांदी घोषित कांस्य" },
          right: {
            en: "forgers took the invitation",
            hi: "जालसाज़ों ने न्योता क़बूला",
            mr: "बनावटखोरांनी निमंत्रण स्वीकारले",
          },
        },
      },
      {
        id: "ibn-battuta",
        name: { en: "Ibn Battuta", hi: "इब्न बतूता", mr: "इब्न बतूता" },
        kind: "source",
        prompt: {
          en: "Which Moroccan traveller served as a judge in Delhi and left a wide-eyed account of the Sultanate's roads, posts and mangoes?",
          hi: "कौन-सा मोरक्कन यात्री दिल्ली में क़ाज़ी रहा और सल्तनत की सड़कों, डाक-चौकियों और आमों का अचंभित वृत्तांत छोड़ गया?",
          mr: "कोणता मोरोक्कन प्रवासी दिल्लीत काझी राहिला आणि सल्तनतीचे रस्ते, टपाल-चौक्या आणि आंब्यांचा अचंबित वृत्तांत ठेवून गेला?",
        },
        statement: {
          en: "Ibn Battuta crossed half the world to serve in Delhi — his travel book reads the Sultanate through a stranger's fresh eyes.",
          hi: "इब्न बतूता आधी दुनिया पार कर दिल्ली की नौकरी में आया — उसकी सफ़रनामा सल्तनत को अजनबी की ताज़ा आँखों से पढ़ता है।",
          mr: "इब्न बतूता अर्धे जग ओलांडून दिल्लीच्या चाकरीत आला — त्याचे प्रवासवर्णन सल्तनत परक्याच्या ताज्या डोळ्यांनी वाचते.",
        },
        pair: {
          left: { en: "The Moroccan in Delhi", hi: "दिल्ली में मोरक्कोवासी", mr: "दिल्लीतला मोरोक्कन" },
          right: {
            en: "the Sultanate through fresh eyes",
            hi: "ताज़ा आँखों से सल्तनत",
            mr: "ताज्या डोळ्यांतून सल्तनत",
          },
        },
      },
      {
        id: "jama-mosque",
        name: {
          en: "The congregational mosque",
          hi: "जामा मस्जिद (सामूहिक मस्जिद)",
          mr: "जामा मशीद (सामूहिक मशीद)",
        },
        kind: "building",
        prompt: {
          en: "Which Friday building gathered a city's Muslims into one great courtyard — with rulers building the grandest of all?",
          hi: "कौन-सी जुमे की इमारत शहर भर के मुसलमानों को एक बड़े सहन में जुटाती थी — जिसे शासक सबसे भव्य बनवाते थे?",
          mr: "कोणती शुक्रवारची इमारत शहरातील मुस्लिमांना एका मोठ्या अंगणात जमवी — जी शासक सर्वांत भव्य बांधत?",
        },
        statement: {
          en: "The congregational mosque held the Friday prayer — sultans built them grand, for piety was also prestige.",
          hi: "जामा मस्जिद में जुमे की नमाज़ होती थी — सुल्तान उन्हें भव्य बनवाते थे, क्योंकि इबादत प्रतिष्ठा भी थी।",
          mr: "जामा मशिदीत शुक्रवारची नमाज होई — सुलतान त्या भव्य बांधत, कारण उपासना हीच प्रतिष्ठाही होती.",
        },
        pair: {
          left: { en: "The Friday courtyard", hi: "जुमे का सहन", mr: "शुक्रवारचे अंगण" },
          right: {
            en: "piety doubling as prestige",
            hi: "इबादत, जो प्रतिष्ठा भी",
            mr: "उपासना, जी प्रतिष्ठाही",
          },
        },
      },
      {
        id: "circle-justice",
        name: { en: "The circle of justice", hi: "न्याय का चक्र", mr: "न्यायाचे चक्र" },
        kind: "idea",
        prompt: {
          en: "Which old idea chained king to peasant: no army without salaries, no salaries without revenue, no revenue without prosperous cultivators?",
          hi: "किस पुराने विचार ने राजा को किसान से बाँधा: वेतन बिना सेना नहीं, राजस्व बिना वेतन नहीं, समृद्ध किसान बिना राजस्व नहीं?",
          mr: "कोणत्या जुन्या कल्पनेने राजाला शेतकऱ्याशी बांधले: पगाराविना सैन्य नाही, महसुलाविना पगार नाही, समृद्ध शेतकऱ्याविना महसूल नाही?",
        },
        statement: {
          en: "The circle of justice bound the throne to the field — a king who ruined his peasants ruined, in time, his own army.",
          hi: "न्याय के चक्र ने तख़्त को खेत से बाँधा — जो राजा अपने किसान उजाड़े, वह समय पाकर अपनी ही सेना उजाड़ता है।",
          mr: "न्यायाच्या चक्राने तख्ताला शेताशी बांधले — जो राजा आपले शेतकरी उद्ध्वस्त करतो, तो कालांतराने आपलेच सैन्य उद्ध्वस्त करतो.",
        },
        detail: {
          en: "Advisers pressed it on every sultan — canals, wells and bearable taxes were army policy too.",
          hi: "सलाहकार हर सुल्तान को यही समझाते — नहरें, कुएँ और सहने लायक़ कर भी सैन्य-नीति ही थे।",
          mr: "सल्लागार प्रत्येक सुलतानाला हेच बजावत — कालवे, विहिरी आणि सोसण्याजोगे कर हीही लष्करी नीतीच.",
        },
        extra: {
          en: "It is realism dressed as ethics — mercy argued through the treasury's own ledger.",
          hi: "यह नीति की पोशाक में यथार्थ है — ख़ज़ाने की अपनी बही से लड़ी गई दया की दलील।",
          mr: "हा नीतीच्या पोशाखातला वास्तववाद — खजिन्याच्या स्वतःच्या वहीतून मांडलेला दयेचा युक्तिवाद.",
        },
        pair: {
          left: { en: "King chained to peasant", hi: "किसान से बँधा राजा", mr: "शेतकऱ्याशी बांधलेला राजा" },
          right: { en: "ruin one, ruin both", hi: "एक उजड़ा तो दोनों", mr: "एक उद्ध्वस्त तर दोन्ही" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put these Delhi rulers in the order they reigned. Which sequence is right?",
          hi: "इन दिल्ली शासकों को शासन के क्रम में रखिए। कौन-सा क्रम सही है?",
          mr: "या दिल्ली शासकांना कारकिर्दीच्या क्रमाने लावा. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "Iltutmish → Raziyya → Alauddin Khalji → Muhammad Tughluq",
            hi: "इल्तुतमिश → रज़िया → अलाउद्दीन ख़लजी → मुहम्मद तुग़लक़",
            mr: "इल्तुतमिश → रझिया → अलाउद्दीन खल्जी → मुहम्मद तुघलक",
          },
          {
            en: "Raziyya → Iltutmish → Muhammad Tughluq → Alauddin Khalji",
            hi: "रज़िया → इल्तुतमिश → मुहम्मद तुग़लक़ → अलाउद्दीन ख़लजी",
            mr: "रझिया → इल्तुतमिश → मुहम्मद तुघलक → अलाउद्दीन खल्जी",
          },
          {
            en: "Alauddin Khalji → Raziyya → Iltutmish → Muhammad Tughluq",
            hi: "अलाउद्दीन ख़लजी → रज़िया → इल्तुतमिश → मुहम्मद तुग़लक़",
            mr: "अलाउद्दीन खल्जी → रझिया → इल्तुतमिश → मुहम्मद तुघलक",
          },
          {
            en: "Muhammad Tughluq → Alauddin Khalji → Raziyya → Iltutmish",
            hi: "मुहम्मद तुग़लक़ → अलाउद्दीन ख़लजी → रज़िया → इल्तुतमिश",
            mr: "मुहम्मद तुघलक → अलाउद्दीन खल्जी → रझिया → इल्तुतमिश",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Father before daughter: Iltutmish, then Raziyya in 1236. The Khalji dynasty follows the early sultans, so Alauddin comes next; the Tughluqs follow the Khaljis, placing Muhammad last. Dynasty order — early sultans, Khaljis, Tughluqs — carries the individual reigns with it.",
          hi: "बेटी से पहले पिता: इल्तुतमिश, फिर 1236 में रज़िया। ख़लजी वंश आरंभिक सुल्तानों के बाद आता है, अतः अलाउद्दीन अगला; तुग़लक़ ख़लजियों के बाद, अतः मुहम्मद अंत में। वंश-क्रम — आरंभिक सुल्तान, ख़लजी, तुग़लक़ — अपने साथ शासकों का क्रम भी ढो लाता है।",
          mr: "मुलीआधी वडील: इल्तुतमिश, मग 1236 मध्ये रझिया. खल्जी घराणे सुरुवातीच्या सुलतानांनंतर येते, म्हणून अलाउद्दीन पुढे; तुघलक खल्जींनंतर, म्हणून मुहम्मद शेवटी. घराण्यांचा क्रम — सुरुवातीचे सुलतान, खल्जी, तुघलक — सोबत शासकांचा क्रमही वाहून आणतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Muhammad Tughluq's token coins failed in the 1330s, yet the paper note in your pocket — worth nothing as paper — works fine. What does the modern note have that his bronze coins lacked?",
          hi: "मुहम्मद तुग़लक़ के सांकेतिक सिक्के 1330 के दशक में विफल हुए, फिर भी आपकी जेब का काग़ज़ी नोट — काग़ज़ के तौर पर बेमोल — बख़ूबी चलता है। आधुनिक नोट के पास वह क्या है जो उसके काँसे के सिक्कों के पास नहीं था?",
          mr: "मुहम्मद तुघलकाची प्रतीक नाणी 1330 च्या दशकात फसली, तरी तुमच्या खिशातली कागदी नोट — कागद म्हणून कवडीमोल — व्यवस्थित चालते. आधुनिक नोटेकडे ते काय आहे जे त्याच्या कांस्य नाण्यांकडे नव्हते?",
        },
        choices: [
          {
            en: "A protected monopoly: hard-to-copy printing and one authority everyone trusts — his coins could be minted at any home smithy, so the promise behind them dissolved",
            hi: "संरक्षित एकाधिकार: कठिन नक़ल वाली छपाई और एक सत्ता जिस पर सबको भरोसा — उसके सिक्के किसी भी घरेलू भट्ठी में ढल सकते थे, अतः उनके पीछे का वादा घुल गया",
            mr: "संरक्षित मक्तेदारी: नक्कल कठीण छपाई आणि सर्वांचा विश्वास असलेली एक सत्ता — त्याची नाणी कोणत्याही घरगुती भट्टीत पडत, म्हणून त्यांमागचे वचन विरघळले",
          },
          {
            en: "Paper is naturally more valuable than bronze",
            hi: "काग़ज़ स्वभावतः काँसे से मूल्यवान है",
            mr: "कागद स्वभावतःच कांस्याहून मौल्यवान",
          },
          {
            en: "Modern people are simply more honest",
            hi: "आधुनिक लोग बस ज़्यादा ईमानदार हैं",
            mr: "आधुनिक माणसे नुसती अधिक प्रामाणिक",
          },
          {
            en: "Nothing — paper money also fails within a few years",
            hi: "कुछ नहीं — काग़ज़ी मुद्रा भी कुछ वर्षों में विफल होती है",
            mr: "काहीच नाही — कागदी चलनही काही वर्षांत फसते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Both moneys are promises; the difference is whether the promise can be counterfeited. Tughluq's bronze asked fourteenth-century smiths to refrain from copying what any forge could copy — the promise was open to theft, so it died. A modern note rides on watermarks, threads and a jealously guarded press, plus an authority with a record of honouring it. His idea was sound and four centuries early; money-by-trust needed technology and institutions to make the trust enforceable.",
          hi: "दोनों मुद्राएँ वादे हैं; फ़र्क़ यह कि वादे की जालसाज़ी हो सकती है या नहीं। तुग़लक़ का काँसा चौदहवीं सदी के लोहारों से माँगता था कि वे उस चीज़ की नक़ल न करें जो हर भट्ठी कर सकती थी — वादा चोरी के लिए खुला था, अतः मर गया। आधुनिक नोट जलचिह्नों, धागों और कड़े पहरे वाली छपाई-मशीन पर सवार है, साथ में वादा निभाने का अभिलेख रखने वाली सत्ता। उसका विचार सही था और चार सदी जल्दी — भरोसे की मुद्रा को भरोसा लागू करा सकने वाली तकनीक और संस्थाएँ चाहिए थीं।",
          mr: "दोन्ही चलने वचने आहेत; फरक हा की वचनाची बनावट होऊ शकते का. तुघलकाचे कांस्य चौदाव्या शतकातील लोहारांकडे मागत होते की प्रत्येक भट्टीला जमणारी नक्कल त्यांनी करू नये — वचन चोरीला खुले होते, म्हणून मेले. आधुनिक नोट जलचिन्हे, धागे आणि कडेकोट राखलेल्या छापखान्यावर स्वार आहे, सोबत वचन पाळण्याचा लौकिक असलेली सत्ता. त्याची कल्पना योग्य आणि चार शतके लवकर होती — विश्वासाच्या चलनाला विश्वास राबवू शकणारे तंत्रज्ञान आणि संस्था हव्या होत्या.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — The Mughal Empire (numbers, alliances and paper empires)    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-7-mughal-empire",
    subject: "HISTORY",
    classLevel: 7,
    chapter: {
      en: "Chapter 4 — The Mughal Empire",
      hi: "अध्याय 4 — मुग़ल साम्राज्य",
      mr: "प्रकरण 4 — मुघल साम्राज्य",
    },
    name: { en: "The Mughal Empire", hi: "मुग़ल साम्राज्य", mr: "मुघल साम्राज्य" },
    summary: {
      en: "From Panipat's cannon to the Deccan's long drain: a homesick memoirist, a ruler who governed by inclusion, officers ranked as numbers — and an empire counted on paper by Abul Fazl.",
      hi: "पानीपत की तोपों से दक्कन की लंबी निकासी तक: घर-याद में डूबा संस्मरणकार, समावेश से शासन करने वाला बादशाह, संख्याओं में दर्जाबंद अफ़सर — और अबुल फ़ज़्ल का काग़ज़ पर गिना साम्राज्य।",
      mr: "पानिपतच्या तोफांपासून दख्खनच्या दीर्घ निचऱ्यापर्यंत: घरच्या आठवणीत बुडालेला आत्मचरित्रकार, समावेशाने राज्य करणारा बादशहा, आकड्यांत दर्जा दिलेले अधिकारी — आणि अबुल फजलने कागदावर मोजलेले साम्राज्य.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "babur",
        name: { en: "Babur", hi: "बाबर", mr: "बाबर" },
        kind: "ruler",
        prompt: {
          en: "Which ruler, driven from his homeland Ferghana, won Panipat in 1526 with cannon and wheeling cavalry, planting the Mughal line in India?",
          hi: "अपने वतन फ़रग़ना से खदेड़ा गया कौन-सा शासक 1526 में तोपों और घूमती घुड़सवार सेना से पानीपत जीता, भारत में मुग़ल वंश रोपता हुआ?",
          mr: "आपल्या मायभूमी फरगानातून हुसकावलेला कोणता शासक 1526 मध्ये तोफा आणि वळसा घालणाऱ्या घोडदळाने पानिपत जिंकला, भारतात मुघल वंश रुजवत?",
        },
        statement: {
          en: "Babur won Panipat in 1526 — gunpowder and swift horsemen against a larger army, and a new dynasty took root.",
          hi: "बाबर ने 1526 में पानीपत जीता — बड़ी सेना के विरुद्ध बारूद और फुर्तीले घुड़सवार, और एक नया वंश जम गया।",
          mr: "बाबरने 1526 मध्ये पानिपत जिंकले — मोठ्या सैन्याविरुद्ध दारूगोळा आणि चपळ घोडेस्वार, आणि नवे घराणे रुजले.",
        },
        detail: {
          en: "His memoir, the Baburnama, pauses between battles to grade melons, plan gardens and confess homesickness.",
          hi: "उसका संस्मरण बाबरनामा लड़ाइयों के बीच रुककर ख़रबूज़ों के दर्जे बाँधता, बाग़ रचता और घर की याद क़बूलता है।",
          mr: "त्याचे आत्मचरित्र बाबरनामा लढायांच्या मध्ये थांबून खरबुजांचे दर्जे लावते, बागा आखते आणि घरची ओढ कबूल करते.",
        },
        extra: {
          en: "He carried two legendary bloodlines — Timur's on one side, Chinggis Khan's on the other.",
          hi: "उसमें दो महान वंश-रेखाएँ मिलती थीं — एक ओर तैमूर की, दूसरी ओर चंगेज़ ख़ान की।",
          mr: "त्याच्यात दोन दिग्गज वंशरेषा मिळत — एकीकडे तैमूरची, दुसरीकडे चंगेझ खानाची.",
        },
        pair: {
          left: { en: "The Ferghana exile", hi: "फ़रग़ना का निर्वासित", mr: "फरगानाचा निर्वासित" },
          right: { en: "Panipat, 1526", hi: "पानीपत, 1526", mr: "पानिपत, 1526" },
        },
      },
      {
        id: "akbar",
        name: { en: "Akbar", hi: "अकबर", mr: "अकबर" },
        kind: "ruler",
        prompt: {
          en: "Which Mughal ruled nearly fifty years, sealed alliances with Rajput houses, and hosted debates among all faiths at Fatehpur Sikri?",
          hi: "कौन-सा मुग़ल लगभग पचास वर्ष शासन करता रहा, राजपूत घरानों से गठजोड़ साधे, और फ़तेहपुर सीकरी में सब धर्मों की बहसें करवाता रहा?",
          mr: "कोणता मुघल जवळजवळ पन्नास वर्षे राज्य करत राहिला, राजपूत घराण्यांशी युती बांधल्या, आणि फतेहपूर सिक्रीत सर्व धर्मांच्या चर्चा घडवत राहिला?",
        },
        statement: {
          en: "Akbar governed by inclusion — Rajput marriages, debates in his hall of worship, and the policy he called sulh-i kul: peace with all.",
          hi: "अकबर ने समावेश से शासन किया — राजपूत विवाह, इबादतख़ाने की बहसें, और वह नीति जिसे उसने सुलह-ए-कुल कहा: सबसे शांति।",
          mr: "अकबरने समावेशाने राज्य केले — राजपूत विवाह, इबादतखान्यातल्या चर्चा, आणि त्याने सुलह-इ-कुल म्हटलेले धोरण: सर्वांशी शांती.",
        },
        detail: {
          en: "Listening to priests of every persuasion convinced him that no single tradition held all the truth.",
          hi: "हर मत के धर्मगुरुओं को सुनने से उसे यक़ीन हुआ कि सारा सत्य किसी एक परंपरा के पास नहीं।",
          mr: "प्रत्येक मताच्या धर्मगुरूंना ऐकून त्याची खात्री झाली की सारे सत्य कोणा एका परंपरेकडे नाही.",
        },
        extra: {
          en: "His reign wrote itself down twice — the Akbar Nama as story, the Ain-i Akbari as inventory.",
          hi: "उसके शासन ने ख़ुद को दो बार लिखा — अकबरनामा क़िस्से के रूप में, आइन-ए-अकबरी सूची के रूप में।",
          mr: "त्याच्या कारकिर्दीने स्वतःला दोनदा लिहिले — अकबरनामा कथेच्या रूपात, आइन-इ-अकबरी यादीच्या रूपात.",
        },
        pair: {
          left: { en: "The fifty-year reign", hi: "पचास बरस का शासन", mr: "पन्नास वर्षांची कारकीर्द" },
          right: { en: "peace with all", hi: "सबसे सुलह", mr: "सर्वांशी शांती" },
        },
      },
      {
        id: "mansabdars",
        name: { en: "The mansabdars", hi: "मनसबदार", mr: "मनसबदार" },
        kind: "system",
        prompt: {
          en: "Which ranked officers of the empire held a number that fixed their salary, status and the cavalry they owed the throne?",
          hi: "साम्राज्य के कौन-से दर्जेदार अफ़सर एक संख्या रखते थे जो उनका वेतन, रुतबा और तख़्त को देय घुड़सवार तय करती थी?",
          mr: "साम्राज्याचे कोणते दर्जेदार अधिकारी एक आकडा धारण करत जो त्यांचा पगार, दर्जा आणि तख्ताला देय घोडेस्वार ठरवी?",
        },
        statement: {
          en: "Mansabdars were rank-holders — the zat number set pay and standing, and the duty was horsemen delivered on demand.",
          hi: "मनसबदार दर्जाधारी थे — ज़ात की संख्या वेतन और हैसियत तय करती, और फ़र्ज़ था माँगते ही हाज़िर घुड़सवार।",
          mr: "मनसबदार दर्जाधारक होते — जातीचा आकडा पगार आणि प्रतिष्ठा ठरवी, आणि कर्तव्य होते मागताच हजर घोडेस्वार.",
        },
        detail: {
          en: "They were paid in jagirs — revenue assignments, not owned land; the assignment moved, and the officer moved with it.",
          hi: "उन्हें जागीरें मिलती थीं — राजस्व के हवाले, अपनी ज़मीन नहीं; हवाला बदलता तो अफ़सर भी साथ चलता।",
          mr: "त्यांना जहागिरी मिळत — महसुलाचे हवाले, स्वतःची जमीन नव्हे; हवाला बदलला की अधिकारीही सोबत हले.",
        },
        extra: {
          en: "The empire could thus count its army on paper — until the paper numbers outran the real revenue.",
          hi: "यों साम्राज्य अपनी सेना काग़ज़ पर गिन सकता था — जब तक काग़ज़ी संख्याएँ असली राजस्व से आगे न निकल गईं।",
          mr: "असे साम्राज्य आपले सैन्य कागदावर मोजू शके — कागदी आकडे खऱ्या महसुलाच्या पुढे निघेपर्यंत.",
        },
        pair: {
          left: {
            en: "Rank held as a number",
            hi: "संख्या में धारा दर्जा",
            mr: "आकड्यात धारण केलेला दर्जा",
          },
          right: {
            en: "horsemen owed on demand",
            hi: "माँगते ही देय घुड़सवार",
            mr: "मागताच देय घोडेस्वार",
          },
        },
      },
      {
        id: "zabt",
        name: { en: "The zabt revenue system", hi: "ज़ब्त राजस्व-प्रणाली", mr: "जब्त महसूल-पद्धत" },
        kind: "system",
        prompt: {
          en: "Which revenue system, built on Todar Mal's ten-year survey of crops and prices, fixed each field's tax in cash?",
          hi: "टोडरमल के फ़सलों-दामों के दस-वर्षीय सर्वेक्षण पर खड़ी कौन-सी राजस्व-प्रणाली हर खेत का कर नक़द में बाँधती थी?",
          mr: "तोडरमलच्या पिका-किमतींच्या दहा-वर्षीय पाहणीवर उभी कोणती महसूल-पद्धत प्रत्येक शेताचा कर रोखीत बांधे?",
        },
        statement: {
          en: "Zabt taxed by measurement — surveyed fields, ten-year price averages, and dues fixed in cash rather than kind.",
          hi: "ज़ब्त नाप कर कर लेती थी — सर्वेक्षित खेत, दस साला दामों का औसत, और जिन्स नहीं, नक़द में बँधी देनदारी।",
          mr: "जब्त मोजून कर घेई — पाहणी झालेली शेते, दहा वर्षांच्या किमतींची सरासरी, आणि धान्यात नव्हे, रोखीत बांधलेली देणी.",
        },
        detail: {
          en: "The ten-year average folded good harvests and bad into one predictable demand.",
          hi: "दस साल का औसत अच्छी-बुरी फ़सलों को एक पूर्वानुमेय माँग में समेट देता था।",
          mr: "दहा वर्षांची सरासरी चांगल्या-वाईट हंगामांना एका अंदाजपात्र मागणीत घडी घाली.",
        },
        extra: {
          en: "Predictability was the whole point — peasant and treasury could both plan a year ahead.",
          hi: "पूर्वानुमान ही असल मक़सद था — किसान और ख़ज़ाना दोनों साल भर आगे की सोच सकते थे।",
          mr: "अंदाज हाच खरा हेतू — शेतकरी आणि खजिना दोघे वर्षभर पुढचे आखू शकत.",
        },
        pair: {
          left: { en: "Todar Mal's survey", hi: "टोडरमल का सर्वेक्षण", mr: "तोडरमलची पाहणी" },
          right: {
            en: "tax fixed by measure",
            hi: "नाप से बँधा कर",
            mr: "मापाने बांधलेला कर",
          },
        },
      },
      {
        id: "aurangzeb",
        name: { en: "Aurangzeb", hi: "औरंगज़ेब", mr: "औरंगजेब" },
        kind: "ruler",
        prompt: {
          en: "Which last of the great Mughals stretched the empire deepest into the Deccan — and strained its treasury for decades doing so?",
          hi: "महान मुग़लों में आख़िरी कौन साम्राज्य को दक्कन में सबसे गहरा ले गया — और ऐसा करते हुए दशकों ख़ज़ाने को निचोड़ता रहा?",
          mr: "महान मुघलांतला शेवटचा कोण साम्राज्याला दख्खनमध्ये सर्वांत खोल नेऊन गेला — आणि तसे करताना दशके खजिना पिळत राहिला?",
        },
        statement: {
          en: "Aurangzeb pushed the empire to its widest and its weariest — decades of Deccan campaigning that outspent the conquests.",
          hi: "औरंगज़ेब साम्राज्य को उसकी सबसे बड़ी और सबसे थकी हद तक ले गया — दक्कन की दशकों लंबी मुहिमें, जो जीतों से महँगी पड़ीं।",
          mr: "औरंगजेबने साम्राज्याला त्याच्या सर्वांत रुंद आणि सर्वांत थकल्या टोकाला नेले — दख्खनच्या दशकांच्या मोहिमा, ज्या विजयांहून महाग पडल्या.",
        },
        pair: {
          left: { en: "The widest empire", hi: "सबसे फैला साम्राज्य", mr: "सर्वांत पसरलेले साम्राज्य" },
          right: {
            en: "won at the treasury's cost",
            hi: "ख़ज़ाने की क़ीमत पर जीता",
            mr: "खजिन्याच्या किमतीवर जिंकलेले",
          },
        },
      },
      {
        id: "ain-i-akbari",
        name: { en: "The Ain-i Akbari", hi: "आइन-ए-अकबरी", mr: "आइन-इ-अकबरी" },
        kind: "source",
        prompt: {
          en: "Which gazetteer by Abul Fazl records the empire's provinces, prices, crops and customs in obsessive, column-ruled detail?",
          hi: "अबुल फ़ज़्ल की कौन-सी विवरण-पुस्तिका साम्राज्य के सूबे, दाम, फ़सलें और रिवाज जुनूनी, ख़ानेदार ब्योरे में दर्ज करती है?",
          mr: "अबुल फजलची कोणती वर्णन-पुस्तिका साम्राज्याचे सुभे, किमती, पिके आणि रिवाज झपाटलेल्या, रकानेबंद तपशिलात नोंदवते?",
        },
        statement: {
          en: "The Ain-i Akbari is the empire on paper — Abul Fazl counting provinces, prices and professions like a census run centuries early.",
          hi: "आइन-ए-अकबरी काग़ज़ पर साम्राज्य है — अबुल फ़ज़्ल सूबे, दाम और पेशे यों गिनता है मानो जनगणना सदियों पहले चल पड़ी हो।",
          mr: "आइन-इ-अकबरी म्हणजे कागदावरचे साम्राज्य — अबुल फजल सुभे, किमती आणि धंदे असे मोजतो जणू जनगणना शतकांपूर्वीच सुरू झाली.",
        },
        pair: {
          left: { en: "Abul Fazl's counting", hi: "अबुल फ़ज़्ल की गिनती", mr: "अबुल फजलची मोजणी" },
          right: { en: "an empire on paper", hi: "काग़ज़ पर साम्राज्य", mr: "कागदावरचे साम्राज्य" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put the great Mughals in order of reign. Which sequence is right?",
          hi: "महान मुग़लों को शासन-क्रम में रखिए। कौन-सा क्रम सही है?",
          mr: "महान मुघलांना कारकीर्द-क्रमाने लावा. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "Babur → Humayun → Akbar → Jahangir → Shah Jahan → Aurangzeb",
            hi: "बाबर → हुमायूँ → अकबर → जहाँगीर → शाहजहाँ → औरंगज़ेब",
            mr: "बाबर → हुमायून → अकबर → जहांगीर → शाहजहान → औरंगजेब",
          },
          {
            en: "Babur → Akbar → Humayun → Shah Jahan → Jahangir → Aurangzeb",
            hi: "बाबर → अकबर → हुमायूँ → शाहजहाँ → जहाँगीर → औरंगज़ेब",
            mr: "बाबर → अकबर → हुमायून → शाहजहान → जहांगीर → औरंगजेब",
          },
          {
            en: "Akbar → Babur → Humayun → Jahangir → Aurangzeb → Shah Jahan",
            hi: "अकबर → बाबर → हुमायूँ → जहाँगीर → औरंगज़ेब → शाहजहाँ",
            mr: "अकबर → बाबर → हुमायून → जहांगीर → औरंगजेब → शाहजहान",
          },
          {
            en: "Babur → Humayun → Jahangir → Akbar → Shah Jahan → Aurangzeb",
            hi: "बाबर → हुमायूँ → जहाँगीर → अकबर → शाहजहाँ → औरंगज़ेब",
            mr: "बाबर → हुमायून → जहांगीर → अकबर → शाहजहान → औरंगजेब",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Founder, son, grandson and on: Babur wins Panipat, Humayun loses and regains the throne, Akbar builds the machine, Jahangir enjoys it, Shah Jahan ornaments it, Aurangzeb overextends it. Six reigns, one arc — rise, consolidation, splendour, strain.",
          hi: "संस्थापक, पुत्र, पौत्र और आगे: बाबर पानीपत जीतता है, हुमायूँ तख़्त खोकर पाता है, अकबर मशीन गढ़ता है, जहाँगीर उसका सुख लेता है, शाहजहाँ उसे सजाता है, औरंगज़ेब उसे खींचकर तानता है। छह शासन, एक वृत्त — उदय, दृढ़ता, वैभव, तनाव।",
          mr: "संस्थापक, पुत्र, नातू आणि पुढे: बाबर पानिपत जिंकतो, हुमायून तख्त गमावून परत मिळवतो, अकबर यंत्र घडवतो, जहांगीर त्याचा उपभोग घेतो, शाहजहान ते सजवतो, औरंगजेब ते ताणतो. सहा कारकिर्दी, एक कमान — उदय, स्थैर्य, वैभव, ताण.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Late in the empire there were more mansabdars than good jagirs to pay them with. Why did this arithmetic slowly hollow the empire from inside?",
          hi: "साम्राज्य के उत्तरकाल में मनसबदार उतनी अच्छी जागीरों से ज़्यादा हो गए जितनी उन्हें देने को थीं। इस गणित ने साम्राज्य को भीतर से धीरे-धीरे खोखला क्यों किया?",
          mr: "साम्राज्याच्या उत्तरकाळात मनसबदार त्यांना द्यायच्या चांगल्या जहागिरींहून जास्त झाले. या गणिताने साम्राज्याला आतून हळूहळू पोकळ का केले?",
        },
        choices: [
          {
            en: "Officers squeezed their shrinking assignments harder, peasants fled or rebelled, revenue fell further — the promise-to-pay system ate its own tax base",
            hi: "अफ़सरों ने सिकुड़ती जागीरों को और कसकर निचोड़ा, किसान भागे या उठ खड़े हुए, राजस्व और गिरा — वेतन-वादे की प्रणाली अपना ही कर-आधार खा गई",
            mr: "अधिकाऱ्यांनी आकसणाऱ्या जहागिरी अधिक पिळल्या, शेतकरी पळाले वा उठले, महसूल आणखी घसरला — पगार-वचनाची पद्धत आपलाच कर-पाया खाऊन गेली",
          },
          {
            en: "Too many officers simply made the army invincible",
            hi: "ज़्यादा अफ़सरों ने सेना को बस अजेय बना दिया",
            mr: "जास्त अधिकाऱ्यांनी सैन्याला नुसते अजिंक्य केले",
          },
          {
            en: "Jagirs were land grants for ever, so nothing changed hands",
            hi: "जागीरें सदा की भू-दान थीं, अतः कुछ हाथ नहीं बदलता था",
            mr: "जहागिरी कायमची भू-दाने होती, म्हणून काही हातबदल होत नसे",
          },
          {
            en: "The problem was only a shortage of paper for records",
            hi: "समस्या केवल अभिलेखों के काग़ज़ की कमी थी",
            mr: "अडचण फक्त नोंदींच्या कागदाच्या तुटवड्याची होती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The mansab system was a chain of promises: rank promised salary, salary was promised from a jagir's revenue, revenue was promised by peasants' harvests. When ranks multiplied faster than revenue, every link tightened on the one below — officers over-collected in their short tenures, cultivation withered under the squeeze, and the base that paid for everything shrank. An empire can survive lost battles; it cannot long survive arithmetic that punishes its own farmers. The circle of justice, ignored, closed on the throne itself.",
          hi: "मनसब-प्रणाली वादों की ज़ंजीर थी: दर्जा वेतन का वादा, वेतन जागीर के राजस्व का वादा, राजस्व किसान की फ़सलों का वादा। जब दर्जे राजस्व से तेज़ बढ़े, तो हर कड़ी नीचे वाली पर कसती गई — अफ़सर छोटे कार्यकालों में ज़्यादा वसूलते, खेती दबाव में मुरझाती, और सबका ख़र्च उठाने वाला आधार सिकुड़ता गया। साम्राज्य हारी हुई लड़ाइयाँ झेल सकता है; अपने ही किसानों को दंड देने वाला गणित देर तक नहीं झेल सकता। अनसुना किया गया न्याय का चक्र अंततः तख़्त पर ही आ बंद हुआ।",
          mr: "मनसब-पद्धत ही वचनांची साखळी होती: दर्जा पगाराचे वचन, पगार जहागिरीच्या महसुलाचे वचन, महसूल शेतकऱ्यांच्या पिकांचे वचन. दर्जे महसुलाहून वेगाने वाढले, तेव्हा प्रत्येक कडी खालच्या कडीवर आवळत गेली — अधिकारी आपल्या छोट्या कार्यकाळात जादा वसूल करत, शेती दबावाखाली कोमेजली, आणि साऱ्यांचा खर्च उचलणारा पाया आकसत गेला. साम्राज्य हरलेल्या लढाया पचवू शकते; आपल्याच शेतकऱ्यांना शिक्षा करणारे गणित फार काळ पचवू शकत नाही. दुर्लक्षिलेले न्यायाचे चक्र अखेर तख्तावरच येऊन मिटले.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Rulers and Buildings (stone speeches about power)           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-7-rulers-and-buildings",
    subject: "HISTORY",
    classLevel: 7,
    chapter: {
      en: "Chapter 5 — Rulers and Buildings",
      hi: "अध्याय 5 — शासक और इमारतें",
      mr: "प्रकरण 5 — शासक आणि वास्तू",
    },
    name: { en: "Rulers and Buildings", hi: "शासक और इमारतें", mr: "शासक आणि वास्तू" },
    summary: {
      en: "Why kings built: a tower announcing a sultanate, arches that widened every door, a garden diagramming paradise, tanks that bought gratitude — and shrines struck in war precisely because they spoke for kings.",
      hi: "राजा क्यों बनवाते थे: सल्तनत की घोषणा करती मीनार, हर दरवाज़ा चौड़ा करती मेहराबें, जन्नत का नक़्शा खींचता बाग़, कृतज्ञता ख़रीदते हौज़ — और युद्ध में इसीलिए तोड़े गए देवालय कि वे राजाओं की ओर से बोलते थे।",
      mr: "राजे का बांधत: सल्तनतीची घोषणा करणारा मनोरा, प्रत्येक दार रुंदावणाऱ्या कमानी, स्वर्गाचा आराखडा काढणारी बाग, कृतज्ञता विकत घेणारी तळी — आणि युद्धात नेमकी म्हणून फोडलेली देवळे की ती राजांच्या वतीने बोलत.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "qutb-minar",
        name: { en: "The Qutb Minar", hi: "क़ुतुब मीनार", mr: "कुतुबमिनार" },
        kind: "building",
        prompt: {
          en: "Which five-storey Delhi tower, begun by Qutbuddin Aybak around 1199, announced a new sultanate in stone?",
          hi: "क़ुतुबुद्दीन ऐबक की लगभग 1199 में शुरू कराई कौन-सी पाँच मंज़िला दिल्ली मीनार ने पत्थर में नई सल्तनत की घोषणा की?",
          mr: "कुतुबुद्दीन ऐबकने सुमारे 1199 मध्ये सुरू केलेल्या कोणत्या पाच मजली दिल्ली मनोऱ्याने दगडात नव्या सल्तनतीची घोषणा केली?",
        },
        statement: {
          en: "The Qutb Minar rises in five storeys — begun by Aybak, finished by successors: a victory-tower doubling as the muezzin's perch.",
          hi: "क़ुतुब मीनार पाँच मंज़िलों में उठती है — ऐबक की शुरू कराई, उत्तराधिकारियों की पूरी की: विजय-स्तंभ जो मुअज़्ज़िन का मचान भी है।",
          mr: "कुतुबमिनार पाच मजल्यांत चढतो — ऐबकने सुरू केलेला, वारसांनी पुरा केलेला: विजयस्तंभ जो बांगेची जागाही आहे.",
        },
        detail: {
          en: "Each ruler who repaired or raised it wrote himself into it — the tower is a ledger of reigns.",
          hi: "जिसने भी उसे सुधारा या ऊँचा किया, ख़ुद को उसमें लिख गया — मीनार शासनों की बही है।",
          mr: "ज्याने त्याला दुरुस्त वा उंच केले, त्याने स्वतःला त्यात लिहिले — मनोरा कारकिर्दींची वही आहे.",
        },
        extra: {
          en: "Lightning and earthquakes broke it more than once — and each repair was a fresh claim to its prestige.",
          hi: "बिजली और भूकंपों ने उसे एकाधिक बार तोड़ा — और हर मरम्मत उसकी प्रतिष्ठा पर नया दावा थी।",
          mr: "वीज आणि भूकंपांनी त्याला एकाहून अधिक वेळा तोडले — आणि प्रत्येक दुरुस्ती त्याच्या प्रतिष्ठेवरचा नवा दावा होती.",
        },
        pair: {
          left: { en: "The five-storey tower", hi: "पाँच मंज़िला मीनार", mr: "पाच मजली मनोरा" },
          right: {
            en: "a sultanate announced in stone",
            hi: "पत्थर में घोषित सल्तनत",
            mr: "दगडात घोषित सल्तनत",
          },
        },
      },
      {
        id: "arch-dome",
        name: { en: "The arch and dome", hi: "मेहराब और गुंबद", mr: "कमान आणि घुमट" },
        kind: "technique",
        prompt: {
          en: "Which pair of building tricks, arriving with the sultans, let doorways open wide and ceilings swell round?",
          hi: "सुल्तानों के साथ आईं कौन-सी दो निर्माण-युक्तियों ने दरवाज़ों को चौड़ा और छतों को गोल उभरने दिया?",
          mr: "सुलतानांसोबत आलेल्या कोणत्या दोन बांधकाम-युक्त्यांनी दारांना रुंद आणि छतांना गोल फुगू दिले?",
        },
        statement: {
          en: "The arch and dome spread weight along curves — doors could widen and ceilings rise where beam-on-pillar had set the old limits.",
          hi: "मेहराब और गुंबद वज़न को वक्रों पर बाँटते हैं — दरवाज़े चौड़े और छतें ऊँची हो सकीं, जहाँ खंभे पर धरन ने पुरानी हदें बाँधी थीं।",
          mr: "कमान आणि घुमट वजन वक्रांवर वाटतात — दारे रुंद आणि छते उंच होऊ शकली, जिथे खांबावरच्या तुळईने जुन्या मर्यादा घातल्या होत्या.",
        },
        detail: {
          en: "The older trabeate style laid straight beams across pillars — its doorways stayed modest by plain physics.",
          hi: "पुरानी शहतीरी शैली खंभों पर सीधी धरनें रखती थी — उसके दरवाज़े सीधी-सादी भौतिकी से ही संकरे रहे।",
          mr: "जुनी तुळई-शैली खांबांवर सरळ तुळया ठेवी — तिची दारे साध्या भौतिकशास्त्रानेच अरुंद राहिली.",
        },
        extra: {
          en: "Better mortar rode in alongside — stronger cement, bolder spans.",
          hi: "साथ में बेहतर मसाला भी आया — मज़बूत जोड़, दिलेर फैलाव।",
          mr: "सोबत चांगला चुनाही आला — बळकट सांधा, धाडसी विस्तार.",
        },
        pair: {
          left: {
            en: "Curves carrying weight",
            hi: "वज़न ढोते वक्र",
            mr: "वजन वाहणारे वक्र",
          },
          right: {
            en: "wider doors, higher roofs",
            hi: "चौड़े दरवाज़े, ऊँची छतें",
            mr: "रुंद दारे, उंच छते",
          },
        },
      },
      {
        id: "taj-mahal",
        name: { en: "The Taj Mahal", hi: "ताजमहल", mr: "ताजमहाल" },
        kind: "building",
        prompt: {
          en: "Which white-marble tomb on the Yamuna, Shah Jahan's monument to Mumtaz Mahal, crowned Mughal architecture?",
          hi: "यमुना किनारे का कौन-सा श्वेत-संगमरमरी मक़बरा, मुमताज़ महल के लिए शाहजहाँ का स्मारक, मुग़ल स्थापत्य का मुकुट बना?",
          mr: "यमुनेकाठचा कोणता शुभ्र-संगमरवरी मकबरा, मुमताज महलसाठी शाहजहानचे स्मारक, मुघल स्थापत्याचा मुकुट ठरला?",
        },
        statement: {
          en: "The Taj Mahal is grief built in marble — a river-front garden-tomb where symmetry itself is the consolation.",
          hi: "ताजमहल संगमरमर में ढला शोक है — नदी-मुख बाग़-मक़बरा, जहाँ समरूपता ही सांत्वना है।",
          mr: "ताजमहाल म्हणजे संगमरवरात घडलेला शोक — नदीमुखी बाग-मकबरा, जिथे सममितीच सांत्वन आहे.",
        },
        detail: {
          en: "Its garden is the fourfold chahar bagh — paradise diagrammed in crossing water channels.",
          hi: "उसका बाग़ चौभागा चारबाग़ है — काटती जल-नालियों में खिंचा जन्नत का नक़्शा।",
          mr: "त्याची बाग चतुर्भाग चारबाग आहे — छेदणाऱ्या जलवाहिन्यांत काढलेला स्वर्गाचा आराखडा.",
        },
        extra: {
          en: "Shah Jahan ended his days viewing it from Agra Fort, a prisoner — architecture outliving its patron's power.",
          hi: "शाहजहाँ ने अपने अंतिम दिन आगरा क़िले से उसे निहारते बिताए, बंदी बनकर — स्थापत्य अपने संरक्षक की सत्ता से आगे जीता हुआ।",
          mr: "शाहजहानने अखेरचे दिवस आग्रा किल्ल्यातून त्याला न्याहाळत काढले, कैदी होऊन — स्थापत्य आपल्या आश्रयदात्याच्या सत्तेहून अधिक जगलेले.",
        },
        pair: {
          left: { en: "Marble on the Yamuna", hi: "यमुना पर संगमरमर", mr: "यमुनेवरचा संगमरवर" },
          right: { en: "grief built to last", hi: "टिकाऊ गढ़ा शोक", mr: "टिकाऊ घडवलेला शोक" },
        },
      },
      {
        id: "royal-temple",
        name: { en: "The royal temple", hi: "राजकीय मंदिर", mr: "राजकीय मंदिर" },
        kind: "building",
        prompt: {
          en: "Kings built which grand shrines to declare their rule divinely blessed — making them, in wartime, targets of rival kings?",
          hi: "राजा कौन-से भव्य देवालय बनवाते थे यह घोषित करने को कि उनका शासन ईश्वर-कृपित है — जिससे वे युद्ध में प्रतिद्वंद्वी राजाओं के निशाने बने?",
          mr: "राजे कोणती भव्य देवळे बांधत हे घोषित करायला की त्यांचे राज्य ईश्वर-कृपेचे आहे — ज्याने ती युद्धात प्रतिस्पर्धी राजांची लक्ष्ये झाली?",
        },
        statement: {
          en: "Royal temples proclaimed a kingdom's god-favoured rule — which is exactly why victorious rivals sometimes struck them: the blow was aimed at the king's claim, and such attacks were made by rulers of every faith.",
          hi: "राजकीय मंदिर राज्य के ईश्वर-कृपित शासन की घोषणा थे — ठीक इसीलिए विजयी प्रतिद्वंद्वी कभी-कभी उन पर वार करते: चोट राजा के दावे पर थी, और ऐसे हमले हर धर्म के शासकों ने किए।",
          mr: "राजकीय मंदिरे राज्याच्या ईश्वर-कृपित सत्तेची घोषणा होती — नेमकी म्हणूनच विजयी प्रतिस्पर्धी कधी त्यांवर घाव घालत: घाव राजाच्या दाव्यावर होता, आणि असे हल्ले प्रत्येक धर्माच्या शासकांनी केले.",
        },
        pair: {
          left: { en: "The kingdom's shrine", hi: "राज्य का देवालय", mr: "राज्याचे देऊळ" },
          right: {
            en: "struck because it spoke for the king",
            hi: "इसलिए तोड़ा कि वह राजा की ओर से बोलता था",
            mr: "म्हणून फोडले की ते राजाच्या वतीने बोले",
          },
        },
      },
      {
        id: "chahar-bagh",
        name: { en: "The chahar bagh", hi: "चारबाग़", mr: "चारबाग" },
        kind: "technique",
        prompt: {
          en: "Which fourfold garden, quartered by crossing water channels, framed Mughal tombs and pleasures alike?",
          hi: "काटती जल-नालियों से चार हिस्सों में बँटा कौन-सा बाग़ मुग़ल मक़बरों और विहारों दोनों को घेरता था?",
          mr: "छेदणाऱ्या जलवाहिन्यांनी चार भागांत वाटलेली कोणती बाग मुघल मकबरे आणि विहार दोन्हींना वेढत असे?",
        },
        statement: {
          en: "The chahar bagh is the garden in four quarters — water crossing at the centre, order imposed on green.",
          hi: "चारबाग़ चार हिस्सों का बाग़ है — बीच में काटता पानी, हरियाली पर बिठाई गई तरतीब।",
          mr: "चारबाग म्हणजे चार भागांची बाग — मध्यभागी छेदणारे पाणी, हिरवाईवर बसवलेली शिस्त.",
        },
        pair: {
          left: { en: "The garden in quarters", hi: "चौथाइयों का बाग़", mr: "चतकोरांची बाग" },
          right: {
            en: "water crossing at the centre",
            hi: "केंद्र में काटता पानी",
            mr: "केंद्रात छेदणारे पाणी",
          },
        },
      },
      {
        id: "royal-waterworks",
        name: { en: "The royal waterworks", hi: "राजकीय जल-निर्माण", mr: "राजकीय जलबांधकामे" },
        kind: "building",
        prompt: {
          en: "Sultans dug which tanks and channels — like Iltutmish's great hauz in Delhi — earning merit and gratitude by water?",
          hi: "सुल्तान कौन-से हौज़ और नहरें खुदवाते थे — जैसे दिल्ली में इल्तुतमिश का बड़ा हौज़ — पानी से पुण्य और कृतज्ञता कमाते हुए?",
          mr: "सुलतान कोणती तळी आणि पाट खोदवत — जसा दिल्लीत इल्तुतमिशचा मोठा हौद — पाण्याने पुण्य आणि कृतज्ञता कमावत?",
        },
        statement: {
          en: "Rulers built tanks, wells and canals — water was welfare, and welfare was legitimacy a subject could drink.",
          hi: "शासक हौज़, कुएँ और नहरें बनवाते थे — पानी लोक-कल्याण था, और कल्याण वह वैधता जिसे प्रजा पी सकती थी।",
          mr: "शासक तळी, विहिरी आणि कालवे बांधत — पाणी म्हणजे लोककल्याण, आणि कल्याण म्हणजे प्रजेला पिता येणारी वैधता.",
        },
        pair: {
          left: { en: "The sultan's tank", hi: "सुल्तान का हौज़", mr: "सुलतानाचा हौद" },
          right: { en: "legitimacy by water", hi: "पानी से वैधता", mr: "पाण्याने वैधता" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the construction to the message it sent: A-the Qutb Minar, B-the Taj Mahal, C-a public hauz. Which trio is right?",
          hi: "निर्माण को उसके संदेश से मिलाइए: अ-क़ुतुब मीनार, ब-ताजमहल, स-सार्वजनिक हौज़। कौन-सी तिकड़ी सही है?",
          mr: "बांधकामाला त्याच्या संदेशाशी जुळवा: अ-कुतुबमिनार, ब-ताजमहाल, क-सार्वजनिक हौद. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: 'a new power stands here' · B: 'love and paradise remembered' · C: 'your ruler provides'",
            hi: "अ: 'यहाँ नई सत्ता खड़ी है' · ब: 'प्रेम और जन्नत की याद' · स: 'तुम्हारा शासक देता है'",
            mr: "अ: 'इथे नवी सत्ता उभी आहे' · ब: 'प्रेम आणि स्वर्गाची आठवण' · क: 'तुमचा शासक देतो'",
          },
          {
            en: "A: 'your ruler provides' · B: 'a new power stands here' · C: 'love remembered'",
            hi: "अ: 'तुम्हारा शासक देता है' · ब: 'यहाँ नई सत्ता खड़ी है' · स: 'प्रेम की याद'",
            mr: "अ: 'तुमचा शासक देतो' · ब: 'इथे नवी सत्ता उभी आहे' · क: 'प्रेमाची आठवण'",
          },
          {
            en: "A: 'love remembered' · B: 'your ruler provides' · C: 'a new power stands here'",
            hi: "अ: 'प्रेम की याद' · ब: 'तुम्हारा शासक देता है' · स: 'यहाँ नई सत्ता खड़ी है'",
            mr: "अ: 'प्रेमाची आठवण' · ब: 'तुमचा शासक देतो' · क: 'इथे नवी सत्ता उभी आहे'",
          },
          {
            en: "All three buildings carried no message at all",
            hi: "तीनों इमारतें कोई संदेश नहीं ढोती थीं",
            mr: "तिन्ही वास्तू कोणताही संदेश वाहत नव्हत्या",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Buildings are speeches in stone, each with its audience. The victory-tower addresses rivals and subjects: a new order stands. The garden-tomb addresses eternity: love, loss and paradise composed in marble. The hauz addresses the thirsty: your ruler thinks of your mornings. Read any old building by first asking whom it was talking to.",
          hi: "इमारतें पत्थर के भाषण हैं, हर एक का अपना श्रोता। विजय-मीनार प्रतिद्वंद्वियों और प्रजा से कहती है: नई व्यवस्था खड़ी है। बाग़-मक़बरा अनंत से कहता है: प्रेम, वियोग और जन्नत संगमरमर में रचे हुए। हौज़ प्यासों से कहता है: तुम्हारा शासक तुम्हारी सुबहों की सोचता है। किसी भी पुरानी इमारत को पढ़ने से पहले पूछिए — वह किससे बात कर रही थी।",
          mr: "वास्तू म्हणजे दगडातली भाषणे, प्रत्येकाचा आपला श्रोता. विजयस्तंभ प्रतिस्पर्धी आणि प्रजेला सांगतो: नवी व्यवस्था उभी आहे. बाग-मकबरा अनंताला सांगतो: प्रेम, वियोग आणि स्वर्ग संगमरवरात रचलेले. हौद तहानलेल्यांना सांगतो: तुमचा शासक तुमच्या सकाळींचा विचार करतो. कोणतीही जुनी वास्तू वाचण्याआधी विचारा — ती कोणाशी बोलत होती.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Rulers poured fortunes into monuments most subjects could admire only from outside. Why was this spending, to them, not waste but statecraft?",
          hi: "शासक उन स्मारकों पर ख़ज़ाने लुटाते थे जिन्हें अधिकांश प्रजा बाहर से ही निहार सकती थी। उनकी नज़र में यह ख़र्च फ़िज़ूल नहीं, राज-नीति क्यों था?",
          mr: "शासक अशा स्मारकांवर खजिने ओतत जी बहुतेक प्रजा बाहेरूनच न्याहाळू शके. त्यांच्या दृष्टीने हा खर्च उधळपट्टी नव्हे, राजनीती का होता?",
        },
        choices: [
          {
            en: "Awe was governance: a skyline of domes argued daily that this power was wealthy, blessed and permanent — an argument no rebel pamphlet could out-shout",
            hi: "विस्मय ही शासन था: गुंबदों की क्षितिज-रेखा रोज़ दलील देती थी कि यह सत्ता धनी, कृपा-प्राप्त और स्थायी है — ऐसी दलील जिसे कोई बाग़ी पर्चा चीख़कर नहीं दबा सकता था",
            mr: "विस्मय हेच शासन: घुमटांची क्षितिजरेषा रोज युक्तिवाद करी की ही सत्ता श्रीमंत, कृपाप्राप्त आणि चिरस्थायी आहे — जो युक्तिवाद कोणतेही बंडखोर पत्रक ओरडून दाबू शकत नव्हते",
          },
          {
            en: "Kings genuinely had no other use for treasure",
            hi: "राजाओं के पास ख़ज़ाने का सचमुच और कोई उपयोग नहीं था",
            mr: "राजांकडे खजिन्याचा खरेच दुसरा उपयोग नव्हता",
          },
          {
            en: "Monuments were secretly granaries in disguise",
            hi: "स्मारक भेस बदले अन्न-भंडार थे",
            mr: "स्मारके वेष बदललेली धान्य-कोठारे होती",
          },
          {
            en: "Subjects demanded monuments instead of lower taxes",
            hi: "प्रजा कम करों की जगह स्मारक माँगती थी",
            mr: "प्रजा कमी करांऐवजी स्मारके मागत असे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Power that must constantly prove itself by force is expensive; power that is believed is cheap. A great mosque, tomb or tower worked on belief — it told subjects their ruler commanded wealth beyond imagining, told rivals the dynasty meant to stay, and told posterity the reign had mattered. The monument was propaganda with a five-hundred-year shelf life — and unlike an army, it never needed feeding. That the argument still works on us — we call it 'heritage' — proves how well the stone spoke.",
          hi: "जिस सत्ता को बार-बार बल से ख़ुद को सिद्ध करना पड़े वह महँगी है; जिस पर विश्वास हो वह सस्ती। भव्य मस्जिद, मक़बरा या मीनार विश्वास पर काम करते थे — प्रजा से कहते कि शासक के पास कल्पनातीत धन है, प्रतिद्वंद्वियों से कि वंश टिकने आया है, और आने वाली पीढ़ियों से कि यह शासन मायने रखता था। स्मारक पाँच सौ साल की मियाद वाला प्रचार था — और सेना के उलट, उसे कभी खिलाना नहीं पड़ता था। कि वह दलील आज भी हम पर चलती है — हम उसे 'विरासत' कहते हैं — यही पत्थर की वाक्पटुता का प्रमाण है।",
          mr: "जिला सतत बळाने स्वतःला सिद्ध करावे लागते ती सत्ता महाग; जिच्यावर विश्वास असतो ती स्वस्त. भव्य मशीद, मकबरा वा मनोरा विश्वासावर काम करी — प्रजेला सांगे की शासकाकडे कल्पनातीत संपत्ती आहे, प्रतिस्पर्ध्यांना की घराणे टिकायला आले आहे, आणि पुढच्या पिढ्यांना की ही कारकीर्द महत्त्वाची होती. स्मारक म्हणजे पाचशे वर्षांची मुदत असलेला प्रचार — आणि सैन्याच्या उलट, त्याला कधी पोसावे लागत नसे. तो युक्तिवाद आजही आपल्यावर चालतो — आपण त्याला 'वारसा' म्हणतो — हाच दगडाच्या वक्तृत्वाचा पुरावा.",
        },
      },
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 8 — Devotional Paths to the Divine (bhakti and sufi roads)      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-7-devotional-paths",
    subject: "HISTORY",
    classLevel: 7,
    chapter: {
      en: "Chapter 8 — Devotional Paths to the Divine",
      hi: "अध्याय 8 — ईश्वर से अनुराग के पथ",
      mr: "प्रकरण 8 — ईश्वरभक्तीच्या वाटा",
    },
    name: {
      en: "Devotional Paths to the Divine",
      hi: "ईश्वर से अनुराग के पथ",
      mr: "ईश्वरभक्तीच्या वाटा",
    },
    summary: {
      en: "Devotion against the middleman: a weaver mocking both orthodoxies, a princess who walked out of rank, mystics singing God as the beloved, a kitchen that seated everyone in one line.",
      hi: "बिचौलिए के विरुद्ध भक्ति: दोनों रूढ़ियों का उपहास करता जुलाहा, रुतबे से बाहर चली आई राजकुमारी, प्रियतम की तरह ईश्वर गाते सूफ़ी, एक क़तार में सबको बिठाती रसोई।",
      mr: "दलालाविरुद्ध भक्ती: दोन्ही रूढींची थट्टा करणारा विणकर, प्रतिष्ठेतून बाहेर पडलेली राजकन्या, ईश्वराला प्रियतम म्हणून गाणारे सूफी, साऱ्यांना एका रांगेत बसवणारे स्वयंपाकघर.",
    },
    position: 8,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "bhakti",
        name: { en: "Bhakti", hi: "भक्ति", mr: "भक्ती" },
        kind: "path",
        prompt: {
          en: "Which path to God ran on love and devotion — open to every caste, needing no priest as middleman?",
          hi: "ईश्वर तक कौन-सा मार्ग प्रेम और अनुराग पर चलता था — हर जाति के लिए खुला, बिना किसी पुरोहित-बिचौलिए के?",
          mr: "ईश्वरापर्यंतची कोणती वाट प्रेम आणि भक्तीवर चाले — प्रत्येक जातीला खुली, कोणत्याही पुरोहित-दलालाविना?",
        },
        statement: {
          en: "Bhakti is devotion as the direct road — songs instead of rituals, love instead of hierarchy, open to every jati.",
          hi: "भक्ति सीधा रास्ता बनी उपासना है — कर्मकांड की जगह गीत, ऊँच-नीच की जगह प्रेम, हर जाति के लिए खुली।",
          mr: "भक्ती म्हणजे थेट वाट झालेली उपासना — कर्मकांडाऐवजी गाणी, उतरंडीऐवजी प्रेम, प्रत्येक जातीला खुली.",
        },
        pair: {
          left: { en: "Devotion as the road", hi: "मार्ग बनी भक्ति", mr: "वाट झालेली भक्ती" },
          right: {
            en: "no middleman needed",
            hi: "बिचौलिया अनावश्यक",
            mr: "दलालाची गरज नाही",
          },
        },
      },
      {
        id: "kabir",
        name: { en: "Kabir", hi: "कबीर", mr: "कबीर" },
        kind: "saint",
        prompt: {
          en: "Which weaver-poet mocked the rituals of mosque and temple alike, insisting the formless God needed neither?",
          hi: "किस जुलाहे-कवि ने मस्जिद और मंदिर दोनों के कर्मकांड का उपहास किया, यह अड़कर कि निराकार ईश्वर को दोनों की ज़रूरत नहीं?",
          mr: "कोणत्या विणकर-कवीने मशीद आणि मंदिर दोन्हींच्या कर्मकांडाची थट्टा केली, निराकार ईश्वराला दोन्हींची गरज नाही असे ठासून?",
        },
        statement: {
          en: "Kabir wove verses that spared no orthodoxy — Ram and Rahim were one to him, and ritual on either side a distraction from the formless One.",
          hi: "कबीर ने ऐसे दोहे बुने जिन्होंने कोई रूढ़ि नहीं बख़्शी — उसके लिए राम और रहीम एक थे, और दोनों ओर का कर्मकांड निराकार से भटकाव।",
          mr: "कबीराने असे दोहे विणले ज्यांनी कोणतीही रूढी सोडली नाही — त्याच्यासाठी राम आणि रहीम एक होते, आणि दोन्हीकडचे कर्मकांड निराकारापासूनची भटकंती.",
        },
        detail: {
          en: "His dohas travelled by mouth for a century before anyone wrote them down — poetry preserved by memory alone.",
          hi: "उसके दोहे लिखे जाने से पहले सदी भर मुँह-ज़बानी चले — केवल स्मृति के सहारे बची कविता।",
          mr: "त्याचे दोहे लिहिले जाण्याआधी शतकभर तोंडोतोंडी चालले — केवळ स्मरणाच्या आधारे टिकलेली कविता.",
        },
        extra: {
          en: "At his death, legend says, Hindus and Muslims quarrelled over his body — and found only flowers under the shroud.",
          hi: "किंवदंती है, उसकी मृत्यु पर हिंदू-मुसलमान देह के लिए झगड़े — और कफ़न के नीचे केवल फूल मिले।",
          mr: "आख्यायिका आहे, त्याच्या मृत्यूवर हिंदू-मुस्लीम देहासाठी भांडले — आणि कफनाखाली फक्त फुले मिळाली.",
        },
        pair: {
          left: { en: "The weaver's dohas", hi: "जुलाहे के दोहे", mr: "विणकराचे दोहे" },
          right: {
            en: "orthodoxies mocked alike",
            hi: "दोनों रूढ़ियों का उपहास",
            mr: "दोन्ही रूढींची थट्टा",
          },
        },
      },
      {
        id: "mirabai",
        name: { en: "Mirabai", hi: "मीराबाई", mr: "मीराबाई" },
        kind: "saint",
        prompt: {
          en: "Which Rajput princess left palace and custom behind to sing her devotion to Krishna, defying family and caste rules?",
          hi: "किस राजपूत राजकुमारी ने महल और मर्यादा पीछे छोड़ कृष्ण-भक्ति गाई, कुल और जाति के नियमों को ठुकराते हुए?",
          mr: "कोणत्या राजपूत राजकन्येने राजवाडा आणि रीत मागे टाकून कृष्णभक्ती गायली, कुळ आणि जातीचे नियम झुगारत?",
        },
        statement: {
          en: "Mirabai chose Krishna over rank — a princess singing in temples and streets, her bhajans outliving every censure aimed at her.",
          hi: "मीराबाई ने रुतबे पर कृष्ण को चुना — मंदिरों और गलियों में गाती राजकुमारी, जिसके भजन उस पर साधी हर भर्त्सना से आगे जिए।",
          mr: "मीराबाईने प्रतिष्ठेवर कृष्णाला निवडले — मंदिरांत आणि गल्ल्यांत गाणारी राजकन्या, जिची भजने तिच्यावर रोखलेल्या प्रत्येक निर्भर्त्सनेहून अधिक जगली.",
        },
        pair: {
          left: {
            en: "The princess who walked out",
            hi: "बाहर चली आई राजकुमारी",
            mr: "बाहेर पडलेली राजकन्या",
          },
          right: { en: "bhajans over rank", hi: "रुतबे पर भजन", mr: "प्रतिष्ठेवर भजने" },
        },
      },
      {
        id: "sufis",
        name: { en: "The Sufis", hi: "सूफ़ी", mr: "सूफी" },
        kind: "path",
        prompt: {
          en: "Which Muslim mystics sought God through love, music and remembrance, gathering at hospices around beloved teachers?",
          hi: "कौन-से मुस्लिम रहस्यवादी प्रेम, संगीत और ज़िक्र से ईश्वर को खोजते थे, प्रिय गुरुओं के गिर्द ख़ानक़ाहों में जुटते हुए?",
          mr: "कोणते मुस्लीम गूढवादी प्रेम, संगीत आणि स्मरणाने ईश्वराला शोधत, प्रिय गुरूंभोवती खानकांत जमत?",
        },
        statement: {
          en: "Sufis pursued God as the beloved — khanqahs, qawwali and zikr, with teacher and disciple bound by the heart, not the rulebook.",
          hi: "सूफ़ियों ने ईश्वर को प्रियतम की तरह चाहा — ख़ानक़ाह, क़व्वाली और ज़िक्र; गुरु-शिष्य नियम-पुस्तिका से नहीं, दिल से बँधे।",
          mr: "सूफींनी ईश्वराला प्रियतमासारखे शोधले — खानका, कव्वाली आणि जिक्र; गुरु-शिष्य नियमपुस्तिकेने नव्हे, हृदयाने बांधलेले.",
        },
        detail: {
          en: "Nizamuddin Auliya's Delhi hospice fed and heard everyone — sultans included, though he famously kept them waiting.",
          hi: "निज़ामुद्दीन औलिया की दिल्ली ख़ानक़ाह सबको खिलाती-सुनती थी — सुल्तान भी, हालाँकि वे मशहूर तौर पर उन्हें इंतज़ार कराते थे।",
          mr: "निजामुद्दीन औलियांची दिल्ली खानका साऱ्यांना जेवू-ऐकू घाली — सुलतानही, तरी ते प्रसिद्धपणे त्यांना ताटकळत ठेवत.",
        },
        extra: {
          en: "Their dargahs still draw every community — devotion outliving doctrine by centuries.",
          hi: "उनकी दरगाहें आज भी हर समुदाय को खींचती हैं — श्रद्धा, सिद्धांत से सदियों आगे जीती हुई।",
          mr: "त्यांचे दर्गे आजही प्रत्येक समुदायाला ओढतात — श्रद्धा, सिद्धान्ताहून शतके अधिक जगलेली.",
        },
        pair: {
          left: { en: "God as the beloved", hi: "प्रियतम रूप ईश्वर", mr: "प्रियतम रूपातला ईश्वर" },
          right: {
            en: "music and remembrance",
            hi: "संगीत और ज़िक्र",
            mr: "संगीत आणि स्मरण",
          },
        },
      },
      {
        id: "guru-nanak",
        name: { en: "Guru Nanak", hi: "गुरु नानक", mr: "गुरू नानक" },
        kind: "saint",
        prompt: {
          en: "Which teacher's hymns founded a community at Kartarpur where all ate together from one kitchen, rank set aside?",
          hi: "किस गुरु के शबदों ने करतारपुर में वह समुदाय रचा जहाँ सब एक रसोई से साथ खाते थे, दर्जा किनारे रखकर?",
          mr: "कोणत्या गुरूंच्या शबदांनी करतारपूरला असा समुदाय घडवला जिथे सारे एका स्वयंपाकघरातून एकत्र जेवत, दर्जा बाजूला ठेवून?",
        },
        statement: {
          en: "Guru Nanak taught one God and equal humanity — his langar seated everyone in one line, and his hymns became a faith's foundation.",
          hi: "गुरु नानक ने एक ईश्वर और समान मनुष्यता सिखाई — उनके लंगर ने सबको एक पंगत में बिठाया, और उनके शबद एक धर्म की नींव बने।",
          mr: "गुरू नानकांनी एक ईश्वर आणि समान माणुसकी शिकवली — त्यांच्या लंगरने साऱ्यांना एका पंगतीत बसवले, आणि त्यांचे शबद एका धर्माचा पाया झाले.",
        },
        detail: {
          en: "The community kitchen made theology edible — equality practised three times a day, spoon by spoon.",
          hi: "सामुदायिक रसोई ने सिद्धांत को भोजन बना दिया — समानता दिन में तीन बार, चम्मच-दर-चम्मच बरती हुई।",
          mr: "सामुदायिक स्वयंपाकघराने सिद्धान्ताला जेवण केले — समता दिवसातून तीनदा, चमच्या-चमच्याने आचरलेली.",
        },
        extra: {
          en: "His verses later joined those of other sants in what grew into the Guru Granth Sahib.",
          hi: "उनके शबद आगे चलकर अन्य संतों की वाणियों संग उसमें जुड़े जो गुरु ग्रंथ साहिब बना।",
          mr: "त्यांचे शबद पुढे इतर संतांच्या वाणींसह त्यात जुळले जे गुरू ग्रंथसाहिब झाले.",
        },
        pair: {
          left: {
            en: "The one shared kitchen",
            hi: "एक साझी रसोई",
            mr: "एक सामाईक स्वयंपाकघर",
          },
          right: {
            en: "equality made a meal",
            hi: "भोजन बनी समानता",
            mr: "जेवण झालेली समता",
          },
        },
      },
      {
        id: "virashaivas",
        name: { en: "The Virashaivas", hi: "वीरशैव", mr: "वीरशैव" },
        kind: "path",
        prompt: {
          en: "Which Karnataka movement, led by Basavanna, argued against caste and ritual — carrying worship in a small linga worn on the body?",
          hi: "बासवण्णा के नेतृत्व वाले किस कर्नाटक आंदोलन ने जाति और कर्मकांड के विरुद्ध तर्क किया — उपासना को देह पर धारे छोटे लिंग में साथ लिए?",
          mr: "बसवण्णांच्या नेतृत्वाखालील कोणत्या कर्नाटक चळवळीने जाती आणि कर्मकांडाविरुद्ध युक्तिवाद केला — उपासना देहावर धारण केलेल्या छोट्या लिंगात सोबत नेत?",
        },
        statement: {
          en: "The Virashaivas refused caste's ladders — God carried on one's own body, honest work as worship, and vachanas spoken in plain Kannada.",
          hi: "वीरशैवों ने जाति की सीढ़ियाँ ठुकराईं — ईश्वर अपनी ही देह पर धारण किया, ईमानदार श्रम को पूजा माना, और वचन सीधी कन्नड़ में कहे।",
          mr: "वीरशैवांनी जातीच्या शिड्या नाकारल्या — ईश्वर स्वतःच्याच देहावर धारण केला, प्रामाणिक श्रम हीच पूजा मानली, आणि वचने साध्या कन्नडमध्ये सांगितली.",
        },
        pair: {
          left: {
            en: "Worship worn on the body",
            hi: "देह पर धारी उपासना",
            mr: "देहावर धारण केलेली उपासना",
          },
          right: {
            en: "caste's ladder refused",
            hi: "ठुकराई जाति की सीढ़ी",
            mr: "नाकारलेली जातीची शिडी",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the voice to its form and home: A-Kabir, B-Mirabai, C-Basavanna. Which trio is right?",
          hi: "वाणी को उसके रूप और घर से मिलाइए: अ-कबीर, ब-मीराबाई, स-बासवण्णा। कौन-सी तिकड़ी सही है?",
          mr: "वाणीला तिच्या रूपाशी आणि घराशी जुळवा: अ-कबीर, ब-मीराबाई, क-बसवण्णा. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: dohas in the north · B: Krishna-bhajans in Rajasthan · C: Kannada vachanas in Karnataka",
            hi: "अ: उत्तर में दोहे · ब: राजस्थान में कृष्ण-भजन · स: कर्नाटक में कन्नड़ वचन",
            mr: "अ: उत्तरेत दोहे · ब: राजस्थानात कृष्ण-भजने · क: कर्नाटकात कन्नड वचने",
          },
          {
            en: "A: vachanas in Karnataka · B: dohas in the north · C: bhajans in Rajasthan",
            hi: "अ: कर्नाटक में वचन · ब: उत्तर में दोहे · स: राजस्थान में भजन",
            mr: "अ: कर्नाटकात वचने · ब: उत्तरेत दोहे · क: राजस्थानात भजने",
          },
          {
            en: "A: bhajans in Rajasthan · B: vachanas in Karnataka · C: dohas in the north",
            hi: "अ: राजस्थान में भजन · ब: कर्नाटक में वचन · स: उत्तर में दोहे",
            mr: "अ: राजस्थानात भजने · ब: कर्नाटकात वचने · क: उत्तरेत दोहे",
          },
          {
            en: "A: dohas in the north · B: vachanas in Karnataka · C: bhajans in Rajasthan",
            hi: "अ: उत्तर में दोहे · ब: कर्नाटक में वचन · स: राजस्थान में भजन",
            mr: "अ: उत्तरेत दोहे · ब: कर्नाटकात वचने · क: राजस्थानात भजने",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Kabir's two-line dohas rang through the northern bazaars; Mirabai's bhajans carried Krishna through Rajasthan; Basavanna's vachanas spoke plain Kannada in Karnataka. Three regions, three forms, one refusal — that birth should decide who may reach God.",
          hi: "कबीर के दो पंक्तियों के दोहे उत्तर के बाज़ारों में गूँजे; मीराबाई के भजन राजस्थान में कृष्ण को ले चले; बासवण्णा के वचन कर्नाटक में सीधी कन्नड़ बोले। तीन क्षेत्र, तीन रूप, एक इनकार — कि जन्म तय करे कौन ईश्वर तक पहुँचे।",
          mr: "कबीराचे दोन ओळींचे दोहे उत्तरेच्या बाजारांत घुमले; मीराबाईंची भजने राजस्थानात कृष्णाला घेऊन चालली; बसवण्णांची वचने कर्नाटकात साधी कन्नड बोलली. तीन प्रदेश, तीन रूपे, एक नकार — की जन्माने ठरवावे कोण ईश्वरापर्यंत पोहोचेल.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Sanskrit, Persian and Arabic were the prestige languages of the age — yet Kabir sang in bazaar Hindi, Basavanna in plain Kannada, Nanak in Punjabi. Why was the choice of everyday tongues itself part of the message?",
          hi: "संस्कृत, फ़ारसी और अरबी उस युग की प्रतिष्ठा-भाषाएँ थीं — फिर भी कबीर बाज़ारू हिंदी में गाए, बासवण्णा सीधी कन्नड़ में, नानक पंजाबी में। रोज़मर्रा की ज़बानों का चुनाव स्वयं संदेश का हिस्सा क्यों था?",
          mr: "संस्कृत, फारसी आणि अरबी या त्या युगाच्या प्रतिष्ठा-भाषा होत्या — तरी कबीर बाजारी हिंदीत गायले, बसवण्णा साध्या कन्नडमध्ये, नानक पंजाबीत. रोजच्या भाषांची निवड स्वतःच संदेशाचा भाग का होती?",
        },
        choices: [
          {
            en: "A God open to all must speak a tongue all understand — using the languages of field and bazaar dissolved the priestly monopoly that scripture-languages protected",
            hi: "जो ईश्वर सबके लिए खुला हो उसे सबकी समझ की ज़बान बोलनी होगी — खेत और बाज़ार की भाषाएँ अपनाने से वह पुरोहिती एकाधिकार घुल गया जिसे शास्त्र-भाषाएँ बचाती थीं",
            mr: "साऱ्यांना खुला ईश्वर साऱ्यांना कळणारी भाषा बोलला पाहिजे — शेत आणि बाजाराच्या भाषा स्वीकारल्याने शास्त्र-भाषा जपत असलेली पुरोहिती मक्तेदारी विरघळली",
          },
          {
            en: "The saints simply never learned the prestige languages",
            hi: "संत बस प्रतिष्ठा-भाषाएँ सीख ही नहीं पाए",
            mr: "संतांना प्रतिष्ठा-भाषा नुसत्या शिकताच आल्या नाहीत",
          },
          {
            en: "Everyday tongues were chosen because they rhymed better",
            hi: "रोज़मर्रा की ज़बानें इसलिए चुनीं कि उनमें तुक बेहतर बैठती थी",
            mr: "रोजच्या भाषा म्हणून निवडल्या की त्यांत यमक चांगले जुळे",
          },
          {
            en: "Rulers had banned the use of Sanskrit and Persian",
            hi: "शासकों ने संस्कृत और फ़ारसी पर रोक लगा दी थी",
            mr: "शासकांनी संस्कृत आणि फारसीवर बंदी घातली होती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A scripture-language is a locked door: whoever holds the key — priest, qazi, pandit — controls the room. Singing of God in the weaver's Hindi or the farmer's Kannada threw the door open and made the middleman redundant, which was precisely the theology: no birth, no rank, no license needed to love God. The medium enacted the message. It is no accident that these songs, not the era's court poetry, are still sung by millions who never saw the inside of a school.",
          hi: "शास्त्र-भाषा बंद दरवाज़ा है: चाबी जिसके पास — पुरोहित, क़ाज़ी, पंडित — कमरा उसका। जुलाहे की हिंदी या किसान की कन्नड़ में ईश्वर गाना दरवाज़ा खोल देना था और बिचौलिए को बेकार करना — और यही तो सिद्धांत था: ईश्वर से प्रेम को न जन्म चाहिए, न दर्जा, न परवाना। माध्यम ने ही संदेश को जी दिखाया। यह संयोग नहीं कि उस युग की दरबारी कविता नहीं, ये गीत आज भी वे करोड़ों गाते हैं जिन्होंने पाठशाला का भीतर कभी नहीं देखा।",
          mr: "शास्त्र-भाषा म्हणजे बंद दार: किल्ली ज्याच्याकडे — पुरोहित, काझी, पंडित — खोली त्याची. विणकराच्या हिंदीत वा शेतकऱ्याच्या कन्नडमध्ये ईश्वर गाणे म्हणजे दार सताड उघडणे आणि दलालाला निरुपयोगी करणे — आणि हाच तर सिद्धान्त होता: ईश्वरावर प्रेम करायला जन्म नको, दर्जा नको, परवाना नको. माध्यमानेच संदेश जगून दाखवला. हा योगायोग नाही की त्या युगाची दरबारी कविता नव्हे, ही गाणी आजही ते कोट्यवधी गातात ज्यांनी शाळेचे आतले कधी पाहिले नाही.",
        },
      },
    ],
  },
];
