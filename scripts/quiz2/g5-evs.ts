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
  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Every Drop Counts (old water wisdom, new water fairness)    */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-5-every-drop-counts",
    subject: "EVS",
    classLevel: 5,
    chapter: {
      en: "Chapter 6 — Every Drop Counts",
      hi: "अध्याय 6 — बूँद-बूँद क़ीमती",
      mr: "प्रकरण 6 — थेंब थेंब मोलाचा",
    },
    name: { en: "Every Drop Counts", hi: "बूँद-बूँद क़ीमती", mr: "थेंब थेंब मोलाचा" },
    summary: {
      en: "Stepwells and village johads that caught the rain for centuries, taps that reach some lanes and not others — water's old wisdom and new fairness.",
      hi: "सदियों बारिश सहेजती बावड़ियाँ और गाँव के जोहड़, कुछ गलियों तक पहुँचते और कुछ तक नहीं पहुँचते नल — पानी की पुरानी सूझ और नया इंसाफ़।",
      mr: "शतकानुशतके पाऊस साठवणाऱ्या बारवा आणि गावतळी, काही गल्ल्यांत पोहोचणारे आणि काहींत न पोहोचणारे नळ — पाण्याचे जुने शहाणपण आणि नवा न्याय.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "stepwell",
        name: { en: "The stepwell (bawdi)", hi: "बावड़ी", mr: "बारव" },
        kind: "old-water-way",
        prompt: {
          en: "Which old desert building leads you DOWN wide stone steps to the water — cool and shaded even in June?",
          hi: "रेगिस्तान की कौन-सी पुरानी इमारत चौड़ी पत्थर की सीढ़ियों से आपको नीचे पानी तक ले जाती है — जून में भी ठंडी और छायादार?",
          mr: "वाळवंटातली कोणती जुनी वास्तू रुंद दगडी पायऱ्यांनी तुम्हाला खाली पाण्यापर्यंत नेते — जूनमध्येही थंड आणि सावलीची?",
        },
        statement: {
          en: "The stepwell is a well with wide steps leading down to its water — built centuries ago, cool and shaded deep inside.",
          hi: "बावड़ी वह कुआँ है जिसके पानी तक चौड़ी सीढ़ियाँ उतरती हैं — सदियों पहले बनी, भीतर गहरे में ठंडी और छायादार।",
          mr: "बारव म्हणजे जिच्या पाण्यापर्यंत रुंद पायऱ्या उतरतात अशी विहीर — शतकांपूर्वी बांधलेली, आत खोलवर थंड आणि सावलीची.",
        },
        detail: {
          en: "Travellers of old rested on its steps, and whole caravans watered there.",
          hi: "पुराने ज़माने के मुसाफ़िर उसकी सीढ़ियों पर सुस्ताते थे, और पूरे कारवाँ वहाँ पानी पीते थे।",
          mr: "जुन्या काळचे प्रवासी तिच्या पायऱ्यांवर विसावत, आणि अख्खे तांडे तिथे पाणी पीत.",
        },
        extra: {
          en: "Many stand dry today — not because the rain stopped, but because the caring did.",
          hi: "आज कई सूखी खड़ी हैं — इसलिए नहीं कि बारिश रुक गई, बल्कि इसलिए कि देखभाल रुक गई।",
          mr: "आज कित्येक कोरड्या उभ्या आहेत — पाऊस थांबला म्हणून नव्हे, तर निगा थांबली म्हणून.",
        },
        pair: {
          left: { en: "The stepwell", hi: "बावड़ी", mr: "बारव" },
          right: { en: "steps down to water", hi: "पानी तक उतरती सीढ़ियाँ", mr: "पाण्यापर्यंत उतरणाऱ्या पायऱ्या" },
        },
      },
      {
        id: "johad",
        name: { en: "The village johad", hi: "गाँव का जोहड़", mr: "गावतळे (जोहड)" },
        kind: "old-water-way",
        prompt: {
          en: "Which village-made pond catches the whole monsoon behind a low earthen bank, and quietly refills the wells around it all year?",
          hi: "गाँव का बनाया कौन-सा तालाब मिट्टी की नीची पाल के पीछे पूरा मानसून समेट लेता है, और साल भर आसपास के कुओं को चुपचाप भरता रहता है?",
          mr: "गावाने बांधलेले कोणते तळे मातीच्या सखल बांधामागे अख्खा पावसाळा साठवते, आणि वर्षभर भोवतालच्या विहिरी गुपचूप भरत राहते?",
        },
        statement: {
          en: "The johad is a village pond behind an earthen bank — it holds the monsoon's rain and seeps it slowly into the wells around.",
          hi: "जोहड़ मिट्टी की पाल के पीछे बना गाँव का तालाब है — वह मानसून की बारिश थामता है और धीरे-धीरे आसपास के कुओं में रिसाता है।",
          mr: "जोहड म्हणजे मातीच्या बांधामागचे गावतळे — ते पावसाळ्याचा पाऊस धरून ठेवते आणि हळूहळू भोवतालच्या विहिरींत झिरपवते.",
        },
        pair: {
          left: { en: "The johad", hi: "जोहड़", mr: "जोहड" },
          right: {
            en: "the monsoon, banked for the year",
            hi: "साल भर के लिए सहेजा मानसून",
            mr: "वर्षभरासाठी साठवलेला पावसाळा",
          },
        },
      },
      {
        id: "pipedtap",
        name: { en: "The piped tap", hi: "नल का पानी", mr: "नळाचे पाणी" },
        kind: "new-water-way",
        prompt: {
          en: "In the newer city lanes, what brings water straight into the kitchen at the turn of a wrist?",
          hi: "शहर की नई गलियों में कलाई घुमाते ही रसोई तक पानी क्या पहुँचा देता है?",
          mr: "शहराच्या नव्या गल्ल्यांत मनगट फिरवताच स्वयंपाकघरात पाणी काय पोहोचवते?",
        },
        statement: {
          en: "The piped tap brings water into the house itself — those who have one hardly think of where the water came from.",
          hi: "नल पानी घर के भीतर ही ले आता है — जिनके पास है, वे शायद ही सोचते हैं कि पानी आया कहाँ से।",
          mr: "नळ पाणी थेट घरातच आणतो — ज्यांच्याकडे आहे, ते पाणी कुठून आले याचा क्वचितच विचार करतात.",
        },
      },
      {
        id: "tankerqueue",
        name: { en: "The tanker queue", hi: "टैंकर की क़तार", mr: "टँकरची रांग" },
        kind: "new-water-way",
        prompt: {
          en: "In the same city's poorer lanes, where do pots line up from dawn, waiting for a lorry of water?",
          hi: "उसी शहर की ग़रीब गलियों में घड़े भोर से कहाँ क़तार लगाते हैं, पानी की लॉरी की बाट जोहते?",
          mr: "त्याच शहराच्या गरीब गल्ल्यांत घागरी पहाटेपासून कुठे रांग लावतात, पाण्याच्या गाडीची वाट पाहत?",
        },
        statement: {
          en: "At the tanker queue, pots wait from dawn — the same city that pipes water to some lanes sends others a lorry twice a week.",
          hi: "टैंकर की क़तार में घड़े भोर से खड़े रहते हैं — जो शहर कुछ गलियों में नल पहुँचाता है, वही दूसरों को हफ़्ते में दो बार लॉरी भेजता है।",
          mr: "टँकरच्या रांगेत घागरी पहाटेपासून उभ्या असतात — जे शहर काही गल्ल्यांत नळ पोहोचवते, तेच इतरांना आठवड्यातून दोनदा गाडी पाठवते.",
        },
        pair: {
          left: { en: "The tanker queue", hi: "टैंकर की क़तार", mr: "टँकरची रांग" },
          right: {
            en: "pots waiting since dawn",
            hi: "भोर से खड़े घड़े",
            mr: "पहाटेपासून उभ्या घागरी",
          },
        },
      },
      {
        id: "waterkeepers",
        name: {
          en: "The old lake-keepers",
          hi: "पुराने तालाब-रखवाले",
          mr: "जुने तळे-राखणदार",
        },
        kind: "old-water-way",
        prompt: {
          en: "Before pipes came, who cleaned the lakes, mended the banks and shared out the water — the whole village doing it together?",
          hi: "नलों से पहले तालाब कौन साफ़ करता था, पालें कौन सुधारता था और पानी कौन बाँटता था — पूरा गाँव मिलकर?",
          mr: "नळ येण्याआधी तळी कोण साफ करत असे, बांध कोण दुरुस्त करत असे आणि पाणी कोण वाटत असे — अख्खे गाव मिळून?",
        },
        statement: {
          en: "The village itself kept its lakes — cleaning, mending banks and sharing water were everyone's yearly duty.",
          hi: "गाँव अपने तालाब ख़ुद सँभालता था — सफ़ाई, पाल की मरम्मत और पानी का बँटवारा सबका सालाना फ़र्ज़ था।",
          mr: "गाव आपली तळी स्वतः राखत असे — सफाई, बांधाची डागडुजी आणि पाण्याची वाटणी हे साऱ्यांचे वार्षिक कर्तव्य होते.",
        },
        pair: {
          left: { en: "The lake-keepers", hi: "तालाब-रखवाले", mr: "तळे-राखणदार" },
          right: {
            en: "everyone's yearly duty",
            hi: "सबका सालाना फ़र्ज़",
            mr: "साऱ्यांचे वार्षिक कर्तव्य",
          },
        },
      },
      {
        id: "bucketbath",
        name: { en: "The bucket bath", hi: "बाल्टी का स्नान", mr: "बादलीची आंघोळ" },
        kind: "saving-habit",
        prompt: {
          en: "Which way of bathing uses a counted amount of water — two or three bucketfuls — while a running shower never counts at all?",
          hi: "नहाने का कौन-सा ढंग गिना हुआ पानी लेता है — दो-तीन बाल्टियाँ — जबकि बहता फ़व्वारा कभी गिनता ही नहीं?",
          mr: "आंघोळीची कोणती रीत मोजके पाणी घेते — दोन-तीन बादल्या — तर वाहणारा शॉवर कधी मोजतच नाही?",
        },
        statement: {
          en: "A bucket bath spends a counted two or three bucketfuls — a running shower pours away far more without anyone counting.",
          hi: "बाल्टी का स्नान गिनी हुई दो-तीन बाल्टियाँ ख़र्चता है — बहता फ़व्वारा बिना किसी गिनती के कहीं ज़्यादा बहा देता है।",
          mr: "बादलीची आंघोळ मोजक्या दोन-तीन बादल्या खर्चते — वाहणारा शॉवर कोणीही न मोजता कितीतरी जास्त वाहवतो.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort these into the OLD water ways and the NEW: the stepwell, the tanker lorry, the johad, the piped tap. Which sorting is right?",
          hi: "इन्हें पानी के पुराने तरीक़ों और नए में छाँटिए: बावड़ी, टैंकर-लॉरी, जोहड़, नल। कौन-सी छँटाई सही है?",
          mr: "यांची पाण्याच्या जुन्या रीती आणि नव्या अशी वर्गवारी करा: बारव, टँकर-गाडी, जोहड, नळ. कोणती वर्गवारी बरोबर?",
        },
        choices: [
          {
            en: "Old: stepwell, johad · New: piped tap, tanker lorry",
            hi: "पुराने: बावड़ी, जोहड़ · नए: नल, टैंकर-लॉरी",
            mr: "जुने: बारव, जोहड · नवे: नळ, टँकर-गाडी",
          },
          {
            en: "Old: piped tap, johad · New: stepwell, tanker lorry",
            hi: "पुराने: नल, जोहड़ · नए: बावड़ी, टैंकर-लॉरी",
            mr: "जुने: नळ, जोहड · नवे: बारव, टँकर-गाडी",
          },
          {
            en: "Old: stepwell, tanker lorry · New: johad, piped tap",
            hi: "पुराने: बावड़ी, टैंकर-लॉरी · नए: जोहड़, नल",
            mr: "जुने: बारव, टँकर-गाडी · नवे: जोहड, नळ",
          },
          {
            en: "Old: tanker lorry, piped tap · New: stepwell, johad",
            hi: "पुराने: टैंकर-लॉरी, नल · नए: बावड़ी, जोहड़",
            mr: "जुने: टँकर-गाडी, नळ · नवे: बारव, जोहड",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The stepwell and the johad caught and kept LOCAL rain, built and tended by the people who drank from them. The tap and the tanker bring water from far away, run by someone else. The deep difference is not age but ownership: the old ways made every village its own waterworks.",
          hi: "बावड़ी और जोहड़ स्थानीय बारिश समेटते-सहेजते थे — उन्हीं के बनाए और सँवारे हुए जो उनसे पीते थे। नल और टैंकर दूर से पानी लाते हैं, किसी और के चलाए हुए। गहरा फ़र्क़ उम्र का नहीं, अपनेपन का है: पुराने तरीक़ों ने हर गाँव को उसका अपना जलकल बना दिया था।",
          mr: "बारव आणि जोहड स्थानिक पाऊस साठवत-जपत — त्यांतून पिणाऱ्यांनीच बांधलेले आणि राखलेले. नळ आणि टँकर दुरून पाणी आणतात, दुसऱ्या कोणी चालवलेले. खोल फरक वयाचा नव्हे, मालकीचा आहे: जुन्या रीतींनी प्रत्येक गावाला त्याचे स्वतःचे पाणीखाते केले होते.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The old bawdis and lakes served for centuries — and dried up in the very decades when piped water arrived. What most likely dried them?",
          hi: "पुरानी बावड़ियाँ और तालाब सदियों काम आए — और ठीक उन्हीं दशकों में सूख गए जब नल का पानी आया। उन्हें किसने सुखाया होगा?",
          mr: "जुन्या बारवा आणि तळी शतकानुशतके उपयोगी पडली — आणि नेमक्या नळाचे पाणी आले त्याच दशकांत आटली. ती बहुधा कशाने आटली?",
        },
        choices: [
          {
            en: "Neglect — once taps flowed, people stopped cleaning and mending the old works, and unfed, untended, they silted and died",
            hi: "उपेक्षा — नल बहने लगे तो लोगों ने पुराने जल-ठिकानों की सफ़ाई-मरम्मत छोड़ दी, और बिन देखभाल वे गाद से भरकर मर गए",
            mr: "दुर्लक्ष — नळ वाहू लागले तसे लोकांनी जुन्या जलवास्तूंची सफाई-डागडुजी सोडली, आणि निगेविना त्या गाळाने भरून मेल्या",
          },
          {
            en: "The rain itself stopped falling on the old lakes",
            hi: "पुराने तालाबों पर बारिश ही गिरनी बंद हो गई",
            mr: "जुन्या तळ्यांवर पाऊसच पडेनासा झाला",
          },
          {
            en: "Pipes secretly drain the old wells",
            hi: "नल चुपके से पुराने कुओं को खींच लेते हैं",
            mr: "नळ गुपचूप जुन्या विहिरी ओढून घेतात",
          },
          {
            en: "Old stone simply wears out in a few centuries",
            hi: "पुराना पत्थर कुछ सदियों में यों ही घिस जाता है",
            mr: "जुना दगड काही शतकांत असाच झिजतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The rain kept falling; the hands stopped coming. A johad lives on yearly desilting, a bawdi on cleaning — work the village did while it drank from them. The tap broke that bond: water now 'came from somewhere', so the old works fed no one and no one fed them. The chapter's warning is quiet but sharp — when the pipes fail in a dry year, the forgotten lakes are no longer there to catch you.",
          hi: "बारिश गिरती रही; हाथ आने बंद हो गए। जोहड़ सालाना गाद-सफ़ाई पर जीता है, बावड़ी झाड़-पोंछ पर — वह काम जो गाँव तब करता था जब उन्हीं से पीता था। नल ने वह रिश्ता तोड़ दिया: पानी अब 'कहीं से आ जाता है', तो पुराने ठिकाने किसी को पिलाते नहीं और उन्हें कोई सँवारता नहीं। अध्याय की चेतावनी धीमी पर पैनी है — सूखे साल में नल दग़ा दें, तो भुलाए तालाब आपको थामने के लिए वहाँ नहीं होते।",
          mr: "पाऊस पडत राहिला; हात येईनासे झाले. जोहड वार्षिक गाळ-उपशावर जगते, बारव झाडलोटीवर — गाव त्यांतून पीत असे तेव्हा करत असलेले काम. नळाने ते नाते तोडले: पाणी आता 'कुठून तरी येते', म्हणून जुन्या वास्तू कोणाला पाजत नाहीत आणि त्यांना कोणी जपत नाही. धड्याचा इशारा हळू पण धारदार — कोरड्या वर्षी नळ दगा देतील, तेव्हा विसरलेली तळी तुम्हाला झेलायला तिथे नसतात.",
        },
      },
      {
        level: 6,
        stem: {
          en: "In one city, one lane gets water all day from taps while another waits for a twice-a-week tanker. The chapter asks us to see this as a question of what?",
          hi: "एक ही शहर में एक गली को नलों से दिन भर पानी मिलता है जबकि दूसरी हफ़्ते में दो बार के टैंकर की बाट जोहती है। अध्याय इसे किस चीज़ का सवाल मानने को कहता है?",
          mr: "एकाच शहरात एका गल्लीला नळांतून दिवसभर पाणी मिळते तर दुसरी आठवड्यातून दोनदाच्या टँकरची वाट पाहते. धडा याकडे कशाचा प्रश्न म्हणून पाहायला सांगतो?",
        },
        choices: [
          {
            en: "Fairness — water is everyone's need, and a city that gives some lanes plenty and others queues has divided it unjustly",
            hi: "इंसाफ़ — पानी सबकी ज़रूरत है, और जो शहर कुछ गलियों को भरपूर और बाक़ियों को क़तारें देता है, उसने उसे बेइंसाफ़ी से बाँटा है",
            mr: "न्याय — पाणी ही साऱ्यांची गरज आहे, आणि जे शहर काही गल्ल्यांना भरपूर आणि इतरांना रांगा देते, त्याने ते अन्यायाने वाटले आहे",
          },
          {
            en: "Luck — some lanes are simply born fortunate",
            hi: "क़िस्मत — कुछ गलियाँ बस ख़ुशनसीब पैदा होती हैं",
            mr: "नशीब — काही गल्ल्या नुसत्या भाग्यवान जन्मतात",
          },
          {
            en: "Taste — tanker water and tap water taste the same anyway",
            hi: "स्वाद — टैंकर और नल के पानी का स्वाद तो एक ही है",
            mr: "चव — टँकर आणि नळाच्या पाण्याची चव सारखीच असते",
          },
          {
            en: "Geography — pipes cannot physically reach every lane",
            hi: "भूगोल — नल हर गली तक पहुँच ही नहीं सकते",
            mr: "भूगोल — नळ प्रत्येक गल्लीपर्यंत पोहोचूच शकत नाहीत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The pipes reach the rich lane and stop — not because iron cannot turn corners, but because the city chose where to lay it. When a need as basic as water is plentiful on one side of a road and rationed on the other, the chapter wants the reader to name that plainly: not luck, not geography — fairness, owed and not yet paid.",
          hi: "नल अमीर गली तक पहुँचकर रुक जाते हैं — इसलिए नहीं कि लोहा मोड़ नहीं मुड़ सकता, बल्कि इसलिए कि शहर ने चुना कि उसे कहाँ बिछाना है। जब पानी जैसी बुनियादी ज़रूरत सड़क के एक ओर भरपूर और दूसरी ओर राशन पर हो, तो अध्याय चाहता है कि पढ़ने वाला उसे साफ़ नाम दे: न क़िस्मत, न भूगोल — इंसाफ़, जो बक़ाया है और अभी चुकाया नहीं गया।",
          mr: "नळ श्रीमंत गल्लीपर्यंत पोहोचून थांबतात — लोखंड वळणे घेऊ शकत नाही म्हणून नव्हे, तर शहराने ते कुठे टाकायचे हे निवडले म्हणून. पाण्यासारखी मूलभूत गरज रस्त्याच्या एका बाजूला भरपूर आणि दुसऱ्या बाजूला मोजून मिळते, तेव्हा धड्याला हवे आहे की वाचणाऱ्याने त्याला स्पष्ट नाव द्यावे: नशीब नव्हे, भूगोल नव्हे — न्याय, जो देणे आहे आणि अजून दिलेला नाही.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 8 — A Treat for Mosquitoes (malaria and the fight against it)   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-5-a-treat-for-mosquitoes",
    subject: "EVS",
    classLevel: 5,
    chapter: {
      en: "Chapter 8 — A Treat for Mosquitoes",
      hi: "अध्याय 8 — मच्छरों की दावत",
      mr: "प्रकरण 8 — डासांची मेजवानी",
    },
    name: { en: "A Treat for Mosquitoes", hi: "मच्छरों की दावत", mr: "डासांची मेजवानी" },
    summary: {
      en: "Malaria's shivering fever, the still water where mosquitoes breed, the blood test that names the illness — and the foods that rebuild weak blood.",
      hi: "मलेरिया का कँपकँपाता बुख़ार, ठहरा पानी जहाँ मच्छर पलते हैं, बीमारी का नाम बताती ख़ून की जाँच — और कमज़ोर ख़ून को फिर गढ़ते भोजन।",
      mr: "मलेरियाचा हुडहुडी भरणारा ताप, डास पैदा होतात ते साचलेले पाणी, आजाराचे नाव सांगणारी रक्त-तपासणी — आणि अशक्त रक्त पुन्हा घडवणारे अन्न.",
    },
    position: 8,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "malaria",
        name: { en: "Malaria", hi: "मलेरिया", mr: "मलेरिया" },
        kind: "illness",
        prompt: {
          en: "Which illness arrives with shivering cold, then burning fever — carried from person to person by a mosquito's bite?",
          hi: "कौन-सी बीमारी पहले कँपकँपाती ठंड, फिर तपते बुख़ार के साथ आती है — मच्छर के डंक से एक इंसान से दूसरे तक पहुँचती?",
          mr: "कोणता आजार आधी हुडहुडी भरणारी थंडी, मग तापणारा ताप घेऊन येतो — डासाच्या दंशाने एका माणसाकडून दुसऱ्याकडे पोहोचणारा?",
        },
        statement: {
          en: "Malaria brings shivering followed by high fever, and it spreads through the bite of a mosquito.",
          hi: "मलेरिया कँपकँपी और फिर तेज़ बुख़ार लाता है, और मच्छर के काटने से फैलता है।",
          mr: "मलेरिया हुडहुडी आणि मग चढा ताप आणतो, आणि डास चावल्याने पसरतो.",
        },
        detail: {
          en: "Anophela mosquitoes pick up the malaria germ from one person's blood and leave it in the next.",
          hi: "एनोफ़िलीज़ मच्छर मलेरिया का कीटाणु एक के ख़ून से उठाते हैं और अगले के ख़ून में छोड़ जाते हैं।",
          mr: "अ‍ॅनॉफिलीस डास मलेरियाचा जंतू एकाच्या रक्तातून उचलतात आणि पुढच्याच्या रक्तात सोडतात.",
        },
        extra: {
          en: "In the old days whole army camps and villages were laid low by it.",
          hi: "पुराने ज़माने में पूरे फ़ौजी पड़ाव और गाँव इससे बिछ जाते थे।",
          mr: "जुन्या काळी अख्खे लष्करी तळ आणि गावे यामुळे आडवी होत.",
        },
        pair: {
          left: { en: "Malaria", hi: "मलेरिया", mr: "मलेरिया" },
          right: {
            en: "shivering, then burning",
            hi: "पहले कँपकँपी, फिर तपन",
            mr: "आधी हुडहुडी, मग ताप",
          },
        },
      },
      {
        id: "stillwater",
        name: { en: "Standing water", hi: "ठहरा पानी", mr: "साचलेले पाणी" },
        kind: "breeding",
        prompt: {
          en: "Coolers, open drums, puddles, choked drains — what do all these offer a mosquito looking for a nursery?",
          hi: "कूलर, खुले ड्रम, डबरे, रुकी नालियाँ — ये सब पालना खोजते मच्छर को क्या दे देते हैं?",
          mr: "कूलर, उघडे ड्रम, डबकी, तुंबलेली गटारे — हे सारे पाळणाघर शोधणाऱ्या डासाला काय देतात?",
        },
        statement: {
          en: "Mosquitoes lay their eggs in standing water — any still pool, from a cooler tray to a puddle, becomes their nursery.",
          hi: "मच्छर ठहरे पानी में अंडे देते हैं — कूलर की ट्रे से डबरे तक, हर रुका पानी उनका पालना बन जाता है।",
          mr: "डास साचलेल्या पाण्यात अंडी घालतात — कूलरच्या ट्रेपासून डबक्यापर्यंत, प्रत्येक थांबलेले पाणी त्यांचे पाळणाघर होते.",
        },
        pair: {
          left: { en: "Standing water", hi: "ठहरा पानी", mr: "साचलेले पाणी" },
          right: { en: "the mosquito's nursery", hi: "मच्छर का पालना", mr: "डासाचे पाळणाघर" },
        },
      },
      {
        id: "larvae",
        name: { en: "The wriggling larvae", hi: "कुलबुलाते लारवा", mr: "वळवळणाऱ्या अळ्या" },
        kind: "breeding",
        prompt: {
          en: "Look closely at still water in a drain — what are the tiny wrigglers that will grow wings within days?",
          hi: "नाली के ठहरे पानी को ग़ौर से देखिए — वे नन्हे कुलबुलाते जीव क्या हैं जो कुछ ही दिनों में पंख पा लेंगे?",
          mr: "गटारातल्या साचलेल्या पाण्यात निरखून पाहा — काही दिवसांतच पंख मिळवणारे ते इवले वळवळे जीव काय आहेत?",
        },
        statement: {
          en: "The wrigglers in still water are mosquito larvae — hatched from eggs, days away from flying and biting.",
          hi: "ठहरे पानी के कुलबुले मच्छर के लारवा हैं — अंडों से निकले, उड़ने और काटने से बस कुछ दिन दूर।",
          mr: "साचलेल्या पाण्यातले वळवळे म्हणजे डासांच्या अळ्या — अंड्यांतून निघालेल्या, उडण्या-चावण्यापासून काहीच दिवस दूर.",
        },
      },
      {
        id: "bloodtest",
        name: { en: "The blood test", hi: "ख़ून की जाँच", mr: "रक्त-तपासणी" },
        kind: "defence",
        prompt: {
          en: "Fever can have many causes. What does the doctor order — one drop examined under a lens — to know if malaria's germ is truly there?",
          hi: "बुख़ार के कई कारण हो सकते हैं। डॉक्टर क्या करवाते हैं — शीशे तले परखी एक बूँद — यह जानने को कि मलेरिया का कीटाणु सचमुच है या नहीं?",
          mr: "तापाची अनेक कारणे असू शकतात. डॉक्टर काय करायला सांगतात — भिंगाखाली तपासलेला एक थेंब — मलेरियाचा जंतू खरेच आहे का हे कळण्यासाठी?",
        },
        statement: {
          en: "The blood test shows whether malaria's germ is in the blood — one drop under the microscope names the illness for certain.",
          hi: "ख़ून की जाँच बताती है कि मलेरिया का कीटाणु ख़ून में है या नहीं — सूक्ष्मदर्शी तले एक बूँद बीमारी का नाम पक्का कर देती है।",
          mr: "रक्त-तपासणी सांगते की मलेरियाचा जंतू रक्तात आहे का — सूक्ष्मदर्शकाखालचा एक थेंब आजाराचे नाव पक्के करतो.",
        },
        pair: {
          left: { en: "The blood test", hi: "ख़ून की जाँच", mr: "रक्त-तपासणी" },
          right: {
            en: "the illness named for certain",
            hi: "पक्का हुआ बीमारी का नाम",
            mr: "पक्के झालेले आजाराचे नाव",
          },
        },
      },
      {
        id: "net",
        name: { en: "The mosquito net", hi: "मच्छरदानी", mr: "मच्छरदाणी" },
        kind: "defence",
        prompt: {
          en: "What guards a sleeper all night without smoke, spray or electricity — just mesh hung over the bed?",
          hi: "बिना धुएँ, दवा या बिजली के रात भर सोने वाले की रखवाली क्या करती है — बिस्तर पर तनी बस एक जाली?",
          mr: "धूर, फवारा वा वीज न लागता रात्रभर झोपणाऱ्याची राखण काय करते — पलंगावर ताणलेली नुसती जाळी?",
        },
        statement: {
          en: "The mosquito net is a mesh the mosquito cannot pass — the sleeper inside is safe all night, cost-free and smoke-free.",
          hi: "मच्छरदानी वह जाली है जिसे मच्छर पार नहीं कर सकता — भीतर सोने वाला रात भर सुरक्षित, बिना ख़र्च, बिना धुएँ।",
          mr: "मच्छरदाणी ही डासाला पार करता न येणारी जाळी — आत झोपणारा रात्रभर सुरक्षित, खर्चाविना, धुराविना.",
        },
        pair: {
          left: { en: "The mosquito net", hi: "मच्छरदानी", mr: "मच्छरदाणी" },
          right: { en: "a mesh wall for the night", hi: "रात की जाली-दीवार", mr: "रात्रीची जाळी-भिंत" },
        },
      },
      {
        id: "anaemia",
        name: { en: "Anaemia (weak blood)", hi: "अनीमिया (ख़ून की कमी)", mr: "अ‍ॅनिमिया (रक्ताची कमतरता)" },
        kind: "illness",
        prompt: {
          en: "Always tired, pale, breathless on the stairs — which condition of TOO-LITTLE-IRON blood is this, common where meals lack green vegetables?",
          hi: "हरदम थकान, पीलापन, सीढ़ियों पर फूलती साँस — लोहे की कमी वाले ख़ून की यह कौन-सी दशा है, जो हरी सब्ज़ियों से ख़ाली थालियों में आम है?",
          mr: "सदा थकवा, फिकटपणा, जिन्यावर लागणारी धाप — लोहाच्या कमतरतेच्या रक्ताची ही कोणती अवस्था, हिरव्या भाज्या नसलेल्या ताटांत सर्रास?",
        },
        statement: {
          en: "Anaemia is blood too poor in iron — it makes a person tired, pale and breathless, and shows in a haemoglobin test.",
          hi: "अनीमिया लोहे की कमी वाला ख़ून है — इंसान थका, पीला और हाँफता रहता है, और हीमोग्लोबिन की जाँच में यह पकड़ में आता है।",
          mr: "अ‍ॅनिमिया म्हणजे लोह कमी पडलेले रक्त — माणूस थकलेला, फिकट आणि धापणारा राहतो, आणि हिमोग्लोबिनच्या तपासणीत ते सापडते.",
        },
        detail: {
          en: "Green leafy vegetables and jaggery are iron's cheap, everyday sources.",
          hi: "हरी पत्तेदार सब्ज़ियाँ और गुड़ लोहे के सस्ते, रोज़मर्रा के स्रोत हैं।",
          mr: "हिरव्या पालेभाज्या आणि गूळ हे लोहाचे स्वस्त, रोजचे स्रोत आहेत.",
        },
        extra: {
          en: "Malaria too can leave the blood weakened — the two illnesses often walk together.",
          hi: "मलेरिया भी ख़ून को कमज़ोर छोड़ जाता है — दोनों बीमारियाँ अक्सर साथ-साथ चलती हैं।",
          mr: "मलेरियाही रक्त अशक्त करून जातो — दोन्ही आजार अनेकदा हातात हात घालून चालतात.",
        },
        pair: {
          left: { en: "Anaemia", hi: "अनीमिया", mr: "अ‍ॅनिमिया" },
          right: {
            en: "iron-poor, tired blood",
            hi: "लोहे से ख़ाली, थका ख़ून",
            mr: "लोह कमी, थकलेले रक्त",
          },
        },
      },
      {
        id: "ironfoods",
        name: {
          en: "Jaggery and green leaves",
          hi: "गुड़ और हरी पत्तियाँ",
          mr: "गूळ आणि हिरवा पाला",
        },
        kind: "defence",
        prompt: {
          en: "Which two humble foods from the village shop and the field put iron back into weak blood?",
          hi: "गाँव की दुकान और खेत की कौन-सी दो सीधी-सादी चीज़ें कमज़ोर ख़ून में लोहा लौटाती हैं?",
          mr: "गावच्या दुकानातल्या आणि शेतातल्या कोणत्या दोन साध्या गोष्टी अशक्त रक्तात लोह परत आणतात?",
        },
        statement: {
          en: "Jaggery and green leafy vegetables are everyday iron-givers — cheap food that rebuilds weak blood meal by meal.",
          hi: "गुड़ और हरी पत्तेदार सब्ज़ियाँ रोज़ के लोहा-दाता हैं — सस्ता भोजन जो थाली-दर-थाली कमज़ोर ख़ून गढ़ता है।",
          mr: "गूळ आणि हिरव्या पालेभाज्या हे रोजचे लोह-दाते — जेवणामागून जेवण अशक्त रक्त घडवणारे स्वस्त अन्न.",
        },
      },
    ],
    hard: [
      {
        level: 6,
        stem: {
          en: "The health worker's first order in a malaria-hit lane is strange: 'Empty every cooler, drum and tyre of its water.' Why attack WATER to fight a FEVER?",
          hi: "मलेरिया-ग्रस्त गली में स्वास्थ्य-कर्मी का पहला आदेश अजीब है: 'हर कूलर, ड्रम और टायर का पानी उलट दो।' बुख़ार से लड़ने को पानी पर वार क्यों?",
          mr: "मलेरिया झालेल्या गल्लीत आरोग्य-सेवकाचा पहिला आदेश विचित्र वाटतो: 'प्रत्येक कूलर, ड्रम आणि टायरातले पाणी ओता.' तापाशी लढायला पाण्यावर हल्ला का?",
        },
        choices: [
          {
            en: "Because the fever's carrier is born in that water — empty the still pools and the next generation of mosquitoes never takes wing",
            hi: "क्योंकि बुख़ार का वाहक उसी पानी में जन्मता है — ठहरे पानी उलट दो, तो मच्छरों की अगली पीढ़ी पंख ही नहीं पाती",
            mr: "कारण तापाचा वाहक त्याच पाण्यात जन्मतो — साचलेले पाणी ओता, म्हणजे डासांच्या पुढच्या पिढीला पंखच फुटत नाहीत",
          },
          {
            en: "Because drinking cooler water causes malaria",
            hi: "क्योंकि कूलर का पानी पीने से मलेरिया होता है",
            mr: "कारण कूलरचे पाणी प्यायल्याने मलेरिया होतो",
          },
          {
            en: "Because wet lanes give people chills and fever",
            hi: "क्योंकि गीली गलियाँ लोगों को ठंड और बुख़ार देती हैं",
            mr: "कारण ओल्या गल्ल्या माणसांना थंडी-ताप देतात",
          },
          {
            en: "Because water attracts the fever germ from the air",
            hi: "क्योंकि पानी हवा से बुख़ार का कीटाणु खींचता है",
            mr: "कारण पाणी हवेतला तापाचा जंतू ओढते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Malaria travels person → mosquito → person, and every mosquito begins as a wriggler in still water. Medicines cure one patient; an emptied drum stops a hundred future biters at once. Fighting the breeding place instead of the bite is the cheapest medicine ever poured out of a cooler tray.",
          hi: "मलेरिया इंसान → मच्छर → इंसान चलता है, और हर मच्छर ठहरे पानी के कुलबुले से शुरू होता है। दवा एक मरीज़ को ठीक करती है; एक उलटा ड्रम आने वाले सौ काटने वालों को एक साथ रोक देता है। डंक की जगह पालने पर वार — कूलर की ट्रे से उलटी गई अब तक की सबसे सस्ती दवा है।",
          mr: "मलेरिया माणूस → डास → माणूस असा चालतो, आणि प्रत्येक डास साचलेल्या पाण्यातल्या वळवळ्यापासून सुरू होतो. औषध एका रुग्णाला बरे करते; ओतलेला एक ड्रम येणाऱ्या शंभर चावणाऱ्यांना एकदम थांबवतो. दंशाऐवजी पाळणाघरावर हल्ला — कूलरच्या ट्रेतून ओतलेले आजवरचे सर्वांत स्वस्त औषध.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Two children have fever. The doctor treats one for malaria only AFTER a blood test, though the fever looks the same in both. Why insist on the test?",
          hi: "दो बच्चों को बुख़ार है। डॉक्टर एक का मलेरिया-इलाज ख़ून की जाँच के बाद ही शुरू करते हैं, जबकि दोनों का बुख़ार एक-सा दिखता है। जाँच की ज़िद क्यों?",
          mr: "दोन मुलांना ताप आहे. डॉक्टर एकाचा मलेरिया-उपचार रक्त-तपासणीनंतरच सुरू करतात, वास्तविक दोघांचा ताप सारखाच दिसतो. तपासणीचा आग्रह का?",
        },
        choices: [
          {
            en: "Fevers look alike but come from different causes — the test shows WHICH germ it is, so the right medicine goes to the right illness",
            hi: "बुख़ार एक-से दिखते हैं पर कारण अलग-अलग होते हैं — जाँच बताती है कीटाणु कौन-सा है, ताकि सही दवा सही बीमारी तक जाए",
            mr: "ताप सारखे दिसतात पण कारणे वेगळी असतात — तपासणी सांगते जंतू कोणता, म्हणजे योग्य औषध योग्य आजाराकडे जाते",
          },
          {
            en: "Tests earn the clinic money",
            hi: "जाँचों से क्लिनिक की कमाई होती है",
            mr: "तपासण्यांतून दवाखान्याची कमाई होते",
          },
          {
            en: "Malaria medicine works better after a needle prick",
            hi: "सुई लगने के बाद मलेरिया की दवा बेहतर काम करती है",
            mr: "सुई टोचल्यावर मलेरियाचे औषध अधिक चांगले चालते",
          },
          {
            en: "The test itself cures mild malaria",
            hi: "जाँच ख़ुद हलका मलेरिया ठीक कर देती है",
            mr: "तपासणी स्वतःच सौम्य मलेरिया बरा करते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "A fever is a signal, not a name: typhoid, flu and malaria all light the same lamp. Malaria medicine does nothing for a virus, and wrong medicine wastes days while the real illness grows. One drop of blood under a lens replaces guessing with knowing — which is the whole difference between treating and hoping.",
          hi: "बुख़ार संकेत है, नाम नहीं: मियादी बुख़ार, फ़्लू और मलेरिया सब वही बत्ती जलाते हैं। मलेरिया की दवा वायरस पर कुछ नहीं करती, और ग़लत दवा वे दिन गँवा देती है जिनमें असली बीमारी बढ़ती है। शीशे तले ख़ून की एक बूँद अंदाज़े की जगह जानकारी रख देती है — इलाज और उम्मीद के बीच का पूरा फ़र्क़ यही है।",
          mr: "ताप हा इशारा आहे, नाव नव्हे: विषमज्वर, फ्लू आणि मलेरिया सारे तोच दिवा लावतात. मलेरियाचे औषध विषाणूवर काही करत नाही, आणि चुकीचे औषध खरा आजार वाढतो ते दिवस वाया घालवते. भिंगाखालचा रक्ताचा एक थेंब अंदाजाच्या जागी ज्ञान ठेवतो — उपचार आणि आशा यांतला सगळा फरक हाच.",
        },
      },
      {
        level: 5,
        stem: {
          en: "Match the defence to what it defeats: A-the net over the bed, B-the emptied drum, C-jaggery and green leaves. Which trio is right?",
          hi: "बचाव को उससे मिलाइए जिसे वह हराता है: अ-बिस्तर की मच्छरदानी, ब-उलटा ड्रम, स-गुड़ और हरी पत्तियाँ। कौन-सी तिकड़ी सही है?",
          mr: "बचाव तो कशाला हरवतो त्याच्याशी जुळवा: अ-पलंगावरची मच्छरदाणी, ब-ओतलेला ड्रम, क-गूळ आणि हिरवा पाला. कोणती त्रयी बरोबर?",
        },
        choices: [
          {
            en: "A: the night's bites · B: the breeding water · C: weak, iron-poor blood",
            hi: "अ: रात के डंक · ब: पलने का पानी · स: कमज़ोर, लोहा-हीन ख़ून",
            mr: "अ: रात्रीचे दंश · ब: पैदाशीचे पाणी · क: अशक्त, लोह-हीन रक्त",
          },
          {
            en: "A: weak blood · B: the night's bites · C: the breeding water",
            hi: "अ: कमज़ोर ख़ून · ब: रात के डंक · स: पलने का पानी",
            mr: "अ: अशक्त रक्त · ब: रात्रीचे दंश · क: पैदाशीचे पाणी",
          },
          {
            en: "A: the breeding water · B: weak blood · C: the night's bites",
            hi: "अ: पलने का पानी · ब: कमज़ोर ख़ून · स: रात के डंक",
            mr: "अ: पैदाशीचे पाणी · ब: अशक्त रक्त · क: रात्रीचे दंश",
          },
          {
            en: "A: the night's bites · B: weak blood · C: the breeding water",
            hi: "अ: रात के डंक · ब: कमज़ोर ख़ून · स: पलने का पानी",
            mr: "अ: रात्रीचे दंश · ब: अशक्त रक्त · क: पैदाशीचे पाणी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Each defence has its own front: the net blocks tonight's bite, the emptied drum cancels next week's mosquitoes, and iron-rich food rebuilds the blood the illness drained. Fighting malaria well means fighting on all three at once.",
          hi: "हर बचाव का अपना मोर्चा है: मच्छरदानी आज रात का डंक रोकती है, उलटा ड्रम अगले हफ़्ते के मच्छर रद्द करता है, और लोहे वाला भोजन वह ख़ून फिर गढ़ता है जो बीमारी ने निचोड़ा। मलेरिया से ठीक से लड़ना यानी तीनों मोर्चों पर एक साथ लड़ना।",
          mr: "प्रत्येक बचावाची स्वतःची आघाडी: मच्छरदाणी आजची रात्र वाचवते, ओतलेला ड्रम पुढच्या आठवड्याचे डास रद्द करतो, आणि लोहयुक्त अन्न आजाराने शोषलेले रक्त पुन्हा घडवते. मलेरियाशी नीट लढणे म्हणजे तिन्ही आघाड्यांवर एकदम लढणे.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 11 — Sunita in Space (weightless days, a borderless Earth)      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "evs-5-sunita-in-space",
    subject: "EVS",
    classLevel: 5,
    chapter: {
      en: "Chapter 11 — Sunita in Space",
      hi: "अध्याय 11 — अंतरिक्ष में सुनीता",
      mr: "प्रकरण 11 — अवकाशात सुनीता",
    },
    name: { en: "Sunita in Space", hi: "अंतरिक्ष में सुनीता", mr: "अवकाशात सुनीता" },
    summary: {
      en: "Sunita Williams' months without weight — floating meals, strapped-down sleep, hair that stands on end, and an Earth with no lines drawn on it.",
      hi: "सुनीता विलियम्स के भारहीन महीने — तैरता खाना, बाँधकर सोना, खड़े हो जाते बाल, और वह पृथ्वी जिस पर कोई रेखाएँ खिंची नहीं हैं।",
      mr: "सुनीता विल्यम्सचे वजनाविनाचे महिने — तरंगते जेवण, बांधून झोपणे, उभे राहणारे केस, आणि जिच्यावर कोणत्याही रेषा आखलेल्या नाहीत अशी पृथ्वी.",
    },
    position: 11,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "sunita",
        name: { en: "Sunita Williams", hi: "सुनीता विलियम्स", mr: "सुनीता विल्यम्स" },
        kind: "person",
        prompt: {
          en: "Which astronaut of Indian origin lived months aboard the space station, and answered schoolchildren's letters about life without weight?",
          hi: "भारतीय मूल की कौन-सी अंतरिक्ष-यात्री महीनों अंतरिक्ष स्टेशन पर रहीं, और भारहीन जीवन पर स्कूली बच्चों की चिट्ठियों के जवाब दिए?",
          mr: "भारतीय वंशाची कोणती अंतराळवीर महिनोंमहिने अवकाश स्थानकावर राहिली, आणि वजनाविनाच्या जगण्याबद्दल शाळकरी मुलांच्या पत्रांना उत्तरे दिली?",
        },
        statement: {
          en: "Sunita Williams, an astronaut of Indian origin, spent months on the space station and told schoolchildren what weightless life is like.",
          hi: "भारतीय मूल की अंतरिक्ष-यात्री सुनीता विलियम्स महीनों अंतरिक्ष स्टेशन पर रहीं और स्कूली बच्चों को बताया कि भारहीन जीवन कैसा होता है।",
          mr: "भारतीय वंशाची अंतराळवीर सुनीता विल्यम्स महिनोंमहिने अवकाश स्थानकावर राहिली आणि तिने शाळकरी मुलांना वजनाविनाचे जगणे कसे असते ते सांगितले.",
        },
        pair: {
          left: { en: "Sunita Williams", hi: "सुनीता विलियम्स", mr: "सुनीता विल्यम्स" },
          right: {
            en: "months without weight",
            hi: "भारहीनता के महीने",
            mr: "वजनाविनाचे महिने",
          },
        },
      },
      {
        id: "floating",
        name: {
          en: "Floating in the station",
          hi: "स्टेशन में तैरना",
          mr: "स्थानकात तरंगणे",
        },
        kind: "space-life",
        prompt: {
          en: "In the space station nobody walks — how does everyone move from room to room?",
          hi: "अंतरिक्ष स्टेशन में कोई चलता नहीं — सब कमरे-से-कमरे कैसे जाते हैं?",
          mr: "अवकाश स्थानकात कोणी चालत नाही — सारे खोलीतून खोलीत कसे जातात?",
        },
        statement: {
          en: "In the station everything and everyone floats — astronauts push gently off a wall and drift where they want to go.",
          hi: "स्टेशन में सब कुछ और सब लोग तैरते हैं — यात्री दीवार को हलके से धकेलते हैं और जहाँ जाना हो, बहते चले जाते हैं।",
          mr: "स्थानकात सगळे काही आणि सगळे जण तरंगतात — प्रवासी भिंतीला हलकेच ढकलतात आणि हवे तिथे तरंगत जातात.",
        },
        detail: {
          en: "A dropped pencil does not fall — it hangs where you let it go, or drifts away on the air.",
          hi: "छूटी पेंसिल गिरती नहीं — जहाँ छोड़ी वहीं टँगी रहती है, या हवा के साथ बह जाती है।",
          mr: "सुटलेली पेन्सिल पडत नाही — सोडली तिथेच टांगलेली राहते, किंवा हवेबरोबर वाहत जाते.",
        },
        extra: {
          en: "To stay at a desk, astronauts hook their feet under a rail.",
          hi: "मेज़ पर टिके रहने को यात्री पैर रेलिंग में फँसा लेते हैं।",
          mr: "टेबलाशी टिकून राहायला प्रवासी पाय कठड्यात अडकवतात.",
        },
        pair: {
          left: { en: "Moving in the station", hi: "स्टेशन में चलना-फिरना", mr: "स्थानकातली ये-जा" },
          right: {
            en: "a push, then a drift",
            hi: "एक धक्का, फिर बहाव",
            mr: "एक ढकल, मग तरंगणे",
          },
        },
      },
      {
        id: "drinking",
        name: {
          en: "Drinking water in space",
          hi: "अंतरिक्ष में पानी पीना",
          mr: "अवकाशात पाणी पिणे",
        },
        kind: "space-life",
        prompt: {
          en: "Why does no astronaut pour water into a glass — what does spilled water do up there?",
          hi: "कोई यात्री गिलास में पानी क्यों नहीं उँडेलता — वहाँ छलका पानी क्या करता है?",
          mr: "कोणी प्रवासी ग्लासात पाणी का ओतत नाही — तिथे सांडलेले पाणी काय करते?",
        },
        statement: {
          en: "Poured water will not stay in a glass up there — it gathers into floating blobs, so astronauts sip through straws from closed packets.",
          hi: "वहाँ उँडेला पानी गिलास में नहीं ठहरता — तैरती बूँद-गोलियों में सिमट जाता है, इसलिए यात्री बंद थैलियों से नली लगाकर पीते हैं।",
          mr: "तिथे ओतलेले पाणी ग्लासात राहत नाही — तरंगत्या थेंब-गोळ्यांत जमते, म्हणून प्रवासी बंद पिशव्यांतून नळीने पितात.",
        },
        pair: {
          left: { en: "Water in space", hi: "अंतरिक्ष का पानी", mr: "अवकाशातले पाणी" },
          right: { en: "floating round blobs", hi: "तैरती गोल बूँदें", mr: "तरंगते गोल थेंब" },
        },
      },
      {
        id: "sleeping",
        name: {
          en: "Sleeping strapped in",
          hi: "बाँधकर सोना",
          mr: "बांधून झोपणे",
        },
        kind: "space-life",
        prompt: {
          en: "Why do astronauts zip into sleeping bags fixed to the wall before closing their eyes?",
          hi: "आँखें मूँदने से पहले यात्री दीवार से बँधे सोने के थैलों में क्यों घुस जाते हैं?",
          mr: "डोळे मिटण्याआधी प्रवासी भिंतीला बांधलेल्या झोपण्याच्या पिशव्यांत का शिरतात?",
        },
        statement: {
          en: "Asleep and unstrapped, a floating astronaut would drift and bump around the cabin — so beds are bags tied to the wall.",
          hi: "बिना बाँधे सोया यात्री तैरता-टकराता केबिन भर भटकता — इसलिए बिस्तर दीवार से बँधे थैले हैं।",
          mr: "न बांधता झोपलेला प्रवासी तरंगत-आदळत केबिनभर भटकला असता — म्हणून बिछाने म्हणजे भिंतीला बांधलेल्या पिशव्या.",
        },
      },
      {
        id: "hair",
        name: {
          en: "Hair that stands on end",
          hi: "खड़े हो जाते बाल",
          mr: "उभे राहणारे केस",
        },
        kind: "space-life",
        prompt: {
          en: "In Sunita's space photos, what does her hair do that no comb on Earth allows?",
          hi: "सुनीता की अंतरिक्ष-तस्वीरों में उनके बाल वह क्या करते हैं जो धरती की कोई कंघी नहीं होने देती?",
          mr: "सुनीताच्या अवकाश-फोटोंत तिचे केस असे काय करतात जे पृथ्वीवरची कोणतीही फणी होऊ देत नाही?",
        },
        statement: {
          en: "With no weight to pull it down, hair floats out around the head — Sunita's photos show it standing free in every direction.",
          hi: "नीचे खींचने वाला भार नहीं, तो बाल सिर के चारों ओर तैरते हैं — सुनीता की तस्वीरों में वे हर दिशा में आज़ाद खड़े दिखते हैं।",
          mr: "खाली ओढणारे वजनच नाही, म्हणून केस डोक्याभोवती तरंगतात — सुनीताच्या फोटोंत ते प्रत्येक दिशेला मोकळे उभे दिसतात.",
        },
      },
      {
        id: "earthview",
        name: {
          en: "The Earth from space",
          hi: "अंतरिक्ष से पृथ्वी",
          mr: "अवकाशातून पृथ्वी",
        },
        kind: "space-sight",
        prompt: {
          en: "Looking down from the station, what does Sunita see where the maps at school draw their thick borders?",
          hi: "स्टेशन से नीचे देखते हुए, जहाँ स्कूल के नक़्शे मोटी सीमाएँ खींचते हैं, वहाँ सुनीता को क्या दिखता है?",
          mr: "स्थानकातून खाली पाहताना, शाळेचे नकाशे जिथे जाड सीमा आखतात, तिथे सुनीताला काय दिसते?",
        },
        statement: {
          en: "From space the Earth is one blue, cloud-wrapped whole — the borders so dark on maps are simply not there.",
          hi: "अंतरिक्ष से पृथ्वी एक नीला, बादलों में लिपटा पूरा है — नक़्शों पर गहरी दिखतीं सीमाएँ वहाँ हैं ही नहीं।",
          mr: "अवकाशातून पृथ्वी म्हणजे एक निळे, ढगांत गुंडाळलेले अखंड — नकाशांवर गडद दिसणाऱ्या सीमा तिथे नाहीतच.",
        },
        detail: {
          en: "Rivers, mountains and the sea show clearly; the lines between countries do not.",
          hi: "नदियाँ, पहाड़ और समुद्र साफ़ दिखते हैं; देशों के बीच की रेखाएँ नहीं।",
          mr: "नद्या, पर्वत आणि समुद्र स्पष्ट दिसतात; देशांमधल्या रेषा नाहीत.",
        },
        extra: {
          en: "Day and night chase each other round it sixteen times in the station's single day.",
          hi: "स्टेशन के एक दिन में दिन और रात उसके गिर्द सोलह बार एक-दूसरे का पीछा करते हैं।",
          mr: "स्थानकाच्या एका दिवसात दिवस आणि रात्र तिच्याभोवती सोळा वेळा एकमेकांचा पाठलाग करतात.",
        },
        pair: {
          left: { en: "The Earth from space", hi: "अंतरिक्ष से पृथ्वी", mr: "अवकाशातून पृथ्वी" },
          right: {
            en: "blue, whole, unlined",
            hi: "नीली, पूरी, बे-रेखा",
            mr: "निळी, अखंड, बिनरेषांची",
          },
        },
      },
      {
        id: "return",
        name: {
          en: "Coming back to Earth",
          hi: "धरती पर वापसी",
          mr: "पृथ्वीवर परतणे",
        },
        kind: "space-life",
        prompt: {
          en: "After months of floating, what suddenly feels heavy on landing — even a spoon, even one's own arms?",
          hi: "महीनों तैरने के बाद उतरते ही अचानक क्या भारी लगता है — चम्मच तक, अपनी बाँहें तक?",
          mr: "महिनोंमहिने तरंगल्यावर उतरताच अचानक काय जड वाटते — चमचासुद्धा, स्वतःचे हातसुद्धा?",
        },
        statement: {
          en: "Back on Earth after months without weight, everything feels heavy at first — arms, spoons, one's own head — until the body relearns its old load.",
          hi: "भारहीन महीनों के बाद धरती पर पहले-पहल सब भारी लगता है — बाँहें, चम्मच, अपना ही सिर — जब तक शरीर अपना पुराना बोझ फिर न सीख ले।",
          mr: "वजनाविनाच्या महिन्यांनंतर पृथ्वीवर सुरुवातीला सारे जड वाटते — हात, चमचे, स्वतःचेच डोके — शरीर आपले जुने ओझे पुन्हा शिकेपर्यंत.",
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sort these into HAPPENS IN THE STATION and HAPPENS ONLY ON EARTH: hair floating out around the head, tea pouring neatly into a glass, sleeping zipped to the wall, a dropped spoon falling to the floor. Which sorting is right?",
          hi: "इन्हें स्टेशन में होता है और केवल धरती पर होता है में छाँटिए: सिर के गिर्द तैरते बाल, गिलास में सफ़ाई से उँडेलती चाय, दीवार से बँधकर सोना, गिरा चम्मच फ़र्श पर पहुँचना। कौन-सी छँटाई सही है?",
          mr: "यांची स्थानकात घडते आणि फक्त पृथ्वीवर घडते अशी वर्गवारी करा: डोक्याभोवती तरंगणारे केस, ग्लासात नीट ओतला जाणारा चहा, भिंतीला बांधून झोपणे, पडलेला चमचा फरशीवर पोहोचणे. कोणती वर्गवारी बरोबर?",
        },
        choices: [
          {
            en: "Station: floating hair, wall-strapped sleep · Earth only: pouring tea, the falling spoon",
            hi: "स्टेशन: तैरते बाल, दीवार से बँधी नींद · केवल धरती: उँडेलती चाय, गिरता चम्मच",
            mr: "स्थानक: तरंगते केस, भिंतीला बांधलेली झोप · फक्त पृथ्वी: ओतला जाणारा चहा, पडणारा चमचा",
          },
          {
            en: "Station: pouring tea, floating hair · Earth only: wall-strapped sleep, the falling spoon",
            hi: "स्टेशन: उँडेलती चाय, तैरते बाल · केवल धरती: बँधी नींद, गिरता चम्मच",
            mr: "स्थानक: ओतला जाणारा चहा, तरंगते केस · फक्त पृथ्वी: बांधलेली झोप, पडणारा चमचा",
          },
          {
            en: "Station: the falling spoon, wall-strapped sleep · Earth only: floating hair, pouring tea",
            hi: "स्टेशन: गिरता चम्मच, बँधी नींद · केवल धरती: तैरते बाल, उँडेलती चाय",
            mr: "स्थानक: पडणारा चमचा, बांधलेली झोप · फक्त पृथ्वी: तरंगते केस, ओतला जाणारा चहा",
          },
          {
            en: "Station: pouring tea, the falling spoon · Earth only: floating hair, wall-strapped sleep",
            hi: "स्टेशन: उँडेलती चाय, गिरता चम्मच · केवल धरती: तैरते बाल, बँधी नींद",
            mr: "स्थानक: ओतला जाणारा चहा, पडणारा चमचा · फक्त पृथ्वी: तरंगते केस, बांधलेली झोप",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Pouring and falling both need a 'down' for things to head toward — they are Earth's specialities. Floating hair and strapped sleep are what life looks like when that 'down' is missing. Sort by one question: does this happening need something to pull it downward?",
          hi: "उँडेलना और गिरना दोनों को एक 'नीचे' चाहिए जिसकी ओर चीज़ें जाएँ — ये धरती की ख़ासियतें हैं। तैरते बाल और बँधी नींद वह जीवन है जब यह 'नीचे' ग़ायब हो। एक ही सवाल से छाँटिए: क्या इस घटना को कोई नीचे खींचने वाला चाहिए?",
          mr: "ओतणे आणि पडणे दोन्हींना वस्तूंनी जावे असे एक 'खाली' लागते — या पृथ्वीच्या खासियती. तरंगते केस आणि बांधलेली झोप म्हणजे ते 'खाली' नसतानाचे जगणे. एकाच प्रश्नाने वर्गवारी करा: या घडण्याला खाली ओढणारे काही लागते का?",
        },
      },
      {
        level: 6,
        stem: {
          en: "On Earth, tea pours; in the station, it balls up and floats. What single missing thing explains the floating hair, the strapped sleep AND the undrinkable glass?",
          hi: "धरती पर चाय उँडेलती है; स्टेशन में वह गोली बनकर तैरती है। कौन-सी एक ग़ैर-हाज़िर चीज़ तैरते बाल, बँधी नींद और बेकार गिलास — तीनों को समझा देती है?",
          mr: "पृथ्वीवर चहा ओतला जातो; स्थानकात तो गोळा होऊन तरंगतो. कोणती एक गैरहजर गोष्ट तरंगते केस, बांधलेली झोप आणि निरुपयोगी ग्लास — तिन्ही समजावते?",
        },
        choices: [
          {
            en: "The pull toward the Earth that everything down here feels — with nothing pulling 'down', there is no falling, no pouring, no staying put",
            hi: "पृथ्वी की ओर का वह खिंचाव जो यहाँ नीचे हर चीज़ महसूस करती है — जब कुछ 'नीचे' न खींचे, तो न गिरना है, न उँडेलना, न टिके रहना",
            mr: "पृथ्वीकडचा तो ओढा जो इथे खाली प्रत्येक गोष्ट अनुभवते — काहीच 'खाली' ओढत नसेल, तर पडणे नाही, ओतणे नाही, जागी राहणेही नाही",
          },
          {
            en: "Air — space stations have none inside",
            hi: "हवा — स्टेशनों के भीतर होती ही नहीं",
            mr: "हवा — स्थानकांच्या आत नसतेच",
          },
          {
            en: "Heat — everything freezes light in the cold",
            hi: "गर्मी — ठंड में सब चीज़ें हलकी जम जाती हैं",
            mr: "उष्णता — थंडीत साऱ्या गोष्टी हलक्या गोठतात",
          },
          {
            en: "Electricity — floating starts when the lights dim",
            hi: "बिजली — बत्तियाँ धीमी होते ही तैरना शुरू होता है",
            mr: "वीज — दिवे मंदावताच तरंगणे सुरू होते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Every odd thing in Sunita's letters is one fact wearing costumes: nothing pulls toward a 'down'. Hair is not held flat, so it stands; a sleeper is not held to a bed, so she is strapped; tea is not led into the glass's bottom, so it balls up on its own. The station has air, warmth and light — what it lacks is the quiet pull we never notice until it is gone.",
          hi: "सुनीता की चिट्ठियों की हर अनोखी बात एक ही तथ्य के अलग-अलग वेश हैं: कुछ भी किसी 'नीचे' की ओर नहीं खींचता। बालों को कोई बिठाता नहीं, तो वे खड़े हैं; सोने वाली को बिस्तर से कोई थामता नहीं, तो वह बँधी है; चाय को गिलास की तली तक कोई ले नहीं जाता, तो वह अपने आप गोली बन जाती है। स्टेशन में हवा है, गर्मी है, रोशनी है — नहीं है तो वह चुपचाप खिंचाव, जिसे हम तब तक नहीं देखते जब तक वह चला न जाए।",
          mr: "सुनीताच्या पत्रांतली प्रत्येक अजब गोष्ट म्हणजे एकाच तथ्याची निरनिराळी सोंगे: काहीही कोणत्या 'खाली'कडे ओढत नाही. केसांना कोणी बसवत नाही, म्हणून ते उभे; झोपणारीला बिछान्याशी कोणी धरत नाही, म्हणून ती बांधलेली; चहाला ग्लासाच्या तळाकडे कोणी नेत नाही, म्हणून तो आपोआप गोळा होतो. स्थानकात हवा, ऊब, उजेड आहे — नाही तो शांत ओढा, जो गेल्याशिवाय आपल्याला दिसतच नाही.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Sunita said the hardest thing to explain was this: from up there, the Earth has no lines on it. What thought was she handing the schoolchildren?",
          hi: "सुनीता ने कहा कि सबसे कठिन बात यह समझाना थी: वहाँ ऊपर से पृथ्वी पर कोई रेखाएँ नहीं हैं। वे बच्चों को कौन-सा विचार थमा रही थीं?",
          mr: "सुनीता म्हणाली की सर्वांत अवघड हे समजावणे होते: तिथून वरून पृथ्वीवर कोणत्याही रेषा नाहीत. ती मुलांना कोणता विचार देत होती?",
        },
        choices: [
          {
            en: "Borders are human drawings, not features of the Earth — seen whole, the planet is one shared home",
            hi: "सीमाएँ इंसान की खींची लकीरें हैं, पृथ्वी की बनावट नहीं — पूरा देखने पर ग्रह एक साझा घर है",
            mr: "सीमा या माणसांनी काढलेल्या रेघा आहेत, पृथ्वीची घडण नव्हे — अख्खी पाहिली की हा ग्रह एक सामायिक घर आहे",
          },
          {
            en: "Maps at school are printed wrongly",
            hi: "स्कूल के नक़्शे ग़लत छपे हैं",
            mr: "शाळेचे नकाशे चुकीचे छापले आहेत",
          },
          {
            en: "The station flies too high to see anything true",
            hi: "स्टेशन इतना ऊँचा है कि सच कुछ दिखता ही नहीं",
            mr: "स्थानक इतके उंच आहे की खरे काही दिसतच नाही",
          },
          {
            en: "Clouds hide the borders that are really there",
            hi: "बादल असल में मौजूद सीमाओं को ढक लेते हैं",
            mr: "ढग खरोखर असलेल्या सीमा झाकतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Rivers, mountains, monsoon clouds — the Earth's real features show clearly from orbit. What never shows is what was never there: the lines are ink on our maps and fences in our minds. Sunita's sentence turns the geography lesson gently inside out — the divisions we treat as facts of the world are choices of ours, and from far enough away, the world is visibly one.",
          hi: "नदियाँ, पहाड़, मानसून के बादल — पृथ्वी की असली बनावट कक्षा से साफ़ दिखती है। नहीं दिखता वह, जो था ही नहीं: रेखाएँ हमारे नक़्शों की स्याही और हमारे मनों की बाड़ें हैं। सुनीता का वाक्य भूगोल के पाठ को धीरे-से उलट देता है — जिन बँटवारों को हम दुनिया के तथ्य मानते हैं, वे हमारे चुनाव हैं, और काफ़ी दूर से दुनिया साफ़-साफ़ एक है।",
          mr: "नद्या, पर्वत, पावसाळी ढग — पृथ्वीची खरी घडण कक्षेतून स्पष्ट दिसते. दिसत नाही ते, जे नव्हतेच: रेषा ही आपल्या नकाशांची शाई आणि आपल्या मनांतली कुंपणे आहेत. सुनीताचे वाक्य भूगोलाचा धडा हळुवार उलटा करते — ज्या वाटण्यांना आपण जगाची तथ्ये मानतो, त्या आपल्या निवडी आहेत, आणि पुरेशा दुरून जग स्पष्टपणे एक आहे.",
        },
      },
    ],
  },
];
