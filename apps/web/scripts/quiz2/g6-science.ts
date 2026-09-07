/**
 * Class 6 Science — NCERT, chapter by chapter, through the conceptual
 * engine. The voice shifts from EVS's read-aloud to a young experimenter's:
 * every fact is something a Class 6 child can test, taste, wire up or hold
 * to the light. Same distractor rule as everywhere — every statement must
 * be false of every other entity in its chapter.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Science (Class 6)";
const LICENCE = "CC-BY-SA-4.0";

export const G6_SCIENCE: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Components of Food (what each nutrient does)                */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-6-components-of-food",
    subject: "SCIENCE",
    classLevel: 6,
    chapter: {
      en: "Chapter 2 — Components of Food",
      hi: "अध्याय 2 — भोजन के घटक",
      mr: "प्रकरण 2 — अन्नाचे घटक",
    },
    name: { en: "Components of Food", hi: "भोजन के घटक", mr: "अन्नाचे घटक" },
    summary: {
      en: "Carbohydrates, proteins, fats, vitamins and roughage — what each does in the body, the iodine test that finds starch, and the illnesses that name a missing nutrient.",
      hi: "कार्बोहाइड्रेट, प्रोटीन, वसा, विटामिन और रेशा — शरीर में हर एक का काम, माँड पकड़ती आयोडीन-जाँच, और वे बीमारियाँ जो छूटे पोषक का नाम बता देती हैं।",
      mr: "कर्बोदके, प्रथिने, स्निग्धे, जीवनसत्त्वे आणि तंतुमय पदार्थ — शरीरात प्रत्येकाचे काम, सत्त्व पकडणारी आयोडीन-चाचणी, आणि गळलेल्या पोषकाचे नाव सांगणारे आजार.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "carbs",
        name: { en: "Carbohydrates", hi: "कार्बोहाइड्रेट", mr: "कर्बोदके" },
        kind: "nutrient",
        prompt: {
          en: "Rice, roti and potato are rich in which nutrient — the body's everyday fuel for running and playing?",
          hi: "चावल, रोटी और आलू किस पोषक से भरे हैं — दौड़ने-खेलने के लिए शरीर का रोज़ का ईंधन?",
          mr: "भात, पोळी आणि बटाटा कोणत्या पोषकाने भरलेले आहेत — धावण्या-खेळण्यासाठी शरीराचे रोजचे इंधन?",
        },
        statement: {
          en: "Carbohydrates are the body's main energy-givers — rice, roti and potato are full of them.",
          hi: "कार्बोहाइड्रेट शरीर के मुख्य ऊर्जा-दाता हैं — चावल, रोटी और आलू उन्हीं से भरे हैं।",
          mr: "कर्बोदके ही शरीराची मुख्य ऊर्जा-दाती — भात, पोळी आणि बटाटा त्यांनीच भरलेले आहेत.",
        },
        detail: {
          en: "A drop of iodine turns blue-black on food that holds their starch — the kitchen's own chemistry test.",
          hi: "आयोडीन की बूँद माँड वाले भोजन पर नीली-काली पड़ जाती है — रसोई की अपनी रसायन-जाँच।",
          mr: "आयोडीनचा थेंब सत्त्व असलेल्या अन्नावर निळा-काळा पडतो — स्वयंपाकघराची स्वतःची रसायन-चाचणी.",
        },
        extra: {
          en: "A farmer or a footballer needs more of them than someone at a desk.",
          hi: "किसान या फुटबॉलर को मेज़ पर बैठे व्यक्ति से इनकी ज़्यादा ज़रूरत होती है।",
          mr: "शेतकऱ्याला वा फुटबॉलपटूला टेबलाशी बसणाऱ्याहून यांची जास्त गरज असते.",
        },
        pair: {
          left: { en: "Starch on the plate", hi: "थाली का माँड", mr: "ताटातले सत्त्व" },
          right: {
            en: "blue-black with iodine",
            hi: "आयोडीन से नीला-काला",
            mr: "आयोडीनने निळे-काळे",
          },
        },
      },
      {
        id: "proteins",
        name: { en: "Proteins", hi: "प्रोटीन", mr: "प्रथिने" },
        kind: "nutrient",
        prompt: {
          en: "Dal, eggs, milk and fish are rich in which nutrient — the one that builds and repairs the body itself?",
          hi: "दाल, अंडे, दूध और मछली किस पोषक से भरे हैं — वह जो स्वयं शरीर को गढ़ता और सुधारता है?",
          mr: "डाळ, अंडी, दूध आणि मासे कोणत्या पोषकाने भरलेले आहेत — जे स्वतः शरीर घडवते आणि दुरुस्त करते?",
        },
        statement: {
          en: "Proteins are the body-building nutrient — growing children and healing wounds both call for dal, milk and eggs.",
          hi: "प्रोटीन शरीर गढ़ने वाला पोषक है — बढ़ते बच्चों और भरते घावों, दोनों को दाल, दूध और अंडे चाहिए।",
          mr: "प्रथिने हे शरीर घडवणारे पोषक — वाढणाऱ्या मुलांना आणि भरणाऱ्या जखमांना, दोघांनाही डाळ, दूध आणि अंडी लागतात.",
        },
        pair: {
          left: { en: "Proteins", hi: "प्रोटीन", mr: "प्रथिने" },
          right: { en: "the body's builders", hi: "शरीर के कारीगर", mr: "शरीराचे कारागीर" },
        },
      },
      {
        id: "fats",
        name: { en: "Fats", hi: "वसा", mr: "स्निग्ध पदार्थ" },
        kind: "nutrient",
        prompt: {
          en: "Ghee, oil and nuts carry which nutrient — energy packed so tight that a spoonful beats a plateful of rice?",
          hi: "घी, तेल और मेवे किस पोषक को ढोते हैं — इतनी सघन ऊर्जा कि एक चम्मच, थाली भर चावल पर भारी?",
          mr: "तूप, तेल आणि सुकामेवा कोणते पोषक वाहतात — इतकी दाट ऊर्जा की एक चमचा ताटभर भातावर भारी?",
        },
        statement: {
          en: "Fats give far more energy, weight for weight, than carbohydrates — ghee, oil and nuts are their stores.",
          hi: "वसा बराबर वज़न पर कार्बोहाइड्रेट से कहीं ज़्यादा ऊर्जा देती है — घी, तेल और मेवे उसके भंडार हैं।",
          mr: "स्निग्धे समान वजनात कर्बोदकांहून कितीतरी जास्त ऊर्जा देतात — तूप, तेल आणि सुकामेवा हे त्यांचे साठे.",
        },
        detail: {
          en: "Rub a groundnut on paper and the sheet turns see-through — the oily patch is the fat test.",
          hi: "मूँगफली को काग़ज़ पर मलिए, पन्ना पारदर्शी हो जाता है — वही तेलिया धब्बा वसा की जाँच है।",
          mr: "शेंगदाणा कागदावर चोळा, पान पारदर्शक होते — तोच तेलकट डाग स्निग्धाची चाचणी.",
        },
        extra: {
          en: "Needed in small amounts — extra fat the body does not burn, it stores.",
          hi: "थोड़ी मात्रा में चाहिए — जो वसा शरीर जलाता नहीं, जमा कर लेता है।",
          mr: "थोड्या प्रमाणात हवीत — जी स्निग्धे शरीर जाळत नाही, ती साठवते.",
        },
        pair: {
          left: { en: "The groundnut on paper", hi: "काग़ज़ पर मूँगफली", mr: "कागदावरचा शेंगदाणा" },
          right: {
            en: "a see-through oily patch",
            hi: "पारदर्शी तेलिया धब्बा",
            mr: "पारदर्शक तेलकट डाग",
          },
        },
      },
      {
        id: "vitamins",
        name: { en: "Vitamins and minerals", hi: "विटामिन और खनिज", mr: "जीवनसत्त्वे आणि खनिजे" },
        kind: "nutrient",
        prompt: {
          en: "Fruits and vegetables carry which nutrients — needed only in pinches, yet guarding the whole body from disease?",
          hi: "फल और सब्ज़ियाँ कौन-से पोषक ढोते हैं — चुटकियों भर चाहिए, फिर भी पूरे शरीर को रोगों से बचाते हैं?",
          mr: "फळे आणि भाज्या कोणती पोषके वाहतात — चिमूटभरच लागतात, तरी सबंध शरीराला रोगांपासून राखतात?",
        },
        statement: {
          en: "Vitamins and minerals protect the body — needed in tiny amounts, missed with large consequences.",
          hi: "विटामिन और खनिज शरीर की रक्षा करते हैं — मात्रा नन्ही चाहिए, चूकने का नतीजा बड़ा।",
          mr: "जीवनसत्त्वे आणि खनिजे शरीराचे रक्षण करतात — प्रमाण इवले लागते, चुकण्याचा परिणाम मोठा.",
        },
        pair: {
          left: { en: "Vitamins", hi: "विटामिन", mr: "जीवनसत्त्वे" },
          right: {
            en: "protection in pinches",
            hi: "चुटकियों में रक्षा",
            mr: "चिमटीत संरक्षण",
          },
        },
      },
      {
        id: "roughage",
        name: { en: "Roughage (fibre)", hi: "रेशा (रफ़ेज)", mr: "तंतुमय पदार्थ (चोथा)" },
        kind: "helper",
        prompt: {
          en: "Whole grains, salads and fruit-skins give which part of food — one the body cannot even digest, yet cannot do without?",
          hi: "साबुत अनाज, सलाद और फलों के छिलके भोजन का कौन-सा हिस्सा देते हैं — जिसे शरीर पचा भी नहीं सकता, फिर भी उसके बिना नहीं चल सकता?",
          mr: "अख्खी धान्ये, कोशिंबिरी आणि फळांच्या साली अन्नाचा कोणता भाग देतात — जो शरीराला पचवताही येत नाही, तरी त्याच्याविना चालत नाही?",
        },
        statement: {
          en: "Roughage is the undigested fibre that keeps food moving through the gut — it feeds nothing, yet everything depends on it.",
          hi: "रेशा वह बिन-पचा तंतु है जो भोजन को आँतों में चलाए रखता है — वह कुछ नहीं खिलाता, फिर भी सब उसी पर टिका है।",
          mr: "चोथा हा न पचणारा तंतू अन्नाला आतड्यांतून चालवत ठेवतो — तो काही पोसत नाही, तरी सारे त्याच्यावर अवलंबून.",
        },
        pair: {
          left: { en: "Roughage", hi: "रेशा", mr: "चोथा" },
          right: {
            en: "the gut's sweeper",
            hi: "आँतों का झाड़ूवाला",
            mr: "आतड्यांचा झाडूवाला",
          },
        },
      },
      {
        id: "scurvy",
        name: { en: "Scurvy", hi: "स्कर्वी", mr: "स्कर्व्ही" },
        kind: "deficiency",
        prompt: {
          en: "Bleeding gums and wounds that will not heal — which disease arrives when vitamin C's citrus fruits vanish from the plate?",
          hi: "ख़ून रिसते मसूड़े और न भरते घाव — कौन-सी बीमारी आती है जब विटामिन C के खट्टे फल थाली से ग़ायब हों?",
          mr: "रक्त येणाऱ्या हिरड्या आणि न भरणाऱ्या जखमा — कोणता आजार येतो जेव्हा क जीवनसत्त्वाची आंबट फळे ताटातून नाहीशी होतात?",
        },
        statement: {
          en: "Scurvy — bleeding gums, slow-healing wounds — comes from missing vitamin C, the amla-and-lemon vitamin.",
          hi: "स्कर्वी — रिसते मसूड़े, धीरे भरते घाव — विटामिन C की कमी से आती है, जो आँवले-नींबू का विटामिन है।",
          mr: "स्कर्व्ही — रक्ताळ हिरड्या, हळू भरणाऱ्या जखमा — क जीवनसत्त्व चुकल्याने येते, जे आवळा-लिंबाचे जीवनसत्त्व.",
        },
        detail: {
          en: "Old-time sailors on months of dry rations lost their teeth to it — until ships began carrying lemons.",
          hi: "महीनों सूखे राशन पर रहते पुराने नाविक इसमें दाँत गँवा बैठते थे — जब तक जहाज़ों पर नींबू नहीं चढ़े।",
          mr: "महिनोंमहिने कोरड्या शिध्यावरचे जुने खलाशी यात दात गमावत — जहाजांवर लिंबे चढेपर्यंत.",
        },
        extra: {
          en: "A squeeze of lemon a day keeps it away entirely — the cheapest cure ever found.",
          hi: "रोज़ नींबू की एक निचोड़ इसे पूरी तरह दूर रखती है — अब तक की सबसे सस्ती दवा।",
          mr: "रोज लिंबाची एक पिळणी याला पूर्ण दूर ठेवते — आजवरचे सर्वांत स्वस्त औषध.",
        },
        pair: {
          left: { en: "Scurvy", hi: "स्कर्वी", mr: "स्कर्व्ही" },
          right: { en: "vitamin C gone missing", hi: "ग़ायब विटामिन C", mr: "हरवलेले क जीवनसत्त्व" },
        },
      },
      {
        id: "rickets",
        name: { en: "Rickets", hi: "रिकेट्स (सूखा रोग)", mr: "मुडदूस" },
        kind: "deficiency",
        prompt: {
          en: "Soft, bending leg bones in a growing child — which disease names a lack of vitamin D, the sunshine vitamin?",
          hi: "बढ़ते बच्चे की नरम, मुड़ती टाँगों की हड्डियाँ — कौन-सी बीमारी विटामिन D, धूप के विटामिन, की कमी का नाम है?",
          mr: "वाढणाऱ्या मुलाची मऊ, वाकणारी पायांची हाडे — कोणता आजार ड जीवनसत्त्वाच्या, उन्हाच्या जीवनसत्त्वाच्या, कमतरतेचे नाव आहे?",
        },
        statement: {
          en: "Rickets bends a child's soft bones — it comes of missing vitamin D, which the skin itself makes in sunshine.",
          hi: "रिकेट्स बच्चे की नरम हड्डियाँ मोड़ देता है — यह विटामिन D की कमी से होता है, जिसे त्वचा धूप में ख़ुद बनाती है।",
          mr: "मुडदूस मुलाची मऊ हाडे वाकवतो — तो ड जीवनसत्त्व चुकल्याने होतो, जे त्वचा उन्हात स्वतः बनवते.",
        },
        pair: {
          left: { en: "Rickets", hi: "रिकेट्स", mr: "मुडदूस" },
          right: {
            en: "too little sunshine-vitamin",
            hi: "धूप-विटामिन की कमी",
            mr: "उन्हाच्या जीवनसत्त्वाची कमतरता",
          },
        },
      },
      {
        id: "balanceddiet",
        name: { en: "The balanced diet", hi: "संतुलित आहार", mr: "समतोल आहार" },
        kind: "helper",
        prompt: {
          en: "What do we call a day's food that carries ALL the nutrients in right amounts — fuel, builders, protectors, fibre and water together?",
          hi: "दिन भर के उस भोजन को क्या कहते हैं जिसमें सारे पोषक सही मात्रा में हों — ईंधन, कारीगर, रक्षक, रेशा और पानी साथ-साथ?",
          mr: "साऱ्या पोषकांना योग्य प्रमाणात वाहणाऱ्या दिवसभराच्या अन्नाला काय म्हणतात — इंधन, कारागीर, रक्षक, चोथा आणि पाणी एकत्र?",
        },
        statement: {
          en: "A balanced diet holds every nutrient in its right amount — no single food gives all of them, so the plate must be a team.",
          hi: "संतुलित आहार में हर पोषक अपनी सही मात्रा में है — कोई अकेला भोजन सब नहीं देता, इसलिए थाली को टोली होना पड़ता है।",
          mr: "समतोल आहारात प्रत्येक पोषक त्याच्या योग्य प्रमाणात — कोणतेही एकटे अन्न सारे देत नाही, म्हणून ताटाला संघ व्हावे लागते.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the missing nutrient to its disease: A-scurvy, B-rickets, C-anaemia. Which trio is right?",
          hi: "छूटे पोषक को उसकी बीमारी से मिलाइए: अ-स्कर्वी, ब-रिकेट्स, स-अनीमिया। कौन-सी तिकड़ी सही है?",
          mr: "गळलेले पोषक त्याच्या आजाराशी जुळवा: अ-स्कर्व्ही, ब-मुडदूस, क-अ‍ॅनिमिया. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: vitamin C · B: vitamin D · C: iron",
            hi: "अ: विटामिन C · ब: विटामिन D · स: लोहा",
            mr: "अ: क जीवनसत्त्व · ब: ड जीवनसत्त्व · क: लोह",
          },
          {
            en: "A: iron · B: vitamin C · C: vitamin D",
            hi: "अ: लोहा · ब: विटामिन C · स: विटामिन D",
            mr: "अ: लोह · ब: क जीवनसत्त्व · क: ड जीवनसत्त्व",
          },
          {
            en: "A: vitamin D · B: iron · C: vitamin C",
            hi: "अ: विटामिन D · ब: लोहा · स: विटामिन C",
            mr: "अ: ड जीवनसत्त्व · ब: लोह · क: क जीवनसत्त्व",
          },
          {
            en: "A: vitamin C · B: iron · C: vitamin D",
            hi: "अ: विटामिन C · ब: लोहा · स: विटामिन D",
            mr: "अ: क जीवनसत्त्व · ब: लोह · क: ड जीवनसत्त्व",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Scurvy's bleeding gums cry for vitamin C; rickets' bent bones for vitamin D; anaemia's tired blood for iron. Each deficiency disease is a label the body writes for exactly one missing thing — read the symptom, name the nutrient.",
          hi: "स्कर्वी के रिसते मसूड़े विटामिन C पुकारते हैं; रिकेट्स की मुड़ी हड्डियाँ विटामिन D; अनीमिया का थका ख़ून लोहा। हर कमी-रोग वह परची है जो शरीर ठीक एक छूटी चीज़ के लिए लिखता है — लक्षण पढ़िए, पोषक का नाम लीजिए।",
          mr: "स्कर्व्हीच्या रक्ताळ हिरड्या क जीवनसत्त्व मागतात; मुडदुसाची वाकलेली हाडे ड जीवनसत्त्व; अ‍ॅनिमियाचे थकलेले रक्त लोह. प्रत्येक कमतरता-रोग ही शरीराने नेमक्या एका गळलेल्या गोष्टीसाठी लिहिलेली चिठ्ठी — लक्षण वाचा, पोषकाचे नाव घ्या.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A family eats its fill of rice at every meal, yet the doctor calls the children undernourished. How can a FULL stomach still be a starved body?",
          hi: "एक परिवार हर वक़्त पेट भर चावल खाता है, फिर भी डॉक्टर बच्चों को कुपोषित कहते हैं। भरा पेट भी भूखा शरीर कैसे हो सकता है?",
          mr: "एक कुटुंब प्रत्येक जेवणात पोटभर भात खाते, तरी डॉक्टर मुलांना कुपोषित म्हणतात. भरलेले पोटही उपाशी शरीर कसे असू शकते?",
        },
        choices: [
          {
            en: "Rice is almost all carbohydrate — the children get fuel but hardly any builders or protectors, and a body cannot grow on fuel alone",
            hi: "चावल लगभग पूरा कार्बोहाइड्रेट है — बच्चों को ईंधन मिलता है पर कारीगर और रक्षक शायद ही; और शरीर अकेले ईंधन पर नहीं बढ़ सकता",
            mr: "भात जवळजवळ सारा कर्बोदक — मुलांना इंधन मिळते पण कारागीर आणि रक्षक जेमतेम; आणि शरीर एकट्या इंधनावर वाढू शकत नाही",
          },
          {
            en: "The children must secretly be skipping meals",
            hi: "बच्चे ज़रूर चोरी-छिपे खाना छोड़ रहे होंगे",
            mr: "मुले नक्कीच चोरून जेवण टाळत असणार",
          },
          {
            en: "Rice loses all food value when cooked",
            hi: "पकने पर चावल का सारा पोषण चला जाता है",
            mr: "शिजल्यावर भाताचे सारे पोषण जाते",
          },
          {
            en: "Undernourishment is only about too little water",
            hi: "कुपोषण केवल पानी की कमी की बात है",
            mr: "कुपोषण फक्त पाण्याच्या कमतरतेची गोष्ट",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Hunger and nourishment are different ledgers. Rice fills the energy column generously and leaves the protein, vitamin and mineral columns nearly blank — so the stomach reports full while bones, blood and healing run short. The fix costs little: a dal, a green vegetable, a lemon beside the same rice makes the plate a team.",
          hi: "भूख और पोषण अलग-अलग बहियाँ हैं। चावल ऊर्जा का ख़ाना दिल खोलकर भरता है और प्रोटीन, विटामिन, खनिज के ख़ाने लगभग कोरे छोड़ देता है — पेट 'भरा' बताता है जबकि हड्डियाँ, ख़ून और घाव-भराई घाटे में चलते हैं। इलाज सस्ता है: उसी चावल के साथ एक दाल, एक हरी सब्ज़ी, एक नींबू — और थाली टोली बन जाती है।",
          mr: "भूक आणि पोषण या वेगळ्या वह्या. भात ऊर्जेचा रकाना सढळ भरतो आणि प्रथिने, जीवनसत्त्वे, खनिजांचे रकाने जवळजवळ कोरे ठेवतो — पोट 'भरले' सांगते तर हाडे, रक्त आणि जखम-भरणी तुटीत चालतात. उपाय स्वस्त: त्याच भातासोबत एक डाळ, एक हिरवी भाजी, एक लिंबू — आणि ताट संघ होते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "One drop of iodine on a cut potato turns blue-black; on a slice of paneer it stays brown. What has the iodine just told you?",
          hi: "कटे आलू पर आयोडीन की एक बूँद नीली-काली पड़ती है; पनीर के टुकड़े पर भूरी की भूरी रहती है। आयोडीन ने अभी-अभी क्या बताया?",
          mr: "कापलेल्या बटाट्यावर आयोडीनचा एक थेंब निळा-काळा पडतो; पनीरच्या तुकड्यावर तपकिरीच राहतो. आयोडीनने आत्ताच काय सांगितले?",
        },
        choices: [
          {
            en: "The potato holds starch and the paneer does not — the colour change is a test for one nutrient, not for 'food' in general",
            hi: "आलू में माँड है और पनीर में नहीं — रंग-बदलाव एक पोषक की जाँच है, आम तौर पर 'भोजन' की नहीं",
            mr: "बटाट्यात सत्त्व आहे आणि पनीरमध्ये नाही — रंगबदल ही एका पोषकाची चाचणी, एकूण 'अन्नाची' नव्हे",
          },
          {
            en: "The paneer has gone stale and unsafe",
            hi: "पनीर बासी और असुरक्षित हो गया है",
            mr: "पनीर शिळे आणि असुरक्षित झाले आहे",
          },
          {
            en: "Iodine only works on vegetables",
            hi: "आयोडीन केवल सब्ज़ियों पर काम करता है",
            mr: "आयोडीन फक्त भाज्यांवर चालते",
          },
          {
            en: "The potato is more nutritious than the paneer",
            hi: "आलू पनीर से ज़्यादा पौष्टिक है",
            mr: "बटाटा पनीरहून जास्त पौष्टिक आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Iodine speaks one word only: starch. Blue-black means starch present; brown means starch absent — nothing more. The paneer is rich in protein, which iodine simply cannot see; the fat test's oily patch would praise it instead. Every food test answers its own narrow question, and a good experimenter never stretches the answer.",
          hi: "आयोडीन एक ही शब्द बोलता है: माँड। नीला-काला यानी माँड हाज़िर; भूरा यानी ग़ैर-हाज़िर — बस इतना। पनीर प्रोटीन से भरा है, जिसे आयोडीन देख ही नहीं सकता; वसा-जाँच का तेलिया धब्बा उलटे उसकी तारीफ़ करता। हर भोजन-जाँच अपने ही सँकरे सवाल का उत्तर देती है, और अच्छा प्रयोगकर्ता उत्तर को कभी खींचता नहीं।",
          mr: "आयोडीन एकच शब्द बोलते: सत्त्व. निळे-काळे म्हणजे सत्त्व हजर; तपकिरी म्हणजे गैरहजर — इतकेच. पनीर प्रथिनांनी भरलेले, जी आयोडीनला दिसूच शकत नाहीत; स्निग्ध-चाचणीचा तेलकट डाग उलट त्याचे कौतुक करेल. प्रत्येक अन्न-चाचणी आपल्याच अरुंद प्रश्नाचे उत्तर देते, आणि चांगला प्रयोगकर्ता उत्तर कधी ताणत नाही.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Separation of Substances (the right tool for each mixture)  */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-6-separation-of-substances",
    subject: "SCIENCE",
    classLevel: 6,
    chapter: {
      en: "Chapter 5 — Separation of Substances",
      hi: "अध्याय 5 — पदार्थों का पृथक्करण",
      mr: "प्रकरण 5 — पदार्थांचे पृथक्करण",
    },
    name: {
      en: "Separation of Substances",
      hi: "पदार्थों का पृथक्करण",
      mr: "पदार्थांचे पृथक्करण",
    },
    summary: {
      en: "Handpicking, winnowing, sieving, settling, filtering and drying in the sun — each mixture has one difference, and each method uses exactly that.",
      hi: "बीनना, ओसाना, छानना, बैठने देना, निथारना और धूप में सुखाना — हर मिश्रण में एक फ़र्क़ है, और हर तरीक़ा ठीक उसी को बरतता है।",
      mr: "वेचणे, पाखडणे, चाळणे, निवळू देणे, गाळणे आणि उन्हात वाळवणे — प्रत्येक मिश्रणात एक फरक असतो, आणि प्रत्येक रीत नेमका तोच वापरते.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "handpicking",
        name: { en: "Handpicking", hi: "हाथ से बीनना", mr: "हाताने वेचणे" },
        kind: "method",
        prompt: {
          en: "Small stones in a plate of rice — which simplest method removes them, one visible piece at a time?",
          hi: "चावल की थाली में छोटे कंकड़ — कौन-सा सबसे सीधा तरीक़ा उन्हें निकालता है, एक-एक दिखता टुकड़ा?",
          mr: "तांदळाच्या ताटात लहान खडे — कोणती सर्वांत सोपी रीत ते काढते, एकेक दिसणारा कण?",
        },
        statement: {
          en: "Handpicking removes impurities that are few, large and visibly different — stones from rice, husk bits from dal.",
          hi: "हाथ से बीनना उन अशुद्धियों को निकालता है जो थोड़ी, बड़ी और साफ़ अलग दिखती हों — चावल से कंकड़, दाल से भूसी।",
          mr: "हाताने वेचणे थोड्या, मोठ्या आणि स्पष्ट वेगळ्या दिसणाऱ्या अशुद्धी काढते — तांदळातले खडे, डाळीतली टरफले.",
        },
        pair: {
          left: { en: "Handpicking", hi: "हाथ से बीनना", mr: "हाताने वेचणे" },
          right: {
            en: "few, big, visible bits",
            hi: "थोड़े, बड़े, दिखते टुकड़े",
            mr: "थोडे, मोठे, दिसणारे कण",
          },
        },
      },
      {
        id: "winnowing",
        name: { en: "Winnowing", hi: "ओसाना (फटकना)", mr: "पाखडणे" },
        kind: "method",
        prompt: {
          en: "The farmer pours grain from a height into the breeze — the light chaff drifts aside, the heavy grain drops straight. Which method is this?",
          hi: "किसान ऊँचाई से अनाज हवा में गिराता है — हलकी भूसी उड़कर अलग जा गिरती है, भारी दाना सीधा गिरता है। यह कौन-सा तरीक़ा है?",
          mr: "शेतकरी उंचावरून धान्य वाऱ्यात ओततो — हलका भुसा उडून बाजूला पडतो, जड दाणा सरळ पडतो. ही कोणती रीत?",
        },
        statement: {
          en: "Winnowing lets the wind carry off the lighter part while the heavier grain falls straight down — a weight difference put to work.",
          hi: "ओसाने में हवा हलके हिस्से को उड़ा ले जाती है और भारी दाना सीधा गिरता है — वज़न का फ़र्क़ काम पर लगा हुआ।",
          mr: "पाखडण्यात वारा हलका भाग उडवून नेतो आणि जड दाणा सरळ पडतो — वजनाचा फरक कामाला लावलेला.",
        },
        detail: {
          en: "It needs a breeze or a fan — on a still day the chaff falls with the grain.",
          hi: "इसे हवा या पंखा चाहिए — शांत दिन में भूसी दाने के साथ ही गिरती है।",
          mr: "याला वारा वा पंखा लागतो — शांत दिवशी भुसा दाण्यासोबतच पडतो.",
        },
        extra: {
          en: "It fails if both parts weigh alike — the wind cannot tell equals apart.",
          hi: "दोनों हिस्से एक वज़न के हों तो यह चूक जाता है — हवा बराबरों में फ़र्क़ नहीं कर सकती।",
          mr: "दोन्ही भाग सारख्या वजनाचे असले तर हे फसते — वारा सारख्यांत फरक करू शकत नाही.",
        },
        pair: {
          left: { en: "Winnowing", hi: "ओसाना", mr: "पाखडणे" },
          right: {
            en: "the wind sorts by weight",
            hi: "हवा वज़न से छाँटती है",
            mr: "वारा वजनाने निवडतो",
          },
        },
      },
      {
        id: "sieving",
        name: { en: "Sieving", hi: "छानना", mr: "चाळणे" },
        kind: "method",
        prompt: {
          en: "Flour shakes through the mesh while bran stays behind — which method sorts a mixture by SIZE?",
          hi: "आटा जाली से झरता जाता है और चोकर ऊपर रह जाता है — कौन-सा तरीक़ा मिश्रण को आकार से छाँटता है?",
          mr: "पीठ जाळीतून झिरपते आणि कोंडा वर राहतो — कोणती रीत मिश्रण आकाराने निवडते?",
        },
        statement: {
          en: "Sieving separates by size — pieces smaller than the holes pass, larger ones stay on the mesh.",
          hi: "छानना आकार से अलग करता है — छेदों से छोटे कण पार, बड़े जाली पर।",
          mr: "चाळणे आकाराने वेगळे करते — छिद्रांहून लहान कण पार, मोठे जाळीवर.",
        },
        pair: {
          left: { en: "The sieve", hi: "छलनी", mr: "चाळणी" },
          right: {
            en: "a gate sized for grains",
            hi: "कणों के नाप का फाटक",
            mr: "कणांच्या मापाचे फाटक",
          },
        },
      },
      {
        id: "sedimentation",
        name: {
          en: "Settling and pouring off",
          hi: "बैठने देना और निथारना",
          mr: "निवळू देणे आणि निथळणे",
        },
        kind: "method",
        prompt: {
          en: "Muddy water left standing turns clear on top as the mud sinks; the clear water is then gently poured away. What is this pair of steps called?",
          hi: "ठहरा गँदला पानी ऊपर से साफ़ होता जाता है, मिट्टी तल में बैठती है; फिर साफ़ पानी धीरे-से उँडेल लिया जाता है। इन दो क़दमों की जोड़ी क्या कहलाती है?",
          mr: "ठेवलेले गढूळ पाणी वरून नितळ होत जाते, माती तळाशी बसते; मग नितळ पाणी हळूच ओतून घेतले जाते. या दोन पावलांच्या जोडीला काय म्हणतात?",
        },
        statement: {
          en: "Sedimentation lets the heavier mud settle; decantation then pours the clear water off the top without stirring the bed.",
          hi: "अवसादन में भारी मिट्टी बैठ जाती है; फिर निथारने में साफ़ पानी तली छेड़े बिना ऊपर से उँडेल लिया जाता है।",
          mr: "निवळण्यात जड माती खाली बसते; मग निथळण्यात तळ न ढवळता नितळ पाणी वरून ओतून घेतले जाते.",
        },
        pair: {
          left: { en: "Settling", hi: "बैठने देना", mr: "निवळू देणे" },
          right: {
            en: "the heavy sinks, the clear stays up",
            hi: "भारी बैठे, साफ़ ऊपर",
            mr: "जड बसते, नितळ वर",
          },
        },
      },
      {
        id: "filtration",
        name: { en: "Filtration", hi: "निस्यंदन (छनाई)", mr: "गाळणे" },
        kind: "method",
        prompt: {
          en: "Tea passes, leaves stay — which method holds back every particle that has NOT dissolved, on a cloth or paper?",
          hi: "चाय पार, पत्तियाँ ऊपर — कौन-सा तरीक़ा हर उस कण को कपड़े या काग़ज़ पर रोक लेता है जो घुला नहीं?",
          mr: "चहा पार, पाने वर — कोणती रीत न विरघळलेला प्रत्येक कण कापडावर वा कागदावर अडवते?",
        },
        statement: {
          en: "Filtration stops undissolved particles on a cloth or filter paper while the liquid — and everything dissolved in it — flows through.",
          hi: "छनाई बिन-घुले कणों को कपड़े या फ़िल्टर-काग़ज़ पर रोक देती है, जबकि द्रव — और उसमें घुला सब कुछ — पार बह जाता है।",
          mr: "गाळणे न विरघळलेले कण कापडावर वा गाळण-कागदावर अडवते, तर द्रव — आणि त्यात विरघळलेले सारे — पार वाहते.",
        },
        detail: {
          en: "What has DISSOLVED slips through with the water — no filter can catch it.",
          hi: "जो घुल चुका है वह पानी के साथ निकल जाता है — कोई छन्नी उसे नहीं पकड़ सकती।",
          mr: "जे विरघळले आहे ते पाण्यासोबत निसटते — कोणतीही गाळणी ते पकडू शकत नाही.",
        },
        extra: {
          en: "The tea strainer at breakfast is the family's daily filtration.",
          hi: "नाश्ते की चाय-छन्नी परिवार की रोज़ की छनाई है।",
          mr: "न्याहारीची चहाची गाळणी हे कुटुंबाचे रोजचे गाळणे.",
        },
        pair: {
          left: { en: "The filter", hi: "छन्नी", mr: "गाळणी" },
          right: {
            en: "holds the undissolved",
            hi: "बिन-घुले को रोके",
            mr: "न विरघळलेले अडवते",
          },
        },
      },
      {
        id: "evaporationpan",
        name: {
          en: "Drying off the water",
          hi: "पानी उड़ा देना",
          mr: "पाणी उडवून देणे",
        },
        kind: "method",
        prompt: {
          en: "To take dissolved salt OUT of its water, no filter helps — which method simply removes the water itself, by sun or flame?",
          hi: "घुले नमक को पानी से बाहर निकालने में कोई छन्नी काम नहीं आती — कौन-सा तरीक़ा धूप या आँच से ख़ुद पानी को ही हटा देता है?",
          mr: "विरघळलेले मीठ पाण्यातून बाहेर काढायला कोणतीही गाळणी उपयोगी नाही — कोणती रीत उन्हाने वा आचेने पाणीच काढून टाकते?",
        },
        statement: {
          en: "Evaporation removes the liquid itself — heat the salty water and the water leaves as vapour, dropping its dissolved salt.",
          hi: "वाष्पन द्रव को ही हटा देता है — नमकीन पानी को तपाइए, पानी भाप बनकर निकल जाता है और घुला नमक छूट जाता है।",
          mr: "बाष्पीभवन द्रवच काढून टाकते — खारट पाणी तापवा, पाणी वाफ होऊन जाते आणि विरघळलेले मीठ मागे राहते.",
        },
        pair: {
          left: { en: "Evaporation", hi: "वाष्पन", mr: "बाष्पीभवन" },
          right: {
            en: "removes the water, frees the salt",
            hi: "पानी हटाए, नमक छुड़ाए",
            mr: "पाणी काढते, मीठ सोडवते",
          },
        },
      },
      {
        id: "churning",
        name: { en: "Churning", hi: "मथना", mr: "घुसळणे" },
        kind: "method",
        prompt: {
          en: "Round and round goes the wooden churner in the curd, until which lighter part gathers on top for the taking?",
          hi: "दही में मथानी घूमती जाती है, जब तक कौन-सा हलका हिस्सा ऊपर जमा होकर हाथ नहीं आ जाता?",
          mr: "दह्यात रवी फिरत राहते, जोवर कोणता हलका भाग वर जमून हाती येत नाही?",
        },
        statement: {
          en: "Churning spins the butter out of curd — the lighter fat gathers together on top and is lifted away.",
          hi: "मथने से दही में से मक्खन निकल आता है — हलकी वसा ऊपर इकट्ठी होती है और उठा ली जाती है।",
          mr: "घुसळण्याने दह्यातून लोणी निघते — हलकी स्निग्धता वर एकत्र जमते आणि उचलली जाते.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Choose the right method for each mixture: A-stones in rice, B-chaff in grain, C-mud in water. Which trio is right?",
          hi: "हर मिश्रण के लिए सही तरीक़ा चुनिए: अ-चावल में कंकड़, ब-अनाज में भूसी, स-पानी में मिट्टी। कौन-सी तिकड़ी सही है?",
          mr: "प्रत्येक मिश्रणासाठी योग्य रीत निवडा: अ-तांदळात खडे, ब-धान्यात भुसा, क-पाण्यात माती. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: handpicking · B: winnowing · C: settling and pouring off",
            hi: "अ: हाथ से बीनना · ब: ओसाना · स: बैठने देना और निथारना",
            mr: "अ: हाताने वेचणे · ब: पाखडणे · क: निवळू देणे आणि निथळणे",
          },
          {
            en: "A: winnowing · B: settling · C: handpicking",
            hi: "अ: ओसाना · ब: बैठने देना · स: हाथ से बीनना",
            mr: "अ: पाखडणे · ब: निवळणे · क: हाताने वेचणे",
          },
          {
            en: "A: settling · B: handpicking · C: winnowing",
            hi: "अ: बैठने देना · ब: हाथ से बीनना · स: ओसाना",
            mr: "अ: निवळणे · ब: हाताने वेचणे · क: पाखडणे",
          },
          {
            en: "A: handpicking · B: settling · C: winnowing",
            hi: "अ: हाथ से बीनना · ब: बैठने देना · स: ओसाना",
            mr: "अ: हाताने वेचणे · ब: निवळणे · क: पाखडणे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Ask what DIFFERS in each mixture: stones are few and visible — fingers; chaff is lighter than grain — wind; mud is heavier than water — let it sink and pour. The method never comes first: the difference does, and the method is chosen to match it.",
          hi: "पूछिए कि हर मिश्रण में फ़र्क़ क्या है: कंकड़ थोड़े और दिखते हैं — उँगलियाँ; भूसी दाने से हलकी — हवा; मिट्टी पानी से भारी — बैठने दीजिए और निथारिए। तरीक़ा कभी पहले नहीं आता: पहले फ़र्क़ आता है, और तरीक़ा उससे मेल खाकर चुना जाता है।",
          mr: "विचारा की प्रत्येक मिश्रणात फरक काय: खडे थोडे आणि दिसणारे — बोटे; भुसा दाण्याहून हलका — वारा; माती पाण्याहून जड — बसू द्या आणि निथळा. रीत कधीच आधी येत नाही: आधी फरक येतो, आणि रीत त्याला जुळवून निवडली जाते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Salt has spilled into a bowl of sand. Neither picking nor sieving works — the grains look and size alike. How CAN the salt be recovered clean?",
          hi: "रेत की कटोरी में नमक गिर गया है। न बीनना चलता है, न छानना — कण देखने और नाप में एक-से हैं। नमक साफ़-सुथरा कैसे वापस मिले?",
          mr: "वाळूच्या वाटीत मीठ सांडले आहे. वेचणेही चालत नाही, चाळणेही नाही — कण दिसण्यात आणि मापात सारखे. मीठ स्वच्छ परत कसे मिळेल?",
        },
        choices: [
          {
            en: "Stir the mixture into water (salt dissolves, sand does not), filter the sand out, then evaporate the water to leave the salt",
            hi: "मिश्रण पानी में घोलिए (नमक घुलता है, रेत नहीं), रेत छान लीजिए, फिर पानी उड़ाकर नमक पा लीजिए",
            mr: "मिश्रण पाण्यात ढवळा (मीठ विरघळते, वाळू नाही), वाळू गाळून घ्या, मग पाणी उडवून मीठ मिळवा",
          },
          {
            en: "Heat the dry mixture till the salt melts away from the sand",
            hi: "सूखा मिश्रण तपाइए, नमक पिघलकर रेत से अलग हो जाएगा",
            mr: "कोरडे मिश्रण तापवा, मीठ वितळून वाळूपासून वेगळे होईल",
          },
          {
            en: "Blow on the mixture — the salt will winnow out",
            hi: "मिश्रण पर फूँकिए — नमक ओसाकर निकल जाएगा",
            mr: "मिश्रणावर फुंका — मीठ पाखडून निघेल",
          },
          {
            en: "It cannot be done once salt touches sand",
            hi: "नमक रेत से मिल जाए तो कुछ नहीं हो सकता",
            mr: "मीठ वाळूत मिसळले की काही होऊ शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "No single method fits, so chain three: water splits the pair by SOLUBILITY (salt hides in the water, sand refuses), the filter catches the sand, and evaporation hands the salt back — the same three differences, used in a row. Hard separations are just easy ones queued up in the right order.",
          hi: "कोई अकेला तरीक़ा नहीं बैठता, तो तीन जोड़िए: पानी जोड़ी को घुलनशीलता से तोड़ता है (नमक पानी में छिप जाता है, रेत इनकार करती है), छन्नी रेत पकड़ती है, और वाष्पन नमक लौटा देता है — वही तीन फ़र्क़, क़तार में बरते हुए। कठिन पृथक्करण दरअसल सही क्रम में लगे आसान पृथक्करण ही हैं।",
          mr: "कोणतीही एकटी रीत बसत नाही, म्हणून तीन जोडा: पाणी जोडीला विद्राव्यतेने फोडते (मीठ पाण्यात लपते, वाळू नकार देते), गाळणी वाळू पकडते, आणि बाष्पीभवन मीठ परत देते — तेच तीन फरक, रांगेत वापरलेले. कठीण पृथक्करणे म्हणजे योग्य क्रमाने लावलेली सोपी पृथक्करणेच.",
        },
      },
      {
        level: 6,
        stem: {
          en: "On a windless day the farmer's winnowing fails — chaff and grain fall together. What exactly is missing, and what does that reveal about every separation method?",
          hi: "बिना हवा के दिन किसान का ओसाना चूक जाता है — भूसी और दाना साथ गिरते हैं। ठीक-ठीक क्या ग़ायब है, और यह हर पृथक्करण-तरीक़े के बारे में क्या खोलता है?",
          mr: "वारा नसलेल्या दिवशी शेतकऱ्याचे पाखडणे फसते — भुसा आणि दाणा एकत्र पडतात. नेमके काय गैरहजर आहे, आणि ते प्रत्येक पृथक्करण-रीतीबद्दल काय उघड करते?",
        },
        choices: [
          {
            en: "The force that ACTS on the difference is missing — a weight difference separates nothing by itself; every method needs both a difference and something to exploit it",
            hi: "फ़र्क़ पर काम करने वाला बल ग़ायब है — वज़न का फ़र्क़ अपने आप कुछ अलग नहीं करता; हर तरीक़े को फ़र्क़ भी चाहिए और उसे बरतने वाला भी",
            mr: "फरकावर काम करणारे बळ गैरहजर आहे — वजनाचा फरक स्वतःहून काही वेगळे करत नाही; प्रत्येक रीतीला फरकही हवा आणि तो वापरणारेही हवे",
          },
          {
            en: "The grain has become as light as the chaff",
            hi: "दाना भूसी जितना हलका हो गया है",
            mr: "दाणा भुशाइतका हलका झाला आहे",
          },
          {
            en: "Winnowing only works in winter",
            hi: "ओसाना केवल सर्दियों में चलता है",
            mr: "पाखडणे फक्त हिवाळ्यात चालते",
          },
          {
            en: "The farmer poured from too low a height",
            hi: "किसान ने बहुत नीचे से गिराया",
            mr: "शेतकऱ्याने फार खालून ओतले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The weight difference is still there — but nothing is pulling on it sideways. The wind is winnowing's engine, as the mesh is sieving's and gravity is settling's: difference plus force, always both. That is why the farmer waits for a breeze or stands a fan by the heap — he is not changing the grain, he is supplying the missing half of the method.",
          hi: "वज़न का फ़र्क़ अब भी है — पर उस पर बग़ल से कोई खिंचाव नहीं। हवा ओसाने का इंजन है, जैसे जाली छानने का और गुरुत्व बैठने का: फ़र्क़ और बल, हमेशा दोनों। इसीलिए किसान हवा की बाट जोहता है या ढेर के पास पंखा रखता है — वह दाना नहीं बदल रहा, तरीक़े का छूटा आधा जुटा रहा है।",
          mr: "वजनाचा फरक अजूनही आहे — पण त्याच्यावर बाजूने काही ओढत नाही. वारा हे पाखडण्याचे इंजिन, जशी जाळी चाळण्याचे आणि गुरुत्व निवळण्याचे: फरक अधिक बळ, नेहमी दोन्ही. म्हणूनच शेतकरी वाऱ्याची वाट पाहतो वा ढिगाजवळ पंखा ठेवतो — तो दाणा बदलत नाही, रीतीचा गळलेला अर्धा भाग पुरवतो आहे.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 12 — Electricity and Circuits (the loop that lights the bulb)   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-6-electricity-and-circuits",
    subject: "SCIENCE",
    classLevel: 6,
    chapter: {
      en: "Chapter 12 — Electricity and Circuits",
      hi: "अध्याय 12 — विद्युत तथा परिपथ",
      mr: "प्रकरण 12 — वीज आणि परिपथ",
    },
    name: {
      en: "Electricity and Circuits",
      hi: "विद्युत तथा परिपथ",
      mr: "वीज आणि परिपथ",
    },
    summary: {
      en: "A cell, a bulb and two wires — the closed loop that makes the filament glow, the switch that breaks it on purpose, and the materials that let current through or stop it.",
      hi: "एक सेल, एक बल्ब और दो तार — वह बंद फेरा जो फ़िलामेंट जलाता है, वह स्विच जो उसे जान-बूझकर तोड़ता है, और वे पदार्थ जो धारा को राह देते या रोकते हैं।",
      mr: "एक सेल, एक बल्ब आणि दोन तारा — तंतू पेटवणारा बंद वेढा, तो मुद्दाम तोडणारे बटण, आणि विजेला वाट देणारे वा अडवणारे पदार्थ.",
    },
    position: 12,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "cell",
        name: { en: "The electric cell", hi: "विद्युत सेल", mr: "विद्युत सेल" },
        kind: "part",
        prompt: {
          en: "Which small can of stored chemicals pushes the current, its two ends marked + and −?",
          hi: "जमा रसायनों का कौन-सा छोटा डिब्बा धारा को धकेलता है — उसके दो सिरों पर + और − लिखे हैं?",
          mr: "साठवलेल्या रसायनांचा कोणता छोटा डबा विजेला ढकलतो — त्याच्या दोन टोकांवर + आणि − लिहिलेले असते?",
        },
        statement: {
          en: "The cell pushes the current round the circuit — its chemicals do the work, and its two terminals, + and −, are where the loop must connect.",
          hi: "सेल धारा को परिपथ में धकेलता है — काम उसके रसायन करते हैं, और उसके दो टर्मिनल, + और −, वहीं फेरा जुड़ना चाहिए।",
          mr: "सेल विजेला परिपथात ढकलतो — काम त्याची रसायने करतात, आणि त्याची दोन अग्रे, + आणि −, तिथेच वेढा जुळला पाहिजे.",
        },
        detail: {
          en: "When its chemicals are used up, the cell goes 'dead' — the loop is perfect and still nothing glows.",
          hi: "रसायन चुक जाएँ तो सेल 'मर' जाता है — फेरा बिलकुल ठीक है, फिर भी कुछ नहीं जलता।",
          mr: "रसायने संपली की सेल 'मरतो' — वेढा अगदी नीट, तरी काही पेटत नाही.",
        },
        extra: {
          en: "Two cells end to end push harder — if their + and − faces are joined the right way round.",
          hi: "दो सेल सिरे-से-सिरा ज़्यादा ज़ोर से धकेलते हैं — बशर्ते उनके + और − मुख सही क्रम में जुड़े हों।",
          mr: "दोन सेल टोकाला टोक अधिक जोरात ढकलतात — त्यांची + आणि − तोंडे योग्य क्रमाने जुळली तर.",
        },
        pair: {
          left: { en: "The cell", hi: "सेल", mr: "सेल" },
          right: { en: "the current's pusher", hi: "धारा का धकेलने वाला", mr: "विजेचा ढकलणारा" },
        },
      },
      {
        id: "filament",
        name: { en: "The filament", hi: "फ़िलामेंट (तंतु)", mr: "तंतू (फिलामेंट)" },
        kind: "part",
        prompt: {
          en: "Inside the bulb's glass, which hair-thin wire is the ONLY part that actually glows?",
          hi: "बल्ब के शीशे के भीतर कौन-सा बाल-सा पतला तार इकलौता हिस्सा है जो सचमुच जलता है?",
          mr: "बल्बच्या काचेच्या आत कोणती केसासारखी बारीक तार हाच एकमेव भाग खरोखर पेटतो?",
        },
        statement: {
          en: "The filament is the hair-thin wire inside the bulb — current squeezing through it makes it white-hot, and that heat is the light.",
          hi: "फ़िलामेंट बल्ब के भीतर का बाल-सा तार है — उसमें से निचुड़ती धारा उसे धधका देती है, और वही ताप रोशनी है।",
          mr: "तंतू ही बल्बमधली केसासारखी तार — तिच्यातून पिळून जाणारी वीज तिला लालबुंद करते, आणि तीच उष्णता म्हणजे प्रकाश.",
        },
        pair: {
          left: { en: "The filament", hi: "फ़िलामेंट", mr: "तंतू" },
          right: { en: "the wire that glows", hi: "जलने वाला तार", mr: "पेटणारी तार" },
        },
      },
      {
        id: "closedcircuit",
        name: { en: "The closed circuit", hi: "बंद परिपथ", mr: "बंद परिपथ" },
        kind: "idea",
        prompt: {
          en: "From one terminal, through the bulb, back to the other terminal — what do we call this complete unbroken loop?",
          hi: "एक टर्मिनल से, बल्ब से होकर, दूसरे टर्मिनल तक वापस — इस पूरे अटूट फेरे को क्या कहते हैं?",
          mr: "एका अग्रापासून, बल्बमधून, दुसऱ्या अग्रापर्यंत परत — या पूर्ण अखंड वेढ्याला काय म्हणतात?",
        },
        statement: {
          en: "A closed circuit is one unbroken loop from terminal to terminal — the current flows, and the bulb glows, only while the loop is whole.",
          hi: "बंद परिपथ टर्मिनल से टर्मिनल तक एक अटूट फेरा है — धारा तभी बहती और बल्ब तभी जलता है जब तक फेरा साबुत है।",
          mr: "बंद परिपथ म्हणजे अग्रापासून अग्रापर्यंत एक अखंड वेढा — वेढा अखंड असेपर्यंतच वीज वाहते आणि बल्ब पेटतो.",
        },
        detail: {
          en: "One break ANYWHERE — a loose wire, a snapped filament — and the whole loop is dead.",
          hi: "कहीं भी एक दरार — ढीला तार, टूटा फ़िलामेंट — और पूरा फेरा ठप।",
          mr: "कुठेही एक तुटवा — सैल तार, तुटलेला तंतू — आणि सारा वेढा ठप्प.",
        },
        extra: {
          en: "The current needs the WHOLE road home; half a road carries nothing at all.",
          hi: "धारा को घर तक पूरी सड़क चाहिए; आधी सड़क कुछ भी नहीं ढोती।",
          mr: "विजेला घरापर्यंत अख्खी सडक हवी; अर्धी सडक काहीच वाहत नाही.",
        },
        pair: {
          left: { en: "The closed loop", hi: "बंद फेरा", mr: "बंद वेढा" },
          right: {
            en: "the only road current takes",
            hi: "धारा की इकलौती राह",
            mr: "विजेची एकुलती वाट",
          },
        },
      },
      {
        id: "switch",
        name: { en: "The switch", hi: "स्विच", mr: "बटण (स्विच)" },
        kind: "part",
        prompt: {
          en: "Which small device breaks the loop and remakes it at a fingertip — a gap opened and closed on purpose?",
          hi: "कौन-सा छोटा उपकरण उँगली भर से फेरा तोड़ता और फिर जोड़ देता है — जान-बूझकर खोली-बंद की जाती दरार?",
          mr: "कोणते छोटे साधन बोटाच्या टोकावर वेढा तोडते आणि पुन्हा जोडते — मुद्दाम उघड-बंद केला जाणारा तुटवा?",
        },
        statement: {
          en: "The switch is a deliberate gap in the circuit — OFF opens the loop, ON closes it; it is the one break we build in on purpose.",
          hi: "स्विच परिपथ की जानी-बूझी दरार है — OFF फेरा खोलता है, ON जोड़ता है; यही एक टूट है जो हम जान-बूझकर बनाते हैं।",
          mr: "बटण म्हणजे परिपथातला हेतुपुरस्सर तुटवा — OFF वेढा उघडते, ON जोडते; हाच एक तुटवा आपण मुद्दाम बांधतो.",
        },
        pair: {
          left: { en: "The switch", hi: "स्विच", mr: "बटण" },
          right: { en: "a gap on purpose", hi: "जान-बूझी दरार", mr: "मुद्दामचा तुटवा" },
        },
      },
      {
        id: "conductors",
        name: { en: "Conductors", hi: "चालक", mr: "वाहक" },
        kind: "material",
        prompt: {
          en: "Copper wire, an iron nail, the steel of a safety pin — which family of materials lets current pass through?",
          hi: "ताँबे का तार, लोहे की कील, सेफ़्टी-पिन का स्टील — पदार्थों का कौन-सा परिवार धारा को पार जाने देता है?",
          mr: "तांब्याची तार, लोखंडी खिळा, सेफ्टी-पिनचे स्टील — पदार्थांचे कोणते कुटुंब विजेला पार जाऊ देते?",
        },
        statement: {
          en: "Conductors let current through — the metals lead this family, which is why wires have metal hearts.",
          hi: "चालक धारा को राह देते हैं — इस परिवार के मुखिया धातु हैं, इसीलिए तारों के हृदय धातु के होते हैं।",
          mr: "वाहक विजेला वाट देतात — या कुटुंबाचे प्रमुख धातू, म्हणूनच तारांची हृदये धातूची असतात.",
        },
        pair: {
          left: { en: "Conductors", hi: "चालक", mr: "वाहक" },
          right: { en: "current's open road", hi: "धारा की खुली सड़क", mr: "विजेची खुली वाट" },
        },
      },
      {
        id: "insulators",
        name: { en: "Insulators", hi: "अचालक (विद्युतरोधी)", mr: "विद्युतरोधक" },
        kind: "material",
        prompt: {
          en: "Rubber, plastic, dry wood — which family of materials refuses to carry current, and so wraps every wire we touch?",
          hi: "रबर, प्लास्टिक, सूखी लकड़ी — पदार्थों का कौन-सा परिवार धारा ढोने से इनकार करता है, और इसीलिए हमारे छुए हर तार को लपेटे रहता है?",
          mr: "रबर, प्लास्टिक, कोरडे लाकूड — पदार्थांचे कोणते कुटुंब वीज वाहायला नकार देते, आणि म्हणूनच आपण शिवतो त्या प्रत्येक तारेला गुंडाळलेले असते?",
        },
        statement: {
          en: "Insulators do not let current through — rubber, plastic and dry wood block its way, and so make electricity safe to hold.",
          hi: "अचालक धारा को राह नहीं देते — रबर, प्लास्टिक और सूखी लकड़ी उसका रास्ता रोकते हैं, और यों बिजली को थामने लायक़ सुरक्षित बनाते हैं।",
          mr: "विद्युतरोधक विजेला वाट देत नाहीत — रबर, प्लास्टिक आणि कोरडे लाकूड तिची वाट अडवतात, आणि अशी वीज धरण्याइतकी सुरक्षित करतात.",
        },
        detail: {
          en: "The plastic on a wire is a wall for the current and a glove for the hand.",
          hi: "तार का प्लास्टिक धारा के लिए दीवार है और हाथ के लिए दस्ताना।",
          mr: "तारेवरचे प्लास्टिक विजेसाठी भिंत आणि हातासाठी हातमोजा.",
        },
        extra: {
          en: "Wet things change sides — water helps current along, which is why wet hands and switches must never meet.",
          hi: "गीली चीज़ें पाला बदल लेती हैं — पानी धारा का साथ देता है, इसीलिए गीले हाथ और स्विच कभी नहीं मिलने चाहिए।",
          mr: "ओल्या वस्तू बाजू बदलतात — पाणी विजेला साथ देते, म्हणूनच ओले हात आणि बटण कधीही भेटू नयेत.",
        },
        pair: {
          left: { en: "Insulators", hi: "अचालक", mr: "विद्युतरोधक" },
          right: { en: "current's closed door", hi: "धारा का बंद दरवाज़ा", mr: "विजेचे बंद दार" },
        },
      },
      {
        id: "fusedbulb",
        name: { en: "The fused bulb", hi: "फ़्यूज़ हुआ बल्ब", mr: "उडालेला बल्ब" },
        kind: "part",
        prompt: {
          en: "The circuit is perfect, the cell is fresh — yet no light. Inside the glass, the thin wire hangs snapped. What is this bulb called?",
          hi: "परिपथ ठीक, सेल नया — फिर भी रोशनी नहीं। शीशे के भीतर पतला तार टूटा लटकता है। इस बल्ब को क्या कहते हैं?",
          mr: "परिपथ नीट, सेल नवा — तरी प्रकाश नाही. काचेच्या आत बारीक तार तुटून लोंबते आहे. या बल्बला काय म्हणतात?",
        },
        statement: {
          en: "A fused bulb has a snapped filament — the break hides inside the glass, quietly opening the whole circuit.",
          hi: "फ़्यूज़ हुए बल्ब का फ़िलामेंट टूटा होता है — दरार शीशे के भीतर छिपी रहती है, चुपचाप पूरा परिपथ खोलती हुई।",
          mr: "उडालेल्या बल्बचा तंतू तुटलेला असतो — तुटवा काचेच्या आत लपून, गुपचूप सारा परिपथ उघडतो.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort these into CONDUCTORS and INSULATORS: an iron nail, a rubber eraser, copper wire, a plastic scale. Which sorting is right?",
          hi: "इन्हें चालक और अचालक में छाँटिए: लोहे की कील, रबर, ताँबे का तार, प्लास्टिक की पटरी। कौन-सी छँटाई सही है?",
          mr: "यांची वाहक आणि विद्युतरोधक अशी वर्गवारी करा: लोखंडी खिळा, खोडरबर, तांब्याची तार, प्लास्टिकची पट्टी. कोणती वर्गवारी बरोबर?",
        },
        choices: [
          {
            en: "Conductors: iron nail, copper wire · Insulators: eraser, plastic scale",
            hi: "चालक: कील, ताँबे का तार · अचालक: रबर, पटरी",
            mr: "वाहक: खिळा, तांब्याची तार · विद्युतरोधक: खोडरबर, पट्टी",
          },
          {
            en: "Conductors: eraser, copper wire · Insulators: iron nail, plastic scale",
            hi: "चालक: रबर, ताँबे का तार · अचालक: कील, पटरी",
            mr: "वाहक: खोडरबर, तांब्याची तार · विद्युतरोधक: खिळा, पट्टी",
          },
          {
            en: "Conductors: plastic scale, iron nail · Insulators: copper wire, eraser",
            hi: "चालक: पटरी, कील · अचालक: ताँबे का तार, रबर",
            mr: "वाहक: पट्टी, खिळा · विद्युतरोधक: तांब्याची तार, खोडरबर",
          },
          {
            en: "Conductors: eraser, plastic scale · Insulators: iron nail, copper wire",
            hi: "चालक: रबर, पटरी · अचालक: कील, ताँबे का तार",
            mr: "वाहक: खोडरबर, पट्टी · विद्युतरोधक: खिळा, तांब्याची तार",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The metals — iron and copper — conduct; the rubber and plastic refuse. The tester circuit proves it in seconds: bridge its gap with the nail and the bulb lights, bridge it with the eraser and nothing stirs. Material, not shape, decides.",
          hi: "धातुएँ — लोहा और ताँबा — चालक हैं; रबर और प्लास्टिक इनकार करते हैं। परीक्षक-परिपथ पलों में साबित कर देता है: दरार को कील से पाटिए तो बल्ब जलता है, रबर से पाटिए तो कुछ नहीं हिलता। फ़ैसला पदार्थ करता है, आकार नहीं।",
          mr: "धातू — लोखंड आणि तांबे — वाहक; रबर आणि प्लास्टिक नकार देतात. चाचणी-परिपथ क्षणांत सिद्ध करतो: तुटवा खिळ्याने सांधा तर बल्ब पेटतो, खोडरबराने सांधा तर काही हलत नाही. निर्णय पदार्थ करतो, आकार नव्हे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The torch bulb will not glow. There are three suspects: a dead cell, a fused bulb, a loose wire. You have ONE spare bulb known to be good. What is the smartest first test?",
          hi: "टॉर्च का बल्ब नहीं जल रहा। तीन संदिग्ध हैं: मरा सेल, फ़्यूज़ बल्ब, ढीला तार। आपके पास एक अच्छा साबित फ़ालतू बल्ब है। सबसे समझदार पहली जाँच क्या है?",
          mr: "टॉर्चचा बल्ब पेटत नाही. तीन संशयित: मेलेला सेल, उडालेला बल्ब, सैल तार. तुमच्याकडे एक चांगला ठाऊक असलेला जादा बल्ब आहे. सर्वांत हुशार पहिली चाचणी कोणती?",
        },
        choices: [
          {
            en: "Swap in the good bulb — if light comes, the old bulb was fused; if not, the fault lies in cell or wiring, and one test has halved the mystery",
            hi: "अच्छा बल्ब लगाइए — रोशनी आए तो पुराना बल्ब फ़्यूज़ था; न आए तो दोष सेल या तार में है, और एक जाँच ने पहेली आधी कर दी",
            mr: "चांगला बल्ब बसवा — प्रकाश आला तर जुना बल्ब उडाला होता; नाही आला तर दोष सेल वा तारेत, आणि एका चाचणीने कोडे अर्धे झाले",
          },
          {
            en: "Buy a new cell first — cells fail most often",
            hi: "पहले नया सेल ख़रीदिए — सेल ही सबसे ज़्यादा बिगड़ते हैं",
            mr: "आधी नवा सेल आणा — सेलच सर्वाधिक बिघडतात",
          },
          {
            en: "Shake the torch hard and hope",
            hi: "टॉर्च को ज़ोर से हिलाइए और उम्मीद कीजिए",
            mr: "टॉर्च जोरात हलवा आणि आशा करा",
          },
          {
            en: "Replace everything at once to be sure",
            hi: "पक्का करने को सब कुछ एक साथ बदल दीजिए",
            mr: "खात्रीसाठी सारे एकदम बदला",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A good test splits the suspects. The spare bulb is the one part you can swap with CERTAINTY about it — so the outcome speaks clearly either way: glow convicts the old bulb; darkness acquits bulbs entirely and points at cell or wire. Replacing everything 'to be sure' fixes the torch but teaches nothing; the scientist's repair names the culprit.",
          hi: "अच्छी जाँच संदिग्धों को बाँटती है। फ़ालतू बल्ब ही वह हिस्सा है जिसके बारे में आप यक़ीन से अदला-बदली कर सकते हैं — तो नतीजा दोनों ओर साफ़ बोलता है: रोशनी पुराने बल्ब को दोषी ठहराती है; अँधेरा बल्बों को पूरी तरह बरी कर सेल या तार की ओर उँगली उठाता है। 'पक्का करने को' सब बदलना टॉर्च सुधार देता है पर कुछ सिखाता नहीं; वैज्ञानिक की मरम्मत दोषी का नाम लेती है।",
          mr: "चांगली चाचणी संशयितांना विभागते. जादा बल्ब हाच भाग आहे ज्याच्याबद्दल खात्रीने अदलाबदल करता येते — म्हणून निकाल दोन्हीकडे स्पष्ट बोलतो: प्रकाश जुन्या बल्बला दोषी ठरवतो; अंधार बल्बांना पूर्ण निर्दोष ठरवून सेल वा तारेकडे बोट दाखवतो. 'खात्रीसाठी' सारे बदलणे टॉर्च दुरुस्त करते पण काही शिकवत नाही; वैज्ञानिकाची दुरुस्ती दोषीचे नाव घेते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "An electrician's screwdriver has a steel blade and a thick plastic handle. Why BOTH materials — why not all steel, or all plastic?",
          hi: "बिजली-मिस्त्री के पेचकस में स्टील का फल और मोटा प्लास्टिक का हत्था है। दोनों पदार्थ क्यों — पूरा स्टील या पूरा प्लास्टिक क्यों नहीं?",
          mr: "विजेतंत्रीच्या स्क्रूड्रायव्हरला स्टीलचे पाते आणि जाड प्लास्टिकची मूठ असते. दोन्ही पदार्थ का — सारे स्टील वा सारे प्लास्टिक का नाही?",
        },
        choices: [
          {
            en: "The steel does the work and the plastic guards the hand — the tool pairs a conductor where strength is needed with an insulator where the body holds it",
            hi: "स्टील काम करता है और प्लास्टिक हाथ की रखवाली — औज़ार वहाँ चालक जोड़ता है जहाँ मज़बूती चाहिए, और वहाँ अचालक जहाँ शरीर उसे थामता है",
            mr: "स्टील काम करते आणि प्लास्टिक हाताची राखण — हत्यार जिथे बळकटी हवी तिथे वाहक आणि जिथे शरीर धरते तिथे विद्युतरोधक जोडते",
          },
          {
            en: "Plastic blades bend, so steel is only for strength — safety has nothing to do with it",
            hi: "प्लास्टिक का फल मुड़ जाता है, स्टील केवल मज़बूती के लिए है — सुरक्षा से कोई लेना-देना नहीं",
            mr: "प्लास्टिकचे पाते वाकते, स्टील फक्त बळकटीसाठी — सुरक्षेशी काही संबंध नाही",
          },
          {
            en: "Two materials simply cost less than one",
            hi: "दो पदार्थ एक से सस्ते पड़ते हैं",
            mr: "दोन पदार्थ एकाहून स्वस्त पडतात",
          },
          {
            en: "The plastic is only decoration for the brand",
            hi: "प्लास्टिक केवल ब्रांड की सजावट है",
            mr: "प्लास्टिक फक्त ब्रँडची सजावट आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "If a live wire meets the blade, the steel would happily carry current onward — and the plastic handle is the wall that stops it at the hand. All-steel would conduct into the electrician; all-plastic would snap at the first stiff screw. The tool is the chapter in one object: conductor and insulator, each exactly where its nature serves.",
          hi: "फल से चालू तार छू जाए तो स्टील धारा को ख़ुशी-ख़ुशी आगे ले जाएगा — और प्लास्टिक का हत्था वह दीवार है जो उसे हाथ पर रोक देती है। पूरा स्टील बिजली मिस्त्री तक पहुँचा देता; पूरा प्लास्टिक पहले ही कड़े पेच पर टूट जाता। यह औज़ार एक ही चीज़ में पूरा अध्याय है: चालक और अचालक, हर एक ठीक वहाँ जहाँ उसका स्वभाव काम आए।",
          mr: "पात्याला चालू तार लागली तर स्टील वीज आनंदाने पुढे नेईल — आणि प्लास्टिकची मूठ ही तिला हातावर थांबवणारी भिंत. सारे स्टील विजेतंत्र्यापर्यंत वीज पोहोचवेल; सारे प्लास्टिक पहिल्याच घट्ट स्क्रूवर मोडेल. हे हत्यार म्हणजे एका वस्तूत सारे प्रकरण: वाहक आणि विद्युतरोधक, प्रत्येक नेमका जिथे त्याचा स्वभाव उपयोगी तिथे.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 7 — Getting to Know Plants (stems, leaves, roots, flowers)      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-6-getting-to-know-plants",
    subject: "SCIENCE",
    classLevel: 6,
    chapter: {
      en: "Chapter 7 — Getting to Know Plants",
      hi: "अध्याय 7 — पौधों को जानिए",
      mr: "प्रकरण 7 — वनस्पतींची ओळख",
    },
    name: {
      en: "Getting to Know Plants",
      hi: "पौधों को जानिए",
      mr: "वनस्पतींची ओळख",
    },
    summary: {
      en: "Herbs, shrubs and trees, the stem's water pipeline, leaves that cook in sunlight, roots that mirror the veins — a plant read part by part.",
      hi: "शाक, झाड़ी और पेड़, तने की पानी-पाइपलाइन, धूप में खाना पकाती पत्तियाँ, शिराओं से मेल खाती जड़ें — अंग-अंग पढ़ा हुआ पौधा।",
      mr: "रोपटी, झुडपे आणि वृक्ष, खोडाची पाणी-वाहिनी, उन्हात अन्न शिजवणारी पाने, शिरांशी जुळणारी मुळे — अवयवावयवाने वाचलेली वनस्पती.",
    },
    position: 7,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "herb",
        name: { en: "The herb", hi: "शाक (हर्ब)", mr: "रोपटे (हर्ब)" },
        kind: "plant-type",
        prompt: {
          en: "Mint, tomato, coriander — which kind of plant is small, with a soft green stem you can bend between two fingers?",
          hi: "पुदीना, टमाटर, धनिया — कौन-सी क़िस्म का पौधा छोटा होता है, जिसका नरम हरा तना दो उँगलियों में मुड़ जाए?",
          mr: "पुदिना, टोमॅटो, कोथिंबीर — कोणत्या प्रकारची वनस्पती लहान असते, जिचे मऊ हिरवे खोड दोन बोटांत वाकते?",
        },
        statement: {
          en: "A herb is a small plant with a soft, green, bendable stem — mint and coriander live and die within a season or two.",
          hi: "शाक छोटा पौधा है जिसका तना नरम, हरा और लचीला होता है — पुदीना और धनिया एक-दो मौसमों में जी-मर लेते हैं।",
          mr: "रोपटे म्हणजे मऊ, हिरवे, वाकणारे खोड असलेली लहान वनस्पती — पुदिना आणि कोथिंबीर एक-दोन हंगामांत जगून जातात.",
        },
        pair: {
          left: { en: "The herb", hi: "शाक", mr: "रोपटे" },
          right: {
            en: "a soft stem you can bend",
            hi: "मुड़ जाने वाला नरम तना",
            mr: "वाकणारे मऊ खोड",
          },
        },
      },
      {
        id: "shrub",
        name: { en: "The shrub", hi: "झाड़ी", mr: "झुडूप" },
        kind: "plant-type",
        prompt: {
          en: "Rose, lemon, mehndi — which kind of plant has a hard stem that BRANCHES right from near the ground?",
          hi: "गुलाब, नींबू, मेहँदी — कौन-सी क़िस्म के पौधे का कड़ा तना ज़मीन के पास से ही शाखाएँ छोड़ता है?",
          mr: "गुलाब, लिंबू, मेंदी — कोणत्या प्रकारच्या वनस्पतीचे कडक खोड जमिनीजवळूनच फांद्या फुटते?",
        },
        statement: {
          en: "A shrub has a hard stem branching from near the base — bushy and waist-high to head-high, like rose and mehndi.",
          hi: "झाड़ी का कड़ा तना जड़ के पास से शाखाएँ छोड़ता है — झाड़दार, कमर से सिर तक ऊँची, जैसे गुलाब और मेहँदी।",
          mr: "झुडपाचे कडक खोड बुंध्याजवळून फांद्या फोडते — झुबकेदार, कमरे ते डोक्याइतके उंच, गुलाब आणि मेंदीसारखे.",
        },
        pair: {
          left: { en: "The shrub", hi: "झाड़ी", mr: "झुडूप" },
          right: {
            en: "branches from near the ground",
            hi: "ज़मीन के पास से शाखाएँ",
            mr: "जमिनीजवळून फांद्या",
          },
        },
      },
      {
        id: "tree",
        name: { en: "The tree", hi: "पेड़ (वृक्ष)", mr: "वृक्ष" },
        kind: "plant-type",
        prompt: {
          en: "Mango, neem, banyan — which kind of plant stands tall on one thick, hard, woody trunk, its branches high above your head?",
          hi: "आम, नीम, बरगद — कौन-सी क़िस्म का पौधा एक मोटे, कड़े, काठ वाले तने पर ऊँचा खड़ा होता है, शाखाएँ सिर से बहुत ऊपर?",
          mr: "आंबा, कडुनिंब, वड — कोणत्या प्रकारची वनस्पती एका जाड, कडक, लाकडी खोडावर उंच उभी असते, फांद्या डोक्याच्या खूप वर?",
        },
        statement: {
          en: "A tree rises on a single thick woody trunk, branching high above the ground — mango and neem outlive the hands that plant them.",
          hi: "पेड़ एक मोटे काठ के तने पर उठता है, शाखाएँ ज़मीन से ऊँचे — आम और नीम उन्हें रोपने वाले हाथों से ज़्यादा जीते हैं।",
          mr: "वृक्ष एका जाड लाकडी खोडावर उंचावतो, फांद्या जमिनीपासून उंचावर — आंबा आणि कडुनिंब त्यांना लावणाऱ्या हातांहून जास्त जगतात.",
        },
      },
      {
        id: "stem",
        name: { en: "The stem", hi: "तना", mr: "खोड" },
        kind: "plant-part",
        prompt: {
          en: "Stand a white-flowered stalk in red-tinted water, and by evening the petals' veins run red. Which part just proved it lifts water?",
          hi: "सफ़ेद फूल वाली डंडी लाल रँगे पानी में खड़ी कीजिए, शाम तक पंखुड़ियों की शिराएँ लाल दौड़ने लगती हैं। किस अंग ने अभी साबित किया कि वह पानी चढ़ाता है?",
          mr: "पांढऱ्या फुलाची दांडी लाल रंगवलेल्या पाण्यात उभी करा, संध्याकाळपर्यंत पाकळ्यांच्या शिरा लाल धावू लागतात. कोणत्या अवयवाने आत्ताच सिद्ध केले की तो पाणी चढवतो?",
        },
        statement: {
          en: "The stem is the plant's pipeline — it lifts water from root to leaf, as the red-water experiment shows in one afternoon.",
          hi: "तना पौधे की पाइपलाइन है — वह जड़ से पत्ती तक पानी चढ़ाता है, जैसा लाल-पानी का प्रयोग एक दोपहर में दिखा देता है।",
          mr: "खोड ही वनस्पतीची जलवाहिनी — ते मुळापासून पानापर्यंत पाणी चढवते, लाल-पाण्याचा प्रयोग एका दुपारीत दाखवतो तसे.",
        },
        detail: {
          en: "Cut the dyed stem across and the red shows as tiny dots — the pipes themselves, caught in cross-section.",
          hi: "रँगे तने को आड़ा काटिए तो लाल नन्हे बिंदुओं में दिखता है — ख़ुद नलियाँ, आड़े कट में पकड़ी हुईं।",
          mr: "रंगलेले खोड आडवे कापा, लाल इवल्या ठिपक्यांत दिसते — स्वतः नळ्या, आडव्या छेदात पकडलेल्या.",
        },
        extra: {
          en: "It carries the leaves' cooked food DOWN as well — a two-way road with different lanes.",
          hi: "वह पत्तियों का पका खाना नीचे भी ले जाता है — अलग-अलग लेन वाली दो-तरफ़ा सड़क।",
          mr: "ते पानांचे शिजलेले अन्न खालीही नेते — वेगळ्या मार्गिकांची दुतर्फा सडक.",
        },
        pair: {
          left: { en: "The stem", hi: "तना", mr: "खोड" },
          right: {
            en: "the water's lift-pipe",
            hi: "पानी की चढ़ान-नली",
            mr: "पाण्याची चढण-नळी",
          },
        },
      },
      {
        id: "leaf",
        name: { en: "The leaf", hi: "पत्ती", mr: "पान" },
        kind: "plant-part",
        prompt: {
          en: "Which flat green part is the plant's kitchen — cooking food from sunlight, air and water, a work no animal can do?",
          hi: "कौन-सा चपटा हरा अंग पौधे की रसोई है — धूप, हवा और पानी से खाना पकाता, ऐसा काम जो कोई जानवर नहीं कर सकता?",
          mr: "कोणता सपाट हिरवा अवयव वनस्पतीचे स्वयंपाकघर आहे — ऊन, हवा आणि पाण्यातून अन्न शिजवणारा, कोणताही प्राणी करू शकत नाही असे काम?",
        },
        statement: {
          en: "The leaf is the plant's food factory — its green traps sunlight and cooks food from air and water, feeding the whole plant.",
          hi: "पत्ती पौधे का भोजन-कारख़ाना है — उसकी हरियाली धूप पकड़कर हवा और पानी से खाना पकाती है, पूरा पौधा उसी से पलता है।",
          mr: "पान म्हणजे वनस्पतीचा अन्न-कारखाना — त्याचा हिरवेपणा ऊन पकडून हवा आणि पाण्यातून अन्न शिजवतो, सारी वनस्पती त्यावरच पोसते.",
        },
        pair: {
          left: { en: "The leaf", hi: "पत्ती", mr: "पान" },
          right: {
            en: "the kitchen of sunlight",
            hi: "धूप की रसोई",
            mr: "उन्हाचे स्वयंपाकघर",
          },
        },
      },
      {
        id: "transpiration",
        name: { en: "Transpiration", hi: "वाष्पोत्सर्जन", mr: "बाष्पोत्सर्जन" },
        kind: "plant-part",
        prompt: {
          en: "Tie a polythene bag over a leafy branch on a sunny day — by afternoon, droplets mist its inside. What leaf-work put them there?",
          hi: "धूप वाले दिन पत्तेदार डाल पर पॉलीथीन बाँधिए — दोपहर तक उसके भीतर बूँदें धुँधला जाती हैं। पत्ती के किस काम ने उन्हें वहाँ रखा?",
          mr: "उन्हाच्या दिवशी पानेदार फांदीवर पॉलिथीन बांधा — दुपारपर्यंत त्याच्या आत थेंब धुके धरतात. पानाच्या कोणत्या कामाने ते तिथे ठेवले?",
        },
        statement: {
          en: "Transpiration is the leaves breathing out water as vapour — the bagged branch catches it as droplets, water the roots drank that morning.",
          hi: "वाष्पोत्सर्जन में पत्तियाँ पानी को भाप बनाकर छोड़ती हैं — बँधी थैली उसे बूँदों में पकड़ लेती है; वही पानी जो जड़ों ने सुबह पिया था।",
          mr: "बाष्पोत्सर्जनात पाने पाणी वाफ करून सोडतात — बांधलेली पिशवी ते थेंबांत पकडते; तेच पाणी जे मुळांनी सकाळी प्यायले होते.",
        },
        pair: {
          left: { en: "Transpiration", hi: "वाष्पोत्सर्जन", mr: "बाष्पोत्सर्जन" },
          right: {
            en: "leaves breathing out water",
            hi: "पानी छोड़ती साँस लेती पत्तियाँ",
            mr: "पाणी सोडणारी पाने",
          },
        },
      },
      {
        id: "taproot",
        name: { en: "The taproot", hi: "मूसला जड़", mr: "सोटमूळ" },
        kind: "root-type",
        prompt: {
          en: "Pull up a mustard plant: one main root drives straight down, side-roots branching off it. What is this root plan called?",
          hi: "सरसों का पौधा उखाड़िए: एक मुख्य जड़ सीधी नीचे उतरती है, बग़ल की जड़ें उससे फूटती हैं। इस जड़-योजना को क्या कहते हैं?",
          mr: "मोहरीचे रोप उपटा: एक मुख्य मूळ सरळ खाली जाते, बाजूची मुळे त्यातून फुटतात. या मूळ-रचनेला काय म्हणतात?",
        },
        statement: {
          en: "A taproot is one main root going straight down with smaller side-roots — mustard, neem and mango grow this way.",
          hi: "मूसला जड़ में एक मुख्य जड़ सीधी नीचे जाती है और छोटी बग़ली जड़ें उससे — सरसों, नीम और आम इसी ढंग से उगते हैं।",
          mr: "सोटमुळात एक मुख्य मूळ सरळ खाली जाते आणि लहान बाजूची मुळे त्यातून — मोहरी, कडुनिंब आणि आंबा असेच वाढतात.",
        },
        pair: {
          left: { en: "The taproot", hi: "मूसला जड़", mr: "सोटमूळ" },
          right: {
            en: "one main root, then branches",
            hi: "एक मुख्य जड़, फिर शाखाएँ",
            mr: "एक मुख्य मूळ, मग फाटे",
          },
        },
      },
      {
        id: "fibrousroot",
        name: { en: "The fibrous roots", hi: "झकड़ा जड़ें", mr: "तंतुमय मुळे" },
        kind: "root-type",
        prompt: {
          en: "Pull up a tuft of grass or a wheat plant: no main root at all, only a bunch of thin, similar roots. What is this plan called?",
          hi: "घास का गुच्छा या गेहूँ का पौधा उखाड़िए: कोई मुख्य जड़ नहीं, बस पतली, एक-सी जड़ों का झुंड। इस योजना को क्या कहते हैं?",
          mr: "गवताचा पुंजका वा गव्हाचे रोप उपटा: मुख्य मूळ नाहीच, फक्त बारीक, सारख्या मुळांचा झुबका. या रचनेला काय म्हणतात?",
        },
        statement: {
          en: "Fibrous roots are a bunch of similar thin roots with no main one — the way of grass, wheat and maize.",
          hi: "झकड़ा जड़ें पतली, एक-सी जड़ों का झुंड हैं, कोई मुख्य नहीं — घास, गेहूँ और मक्का की रीत।",
          mr: "तंतुमय मुळे म्हणजे मुख्य नसलेला बारीक, सारख्या मुळांचा झुबका — गवत, गहू आणि मक्याची रीत.",
        },
        detail: {
          en: "Its leaves show PARALLEL veins — root plan and leaf veins go together, in both plant families.",
          hi: "उसकी पत्तियों में समांतर शिराएँ दिखती हैं — जड़-योजना और पत्ती-शिराएँ साथ चलती हैं, दोनों पौध-परिवारों में।",
          mr: "त्याच्या पानांत समांतर शिरा दिसतात — मूळ-रचना आणि पान-शिरा एकत्र जातात, दोन्ही वनस्पति-कुटुंबांत.",
        },
        extra: {
          en: "The tuft grips topsoil wide and shallow — why grass binds a slope better than a deep lone root would.",
          hi: "झुंड ऊपरी मिट्टी को चौड़ा-उथला जकड़ता है — इसीलिए ढलान को घास एक गहरी अकेली जड़ से बेहतर बाँधती है।",
          mr: "झुबका वरची माती रुंद-उथळ धरतो — म्हणूनच उतार गवत एका खोल एकट्या मुळाहून चांगला बांधते.",
        },
        pair: {
          left: { en: "Fibrous roots", hi: "झकड़ा जड़ें", mr: "तंतुमय मुळे" },
          right: {
            en: "a tuft with no leader",
            hi: "बिना मुखिया का झुंड",
            mr: "पुढारी नसलेला झुबका",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort these plants by kind: A-mint, B-rose, C-neem. Which trio is right?",
          hi: "इन पौधों को क़िस्म से छाँटिए: अ-पुदीना, ब-गुलाब, स-नीम। कौन-सी तिकड़ी सही है?",
          mr: "या वनस्पती प्रकाराने लावा: अ-पुदिना, ब-गुलाब, क-कडुनिंब. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: herb · B: shrub · C: tree",
            hi: "अ: शाक · ब: झाड़ी · स: पेड़",
            mr: "अ: रोपटे · ब: झुडूप · क: वृक्ष",
          },
          {
            en: "A: shrub · B: tree · C: herb",
            hi: "अ: झाड़ी · ब: पेड़ · स: शाक",
            mr: "अ: झुडूप · ब: वृक्ष · क: रोपटे",
          },
          {
            en: "A: tree · B: herb · C: shrub",
            hi: "अ: पेड़ · ब: शाक · स: झाड़ी",
            mr: "अ: वृक्ष · ब: रोपटे · क: झुडूप",
          },
          {
            en: "A: herb · B: tree · C: shrub",
            hi: "अ: शाक · ब: पेड़ · स: झाड़ी",
            mr: "अ: रोपटे · ब: वृक्ष · क: झुडूप",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Read the stem: mint's bends soft and green — herb; rose's is hard and branches at the base — shrub; neem climbs one woody trunk — tree. The stem is the sorting key the chapter hands you; height alone can mislead, the stem does not.",
          hi: "तना पढ़िए: पुदीने का नरम-हरा मुड़ता है — शाक; गुलाब का कड़ा है और जड़ से शाखाएँ — झाड़ी; नीम एक काठ के तने पर चढ़ता है — पेड़। छाँटने की कुंजी तना है, जो अध्याय थमाता है; अकेली ऊँचाई भटका सकती है, तना नहीं।",
          mr: "खोड वाचा: पुदिन्याचे मऊ-हिरवे वाकते — रोपटे; गुलाबाचे कडक आणि बुंध्यापासून फांद्या — झुडूप; कडुनिंब एका लाकडी खोडावर चढतो — वृक्ष. लावणीची किल्ली खोड आहे, जी प्रकरण देते; एकटी उंची भरकटवू शकते, खोड नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A leaf in your hand shows a net of criss-cross (reticulate) veins. Without digging at all, what can you say about the plant's ROOTS — and how dare you say it?",
          hi: "हाथ की पत्ती में जालीदार (जालिका) शिराएँ दिखती हैं। बिना ज़रा भी खोदे, पौधे की जड़ों के बारे में क्या कह सकते हैं — और कहने की हिम्मत कैसे?",
          mr: "हातातल्या पानात जाळीदार (जालिका) शिरा दिसतात. अजिबात न खणता, वनस्पतीच्या मुळांबद्दल काय सांगू शकाल — आणि सांगण्याचे धाडस कसे?",
        },
        choices: [
          {
            en: "It has a taproot — reticulate veins and taproots travel together in one plant family, so the leaf testifies about the hidden root",
            hi: "उसकी मूसला जड़ है — जालिका शिराएँ और मूसला जड़ें एक ही पौध-परिवार में साथ चलती हैं, तो पत्ती छिपी जड़ की गवाही देती है",
            mr: "तिला सोटमूळ आहे — जालिका शिरा आणि सोटमुळे एकाच वनस्पति-कुटुंबात एकत्र जातात, म्हणून पान लपलेल्या मुळाची साक्ष देते",
          },
          {
            en: "Nothing — leaves and roots have no connection",
            hi: "कुछ नहीं — पत्तियों और जड़ों में कोई नाता नहीं",
            mr: "काहीच नाही — पाने आणि मुळांत नाते नाही",
          },
          {
            en: "It has fibrous roots, since nets look like tufts",
            hi: "झकड़ा जड़ें हैं, क्योंकि जाल झुंड-सा दिखता है",
            mr: "तंतुमय मुळे आहेत, कारण जाळे झुबक्यासारखे दिसते",
          },
          {
            en: "It has no roots at all",
            hi: "उसकी जड़ें हैं ही नहीं",
            mr: "तिला मुळेच नाहीत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Plants keep a pattern: net-veined leaves ride above taproots; parallel-veined blades (grass, wheat) ride above fibrous tufts. So one leaf in the hand reports on a root underground — a prediction you could dig up and check. That is science's favourite move: a visible thing vouching for an invisible one, testably.",
          hi: "पौधे एक क़ायदा निभाते हैं: जालीदार पत्तियाँ मूसला जड़ों के ऊपर सवार हैं; समांतर शिराओं वाली पत्तियाँ (घास, गेहूँ) झकड़ा झुंड के ऊपर। तो हाथ की एक पत्ती ज़मीन के नीचे की जड़ की ख़बर देती है — ऐसी भविष्यवाणी जिसे खोदकर जाँचा जा सकता है। विज्ञान की प्रिय चाल यही है: दिखती चीज़ अनदेखी की ज़मानत दे, जाँचने लायक़ ढंग से।",
          mr: "वनस्पती एक कायदा पाळतात: जाळीदार पाने सोटमुळांवर स्वार; समांतर शिरांची पाती (गवत, गहू) तंतुमय झुबक्यांवर. म्हणून हातातले एक पान जमिनीखालच्या मुळाची खबर देते — खणून तपासता येईल असे भाकीत. विज्ञानाची आवडती चाल हीच: दिसणारी गोष्ट न दिसणाऱ्याची हमी देते, तपासण्याजोग्या रीतीने.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Two potted plants sit in the sun. One's leaves are bagged in polythene; by evening its bag is misted while the plant looks the same. What has the experiment made VISIBLE?",
          hi: "धूप में दो गमले हैं। एक की पत्तियों पर पॉलीथीन बँधी है; शाम तक उसकी थैली धुँधली है जबकि पौधा वैसा ही दिखता है। प्रयोग ने क्या दिखने लायक़ बना दिया?",
          mr: "उन्हात दोन कुंड्या आहेत. एकीच्या पानांवर पॉलिथीन बांधले आहे; संध्याकाळपर्यंत तिची पिशवी धुरकट होते तर वनस्पती तशीच दिसते. प्रयोगाने काय दिसण्याजोगे केले?",
        },
        choices: [
          {
            en: "The invisible water the leaves breathe out all day — the bag only trapped what always escapes unseen into the air",
            hi: "वह अदृश्य पानी जो पत्तियाँ दिन भर छोड़ती हैं — थैली ने बस वही पकड़ा जो हमेशा अनदेखा हवा में निकल जाता है",
            mr: "पाने दिवसभर सोडतात ते अदृश्य पाणी — पिशवीने फक्त तेच पकडले जे नेहमी न दिसता हवेत निसटते",
          },
          {
            en: "The plant sweating because the bag made it hot",
            hi: "थैली की गर्मी से पौधे का पसीना",
            mr: "पिशवीच्या उकाड्याने वनस्पतीचा घाम",
          },
          {
            en: "Rain that leaked into the bag",
            hi: "थैली में रिसी बारिश",
            mr: "पिशवीत झिरपलेला पाऊस",
          },
          {
            en: "The polythene itself turning into water",
            hi: "ख़ुद पॉलीथीन का पानी बन जाना",
            mr: "स्वतः पॉलिथीनचे पाणी होणे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The droplets were leaving the leaves every sunny day — as vapour, invisible, joining the air. The bag changes nothing about the plant; it only closes the door so the escaping water must condense where eyes can find it. Good experiments often work exactly this way: not making something happen, but making the already-happening show itself.",
          hi: "बूँदें हर धूप वाले दिन पत्तियों से निकल रही थीं — भाप बनकर, अदृश्य, हवा में मिलती हुईं। थैली पौधे में कुछ नहीं बदलती; वह बस दरवाज़ा बंद करती है ताकि निकलता पानी वहीं ओस बने जहाँ आँखें उसे पा लें। अच्छे प्रयोग अक्सर ठीक ऐसे ही चलते हैं: कुछ घटित नहीं कराते, जो पहले से घट रहा है उसे दिखा देते हैं।",
          mr: "थेंब प्रत्येक उन्हाच्या दिवशी पानांतून निघत होते — वाफ होऊन, अदृश्य, हवेत मिळत. पिशवी वनस्पतीत काही बदलत नाही; ती फक्त दार बंद करते म्हणजे निसटणारे पाणी डोळ्यांना सापडेल तिथे थेंब व्हावे. चांगले प्रयोग अनेकदा असेच चालतात: काही घडवत नाहीत, आधीच घडणारे दाखवतात.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 8 — Body Movements (joints, bones and boneless movers)          */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-6-body-movements",
    subject: "SCIENCE",
    classLevel: 6,
    chapter: {
      en: "Chapter 8 — Body Movements",
      hi: "अध्याय 8 — शरीर में गति",
      mr: "प्रकरण 8 — शरीरातील हालचाली",
    },
    name: { en: "Body Movements", hi: "शरीर में गति", mr: "शरीरातील हालचाली" },
    summary: {
      en: "Ball-and-socket, hinge and pivot joints, the rib cage's bone box, muscles that only pull — and the earthworm that travels with no bones at all.",
      hi: "कंदुक-खल्लिका, कब्ज़ा और धुराग्र जोड़, पसलियों का हड्डी-पिंजरा, केवल खींचने वाली पेशियाँ — और वह केंचुआ जो बिना एक भी हड्डी के सफ़र करता है।",
      mr: "उखळी, बिजागरी आणि कीलक सांधे, बरगड्यांचा हाडांचा पिंजरा, फक्त ओढणारे स्नायू — आणि एकही हाड नसताना प्रवास करणारे गांडूळ.",
    },
    position: 8,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "ballsocket",
        name: {
          en: "The ball-and-socket joint",
          hi: "कंदुक-खल्लिका जोड़",
          mr: "उखळीचा सांधा",
        },
        kind: "joint",
        prompt: {
          en: "Swing your arm in a full circle at the shoulder — which kind of joint allows that all-round freedom?",
          hi: "कंधे से बाँह को पूरा गोल घुमाइए — किस क़िस्म का जोड़ यह चौतरफ़ा आज़ादी देता है?",
          mr: "खांद्यातून हात पूर्ण गोल फिरवा — कोणत्या प्रकारचा सांधा ही चौफेर मोकळीक देतो?",
        },
        statement: {
          en: "In a ball-and-socket joint a round bone-head turns inside a cup — the shoulder and hip swing in every direction because of it.",
          hi: "कंदुक-खल्लिका जोड़ में गोल हड्डी-सिरा कटोरी में घूमता है — कंधा और कूल्हा इसी से हर दिशा में झूलते हैं।",
          mr: "उखळीच्या सांध्यात गोल हाड-डोके वाटीत फिरते — खांदा आणि खुबा त्यामुळेच प्रत्येक दिशेला झुलतात.",
        },
        pair: {
          left: { en: "Ball-and-socket", hi: "कंदुक-खल्लिका", mr: "उखळीचा सांधा" },
          right: {
            en: "a swing in every direction",
            hi: "हर दिशा में झूला",
            mr: "प्रत्येक दिशेला झोका",
          },
        },
      },
      {
        id: "hinge",
        name: { en: "The hinge joint", hi: "कब्ज़ा जोड़", mr: "बिजागरीचा सांधा" },
        kind: "joint",
        prompt: {
          en: "The knee and elbow fold one way and refuse every other — like which fitting on a door?",
          hi: "घुटना और कोहनी एक ही ओर मुड़ते हैं और बाक़ी हर ओर से इनकार — दरवाज़े की किस चीज़ की तरह?",
          mr: "गुडघा आणि कोपर एकाच बाजूला वाकतात आणि बाकी साऱ्यांना नकार — दाराच्या कशासारखे?",
        },
        statement: {
          en: "A hinge joint bends in one plane only — knee and elbow open and close like a door, never sideways.",
          hi: "कब्ज़ा जोड़ एक ही तल में मुड़ता है — घुटना और कोहनी दरवाज़े-से खुलते-बंद होते हैं, कभी बग़ल में नहीं।",
          mr: "बिजागरीचा सांधा एकाच प्रतलात वाकतो — गुडघा आणि कोपर दारासारखे उघड-बंद होतात, कधीही बाजूला नाही.",
        },
        detail: {
          en: "That one-way limit is strength: a knee that swung every way would buckle under the body's weight.",
          hi: "वही एक-तरफ़ा सीमा ताक़त है: हर ओर झूलता घुटना शरीर के वज़न तले धँस जाता।",
          mr: "तीच एकतर्फी मर्यादा म्हणजे बळ: प्रत्येक दिशेला झुलणारा गुडघा शरीराच्या वजनाखाली मोडला असता.",
        },
        extra: {
          en: "Machines copied it long ago — every door and laptop lid folds on the knee's plan.",
          hi: "मशीनों ने इसे कब का नक़ल कर लिया — हर दरवाज़ा और लैपटॉप का ढक्कन घुटने की योजना पर मुड़ता है।",
          mr: "यंत्रांनी हे केव्हाच उचलले — प्रत्येक दार आणि लॅपटॉपचे झाकण गुडघ्याच्या आराखड्यावर वाकते.",
        },
        pair: {
          left: { en: "The hinge joint", hi: "कब्ज़ा जोड़", mr: "बिजागरीचा सांधा" },
          right: {
            en: "one way, like a door",
            hi: "एक ही ओर, दरवाज़े-सा",
            mr: "एकाच बाजूला, दारासारखे",
          },
        },
      },
      {
        id: "pivot",
        name: { en: "The pivot joint", hi: "धुराग्र जोड़", mr: "कीलकाचा सांधा" },
        kind: "joint",
        prompt: {
          en: "Shake your head 'no' — which joint, where skull meets spine, lets the head turn side to side on its post?",
          hi: "सिर से 'ना' कहिए — खोपड़ी और रीढ़ की मिलन-जगह का कौन-सा जोड़ सिर को उसकी खूँटी पर इधर-उधर घुमाता है?",
          mr: "मानेने 'नाही' म्हणा — कवटी आणि मणका मिळतो तिथला कोणता सांधा डोक्याला त्याच्या खुंटीवर इकडेतिकडे फिरवतो?",
        },
        statement: {
          en: "The pivot joint at the top of the spine lets the head turn on a bony post — the 'no' shake is its signature.",
          hi: "रीढ़ के शीर्ष का धुराग्र जोड़ सिर को हड्डी की खूँटी पर घुमाता है — 'ना' की झलक उसी का हस्ताक्षर है।",
          mr: "मणक्याच्या माथ्यावरचा कीलक सांधा डोक्याला हाडाच्या खुंटीवर फिरवतो — 'नाही'ची मान हीच त्याची सही.",
        },
      },
      {
        id: "ribcage",
        name: { en: "The rib cage", hi: "पसली-पिंजर", mr: "बरगड्यांचा पिंजरा" },
        kind: "bone",
        prompt: {
          en: "Which curved bones join breastbone to backbone, building a box round the heart and lungs?",
          hi: "कौन-सी मुड़ी हड्डियाँ छाती की हड्डी को रीढ़ से जोड़कर दिल और फेफड़ों के गिर्द डिब्बा बनाती हैं?",
          mr: "कोणती वाकडी हाडे छातीचे हाड मणक्याशी जोडून हृदय आणि फुप्फुसांभोवती पेटी बांधतात?",
        },
        statement: {
          en: "The rib cage is a bone box round the heart and lungs — ribs curving from backbone to breastbone, armour that still moves for breath.",
          hi: "पसली-पिंजर दिल-फेफड़ों के गिर्द हड्डी का डिब्बा है — रीढ़ से छाती की हड्डी तक मुड़ी पसलियाँ; ऐसा कवच जो साँस के लिए हिलता भी है।",
          mr: "बरगड्यांचा पिंजरा हृदय-फुप्फुसांभोवतीची हाडांची पेटी — मणक्यापासून छातीच्या हाडापर्यंत वाकलेल्या बरगड्या; श्वासासाठी हलणारे चिलखत.",
        },
        pair: {
          left: { en: "The rib cage", hi: "पसली-पिंजर", mr: "बरगड्यांचा पिंजरा" },
          right: {
            en: "armour round heart and lungs",
            hi: "दिल-फेफड़ों का कवच",
            mr: "हृदय-फुप्फुसांचे चिलखत",
          },
        },
      },
      {
        id: "backbone",
        name: { en: "The backbone", hi: "रीढ़ की हड्डी", mr: "पाठीचा कणा" },
        kind: "bone",
        prompt: {
          en: "Run a thumb down a friend's back: not one long bone but a chain of many small ones. What is this chain called?",
          hi: "दोस्त की पीठ पर अँगूठा फेरिए: एक लंबी हड्डी नहीं, कई छोटी हड्डियों की माला। इस माला को क्या कहते हैं?",
          mr: "मित्राच्या पाठीवरून अंगठा फिरवा: एक लांब हाड नव्हे, अनेक लहान हाडांची माळ. या माळेला काय म्हणतात?",
        },
        statement: {
          en: "The backbone is a chain of many small bones stacked on one another — many joints in a row are what let the back bend and twist.",
          hi: "रीढ़ एक-पर-एक चढ़ी कई छोटी हड्डियों की माला है — क़तार के ढेरों जोड़ ही पीठ को झुकने-मुड़ने देते हैं।",
          mr: "कणा म्हणजे एकावर एक रचलेल्या अनेक लहान हाडांची माळ — रांगेतले पुष्कळ सांधेच पाठीला वाकू-वळू देतात.",
        },
        pair: {
          left: { en: "The backbone", hi: "रीढ़", mr: "कणा" },
          right: {
            en: "a chain of small bones",
            hi: "छोटी हड्डियों की माला",
            mr: "लहान हाडांची माळ",
          },
        },
      },
      {
        id: "musclepairs",
        name: { en: "Muscle pairs", hi: "पेशियों की जोड़ियाँ", mr: "स्नायूंच्या जोड्या" },
        kind: "mover",
        prompt: {
          en: "Bend your elbow and one muscle bulges; straighten it and its PARTNER takes over. Why do muscles work two to a bone?",
          hi: "कोहनी मोड़िए तो एक पेशी उभरती है; सीधी कीजिए तो उसकी जोड़ीदार काम सँभालती है। पेशियाँ हड्डी पर दो-दो होकर क्यों काम करती हैं?",
          mr: "कोपर वाकवा तर एक स्नायू फुगतो; सरळ करा तर त्याचा जोडीदार काम घेतो. स्नायू हाडावर दोघे-दोघे का काम करतात?",
        },
        statement: {
          en: "Muscles can only PULL, never push — so every bone needs a pair: one muscle bends it, the partner pulls it straight again.",
          hi: "पेशियाँ केवल खींच सकती हैं, धकेल नहीं सकतीं — इसलिए हर हड्डी को जोड़ी चाहिए: एक पेशी मोड़ती है, जोड़ीदार वापस सीधा खींचती है।",
          mr: "स्नायू फक्त ओढू शकतात, ढकलू शकत नाहीत — म्हणून प्रत्येक हाडाला जोडी हवी: एक स्नायू वाकवतो, जोडीदार परत सरळ ओढतो.",
        },
        detail: {
          en: "When one of the pair pulls, the other must relax and lengthen — they take strict turns.",
          hi: "जोड़ी में एक खींचे तो दूसरी को ढीला होकर लंबा होना पड़ता है — वे कड़ी बारियाँ निभाती हैं।",
          mr: "जोडीतला एक ओढतो तेव्हा दुसऱ्याला सैल होऊन लांबावे लागते — ते काटेकोर आळीपाळी पाळतात.",
        },
        extra: {
          en: "Feel it: the bulge swaps sides of your arm as the elbow bends and straightens.",
          hi: "महसूस कीजिए: कोहनी के मुड़ने-सीधे होने पर उभार बाँह की करवट बदल लेता है।",
          mr: "जाणवून पाहा: कोपर वाकता-सरळ होता फुगवटा हाताची बाजू बदलतो.",
        },
        pair: {
          left: { en: "Muscle pairs", hi: "पेशियों की जोड़ियाँ", mr: "स्नायूंच्या जोड्या" },
          right: {
            en: "pull and pull-back",
            hi: "खिंचाव और वापसी-खिंचाव",
            mr: "ओढ आणि परत-ओढ",
          },
        },
      },
      {
        id: "earthworm2",
        name: { en: "The earthworm's travel", hi: "केंचुए का सफ़र", mr: "गांडुळाचा प्रवास" },
        kind: "mover",
        prompt: {
          en: "No bones, no legs — yet it crosses the garden bed by lengthening, gripping with tiny bristles, and pulling itself up. Who moves like this?",
          hi: "न हड्डी, न टाँग — फिर भी लंबा होकर, नन्हे शूकों से जकड़कर, ख़ुद को समेटता हुआ क्यारी पार कर जाता है। ऐसे कौन चलता है?",
          mr: "हाड नाही, पाय नाही — तरी लांबत, इवल्या शूकांनी धरत, स्वतःला आवळत वाफा ओलांडते. असे कोण चालते?",
        },
        statement: {
          en: "The earthworm travels bonelessly — its body lengthens forward, tiny bristles grip the ground, and the rear is pulled up: squeeze, grip, repeat.",
          hi: "केंचुआ बिना हड्डी सफ़र करता है — शरीर आगे लंबा होता है, नन्हे शूक ज़मीन जकड़ते हैं, और पिछला हिस्सा खिंच आता है: सिकुड़ो, जकड़ो, दोहराओ।",
          mr: "गांडूळ हाडांविना प्रवास करते — शरीर पुढे लांबते, इवले शूक जमीन धरतात, आणि मागचा भाग ओढला जातो: आवळा, धरा, पुन्हा.",
        },
      },
      {
        id: "fish2",
        name: { en: "The fish's swimming", hi: "मछली की तैराकी", mr: "माशाचे पोहणे" },
        kind: "mover",
        prompt: {
          en: "Which swimmer's whole body is shaped like a boat's hull, curving side to side while the tail flicks it forward?",
          hi: "किस तैराक का पूरा शरीर नाव के पेंदे-सा गढ़ा है — इधर-उधर लहराता, जबकि पूँछ उसे आगे झटकती है?",
          mr: "कोणत्या पोहणाऱ्याचे सबंध शरीर होडीच्या तळासारखे घडले आहे — इकडेतिकडे लवत, तर शेपटी त्याला पुढे झटकते?",
        },
        statement: {
          en: "The fish swims with a streamlined body — curving side to side in waves while the tail pushes against the water.",
          hi: "मछली धारा-रेखीय शरीर से तैरती है — लहरों में इधर-उधर मुड़ती, जबकि पूँछ पानी पर ज़ोर देती है।",
          mr: "मासा प्रवाहरेखित शरीराने पोहतो — लाटांत इकडेतिकडे वळत, तर शेपटी पाण्यावर जोर देते.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the joint to its home: A-swings all directions, B-folds one way only, C-turns the head on a post. Which trio is right?",
          hi: "जोड़ को उसके घर से मिलाइए: अ-हर दिशा में झूलता है, ब-एक ही ओर मुड़ता है, स-सिर को खूँटी पर घुमाता है। कौन-सी तिकड़ी सही है?",
          mr: "सांधा त्याच्या घराशी जुळवा: अ-प्रत्येक दिशेला झुलतो, ब-एकाच बाजूला वाकतो, क-डोके खुंटीवर फिरवतो. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: shoulder · B: knee · C: neck",
            hi: "अ: कंधा · ब: घुटना · स: गर्दन",
            mr: "अ: खांदा · ब: गुडघा · क: मान",
          },
          {
            en: "A: knee · B: neck · C: shoulder",
            hi: "अ: घुटना · ब: गर्दन · स: कंधा",
            mr: "अ: गुडघा · ब: मान · क: खांदा",
          },
          {
            en: "A: neck · B: shoulder · C: knee",
            hi: "अ: गर्दन · ब: कंधा · स: घुटना",
            mr: "अ: मान · ब: खांदा · क: गुडघा",
          },
          {
            en: "A: shoulder · B: neck · C: knee",
            hi: "अ: कंधा · ब: गर्दन · स: घुटना",
            mr: "अ: खांदा · ब: मान · क: गुडघा",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The shoulder's ball rolls in its socket — all directions; the knee's hinge folds one way like a door; the neck's pivot turns the head on its post. Try each movement as you answer — your own body is the chapter's laboratory.",
          hi: "कंधे का गोला अपनी कटोरी में लुढ़कता है — हर दिशा; घुटने का कब्ज़ा दरवाज़े-सा एक ओर मुड़ता है; गर्दन का धुराग्र सिर को खूँटी पर घुमाता है। उत्तर देते-देते हर चाल आज़माइए — आपका अपना शरीर ही अध्याय की प्रयोगशाला है।",
          mr: "खांद्याचा गोळा वाटीत घरंगळतो — प्रत्येक दिशा; गुडघ्याची बिजागरी दारासारखी एका बाजूला वाकते; मानेचा कीलक डोके खुंटीवर फिरवतो. उत्तर देताना प्रत्येक हालचाल करून पाहा — तुमचे स्वतःचे शरीर हीच प्रकरणाची प्रयोगशाळा.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Muscles can only pull. Knowing just that one fact, why must every bone that moves have TWO muscles attached, not one?",
          hi: "पेशियाँ केवल खींच सकती हैं। बस यही एक तथ्य जानकर बताइए — हिलने वाली हर हड्डी पर दो पेशियाँ क्यों जुड़ी होनी चाहिए, एक क्यों नहीं?",
          mr: "स्नायू फक्त ओढू शकतात. एवढेच एक तथ्य जाणून सांगा — हलणाऱ्या प्रत्येक हाडाला दोन स्नायू का जोडलेले हवेत, एक का नाही?",
        },
        choices: [
          {
            en: "One muscle can bend the bone but cannot push it back — only a partner pulling from the other side can return it",
            hi: "एक पेशी हड्डी मोड़ सकती है पर धकेलकर लौटा नहीं सकती — दूसरी ओर से खींचती जोड़ीदार ही उसे वापस ला सकती है",
            mr: "एक स्नायू हाड वाकवू शकतो पण ढकलून परत आणू शकत नाही — दुसऱ्या बाजूने ओढणारा जोडीदारच ते परत आणू शकतो",
          },
          {
            en: "Two muscles simply make the arm look stronger",
            hi: "दो पेशियाँ बस बाँह को बलवान दिखाती हैं",
            mr: "दोन स्नायू नुसते हाताला बलवान दाखवतात",
          },
          {
            en: "One muscle would tire too fast working alone",
            hi: "अकेली पेशी जल्दी थक जाती",
            mr: "एकटा स्नायू लवकर दमला असता",
          },
          {
            en: "Bones need two muscles to stay warm",
            hi: "हड्डियों को गर्म रहने के लिए दो पेशियाँ चाहिए",
            mr: "हाडांना ऊब राहायला दोन स्नायू लागतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Follow the one fact to its end: a puller can bend the elbow, but no pull from the SAME side can straighten it — pulling a rope never pushes the bucket back down the well. So nature fits an opponent across the joint, and the two take turns. Every movement you make is a polite argument between two muscles that can each only say 'come here'.",
          hi: "उस एक तथ्य को अंत तक ले जाइए: खींचने वाली कोहनी मोड़ सकती है, पर उसी ओर का कोई खिंचाव उसे सीधा नहीं कर सकता — रस्सी खींचने से बाल्टी कुएँ में वापस नहीं धँसती। इसलिए प्रकृति जोड़ के आर-पार एक प्रतिद्वंद्वी बिठाती है, और दोनों बारी-बारी चलते हैं। आपकी हर चाल दो पेशियों की विनम्र बहस है, जिनमें से हर एक केवल 'इधर आओ' कह सकती है।",
          mr: "ते एक तथ्य शेवटपर्यंत न्या: ओढणारा कोपर वाकवू शकतो, पण त्याच बाजूची कोणतीही ओढ ते सरळ करू शकत नाही — दोरी ओढल्याने बादली विहिरीत परत जात नाही. म्हणून निसर्ग सांध्यापलीकडे प्रतिस्पर्धी बसवतो, आणि दोघे आळीपाळीने चालतात. तुमची प्रत्येक हालचाल म्हणजे फक्त 'इकडे ये' म्हणू शकणाऱ्या दोन स्नायूंचा सभ्य वाद.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The backbone could have been one strong rod — instead it is thirty-odd small bones stacked in a chain. What does the chain buy that the rod could not?",
          hi: "रीढ़ एक मज़बूत छड़ हो सकती थी — पर वह माला में चढ़ी तीस-एक छोटी हड्डियाँ है। माला वह क्या दिलाती है जो छड़ नहीं दे पाती?",
          mr: "कणा एक बळकट दांडा असू शकला असता — पण तो माळेत रचलेली तीस-एक लहान हाडे आहे. माळ ते काय मिळवून देते जे दांडा देऊ शकला नसता?",
        },
        choices: [
          {
            en: "Bending — each small joint turns a little, and thirty littles add up to a bow, a twist, a somersault; a rod is strong but frozen",
            hi: "झुकाव — हर छोटा जोड़ थोड़ा मुड़ता है, और तीस थोड़े मिलकर झुकना, मुड़ना, कलाबाज़ी बन जाते हैं; छड़ मज़बूत है पर जड़",
            mr: "वाकणे — प्रत्येक लहान सांधा थोडा वळतो, आणि तीस थोडे मिळून वाकणे, वळणे, कोलांटी होते; दांडा बळकट पण गोठलेला",
          },
          {
            en: "Lightness — many bones weigh less than one",
            hi: "हलकापन — कई हड्डियाँ एक से हलकी होती हैं",
            mr: "हलकेपणा — अनेक हाडे एकाहून हलकी असतात",
          },
          {
            en: "Spares — if one breaks, the others replace it",
            hi: "अतिरिक्त — एक टूटे तो बाक़ी उसकी जगह लें",
            mr: "जादा — एक मोडले तर बाकी त्याची जागा घेतात",
          },
          {
            en: "Nothing — the chain is just easier to grow",
            hi: "कुछ नहीं — माला बस उगाने में आसान है",
            mr: "काहीच नाही — माळ नुसती वाढवायला सोपी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Touch your toes and count what happened: no single joint bent far, yet the whole back curved like a bow — thirty small turns summed. A rod matching the chain's strength would hold you bolt upright forever. Engineering by many-small-joints is nature's favourite trade: each link gives up a little motion so the whole gains a lot.",
          hi: "पैर के अँगूठे छूकर गिनिए क्या हुआ: कोई एक जोड़ ज़्यादा नहीं मुड़ा, फिर भी पूरी पीठ धनुष-सी झुकी — तीस छोटे मोड़ों का योग। माला जितनी मज़बूत छड़ आपको हमेशा तना खड़ा रखती। ढेर-छोटे-जोड़ों वाली इंजीनियरी प्रकृति का प्रिय सौदा है: हर कड़ी थोड़ी गति देती है ताकि पूरे को बहुत मिले।",
          mr: "पायाचे अंगठे शिवून मोजा काय झाले: कोणताही एक सांधा फार वाकला नाही, तरी सारी पाठ धनुष्यासारखी वाकली — तीस लहान वळणांची बेरीज. माळेइतका बळकट दांडा तुम्हाला कायम ताठ उभे ठेवता. अनेक-लहान-सांध्यांची अभियांत्रिकी हा निसर्गाचा आवडता सौदा: प्रत्येक कडी थोडी हालचाल देते म्हणजे साऱ्याला खूप मिळते.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 13 — Fun with Magnets (poles, compasses and the sure test)      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-6-fun-with-magnets",
    subject: "SCIENCE",
    classLevel: 6,
    chapter: {
      en: "Chapter 13 — Fun with Magnets",
      hi: "अध्याय 13 — चुंबकों द्वारा मनोरंजन",
      mr: "प्रकरण 13 — चुंबकांची गंमत",
    },
    name: { en: "Fun with Magnets", hi: "चुंबकों द्वारा मनोरंजन", mr: "चुंबकांची गंमत" },
    summary: {
      en: "What sticks and what will not, poles where the pull is strongest, the needle that finds north — and repulsion, the only test a magnet cannot fake.",
      hi: "क्या चिपकता है और क्या नहीं, ध्रुव जहाँ खिंचाव सबसे तेज़, उत्तर खोजती सुई — और प्रतिकर्षण, वह इकलौती जाँच जिसमें चुंबक धोखा नहीं दे सकता।",
      mr: "काय चिकटते आणि काय नाही, ओढ सर्वांत तीव्र असते ते ध्रुव, उत्तर शोधणारी सुई — आणि प्रतिकर्षण, चुंबकाला बनवाबनवी करता येत नाही अशी एकमेव चाचणी.",
    },
    position: 13,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "magneticmaterials",
        name: {
          en: "Magnetic materials",
          hi: "चुंबकीय पदार्थ",
          mr: "चुंबकीय पदार्थ",
        },
        kind: "material",
        prompt: {
          en: "Run a magnet through a drawer of odds and ends — the iron nails and steel pins leap to it, the plastic and wood lie still. What are the leapers called?",
          hi: "फुटकर चीज़ों की दराज़ में चुंबक फेरिए — लोहे की कीलें और स्टील की पिनें उछलकर चिपकती हैं, प्लास्टिक और लकड़ी पड़े रहते हैं। उछलने वालों को क्या कहते हैं?",
          mr: "किरकोळ वस्तूंच्या खणात चुंबक फिरवा — लोखंडी खिळे आणि स्टीलच्या पिना उडून चिकटतात, प्लास्टिक आणि लाकूड पडून राहतात. उडणाऱ्यांना काय म्हणतात?",
        },
        statement: {
          en: "Magnetic materials — iron above all — are the ones a magnet attracts; plastic, wood, glass and paper never answer its pull.",
          hi: "चुंबकीय पदार्थ — सबसे बढ़कर लोहा — वही हैं जिन्हें चुंबक खींचता है; प्लास्टिक, लकड़ी, शीशा और काग़ज़ उसकी पुकार का कभी उत्तर नहीं देते।",
          mr: "चुंबकीय पदार्थ — सर्वांत आधी लोखंड — तेच जे चुंबक ओढतो; प्लास्टिक, लाकूड, काच आणि कागद त्याच्या हाकेला कधीच उत्तर देत नाहीत.",
        },
        pair: {
          left: { en: "Iron things", hi: "लोहे की चीज़ें", mr: "लोखंडी वस्तू" },
          right: {
            en: "they answer the magnet",
            hi: "चुंबक की पुकार सुनते हैं",
            mr: "चुंबकाच्या हाकेला ओ देतात",
          },
        },
      },
      {
        id: "poles",
        name: { en: "The poles", hi: "ध्रुव", mr: "ध्रुव" },
        kind: "magnet-part",
        prompt: {
          en: "Roll a bar magnet in iron filings: they crowd thick at the two ENDS and thin out in the middle. What are those crowded ends called?",
          hi: "छड़ चुंबक को लोहे के बुरादे में लुढ़काइए: बुरादा दोनों सिरों पर घना जमता है और बीच में छँट जाता है। उन घने सिरों को क्या कहते हैं?",
          mr: "पट्टी चुंबक लोखंडाच्या किसात घोळवा: कीस दोन्ही टोकांवर दाट जमतो आणि मध्यभागी विरळतो. त्या दाट टोकांना काय म्हणतात?",
        },
        statement: {
          en: "The poles are the magnet's two ends where its pull is strongest — iron filings map them by crowding there.",
          hi: "ध्रुव चुंबक के वे दो सिरे हैं जहाँ खिंचाव सबसे तेज़ है — लोहे का बुरादा वहीं जमकर उनका नक़्शा बना देता है।",
          mr: "ध्रुव म्हणजे चुंबकाची ती दोन टोके जिथे ओढ सर्वांत तीव्र — लोखंडाचा कीस तिथेच जमून त्यांचा नकाशा काढतो.",
        },
        detail: {
          en: "Cut the magnet in half and each half grows BOTH poles again — a single pole cannot be had alone.",
          hi: "चुंबक आधा काटिए तो हर आधे में फिर दोनों ध्रुव उग आते हैं — अकेला एक ध्रुव मिल ही नहीं सकता।",
          mr: "चुंबक अर्धा कापा तर प्रत्येक अर्ध्यात पुन्हा दोन्ही ध्रुव उगवतात — एकटा एक ध्रुव मिळूच शकत नाही.",
        },
        extra: {
          en: "They are named north and south for the directions they seek when free.",
          hi: "आज़ाद होने पर वे जिन दिशाओं को खोजते हैं, उन्हीं पर उनके नाम हैं — उत्तर और दक्षिण।",
          mr: "मोकळे असताना ते ज्या दिशा शोधतात त्यांवरूनच त्यांची नावे — उत्तर आणि दक्षिण.",
        },
        pair: {
          left: { en: "The poles", hi: "ध्रुव", mr: "ध्रुव" },
          right: {
            en: "where the filings crowd",
            hi: "जहाँ बुरादा जमता है",
            mr: "जिथे कीस जमतो",
          },
        },
      },
      {
        id: "compass",
        name: { en: "The compass needle", hi: "कुतुबनुमा की सुई", mr: "होकायंत्राची सुई" },
        kind: "magnet-part",
        prompt: {
          en: "Hang any bar magnet by a thread and wait: it swings, settles, and points the SAME way every time. Which instrument is built on this habit?",
          hi: "कोई भी छड़ चुंबक धागे से लटकाकर ठहरिए: वह झूलता है, थमता है, और हर बार एक ही दिशा दिखाता है। इसी आदत पर कौन-सा यंत्र बना है?",
          mr: "कोणताही पट्टी चुंबक दोऱ्याने टांगून थांबा: तो झुलतो, स्थिरावतो, आणि प्रत्येक वेळी त्याच दिशेला रोखतो. याच सवयीवर कोणते यंत्र बांधले आहे?",
        },
        statement: {
          en: "A freely hung magnet always rests pointing north-south — the compass is just this habit in a small box, guiding travellers for centuries.",
          hi: "आज़ाद लटका चुंबक हमेशा उत्तर-दक्षिण थमता है — कुतुबनुमा इसी आदत का छोटा डिब्बा है, सदियों से मुसाफ़िरों की रहनुमाई करता।",
          mr: "मोकळा टांगलेला चुंबक नेहमी उत्तर-दक्षिण स्थिरावतो — होकायंत्र म्हणजे हीच सवय लहान डबीत, शतकानुशतके प्रवाशांना वाट दाखवणारी.",
        },
        detail: {
          en: "It points because the Earth itself behaves as a giant magnet, and small magnets answer big ones.",
          hi: "वह इसलिए दिशा दिखाता है कि पृथ्वी स्वयं विशाल चुंबक-सी बरतती है, और छोटे चुंबक बड़ों का उत्तर देते हैं।",
          mr: "तो दिशा दाखवतो कारण पृथ्वी स्वतः महाकाय चुंबकासारखी वागते, आणि लहान चुंबक मोठ्यांना उत्तर देतात.",
        },
        extra: {
          en: "Sailors trusted it under starless skies, deserts and seas alike.",
          hi: "बिना तारों के आसमान तले, रेगिस्तान हों या समुद्र, नाविक उसी पर भरोसा करते थे।",
          mr: "ताऱ्यांविना आकाशाखाली, वाळवंटे असोत वा समुद्र, खलाशी त्यावरच विसंबत.",
        },
        pair: {
          left: { en: "The compass", hi: "कुतुबनुमा", mr: "होकायंत्र" },
          right: {
            en: "north-south, every time",
            hi: "हर बार उत्तर-दक्षिण",
            mr: "प्रत्येक वेळी उत्तर-दक्षिण",
          },
        },
      },
      {
        id: "likepoles",
        name: { en: "Like poles", hi: "समान ध्रुव", mr: "समान ध्रुव" },
        kind: "pole-rule",
        prompt: {
          en: "Bring north end toward north end: the free magnet swerves AWAY before they even touch. What is this push between same-named ends called?",
          hi: "उत्तर सिरे को उत्तर सिरे की ओर लाइए: आज़ाद चुंबक छूने से पहले ही कतरा जाता है। एक नाम वाले सिरों की इस धकेल को क्या कहते हैं?",
          mr: "उत्तर टोक उत्तर टोकाकडे आणा: मोकळा चुंबक स्पर्शाआधीच बाजूला सरकतो. एकाच नावाच्या टोकांतल्या या ढकलीला काय म्हणतात?",
        },
        statement: {
          en: "Like poles repel — north pushes north away, south pushes south, a force felt across the gap before any touch.",
          hi: "समान ध्रुव प्रतिकर्षित करते हैं — उत्तर उत्तर को धकेलता है, दक्षिण दक्षिण को; छूने से पहले ही फ़ासले के पार महसूस होता बल।",
          mr: "समान ध्रुव प्रतिकर्षण करतात — उत्तर उत्तराला ढकलतो, दक्षिण दक्षिणेला; स्पर्शाआधीच अंतरापार जाणवणारे बळ.",
        },
        pair: {
          left: { en: "Like poles", hi: "समान ध्रुव", mr: "समान ध्रुव" },
          right: { en: "a push apart", hi: "दूर धकेल", mr: "दूर ढकल" },
        },
      },
      {
        id: "unlikepoles",
        name: { en: "Unlike poles", hi: "असमान ध्रुव", mr: "विरुद्ध ध्रुव" },
        kind: "pole-rule",
        prompt: {
          en: "Turn one magnet round so north faces SOUTH — the two now snap together eagerly. What is this rule of opposite ends called?",
          hi: "एक चुंबक घुमाइए कि उत्तर के सामने दक्षिण आए — दोनों अब लपककर जुड़ जाते हैं। उलटे सिरों के इस नियम को क्या कहते हैं?",
          mr: "एक चुंबक फिरवा की उत्तरासमोर दक्षिण येईल — दोघे आता झेपावून जुळतात. उलट्या टोकांच्या या नियमाला काय म्हणतात?",
        },
        statement: {
          en: "Unlike poles attract — north seizes south across the gap, the same eagerness with which like poles refuse.",
          hi: "असमान ध्रुव आकर्षित करते हैं — उत्तर फ़ासले के पार दक्षिण को थाम लेता है, उसी तत्परता से जिससे समान ध्रुव इनकार करते हैं।",
          mr: "विरुद्ध ध्रुव आकर्षण करतात — उत्तर अंतरापार दक्षिणेला पकडतो, ज्या तत्परतेने समान ध्रुव नकार देतात त्याच तत्परतेने.",
        },
      },
      {
        id: "losingmagnetism",
        name: {
          en: "A magnet's ruin",
          hi: "चुंबक की बरबादी",
          mr: "चुंबकाचा नाश",
        },
        kind: "magnet-part",
        prompt: {
          en: "Heat it in a flame, hammer it hard, drop it again and again — what happens to a magnet treated this way?",
          hi: "आँच में तपाइए, ज़ोर से हथौड़ा मारिए, बार-बार गिराइए — ऐसा बरताव पाए चुंबक का क्या होता है?",
          mr: "ज्योतीत तापवा, जोरात हातोडा मारा, पुनःपुन्हा पाडा — अशी वागणूक मिळालेल्या चुंबकाचे काय होते?",
        },
        statement: {
          en: "Heating, hammering and dropping ruin a magnet — the rough treatment scrambles its inner order and the pull fades away.",
          hi: "तपाना, ठोकना और गिराना चुंबक को बरबाद करते हैं — रूखा बरताव उसकी भीतरी तरतीब बिखेर देता है और खिंचाव बुझ जाता है।",
          mr: "तापवणे, ठोकणे आणि पाडणे चुंबकाला नासवतात — राकट वागणूक त्याची आतली शिस्त विस्कटते आणि ओढ विझते.",
        },
      },
      {
        id: "magnetrescue",
        name: {
          en: "The magnet in the sand",
          hi: "रेत में चुंबक",
          mr: "वाळूतला चुंबक",
        },
        kind: "material",
        prompt: {
          en: "Iron filings have spilled into dry sand — sieving fails, both are grains. Which one sweep sorts them in seconds?",
          hi: "लोहे का बुरादा सूखी रेत में गिर गया — छानना बेकार, दोनों कण हैं। कौन-सी एक फेरी पलों में उन्हें छाँट देती है?",
          mr: "लोखंडाचा कीस कोरड्या वाळूत सांडला — चाळणे व्यर्थ, दोन्ही कणच. कोणती एक फेरी क्षणांत त्यांना निवडते?",
        },
        statement: {
          en: "A magnet swept through the mixture lifts the iron filings out and leaves the sand — separation by a property no sieve can see.",
          hi: "मिश्रण में फेरा चुंबक लोहे का बुरादा उठा लेता है और रेत छोड़ देता है — उस गुण से पृथक्करण जिसे कोई छलनी देख नहीं सकती।",
          mr: "मिश्रणातून फिरवलेला चुंबक लोखंडाचा कीस उचलतो आणि वाळू सोडतो — कोणत्याही चाळणीला न दिसणाऱ्या गुणाने पृथक्करण.",
        },
        pair: {
          left: { en: "The magnet sweep", hi: "चुंबक की फेरी", mr: "चुंबकाची फेरी" },
          right: {
            en: "iron out, sand left",
            hi: "लोहा बाहर, रेत बाक़ी",
            mr: "लोखंड बाहेर, वाळू शिल्लक",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort these into WILL STICK to a magnet and WILL NOT: an iron nail, a plastic comb, a steel safety pin, a wooden pencil. Which sorting is right?",
          hi: "इन्हें चुंबक से चिपकेगा और नहीं चिपकेगा में छाँटिए: लोहे की कील, प्लास्टिक की कंघी, स्टील की सेफ़्टी-पिन, लकड़ी की पेंसिल। कौन-सी छँटाई सही है?",
          mr: "यांची चुंबकाला चिकटेल आणि चिकटणार नाही अशी वर्गवारी करा: लोखंडी खिळा, प्लास्टिकची फणी, स्टीलची सेफ्टी-पिन, लाकडी पेन्सिल. कोणती वर्गवारी बरोबर?",
        },
        choices: [
          {
            en: "Sticks: iron nail, steel pin · Does not: plastic comb, wooden pencil",
            hi: "चिपकेंगे: कील, स्टील-पिन · नहीं: कंघी, पेंसिल",
            mr: "चिकटतील: खिळा, स्टील-पिन · नाही: फणी, पेन्सिल",
          },
          {
            en: "Sticks: plastic comb, iron nail · Does not: steel pin, wooden pencil",
            hi: "चिपकेंगे: कंघी, कील · नहीं: स्टील-पिन, पेंसिल",
            mr: "चिकटतील: फणी, खिळा · नाही: स्टील-पिन, पेन्सिल",
          },
          {
            en: "Sticks: wooden pencil, steel pin · Does not: iron nail, plastic comb",
            hi: "चिपकेंगे: पेंसिल, स्टील-पिन · नहीं: कील, कंघी",
            mr: "चिकटतील: पेन्सिल, स्टील-पिन · नाही: खिळा, फणी",
          },
          {
            en: "Sticks: plastic comb, wooden pencil · Does not: iron nail, steel pin",
            hi: "चिपकेंगे: कंघी, पेंसिल · नहीं: कील, स्टील-पिन",
            mr: "चिकटतील: फणी, पेन्सिल · नाही: खिळा, स्टील-पिन",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Iron and steel (which is mostly iron) answer the magnet; plastic and wood never do. Note the difference from the conductor sort: there the metals ALL passed current, but magnetism is choosier still — even copper and aluminium, fine conductors, ignore a magnet completely.",
          hi: "लोहा और स्टील (जो अधिकतर लोहा है) चुंबक का उत्तर देते हैं; प्लास्टिक और लकड़ी कभी नहीं। चालक वाली छँटाई से फ़र्क़ देखिए: वहाँ सब धातुएँ धारा ले जाती थीं, पर चुंबकत्व और भी चुनिंदा है — ताँबा और एल्यूमिनियम, बढ़िया चालक होकर भी, चुंबक को पूरी तरह अनदेखा करते हैं।",
          mr: "लोखंड आणि स्टील (जे बहुतांश लोखंडच) चुंबकाला उत्तर देतात; प्लास्टिक आणि लाकूड कधीच नाही. वाहकांच्या वर्गवारीतला फरक पाहा: तिथे सारे धातू वीज नेत, पण चुंबकत्व आणखीनच चोखंदळ — तांबे आणि अ‍ॅल्युमिनियम, उत्तम वाहक असूनही, चुंबकाकडे पूर्ण दुर्लक्ष करतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Two identical-looking iron bars: one is a magnet, one is plain iron. Bringing them near, they ATTRACT — both ways round. Why does attraction prove nothing, and what single result would settle it?",
          hi: "देखने में एक-सी दो लोहे की छड़ें: एक चुंबक है, एक सादा लोहा। पास लाने पर वे खिंचती हैं — दोनों तरह से। खिंचाव कुछ साबित क्यों नहीं करता, और कौन-सा एक नतीजा फ़ैसला कर देगा?",
          mr: "दिसायला सारख्या दोन लोखंडी पट्ट्या: एक चुंबक, एक साधे लोखंड. जवळ आणल्यावर त्या ओढल्या जातात — दोन्ही प्रकारे. ओढ काही का सिद्ध करत नाही, आणि कोणता एक निकाल फैसला करेल?",
        },
        choices: [
          {
            en: "A magnet attracts plain iron AND another magnet alike — only REPULSION, seen when like poles meet, is something plain iron can never do",
            hi: "चुंबक सादे लोहे को भी और दूसरे चुंबक को भी एक-सा खींचता है — केवल प्रतिकर्षण, जो समान ध्रुवों के मिलने पर दिखता है, सादा लोहा कभी नहीं कर सकता",
            mr: "चुंबक साध्या लोखंडाला आणि दुसऱ्या चुंबकालाही सारखेच ओढतो — फक्त प्रतिकर्षण, समान ध्रुव भेटल्यावर दिसणारे, साधे लोखंड कधीच करू शकत नाही",
          },
          {
            en: "The heavier bar is always the magnet",
            hi: "भारी छड़ हमेशा चुंबक होती है",
            mr: "जड पट्टी नेहमी चुंबक असते",
          },
          {
            en: "The shinier bar is always the magnet",
            hi: "चमकीली छड़ हमेशा चुंबक होती है",
            mr: "चकचकीत पट्टी नेहमी चुंबक असते",
          },
          {
            en: "It cannot be settled without a third magnet",
            hi: "तीसरे चुंबक के बिना फ़ैसला हो ही नहीं सकता",
            mr: "तिसऱ्या चुंबकाशिवाय फैसला होऊच शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Attraction is ambiguous: iron loves magnets from either side of the friendship. But repulsion needs two like POLES — and plain iron has none to offer. So turn the bars end for end, testing every pairing: the moment ANY pairing pushes apart, the pusher in your hand is proven a magnet. In magnet-land, only 'no' is a signature; 'yes' can always be forged.",
          hi: "खिंचाव दुविधा भरा है: लोहा दोस्ती की दोनों ओर से चुंबकों को चाहता है। पर प्रतिकर्षण को दो समान ध्रुव चाहिए — और सादे लोहे के पास देने को कोई ध्रुव नहीं। तो छड़ों को सिरे-दर-सिरा पलटकर हर जोड़ी आज़माइए: जिस पल कोई जोड़ी दूर धकेले, धकेलने वाली छड़ चुंबक साबित हुई। चुंबक-जगत में केवल 'नहीं' हस्ताक्षर है; 'हाँ' हमेशा जाली हो सकती है।",
          mr: "ओढ संदिग्ध आहे: लोखंड मैत्रीच्या दोन्ही बाजूंनी चुंबकांना चाहते. पण प्रतिकर्षणाला दोन समान ध्रुव हवेत — आणि साध्या लोखंडाकडे द्यायला ध्रुवच नाहीत. म्हणून पट्ट्या टोकाटोकाने उलटवत प्रत्येक जोडी आजमावा: कोणतीही जोडी दूर ढकलेल त्या क्षणी ढकलणारी पट्टी चुंबक ठरली. चुंबक-जगात फक्त 'नाही' हीच सही; 'हो' नेहमी बनावट असू शकते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A ship's navigator on a starless, landless night trusts a needle smaller than a finger. What exactly is the compass needle answering to, out on the open sea?",
          hi: "बिना तारों, बिना किनारे की रात में जहाज़ का दिशा-नायक उँगली से छोटी सुई पर भरोसा करता है। खुले समुद्र में कुतुबनुमा की सुई ठीक-ठीक किसका उत्तर दे रही है?",
          mr: "ताऱ्यांविना, किनाऱ्याविना रात्री जहाजाचा दिशादर्शक बोटाहून लहान सुईवर विसंबतो. खुल्या समुद्रावर होकायंत्राची सुई नेमके कशाला उत्तर देते आहे?",
        },
        choices: [
          {
            en: "The Earth itself, behaving as one vast magnet — the needle is a small magnet answering the planet's pull, everywhere and always",
            hi: "स्वयं पृथ्वी को, जो एक विशाल चुंबक-सी बरतती है — सुई छोटा चुंबक है जो ग्रह के खिंचाव का उत्तर देती है, हर जगह, हर समय",
            mr: "स्वतः पृथ्वीला, जी एका महाकाय चुंबकासारखी वागते — सुई हा ग्रहाच्या ओढीला उत्तर देणारा लहान चुंबक, सर्वत्र आणि सदैव",
          },
          {
            en: "The pull of the far-off pole star",
            hi: "दूर के ध्रुवतारे का खिंचाव",
            mr: "दूरच्या ध्रुवताऱ्याची ओढ",
          },
          {
            en: "The iron in the ship's own hull",
            hi: "जहाज़ के अपने ढाँचे का लोहा",
            mr: "जहाजाच्या स्वतःच्या सांगाड्यातले लोखंड",
          },
          {
            en: "The wind, which always blows northward",
            hi: "हवा, जो हमेशा उत्तर की ओर बहती है",
            mr: "वारा, जो नेहमी उत्तरेकडे वाहतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The needle is a magnet, and magnets answer magnets: the Earth's vast magnetism reaches every deck, desert and classroom alike, turning every free needle north-south. A star can hide behind cloud; the planet under your feet cannot. (The ship's own iron CAN disturb the needle — which is why compasses are mounted with care, away from the hull's influence.)",
          hi: "सुई चुंबक है, और चुंबक चुंबकों का उत्तर देते हैं: पृथ्वी का विशाल चुंबकत्व हर डेक, रेगिस्तान और कक्षा तक एक-सा पहुँचता है, हर आज़ाद सुई को उत्तर-दक्षिण घुमाता। तारा बादल के पीछे छिप सकता है; पैरों तले का ग्रह नहीं। (जहाज़ का अपना लोहा सुई को छेड़ सकता है — इसीलिए कुतुबनुमा ढाँचे के असर से दूर, सँभालकर बिठाया जाता है।)",
          mr: "सुई चुंबक आहे, आणि चुंबक चुंबकांना उत्तर देतात: पृथ्वीचे अफाट चुंबकत्व प्रत्येक डेक, वाळवंट आणि वर्गापर्यंत सारखेच पोहोचते, प्रत्येक मोकळ्या सुईला उत्तर-दक्षिण वळवते. तारा ढगाआड लपू शकतो; पायाखालचा ग्रह नाही. (जहाजाचे स्वतःचे लोखंड सुईला छेडू शकते — म्हणूनच होकायंत्र सांगाड्याच्या प्रभावापासून दूर, जपून बसवले जाते.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 9 — The Living Organisms and Their Surroundings                 */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-6-living-organisms",
    subject: "SCIENCE",
    classLevel: 6,
    chapter: {
      en: "Chapter 9 — The Living Organisms and Their Surroundings",
      hi: "अध्याय 9 — सजीव तथा उनका परिवेश",
      mr: "प्रकरण 9 — सजीव आणि त्यांचा परिसर",
    },
    name: {
      en: "The Living Organisms and Their Surroundings",
      hi: "सजीव तथा उनका परिवेश",
      mr: "सजीव आणि त्यांचा परिसर",
    },
    summary: {
      en: "Habitats and the fittings for them — the camel's desert kit, the cactus's spines, the frog's two worlds — and the checklist that says what counts as alive.",
      hi: "आवास और उनके लिए साज-सज्जा — ऊँट का रेगिस्तानी साज़, नागफनी के काँटे, मेंढक की दो दुनियाएँ — और वह सूची जो बताती है कि जीवित किसे कहें।",
      mr: "अधिवास आणि त्यांच्यासाठीची जुळणी — उंटाचा वाळवंटी साज, निवडुंगाचे काटे, बेडकाची दोन जगे — आणि जिवंत कशाला म्हणायचे हे सांगणारी यादी.",
    },
    position: 9,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "habitat",
        name: { en: "The habitat", hi: "आवास", mr: "अधिवास" },
        kind: "idea",
        prompt: {
          en: "Pond for the frog, desert for the camel, mango tree for the squirrel — what do we call the home ground that gives a creature its food, shelter and company?",
          hi: "मेंढक को तालाब, ऊँट को रेगिस्तान, गिलहरी को आम का पेड़ — उस घर-ज़मीन को क्या कहते हैं जो जीव को भोजन, शरण और संगत देती है?",
          mr: "बेडकाला तळे, उंटाला वाळवंट, खारीला आंब्याचे झाड — जिवाला अन्न, निवारा आणि सोबत देणाऱ्या घर-भूमीला काय म्हणतात?",
        },
        statement: {
          en: "A habitat is the place a creature naturally lives in — it supplies the food, shelter, climate and company that particular life needs.",
          hi: "आवास वह जगह है जहाँ जीव स्वभावतः रहता है — वह उस ख़ास जीवन की ज़रूरत का भोजन, शरण, जलवायु और संगत जुटाती है।",
          mr: "अधिवास म्हणजे जीव स्वभावतः राहतो ती जागा — ती त्या विशिष्ट जीवनाला लागणारे अन्न, निवारा, हवामान आणि सोबत पुरवते.",
        },
        pair: {
          left: { en: "The habitat", hi: "आवास", mr: "अधिवास" },
          right: {
            en: "home ground with full board",
            hi: "पूरे इंतज़ाम वाली घर-ज़मीन",
            mr: "पूर्ण सोयीची घर-भूमी",
          },
        },
      },
      {
        id: "cameladapt",
        name: { en: "The camel's desert kit", hi: "ऊँट का रेगिस्तानी साज़", mr: "उंटाचा वाळवंटी साज" },
        kind: "adaptation",
        prompt: {
          en: "A fat-storing hump, long double lashes against sandstorms, dung dry as paper — whose body is a complete toolkit for the driest habitat?",
          hi: "चर्बी जमा करता कूबड़, रेतीली आँधियों के विरुद्ध लंबी दोहरी पलकें, काग़ज़-सा सूखा गोबर — किसका शरीर सबसे सूखे आवास का पूरा औज़ार-थैला है?",
          mr: "चरबी साठवणारे वशिंड, वाळूच्या वादळांविरुद्ध लांब दुहेरी पापण्या, कागदासारखे कोरडे शेण — कोणाचे शरीर सर्वांत कोरड्या अधिवासाची पूर्ण हत्यारपेटी आहे?",
        },
        statement: {
          en: "The camel is fitted head to toe for the desert — a hump of stored fat, lashes that shut out sand, and a body so thrifty with water that even its droppings come out dry.",
          hi: "ऊँट सिर से पाँव तक रेगिस्तान के लिए सजा है — जमा चर्बी का कूबड़, रेत रोकती पलकें, और पानी का ऐसा कंजूस शरीर कि उसका गोबर भी सूखा निकलता है।",
          mr: "उंट डोक्यापासून पायापर्यंत वाळवंटासाठी सजलेला — साठवलेल्या चरबीचे वशिंड, वाळू अडवणाऱ्या पापण्या, आणि पाण्याबाबत इतके काटकसरी शरीर की त्याचे शेणही कोरडे पडते.",
        },
        detail: {
          en: "The hump holds fat, not water — burning that fat is what lets it march for days unfed.",
          hi: "कूबड़ में चर्बी है, पानी नहीं — वही चर्बी जलाकर वह बिना खाए दिनों चलता है।",
          mr: "वशिंडात चरबी आहे, पाणी नाही — तीच चरबी जाळून तो न खाता दिवसन्दिवस चालतो.",
        },
        extra: {
          en: "It sweats hardly at all — a body that refuses to waste what the desert will not replace.",
          hi: "उसे पसीना न के बराबर आता है — ऐसा शरीर जो वह बर्बाद नहीं करता जो रेगिस्तान नहीं लौटाएगा।",
          mr: "त्याला घाम जवळजवळ येतच नाही — वाळवंट परत देणार नाही ते वाया न घालवणारे शरीर.",
        },
        pair: {
          left: { en: "The desert camel", hi: "रेगिस्तानी ऊँट", mr: "वाळवंटी उंट" },
          right: {
            en: "built for the waterless",
            hi: "बे-पानी के लिए गढ़ा",
            mr: "निर्जळासाठी घडलेला",
          },
        },
      },
      {
        id: "cactus",
        name: { en: "The cactus", hi: "नागफनी", mr: "निवडुंग" },
        kind: "adaptation",
        prompt: {
          en: "Which desert plant turned its leaves into SPINES and handed the cooking of food to its thick green stem?",
          hi: "किस रेगिस्तानी पौधे ने अपनी पत्तियाँ काँटों में बदल दीं और खाना पकाने का काम अपने मोटे हरे तने को सौंप दिया?",
          mr: "कोणत्या वाळवंटी वनस्पतीने आपली पाने काट्यांत बदलली आणि अन्न शिजवण्याचे काम आपल्या जाड हिरव्या खोडाकडे सोपवले?",
        },
        statement: {
          en: "The cactus wears spines where leaves would be — the green stem does the food-making and stores water in its thick flesh.",
          hi: "नागफनी पत्तियों की जगह काँटे पहनती है — हरा तना भोजन बनाता है और अपने मोटे गूदे में पानी जमा रखता है।",
          mr: "निवडुंग पानांच्या जागी काटे लेवून असतो — हिरवे खोड अन्न बनवते आणि आपल्या जाड गरात पाणी साठवते.",
        },
        detail: {
          en: "Broad leaves would breathe away precious water all day — spines lose almost none.",
          hi: "चौड़ी पत्तियाँ दिन भर अनमोल पानी उड़ाती रहतीं — काँटे लगभग कुछ नहीं खोते।",
          mr: "रुंद पाने दिवसभर मोलाचे पाणी उडवत राहिली असती — काटे जवळजवळ काहीच गमावत नाहीत.",
        },
        extra: {
          en: "The same spines guard its stored water from thirsty desert mouths.",
          hi: "वही काँटे उसके जमा पानी को प्यासे रेगिस्तानी मुँहों से बचाते भी हैं।",
          mr: "तेच काटे त्याचे साठवलेले पाणी तहानलेल्या वाळवंटी तोंडांपासून राखतातही.",
        },
        pair: {
          left: { en: "The cactus", hi: "नागफनी", mr: "निवडुंग" },
          right: {
            en: "leaves traded for spines",
            hi: "काँटों से बदली पत्तियाँ",
            mr: "काट्यांशी बदललेली पाने",
          },
        },
      },
      {
        id: "mountaingoat",
        name: { en: "The mountain goat", hi: "पहाड़ी बकरी", mr: "डोंगरी शेळी" },
        kind: "adaptation",
        prompt: {
          en: "On cliff faces where a slip is the end, which animal walks sure-footed on strong hooves made for steep rock?",
          hi: "जिन चट्टानी दीवारों पर एक फिसलन ही अंत है, वहाँ कौन-सा पशु खड़ी चट्टान के लिए बने मज़बूत खुरों पर बेधड़क चलता है?",
          mr: "जिथे एक घसरण म्हणजे शेवट अशा कड्यांवर, कोणता प्राणी उभ्या खडकासाठी घडलेल्या बळकट खुरांवर बेधडक चालतो?",
        },
        statement: {
          en: "The mountain goat climbs steep rock on strong gripping hooves — its body low and sure where flat-country feet would slide.",
          hi: "पहाड़ी बकरी मज़बूत जकड़ने वाले खुरों पर खड़ी चट्टान चढ़ती है — जहाँ मैदानी पैर फिसल जाते, वहाँ उसका शरीर झुका और सधा रहता है।",
          mr: "डोंगरी शेळी बळकट पकड घेणाऱ्या खुरांवर उभा खडक चढते — जिथे सपाटीचे पाय घसरले असते तिथे तिचे शरीर सखल आणि सधलेले राहते.",
        },
      },
      {
        id: "frogadapt",
        name: { en: "The frog's two worlds", hi: "मेंढक की दो दुनियाएँ", mr: "बेडकाची दोन जगे" },
        kind: "adaptation",
        prompt: {
          en: "Webbed feet for rowing, strong back legs for leaping the bank — which creature is equipped for pond AND shore alike?",
          hi: "खेने को झिल्लीदार पैर, किनारा फाँदने को ताक़तवर पिछली टाँगें — कौन-सा जीव तालाब और किनारे दोनों के लिए लैस है?",
          mr: "वल्हवायला पडदायुक्त पाय, काठ ओलांडायला ताकदवान मागचे पाय — कोणता जीव तळे आणि काठ दोन्हींसाठी सज्ज आहे?",
        },
        statement: {
          en: "The frog is fitted for two habitats at once — webbed feet row it through water, strong back legs spring it across land.",
          hi: "मेंढक एक साथ दो आवासों के लिए सजा है — झिल्लीदार पैर उसे पानी में खेते हैं, ताक़तवर पिछली टाँगें ज़मीन पर उछालती हैं।",
          mr: "बेडूक एकाच वेळी दोन अधिवासांसाठी सजलेला — पडदायुक्त पाय त्याला पाण्यात वल्हवतात, ताकदवान मागचे पाय जमिनीवर उडवतात.",
        },
        pair: {
          left: { en: "The two-world frog", hi: "दो दुनियाओं का मेंढक", mr: "दोन जगांचा बेडूक" },
          right: {
            en: "rower and leaper both",
            hi: "खेवैया भी, फँदैया भी",
            mr: "वल्हवणाराही, उडी मारणाराही",
          },
        },
      },
      {
        id: "stimulus",
        name: {
          en: "The touch-me-not's reply",
          hi: "छुई-मुई का जवाब",
          mr: "लाजाळूचे उत्तर",
        },
        kind: "living-sign",
        prompt: {
          en: "Brush a fingertip against which plant, and its leaflets fold shut in seconds — a living thing answering the world?",
          hi: "किस पौधे को उँगली भर छुइए कि उसकी पत्तियाँ पलों में सिमट जाती हैं — दुनिया का उत्तर देता एक सजीव?",
          mr: "कोणत्या वनस्पतीला बोट लावताच तिची पाने क्षणांत मिटतात — जगाला उत्तर देणारा एक सजीव?",
        },
        statement: {
          en: "The touch-me-not (mimosa) folds its leaflets at a touch — responding to the world is a mark of the living, and this plant shows it fast enough to watch.",
          hi: "छुई-मुई छूते ही पत्तियाँ मोड़ लेती है — दुनिया का उत्तर देना सजीवों की निशानी है, और यह पौधा उसे देखते-देखते दिखा देता है।",
          mr: "लाजाळू स्पर्श होताच पाने मिटवते — जगाला प्रतिसाद देणे ही सजीवांची खूण, आणि ही वनस्पती ते पाहता पाहता दाखवते.",
        },
        pair: {
          left: { en: "The touch-me-not", hi: "छुई-मुई", mr: "लाजाळू" },
          right: {
            en: "an answer you can watch",
            hi: "देखते बनता जवाब",
            mr: "पाहता येणारे उत्तर",
          },
        },
      },
      {
        id: "livingchecklist",
        name: {
          en: "The living checklist",
          hi: "सजीवता की सूची",
          mr: "सजीवतेची यादी",
        },
        kind: "living-sign",
        prompt: {
          en: "Grow, breathe, feed, respond, reproduce, excrete — what do we call this set of marks that every living thing shows and no stone ever will?",
          hi: "बढ़ना, साँस लेना, खाना, उत्तर देना, संतति बनाना, उत्सर्जन — निशानियों के इस समूह को क्या कहें, जो हर सजीव दिखाता है और कोई पत्थर कभी नहीं?",
          mr: "वाढणे, श्वसणे, खाणे, प्रतिसाद देणे, प्रजनन, उत्सर्जन — खुणांच्या या संचाला काय म्हणावे, जो प्रत्येक सजीव दाखवतो आणि कोणताही दगड कधीच नाही?",
        },
        statement: {
          en: "The living checklist — growth, breathing, feeding, response, reproduction, excretion — is the full set of tests; life must pass them all, not just one.",
          hi: "सजीवता की सूची — वृद्धि, श्वसन, आहार, अनुक्रिया, प्रजनन, उत्सर्जन — जाँचों का पूरा समूह है; जीवन को सब पास करनी हैं, केवल एक नहीं।",
          mr: "सजीवतेची यादी — वाढ, श्वसन, आहार, प्रतिसाद, प्रजनन, उत्सर्जन — चाचण्यांचा पूर्ण संच आहे; जीवनाला साऱ्या उत्तीर्ण व्हाव्या लागतात, फक्त एक नव्हे.",
        },
        detail: {
          en: "A cloud grows and a river moves — single marks fool; the whole list does not.",
          hi: "बादल बढ़ता है और नदी चलती है — अकेली निशानियाँ छलती हैं; पूरी सूची नहीं।",
          mr: "ढग वाढतो आणि नदी चालते — एकट्या खुणा फसवतात; सारी यादी नाही.",
        },
        extra: {
          en: "Seeds and eggs seem still — until conditions come right and the checklist wakes.",
          hi: "बीज और अंडे ठहरे लगते हैं — जब तक हालात न सधें और सूची जाग न उठे।",
          mr: "बिया आणि अंडी स्तब्ध वाटतात — परिस्थिती जुळेपर्यंत, मग यादी जागी होते.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the fitting to its habitat: A-hump of stored fat, B-leaves turned to spines, C-webbed feet. Which trio is right?",
          hi: "साज को उसके आवास से मिलाइए: अ-जमा चर्बी का कूबड़, ब-काँटे बनीं पत्तियाँ, स-झिल्लीदार पैर। कौन-सी तिकड़ी सही है?",
          mr: "साज त्याच्या अधिवासाशी जुळवा: अ-साठवलेल्या चरबीचे वशिंड, ब-काटे झालेली पाने, क-पडदायुक्त पाय. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: the desert camel · B: the desert cactus · C: the pond frog",
            hi: "अ: रेगिस्तानी ऊँट · ब: रेगिस्तानी नागफनी · स: तालाब का मेंढक",
            mr: "अ: वाळवंटी उंट · ब: वाळवंटी निवडुंग · क: तळ्यातला बेडूक",
          },
          {
            en: "A: the pond frog · B: the desert camel · C: the desert cactus",
            hi: "अ: तालाब का मेंढक · ब: रेगिस्तानी ऊँट · स: नागफनी",
            mr: "अ: तळ्यातला बेडूक · ब: वाळवंटी उंट · क: निवडुंग",
          },
          {
            en: "A: the desert cactus · B: the pond frog · C: the desert camel",
            hi: "अ: नागफनी · ब: तालाब का मेंढक · स: रेगिस्तानी ऊँट",
            mr: "अ: निवडुंग · ब: तळ्यातला बेडूक · क: वाळवंटी उंट",
          },
          {
            en: "A: the desert camel · B: the pond frog · C: the desert cactus",
            hi: "अ: रेगिस्तानी ऊँट · ब: तालाब का मेंढक · स: नागफनी",
            mr: "अ: वाळवंटी उंट · ब: तळ्यातला बेडूक · क: निवडुंग",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Fat-store for foodless marches — the camel; spines that spend no water — the cactus; webbing that rows — the frog. Each fitting answers its habitat's hardest question, and reading fittings backwards tells you the habitat: that is the chapter's game.",
          hi: "बिना भोजन की यात्राओं के लिए चर्बी-भंडार — ऊँट; पानी न ख़र्चते काँटे — नागफनी; खेती झिल्ली — मेंढक। हर साज अपने आवास के सबसे कठिन सवाल का उत्तर है, और साज को उलटा पढ़ने से आवास पता चलता है: यही अध्याय का खेल है।",
          mr: "अन्नाविना वाटचालींसाठी चरबी-साठा — उंट; पाणी न खर्चणारे काटे — निवडुंग; वल्हवणारा पडदा — बेडूक. प्रत्येक साज त्याच्या अधिवासाच्या सर्वांत कठीण प्रश्नाचे उत्तर, आणि साज उलटा वाचला की अधिवास कळतो: हाच प्रकरणाचा खेळ.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A motor car moves, drinks fuel, breathes out exhaust and grows warm with work. By the chapter's checklist, why is it still NOT alive?",
          hi: "मोटर-कार चलती है, ईंधन पीती है, धुआँ छोड़ती है और काम से गर्म होती है। अध्याय की सूची से, वह फिर भी सजीव क्यों नहीं?",
          mr: "मोटार चालते, इंधन पिते, धूर सोडते आणि कामाने तापते. प्रकरणाच्या यादीने, ती तरीही सजीव का नाही?",
        },
        choices: [
          {
            en: "It fails the rest of the list — it never grows, never reproduces, never responds on its own; life must pass the WHOLE checklist, not a few lines",
            hi: "वह बाक़ी सूची में फ़ेल है — न बढ़ती है, न संतति बनाती है, न अपने आप उत्तर देती है; जीवन को पूरी सूची पास करनी है, चंद पंक्तियाँ नहीं",
            mr: "ती उरलेल्या यादीत नापास — ती वाढत नाही, प्रजनन करत नाही, स्वतःहून प्रतिसाद देत नाही; जीवनाला सारी यादी उत्तीर्ण व्हावी लागते, काही ओळी नव्हे",
          },
          {
            en: "Because it is made of metal, and metal cannot be alive",
            hi: "क्योंकि वह धातु की है, और धातु सजीव नहीं हो सकती",
            mr: "कारण ती धातूची आहे, आणि धातू सजीव असू शकत नाही",
          },
          {
            en: "Because someone must sit inside it",
            hi: "क्योंकि उसके भीतर किसी को बैठना पड़ता है",
            mr: "कारण तिच्या आत कोणाला तरी बसावे लागते",
          },
          {
            en: "Because it is too large to be a creature",
            hi: "क्योंकि वह जीव होने के लिए बहुत बड़ी है",
            mr: "कारण ती जीव असण्यास फार मोठी आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The car's tricks mimic single lines of the list — moving, 'feeding', 'exhaling'. But park it for twenty years: it will not have grown a centimetre, raised a single little car, or flinched from anything. The checklist works only taken whole; that is exactly why it exists, because single marks are so easily counterfeited.",
          hi: "कार की कलाएँ सूची की अकेली पंक्तियों की नक़ल हैं — चलना, 'खाना', 'साँस छोड़ना'। पर उसे बीस साल खड़ी रखिए: न वह सेंटीमीटर भर बढ़ेगी, न एक भी नन्ही कार जनेगी, न किसी चीज़ से चौंकेगी। सूची पूरी लेकर ही काम करती है; वह इसीलिए है, क्योंकि अकेली निशानियाँ आसानी से जाली बनती हैं।",
          mr: "मोटारीच्या कला यादीच्या एकट्या ओळींची नक्कल — चालणे, 'खाणे', 'उच्छ्वास'. पण ती वीस वर्षे उभी ठेवा: ती सेंटिमीटरभर वाढणार नाही, एकही इवली मोटार जन्माला घालणार नाही, कशानेही दचकणार नाही. यादी अख्खी घेतली तरच चालते; ती त्यासाठीच आहे, कारण एकट्या खुणा सहज बनावट होतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Give a cactus the gift of broad green leaves, like a mango's. In its desert home, why would the 'gift' kill it?",
          hi: "नागफनी को आम जैसी चौड़ी हरी पत्तियों का उपहार दीजिए। उसके रेगिस्तानी घर में यह 'उपहार' उसे क्यों मार डालेगा?",
          mr: "निवडुंगाला आंब्यासारख्या रुंद हिरव्या पानांची भेट द्या. त्याच्या वाळवंटी घरात ही 'भेट' त्याला का मारेल?",
        },
        choices: [
          {
            en: "Broad leaves transpire water all day — in a land that gives almost none back, the plant would breathe itself dry within days",
            hi: "चौड़ी पत्तियाँ दिन भर पानी उड़ाती हैं — जो धरती लगभग कुछ नहीं लौटाती, वहाँ पौधा दिनों में ख़ुद को सुखा बैठेगा",
            mr: "रुंद पाने दिवसभर पाणी उडवतात — जवळजवळ काही परत न देणाऱ्या भूमीत वनस्पती काही दिवसांत स्वतःला कोरडी करेल",
          },
          {
            en: "Leaves are too heavy for a desert plant to carry",
            hi: "पत्तियाँ रेगिस्तानी पौधे के उठाने को बहुत भारी हैं",
            mr: "पाने वाळवंटी वनस्पतीला पेलण्यास फार जड आहेत",
          },
          {
            en: "Green attracts desert animals from afar",
            hi: "हरापन दूर से रेगिस्तानी जानवर बुला लेता है",
            mr: "हिरवेपणा दुरून वाळवंटी प्राणी बोलावतो",
          },
          {
            en: "Nothing — more leaves always mean more food",
            hi: "कुछ नहीं — ज़्यादा पत्तियाँ यानी हमेशा ज़्यादा भोजन",
            mr: "काहीच नाही — जास्त पाने म्हणजे नेहमी जास्त अन्न",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Remember the bagged branch: leaves breathe out water all day long. A mango by a monsoon field can afford that rent; a cactus on dunes cannot. Its spines ARE leaves with the water-cost cut to nothing, the cooking moved to the stem. An adaptation is never 'better' in the abstract — it is a bargain struck with one particular habitat, and a gift priced for the wrong land is poison.",
          hi: "बँधी थैली वाली डाल याद कीजिए: पत्तियाँ दिन भर पानी छोड़ती हैं। मानसूनी खेत के पास आम वह किराया चुका सकता है; टीलों पर नागफनी नहीं। उसके काँटे वही पत्तियाँ हैं जिनका पानी-ख़र्च शून्य कर दिया गया और रसोई तने को सौंप दी गई। अनुकूलन कभी यों ही 'बेहतर' नहीं होता — वह एक ख़ास आवास से किया सौदा है, और ग़लत धरती के दाम पर आया उपहार ज़हर है।",
          mr: "बांधलेल्या पिशवीची फांदी आठवा: पाने दिवसभर पाणी सोडतात. पावसाळी शेताजवळचा आंबा ते भाडे भरू शकतो; टेकड्यांवरचा निवडुंग नाही. त्याचे काटे म्हणजे पाणी-खर्च शून्य केलेली आणि स्वयंपाक खोडाकडे सोपवलेली पानेच. अनुकूलन कधीच नुसते 'चांगले' नसते — तो एका विशिष्ट अधिवासाशी केलेला सौदा, आणि चुकीच्या भूमीच्या भावाने आलेली भेट म्हणजे विष.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 11 — Light, Shadows and Reflections                             */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-6-light-shadows-reflections",
    subject: "SCIENCE",
    classLevel: 6,
    chapter: {
      en: "Chapter 11 — Light, Shadows and Reflections",
      hi: "अध्याय 11 — प्रकाश, छायाएँ एवं परावर्तन",
      mr: "प्रकरण 11 — प्रकाश, सावल्या आणि परावर्तन",
    },
    name: {
      en: "Light, Shadows and Reflections",
      hi: "प्रकाश, छायाएँ एवं परावर्तन",
      mr: "प्रकाश, सावल्या आणि परावर्तन",
    },
    summary: {
      en: "What shines by itself and what merely passes light on — shadows that ignore colour, the pinhole's upside-down picture, and the mirror that keeps every detail.",
      hi: "क्या ख़ुद चमकता है और क्या केवल प्रकाश आगे बढ़ाता है — रंग को अनदेखा करती छायाएँ, सूची-छिद्र की उलटी तस्वीर, और हर ब्योरा सहेजता दर्पण।",
      mr: "काय स्वतः चमकते आणि काय नुसते प्रकाश पुढे देते — रंगाकडे दुर्लक्ष करणाऱ्या सावल्या, सूचिछिद्राचे उलटे चित्र, आणि प्रत्येक तपशील जपणारा आरसा.",
    },
    position: 11,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "luminous",
        name: { en: "Luminous objects", hi: "प्रदीप्त वस्तुएँ", mr: "स्वयंप्रकाशित वस्तू" },
        kind: "light-source",
        prompt: {
          en: "The Sun, a burning diya, a firefly's tail — what are objects called that give out light of their OWN?",
          hi: "सूरज, जलता दीया, जुगनू की पूँछ — अपनी ख़ुद की रोशनी देने वाली वस्तुएँ क्या कहलाती हैं?",
          mr: "सूर्य, जळणारी पणती, काजव्याचे शेपूट — स्वतःचा प्रकाश देणाऱ्या वस्तूंना काय म्हणतात?",
        },
        statement: {
          en: "Luminous objects make their own light — sun, flames and fireflies shine; the moon and a book merely pass on light that falls on them.",
          hi: "प्रदीप्त वस्तुएँ अपनी रोशनी बनाती हैं — सूरज, लपटें और जुगनू चमकते हैं; चाँद और किताब बस उन पर पड़ी रोशनी लौटाते हैं।",
          mr: "स्वयंप्रकाशित वस्तू आपला प्रकाश बनवतात — सूर्य, ज्वाळा आणि काजवे चमकतात; चंद्र आणि पुस्तक फक्त त्यांच्यावर पडलेला प्रकाश परत देतात.",
        },
        pair: {
          left: { en: "Luminous objects", hi: "प्रदीप्त वस्तुएँ", mr: "स्वयंप्रकाशित वस्तू" },
          right: { en: "light of their own", hi: "अपनी रोशनी", mr: "स्वतःचा प्रकाश" },
        },
      },
      {
        id: "opaque",
        name: { en: "Opaque objects", hi: "अपारदर्शी वस्तुएँ", mr: "अपारदर्शक वस्तू" },
        kind: "light-material",
        prompt: {
          en: "A wall, a wooden door, your own body — which kind of object stops light COMPLETELY, so nothing shows through?",
          hi: "दीवार, लकड़ी का दरवाज़ा, आपका अपना शरीर — किस क़िस्म की वस्तु प्रकाश को पूरा रोक देती है, कि आर-पार कुछ नहीं दिखता?",
          mr: "भिंत, लाकडी दार, तुमचे स्वतःचे शरीर — कोणत्या प्रकारची वस्तू प्रकाश पूर्ण अडवते, की आरपार काही दिसत नाही?",
        },
        statement: {
          en: "Opaque objects block light entirely — nothing can be seen through them, and only they can cast full, dark shadows.",
          hi: "अपारदर्शी वस्तुएँ प्रकाश को पूरा रोकती हैं — उनके आर-पार कुछ नहीं दिखता, और पूरी गहरी छाया वही डाल सकती हैं।",
          mr: "अपारदर्शक वस्तू प्रकाश पूर्ण अडवतात — त्यांच्या आरपार काही दिसत नाही, आणि पूर्ण गडद सावली त्याच टाकू शकतात.",
        },
        pair: {
          left: { en: "Opaque objects", hi: "अपारदर्शी वस्तुएँ", mr: "अपारदर्शक वस्तू" },
          right: { en: "light's full stop", hi: "प्रकाश का पूर्ण विराम", mr: "प्रकाशाचा पूर्णविराम" },
        },
      },
      {
        id: "transparent",
        name: { en: "Transparent objects", hi: "पारदर्शी वस्तुएँ", mr: "पारदर्शक वस्तू" },
        kind: "light-material",
        prompt: {
          en: "Clean window glass, clear water, air itself — which kind of object lets light through so fully that you see straight past it?",
          hi: "साफ़ खिड़की का शीशा, निर्मल पानी, ख़ुद हवा — किस क़िस्म की वस्तु प्रकाश को इतना पूरा गुज़रने देती है कि आप उसके पार सीधा देख लेते हैं?",
          mr: "स्वच्छ खिडकीची काच, नितळ पाणी, स्वतः हवा — कोणत्या प्रकारची वस्तू प्रकाशाला इतके पूर्ण जाऊ देते की तुम्ही तिच्या पलीकडे थेट पाहता?",
        },
        statement: {
          en: "Transparent objects pass light almost untouched — glass, clear water and air let the eye see straight through.",
          hi: "पारदर्शी वस्तुएँ प्रकाश को लगभग अछूता गुज़रने देती हैं — शीशा, साफ़ पानी और हवा आँख को सीधा पार देखने देते हैं।",
          mr: "पारदर्शक वस्तू प्रकाशाला जवळजवळ जसाच्या तसा जाऊ देतात — काच, नितळ पाणी आणि हवा डोळ्याला थेट पार पाहू देतात.",
        },
      },
      {
        id: "translucent",
        name: { en: "Translucent objects", hi: "पारभासी वस्तुएँ", mr: "अर्धपारदर्शक वस्तू" },
        kind: "light-material",
        prompt: {
          en: "Butter paper, frosted bathroom glass, a thin curtain — which kind lets SOME light through, but blurs whatever is behind?",
          hi: "मक्खनी काग़ज़, ग़ुसलख़ाने का धुँधला शीशा, पतला परदा — कौन-सी क़िस्म कुछ प्रकाश गुज़रने देती है, पर पीछे का सब धुँधला कर देती है?",
          mr: "बटर पेपर, न्हाणीघराची धुरकट काच, पातळ पडदा — कोणता प्रकार काही प्रकाश जाऊ देतो, पण मागचे सारे धूसर करतो?",
        },
        statement: {
          en: "Translucent objects pass light only partly — shapes behind them show as blurs, half-told.",
          hi: "पारभासी वस्तुएँ प्रकाश को अधूरा गुज़रने देती हैं — पीछे की आकृतियाँ धुँधली, आधी-कही दिखती हैं।",
          mr: "अर्धपारदर्शक वस्तू प्रकाश अर्धवट जाऊ देतात — मागचे आकार धूसर, अर्धवट सांगितलेले दिसतात.",
        },
        pair: {
          left: { en: "Translucent objects", hi: "पारभासी वस्तुएँ", mr: "अर्धपारदर्शक वस्तू" },
          right: {
            en: "light through, shapes blurred",
            hi: "रोशनी पार, आकृतियाँ धुँधली",
            mr: "प्रकाश पार, आकार धूसर",
          },
        },
      },
      {
        id: "shadow",
        name: { en: "The shadow", hi: "छाया", mr: "सावली" },
        kind: "light-effect",
        prompt: {
          en: "Light on one side, a screen on the other, an opaque object between — what dark shape appears on the screen?",
          hi: "एक ओर प्रकाश, दूसरी ओर परदा, बीच में अपारदर्शी वस्तु — परदे पर कौन-सी अँधेरी आकृति उभरती है?",
          mr: "एका बाजूला प्रकाश, दुसरीकडे पडदा, मध्ये अपारदर्शक वस्तू — पडद्यावर कोणता काळोखा आकार उमटतो?",
        },
        statement: {
          en: "A shadow needs three things — a light, an opaque object and a screen behind it; it is the patch the object's block leaves dark.",
          hi: "छाया को तीन चीज़ें चाहिए — प्रकाश, अपारदर्शी वस्तु और उसके पीछे परदा; वह वही टुकड़ा है जिसे वस्तु की रोक अँधेरा छोड़ देती है।",
          mr: "सावलीला तीन गोष्टी लागतात — प्रकाश, अपारदर्शक वस्तू आणि तिच्यामागे पडदा; वस्तूच्या अडवण्याने काळोखा राहिलेला तोच पट्टा.",
        },
        detail: {
          en: "It is always dark, whatever the object's colour — a red ball and a blue ball cast twin black shadows.",
          hi: "वह हमेशा अँधेरी है, वस्तु का रंग जो भी हो — लाल गेंद और नीली गेंद जुड़वाँ काली छायाएँ डालती हैं।",
          mr: "ती नेहमी काळोखी असते, वस्तूचा रंग कोणताही असो — लाल चेंडू आणि निळा चेंडू जुळ्या काळ्या सावल्या टाकतात.",
        },
        extra: {
          en: "It shows only the outline — a shape's edge, with everything inside painted the same dark.",
          hi: "वह केवल रूपरेखा दिखाती है — आकृति का किनारा, भीतर सब एक ही अँधेरे से पुता।",
          mr: "ती फक्त बाह्यरेषा दाखवते — आकाराची कड, आतले सारे एकाच काळोखाने रंगवलेले.",
        },
        pair: {
          left: { en: "The shadow", hi: "छाया", mr: "सावली" },
          right: {
            en: "the blocked light's dark patch",
            hi: "रुकी रोशनी का अँधेरा टुकड़ा",
            mr: "अडलेल्या प्रकाशाचा काळोखा पट्टा",
          },
        },
      },
      {
        id: "pinhole",
        name: { en: "The pinhole camera", hi: "सूचीछिद्र कैमरा", mr: "सूचिछिद्र कॅमेरा" },
        kind: "light-effect",
        prompt: {
          en: "A box, a pin-prick of a hole, a tracing-paper back — and the tree outside appears on the paper UPSIDE DOWN. What is this simple device?",
          hi: "एक डिब्बा, पिन भर का छेद, पीछे ट्रेसिंग-काग़ज़ — और बाहर का पेड़ काग़ज़ पर उलटा उभर आता है। यह सादा उपकरण क्या है?",
          mr: "एक खोके, टाचणीएवढे छिद्र, मागे ट्रेसिंग-कागद — आणि बाहेरचे झाड कागदावर उलटे उमटते. हे साधे उपकरण काय?",
        },
        statement: {
          en: "The pinhole camera throws an upside-down picture of the bright world through one tiny hole — no lens, no wires, just light going straight.",
          hi: "सूचीछिद्र कैमरा एक नन्हे छेद से उजली दुनिया की उलटी तस्वीर डालता है — न लेंस, न तार, बस सीधी चलती रोशनी।",
          mr: "सूचिछिद्र कॅमेरा एका इवल्या छिद्रातून उजळ जगाचे उलटे चित्र टाकतो — भिंग नाही, तारा नाहीत, फक्त सरळ जाणारा प्रकाश.",
        },
        pair: {
          left: { en: "The pinhole camera", hi: "सूचीछिद्र कैमरा", mr: "सूचिछिद्र कॅमेरा" },
          right: {
            en: "the world, upside down",
            hi: "दुनिया, उलटी",
            mr: "जग, उलटे",
          },
        },
      },
      {
        id: "mirror",
        name: { en: "The mirror's reflection", hi: "दर्पण का परावर्तन", mr: "आरशाचे परावर्तन" },
        kind: "light-effect",
        prompt: {
          en: "Unlike the all-black shadow, what does a mirror give back — your face with its colours, details and all?",
          hi: "सर्व-काली छाया के उलट, दर्पण क्या लौटाता है — आपका चेहरा, रंगों और ब्योरों समेत?",
          mr: "सर्व-काळ्या सावलीच्या उलट, आरसा काय परत देतो — तुमचा चेहरा, रंग आणि तपशिलांसह?",
        },
        statement: {
          en: "A mirror reflects light back in order — the image keeps colours, details and expressions that a shadow throws away.",
          hi: "दर्पण प्रकाश को तरतीब से लौटाता है — प्रतिबिंब में रंग, ब्योरे और भाव बचे रहते हैं, जिन्हें छाया फेंक देती है।",
          mr: "आरसा प्रकाश शिस्तीत परत देतो — प्रतिबिंबात रंग, तपशील आणि भाव टिकतात, जे सावली फेकून देते.",
        },
        pair: {
          left: { en: "The mirror", hi: "दर्पण", mr: "आरसा" },
          right: {
            en: "light returned in order",
            hi: "तरतीब से लौटी रोशनी",
            mr: "शिस्तीत परतलेला प्रकाश",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort these into TRANSPARENT, TRANSLUCENT and OPAQUE: clean glass, butter paper, a brick. Which trio is right?",
          hi: "इन्हें पारदर्शी, पारभासी और अपारदर्शी में छाँटिए: साफ़ शीशा, मक्खनी काग़ज़, ईंट। कौन-सी तिकड़ी सही है?",
          mr: "यांची पारदर्शक, अर्धपारदर्शक आणि अपारदर्शक अशी वर्गवारी करा: स्वच्छ काच, बटर पेपर, वीट. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "glass: transparent · butter paper: translucent · brick: opaque",
            hi: "शीशा: पारदर्शी · मक्खनी काग़ज़: पारभासी · ईंट: अपारदर्शी",
            mr: "काच: पारदर्शक · बटर पेपर: अर्धपारदर्शक · वीट: अपारदर्शक",
          },
          {
            en: "glass: translucent · butter paper: opaque · brick: transparent",
            hi: "शीशा: पारभासी · मक्खनी काग़ज़: अपारदर्शी · ईंट: पारदर्शी",
            mr: "काच: अर्धपारदर्शक · बटर पेपर: अपारदर्शक · वीट: पारदर्शक",
          },
          {
            en: "glass: opaque · butter paper: transparent · brick: translucent",
            hi: "शीशा: अपारदर्शी · मक्खनी काग़ज़: पारदर्शी · ईंट: पारभासी",
            mr: "काच: अपारदर्शक · बटर पेपर: पारदर्शक · वीट: अर्धपारदर्शक",
          },
          {
            en: "glass: transparent · butter paper: opaque · brick: translucent",
            hi: "शीशा: पारदर्शी · मक्खनी काग़ज़: अपारदर्शी · ईंट: पारभासी",
            mr: "काच: पारदर्शक · बटर पेपर: अपारदर्शक · वीट: अर्धपारदर्शक",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Hold each to a lamp: through glass you read the lamp's label — transparent; through butter paper you see only a glow — translucent; through brick, nothing at all — opaque. One lamp sorts the whole world into three drawers.",
          hi: "हर एक को दीये के आगे थामिए: शीशे से दीये का लेबल तक पढ़ लेते हैं — पारदर्शी; मक्खनी काग़ज़ से बस चमक दिखती है — पारभासी; ईंट से कुछ भी नहीं — अपारदर्शी। एक दीया पूरी दुनिया को तीन दराज़ों में छाँट देता है।",
          mr: "प्रत्येक दिव्यासमोर धरा: काचेतून दिव्याचे लेबलही वाचता येते — पारदर्शक; बटर पेपरातून फक्त उजेड दिसतो — अर्धपारदर्शक; विटेतून काहीच नाही — अपारदर्शक. एक दिवा सगळ्या जगाला तीन खणांत लावतो.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A bright red ball on a sunny day casts a shadow that is pure black — not a trace of red. What does that tell you about what a shadow IS?",
          hi: "धूप वाले दिन चटख़ लाल गेंद की छाया बिलकुल काली पड़ती है — लाल का नामो-निशान नहीं। यह छाया के होने के बारे में क्या बताता है?",
          mr: "उन्हाच्या दिवशी भडक लाल चेंडूची सावली निव्वळ काळी पडते — लालाचा मागमूसही नाही. हे सावली म्हणजे काय याबद्दल काय सांगते?",
        },
        choices: [
          {
            en: "A shadow is not light FROM the object but the ABSENCE of light behind it — and absence has no colour to show",
            hi: "छाया वस्तु से आई रोशनी नहीं, उसके पीछे रोशनी की ग़ैर-हाज़िरी है — और ग़ैर-हाज़िरी के पास दिखाने को कोई रंग नहीं",
            mr: "सावली म्हणजे वस्तूकडून आलेला प्रकाश नव्हे, तिच्यामागची प्रकाशाची अनुपस्थिती — आणि अनुपस्थितीकडे दाखवायला रंगच नाही",
          },
          {
            en: "The sun burns the red out of the shadow",
            hi: "सूरज छाया में से लाल जला देता है",
            mr: "सूर्य सावलीतला लाल जाळून टाकतो",
          },
          {
            en: "Shadows are red too, only too faint to see",
            hi: "छायाएँ लाल ही हैं, बस दिखने में बहुत फीकी",
            mr: "सावल्या लालच असतात, फक्त दिसायला फार फिकट",
          },
          {
            en: "Only white balls can cast coloured shadows",
            hi: "रंगीन छाया केवल सफ़ेद गेंदें डाल सकती हैं",
            mr: "रंगीत सावली फक्त पांढरे चेंडूच टाकू शकतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The ball looks red because it sends red light to your eye. But the shadow-patch is where the ball STOPPED the sun's light from arriving — the ground there receives nothing, and nothing looks black. The mirror keeps colours because it passes light on; the shadow is the one place light never reached. Presence carries colour, absence cannot.",
          hi: "गेंद लाल इसलिए दिखती है कि वह आँख तक लाल रोशनी भेजती है। पर छाया-टुकड़ा वह है जहाँ गेंद ने सूरज की रोशनी पहुँचने ही नहीं दी — वहाँ की ज़मीन को कुछ नहीं मिलता, और कुछ-नहीं काला दिखता है। दर्पण रंग इसलिए रखता है कि वह रोशनी आगे भेजता है; छाया वह अकेली जगह है जहाँ रोशनी पहुँची ही नहीं। मौजूदगी रंग ढोती है, ग़ैर-हाज़िरी नहीं ढो सकती।",
          mr: "चेंडू लाल दिसतो कारण तो डोळ्यापर्यंत लाल प्रकाश पाठवतो. पण सावली-पट्टा तो आहे जिथे चेंडूने सूर्याचा प्रकाश पोहोचूच दिला नाही — तिथल्या जमिनीला काही मिळत नाही, आणि काही-नाही काळे दिसते. आरसा रंग ठेवतो कारण तो प्रकाश पुढे देतो; सावली ही प्रकाश कधी न पोहोचलेली एकमेव जागा. हजेरी रंग वाहते, अनुपस्थिती वाहू शकत नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "In the pinhole camera the tree's top prints at the BOTTOM of the screen. What does the upside-down image prove about how light travels?",
          hi: "सूचीछिद्र कैमरे में पेड़ की चोटी परदे के नीचे छपती है। उलटी तस्वीर रोशनी के चलने के बारे में क्या साबित करती है?",
          mr: "सूचिछिद्र कॅमेऱ्यात झाडाचा शेंडा पडद्याच्या खाली उमटतो. उलटे चित्र प्रकाशाच्या जाण्याबद्दल काय सिद्ध करते?",
        },
        choices: [
          {
            en: "That light travels in straight lines — rays from the top must cross at the hole and land low, as straight lines through one point must",
            hi: "कि रोशनी सीधी रेखाओं में चलती है — चोटी की किरणें छेद पर काटकर नीचे ही उतरेंगी, जैसा एक बिंदु से गुज़रती सीधी रेखाओं को करना ही है",
            mr: "की प्रकाश सरळ रेषांत जातो — शेंड्याच्या किरणांना छिद्रावर छेदून खालीच उतरावे लागते, एका बिंदूतून जाणाऱ्या सरळ रेषांना जसे भागच आहे",
          },
          {
            en: "That the hole flips the light like a tiny mirror",
            hi: "कि छेद नन्हे दर्पण-सा रोशनी पलट देता है",
            mr: "की छिद्र इवल्या आरशासारखा प्रकाश उलटवते",
          },
          {
            en: "That light prefers to travel downward",
            hi: "कि रोशनी नीचे की ओर चलना पसंद करती है",
            mr: "की प्रकाशाला खाली जाणे आवडते",
          },
          {
            en: "That the tracing paper turns pictures over",
            hi: "कि ट्रेसिंग-काग़ज़ तस्वीरें पलट देता है",
            mr: "की ट्रेसिंग-कागद चित्रे उलटवतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Draw it: a ray from the treetop, passing straight through the pinhole, can only continue DOWN to the screen's bottom; a ray from the roots crosses up. If light could bend round corners the image would smear or right itself — the crisp upside-down picture is straight-line travel caught in the act. One shoebox proves a law.",
          hi: "खींचकर देखिए: चोटी से चली किरण छेद से सीधी गुज़रकर परदे के नीचे ही जा सकती है; जड़ों की किरण ऊपर काटती है। रोशनी मोड़ मुड़ सकती तो तस्वीर धुँधली होती या सीधी हो जाती — साफ़ उलटी तस्वीर रँगे-हाथ पकड़ी गई सीधी चाल है। एक जूते का डिब्बा एक नियम साबित कर देता है।",
          mr: "काढून पाहा: शेंड्याहून निघालेला किरण छिद्रातून सरळ जाऊन पडद्याच्या खालीच जाऊ शकतो; मुळांचा किरण वर छेदतो. प्रकाश वळणे घेऊ शकला असता तर चित्र धूसर झाले असते वा सरळ झाले असते — स्पष्ट उलटे चित्र म्हणजे रंगेहाथ पकडलेली सरळ चाल. एक बुटांचे खोके एक नियम सिद्ध करते.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 15 — Air Around Us (the invisible substance with weight & work) */
  /* ----------------------------------------------------------------------- */
  {
    slug: "science-6-air-around-us",
    subject: "SCIENCE",
    classLevel: 6,
    chapter: {
      en: "Chapter 15 — Air Around Us",
      hi: "अध्याय 15 — हमारे चारों ओर वायु",
      mr: "प्रकरण 15 — आपल्याभोवतीची हवा",
    },
    name: { en: "Air Around Us", hi: "हमारे चारों ओर वायु", mr: "आपल्याभोवतीची हवा" },
    summary: {
      en: "The invisible stuff that fills 'empty' glasses, feeds every flame its fifth, dissolves for the fishes and turns windmills when it runs.",
      hi: "वह अदृश्य चीज़ जो 'ख़ाली' गिलास भरती है, हर लौ को उसका पाँचवाँ हिस्सा खिलाती है, मछलियों के लिए घुल जाती है और दौड़ने पर पवनचक्कियाँ घुमाती है।",
      mr: "'रिकामे' ग्लास भरणारी, प्रत्येक ज्योतीला तिचा पंचमांश खाऊ घालणारी, माशांसाठी विरघळणारी आणि धावली की पवनचक्क्या फिरवणारी अदृश्य वस्तू.",
    },
    position: 15,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "airspace",
        name: {
          en: "Air occupies space",
          hi: "वायु जगह घेरती है",
          mr: "हवा जागा व्यापते",
        },
        kind: "air-truth",
        prompt: {
          en: "Push an upside-down 'empty' glass straight down into water: the water cannot rise inside and a crumpled paper at its base stays DRY. What kept the water out?",
          hi: "उलटा 'ख़ाली' गिलास सीधा पानी में दबाइए: पानी भीतर नहीं चढ़ पाता और तली में दबा मुड़ा काग़ज़ सूखा रहता है। पानी को किसने रोका?",
          mr: "उलटे 'रिकामे' ग्लास सरळ पाण्यात दाबा: पाणी आत चढू शकत नाही आणि तळाशी दाबलेला चुरगळलेला कागद कोरडा राहतो. पाण्याला कोणी अडवले?",
        },
        statement: {
          en: "Air occupies space — the 'empty' glass is full of it, and the trapped air refuses to make room for the water.",
          hi: "वायु जगह घेरती है — 'ख़ाली' गिलास उसी से भरा है, और फँसी हवा पानी को जगह देने से इनकार कर देती है।",
          mr: "हवा जागा व्यापते — 'रिकामा' ग्लास तिनेच भरलेला असतो, आणि अडकलेली हवा पाण्याला जागा द्यायला नकार देते.",
        },
        detail: {
          en: "Tilt the glass and the proof bubbles out — the air leaves, gurgling, and water climbs in behind it.",
          hi: "गिलास तिरछा कीजिए और सबूत बुलबुलों में निकल आता है — हवा गुड़गुड़ाती निकलती है, और उसके पीछे-पीछे पानी चढ़ आता है।",
          mr: "ग्लास तिरपा करा आणि पुरावा बुडबुड्यांत बाहेर येतो — हवा गुडगुडत निघते, आणि तिच्या मागोमाग पाणी चढते.",
        },
        extra: {
          en: "'Empty' is the everyday word; the scientist's word is 'air-filled'.",
          hi: "'ख़ाली' रोज़मर्रा का शब्द है; वैज्ञानिक का शब्द है — 'हवा-भरा'।",
          mr: "'रिकामे' हा रोजचा शब्द; वैज्ञानिकाचा शब्द — 'हवेने भरलेले'.",
        },
        pair: {
          left: { en: "The upside-down glass", hi: "उलटा गिलास", mr: "उलटा ग्लास" },
          right: {
            en: "dry paper, air's proof",
            hi: "सूखा काग़ज़, हवा का सबूत",
            mr: "कोरडा कागद, हवेचा पुरावा",
          },
        },
      },
      {
        id: "oxygen",
        name: { en: "Oxygen", hi: "ऑक्सीजन", mr: "ऑक्सिजन" },
        kind: "air-part",
        prompt: {
          en: "About a FIFTH of the air is which gas — the one that burning flames and breathing bodies both use up?",
          hi: "हवा का क़रीब पाँचवाँ हिस्सा कौन-सी गैस है — वही जिसे जलती लपटें और साँस लेते शरीर दोनों ख़र्च करते हैं?",
          mr: "हवेचा सुमारे पंचमांश कोणता वायू आहे — जळणाऱ्या ज्वाळा आणि श्वसणारी शरीरे दोघेही खर्च करतात तो?",
        },
        statement: {
          en: "Oxygen is about one-fifth of the air — the part that burning and breathing both consume; without it, neither can go on.",
          hi: "ऑक्सीजन हवा का क़रीब पाँचवाँ हिस्सा है — वही जो जलने और साँस लेने दोनों में खपता है; उसके बिना दोनों नहीं चल सकते।",
          mr: "ऑक्सिजन हवेचा सुमारे पंचमांश — जळण्यात आणि श्वसण्यात दोन्हींत खपणारा भाग; त्याच्याविना दोन्ही चालू शकत नाहीत.",
        },
        pair: {
          left: { en: "Oxygen", hi: "ऑक्सीजन", mr: "ऑक्सिजन" },
          right: {
            en: "the flame's fifth of the air",
            hi: "लौ का, हवा का पाँचवाँ",
            mr: "ज्योतीचा, हवेचा पंचमांश",
          },
        },
      },
      {
        id: "nitrogen",
        name: { en: "Nitrogen", hi: "नाइट्रोजन", mr: "नायट्रोजन" },
        kind: "air-part",
        prompt: {
          en: "Nearly four-fifths of every breath you draw is which quiet gas — one that neither burns nor feeds a flame?",
          hi: "आपकी हर साँस का लगभग चार-पाँचवाँ हिस्सा कौन-सी चुप गैस है — जो न ख़ुद जलती है, न लौ को खिलाती है?",
          mr: "तुमच्या प्रत्येक श्वासाचा जवळजवळ चार-पंचमांश कोणता शांत वायू आहे — जो स्वतः जळत नाही, ज्योतीलाही पोसत नाही?",
        },
        statement: {
          en: "Nitrogen is the major part of air — nearly four-fifths — a quiet gas that does not burn and does not support burning.",
          hi: "नाइट्रोजन हवा का सबसे बड़ा हिस्सा है — लगभग चार-पाँचवाँ — एक चुप गैस जो न जलती है, न जलने का साथ देती है।",
          mr: "नायट्रोजन हवेचा सर्वांत मोठा भाग — जवळजवळ चार-पंचमांश — न जळणारा, जळण्याला साथही न देणारा शांत वायू.",
        },
        pair: {
          left: { en: "Nitrogen", hi: "नाइट्रोजन", mr: "नायट्रोजन" },
          right: {
            en: "the air's quiet majority",
            hi: "हवा का चुप बहुमत",
            mr: "हवेचे शांत बहुमत",
          },
        },
      },
      {
        id: "dissolvedair",
        name: { en: "Dissolved air", hi: "घुली हुई वायु", mr: "विरघळलेली हवा" },
        kind: "air-truth",
        prompt: {
          en: "Fish never surface to breathe, yet they live — what do their gills sip from the water itself?",
          hi: "मछलियाँ साँस लेने ऊपर नहीं आतीं, फिर भी जीती हैं — उनके गलफड़े ख़ुद पानी में से क्या पीते हैं?",
          mr: "मासे श्वासासाठी वर येत नाहीत, तरी जगतात — त्यांची कल्ले स्वतः पाण्यातून काय पितात?",
        },
        statement: {
          en: "Air dissolves in water — fish breathe that dissolved air through their gills, never needing the surface at all.",
          hi: "वायु पानी में घुलती है — मछलियाँ वही घुली हवा गलफड़ों से लेती हैं, सतह की उन्हें ज़रूरत ही नहीं।",
          mr: "हवा पाण्यात विरघळते — मासे तीच विरघळलेली हवा कल्ल्यांतून घेतात, पृष्ठभागाची त्यांना गरजच नाही.",
        },
        detail: {
          en: "Warm a pan of water and watch: tiny bubbles line the sides long before boiling — the dissolved air leaving first.",
          hi: "पानी की पतीली गुनगुनाइए और देखिए: उबाल से बहुत पहले किनारों पर नन्हे बुलबुले सज जाते हैं — घुली हवा पहले विदा होती हुई।",
          mr: "पाण्याचे पातेले कोमट करा आणि पाहा: उकळीच्या खूप आधी कडांना इवले बुडबुडे लागतात — विरघळलेली हवा आधी निघून जाताना.",
        },
        extra: {
          en: "That is why crowded, dirty ponds choke their fish — foul water holds too little dissolved air.",
          hi: "इसीलिए भीड़ भरे गंदे तालाब अपनी मछलियों का दम घोंटते हैं — मैले पानी में घुली हवा बहुत कम बचती है।",
          mr: "म्हणूनच गर्दीची, गढूळ तळी आपल्या माशांचा जीव गुदमरवतात — मलिन पाण्यात विरघळलेली हवा फार थोडी उरते.",
        },
        pair: {
          left: { en: "Dissolved air", hi: "घुली वायु", mr: "विरघळलेली हवा" },
          right: {
            en: "the fishes' hidden breath",
            hi: "मछलियों की छिपी साँस",
            mr: "माशांचा लपलेला श्वास",
          },
        },
      },
      {
        id: "wind",
        name: { en: "The wind", hi: "पवन", mr: "वारा" },
        kind: "air-truth",
        prompt: {
          en: "Flags stream, sails fill, windmills turn — what do we call air when it MOVES?",
          hi: "झंडे लहराते हैं, पाल भरते हैं, पवनचक्कियाँ घूमती हैं — चलती हुई हवा को क्या कहते हैं?",
          mr: "झेंडे फडकतात, शिडे भरतात, पवनचक्क्या फिरतात — हलणाऱ्या हवेला काय म्हणतात?",
        },
        statement: {
          en: "Wind is simply air in motion — strong enough to fill sails, turn windmills and carry kites, though the mover itself stays invisible.",
          hi: "पवन बस चलती हवा है — पाल भरने, पवनचक्की घुमाने और पतंग उड़ाने जितनी बलवान, जबकि चलाने वाली ख़ुद अदृश्य रहती है।",
          mr: "वारा म्हणजे नुसती हलणारी हवा — शिडे भरण्या, पवनचक्की फिरवण्या आणि पतंग नेण्याइतकी बलवान, तरी हलवणारी स्वतः अदृश्य राहते.",
        },
        pair: {
          left: { en: "The wind", hi: "पवन", mr: "वारा" },
          right: {
            en: "air caught moving",
            hi: "चलती पकड़ी गई हवा",
            mr: "हलताना पकडलेली हवा",
          },
        },
      },
      {
        id: "dustbeam",
        name: {
          en: "The sunbeam's dust",
          hi: "धूप-किरण की धूल",
          mr: "उन्हाच्या तिरपीतली धूळ",
        },
        kind: "air-part",
        prompt: {
          en: "A thin blade of sunlight cuts into a dark room — and suddenly thousands of drifting specks appear inside it. What has the beam revealed about 'clean' air?",
          hi: "अँधेरे कमरे में धूप की पतली फाँक घुसती है — और उसके भीतर सहसा हज़ारों तैरते कण दिख उठते हैं। किरण ने 'साफ़' हवा के बारे में क्या खोल दिया?",
          mr: "अंधाऱ्या खोलीत उन्हाची बारीक तिरीप शिरते — आणि तिच्या आत एकदम हजारो तरंगते कण दिसू लागतात. तिरपीने 'स्वच्छ' हवेबद्दल काय उघड केले?",
        },
        statement: {
          en: "Air carries floating dust and smoke — invisible until a sunbeam lights the drifting specks against the dark.",
          hi: "हवा तैरती धूल और धुआँ ढोती है — अदृश्य, जब तक धूप-किरण अँधेरे के आगे उन तैरते कणों को जला न दे।",
          mr: "हवा तरंगती धूळ आणि धूर वाहते — अदृश्य, जोवर उन्हाची तिरीप अंधारापुढे ते तरंगते कण उजळत नाही.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the evidence to what it proves: A-the dry paper in the dunked glass, B-the candle dying under a jar, C-bubbles lining a warming pan. Which trio is right?",
          hi: "सबूत को उसके साबित किए से मिलाइए: अ-डूबे गिलास का सूखा काग़ज़, ब-जार तले बुझती मोमबत्ती, स-गुनगुनाती पतीली के किनारे के बुलबुले। कौन-सी तिकड़ी सही है?",
          mr: "पुरावा तो काय सिद्ध करतो त्याच्याशी जुळवा: अ-बुडवलेल्या ग्लासातला कोरडा कागद, ब-बरणीखाली विझणारी मेणबत्ती, क-कोमट पातेल्याच्या कडांचे बुडबुडे. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: air occupies space · B: burning uses up oxygen · C: air dissolves in water",
            hi: "अ: वायु जगह घेरती है · ब: जलना ऑक्सीजन खाता है · स: वायु पानी में घुलती है",
            mr: "अ: हवा जागा व्यापते · ब: जळणे ऑक्सिजन खाते · क: हवा पाण्यात विरघळते",
          },
          {
            en: "A: air dissolves in water · B: air occupies space · C: burning uses oxygen",
            hi: "अ: वायु पानी में घुलती है · ब: वायु जगह घेरती है · स: जलना ऑक्सीजन खाता है",
            mr: "अ: हवा पाण्यात विरघळते · ब: हवा जागा व्यापते · क: जळणे ऑक्सिजन खाते",
          },
          {
            en: "A: burning uses oxygen · B: air dissolves in water · C: air occupies space",
            hi: "अ: जलना ऑक्सीजन खाता है · ब: वायु पानी में घुलती है · स: वायु जगह घेरती है",
            mr: "अ: जळणे ऑक्सिजन खाते · ब: हवा पाण्यात विरघळते · क: हवा जागा व्यापते",
          },
          {
            en: "A: air occupies space · B: air dissolves in water · C: burning uses oxygen",
            hi: "अ: वायु जगह घेरती है · ब: वायु पानी में घुलती है · स: जलना ऑक्सीजन खाता है",
            mr: "अ: हवा जागा व्यापते · ब: हवा पाण्यात विरघळते · क: जळणे ऑक्सिजन खाते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The dry paper says the glass was already full — of air. The dying candle says something in the jar ran out — its oxygen. The early bubbles say the water had air hidden inside it all along. Three kitchen experiments, three properties of one invisible substance.",
          hi: "सूखा काग़ज़ कहता है गिलास पहले से भरा था — हवा से। बुझती मोमबत्ती कहती है जार में कुछ चुक गया — उसकी ऑक्सीजन। जल्दी आए बुलबुले कहते हैं पानी में हमेशा से हवा छिपी थी। रसोई के तीन प्रयोग, एक अदृश्य पदार्थ के तीन गुण।",
          mr: "कोरडा कागद सांगतो ग्लास आधीच भरलेला होता — हवेने. विझणारी मेणबत्ती सांगते बरणीत काही संपले — तिचा ऑक्सिजन. लवकरचे बुडबुडे सांगतात पाण्यात हवा नेहमीच लपलेली होती. स्वयंपाकघरातले तीन प्रयोग, एका अदृश्य पदार्थाचे तीन गुण.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A burning candle covered with a glass jar keeps burning for a few seconds — then dies. Why not instantly, and why at all?",
          hi: "जलती मोमबत्ती पर शीशे का जार ढकिए तो वह कुछ सेकंड और जलती है — फिर बुझ जाती है। तुरंत क्यों नहीं, और आख़िर क्यों?",
          mr: "जळत्या मेणबत्तीवर काचेची बरणी झाका, ती काही सेकंद आणखी जळते — मग विझते. लगेच का नाही, आणि मुळात का?",
        },
        choices: [
          {
            en: "The jar traps a small store of air — the flame burns while its fifth of oxygen lasts, and dies the moment that share is spent",
            hi: "जार हवा का छोटा भंडार क़ैद करता है — लौ तब तक जलती है जब तक उसका ऑक्सीजन वाला पाँचवाँ हिस्सा बचा है, और वह हिस्सा चुकते ही बुझ जाती है",
            mr: "बरणी हवेचा छोटा साठा कोंडते — ज्योत तिचा ऑक्सिजनचा पंचमांश टिकेपर्यंत जळते, आणि तो वाटा संपताच विझते",
          },
          {
            en: "The glass slowly squeezes the flame out",
            hi: "शीशा धीरे-धीरे लौ को निचोड़ देता है",
            mr: "काच हळूहळू ज्योत पिळून टाकते",
          },
          {
            en: "The candle wax runs out at that moment",
            hi: "ठीक उसी पल मोम चुक जाता है",
            mr: "नेमक्या त्याच क्षणी मेण संपते",
          },
          {
            en: "The jar's cold air freezes the flame",
            hi: "जार की ठंडी हवा लौ को जमा देती है",
            mr: "बरणीतली गार हवा ज्योत गोठवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The delay IS the measurement: those few seconds are the trapped oxygen being eaten. Wax and wick are still plentiful when the flame dies — what ended was the air's burnable fifth; the nitrogen four-fifths sits there untouched, useless to the fire. A bigger jar buys a longer burn, in exact proportion: the candle is quietly weighing the oxygen for you.",
          hi: "देर ही नाप है: वे चंद सेकंड क़ैद ऑक्सीजन के खाए जाने के हैं। लौ बुझते समय मोम और बाती भरपूर हैं — ख़त्म हुआ तो हवा का जलने वाला पाँचवाँ हिस्सा; नाइट्रोजन का चार-पाँचवाँ वहीं अनछुआ बैठा है, आग के किसी काम का नहीं। बड़ा जार लंबी जलन दिलाता है, ठीक अनुपात में: मोमबत्ती चुपचाप आपके लिए ऑक्सीजन तौल रही है।",
          mr: "उशीर हेच माप: ते काही सेकंद म्हणजे कोंडलेला ऑक्सिजन खाल्ला जाणे. ज्योत विझताना मेण आणि वात भरपूर आहेत — संपला तो हवेचा जळणारा पंचमांश; नायट्रोजनचा चार-पंचमांश तिथेच अस्पर्श बसला आहे, आगीच्या काहीच कामाचा नाही. मोठी बरणी लांब जळण देते, नेमक्या प्रमाणात: मेणबत्ती गुपचूप तुमच्यासाठी ऑक्सिजन तोलते आहे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Divers carry air to the deep, yet fish in the same water carry nothing. What one fact about air explains both arrangements?",
          hi: "गोताखोर गहराई में हवा साथ ले जाते हैं, जबकि उसी पानी की मछलियाँ कुछ नहीं ले जातीं। हवा का कौन-सा एक तथ्य दोनों इंतज़ामों को समझा देता है?",
          mr: "पाणबुडे खोलात हवा सोबत नेतात, तर त्याच पाण्यातले मासे काहीच नेत नाहीत. हवेचे कोणते एक तथ्य दोन्ही व्यवस्था समजावते?",
        },
        choices: [
          {
            en: "Air dissolves in water, but only a little — enough for gills built to sip it, far too little for lungs built for open air",
            hi: "हवा पानी में घुलती है, पर थोड़ी ही — उसे पीने को बने गलफड़ों के लिए काफ़ी, खुली हवा के लिए बने फेफड़ों के लिए बहुत कम",
            mr: "हवा पाण्यात विरघळते, पण थोडीच — ती पिण्यास घडलेल्या कल्ल्यांना पुरेशी, खुल्या हवेसाठी घडलेल्या फुप्फुसांना फारच थोडी",
          },
          {
            en: "Fish do not need air at all",
            hi: "मछलियों को हवा चाहिए ही नहीं",
            mr: "माशांना हवा लागतच नाही",
          },
          {
            en: "Deep water has more air than the surface",
            hi: "गहरे पानी में सतह से ज़्यादा हवा है",
            mr: "खोल पाण्यात पृष्ठभागाहून जास्त हवा असते",
          },
          {
            en: "Divers carry air only out of habit",
            hi: "गोताखोर बस आदतन हवा ले जाते हैं",
            mr: "पाणबुडे नुसते सवयीने हवा नेतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "One fact, two bodies: water holds dissolved air, but thinly. Gills are fine nets grown to harvest exactly that thin supply; lungs are bellows grown for the rich open sky, and would starve on the water's trace. Neither creature is 'better equipped' — each is equipped for its own shelf of the same invisible substance.",
          hi: "एक तथ्य, दो शरीर: पानी में घुली हवा है, पर पतली। गलफड़े वही पतली आपूर्ति बीनने को उगे महीन जाल हैं; फेफड़े खुले समृद्ध आसमान के लिए बनी धौंकनियाँ, जो पानी की रत्ती भर हवा पर भूखे मर जाते। कोई जीव 'बेहतर लैस' नहीं — हर एक उसी अदृश्य पदार्थ की अपनी-अपनी ताक़ के लिए लैस है।",
          mr: "एक तथ्य, दोन शरीरे: पाण्यात विरघळलेली हवा आहे, पण विरळ. कल्ले म्हणजे नेमकी तीच विरळ रसद वेचायला वाढलेली बारीक जाळी; फुप्फुसे खुल्या समृद्ध आकाशासाठी घडलेले भाते, जे पाण्याच्या कणभर हवेवर उपाशी मेले असते. कोणताही जीव 'अधिक सुसज्ज' नाही — प्रत्येक त्याच अदृश्य पदार्थाच्या आपापल्या फडताळासाठी सुसज्ज आहे.",
        },
      },
    ],
  },
];
