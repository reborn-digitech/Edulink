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
];
