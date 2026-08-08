/**
 * Class 4 EVS — NCERT "Looking Around", chapter by chapter, through the
 * conceptual engine. Same authoring voice as Class 3: short, concrete,
 * read-aloud prompts about things a nine-year-old has seen or can picture.
 * Same distractor rule as everywhere — every statement must be false of
 * every other entity in its chapter.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Looking Around (Class 4)";
const LICENCE = "CC-BY-SA-4.0";

export const G4_EVS: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Going to School (how children reach school across India)    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-4-going-to-school",
    subject: "EVS",
    classLevel: 4,
    chapter: {
      en: "Chapter 1 — Going to School",
      hi: "अध्याय 1 — स्कूल चलें",
      mr: "प्रकरण 1 — शाळेला जाताना",
    },
    name: { en: "Going to School", hi: "स्कूल चलें", mr: "शाळेला जाताना" },
    summary: {
      en: "Bamboo bridges, rope trolleys, camel carts and boats — the many roads, and no-roads, children cross to reach school.",
      hi: "बाँस के पुल, रस्सी की ट्रॉलियाँ, ऊँट-गाड़ियाँ और नावें — कितने रास्तों, और बे-रास्तों, से बच्चे स्कूल पहुँचते हैं।",
      mr: "बांबूचे पूल, दोरीच्या ट्रॉल्या, उंटगाड्या आणि होड्या — किती वाटांनी, आणि वाट नसतानाही, मुले शाळा गाठतात.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "bamboobridge",
        name: { en: "The bamboo bridge", hi: "बाँस का पुल", mr: "बांबूचा पूल" },
        kind: "crossing",
        prompt: {
          en: "In Assam, children cross swollen streams on a narrow bridge of poles tied together, holding a thin railing. What is it made of?",
          hi: "असम में बच्चे बँधे हुए डंडों के सँकरे पुल पर, पतली रेलिंग थामे, उफनती धाराएँ पार करते हैं। वह पुल किस चीज़ का है?",
          mr: "आसाममध्ये मुले बांधलेल्या काठ्यांच्या अरुंद पुलावरून, बारीक कठडा धरून, फुगलेले ओहळ ओलांडतात. तो पूल कशाचा असतो?",
        },
        statement: {
          en: "The bamboo bridge is a line of tied bamboo poles with a thin railing, laid over a stream.",
          hi: "बाँस का पुल बँधे बाँसों की एक क़तार है, पतली रेलिंग के साथ, धारा के ऊपर बिछा हुआ।",
          mr: "बांबूचा पूल म्हणजे बांधलेल्या बांबूंची रांग, बारीक कठड्यासह, ओहळावर टाकलेली.",
        },
        detail: {
          en: "It is rebuilt every year, because the rains carry the old one away.",
          hi: "उसे हर साल फिर से बाँधना पड़ता है, क्योंकि बारिश पुराने को बहा ले जाती है।",
          mr: "तो दरवर्षी पुन्हा बांधावा लागतो, कारण पाऊस जुना वाहून नेतो.",
        },
        extra: {
          en: "Walking it needs slow, careful steps — one child at a time, eyes on the poles.",
          hi: "उस पर चलने के लिए धीमे, सधे क़दम चाहिए — एक बार में एक बच्चा, नज़र डंडों पर।",
          mr: "त्यावर चालायला सावकाश, सावध पावले लागतात — एका वेळी एक मूल, नजर काठ्यांवर.",
        },
        pair: {
          left: { en: "The bamboo bridge", hi: "बाँस का पुल", mr: "बांबूचा पूल" },
          right: { en: "a stream in Assam", hi: "असम की धारा", mr: "आसामचा ओहळ" },
        },
      },
      {
        id: "trolley",
        name: { en: "The rope trolley", hi: "रस्सी की ट्रॉली", mr: "दोरीची ट्रॉली" },
        kind: "crossing",
        prompt: {
          en: "Where a river is too wide to bridge, children sit in a hanging box pulled across on a thick rope. What is this crossing called?",
          hi: "जहाँ नदी पुल के लिए बहुत चौड़ी है, वहाँ बच्चे लटकते बक्से में बैठते हैं जो मोटी रस्सी पर खींचा जाता है। इस पार-उतार को क्या कहते हैं?",
          mr: "जिथे नदी पुलासाठी फार रुंद आहे, तिथे मुले टांगत्या पेटीत बसतात, जी जाड दोरीवरून ओढली जाते. या पार जाण्याला काय म्हणतात?",
        },
        statement: {
          en: "The rope trolley is a hanging box that slides along a thick rope stretched over the river, pulled hand over hand.",
          hi: "रस्सी की ट्रॉली नदी पर तनी मोटी रस्सी पर सरकता लटकता बक्सा है, जो हाथों-हाथ खींचा जाता है।",
          mr: "दोरीची ट्रॉली म्हणजे नदीवर ताणलेल्या जाड दोरीवरून सरकणारी टांगती पेटी, जी हाताने ओढली जाते.",
        },
        pair: {
          left: { en: "The rope trolley", hi: "रस्सी की ट्रॉली", mr: "दोरीची ट्रॉली" },
          right: {
            en: "a river too wide to bridge",
            hi: "पुल से न बँधने वाली चौड़ी नदी",
            mr: "पुलात न मावणारी रुंद नदी",
          },
        },
      },
      {
        id: "camelcart",
        name: { en: "The camel cart", hi: "ऊँट-गाड़ी", mr: "उंटगाडी" },
        kind: "ride",
        prompt: {
          en: "In Rajasthan's desert, which animal pulls the school cart over sand where cycle tyres would sink?",
          hi: "राजस्थान के रेगिस्तान में कौन-सा पशु स्कूल-गाड़ी को उस रेत पर खींचता है जहाँ साइकिल के पहिए धँस जाते?",
          mr: "राजस्थानच्या वाळवंटात कोणता प्राणी शाळेची गाडी त्या वाळूवरून ओढतो जिथे सायकलची चाके रुतली असती?",
        },
        statement: {
          en: "In the desert a camel pulls the cart to school — its wide feet walk on sand without sinking.",
          hi: "रेगिस्तान में ऊँट गाड़ी को स्कूल तक खींचता है — उसके चौड़े पैर रेत पर बिना धँसे चलते हैं।",
          mr: "वाळवंटात उंट गाडी शाळेपर्यंत ओढतो — त्याचे रुंद पाय वाळूवर न रुतता चालतात.",
        },
        detail: {
          en: "Its wide, padded feet press the sand gently, the way a flat slipper does not sink where a heel would.",
          hi: "उसके चौड़े गद्देदार पैर रेत को हलके से दबाते हैं — जैसे चपटी चप्पल वहाँ नहीं धँसती जहाँ एड़ी धँस जाए।",
          mr: "त्याचे रुंद, गादीदार पाय वाळू हलकेच दाबतात — जशी सपाट चप्पल तिथे रुतत नाही जिथे टाच रुतेल.",
        },
        extra: {
          en: "It can go a long way in the heat without drinking water.",
          hi: "वह गरमी में बिना पानी पिए दूर तक जा सकता है।",
          mr: "तो उन्हात पाणी न पिता दूरवर जाऊ शकतो.",
        },
        pair: {
          left: { en: "The camel cart", hi: "ऊँट-गाड़ी", mr: "उंटगाडी" },
          right: { en: "the desert sand", hi: "रेगिस्तान की रेत", mr: "वाळवंटाची वाळू" },
        },
      },
      {
        id: "vallam",
        name: { en: "The vallam (small boat)", hi: "वल्लम (छोटी नाव)", mr: "वल्लम (छोटी होडी)" },
        kind: "ride",
        prompt: {
          en: "In Kerala's backwaters, some children row to school in a small wooden boat. What is it called there?",
          hi: "केरल के पश्च-जल में कुछ बच्चे छोटी लकड़ी की नाव खेकर स्कूल जाते हैं। उसे वहाँ क्या कहते हैं?",
          mr: "केरळच्या कायलांमध्ये काही मुले छोट्या लाकडी होडीने वल्हवत शाळेला जातात. तिला तिथे काय म्हणतात?",
        },
        statement: {
          en: "The vallam is Kerala's small wooden rowing boat, and some children reach school in one, over water.",
          hi: "वल्लम केरल की छोटी लकड़ी की खेने वाली नाव है, और कुछ बच्चे उसी से पानी पार कर स्कूल पहुँचते हैं।",
          mr: "वल्लम ही केरळची छोटी लाकडी वल्ह्याची होडी आहे, आणि काही मुले तिच्यानेच पाण्यावरून शाळा गाठतात.",
        },
        pair: {
          left: { en: "The vallam", hi: "वल्लम", mr: "वल्लम" },
          right: { en: "Kerala's backwaters", hi: "केरल का पश्च-जल", mr: "केरळची कायले" },
        },
      },
      {
        id: "jugad",
        name: { en: "The jugad", hi: "जुगाड़", mr: "जुगाड" },
        kind: "ride",
        prompt: {
          en: "Which home-made village vehicle — a cart body on a pump-engine and old jeep wheels — packs in many children at once?",
          hi: "कौन-सी घर-बनी देहाती सवारी — पंप के इंजन और पुराने जीप-पहियों पर गाड़ी का ढाँचा — एक साथ कई बच्चों को भर लेती है?",
          mr: "कोणते घरगुती बनावटीचे गावठी वाहन — पंपाच्या इंजिनावर आणि जुन्या जीपच्या चाकांवर गाडीचा सांगाडा — एकदम पुष्कळ मुले भरून घेते?",
        },
        statement: {
          en: "The jugad is joined together from a pump engine, wooden planks and old wheels, and carries many children at once.",
          hi: "जुगाड़ पंप के इंजन, लकड़ी के पटरों और पुराने पहियों को जोड़कर बनता है, और एक साथ कई बच्चों को ले जाता है।",
          mr: "जुगाड पंपाचे इंजिन, लाकडी फळ्या आणि जुनी चाके जोडून बनते, आणि एकदम पुष्कळ मुले नेते.",
        },
        pair: {
          left: { en: "The jugad", hi: "जुगाड़", mr: "जुगाड" },
          right: {
            en: "odd parts joined cleverly",
            hi: "चतुराई से जुड़े अलग-अलग पुर्ज़े",
            mr: "चतुराईने जोडलेले सुटे भाग",
          },
        },
      },
      {
        id: "bicycle",
        name: { en: "The bicycle ride", hi: "साइकिल-सवारी", mr: "सायकल-स्वारी" },
        kind: "ride",
        prompt: {
          en: "Many children pedal to school, sometimes a younger one sitting behind. Which ride is this?",
          hi: "बहुत-से बच्चे पैडल मारकर स्कूल जाते हैं, कभी पीछे कोई छोटा बैठा होता है। यह कौन-सी सवारी है?",
          mr: "पुष्कळ मुले पॅडल मारत शाळेला जातात, कधी मागे एखादे धाकटे बसलेले असते. ही कोणती स्वारी?",
        },
        statement: {
          en: "The bicycle takes many children to school on their own leg-power, often with a sibling on the carrier.",
          hi: "साइकिल कई बच्चों को उनकी अपनी टाँगों के ज़ोर पर स्कूल ले जाती है, अक्सर कैरियर पर कोई भाई-बहन।",
          mr: "सायकल पुष्कळ मुलांना त्यांच्या स्वतःच्या पायांच्या जोरावर शाळेला नेते, अनेकदा कॅरियरवर एखादे भावंड.",
        },
      },
      {
        id: "walking",
        name: { en: "Walking to school", hi: "पैदल स्कूल जाना", mr: "चालत शाळेला जाणे" },
        kind: "ride",
        prompt: {
          en: "Most children in India reach school by the oldest way of all — no wheels, no animal, no boat. Which way is that?",
          hi: "भारत के ज़्यादातर बच्चे स्कूल सबसे पुराने तरीक़े से पहुँचते हैं — न पहिया, न पशु, न नाव। वह कौन-सा तरीक़ा है?",
          mr: "भारतातली बहुतेक मुले शाळेत सर्वांत जुन्या मार्गाने पोहोचतात — चाक नाही, प्राणी नाही, होडी नाही. तो कोणता मार्ग?",
        },
        statement: {
          en: "Most children simply walk to school — through fields, lanes and rocky paths, in groups with friends.",
          hi: "ज़्यादातर बच्चे स्कूल बस पैदल जाते हैं — खेतों, गलियों और पथरीली पगडंडियों से, दोस्तों की टोली में।",
          mr: "बहुतेक मुले शाळेला नुसती चालत जातात — शेतांतून, गल्ल्यांतून आणि खडकाळ वाटांतून, मित्रांच्या घोळक्याने.",
        },
      },
      {
        id: "bullockcartride",
        name: { en: "The bullock-cart ride", hi: "बैलगाड़ी की सवारी", mr: "बैलगाडीची स्वारी" },
        kind: "ride",
        prompt: {
          en: "In some villages children ride to school sitting in the back of a slow farm cart. Which animal pulls it?",
          hi: "कुछ गाँवों में बच्चे खेती की धीमी गाड़ी में पीछे बैठकर स्कूल जाते हैं। उसे कौन-सा पशु खींचता है?",
          mr: "काही गावांत मुले शेतीच्या सावकाश गाडीत मागे बसून शाळेला जातात. तिला कोणता प्राणी ओढतो?",
        },
        statement: {
          en: "In villages a bullock cart sometimes carries children to school, slow and swaying over the mud road.",
          hi: "गाँवों में कभी-कभी बैलगाड़ी बच्चों को स्कूल ले जाती है — धीमी, कच्ची सड़क पर डोलती हुई।",
          mr: "गावांत कधी कधी बैलगाडी मुलांना शाळेला नेते — सावकाश, कच्च्या रस्त्यावर झुलत.",
        },
        decoys: [
          { en: "The horse tonga", hi: "घोड़े का ताँगा", mr: "घोड्याचा टांगा" },
        ],
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort these school-ways into OVER WATER and OVER LAND: the vallam, the camel cart, the rope trolley, the jugad. Which sorting is right?",
          hi: "इन स्कूल-रास्तों को पानी के ऊपर और ज़मीन पर में छाँटिए: वल्लम, ऊँट-गाड़ी, रस्सी की ट्रॉली, जुगाड़। कौन-सी छँटाई सही है?",
          mr: "या शाळा-वाटांची पाण्यावरून आणि जमिनीवरून अशी वर्गवारी करा: वल्लम, उंटगाडी, दोरीची ट्रॉली, जुगाड. कोणती वर्गवारी बरोबर?",
        },
        choices: [
          {
            en: "Over water: vallam, rope trolley · Over land: camel cart, jugad",
            hi: "पानी के ऊपर: वल्लम, रस्सी की ट्रॉली · ज़मीन पर: ऊँट-गाड़ी, जुगाड़",
            mr: "पाण्यावरून: वल्लम, दोरीची ट्रॉली · जमिनीवरून: उंटगाडी, जुगाड",
          },
          {
            en: "Over water: camel cart, vallam · Over land: rope trolley, jugad",
            hi: "पानी के ऊपर: ऊँट-गाड़ी, वल्लम · ज़मीन पर: रस्सी की ट्रॉली, जुगाड़",
            mr: "पाण्यावरून: उंटगाडी, वल्लम · जमिनीवरून: दोरीची ट्रॉली, जुगाड",
          },
          {
            en: "Over water: jugad, rope trolley · Over land: camel cart, vallam",
            hi: "पानी के ऊपर: जुगाड़, रस्सी की ट्रॉली · ज़मीन पर: ऊँट-गाड़ी, वल्लम",
            mr: "पाण्यावरून: जुगाड, दोरीची ट्रॉली · जमिनीवरून: उंटगाडी, वल्लम",
          },
          {
            en: "Over water: vallam, jugad · Over land: camel cart, rope trolley",
            hi: "पानी के ऊपर: वल्लम, जुगाड़ · ज़मीन पर: ऊँट-गाड़ी, रस्सी की ट्रॉली",
            mr: "पाण्यावरून: वल्लम, जुगाड · जमिनीवरून: उंटगाडी, दोरीची ट्रॉली",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The vallam floats ON water and the trolley hangs ABOVE it on a rope — both are water-crossings. The camel walks sand and the jugad rolls on wheels — land, both. The trolley is the tricky one: it never touches the river, yet the river is exactly what it exists to cross.",
          hi: "वल्लम पानी पर तैरता है और ट्रॉली रस्सी पर पानी के ऊपर लटकती है — दोनों पानी की पार-उतार हैं। ऊँट रेत पर चलता है और जुगाड़ पहियों पर — दोनों ज़मीन। ट्रॉली ही पेचीदा है: वह नदी को छूती तक नहीं, फिर भी नदी पार कराना ही उसका काम है।",
          mr: "वल्लम पाण्यावर तरंगते आणि ट्रॉली दोरीवर पाण्याच्या वर लटकते — दोन्ही पाण्याची पार-उतार. उंट वाळूवर चालतो आणि जुगाड चाकांवर — दोन्ही जमीन. ट्रॉलीच अवघड आहे: ती नदीला शिवतही नाही, तरी नदी ओलांडणे हेच तिचे काम.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Why does the desert school-cart use a camel while the backwater children use a vallam — what really decides which 'school bus' a place gets?",
          hi: "रेगिस्तान की स्कूल-गाड़ी में ऊँट क्यों और पश्च-जल के बच्चों के पास वल्लम क्यों — असल में कौन तय करता है कि किस जगह को कौन-सी 'स्कूल बस' मिलेगी?",
          mr: "वाळवंटातल्या शाळा-गाडीला उंट का आणि कायलांतल्या मुलांकडे वल्लम का — खरे तर कोण ठरवते की कोणत्या जागेला कोणती 'शाळेची बस' मिळेल?",
        },
        choices: [
          {
            en: "The land and water of the place decide — each ride fits what lies between home and school",
            hi: "उस जगह की ज़मीन और पानी तय करते हैं — हर सवारी वही बैठती है जो घर और स्कूल के बीच बिछा है",
            mr: "त्या जागेची जमीन आणि पाणी ठरवतात — घर आणि शाळा यांच्यामध्ये जे पसरले आहे त्याला जुळणारी स्वारी",
          },
          {
            en: "Children pick whichever ride looks the most fun",
            hi: "बच्चे वही सवारी चुनते हैं जो सबसे मज़ेदार दिखे",
            mr: "मुले सर्वांत मजेशीर दिसणारी स्वारी निवडतात",
          },
          {
            en: "The government sends camels to some schools and boats to others by lottery",
            hi: "सरकार लॉटरी से कुछ स्कूलों को ऊँट और कुछ को नावें भेजती है",
            mr: "सरकार लॉटरीने काही शाळांना उंट आणि काहींना होड्या पाठवते",
          },
          {
            en: "Camels and boats cost the same, so places just take turns",
            hi: "ऊँट और नाव का ख़र्च बराबर है, इसलिए जगहें बारी-बारी लेती हैं",
            mr: "उंट आणि होडीचा खर्च सारखा आहे, म्हणून जागा आळीपाळीने घेतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Between home and school lies sand in one place and water in another — and sand asks for wide camel feet just as water asks for a hull that floats. People everywhere solved the same problem with whatever their land offered: that is why the chapter shows twenty rides and one single idea.",
          hi: "घर और स्कूल के बीच कहीं रेत बिछी है, कहीं पानी — और रेत ऊँट के चौड़े पैर माँगती है, जैसे पानी तैरने वाला पेंदा। हर जगह के लोगों ने एक ही सवाल अपनी-अपनी ज़मीन की दी हुई चीज़ों से हल किया: इसीलिए अध्याय में सवारियाँ बीस हैं और विचार एक।",
          mr: "घर आणि शाळेच्या मध्ये कुठे वाळू पसरली आहे, कुठे पाणी — आणि वाळू उंटाचे रुंद पाय मागते, तसे पाणी तरंगणारा तळ मागते. प्रत्येक जागच्या माणसांनी एकच प्रश्न आपापल्या जमिनीने दिलेल्या गोष्टींनी सोडवला: म्हणूनच धड्यात स्वाऱ्या वीस आणि विचार एक.",
        },
      },
      {
        level: 6,
        stem: {
          en: "In the rains, the stream under the bamboo bridge swells and the poles turn slippery. What should the children crossing it do — and why is that the right choice?",
          hi: "बारिश में बाँस के पुल के नीचे की धारा उफन आती है और डंडे फिसलने लगते हैं। पार करते बच्चों को क्या करना चाहिए — और वही सही क्यों है?",
          mr: "पावसात बांबूच्या पुलाखालचा ओहळ फुगतो आणि काठ्या निसरड्या होतात. ओलांडणाऱ्या मुलांनी काय करावे — आणि तेच बरोबर का?",
        },
        choices: [
          {
            en: "Cross one at a time, slowly, holding the railing — a careful crossing is slower but reaches the other side",
            hi: "एक-एक करके, धीरे-धीरे, रेलिंग थामकर पार करें — सधी पार-उतार धीमी है पर उस पार पहुँचती है",
            mr: "एकेक करून, सावकाश, कठडा धरून ओलांडावे — सावध पार-उतार हळू असते पण पलीकडे पोहोचते",
          },
          {
            en: "Run across fast so less time is spent on the slippery poles",
            hi: "तेज़ दौड़कर पार करें ताकि फिसलन भरे डंडों पर कम समय लगे",
            mr: "निसरड्या काठ्यांवर कमी वेळ जावा म्हणून धावत ओलांडावे",
          },
          {
            en: "Cross in a big group together, holding each other",
            hi: "बड़ी टोली में एक-दूसरे को थामे साथ-साथ पार करें",
            mr: "मोठ्या घोळक्याने एकमेकांना धरून एकत्र ओलांडावे",
          },
          {
            en: "Jump into the stream and swim, since the bridge is wet anyway",
            hi: "धारा में कूदकर तैर जाएँ, पुल तो वैसे भी गीला है",
            mr: "ओहळात उडी मारून पोहावे, पूल तसाही ओला आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Running multiplies the chance of slipping exactly where slipping is most dangerous, and a crowd makes the poles bend and shake under shared weight. One child at a time, slow steps, hands on the railing — the bridge was built for that pace, and a swollen stream is nothing to swim in. Speed saves minutes; care saves the child.",
          hi: "दौड़ना फिसलने का ख़तरा ठीक वहीं कई गुना कर देता है जहाँ फिसलना सबसे ख़तरनाक है, और भीड़ के साझे वज़न से डंडे झुकते-काँपते हैं। एक बार में एक बच्चा, धीमे क़दम, रेलिंग पर हाथ — पुल इसी चाल के लिए बँधा है, और उफनती धारा तैरने की चीज़ नहीं। तेज़ी मिनट बचाती है; सावधानी बच्चा।",
          mr: "धावण्याने घसरण्याची शक्यता नेमकी तिथे कैक पटींनी वाढते जिथे घसरणे सर्वांत धोक्याचे, आणि घोळक्याच्या एकत्र वजनाने काठ्या वाकतात-कापतात. एका वेळी एक मूल, सावकाश पावले, कठड्यावर हात — पूल त्याच चालीसाठी बांधला आहे, आणि फुगलेला ओहळ पोहण्याची गोष्ट नव्हे. वेग मिनिटे वाचवतो; काळजी मूल वाचवते.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — A Day with Nandu (the elephant herd)                        */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-4-a-day-with-nandu",
    subject: "EVS",
    classLevel: 4,
    chapter: {
      en: "Chapter 3 — A Day with Nandu",
      hi: "अध्याय 3 — नंदू के साथ एक दिन",
      mr: "प्रकरण 3 — नंदूसोबत एक दिवस",
    },
    name: { en: "A Day with Nandu", hi: "नंदू के साथ एक दिन", mr: "नंदूसोबत एक दिवस" },
    summary: {
      en: "Baby elephant Nandu's day with the herd — who leads, what a trunk can do, mud baths, flapping ears and a family of aunts.",
      hi: "हाथी के बच्चे नंदू का झुंड के साथ दिन — कौन आगे चलता है, सूँड़ क्या-क्या करती है, कीचड़-स्नान, फड़फड़ाते कान और मौसियों का परिवार।",
      mr: "हत्तीचे पिल्लू नंदूचा कळपासोबतचा दिवस — पुढे कोण चालते, सोंड काय काय करते, चिखल-स्नान, फडफडणारे कान आणि मावश्यांचे कुटुंब.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "matriarch",
        name: {
          en: "The oldest female elephant",
          hi: "सबसे बुज़ुर्ग हथिनी",
          mr: "सर्वांत वयस्क हत्तीण",
        },
        kind: "herd-life",
        prompt: {
          en: "Who leads an elephant herd on its long walks to food and water?",
          hi: "हाथियों के झुंड को चारे और पानी की लंबी यात्राओं पर कौन आगे-आगे ले चलता है?",
          mr: "हत्तींच्या कळपाला चारा आणि पाण्याच्या लांब वाटचालींवर कोण पुढे नेते?",
        },
        statement: {
          en: "An elephant herd is led by its oldest female — she decides where the herd walks and rests.",
          hi: "हाथियों के झुंड की अगुवाई सबसे बुज़ुर्ग हथिनी करती है — कहाँ चलना, कहाँ ठहरना, वही तय करती है।",
          mr: "हत्तींच्या कळपाचे नेतृत्व सर्वांत वयस्क हत्तीण करते — कुठे चालायचे, कुठे थांबायचे, तीच ठरवते.",
        },
        detail: {
          en: "She remembers the far-off water holes from years of walking — the herd trusts her memory.",
          hi: "बरसों की यात्राओं से उसे दूर-दराज़ के पानी के ठिकाने याद हैं — झुंड उसकी याददाश्त पर भरोसा करता है।",
          mr: "वर्षानुवर्षांच्या वाटचालींतून तिला दूरदूरची पाणवठे आठवतात — कळप तिच्या स्मरणशक्तीवर विसंबतो.",
        },
        extra: {
          en: "The herd around her is mostly mothers, aunts and calves.",
          hi: "उसके इर्द-गिर्द का झुंड ज़्यादातर माँओं, मौसियों और बच्चों का है।",
          mr: "तिच्याभोवतीचा कळप बहुतेक आया, मावश्या आणि पिल्लांचा असतो.",
        },
        pair: {
          left: { en: "The elephant herd", hi: "हाथियों का झुंड", mr: "हत्तींचा कळप" },
          right: {
            en: "led by the oldest female",
            hi: "सबसे बुज़ुर्ग हथिनी की अगुवाई",
            mr: "सर्वांत वयस्क हत्तिणीचे नेतृत्व",
          },
        },
      },
      {
        id: "trunk",
        name: { en: "The trunk", hi: "सूँड़", mr: "सोंड" },
        kind: "elephant-body",
        prompt: {
          en: "Which one part of the elephant is nose and hand together — smelling, plucking leaves, spraying water?",
          hi: "हाथी का कौन-सा एक अंग नाक और हाथ दोनों है — सूँघता भी है, पत्ते भी तोड़ता है, पानी भी उड़ेलता है?",
          mr: "हत्तीचा कोणता एक अवयव नाक आणि हात दोन्ही आहे — हुंगतो, पाने तोडतो, पाणीही उडवतो?",
        },
        statement: {
          en: "The trunk is the elephant's nose and hand in one — it smells, plucks leaves, lifts logs and sprays water.",
          hi: "सूँड़ हाथी की नाक और हाथ एक साथ है — सूँघती है, पत्ते तोड़ती है, लट्ठे उठाती है, पानी उड़ेलती है।",
          mr: "सोंड म्हणजे हत्तीचे नाक आणि हात एकत्र — ती हुंगते, पाने तोडते, ओंडके उचलते, पाणी उडवते.",
        },
        pair: {
          left: { en: "The trunk", hi: "सूँड़", mr: "सोंड" },
          right: {
            en: "nose and hand in one",
            hi: "नाक और हाथ एक साथ",
            mr: "नाक आणि हात एकत्र",
          },
        },
      },
      {
        id: "appetite",
        name: {
          en: "An elephant's daily meal",
          hi: "हाथी का रोज़ का भोजन",
          mr: "हत्तीचे रोजचे खाणे",
        },
        kind: "elephant-body",
        prompt: {
          en: "A grown elephant spends most of its day eating. About how much green food does it need daily — a basketful, or more than a hundred kilos?",
          hi: "बड़ा हाथी दिन का ज़्यादातर समय खाने में बिताता है। उसे रोज़ लगभग कितना हरा चारा चाहिए — टोकरी भर, या सौ किलो से ज़्यादा?",
          mr: "मोठा हत्ती दिवसाचा बहुतेक वेळ खाण्यात घालवतो. त्याला रोज सुमारे किती हिरवा चारा लागतो — टोपलीभर, की शंभर किलोहून जास्त?",
        },
        statement: {
          en: "A grown elephant eats more than a hundred kilos of leaves and branches in a day — most of its waking hours go into eating.",
          hi: "बड़ा हाथी दिन में सौ किलो से ज़्यादा पत्ते-टहनियाँ खा जाता है — जागते घंटों का बड़ा हिस्सा खाने में ही जाता है।",
          mr: "मोठा हत्ती दिवसात शंभर किलोहून जास्त पाने-फांद्या खातो — जाग्या तासांचा मोठा भाग खाण्यातच जातो.",
        },
      },
      {
        id: "sleep",
        name: {
          en: "An elephant's short sleep",
          hi: "हाथी की छोटी नींद",
          mr: "हत्तीची छोटी झोप",
        },
        kind: "elephant-body",
        prompt: {
          en: "After a whole day of walking and eating, how long does an elephant sleep — about four hours, or twelve like us?",
          hi: "दिन भर चलने-खाने के बाद हाथी कितना सोता है — क़रीब चार घंटे, या हमारी तरह बारह?",
          mr: "दिवसभर चालून-खाऊन हत्ती किती झोपतो — सुमारे चार तास, की आपल्यासारखे बारा?",
        },
        statement: {
          en: "An elephant sleeps only about four hours, and mostly standing up.",
          hi: "हाथी क़रीब चार ही घंटे सोता है, और ज़्यादातर खड़े-खड़े।",
          mr: "हत्ती फक्त सुमारे चार तास झोपतो, आणि बहुतेक उभ्या उभ्याच.",
        },
      },
      {
        id: "mudbath",
        name: { en: "The mud bath", hi: "कीचड़-स्नान", mr: "चिखल-स्नान" },
        kind: "herd-life",
        prompt: {
          en: "After the river dip, elephants throw wet mud over their own backs. What is this muddy habit called?",
          hi: "नदी में डुबकी के बाद हाथी अपनी ही पीठ पर गीला कीचड़ उछालते हैं। इस कीचड़ भरी आदत को क्या कहते हैं?",
          mr: "नदीतल्या डुबकीनंतर हत्ती स्वतःच्याच पाठीवर ओला चिखल उडवतात. या चिखलाच्या सवयीला काय म्हणतात?",
        },
        statement: {
          en: "The mud bath coats the elephant's skin — the drying mud keeps it cool and guards against insect bites.",
          hi: "कीचड़-स्नान हाथी की खाल पर परत चढ़ाता है — सूखता कीचड़ ठंडक देता है और कीड़ों के काटने से बचाता है।",
          mr: "चिखल-स्नान हत्तीच्या कातडीवर थर चढवते — सुकणारा चिखल गारवा देतो आणि किड्यांच्या चाव्यांपासून राखतो.",
        },
        pair: {
          left: { en: "The mud bath", hi: "कीचड़-स्नान", mr: "चिखल-स्नान" },
          right: {
            en: "cool skin, no insect bites",
            hi: "ठंडी खाल, कीड़ों से बचाव",
            mr: "गार कातडी, किड्यांपासून बचाव",
          },
        },
      },
      {
        id: "ears",
        name: { en: "The big flapping ears", hi: "बड़े फड़फड़ाते कान", mr: "मोठे फडफडणारे कान" },
        kind: "elephant-body",
        prompt: {
          en: "Which part does the elephant wave like two great fans on a hot afternoon?",
          hi: "तपती दोपहर में हाथी किस अंग को दो बड़े पंखों की तरह झलता है?",
          mr: "तापल्या दुपारी हत्ती कोणता अवयव दोन मोठ्या पंख्यांसारखा हलवतो?",
        },
        statement: {
          en: "The elephant flaps its big ears like fans — the moving air cools the blood running through them.",
          hi: "हाथी अपने बड़े कान पंखों की तरह फड़फड़ाता है — बहती हवा उनमें दौड़ते ख़ून को ठंडा करती है।",
          mr: "हत्ती आपले मोठे कान पंख्यांसारखे फडफडवतो — वाहती हवा त्यांतून धावणारे रक्त थंड करते.",
        },
        pair: {
          left: { en: "The big ears", hi: "बड़े कान", mr: "मोठे कान" },
          right: { en: "fans for hot days", hi: "गरमी के पंखे", mr: "उन्हाळ्याचे पंखे" },
        },
      },
      {
        id: "calf",
        name: { en: "The elephant calf", hi: "हाथी का बच्चा", mr: "हत्तीचे पिल्लू" },
        kind: "herd-life",
        prompt: {
          en: "Who walks in the safe middle of the herd, close to mother and aunts, still learning to use its trunk?",
          hi: "झुंड के सुरक्षित बीच में, माँ और मौसियों से सटकर, कौन चलता है — जो अभी सूँड़ चलाना सीख ही रहा है?",
          mr: "कळपाच्या सुरक्षित मधोमध, आई आणि मावश्यांना बिलगून, कोण चालते — ज्याला अजून सोंड वापरायला शिकायचे आहे?",
        },
        statement: {
          en: "The calf walks in the middle of the herd, guarded by mother and aunts, and practises using its wobbly trunk.",
          hi: "बच्चा झुंड के बीच में चलता है, माँ और मौसियों की निगरानी में, और अपनी लड़खड़ाती सूँड़ चलाने का अभ्यास करता है।",
          mr: "पिल्लू कळपाच्या मध्ये चालते, आई आणि मावश्यांच्या राखणीत, आणि आपली डगमगती सोंड वापरण्याचा सराव करते.",
        },
      },
      {
        id: "youngmales",
        name: {
          en: "The young male elephants",
          hi: "जवान नर हाथी",
          mr: "तरुण नर हत्ती",
        },
        kind: "herd-life",
        prompt: {
          en: "Who leaves the herd at fourteen or fifteen years of age, to wander alone or with other males?",
          hi: "चौदह-पंद्रह की उम्र में झुंड छोड़कर कौन चला जाता है — अकेले या दूसरे नरों के साथ घूमने?",
          mr: "चौदा-पंधराव्या वर्षी कळप सोडून कोण निघून जाते — एकटे किंवा इतर नरांसोबत फिरायला?",
        },
        statement: {
          en: "Young male elephants leave the herd at about fourteen or fifteen and roam alone or with other males.",
          hi: "जवान नर हाथी क़रीब चौदह-पंद्रह की उम्र में झुंड छोड़ देते हैं और अकेले या दूसरे नरों के साथ घूमते हैं।",
          mr: "तरुण नर हत्ती सुमारे चौदा-पंधराव्या वर्षी कळप सोडतात आणि एकटे किंवा इतर नरांसोबत फिरतात.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the elephant's numbers: A-hours of sleep, B-kilos of food a day, C-age when young males leave the herd. Which trio is right?",
          hi: "हाथी के आँकड़े मिलाइए: अ-नींद के घंटे, ब-दिन भर के भोजन के किलो, स-उम्र जब नर झुंड छोड़ते हैं। कौन-सी तिकड़ी सही है?",
          mr: "हत्तीचे आकडे जुळवा: अ-झोपेचे तास, ब-दिवसभराच्या खाण्याचे किलो, क-नर कळप सोडतात ते वय. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: about 4 · B: more than 100 · C: about 14–15",
            hi: "अ: क़रीब 4 · ब: 100 से ज़्यादा · स: क़रीब 14–15",
            mr: "अ: सुमारे 4 · ब: 100 हून जास्त · क: सुमारे 14–15",
          },
          {
            en: "A: about 12 · B: more than 100 · C: about 4–5",
            hi: "अ: क़रीब 12 · ब: 100 से ज़्यादा · स: क़रीब 4–5",
            mr: "अ: सुमारे 12 · ब: 100 हून जास्त · क: सुमारे 4–5",
          },
          {
            en: "A: about 4 · B: about 10 · C: about 40",
            hi: "अ: क़रीब 4 · ब: क़रीब 10 · स: क़रीब 40",
            mr: "अ: सुमारे 4 · ब: सुमारे 10 · क: सुमारे 40",
          },
          {
            en: "A: about 14 · B: about 15 · C: about 100",
            hi: "अ: क़रीब 14 · ब: क़रीब 15 · स: क़रीब 100",
            mr: "अ: सुमारे 14 · ब: सुमारे 15 · क: सुमारे 100",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The elephant's day is upside-down from ours: barely 4 hours of sleep, over 100 kilos of food, and the young males walk away at 14 or 15. The last wrong option shuffles the same three numbers into the wrong slots — numbers only mean something attached to the right fact.",
          hi: "हाथी का दिन हमारे दिन का उलटा है: बमुश्किल 4 घंटे की नींद, 100 किलो से ऊपर भोजन, और नर 14-15 पर झुंड से विदा। आख़िरी ग़लत विकल्प वही तीन आँकड़े ग़लत ख़ानों में फेंट देता है — आँकड़े का अर्थ सही तथ्य से जुड़कर ही बनता है।",
          mr: "हत्तीचा दिवस आपल्या दिवसाच्या उलटा आहे: जेमतेम 4 तास झोप, 100 किलोच्या वर खाणे, आणि नर 14-15 व्या वर्षी कळपातून निरोप घेतात. शेवटचा चुकीचा पर्याय तेच तीन आकडे चुकीच्या रकान्यांत फेकतो — आकड्याला अर्थ योग्य तथ्याशी जुळूनच येतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "In dry summer the herd walks a long, hard path — yet the water hole at its end is one no young elephant has ever seen. Who knew it was there, and how?",
          hi: "सूखी गरमी में झुंड लंबा, कठिन रास्ता चलता है — पर उसके छोर का पानी का ठिकाना ऐसा है जिसे किसी जवान हाथी ने कभी नहीं देखा। वह वहाँ है, यह किसे पता था, और कैसे?",
          mr: "कोरड्या उन्हाळ्यात कळप लांब, कठीण वाट चालतो — पण तिच्या टोकाचा पाणवठा असा आहे जो कोणत्याही तरुण हत्तीने कधी पाहिलेला नाही. तो तिथे आहे हे कोणाला ठाऊक होते, आणि कसे?",
        },
        choices: [
          {
            en: "The oldest female — years of walking taught her where water hides, and the herd follows her memory",
            hi: "सबसे बुज़ुर्ग हथिनी — बरसों की यात्राओं ने उसे सिखाया कि पानी कहाँ छिपा है, और झुंड उसकी याददाश्त के पीछे चलता है",
            mr: "सर्वांत वयस्क हत्तीण — वर्षानुवर्षांच्या वाटचालींनी तिला पाणी कुठे लपले आहे ते शिकवले, आणि कळप तिच्या स्मरणामागे चालतो",
          },
          {
            en: "The calf — young eyes spot water first",
            hi: "बच्चा — जवान आँखें पानी सबसे पहले देख लेती हैं",
            mr: "पिल्लू — तरुण डोळे पाणी आधी हेरतात",
          },
          {
            en: "No one — herds wander till they stumble on water by luck",
            hi: "किसी को नहीं — झुंड भटकते हैं जब तक क़िस्मत से पानी न मिल जाए",
            mr: "कोणालाच नाही — नशिबाने पाणी सापडेपर्यंत कळप भटकतात",
          },
          {
            en: "The strongest male — strength shows the way",
            hi: "सबसे ताक़तवर नर — ताक़त रास्ता दिखाती है",
            mr: "सर्वांत बलवान नर — ताकद वाट दाखवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "This is why the LEADER is the OLDEST: leading a herd is a job of memory, not muscle. She walked this path in some hard summer long ago, and what she remembers, the whole herd drinks. The strongest male is not even there — the males left at fifteen; luck would kill a thirsty herd; and the calf has seen nothing yet — it is busy learning its own trunk.",
          hi: "इसीलिए अगुवा सबसे बुज़ुर्ग है: झुंड की अगुवाई याददाश्त का काम है, माँस-पेशियों का नहीं। किसी पुरानी कठिन गरमी में वह यह रास्ता चल चुकी है, और जो उसे याद है, वही पूरा झुंड पीता है। सबसे ताक़तवर नर वहाँ है ही नहीं — नर पंद्रह पर निकल गए; क़िस्मत के भरोसे प्यासा झुंड मर जाता; और बच्चे ने अभी देखा ही क्या है — वह तो अपनी सूँड़ सीखने में लगा है।",
          mr: "म्हणूनच नेता सर्वांत वयस्क आहे: कळपाचे नेतृत्व हे स्मरणाचे काम आहे, स्नायूंचे नव्हे. कोणत्या तरी जुन्या कठीण उन्हाळ्यात ती ही वाट चालली आहे, आणि तिला जे आठवते, तेच सारा कळप पितो. सर्वांत बलवान नर तिथे नाहीच — नर पंधराव्या वर्षी निघून गेले; नशिबाच्या भरवशावर तहानलेला कळप मेला असता; आणि पिल्लाने अजून पाहिलेच काय — ते तर आपली सोंड शिकण्यात मग्न आहे.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — The Story of Amrita (the Khejadli sacrifice)                */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-4-the-story-of-amrita",
    subject: "EVS",
    classLevel: 4,
    chapter: {
      en: "Chapter 4 — The Story of Amrita",
      hi: "अध्याय 4 — अमृता की कहानी",
      mr: "प्रकरण 4 — अमृताची गोष्ट",
    },
    name: { en: "The Story of Amrita", hi: "अमृता की कहानी", mr: "अमृताची गोष्ट" },
    summary: {
      en: "Amrita Devi, the khejadi trees and the village that hugged them — a true desert story of courage, and why the Bishnoi still protect every tree and deer.",
      hi: "अमृता देवी, खेजड़ी के पेड़ और उन्हें गले लगाने वाला गाँव — साहस की सच्ची रेगिस्तानी कहानी, और बिश्नोई आज भी हर पेड़ और हिरन की रक्षा क्यों करते हैं।",
      mr: "अमृता देवी, खेजडीची झाडे आणि त्यांना मिठी मारणारे गाव — धैर्याची खरी वाळवंटी गोष्ट, आणि बिश्नोई आजही प्रत्येक झाड आणि हरिण का राखतात.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "soldiers",
        name: { en: "The king's men", hi: "राजा के सिपाही", mr: "राजाचे शिपाई" },
        kind: "person",
        seq: 1,
        prompt: {
          en: "Who came to Amrita's village with axes, sent to cut wood for the king's new palace?",
          hi: "अमृता के गाँव में कुल्हाड़ियाँ लेकर कौन आए, जिन्हें राजा के नए महल के लिए लकड़ी काटने भेजा गया था?",
          mr: "अमृताच्या गावात कुऱ्हाडी घेऊन कोण आले, ज्यांना राजाच्या नव्या महालासाठी लाकूड तोडायला पाठवले होते?",
        },
        statement: {
          en: "The king's men came with axes to cut the village's khejadi trees for the new palace.",
          hi: "राजा के सिपाही कुल्हाड़ियाँ लेकर आए — नए महल के लिए गाँव की खेजड़ियाँ काटने।",
          mr: "राजाचे शिपाई कुऱ्हाडी घेऊन आले — नव्या महालासाठी गावच्या खेजडी तोडायला.",
        },
        pair: {
          left: { en: "The king's men", hi: "राजा के सिपाही", mr: "राजाचे शिपाई" },
          right: { en: "axes for the palace", hi: "महल के लिए कुल्हाड़ियाँ", mr: "महालासाठी कुऱ्हाडी" },
        },
      },
      {
        id: "amrita",
        name: { en: "Amrita Devi", hi: "अमृता देवी", mr: "अमृता देवी" },
        kind: "person",
        seq: 2,
        prompt: {
          en: "Who ran to the first khejadi and wrapped her arms around its trunk, telling the axemen they must cut her first?",
          hi: "कौन पहली खेजड़ी की ओर दौड़ी और उसके तने से लिपट गई — कुल्हाड़ी वालों से कहती हुई कि पहले उसे काटना होगा?",
          mr: "कोण पहिल्या खेजडीकडे धावली आणि तिच्या खोडाला बिलगली — कुऱ्हाडवाल्यांना सांगत की आधी तिला तोडावे लागेल?",
        },
        statement: {
          en: "Amrita Devi hugged the khejadi's trunk and stood between the tree and the axes.",
          hi: "अमृता देवी खेजड़ी के तने से लिपट गईं और पेड़ तथा कुल्हाड़ियों के बीच खड़ी हो गईं।",
          mr: "अमृता देवी खेजडीच्या खोडाला बिलगल्या आणि झाड व कुऱ्हाडींच्या मध्ये उभ्या राहिल्या.",
        },
        detail: {
          en: "She said a tree's life is worth more than her own — and did not step aside.",
          hi: "उन्होंने कहा कि पेड़ का जीवन उनके अपने जीवन से बढ़कर है — और वे हटी नहीं।",
          mr: "त्या म्हणाल्या की झाडाचे जीवन आपल्या जिवाहून मोलाचे — आणि त्या बाजूला झाल्या नाहीत.",
        },
        extra: {
          en: "Her three daughters followed her to the trees beside hers.",
          hi: "उनकी तीन बेटियाँ उनके पीछे बग़ल के पेड़ों से जा लिपटीं।",
          mr: "त्यांच्या तीन मुली त्यांच्या पाठोपाठ शेजारच्या झाडांना बिलगल्या.",
        },
        pair: {
          left: { en: "Amrita Devi", hi: "अमृता देवी", mr: "अमृता देवी" },
          right: {
            en: "arms around the trunk",
            hi: "तने से लिपटी बाँहें",
            mr: "खोडाभोवती मिठी",
          },
        },
      },
      {
        id: "villagers",
        name: { en: "The villagers", hi: "गाँव के लोग", mr: "गावकरी" },
        kind: "person",
        seq: 3,
        prompt: {
          en: "When Amrita would not move, who came running from every house, each one hugging a tree of their own?",
          hi: "जब अमृता नहीं हटीं, तो हर घर से दौड़कर कौन आए — हर एक अपने-अपने पेड़ से लिपटता हुआ?",
          mr: "अमृता हटल्या नाहीत, तेव्हा प्रत्येक घरातून धावत कोण आले — प्रत्येक जण आपापल्या झाडाला बिलगत?",
        },
        statement: {
          en: "The villagers followed Amrita — from every house someone came and hugged a khejadi of their own.",
          hi: "गाँव वाले अमृता के पीछे चले — हर घर से कोई आया और अपनी-अपनी खेजड़ी से लिपट गया।",
          mr: "गावकरी अमृतांच्या मागे गेले — प्रत्येक घरातून कोणी आले आणि आपापल्या खेजडीला बिलगले.",
        },
        pair: {
          left: { en: "The villagers", hi: "गाँव के लोग", mr: "गावकरी" },
          right: {
            en: "a tree for every pair of arms",
            hi: "हर जोड़ी बाँहों के लिए एक पेड़",
            mr: "प्रत्येक मिठीसाठी एक झाड",
          },
        },
      },
      {
        id: "king",
        name: { en: "The king", hi: "राजा", mr: "राजा" },
        kind: "person",
        seq: 4,
        prompt: {
          en: "Who, on hearing what his axes had done, was filled with shame and ordered that no tree near the village be ever cut again?",
          hi: "अपनी कुल्हाड़ियों का किया सुनकर कौन शर्म से भर उठा और आदेश दिया कि गाँव के पास का कोई पेड़ फिर कभी न काटा जाए?",
          mr: "आपल्या कुऱ्हाडींनी काय केले हे ऐकून कोण शरमेने भरला आणि आज्ञा दिली की गावाजवळचे कोणतेही झाड पुन्हा कधी तोडले जाऊ नये?",
        },
        statement: {
          en: "The king, ashamed of what had been done, forbade the cutting of trees and the hunting of animals near the village for ever.",
          hi: "राजा ने, हुए पर लज्जित होकर, गाँव के पास पेड़ काटना और पशुओं का शिकार हमेशा के लिए मना कर दिया।",
          mr: "राजाने, घडल्याची लाज वाटून, गावाजवळ झाडे तोडणे आणि प्राण्यांची शिकार कायमची बंद केली.",
        },
        pair: {
          left: { en: "The king's order", hi: "राजा का आदेश", mr: "राजाची आज्ञा" },
          right: {
            en: "no tree cut, no animal hunted",
            hi: "न पेड़ कटे, न पशु का शिकार हो",
            mr: "झाड तोडायचे नाही, प्राण्याची शिकार नाही",
          },
        },
      },
      {
        id: "khejadi",
        name: { en: "The khejadi tree", hi: "खेजड़ी का पेड़", mr: "खेजडीचे झाड" },
        kind: "desert-life",
        prompt: {
          en: "Which desert tree — shade-giver, fodder-giver, alive on almost no water — was the tree the village died to save?",
          hi: "कौन-सा रेगिस्तानी पेड़ — छाया देने वाला, चारा देने वाला, लगभग बिना पानी जीने वाला — वह पेड़ था जिसे बचाने को गाँव ने प्राण दिए?",
          mr: "कोणते वाळवंटी झाड — सावली देणारे, चारा देणारे, जवळजवळ पाण्याविना जगणारे — ते झाड होते जे वाचवायला गावाने प्राण दिले?",
        },
        statement: {
          en: "The khejadi lives in the desert on very little water, and gives shade, fodder for animals and pods to eat.",
          hi: "खेजड़ी रेगिस्तान में बहुत थोड़े पानी पर जीती है, और छाया, पशुओं का चारा और खाने की फलियाँ देती है।",
          mr: "खेजडी वाळवंटात अगदी थोड्या पाण्यावर जगते, आणि सावली, जनावरांचा चारा आणि खायच्या शेंगा देते.",
        },
        detail: {
          en: "In the desert a full-grown tree is rarer and slower to replace than a building.",
          hi: "रेगिस्तान में पूरा बढ़ा पेड़ किसी इमारत से भी दुर्लभ है, और उसे लौटाना उससे भी धीमा।",
          mr: "वाळवंटात पूर्ण वाढलेले झाड इमारतीहूनही दुर्मीळ असते, आणि ते परत उभे करणे त्याहून सावकाश.",
        },
        extra: {
          en: "Its deep roots find water far under the sand.",
          hi: "उसकी गहरी जड़ें रेत के बहुत नीचे का पानी खोज लेती हैं।",
          mr: "तिची खोल मुळे वाळूच्या खूप खालचे पाणी शोधतात.",
        },
      },
      {
        id: "bishnoi",
        name: { en: "The Bishnoi", hi: "बिश्नोई", mr: "बिश्नोई" },
        kind: "desert-life",
        prompt: {
          en: "Which community, to this day, guards trees and lets deer graze fearlessly beside its homes — keeping Amrita's promise alive?",
          hi: "कौन-सा समुदाय आज भी पेड़ों की रखवाली करता है और हिरनों को अपने घरों के पास निडर चरने देता है — अमृता का वचन जीवित रखता हुआ?",
          mr: "कोणता समाज आजही झाडे राखतो आणि हरणांना आपल्या घरांशेजारी निर्धास्त चरू देतो — अमृताचे वचन जिवंत ठेवत?",
        },
        statement: {
          en: "The Bishnoi community still protects trees and animals — deer graze without fear near Bishnoi homes.",
          hi: "बिश्नोई समुदाय आज भी पेड़ों और पशुओं की रक्षा करता है — बिश्नोई घरों के पास हिरन निडर चरते हैं।",
          mr: "बिश्नोई समाज आजही झाडे आणि प्राणी राखतो — बिश्नोई घरांजवळ हरणे निर्धास्त चरतात.",
        },
        pair: {
          left: { en: "The Bishnoi", hi: "बिश्नोई", mr: "बिश्नोई" },
          right: {
            en: "guardians of trees and deer",
            hi: "पेड़ों और हिरनों के रखवाले",
            mr: "झाडांचे आणि हरणांचे राखणदार",
          },
        },
      },
      {
        id: "desertwater",
        name: {
          en: "Water in the desert",
          hi: "रेगिस्तान का पानी",
          mr: "वाळवंटातले पाणी",
        },
        kind: "desert-life",
        prompt: {
          en: "What is so scarce in Amrita's land that every tree which finds it becomes precious beyond price?",
          hi: "अमृता की धरती में क्या इतना दुर्लभ है कि उसे खोज लेने वाला हर पेड़ अनमोल हो जाता है?",
          mr: "अमृताच्या भूमीत काय इतके दुर्मीळ आहे की ते शोधणारे प्रत्येक झाड अनमोल ठरते?",
        },
        statement: {
          en: "Water is the desert's rarest treasure — rain is little, wells are deep, and nothing green grows easily.",
          hi: "पानी रेगिस्तान का सबसे दुर्लभ ख़ज़ाना है — बारिश थोड़ी, कुएँ गहरे, और कोई हरियाली आसानी से नहीं उगती।",
          mr: "पाणी हा वाळवंटाचा सर्वांत दुर्मीळ ठेवा — पाऊस थोडा, विहिरी खोल, आणि हिरवे काही सहज उगवत नाही.",
        },
      },
    ],
    hard: [
      {
        level: 6,
        stem: {
          en: "The king wanted wood for a palace; the village gave lives for trees. Why were trees worth THAT much to them — and not to the king, who had never lived in the desert?",
          hi: "राजा को महल के लिए लकड़ी चाहिए थी; गाँव ने पेड़ों के लिए प्राण दिए। पेड़ उनके लिए इतने अनमोल क्यों थे — और उस राजा के लिए नहीं, जो कभी रेगिस्तान में रहा ही नहीं?",
          mr: "राजाला महालासाठी लाकूड हवे होते; गावाने झाडांसाठी प्राण दिले. झाडे त्यांच्यासाठी इतकी मोलाची का — आणि कधी वाळवंटात न राहिलेल्या राजासाठी का नाही?",
        },
        choices: [
          {
            en: "In the desert the khejadi is shade, fodder and food where almost nothing else grows — the village knew a palace can be rebuilt, but a desert tree takes a lifetime",
            hi: "रेगिस्तान में खेजड़ी वहाँ छाया, चारा और भोजन है जहाँ और कुछ नहीं उगता — गाँव जानता था कि महल फिर बन सकता है, पर रेगिस्तानी पेड़ को एक उम्र लगती है",
            mr: "वाळवंटात खेजडी म्हणजे सावली, चारा आणि अन्न — जिथे दुसरे जवळजवळ काहीच उगवत नाही. गावाला ठाऊक होते की महाल पुन्हा बांधता येतो, पण वाळवंटी झाडाला अख्खे आयुष्य लागते",
          },
          {
            en: "The villagers disliked the king and wanted to stop his palace",
            hi: "गाँव वालों को राजा नापसंद था और वे उसका महल रुकवाना चाहते थे",
            mr: "गावकऱ्यांना राजा आवडत नव्हता आणि त्यांना त्याचा महाल थांबवायचा होता",
          },
          {
            en: "The trees were the king's, so cutting them was stealing",
            hi: "पेड़ राजा के थे, इसलिए उन्हें काटना चोरी थी",
            mr: "झाडे राजाची होती, म्हणून ती तोडणे चोरी होती",
          },
          {
            en: "The village believed wood makes weak palaces",
            hi: "गाँव मानता था कि लकड़ी के महल कमज़ोर बनते हैं",
            mr: "गावाची समजूत होती की लाकडाचे महाल कमकुवत होतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The answer lives in the desert itself: where rain is a rumour, a grown khejadi is shade for people, fodder for cattle, pods for the pot — a living well the sand took a lifetime to raise. The king, who had never been thirsty under that sun, priced the trees as timber; the village priced them as life. That is why the story ends with HIS shame, not theirs.",
          hi: "उत्तर रेगिस्तान में ही बसा है: जहाँ बारिश एक अफ़वाह है, वहाँ बढ़ी हुई खेजड़ी लोगों की छाया है, ढोरों का चारा, हाँडी की फलियाँ — एक जीता कुआँ जिसे रेत ने एक उम्र में उगाया। राजा ने, जो उस धूप में कभी प्यासा नहीं हुआ, पेड़ों का दाम इमारती लकड़ी में लगाया; गाँव ने जीवन में। इसीलिए कहानी उसकी लज्जा पर ख़त्म होती है, उनकी नहीं।",
          mr: "उत्तर वाळवंटातच वसले आहे: जिथे पाऊस ही अफवा आहे, तिथे वाढलेली खेजडी म्हणजे माणसांची सावली, गुरांचा चारा, चुलीवरच्या शेंगा — वाळूने अख्ख्या आयुष्यात वाढवलेली जिती विहीर. त्या उन्हात कधी तहानलेल्या नसलेल्या राजाने झाडांची किंमत इमारती लाकडात केली; गावाने जीवनात. म्हणूनच गोष्ट त्याच्या शरमेवर संपते, त्यांच्या नव्हे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Centuries later, people who hug trees to save forests call their work the Chipko way — 'to cling'. What did Amrita's village hand down to them?",
          hi: "सदियों बाद, जंगल बचाने को पेड़ों से लिपटने वाले अपने काम को चिपको कहते हैं। अमृता के गाँव ने उन्हें विरासत में क्या दिया?",
          mr: "शतकांनंतर, जंगल वाचवायला झाडांना बिलगणारे आपल्या कामाला चिपको म्हणतात. अमृताच्या गावाने त्यांना वारशाने काय दिले?",
        },
        choices: [
          {
            en: "The idea itself — that ordinary people standing with their arms around a tree can outlast axes and orders",
            hi: "स्वयं विचार — कि पेड़ से बाँहें लपेटे खड़े साधारण लोग कुल्हाड़ियों और हुक्मों से आगे निकल सकते हैं",
            mr: "स्वतः विचार — की झाडाभोवती मिठी घालून उभी साधी माणसे कुऱ्हाडी आणि हुकुमांनाही पुरून उरतात",
          },
          {
            en: "A law that no tree in India may be cut",
            hi: "एक क़ानून कि भारत में कोई पेड़ नहीं कटेगा",
            mr: "भारतात कोणतेही झाड तोडले जाणार नाही असा कायदा",
          },
          {
            en: "The axes the king's men left behind",
            hi: "राजा के सिपाहियों की छूटी कुल्हाड़ियाँ",
            mr: "राजाच्या शिपायांच्या राहिलेल्या कुऱ्हाडी",
          },
          {
            en: "A new kind of tree that cannot be cut",
            hi: "एक नई तरह का पेड़ जो कट ही नहीं सकता",
            mr: "तोडताच न येणारे नवे झाड",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "No law and no tool crossed the centuries — an idea did: a body placed gently between the axe and the trunk. Chipko's hill-women in the 1970s did what Amrita's village did in the desert, and it worked both times for the same reason: an axe can cut a tree, but not through a person the whole village stands behind.",
          hi: "सदियों के पार न कोई क़ानून गया, न औज़ार — एक विचार गया: कुल्हाड़ी और तने के बीच धीरे-से रखा हुआ शरीर। 1970 के दशक में चिपको की पहाड़ी स्त्रियों ने वही किया जो अमृता के गाँव ने रेगिस्तान में किया था, और दोनों बार वह एक ही कारण से सफल हुआ: कुल्हाड़ी पेड़ काट सकती है, पर उस इंसान के आर-पार नहीं जा सकती जिसके पीछे पूरा गाँव खड़ा हो।",
          mr: "शतकांपार कायदा गेला नाही, हत्यारही नाही — एक विचार गेला: कुऱ्हाड आणि खोड यांच्यामध्ये हळुवार ठेवलेले शरीर. 1970 च्या दशकात चिपकोच्या डोंगरी स्त्रियांनी तेच केले जे अमृताच्या गावाने वाळवंटात केले होते, आणि दोन्ही वेळा ते एकाच कारणाने यशस्वी झाले: कुऱ्हाड झाड तोडू शकते, पण ज्याच्या पाठीशी सारे गाव उभे आहे त्या माणसाच्या आरपार जाऊ शकत नाही.",
        },
      },
    ],
  },
];
