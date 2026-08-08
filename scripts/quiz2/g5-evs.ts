/**
 * Class 5 EVS — NCERT "Looking Around", chapter by chapter, through the
 * conceptual engine. The voice grows up a little with the reader: still
 * concrete, but the questions now ask WHY the ant follows the line and why
 * the katori floats. Same distractor rule as everywhere — every statement
 * must be false of every other entity in its chapter.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE = "EduLink original, written against NCERT Looking Around (Class 5)";
const LICENCE = "CC-BY-SA-4.0";

export const G5_EVS: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Super Senses (how animals smell, see, hear and feel)        */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-5-super-senses",
    subject: "EVS",
    classLevel: 5,
    chapter: {
      en: "Chapter 1 — Super Senses",
      hi: "अध्याय 1 — ग़ज़ब की इंद्रियाँ",
      mr: "प्रकरण 1 — अफलातून इंद्रिये",
    },
    name: { en: "Super Senses", hi: "ग़ज़ब की इंद्रियाँ", mr: "अफलातून इंद्रिये" },
    summary: {
      en: "Ants that read smell-lines, eagles that read the ground from the sky, snakes that hear with their bodies — the senses animals live by.",
      hi: "गंध-रेखाएँ पढ़ती चींटियाँ, आसमान से ज़मीन पढ़ते चील, शरीर से सुनते साँप — वे इंद्रियाँ जिनके सहारे जानवर जीते हैं।",
      mr: "गंध-रेषा वाचणाऱ्या मुंग्या, आकाशातून जमीन वाचणारे गरुड, शरीराने ऐकणारे साप — ज्यांच्या जोरावर प्राणी जगतात ती इंद्रिये.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "ant",
        name: { en: "The ant", hi: "चींटी", mr: "मुंगी" },
        kind: "smeller",
        prompt: {
          en: "Which tiny marcher follows the invisible smell-line its sisters left, and loses the way if you wipe the line with a finger?",
          hi: "कौन-सी नन्ही क़तार-बाज़ अपनी साथिनों की छोड़ी अदृश्य गंध-रेखा पर चलती है, और उँगली से रेखा पोंछ दें तो राह भूल जाती है?",
          mr: "कोणती इवली रांगकरी आपल्या साथीदारांनी सोडलेल्या अदृश्य गंध-रेषेवरून चालते, आणि बोटाने रेषा पुसली की वाट चुकते?",
        },
        statement: {
          en: "Ants walk one behind another along a smell-line their own kind lays down — wipe it, and the line of ants scatters.",
          hi: "चींटियाँ अपनी ही बिरादरी की बिछाई गंध-रेखा पर एक के पीछे एक चलती हैं — उसे पोंछ दो, तो क़तार बिखर जाती है।",
          mr: "मुंग्या आपल्याच जातभाईंनी घातलेल्या गंध-रेषेवरून एकामागे एक चालतात — ती पुसा, आणि रांग विस्कटते.",
        },
        detail: {
          en: "An ant recognises its nest-mates by smell, and a dead ant's smell makes the others carry it out of the nest.",
          hi: "चींटी अपने बिल की साथिनों को गंध से पहचानती है, और मरी चींटी की गंध पाकर बाक़ी उसे बिल से बाहर ढो ले जाती हैं।",
          mr: "मुंगी आपल्या वारुळातल्या सोबतिणींना गंधाने ओळखते, आणि मेलेल्या मुंगीचा गंध आला की इतर तिला वारुळाबाहेर वाहून नेतात.",
        },
        pair: {
          left: { en: "The marching ant", hi: "क़तार की चींटी", mr: "रांगेतली मुंगी" },
          right: { en: "the smell-line road", hi: "गंध-रेखा की सड़क", mr: "गंध-रेषेची वाट" },
        },
      },
      {
        id: "dog",
        name: { en: "The dog", hi: "कुत्ता", mr: "कुत्रा" },
        kind: "smeller",
        prompt: {
          en: "Who reads the street through its nose — marking corners, and knowing from a lamppost which others passed by?",
          hi: "कौन गली को नाक से पढ़ता है — कोनों पर निशान छोड़ता, और खंभे से जान लेता कि और कौन-कौन गुज़रे?",
          mr: "कोण गल्ली नाकाने वाचतो — कोपऱ्यांवर खुणा करत, आणि खांबावरून ओळखत की आणखी कोण कोण गेले?",
        },
        statement: {
          en: "A dog marks its area with its own smell and reads other dogs' marks to know who has passed.",
          hi: "कुत्ता अपने इलाक़े पर अपनी गंध के निशान छोड़ता है और दूसरों के निशान सूँघकर जान लेता है कि कौन गुज़रा।",
          mr: "कुत्रा आपल्या भागावर स्वतःच्या गंधाच्या खुणा करतो आणि इतरांच्या खुणा हुंगून कोण गेले ते ओळखतो.",
        },
        detail: {
          en: "Police take help from dogs' noses to follow a trail no human eye can see.",
          hi: "पुलिस कुत्तों की नाक की मदद लेती है — उस राह पर जो किसी इंसानी आँख को नहीं दिखती।",
          mr: "पोलीस कुत्र्यांच्या नाकाची मदत घेतात — कोणत्याही माणसाच्या डोळ्याला न दिसणाऱ्या मागावर.",
        },
        pair: {
          left: { en: "The dog", hi: "कुत्ता", mr: "कुत्रा" },
          right: { en: "smell-marks on corners", hi: "कोनों पर गंध-निशान", mr: "कोपऱ्यांवरच्या गंध-खुणा" },
        },
      },
      {
        id: "eagle",
        name: { en: "The eagle", hi: "चील", mr: "गरुड" },
        kind: "seer",
        prompt: {
          en: "Which hunter circles far up in the sky, yet spots a chapati on the ground — its eyes four times sharper than ours?",
          hi: "कौन-सा शिकारी आसमान में बहुत ऊँचे चक्कर काटता है, फिर भी ज़मीन की रोटी देख लेता है — आँखें हमसे चार गुना तेज़?",
          mr: "कोणता शिकारी आकाशात खूप उंच घिरट्या घालतो, तरी जमिनीवरची पोळी हेरतो — डोळे आपल्याहून चौपट तीक्ष्ण?",
        },
        statement: {
          en: "An eagle sees about four times as sharply as we do — from high in the sky it can pick out food on the ground.",
          hi: "चील हमसे क़रीब चार गुना तेज़ देखती है — आसमान की ऊँचाई से वह ज़मीन का खाना ताड़ लेती है।",
          mr: "गरुड आपल्याहून सुमारे चौपट तीक्ष्ण पाहतो — आकाशाच्या उंचीवरून तो जमिनीवरचे खाणे हेरतो.",
        },
        pair: {
          left: { en: "The eagle", hi: "चील", mr: "गरुड" },
          right: { en: "eyes from the sky", hi: "आसमान से आँखें", mr: "आकाशातून डोळे" },
        },
      },
      {
        id: "mosquito",
        name: { en: "The mosquito", hi: "मच्छर", mr: "डास" },
        kind: "smeller",
        prompt: {
          en: "Who finds you in the dark by the smell of your body and the warmth of your skin — no eyes needed?",
          hi: "कौन अँधेरे में आपको आपके शरीर की गंध और त्वचा की गरमाहट से खोज लेता है — आँखों की ज़रूरत ही नहीं?",
          mr: "कोण अंधारात तुम्हाला तुमच्या शरीराच्या गंधाने आणि त्वचेच्या उबेने शोधतो — डोळ्यांची गरजच नाही?",
        },
        statement: {
          en: "A mosquito finds people by the smell of their body and the warmth of their skin, even in the dark.",
          hi: "मच्छर लोगों को उनके शरीर की गंध और त्वचा की गरमाहट से खोजता है, अँधेरे में भी।",
          mr: "डास माणसांना त्यांच्या शरीराच्या गंधाने आणि त्वचेच्या उबेने शोधतो, अंधारातही.",
        },
      },
      {
        id: "snake",
        name: { en: "The snake", hi: "साँप", mr: "साप" },
        kind: "feeler",
        prompt: {
          en: "Which creature has no outer ears at all, yet knows you are coming — feeling your footsteps tremble through the ground?",
          hi: "किस जीव के बाहरी कान होते ही नहीं, फिर भी उसे आपकी आहट मिल जाती है — ज़मीन में काँपते आपके क़दम महसूस करके?",
          mr: "कोणत्या जिवाला बाहेरचे कान नसतातच, तरी तुमची चाहूल लागते — जमिनीतून थरथरणारी तुमची पावले जाणवून?",
        },
        statement: {
          en: "A snake has no outer ears — it feels the ground's vibrations through its body and so senses approaching steps.",
          hi: "साँप के बाहरी कान नहीं होते — वह ज़मीन के कंपन अपने शरीर से महसूस करता है और यों आते क़दम भाँप लेता है।",
          mr: "सापाला बाहेरचे कान नसतात — तो जमिनीची कंपने शरीराने जाणतो आणि येणारी पावले ओळखतो.",
        },
        detail: {
          en: "The been's music does not reach it as sound from the air — it follows the movement of the been and the ground's beat.",
          hi: "बीन का संगीत उस तक हवा की आवाज़ बनकर नहीं पहुँचता — वह बीन के हिलने और ज़मीन की थाप के पीछे चलता है।",
          mr: "पुंगीचे संगीत त्याच्यापर्यंत हवेतल्या आवाजाने पोहोचत नाही — तो पुंगीच्या हालचालीमागे आणि जमिनीच्या ठेक्यामागे जातो.",
        },
        pair: {
          left: { en: "The snake", hi: "साँप", mr: "साप" },
          right: { en: "the ground's tremble", hi: "ज़मीन की थरथराहट", mr: "जमिनीची थरथर" },
        },
      },
      {
        id: "tiger",
        name: { en: "The tiger's whiskers", hi: "बाघ की मूँछें", mr: "वाघाच्या मिशा" },
        kind: "feeler",
        prompt: {
          en: "In pitch-dark forest, what do the tiger's face-hairs feel that its eyes cannot see — the air itself moving?",
          hi: "घुप्प अँधेरे जंगल में बाघ के चेहरे के बाल वह क्या महसूस करते हैं जो आँखें नहीं देख पातीं — ख़ुद हिलती हुई हवा?",
          mr: "मिट्ट काळोख्या जंगलात वाघाच्या चेहऱ्यावरचे केस डोळ्यांना न दिसणारे काय जाणतात — स्वतः हलणारी हवा?",
        },
        statement: {
          en: "The tiger's whiskers feel the movements of the air, helping it sense prey and paths in the dark.",
          hi: "बाघ की मूँछें हवा की हलचल महसूस करती हैं — अँधेरे में शिकार और राह भाँपने में मदद देतीं।",
          mr: "वाघाच्या मिशा हवेची हालचाल जाणतात — अंधारात सावज आणि वाट ओळखायला मदत करत.",
        },
        pair: {
          left: { en: "The tiger's whiskers", hi: "बाघ की मूँछें", mr: "वाघाच्या मिशा" },
          right: { en: "the dark's moving air", hi: "अँधेरे की हिलती हवा", mr: "अंधारातली हलणारी हवा" },
        },
      },
      {
        id: "langur",
        name: { en: "The langur's alarm call", hi: "लंगूर की चेतावनी-पुकार", mr: "वानराची इशारा-हाक" },
        kind: "warner",
        prompt: {
          en: "High in the trees, who gives the special cry at the sight of a tiger — a warning every deer below understands?",
          hi: "पेड़ों की ऊँचाई से बाघ दिखते ही कौन ख़ास पुकार लगाता है — ऐसी चेतावनी जो नीचे का हर हिरन समझता है?",
          mr: "झाडांच्या उंचीवरून वाघ दिसताच कोण खास हाक देतो — खालचे प्रत्येक हरिण समजते असा इशारा?",
        },
        statement: {
          en: "The langur calls out a special alarm from the treetops when it sees a tiger — and the deer below flee at the sound.",
          hi: "लंगूर बाघ दिखते ही पेड़ की चोटी से ख़ास चेतावनी-पुकार लगाता है — और नीचे के हिरन आवाज़ सुनते ही भाग खड़े होते हैं।",
          mr: "वानर वाघ दिसताच झाडाच्या शेंड्यावरून खास इशारा-हाक देतो — आणि खालची हरणे आवाज ऐकताच पळ काढतात.",
        },
        decoys: [
          { en: "The peacock's dance", hi: "मोर का नाच", mr: "मोराचा नाच" },
          { en: "The koel's song", hi: "कोयल का गीत", mr: "कोकिळेचे गाणे" },
        ],
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Match the super-sense to its owner: A-follows a smell-line, B-feels the ground's shaking, C-sees a meal from the clouds. Which trio is right?",
          hi: "ग़ज़ब की इंद्री उसके मालिक से मिलाइए: अ-गंध-रेखा पर चलता है, ब-ज़मीन का कंपन महसूस करता है, स-बादलों से भोजन देख लेता है। कौन-सी तिकड़ी सही है?",
          mr: "अफलातून इंद्रिय त्याच्या मालकाशी जुळवा: अ-गंध-रेषेवरून चालतो, ब-जमिनीचे कंपन जाणतो, क-ढगांतून जेवण पाहतो. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: the ant · B: the snake · C: the eagle",
            hi: "अ: चींटी · ब: साँप · स: चील",
            mr: "अ: मुंगी · ब: साप · क: गरुड",
          },
          {
            en: "A: the eagle · B: the ant · C: the snake",
            hi: "अ: चील · ब: चींटी · स: साँप",
            mr: "अ: गरुड · ब: मुंगी · क: साप",
          },
          {
            en: "A: the snake · B: the eagle · C: the ant",
            hi: "अ: साँप · ब: चील · स: चींटी",
            mr: "अ: साप · ब: गरुड · क: मुंगी",
          },
          {
            en: "A: the ant · B: the eagle · C: the snake",
            hi: "अ: चींटी · ब: चील · स: साँप",
            mr: "अ: मुंगी · ब: गरुड · क: साप",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Smell belongs to the ant's line, ground-shaking to the earless snake, and the far-down meal to the eagle's four-times eyes. Each animal's strongest sense fits its life: the ant walks, the snake hugs the ground, the eagle owns the sky.",
          hi: "गंध चींटी की क़तार की है, ज़मीन का कंपन बिना-कान साँप का, और दूर नीचे का भोजन चील की चौगुनी आँखों का। हर जानवर की सबसे तेज़ इंद्री उसके जीवन से मेल खाती है: चींटी चलती है, साँप ज़मीन से सटा है, चील आसमान की मालकिन है।",
          mr: "गंध मुंगीच्या रांगेचा, जमिनीचे कंपन बिन-कानाच्या सापाचे, आणि खाली दूरचे जेवण गरुडाच्या चौपट डोळ्यांचे. प्रत्येक प्राण्याचे सर्वांत तीक्ष्ण इंद्रिय त्याच्या जगण्याशी जुळते: मुंगी चालते, साप जमिनीला बिलगलेला, गरुड आकाशाचा धनी.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The langur that spots the tiger and cries out makes ITSELF easier to notice. Why do langurs give the alarm anyway?",
          hi: "बाघ को देखकर पुकार लगाने वाला लंगूर ख़ुद को ही ज़्यादा ज़ाहिर कर देता है। फिर भी लंगूर चेतावनी क्यों देते हैं?",
          mr: "वाघाला पाहून हाक देणारा वानर स्वतःलाच अधिक उघड करतो. तरी वानर इशारा का देतात?",
        },
        choices: [
          {
            en: "The troop and the deer it warns are its life-companions — a forest where everyone warns everyone keeps each animal safer than silence would",
            hi: "टोली और वे हिरन जिन्हें वह चेताता है, उसके जीवन-साथी हैं — जिस जंगल में सब सबको चेताते हैं, वहाँ हर जानवर चुप्पी से ज़्यादा सुरक्षित रहता है",
            mr: "टोळी आणि तो चेतावतो ती हरणे त्याचे जगण्यातले सोबती — जिथे सारे साऱ्यांना इशारतात ते जंगल प्रत्येक प्राण्याला गप्प राहण्याहून सुरक्षित ठेवते",
          },
          {
            en: "The langur is too high for the tiger, so its cry costs it nothing at all",
            hi: "लंगूर बाघ की पहुँच से बहुत ऊँचा है, इसलिए पुकार की उसे कोई क़ीमत नहीं",
            mr: "वानर वाघाच्या आवाक्याबाहेर खूप उंच असतो, म्हणून हाकेची त्याला काहीच किंमत नाही",
          },
          {
            en: "It cries to frighten the tiger away from the forest",
            hi: "वह बाघ को जंगल से डराकर भगाने के लिए चिल्लाता है",
            mr: "तो वाघाला जंगलातून घाबरवून पळवण्यासाठी ओरडतो",
          },
          {
            en: "The cry is an accident — langurs simply scream at anything",
            hi: "पुकार इत्तिफ़ाक़ है — लंगूर तो हर चीज़ पर चीख़ते हैं",
            mr: "हाक हा योगायोग — वानर तर कशावरही किंचाळतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The call has a price — the crier is noticed — and a payoff: the whole troop, and even the deer, escape. Animals that live in groups survive by such shared warnings; tomorrow another langur's cry will save THIS one. The forest's many alarm-callers are running a bargain older than any of them.",
          hi: "पुकार की क़ीमत है — पुकारने वाला दिख जाता है — और फल भी: पूरी टोली, यहाँ तक कि हिरन भी, बच निकलते हैं। झुंड में जीने वाले जानवर ऐसी साझा चेतावनियों से ही बचते हैं; कल किसी और लंगूर की पुकार इसी को बचाएगी। जंगल के ढेरों चेतावनी-बाज़ उनसे भी पुराना सौदा निभा रहे हैं।",
          mr: "हाकेची किंमत आहे — हाक देणारा दिसतो — आणि फळही: सारी टोळी, हरणेसुद्धा, निसटतात. कळपात जगणारे प्राणी अशा वाटलेल्या इशाऱ्यांनीच वाचतात; उद्या दुसऱ्या वानराची हाक याच वानराला वाचवेल. जंगलातले अनेक इशारेवाले त्यांच्याहूनही जुना सौदा निभावत आहेत.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A guard at a godown wants help catching a trail no human can sense, in the dark, over open ground. Going by their super-senses, which helper fits best — and why?",
          hi: "गोदाम का चौकीदार ऐसी राह पकड़ने में मदद चाहता है जिसे कोई इंसान महसूस नहीं कर सकता — अँधेरे में, खुले मैदान पर। ग़ज़ब की इंद्रियों के हिसाब से कौन-सा मददगार सबसे ठीक बैठेगा — और क्यों?",
          mr: "गोदामाच्या राखणदाराला अशी वाट पकडायला मदत हवी आहे जी कोणी माणूस जाणू शकत नाही — अंधारात, मोकळ्या मैदानावर. अफलातून इंद्रियांच्या हिशेबाने कोणता मदतनीस सर्वांत योग्य — आणि का?",
        },
        choices: [
          {
            en: "The dog — a trail is a line of smell, and smell works as well at night as by day",
            hi: "कुत्ता — राह गंध की रेखा है, और गंध रात में भी वैसी ही काम करती है जैसी दिन में",
            mr: "कुत्रा — माग म्हणजे गंधाची रेषा, आणि गंध रात्रीही दिवसाइतकाच चालतो",
          },
          {
            en: "The eagle — the sharpest eyes always win",
            hi: "चील — सबसे तेज़ आँखें हमेशा जीतती हैं",
            mr: "गरुड — सर्वांत तीक्ष्ण डोळे नेहमी जिंकतात",
          },
          {
            en: "The snake — it feels every footstep",
            hi: "साँप — वह हर क़दम महसूस करता है",
            mr: "साप — तो प्रत्येक पाऊल जाणतो",
          },
          {
            en: "The langur — its cry frightens thieves",
            hi: "लंगूर — उसकी पुकार चोरों को डराती है",
            mr: "वानर — त्याची हाक चोरांना घाबरवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Match the sense to the task: a trail is smell laid on the ground, and the dark that blinds the eagle's eyes does not dim a smell at all. The snake feels only steps happening NOW; the trail is hours old. That is why the police keep dogs, not eagles — the right helper is the one whose super-sense matches the job.",
          hi: "इंद्री को काम से मिलाइए: राह ज़मीन पर बिछी गंध है, और जो अँधेरा चील की आँखें बाँध देता है, वह गंध को ज़रा नहीं धुँधलाता। साँप केवल अभी पड़ते क़दम महसूस करता है; राह घंटों पुरानी है। इसीलिए पुलिस कुत्ते पालती है, चील नहीं — सही मददगार वही जिसकी ग़ज़ब की इंद्री काम से मेल खाए।",
          mr: "इंद्रिय कामाशी जुळवा: माग म्हणजे जमिनीवर पसरलेला गंध, आणि गरुडाचे डोळे बांधणारा अंधार गंधाला जरासुद्धा मंद करत नाही. साप फक्त आत्ता पडणारी पावले जाणतो; माग तासांचा जुना आहे. म्हणूनच पोलीस कुत्रे पाळतात, गरुड नव्हे — योग्य मदतनीस तोच ज्याचे अफलातून इंद्रिय कामाशी जुळते.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — From Tasting to Digesting                                   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-5-from-tasting-to-digesting",
    subject: "EVS",
    classLevel: 5,
    chapter: {
      en: "Chapter 3 — From Tasting to Digesting",
      hi: "अध्याय 3 — स्वाद से पाचन तक",
      mr: "प्रकरण 3 — चवीपासून पचनापर्यंत",
    },
    name: {
      en: "From Tasting to Digesting",
      hi: "स्वाद से पाचन तक",
      mr: "चवीपासून पचनापर्यंत",
    },
    summary: {
      en: "The tongue that needs wetness to taste, the long chew that turns roti sweet, the stomach's churning — food's journey from the first bite.",
      hi: "गीलेपन के बिना स्वाद न लेने वाली जीभ, रोटी को मीठा कर देने वाली लंबी चबाई, पेट की मथाई — पहले कौर से भोजन का सफ़र।",
      mr: "ओलाव्याशिवाय चव न घेणारी जीभ, पोळी गोड करणारे लांब चावणे, पोटातली घुसळण — पहिल्या घासापासून अन्नाचा प्रवास.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "tongue",
        name: { en: "The tongue", hi: "जीभ", mr: "जीभ" },
        kind: "body-part",
        seq: 1,
        prompt: {
          en: "Which part of the mouth tells sweet from salty and bitter from sour — but only once the food is wet?",
          hi: "मुँह का कौन-सा अंग मीठे को नमकीन से और कड़वे को खट्टे से अलग बताता है — पर तभी जब खाना गीला हो?",
          mr: "तोंडातला कोणता अवयव गोड-खारट आणि कडू-आंबट वेगळे सांगतो — पण अन्न ओले असेल तेव्हाच?",
        },
        statement: {
          en: "The tongue tastes sweet, salty, sour and bitter — but only food dissolved in wetness reaches its taste.",
          hi: "जीभ मीठा, नमकीन, खट्टा और कड़वा चखती है — पर उसके स्वाद तक वही खाना पहुँचता है जो गीलेपन में घुला हो।",
          mr: "जीभ गोड, खारट, आंबट आणि कडू चाखते — पण तिच्या चवीपर्यंत ओलाव्यात विरघळलेले अन्नच पोहोचते.",
        },
        detail: {
          en: "Dry your tongue with a cloth and put sugar on it — the sweetness waits until the tongue is wet again.",
          hi: "जीभ कपड़े से सुखाकर उस पर चीनी रखिए — मिठास तब तक ठहरी रहती है जब तक जीभ फिर गीली न हो।",
          mr: "जीभ फडक्याने कोरडी करून तिच्यावर साखर ठेवा — जीभ पुन्हा ओली होईपर्यंत गोडी थांबून राहते.",
        },
        extra: {
          en: "Different foods light up its different parts — the tip catches sweetness first.",
          hi: "अलग-अलग खाने उसके अलग-अलग हिस्सों को जगाते हैं — नोक सबसे पहले मिठास पकड़ती है।",
          mr: "वेगवेगळे पदार्थ तिचे वेगवेगळे भाग जागवतात — टोक गोडी सर्वांत आधी पकडते.",
        },
        pair: {
          left: { en: "The tongue", hi: "जीभ", mr: "जीभ" },
          right: { en: "taste, only when wet", hi: "स्वाद, गीलेपन पर ही", mr: "चव, ओले असतानाच" },
        },
      },
      {
        id: "saliva",
        name: { en: "Saliva", hi: "लार", mr: "लाळ" },
        kind: "body-juice",
        seq: 2,
        prompt: {
          en: "Which juice of the mouth wets every bite and quietly begins digestion before the food is even swallowed?",
          hi: "मुँह का कौन-सा रस हर कौर को भिगोता है और निगलने से पहले ही चुपचाप पाचन शुरू कर देता है?",
          mr: "तोंडातला कोणता रस प्रत्येक घास भिजवतो आणि गिळण्याआधीच गुपचूप पचन सुरू करतो?",
        },
        statement: {
          en: "Saliva wets the food and starts digesting it right in the mouth — digestion begins before swallowing.",
          hi: "लार खाने को भिगोती है और मुँह में ही उसे पचाना शुरू कर देती है — पाचन निगलने से पहले शुरू होता है।",
          mr: "लाळ अन्न भिजवते आणि तोंडातच ते पचवायला लागते — पचन गिळण्याआधी सुरू होते.",
        },
        pair: {
          left: { en: "Saliva", hi: "लार", mr: "लाळ" },
          right: {
            en: "digestion's first worker",
            hi: "पाचन का पहला कारीगर",
            mr: "पचनाचा पहिला कामगार",
          },
        },
      },
      {
        id: "chewing",
        name: { en: "Chewing well", hi: "अच्छी तरह चबाना", mr: "नीट चावणे" },
        kind: "food-step",
        seq: 3,
        prompt: {
          en: "Which slow, patient work of the teeth grinds each bite small and mixes it with the mouth's juice?",
          hi: "दाँतों का कौन-सा धीमा, धीरजवान काम हर कौर को महीन पीसता है और मुँह के रस में मिलाता है?",
          mr: "दातांचे कोणते सावकाश, धीराचे काम प्रत्येक घास बारीक दळते आणि तोंडातल्या रसात मिसळते?",
        },
        statement: {
          en: "Chewing grinds food small and mixes it with saliva — small, wet pieces digest far more easily than gulped lumps.",
          hi: "चबाना खाने को महीन पीसकर लार में मिलाता है — छोटे, गीले टुकड़े निगले गए लोंदों से कहीं आसानी से पचते हैं।",
          mr: "चावणे अन्न बारीक दळून लाळेत मिसळते — लहान, ओले तुकडे गिळलेल्या गोळ्यांहून कितीतरी सहज पचतात.",
        },
        pair: {
          left: { en: "Chewing", hi: "चबाना", mr: "चावणे" },
          right: {
            en: "grinding for the stomach",
            hi: "पेट के लिए पिसाई",
            mr: "पोटासाठी दळण",
          },
        },
      },
      {
        id: "sweetroti",
        name: {
          en: "The long-chewed roti",
          hi: "देर तक चबाई रोटी",
          mr: "बराच वेळ चावलेली पोळी",
        },
        kind: "food-step",
        prompt: {
          en: "Keep chewing a plain roti thirty times or more — what new taste slowly appears, out of nowhere?",
          hi: "सादी रोटी को तीस बार या ज़्यादा चबाते रहिए — कौन-सा नया स्वाद धीरे-धीरे, जाने कहाँ से, उभर आता है?",
          mr: "साधी पोळी तीसदा वा अधिक चावत राहा — कोणती नवी चव हळूहळू, कुठूनशी, उमटते?",
        },
        statement: {
          en: "A roti chewed long turns faintly sweet — saliva has begun changing its starch into sugar, right on the tongue.",
          hi: "देर तक चबाई रोटी हलकी मीठी हो जाती है — लार ने उसका माँड जीभ पर ही चीनी में बदलना शुरू कर दिया है।",
          mr: "बराच वेळ चावलेली पोळी किंचित गोड लागते — लाळेने तिचे सत्त्व जिभेवरच साखरेत बदलायला घेतले आहे.",
        },
        pair: {
          left: { en: "The long-chewed roti", hi: "देर तक चबाई रोटी", mr: "बराच वेळ चावलेली पोळी" },
          right: { en: "a sweetness that grows", hi: "उभरती मिठास", mr: "उमटणारी गोडी" },
        },
      },
      {
        id: "stomach",
        name: { en: "The stomach", hi: "पेट (आमाशय)", mr: "पोट (जठर)" },
        kind: "body-part",
        seq: 4,
        prompt: {
          en: "Where does the swallowed food go next — churned and mixed with strong juices for hours?",
          hi: "निगला खाना आगे कहाँ जाता है — जहाँ घंटों तेज़ रसों में मथा और मिलाया जाता है?",
          mr: "गिळलेले अन्न पुढे कुठे जाते — जिथे तासन्तास तीव्र रसांत घुसळले आणि मिसळले जाते?",
        },
        statement: {
          en: "The stomach churns the swallowed food and mixes it with its own strong juices, digesting it further for hours.",
          hi: "आमाशय निगले खाने को मथता है और अपने तेज़ रसों में मिलाकर घंटों उसे और पचाता है।",
          mr: "जठर गिळलेले अन्न घुसळते आणि स्वतःच्या तीव्र रसांत मिसळून तासन्तास ते आणखी पचवते.",
        },
        pair: {
          left: { en: "The stomach", hi: "आमाशय", mr: "जठर" },
          right: { en: "the churning pot", hi: "मथने की हाँडी", mr: "घुसळणीचे मडके" },
        },
      },
      {
        id: "glucose",
        name: { en: "Glucose water", hi: "ग्लूकोज़ का पानी", mr: "ग्लुकोजचे पाणी" },
        kind: "body-juice",
        prompt: {
          en: "Tired players and weak patients are given which sweet drink that gives energy at once, needing almost no digestion?",
          hi: "थके खिलाड़ियों और कमज़ोर मरीज़ों को कौन-सा मीठा घोल दिया जाता है जो लगभग बिना पचे तुरंत ताक़त देता है?",
          mr: "दमलेल्या खेळाडूंना आणि अशक्त रुग्णांना कोणते गोड पेय देतात जे जवळजवळ न पचता लगेच ताकद देते?",
        },
        statement: {
          en: "Glucose water gives energy almost at once — glucose is so simple the body need hardly digest it at all.",
          hi: "ग्लूकोज़ का पानी लगभग तुरंत ताक़त देता है — ग्लूकोज़ इतना सरल है कि शरीर को उसे पचाना ही नहीं पड़ता।",
          mr: "ग्लुकोजचे पाणी जवळजवळ लगेच ताकद देते — ग्लुकोज इतके साधे आहे की शरीराला ते पचवावे लागतच नाही.",
        },
      },
      {
        id: "ors",
        name: {
          en: "The salt-sugar drink (ORS)",
          hi: "नमक-चीनी का घोल (ओआरएस)",
          mr: "मीठ-साखरेचे पाणी (ओआरएस)",
        },
        kind: "body-juice",
        prompt: {
          en: "In loose motions the body loses water fast. Which home-made drink of three kitchen things puts it back?",
          hi: "दस्त में शरीर का पानी तेज़ी से निकल जाता है। रसोई की तीन चीज़ों का कौन-सा घरेलू घोल उसे लौटाता है?",
          mr: "जुलाबांत शरीरातले पाणी झपाट्याने जाते. स्वयंपाकघरातल्या तीन गोष्टींचे कोणते घरगुती पेय ते परत आणते?",
        },
        statement: {
          en: "The ORS drink — clean water with a pinch of salt and a spoon of sugar — returns what loose motions drain away.",
          hi: "ओआरएस — साफ़ पानी में चुटकी नमक और चम्मच चीनी — वह लौटा देता है जो दस्त बहा ले जाते हैं।",
          mr: "ओआरएस — स्वच्छ पाण्यात चिमूटभर मीठ आणि चमचाभर साखर — जुलाब वाहून नेतात ते परत देते.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Put food's journey in order: the stomach churns it; the teeth grind it; saliva wets and starts on it; the tongue tastes it. Which order matches a single bite's story?",
          hi: "भोजन का सफ़र क्रम में रखिए: आमाशय उसे मथता है; दाँत पीसते हैं; लार भिगोकर काम शुरू करती है; जीभ चखती है। एक कौर की कहानी से कौन-सा क्रम मिलता है?",
          mr: "अन्नाचा प्रवास क्रमाने लावा: जठर ते घुसळते; दात दळतात; लाळ भिजवून काम सुरू करते; जीभ चाखते. एका घासाच्या गोष्टीशी कोणता क्रम जुळतो?",
        },
        choices: [
          {
            en: "taste → chew → saliva's work → the stomach's churning",
            hi: "स्वाद → चबाई → लार का काम → आमाशय की मथाई",
            mr: "चव → चावणे → लाळेचे काम → जठराची घुसळण",
          },
          {
            en: "the stomach's churning → chew → taste → saliva's work",
            hi: "आमाशय की मथाई → चबाई → स्वाद → लार का काम",
            mr: "जठराची घुसळण → चावणे → चव → लाळेचे काम",
          },
          {
            en: "chew → the stomach's churning → saliva's work → taste",
            hi: "चबाई → आमाशय की मथाई → लार का काम → स्वाद",
            mr: "चावणे → जठराची घुसळण → लाळेचे काम → चव",
          },
          {
            en: "saliva's work → the stomach's churning → chew → taste",
            hi: "लार का काम → आमाशय की मथाई → चबाई → स्वाद",
            mr: "लाळेचे काम → जठराची घुसळण → चावणे → चव",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The mouth does everything first: the tongue meets the bite, the teeth grind as saliva soaks and begins digesting, and only then does the swallow hand the work to the stomach's churning. Nothing reaches the stomach that the mouth has not already started on.",
          hi: "पहले सब कुछ मुँह करता है: जीभ कौर से मिलती है, दाँत पीसते हैं जबकि लार भिगोकर पचाना शुरू करती है, और तभी निगलना काम आमाशय की मथाई को सौंपता है। आमाशय तक कुछ नहीं पहुँचता जिस पर मुँह पहले से काम न कर चुका हो।",
          mr: "आधी सारे तोंड करते: जीभ घासाला भेटते, दात दळतात आणि लाळ भिजवून पचवायला लागते, आणि मगच गिळणे काम जठराच्या घुसळणीकडे सोपवते. जठरापर्यंत असे काही पोहोचत नाही ज्यावर तोंडाने आधी काम केलेले नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Dry your tongue well with a clean cloth, then place sugar on it. For a moment — nothing. Why can a dry tongue not taste?",
          hi: "जीभ को साफ़ कपड़े से अच्छी तरह सुखाइए, फिर उस पर चीनी रखिए। एक पल — कुछ नहीं। सूखी जीभ स्वाद क्यों नहीं ले पाती?",
          mr: "जीभ स्वच्छ फडक्याने नीट कोरडी करा, मग तिच्यावर साखर ठेवा. क्षणभर — काहीच नाही. कोरडी जीभ चव का घेऊ शकत नाही?",
        },
        choices: [
          {
            en: "Taste needs the food dissolved — only when saliva wets the sugar can its sweetness reach the tongue's taste spots",
            hi: "स्वाद को घुला खाना चाहिए — लार चीनी को भिगोए तभी उसकी मिठास जीभ के स्वाद-बिंदुओं तक पहुँचती है",
            mr: "चवीला विरघळलेले अन्न हवे — लाळ साखर भिजवते तेव्हाच तिची गोडी जिभेच्या चव-बिंदूंपर्यंत पोहोचते",
          },
          {
            en: "Drying the tongue rubs its taste off for the whole day",
            hi: "जीभ सुखाने से उसका स्वाद दिन भर के लिए घिस जाता है",
            mr: "जीभ कोरडी केल्याने तिची चव दिवसभरासाठी पुसली जाते",
          },
          {
            en: "Sugar has no taste of its own — only sweetened water does",
            hi: "चीनी का अपना कोई स्वाद ही नहीं — मीठे पानी का ही होता है",
            mr: "साखरेला स्वतःची चवच नाही — गोड पाण्यालाच असते",
          },
          {
            en: "The cloth's taste covers the sugar's",
            hi: "कपड़े का स्वाद चीनी के स्वाद को ढक देता है",
            mr: "फडक्याची चव साखरेची चव झाकते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The tongue's taste spots read only what is dissolved and touching them — dry crystals sit ON the tongue without speaking to it. The moment saliva returns, a little sugar dissolves and the sweetness 'appears'. The experiment quietly proves saliva's second job: it is not just wetness, it is taste's messenger.",
          hi: "जीभ के स्वाद-बिंदु केवल वही पढ़ते हैं जो घुलकर उन्हें छू रहा हो — सूखे दाने जीभ पर बैठे रहते हैं, उससे बोले बिना। लार लौटते ही थोड़ी चीनी घुलती है और मिठास 'प्रकट' हो जाती है। यह प्रयोग चुपचाप लार का दूसरा काम साबित करता है: वह सिर्फ़ गीलापन नहीं, स्वाद की संदेशवाहक है।",
          mr: "जिभेचे चव-बिंदू फक्त विरघळून त्यांना स्पर्श करणारेच वाचतात — कोरडे कण जिभेवर बसून राहतात, तिच्याशी न बोलता. लाळ परतताच थोडी साखर विरघळते आणि गोडी 'प्रकट' होते. हा प्रयोग गुपचूप लाळेचे दुसरे काम सिद्ध करतो: ती नुसती ओल नव्हे, चवीची निरोप्या आहे.",
        },
      },
      {
        level: 6,
        stem: {
          en: "A doctor gives a weak, tired patient glucose water instead of a plate of rice, though rice has more food in it. What is the doctor's reasoning?",
          hi: "डॉक्टर कमज़ोर, थके मरीज़ को चावल की थाली की जगह ग्लूकोज़ का पानी देते हैं, जबकि चावल में खाना ज़्यादा है। डॉक्टर का तर्क क्या है?",
          mr: "डॉक्टर अशक्त, दमलेल्या रुग्णाला भाताच्या ताटाऐवजी ग्लुकोजचे पाणी देतात, वास्तविक भातात अन्न जास्त आहे. डॉक्टरांचे कारण काय?",
        },
        choices: [
          {
            en: "Rice must be digested for hours before it gives strength; glucose is already in food's simplest form and strengthens at once",
            hi: "चावल ताक़त देने से पहले घंटों पचना माँगता है; ग्लूकोज़ पहले से भोजन के सबसे सरल रूप में है और तुरंत बल देता है",
            mr: "भात ताकद देण्याआधी तासन्तास पचावा लागतो; ग्लुकोज आधीच अन्नाच्या सर्वांत साध्या रूपात आहे आणि लगेच बळ देते",
          },
          {
            en: "Rice is too costly to give to patients",
            hi: "चावल मरीज़ों को देने के लिए बहुत महँगा है",
            mr: "भात रुग्णांना द्यायला फार महाग आहे",
          },
          {
            en: "Sweet things are always better than grain",
            hi: "मीठी चीज़ें अनाज से हमेशा बेहतर होती हैं",
            mr: "गोड गोष्टी धान्याहून नेहमी चांगल्या असतात",
          },
          {
            en: "Water is the only thing a patient can swallow",
            hi: "मरीज़ केवल पानी ही निगल सकता है",
            mr: "रुग्ण फक्त पाणीच गिळू शकतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Digestion is work, and a weak body has little strength to spare for it. Rice pays out energy only after the mouth, stomach and hours of churning have broken it down to — glucose. The doctor simply skips the queue: hand the body the final product, and the tired patient is lifted in minutes, not hours.",
          hi: "पाचन मेहनत है, और कमज़ोर शरीर के पास उसके लिए ताक़त कम है। चावल ऊर्जा तभी देता है जब मुँह, आमाशय और घंटों की मथाई उसे तोड़कर — ग्लूकोज़ बना दें। डॉक्टर बस क़तार लाँघ देते हैं: शरीर को सीधे अंतिम उपज थमाइए, और थका मरीज़ घंटों में नहीं, मिनटों में सँभल जाता है।",
          mr: "पचन हे कष्ट आहेत, आणि अशक्त शरीराकडे त्यासाठी ताकद थोडी. भात ऊर्जा तेव्हाच देतो जेव्हा तोंड, जठर आणि तासांची घुसळण त्याला फोडून — ग्लुकोज करतात. डॉक्टर नुसती रांग ओलांडतात: शरीराला थेट अंतिम उत्पादन द्या, आणि दमलेला रुग्ण तासांत नव्हे, मिनिटांत सावरतो.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 7 — Experiments with Water (float, sink, dissolve)              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-5-experiments-with-water",
    subject: "EVS",
    classLevel: 5,
    chapter: {
      en: "Chapter 7 — Experiments with Water",
      hi: "अध्याय 7 — पानी के प्रयोग",
      mr: "प्रकरण 7 — पाण्याचे प्रयोग",
    },
    name: { en: "Experiments with Water", hi: "पानी के प्रयोग", mr: "पाण्याचे प्रयोग" },
    summary: {
      en: "A katori that floats while its metal sinks, salt that vanishes and returns, a lemon lifted by brine — water questioned with your own hands.",
      hi: "कटोरी जो तैरती है जबकि उसकी धातु डूबती है, नमक जो ग़ायब होकर लौट आता है, खारे पानी में उठा नींबू — अपने हाथों से पूछे गए पानी के सवाल।",
      mr: "वाटी तरंगते पण तिचा धातू बुडतो, मीठ नाहीसे होऊन परतते, खाऱ्या पाण्याने उचललेले लिंबू — स्वतःच्या हातांनी विचारलेले पाण्याचे प्रश्न.",
    },
    position: 7,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "dissolvers",
        name: {
          en: "Salt and sugar",
          hi: "नमक और चीनी",
          mr: "मीठ आणि साखर",
        },
        kind: "dissolver",
        prompt: {
          en: "Stirred into a glass of water, which two kitchen things disappear from sight — yet the water tastes of them?",
          hi: "पानी के गिलास में घोलने पर रसोई की कौन-सी दो चीज़ें आँख से ओझल हो जाती हैं — फिर भी पानी उन्हीं का स्वाद देता है?",
          mr: "पाण्याच्या ग्लासात ढवळल्यावर स्वयंपाकघरातल्या कोणत्या दोन गोष्टी दिसेनाशा होतात — तरी पाण्याला त्यांचीच चव येते?",
        },
        statement: {
          en: "Salt and sugar dissolve in water — they vanish from sight, but the taste proves they are still there.",
          hi: "नमक और चीनी पानी में घुल जाते हैं — दिखना बंद हो जाते हैं, पर स्वाद साबित करता है कि वे वहीं हैं।",
          mr: "मीठ आणि साखर पाण्यात विरघळतात — दिसेनाशी होतात, पण चव सिद्ध करते की ती तिथेच आहेत.",
        },
        pair: {
          left: { en: "Salt in water", hi: "पानी में नमक", mr: "पाण्यातले मीठ" },
          right: {
            en: "vanished, but tasteable",
            hi: "ओझल, पर स्वाद में हाज़िर",
            mr: "दिसेनासे, पण चवीत हजर",
          },
        },
      },
      {
        id: "oil",
        name: { en: "A spoon of oil", hi: "चम्मच भर तेल", mr: "चमचाभर तेल" },
        kind: "dissolver",
        prompt: {
          en: "Stirred hard into water, what refuses to dissolve and gathers instead as a shining layer on top?",
          hi: "पानी में ज़ोर से घोलने पर भी क्या घुलने से इनकार करता है और ऊपर चमकती परत बनकर जमा हो जाता है?",
          mr: "पाण्यात जोरात ढवळूनही काय विरघळायला नकार देते आणि वर चमकदार थर होऊन जमते?",
        },
        statement: {
          en: "Oil does not dissolve in water — however hard you stir, it gathers back into a floating layer on top.",
          hi: "तेल पानी में नहीं घुलता — कितना भी घोलिए, वह फिर ऊपर तैरती परत में सिमट आता है।",
          mr: "तेल पाण्यात विरघळत नाही — कितीही ढवळा, ते पुन्हा वर तरंगत्या थरात जमते.",
        },
        pair: {
          left: { en: "Oil in water", hi: "पानी में तेल", mr: "पाण्यातले तेल" },
          right: { en: "a layer, not a mixture", hi: "परत, घोल नहीं", mr: "थर, मिश्रण नव्हे" },
        },
      },
      {
        id: "chalk",
        name: { en: "Chalk powder", hi: "खड़िया का चूरा", mr: "खडूची भुकटी" },
        kind: "dissolver",
        prompt: {
          en: "Stirred into water, which white powder only makes the water cloudy and then settles at the bottom?",
          hi: "पानी में घोलने पर कौन-सा सफ़ेद चूरा पानी को बस गँदला करता है और फिर तली में बैठ जाता है?",
          mr: "पाण्यात ढवळल्यावर कोणती पांढरी भुकटी पाणी नुसते गढूळ करते आणि मग तळाशी बसते?",
        },
        statement: {
          en: "Chalk powder does not dissolve — it clouds the water awhile and then settles down at the bottom.",
          hi: "खड़िया का चूरा घुलता नहीं — थोड़ी देर पानी गँदला रखकर तली में बैठ जाता है।",
          mr: "खडूची भुकटी विरघळत नाही — थोडा वेळ पाणी गढूळ ठेवून तळाशी बसते.",
        },
      },
      {
        id: "saltreturn",
        name: {
          en: "The salt that came back",
          hi: "लौट आया नमक",
          mr: "परत आलेले मीठ",
        },
        kind: "dissolver",
        prompt: {
          en: "Leave a plate of salty water in the sun till the water is gone. What is the white crust waiting on the plate?",
          hi: "नमकीन पानी की तश्तरी धूप में छोड़िए, जब तक पानी उड़ न जाए। तश्तरी पर ठहरी सफ़ेद पपड़ी क्या है?",
          mr: "खारट पाण्याची बशी उन्हात ठेवा, पाणी उडेपर्यंत. बशीवर थांबलेला पांढरा खर काय आहे?",
        },
        statement: {
          en: "When salty water dries in the sun, the water leaves as vapour and the dissolved salt stays behind as a white crust.",
          hi: "नमकीन पानी धूप में सूखता है तो पानी भाप बनकर चला जाता है और घुला नमक सफ़ेद पपड़ी बनकर रह जाता है।",
          mr: "खारट पाणी उन्हात सुकते तेव्हा पाणी वाफ होऊन जाते आणि विरघळलेले मीठ पांढरा खर होऊन मागे राहते.",
        },
        detail: {
          en: "This is how salt farmers harvest salt from the sea — sun-dried, field by shallow field.",
          hi: "नमक बनाने वाले समुद्र से नमक ऐसे ही निकालते हैं — धूप में सुखाकर, क्यारी-दर-क्यारी।",
          mr: "मीठ पिकवणारे समुद्रातून मीठ असेच काढतात — उन्हात सुकवून, वाफ्यामागून वाफा.",
        },
        extra: {
          en: "Dissolving hides a thing; it does not destroy it — evaporation calls its bluff.",
          hi: "घुलना चीज़ को छिपाता है, मिटाता नहीं — वाष्पन उसका पर्दा खोल देता है।",
          mr: "विरघळणे वस्तू लपवते, नष्ट करत नाही — बाष्पीभवन तिचा बुरखा फाडते.",
        },
        pair: {
          left: { en: "Sun on salty water", hi: "नमकीन पानी पर धूप", mr: "खारट पाण्यावरचे ऊन" },
          right: {
            en: "white crust left behind",
            hi: "पीछे बची सफ़ेद पपड़ी",
            mr: "मागे उरलेला पांढरा खर",
          },
        },
      },
      {
        id: "katori",
        name: {
          en: "The floating katori",
          hi: "तैरती कटोरी",
          mr: "तरंगणारी वाटी",
        },
        kind: "floater",
        prompt: {
          en: "A steel plate-bowl sits calmly ON the water, though a steel spoon of the same metal goes straight down. Which shape is this?",
          hi: "स्टील की कटोरी पानी पर आराम से बैठी रहती है, जबकि उसी धातु का चम्मच सीधा नीचे चला जाता है। यह कौन-सा आकार है?",
          mr: "स्टीलची वाटी पाण्यावर शांत बसते, पण त्याच धातूचा चमचा सरळ खाली जातो. हा कोणता आकार?",
        },
        statement: {
          en: "The katori floats because its hollow shape spreads its weight over much water — the same steel as the sinking spoon, bent into a boat.",
          hi: "कटोरी इसलिए तैरती है कि उसका खोखला आकार वज़न को बहुत-से पानी पर फैला देता है — डूबते चम्मच वाला ही स्टील, नाव में मुड़ा हुआ।",
          mr: "वाटी तरंगते कारण तिचा पोकळ आकार वजन पुष्कळ पाण्यावर पसरतो — बुडणाऱ्या चमच्याचेच स्टील, होडीत वाकवलेले.",
        },
        pair: {
          left: { en: "The katori", hi: "कटोरी", mr: "वाटी" },
          right: {
            en: "a shape that floats its metal",
            hi: "धातु को तैरा देने वाला आकार",
            mr: "धातूला तरंगवणारा आकार",
          },
        },
      },
      {
        id: "lemon",
        name: {
          en: "The lemon in salt water",
          hi: "खारे पानी में नींबू",
          mr: "खाऱ्या पाण्यातले लिंबू",
        },
        kind: "floater",
        prompt: {
          en: "A lemon that sinks in plain water rises and floats when spoon after spoon of WHAT is stirred in?",
          hi: "सादे पानी में डूबता नींबू तब उठकर तैरने लगता है जब चम्मच-पर-चम्मच क्या घोला जाए?",
          mr: "साध्या पाण्यात बुडणारे लिंबू चमच्यामागून चमचे काय ढवळल्यावर वर येऊन तरंगू लागते?",
        },
        statement: {
          en: "A lemon that sinks in plain water floats in strongly salted water — salt water is heavier and pushes up harder.",
          hi: "सादे पानी में डूबने वाला नींबू ख़ूब नमकीन पानी में तैरता है — खारा पानी भारी होता है और ज़्यादा ज़ोर से ऊपर धकेलता है।",
          mr: "साध्या पाण्यात बुडणारे लिंबू भरपूर खारट पाण्यात तरंगते — खारे पाणी जड असते आणि अधिक जोराने वर ढकलते.",
        },
        pair: {
          left: { en: "The lemon", hi: "नींबू", mr: "लिंबू" },
          right: {
            en: "lifted by salty water",
            hi: "खारे पानी का सहारा",
            mr: "खाऱ्या पाण्याचा आधार",
          },
        },
      },
      {
        id: "puri",
        name: {
          en: "The puffed puri",
          hi: "फूली पूरी",
          mr: "फुगलेली पुरी",
        },
        kind: "floater",
        prompt: {
          en: "In the frying pan, what floats up golden the moment it fills with steam and air?",
          hi: "कड़ाही में क्या सुनहरा होकर ऊपर तैर आता है, जैसे ही उसमें भाप और हवा भर जाती है?",
          mr: "कढईत काय सोनेरी होऊन वर तरंगते, त्यात वाफ आणि हवा भरताच?",
        },
        statement: {
          en: "The puri puffs with steam and floats up in the hot oil — filled with air, it is light for its size.",
          hi: "पूरी भाप से फूलकर गरम तेल में ऊपर तैर आती है — हवा से भरी, अपने नाप के हिसाब से हलकी।",
          mr: "पुरी वाफेने फुगून गरम तेलात वर तरंगते — हवेने भरलेली, आकाराच्या मानाने हलकी.",
        },
      },
    ],
    hard: [
      {
        level: 6,
        stem: {
          en: "The spoon and the katori are the same steel, yet the spoon sinks and the katori floats. What makes the difference?",
          hi: "चम्मच और कटोरी एक ही स्टील के हैं, फिर भी चम्मच डूबता है और कटोरी तैरती है। फ़र्क़ किस बात का है?",
          mr: "चमचा आणि वाटी एकाच स्टीलची, तरी चमचा बुडतो आणि वाटी तरंगते. फरक कशाचा?",
        },
        choices: [
          {
            en: "The shape — the katori's hollow spreads its weight over much more water, so the water can hold it up",
            hi: "आकार का — कटोरी का खोखलापन उसका वज़न कहीं ज़्यादा पानी पर फैला देता है, तो पानी उसे थाम पाता है",
            mr: "आकाराचा — वाटीचा पोकळपणा तिचे वजन कितीतरी जास्त पाण्यावर पसरतो, म्हणून पाणी तिला तोलू शकते",
          },
          {
            en: "The katori's steel is a lighter kind than the spoon's",
            hi: "कटोरी का स्टील चम्मच के स्टील से हलकी क़िस्म का है",
            mr: "वाटीचे स्टील चमच्याच्या स्टीलहून हलक्या जातीचे आहे",
          },
          {
            en: "The spoon is dirtier, and dirt sinks things",
            hi: "चम्मच ज़्यादा मैला है, और मैल चीज़ें डुबो देता है",
            mr: "चमचा जास्त मळका आहे, आणि मळ वस्तू बुडवतो",
          },
          {
            en: "Water simply favours round things",
            hi: "पानी को गोल चीज़ें यों ही पसंद हैं",
            mr: "पाण्याला गोल वस्तू उगाचच आवडतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Floating is a contest between a thing's weight and the water it pushes aside. The spoon, compact, displaces a spoonful; the katori's hollow sits in a katori-sized hole of water — far more pushed aside, far more push-back. Same steel, different shape, opposite fates: that is why iron ships float while iron nails sink.",
          hi: "तैरना चीज़ के वज़न और उसके हटाए पानी के बीच का मुक़ाबला है। ठोस चम्मच चम्मच भर पानी हटाता है; कटोरी का खोखलापन कटोरी-जितने पानी के गड्ढे में बैठता है — कहीं ज़्यादा हटाया, कहीं ज़्यादा उठाया। स्टील वही, आकार अलग, नसीब उलटे: इसीलिए लोहे के जहाज़ तैरते हैं और लोहे की कीलें डूबती हैं।",
          mr: "तरंगणे ही वस्तूचे वजन आणि तिने बाजूला सारलेले पाणी यांतली स्पर्धा आहे. घट्ट चमचा चमचाभर पाणी सारतो; वाटीचा पोकळपणा वाटीएवढ्या पाण्याच्या खड्ड्यात बसतो — कितीतरी जास्त सारले, कितीतरी जास्त तोलले. स्टील तेच, आकार वेगळा, नशीब उलटे: म्हणूनच लोखंडी जहाजे तरंगतात आणि लोखंडी खिळे बुडतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Salt 'disappears' in water, yet the sea-side salt farmer grows white hills of it from that same water. What do the two facts together prove?",
          hi: "नमक पानी में 'ग़ायब' हो जाता है, फिर भी समुद्र-किनारे का नमक-किसान उसी पानी से नमक के सफ़ेद ढेर उगा लेता है। दोनों बातें मिलकर क्या साबित करती हैं?",
          mr: "मीठ पाण्यात 'नाहीसे' होते, तरी समुद्रकाठचा मीठ-शेतकरी त्याच पाण्यातून मिठाचे पांढरे ढीग पिकवतो. दोन्ही गोष्टी मिळून काय सिद्ध करतात?",
        },
        choices: [
          {
            en: "Dissolving only hides a thing in the water — take the water away by sunshine, and the thing is all still there",
            hi: "घुलना चीज़ को पानी में बस छिपाता है — धूप से पानी हटा दीजिए, और चीज़ पूरी की पूरी वहीं है",
            mr: "विरघळणे वस्तूला पाण्यात नुसते लपवते — उन्हाने पाणी काढून घ्या, आणि वस्तू सगळीच्या सगळी तिथेच आहे",
          },
          {
            en: "The sea makes new salt every day to replace the lost",
            hi: "समुद्र खोए नमक की जगह रोज़ नया नमक बनाता है",
            mr: "समुद्र गमावलेल्या मिठाच्या जागी रोज नवे मीठ बनवतो",
          },
          {
            en: "Salt only pretends to dissolve near the sea",
            hi: "समुद्र के पास नमक घुलने का बस नाटक करता है",
            mr: "समुद्राजवळ मीठ विरघळण्याचे नुसते नाटक करते",
          },
          {
            en: "Sunshine can turn water into salt",
            hi: "धूप पानी को नमक में बदल सकती है",
            mr: "ऊन पाण्याचे मीठ करू शकते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The farmer's salt-pan is the kitchen experiment grown huge: dissolved salt was never gone, only spread invisibly through the water. The sun takes ONLY the water — vapour carries no salt — so what was hidden gathers back grain by grain. Disappearing and being destroyed are different things, and a plate in the sun can tell them apart.",
          hi: "किसान की नमक-क्यारी रसोई का प्रयोग ही विशाल रूप में है: घुला नमक कभी गया नहीं था, बस पानी में अदृश्य होकर फैला था। धूप केवल पानी ले जाती है — भाप नमक नहीं ढोती — तो जो छिपा था वह दाना-दाना लौट आता है। ओझल होना और मिट जाना अलग बातें हैं, और धूप में रखी एक तश्तरी दोनों में फ़र्क़ कर दिखाती है।",
          mr: "शेतकऱ्याचा मीठ-वाफा म्हणजे स्वयंपाकघरातला प्रयोगच अवाढव्य रूपात: विरघळलेले मीठ कधी गेलेच नव्हते, फक्त पाण्यात अदृश्य होऊन पसरले होते. ऊन फक्त पाणी नेते — वाफ मीठ वाहत नाही — म्हणून लपलेले ते कणाकणाने परत जमते. दिसेनासे होणे आणि नष्ट होणे या वेगळ्या गोष्टी, आणि उन्हातली एक बशी दोन्हींतला फरक दाखवते.",
        },
      },
      {
        level: 5,
        stem: {
          en: "Sort these into FLOATS and SINKS in a bucket of plain water: a dry leaf, an iron nail, a drop of oil, a stone. Which sorting is right?",
          hi: "इन्हें सादे पानी की बाल्टी में तैरता है और डूबता है में छाँटिए: सूखा पत्ता, लोहे की कील, तेल की बूँद, पत्थर। कौन-सी छँटाई सही है?",
          mr: "यांची साध्या पाण्याच्या बादलीत तरंगते आणि बुडते अशी वर्गवारी करा: वाळके पान, लोखंडी खिळा, तेलाचा थेंब, दगड. कोणती वर्गवारी बरोबर?",
        },
        choices: [
          {
            en: "Floats: dry leaf, oil drop · Sinks: iron nail, stone",
            hi: "तैरते: सूखा पत्ता, तेल की बूँद · डूबते: कील, पत्थर",
            mr: "तरंगतात: वाळके पान, तेलाचा थेंब · बुडतात: खिळा, दगड",
          },
          {
            en: "Floats: iron nail, dry leaf · Sinks: oil drop, stone",
            hi: "तैरते: कील, सूखा पत्ता · डूबते: तेल की बूँद, पत्थर",
            mr: "तरंगतात: खिळा, वाळके पान · बुडतात: तेलाचा थेंब, दगड",
          },
          {
            en: "Floats: stone, oil drop · Sinks: iron nail, dry leaf",
            hi: "तैरते: पत्थर, तेल की बूँद · डूबते: कील, सूखा पत्ता",
            mr: "तरंगतात: दगड, तेलाचा थेंब · बुडतात: खिळा, वाळके पान",
          },
          {
            en: "Floats: iron nail, stone · Sinks: dry leaf, oil drop",
            hi: "तैरते: कील, पत्थर · डूबते: सूखा पत्ता, तेल की बूँद",
            mr: "तरंगतात: खिळा, दगड · बुडतात: वाळके पान, तेलाचा थेंब",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Light-for-their-size things ride the water: the papery leaf and the oil that always seeks the top. Heavy-for-their-size things go down: nail and stone. Size alone decides nothing — a huge log floats and a tiny pebble sinks; it is weight COMPARED to size that water measures.",
          hi: "अपने नाप के हिसाब से हलकी चीज़ें पानी पर सवार रहती हैं: काग़ज़-सा पत्ता और हमेशा ऊपर चढ़ता तेल। अपने नाप के हिसाब से भारी चीज़ें उतर जाती हैं: कील और पत्थर। अकेला आकार कुछ तय नहीं करता — बड़ा लट्ठा तैरता है और नन्हा कंकड़ डूबता है; पानी नाप की तुलना में वज़न तौलता है।",
          mr: "आकाराच्या मानाने हलक्या वस्तू पाण्यावर स्वार होतात: कागदासारखे पान आणि नेहमी वर चढणारे तेल. आकाराच्या मानाने जड वस्तू उतरतात: खिळा आणि दगड. एकटा आकार काही ठरवत नाही — मोठा ओंडका तरंगतो आणि इवला खडा बुडतो; पाणी आकाराच्या तुलनेत वजन तोलते.",
        },
      },
    ],
  },
];
