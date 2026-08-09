/**
 * Class 10 History — NCERT "India and the Contemporary World – II", chapter by
 * chapter, through the conceptual engine. How the modern world was made and
 * unmade: nations imagined before they existed, an empire answered with salt,
 * and a globe stitched together by trade, germs and debt. Every fact keeps the
 * evidence habit — who gained, who paid, and what the slogan left out.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE =
  "EduLink original, written against NCERT India and the Contemporary World – II (Class 10)";
const LICENCE = "CC-BY-SA-4.0";

export const G10_HISTORY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — The Rise of Nationalism in Europe                           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-10-nationalism-europe",
    subject: "HISTORY",
    classLevel: 10,
    chapter: {
      en: "Chapter 1 — The Rise of Nationalism in Europe",
      hi: "अध्याय 1 — यूरोप में राष्ट्रवाद का उदय",
      mr: "प्रकरण 1 — युरोपात राष्ट्रवादाचा उदय",
    },
    name: {
      en: "The Rise of Nationalism in Europe",
      hi: "यूरोप में राष्ट्रवाद का उदय",
      mr: "युरोपात राष्ट्रवादाचा उदय",
    },
    summary: {
      en: "A map redrawn by an idea: subjects turned into citizens, kings restored by a frightened congress, a secret society that thought in nations, an iron chancellor who made unity a war aim — and the painters who gave the new nations a woman's face before they had a border.",
      hi: "एक विचार से फिर खींचा नक़्शा: प्रजा नागरिक बनी, डरी हुई कांग्रेस से बहाल राजा, राष्ट्रों में सोचती एक गुप्त मंडली, एकता को युद्ध-लक्ष्य बनाता लौह चांसलर — और वे चित्रकार जिन्होंने नए राष्ट्रों को सीमा से पहले स्त्री का चेहरा दिया।",
      mr: "एका कल्पनेने पुन्हा आखलेला नकाशा: प्रजा नागरिक बनली, घाबरलेल्या परिषदेने पुन्हा बसवलेले राजे, राष्ट्रांत विचार करणारी एक गुप्त मंडळी, ऐक्याला युद्धध्येय करणारा पोलादी चॅन्सेलर — आणि त्या चित्रकारांनी नव्या राष्ट्रांना सीमेआधीच स्त्रीचा चेहरा दिला.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "nation-state",
        name: {
          en: "The nation-state",
          hi: "राष्ट्र-राज्य",
          mr: "राष्ट्र-राज्य",
        },
        kind: "idea",
        prompt: {
          en: "Before this, a realm was whatever lands a ruler had inherited or conquered, and the people in them owed loyalty to a person. Which new kind of state claimed instead to belong to its own people?",
          hi: "इससे पहले राज्य वह था जो भूमि शासक को विरासत में मिली या जीती, और उनमें बसे लोग एक व्यक्ति के प्रति निष्ठा रखते। कौन-सा नया राज्य-रूप दावा करने लगा कि वह अपने ही लोगों का?",
          mr: "याआधी राज्य म्हणजे जी भूमी शासकाला वारशाने मिळाली वा जिंकली ती, आणि तिथले लोक एका व्यक्तीशी निष्ठा राखत. कोणत्या नव्या राज्यरूपाने दावा केला की ते स्वतःच्या लोकांचे?",
        },
        statement: {
          en: "A nation-state is one in which the people are held to share a common identity and history, and where sovereignty rests with them as citizens rather than with a dynasty's inherited right.",
          hi: "राष्ट्र-राज्य वह जिसमें लोग साझा पहचान और इतिहास रखते माने जाते, और जहाँ संप्रभुता किसी वंश के विरासती अधिकार में नहीं, नागरिकों के रूप में उन्हीं में निहित।",
          mr: "राष्ट्र-राज्य ते ज्यात लोक समान ओळख आणि इतिहास बाळगतात असे मानले जाते, आणि जिथे सार्वभौमत्व एखाद्या घराण्याच्या वारसा-हक्कात नव्हे तर नागरिक म्हणून त्यांच्यातच.",
        },
        detail: {
          en: "The French Revolution supplied the vocabulary — la patrie and le citoyen — and with it a new flag, a new anthem and a single body of law replacing a patchwork of local privileges.",
          hi: "फ़्रांसीसी क्रांति ने शब्दावली दी — ला पात्री और ल सितॉयें — और उसके साथ नया झंडा, नया गान और स्थानीय विशेषाधिकारों की गुदड़ी की जगह एक ही विधि-संहिता।",
          mr: "फ्रेंच राज्यक्रांतीने शब्दसंग्रह दिला — ला पात्री आणि ल सितोयें — आणि त्यासोबत नवा झेंडा, नवे गीत आणि स्थानिक विशेषाधिकारांच्या ठिगळांऐवजी एकच कायदासंहिता.",
        },
        extra: {
          en: "No such community existed ready-made; it had to be taught into being through schools, newspapers, festivals and a standardised language.",
          hi: "ऐसा समुदाय बना-बनाया कहीं नहीं था; उसे विद्यालयों, अख़बारों, उत्सवों और मानक भाषा के ज़रिये गढ़ना पड़ा।",
          mr: "असा समुदाय तयार कुठेही नव्हता; तो शाळा, वृत्तपत्रे, उत्सव आणि प्रमाणित भाषेतून घडवावा लागला.",
        },
        pair: {
          left: {
            en: "Sovereignty moved from a dynasty to a people",
            hi: "संप्रभुता वंश से जनता को गई",
            mr: "सार्वभौमत्व घराण्याकडून लोकांकडे गेले",
          },
          right: {
            en: "the nation-state",
            hi: "राष्ट्र-राज्य",
            mr: "राष्ट्र-राज्य",
          },
        },
      },
      {
        id: "liberal-nationalism",
        name: {
          en: "Liberal nationalism",
          hi: "उदारवादी राष्ट्रवाद",
          mr: "उदारमतवादी राष्ट्रवाद",
        },
        kind: "idea",
        prompt: {
          en: "The middle classes of nineteenth-century Europe wanted a nation and a constitution in the same breath — government by consent, equality before the law, and markets free of a hundred tolls. Which political creed joined these demands?",
          hi: "उन्नीसवीं सदी के यूरोप का मध्यवर्ग एक ही साँस में राष्ट्र और संविधान चाहता था — सहमति से शासन, विधि के समक्ष समानता, और सौ चुंगियों से मुक्त बाज़ार। कौन-सी राजनीतिक विचारधारा इन माँगों को जोड़ती थी?",
          mr: "एकोणिसाव्या शतकातील युरोपचा मध्यमवर्ग एकाच श्वासात राष्ट्र आणि राज्यघटना मागत होता — संमतीने शासन, कायद्यापुढे समानता, आणि शंभर जकातींतून मुक्त बाजार. कोणत्या राजकीय विचारसरणीने या मागण्या जोडल्या?",
        },
        statement: {
          en: "Liberal nationalism demanded that a nation govern itself through a constitution and elected parliament, with equality before the law and freedom of trade and property.",
          hi: "उदारवादी राष्ट्रवाद माँगता था कि राष्ट्र संविधान और निर्वाचित संसद के ज़रिये स्वयं शासन करे, विधि के समक्ष समानता तथा व्यापार-संपत्ति की स्वतंत्रता के साथ।",
          mr: "उदारमतवादी राष्ट्रवाद मागत होता की राष्ट्राने राज्यघटना आणि निवडून आलेल्या संसदेमार्फत स्वतःचे शासन करावे, कायद्यापुढे समानता आणि व्यापार-मालमत्तेच्या स्वातंत्र्यासह.",
        },
        detail: {
          en: "Its economic wing produced the zollverein of 1834, a customs union that abolished tariff barriers between German states long before a German state existed.",
          hi: "उसकी आर्थिक शाखा ने 1834 का ज़ोलफ़ेराइन दिया, एक सीमा-शुल्क संघ जिसने जर्मन राज्यों के बीच शुल्क-बाधाएँ मिटाईं — जर्मन राज्य के अस्तित्व से बहुत पहले।",
          mr: "तिच्या आर्थिक शाखेने 1834 चे झोलफेराइन दिले, एक जकात-संघ ज्याने जर्मन संस्थानांमधील शुल्क-अडथळे मिटवले — जर्मन राज्य अस्तित्वात येण्याच्या खूप आधी.",
        },
        extra: {
          en: "Its equality had limits: in most such constitutions the vote belonged to propertied men alone, and women who had marched and printed and organised were left outside it.",
          hi: "उसकी समानता की सीमाएँ थीं: ऐसे अधिकांश संविधानों में मत केवल संपत्तिवान पुरुषों का था, और जिन स्त्रियों ने जुलूस निकाले, छापे और संगठन किए वे बाहर छूट गईं।",
          mr: "तिच्या समानतेला मर्यादा होत्या: अशा बहुतांश राज्यघटनांत मत फक्त मालमत्ताधारी पुरुषांचे होते, आणि ज्या स्त्रियांनी मोर्चे काढले, छापले आणि संघटन केले त्या बाहेरच राहिल्या.",
        },
        pair: {
          left: {
            en: "A nation and a constitution demanded together",
            hi: "राष्ट्र और संविधान एक साथ माँगे गए",
            mr: "राष्ट्र आणि राज्यघटना एकत्र मागितली",
          },
          right: {
            en: "liberal nationalism",
            hi: "उदारवादी राष्ट्रवाद",
            mr: "उदारमतवादी राष्ट्रवाद",
          },
        },
      },
      {
        id: "congress-of-vienna",
        name: {
          en: "The Congress of Vienna",
          hi: "वियना कांग्रेस",
          mr: "व्हिएन्ना परिषद",
        },
        kind: "event",
        prompt: {
          en: "With Napoleon defeated in 1815, the victorious powers met to put Europe back the way it had been — old dynasties restored, borders redrawn against France, and revolutionary ideas policed. Which settlement was this?",
          hi: "1815 में नेपोलियन की पराजय के बाद विजयी शक्तियाँ मिलीं कि यूरोप को पहले जैसा कर दें — पुराने वंश बहाल, फ़्रांस के विरुद्ध सीमाएँ फिर खींचीं, और क्रांतिकारी विचारों पर पहरा। यह कौन-सी व्यवस्था थी?",
          mr: "1815 मध्ये नेपोलियनच्या पराभवानंतर विजयी सत्ता एकत्र आल्या की युरोप पूर्वीसारखे करावे — जुनी घराणी पुन्हा बसवली, फ्रान्सविरुद्ध सीमा पुन्हा आखल्या, आणि क्रांतिकारी विचारांवर पहारा. ही कोणती व्यवस्था होती?",
        },
        statement: {
          en: "The Congress of Vienna of 1815 restored the conservative monarchies overthrown by Napoleon, ringed France with strong states, and set up censorship and policing to suppress liberal and national movements.",
          hi: "1815 की वियना कांग्रेस ने नेपोलियन द्वारा गिराई गई रूढ़िवादी राजशाहियाँ बहाल कीं, फ़्रांस को मज़बूत राज्यों से घेरा, और उदारवादी तथा राष्ट्रीय आंदोलनों को दबाने सेंसरशिप और पुलिस-प्रबंध खड़ा किया।",
          mr: "1815 च्या व्हिएन्ना परिषदेने नेपोलियनने पाडलेली सनातनी राजेशाही पुन्हा बसवली, फ्रान्सभोवती बलवान राज्यांचे कडे केले, आणि उदारमतवादी व राष्ट्रीय चळवळी दडपायला सेन्सॉरशिप व पोलिसी बंदोबस्त उभा केला.",
        },
        detail: {
          en: "It could restore thrones but not undo the memory of the Napoleonic Code, whose abolition of feudal dues and equality before the law had already been tasted across the continent.",
          hi: "वह सिंहासन बहाल कर सकी पर नेपोलियन संहिता की स्मृति नहीं मिटा सकी, जिसका सामंती वसूली का अंत और विधि के समक्ष समानता महाद्वीप भर चख लिया गया था।",
          mr: "ती सिंहासने पुन्हा बसवू शकली पण नेपोलियन संहितेची स्मृती पुसू शकली नाही, जिचा सरंजामी वसुलीचा अंत आणि कायद्यापुढील समानता खंडभर चाखली गेली होती.",
        },
        extra: {
          en: "The order it built lasted barely a generation: risings in 1830 and the revolutions of 1848 broke over it, and the ideas it had banned came back as governments.",
          hi: "उसने जो व्यवस्था बनाई वह मुश्किल से एक पीढ़ी चली: 1830 के विद्रोह और 1848 की क्रांतियाँ उस पर टूट पड़ीं, और जिन विचारों को उसने प्रतिबंधित किया वे सरकारें बनकर लौटे।",
          mr: "तिने उभारलेली व्यवस्था जेमतेम एक पिढी टिकली: 1830 चे उठाव आणि 1848 च्या क्रांत्या तिच्यावर कोसळल्या, आणि तिने बंदी घातलेले विचार सरकारे बनून परतले.",
        },
        pair: {
          left: {
            en: "Thrones restored and ideas policed after 1815",
            hi: "1815 के बाद सिंहासन बहाल और विचारों पर पहरा",
            mr: "1815 नंतर सिंहासने पुन्हा आणि विचारांवर पहारा",
          },
          right: {
            en: "the Congress of Vienna",
            hi: "वियना कांग्रेस",
            mr: "व्हिएन्ना परिषद",
          },
        },
      },
      {
        id: "mazzini",
        name: {
          en: "Giuseppe Mazzini",
          hi: "ज्यूसेपे मात्सिनी",
          mr: "जुझेप्पे मॅझिनी",
        },
        kind: "person",
        prompt: {
          en: "An exiled Italian founded Young Italy and Young Europe, argued that God had meant humanity to be organised into nations rather than kingdoms, and frightened conservatives enough for Metternich to call him the most dangerous enemy of the social order. Who was he?",
          hi: "एक निर्वासित इतालवी ने यंग इटली और यंग यूरोप की स्थापना की, तर्क दिया कि ईश्वर ने मानवता को राज्यों में नहीं राष्ट्रों में संगठित करना चाहा, और रूढ़िवादियों को इतना डराया कि मेटरनिख ने उसे सामाजिक व्यवस्था का सबसे ख़तरनाक शत्रु कहा। वह कौन था?",
          mr: "एका निर्वासित इटालियनने यंग इटली आणि यंग युरोप स्थापले, युक्तिवाद केला की देवाने मानवता राज्यांत नव्हे तर राष्ट्रांत संघटित व्हावी असे योजले, आणि सनातन्यांना इतके घाबरवले की मेटरनिखने त्याला सामाजिक व्यवस्थेचा सर्वांत धोकादायक शत्रू म्हटले. तो कोण होता?",
        },
        statement: {
          en: "Giuseppe Mazzini founded the secret societies Young Italy and Young Europe, teaching that nations were the natural units of humanity and that Italy must be forged into a single republic rather than a patchwork of kingdoms.",
          hi: "ज्यूसेपे मात्सिनी ने यंग इटली और यंग यूरोप नामक गुप्त संगठन बनाए, यह सिखाते हुए कि राष्ट्र मानवता की स्वाभाविक इकाइयाँ हैं और इटली को राज्यों की गुदड़ी नहीं, एक गणराज्य में ढालना होगा।",
          mr: "जुझेप्पे मॅझिनीने यंग इटली आणि यंग युरोप या गुप्त संघटना स्थापल्या, शिकवत की राष्ट्रे ही मानवतेची नैसर्गिक एकके आणि इटली संस्थानांच्या ठिगळांऐवजी एका प्रजासत्ताकात घडवावी.",
        },
        detail: {
          en: "He worked by conspiracy and propaganda rather than armies, and his risings failed one after another — the influence was on minds, not on maps he drew himself.",
          hi: "उसने सेनाओं से नहीं, षड्यंत्र और प्रचार से काम किया, और उसके विद्रोह एक के बाद एक विफल हुए — प्रभाव मस्तिष्कों पर था, स्वयं खींचे नक़्शों पर नहीं।",
          mr: "त्याने सैन्यांऐवजी कट आणि प्रचारातून काम केले, आणि त्याचे उठाव एकामागोमाग फसले — प्रभाव मनांवर होता, स्वतः आखलेल्या नकाशांवर नाही.",
        },
        extra: {
          en: "Italy was finally united not by his republic of the people but by the kingdom of Sardinia-Piedmont under a monarch, which is the irony written into the outcome.",
          hi: "इटली अंततः उसके जन-गणराज्य से नहीं, बल्कि एक राजा के अधीन सार्डिनिया-पीदमोंत के राज्य द्वारा एक हुआ — यही विडंबना परिणाम में लिखी है।",
          mr: "इटली अखेर त्याच्या लोक-प्रजासत्ताकाने नव्हे तर एका राजाच्या अधिपत्याखालील सार्डिनिया-पिडमाँट राज्याने एक झाली — हीच उपरोधाची नोंद निकालात.",
        },
        pair: {
          left: {
            en: "Young Italy, and nations as humanity's natural units",
            hi: "यंग इटली, और राष्ट्र मानवता की स्वाभाविक इकाइयाँ",
            mr: "यंग इटली, आणि राष्ट्रे मानवतेची नैसर्गिक एकके",
          },
          right: {
            en: "Giuseppe Mazzini",
            hi: "ज्यूसेपे मात्सिनी",
            mr: "जुझेप्पे मॅझिनी",
          },
        },
      },
      {
        id: "german-unification",
        name: {
          en: "German unification under Bismarck",
          hi: "बिस्मार्क के नेतृत्व में जर्मन एकीकरण",
          mr: "बिस्मार्कच्या नेतृत्वाखाली जर्मन एकीकरण",
        },
        kind: "event",
        prompt: {
          en: "After the liberals' parliament failed in 1848, unity was achieved instead by a Prussian chancellor who fought three deliberate wars and had the empire proclaimed in a French palace in 1871. Which unification is this?",
          hi: "1848 में उदारवादियों की संसद विफल होने के बाद एकता उस प्रशियाई चांसलर से मिली जिसने तीन सुनियोजित युद्ध लड़े और 1871 में फ़्रांसीसी महल में साम्राज्य की घोषणा करवाई। यह कौन-सा एकीकरण है?",
          mr: "1848 मध्ये उदारमतवाद्यांची संसद फसल्यावर ऐक्य त्या प्रशियन चॅन्सेलरकडून मिळाले ज्याने तीन ठरवून युद्धे लढली आणि 1871 मध्ये फ्रेंच राजवाड्यात साम्राज्याची घोषणा करवली. हे कोणते एकीकरण?",
        },
        statement: {
          en: "German unification was carried through from above by Otto von Bismarck of Prussia, using its army and three wars — against Denmark, Austria and France — to proclaim the German Empire at Versailles in 1871.",
          hi: "जर्मन एकीकरण प्रशिया के ओटो फ़ॉन बिस्मार्क ने ऊपर से करवाया, उसकी सेना और तीन युद्धों — डेनमार्क, ऑस्ट्रिया और फ़्रांस के विरुद्ध — के बल पर, और 1871 में वर्साय में जर्मन साम्राज्य की घोषणा हुई।",
          mr: "जर्मन एकीकरण प्रशियाच्या ओटो फोन बिस्मार्कने वरून घडवले, तिचे सैन्य आणि तीन युद्धे — डेन्मार्क, ऑस्ट्रिया आणि फ्रान्सविरुद्ध — वापरून, आणि 1871 मध्ये व्हर्सायमध्ये जर्मन साम्राज्याची घोषणा झाली.",
        },
        detail: {
          en: "Bismarck's own phrase for the method was 'blood and iron', and he meant it as a rebuke to those who thought speeches and majority votes could settle the question.",
          hi: "बिस्मार्क का अपना वाक्यांश था 'रक्त और लौह', और वह उसे उन लोगों को उलाहना समझता था जो मानते थे कि भाषण और बहुमत प्रश्न सुलझा देंगे।",
          mr: "बिस्मार्कचा स्वतःचा शब्दप्रयोग होता 'रक्त आणि पोलाद', आणि तो त्यांना टोमणा म्हणून वापरत होता ज्यांना वाटे भाषणे आणि बहुमत प्रश्न सोडवतील.",
        },
        extra: {
          en: "The new empire kept Prussia's army, aristocracy and monarchy at its centre, so Germans got their nation while getting very little of the liberalism the nationalists had once demanded with it.",
          hi: "नए साम्राज्य ने प्रशिया की सेना, कुलीनता और राजतंत्र को केंद्र में रखा, अतः जर्मनों को राष्ट्र मिला पर वह उदारवाद बहुत कम जो राष्ट्रवादियों ने कभी उसके साथ माँगा था।",
          mr: "नव्या साम्राज्याने प्रशियाचे सैन्य, उमरावशाही आणि राजेशाही केंद्रस्थानी ठेवली, म्हणून जर्मनांना राष्ट्र मिळाले पण तो उदारमतवाद फारच थोडा जो राष्ट्रवाद्यांनी एकेकाळी त्यासोबत मागितला होता.",
        },
        pair: {
          left: {
            en: "Blood and iron, an empire proclaimed at Versailles",
            hi: "रक्त और लौह, वर्साय में घोषित साम्राज्य",
            mr: "रक्त आणि पोलाद, व्हर्सायमध्ये घोषित साम्राज्य",
          },
          right: {
            en: "German unification under Bismarck",
            hi: "बिस्मार्क के नेतृत्व में जर्मन एकीकरण",
            mr: "बिस्मार्कच्या नेतृत्वाखाली जर्मन एकीकरण",
          },
        },
      },
      {
        id: "female-allegories",
        name: {
          en: "Female allegories of the nation",
          hi: "राष्ट्र के स्त्री-रूपक",
          mr: "राष्ट्राची स्त्री-रूपके",
        },
        kind: "idea",
        prompt: {
          en: "Painters gave France a woman in a red cap called Marianne and Germany a woman crowned with oak leaves called Germania, so that an abstract community could be seen and saluted. What device is this?",
          hi: "चित्रकारों ने फ़्रांस को लाल टोपी वाली स्त्री मारीआन दी और जर्मनी को बलूत-पत्तों का मुकुट पहने जर्मेनिया, ताकि एक अमूर्त समुदाय देखा और अभिवादित किया जा सके। यह कौन-सी युक्ति है?",
          mr: "चित्रकारांनी फ्रान्सला लाल टोपीतील स्त्री मारीआन दिली आणि जर्मनीला ओकच्या पानांचा मुकुट घातलेली जर्मेनिया, जेणेकरून एक अमूर्त समुदाय पाहता आणि वंदता येईल. ही कोणती युक्ती?",
        },
        statement: {
          en: "Female allegories personified the nation as a woman — Marianne for France, Germania for Germany — each carrying attributes such as a red cap, a broken chain or a crown of oak leaves that spelt out liberty, freedom and heroism.",
          hi: "स्त्री-रूपकों ने राष्ट्र को स्त्री के रूप में मूर्त किया — फ़्रांस के लिए मारीआन, जर्मनी के लिए जर्मेनिया — हर एक लाल टोपी, टूटी शृंखला या बलूत-मुकुट जैसे चिह्न धारण किए जो स्वतंत्रता, मुक्ति और वीरता कहते थे।",
          mr: "स्त्री-रूपकांनी राष्ट्राला स्त्रीरूप दिले — फ्रान्ससाठी मारीआन, जर्मनीसाठी जर्मेनिया — प्रत्येकीने लाल टोपी, तुटलेली साखळी वा ओक-मुकुट अशी चिन्हे धारण केली जी स्वातंत्र्य, मुक्ती आणि शौर्य सांगत.",
        },
        detail: {
          en: "The statues and coins carrying these figures did practical work: they taught an illiterate public to recognise the nation before most people could read a word about it.",
          hi: "इन आकृतियों वाली मूर्तियाँ और सिक्के व्यावहारिक काम करते थे: उन्होंने निरक्षर जनता को राष्ट्र पहचानना सिखाया — इससे पहले कि अधिकांश लोग उसके बारे में एक शब्द पढ़ सकें।",
          mr: "या आकृती वाहणारे पुतळे आणि नाणी व्यावहारिक काम करत: त्यांनी निरक्षर जनतेला राष्ट्र ओळखायला शिकवले — बहुतांश लोक त्याबद्दल एक शब्द वाचू शकण्याच्या आधीच.",
        },
        extra: {
          en: "The irony is sharp: the nation was pictured as a woman in every square while actual women were denied the vote in nearly every one of those nations.",
          hi: "विडंबना तीखी है: हर चौक में राष्ट्र स्त्री के रूप में चित्रित था जबकि उन्हीं राष्ट्रों में से लगभग हर एक में वास्तविक स्त्रियों को मत से वंचित रखा गया।",
          mr: "उपरोध तीव्र आहे: प्रत्येक चौकात राष्ट्र स्त्रीरूपात चित्रित होते तर त्याच राष्ट्रांपैकी जवळजवळ प्रत्येकात खऱ्या स्त्रियांना मताधिकार नाकारला गेला.",
        },
        pair: {
          left: {
            en: "Marianne and Germania, a community made visible",
            hi: "मारीआन और जर्मेनिया, दृश्य बना समुदाय",
            mr: "मारीआन आणि जर्मेनिया, दृश्य झालेला समुदाय",
          },
          right: {
            en: "female allegories of the nation",
            hi: "राष्ट्र के स्त्री-रूपक",
            mr: "राष्ट्राची स्त्री-रूपके",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "The rulers who met at Vienna in 1815 were not merely conservative by taste; they treated nationalism as a mortal danger and built censorship, spies and standing armies against it. Given what their own states were made of, why was that fear entirely rational?",
          hi: "1815 में वियना में मिले शासक केवल रुचि से रूढ़िवादी नहीं थे; उन्होंने राष्ट्रवाद को प्राणघातक ख़तरा माना और उसके विरुद्ध सेंसरशिप, जासूस और स्थायी सेनाएँ खड़ी कीं। उनके अपने राज्य जिस चीज़ से बने थे, उसे देखते हुए वह भय पूरी तरह तर्कसंगत क्यों था?",
          mr: "1815 मध्ये व्हिएन्नात भेटलेले राज्यकर्ते केवळ आवडीने सनातनी नव्हते; त्यांनी राष्ट्रवादाला प्राणघातक धोका मानले आणि त्याविरुद्ध सेन्सॉरशिप, हेर आणि कायम सैन्ये उभी केली. त्यांची स्वतःची राज्ये ज्यातून बनली होती ते पाहता ती भीती पूर्णपणे तर्कशुद्ध का होती?",
        },
        choices: [
          {
            en: "Because their largest states were multi-national empires, not nations. The Habsburg lands alone held Germans, Hungarians, Czechs, Poles, Italians, Croats and more under one crown, so a principle that every people deserves its own state was not a reform they could concede but an instruction to dismantle the empire itself",
            hi: "क्योंकि उनके सबसे बड़े राज्य बहुराष्ट्रीय साम्राज्य थे, राष्ट्र नहीं। अकेले हैब्सबर्ग भूभाग में जर्मन, हंगेरियाई, चेक, पोल, इतालवी, क्रोएट और अन्य एक ही ताज के नीचे थे, अतः यह सिद्धांत कि हर जन को अपना राज्य चाहिए कोई सुधार नहीं था जो वे मान लेते, बल्कि स्वयं साम्राज्य को तोड़ देने का आदेश था",
            mr: "कारण त्यांची सर्वांत मोठी राज्ये बहुराष्ट्रीय साम्राज्ये होती, राष्ट्रे नव्हे. एकट्या हॅब्सबर्ग प्रदेशात जर्मन, हंगेरियन, झेक, पोल, इटालियन, क्रोएट आणि इतर एकाच मुकुटाखाली होते, म्हणून प्रत्येक लोकसमूहाला स्वतःचे राज्य हवे हे तत्त्व त्यांना मान्य करता येणारी सुधारणा नव्हती तर स्वतः साम्राज्य मोडून टाकण्याची आज्ञा होती",
          },
          {
            en: "Because nationalists everywhere were committed to abolishing private property, which threatened the rulers' personal wealth",
            hi: "क्योंकि हर जगह के राष्ट्रवादी निजी संपत्ति मिटाने पर तुले थे, जिससे शासकों की व्यक्तिगत संपत्ति को ख़तरा था",
            mr: "कारण सर्वत्रचे राष्ट्रवादी खासगी मालमत्ता नष्ट करण्यावर ठाम होते, ज्याने राज्यकर्त्यांच्या वैयक्तिक संपत्तीला धोका होता",
          },
          {
            en: "Because nationalism was a foreign doctrine unknown in Europe, imported entirely from the Americas",
            hi: "क्योंकि राष्ट्रवाद यूरोप में अनजान विदेशी सिद्धांत था, पूरी तरह अमेरिका से आयातित",
            mr: "कारण राष्ट्रवाद युरोपात अपरिचित परका सिद्धांत होता, पूर्णपणे अमेरिकेतून आयात केलेला",
          },
          {
            en: "Because the fear was irrational: nationalism in fact strengthened every existing throne and cost the empires nothing",
            hi: "क्योंकि भय अतर्कसंगत था: राष्ट्रवाद ने वस्तुतः हर मौजूदा सिंहासन को मज़बूत किया और साम्राज्यों को कुछ नहीं गँवाया",
            mr: "कारण भीती तर्कहीन होती: राष्ट्रवादाने प्रत्यक्षात प्रत्येक विद्यमान सिंहासन बळकट केले आणि साम्राज्यांना काहीच गमवावे लागले नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "To see why the fear was rational you have to look at what these states actually were. The great powers of 1815 were not nations in any sense a nationalist would accept; they were dynastic accumulations, lands gathered over centuries by marriage, inheritance, war and treaty, and held together by loyalty to a ruling house rather than by any shared language or history. The Habsburg empire is the clearest case. Under a single crown lived German speakers in Austria, Magyars in Hungary, Czechs and Slovaks in Bohemia, Poles in Galicia, Italians in Lombardy and Venetia, Croats, Slovenes, Romanians and others besides. There was no Habsburg 'people'; there was a Habsburg family with subjects. Now set beside that the nationalist principle: that a people sharing a language, a culture and a history forms a nation, and that a nation is entitled to govern itself in a state of its own. Apply that principle to the Habsburg lands and it does not suggest a reform — it dissolves the empire. Every one of those peoples becomes a claim, and there is no version of the empire left standing at the end. Metternich, who chaired the Congress, understood this perfectly, which is why he treated a poet, a printing press or a student society as a security matter and why he called Mazzini the most dangerous man in Europe. The censorship, the secret police, the bans on student associations and the readiness to send armies into other rulers' territories to put down risings were not paranoia; they were a rational defence of a form of state that nationalism logically abolished. The events proved the calculation right. The revolutions of 1848 shook every one of these capitals at once, and although they were suppressed, the pressure never went away: Italy and Germany were unified within a generation, and the Habsburg empire itself finally broke into national states in 1918. The rulers of 1815 lost, but they had correctly identified what they were fighting. (The wrong answers substitute property for sovereignty, invent a foreign origin for an idea born in the French Revolution, or deny a threat that history went on to confirm.)",
          hi: "भय तर्कसंगत क्यों था यह देखने को यह देखना होगा कि ये राज्य वस्तुतः थे क्या। 1815 की महाशक्तियाँ किसी भी अर्थ में राष्ट्र नहीं थीं जो कोई राष्ट्रवादी माने; वे वंशीय संचय थे, सदियों में विवाह, विरासत, युद्ध और संधि से बटोरी भूमि, और किसी साझा भाषा या इतिहास से नहीं बल्कि एक शासक-कुल के प्रति निष्ठा से जुड़ी। हैब्सबर्ग साम्राज्य सबसे स्पष्ट उदाहरण। एक ही ताज के नीचे ऑस्ट्रिया में जर्मन-भाषी, हंगरी में मग्यार, बोहेमिया में चेक और स्लोवाक, गैलिसिया में पोल, लोंबार्दी और वेनेतो में इतालवी, तथा क्रोएट, स्लोवेन, रोमानियाई और अन्य रहते थे। कोई हैब्सबर्ग 'जन' नहीं था; एक हैब्सबर्ग परिवार था जिसकी प्रजा थी। अब उसके सामने राष्ट्रवादी सिद्धांत रखो: कि भाषा, संस्कृति और इतिहास साझा करते लोग एक राष्ट्र बनाते, और राष्ट्र अपने राज्य में स्वयं शासन का अधिकारी। इस सिद्धांत को हैब्सबर्ग भूभाग पर लगाओ तो वह कोई सुधार नहीं सुझाता — वह साम्राज्य को घोल देता है। उन जनों में से हर एक एक दावा बन जाता, और अंत में साम्राज्य का कोई रूप खड़ा नहीं बचता। कांग्रेस की अध्यक्षता करते मेटरनिख ने यह पूरी तरह समझा, इसीलिए वह एक कवि, एक छापाख़ाने या एक छात्र-संगठन को सुरक्षा-मामला मानता था और इसीलिए उसने मात्सिनी को यूरोप का सबसे ख़तरनाक आदमी कहा। सेंसरशिप, गुप्त पुलिस, छात्र-संघों पर प्रतिबंध और विद्रोह दबाने दूसरे शासकों के क्षेत्र में सेना भेजने की तत्परता व्यामोह नहीं थे; वे उस राज्य-रूप की तर्कसंगत रक्षा थे जिसे राष्ट्रवाद तार्किक रूप से समाप्त कर देता। घटनाओं ने गणना सही सिद्ध की। 1848 की क्रांतियों ने इन सब राजधानियों को एक साथ हिलाया, और यद्यपि वे दबा दी गईं, दबाव कभी नहीं गया: इटली और जर्मनी एक पीढ़ी में एक हुए, और स्वयं हैब्सबर्ग साम्राज्य 1918 में राष्ट्रीय राज्यों में टूट गया। 1815 के शासक हारे, पर उन्होंने ठीक पहचाना था कि वे किससे लड़ रहे हैं। (ग़लत उत्तर संप्रभुता की जगह संपत्ति रखते, फ़्रांसीसी क्रांति में जन्मे विचार को विदेशी मूल देते, या उस ख़तरे को नकारते जिसे इतिहास ने आगे चलकर पक्का किया।)",
          mr: "भीती तर्कशुद्ध का होती हे पाहायला ही राज्ये प्रत्यक्षात काय होती ते पाहावे लागेल. 1815 च्या महासत्ता कोणत्याही अर्थाने राष्ट्रे नव्हती जे कोणी राष्ट्रवादी मान्य करेल; ती घराणेशाही संचयने होती, शतकांत विवाह, वारसा, युद्ध आणि तहांतून गोळा केलेली भूमी, आणि कोणत्याही समान भाषेने वा इतिहासाने नव्हे तर एका राज्यकर्त्या घराण्याशी निष्ठेने जोडलेली. हॅब्सबर्ग साम्राज्य सर्वांत स्पष्ट उदाहरण. एकाच मुकुटाखाली ऑस्ट्रियात जर्मनभाषी, हंगेरीत मग्यार, बोहेमियात झेक आणि स्लोव्हाक, गॅलिसियात पोल, लोंबार्दी आणि व्हेनेतोत इटालियन, तसेच क्रोएट, स्लोव्हेन, रोमानियन आणि इतर राहत. कोणता हॅब्सबर्ग 'लोकसमूह' नव्हता; एक हॅब्सबर्ग कुटुंब होते ज्याला प्रजा होती. आता त्यासमोर राष्ट्रवादी तत्त्व ठेवा: भाषा, संस्कृती आणि इतिहास वाटणारे लोक एक राष्ट्र बनवतात, आणि राष्ट्र स्वतःच्या राज्यात स्वतःचे शासन करण्यास पात्र. हे तत्त्व हॅब्सबर्ग प्रदेशाला लावा आणि ते कोणतीही सुधारणा सुचवत नाही — ते साम्राज्य विरघळवते. त्या लोकसमूहांपैकी प्रत्येक एक दावा बनतो, आणि शेवटी साम्राज्याचे कोणतेही रूप उभे राहत नाही. परिषदेचे अध्यक्षपद भूषवणाऱ्या मेटरनिखने हे पूर्ण समजले, म्हणूनच तो एक कवी, एक छापखाना वा एक विद्यार्थी-संघटना ही सुरक्षा-बाब मानत असे आणि म्हणूनच त्याने मॅझिनीला युरोपातील सर्वांत धोकादायक माणूस म्हटले. सेन्सॉरशिप, गुप्त पोलीस, विद्यार्थी-संघांवरील बंदी आणि उठाव दडपायला इतर राज्यकर्त्यांच्या प्रदेशात सैन्य पाठवण्याची तयारी हा भ्रम नव्हता; ती त्या राज्यरूपाची तर्कशुद्ध बचावफळी होती जिला राष्ट्रवाद तार्किकदृष्ट्या संपवत होता. घटनांनी हिशोब बरोबर ठरवला. 1848 च्या क्रांत्यांनी या सर्व राजधान्या एकाच वेळी हादरवल्या, आणि जरी त्या दडपल्या गेल्या, दबाव कधीच गेला नाही: इटली आणि जर्मनी एका पिढीत एक झाली, आणि स्वतः हॅब्सबर्ग साम्राज्य 1918 मध्ये राष्ट्रीय राज्यांत मोडले. 1815 चे राज्यकर्ते हरले, पण ते कशाशी लढत आहेत हे त्यांनी नेमके ओळखले होते. (चुकीची उत्तरे सार्वभौमत्वाऐवजी मालमत्ता ठेवतात, फ्रेंच राज्यक्रांतीत जन्मलेल्या कल्पनेला परकी उगम देतात, वा इतिहासाने पुढे खरा ठरवलेला धोका नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "In 1848 nationalism marched under the same banner as liberty and constitutions; by 1900 the same word was being used to justify colonies, arms races and hatred of neighbours. Explain how one idea came to serve two such opposite purposes, and what changed between the two moments.",
          hi: "1848 में राष्ट्रवाद स्वतंत्रता और संविधान के साथ एक ही झंडे तले चला; 1900 तक वही शब्द उपनिवेशों, हथियारों की होड़ और पड़ोसियों से घृणा को उचित ठहराने लगा। समझाओ एक ही विचार दो इतने उल्टे प्रयोजनों की सेवा कैसे करने लगा, और दोनों क्षणों के बीच क्या बदला।",
          mr: "1848 मध्ये राष्ट्रवाद स्वातंत्र्य आणि राज्यघटनांच्या एकाच झेंड्याखाली चालला; 1900 पर्यंत तोच शब्द वसाहती, शस्त्रस्पर्धा आणि शेजाऱ्यांचा द्वेष समर्थण्यासाठी वापरला जाऊ लागला. समजावा एकच कल्पना दोन इतक्या उलट हेतूंची सेवा कशी करू लागली, आणि दोन्ही क्षणांदरम्यान काय बदलले.",
        },
        choices: [
          {
            en: "Before unification, nationalism was the demand of people who did not yet have a state, so it necessarily meant self-rule, constitutions and the overthrow of empires — liberty and nation pointed the same way. Once nations were achieved, governments took the idea over and turned it into a claim of superiority over others, useful for justifying colonies, conscription and rivalry. The idea did not change; who was wielding it, and against whom, did",
            hi: "एकीकरण से पहले राष्ट्रवाद उन लोगों की माँग था जिनके पास अभी राज्य नहीं था, अतः उसका अर्थ अनिवार्यतः स्वशासन, संविधान और साम्राज्यों का अंत था — स्वतंत्रता और राष्ट्र एक ही ओर इशारा करते थे। राष्ट्र मिल जाने पर सरकारों ने विचार अपने हाथ में लिया और उसे दूसरों पर श्रेष्ठता के दावे में बदला, जो उपनिवेशों, भर्ती और होड़ को उचित ठहराने में उपयोगी था। विचार नहीं बदला; कौन उसे चला रहा था और किसके विरुद्ध, वह बदला",
            mr: "एकीकरणापूर्वी राष्ट्रवाद ही अशा लोकांची मागणी होती ज्यांच्याकडे अजून राज्य नव्हते, म्हणून त्याचा अर्थ अपरिहार्यपणे स्वशासन, राज्यघटना आणि साम्राज्यांचा अंत होता — स्वातंत्र्य आणि राष्ट्र एकाच दिशेने निर्देश करत. राष्ट्रे मिळाल्यावर सरकारांनी कल्पना ताब्यात घेतली आणि तिचे इतरांवरील श्रेष्ठत्वाच्या दाव्यात रूपांतर केले, जे वसाहती, सक्तीची भरती आणि स्पर्धा समर्थण्यास उपयुक्त. कल्पना बदलली नाही; ती कोण चालवत होता आणि कोणाविरुद्ध, ते बदलले",
          },
          {
            en: "There were simply two unrelated ideas that happened to share a name, with no historical connection between them",
            hi: "बस दो असंबद्ध विचार थे जिनका नाम संयोग से एक था, उनमें कोई ऐतिहासिक संबंध नहीं",
            mr: "फक्त दोन असंबद्ध कल्पना होत्या ज्यांचे नाव योगायोगाने एक होते, त्यांच्यात कोणताही ऐतिहासिक संबंध नाही",
          },
          {
            en: "Nationalism remained purely liberal throughout; the aggression of 1900 came entirely from socialists",
            hi: "राष्ट्रवाद पूरे समय विशुद्ध उदारवादी रहा; 1900 की आक्रामकता पूरी तरह समाजवादियों से आई",
            mr: "राष्ट्रवाद संपूर्ण काळ शुद्ध उदारमतवादी राहिला; 1900 ची आक्रमकता पूर्णपणे समाजवाद्यांकडून आली",
          },
          {
            en: "The change was purely verbal, since no European government after 1871 ever appealed to national feeling",
            hi: "बदलाव केवल शाब्दिक था, क्योंकि 1871 के बाद किसी यूरोपीय सरकार ने राष्ट्रीय भावना की दुहाई कभी नहीं दी",
            mr: "बदल केवळ शाब्दिक होता, कारण 1871 नंतर कोणत्याही युरोपीय सरकारने राष्ट्रीय भावनेला कधी आवाहन केले नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The change is best understood not as one idea mutating into another but as the same idea passing from the hands of the excluded into the hands of the powerful. Look first at 1848. The people who called themselves nationalists then were students, journalists, lawyers, merchants and exiles — people living under Habsburg, Romanov or Bourbon rule who had no state of their own and no vote in the one they had. For them the national demand and the liberal demand were inseparable, because both meant the same thing in practice: that authority should rest on the consent of the governed rather than on inheritance. To ask for Italy or Germany was to ask for a constitution, a parliament, an end to censorship and the dismantling of empires that ruled peoples who had never chosen them. In that setting nationalism was, straightforwardly, a language of freedom, and it was persecuted precisely because it was. Now look at what happened once the demand was met. After 1871 the nation was no longer an aspiration of the powerless but an existing state with an army, a treasury, schools and newspapers — and governments discovered that national feeling was the most powerful instrument of loyalty ever available to them. Compulsory schooling could teach it, conscription could organise it, and the popular press could inflame it. But a nation that already exists cannot define itself by demanding freedom; it defines itself instead against others. So the emphasis slid from 'we deserve to rule ourselves' to 'we are superior to them' — and that second claim did work the first never could. It justified seizing colonies as a civilising mission, it justified building fleets and armies against rival nations, and it made the humiliation of a neighbour into a matter of national honour worth fighting over. The Balkans showed both faces at once, as peoples still under Ottoman or Habsburg rule invoked nationalism for liberation while the great powers invoked it to justify carving up the region between themselves. So nothing mysterious happened to the idea. Nationalism always says: this people is one, and its unity matters supremely. When the people saying it are subjects, that sentence attacks an empire. When the people saying it already command an empire of their own, the same sentence licenses conquest and contempt. The lesson is not that nationalism is simply good or simply evil, but that its moral weight depends entirely on who is speaking and against whom — which is exactly why the same word can be found on both the liberation banner and the war poster. (The wrong answers deny the continuity, blame a group that did not exist as a force in 1848, or claim the shift was only verbal — contradicted by the colonies, the arms race and the war that followed.)",
          hi: "बदलाव को एक विचार का दूसरे में रूपांतर मानने के बजाय बहिष्कृतों के हाथ से शक्तिशालियों के हाथ में उसी विचार के जाने के रूप में समझना बेहतर। पहले 1848 देखो। जो स्वयं को राष्ट्रवादी कहते थे वे छात्र, पत्रकार, वकील, व्यापारी और निर्वासित थे — हैब्सबर्ग, रोमानोव या बूर्बों शासन में जीते लोग जिनका अपना राज्य नहीं था और जो था उसमें मत नहीं। उनके लिए राष्ट्रीय माँग और उदारवादी माँग अविभाज्य थीं, क्योंकि व्यवहार में दोनों का एक ही अर्थ था: सत्ता विरासत पर नहीं, शासितों की सहमति पर टिके। इटली या जर्मनी माँगना संविधान, संसद, सेंसरशिप का अंत और उन साम्राज्यों का विघटन माँगना था जो कभी न चुने गए जनों पर शासन करते थे। उस परिवेश में राष्ट्रवाद सीधे-सीधे स्वतंत्रता की भाषा था, और उसे सताया ही इसलिए गया। अब देखो माँग पूरी होने पर क्या हुआ। 1871 के बाद राष्ट्र शक्तिहीनों की आकांक्षा नहीं रहा बल्कि सेना, कोष, विद्यालयों और अख़बारों वाला विद्यमान राज्य बन गया — और सरकारों ने पाया कि राष्ट्रीय भावना उन्हें कभी उपलब्ध निष्ठा का सबसे शक्तिशाली उपकरण है। अनिवार्य शिक्षा उसे सिखा सकती थी, भर्ती उसे संगठित कर सकती थी, और लोकप्रिय प्रेस उसे भड़का सकता था। पर जो राष्ट्र पहले से है वह स्वतंत्रता माँगकर स्वयं को परिभाषित नहीं कर सकता; वह स्वयं को दूसरों के विरुद्ध परिभाषित करता है। अतः बल 'हम स्वयं शासन के अधिकारी' से खिसककर 'हम उनसे श्रेष्ठ' पर आ गया — और वह दूसरा दावा वह काम करता था जो पहला कभी नहीं कर सकता। उसने उपनिवेश छीनना सभ्यता का मिशन कहकर उचित ठहराया, प्रतिद्वंद्वी राष्ट्रों के विरुद्ध बेड़े और सेनाएँ खड़ी करना उचित ठहराया, और पड़ोसी के अपमान को लड़ने योग्य राष्ट्रीय सम्मान का प्रश्न बना दिया। बाल्कन ने दोनों चेहरे एक साथ दिखाए, जहाँ ओटोमन या हैब्सबर्ग शासन में अब भी जीते जन मुक्ति के लिए राष्ट्रवाद की दुहाई देते थे जबकि महाशक्तियाँ आपस में क्षेत्र बाँटने को उसी की दुहाई देती थीं। अतः विचार के साथ कुछ रहस्यमय नहीं हुआ। राष्ट्रवाद सदा कहता है: यह जन एक है, और उसकी एकता सर्वोपरि। जब यह कहने वाले प्रजा हों, वह वाक्य साम्राज्य पर आक्रमण करता है। जब कहने वाले पहले से अपना साम्राज्य चलाते हों, वही वाक्य विजय और तिरस्कार का लाइसेंस बन जाता है। सबक यह नहीं कि राष्ट्रवाद बस अच्छा या बस बुरा, बल्कि यह कि उसका नैतिक भार पूरी तरह इस पर निर्भर कि बोल कौन रहा और किसके विरुद्ध — ठीक इसीलिए वही शब्द मुक्ति के झंडे और युद्ध के पोस्टर दोनों पर मिलता है। (ग़लत उत्तर निरंतरता नकारते, 1848 में शक्ति के रूप में मौजूद ही न रहे समूह को दोष देते, या बदलाव को केवल शाब्दिक कहते — जिसका खंडन उपनिवेश, हथियारों की होड़ और उसके बाद आया युद्ध करते हैं।)",
          mr: "बदल एका कल्पनेचे दुसरीत रूपांतर मानण्याऐवजी वंचितांच्या हातातून बलवानांच्या हातात त्याच कल्पनेचे जाणे म्हणून समजणे अधिक बरे. आधी 1848 पाहा. जे स्वतःला राष्ट्रवादी म्हणवत ते विद्यार्थी, पत्रकार, वकील, व्यापारी आणि निर्वासित होते — हॅब्सबर्ग, रोमानोव्ह वा बूर्बाँ राजवटीत जगणारे लोक ज्यांचे स्वतःचे राज्य नव्हते आणि जे होते त्यात मत नव्हते. त्यांच्यासाठी राष्ट्रीय मागणी आणि उदारमतवादी मागणी अभिन्न होत्या, कारण व्यवहारात दोन्हींचा एकच अर्थ होता: सत्ता वारशावर नव्हे तर शासितांच्या संमतीवर टेकावी. इटली वा जर्मनी मागणे म्हणजे राज्यघटना, संसद, सेन्सॉरशिपचा अंत आणि कधीही न निवडलेल्या लोकांवर राज्य करणाऱ्या साम्राज्यांचे विघटन मागणे. त्या परिस्थितीत राष्ट्रवाद सरळसरळ स्वातंत्र्याची भाषा होती, आणि त्याचा छळ नेमके म्हणूनच झाला. आता मागणी पूर्ण झाल्यावर काय घडले ते पाहा. 1871 नंतर राष्ट्र दुर्बलांची आकांक्षा राहिले नाही तर सैन्य, तिजोरी, शाळा आणि वृत्तपत्रे असलेले विद्यमान राज्य बनले — आणि सरकारांना कळले की राष्ट्रीय भावना हे त्यांना कधी उपलब्ध झालेले निष्ठेचे सर्वांत प्रबळ साधन आहे. सक्तीचे शिक्षण ती शिकवू शकत होते, सक्तीची भरती ती संघटित करू शकत होती, आणि लोकप्रिय वृत्तपत्रे ती भडकवू शकत होती. पण जे राष्ट्र आधीच अस्तित्वात आहे ते स्वातंत्र्य मागून स्वतःची व्याख्या करू शकत नाही; ते स्वतःची व्याख्या इतरांविरुद्ध करते. म्हणून भर 'आम्ही स्वतःचे शासन करण्यास पात्र' यावरून सरकत 'आम्ही त्यांच्याहून श्रेष्ठ' यावर आला — आणि तो दुसरा दावा ते काम करत होता जे पहिला कधीच करू शकत नव्हता. त्याने वसाहती बळकावणे सुसंस्कृत करण्याचे कार्य म्हणून समर्थले, प्रतिस्पर्धी राष्ट्रांविरुद्ध आरमारे आणि सैन्ये उभारणे समर्थले, आणि शेजाऱ्याचा अपमान लढण्याजोग्या राष्ट्रीय सन्मानाचा प्रश्न बनवला. बाल्कनने दोन्ही चेहरे एकाच वेळी दाखवले, जिथे ऑट्टोमन वा हॅब्सबर्ग राजवटीत अजून जगणारे लोक मुक्तीसाठी राष्ट्रवादाची साद घालत तर महासत्ता आपापसात प्रदेश वाटून घ्यायला तीच साद घालत. म्हणून कल्पनेबाबत काही गूढ घडले नाही. राष्ट्रवाद सदैव म्हणतो: हा लोकसमूह एक आहे, आणि त्याचे ऐक्य सर्वोच्च. जेव्हा हे म्हणणारे प्रजा असतात, ते वाक्य साम्राज्यावर हल्ला करते. जेव्हा म्हणणारे आधीच स्वतःचे साम्राज्य चालवतात, तेच वाक्य विजय आणि तुच्छतेचा परवाना बनते. धडा हा नाही की राष्ट्रवाद फक्त चांगला वा फक्त वाईट, तर हा की त्याचे नैतिक वजन पूर्णपणे यावर अवलंबून की बोलतो कोण आणि कोणाविरुद्ध — नेमके म्हणूनच तोच शब्द मुक्तीच्या झेंड्यावर आणि युद्धाच्या पोस्टरवर दोन्हीकडे सापडतो. (चुकीची उत्तरे सातत्य नाकारतात, 1848 मध्ये शक्ती म्हणून अस्तित्वातच नसलेल्या गटाला दोष देतात, वा बदल केवळ शाब्दिक म्हणतात — ज्याचे खंडन वसाहती, शस्त्रस्पर्धा आणि पुढे आलेले युद्ध करतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Nationalism in India                                        */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-10-nationalism-india",
    subject: "HISTORY",
    classLevel: 10,
    chapter: {
      en: "Chapter 2 — Nationalism in India",
      hi: "अध्याय 2 — भारत में राष्ट्रवाद",
      mr: "प्रकरण 2 — भारतात राष्ट्रवाद",
    },
    name: {
      en: "Nationalism in India",
      hi: "भारत में राष्ट्रवाद",
      mr: "भारतात राष्ट्रवाद",
    },
    summary: {
      en: "A movement that learnt to make ordinary things political: a method that refused both obedience and violence, a law passed without a single Indian vote, a garden turned into a massacre, schools and courts emptied on purpose, a movement stopped at its peak — and a fistful of salt picked up from the sea.",
      hi: "एक आंदोलन जिसने साधारण चीज़ों को राजनीतिक बनाना सीखा: एक पद्धति जिसने आज्ञापालन और हिंसा दोनों से इनकार किया, एक क़ानून जो एक भी भारतीय मत के बिना पारित हुआ, एक बाग़ जो नरसंहार बन गया, जानबूझकर ख़ाली किए विद्यालय और अदालतें, चरम पर रोका गया आंदोलन — और समुद्र से उठाई मुट्ठी भर नमक।",
      mr: "एक चळवळ जिने साध्या गोष्टी राजकीय करायला शिकले: दोन्ही — आज्ञापालन आणि हिंसा — नाकारणारी पद्धत, एकाही भारतीय मताविना संमत झालेला कायदा, हत्याकांड बनलेली बाग, मुद्दाम रिकाम्या केलेल्या शाळा आणि न्यायालये, ऐन भरात थांबवलेली चळवळ — आणि समुद्रातून उचललेली मूठभर मीठ.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "satyagraha",
        name: {
          en: "Satyagraha",
          hi: "सत्याग्रह",
          mr: "सत्याग्रह",
        },
        kind: "idea",
        prompt: {
          en: "A method that refuses to obey an unjust law and equally refuses to strike back, betting that the oppressor's conscience will be reached by the willingness to suffer. What is this method called?",
          hi: "एक पद्धति जो अन्यायी क़ानून मानने से इनकार करती और उतना ही पलटवार से भी, यह दाँव लगाते हुए कि कष्ट सहने की तत्परता उत्पीड़क की अंतरात्मा तक पहुँचेगी। यह पद्धति क्या कहलाती?",
          mr: "एक पद्धत जी अन्याय्य कायदा पाळायला नकार देते आणि तितकाच प्रत्युत्तराच्या माराला, हा डाव लावत की सोसण्याची तयारी अत्याचाऱ्याच्या सद्सद्विवेकापर्यंत पोहोचेल. ही पद्धत काय म्हणतात?",
        },
        statement: {
          en: "Satyagraha is resistance that disobeys an unjust law openly and accepts the punishment without retaliating, relying on truth and the moral force of voluntary suffering rather than on numbers or weapons.",
          hi: "सत्याग्रह वह प्रतिरोध जो अन्यायी क़ानून खुलकर तोड़ता और बिना पलटवार दंड स्वीकारता, संख्या या हथियार पर नहीं बल्कि सत्य और स्वैच्छिक कष्ट के नैतिक बल पर टिकता।",
          mr: "सत्याग्रह म्हणजे तो प्रतिकार जो अन्याय्य कायदा उघडपणे मोडतो आणि प्रत्युत्तर न देता शिक्षा स्वीकारतो, संख्या वा शस्त्रांवर नव्हे तर सत्य आणि स्वेच्छेने सोसण्याच्या नैतिक बळावर विसंबून.",
        },
        detail: {
          en: "It was tried first in South Africa and then tested in India at Champaran for indigo peasants, at Kheda for famine-struck cultivators and at Ahmedabad for mill workers.",
          hi: "इसे पहले दक्षिण अफ़्रीका में आज़माया गया और फिर भारत में चंपारण में नील किसानों के लिए, खेड़ा में अकाल-पीड़ित काश्तकारों के लिए और अहमदाबाद में मिल मज़दूरों के लिए परखा गया।",
          mr: "तो प्रथम दक्षिण आफ्रिकेत आजमावला आणि मग भारतात चंपारणमध्ये नीळ शेतकऱ्यांसाठी, खेडामध्ये दुष्काळग्रस्त शेतकऱ्यांसाठी आणि अहमदाबादमध्ये गिरणी कामगारांसाठी तपासला.",
        },
        extra: {
          en: "Its practical advantage was that anyone could join — a weaver, a widow, a schoolboy — since it needed no weapon, no training and no permission.",
          hi: "इसका व्यावहारिक लाभ यह था कि कोई भी जुड़ सकता था — बुनकर, विधवा, स्कूली बच्चा — क्योंकि इसमें न हथियार चाहिए था, न प्रशिक्षण, न अनुमति।",
          mr: "त्याचा व्यावहारिक फायदा हा की कोणीही सामील होऊ शकत होते — विणकर, विधवा, शाळकरी मुलगा — कारण त्याला शस्त्र, प्रशिक्षण वा परवानगी काहीच लागत नव्हते.",
        },
        pair: {
          left: {
            en: "Disobey openly, accept the punishment, never strike back",
            hi: "खुलकर तोड़ो, दंड स्वीकारो, पलटवार कभी नहीं",
            mr: "उघड मोडा, शिक्षा स्वीकारा, प्रत्युत्तर कधीच नाही",
          },
          right: {
            en: "satyagraha",
            hi: "सत्याग्रह",
            mr: "सत्याग्रह",
          },
        },
      },
      {
        id: "rowlatt-act",
        name: {
          en: "The Rowlatt Act",
          hi: "रौलट अधिनियम",
          mr: "रौलट कायदा",
        },
        kind: "event",
        prompt: {
          en: "In 1919 a law was pushed through the Imperial Legislative Council, against the united opposition of every Indian member, allowing political prisoners to be detained for two years without trial. Which law was this?",
          hi: "1919 में एक क़ानून इंपीरियल लेजिस्लेटिव काउंसिल से पारित करवाया गया, हर भारतीय सदस्य के एकजुट विरोध के बावजूद, जिसने राजनीतिक बंदियों को बिना मुक़दमे दो वर्ष तक बंद रखने की छूट दी। यह कौन-सा क़ानून था?",
          mr: "1919 मध्ये एक कायदा इंपीरियल लेजिस्लेटिव्ह कौन्सिलमधून रेटला गेला, प्रत्येक भारतीय सदस्याच्या एकजूट विरोधाला न जुमानता, ज्याने राजकीय कैद्यांना खटल्याविना दोन वर्षे डांबण्याची मुभा दिली. हा कोणता कायदा होता?",
        },
        statement: {
          en: "The Rowlatt Act of 1919 gave the government power to imprison political suspects without trial for two years, and it was passed although every elected Indian member of the council voted against it.",
          hi: "1919 के रौलट अधिनियम ने सरकार को राजनीतिक संदिग्धों को बिना मुक़दमे दो वर्ष क़ैद रखने की शक्ति दी, और यह तब भी पारित हुआ जब काउंसिल के हर निर्वाचित भारतीय सदस्य ने उसके विरुद्ध मत दिया।",
          mr: "1919 च्या रौलट कायद्याने सरकारला राजकीय संशयितांना खटल्याविना दोन वर्षे तुरुंगात ठेवण्याची सत्ता दिली, आणि तो कौन्सिलच्या प्रत्येक निवडून आलेल्या भारतीय सदस्याने विरोधात मत देऊनही संमत झाला.",
        },
        detail: {
          en: "The insult lay as much in the manner as in the substance: Indians had just given a million soldiers and heavy taxes to a war fought for freedom, and were repaid with detention without trial.",
          hi: "अपमान जितना विषय में उतना ढंग में था: भारतीयों ने अभी-अभी स्वतंत्रता के लिए लड़े युद्ध को दस लाख सैनिक और भारी कर दिए थे, और बदले में बिना मुक़दमे नज़रबंदी पाई।",
          mr: "अपमान जितका आशयात तितकाच रीतीत होता: भारतीयांनी नुकतेच स्वातंत्र्यासाठी लढल्या गेलेल्या युद्धाला दहा लाख सैनिक आणि जबर कर दिले होते, आणि बदल्यात खटल्याविना स्थानबद्धता मिळाली.",
        },
        extra: {
          en: "Gandhi answered it with a nationwide hartal in April 1919, the first time a single call had shut shops and stopped work in cities across the subcontinent at once.",
          hi: "गांधी ने अप्रैल 1919 में देशव्यापी हड़ताल से उत्तर दिया, पहली बार जब एक ही आह्वान ने उपमहाद्वीप भर के शहरों में एक साथ दुकानें बंद और काम ठप करवा दिया।",
          mr: "गांधींनी एप्रिल 1919 मध्ये देशव्यापी हरताळाने उत्तर दिले, पहिल्यांदाच एका हाकेने उपखंडभरच्या शहरांत एकाच वेळी दुकाने बंद आणि काम ठप्प झाले.",
        },
        pair: {
          left: {
            en: "Two years' detention without trial, passed over every Indian vote",
            hi: "बिना मुक़दमे दो वर्ष नज़रबंदी, हर भारतीय मत को दरकिनार कर पारित",
            mr: "खटल्याविना दोन वर्षे स्थानबद्धता, प्रत्येक भारतीय मत डावलून संमत",
          },
          right: {
            en: "the Rowlatt Act",
            hi: "रौलट अधिनियम",
            mr: "रौलट कायदा",
          },
        },
      },
      {
        id: "jallianwala-bagh",
        name: {
          en: "Jallianwala Bagh",
          hi: "जलियाँवाला बाग़",
          mr: "जालियनवाला बाग",
        },
        kind: "event",
        prompt: {
          en: "On 13 April 1919 a crowd gathered in a walled Amritsar garden with one narrow exit; a general blocked it and ordered his troops to fire until the ammunition ran out. Which massacre is this?",
          hi: "13 अप्रैल 1919 को अमृतसर के एक चारदीवारी वाले बाग़ में भीड़ जुटी जिसका एकमात्र निकास सँकरा था; एक जनरल ने उसे रोक दिया और गोलियाँ ख़त्म होने तक अपने सैनिकों को गोली चलाने का आदेश दिया। यह कौन-सा नरसंहार है?",
          mr: "13 एप्रिल 1919 रोजी अमृतसरच्या तटबंदी असलेल्या बागेत गर्दी जमली जिचा एकमेव निर्गम अरुंद होता; एका जनरलने तो अडवला आणि दारूगोळा संपेपर्यंत आपल्या सैनिकांना गोळीबाराचा आदेश दिला. हे कोणते हत्याकांड?",
        },
        statement: {
          en: "The Jallianwala Bagh massacre of 13 April 1919 saw General Dyer seal the only narrow exit of an enclosed garden in Amritsar and order sustained firing on an unarmed crowd, killing hundreds.",
          hi: "13 अप्रैल 1919 के जलियाँवाला बाग़ नरसंहार में जनरल डायर ने अमृतसर के घिरे बाग़ का एकमात्र सँकरा निकास बंद किया और निहत्थी भीड़ पर लगातार गोली चलाने का आदेश दिया, जिसमें सैकड़ों मारे गए।",
          mr: "13 एप्रिल 1919 च्या जालियनवाला बाग हत्याकांडात जनरल डायरने अमृतसरच्या बंदिस्त बागेचा एकमेव अरुंद निर्गम बंद केला आणि निःशस्त्र गर्दीवर सलग गोळीबाराचा आदेश दिला, ज्यात शेकडो ठार झाले.",
        },
        detail: {
          en: "Dyer stated afterwards that his object had been to produce a moral effect, which is to say the killing was intended as a lesson rather than as crowd control.",
          hi: "डायर ने बाद में कहा कि उसका उद्देश्य नैतिक प्रभाव उत्पन्न करना था, अर्थात हत्या भीड़-नियंत्रण नहीं बल्कि एक सबक़ के रूप में की गई थी।",
          mr: "डायरने नंतर सांगितले की त्याचा हेतू नैतिक परिणाम घडवणे होता, म्हणजेच हत्या गर्दी-नियंत्रण नव्हे तर धडा म्हणून केली गेली.",
        },
        extra: {
          en: "Rabindranath Tagore returned his knighthood in protest, and the massacre turned a generation of moderates into people who no longer believed the empire could be reformed from within.",
          hi: "रवींद्रनाथ ठाकुर ने विरोध में अपनी नाइटहुड लौटा दी, और नरसंहार ने उदारवादियों की एक पूरी पीढ़ी को ऐसे लोगों में बदल दिया जो अब नहीं मानते थे कि साम्राज्य भीतर से सुधारा जा सकता है।",
          mr: "रवींद्रनाथ टागोरांनी निषेधार्थ आपली नाइटहूड परत केली, आणि हत्याकांडाने मवाळांच्या एका अख्ख्या पिढीला अशा लोकांत बदलले जे आता मानत नव्हते की साम्राज्य आतून सुधारता येईल.",
        },
        pair: {
          left: {
            en: "A sealed garden in Amritsar, firing until the bullets ran out",
            hi: "अमृतसर का बंद बाग़, गोलियाँ ख़त्म होने तक गोलीबारी",
            mr: "अमृतसरची बंदिस्त बाग, गोळ्या संपेपर्यंत गोळीबार",
          },
          right: {
            en: "Jallianwala Bagh",
            hi: "जलियाँवाला बाग़",
            mr: "जालियनवाला बाग",
          },
        },
      },
      {
        id: "non-cooperation-movement",
        name: {
          en: "The Non-Cooperation Movement",
          hi: "असहयोग आंदोलन",
          mr: "असहकार चळवळ",
        },
        kind: "event",
        prompt: {
          en: "From 1921 students left government schools, lawyers gave up practice, voters boycotted councils and foreign cloth was burnt in bonfires — the argument being that British rule survived only because Indians ran it. Which movement is this?",
          hi: "1921 से छात्रों ने सरकारी विद्यालय छोड़े, वकीलों ने वकालत त्यागी, मतदाताओं ने काउंसिलों का बहिष्कार किया और विदेशी कपड़े अलावों में जलाए गए — तर्क यह कि ब्रिटिश शासन केवल इसलिए टिका है कि भारतीय उसे चला रहे हैं। यह कौन-सा आंदोलन है?",
          mr: "1921 पासून विद्यार्थ्यांनी सरकारी शाळा सोडल्या, वकिलांनी वकिली सोडली, मतदारांनी कौन्सिलांवर बहिष्कार टाकला आणि परदेशी कापड होळ्यांत जाळले गेले — युक्तिवाद हा की ब्रिटिश राजवट केवळ भारतीय ती चालवतात म्हणून टिकली आहे. ही कोणती चळवळ?",
        },
        statement: {
          en: "The Non-Cooperation Movement launched in 1921 asked Indians to withdraw from the institutions that sustained British rule — schools, courts, councils, titles and foreign goods — on the argument that the raj would collapse without Indian participation.",
          hi: "1921 में शुरू हुए असहयोग आंदोलन ने भारतीयों से कहा कि वे उन संस्थाओं से हट जाएँ जो ब्रिटिश शासन को टिकाती थीं — विद्यालय, अदालतें, काउंसिलें, उपाधियाँ और विदेशी माल — इस तर्क पर कि भारतीय भागीदारी के बिना राज ढह जाएगा।",
          mr: "1921 मध्ये सुरू झालेल्या असहकार चळवळीने भारतीयांना सांगितले की त्यांनी ब्रिटिश राजवट टिकवणाऱ्या संस्थांतून बाहेर पडावे — शाळा, न्यायालये, कौन्सिले, पदव्या आणि परदेशी माल — या युक्तिवादावर की भारतीय सहभागाविना राजवट कोसळेल.",
        },
        detail: {
          en: "It was joined to the Khilafat cause, bringing Hindu and Muslim organisations onto one platform in a way no earlier agitation had managed.",
          hi: "यह ख़िलाफ़त के मुद्दे से जुड़ा, जिसने हिंदू और मुस्लिम संगठनों को एक मंच पर लाया — ऐसा जो पहले का कोई आंदोलन नहीं कर सका था।",
          mr: "ती खिलाफत प्रश्नाशी जोडली गेली, ज्याने हिंदू आणि मुस्लीम संघटनांना एका व्यासपीठावर आणले — जे आधीच्या कोणत्याही आंदोलनाला जमले नव्हते.",
        },
        extra: {
          en: "In the countryside it took on meanings the leadership had not planned — Awadh peasants read it as licence to refuse rent, and tribal people of Gudem as permission to enter forests closed to them.",
          hi: "देहात में इसने वे अर्थ ले लिए जो नेतृत्व ने नहीं सोचे थे — अवध के किसानों ने इसे लगान न देने की छूट पढ़ा, और गूडेम के आदिवासियों ने अपने लिए बंद जंगलों में घुसने की अनुमति।",
          mr: "ग्रामीण भागात तिने नेतृत्वाने न योजलेले अर्थ घेतले — अवधच्या शेतकऱ्यांनी ती खंड न देण्याची मुभा म्हणून वाचली, आणि गुडेमच्या आदिवासींनी आपल्यासाठी बंद असलेल्या जंगलांत शिरण्याची परवानगी म्हणून.",
        },
        pair: {
          left: {
            en: "Empty the schools, courts and councils that run the raj",
            hi: "राज चलाते विद्यालय, अदालतें और काउंसिलें ख़ाली करो",
            mr: "राजवट चालवणाऱ्या शाळा, न्यायालये आणि कौन्सिले रिकामी करा",
          },
          right: {
            en: "the Non-Cooperation Movement",
            hi: "असहयोग आंदोलन",
            mr: "असहकार चळवळ",
          },
        },
      },
      {
        id: "chauri-chaura",
        name: {
          en: "Chauri Chaura",
          hi: "चौरी चौरा",
          mr: "चौरी चौरा",
        },
        kind: "event",
        prompt: {
          en: "In February 1922 a procession in a Gorakhpur village was fired on, turned on the police station and burnt it with the policemen inside — after which Gandhi called off the entire national movement. Which incident is this?",
          hi: "फ़रवरी 1922 में गोरखपुर के एक गाँव में जुलूस पर गोली चली, भीड़ थाने की ओर मुड़ी और उसे भीतर बंद सिपाहियों समेत जला दिया — जिसके बाद गांधी ने पूरा राष्ट्रीय आंदोलन वापस ले लिया। यह कौन-सी घटना है?",
          mr: "फेब्रुवारी 1922 मध्ये गोरखपूरच्या एका गावात मिरवणुकीवर गोळीबार झाला, जमाव पोलीस ठाण्याकडे वळला आणि आतल्या शिपायांसह ते जाळले — त्यानंतर गांधींनी अख्खी राष्ट्रीय चळवळ मागे घेतली. ही कोणती घटना?",
        },
        statement: {
          en: "At Chauri Chaura in February 1922 a crowd that had been fired upon burnt a police station with policemen inside, and Gandhi withdrew the Non-Cooperation Movement because it had turned violent.",
          hi: "फ़रवरी 1922 में चौरी चौरा में गोली खाई भीड़ ने भीतर बंद सिपाहियों समेत थाना जला दिया, और गांधी ने असहयोग आंदोलन इसलिए वापस लिया कि वह हिंसक हो गया था।",
          mr: "फेब्रुवारी 1922 मध्ये चौरी चौरा येथे गोळीबार सोसलेल्या जमावाने आतल्या शिपायांसह पोलीस ठाणे जाळले, आणि गांधींनी असहकार चळवळ मागे घेतली कारण ती हिंसक झाली होती.",
        },
        detail: {
          en: "The decision was taken against the advice of most of his colleagues, several of whom were in jail and learnt of it from the newspapers.",
            hi: "यह निर्णय उनके अधिकांश सहयोगियों की सलाह के विरुद्ध लिया गया, जिनमें से कई जेल में थे और उन्हें इसका पता अख़बारों से चला।",
          mr: "हा निर्णय त्यांच्या बहुतांश सहकाऱ्यांच्या सल्ल्याविरुद्ध घेतला गेला, ज्यांपैकी अनेक तुरुंगात होते आणि त्यांना तो वृत्तपत्रांतून कळला.",
        },
        extra: {
          en: "It marked a lasting split in the movement, with younger leaders concluding that a struggle halted whenever the poor lost patience could never be won on the poor's timetable.",
          hi: "इसने आंदोलन में स्थायी दरार डाली, जहाँ युवा नेताओं ने निष्कर्ष निकाला कि जो संघर्ष ग़रीबों का धैर्य टूटते ही रोक दिया जाए वह ग़रीबों की समय-सारणी पर कभी नहीं जीता जा सकता।",
          mr: "तिने चळवळीत कायमची फूट पाडली, जिथे तरुण नेत्यांनी निष्कर्ष काढला की जो लढा गरिबांचा संयम सुटताच थांबवला जातो तो गरिबांच्या वेळापत्रकावर कधीच जिंकता येणार नाही.",
        },
        pair: {
          left: {
            en: "A burnt police station, and a movement called off at its height",
            hi: "जला हुआ थाना, और चरम पर वापस लिया आंदोलन",
            mr: "जळालेले पोलीस ठाणे, आणि ऐन भरात मागे घेतलेली चळवळ",
          },
          right: {
            en: "Chauri Chaura",
            hi: "चौरी चौरा",
            mr: "चौरी चौरा",
          },
        },
      },
      {
        id: "salt-march",
        name: {
          en: "The Salt March",
          hi: "नमक यात्रा",
          mr: "मिठाची यात्रा",
        },
        kind: "event",
        prompt: {
          en: "In 1930 Gandhi walked 240 miles to the sea over twenty-four days with a growing crowd behind him, and on reaching it boiled sea water to make a substance the state claimed a monopoly on. Which march is this?",
          hi: "1930 में गांधी चौबीस दिनों में 240 मील चलकर समुद्र तक गए, पीछे बढ़ती भीड़ के साथ, और पहुँचकर समुद्र का पानी उबालकर वह वस्तु बनाई जिस पर राज्य एकाधिकार का दावा करता था। यह कौन-सी यात्रा है?",
          mr: "1930 मध्ये गांधी चोवीस दिवसांत 240 मैल चालत समुद्रापर्यंत गेले, मागे वाढत्या गर्दीसह, आणि पोहोचून समुद्राचे पाणी उकळून तो पदार्थ बनवला ज्यावर राज्य मक्तेदारीचा दावा करत होते. ही कोणती यात्रा?",
        },
        statement: {
          en: "The Salt March of 1930 was a twenty-four-day walk from Sabarmati to Dandi at the end of which Gandhi made salt from sea water, breaking the government's salt monopoly and opening the Civil Disobedience Movement.",
          hi: "1930 की नमक यात्रा साबरमती से दांडी तक चौबीस दिन की पदयात्रा थी, जिसके अंत में गांधी ने समुद्र के पानी से नमक बनाया, सरकार का नमक-एकाधिकार तोड़ा और सविनय अवज्ञा आंदोलन शुरू किया।",
          mr: "1930 ची मिठाची यात्रा साबरमतीपासून दांडीपर्यंतची चोवीस दिवसांची पदयात्रा होती, जिच्या शेवटी गांधींनी समुद्राच्या पाण्यापासून मीठ बनवले, सरकारची मिठावरील मक्तेदारी मोडली आणि सविनय कायदेभंग चळवळ सुरू केली.",
        },
        detail: {
          en: "The slowness was the design: twenty-four days of walking let newspapers report each stage, so the crime was announced in advance and committed in front of the world.",
          hi: "धीमापन ही रचना थी: चौबीस दिन की पैदल यात्रा ने अख़बारों को हर पड़ाव छापने दिया, अतः अपराध पहले से घोषित हुआ और दुनिया के सामने किया गया।",
          mr: "मंदपणा हीच रचना होती: चोवीस दिवसांच्या चालीने वृत्तपत्रांना प्रत्येक टप्पा छापू दिला, म्हणून गुन्हा आधीच जाहीर झाला आणि जगासमोर केला गेला.",
        },
        extra: {
          en: "Within weeks the defiance had spread far past salt — peasants refused revenue, forest laws were broken, and thousands of women picketed liquor and cloth shops.",
          hi: "हफ़्तों में अवज्ञा नमक से कहीं आगे फैल गई — किसानों ने लगान देने से इनकार किया, वन-क़ानून तोड़े गए, और हज़ारों स्त्रियों ने शराब और कपड़े की दुकानों पर धरना दिया।",
          mr: "आठवड्यांत अवज्ञा मिठाच्या कितीतरी पुढे पसरली — शेतकऱ्यांनी महसूल नाकारला, वनकायदे मोडले गेले, आणि हजारो स्त्रियांनी दारू व कापड दुकानांवर निदर्शने केली.",
        },
        pair: {
          left: {
            en: "Twenty-four days to the sea, a monopoly broken by boiling water",
            hi: "समुद्र तक चौबीस दिन, पानी उबालकर तोड़ा एकाधिकार",
            mr: "समुद्रापर्यंत चोवीस दिवस, पाणी उकळून मोडलेली मक्तेदारी",
          },
          right: {
            en: "the Salt March",
            hi: "नमक यात्रा",
            mr: "मिठाची यात्रा",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Of every grievance available in 1930 — land revenue, police powers, the exclusion of Indians from government — Gandhi chose to open the struggle by breaking the law on salt, which colleagues thought a trivial issue. Why was salt in fact the shrewdest possible choice?",
          hi: "1930 में उपलब्ध हर शिकायत में से — लगान, पुलिस की शक्तियाँ, शासन से भारतीयों का बहिष्कार — गांधी ने संघर्ष नमक का क़ानून तोड़कर शुरू करना चुना, जिसे सहयोगी मामूली मुद्दा मानते थे। नमक वस्तुतः सबसे चतुर चुनाव क्यों था?",
          mr: "1930 मध्ये उपलब्ध प्रत्येक तक्रारीतून — जमीन महसूल, पोलिसांचे अधिकार, शासनातून भारतीयांचे वगळणे — गांधींनी लढा मिठाचा कायदा मोडून सुरू करणे निवडले, जो सहकाऱ्यांना क्षुल्लक मुद्दा वाटला. मीठ प्रत्यक्षात सर्वांत चाणाक्ष निवड का होती?",
        },
        choices: [
          {
            en: "Because salt is used by everyone — rich and poor, every region, every religion — so a tax on it hurt the poorest most while uniting all classes behind one grievance; and making it from sea water was a crime any person could commit anywhere, in public, without a weapon and without harming anyone, leaving the state to look brutal whichever way it responded",
            hi: "क्योंकि नमक सब इस्तेमाल करते — अमीर-ग़रीब, हर क्षेत्र, हर धर्म — अतः उस पर कर सबसे ग़रीब को सबसे अधिक चुभता जबकि एक ही शिकायत के पीछे सब वर्गों को जोड़ता; और समुद्र के पानी से उसे बनाना ऐसा अपराध था जो कोई भी, कहीं भी, सार्वजनिक रूप से, बिना हथियार और बिना किसी को हानि पहुँचाए कर सकता था, जिससे राज्य जो भी उत्तर देता क्रूर दिखता",
            mr: "कारण मीठ सर्व वापरतात — श्रीमंत-गरीब, प्रत्येक प्रदेश, प्रत्येक धर्म — म्हणून त्यावरील कर सर्वांत गरिबाला सर्वाधिक बोचत होता तर एकाच तक्रारीमागे सर्व वर्गांना जोडत होता; आणि समुद्राच्या पाण्यापासून ते बनवणे असा गुन्हा होता जो कोणीही, कुठेही, जाहीरपणे, शस्त्राविना आणि कोणालाही इजा न करता करू शकत होता, ज्याने राज्य कोणतेही उत्तर दिले तरी क्रूर दिसत होते",
          },
          {
            en: "Because salt was the most profitable of all colonial taxes, so ending it alone would have bankrupted the government",
            hi: "क्योंकि नमक सब औपनिवेशिक करों में सबसे लाभदायक था, अतः अकेले उसे ख़त्म करना ही सरकार को दिवालिया कर देता",
            mr: "कारण मीठ सर्व वसाहती करांत सर्वांत फायदेशीर होते, म्हणून एकटा तोच संपवणे सरकारला दिवाळखोर करून टाकले असते",
          },
          {
            en: "Because only wealthy merchants dealt in salt, and the movement needed their financial backing above all",
            hi: "क्योंकि नमक का कारोबार केवल धनी व्यापारी करते थे, और आंदोलन को सबसे बढ़कर उनका वित्तीय समर्थन चाहिए था",
            mr: "कारण मिठाचा व्यापार फक्त धनाढ्य व्यापारी करत, आणि चळवळीला सर्वांत जास्त त्यांचा आर्थिक पाठिंबा हवा होता",
          },
          {
            en: "Because salt had no political meaning at all, and the point was to choose an issue the government would simply ignore",
            hi: "क्योंकि नमक का कोई राजनीतिक अर्थ ही नहीं था, और मक़सद ऐसा मुद्दा चुनना था जिसे सरकार बस अनदेखा कर दे",
            mr: "कारण मिठाला कोणताही राजकीय अर्थ नव्हता, आणि हेतू असा मुद्दा निवडणे होता जो सरकार फक्त दुर्लक्षित करेल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The choice looks eccentric only until you ask what a mass movement actually needs, and then salt turns out to satisfy every requirement at once. First, reach. Salt is the one commodity no household can do without, in any climate, at any income, in any community. A tax on it therefore touched literally everybody, and — because a poor family needs roughly as much salt as a rich one but earns a fraction as much — it fell hardest on those least able to pay. That made it a genuine grievance of the poorest while remaining a real grievance for everyone else, which is exactly the combination a national movement needs and almost never finds. A campaign against land revenue would have mobilised peasants but not city workers; one about council seats would have moved the educated and nobody else. Salt spoke to all of them without translation. Second, participability. Gandhi's method needed a law that ordinary people could break themselves, not merely protest about. Anyone living near the coast could boil sea water; anyone inland could buy or make illegal salt or help sell it. It needed no organisation, no money, no weapon and no training, so the movement could scale to millions without a command structure. Third, moral clarity. The act of making salt harms nobody. It destroys no property, threatens no person, and cannot be portrayed as sedition or riot. This handed the government an impossible choice, which is where the real strategy lay. If it ignored the lawbreaking, its authority visibly collapsed and the monopoly was finished in practice. If it enforced the law, it had to arrest and beat unarmed men and women — including, notoriously at Dharasana, lines of volunteers who walked forward to be clubbed without raising a hand — and photographs of that went around the world. Either response cost the raj more than the salt revenue was worth. Fourth, symbolism. That a foreign government claimed to own the salt in India's own sea captured the entire nature of colonial rule in a single image, more sharply than any speech about sovereignty could. That is why an issue dismissed as trivial produced the largest civil disobedience the empire ever faced, and why it spread within weeks into refusal of revenue, defiance of forest laws and the picketing of shops by tens of thousands of women. (The wrong answers misjudge the reasoning: salt was not the largest source of revenue, it was not a rich merchants' trade, and the aim was emphatically not to be ignored — the government's response was the point.)",
          hi: "यह चुनाव तभी तक विचित्र लगता जब तक न पूछो कि जन-आंदोलन को वस्तुतः क्या चाहिए, और फिर नमक हर आवश्यकता एक साथ पूरी करता निकलता। पहला, पहुँच। नमक वह एक वस्तु जिसके बिना कोई घर नहीं चल सकता, किसी जलवायु में, किसी आय पर, किसी समुदाय में। अतः उस पर कर सचमुच सबको छूता था, और — क्योंकि ग़रीब परिवार को अमीर जितना ही नमक चाहिए पर कमाई उसका अंश — वह उन्हीं पर सबसे भारी पड़ता जो सबसे कम चुका सकते थे। इससे वह सबसे ग़रीब की सच्ची शिकायत बना और बाक़ी सबकी भी असली शिकायत बना रहा, ठीक वही मेल जो राष्ट्रीय आंदोलन को चाहिए और लगभग कभी मिलता नहीं। लगान के विरुद्ध अभियान किसानों को जुटाता पर शहरी मज़दूरों को नहीं; काउंसिल की सीटों वाला पढ़े-लिखों को हिलाता और किसी को नहीं। नमक इन सबसे बिना अनुवाद बोलता था। दूसरा, भागीदारी। गांधी की पद्धति को ऐसा क़ानून चाहिए था जिसे साधारण लोग स्वयं तोड़ सकें, केवल जिसका विरोध न करें। तट के पास रहता कोई भी समुद्र का पानी उबाल सकता था; भीतरी इलाक़े का कोई भी अवैध नमक ख़रीद या बना या बेचने में मदद कर सकता था। इसमें न संगठन चाहिए था, न पैसा, न हथियार, न प्रशिक्षण, अतः आंदोलन बिना किसी कमान-ढाँचे के लाखों तक फैल सकता था। तीसरा, नैतिक स्पष्टता। नमक बनाने का कार्य किसी को हानि नहीं पहुँचाता। वह न संपत्ति नष्ट करता, न किसी को धमकाता, और न राजद्रोह या दंगा कहा जा सकता। इसने सरकार को असंभव विकल्प थमा दिया, और असली रणनीति वहीं थी। यदि वह क़ानून-भंग अनदेखा करती, उसका अधिकार प्रत्यक्ष रूप से ढह जाता और एकाधिकार व्यवहार में समाप्त। यदि वह क़ानून लागू करती, उसे निहत्थे स्त्री-पुरुषों को पकड़ना और पीटना पड़ता — जिनमें धरसाना में कुख्यात रूप से स्वयंसेवकों की वे पंक्तियाँ भी जो हाथ उठाए बिना लाठी खाने आगे बढ़ती रहीं — और उसकी तस्वीरें दुनिया भर घूमीं। कोई भी उत्तर राज को नमक-राजस्व के मूल्य से अधिक महँगा पड़ा। चौथा, प्रतीक। एक विदेशी सरकार भारत के अपने समुद्र के नमक पर स्वामित्व का दावा करती है — यह औपनिवेशिक शासन का पूरा स्वभाव एक ही छवि में पकड़ लेता, संप्रभुता पर किसी भी भाषण से तीखा। इसीलिए मामूली कहकर टाला गया मुद्दा साम्राज्य के सामने आई सबसे बड़ी सविनय अवज्ञा बना, और इसीलिए वह हफ़्तों में लगान से इनकार, वन-क़ानूनों की अवहेलना और हज़ारों स्त्रियों द्वारा दुकानों पर धरने तक फैल गया। (ग़लत उत्तर तर्क ग़लत आँकते: नमक राजस्व का सबसे बड़ा स्रोत नहीं था, वह धनी व्यापारियों का कारोबार नहीं था, और लक्ष्य निश्चित रूप से अनदेखा किया जाना नहीं था — सरकार की प्रतिक्रिया ही मर्म थी।)",
          mr: "ही निवड तोवरच विचित्र वाटते जोवर जनआंदोलनाला प्रत्यक्षात काय लागते हे विचारले जात नाही, आणि मग मीठ प्रत्येक गरज एकाच वेळी भागवणारे ठरते. पहिले, आवाका. मीठ ही एकच वस्तू जिच्याविना कोणतेही घर चालू शकत नाही, कोणत्याही हवामानात, कोणत्याही उत्पन्नावर, कोणत्याही समाजात. म्हणून त्यावरील कर अक्षरशः सर्वांना स्पर्शत होता, आणि — गरीब कुटुंबाला श्रीमंताइतकेच मीठ लागते पण कमाई त्याचा अंश असल्याने — तो त्यांच्यावरच सर्वांत जड पडत होता जे सर्वांत कमी देऊ शकत. यामुळे तो सर्वांत गरिबाची खरी तक्रार बनला आणि बाकी सर्वांचीही खरी तक्रार राहिला, नेमके तेच मिश्रण जे राष्ट्रीय चळवळीला हवे असते आणि जवळजवळ कधीच मिळत नाही. जमीन महसुलाविरुद्धची मोहीम शेतकऱ्यांना गोळा करी पण शहरी कामगारांना नाही; कौन्सिलच्या जागांबद्दलची शिकलेल्यांना हलवी आणि इतर कोणालाही नाही. मीठ या सर्वांशी भाषांतराविना बोलत होते. दुसरे, सहभागक्षमता. गांधींच्या पद्धतीला असा कायदा हवा होता जो सामान्य माणसे स्वतः मोडू शकतील, केवळ ज्याचा निषेध करणार नाहीत. किनाऱ्याजवळ राहणारा कोणीही समुद्राचे पाणी उकळू शकत होता; आतल्या भागातील कोणीही बेकायदा मीठ विकत घेऊ, बनवू वा विकायला मदत करू शकत होता. यात संघटन, पैसा, शस्त्र वा प्रशिक्षण काहीच लागत नव्हते, म्हणून चळवळ कोणत्याही आज्ञा-रचनेविना लाखांपर्यंत पसरू शकत होती. तिसरे, नैतिक स्पष्टता. मीठ बनवण्याची कृती कोणालाही इजा करत नाही. ती मालमत्ता नष्ट करत नाही, कोणाला धमकावत नाही, आणि तिला राजद्रोह वा दंगा म्हणता येत नाही. यामुळे सरकारपुढे अशक्य पर्याय आले, आणि खरी व्यूहरचना तिथेच होती. कायदेभंगाकडे दुर्लक्ष केले तर तिचा अधिकार उघडपणे कोसळत होता आणि मक्तेदारी व्यवहारात संपत होती. कायदा राबवला तर निःशस्त्र स्त्री-पुरुषांना अटक करून मारावे लागत होते — ज्यांत धरसाना येथे कुप्रसिद्धपणे त्या स्वयंसेवकांच्या रांगाही ज्या हात न उचलता लाठी खायला पुढे जात राहिल्या — आणि त्याची छायाचित्रे जगभर फिरली. कोणतेही उत्तर राजवटीला मिठाच्या महसुलाच्या मोलाहून महाग पडले. चौथे, प्रतीक. परकी सरकार भारताच्या स्वतःच्या समुद्रातील मिठावर मालकीचा दावा करते — हे वसाहती राजवटीचे अख्खे स्वरूप एकाच प्रतिमेत पकडत होते, सार्वभौमत्वावरील कोणत्याही भाषणाहून तीक्ष्ण. म्हणूनच क्षुल्लक म्हणून झटकलेला मुद्दा साम्राज्याने पाहिलेला सर्वांत मोठा सविनय कायदेभंग ठरला, आणि म्हणूनच तो आठवड्यांत महसूल नाकारणे, वनकायद्यांची अवहेलना आणि हजारो स्त्रियांची दुकानांवरील निदर्शने इथवर पसरला. (चुकीची उत्तरे तर्क चुकवतात: मीठ महसुलाचा सर्वांत मोठा स्रोत नव्हते, तो धनाढ्य व्यापाऱ्यांचा व्यापार नव्हता, आणि उद्दिष्ट निश्चितच दुर्लक्षिले जाणे नव्हते — सरकारची प्रतिक्रियाच मुद्दा होती.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "In February 1922 Non-Cooperation was at its height — thousands of schools emptied, courts boycotted, cloth burnt — when Gandhi ended it because of a riot in one village that killed twenty-two policemen. Many colleagues, several of them in jail, thought this a catastrophic error. Set out the strongest case on each side.",
          hi: "फ़रवरी 1922 में असहयोग अपने चरम पर था — हज़ारों विद्यालय ख़ाली, अदालतों का बहिष्कार, कपड़े जले — जब गांधी ने उसे एक गाँव के उस दंगे के कारण समाप्त कर दिया जिसमें बाईस सिपाही मारे गए। कई सहयोगियों ने, जिनमें कई जेल में थे, इसे विनाशकारी भूल माना। दोनों पक्षों का सबसे मज़बूत तर्क रखो।",
          mr: "फेब्रुवारी 1922 मध्ये असहकार ऐन भरात होता — हजारो शाळा रिकाम्या, न्यायालयांवर बहिष्कार, कापड जाळले — तेव्हा गांधींनी एका गावातील त्या दंगलीमुळे तो संपवला ज्यात बावीस शिपाई मारले गेले. अनेक सहकाऱ्यांनी, ज्यांतील कित्येक तुरुंगात होते, ही विनाशकारी चूक मानली. दोन्ही बाजूंचा सर्वांत भक्कम युक्तिवाद मांडा.",
        },
        choices: [
          {
            en: "For withdrawal: the movement's entire power was that it could not be called violent, and a single burnt police station handed the government the justification for mass repression it wanted; a leader who tolerates one exception cannot ask the next crowd for restraint. Against: the movement was at its peak and never recovered that unity, the Khilafat alliance broke, and the decision let the discipline of the poorest villagers determine the fate of a national struggle — with critics adding that the raj's own far greater violence never halted anything",
            hi: "वापसी के पक्ष में: आंदोलन की पूरी शक्ति यही थी कि उसे हिंसक नहीं कहा जा सकता, और एक जले थाने ने सरकार को वह बहाना दे दिया जो वह व्यापक दमन के लिए चाहती थी; जो नेता एक अपवाद सह लेता वह अगली भीड़ से संयम नहीं माँग सकता। विरोध में: आंदोलन चरम पर था और वह एकता फिर कभी नहीं लौटी, ख़िलाफ़त गठबंधन टूटा, और निर्णय ने सबसे ग़रीब गाँववालों के अनुशासन को राष्ट्रीय संघर्ष का भाग्य तय करने दिया — आलोचक जोड़ते हैं कि राज की अपनी कहीं बड़ी हिंसा ने कभी कुछ नहीं रोका",
            mr: "मागे घेण्याच्या बाजूने: चळवळीची अख्खी शक्ती हीच होती की तिला हिंसक म्हणता येत नव्हते, आणि एका जळालेल्या पोलीस ठाण्याने सरकारला व्यापक दडपशाहीचे हवे असलेले समर्थन दिले; जो नेता एक अपवाद सहन करतो तो पुढच्या जमावाकडून संयम मागू शकत नाही. विरोधात: चळवळ ऐन भरात होती आणि ते ऐक्य पुन्हा कधीच परतले नाही, खिलाफत आघाडी तुटली, आणि निर्णयाने सर्वांत गरीब गावकऱ्यांच्या शिस्तीला राष्ट्रीय लढ्याचे भवितव्य ठरवू दिले — टीकाकार जोडतात की राजवटीच्या स्वतःच्या कितीतरी मोठ्या हिंसेने कधीच काही थांबवले नाही",
          },
          {
            en: "There is no case against withdrawal; every historian and every contemporary agreed it was obviously correct",
            hi: "वापसी के विरुद्ध कोई तर्क है ही नहीं; हर इतिहासकार और हर समकालीन सहमत था कि यह स्पष्टतः सही था",
            mr: "मागे घेण्याविरुद्ध कोणताही युक्तिवाद नाहीच; प्रत्येक इतिहासकार आणि प्रत्येक समकालीन सहमत होता की ते उघडपणे बरोबर होते",
          },
          {
            en: "The withdrawal happened because the government had already conceded independence, making the movement unnecessary",
            hi: "वापसी इसलिए हुई कि सरकार पहले ही स्वतंत्रता दे चुकी थी, जिससे आंदोलन अनावश्यक हो गया",
            mr: "मागे घेणे यामुळे झाले की सरकारने आधीच स्वातंत्र्य दिले होते, ज्याने चळवळ अनावश्यक ठरली",
          },
          {
            en: "Gandhi withdrew because he had lost interest in politics and wished to leave public life permanently",
            hi: "गांधी ने वापसी इसलिए ली कि राजनीति में उनकी रुचि जाती रही और वे सार्वजनिक जीवन सदा को छोड़ना चाहते थे",
            mr: "गांधींनी माघार यासाठी घेतली की राजकारणातील त्यांची आवड संपली आणि त्यांना सार्वजनिक जीवन कायमचे सोडायचे होते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "This is one of the genuinely contested decisions in Indian history, and the honest answer is that both sides have real weight. Take the case for withdrawal first. Non-Cooperation's whole strategic advantage was moral, not material. The movement had no arms and no chance of defeating the Indian Army in the field; what it had was the impossibility of being described as a rebellion. That is what made repression expensive for the government, what kept lawyers, students, merchants and peasants able to join without becoming criminals in their own eyes, and what made British liberals uneasy about their own empire. A police station burnt with twenty-two men inside destroyed that in a single afternoon, and Gandhi could see exactly how it would be used: as proof that non-cooperation was rebellion in disguise, licensing arrests, firing and collective punishment with public opinion at home behind it. There is also the deeper point about principle. If non-violence is only maintained while it is convenient, then it is a tactic, not a commitment — and a leader who forgives one massacre cannot credibly ask the next village to stand still while it is beaten. Gandhi believed the country was not yet trained for the discipline he was asking of it, and that a movement that turned violent would end in a far bloodier defeat than a movement paused. Now the case against, which is not weak. The movement was at a peak it never reached again in that form. The Khilafat alliance, which had brought Hindu and Muslim organisations onto a single platform as no agitation had before, dissolved and never re-formed; the communal politics of the following decades grew in that gap. Thousands who had left schools, practices and offices at great personal cost were left with nothing to show, and many did not return in 1930. Younger leaders drew the lesson that the movement's timetable was being set by whether the poorest and most provoked villagers could absorb police firing without breaking — an impossibly high bar, and one that effectively gave the government a veto: provoke a riot anywhere and the national struggle stops. Critics also noted the asymmetry, and it is a hard one to answer: the raj had massacred hundreds at Jallianwala Bagh without any interruption to its programme, yet twenty-two deaths halted the national movement. The most defensible conclusion is that this was a real trade, not a blunder or an obvious truth. Gandhi bought the movement's moral standing and its future capacity to mobilise — which did return in 1930, larger than before — at the cost of immediate momentum and the Hindu-Muslim alliance, and it is legitimate for historians to disagree about whether that price was worth paying. (The wrong answers deny the controversy, invent a concession of independence that did not occur, or attribute to disinterest a decision Gandhi explained at length in terms of discipline and principle.)",
          hi: "यह भारतीय इतिहास के सचमुच विवादित निर्णयों में है, और ईमानदार उत्तर यह कि दोनों पक्षों में असली वज़न है। पहले वापसी का पक्ष। असहयोग का पूरा रणनीतिक लाभ नैतिक था, भौतिक नहीं। आंदोलन के पास न हथियार थे न मैदान में भारतीय सेना को हराने का कोई अवसर; उसके पास यह था कि उसे विद्रोह कहा ही नहीं जा सकता था। यही सरकार के लिए दमन को महँगा बनाता था, यही वकीलों, छात्रों, व्यापारियों और किसानों को अपनी ही नज़र में अपराधी बने बिना जुड़ने देता था, और यही ब्रिटिश उदारवादियों को अपने ही साम्राज्य पर असहज करता था। भीतर बाईस लोगों समेत जला एक थाना उसे एक ही दोपहर में नष्ट कर गया, और गांधी ठीक-ठीक देख सकते थे कि उसका उपयोग कैसे होगा: प्रमाण के रूप में कि असहयोग भेस बदला विद्रोह है, जो गिरफ़्तारियों, गोलीबारी और सामूहिक दंड को घर की जनमत के समर्थन सहित छूट दे देता। सिद्धांत का गहरा बिंदु भी है। यदि अहिंसा केवल तब तक निभे जब तक सुविधाजनक, तो वह युक्ति है, प्रतिबद्धता नहीं — और जो नेता एक हत्याकांड क्षमा कर दे वह अगले गाँव से विश्वसनीय ढंग से यह नहीं माँग सकता कि पिटते हुए स्थिर खड़ा रहे। गांधी मानते थे कि देश अभी उस अनुशासन के लिए तैयार नहीं जो वे माँग रहे थे, और हिंसक हो गया आंदोलन रुके हुए आंदोलन से कहीं अधिक रक्तरंजित पराजय में समाप्त होता। अब विरोध का पक्ष, जो दुर्बल नहीं। आंदोलन उस चरम पर था जिस रूप में वह फिर कभी नहीं पहुँचा। ख़िलाफ़त गठबंधन, जिसने हिंदू और मुस्लिम संगठनों को एक मंच पर लाया था जैसा पहले किसी आंदोलन ने नहीं, बिखर गया और फिर कभी नहीं बना; आने वाले दशकों की सांप्रदायिक राजनीति उसी रिक्ति में बढ़ी। जिन हज़ारों ने भारी व्यक्तिगत क़ीमत पर विद्यालय, वकालत और दफ़्तर छोड़े थे उनके हाथ कुछ नहीं आया, और कई 1930 में लौटे ही नहीं। युवा नेताओं ने यह सबक़ लिया कि आंदोलन की समय-सारणी इस पर तय हो रही कि सबसे ग़रीब और सबसे उकसाए गाँववाले पुलिस की गोली बिना टूटे सह पाते हैं या नहीं — असंभव रूप से ऊँची कसौटी, और ऐसी जो व्यवहार में सरकार को वीटो दे देती: कहीं भी दंगा भड़काओ और राष्ट्रीय संघर्ष रुक जाए। आलोचकों ने विषमता भी नोट की, और उसका उत्तर कठिन है: राज ने जलियाँवाला बाग़ में सैकड़ों को मारा था बिना अपने कार्यक्रम में कोई विघ्न पड़े, फिर भी बाईस मौतों ने राष्ट्रीय आंदोलन रोक दिया। सबसे बचाव-योग्य निष्कर्ष यह कि यह एक असली सौदा था, न कोई भूल न कोई स्पष्ट सत्य। गांधी ने आंदोलन की नैतिक साख और भविष्य में जुटाने की क्षमता ख़रीदी — जो 1930 में पहले से बड़ी होकर लौटी भी — तात्कालिक गति और हिंदू-मुस्लिम गठबंधन की क़ीमत पर, और इतिहासकारों का यह असहमत होना वैध है कि वह क़ीमत चुकाने योग्य थी या नहीं। (ग़लत उत्तर विवाद नकारते, न हुई स्वतंत्रता की रियायत गढ़ते, या उस निर्णय को अरुचि बताते जिसे गांधी ने अनुशासन और सिद्धांत के शब्दों में विस्तार से समझाया था।)",
          mr: "हा भारतीय इतिहासातील खऱ्या वादग्रस्त निर्णयांपैकी आहे, आणि प्रामाणिक उत्तर हे की दोन्ही बाजूंना खरे वजन आहे. आधी माघारीची बाजू. असहकाराचा अख्खा व्यूहात्मक फायदा नैतिक होता, भौतिक नाही. चळवळीकडे शस्त्रे नव्हती आणि रणांगणात भारतीय सैन्याला हरवण्याची संधीही नव्हती; तिच्याकडे हे होते की तिला बंड म्हणताच येत नव्हते. हेच सरकारसाठी दडपशाही महाग करत होते, हेच वकील, विद्यार्थी, व्यापारी आणि शेतकऱ्यांना स्वतःच्या नजरेत गुन्हेगार न होता सामील होऊ देत होते, आणि हेच ब्रिटिश उदारमतवाद्यांना स्वतःच्याच साम्राज्याबद्दल अस्वस्थ करत होते. आत बावीस माणसांसह जळालेले एक पोलीस ठाणे ते एका दुपारीत नष्ट करून गेले, आणि गांधी नेमके पाहू शकत होते की त्याचा वापर कसा होईल: पुरावा म्हणून की असहकार म्हणजे वेष बदललेले बंड, जे अटका, गोळीबार आणि सामूहिक शिक्षा यांना मायदेशातील जनमताच्या पाठिंब्यासह परवाना देईल. तत्त्वाचा खोल मुद्दाही आहे. अहिंसा जर केवळ सोयीस्कर असेपर्यंतच पाळली जात असेल, तर ती युक्ती आहे, बांधिलकी नाही — आणि जो नेता एक हत्याकांड माफ करतो तो पुढच्या गावाकडून विश्वासार्हपणे हे मागू शकत नाही की मार खाताना स्थिर उभे राहा. गांधींना वाटले देश अजून त्या शिस्तीसाठी तयार नाही जी ते मागत होते, आणि हिंसक झालेली चळवळ थांबवलेल्या चळवळीहून कितीतरी रक्तरंजित पराभवात संपली असती. आता विरोधाची बाजू, जी दुर्बळ नाही. चळवळ त्या शिखरावर होती जिथे ती त्या रूपात पुन्हा कधीच पोहोचली नाही. खिलाफत आघाडी, जिने हिंदू आणि मुस्लीम संघटनांना एका व्यासपीठावर आणले होते जसे आधी कोणत्याही आंदोलनाने नाही, विरघळली आणि पुन्हा कधीच जमली नाही; पुढच्या दशकांचे जातीय राजकारण त्याच पोकळीत वाढले. ज्या हजारांनी मोठ्या वैयक्तिक किंमतीवर शाळा, वकिली आणि कार्यालये सोडली होती त्यांच्या हाती काहीच लागले नाही, आणि अनेक 1930 मध्ये परतलेच नाहीत. तरुण नेत्यांनी हा धडा घेतला की चळवळीचे वेळापत्रक यावरून ठरत आहे की सर्वांत गरीब आणि सर्वांत चिथावलेले गावकरी पोलिसांचा गोळीबार न मोडता सोसू शकतात की नाही — अशक्यप्राय उंच कसोटी, आणि अशी जी व्यवहारात सरकारला नकाराधिकार देते: कुठेही दंगल घडवा आणि राष्ट्रीय लढा थांबतो. टीकाकारांनी विषमताही नोंदवली, आणि तिचे उत्तर कठीण आहे: राजवटीने जालियनवाला बागेत शेकडोंना मारले होते आपल्या कार्यक्रमात कोणताही व्यत्यय न येता, तरीही बावीस मृत्यूंनी राष्ट्रीय चळवळ थांबवली. सर्वांत बचावयोग्य निष्कर्ष हा की हा खरा सौदा होता, ना चूक ना उघड सत्य. गांधींनी चळवळीची नैतिक पत आणि भविष्यातील जमवाजमवीची क्षमता विकत घेतली — जी 1930 मध्ये आधीहून मोठी होऊन परतलीही — तात्कालिक गती आणि हिंदू-मुस्लीम आघाडीच्या किंमतीवर, आणि ती किंमत देण्याजोगी होती की नाही यावर इतिहासकारांचे मतभेद असणे रास्त आहे. (चुकीची उत्तरे वाद नाकारतात, न घडलेली स्वातंत्र्याची सवलत रचतात, वा गांधींनी शिस्त आणि तत्त्वाच्या भाषेत विस्ताराने समजावलेल्या निर्णयाला अनास्था म्हणतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — The Making of a Global World                                */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-10-global-world",
    subject: "HISTORY",
    classLevel: 10,
    chapter: {
      en: "Chapter 3 — The Making of a Global World",
      hi: "अध्याय 3 — भूमंडलीकृत विश्व का बनना",
      mr: "प्रकरण 3 — जागतिकीकृत जगाची घडण",
    },
    name: {
      en: "The Making of a Global World",
      hi: "भूमंडलीकृत विश्व का बनना",
      mr: "जागतिकीकृत जगाची घडण",
    },
    summary: {
      en: "The world stitched together by things that travelled: crops that changed what the poor could eat, germs that conquered where armies could not, labourers shipped under contracts they could not read, a cattle plague that cleared a continent for colonists, a slump that reached villages no banker had heard of — and the institutions built afterwards to stop it happening again.",
      hi: "जो चीज़ें यात्रा करती गईं उन्होंने विश्व को सिया: वे फ़सलें जिन्होंने बदला कि ग़रीब क्या खा सकते, वे रोगाणु जिन्होंने वहाँ जीता जहाँ सेनाएँ न जीत सकीं, वे मज़दूर जो न पढ़े जा सकने वाले अनुबंधों पर भेजे गए, वह पशु-महामारी जिसने उपनिवेशकों के लिए एक महाद्वीप ख़ाली किया, वह मंदी जो उन गाँवों तक पहुँची जिनका नाम किसी बैंकर ने न सुना था — और बाद में बनी वे संस्थाएँ जो इसे फिर होने से रोकें।",
      mr: "जे प्रवास करत गेले त्यांनी जग शिवले: गरीब काय खाऊ शकतात ते बदलणारी पिके, सैन्ये जिथे जिंकू शकली नाहीत तिथे जिंकणारे जंतू, न वाचता येणाऱ्या करारांवर पाठवलेले मजूर, वसाहतवाद्यांसाठी एक खंड रिकामे करणारी जनावरांची साथ, कोणत्या बँकरने नाव ऐकले नाही अशा गावांपर्यंत पोहोचलेली मंदी — आणि हे पुन्हा घडू नये म्हणून नंतर उभारलेल्या संस्था.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "foods-that-travelled",
        name: {
          en: "Foods that travelled the world",
          hi: "दुनिया घूमने वाले खाद्य",
          mr: "जग फिरलेले अन्नपदार्थ",
        },
        kind: "process",
        prompt: {
          en: "Potatoes, maize, tomatoes, chillies and groundnuts were unknown outside the Americas until the sixteenth century, and within two hundred years they were staples in Europe, Africa and Asia. What is this exchange?",
          hi: "आलू, मक्का, टमाटर, मिर्च और मूँगफली सोलहवीं सदी तक अमेरिका के बाहर अनजान थे, और दो सौ वर्षों में वे यूरोप, अफ़्रीका और एशिया के मुख्य आहार बन गए। यह कौन-सा आदान-प्रदान है?",
          mr: "बटाटे, मका, टोमॅटो, मिरची आणि भुईमूग सोळाव्या शतकापर्यंत अमेरिकेबाहेर अपरिचित होते, आणि दोनशे वर्षांत ते युरोप, आफ्रिका आणि आशियाचे मुख्य अन्न बनले. ही कोणती देवाणघेवाण?",
        },
        statement: {
          en: "The travel of foods carried American crops such as the potato, maize, tomato, chilli and groundnut across the world after the sixteenth century, changing what ordinary people everywhere could grow and eat.",
          hi: "खाद्यों की यात्रा ने आलू, मक्का, टमाटर, मिर्च और मूँगफली जैसी अमेरिकी फ़सलें सोलहवीं सदी के बाद विश्व भर पहुँचाईं, और बदल दिया कि हर जगह साधारण लोग क्या उगा और खा सकते हैं।",
          mr: "अन्नपदार्थांच्या प्रवासाने बटाटा, मका, टोमॅटो, मिरची आणि भुईमूग यांसारखी अमेरिकी पिके सोळाव्या शतकानंतर जगभर नेली, आणि सर्वत्र सामान्य लोक काय पिकवू आणि खाऊ शकतात ते बदलले.",
        },
        detail: {
          en: "The potato mattered most: it yielded far more food per acre than grain, and Europe's poor grew visibly better fed and longer lived where it was adopted.",
          hi: "आलू सबसे अधिक मायने रखा: वह अनाज से कहीं अधिक भोजन प्रति एकड़ देता था, और जहाँ अपनाया गया वहाँ यूरोप के ग़रीब दृश्य रूप से बेहतर खाए-पिए और लंबा जिए।",
          mr: "बटाटा सर्वांत महत्त्वाचा ठरला: तो धान्याहून कितीतरी अधिक अन्न प्रति एकर देत होता, आणि जिथे स्वीकारला तिथे युरोपचे गरीब दृश्यमानरीत्या अधिक चांगले खाल्लेले आणि दीर्घायुषी झाले.",
        },
        extra: {
          en: "Dependence on one crop had its own price: when blight destroyed the potato in Ireland in the 1840s, about a million people died and many more emigrated.",
          hi: "एक ही फ़सल पर निर्भरता की अपनी क़ीमत थी: जब 1840 के दशक में झुलसा-रोग ने आयरलैंड में आलू नष्ट किया, लगभग दस लाख लोग मरे और उससे कहीं अधिक देश छोड़ गए।",
          mr: "एकाच पिकावरील अवलंबित्वाची स्वतःची किंमत होती: 1840 च्या दशकात करपा रोगाने आयर्लंडमध्ये बटाटा नष्ट केला तेव्हा सुमारे दहा लाख लोक मेले आणि त्याहून कितीतरी अधिक देश सोडून गेले.",
        },
        pair: {
          left: {
            en: "American crops feeding the world's poor",
            hi: "दुनिया के ग़रीबों को खिलातीं अमेरिकी फ़सलें",
            mr: "जगातील गरिबांना खाऊ घालणारी अमेरिकी पिके",
          },
          right: {
            en: "foods that travelled the world",
            hi: "दुनिया घूमने वाले खाद्य",
            mr: "जग फिरलेले अन्नपदार्थ",
          },
        },
      },
      {
        id: "germs-conquest",
        name: {
          en: "Germs and the conquest of America",
          hi: "रोगाणु और अमेरिका की विजय",
          mr: "जंतू आणि अमेरिकेचा विजय",
        },
        kind: "process",
        prompt: {
          en: "A few hundred Spaniards overthrew empires of millions in the sixteenth century, but the decisive weapon was carried in their bodies rather than their hands — smallpox, to which the Americas had no immunity. What conquest is this?",
          hi: "कुछ सौ स्पेनियों ने सोलहवीं सदी में लाखों के साम्राज्य गिरा दिए, पर निर्णायक हथियार उनके हाथों में नहीं, उनकी देह में था — चेचक, जिसके विरुद्ध अमेरिका में कोई प्रतिरोध-क्षमता नहीं थी। यह कौन-सी विजय है?",
          mr: "काही शेकडो स्पॅनिशांनी सोळाव्या शतकात लाखोंची साम्राज्ये पाडली, पण निर्णायक शस्त्र त्यांच्या हातांत नव्हे तर देहात होते — देवी, ज्याविरुद्ध अमेरिकेत कोणतीही प्रतिकारशक्ती नव्हती. हा कोणता विजय?",
        },
        statement: {
          en: "The conquest of America was decided less by guns than by germs: smallpox and other Old World diseases, against which the indigenous peoples had no immunity, killed a vast share of the population ahead of the invading armies.",
          hi: "अमेरिका की विजय बंदूक़ों से कम, रोगाणुओं से अधिक तय हुई: चेचक और पुरानी दुनिया के अन्य रोगों ने, जिनके विरुद्ध वहाँ के मूल निवासियों में कोई प्रतिरोध-क्षमता नहीं थी, आक्रमणकारी सेनाओं से पहले ही आबादी का बड़ा हिस्सा मार डाला।",
          mr: "अमेरिकेचा विजय बंदुकांहून कमी आणि जंतूंनी अधिक ठरला: देवी आणि जुन्या जगातील इतर रोगांनी, ज्यांविरुद्ध तिथल्या मूळ लोकांत प्रतिकारशक्ती नव्हती, आक्रमक सैन्यांच्या आधीच लोकसंख्येचा मोठा भाग मारला.",
        },
        detail: {
          en: "The peoples of the Americas had lived apart from Eurasia's crowd diseases for thousands of years, so no inherited resistance had ever built up among them.",
          hi: "अमेरिका के लोग हज़ारों वर्षों से यूरेशिया के भीड़-जन्य रोगों से अलग रहे थे, अतः उनमें कोई विरासती प्रतिरोध-क्षमता कभी बनी ही नहीं।",
          mr: "अमेरिकेतील लोक हजारो वर्षे युरेशियाच्या गर्दी-रोगांपासून दूर राहिले होते, म्हणून त्यांच्यात कोणतीही वारसा-प्रतिकारशक्ती कधी तयारच झाली नाही.",
        },
        extra: {
          en: "The wealth that followed — silver from Peru and Mexico — financed Europe's trade with Asia for two centuries, which is how a demographic catastrophe became somebody else's prosperity.",
          hi: "जो संपत्ति उसके बाद आई — पेरू और मैक्सिको की चाँदी — उसने दो सदियों तक एशिया के साथ यूरोप का व्यापार वित्तपोषित किया, इस तरह एक जनसंख्यात्मक विपत्ति किसी और की समृद्धि बन गई।",
          mr: "त्यानंतर आलेल्या संपत्तीने — पेरू आणि मेक्सिकोच्या चांदीने — दोन शतके आशियाशी युरोपचा व्यापार चालवला, अशा प्रकारे एक लोकसंख्याविषयक आपत्ती दुसऱ्या कोणाची समृद्धी बनली.",
        },
        pair: {
          left: {
            en: "Smallpox reaching a continent before the soldiers did",
            hi: "सैनिकों से पहले महाद्वीप पहुँचती चेचक",
            mr: "सैनिकांच्या आधी खंडात पोहोचलेली देवी",
          },
          right: {
            en: "germs and the conquest of America",
            hi: "रोगाणु और अमेरिका की विजय",
            mr: "जंतू आणि अमेरिकेचा विजय",
          },
        },
      },
      {
        id: "indentured-labour",
        name: {
          en: "Indentured labour migration",
          hi: "गिरमिटिया मज़दूरों का प्रवास",
          mr: "करारबद्ध मजुरांचे स्थलांतर",
        },
        kind: "process",
        prompt: {
          en: "After slavery was abolished, plantations in Mauritius, Fiji, Trinidad and Guyana were worked by Indians bound by five-year contracts, recruited by agents who often lied about the destination. What system is this?",
          hi: "दासता समाप्त होने के बाद मॉरीशस, फ़िजी, त्रिनिदाद और गुयाना के बाग़ानों पर वे भारतीय काम करते थे जो पाँच वर्ष के अनुबंधों से बँधे थे, और जिन्हें ऐसे एजेंट भर्ती करते थे जो अक्सर गंतव्य के बारे में झूठ बोलते। यह कौन-सी व्यवस्था है?",
          mr: "गुलामगिरी संपल्यावर मॉरिशस, फिजी, त्रिनिदाद आणि गयानातील मळ्यांवर ते भारतीय काम करत जे पाच वर्षांच्या करारांनी बांधलेले होते, आणि ज्यांना असे दलाल भरती करत जे अनेकदा गंतव्याबद्दल खोटे सांगत. ही कोणती व्यवस्था?",
        },
        statement: {
          en: "Indentured labour migration sent Indian and Chinese workers overseas on contracts of about five years, tying them to a single plantation employer and to a passage home they could rarely afford to claim.",
          hi: "गिरमिटिया प्रवास ने भारतीय और चीनी मज़दूरों को लगभग पाँच वर्ष के अनुबंधों पर समुद्रपार भेजा, जो उन्हें एक ही बाग़ान-मालिक से और उस वापसी-यात्रा से बाँधते थे जिसका दावा वे शायद ही कभी कर पाते थे।",
          mr: "करारबद्ध स्थलांतराने भारतीय आणि चिनी कामगारांना सुमारे पाच वर्षांच्या करारांवर समुद्रापार पाठवले, जे त्यांना एकाच मळेमालकाशी आणि त्या परतीच्या प्रवासाशी बांधत जिचा दावा ते क्वचितच करू शकत.",
        },
        detail: {
          en: "Most came from the crowded, impoverished districts of eastern Uttar Pradesh and Bihar, where rents had risen and cottage industries had collapsed.",
          hi: "अधिकांश पूर्वी उत्तर प्रदेश और बिहार के भीड़ भरे, दरिद्र ज़िलों से आए, जहाँ लगान बढ़ चुका था और कुटीर उद्योग ढह चुके थे।",
          mr: "बहुतांश पूर्व उत्तर प्रदेश आणि बिहारच्या गजबजलेल्या, दरिद्री जिल्ह्यांतून आले, जिथे खंड वाढला होता आणि कुटिरोद्योग कोसळले होते.",
        },
        extra: {
          en: "Nineteenth-century observers called it a new system of slavery, and yet the migrants built lasting cultures abroad — Trinidad's chutney music and Hosay carnival are their descendants' work.",
          hi: "उन्नीसवीं सदी के प्रेक्षकों ने इसे दासता की नई प्रणाली कहा, फिर भी प्रवासियों ने विदेश में टिकाऊ संस्कृतियाँ रचीं — त्रिनिदाद का चटनी संगीत और होसे कार्निवल उन्हीं के वंशजों का काम है।",
          mr: "एकोणिसाव्या शतकातील निरीक्षकांनी तिला गुलामगिरीची नवी पद्धत म्हटले, तरीही स्थलांतरितांनी परदेशात टिकाऊ संस्कृती घडवल्या — त्रिनिदादचे चटणी संगीत आणि होसे कार्निव्हल त्यांच्याच वंशजांचे काम आहे.",
        },
        pair: {
          left: {
            en: "Five-year contracts and a passage most never claimed",
            hi: "पाँच वर्ष के अनुबंध और वह वापसी जो अधिकांश ने कभी नहीं ली",
            mr: "पाच वर्षांचे करार आणि तो परतीचा प्रवास जो बहुतांशांनी कधीच घेतला नाही",
          },
          right: {
            en: "indentured labour migration",
            hi: "गिरमिटिया मज़दूरों का प्रवास",
            mr: "करारबद्ध मजुरांचे स्थलांतर",
          },
        },
      },
      {
        id: "rinderpest",
        name: {
          en: "Rinderpest in Africa",
          hi: "अफ़्रीका में रिंडरपेस्ट",
          mr: "आफ्रिकेत रिंडरपेस्ट",
        },
        kind: "event",
        prompt: {
          en: "A cattle plague carried in with infected animals in the 1880s swept from the Horn of Africa to the Cape in under a decade, killing nine-tenths of the herds and leaving herders with nothing to live on. Which disease is this?",
          hi: "1880 के दशक में संक्रमित पशुओं के साथ आई एक पशु-महामारी दस वर्ष से कम में अफ़्रीका के सींग से केप तक फैल गई, झुंडों का नौ-दसवाँ भाग मारकर और चरवाहों को जीने का कोई साधन न छोड़कर। यह कौन-सा रोग है?",
          mr: "1880 च्या दशकात संसर्गित जनावरांसोबत आलेली एक जनावरांची साथ दहा वर्षांहून कमी काळात आफ्रिकेच्या शिंगापासून केपपर्यंत पसरली, कळपांचा नऊ-दशांश भाग मारून आणि गुराख्यांना जगण्याचे साधन न ठेवता. हा कोणता रोग?",
        },
        statement: {
          en: "Rinderpest was a cattle plague that entered East Africa in the 1880s and killed about ninety per cent of the continent's cattle, destroying the wealth and independence of African pastoralists.",
          hi: "रिंडरपेस्ट एक पशु-महामारी थी जो 1880 के दशक में पूर्वी अफ़्रीका में घुसी और महाद्वीप के लगभग नब्बे प्रतिशत मवेशी मार गई, जिससे अफ़्रीकी पशुपालकों की संपत्ति और स्वतंत्रता नष्ट हुई।",
          mr: "रिंडरपेस्ट ही जनावरांची साथ होती जी 1880 च्या दशकात पूर्व आफ्रिकेत शिरली आणि खंडातील सुमारे नव्वद टक्के गुरे मारून गेली, ज्याने आफ्रिकी पशुपालकांची संपत्ती आणि स्वातंत्र्य नष्ट केले.",
        },
        detail: {
          en: "In these societies cattle were not merely food but savings, bride-price, status and insurance, so losing the herd meant losing every resource at once.",
          hi: "इन समाजों में मवेशी केवल भोजन नहीं बल्कि बचत, वधू-मूल्य, प्रतिष्ठा और बीमा थे, अतः झुंड खोना एक साथ हर साधन खोना था।",
          mr: "या समाजांत गुरे केवळ अन्न नव्हे तर बचत, वधूमूल्य, प्रतिष्ठा आणि विमा होती, म्हणून कळप गमावणे म्हणजे एकाच वेळी प्रत्येक साधन गमावणे.",
        },
        extra: {
          en: "Colonial governments used the moment to seize the emptied grazing lands and to bind the ruined herders to mines and plantations as wage labour.",
          hi: "औपनिवेशिक सरकारों ने इस क्षण का उपयोग ख़ाली हुई चरागाहें हड़पने और उजड़े चरवाहों को खदानों तथा बाग़ानों में मज़दूरी से बाँधने में किया।",
          mr: "वसाहती सरकारांनी हा क्षण रिकाम्या झालेल्या कुरणे बळकावण्यास आणि उद्ध्वस्त गुराख्यांना खाणी व मळ्यांत मजुरीशी बांधण्यास वापरला.",
        },
        pair: {
          left: {
            en: "Nine of every ten cattle dead in a decade",
            hi: "एक दशक में हर दस में नौ मवेशी मरे",
            mr: "एका दशकात प्रत्येक दहांपैकी नऊ गुरे मेली",
          },
          right: {
            en: "rinderpest in Africa",
            hi: "अफ़्रीका में रिंडरपेस्ट",
            mr: "आफ्रिकेत रिंडरपेस्ट",
          },
        },
      },
      {
        id: "great-depression",
        name: {
          en: "The Great Depression",
          hi: "महामंदी",
          mr: "महामंदी",
        },
        kind: "event",
        prompt: {
          en: "From 1929 agricultural prices collapsed, banks failed, factories closed and unemployment reached a quarter of the workforce in some countries, in the deepest and longest downturn the industrial world had known. Which slump is this?",
          hi: "1929 से कृषि क़ीमतें ढह गईं, बैंक डूबे, कारख़ाने बंद हुए और कुछ देशों में बेरोज़गारी श्रमशक्ति के चौथाई तक पहुँची — औद्योगिक विश्व की जानी सबसे गहरी और सबसे लंबी गिरावट। यह कौन-सी मंदी है?",
          mr: "1929 पासून शेतीच्या किमती कोसळल्या, बँका बुडाल्या, कारखाने बंद पडले आणि काही देशांत बेरोजगारी श्रमशक्तीच्या चतुर्थांशापर्यंत पोहोचली — औद्योगिक जगाने पाहिलेली सर्वांत खोल आणि सर्वांत दीर्घ घसरण. ही कोणती मंदी?",
        },
        statement: {
          en: "The Great Depression that began in 1929 brought a worldwide collapse of prices, production and employment, hitting agricultural producers hardest because farm prices fell furthest and fastest.",
          hi: "1929 में शुरू हुई महामंदी ने क़ीमतों, उत्पादन और रोज़गार का विश्वव्यापी पतन लाया, और कृषि उत्पादकों को सबसे भारी चोट दी क्योंकि खेती की क़ीमतें सबसे अधिक और सबसे तेज़ी से गिरीं।",
          mr: "1929 मध्ये सुरू झालेल्या महामंदीने किमती, उत्पादन आणि रोजगाराचे जगव्यापी पतन आणले, आणि शेती उत्पादकांना सर्वांत जबर फटका दिला कारण शेतीच्या किमती सर्वांत जास्त आणि सर्वांत वेगाने घसरल्या.",
        },
        detail: {
          en: "In India, wheat prices fell by half between 1928 and 1934, while the government's land revenue demand was not reduced at all.",
          hi: "भारत में 1928 और 1934 के बीच गेहूँ की क़ीमत आधी रह गई, जबकि सरकार की लगान-माँग बिलकुल कम नहीं की गई।",
          mr: "भारतात 1928 आणि 1934 दरम्यान गव्हाची किंमत निम्म्यावर आली, तर सरकारची जमीन महसुलाची मागणी मुळीच कमी केली गेली नाही.",
        },
        extra: {
          en: "Indian peasants sold jewellery and land to meet those fixed demands, and the country exported gold in these years — the poor financing the empire's balance sheet out of their savings.",
          hi: "भारतीय किसानों ने वे नियत माँगें पूरी करने गहने और ज़मीन बेचीं, और इन्हीं वर्षों में देश ने सोना निर्यात किया — ग़रीब अपनी बचत से साम्राज्य का बही-खाता संभालते रहे।",
          mr: "भारतीय शेतकऱ्यांनी त्या ठरलेल्या मागण्या भागवायला दागिने आणि जमीन विकली, आणि याच वर्षांत देशाने सोने निर्यात केले — गरीब आपल्या बचतीतून साम्राज्याचा ताळेबंद सांभाळत राहिले.",
        },
        pair: {
          left: {
            en: "Prices collapsing worldwide from 1929",
            hi: "1929 से विश्व भर ढहतीं क़ीमतें",
            mr: "1929 पासून जगभर कोसळणाऱ्या किमती",
          },
          right: {
            en: "the Great Depression",
            hi: "महामंदी",
            mr: "महामंदी",
          },
        },
      },
      {
        id: "bretton-woods",
        name: {
          en: "The Bretton Woods institutions",
          hi: "ब्रेटन वुड्स संस्थाएँ",
          mr: "ब्रेटन वुड्स संस्था",
        },
        kind: "structure",
        prompt: {
          en: "Meeting in 1944 while the war still ran, the allied powers set up a fund to handle balance-of-payments crises and a bank to finance reconstruction, fixing currencies to the dollar. Which institutions are these?",
          hi: "1944 में, जब युद्ध अभी चल ही रहा था, मित्र शक्तियों ने भुगतान-संतुलन के संकट सँभालने को एक कोष और पुनर्निर्माण के वित्तपोषण को एक बैंक बनाया, और मुद्राओं को डॉलर से बाँध दिया। ये कौन-सी संस्थाएँ हैं?",
          mr: "1944 मध्ये, युद्ध अजून चालू असतानाच, मित्रराष्ट्रांनी देवघेव-तोलाची संकटे हाताळायला एक निधी आणि पुनर्बांधणीला अर्थपुरवठा करायला एक बँक उभारली, आणि चलने डॉलरशी बांधली. या कोणत्या संस्था?",
        },
        statement: {
          en: "The Bretton Woods institutions are the International Monetary Fund and the World Bank, set up in 1944 to stabilise currencies and finance post-war reconstruction under a system of exchange rates fixed to the dollar.",
          hi: "ब्रेटन वुड्स संस्थाएँ अंतरराष्ट्रीय मुद्रा कोष और विश्व बैंक हैं, जो 1944 में मुद्राओं को स्थिर करने और युद्धोत्तर पुनर्निर्माण के वित्तपोषण के लिए डॉलर से बँधी विनिमय दरों की प्रणाली के अधीन बनाई गईं।",
          mr: "ब्रेटन वुड्स संस्था म्हणजे आंतरराष्ट्रीय नाणेनिधी आणि जागतिक बँक, ज्या 1944 मध्ये चलने स्थिर करण्यास आणि युद्धोत्तर पुनर्बांधणीला अर्थपुरवठा करण्यास डॉलरशी बांधलेल्या विनिमय दरांच्या पद्धतीखाली उभारल्या गेल्या.",
        },
        detail: {
          en: "The design was a deliberate answer to the 1930s: unemployment and currency chaos were now treated as international problems needing international machinery.",
          hi: "यह रचना 1930 के दशक का सोचा-समझा उत्तर थी: बेरोज़गारी और मुद्रा-अराजकता को अब अंतरराष्ट्रीय समस्याएँ माना गया जिनके लिए अंतरराष्ट्रीय तंत्र चाहिए।",
          mr: "ही रचना 1930 च्या दशकाला दिलेले जाणीवपूर्वक उत्तर होती: बेरोजगारी आणि चलन-अराजक आता आंतरराष्ट्रीय समस्या मानल्या गेल्या ज्यांना आंतरराष्ट्रीय यंत्रणा हवी.",
        },
        extra: {
          en: "Voting power was weighted by contribution, so the United States and Western Europe controlled both bodies, and newly independent countries arrived to find the rules already written.",
          hi: "मताधिकार अंशदान के अनुपात में तौला गया, अतः दोनों निकायों पर संयुक्त राज्य और पश्चिमी यूरोप का नियंत्रण रहा, और नव-स्वतंत्र देश आकर पाते थे कि नियम पहले ही लिखे जा चुके हैं।",
          mr: "मताधिकार वर्गणीच्या प्रमाणात तोलला गेला, म्हणून दोन्ही संस्थांवर अमेरिका आणि पश्चिम युरोपचे नियंत्रण राहिले, आणि नव्याने स्वतंत्र झालेले देश येऊन पाहत की नियम आधीच लिहिले गेले आहेत.",
        },
        pair: {
          left: {
            en: "A fund and a bank founded in 1944",
            hi: "1944 में स्थापित एक कोष और एक बैंक",
            mr: "1944 मध्ये स्थापन झालेला एक निधी आणि एक बँक",
          },
          right: {
            en: "the Bretton Woods institutions",
            hi: "ब्रेटन वुड्स संस्थाएँ",
            mr: "ब्रेटन वुड्स संस्था",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "European powers had wanted African land and African labour for decades and had largely failed to get either, because people with cattle could feed themselves and would not work for wages. Then rinderpest arrived in the 1880s. Explain how a cattle disease did what armies had not managed.",
          hi: "यूरोपीय शक्तियाँ दशकों से अफ़्रीकी भूमि और अफ़्रीकी श्रम चाहती थीं और दोनों में से कोई भी बड़े पैमाने पर नहीं पा सकी थीं, क्योंकि जिनके पास मवेशी थे वे स्वयं पेट भर सकते थे और मज़दूरी पर काम नहीं करते थे। फिर 1880 के दशक में रिंडरपेस्ट आया। समझाओ एक पशु-रोग ने वह कैसे किया जो सेनाएँ नहीं कर पाईं।",
          mr: "युरोपीय सत्तांना दशके आफ्रिकी जमीन आणि आफ्रिकी श्रम हवे होते आणि दोन्हींपैकी काहीही त्यांना मोठ्या प्रमाणात मिळाले नव्हते, कारण ज्यांच्याकडे गुरे होती ते स्वतःचे पोट भरू शकत आणि मजुरीवर काम करत नसत. मग 1880 च्या दशकात रिंडरपेस्ट आले. समजावा एका जनावरांच्या रोगाने ते कसे केले जे सैन्यांना जमले नाही.",
        },
        choices: [
          {
            en: "Cattle were the whole basis of pastoral independence — food, savings, bride-price and insurance in one. Killing about ninety per cent of them in a decade destroyed that self-sufficiency, so ruined herders had to accept work in European mines and plantations to survive, while colonial governments claimed the emptied grazing lands. The disease supplied both the land and the cheap labour that conquest alone had not",
            hi: "मवेशी पशुपालक स्वतंत्रता का पूरा आधार थे — भोजन, बचत, वधू-मूल्य और बीमा एक में। एक दशक में उनमें से लगभग नब्बे प्रतिशत को मारकर उस आत्मनिर्भरता को नष्ट कर दिया, अतः उजड़े चरवाहों को जीने के लिए यूरोपीय खदानों और बाग़ानों में काम स्वीकारना पड़ा, जबकि औपनिवेशिक सरकारों ने ख़ाली हुई चरागाहों पर दावा ठोका। रोग ने वह भूमि और वह सस्ता श्रम दोनों दे दिए जो अकेली विजय ने नहीं दिए थे",
            mr: "गुरे हा पशुपालक स्वातंत्र्याचा अख्खा पाया होता — अन्न, बचत, वधूमूल्य आणि विमा एकात. एका दशकात त्यांतील सुमारे नव्वद टक्के मारून ती स्वयंपूर्णता नष्ट केली, म्हणून उद्ध्वस्त गुराख्यांना जगण्यासाठी युरोपीय खाणी आणि मळ्यांत काम स्वीकारावे लागले, तर वसाहती सरकारांनी रिकाम्या झालेल्या कुरणांवर दावा सांगितला. रोगाने ती जमीन आणि ते स्वस्त श्रम दोन्ही दिले जे एकट्या विजयाने दिले नव्हते",
          },
          {
            en: "The disease killed European settlers' cattle only, so Africans gained an advantage they later traded away",
            hi: "रोग ने केवल यूरोपीय बसने वालों के मवेशी मारे, अतः अफ़्रीकियों को लाभ मिला जिसे उन्होंने बाद में सौदे में गँवाया",
            mr: "रोगाने फक्त युरोपीय वसाहतवाद्यांची गुरे मारली, म्हणून आफ्रिकींना फायदा मिळाला जो त्यांनी नंतर सौद्यात गमावला",
          },
          {
            en: "Rinderpest had no economic effect; colonisation succeeded purely because of superior weapons",
            hi: "रिंडरपेस्ट का कोई आर्थिक प्रभाव नहीं था; उपनिवेशीकरण विशुद्ध रूप से बेहतर हथियारों से सफल हुआ",
            mr: "रिंडरपेस्टचा कोणताही आर्थिक परिणाम नव्हता; वसाहतीकरण केवळ श्रेष्ठ शस्त्रांमुळे यशस्वी झाले",
          },
          {
            en: "Colonial governments spent heavily to restock African herds, which is how they won local loyalty",
            hi: "औपनिवेशिक सरकारों ने अफ़्रीकी झुंड फिर से भरने में भारी ख़र्च किया, इसी से उन्होंने स्थानीय निष्ठा जीती",
            mr: "वसाहती सरकारांनी आफ्रिकी कळप पुन्हा भरायला मोठा खर्च केला, अशा रीतीने त्यांनी स्थानिक निष्ठा जिंकली",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The answer turns on understanding what colonisers actually needed and why they had been failing to get it. Europe wanted African land for plantations and mines, and African labour to work them. Land could be claimed on paper, but labour could not be conscripted indefinitely, and this was the sticking point: an African pastoral household with a herd had no reason at all to work for a wage. Cattle in these societies were not simply livestock. They were the family's savings account, its insurance against a bad year, the bride-price that made marriage possible, the measure of a man's standing, and a renewable supply of milk, meat and hides. A household with cattle was economically self-sufficient and socially secure, and could simply refuse the mine's offer. Colonial administrators complained openly about this, and their usual remedies — hut taxes payable only in cash, restrictions on movement, outright forced labour — worked patchily and provoked resistance. Then rinderpest arrived, carried in with infected cattle imported to feed Italian soldiers in Eritrea in the 1880s. It moved with astonishing speed, reaching the Atlantic coast in a few years and the Cape by 1897, and it killed around ninety per cent of Africa's cattle. Consider what that meant to a herding family: not a bad season, but the simultaneous loss of its food, its savings, its insurance, its marriage prospects and its social standing, with nothing left to fall back on. The consequences were exactly what the colonisers had been unable to engineer. Ruined herders had no way to live except to sell the only thing they had left, their labour, and so they walked to the mines and plantations and accepted wages they would never have considered before. At the same time, grazing lands emptied of both cattle and people were declared vacant and taken over by settlers and governments, and control of the surviving cattle became a lever of power in itself — colonial authorities used access to the remaining herds to reward compliance and punish resistance. So the epidemic solved the labour problem and the land problem together, and it did so faster and more completely than any campaign. This is why rinderpest belongs in a history of colonisation and not only in a history of veterinary medicine. It is also a general lesson about how the making of a global world worked: the same connections that carried crops, ships and capital carried disease, and the damage did not fall on those who had built the connections. (The wrong answers reverse who lost the cattle, deny an economic effect the colonial record itself documents, or invent a restocking programme that would have defeated the colonisers' own interest in a wage-dependent workforce.)",
          hi: "उत्तर इस समझ पर टिका कि उपनिवेशकों को वस्तुतः क्या चाहिए था और वे उसे पा क्यों नहीं रहे थे। यूरोप को बाग़ानों और खदानों के लिए अफ़्रीकी भूमि चाहिए थी, और उन्हें चलाने के लिए अफ़्रीकी श्रम। भूमि काग़ज़ पर दावा की जा सकती थी, पर श्रम को अनिश्चित काल तक ज़बरन नहीं लिया जा सकता था, और अटकाव यहीं था: झुंड वाले अफ़्रीकी पशुपालक परिवार के पास मज़दूरी करने का कोई कारण ही नहीं था। इन समाजों में मवेशी केवल पशुधन नहीं थे। वे परिवार का बचत-खाता थे, बुरे वर्ष के विरुद्ध उसका बीमा, वह वधू-मूल्य जो विवाह संभव बनाता, आदमी की प्रतिष्ठा का माप, और दूध, माँस तथा खाल की नवीकरणीय आपूर्ति। मवेशी वाला परिवार आर्थिक रूप से आत्मनिर्भर और सामाजिक रूप से सुरक्षित था, और खदान का प्रस्ताव बस ठुकरा सकता था। औपनिवेशिक प्रशासक इसकी खुलकर शिकायत करते थे, और उनके सामान्य उपाय — केवल नक़द देय झोपड़ी-कर, आवाजाही पर प्रतिबंध, सीधी बेगार — छिटपुट काम करते और प्रतिरोध भड़काते थे। फिर रिंडरपेस्ट आया, 1880 के दशक में इरिट्रिया में इतालवी सैनिकों को खिलाने आयातित संक्रमित मवेशियों के साथ। वह चौंकाने वाली गति से बढ़ा, कुछ वर्षों में अटलांटिक तट और 1897 तक केप पहुँच गया, और अफ़्रीका के लगभग नब्बे प्रतिशत मवेशी मार गया। सोचो एक चरवाहे परिवार के लिए उसका क्या अर्थ था: कोई बुरा मौसम नहीं, बल्कि एक साथ अपने भोजन, बचत, बीमा, विवाह की संभावनाओं और सामाजिक प्रतिष्ठा का नाश, और सहारे को कुछ भी शेष नहीं। परिणाम ठीक वही थे जो उपनिवेशक गढ़ नहीं पा रहे थे। उजड़े चरवाहों के पास जीने का कोई उपाय नहीं बचा सिवाय इसके कि जो एकमात्र चीज़ बची थी उसे बेचें — अपना श्रम — और वे खदानों तथा बाग़ानों तक चले गए और वे मज़दूरियाँ स्वीकार कीं जिन पर वे पहले विचार तक न करते। साथ ही, मवेशी और लोग दोनों से ख़ाली हुई चरागाहें रिक्त घोषित कर बसने वालों और सरकारों ने ले लीं, और बचे मवेशियों पर नियंत्रण स्वयं सत्ता का उत्तोलक बन गया — औपनिवेशिक अधिकारियों ने शेष झुंडों तक पहुँच का उपयोग आज्ञापालन को पुरस्कृत और प्रतिरोध को दंडित करने में किया। अतः महामारी ने श्रम की समस्या और भूमि की समस्या साथ हल कीं, और किसी भी अभियान से तेज़ और अधिक पूर्णता से कीं। इसीलिए रिंडरपेस्ट उपनिवेशीकरण के इतिहास में आता है, केवल पशु-चिकित्सा के इतिहास में नहीं। यह इस बारे में भी सामान्य सबक़ है कि भूमंडलीकृत विश्व का बनना कैसे काम करता था: जिन संपर्कों ने फ़सलें, जहाज़ और पूँजी ढोई उन्हीं ने रोग भी ढोया, और हानि उन पर नहीं पड़ी जिन्होंने वे संपर्क बनाए थे। (ग़लत उत्तर मवेशी किसने खोए यह उलटते, उस आर्थिक प्रभाव को नकारते जिसे स्वयं औपनिवेशिक अभिलेख दर्ज करते, या ऐसा पुनर्भरण कार्यक्रम गढ़ते जो मज़दूरी-निर्भर श्रमशक्ति में उपनिवेशकों के अपने हित को ही मात कर देता।)",
          mr: "उत्तर या समजुतीवर टेकलेले की वसाहतवाद्यांना प्रत्यक्षात काय हवे होते आणि ते त्यांना का मिळत नव्हते. युरोपला मळे आणि खाणींसाठी आफ्रिकी जमीन हवी होती, आणि ती चालवायला आफ्रिकी श्रम. जमिनीवर कागदावर दावा करता येत होता, पण श्रम अनिश्चित काळ सक्तीने घेता येत नव्हते, आणि अडचण इथेच होती: कळप असलेल्या आफ्रिकी पशुपालक कुटुंबाला मजुरी करण्याचे कोणतेही कारणच नव्हते. या समाजांत गुरे केवळ पशुधन नव्हती. ती कुटुंबाचे बचतखाते होती, वाईट वर्षाविरुद्धचा विमा, विवाह शक्य करणारे वधूमूल्य, माणसाच्या प्रतिष्ठेचे माप, आणि दूध, मांस व कातड्याचा नवीकरणीय पुरवठा. गुरे असलेले कुटुंब आर्थिकदृष्ट्या स्वयंपूर्ण आणि सामाजिकदृष्ट्या सुरक्षित होते, आणि खाणीचा प्रस्ताव सहज नाकारू शकत होते. वसाहती प्रशासक याची उघड तक्रार करत, आणि त्यांचे नेहमीचे उपाय — फक्त रोखीत देय झोपडी-कर, हालचालींवर निर्बंध, सरळ वेठबिगारी — तुरळक चालत आणि प्रतिकार भडकवत. मग रिंडरपेस्ट आले, 1880 च्या दशकात एरिट्रियात इटालियन सैनिकांना खाऊ घालायला आयात केलेल्या संसर्गित गुरांसोबत. ते थक्क करणाऱ्या वेगाने पसरले, काही वर्षांत अटलांटिक किनारा आणि 1897 पर्यंत केप गाठले, आणि आफ्रिकेतील सुमारे नव्वद टक्के गुरे मारून गेले. विचार करा गुराखी कुटुंबासाठी त्याचा काय अर्थ होता: कोणता वाईट हंगाम नव्हे, तर एकाच वेळी आपले अन्न, बचत, विमा, विवाहाच्या शक्यता आणि सामाजिक प्रतिष्ठा यांचा नाश, आणि आधाराला काहीच शिल्लक नाही. परिणाम नेमके तेच होते जे वसाहतवादी घडवू शकत नव्हते. उद्ध्वस्त गुराख्यांकडे जगण्याचा कोणताही मार्ग उरला नाही खेरीज जी एकमेव गोष्ट उरली होती ती विकणे — आपले श्रम — आणि ते खाणी व मळ्यांकडे चालत गेले आणि त्या मजुऱ्या स्वीकारल्या ज्यांचा त्यांनी आधी विचारही केला नसता. त्याचवेळी, गुरे आणि माणसे दोन्हींनी रिकामी झालेली कुरणे मोकळी घोषित करून वसाहतवादी आणि सरकारांनी ताब्यात घेतली, आणि उरलेल्या गुरांवरचे नियंत्रण स्वतःच सत्तेचा उत्तोलक बनले — वसाहती अधिकाऱ्यांनी उरलेल्या कळपांपर्यंतच्या प्रवेशाचा वापर आज्ञापालनाला बक्षीस आणि प्रतिकाराला शिक्षा देण्यास केला. म्हणून साथीने श्रमाची समस्या आणि जमिनीची समस्या एकत्र सोडवली, आणि कोणत्याही मोहिमेहून वेगाने आणि अधिक पूर्णपणे सोडवली. म्हणूनच रिंडरपेस्ट वसाहतीकरणाच्या इतिहासात येते, केवळ पशुवैद्यकाच्या इतिहासात नाही. हा जागतिकीकृत जगाची घडण कशी चालली याबद्दलचा सामान्य धडाही आहे: ज्या जोडण्यांनी पिके, जहाजे आणि भांडवल वाहिले त्यांनीच रोगही वाहिला, आणि हानी त्यांच्यावर पडली नाही ज्यांनी त्या जोडण्या बांधल्या होत्या. (चुकीची उत्तरे गुरे कोणी गमावली ते उलटवतात, स्वतः वसाहती नोंदी दस्तऐवजीकृत करत असलेला आर्थिक परिणाम नाकारतात, वा असा पुनर्भरण कार्यक्रम रचतात जो मजुरी-अवलंबी श्रमशक्तीतील वसाहतवाद्यांच्या स्वतःच्या हितालाच हरवेल.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "The crash of 1929 began on stock exchanges and in banks in cities most Indian peasants had never heard of, and no peasant owned a share. Yet historians describe the Indian countryside of the 1930s as among the worst hit places on earth. Trace exactly how a distant financial collapse reached a village in Bengal or Punjab.",
          hi: "1929 का पतन उन शहरों के शेयर बाज़ारों और बैंकों में शुरू हुआ जिनका नाम अधिकांश भारतीय किसानों ने कभी सुना ही नहीं था, और किसी किसान के पास कोई शेयर नहीं था। फिर भी इतिहासकार 1930 के दशक के भारतीय देहात को पृथ्वी के सबसे बुरी तरह प्रभावित स्थानों में गिनते हैं। ठीक-ठीक बताओ एक दूरस्थ वित्तीय पतन बंगाल या पंजाब के गाँव तक कैसे पहुँचा।",
          mr: "1929 चे कोसळणे त्या शहरांतील शेअर बाजार आणि बँकांत सुरू झाले ज्यांचे नाव बहुतांश भारतीय शेतकऱ्यांनी कधी ऐकलेच नव्हते, आणि कोणत्याही शेतकऱ्याकडे शेअर नव्हता. तरीही इतिहासकार 1930 च्या दशकातील भारतीय ग्रामीण भागाला पृथ्वीवरील सर्वांत वाईट फटका बसलेल्या ठिकाणांत गणतात. नेमके सांगा एक दूरचे आर्थिक पतन बंगाल वा पंजाबच्या गावापर्यंत कसे पोहोचले.",
        },
        choices: [
          {
            en: "Through prices and fixed obligations. Indian agriculture exported jute, wheat, cotton and rice into a world market, and when world demand collapsed those prices roughly halved. But the peasant's payments did not fall with them: land revenue was fixed in rupees and the government refused to reduce it, and the moneylender's debt was fixed too. So income halved while obligations stayed whole, and peasants sold jewellery, cattle and land to make up the gap — which is why India exported gold in the worst years of its own distress",
            hi: "क़ीमतों और नियत देनदारियों के रास्ते। भारतीय खेती जूट, गेहूँ, कपास और चावल विश्व बाज़ार में भेजती थी, और जब विश्व माँग ढही तो वे क़ीमतें लगभग आधी रह गईं। पर किसान की अदायगियाँ उनके साथ नहीं गिरीं: लगान रुपयों में नियत था और सरकार ने उसे घटाने से इनकार किया, और साहूकार का क़र्ज़ भी नियत था। अतः आय आधी हुई जबकि देनदारियाँ पूरी रहीं, और किसानों ने अंतर पाटने को गहने, मवेशी और ज़मीन बेचीं — इसीलिए भारत ने अपनी सबसे बुरी तंगी के वर्षों में सोना निर्यात किया",
            mr: "किमती आणि ठरलेल्या देण्यांच्या मार्गाने. भारतीय शेती ताग, गहू, कापूस आणि तांदूळ जागतिक बाजारात पाठवत होती, आणि जागतिक मागणी कोसळल्यावर त्या किमती जवळजवळ निम्म्यावर आल्या. पण शेतकऱ्याची देणी त्यांच्यासोबत घसरली नाहीत: जमीन महसूल रुपयांत ठरलेला होता आणि सरकारने तो कमी करायला नकार दिला, आणि सावकाराचे कर्जही ठरलेले होते. म्हणून उत्पन्न निम्मे झाले तर देणी पूर्ण राहिली, आणि शेतकऱ्यांनी तफावत भरायला दागिने, गुरे आणि जमीन विकली — म्हणूनच भारताने आपल्या सर्वांत वाईट अडचणीच्या वर्षांत सोने निर्यात केले",
          },
          {
            en: "Because Indian peasants had invested their savings heavily in American shares and lost them in the crash",
            hi: "क्योंकि भारतीय किसानों ने अपनी बचत भारी मात्रा में अमेरिकी शेयरों में लगाई थी और पतन में गँवा दी",
            mr: "कारण भारतीय शेतकऱ्यांनी आपली बचत मोठ्या प्रमाणात अमेरिकी शेअर्समध्ये गुंतवली होती आणि कोसळण्यात गमावली",
          },
          {
            en: "The countryside was in fact untouched; only Bombay and Calcutta suffered, since villages were outside the money economy",
            hi: "देहात वस्तुतः अछूता रहा; केवल बंबई और कलकत्ता पर असर पड़ा, क्योंकि गाँव मुद्रा-अर्थव्यवस्था से बाहर थे",
            mr: "ग्रामीण भाग प्रत्यक्षात अस्पर्श राहिला; फक्त मुंबई आणि कलकत्त्यावर परिणाम झाला, कारण गावे चलन-अर्थव्यवस्थेबाहेर होती",
          },
          {
            en: "The colonial government cut land revenue in half immediately, so peasants were fully protected from the price fall",
            hi: "औपनिवेशिक सरकार ने लगान तुरंत आधा कर दिया, अतः किसान क़ीमत-गिरावट से पूरी तरह सुरक्षित रहे",
            mr: "वसाहती सरकारने जमीन महसूल तात्काळ निम्मा केला, म्हणून शेतकरी किमत-घसरणीपासून पूर्णपणे सुरक्षित राहिले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The path from Wall Street to a Punjabi village runs entirely through prices and fixed obligations, and it does not require anyone in the village to own a share or understand a stock exchange. The first link is that Indian agriculture was already deeply integrated into the world market. This was not accidental: colonial policy had pushed cultivators towards crops that could be exported — jute in Bengal, wheat in Punjab, cotton in the Deccan, rice from Burma and the deltas — and revenue systems demanded payment in cash, which forced peasants to sell rather than store their harvest. A peasant growing jute was therefore selling into a world price, whether or not he knew it. The second link is what the Depression did to those prices. As industrial demand collapsed after 1929, prices for primary products fell further and faster than for manufactured goods, because harvests could not be reduced as quickly as factory output. Indian wheat prices fell by roughly half between 1928 and 1934; jute did worse. So the peasant's income for the same acreage, the same labour and the same crop was cut in half within a few years. Now the third and decisive link, which is where the damage becomes catastrophic rather than merely painful. Almost everything the peasant owed was fixed in rupees and did not fall with prices. Land revenue was assessed in money and the colonial government, facing its own budget pressures and unwilling to lose income, refused to scale it down as prices collapsed. Debt to the moneylender was fixed in the same way, and interest kept running. So the arithmetic became impossible: income halved, obligations unchanged. There was only one way to close that gap, and it was not borrowing more, since new credit dried up as lenders themselves grew cautious. Peasants sold what they had accumulated in better years — ornaments, cattle, utensils, and finally land. This produced the striking and much-discussed fact that India was a net exporter of gold precisely in these years of acute rural distress: households were liquidating the savings of generations, and the metal flowed out through the colonial trade system. Economists in Britain welcomed the gold as helpful to the imperial balance of payments, which sharpens the point about who bore the cost of an integrated world. The political consequences followed directly. Rural distress fed the Civil Disobedience Movement, refusal of revenue became a mass demand rather than a leader's slogan, and peasant organisations grew rapidly in the 1930s. The general lesson is the one this chapter keeps making: connection is not the same as shared risk. India had been connected to the world economy on terms it did not set, exposed to its price swings without any of the cushions — flexible taxation, protective tariffs, relief spending — that governments elsewhere could use. (The wrong answers imagine peasant shareholders, deny a rural crisis the revenue records and the gold exports both document, or credit the government with a revenue cut it explicitly refused to make.)",
          hi: "वॉल स्ट्रीट से पंजाब के गाँव तक का रास्ता पूरी तरह क़ीमतों और नियत देनदारियों से होकर जाता है, और उसके लिए गाँव में किसी का शेयर रखना या शेयर बाज़ार समझना ज़रूरी नहीं। पहली कड़ी यह कि भारतीय खेती पहले ही विश्व बाज़ार में गहरे गुँथी थी। यह संयोग नहीं था: औपनिवेशिक नीति ने काश्तकारों को उन फ़सलों की ओर धकेला था जो निर्यात हो सकें — बंगाल में जूट, पंजाब में गेहूँ, दक्कन में कपास, बर्मा और डेल्टाओं से चावल — और राजस्व-प्रणालियाँ नक़द में अदायगी माँगती थीं, जो किसानों को फ़सल जमा करने के बजाय बेचने पर मजबूर करती थीं। अतः जूट उगाता किसान विश्व-क़ीमत पर बेच रहा था, चाहे उसे यह पता हो या न हो। दूसरी कड़ी यह कि महामंदी ने उन क़ीमतों का क्या किया। 1929 के बाद औद्योगिक माँग ढहते ही प्राथमिक उत्पादों की क़ीमतें विनिर्मित माल से कहीं अधिक और तेज़ी से गिरीं, क्योंकि फ़सलें कारख़ाने के उत्पादन जितनी तेज़ी से घटाई नहीं जा सकतीं। भारतीय गेहूँ की क़ीमत 1928 और 1934 के बीच लगभग आधी रह गई; जूट का हाल और बुरा हुआ। अतः उतनी ही ज़मीन, उतने ही श्रम और उसी फ़सल के लिए किसान की आय कुछ वर्षों में आधी कट गई। अब तीसरी और निर्णायक कड़ी, जहाँ हानि केवल कष्टकर न रहकर विनाशकारी बन जाती है। किसान जो कुछ देता था वह लगभग सब रुपयों में नियत था और क़ीमतों के साथ नहीं गिरा। लगान मुद्रा में आँका जाता था और औपनिवेशिक सरकार ने, अपने बजट-दबाव में और आय गँवाने को अनिच्छुक, क़ीमतें ढहने पर उसे घटाने से इनकार कर दिया। साहूकार का क़र्ज़ भी उसी तरह नियत था, और ब्याज चलता रहा। अतः अंकगणित असंभव हो गया: आय आधी, देनदारियाँ अपरिवर्तित। उस खाई को पाटने का केवल एक रास्ता था, और वह और उधार लेना नहीं था, क्योंकि ऋणदाता स्वयं सतर्क होते गए और नया ऋण सूख गया। किसानों ने वह बेचा जो उन्होंने बेहतर वर्षों में जोड़ा था — गहने, मवेशी, बर्तन, और अंततः ज़मीन। इसी से वह चौंकाता और बहुचर्चित तथ्य बना कि भारत ठीक इन्हीं तीव्र ग्रामीण संकट के वर्षों में सोने का शुद्ध निर्यातक था: घर पीढ़ियों की बचत भुना रहे थे, और धातु औपनिवेशिक व्यापार-तंत्र से बाहर बह रही थी। ब्रिटेन के अर्थशास्त्रियों ने उस सोने का स्वागत साम्राज्य के भुगतान-संतुलन के लिए सहायक कहकर किया, जो इस बिंदु को और तीखा करता कि गुँथी हुई दुनिया की क़ीमत किसने चुकाई। राजनीतिक परिणाम सीधे निकले। ग्रामीण संकट ने सविनय अवज्ञा आंदोलन को खाद दी, लगान से इनकार नेता का नारा नहीं बल्कि जन-माँग बन गया, और 1930 के दशक में किसान संगठन तेज़ी से बढ़े। सामान्य सबक़ वही जो यह अध्याय बार-बार देता है: जुड़ाव और साझा जोखिम एक बात नहीं। भारत विश्व अर्थव्यवस्था से उन शर्तों पर जुड़ा था जो उसने तय नहीं की थीं, उसके क़ीमत-झटकों के सामने बिना उन गद्दियों के खुला — लचीला कराधान, संरक्षक शुल्क, राहत-व्यय — जो अन्यत्र की सरकारें इस्तेमाल कर सकती थीं। (ग़लत उत्तर किसान शेयरधारक गढ़ते, उस ग्रामीण संकट को नकारते जिसे राजस्व अभिलेख और सोने का निर्यात दोनों दर्ज करते, या सरकार को उस लगान-कटौती का श्रेय देते जिससे उसने स्पष्ट इनकार किया था।)",
          mr: "वॉल स्ट्रीटपासून पंजाबच्या गावापर्यंतचा मार्ग पूर्णपणे किमती आणि ठरलेल्या देण्यांतून जातो, आणि त्यासाठी गावातील कोणी शेअर बाळगणे वा शेअर बाजार समजणे आवश्यक नाही. पहिला दुवा हा की भारतीय शेती आधीच जागतिक बाजारात खोलवर गुंफलेली होती. हा योगायोग नव्हता: वसाहती धोरणाने शेतकऱ्यांना निर्यात होऊ शकणाऱ्या पिकांकडे ढकलले होते — बंगालमध्ये ताग, पंजाबमध्ये गहू, दख्खनमध्ये कापूस, ब्रह्मदेश आणि त्रिभुजांतून तांदूळ — आणि महसूल-पद्धती रोखीत भरणा मागत, ज्याने शेतकऱ्यांना पीक साठवण्याऐवजी विकायला भाग पाडले. म्हणून ताग पिकवणारा शेतकरी जागतिक किमतीवर विकत होता, त्याला ते कळो वा न कळो. दुसरा दुवा हा की महामंदीने त्या किमतींचे काय केले. 1929 नंतर औद्योगिक मागणी कोसळताच प्राथमिक उत्पादनांच्या किमती उत्पादित मालाहून कितीतरी अधिक आणि वेगाने घसरल्या, कारण पिके कारखान्याच्या उत्पादनाइतक्या वेगाने कमी करता येत नाहीत. भारतीय गव्हाची किंमत 1928 आणि 1934 दरम्यान जवळजवळ निम्म्यावर आली; तागाची अवस्था अधिक वाईट झाली. म्हणून तेवढीच जमीन, तेवढेच श्रम आणि तेच पीक यासाठी शेतकऱ्याचे उत्पन्न काही वर्षांत निम्मे कापले गेले. आता तिसरा आणि निर्णायक दुवा, जिथे हानी केवळ त्रासदायक न राहता विनाशकारी बनते. शेतकरी जे काही देणे लागत होता ते जवळजवळ सर्व रुपयांत ठरलेले होते आणि किमतींसोबत घसरले नाही. जमीन महसूल पैशात आकारला जात होता आणि वसाहती सरकारने, स्वतःच्या अर्थसंकल्पी दबावात आणि उत्पन्न गमवायला नाखूश, किमती कोसळल्यावर तो कमी करायला नकार दिला. सावकाराचे कर्जही तसेच ठरलेले होते, आणि व्याज चालूच राहिले. म्हणून अंकगणित अशक्य झाले: उत्पन्न निम्मे, देणी अपरिवर्तित. ती दरी भरण्याचा एकच मार्ग होता, आणि तो अधिक कर्ज घेणे नव्हता, कारण सावकार स्वतः सावध होत गेल्याने नवे कर्ज आटले. शेतकऱ्यांनी जे चांगल्या वर्षांत जमवले होते ते विकले — दागिने, गुरे, भांडी, आणि अखेर जमीन. यातूनच ते लक्षवेधी आणि बहुचर्चित तथ्य निर्माण झाले की भारत नेमक्या याच तीव्र ग्रामीण अडचणीच्या वर्षांत सोन्याचा निव्वळ निर्यातदार होता: घरे पिढ्यांची बचत मोडत होती, आणि धातू वसाहती व्यापार-यंत्रणेतून बाहेर वाहत होता. ब्रिटनमधील अर्थतज्ज्ञांनी त्या सोन्याचे स्वागत साम्राज्याच्या देवघेव-तोलाला उपयुक्त म्हणून केले, जे गुंफलेल्या जगाची किंमत कोणी मोजली हा मुद्दा अधिक तीक्ष्ण करते. राजकीय परिणाम थेट निघाले. ग्रामीण अडचणीने सविनय कायदेभंग चळवळीला खतपाणी घातले, महसूल नाकारणे नेत्याची घोषणा नव्हे तर जनमागणी बनली, आणि 1930 च्या दशकात शेतकरी संघटना वेगाने वाढल्या. सामान्य धडा तोच जो हे प्रकरण वारंवार देते: जोडणी आणि सामायिक जोखीम एक नव्हे. भारत जागतिक अर्थव्यवस्थेशी त्या अटींवर जोडलेला होता ज्या त्याने ठरवल्या नव्हत्या, तिच्या किमत-हेलकाव्यांसमोर त्या उशांविना उघडा — लवचीक करआकारणी, संरक्षक जकाती, मदत-खर्च — ज्या इतरत्रची सरकारे वापरू शकत होती. (चुकीची उत्तरे शेतकरी भागधारक रचतात, महसूल नोंदी आणि सोन्याची निर्यात दोन्ही दस्तऐवजीकृत करत असलेले ग्रामीण संकट नाकारतात, वा सरकारला त्या महसूल-कपातीचे श्रेय देतात जी करायला तिने स्पष्ट नकार दिला होता.)",
        },
      },
    ],
  },
];
