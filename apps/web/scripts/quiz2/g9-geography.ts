/**
 * Class 9 Geography — NCERT "Contemporary India – I", chapter by chapter,
 * through the conceptual engine. The land itself is read: where India sits on
 * the globe, how its mountains, plains and plateau were built, the rivers that
 * drain them, the monsoon that waters them, and the people spread across it.
 * Same distractor rule as everywhere — every statement must be false of every
 * other entity in its chapter.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE =
  "EduLink original, written against NCERT Contemporary India – I (Class 9)";
const LICENCE = "CC-BY-SA-4.0";

export const G9_GEOGRAPHY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — India: Size and Location                                   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-9-size-and-location",
    subject: "GEOGRAPHY",
    classLevel: 9,
    chapter: {
      en: "Chapter 1 — India: Size and Location",
      hi: "अध्याय 1 — भारत: आकार और स्थिति",
      mr: "प्रकरण 1 — भारत: आकार आणि स्थान",
    },
    name: {
      en: "India: Size and Location",
      hi: "भारत: आकार और स्थिति",
      mr: "भारत: आकार आणि स्थान",
    },
    summary: {
      en: "Where India sits and how large it looms: a country of the Northern and Eastern hemispheres cut by the Tropic of Cancer, its clocks set to one meridian though the sun rises two hours apart across it, the seventh largest land ringed by neighbours and commanding the Indian Ocean's routes.",
      hi: "भारत कहाँ बसा और कितना बड़ा दिखता: उत्तरी और पूर्वी गोलार्ध का देश कर्क रेखा से कटा, इसकी घड़ियाँ एक याम्योत्तर पर सधीं यद्यपि इसके आर-पार सूरज दो घंटे के अंतर से उगता, सातवाँ सबसे बड़ा भूभाग पड़ोसियों से घिरा और हिंद महासागर के मार्ग साधता।",
      mr: "भारत कुठे वसला आणि किती मोठा भासतो: उत्तर आणि पूर्व गोलार्धाचा देश कर्कवृत्ताने कापलेला, त्याची घड्याळे एका रेखावृत्तावर जुळलेली जरी त्याच्या आरपार सूर्य दोन तासांच्या फरकाने उगवतो, सातवा सर्वांत मोठा भूभाग शेजाऱ्यांनी वेढलेला आणि हिंदी महासागराचे मार्ग साधणारा.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "hemispheres-tropic",
        name: {
          en: "India's position on the globe",
          hi: "ग्लोब पर भारत की स्थिति",
          mr: "ग्लोबवर भारताचे स्थान",
        },
        kind: "location",
        prompt: {
          en: "India lies entirely north of the equator and east of the prime meridian, with a great line of latitude passing almost through its middle. In which hemispheres does it sit, and which line halves it?",
          hi: "भारत पूरा भूमध्य रेखा के उत्तर और प्रधान याम्योत्तर के पूर्व है, एक बड़ी अक्षांश रेखा लगभग इसके बीच से गुज़रती। यह किन गोलार्धों में बसा, और कौन-सी रेखा इसे आधा करती?",
          mr: "भारत पूर्णपणे विषुववृत्ताच्या उत्तरेला आणि मूळ रेखावृत्ताच्या पूर्वेला आहे, एक मोठी अक्षवृत्त रेषा जवळपास त्याच्या मधून जाते. तो कोणत्या गोलार्धांत वसला, आणि कोणती रेषा त्याला अर्धे करते?",
        },
        statement: {
          en: "India lies in the Northern and Eastern hemispheres, and the Tropic of Cancer (about 23½°N) passes through the middle of the country, dividing it into roughly equal northern and southern halves.",
          hi: "भारत उत्तरी और पूर्वी गोलार्ध में है, और कर्क रेखा (लगभग 23½°उ) देश के बीच से गुज़रती, इसे लगभग बराबर उत्तरी-दक्षिणी भागों में बाँटती।",
          mr: "भारत उत्तर आणि पूर्व गोलार्धांत आहे, आणि कर्कवृत्त (सुमारे 23½°उ) देशाच्या मधून जाते, त्याला जवळपास समान उत्तर-दक्षिण भागांत विभागते.",
        },
        detail: {
          en: "The Tropic of Cancer crosses eight Indian states, so the land north of it lies in the temperate zone and the land south of it in the tropics.",
          hi: "कर्क रेखा भारत के आठ राज्यों से गुज़रती, अतः उसके उत्तर की भूमि शीतोष्ण कटिबंध में और दक्षिण की उष्ण कटिबंध में।",
          mr: "कर्कवृत्त भारताच्या आठ राज्यांतून जाते, म्हणून त्याच्या उत्तरेकडची जमीन समशीतोष्ण कटिबंधात आणि दक्षिणेकडची उष्ण कटिबंधात.",
        },
        extra: {
          en: "Being north of the equator, all of India has its longest day in June and its shortest in December, the northern-hemisphere pattern.",
          hi: "भूमध्य रेखा के उत्तर होने से, पूरे भारत का सबसे लंबा दिन जून में और सबसे छोटा दिसंबर में, उत्तरी-गोलार्ध का नमूना।",
          mr: "विषुववृत्ताच्या उत्तरेला असल्याने, अख्ख्या भारताचा सर्वांत मोठा दिवस जूनमध्ये आणि सर्वांत लहान डिसेंबरमध्ये, उत्तर-गोलार्धाचा नमुना.",
        },
        pair: {
          left: {
            en: "Northern and Eastern, halved by the Tropic of Cancer",
            hi: "उत्तरी-पूर्वी, कर्क रेखा से आधा",
            mr: "उत्तर-पूर्व, कर्कवृत्ताने अर्धे",
          },
          right: {
            en: "India's position on the globe",
            hi: "ग्लोब पर भारत की स्थिति",
            mr: "ग्लोबवर भारताचे स्थान",
          },
        },
      },
      {
        id: "extent",
        name: {
          en: "India's extent",
          hi: "भारत का विस्तार",
          mr: "भारताचा विस्तार",
        },
        kind: "measure",
        prompt: {
          en: "From the far south to the Himalayan north, and from the western to the eastern edge, India stretches roughly the same distance each way — about three thousand kilometres. What describes this reach across latitude and longitude?",
          hi: "सुदूर दक्षिण से हिमालयी उत्तर तक, और पश्चिमी से पूर्वी छोर तक, भारत हर ओर लगभग समान दूरी फैला — लगभग तीन हज़ार किलोमीटर। अक्षांश-देशांतर में इस पहुँच को क्या बताता?",
          mr: "सुदूर दक्षिणेपासून हिमालयी उत्तरेपर्यंत, आणि पश्चिम ते पूर्व टोकापर्यंत, भारत प्रत्येक बाजूला जवळपास समान अंतर पसरला — सुमारे तीन हजार किलोमीटर. अक्षांश-रेखांशातील या पल्ल्याला काय सांगते?",
        },
        statement: {
          en: "India's mainland extends from about 8°N to 37°N in latitude and from about 68°E to 97°E in longitude, running roughly 3,200 km north–south and 2,900 km east–west.",
          hi: "भारत की मुख्य भूमि अक्षांश में लगभग 8°उ से 37°उ और देशांतर में लगभग 68°पू से 97°पू तक फैली, लगभग 3,200 किमी उत्तर-दक्षिण और 2,900 किमी पूर्व-पश्चिम।",
          mr: "भारताची मुख्य भूमी अक्षांशात सुमारे 8°उ ते 37°उ आणि रेखांशात सुमारे 68°पू ते 97°पू पर्यंत पसरली, सुमारे 3,200 किमी उत्तर-दक्षिण आणि 2,900 किमी पूर्व-पश्चिम.",
        },
        detail: {
          en: "The north–south and east–west distances look almost equal in kilometres, yet the longitudinal spread covers far fewer degrees, because lines of longitude crowd together away from the equator.",
          hi: "उत्तर-दक्षिण और पूर्व-पश्चिम दूरियाँ किलोमीटर में लगभग बराबर दिखतीं, फिर भी देशांतरीय फैलाव कहीं कम अंश ढकता, क्योंकि देशांतर रेखाएँ भूमध्य रेखा से दूर पास आ जातीं।",
          mr: "उत्तर-दक्षिण आणि पूर्व-पश्चिम अंतरे किलोमीटरमध्ये जवळपास समान दिसतात, तरी रेखांशीय पसारा कितीतरी कमी अंश व्यापतो, कारण रेखांश रेषा विषुववृत्तापासून दूर जवळ येतात.",
        },
        extra: {
          en: "The southernmost point of Indian territory, Indira Point in the Andaman & Nicobar Islands, lies even nearer the equator than the mainland's tip at Kanniyakumari.",
          hi: "भारतीय क्षेत्र का सुदूर दक्षिण बिंदु, अंडमान-निकोबार में इंदिरा प्वाइंट, मुख्य भूमि के कन्याकुमारी छोर से भी भूमध्य रेखा के निकट।",
          mr: "भारतीय प्रदेशाचे सुदूर दक्षिण टोक, अंदमान-निकोबारमधील इंदिरा पॉइंट, मुख्य भूमीच्या कन्याकुमारी टोकाहूनही विषुववृत्ताजवळ.",
        },
        pair: {
          left: {
            en: "About 8°–37°N and 68°–97°E",
            hi: "लगभग 8°–37°उ और 68°–97°पू",
            mr: "सुमारे 8°–37°उ आणि 68°–97°पू",
          },
          right: {
            en: "India's extent",
            hi: "भारत का विस्तार",
            mr: "भारताचा विस्तार",
          },
        },
      },
      {
        id: "standard-meridian",
        name: {
          en: "The standard meridian",
          hi: "मानक याम्योत्तर",
          mr: "प्रमाण रेखावृत्त",
        },
        kind: "measure",
        prompt: {
          en: "Because the sun rises about two hours earlier in the far east of India than the far west, the whole country sets its clocks to one agreed line of longitude. Which meridian gives India its single standard time?",
          hi: "क्योंकि भारत के सुदूर पूर्व में सूरज सुदूर पश्चिम से लगभग दो घंटे पहले उगता, पूरा देश अपनी घड़ियाँ एक सहमत देशांतर रेखा पर सधता। कौन-सा याम्योत्तर भारत को उसका एकल मानक समय देता?",
          mr: "कारण भारताच्या सुदूर पूर्वेला सूर्य सुदूर पश्चिमेहून सुमारे दोन तास आधी उगवतो, अख्खा देश आपली घड्याळे एका ठरलेल्या रेखांश रेषेवर जुळवतो. कोणते रेखावृत्त भारताला त्याचा एकल प्रमाण वेळ देते?",
        },
        statement: {
          en: "India's standard meridian is 82°30'E, passing near Mirzapur, and the local time along it is taken as Indian Standard Time for the whole country.",
          hi: "भारत का मानक याम्योत्तर 82°30'पू है, मिर्ज़ापुर के पास से गुज़रता, और उसके अनुदिश स्थानीय समय पूरे देश के लिए भारतीय मानक समय माना जाता।",
          mr: "भारताचे प्रमाण रेखावृत्त 82°30'पू आहे, मिर्झापूरजवळून जाणारे, आणि त्याच्या बाजूचा स्थानिक वेळ अख्ख्या देशासाठी भारतीय प्रमाण वेळ मानला जातो.",
        },
        detail: {
          en: "It was chosen as a central compromise: with the country spanning about 30° of longitude, one clock keeps trains, offices and broadcasts across India in step.",
          hi: "यह केंद्रीय समझौते के रूप में चुना गया: देश लगभग 30° देशांतर फैला होने से, एक घड़ी भारत भर की रेलों, दफ़्तरों और प्रसारणों को एक ताल में रखती।",
          mr: "हे मध्यवर्ती तडजोड म्हणून निवडले: देश सुमारे 30° रेखांश पसरला असल्याने, एक घड्याळ भारतभरच्या रेल्वे, कार्यालये आणि प्रक्षेपणांना एका तालात ठेवते.",
        },
        extra: {
          en: "Each 15° of longitude is worth one hour of the sun's journey, so India's 30°-wide span means a full two-hour gap between its eastern and western edges.",
          hi: "हर 15° देशांतर सूरज की यात्रा के एक घंटे के बराबर, अतः भारत का 30°-चौड़ा फैलाव इसके पूर्वी-पश्चिमी छोरों में पूरे दो घंटे का अंतर बनाता।",
          mr: "प्रत्येक 15° रेखांश सूर्याच्या प्रवासाच्या एका तासाइतके, म्हणून भारताचा 30°-रुंद पसारा त्याच्या पूर्व-पश्चिम टोकांत पूर्ण दोन तासांचा फरक बनवतो.",
        },
        pair: {
          left: {
            en: "82°30'E near Mirzapur sets one clock for all",
            hi: "82°30'पू मिर्ज़ापुर के पास सबकी एक घड़ी सधाता",
            mr: "82°30'पू मिर्झापूरजवळ सर्वांची एक घड्याळ जुळवते",
          },
          right: {
            en: "the standard meridian",
            hi: "मानक याम्योत्तर",
            mr: "प्रमाण रेखावृत्त",
          },
        },
      },
      {
        id: "size-rank",
        name: {
          en: "India's size and rank",
          hi: "भारत का आकार और स्थान",
          mr: "भारताचा आकार आणि क्रमांक",
        },
        kind: "measure",
        prompt: {
          en: "Covering about 3.28 million square kilometres — roughly a fortieth of the world's land — India is one of the largest countries on Earth. Where does it rank by area?",
          hi: "लगभग 32.8 लाख वर्ग किलोमीटर — दुनिया की भूमि का लगभग चालीसवाँ भाग — ढकते हुए, भारत पृथ्वी के सबसे बड़े देशों में। यह क्षेत्रफल से किस स्थान पर है?",
          mr: "सुमारे 32.8 लाख चौरस किलोमीटर — जगाच्या जमिनीचा सुमारे चाळिसावा भाग — व्यापत, भारत पृथ्वीवरील सर्वांत मोठ्या देशांपैकी. तो क्षेत्रफळाने कोणत्या क्रमांकावर?",
        },
        statement: {
          en: "India covers about 3.28 million square kilometres, roughly 2.4% of the world's land area, making it the seventh largest country in the world by area.",
          hi: "भारत लगभग 32.8 लाख वर्ग किलोमीटर ढकता, विश्व के भूक्षेत्र का लगभग 2.4%, इसे क्षेत्रफल से दुनिया का सातवाँ सबसे बड़ा देश बनाता।",
          mr: "भारत सुमारे 32.8 लाख चौरस किलोमीटर व्यापतो, जगाच्या भूक्षेत्राचा सुमारे 2.4%, त्याला क्षेत्रफळाने जगातील सातवा सर्वांत मोठा देश बनवतो.",
        },
        detail: {
          en: "It is so large that mainland India is spoken of as a subcontinent, a distinct landmass set apart by the wall of the Himalayas and the surrounding seas.",
          hi: "यह इतना बड़ा कि मुख्य भूमि भारत को उपमहाद्वीप कहा जाता, हिमालय की दीवार और चारों ओर के समुद्रों से अलग एक विशिष्ट भूभाग।",
          mr: "तो इतका मोठा की मुख्य भूमी भारताला उपखंड म्हणतात, हिमालयाची भिंत आणि सभोवतालच्या समुद्रांनी वेगळा केलेला एक वैशिष्ट्यपूर्ण भूभाग.",
        },
        extra: {
          en: "Its land boundary runs about 15,200 km, and the coastline of the mainland and islands together stretches some 7,500 km.",
          hi: "इसकी थल सीमा लगभग 15,200 किमी चलती, और मुख्य भूमि तथा द्वीपों की तटरेखा मिलकर लगभग 7,500 किमी फैली।",
          mr: "त्याची भूसीमा सुमारे 15,200 किमी चालते, आणि मुख्य भूमी तसेच बेटांची किनारपट्टी मिळून सुमारे 7,500 किमी पसरली.",
        },
        pair: {
          left: {
            en: "3.28 million sq km, seventh largest",
            hi: "32.8 लाख वर्ग किमी, सातवाँ सबसे बड़ा",
            mr: "32.8 लाख चौ किमी, सातवा सर्वांत मोठा",
          },
          right: {
            en: "India's size and rank",
            hi: "भारत का आकार और स्थान",
            mr: "भारताचा आकार आणि क्रमांक",
          },
        },
      },
      {
        id: "neighbours",
        name: {
          en: "India's neighbours",
          hi: "भारत के पड़ोसी",
          mr: "भारताचे शेजारी",
        },
        kind: "location",
        prompt: {
          en: "India shares land borders with a ring of countries and sea boundaries with two island nations across the water. Which set of states forms its immediate neighbourhood?",
          hi: "भारत देशों के एक घेरे से थल सीमाएँ और पानी पार दो द्वीप-राष्ट्रों से समुद्री सीमाएँ साझा करता। कौन-सा राज्यों का समूह इसका तत्काल पड़ोस बनाता?",
          mr: "भारत देशांच्या एका वर्तुळाशी भूसीमा आणि पाण्यापलीकडे दोन बेट-राष्ट्रांशी सागरी सीमा वाटतो. कोणता राज्यांचा समूह त्याचा तात्काळ शेजार बनवतो?",
        },
        statement: {
          en: "India's land neighbours are Pakistan, Afghanistan, China, Nepal, Bhutan, Myanmar and Bangladesh, while Sri Lanka and the Maldives are its neighbours across the sea.",
          hi: "भारत के थल पड़ोसी पाकिस्तान, अफ़ग़ानिस्तान, चीन, नेपाल, भूटान, म्यांमार और बांग्लादेश हैं, जबकि श्रीलंका और मालदीव समुद्र पार पड़ोसी।",
          mr: "भारताचे भूशेजारी पाकिस्तान, अफगाणिस्तान, चीन, नेपाळ, भूतान, म्यानमार आणि बांगलादेश आहेत, तर श्रीलंका आणि मालदीव समुद्रापलीकडचे शेजारी.",
        },
        detail: {
          en: "Sri Lanka is separated from India only by the narrow Palk Strait and the Gulf of Mannar — a short reach of sea between the two.",
          hi: "श्रीलंका भारत से केवल सँकरे पाक जलडमरूमध्य और मन्नार की खाड़ी से अलग — दोनों के बीच समुद्र की छोटी पहुँच।",
          mr: "श्रीलंका भारतापासून फक्त अरुंद पाल्क सामुद्रधुनी आणि मन्नारच्या आखाताने वेगळा — दोहोंमधील समुद्राचा छोटा पल्ला.",
        },
        extra: {
          en: "These close ties are old and deep: for centuries ideas, goods and people have moved between India and its neighbours along land and sea routes alike.",
          hi: "ये निकट संबंध पुराने और गहरे: सदियों से विचार, वस्तुएँ और लोग भारत और उसके पड़ोसियों के बीच थल-समुद्र दोनों मार्गों से चलते आए।",
          mr: "हे जवळचे संबंध जुने आणि खोल: शतकानुशतके विचार, वस्तू आणि लोक भारत आणि त्याच्या शेजाऱ्यांमध्ये भू-समुद्र दोन्ही मार्गांनी फिरत आले.",
        },
        pair: {
          left: {
            en: "A land ring plus Sri Lanka and the Maldives",
            hi: "थल घेरा साथ श्रीलंका और मालदीव",
            mr: "भू-वर्तुळ सोबत श्रीलंका आणि मालदीव",
          },
          right: {
            en: "India's neighbours",
            hi: "भारत के पड़ोसी",
            mr: "भारताचे शेजारी",
          },
        },
      },
      {
        id: "ocean-location",
        name: {
          en: "India's central maritime location",
          hi: "भारत की केंद्रीय समुद्री स्थिति",
          mr: "भारताचे मध्यवर्ती सागरी स्थान",
        },
        kind: "location",
        prompt: {
          en: "A long peninsula thrusts India far into the sea that bears its name, placing it astride the routes between Europe, Africa and East Asia. What advantage does this seaward position give?",
          hi: "एक लंबा प्रायद्वीप भारत को उसके नाम के समुद्र में दूर धकेलता, इसे यूरोप, अफ़्रीका और पूर्वी एशिया के बीच मार्गों पर बिठाता। यह समुद्र-मुखी स्थिति क्या लाभ देती?",
          mr: "एक लांब द्वीपकल्प भारताला त्याच्या नावाच्या समुद्रात दूर ढकलतो, त्याला युरोप, आफ्रिका आणि पूर्व आशियादरम्यानच्या मार्गांवर बसवतो. हे समुद्राभिमुख स्थान काय फायदा देते?",
        },
        statement: {
          en: "India's peninsula juts into the Indian Ocean, giving it a central position on the sea routes between Europe, Africa and East Asia and a commanding place in Indian Ocean trade.",
          hi: "भारत का प्रायद्वीप हिंद महासागर में निकलता, इसे यूरोप, अफ़्रीका और पूर्वी एशिया के बीच समुद्री मार्गों पर केंद्रीय स्थिति और हिंद महासागर व्यापार में प्रमुख स्थान देता।",
          mr: "भारताचा द्वीपकल्प हिंदी महासागरात घुसतो, त्याला युरोप, आफ्रिका आणि पूर्व आशियादरम्यानच्या सागरी मार्गांवर मध्यवर्ती स्थान आणि हिंदी महासागर व्यापारात प्रमुख स्थान देतो.",
        },
        detail: {
          en: "The Indian Ocean is the only ocean named after a country, a mark of how central India's position has been to its trade and history.",
          hi: "हिंद महासागर एकमात्र महासागर है जो किसी देश के नाम पर, इस बात का चिह्न कि भारत की स्थिति उसके व्यापार और इतिहास को कितनी केंद्रीय रही।",
          mr: "हिंदी महासागर एकमेव महासागर आहे जो एका देशाच्या नावावर, याचे चिन्ह की भारताचे स्थान त्याच्या व्यापार आणि इतिहासाला किती मध्यवर्ती राहिले.",
        },
        extra: {
          en: "The opening of the Suez Canal in 1869 shortened the sea distance to Europe by thousands of kilometres, drawing India still closer to Western markets.",
          hi: "1869 में स्वेज़ नहर के खुलने ने यूरोप की समुद्री दूरी हज़ारों किलोमीटर घटाई, भारत को पश्चिमी बाज़ारों के और निकट खींचते।",
          mr: "1869 मध्ये सुएझ कालवा उघडल्याने युरोपचे सागरी अंतर हजारो किलोमीटर घटले, भारताला पश्चिमी बाजारांच्या अधिक जवळ खेचत.",
        },
        pair: {
          left: {
            en: "Astride the Europe–Africa–East Asia sea routes",
            hi: "यूरोप-अफ़्रीका-पूर्वी एशिया समुद्री मार्गों पर",
            mr: "युरोप-आफ्रिका-पूर्व आशिया सागरी मार्गांवर",
          },
          right: {
            en: "India's central maritime location",
            hi: "भारत की केंद्रीय समुद्री स्थिति",
            mr: "भारताचे मध्यवर्ती सागरी स्थान",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "When the sun is rising over Arunachal Pradesh in India's far east, watches in Gujarat in the far west still read about two hours earlier in the day — yet both states keep exactly the same clock time. How can this be, and why is one standard meridian used?",
          hi: "जब भारत के सुदूर पूर्व अरुणाचल प्रदेश पर सूरज उग रहा होता, सुदूर पश्चिम गुजरात की घड़ियाँ अब भी दिन में लगभग दो घंटे पहले पढ़तीं — फिर भी दोनों राज्य ठीक वही घड़ी-समय रखते। यह कैसे हो सकता, और एक मानक याम्योत्तर क्यों प्रयोग होता?",
          mr: "जेव्हा भारताच्या सुदूर पूर्वेला अरुणाचल प्रदेशावर सूर्य उगवत असतो, सुदूर पश्चिमेला गुजरातमधल्या घड्याळा अजून दिवसात सुमारे दोन तास आधी दाखवतात — तरी दोन्ही राज्ये नेमके तेच घड्याळ-वेळ राखतात. हे कसे शक्य, आणि एक प्रमाण रेखावृत्त का वापरतात?",
        },
        choices: [
          {
            en: "India spans about 30° of longitude, and every 15° equals one hour of the sun's apparent journey, so sunrise really is about two hours apart across the country; to avoid two zones confusing trains and offices, one central meridian (82°30'E) fixes a single Indian Standard Time for all",
            hi: "भारत लगभग 30° देशांतर फैला, और हर 15° सूरज की आभासी यात्रा के एक घंटे के बराबर, अतः देश भर में सूर्योदय सचमुच लगभग दो घंटे के अंतर से; रेलों-दफ़्तरों को उलझाते दो क्षेत्रों से बचने को, एक केंद्रीय याम्योत्तर (82°30'पू) सबके लिए एकल भारतीय मानक समय सधाता",
            mr: "भारत सुमारे 30° रेखांश पसरला, आणि प्रत्येक 15° सूर्याच्या आभासी प्रवासाच्या एका तासाइतके, म्हणून देशभर सूर्योदय खरोखर सुमारे दोन तासांच्या फरकाने; रेल्वे-कार्यालये गोंधळवणाऱ्या दोन विभागांपासून वाचायला, एक मध्यवर्ती रेखावृत्त (82°30'पू) सर्वांसाठी एकल भारतीय प्रमाण वेळ जुळवते",
          },
          {
            en: "The sun physically moves faster over eastern India than western India",
            hi: "सूरज पूर्वी भारत पर पश्चिमी भारत से भौतिक रूप से तेज़ चलता",
            mr: "सूर्य पूर्व भारतावर पश्चिम भारताहून भौतिकदृष्ट्या वेगाने चालतो",
          },
          {
            en: "Gujarat and Arunachal are at the same longitude, so there is no real time gap",
            hi: "गुजरात और अरुणाचल एक ही देशांतर पर, अतः कोई असली समय-अंतर नहीं",
            mr: "गुजरात आणि अरुणाचल एकाच रेखांशावर, म्हणून कोणताही खरा वेळ-फरक नाही",
          },
          {
            en: "India uses a different clock in every state, changing at each border",
            hi: "भारत हर राज्य में भिन्न घड़ी प्रयोग करता, हर सीमा पर बदलते",
            mr: "भारत प्रत्येक राज्यात वेगळी घड्याळ वापरतो, प्रत्येक सीमेवर बदलत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The two-hour gap is real and comes straight from India's east–west size. The Earth turns once — 360° — in twenty-four hours, so the sun appears to sweep 15° of longitude every hour. India's mainland stretches from about 68°E in the west to about 97°E in the east, close to 30° of longitude, so the sun reaches the eastern edge roughly two hours before the western: dawn genuinely breaks over Arunachal Pradesh long before it does over Gujarat. If each place simply used its own local sun-time, a train crossing the country would have to reset its clock continuously, and timetables, offices and broadcasts would be chaos. To prevent this, India picks one central line of longitude, 82°30'E (passing near Mirzapur), and declares the local time along it to be Indian Standard Time for the entire country. Everyone sets their clocks to that single meridian, even though it means the eastern regions see the sun 'too early' by the clock and the western regions 'too late'. The trade-off is deliberate: a little mismatch with the local sun in exchange for one shared time that keeps a country 3,000 km wide running together. Large countries like the USA or Russia instead choose several time zones; India, valuing simplicity and unity, keeps just one.",
          hi: "दो घंटे का अंतर असली है और सीधे भारत के पूर्व-पश्चिम आकार से आता। पृथ्वी एक बार घूमती — 360° — चौबीस घंटे में, अतः सूरज हर घंटे 15° देशांतर बहता दिखता। भारत की मुख्य भूमि पश्चिम में लगभग 68°पू से पूर्व में लगभग 97°पू फैली, लगभग 30° देशांतर, अतः सूरज पूर्वी छोर तक पश्चिमी से लगभग दो घंटे पहले पहुँचता: भोर सचमुच अरुणाचल प्रदेश पर गुजरात से बहुत पहले टूटती। यदि हर जगह बस अपना स्थानीय सूर्य-समय प्रयोग करे, देश पार करती रेल को अपनी घड़ी लगातार पुनः सधानी पड़ती, और समय-सारणियाँ, दफ़्तर और प्रसारण अफ़रा-तफ़री होते। इसे रोकने को, भारत एक केंद्रीय देशांतर रेखा, 82°30'पू (मिर्ज़ापुर के पास), चुनता और उसके अनुदिश स्थानीय समय को पूरे देश का भारतीय मानक समय घोषित करता। सब अपनी घड़ियाँ उस एकल याम्योत्तर पर सधाते, भले इसका अर्थ हो पूर्वी क्षेत्र घड़ी से सूरज 'बहुत जल्दी' देखें और पश्चिमी 'बहुत देर'। अदला-बदली जान-बूझकर: स्थानीय सूरज से थोड़ी बेमेल के बदले एक साझा समय जो 3,000 किमी चौड़े देश को एक-साथ चलाता। अमेरिका या रूस जैसे बड़े देश बदले कई समय-क्षेत्र चुनते; भारत, सरलता-एकता को महत्व देते, केवल एक रखता।",
          mr: "दोन तासांचा फरक खरा आहे आणि थेट भारताच्या पूर्व-पश्चिम आकारातून येतो. पृथ्वी एकदा फिरते — 360° — चोवीस तासांत, म्हणून सूर्य प्रत्येक तासाला 15° रेखांश वाहताना दिसतो. भारताची मुख्य भूमी पश्चिमेला सुमारे 68°पू ते पूर्वेला सुमारे 97°पू पसरली, जवळपास 30° रेखांश, म्हणून सूर्य पूर्व टोकापर्यंत पश्चिमेहून सुमारे दोन तास आधी पोहोचतो: पहाट खरोखर अरुणाचल प्रदेशावर गुजरातहून खूप आधी फुटते. जर प्रत्येक ठिकाणी फक्त स्वतःचा स्थानिक सूर्य-वेळ वापरला, देश ओलांडणाऱ्या रेल्वेला आपली घड्याळ सतत पुन्हा जुळवावी लागेल, आणि वेळापत्रके, कार्यालये आणि प्रक्षेपणे गोंधळ होतील. हे रोखायला, भारत एक मध्यवर्ती रेखांश रेषा, 82°30'पू (मिर्झापूरजवळून), निवडतो आणि तिच्या बाजूचा स्थानिक वेळ अख्ख्या देशाचा भारतीय प्रमाण वेळ घोषित करतो. सारे आपली घड्याळे त्या एकल रेखावृत्तावर जुळवतात, जरी याचा अर्थ पूर्व प्रदेश घड्याळाने सूर्य 'फार लवकर' पाहतात आणि पश्चिम 'फार उशिरा'. तडजोड जाणीवपूर्वक: स्थानिक सूर्याशी थोडी विसंगती त्याबदल्यात एक सामायिक वेळ जो 3,000 किमी रुंद देश एकत्र चालवतो. अमेरिका वा रशियासारखे मोठे देश त्याऐवजी अनेक वेळ-विभाग निवडतात; भारत, साधेपणा-एकतेला महत्त्व देत, फक्त एक ठेवतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "India's north–south and east–west distances are almost equal in kilometres (about 3,200 km and 2,900 km), yet the country spans nearly 30° of longitude but only about 29° of latitude in a way that does not match those kilometres neatly. Why do equal-looking distances correspond to such different numbers of degrees?",
          hi: "भारत की उत्तर-दक्षिण और पूर्व-पश्चिम दूरियाँ किलोमीटर में लगभग बराबर (लगभग 3,200 किमी और 2,900 किमी), फिर भी देश लगभग 30° देशांतर पर फैला पर केवल लगभग 29° अक्षांश ऐसे कि वे किलोमीटर सफ़ाई से मेल नहीं खाते। बराबर-दिखती दूरियाँ इतने भिन्न अंश-संख्या से क्यों मेल खातीं?",
          mr: "भारताची उत्तर-दक्षिण आणि पूर्व-पश्चिम अंतरे किलोमीटरमध्ये जवळपास समान (सुमारे 3,200 किमी आणि 2,900 किमी), तरी देश जवळपास 30° रेखांश पसरला पण फक्त सुमारे 29° अक्षांश अशा रीतीने की ते किलोमीटर नीट जुळत नाहीत. समान-दिसणारी अंतरे इतक्या वेगळ्या अंश-संख्येशी का जुळतात?",
        },
        choices: [
          {
            en: "Lines of latitude stay a roughly constant distance apart everywhere, but lines of longitude are farthest apart at the equator and squeeze together toward the poles; India lies well north of the equator, so each degree of longitude there covers fewer kilometres than a degree of latitude does",
            hi: "अक्षांश रेखाएँ हर जगह लगभग नियत दूरी पर रहतीं, पर देशांतर रेखाएँ भूमध्य रेखा पर सबसे दूर और ध्रुवों की ओर पास सिकुड़तीं; भारत भूमध्य रेखा के काफ़ी उत्तर, अतः वहाँ हर देशांतर अंश एक अक्षांश अंश से कम किलोमीटर ढकता",
            mr: "अक्षवृत्त रेषा सर्वत्र जवळपास स्थिर अंतरावर राहतात, पण रेखांश रेषा विषुववृत्तावर सर्वांत दूर आणि ध्रुवांकडे जवळ आकुंचतात; भारत विषुववृत्ताच्या बराच उत्तरेला, म्हणून तिथे प्रत्येक रेखांश अंश एका अक्षांश अंशाहून कमी किलोमीटर व्यापतो",
          },
          {
            en: "The Earth is flat, so degrees and kilometres never match",
            hi: "पृथ्वी सपाट है, अतः अंश और किलोमीटर कभी मेल नहीं खाते",
            mr: "पृथ्वी सपाट आहे, म्हणून अंश आणि किलोमीटर कधी जुळत नाहीत",
          },
          {
            en: "India is simply measured wrongly in one direction",
            hi: "भारत बस एक दिशा में ग़लत नापा गया",
            mr: "भारत फक्त एका दिशेने चुकीचे मोजला गेला",
          },
          {
            en: "Degrees of latitude and longitude are always exactly the same size everywhere on Earth",
            hi: "अक्षांश और देशांतर के अंश पृथ्वी पर हर जगह सदा ठीक बराबर आकार के",
            mr: "अक्षांश आणि रेखांशाचे अंश पृथ्वीवर सर्वत्र सदैव नेमके समान आकाराचे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The key is that degrees of latitude and degrees of longitude do not measure the same ground distance, and only latitude behaves simply. Lines of latitude (parallels) are true parallels — they stay a nearly constant distance apart from the equator to the poles — so one degree of latitude is always about 111 km, anywhere on Earth. Lines of longitude (meridians) are different: they all meet at the two poles and spread farthest apart at the equator. So a degree of longitude is worth about 111 km only at the equator, and shrinks as you move toward either pole, following the cosine of the latitude. India sits well north of the equator (roughly 8° to 37°N), so across it a degree of longitude covers noticeably fewer kilometres than a degree of latitude — very roughly 90–100 km against 111 km. That is why India's east–west span can be nearly 30° of longitude and yet cover slightly fewer kilometres than its north–south span of about 29° of latitude: the eastern degrees are 'narrower' on the ground. The lesson is that a map's grid is not a plain ruler — the same number of degrees means a shorter real distance in longitude the farther you are from the equator, which is exactly why shapes look stretched near the poles on a flat world map.",
          hi: "कुंजी यह कि अक्षांश और देशांतर के अंश एक ही भू-दूरी नहीं नापते, और केवल अक्षांश सरल व्यवहार करता। अक्षांश रेखाएँ (समांतर) सच्ची समांतर — वे भूमध्य रेखा से ध्रुवों तक लगभग नियत दूरी पर रहतीं — अतः एक अक्षांश अंश सदा लगभग 111 किमी, पृथ्वी पर कहीं भी। देशांतर रेखाएँ (याम्योत्तर) भिन्न: वे दोनों ध्रुवों पर मिलतीं और भूमध्य रेखा पर सबसे दूर फैलतीं। अतः एक देशांतर अंश लगभग 111 किमी केवल भूमध्य रेखा पर, और किसी भी ध्रुव की ओर बढ़ते सिकुड़ता, अक्षांश के कोसाइन का अनुसरण करते। भारत भूमध्य रेखा के काफ़ी उत्तर (लगभग 8° से 37°उ), अतः उसके आर-पार एक देशांतर अंश एक अक्षांश अंश से स्पष्ट कम किलोमीटर ढकता — बहुत मोटे तौर 90–100 किमी बनाम 111 किमी। इसी से भारत का पूर्व-पश्चिम फैलाव लगभग 30° देशांतर हो सकता फिर भी अपने लगभग 29° अक्षांश के उत्तर-दक्षिण फैलाव से थोड़े कम किलोमीटर ढके: पूर्वी अंश ज़मीन पर 'सँकरे'। सबक़: नक़्शे का ग्रिड सादा फुट्टा नहीं — वही अंश-संख्या देशांतर में छोटी असली दूरी बताती जितना तुम भूमध्य रेखा से दूर, ठीक इसीलिए सपाट विश्व-मानचित्र पर ध्रुवों के पास आकार खिंचे दिखते।",
          mr: "किल्ली ही की अक्षांश आणि रेखांशाचे अंश एकच भू-अंतर मोजत नाहीत, आणि फक्त अक्षांश साधे वागते. अक्षवृत्त रेषा (समांतर) खऱ्या समांतर — त्या विषुववृत्तापासून ध्रुवांपर्यंत जवळपास स्थिर अंतरावर राहतात — म्हणून एक अक्षांश अंश सदैव सुमारे 111 किमी, पृथ्वीवर कुठेही. रेखांश रेषा (रेखावृत्त) वेगळ्या: त्या दोन्ही ध्रुवांवर भेटतात आणि विषुववृत्तावर सर्वांत दूर पसरतात. म्हणून एक रेखांश अंश सुमारे 111 किमी फक्त विषुववृत्तावर, आणि कोणत्याही ध्रुवाकडे सरकताना आकुंचतो, अक्षांशाच्या कोसाइनचे अनुसरण करत. भारत विषुववृत्ताच्या बराच उत्तरेला (सुमारे 8° ते 37°उ), म्हणून त्याच्या आरपार एक रेखांश अंश एका अक्षांश अंशाहून स्पष्ट कमी किलोमीटर व्यापतो — फार ढोबळमानाने 90–100 किमी विरुद्ध 111 किमी. म्हणूनच भारताचा पूर्व-पश्चिम पसारा जवळपास 30° रेखांश असू शकतो तरी त्याच्या सुमारे 29° अक्षांशाच्या उत्तर-दक्षिण पसाऱ्याहून थोडे कमी किलोमीटर व्यापतो: पूर्व अंश जमिनीवर 'अरुंद'. धडा: नकाशाची जाळी साधी मोजपट्टी नाही — तीच अंश-संख्या रेखांशात लहान खरे अंतर सांगते जितके तुम्ही विषुववृत्तापासून दूर, नेमके म्हणूनच सपाट जग-नकाशावर ध्रुवांजवळ आकार ताणलेले दिसतात.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Physical Features of India                                  */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-9-physical-features",
    subject: "GEOGRAPHY",
    classLevel: 9,
    chapter: {
      en: "Chapter 2 — Physical Features of India",
      hi: "अध्याय 2 — भारत के भौतिक स्वरूप",
      mr: "प्रकरण 2 — भारताची प्राकृतिक रचना",
    },
    name: {
      en: "Physical Features of India",
      hi: "भारत के भौतिक स्वरूप",
      mr: "भारताची प्राकृतिक रचना",
    },
    summary: {
      en: "The land in six pieces, each built a different way: young folded Himalayas still rising, flat plains laid down grain by grain by great rivers, an ancient hard plateau older than them all, a sandy desert in the west, coastal strips flanked by hills, and two very different island chains.",
      hi: "भूमि छह टुकड़ों में, हर एक भिन्न तरीक़े से बना: अब भी उठते युवा मुड़े हिमालय, महान नदियों द्वारा कण-कण बिछाए समतल मैदान, इन सबसे पुराना कठोर पठार, पश्चिम में रेतीला मरुस्थल, पहाड़ियों से सटी तटीय पट्टियाँ, और दो बहुत भिन्न द्वीप-शृंखलाएँ।",
      mr: "भूमी सहा तुकड्यांत, प्रत्येक वेगळ्या रीतीने बनलेला: अजून उठणारे तरुण घडीचे हिमालय, महान नद्यांनी कण-कण अंथरलेली सपाट मैदाने, या सर्वांहून जुने कठीण पठार, पश्चिमेला वालुकामय वाळवंट, टेकड्यांनी लगत असलेल्या किनारी पट्ट्या, आणि दोन अतिशय वेगळ्या बेट-साखळ्या.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "himalayas",
        name: {
          en: "The Himalayan mountains",
          hi: "हिमालय पर्वत",
          mr: "हिमालय पर्वत",
        },
        kind: "landform",
        prompt: {
          en: "Along India's northern edge rise the world's highest ranges, young fold mountains still growing as two great plates press together. Which physical division is this?",
          hi: "भारत के उत्तरी किनारे पर दुनिया की सबसे ऊँची शृंखलाएँ उठतीं, युवा मुड़े पर्वत जो दो महान प्लेटों के दबते अब भी बढ़ते। यह कौन-सा भौतिक विभाग है?",
          mr: "भारताच्या उत्तर काठावर जगातील सर्वांत उंच रांगा उठतात, तरुण घडीचे पर्वत जे दोन महान भूपट्ट दाबताना अजून वाढतात. हा कोणता प्राकृतिक विभाग?",
        },
        statement: {
          en: "The Himalayas are young fold mountains along India's north — the world's highest ranges, running in three roughly parallel ranges and still rising as the plates beneath them collide.",
          hi: "हिमालय भारत के उत्तर के युवा मुड़े पर्वत हैं — दुनिया की सबसे ऊँची शृंखलाएँ, तीन लगभग समांतर श्रेणियों में चलतीं और नीचे की प्लेटों के टकराते अब भी उठतीं।",
          mr: "हिमालय भारताच्या उत्तरेकडचे तरुण घडीचे पर्वत आहेत — जगातील सर्वांत उंच रांगा, तीन जवळपास समांतर रांगांत चालणाऱ्या आणि खालचे भूपट्ट आदळताना अजून उठणाऱ्या.",
        },
        detail: {
          en: "They rise in three belts — the towering snowy Himadri, the rugged Himachal below it, and the low outer Shiwaliks — each a step down toward the plains.",
          hi: "वे तीन पेटियों में उठतीं — ऊँची बर्फ़ीली हिमाद्रि, उसके नीचे उबड़-खाबड़ हिमाचल, और निचली बाहरी शिवालिक — हर एक मैदानों की ओर एक सीढ़ी नीचे।",
          mr: "त्या तीन पट्ट्यांत उठतात — उंच बर्फाळ हिमाद्री, तिच्याखाली खडबडीत हिमाचल, आणि खालची बाह्य शिवालिक — प्रत्येक मैदानांकडे एक पायरी खाली.",
        },
        extra: {
          en: "As a young range they are still geologically active — earthquakes in the region are a sign that the mountains are being pushed higher even now.",
          hi: "युवा श्रेणी होने से वे अब भी भूवैज्ञानिक रूप से सक्रिय — क्षेत्र के भूकंप संकेत कि पर्वत अभी भी ऊँचे धकेले जा रहे।",
          mr: "तरुण रांग असल्याने त्या अजून भूवैज्ञानिकदृष्ट्या सक्रिय — प्रदेशातील भूकंप संकेत की पर्वत अजूनही उंच ढकलले जात आहेत.",
        },
        pair: {
          left: {
            en: "Young folds still rising in the north",
            hi: "उत्तर में अब भी उठतीं युवा मोड़ें",
            mr: "उत्तरेत अजून उठणाऱ्या तरुण घड्या",
          },
          right: {
            en: "the Himalayan mountains",
            hi: "हिमालय पर्वत",
            mr: "हिमालय पर्वत",
          },
        },
      },
      {
        id: "northern-plains",
        name: {
          en: "The Northern Plains belt",
          hi: "उत्तरी मैदानी पेटी",
          mr: "उत्तर मैदानी पट्टा",
        },
        kind: "landform",
        prompt: {
          en: "South of the mountains lies a vast flat belt of fertile soil, built up over ages from silt carried down by three great river systems. Which division is this?",
          hi: "पर्वतों के दक्षिण एक विशाल समतल उपजाऊ मिट्टी की पेटी, तीन महान नदी-तंत्रों द्वारा नीचे लाई गाद से युगों में बनी। यह कौन-सा विभाग है?",
          mr: "पर्वतांच्या दक्षिणेला एक विशाल सपाट सुपीक मातीचा पट्टा, तीन महान नदी-प्रणालींनी खाली आणलेल्या गाळाने युगांत बनलेला. हा कोणता विभाग?",
        },
        statement: {
          en: "The Northern Plains are a broad, flat belt of deep alluvial soil, built up over thousands of years by silt deposited by the Indus, Ganga and Brahmaputra river systems.",
          hi: "उत्तरी मैदान गहरी जलोढ़ मिट्टी की चौड़ी, समतल पेटी हैं, हज़ारों वर्षों में सिंधु, गंगा और ब्रह्मपुत्र नदी-तंत्रों द्वारा जमाई गाद से बने।",
          mr: "उत्तर मैदाने खोल गाळाच्या मातीचा रुंद, सपाट पट्टा आहेत, हजारो वर्षांत सिंधू, गंगा आणि ब्रह्मपुत्रा नदी-प्रणालींनी साचवलेल्या गाळाने बनलेली.",
        },
        detail: {
          en: "This rich soil, level land and plentiful river water make the plains India's most productive farmland and its most densely peopled region.",
          hi: "यह समृद्ध मिट्टी, समतल भूमि और भरपूर नदी-जल मैदानों को भारत की सबसे उत्पादक कृषि-भूमि और सबसे घनी आबादी वाला क्षेत्र बनाते।",
          mr: "ही समृद्ध माती, सपाट जमीन आणि भरपूर नदी-पाणी मैदानांना भारताची सर्वांत उत्पादक शेतजमीन आणि सर्वांत दाट लोकवस्तीचा प्रदेश बनवतात.",
        },
        extra: {
          en: "The freshest belt of silt near the rivers is called the khadar, renewed each flood; the older, higher alluvium away from them is the bhangar.",
          hi: "नदियों के पास गाद की सबसे ताज़ी पेटी खादर कहलाती, हर बाढ़ में नवीकृत; उनसे दूर पुरानी, ऊँची जलोढ़ भांगर है।",
          mr: "नद्यांजवळचा गाळाचा सर्वांत ताजा पट्टा खादर म्हणतात, प्रत्येक पुरात नूतनीकृत; त्यांपासून दूर जुना, उंच गाळ भांगर आहे.",
        },
        pair: {
          left: {
            en: "Flat alluvium laid by three river systems",
            hi: "तीन नदी-तंत्रों की बिछाई समतल जलोढ़",
            mr: "तीन नदी-प्रणालींनी अंथरलेला सपाट गाळ",
          },
          right: {
            en: "the Northern Plains",
            hi: "उत्तरी मैदान",
            mr: "उत्तर मैदाने",
          },
        },
      },
      {
        id: "peninsular-plateau",
        name: {
          en: "The Peninsular Plateau block",
          hi: "प्रायद्वीपीय पठारी खंड",
          mr: "द्वीपकल्पीय पठारी ठोकळा",
        },
        kind: "landform",
        prompt: {
          en: "The southern triangle of India is a tableland of ancient hard rock, the oldest landmass in the country, rich in minerals and topped in places with black lava soil. Which division is this?",
          hi: "भारत का दक्षिणी त्रिकोण प्राचीन कठोर चट्टान का पठार है, देश का सबसे पुराना भूभाग, खनिजों से समृद्ध और कहीं-कहीं काली लावा-मिट्टी से ढका। यह कौन-सा विभाग है?",
          mr: "भारताचा दक्षिण त्रिकोण प्राचीन कठीण खडकाचे पठार आहे, देशातील सर्वांत जुना भूभाग, खनिजांनी समृद्ध आणि ठिकठिकाणी काळ्या लाव्हा-मातीने झाकलेला. हा कोणता विभाग?",
        },
        statement: {
          en: "The Peninsular Plateau is a tableland of old, hard igneous and metamorphic rock — the oldest landmass in India — rich in minerals, with black lava soil over its Deccan trap.",
          hi: "प्रायद्वीपीय पठार पुरानी, कठोर आग्नेय और कायांतरित चट्टान का पठार है — भारत का सबसे पुराना भूभाग — खनिजों से समृद्ध, अपने दक्कन ट्रैप पर काली लावा-मिट्टी सहित।",
          mr: "द्वीपकल्पीय पठार जुन्या, कठीण अग्निजन्य आणि रूपांतरित खडकाचे पठार आहे — भारतातील सर्वांत जुना भूभाग — खनिजांनी समृद्ध, आपल्या दख्खन ट्रॅपवर काळ्या लाव्हा-मातीसह.",
        },
        detail: {
          en: "It is a stable, ancient block that has stayed put while younger mountains folded around it — its rocks hold much of India's coal, iron and other minerals.",
          hi: "यह एक स्थिर, प्राचीन खंड है जो टिका रहा जबकि युवा पर्वत उसके चारों ओर मुड़े — उसकी चट्टानें भारत का अधिकांश कोयला, लोहा और अन्य खनिज रखतीं।",
          mr: "हा एक स्थिर, प्राचीन ठोकळा आहे जो टिकून राहिला तर तरुण पर्वत त्याच्याभोवती घडले — त्याचे खडक भारताचा बहुतांश कोळसा, लोखंड आणि इतर खनिजे राखतात.",
        },
        extra: {
          en: "It is flanked by two hill ranges, the Western and Eastern Ghats, which drop to the coastal plains and largely decide which way its rivers flow.",
          hi: "यह दो पहाड़ी श्रेणियों, पश्चिमी और पूर्वी घाट, से घिरा, जो तटीय मैदानों तक उतरतीं और काफ़ी हद तक तय करतीं इसकी नदियाँ किधर बहें।",
          mr: "हा दोन टेकडी-रांगांनी, पश्चिम आणि पूर्व घाट, वेढलेला, ज्या किनारी मैदानांपर्यंत उतरतात आणि बऱ्याच अंशी ठरवतात याच्या नद्या कोणीकडे वाहतील.",
        },
        pair: {
          left: {
            en: "The oldest hard-rock tableland",
            hi: "सबसे पुराना कठोर-चट्टान पठार",
            mr: "सर्वांत जुने कठीण-खडक पठार",
          },
          right: {
            en: "the Peninsular Plateau",
            hi: "प्रायद्वीपीय पठार",
            mr: "द्वीपकल्पीय पठार",
          },
        },
      },
      {
        id: "indian-desert",
        name: {
          en: "The Indian Desert",
          hi: "भारतीय मरुस्थल",
          mr: "भारतीय वाळवंट",
        },
        kind: "landform",
        prompt: {
          en: "In the far west, along the border, lies a dry expanse of rolling sand dunes with scanty rain and only seasonal streams. Which physical division is this?",
          hi: "सुदूर पश्चिम में, सीमा के साथ, लहराते रेत के टीलों का शुष्क विस्तार, कम वर्षा और केवल मौसमी धाराओं वाला। यह कौन-सा भौतिक विभाग है?",
          mr: "सुदूर पश्चिमेला, सीमेलगत, लहरत्या वाळूच्या ढिगाऱ्यांचा कोरडा विस्तार, अल्प पाऊस आणि फक्त हंगामी प्रवाह असलेला. हा कोणता प्राकृतिक विभाग?",
        },
        statement: {
          en: "The Indian Desert, the Thar, is an arid land of rolling sand dunes along the western edge, with very low rainfall and streams that flow only in the rainy season.",
          hi: "भारतीय मरुस्थल, थार, पश्चिमी किनारे के साथ लहराते रेत के टीलों की शुष्क भूमि है, बहुत कम वर्षा और केवल बरसात में बहती धाराओं वाली।",
          mr: "भारतीय वाळवंट, थार, पश्चिम काठालगत लहरत्या वाळूच्या ढिगाऱ्यांची कोरडी भूमी आहे, फार कमी पाऊस आणि फक्त पावसाळ्यात वाहणाऱ्या प्रवाहांची.",
        },
        detail: {
          en: "Rainfall is meagre and uneven, so vegetation is thin and scattered, and the Luni is almost the only river of any size across it.",
          hi: "वर्षा अल्प और असमान, अतः वनस्पति पतली और बिखरी, और लूनी इसके आर-पार लगभग एकमात्र किसी आकार की नदी।",
          mr: "पाऊस अल्प आणि असमान, म्हणून वनस्पती विरळ आणि विखुरलेली, आणि लूनी याच्या आरपार जवळपास एकमेव कोणत्याही आकाराची नदी.",
        },
        extra: {
          en: "Its dunes shift with the wind, and life here — from the desert's grasses to its people — is shaped by the constant scarcity of water.",
          hi: "इसके टीले हवा से खिसकते, और यहाँ जीवन — मरुस्थल की घासों से उसके लोगों तक — पानी की निरंतर कमी से गढ़ा।",
          mr: "याचे ढिगारे वाऱ्याने सरकतात, आणि इथले जीवन — वाळवंटाच्या गवतांपासून त्याच्या लोकांपर्यंत — पाण्याच्या सतत टंचाईने घडलेले.",
        },
        pair: {
          left: {
            en: "Sand dunes and scanty rain in the west",
            hi: "पश्चिम में रेत के टीले और कम वर्षा",
            mr: "पश्चिमेला वाळूचे ढिगारे आणि अल्प पाऊस",
          },
          right: {
            en: "the Indian Desert",
            hi: "भारतीय मरुस्थल",
            mr: "भारतीय वाळवंट",
          },
        },
      },
      {
        id: "coastal-plains",
        name: {
          en: "The Coastal Plains belt",
          hi: "तटीय मैदानी पेटी",
          mr: "किनारी मैदानी पट्टा",
        },
        kind: "landform",
        prompt: {
          en: "Flanking the plateau on east and west are narrow strips of low land between the hills and the sea, carrying ports, lagoons and river deltas. Which division is this?",
          hi: "पठार को पूर्व-पश्चिम घेरतीं पहाड़ियों और समुद्र के बीच निचली भूमि की सँकरी पट्टियाँ, बंदरगाह, अनूप और नदी-डेल्टा ढोतीं। यह कौन-सा विभाग है?",
          mr: "पठाराला पूर्व-पश्चिम वेढणाऱ्या टेकड्या आणि समुद्रादरम्यान सखल जमिनीच्या अरुंद पट्ट्या, बंदरे, खाजण आणि नदी-त्रिभुज वाहणाऱ्या. हा कोणता विभाग?",
        },
        statement: {
          en: "The Coastal Plains are narrow strips of low land between the Ghats and the sea on India's eastern and western flanks, holding ports, lagoons, and river deltas.",
          hi: "तटीय मैदान भारत के पूर्वी-पश्चिमी किनारों पर घाटों और समुद्र के बीच निचली भूमि की सँकरी पट्टियाँ हैं, बंदरगाह, अनूप और नदी-डेल्टा रखतीं।",
          mr: "किनारी मैदाने भारताच्या पूर्व-पश्चिम बाजूंना घाट आणि समुद्रादरम्यान सखल जमिनीच्या अरुंद पट्ट्या आहेत, बंदरे, खाजण आणि नदी-त्रिभुज राखणाऱ्या.",
        },
        detail: {
          en: "The eastern coast is wider and gentler, where great peninsular rivers build deltas; the western coast is narrow and steep, with lagoons like Kerala's backwaters.",
          hi: "पूर्वी तट चौड़ा और कोमल, जहाँ महान प्रायद्वीपीय नदियाँ डेल्टा बनातीं; पश्चिमी तट सँकरा और खड़ा, केरल के बैकवाटर जैसे अनूपों सहित।",
          mr: "पूर्व किनारा रुंद आणि सौम्य, जिथे महान द्वीपकल्पीय नद्या त्रिभुज बनवतात; पश्चिम किनारा अरुंद आणि तीव्र, केरळच्या बॅकवॉटरसारख्या खाजणांसह.",
        },
        extra: {
          en: "These plains have long been India's window to the sea, dotted with the harbours through which its ocean trade has flowed for centuries.",
          hi: "ये मैदान लंबे समय भारत की समुद्र-खिड़की रहे, उन बंदरगाहों से बिंदित जिनसे इसका महासागरीय व्यापार सदियों बहा।",
          mr: "ही मैदाने बराच काळ भारताची समुद्र-खिडकी राहिली, त्या बंदरांनी नटलेली ज्यांतून त्याचा महासागरी व्यापार शतकानुशतके वाहिला.",
        },
        pair: {
          left: {
            en: "Low strips between the Ghats and the sea",
            hi: "घाटों और समुद्र के बीच निचली पट्टियाँ",
            mr: "घाट आणि समुद्रादरम्यान सखल पट्ट्या",
          },
          right: {
            en: "the Coastal Plains",
            hi: "तटीय मैदान",
            mr: "किनारी मैदाने",
          },
        },
      },
      {
        id: "islands",
        name: { en: "The Islands", hi: "द्वीप समूह", mr: "बेटे" },
        kind: "landform",
        prompt: {
          en: "India owns two very different island groups — a chain of coral atolls in the Arabian Sea and a line of rugged volcanic-and-hilly islands in the Bay of Bengal. Which division do these form?",
          hi: "भारत के दो बहुत भिन्न द्वीप-समूह — अरब सागर में मूँगा-द्वीपों की शृंखला और बंगाल की खाड़ी में उबड़-खाबड़ ज्वालामुखीय-पहाड़ी द्वीपों की क़तार। ये कौन-सा विभाग बनाते?",
          mr: "भारताचे दोन अतिशय वेगळे बेट-समूह — अरबी समुद्रात प्रवाळ-बेटांची साखळी आणि बंगालच्या उपसागरात खडबडीत ज्वालामुखीय-डोंगराळ बेटांची रांग. हे कोणता विभाग बनवतात?",
        },
        statement: {
          en: "India's Islands are two distinct groups — the coral Lakshadweep in the Arabian Sea, and the larger, hilly, partly volcanic Andaman and Nicobar Islands in the Bay of Bengal.",
          hi: "भारत के द्वीप दो अलग समूह — अरब सागर में मूँगा लक्षद्वीप, और बंगाल की खाड़ी में बड़े, पहाड़ी, आंशिक ज्वालामुखीय अंडमान और निकोबार द्वीप।",
          mr: "भारताची बेटे दोन वेगळे समूह — अरबी समुद्रात प्रवाळ लक्षद्वीप, आणि बंगालच्या उपसागरात मोठी, डोंगराळ, अंशतः ज्वालामुखीय अंदमान आणि निकोबार बेटे.",
        },
        detail: {
          en: "Lakshadweep's islands are small, low reefs built by coral polyps; the Andaman and Nicobar chain is far larger, hilly and clothed in dense forest.",
          hi: "लक्षद्वीप के द्वीप छोटे, नीचे मूँगा-कीटों द्वारा बनी भित्तियाँ; अंडमान-निकोबार शृंखला कहीं बड़ी, पहाड़ी और घने वन में ढकी।",
          mr: "लक्षद्वीपची बेटे लहान, सखल प्रवाळ-कीटकांनी बनवलेली भित्ती; अंदमान-निकोबार साखळी कितीतरी मोठी, डोंगराळ आणि घनदाट जंगलाने आच्छादलेली.",
        },
        extra: {
          en: "The Andaman and Nicobar Islands sit near key sea lanes and are home to some of the world's most isolated indigenous peoples.",
          hi: "अंडमान-निकोबार द्वीप मुख्य समुद्री मार्गों के पास बसे और दुनिया के कुछ सबसे एकाकी आदिवासी लोगों का घर।",
          mr: "अंदमान-निकोबार बेटे मुख्य सागरी मार्गांजवळ वसली आणि जगातील काही सर्वांत एकाकी आदिवासी लोकांचे घर.",
        },
        pair: {
          left: {
            en: "Coral in the Arabian Sea, hilly in the Bay of Bengal",
            hi: "अरब सागर में मूँगा, बंगाल की खाड़ी में पहाड़ी",
            mr: "अरबी समुद्रात प्रवाळ, बंगालच्या उपसागरात डोंगराळ",
          },
          right: {
            en: "the Islands",
            hi: "द्वीप समूह",
            mr: "बेटे",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "The Northern Plains cover only a modest share of India's area, yet they feed a huge part of its people and are the most densely settled land in the country. What combination of natural gifts makes them so productive?",
          hi: "उत्तरी मैदान भारत के क्षेत्रफल का केवल मामूली हिस्सा ढकते, फिर भी वे इसके लोगों का बड़ा भाग पालते और देश की सबसे घनी बसी भूमि हैं। प्राकृतिक उपहारों का कौन-सा संयोजन उन्हें इतना उत्पादक बनाता?",
          mr: "उत्तर मैदाने भारताच्या क्षेत्रफळाचा फक्त माफक वाटा व्यापतात, तरी ती त्याच्या लोकांचा मोठा भाग पोसतात आणि देशातील सर्वांत दाट वस्तीची भूमी आहेत. नैसर्गिक देणग्यांचे कोणते संयोजन त्यांना इतके उत्पादक बनवते?",
        },
        choices: [
          {
            en: "Deep, fertile alluvial soil renewed by the rivers, land that is flat and easy to plough and irrigate, and a steady supply of river water together make farming rich — so people have gathered there in great numbers for millennia",
            hi: "नदियों द्वारा नवीकृत गहरी, उपजाऊ जलोढ़ मिट्टी, समतल और जोतने-सींचने में आसान भूमि, और नदी-जल की स्थिर आपूर्ति मिलकर खेती समृद्ध करते — अतः लोग वहाँ सहस्राब्दियों से बड़ी संख्या में जुटे",
            mr: "नद्यांनी नूतनीकृत खोल, सुपीक गाळाची माती, सपाट आणि नांगरायला-सिंचायला सोपी जमीन, आणि नदी-पाण्याचा स्थिर पुरवठा मिळून शेती समृद्ध करतात — म्हणून लोक तिथे सहस्रकांपासून मोठ्या संख्येने जमले",
          },
          {
            en: "The plains are rich only because they contain the most minerals and coal",
            hi: "मैदान समृद्ध केवल इसलिए कि उनमें सबसे अधिक खनिज और कोयला",
            mr: "मैदाने समृद्ध फक्त म्हणून की त्यांत सर्वांत अधिक खनिजे आणि कोळसा",
          },
          {
            en: "They are productive because they are the highest and coldest part of India",
            hi: "वे उत्पादक क्योंकि वे भारत का सबसे ऊँचा और ठंडा भाग",
            mr: "ती उत्पादक कारण ती भारताचा सर्वांत उंच आणि थंड भाग",
          },
          {
            en: "The plains grow crops without any soil, using only sand",
            hi: "मैदान बिना किसी मिट्टी के, केवल रेत से फ़सल उगाते",
            mr: "मैदाने कोणत्याही मातीविना, फक्त वाळूने पीक घेतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The plains' productivity is no accident of one feature but the meeting of three, all supplied by the great rivers. First, the soil: for thousands of years the Indus, Ganga and Brahmaputra and their tributaries have carried down fine silt from the mountains and spread it across the plains, building deep, fertile alluvial soil constantly refreshed by floods — among the best farmland on Earth. Second, the shape of the land: because that soil was laid down layer by layer as level deposits, the plains are almost perfectly flat, which makes them easy to plough, easy to cross with roads and canals, and easy to irrigate, since water can be led across gently sloping ground. Third, the water itself: the same perennial rivers that built the soil also supply it, so fields have a dependable source for irrigation through the year. Rich soil, flat ground and abundant water are exactly the conditions that let farmers grow large, reliable harvests, and where food is plentiful, dense human settlement follows. That is why this modest slice of India's area has been its agricultural heartland and its most crowded region for millennia, home to great cities and civilisations along the rivers. The minerals and coal that make the peninsular plateau valuable are a different kind of wealth entirely — the plains are prized for soil and water, not stone.",
          hi: "मैदानों की उत्पादकता एक विशेषता का संयोग नहीं बल्कि तीन का मिलन, सब महान नदियों द्वारा दिए। पहला, मिट्टी: हज़ारों वर्षों से सिंधु, गंगा और ब्रह्मपुत्र और उनकी सहायक नदियाँ पर्वतों से महीन गाद नीचे लातीं और मैदानों पर फैलातीं, गहरी, उपजाऊ जलोढ़ मिट्टी बनातीं बाढ़ों से निरंतर तरोताज़ा — पृथ्वी की सबसे अच्छी कृषि-भूमि में। दूसरा, भूमि का आकार: क्योंकि वह मिट्टी समतल जमाव के रूप में परत-दर-परत बिछी, मैदान लगभग पूर्णतः समतल, जो उन्हें जोतने में आसान, सड़कों-नहरों से पार करने में आसान, और सींचने में आसान बनाता, क्योंकि पानी हल्की ढलान वाली भूमि पर ले जाया जा सकता। तीसरा, पानी स्वयं: वही बारहमासी नदियाँ जो मिट्टी बनातीं उसे आपूर्ति भी करतीं, अतः खेतों को साल भर सिंचाई का भरोसेमंद स्रोत। समृद्ध मिट्टी, समतल भूमि और भरपूर पानी ठीक वे परिस्थितियाँ जो किसानों को बड़ी, भरोसेमंद फ़सलें उगाने देतीं, और जहाँ भोजन भरपूर, वहाँ घनी मानव-बस्ती चलती। इसी से भारत के क्षेत्रफल का यह मामूली टुकड़ा सहस्राब्दियों इसका कृषि-हृदय और सबसे भीड़-भरा क्षेत्र रहा, नदियों के किनारे महान नगरों-सभ्यताओं का घर। जो खनिज-कोयला प्रायद्वीपीय पठार को मूल्यवान बनाते वह बिलकुल भिन्न प्रकार का धन — मैदान मिट्टी-पानी को सराहे जाते, पत्थर को नहीं।",
          mr: "मैदानांची उत्पादकता एका वैशिष्ट्याचा योगायोग नव्हे तर तिघांचे मिलन, सारे महान नद्यांनी दिलेले. पहिले, माती: हजारो वर्षांपासून सिंधू, गंगा आणि ब्रह्मपुत्रा आणि त्यांच्या उपनद्या पर्वतांतून बारीक गाळ खाली आणतात आणि मैदानांवर पसरवतात, खोल, सुपीक गाळाची माती बनवत पुरांनी सतत टवटवीत — पृथ्वीवरील सर्वांत उत्तम शेतजमिनीत. दुसरे, जमिनीचा आकार: कारण ती माती सपाट साचांच्या रूपात थर-दर-थर अंथरली, मैदाने जवळपास पूर्णपणे सपाट, जे त्यांना नांगरायला सोपे, रस्ते-कालव्यांनी ओलांडायला सोपे, आणि सिंचायला सोपे बनवते, कारण पाणी सौम्य उताराच्या जमिनीवर नेता येते. तिसरे, पाणी स्वतः: तीच बारमाही नद्या ज्या माती बनवतात तिला पुरवठाही करतात, म्हणून शेतांना वर्षभर सिंचनाचा भरवशाचा स्रोत. समृद्ध माती, सपाट जमीन आणि भरपूर पाणी नेमक्या त्या परिस्थिती ज्या शेतकऱ्यांना मोठी, भरवशाची पिके घेऊ देतात, आणि जिथे अन्न भरपूर, तिथे दाट मानवी वस्ती चालते. म्हणूनच भारताच्या क्षेत्रफळाचा हा माफक तुकडा सहस्रकांपासून त्याचे कृषी-हृदय आणि सर्वांत गर्दीचा प्रदेश राहिला, नद्यांकाठी महान शहरे-संस्कृतींचे घर. जी खनिजे-कोळसा द्वीपकल्पीय पठाराला मौल्यवान बनवतात ते अगदी वेगळ्या प्रकारचे धन — मैदाने माती-पाण्यासाठी नावाजली जातात, दगडासाठी नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Geologists call the Himalayas 'young' mountains still rising, but the Peninsular Plateau one of the oldest and most stable landmasses on Earth. How can two parts of the same country differ so completely in age and behaviour?",
          hi: "भूवैज्ञानिक हिमालय को अब भी उठते 'युवा' पर्वत कहते, पर प्रायद्वीपीय पठार को पृथ्वी के सबसे पुराने और सबसे स्थिर भूभागों में। एक ही देश के दो भाग आयु और व्यवहार में इतने पूर्णतः भिन्न कैसे हो सकते?",
          mr: "भूवैज्ञानिक हिमालयाला अजून उठणारे 'तरुण' पर्वत म्हणतात, पण द्वीपकल्पीय पठाराला पृथ्वीवरील सर्वांत जुन्या आणि सर्वांत स्थिर भूभागांपैकी. एकाच देशाचे दोन भाग वय आणि वर्तनात इतके पूर्णपणे वेगळे कसे असू शकतात?",
        },
        choices: [
          {
            en: "The plateau is an ancient, rigid block of hard rock that has stayed stable for hundreds of millions of years; the Himalayas are young folds thrown up where the drifting Indian plate collided with Asia, and because that collision continues, the mountains are still being pushed higher and shaken by earthquakes",
            hi: "पठार कठोर चट्टान का प्राचीन, दृढ़ खंड है जो सैकड़ों करोड़ वर्षों से स्थिर रहा; हिमालय युवा मोड़ें हैं जहाँ बहती भारतीय प्लेट एशिया से टकराई, और क्योंकि वह टक्कर जारी, पर्वत अब भी ऊँचे धकेले और भूकंपों से हिलाए जा रहे",
            mr: "पठार कठीण खडकाचा प्राचीन, ताठर ठोकळा आहे जो शेकडो कोटी वर्षे स्थिर राहिला; हिमालय तरुण घड्या आहेत जिथे वाहणारा भारतीय भूपट्ट आशियाशी आदळला, आणि कारण ती टक्कर चालू, पर्वत अजून उंच ढकलले आणि भूकंपांनी हादरवले जात आहेत",
          },
          {
            en: "The Himalayas are young only because they were built recently by people",
            hi: "हिमालय युवा केवल इसलिए कि वे हाल में लोगों द्वारा बनाए गए",
            mr: "हिमालय तरुण फक्त म्हणून की ते अलीकडे लोकांनी बांधले",
          },
          {
            en: "The plateau is actually younger than the Himalayas but looks old",
            hi: "पठार वास्तव में हिमालय से युवा है पर पुराना दिखता",
            mr: "पठार खरे तर हिमालयाहून तरुण आहे पण जुने दिसते",
          },
          {
            en: "All mountains and plateaus on Earth are exactly the same age",
            hi: "पृथ्वी के सभी पर्वत और पठार ठीक एक ही आयु के",
            mr: "पृथ्वीवरील सर्व पर्वत आणि पठारे नेमकी एकाच वयाची",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The difference comes from how each landform was made, and whether the force that made it is still at work. The Peninsular Plateau is a piece of very old, hard crust — igneous and metamorphic rock formed hundreds of millions of years ago and long since cooled into a rigid, stable block. It was once part of an ancient supercontinent, and although it has been worn down and cracked over vast time, it has not been folded or thrust up by active mountain-building for ages; that is why it is a relatively level, quiet tableland, and why its rocks are so old and mineral-rich. The Himalayas are the exact opposite in origin. They are 'fold' mountains, created where two of Earth's great tectonic plates crumpled against each other. The Indian plate, carrying the peninsula, drifted north over millions of years and slammed into the Eurasian plate; the sediments and crust caught between them were squeezed and buckled upward into towering folds — a process that, geologically speaking, happened recently and, crucially, is not finished. The Indian plate is still pushing north, so the Himalayas are still being lifted higher and are seismically restless, which is why the region suffers frequent earthquakes. So 'young' and 'old' here are not about years of scenery but about geological history: the plateau is an ancient survivor that stopped changing long ago, while the Himalayas are a work still in progress, rising even as we watch. Same country, two utterly different chapters of the Earth's story.",
          hi: "अंतर इससे आता कि हर भू-आकृति कैसे बनी, और उसे बनाता बल अब भी काम पर है या नहीं। प्रायद्वीपीय पठार बहुत पुरानी, कठोर भू-पर्पटी का टुकड़ा — आग्नेय और कायांतरित चट्टान सैकड़ों करोड़ वर्ष पहले बनी और बहुत पहले दृढ़, स्थिर खंड में ठंडी। यह कभी एक प्राचीन महाद्वीप का भाग था, और यद्यपि विशाल समय में घिसा और चटका, इसे युगों से सक्रिय पर्वत-निर्माण से मुड़ा या ऊपर नहीं धकेला गया; इसी से यह अपेक्षाकृत समतल, शांत पठार, और इसकी चट्टानें इतनी पुरानी-खनिज-समृद्ध। हिमालय उद्गम में ठीक उल्टे। वे 'मोड़' पर्वत, जहाँ पृथ्वी की दो महान विवर्तनिक प्लेटें एक-दूसरे पर सिकुड़ीं। भारतीय प्लेट, प्रायद्वीप ढोती, करोड़ों वर्षों में उत्तर बही और यूरेशियाई प्लेट से टकराई; उनके बीच फँसी तलछट और पर्पटी दबकर ऊपर ऊँची मोड़ों में मुड़ी — प्रक्रिया जो, भूवैज्ञानिक रूप से, हाल में हुई और, मुख्यतः, समाप्त नहीं। भारतीय प्लेट अब भी उत्तर धकेल रही, अतः हिमालय अब भी ऊँचे उठाए जा रहे और भूकंपीय रूप से बेचैन, इसी से क्षेत्र बार-बार भूकंप झेलता। अतः 'युवा' और 'पुराना' यहाँ दृश्य के वर्षों का नहीं बल्कि भूवैज्ञानिक इतिहास का: पठार एक प्राचीन उत्तरजीवी जो बहुत पहले बदलना बंद कर गया, जबकि हिमालय अब भी प्रगति पर काम, हमारे देखते भी उठते। एक ही देश, पृथ्वी की कहानी के दो नितांत भिन्न अध्याय।",
          mr: "फरक यातून येतो की प्रत्येक भू-आकृती कशी बनली, आणि तिला बनवणारे बल अजून कामावर आहे की नाही. द्वीपकल्पीय पठार फार जुन्या, कठीण कवचाचा तुकडा — अग्निजन्य आणि रूपांतरित खडक शेकडो कोटी वर्षांपूर्वी बनलेला आणि फार पूर्वी ताठर, स्थिर ठोकळ्यात थंड. तो कधीकाळी एका प्राचीन महाखंडाचा भाग होता, आणि जरी प्रचंड काळात झिजला आणि तडकला, त्याला युगांपासून सक्रिय पर्वत-निर्मितीने घडवले वा वर ढकलले गेले नाही; म्हणूनच तो तुलनेने सपाट, शांत पठार, आणि त्याचे खडक इतके जुने-खनिज-समृद्ध. हिमालय उगमात नेमके उलट. ते 'घडी' पर्वत, जिथे पृथ्वीचे दोन महान भूपट्ट एकमेकांवर चुरगळले. भारतीय भूपट्ट, द्वीपकल्प वाहत, कोट्यवधी वर्षांत उत्तरेला वाहला आणि युरेशियन भूपट्टाशी आदळला; त्यांच्यामध्ये अडकलेला गाळ आणि कवच दाबून वर उंच घड्यांत घडले — प्रक्रिया जी, भूवैज्ञानिकदृष्ट्या, अलीकडे घडली आणि, मुख्यतः, संपलेली नाही. भारतीय भूपट्ट अजून उत्तरेला ढकलत आहे, म्हणून हिमालय अजून उंच उचलले जात आहेत आणि भूकंपीयदृष्ट्या अस्वस्थ, म्हणूनच प्रदेश वारंवार भूकंप सोसतो. म्हणून 'तरुण' आणि 'जुने' इथे देखाव्याच्या वर्षांचे नव्हे तर भूवैज्ञानिक इतिहासाचे: पठार एक प्राचीन वाचलेला जो फार पूर्वी बदलणे थांबला, तर हिमालय अजून प्रगतीवरचे काम, आपण पाहतानाही उठणारे. एकच देश, पृथ्वीच्या कथेचे दोन अगदी वेगळे अध्याय.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Drainage (the rivers and how they run)                     */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-9-drainage",
    subject: "GEOGRAPHY",
    classLevel: 9,
    chapter: {
      en: "Chapter 3 — Drainage",
      hi: "अध्याय 3 — अपवाह",
      mr: "प्रकरण 3 — जलनिस्सारण",
    },
    name: {
      en: "Drainage",
      hi: "अपवाह",
      mr: "जलनिस्सारण",
    },
    summary: {
      en: "How India sheds its water: land parcelled into river basins by ridges of high ground, snow-fed Himalayan rivers that run all year and carve deep gorges, rain-fed peninsular rivers that swell and shrink with the monsoon, two rivers that run west through cracks in the plateau, and lakes each made a different way.",
      hi: "भारत अपना पानी कैसे बहाता: ऊँची भूमि की मेड़ों से नदी-द्रोणियों में बँटी भूमि, हिमपोषित हिमालयी नदियाँ जो साल भर बहतीं और गहरे महाखड्ड काटतीं, वर्षापोषित प्रायद्वीपीय नदियाँ जो मानसून से फूलतीं-सिकुड़तीं, दो नदियाँ जो पठार की दरारों से पश्चिम बहतीं, और हर एक भिन्न तरीक़े से बनी झीलें।",
      mr: "भारत आपले पाणी कसे वाहवतो: उंच जमिनीच्या मेढांनी नदी-खोऱ्यांत विभागलेली जमीन, हिमपोषित हिमालयी नद्या ज्या वर्षभर वाहतात आणि खोल घळई कोरतात, पावसाळी द्वीपकल्पीय नद्या ज्या मान्सूनने फुगतात-आकुंचतात, दोन नद्या ज्या पठाराच्या भेगांतून पश्चिमेला वाहतात, आणि प्रत्येक वेगळ्या रीतीने बनलेली तळी.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "drainage-basin",
        name: {
          en: "Drainage basin and water divide",
          hi: "अपवाह द्रोणी और जल विभाजक",
          mr: "जलनिस्सारण खोरे आणि जलविभाजक",
        },
        kind: "idea",
        prompt: {
          en: "All the land whose rain and streams drain into one river makes up its territory, and a ridge of high ground separates that territory from the next river's. What are these two ideas called?",
          hi: "वह सारी भूमि जिसकी वर्षा और धाराएँ एक नदी में बहतीं उसका क्षेत्र बनातीं, और ऊँची भूमि की एक मेड़ उस क्षेत्र को अगली नदी के से अलग करती। इन दो विचारों को क्या कहते?",
          mr: "जी सारी जमीन जिचा पाऊस आणि प्रवाह एका नदीत वाहतात तिचा प्रदेश बनवते, आणि उंच जमिनीची एक मेढ तो प्रदेश पुढच्या नदीच्या प्रदेशापासून वेगळा करते. या दोन कल्पनांना काय म्हणतात?",
        },
        statement: {
          en: "A drainage basin is all the area drained by a single river and its tributaries, and the water divide is the ridge of higher land that separates one basin from the next.",
          hi: "अपवाह द्रोणी वह पूरा क्षेत्र जो एक नदी और उसकी सहायक नदियों द्वारा बहाया जाता, और जल विभाजक ऊँची भूमि की वह मेड़ जो एक द्रोणी को अगली से अलग करती।",
          mr: "जलनिस्सारण खोरे तो संपूर्ण प्रदेश जो एका नदीने आणि तिच्या उपनद्यांनी वाहवला जातो, आणि जलविभाजक उंच जमिनीची ती मेढ जी एका खोऱ्याला पुढच्यापासून वेगळे करते.",
        },
        detail: {
          en: "Rain falling on one side of a water divide runs into one river; rain a few steps over the ridge runs into a different river altogether.",
          hi: "जल विभाजक के एक ओर गिरती वर्षा एक नदी में बहती; मेड़ से कुछ क़दम पार की वर्षा बिलकुल भिन्न नदी में।",
          mr: "जलविभाजकाच्या एका बाजूला पडणारा पाऊस एका नदीत वाहतो; मेढेच्या काही पावले पलीकडचा पाऊस अगदी वेगळ्या नदीत.",
        },
        extra: {
          en: "India's rivers fall into two great families by where they collect and drain — those flowing to the Arabian Sea and those flowing to the Bay of Bengal.",
          hi: "भारत की नदियाँ जहाँ जमा और बहती उससे दो बड़े कुलों में — अरब सागर की ओर बहतीं और बंगाल की खाड़ी की ओर बहतीं।",
          mr: "भारताच्या नद्या कुठे जमतात आणि वाहतात यावरून दोन मोठ्या कुळांत — अरबी समुद्राकडे वाहणाऱ्या आणि बंगालच्या उपसागराकडे वाहणाऱ्या.",
        },
        pair: {
          left: {
            en: "A ridge parting one river's land from the next",
            hi: "एक नदी की भूमि को अगली से बाँटती मेड़",
            mr: "एका नदीची जमीन पुढच्यापासून वेगळी करणारी मेढ",
          },
          right: {
            en: "the water divide",
            hi: "जल विभाजक",
            mr: "जलविभाजक",
          },
        },
      },
      {
        id: "himalayan-rivers",
        name: {
          en: "The Himalayan rivers",
          hi: "हिमालयी नदियाँ",
          mr: "हिमालयी नद्या",
        },
        kind: "river-system",
        prompt: {
          en: "The Indus, Ganga and Brahmaputra rise among the snows, so they carry water even in the dry months, and their long courses wind across the plains in great loops. Which river family is this?",
          hi: "सिंधु, गंगा और ब्रह्मपुत्र हिमपात के बीच निकलतीं, अतः वे शुष्क महीनों में भी पानी ढोतीं, और उनके लंबे मार्ग मैदानों में बड़े लूपों में बल खातीं। यह कौन-सा नदी-कुल है?",
          mr: "सिंधू, गंगा आणि ब्रह्मपुत्रा बर्फांमधून निघतात, म्हणून त्या कोरड्या महिन्यांतही पाणी वाहतात, आणि त्यांचे लांब मार्ग मैदानांत मोठ्या वळणांत वळतात. हे कोणते नदी-कुळ?",
        },
        statement: {
          en: "The Himalayan rivers — Indus, Ganga and Brahmaputra — are fed by both snowmelt and rain, so they are perennial, flowing all year, with long meandering courses that build large deltas.",
          hi: "हिमालयी नदियाँ — सिंधु, गंगा और ब्रह्मपुत्र — हिम-पिघलन और वर्षा दोनों से पोषित, अतः बारहमासी, साल भर बहतीं, लंबे बल खाते मार्ग जो बड़े डेल्टा बनाते।",
          mr: "हिमालयी नद्या — सिंधू, गंगा आणि ब्रह्मपुत्रा — हिम-वितळणे आणि पाऊस दोन्हींनी पोषित, म्हणून बारमाही, वर्षभर वाहणाऱ्या, लांब वळणदार मार्ग जे मोठे त्रिभुज बनवतात.",
        },
        detail: {
          en: "In the mountains they cut deep gorges; on the plains they slow, swing in wide loops called meanders, and drop their silt to build broad, fertile deltas at the sea.",
          hi: "पर्वतों में वे गहरे महाखड्ड काटतीं; मैदानों में वे धीमी होतीं, विसर्प कहलाते चौड़े लूपों में झूलतीं, और अपनी गाद गिराकर समुद्र पर चौड़े, उपजाऊ डेल्टा बनातीं।",
          mr: "पर्वतांत त्या खोल घळई कोरतात; मैदानांत त्या मंदावतात, विसर्प म्हणतात अशा रुंद वळणांत झुलतात, आणि आपला गाळ टाकून समुद्रावर रुंद, सुपीक त्रिभुज बनवतात.",
        },
        extra: {
          en: "The Ganga and Brahmaputra together build the world's largest delta, the Sundarbans, where they meet the Bay of Bengal.",
          hi: "गंगा और ब्रह्मपुत्र मिलकर दुनिया का सबसे बड़ा डेल्टा, सुंदरबन, बनातीं, जहाँ वे बंगाल की खाड़ी से मिलतीं।",
          mr: "गंगा आणि ब्रह्मपुत्रा मिळून जगातील सर्वांत मोठा त्रिभुज, सुंदरबन, बनवतात, जिथे त्या बंगालच्या उपसागराशी भेटतात.",
        },
        pair: {
          left: {
            en: "Snow-fed, perennial, building great deltas",
            hi: "हिमपोषित, बारहमासी, बड़े डेल्टा बनातीं",
            mr: "हिमपोषित, बारमाही, मोठे त्रिभुज बनवणाऱ्या",
          },
          right: {
            en: "the Himalayan rivers",
            hi: "हिमालयी नदियाँ",
            mr: "हिमालयी नद्या",
          },
        },
      },
      {
        id: "peninsular-rivers",
        name: {
          en: "The Peninsular rivers",
          hi: "प्रायद्वीपीय नदियाँ",
          mr: "द्वीपकल्पीय नद्या",
        },
        kind: "river-system",
        prompt: {
          en: "Rivers like the Godavari and Krishna depend on the rains alone, so they run full in the monsoon and shrink to a trickle in the dry season, along fixed, shallow courses. Which river family is this?",
          hi: "गोदावरी और कृष्णा जैसी नदियाँ केवल वर्षा पर निर्भर, अतः मानसून में भरी बहतीं और शुष्क ऋतु में धार-भर सिकुड़तीं, नियत, उथले मार्गों पर। यह कौन-सा नदी-कुल है?",
          mr: "गोदावरी आणि कृष्णासारख्या नद्या फक्त पावसावर अवलंबून, म्हणून मान्सूनमध्ये भरून वाहतात आणि कोरड्या ऋतूत ओहोळभर आकुंचतात, ठराविक, उथळ मार्गांवर. हे कोणते नदी-कुळ?",
        },
        statement: {
          en: "The Peninsular rivers, such as the Godavari and Krishna, are fed by rain alone, so they are seasonal — full in the monsoon and shrunken in the dry months — running in fixed, shallow valleys.",
          hi: "प्रायद्वीपीय नदियाँ, जैसे गोदावरी और कृष्णा, केवल वर्षा से पोषित, अतः मौसमी — मानसून में भरी और शुष्क महीनों में सिकुड़ी — नियत, उथली घाटियों में बहतीं।",
          mr: "द्वीपकल्पीय नद्या, जसे गोदावरी आणि कृष्णा, फक्त पावसाने पोषित, म्हणून हंगामी — मान्सूनमध्ये भरलेल्या आणि कोरड्या महिन्यांत आकुंचलेल्या — ठराविक, उथळ खोऱ्यांत वाहणाऱ्या.",
        },
        detail: {
          en: "The Godavari is the largest of them, so long and wide it is called the Dakshin Ganga, the Ganga of the South.",
          hi: "गोदावरी इनमें सबसे बड़ी, इतनी लंबी-चौड़ी कि दक्षिण गंगा कहलाती।",
          mr: "गोदावरी यांतील सर्वांत मोठी, इतकी लांब-रुंद की दक्षिण गंगा म्हणतात.",
        },
        extra: {
          en: "Because they run over hard old rock, their courses are fixed and they barely meander, unlike the wandering Himalayan rivers on soft silt.",
          hi: "क्योंकि वे कठोर पुरानी चट्टान पर बहतीं, उनके मार्ग नियत और वे मुश्किल से बल खातीं, नरम गाद पर भटकती हिमालयी नदियों के विपरीत।",
          mr: "कारण त्या कठीण जुन्या खडकावर वाहतात, त्यांचे मार्ग ठराविक आणि त्या जेमतेम वळतात, मऊ गाळावर भटकणाऱ्या हिमालयी नद्यांविरुद्ध.",
        },
        pair: {
          left: {
            en: "Rain-fed, seasonal, in fixed valleys",
            hi: "वर्षापोषित, मौसमी, नियत घाटियों में",
            mr: "पावसाळी, हंगामी, ठराविक खोऱ्यांत",
          },
          right: {
            en: "the Peninsular rivers",
            hi: "प्रायद्वीपीय नदियाँ",
            mr: "द्वीपकल्पीय नद्या",
          },
        },
      },
      {
        id: "west-flowing-rift",
        name: {
          en: "The west-flowing rift rivers",
          hi: "पश्चिम-बहती भ्रंश नदियाँ",
          mr: "पश्चिम-वाहणाऱ्या भेग नद्या",
        },
        kind: "river-system",
        prompt: {
          en: "While most peninsular rivers flow east to the Bay of Bengal, the Narmada and Tapi run the opposite way, west into the Arabian Sea, down long cracks in the plateau. What are these unusual rivers called?",
          hi: "जबकि अधिकांश प्रायद्वीपीय नदियाँ पूर्व बंगाल की खाड़ी बहतीं, नर्मदा और तापी उल्टी दिशा, पश्चिम अरब सागर, पठार की लंबी दरारों से नीचे बहतीं। इन असामान्य नदियों को क्या कहते?",
          mr: "बहुतांश द्वीपकल्पीय नद्या पूर्वेला बंगालच्या उपसागरात वाहतात, तर नर्मदा आणि तापी उलट दिशेने, पश्चिमेला अरबी समुद्रात, पठाराच्या लांब भेगांतून खाली वाहतात. या असामान्य नद्यांना काय म्हणतात?",
        },
        statement: {
          en: "The Narmada and Tapi are west-flowing peninsular rivers that run through rift valleys — long troughs cracked into the plateau — into the Arabian Sea, forming estuaries rather than deltas.",
          hi: "नर्मदा और तापी पश्चिम-बहती प्रायद्वीपीय नदियाँ हैं जो भ्रंश घाटियों — पठार में दरकी लंबी द्रोणियों — से होकर अरब सागर में बहतीं, डेल्टा के बजाय ज्वारनदमुख बनातीं।",
          mr: "नर्मदा आणि तापी पश्चिम-वाहणाऱ्या द्वीपकल्पीय नद्या आहेत ज्या भेग-खोऱ्यांतून — पठारात तडकलेल्या लांब द्रोणींतून — अरबी समुद्रात वाहतात, त्रिभुजाऐवजी खाडीमुख बनवतात.",
        },
        detail: {
          en: "A rift valley is a trough where a block of land has slipped down between two faults, and these rivers simply follow that ready-made trough to the sea.",
          hi: "भ्रंश घाटी एक द्रोणी जहाँ भूमि का एक खंड दो भ्रंशों के बीच नीचे खिसका, और ये नदियाँ बस उस तैयार द्रोणी का पीछा समुद्र तक करतीं।",
          mr: "भेग-खोरे एक द्रोणी जिथे जमिनीचा एक ठोकळा दोन भेगांमध्ये खाली सरकला, आणि या नद्या फक्त त्या तयार द्रोणीचा पाठलाग समुद्रापर्यंत करतात.",
        },
        extra: {
          en: "Because they rush down a steep trough straight to the sea, they carry their silt out rather than spreading it, so they end in estuaries, not fertile deltas.",
          hi: "क्योंकि वे खड़ी द्रोणी से सीधे समुद्र दौड़तीं, वे अपनी गाद फैलाने के बजाय बाहर ले जातीं, अतः वे ज्वारनदमुख में समाप्त, उपजाऊ डेल्टा में नहीं।",
          mr: "कारण त्या तीव्र द्रोणीतून सरळ समुद्राकडे धावतात, त्या आपला गाळ पसरवण्याऐवजी बाहेर नेतात, म्हणून त्या खाडीमुखात संपतात, सुपीक त्रिभुजात नाही.",
        },
        pair: {
          left: {
            en: "Running west down plateau cracks to the sea",
            hi: "पठार की दरारों से पश्चिम समुद्र बहतीं",
            mr: "पठाराच्या भेगांतून पश्चिमेला समुद्राकडे वाहणाऱ्या",
          },
          right: {
            en: "the west-flowing rift rivers",
            hi: "पश्चिम-बहती भ्रंश नदियाँ",
            mr: "पश्चिम-वाहणाऱ्या भेग नद्या",
          },
        },
      },
      {
        id: "lakes",
        name: { en: "Lakes", hi: "झीलें", mr: "सरोवरे" },
        kind: "waterbody",
        prompt: {
          en: "Standing bodies of water dot the land, some cut off from the sea by sand bars, some left in tectonic hollows, some dammed by people. What is the general name for these still waters?",
          hi: "खड़े जल के पिंड भूमि पर बिखरे, कुछ रेत की मेड़ों से समुद्र से कटे, कुछ विवर्तनिक गड्ढों में छूटे, कुछ लोगों द्वारा बाँधे। इन स्थिर जलों का सामान्य नाम क्या?",
          mr: "उभ्या पाण्याचे पिंड जमिनीवर विखुरलेले, काही वाळूच्या मेढांनी समुद्रापासून कापलेले, काही भूपट्ट-खड्ड्यांत उरलेले, काही लोकांनी बांधलेले. या स्थिर पाण्यांचे सामान्य नाव काय?",
        },
        statement: {
          en: "Lakes are standing bodies of inland water formed in many ways — lagoons cut off by coastal sand bars, hollows left by tectonic movement, ox-bow loops abandoned by rivers, or reservoirs dammed by people.",
          hi: "झीलें अंतर्देशीय स्थिर जल के पिंड जो कई तरह बनते — तटीय रेत-मेड़ों से कटे लैगून, विवर्तनिक हलचल से छूटे गड्ढे, नदियों द्वारा छोड़े गोखुर लूप, या लोगों द्वारा बाँधे जलाशय।",
          mr: "सरोवरे अंतर्देशीय स्थिर पाण्याचे पिंड जे अनेक प्रकारे बनतात — किनारी वाळू-मेढांनी कापलेले खाजण, भूपट्ट-हालचालीने उरलेले खड्डे, नद्यांनी सोडलेले गोखूर वळण, किंवा लोकांनी बांधलेले जलाशय.",
        },
        detail: {
          en: "Chilika, on the east coast, is a great lagoon held back from the sea by a bar of sand; Wular in Kashmir sits in a hollow left by earth movements.",
          hi: "चिल्का, पूर्वी तट पर, रेत की मेड़ से समुद्र से रोका बड़ा लैगून; कश्मीर में वुलर भू-हलचलों से छूटे गड्ढे में।",
          mr: "चिल्का, पूर्व किनाऱ्यावर, वाळूच्या मेढेने समुद्रापासून अडवलेला मोठा खाजण; काश्मीरमधील वुलर भू-हालचालींनी उरलेल्या खड्ड्यात.",
        },
        extra: {
          en: "Lakes are useful beyond beauty — they even out a river's flow, store water for the dry season, and support fish and birds.",
          hi: "झीलें सुंदरता से परे उपयोगी — वे नदी का बहाव सम करतीं, शुष्क ऋतु को पानी भंडारतीं, और मछली-पक्षी पालतीं।",
          mr: "सरोवरे सौंदर्यापलीकडे उपयुक्त — ती नदीचा प्रवाह समान करतात, कोरड्या ऋतूला पाणी साठवतात, आणि मासे-पक्षी पोसतात.",
        },
        pair: {
          left: {
            en: "Still inland water made many ways",
            hi: "कई तरह बना अंतर्देशीय स्थिर जल",
            mr: "अनेक प्रकारे बनलेले अंतर्देशीय स्थिर पाणी",
          },
          right: {
            en: "lakes",
            hi: "झीलें",
            mr: "सरोवरे",
          },
        },
      },
      {
        id: "river-value-pollution",
        name: {
          en: "Rivers' value and pollution",
          hi: "नदियों का मूल्य और प्रदूषण",
          mr: "नद्यांचे मूल्य आणि प्रदूषण",
        },
        kind: "idea",
        prompt: {
          en: "Rivers water the fields, drive turbines, carry boats and sustain cities — yet those same cities pour sewage and waste into them until the water sickens. What twin truth about rivers does this capture?",
          hi: "नदियाँ खेत सींचतीं, टरबाइन चलातीं, नाव ढोतीं और नगर पालतीं — फिर भी वही नगर उनमें मल-कचरा उँड़ेलते जब तक पानी बीमार न पड़े। नदियों के बारे में यह कौन-सा दोहरा सत्य पकड़ता?",
          mr: "नद्या शेते सिंचतात, टर्बाइन चालवतात, नावा वाहतात आणि शहरे पोसतात — तरी तीच शहरे त्यांत सांडपाणी-कचरा ओततात जोवर पाणी आजारी पडत नाही. नद्यांबद्दल हे कोणते जुळे सत्य पकडते?",
        },
        statement: {
          en: "Rivers are a lifeline — for drinking water, irrigation, hydro-power and transport — yet dumping sewage, industrial waste and chemicals into them has left many badly polluted and in need of cleaning.",
          hi: "नदियाँ जीवन-रेखा — पेय जल, सिंचाई, जल-विद्युत और परिवहन को — फिर भी उनमें मल, औद्योगिक कचरा और रसायन डालने ने अनेक को बुरी तरह प्रदूषित और सफ़ाई की ज़रूरत में छोड़ा।",
          mr: "नद्या जीवनरेखा — पिण्याचे पाणी, सिंचन, जल-विद्युत आणि वाहतुकीसाठी — तरी त्यांत सांडपाणी, औद्योगिक कचरा आणि रसायने टाकल्याने अनेक वाईट रीतीने प्रदूषित आणि स्वच्छतेच्या गरजेत सोडल्या.",
        },
        detail: {
          en: "As towns and industries grew along their banks, the volume of untreated waste outran the rivers' power to clean themselves, and the water quality fell.",
          hi: "जैसे नगर और उद्योग उनके किनारे बढ़े, अनुपचारित कचरे की मात्रा नदियों की स्वयं-सफ़ाई की शक्ति से आगे निकली, और जल-गुणवत्ता गिरी।",
          mr: "जसे शहरे आणि उद्योग त्यांच्या काठी वाढले, अशुद्ध कचऱ्याचे प्रमाण नद्यांच्या स्वतःला स्वच्छ करण्याच्या शक्तीहून पुढे गेले, आणि पाणी-गुणवत्ता घसरली.",
        },
        extra: {
          en: "This is why India runs river-cleaning missions, like Namami Gange for the Ganga — an attempt to repay a river that has given so much.",
          hi: "इसी से भारत नदी-सफ़ाई अभियान चलाता, जैसे गंगा को नमामि गंगे — इतना देती नदी को लौटाने का प्रयास।",
          mr: "म्हणूनच भारत नदी-स्वच्छता मोहिमा चालवतो, जसे गंगेला नमामि गंगे — इतके देणाऱ्या नदीला परत करण्याचा प्रयत्न.",
        },
        pair: {
          left: {
            en: "A lifeline, yet sickened by the waste we dump",
            hi: "जीवन-रेखा, फिर भी डाले कचरे से बीमार",
            mr: "जीवनरेखा, तरी टाकलेल्या कचऱ्याने आजारी",
          },
          right: {
            en: "rivers' value and pollution",
            hi: "नदियों का मूल्य और प्रदूषण",
            mr: "नद्यांचे मूल्य आणि प्रदूषण",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "The Ganga in the plains still carries plenty of water in May, at the height of the dry season, while the Godavari in the peninsula can shrink to a thin trickle at the same time of year. Both are great rivers — why does one stay full and the other run dry?",
          hi: "मैदानों में गंगा मई में, शुष्क ऋतु के चरम पर, अब भी भरपूर पानी ढोती, जबकि प्रायद्वीप में गोदावरी वर्ष के उसी समय पतली धार तक सिकुड़ सकती। दोनों महान नदियाँ — एक भरी क्यों रहती और दूसरी सूख जाती?",
          mr: "मैदानांत गंगा मे मध्ये, कोरड्या ऋतूच्या शिखरावर, अजून भरपूर पाणी वाहते, तर द्वीपकल्पात गोदावरी वर्षाच्या त्याच वेळी पातळ ओहोळापर्यंत आकुंचू शकते. दोन्ही महान नद्या — एक भरलेली का राहते आणि दुसरी कोरडी पडते?",
        },
        choices: [
          {
            en: "The Ganga is a Himalayan river fed by melting snow as well as rain, so even when the monsoon is long gone the summer snowmelt keeps it flowing; the Godavari is a peninsular river fed by rain alone, so once the monsoon ends it has no second source and dwindles",
            hi: "गंगा हिमालयी नदी है जो पिघलती बर्फ़ के साथ वर्षा से भी पोषित, अतः मानसून बहुत पहले जाने पर भी ग्रीष्म की हिम-पिघलन इसे बहती रखती; गोदावरी प्रायद्वीपीय नदी केवल वर्षा से पोषित, अतः मानसून समाप्त होते इसके पास दूसरा स्रोत नहीं और घटती",
            mr: "गंगा हिमालयी नदी आहे जी वितळणाऱ्या बर्फासह पावसानेही पोषित, म्हणून मान्सून खूप आधी गेला तरी उन्हाळ्याची हिम-वितळण तिला वाहती ठेवते; गोदावरी द्वीपकल्पीय नदी फक्त पावसाने पोषित, म्हणून मान्सून संपताच तिच्याकडे दुसरा स्रोत नाही आणि घटते",
          },
          {
            en: "The Ganga is simply a wider river, so it never loses water",
            hi: "गंगा बस चौड़ी नदी है, अतः वह कभी पानी नहीं खोती",
            mr: "गंगा फक्त रुंद नदी आहे, म्हणून ती कधी पाणी गमावत नाही",
          },
          {
            en: "The Godavari flows uphill in summer, which drains it",
            hi: "गोदावरी ग्रीष्म में चढ़ाई पर बहती, जो इसे रीता करता",
            mr: "गोदावरी उन्हाळ्यात चढावर वाहते, जे तिला रिते करते",
          },
          {
            en: "The Ganga receives no rain at all, unlike the Godavari",
            hi: "गंगा को गोदावरी के विपरीत बिलकुल वर्षा नहीं मिलती",
            mr: "गंगेला गोदावरीविरुद्ध मुळीच पाऊस मिळत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The difference is in each river's source of water, and it is the deciding fact between the two families. The Ganga is a Himalayan river, and the Himalayas give it two taps, not one. In the rainy months the monsoon fills it, like any river; but its headwaters lie among permanent snowfields and glaciers, and through the hot dry season that snow and ice melt and feed the river steadily. So even in May, with the last monsoon long past, the Ganga has a second, independent supply keeping it 'perennial' — flowing all year round. The Godavari, for all its size, is a peninsular river rising in the low hills of the plateau, far from any snow. It has only one tap: the monsoon rain. While the rains fall it can be mighty, but once the monsoon withdraws there is nothing to replace that water, and through the long dry season it thins out, sometimes to a shallow trickle — it is a 'seasonal' river. This single contrast — a snow-and-rain source versus a rain-only source — is why India's rivers split into two great groups, and why the Himalayan rivers can support year-round irrigation and navigation in a way the peninsular rivers cannot without dams to store their monsoon flood for later.",
          hi: "अंतर हर नदी के जल-स्रोत में, और यही दो कुलों के बीच निर्णायक तथ्य। गंगा हिमालयी नदी, और हिमालय उसे दो नल देता, एक नहीं। बरसाती महीनों में मानसून इसे भरता, किसी भी नदी की तरह; पर इसके शीर्ष-जल स्थायी हिमक्षेत्रों और हिमनदों के बीच, और गरम शुष्क ऋतु भर वह बर्फ़-हिम पिघलकर नदी को लगातार पोषते। अतः मई में भी, अंतिम मानसून बहुत बीते, गंगा के पास दूसरी, स्वतंत्र आपूर्ति इसे 'बारहमासी' रखती — साल भर बहती। गोदावरी, अपने आकार के बावजूद, प्रायद्वीपीय नदी पठार की निचली पहाड़ियों में निकलती, किसी बर्फ़ से दूर। इसके पास केवल एक नल: मानसून वर्षा। जब तक वर्षा गिरती यह प्रबल हो सकती, पर मानसून हटते उस पानी को बदलने को कुछ नहीं, और लंबी शुष्क ऋतु भर यह पतली होती, कभी उथली धार तक — यह 'मौसमी' नदी। यही एक विरोध — हिम-और-वर्षा स्रोत बनाम केवल-वर्षा स्रोत — कारण कि भारत की नदियाँ दो बड़े समूहों में बँटतीं, और कि हिमालयी नदियाँ साल भर सिंचाई और नौवहन सहार सकतीं जैसे प्रायद्वीपीय नदियाँ बिना बाँधों के, जो उनकी मानसून बाढ़ बाद को भंडारें, नहीं कर सकतीं।",
          mr: "फरक प्रत्येक नदीच्या पाणी-स्रोतात, आणि हेच दोन कुळांमधील निर्णायक तथ्य. गंगा हिमालयी नदी, आणि हिमालय तिला दोन नळ देतो, एक नाही. पावसाळी महिन्यांत मान्सून तिला भरतो, कोणत्याही नदीसारखा; पण तिचे उगम-पाणी कायम बर्फक्षेत्रे आणि हिमनद्यांमध्ये, आणि गरम कोरड्या ऋतूभर ते बर्फ-हिम वितळून नदीला सतत पोसते. म्हणून मे मध्येही, शेवटचा मान्सून खूप उलटून, गंगेकडे दुसरा, स्वतंत्र पुरवठा तिला 'बारमाही' ठेवतो — वर्षभर वाहती. गोदावरी, आपल्या आकारानंतरही, द्वीपकल्पीय नदी पठाराच्या सखल टेकड्यांत उगवते, कोणत्याही बर्फापासून दूर. तिच्याकडे फक्त एक नळ: मान्सून पाऊस. पाऊस पडेपर्यंत ती प्रचंड असू शकते, पण मान्सून मागे हटताच ते पाणी बदलायला काही नाही, आणि लांब कोरड्या ऋतूभर ती पातळ होते, कधी उथळ ओहोळापर्यंत — ती 'हंगामी' नदी. हाच एक विरोध — बर्फ-आणि-पाऊस स्रोत विरुद्ध फक्त-पाऊस स्रोत — कारण की भारताच्या नद्या दोन मोठ्या समूहांत विभागतात, आणि की हिमालयी नद्या वर्षभर सिंचन आणि जलवाहतूक सोसू शकतात जसे द्वीपकल्पीय नद्या धरणांविना, जी त्यांचा मान्सून पूर नंतरसाठी साठवतील, करू शकत नाहीत.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Almost all the big peninsular rivers — Godavari, Krishna, Kaveri — flow east across the plateau and build deltas as they enter the Bay of Bengal. But the Narmada and Tapi flow the opposite way, west into the Arabian Sea, and end not in deltas but in estuaries. What explains this odd pair?",
          hi: "लगभग सभी बड़ी प्रायद्वीपीय नदियाँ — गोदावरी, कृष्णा, कावेरी — पठार के आर-पार पूर्व बहतीं और बंगाल की खाड़ी में प्रवेश करते डेल्टा बनातीं। पर नर्मदा और तापी उल्टी दिशा, पश्चिम अरब सागर, बहतीं और डेल्टा में नहीं बल्कि ज्वारनदमुख में समाप्त। इस विचित्र जोड़ी को क्या समझाता?",
          mr: "जवळपास सर्व मोठ्या द्वीपकल्पीय नद्या — गोदावरी, कृष्णा, कावेरी — पठाराच्या आरपार पूर्वेला वाहतात आणि बंगालच्या उपसागरात प्रवेश करताना त्रिभुज बनवतात. पण नर्मदा आणि तापी उलट दिशेने, पश्चिमेला अरबी समुद्रात, वाहतात आणि त्रिभुजात नाही तर खाडीमुखात संपतात. या विचित्र जोडीला काय समजावते?",
        },
        choices: [
          {
            en: "The plateau tilts generally toward the east, so most of its rivers flow that way and deposit silt into deltas; but the Narmada and Tapi run west along rift valleys — steep down-dropped troughs between faults — which carry them and their silt straight out to sea, forming estuaries instead of deltas",
            hi: "पठार सामान्यतः पूर्व की ओर झुका, अतः इसकी अधिकांश नदियाँ उधर बहतीं और गाद डेल्टा में जमातीं; पर नर्मदा और तापी भ्रंश घाटियों — भ्रंशों के बीच खड़ी नीचे-खिसकी द्रोणियों — के साथ पश्चिम बहतीं, जो उन्हें और उनकी गाद सीधे समुद्र ले जातीं, डेल्टा के बजाय ज्वारनदमुख बनातीं",
            mr: "पठार सामान्यतः पूर्वेकडे कललेले, म्हणून त्याच्या बहुतांश नद्या तिकडे वाहतात आणि गाळ त्रिभुजांत साचवतात; पण नर्मदा आणि तापी भेग-खोऱ्यांतून — भेगांमध्ये तीव्र खाली-सरकलेल्या द्रोणींतून — पश्चिमेला वाहतात, ज्या त्यांना आणि त्यांचा गाळ सरळ समुद्रात नेतात, त्रिभुजाऐवजी खाडीमुख बनवत",
          },
          {
            en: "The Narmada and Tapi flow west because they are Himalayan rivers, not peninsular",
            hi: "नर्मदा और तापी पश्चिम बहतीं क्योंकि वे हिमालयी नदियाँ हैं, प्रायद्वीपीय नहीं",
            mr: "नर्मदा आणि तापी पश्चिमेला वाहतात कारण त्या हिमालयी नद्या आहेत, द्वीपकल्पीय नाही",
          },
          {
            en: "All peninsular rivers actually flow west; the eastern ones are a myth",
            hi: "सभी प्रायद्वीपीय नदियाँ वास्तव में पश्चिम बहतीं; पूर्वी एक मिथक",
            mr: "सर्व द्वीपकल्पीय नद्या खरे तर पश्चिमेला वाहतात; पूर्वेकडच्या एक कल्पित",
          },
          {
            en: "They form estuaries because the Arabian Sea has no room for deltas",
            hi: "वे ज्वारनदमुख बनातीं क्योंकि अरब सागर में डेल्टा की जगह नहीं",
            mr: "त्या खाडीमुख बनवतात कारण अरबी समुद्रात त्रिभुजाला जागा नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Two facts about the shape of the plateau explain both the direction and the ending. First, the direction. The Peninsular Plateau is not level; as a great block it is tilted, sloping gently down toward the east. Rivers follow the slope of the land, so the great peninsular rivers — Godavari, Krishna, Kaveri — obediently run eastward across the tilt and empty into the Bay of Bengal, and because they flow over a long gentle slope they slow near the coast, drop their load of silt, and build broad deltas. The Narmada and Tapi are the exceptions because they do not follow the general slope at all — they occupy rift valleys. A rift valley is a long, straight trough where a strip of land has dropped down between two roughly parallel faults (cracks in the crust). These particular troughs run east–west and open toward the west, so the two rivers, instead of following the plateau's eastward tilt, are guided along the ready-made trench and flow west into the Arabian Sea. Second, the ending. Because a rift valley is steep-sided and drops the river fairly directly toward the sea, the Narmada and Tapi move fast and flush their silt out into deep water rather than laying it down in a fan. With little silt deposited at the mouth, they form estuaries — funnel-shaped tidal mouths — instead of the spreading, sediment-built deltas of their east-flowing cousins. So a single structural feature, the rift valley, overrides the plateau's tilt to reverse these rivers' direction and change how they meet the sea.",
          hi: "पठार के आकार के बारे में दो तथ्य दिशा और अंत दोनों समझाते। पहला, दिशा। प्रायद्वीपीय पठार समतल नहीं; एक बड़े खंड के रूप में यह झुका, पूर्व की ओर धीरे ढलता। नदियाँ भूमि की ढलान का पीछा करतीं, अतः महान प्रायद्वीपीय नदियाँ — गोदावरी, कृष्णा, कावेरी — आज्ञाकारी रूप से झुकाव के आर-पार पूर्व बहतीं और बंगाल की खाड़ी में गिरतीं, और क्योंकि वे लंबी हल्की ढलान पर बहतीं वे तट के पास धीमी होतीं, अपना गाद-भार गिरातीं, और चौड़े डेल्टा बनातीं। नर्मदा और तापी अपवाद क्योंकि वे सामान्य ढलान का पीछा बिलकुल नहीं करतीं — वे भ्रंश घाटियों में बसतीं। भ्रंश घाटी एक लंबी, सीधी द्रोणी जहाँ भूमि की एक पट्टी दो लगभग समांतर भ्रंशों (पर्पटी की दरारों) के बीच नीचे गिरी। ये विशेष द्रोणियाँ पूर्व-पश्चिम चलतीं और पश्चिम की ओर खुलतीं, अतः दोनों नदियाँ, पठार के पूर्वी झुकाव का पीछा करने के बजाय, तैयार खाई के साथ निर्देशित होकर पश्चिम अरब सागर बहतीं। दूसरा, अंत। क्योंकि भ्रंश घाटी खड़ी-किनारी और नदी को समुद्र की ओर काफ़ी सीधे गिराती, नर्मदा और तापी तेज़ चलतीं और अपनी गाद पंखे में बिछाने के बजाय गहरे पानी में बहा देतीं। मुहाने पर कम गाद जमने से, वे ज्वारनदमुख बनातीं — कीप-आकार ज्वारीय मुहाने — अपनी पूर्व-बहती चचेरी नदियों के फैलते, तलछट-निर्मित डेल्टा के बजाय। अतः एक ही संरचनात्मक विशेषता, भ्रंश घाटी, पठार के झुकाव को मात देकर इन नदियों की दिशा उलटती और बदलती वे समुद्र से कैसे मिलतीं।",
          mr: "पठाराच्या आकाराबद्दल दोन तथ्ये दिशा आणि शेवट दोन्ही समजावतात. पहिले, दिशा. द्वीपकल्पीय पठार सपाट नाही; एका मोठ्या ठोकळ्याप्रमाणे ते कललेले, पूर्वेकडे हळू उतरणारे. नद्या जमिनीच्या उताराचा पाठलाग करतात, म्हणून महान द्वीपकल्पीय नद्या — गोदावरी, कृष्णा, कावेरी — आज्ञाधारकपणे कलतीच्या आरपार पूर्वेला वाहतात आणि बंगालच्या उपसागरात ओततात, आणि कारण त्या लांब सौम्य उतारावर वाहतात त्या किनाऱ्याजवळ मंदावतात, आपला गाळ-भार टाकतात, आणि रुंद त्रिभुज बनवतात. नर्मदा आणि तापी अपवाद कारण त्या सामान्य उताराचा पाठलाग मुळीच करत नाहीत — त्या भेग-खोऱ्यांत वसतात. भेग-खोरे एक लांब, सरळ द्रोणी जिथे जमिनीची एक पट्टी दोन जवळपास समांतर भेगांमध्ये (कवचातील तडे) खाली पडली. या विशिष्ट द्रोणी पूर्व-पश्चिम चालतात आणि पश्चिमेकडे उघडतात, म्हणून दोन्ही नद्या, पठाराच्या पूर्व कलतीचा पाठलाग करण्याऐवजी, तयार खंदकातून मार्गदर्शित होऊन पश्चिमेला अरबी समुद्रात वाहतात. दुसरे, शेवट. कारण भेग-खोरे तीव्र-कडेचे आणि नदीला समुद्राकडे बऱ्यापैकी सरळ पाडते, नर्मदा आणि तापी वेगाने चालतात आणि आपला गाळ पंख्यात अंथरण्याऐवजी खोल पाण्यात वाहवतात. मुखाशी कमी गाळ साचल्याने, त्या खाडीमुख बनवतात — नरसाळ्याच्या आकाराची भरती-मुखे — आपल्या पूर्व-वाहणाऱ्या चुलत नद्यांच्या पसरणाऱ्या, गाळ-निर्मित त्रिभुजांऐवजी. म्हणून एकच रचनात्मक वैशिष्ट्य, भेग-खोरे, पठाराच्या कलतीला मात देऊन या नद्यांची दिशा उलटवते आणि बदलते त्या समुद्राशी कशा भेटतात.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Climate (the monsoon and what shapes it)                   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-9-climate",
    subject: "GEOGRAPHY",
    classLevel: 9,
    chapter: {
      en: "Chapter 4 — Climate",
      hi: "अध्याय 4 — जलवायु",
      mr: "प्रकरण 4 — हवामान",
    },
    name: {
      en: "Climate",
      hi: "जलवायु",
      mr: "हवामान",
    },
    summary: {
      en: "India's weather ruled by the monsoon: winds that reverse with the seasons, drawn in from the sea when the land heats; a climate bent by latitude, height, the sea's nearness and the lie of the mountains; four seasons turning through the year; and rainfall so uneven it drowns one hill and starves a desert.",
      hi: "भारत का मौसम मानसून से शासित: हवाएँ जो ऋतुओं के साथ पलटतीं, भूमि तपने पर समुद्र से खिंचतीं; अक्षांश, ऊँचाई, समुद्र की निकटता और पर्वतों की बनावट से मुड़ी जलवायु; वर्ष भर घूमती चार ऋतुएँ; और इतनी असमान वर्षा कि एक पहाड़ी डुबोती और मरुस्थल भूखा रखती।",
      mr: "भारताचे हवामान मान्सूनने शासित: वारे जे ऋतूंसह पलटतात, जमीन तापताना समुद्रातून ओढले जातात; अक्षांश, उंची, समुद्राची जवळीक आणि पर्वतांची रचना यांनी वाकलेले हवामान; वर्षभर फिरणारे चार ऋतू; आणि इतका असमान पाऊस की एक टेकडी बुडवतो आणि वाळवंट उपाशी ठेवतो.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "monsoon",
        name: {
          en: "The monsoon winds",
          hi: "मानसून पवनें",
          mr: "मान्सून वारे",
        },
        kind: "process",
        prompt: {
          en: "For half the year the winds blow in from the sea and drench India with rain, and for the other half they blow the opposite way, off the dry land. Which seasonal wind system rules India's weather?",
          hi: "आधे वर्ष हवाएँ समुद्र से भीतर बहतीं और भारत को वर्षा से भिगोतीं, और बाक़ी आधे वे उल्टी दिशा, शुष्क भूमि से बहतीं। कौन-सा मौसमी पवन-तंत्र भारत का मौसम शासित करता?",
          mr: "अर्धे वर्ष वारे समुद्रातून आत वाहतात आणि भारताला पावसाने भिजवतात, आणि बाकी अर्धे ते उलट दिशेने, कोरड्या जमिनीतून वाहतात. कोणती हंगामी वारा-प्रणाली भारताचे हवामान शासित करते?",
        },
        statement: {
          en: "The monsoon is a seasonal reversal of winds — moisture-laden winds blow in from the sea in summer bringing the rains, and dry winds blow out from the land in winter.",
          hi: "मानसून पवनों का मौसमी उलटाव है — ग्रीष्म में नमी-भरी हवाएँ समुद्र से भीतर बहतीं वर्षा लातीं, और शीत में शुष्क हवाएँ भूमि से बाहर बहतीं।",
          mr: "मान्सून वाऱ्यांचा हंगामी उलटफेर आहे — उन्हाळ्यात ओलावा-भरले वारे समुद्रातून आत वाहतात पाऊस आणत, आणि हिवाळ्यात कोरडे वारे जमिनीतून बाहेर वाहतात.",
        },
        detail: {
          en: "The summer, or south-west, monsoon brings almost all of India's yearly rain in a few crowded months between June and September.",
          hi: "ग्रीष्म, या दक्षिण-पश्चिम, मानसून भारत की लगभग सारी वार्षिक वर्षा जून से सितंबर के कुछ भीड़-भरे महीनों में लाता।",
          mr: "उन्हाळी, किंवा नैऋत्य, मान्सून भारताचा जवळपास सारा वार्षिक पाऊस जून ते सप्टेंबरच्या काही गर्दीच्या महिन्यांत आणतो.",
        },
        extra: {
          en: "The word comes from the Arabic mausim, meaning season — sailors long knew these winds turned like clockwork each year.",
          hi: "शब्द अरबी मौसिम से, अर्थ ऋतु — नाविक लंबे समय जानते ये हवाएँ हर वर्ष घड़ी की तरह पलटतीं।",
          mr: "शब्द अरबी मौसिमपासून, अर्थ ऋतू — खलाशी बराच काळ जाणत हे वारे दरवर्षी घड्याळासारखे पलटतात.",
        },
        pair: {
          left: {
            en: "Winds reversing in from the sea, then out",
            hi: "हवाएँ समुद्र से भीतर पलटतीं, फिर बाहर",
            mr: "वारे समुद्रातून आत पलटतात, मग बाहेर",
          },
          right: {
            en: "the monsoon winds",
            hi: "मानसून पवनें",
            mr: "मान्सून वारे",
          },
        },
      },
      {
        id: "climate-controls",
        name: {
          en: "The controls of climate",
          hi: "जलवायु के नियंत्रक",
          mr: "हवामानाचे नियंत्रक",
        },
        kind: "idea",
        prompt: {
          en: "Why one Indian town bakes while another stays cool, one is wet and another dry, comes down to a handful of factors — how far from the equator, how high, how near the sea, and how the land lies. What are these called?",
          hi: "क्यों एक भारतीय क़स्बा तपता जबकि दूसरा ठंडा रहता, एक गीला और दूसरा सूखा, कुछ कारकों पर निर्भर — भूमध्य रेखा से कितनी दूर, कितनी ऊँचाई, समुद्र से कितना पास, और भूमि कैसी बनी। इन्हें क्या कहते?",
          mr: "एक भारतीय गाव का तापतो तर दुसरा थंड राहतो, एक ओला आणि दुसरा कोरडा, हे काही घटकांवर अवलंबून — विषुववृत्तापासून किती दूर, किती उंच, समुद्रापासून किती जवळ, आणि जमीन कशी. यांना काय म्हणतात?",
        },
        statement: {
          en: "The controls of climate are the main factors that shape a place's weather — its latitude, its altitude, its distance from the sea, and the relief or lie of the land around it.",
          hi: "जलवायु के नियंत्रक वे मुख्य कारक जो किसी स्थान का मौसम गढ़ते — उसका अक्षांश, ऊँचाई, समुद्र से दूरी, और चारों ओर की भू-आकृति या बनावट।",
          mr: "हवामानाचे नियंत्रक ते मुख्य घटक जे एखाद्या ठिकाणाचे हवामान घडवतात — त्याचा अक्षांश, उंची, समुद्रापासूनचे अंतर, आणि सभोवतालची भू-रचना.",
        },
        detail: {
          en: "Places near the sea have mild, even temperatures, while inland places swing between fierce summer heat and sharp winter cold.",
          hi: "समुद्र के पास स्थानों का तापमान हल्का, सम, जबकि भीतरी स्थान प्रचंड ग्रीष्म ताप और तीखी शीत ठंड के बीच झूलते।",
          mr: "समुद्राजवळच्या ठिकाणांचे तापमान सौम्य, समान, तर अंतर्गत ठिकाणे प्रचंड उन्हाळी उष्णता आणि तीक्ष्ण हिवाळी थंडीदरम्यान झुलतात.",
        },
        extra: {
          en: "Altitude cools the air about as surely as latitude does, so a hill station in the tropics can stay pleasant while the plains below swelter.",
          hi: "ऊँचाई हवा को अक्षांश जितनी ही निश्चितता से ठंडा करती, अतः उष्ण कटिबंध का पहाड़ी स्थल सुहावना रह सकता जबकि नीचे मैदान तपते।",
          mr: "उंची हवेला अक्षांशाइतक्याच निश्चितपणे थंड करते, म्हणून उष्ण कटिबंधातील डोंगरी ठिकाण आल्हाददायक राहू शकते तर खालची मैदाने तापतात.",
        },
        pair: {
          left: {
            en: "Latitude, altitude, sea, relief",
            hi: "अक्षांश, ऊँचाई, समुद्र, भू-आकृति",
            mr: "अक्षांश, उंची, समुद्र, भू-रचना",
          },
          right: {
            en: "the controls of climate",
            hi: "जलवायु के नियंत्रक",
            mr: "हवामानाचे नियंत्रक",
          },
        },
      },
      {
        id: "four-seasons",
        name: {
          en: "India's four seasons",
          hi: "भारत की चार ऋतुएँ",
          mr: "भारताचे चार ऋतू",
        },
        kind: "idea",
        prompt: {
          en: "India's year turns through a cold season, a hot dry season, the rainy season of the bursting monsoon, and the season of the monsoon's slow withdrawal. What is this yearly cycle called?",
          hi: "भारत का वर्ष शीत ऋतु, गर्म शुष्क ऋतु, फूटते मानसून की वर्षा ऋतु, और मानसून के धीमे हटने की ऋतु से घूमता। इस वार्षिक चक्र को क्या कहते?",
          mr: "भारताचे वर्ष थंड ऋतू, गरम कोरडा ऋतू, फुटणाऱ्या मान्सूनचा पावसाळी ऋतू, आणि मान्सूनच्या मंद माघारीचा ऋतू यांतून फिरते. या वार्षिक चक्राला काय म्हणतात?",
        },
        statement: {
          en: "India has four main seasons — the cold winter, the hot dry summer, the rainy season of the advancing south-west monsoon, and the season of the retreating monsoon in autumn.",
          hi: "भारत की चार मुख्य ऋतुएँ — शीत जाड़ा, गर्म शुष्क ग्रीष्म, आगे बढ़ते दक्षिण-पश्चिम मानसून की वर्षा ऋतु, और शरद में हटते मानसून की ऋतु।",
          mr: "भारताचे चार मुख्य ऋतू — थंड हिवाळा, गरम कोरडा उन्हाळा, पुढे सरकणाऱ्या नैऋत्य मान्सूनचा पावसाळी ऋतू, आणि शरद ऋतूत माघारणाऱ्या मान्सूनचा ऋतू.",
        },
        detail: {
          en: "As the monsoon retreats in October–November, the sky clears but the air stays humid, a sultry spell often called 'October heat'.",
          hi: "जैसे मानसून अक्टूबर-नवंबर में हटता, आकाश साफ़ होता पर हवा नम रहती, एक उमस-भरा दौर अक्सर 'अक्टूबर ताप' कहलाता।",
          mr: "जसे मान्सून ऑक्टोबर-नोव्हेंबरमध्ये माघारतो, आकाश स्वच्छ होते पण हवा दमट राहते, एक उकाड्याचा काळ अनेकदा 'ऑक्टोबर उष्णता' म्हणतात.",
        },
        extra: {
          en: "The retreating monsoon can turn dangerous over the Bay of Bengal, spinning up the cyclones that lash India's eastern coast in autumn.",
          hi: "हटता मानसून बंगाल की खाड़ी पर ख़तरनाक हो सकता, उन चक्रवातों को घुमाते जो शरद में भारत के पूर्वी तट को पीटते।",
          mr: "माघारणारा मान्सून बंगालच्या उपसागरावर धोकादायक होऊ शकतो, ती चक्रीवादळे फिरवत जी शरद ऋतूत भारताच्या पूर्व किनाऱ्याला बडवतात.",
        },
        pair: {
          left: {
            en: "Cold, hot, rainy, retreating",
            hi: "शीत, गर्म, वर्षा, हटता",
            mr: "थंड, गरम, पावसाळी, माघारता",
          },
          right: {
            en: "India's four seasons",
            hi: "भारत की चार ऋतुएँ",
            mr: "भारताचे चार ऋतू",
          },
        },
      },
      {
        id: "uneven-rainfall",
        name: {
          en: "Uneven rainfall",
          hi: "असमान वर्षा",
          mr: "असमान पाऊस",
        },
        kind: "idea",
        prompt: {
          en: "One north-eastern hill catches over a thousand centimetres of rain a year, while parts of the western desert scarcely get ten. What feature of India's climate does this vast contrast describe?",
          hi: "एक पूर्वोत्तर पहाड़ी वर्ष में हज़ार सेंटीमीटर से अधिक वर्षा पकड़ती, जबकि पश्चिमी मरुस्थल के भाग मुश्किल से दस पाते। यह विशाल विरोध भारत की जलवायु की कौन-सी विशेषता बताता?",
          mr: "एक ईशान्य टेकडी वर्षात हजार सेंटीमीटरहून अधिक पाऊस पकडते, तर पश्चिमी वाळवंटाचे भाग जेमतेम दहा मिळवतात. हा विशाल विरोध भारताच्या हवामानाचे कोणते वैशिष्ट्य सांगतो?",
        },
        statement: {
          en: "India's rainfall is very unevenly spread — some places like the north-eastern hills are among the wettest on Earth, while the western desert and rain-shadow areas get very little.",
          hi: "भारत की वर्षा बहुत असमान फैली — पूर्वोत्तर पहाड़ियों जैसे कुछ स्थान पृथ्वी के सबसे गीले में, जबकि पश्चिमी मरुस्थल और वृष्टि-छाया क्षेत्र बहुत कम पाते।",
          mr: "भारताचा पाऊस अतिशय असमान पसरला — ईशान्य टेकड्यांसारखी काही ठिकाणे पृथ्वीवरील सर्वांत ओल्या ठिकाणांत, तर पश्चिमी वाळवंट आणि पर्जन्यछाया प्रदेश फार कमी मिळवतात.",
        },
        detail: {
          en: "A place on the windward side of a hill is soaked, while the sheltered rain-shadow side just beyond it stays dry — the mountains wring the rain out on one flank.",
          hi: "पहाड़ी के पवनमुखी ओर का स्थान भीगता, जबकि उसके ठीक परे आश्रित वृष्टि-छाया ओर सूखी रहती — पर्वत एक पार्श्व पर वर्षा निचोड़ते।",
          mr: "टेकडीच्या वाऱ्याकडील बाजूचे ठिकाण भिजते, तर त्याच्या पलीकडची आश्रित पर्जन्यछाया बाजू कोरडी राहते — पर्वत एका बाजूला पाऊस पिळून काढतात.",
        },
        extra: {
          en: "This unevenness in space is matched by unevenness in time: the same region may face flood one year and drought the next as the monsoon varies.",
          hi: "स्थान में यह असमानता समय में असमानता से मेल खाती: वही क्षेत्र एक वर्ष बाढ़ और अगले सूखा झेल सकता जैसे मानसून बदलता।",
          mr: "जागेतील ही असमानता वेळेतील असमानतेशी जुळते: तोच प्रदेश एका वर्षी पूर आणि पुढच्या दुष्काळ सोसू शकतो जसा मान्सून बदलतो.",
        },
        pair: {
          left: {
            en: "Drowned hills beside starved deserts",
            hi: "भूखे मरुस्थलों के पास डूबी पहाड़ियाँ",
            mr: "उपाशी वाळवंटांशेजारी बुडलेल्या टेकड्या",
          },
          right: {
            en: "uneven rainfall",
            hi: "असमान वर्षा",
            mr: "असमान पाऊस",
          },
        },
      },
      {
        id: "monsoon-unity",
        name: {
          en: "The monsoon as a unifier",
          hi: "मानसून एकीकारक के रूप में",
          mr: "मान्सून एकसंधकारक म्हणून",
        },
        kind: "idea",
        prompt: {
          en: "From Kerala to Kashmir the whole country waits for the same rains, plans its farming around them, and celebrates their arrival — a shared rhythm binding a diverse land. What role of the monsoon is this?",
          hi: "केरल से कश्मीर तक पूरा देश उन्हीं वर्षा की प्रतीक्षा करता, उनके इर्द-गिर्द खेती योजता, और उनके आगमन का उत्सव मनाता — एक साझा ताल विविध भूमि को बाँधता। यह मानसून की कौन-सी भूमिका है?",
          mr: "केरळपासून काश्मीरपर्यंत अख्खा देश त्याच पावसाची वाट पाहतो, त्याभोवती शेती योजतो, आणि त्याच्या आगमनाचा उत्सव करतो — एक सामायिक ताल विविध भूमीला बांधणारा. ही मान्सूनची कोणती भूमिका?",
        },
        statement: {
          en: "The monsoon acts as a unifying thread across India — the whole country awaits the same rains, times its farming and festivals to them, so this shared dependence binds a diverse land together.",
          hi: "मानसून भारत भर एकीकारक धागे की तरह काम करता — पूरा देश उन्हीं वर्षा की प्रतीक्षा करता, अपनी खेती-त्योहार उन पर समयबद्ध करता, अतः यह साझा निर्भरता विविध भूमि को एक साथ बाँधती।",
          mr: "मान्सून भारतभर एकसंधकारक धाग्यासारखा काम करतो — अख्खा देश त्याच पावसाची वाट पाहतो, आपली शेती-सण त्यावर वेळबद्ध करतो, म्हणून ही सामायिक अवलंबिता विविध भूमीला एकत्र बांधते.",
        },
        detail: {
          en: "Indian agriculture still leans heavily on the monsoon, so its timely arrival can mean a good harvest and its failure can spell drought and hardship.",
          hi: "भारतीय कृषि अब भी मानसून पर भारी झुकी, अतः उसका समय पर आगमन अच्छी फ़सल और उसकी विफलता सूखा और कष्ट का अर्थ हो सकता।",
          mr: "भारतीय शेती अजून मान्सूनवर भारी झुकलेली, म्हणून त्याचे वेळेवर आगमन चांगले पीक आणि त्याचे अपयश दुष्काळ आणि हालअपेष्टांचा अर्थ असू शकते.",
        },
        extra: {
          en: "Its arrival is greeted with relief and festival after the fierce heat, a moment felt as deeply in a farmer's field as in a city street.",
          hi: "इसका आगमन प्रचंड ताप के बाद राहत और उत्सव से स्वागतित, एक पल जो किसान के खेत में उतना ही गहरा जितना शहर की गली में।",
          mr: "त्याचे आगमन प्रचंड उष्णतेनंतर सुटका आणि सणाने स्वागतले जाते, एक क्षण जो शेतकऱ्याच्या शेतात तितकाच खोल जितका शहराच्या रस्त्यावर.",
        },
        pair: {
          left: {
            en: "One shared rain binding a diverse land",
            hi: "विविध भूमि को बाँधती एक साझा वर्षा",
            mr: "विविध भूमीला बांधणारा एक सामायिक पाऊस",
          },
          right: {
            en: "the monsoon as a unifier",
            hi: "मानसून एकीकारक के रूप में",
            mr: "मान्सून एकसंधकारक म्हणून",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "In peak summer, Mumbai on the coast rarely climbs much above the low 30s Celsius, while Nagpur, inland at a similar latitude, can roast past 45°C; in winter, Mumbai stays mild while Nagpur turns sharply cold. What single control of climate best explains this contrast?",
          hi: "चरम ग्रीष्म में, तट पर मुंबई शायद ही 30 के आरंभिक दशक सेल्सियस से बहुत ऊपर चढ़ती, जबकि नागपुर, समान अक्षांश पर भीतरी, 45°C पार भून सकता; शीत में, मुंबई हल्की रहती जबकि नागपुर तीखी ठंडी हो जाती। कौन-सा एक जलवायु-नियंत्रक इस विरोध को सबसे अच्छा समझाता?",
          mr: "ऐन उन्हाळ्यात, किनाऱ्यावरची मुंबई क्वचित 30 च्या सुरुवातीच्या दशकाहून सेल्सिअस बरीच वर चढते, तर नागपूर, समान अक्षांशावर अंतर्गत, 45°C पार भाजू शकतो; हिवाळ्यात, मुंबई सौम्य राहते तर नागपूर तीक्ष्ण थंड होतो. कोणता एक हवामान-नियंत्रक हा विरोध सर्वांत चांगला समजावतो?",
        },
        choices: [
          {
            en: "Distance from the sea: the ocean heats and cools slowly and moderates the air near it, so coastal Mumbai has mild, even temperatures, while inland Nagpur, far from that moderating sea, swings between extreme summer heat and winter cold",
            hi: "समुद्र से दूरी: महासागर धीरे तपता-ठंडा होता और अपने पास की हवा को सम करता, अतः तटीय मुंबई का तापमान हल्का, सम, जबकि भीतरी नागपुर, उस सम-करते समुद्र से दूर, प्रचंड ग्रीष्म ताप और शीत ठंड के बीच झूलता",
            mr: "समुद्रापासूनचे अंतर: महासागर हळू तापतो-थंड होतो आणि आपल्याजवळच्या हवेला सम करतो, म्हणून किनारी मुंबईचे तापमान सौम्य, समान, तर अंतर्गत नागपूर, त्या सम-करणाऱ्या समुद्रापासून दूर, प्रचंड उन्हाळी उष्णता आणि हिवाळी थंडीदरम्यान झुलतो",
          },
          {
            en: "Mumbai is far higher in altitude than Nagpur, so it is cooler",
            hi: "मुंबई नागपुर से ऊँचाई में बहुत ऊँची, अतः ठंडी",
            mr: "मुंबई नागपूरहून उंचीत बरीच उंच, म्हणून थंड",
          },
          {
            en: "Nagpur lies much closer to the equator than Mumbai",
            hi: "नागपुर मुंबई से भूमध्य रेखा के बहुत निकट",
            mr: "नागपूर मुंबईहून विषुववृत्ताच्या बराच जवळ",
          },
          {
            en: "The sun shines only on inland cities and avoids the coast",
            hi: "सूरज केवल भीतरी नगरों पर चमकता और तट से बचता",
            mr: "सूर्य फक्त अंतर्गत शहरांवर चमकतो आणि किनारा टाळतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The deciding control here is distance from the sea, working through what is called the moderating or maritime effect. Water heats up and cools down far more slowly than land: the sea takes a long time to warm in summer and holds its warmth well into winter. A city right on the coast, like Mumbai, is constantly bathed in sea breezes carrying that steady temperature, so its air never gets very hot in summer or very cold in winter — its climate is 'mild' and 'equable', with only a small gap between the seasons. Nagpur sits at roughly the same latitude, so it gets similar sunshine, but it lies deep in the interior, far from any moderating ocean. Land heats quickly under the summer sun and loses that heat quickly at night and in winter, so inland places show a 'continental' climate: blazing summers well past 45°C and genuinely cold winters, a wide swing between the two. That is why two cities on nearly the same line of latitude can feel so different — latitude sets how much sun they receive, but nearness to the sea decides how gently or violently the temperature moves. Altitude is not the answer (both are low-lying), nor latitude (they are similar); it is the sea's calming hand, present for Mumbai and absent for Nagpur.",
          hi: "यहाँ निर्णायक नियंत्रक समुद्र से दूरी, जो सम-करते या समुद्री प्रभाव से काम करता। पानी भूमि से कहीं धीरे तपता-ठंडा होता: समुद्र ग्रीष्म में गरम होने में लंबा समय लेता और शीत तक अपनी गरमी थामता। तट पर ही बसा नगर, मुंबई जैसा, लगातार वह स्थिर तापमान ढोती समुद्री हवाओं में नहाया, अतः इसकी हवा न ग्रीष्म में बहुत गरम न शीत में बहुत ठंडी — इसकी जलवायु 'हल्की' और 'सम', ऋतुओं के बीच केवल छोटा अंतर। नागपुर लगभग उसी अक्षांश पर, अतः समान धूप पाता, पर भीतर गहरे बसा, किसी सम-करते महासागर से दूर। भूमि ग्रीष्म सूरज तले तेज़ तपती और रात-शीत में वह ताप तेज़ खोती, अतः भीतरी स्थान 'महाद्वीपीय' जलवायु दिखाते: 45°C पार धधकते ग्रीष्म और सचमुच ठंडे शीत, दोनों के बीच चौड़ा झूला। इसी से लगभग एक ही अक्षांश रेखा पर दो नगर इतने भिन्न लग सकते — अक्षांश तय करता कितनी धूप पाते, पर समुद्र की निकटता तय करती तापमान कितने कोमल या हिंसक चलता। ऊँचाई उत्तर नहीं (दोनों निचले), न अक्षांश (वे समान); यह समुद्र का शांत हाथ, मुंबई को प्राप्त और नागपुर से अनुपस्थित।",
          mr: "इथे निर्णायक नियंत्रक समुद्रापासूनचे अंतर, जे सम-करणाऱ्या किंवा सागरी परिणामातून काम करते. पाणी जमिनीहून कितीतरी हळू तापते-थंड होते: समुद्र उन्हाळ्यात गरम व्हायला बराच वेळ घेतो आणि हिवाळ्यापर्यंत आपली उब धरतो. किनाऱ्यावरच वसलेले शहर, मुंबईसारखे, सतत त्या स्थिर तापमान वाहणाऱ्या समुद्री वाऱ्यांत न्हाते, म्हणून त्याची हवा उन्हाळ्यात फार गरम वा हिवाळ्यात फार थंड होत नाही — त्याचे हवामान 'सौम्य' आणि 'समान', ऋतूंदरम्यान फक्त लहान फरक. नागपूर जवळपास त्याच अक्षांशावर, म्हणून समान ऊन मिळवतो, पण आत खोल वसलेला, कोणत्याही सम-करणाऱ्या महासागरापासून दूर. जमीन उन्हाळी सूर्याखाली जलद तापते आणि रात्री-हिवाळ्यात ती उष्णता जलद गमावते, म्हणून अंतर्गत ठिकाणे 'खंडीय' हवामान दाखवतात: 45°C पार धगधगते उन्हाळे आणि खरोखर थंड हिवाळे, दोहोंदरम्यान रुंद झोका. म्हणूनच जवळपास एकाच अक्षांश रेषेवरची दोन शहरे इतकी वेगळी वाटू शकतात — अक्षांश ठरवतो किती ऊन मिळते, पण समुद्राची जवळीक ठरवते तापमान किती सौम्य वा हिंसक चालते. उंची उत्तर नाही (दोन्ही सखल), ना अक्षांश (ते समान); तो समुद्राचा शांत हात, मुंबईला उपलब्ध आणि नागपूरला अनुपस्थित.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The Indian monsoon 'reverses' twice a year — moist winds sweep in from the sea in summer, and dry winds blow out toward the sea in winter. What actually causes this great turnaround of the winds?",
          hi: "भारतीय मानसून वर्ष में दो बार 'पलटता' — ग्रीष्म में नम हवाएँ समुद्र से भीतर बहतीं, और शीत में शुष्क हवाएँ समुद्र की ओर बाहर बहतीं। इस हवाओं के महान पलटाव का असल कारण क्या?",
          mr: "भारतीय मान्सून वर्षात दोनदा 'पलटतो' — उन्हाळ्यात ओले वारे समुद्रातून आत वाहतात, आणि हिवाळ्यात कोरडे वारे समुद्राकडे बाहेर वाहतात. या वाऱ्यांच्या महान पलटफेराचे खरे कारण काय?",
        },
        choices: [
          {
            en: "Land and sea heat and cool at different rates: in summer the land heats faster, creating low pressure over it that draws moist air in from the cooler high-pressure sea; in winter the land cools faster, so high pressure over the land pushes dry air out toward the now-warmer sea — the pressure difference reverses, and the winds reverse with it",
            hi: "भूमि और समुद्र भिन्न दरों से तपते-ठंडे होते: ग्रीष्म में भूमि तेज़ तपती, उस पर निम्न दाब बनाती जो ठंडे उच्च-दाब समुद्र से नम हवा भीतर खींचता; शीत में भूमि तेज़ ठंडी होती, अतः भूमि पर उच्च दाब शुष्क हवा अब गरम समुद्र की ओर बाहर धकेलता — दाब-अंतर पलटता, और हवाएँ उसके साथ पलटतीं",
            mr: "जमीन आणि समुद्र वेगळ्या दरांनी तापतात-थंड होतात: उन्हाळ्यात जमीन जलद तापते, तिच्यावर कमी दाब बनवते जो थंड जास्त-दाब समुद्रातून ओली हवा आत खेचतो; हिवाळ्यात जमीन जलद थंड होते, म्हणून जमिनीवरचा जास्त दाब कोरडी हवा आता उबदार समुद्राकडे बाहेर ढकलतो — दाब-फरक पलटतो, आणि वारे त्यासोबत पलटतात",
          },
          {
            en: "The Earth stops spinning for half the year, letting the winds fall back",
            hi: "पृथ्वी आधे वर्ष घूमना बंद कर देती, हवाओं को वापस गिरने देते",
            mr: "पृथ्वी अर्धे वर्ष फिरणे थांबवते, वाऱ्यांना परत पडू देत",
          },
          {
            en: "The sea physically moves closer to India in summer and away in winter",
            hi: "समुद्र ग्रीष्म में भारत के भौतिक रूप से पास और शीत में दूर आ-जाता",
            mr: "समुद्र उन्हाळ्यात भारताच्या भौतिकदृष्ट्या जवळ आणि हिवाळ्यात दूर सरकतो",
          },
          {
            en: "Winds always blow from cold places to hot places regardless of pressure",
            hi: "हवाएँ दाब की परवाह किए बिना सदा ठंडे स्थानों से गरम स्थानों को बहतीं",
            mr: "वारे दाबाची पर्वा न करता नेहमी थंड ठिकाणांहून गरम ठिकाणांकडे वाहतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The engine of the monsoon is the simple fact that land and sea do not heat or cool at the same speed, combined with the rule that winds blow from high pressure to low pressure. In summer, the sun beats down and the huge Indian landmass heats up quickly, far faster than the sea beside it. Hot land warms the air above it; that air rises, leaving an area of low pressure sitting over the subcontinent. The sea, slower to warm, stays relatively cool, and the air over it forms an area of higher pressure. Air flows from high to low pressure, so winds sweep from the high-pressure sea toward the low-pressure land — and because they have crossed thousands of kilometres of ocean, they arrive heavy with moisture, which the land forces upward to fall as the summer monsoon rains. In winter the whole arrangement flips. Now the land cools faster than the sea, so it is the land that becomes cold and forms high pressure, while the still-warm sea holds lower pressure. The wind therefore reverses, blowing from the high-pressure land out toward the low-pressure sea; and since this air comes off the dry continent, it carries little moisture, giving India its dry winter. So the 'reversal' is not the sea moving or the Earth pausing — it is the seasonal swap of which surface is hotter, flipping the pressure pattern and, with it, the direction of the winds. This differential heating of land and water is the beating heart of the entire monsoon system.",
          hi: "मानसून का इंजन यह सरल तथ्य कि भूमि और समुद्र एक ही गति से नहीं तपते-ठंडे होते, इस नियम के साथ मिला कि हवाएँ उच्च दाब से निम्न दाब बहतीं। ग्रीष्म में, सूरज तपाता और विशाल भारतीय भूभाग तेज़ तपता, अपने पास के समुद्र से कहीं तेज़। गरम भूमि ऊपर की हवा गरम करती; वह हवा उठती, उपमहाद्वीप पर निम्न दाब का क्षेत्र छोड़ते। समुद्र, तपने में धीमा, अपेक्षाकृत ठंडा रहता, और उस पर की हवा उच्च दाब का क्षेत्र बनाती। हवा उच्च से निम्न दाब बहती, अतः हवाएँ उच्च-दाब समुद्र से निम्न-दाब भूमि की ओर बहतीं — और क्योंकि वे हज़ारों किलोमीटर महासागर पार आईं, वे नमी से भारी पहुँचतीं, जिसे भूमि ऊपर धकेलकर ग्रीष्म मानसून वर्षा बनाती। शीत में पूरी व्यवस्था पलटती। अब भूमि समुद्र से तेज़ ठंडी होती, अतः भूमि ठंडी होकर उच्च दाब बनाती, जबकि अब भी गरम समुद्र निम्न दाब रखता। अतः हवा पलटती, उच्च-दाब भूमि से निम्न-दाब समुद्र की ओर बहती; और चूँकि यह हवा शुष्क महाद्वीप से आती, वह कम नमी ढोती, भारत को शुष्क शीत देती। अतः 'पलटाव' समुद्र का चलना या पृथ्वी का ठहरना नहीं — यह मौसमी अदला-बदली कि कौन-सी सतह अधिक गरम, दाब-नमूना पलटते और उसके साथ हवाओं की दिशा। भूमि और जल का यह भिन्न तपन पूरे मानसून तंत्र का धड़कता हृदय।",
          mr: "मान्सूनचे इंजिन हे साधे तथ्य की जमीन आणि समुद्र एकाच वेगाने तापत-थंड होत नाहीत, या नियमासह जोडलेले की वारे जास्त दाबातून कमी दाबाकडे वाहतात. उन्हाळ्यात, सूर्य तापवतो आणि विशाल भारतीय भूभाग जलद तापतो, आपल्याजवळच्या समुद्राहून कितीतरी जलद. गरम जमीन वरची हवा गरम करते; ती हवा वर उठते, उपखंडावर कमी दाबाचा प्रदेश सोडत. समुद्र, तापायला मंद, तुलनेने थंड राहतो, आणि त्यावरची हवा जास्त दाबाचा प्रदेश बनवते. हवा जास्तहून कमी दाबाकडे वाहते, म्हणून वारे जास्त-दाब समुद्रातून कमी-दाब जमिनीकडे वाहतात — आणि कारण ते हजारो किलोमीटर महासागर ओलांडून आले, ते ओलाव्याने जड पोहोचतात, जो जमीन वर ढकलून उन्हाळी मान्सून पाऊस बनवते. हिवाळ्यात संपूर्ण व्यवस्था पलटते. आता जमीन समुद्राहून जलद थंड होते, म्हणून जमीन थंड होऊन जास्त दाब बनवते, तर अजून उबदार समुद्र कमी दाब राखतो. म्हणून वारा पलटतो, जास्त-दाब जमिनीतून कमी-दाब समुद्राकडे वाहतो; आणि कारण ही हवा कोरड्या खंडातून येते, ती कमी ओलावा वाहते, भारताला कोरडा हिवाळा देत. म्हणून 'पलटफेर' समुद्राचे सरकणे वा पृथ्वीचे थांबणे नव्हे — तो हंगामी अदलाबदल की कोणते पृष्ठ अधिक गरम, दाब-नमुना पलटवत आणि त्यासोबत वाऱ्यांची दिशा. जमीन आणि पाण्याचे हे वेगळे तापणे संपूर्ण मान्सून प्रणालीचे धडधडणारे हृदय.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Natural Vegetation and Wildlife                            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-9-natural-vegetation-wildlife",
    subject: "GEOGRAPHY",
    classLevel: 9,
    chapter: {
      en: "Chapter 5 — Natural Vegetation and Wildlife",
      hi: "अध्याय 5 — प्राकृतिक वनस्पति और वन्य जीवन",
      mr: "प्रकरण 5 — नैसर्गिक वनस्पती आणि वन्यजीवन",
    },
    name: {
      en: "Natural Vegetation and Wildlife",
      hi: "प्राकृतिक वनस्पति और वन्य जीवन",
      mr: "नैसर्गिक वनस्पती आणि वन्यजीवन",
    },
    summary: {
      en: "The living cover the land grows on its own: forests sorted by how much rain they drink — dense evergreens in the wettest belts, leaf-shedding monsoon forests over the widest area, thorn scrub in the dry lands, and salt-braving mangroves in the deltas — and the wildlife they shelter, now guarded in reserves.",
      hi: "जीवित आवरण जो भूमि स्वयं उगाती: वन जितनी वर्षा पीते उससे छँटे — सबसे गीली पेटियों में घने सदाबहार, सबसे चौड़े क्षेत्र में पत्ती-गिराते मानसून वन, शुष्क भूमियों में काँटेदार झाड़, और डेल्टाओं में लवण-सहते मैंग्रोव — और वे जिस वन्य जीवन को आश्रय देते, अब अभयारण्यों में रक्षित।",
      mr: "जिवंत आच्छादन जे जमीन स्वतः उगवते: जंगले किती पाऊस पितात यावरून वेगळी — सर्वांत ओल्या पट्ट्यांत घनदाट सदाहरित, सर्वांत रुंद प्रदेशात पान-गाळणारी मान्सून जंगले, कोरड्या भूमींत काटेरी झुडपे, आणि त्रिभुजांत क्षार-सहन कांदळवने — आणि ती जे वन्यजीवन आश्रय देतात, आता अभयारण्यांत रक्षित.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "natural-vegetation",
        name: {
          en: "Natural vegetation",
          hi: "प्राकृतिक वनस्पति",
          mr: "नैसर्गिक वनस्पती",
        },
        kind: "idea",
        prompt: {
          en: "The plant life that grows in a region on its own, without being sown or tended by people, and has adjusted to its soil and climate over ages — what is this cover called?",
          hi: "किसी क्षेत्र में स्वयं उगती पादप-जीवन, बिना लोगों के बोए या सँभाले, और युगों में अपनी मिट्टी-जलवायु के अनुकूल ढली — इस आवरण को क्या कहते?",
          mr: "एखाद्या प्रदेशात स्वतः उगवणारे वनस्पती-जीवन, लोकांनी पेरल्या वा जोपासल्याविना, आणि युगांत आपल्या माती-हवामानाशी जुळवून घेतलेले — या आच्छादनाला काय म्हणतात?",
        },
        statement: {
          en: "Natural vegetation is the plant cover that grows in a region on its own, unsown and untended by people, having adapted over long ages to the local soil, climate and rainfall.",
          hi: "प्राकृतिक वनस्पति वह पादप-आवरण जो किसी क्षेत्र में स्वयं उगता, लोगों द्वारा बिना बोया-सँभाला, लंबे युगों में स्थानीय मिट्टी, जलवायु और वर्षा के अनुकूल ढला।",
          mr: "नैसर्गिक वनस्पती ते वनस्पती-आच्छादन जे एखाद्या प्रदेशात स्वतः उगवते, लोकांनी न पेरता-न जोपासता, दीर्घ युगांत स्थानिक माती, हवामान आणि पावसाशी जुळवून घेतलेले.",
        },
        detail: {
          en: "Together with the animal life it supports, it forms the region's flora (its plants) and fauna (its animals) — the two names biologists give the living community.",
          hi: "जिस पशु-जीवन को यह सहारा देता उसके साथ, यह क्षेत्र का वनस्पतिजात (उसके पौधे) और प्राणिजात (उसके पशु) बनाता — दो नाम जीव-वैज्ञानिक जीवित समुदाय को देते।",
          mr: "जे प्राणी-जीवन हे आधार देते त्यासह, हे प्रदेशाचे वनस्पतिजात (त्याची रोपे) आणि प्राणिजात (त्याचे प्राणी) बनवते — दोन नावे जीवशास्त्रज्ञ जिवंत समुदायाला देतात.",
        },
        extra: {
          en: "Land cleared for farms, gardens or planted forests is not natural vegetation, since a human hand chose and placed what grows there.",
          hi: "खेतों, बग़ीचों या रोपे वनों को साफ़ की भूमि प्राकृतिक वनस्पति नहीं, क्योंकि मानवी हाथ ने चुना-रखा वहाँ क्या उगे।",
          mr: "शेते, बागा वा लावलेल्या जंगलांना साफ केलेली जमीन नैसर्गिक वनस्पती नाही, कारण मानवी हाताने निवडले-ठेवले तिथे काय उगवेल.",
        },
        pair: {
          left: {
            en: "Grows unsown, adapted to soil and climate",
            hi: "बिना बोया उगे, मिट्टी-जलवायु के अनुकूल",
            mr: "न पेरता उगवते, माती-हवामानाशी जुळलेले",
          },
          right: {
            en: "natural vegetation",
            hi: "प्राकृतिक वनस्पति",
            mr: "नैसर्गिक वनस्पती",
          },
        },
      },
      {
        id: "tropical-evergreen",
        name: {
          en: "Tropical evergreen forests",
          hi: "उष्णकटिबंधीय सदाबहार वन",
          mr: "उष्ण कटिबंधीय सदाहरित जंगले",
        },
        kind: "vegetation",
        prompt: {
          en: "In the wettest belts, with heavy rain almost the year round, grow dense, layered forests so thick that little sunlight reaches the floor, and no season strips them bare. Which forest type is this?",
          hi: "सबसे गीली पेटियों में, लगभग साल भर भारी वर्षा के साथ, घने, परतदार वन उगते इतने मोटे कि थोड़ी धूप तल तक पहुँचे, और कोई ऋतु उन्हें नंगा न करे। यह कौन-सा वन-प्रकार है?",
          mr: "सर्वांत ओल्या पट्ट्यांत, जवळपास वर्षभर भारी पावसासह, घनदाट, थरांची जंगले उगवतात इतकी दाट की थोडे ऊन तळापर्यंत पोहोचते, आणि कोणता ऋतू त्यांना उघडे करत नाही. हे कोणते जंगल-प्रकार?",
        },
        statement: {
          en: "Tropical evergreen forests grow where rainfall is very heavy and spread through the year; they are dense and multi-layered, and because there is no dry season they never shed all their leaves at once, staying green throughout.",
          hi: "उष्णकटिबंधीय सदाबहार वन वहाँ उगते जहाँ वर्षा बहुत भारी और साल भर फैली; वे घने और बहु-परतदार, और क्योंकि कोई शुष्क ऋतु नहीं वे कभी एक साथ सारे पत्ते नहीं गिराते, साल भर हरे रहते।",
          mr: "उष्ण कटिबंधीय सदाहरित जंगले तिथे उगवतात जिथे पाऊस अतिशय भारी आणि वर्षभर पसरलेला; ती घनदाट आणि बहु-थरांची, आणि कारण कोणताही कोरडा ऋतू नाही ती कधी एकदम सारी पाने गाळत नाहीत, वर्षभर हिरवी राहतात.",
        },
        detail: {
          en: "Because different trees shed and renew their leaves at different times, the forest as a whole always looks green — hence 'evergreen'.",
          hi: "क्योंकि भिन्न वृक्ष भिन्न समय पत्ते गिराते-नवीकृत करते, वन समग्र रूप में सदा हरा दिखता — अतः 'सदाबहार'।",
          mr: "कारण वेगळे वृक्ष वेगळ्या वेळी पाने गाळतात-नूतनीकृत करतात, जंगल समग्रपणे सदैव हिरवे दिसते — म्हणून 'सदाहरित'.",
        },
        extra: {
          en: "They are found in the wettest corners of India — the Western Ghats, the north-eastern hills and the Andaman Islands — and teem with life at every level.",
          hi: "वे भारत के सबसे गीले कोनों में — पश्चिमी घाट, पूर्वोत्तर पहाड़ियाँ और अंडमान द्वीप — मिलते और हर स्तर पर जीवन से भरे।",
          mr: "ती भारताच्या सर्वांत ओल्या कोपऱ्यांत — पश्चिम घाट, ईशान्य टेकड्या आणि अंदमान बेटे — आढळतात आणि प्रत्येक स्तरावर जीवनाने भरलेली.",
        },
        pair: {
          left: {
            en: "Dense, year-round rain, never bare",
            hi: "घने, साल भर वर्षा, कभी नंगे नहीं",
            mr: "घनदाट, वर्षभर पाऊस, कधी उघडे नाही",
          },
          right: {
            en: "tropical evergreen forests",
            hi: "उष्णकटिबंधीय सदाबहार वन",
            mr: "उष्ण कटिबंधीय सदाहरित जंगले",
          },
        },
      },
      {
        id: "tropical-deciduous",
        name: {
          en: "Tropical deciduous forests",
          hi: "उष्णकटिबंधीय पर्णपाती वन",
          mr: "उष्ण कटिबंधीय पानझडी जंगले",
        },
        kind: "vegetation",
        prompt: {
          en: "Over the broad belt of moderate monsoon rain grow India's most widespread forests, whose trees drop their leaves together in the dry season to save water. Which forest type is this?",
          hi: "मध्यम मानसून वर्षा की चौड़ी पेटी पर भारत के सबसे व्यापक वन उगते, जिनके वृक्ष शुष्क ऋतु में पानी बचाने को एक साथ पत्ते गिराते। यह कौन-सा वन-प्रकार है?",
          mr: "मध्यम मान्सून पावसाच्या रुंद पट्ट्यावर भारताची सर्वांत व्यापक जंगले उगवतात, ज्यांचे वृक्ष कोरड्या ऋतूत पाणी वाचवायला एकत्र पाने गाळतात. हे कोणते जंगल-प्रकार?",
        },
        statement: {
          en: "Tropical deciduous forests, the monsoon forests, are India's most widespread type; growing in areas of moderate rainfall, their trees shed their leaves together during the dry season to cut water loss.",
          hi: "उष्णकटिबंधीय पर्णपाती वन, मानसून वन, भारत के सबसे व्यापक प्रकार; मध्यम वर्षा क्षेत्रों में उगते, उनके वृक्ष शुष्क ऋतु में जल-हानि घटाने को एक साथ पत्ते गिराते।",
          mr: "उष्ण कटिबंधीय पानझडी जंगले, मान्सून जंगले, भारताचा सर्वांत व्यापक प्रकार; मध्यम पावसाच्या प्रदेशांत उगवत, त्यांचे वृक्ष कोरड्या ऋतूत पाणी-हानी घटवायला एकत्र पाने गाळतात.",
        },
        detail: {
          en: "Dropping leaves in the dry months is a clever water-saving trick — a leafless tree loses far less moisture while the rains are gone.",
          hi: "शुष्क महीनों में पत्ते गिराना एक चतुर जल-बचत चाल — पत्तीहीन वृक्ष वर्षा गए रहते कहीं कम नमी खोता।",
          mr: "कोरड्या महिन्यांत पाने गाळणे एक हुशार पाणी-बचत युक्ती — पानहीन वृक्ष पाऊस गेलेला असताना कितीतरी कमी ओलावा गमावतो.",
        },
        extra: {
          en: "These forests give India much of its most useful timber — teak, sal and sandalwood among them — and once covered great swathes of the country.",
          hi: "ये वन भारत को इसकी अधिकांश उपयोगी इमारती लकड़ी देते — सागौन, साल और चंदन उनमें — और कभी देश के बड़े हिस्से ढकते।",
          mr: "ही जंगले भारताला त्याचे बहुतांश उपयुक्त इमारती लाकूड देतात — साग, साल आणि चंदन त्यांत — आणि कधीकाळी देशाचे मोठे भाग व्यापत.",
        },
        pair: {
          left: {
            en: "Most widespread, shed leaves in the dry season",
            hi: "सबसे व्यापक, शुष्क ऋतु में पत्ते गिराते",
            mr: "सर्वांत व्यापक, कोरड्या ऋतूत पाने गाळतात",
          },
          right: {
            en: "tropical deciduous forests",
            hi: "उष्णकटिबंधीय पर्णपाती वन",
            mr: "उष्ण कटिबंधीय पानझडी जंगले",
          },
        },
      },
      {
        id: "thorn-forests",
        name: {
          en: "Thorn forests and scrub",
          hi: "काँटेदार वन और झाड़",
          mr: "काटेरी जंगले आणि झुडपे",
        },
        kind: "vegetation",
        prompt: {
          en: "In dry lands with scanty rain, plants survive as low thorny bushes with tiny leaves and long roots that reach deep for water. Which vegetation type is this?",
          hi: "कम वर्षा की शुष्क भूमियों में, पौधे नन्हे पत्तों और पानी को गहरे पहुँचती लंबी जड़ों वाली नीची काँटेदार झाड़ियों के रूप में जीते। यह कौन-सा वनस्पति-प्रकार है?",
          mr: "अल्प पावसाच्या कोरड्या भूमींत, रोपे इवल्या पानांच्या आणि पाण्यासाठी खोल पोहोचणाऱ्या लांब मुळांच्या सखल काटेरी झुडपांच्या रूपात जगतात. हा कोणता वनस्पती-प्रकार?",
        },
        statement: {
          en: "Thorn forests and scrub grow in dry regions of low rainfall; their plants are hardy thorny bushes with small leaves and long, deep roots, all shaped to hoard and hunt for scarce water.",
          hi: "काँटेदार वन और झाड़ कम वर्षा के शुष्क क्षेत्रों में उगते; उनके पौधे नन्हे पत्तों और लंबी, गहरी जड़ों वाली कठोर काँटेदार झाड़ियाँ, सब दुर्लभ पानी को जमा करने-खोजने को गढ़े।",
          mr: "काटेरी जंगले आणि झुडपे अल्प पावसाच्या कोरड्या प्रदेशांत उगवतात; त्यांची रोपे इवल्या पानांच्या आणि लांब, खोल मुळांच्या कणखर काटेरी झुडपे, सारी दुर्मिळ पाणी साठवायला-शोधायला घडलेली.",
        },
        detail: {
          en: "Their tiny leaves, often reduced to spines, lose very little water, and their deep roots probe far down to reach whatever moisture there is.",
          hi: "उनके नन्हे पत्ते, अक्सर काँटों में घटे, बहुत कम पानी खोते, और उनकी गहरी जड़ें जो भी नमी हो उस तक पहुँचने दूर नीचे टटोलतीं।",
          mr: "त्यांची इवली पाने, अनेकदा काट्यांत घटलेली, फार कमी पाणी गमावतात, आणि त्यांची खोल मुळे जो काही ओलावा असेल त्यापर्यंत पोहोचायला दूर खाली चाचपतात.",
        },
        extra: {
          en: "Plants built this way to store and save water are called xerophytes — the desert cactus and the thorny acacia among them.",
          hi: "पानी जमा-बचाने को यों बने पौधे मरुद्भिद कहलाते — मरुस्थल का कैक्टस और काँटेदार बबूल उनमें।",
          mr: "पाणी साठवायला-वाचवायला अशी बनलेली रोपे शुष्कोद्भिद म्हणतात — वाळवंटातील निवडुंग आणि काटेरी बाभूळ त्यांत.",
        },
        pair: {
          left: {
            en: "Thorny, tiny leaves, deep roots, dry land",
            hi: "काँटेदार, नन्हे पत्ते, गहरी जड़ें, शुष्क भूमि",
            mr: "काटेरी, इवली पाने, खोल मुळे, कोरडी जमीन",
          },
          right: {
            en: "thorn forests and scrub",
            hi: "काँटेदार वन और झाड़",
            mr: "काटेरी जंगले आणि झुडपे",
          },
        },
      },
      {
        id: "mangrove",
        name: {
          en: "Mangrove forests",
          hi: "मैंग्रोव वन",
          mr: "कांदळवने",
        },
        kind: "vegetation",
        prompt: {
          en: "Where great rivers meet the tide, salt-tolerant trees stand in the mud on stilted roots that arch out of the water to breathe. Which coastal forest type is this?",
          hi: "जहाँ महान नदियाँ ज्वार से मिलतीं, लवण-सहते वृक्ष कीचड़ में साँस लेने को पानी से बाहर मेहराब बनातीं ठेल-जड़ों पर खड़े। यह कौन-सा तटीय वन-प्रकार है?",
          mr: "जिथे महान नद्या भरतीशी भेटतात, क्षार-सहन वृक्ष चिखलात श्वास घ्यायला पाण्याबाहेर कमान करणाऱ्या टेकू-मुळांवर उभे. हे कोणते किनारी जंगल-प्रकार?",
        },
        statement: {
          en: "Mangrove forests grow in the tidal, salty mud where rivers meet the sea in deltas; their salt-tolerant trees stand on stilt-like roots that arch above the water to breathe.",
          hi: "मैंग्रोव वन ज्वारीय, लवणीय कीचड़ में उगते जहाँ नदियाँ डेल्टाओं में समुद्र से मिलतीं; उनके लवण-सहते वृक्ष साँस लेने को पानी के ऊपर मेहराब बनातीं ठेल-जैसी जड़ों पर खड़े।",
          mr: "कांदळवने भरतीच्या, खाऱ्या चिखलात उगवतात जिथे नद्या त्रिभुजांत समुद्राशी भेटतात; त्यांचे क्षार-सहन वृक्ष श्वास घ्यायला पाण्यावर कमान करणाऱ्या टेकू-मुळांवर उभे.",
        },
        detail: {
          en: "Their tangled roots trap silt and break the force of waves and storm surges, so mangroves shield the coast behind them from the sea.",
          hi: "उनकी उलझी जड़ें गाद फँसातीं और लहरों-तूफ़ानी उछाल का बल तोड़तीं, अतः मैंग्रोव अपने पीछे के तट को समुद्र से बचाते।",
          mr: "त्यांची गुंतागुंतीची मुळे गाळ अडकवतात आणि लाटा-वादळी लोंढ्याचे बळ मोडतात, म्हणून कांदळवने आपल्या मागच्या किनाऱ्याला समुद्रापासून वाचवतात.",
        },
        extra: {
          en: "The Sundarbans in the Ganga–Brahmaputra delta is the world's largest mangrove forest and the famous home of the Royal Bengal tiger.",
          hi: "गंगा-ब्रह्मपुत्र डेल्टा में सुंदरबन दुनिया का सबसे बड़ा मैंग्रोव वन और रॉयल बंगाल टाइगर का प्रसिद्ध घर।",
          mr: "गंगा-ब्रह्मपुत्रा त्रिभुजातील सुंदरबन जगातील सर्वांत मोठे कांदळवन आणि रॉयल बंगाल वाघाचे प्रसिद्ध घर.",
        },
        pair: {
          left: {
            en: "Salt-tolerant, stilt roots in tidal delta mud",
            hi: "लवण-सहते, ज्वारीय डेल्टा कीचड़ में ठेल-जड़ें",
            mr: "क्षार-सहन, भरती त्रिभुज चिखलात टेकू-मुळे",
          },
          right: {
            en: "mangrove forests",
            hi: "मैंग्रोव वन",
            mr: "कांदळवने",
          },
        },
      },
      {
        id: "wildlife-conservation",
        name: {
          en: "Wildlife and conservation",
          hi: "वन्य जीवन और संरक्षण",
          mr: "वन्यजीवन आणि संवर्धन",
        },
        kind: "idea",
        prompt: {
          en: "As forests shrink and hunting takes its toll, many of India's animals grow rare, so the country sets aside protected reserves and special projects to save them. What effort does this describe?",
          hi: "जैसे वन सिकुड़ते और शिकार अपना कर लेता, भारत के कई पशु दुर्लभ होते, अतः देश उन्हें बचाने रक्षित अभयारण्य और विशेष परियोजनाएँ अलग रखता। यह कौन-सा प्रयास बताता?",
          mr: "जसे जंगले आकुंचतात आणि शिकार आपला वाटा घेते, भारताचे अनेक प्राणी दुर्मिळ होतात, म्हणून देश त्यांना वाचवायला रक्षित अभयारण्ये आणि विशेष प्रकल्प वेगळे ठेवतो. हा कोणता प्रयत्न सांगतो?",
        },
        statement: {
          en: "Wildlife conservation protects India's threatened animals as forests shrink and hunting takes its toll — through national parks, wildlife sanctuaries, biosphere reserves, and projects for endangered species like the tiger.",
          hi: "वन्य जीवन संरक्षण वनों के सिकुड़ते और शिकार के कर लेते भारत के संकटग्रस्त पशुओं को बचाता — राष्ट्रीय उद्यानों, वन्यजीव अभयारण्यों, जैवमंडल आरक्षितों, और बाघ जैसी संकटापन्न प्रजातियों की परियोजनाओं से।",
          mr: "वन्यजीवन संवर्धन जंगले आकुंचताना आणि शिकार वाटा घेताना भारताच्या धोक्यातील प्राण्यांना वाचवते — राष्ट्रीय उद्याने, वन्यजीव अभयारण्ये, जीवावरण राखीव, आणि वाघासारख्या धोक्यातील प्रजातींच्या प्रकल्पांतून.",
        },
        detail: {
          en: "Project Tiger, launched to save the vanishing tiger, is among the best-known of these efforts and set aside special tiger reserves across the country.",
          hi: "प्रोजेक्ट टाइगर, लुप्त होते बाघ को बचाने शुरू, इन प्रयासों में सबसे प्रसिद्ध और देश भर विशेष बाघ अभयारण्य अलग रखे।",
          mr: "प्रोजेक्ट टायगर, नाहीशा होणाऱ्या वाघाला वाचवायला सुरू, या प्रयत्नांत सर्वांत प्रसिद्ध आणि देशभर विशेष व्याघ्र राखीव वेगळे ठेवले.",
        },
        extra: {
          en: "Protecting one big animal shelters a whole web of life — save the tiger's forest and you save every creature that shares it.",
          hi: "एक बड़े पशु की रक्षा पूरे जीवन-जाल को आश्रय देती — बाघ का वन बचाओ तो उसे साझा करता हर जीव बचाओ।",
          mr: "एका मोठ्या प्राण्याचे रक्षण संपूर्ण जीवन-जाळ्याला आश्रय देते — वाघाचे जंगल वाचवा तर ते वाटणारा प्रत्येक जीव वाचवा.",
        },
        pair: {
          left: {
            en: "Reserves and projects to save rare species",
            hi: "दुर्लभ प्रजातियाँ बचाने अभयारण्य-परियोजनाएँ",
            mr: "दुर्मिळ प्रजाती वाचवायला राखीव-प्रकल्प",
          },
          right: {
            en: "wildlife conservation",
            hi: "वन्य जीवन संरक्षण",
            mr: "वन्यजीवन संवर्धन",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "In the dry-season months of April and May, a teak forest in central India stands strangely bare, its trees leafless, while an evergreen forest in the Western Ghats stays lush and green. Why do the teak trees drop all their leaves just when a plant might seem to need them most?",
          hi: "अप्रैल-मई के शुष्क महीनों में, मध्य भारत का सागौन वन विचित्र नंगा खड़ा, उसके वृक्ष पत्तीहीन, जबकि पश्चिमी घाट का सदाबहार वन हरा-भरा रहता। सागौन के वृक्ष ठीक तब सारे पत्ते क्यों गिराते जब पौधे को उनकी सबसे अधिक ज़रूरत लगे?",
          mr: "एप्रिल-मे च्या कोरड्या महिन्यांत, मध्य भारतातील सागाचे जंगल विचित्र उघडे उभे, त्याचे वृक्ष पानहीन, तर पश्चिम घाटातील सदाहरित जंगल हिरवेगार राहते. सागाचे वृक्ष नेमके तेव्हा सारी पाने का गाळतात जेव्हा रोपाला त्यांची सर्वांत जास्त गरज वाटावी?",
        },
        choices: [
          {
            en: "Leaves lose water through their surface, so in the dry season a leafy tree would keep drying out with no rain to replace the water; by shedding its leaves the deciduous teak drastically cuts its water loss and survives the drought, growing new leaves when the rains return",
            hi: "पत्ते अपनी सतह से पानी खोते, अतः शुष्क ऋतु में पत्तीदार वृक्ष बिना वर्षा के पानी बदले सूखता रहता; पत्ते गिराकर पर्णपाती सागौन अपनी जल-हानि भारी घटाता और सूखा जीता, वर्षा लौटने पर नए पत्ते उगाता",
            mr: "पाने आपल्या पृष्ठातून पाणी गमावतात, म्हणून कोरड्या ऋतूत पानदार वृक्ष पाऊस नसताना पाणी न बदलता सुकत राहतो; पाने गाळून पानझडी साग आपली पाणी-हानी भारी घटवतो आणि दुष्काळ जगतो, पाऊस परतल्यावर नवी पाने उगवतो",
          },
          {
            en: "The teak trees are simply dying and will not recover",
            hi: "सागौन के वृक्ष बस मर रहे और नहीं सुधरेंगे",
            mr: "सागाचे वृक्ष फक्त मरत आहेत आणि सुधारणार नाहीत",
          },
          {
            en: "Leaves fall because insects eat every one in summer",
            hi: "पत्ते गिरते क्योंकि कीट ग्रीष्म में हर एक खा जाते",
            mr: "पाने पडतात कारण किडी उन्हाळ्यात प्रत्येक खातात",
          },
          {
            en: "The trees shed leaves to make themselves lighter against summer winds",
            hi: "वृक्ष ग्रीष्म हवाओं के विरुद्ध हल्के होने को पत्ते गिराते",
            mr: "वृक्ष उन्हाळी वाऱ्यांविरुद्ध हलके होण्यासाठी पाने गाळतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The bare teak forest is not dying — it is doing something clever to stay alive. A leaf is where a plant makes its food, but it is also where a plant loses water: leaves are dotted with tiny pores that let water vapour escape as the plant breathes. In the wet season that loss is easily replaced by rain and moist soil, so leaves are pure benefit. But in the fierce dry months of April and May, with no rain falling and the soil parched, a tree covered in leaves would go on losing water it cannot replace, and could die of thirst. The deciduous trees of the monsoon forest solve this by dropping all their leaves together as the dry season sets in. A leafless tree loses very little water; it goes dormant, living off stored reserves, and simply waits out the drought. When the monsoon returns and water is plentiful again, it flushes out fresh new leaves and resumes growth. So shedding leaves is not weakness or death but a survival strategy timed to the climate — which is exactly why these are called 'deciduous' or monsoon forests. The evergreen forests of the Western Ghats do not need this trick because rain falls on them almost all year, so they never face a dry season to survive and can afford to keep their leaves. Same country, two different answers to the same question of water.",
          hi: "नंगा सागौन वन मर नहीं रहा — वह जीवित रहने को कुछ चतुर कर रहा। पत्ता वह जहाँ पौधा अपना भोजन बनाता, पर वह भी जहाँ पौधा पानी खोता: पत्ते नन्हे छिद्रों से बिंदित जो पौधे के साँस लेते जल-वाष्प बचने देते। गीली ऋतु में वह हानि वर्षा और नम मिट्टी से आसानी बदली, अतः पत्ते शुद्ध लाभ। पर अप्रैल-मई के प्रचंड शुष्क महीनों में, बिना वर्षा और झुलसी मिट्टी के, पत्तों से ढका वृक्ष वह पानी खोता रहता जो बदल नहीं सकता, और प्यास से मर सकता। मानसून वन के पर्णपाती वृक्ष इसे शुष्क ऋतु आते सारे पत्ते एक साथ गिराकर सुलझाते। पत्तीहीन वृक्ष बहुत कम पानी खोता; वह सुप्त होता, जमा भंडार पर जीता, और बस सूखा काट देता। जब मानसून लौटता और पानी फिर भरपूर, वह ताज़े नए पत्ते फूटता और वृद्धि फिर शुरू करता। अतः पत्ते गिराना कमज़ोरी या मृत्यु नहीं बल्कि जलवायु से समयबद्ध जीवन-रणनीति — ठीक इसीलिए ये 'पर्णपाती' या मानसून वन कहलाते। पश्चिमी घाट के सदाबहार वनों को यह चाल नहीं चाहिए क्योंकि उन पर लगभग साल भर वर्षा गिरती, अतः वे कभी सूखी ऋतु नहीं झेलते और अपने पत्ते रख सकते। एक ही देश, पानी के उसी सवाल के दो भिन्न उत्तर।",
          mr: "उघडे सागाचे जंगल मरत नाही — ते जिवंत राहायला काहीतरी हुशार करत आहे. पान जिथे रोप आपले अन्न बनवते, पण तेच जिथे रोप पाणी गमावते: पाने इवल्या छिद्रांनी नटलेली जी रोपाच्या श्वासात जल-बाष्प निसटू देतात. ओल्या ऋतूत ती हानी पाऊस आणि ओल्या मातीने सहज बदलली, म्हणून पाने शुद्ध लाभ. पण एप्रिल-मे च्या प्रचंड कोरड्या महिन्यांत, पाऊस नसताना आणि माती करपलेली, पानांनी झाकलेला वृक्ष ते पाणी गमावत राहतो जे बदलू शकत नाही, आणि तहानेने मरू शकतो. मान्सून जंगलाचे पानझडी वृक्ष हे कोरडा ऋतू येताना सारी पाने एकत्र गाळून सोडवतात. पानहीन वृक्ष फार कमी पाणी गमावतो; तो सुप्त होतो, साठलेल्या साठ्यावर जगतो, आणि फक्त दुष्काळ काढतो. जेव्हा मान्सून परततो आणि पाणी पुन्हा भरपूर, तो ताजी नवी पाने फुटवतो आणि वाढ पुन्हा सुरू करतो. म्हणून पाने गाळणे कमजोरी वा मृत्यू नव्हे तर हवामानाशी वेळबद्ध जगण्याची रणनीती — नेमके म्हणूनच यांना 'पानझडी' किंवा मान्सून जंगले म्हणतात. पश्चिम घाटातील सदाहरित जंगलांना ही युक्ती नको कारण त्यांवर जवळपास वर्षभर पाऊस पडतो, म्हणून त्यांना कधी कोरडा ऋतू सोसावा लागत नाही आणि ती आपली पाने ठेवू शकतात. एकच देश, पाण्याच्या त्याच प्रश्नाची दोन वेगळी उत्तरे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Within a single country you can travel from dripping evergreen jungle to leaf-shedding monsoon forest to spiny desert scrub, all sharing much the same sunshine and warmth. What decides which kind of natural vegetation grows where?",
          hi: "एक ही देश के भीतर तुम टपकते सदाबहार जंगल से पत्ती-गिराते मानसून वन से काँटेदार मरुस्थल झाड़ तक यात्रा कर सकते, सब लगभग वही धूप-गरमी साझा करते। कौन तय करता कहाँ किस प्रकार की प्राकृतिक वनस्पति उगे?",
          mr: "एकाच देशाच्या आत तू ठिबकणाऱ्या सदाहरित जंगलापासून पान-गाळणाऱ्या मान्सून जंगलापर्यंत काटेरी वाळवंट झुडपापर्यंत प्रवास करू शकतोस, सारे जवळपास तेच ऊन-ऊब वाटत. कोण ठरवतो कुठे कोणत्या प्रकारची नैसर्गिक वनस्पती उगवेल?",
        },
        choices: [
          {
            en: "Chiefly the amount of rainfall a place receives: heavy year-round rain grows dense evergreen forest, moderate seasonal rain grows deciduous monsoon forest, and scanty rain grows only thorny drought-adapted scrub — so the vegetation belt shifts as you move from wet regions to dry ones",
            hi: "मुख्यतः किसी स्थान की मिली वर्षा की मात्रा: भारी साल भर वर्षा घना सदाबहार वन उगाती, मध्यम मौसमी वर्षा पर्णपाती मानसून वन, और कम वर्षा केवल काँटेदार सूखा-अनुकूल झाड़ — अतः वनस्पति-पेटी बदलती जैसे तुम गीले क्षेत्रों से शुष्क की ओर बढ़ते",
            mr: "मुख्यतः एखाद्या ठिकाणाला मिळणाऱ्या पावसाचे प्रमाण: भारी वर्षभर पाऊस घनदाट सदाहरित जंगल उगवतो, मध्यम हंगामी पाऊस पानझडी मान्सून जंगल, आणि अल्प पाऊस फक्त काटेरी दुष्काळ-जुळलेले झुडूप — म्हणून वनस्पती-पट्टा बदलतो जसा तू ओल्या प्रदेशांतून कोरड्याकडे सरकतोस",
          },
          {
            en: "Only the colour of the soil decides, nothing to do with rain",
            hi: "केवल मिट्टी का रंग तय करता, वर्षा से कोई संबंध नहीं",
            mr: "फक्त मातीचा रंग ठरवतो, पावसाशी काही संबंध नाही",
          },
          {
            en: "All three forests need exactly the same rainfall and differ only by chance",
            hi: "तीनों वनों को ठीक वही वर्षा चाहिए और वे केवल संयोग से भिन्न",
            mr: "तिन्ही जंगलांना नेमका तोच पाऊस हवा आणि ती फक्त योगायोगाने वेगळी",
          },
          {
            en: "The government plants whichever forest type it prefers in each region",
            hi: "सरकार हर क्षेत्र में जो वन-प्रकार पसंद करे वही रोपती",
            mr: "सरकार प्रत्येक प्रदेशात जो जंगल-प्रकार आवडेल तो लावते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Across most of India the warmth and sunshine are broadly similar, so the factor that changes dramatically from place to place — and therefore does most to decide the vegetation — is rainfall. Natural vegetation is not planted; over long ages the plants that survive in a place are those suited to its water supply, so the plant cover becomes a living map of the rainfall. Where rain is very heavy and falls almost all year round, plants never lack water, and lush, dense, tall evergreen forests can flourish, keeping their leaves the whole time. Where the rain is moderate and, crucially, seasonal — a wet monsoon followed by a long dry spell — the forest adapts by dropping its leaves in the dry months to save water; these are the deciduous or monsoon forests, and because so much of India has exactly this moderate seasonal rainfall, they are the most widespread type. Where rain is genuinely scarce, as in the western desert and rain-shadow zones, only the toughest drought-adapted plants can survive: low thorny scrub with tiny leaves, waxy skins and long, deep roots to hunt for what little water there is. So travelling from a wet coast or hillside inland to a dry desert, you pass through evergreen, then deciduous, then thorn vegetation — not because the sun changes, but because the rain does. (Height matters too, giving cold mountain and alpine vegetation up in the Himalayas, but for the lowland belts it is rainfall that draws the boundaries.) The forest, in effect, is the rainfall made visible.",
          hi: "भारत के अधिकांश में गरमी-धूप मोटे तौर समान, अतः वह कारक जो स्थान-दर-स्थान नाटकीय बदलता — और इसलिए वनस्पति तय करने में सबसे अधिक करता — वर्षा है। प्राकृतिक वनस्पति रोपी नहीं; लंबे युगों में किसी स्थान में जो पौधे जीते वे उसकी जल-आपूर्ति के अनुकूल, अतः पादप-आवरण वर्षा का जीवित मानचित्र बनता। जहाँ वर्षा बहुत भारी और लगभग साल भर गिरती, पौधों को कभी पानी की कमी नहीं, और हरे-भरे, घने, ऊँचे सदाबहार वन फल-फूल सकते, साल भर पत्ते रखते। जहाँ वर्षा मध्यम और, मुख्यतः, मौसमी — गीले मानसून के बाद लंबा शुष्क दौर — वन शुष्क महीनों में पानी बचाने पत्ते गिराकर ढलता; ये पर्णपाती या मानसून वन, और क्योंकि भारत के इतने भाग में ठीक यही मध्यम मौसमी वर्षा, वे सबसे व्यापक प्रकार। जहाँ वर्षा सचमुच दुर्लभ, पश्चिमी मरुस्थल और वृष्टि-छाया क्षेत्रों जैसे, केवल सबसे कठोर सूखा-अनुकूल पौधे जीते: नन्हे पत्तों, मोमी त्वचा और जो थोड़ा पानी हो उसे खोजती लंबी, गहरी जड़ों वाली नीची काँटेदार झाड़। अतः गीले तट या पहाड़ी से भीतर शुष्क मरुस्थल यात्रा करते, तुम सदाबहार, फिर पर्णपाती, फिर काँटेदार वनस्पति से गुज़रते — इसलिए नहीं कि सूरज बदलता, बल्कि वर्षा बदलती। (ऊँचाई भी मायने रखती, हिमालय ऊपर ठंडी पर्वत-अल्पाइन वनस्पति देते, पर निचली पेटियों को वर्षा ही सीमाएँ खींचती।) वन, वस्तुतः, वर्षा दृश्य बनी।",
          mr: "भारताच्या बहुतांश भागात ऊब-ऊन ढोबळमानाने समान, म्हणून जो घटक ठिकाणोठिकाणी नाट्यमय बदलतो — आणि म्हणून वनस्पती ठरवण्यात सर्वांत जास्त करतो — तो पाऊस आहे. नैसर्गिक वनस्पती लावलेली नाही; दीर्घ युगांत एखाद्या ठिकाणी जी रोपे जगतात ती त्याच्या पाणी-पुरवठ्याशी जुळलेली, म्हणून वनस्पती-आच्छादन पावसाचा जिवंत नकाशा बनते. जिथे पाऊस अतिशय भारी आणि जवळपास वर्षभर पडतो, रोपांना कधी पाण्याची कमतरता नाही, आणि हिरवीगार, घनदाट, उंच सदाहरित जंगले बहरू शकतात, वर्षभर पाने ठेवत. जिथे पाऊस मध्यम आणि, मुख्यतः, हंगामी — ओला मान्सून त्यानंतर लांब कोरडा काळ — जंगल कोरड्या महिन्यांत पाणी वाचवायला पाने गाळून जुळवते; ही पानझडी किंवा मान्सून जंगले, आणि कारण भारताच्या इतक्या भागात नेमका हाच मध्यम हंगामी पाऊस, ती सर्वांत व्यापक प्रकार. जिथे पाऊस खरोखर दुर्मिळ, पश्चिमी वाळवंट आणि पर्जन्यछाया प्रदेशांसारखा, फक्त सर्वांत कणखर दुष्काळ-जुळलेली रोपे जगतात: इवल्या पानांच्या, मेणचट कातडीच्या आणि जो थोडा पाणी असेल तो शोधणाऱ्या लांब, खोल मुळांच्या सखल काटेरी झुडपे. म्हणून ओल्या किनाऱ्यापासून वा टेकडीपासून आत कोरड्या वाळवंटाकडे प्रवास करताना, तू सदाहरित, मग पानझडी, मग काटेरी वनस्पतीतून जातोस — म्हणून नाही की सूर्य बदलतो, तर पाऊस बदलतो. (उंचीही महत्त्वाची, हिमालयात वर थंड पर्वत-अल्पाइन वनस्पती देत, पण सखल पट्ट्यांना पाऊसच सीमा आखतो.) जंगल, प्रत्यक्षात, पाऊस दृश्य झालेला.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Population                                                  */
  /* ----------------------------------------------------------------------- */
  {
    slug: "geography-9-population",
    subject: "GEOGRAPHY",
    classLevel: 9,
    chapter: {
      en: "Chapter 6 — Population",
      hi: "अध्याय 6 — जनसंख्या",
      mr: "प्रकरण 6 — लोकसंख्या",
    },
    name: {
      en: "Population",
      hi: "जनसंख्या",
      mr: "लोकसंख्या",
    },
    summary: {
      en: "The people themselves, counted and read: how many there are and how unevenly they are spread, how fast the number changes and why it keeps rising even as growth slows, the balance of children and workers and elders, and the schooling and health that turn a crowd into a resource.",
      hi: "स्वयं लोग, गिने और पढ़े: कितने हैं और कितने असमान बिखरे, संख्या कितनी तेज़ बदलती और क्यों बढ़ती रहती भले वृद्धि धीमी हो, बच्चों-कामगारों-बुज़ुर्गों का संतुलन, और वह शिक्षा-स्वास्थ्य जो भीड़ को संसाधन बनाते।",
      mr: "स्वतः लोक, मोजलेले आणि वाचलेले: किती आहेत आणि किती असमान पसरलेले, संख्या किती जलद बदलते आणि वाढ मंदावली तरी का वाढत राहते, मुले-कामगार-वृद्धांचा समतोल, आणि ते शिक्षण-आरोग्य जे गर्दीला संसाधन बनवते.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "size-distribution",
        name: {
          en: "Size and distribution",
          hi: "आकार और वितरण",
          mr: "आकार आणि वितरण",
        },
        kind: "idea",
        prompt: {
          en: "India holds more than a billion people, but they are packed thick on the fertile river plains and thin across deserts and mountains. What twin facts about the population does this describe?",
          hi: "भारत में एक अरब से अधिक लोग, पर वे उपजाऊ नदी-मैदानों पर घने और मरुस्थलों-पर्वतों में पतले भरे। जनसंख्या के बारे में यह कौन-से दो तथ्य बताता?",
          mr: "भारतात एक अब्जाहून अधिक लोक, पण ते सुपीक नदी-मैदानांवर दाट आणि वाळवंटे-पर्वतांत विरळ भरलेले. लोकसंख्येबद्दल हे कोणते जुळे तथ्य सांगते?",
        },
        statement: {
          en: "India has one of the world's largest populations, over a billion people, but they are very unevenly distributed — densely packed on the fertile plains and sparse across deserts, forests and high mountains.",
          hi: "भारत की दुनिया की सबसे बड़ी जनसंख्याओं में एक, एक अरब से अधिक लोग, पर वे बहुत असमान वितरित — उपजाऊ मैदानों पर घने और मरुस्थलों, वनों और ऊँचे पर्वतों में विरल।",
          mr: "भारताची जगातील सर्वांत मोठ्या लोकसंख्यांपैकी एक, एक अब्जाहून अधिक लोक, पण ते अतिशय असमान वितरित — सुपीक मैदानांवर दाट आणि वाळवंटे, जंगले आणि उंच पर्वतांत विरळ.",
        },
        detail: {
          en: "Population density — the number of people per square kilometre — is very high in the Northern Plains and low in rugged or dry regions.",
          hi: "जनसंख्या घनत्व — प्रति वर्ग किलोमीटर लोगों की संख्या — उत्तरी मैदानों में बहुत ऊँचा और उबड़-खाबड़ या शुष्क क्षेत्रों में कम।",
          mr: "लोकसंख्या घनता — प्रति चौरस किलोमीटर लोकांची संख्या — उत्तर मैदानांत अतिशय जास्त आणि खडबडीत वा कोरड्या प्रदेशांत कमी.",
        },
        extra: {
          en: "People gather where the land can feed them — flat, fertile, well-watered ground — which is why the river plains have always been the most crowded.",
          hi: "लोग वहाँ जुटते जहाँ भूमि उन्हें पाल सके — समतल, उपजाऊ, सुजल भूमि — इसी से नदी-मैदान सदा सबसे भीड़-भरे।",
          mr: "लोक तिथे जमतात जिथे जमीन त्यांना पोसू शकते — सपाट, सुपीक, सुजल जमीन — म्हणूनच नदी-मैदाने नेहमी सर्वांत गर्दीची.",
        },
        pair: {
          left: {
            en: "Huge in number, unevenly spread",
            hi: "संख्या में विशाल, असमान बिखरे",
            mr: "संख्येने प्रचंड, असमान पसरलेले",
          },
          right: {
            en: "size and distribution",
            hi: "आकार और वितरण",
            mr: "आकार आणि वितरण",
          },
        },
      },
      {
        id: "growth-rate",
        name: {
          en: "Population growth and its rate",
          hi: "जनसंख्या वृद्धि और उसकी दर",
          mr: "लोकसंख्या वाढ आणि तिचा दर",
        },
        kind: "idea",
        prompt: {
          en: "Each year India adds many millions of people, yet the percentage by which it grows has actually been falling for decades. What idea distinguishes the total added from the speed of adding?",
          hi: "हर वर्ष भारत कई करोड़ लोग जोड़ता, फिर भी जिस प्रतिशत से वह बढ़ता वह वास्तव में दशकों से गिर रहा। कौन-सा विचार कुल जोड़े को जोड़ने की गति से अलग करता?",
          mr: "दरवर्षी भारत अनेक कोटी लोक जोडतो, तरी ज्या टक्केवारीने तो वाढतो ती खरे तर दशके घसरत आहे. कोणती कल्पना एकूण जोडलेल्याला जोडण्याच्या वेगापासून वेगळे करते?",
        },
        statement: {
          en: "Population growth is the change in the number of people over time, while the growth rate is the percentage by which it increases each year — and India's growth rate has been declining even as the total still rises.",
          hi: "जनसंख्या वृद्धि समय के साथ लोगों की संख्या में परिवर्तन, जबकि वृद्धि दर वह प्रतिशत जिससे वह हर वर्ष बढ़ती — और भारत की वृद्धि दर गिरती रही भले कुल अब भी बढ़ती।",
          mr: "लोकसंख्या वाढ काळानुसार लोकांच्या संख्येतील बदल, तर वाढदर ती टक्केवारी जिने ती दरवर्षी वाढते — आणि भारताचा वाढदर घसरत राहिला जरी एकूण अजून वाढते.",
        },
        detail: {
          en: "This growth has three sources: births adding people, deaths removing them, and migration moving people in or out across borders.",
          hi: "इस वृद्धि के तीन स्रोत: जन्म लोग जोड़ते, मृत्यु उन्हें हटाती, और प्रवास सीमाओं पार लोगों को भीतर-बाहर ले जाता।",
          mr: "या वाढीचे तीन स्रोत: जन्म लोक जोडतात, मृत्यू त्यांना काढतो, आणि स्थलांतर सीमांपार लोकांना आत-बाहेर नेते.",
        },
        extra: {
          en: "A falling growth rate does not mean the population is shrinking — it means it is still growing, but a little more slowly each year.",
          hi: "गिरती वृद्धि दर का अर्थ जनसंख्या सिकुड़ना नहीं — अर्थ वह अब भी बढ़ती, पर हर वर्ष थोड़ी अधिक धीरे।",
          mr: "घसरता वाढदर म्हणजे लोकसंख्या आकुंचणे नाही — अर्थ ती अजून वाढते, पण दरवर्षी थोडी अधिक हळू.",
        },
        pair: {
          left: {
            en: "The yearly percentage of increase",
            hi: "वृद्धि का वार्षिक प्रतिशत",
            mr: "वाढीची वार्षिक टक्केवारी",
          },
          right: {
            en: "the growth rate",
            hi: "वृद्धि दर",
            mr: "वाढदर",
          },
        },
      },
      {
        id: "natural-increase",
        name: {
          en: "Births, deaths and natural increase",
          hi: "जन्म, मृत्यु और प्राकृतिक वृद्धि",
          mr: "जन्म, मृत्यू आणि नैसर्गिक वाढ",
        },
        kind: "idea",
        prompt: {
          en: "When a country's yearly births outnumber its deaths, the gap between them is the surplus by which the population swells on its own. What is this excess of births over deaths called?",
          hi: "जब किसी देश के वार्षिक जन्म उसकी मृत्यु से अधिक, उनके बीच का अंतर वह अधिशेष जिससे जनसंख्या स्वयं फूलती। जन्मों की मृत्युओं पर इस अधिकता को क्या कहते?",
          mr: "जेव्हा एखाद्या देशाचे वार्षिक जन्म त्याच्या मृत्यूंहून अधिक, त्यांच्यातील फरक तो अतिरिक्त ज्याने लोकसंख्या स्वतः फुगते. जन्मांच्या मृत्यूंवरच्या या आधिक्याला काय म्हणतात?",
        },
        statement: {
          en: "Natural increase is the excess of births over deaths in a year; India's population has grown fast because its death rate fell sharply with better health while its birth rate came down only slowly.",
          hi: "प्राकृतिक वृद्धि किसी वर्ष जन्मों की मृत्युओं पर अधिकता; भारत की जनसंख्या तेज़ बढ़ी क्योंकि बेहतर स्वास्थ्य से मृत्यु दर तेज़ गिरी जबकि जन्म दर केवल धीरे उतरी।",
          mr: "नैसर्गिक वाढ एखाद्या वर्षी जन्मांचे मृत्यूंवरचे आधिक्य; भारताची लोकसंख्या जलद वाढली कारण उत्तम आरोग्याने मृत्युदर झपाट्याने घसरला तर जन्मदर फक्त हळू उतरला.",
        },
        detail: {
          en: "Better food, clean water, medicine and vaccines cut the death rate quickly; the birth rate, tied to custom and circumstance, took much longer to fall.",
          hi: "बेहतर भोजन, स्वच्छ पानी, दवा और टीके मृत्यु दर जल्दी घटाते; जन्म दर, रिवाज़ और परिस्थिति से बँधी, गिरने में बहुत अधिक समय लेती।",
          mr: "उत्तम अन्न, स्वच्छ पाणी, औषध आणि लस मृत्युदर लवकर घटवतात; जन्मदर, रूढी आणि परिस्थितीशी बांधलेला, घसरायला बराच अधिक वेळ घेतो.",
        },
        extra: {
          en: "The wide gap between a fast-falling death rate and a slow-falling birth rate is exactly why the population climbed so steeply for decades.",
          hi: "तेज़-गिरती मृत्यु दर और धीमी-गिरती जन्म दर के बीच चौड़ा अंतर ठीक यही कि जनसंख्या दशकों इतनी तेज़ चढ़ी।",
          mr: "जलद-घसरत्या मृत्युदर आणि मंद-घसरत्या जन्मदरातील रुंद फरक नेमके हेच की लोकसंख्या दशके इतकी तीव्र चढली.",
        },
        pair: {
          left: {
            en: "Births minus deaths in a year",
            hi: "किसी वर्ष जन्म घटा मृत्यु",
            mr: "एखाद्या वर्षी जन्म वजा मृत्यू",
          },
          right: {
            en: "natural increase",
            hi: "प्राकृतिक वृद्धि",
            mr: "नैसर्गिक वाढ",
          },
        },
      },
      {
        id: "age-structure",
        name: {
          en: "Age structure",
          hi: "आयु संरचना",
          mr: "वयोरचना",
        },
        kind: "idea",
        prompt: {
          en: "A population can be sorted into children who are still growing, adults of working age who earn and produce, and the elderly who have retired. What is this division of the people by age called?",
          hi: "जनसंख्या को अब भी बढ़ते बच्चों, कमाते-उत्पादन करते कार्यशील आयु के वयस्कों, और सेवानिवृत्त बुज़ुर्गों में छाँटा जा सकता। लोगों के इस आयु-अनुसार विभाजन को क्या कहते?",
          mr: "लोकसंख्या अजून वाढणाऱ्या मुलांत, कमावणाऱ्या-उत्पादन करणाऱ्या कार्यक्षम वयाच्या प्रौढांत, आणि निवृत्त वृद्धांत वेगळी करता येते. लोकांच्या या वयानुसार विभागणीला काय म्हणतात?",
        },
        statement: {
          en: "The age structure is the division of a population into age groups — children, working-age adults, and the aged — showing how many depend and how many can work and produce.",
          hi: "आयु संरचना जनसंख्या का आयु-समूहों में विभाजन — बच्चे, कार्यशील आयु के वयस्क, और वृद्ध — दिखाती कितने निर्भर और कितने काम-उत्पादन कर सकते।",
          mr: "वयोरचना लोकसंख्येची वयोगटांत विभागणी — मुले, कार्यक्षम वयाचे प्रौढ, आणि वृद्ध — दाखवते किती अवलंबून आणि किती काम-उत्पादन करू शकतात.",
        },
        detail: {
          en: "India has a large share of young, working-age people — a 'demographic dividend' that can power growth if they are educated and given jobs.",
          hi: "भारत में युवा, कार्यशील आयु के लोगों का बड़ा हिस्सा — एक 'जनसांख्यिकीय लाभांश' जो वृद्धि को शक्ति दे सकता यदि वे शिक्षित और रोज़गार पाएँ।",
          mr: "भारतात तरुण, कार्यक्षम वयाच्या लोकांचा मोठा वाटा — एक 'लोकसंख्याशास्त्रीय लाभांश' जो वाढीला शक्ती देऊ शकतो जर ते शिक्षित आणि रोजगार मिळाले.",
        },
        extra: {
          en: "The same youthful bulge is only an opportunity, not a guarantee — without schooling and work, many hands can mean strain rather than strength.",
          hi: "वही युवा उभार केवल अवसर, गारंटी नहीं — शिक्षा-काम बिना, अनेक हाथ शक्ति के बजाय दबाव का अर्थ हो सकते।",
          mr: "तोच तरुण फुगवटा फक्त संधी, हमी नाही — शिक्षण-कामाविना, अनेक हात शक्तीऐवजी ताणाचा अर्थ असू शकतात.",
        },
        pair: {
          left: {
            en: "The people sorted into children, workers, elders",
            hi: "बच्चों, कामगारों, बुज़ुर्गों में छँटे लोग",
            mr: "मुले, कामगार, वृद्धांत वेगळे केलेले लोक",
          },
          right: {
            en: "age structure",
            hi: "आयु संरचना",
            mr: "वयोरचना",
          },
        },
      },
      {
        id: "quality-population",
        name: {
          en: "The quality of the population",
          hi: "जनसंख्या की गुणवत्ता",
          mr: "लोकसंख्येची गुणवत्ता",
        },
        kind: "idea",
        prompt: {
          en: "Beyond mere numbers, what a population can achieve depends on how healthy, well-fed, educated and skilled its people are. What do we call this measure of a population's capability?",
          hi: "केवल संख्या से परे, जनसंख्या क्या हासिल कर सकती वह इस पर निर्भर कि उसके लोग कितने स्वस्थ, सुपोषित, शिक्षित और कुशल। जनसंख्या की क्षमता के इस माप को हम क्या कहते?",
          mr: "केवळ संख्येपलीकडे, लोकसंख्या काय साध्य करू शकते हे यावर अवलंबून की तिचे लोक किती निरोगी, सुपोषित, शिक्षित आणि कुशल. लोकसंख्येच्या क्षमतेच्या या मापाला आपण काय म्हणतो?",
        },
        statement: {
          en: "The quality of a population is measured by its health, literacy, education and skills — the things that decide how much its people can contribute, turning sheer numbers into a productive resource.",
          hi: "जनसंख्या की गुणवत्ता उसके स्वास्थ्य, साक्षरता, शिक्षा और कौशल से मापी — वे चीज़ें जो तय करतीं उसके लोग कितना योगदान दे सकते, कोरी संख्या को उत्पादक संसाधन बनाते।",
          mr: "लोकसंख्येची गुणवत्ता तिच्या आरोग्य, साक्षरता, शिक्षण आणि कौशल्याने मोजली — त्या गोष्टी ज्या ठरवतात तिचे लोक किती योगदान देऊ शकतात, निव्वळ संख्येला उत्पादक संसाधन बनवत.",
        },
        detail: {
          en: "An educated, healthy person can work more skilfully and earn more, so raising the quality of the population lifts the whole country's prosperity.",
          hi: "शिक्षित, स्वस्थ व्यक्ति अधिक कुशलता से काम कर अधिक कमा सकता, अतः जनसंख्या की गुणवत्ता उठाना पूरे देश की समृद्धि उठाता।",
          mr: "शिक्षित, निरोगी व्यक्ती अधिक कौशल्याने काम करून अधिक कमावू शकते, म्हणून लोकसंख्येची गुणवत्ता उंचावणे अख्ख्या देशाची समृद्धी उंचावते.",
        },
        extra: {
          en: "This is why schools, hospitals and skills training are treated not as costs but as investments in the people themselves.",
          hi: "इसी से स्कूल, अस्पताल और कौशल-प्रशिक्षण लागत नहीं बल्कि स्वयं लोगों में निवेश माने जाते।",
          mr: "म्हणूनच शाळा, रुग्णालये आणि कौशल्य-प्रशिक्षण खर्च नव्हे तर स्वतः लोकांतील गुंतवणूक मानले जातात.",
        },
        pair: {
          left: {
            en: "Health, literacy and skills of the people",
            hi: "लोगों का स्वास्थ्य, साक्षरता और कौशल",
            mr: "लोकांचे आरोग्य, साक्षरता आणि कौशल्य",
          },
          right: {
            en: "the quality of the population",
            hi: "जनसंख्या की गुणवत्ता",
            mr: "लोकसंख्येची गुणवत्ता",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "News reports say India's population growth RATE has been falling for years, and yet each year the country still adds tens of millions of people. How can the population keep rising fast while its growth rate goes down?",
          hi: "समाचार कहते भारत की जनसंख्या वृद्धि दर वर्षों से गिर रही, फिर भी हर वर्ष देश अब भी करोड़ों लोग जोड़ता। जनसंख्या तेज़ बढ़ती कैसे रह सकती जबकि उसकी वृद्धि दर नीचे जाती?",
          mr: "बातम्या सांगतात भारताचा लोकसंख्या वाढदर वर्षानुवर्षे घसरत आहे, तरी दरवर्षी देश अजून कोट्यवधी लोक जोडतो. लोकसंख्या जलद वाढत कशी राहू शकते तर तिचा वाढदर खाली जातो?",
        },
        choices: [
          {
            en: "A growth rate is a percentage, and a smaller percentage of a very large population can still be a huge number of people; because India's base is so large, even a falling rate adds tens of millions each year — the rate is slowing but the total keeps climbing",
            hi: "वृद्धि दर एक प्रतिशत, और बहुत बड़ी जनसंख्या का छोटा प्रतिशत भी विशाल संख्या हो सकता; क्योंकि भारत का आधार इतना बड़ा, गिरती दर भी हर वर्ष करोड़ों जोड़ती — दर धीमी पर कुल चढ़ता रहता",
            mr: "वाढदर एक टक्केवारी, आणि अतिशय मोठ्या लोकसंख्येची लहान टक्केवारीही प्रचंड संख्या असू शकते; कारण भारताचा पाया इतका मोठा, घसरता दरही दरवर्षी कोट्यवधी जोडतो — दर मंदावतो पण एकूण चढत राहते",
          },
          {
            en: "The reports must be wrong; a falling rate always means a falling population",
            hi: "समाचार ग़लत होंगे; गिरती दर सदा गिरती जनसंख्या का अर्थ",
            mr: "बातम्या चुकीच्या असतील; घसरता दर नेहमी घसरती लोकसंख्या",
          },
          {
            en: "The population rises only because people are living forever now",
            hi: "जनसंख्या केवल इसलिए बढ़ती क्योंकि लोग अब सदा जीते",
            mr: "लोकसंख्या फक्त म्हणून वाढते कारण लोक आता सदैव जगतात",
          },
          {
            en: "Growth rate and population size are unrelated to each other",
            hi: "वृद्धि दर और जनसंख्या आकार एक-दूसरे से असंबंधित",
            mr: "वाढदर आणि लोकसंख्या आकार एकमेकांशी असंबंधित",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The apparent paradox dissolves once you see that a growth rate is a percentage, and a percentage is always taken of something. The number of people added in a year is the growth rate multiplied by the size of the population that already exists. India's population is enormous — well over a billion — so even a modest percentage of it is a very large number. Suppose the growth rate is around 1% and the population is 1.4 billion: 1% of 1.4 billion is still 14 million people added in a single year. If the rate then eases to 0.9%, that is a genuine slowing, but 0.9% of an even larger base is still well over ten million new people. So the two statements are not in conflict at all: the RATE (the percentage) is falling, which means the population is growing a little less quickly than before, while the ABSOLUTE number added each year stays huge because it is a slice of such a vast base. There is also a second reason the total keeps climbing, called population momentum: because past high birth rates left India with a very large number of young people, a big generation is now entering its child-bearing years, so even with smaller families the sheer number of parents keeps births high for a long time. Only when the rate falls much further, and this youthful bulge ages, will the yearly additions finally shrink. Falling rate, still-rising total — both true, and both explained by the size of the base.",
          hi: "आभासी विरोधाभास तब घुल जाता जब देखो वृद्धि दर एक प्रतिशत, और प्रतिशत सदा किसी का लिया जाता। किसी वर्ष जोड़े लोगों की संख्या वृद्धि दर गुणा पहले से मौजूद जनसंख्या का आकार। भारत की जनसंख्या विशाल — एक अरब से बहुत ऊपर — अतः उसका मामूली प्रतिशत भी बहुत बड़ी संख्या। मान लो वृद्धि दर लगभग 1% और जनसंख्या 1.4 अरब: 1.4 अरब का 1% अब भी एक ही वर्ष में 1.4 करोड़ लोग जोड़े। यदि दर फिर 0.9% पर ढीली हो, वह सचमुच धीमापन, पर और बड़े आधार का 0.9% अब भी एक करोड़ से बहुत ऊपर नए लोग। अतः दोनों कथन बिलकुल विरोध में नहीं: दर (प्रतिशत) गिरती, अर्थ जनसंख्या पहले से थोड़ी कम तेज़ बढ़ती, जबकि हर वर्ष जोड़ी निरपेक्ष संख्या विशाल रहती क्योंकि वह इतने विशाल आधार का टुकड़ा। कुल चढ़ते रहने का दूसरा कारण भी, जनसंख्या संवेग कहलाता: क्योंकि बीती ऊँची जन्म दर ने भारत को युवा लोगों की बहुत बड़ी संख्या दी, एक बड़ी पीढ़ी अब अपने बच्चे-जनने वर्षों में प्रवेश कर रही, अतः छोटे परिवारों से भी माता-पिता की कोरी संख्या जन्म लंबे समय ऊँचे रखती। केवल जब दर बहुत और गिरे, और यह युवा उभार बूढ़ा हो, तब वार्षिक जोड़ अंततः सिकुड़ेंगे। गिरती दर, फिर भी चढ़ता कुल — दोनों सच, और दोनों आधार के आकार से समझाए।",
          mr: "आभासी विरोधाभास तेव्हा विरघळतो जेव्हा पाहतोस वाढदर एक टक्केवारी, आणि टक्केवारी नेहमी कशाची तरी घेतली जाते. एखाद्या वर्षी जोडलेल्या लोकांची संख्या वाढदर गुणिले आधीच अस्तित्वात असलेल्या लोकसंख्येचा आकार. भारताची लोकसंख्या प्रचंड — एक अब्जाहून बरीच वर — म्हणून तिची माफक टक्केवारीही अतिशय मोठी संख्या. समजा वाढदर सुमारे 1% आणि लोकसंख्या 1.4 अब्ज: 1.4 अब्जाचा 1% अजून एकाच वर्षात 1.4 कोटी लोक जोडतो. जर दर मग 0.9% वर सैल झाला, ती खरी मंदी, पण अजून मोठ्या पायाचा 0.9% अजून एक कोटीहून बरेच वर नवे लोक. म्हणून दोन्ही विधाने मुळीच विरोधात नाहीत: दर (टक्केवारी) घसरतो, अर्थ लोकसंख्या आधीहून थोडी कमी जलद वाढते, तर दरवर्षी जोडलेली निरपेक्ष संख्या प्रचंड राहते कारण ती इतक्या विशाल पायाचा तुकडा. एकूण चढत राहण्याचे दुसरे कारणही, लोकसंख्या संवेग म्हणतात: कारण भूतकाळातील उच्च जन्मदराने भारताला तरुण लोकांची अतिशय मोठी संख्या दिली, एक मोठी पिढी आता आपल्या मूल-जन्मवण्याच्या वर्षांत प्रवेश करत आहे, म्हणून लहान कुटुंबांनीही पालकांची निव्वळ संख्या जन्म बराच काळ उच्च ठेवते. फक्त जेव्हा दर बराच अधिक घसरेल, आणि हा तरुण फुगवटा वृद्ध होईल, तेव्हा वार्षिक भर अखेर आकुंचेल. घसरता दर, तरी वाढता एकूण — दोन्ही खरे, आणि दोन्ही पायाच्या आकाराने समजावलेले.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Economists sometimes call India's large share of young, working-age people a 'demographic dividend' — a chance for rapid growth. Yet they warn it could just as easily become a burden. What determines whether a young population is a gift or a strain?",
          hi: "अर्थशास्त्री कभी भारत के युवा, कार्यशील आयु के लोगों के बड़े हिस्से को 'जनसांख्यिकीय लाभांश' कहते — तेज़ वृद्धि का अवसर। फिर भी वे चेताते यह उतनी ही आसानी से बोझ बन सकता। कौन तय करता कि युवा जनसंख्या उपहार है या दबाव?",
          mr: "अर्थतज्ज्ञ कधी भारताच्या तरुण, कार्यक्षम वयाच्या लोकांच्या मोठ्या वाट्याला 'लोकसंख्याशास्त्रीय लाभांश' म्हणतात — जलद वाढीची संधी. तरी ते इशारा देतात हे तितक्याच सहज ओझे बनू शकते. कोण ठरवतो की तरुण लोकसंख्या भेट आहे की ताण?",
        },
        choices: [
          {
            en: "Whether the young are educated, healthy and given jobs: a large working-age group can produce great wealth if it is skilled and employed, but if millions of young people lack schooling, health and work, the same numbers become unemployed and dependent — a strain rather than a dividend",
            hi: "युवा शिक्षित, स्वस्थ और रोज़गार पाए या नहीं: बड़ा कार्यशील समूह बहुत धन पैदा कर सकता यदि कुशल और नियोजित, पर यदि करोड़ों युवा शिक्षा, स्वास्थ्य और काम से वंचित, वही संख्या बेरोज़गार और निर्भर बनती — लाभांश के बजाय दबाव",
            mr: "तरुण शिक्षित, निरोगी आणि रोजगार मिळाले की नाही: मोठा कार्यक्षम गट पुष्कळ संपत्ती निर्माण करू शकतो जर कुशल आणि रोजगारित, पण जर कोट्यवधी तरुण शिक्षण, आरोग्य आणि कामापासून वंचित, तीच संख्या बेरोजगार आणि अवलंबून बनते — लाभांशाऐवजी ताण",
          },
          {
            en: "A young population is always automatically a benefit, no matter what",
            hi: "युवा जनसंख्या सदा स्वतः लाभ, चाहे कुछ भी हो",
            mr: "तरुण लोकसंख्या नेहमी आपोआप लाभ, काहीही असो",
          },
          {
            en: "It depends only on the total number of people, not on their skills",
            hi: "यह केवल लोगों की कुल संख्या पर निर्भर, उनके कौशल पर नहीं",
            mr: "हे फक्त लोकांच्या एकूण संख्येवर अवलंबून, त्यांच्या कौशल्यावर नाही",
          },
          {
            en: "A young population is always a burden and never an advantage",
            hi: "युवा जनसंख्या सदा बोझ और कभी लाभ नहीं",
            mr: "तरुण लोकसंख्या नेहमी ओझे आणि कधी फायदा नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The phrase 'demographic dividend' captures a real opportunity but hides an 'if'. Having a large share of the population in the working ages — rather than very young or very old — is potentially a huge advantage, because a big pool of workers, each supporting relatively few dependents, can produce far more than the country consumes and pour the surplus into growth and investment. That is the dividend. But a dividend is only paid if the young population is actually equipped to work productively, and that turns on the quality of the population, not just its numbers. If those tens of millions of young people are healthy, well-educated and skilled, and if the economy creates enough jobs for them, they become a mighty engine of prosperity — the story of several fast-growing Asian economies. If instead they grow up malnourished, poorly schooled and unskilled, or if there simply are not enough jobs, then the same large young generation becomes a mass of unemployed, underemployed and dependent people, straining resources and breeding frustration rather than wealth. In other words, the numbers only set the stage; investment in schooling, health, nutrition and jobs decides whether the play ends in dividend or disappointment. This is exactly why economists insist that raising the quality of the population — its education, health and skills — is not optional but the very thing that converts a youthful age structure from mere potential into real growth. The window is also temporary: the same bulge that is young today will one day be old, so the dividend must be seized while it lasts.",
          hi: "'जनसांख्यिकीय लाभांश' वाक्यांश एक असली अवसर पकड़ता पर एक 'यदि' छिपाता। जनसंख्या का बड़ा हिस्सा कार्यशील आयु में होना — बहुत युवा या बहुत वृद्ध के बजाय — संभावतः विशाल लाभ, क्योंकि कामगारों का बड़ा भंडार, हर एक अपेक्षाकृत कम आश्रितों को सहारते, देश की खपत से कहीं अधिक पैदा कर अधिशेष वृद्धि-निवेश में उँड़ेल सकता। वह लाभांश। पर लाभांश तभी चुकाया जाता यदि युवा जनसंख्या वास्तव में उत्पादक रूप से काम करने को सुसज्जित, और वह जनसंख्या की गुणवत्ता पर मुड़ता, केवल संख्या पर नहीं। यदि वे करोड़ों युवा स्वस्थ, सुशिक्षित और कुशल, और यदि अर्थव्यवस्था उनके लिए पर्याप्त रोज़गार रचे, वे समृद्धि का प्रबल इंजन बनते — कई तेज़-बढ़ती एशियाई अर्थव्यवस्थाओं की कहानी। यदि बजाय वे कुपोषित, बुरी तरह शिक्षित और अकुशल बड़े हों, या यदि बस पर्याप्त रोज़गार न हों, तो वही बड़ी युवा पीढ़ी बेरोज़गार, अल्परोज़गार और निर्भर लोगों की भीड़ बनती, संसाधन दबाते और धन के बजाय कुंठा पालते। दूसरे शब्दों में, संख्या केवल मंच सजाती; शिक्षा, स्वास्थ्य, पोषण और रोज़गार में निवेश तय करता नाटक लाभांश में समाप्त हो या निराशा में। ठीक इसीलिए अर्थशास्त्री ज़ोर देते कि जनसंख्या की गुणवत्ता उठाना — उसकी शिक्षा, स्वास्थ्य और कौशल — वैकल्पिक नहीं बल्कि वही चीज़ जो युवा आयु संरचना को कोरी संभावना से असली वृद्धि में बदलती। खिड़की भी अस्थायी: वही उभार जो आज युवा एक दिन वृद्ध होगा, अतः लाभांश जब तक टिके तब तक पकड़ना होगा।",
          mr: "'लोकसंख्याशास्त्रीय लाभांश' हा वाक्प्रचार एक खरी संधी पकडतो पण एक 'जर' लपवतो. लोकसंख्येचा मोठा वाटा कार्यक्षम वयात असणे — अतिशय तरुण वा अतिशय वृद्धाऐवजी — संभाव्यतः प्रचंड फायदा, कारण कामगारांचा मोठा साठा, प्रत्येक तुलनेने कमी अवलंबितांना आधार देत, देशाच्या खपाहून कितीतरी अधिक निर्माण करून अतिरिक्त वाढ-गुंतवणुकीत ओतू शकतो. तो लाभांश. पण लाभांश तेव्हाच दिला जातो जर तरुण लोकसंख्या खरोखर उत्पादकपणे काम करायला सुसज्ज, आणि ते लोकसंख्येच्या गुणवत्तेवर वळते, फक्त संख्येवर नाही. जर ते कोट्यवधी तरुण निरोगी, सुशिक्षित आणि कुशल, आणि जर अर्थव्यवस्था त्यांच्यासाठी पुरेसे रोजगार निर्माण करेल, ते समृद्धीचे प्रबळ इंजिन बनतात — अनेक जलद-वाढणाऱ्या आशियाई अर्थव्यवस्थांची कथा. जर त्याऐवजी ते कुपोषित, वाईट शिक्षित आणि अकुशल वाढले, किंवा जर फक्त पुरेसे रोजगार नसतील, तर तीच मोठी तरुण पिढी बेरोजगार, अल्परोजगार आणि अवलंबून लोकांची गर्दी बनते, संसाधने ताणत आणि संपत्तीऐवजी नैराश्य पोसत. दुसऱ्या शब्दांत, संख्या फक्त रंगमंच सजवते; शिक्षण, आरोग्य, पोषण आणि रोजगारातील गुंतवणूक ठरवते नाटक लाभांशात संपते की निराशेत. नेमके म्हणूनच अर्थतज्ज्ञ आग्रह धरतात की लोकसंख्येची गुणवत्ता उंचावणे — तिचे शिक्षण, आरोग्य आणि कौशल्य — ऐच्छिक नव्हे तर तीच गोष्ट जी तरुण वयोरचनेला निव्वळ शक्यतेतून खऱ्या वाढीत बदलते. खिडकीही तात्पुरती: तोच फुगवटा जो आज तरुण एक दिवस वृद्ध होईल, म्हणून लाभांश जोवर टिकतो तोवर पकडावा लागेल.",
        },
      },
    ],
  },
];
