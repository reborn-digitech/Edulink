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
  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — The Age of Industrialisation                                */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-10-industrialisation",
    subject: "HISTORY",
    classLevel: 10,
    chapter: {
      en: "Chapter 4 — The Age of Industrialisation",
      hi: "अध्याय 4 — औद्योगीकरण का युग",
      mr: "प्रकरण 4 — औद्योगीकरणाचे युग",
    },
    name: {
      en: "The Age of Industrialisation",
      hi: "औद्योगीकरण का युग",
      mr: "औद्योगीकरणाचे युग",
    },
    summary: {
      en: "The story machines are usually told to have won on their own: village households weaving for a distant merchant, mills that gathered work under one roof, employers who kept preferring hands to engines, a middleman with the power to hire, weavers ruined by a tariff rather than a machine — and labels printed to make cloth look Indian.",
      hi: "वह कहानी जिसे आमतौर पर मशीनों की अकेली जीत बताया जाता: दूरस्थ व्यापारी के लिए बुनते गाँव के घर, काम को एक छत के नीचे बटोरती मिलें, इंजनों से अधिक हाथों को चुनते रहे मालिक, भर्ती की शक्ति वाला एक बिचौलिया, मशीन से नहीं शुल्क से उजड़े बुनकर — और कपड़े को भारतीय दिखाने छपे लेबल।",
      mr: "जी कथा सहसा यंत्रांची एकट्याची जीत म्हणून सांगितली जाते: दूरच्या व्यापाऱ्यासाठी विणणारी गावातील घरे, काम एका छताखाली गोळा करणाऱ्या गिरण्या, इंजिनांपेक्षा हातांना पसंत करत राहिलेले मालक, भरतीची सत्ता असलेला एक दलाल, यंत्राने नव्हे तर जकातीने उद्ध्वस्त झालेले विणकर — आणि कापड भारतीय दिसावे म्हणून छापलेली लेबले.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "proto-industrialisation",
        name: {
          en: "Proto-industrialisation",
          hi: "आद्य-औद्योगीकरण",
          mr: "आद्य-औद्योगीकरण",
        },
        kind: "process",
        prompt: {
          en: "Long before any factory, merchants in European towns handed out raw wool to peasant households in the villages, collected the finished cloth and sold it in distant markets. What is this earlier phase of large-scale production called?",
          hi: "किसी भी कारख़ाने से बहुत पहले, यूरोपीय क़स्बों के व्यापारी गाँवों के किसान-परिवारों को कच्ची ऊन बाँटते, तैयार कपड़ा इकट्ठा करते और दूर के बाज़ारों में बेचते थे। बड़े पैमाने के उत्पादन का यह पहला चरण क्या कहलाता है?",
          mr: "कोणत्याही कारखान्याच्या खूप आधी, युरोपीय गावांतील व्यापारी खेड्यांतील शेतकरी कुटुंबांना कच्ची लोकर वाटत, तयार कापड गोळा करत आणि दूरच्या बाजारांत विकत. मोठ्या प्रमाणावरील उत्पादनाचा हा आधीचा टप्पा काय म्हणतात?",
        },
        statement: {
          en: "Proto-industrialisation was large-scale production for international markets carried on in village homes rather than factories, with town merchants supplying raw material and collecting the finished goods.",
          hi: "आद्य-औद्योगीकरण अंतरराष्ट्रीय बाज़ारों के लिए बड़े पैमाने का वह उत्पादन था जो कारख़ानों में नहीं, गाँव के घरों में होता था, जहाँ क़स्बे के व्यापारी कच्चा माल देते और तैयार वस्तुएँ ले जाते थे।",
          mr: "आद्य-औद्योगीकरण म्हणजे आंतरराष्ट्रीय बाजारांसाठीचे ते मोठ्या प्रमाणावरील उत्पादन जे कारखान्यांत नव्हे तर खेड्यांतील घरांत होत असे, जिथे गावातील व्यापारी कच्चा माल देत आणि तयार वस्तू घेऊन जात.",
        },
        detail: {
          en: "Merchants went to the countryside because urban guilds controlled who could produce what in the towns, and villages lay outside their rules.",
          hi: "व्यापारी देहात इसलिए गए कि क़स्बों में शहरी श्रेणियाँ तय करती थीं कि कौन क्या बना सकता है, और गाँव उनके नियमों से बाहर थे।",
          mr: "व्यापारी ग्रामीण भागात यासाठी गेले की गावांत शहरी श्रेणी ठरवत की कोण काय बनवू शकतो, आणि खेडी त्यांच्या नियमांबाहेर होती.",
        },
        extra: {
          en: "For the peasant household it was not a full living but an addition to shrinking plots, so the whole family — including children — worked at the loom between harvests.",
          hi: "किसान परिवार के लिए यह पूरी आजीविका नहीं बल्कि सिकुड़ते खेतों के साथ एक जोड़ था, अतः फ़सलों के बीच पूरा परिवार — बच्चे भी — करघे पर काम करता था।",
          mr: "शेतकरी कुटुंबासाठी ती पूर्ण उपजीविका नव्हे तर आकुंचत्या शेतांना जोड होती, म्हणून हंगामांदरम्यान अख्खे कुटुंब — मुलेही — मागावर काम करत असे.",
        },
        pair: {
          left: {
            en: "Production for world markets, done in village homes",
            hi: "विश्व बाज़ारों के लिए उत्पादन, गाँव के घरों में",
            mr: "जागतिक बाजारांसाठी उत्पादन, खेड्यांतील घरांत",
          },
          right: {
            en: "proto-industrialisation",
            hi: "आद्य-औद्योगीकरण",
            mr: "आद्य-औद्योगीकरण",
          },
        },
      },
      {
        id: "factory-system",
        name: {
          en: "The coming of the factory",
          hi: "कारख़ाने का आगमन",
          mr: "कारखान्याचे आगमन",
        },
        kind: "process",
        prompt: {
          en: "From the 1730s work was pulled out of scattered cottages and gathered into single buildings where machines stood in rows, workers kept fixed hours and a supervisor watched them. What change is this?",
          hi: "1730 के दशक से काम बिखरी कुटियों से खींचकर उन एकल इमारतों में बटोरा गया जहाँ मशीनें पंक्तियों में खड़ी थीं, मज़दूर नियत घंटे रखते थे और एक पर्यवेक्षक उन्हें देखता था। यह कौन-सा परिवर्तन है?",
          mr: "1730 च्या दशकापासून काम विखुरलेल्या झोपड्यांतून ओढून त्या एकाच इमारतींत गोळा केले गेले जिथे यंत्रे रांगेत उभी होती, कामगार ठरलेले तास पाळत आणि एक पर्यवेक्षक त्यांच्यावर लक्ष ठेवत असे. हा कोणता बदल?",
        },
        statement: {
          en: "The coming of the factory brought workers, machines and materials together under one roof with fixed hours and close supervision, giving the employer control over the pace and quality of work for the first time.",
          hi: "कारख़ाने के आगमन ने मज़दूरों, मशीनों और सामग्री को नियत घंटों तथा नज़दीकी निगरानी के साथ एक छत के नीचे ला दिया, और मालिक को पहली बार काम की गति तथा गुणवत्ता पर नियंत्रण दिया।",
          mr: "कारखान्याच्या आगमनाने कामगार, यंत्रे आणि साहित्य ठरलेले तास व जवळून देखरेखीसह एका छताखाली आणले, आणि मालकाला पहिल्यांदाच कामाच्या गती व गुणवत्तेवर नियंत्रण दिले.",
        },
        detail: {
          en: "Cotton was the first industry transformed, and the earliest mills clustered in Manchester, which is why it became the byword for machine-made cloth.",
          hi: "कपास पहला उद्योग था जो बदला, और आरंभिक मिलें मैनचेस्टर में जमा हुईं, इसीलिए वह मशीन-निर्मित कपड़े का पर्याय बन गया।",
          mr: "कापूस हा पहिला बदललेला उद्योग, आणि सुरुवातीच्या गिरण्या मँचेस्टरमध्ये गोळा झाल्या, म्हणूनच ते यंत्रनिर्मित कापडाचा समानार्थी बनले.",
        },
        extra: {
          en: "The famous names of the age — cotton mills, iron and steel, railways — were in fact a small part of the economy; most British workers still laboured in traditional crafts and services.",
          hi: "युग के प्रसिद्ध नाम — सूती मिलें, लोहा-इस्पात, रेलवे — वस्तुतः अर्थव्यवस्था का छोटा हिस्सा थे; अधिकांश ब्रिटिश मज़दूर अब भी परंपरागत दस्तकारी और सेवाओं में खटते थे।",
          mr: "युगाची प्रसिद्ध नावे — सुती गिरण्या, लोखंड-पोलाद, रेल्वे — प्रत्यक्षात अर्थव्यवस्थेचा लहान भाग होती; बहुतांश ब्रिटिश कामगार अजूनही पारंपरिक कारागिरी आणि सेवांत राबत होते.",
        },
        pair: {
          left: {
            en: "Work gathered under one roof, hours fixed and watched",
            hi: "काम एक छत के नीचे, घंटे नियत और निगरानी में",
            mr: "काम एका छताखाली, तास ठरलेले आणि नजरेखाली",
          },
          right: {
            en: "the coming of the factory",
            hi: "कारख़ाने का आगमन",
            mr: "कारखान्याचे आगमन",
          },
        },
      },
      {
        id: "preference-for-hand-labour",
        name: {
          en: "The preference for hand labour",
          hi: "हस्त-श्रम की वरीयता",
          mr: "हातश्रमाची पसंती",
        },
        kind: "idea",
        prompt: {
          en: "Through the nineteenth century many British employers kept choosing workers over machines, because labour was cheap and plentiful and much of their demand was seasonal or needed variety a machine could not give. What choice is this?",
          hi: "उन्नीसवीं सदी भर कई ब्रिटिश मालिक मशीनों के बजाय मज़दूर चुनते रहे, क्योंकि श्रम सस्ता और प्रचुर था और उनकी बहुत-सी माँग मौसमी थी या ऐसी विविधता माँगती थी जो मशीन नहीं दे सकती थी। यह कौन-सा चुनाव है?",
          mr: "एकोणिसाव्या शतकभर अनेक ब्रिटिश मालक यंत्रांऐवजी कामगार निवडत राहिले, कारण श्रम स्वस्त आणि विपुल होते आणि त्यांची बरीच मागणी हंगामी होती वा अशी विविधता मागत होती जी यंत्र देऊ शकत नव्हते. ही कोणती निवड?",
        },
        statement: {
          en: "The preference for hand labour was the deliberate choice of many industrialists to employ workers rather than install machines, because machines were costly, broke down, needed heavy repair and could not be idled cheaply when demand fell.",
          hi: "हस्त-श्रम की वरीयता कई उद्योगपतियों का यह सोचा-समझा चुनाव था कि मशीनें लगाने के बजाय मज़दूर रखे जाएँ, क्योंकि मशीनें महँगी थीं, बिगड़ती थीं, भारी मरम्मत माँगती थीं और माँग गिरने पर उन्हें सस्ते में ख़ाली नहीं छोड़ा जा सकता था।",
          mr: "हातश्रमाची पसंती म्हणजे अनेक उद्योगपतींची ती जाणीवपूर्वक निवड की यंत्रे बसवण्याऐवजी कामगार ठेवावेत, कारण यंत्रे महाग होती, बिघडत, जबर दुरुस्ती मागत आणि मागणी घसरल्यावर त्यांना स्वस्तात रिकामे ठेवता येत नव्हते.",
        },
        detail: {
          en: "Seasonal trades made the point plainly: gas works, breweries, book-binding and ship repair all needed extra hands only for part of the year.",
          hi: "मौसमी धंधों ने बात साफ़ कर दी: गैस-संयंत्र, शराबख़ाने, जिल्दसाज़ी और जहाज़-मरम्मत सबको अतिरिक्त हाथ वर्ष के केवल एक हिस्से में चाहिए होते थे।",
          mr: "हंगामी धंद्यांनी मुद्दा स्पष्ट केला: गॅस-संयंत्रे, दारूभट्ट्या, बांधणीकाम आणि जहाजदुरुस्ती या सर्वांना जादा हात वर्षाच्या केवळ एका भागात लागत.",
        },
        extra: {
          en: "In the upper end of the market, hand-finishing was itself the selling point — aristocrats wanted individually made goods, and 'handmade' signalled refinement rather than backwardness.",
          hi: "बाज़ार के ऊपरी सिरे पर हस्त-परिष्करण स्वयं बिक्री का कारण था — कुलीन व्यक्तिगत रूप से बनी वस्तुएँ चाहते थे, और 'हस्तनिर्मित' पिछड़ेपन का नहीं, परिष्कार का संकेत था।",
          mr: "बाजाराच्या वरच्या टोकाला हस्त-परिष्करण हेच विक्रीचे कारण होते — उमराव वैयक्तिकरीत्या बनवलेल्या वस्तू मागत, आणि 'हस्तनिर्मित' मागासलेपणाचे नव्हे तर सुबकतेचे लक्षण होते.",
        },
        pair: {
          left: {
            en: "Workers chosen over machines, on purpose",
            hi: "मशीनों के बजाय मज़दूर, जानबूझकर",
            mr: "यंत्रांऐवजी कामगार, मुद्दाम",
          },
          right: {
            en: "the preference for hand labour",
            hi: "हस्त-श्रम की वरीयता",
            mr: "हातश्रमाची पसंती",
          },
        },
      },
      {
        id: "the-jobber",
        name: {
          en: "The jobber",
          hi: "जॉबर",
          mr: "जॉबर",
        },
        kind: "structure",
        prompt: {
          en: "In Indian mills a trusted old employee was sent to the villages to bring in new hands; he found them work, advanced them money, helped them settle in the city — and expected gifts and obedience in return. Who was he?",
          hi: "भारतीय मिलों में एक भरोसेमंद पुराना कर्मचारी नए हाथ लाने गाँवों में भेजा जाता था; वह उन्हें काम दिलाता, पैसा उधार देता, शहर में बसने में मदद करता — और बदले में भेंट तथा आज्ञापालन की अपेक्षा रखता था। वह कौन था?",
          mr: "भारतीय गिरण्यांत एक विश्वासू जुना कर्मचारी नवे हात आणायला खेड्यांत पाठवला जाई; तो त्यांना काम मिळवून देई, पैसे उसने देई, शहरात स्थिरावायला मदत करी — आणि बदल्यात भेटी व आज्ञापालनाची अपेक्षा ठेवी. तो कोण होता?",
        },
        statement: {
          en: "The jobber was an old and trusted worker employed by mill owners to recruit new hands from his own village, and his power to grant or withhold a job made him a figure of authority in the workers' lives.",
          hi: "जॉबर वह पुराना और भरोसेमंद मज़दूर था जिसे मिल-मालिक अपने ही गाँव से नए हाथ भर्ती करने रखते थे, और नौकरी देने या रोकने की उसकी शक्ति उसे मज़दूरों के जीवन में सत्ता का पात्र बना देती थी।",
          mr: "जॉबर म्हणजे तो जुना आणि विश्वासू कामगार ज्याला गिरणीमालक स्वतःच्याच गावातून नवे हात भरती करायला ठेवत, आणि नोकरी देण्याची वा रोखण्याची त्याची सत्ता त्याला कामगारांच्या जीवनात अधिकाराची व्यक्ती बनवत असे.",
        },
        detail: {
          en: "Work was scarce and seekers many, so hundreds would wait at the mill gates for weeks; getting past them depended less on skill than on knowing the jobber.",
          hi: "काम कम और चाहने वाले बहुत थे, अतः सैकड़ों मिल के फाटकों पर हफ़्तों प्रतीक्षा करते; उनसे आगे निकलना कौशल से कम और जॉबर की जान-पहचान से अधिक तय होता था।",
          mr: "काम कमी आणि इच्छुक पुष्कळ, म्हणून शेकडो गिरणीच्या फाटकांवर आठवडे वाट पाहत; त्यांच्या पुढे जाणे कौशल्याहून कमी आणि जॉबरच्या ओळखीवर अधिक अवलंबून असे.",
        },
        extra: {
          en: "Because he recruited from home, mill floors reproduced village ties of caste and kinship inside the city, and a worker's world stayed narrower than the city around him.",
          hi: "क्योंकि वह अपने घर के इलाक़े से भर्ती करता था, मिल के फ़र्श शहर के भीतर जाति और नातेदारी के गाँव-संबंध दोहराते थे, और मज़दूर की दुनिया उसके चारों ओर के शहर से सँकरी बनी रहती थी।",
          mr: "तो स्वतःच्या गावाकडून भरती करत असल्याने, गिरणीचे मजले शहराच्या आत जात आणि नातेसंबंधांचे गावातील धागे पुन्हा उभे करत, आणि कामगाराचे जग भोवतीच्या शहराहून अरुंद राहत असे.",
        },
        pair: {
          left: {
            en: "The recruiter whose favour decided who got hired",
            hi: "वह भर्तीकर्ता जिसकी कृपा तय करती कौन रखा जाए",
            mr: "तो भरती करणारा ज्याच्या मर्जीवर कोणाला काम मिळेल हे ठरे",
          },
          right: {
            en: "the jobber",
            hi: "जॉबर",
            mr: "जॉबर",
          },
        },
      },
      {
        id: "decline-of-weavers",
        name: {
          en: "The ruin of Indian weavers",
          hi: "भारतीय बुनकरों का उजड़ना",
          mr: "भारतीय विणकरांचा ऱ्हास",
        },
        kind: "process",
        prompt: {
          en: "Indian cotton cloth had dominated world markets for centuries, but through the nineteenth century its exports collapsed, Manchester goods flooded the home market and weavers' own raw cotton grew dearer. What decline is this?",
          hi: "भारतीय सूती कपड़े ने सदियों तक विश्व बाज़ारों पर राज किया था, पर उन्नीसवीं सदी भर उसका निर्यात ढह गया, मैनचेस्टर का माल घरेलू बाज़ार में भर गया और बुनकरों का अपना कच्चा कपास महँगा होता गया। यह कौन-सा पतन है?",
          mr: "भारतीय सुती कापडाने शतके जागतिक बाजारांवर राज्य केले होते, पण एकोणिसाव्या शतकभर त्याची निर्यात कोसळली, मँचेस्टरचा माल देशी बाजारात भरला आणि विणकरांचा स्वतःचा कच्चा कापूस महाग होत गेला. हा कोणता ऱ्हास?",
        },
        statement: {
          en: "The ruin of Indian weavers came from British tariffs shutting Indian cloth out of foreign markets while machine-made Manchester cloth entered India duty-free, and from raw cotton being exported until Indian weavers could no longer afford it.",
          hi: "भारतीय बुनकरों का उजड़ना ब्रिटिश शुल्कों से आया जिन्होंने भारतीय कपड़े को विदेशी बाज़ारों से बाहर किया जबकि मशीन-निर्मित मैनचेस्टर कपड़ा भारत में बिना शुल्क घुसा, और कच्चे कपास के निर्यात से जो तब तक चला जब तक भारतीय बुनकर उसे ख़रीद ही न सकें।",
          mr: "भारतीय विणकरांचा ऱ्हास ब्रिटिश जकातींतून आला ज्यांनी भारतीय कापड परदेशी बाजारांतून बाहेर काढले तर यंत्रनिर्मित मँचेस्टर कापड भारतात जकातमुक्त शिरले, आणि कच्च्या कापसाच्या निर्यातीतून जी तोवर चालली जोवर भारतीय विणकर तो विकत घेऊच शकेनासे झाले.",
        },
        detail: {
          en: "The American Civil War made it worse: with American supplies cut off, Britain bought Indian raw cotton at any price, and weavers at home were priced out of their own material.",
          hi: "अमेरिकी गृहयुद्ध ने हाल और बिगाड़ा: अमेरिकी आपूर्ति कटते ही ब्रिटेन ने भारतीय कच्चा कपास किसी भी क़ीमत पर ख़रीदा, और घर के बुनकर अपनी ही सामग्री से क़ीमत के कारण बाहर हो गए।",
          mr: "अमेरिकन यादवी युद्धाने स्थिती अधिक बिघडवली: अमेरिकी पुरवठा तुटताच ब्रिटनने भारतीय कच्चा कापूस कोणत्याही किमतीला विकत घेतला, आणि देशातले विणकर स्वतःच्याच साहित्यापासून किमतीमुळे बाहेर पडले.",
        },
        extra: {
          en: "The weavers were not defeated in open competition — the machine and the tariff arrived together, and only one side had a government writing the rules.",
          hi: "बुनकर खुली प्रतिस्पर्धा में नहीं हारे — मशीन और शुल्क साथ आए, और नियम लिखती सरकार केवल एक पक्ष के पास थी।",
          mr: "विणकर खुल्या स्पर्धेत हरले नाहीत — यंत्र आणि जकात एकत्र आले, आणि नियम लिहिणारे सरकार फक्त एकाच बाजूकडे होते.",
        },
        pair: {
          left: {
            en: "Shut out abroad, undercut at home, starved of cotton",
            hi: "विदेश में बंद, घर में सस्ते माल से पिटे, कपास से वंचित",
            mr: "परदेशात बंद, देशात स्वस्त मालाने मारलेले, कापसाविना",
          },
          right: {
            en: "the ruin of Indian weavers",
            hi: "भारतीय बुनकरों का उजड़ना",
            mr: "भारतीय विणकरांचा ऱ्हास",
          },
        },
      },
      {
        id: "labels-and-advertising",
        name: {
          en: "Labels and the making of a market",
          hi: "लेबल और बाज़ार का निर्माण",
          mr: "लेबले आणि बाजाराची घडण",
        },
        kind: "idea",
        prompt: {
          en: "Manchester manufacturers pasted labels showing Krishna and Saraswati on bundles of cloth sold in India, and Indian mills later printed calendars with gods to hang in shops and homes. What practice is this?",
          hi: "मैनचेस्टर के निर्माता भारत में बिकते कपड़े की गठरियों पर कृष्ण और सरस्वती दिखाते लेबल चिपकाते थे, और बाद में भारतीय मिलें दुकानों तथा घरों में टाँगने को देवताओं वाले कैलेंडर छापती थीं। यह कौन-सी प्रथा है?",
          mr: "मँचेस्टरचे उत्पादक भारतात विकल्या जाणाऱ्या कापडाच्या गठ्ठ्यांवर कृष्ण आणि सरस्वती दाखवणारी लेबले चिकटवत, आणि नंतर भारतीय गिरण्या दुकानांत व घरांत टांगायला देवतांची दिनदर्शिका छापत. ही कोणती प्रथा?",
        },
        statement: {
          en: "Labels and advertising were used to create a market for machine-made cloth, carrying familiar images of gods, kings and Indian scenes so that a foreign product would look trustworthy and at home.",
          hi: "लेबल और विज्ञापन मशीन-निर्मित कपड़े के लिए बाज़ार बनाने में इस्तेमाल हुए, जो देवताओं, राजाओं और भारतीय दृश्यों की जानी-पहचानी छवियाँ ढोते थे ताकि विदेशी उत्पाद भरोसेमंद और अपना लगे।",
          mr: "लेबले आणि जाहिराती यंत्रनिर्मित कापडासाठी बाजार घडवायला वापरली गेली, जी देवता, राजे आणि भारतीय दृश्यांच्या ओळखीच्या प्रतिमा वाहत जेणेकरून परका माल विश्वासार्ह आणि आपला वाटावा.",
        },
        detail: {
          en: "The word 'Manchester' printed on the label was itself a guarantee of quality to buyers, so the place of origin was advertised as proudly as the picture.",
          hi: "लेबल पर छपा 'मैनचेस्टर' शब्द स्वयं ख़रीदारों के लिए गुणवत्ता की गारंटी था, अतः उद्गम-स्थान का विज्ञापन चित्र जितने ही गर्व से होता था।",
          mr: "लेबलावर छापलेला 'मँचेस्टर' शब्द स्वतः खरेदीदारांसाठी गुणवत्तेची हमी होता, म्हणून उगमस्थानाची जाहिरात चित्राइतक्याच अभिमानाने होत असे.",
        },
        extra: {
          en: "Indian manufacturers answered with the swadeshi message printed on their own labels, turning the same technique into an argument that buying was a national act.",
          hi: "भारतीय निर्माताओं ने अपने लेबलों पर छपे स्वदेशी संदेश से उत्तर दिया, उसी तकनीक को इस तर्क में बदलकर कि ख़रीदना एक राष्ट्रीय कर्म है।",
          mr: "भारतीय उत्पादकांनी आपल्या लेबलांवर छापलेल्या स्वदेशी संदेशाने उत्तर दिले, त्याच तंत्राचे रूपांतर या युक्तिवादात करून की खरेदी ही राष्ट्रीय कृती आहे.",
        },
        pair: {
          left: {
            en: "Gods and kings printed to sell cloth",
            hi: "कपड़ा बेचने छपे देवता और राजा",
            mr: "कापड विकायला छापलेले देव आणि राजे",
          },
          right: {
            en: "labels and the making of a market",
            hi: "लेबल और बाज़ार का निर्माण",
            mr: "लेबले आणि बाजाराची घडण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Machines had been available for decades, yet in the middle of the nineteenth century most British industries still ran on hand labour, and employers who could afford machinery often declined to install it. This was not backwardness or ignorance. Give the business reasons behind the choice.",
          hi: "मशीनें दशकों से उपलब्ध थीं, फिर भी उन्नीसवीं सदी के मध्य में अधिकांश ब्रिटिश उद्योग हस्त-श्रम पर चलते थे, और जो मालिक मशीनें ख़रीद सकते थे वे अक्सर उन्हें लगाने से इनकार कर देते थे। यह पिछड़ापन या अज्ञान नहीं था। इस चुनाव के पीछे के व्यावसायिक कारण बताओ।",
          mr: "यंत्रे दशके उपलब्ध होती, तरीही एकोणिसाव्या शतकाच्या मध्यावर बहुतांश ब्रिटिश उद्योग हातश्रमावर चालत, आणि जे मालक यंत्रे परवडू शकत ते अनेकदा ती बसवायला नकार देत. हे मागासलेपण वा अज्ञान नव्हते. या निवडीमागील व्यावसायिक कारणे सांगा.",
        },
        choices: [
          {
            en: "Labour was cheap and abundant, so wages cost less than machines; machines were expensive to buy, broke down and needed costly repair; and much demand was seasonal or required variety and fine finish, which a fixed machine could not supply. Crucially, workers could be hired when orders came and dismissed when they stopped, whereas a machine bought on credit had to be paid for whether it ran or stood idle",
            hi: "श्रम सस्ता और प्रचुर था, अतः मज़दूरी मशीनों से कम पड़ती थी; मशीनें ख़रीदने में महँगी थीं, बिगड़ती थीं और महँगी मरम्मत माँगती थीं; और बहुत-सी माँग मौसमी थी या ऐसी विविधता तथा बारीक परिष्करण माँगती थी जो नियत मशीन नहीं दे सकती थी। मुख्य बात यह कि ऑर्डर आने पर मज़दूर रखे और रुकने पर हटाए जा सकते थे, जबकि उधार पर ख़रीदी मशीन का दाम चाहे वह चले या ख़ाली खड़ी रहे, चुकाना ही पड़ता था",
            mr: "श्रम स्वस्त आणि विपुल होते, म्हणून मजुरी यंत्रांहून कमी पडे; यंत्रे विकत घ्यायला महाग होती, बिघडत आणि महागडी दुरुस्ती मागत; आणि बरीच मागणी हंगामी होती वा अशी विविधता व बारीक परिष्करण मागत होती जी ठरलेले यंत्र देऊ शकत नव्हते. मुख्य म्हणजे ऑर्डर आल्यावर कामगार ठेवता आणि थांबल्यावर काढता येत, तर उधारीवर घेतलेल्या यंत्राचे पैसे ते चालो वा रिकामे उभे राहो, द्यावेच लागत",
          },
          {
            en: "British law forbade the use of machinery in most industries until the 1880s",
            hi: "ब्रिटिश क़ानून ने 1880 के दशक तक अधिकांश उद्योगों में मशीनों के उपयोग पर रोक लगा रखी थी",
            mr: "ब्रिटिश कायद्याने 1880 च्या दशकापर्यंत बहुतांश उद्योगांत यंत्रांच्या वापरावर बंदी घातली होती",
          },
          {
            en: "Machines produced goods of such poor quality that no buyer would accept them at any price",
            hi: "मशीनें इतनी घटिया गुणवत्ता का माल बनाती थीं कि कोई ख़रीदार उसे किसी भी दाम पर नहीं लेता था",
            mr: "यंत्रे इतक्या हलक्या दर्जाचा माल बनवत की कोणताही खरेदीदार तो कोणत्याही किमतीला घेत नसे",
          },
          {
            en: "Employers were simply unaware that machines existed, since news of inventions did not travel",
            hi: "मालिकों को बस पता ही नहीं था कि मशीनें मौजूद हैं, क्योंकि आविष्कारों की ख़बर पहुँचती नहीं थी",
            mr: "मालकांना यंत्रे अस्तित्वात आहेत हे फक्त माहीतच नव्हते, कारण शोधांची बातमी पोहोचत नसे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The picture of industrialisation as machines simply out-competing hands is a later simplification; the employers of the time were making a straightforward calculation, and hand labour often won it. Start with cost. Britain in this period had a large and growing supply of workers — displaced rural labourers, migrants, the poor of the towns — so wages stayed low and there was no shortage of hands. A machine, by contrast, had to be bought outright or on credit, and steam engines and complex looms were extremely expensive. If a worker can be had cheaply, the machine has to save a great deal to justify itself. Second, machines were not the reliable things we now imagine. They broke down, their repair required scarce skilled mechanics and was costly, and their actual output frequently fell short of what the makers promised. An employer weighing a claimed improvement against a known workforce had good reason to be cautious. Third, and most important, is the question of flexibility, which is where the argument really turns. A great many trades did not need the same output all year. Gas works ran hard in winter, breweries and building peaked in particular months, ship repair came in bursts, book-binding and printing followed the season. In such trades the employer needs a workforce that can expand and contract. Hand workers can be taken on when orders arrive and let go when they stop — brutal for the worker, but costless to the employer. A machine bought on credit has to be paid for in every month, whether it is running or standing still, so idle capacity is a permanent charge on the business. Fourth, the market itself often wanted what machines could not make. Machines are efficient at producing many identical items, but much of Victorian demand was for variety and hand-finish: 500 kinds of hammer, 45 kinds of axe, intricate ironwork, individually tailored goods for the wealthy. In these markets 'handmade' was not a confession of backwardness but a mark of refinement, and the aristocracy paid for it. So the industrialist's choice was rational, and it shows something historically important: technology does not spread automatically because it exists, but only where it beats the alternatives on cost, reliability and flexibility for that particular trade. This also reframes the workers' story. The famous machine-breaking of the period was not a war against progress by ignorant men; workers understood exactly that a machine could take their livelihood, and in an economy where hands were plentiful and jobs scarce, that fear was accurate. (The wrong answers invent a legal ban that never existed, deny the real quality advantage machines had in bulk production, and imagine an information vacuum in the most industrially informed society of the age.)",
          hi: "औद्योगीकरण की वह छवि कि मशीनों ने बस हाथों को पछाड़ दिया, बाद का सरलीकरण है; उस समय के मालिक एक सीधा हिसाब लगा रहे थे, और हस्त-श्रम अक्सर वह हिसाब जीत जाता था। लागत से शुरू। इस दौर के ब्रिटेन में मज़दूरों की बड़ी और बढ़ती आपूर्ति थी — उजड़े ग्रामीण मज़दूर, प्रवासी, क़स्बों के ग़रीब — अतः मज़दूरी कम बनी रही और हाथों की कोई कमी नहीं थी। इसके विपरीत मशीन नक़द या उधार पर ख़रीदनी पड़ती थी, और भाप-इंजन तथा जटिल करघे अत्यंत महँगे थे। यदि मज़दूर सस्ते में मिल जाए तो मशीन को स्वयं को सही ठहराने के लिए बहुत कुछ बचाना पड़ता है। दूसरा, मशीनें वे भरोसेमंद चीज़ें नहीं थीं जो हम अब कल्पना करते हैं। वे बिगड़ती थीं, उनकी मरम्मत को दुर्लभ कुशल मिस्त्री चाहिए होते और वह महँगी पड़ती, और उनका वास्तविक उत्पादन अक्सर निर्माताओं के वादे से कम रहता। ज्ञात श्रमशक्ति के मुक़ाबले दावा किए सुधार को तौलते मालिक के पास सतर्क रहने का अच्छा कारण था। तीसरा, और सबसे महत्वपूर्ण, लचीलेपन का प्रश्न, जहाँ तर्क वास्तव में मुड़ता है। बहुत-से धंधों को पूरे वर्ष एक-सा उत्पादन नहीं चाहिए था। गैस-संयंत्र जाड़े में ज़ोर से चलते, शराबख़ाने और निर्माण कुछ ख़ास महीनों में चरम पर होते, जहाज़-मरम्मत झटकों में आती, जिल्दसाज़ी और छपाई मौसम के पीछे चलती। ऐसे धंधों में मालिक को ऐसी श्रमशक्ति चाहिए जो फैल और सिकुड़ सके। हाथ से काम करने वाले ऑर्डर आने पर रखे और रुकने पर छोड़े जा सकते हैं — मज़दूर के लिए निर्मम, पर मालिक के लिए मुफ़्त। उधार पर ख़रीदी मशीन का दाम हर महीने चुकाना पड़ता है, चाहे वह चले या खड़ी रहे, अतः ख़ाली क्षमता धंधे पर स्थायी बोझ है। चौथा, बाज़ार स्वयं अक्सर वह चाहता था जो मशीनें नहीं बना सकती थीं। मशीनें बहुत-से एक-जैसे टुकड़े बनाने में कुशल हैं, पर विक्टोरियाई माँग का बड़ा हिस्सा विविधता और हस्त-परिष्करण के लिए था: हथौड़ों के 500 प्रकार, कुल्हाड़ियों के 45, बारीक लोहे का काम, धनवानों के लिए व्यक्तिगत रूप से सिला माल। इन बाज़ारों में 'हस्तनिर्मित' पिछड़ेपन की स्वीकारोक्ति नहीं बल्कि परिष्कार का चिह्न था, और कुलीन उसका दाम देते थे। अतः उद्योगपति का चुनाव तर्कसंगत था, और वह ऐतिहासिक रूप से महत्वपूर्ण बात दिखाता है: तकनीक इसलिए अपने आप नहीं फैलती कि वह मौजूद है, बल्कि केवल वहाँ फैलती है जहाँ वह उस विशेष धंधे के लिए लागत, भरोसे और लचीलेपन में विकल्पों को हरा दे। यह मज़दूरों की कहानी को भी नए ढंग से रखता है। उस दौर की प्रसिद्ध मशीन-तोड़ अज्ञानी लोगों का प्रगति के विरुद्ध युद्ध नहीं थी; मज़दूर ठीक-ठीक समझते थे कि मशीन उनकी आजीविका ले सकती है, और जहाँ हाथ प्रचुर और नौकरियाँ कम हों वहाँ वह भय सही था। (ग़लत उत्तर कभी न रही क़ानूनी रोक गढ़ते, थोक उत्पादन में मशीनों के असली गुणवत्ता-लाभ को नकारते, और युग के सबसे औद्योगिक रूप से सूचित समाज में सूचना-शून्यता की कल्पना करते हैं।)",
          mr: "औद्योगीकरणाचे ते चित्र की यंत्रांनी फक्त हातांना मागे टाकले, हे नंतरचे सुलभीकरण आहे; त्या काळचे मालक एक सरळ हिशोब मांडत होते, आणि हातश्रम अनेकदा तो हिशोब जिंकत असे. खर्चापासून सुरू. या काळातील ब्रिटनमध्ये कामगारांचा मोठा आणि वाढता पुरवठा होता — उखडलेले ग्रामीण मजूर, स्थलांतरित, गावांतील गरीब — म्हणून मजुरी कमी राहिली आणि हातांची कमतरता नव्हती. याउलट यंत्र रोख वा उधारीवर विकत घ्यावे लागे, आणि वाफेची इंजिने व गुंतागुंतीचे माग अत्यंत महाग होते. कामगार स्वस्तात मिळत असेल तर यंत्राला स्वतःला सिद्ध करायला पुष्कळ वाचवावे लागते. दुसरे, यंत्रे आज आपण कल्पितो तशी विश्वासार्ह नव्हती. ती बिघडत, तिच्या दुरुस्तीला दुर्मीळ कुशल मिस्त्री लागत आणि ती महाग पडे, आणि तिचे प्रत्यक्ष उत्पादन अनेकदा उत्पादकांच्या वचनाहून कमी भरे. ज्ञात श्रमशक्तीसमोर दावा केलेली सुधारणा तोलणाऱ्या मालकाकडे सावध राहायला चांगले कारण होते. तिसरे, आणि सर्वांत महत्त्वाचे, लवचीकतेचा प्रश्न, जिथे युक्तिवाद खरोखर वळतो. अनेक धंद्यांना वर्षभर सारखेच उत्पादन लागत नसे. गॅस-संयंत्रे हिवाळ्यात जोरात चालत, दारूभट्ट्या आणि बांधकाम ठराविक महिन्यांत शिखरावर, जहाजदुरुस्ती झटक्यांत येई, बांधणी आणि छपाई हंगामामागे चाले. अशा धंद्यांत मालकाला अशी श्रमशक्ती हवी जी वाढू आणि आकुंचू शकेल. हातांनी काम करणारे ऑर्डर आल्यावर ठेवता आणि थांबल्यावर सोडता येतात — कामगारासाठी निर्दय, पण मालकासाठी फुकट. उधारीवर घेतलेल्या यंत्राचे पैसे प्रत्येक महिन्यात द्यावेच लागतात, ते चालो वा उभे राहो, म्हणून रिकामी क्षमता धंद्यावरचा कायमचा भार. चौथे, बाजार स्वतःच अनेकदा ते मागत होता जे यंत्रे बनवू शकत नव्हती. यंत्रे अनेक एकसारखे तुकडे बनवण्यात कुशल आहेत, पण व्हिक्टोरियन मागणीचा मोठा भाग विविधता आणि हस्त-परिष्करणासाठी होता: हातोड्यांचे 500 प्रकार, कुऱ्हाडींचे 45, नक्षीदार लोहकाम, धनिकांसाठी वैयक्तिकरीत्या शिवलेला माल. या बाजारांत 'हस्तनिर्मित' ही मागासलेपणाची कबुली नव्हे तर सुबकतेची खूण होती, आणि उमराव तिची किंमत देत. म्हणून उद्योगपतीची निवड तर्कशुद्ध होती, आणि ती ऐतिहासिकदृष्ट्या महत्त्वाची गोष्ट दाखवते: तंत्रज्ञान अस्तित्वात आहे म्हणून आपोआप पसरत नाही, तर केवळ तिथे पसरते जिथे ते त्या विशिष्ट धंद्यासाठी खर्च, विश्वासार्हता आणि लवचीकतेत पर्यायांना हरवते. हे कामगारांची कथाही नव्याने मांडते. त्या काळची प्रसिद्ध यंत्रफोड अज्ञानी माणसांचे प्रगतीविरुद्धचे युद्ध नव्हते; कामगारांना नेमके कळत होते की यंत्र त्यांची उपजीविका घेऊ शकते, आणि जिथे हात विपुल आणि नोकऱ्या कमी अशा अर्थव्यवस्थेत ती भीती अचूक होती. (चुकीची उत्तरे कधीच नसलेली कायदेशीर बंदी रचतात, मोठ्या प्रमाणावरील उत्पादनात यंत्रांचा खरा गुणवत्ता-फायदा नाकारतात, आणि त्या युगातील सर्वांत औद्योगिकदृष्ट्या माहितगार समाजात माहितीची पोकळी कल्पितात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "It is often said that Indian handloom weavers were destroyed because British machines simply made cloth better and cheaper — a fair contest that the older technology lost. Examine that claim against what actually happened to weavers in the nineteenth century, and say what the account leaves out.",
          hi: "अक्सर कहा जाता कि भारतीय हथकरघा बुनकर इसलिए नष्ट हुए कि ब्रिटिश मशीनें बस बेहतर और सस्ता कपड़ा बनाती थीं — एक निष्पक्ष मुक़ाबला जिसे पुरानी तकनीक हार गई। उन्नीसवीं सदी में बुनकरों के साथ वास्तव में जो हुआ उसके विरुद्ध इस दावे को जाँचो, और बताओ यह विवरण क्या छोड़ देता है।",
          mr: "अनेकदा म्हटले जाते की भारतीय हातमाग विणकर यासाठी नष्ट झाले की ब्रिटिश यंत्रे फक्त अधिक चांगले आणि स्वस्त कापड बनवत — एक निष्पक्ष स्पर्धा जी जुने तंत्रज्ञान हरले. एकोणिसाव्या शतकात विणकरांचे प्रत्यक्षात काय झाले त्याविरुद्ध हा दावा तपासा, आणि सांगा हे वर्णन काय वगळते.",
        },
        choices: [
          {
            en: "It leaves out that the contest was never open. Britain kept high duties on Indian cloth entering its own market while Indian ports were opened to Manchester goods at low or no duty, so the same government wrote the rules for both sides. Raw cotton was simultaneously exported to feed British mills — sharply during the American Civil War — pushing the price of cotton in India beyond what weavers could pay for their own material. Machine costs mattered, but tariff policy and the diversion of raw material did the decisive damage",
            hi: "यह छोड़ देता है कि मुक़ाबला कभी खुला था ही नहीं। ब्रिटेन ने अपने बाज़ार में घुसते भारतीय कपड़े पर ऊँचे शुल्क रखे जबकि भारतीय बंदरगाह मैनचेस्टर के माल के लिए कम या शून्य शुल्क पर खोल दिए गए, अतः दोनों पक्षों के नियम एक ही सरकार ने लिखे। साथ ही कच्चा कपास ब्रिटिश मिलों को खिलाने निर्यात होता रहा — अमेरिकी गृहयुद्ध में तीखेपन से — जिससे भारत में कपास का दाम उससे ऊपर चला गया जो बुनकर अपनी ही सामग्री के लिए चुका सकते थे। मशीन की लागत मायने रखती थी, पर निर्णायक चोट शुल्क-नीति और कच्चे माल के मोड़ने ने की",
            mr: "ते वगळते की स्पर्धा कधी खुली नव्हतीच. ब्रिटनने स्वतःच्या बाजारात शिरणाऱ्या भारतीय कापडावर उंच जकाती ठेवल्या तर भारतीय बंदरे मँचेस्टरच्या मालासाठी कमी वा शून्य जकातीवर उघडली, म्हणून दोन्ही बाजूंचे नियम एकाच सरकारने लिहिले. त्याचवेळी कच्चा कापूस ब्रिटिश गिरण्यांना पुरवायला निर्यात होत राहिला — अमेरिकन यादवी युद्धात तीव्रतेने — ज्याने भारतात कापसाची किंमत विणकर स्वतःच्या साहित्यासाठी देऊ शकतील त्यापलीकडे नेली. यंत्राचा खर्च महत्त्वाचा होता, पण निर्णायक नुकसान जकात-धोरण आणि कच्च्या मालाच्या वळवण्याने केले",
          },
          {
            en: "Nothing is left out; Indian weavers had no skill worth preserving and were bound to fail in any market",
            hi: "कुछ नहीं छूटता; भारतीय बुनकरों में सहेजने योग्य कोई कौशल नहीं था और वे किसी भी बाज़ार में विफल होने ही थे",
            mr: "काहीही वगळले जात नाही; भारतीय विणकरांकडे जपण्याजोगे कौशल्य नव्हते आणि ते कोणत्याही बाजारात अपयशी ठरणारच होते",
          },
          {
            en: "The claim is wrong because British machine cloth was never actually sold in India at all",
            hi: "दावा ग़लत है क्योंकि ब्रिटिश मशीनी कपड़ा भारत में वस्तुतः बिका ही नहीं",
            mr: "दावा चुकीचा आहे कारण ब्रिटिश यंत्रकापड भारतात प्रत्यक्षात विकलेच गेले नाही",
          },
          {
            en: "Weavers actually prospered throughout the nineteenth century, and their decline is a modern invention",
            hi: "बुनकर वस्तुतः पूरी उन्नीसवीं सदी समृद्ध हुए, और उनका पतन आधुनिक गढ़ंत है",
            mr: "विणकर प्रत्यक्षात संपूर्ण एकोणिसाव्या शतकात भरभराटले, आणि त्यांचा ऱ्हास ही आधुनिक रचना आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The claim is not simply false — machine spinning genuinely was cheaper for ordinary yarn, and that mattered — but presenting the outcome as a fair contest between two technologies leaves out the largest part of the story, which is that one competitor also controlled the rules. Begin with the market abroad. Indian cotton textiles had been the world's finest and most widely traded for centuries; Bengal muslin and Coromandel chintz were luxury goods in Europe. As British manufacturers grew, they lobbied hard for protection and got it: duties on Indian cloth entering Britain were raised steeply, in some periods to levels that made sale impossible. The Indian export trade did not lose a price war; it was legislated out of the market it had dominated. Now the market at home, where the asymmetry is starker. India could not answer with tariffs of its own, because it did not control its own trade policy — that policy was set in London. Indian ports were kept open to Manchester cloth at low or nominal duty, and when Indian mills later sought protection they were refused or granted it grudgingly and late. So the machine-made goods arrived with a structural advantage no Indian producer could match, and 'competition' meant competing against a rival whose government also wrote your rules. Third, and often missed, is the raw material. Britain needed enormous quantities of raw cotton, and India was made a supplier. When the American Civil War cut off American supplies in the 1860s, British buyers bid Indian cotton up to extraordinary prices and shipped it out. For the Indian weaver this was a double blow: he had already lost his markets, and now the very cotton he needed cost more than he could pay, because it was being bought over his head for export. A weaver can survive cheap competition for a while by cutting his own earnings; he cannot weave without cotton. Fourth, note what was not destroyed, because it tests the argument. Weaving did not disappear. Coarse cloth for the poor and specialised weaves — borders, saris, checked cloth for particular regional tastes — survived, precisely where machine production had no advantage. Some weavers moved into these niches and endured. That pattern is exactly what one expects when the damage comes from policy and raw-material prices as much as from technology: the loss is heaviest where the state's rules bit, not uniformly across all cloth. The honest conclusion is that this was deindustrialisation under colonial conditions, not a natural technological succession. The machines were real and their advantage in bulk yarn was real, but the ruin of a world-leading industry within a lifetime required tariffs written by the buyer's government, a colony without the power to protect its own producers, and the export of its raw material. Which is why this episode is central to the economic case Indian nationalists later made: they were not arguing that machines were evil, but that a country must control its own trade policy if its producers are to survive contact with the world. (The wrong answers dismiss weavers' skill against the evidence of centuries of world demand, deny imports that customs records document, or deny a decline that both British and Indian sources describe.)",
          hi: "दावा सरासर झूठा नहीं है — साधारण सूत के लिए मशीनी कताई सचमुच सस्ती थी, और यह मायने रखता था — पर परिणाम को दो तकनीकों के बीच निष्पक्ष मुक़ाबला बताना कहानी का सबसे बड़ा हिस्सा छोड़ देता है, कि एक प्रतियोगी नियम भी नियंत्रित करता था। विदेश के बाज़ार से शुरू। भारतीय सूती वस्त्र सदियों से विश्व के सबसे बारीक और सबसे व्यापक रूप से व्यापारित थे; बंगाल की मलमल और कोरोमंडल की छींट यूरोप में विलासिता की वस्तुएँ थीं। जैसे-जैसे ब्रिटिश निर्माता बढ़े, उन्होंने संरक्षण के लिए ज़ोर लगाया और पाया: ब्रिटेन में घुसते भारतीय कपड़े पर शुल्क तीखेपन से बढ़ाए गए, कुछ दौर में उस स्तर तक जहाँ बिक्री असंभव हो गई। भारतीय निर्यात-व्यापार क़ीमत की लड़ाई नहीं हारा; उसे उसी बाज़ार से क़ानून बनाकर बाहर किया गया जिस पर वह छाया हुआ था। अब घर का बाज़ार, जहाँ विषमता और तीखी है। भारत अपने शुल्कों से उत्तर नहीं दे सकता था, क्योंकि उसकी अपनी व्यापार-नीति उसके हाथ में थी ही नहीं — वह नीति लंदन में तय होती थी। भारतीय बंदरगाह मैनचेस्टर के कपड़े के लिए कम या नाममात्र शुल्क पर खुले रखे गए, और जब बाद में भारतीय मिलों ने संरक्षण माँगा तो उन्हें मना किया गया या अनिच्छा से और देर से दिया गया। अतः मशीन-निर्मित माल ऐसे ढाँचागत लाभ के साथ आया जिसकी बराबरी कोई भारतीय उत्पादक नहीं कर सकता था, और 'प्रतिस्पर्धा' का अर्थ था ऐसे प्रतिद्वंद्वी से लड़ना जिसकी सरकार तुम्हारे नियम भी लिखती हो। तीसरा, और अक्सर छूटता, कच्चा माल है। ब्रिटेन को कच्चे कपास की विशाल मात्रा चाहिए थी, और भारत को आपूर्तिकर्ता बना दिया गया। जब 1860 के दशक में अमेरिकी गृहयुद्ध ने अमेरिकी आपूर्ति काटी, ब्रिटिश ख़रीदारों ने भारतीय कपास असाधारण दामों तक चढ़ाकर बाहर भेज दिया। भारतीय बुनकर के लिए यह दोहरी मार थी: वह पहले ही अपने बाज़ार खो चुका था, और अब जो कपास उसे चाहिए था वही उसकी सामर्थ्य से महँगा हो गया, क्योंकि वह उसके सिर के ऊपर से निर्यात को ख़रीदा जा रहा था। बुनकर सस्ती प्रतिस्पर्धा कुछ समय अपनी कमाई काटकर झेल सकता है; कपास के बिना वह बुन ही नहीं सकता। चौथा, ध्यान दो कि क्या नष्ट नहीं हुआ, क्योंकि यह तर्क की परख है। बुनाई ग़ायब नहीं हुई। ग़रीबों के लिए मोटा कपड़ा और विशिष्ट बुनाइयाँ — किनारे, साड़ियाँ, विशेष क्षेत्रीय रुचि का चारख़ाना — बचे रहे, ठीक वहाँ जहाँ मशीनी उत्पादन को कोई लाभ नहीं था। कुछ बुनकर इन कोनों में गए और टिके रहे। यह प्रतिरूप ठीक वही है जिसकी अपेक्षा तब होती है जब हानि तकनीक जितनी ही नीति और कच्चे माल की क़ीमतों से आए: नुक़सान वहाँ सबसे भारी जहाँ राज्य के नियम काटते थे, सब कपड़ों पर एक-सा नहीं। ईमानदार निष्कर्ष यह कि यह औपनिवेशिक परिस्थितियों में विऔद्योगीकरण था, स्वाभाविक तकनीकी उत्तराधिकार नहीं। मशीनें असली थीं और थोक सूत में उनका लाभ असली था, पर एक जीवनकाल में विश्व-अग्रणी उद्योग का उजड़ना ख़रीदार की सरकार द्वारा लिखे शुल्क, अपने उत्पादकों की रक्षा की शक्ति से वंचित उपनिवेश, और उसके कच्चे माल के निर्यात की माँग करता था। इसीलिए यह प्रसंग उस आर्थिक तर्क के केंद्र में है जो भारतीय राष्ट्रवादियों ने बाद में रखा: वे यह नहीं कह रहे थे कि मशीनें बुरी हैं, बल्कि यह कि यदि किसी देश के उत्पादकों को दुनिया के संपर्क में जीवित रहना है तो उस देश को अपनी व्यापार-नीति स्वयं नियंत्रित करनी होगी। (ग़लत उत्तर सदियों की विश्व-माँग के प्रमाण के विरुद्ध बुनकरों का कौशल झटकते, सीमा-शुल्क अभिलेखों में दर्ज आयात नकारते, या उस पतन को नकारते जिसे ब्रिटिश और भारतीय दोनों स्रोत बताते हैं।)",
          mr: "दावा सरळसरळ खोटा नाही — सामान्य सुतासाठी यंत्रकताई खरोखर स्वस्त होती, आणि ते महत्त्वाचे होते — पण निकालाला दोन तंत्रज्ञानांमधील निष्पक्ष स्पर्धा म्हणून मांडणे कथेचा सर्वांत मोठा भाग वगळते, तो हा की एक स्पर्धक नियमही नियंत्रित करत होता. परदेशातील बाजारापासून सुरू. भारतीय सुती वस्त्रे शतके जगातील सर्वांत बारीक आणि सर्वाधिक व्यापार होणारी होती; बंगालची मलमल आणि कोरोमंडलची छीट युरोपात चैनीच्या वस्तू होत्या. ब्रिटिश उत्पादक वाढत गेल्यावर त्यांनी संरक्षणासाठी जोर लावला आणि ते मिळवले: ब्रिटनमध्ये शिरणाऱ्या भारतीय कापडावरील जकाती तीव्रपणे वाढवल्या गेल्या, काही काळात अशा पातळीपर्यंत जिथे विक्री अशक्य झाली. भारतीय निर्यात-व्यापार किमतीची लढाई हरला नाही; त्याला ज्या बाजारावर तो पसरला होता त्यातूनच कायदा करून बाहेर काढले गेले. आता देशातील बाजार, जिथे विषमता अधिक तीव्र आहे. भारत स्वतःच्या जकातींनी उत्तर देऊ शकत नव्हता, कारण त्याचे स्वतःचे व्यापार-धोरण त्याच्या हातातच नव्हते — ते धोरण लंडनमध्ये ठरे. भारतीय बंदरे मँचेस्टरच्या कापडासाठी कमी वा नाममात्र जकातीवर उघडी ठेवली गेली, आणि नंतर भारतीय गिरण्यांनी संरक्षण मागितले तेव्हा त्यांना नकार मिळाला वा नाखुशीने आणि उशिरा दिले गेले. म्हणून यंत्रनिर्मित माल अशा संरचनात्मक फायद्यासह आला ज्याची बरोबरी कोणताही भारतीय उत्पादक करू शकत नव्हता, आणि 'स्पर्धा' म्हणजे अशा प्रतिस्पर्ध्याशी लढणे ज्याचे सरकार तुमचेही नियम लिहिते. तिसरे, आणि अनेकदा सुटणारे, कच्चा माल आहे. ब्रिटनला कच्च्या कापसाच्या प्रचंड राशी लागत, आणि भारताला पुरवठादार बनवले गेले. 1860 च्या दशकात अमेरिकन यादवी युद्धाने अमेरिकी पुरवठा तोडला तेव्हा ब्रिटिश खरेदीदारांनी भारतीय कापूस असाधारण किमतींपर्यंत चढवून बाहेर पाठवला. भारतीय विणकरासाठी हा दुहेरी फटका होता: तो आधीच आपले बाजार गमावून बसला होता, आणि आता ज्या कापसाची त्याला गरज होती तोच त्याच्या ऐपतीहून महाग झाला, कारण तो त्याच्या डोक्यावरून निर्यातीसाठी विकत घेतला जात होता. विणकर स्वस्त स्पर्धा काही काळ स्वतःची कमाई कापून सोसू शकतो; कापसाविना तो विणूच शकत नाही. चौथे, काय नष्ट झाले नाही ते पाहा, कारण ती युक्तिवादाची कसोटी आहे. विणकाम नाहीसे झाले नाही. गरिबांसाठीचे जाडेभरडे कापड आणि विशेष विणी — किनारी, साड्या, विशिष्ट प्रादेशिक आवडीचे चौकडीचे कापड — टिकून राहिली, नेमके तिथे जिथे यंत्रउत्पादनाला कोणताही फायदा नव्हता. काही विणकर या कोनाड्यांत गेले आणि टिकले. हे प्रारूप नेमके तेच जे नुकसान तंत्रज्ञानाइतकेच धोरण आणि कच्च्या मालाच्या किमतींतून येते तेव्हा अपेक्षित असते: हानी तिथे सर्वांत जड जिथे राज्याचे नियम चावले, सर्व कापडांवर सारखी नाही. प्रामाणिक निष्कर्ष हा की हे वसाहती परिस्थितीतील विऔद्योगीकरण होते, नैसर्गिक तांत्रिक वारसा नव्हे. यंत्रे खरी होती आणि मोठ्या प्रमाणावरील सुतात त्यांचा फायदा खरा होता, पण एका आयुष्यात जगात आघाडीवरचा उद्योग उद्ध्वस्त होण्यासाठी खरेदीदाराच्या सरकारने लिहिलेल्या जकाती, स्वतःच्या उत्पादकांचे रक्षण करण्याची सत्ता नसलेली वसाहत, आणि तिच्या कच्च्या मालाची निर्यात लागली. म्हणूनच हा प्रसंग भारतीय राष्ट्रवाद्यांनी नंतर मांडलेल्या आर्थिक युक्तिवादाच्या केंद्रस्थानी आहे: ते यंत्रे वाईट आहेत असे म्हणत नव्हते, तर हे की एखाद्या देशाच्या उत्पादकांना जगाच्या संपर्कात जिवंत राहायचे असेल तर त्या देशाने स्वतःचे व्यापार-धोरण स्वतः नियंत्रित केले पाहिजे. (चुकीची उत्तरे शतकांच्या जागतिक मागणीच्या पुराव्याविरुद्ध विणकरांचे कौशल्य झटकतात, जकात नोंदींत दस्तऐवजीकृत आयात नाकारतात, वा ब्रिटिश आणि भारतीय दोन्ही स्रोत वर्णन करत असलेला ऱ्हास नाकारतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Print Culture and the Modern World                          */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-10-print-culture",
    subject: "HISTORY",
    classLevel: 10,
    chapter: {
      en: "Chapter 5 — Print Culture and the Modern World",
      hi: "अध्याय 5 — मुद्रण संस्कृति और आधुनिक विश्व",
      mr: "प्रकरण 5 — मुद्रण संस्कृती आणि आधुनिक जग",
    },
    name: {
      en: "Print Culture and the Modern World",
      hi: "मुद्रण संस्कृति और आधुनिक विश्व",
      mr: "मुद्रण संस्कृती आणि आधुनिक जग",
    },
    summary: {
      en: "What happened when copying stopped being slow: a press that made a book cheap, a monk whose pamphlet outran the Church's reply, cheap chapbooks that put reading within a labourer's week's wage, a colonial law aimed at Indian-language newspapers only — and women who were taught to read and then wrote things nobody had authorised.",
      hi: "जब नक़ल करना धीमा नहीं रहा तब क्या हुआ: वह प्रेस जिसने किताब सस्ती की, वह भिक्षु जिसकी पुस्तिका चर्च के उत्तर से आगे निकल गई, वे सस्ती चैपबुक जिन्होंने पढ़ना मज़दूर की हफ़्ते भर की मज़दूरी के भीतर ला दिया, वह औपनिवेशिक क़ानून जो केवल भारतीय भाषाओं के अख़बारों पर तना — और वे स्त्रियाँ जिन्हें पढ़ना सिखाया गया और फिर उन्होंने वह लिखा जिसकी किसी ने अनुमति नहीं दी थी।",
      mr: "नक्कल करणे मंद उरले नाही तेव्हा काय घडले: पुस्तक स्वस्त करणारे ते छापखाने, ज्याची पुस्तिका चर्चच्या उत्तराच्या पुढे गेली तो भिक्षू, वाचन मजुराच्या आठवडाभराच्या मजुरीत आणणारी स्वस्त चोपडी, फक्त भारतीय भाषांच्या वृत्तपत्रांवर रोखलेला तो वसाहती कायदा — आणि ज्यांना वाचायला शिकवले गेले आणि मग ज्यांनी कोणी परवानगी न दिलेले लिहिले त्या स्त्रिया.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "printing-press",
        name: {
          en: "Gutenberg's printing press",
          hi: "गुटेनबर्ग का छापाख़ाना",
          mr: "गुटेनबर्गचा छापखाना",
        },
        kind: "invention",
        prompt: {
          en: "Around 1450 a German goldsmith adapted the olive press and cast metal letters that could be arranged and rearranged, so that identical copies of a page could be struck off one after another. Which invention is this?",
          hi: "1450 के आसपास एक जर्मन स्वर्णकार ने जैतून के कोल्हू को ढालकर धातु के ऐसे अक्षर ढाले जिन्हें सजाया और फिर से सजाया जा सके, ताकि एक पन्ने की एक-सी प्रतियाँ एक के बाद एक निकाली जा सकें। यह कौन-सा आविष्कार है?",
          mr: "1450 च्या सुमारास एका जर्मन सोनाराने जैतुनाच्या घाण्याचे रूपांतर करून असे धातूचे अक्षर ओतले जे मांडता आणि पुन्हा मांडता येत, जेणेकरून एका पानाच्या सारख्या प्रती एकामागोमाग काढता येतील. हा कोणता शोध?",
        },
        statement: {
          en: "Gutenberg's printing press of about 1450 used movable metal type in an adapted olive press, making it possible to produce many identical copies of a text quickly and cheaply.",
          hi: "लगभग 1450 के गुटेनबर्ग के छापेख़ाने ने जैतून के ढाले हुए कोल्हू में चल धातु-टाइप का उपयोग किया, जिससे किसी पाठ की अनेक एक-सी प्रतियाँ जल्दी और सस्ते में बनाना संभव हुआ।",
          mr: "सुमारे 1450 च्या गुटेनबर्गच्या छापखान्याने रूपांतरित जैतून-घाण्यात हलणारे धातू-टाइप वापरले, ज्यामुळे एखाद्या मजकुराच्या अनेक सारख्या प्रती वेगाने आणि स्वस्तात बनवणे शक्य झाले.",
        },
        detail: {
          en: "Before it, every copy was written out by hand, so a book took months, cost a fortune and existed in a handful of copies that only the rich and the clergy saw.",
          hi: "उससे पहले हर प्रति हाथ से लिखी जाती थी, अतः एक किताब महीनों लेती, भारी दाम माँगती और मुट्ठी भर प्रतियों में रहती जिन्हें केवल धनी और पादरी देखते थे।",
          mr: "त्याआधी प्रत्येक प्रत हाताने लिहिली जाई, म्हणून एक पुस्तक महिने घेई, प्रचंड किंमत मागे आणि मूठभर प्रतींत असे ज्या फक्त धनिक आणि धर्मगुरू पाहत.",
        },
        extra: {
          en: "Printing had existed in China and Japan for centuries with woodblocks; Gutenberg's contribution was type that could be taken apart and used again for a different page.",
          hi: "मुद्रण चीन और जापान में सदियों से काठ के ठप्पों के साथ मौजूद था; गुटेनबर्ग का योगदान वह टाइप था जिसे अलग करके किसी दूसरे पन्ने के लिए फिर इस्तेमाल किया जा सके।",
          mr: "छपाई चीन आणि जपानमध्ये शतके लाकडी ठशांसह अस्तित्वात होती; गुटेनबर्गचे योगदान म्हणजे तो टाइप जो सोडवून दुसऱ्या पानासाठी पुन्हा वापरता येई.",
        },
        pair: {
          left: {
            en: "Movable metal type in an olive press",
            hi: "जैतून के कोल्हू में चल धातु-टाइप",
            mr: "जैतून-घाण्यात हलणारे धातू-टाइप",
          },
          right: {
            en: "Gutenberg's printing press",
            hi: "गुटेनबर्ग का छापाख़ाना",
            mr: "गुटेनबर्गचा छापखाना",
          },
        },
      },
      {
        id: "print-and-reformation",
        name: {
          en: "Print and the Reformation",
          hi: "मुद्रण और धर्मसुधार",
          mr: "मुद्रण आणि धर्मसुधारणा",
        },
        kind: "event",
        prompt: {
          en: "In 1517 a monk's ninety-five theses criticising the Church were printed and read across Germany within weeks, faster than any authority could answer them. Which upheaval did print make possible?",
          hi: "1517 में एक भिक्षु के पंचानबे प्रस्ताव, जो चर्च की आलोचना करते थे, छपे और हफ़्तों में जर्मनी भर पढ़े गए — इससे तेज़ जितनी तेज़ी से कोई सत्ता उत्तर दे सकती। मुद्रण ने कौन-सी उथल-पुथल संभव बनाई?",
          mr: "1517 मध्ये एका भिक्षूचे चर्चवर टीका करणारे पंचाण्णव प्रस्ताव छापले गेले आणि आठवड्यांत जर्मनीभर वाचले गेले — कोणतीही सत्ता उत्तर देऊ शकेल त्याहून वेगाने. मुद्रणाने कोणती उलथापालथ शक्य केली?",
        },
        statement: {
          en: "Print made the Reformation possible: Martin Luther's theses and pamphlets spread through Germany faster than the Church could suppress or reply to them, splitting Western Christianity.",
          hi: "मुद्रण ने धर्मसुधार संभव बनाया: मार्टिन लूथर के प्रस्ताव और पुस्तिकाएँ जर्मनी भर उससे तेज़ फैलीं जितनी तेज़ी से चर्च उन्हें दबा या उत्तर दे सकता, और पश्चिमी ईसाइयत बँट गई।",
          mr: "मुद्रणाने धर्मसुधारणा शक्य केली: मार्टिन ल्यूथरचे प्रस्ताव आणि पुस्तिका जर्मनीभर चर्च त्यांना दडपू वा उत्तर देऊ शकेल त्याहून वेगाने पसरल्या, आणि पाश्चात्त्य ख्रिस्ती धर्म फुटला.",
        },
        detail: {
          en: "Luther also had the Bible printed in German, so that a believer could read scripture without a priest standing between the text and the reader.",
          hi: "लूथर ने बाइबिल जर्मन में भी छपवाई, ताकि विश्वासी बिना किसी पादरी के — जो पाठ और पाठक के बीच खड़ा हो — धर्मग्रंथ पढ़ सके।",
          mr: "ल्यूथरने बायबल जर्मनमध्येही छापवले, जेणेकरून श्रद्धाळू मजकूर आणि वाचक यांच्यात उभ्या असलेल्या पाद्रीविना धर्मग्रंथ वाचू शकेल.",
        },
        extra: {
          en: "The Church answered by keeping an Index of Prohibited Books from 1558, an admission that a printed argument now had to be fought rather than simply forbidden.",
          hi: "चर्च ने 1558 से निषिद्ध पुस्तकों की सूची रखकर उत्तर दिया — यह स्वीकारोक्ति कि अब छपे तर्क से लड़ना पड़ता है, उसे बस मना कर देना काफ़ी नहीं।",
          mr: "चर्चने 1558 पासून निषिद्ध पुस्तकांची यादी ठेवून उत्तर दिले — ही कबुली की आता छापील युक्तिवादाशी लढावे लागते, त्याला फक्त मनाई करून चालत नाही.",
        },
        pair: {
          left: {
            en: "A pamphlet outrunning the Church's reply",
            hi: "चर्च के उत्तर से आगे निकलती पुस्तिका",
            mr: "चर्चच्या उत्तराच्या पुढे गेलेली पुस्तिका",
          },
          right: {
            en: "print and the Reformation",
            hi: "मुद्रण और धर्मसुधार",
            mr: "मुद्रण आणि धर्मसुधारणा",
          },
        },
      },
      {
        id: "chapbooks",
        name: {
          en: "Chapbooks and the poor reader",
          hi: "चैपबुक और ग़रीब पाठक",
          mr: "चोपडी आणि गरीब वाचक",
        },
        kind: "idea",
        prompt: {
          en: "Pocket-sized books of ballads, folk tales and almanacs were carried village to village by pedlars and sold for a penny, putting print within reach of people who had never owned a book. What were these called?",
          hi: "गीतों, लोककथाओं और पंचांगों की जेब में समाने वाली किताबें फेरीवाले गाँव-गाँव ले जाते और एक पैसे में बेचते थे, जिससे मुद्रण उन लोगों की पहुँच में आया जिनके पास कभी कोई किताब नहीं रही थी। ये क्या कहलाती थीं?",
          mr: "गीते, लोककथा आणि पंचांगांची खिशात मावणारी पुस्तके फेरीवाले गावोगाव नेत आणि एका पैशाला विकत, ज्यामुळे छपाई अशा लोकांच्या आवाक्यात आली ज्यांच्याकडे कधी पुस्तक नव्हते. ही काय म्हणत?",
        },
        statement: {
          en: "Chapbooks were small cheap books of ballads, tales and almanacs hawked by pedlars for a penny, and they brought reading within reach of poor townsfolk and villagers for the first time.",
          hi: "चैपबुक गीतों, कथाओं और पंचांगों की छोटी सस्ती किताबें थीं जिन्हें फेरीवाले एक पैसे में बेचते थे, और उन्होंने पहली बार पढ़ना ग़रीब क़स्बाइयों और गाँववालों की पहुँच में ला दिया।",
          mr: "चोपडी म्हणजे गीते, कथा आणि पंचांगांची लहान स्वस्त पुस्तके जी फेरीवाले एका पैशाला विकत, आणि त्यांनी पहिल्यांदाच वाचन गरीब गावकऱ्यांच्या आणि खेडुतांच्या आवाक्यात आणले.",
        },
        detail: {
          en: "Many buyers could not read, so one literate person read aloud at the inn or the fire and a dozen listeners shared a single copy.",
          hi: "कई ख़रीदार पढ़ नहीं सकते थे, अतः एक साक्षर व्यक्ति सराय या अलाव के पास ज़ोर से पढ़ता और एक ही प्रति दर्जन भर श्रोता साझा करते थे।",
          mr: "अनेक खरेदीदार वाचू शकत नसत, म्हणून एक साक्षर व्यक्ती खानावळीत वा शेकोटीजवळ मोठ्याने वाचे आणि एकच प्रत डझनभर श्रोते वाटून घेत.",
        },
        extra: {
          en: "That is why literacy figures understate print's reach: the audience for a book was always larger than the number of people who could read it.",
          hi: "इसीलिए साक्षरता के आँकड़े मुद्रण की पहुँच कम करके बताते हैं: किसी किताब के श्रोता सदा उन लोगों की संख्या से अधिक थे जो उसे पढ़ सकते थे।",
          mr: "म्हणूनच साक्षरतेचे आकडे मुद्रणाचा आवाका कमी करून सांगतात: एखाद्या पुस्तकाचे श्रोते सदैव ते वाचू शकणाऱ्यांच्या संख्येहून अधिक होते.",
        },
        pair: {
          left: {
            en: "A penny book carried village to village",
            hi: "गाँव-गाँव ले जाई जाती एक पैसे की किताब",
            mr: "गावोगाव नेलेले एका पैशाचे पुस्तक",
          },
          right: {
            en: "chapbooks",
            hi: "चैपबुक",
            mr: "चोपडी",
          },
        },
      },
      {
        id: "print-in-india",
        name: {
          en: "The Indian-language press",
          hi: "भारतीय भाषाओं का प्रेस",
          mr: "भारतीय भाषांचा प्रेस",
        },
        kind: "structure",
        prompt: {
          en: "From the early nineteenth century weeklies and journals appeared in Bengali, Marathi, Urdu, Tamil and other languages, arguing over widow remarriage, caste and the government in a readership no ruler had reckoned with. What is this?",
          hi: "उन्नीसवीं सदी के आरंभ से बांग्ला, मराठी, उर्दू, तमिल तथा अन्य भाषाओं में साप्ताहिक और पत्रिकाएँ निकलीं, जो विधवा-पुनर्विवाह, जाति और सरकार पर उस पाठक-वर्ग में बहस करती थीं जिसका किसी शासक ने हिसाब नहीं लगाया था। यह क्या है?",
          mr: "एकोणिसाव्या शतकाच्या सुरुवातीपासून बंगाली, मराठी, उर्दू, तमिळ आणि इतर भाषांत साप्ताहिके व नियतकालिके निघाली, जी विधवा-पुनर्विवाह, जात आणि सरकार यांवर अशा वाचकवर्गात वाद घालत ज्याचा कोणत्या राज्यकर्त्याने हिशोब मांडला नव्हता. हे काय?",
        },
        statement: {
          en: "The Indian-language press was the growth from the early nineteenth century of newspapers and journals in Bengali, Marathi, Urdu, Tamil and other languages, which carried social reform debates and political criticism to a wide new readership.",
          hi: "भारतीय भाषाओं का प्रेस उन्नीसवीं सदी के आरंभ से बांग्ला, मराठी, उर्दू, तमिल तथा अन्य भाषाओं में अख़बारों और पत्रिकाओं की वह वृद्धि थी, जो समाज-सुधार की बहसें और राजनीतिक आलोचना एक विस्तृत नए पाठक-वर्ग तक ले गई।",
          mr: "भारतीय भाषांचा प्रेस म्हणजे एकोणिसाव्या शतकाच्या सुरुवातीपासून बंगाली, मराठी, उर्दू, तमिळ आणि इतर भाषांतील वृत्तपत्रे व नियतकालिकांची ती वाढ, जी समाजसुधारणेचे वाद आणि राजकीय टीका एका विस्तृत नव्या वाचकवर्गापर्यंत नेत होती.",
        },
        detail: {
          en: "It carried argument in both directions: reformers and orthodox opponents attacked each other in print, and readers followed the exchange week by week.",
          hi: "यह दोनों दिशाओं में तर्क ढोता था: सुधारक और रूढ़िवादी विरोधी छपाई में एक-दूसरे पर हमला करते, और पाठक हफ़्ते-दर-हफ़्ते वह आदान-प्रदान देखते थे।",
          mr: "तो दोन्ही दिशांनी युक्तिवाद वाहत असे: सुधारक आणि सनातनी विरोधक छपाईत एकमेकांवर हल्ला करत, आणि वाचक आठवड्यागणिक ती देवाणघेवाण पाहत.",
        },
        extra: {
          en: "It also gave a language of grievance to people the courts and councils never heard, and the government read it as closely as its readers did.",
          hi: "इसने उन लोगों को शिकायत की भाषा भी दी जिन्हें अदालतें और काउंसिलें कभी नहीं सुनतीं, और सरकार उसे उतने ही ध्यान से पढ़ती थी जितने उसके पाठक।",
          mr: "त्याने त्या लोकांना तक्रारीची भाषाही दिली ज्यांना न्यायालये आणि कौन्सिले कधी ऐकत नसत, आणि सरकार तो त्याच्या वाचकांइतक्याच बारकाईने वाचत असे.",
        },
        pair: {
          left: {
            en: "Weeklies in Bengali, Marathi, Urdu and Tamil",
            hi: "बांग्ला, मराठी, उर्दू और तमिल में साप्ताहिक",
            mr: "बंगाली, मराठी, उर्दू आणि तमिळमधील साप्ताहिके",
          },
          right: {
            en: "the Indian-language press",
            hi: "भारतीय भाषाओं का प्रेस",
            mr: "भारतीय भाषांचा प्रेस",
          },
        },
      },
      {
        id: "vernacular-press-act",
        name: {
          en: "The Vernacular Press Act",
          hi: "वर्नाक्युलर प्रेस एक्ट",
          mr: "व्हर्नाक्युलर प्रेस अ‍ॅक्ट",
        },
        kind: "event",
        prompt: {
          en: "In 1878 a law empowered the government to censor and confiscate the presses of newspapers it judged seditious — but only those published in Indian languages, leaving English papers untouched. Which act is this?",
          hi: "1878 में एक क़ानून ने सरकार को उन अख़बारों की सेंसरशिप और प्रेस ज़ब्त करने की शक्ति दी जिन्हें वह राजद्रोही माने — पर केवल उन्हें जो भारतीय भाषाओं में छपते थे, अंग्रेज़ी अख़बारों को छोड़कर। यह कौन-सा अधिनियम है?",
          mr: "1878 मध्ये एका कायद्याने सरकारला ज्यांना ती राजद्रोही मानेल त्या वृत्तपत्रांची सेन्सॉरशिप व छापखाने जप्त करण्याची सत्ता दिली — पण फक्त भारतीय भाषांत छापणाऱ्यांची, इंग्रजी वृत्तपत्रे सोडून. हा कोणता कायदा?",
        },
        statement: {
          en: "The Vernacular Press Act of 1878 allowed the government to censor reports and seize the printing presses of newspapers published in Indian languages, while English-language papers were exempt.",
          hi: "1878 के वर्नाक्युलर प्रेस एक्ट ने सरकार को भारतीय भाषाओं में छपते अख़बारों की ख़बरें सेंसर करने और उनके छापेख़ाने ज़ब्त करने की छूट दी, जबकि अंग्रेज़ी अख़बार छूट गए।",
          mr: "1878 च्या व्हर्नाक्युलर प्रेस अ‍ॅक्टने सरकारला भारतीय भाषांत छापणाऱ्या वृत्तपत्रांचे वृत्त सेन्सॉर करण्याची आणि त्यांचे छापखाने जप्त करण्याची मुभा दिली, तर इंग्रजी वृत्तपत्रे वगळली गेली.",
        },
        detail: {
          en: "It was modelled on Irish press laws, and its explicit test was language rather than content — the same criticism was lawful in English and punishable in Bengali.",
          hi: "यह आयरिश प्रेस-क़ानूनों की तर्ज़ पर बना था, और उसकी स्पष्ट कसौटी विषय नहीं भाषा थी — वही आलोचना अंग्रेज़ी में वैध और बांग्ला में दंडनीय थी।",
          mr: "तो आयरिश प्रेस-कायद्यांच्या धर्तीवर बनवला होता, आणि त्याची स्पष्ट कसोटी आशय नव्हे तर भाषा होती — तीच टीका इंग्रजीत कायदेशीर आणि बंगालीत शिक्षापात्र होती.",
        },
        extra: {
          en: "It failed at what it wanted: banned editors reopened under new names, and the act itself became a standing argument for the nationalist demand for a free press.",
          hi: "वह अपने उद्देश्य में विफल रहा: प्रतिबंधित संपादक नए नामों से फिर खुल गए, और वह अधिनियम स्वयं स्वतंत्र प्रेस की राष्ट्रवादी माँग का स्थायी तर्क बन गया।",
          mr: "तो आपल्या उद्दिष्टात अपयशी ठरला: बंदी घातलेले संपादक नव्या नावांनी पुन्हा सुरू झाले, आणि तो कायदाच स्वतंत्र प्रेसच्या राष्ट्रवादी मागणीचा कायमचा युक्तिवाद बनला.",
        },
        pair: {
          left: {
            en: "Censorship by language, not by content",
            hi: "विषय से नहीं, भाषा से सेंसरशिप",
            mr: "आशयाने नव्हे, भाषेने सेन्सॉरशिप",
          },
          right: {
            en: "the Vernacular Press Act",
            hi: "वर्नाक्युलर प्रेस एक्ट",
            mr: "व्हर्नाक्युलर प्रेस अ‍ॅक्ट",
          },
        },
      },
      {
        id: "print-and-women",
        name: {
          en: "Print and women's writing",
          hi: "मुद्रण और स्त्रियों का लेखन",
          mr: "मुद्रण आणि स्त्रियांचे लेखन",
        },
        kind: "process",
        prompt: {
          en: "Reformers argued that girls should be taught to read so they could be better wives and mothers — and then women used that literacy to publish autobiographies and attacks on the treatment of widows. What development is this?",
          hi: "सुधारक तर्क देते थे कि लड़कियों को पढ़ना सिखाया जाए ताकि वे बेहतर पत्नियाँ और माँएँ बनें — और फिर स्त्रियों ने उसी साक्षरता से आत्मकथाएँ और विधवाओं के साथ बरताव पर हमले छापे। यह कौन-सा विकास है?",
          mr: "सुधारक युक्तिवाद करत की मुलींना वाचायला शिकवावे जेणेकरून त्या अधिक चांगल्या पत्नी आणि माता होतील — आणि मग स्त्रियांनी त्याच साक्षरतेतून आत्मचरित्रे आणि विधवांच्या वागणुकीवरील हल्ले छापले. हा कोणता विकास?",
        },
        statement: {
          en: "Print and women's writing describes how literacy taught to girls for domestic reasons was turned by women into published memoirs, essays and criticism of the conditions in which women lived.",
          hi: "मुद्रण और स्त्रियों का लेखन यह बताता है कि घरेलू कारणों से लड़कियों को सिखाई गई साक्षरता को स्त्रियों ने छपी आत्मकथाओं, निबंधों और उन स्थितियों की आलोचना में बदल दिया जिनमें स्त्रियाँ जीती थीं।",
          mr: "मुद्रण आणि स्त्रियांचे लेखन हे सांगते की घरगुती कारणांसाठी मुलींना शिकवलेल्या साक्षरतेचे स्त्रियांनी छापील आत्मचरित्रे, निबंध आणि स्त्रिया ज्या परिस्थितीत जगत त्यांच्या टीकेत रूपांतर केले.",
        },
        detail: {
          en: "Rashsundari Debi taught herself in secret and wrote Amar Jiban, the first full-length autobiography published in Bengali, describing a life of unbroken domestic labour.",
          hi: "राशसुंदरी देवी ने चोरी-छिपे स्वयं पढ़ना सीखा और 'आमार जीबोन' लिखी — बांग्ला में छपी पहली पूर्ण आत्मकथा — जिसमें अटूट घरेलू श्रम का जीवन बताया गया।",
          mr: "राशसुंदरी देबींनी चोरून स्वतः वाचायला शिकून 'आमार जीबन' लिहिले — बंगालीत छापलेले पहिले संपूर्ण आत्मचरित्र — ज्यात अखंड घरकामाचे आयुष्य वर्णिले.",
        },
        extra: {
          en: "The reaction was immediate: conservative households warned that a reading woman would be widowed, and some journals printed cures for the supposed disease of educating girls.",
          hi: "प्रतिक्रिया तुरंत आई: रूढ़िवादी घरों ने चेताया कि पढ़ने वाली स्त्री विधवा हो जाएगी, और कुछ पत्रिकाओं ने लड़कियों को पढ़ाने के कथित रोग के इलाज छापे।",
          mr: "प्रतिक्रिया तात्काळ आली: सनातनी घरांनी इशारा दिला की वाचणारी स्त्री विधवा होईल, आणि काही नियतकालिकांनी मुलींना शिकवण्याच्या तथाकथित रोगावरील उपाय छापले.",
        },
        pair: {
          left: {
            en: "Literacy granted for the home, used on the world",
            hi: "घर के लिए दी गई साक्षरता, दुनिया पर इस्तेमाल",
            mr: "घरासाठी दिलेली साक्षरता, जगावर वापरलेली",
          },
          right: {
            en: "print and women's writing",
            hi: "मुद्रण और स्त्रियों का लेखन",
            mr: "मुद्रण आणि स्त्रियांचे लेखन",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "When printing spread in Europe, it was welcomed by many but feared by the Church, by rulers and by scholars, some of whom called it a plague and demanded it be licensed or banned. Given that they were often devout, learned people, what exactly were they afraid of?",
          hi: "जब यूरोप में मुद्रण फैला, कई लोगों ने उसका स्वागत किया पर चर्च, शासकों और विद्वानों ने उससे भय खाया, जिनमें से कुछ ने उसे महामारी कहा और माँग की कि उसे अनुज्ञप्ति में बाँधा या प्रतिबंधित किया जाए। यह देखते हुए कि वे अक्सर धर्मनिष्ठ, विद्वान लोग थे, वे ठीक-ठीक किससे डरते थे?",
          mr: "युरोपात छपाई पसरली तेव्हा अनेकांनी तिचे स्वागत केले पण चर्च, राज्यकर्ते आणि विद्वानांनी तिची भीती बाळगली, ज्यांतील काहींनी तिला साथ म्हटले आणि परवाना वा बंदीची मागणी केली. ते अनेकदा श्रद्धाळू, विद्वान लोक होते हे पाहता, ते नेमके कशाची भीती बाळगत होते?",
        },
        choices: [
          {
            en: "That they would lose their monopoly on interpretation. When texts were hand-copied and scarce, the Church and scholars decided what a book meant and who could see it. Cheap printed books, especially in ordinary languages, let people read scripture and argument for themselves, form their own conclusions, and circulate criticism faster than any authority could answer it — so print threatened not literacy but control over what people believed",
            hi: "कि व्याख्या पर उनका एकाधिकार जाता रहेगा। जब पाठ हाथ से नक़ल होते और दुर्लभ थे, चर्च और विद्वान तय करते थे कि किताब का अर्थ क्या है और उसे कौन देख सकता है। सस्ती छपी किताबों ने, ख़ासकर आम भाषाओं में, लोगों को धर्मग्रंथ और तर्क स्वयं पढ़ने, अपने निष्कर्ष बनाने और आलोचना को किसी भी सत्ता के उत्तर से तेज़ फैलाने दिया — अतः मुद्रण से ख़तरा साक्षरता को नहीं, इस नियंत्रण को था कि लोग क्या मानें",
            mr: "की अर्थ लावण्यावरील त्यांची मक्तेदारी जाईल. मजकूर हाताने नक्कल होत आणि दुर्मीळ असत तेव्हा चर्च आणि विद्वान ठरवत की पुस्तकाचा अर्थ काय आणि ते कोण पाहू शकतो. स्वस्त छापील पुस्तकांनी, विशेषतः सामान्य भाषांत, लोकांना धर्मग्रंथ आणि युक्तिवाद स्वतः वाचू दिले, स्वतःचे निष्कर्ष काढू दिले, आणि टीका कोणत्याही सत्तेच्या उत्तराहून वेगाने पसरवू दिली — म्हणून मुद्रणाचा धोका साक्षरतेला नव्हे तर लोक काय मानतात यावरील नियंत्रणाला होता",
          },
          {
            en: "They believed printed ink was physically poisonous and would sicken anyone who handled a book",
            hi: "वे मानते थे कि छपाई की स्याही भौतिक रूप से विषैली है और किताब छूने वाले को बीमार कर देगी",
            mr: "त्यांना वाटे की छपाईची शाई भौतिकदृष्ट्या विषारी आहे आणि पुस्तक हाताळणाऱ्याला आजारी पाडेल",
          },
          {
            en: "They feared printed books would be too expensive for anyone to buy, ruining the book trade",
            hi: "उन्हें भय था कि छपी किताबें इतनी महँगी होंगी कि कोई ख़रीद न सकेगा, और पुस्तक-व्यापार चौपट हो जाएगा",
            mr: "त्यांना भीती होती की छापील पुस्तके इतकी महाग होतील की कोणी विकत घेणार नाही, आणि पुस्तक-व्यापार बुडेल",
          },
          {
            en: "There was no real opposition; print was welcomed unanimously everywhere from the start",
            hi: "कोई असली विरोध था ही नहीं; मुद्रण का हर जगह शुरू से सर्वसम्मत स्वागत हुआ",
            mr: "खरा विरोध नव्हताच; मुद्रणाचे सर्वत्र सुरुवातीपासून एकमताने स्वागत झाले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The fear was neither superstitious nor foolish; it was a clear-eyed reading of what the technology would do to authority. Before print, the scarcity of books was itself a system of control. Every copy had to be written by hand, which took months and cost more than most people earned in years, so books existed in small numbers and lived in monasteries, courts and universities. Scripture was in Latin, which ordinary people could not read, and it reached them through a priest who read, translated and explained it. In that arrangement the Church did not merely own the books; it owned the meaning. What a passage meant, which readings were sound and which were heresy, and who was permitted to ask the question at all were decided by an institution with no serious competitor. Print dismantled every part of that. Copies became numerous and cheap, so a text could no longer be kept within an approved circle. Books began appearing in the languages people actually spoke, so a reader could go to scripture directly, without an interpreter standing between. And crucially, print was fast: an argument could be set, run off in hundreds and distributed across a country in weeks, which meant a criticism could reach the public before the authorities had even composed a reply. Luther's case in 1517 is the demonstration. His theses spread across Germany within weeks; a hand-copied protest would have died in a single town. The Church could no longer contain a dispute simply by refusing to circulate it, and Western Christianity split. This is why the objections took the form they did — demands for licensing, official approval before printing, and the Index of Prohibited Books from 1558. Those are the measures of an institution that has stopped trying to prevent the technology and is now trying to control what it carries. The same logic explains the scholars' worry, which is worth taking seriously rather than mocking: they argued that cheap print would circulate rubbish and irreligion alongside good books, with no one to vouch for quality — an anxiety about unfiltered circulation that has recurred with every later communication technology. The general point is that print was not neutral. It did not simply help people read; it moved the power of interpretation from a small licensed body to anyone who could buy a pamphlet, and the people who lost that power understood precisely what was happening to them. (The wrong answers substitute a physical superstition, reverse the economics — print made books dramatically cheaper — or deny an opposition documented in the licensing laws and the Index themselves.)",
          hi: "भय न अंधविश्वासी था न मूर्खतापूर्ण; वह इस बात का साफ़-नज़र पाठ था कि यह तकनीक सत्ता के साथ क्या करेगी। मुद्रण से पहले किताबों की दुर्लभता स्वयं नियंत्रण की एक प्रणाली थी। हर प्रति हाथ से लिखनी पड़ती थी, जो महीनों लेती और अधिकांश लोगों की वर्षों की कमाई से अधिक दाम माँगती, अतः किताबें थोड़ी संख्या में रहतीं और मठों, दरबारों तथा विश्वविद्यालयों में बसतीं। धर्मग्रंथ लैटिन में था, जिसे आम लोग पढ़ नहीं सकते थे, और वह उन तक उस पादरी के ज़रिये पहुँचता था जो उसे पढ़ता, अनुवाद करता और समझाता था। उस व्यवस्था में चर्च केवल किताबों का स्वामी नहीं था; वह अर्थ का स्वामी था। किसी अंश का अर्थ क्या है, कौन-से पाठ ठीक और कौन-से पाखंड, और यह प्रश्न पूछने की अनुमति किसे है — ये सब वह संस्था तय करती थी जिसका कोई गंभीर प्रतिद्वंद्वी नहीं था। मुद्रण ने उसका हर हिस्सा ढहा दिया। प्रतियाँ अनेक और सस्ती हो गईं, अतः किसी पाठ को अब स्वीकृत घेरे में रखा नहीं जा सकता था। किताबें उन भाषाओं में छपने लगीं जो लोग वस्तुतः बोलते थे, अतः पाठक बीच में खड़े किसी व्याख्याकार के बिना सीधे धर्मग्रंथ तक जा सकता था। और मुख्य बात, मुद्रण तेज़ था: एक तर्क जमाया, सैकड़ों में छापा और हफ़्तों में देश भर बाँटा जा सकता था, जिसका अर्थ था कि आलोचना जनता तक तब पहुँच जाती जब सत्ता ने उत्तर रचा तक न हो। 1517 में लूथर का प्रकरण उसका प्रमाण है। उसके प्रस्ताव हफ़्तों में जर्मनी भर फैल गए; हाथ से नक़ल किया विरोध एक ही क़स्बे में मर जाता। चर्च अब किसी विवाद को उसे न फैलाकर रोक नहीं सकता था, और पश्चिमी ईसाइयत बँट गई। इसीलिए आपत्तियों ने वही रूप लिया जो लिया — अनुज्ञप्ति की माँग, छपाई से पहले सरकारी स्वीकृति, और 1558 से निषिद्ध पुस्तकों की सूची। ये उस संस्था के उपाय हैं जिसने तकनीक को रोकने की कोशिश छोड़ दी और अब यह नियंत्रित करने में लगी है कि वह क्या ढोए। यही तर्क विद्वानों की चिंता भी समझाता है, जिसे मज़ाक़ बनाने के बजाय गंभीरता से लेना चाहिए: उनका कहना था कि सस्ता मुद्रण अच्छी किताबों के साथ कूड़ा और अधर्म भी फैलाएगा, और गुणवत्ता की ज़मानत देने वाला कोई नहीं होगा — बिना छने प्रसार की वह चिंता जो हर बाद की संचार-तकनीक के साथ लौटी है। सामान्य बिंदु यह कि मुद्रण तटस्थ नहीं था। उसने बस लोगों को पढ़ने में मदद नहीं की; उसने व्याख्या की शक्ति एक छोटी अनुज्ञप्त संस्था से हटाकर उस किसी को दे दी जो एक पुस्तिका ख़रीद सके, और जिनसे वह शक्ति गई वे ठीक-ठीक समझते थे कि उनके साथ क्या हो रहा है। (ग़लत उत्तर भौतिक अंधविश्वास रखते, अर्थशास्त्र उलटते — मुद्रण ने किताबें नाटकीय रूप से सस्ती कीं — या उस विरोध को नकारते जो स्वयं अनुज्ञप्ति-क़ानूनों और निषिद्ध सूची में दर्ज है।)",
          mr: "भीती ना अंधश्रद्ध होती ना मूर्ख; ते तंत्रज्ञान सत्तेचे काय करेल याचे स्वच्छ नजरेने केलेले वाचन होते. मुद्रणापूर्वी पुस्तकांची दुर्मीळता हीच नियंत्रणाची एक व्यवस्था होती. प्रत्येक प्रत हाताने लिहावी लागे, जी महिने घेई आणि बहुतांश लोकांच्या वर्षांच्या कमाईहून अधिक किंमत मागे, म्हणून पुस्तके थोड्या संख्येत असत आणि मठ, दरबार व विद्यापीठांत राहत. धर्मग्रंथ लॅटिनमध्ये होता, जो सामान्य लोक वाचू शकत नसत, आणि तो त्यांच्यापर्यंत तो वाचणाऱ्या, भाषांतर करणाऱ्या आणि समजावणाऱ्या पाद्रीमार्फत पोहोचे. त्या व्यवस्थेत चर्च केवळ पुस्तकांचे मालक नव्हते; ते अर्थाचे मालक होते. एखाद्या उताऱ्याचा अर्थ काय, कोणती वाचने योग्य आणि कोणती पाखंड, आणि हा प्रश्न विचारण्याची परवानगी कोणाला — हे सर्व ती संस्था ठरवत होती जिला गंभीर प्रतिस्पर्धी नव्हता. मुद्रणाने त्याचा प्रत्येक भाग मोडून काढला. प्रती अनेक आणि स्वस्त झाल्या, म्हणून एखादा मजकूर आता मान्यताप्राप्त वर्तुळात ठेवता येईना. पुस्तके लोक प्रत्यक्षात बोलत त्या भाषांत छापू लागली, म्हणून वाचक मध्ये उभ्या अर्थ लावणाऱ्याविना थेट धर्मग्रंथाकडे जाऊ शकत होता. आणि मुख्य म्हणजे, मुद्रण वेगवान होते: एक युक्तिवाद जुळवून, शेकडोंत छापून आणि आठवड्यांत देशभर वाटता येत होता, म्हणजे टीका जनतेपर्यंत तेव्हा पोहोचे जेव्हा सत्तेने उत्तर रचलेलेही नसे. 1517 मधील ल्यूथरचे प्रकरण याचा पुरावा. त्याचे प्रस्ताव आठवड्यांत जर्मनीभर पसरले; हाताने नक्कल केलेला निषेध एकाच गावात मेला असता. चर्च आता एखादा वाद तो न पसरवून थांबवू शकत नव्हते, आणि पाश्चात्त्य ख्रिस्ती धर्म फुटला. म्हणूनच आक्षेपांनी तेच रूप घेतले जे घेतले — परवान्याची मागणी, छपाईपूर्वी अधिकृत मान्यता, आणि 1558 पासून निषिद्ध पुस्तकांची यादी. हे त्या संस्थेचे उपाय आहेत जिने तंत्रज्ञान रोखण्याचा प्रयत्न सोडून दिला आणि आता ते काय वाहते हे नियंत्रित करण्यात गुंतली आहे. हाच तर्क विद्वानांची चिंताही समजावतो, जिची थट्टा करण्याऐवजी ती गांभीर्याने घ्यावी: त्यांचे म्हणणे होते की स्वस्त छपाई चांगल्या पुस्तकांसोबत कचरा आणि अधर्मही पसरवेल, आणि गुणवत्तेची हमी देणारा कोणी नसेल — न गाळलेल्या प्रसाराची ती चिंता जी नंतरच्या प्रत्येक संपर्क-तंत्रज्ञानासोबत परतली आहे. सामान्य मुद्दा हा की मुद्रण तटस्थ नव्हते. त्याने केवळ लोकांना वाचायला मदत केली नाही; त्याने अर्थ लावण्याची सत्ता एका लहान परवानाधारी संस्थेकडून काढून जो कोणी पुस्तिका विकत घेऊ शकेल त्याला दिली, आणि ज्यांची ती सत्ता गेली त्यांना नेमके कळत होते की त्यांचे काय होत आहे. (चुकीची उत्तरे भौतिक अंधश्रद्धा ठेवतात, अर्थशास्त्र उलटवतात — मुद्रणाने पुस्तके नाट्यमयरीत्या स्वस्त केली — वा स्वतः परवाना-कायदे आणि निषिद्ध यादीत नोंदलेला विरोध नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "The Vernacular Press Act of 1878 let the government censor and seize the presses of newspapers in Indian languages, while identical criticism printed in English went untouched. Explain what that distinction reveals about what the government actually feared, and why the law failed anyway.",
          hi: "1878 के वर्नाक्युलर प्रेस एक्ट ने सरकार को भारतीय भाषाओं के अख़बारों की सेंसरशिप और प्रेस ज़ब्ती की छूट दी, जबकि वही आलोचना अंग्रेज़ी में छपने पर अछूती रही। समझाओ यह भेद क्या बताता है कि सरकार वस्तुतः किससे डरती थी, और फिर भी वह क़ानून विफल क्यों हुआ।",
          mr: "1878 च्या व्हर्नाक्युलर प्रेस अ‍ॅक्टने सरकारला भारतीय भाषांतील वृत्तपत्रांची सेन्सॉरशिप व छापखाने जप्तीची मुभा दिली, तर तीच टीका इंग्रजीत छापल्यास अस्पर्श राहिली. समजावा हा भेद काय दाखवतो की सरकार प्रत्यक्षात कशाची भीती बाळगत होते, आणि तरीही तो कायदा का फसला.",
        },
        choices: [
          {
            en: "It reveals that the target was the audience, not the opinion. English papers reached a small educated elite the government could manage; Indian-language papers reached a mass readership — and, through reading aloud, listeners far beyond it — where criticism could turn into organised protest. The law failed because presses were cheap and easily moved, banned papers reopened under new names and new editors, and the act itself became evidence for the nationalist argument that British rule could not survive being discussed in Indian",
            hi: "यह बताता है कि निशाना श्रोता-वर्ग था, राय नहीं। अंग्रेज़ी अख़बार एक छोटे शिक्षित अभिजन तक पहुँचते थे जिसे सरकार सँभाल सकती थी; भारतीय भाषाओं के अख़बार एक व्यापक पाठक-वर्ग तक — और ज़ोर से पढ़े जाने के ज़रिये उससे कहीं आगे श्रोताओं तक — पहुँचते थे, जहाँ आलोचना संगठित विरोध में बदल सकती थी। क़ानून इसलिए विफल हुआ कि प्रेस सस्ते और आसानी से हटाए जा सकने वाले थे, प्रतिबंधित अख़बार नए नामों और नए संपादकों से फिर खुल गए, और वह अधिनियम स्वयं इस राष्ट्रवादी तर्क का प्रमाण बन गया कि ब्रिटिश शासन भारतीय भाषाओं में चर्चा सह ही नहीं सकता",
            mr: "ते दाखवते की लक्ष्य श्रोतृवर्ग होता, मत नव्हे. इंग्रजी वृत्तपत्रे एका लहान शिकलेल्या उच्चवर्गापर्यंत पोहोचत ज्याला सरकार सांभाळू शकत होते; भारतीय भाषांतील वृत्तपत्रे व्यापक वाचकवर्गापर्यंत — आणि मोठ्याने वाचनातून त्याहून कितीतरी पुढे श्रोत्यांपर्यंत — पोहोचत, जिथे टीका संघटित निषेधात बदलू शकत होती. कायदा यासाठी फसला की छापखाने स्वस्त आणि सहज हलवण्याजोगे होते, बंदी घातलेली वृत्तपत्रे नव्या नावांनी आणि नव्या संपादकांनी पुन्हा सुरू झाली, आणि तो कायदाच या राष्ट्रवादी युक्तिवादाचा पुरावा बनला की ब्रिटिश राजवट भारतीय भाषांत चर्चिली जाणे सोसूच शकत नाही",
          },
          {
            en: "It shows the government believed Indian languages were incapable of expressing political ideas at all",
            hi: "यह दिखाता है कि सरकार मानती थी कि भारतीय भाषाएँ राजनीतिक विचार व्यक्त करने में सर्वथा असमर्थ हैं",
            mr: "ते दाखवते की सरकारला वाटे भारतीय भाषा राजकीय विचार व्यक्त करण्यास मुळीच असमर्थ आहेत",
          },
          {
            en: "The distinction was accidental, and the act was in fact applied equally to English papers throughout",
            hi: "यह भेद आकस्मिक था, और अधिनियम वस्तुतः पूरे समय अंग्रेज़ी अख़बारों पर भी समान रूप से लागू हुआ",
            mr: "हा भेद अपघाती होता, आणि कायदा प्रत्यक्षात संपूर्ण काळ इंग्रजी वृत्तपत्रांवरही सारखाच लागू झाला",
          },
          {
            en: "The law succeeded completely and ended Indian-language journalism until independence",
            hi: "क़ानून पूरी तरह सफल रहा और स्वतंत्रता तक भारतीय भाषाओं की पत्रकारिता समाप्त कर दी",
            mr: "कायदा पूर्णपणे यशस्वी ठरला आणि स्वातंत्र्यापर्यंत भारतीय भाषांतील पत्रकारिता संपवली",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The clue is in what the law measured. It did not define sedition by what was said; it defined the offence by the language it was said in. The same sentence attacking a viceroy's policy was lawful in an English weekly and grounds for seizing a press if it appeared in Bengali or Marathi. A government that objected to the opinion would have written the law around content. A government that wrote it around language was objecting to the readership. Consider who those readerships were. English-language papers in India were read by officials, professionals, and a thin educated elite — a group small enough to be known, employed, promoted or ignored, and one whose criticism largely stayed within a conversation the government was already part of. Indian-language papers were another matter. They reached traders, clerks, schoolteachers, small landholders and townspeople across whole regions, and their real audience was larger still, because a single copy read aloud at a shop, a tea stall or a village gathering carried to people who could not read at all. That is a channel through which a grievance can become common knowledge in a district within days, and common knowledge is the raw material of organised protest. The 1857 revolt was within living memory for the officials who drafted the act; so was the recent famine reporting that had embarrassed the administration. They were not afraid of being criticised. They were afraid of being criticised where enough people could hear it at once. Why did it fail? Partly for technical reasons. A press was not a rare or expensive object by 1878; a banned paper could close on Friday and reappear on Monday under a new title, a new declared owner and a nominal new editor, and prosecuting each one consumed more official time than it was worth. Partly for social reasons: editors who went to jail gained standing rather than lost it, and readers sought out papers the government had tried to stop. And most damagingly, the act was self-refuting in argument. By exempting English, it stated openly that the empire applied different rules to Indians and Europeans for the same act — which was precisely the nationalist charge. The law thus handed the movement a documented, unanswerable example of the discrimination it complained of, and it was quoted for decades afterwards in the demand for a free press. The wider lesson runs through this whole chapter. Print had created something new: a public that could be addressed all at once, in its own language, without permission. Governments could ban a title, seize a machine or jail an editor, but they could not un-create the audience — and every attempt to shut the channel became, itself, an item of news travelling through it. (The wrong answers attribute to the government a belief about language it never held — the act exists precisely because Indian languages expressed politics too well — deny an exemption written into the statute, or claim a success contradicted by the flourishing nationalist press of the following decades.)",
          hi: "सुराग़ इसमें है कि क़ानून किसे नापता था। उसने राजद्रोह की परिभाषा इससे नहीं की कि क्या कहा गया; उसने अपराध की परिभाषा उस भाषा से की जिसमें कहा गया। वायसराय की नीति पर हमला करता वही वाक्य अंग्रेज़ी साप्ताहिक में वैध था और बांग्ला या मराठी में छपने पर प्रेस ज़ब्त करने का आधार। जिस सरकार को राय पर आपत्ति होती वह क़ानून विषय के इर्द-गिर्द लिखती। जिस सरकार ने उसे भाषा के इर्द-गिर्द लिखा, उसकी आपत्ति पाठक-वर्ग पर थी। सोचो वे पाठक-वर्ग कौन थे। भारत में अंग्रेज़ी अख़बार अधिकारी, पेशेवर और एक पतला शिक्षित अभिजन पढ़ता था — इतना छोटा समूह कि उसे जाना, नौकरी दी, पदोन्नत या अनदेखा किया जा सके, और जिसकी आलोचना बड़े हिस्से में उसी बातचीत के भीतर रहती जिसका सरकार पहले से हिस्सा थी। भारतीय भाषाओं के अख़बार दूसरी बात थे। वे पूरे-पूरे क्षेत्रों के व्यापारियों, मुंशियों, अध्यापकों, छोटे ज़मींदारों और क़स्बाइयों तक पहुँचते थे, और उनके असली श्रोता उससे भी बड़े थे, क्योंकि दुकान, चाय की गुमटी या गाँव की चौपाल पर ज़ोर से पढ़ी एक ही प्रति उन तक पहुँचती जो पढ़ ही नहीं सकते थे। यह ऐसा माध्यम है जिससे कोई शिकायत दिनों में पूरे ज़िले का साझा ज्ञान बन सकती है, और साझा ज्ञान संगठित विरोध का कच्चा माल है। अधिनियम का मसौदा बनाते अधिकारियों की जीवित स्मृति में 1857 का विद्रोह था; हाल की वह अकाल-रिपोर्टिंग भी जिसने प्रशासन को शर्मिंदा किया था। उन्हें आलोचित होने का भय नहीं था। उन्हें वहाँ आलोचित होने का भय था जहाँ पर्याप्त लोग उसे एक साथ सुन लें। वह विफल क्यों हुआ? कुछ तकनीकी कारणों से। 1878 तक प्रेस कोई दुर्लभ या महँगी वस्तु नहीं थी; प्रतिबंधित अख़बार शुक्रवार को बंद होकर सोमवार को नए शीर्षक, नए घोषित मालिक और नाममात्र के नए संपादक के साथ फिर निकल सकता था, और हर एक पर मुक़दमा चलाना उसके मूल्य से अधिक सरकारी समय खा जाता था। कुछ सामाजिक कारणों से: जेल गए संपादकों की प्रतिष्ठा घटती नहीं बढ़ती थी, और पाठक उन्हीं अख़बारों को ढूँढ़ते थे जिन्हें सरकार ने रोकना चाहा। और सबसे घातक यह कि अधिनियम तर्क में स्वयं-खंडनकारी था। अंग्रेज़ी को छूट देकर उसने खुलकर कह दिया कि साम्राज्य एक ही कर्म के लिए भारतीयों और यूरोपीयों पर अलग नियम लगाता है — और यही तो राष्ट्रवादी आरोप था। इस तरह क़ानून ने आंदोलन को उस भेदभाव का दस्तावेज़ी, अखंडनीय उदाहरण थमा दिया जिसकी वह शिकायत करता था, और स्वतंत्र प्रेस की माँग में वह दशकों तक उद्धृत होता रहा। व्यापक सबक़ पूरे अध्याय में चलता है। मुद्रण ने कुछ नया रचा था: एक ऐसी जनता जिसे एक साथ, उसकी अपनी भाषा में, बिना अनुमति संबोधित किया जा सके। सरकारें किसी शीर्षक पर रोक लगा सकती थीं, मशीन ज़ब्त कर सकती थीं या संपादक को जेल भेज सकती थीं, पर उस श्रोता-वर्ग को अ-रचा नहीं कर सकती थीं — और माध्यम बंद करने का हर प्रयास स्वयं उसी माध्यम से यात्रा करती ख़बर बन जाता था। (ग़लत उत्तर सरकार को भाषा के बारे में ऐसा विश्वास सौंपते जो उसने कभी नहीं रखा — अधिनियम ठीक इसलिए है कि भारतीय भाषाएँ राजनीति बहुत अच्छे से व्यक्त करती थीं — क़ानून में लिखी छूट को नकारते, या ऐसी सफलता का दावा करते जिसका खंडन आने वाले दशकों का फलता-फूलता राष्ट्रवादी प्रेस करता है।)",
          mr: "सुगावा कायदा काय मोजत होता यात आहे. त्याने राजद्रोहाची व्याख्या काय म्हटले यावरून केली नाही; त्याने गुन्ह्याची व्याख्या ते ज्या भाषेत म्हटले त्यावरून केली. व्हाइसरॉयच्या धोरणावर हल्ला करणारे तेच वाक्य इंग्रजी साप्ताहिकात कायदेशीर होते आणि बंगाली वा मराठीत छापल्यास छापखाना जप्त करण्याचे कारण. ज्या सरकारला मतावर आक्षेप असता तिने कायदा आशयाभोवती लिहिला असता. ज्या सरकारने तो भाषेभोवती लिहिला, तिचा आक्षेप वाचकवर्गावर होता. ते वाचकवर्ग कोण होते ते पाहा. भारतात इंग्रजी वृत्तपत्रे अधिकारी, व्यावसायिक आणि एक पातळ शिकलेला उच्चवर्ग वाचत — इतका लहान गट की त्याला ओळखता, नोकरी देता, बढती देता वा दुर्लक्षिता येईल, आणि ज्याची टीका मोठ्या प्रमाणात त्याच संभाषणात राही ज्याचा सरकार आधीच भाग होते. भारतीय भाषांतील वृत्तपत्रे दुसरी बाब होती. ती अख्ख्या प्रदेशांतील व्यापारी, कारकून, शिक्षक, छोटे जमीनदार आणि गावकऱ्यांपर्यंत पोहोचत, आणि त्यांचे खरे श्रोते त्याहूनही मोठे होते, कारण दुकानात, चहाच्या टपरीवर वा गावच्या चावडीवर मोठ्याने वाचलेली एकच प्रत त्यांच्यापर्यंत पोहोचे जे वाचूच शकत नव्हते. हा असा मार्ग आहे ज्यातून एखादी तक्रार दिवसांत अख्ख्या जिल्ह्याचे सामायिक ज्ञान बनू शकते, आणि सामायिक ज्ञान हे संघटित निषेधाचे कच्चे साहित्य आहे. कायद्याचा मसुदा करणाऱ्या अधिकाऱ्यांच्या जिवंत स्मृतीत 1857 चे बंड होते; अलीकडची ती दुष्काळ-वार्तांकनेही ज्यांनी प्रशासनाला ओशाळे केले होते. त्यांना टीका होण्याची भीती नव्हती. त्यांना तिथे टीका होण्याची भीती होती जिथे पुरेसे लोक ती एकाच वेळी ऐकतील. तो का फसला? काही तांत्रिक कारणांनी. 1878 पर्यंत छापखाना दुर्मीळ वा महाग वस्तू नव्हता; बंदी घातलेले वृत्तपत्र शुक्रवारी बंद होऊन सोमवारी नव्या शीर्षकाने, नव्या घोषित मालकाने आणि नामधारी नव्या संपादकाने पुन्हा निघू शकत होते, आणि प्रत्येकावर खटला चालवणे त्याच्या मोलाहून अधिक सरकारी वेळ खाई. काही सामाजिक कारणांनी: तुरुंगात गेलेल्या संपादकांची प्रतिष्ठा घटण्याऐवजी वाढे, आणि वाचक तीच वृत्तपत्रे शोधत जी सरकारने थांबवू पाहिली. आणि सर्वांत घातक म्हणजे कायदा युक्तिवादात स्वतःचेच खंडन करणारा होता. इंग्रजीला सूट देऊन त्याने उघड सांगितले की साम्राज्य एकाच कृतीसाठी भारतीय आणि युरोपीयांना वेगळे नियम लावते — आणि हाच तर राष्ट्रवादी आरोप होता. अशा प्रकारे कायद्याने चळवळीला ज्या भेदभावाची ती तक्रार करत होती त्याचे दस्तऐवजी, अखंडनीय उदाहरण दिले, आणि स्वतंत्र प्रेसच्या मागणीत तो दशके उद्धृत होत राहिला. व्यापक धडा अख्ख्या प्रकरणातून चालतो. मुद्रणाने काही नवे घडवले होते: अशी जनता जिला एकाच वेळी, तिच्या स्वतःच्या भाषेत, परवानगीविना संबोधता येईल. सरकारे एखाद्या शीर्षकावर बंदी घालू शकत, यंत्र जप्त करू शकत वा संपादकाला तुरुंगात टाकू शकत, पण तो श्रोतृवर्ग अ-घडवू शकत नव्हती — आणि मार्ग बंद करण्याचा प्रत्येक प्रयत्न स्वतःच त्याच मार्गातून प्रवास करणारी बातमी बनत असे. (चुकीची उत्तरे सरकारला भाषेबद्दल असा विश्वास चिकटवतात जो तिने कधी बाळगला नाही — कायदा नेमके यासाठी आहे की भारतीय भाषा राजकारण फार चांगले व्यक्त करत होत्या — कायद्यात लिहिलेली सूट नाकारतात, वा अशा यशाचा दावा करतात ज्याचे खंडन पुढच्या दशकांतील बहरलेला राष्ट्रवादी प्रेस करतो.)",
        },
      },
    ],
  },
];
