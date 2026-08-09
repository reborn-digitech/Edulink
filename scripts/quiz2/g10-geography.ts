/**
 * Class 10 Geography — NCERT "Contemporary India – II", chapter by chapter,
 * through the conceptual engine. India read as a working country rather than a
 * list: soils that decide crops, forests defended by the people who live in
 * them, water counted before it is dammed, and every resource asked the same
 * question — who gets it, and what does the getting cost.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE =
  "EduLink original, written against NCERT Contemporary India – II (Class 10)";
const LICENCE = "CC-BY-SA-4.0";

export const G10_GEOGRAPHY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Resources and Development                                   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-10-resources-development",
    subject: "GEOGRAPHY",
    classLevel: 10,
    chapter: {
      en: "Chapter 1 — Resources and Development",
      hi: "अध्याय 1 — संसाधन एवं विकास",
      mr: "प्रकरण 1 — संसाधने आणि विकास",
    },
    name: {
      en: "Resources and Development",
      hi: "संसाधन एवं विकास",
      mr: "संसाधने आणि विकास",
    },
    summary: {
      en: "What a country has and what it can use are two different lists: the plan that matches a region's endowment to its needs, the difference between a known deposit and a usable one, and the four great soils whose grain size, colour and thirst quietly decide which crop a district grows — and how each is lost.",
      hi: "किसी देश के पास क्या है और वह क्या इस्तेमाल कर सकता है — ये दो अलग सूचियाँ हैं: वह योजना जो किसी क्षेत्र की संपदा को उसकी ज़रूरतों से मिलाती है, ज्ञात भंडार और उपयोग योग्य भंडार का अंतर, और वे चार बड़ी मिट्टियाँ जिनका कण-आकार, रंग और प्यास चुपचाप तय करते हैं कि कोई ज़िला कौन-सी फ़सल उगाएगा — और हर एक कैसे खोई जाती है।",
      mr: "एखाद्या देशाकडे काय आहे आणि तो काय वापरू शकतो या दोन वेगळ्या याद्या आहेत: एखाद्या प्रदेशाची संपदा त्याच्या गरजांशी जुळवणारी योजना, ज्ञात साठा आणि वापरण्याजोगा साठा यांतील फरक, आणि त्या चार मोठ्या मृदा ज्यांचा कणआकार, रंग आणि तहान गुपचूप ठरवतात की एखादा जिल्हा कोणते पीक घेईल — आणि प्रत्येक कशी हरवते.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "resource-planning",
        name: {
          en: "Resource planning",
          hi: "संसाधन नियोजन",
          mr: "संसाधन नियोजन",
        },
        kind: "idea",
        prompt: {
          en: "Rajasthan has sunshine and wind but little water; Jharkhand has coal and iron but poor infrastructure; Arunachal has rivers but no easy roads. Which exercise takes stock of what each region has and matches it to what each region needs?",
          hi: "राजस्थान के पास धूप और पवन हैं पर पानी कम; झारखंड के पास कोयला और लोहा हैं पर ढाँचा कमज़ोर; अरुणाचल के पास नदियाँ हैं पर सुगम सड़कें नहीं। कौन-सा कार्य यह लेखा-जोखा लेता है कि हर क्षेत्र के पास क्या है और उसे उसकी ज़रूरत से मिलाता है?",
          mr: "राजस्थानकडे ऊन आणि वारा आहेत पण पाणी कमी; झारखंडकडे कोळसा आणि लोखंड आहेत पण पायाभूत सुविधा दुर्बळ; अरुणाचलकडे नद्या आहेत पण सुलभ रस्ते नाहीत. कोणते काम प्रत्येक प्रदेशाकडे काय आहे याचा हिशोब घेते आणि त्याला त्याच्या गरजेशी जुळवते?",
        },
        statement: {
          en: "Resource planning is the widely accepted strategy of surveying and mapping what resources a region holds, matching them to appropriate technology and institutions, and aligning the plan with the region's own development needs.",
          hi: "संसाधन नियोजन वह व्यापक रूप से स्वीकृत रणनीति है जो किसी क्षेत्र के संसाधनों का सर्वेक्षण और मानचित्रण करती है, उन्हें उपयुक्त तकनीक तथा संस्थाओं से मिलाती है, और योजना को उस क्षेत्र की अपनी विकास-ज़रूरतों के अनुरूप बिठाती है।",
          mr: "संसाधन नियोजन ही व्यापकपणे स्वीकारलेली रणनीती आहे जी एखाद्या प्रदेशाच्या संसाधनांचे सर्वेक्षण आणि नकाशांकन करते, त्यांना योग्य तंत्रज्ञान व संस्थांशी जुळवते, आणि योजना त्या प्रदेशाच्या स्वतःच्या विकास-गरजांशी सुसंगत करते.",
        },
        detail: {
          en: "It is needed because resources are distributed most unevenly — some states are rich in one thing and poor in everything else.",
          hi: "यह इसलिए चाहिए कि संसाधन अत्यंत असमान रूप से बँटे हैं — कुछ राज्य एक चीज़ में धनी और बाक़ी सब में निर्धन हैं।",
          mr: "ती यासाठी लागते की संसाधने अत्यंत असमानपणे वाटलेली आहेत — काही राज्ये एका गोष्टीत श्रीमंत आणि बाकी सर्वांत गरीब.",
        },
        extra: {
          en: "A stock of minerals guarantees nothing on its own: several resource-rich districts remain among the poorest, because ownership, technology and institutions decide who benefits.",
          hi: "खनिजों का भंडार अपने आप कुछ भी सुनिश्चित नहीं करता: कई संसाधन-समृद्ध ज़िले सबसे निर्धनों में बने हुए हैं, क्योंकि स्वामित्व, तकनीक और संस्थाएँ तय करती हैं कि लाभ किसे मिले।",
          mr: "खनिजांचा साठा स्वतःहून काहीही खात्री देत नाही: अनेक संसाधन-समृद्ध जिल्हे सर्वांत गरिबांत राहिले आहेत, कारण मालकी, तंत्रज्ञान आणि संस्था ठरवतात की फायदा कोणाला मिळेल.",
        },
        pair: {
          left: {
            en: "Survey, match to technology, align to needs",
            hi: "सर्वेक्षण, तकनीक से मिलान, ज़रूरतों से संरेखण",
            mr: "सर्वेक्षण, तंत्रज्ञानाशी जुळणी, गरजांशी संरेखन",
          },
          right: {
            en: "resource planning",
            hi: "संसाधन नियोजन",
            mr: "संसाधन नियोजन",
          },
        },
      },
      {
        id: "stock-and-reserves",
        name: {
          en: "Stock and reserves",
          hi: "भंडार और संचित कोष",
          mr: "साठा आणि राखीव",
        },
        kind: "idea",
        prompt: {
          en: "Water holds hydrogen that could fuel the world, but we lack the technology to release it cheaply; coal in a mapped seam, by contrast, can be dug tomorrow. Which pair of terms marks that difference?",
          hi: "पानी में वह हाइड्रोजन है जो दुनिया को ईंधन दे सकता, पर उसे सस्ते में निकालने की तकनीक हमारे पास नहीं; इसके विपरीत मानचित्रित परत का कोयला कल ही खोदा जा सकता है। कौन-सी शब्द-जोड़ी यह अंतर बताती है?",
          mr: "पाण्यात तो हायड्रोजन आहे जो जगाला इंधन देऊ शकतो, पण तो स्वस्तात मोकळा करण्याचे तंत्रज्ञान आपल्याकडे नाही; याउलट नकाशांकित थरातील कोळसा उद्याच खणता येतो. कोणती शब्द-जोडी हा फरक दाखवते?",
        },
        statement: {
          en: "Stock is the part of a country's endowment that cannot be used because the technology to access it does not yet exist, while reserves are the part that is known, accessible and usable with present technology.",
          hi: "भंडार किसी देश की उस संपदा का हिस्सा है जिसे इसलिए इस्तेमाल नहीं किया जा सकता कि उस तक पहुँचने की तकनीक अभी है ही नहीं, जबकि संचित कोष वह हिस्सा है जो ज्ञात, सुलभ और वर्तमान तकनीक से उपयोग योग्य है।",
          mr: "साठा म्हणजे देशाच्या त्या संपदेचा भाग जो यासाठी वापरता येत नाही की त्यापर्यंत पोहोचण्याचे तंत्रज्ञान अजून अस्तित्वातच नाही, तर राखीव म्हणजे तो भाग जो ज्ञात, सुलभ आणि सध्याच्या तंत्रज्ञानाने वापरण्याजोगा आहे.",
        },
        detail: {
          en: "The boundary between them moves with knowledge: a stock becomes a reserve the day a workable technology appears, without a gram of new material being created.",
          hi: "उनके बीच की सीमा ज्ञान के साथ हिलती है: भंडार उसी दिन संचित कोष बन जाता है जिस दिन कोई कारगर तकनीक आती है, और एक ग्राम नई सामग्री भी नहीं बनती।",
          mr: "त्यांच्यातील सीमा ज्ञानासोबत सरकते: साठा त्याच दिवशी राखीव बनतो ज्या दिवशी एखादे उपयोगी तंत्रज्ञान येते, आणि एक ग्रॅम नवा पदार्थही तयार होत नाही.",
        },
        extra: {
          en: "This is why a resource is best described as something that becomes rather than something that is — petroleum was useless rock oil until engines were invented to burn it.",
          hi: "इसीलिए संसाधन को 'जो है' कहने के बजाय 'जो बनता है' कहना बेहतर है — पेट्रोलियम तब तक बेकार शैल-तेल था जब तक उसे जलाने वाले इंजन नहीं बने।",
          mr: "म्हणूनच संसाधनाला 'जे आहे' म्हणण्याऐवजी 'जे बनते' म्हणणे अधिक योग्य — पेट्रोलियम तोवर निरुपयोगी खडक-तेल होते जोवर ते जाळणारी इंजिने बनली नाहीत.",
        },
        pair: {
          left: {
            en: "Present but unusable, versus known and usable",
            hi: "मौजूद पर अनुपयोगी, बनाम ज्ञात और उपयोगी",
            mr: "उपस्थित पण अवापरता, विरुद्ध ज्ञात आणि वापरण्याजोगा",
          },
          right: {
            en: "stock and reserves",
            hi: "भंडार और संचित कोष",
            mr: "साठा आणि राखीव",
          },
        },
      },
      {
        id: "alluvial-soil",
        name: {
          en: "Alluvial soil",
          hi: "जलोढ़ मृदा",
          mr: "गाळाची मृदा",
        },
        kind: "soil",
        prompt: {
          en: "Deposited by rivers across the northern plains and the eastern coastal deltas, it is rich in potash and lime, easy to plough, and supports the densest farming population in the country. Which soil is this?",
          hi: "उत्तरी मैदानों और पूर्वी तटीय डेल्टाओं में नदियों द्वारा बिछाई गई, यह पोटाश और चूने से भरपूर है, जोतने में आसान है, और देश की सबसे सघन कृषक आबादी को सँभालती है। यह कौन-सी मृदा है?",
          mr: "उत्तरेच्या मैदानांत आणि पूर्व किनारी त्रिभुज प्रदेशांत नद्यांनी पसरवलेली, ती पोटॅश आणि चुन्याने समृद्ध, नांगरायला सोपी, आणि देशातील सर्वांत दाट शेतकरी लोकसंख्येला तोलणारी. ही कोणती मृदा?",
        },
        statement: {
          en: "Alluvial soil is laid down by rivers across the northern plains and the deltas, is rich in potash, phosphoric acid and lime, and is the most fertile and most intensively farmed soil in India.",
          hi: "जलोढ़ मृदा नदियों द्वारा उत्तरी मैदानों और डेल्टाओं में बिछाई जाती है, पोटाश, फ़ॉस्फ़ोरिक अम्ल तथा चूने से भरपूर है, और भारत की सबसे उपजाऊ तथा सबसे सघन खेती वाली मृदा है।",
          mr: "गाळाची मृदा नद्यांकडून उत्तरेच्या मैदानांत आणि त्रिभुज प्रदेशांत पसरवली जाते, पोटॅश, फॉस्फोरिक आम्ल व चुन्याने समृद्ध, आणि भारतातील सर्वांत सुपीक व सर्वांत सघन शेती होणारी मृदा.",
        },
        detail: {
          en: "It comes in two ages — the older, coarser bangar with lime nodules, and the newer, finer khadar renewed by every flood.",
          hi: "यह दो आयुओं में आती है — पुरानी, मोटे कणों वाली बांगर जिसमें चूने की गाँठें होती हैं, और नई, महीन ख़ादर जो हर बाढ़ से नई हो जाती है।",
          mr: "ती दोन वयांत येते — जुनी, जाडसर बांगर जिच्यात चुन्याच्या गाठी असतात, आणि नवी, बारीक खादर जी प्रत्येक पुराने नवी होते.",
        },
        extra: {
          en: "Its fertility is the reason the Ganga plain carries so many people, and also the reason the loss of a centimetre of it matters more here than anywhere else.",
          hi: "उसकी उर्वरता ही कारण है कि गंगा का मैदान इतने लोग ढोता है, और यही कारण है कि उसका एक सेंटीमीटर खोना यहाँ किसी और जगह से अधिक मायने रखता है।",
          mr: "तिची सुपीकताच कारण आहे की गंगेचे मैदान इतके लोक वाहते, आणि तेच कारण की तिचा एक सेंटिमीटर हरवणे इथे इतर कुठल्याही ठिकाणाहून अधिक महत्त्वाचे.",
        },
        pair: {
          left: {
            en: "River-laid, potash-rich, most intensively farmed",
            hi: "नदी-निक्षेपित, पोटाश-समृद्ध, सबसे सघन खेती वाली",
            mr: "नदीने साचवलेली, पोटॅश-समृद्ध, सर्वांत सघन शेती होणारी",
          },
          right: {
            en: "alluvial soil",
            hi: "जलोढ़ मृदा",
            mr: "गाळाची मृदा",
          },
        },
      },
      {
        id: "black-soil",
        name: {
          en: "Black soil",
          hi: "काली मृदा",
          mr: "काळी मृदा",
        },
        kind: "soil",
        prompt: {
          en: "Formed from lava on the Deccan plateau, it is clayey, holds moisture through a long dry season, and develops wide cracks in summer that turn it over by itself. Which soil is this?",
          hi: "दक्कन के पठार पर लावा से बनी, यह चिकनी है, लंबे शुष्क मौसम भर नमी रोके रखती है, और गर्मियों में चौड़ी दरारें डालती है जो उसे स्वयं ही उलट-पलट देती हैं। यह कौन-सी मृदा है?",
          mr: "दख्खनच्या पठारावर लाव्हापासून बनलेली, ती चिकणमातीची, दीर्घ कोरड्या हंगामभर ओलावा धरून ठेवणारी, आणि उन्हाळ्यात रुंद भेगा पाडणारी ज्या तिला स्वतःच उलटवतात. ही कोणती मृदा?",
        },
        statement: {
          en: "Black soil, also called regur, formed from the weathering of Deccan lava, is clayey and moisture-retentive, rich in lime, magnesia and potash, and is the classic cotton soil.",
          hi: "काली मृदा, जिसे रेगुर भी कहते हैं, दक्कन के लावा के अपक्षय से बनी है, चिकनी और नमी रोकने वाली है, चूने, मैग्नेशिया तथा पोटाश से भरपूर है, और वही उत्कृष्ट कपास-मृदा है।",
          mr: "काळी मृदा, जिला रेगूरही म्हणतात, दख्खनच्या लाव्हाच्या विदारणातून बनलेली, चिकणमातीची व ओलावा धरणारी, चुना, मॅग्नेशिया व पोटॅशने समृद्ध, आणि तीच उत्कृष्ट कापूस-मृदा.",
        },
        detail: {
          en: "The deep cracks that open in the dry months let air down into the soil, so it aerates itself without ploughing.",
          hi: "शुष्क महीनों में खुलती गहरी दरारें हवा को मिट्टी के भीतर उतरने देती हैं, अतः वह बिना जुताई के स्वयं वातित हो जाती है।",
          mr: "कोरड्या महिन्यांत उघडणाऱ्या खोल भेगा हवेला मातीच्या आत उतरू देतात, म्हणून ती नांगरणीविना स्वतःच हवेशीर होते.",
        },
        extra: {
          en: "Wet, it becomes so sticky that it cannot be worked at all, so its ploughing has to be timed to the first showers or done just after the harvest.",
          hi: "गीली होने पर यह इतनी चिपचिपी हो जाती है कि उस पर काम ही नहीं हो सकता, अतः उसकी जुताई पहली बौछारों के समय पर या फ़सल कटते ही करनी पड़ती है।",
          mr: "ओली झाल्यावर ती इतकी चिकट होते की तिच्यावर कामच होत नाही, म्हणून तिची नांगरणी पहिल्या सरींच्या वेळेवर वा पीक निघताच करावी लागते.",
        },
        pair: {
          left: {
            en: "Lava-born, clayey, cracks that aerate themselves",
            hi: "लावा-जन्य, चिकनी, स्वयं वातित करती दरारें",
            mr: "लाव्हा-जन्य, चिकणमातीची, स्वतःच हवेशीर करणाऱ्या भेगा",
          },
          right: {
            en: "black soil",
            hi: "काली मृदा",
            mr: "काळी मृदा",
          },
        },
      },
      {
        id: "laterite-soil",
        name: {
          en: "Laterite soil",
          hi: "लैटेराइट मृदा",
          mr: "जांभी मृदा",
        },
        kind: "soil",
        prompt: {
          en: "Heavy tropical rain washes the lime and silica clean out of the rock, leaving behind iron and aluminium — a soil poor in humus, hard when dry, and cut into bricks in Kerala and Goa. Which soil is this?",
          hi: "भारी उष्णकटिबंधीय वर्षा चट्टान से चूना और सिलिका धो ले जाती है, पीछे लोहा और एल्युमिनियम छोड़कर — ऐसी मृदा जो ह्यूमस में निर्धन है, सूखने पर कठोर, और केरल तथा गोवा में ईंटों में काटी जाती है। यह कौन-सी मृदा है?",
          mr: "जोरदार उष्णकटिबंधीय पाऊस खडकातून चुना आणि सिलिका धुऊन नेतो, मागे लोखंड आणि अ‍ॅल्युमिनियम ठेवत — अशी मृदा जी ह्युमसमध्ये गरीब, वाळल्यावर कठीण, आणि केरळ व गोव्यात विटांत कापली जाते. ही कोणती मृदा?",
        },
        statement: {
          en: "Laterite soil develops in areas of high temperature and heavy rainfall where leaching washes out the lime and silica, leaving an iron- and aluminium-rich soil that is low in humus and fertility.",
          hi: "लैटेराइट मृदा उन क्षेत्रों में बनती है जहाँ ताप ऊँचा और वर्षा भारी हो, जहाँ निक्षालन चूना तथा सिलिका बहा ले जाता है और पीछे लोहा तथा एल्युमिनियम से भरी, ह्यूमस और उर्वरता में कम मृदा छोड़ जाता है।",
          mr: "जांभी मृदा त्या भागांत तयार होते जिथे तापमान उच्च आणि पाऊस जोरदार असतो, जिथे निक्षालन चुना व सिलिका वाहून नेते आणि मागे लोखंड व अ‍ॅल्युमिनियमने भरलेली, ह्युमस व सुपीकतेत कमी मृदा ठेवते.",
        },
        detail: {
          en: "It is unsuited to most food crops without heavy manuring, but with care it grows tea, coffee, cashew and rubber on the hill slopes.",
          hi: "यह भारी खाद के बिना अधिकांश खाद्य फ़सलों के अनुकूल नहीं, पर देखभाल से पहाड़ी ढलानों पर चाय, कॉफ़ी, काजू और रबड़ उगाती है।",
          mr: "ती जबर खतांविना बहुतांश अन्नपिकांना अनुकूल नाही, पण निगेने डोंगरउतारांवर चहा, कॉफी, काजू आणि रबर पिकवते.",
        },
        extra: {
          en: "Its name comes from the Latin for brick, because it hardens on exposure and has been cut and dried into building blocks for centuries.",
          hi: "उसका नाम ईंट के लैटिन शब्द से आया है, क्योंकि हवा लगते ही वह कठोर हो जाती है और सदियों से काटकर सुखाकर निर्माण-खंड बनाई जाती रही है।",
          mr: "तिचे नाव विटेच्या लॅटिन शब्दावरून आले, कारण हवा लागताच ती कठीण होते आणि शतके कापून वाळवून बांधकामाचे ठोकळे बनवली जात आहे.",
        },
        pair: {
          left: {
            en: "Leached of lime and silica, cut into bricks",
            hi: "चूना-सिलिका बह गए, ईंटों में काटी जाती",
            mr: "चुना-सिलिका वाहून गेलेली, विटांत कापली जाणारी",
          },
          right: {
            en: "laterite soil",
            hi: "लैटेराइट मृदा",
            mr: "जांभी मृदा",
          },
        },
      },
      {
        id: "gully-and-sheet-erosion",
        name: {
          en: "Gully and sheet erosion",
          hi: "अवनालिका और परत अपरदन",
          mr: "घळई आणि पत्री झीज",
        },
        kind: "process",
        prompt: {
          en: "In the Chambal basin running water has cut deep channels that make the land unfit for farming; elsewhere the topsoil is stripped off in an even layer so quietly that a farmer notices only when yields fall. Which two forms of soil loss are these?",
          hi: "चंबल बेसिन में बहते पानी ने ऐसी गहरी नालियाँ काट दी हैं कि भूमि खेती के लायक़ नहीं रही; अन्यत्र ऊपरी मिट्टी एक समान परत में इतने चुपचाप छिल जाती है कि किसान को तभी पता चलता है जब पैदावार गिरती है। ये मृदा-हानि के कौन-से दो रूप हैं?",
          mr: "चंबळ खोऱ्यात वाहत्या पाण्याने अशा खोल घळी कापल्या आहेत की जमीन शेतीयोग्य राहिली नाही; इतरत्र वरची माती एकसमान थरात इतकी गुपचूप सोलली जाते की शेतकऱ्याला तेव्हाच कळते जेव्हा उत्पादन घसरते. ही मृदा-हानीची कोणती दोन रूपे?",
        },
        statement: {
          en: "Gully erosion cuts deep channels that render land unfit for cultivation and creates badlands, while sheet erosion removes the topsoil in a thin even layer over a wide area, often unnoticed until fertility falls.",
          hi: "अवनालिका अपरदन ऐसी गहरी नालियाँ काटता है जो भूमि को खेती के अयोग्य कर देती हैं और उत्खात भूमि बनाती हैं, जबकि परत अपरदन ऊपरी मिट्टी को विस्तृत क्षेत्र पर एक पतली समान परत में हटाता है, जो अक्सर उर्वरता गिरने तक अनदेखा रह जाता है।",
          mr: "घळई झीज अशा खोल घळी कापते ज्या जमीन लागवडीस अयोग्य करतात आणि उजाड भूमी घडवतात, तर पत्री झीज वरची माती विस्तृत भागावर पातळ एकसमान थरात काढून नेते, जी सुपीकता घसरेपर्यंत अनेकदा लक्षातच येत नाही.",
        },
        detail: {
          en: "The remedies differ because the mechanisms do: contour ploughing and terracing slow water on slopes, while shelter belts of trees break the wind that strips dry plains.",
          hi: "उपाय इसलिए भिन्न हैं कि क्रियाविधियाँ भिन्न हैं: समोच्च जुताई और सीढ़ीदार खेत ढलानों पर पानी की गति धीमी करते हैं, जबकि पेड़ों की रक्षक मेखलाएँ उस पवन को तोड़ती हैं जो सूखे मैदानों को छीलती है।",
          mr: "उपाय यासाठी वेगळे की क्रियाविधी वेगळ्या: समोच्च नांगरणी आणि पायऱ्यांची शेती उतारांवर पाण्याचा वेग मंदावतात, तर झाडांचे संरक्षक पट्टे तो वारा मोडतात जो कोरडी मैदाने सोलतो.",
        },
        extra: {
          en: "Human causes dominate: deforestation, overgrazing, mining and ploughing up and down a slope instead of across it.",
          hi: "मानवीय कारण प्रमुख हैं: वनोन्मूलन, अतिचराई, खनन, और ढलान के आर-पार के बजाय ऊपर-नीचे जुताई।",
          mr: "मानवी कारणे प्रमुख: वनतोड, अतिचराई, खाणकाम, आणि उताराच्या आडव्याऐवजी वरखाली नांगरणी.",
        },
        pair: {
          left: {
            en: "Deep channels versus a thin layer taken quietly",
            hi: "गहरी नालियाँ बनाम चुपचाप ली गई पतली परत",
            mr: "खोल घळी विरुद्ध गुपचूप घेतलेला पातळ थर",
          },
          right: {
            en: "gully and sheet erosion",
            hi: "अवनालिका और परत अपरदन",
            mr: "घळई आणि पत्री झीज",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Some of India's districts richest in coal, iron ore and bauxite are also among its poorest by income, literacy and health. If resources create wealth, this should not happen. Explain why abundance alone does not produce development.",
          hi: "कोयले, लौह अयस्क और बॉक्साइट में भारत के सबसे धनी कुछ ज़िले आय, साक्षरता और स्वास्थ्य में उसके सबसे निर्धनों में भी हैं। यदि संसाधन संपत्ति बनाते हैं, तो ऐसा नहीं होना चाहिए। समझाओ केवल प्रचुरता विकास क्यों नहीं देती।",
          mr: "कोळसा, लोहधातुक आणि बॉक्साइटमध्ये भारतातील सर्वांत श्रीमंत काही जिल्हे उत्पन्न, साक्षरता आणि आरोग्यात त्याच्या सर्वांत गरिबांतही आहेत. संसाधने संपत्ती निर्माण करत असतील तर असे व्हायला नको. समजावा केवळ विपुलता विकास का देत नाही.",
        },
        choices: [
          {
            en: "Because a deposit becomes wealth only through technology to extract it, institutions to govern it and arrangements that share the proceeds. Where the ore is shipped out raw, the profits accrue to owners elsewhere, local people lose land and forest to the mine and gain only the lowest-paid work, and the damage — displacement, dust, ruined water — stays behind. Development requires resource planning that ties extraction to local benefit, not extraction alone",
            hi: "क्योंकि कोई भंडार तभी संपत्ति बनता है जब उसे निकालने की तकनीक, उसे शासित करने वाली संस्थाएँ और आय बाँटने की व्यवस्थाएँ हों। जहाँ अयस्क कच्चा ही बाहर भेज दिया जाता है, वहाँ लाभ अन्यत्र के मालिकों को जाता है, स्थानीय लोग खदान को भूमि और वन गँवाते हैं और केवल सबसे कम मज़दूरी वाला काम पाते हैं, और नुक़सान — विस्थापन, धूल, बिगड़ा पानी — पीछे रह जाता है। विकास के लिए ऐसा संसाधन नियोजन चाहिए जो निष्कर्षण को स्थानीय लाभ से बाँधे, केवल निष्कर्षण नहीं",
            mr: "कारण एखादा साठा तेव्हाच संपत्ती बनतो जेव्हा तो काढण्याचे तंत्रज्ञान, त्याचे शासन करणाऱ्या संस्था आणि उत्पन्न वाटण्याच्या व्यवस्था असतात. जिथे धातुक कच्चेच बाहेर पाठवले जाते, तिथे नफा इतरत्रच्या मालकांना जातो, स्थानिक लोक खाणीला जमीन व जंगल गमावतात आणि फक्त सर्वांत कमी मजुरीचे काम मिळवतात, आणि नुकसान — विस्थापन, धूळ, बिघडलेले पाणी — मागे राहते. विकासासाठी असे संसाधन नियोजन हवे जे उत्खननाला स्थानिक लाभाशी बांधेल, केवळ उत्खनन नव्हे",
          },
          {
            en: "Because minerals are inherently worthless, and only agriculture can create real wealth anywhere",
            hi: "क्योंकि खनिज स्वभावतः निर्मूल्य हैं, और कहीं भी असली संपत्ति केवल कृषि बना सकती है",
            mr: "कारण खनिजे मुळातच निर्मूल्य आहेत, आणि कुठेही खरी संपत्ती फक्त शेतीच निर्माण करू शकते",
          },
          {
            en: "Because the people of those districts refuse all employment offered to them",
            hi: "क्योंकि उन ज़िलों के लोग उन्हें दी गई हर नौकरी ठुकरा देते हैं",
            mr: "कारण त्या जिल्ह्यांतील लोक त्यांना दिलेली प्रत्येक नोकरी नाकारतात",
          },
          {
            en: "The premise is false: every mineral-rich district in India is among the wealthiest in the country",
            hi: "आधार ही ग़लत है: भारत का हर खनिज-समृद्ध ज़िला देश के सबसे धनी ज़िलों में है",
            mr: "गृहीतकच चुकीचे: भारतातील प्रत्येक खनिज-समृद्ध जिल्हा देशातील सर्वांत श्रीमंतांत आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The puzzle dissolves once you stop treating a resource as wealth and start treating it as a possibility that has to be converted. Three things stand between a deposit in the ground and a prosperous district, and all three can fail. The first is technology. Ore underground is worth nothing until it can be extracted, transported and processed. That requires capital, machinery and skills, and those are rarely local — they are brought in by a company from outside, which means the value the technology adds also belongs to outsiders. The second is institutions: who owns the mineral, who grants the lease, who is compensated for the land, whether that compensation is paid, and whether anyone is obliged to hire or train local people. Where these rules are weak or badly enforced, the mine can operate for decades with almost no obligation to the district it stands in. The third is the pattern of processing. If the ore leaves raw, the district exports the least valuable stage of the chain and captures almost none of the value; steel made elsewhere from that ore, and the goods made from that steel, carry all the profit. Now look at what the district actually receives. It loses farmland, forest and often the village itself to the pit and the spoil heaps. Its groundwater is drawn down or contaminated, and dust settles on the fields that remain. Adivasi communities in particular lose access to forests that were their food, fodder and medicine. What they gain is a small number of jobs, usually the least skilled and least paid, because the technical posts go to people brought in with the machinery. The books therefore balance the wrong way: the profits leave, the costs stay. This is why the chapter insists that resource planning is not merely an inventory. Surveying what exists is only the first step; the plan has to attach that endowment to appropriate technology, to institutions that secure a share for the people whose land it is, and to the region's own development needs — schools, health, roads, processing industry. Where that is done, minerals genuinely finance development. Where it is not, extraction and impoverishment sit side by side, which is exactly what these districts show. (The wrong answers dismiss mineral value altogether, blame the affected people for their own poverty, or deny a pattern that district-level census and income data document plainly.)",
          hi: "पहेली तभी घुल जाती है जब तुम संसाधन को संपत्ति मानना छोड़कर उसे एक ऐसी संभावना मानने लगो जिसे बदलना पड़ता है। ज़मीन के भंडार और समृद्ध ज़िले के बीच तीन चीज़ें खड़ी हैं, और तीनों विफल हो सकती हैं। पहली तकनीक। भूमिगत अयस्क तब तक कुछ मूल्य का नहीं जब तक उसे निकाला, ढोया और संसाधित न किया जा सके। इसके लिए पूँजी, मशीनरी और कौशल चाहिए, और वे शायद ही स्थानीय होते हैं — उन्हें बाहर की कंपनी लाती है, जिसका अर्थ है कि तकनीक जो मूल्य जोड़ती है वह भी बाहरवालों का होता है। दूसरी संस्थाएँ: खनिज का स्वामी कौन, पट्टा कौन देता, भूमि का मुआवज़ा किसे, वह मुआवज़ा चुकाया भी जाता या नहीं, और क्या कोई स्थानीय लोगों को रखने या प्रशिक्षित करने को बाध्य है। जहाँ ये नियम कमज़ोर या ठीक से लागू न हों, वहाँ खदान दशकों तक उस ज़िले के प्रति लगभग बिना किसी दायित्व के चल सकती है जिसमें वह खड़ी है। तीसरी प्रसंस्करण का ढंग। यदि अयस्क कच्चा ही जाता है, तो ज़िला शृंखला का सबसे कम मूल्यवान चरण निर्यात करता है और मूल्य का लगभग कुछ भी नहीं पकड़ता; उसी अयस्क से अन्यत्र बना इस्पात, और उस इस्पात से बना माल, सारा लाभ ढोता है। अब देखो ज़िले को वस्तुतः क्या मिलता है। वह खेत, वन और अक्सर स्वयं गाँव भी गड्ढे और मलबे के ढेरों को गँवाता है। उसका भूजल नीचे खिंच जाता या दूषित हो जाता है, और बचे खेतों पर धूल बैठती है। ख़ासकर आदिवासी समुदाय उन वनों तक पहुँच खोते हैं जो उनका भोजन, चारा और औषधि थे। जो मिलता है वह थोड़ी-सी नौकरियाँ, आमतौर पर सबसे कम कुशल और कम मज़दूरी वाली, क्योंकि तकनीकी पद उन लोगों को जाते हैं जो मशीनरी के साथ लाए जाते हैं। अतः बही उल्टी बैठती है: लाभ चला जाता, लागत ठहर जाती। इसीलिए अध्याय ज़ोर देता है कि संसाधन नियोजन मात्र सूची-निर्माण नहीं। जो है उसका सर्वेक्षण केवल पहला क़दम है; योजना को उस संपदा को उपयुक्त तकनीक से, ऐसी संस्थाओं से जो उन लोगों का हिस्सा सुरक्षित करें जिनकी वह भूमि है, और उस क्षेत्र की अपनी विकास-ज़रूरतों — विद्यालय, स्वास्थ्य, सड़कें, प्रसंस्करण उद्योग — से जोड़ना होता है। जहाँ यह होता है, खनिज सचमुच विकास का वित्तपोषण करते हैं। जहाँ नहीं होता, वहाँ निष्कर्षण और दरिद्रता कंधे से कंधा मिलाकर बैठते हैं — ठीक वही जो ये ज़िले दिखाते हैं। (ग़लत उत्तर खनिजों का मूल्य ही झटक देते, प्रभावित लोगों को उनकी अपनी निर्धनता का दोष देते, या उस प्रतिरूप को नकारते जिसे ज़िला-स्तरीय जनगणना और आय के आँकड़े साफ़ दर्ज करते हैं।)",
          mr: "कोडे तेव्हाच सुटते जेव्हा तुम्ही संसाधनाला संपत्ती मानणे सोडून त्याला अशी शक्यता मानू लागता जिचे रूपांतर करावे लागते. जमिनीतील साठा आणि समृद्ध जिल्हा यांच्यात तीन गोष्टी उभ्या आहेत, आणि तिन्ही फसू शकतात. पहिली तंत्रज्ञान. भूमिगत धातुक तोवर काही मोलाचे नाही जोवर ते काढता, वाहता आणि प्रक्रिया करता येत नाही. यासाठी भांडवल, यंत्रसामग्री आणि कौशल्ये लागतात, आणि ती क्वचितच स्थानिक असतात — ती बाहेरची कंपनी आणते, म्हणजे तंत्रज्ञान जे मूल्य जोडते तेही बाहेरच्यांचे असते. दुसरी संस्था: खनिजाचा मालक कोण, भाडेपट्टा कोण देतो, जमिनीचा मोबदला कोणाला, तो मोबदला दिला जातो का, आणि स्थानिक लोकांना कामावर ठेवायला वा प्रशिक्षित करायला कोणी बांधील आहे का. जिथे हे नियम दुर्बळ वा नीट न राबवलेले, तिथे खाण दशके ज्या जिल्ह्यात ती उभी आहे त्याप्रती जवळजवळ कोणत्याही दायित्वाविना चालू शकते. तिसरी प्रक्रियेची पद्धत. धातुक कच्चेच जात असेल, तर जिल्हा साखळीचा सर्वांत कमी मोलाचा टप्पा निर्यात करतो आणि मूल्याचे जवळजवळ काहीच पकडत नाही; त्याच धातुकातून इतरत्र बनलेले पोलाद, आणि त्या पोलादातून बनलेला माल, सर्व नफा वाहतो. आता जिल्ह्याला प्रत्यक्षात काय मिळते ते पाहा. तो शेती, जंगल आणि अनेकदा स्वतः गावही खड्ड्याला व मातीच्या ढिगांना गमावतो. त्याचे भूजल खाली ओढले जाते वा दूषित होते, आणि उरलेल्या शेतांवर धूळ बसते. विशेषतः आदिवासी समुदाय त्या जंगलांपर्यंतचा प्रवेश गमावतात जी त्यांचे अन्न, चारा आणि औषध होती. जे मिळते ते थोड्या नोकऱ्या, सहसा सर्वांत कमी कुशल आणि कमी मजुरीच्या, कारण तांत्रिक पदे यंत्रसामग्रीसोबत आणलेल्या लोकांना जातात. म्हणून खतावणी उलटी बसते: नफा जातो, खर्च राहतो. म्हणूनच प्रकरण आग्रह धरते की संसाधन नियोजन म्हणजे केवळ यादी करणे नव्हे. जे आहे त्याचे सर्वेक्षण ही केवळ पहिली पायरी; योजनेला ती संपदा योग्य तंत्रज्ञानाशी, ज्यांची ती जमीन आहे त्यांचा वाटा सुरक्षित करणाऱ्या संस्थांशी, आणि त्या प्रदेशाच्या स्वतःच्या विकास-गरजांशी — शाळा, आरोग्य, रस्ते, प्रक्रिया उद्योग — जोडावी लागते. जिथे हे होते तिथे खनिजे खरोखर विकासाला अर्थपुरवठा करतात. जिथे होत नाही तिथे उत्खनन आणि दारिद्र्य शेजारीशेजारी बसतात — नेमके तेच हे जिल्हे दाखवतात. (चुकीची उत्तरे खनिजांचे मोलच झटकतात, बाधित लोकांना त्यांच्याच गरिबीचा दोष देतात, वा जिल्हा-स्तरीय जनगणना व उत्पन्न आकडेवारी स्पष्ट नोंदवत असलेले प्रारूप नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Petroleum lay under the ground for millions of years while civilisations rose and fell without touching it; uranium was a curiosity in a mineral cabinet; sunlight fell on every roof and was called nothing at all. Each is now called a resource. What does this tell us about what a resource actually is, and what follows for how a country should treat its endowment?",
          hi: "पेट्रोलियम लाखों वर्ष ज़मीन के नीचे पड़ा रहा जबकि सभ्यताएँ उठीं और गिरीं बिना उसे छुए; यूरेनियम खनिज-अलमारी में एक कौतुक था; धूप हर छत पर गिरती थी और उसे कुछ कहा ही नहीं जाता था। अब हर एक को संसाधन कहा जाता है। यह हमें क्या बताता है कि संसाधन वस्तुतः है क्या, और किसी देश को अपनी संपदा के साथ कैसा बरताव करना चाहिए — इसके लिए इससे क्या निकलता है?",
          mr: "पेट्रोलियम लाखो वर्षे जमिनीखाली पडून राहिले तर संस्कृती उदयाला आल्या आणि लोपल्या ते न स्पर्शता; युरेनियम खनिज-कपाटातील एक कुतूहल होते; सूर्यप्रकाश प्रत्येक छपरावर पडे आणि त्याला काही म्हटलेच जात नसे. आता प्रत्येकाला संसाधन म्हणतात. हे आपल्याला काय सांगते की संसाधन प्रत्यक्षात काय आहे, आणि एखाद्या देशाने आपल्या संपदेशी कसे वागावे यासाठी यातून काय निघते?",
        },
        choices: [
          {
            en: "A resource is not a thing but a relationship between a material, a technology and a need — so the boundary between stock and reserve moves as knowledge does, and what is worthless today may be vital tomorrow. It follows that a country should not exhaust what it can currently sell, invest in the knowledge that converts stock into reserve, and treat unused material as an option for the future rather than as nothing — which is the reasoning behind sustainable development and Agenda 21",
            hi: "संसाधन कोई वस्तु नहीं बल्कि सामग्री, तकनीक और आवश्यकता के बीच का संबंध है — अतः भंडार और संचित कोष की सीमा ज्ञान के साथ हिलती है, और जो आज निर्मूल्य है वह कल अनिवार्य हो सकता है। इससे निकलता है कि देश को वह नहीं चुका देना चाहिए जो वह इस समय बेच सकता है, उस ज्ञान में निवेश करना चाहिए जो भंडार को संचित कोष में बदलता है, और अनुपयुक्त सामग्री को शून्य नहीं बल्कि भविष्य का विकल्प मानना चाहिए — यही सतत विकास और एजेंडा 21 के पीछे का तर्क है",
            mr: "संसाधन ही वस्तू नव्हे तर पदार्थ, तंत्रज्ञान आणि गरज यांच्यातील नाते आहे — म्हणून साठा आणि राखीव यांतील सीमा ज्ञानासोबत सरकते, आणि जे आज निर्मूल्य ते उद्या अत्यावश्यक असू शकते. यातून निघते की देशाने जे तो सध्या विकू शकतो ते संपवू नये, साठ्याचे राखीवात रूपांतर करणाऱ्या ज्ञानात गुंतवणूक करावी, आणि न वापरलेला पदार्थ शून्य नव्हे तर भविष्यातील पर्याय मानावा — हाच शाश्वत विकास आणि अजेंडा 21 मागचा तर्क",
          },
          {
            en: "It shows resources are fixed by nature and unchanging, so a country's wealth was settled once and for all by geology",
            hi: "यह दिखाता है कि संसाधन प्रकृति से नियत और अपरिवर्तनीय हैं, अतः किसी देश की संपत्ति भूविज्ञान ने एक ही बार में हमेशा के लिए तय कर दी",
            mr: "ते दाखवते की संसाधने निसर्गाने ठरलेली आणि अपरिवर्तनीय आहेत, म्हणून देशाची संपत्ती भूगर्भशास्त्राने एकदाच कायमची ठरवली",
          },
          {
            en: "It proves that conservation is pointless, since technology will always find a substitute for anything exhausted",
            hi: "यह सिद्ध करता है कि संरक्षण व्यर्थ है, क्योंकि तकनीक चुक गई हर चीज़ का विकल्प सदा खोज ही लेगी",
            mr: "ते सिद्ध करते की संधारण निरर्थक आहे, कारण तंत्रज्ञान संपलेल्या प्रत्येक गोष्टीचा पर्याय सदैव शोधून काढेलच",
          },
          {
            en: "It means only governments, never people or technology, can decide what counts as a resource",
            hi: "इसका अर्थ है कि केवल सरकारें, कभी लोग या तकनीक नहीं, तय कर सकती हैं कि संसाधन क्या गिना जाए",
            mr: "याचा अर्थ फक्त सरकारे, कधीही लोक वा तंत्रज्ञान नव्हे, ठरवू शकतात की संसाधन काय गणले जाईल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The three examples all make the same point from different directions: nothing in the material changed, and yet each became a resource. The petroleum under Mesopotamia was chemically identical to the petroleum under Texas, but for four thousand years it was a nuisance that seeped into wells; it became the most contested substance on earth only when the internal combustion engine created a use for it. Uranium sat in mineral collections as a heavy curiosity until physics found what its nucleus could do. Sunlight has fallen on every roof for as long as there have been roofs, and became a resource only when photovoltaic cells made it collectible. So the correct definition is relational: something is a resource when a material, a technology capable of using it and a human need coincide. Remove any one of the three and the resource disappears — which is exactly why the textbook distinction between stock and reserve is not bookkeeping but the heart of the idea. A stock is material we hold but cannot yet use; a reserve is the part we can. The line between them is drawn by knowledge, and it moves whenever knowledge does, without a gram of new matter being created anywhere. Several consequences follow, and they are practical rather than philosophical. First, an inventory of a country's resources is always provisional, so resource planning has to be revisited as technology changes; a survey written in 1950 was working with a different list from one written today. Second, investment in science and skills is itself a form of resource creation — the cheapest way to acquire a new reserve is often to develop the technology that unlocks a stock you already hold. India's own solar potential is the clearest case: the sunlight was always there, and the resource is the technology. Third, and most importantly, the relational definition cuts against the argument that we may use up whatever we can currently sell. If what counts as usable expands with knowledge, then material we exhaust today is not merely spent — it is removed from every future use that has not yet been invented, and the people who will need it are not yet born to object. That is the reasoning behind sustainable development: meeting present needs without compromising the ability of future generations to meet theirs, formalised at the 1992 Rio Earth Summit and the Agenda 21 programme. Note carefully what this does not license. It is not an argument that technology will always rescue us, because there is no guarantee a substitute exists for any particular material, and some losses — an extinct species, an aquifer drained, a soil eroded to rock — cannot be reversed by any technology at all. The honest position is that a resource is created by knowledge and destroyed by carelessness, and that a country must husband both the material and the learning that turns material into resource. (The wrong answers treat endowment as fixed by geology, use technological optimism to dismiss conservation, or confuse the state's power to regulate with the question of what makes something usable at all.)",
          hi: "तीनों उदाहरण अलग-अलग दिशाओं से एक ही बात कहते हैं: सामग्री में कुछ नहीं बदला, फिर भी हर एक संसाधन बन गया। मेसोपोटामिया के नीचे का पेट्रोलियम टेक्सस के नीचे के पेट्रोलियम से रासायनिक रूप से समान था, पर चार हज़ार वर्ष वह कुओं में रिसता एक झंझट था; वह पृथ्वी का सबसे विवादित पदार्थ तभी बना जब अंतर्दहन इंजन ने उसके लिए उपयोग रचा। यूरेनियम खनिज-संग्रहों में एक भारी कौतुक बना बैठा रहा जब तक भौतिकी ने न पाया कि उसका नाभिक क्या कर सकता है। धूप हर छत पर तब से गिरती रही जब से छतें हैं, और संसाधन तभी बनी जब प्रकाश-वोल्टीय सेलों ने उसे बटोरने योग्य बनाया। अतः सही परिभाषा सांबंधिक है: कोई चीज़ तब संसाधन है जब सामग्री, उसे इस्तेमाल करने में सक्षम तकनीक और मानवीय आवश्यकता एक साथ मिलें। तीनों में से किसी एक को हटाओ और संसाधन ग़ायब — ठीक इसीलिए भंडार और संचित कोष का पाठ्य-भेद बही-खाता नहीं बल्कि विचार का हृदय है। भंडार वह सामग्री है जो हमारे पास है पर अभी इस्तेमाल नहीं हो सकती; संचित कोष वह हिस्सा है जो हो सकती है। उनके बीच की रेखा ज्ञान खींचता है, और वह जब भी ज्ञान हिले तब हिलती है, और कहीं एक ग्राम नई सामग्री नहीं बनती। इससे कई परिणाम निकलते हैं, और वे दार्शनिक नहीं व्यावहारिक हैं। पहला, किसी देश के संसाधनों की सूची सदा अस्थायी है, अतः तकनीक बदलने पर संसाधन नियोजन फिर से देखना पड़ता है; 1950 में लिखा सर्वेक्षण आज लिखे सर्वेक्षण से भिन्न सूची पर काम कर रहा था। दूसरा, विज्ञान और कौशल में निवेश स्वयं संसाधन-निर्माण का एक रूप है — नया संचित कोष पाने का सबसे सस्ता रास्ता अक्सर वह तकनीक विकसित करना है जो पहले से रखे भंडार को खोल दे। भारत की अपनी सौर संभावना सबसे स्पष्ट प्रकरण है: धूप सदा वहाँ थी, और संसाधन तकनीक है। तीसरा, और सबसे महत्वपूर्ण, सांबंधिक परिभाषा उस तर्क को काटती है कि जो हम इस समय बेच सकते हैं उसे चुका देना ठीक है। यदि जो उपयोग योग्य गिना जाता वह ज्ञान के साथ फैलता है, तो आज जो सामग्री हम चुका देते हैं वह मात्र ख़र्च नहीं होती — वह हर उस भावी उपयोग से हट जाती है जिसका अभी आविष्कार भी नहीं हुआ, और जिन्हें उसकी ज़रूरत होगी वे आपत्ति करने को अभी जन्मे तक नहीं। यही सतत विकास के पीछे का तर्क है: वर्तमान ज़रूरतें ऐसे पूरी करना कि भावी पीढ़ियों की अपनी ज़रूरतें पूरी करने की क्षमता न घटे — जिसे 1992 के रियो पृथ्वी सम्मेलन और एजेंडा 21 कार्यक्रम में औपचारिक रूप दिया गया। ध्यान से देखो कि यह किसकी छूट नहीं देता। यह यह तर्क नहीं है कि तकनीक हमें सदा बचा लेगी, क्योंकि किसी विशेष सामग्री का विकल्प मौजूद होने की कोई गारंटी नहीं, और कुछ हानियाँ — लुप्त हुई जाति, चुक गया जलभृत, चट्टान तक कट गई मिट्टी — किसी भी तकनीक से पलटी नहीं जा सकतीं। ईमानदार स्थिति यह है कि संसाधन ज्ञान से बनता है और लापरवाही से नष्ट होता है, और देश को सामग्री तथा वह सीख — दोनों — सहेजनी होती है जो सामग्री को संसाधन बनाती है। (ग़लत उत्तर संपदा को भूविज्ञान से नियत मानते, तकनीकी आशावाद से संरक्षण झटकते, या राज्य की नियमन-शक्ति को इस प्रश्न से गड्डमड्ड करते कि कोई चीज़ उपयोग योग्य बनती किससे है।)",
          mr: "तिन्ही उदाहरणे वेगवेगळ्या दिशांनी एकच मुद्दा मांडतात: पदार्थात काही बदलले नाही, तरीही प्रत्येक संसाधन बनले. मेसोपोटेमियाखालचे पेट्रोलियम टेक्ससखालच्या पेट्रोलियमशी रासायनिकदृष्ट्या सारखे होते, पण चार हजार वर्षे ते विहिरींत झिरपणारी कटकट होते; ते पृथ्वीवरील सर्वांत वादग्रस्त पदार्थ तेव्हाच बनले जेव्हा अंतर्ज्वलन इंजिनाने त्यासाठी उपयोग घडवला. युरेनियम खनिज-संग्रहांत एक जड कुतूहल म्हणून बसून राहिले जोवर भौतिकशास्त्राला त्याचे केंद्रक काय करू शकते ते सापडले नाही. सूर्यप्रकाश प्रत्येक छपरावर तेव्हापासून पडत आहे जेव्हापासून छपरे आहेत, आणि संसाधन तेव्हाच बनला जेव्हा प्रकाश-विद्युत घटांनी तो गोळा करण्याजोगा केला. म्हणून योग्य व्याख्या नात्याची आहे: एखादी गोष्ट तेव्हा संसाधन असते जेव्हा पदार्थ, तो वापरण्यास सक्षम तंत्रज्ञान आणि मानवी गरज एकत्र येतात. तिघांपैकी एक काढा आणि संसाधन नाहीसे — नेमके म्हणूनच साठा आणि राखीव यांतील पाठ्य-भेद खतावणी नव्हे तर कल्पनेचे हृदय आहे. साठा म्हणजे तो पदार्थ जो आपल्याकडे आहे पण अजून वापरता येत नाही; राखीव म्हणजे तो भाग जो वापरता येतो. त्यांच्यातील रेषा ज्ञान आखते, आणि ज्ञान हलले की ती हलते, आणि कुठेही एक ग्रॅम नवा पदार्थ तयार होत नाही. यातून अनेक परिणाम निघतात, आणि ते तात्त्विक नव्हे तर व्यावहारिक आहेत. पहिला, देशाच्या संसाधनांची यादी सदैव तात्पुरती असते, म्हणून तंत्रज्ञान बदलल्यावर संसाधन नियोजन पुन्हा पाहावे लागते; 1950 मध्ये लिहिलेले सर्वेक्षण आज लिहिलेल्या सर्वेक्षणाहून वेगळ्या यादीवर काम करत होते. दुसरा, विज्ञान आणि कौशल्यांतील गुंतवणूक हे स्वतःच संसाधन-निर्मितीचे एक रूप — नवे राखीव मिळवण्याचा सर्वांत स्वस्त मार्ग अनेकदा ते तंत्रज्ञान विकसित करणे जे आधीच असलेला साठा उघडेल. भारताची स्वतःची सौर क्षमता हे सर्वांत स्पष्ट प्रकरण: सूर्यप्रकाश सदैव तिथे होता, आणि संसाधन म्हणजे तंत्रज्ञान. तिसरा, आणि सर्वांत महत्त्वाचा, नात्याची व्याख्या त्या युक्तिवादाला कापते की जे आपण सध्या विकू शकतो ते संपवणे ठीक. जे वापरण्याजोगे गणले जाते ते ज्ञानासोबत विस्तारत असेल, तर आज जो पदार्थ आपण संपवतो तो केवळ खर्च होत नाही — तो अजून शोधल्याही न गेलेल्या प्रत्येक भविष्यातील वापरातून काढून टाकला जातो, आणि ज्यांना त्याची गरज असेल ते आक्षेप घ्यायला अजून जन्मलेलेही नाहीत. हाच शाश्वत विकासामागचा तर्क: वर्तमान गरजा अशा भागवणे की भावी पिढ्यांची स्वतःच्या गरजा भागवण्याची क्षमता घटणार नाही — ज्याला 1992 च्या रिओ पृथ्वी परिषदेत आणि अजेंडा 21 कार्यक्रमात औपचारिक रूप दिले गेले. काळजीपूर्वक पाहा हे कशाची मुभा देत नाही. हा युक्तिवाद नाही की तंत्रज्ञान आपल्याला सदैव वाचवेल, कारण कोणत्याही विशिष्ट पदार्थाचा पर्याय अस्तित्वात असेल याची हमी नाही, आणि काही हानी — नामशेष झालेली जात, आटलेला जलधर, खडकापर्यंत झिजलेली माती — कोणत्याही तंत्रज्ञानाने उलटवता येत नाही. प्रामाणिक भूमिका ही की संसाधन ज्ञानाने घडते आणि निष्काळजीपणाने नष्ट होते, आणि देशाने पदार्थ आणि पदार्थाचे संसाधनात रूपांतर करणारे शिक्षण — दोन्ही — जपावे लागते. (चुकीची उत्तरे संपदा भूगर्भशास्त्राने ठरलेली मानतात, तांत्रिक आशावादाने संधारण झटकतात, वा राज्याच्या नियमन-सत्तेला एखादी गोष्ट मुळात वापरण्याजोगी कशाने बनते या प्रश्नाशी गोंधळवतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Forest and Wildlife Resources                               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-10-forest-wildlife",
    subject: "GEOGRAPHY",
    classLevel: 10,
    chapter: {
      en: "Chapter 2 — Forest and Wildlife Resources",
      hi: "अध्याय 2 — वन एवं वन्य जीव संसाधन",
      mr: "प्रकरण 2 — वने आणि वन्यजीव संसाधने",
    },
    name: {
      en: "Forest and Wildlife Resources",
      hi: "वन एवं वन्य जीव संसाधन",
      mr: "वने आणि वन्यजीव संसाधने",
    },
    summary: {
      en: "A country's living wealth counted and then defended: the variety that makes a forest more than its timber, species graded by how close they stand to disappearing, a campaign that saved one animal and a village that hugged its trees, and the grove no forest guard has ever needed to patrol.",
      hi: "किसी देश की जीवित संपदा गिनी और फिर बचाई गई: वह विविधता जो वन को उसकी लकड़ी से अधिक बनाती है, लुप्त होने से कितनी दूर खड़ी हैं इससे आँकी गई जातियाँ, वह अभियान जिसने एक जीव बचाया और वह गाँव जिसने अपने पेड़ों को गले लगाया, और वह उपवन जिस पर किसी वनरक्षक की गश्त कभी ज़रूरी नहीं पड़ी।",
      mr: "एखाद्या देशाची जिवंत संपदा मोजली आणि मग जपली: जी विविधता जंगलाला त्याच्या लाकडाहून अधिक करते, नाहीशा होण्यापासून किती जवळ आहेत यावरून मोजलेल्या जाती, ज्या मोहिमेने एक प्राणी वाचवला आणि ज्या गावाने आपल्या झाडांना मिठी मारली, आणि ज्या राईवर कोणत्या वनरक्षकाची गस्त कधी लागलीच नाही.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "biodiversity",
        name: {
          en: "Biodiversity",
          hi: "जैव विविधता",
          mr: "जैवविविधता",
        },
        kind: "idea",
        prompt: {
          en: "A single hectare of tropical forest may hold hundreds of tree species, thousands of insects and the birds, fungi and soil life that depend on them, all bound into one working web. What is this variety of life called?",
          hi: "उष्णकटिबंधीय वन का एक हेक्टेयर सैकड़ों वृक्ष-जातियाँ, हज़ारों कीट और उन पर निर्भर पक्षी, कवक तथा मृदा-जीवन समेटे हो सकता है, सब एक कार्यरत जाल में बँधे। जीवन की यह विविधता क्या कहलाती है?",
          mr: "उष्णकटिबंधीय जंगलाचा एक हेक्टर शेकडो वृक्षजाती, हजारो कीटक आणि त्यांच्यावर अवलंबून पक्षी, बुरशी व मृदा-जीवन सामावू शकतो, सर्व एका कार्यरत जाळ्यात बांधलेले. जीवनाची ही विविधता काय म्हणतात?",
        },
        statement: {
          en: "Biodiversity is the variety of living forms — species, the genes within them and the ecosystems they make up — and the interdependence among them that keeps the whole system working.",
          hi: "जैव विविधता जीवित रूपों की विविधता है — जातियाँ, उनके भीतर के जीन और वे पारितंत्र जो वे बनाते हैं — तथा उनके बीच वह परस्पर-निर्भरता जो पूरे तंत्र को चलाती रखती है।",
          mr: "जैवविविधता म्हणजे जिवंत रूपांची विविधता — जाती, त्यांच्यातील जनुके आणि त्या घडवणाऱ्या परिसंस्था — आणि त्यांच्यातील ती परस्परावलंबिता जी अख्खी यंत्रणा चालू ठेवते.",
        },
        detail: {
          en: "India holds about eight per cent of the world's recorded species on roughly two per cent of its land area, which makes it one of the most biodiverse countries on earth.",
          hi: "भारत विश्व की लगभग आठ प्रतिशत अभिलिखित जातियाँ लगभग दो प्रतिशत भूभाग पर रखता है, जो उसे पृथ्वी के सबसे जैव-विविध देशों में गिनवाता है।",
          mr: "भारत जगातील सुमारे आठ टक्के नोंदल्या गेलेल्या जाती सुमारे दोन टक्के भूभागावर बाळगतो, ज्यामुळे तो पृथ्वीवरील सर्वांत जैवविविध देशांपैकी एक ठरतो.",
        },
        extra: {
          en: "Its value is not only in the species themselves: pollinators, soil builders and water regulators do work that would cost enormous sums to replace.",
          hi: "उसका मूल्य केवल जातियों में नहीं: परागणकर्ता, मृदा-निर्माता और जल-नियामक ऐसा काम करते हैं जिसे बदलने में विशाल राशि लगेगी।",
          mr: "तिचे मोल केवळ जातींत नाही: परागकण वाहक, मृदा घडवणारे आणि जल नियंत्रक असे काम करतात ज्याची जागा भरायला प्रचंड रक्कम लागेल.",
        },
        pair: {
          left: {
            en: "Species, genes and ecosystems bound in one web",
            hi: "एक जाल में बँधे जातियाँ, जीन और पारितंत्र",
            mr: "एका जाळ्यात बांधलेल्या जाती, जनुके आणि परिसंस्था",
          },
          right: {
            en: "biodiversity",
            hi: "जैव विविधता",
            mr: "जैवविविधता",
          },
        },
      },
      {
        id: "threat-categories",
        name: {
          en: "Endangered and vulnerable species",
          hi: "संकटग्रस्त और सुभेद्य जातियाँ",
          mr: "संकटग्रस्त आणि असुरक्षित जाती",
        },
        kind: "idea",
        prompt: {
          en: "The blackbuck's numbers are falling but it survives in many places; the Asiatic cheetah is gone from India altogether; the Nicobar pigeon lives nowhere else on earth. Which grading of species by risk is being used here?",
          hi: "काले हिरन की संख्या घट रही है पर वह कई जगह बचा है; एशियाई चीता भारत से पूरी तरह जा चुका है; निकोबारी कबूतर पृथ्वी पर और कहीं नहीं रहता। यहाँ जातियों की जोखिम से कौन-सी श्रेणीबद्धता इस्तेमाल हो रही है?",
          mr: "काळवीटाची संख्या घटत आहे पण तो अनेक ठिकाणी टिकून आहे; आशियाई चित्ता भारतातून पूर्णपणे गेला आहे; निकोबारी कबूतर पृथ्वीवर इतरत्र कुठेही राहत नाही. इथे जातींची जोखमीनुसार कोणती श्रेणीबद्धता वापरली जात आहे?",
        },
        statement: {
          en: "Species are graded by how close they stand to disappearing — normal, vulnerable, endangered, rare, endemic to one region, and extinct — so that protection can be directed where the risk is highest.",
          hi: "जातियाँ इससे आँकी जाती हैं कि वे लुप्त होने से कितनी दूर खड़ी हैं — सामान्य, सुभेद्य, संकटग्रस्त, दुर्लभ, किसी एक क्षेत्र तक सीमित, और विलुप्त — ताकि संरक्षण वहाँ भेजा जा सके जहाँ जोखिम सबसे बड़ी है।",
          mr: "जाती त्या नाहीशा होण्यापासून किती जवळ आहेत यावरून मोजल्या जातात — सामान्य, असुरक्षित, संकटग्रस्त, दुर्मीळ, एकाच प्रदेशापुरत्या, आणि नामशेष — जेणेकरून संरक्षण तिथे पाठवता येईल जिथे जोखीम सर्वाधिक.",
        },
        detail: {
          en: "An endemic species is the most fragile of all, because it exists in only one place and a single local disaster can end it everywhere at once.",
          hi: "स्थानिक जाति सबसे नाज़ुक होती है, क्योंकि वह केवल एक ही जगह रहती है और एक स्थानीय आपदा उसे हर जगह एक साथ मिटा सकती है।",
          mr: "प्रदेशनिष्ठ जात सर्वांत नाजूक, कारण ती फक्त एकाच ठिकाणी असते आणि एक स्थानिक आपत्ती तिला सर्वत्र एकाच वेळी संपवू शकते.",
        },
        extra: {
          en: "The categories are not permanent: sustained protection has moved species back down the list, which is what makes the grading worth maintaining.",
          hi: "ये श्रेणियाँ स्थायी नहीं: लगातार संरक्षण ने जातियों को सूची में नीचे लौटाया है, और यही इस श्रेणीबद्धता को सँभालने योग्य बनाता है।",
          mr: "या श्रेणी कायमच्या नाहीत: सातत्यपूर्ण संरक्षणाने जाती यादीत खाली परत आणल्या आहेत, आणि हेच ही श्रेणीबद्धता जपण्याजोगी करते.",
        },
        pair: {
          left: {
            en: "Graded from vulnerable to extinct",
            hi: "सुभेद्य से विलुप्त तक आँकी गईं",
            mr: "असुरक्षितपासून नामशेषापर्यंत मोजलेल्या",
          },
          right: {
            en: "endangered and vulnerable species",
            hi: "संकटग्रस्त और सुभेद्य जातियाँ",
            mr: "संकटग्रस्त आणि असुरक्षित जाती",
          },
        },
      },
      {
        id: "project-tiger",
        name: {
          en: "Project Tiger",
          hi: "प्रोजेक्ट टाइगर",
          mr: "प्रोजेक्ट टायगर",
        },
        kind: "event",
        prompt: {
          en: "Launched in 1973 after numbers had fallen from an estimated forty thousand at the start of the century to under two thousand, it set aside reserves such as Corbett, Bandhavgarh and Periyar for one flagship animal. Which programme is this?",
          hi: "1973 में तब शुरू हुआ जब संख्या सदी के आरंभ के अनुमानित चालीस हज़ार से गिरकर दो हज़ार से नीचे आ गई थी, इसने कॉर्बेट, बांधवगढ़ और पेरियार जैसे आरक्षित क्षेत्र एक प्रमुख जीव के लिए अलग रखे। यह कौन-सा कार्यक्रम है?",
          mr: "1973 मध्ये तेव्हा सुरू झाला जेव्हा संख्या शतकाच्या सुरुवातीच्या अंदाजे चाळीस हजारांवरून दोन हजारांखाली आली होती, त्याने कॉर्बेट, बांधवगड आणि पेरियारसारखी राखीव क्षेत्रे एका प्रमुख प्राण्यासाठी बाजूला ठेवली. हा कोणता कार्यक्रम?",
        },
        statement: {
          en: "Project Tiger, begun in 1973, created a network of tiger reserves across India with strict protection of core areas, after poaching and habitat loss had reduced the population to a few hundred animals.",
          hi: "1973 में शुरू हुए प्रोजेक्ट टाइगर ने भारत भर बाघ आरक्षित क्षेत्रों का जाल बनाया जिनके क्रोड क्षेत्रों में कड़ा संरक्षण था, यह तब जब अवैध शिकार और आवास-हानि आबादी को कुछ सौ जानवरों तक ले आई थी।",
          mr: "1973 मध्ये सुरू झालेल्या प्रोजेक्ट टायगरने भारतभर वाघ राखीव क्षेत्रांचे जाळे उभारले ज्यांच्या गाभा क्षेत्रांत कडक संरक्षण होते, हे तेव्हा जेव्हा शिकार आणि अधिवास-हानीने संख्या काहीशे प्राण्यांपर्यंत आणली होती.",
        },
        detail: {
          en: "The tiger was chosen because it needs a very large territory and abundant prey, so protecting it protects the whole forest beneath it.",
          hi: "बाघ इसलिए चुना गया कि उसे बहुत बड़ा क्षेत्र और भरपूर शिकार चाहिए, अतः उसकी रक्षा उसके नीचे के पूरे वन की रक्षा करती है।",
          mr: "वाघ यासाठी निवडला की त्याला खूप मोठा प्रदेश आणि विपुल भक्ष्य लागते, म्हणून त्याचे रक्षण त्याच्याखालच्या अख्ख्या जंगलाचे रक्षण करते.",
        },
        extra: {
          en: "Its weakness was the same as its method: strict exclusion put reserve boundaries against the villages that had lived off those forests, and the conflict has never fully gone away.",
          hi: "उसकी दुर्बलता वही थी जो उसकी विधि: कड़े बहिष्कार ने आरक्षित सीमाओं को उन गाँवों के आमने-सामने खड़ा किया जो उन्हीं वनों से जीते थे, और वह टकराव कभी पूरी तरह गया नहीं।",
          mr: "त्याची दुर्बलता तीच होती जी त्याची पद्धत: कडक वगळण्याने राखीव सीमा त्या गावांसमोर उभ्या केल्या जी त्याच जंगलांवर जगत, आणि तो संघर्ष कधीच पूर्ण संपला नाही.",
        },
        pair: {
          left: {
            en: "Reserves for one flagship animal from 1973",
            hi: "1973 से एक प्रमुख जीव के लिए आरक्षित क्षेत्र",
            mr: "1973 पासून एका प्रमुख प्राण्यासाठी राखीव क्षेत्रे",
          },
          right: {
            en: "Project Tiger",
            hi: "प्रोजेक्ट टाइगर",
            mr: "प्रोजेक्ट टायगर",
          },
        },
      },
      {
        id: "chipko-movement",
        name: {
          en: "The Chipko movement",
          hi: "चिपको आंदोलन",
          mr: "चिपको चळवळ",
        },
        kind: "event",
        prompt: {
          en: "In the Garhwal Himalaya in the 1970s villagers, many of them women, put their arms around trees marked for felling by contractors, and won a ban on commercial logging in the region. Which movement is this?",
          hi: "1970 के दशक में गढ़वाल हिमालय में गाँववालों ने, जिनमें कई स्त्रियाँ थीं, ठेकेदारों द्वारा कटाई के लिए चिह्नित पेड़ों को बाँहों में भर लिया, और उस क्षेत्र में व्यावसायिक कटाई पर रोक जीत ली। यह कौन-सा आंदोलन है?",
          mr: "1970 च्या दशकात गढवाल हिमालयात गावकऱ्यांनी, ज्यांत अनेक स्त्रिया होत्या, कंत्राटदारांनी तोडणीसाठी खुणावलेल्या झाडांना मिठी मारली, आणि त्या प्रदेशात व्यापारी तोडणीवर बंदी मिळवली. ही कोणती चळवळ?",
        },
        statement: {
          en: "The Chipko movement of the 1970s in the Garhwal Himalaya saw villagers physically embrace trees to stop contractors felling them, and it succeeded in halting commercial logging and proving community afforestation could work.",
          hi: "1970 के दशक में गढ़वाल हिमालय के चिपको आंदोलन में गाँववालों ने ठेकेदारों को पेड़ काटने से रोकने के लिए उन्हें शारीरिक रूप से गले लगाया, और वह व्यावसायिक कटाई रोकने तथा यह सिद्ध करने में सफल रहा कि सामुदायिक वनरोपण चल सकता है।",
          mr: "1970 च्या दशकातील गढवाल हिमालयातील चिपको चळवळीत गावकऱ्यांनी कंत्राटदारांना झाडे तोडण्यापासून रोखायला त्यांना प्रत्यक्ष मिठी मारली, आणि ती व्यापारी तोडणी थांबवण्यात आणि सामुदायिक वनलागवड चालू शकते हे सिद्ध करण्यात यशस्वी ठरली.",
        },
        detail: {
          en: "The grievance was concrete: felled slopes had brought landslides and floods, and the timber went to distant industry while the village lost its fuel, fodder and topsoil.",
          hi: "शिकायत ठोस थी: कटी ढलानों ने भूस्खलन और बाढ़ें दीं, और लकड़ी दूर के उद्योग को गई जबकि गाँव ने अपना ईंधन, चारा और ऊपरी मिट्टी खोई।",
          mr: "तक्रार ठोस होती: तोडलेल्या उतारांनी भूस्खलन आणि पूर आणले, आणि लाकूड दूरच्या उद्योगाला गेले तर गावाने आपले इंधन, चारा आणि वरची माती गमावली.",
        },
        extra: {
          en: "Its lasting argument was that the people nearest a forest have the strongest interest in its survival, because they bear the cost of losing it first.",
          hi: "उसका टिकाऊ तर्क यह था कि वन के सबसे पास रहते लोगों का उसके बचे रहने में सबसे बड़ा हित है, क्योंकि उसे खोने की क़ीमत सबसे पहले वही चुकाते हैं।",
          mr: "तिचा टिकाऊ युक्तिवाद हा की जंगलाच्या सर्वांत जवळ राहणाऱ्या लोकांचे त्याच्या टिकण्यात सर्वांत मोठे हित, कारण ते गमावण्याची किंमत सर्वांत आधी तेच मोजतात.",
        },
        pair: {
          left: {
            en: "Arms around the marked trees in Garhwal",
            hi: "गढ़वाल में चिह्नित पेड़ों के गिर्द बाँहें",
            mr: "गढवालात खुणावलेल्या झाडांभोवती मिठी",
          },
          right: {
            en: "the Chipko movement",
            hi: "चिपको आंदोलन",
            mr: "चिपको चळवळ",
          },
        },
      },
      {
        id: "joint-forest-management",
        name: {
          en: "Joint Forest Management",
          hi: "संयुक्त वन प्रबंधन",
          mr: "संयुक्त वन व्यवस्थापन",
        },
        kind: "structure",
        prompt: {
          en: "Beginning in Odisha in 1988, village institutions were formally recognised as partners in protecting degraded state forest, in return for a share of the timber and rights to minor forest produce. What arrangement is this?",
          hi: "1988 में ओडिशा से शुरू होकर, गाँव की संस्थाओं को क्षरित राजकीय वन की रक्षा में औपचारिक साझेदार माना गया, बदले में लकड़ी में हिस्सा और गौण वन-उपज के अधिकार मिले। यह कौन-सी व्यवस्था है?",
          mr: "1988 मध्ये ओडिशापासून सुरू होऊन, गावातील संस्थांना क्षीण झालेल्या शासकीय जंगलाच्या रक्षणात औपचारिक भागीदार मानले गेले, बदल्यात लाकडात वाटा आणि गौण वनोपजाचे हक्क मिळाले. ही कोणती व्यवस्था?",
        },
        statement: {
          en: "Joint Forest Management, begun in Odisha in 1988, involves local village committees in protecting and restoring degraded forests in partnership with the forest department, in exchange for a share of the produce.",
          hi: "संयुक्त वन प्रबंधन, जो 1988 में ओडिशा में शुरू हुआ, वन विभाग के साथ साझेदारी में क्षरित वनों की रक्षा और पुनर्स्थापना में स्थानीय ग्राम समितियों को जोड़ता है, उपज में हिस्से के बदले।",
          mr: "संयुक्त वन व्यवस्थापन, जे 1988 मध्ये ओडिशात सुरू झाले, वन विभागाच्या भागीदारीत क्षीण जंगलांचे रक्षण व पुनरुज्जीवन करण्यात स्थानिक ग्राम समित्यांना जोडते, उपजातील वाट्याच्या बदल्यात.",
        },
        detail: {
          en: "The logic is direct: a village that will receive a share of the harvest has a reason to stop outsiders — and its own members — from felling early.",
          hi: "तर्क सीधा है: जिस गाँव को उपज में हिस्सा मिलेगा उसके पास बाहरवालों को — और अपने ही सदस्यों को — जल्दी काटने से रोकने का कारण है।",
          mr: "तर्क सरळ आहे: ज्या गावाला उपजात वाटा मिळणार आहे त्याच्याकडे बाहेरच्यांना — आणि स्वतःच्या सदस्यांनाही — लवकर तोडण्यापासून रोखण्याचे कारण आहे.",
        },
        extra: {
          en: "It works best where the committee genuinely holds power; where the department keeps every decision, the partnership becomes a name for unpaid guard duty.",
          hi: "यह वहाँ सबसे अच्छा चलता है जहाँ समिति के पास सचमुच शक्ति हो; जहाँ हर निर्णय विभाग अपने पास रखे, वहाँ साझेदारी बिना वेतन की चौकीदारी का नाम बन जाती है।",
          mr: "ते तिथे सर्वांत चांगले चालते जिथे समितीकडे खरोखर सत्ता असते; जिथे प्रत्येक निर्णय विभाग स्वतःकडे ठेवतो, तिथे भागीदारी बिनपगारी पहारेकरीचे नाव बनते.",
        },
        pair: {
          left: {
            en: "Village committees as partners, with a share of produce",
            hi: "साझेदार के रूप में ग्राम समितियाँ, उपज में हिस्से के साथ",
            mr: "भागीदार म्हणून ग्राम समित्या, उपजातील वाट्यासह",
          },
          right: {
            en: "Joint Forest Management",
            hi: "संयुक्त वन प्रबंधन",
            mr: "संयुक्त वन व्यवस्थापन",
          },
        },
      },
      {
        id: "sacred-groves",
        name: {
          en: "Sacred groves",
          hi: "पवित्र उपवन",
          mr: "देवराया",
        },
        kind: "idea",
        prompt: {
          en: "In Rajasthan, Meghalaya, Kerala and the Western Ghats, patches of untouched forest are left standing because a deity is held to live there, and cutting even a branch is forbidden by custom. What are these called?",
          hi: "राजस्थान, मेघालय, केरल और पश्चिमी घाट में अछूते वन के टुकड़े इसलिए खड़े छोड़े जाते हैं कि वहाँ किसी देवता का वास माना जाता है, और परंपरा एक टहनी काटना भी मना करती है। ये क्या कहलाते हैं?",
          mr: "राजस्थान, मेघालय, केरळ आणि पश्चिम घाटांत अस्पर्श जंगलाचे तुकडे यासाठी उभे ठेवले जातात की तिथे एखाद्या देवतेचा वास मानला जातो, आणि परंपरा एक फांदी तोडणेही मनाई करते. यांना काय म्हणतात?",
        },
        statement: {
          en: "Sacred groves are patches of forest protected by religious belief and community custom rather than by law, and they often preserve species and old-growth trees lost from the surrounding landscape.",
          hi: "पवित्र उपवन वन के वे टुकड़े हैं जो क़ानून से नहीं बल्कि धार्मिक विश्वास और सामुदायिक परंपरा से सुरक्षित हैं, और वे अक्सर उन जातियों तथा पुराने पेड़ों को बचाए रखते हैं जो आसपास के भूदृश्य से जा चुके हैं।",
          mr: "देवराया म्हणजे जंगलाचे ते तुकडे जे कायद्याने नव्हे तर धार्मिक श्रद्धा आणि सामुदायिक परंपरेने सुरक्षित आहेत, आणि ते अनेकदा त्या जाती व जुनी झाडे टिकवतात जी भोवतीच्या भूदृश्यातून गेली आहेत.",
        },
        detail: {
          en: "The Bishnois of Rajasthan extend the same protection to animals, and the blackbuck and chinkara survive around their villages where they are hunted elsewhere.",
          hi: "राजस्थान के बिश्नोई वही सुरक्षा जीवों तक बढ़ाते हैं, और उनके गाँवों के आसपास काला हिरन तथा चिंकारा बचे हैं जहाँ अन्यत्र उनका शिकार होता है।",
          mr: "राजस्थानचे बिश्नोई तेच संरक्षण प्राण्यांपर्यंत वाढवतात, आणि त्यांच्या गावांभोवती काळवीट व चिंकारा टिकून आहेत जिथे इतरत्र त्यांची शिकार होते.",
        },
        extra: {
          en: "They matter as evidence, not just as relics: they show conservation can hold for centuries without a single guard, provided the community believes the rule is its own.",
          hi: "वे केवल अवशेष के रूप में नहीं, प्रमाण के रूप में मायने रखते हैं: वे दिखाते हैं कि संरक्षण बिना एक भी पहरेदार के सदियों टिक सकता है, बशर्ते समुदाय नियम को अपना माने।",
          mr: "ते केवळ अवशेष म्हणून नव्हे तर पुरावा म्हणून महत्त्वाचे: ते दाखवतात की संधारण एकही पहारेकरीविना शतके टिकू शकते, जर समुदायाला नियम आपला वाटत असेल.",
        },
        pair: {
          left: {
            en: "Forest kept whole by belief, not by law",
            hi: "क़ानून से नहीं, विश्वास से पूरा बचा वन",
            mr: "कायद्याने नव्हे, श्रद्धेने अखंड राखलेले जंगल",
          },
          right: {
            en: "sacred groves",
            hi: "पवित्र उपवन",
            mr: "देवराया",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Colonial and post-independence forest policy treated conservation as a matter of drawing a boundary and keeping people out, yet forests inside such boundaries have often degraded while village-protected patches nearby stayed intact. Explain why exclusion so frequently fails.",
          hi: "औपनिवेशिक और स्वतंत्रता के बाद की वन-नीति ने संरक्षण को सीमा खींचकर लोगों को बाहर रखने का मामला माना, फिर भी ऐसी सीमाओं के भीतर के वन अक्सर क्षरित हुए जबकि पास के गाँव-रक्षित टुकड़े अछूते बने रहे। समझाओ बहिष्कार इतनी बार विफल क्यों होता है।",
          mr: "वसाहती आणि स्वातंत्र्योत्तर वननीतीने संधारणाला सीमा आखून लोकांना बाहेर ठेवण्याची बाब मानले, तरीही अशा सीमांच्या आतली जंगले अनेकदा क्षीण झाली तर जवळचे गाव-रक्षित तुकडे अभंग राहिले. समजावा वगळणे इतक्या वेळा का फसते.",
        },
        choices: [
          {
            en: "Because a boundary removes the people with the strongest stake in the forest and replaces them with a handful of underpaid guards who cannot watch thousands of hectares. Villagers who lose fuel, fodder and grazing gain no reason to protect what is now someone else's, and every use becomes an offence, so they stop reporting outsiders. Where communities keep rights and a share — as in sacred groves and Joint Forest Management — protection has thousands of eyes instead of two",
            hi: "क्योंकि सीमा उन लोगों को हटा देती है जिनका वन में सबसे बड़ा दाँव है और उनकी जगह मुट्ठी भर कम-वेतन पहरेदार रख देती है जो हज़ारों हेक्टेयर नहीं देख सकते। जो गाँववाले ईंधन, चारा और चराई खोते हैं उनके पास अब किसी और की चीज़ बचाने का कोई कारण नहीं रहता, और हर उपयोग अपराध बन जाता है, अतः वे बाहरवालों की सूचना देना बंद कर देते हैं। जहाँ समुदाय अधिकार और हिस्सा रखते हैं — जैसे पवित्र उपवनों और संयुक्त वन प्रबंधन में — वहाँ रक्षा के पास दो के बजाय हज़ारों आँखें होती हैं",
            mr: "कारण सीमा त्या लोकांना काढून टाकते ज्यांचा जंगलात सर्वांत मोठा वाटा आहे आणि त्यांच्या जागी मूठभर कमी पगाराचे पहारेकरी ठेवते जे हजारो हेक्टर पाहू शकत नाहीत. जे गावकरी इंधन, चारा आणि चराई गमावतात त्यांच्याकडे आता दुसऱ्या कोणाची वस्तू जपण्याचे कारण उरत नाही, आणि प्रत्येक वापर गुन्हा बनतो, म्हणून ते बाहेरच्यांची खबर देणे थांबवतात. जिथे समुदाय हक्क आणि वाटा राखतात — जसे देवराया आणि संयुक्त वन व्यवस्थापनात — तिथे रक्षणाकडे दोनऐवजी हजारो डोळे असतात",
          },
          {
            en: "Because forests inside reserves receive less rainfall than forests outside them",
            hi: "क्योंकि आरक्षित क्षेत्रों के भीतर के वनों को बाहर के वनों से कम वर्षा मिलती है",
            mr: "कारण राखीव क्षेत्रांतील जंगलांना बाहेरच्या जंगलांपेक्षा कमी पाऊस मिळतो",
          },
          {
            en: "Because villagers are indifferent to forests and would destroy any forest they were allowed near",
            hi: "क्योंकि गाँववाले वनों के प्रति उदासीन हैं और जिस वन के पास उन्हें जाने दिया जाए उसे नष्ट कर देंगे",
            mr: "कारण गावकरी जंगलांबद्दल उदासीन आहेत आणि ज्या जंगलाजवळ त्यांना जाऊ दिले ते नष्ट करतील",
          },
          {
            en: "Because exclusion never fails; every protected area in India is in better condition than every unprotected one",
            hi: "क्योंकि बहिष्कार कभी विफल नहीं होता; भारत का हर संरक्षित क्षेत्र हर असंरक्षित क्षेत्र से बेहतर हालत में है",
            mr: "कारण वगळणे कधीच फसत नाही; भारतातील प्रत्येक संरक्षित क्षेत्र प्रत्येक असंरक्षित क्षेत्राहून चांगल्या स्थितीत आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The failure is not a failure of intention but of arithmetic and incentive, and both point the same way. Start with the arithmetic. A reserve may run to hundreds or thousands of square kilometres, patrolled by a small, poorly paid and thinly equipped staff. No number of guards a state can afford will cover that ground continuously. Effective protection has always depended on the fact that people who live in and around a forest are in it every day and notice immediately when a truck arrives, a snare is set or a tree is marked. The exclusion model removes precisely those observers and replaces them with a handful of officials, so surveillance collapses to almost nothing across most of the area most of the time. Now the incentive, which matters more. Before the boundary, a village's relationship to the forest was one of use and therefore of interest: it supplied firewood, fodder, grazing, bamboo, honey, medicinal plants and, for many Adivasi communities, a large part of the diet. A community that depends on a forest year after year has a direct stake in it still being there next year, and customary rules — seasons, quotas, protected patches, sacred groves — commonly enforced that. Draw a line and declare the forest state property, and that relationship is inverted. The villagers now bear pure cost: they lose the fuel and fodder, they must buy or walk further for what was free, they may be relocated, and crop-raiding animals from the protected area are the department's animals but the farmer's loss. What they gain is nothing. Worse, every ordinary use — a head-load of firewood, a goat let in to graze — becomes a punishable offence, so ordinary people become poachers in law, and the relationship with the forest staff becomes adversarial. The predictable consequence is that nobody reports the outsider with the chainsaw either, because informing serves an institution that treats you as a criminal. That is why the counter-examples are so instructive. Sacred groves have survived for centuries with no guard at all, protected by a rule the community regards as its own. The Bishnois protect blackbuck around their villages while the same species is hunted elsewhere. Chipko succeeded because the villagers' interest in standing trees — against landslides, for fuel and fodder — was stronger than any contractor's interest, and stronger than any patrol. Joint Forest Management was designed on exactly this reading: give the village committee a share of the produce and a genuine say, and protection acquires thousands of watchful people instead of two. None of this means protected areas are worthless; core zones with strict protection have been essential for species like the tiger that cannot tolerate disturbance. It means conservation designed against local people is fighting the one force that could make it cheap and permanent, and that where rights and benefits are shared, the forest gains a constituency rather than an enemy. (The wrong answers invent a rainfall difference, blame villagers for a destruction the record attributes largely to commercial logging and clearance, or deny the well-documented degradation inside many reserves.)",
          hi: "विफलता इरादे की नहीं, अंकगणित और प्रेरणा की है, और दोनों एक ही ओर इशारा करते हैं। अंकगणित से शुरू। कोई आरक्षित क्षेत्र सैकड़ों या हज़ारों वर्ग किलोमीटर का हो सकता है, जिस पर छोटा, कम-वेतन और कम साधन वाला अमला गश्त करता है। राज्य जितने पहरेदार जुटा सकता है वे उस भूभाग को लगातार नहीं ढक सकते। कारगर संरक्षण सदा इस तथ्य पर टिका रहा कि वन में और उसके आसपास रहते लोग हर दिन उसी में होते हैं और तुरंत भाँप लेते हैं कि कोई ट्रक आया, फंदा लगा या पेड़ चिह्नित हुआ। बहिष्कार का ढाँचा ठीक उन्हीं प्रेक्षकों को हटाता है और उनकी जगह मुट्ठी भर अधिकारी रखता है, अतः अधिकांश क्षेत्र में अधिकांश समय निगरानी लगभग शून्य पर आ जाती है। अब प्रेरणा, जो अधिक मायने रखती है। सीमा से पहले गाँव का वन से रिश्ता उपयोग का और इसलिए हित का था: वह ईंधन, चारा, चराई, बाँस, शहद, औषधीय पौधे और कई आदिवासी समुदायों के लिए आहार का बड़ा हिस्सा देता था। जो समुदाय वर्ष-दर-वर्ष वन पर निर्भर है उसका सीधा दाँव इसमें है कि वह अगले वर्ष भी वहाँ हो, और परंपरागत नियम — मौसम, मात्राएँ, सुरक्षित टुकड़े, पवित्र उपवन — आमतौर पर यही लागू करते थे। रेखा खींचो और वन को राजकीय संपत्ति घोषित करो, तो वह रिश्ता उलट जाता है। अब गाँववाले शुद्ध लागत ढोते हैं: वे ईंधन और चारा खोते हैं, जो मुफ़्त था उसके लिए ख़रीदना या दूर चलना पड़ता है, उन्हें हटाया जा सकता है, और संरक्षित क्षेत्र से आकर फ़सल उजाड़ते जानवर विभाग के हैं पर हानि किसान की। जो मिलता है वह कुछ नहीं। इससे बुरा यह कि हर साधारण उपयोग — सिर पर ईंधन का गट्ठर, चरने छोड़ी बकरी — दंडनीय अपराध बन जाता है, अतः साधारण लोग क़ानून की नज़र में शिकारी बन जाते हैं, और वन-कर्मियों से रिश्ता शत्रुता का हो जाता है। अपेक्षित परिणाम यह कि आरी लिए बाहरवाले की सूचना भी कोई नहीं देता, क्योंकि सूचना उस संस्था के काम आती है जो तुम्हें अपराधी मानती है। इसीलिए प्रति-उदाहरण इतने शिक्षाप्रद हैं। पवित्र उपवन बिना एक भी पहरेदार सदियों बचे रहे, ऐसे नियम से सुरक्षित जिसे समुदाय अपना मानता है। बिश्नोई अपने गाँवों के आसपास काले हिरन बचाते हैं जबकि वही जाति अन्यत्र शिकार होती है। चिपको इसलिए सफल हुआ कि खड़े पेड़ों में गाँववालों का हित — भूस्खलन के विरुद्ध, ईंधन और चारे के लिए — किसी ठेकेदार के हित से और किसी गश्त से अधिक प्रबल था। संयुक्त वन प्रबंधन ठीक इसी पाठ पर रचा गया: ग्राम समिति को उपज में हिस्सा और असली आवाज़ दो, और रक्षा को दो के बजाय हज़ारों चौकस लोग मिल जाते हैं। इसका अर्थ यह नहीं कि संरक्षित क्षेत्र निर्मूल्य हैं; कड़े संरक्षण वाले क्रोड क्षेत्र बाघ जैसी जातियों के लिए अनिवार्य रहे हैं जो व्यवधान नहीं सह सकतीं। इसका अर्थ यह है कि स्थानीय लोगों के विरुद्ध रचा संरक्षण उसी एक शक्ति से लड़ रहा है जो उसे सस्ता और स्थायी बना सकती थी, और जहाँ अधिकार और लाभ बाँटे जाते हैं वहाँ वन को शत्रु नहीं, एक पक्ष मिल जाता है। (ग़लत उत्तर वर्षा का अंतर गढ़ते, उस विनाश का दोष गाँववालों पर डालते जिसे अभिलेख बड़े हिस्से में व्यावसायिक कटाई और सफ़ाई को देते हैं, या कई आरक्षित क्षेत्रों के भीतर के भली-भाँति दर्ज क्षरण को नकारते हैं।)",
          mr: "अपयश हेतूचे नव्हे तर अंकगणित आणि प्रेरणेचे आहे, आणि दोन्ही एकाच दिशेने निर्देश करतात. अंकगणितापासून सुरू. एखादे राखीव क्षेत्र शेकडो वा हजारो चौरस किलोमीटरचे असू शकते, ज्यावर लहान, कमी पगाराचा आणि तुटपुंजी साधने असलेला कर्मचारीवर्ग गस्त घालतो. राज्य जितके पहारेकरी परवडू शकते ते तो भूभाग सतत झाकू शकत नाहीत. परिणामकारक संरक्षण सदैव या तथ्यावर टेकले की जंगलात व त्याभोवती राहणारे लोक रोज त्यातच असतात आणि लगेच ओळखतात की ट्रक आला, सापळा लावला वा झाड खुणावले. वगळण्याचे प्रारूप नेमके त्याच निरीक्षकांना काढते आणि त्यांच्या जागी मूठभर अधिकारी ठेवते, म्हणून बहुतांश क्षेत्रात बहुतांश वेळ देखरेख जवळजवळ शून्यावर येते. आता प्रेरणा, जी अधिक महत्त्वाची. सीमेआधी गावाचे जंगलाशी नाते वापराचे आणि म्हणून हिताचे होते: ते इंधन, चारा, चराई, बांबू, मध, औषधी वनस्पती आणि अनेक आदिवासी समुदायांसाठी आहाराचा मोठा भाग देत असे. जो समुदाय वर्षानुवर्षे जंगलावर अवलंबून आहे त्याचा थेट वाटा यात की ते पुढच्या वर्षीही तिथे असावे, आणि पारंपरिक नियम — हंगाम, मर्यादा, राखीव तुकडे, देवराया — सहसा तेच राबवत. रेषा आखा आणि जंगल शासकीय मालमत्ता घोषित करा, आणि ते नाते उलटते. आता गावकरी शुद्ध खर्च वाहतात: ते इंधन आणि चारा गमावतात, जे फुकट होते त्यासाठी विकत घ्यावे वा दूर चालावे लागते, त्यांना हलवले जाऊ शकते, आणि संरक्षित क्षेत्रातून येऊन पीक उद्ध्वस्त करणारे प्राणी विभागाचे पण नुकसान शेतकऱ्याचे. जे मिळते ते काहीच नाही. याहून वाईट म्हणजे प्रत्येक सामान्य वापर — डोक्यावरचा इंधनाचा भारा, चरायला सोडलेली शेळी — शिक्षापात्र गुन्हा बनतो, म्हणून सामान्य माणसे कायद्याच्या नजरेत शिकारी बनतात, आणि वनकर्मचाऱ्यांशी नाते शत्रुत्वाचे होते. अपेक्षित परिणाम हा की करवत घेतलेल्या बाहेरच्याचीही खबर कोणी देत नाही, कारण खबर त्या संस्थेच्या उपयोगी पडते जी तुम्हाला गुन्हेगार मानते. म्हणूनच प्रति-उदाहरणे इतकी शिकवणारी. देवराया एकही पहारेकरीविना शतके टिकल्या, अशा नियमाने सुरक्षित जो समुदायाला आपला वाटतो. बिश्नोई आपल्या गावांभोवती काळवीट जपतात तर तीच जात इतरत्र शिकारली जाते. चिपको यासाठी यशस्वी झाली की उभ्या झाडांतील गावकऱ्यांचे हित — भूस्खलनाविरुद्ध, इंधन आणि चाऱ्यासाठी — कोणत्याही कंत्राटदाराच्या हिताहून आणि कोणत्याही गस्तीहून प्रबळ होते. संयुक्त वन व्यवस्थापन नेमके याच वाचनावर रचले गेले: ग्राम समितीला उपजात वाटा आणि खरा आवाज द्या, आणि रक्षणाला दोनऐवजी हजारो जागरूक माणसे मिळतात. याचा अर्थ संरक्षित क्षेत्रे निरुपयोगी असा नाही; कडक संरक्षणाची गाभा क्षेत्रे वाघासारख्या जातींसाठी अत्यावश्यक ठरली आहेत ज्या व्यत्यय सोसू शकत नाहीत. याचा अर्थ हा की स्थानिक लोकांविरुद्ध रचलेले संधारण त्याच एका शक्तीशी लढत आहे जी त्याला स्वस्त आणि कायमचे करू शकत होती, आणि जिथे हक्क व लाभ वाटले जातात तिथे जंगलाला शत्रू नव्हे तर एक पाठिराखा मिळतो. (चुकीची उत्तरे पावसाचा फरक रचतात, नोंदी मुख्यत्वे व्यापारी तोडणी आणि साफसफाईला देत असलेल्या विनाशाचा दोष गावकऱ्यांवर टाकतात, वा अनेक राखीव क्षेत्रांतील नोंदलेला ऱ्हास नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "It is often argued that a poor country cannot afford biodiversity — that protecting species is a luxury to be taken up once poverty is solved, and that forests are better converted to farms, mines and dams. Assess that argument on its own economic terms.",
          hi: "अक्सर तर्क दिया जाता है कि कोई निर्धन देश जैव विविधता का बोझ नहीं उठा सकता — कि जातियों की रक्षा एक विलासिता है जिसे निर्धनता हल होने के बाद उठाया जाए, और वनों को खेतों, खदानों तथा बाँधों में बदलना बेहतर है। उस तर्क को उसी की आर्थिक शर्तों पर परखो।",
          mr: "अनेकदा युक्तिवाद केला जातो की एखादा गरीब देश जैवविविधता परवडू शकत नाही — की जातींचे रक्षण ही चैन आहे जी दारिद्र्य सुटल्यावर हाती घ्यावी, आणि जंगले शेते, खाणी व धरणांत बदलणे अधिक चांगले. तो युक्तिवाद त्याच्याच आर्थिक अटींवर तपासा.",
        },
        choices: [
          {
            en: "It fails on its own terms, because the forest is already producing economic value that no budget records: pollination of crops, groundwater recharge, flood and landslide control, soil formation, timber and non-timber produce, and the genetic stock from which medicines and crop varieties are drawn. Clearing it converts a permanent income into a single payment and shifts the costs onto the poorest, who lose fuel, fodder and food first — so the trade-off is not development against nature but short-term revenue against long-term productivity",
            hi: "यह अपनी ही शर्तों पर विफल होता है, क्योंकि वन पहले से ही ऐसा आर्थिक मूल्य पैदा कर रहा है जिसे कोई बजट दर्ज नहीं करता: फ़सलों का परागण, भूजल पुनर्भरण, बाढ़ और भूस्खलन पर रोक, मृदा-निर्माण, काष्ठ और गौण उपज, तथा वह आनुवंशिक भंडार जिससे औषधियाँ और फ़सल-क़िस्में निकाली जाती हैं। उसे साफ़ करना एक स्थायी आय को एक बार की अदायगी में बदल देता है और लागत सबसे निर्धनों पर डाल देता है, जो ईंधन, चारा और भोजन सबसे पहले खोते हैं — अतः सौदा विकास बनाम प्रकृति का नहीं बल्कि अल्पकालिक राजस्व बनाम दीर्घकालिक उत्पादकता का है",
            mr: "तो त्याच्याच अटींवर फसतो, कारण जंगल आधीच असे आर्थिक मूल्य निर्माण करत आहे जे कोणतेही अंदाजपत्रक नोंदवत नाही: पिकांचे परागण, भूजल पुनर्भरण, पूर व भूस्खलनावर नियंत्रण, मृदा-निर्मिती, लाकूड व गौण उपज, आणि तो जनुकीय साठा ज्यातून औषधे व पीक-जाती काढल्या जातात. ते साफ करणे कायमच्या उत्पन्नाचे एकदाच्या भरण्यात रूपांतर करते आणि खर्च सर्वांत गरिबांवर टाकते, जे इंधन, चारा आणि अन्न सर्वांत आधी गमावतात — म्हणून सौदा विकास विरुद्ध निसर्ग नव्हे तर अल्पकालीन महसूल विरुद्ध दीर्घकालीन उत्पादकता",
          },
          {
            en: "The argument is sound: forests produce nothing measurable, so any conversion is a clear economic gain",
            hi: "तर्क ठीक है: वन कुछ भी मापने योग्य नहीं देते, अतः कोई भी रूपांतरण स्पष्ट आर्थिक लाभ है",
            mr: "युक्तिवाद योग्य आहे: जंगले काहीही मोजण्याजोगे देत नाहीत, म्हणून कोणतेही रूपांतर स्पष्ट आर्थिक लाभ",
          },
          {
            en: "The argument fails only because species have spiritual value, and economics has nothing to say about it either way",
            hi: "तर्क केवल इसलिए विफल होता है कि जातियों का आध्यात्मिक मूल्य है, और अर्थशास्त्र के पास इस बारे में कहने को कुछ भी नहीं",
            mr: "युक्तिवाद केवळ यासाठी फसतो की जातींना आध्यात्मिक मोल आहे, आणि अर्थशास्त्राकडे याबद्दल सांगायला काहीच नाही",
          },
          {
            en: "It is irrelevant, since forest loss in India has been driven entirely by natural causes rather than human decisions",
            hi: "यह अप्रासंगिक है, क्योंकि भारत में वन-हानि पूरी तरह प्राकृतिक कारणों से हुई, मानवीय निर्णयों से नहीं",
            mr: "तो असंबद्ध आहे, कारण भारतातील वनहानी पूर्णपणे नैसर्गिक कारणांनी झाली, मानवी निर्णयांनी नव्हे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The argument deserves to be met on economics rather than sentiment, and on that ground it does not hold up. Its hidden assumption is that a standing forest yields nothing, so that anything built in its place is pure gain. But a forest is already a producing asset; its output simply never appears in a revenue statement. Consider what it delivers. Insects that live in and near forest patches pollinate the crops of the farms around them, and where the forest goes the yields of several fruit and oilseed crops fall measurably. Forested catchments slow rainfall, let it soak in and recharge the wells and springs that irrigate and supply drinking water downstream; strip them, and the same rain arrives as flood in one week and drought in the next, which is precisely the sequence Chipko's villagers described after the felling above their fields. Roots hold hill slopes together, so deforestation buys landslides. Leaf fall builds soil, and soil is not quickly replaceable. Beyond these services there is direct produce — timber, bamboo, honey, lac, gum, tendu leaves, medicinal plants, fruit and fodder — much of it collected by people with no other cash income at all. And there is the genetic library: a large share of modern medicines derives from wild organisms, and plant breeders return repeatedly to wild relatives of crops for resistance to new diseases. That last item is an option whose value is unknown precisely because the uses have not been discovered yet — and it is destroyed permanently the moment a species goes. Now compare the conversion. Clearing a forest for a mine or a plantation delivers a large payment, but it is a single payment: the timber is sold once, the ore runs out, the reservoir silts up. Set against a permanent annual stream of pollination, water and produce, the arithmetic is far less favourable than it looks, and it looks favourable only because one side is priced and the other is not. There is also a distributional point the argument ignores entirely. The revenue from conversion goes to a company or a state treasury; the losses fall on the people who used the forest — Adivasi communities and the landless poor, for whom it was fuel, fodder, food and medicine, and who have no way of buying replacements. Development that impoverishes the poorest is a strange kind of anti-poverty policy. None of this establishes that no forest may ever be cleared. Roads, power and farmland are real needs, and there are cases where the calculation genuinely favours conversion. What it establishes is that the calculation must include the whole ledger — services, produce, option value and who bears the loss — rather than counting only the timber revenue and the project cost. Done honestly, that accounting turns most conversions into a choice between a short-term receipt and a long-term productive asset, which is why sustainable use, community rights and Joint Forest Management are argued for as economics rather than as sentiment. (The wrong answers accept the false premise that forests produce nothing measurable, retreat to spiritual value where an economic case is available, or deny human causation that the record of logging, clearance and mining documents plainly.)",
          hi: "तर्क को भावना के बजाय अर्थशास्त्र पर मिलना चाहिए, और उस ज़मीन पर वह टिकता नहीं। उसकी छिपी मान्यता यह है कि खड़ा वन कुछ नहीं देता, अतः उसकी जगह जो भी बने वह शुद्ध लाभ है। पर वन पहले से ही एक उत्पादक परिसंपत्ति है; उसका उत्पादन बस कभी किसी राजस्व-विवरण में नहीं आता। देखो वह क्या देता है। वन-टुकड़ों में और उनके पास रहते कीट आसपास के खेतों की फ़सलों का परागण करते हैं, और जहाँ वन जाता है वहाँ कई फल तथा तिलहन फ़सलों की पैदावार मापने योग्य ढंग से गिरती है। वनाच्छादित जल-ग्रहण क्षेत्र वर्षा को धीमा करते हैं, उसे रिसने देते हैं और उन कुओं-सोतों को भरते हैं जो नीचे सिंचाई और पेयजल देते हैं; उन्हें उजाड़ो, और वही वर्षा एक हफ़्ते बाढ़ और अगले हफ़्ते सूखा बनकर आती है — ठीक वही क्रम जो चिपको के गाँववालों ने अपने खेतों के ऊपर कटाई के बाद बताया। जड़ें पहाड़ी ढलानों को बाँधे रखती हैं, अतः वनोन्मूलन भूस्खलन ख़रीदता है। पत्ती-झड़न मिट्टी बनाती है, और मिट्टी जल्दी बदली नहीं जा सकती। इन सेवाओं से परे सीधी उपज है — काष्ठ, बाँस, शहद, लाख, गोंद, तेंदू पत्ता, औषधीय पौधे, फल और चारा — जिसका बड़ा हिस्सा वे लोग बटोरते हैं जिनकी और कोई नक़द आय है ही नहीं। और आनुवंशिक पुस्तकालय है: आधुनिक औषधियों का बड़ा हिस्सा जंगली जीवों से निकला है, और पादप-प्रजनक नई बीमारियों के प्रतिरोध के लिए बार-बार फ़सलों के जंगली संबंधियों तक लौटते हैं। वह अंतिम मद एक ऐसा विकल्प है जिसका मूल्य ठीक इसलिए अज्ञात है कि उसके उपयोग अभी खोजे ही नहीं गए — और जाति के जाते ही वह स्थायी रूप से नष्ट हो जाता है। अब रूपांतरण से तुलना करो। खदान या बाग़ान के लिए वन साफ़ करना बड़ी अदायगी देता है, पर वह एक बार की अदायगी है: लकड़ी एक बार बिकती है, अयस्क चुक जाता है, जलाशय गाद से भर जाता है। परागण, जल और उपज की स्थायी वार्षिक धारा के सामने रखो तो अंकगणित दिखने से कहीं कम अनुकूल है, और अनुकूल केवल इसलिए दिखता है कि एक पक्ष की क़ीमत लगी है और दूसरे की नहीं। एक वितरण-संबंधी बिंदु भी है जिसे तर्क पूरी तरह अनदेखा करता है। रूपांतरण का राजस्व किसी कंपनी या राजकोष को जाता है; हानि उन लोगों पर पड़ती है जो वन इस्तेमाल करते थे — आदिवासी समुदाय और भूमिहीन निर्धन, जिनके लिए वह ईंधन, चारा, भोजन और औषधि था, और जिनके पास विकल्प ख़रीदने का कोई उपाय नहीं। जो विकास सबसे निर्धनों को और निर्धन करे वह विचित्र क़िस्म की निर्धनता-विरोधी नीति है। इसमें से कुछ भी यह सिद्ध नहीं करता कि कोई वन कभी साफ़ न किया जाए। सड़कें, बिजली और कृषि-भूमि असली ज़रूरतें हैं, और ऐसे प्रकरण हैं जहाँ गणना सचमुच रूपांतरण के पक्ष में जाती है। यह जो सिद्ध करता है वह यह कि गणना में पूरी बही आनी चाहिए — सेवाएँ, उपज, विकल्प-मूल्य और हानि कौन ढोता है — केवल काष्ठ-राजस्व और परियोजना-लागत गिनकर नहीं। ईमानदारी से किया जाए तो वह लेखांकन अधिकांश रूपांतरणों को अल्पकालिक रसीद और दीर्घकालिक उत्पादक परिसंपत्ति के बीच के चुनाव में बदल देता है — इसीलिए सतत उपयोग, सामुदायिक अधिकार और संयुक्त वन प्रबंधन के लिए भावना के बजाय अर्थशास्त्र के तर्क दिए जाते हैं। (ग़लत उत्तर इस झूठी मान्यता को स्वीकार लेते कि वन कुछ भी मापने योग्य नहीं देते, जहाँ आर्थिक तर्क उपलब्ध है वहाँ आध्यात्मिक मूल्य में लौट जाते, या उस मानवीय कारणता को नकारते जिसे कटाई, सफ़ाई और खनन का अभिलेख साफ़ दर्ज करता है।)",
          mr: "युक्तिवादाला भावनेऐवजी अर्थशास्त्रावर भेटले पाहिजे, आणि त्या भूमीवर तो टिकत नाही. त्याचे लपलेले गृहीतक हे की उभे जंगल काही देत नाही, म्हणून त्याच्या जागी जे बांधले जाईल ते शुद्ध लाभ. पण जंगल आधीच उत्पादक मालमत्ता आहे; तिचे उत्पादन फक्त कधीही महसूल-विवरणात येत नाही. ते काय देते ते पाहा. जंगल-तुकड्यांत आणि त्यांच्याजवळ राहणारे कीटक भोवतीच्या शेतांतील पिकांचे परागण करतात, आणि जिथे जंगल जाते तिथे अनेक फळ व तेलबिया पिकांचे उत्पादन मोजण्याजोगे घसरते. जंगलाच्छादित पाणलोट पाऊस मंदावतात, त्याला मुरू देतात आणि त्या विहिरी-झऱ्यांना भरतात जे खाली सिंचन व पिण्याचे पाणी देतात; ते उजाड करा, आणि तोच पाऊस एका आठवड्यात पूर आणि पुढच्या आठवड्यात दुष्काळ बनून येतो — नेमका तोच क्रम जो चिपकोच्या गावकऱ्यांनी आपल्या शेतांवरील तोडणीनंतर वर्णिला. मुळे डोंगरउतार बांधून ठेवतात, म्हणून वनतोड भूस्खलन विकत घेते. पानगळ माती घडवते, आणि माती लवकर बदलता येत नाही. या सेवांपलीकडे थेट उपज आहे — लाकूड, बांबू, मध, लाख, डिंक, तेंदूपाने, औषधी वनस्पती, फळे आणि चारा — ज्याचा मोठा भाग ते लोक गोळा करतात ज्यांना दुसरे कोणतेही रोख उत्पन्न नाहीच. आणि जनुकीय ग्रंथालय आहे: आधुनिक औषधांचा मोठा भाग वन्य जीवांतून आला आहे, आणि वनस्पती-प्रजननकर्ते नव्या रोगांच्या प्रतिकारासाठी वारंवार पिकांच्या वन्य नातलगांकडे परततात. ती शेवटची बाब असा पर्याय आहे जिचे मोल नेमके यासाठी अज्ञात की तिचे उपयोग अजून शोधलेच गेले नाहीत — आणि जात जाताच तो कायमचा नष्ट होतो. आता रूपांतराशी तुलना करा. खाण वा मळ्यासाठी जंगल साफ करणे मोठे भरणे देते, पण ते एकदाचे भरणे: लाकूड एकदा विकले जाते, धातुक संपते, जलाशय गाळाने भरतो. परागण, पाणी आणि उपजाच्या कायमच्या वार्षिक प्रवाहासमोर ठेवले तर अंकगणित दिसण्याहून कितीतरी कमी अनुकूल आहे, आणि अनुकूल केवळ यासाठी दिसते की एका बाजूची किंमत लावली आहे आणि दुसऱ्याची नाही. एक वाटपाचा मुद्दाही आहे जो युक्तिवाद पूर्णपणे दुर्लक्षितो. रूपांतराचा महसूल एखाद्या कंपनीला वा राजकोषाला जातो; हानी त्या लोकांवर पडते ज्यांनी जंगल वापरले — आदिवासी समुदाय आणि भूमिहीन गरीब, ज्यांच्यासाठी ते इंधन, चारा, अन्न आणि औषध होते, आणि ज्यांच्याकडे पर्याय विकत घेण्याचा कोणताही मार्ग नाही. जो विकास सर्वांत गरिबांना अधिक गरीब करतो ते विचित्र प्रकारचे दारिद्र्यविरोधी धोरण. यातील काहीही हे सिद्ध करत नाही की कोणतेही जंगल कधीही साफ करू नये. रस्ते, वीज आणि शेतजमीन या खऱ्या गरजा आहेत, आणि अशी प्रकरणे आहेत जिथे हिशोब खरोखर रूपांतराच्या बाजूने जातो. जे ते सिद्ध करते ते हे की हिशोबात अख्खी खतावणी यावी — सेवा, उपज, पर्याय-मोल आणि हानी कोण वाहतो — केवळ लाकूड-महसूल आणि प्रकल्प-खर्च मोजून नव्हे. प्रामाणिकपणे केल्यास ते लेखांकन बहुतांश रूपांतरांना अल्पकालीन पावती आणि दीर्घकालीन उत्पादक मालमत्ता यांतील निवडीत बदलते — म्हणूनच शाश्वत वापर, सामुदायिक हक्क आणि संयुक्त वन व्यवस्थापनासाठी भावनेऐवजी अर्थशास्त्राचे युक्तिवाद दिले जातात. (चुकीची उत्तरे जंगले काहीही मोजण्याजोगे देत नाहीत हे खोटे गृहीतक स्वीकारतात, जिथे आर्थिक युक्तिवाद उपलब्ध आहे तिथे आध्यात्मिक मोलाकडे माघार घेतात, वा तोडणी, साफसफाई व खाणकामाच्या नोंदी स्पष्ट दस्तऐवजीकृत करत असलेली मानवी कारणे नाकारतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Water Resources                                             */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-10-water-resources",
    subject: "GEOGRAPHY",
    classLevel: 10,
    chapter: {
      en: "Chapter 3 — Water Resources",
      hi: "अध्याय 3 — जल संसाधन",
      mr: "प्रकरण 3 — जलसंसाधने",
    },
    name: {
      en: "Water Resources",
      hi: "जल संसाधन",
      mr: "जलसंसाधने",
    },
    summary: {
      en: "A country with plenty of rain and not enough water: shortage that comes from how it is shared rather than how much falls, the great dams sold as temples and the valleys they drowned, the movement that asked who pays for a reservoir — and the roof, the tanka and the bamboo pipe that answer the same question without a wall across a river.",
      hi: "भरपूर वर्षा और फिर भी पर्याप्त पानी नहीं वाला देश: वह कमी जो इससे आती है कि पानी कैसे बाँटा जाता, न कि कितना गिरता; मंदिर कहकर बेचे गए बड़े बाँध और उनके डुबोए घाटियाँ; वह आंदोलन जिसने पूछा कि जलाशय की क़ीमत कौन चुकाता — और वह छत, टाँका तथा बाँस की नली जो वही प्रश्न बिना नदी पर दीवार खींचे उत्तर देते हैं।",
      mr: "भरपूर पाऊस आणि तरीही पुरेसे पाणी नसलेला देश: ती टंचाई जी पाणी कसे वाटले जाते यातून येते, किती पडते यातून नव्हे; मंदिरे म्हणून विकली गेलेली मोठी धरणे आणि त्यांनी बुडवलेल्या दऱ्या; ज्या चळवळीने विचारले की जलाशयाची किंमत कोण मोजतो — आणि ते छप्पर, टाकं आणि बांबूची नळी जी तोच प्रश्न नदीवर भिंत न घालता उत्तरतात.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "water-stress",
        name: {
          en: "Water stress in India",
          hi: "भारत में जल-तनाव",
          mr: "भारतात जल-ताण",
        },
        kind: "idea",
        prompt: {
          en: "Cherrapunji receives some of the heaviest rainfall on earth and still faces drinking-water shortage in the dry months; Delhi has piped supply that reaches some colonies daily and others once a week. What condition do both illustrate?",
          hi: "चेरापूँजी पृथ्वी की सबसे भारी वर्षा में से कुछ पाता है और फिर भी शुष्क महीनों में पेयजल की कमी झेलता है; दिल्ली में पाइप की आपूर्ति कुछ कॉलोनियों तक रोज़ और कुछ तक हफ़्ते में एक बार पहुँचती है। दोनों कौन-सी स्थिति दिखाते हैं?",
          mr: "चेरापुंजीला पृथ्वीवरील सर्वांत जास्त पावसांपैकी काही मिळतो आणि तरीही कोरड्या महिन्यांत पिण्याच्या पाण्याची टंचाई सोसते; दिल्लीत नळाचा पुरवठा काही वसाहतींना रोज आणि काहींना आठवड्यातून एकदा पोहोचतो. दोन्ही कोणती स्थिती दाखवतात?",
        },
        statement: {
          en: "Water stress in India arises less from the total rainfall than from its uneven timing and distribution, over-extraction of groundwater, pollution of surface water, and unequal access between users.",
          hi: "भारत में जल-तनाव कुल वर्षा से कम, उसके असमान समय और वितरण, भूजल के अति-दोहन, सतही जल के प्रदूषण तथा उपयोगकर्ताओं के बीच असमान पहुँच से उठता है।",
          mr: "भारतातील जल-ताण एकूण पावसाहून कमी, त्याच्या असमान वेळ व वाटपातून, भूजलाच्या अति-उपशातून, पृष्ठजलाच्या प्रदूषणातून आणि वापरकर्त्यांमधील असमान प्रवेशातून उद्भवतो.",
        },
        detail: {
          en: "Most of the rain arrives in about a hundred days of the monsoon, so a place can be flooded in July and parched in April of the same year.",
          hi: "अधिकांश वर्षा मानसून के लगभग सौ दिनों में आती है, अतः कोई जगह उसी वर्ष जुलाई में डूबी और अप्रैल में सूखी हो सकती है।",
          mr: "बहुतांश पाऊस मान्सूनच्या सुमारे शंभर दिवसांत येतो, म्हणून एखादे ठिकाण त्याच वर्षी जुलैत बुडालेले आणि एप्रिलमध्ये कोरडे असू शकते.",
        },
        extra: {
          en: "Scarcity is therefore social as much as physical: two households on the same street can face entirely different shortages depending on which is on the pipe.",
          hi: "अतः कमी भौतिक जितनी ही सामाजिक है: एक ही गली के दो घर पूरी तरह भिन्न कमी झेल सकते हैं, यह इस पर कि पाइप किसके यहाँ है।",
          mr: "म्हणून टंचाई भौतिक जितकीच सामाजिक: एकाच गल्लीतील दोन घरे पूर्णपणे वेगळी टंचाई सोसू शकतात, नळ कोणाकडे आहे यावरून.",
        },
        pair: {
          left: {
            en: "Rain in a hundred days, shortage in the other two hundred",
            hi: "सौ दिनों में वर्षा, शेष दो सौ में कमी",
            mr: "शंभर दिवसांत पाऊस, उरलेल्या दोनशेत टंचाई",
          },
          right: {
            en: "water stress in India",
            hi: "भारत में जल-तनाव",
            mr: "भारतात जल-ताण",
          },
        },
      },
      {
        id: "multipurpose-projects",
        name: {
          en: "Multi-purpose river projects",
          hi: "बहुउद्देशीय नदी परियोजनाएँ",
          mr: "बहुउद्देशीय नदी प्रकल्प",
        },
        kind: "structure",
        prompt: {
          en: "Bhakra-Nangal on the Sutlej and Hirakud on the Mahanadi were each built to do several jobs at once — store water for irrigation, generate electricity, control floods and supply towns. What are such schemes called?",
          hi: "सतलुज पर भाखड़ा-नांगल और महानदी पर हीराकुंड — दोनों एक साथ कई काम करने बनाए गए: सिंचाई को पानी रोकना, बिजली बनाना, बाढ़ रोकना और शहरों को आपूर्ति देना। ऐसी योजनाएँ क्या कहलाती हैं?",
          mr: "सतलजवरील भाक्रा-नांगल आणि महानदीवरील हिराकूड — दोन्ही एकाच वेळी अनेक कामे करायला बांधली: सिंचनासाठी पाणी अडवणे, वीज निर्माण करणे, पूर रोखणे आणि शहरांना पुरवठा देणे. अशा योजना काय म्हणतात?",
        },
        statement: {
          en: "Multi-purpose river projects use a single dam to serve several ends at once — irrigation, hydroelectricity, flood control, water supply, navigation and fisheries — and were called the temples of modern India.",
          hi: "बहुउद्देशीय नदी परियोजनाएँ एक ही बाँध से एक साथ कई उद्देश्य साधती हैं — सिंचाई, जल-विद्युत, बाढ़-नियंत्रण, जल-आपूर्ति, नौवहन और मत्स्य-पालन — और इन्हें आधुनिक भारत के मंदिर कहा गया।",
          mr: "बहुउद्देशीय नदी प्रकल्प एकाच धरणातून एकाच वेळी अनेक उद्दिष्टे साधतात — सिंचन, जलविद्युत, पूरनियंत्रण, पाणीपुरवठा, जलवाहतूक आणि मत्स्यपालन — आणि यांना आधुनिक भारताची मंदिरे म्हटले गेले.",
        },
        detail: {
          en: "The gains were real: assured canal irrigation carried the Green Revolution in Punjab and Haryana, and hydel power ran the factories that followed.",
          hi: "लाभ असली थे: निश्चित नहर-सिंचाई ने पंजाब और हरियाणा में हरित क्रांति ढोई, और जल-विद्युत ने उसके बाद आए कारख़ाने चलाए।",
          mr: "फायदे खरे होते: खात्रीशीर कालवा-सिंचनाने पंजाब आणि हरियाणात हरितक्रांती वाहिली, आणि जलविद्युतेने नंतर आलेले कारखाने चालवले.",
        },
        extra: {
          en: "The costs were also real: submerged villages and forests, silt trapped behind the wall instead of enriching the fields, and floods made worse when a full reservoir must release water in a heavy year.",
          hi: "लागतें भी असली थीं: डूबे गाँव और वन, खेतों को समृद्ध करने के बजाय दीवार के पीछे फँसी गाद, और भारी वर्ष में भरे जलाशय से पानी छोड़ना पड़े तो और बिगड़ी बाढ़ें।",
          mr: "खर्चही खरे होते: बुडालेली गावे व जंगले, शेतांना समृद्ध करण्याऐवजी भिंतीमागे अडकलेला गाळ, आणि जास्त पावसाच्या वर्षी भरलेल्या जलाशयातून पाणी सोडावे लागल्यास अधिक बिघडलेले पूर.",
        },
        pair: {
          left: {
            en: "One dam for irrigation, power and flood control",
            hi: "सिंचाई, बिजली और बाढ़-नियंत्रण के लिए एक बाँध",
            mr: "सिंचन, वीज आणि पूरनियंत्रणासाठी एक धरण",
          },
          right: {
            en: "multi-purpose river projects",
            hi: "बहुउद्देशीय नदी परियोजनाएँ",
            mr: "बहुउद्देशीय नदी प्रकल्प",
          },
        },
      },
      {
        id: "narmada-bachao",
        name: {
          en: "The Narmada Bachao Andolan",
          hi: "नर्मदा बचाओ आंदोलन",
          mr: "नर्मदा बचाव आंदोलन",
        },
        kind: "event",
        prompt: {
          en: "A movement of villagers, Adivasi communities, farmers and environmentalists opposed the raising of a large dam on a central Indian river, arguing that those displaced were never properly resettled. Which movement is this?",
          hi: "गाँववालों, आदिवासी समुदायों, किसानों और पर्यावरणवादियों के एक आंदोलन ने मध्य भारत की एक नदी पर बड़े बाँध की ऊँचाई बढ़ाने का विरोध किया, यह तर्क देते हुए कि विस्थापितों का कभी ठीक से पुनर्वास हुआ ही नहीं। यह कौन-सा आंदोलन है?",
          mr: "गावकरी, आदिवासी समुदाय, शेतकरी आणि पर्यावरणवाद्यांच्या एका चळवळीने मध्य भारतातील एका नदीवरील मोठ्या धरणाची उंची वाढवण्यास विरोध केला, हा युक्तिवाद करत की विस्थापितांचे कधी नीट पुनर्वसन झालेच नाही. ही कोणती चळवळ?",
        },
        statement: {
          en: "The Narmada Bachao Andolan opposed the raising of the Sardar Sarovar dam on the Narmada, on the grounds that displaced villagers and Adivasi families were not properly resettled or compensated.",
          hi: "नर्मदा बचाओ आंदोलन ने नर्मदा पर सरदार सरोवर बाँध की ऊँचाई बढ़ाने का विरोध इस आधार पर किया कि विस्थापित गाँववालों और आदिवासी परिवारों का न ठीक से पुनर्वास हुआ न मुआवज़ा।",
          mr: "नर्मदा बचाव आंदोलनाने नर्मदेवरील सरदार सरोवर धरणाची उंची वाढवण्यास या आधारावर विरोध केला की विस्थापित गावकरी आणि आदिवासी कुटुंबांचे नीट पुनर्वसन झाले नाही ना मोबदला मिळाला.",
        },
        detail: {
          en: "The complaint was distributional rather than technical: the water and power went to distant districts while the submergence fell on the valley's own people.",
          hi: "शिकायत तकनीकी नहीं, वितरण-संबंधी थी: पानी और बिजली दूर के ज़िलों को गए जबकि डूब घाटी के अपने ही लोगों पर पड़ी।",
          mr: "तक्रार तांत्रिक नव्हे तर वाटपाची होती: पाणी आणि वीज दूरच्या जिल्ह्यांना गेली तर बुडीत खोऱ्याच्याच लोकांवर पडली.",
        },
        extra: {
          en: "It changed how such projects are judged, forcing resettlement, environmental clearance and public hearing into the approval process for large dams.",
          hi: "उसने बदल दिया कि ऐसी परियोजनाएँ कैसे आँकी जाती हैं, और बड़े बाँधों की स्वीकृति-प्रक्रिया में पुनर्वास, पर्यावरणीय अनापत्ति तथा जन-सुनवाई को घुसा दिया।",
          mr: "तिने असे प्रकल्प कसे तपासले जातात ते बदलले, आणि मोठ्या धरणांच्या मंजुरी-प्रक्रियेत पुनर्वसन, पर्यावरणीय मंजुरी व जनसुनावणी घुसवली.",
        },
        pair: {
          left: {
            en: "Who is drowned so that others may irrigate",
            hi: "कौन डूबे ताकि दूसरे सींच सकें",
            mr: "कोण बुडावे जेणेकरून इतरांना सिंचन मिळेल",
          },
          right: {
            en: "the Narmada Bachao Andolan",
            hi: "नर्मदा बचाओ आंदोलन",
            mr: "नर्मदा बचाव आंदोलन",
          },
        },
      },
      {
        id: "rainwater-harvesting",
        name: {
          en: "Rooftop rainwater harvesting",
          hi: "छत से वर्षाजल संचयन",
          mr: "छपरावरील पावसाळी जलसंचय",
        },
        kind: "process",
        prompt: {
          en: "In Shillong many households collect the rain that falls on their own roofs through pipes into a stored tank or a recharge pit, and meet a large part of their needs without any municipal line. What practice is this?",
          hi: "शिलांग में कई घर अपनी ही छतों पर गिरती वर्षा को पाइपों से संचित टंकी या पुनर्भरण गड्ढे में जमा करते हैं, और अपनी ज़रूरतों का बड़ा हिस्सा बिना किसी नगरपालिका लाइन के पूरा करते हैं। यह कौन-सी प्रथा है?",
          mr: "शिलाँगमध्ये अनेक घरे स्वतःच्या छपरांवर पडणारा पाऊस नळ्यांतून साठवण टाकीत वा पुनर्भरण खड्ड्यात गोळा करतात, आणि आपल्या गरजांचा मोठा भाग कोणत्याही नगरपालिका वाहिनीविना भागवतात. ही कोणती प्रथा?",
        },
        statement: {
          en: "Rooftop rainwater harvesting collects the rain falling on a roof and channels it into a storage tank or a pit that recharges the groundwater, giving a household water it does not have to be supplied.",
          hi: "छत से वर्षाजल संचयन छत पर गिरती वर्षा को इकट्ठा कर उसे संचय-टंकी या भूजल भरने वाले गड्ढे में ले जाता है, जिससे घर को वह पानी मिलता है जिसे आपूर्ति करनी नहीं पड़ती।",
          mr: "छपरावरील पावसाळी जलसंचय छपरावर पडणारा पाऊस गोळा करून तो साठवण टाकीत वा भूजल भरणाऱ्या खड्ड्यात नेतो, ज्यामुळे घराला ते पाणी मिळते जे पुरवावे लागत नाही.",
        },
        detail: {
          en: "It is cheap, needs no land acquisition and displaces nobody, and it puts the supply under the control of the household that built it.",
          hi: "यह सस्ता है, भूमि-अधिग्रहण नहीं माँगता और किसी को विस्थापित नहीं करता, और आपूर्ति उसी घर के नियंत्रण में रखता है जिसने उसे बनाया।",
          mr: "ते स्वस्त, जमीन-संपादन मागत नाही आणि कोणालाही विस्थापित करत नाही, आणि पुरवठा त्याच घराच्या नियंत्रणात ठेवते ज्याने ते बांधले.",
        },
        extra: {
          en: "Several states now require it in new buildings, and Tamil Nadu was the first to make it compulsory across the state.",
          hi: "कई राज्य अब इसे नए भवनों में अनिवार्य करते हैं, और तमिलनाडु पहला राज्य था जिसने इसे पूरे राज्य में अनिवार्य किया।",
          mr: "अनेक राज्ये आता नव्या इमारतींत ते सक्तीचे करतात, आणि तमिळनाडू हे ते संपूर्ण राज्यभर सक्तीचे करणारे पहिले राज्य होते.",
        },
        pair: {
          left: {
            en: "The roof's own rain, piped to a tank or a pit",
            hi: "छत की अपनी वर्षा, टंकी या गड्ढे तक पाइप से",
            mr: "छपराचा स्वतःचा पाऊस, नळीने टाकीत वा खड्ड्यात",
          },
          right: {
            en: "rooftop rainwater harvesting",
            hi: "छत से वर्षाजल संचयन",
            mr: "छपरावरील पावसाळी जलसंचय",
          },
        },
      },
      {
        id: "tankas",
        name: {
          en: "The tankas of Rajasthan",
          hi: "राजस्थान के टाँके",
          mr: "राजस्थानची टाकी",
        },
        kind: "structure",
        prompt: {
          en: "In Bikaner and Jaisalmer, underground rooms are dug beneath the courtyard, plastered watertight and fed by the rooftops, holding rain through a year in which almost none may fall again. What are these called?",
          hi: "बीकानेर और जैसलमेर में आँगन के नीचे भूमिगत कोठरियाँ खोदी जातीं, जलरोधी पलस्तर की जातीं और छतों से भरी जातीं, जो पूरे वर्ष वर्षा सँभालती हैं जिसमें शायद फिर कुछ भी न बरसे। ये क्या कहलाती हैं?",
          mr: "बिकानेर आणि जैसलमेरमध्ये अंगणाखाली भूमिगत खोल्या खणल्या जातात, जलरोधक गिलावा केला जातो आणि छपरांतून भरल्या जातात, ज्या अख्खे वर्षभर पाऊस सांभाळतात ज्यात कदाचित पुन्हा काहीच पडणार नाही. यांना काय म्हणतात?",
        },
        statement: {
          en: "Tankas are underground tanks built beneath the courtyards of desert houses in Rajasthan, plastered watertight and filled from the rooftops, storing rainwater for drinking through the long dry season.",
          hi: "टाँके राजस्थान के मरुस्थलीय घरों के आँगनों के नीचे बने भूमिगत कुंड हैं, जलरोधी पलस्तर किए और छतों से भरे जाते, जो लंबे शुष्क मौसम भर पीने का वर्षाजल संचित रखते हैं।",
          mr: "टाकी म्हणजे राजस्थानच्या वाळवंटी घरांच्या अंगणांखाली बांधलेली भूमिगत कुंडे, जलरोधक गिलावा केलेली आणि छपरांतून भरलेली, जी दीर्घ कोरड्या हंगामभर पिण्याचे पावसाळी पाणी साठवतात.",
        },
        detail: {
          en: "Being underground and covered, the water stays cool and clean, and some houses keep a room cooled simply by the tanka beneath it.",
          hi: "भूमिगत और ढका होने से पानी ठंडा तथा साफ़ रहता है, और कुछ घरों में नीचे के टाँके भर से एक कमरा ठंडा रहता है।",
          mr: "भूमिगत आणि झाकलेले असल्याने पाणी थंड आणि स्वच्छ राहते, आणि काही घरांत खालच्या टाक्यामुळेच एक खोली थंड राहते.",
        },
        extra: {
          en: "Where canal water arrived, many tankas fell out of use — and households discovered the loss when the canal ran dry or the supply was rationed.",
          hi: "जहाँ नहर का पानी पहुँचा वहाँ कई टाँके इस्तेमाल से बाहर हो गए — और घरों को हानि तब पता चली जब नहर सूखी या आपूर्ति राशन पर आई।",
          mr: "जिथे कालव्याचे पाणी पोहोचले तिथे अनेक टाकी वापराबाहेर गेली — आणि घरांना तोटा तेव्हा कळला जेव्हा कालवा आटला वा पुरवठा रेशनवर आला.",
        },
        pair: {
          left: {
            en: "A watertight room under the courtyard",
            hi: "आँगन के नीचे जलरोधी कोठरी",
            mr: "अंगणाखालची जलरोधक खोली",
          },
          right: {
            en: "the tankas of Rajasthan",
            hi: "राजस्थान के टाँके",
            mr: "राजस्थानची टाकी",
          },
        },
      },
      {
        id: "bamboo-drip-irrigation",
        name: {
          en: "Bamboo drip irrigation",
          hi: "बाँस की टपक सिंचाई",
          mr: "बांबूची ठिबक सिंचाई",
        },
        kind: "structure",
        prompt: {
          en: "In Meghalaya, spring water is carried across hillsides in split bamboo pipes that divide and narrow along the way, so that a few drops reach the base of each betel or pepper plant. What system is this?",
          hi: "मेघालय में झरने का पानी पहाड़ी ढलानों पर चीरे हुए बाँस की नलियों से ले जाया जाता है जो रास्ते में बँटती और सँकरी होती जाती हैं, ताकि हर पान या मिर्च के पौधे की जड़ तक कुछ बूँदें पहुँचें। यह कौन-सी प्रणाली है?",
          mr: "मेघालयात झऱ्याचे पाणी डोंगरउतारांवरून चिरलेल्या बांबूच्या नळ्यांतून नेले जाते ज्या वाटेत विभागत आणि अरुंद होत जातात, जेणेकरून प्रत्येक पान वा मिरीच्या रोपाच्या मुळाशी काही थेंब पोहोचतील. ही कोणती पद्धत?",
        },
        statement: {
          en: "Bamboo drip irrigation carries spring water across Meghalaya's hillsides in split bamboo channels that branch and narrow, delivering a slow drip to the roots of each plant with almost no loss.",
          hi: "बाँस की टपक सिंचाई मेघालय की पहाड़ी ढलानों पर झरने का पानी चीरे हुए बाँस की नालियों से ले जाती है जो बँटती और सँकरी होती जाती हैं, और लगभग बिना हानि हर पौधे की जड़ तक धीमी टपक पहुँचाती हैं।",
          mr: "बांबूची ठिबक सिंचाई मेघालयाच्या डोंगरउतारांवरून झऱ्याचे पाणी चिरलेल्या बांबूच्या नाल्यांतून नेते ज्या विभागत आणि अरुंद होत जातात, आणि जवळजवळ हानीविना प्रत्येक रोपाच्या मुळाशी मंद ठिबक पोहोचवतात.",
        },
        detail: {
          en: "It is two centuries old and uses gravity alone — no pump, no fuel and no part that cannot be cut from a nearby grove.",
          hi: "यह दो सौ वर्ष पुरानी है और केवल गुरुत्व से चलती है — न पंप, न ईंधन, न कोई ऐसा पुर्ज़ा जो पास के झुरमुट से न काटा जा सके।",
          mr: "ती दोनशे वर्षे जुनी आणि केवळ गुरुत्वावर चालते — ना पंप, ना इंधन, ना असा कोणता भाग जो जवळच्या बेटातून कापता येणार नाही.",
        },
        extra: {
          en: "Modern drip irrigation reaches the same conclusion with plastic and valves, which shows the local design had solved the problem long before the technology was patented.",
          hi: "आधुनिक टपक सिंचाई वही निष्कर्ष प्लास्टिक और वाल्वों से पाती है, जो दिखाता है कि स्थानीय रचना ने समस्या तकनीक के पेटेंट होने से बहुत पहले हल कर ली थी।",
          mr: "आधुनिक ठिबक सिंचाई तोच निष्कर्ष प्लास्टिक आणि झडपांनी गाठते, जे दाखवते की स्थानिक रचनेने समस्या तंत्रज्ञानाचे स्वामित्व नोंदवण्याच्या खूप आधी सोडवली होती.",
        },
        pair: {
          left: {
            en: "Split bamboo carrying a drip down a hillside",
            hi: "पहाड़ी ढलान पर टपक ले जाता चीरा बाँस",
            mr: "डोंगरउतारावरून ठिबक नेणारा चिरलेला बांबू",
          },
          right: {
            en: "bamboo drip irrigation",
            hi: "बाँस की टपक सिंचाई",
            mr: "बांबूची ठिबक सिंचाई",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A large dam is built to control floods, and for two decades it does. Thirty years later the same river floods worse than before in heavy years, and the fields downstream are visibly less fertile. Both changes trace to the same physical process. Identify it and explain the mechanism.",
          hi: "बाढ़ रोकने को एक बड़ा बाँध बनता है, और दो दशक वह रोकता भी है। तीस वर्ष बाद वही नदी भारी वर्षों में पहले से बुरी बाढ़ लाती है, और नीचे के खेत स्पष्ट रूप से कम उपजाऊ हैं। दोनों बदलाव उसी एक भौतिक प्रक्रिया तक जाते हैं। उसे पहचानो और क्रियाविधि समझाओ।",
          mr: "पूर रोखायला एक मोठे धरण बांधले जाते, आणि दोन दशके ते रोखतेही. तीस वर्षांनी तीच नदी जास्त पावसाच्या वर्षी आधीहून वाईट पूर आणते, आणि खालची शेते स्पष्टपणे कमी सुपीक. दोन्ही बदल त्याच एका भौतिक प्रक्रियेकडे जातात. ती ओळखा आणि क्रियाविधी समजावा.",
        },
        choices: [
          {
            en: "Sedimentation. A river carries silt that used to be spread over the floodplain each year, renewing its fertility; the dam traps that silt behind the wall instead. So downstream fields stop receiving their annual dressing and grow poorer, while the reservoir's own storage volume steadily fills up with mud — leaving less room to hold a flood peak, so that in a heavy year the dam must release large volumes and the flood arrives worse than it would have",
            hi: "अवसादन। नदी वह गाद ढोती है जो पहले हर वर्ष बाढ़-मैदान पर फैलकर उसकी उर्वरता नई करती थी; बाँध उस गाद को दीवार के पीछे फँसा लेता है। अतः नीचे के खेतों को उनकी वार्षिक परत मिलनी बंद हो जाती और वे निर्धन होते जाते, जबकि जलाशय की अपनी भंडारण-क्षमता लगातार कीचड़ से भरती जाती — बाढ़ का शिखर रोकने को कम जगह छोड़ते हुए, अतः भारी वर्ष में बाँध को बड़ी मात्रा छोड़नी पड़ती और बाढ़ उससे बुरी आती जितनी आती",
            mr: "गाळ साचणे. नदी तो गाळ वाहते जो पूर्वी दरवर्षी पूरमैदानावर पसरून त्याची सुपीकता नवी करत असे; धरण तो गाळ भिंतीमागे अडकवते. म्हणून खालच्या शेतांना त्यांचा वार्षिक थर मिळणे थांबते आणि ती गरीब होत जातात, तर जलाशयाची स्वतःची साठवण क्षमता सतत गाळाने भरत जाते — पुराचे शिखर धरायला कमी जागा ठेवत, म्हणून जास्त पावसाच्या वर्षी धरणाला मोठ्या प्रमाणात पाणी सोडावे लागते आणि पूर तो आला असता त्याहून वाईट येतो",
          },
          {
            en: "The dam physically increases the total rainfall in its catchment, so more water arrives every year",
            hi: "बाँध अपने जल-ग्रहण क्षेत्र में कुल वर्षा भौतिक रूप से बढ़ा देता है, अतः हर वर्ष अधिक पानी आता है",
            mr: "धरण आपल्या पाणलोटातील एकूण पाऊस भौतिकदृष्ट्या वाढवते, म्हणून दरवर्षी अधिक पाणी येते",
          },
          {
            en: "Concrete leaches chemicals that sterilise the soil for hundreds of kilometres downstream",
            hi: "कंक्रीट ऐसे रसायन छोड़ता है जो नीचे सैकड़ों किलोमीटर तक मिट्टी को बंजर कर देते हैं",
            mr: "काँक्रीट अशी रसायने सोडते जी खाली शेकडो किलोमीटर माती नापीक करतात",
          },
          {
            en: "Neither effect is real; dams keep their full storage capacity and downstream fertility indefinitely",
            hi: "दोनों प्रभाव असली नहीं; बाँध अपनी पूरी भंडारण-क्षमता और नीचे की उर्वरता अनिश्चित काल तक बनाए रखते हैं",
            mr: "दोन्ही परिणाम खरे नाहीत; धरणे आपली पूर्ण साठवण क्षमता आणि खालची सुपीकता अनिश्चित काळ टिकवतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Both effects come from a single fact: a river carries not only water but a large load of suspended silt, and a dam stops the silt as effectively as it stops the water. Begin with what the river used to do. Every flood season, water spilling over the banks slowed as it spread across the floodplain, and slow water cannot hold silt in suspension. The load settled out over the fields as a thin layer of fresh mineral-rich material. This is why floodplain agriculture in the Ganga, Kaveri and Nile valleys has been productive for thousands of years without artificial fertiliser: the river was delivering it annually, free. Now insert a dam. The reservoir behind it is a large body of still water, so the incoming river slows and drops nearly its entire silt load there rather than downstream. Two consequences follow, and they unfold on different timescales. The first is felt in the fields. Water released from a dam is comparatively clear, so the annual dressing of silt stops arriving. The soil does not become barren overnight, but its natural replenishment ends, and over decades the fields need increasing quantities of purchased fertiliser to hold their yields — a cost transferred quietly from the river to the farmer. The delta at the river's mouth is starved too, and where silt no longer arrives to rebuild it, the sea begins eating into the coast. The second consequence accumulates behind the wall. Every year's trapped silt reduces the reservoir's volume. A dam designed with a certain flood cushion — a margin of empty space kept to absorb an unusually large inflow — finds that margin shrinking year by year as mud fills the basin. For the first decades this is invisible; the dam performs as designed and the flood-control claim looks vindicated. But once storage has been substantially lost, a heavy monsoon fills the reduced reservoir quickly, and the operators face a choice they cannot avoid: hold the water and risk the dam, or open the gates. They open the gates, and a large volume is released in a short time into a river whose downstream channel has often also silted up and been built along in the years of apparent safety. The resulting flood can be worse than the pre-dam floods, because it arrives as a sudden release rather than a natural rise. There is a bitter symmetry here worth noticing: the same silt that would have fertilised the fields is what destroys the flood-control capacity, so the two failures are not separate misfortunes but one process seen from two ends. This is why silt management — desilting, catchment afforestation to reduce erosion, and realistic accounting of a reservoir's working life — belongs in any honest assessment of a large dam, and why the projects' original benefit-cost calculations, which often assumed permanent storage, overstated what was being bought. (The wrong answers invent rainfall creation, chemical leaching, or deny effects that reservoir surveys and downstream soil records both document.)",
          hi: "दोनों प्रभाव एक ही तथ्य से आते हैं: नदी केवल पानी नहीं बल्कि निलंबित गाद का बड़ा भार ढोती है, और बाँध गाद को उतनी ही कारगरता से रोकता है जितनी पानी को। पहले देखो नदी पहले क्या करती थी। हर बाढ़-ऋतु में किनारों से छलकता पानी बाढ़-मैदान पर फैलते हुए धीमा होता, और धीमा पानी गाद को निलंबित नहीं रख सकता। वह भार खेतों पर ताज़ी खनिज-समृद्ध सामग्री की पतली परत बनकर बैठ जाता। इसीलिए गंगा, कावेरी और नील की घाटियों में बाढ़-मैदान की खेती हज़ारों वर्ष बिना कृत्रिम उर्वरक उत्पादक रही: नदी उसे हर वर्ष, मुफ़्त, पहुँचा रही थी। अब बाँध रखो। उसके पीछे का जलाशय ठहरे पानी का बड़ा पिंड है, अतः आती नदी धीमी होकर अपना लगभग पूरा गाद-भार नीचे नहीं, वहीं गिरा देती है। दो परिणाम निकलते हैं, और वे अलग-अलग काल-मापों पर खुलते हैं। पहला खेतों में महसूस होता है। बाँध से छोड़ा पानी तुलनात्मक रूप से साफ़ होता है, अतः गाद की वार्षिक परत आनी बंद हो जाती है। मिट्टी रातोंरात बंजर नहीं होती, पर उसका प्राकृतिक पुनर्भरण समाप्त हो जाता है, और दशकों में खेतों को अपनी पैदावार बनाए रखने के लिए बढ़ती मात्रा में ख़रीदा उर्वरक चाहिए होता है — एक लागत जो चुपचाप नदी से किसान पर सरक जाती है। नदी के मुहाने का डेल्टा भी भूखा रहता है, और जहाँ उसे फिर से बनाने को गाद नहीं आती वहाँ समुद्र तट को खाने लगता है। दूसरा परिणाम दीवार के पीछे जमा होता है। हर वर्ष फँसी गाद जलाशय का आयतन घटाती है। जिस बाँध में एक निश्चित बाढ़-गद्दी रखी गई — असामान्य रूप से बड़े प्रवाह को सोखने रखी ख़ाली जगह का हाशिया — वह हाशिया वर्ष-दर-वर्ष सिकुड़ता जाता है जैसे-जैसे कीचड़ बेसिन भरता है। पहले दशकों में यह अदृश्य रहता है; बाँध रचना के अनुसार काम करता है और बाढ़-नियंत्रण का दावा सही लगता है। पर एक बार भंडारण काफ़ी खो जाने के बाद, भारी मानसून घटे जलाशय को जल्दी भर देता है, और संचालकों के सामने ऐसा चुनाव आता है जिससे वे बच नहीं सकते: पानी रोको और बाँध जोखिम में डालो, या फाटक खोलो। वे फाटक खोलते हैं, और बड़ी मात्रा थोड़े समय में उस नदी में छूटती है जिसका नीचे का पाट अक्सर स्वयं भी गाद से भर चुका होता है और जिसके किनारे स्पष्ट सुरक्षा के वर्षों में बस्तियाँ बन चुकी होती हैं। परिणामी बाढ़ बाँध-पूर्व बाढ़ों से बुरी हो सकती है, क्योंकि वह प्राकृतिक चढ़ाव के बजाय अचानक छोड़ाव बनकर आती है। यहाँ एक कड़वी समरूपता ध्यान देने योग्य है: वही गाद जो खेतों को उपजाऊ करती वही बाढ़-नियंत्रण क्षमता नष्ट करती है, अतः दोनों विफलताएँ अलग दुर्भाग्य नहीं बल्कि एक ही प्रक्रिया दो सिरों से देखी गई हैं। इसीलिए गाद-प्रबंधन — गाद निकालना, अपरदन घटाने को जल-ग्रहण क्षेत्र में वनरोपण, और जलाशय के कार्यकाल का यथार्थ लेखा — किसी भी ईमानदार बड़े-बाँध आकलन में आना चाहिए, और इसीलिए परियोजनाओं की मूल लाभ-लागत गणनाएँ, जो अक्सर स्थायी भंडारण मान लेती थीं, यह बढ़ा-चढ़ाकर बतातीं कि ख़रीदा क्या जा रहा है। (ग़लत उत्तर वर्षा-निर्माण, रासायनिक रिसाव गढ़ते, या उन प्रभावों को नकारते जिन्हें जलाशय-सर्वेक्षण और नीचे की मृदा-अभिलेख दोनों दर्ज करते हैं।)",
          mr: "दोन्ही परिणाम एकाच तथ्यातून येतात: नदी केवळ पाणी नव्हे तर निलंबित गाळाचा मोठा भार वाहते, आणि धरण गाळ पाण्याइतक्याच परिणामकारकतेने अडवते. आधी नदी पूर्वी काय करत होती ते पाहा. प्रत्येक पूरहंगामात काठांवरून ओसंडणारे पाणी पूरमैदानावर पसरताना मंदावे, आणि मंद पाणी गाळ निलंबित ठेवू शकत नाही. तो भार शेतांवर ताज्या खनिज-समृद्ध पदार्थाचा पातळ थर बनून बसे. म्हणूनच गंगा, कावेरी आणि नाईलच्या खोऱ्यांतील पूरमैदानी शेती हजारो वर्षे कृत्रिम खताविना उत्पादक राहिली: नदी ते दरवर्षी, फुकट, पोहोचवत होती. आता धरण ठेवा. त्याच्यामागील जलाशय स्थिर पाण्याचा मोठा साठा आहे, म्हणून येणारी नदी मंदावून आपला जवळजवळ अख्खा गाळ-भार खाली नव्हे तर तिथेच टाकते. दोन परिणाम निघतात, आणि ते वेगवेगळ्या कालमापांवर उलगडतात. पहिला शेतांत जाणवतो. धरणातून सोडलेले पाणी तुलनेने स्वच्छ असते, म्हणून गाळाचा वार्षिक थर येणे थांबते. माती रातोरात नापीक होत नाही, पण तिचे नैसर्गिक पुनर्भरण संपते, आणि दशकांत शेतांना आपले उत्पादन टिकवायला वाढत्या प्रमाणात विकत खत लागते — एक खर्च जो गुपचूप नदीकडून शेतकऱ्यावर सरकतो. नदीच्या मुखाचा त्रिभुज प्रदेशही उपाशी राहतो, आणि जिथे त्याला पुन्हा घडवायला गाळ येत नाही तिथे समुद्र किनारा खाऊ लागतो. दुसरा परिणाम भिंतीमागे साचतो. प्रत्येक वर्षी अडकलेला गाळ जलाशयाचे घनफळ घटवतो. ज्या धरणात ठराविक पूर-उशी ठेवली — असामान्य मोठा प्रवाह शोषायला ठेवलेल्या रिकाम्या जागेचा हाशिया — तो हाशिया वर्षागणिक आकुंचत जातो जसजसा गाळ खोरे भरतो. पहिल्या दशकांत हे अदृश्य राहते; धरण रचनेप्रमाणे काम करते आणि पूरनियंत्रणाचा दावा खरा वाटतो. पण एकदा साठवण बरीच हरवल्यावर, जोरदार मान्सून घटलेला जलाशय लवकर भरतो, आणि संचालकांसमोर असा पर्याय येतो ज्यातून ते सुटू शकत नाहीत: पाणी अडवा आणि धरण धोक्यात घाला, वा दरवाजे उघडा. ते दरवाजे उघडतात, आणि मोठे प्रमाण थोड्या वेळात त्या नदीत सोडले जाते जिचे खालचे पात्र अनेकदा स्वतःही गाळाने भरलेले असते आणि जिच्या काठी स्पष्ट सुरक्षिततेच्या वर्षांत वस्त्या झालेल्या असतात. परिणामी पूर धरणपूर्व पुरांहून वाईट असू शकतो, कारण तो नैसर्गिक चढाऐवजी अचानक सोडाव बनून येतो. इथे एक कडवट सममिती लक्षात घेण्याजोगी: जो गाळ शेते सुपीक करेल तोच पूरनियंत्रण क्षमता नष्ट करतो, म्हणून दोन्ही अपयशे वेगळी दुर्दैवे नव्हेत तर एकच प्रक्रिया दोन टोकांतून पाहिलेली. म्हणूनच गाळ-व्यवस्थापन — गाळ काढणे, झीज घटवायला पाणलोटात वनलागवड, आणि जलाशयाच्या कार्यकाळाचा वास्तववादी हिशोब — कोणत्याही प्रामाणिक मोठ्या-धरण मूल्यमापनात यावे, आणि म्हणूनच प्रकल्पांची मूळ लाभ-खर्च गणिते, जी अनेकदा कायमची साठवण गृहीत धरत, काय विकत घेतले जात आहे ते वाढवून सांगत होती. (चुकीची उत्तरे पाऊस-निर्मिती, रासायनिक झिरपणे रचतात, वा जलाशय-सर्वेक्षणे आणि खालच्या मृदा-नोंदी दोन्ही दस्तऐवजीकृत करत असलेले परिणाम नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "India receives abundant rainfall by world standards, and its per-person availability is well above the level economists call absolute scarcity. Yet tankers serve whole neighbourhoods, wells are deepened every few years, and villages walk further for water each decade. Explain how a country can be short of water without being short of rain.",
          hi: "विश्व मानकों से भारत को भरपूर वर्षा मिलती है, और उसकी प्रति-व्यक्ति उपलब्धता उस स्तर से काफ़ी ऊपर है जिसे अर्थशास्त्री परम अभाव कहते हैं। फिर भी टैंकर पूरे-पूरे मोहल्लों को पानी देते हैं, कुएँ हर कुछ वर्षों में गहरे किए जाते हैं, और गाँव हर दशक पानी के लिए और दूर चलते हैं। समझाओ कोई देश वर्षा की कमी के बिना पानी की कमी में कैसे हो सकता है।",
          mr: "जागतिक मानकांनुसार भारताला भरपूर पाऊस मिळतो, आणि त्याची दरडोई उपलब्धता अर्थतज्ज्ञ ज्याला निरपेक्ष टंचाई म्हणतात त्या पातळीहून बरीच वर आहे. तरीही टँकर अख्ख्या वस्त्यांना पाणी देतात, विहिरी दर काही वर्षांनी खोल केल्या जातात, आणि गावे दर दशकात पाण्यासाठी अधिक दूर चालतात. समजावा एखादा देश पावसाची कमतरता नसताना पाण्याच्या कमतरतेत कसा असू शकतो.",
        },
        choices: [
          {
            en: "Because availability is not the same as access. The rain arrives in about a hundred days and must serve the whole year; groundwater is pumped faster than it recharges because the electricity is cheap and nobody owns the aquifer jointly; rivers are polluted until the water is present but unusable; and supply is distributed by pipe, borewell and tanker in ways that follow wealth. Scarcity is therefore produced by timing, over-extraction, contamination and unequal distribution rather than by a shortage of rainfall",
            hi: "क्योंकि उपलब्धता और पहुँच एक बात नहीं। वर्षा लगभग सौ दिनों में आती है और उसे पूरा वर्ष चलना है; भूजल पुनर्भरण से तेज़ खींचा जाता है क्योंकि बिजली सस्ती है और जलभृत का साझा स्वामी कोई नहीं; नदियाँ तब तक प्रदूषित होती हैं कि पानी मौजूद पर अनुपयोगी हो जाता है; और आपूर्ति पाइप, बोरवेल तथा टैंकर से इस ढंग बँटती है जो संपत्ति का पीछा करता है। अतः कमी वर्षा के अभाव से नहीं बल्कि समय, अति-दोहन, संदूषण और असमान वितरण से पैदा होती है",
            mr: "कारण उपलब्धता आणि प्रवेश एक नव्हे. पाऊस सुमारे शंभर दिवसांत येतो आणि त्याला अख्खे वर्ष पुरायचे असते; भूजल पुनर्भरणाहून वेगाने उपसले जाते कारण वीज स्वस्त आहे आणि जलधराचा सामायिक मालक कोणी नाही; नद्या तोवर प्रदूषित होतात की पाणी उपस्थित पण अवापरता होते; आणि पुरवठा नळ, बोअरवेल व टँकरने अशा प्रकारे वाटला जातो जो संपत्तीच्या मागे जातो. म्हणून टंचाई पावसाच्या कमतरतेने नव्हे तर वेळ, अति-उपसा, दूषण आणि असमान वाटपाने निर्माण होते",
          },
          {
            en: "Because India's rainfall figures are miscalculated, and the country actually receives very little rain",
            hi: "क्योंकि भारत के वर्षा-आँकड़े ग़लत गिने गए हैं, और देश को वस्तुतः बहुत कम वर्षा मिलती है",
            mr: "कारण भारताचे पर्जन्य-आकडे चुकीचे मोजले गेले आहेत, आणि देशाला प्रत्यक्षात फार कमी पाऊस मिळतो",
          },
          {
            en: "Because water is consumed permanently and destroyed when used, so the total on earth keeps falling",
            hi: "क्योंकि पानी इस्तेमाल होने पर स्थायी रूप से खपकर नष्ट हो जाता है, अतः पृथ्वी पर उसका कुल घटता जाता है",
            mr: "कारण पाणी वापरल्यावर कायमचे खर्ची पडून नष्ट होते, म्हणून पृथ्वीवरील एकूण घटत जाते",
          },
          {
            en: "Because scarcity is imaginary; where rainfall is adequate no real shortage can occur",
            hi: "क्योंकि कमी काल्पनिक है; जहाँ वर्षा पर्याप्त हो वहाँ कोई असली कमी हो ही नहीं सकती",
            mr: "कारण टंचाई काल्पनिक आहे; जिथे पाऊस पुरेसा असतो तिथे खरी कमतरता होऊच शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The apparent paradox dissolves once you stop asking how much water falls and start asking when it falls, who can reach it, and in what condition it arrives. Four mechanisms do the work, and they compound. First, timing. Most of India's rain arrives in roughly a hundred days of the monsoon and then stops. A national average that divides annual rainfall by the population describes a quantity that mostly runs to the sea within weeks. Whether it is available in March depends entirely on whether it was stored — in soil, in groundwater, in a tank, a reservoir or a tanka. A country can therefore be simultaneously flooded and water-short in the same district in the same year, which is exactly what Cherrapunji's dry-season shortage illustrates. Second, over-extraction. Groundwater is the largest source for both irrigation and drinking, and it behaves like a bank account: withdrawals above the recharge rate draw down the balance. Cheap or free electricity for pumps removes the cost signal, and because the aquifer under a village is shared by everyone but owned by no one, each farmer's rational choice — deepen the borewell before the neighbour does — collectively empties it. That is why wells must be deepened every few years, and why the water table falls even in areas of good rainfall. Third, contamination. Water that is physically present can be unusable. Untreated sewage, industrial effluent and fertiliser runoff have made stretches of major rivers unfit for drinking or bathing, and in some regions fluoride, arsenic or salinity make groundwater dangerous. This removes supply just as effectively as drought does, and it removes it permanently unless treatment is built. Fourth, and often decisive, distribution. Water reaches people through infrastructure — pipes, tankers, borewells — and infrastructure follows money and political weight. Two households on the same street can face entirely different situations depending on which is connected. A colony with private borewells has water when the municipal line fails; a settlement without them buys from tankers at many times the metered rate. Farmers with electric pumps irrigate through the dry season while those without watch their wells fall out of reach. The industrial user with a licensed extraction continues while the village walks further. Put together, these mean scarcity in India is largely produced rather than inherited. That conclusion is practical, not merely rhetorical, because it identifies where the remedies lie: storing the monsoon rather than only channelling it (rooftop harvesting, tankas, tanks, recharge pits), pricing and regulating extraction so the aquifer is managed as a common asset, treating effluent so present water stays usable, and distributing supply by rules rather than by purchasing power. It also explains why traditional systems — bamboo drip irrigation, the tanka, village tanks — remain relevant beside large dams: they address timing and local access directly, without displacing anyone, and they leave control with the household or village that built them. The single sentence worth keeping is that water is not scarce because there is too little of it, but because too little of it is stored, kept clean and shared fairly. (The wrong answers dispute well-measured rainfall data, imagine that water is destroyed by use when in fact it is degraded and displaced, or deny a scarcity that queues, tankers and falling water tables make plainly visible.)",
          hi: "प्रत्यक्ष विरोधाभास तभी घुल जाता है जब तुम यह पूछना छोड़ दो कि कितना पानी गिरता है और पूछने लगो कि कब गिरता है, उस तक पहुँच किसकी है, और वह किस हालत में आता है। चार क्रियाविधियाँ काम करती हैं, और वे एक-दूसरे को बढ़ाती हैं। पहली, समय। भारत की अधिकांश वर्षा मानसून के लगभग सौ दिनों में आती और फिर रुक जाती है। जो राष्ट्रीय औसत वार्षिक वर्षा को जनसंख्या से भाग देता है वह ऐसी मात्रा बताता है जो अधिकतर हफ़्तों में समुद्र तक बह जाती है। वह मार्च में उपलब्ध है या नहीं यह पूरी तरह इस पर कि उसे संचित किया गया था या नहीं — मिट्टी में, भूजल में, तालाब, जलाशय या टाँके में। अतः कोई देश उसी ज़िले में उसी वर्ष एक साथ बाढ़ में और पानी की कमी में हो सकता है — ठीक वही जो चेरापूँजी की शुष्क-ऋतु कमी दिखाती है। दूसरी, अति-दोहन। भूजल सिंचाई और पेयजल दोनों का सबसे बड़ा स्रोत है, और वह बैंक-खाते जैसा बरतता है: पुनर्भरण दर से ऊपर निकासी शेष घटा देती है। पंपों के लिए सस्ती या मुफ़्त बिजली लागत का संकेत मिटा देती है, और क्योंकि गाँव के नीचे का जलभृत सबका साझा है पर किसी का अपना नहीं, हर किसान का तर्कसंगत चुनाव — पड़ोसी से पहले बोरवेल गहरा करो — सामूहिक रूप से उसे ख़ाली कर देता है। इसीलिए कुएँ हर कुछ वर्षों में गहरे करने पड़ते, और इसीलिए अच्छी वर्षा वाले क्षेत्रों में भी जल-स्तर गिरता है। तीसरी, संदूषण। जो पानी भौतिक रूप से मौजूद है वह अनुपयोगी हो सकता है। बिना शोधित मल, औद्योगिक बहिःस्राव और उर्वरक-अपवाह ने बड़ी नदियों के हिस्सों को पीने या नहाने के अयोग्य बना दिया है, और कुछ क्षेत्रों में फ़्लोराइड, आर्सेनिक या लवणता भूजल को ख़तरनाक बनाती है। यह आपूर्ति उतनी ही कारगरता से हटाता है जितनी सूखा, और शोधन बने बिना स्थायी रूप से हटाता है। चौथी, और अक्सर निर्णायक, वितरण। पानी लोगों तक ढाँचे से पहुँचता है — पाइप, टैंकर, बोरवेल — और ढाँचा पैसे तथा राजनीतिक वज़न का पीछा करता है। एक ही गली के दो घर पूरी तरह भिन्न स्थितियों में हो सकते हैं, यह इस पर कि जुड़ा कौन है। निजी बोरवेल वाली कॉलोनी के पास नगरपालिका लाइन बिगड़ने पर भी पानी होता है; उनसे रहित बस्ती टैंकरों से मीटर की दर के कई गुने पर ख़रीदती है। बिजली के पंप वाले किसान शुष्क ऋतु भर सींचते हैं जबकि बिना पंप वाले अपने कुएँ पहुँच से बाहर होते देखते हैं। अनुज्ञप्त निकासी वाला औद्योगिक उपयोगकर्ता चलता रहता है जबकि गाँव और दूर चलता है। मिलाकर इनका अर्थ यह कि भारत में कमी बड़े हिस्से में विरासत में नहीं, पैदा की हुई है। यह निष्कर्ष केवल अलंकार नहीं, व्यावहारिक है, क्योंकि यह बताता है कि उपाय कहाँ हैं: मानसून को केवल बहाने के बजाय संचित करना (छत-संचयन, टाँके, तालाब, पुनर्भरण गड्ढे), निकासी की क़ीमत और नियमन ताकि जलभृत साझा परिसंपत्ति की तरह सँभाला जाए, बहिःस्राव का शोधन ताकि मौजूद पानी उपयोगी रहे, और आपूर्ति का वितरण क्रय-शक्ति से नहीं नियमों से। यह यह भी समझाता है कि परंपरागत प्रणालियाँ — बाँस की टपक सिंचाई, टाँका, गाँव के तालाब — बड़े बाँधों के साथ-साथ प्रासंगिक क्यों बनी हुई हैं: वे समय और स्थानीय पहुँच को सीधे सँभालती हैं, किसी को विस्थापित किए बिना, और नियंत्रण उसी घर या गाँव के पास छोड़ती हैं जिसने उन्हें बनाया। रखने योग्य एक वाक्य यह है कि पानी इसलिए दुर्लभ नहीं कि वह बहुत कम है, बल्कि इसलिए कि उसका बहुत कम हिस्सा संचित, साफ़ और न्यायपूर्वक बाँटा जाता है। (ग़लत उत्तर भली-भाँति मापे वर्षा-आँकड़ों पर विवाद करते, यह कल्पना करते कि पानी उपयोग से नष्ट हो जाता जबकि वस्तुतः वह क्षरित और विस्थापित होता है, या उस कमी को नकारते जिसे क़तारें, टैंकर और गिरते जल-स्तर स्पष्ट दिखाते हैं।)",
          mr: "दिसणारा विरोधाभास तेव्हाच सुटतो जेव्हा तुम्ही किती पाणी पडते हे विचारणे सोडून ते कधी पडते, त्यापर्यंत कोण पोहोचू शकते, आणि ते कोणत्या स्थितीत येते हे विचारू लागता. चार क्रियाविधी काम करतात, आणि त्या एकमेकांना वाढवतात. पहिली, वेळ. भारतातील बहुतांश पाऊस मान्सूनच्या सुमारे शंभर दिवसांत येतो आणि मग थांबतो. जो राष्ट्रीय सरासरी वार्षिक पाऊस लोकसंख्येने भागतो तो असे प्रमाण सांगतो जे बहुतांश आठवड्यांत समुद्रापर्यंत वाहून जाते. ते मार्चमध्ये उपलब्ध आहे की नाही हे पूर्णपणे यावर की ते साठवले होते का — मातीत, भूजलात, तळ्यात, जलाशयात वा टाक्यात. म्हणून एखादा देश त्याच जिल्ह्यात त्याच वर्षी एकाच वेळी पुरात आणि पाण्याच्या टंचाईत असू शकतो — नेमके तेच चेरापुंजीची कोरड्या हंगामातील टंचाई दाखवते. दुसरी, अति-उपसा. भूजल सिंचन आणि पिण्याचे पाणी दोन्हींचा सर्वांत मोठा स्रोत, आणि ते बँकखात्यासारखे वागते: पुनर्भरण दराहून अधिक उपसा शिल्लक घटवतो. पंपांसाठी स्वस्त वा फुकट वीज खर्चाचा संकेत मिटवते, आणि गावाखालचा जलधर सर्वांचा सामायिक पण कोणाचाही स्वतःचा नसल्याने, प्रत्येक शेतकऱ्याची तर्कशुद्ध निवड — शेजाऱ्याआधी बोअरवेल खोल करा — सामूहिकरीत्या तो रिकामा करते. म्हणूनच विहिरी दर काही वर्षांनी खोल कराव्या लागतात, आणि म्हणूनच चांगल्या पावसाच्या भागांतही पाण्याची पातळी घसरते. तिसरी, दूषण. जे पाणी भौतिकदृष्ट्या उपस्थित आहे ते अवापरता असू शकते. प्रक्रिया न केलेले सांडपाणी, औद्योगिक स्राव आणि खत-वाहून जाणे यांनी मोठ्या नद्यांचे पट्टे पिण्यास वा आंघोळीस अयोग्य केले आहेत, आणि काही भागांत फ्लोराइड, आर्सेनिक वा क्षारता भूजल धोकादायक करते. हे पुरवठा दुष्काळाइतक्याच परिणामकारकतेने काढून टाकते, आणि प्रक्रिया उभारल्याविना कायमचे काढून टाकते. चौथी, आणि अनेकदा निर्णायक, वाटप. पाणी लोकांपर्यंत पायाभूत सुविधांतून पोहोचते — नळ, टँकर, बोअरवेल — आणि पायाभूत सुविधा पैसा व राजकीय वजनाच्या मागे जातात. एकाच गल्लीतील दोन घरे पूर्णपणे वेगळ्या स्थितीत असू शकतात, जोडलेले कोण आहे यावरून. खासगी बोअरवेल असलेल्या वसाहतीकडे नगरपालिका वाहिनी बिघडली तरी पाणी असते; त्याविनाची वस्ती टँकरांकडून मीटर दराच्या कैकपट किमतीला विकत घेते. विजेचे पंप असलेले शेतकरी कोरड्या हंगामभर सिंचन करतात तर पंपाविनाचे आपल्या विहिरी आवाक्याबाहेर जाताना पाहतात. परवानाधारी उपसा असलेला औद्योगिक वापरकर्ता चालूच राहतो तर गाव अधिक दूर चालते. एकत्रितपणे यांचा अर्थ हा की भारतातील टंचाई मोठ्या प्रमाणात वारशाने नव्हे तर निर्माण केलेली आहे. हा निष्कर्ष केवळ अलंकार नव्हे तर व्यावहारिक, कारण तो उपाय कुठे आहेत ते सांगतो: मान्सून केवळ वाहवण्याऐवजी साठवणे (छप्पर-संचय, टाकी, तळी, पुनर्भरण खड्डे), उपशाची किंमत व नियमन जेणेकरून जलधर सामायिक मालमत्ता म्हणून सांभाळला जाईल, स्रावावर प्रक्रिया जेणेकरून उपस्थित पाणी वापरण्याजोगे राहील, आणि पुरवठ्याचे वाटप क्रयशक्तीने नव्हे तर नियमांनी. हे हेही समजावते की पारंपरिक पद्धती — बांबूची ठिबक सिंचाई, टाकं, गावतळी — मोठ्या धरणांबरोबरच का प्रासंगिक राहिल्या: त्या वेळ आणि स्थानिक प्रवेश थेट हाताळतात, कोणालाही विस्थापित न करता, आणि नियंत्रण त्याच घराकडे वा गावाकडे ठेवतात ज्याने त्या बांधल्या. जपण्याजोगे एक वाक्य हे की पाणी यासाठी दुर्मीळ नाही की ते फार कमी आहे, तर यासाठी की त्याचा फार कमी भाग साठवला, स्वच्छ ठेवला आणि न्याय्यपणे वाटला जातो. (चुकीची उत्तरे नीट मोजलेल्या पर्जन्य-आकडेवारीवर वाद घालतात, पाणी वापराने नष्ट होते अशी कल्पना करतात तर प्रत्यक्षात ते खालावते व स्थलांतरित होते, वा रांगा, टँकर आणि घसरती पाणीपातळी स्पष्ट दाखवत असलेली टंचाई नाकारतात.)",
        },
      },
    ],
  },
];
