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
];
