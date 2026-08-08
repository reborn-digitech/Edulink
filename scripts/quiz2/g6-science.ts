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
];
