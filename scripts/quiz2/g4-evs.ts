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
  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Anita and the Honeybees (a girl, her bees, her school)      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-4-anita-and-the-honeybees",
    subject: "EVS",
    classLevel: 4,
    chapter: {
      en: "Chapter 5 — Anita and the Honeybees",
      hi: "अध्याय 5 — अनीता और मधुमक्खियाँ",
      mr: "प्रकरण 5 — अनीता आणि मधमाश्या",
    },
    name: { en: "Anita and the Honeybees", hi: "अनीता और मधुमक्खियाँ", mr: "अनीता आणि मधमाश्या" },
    summary: {
      en: "Anita of Bihar paid for school with honey — queen bees and workers, wooden bee boxes, litchi blossom, and a hive's whole order.",
      hi: "बिहार की अनीता ने शहद से स्कूल की फ़ीस चुकाई — रानी मक्खी और श्रमिक, लकड़ी के मधु-बक्से, लीची के फूल, और छत्ते की पूरी व्यवस्था।",
      mr: "बिहारच्या अनीताने मधातून शाळेची फी भरली — राणी माशी आणि कामकरी, लाकडी मध-पेट्या, लिचीचा मोहर, आणि पोळ्याची सारी व्यवस्था.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "anita",
        name: { en: "Anita", hi: "अनीता", mr: "अनीता" },
        kind: "person",
        prompt: {
          en: "Which girl from a Bihar village kept bee boxes and paid for her own schooling with the honey they gave?",
          hi: "बिहार के गाँव की कौन-सी लड़की ने मधु-बक्से पाले और उनके शहद से अपनी पढ़ाई का ख़र्च ख़ुद उठाया?",
          mr: "बिहारच्या खेड्यातल्या कोणत्या मुलीने मध-पेट्या पाळल्या आणि त्यांच्या मधातून आपल्या शिक्षणाचा खर्च स्वतः केला?",
        },
        statement: {
          en: "Anita kept bee boxes in her village and sold the honey to pay for her books and school.",
          hi: "अनीता ने अपने गाँव में मधु-बक्से रखे और शहद बेचकर किताबों और स्कूल का ख़र्च जुटाया।",
          mr: "अनीताने आपल्या गावात मध-पेट्या ठेवल्या आणि मध विकून पुस्तकांचा आणि शाळेचा खर्च उभा केला.",
        },
        detail: {
          en: "People stared at first — a girl doing bee-keeping was a new sight in her village.",
          hi: "पहले-पहल लोग ताकते रहे — लड़की का मधुमक्खी-पालन उसके गाँव में नई बात थी।",
          mr: "सुरुवातीला लोक बघत राहिले — मुलीने मधमाशीपालन करणे तिच्या गावात नवी गोष्ट होती.",
        },
        extra: {
          en: "She learnt the work by asking, watching and starting small, with a single box.",
          hi: "उसने यह काम पूछ-पूछकर, देख-देखकर और एक अकेले बक्से से छोटी शुरुआत करके सीखा।",
          mr: "तिने हे काम विचारून, पाहून आणि एका पेटीपासून छोटी सुरुवात करून शिकले.",
        },
        pair: {
          left: { en: "Anita", hi: "अनीता", mr: "अनीता" },
          right: {
            en: "school fees from honey",
            hi: "शहद से स्कूल की फ़ीस",
            mr: "मधातून शाळेची फी",
          },
        },
      },
      {
        id: "queen",
        name: { en: "The queen bee", hi: "रानी मक्खी", mr: "राणी माशी" },
        kind: "bee",
        prompt: {
          en: "Every hive has exactly one of her, and every egg in the hive is hers. Who is she?",
          hi: "हर छत्ते में वह ठीक एक होती है, और छत्ते का हर अंडा उसी का होता है। वह कौन है?",
          mr: "प्रत्येक पोळ्यात ती नेमकी एक असते, आणि पोळ्यातले प्रत्येक अंडे तिचेच असते. ती कोण?",
        },
        statement: {
          en: "The queen bee is one to a hive, and she alone lays all the eggs.",
          hi: "रानी मक्खी छत्ते में एक ही होती है, और सारे अंडे वही अकेली देती है।",
          mr: "राणी माशी पोळ्यात एकच असते, आणि सारी अंडी तीच एकटी घालते.",
        },
        pair: {
          left: { en: "The queen bee", hi: "रानी मक्खी", mr: "राणी माशी" },
          right: { en: "lays all the eggs", hi: "सारे अंडे देती है", mr: "सारी अंडी घालते" },
        },
      },
      {
        id: "workers",
        name: { en: "The worker bees", hi: "श्रमिक मक्खियाँ", mr: "कामकरी माश्या" },
        kind: "bee",
        prompt: {
          en: "Who flies from flower to flower all day, carrying sweet nectar home to become honey?",
          hi: "दिन भर फूल-फूल कौन उड़ती हैं, मीठा रस घर लाती हुईं, जो शहद बनेगा?",
          mr: "दिवसभर फुलाफुलांवर कोण उडतात, गोड रस घरी आणत, ज्याचा मध होईल?",
        },
        statement: {
          en: "The worker bees gather nectar from flowers and turn it into honey in the hive — they are the hive's thousands.",
          hi: "श्रमिक मक्खियाँ फूलों से रस बटोरती हैं और छत्ते में उसे शहद बनाती हैं — छत्ते की हज़ारों की गिनती वही हैं।",
          mr: "कामकरी माश्या फुलांतून रस गोळा करतात आणि पोळ्यात त्याचा मध करतात — पोळ्यातली हजारोंची संख्या त्यांचीच.",
        },
        pair: {
          left: { en: "The worker bees", hi: "श्रमिक मक्खियाँ", mr: "कामकरी माश्या" },
          right: {
            en: "nectar, flower to flower",
            hi: "फूल-फूल से रस",
            mr: "फुलाफुलांतून रस",
          },
        },
      },
      {
        id: "males",
        name: { en: "The male bees", hi: "नर मक्खियाँ", mr: "नर माश्या" },
        kind: "bee",
        prompt: {
          en: "Which bees of the hive neither gather nectar nor lay eggs?",
          hi: "छत्ते की कौन-सी मक्खियाँ न रस बटोरती हैं, न अंडे देती हैं?",
          mr: "पोळ्यातल्या कोणत्या माश्या रसही गोळा करत नाहीत, अंडीही घालत नाहीत?",
        },
        statement: {
          en: "The male bees do not gather nectar and cannot lay eggs — the hive's work rests on the queen and the workers.",
          hi: "नर मक्खियाँ रस नहीं बटोरतीं और अंडे नहीं दे सकतीं — छत्ते का काम रानी और श्रमिकों पर टिका है।",
          mr: "नर माश्या रस गोळा करत नाहीत आणि अंडी घालू शकत नाहीत — पोळ्याचे काम राणी आणि कामकऱ्यांवर चालते.",
        },
      },
      {
        id: "beebox",
        name: { en: "The bee box", hi: "मधु-बक्सा", mr: "मध-पेटी" },
        kind: "bee-keeping",
        prompt: {
          en: "In what does a bee-keeper give the bees a home — a wooden case with frames inside for the comb?",
          hi: "मधुमक्खी-पालक मक्खियों को घर किसमें देता है — भीतर छत्ते के लिए ढाँचों वाला लकड़ी का सन्दूक़?",
          mr: "मधमाशीपालक माश्यांना घर कशात देतो — आत पोळ्यासाठी चौकटी असलेली लाकडी पेटी?",
        },
        statement: {
          en: "The bee box is a wooden case with frames where the bees build comb — a hive a keeper can open and tend.",
          hi: "मधु-बक्सा ढाँचों वाला लकड़ी का सन्दूक़ है जिसमें मक्खियाँ छत्ता बनाती हैं — ऐसा छत्ता जिसे पालक खोल और सँभाल सकता है।",
          mr: "मध-पेटी म्हणजे चौकटींची लाकडी पेटी, जिच्यात माश्या पोळे बांधतात — पालकाला उघडून निगा राखता येणारे पोळे.",
        },
        pair: {
          left: { en: "The bee box", hi: "मधु-बक्सा", mr: "मध-पेटी" },
          right: {
            en: "a hive you can keep",
            hi: "पाला जा सकने वाला छत्ता",
            mr: "पाळता येणारे पोळे",
          },
        },
      },
      {
        id: "nectar",
        name: { en: "Nectar", hi: "फूलों का रस (मकरंद)", mr: "फुलांचा रस (मकरंद)" },
        kind: "bee-keeping",
        prompt: {
          en: "What sweet liquid do flowers hold deep inside, which bees carry off to make honey?",
          hi: "फूल अपने भीतर कौन-सा मीठा द्रव छिपाए रहते हैं, जिसे मक्खियाँ शहद बनाने ले जाती हैं?",
          mr: "फुले आपल्या आत कोणता गोड द्रव ठेवतात, जो माश्या मध करण्यासाठी नेतात?",
        },
        statement: {
          en: "Nectar is the flowers' sweet juice — the raw stuff of honey, sipped and carried by the workers.",
          hi: "मकरंद फूलों का मीठा रस है — शहद का कच्चा माल, जिसे श्रमिक मक्खियाँ पी-पीकर ढोती हैं।",
          mr: "मकरंद हा फुलांचा गोड रस — मधाचा कच्चा माल, जो कामकरी माश्या पिऊन वाहून नेतात.",
        },
      },
      {
        id: "litchi",
        name: { en: "The litchi blossom", hi: "लीची का मौसमी फूल", mr: "लिचीचा मोहर" },
        kind: "bee-keeping",
        prompt: {
          en: "In Anita's Bihar, which tree's flowering season fills the bee boxes fastest with fragrant honey?",
          hi: "अनीता के बिहार में किस पेड़ के फूलों का मौसम मधु-बक्सों को ख़ुशबूदार शहद से सबसे तेज़ भरता है?",
          mr: "अनीताच्या बिहारमध्ये कोणत्या झाडाच्या मोहराचा हंगाम मध-पेट्या घमघमीत मधाने सर्वांत वेगाने भरतो?",
        },
        statement: {
          en: "When the litchi trees flower, the bees make their best and most honey — the boxes are moved near the orchards then.",
          hi: "जब लीची के पेड़ फूलते हैं, मक्खियाँ सबसे अच्छा और सबसे ज़्यादा शहद बनाती हैं — तब बक्से बग़ीचों के पास ले जाए जाते हैं।",
          mr: "लिचीची झाडे फुलली की माश्या सर्वोत्तम आणि सर्वाधिक मध करतात — तेव्हा पेट्या बागांजवळ नेल्या जातात.",
        },
        pair: {
          left: { en: "The litchi blossom", hi: "लीची के फूल", mr: "लिचीचा मोहर" },
          right: { en: "the honey season", hi: "शहद का मौसम", mr: "मधाचा हंगाम" },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the hive's jobs: A-lays every egg, B-gathers the nectar, C-does neither. Which trio is right?",
          hi: "छत्ते के काम मिलाइए: अ-हर अंडा देती है, ब-रस बटोरती हैं, स-दोनों में से कुछ नहीं। कौन-सी तिकड़ी सही है?",
          mr: "पोळ्याची कामे जुळवा: अ-प्रत्येक अंडे घालते, ब-रस गोळा करतात, क-दोन्हींपैकी काहीच नाही. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: the queen · B: the workers · C: the males",
            hi: "अ: रानी · ब: श्रमिक · स: नर",
            mr: "अ: राणी · ब: कामकरी · क: नर",
          },
          {
            en: "A: the workers · B: the males · C: the queen",
            hi: "अ: श्रमिक · ब: नर · स: रानी",
            mr: "अ: कामकरी · ब: नर · क: राणी",
          },
          {
            en: "A: the males · B: the queen · C: the workers",
            hi: "अ: नर · ब: रानी · स: श्रमिक",
            mr: "अ: नर · ब: राणी · क: कामकरी",
          },
          {
            en: "A: the queen · B: the males · C: the workers",
            hi: "अ: रानी · ब: नर · स: श्रमिक",
            mr: "अ: राणी · ब: नर · क: कामकरी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "One queen lays; thousands of workers gather; the males do neither. Every wrong option gives some bee a job it never does — the hive runs precisely because each kind keeps its own.",
          hi: "एक रानी अंडे देती है; हज़ारों श्रमिक बटोरती हैं; नर दोनों नहीं करते। हर ग़लत विकल्प किसी मक्खी को वह काम थमा देता है जो वह कभी नहीं करती — छत्ता ठीक इसीलिए चलता है कि हर तरह की मक्खी अपना ही काम रखती है।",
          mr: "एक राणी अंडी घालते; हजारो कामकरी गोळा करतात; नर दोन्ही करत नाहीत. प्रत्येक चुकीचा पर्याय कोणा माशीला ती कधीच न करणारे काम देतो — पोळे नेमके यामुळेच चालते की प्रत्येक जात आपलेच काम करते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "In litchi season Anita carts her boxes right up to the orchards, though the bees can fly far. Why move the boxes at all?",
          hi: "लीची के मौसम में अनीता अपने बक्से बग़ीचों तक ढोकर ले जाती है, जबकि मक्खियाँ दूर तक उड़ सकती हैं। बक्से ले जाने की ज़रूरत ही क्यों?",
          mr: "लिचीच्या हंगामात अनीता आपल्या पेट्या बागांपर्यंत वाहून नेते, वास्तविक माश्या दूरवर उडू शकतात. पेट्या न्यायची गरजच का?",
        },
        choices: [
          {
            en: "Short trips mean more trips — bees beside the blossom bring home far more nectar each day than bees flying from afar",
            hi: "छोटी उड़ान यानी ज़्यादा फेरे — फूलों के पास बैठी मक्खियाँ दूर से उड़कर आने वालियों से हर दिन कहीं ज़्यादा रस लाती हैं",
            mr: "छोटी उड्डाणे म्हणजे जास्त फेऱ्या — मोहराशेजारच्या माश्या दुरून उडणाऱ्यांहून रोज कितीतरी जास्त रस आणतात",
          },
          {
            en: "Bees refuse to fly more than a few steps from their box",
            hi: "मक्खियाँ बक्से से चंद क़दम से ज़्यादा उड़ने से मना कर देती हैं",
            mr: "माश्या पेटीपासून काही पावलांहून जास्त उडायला नकार देतात",
          },
          {
            en: "The boxes must taste the litchi air to flavour the honey",
            hi: "शहद में स्वाद के लिए बक्सों को लीची की हवा चखनी पड़ती है",
            mr: "मधाला चव यावी म्हणून पेट्यांना लिचीची हवा चाखावी लागते",
          },
          {
            en: "Orchard owners pay Anita to display her boxes",
            hi: "बाग़ मालिक अनीता को बक्से सजाने के पैसे देते हैं",
            mr: "बागमालक अनीताला पेट्या मांडण्याचे पैसे देतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A worker bee's day is a fixed number of flying hours; spend them crossing fields and little is left for carrying. Put the box beside the blossom and every hour becomes a loaded trip — same bees, many times the honey. A keeper's real skill is arranging the bees' geography.",
          hi: "श्रमिक मक्खी का दिन उड़ान के गिने-चुने घंटे हैं; वे खेत पार करने में ख़र्च हों तो ढोने के लिए थोड़ा ही बचता है। बक्सा फूलों के पास रखिए तो हर घंटा भरा हुआ फेरा बन जाता है — वही मक्खियाँ, कई गुना शहद। पालक का असली हुनर मक्खियों का भूगोल सजाना है।",
          mr: "कामकरी माशीचा दिवस म्हणजे उड्डाणाचे मोजके तास; ते शेते ओलांडण्यात गेले तर वाहून आणण्यासाठी थोडेच उरतात. पेटी मोहराशेजारी ठेवली की प्रत्येक तास भरलेली फेरी होते — त्याच माश्या, कैक पट मध. पालकाचे खरे कौशल्य म्हणजे माश्यांचा भूगोल मांडणे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Anita's neighbours said bee-keeping was not a girl's work; today the village asks HER how it is done. What changed their minds?",
          hi: "अनीता के पड़ोसियों ने कहा था कि मधुमक्खी-पालन लड़की का काम नहीं; आज गाँव उसी से पूछता है कि यह कैसे होता है। उनकी सोच किसने बदली?",
          mr: "अनीताच्या शेजाऱ्यांनी म्हटले होते की मधमाशीपालन मुलीचे काम नव्हे; आज गाव तिलाच विचारते की ते कसे करायचे. त्यांचे मत कशाने बदलले?",
        },
        choices: [
          {
            en: "Her work itself — the full boxes, the school fees paid, the skill nobody could argue with",
            hi: "उसका काम ही — भरे बक्से, चुकी हुई फ़ीस, वह हुनर जिससे कोई बहस नहीं कर सकता था",
            mr: "तिचे कामच — भरलेल्या पेट्या, भरलेली फी, ज्याच्याशी कोणी वाद घालू शकले नाही ते कौशल्य",
          },
          {
            en: "A new rule ordered the village to respect her",
            hi: "एक नए नियम ने गाँव को उसका सम्मान करने का आदेश दिया",
            mr: "नव्या नियमाने गावाला तिचा मान ठेवायची आज्ञा दिली",
          },
          {
            en: "She gave up bee-keeping to win their approval",
            hi: "उसने उनकी हाँ पाने के लिए मधुमक्खी-पालन छोड़ दिया",
            mr: "त्यांची पसंती मिळवायला तिने मधमाशीपालन सोडले",
          },
          {
            en: "The bees only obey girls, so no one else could try",
            hi: "मक्खियाँ केवल लड़कियों की मानती हैं, इसलिए और कोई आज़मा ही नहीं सकता था",
            mr: "माश्या फक्त मुलींचे ऐकतात, म्हणून दुसरे कोणी करूच शकत नव्हते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "No rule and no giving-up — just honey that kept filling boxes and fees that kept getting paid. Doubt argues with words but not with results: when the 'not for girls' work was visibly done well by a girl, the village's question had to change from 'why is she doing it' to 'how is it done'.",
          hi: "न नियम, न हार मानना — बस शहद जो बक्से भरता गया और फ़ीस जो चुकती गई। शक शब्दों से बहस करता है, नतीजों से नहीं: जब 'लड़कियों का नहीं' वाला काम एक लड़की ने सबके सामने बख़ूबी कर दिखाया, तो गाँव का सवाल 'यह क्यों कर रही है' से बदलकर 'यह होता कैसे है' होना ही था।",
          mr: "नियम नाही, माघारही नाही — फक्त पेट्या भरत गेलेला मध आणि भरली जात गेलेली फी. शंका शब्दांशी वाद घालते, निकालांशी नाही: 'मुलींचे नव्हे' म्हटलेले काम एका मुलीने साऱ्यांदेखत उत्तम करून दाखवले, तेव्हा गावाचा प्रश्न 'ही का करते' वरून 'हे कसे करतात' असा बदलणे भागच होते.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 14 — Basva's Farm (the farming year, tool by tool)              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-4-basvas-farm",
    subject: "EVS",
    classLevel: 4,
    chapter: {
      en: "Chapter 14 — Basva's Farm",
      hi: "अध्याय 14 — बसवा का खेत",
      mr: "प्रकरण 14 — बसवाचे शेत",
    },
    name: { en: "Basva's Farm", hi: "बसवा का खेत", mr: "बसवाचे शेत" },
    summary: {
      en: "A farm's year in order — ploughing, sowing, weeding, harvest — and the tools and bullocks that carry each season's work.",
      hi: "खेत का साल सिलसिलेवार — जुताई, बुआई, निराई, कटाई — और हर मौसम का काम उठाते औज़ार और बैल।",
      mr: "शेताचे वर्ष क्रमाने — नांगरणी, पेरणी, खुरपणी, कापणी — आणि प्रत्येक हंगामाचे काम पेलणारी अवजारे आणि बैल.",
    },
    position: 14,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "plough",
        name: { en: "Ploughing", hi: "जुताई", mr: "नांगरणी" },
        kind: "farm-step",
        seq: 1,
        prompt: {
          en: "Which first task of the farming year turns and loosens the hard soil, the plough biting in behind the bullocks?",
          hi: "खेती के साल का कौन-सा पहला काम कड़ी मिट्टी को पलटता और भुरभुरा करता है — बैलों के पीछे धँसता हल?",
          mr: "शेतीच्या वर्षातले कोणते पहिले काम कडक माती उलटून भुसभुशीत करते — बैलांच्या मागे रुतणारा नांगर?",
        },
        statement: {
          en: "Ploughing comes first — the plough turns the hard soil soft so seeds can breathe and roots can run.",
          hi: "सबसे पहले जुताई — हल कड़ी मिट्टी को नरम पलट देता है, ताकि बीज साँस लें और जड़ें दौड़ें।",
          mr: "सर्वांत आधी नांगरणी — नांगर कडक माती मऊ उलटतो, म्हणजे बी श्वास घेते आणि मुळे धावतात.",
        },
        pair: {
          left: { en: "The plough", hi: "हल", mr: "नांगर" },
          right: { en: "turning the soil", hi: "मिट्टी पलटना", mr: "माती उलटणे" },
        },
      },
      {
        id: "sowing",
        name: { en: "Sowing", hi: "बुआई", mr: "पेरणी" },
        kind: "farm-step",
        seq: 2,
        prompt: {
          en: "Into the fresh loosened earth, which task tucks the seeds, row upon row?",
          hi: "ताज़ा भुरभुरी मिट्टी में कौन-सा काम बीजों को क़तार-दर-क़तार बिठाता है?",
          mr: "ताज्या भुसभुशीत मातीत कोणते काम बियांना रांगेमागून रांग पेरत जाते?",
        },
        statement: {
          en: "Sowing follows the plough — seeds go into the loosened earth in rows, before the rains arrive to wake them.",
          hi: "जुताई के बाद बुआई — बीज क़तारों में भुरभुरी मिट्टी में जाते हैं, इससे पहले कि बारिश उन्हें जगाने आए।",
          mr: "नांगरणीनंतर पेरणी — बी रांगांनी भुसभुशीत मातीत जाते, पाऊस त्यांना जागवायला येण्याआधी.",
        },
        pair: {
          left: { en: "Sowing", hi: "बुआई", mr: "पेरणी" },
          right: {
            en: "seeds in the loosened earth",
            hi: "भुरभुरी मिट्टी में बीज",
            mr: "भुसभुशीत मातीत बी",
          },
        },
      },
      {
        id: "weeding",
        name: { en: "Weeding", hi: "निराई", mr: "खुरपणी" },
        kind: "farm-step",
        seq: 3,
        prompt: {
          en: "While the crop grows, which bent-back task pulls out the unwanted plants, khurpi in hand?",
          hi: "फ़सल के बढ़ते-बढ़ते कौन-सा कमर-झुका काम बिन-बुलाए पौधों को उखाड़ता चलता है — हाथ में खुरपी?",
          mr: "पीक वाढत असताना कोणते वाकून करायचे काम नको ती रोपे उपटत जाते — हातात खुरपे?",
        },
        statement: {
          en: "Weeding pulls out the unwanted plants with a khurpi, so they stop stealing the crop's water and food.",
          hi: "निराई खुरपी से बिन-बुलाए पौधे उखाड़ती है, ताकि वे फ़सल का पानी और खाना चुराना बंद करें।",
          mr: "खुरपणी खुरप्याने नको ती रोपे उपटते, म्हणजे ती पिकाचे पाणी आणि अन्न चोरणे थांबवतात.",
        },
        pair: {
          left: { en: "The khurpi", hi: "खुरपी", mr: "खुरपे" },
          right: {
            en: "digging out the weeds",
            hi: "खर-पतवार उखाड़ना",
            mr: "तण उपटणे",
          },
        },
      },
      {
        id: "harvest",
        name: { en: "The harvest", hi: "कटाई", mr: "कापणी" },
        kind: "farm-step",
        seq: 4,
        prompt: {
          en: "When the crop stands ripe and golden, which last task cuts it, sickle in hand?",
          hi: "जब फ़सल पकी और सुनहरी खड़ी हो, कौन-सा आख़िरी काम उसे काटता है — हाथ में हँसिया?",
          mr: "पीक पिकून सोनेरी उभे राहिले की कोणते शेवटचे काम ते कापते — हातात विळा?",
        },
        statement: {
          en: "The harvest ends the farm's year — the ripe crop is cut with the sickle and gathered in.",
          hi: "कटाई खेत का साल पूरा करती है — पकी फ़सल हँसिए से काटकर समेटी जाती है।",
          mr: "कापणी शेताचे वर्ष पूर्ण करते — पिकलेले पीक विळ्याने कापून गोळा केले जाते.",
        },
        detail: {
          en: "Cut too early the grain is milky and light; cut too late it shatters and spills in the field.",
          hi: "जल्दी काटो तो दाना दूधिया और हलका; देर से काटो तो झड़कर खेत में बिखर जाता है।",
          mr: "लवकर कापले तर दाणा दुधाळ आणि हलका; उशिरा कापले तर झडून शेतात सांडतो.",
        },
        extra: {
          en: "After it, the field rests, and the family counts the sacks.",
          hi: "उसके बाद खेत सुस्ताता है, और परिवार बोरियाँ गिनता है।",
          mr: "त्यानंतर शेत विसावते, आणि कुटुंब पोती मोजते.",
        },
        pair: {
          left: { en: "The sickle", hi: "हँसिया", mr: "विळा" },
          right: { en: "cutting the ripe crop", hi: "पकी फ़सल काटना", mr: "पिकलेले पीक कापणे" },
        },
      },
      {
        id: "bullocks",
        name: { en: "The bullocks", hi: "बैल", mr: "बैल" },
        kind: "farm-helper",
        prompt: {
          en: "Who pulls Basva's plough through the field and his loaded cart to the market?",
          hi: "बसवा का हल खेत में और लदी गाड़ी बाज़ार तक कौन खींचता है?",
          mr: "बसवाचा नांगर शेतात आणि भरलेली गाडी बाजारात कोण ओढतो?",
        },
        statement: {
          en: "The bullocks pull the plough through the soil and the loaded cart to market — the farm's patient engines.",
          hi: "बैल हल को मिट्टी में और लदी गाड़ी को बाज़ार तक खींचते हैं — खेत के धीरजवान इंजन।",
          mr: "बैल नांगर मातीतून आणि भरलेली गाडी बाजारापर्यंत ओढतात — शेताची सोशीक इंजिने.",
        },
      },
      {
        id: "rains",
        name: { en: "The rains", hi: "बारिश का मौसम", mr: "पावसाळा" },
        kind: "farm-helper",
        prompt: {
          en: "Basva watches the sky and times his sowing to arrive just before what?",
          hi: "बसवा आसमान ताकता है और बुआई ठीक किसके आने से पहले रखता है?",
          mr: "बसवा आकाशाकडे पाहतो आणि पेरणी नेमकी कशाच्या आधी ठेवतो?",
        },
        statement: {
          en: "The rains are the farm's appointment — sowing is timed so the first showers fall on freshly seeded earth.",
          hi: "बारिश खेत की तयशुदा मुलाक़ात है — बुआई ऐसे रखी जाती है कि पहली फुहारें ताज़ा बोई मिट्टी पर गिरें।",
          mr: "पाऊस ही शेताची ठरलेली भेट — पेरणी अशी साधतात की पहिल्या सरी नुकत्याच पेरलेल्या मातीवर पडाव्यात.",
        },
      },
      {
        id: "manure",
        name: { en: "Cattle manure", hi: "गोबर की खाद", mr: "शेणखत" },
        kind: "farm-helper",
        prompt: {
          en: "What does Basva spread on the field from his own cattle shed, to feed the soil without buying anything?",
          hi: "बसवा अपने ही बाड़े से निकालकर खेत में क्या बिखेरता है, जो बिना कुछ ख़रीदे मिट्टी को खिलाती है?",
          mr: "बसवा आपल्याच गोठ्यातून काढून शेतात काय पसरतो, जे काहीही विकत न घेता मातीला खाऊ घालते?",
        },
        statement: {
          en: "Cattle manure from the shed feeds the soil — the farm's own animals return strength to the farm's own earth.",
          hi: "बाड़े की गोबर-खाद मिट्टी को खिलाती है — खेत के अपने पशु खेत की अपनी धरती को ताक़त लौटाते हैं।",
          mr: "गोठ्यातले शेणखत मातीला खाऊ घालते — शेताचीच जनावरे शेताच्याच मातीला ताकद परत देतात.",
        },
      },
    ],
    hard: [
      {
        level: 6,
        stem: {
          en: "Basva sows DAYS before the rains, not after them, though rain would make the digging easier. Why sow into dry earth?",
          hi: "बसवा बारिश से कुछ दिन पहले बोता है, बाद में नहीं — जबकि बारिश के बाद खोदना आसान होता। सूखी मिट्टी में बोना क्यों?",
          mr: "बसवा पावसाच्या काही दिवस आधी पेरतो, नंतर नाही — वास्तविक पावसानंतर खणणे सोपे झाले असते. कोरड्या मातीत पेरायचे का?",
        },
        choices: [
          {
            en: "So the first showers fall on seeds already waiting — they wake all together and the whole field rises evenly",
            hi: "ताकि पहली फुहारें पहले से बिछे बीजों पर गिरें — सब एक साथ जागें और पूरा खेत एक-सा उठे",
            mr: "म्हणजे पहिल्या सरी आधीच वाट पाहणाऱ्या बियांवर पडतात — सारी एकदम जागतात आणि सगळे शेत सारखे उठते",
          },
          {
            en: "Wet earth is too heavy for the bullocks to plough at all",
            hi: "गीली मिट्टी बैलों से जुत ही नहीं सकती, इतनी भारी होती है",
            mr: "ओली माती बैलांना नांगरताच येत नाही, इतकी जड असते",
          },
          {
            en: "Seeds dissolve if sown into wet ground",
            hi: "गीली ज़मीन में बोए बीज घुल जाते हैं",
            mr: "ओल्या जमिनीत पेरलेले बी विरघळते",
          },
          {
            en: "The rains are impossible to predict, so timing does not matter",
            hi: "बारिश का अनुमान हो ही नहीं सकता, इसलिए समय का महत्व नहीं",
            mr: "पावसाचा अंदाजच करता येत नाही, म्हणून वेळेला महत्त्व नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A seed in dry earth simply waits; the first rain is its alarm bell, and every seed hears it at the same moment. Sow AFTER the rain and the field is mud, the sowing is slow, and the season's precious first water falls on empty ground. Basva's calendar looks lazy and is actually exact.",
          hi: "सूखी मिट्टी का बीज बस प्रतीक्षा करता है; पहली बारिश उसकी घंटी है, और हर बीज उसे एक ही पल सुनता है। बारिश के बाद बोइए तो खेत कीचड़, बुआई धीमी, और मौसम का अनमोल पहला पानी ख़ाली ज़मीन पर गिरता है। बसवा का कैलेंडर आलसी दिखता है और असल में सधा हुआ है।",
          mr: "कोरड्या मातीतले बी नुसते थांबते; पहिला पाऊस ही त्याची घंटा, आणि प्रत्येक बी ती एकाच क्षणी ऐकते. पावसानंतर पेरा तर शेत चिखल, पेरणी सावकाश, आणि हंगामाचे मोलाचे पहिले पाणी रिकाम्या जमिनीवर पडते. बसवाचे वेळापत्रक आळशी दिसते आणि प्रत्यक्षात नेमके आहे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A weed is only a plant — it asks for nothing but water, light and soil. Then why does Basva bend all day to pull weeds out?",
          hi: "खर-पतवार भी तो बस एक पौधा है — पानी, धूप और मिट्टी के सिवा कुछ नहीं माँगता। फिर बसवा दिन भर झुककर उसे क्यों उखाड़ता है?",
          mr: "तण म्हणजेही एक रोपच — पाणी, ऊन आणि मातीशिवाय काही मागत नाही. मग बसवा दिवसभर वाकून ते का उपटतो?",
        },
        choices: [
          {
            en: "Because water, light and soil are exactly what his crop needs — every weed is fed at the crop's expense",
            hi: "क्योंकि पानी, धूप और मिट्टी ही तो उसकी फ़सल की ज़रूरत हैं — हर खर-पतवार फ़सल की क़ीमत पर पलता है",
            mr: "कारण पाणी, ऊन आणि माती हीच तर त्याच्या पिकाची गरज — प्रत्येक तण पिकाच्या जिवावर पोसले जाते",
          },
          {
            en: "Weeds sting the farmer's feet at harvest time",
            hi: "कटाई के समय खर-पतवार किसान के पैरों में चुभता है",
            mr: "कापणीच्या वेळी तण शेतकऱ्याच्या पायाला टोचते",
          },
          {
            en: "Weeds look untidy, and tidy fields fetch better prices",
            hi: "खर-पतवार भद्दा दिखता है, और सजे खेत का दाम अच्छा मिलता है",
            mr: "तण गबाळे दिसते, आणि नीटनेटक्या शेताला भाव चांगला मिळतो",
          },
          {
            en: "Pulling weeds is a custom with no real reason left",
            hi: "निराई एक रिवाज है जिसकी असल वजह अब बची नहीं",
            mr: "खुरपणी ही आता खरे कारण न उरलेली रीत आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The weed's innocence is the problem: it wants nothing special — only the very water, light and soil-food the crop was planted to use. A field is a fixed plate; whatever the weed eats, the grain does not. Weeding looks like tidying and is actually the crop's share being defended, plant by plant.",
          hi: "खर-पतवार का भोलापन ही समस्या है: वह कुछ ख़ास नहीं चाहता — वही पानी, धूप और मिट्टी की ख़ुराक, जिनके लिए फ़सल बोई गई थी। खेत एक तय थाली है; जो खर-पतवार खा गया, वह दाने को नहीं मिला। निराई सफ़ाई दिखती है और असल में पौधे-दर-पौधे फ़सल के हिस्से की पहरेदारी है।",
          mr: "तणाचा भोळेपणा हीच अडचण: त्याला काही खास नको — तेच पाणी, ऊन आणि मातीतले अन्न, ज्यांसाठी पीक पेरले होते. शेत ही ठरलेली थाळी; तण जे खाते, ते दाण्याला मिळत नाही. खुरपणी आवराआवर दिसते आणि प्रत्यक्षात रोपारोपाने पिकाच्या वाट्याची राखण असते.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 18 — Too Much Water, Too Little Water                           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-4-too-much-water-too-little-water",
    subject: "EVS",
    classLevel: 4,
    chapter: {
      en: "Chapter 18 — Too Much Water, Too Little Water",
      hi: "अध्याय 18 — कहीं ज़्यादा पानी, कहीं कम",
      mr: "प्रकरण 18 — कुठे अति पाणी, कुठे कमी",
    },
    name: {
      en: "Too Much Water, Too Little Water",
      hi: "कहीं ज़्यादा पानी, कहीं कम",
      mr: "कुठे अति पाणी, कुठे कमी",
    },
    summary: {
      en: "Flooded lanes with nothing fit to drink, dry villages walking miles for a pot — and the habits that keep water safe in both.",
      hi: "डूबी गलियाँ जहाँ पीने लायक़ कुछ नहीं, सूखे गाँव जो एक घड़े के लिए मीलों चलते हैं — और वे आदतें जो दोनों जगह पानी को सुरक्षित रखती हैं।",
      mr: "बुडालेल्या गल्ल्या जिथे पिण्याजोगे काही नाही, कोरडी गावे जी एका घागरीसाठी मैलोन्मैल चालतात — आणि दोन्हीकडे पाणी सुरक्षित ठेवणाऱ्या सवयी.",
    },
    position: 18,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "floodedvillage",
        name: { en: "A flooded village", hi: "बाढ़ में घिरा गाँव", mr: "पुरात बुडालेले गाव" },
        kind: "water-trouble",
        prompt: {
          en: "Streets underwater, wells and handpumps drowned in muddy flood — which village has water everywhere and none fit to drink?",
          hi: "गलियाँ पानी में, कुएँ और नल गंदी बाढ़ में डूबे — किस गाँव में पानी ही पानी है, पर पीने लायक़ बूँद नहीं?",
          mr: "गल्ल्या पाण्याखाली, विहिरी आणि हातपंप गढूळ पुरात बुडालेले — कोणत्या गावात पाणीच पाणी आहे, पण पिण्याजोगा थेंब नाही?",
        },
        statement: {
          en: "In a flooded village the wells and handpumps drown in dirty water — water is everywhere, and none of it is safe to drink.",
          hi: "बाढ़ में घिरे गाँव के कुएँ और नल गंदे पानी में डूब जाते हैं — पानी हर ओर है, और पीने लायक़ कहीं नहीं।",
          mr: "पुरात बुडालेल्या गावाच्या विहिरी आणि हातपंप गढूळ पाण्यात बुडतात — पाणी सगळीकडे आहे, आणि पिण्याजोगे कुठेच नाही.",
        },
        detail: {
          en: "Food, dry clothes and clean water must come to it by boat until the flood goes down.",
          hi: "बाढ़ उतरने तक खाना, सूखे कपड़े और साफ़ पानी उस तक नाव से पहुँचाना पड़ता है।",
          mr: "पूर ओसरेपर्यंत अन्न, कोरडे कपडे आणि स्वच्छ पाणी होडीने पोहोचवावे लागते.",
        },
        extra: {
          en: "When the water finally drains, the wells must be cleaned before anyone drinks from them.",
          hi: "पानी उतर जाए तो भी पहले कुएँ साफ़ होते हैं, तब कोई उनसे पीता है।",
          mr: "पाणी ओसरले तरी आधी विहिरी स्वच्छ होतात, मगच कोणी त्यांतले पिते.",
        },
        pair: {
          left: { en: "A flooded village", hi: "बाढ़ में घिरा गाँव", mr: "पुरात बुडालेले गाव" },
          right: {
            en: "water everywhere, none to drink",
            hi: "पानी सब ओर, पीने को नहीं",
            mr: "पाणी सगळीकडे, प्यायला नाही",
          },
        },
      },
      {
        id: "dryvillage",
        name: { en: "A dry village", hi: "पानी को तरसता गाँव", mr: "पाण्यासाठी आसुसलेले गाव" },
        kind: "water-trouble",
        prompt: {
          en: "Wells sunk low, one tanker a week, women walking miles balancing pots — which village is this?",
          hi: "कुएँ तलहटी छूते, हफ़्ते में एक टैंकर, सिर पर घड़े साधे मीलों चलती स्त्रियाँ — यह कौन-सा गाँव है?",
          mr: "विहिरी तळ गाठलेल्या, आठवड्याला एक टँकर, डोक्यावर घागरी तोलत मैलोन्मैल चालणाऱ्या बाया — हे कोणते गाव?",
        },
        statement: {
          en: "In a dry village the wells sink low and women and children walk far, carrying home every pot of water.",
          hi: "पानी को तरसते गाँव में कुएँ उतर जाते हैं और स्त्रियाँ-बच्चे दूर-दूर से हर घड़ा ढोकर लाते हैं।",
          mr: "पाण्यासाठी आसुसलेल्या गावात विहिरी खोल जातात आणि बाया-मुले दुरून प्रत्येक घागर वाहून आणतात.",
        },
        pair: {
          left: { en: "A dry village", hi: "पानी को तरसता गाँव", mr: "पाण्यासाठी आसुसलेले गाव" },
          right: {
            en: "miles walked for one pot",
            hi: "एक घड़े के लिए मीलों पैदल",
            mr: "एका घागरीसाठी मैलोन्मैल",
          },
        },
      },
      {
        id: "dirtywater",
        name: { en: "Dirty water", hi: "गंदा पानी", mr: "गढूळ अशुद्ध पाणी" },
        kind: "water-safety",
        prompt: {
          en: "What looks like ordinary water in the glass, yet carries the germs of stomach illness and fevers?",
          hi: "गिलास में आम पानी-सा क्या दिखता है, पर पेट की बीमारियों और बुख़ारों के कीटाणु ढोता है?",
          mr: "ग्लासात साध्या पाण्यासारखे काय दिसते, पण पोटाच्या आजारांचे आणि तापांचे जंतू वाहते?",
        },
        statement: {
          en: "Dirty water can look clean in a glass and still carry the germs of stomach diseases.",
          hi: "गंदा पानी गिलास में साफ़ दिख सकता है और फिर भी पेट की बीमारियों के कीटाणु लिए हो सकता है।",
          mr: "अशुद्ध पाणी ग्लासात स्वच्छ दिसू शकते आणि तरी पोटाच्या आजारांचे जंतू बाळगू शकते.",
        },
        pair: {
          left: { en: "Dirty water", hi: "गंदा पानी", mr: "अशुद्ध पाणी" },
          right: {
            en: "stomach illness in a glass",
            hi: "गिलास में पेट की बीमारी",
            mr: "ग्लासातला पोटाचा आजार",
          },
        },
      },
      {
        id: "boiling",
        name: { en: "Boiling the water", hi: "पानी उबालना", mr: "पाणी उकळणे" },
        kind: "water-safety",
        prompt: {
          en: "When the water's cleanness is in doubt, what does Amma do to it on the stove before anyone drinks?",
          hi: "जब पानी की सफ़ाई पर शक हो, तो पीने से पहले अम्मा चूल्हे पर उसका क्या करती हैं?",
          mr: "पाण्याच्या शुद्धतेची शंका असली की पिण्याआधी आई चुलीवर त्याचे काय करते?",
        },
        statement: {
          en: "Boiling kills the germs in doubtful water — boiled and covered, it becomes safe to drink.",
          hi: "उबालना शक वाले पानी के कीटाणु मार देता है — उबला और ढका पानी पीने लायक़ हो जाता है।",
          mr: "उकळणे शंकास्पद पाण्यातले जंतू मारते — उकळलेले आणि झाकलेले पाणी पिण्याजोगे होते.",
        },
        pair: {
          left: {
            en: "Boiling doubtful water",
            hi: "शक वाला पानी उबालना",
            mr: "शंकास्पद पाणी उकळणे",
          },
          right: { en: "germs killed by heat", hi: "आँच से मरे कीटाणु", mr: "उष्णतेने मेलेले जंतू" },
        },
      },
      {
        id: "handpump",
        name: { en: "The handpump", hi: "हैंडपंप", mr: "हातपंप" },
        kind: "water-source",
        prompt: {
          en: "Which iron helper, worked up and down by hand, pulls clean water up from deep underground?",
          hi: "कौन-सा लोहे का मददगार, हाथ से ऊपर-नीचे चलाया हुआ, गहरे भूमिगत से साफ़ पानी खींच लाता है?",
          mr: "कोणता लोखंडी मदतनीस, हाताने वरखाली चालवला की, खोल जमिनीखालून स्वच्छ पाणी वर आणतो?",
        },
        statement: {
          en: "The handpump pulls water up from deep underground, where it lies filtered and clean.",
          hi: "हैंडपंप गहरे भूमिगत से पानी खींचता है, जहाँ वह छना हुआ और साफ़ रहता है।",
          mr: "हातपंप खोल जमिनीखालून पाणी वर खेचतो, जिथे ते गाळलेले आणि स्वच्छ असते.",
        },
      },
      {
        id: "tanka",
        name: {
          en: "The tanka (rain tank)",
          hi: "टाँका (वर्षा-कुंड)",
          mr: "टाका (पावसाचे टाके)",
        },
        kind: "water-source",
        prompt: {
          en: "In dry Rajasthan homes, which covered underground tank saves the roof's rainwater for the whole year?",
          hi: "सूखे राजस्थान के घरों में कौन-सा ढका भूमिगत कुंड छत की बरसात को साल भर के लिए सहेजता है?",
          mr: "कोरड्या राजस्थानच्या घरांत कोणते झाकलेले जमिनीखालचे टाके छपराचा पाऊस वर्षभरासाठी साठवते?",
        },
        statement: {
          en: "The tanka is a covered underground tank that stores the roof's rainwater — one good rain can water a family for months.",
          hi: "टाँका ढका भूमिगत कुंड है जो छत का बरसाती पानी जमा करता है — एक अच्छी बारिश परिवार को महीनों पिला सकती है।",
          mr: "टाका हे झाकलेले जमिनीखालचे टाके छपराचे पावसाचे पाणी साठवते — एक चांगला पाऊस कुटुंबाला महिनोंमहिने पुरतो.",
        },
        pair: {
          left: { en: "The tanka", hi: "टाँका", mr: "टाका" },
          right: {
            en: "the roof's rain, saved",
            hi: "छत की बारिश, सहेजी हुई",
            mr: "छपराचा पाऊस, साठवलेला",
          },
        },
      },
      {
        id: "coveredpot",
        name: {
          en: "The covered water pot",
          hi: "ढका हुआ घड़ा",
          mr: "झाकलेली घागर",
        },
        kind: "water-safety",
        prompt: {
          en: "A lid on top, a long-handled ladle to take water out, no hands dipped in — which good habit is this pot showing?",
          hi: "ऊपर ढक्कन, निकालने को लंबी डंडी की कलछी, भीतर कोई हाथ नहीं — यह घड़ा कौन-सी अच्छी आदत दिखा रहा है?",
          mr: "वर झाकण, पाणी काढायला लांब दांड्याचे ओगराळे, आत हात नाही — ही घागर कोणती चांगली सवय दाखवते?",
        },
        statement: {
          en: "The stored water stays covered, and a long ladle takes it out — dipped hands and open pots let the germs in.",
          hi: "रखा पानी ढका रहता है, और लंबी कलछी से निकलता है — डूबे हाथ और खुले घड़े कीटाणुओं को न्योता देते हैं।",
          mr: "साठवलेले पाणी झाकलेले राहते, आणि लांब ओगराळ्याने निघते — बुडवलेले हात आणि उघड्या घागरी जंतूंना आमंत्रण देतात.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort these troubles into a FLOOD's and a DROUGHT's: wells drowned in mud, miles walked for a pot, boats bringing food, one tanker a week. Which sorting is right?",
          hi: "इन मुसीबतों को बाढ़ की और सूखे की में छाँटिए: कीचड़ में डूबे कुएँ, घड़े के लिए मीलों पैदल, नाव से आता खाना, हफ़्ते में एक टैंकर। कौन-सी छँटाई सही है?",
          mr: "या अडचणींची पुराच्या आणि दुष्काळाच्या अशी वर्गवारी करा: चिखलात बुडालेल्या विहिरी, घागरीसाठी मैलोन्मैल चालणे, होडीने येणारे अन्न, आठवड्याला एक टँकर. कोणती वर्गवारी बरोबर?",
        },
        choices: [
          {
            en: "Flood: drowned wells, boats with food · Drought: miles for a pot, one tanker a week",
            hi: "बाढ़: डूबे कुएँ, नाव से खाना · सूखा: मीलों पैदल, हफ़्ते में एक टैंकर",
            mr: "पूर: बुडालेल्या विहिरी, होडीने अन्न · दुष्काळ: मैलोन्मैल चालणे, आठवड्याला एक टँकर",
          },
          {
            en: "Flood: miles for a pot, one tanker · Drought: drowned wells, boats with food",
            hi: "बाढ़: मीलों पैदल, टैंकर · सूखा: डूबे कुएँ, नाव से खाना",
            mr: "पूर: मैलोन्मैल चालणे, टँकर · दुष्काळ: बुडालेल्या विहिरी, होडीने अन्न",
          },
          {
            en: "Flood: drowned wells, one tanker · Drought: boats with food, miles for a pot",
            hi: "बाढ़: डूबे कुएँ, टैंकर · सूखा: नाव से खाना, मीलों पैदल",
            mr: "पूर: बुडालेल्या विहिरी, टँकर · दुष्काळ: होडीने अन्न, मैलोन्मैल चालणे",
          },
          {
            en: "Flood: boats with food, miles for a pot · Drought: drowned wells, one tanker",
            hi: "बाढ़: नाव से खाना, मीलों पैदल · सूखा: डूबे कुएँ, टैंकर",
            mr: "पूर: होडीने अन्न, मैलोन्मैल चालणे · दुष्काळ: बुडालेल्या विहिरी, टँकर",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Ask of each trouble: is there too much water here, or too little? Drowned wells and food arriving by boat can only happen where water has swallowed the roads. Walking miles and waiting for tankers happen only where the ground has none left to give. Two opposite disasters — and the same thirst in both.",
          hi: "हर मुसीबत से पूछिए: यहाँ पानी ज़्यादा है या कम? कुएँ डूबना और खाना नाव से आना वहीं हो सकता है जहाँ पानी सड़कें निगल चुका है। मीलों चलना और टैंकर की बाट जोहना वहीं होता है जहाँ ज़मीन के पास देने को कुछ नहीं बचा। दो उलट आपदाएँ — और दोनों में एक ही प्यास।",
          mr: "प्रत्येक अडचणीला विचारा: इथे पाणी जास्त आहे की कमी? विहिरी बुडणे आणि अन्न होडीने येणे तिथेच घडते जिथे पाण्याने रस्ते गिळले आहेत. मैलोन्मैल चालणे आणि टँकरची वाट पाहणे तिथेच घडते जिथे जमिनीजवळ द्यायला काही उरले नाही. दोन उलट आपत्ती — आणि दोन्हींत एकच तहान.",
        },
      },
      {
        level: 6,
        stem: {
          en: "In the flooded village there is water in every lane — yet the radio warns, 'do not drink it'. Why is a flood a THIRSTY time?",
          hi: "बाढ़ वाले गाँव की हर गली में पानी है — फिर भी रेडियो चेताता है, 'इसे मत पीना'। बाढ़ प्यास का समय क्यों है?",
          mr: "पूर आलेल्या गावाच्या प्रत्येक गल्लीत पाणी आहे — तरी रेडिओ बजावतो, 'हे पिऊ नका'. पूर हा तहानेचा काळ का?",
        },
        choices: [
          {
            en: "Flood water has swept through drains, fields and waste — it is one vast dirty water, and it has drowned the clean sources too",
            hi: "बाढ़ का पानी नालियों, खेतों और कूड़े से होकर बहा है — वह एक विशाल गंदा पानी है, और उसने साफ़ स्रोतों को भी डुबो दिया है",
            mr: "पुराचे पाणी गटारे, शेते आणि कचऱ्यातून वाहत आले आहे — ते एक अवाढव्य गढूळ पाणी आहे, आणि त्याने स्वच्छ स्रोतही बुडवले आहेत",
          },
          {
            en: "Flood water is too salty to drink, like the sea",
            hi: "बाढ़ का पानी समुद्र-सा खारा होता है",
            mr: "पुराचे पाणी समुद्रासारखे खारट असते",
          },
          {
            en: "Drinking is forbidden in floods so water lasts for cooking",
            hi: "बाढ़ में पीना मना है ताकि पानी पकाने के लिए बचे",
            mr: "पुरात पिणे मना असते म्हणजे पाणी स्वयंपाकासाठी उरते",
          },
          {
            en: "Cold flood water chills the stomach, that is all",
            hi: "बाढ़ का ठंडा पानी बस पेट ठंडा कर देता है, और कुछ नहीं",
            mr: "पुराचे गार पाणी नुसते पोट गार करते, इतकेच",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The flood is every drain, gutter, field and rubbish heap stirred into one water — and that water now sits INSIDE the wells and over the handpumps. The village's problem is not finding water but finding water that was not touched by the flood: boiled, brought in, or drawn after the wells are cleaned. Plenty and safety are different things, and a flood proves it in every lane.",
          hi: "बाढ़ हर नाली, गटर, खेत और कूड़े के ढेर को घोलकर बना एक पानी है — और वही पानी अब कुओं के भीतर और नलों के ऊपर बैठा है। गाँव की समस्या पानी पाना नहीं, वह पानी पाना है जिसे बाढ़ ने छुआ न हो: उबला हुआ, बाहर से आया, या कुएँ साफ़ होने के बाद निकाला। बहुतायत और सुरक्षा अलग चीज़ें हैं — बाढ़ इसे हर गली में साबित करती है।",
          mr: "पूर म्हणजे प्रत्येक गटार, नाली, शेत आणि कचऱ्याचा ढीग कालवून झालेले एक पाणी — आणि तेच पाणी आता विहिरींच्या आत आणि हातपंपांवर बसले आहे. गावाचा प्रश्न पाणी मिळवणे नाही, तर पुराने न शिवलेले पाणी मिळवणे: उकळलेले, बाहेरून आणलेले, किंवा विहिरी स्वच्छ झाल्यावर काढलेले. विपुलता आणि सुरक्षितता या वेगळ्या गोष्टी — पूर हे प्रत्येक गल्लीत सिद्ध करतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "One good monsoon falls on two Rajasthani houses. One roof drains into a covered tanka; the other lets the rain run off into the sand. Eight dry months later, what is the difference between the two houses?",
          hi: "एक अच्छा मानसून दो राजस्थानी घरों पर बरसता है। एक की छत ढके टाँके में उतरती है; दूसरे की बारिश रेत में बह जाती है। आठ सूखे महीनों बाद दोनों घरों में क्या फ़र्क़ है?",
          mr: "एक चांगला पावसाळा दोन राजस्थानी घरांवर पडतो. एकाचे छप्पर झाकलेल्या टाक्यात उतरते; दुसऱ्याचा पाऊस वाळूत वाहून जातो. आठ कोरड्या महिन्यांनंतर दोन घरांत काय फरक?",
        },
        choices: [
          {
            en: "The tanka house drinks its own saved rain at home; the other walks and pays for every pot — same rain, different foresight",
            hi: "टाँके वाला घर अपनी सहेजी बारिश घर बैठे पीता है; दूसरा हर घड़े के लिए चलता और चुकाता है — बारिश एक, दूरदर्शिता अलग",
            mr: "टाक्याचे घर आपला साठवलेला पाऊस घरबसल्या पिते; दुसरे प्रत्येक घागरीसाठी चालते आणि मोजते — पाऊस एक, दूरदृष्टी वेगळी",
          },
          {
            en: "No difference — rain always returns to a house that lost it",
            hi: "कोई फ़र्क़ नहीं — बारिश खोने वाले घर के पास लौट आती है",
            mr: "फरक नाही — पाऊस गमावणाऱ्या घराकडे परत येतो",
          },
          {
            en: "The tanka house has stale water, so the other is better off",
            hi: "टाँके का पानी बासी है, इसलिए दूसरा घर बेहतर रहा",
            mr: "टाक्याचे पाणी शिळे असते, म्हणून दुसरे घर बरे",
          },
          {
            en: "The sand stores the second house's rain just as well",
            hi: "रेत दूसरे घर की बारिश उतनी ही अच्छी तरह सँभाल लेती है",
            mr: "वाळू दुसऱ्या घराचा पाऊस तितकाच चांगला सांभाळते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The desert's rule is simple: rain falls the same on all, but only the roof that leads to a tanka keeps any of it. Eight months later one family dips a ladle at home while the other queues at the tanker — not because the sky favoured them, but because their grandparents built a tank. Saved water is the desert's only faithful well.",
          hi: "रेगिस्तान का नियम सीधा है: बारिश सब पर एक-सी गिरती है, पर बचाता वही घर है जिसकी छत टाँके तक जाती है। आठ महीने बाद एक परिवार घर बैठे कलछी डुबोता है और दूसरा टैंकर की क़तार में खड़ा है — इसलिए नहीं कि आसमान ने पक्ष लिया, बल्कि इसलिए कि उनके दादा-परदादा ने कुंड बनाया था। सहेजा पानी रेगिस्तान का इकलौता वफ़ादार कुआँ है।",
          mr: "वाळवंटाचा नियम सोपा: पाऊस साऱ्यांवर सारखाच पडतो, पण साठवते तेच घर ज्याचे छप्पर टाक्यापर्यंत जाते. आठ महिन्यांनी एक कुटुंब घरबसल्या ओगराळे बुडवते आणि दुसरे टँकरच्या रांगेत उभे — आकाशाने पक्षपात केला म्हणून नव्हे, तर त्यांच्या आजोबा-पणजोबांनी टाके बांधले म्हणून. साठवलेले पाणी हीच वाळवंटाची एकुलती इमानी विहीर.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Omana's Journey (two days on a long-distance train)         */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-4-omanas-journey",
    subject: "EVS",
    classLevel: 4,
    chapter: {
      en: "Chapter 6 — Omana's Journey",
      hi: "अध्याय 6 — ओमना का सफ़र",
      mr: "प्रकरण 6 — ओमनाचा प्रवास",
    },
    name: { en: "Omana's Journey", hi: "ओमना का सफ़र", mr: "ओमनाचा प्रवास" },
    summary: {
      en: "Two days on a train from Ahmedabad to Kerala — window pictures, platform sellers, the ticket checker, and berths that become beds.",
      hi: "अहमदाबाद से केरल तक रेल के दो दिन — खिड़की की तस्वीरें, प्लेटफ़ॉर्म के बेचने वाले, टिकट बाबू, और सीटें जो बिस्तर बन जाती हैं।",
      mr: "अहमदाबादहून केरळपर्यंत रेल्वेचे दोन दिवस — खिडकीची चित्रे, फलाटावरचे विक्रेते, तिकीट तपासनीस, आणि बाकांचे होणारे बिछाने.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "window",
        name: { en: "The train window", hi: "रेल की खिड़की", mr: "रेल्वेची खिडकी" },
        kind: "train-life",
        prompt: {
          en: "Where does Omana watch fields, rivers and hills slide past like a moving picture?",
          hi: "ओमना खेतों, नदियों और पहाड़ियों को चलती तस्वीर-सा सरकते कहाँ से देखती है?",
          mr: "ओमना शेते, नद्या आणि टेकड्या सरकत्या चित्रासारखी सरकताना कुठून पाहते?",
        },
        statement: {
          en: "The train window shows the land sliding past — fields, rivers and hills changing hour by hour.",
          hi: "रेल की खिड़की सरकती धरती दिखाती है — खेत, नदियाँ, पहाड़ियाँ, घंटे-घंटे बदलती हुईं।",
          mr: "रेल्वेची खिडकी सरकती जमीन दाखवते — शेते, नद्या, टेकड्या, तासातासाला बदलणाऱ्या.",
        },
        pair: {
          left: { en: "The train window", hi: "रेल की खिड़की", mr: "रेल्वेची खिडकी" },
          right: { en: "a moving picture", hi: "चलती तस्वीर", mr: "सरकते चित्र" },
        },
      },
      {
        id: "vendors",
        name: { en: "The platform sellers", hi: "प्लेटफ़ॉर्म के बेचने वाले", mr: "फलाटावरचे विक्रेते" },
        kind: "train-people",
        prompt: {
          en: "At every station, who calls 'chai-chai!' and passes food up through the windows?",
          hi: "हर स्टेशन पर 'चाय-चाय!' पुकारते हुए खिड़कियों से खाना कौन थमाता है?",
          mr: "प्रत्येक स्थानकावर 'चहा-चहा!' पुकारत खिडक्यांतून खाणे कोण देतो?",
        },
        statement: {
          en: "The platform sellers cry their wares at every halt — chai, vadas and fruit passed through the window bars.",
          hi: "प्लेटफ़ॉर्म के बेचने वाले हर ठहराव पर आवाज़ लगाते हैं — खिड़की की सलाख़ों से चाय, वड़े और फल थमाते।",
          mr: "फलाटावरचे विक्रेते प्रत्येक थांब्यावर पुकारा करतात — खिडकीच्या गजांतून चहा, वडे आणि फळे देत.",
        },
        pair: {
          left: { en: "The platform sellers", hi: "प्लेटफ़ॉर्म के बेचने वाले", mr: "फलाटावरचे विक्रेते" },
          right: { en: "chai at the window", hi: "खिड़की पर चाय", mr: "खिडकीशी चहा" },
        },
      },
      {
        id: "tc",
        name: { en: "The ticket checker", hi: "टिकट बाबू (टीसी)", mr: "तिकीट तपासनीस (टीसी)" },
        kind: "train-people",
        prompt: {
          en: "Who walks the coaches in a black coat, asking every traveller to show a ticket?",
          hi: "काले कोट में डिब्बों से गुज़रते हुए हर मुसाफ़िर से टिकट कौन माँगता है?",
          mr: "काळ्या कोटात डब्यांतून फिरत प्रत्येक प्रवाशाकडे तिकीट कोण मागतो?",
        },
        statement: {
          en: "The ticket checker in his black coat walks coach to coach, checking every traveller's ticket.",
          hi: "काले कोट वाला टिकट बाबू डिब्बे-डिब्बे घूमकर हर मुसाफ़िर का टिकट जाँचता है।",
          mr: "काळ्या कोटातला तिकीट तपासनीस डब्याडब्यातून फिरून प्रत्येक प्रवाशाचे तिकीट तपासतो.",
        },
        pair: {
          left: { en: "The ticket checker", hi: "टिकट बाबू", mr: "तिकीट तपासनीस" },
          right: { en: "tickets, please", hi: "टिकट दिखाइए", mr: "तिकीट दाखवा" },
        },
      },
      {
        id: "berths",
        name: { en: "The sleeping berths", hi: "सोने की बर्थें", mr: "झोपायचे बर्थ" },
        kind: "train-life",
        prompt: {
          en: "At night the day's seats fold open into beds, one above another. What are these train-beds called?",
          hi: "रात में दिन की सीटें एक के ऊपर एक बिस्तरों में खुल जाती हैं। इन रेल-बिस्तरों को क्या कहते हैं?",
          mr: "रात्री दिवसाची आसने एकावर एक बिछान्यांत उघडतात. या रेल्वे-बिछान्यांना काय म्हणतात?",
        },
        statement: {
          en: "The berths fold out at night — the same coach that seats the travellers by day sleeps them in tiers by dark.",
          hi: "रात में बर्थें खुल जाती हैं — जो डिब्बा दिन में बिठाता है, वही अँधेरे में तह-दर-तह सुला देता है।",
          mr: "रात्री बर्थ उघडतात — जो डबा दिवसा बसवतो, तोच अंधारात थरांथरांनी निजवतो.",
        },
        detail: {
          en: "Folding beds let one coach do two jobs — sitting room by day, sleeping room by night.",
          hi: "तह होते बिस्तर एक डिब्बे से दो काम लेते हैं — दिन में बैठक, रात में शयन।",
          mr: "घडीचे बिछाने एका डब्याकडून दोन कामे करवतात — दिवसा बैठक, रात्री शयनगृह.",
        },
        extra: {
          en: "Omana's ticket named her coach and her berth, so her bed travelled booked ahead of her.",
          hi: "ओमना के टिकट पर उसका डिब्बा और बर्थ लिखी थी — उसका बिस्तर उससे पहले ही बुक होकर चल रहा था।",
          mr: "ओमनाच्या तिकिटावर तिचा डबा आणि बर्थ लिहिला होता — तिचा बिछाना तिच्याआधीच आरक्षित होऊन धावत होता.",
        },
        pair: {
          left: { en: "The berths", hi: "बर्थें", mr: "बर्थ" },
          right: { en: "beds by night", hi: "रात के बिस्तर", mr: "रात्रीचे बिछाने" },
        },
      },
      {
        id: "longtrain",
        name: {
          en: "The long-distance train",
          hi: "लंबी दूरी की रेल",
          mr: "लांब पल्ल्याची रेल्वे",
        },
        kind: "train-life",
        prompt: {
          en: "What kind of train carries Omana for two whole days and nights, crossing several states without her changing seats?",
          hi: "कौन-सी रेल ओमना को पूरे दो दिन-रात ले चलती है, कई राज्य पार करती हुई, बिना सीट बदले?",
          mr: "कोणती रेल्वे ओमनाला अख्खे दोन दिवस-रात्री नेते, अनेक राज्ये ओलांडत, जागा न बदलता?",
        },
        statement: {
          en: "The long-distance train runs day and night for two days, crossing state after state on one ticket.",
          hi: "लंबी दूरी की रेल दो दिन-रात चलती है — एक ही टिकट पर राज्य-दर-राज्य पार करती।",
          mr: "लांब पल्ल्याची रेल्वे दोन दिवस-रात्री धावते — एकाच तिकिटावर राज्यामागून राज्य ओलांडत.",
        },
      },
      {
        id: "greeningland",
        name: {
          en: "The land turning green",
          hi: "हरी होती धरती",
          mr: "हिरवी होत जाणारी भूमी",
        },
        kind: "train-life",
        prompt: {
          en: "As the train runs south toward Kerala, what change does Omana see spreading outside — dry fields giving way to what?",
          hi: "रेल के दक्षिण में केरल की ओर बढ़ने पर ओमना बाहर क्या बदलता देखती है — सूखे खेत किसे जगह देते हैं?",
          mr: "रेल्वे दक्षिणेकडे केरळकडे धावताना ओमना बाहेर काय बदलताना पाहते — कोरडी शेते कशाला जागा देतात?",
        },
        statement: {
          en: "As the train runs south the land turns greener — paddy fields, water and coconut palms fill the window near Kerala.",
          hi: "रेल के दक्षिण बढ़ते-बढ़ते धरती हरी होती जाती है — केरल के पास खिड़की धान, पानी और नारियल के पेड़ों से भर जाती है।",
          mr: "रेल्वे दक्षिणेकडे धावता धावता भूमी हिरवी होत जाते — केरळजवळ खिडकी भात, पाणी आणि नारळांच्या झाडांनी भरते.",
        },
        pair: {
          left: { en: "Nearing Kerala", hi: "केरल के पास", mr: "केरळजवळ" },
          right: {
            en: "coconut palms in the window",
            hi: "खिड़की में नारियल के पेड़",
            mr: "खिडकीत नारळाची झाडे",
          },
        },
      },
      {
        id: "platform",
        name: { en: "The railway platform", hi: "रेलवे प्लेटफ़ॉर्म", mr: "रेल्वे फलाट" },
        kind: "train-life",
        prompt: {
          en: "Where do travellers wait with their luggage for the train to draw in beside them?",
          hi: "मुसाफ़िर सामान लिए कहाँ प्रतीक्षा करते हैं कि रेल उनके बग़ल में आ लगे?",
          mr: "प्रवासी सामानासह कुठे वाट पाहतात की रेल्वे त्यांच्या शेजारी येऊन लागावी?",
        },
        statement: {
          en: "The platform is where travellers wait — trains draw in beside it so doors open level with the crowd.",
          hi: "प्लेटफ़ॉर्म प्रतीक्षा की जगह है — रेल उसी के बग़ल में लगती है ताकि दरवाज़े भीड़ की ऊँचाई पर खुलें।",
          mr: "फलाट ही वाट पाहण्याची जागा — रेल्वे त्याच्याच शेजारी लागते म्हणजे दारे गर्दीच्या उंचीवर उघडतात.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put Omana's journey in order: the TC checks her ticket aboard; she waits on the platform; the family buys tickets; the train draws in and she boards. Which order is right?",
          hi: "ओमना का सफ़र क्रम में रखिए: टीसी गाड़ी में टिकट जाँचता है; वह प्लेटफ़ॉर्म पर प्रतीक्षा करती है; परिवार टिकट ख़रीदता है; रेल आ लगती है और वह चढ़ती है। कौन-सा क्रम सही है?",
          mr: "ओमनाचा प्रवास क्रमाने लावा: टीसी गाडीत तिकीट तपासतो; ती फलाटावर वाट पाहते; कुटुंब तिकिटे घेते; रेल्वे येऊन लागते आणि ती चढते. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "tickets bought → platform wait → train boarded → TC checks",
            hi: "टिकट ख़रीदे → प्लेटफ़ॉर्म पर प्रतीक्षा → रेल में चढ़े → टीसी की जाँच",
            mr: "तिकिटे घेतली → फलाटावर वाट → रेल्वेत चढले → टीसीची तपासणी",
          },
          {
            en: "platform wait → TC checks → tickets bought → train boarded",
            hi: "प्लेटफ़ॉर्म पर प्रतीक्षा → टीसी की जाँच → टिकट ख़रीदे → रेल में चढ़े",
            mr: "फलाटावर वाट → टीसीची तपासणी → तिकिटे घेतली → रेल्वेत चढले",
          },
          {
            en: "train boarded → tickets bought → platform wait → TC checks",
            hi: "रेल में चढ़े → टिकट ख़रीदे → प्लेटफ़ॉर्म पर प्रतीक्षा → टीसी की जाँच",
            mr: "रेल्वेत चढले → तिकिटे घेतली → फलाटावर वाट → टीसीची तपासणी",
          },
          {
            en: "TC checks → train boarded → platform wait → tickets bought",
            hi: "टीसी की जाँच → रेल में चढ़े → प्लेटफ़ॉर्म पर प्रतीक्षा → टिकट ख़रीदे",
            mr: "टीसीची तपासणी → रेल्वेत चढले → फलाटावर वाट → तिकिटे घेतली",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each step needs the one before: no platform without a ticket to travel on, no boarding before the train arrives at that platform, and the TC can only check a ticket already bought, aboard a train already boarded. The journey's paper trail runs in one direction.",
          hi: "हर क़दम को पिछला चाहिए: बिना टिकट के प्लेटफ़ॉर्म कैसा, रेल के आए बिना चढ़ना कैसा, और टीसी वही टिकट जाँच सकता है जो ख़रीदा जा चुका हो — उसी रेल में जो पकड़ी जा चुकी हो। सफ़र की काग़ज़ी डोर एक ही दिशा में चलती है।",
          mr: "प्रत्येक पावलाला मागचे हवे: तिकिटाशिवाय फलाट कसला, रेल्वे आल्याशिवाय चढणे कसले, आणि टीसी तेच तिकीट तपासू शकतो जे घेतले गेले आहे — त्याच गाडीत जी पकडली गेली आहे. प्रवासाची कागदी दोरी एकाच दिशेने जाते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Omana boarded in dusty Ahmedabad; two days later the same window is full of water, paddy and coconut trees. The train did not change — what did?",
          hi: "ओमना धूल भरे अहमदाबाद में चढ़ी; दो दिन बाद वही खिड़की पानी, धान और नारियल के पेड़ों से भरी है। रेल तो नहीं बदली — तो क्या बदला?",
          mr: "ओमना धुळकट अहमदाबादेत चढली; दोन दिवसांनी तीच खिडकी पाणी, भात आणि नारळांच्या झाडांनी भरली आहे. रेल्वे बदलली नाही — मग काय बदलले?",
        },
        choices: [
          {
            en: "The land itself — India's regions differ in rain and soil, and two days of rails cross from dry country into wet, green country",
            hi: "धरती ही — भारत के प्रदेश बारिश और मिट्टी में अलग-अलग हैं, और पटरियों के दो दिन सूखे प्रदेश से भीगे, हरे प्रदेश तक ले जाते हैं",
            mr: "भूमीच — भारताचे प्रदेश पाऊस आणि मातीत वेगवेगळे आहेत, आणि रुळांचे दोन दिवस कोरड्या प्रदेशातून ओल्या, हिरव्या प्रदेशात नेतात",
          },
          {
            en: "The seasons — two days aboard turned summer into the rains",
            hi: "मौसम — रेल के दो दिनों में गर्मी बरसात बन गई",
            mr: "ऋतू — गाडीतल्या दोन दिवसांत उन्हाळ्याचा पावसाळा झाला",
          },
          {
            en: "Omana's eyes grew used to the window and saw more",
            hi: "ओमना की आँखें खिड़की की अभ्यस्त हो गईं और ज़्यादा देखने लगीं",
            mr: "ओमनाचे डोळे खिडकीला सरावले आणि जास्त पाहू लागले",
          },
          {
            en: "Gardeners plant the trees along the track for travellers",
            hi: "माली पटरी किनारे मुसाफ़िरों के लिए पेड़ लगाते हैं",
            mr: "माळी रुळांकाठी प्रवाशांसाठी झाडे लावतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Two days is far too short for seasons to turn — but long enough for rails to cross half of India. Gujarat's dry fields and Kerala's wet green ones exist at the same moment; the train simply carried Omana from one to the other. A long journey is a geography lesson read at window-speed.",
          hi: "मौसम बदलने के लिए दो दिन बहुत कम हैं — पर पटरियों के लिए आधा भारत पार करने को काफ़ी। गुजरात के सूखे खेत और केरल के भीगे हरे खेत एक ही पल में मौजूद हैं; रेल ने बस ओमना को एक से दूसरे तक पहुँचा दिया। लंबा सफ़र खिड़की की रफ़्तार से पढ़ा भूगोल का पाठ है।",
          mr: "ऋतू बदलायला दोन दिवस फारच थोडे — पण रुळांना अर्धा भारत ओलांडायला पुरेसे. गुजरातची कोरडी शेते आणि केरळची ओली हिरवी शेते एकाच क्षणी अस्तित्वात आहेत; रेल्वेने फक्त ओमनाला एकातून दुसऱ्यात पोहोचवले. लांबचा प्रवास म्हणजे खिडकीच्या वेगाने वाचलेला भूगोलाचा धडा.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 13 — A River's Tale (one river, many hands, one duty)           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-4-a-rivers-tale",
    subject: "EVS",
    classLevel: 4,
    chapter: {
      en: "Chapter 13 — A River's Tale",
      hi: "अध्याय 13 — नदी की कहानी",
      mr: "प्रकरण 13 — नदीची गोष्ट",
    },
    name: { en: "A River's Tale", hi: "नदी की कहानी", mr: "नदीची गोष्ट" },
    summary: {
      en: "From a mountain spring to the sea — the fields, ghats, boats and towns a river serves on its way, and what the towns give it back.",
      hi: "पहाड़ के सोते से समुद्र तक — रास्ते में नदी जिन खेतों, घाटों, नावों और शहरों की सेवा करती है, और शहर उसे बदले में क्या देते हैं।",
      mr: "डोंगरातल्या झऱ्यापासून समुद्रापर्यंत — वाटेत नदी ज्या शेतांची, घाटांची, होड्यांची आणि शहरांची सेवा करते, आणि शहरे तिला परत काय देतात.",
    },
    position: 13,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "spring",
        name: { en: "The mountain spring", hi: "पहाड़ का सोता", mr: "डोंगरातला झरा" },
        kind: "river-stage",
        seq: 1,
        prompt: {
          en: "Where is a river born — a thin thread of clear water starting high among the rocks?",
          hi: "नदी जन्म कहाँ लेती है — चट्टानों के बीच ऊँचाई से शुरू होती साफ़ पानी की पतली धार?",
          mr: "नदी जन्म कुठे घेते — खडकांमध्ये उंचावर सुरू होणारी नितळ पाण्याची बारीक धार?",
        },
        statement: {
          en: "The river begins as a mountain spring — a thin, clear thread trickling out high among the rocks.",
          hi: "नदी पहाड़ के सोते से शुरू होती है — चट्टानों के बीच ऊँचाई पर रिसती पतली, साफ़ धार।",
          mr: "नदी डोंगरातल्या झऱ्याने सुरू होते — खडकांमध्ये उंचावर झिरपणारी बारीक, नितळ धार.",
        },
        pair: {
          left: { en: "The spring", hi: "सोता", mr: "झरा" },
          right: {
            en: "the river's clear beginning",
            hi: "नदी की साफ़ शुरुआत",
            mr: "नदीची नितळ सुरुवात",
          },
        },
      },
      {
        id: "canalfields",
        name: {
          en: "The canal to the fields",
          hi: "खेतों की नहर",
          mr: "शेतांचा कालवा",
        },
        kind: "river-stage",
        seq: 2,
        prompt: {
          en: "What carries the river's water sideways into the farmland, so crops can drink far from the bank?",
          hi: "नदी का पानी खेतों की ओर मोड़कर कौन ले जाता है, ताकि किनारे से दूर की फ़सलें भी पी सकें?",
          mr: "नदीचे पाणी शेतीकडे वळवून कोण नेतो, म्हणजे काठापासून दूरची पिकेही पिऊ शकतात?",
        },
        statement: {
          en: "Canals lead the river's water into the fields — crops far from the bank drink through these dug channels.",
          hi: "नहरें नदी का पानी खेतों तक ले जाती हैं — किनारे से दूर की फ़सलें इन्हीं खुदी नालियों से पीती हैं।",
          mr: "कालवे नदीचे पाणी शेतांपर्यंत नेतात — काठापासून दूरची पिके या खोदलेल्या पाटांतून पितात.",
        },
        pair: {
          left: { en: "The canal", hi: "नहर", mr: "कालवा" },
          right: {
            en: "river water for far fields",
            hi: "दूर के खेतों को नदी-जल",
            mr: "दूरच्या शेतांना नदीचे पाणी",
          },
        },
      },
      {
        id: "ghat",
        name: { en: "The washing ghat", hi: "धोबी घाट", mr: "धुण्याचा घाट" },
        kind: "river-people",
        prompt: {
          en: "On which riverside steps do clothes get soaped, beaten and rinsed each morning?",
          hi: "नदी किनारे की किन सीढ़ियों पर रोज़ सुबह कपड़े साबुन लगाकर पटके और खँगाले जाते हैं?",
          mr: "नदीकाठच्या कोणत्या पायऱ्यांवर रोज सकाळी कपडे साबण लावून आपटले आणि खंगाळले जातात?",
        },
        statement: {
          en: "At the washing ghat the clothes of the town are soaped, beaten on stone and rinsed in the river.",
          hi: "धोबी घाट पर शहर के कपड़े साबुन लगाकर पत्थर पर पटके और नदी में खँगाले जाते हैं।",
          mr: "धुण्याच्या घाटावर गावाचे कपडे साबण लावून दगडावर आपटले आणि नदीत खंगाळले जातात.",
        },
        pair: {
          left: { en: "The washing ghat", hi: "धोबी घाट", mr: "धुण्याचा घाट" },
          right: {
            en: "clothes beaten on stone",
            hi: "पत्थर पर पटकते कपड़े",
            mr: "दगडावर आपटलेले कपडे",
          },
        },
      },
      {
        id: "fisherman",
        name: { en: "The fisherman", hi: "मछुआरा", mr: "कोळी" },
        kind: "river-people",
        prompt: {
          en: "Who casts a net from a narrow boat at dawn, and eats or sells what the river gives?",
          hi: "पौ फटते सँकरी नाव से जाल कौन फेंकता है, और नदी जो दे उसे खाता या बेचता है?",
          mr: "पहाटे अरुंद होडीतून जाळे कोण टाकतो, आणि नदी देईल ते खातो वा विकतो?",
        },
        statement: {
          en: "The fisherman casts his net from a narrow boat — the river's fish are his food and his earning.",
          hi: "मछुआरा सँकरी नाव से जाल डालता है — नदी की मछलियाँ उसका भोजन भी हैं और कमाई भी।",
          mr: "कोळी अरुंद होडीतून जाळे टाकतो — नदीतले मासे हेच त्याचे अन्न आणि कमाई.",
        },
        pair: {
          left: { en: "The fisherman", hi: "मछुआरा", mr: "कोळी" },
          right: { en: "a net at dawn", hi: "भोर का जाल", mr: "पहाटेचे जाळे" },
        },
      },
      {
        id: "towndrains",
        name: { en: "The town's drains", hi: "शहर की नालियाँ", mr: "शहराची गटारे" },
        kind: "river-stage",
        seq: 3,
        prompt: {
          en: "As the river passes the big town, what pours into it and turns the clear water grey?",
          hi: "बड़े शहर से गुज़रते हुए नदी में क्या उँडेला जाता है, जो साफ़ पानी को मटमैला कर देता है?",
          mr: "मोठ्या शहराजवळून जाताना नदीत काय ओतले जाते, जे नितळ पाणी करडे करते?",
        },
        statement: {
          en: "The town's drains empty into the passing river — soap, waste and rubbish turn the clear water grey.",
          hi: "शहर की नालियाँ गुज़रती नदी में खुलती हैं — साबुन, कचरा और गंदगी साफ़ पानी को मटमैला कर देते हैं।",
          mr: "शहराची गटारे जाणाऱ्या नदीत रिकामी होतात — साबण, कचरा आणि घाण नितळ पाणी करडे करतात.",
        },
        detail: {
          en: "What one town pours in, the next town downstream must drink or clean.",
          hi: "जो एक शहर उँडेलता है, वह नीचे के अगले शहर को पीना या साफ़ करना पड़ता है।",
          mr: "एक शहर जे ओतते, ते खालच्या पुढच्या शहराला प्यावे किंवा स्वच्छ करावे लागते.",
        },
        extra: {
          en: "The river cannot refuse anything thrown into it — it can only carry it onward.",
          hi: "नदी उसमें फेंकी कोई चीज़ लौटा नहीं सकती — बस आगे ढो सकती है।",
          mr: "नदी तिच्यात टाकलेले काही नाकारू शकत नाही — फक्त पुढे वाहून नेऊ शकते.",
        },
        pair: {
          left: { en: "The town's drains", hi: "शहर की नालियाँ", mr: "शहराची गटारे" },
          right: {
            en: "grey water downstream",
            hi: "नीचे की ओर मटमैला पानी",
            mr: "खाली वाहणारे करडे पाणी",
          },
        },
      },
      {
        id: "boatman",
        name: { en: "The boatman", hi: "नाविक", mr: "नावाडी" },
        kind: "river-people",
        prompt: {
          en: "Where the river is wide and the bridge is far, who rows people from one bank to the other?",
          hi: "जहाँ नदी चौड़ी है और पुल दूर, वहाँ लोगों को एक किनारे से दूसरे तक कौन खेता है?",
          mr: "जिथे नदी रुंद आहे आणि पूल दूर, तिथे माणसांना एका काठावरून दुसऱ्या काठावर कोण वल्हवत नेतो?",
        },
        statement: {
          en: "The boatman ferries people and loads across the wide river, trip after trip, where no bridge stands near.",
          hi: "नाविक चौड़ी नदी के आर-पार लोगों और बोझ को फेरा-दर-फेरा ले जाता है, जहाँ पास कोई पुल नहीं।",
          mr: "नावाडी रुंद नदीपार माणसे आणि ओझी फेरीमागून फेरी नेतो, जिथे जवळ पूल नाही.",
        },
      },
      {
        id: "sea",
        name: { en: "The sea", hi: "समुद्र", mr: "समुद्र" },
        kind: "river-stage",
        seq: 4,
        prompt: {
          en: "Where does the river's long journey end, its water joining a vastness that no far bank closes?",
          hi: "नदी का लंबा सफ़र कहाँ ख़त्म होता है — उसका पानी उस विशालता से मिलता है जिसे कोई दूसरा किनारा नहीं बाँधता?",
          mr: "नदीचा लांब प्रवास कुठे संपतो — तिचे पाणी त्या अफाटतेत मिळते जिला पलीकडचा काठ नाही?",
        },
        statement: {
          en: "The river ends in the sea — all its gathered water, clean and dirty alike, pours into the salt vastness.",
          hi: "नदी समुद्र में समाप्त होती है — उसका सारा बटोरा पानी, साफ़ हो या गंदा, खारी विशालता में जा मिलता है।",
          mr: "नदी समुद्रात संपते — तिचे सारे जमवलेले पाणी, स्वच्छ असो वा गढूळ, खाऱ्या अफाटतेत जाऊन मिळते.",
        },
        pair: {
          left: { en: "The sea", hi: "समुद्र", mr: "समुद्र" },
          right: {
            en: "the journey's end",
            hi: "सफ़र का अंत",
            mr: "प्रवासाचा शेवट",
          },
        },
      },
    ],
    hard: [
      {
        level: 6,
        stem: {
          en: "The upstream town washes, bathes and empties its drains in the river; the downstream town must drink from the same river. Who holds the downstream town's health in their hands?",
          hi: "ऊपर का शहर नदी में धोता, नहाता और नालियाँ खोलता है; नीचे के शहर को उसी नदी से पीना है। नीचे के शहर की सेहत किसके हाथों में है?",
          mr: "वरचे शहर नदीत धुते, न्हाते आणि गटारे सोडते; खालच्या शहराला त्याच नदीतून प्यायचे आहे. खालच्या शहराचे आरोग्य कोणाच्या हातात आहे?",
        },
        choices: [
          {
            en: "The upstream town's — what it pours in flows straight to its neighbour's drinking pots",
            hi: "ऊपर वाले शहर के — वह जो उँडेलता है, वही सीधे पड़ोसी के पीने के घड़ों तक बहता है",
            mr: "वरच्या शहराच्या — ते जे ओतते, तेच थेट शेजाऱ्याच्या पिण्याच्या घागरींपर्यंत वाहते",
          },
          {
            en: "Nobody's — a river cleans itself completely every few metres",
            hi: "किसी के नहीं — नदी हर कुछ मीटर पर ख़ुद को पूरा साफ़ कर लेती है",
            mr: "कोणाच्याच नाही — नदी दर काही मीटरांवर स्वतःला पूर्ण स्वच्छ करते",
          },
          {
            en: "Only the downstream town's — each town must simply manage what reaches it",
            hi: "केवल नीचे वाले शहर के — हर शहर को जो पहुँचे उसे सँभालना ही है",
            mr: "फक्त खालच्या शहराच्या — प्रत्येक शहराने जे पोहोचेल ते निभावायचेच",
          },
          {
            en: "The sea's — everything is settled where the river ends",
            hi: "समुद्र के — सब कुछ वहीं तय होता है जहाँ नदी ख़त्म होती है",
            mr: "समुद्राच्या — सारे तिथेच ठरते जिथे नदी संपते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A river runs one way, so a town never drinks its own waste — it drinks its upstream neighbour's. That is the chapter's quiet lesson in responsibility: keeping the river clean is not a kindness a town does for itself but a duty it owes to every town below it. And since almost every town has another below it, the duty belongs to all.",
          hi: "नदी एक ही दिशा में बहती है, इसलिए कोई शहर अपनी गंदगी नहीं पीता — वह अपने ऊपर वाले पड़ोसी की पीता है। यही अध्याय का ज़िम्मेदारी वाला चुपचाप सबक़ है: नदी को साफ़ रखना कोई शहर अपने लिए नहीं करता, वह हर नीचे वाले शहर का उस पर बक़ाया फ़र्ज़ है। और चूँकि लगभग हर शहर के नीचे कोई और शहर है, यह फ़र्ज़ सबका है।",
          mr: "नदी एकाच दिशेने वाहते, म्हणून कोणतेही शहर स्वतःची घाण पीत नाही — ते वरच्या शेजाऱ्याची पिते. हाच धड्याचा जबाबदारीचा शांत पाठ: नदी स्वच्छ ठेवणे हे शहर स्वतःसाठी करत नाही, तर खालच्या प्रत्येक शहराचे त्याच्यावरचे ते देणे आहे. आणि जवळजवळ प्रत्येक शहराखाली दुसरे शहर असल्याने, हे देणे साऱ्यांचे आहे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The same river waters fields, washes clothes, carries boats, gives fish and takes the drains. If it dried up for one season, who all would feel it?",
          hi: "एक ही नदी खेत सींचती, कपड़े धुलवाती, नावें चलवाती, मछलियाँ देती और नालियाँ ढोती है। अगर वह एक मौसम सूख जाए, तो किस-किस को महसूस होगा?",
          mr: "एकच नदी शेते भिजवते, कपडे धुऊ देते, होड्या चालवते, मासे देते आणि गटारे वाहते. ती एक हंगाम आटली, तर कोणाकोणाला जाणवेल?",
        },
        choices: [
          {
            en: "Everyone in the tale — farmer, washerman, boatman, fisherman and both towns — because all their different works drink from one water",
            hi: "कहानी के सभी — किसान, धोबी, नाविक, मछुआरा और दोनों शहर — क्योंकि उनके अलग-अलग सारे काम एक ही पानी से चलते हैं",
            mr: "गोष्टीतले सारे — शेतकरी, परीट, नावाडी, कोळी आणि दोन्ही शहरे — कारण त्यांची निरनिराळी सारी कामे एकाच पाण्यावर चालतात",
          },
          {
            en: "Only the fisherman — the others can use wells",
            hi: "केवल मछुआरा — बाक़ी कुएँ इस्तेमाल कर सकते हैं",
            mr: "फक्त कोळी — बाकीचे विहिरी वापरू शकतात",
          },
          {
            en: "Only the farmers — fields need the most water",
            hi: "केवल किसान — खेतों को सबसे ज़्यादा पानी चाहिए",
            mr: "फक्त शेतकरी — शेतांना सर्वाधिक पाणी लागते",
          },
          {
            en: "Nobody for long — rivers return in a week or two",
            hi: "किसी को ज़्यादा दिन नहीं — नदियाँ हफ़्ते-दो हफ़्ते में लौट आती हैं",
            mr: "कोणालाच फार काळ नाही — नद्या आठ-पंधरा दिवसांत परततात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Walk back through the chapter and count the hands in the river: the canal's crops wither, the ghat's washing stops, the boatman's ferry grounds, the fisherman's net comes up empty, and two towns queue at wells that a whole valley now shares. One river is not one thing — it is everyone's different livelihood flowing in a single channel, which is exactly why its drying is everyone's disaster.",
          hi: "अध्याय में लौटकर नदी में डूबे हाथ गिनिए: नहर की फ़सलें मुरझाती हैं, घाट की धुलाई रुकती है, नाविक की नाव ज़मीन पकड़ती है, मछुआरे का जाल ख़ाली उठता है, और दो शहर उन कुओं की क़तार में लगते हैं जो अब पूरी घाटी बाँट रही है। एक नदी एक चीज़ नहीं — एक ही धारा में बहती सबकी अलग-अलग रोज़ी है, और ठीक इसीलिए उसका सूखना सबकी आपदा है।",
          mr: "धड्यात परत जाऊन नदीतले हात मोजा: कालव्याची पिके कोमेजतात, घाटाची धुणी थांबते, नावाड्याची होडी जमीन धरते, कोळ्याचे जाळे रिकामे निघते, आणि दोन शहरे त्या विहिरींच्या रांगेत उभी राहतात ज्या आता अख्खी दरी वाटून घेते. एक नदी म्हणजे एक गोष्ट नव्हे — एकाच प्रवाहात वाहणारी साऱ्यांची निरनिराळी रोजीरोटी, आणि नेमके म्हणूनच तिचे आटणे ही साऱ्यांची आपत्ती.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 23 — Pochampalli (the weaver town and its dyed-first patterns)  */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-4-pochampalli",
    subject: "EVS",
    classLevel: 4,
    chapter: {
      en: "Chapter 23 — Pochampalli",
      hi: "अध्याय 23 — पोचमपल्ली",
      mr: "प्रकरण 23 — पोचमपल्ली",
    },
    name: { en: "Pochampalli", hi: "पोचमपल्ली", mr: "पोचमपल्ली" },
    summary: {
      en: "A Telangana town where whole families weave — silk threads dyed into patterns BEFORE the loom, and saris that carry the town's own name.",
      hi: "तेलंगाना का एक क़स्बा जहाँ पूरे परिवार बुनते हैं — रेशमी धागे करघे से पहले ही पैटर्न में रँगे जाते हैं, और साड़ियाँ क़स्बे का अपना नाम ओढ़ती हैं।",
      mr: "तेलंगणातले एक गाव जिथे अख्खी कुटुंबे विणतात — रेशमी धागे मागाआधीच नक्षीत रंगवले जातात, आणि साड्या गावाचेच नाव लेवून मिरवतात.",
    },
    position: 23,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "pochampallitown",
        name: { en: "Pochampalli", hi: "पोचमपल्ली", mr: "पोचमपल्ली" },
        kind: "weaving-world",
        prompt: {
          en: "Which Telangana town is so famous for its weaving that its saris are called by the town's own name?",
          hi: "तेलंगाना का कौन-सा क़स्बा बुनाई के लिए इतना मशहूर है कि उसकी साड़ियाँ क़स्बे के ही नाम से पुकारी जाती हैं?",
          mr: "तेलंगणातले कोणते गाव विणकामासाठी इतके प्रसिद्ध आहे की तिथल्या साड्या गावाच्याच नावाने ओळखल्या जातात?",
        },
        statement: {
          en: "Pochampalli is a weaving town — its silk saris are known across the country by the town's own name.",
          hi: "पोचमपल्ली बुनकरों का क़स्बा है — उसकी रेशमी साड़ियाँ देश भर में क़स्बे के ही नाम से जानी जाती हैं।",
          mr: "पोचमपल्ली हे विणकरांचे गाव — तिथल्या रेशमी साड्या देशभर गावाच्याच नावाने ओळखल्या जातात.",
        },
        pair: {
          left: { en: "Pochampalli", hi: "पोचमपल्ली", mr: "पोचमपल्ली" },
          right: {
            en: "saris named for a town",
            hi: "क़स्बे के नाम की साड़ियाँ",
            mr: "गावाच्या नावाच्या साड्या",
          },
        },
      },
      {
        id: "loom",
        name: { en: "The loom", hi: "करघा", mr: "माग" },
        kind: "weaving-world",
        prompt: {
          en: "Which large wooden frame, filling a whole room of the weaver's house, crosses thread over thread into cloth?",
          hi: "बुनकर के घर का पूरा कमरा घेरने वाला कौन-सा बड़ा लकड़ी का ढाँचा धागे पर धागा चढ़ाकर कपड़ा बुनता है?",
          mr: "विणकराच्या घरातली अख्खी खोली व्यापणारा कोणता मोठा लाकडी सांगाडा धाग्यावर धागा चढवून कापड विणतो?",
        },
        statement: {
          en: "The loom stands inside the weaver's own house — a wooden frame where crossing threads slowly become cloth.",
          hi: "करघा बुनकर के अपने घर में खड़ा है — लकड़ी का ढाँचा, जहाँ आड़े-तिरछे धागे धीरे-धीरे कपड़ा बनते हैं।",
          mr: "माग विणकराच्या स्वतःच्या घरात उभा असतो — लाकडी सांगाडा, जिथे आडवे-उभे धागे हळूहळू कापड होतात.",
        },
        pair: {
          left: { en: "The loom", hi: "करघा", mr: "माग" },
          right: {
            en: "cloth grown thread by thread",
            hi: "धागे-धागे उगता कपड़ा",
            mr: "धाग्याधाग्याने वाढणारे कापड",
          },
        },
      },
      {
        id: "ikat",
        name: {
          en: "Tie-and-dye (ikat)",
          hi: "बाँधकर रँगाई (इकत)",
          mr: "बांधून रंगवणे (इकत)",
        },
        kind: "weaving-world",
        prompt: {
          en: "In Pochampalli's special way, when does the pattern get its colour — on the finished cloth, or on the THREADS before weaving begins?",
          hi: "पोचमपल्ली के ख़ास ढंग में पैटर्न को रंग कब मिलता है — बुने हुए कपड़े पर, या बुनाई शुरू होने से पहले धागों पर?",
          mr: "पोचमपल्लीच्या खास पद्धतीत नक्षीला रंग कधी मिळतो — विणलेल्या कापडावर, की विणकाम सुरू होण्याआधी धाग्यांवर?",
        },
        statement: {
          en: "In ikat the threads are tied and dyed BEFORE weaving — the pattern hides in the threads and appears as the cloth grows.",
          hi: "इकत में धागे बुनाई से पहले बाँधकर रँगे जाते हैं — पैटर्न धागों में छिपा रहता है और कपड़े के बढ़ने के साथ उभरता है।",
          mr: "इकतमध्ये धागे विणण्याआधी बांधून रंगवले जातात — नक्षी धाग्यांत लपलेली असते आणि कापड वाढेल तशी उमटत जाते.",
        },
        detail: {
          en: "The weaver must see the finished design in the mind's eye while dyeing plain thread.",
          hi: "बुनकर को सादा धागा रँगते समय पूरा डिज़ाइन मन की आँख से देखना पड़ता है।",
          mr: "विणकराला साधा धागा रंगवतानाच पूर्ण नक्षी मनाच्या डोळ्याने पाहावी लागते.",
        },
        extra: {
          en: "One badly dyed bundle can spoil a pattern that only shows weeks later on the loom.",
          hi: "एक ग़लत रँगा गट्ठर वह पैटर्न बिगाड़ सकता है जो हफ़्तों बाद करघे पर दिखेगा।",
          mr: "एक चुकीचा रंगवलेला जुडगा ती नक्षी बिघडवू शकतो जी आठवड्यांनी मागावर दिसणार असते.",
        },
        pair: {
          left: { en: "Ikat", hi: "इकत", mr: "इकत" },
          right: {
            en: "dyed before it is woven",
            hi: "बुनने से पहले रँगा हुआ",
            mr: "विणण्याआधी रंगवलेले",
          },
        },
      },
      {
        id: "weaverfamily",
        name: { en: "The weaver family", hi: "बुनकर परिवार", mr: "विणकर कुटुंब" },
        kind: "weaving-world",
        prompt: {
          en: "In Pochampalli, who all work on one sari — winding thread, tying, dyeing, weaving — old and young together?",
          hi: "पोचमपल्ली में एक साड़ी पर कौन-कौन काम करते हैं — धागा लपेटना, बाँधना, रँगना, बुनना — बड़े-छोटे साथ-साथ?",
          mr: "पोचमपल्लीत एका साडीवर कोण कोण काम करतात — धागा गुंडाळणे, बांधणे, रंगवणे, विणणे — लहानथोर मिळून?",
        },
        statement: {
          en: "The whole family works on a sari — children wind thread, elders tie and dye, and the loom is shared turn by turn.",
          hi: "पूरी साड़ी पर पूरा परिवार लगता है — बच्चे धागा लपेटते हैं, बड़े बाँधते-रँगते हैं, और करघा बारी-बारी सबका है।",
          mr: "अख्ख्या साडीवर अख्खे कुटुंब राबते — मुले धागा गुंडाळतात, मोठे बांधतात-रंगवतात, आणि माग आळीपाळीने साऱ्यांचा.",
        },
        pair: {
          left: { en: "The weaver family", hi: "बुनकर परिवार", mr: "विणकर कुटुंब" },
          right: {
            en: "every hand on one sari",
            hi: "एक साड़ी पर सबके हाथ",
            mr: "एका साडीवर साऱ्यांचे हात",
          },
        },
      },
      {
        id: "silk",
        name: { en: "Silk thread", hi: "रेशमी धागा", mr: "रेशमी धागा" },
        kind: "weaving-world",
        prompt: {
          en: "Which fine, shining thread gives the Pochampalli sari its soft gleam?",
          hi: "कौन-सा महीन, चमकीला धागा पोचमपल्ली साड़ी को उसकी मुलायम आभा देता है?",
          mr: "कोणता बारीक, चमकदार धागा पोचमपल्ली साडीला तिची मऊ झळाळी देतो?",
        },
        statement: {
          en: "Silk is the sari's shining thread — fine, strong and softly gleaming, costlier than cotton.",
          hi: "रेशम साड़ी का चमकता धागा है — महीन, मज़बूत, मुलायम आभा वाला, सूत से महँगा।",
          mr: "रेशीम हा साडीचा झळाळता धागा — बारीक, मजबूत, मऊ चमकीचा, सुताहून महाग.",
        },
      },
      {
        id: "trader",
        name: { en: "The sari trader", hi: "साड़ियों का व्यापारी", mr: "साड्यांचा व्यापारी" },
        kind: "weaving-world",
        prompt: {
          en: "Who buys the finished saris from the weavers' lanes and carries them to shops in far cities?",
          hi: "बुनकरों की गलियों से तैयार साड़ियाँ कौन ख़रीदता है और दूर के शहरों की दुकानों तक ले जाता है?",
          mr: "विणकरांच्या गल्ल्यांतून तयार साड्या कोण विकत घेतो आणि दूरच्या शहरांतल्या दुकानांत नेतो?",
        },
        statement: {
          en: "The trader buys saris from the weavers and sells them in city shops — the price there is far above what the weaver was paid.",
          hi: "व्यापारी बुनकरों से साड़ियाँ ख़रीदकर शहरों की दुकानों में बेचता है — वहाँ का दाम बुनकर को मिले दाम से कहीं ऊपर होता है।",
          mr: "व्यापारी विणकरांकडून साड्या घेऊन शहरांतल्या दुकानांत विकतो — तिथला भाव विणकराला मिळालेल्या भावाहून कितीतरी वर असतो.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put a Pochampalli sari's making in order: the loom weaves the cloth; the threads are tied and dyed; the trader carries it to the city; the dyed threads are set on the loom. Which order is right?",
          hi: "पोचमपल्ली साड़ी का बनना क्रम में रखिए: करघा कपड़ा बुनता है; धागे बाँधकर रँगे जाते हैं; व्यापारी उसे शहर ले जाता है; रँगे धागे करघे पर चढ़ाए जाते हैं। कौन-सा क्रम सही है?",
          mr: "पोचमपल्ली साडीचे बनणे क्रमाने लावा: माग कापड विणतो; धागे बांधून रंगवले जातात; व्यापारी ती शहरात नेतो; रंगवलेले धागे मागावर चढवले जातात. कोणता क्रम बरोबर?",
        },
        choices: [
          {
            en: "tie and dye → set on the loom → weave → to the city",
            hi: "बाँधकर रँगाई → करघे पर चढ़ाना → बुनाई → शहर को",
            mr: "बांधून रंगवणे → मागावर चढवणे → विणणे → शहराकडे",
          },
          {
            en: "weave → tie and dye → set on the loom → to the city",
            hi: "बुनाई → बाँधकर रँगाई → करघे पर चढ़ाना → शहर को",
            mr: "विणणे → बांधून रंगवणे → मागावर चढवणे → शहराकडे",
          },
          {
            en: "set on the loom → to the city → tie and dye → weave",
            hi: "करघे पर चढ़ाना → शहर को → बाँधकर रँगाई → बुनाई",
            mr: "मागावर चढवणे → शहराकडे → बांधून रंगवणे → विणणे",
          },
          {
            en: "to the city → weave → set on the loom → tie and dye",
            hi: "शहर को → बुनाई → करघे पर चढ़ाना → बाँधकर रँगाई",
            mr: "शहराकडे → विणणे → मागावर चढवणे → बांधून रंगवणे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Ikat's whole signature is the first step: colour goes onto THREAD, not cloth. So dyeing must come before the loom is dressed, the loom before any weaving, and only a finished sari can travel to the city. The second option is how ordinary printed cloth works — and exactly what Pochampalli does not do.",
          hi: "इकत की पूरी पहचान पहला क़दम है: रंग कपड़े पर नहीं, धागे पर चढ़ता है। इसलिए रँगाई करघा सजाने से पहले, करघा बुनाई से पहले, और शहर सिर्फ़ बनी हुई साड़ी जाती है। दूसरा विकल्प छपे हुए आम कपड़े का तरीक़ा है — और ठीक वही जो पोचमपल्ली नहीं करती।",
          mr: "इकतची सारी ओळख पहिल्या पावलात आहे: रंग कापडावर नव्हे, धाग्यावर चढतो. म्हणून रंगवणे माग सजवण्याआधी, माग विणण्याआधी, आणि शहरात फक्त तयार साडी जाते. दुसरा पर्याय छापील साध्या कापडाची रीत — आणि नेमके तेच पोचमपल्ली करत नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A printer sees the design appear as he prints it; the ikat dyer colours plain threads weeks before any pattern can be seen. What must the ikat dyer have that the printer can manage without?",
          hi: "छापने वाला डिज़ाइन को छपते-छपते उभरता देख लेता है; इकत का रँगरेज़ सादे धागों को हफ़्तों पहले रँगता है, जब कोई पैटर्न दिख ही नहीं सकता। इकत वाले के पास वह क्या होना चाहिए जिसके बिना छापने वाले का काम चल जाता है?",
          mr: "छापणारा नक्षी छापता छापता उमटताना पाहतो; इकतचा रंगारी साधे धागे आठवडे आधी रंगवतो, जेव्हा कोणतीही नक्षी दिसूच शकत नाही. इकतवाल्याकडे ते काय हवे ज्याशिवाय छापणाऱ्याचे चालते?",
        },
        choices: [
          {
            en: "The whole finished pattern held in the mind — every tie placed now for a design that appears only weeks later on the loom",
            hi: "मन में थमा पूरा तैयार पैटर्न — हर गाँठ अभी, उस डिज़ाइन के लिए जो हफ़्तों बाद करघे पर उभरेगा",
            mr: "मनात धरलेली पूर्ण तयार नक्षी — प्रत्येक गाठ आत्ता, आठवड्यांनी मागावर उमटणाऱ्या नक्षीसाठी",
          },
          {
            en: "Stronger dyes than the printer's",
            hi: "छापने वाले से ज़्यादा गाढ़े रंग",
            mr: "छापणाऱ्याहून गडद रंग",
          },
          {
            en: "A bigger loom than other weavers",
            hi: "बाक़ी बुनकरों से बड़ा करघा",
            mr: "इतर विणकरांहून मोठा माग",
          },
          {
            en: "Softer silk that takes colour faster",
            hi: "जल्दी रंग पकड़ने वाला नरम रेशम",
            mr: "लवकर रंग धरणारे मऊ रेशीम",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The printer works with his eyes; the ikat dyer works with foresight. Every knot tied on plain thread is a bet on where that thread will sit in cloth that does not yet exist — and the bet is settled weeks later, thread by thread, on the loom. That invisible planning is why an ikat pattern is prized, and why the skill takes a childhood in a weaver family to learn.",
          hi: "छापने वाला आँखों से काम करता है; इकत का रँगरेज़ दूरदृष्टि से। सादे धागे पर बँधी हर गाँठ इस बात की बाज़ी है कि वह धागा उस कपड़े में कहाँ बैठेगा जो अभी है ही नहीं — और बाज़ी हफ़्तों बाद करघे पर धागा-धागा खुलती है। यही अदृश्य योजना इकत के पैटर्न को अनमोल बनाती है, और इसीलिए यह हुनर सीखने में बुनकर परिवार का पूरा बचपन लगता है।",
          mr: "छापणारा डोळ्यांनी काम करतो; इकतचा रंगारी दूरदृष्टीने. साध्या धाग्यावरची प्रत्येक गाठ ही त्या धाग्याची अजून अस्तित्वातच नसलेल्या कापडातली जागा ओळखण्याची पैज आहे — आणि ती पैज आठवड्यांनी मागावर धाग्याधाग्याने सुटते. हीच अदृश्य आखणी इकतच्या नक्षीला मोल देते, आणि म्हणूनच हे कौशल्य शिकायला विणकर कुटुंबातले अख्खे बालपण लागते.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 27 — Chuskit Goes to School (the path, not the legs)            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-4-chuskit-goes-to-school",
    subject: "EVS",
    classLevel: 4,
    chapter: {
      en: "Chapter 27 — Chuskit Goes to School",
      hi: "अध्याय 27 — चुसकित स्कूल चली",
      mr: "प्रकरण 27 — चुसकित शाळेला निघाली",
    },
    name: {
      en: "Chuskit Goes to School",
      hi: "चुसकित स्कूल चली",
      mr: "चुसकित शाळेला निघाली",
    },
    summary: {
      en: "In Ladakh, Chuskit's legs do not walk — yet she reaches school at last, on wheels, over a smoothed path and a little plank bridge, pushed by friends.",
      hi: "लद्दाख़ में चुसकित के पैर नहीं चलते — फिर भी वह आख़िरकार स्कूल पहुँचती है, पहियों पर, समतल हुई पगडंडी और तख़्ते के छोटे पुल से, दोस्तों के धकेले।",
      mr: "लडाखमध्ये चुसकितचे पाय चालत नाहीत — तरी ती अखेर शाळेत पोहोचते, चाकांवर, सपाट केलेल्या वाटेने आणि फळीच्या छोट्या पुलावरून, मित्रांनी ढकललेली.",
    },
    position: 27,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "chuskit",
        name: { en: "Chuskit", hi: "चुसकित", mr: "चुसकित" },
        kind: "person",
        seq: 1,
        prompt: {
          en: "Which girl of Ladakh, whose legs cannot walk, watched other children pass to school for years, wishing to go too?",
          hi: "लद्दाख़ की कौन-सी लड़की, जिसके पैर चल नहीं सकते, बरसों दूसरे बच्चों को स्कूल जाते देखती रही — ख़ुद जाने की चाह लिए?",
          mr: "लडाखची कोणती मुलगी, जिचे पाय चालू शकत नाहीत, वर्षानुवर्षे इतर मुलांना शाळेला जाताना पाहत राहिली — स्वतः जाण्याची आस धरून?",
        },
        statement: {
          en: "Chuskit's legs cannot walk, and for years she watched the school-going children from her window, longing to go.",
          hi: "चुसकित के पैर चल नहीं सकते, और बरसों वह खिड़की से स्कूल जाते बच्चों को देखती रही — जाने को तरसती हुई।",
          mr: "चुसकितचे पाय चालू शकत नाहीत, आणि वर्षानुवर्षे ती खिडकीतून शाळेला जाणाऱ्या मुलांना पाहत राहिली — जाण्यासाठी आसुसलेली.",
        },
        pair: {
          left: { en: "Chuskit", hi: "चुसकित", mr: "चुसकित" },
          right: {
            en: "a window full of longing",
            hi: "चाह से भरी खिड़की",
            mr: "आसेने भरलेली खिडकी",
          },
        },
      },
      {
        id: "teacher",
        name: { en: "The teacher", hi: "गुरुजी", mr: "गुरुजी" },
        kind: "person",
        seq: 2,
        prompt: {
          en: "Who came to Chuskit's house, heard her wish, and promised that school would be made possible for her?",
          hi: "चुसकित के घर कौन आए, उसकी चाह सुनी, और वचन दिया कि उसके लिए स्कूल मुमकिन किया जाएगा?",
          mr: "चुसकितच्या घरी कोण आले, तिची आस ऐकली, आणि वचन दिले की तिच्यासाठी शाळा शक्य केली जाईल?",
        },
        statement: {
          en: "The teacher came home to Chuskit, heard her wish, and set about making school possible for her.",
          hi: "गुरुजी चुसकित के घर आए, उसकी चाह सुनी, और उसके लिए स्कूल मुमकिन करने में जुट गए।",
          mr: "गुरुजी चुसकितच्या घरी आले, तिची आस ऐकली, आणि तिच्यासाठी शाळा शक्य करण्याच्या मागे लागले.",
        },
        pair: {
          left: { en: "The teacher", hi: "गुरुजी", mr: "गुरुजी" },
          right: {
            en: "a promise made at home",
            hi: "घर आकर दिया वचन",
            mr: "घरी येऊन दिलेले वचन",
          },
        },
      },
      {
        id: "wheelchair",
        name: { en: "The wheelchair", hi: "पहियों वाली कुर्सी", mr: "चाकांची खुर्ची" },
        kind: "the-way",
        seq: 3,
        prompt: {
          en: "What arrived for Chuskit that rolls where legs cannot walk — her own pair of wheels?",
          hi: "चुसकित के लिए क्या आया जो वहाँ लुढ़कता है जहाँ पैर नहीं चलते — उसके अपने पहिए?",
          mr: "चुसकितसाठी काय आले जे तिथे धावते जिथे पाय चालत नाहीत — तिची स्वतःची चाके?",
        },
        statement: {
          en: "The wheelchair became Chuskit's rolling legs — pushed along, it carries her wherever a path lets wheels go.",
          hi: "पहियों वाली कुर्सी चुसकित के लुढ़कते पैर बनी — धकेली हुई, वह उसे वहाँ तक ले जाती है जहाँ तक पगडंडी पहियों को जाने दे।",
          mr: "चाकांची खुर्ची चुसकितचे धावते पाय झाली — ढकलली की ती तिला तिथवर नेते जिथवर वाट चाकांना जाऊ देते.",
        },
        detail: {
          en: "Wheels ask something of the ground: they need it smooth enough to roll on.",
          hi: "पहिए ज़मीन से कुछ माँगते हैं: उन्हें लुढ़कने लायक़ समतल राह चाहिए।",
          mr: "चाके जमिनीकडून काही मागतात: त्यांना घरंगळण्याजोगी सपाट वाट हवी.",
        },
        extra: {
          en: "It was the first of the changes — the path and the bridge had to follow.",
          hi: "यह बदलावों में पहला था — पगडंडी और पुल को पीछे-पीछे आना ही था।",
          mr: "हा बदलांतला पहिला होता — वाट आणि पूल यांना मागोमाग यावेच लागले.",
        },
        pair: {
          left: { en: "The wheelchair", hi: "पहियों वाली कुर्सी", mr: "चाकांची खुर्ची" },
          right: { en: "her rolling legs", hi: "उसके लुढ़कते पैर", mr: "तिचे धावते पाय" },
        },
      },
      {
        id: "smoothedpath",
        name: {
          en: "The smoothed path",
          hi: "समतल की गई पगडंडी",
          mr: "सपाट केलेली वाट",
        },
        kind: "the-way",
        seq: 4,
        prompt: {
          en: "What did the villagers do to the stony track to school, so that wheels could roll where only feet had managed?",
          hi: "गाँव वालों ने स्कूल की पथरीली पगडंडी का क्या किया, ताकि जहाँ बस पैर निभा पाते थे वहाँ पहिए लुढ़क सकें?",
          mr: "गावकऱ्यांनी शाळेच्या खडकाळ वाटेचे काय केले, म्हणजे जिथे फक्त पाय निभावत होते तिथे चाके धावू शकावीत?",
        },
        statement: {
          en: "The villagers cleared and smoothed the stony path — stones moved aside so the wheelchair could roll to school.",
          hi: "गाँव वालों ने पथरीली पगडंडी साफ़ कर समतल की — पत्थर हटे, ताकि पहियों वाली कुर्सी स्कूल तक लुढ़क सके।",
          mr: "गावकऱ्यांनी खडकाळ वाट साफ करून सपाट केली — दगड बाजूला झाले, म्हणजे चाकांची खुर्ची शाळेपर्यंत धावू शकेल.",
        },
        pair: {
          left: { en: "The smoothed path", hi: "समतल पगडंडी", mr: "सपाट वाट" },
          right: {
            en: "stones moved for wheels",
            hi: "पहियों के लिए हटे पत्थर",
            mr: "चाकांसाठी हटलेले दगड",
          },
        },
      },
      {
        id: "plankbridge",
        name: {
          en: "The little plank bridge",
          hi: "तख़्ते का छोटा पुल",
          mr: "फळीचा छोटा पूल",
        },
        kind: "the-way",
        seq: 5,
        prompt: {
          en: "A cold stream cut the way to school. What was laid across it so the wheelchair could cross dry?",
          hi: "स्कूल की राह एक ठंडी धारा काटती थी। उस पर क्या बिछाया गया कि पहियों वाली कुर्सी सूखी पार हो जाए?",
          mr: "शाळेची वाट एक गार ओहळ कापत होता. त्यावर काय टाकले गेले म्हणजे चाकांची खुर्ची कोरडी पार व्हावी?",
        },
        statement: {
          en: "A little plank bridge was laid over the stream — wide enough for the wheelchair's wheels to cross.",
          hi: "धारा पर तख़्ते का छोटा पुल बिछा — इतना चौड़ा कि कुर्सी के पहिए पार हो सकें।",
          mr: "ओहळावर फळीचा छोटा पूल टाकला — खुर्चीची चाके पार होतील इतका रुंद.",
        },
        pair: {
          left: { en: "The plank bridge", hi: "तख़्ते का पुल", mr: "फळीचा पूल" },
          right: { en: "dry wheels over the stream", hi: "धारा पर सूखे पहिए", mr: "ओहळावर कोरडी चाके" },
        },
      },
      {
        id: "friends",
        name: { en: "The school friends", hi: "स्कूल के दोस्त", mr: "शाळेतले मित्र" },
        kind: "person",
        seq: 6,
        prompt: {
          en: "Once the path was ready, who took turns at the wheelchair's handles every morning and afternoon?",
          hi: "राह बन जाने पर हर सुबह-शाम कुर्सी के हत्थों पर बारी-बारी कौन लगते?",
          mr: "वाट तयार झाल्यावर रोज सकाळ-संध्याकाळ खुर्चीच्या दांड्यांना आळीपाळीने कोण लागत?",
        },
        statement: {
          en: "The school friends push Chuskit's wheelchair, taking turns each way — her journey is now part of theirs.",
          hi: "स्कूल के दोस्त चुसकित की कुर्सी धकेलते हैं, हर फेरे में बारी बदलते — उसका सफ़र अब उनके सफ़र का हिस्सा है।",
          mr: "शाळेतले मित्र चुसकितची खुर्ची ढकलतात, प्रत्येक फेरीत पाळी बदलत — तिचा प्रवास आता त्यांच्या प्रवासाचा भाग आहे.",
        },
        pair: {
          left: { en: "The friends", hi: "दोस्त", mr: "मित्र" },
          right: {
            en: "turns at the handles",
            hi: "हत्थों पर बारियाँ",
            mr: "दांड्यांवरच्या पाळ्या",
          },
        },
      },
    ],
    hard: [
      {
        level: 6,
        stem: {
          en: "For nine years Chuskit stayed home. Then she reached school — yet her legs were exactly as before. What had really stood between Chuskit and school?",
          hi: "नौ बरस चुसकित घर रही। फिर वह स्कूल पहुँची — जबकि उसके पैर ठीक पहले जैसे ही थे। चुसकित और स्कूल के बीच असल में क्या खड़ा था?",
          mr: "नऊ वर्षे चुसकित घरी राहिली. मग ती शाळेत पोहोचली — तिचे पाय मात्र अगदी पूर्वीसारखेच होते. चुसकित आणि शाळा यांच्यामध्ये खरे काय उभे होते?",
        },
        choices: [
          {
            en: "The path, not her legs — when the way was smoothed, bridged and wheeled, school was hers with the same legs as always",
            hi: "पगडंडी, उसके पैर नहीं — जब राह समतल हुई, पुल बना और पहिए मिले, तो उन्हीं पैरों के साथ स्कूल उसका हो गया",
            mr: "वाट, तिचे पाय नव्हे — वाट सपाट झाली, पूल आला आणि चाके मिळाली, तेव्हा त्याच पायांसह शाळा तिची झाली",
          },
          {
            en: "Her shyness — she had simply never asked to go",
            hi: "उसका संकोच — उसने कभी जाने को कहा ही नहीं था",
            mr: "तिचा संकोच — तिने कधी जायचे म्हटलेच नव्हते",
          },
          {
            en: "The school's rule against wheelchairs",
            hi: "स्कूल का पहियों वाली कुर्सी के विरुद्ध नियम",
            mr: "शाळेचा चाकांच्या खुर्चीविरुद्धचा नियम",
          },
          {
            en: "The cold of Ladakh, which keeps children home",
            hi: "लद्दाख़ की ठंड, जो बच्चों को घर रखती है",
            mr: "लडाखची थंडी, जी मुलांना घरी ठेवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Nothing about Chuskit changed on the day she first reached school — the stones, the stream and the missing wheels changed. That is the chapter's whole turn of thought: what we call a person's 'inability' is often the path's failure, not theirs. Smooth the way, lay the plank, share the pushing — and the same child rolls to the same school as everyone else.",
          hi: "जिस दिन चुसकित पहली बार स्कूल पहुँची, उसमें कुछ नहीं बदला था — पत्थर, धारा और ग़ैर-मौजूद पहिए बदले थे। यही अध्याय का पूरा विचार-पलट है: जिसे हम किसी की 'असमर्थता' कहते हैं, वह अक्सर रास्ते की नाकामी है, उसकी नहीं। राह समतल कीजिए, तख़्ता बिछाइए, धक्का बाँट लीजिए — और वही बच्ची उसी स्कूल तक सबकी तरह पहुँचती है।",
          mr: "चुसकित पहिल्यांदा शाळेत पोहोचली त्या दिवशी तिच्यात काही बदलले नव्हते — दगड, ओहळ आणि नसलेली चाके बदलली होती. हाच धड्याचा सारा विचार-पालट: ज्याला आपण कोणाची 'असमर्थता' म्हणतो, ती बहुधा वाटेची चूक असते, त्या व्यक्तीची नव्हे. वाट सपाट करा, फळी टाका, ढकलणे वाटून घ्या — आणि तीच मुलगी त्याच शाळेत साऱ्यांसारखी पोहोचते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The wheelchair came first, yet Chuskit still could not reach school until the villagers smoothed the path and laid the plank. What does that order of events teach?",
          hi: "पहियों वाली कुर्सी पहले आई, फिर भी चुसकित तब तक स्कूल नहीं पहुँच सकी जब तक गाँव ने पगडंडी समतल न की और तख़्ता न बिछाया। घटनाओं का यह क्रम क्या सिखाता है?",
          mr: "चाकांची खुर्ची आधी आली, तरी गावाने वाट सपाट करून फळी टाकेपर्यंत चुसकित शाळेत पोहोचू शकली नाही. घटनांचा हा क्रम काय शिकवतो?",
        },
        choices: [
          {
            en: "A tool alone is not enough — wheels need a world made ready for wheels, and that readying is everyone's work",
            hi: "अकेला साधन काफ़ी नहीं — पहियों को पहियों के लिए तैयार दुनिया चाहिए, और वह तैयारी सबका काम है",
            mr: "एकटे साधन पुरेसे नाही — चाकांना चाकांसाठी तयार केलेले जग हवे, आणि ती तयारी साऱ्यांचे काम आहे",
          },
          {
            en: "The wheelchair was the wrong gift for Ladakh",
            hi: "लद्दाख़ के लिए पहियों वाली कुर्सी ग़लत उपहार थी",
            mr: "लडाखसाठी चाकांची खुर्ची चुकीची भेट होती",
          },
          {
            en: "Villages should be built without any streams",
            hi: "गाँव बिना धाराओं के बसाने चाहिए",
            mr: "गावे ओहळांशिवाय वसवावीत",
          },
          {
            en: "Chuskit should have waited for stronger wheels",
            hi: "चुसकित को और मज़बूत पहियों की प्रतीक्षा करनी थी",
            mr: "चुसकितने अधिक मजबूत चाकांची वाट पाहायला हवी होती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The chair solved Chuskit's half of the problem; the stones and the stream were the village's half. Only when hands came out — clearing, bridging, pushing in turns — did the wheels actually turn. Help that stops at handing over a tool is half-help; the rest is changing the world the tool must roll through.",
          hi: "कुर्सी ने समस्या का चुसकित वाला आधा हल किया; पत्थर और धारा गाँव वाला आधा थे। जब हाथ आगे आए — साफ़ करते, पुल बाँधते, बारी-बारी धकेलते — तभी पहिए सचमुच घूमे। जो मदद साधन थमाकर रुक जाए, वह आधी मदद है; बाक़ी है उस दुनिया को बदलना जिसमें से साधन को गुज़रना है।",
          mr: "खुर्चीने प्रश्नाचा चुसकितकडचा अर्धा भाग सोडवला; दगड आणि ओहळ हा गावाकडचा अर्धा होता. हात पुढे आले — साफ करणारे, पूल बांधणारे, आळीपाळीने ढकलणारे — तेव्हाच चाके खरी फिरली. साधन देऊन थांबणारी मदत ही अर्धी मदत; उरलेली म्हणजे साधनाला ज्यातून जायचे आहे ते जग बदलणे.",
        },
      },
    ],
  },
];
