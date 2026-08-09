/**
 * Class 11 Biology — NCERT, chapter by chapter, and the first Class 11 family
 * that is mostly conceptual on purpose.
 *
 * Physics and chemistry needed `withNumeric` on every chapter because their
 * ideas and their sums are the same material. Biology is not built that way.
 * Taxonomy has no arithmetic in it that is not invented, and a ploidy question
 * bolted onto a chapter about the definition of a species would be a fiction of
 * this file rather than a fact of the subject. So `G11_BIOLOGY_NUMERIC` carries
 * entries only where the counting is real — ploidy across a life cycle, for a
 * start — and stays empty everywhere else. An empty entry is a claim, not an
 * omission: it says this chapter is not measured by calculation.
 *
 * Entity names avoid the Class 9–10 biology vocabulary already in the bank
 * ("Meristematic tissue", "Photosynthesis in autotrophs", "Reproduction in a
 * flower"). Class 11 is not those chapters restated: it asks what a species IS
 * when you have to decide whether two populations are one, why a kingdom of
 * plants had to be broken up, why a fern needs standing water to reproduce
 * while a pine does not, and why a body cavity is a better classifier than a
 * shape anyone can see.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";
import type { NumQ } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Biology (Class 11)";
const LICENCE = "CC-BY-SA-4.0";

export const G11_BIOLOGY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — The Living World                                            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-11-the-living-world",
    subject: "BIOLOGY",
    classLevel: 11,
    chapter: {
      en: "Chapter 1 — The Living World",
      hi: "अध्याय 1 — जीव जगत",
      mr: "प्रकरण 1 — सजीव सृष्टी",
    },
    name: {
      en: "The Living World",
      hi: "जीव जगत",
      mr: "सजीव सृष्टी",
    },
    summary: {
      en: "Before biology can study life it has to say what counts as alive and what counts as one kind, and neither answer is as easy as it looks: growth and movement fail as tests, reproduction fails for a mule, the only property nothing non-living has is self-repair driven from within, and the name a species carries has to work in every language and every century at once.",
      hi: "जीवविज्ञान जीवन का अध्ययन कर सके उससे पहले उसे बताना पड़ता है कि जीवित क्या गिना जाए और एक प्रकार क्या, और दोनों उत्तर उतने आसान नहीं जितने दिखते हैं: वृद्धि और गति परीक्षण के रूप में विफल हैं, जनन ख़च्चर के लिए विफल है, वह इकलौता गुण जो किसी निर्जीव में नहीं वह भीतर से चलाई गई आत्म-मरम्मत है, और जाति जो नाम ढोती है उसे हर भाषा और हर सदी में एक साथ काम करना पड़ता है।",
      mr: "जीवशास्त्र जीवनाचा अभ्यास करू शकेल त्याआधी त्याला सांगावे लागते की सजीव काय मोजायचे आणि एक प्रकार काय, आणि दोन्ही उत्तरे दिसतात तितकी सोपी नाहीत: वाढ आणि हालचाल चाचणी म्हणून अपयशी, प्रजनन खेचरासाठी अपयशी, कोणत्याही निर्जीवात नसलेला एकमेव गुणधर्म म्हणजे आतून चालवली जाणारी स्व-दुरुस्ती, आणि जात जे नाव वाहते त्याला प्रत्येक भाषेत आणि प्रत्येक शतकात एकाच वेळी काम करावे लागते.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "self-replication-as-the-defining-property",
        name: {
          en: "The property nothing non-living has",
          hi: "वह गुण जो किसी निर्जीव में नहीं",
          mr: "कोणत्याही निर्जीवात नसलेला गुणधर्म",
        },
        kind: "definition",
        prompt: {
          en: "A crystal grows, a river moves, a fire consumes and gives out heat, and a machine responds to a switch — yet none of them repairs itself from instructions it carries. Which defining property is this?",
          hi: "क्रिस्टल बढ़ता है, नदी चलती है, आग खाती है और ऊष्मा देती है, और मशीन स्विच का उत्तर देती है — फिर भी उनमें से कोई अपने भीतर ढोए निर्देशों से स्वयं की मरम्मत नहीं करता। यह कौन-सा परिभाषक गुण है?",
          mr: "स्फटिक वाढतो, नदी चालते, आग खाते आणि उष्णता देते, आणि यंत्र बटणाला उत्तर देते — तरीही त्यांच्यापैकी कोणीही आत वाहून नेलेल्या सूचनांवरून स्वतःची दुरुस्ती करत नाही. हा कोणता परिभाषक गुणधर्म?",
        },
        statement: {
          en: "The defining property of life is self-replication with self-repair directed from within: an organism carries the instructions for rebuilding itself and uses them continuously, which is why metabolism and cellular organisation are treated as the two defects-free tests.",
          hi: "जीवन का परिभाषक गुण भीतर से निर्देशित आत्म-मरम्मत सहित आत्म-प्रतिकृति है: जीव अपने पुनर्निर्माण के निर्देश ढोता है और उन्हें लगातार काम में लेता है, इसीलिए उपापचय और कोशिकीय संगठन को दो निर्दोष परीक्षण माना जाता है।",
          mr: "जीवनाचा परिभाषक गुणधर्म म्हणजे आतून निर्देशित स्व-दुरुस्तीसह स्व-प्रतिकृती: सजीव स्वतःच्या पुनर्बांधणीच्या सूचना वाहतो आणि त्या सतत वापरतो, म्हणूनच चयापचय आणि पेशीय संघटन ही दोन निर्दोष चाचण्या मानली जातात.",
        },
        detail: {
          en: "Growth is not the test, because a mountain of sand grows by addition from outside while an organism grows from inside by making more of itself.",
          hi: "वृद्धि परीक्षण नहीं है, क्योंकि रेत का ढेर बाहर से जुड़कर बढ़ता है जबकि जीव भीतर से अपने आप को और बनाकर बढ़ता है।",
          mr: "वाढ ही चाचणी नाही, कारण वाळूचा ढीग बाहेरून जोडून वाढतो तर सजीव आतून स्वतःला अधिक बनवून वाढतो.",
        },
        extra: {
          en: "A virus is the hard case: it carries instructions but has no metabolism of its own, so it is alive only inside a host cell and inert outside one.",
          hi: "विषाणु कठिन मामला है: वह निर्देश ढोता है पर उसका अपना उपापचय नहीं, अतः वह केवल परपोषी कोशिका के भीतर जीवित है और बाहर निष्क्रिय।",
          mr: "विषाणू हे कठीण प्रकरण: तो सूचना वाहतो पण त्याचे स्वतःचे चयापचय नाही, म्हणून तो केवळ यजमान पेशीच्या आत सजीव आणि बाहेर निष्क्रिय.",
        },
        pair: {
          left: {
            en: "A crystal grows and is still not alive",
            hi: "क्रिस्टल बढ़ता है और फिर भी जीवित नहीं",
            mr: "स्फटिक वाढतो आणि तरीही सजीव नाही",
          },
          right: {
            en: "the property nothing non-living has",
            hi: "वह गुण जो किसी निर्जीव में नहीं",
            mr: "कोणत्याही निर्जीवात नसलेला गुणधर्म",
          },
        },
      },
      {
        id: "why-reproduction-cannot-be-the-test",
        name: {
          en: "The test a mule fails",
          hi: "वह परीक्षण जिसमें ख़च्चर विफल है",
          mr: "खेचर नापास होणारी चाचणी",
        },
        kind: "contrast",
        prompt: {
          en: "A sterile hybrid, a worker bee and a person past childbearing are all unarguably alive, so one popular criterion has to be demoted from definition to common feature. Which one?",
          hi: "बंध्य संकर, श्रमिक मधुमक्खी और संतानोत्पत्ति की आयु पार कर चुका व्यक्ति सब निर्विवाद रूप से जीवित हैं, अतः एक लोकप्रिय कसौटी को परिभाषा से घटाकर सामान्य लक्षण करना पड़ता है। कौन-सी?",
          mr: "वंध्य संकर, कामकरी मधमाशी आणि प्रजननवय ओलांडलेली व्यक्ती सर्व निर्विवादपणे सजीव, म्हणून एका लोकप्रिय कसोटीला व्याख्येवरून घटवून सामान्य लक्षण करावे लागते. कोणती?",
        },
        statement: {
          en: "Reproduction cannot be the defining property of life, because many living things never reproduce, so it is a characteristic of living kinds rather than of living individuals.",
          hi: "जनन जीवन का परिभाषक गुण नहीं हो सकता, क्योंकि बहुत-से जीव कभी जनन नहीं करते, अतः वह जीवित व्यष्टियों का नहीं बल्कि जीवित प्रकारों का लक्षण है।",
          mr: "प्रजनन हा जीवनाचा परिभाषक गुणधर्म असू शकत नाही, कारण अनेक सजीव कधीच प्रजनन करत नाहीत, म्हणून ते सजीव व्यक्तींचे नव्हे तर सजीव प्रकारांचे लक्षण आहे.",
        },
        detail: {
          en: "The distinction is between a property every individual must have and a property the lineage must have, and only the first can serve as a definition.",
          hi: "भेद उस गुण में है जो हर व्यष्टि में होना चाहिए और उस गुण में जो वंशक्रम में होना चाहिए, और परिभाषा का काम केवल पहला कर सकता है।",
          mr: "फरक असा की एक गुणधर्म प्रत्येक व्यक्तीत असावा लागतो आणि दुसरा वंशावळीत असावा लागतो, आणि व्याख्येचे काम केवळ पहिलाच करू शकतो.",
        },
        extra: {
          en: "The same demotion applies to movement, response and growth: each is common among living things and each is matched by something non-living that also does it.",
          hi: "वही अवनति गति, अनुक्रिया और वृद्धि पर लागू है: हर एक जीवों में आम है और हर एक की बराबरी कोई निर्जीव भी कर देता है।",
          mr: "तीच घट हालचाल, प्रतिसाद आणि वाढ यांना लागू: प्रत्येक सजीवांत सामान्य आणि प्रत्येकाची बरोबरी करणारे काहीतरी निर्जीवही आहे.",
        },
        pair: {
          left: {
            en: "A worker bee that never breeds",
            hi: "श्रमिक मधुमक्खी जो कभी प्रजनन नहीं करती",
            mr: "कधीच प्रजनन न करणारी कामकरी मधमाशी",
          },
          right: {
            en: "the test a mule fails",
            hi: "वह परीक्षण जिसमें ख़च्चर विफल है",
            mr: "खेचर नापास होणारी चाचणी",
          },
        },
      },
      {
        id: "the-species-as-a-breeding-population",
        name: {
          en: "The unit that must be decided, not seen",
          hi: "वह इकाई जो दिखती नहीं, तय करनी पड़ती है",
          mr: "जी दिसत नाही, ठरवावी लागते ती एकक",
        },
        kind: "definition",
        prompt: {
          en: "A great dane and a chihuahua look nothing alike and are one kind; a leopard and a jaguar look nearly identical and are two, and the deciding question is whether the offspring would be fertile. Which unit is this?",
          hi: "ग्रेट डेन और चिहुआहुआ बिलकुल एक जैसे नहीं दिखते और एक प्रकार हैं; तेंदुआ और जैगुआर लगभग एक जैसे दिखते हैं और दो हैं, और निर्णायक प्रश्न यह है कि संतान उर्वर होगी या नहीं। यह कौन-सी इकाई है?",
          mr: "ग्रेट डेन आणि चिवावा अजिबात सारखे दिसत नाहीत आणि एक प्रकार आहेत; बिबट्या आणि जग्वार जवळपास सारखे दिसतात आणि दोन आहेत, आणि निर्णायक प्रश्न असा की संतती सुफल असेल का. ही कोणती एकक?",
        },
        statement: {
          en: "A species is a group of populations whose members can interbreed and produce fertile offspring, so the boundary is drawn by gene flow rather than by appearance.",
          hi: "जाति उन समष्टियों का समूह है जिनके सदस्य आपस में प्रजनन कर उर्वर संतान दे सकें, अतः सीमा रूप से नहीं, जीन-प्रवाह से खींची जाती है।",
          mr: "जात म्हणजे अशा लोकसंख्यांचा गट ज्यांचे सदस्य परस्पर प्रजनन करून सुफल संतती देऊ शकतात, म्हणून सीमा दिसण्याने नव्हे, जनुक-प्रवाहाने आखली जाते.",
        },
        detail: {
          en: "The definition is unusable for anything that does not breed sexually, so bacteria and fossils are assigned to species by other criteria altogether.",
          hi: "जो लैंगिक प्रजनन न करे उसके लिए यह परिभाषा अप्रयोज्य है, अतः जीवाणुओं और जीवाश्मों को जाति में डालने की कसौटियाँ बिलकुल दूसरी हैं।",
          mr: "जे लैंगिक प्रजनन करत नाही त्याच्यासाठी ही व्याख्या निरुपयोगी, म्हणून जीवाणू आणि जीवाश्म यांना जातीत टाकण्याच्या कसोट्या पूर्णपणे वेगळ्या.",
        },
        extra: {
          en: "A lion and a tiger can produce a liger, but the liger is sterile, so the two remain separate species and the test has been applied rather than skipped.",
          hi: "सिंह और बाघ लाइगर दे सकते हैं, पर लाइगर बंध्य है, अतः दोनों अलग जातियाँ रहती हैं और परीक्षण छोड़ा नहीं, लगाया गया है।",
          mr: "सिंह आणि वाघ लायगर देऊ शकतात, पण लायगर वंध्य आहे, म्हणून दोघे वेगळ्या जाती राहतात आणि चाचणी वगळली नाही, लावली गेली आहे.",
        },
        pair: {
          left: {
            en: "Two cats that look alike and cannot breed",
            hi: "दो बिल्लियाँ जो एक जैसी दिखती हैं और प्रजनन नहीं कर सकतीं",
            mr: "सारख्या दिसणाऱ्या आणि प्रजनन करू न शकणाऱ्या दोन मांजरी",
          },
          right: {
            en: "the unit that must be decided, not seen",
            hi: "वह इकाई जो दिखती नहीं, तय करनी पड़ती है",
            mr: "जी दिसत नाही, ठरवावी लागते ती एकक",
          },
        },
      },
      {
        id: "the-ranked-hierarchy-of-categories",
        name: {
          en: "Boxes inside boxes, each one a claim",
          hi: "डिब्बों के भीतर डिब्बे, हर एक एक दावा",
          mr: "पेट्यांमधल्या पेट्या, प्रत्येक एक दावा",
        },
        kind: "structure",
        prompt: {
          en: "Placing a tiger in Panthera commits you to saying it is more closely related to a lion than to a wolf, and placing it in Carnivora commits you to less. Which arrangement is this?",
          hi: "बाघ को पैंथेरा में रखना तुम्हें यह कहने को बाध्य करता है कि वह भेड़िये से अधिक सिंह के निकट है, और उसे कार्निवोरा में रखना कम को बाध्य करता है। यह कौन-सी व्यवस्था है?",
          mr: "वाघाला पँथेरात ठेवणे तुम्हाला हे म्हणायला बांधते की तो लांडग्याहून सिंहाच्या अधिक जवळ आहे, आणि त्याला कार्निव्होरात ठेवणे कमी बांधते. ही कोणती मांडणी?",
        },
        statement: {
          en: "Classification is a ranked hierarchy — species, genus, family, order, class, phylum, kingdom — in which each higher category is broader and each membership is a testable claim about shared ancestry.",
          hi: "वर्गीकरण एक श्रेणीबद्ध पदानुक्रम है — जाति, वंश, कुल, गण, वर्ग, संघ, जगत — जिसमें हर ऊपरी कोटि अधिक व्यापक है और हर सदस्यता साझा पूर्वजता का परखा जा सकने वाला दावा।",
          mr: "वर्गीकरण ही श्रेणीबद्ध उतरंड आहे — जात, प्रजाती, कुल, गण, वर्ग, संघ, सृष्टी — जिच्यात प्रत्येक वरची कोटी अधिक व्यापक आणि प्रत्येक सदस्यत्व सामायिक पूर्वजतेचा तपासता येणारा दावा.",
        },
        detail: {
          en: "The higher the category, the fewer the characters its members share and the more the members number, so breadth and detail move in opposite directions.",
          hi: "कोटि जितनी ऊँची, उसके सदस्य उतने कम लक्षण साझा करते हैं और उतने अधिक होते हैं, अतः व्यापकता और विवरण उलटी दिशाओं में चलते हैं।",
          mr: "कोटी जितकी वरची, तिचे सदस्य तितकी कमी लक्षणे वाटून घेतात आणि तितके अधिक असतात, म्हणून व्याप्ती आणि तपशील उलट्या दिशांनी चालतात.",
        },
        extra: {
          en: "Only the species is found in nature; every rank above it is a decision by taxonomists, which is why families are merged and split as evidence changes and species boundaries are argued about instead.",
          hi: "प्रकृति में केवल जाति मिलती है; उसके ऊपर की हर कोटि वर्गिकीविदों का निर्णय है, इसीलिए प्रमाण बदलने पर कुल जोड़े और तोड़े जाते हैं और जाति की सीमाओं पर इसके बजाय बहस होती है।",
          mr: "निसर्गात केवळ जातच सापडते; तिच्यावरची प्रत्येक कोटी वर्गीकरणशास्त्रज्ञांचा निर्णय, म्हणूनच पुरावा बदलताच कुले जोडली आणि फोडली जातात आणि जातीच्या सीमांवर त्याऐवजी वाद होतो.",
        },
        pair: {
          left: {
            en: "Nearer in the box, nearer in ancestry",
            hi: "डिब्बे में जितना पास, पूर्वजता में उतना पास",
            mr: "पेटीत जितके जवळ, पूर्वजतेत तितके जवळ",
          },
          right: {
            en: "boxes inside boxes, each one a claim",
            hi: "डिब्बों के भीतर डिब्बे, हर एक एक दावा",
            mr: "पेट्यांमधल्या पेट्या, प्रत्येक एक दावा",
          },
        },
      },
      {
        id: "two-word-naming-and-its-rules",
        name: {
          en: "A name built to outlive its language",
          hi: "अपनी भाषा से अधिक जीने को बना नाम",
          mr: "आपल्या भाषेहून अधिक जगण्यासाठी बनवलेले नाव",
        },
        kind: "convention",
        prompt: {
          en: "The same bird is a koel in Delhi, a kokila in a Sanskrit verse and a cuckoo in London, and none of those names tells a reader in Tokyo which bird is meant. Which convention solves that?",
          hi: "वही पक्षी दिल्ली में कोयल है, संस्कृत श्लोक में कोकिल और लंदन में कक्कू, और उनमें से कोई नाम टोक्यो के पाठक को नहीं बताता कि कौन-सा पक्षी है। कौन-सी परिपाटी यह हल करती है?",
          mr: "तोच पक्षी दिल्लीत कोयल, संस्कृत श्लोकात कोकिळ आणि लंडनमध्ये कुक्कू, आणि त्यांतले कोणतेही नाव टोकियोतल्या वाचकाला सांगत नाही की कोणता पक्षी अभिप्रेत आहे. कोणती प्रथा हे सोडवते?",
        },
        statement: {
          en: "Binomial nomenclature gives every species a two-word Latinised name, genus first and capitalised, species second and lower case, printed in italics or underlined when handwritten.",
          hi: "द्विनाम पद्धति हर जाति को दो शब्दों का लैटिनीकृत नाम देती है, पहले वंश और बड़े अक्षर से, दूसरा जाति और छोटे अक्षर से, तिरछे छपा या हाथ से लिखने पर रेखांकित।",
          mr: "द्विनाम पद्धती प्रत्येक जातीला दोन शब्दांचे लॅटिनीकृत नाव देते, आधी प्रजाती आणि मोठ्या अक्षराने, दुसरे जात आणि लहान अक्षराने, तिरके छापलेले वा हाताने लिहिताना अधोरेखित.",
        },
        detail: {
          en: "The name also carries information: the genus word is shared by every close relative, so Panthera leo and Panthera tigris announce their kinship in the first word.",
          hi: "नाम सूचना भी ढोता है: वंश-शब्द हर निकट संबंधी में साझा है, अतः पैंथेरा लियो और पैंथेरा टाइग्रिस पहले ही शब्द में अपनी नातेदारी घोषित कर देते हैं।",
          mr: "नाव माहितीही वाहते: प्रजाती-शब्द प्रत्येक जवळच्या नातेवाइकात सामायिक, म्हणून पँथेरा लिओ आणि पँथेरा टायग्रिस पहिल्याच शब्दात आपले नाते जाहीर करतात.",
        },
        extra: {
          en: "Latin was chosen precisely because it is nobody's living language, so no country's usage can drift it and a name written in 1758 still reads the same today.",
          hi: "लैटिन ठीक इसलिए चुनी गई कि वह किसी की जीवित भाषा नहीं, अतः किसी देश का प्रयोग उसे बहा नहीं सकता और 1758 में लिखा नाम आज भी वैसा ही पढ़ा जाता है।",
          mr: "लॅटिन नेमकी यासाठी निवडली की ती कोणाचीही जिवंत भाषा नाही, म्हणून कोणत्याही देशाचा वापर तिला वाहवू शकत नाही आणि 1758 मध्ये लिहिलेले नाव आजही तसेच वाचले जाते.",
        },
        pair: {
          left: {
            en: "One bird, four languages, one name",
            hi: "एक पक्षी, चार भाषाएँ, एक नाम",
            mr: "एक पक्षी, चार भाषा, एक नाव",
          },
          right: {
            en: "a name built to outlive its language",
            hi: "अपनी भाषा से अधिक जीने को बना नाम",
            mr: "आपल्या भाषेहून अधिक जगण्यासाठी बनवलेले नाव",
          },
        },
      },
      {
        id: "the-type-specimen-as-the-anchor",
        name: {
          en: "The one preserved individual a name is tied to",
          hi: "वह इकलौता परिरक्षित व्यष्टि जिससे नाम बँधा है",
          mr: "ज्याच्याशी नाव बांधलेले ते एकमेव जतन केलेले व्यक्ती",
        },
        kind: "method",
        prompt: {
          en: "If a species turns out to be two species, somebody must decide which of them keeps the old name, and the decision is settled not by argument but by a dried, labelled body in a museum drawer. What is that?",
          hi: "यदि कोई जाति दो जातियाँ निकल आए, तो किसी को तय करना पड़ता है कि पुराना नाम कौन रखेगी, और निर्णय बहस से नहीं, संग्रहालय की दराज़ में रखे सूखे, नामांकित शरीर से होता है। वह क्या है?",
          mr: "एखादी जात दोन जाती निघाल्यास, कोणालातरी ठरवावे लागते की जुने नाव कोण ठेवणार, आणि निर्णय वादाने नव्हे, संग्रहालयाच्या खणातल्या वाळलेल्या, नावाची चिठ्ठी लावलेल्या शरीराने होतो. ते काय?",
        },
        statement: {
          en: "Every scientific name is anchored to a type specimen, a single preserved individual deposited in a museum or herbarium, which fixes what the name refers to no matter how the definition is later revised.",
          hi: "हर वैज्ञानिक नाम एक प्ररूप-नमूने से बँधा है, संग्रहालय या हर्बेरियम में जमा किया एक परिरक्षित व्यष्टि, जो तय कर देता है कि नाम किसे इंगित करता है, चाहे परिभाषा बाद में जैसे भी संशोधित हो।",
          mr: "प्रत्येक शास्त्रीय नाव एका प्रारूप-नमुन्याशी बांधलेले, संग्रहालयात वा वनस्पतिसंग्रहात जमा केलेले एक जतन केलेले व्यक्ती, जे नाव कशाला निर्देशित करते हे ठरवते, व्याख्या नंतर कशीही सुधारली तरी.",
        },
        detail: {
          en: "The specimen is not the ideal or average member of the species; it is simply the one the name is legally attached to, which is why an atypical individual can still be the type.",
          hi: "नमूना जाति का आदर्श या औसत सदस्य नहीं; वह बस वही है जिससे नाम विधिक रूप से जुड़ा है, इसीलिए कोई असामान्य व्यष्टि भी प्ररूप हो सकता है।",
          mr: "नमुना ही जातीचा आदर्श वा सरासरी सदस्य नव्हे; तो फक्त तोच ज्याच्याशी नाव कायदेशीरपणे जोडलेले, म्हणूनच एखादे असामान्य व्यक्तीही प्रारूप असू शकते.",
        },
        extra: {
          en: "This is why herbaria, museums and botanical gardens are working instruments rather than displays: they hold the physical references without which the names would slowly lose their meaning.",
          hi: "इसीलिए हर्बेरियम, संग्रहालय और वनस्पति उद्यान प्रदर्शनी नहीं, काम के उपकरण हैं: वे उन भौतिक संदर्भों को रखते हैं जिनके बिना नाम धीरे-धीरे अपना अर्थ खो देते।",
          mr: "म्हणूनच वनस्पतिसंग्रह, संग्रहालये आणि वनस्पती उद्याने ही प्रदर्शने नव्हे तर कामाची साधने: ती ते भौतिक संदर्भ ठेवतात ज्यांच्याविना नावे हळूहळू आपला अर्थ गमावतील.",
        },
        pair: {
          left: {
            en: "A drawer settles what a book cannot",
            hi: "जो पुस्तक तय न कर सके वह दराज़ तय कर देती है",
            mr: "पुस्तक जे ठरवू शकत नाही ते खण ठरवतो",
          },
          right: {
            en: "the one preserved individual a name is tied to",
            hi: "वह इकलौता परिरक्षित व्यष्टि जिससे नाम बँधा है",
            mr: "ज्याच्याशी नाव बांधलेले ते एकमेव जतन केलेले व्यक्ती",
          },
        },
      },
      /*F1B*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student argues that a virus must be alive because it reproduces, makes copies of itself, and evolves resistance to drugs. Assess the argument and say where a virus actually sits.",
          hi: "एक विद्यार्थी तर्क देता है कि विषाणु जीवित ही होगा क्योंकि वह जनन करता है, अपनी प्रतिलिपियाँ बनाता है, और औषधियों के प्रति प्रतिरोध विकसित करता है। तर्क का आकलन करो और बताओ कि विषाणु वास्तव में कहाँ बैठता है।",
          mr: "एक विद्यार्थी युक्तिवाद करतो की विषाणू सजीवच असला पाहिजे कारण तो प्रजनन करतो, स्वतःच्या प्रती बनवतो, आणि औषधांना प्रतिकार विकसित करतो. युक्तिवादाचे मूल्यमापन करा आणि विषाणू प्रत्यक्षात कुठे बसतो ते सांगा.",
        },
        choices: [
          {
            en: "Each observation is correct and the conclusion still does not follow, because a virus does none of it by itself. It has no metabolism, no ribosomes and no means of making energy; every copy is assembled by the host cell's machinery working from the virus's instructions. Outside a host it can be crystallised and stored on a shelf for years like a chemical. So a virus is alive only in the sense that a recipe is a cook — it carries heritable instructions and is subject to natural selection, but it is not an independent living unit and is placed outside the kingdoms of life for that reason",
            hi: "हर प्रेक्षण सही है और निष्कर्ष फिर भी नहीं निकलता, क्योंकि विषाणु उनमें से कुछ भी स्वयं नहीं करता। उसका न उपापचय है, न राइबोसोम, न ऊर्जा बनाने का साधन; हर प्रतिलिपि परपोषी कोशिका की मशीनरी विषाणु के निर्देशों पर चलकर जोड़ती है। परपोषी के बाहर उसे क्रिस्टलित कर रसायन की तरह वर्षों अलमारी में रखा जा सकता है। अतः विषाणु उतना ही जीवित है जितना कोई विधि रसोइया होती है — वह वंशागत निर्देश ढोता है और प्राकृतिक वरण के अधीन है, पर स्वतंत्र जीवित इकाई नहीं, और इसी कारण जीवन के जगतों के बाहर रखा जाता है",
            mr: "प्रत्येक निरीक्षण बरोबर आणि निष्कर्ष तरीही निघत नाही, कारण विषाणू त्यांतले काहीही स्वतः करत नाही. त्याला ना चयापचय, ना रायबोसोम, ना ऊर्जा बनवण्याचे साधन; प्रत्येक प्रत यजमान पेशीची यंत्रणा विषाणूच्या सूचनांवर चालून जुळवते. यजमानाबाहेर त्याला स्फटिकरूप देऊन रसायनासारखे वर्षानुवर्षे कपाटात ठेवता येते. म्हणून विषाणू तितकाच सजीव जितकी एखादी पाककृती स्वयंपाकी असते — तो अनुवंशिक सूचना वाहतो आणि नैसर्गिक निवडीच्या अधीन आहे, पण स्वतंत्र सजीव एकक नाही, आणि याच कारणाने जीवनाच्या सृष्टींबाहेर ठेवला जातो",
          },
          {
            en: "The student is right: reproduction is the defining property of life, so anything that reproduces is alive without qualification",
            hi: "विद्यार्थी सही है: जनन जीवन का परिभाषक गुण है, अतः जो भी जनन करे वह बिना शर्त जीवित है",
            mr: "विद्यार्थी बरोबर: प्रजनन हा जीवनाचा परिभाषक गुणधर्म, म्हणून जो प्रजनन करतो तो बिनशर्त सजीव",
          },
          {
            en: "The student is wrong because viruses do not really reproduce or evolve; the apparent resistance is just the drug becoming weaker over time",
            hi: "विद्यार्थी ग़लत है क्योंकि विषाणु सचमुच जनन या विकास करते ही नहीं; प्रकट प्रतिरोध बस औषधि का समय के साथ दुर्बल होते जाना है",
            mr: "विद्यार्थी चुकीचा कारण विषाणू खरोखर प्रजनन वा उत्क्रांती करतच नाहीत; दिसणारा प्रतिकार म्हणजे फक्त औषध कालांतराने दुर्बळ होणे",
          },
          {
            en: "The student is wrong because a virus is too small to be alive, and size is the criterion that separates living from non-living",
            hi: "विद्यार्थी ग़लत है क्योंकि विषाणु जीवित होने के लिए बहुत छोटा है, और आकार ही वह कसौटी है जो सजीव को निर्जीव से अलग करती है",
            mr: "विद्यार्थी चुकीचा कारण विषाणू सजीव असण्यासाठी खूप लहान आहे, आणि आकार हीच ती कसोटी जी सजीवाला निर्जीवापासून वेगळे करते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Take the student's three observations one at a time, because each is true and none of them does the work being asked of it. A virus does make copies. But it does not make them; the host does. The virus contributes a set of instructions and nothing else — no enzymes to build with, no ribosomes to translate on, no ATP to spend. Bacteriophage that infects a bacterium injects its nucleic acid and leaves its protein coat outside, and within twenty minutes the bacterium has manufactured a hundred new phage using its own machinery and its own energy. If reproduction is the criterion, the reproducing thing here is the bacterium. A virus does evolve. Drug resistance in influenza is real and is ordinary natural selection: variants that survive the drug leave more descendants. But evolution needs only heritable variation and differential survival, and those can operate on anything that is copied with occasional error. A computer virus evolves in the same formal sense and nobody calls it alive. Evolution is therefore a consequence of having heritable instructions, not evidence of being an organism. And a virus can be crystallised. Stanley crystallised tobacco mosaic virus in 1935, an achievement that made the point vividly: a pure sample of it behaves like a chemical, forming an ordered solid that can sit on a shelf indefinitely and infect a plant years later. Nothing with a metabolism can be treated that way, because a metabolism is a process that must keep running. Which brings out what the definition actually requires. The two tests that no non-living thing passes are metabolism — a continuous set of chemical reactions maintaining the thing against decay — and cellular organisation. A virus has neither. It is not a cell, it has no membrane-bounded interior of its own making, and it performs no chemistry at all when it is not inside a host. So the honest description is that a virus is at the boundary, alive when inside a cell and inert when outside, and this is not a fudge — it is the accurate report of something that has one of the two properties life needs and not the other. The wider lesson is about definitions in biology generally. Biological categories are drawn around the middle of distributions rather than at sharp edges, so the informative cases are usually the awkward ones. A virus tests the definition of life, a mule tests the definition of a species, and a definition that has no awkward cases is usually one that has not been looked at hard enough. (The second answer keeps the criterion the chapter has already retired; the third denies observations that are well established; and the fourth invents a size rule that would make mycoplasma non-living and a whale more alive than a bacterium.)",
          hi: "विद्यार्थी के तीनों प्रेक्षण एक-एक करके लो, क्योंकि हर एक सच है और कोई भी वह काम नहीं करता जो उससे माँगा जा रहा है। विषाणु प्रतिलिपियाँ बनवाता तो है। पर वह उन्हें बनाता नहीं; परपोषी बनाता है। विषाणु निर्देशों का एक समुच्चय देता है और कुछ नहीं — बनाने को कोई एंज़ाइम नहीं, अनुवाद के लिए कोई राइबोसोम नहीं, ख़र्च करने को कोई ATP नहीं। जीवाणु को संक्रमित करता बैक्टीरियोफ़ाज अपना न्यूक्लिक अम्ल भीतर ठेल देता है और अपना प्रोटीन आवरण बाहर छोड़ देता है, और बीस मिनट के भीतर जीवाणु अपनी ही मशीनरी और अपनी ही ऊर्जा से सौ नए फ़ाज बना चुका होता है। यदि जनन कसौटी है, तो यहाँ जनन करने वाली चीज़ जीवाणु है। विषाणु विकास भी करता है। इन्फ़्लुएंज़ा में औषधि-प्रतिरोध असली है और साधारण प्राकृतिक वरण है: जो प्ररूप औषधि से बच जाते हैं वे अधिक वंशज छोड़ते हैं। पर विकास को केवल वंशागत विभिन्नता और असमान उत्तरजीविता चाहिए, और वे किसी भी ऐसी चीज़ पर चल सकते हैं जिसकी प्रतिलिपि कभी-कभार त्रुटि से बने। कंप्यूटर वाइरस उसी औपचारिक अर्थ में विकसित होता है और उसे कोई जीवित नहीं कहता। अतः विकास वंशागत निर्देश होने का परिणाम है, जीव होने का प्रमाण नहीं। और विषाणु क्रिस्टलित किया जा सकता है। स्टैनली ने 1935 में तंबाकू मोज़ेक विषाणु को क्रिस्टलित किया, ऐसी उपलब्धि जिसने बात सजीव कर दी: उसका शुद्ध प्रतिदर्श रसायन जैसा बर्ताव करता है, व्यवस्थित ठोस बनाता है जो अनिश्चित काल अलमारी में रह सकता है और वर्षों बाद पौधे को संक्रमित कर सकता है। उपापचय वाली किसी चीज़ के साथ ऐसा नहीं किया जा सकता, क्योंकि उपापचय ऐसी प्रक्रिया है जिसे चलते रहना पड़ता है। इससे उजागर होता है कि परिभाषा वस्तुतः माँगती क्या है। वे दो परीक्षण जिन्हें कोई निर्जीव पार नहीं करता हैं उपापचय — रासायनिक अभिक्रियाओं का सतत समुच्चय जो चीज़ को क्षय के विरुद्ध बनाए रखे — और कोशिकीय संगठन। विषाणु में दोनों नहीं। वह कोशिका नहीं, उसका अपना बनाया झिल्ली-बद्ध भीतरी भाग नहीं, और परपोषी के भीतर न हो तो वह कोई रसायन करता ही नहीं। अतः ईमानदार वर्णन यह है कि विषाणु सीमा पर है, कोशिका के भीतर जीवित और बाहर निष्क्रिय, और यह गोलमोल नहीं — यह उस चीज़ की सटीक रिपोर्ट है जिसमें जीवन को चाहिए दो गुणों में से एक है और दूसरा नहीं। व्यापक सीख जीवविज्ञान की परिभाषाओं के बारे में है। जैविक कोटियाँ तीखे किनारों पर नहीं, वितरणों के बीच के इर्द-गिर्द खींची जाती हैं, अतः सूचनाप्रद मामले प्रायः असुविधाजनक वाले होते हैं। विषाणु जीवन की परिभाषा परखता है, ख़च्चर जाति की परिभाषा परखता है, और जिस परिभाषा का कोई असुविधाजनक मामला न हो उसे प्रायः पर्याप्त कठोरता से देखा नहीं गया। (दूसरा उत्तर वही कसौटी बनाए रखता है जिसे अध्याय पहले ही सेवानिवृत्त कर चुका; तीसरा भलीभाँति स्थापित प्रेक्षणों से इनकार करता है; और चौथा आकार का नियम गढ़ता है जो माइकोप्लाज़्मा को निर्जीव और व्हेल को जीवाणु से अधिक जीवित बना देता।)",
          mr: "विद्यार्थ्याची तिन्ही निरीक्षणे एकेक करून घ्या, कारण प्रत्येक खरे आहे आणि कोणतेही ते काम करत नाही जे त्यांच्याकडून मागितले जात आहे. विषाणू प्रती बनवून घेतो हे खरे. पण तो त्या बनवत नाही; यजमान बनवतो. विषाणू सूचनांचा एक संच देतो आणि दुसरे काहीही नाही — बांधायला एंझाइम नाही, अनुवादासाठी रायबोसोम नाही, खर्चायला ATP नाही. जीवाणूला संसर्ग करणारा बॅक्टेरिओफेज आपले न्यूक्लिक आम्ल आत ढकलतो आणि आपले प्रथिन आवरण बाहेर सोडतो, आणि वीस मिनिटांत जीवाणूने आपल्याच यंत्रणेने आणि आपल्याच ऊर्जेने शंभर नवे फेज बनवलेले असतात. प्रजनन ही कसोटी असेल, तर इथे प्रजनन करणारी गोष्ट जीवाणू आहे. विषाणू उत्क्रांतीही करतो. इन्फ्लुएंझात औषध-प्रतिकार खरा आहे आणि सामान्य नैसर्गिक निवड आहे: जे प्रकार औषधातून वाचतात ते अधिक वंशज सोडतात. पण उत्क्रांतीला केवळ अनुवंशिक विविधता आणि असमान जगणे लागते, आणि ती कोणत्याही अशा गोष्टीवर चालू शकतात जिची प्रत अधूनमधून चुकीसह बनते. संगणक व्हायरस त्याच औपचारिक अर्थाने उत्क्रांत होतो आणि त्याला कोणी सजीव म्हणत नाही. म्हणून उत्क्रांती हा अनुवंशिक सूचना असण्याचा परिणाम, सजीव असण्याचा पुरावा नव्हे. आणि विषाणूला स्फटिकरूप देता येते. स्टॅन्लीने 1935 मध्ये तंबाखू मोझेक विषाणूला स्फटिकरूप दिले, अशी कामगिरी जिने मुद्दा सजीव केला: त्याचा शुद्ध नमुना रसायनासारखा वागतो, सुव्यवस्थित घनपदार्थ बनवतो जो अनिश्चित काळ कपाटात राहू शकतो आणि वर्षांनंतर वनस्पतीला संसर्ग करू शकतो. चयापचय असलेल्या कोणत्याही गोष्टीशी असे करता येत नाही, कारण चयापचय ही अशी प्रक्रिया जी चालूच राहावी लागते. यातून उघड होते की व्याख्या प्रत्यक्षात काय मागते. कोणताही निर्जीव पार करत नाही अशा दोन चाचण्या म्हणजे चयापचय — रासायनिक अभिक्रियांचा सतत संच जो गोष्टीला क्षयाविरुद्ध टिकवतो — आणि पेशीय संघटन. विषाणूत दोन्ही नाहीत. तो पेशी नाही, त्याने स्वतः बनवलेला पटलबद्ध आतील भाग नाही, आणि यजमानाच्या आत नसेल तर तो कोणतेही रसायन करतच नाही. म्हणून प्रामाणिक वर्णन असे की विषाणू सीमेवर आहे, पेशीच्या आत सजीव आणि बाहेर निष्क्रिय, आणि हे गुळमुळीत नाही — ही त्या गोष्टीची अचूक नोंद आहे जिच्यात जीवनाला लागणाऱ्या दोन गुणधर्मांपैकी एक आहे आणि दुसरा नाही. व्यापक धडा जीवशास्त्रातील व्याख्यांबद्दल आहे. जैविक कोट्या तीक्ष्ण कडांवर नव्हे, वितरणांच्या मध्याभोवती आखल्या जातात, म्हणून माहितीपूर्ण प्रकरणे बहुधा गैरसोयीचीच असतात. विषाणू जीवनाची व्याख्या तपासतो, खेचर जातीची व्याख्या तपासते, आणि जिच्यात एकही गैरसोयीचे प्रकरण नाही ती व्याख्या बहुधा पुरेशा कठोरपणे पाहिली गेलेली नाही. (दुसरे उत्तर तीच कसोटी टिकवते जी प्रकरणाने आधीच निवृत्त केली आहे; तिसरे उत्तम प्रस्थापित निरीक्षणे नाकारते; आणि चौथे आकाराचा नियम रचते जो मायकोप्लाझ्माला निर्जीव आणि देवमाशाला जीवाणूहून अधिक सजीव ठरवेल.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Two populations of small brown birds on either side of a river look identical to the eye and have identical measurements. A student concludes they are one species. Say what would settle the question and what the answer would mean.",
          hi: "नदी के दोनों ओर छोटे भूरे पक्षियों की दो समष्टियाँ आँख को एक जैसी दिखती हैं और उनके माप भी समान हैं। एक विद्यार्थी निष्कर्ष निकालता है कि वे एक जाति हैं। बताओ कि प्रश्न किससे निपटेगा और उत्तर का अर्थ क्या होगा।",
          mr: "नदीच्या दोन्ही बाजूंच्या लहान तपकिरी पक्ष्यांच्या दोन लोकसंख्या डोळ्याला सारख्या दिसतात आणि त्यांची मापेही सारखी. एक विद्यार्थी निष्कर्ष काढतो की त्या एक जात आहेत. प्रश्न कशाने निकाली निघेल आणि उत्तराचा अर्थ काय ते सांगा.",
        },
        choices: [
          {
            en: "Appearance is evidence and not proof, and the question is settled by whether the two populations interbreed and leave fertile offspring where they meet. If they do, they are one species and the river is no barrier. If they do not — because their songs differ, or their breeding seasons do not overlap, or the hybrids are infertile — they are two species that happen to look alike, which is common enough to have a name, and the identical measurements simply mean that the same habitat has shaped both the same way",
            hi: "रूप प्रमाण है, सबूत नहीं, और प्रश्न इससे निपटता है कि दोनों समष्टियाँ जहाँ मिलती हैं वहाँ आपस में प्रजनन कर उर्वर संतान छोड़ती हैं या नहीं। यदि छोड़ती हैं, तो वे एक जाति हैं और नदी कोई अवरोध नहीं। यदि नहीं — क्योंकि उनके गीत भिन्न हैं, या उनके प्रजनन-काल एक-दूसरे पर नहीं पड़ते, या संकर बंध्य हैं — तो वे दो जातियाँ हैं जो संयोग से एक जैसी दिखती हैं, जो इतना आम है कि उसका नाम है, और समान माप बस यह बताते हैं कि एक ही आवास ने दोनों को एक ही तरह गढ़ा है",
            mr: "दिसणे हा पुरावा आहे, सिद्धता नव्हे, आणि प्रश्न यावरून निकाली निघतो की दोन्ही लोकसंख्या जिथे भेटतात तिथे परस्पर प्रजनन करून सुफल संतती सोडतात का. सोडत असतील, तर त्या एक जात आहेत आणि नदी अडथळा नाही. सोडत नसतील — कारण त्यांची गाणी वेगळी, वा त्यांचे प्रजननकाळ एकमेकांवर पडत नाहीत, वा संकर वंध्य आहेत — तर त्या सारख्या दिसणाऱ्या दोन जाती आहेत, जे इतके सामान्य आहे की त्याला नाव आहे, आणि सारखी मापे केवळ हे सांगतात की एकाच अधिवासाने दोघांना एकाच पद्धतीने घडवले आहे",
          },
          {
            en: "The student is right: two populations that cannot be told apart by measurement are one species by definition, and no further test is needed",
            hi: "विद्यार्थी सही है: जिन दो समष्टियों में माप से भेद न किया जा सके वे परिभाषा से एक जाति हैं, और कोई और परीक्षण नहीं चाहिए",
            mr: "विद्यार्थी बरोबर: ज्या दोन लोकसंख्यांत मापाने फरक करता येत नाही त्या व्याख्येने एक जात, आणि आणखी कोणतीही चाचणी लागत नाही",
          },
          {
            en: "The student is wrong: populations separated by any physical barrier are always different species, because gene flow between them has stopped",
            hi: "विद्यार्थी ग़लत है: किसी भी भौतिक अवरोध से अलग हुई समष्टियाँ सदा भिन्न जातियाँ हैं, क्योंकि उनके बीच जीन-प्रवाह रुक चुका है",
            mr: "विद्यार्थी चुकीचा: कोणत्याही भौतिक अडथळ्याने वेगळ्या झालेल्या लोकसंख्या नेहमी वेगळ्या जाती, कारण त्यांच्यातला जनुक-प्रवाह थांबला आहे",
          },
          {
            en: "The question cannot be settled at all, because the species is only a convenience of taxonomists and has no reality in nature",
            hi: "प्रश्न निपट ही नहीं सकता, क्योंकि जाति केवल वर्गिकीविदों की सुविधा है और प्रकृति में उसकी कोई वास्तविकता नहीं",
            mr: "प्रश्न निकाली निघूच शकत नाही, कारण जात ही केवळ वर्गीकरणशास्त्रज्ञांची सोय आणि निसर्गात तिला कोणतेही अस्तित्व नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student has used a reasonable clue as though it were the criterion. Looking alike is evidence of relatedness, and most of the time it points the right way, but the definition of a species is not about appearance at all. A species is a set of populations that actually exchange genes, or could if they met, and produce fertile offspring when they do. So the test is a breeding test, and the useful thing about a river is that it gives you somewhere to run it. Go to where the two populations meet — a ford, a bridge, a stretch that dries in summer — and see what happens. If birds from the two banks pair, nest and raise young that themselves go on to breed, then genes are moving between the banks, the populations are one gene pool, and they are one species however far apart the two ends of the range may be. If instead the birds ignore each other, or pair and produce eggs that do not hatch, or produce young that are healthy but sterile, then gene flow has stopped and there are two species in front of you. Notice how the second case can arise while appearance stays identical. Reproductive isolation does not need a visible cause. Two populations can be separated by song, so that a female simply does not recognise the other bank's male as a suitor; by timing, so that one breeds in March and the other in June; by a difference in courtship display; or by a genetic incompatibility that only shows in the embryo. Species that are separate but look the same are called cryptic species, and among small brown birds, frogs and insects they are found constantly — once song recordings and DNA sequencing became routine, single species were repeatedly discovered to be several. The identical measurements deserve a word of their own, because the student read them as evidence of one thing when they are also consistent with another. Two populations living in the same kind of habitat, eating the same food and hunted by the same predators experience the same selection, and selection will shape them the same way whether or not they are related. Similar appearance can therefore mean shared ancestry or shared circumstances, and only breeding evidence tells you which. What if the two populations never meet at all, because the river has no crossing? Then the criterion cannot be applied directly and biologists say so, falling back on indirect evidence: how far the DNA sequences have diverged, whether captive birds from the two banks will breed, and whether related pairs of populations at similar genetic distances are known to interbreed. This is a real limitation of the definition rather than a failure of the biologist, and it is the same limitation that leaves it silent about bacteria, which do not breed in pairs at all, and about fossils, which cannot be asked. The lesson worth carrying is that a good biological definition often names a process rather than a feature, and processes have to be investigated where features can merely be looked at. (The second answer makes appearance the criterion, which cryptic species refute; the third makes geography the criterion, which would split every widespread species into dozens; and the fourth abandons the concept altogether, which cannot be right, since whether two populations interbreed is a fact about the world and not a matter of taxonomic preference.)",
          hi: "विद्यार्थी ने उचित संकेत को ऐसे बरता है मानो वही कसौटी हो। एक जैसा दिखना नातेदारी का प्रमाण है, और अधिकतर वह सही दिशा दिखाता है, पर जाति की परिभाषा रूप के बारे में है ही नहीं। जाति उन समष्टियों का समुच्चय है जो वस्तुतः जीन का आदान-प्रदान करती हैं, या मिलें तो कर सकें, और करने पर उर्वर संतान दें। अतः परीक्षण प्रजनन-परीक्षण है, और नदी की उपयोगिता यह है कि वह उसे चलाने की जगह दे देती है। जहाँ दोनों समष्टियाँ मिलती हैं वहाँ जाओ — कोई पाट, कोई पुल, कोई हिस्सा जो गर्मियों में सूख जाए — और देखो क्या होता है। यदि दोनों तटों के पक्षी जोड़ा बनाते, घोंसला बनाते और ऐसे बच्चे पालते हैं जो आगे स्वयं प्रजनन करें, तो जीन तटों के बीच चल रहे हैं, समष्टियाँ एक जीन-कोश हैं, और वे एक जाति हैं चाहे विस्तार के दोनों सिरे कितने ही दूर हों। यदि इसके बजाय पक्षी एक-दूसरे को अनदेखा करें, या जोड़ा बनाकर ऐसे अंडे दें जो फूटें नहीं, या ऐसे बच्चे दें जो स्वस्थ पर बंध्य हों, तो जीन-प्रवाह रुक चुका है और सामने दो जातियाँ हैं। ध्यान दो कि दूसरा मामला रूप एक जैसा रहते हुए भी बन सकता है। जनन-विलगन को दृश्य कारण नहीं चाहिए। दो समष्टियाँ गीत से अलग हो सकती हैं, ताकि मादा दूसरे तट के नर को वर के रूप में पहचाने ही नहीं; समय से, ताकि एक मार्च में और दूसरी जून में प्रजनन करे; प्रणय-प्रदर्शन के अंतर से; या ऐसी आनुवंशिक असंगति से जो केवल भ्रूण में दिखे। जो जातियाँ अलग हैं पर एक जैसी दिखती हैं उन्हें प्रच्छन्न जातियाँ कहते हैं, और छोटे भूरे पक्षियों, मेंढकों और कीटों में वे लगातार मिलती हैं — जैसे ही गीत-अभिलेखन और DNA अनुक्रमण नित्य हुए, अकेली जातियाँ बार-बार कई निकलीं। समान माप अपनी अलग टिप्पणी के हक़दार हैं, क्योंकि विद्यार्थी ने उन्हें एक बात का प्रमाण पढ़ा जबकि वे दूसरी के भी अनुरूप हैं। एक ही तरह के आवास में रहती, वही भोजन खाती और उन्हीं परभक्षियों से शिकार होती दो समष्टियाँ वही वरण भोगती हैं, और वरण उन्हें एक ही तरह गढ़ेगा चाहे वे संबंधी हों या न हों। अतः मिलता-जुलता रूप साझा पूर्वजता का अर्थ रख सकता है या साझा परिस्थिति का, और कौन-सा, यह केवल प्रजनन-प्रमाण बताता है। और यदि दोनों समष्टियाँ कभी मिलें ही नहीं, क्योंकि नदी पार करने की जगह ही न हो? तब कसौटी सीधे लगाई नहीं जा सकती और जीवविज्ञानी यह कह देते हैं, अप्रत्यक्ष प्रमाण पर लौटते हुए: DNA अनुक्रम कितने दूर हट चुके हैं, बंदी अवस्था में दोनों तटों के पक्षी प्रजनन करेंगे या नहीं, और उतनी ही आनुवंशिक दूरी वाले समष्टि-युग्मों में परस्पर प्रजनन ज्ञात है या नहीं। यह जीवविज्ञानी की विफलता नहीं, परिभाषा की असली सीमा है, और वही सीमा उसे जीवाणुओं के बारे में चुप कर देती है, जो जोड़ों में प्रजनन करते ही नहीं, और जीवाश्मों के बारे में, जिनसे पूछा नहीं जा सकता। ले जाने योग्य सीख यह है कि अच्छी जैविक परिभाषा प्रायः किसी लक्षण का नहीं, किसी प्रक्रिया का नाम लेती है, और प्रक्रियाओं की जाँच करनी पड़ती है जहाँ लक्षण बस देखे जा सकते हैं। (दूसरा उत्तर रूप को कसौटी बना देता है, जिसका खंडन प्रच्छन्न जातियाँ करती हैं; तीसरा भूगोल को कसौटी बना देता है, जो हर विस्तृत जाति को दर्जनों में तोड़ देता; और चौथा संकल्पना ही छोड़ देता है, जो ठीक नहीं हो सकता, क्योंकि दो समष्टियाँ परस्पर प्रजनन करती हैं या नहीं यह संसार का तथ्य है, वर्गिकीय पसंद की बात नहीं।)",
          mr: "विद्यार्थ्याने रास्त सूचकाला जणू तीच कसोटी असल्यासारखे वापरले आहे. सारखे दिसणे हा नात्याचा पुरावा, आणि बहुतेकदा तो योग्य दिशा दाखवतो, पण जातीची व्याख्या दिसण्याबद्दल आहेच नाही. जात म्हणजे अशा लोकसंख्यांचा संच ज्या प्रत्यक्षात जनुकांची देवाणघेवाण करतात, वा भेटल्यास करू शकतील, आणि करताना सुफल संतती देतात. म्हणून चाचणी ही प्रजनन-चाचणी, आणि नदीचा उपयोग असा की ती ती चालवायला जागा देते. जिथे दोन्ही लोकसंख्या भेटतात तिथे जा — एखादा उतार, एखादा पूल, उन्हाळ्यात आटणारा एखादा पट्टा — आणि काय होते ते पाहा. दोन्ही काठांचे पक्षी जोडी बांधत, घरटे करत आणि पुढे स्वतः प्रजनन करणारी पिल्ले वाढवत असतील, तर जनुके काठांदरम्यान चालत आहेत, लोकसंख्या एकच जनुक-साठा आहेत, आणि त्या एक जात आहेत, विस्ताराची दोन टोके कितीही दूर असोत. त्याऐवजी पक्षी एकमेकांकडे दुर्लक्ष करत असतील, वा जोडी बांधून न फुटणारी अंडी देत असतील, वा निरोगी पण वंध्य पिल्ले देत असतील, तर जनुक-प्रवाह थांबला आहे आणि समोर दोन जाती आहेत. लक्षात घ्या की दुसरे प्रकरण दिसणे सारखे राहूनही घडू शकते. प्रजनन-विलगीकरणाला दृश्य कारण लागत नाही. दोन लोकसंख्या गाण्याने वेगळ्या असू शकतात, जेणेकरून मादी दुसऱ्या काठाच्या नराला वर म्हणून ओळखतच नाही; वेळेने, जेणेकरून एक मार्चमध्ये आणि दुसरी जूनमध्ये प्रजनन करते; प्रणय-प्रदर्शनाच्या फरकाने; वा केवळ गर्भात दिसणाऱ्या अनुवंशिक विसंगतीने. वेगळ्या असूनही सारख्या दिसणाऱ्या जातींना छुप्या जाती म्हणतात, आणि लहान तपकिरी पक्षी, बेडूक आणि कीटकांत त्या सतत सापडतात — गाण्यांचे ध्वनिमुद्रण आणि DNA अनुक्रमण नित्याचे होताच एकेकट्या जाती वारंवार अनेक निघाल्या. सारखी मापे स्वतःच्या स्वतंत्र टिप्पणीस पात्र, कारण विद्यार्थ्याने ती एका गोष्टीचा पुरावा म्हणून वाचली तर ती दुसरीशीही सुसंगत आहेत. एकाच प्रकारच्या अधिवासात राहणाऱ्या, तेच अन्न खाणाऱ्या आणि त्याच भक्षकांकडून शिकार होणाऱ्या दोन लोकसंख्या तीच निवड भोगतात, आणि निवड त्यांना एकाच पद्धतीने घडवेल, त्या नातेवाईक असोत वा नसोत. म्हणून सारखे दिसणे सामायिक पूर्वजतेचा अर्थ ठेवू शकते वा सामायिक परिस्थितीचा, आणि कोणता हे केवळ प्रजनन-पुरावाच सांगतो. आणि दोन्ही लोकसंख्या कधी भेटतच नसतील, कारण नदी ओलांडायला जागाच नाही? तेव्हा कसोटी थेट लावता येत नाही आणि जीवशास्त्रज्ञ तसे सांगतात, अप्रत्यक्ष पुराव्यावर परतत: DNA अनुक्रम किती दूर सरकले आहेत, बंदिवासात दोन्ही काठांचे पक्षी प्रजनन करतील का, आणि तितकेच अनुवंशिक अंतर असलेल्या लोकसंख्या-जोड्यांत परस्पर प्रजनन ज्ञात आहे का. ही जीवशास्त्रज्ञाची हार नव्हे तर व्याख्येची खरी मर्यादा, आणि तीच मर्यादा तिला जीवाणूंबद्दल गप्प करते, जे जोड्यांत प्रजनन करतच नाहीत, आणि जीवाश्मांबद्दल, ज्यांना विचारता येत नाही. नेण्याजोगा धडा असा की चांगली जैविक व्याख्या बहुधा एखाद्या लक्षणाचे नव्हे, एखाद्या प्रक्रियेचे नाव घेते, आणि प्रक्रियांचा तपास करावा लागतो जिथे लक्षणे केवळ पाहता येतात. (दुसरे उत्तर दिसण्याला कसोटी बनवते, ज्याचे खंडन छुप्या जाती करतात; तिसरे भूगोलाला कसोटी बनवते, जे प्रत्येक विस्तृत जातीचे डझनभर तुकडे करेल; आणि चौथे संकल्पनाच सोडून देते, जे बरोबर असू शकत नाही, कारण दोन लोकसंख्या परस्पर प्रजनन करतात की नाही ही जगाची वस्तुस्थिती आहे, वर्गीकरणाच्या आवडीची बाब नव्हे.)",
        },
      },
      /*H1B*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Biological Classification                                   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-11-biological-classification",
    subject: "BIOLOGY",
    classLevel: 11,
    chapter: {
      en: "Chapter 2 — Biological Classification",
      hi: "अध्याय 2 — जीव जगत का वर्गीकरण",
      mr: "प्रकरण 2 — सजीवांचे वर्गीकरण",
    },
    name: {
      en: "Biological Classification",
      hi: "जीव जगत का वर्गीकरण",
      mr: "सजीवांचे वर्गीकरण",
    },
    summary: {
      en: "For two thousand years everything was either a plant or an animal, and the scheme collapsed under things that were neither: a mushroom that eats but cannot move, a bacterium with no nucleus at all, and a euglena that photosynthesises in the light and hunts in the dark — so the dividing lines were redrawn around cell type, nutrition and body organisation instead of around what an organism looks like.",
      hi: "दो हज़ार वर्ष तक हर चीज़ या तो पादप थी या प्राणी, और वह योजना उन चीज़ों के नीचे ढह गई जो दोनों नहीं थीं: वह कुकुरमुत्ता जो खाता है पर चल नहीं सकता, वह जीवाणु जिसमें केंद्रक ही नहीं, और वह यूग्लीना जो प्रकाश में प्रकाश-संश्लेषण करती है और अंधेरे में शिकार — अतः विभाजक रेखाएँ जीव कैसा दिखता है उसके इर्द-गिर्द नहीं, कोशिका-प्रकार, पोषण और शरीर-संगठन के इर्द-गिर्द फिर से खींची गईं।",
      mr: "दोन हजार वर्षे प्रत्येक गोष्ट एकतर वनस्पती होती वा प्राणी, आणि ती योजना दोन्हीही नसलेल्या गोष्टींखाली कोसळली: जे खाते पण चालू शकत नाही ते अळिंब, ज्याला केंद्रकच नाही तो जीवाणू, आणि जी प्रकाशात प्रकाशसंश्लेषण करते आणि अंधारात शिकार करते ती युग्लीना — म्हणून विभाजक रेषा सजीव कसा दिसतो त्याभोवती नव्हे, पेशी-प्रकार, पोषण आणि शरीर-संघटन यांच्याभोवती पुन्हा आखल्या गेल्या.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "the-scheme-that-had-to-be-broken-up",
        name: {
          en: "The two-box scheme that ran out of boxes",
          hi: "वह दो-डिब्बों की योजना जिसके डिब्बे चुक गए",
          mr: "डबे संपलेली ती दोन-डब्यांची योजना",
        },
        kind: "history",
        prompt: {
          en: "A mushroom cannot walk, so it went with the plants; a bacterium has a cell wall, so it went with the plants; a euglena swims and photosynthesises, so it went with both. Which failure is this?",
          hi: "कुकुरमुत्ता चल नहीं सकता, अतः वह पादपों के साथ गया; जीवाणु में कोशिका भित्ति है, अतः वह पादपों के साथ गया; यूग्लीना तैरती भी है और प्रकाश-संश्लेषण भी करती है, अतः वह दोनों के साथ गई। यह कौन-सी विफलता है?",
          mr: "अळिंब चालू शकत नाही, म्हणून ते वनस्पतींसोबत गेले; जीवाणूला पेशीभित्तिका आहे, म्हणून तो वनस्पतींसोबत गेला; युग्लीना पोहतेही आणि प्रकाशसंश्लेषणही करते, म्हणून ती दोघांसोबत गेली. हे कोणते अपयश?",
        },
        statement: {
          en: "The two-kingdom system failed because it sorted organisms by appearance and habit, so Whittaker replaced it in 1969 with five kingdoms sorted by cell type, body organisation, mode of nutrition and reproduction.",
          hi: "दो-जगत प्रणाली इसलिए विफल हुई कि वह जीवों को रूप और आदत से छाँटती थी, अतः व्हिटेकर ने 1969 में उसकी जगह कोशिका-प्रकार, शरीर-संगठन, पोषण-विधि और जनन से छँटे पाँच जगत रख दिए।",
          mr: "दोन-सृष्टी प्रणाली अपयशी ठरली कारण ती सजीवांना दिसणे आणि सवयीने वर्गीकृत करत होती, म्हणून व्हिटेकरने 1969 मध्ये तिच्या जागी पेशी-प्रकार, शरीर-संघटन, पोषण-पद्धत आणि प्रजनन यांनी वर्गीकृत पाच सृष्टी ठेवल्या.",
        },
        detail: {
          en: "The new criteria are internal rather than visible, which is exactly why they had to wait for the microscope and for biochemistry to become routine.",
          hi: "नई कसौटियाँ दृश्य नहीं, आंतरिक हैं, ठीक इसीलिए उन्हें सूक्ष्मदर्शी और जैवरसायन के नित्य होने की प्रतीक्षा करनी पड़ी।",
          mr: "नव्या कसोट्या दृश्य नव्हे तर आंतरिक, नेमके म्हणूनच त्यांना सूक्ष्मदर्शक आणि जीवरसायन नित्याचे होण्याची वाट पाहावी लागली.",
        },
        extra: {
          en: "The five are Monera, Protista, Fungi, Plantae and Animalia, and the first split — Monera against the rest — is deeper than any of the others.",
          hi: "पाँच हैं मोनेरा, प्रोटिस्टा, कवक, पादप और प्राणी, और पहला विभाजन — मोनेरा बनाम बाक़ी — बाक़ी सब से गहरा है।",
          mr: "पाच म्हणजे मोनेरा, प्रोटिस्टा, कवक, वनस्पती आणि प्राणी, आणि पहिली फाळणी — मोनेरा विरुद्ध उरलेले — इतर कोणत्याहीपेक्षा खोल आहे.",
        },
        pair: {
          left: {
            en: "One organism that fitted in both boxes",
            hi: "एक जीव जो दोनों डिब्बों में फिट हो गया",
            mr: "दोन्ही डब्यांत बसणारा एक सजीव",
          },
          right: {
            en: "the two-box scheme that ran out of boxes",
            hi: "वह दो-डिब्बों की योजना जिसके डिब्बे चुक गए",
            mr: "डबे संपलेली ती दोन-डब्यांची योजना",
          },
        },
      },
      {
        id: "the-deepest-division-in-all-of-life",
        name: {
          en: "The division you cannot see with the eye",
          hi: "वह विभाजन जो आँख से नहीं दिखता",
          mr: "डोळ्याने न दिसणारी ती फाळणी",
        },
        kind: "structure",
        prompt: {
          en: "An oak and an elephant are far more alike than either is to the bacterium in a drop of pond water, and the reason is a single membrane that one group has and the other never evolved. Which division is this?",
          hi: "बलूत और हाथी एक-दूसरे से कहीं अधिक मिलते हैं बनिस्बत तालाब की एक बूँद के जीवाणु के, और कारण एक अकेली झिल्ली है जो एक समूह में है और दूसरे ने कभी विकसित ही नहीं की। यह कौन-सा विभाजन है?",
          mr: "ओक आणि हत्ती एकमेकांशी कितीतरी अधिक जुळतात तळ्याच्या एका थेंबातल्या जीवाणूपेक्षा, आणि कारण म्हणजे एक पटल जे एका गटाकडे आहे आणि दुसऱ्याने कधी विकसितच केले नाही. ही कोणती फाळणी?",
        },
        statement: {
          en: "The deepest division among living things is between prokaryotes, whose genetic material lies free in the cytoplasm, and eukaryotes, whose DNA is enclosed in a membrane-bound nucleus along with membrane-bound organelles.",
          hi: "जीवों के बीच सबसे गहरा विभाजन प्रोकैरियोटों में है, जिनका आनुवंशिक पदार्थ कोशिकाद्रव्य में खुला पड़ा रहता है, और यूकैरियोटों में, जिनका DNA झिल्ली-बद्ध केंद्रक में झिल्ली-बद्ध कोशिकांगों के साथ बंद रहता है।",
          mr: "सजीवांमधली सर्वांत खोल फाळणी प्रोकॅरिओटांमध्ये आहे, ज्यांचे अनुवंशिक द्रव्य पेशीद्रव्यात मोकळे पडलेले असते, आणि युकॅरिओटांमध्ये, ज्यांचे DNA पटलबद्ध केंद्रकात पटलबद्ध पेशीअंगांसह बंद असते.",
        },
        detail: {
          en: "The consequences run through everything: a prokaryote transcribes and translates in the same space at the same time, while a eukaryote must export the message across a membrane first.",
          hi: "परिणाम हर चीज़ में फैलते हैं: प्रोकैरियोट एक ही स्थान में एक ही समय अनुलेखन और अनुवाद करता है, जबकि यूकैरियोट को पहले संदेश झिल्ली के पार भेजना पड़ता है।",
          mr: "परिणाम प्रत्येक गोष्टीतून पसरतात: प्रोकॅरिओट एकाच जागी एकाच वेळी प्रतिलेखन आणि अनुवाद करतो, तर युकॅरिओटला आधी संदेश पटलापलीकडे पाठवावा लागतो.",
        },
        extra: {
          en: "Only Monera is prokaryotic; Protista, Fungi, Plantae and Animalia are all eukaryotic, so four of Whittaker's five kingdoms are on one side of this line.",
          hi: "केवल मोनेरा प्रोकैरियोटिक है; प्रोटिस्टा, कवक, पादप और प्राणी सब यूकैरियोटिक हैं, अतः व्हिटेकर के पाँच में से चार जगत इस रेखा के एक ही ओर हैं।",
          mr: "केवळ मोनेरा प्रोकॅरिओटिक; प्रोटिस्टा, कवक, वनस्पती आणि प्राणी सर्व युकॅरिओटिक, म्हणून व्हिटेकरच्या पाचांपैकी चार सृष्टी या रेषेच्या एकाच बाजूला आहेत.",
        },
        pair: {
          left: {
            en: "An oak nearer an elephant than a bacterium",
            hi: "बलूत जीवाणु से नहीं, हाथी से पास",
            mr: "ओक जीवाणूहून हत्तीच्या जवळ",
          },
          right: {
            en: "the division you cannot see with the eye",
            hi: "वह विभाजन जो आँख से नहीं दिखता",
            mr: "डोळ्याने न दिसणारी ती फाळणी",
          },
        },
      },
      {
        id: "how-an-organism-gets-its-carbon",
        name: {
          en: "Sorting by how the meal is obtained",
          hi: "भोजन कैसे मिलता है उससे छँटाई",
          mr: "जेवण कसे मिळवले जाते त्यावरून वर्गवारी",
        },
        kind: "criterion",
        prompt: {
          en: "A tree builds its own food from air and light, a cow swallows food and digests it inside, and a mould digests food outside itself and then drinks it — three different answers to one question. Which criterion is this?",
          hi: "वृक्ष हवा और प्रकाश से अपना भोजन स्वयं बनाता है, गाय भोजन निगलकर भीतर पचाती है, और फफूँद भोजन अपने बाहर पचाकर फिर पी लेती है — एक प्रश्न के तीन भिन्न उत्तर। यह कौन-सी कसौटी है?",
          mr: "झाड हवा आणि प्रकाशातून स्वतःचे अन्न स्वतः बनवते, गाय अन्न गिळून आत पचवते, आणि बुरशी अन्न स्वतःबाहेर पचवून मग पिते — एका प्रश्नाची तीन वेगळी उत्तरे. ही कोणती कसोटी?",
        },
        statement: {
          en: "Mode of nutrition is a classifying character: autotrophs make their own organic carbon, while heterotrophs take it from others either by ingesting food and digesting it inside or by secreting enzymes outside and absorbing the products.",
          hi: "पोषण-विधि एक वर्गीकारक लक्षण है: स्वपोषी अपना कार्बनिक कार्बन स्वयं बनाते हैं, जबकि परपोषी उसे दूसरों से लेते हैं — या तो भोजन निगलकर भीतर पचाकर, या बाहर एंज़ाइम छोड़कर उत्पाद अवशोषित करके।",
          mr: "पोषण-पद्धत हे वर्गीकारक लक्षण: स्वयंपोषी स्वतःचा कार्बनी कार्बन स्वतः बनवतात, तर परपोषी तो इतरांकडून घेतात — एकतर अन्न गिळून आत पचवून, वा बाहेर एंझाइम सोडून उत्पादे शोषून.",
        },
        detail: {
          en: "The absorptive route is what separates a fungus from an animal, and it explains everything else about fungi: no mouth, no gut, and a body made of threads that maximise surface.",
          hi: "अवशोषी मार्ग ही कवक को प्राणी से अलग करता है, और वही कवकों के बारे में बाक़ी सब समझा देता है: न मुँह, न आँत, और तंतुओं से बना शरीर जो सतह अधिकतम करे।",
          mr: "शोषक मार्गच कवकाला प्राण्यापासून वेगळा करतो, आणि तोच कवकांबद्दलचे बाकी सर्व समजावतो: ना तोंड, ना आतडे, आणि पृष्ठभाग अधिकतम करणाऱ्या तंतूंचे शरीर.",
        },
        extra: {
          en: "Some organisms refuse to settle: a euglena photosynthesises in light and feeds on particles in the dark, which is why Protista became a kingdom rather than a footnote.",
          hi: "कुछ जीव जमने से इनकार कर देते हैं: यूग्लीना प्रकाश में प्रकाश-संश्लेषण करती है और अंधेरे में कणों पर पलती है, इसीलिए प्रोटिस्टा टिप्पणी नहीं, जगत बना।",
          mr: "काही सजीव स्थिरावायला नकार देतात: युग्लीना प्रकाशात प्रकाशसंश्लेषण करते आणि अंधारात कणांवर जगते, म्हणूनच प्रोटिस्टा तळटीप नव्हे तर सृष्टी बनली.",
        },
        pair: {
          left: {
            en: "Digest outside, then drink",
            hi: "बाहर पचाओ, फिर पी लो",
            mr: "बाहेर पचवा, मग प्या",
          },
          right: {
            en: "sorting by how the meal is obtained",
            hi: "भोजन कैसे मिलता है उससे छँटाई",
            mr: "जेवण कसे मिळवले जाते त्यावरून वर्गवारी",
          },
        },
      },
      {
        id: "the-lineage-that-lives-where-nothing-should",
        name: {
          en: "The old lineage in the boiling spring",
          hi: "खौलते सोते का पुराना वंशक्रम",
          mr: "उकळत्या झऱ्यातील जुनी वंशावळ",
        },
        kind: "group",
        prompt: {
          en: "Some single-celled organisms live in water hot enough to cook an egg, in brine that would pickle anything, and in the stomach of a cow producing methane — and their cell walls are chemically unlike any other bacterium's. Which group is this?",
          hi: "कुछ एककोशिकीय जीव इतने गर्म पानी में रहते हैं कि अंडा पक जाए, ऐसे नमकीन पानी में जो कुछ भी अचार बना दे, और गाय के पेट में मीथेन बनाते हुए — और उनकी कोशिका भित्तियाँ रसायन में किसी भी दूसरे जीवाणु से भिन्न हैं। यह कौन-सा समूह है?",
          mr: "काही एकपेशीय सजीव अंडे शिजेल इतक्या गरम पाण्यात राहतात, काहीही लोणचे करेल अशा खाऱ्या पाण्यात, आणि गायीच्या पोटात मिथेन बनवत — आणि त्यांच्या पेशीभित्तिका रसायनाने इतर कोणत्याही जीवाणूहून वेगळ्या. हा कोणता गट?",
        },
        statement: {
          en: "Archaebacteria are prokaryotes of extreme habitats — hot springs, salt pans, marshes and the guts of ruminants — whose cell walls lack the peptidoglycan found in all other bacteria.",
          hi: "आर्किबैक्टीरिया चरम आवासों के प्रोकैरियोट हैं — गर्म सोते, नमक-क्यारियाँ, दलदल और रोमंथी पशुओं की आँतें — जिनकी कोशिका भित्तियों में वह पेप्टिडोग्लाइकन नहीं होता जो बाक़ी सब जीवाणुओं में मिलता है।",
          mr: "आर्किबॅक्टेरिया हे टोकाच्या अधिवासांतील प्रोकॅरिओट — गरम झरे, मिठागरे, दलदली आणि रवंथ करणाऱ्या जनावरांची आतडी — ज्यांच्या पेशीभित्तिकांत इतर सर्व जीवाणूंत आढळणारे पेप्टिडोग्लायकन नसते.",
        },
        detail: {
          en: "The wall chemistry is not a detail: it is why they survive conditions that dissolve other cells, and why antibiotics that attack peptidoglycan do nothing to them.",
          hi: "भित्ति का रसायन ब्योरा नहीं: वही कारण है कि वे उन परिस्थितियों में बचे रहते हैं जो दूसरी कोशिकाएँ घोल देती हैं, और कि पेप्टिडोग्लाइकन पर हमला करने वाले प्रतिजैविक उनका कुछ नहीं बिगाड़ते।",
          mr: "भित्तिकेचे रसायन हा तपशील नव्हे: तेच कारण की ते इतर पेशी विरघळवणाऱ्या परिस्थितीत टिकतात, आणि पेप्टिडोग्लायकनवर हल्ला करणारी प्रतिजैविके त्यांचे काहीच बिघडवत नाहीत.",
        },
        extra: {
          en: "Comparing their genes with everyone else's is what later suggested three domains rather than five kingdoms, since the archaea turned out to be no closer to bacteria than to us.",
          hi: "उनके जीनों की बाक़ी सबसे तुलना से ही बाद में पाँच जगतों के बजाय तीन डोमेन का सुझाव आया, क्योंकि आर्किया जीवाणुओं के उतने ही पास निकले जितने हमारे।",
          mr: "त्यांच्या जनुकांची इतर सर्वांशी तुलना केल्यानेच नंतर पाच सृष्टींऐवजी तीन क्षेत्रांची सूचना आली, कारण आर्किया जीवाणूंच्या तितकेच जवळ निघाले जितके आपल्या.",
        },
        pair: {
          left: {
            en: "A wall no antibiotic recognises",
            hi: "ऐसी भित्ति जिसे कोई प्रतिजैविक पहचानता नहीं",
            mr: "कोणतेही प्रतिजैविक ओळखत नाही अशी भित्तिका",
          },
          right: {
            en: "the old lineage in the boiling spring",
            hi: "खौलते सोते का पुराना वंशक्रम",
            mr: "उकळत्या झऱ्यातील जुनी वंशावळ",
          },
        },
      },
      {
        id: "a-body-made-entirely-of-surface",
        name: {
          en: "A body that is nothing but surface",
          hi: "वह शरीर जो सतह के सिवा कुछ नहीं",
          mr: "पृष्ठभागाशिवाय काहीच नसलेले शरीर",
        },
        kind: "structure",
        prompt: {
          en: "An organism that must dissolve its food before it can take any in has one overwhelming design problem, and the solution is a body of fine branching threads with almost no interior. Which body plan is this?",
          hi: "जिस जीव को कुछ भी लेने से पहले अपना भोजन घोलना पड़ता है उसके सामने एक ही भारी अभिकल्प-समस्या है, और समाधान है महीन शाखित तंतुओं का शरीर जिसमें भीतर कुछ है ही नहीं। यह कौन-सी शरीर-योजना है?",
          mr: "काहीही घेण्याआधी ज्या सजीवाला आपले अन्न विरघळवावे लागते त्याच्यासमोर एकच प्रचंड रचना-समस्या, आणि उपाय म्हणजे बारीक शाखा असलेल्या तंतूंचे शरीर ज्यात आत काहीच नाही. ही कोणती शरीर-योजना?",
        },
        statement: {
          en: "A fungus is built as a mycelium, a mesh of fine threads called hyphae with cell walls of chitin, which gives an enormous surface area for secreting enzymes and absorbing the dissolved food.",
          hi: "कवक कवक-जाल के रूप में बना है, काइटिन की कोशिका भित्तियों वाले महीन तंतुओं का जाल जिन्हें कवक-तंतु कहते हैं, जो एंज़ाइम छोड़ने और घुले भोजन को अवशोषित करने के लिए विशाल सतह देता है।",
          mr: "कवक हे कवकजाल म्हणून बांधलेले, कायटिनच्या पेशीभित्तिका असलेल्या बारीक तंतूंचे जाळे ज्यांना कवकतंतू म्हणतात, जे एंझाइम सोडायला आणि विरघळलेले अन्न शोषायला प्रचंड पृष्ठभाग देते.",
        },
        detail: {
          en: "Chitin is the same material as an insect's shell and is not cellulose, which is one of the plainest reasons a fungus is not a plant.",
          hi: "काइटिन वही पदार्थ है जो कीट के कवच का है और सेलुलोस नहीं, और यही सबसे सीधे कारणों में है कि कवक पादप नहीं।",
          mr: "कायटिन हे कीटकाच्या कवचाचेच द्रव्य आणि सेल्युलोज नव्हे, आणि हेच सर्वांत स्पष्ट कारणांपैकी एक की कवक वनस्पती नाही.",
        },
        extra: {
          en: "The mushroom is only the fruiting body pushed up to release spores; the organism itself is the mycelium spread invisibly through the soil or the log.",
          hi: "कुकुरमुत्ता केवल बीजाणु छोड़ने को ऊपर धकेला फलनकाय है; जीव स्वयं वह कवक-जाल है जो मिट्टी या लट्ठे में अदृश्य फैला है।",
          mr: "अळिंब हे केवळ बीजाणू सोडायला वर ढकललेले फलनकाय; सजीव स्वतः ते कवकजाल जे मातीत वा ओंडक्यात अदृश्य पसरलेले.",
        },
        pair: {
          left: {
            en: "Chitin where a plant would have cellulose",
            hi: "जहाँ पादप में सेलुलोस होता वहाँ काइटिन",
            mr: "वनस्पतीत सेल्युलोज असते तिथे कायटिन",
          },
          right: {
            en: "a body that is nothing but surface",
            hi: "वह शरीर जो सतह के सिवा कुछ नहीं",
            mr: "पृष्ठभागाशिवाय काहीच नसलेले शरीर",
          },
        },
      },
      {
        id: "two-organisms-counted-as-one",
        name: {
          en: "Two organisms answering to one name",
          hi: "एक नाम पर उत्तर देते दो जीव",
          mr: "एका नावाला उत्तर देणारे दोन सजीव",
        },
        kind: "relationship",
        prompt: {
          en: "The grey crust on a rock is not a plant, and it is not one organism either: pull it apart and you find a fungus supplying water and shelter and an alga supplying sugar. What is this arrangement?",
          hi: "चट्टान पर की धूसर पपड़ी न पादप है, न एक जीव: उसे अलग करो तो पानी और आश्रय देता कवक और शर्करा देता शैवाल मिलते हैं। यह कौन-सी व्यवस्था है?",
          mr: "खडकावरचा करडा कवच ना वनस्पती आहे, ना एक सजीव: तो वेगळा करा आणि पाणी व निवारा पुरवणारे कवक आणि साखर पुरवणारे शैवाल सापडतात. ही कोणती व्यवस्था?",
        },
        statement: {
          en: "A lichen is a symbiotic partnership of a fungus and an alga, and a mycorrhiza is the same kind of partnership between a fungus and a plant root, each partner supplying what the other cannot make.",
          hi: "लाइकेन कवक और शैवाल की सहजीवी साझेदारी है, और माइकोराइज़ा कवक और पादप-मूल के बीच उसी क़िस्म की साझेदारी, जिसमें हर साथी वह देता है जो दूसरा बना नहीं सकता।",
          mr: "दगडफूल हे कवक आणि शैवाल यांची सहजीवी भागीदारी, आणि कवकमूळ ही कवक आणि वनस्पतीमूळ यांच्यातली त्याच प्रकारची भागीदारी, ज्यात प्रत्येक भागीदार तेच पुरवतो जे दुसरा बनवू शकत नाही.",
        },
        detail: {
          en: "The partnership does what neither could alone: a lichen colonises bare rock, weathering it into the first soil that anything else can root in.",
          hi: "साझेदारी वह करती है जो अकेले कोई नहीं कर सकता था: लाइकेन नंगी चट्टान पर बस जाता है, उसे तोड़कर वह पहली मिट्टी बनाता है जिसमें कुछ और जड़ पकड़ सके।",
          mr: "भागीदारी ते करते जे एकट्याने कोणालाही जमले नसते: दगडफूल उघड्या खडकावर वसते, त्याची झीज करून ती पहिली माती बनवते जिच्यात दुसरे काही मूळ धरू शकते.",
        },
        extra: {
          en: "Lichens are also standard air-quality indicators, because the fungal partner absorbs whatever is dissolved in rain and cannot excrete pollutants, so they vanish from smoky cities.",
          hi: "लाइकेन मानक वायु-गुणवत्ता सूचक भी हैं, क्योंकि कवक साथी वर्षा में घुला जो कुछ हो सब सोख लेता है और प्रदूषक निकाल नहीं सकता, अतः वे धुँआधार नगरों से ग़ायब हो जाते हैं।",
          mr: "दगडफुले ही प्रमाणित हवा-गुणवत्ता निर्देशकही आहेत, कारण कवक भागीदार पावसात विरघळलेले जे काही असेल ते शोषतो आणि प्रदूषके बाहेर टाकू शकत नाही, म्हणून ती धुरकट शहरांतून नाहीशी होतात.",
        },
        pair: {
          left: {
            en: "The crust that makes soil out of stone",
            hi: "वह पपड़ी जो पत्थर से मिट्टी बनाती है",
            mr: "दगडापासून माती बनवणारा तो कवच",
          },
          right: {
            en: "two organisms answering to one name",
            hi: "एक नाम पर उत्तर देते दो जीव",
            mr: "एका नावाला उत्तर देणारे दोन सजीव",
          },
        },
      },
      /*F2B*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student explains that fungi are plants that lost their chlorophyll, since both are fixed in one place, both have cell walls and both reproduce by spores. Assess the explanation.",
          hi: "एक विद्यार्थी समझाता है कि कवक ऐसे पादप हैं जिन्होंने अपना पर्णहरित खो दिया, क्योंकि दोनों एक जगह जमे रहते हैं, दोनों में कोशिका भित्तियाँ हैं और दोनों बीजाणुओं से जनन करते हैं। व्याख्या का आकलन करो।",
          mr: "एक विद्यार्थी समजावतो की कवक ही अशी वनस्पती आहेत ज्यांनी आपले हरितद्रव्य गमावले, कारण दोघेही एका जागी स्थिर, दोघांनाही पेशीभित्तिका आणि दोघेही बीजाणूंनी प्रजनन करतात. स्पष्टीकरणाचे मूल्यमापन करा.",
        },
        choices: [
          {
            en: "Every similarity listed is real and none of them is evidence of ancestry. Being fixed in place and reproducing by spores are convergences forced by a similar way of life, and the cell walls are made of different substances — chitin in a fungus, cellulose in a plant. The decisive character is nutrition: a plant is autotrophic and would have to have lost photosynthesis, while a fungus is absorptive and never had it. Gene sequences settle it, and they place fungi nearer to animals than to plants",
            hi: "गिनाई गई हर समानता असली है और उनमें से कोई पूर्वजता का प्रमाण नहीं। एक जगह जमे रहना और बीजाणुओं से जनन करना समान जीवन-शैली से थोपे गए अभिसरण हैं, और कोशिका भित्तियाँ भिन्न पदार्थों की बनी हैं — कवक में काइटिन, पादप में सेलुलोस। निर्णायक लक्षण पोषण है: पादप स्वपोषी है और उसे प्रकाश-संश्लेषण खोना पड़ता, जबकि कवक अवशोषी है और उसके पास वह कभी था ही नहीं। जीन-अनुक्रम मामला निपटा देते हैं, और वे कवकों को पादपों से नहीं, प्राणियों के अधिक निकट रखते हैं",
            mr: "मोजलेली प्रत्येक समानता खरी आहे आणि त्यांतली कोणतीही पूर्वजतेचा पुरावा नाही. एका जागी स्थिर राहणे आणि बीजाणूंनी प्रजनन करणे ही सारख्या जीवनशैलीने लादलेली अभिसरणे, आणि पेशीभित्तिका वेगळ्या पदार्थांच्या — कवकात कायटिन, वनस्पतीत सेल्युलोज. निर्णायक लक्षण म्हणजे पोषण: वनस्पती स्वयंपोषी आणि तिला प्रकाशसंश्लेषण गमवावे लागले असते, तर कवक शोषक आणि त्याच्याकडे ते कधी होतेच नाही. जनुक-अनुक्रम प्रकरण निकाली काढतात, आणि ते कवकांना वनस्पतींहून प्राण्यांच्या अधिक जवळ ठेवतात",
          },
          {
            en: "The student is right: fungi were classified with plants for centuries, and that classification was never overturned",
            hi: "विद्यार्थी सही है: कवक सदियों तक पादपों के साथ वर्गीकृत रहे, और वह वर्गीकरण कभी पलटा नहीं गया",
            mr: "विद्यार्थी बरोबर: कवक शतकानुशतके वनस्पतींसोबत वर्गीकृत राहिली, आणि ते वर्गीकरण कधीच उलटवले गेले नाही",
          },
          {
            en: "The student is wrong because fungi are animals: they are heterotrophic, and heterotrophy is what defines the animal kingdom",
            hi: "विद्यार्थी ग़लत है क्योंकि कवक प्राणी हैं: वे परपोषी हैं, और परपोषण ही प्राणी जगत को परिभाषित करता है",
            mr: "विद्यार्थी चुकीचा कारण कवक हे प्राणी आहेत: ते परपोषी आहेत, आणि परपोषण हेच प्राणिसृष्टी परिभाषित करते",
          },
          {
            en: "The student is wrong because fungi have no cell walls at all, which is the single character separating them from plants",
            hi: "विद्यार्थी ग़लत है क्योंकि कवकों में कोशिका भित्तियाँ होती ही नहीं, और यही इकलौता लक्षण है जो उन्हें पादपों से अलग करता है",
            mr: "विद्यार्थी चुकीचा कारण कवकांना पेशीभित्तिका असतच नाहीत, आणि हेच एकमेव लक्षण त्यांना वनस्पतींपासून वेगळे करते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student has done something a scientist does too, which is why the error is worth taking seriously rather than simply marking wrong: they have collected shared characters and inferred relationship. The problem is that shared characters come in two kinds and only one of them is evidence of ancestry. Take the three in turn. Being fixed in place is a consequence of how an organism feeds. Anything that gets its food by absorbing it from the material it sits in has no reason to move and every reason to spread through that material instead. A plant absorbing water from soil and a fungus absorbing sugars from a rotting log arrive at the same sedentary habit from completely different chemistries. This is convergence — similarity produced by similar selection, not by common descent — and it is the standard trap in classification by appearance. Reproduction by spores is the same story. A spore is simply a small, tough, dispersible unit, and anything that cannot carry its offspring anywhere needs one. Ferns, mosses, fungi and some bacteria all make spores, and they are not close relatives; the wind is the common factor, not the ancestor. The cell wall is the most instructive of the three, because here the resemblance dissolves the moment you ask what the wall is made of. A plant's wall is cellulose, a polymer of glucose. A fungus's wall is chitin, a polymer of a nitrogen-containing sugar — the same substance that stiffens the shell of a beetle and the shell of a prawn. Two walls that look alike under a microscope are built from different materials by different enzymes, and a shared function with unshared chemistry is the signature of convergence rather than inheritance. Now the character that actually classifies. Whittaker's criteria are cell type, body organisation, nutrition and reproduction, and nutrition is where fungi and plants part. A plant is autotrophic; it makes organic carbon from carbon dioxide using light. A fungus is heterotrophic by absorption; it secretes enzymes onto its food, digests it outside the body and drinks the products. For the student's story to be true, fungi would have to have descended from photosynthetic ancestors and lost the machinery. Some organisms genuinely have done this — several parasitic plants have lost photosynthesis and remain plants — but fungi show no trace of ever having had it: no relict chloroplast genome, no vestigial pigment pathway. And the modern evidence settles it in the opposite direction. Ribosomal RNA and whole-genome comparisons place fungi and animals together as opisthokonts, a group sharing a single posterior flagellum in their motile cells, and place plants on a separate branch. A mushroom really is a closer relative of yours than of the grass it is growing in. The lesson generalises to the whole of taxonomy: characters must be weighed rather than counted, and the ones that count are those unlikely to have arisen twice. (The second answer treats an old classification as authority when the chapter is about why it was overturned; the third jumps to the other kingdom while ignoring the ingestive-against-absorptive distinction; and the fourth states something factually false, since a fungal wall is one of the most conspicuous things about a fungus.)",
          hi: "विद्यार्थी ने वही किया है जो वैज्ञानिक भी करता है, इसीलिए यह भूल केवल ग़लत ठहराने के बजाय गंभीरता से लेने योग्य है: उसने साझा लक्षण जुटाकर संबंध का अनुमान लगाया। समस्या यह है कि साझा लक्षण दो क़िस्मों के होते हैं और उनमें से केवल एक पूर्वजता का प्रमाण है। तीनों को बारी-बारी लो। एक जगह जमे रहना इस बात का परिणाम है कि जीव खाता कैसे है। जो भी अपना भोजन उसी पदार्थ से सोखकर पाता है जिसमें वह बैठा है, उसके पास हिलने का कोई कारण नहीं और उस पदार्थ में फैलने का हर कारण। मिट्टी से पानी सोखता पादप और सड़ते लट्ठे से शर्कराएँ सोखता कवक बिलकुल भिन्न रसायनों से उसी स्थिर आदत पर पहुँचते हैं। यह अभिसरण है — समान वरण से बनी समानता, साझा वंशज से नहीं — और रूप से वर्गीकरण का यही मानक जाल है। बीजाणुओं से जनन वही कहानी है। बीजाणु बस छोटी, कठोर, बिखर सकने वाली इकाई है, और जो अपनी संतान को कहीं ले नहीं जा सकता उसे वह चाहिए। फ़र्न, मॉस, कवक और कुछ जीवाणु सब बीजाणु बनाते हैं, और वे निकट संबंधी नहीं; साझा कारक हवा है, पूर्वज नहीं। तीनों में सबसे शिक्षाप्रद कोशिका भित्ति है, क्योंकि यहाँ समानता उसी क्षण घुल जाती है जब तुम पूछते हो कि भित्ति बनी किससे है। पादप की भित्ति सेलुलोस है, ग्लूकोज़ का बहुलक। कवक की भित्ति काइटिन है, नाइट्रोजनयुक्त शर्करा का बहुलक — वही पदार्थ जो भृंग के कवच और झींगे के कवच को कड़ा करता है। सूक्ष्मदर्शी में एक जैसी दिखती दो भित्तियाँ भिन्न एंज़ाइमों से भिन्न पदार्थों की बनी हैं, और असाझा रसायन के साथ साझा कार्य वंशागति नहीं, अभिसरण की पहचान है। अब वह लक्षण जो वस्तुतः वर्गीकृत करता है। व्हिटेकर की कसौटियाँ हैं कोशिका-प्रकार, शरीर-संगठन, पोषण और जनन, और पोषण ही वह जगह है जहाँ कवक और पादप अलग होते हैं। पादप स्वपोषी है; वह प्रकाश से कार्बन डाइऑक्साइड से कार्बनिक कार्बन बनाता है। कवक अवशोषण से परपोषी है; वह अपने भोजन पर एंज़ाइम छोड़ता है, उसे शरीर के बाहर पचाता है और उत्पाद पी लेता है। विद्यार्थी की कहानी सच होने के लिए कवकों को प्रकाश-संश्लेषी पूर्वजों से उतरा होना पड़ता और मशीनरी खोई होती। कुछ जीवों ने सचमुच ऐसा किया है — कई परजीवी पादपों ने प्रकाश-संश्लेषण खोया है और पादप ही बने हुए हैं — पर कवकों में उसका कोई निशान नहीं कि वह कभी था: न कोई अवशिष्ट हरितलवक जीनोम, न कोई अवशेषी वर्णक-पथ। और आधुनिक प्रमाण मामला उलटी दिशा में निपटाते हैं। राइबोसोमी RNA और पूरे जीनोम की तुलनाएँ कवकों और प्राणियों को साथ रखती हैं, ऑपिस्थोकोंट के रूप में, ऐसा समूह जो अपनी गतिशील कोशिकाओं में एक ही पश्च कशाभिका साझा करता है, और पादपों को अलग शाखा पर रखती हैं। कुकुरमुत्ता सचमुच तुम्हारा उतना ही निकट संबंधी है जितना उस घास का नहीं जिसमें वह उग रहा है। सीख पूरी वर्गिकी पर लागू होती है: लक्षण गिने नहीं, तौले जाने चाहिए, और गिनती के वही हैं जिनका दो बार उठ आना असंभाव्य हो। (दूसरा उत्तर पुराने वर्गीकरण को प्रमाण मान लेता है जबकि अध्याय इसी पर है कि वह क्यों पलटा गया; तीसरा निगलने बनाम अवशोषण का भेद अनदेखा कर दूसरे जगत में कूद जाता है; और चौथा तथ्यतः झूठी बात कहता है, क्योंकि कवक की भित्ति कवक की सबसे स्पष्ट चीज़ों में है।)",
          mr: "विद्यार्थ्याने तेच केले आहे जे शास्त्रज्ञही करतो, म्हणूनच ही चूक केवळ चुकीची ठरवण्याऐवजी गांभीर्याने घेण्याजोगी: त्याने सामायिक लक्षणे जमवून नाते अनुमानले. अडचण अशी की सामायिक लक्षणे दोन प्रकारची असतात आणि त्यांतले केवळ एकच पूर्वजतेचा पुरावा. तिन्ही एकेक करून घ्या. एका जागी स्थिर राहणे हा सजीव खातो कसा याचा परिणाम. जो आपले अन्न ज्या पदार्थात बसला आहे त्यातूनच शोषून मिळवतो, त्याला हलण्याचे कारण नाही आणि त्या पदार्थात पसरण्याचे प्रत्येक कारण. मातीतून पाणी शोषणारी वनस्पती आणि कुजणाऱ्या ओंडक्यातून साखरा शोषणारे कवक पूर्णपणे वेगळ्या रसायनांतून त्याच स्थिर सवयीवर पोहोचतात. हे अभिसरण — सारख्या निवडीने बनलेली समानता, सामायिक वंशजाने नव्हे — आणि दिसण्यावरून वर्गीकरणाचा हाच प्रमाणित सापळा. बीजाणूंनी प्रजनन ही तीच कथा. बीजाणू म्हणजे फक्त लहान, कठीण, विखुरता येणारे एकक, आणि जो आपली संतती कुठे नेऊ शकत नाही त्याला ते लागते. नेचे, शेवाळे, कवके आणि काही जीवाणू सर्व बीजाणू बनवतात, आणि ते जवळचे नातेवाईक नाहीत; सामायिक घटक वारा आहे, पूर्वज नव्हे. तिघांतले सर्वांत शिकवणारे म्हणजे पेशीभित्तिका, कारण इथे साम्य त्याच क्षणी विरघळते जेव्हा तुम्ही विचारता की भित्तिका कशाची बनली आहे. वनस्पतीची भित्तिका सेल्युलोज, ग्लुकोजचे बहुवारिक. कवकाची भित्तिका कायटिन, नायट्रोजनयुक्त साखरेचे बहुवारिक — तेच द्रव्य जे भुंग्याचे कवच आणि कोळंबीचे कवच कडक करते. सूक्ष्मदर्शकात सारख्या दिसणाऱ्या दोन भित्तिका वेगळ्या एंझाइमांनी वेगळ्या पदार्थांच्या बनलेल्या, आणि असामायिक रसायनासह सामायिक कार्य ही अनुवंशाची नव्हे, अभिसरणाची ओळख. आता ते लक्षण जे प्रत्यक्षात वर्गीकृत करते. व्हिटेकरच्या कसोट्या म्हणजे पेशी-प्रकार, शरीर-संघटन, पोषण आणि प्रजनन, आणि पोषण हीच ती जागा जिथे कवक आणि वनस्पती वेगळे होतात. वनस्पती स्वयंपोषी; ती प्रकाशाने कार्बन डायऑक्साइडपासून कार्बनी कार्बन बनवते. कवक शोषणाने परपोषी; ते आपल्या अन्नावर एंझाइम सोडते, ते शरीराबाहेर पचवते आणि उत्पादे पिते. विद्यार्थ्याची कथा खरी असण्यासाठी कवकांना प्रकाशसंश्लेषी पूर्वजांपासून उतरावे लागले असते आणि यंत्रणा गमवावी लागली असती. काही सजीवांनी खरोखर असे केले आहे — अनेक परजीवी वनस्पतींनी प्रकाशसंश्लेषण गमावले आहे आणि त्या वनस्पतीच राहिल्या आहेत — पण कवकांत ते कधी होते याचा कोणताही मागमूस नाही: ना उरलेला हरितलवक जीनोम, ना अवशेषी रंगद्रव्य-मार्ग. आणि आधुनिक पुरावा प्रकरण उलट दिशेने निकाली काढतो. रायबोसोमी RNA आणि अख्ख्या जीनोमच्या तुलना कवके आणि प्राणी यांना एकत्र ठेवतात, ऑपिस्थोकाँट म्हणून, असा गट जो आपल्या गतिशील पेशींत एकच पश्च कशाभिका वाटून घेतो, आणि वनस्पतींना वेगळ्या फांदीवर ठेवतात. अळिंब खरोखर तुमचे तितकेच जवळचे नातेवाईक आहे जितके ते ज्या गवतात उगवत आहे त्याचे नाही. धडा अख्ख्या वर्गीकरणशास्त्राला लागू: लक्षणे मोजली नव्हे, तोलली जावीत, आणि मोजण्याजोगी तीच जी दोनदा उद्भवण्याची शक्यता कमी. (दुसरे उत्तर जुन्या वर्गीकरणाला प्रमाण मानते तर प्रकरण तेच का उलटवले गेले याबद्दल आहे; तिसरे गिळणे विरुद्ध शोषण हा भेद दुर्लक्षून दुसऱ्या सृष्टीत उडी मारते; आणि चौथे वस्तुतः खोटी गोष्ट सांगते, कारण कवकाची भित्तिका ही कवकाची सर्वांत ठळक गोष्टींपैकी एक आहे.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A student writes that the five-kingdom system is the final and correct classification of life. Assess that claim, using the position of Protista and the evidence from ribosomal RNA.",
          hi: "एक विद्यार्थी लिखता है कि पाँच-जगत प्रणाली जीवन का अंतिम और सही वर्गीकरण है। प्रोटिस्टा की स्थिति और राइबोसोमी RNA के प्रमाण से उस दावे का आकलन करो।",
          mr: "एक विद्यार्थी लिहितो की पाच-सृष्टी प्रणाली हे जीवनाचे अंतिम आणि बरोबर वर्गीकरण आहे. प्रोटिस्टाची स्थिती आणि रायबोसोमी RNA च्या पुराव्याने त्या दाव्याचे मूल्यमापन करा.",
        },
        choices: [
          {
            en: "The system was a large improvement and is not final. Protista was defined by what its members are not — not bacteria, not fungi, not plants, not animals — so it collects organisms no more related to one another than a slime mould is to a diatom, and a group defined by exclusion is not a natural group. Ribosomal RNA comparisons then showed that archaebacteria differ from other bacteria as deeply as either differs from us, which splits Monera in two and gives three domains: Bacteria, Archaea and Eukarya. The five kingdoms remain a good teaching scheme, and a classification is a hypothesis that better evidence can revise",
            hi: "प्रणाली बड़ा सुधार थी और अंतिम नहीं है। प्रोटिस्टा उससे परिभाषित हुआ जो उसके सदस्य नहीं हैं — न जीवाणु, न कवक, न पादप, न प्राणी — अतः वह ऐसे जीव जुटाता है जो आपस में उतने ही संबंधी हैं जितने श्लेष्म कवक और डायटम, और बहिष्कार से परिभाषित समूह प्राकृतिक समूह नहीं। फिर राइबोसोमी RNA की तुलनाओं ने दिखाया कि आर्किबैक्टीरिया दूसरे जीवाणुओं से उतने ही गहरे भिन्न हैं जितने दोनों में से कोई हमसे, जो मोनेरा को दो में तोड़ देता है और तीन डोमेन देता है: बैक्टीरिया, आर्किया और यूकैरिया। पाँच जगत अच्छी शिक्षण-योजना बने हुए हैं, और वर्गीकरण एक परिकल्पना है जिसे बेहतर प्रमाण संशोधित कर सकता है",
            mr: "प्रणाली मोठी सुधारणा होती आणि अंतिम नाही. प्रोटिस्टा तिचे सदस्य काय नाहीत त्यावरून परिभाषित झाला — ना जीवाणू, ना कवक, ना वनस्पती, ना प्राणी — म्हणून तो असे सजीव जमवतो जे परस्परांशी तितकेच नातेवाईक जितके श्लेष्मकवक आणि डायटम, आणि वगळण्याने परिभाषित गट हा नैसर्गिक गट नव्हे. मग रायबोसोमी RNA च्या तुलनांनी दाखवले की आर्किबॅक्टेरिया इतर जीवाणूंहून तितकेच खोलवर वेगळे जितके दोघांपैकी कोणीही आपल्याहून, जे मोनेराचे दोन तुकडे करते आणि तीन क्षेत्रे देते: बॅक्टेरिया, आर्किया आणि युकॅरिया. पाच सृष्टी ही चांगली शिकवणी-योजना राहते, आणि वर्गीकरण ही एक परिकल्पना आहे जिला अधिक चांगला पुरावा सुधारू शकतो",
          },
          {
            en: "The student is right: the five kingdoms are settled science, and the three-domain proposal was considered and rejected",
            hi: "विद्यार्थी सही है: पाँच जगत निपटा हुआ विज्ञान हैं, और तीन-डोमेन प्रस्ताव पर विचार कर उसे अस्वीकार किया जा चुका है",
            mr: "विद्यार्थी बरोबर: पाच सृष्टी हे निकाली विज्ञान, आणि तीन-क्षेत्र प्रस्तावाचा विचार करून तो नाकारला गेला आहे",
          },
          {
            en: "The student is wrong because classification is arbitrary throughout, so no scheme is better than any other and the five kingdoms are as good as anything else",
            hi: "विद्यार्थी ग़लत है क्योंकि वर्गीकरण आद्योपांत मनमाना है, अतः कोई योजना दूसरी से बेहतर नहीं और पाँच जगत किसी भी और जितने ही अच्छे हैं",
            mr: "विद्यार्थी चुकीचा कारण वर्गीकरण आद्यंत मनमानी आहे, म्हणून कोणतीही योजना दुसरीहून चांगली नाही आणि पाच सृष्टी इतर कशाइतक्याच चांगल्या",
          },
          {
            en: "The student is wrong because ribosomal RNA showed that fungi belong inside Plantae, which reduces the scheme to four kingdoms",
            hi: "विद्यार्थी ग़लत है क्योंकि राइबोसोमी RNA ने दिखाया कि कवक पादप जगत के भीतर आते हैं, जिससे योजना घटकर चार जगत रह जाती है",
            mr: "विद्यार्थी चुकीचा कारण रायबोसोमी RNA ने दाखवले की कवक वनस्पतिसृष्टीच्या आत येतात, ज्याने योजना घटून चार सृष्टी उरतात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Two things have to be held at once here, and a good answer refuses to drop either. The five-kingdom system was a real advance, and it is not the last word. Start with what it fixed. The two-kingdom scheme sorted by appearance and habit, so it put fungi with plants because neither moves, and bacteria with plants because both have walls. Whittaker replaced habit with four internal criteria — cell type, body organisation, mode of nutrition and reproduction — and the improvement is immediate: fungi separate from plants on nutrition and wall chemistry, and the prokaryotes separate from everything else on cell type, which is the deepest distinction in biology. Now the weakness the student's claim has to survive. Protista is defined negatively. Its members are eukaryotes that are not fungi, not plants and not animals, and defining a group by what it excludes guarantees nothing about what it includes. Look at what is in it: Amoeba, Paramecium, Euglena, diatoms, dinoflagellates, slime moulds. Some are autotrophic, some heterotrophic, some both by turns; some have cell walls of silica, some none at all; some are more closely related to animals than to other protists, and some are nearer to plants. Genetically, the distance across Protista is greater than the distance from a mushroom to a human. A group like this is called paraphyletic — it contains an ancestor but not all of its descendants — and it is a filing convenience, not a natural unit. Then the evidence that reopened the question at the other end. Carl Woese in the 1970s compared the sequence of the small ribosomal RNA subunit across organisms, a molecule chosen because every cell has it, it does the same job everywhere, and it changes slowly enough to record ancient events. The result was not expected. Organisms then filed as bacteria fell into two groups as different from each other as either was from eukaryotes. The archaea share features with bacteria — no nucleus, small size — and other features with us: their transcription machinery, their histone-like proteins, their membrane chemistry. Monera therefore is not one kingdom but two, and the top-level division of life became three domains: Bacteria, Archaea and Eukarya. Notice the shape of this argument, because it is what makes the answer more than a list. Both problems have the same root: Whittaker's scheme was built on characters that can be observed under a microscope, and molecular sequences supply a kind of evidence that observation cannot. A character you can see may be convergent; a shared sequence of a slowly changing gene is far harder to arrive at twice. So what should a student conclude? Not that the five kingdoms are wrong. They remain a sound teaching framework, they organise the observable characters faithfully, and every NCERT question about nutrition or cell wall or body organisation is answered inside them. But a classification is a hypothesis about ancestry, and hypotheses are revised when the evidence improves — as this one was in 1969 when microscopy matured, again in the 1970s when sequencing arrived, and again as whole-genome data continue to redraw the branches. A scheme that could never be revised would not be science. (The second answer states the opposite of the historical record; the third slides from fallible to arbitrary, which would make the two-kingdom system as good as any and leave no reason to have changed it; and the fourth reverses the actual molecular finding, which places fungi with animals.)",
          hi: "यहाँ दो बातें एक साथ थामनी पड़ती हैं, और अच्छा उत्तर किसी को गिराने से इनकार करता है। पाँच-जगत प्रणाली असली प्रगति थी, और वह अंतिम शब्द नहीं है। पहले देखो उसने ठीक क्या किया। दो-जगत योजना रूप और आदत से छाँटती थी, अतः उसने कवकों को पादपों के साथ रखा क्योंकि दोनों में से कोई हिलता नहीं, और जीवाणुओं को पादपों के साथ क्योंकि दोनों में भित्तियाँ हैं। व्हिटेकर ने आदत की जगह चार आंतरिक कसौटियाँ रखीं — कोशिका-प्रकार, शरीर-संगठन, पोषण-विधि और जनन — और सुधार तत्काल है: कवक पोषण और भित्ति-रसायन पर पादपों से अलग हो जाते हैं, और प्रोकैरियोट कोशिका-प्रकार पर बाक़ी सबसे, जो जीवविज्ञान का सबसे गहरा भेद है। अब वह दुर्बलता जिससे विद्यार्थी के दावे को बचना है। प्रोटिस्टा ऋणात्मक रूप से परिभाषित है। उसके सदस्य ऐसे यूकैरियोट हैं जो न कवक हैं, न पादप, न प्राणी, और किसी समूह को उससे परिभाषित करना जो वह बाहर रखता है, इस बारे में कुछ भी सुनिश्चित नहीं करता कि वह भीतर क्या रखता है। देखो उसमें है क्या: अमीबा, पैरामीशियम, यूग्लीना, डायटम, डाइनोफ़्लैजेलेट, श्लेष्म कवक। कुछ स्वपोषी, कुछ परपोषी, कुछ बारी-बारी दोनों; कुछ की भित्तियाँ सिलिका की, कुछ में कोई नहीं; कुछ दूसरे प्रोटिस्टों से नहीं, प्राणियों के अधिक निकट, और कुछ पादपों के पास। आनुवंशिक रूप से, प्रोटिस्टा के आर-पार की दूरी कुकुरमुत्ते से मनुष्य तक की दूरी से अधिक है। ऐसे समूह को पैराफ़ाइलेटिक कहते हैं — उसमें पूर्वज है पर उसके सारे वंशज नहीं — और वह फ़ाइल करने की सुविधा है, प्राकृतिक इकाई नहीं। फिर वह प्रमाण जिसने दूसरे सिरे पर प्रश्न फिर खोल दिया। कार्ल वोइज़ ने 1970 के दशक में जीवों के आर-पार छोटी राइबोसोमी RNA उपइकाई का अनुक्रम मिलाया, ऐसा अणु जो इसलिए चुना गया कि हर कोशिका में है, हर जगह वही काम करता है, और इतना धीरे बदलता है कि प्राचीन घटनाएँ दर्ज कर ले। परिणाम अपेक्षित नहीं था। तब तक जीवाणुओं में फ़ाइल किए जीव दो समूहों में गिरे, आपस में उतने ही भिन्न जितने दोनों में से कोई यूकैरियोटों से। आर्किया कुछ लक्षण जीवाणुओं से साझा करते हैं — न केंद्रक, छोटा आकार — और कुछ हमसे: उनकी अनुलेखन मशीनरी, उनके हिस्टोन-सदृश प्रोटीन, उनकी झिल्ली का रसायन। अतः मोनेरा एक नहीं, दो जगत है, और जीवन का शीर्ष-स्तरीय विभाजन तीन डोमेन बन गया: बैक्टीरिया, आर्किया और यूकैरिया। इस तर्क का आकार देखो, क्योंकि वही उत्तर को सूची से अधिक बनाता है। दोनों समस्याओं की जड़ एक है: व्हिटेकर की योजना उन लक्षणों पर बनी थी जो सूक्ष्मदर्शी के नीचे देखे जा सकते हैं, और आणविक अनुक्रम ऐसा प्रमाण देते हैं जो प्रेक्षण दे नहीं सकता। जो लक्षण तुम देख सकते हो वह अभिसारी हो सकता है; धीरे बदलते जीन का साझा अनुक्रम दो बार आ जाना कहीं कठिन है। तो विद्यार्थी को निष्कर्ष क्या निकालना चाहिए? यह नहीं कि पाँच जगत ग़लत हैं। वे ठोस शिक्षण-ढाँचा बने हुए हैं, वे प्रेक्षणीय लक्षणों को ईमानदारी से व्यवस्थित करते हैं, और पोषण या कोशिका भित्ति या शरीर-संगठन पर हर NCERT प्रश्न उन्हीं के भीतर उत्तरित होता है। पर वर्गीकरण पूर्वजता के बारे में एक परिकल्पना है, और प्रमाण बेहतर होने पर परिकल्पनाएँ संशोधित होती हैं — जैसे यह 1969 में हुई जब सूक्ष्मदर्शन परिपक्व हुआ, फिर 1970 के दशक में जब अनुक्रमण आया, और फिर से जब पूरे-जीनोम आँकड़े शाखाएँ नए सिरे से खींचते जा रहे हैं। जो योजना कभी संशोधित न हो सके वह विज्ञान नहीं होगी। (दूसरा उत्तर ऐतिहासिक अभिलेख का उलटा कहता है; तीसरा भ्रांतिशील से मनमाने पर फिसल जाता है, जो दो-जगत प्रणाली को किसी भी और जितना अच्छा बना देता और उसे बदलने का कोई कारण न छोड़ता; और चौथा असली आणविक निष्कर्ष उलट देता है, जो कवकों को प्राणियों के साथ रखता है।)",
          mr: "इथे दोन गोष्टी एकाच वेळी धराव्या लागतात, आणि चांगले उत्तर कोणतीही सोडायला नकार देते. पाच-सृष्टी प्रणाली खरी प्रगती होती, आणि ती शेवटचा शब्द नाही. आधी तिने काय दुरुस्त केले ते पाहा. दोन-सृष्टी योजना दिसणे आणि सवयीने वर्गीकृत करत होती, म्हणून तिने कवकांना वनस्पतींसोबत ठेवले कारण दोघांपैकी कोणीही हलत नाही, आणि जीवाणूंना वनस्पतींसोबत कारण दोघांनाही भित्तिका आहेत. व्हिटेकरने सवयीच्या जागी चार आंतरिक कसोट्या ठेवल्या — पेशी-प्रकार, शरीर-संघटन, पोषण-पद्धत आणि प्रजनन — आणि सुधारणा तात्काळ: कवक पोषण आणि भित्तिका-रसायनावर वनस्पतींपासून वेगळी होतात, आणि प्रोकॅरिओट पेशी-प्रकारावर उरलेल्या सर्वांपासून, जो जीवशास्त्रातील सर्वांत खोल भेद. आता ती कमजोरी जिच्यातून विद्यार्थ्याच्या दाव्याला वाचायचे आहे. प्रोटिस्टा ऋणात्मकपणे परिभाषित आहे. त्याचे सदस्य असे युकॅरिओट जे ना कवक, ना वनस्पती, ना प्राणी, आणि एखाद्या गटाला तो काय वगळतो त्यावरून परिभाषित करणे, तो आत काय ठेवतो याबद्दल काहीही निश्चित करत नाही. त्यात काय आहे ते पाहा: अमिबा, पॅरामिशियम, युग्लीना, डायटम, डायनोफ्लॅजेलेट, श्लेष्मकवके. काही स्वयंपोषी, काही परपोषी, काही आळीपाळीने दोन्ही; काहींच्या भित्तिका सिलिकाच्या, काहींना कोणत्याच नाहीत; काही इतर प्रोटिस्टांहून प्राण्यांच्या अधिक जवळ, आणि काही वनस्पतींच्या जवळ. अनुवंशिकदृष्ट्या, प्रोटिस्टापलीकडचे अंतर अळिंबापासून माणसापर्यंतच्या अंतराहून अधिक. अशा गटाला पॅराफायलेटिक म्हणतात — त्यात पूर्वज आहे पण त्याचे सर्व वंशज नाहीत — आणि ती फाइल करण्याची सोय आहे, नैसर्गिक एकक नव्हे. मग तो पुरावा ज्याने दुसऱ्या टोकाला प्रश्न पुन्हा उघडला. कार्ल वोजने 1970 च्या दशकात सजीवांपलीकडे लहान रायबोसोमी RNA उपएककाचा अनुक्रम ताडून पाहिला, असा रेणू जो यासाठी निवडला की तो प्रत्येक पेशीत आहे, सर्वत्र तेच काम करतो, आणि इतका सावकाश बदलतो की प्राचीन घटना नोंदवू शकतो. निकाल अपेक्षित नव्हता. तोवर जीवाणूंत फाइल केलेले सजीव दोन गटांत पडले, परस्परांहून तितकेच वेगळे जितके दोघांपैकी कोणीही युकॅरिओटांहून. आर्किया काही लक्षणे जीवाणूंशी वाटून घेतात — केंद्रक नाही, लहान आकार — आणि काही आपल्याशी: त्यांची प्रतिलेखन यंत्रणा, त्यांची हिस्टोनसदृश प्रथिने, त्यांच्या पटलाचे रसायन. म्हणून मोनेरा ही एक नव्हे, दोन सृष्टी, आणि जीवनाची सर्वोच्च फाळणी तीन क्षेत्रे बनली: बॅक्टेरिया, आर्किया आणि युकॅरिया. या युक्तिवादाचा आकार पाहा, कारण तोच उत्तराला यादीहून अधिक बनवतो. दोन्ही अडचणींचे मूळ एकच: व्हिटेकरची योजना सूक्ष्मदर्शकाखाली पाहता येणाऱ्या लक्षणांवर बांधलेली होती, आणि रेणवीय अनुक्रम असा पुरावा देतात जो निरीक्षण देऊ शकत नाही. तुम्ही पाहू शकता ते लक्षण अभिसारी असू शकते; सावकाश बदलणाऱ्या जनुकाचा सामायिक अनुक्रम दोनदा उद्भवणे कितीतरी कठीण. मग विद्यार्थ्याने निष्कर्ष काय काढावा? हा नाही की पाच सृष्टी चुकीच्या आहेत. त्या भक्कम शिकवणी-चौकट राहतात, त्या निरीक्षणीय लक्षणे प्रामाणिकपणे मांडतात, आणि पोषण वा पेशीभित्तिका वा शरीर-संघटनावरचा प्रत्येक NCERT प्रश्न त्यांच्याच आत उत्तरित होतो. पण वर्गीकरण ही पूर्वजतेबद्दलची परिकल्पना, आणि पुरावा सुधारताच परिकल्पना सुधारल्या जातात — जशी ही 1969 मध्ये झाली जेव्हा सूक्ष्मदर्शन परिपक्व झाले, पुन्हा 1970 च्या दशकात जेव्हा अनुक्रमण आले, आणि पुन्हा अख्ख्या-जीनोमची माहिती फांद्या नव्याने आखत असताना. जी योजना कधीच सुधारता येणार नाही ती विज्ञान नसेल. (दुसरे उत्तर ऐतिहासिक नोंदीच्या उलट सांगते; तिसरे चुकण्याजोग्यावरून मनमानीवर घसरते, जे दोन-सृष्टी प्रणालीला इतर कशाइतकीच चांगली ठरवेल आणि ती बदलण्याचे कोणतेही कारण उरवणार नाही; आणि चौथे खरा रेणवीय निष्कर्ष उलटवते, जो कवकांना प्राण्यांसोबत ठेवतो.)",
        },
      },
      /*H2B*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Plant Kingdom                                               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-11-plant-kingdom",
    subject: "BIOLOGY",
    classLevel: 11,
    chapter: {
      en: "Chapter 3 — Plant Kingdom",
      hi: "अध्याय 3 — वनस्पति जगत",
      mr: "प्रकरण 3 — वनस्पतिसृष्टी",
    },
    name: {
      en: "Plant Kingdom",
      hi: "वनस्पति जगत",
      mr: "वनस्पतिसृष्टी",
    },
    summary: {
      en: "The whole history of plants on land is a history of getting free of standing water, and each group marks one step: a moss that must stay small because it has no plumbing, a fern with plumbing but with sperm that still have to swim, a pine that sends its sperm by wind inside a grain of pollen, and a flowering plant that adds a second fertilisation feeding a seed only if fertilisation actually happened.",
      hi: "थल पर पादपों का पूरा इतिहास ठहरे पानी से मुक्त होने का इतिहास है, और हर समूह एक क़दम अंकित करता है: वह मॉस जिसे छोटा रहना ही पड़ता है क्योंकि उसमें नलिकाएँ नहीं, वह फ़र्न जिसमें नलिकाएँ हैं पर जिसके शुक्राणुओं को अब भी तैरना पड़ता है, वह चीड़ जो अपने शुक्राणु पराग-कण के भीतर हवा से भेजता है, और वह सपुष्पक पादप जो दूसरा निषेचन जोड़ता है जो बीज को तभी खिलाता है जब निषेचन वास्तव में हुआ हो।",
      mr: "जमिनीवरील वनस्पतींचा अख्खा इतिहास हा साचलेल्या पाण्यापासून मुक्त होण्याचा इतिहास आहे, आणि प्रत्येक गट एक पाऊल नोंदवतो: ते शेवाळ ज्याला लहानच राहावे लागते कारण त्यात नळ्या नाहीत, तो नेचा ज्यात नळ्या आहेत पण ज्याच्या शुक्राणूंना अजूनही पोहावे लागते, तो पाइन जो आपले शुक्राणू परागकणाच्या आत वाऱ्याने पाठवतो, आणि ती सपुष्प वनस्पती जी दुसरे फलन जोडते जे फलन प्रत्यक्षात झाले असेल तरच बीजाला खाऊ घालते.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "two-generations-in-one-life-cycle",
        name: {
          en: "One life cycle, two different plants",
          hi: "एक जीवन-चक्र, दो भिन्न पादप",
          mr: "एक जीवनचक्र, दोन वेगळ्या वनस्पती",
        },
        kind: "cycle",
        prompt: {
          en: "The green cushion of a moss and the thin stalk with a capsule on top are not two organisms and not two stages of growth; they are two whole plants, one with half the chromosomes of the other. Which pattern is this?",
          hi: "मॉस का हरा गद्दा और ऊपर संपुट लिए पतला डंठल दो जीव नहीं और वृद्धि की दो अवस्थाएँ भी नहीं; वे दो पूरे पादप हैं, एक में दूसरे से आधे गुणसूत्र। यह कौन-सा प्रतिरूप है?",
          mr: "शेवाळाची हिरवी उशी आणि वर बीजपेटी घेतलेला बारीक देठ हे दोन सजीव नाहीत आणि वाढीच्या दोन अवस्थाही नाहीत; त्या दोन अख्ख्या वनस्पती आहेत, एकीत दुसरीच्या निम्मी गुणसूत्रे. हा कोणता आकृतिबंध?",
        },
        statement: {
          en: "A plant's life cycle alternates between a haploid gametophyte that makes gametes by mitosis and a diploid sporophyte that makes spores by meiosis, and the two are separate multicellular plants.",
          hi: "पादप का जीवन-चक्र अगुणित युग्मकोद्भिद और द्विगुणित बीजाणुद्भिद के बीच बारी-बारी चलता है — पहला समसूत्री विभाजन से युग्मक बनाता है, दूसरा अर्धसूत्री विभाजन से बीजाणु — और दोनों अलग बहुकोशिकीय पादप हैं।",
          mr: "वनस्पतीचे जीवनचक्र एकगुणित युग्मकोद्भिद आणि द्विगुणित बीजाणुद्भिद यांच्यात आलटून-पालटून चालते — पहिला समविभाजनाने युग्मक बनवतो, दुसरा अर्धसूत्री विभाजनाने बीजाणू — आणि दोन्ही वेगळ्या बहुपेशीय वनस्पती आहेत.",
        },
        detail: {
          en: "Which of the two is the large, long-lived, independent plant changes across the groups, and that shift is the clearest single storyline in the kingdom.",
          hi: "दोनों में से बड़ा, दीर्घजीवी, स्वतंत्र पादप कौन है, यह समूहों के आर-पार बदलता है, और वही खिसकाव इस जगत की सबसे स्पष्ट इकलौती कथा-रेखा है।",
          mr: "दोघांपैकी मोठी, दीर्घजीवी, स्वतंत्र वनस्पती कोणती हे गटांगणिक बदलते, आणि तोच सरकाव या सृष्टीतील सर्वांत स्पष्ट एकमेव कथासूत्र आहे.",
        },
        extra: {
          en: "Meiosis and fertilisation are the two hinges of the cycle: one halves the chromosome number and the other restores it, so neither generation can be skipped.",
          hi: "अर्धसूत्री विभाजन और निषेचन चक्र के दो कब्ज़े हैं: एक गुणसूत्र संख्या आधी करता है और दूसरा उसे लौटाता है, अतः कोई भी पीढ़ी छोड़ी नहीं जा सकती।",
          mr: "अर्धसूत्री विभाजन आणि फलन ही चक्राची दोन बिजागरे: एक गुणसूत्रसंख्या निम्मी करते आणि दुसरे ती परत आणते, म्हणून कोणतीही पिढी वगळता येत नाही.",
        },
        pair: {
          left: {
            en: "The stalk has twice the chromosomes of the cushion",
            hi: "डंठल में गद्दे से दुगुने गुणसूत्र",
            mr: "देठात उशीच्या दुप्पट गुणसूत्रे",
          },
          right: {
            en: "one life cycle, two different plants",
            hi: "एक जीवन-चक्र, दो भिन्न पादप",
            mr: "एक जीवनचक्र, दोन वेगळ्या वनस्पती",
          },
        },
      },
      {
        id: "the-plant-that-must-stay-low",
        name: {
          en: "The plant with no pipes and no choice",
          hi: "वह पादप जिसमें न नलिकाएँ हैं न विकल्प",
          mr: "नळ्याही नाहीत आणि पर्यायही नाही अशी वनस्पती",
        },
        kind: "group",
        prompt: {
          en: "A carpet on a damp wall is never ankle-high, needs a film of water for its sperm to reach an egg, and has no roots at all — three limitations with a single cause. Which group is this?",
          hi: "नम दीवार पर की चादर कभी टख़ने भर ऊँची नहीं होती, उसके शुक्राणु को अंडे तक पहुँचने को पानी की झिल्ली चाहिए, और उसमें जड़ें होती ही नहीं — एक ही कारण से तीन सीमाएँ। यह कौन-सा समूह है?",
          mr: "ओलसर भिंतीवरची चादर कधीच घोट्याइतकी उंच होत नाही, तिच्या शुक्राणूला अंड्यापर्यंत पोहोचायला पाण्याचा पातळ थर लागतो, आणि तिला मुळेच नसतात — एकाच कारणाने तीन मर्यादा. हा कोणता गट?",
        },
        statement: {
          en: "Bryophytes have no vascular tissue, so water and food move only by diffusion from cell to cell, which limits them to a few centimetres and to damp places, and their dominant generation is the gametophyte.",
          hi: "ब्रायोफ़ाइटों में संवहन ऊतक नहीं, अतः पानी और भोजन केवल कोशिका-से-कोशिका विसरण से चलते हैं, जो उन्हें कुछ सेंटीमीटर और नम स्थानों तक सीमित कर देता है, और उनकी प्रभावी पीढ़ी युग्मकोद्भिद है।",
          mr: "ब्रायोफायटांत वहनऊती नाही, म्हणून पाणी आणि अन्न केवळ पेशी-ते-पेशी विसरणाने चालतात, जे त्यांना काही सेंटिमीटर आणि ओलसर जागांपुरते मर्यादित करते, आणि त्यांची प्रभावी पिढी युग्मकोद्भिद आहे.",
        },
        detail: {
          en: "They anchor with rhizoids rather than roots, and rhizoids hold on without absorbing, which is a different job with a similar look.",
          hi: "वे जड़ों से नहीं, मूलाभासों से टिकते हैं, और मूलाभास बिना अवशोषण किए पकड़ते हैं, जो मिलती-जुलती दिखती अलग नौकरी है।",
          mr: "ते मुळांनी नव्हे, मूलाभासांनी टिकतात, आणि मूलाभास शोषण न करता धरून ठेवतात, जे सारखे दिसणारे वेगळे काम आहे.",
        },
        extra: {
          en: "The sporophyte of a moss is not independent: it grows out of the gametophyte and stays attached to it, drawing its nourishment from the plant below.",
          hi: "मॉस का बीजाणुद्भिद स्वतंत्र नहीं: वह युग्मकोद्भिद से निकलता है और उससे जुड़ा रहता है, नीचे के पादप से अपना पोषण खींचता हुआ।",
          mr: "शेवाळाचा बीजाणुद्भिद स्वतंत्र नाही: तो युग्मकोद्भिदातून निघतो आणि त्याला जोडलेला राहतो, खालच्या वनस्पतीतून आपले पोषण ओढत.",
        },
        pair: {
          left: {
            en: "Diffusion is the only transport there is",
            hi: "परिवहन के नाम पर केवल विसरण",
            mr: "वहनाच्या नावाने केवळ विसरण",
          },
          right: {
            en: "the plant with no pipes and no choice",
            hi: "वह पादप जिसमें न नलिकाएँ हैं न विकल्प",
            mr: "नळ्याही नाहीत आणि पर्यायही नाही अशी वनस्पती",
          },
        },
      },
      {
        id: "pipes-arrive-before-independence-from-water",
        name: {
          en: "Tall at last, and still tied to a puddle",
          hi: "आख़िर ऊँचा, और फिर भी पोखर से बँधा",
          mr: "अखेर उंच, आणि तरीही डबक्याशी बांधलेला",
        },
        kind: "group",
        prompt: {
          en: "A tree fern can stand several metres high, which no moss can manage, and yet it still cannot reproduce in a dry season, so one problem was solved and another was not. Which group is this?",
          hi: "वृक्ष-फ़र्न कई मीटर ऊँचा खड़ा हो सकता है, जो कोई मॉस नहीं कर पाता, फिर भी वह सूखे मौसम में जनन नहीं कर सकता, अतः एक समस्या हल हुई और दूसरी नहीं। यह कौन-सा समूह है?",
          mr: "वृक्ष-नेचा कित्येक मीटर उंच उभा राहू शकतो, जे कोणत्याही शेवाळाला जमत नाही, तरीही तो कोरड्या हंगामात प्रजनन करू शकत नाही, म्हणून एक समस्या सुटली आणि दुसरी नाही. हा कोणता गट?",
        },
        statement: {
          en: "Pteridophytes are the first plants with xylem and phloem, so they can grow tall and have true roots, stems and leaves, but their sperm still swim, so fertilisation needs a film of water.",
          hi: "टेरिडोफ़ाइट पहले पादप हैं जिनमें दारु और पोषवाह हैं, अतः वे ऊँचे बढ़ सकते हैं और उनमें असली जड़ें, तने और पत्तियाँ हैं, पर उनके शुक्राणु अब भी तैरते हैं, अतः निषेचन को पानी की झिल्ली चाहिए।",
          mr: "टेरिडोफायट या पहिल्या वनस्पती ज्यांच्यात जलवाहिनी आणि रसवाहिनी आहेत, म्हणून त्या उंच वाढू शकतात आणि त्यांना खरी मुळे, खोड आणि पाने आहेत, पण त्यांचे शुक्राणू अजूनही पोहतात, म्हणून फलनाला पाण्याचा पातळ थर लागतो.",
        },
        detail: {
          en: "Here the sporophyte is the large independent plant and the gametophyte is a tiny separate structure called a prothallus, which is the reverse of the moss.",
          hi: "यहाँ बीजाणुद्भिद बड़ा स्वतंत्र पादप है और युग्मकोद्भिद एक नन्ही अलग रचना जिसे प्रोथैलस कहते हैं, जो मॉस का उलटा है।",
          mr: "इथे बीजाणुद्भिद ही मोठी स्वतंत्र वनस्पती आणि युग्मकोद्भिद ही प्रोथॅलस नावाची इवली वेगळी रचना, जे शेवाळाच्या उलट आहे.",
        },
        extra: {
          en: "The prothallus is easy to overlook and is the whole reason ferns are confined to shade and moisture, since it is thin, unprotected and dries out at once.",
          hi: "प्रोथैलस पर नज़र न पड़ना आसान है और फ़र्नों के छाया और नमी तक सिमटे रहने का पूरा कारण वही है, क्योंकि वह पतला, असुरक्षित है और तुरंत सूख जाता है।",
          mr: "प्रोथॅलस दुर्लक्षित होणे सोपे आणि नेचे सावली व ओलाव्यापुरते मर्यादित राहण्याचे अख्खे कारण तेच, कारण तो पातळ, असुरक्षित आणि लगेच वाळतो.",
        },
        pair: {
          left: {
            en: "Height solved, sperm still swimming",
            hi: "ऊँचाई हल, शुक्राणु अब भी तैरते",
            mr: "उंची सुटली, शुक्राणू अजूनही पोहत",
          },
          right: {
            en: "tall at last, and still tied to a puddle",
            hi: "आख़िर ऊँचा, और फिर भी पोखर से बँधा",
            mr: "अखेर उंच, आणि तरीही डबक्याशी बांधलेला",
          },
        },
      },
      {
        id: "sperm-delivered-without-water",
        name: {
          en: "The grain that carries sperm on the wind",
          hi: "वह कण जो शुक्राणु हवा पर ढोता है",
          mr: "वाऱ्यावर शुक्राणू वाहणारा तो कण",
        },
        kind: "innovation",
        prompt: {
          en: "A pine forest reproduces through a dry Himalayan winter with no free water anywhere, because the male gamete travels inside a dust-like package that the wind moves for it. Which innovation is this?",
          hi: "चीड़ का वन सूखी हिमालयी सर्दी में जनन करता है जहाँ कहीं मुक्त पानी नहीं, क्योंकि नर युग्मक धूल जैसे पैकेट के भीतर यात्रा करता है जिसे हवा उसके लिए हिलाती है। यह कौन-सी नवाचार है?",
          mr: "पाइनचे जंगल कोरड्या हिमालयी हिवाळ्यात प्रजनन करते जिथे कुठेही मोकळे पाणी नाही, कारण नर युग्मक धुळीसारख्या पुडक्याच्या आत प्रवास करतो जो वारा त्याच्यासाठी हलवतो. हा कोणता नवोन्मेष?",
        },
        statement: {
          en: "Gymnosperms deliver the male gamete inside a pollen grain, which frees fertilisation from standing water, and they bear naked ovules on cones with no ovary around them.",
          hi: "जिम्नोस्पर्म नर युग्मक को पराग-कण के भीतर पहुँचाते हैं, जो निषेचन को ठहरे पानी से मुक्त कर देता है, और वे शंकुओं पर नग्न बीजांड धारण करते हैं जिनके चारों ओर अंडाशय नहीं होता।",
          mr: "जिम्नोस्पर्म नर युग्मक परागकणाच्या आत पोहोचवतात, जे फलनाला साचलेल्या पाण्यापासून मुक्त करते, आणि ते शंकूंवर नग्न बीजांडे धारण करतात ज्यांच्याभोवती अंडाशय नसते.",
        },
        detail: {
          en: "The name says exactly this: a naked seed, sitting exposed on a scale, with no fruit to develop around it because there was no ovary to become one.",
          hi: "नाम ठीक यही कहता है: नग्न बीज, शल्क पर खुला बैठा, जिसके चारों ओर विकसित होने को कोई फल नहीं क्योंकि फल बनने को कोई अंडाशय था ही नहीं।",
          mr: "नाव नेमके हेच सांगते: नग्न बीज, खवल्यावर उघडे बसलेले, ज्याभोवती विकसित व्हायला फळ नाही कारण फळ बनायला अंडाशय होतेच नाही.",
        },
        extra: {
          en: "Freed from water, they colonised cold and dry ground that no fern could hold, which is why the tree line in the Himalaya is conifer and not fern.",
          hi: "पानी से मुक्त होकर उन्होंने ठंडी और सूखी ज़मीन बसा ली जो कोई फ़र्न नहीं थाम सकता था, इसीलिए हिमालय की वृक्ष-रेखा शंकुधारी है, फ़र्न नहीं।",
          mr: "पाण्यापासून मुक्त होऊन त्यांनी थंड आणि कोरडी जमीन वसवली जी कोणताही नेचा धरू शकत नव्हता, म्हणूनच हिमालयातील वृक्षरेषा शंकुधारी आहे, नेचा नव्हे.",
        },
        pair: {
          left: {
            en: "A seed sitting bare on a cone scale",
            hi: "शंकु के शल्क पर नंगा बैठा बीज",
            mr: "शंकूच्या खवल्यावर उघडे बसलेले बीज",
          },
          right: {
            en: "the grain that carries sperm on the wind",
            hi: "वह कण जो शुक्राणु हवा पर ढोता है",
            mr: "वाऱ्यावर शुक्राणू वाहणारा तो कण",
          },
        },
      },
      {
        id: "food-stored-only-if-it-will-be-used",
        name: {
          en: "Provision made only after the order is confirmed",
          hi: "प्रबंध तभी, जब आदेश की पुष्टि हो जाए",
          mr: "मागणी निश्चित झाल्यावरच केलेली तरतूद",
        },
        kind: "innovation",
        prompt: {
          en: "A pine loads food into every ovule whether or not it is ever fertilised; a mango does not, because a second fusion inside the same ovule starts the food store and it only happens if the first fusion did. Which event is this?",
          hi: "चीड़ हर बीजांड में भोजन भर देता है चाहे वह कभी निषेचित हो या न हो; आम ऐसा नहीं करता, क्योंकि उसी बीजांड के भीतर दूसरा संलयन भोजन-भंडार शुरू करता है और वह तभी होता है जब पहला संलयन हुआ हो। यह कौन-सी घटना है?",
          mr: "पाइन प्रत्येक बीजांडात अन्न भरतो, ते कधी फलित होवो वा न होवो; आंबा तसे करत नाही, कारण त्याच बीजांडाच्या आत दुसरे संयोग अन्नसाठा सुरू करते आणि ते पहिले संयोग झाले असेल तरच घडते. ही कोणती घटना?",
        },
        statement: {
          en: "Angiosperms perform double fertilisation: one male gamete fuses with the egg to give the zygote and the other fuses with two polar nuclei to give triploid endosperm, so the seed's food supply is laid down only when an embryo exists.",
          hi: "एंजियोस्पर्म द्विनिषेचन करते हैं: एक नर युग्मक अंड से संलयित होकर युग्मनज देता है और दूसरा दो ध्रुवीय केंद्रकों से संलयित होकर त्रिगुणित भ्रूणपोष, अतः बीज की भोजन-आपूर्ति तभी बिछाई जाती है जब भ्रूण मौजूद हो।",
          mr: "अँजिओस्पर्म द्विफलन करतात: एक नर युग्मक अंड्याशी संयोग पावून युग्मनज देतो आणि दुसरा दोन ध्रुवीय केंद्रकांशी संयोग पावून त्रिगुणित भ्रूणपोष, म्हणून बीजाचा अन्नपुरवठा गर्भ अस्तित्वात असेल तेव्हाच घातला जातो.",
        },
        detail: {
          en: "The endosperm is 3n because it has one set from the male gamete and two from the polar nuclei, which is the only ordinary triploid tissue in a plant's life.",
          hi: "भ्रूणपोष 3n है क्योंकि उसमें एक समुच्चय नर युग्मक से और दो ध्रुवीय केंद्रकों से आते हैं, और पादप के जीवन में यही इकलौता सामान्य त्रिगुणित ऊतक है।",
          mr: "भ्रूणपोष 3n आहे कारण त्यात एक संच नर युग्मकाकडून आणि दोन ध्रुवीय केंद्रकांकडून येतात, आणि वनस्पतीच्या आयुष्यातील हीच एकमेव सामान्य त्रिगुणित ऊती.",
        },
        extra: {
          en: "It is an economy that pays: no food is wasted on ovules that fail, and it is one reason flowering plants outcompeted gymnosperms on most of the land.",
          hi: "यह ऐसी मितव्ययिता है जो लाभ देती है: जो बीजांड विफल हों उन पर भोजन नहीं बरबाद होता, और यही एक कारण है कि सपुष्पक पादपों ने अधिकांश थल पर जिम्नोस्पर्मों को पछाड़ दिया।",
          mr: "ही अशी काटकसर जी फायदा देते: अपयशी बीजांडांवर अन्न वाया जात नाही, आणि हेच एक कारण की सपुष्प वनस्पतींनी बहुतांश जमिनीवर जिम्नोस्पर्मांना मागे टाकले.",
        },
        pair: {
          left: {
            en: "Nothing spent on an ovule that failed",
            hi: "विफल बीजांड पर कुछ ख़र्च नहीं",
            mr: "अपयशी बीजांडावर काहीच खर्च नाही",
          },
          right: {
            en: "provision made only after the order is confirmed",
            hi: "प्रबंध तभी, जब आदेश की पुष्टि हो जाए",
            mr: "मागणी निश्चित झाल्यावरच केलेली तरतूद",
          },
        },
      },
      {
        id: "the-gametophyte-that-shrank-to-nothing",
        name: {
          en: "The generation that shrank to a few cells",
          hi: "वह पीढ़ी जो सिकुड़कर कुछ कोशिकाएँ रह गई",
          mr: "आकसून काही पेशी उरलेली ती पिढी",
        },
        kind: "trend",
        prompt: {
          en: "In a moss it is the whole visible plant, in a fern a thumbnail-sized flake on the soil, and in a flowering plant seven cells hidden inside an ovule. Which trend is this?",
          hi: "मॉस में वह पूरा दिखने वाला पादप है, फ़र्न में मिट्टी पर नाख़ून-भर की परत, और सपुष्पक पादप में बीजांड के भीतर छिपी सात कोशिकाएँ। यह कौन-सी प्रवृत्ति है?",
          mr: "शेवाळात ती अख्खी दिसणारी वनस्पती, नेच्यात मातीवरची नखाएवढी पापुद्री, आणि सपुष्प वनस्पतीत बीजांडाच्या आत लपलेल्या सात पेशी. हा कोणता कल?",
        },
        statement: {
          en: "Across the plant kingdom the gametophyte is progressively reduced and the sporophyte progressively enlarged, until in flowering plants the gametophyte is a handful of cells living entirely inside the sporophyte.",
          hi: "वनस्पति जगत के आर-पार युग्मकोद्भिद क्रमशः घटता जाता है और बीजाणुद्भिद क्रमशः बढ़ता, यहाँ तक कि सपुष्पक पादपों में युग्मकोद्भिद मुट्ठी भर कोशिकाएँ हैं जो पूरी तरह बीजाणुद्भिद के भीतर रहती हैं।",
          mr: "वनस्पतिसृष्टीपलीकडे युग्मकोद्भिद क्रमाक्रमाने घटत जातो आणि बीजाणुद्भिद क्रमाक्रमाने वाढत, इतका की सपुष्प वनस्पतींत युग्मकोद्भिद मूठभर पेशी आहेत ज्या संपूर्णपणे बीजाणुद्भिदाच्या आत राहतात.",
        },
        detail: {
          en: "The reduction is not decay but protection: a gametophyte inside the parent plant cannot dry out, and the plant that carries it can live anywhere.",
          hi: "यह घटाव क्षय नहीं, रक्षा है: जनक पादप के भीतर का युग्मकोद्भिद सूख नहीं सकता, और उसे ढोने वाला पादप कहीं भी जी सकता है।",
          mr: "ही घट क्षय नव्हे, संरक्षण आहे: जनक वनस्पतीच्या आतला युग्मकोद्भिद वाळू शकत नाही, आणि त्याला वाहणारी वनस्पती कुठेही जगू शकते.",
        },
        extra: {
          en: "The trend reads as one continuous answer to one question — how to reproduce away from water — and every group in the chapter is a stage in that answer.",
          hi: "यह प्रवृत्ति एक ही प्रश्न का एक सतत उत्तर पढ़ी जाती है — पानी से दूर जनन कैसे करें — और अध्याय का हर समूह उस उत्तर की एक अवस्था है।",
          mr: "हा कल एकाच प्रश्नाचे एक सलग उत्तर वाचला जातो — पाण्यापासून दूर प्रजनन कसे करावे — आणि प्रकरणातील प्रत्येक गट त्या उत्तराची एक अवस्था आहे.",
        },
        pair: {
          left: {
            en: "Seven cells where a whole plant used to be",
            hi: "जहाँ पूरा पादप था वहाँ सात कोशिकाएँ",
            mr: "जिथे अख्खी वनस्पती होती तिथे सात पेशी",
          },
          right: {
            en: "the generation that shrank to a few cells",
            hi: "वह पीढ़ी जो सिकुड़कर कुछ कोशिकाएँ रह गई",
            mr: "आकसून काही पेशी उरलेली ती पिढी",
          },
        },
      },
      /*F3B*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student says ferns are more advanced than mosses because they are taller, and gymnosperms are more advanced than ferns because they are taller still. Assess this and name the character that actually orders the groups.",
          hi: "एक विद्यार्थी कहता है कि फ़र्न मॉस से अधिक उन्नत हैं क्योंकि वे ऊँचे हैं, और जिम्नोस्पर्म फ़र्नों से अधिक उन्नत क्योंकि वे और भी ऊँचे। इसका आकलन करो और उस लक्षण का नाम लो जो वस्तुतः समूहों को क्रम देता है।",
          mr: "एक विद्यार्थी म्हणतो की नेचे शेवाळांहून अधिक प्रगत कारण ते उंच आहेत, आणि जिम्नोस्पर्म नेच्यांहून अधिक प्रगत कारण ते आणखी उंच. याचे मूल्यमापन करा आणि गटांना प्रत्यक्षात क्रम देणाऱ्या लक्षणाचे नाव सांगा.",
        },
        choices: [
          {
            en: "Height is a symptom and not the character. What orders the groups is independence from external water for fertilisation. A moss has no vascular tissue, so it stays small and its sperm swim. A fern gains xylem and phloem and so gains height, but its sperm still swim and it stays tied to damp shade. A gymnosperm packages the male gamete in pollen and is released from water altogether, which is why conifers hold cold dry ground where no fern can live. Height follows from vascular tissue and is a separate advance from the reproductive one",
            hi: "ऊँचाई लक्षण नहीं, लक्षण-चिह्न है। समूहों को क्रम निषेचन के लिए बाहरी पानी से स्वतंत्रता देती है। मॉस में संवहन ऊतक नहीं, अतः वह छोटा रहता है और उसके शुक्राणु तैरते हैं। फ़र्न दारु और पोषवाह पाता है और इसलिए ऊँचाई पाता है, पर उसके शुक्राणु अब भी तैरते हैं और वह नम छाया से बँधा रहता है। जिम्नोस्पर्म नर युग्मक को पराग में बाँध देता है और पानी से पूरी तरह छूट जाता है, इसीलिए शंकुधारी वह ठंडी सूखी ज़मीन थामे रहते हैं जहाँ कोई फ़र्न जी नहीं सकता। ऊँचाई संवहन ऊतक से निकलती है और जननिक प्रगति से अलग प्रगति है",
            mr: "उंची हे लक्षण नव्हे, लक्षणचिन्ह आहे. गटांना क्रम फलनासाठी बाहेरील पाण्यापासूनचे स्वातंत्र्य देते. शेवाळात वहनऊती नाही, म्हणून ते लहान राहते आणि त्याचे शुक्राणू पोहतात. नेच्याला जलवाहिनी आणि रसवाहिनी मिळते आणि म्हणून उंची मिळते, पण त्याचे शुक्राणू अजूनही पोहतात आणि तो ओलसर सावलीशी बांधलेला राहतो. जिम्नोस्पर्म नर युग्मकाला परागात बांधतो आणि पाण्यापासून पूर्णपणे सुटतो, म्हणूनच शंकुधारी ती थंड कोरडी जमीन धरून राहतात जिथे कोणताही नेचा जगू शकत नाही. उंची वहनऊतीतून निघते आणि प्रजननात्मक प्रगतीहून वेगळी प्रगती आहे",
          },
          {
            en: "The student is right: size is the standard measure of advancement in the plant kingdom, and the groups are arranged by it",
            hi: "विद्यार्थी सही है: वनस्पति जगत में आकार ही उन्नति का मानक माप है, और समूह उसी से क्रमबद्ध हैं",
            mr: "विद्यार्थी बरोबर: वनस्पतिसृष्टीत आकार हेच प्रगतीचे प्रमाणित माप, आणि गट त्यानेच क्रमबद्ध आहेत",
          },
          {
            en: "The student is wrong because gymnosperms are shorter than ferns, so the ordering by height already fails at the last step",
            hi: "विद्यार्थी ग़लत है क्योंकि जिम्नोस्पर्म फ़र्नों से नाटे हैं, अतः ऊँचाई से क्रम अंतिम क़दम पर ही विफल हो जाता है",
            mr: "विद्यार्थी चुकीचा कारण जिम्नोस्पर्म नेच्यांहून बुटके आहेत, म्हणून उंचीने क्रम शेवटच्याच पावलावर अपयशी ठरतो",
          },
          {
            en: "The student is wrong because the groups cannot be ordered at all: each is adapted to its own habitat and no comparison between them is possible",
            hi: "विद्यार्थी ग़लत है क्योंकि समूहों को क्रम दिया ही नहीं जा सकता: हर एक अपने आवास के अनुकूल है और उनके बीच कोई तुलना संभव नहीं",
            mr: "विद्यार्थी चुकीचा कारण गटांना क्रम देताच येत नाही: प्रत्येक आपल्या अधिवासाला अनुकूल आणि त्यांच्यात कोणतीही तुलना शक्य नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student has noticed a real pattern and named the wrong cause. Mosses are small, ferns are larger, conifers are larger again, and that ordering does correspond to the sequence in the chapter. But height is a consequence, and reading it as the criterion hides what the chapter is actually about. Separate the two advances, because they arrive at different times. The first is transport. A bryophyte has no xylem or phloem, so water reaching a cell must have passed through every cell below it by diffusion, and diffusion over more than a few millimetres is hopelessly slow. That single lack fixes everything else about a moss: it stays a few centimetres tall, it lives where it is damp, and it anchors with rhizoids because there is nothing for a root to feed. Pteridophytes acquire xylem and phloem, and the height limit lifts at once — tree ferns reach several metres, and the coal measures were laid down by pteridophyte forests. That is the first advance, and the student has seen it. The second is reproduction, and it does not come with the first. A fern's sperm is flagellate and must swim to the egg across a film of water. So although the fern plant is tall, dry and independent, its gametophyte — the prothallus — is a thin flake lying on the soil, unprotected and dependent on moisture, and the species can only breed where that flake can survive. The fern solved transport and did not solve water dependence, which is exactly why ferns are still confined to shade and humidity while being perfectly capable of size. Gymnosperms solve the second problem. The male gamete is packaged in a pollen grain, a desiccation-proof unit carried by wind, and it is delivered to the ovule directly. No external water is needed at any point. This is what lets conifers hold the Himalayan tree line, the Siberian taiga and dry sandy soils — habitats where a prothallus would die in an hour. Notice that this advance has nothing to do with size. So what is the ordering character? Progressive independence from external water for fertilisation, tracked by the reduction of the gametophyte: an entire visible plant in a moss, a small independent prothallus in a fern, and a few cells enclosed within the parent sporophyte in a seed plant. Read that way, the chapter is one continuous argument rather than a list of four groups. Two cautions are worth adding. First, later does not mean better in any absolute sense — mosses are abundant and successful and have been for 400 million years, and being adapted to damp shade is not a failure. Second, the same trap catches people in the animal kingdom, where size and familiarity are similarly mistaken for advancement. In both kingdoms the informative characters are the ones tied to a problem the organism had to solve. (The second answer keeps size as the criterion, which would make a giant kelp more advanced than a rose; the third disputes a fact rather than the reasoning, and is false besides, since conifers include the tallest trees alive; and the fourth abandons ordering altogether, which cannot be right, because a sequence of solutions to the same problem is genuinely a sequence.)",
          hi: "विद्यार्थी ने असली प्रतिरूप देखा है और ग़लत कारण का नाम लिया है। मॉस छोटे हैं, फ़र्न बड़े, शंकुधारी फिर बड़े, और वह क्रम अध्याय के अनुक्रम से मेल भी खाता है। पर ऊँचाई परिणाम है, और उसे कसौटी पढ़ लेना यह छिपा देता है कि अध्याय वस्तुतः किस बारे में है। दोनों प्रगतियाँ अलग करो, क्योंकि वे भिन्न समय पर आती हैं। पहली है परिवहन। ब्रायोफ़ाइट में दारु या पोषवाह नहीं, अतः किसी कोशिका तक पहुँचता पानी उसके नीचे की हर कोशिका से विसरण द्वारा गुज़रा होगा, और कुछ मिलीमीटर से अधिक पर विसरण निराशाजनक रूप से धीमा है। वह अकेली कमी मॉस के बारे में बाक़ी सब तय कर देती है: वह कुछ सेंटीमीटर ऊँचा रहता है, वहीं रहता है जहाँ नमी हो, और मूलाभासों से टिकता है क्योंकि जड़ को खिलाने को कुछ है ही नहीं। टेरिडोफ़ाइट दारु और पोषवाह पा लेते हैं, और ऊँचाई की सीमा तुरंत उठ जाती है — वृक्ष-फ़र्न कई मीटर तक पहुँचते हैं, और कोयले की परतें टेरिडोफ़ाइट वनों ने बिछाईं। यही पहली प्रगति है, और विद्यार्थी ने उसे देख लिया है। दूसरी है जनन, और वह पहली के साथ नहीं आती। फ़र्न का शुक्राणु कशाभिकायुक्त है और उसे पानी की झिल्ली पार करके अंड तक तैरना पड़ता है। अतः यद्यपि फ़र्न पादप ऊँचा, सूखा और स्वतंत्र है, उसका युग्मकोद्भिद — प्रोथैलस — मिट्टी पर पड़ी पतली परत है, असुरक्षित और नमी पर निर्भर, और जाति केवल वहीं प्रजनन कर सकती है जहाँ वह परत बच सके। फ़र्न ने परिवहन हल किया और पानी-निर्भरता नहीं, ठीक इसीलिए फ़र्न आकार में पूर्णतः सक्षम होते हुए भी छाया और आर्द्रता तक सिमटे हैं। जिम्नोस्पर्म दूसरी समस्या हल करते हैं। नर युग्मक पराग-कण में बँधा है, शुष्कन-रोधी इकाई जिसे हवा ढोती है, और वह सीधे बीजांड तक पहुँचाया जाता है। किसी भी बिंदु पर बाहरी पानी नहीं चाहिए। यही शंकुधारियों को हिमालय की वृक्ष-रेखा, साइबेरियाई टैगा और सूखी रेतीली मिट्टियाँ थामने देता है — ऐसे आवास जहाँ प्रोथैलस एक घंटे में मर जाता। ध्यान दो कि इस प्रगति का आकार से कोई लेना-देना नहीं। तो क्रम देने वाला लक्षण क्या है? निषेचन के लिए बाहरी पानी से क्रमशः स्वतंत्रता, जिसे युग्मकोद्भिद के घटाव से नापा जाता है: मॉस में पूरा दिखने वाला पादप, फ़र्न में छोटा स्वतंत्र प्रोथैलस, और बीजी पादप में जनक बीजाणुद्भिद के भीतर बंद कुछ कोशिकाएँ। ऐसे पढ़ो तो अध्याय चार समूहों की सूची नहीं, एक सतत तर्क है। दो चेतावनियाँ जोड़ने योग्य हैं। पहली, बाद वाला किसी निरपेक्ष अर्थ में बेहतर नहीं होता — मॉस प्रचुर और सफल हैं और 40 करोड़ वर्ष से हैं, और नम छाया के अनुकूल होना विफलता नहीं। दूसरी, वही जाल प्राणी जगत में भी लोगों को पकड़ता है, जहाँ आकार और परिचय को उसी तरह उन्नति समझ लिया जाता है। दोनों जगतों में सूचनाप्रद लक्षण वही हैं जो उस समस्या से बँधे हों जिसे जीव को हल करना पड़ा। (दूसरा उत्तर आकार को कसौटी बनाए रखता है, जो विशाल केल्प को गुलाब से अधिक उन्नत बना देता; तीसरा तर्क का नहीं, तथ्य का विवाद करता है, और वह झूठ भी है, क्योंकि जीवित सबसे ऊँचे वृक्ष शंकुधारियों में हैं; और चौथा क्रम देना ही छोड़ देता है, जो ठीक नहीं हो सकता, क्योंकि एक ही समस्या के समाधानों का अनुक्रम सचमुच अनुक्रम होता है।)",
          mr: "विद्यार्थ्याने खरा आकृतिबंध पाहिला आहे आणि चुकीच्या कारणाचे नाव घेतले आहे. शेवाळे लहान, नेचे मोठे, शंकुधारी पुन्हा मोठे, आणि तो क्रम प्रकरणाच्या अनुक्रमाशी जुळतोही. पण उंची हा परिणाम आहे, आणि तिला कसोटी वाचणे प्रकरण प्रत्यक्षात कशाबद्दल आहे ते झाकते. दोन्ही प्रगती वेगळ्या करा, कारण त्या वेगळ्या वेळी येतात. पहिली म्हणजे वहन. ब्रायोफायटात जलवाहिनी वा रसवाहिनी नाही, म्हणून एखाद्या पेशीपर्यंत पोहोचणारे पाणी तिच्या खालच्या प्रत्येक पेशीतून विसरणाने गेलेले असेल, आणि काही मिलिमीटरहून अधिक अंतरावर विसरण निराशाजनकरीत्या मंद. ती एकटी उणीव शेवाळाबद्दलचे बाकी सर्व ठरवते: ते काही सेंटिमीटर उंच राहते, जिथे ओलावा असेल तिथेच राहते, आणि मूलाभासांनी टिकते कारण मुळाला खाऊ घालायला काहीच नाही. टेरिडोफायटांना जलवाहिनी आणि रसवाहिनी मिळते, आणि उंचीची मर्यादा लगेच उठते — वृक्ष-नेचे कित्येक मीटरपर्यंत पोहोचतात, आणि कोळशाचे थर टेरिडोफायट जंगलांनी घातले. हीच पहिली प्रगती, आणि विद्यार्थ्याने ती पाहिली आहे. दुसरी म्हणजे प्रजनन, आणि ती पहिलीसोबत येत नाही. नेच्याचा शुक्राणू कशाभिकायुक्त आणि त्याला पाण्याचा पातळ थर ओलांडून अंड्यापर्यंत पोहावे लागते. म्हणून नेचा वनस्पती उंच, कोरडी आणि स्वतंत्र असली तरी तिचा युग्मकोद्भिद — प्रोथॅलस — मातीवर पडलेली पातळ पापुद्री, असुरक्षित आणि ओलाव्यावर अवलंबून, आणि जात केवळ तिथेच प्रजनन करू शकते जिथे ती पापुद्री टिकू शकेल. नेच्याने वहन सोडवले आणि पाणी-अवलंबन नाही, नेमके म्हणूनच नेचे आकाराने पूर्णपणे सक्षम असूनही सावली आणि आर्द्रतेपुरते मर्यादित आहेत. जिम्नोस्पर्म दुसरी समस्या सोडवतात. नर युग्मक परागकणात बांधलेला, शुष्कनरोधी एकक जो वारा वाहतो, आणि तो थेट बीजांडापर्यंत पोहोचवला जातो. कोणत्याही टप्प्यावर बाहेरील पाणी लागत नाही. हेच शंकुधारींना हिमालयाची वृक्षरेषा, सायबेरियन तैगा आणि कोरड्या वाळूच्या मृदा धरू देते — असे अधिवास जिथे प्रोथॅलस तासाभरात मेला असता. लक्षात घ्या की या प्रगतीचा आकाराशी काहीही संबंध नाही. मग क्रम देणारे लक्षण कोणते? फलनासाठी बाहेरील पाण्यापासूनचे क्रमाक्रमाने स्वातंत्र्य, जे युग्मकोद्भिदाच्या घटीने मोजले जाते: शेवाळात अख्खी दिसणारी वनस्पती, नेच्यात लहान स्वतंत्र प्रोथॅलस, आणि बीजी वनस्पतीत जनक बीजाणुद्भिदाच्या आत बंद काही पेशी. असे वाचल्यास प्रकरण चार गटांची यादी नव्हे, एक सलग युक्तिवाद आहे. दोन इशारे जोडण्याजोगे. पहिला, नंतरचा कोणत्याही निरपेक्ष अर्थाने चांगला नसतो — शेवाळे विपुल आणि यशस्वी आहेत आणि 40 कोटी वर्षांपासून आहेत, आणि ओलसर सावलीला अनुकूल असणे हे अपयश नव्हे. दुसरा, तोच सापळा प्राणिसृष्टीतही लोकांना पकडतो, जिथे आकार आणि परिचय तसेच प्रगती समजले जातात. दोन्ही सृष्टींत माहितीपूर्ण लक्षणे तीच जी सजीवाला सोडवाव्या लागलेल्या समस्येशी बांधलेली. (दुसरे उत्तर आकाराला कसोटी ठेवते, जे अवाढव्य केल्पला गुलाबाहून अधिक प्रगत ठरवेल; तिसरे युक्तिवादाचा नव्हे, वस्तुस्थितीचा वाद घालते, आणि तेही खोटे आहे, कारण जिवंत सर्वांत उंच वृक्ष शंकुधारींत आहेत; आणि चौथे क्रम देणेच सोडून देते, जे बरोबर असू शकत नाही, कारण एकाच समस्येच्या उपायांचा अनुक्रम खरोखर अनुक्रम असतो.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A student writes that double fertilisation simply makes the seed bigger. Explain what it actually achieves, and why it gives flowering plants an advantage a gymnosperm cannot match.",
          hi: "एक विद्यार्थी लिखता है कि द्विनिषेचन बस बीज को बड़ा कर देता है। बताओ कि वह वस्तुतः क्या हासिल करता है, और क्यों वह सपुष्पक पादपों को ऐसा लाभ देता है जिसकी बराबरी जिम्नोस्पर्म नहीं कर सकता।",
          mr: "एक विद्यार्थी लिहितो की द्विफलन फक्त बीज मोठे करते. ते प्रत्यक्षात काय साधते, आणि सपुष्प वनस्पतींना असा फायदा का देते ज्याची बरोबरी जिम्नोस्पर्म करू शकत नाही, ते समजावा.",
        },
        choices: [
          {
            en: "It ties the making of the food store to the making of the embryo. The second male gamete fuses with two polar nuclei to give triploid endosperm, and that fusion cannot happen unless the first fusion has happened too, so no plant ever stocks an ovule that failed. A gymnosperm builds its food store in the female gametophyte before fertilisation and therefore pays for every ovule whether or not it is used. The advantage is economy of resources per successful seed, not size",
            hi: "वह भोजन-भंडार बनाने को भ्रूण बनाने से बाँध देता है। दूसरा नर युग्मक दो ध्रुवीय केंद्रकों से संलयित होकर त्रिगुणित भ्रूणपोष देता है, और वह संलयन तब तक हो नहीं सकता जब तक पहला संलयन भी न हुआ हो, अतः कोई पादप कभी विफल बीजांड में भंडार नहीं भरता। जिम्नोस्पर्म अपना भोजन-भंडार निषेचन से पहले मादा युग्मकोद्भिद में बनाता है और इसलिए हर बीजांड की क़ीमत चुकाता है चाहे वह काम आए या नहीं। लाभ है प्रति सफल बीज संसाधनों की मितव्ययिता, आकार नहीं",
            mr: "ते अन्नसाठा बनवणे गर्भ बनवण्याशी बांधते. दुसरा नर युग्मक दोन ध्रुवीय केंद्रकांशी संयोग पावून त्रिगुणित भ्रूणपोष देतो, आणि तो संयोग पहिला संयोग झाल्याशिवाय होऊ शकत नाही, म्हणून कोणतीही वनस्पती अपयशी बीजांडात कधीच साठा भरत नाही. जिम्नोस्पर्म आपला अन्नसाठा फलनाआधी मादी युग्मकोद्भिदात बांधतो आणि म्हणून प्रत्येक बीजांडाची किंमत मोजतो, ते वापरले जावो वा न जावो. फायदा म्हणजे प्रति यशस्वी बीज संसाधनांची काटकसर, आकार नव्हे",
          },
          {
            en: "The student is right: the endosperm is extra tissue, so the seed is simply larger and heavier than a gymnosperm's",
            hi: "विद्यार्थी सही है: भ्रूणपोष अतिरिक्त ऊतक है, अतः बीज बस जिम्नोस्पर्म के बीज से बड़ा और भारी होता है",
            mr: "विद्यार्थी बरोबर: भ्रूणपोष ही अतिरिक्त ऊती, म्हणून बीज फक्त जिम्नोस्पर्मच्या बीजाहून मोठे आणि जड असते",
          },
          {
            en: "It doubles the number of embryos, since two fusions must give two zygotes, and twin seedlings are the advantage",
            hi: "वह भ्रूणों की संख्या दुगुनी कर देता है, क्योंकि दो संलयनों से दो युग्मनज बनने चाहिए, और जुड़वाँ अंकुर ही लाभ हैं",
            mr: "ते गर्भांची संख्या दुप्पट करते, कारण दोन संयोगांतून दोन युग्मनज बनायला हवेत, आणि जुळी रोपे हाच फायदा",
          },
          {
            en: "It makes the seed triploid throughout, which raises the chromosome number and therefore the vigour of the whole plant",
            hi: "वह पूरे बीज को त्रिगुणित बना देता है, जो गुणसूत्र संख्या बढ़ाता है और इसलिए पूरे पादप की ओजस्विता",
            mr: "ते अख्खे बीज त्रिगुणित बनवते, जे गुणसूत्रसंख्या वाढवते आणि म्हणून अख्ख्या वनस्पतीची जोम",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student has described what the endosperm is and missed what the timing does, and the timing is the whole point. Set out the sequence in an angiosperm. A pollen tube grows down the style and delivers two male gametes to the embryo sac. One fuses with the egg to give a diploid zygote, the future embryo. The other fuses with the two polar nuclei to give a triploid nucleus, which divides to become the endosperm — the tissue that feeds the seedling. Both fusions come from the same pollen tube and neither happens without it. That is a mechanical guarantee rather than a coincidence: an ovule that is not fertilised gets no endosperm at all, so nothing is stocked into a seed that will never exist. Now put a gymnosperm beside it and the contrast becomes clear. In a pine, the food-storing tissue is the female gametophyte, and it is built up before fertilisation. The tree provisions the ovule and then waits to see whether a pollen grain arrives. In a conifer this wait is long — in many pines more than a year passes between pollination and fertilisation — and every unfertilised ovule represents food and nitrogen already spent on nothing. Wind pollination has low odds by its nature, so this is not a small loss. So the advantage is economy, and it compounds. Because a flowering plant risks nothing on an ovule until it is fertilised, it can afford to make far more ovules than it expects to fill. A single orchid capsule may hold a million ovules, which would be ruinous under the gymnosperm accounting. More ovules mean more chances, and the resources saved on failures can be spent on the successes or on flowering again the same season. Two other consequences are worth seeing. First, the endosperm is genetically part of the offspring, not of the parent — it carries the father's contribution as well as the mother's — so it can be shaped by selection acting on the embryo's own interests, which the maternal tissue of a gymnosperm cannot. Second, endosperm is where a great deal of human food is: the white of a rice grain, the flour of wheat, the flesh of a coconut and its water are all endosperm, so the innovation that saved a plant's resources is also what fills a granary. It is worth naming the general principle, because it recurs across biology. Committing resources before knowing whether they will be used is expensive, and organisms that can delay commitment until a decision point tend to win. The same logic explains why a mammal implants an embryo before investing in a placenta, and why a bird lays a clutch sized to what it can feed rather than to what it can produce. (The second answer confuses the tissue with its timing; the third misreads the second fusion, which produces nutritive tissue and not a second embryo; and the fourth wrongly makes the embryo triploid — the embryo is diploid and only the endosperm is 3n, which is precisely why endosperm ploidy is a standard examination question.)",
          hi: "विद्यार्थी ने वर्णन किया है कि भ्रूणपोष है क्या और चूक गया कि समय क्या करता है, और समय ही पूरी बात है। एंजियोस्पर्म का अनुक्रम रखो। परागनलिका वर्तिका से नीचे बढ़ती है और भ्रूणकोष तक दो नर युग्मक पहुँचाती है। एक अंड से संलयित होकर द्विगुणित युग्मनज देता है, भावी भ्रूण। दूसरा दो ध्रुवीय केंद्रकों से संलयित होकर त्रिगुणित केंद्रक देता है, जो विभाजित होकर भ्रूणपोष बनता है — वह ऊतक जो अंकुर को खिलाता है। दोनों संलयन उसी परागनलिका से आते हैं और उसके बिना कोई नहीं होता। यह संयोग नहीं, यांत्रिक गारंटी है: जो बीजांड निषेचित न हो उसे भ्रूणपोष मिलता ही नहीं, अतः ऐसे बीज में कुछ नहीं भरा जाता जो कभी होगा ही नहीं। अब उसके बग़ल में जिम्नोस्पर्म रखो और अंतर साफ़ हो जाता है। चीड़ में भोजन-संचयी ऊतक मादा युग्मकोद्भिद है, और वह निषेचन से पहले बनाया जाता है। वृक्ष बीजांड में प्रबंध कर देता है और फिर देखता है कि पराग-कण आता है या नहीं। शंकुधारी में यह प्रतीक्षा लंबी है — कई चीड़ों में परागण और निषेचन के बीच एक वर्ष से अधिक बीतता है — और हर अनिषेचित बीजांड ऐसा भोजन और नाइट्रोजन है जो पहले ही व्यर्थ ख़र्च हो चुका। पवन-परागण की संभावनाएँ स्वभाव से कम हैं, अतः यह छोटी हानि नहीं। तो लाभ मितव्ययिता है, और वह चक्रवृद्धि करता है। चूँकि सपुष्पक पादप किसी बीजांड पर निषेचन तक कुछ जोखिम में नहीं डालता, वह उससे कहीं अधिक बीजांड बना सकता है जितने भरने की आशा हो। ऑर्किड का एक संपुट दस लाख बीजांड रख सकता है, जो जिम्नोस्पर्म के हिसाब में विनाशकारी होता। अधिक बीजांड अर्थात अधिक अवसर, और विफलताओं पर बचे संसाधन सफलताओं पर या उसी मौसम में फिर पुष्पन पर ख़र्च हो सकते हैं। दो और परिणाम देखने योग्य हैं। पहला, भ्रूणपोष आनुवंशिक रूप से संतान का हिस्सा है, जनक का नहीं — वह पिता का योगदान भी ढोता है और माता का भी — अतः उस पर वरण भ्रूण के अपने हितों के अनुसार काम कर सकता है, जो जिम्नोस्पर्म के मातृ ऊतक पर नहीं कर सकता। दूसरा, मानव के बहुत-से भोजन भ्रूणपोष ही हैं: चावल के दाने का सफ़ेद भाग, गेहूँ का आटा, नारियल का गूदा और उसका पानी सब भ्रूणपोष हैं, अतः जिस नवाचार ने पादप के संसाधन बचाए वही अन्न-भंडार भी भरता है। सामान्य सिद्धांत का नाम लेना उचित है, क्योंकि वह जीवविज्ञान भर में लौटता है। यह जाने बिना संसाधन लगा देना कि वे काम आएँगे या नहीं महँगा है, और जो जीव निर्णय-बिंदु तक प्रतिबद्धता टाल सकें वे प्रायः जीतते हैं। यही तर्क समझाता है कि स्तनधारी अपरा में निवेश से पहले भ्रूण का रोपण क्यों करता है, और चिड़िया उतने अंडे क्यों देती है जितने वह खिला सके, न कि जितने वह बना सके। (दूसरा उत्तर ऊतक को उसके समय से गड्डमड्ड कर देता है; तीसरा दूसरे संलयन को ग़लत पढ़ता है, जो पोषक ऊतक बनाता है, दूसरा भ्रूण नहीं; और चौथा भ्रूण को ग़लत ढंग से त्रिगुणित बना देता है — भ्रूण द्विगुणित है और केवल भ्रूणपोष 3n है, ठीक इसीलिए भ्रूणपोष की गुणिता मानक परीक्षा-प्रश्न है।)",
          mr: "विद्यार्थ्याने भ्रूणपोष काय आहे याचे वर्णन केले आहे आणि वेळ काय करते ते चुकवले आहे, आणि वेळच अख्खा मुद्दा आहे. अँजिओस्पर्ममधला अनुक्रम मांडा. परागनलिका कुक्षिवृंतातून खाली वाढते आणि भ्रूणकोशापर्यंत दोन नर युग्मक पोहोचवते. एक अंड्याशी संयोग पावून द्विगुणित युग्मनज देतो, भावी गर्भ. दुसरा दोन ध्रुवीय केंद्रकांशी संयोग पावून त्रिगुणित केंद्रक देतो, जो विभागून भ्रूणपोष बनतो — ती ऊती जी रोपाला खाऊ घालते. दोन्ही संयोग त्याच परागनलिकेतून येतात आणि तिच्याविना कोणताही होत नाही. हा योगायोग नव्हे, यांत्रिक हमी आहे: जे बीजांड फलित होत नाही त्याला भ्रूणपोष मिळतच नाही, म्हणून कधीच अस्तित्वात न येणाऱ्या बीजात काहीच भरले जात नाही. आता त्याच्या शेजारी जिम्नोस्पर्म ठेवा आणि फरक स्पष्ट होतो. पाइनमध्ये अन्नसाठवणारी ऊती म्हणजे मादी युग्मकोद्भिद, आणि ती फलनाआधी बांधली जाते. वृक्ष बीजांडात तरतूद करतो आणि मग परागकण येतो का ते पाहतो. शंकुधारीत ही वाट लांब — अनेक पाइनांत परागण आणि फलन यांच्यात वर्षाहून अधिक काळ जातो — आणि प्रत्येक अफलित बीजांड म्हणजे आधीच फुकट खर्चलेले अन्न आणि नायट्रोजन. वारा-परागणाची शक्यता स्वभावतःच कमी, म्हणून ही लहान हानी नाही. म्हणून फायदा म्हणजे काटकसर, आणि ती चक्रवाढीने वाढते. सपुष्प वनस्पती फलनापर्यंत कोणत्याही बीजांडावर काहीही धोक्यात घालत नसल्याने, ती भरण्याची अपेक्षा असेल त्याहून कितीतरी अधिक बीजांडे बनवू शकते. ऑर्किडची एक बीजपेटी दहा लाख बीजांडे धरू शकते, जे जिम्नोस्पर्मच्या हिशेबात विनाशकारी ठरले असते. अधिक बीजांडे म्हणजे अधिक संधी, आणि अपयशांवर वाचलेली संसाधने यशांवर वा त्याच हंगामात पुन्हा फुलण्यावर खर्चता येतात. आणखी दोन परिणाम पाहण्याजोगे. पहिला, भ्रूणपोष अनुवंशिकदृष्ट्या संततीचा भाग आहे, जनकाचा नव्हे — तो वडिलांचे योगदानही वाहतो आणि आईचेही — म्हणून त्यावर निवड गर्भाच्या स्वतःच्या हितानुसार काम करू शकते, जी जिम्नोस्पर्मच्या मातृ ऊतीवर करू शकत नाही. दुसरा, माणसाचे बरेच अन्न भ्रूणपोषच आहे: तांदळाच्या दाण्याचा पांढरा भाग, गव्हाचे पीठ, नारळाचा गर आणि त्याचे पाणी सर्व भ्रूणपोष, म्हणून ज्या नवोन्मेषाने वनस्पतीची संसाधने वाचवली तोच धान्याचे कोठारही भरतो. सामान्य तत्त्वाचे नाव घेणे योग्य, कारण ते जीवशास्त्रभर परतते. ती वापरली जातील की नाही हे कळण्याआधी संसाधने गुंतवणे महाग आहे, आणि जे सजीव निर्णय-बिंदूपर्यंत बांधिलकी लांबवू शकतात ते बहुधा जिंकतात. तोच तर्क समजावतो की सस्तन प्राणी वारेत गुंतवणुकीआधी गर्भाचे रोपण का करतो, आणि पक्षी तितकीच अंडी का घालतो जितकी तो खाऊ घालू शकेल, तो बनवू शकेल तितकी नव्हे. (दुसरे उत्तर ऊतीला तिच्या वेळेशी गोंधळवते; तिसरे दुसरा संयोग चुकीचा वाचते, जो पोषक ऊती बनवतो, दुसरा गर्भ नव्हे; आणि चौथे गर्भाला चुकीच्या पद्धतीने त्रिगुणित बनवते — गर्भ द्विगुणित आहे आणि केवळ भ्रूणपोष 3n आहे, नेमके म्हणूनच भ्रूणपोषाची गुणिता हा प्रमाणित परीक्षा-प्रश्न आहे.)",
        },
      },
      /*H3B*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — Animal Kingdom                                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-11-animal-kingdom",
    subject: "BIOLOGY",
    classLevel: 11,
    chapter: {
      en: "Chapter 4 — Animal Kingdom",
      hi: "अध्याय 4 — प्राणि जगत",
      mr: "प्रकरण 4 — प्राणिसृष्टी",
    },
    name: {
      en: "Animal Kingdom",
      hi: "प्राणि जगत",
      mr: "प्राणिसृष्टी",
    },
    summary: {
      en: "Animals are not sorted by what they look like or where they live but by a short list of features fixed early in the embryo and impossible to change afterwards: how many layers the body is built from, whether there is a cavity between gut and wall, which end of the gut forms first, and whether the body repeats itself in units — and each of these decides what an animal can afford to become.",
      hi: "प्राणी इस बात से नहीं छाँटे जाते कि वे कैसे दिखते हैं या कहाँ रहते हैं, बल्कि उन थोड़े-से लक्षणों से जो भ्रूण में जल्दी तय हो जाते हैं और बाद में बदले नहीं जा सकते: शरीर कितनी परतों से बना है, आँत और भित्ति के बीच गुहा है या नहीं, आँत का कौन-सा सिरा पहले बनता है, और शरीर अपने आप को खंडों में दोहराता है या नहीं — और इनमें से हर एक तय करता है कि प्राणी क्या बन पाने का ख़र्च उठा सकता है।",
      mr: "प्राणी ते कसे दिसतात वा कुठे राहतात यावरून वर्गीकृत होत नाहीत, तर गर्भात लवकर ठरणाऱ्या आणि नंतर बदलता न येणाऱ्या थोड्या लक्षणांवरून: शरीर किती थरांपासून बनले आहे, आतडे आणि भिंत यांच्यात पोकळी आहे का, आतड्याचे कोणते टोक आधी बनते, आणि शरीर स्वतःची खंडांत पुनरावृत्ती करते का — आणि यांतले प्रत्येक ठरवते की प्राणी काय बनण्याचा खर्च पेलू शकतो.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "how-many-layers-the-body-is-built-from",
        name: {
          en: "How many layers the builder started with",
          hi: "निर्माता ने कितनी परतों से शुरू किया",
          mr: "बांधणाऱ्याने किती थरांनी सुरुवात केली",
        },
        kind: "criterion",
        prompt: {
          en: "A jellyfish has an outside and an inside and jelly between them with almost no cells; an earthworm has a third true layer there, and that layer is what muscle, bone, blood and kidney are made from. Which distinction is this?",
          hi: "जेलीफ़िश में बाहर और भीतर है और उनके बीच जेली जिसमें कोशिकाएँ लगभग नहीं; केंचुए में वहाँ तीसरी असली परत है, और मांसपेशी, अस्थि, रुधिर और वृक्क उसी परत से बनते हैं। यह कौन-सा भेद है?",
          mr: "जेलीफिशला बाहेर आणि आत आहे आणि त्यांच्यामध्ये जेली ज्यात पेशी जवळपास नाहीत; गांडुळात तिथे तिसरा खरा थर आहे, आणि स्नायू, हाड, रक्त आणि वृक्क त्याच थरापासून बनतात. हा कोणता भेद?",
        },
        statement: {
          en: "Animals are diploblastic if the body is built from two germ layers, ectoderm and endoderm, and triploblastic if a third layer, mesoderm, lies between them and supplies muscle, skeleton, blood and excretory organs.",
          hi: "प्राणी द्विकोरकी हैं यदि शरीर दो जनन-स्तरों, बाह्यत्वचा और अंतस्त्वचा, से बना हो, और त्रिकोरकी यदि उनके बीच तीसरा स्तर, मध्यत्वचा, हो जो मांसपेशी, कंकाल, रुधिर और उत्सर्जी अंग देता है।",
          mr: "प्राणी द्विस्तरीय आहेत जर शरीर दोन जनन-स्तरांपासून, बाह्यस्तर आणि अंतःस्तर, बनले असेल, आणि त्रिस्तरीय जर त्यांच्यामध्ये तिसरा स्तर, मध्यस्तर, असेल जो स्नायू, सांगाडा, रक्त आणि उत्सर्जी अवयव पुरवतो.",
        },
        detail: {
          en: "Everything a large active animal needs is mesodermal, so without that layer an animal cannot have a heart, a skeleton or a kidney at all.",
          hi: "बड़े सक्रिय प्राणी को जो कुछ चाहिए वह मध्यत्वचीय है, अतः उस परत के बिना प्राणी के पास हृदय, कंकाल या वृक्क हो ही नहीं सकता।",
          mr: "मोठ्या सक्रिय प्राण्याला जे लागते ते मध्यस्तरीय, म्हणून त्या थराविना प्राण्याकडे हृदय, सांगाडा वा वृक्क असूच शकत नाही.",
        },
        extra: {
          en: "Only sponges and cnidarians are diploblastic; every animal from flatworms upwards has three layers, which is why the list of two-layered phyla is so short.",
          hi: "केवल स्पंज और निडारिया द्विकोरकी हैं; चपटे कृमियों से ऊपर हर प्राणी में तीन परतें हैं, इसीलिए दो-परत वाले संघों की सूची इतनी छोटी है।",
          mr: "केवळ स्पंज आणि निडारिया द्विस्तरीय; चपट्या कृमींपासून वरचा प्रत्येक प्राणी तीन थरांचा, म्हणूनच दोन-थरी संघांची यादी इतकी लहान आहे.",
        },
        pair: {
          left: {
            en: "No middle layer, no heart",
            hi: "मध्य परत नहीं, हृदय नहीं",
            mr: "मधला थर नाही, हृदय नाही",
          },
          right: {
            en: "how many layers the builder started with",
            hi: "निर्माता ने कितनी परतों से शुरू किया",
            mr: "बांधणाऱ्याने किती थरांनी सुरुवात केली",
          },
        },
      },
      {
        id: "the-space-that-lets-organs-move",
        name: {
          en: "The gap that lets a gut move on its own",
          hi: "वह ख़ाली जगह जो आँत को अपने ढंग से हिलने देती है",
          mr: "आतड्याला स्वतंत्रपणे हलू देणारी ती फट",
        },
        kind: "criterion",
        prompt: {
          en: "A flatworm's gut is packed in solid tissue and must move whenever the body moves; an earthworm's floats in fluid and can churn while the animal lies still. Which feature is this?",
          hi: "चपटे कृमि की आँत ठोस ऊतक में जड़ी है और शरीर हिलते ही उसे हिलना पड़ता है; केंचुए की तरल में तैरती है और प्राणी के स्थिर पड़े रहते हुए भी मथ सकती है। यह कौन-सा लक्षण है?",
          mr: "चपट्या कृमीचे आतडे घन ऊतीत जखडलेले आणि शरीर हलताच त्याला हलावे लागते; गांडुळाचे द्रवात तरंगते आणि प्राणी स्थिर पडलेला असतानाही घुसळू शकते. हे कोणते लक्षण?",
        },
        statement: {
          en: "A coelom is a fluid-filled body cavity lined entirely by mesoderm, and it separates the gut from the body wall so that the two can move independently.",
          hi: "देहगुहा तरल-भरी शरीर-गुहा है जो पूरी तरह मध्यत्वचा से आस्तरित है, और वह आँत को शरीर-भित्ति से अलग कर देती है ताकि दोनों स्वतंत्र रूप से हिल सकें।",
          mr: "देहगुहा ही द्रवाने भरलेली शरीर-पोकळी जी संपूर्णपणे मध्यस्तराने अस्तरित आहे, आणि ती आतडे शरीरभिंतीपासून वेगळे करते जेणेकरून दोन्ही स्वतंत्रपणे हलू शकतील.",
        },
        detail: {
          en: "The fluid also works as a hydrostatic skeleton, giving a soft animal something firm to push against so its muscles have a purchase.",
          hi: "वह तरल जलस्थैतिक कंकाल का काम भी करता है, कोमल प्राणी को धकेलने को कुछ ठोस देकर ताकि उसकी मांसपेशियों को पकड़ मिले।",
          mr: "तो द्रव जलस्थैतिक सांगाड्याचेही काम करतो, मऊ प्राण्याला ढकलायला काहीतरी भक्कम देऊन जेणेकरून त्याच्या स्नायूंना आधार मिळेल.",
        },
        extra: {
          en: "Animals with a cavity not lined by mesoderm all round, such as roundworms, are called pseudocoelomate — the space is there but the lining is incomplete.",
          hi: "जिन प्राणियों की गुहा चारों ओर मध्यत्वचा से आस्तरित नहीं, जैसे गोल कृमि, उन्हें कूटगुहीय कहते हैं — जगह है पर आस्तर अधूरा है।",
          mr: "ज्या प्राण्यांची पोकळी चहूबाजूंनी मध्यस्तराने अस्तरित नाही, जसे गोलकृमी, त्यांना कूटदेहगुही म्हणतात — जागा आहे पण अस्तर अपूर्ण आहे.",
        },
        pair: {
          left: {
            en: "A gut that churns while the body rests",
            hi: "वह आँत जो शरीर के आराम करते हुए मथती है",
            mr: "शरीर विसावले असताना घुसळणारे आतडे",
          },
          right: {
            en: "the gap that lets a gut move on its own",
            hi: "वह ख़ाली जगह जो आँत को अपने ढंग से हिलने देती है",
            mr: "आतड्याला स्वतंत्रपणे हलू देणारी ती फट",
          },
        },
      },
      {
        id: "which-opening-of-the-gut-forms-first",
        name: {
          en: "Which end of the gut appeared first",
          hi: "आँत का कौन-सा सिरा पहले प्रकट हुआ",
          mr: "आतड्याचे कोणते टोक आधी उमटले",
        },
        kind: "criterion",
        prompt: {
          en: "In an embryo the first opening to appear becomes the mouth in an insect and the anus in a starfish, and the whole animal kingdom divides along that difference. Which character is this?",
          hi: "भ्रूण में सबसे पहले प्रकट होने वाला छिद्र कीट में मुख बनता है और तारा-मछली में गुदा, और पूरा प्राणि जगत उसी भेद पर बँट जाता है। यह कौन-सा लक्षण है?",
          mr: "गर्भात सर्वप्रथम उमटणारे छिद्र कीटकात तोंड बनते आणि तारामाशात गुद, आणि अख्खी प्राणिसृष्टी त्याच फरकावर विभागली जाते. हे कोणते लक्षण?",
        },
        statement: {
          en: "In protostomes the first embryonic opening becomes the mouth, and in deuterostomes it becomes the anus while the mouth breaks through later, which splits the triploblastic animals into two great lineages.",
          hi: "प्रोटोस्टोम में पहला भ्रूणीय छिद्र मुख बनता है, और ड्यूटेरोस्टोम में वह गुदा बनता है जबकि मुख बाद में फूटता है, जो त्रिकोरकी प्राणियों को दो विशाल वंशक्रमों में बाँट देता है।",
          mr: "प्रोटोस्टोममध्ये पहिले गर्भीय छिद्र तोंड बनते, आणि ड्युटेरोस्टोममध्ये ते गुद बनते तर तोंड नंतर फुटते, जे त्रिस्तरीय प्राण्यांना दोन विशाल वंशावळींत विभागते.",
        },
        detail: {
          en: "The character is useful precisely because it is invisible in the adult: nothing about a beetle or a sea urchin advertises which opening came first.",
          hi: "यह लक्षण ठीक इसलिए उपयोगी है कि वयस्क में वह अदृश्य है: भृंग या समुद्री साही में कुछ भी यह नहीं बताता कि कौन-सा छिद्र पहले आया।",
          mr: "हे लक्षण नेमके यासाठी उपयुक्त की प्रौढात ते अदृश्य आहे: भुंगा वा समुद्री अर्चिन यांच्यातले काहीही सांगत नाही की कोणते छिद्र आधी आले.",
        },
        extra: {
          en: "It places starfish and humans on the same branch and beetles and snails on the other, which is not what appearance would suggest at all.",
          hi: "वह तारा-मछली और मनुष्य को एक ही शाखा पर रखता है और भृंग तथा घोंघों को दूसरी पर, जो रूप से सुझाई गई बात बिलकुल नहीं है।",
          mr: "ते तारामासा आणि माणूस यांना एकाच फांदीवर ठेवते आणि भुंगे व गोगलगायी दुसरीवर, जे दिसण्यावरून सुचणारे अजिबात नाही.",
        },
        pair: {
          left: {
            en: "A starfish on our branch, a beetle on the other",
            hi: "तारा-मछली हमारी शाखा पर, भृंग दूसरी पर",
            mr: "तारामासा आपल्या फांदीवर, भुंगा दुसरीवर",
          },
          right: {
            en: "which end of the gut appeared first",
            hi: "आँत का कौन-सा सिरा पहले प्रकट हुआ",
            mr: "आतड्याचे कोणते टोक आधी उमटले",
          },
        },
      },
      {
        id: "a-body-that-repeats-itself",
        name: {
          en: "A body assembled from repeated units",
          hi: "दोहराई गई इकाइयों से जुड़ा शरीर",
          mr: "पुनरावृत्त एककांपासून जुळवलेले शरीर",
        },
        kind: "structure",
        prompt: {
          en: "An earthworm is a row of nearly identical rings each with its own muscles, nerves and excretory tubes, so losing the back end costs the animal much less than it would cost a fish. Which arrangement is this?",
          hi: "केंचुआ लगभग एक जैसे छल्लों की पंक्ति है जिनमें से हर एक के अपने मांसपेशी, तंत्रिका और उत्सर्जी नलिकाएँ हैं, अतः पिछला सिरा खोना उस प्राणी को उतना महँगा नहीं पड़ता जितना मछली को पड़ता। यह कौन-सी व्यवस्था है?",
          mr: "गांडूळ म्हणजे जवळपास सारख्या कड्यांची रांग ज्यांतल्या प्रत्येकाला स्वतःचे स्नायू, चेता आणि उत्सर्जी नळ्या आहेत, म्हणून मागचे टोक गमावणे त्या प्राण्याला माशाला पडेल तितके महाग पडत नाही. ही कोणती मांडणी?",
        },
        statement: {
          en: "Metamerism is the repetition of the body in similar segments, each carrying its own set of muscles, nerves, blood vessels and excretory organs, both internally and externally.",
          hi: "खंडीभवन शरीर का समान खंडों में दोहराव है, जिनमें से हर एक भीतर और बाहर दोनों ओर अपने मांसपेशी, तंत्रिका, रुधिर वाहिका और उत्सर्जी अंग ढोता है।",
          mr: "खंडीभवन म्हणजे शरीराची सारख्या खंडांत पुनरावृत्ती, ज्यांतले प्रत्येक आत आणि बाहेर दोन्हीकडे स्वतःचे स्नायू, चेता, रक्तवाहिन्या आणि उत्सर्जी अवयव वाहते.",
        },
        detail: {
          en: "Repetition is cheap to build and easy to modify: once a segment exists, evolution can specialise a few of them without redesigning the animal.",
          hi: "दोहराव बनाने में सस्ता और बदलने में आसान है: एक बार खंड बन जाए तो विकास प्राणी को नए सिरे से गढ़े बिना उनमें से कुछ को विशेषीकृत कर सकता है।",
          mr: "पुनरावृत्ती बांधायला स्वस्त आणि बदलायला सोपी: एकदा खंड अस्तित्वात आला की उत्क्रांती प्राण्याची नव्याने रचना न करता त्यांतले काही विशेषीकृत करू शकते.",
        },
        extra: {
          en: "That is exactly what happened in arthropods, where segments fused and specialised into head, thorax and abdomen with limbs modified for walking, feeding and swimming.",
          hi: "आर्थ्रोपोडों में ठीक यही हुआ, जहाँ खंड जुड़कर सिर, वक्ष और उदर में विशेषीकृत हुए और उपांग चलने, खाने और तैरने के लिए रूपांतरित।",
          mr: "आर्थ्रोपोडांत नेमके हेच घडले, जिथे खंड जुळून डोके, वक्ष आणि उदर यांत विशेषीकृत झाले आणि उपांगे चालणे, खाणे आणि पोहणे यांसाठी रूपांतरित.",
        },
        pair: {
          left: {
            en: "Specialise a few, keep the rest",
            hi: "कुछ को विशेषीकृत करो, बाक़ी वैसे ही रखो",
            mr: "काही विशेषीकृत करा, बाकी तसेच ठेवा",
          },
          right: {
            en: "a body assembled from repeated units",
            hi: "दोहराई गई इकाइयों से जुड़ा शरीर",
            mr: "पुनरावृत्त एककांपासून जुळवलेले शरीर",
          },
        },
      },
      {
        id: "the-rod-that-defines-a-phylum",
        name: {
          en: "The rod that need only appear once",
          hi: "वह छड़ जिसे केवल एक बार प्रकट होना है",
          mr: "केवळ एकदा उमटावी लागणारी ती दांडी",
        },
        kind: "definition",
        prompt: {
          en: "An adult sea squirt is a stationary bag on a rock with no trace of the structure, yet its swimming larva has it, and that larva is enough to place the animal in our own phylum. What is it?",
          hi: "वयस्क समुद्री फुहार चट्टान पर टिकी थैली है जिसमें उस रचना का कोई निशान नहीं, फिर भी उसके तैरते डिंभक में वह है, और वही डिंभक उस प्राणी को हमारे अपने संघ में रखने को पर्याप्त है। वह क्या है?",
          mr: "प्रौढ समुद्री फवारा हा खडकावरची स्थिर पिशवी ज्यात त्या रचनेचा मागमूसही नाही, तरीही त्याच्या पोहणाऱ्या अळीत ती आहे, आणि तीच अळी त्या प्राण्याला आपल्याच संघात ठेवायला पुरेशी आहे. ती काय?",
        },
        statement: {
          en: "A chordate is defined by a notochord, a dorsal hollow nerve cord, pharyngeal gill slits and a post-anal tail, present at some stage of life even if not in the adult.",
          hi: "रज्जुकी की परिभाषा है पृष्ठरज्जु, पृष्ठीय खोखली तंत्रिका रज्जु, ग्रसनीय क्लोम-दरारें और गुदा-पश्च पूँछ, जो जीवन की किसी अवस्था में मौजूद हों, चाहे वयस्क में न हों।",
          mr: "पृष्ठरज्जुधारीची व्याख्या म्हणजे पृष्ठरज्जू, पृष्ठीय पोकळ चेतारज्जू, ग्रसनी कल्ल्याच्या फटी आणि गुदपश्च शेपूट, जी आयुष्याच्या कोणत्यातरी अवस्थेत उपस्थित असावीत, प्रौढात नसली तरी.",
        },
        detail: {
          en: "The phrase \"at some stage\" is doing real work: the human embryo has gill slits and a tail, and both are gone long before birth.",
          hi: "\"किसी अवस्था में\" वाक्यांश असली काम कर रहा है: मानव भ्रूण में क्लोम-दरारें और पूँछ होती हैं, और दोनों जन्म से बहुत पहले चली जाती हैं।",
          mr: "\"कोणत्यातरी अवस्थेत\" हा शब्दप्रयोग खरे काम करत आहे: मानवी गर्भात कल्ल्याच्या फटी आणि शेपूट असतात, आणि दोन्ही जन्माच्या खूप आधी जातात.",
        },
        extra: {
          en: "In vertebrates the notochord is replaced by a backbone that grows around the nerve cord, so the defining rod survives only as the discs between the vertebrae.",
          hi: "कशेरुकियों में पृष्ठरज्जु की जगह वह रीढ़ ले लेती है जो तंत्रिका रज्जु के चारों ओर बढ़ती है, अतः परिभाषक छड़ केवल कशेरुकाओं के बीच की गद्दियों के रूप में बची रहती है।",
          mr: "पृष्ठवंशीयांत पृष्ठरज्जूची जागा चेतारज्जूभोवती वाढणारा पाठीचा कणा घेतो, म्हणून परिभाषक दांडी केवळ मणक्यांमधल्या चकत्यांच्या रूपात उरते.",
        },
        pair: {
          left: {
            en: "A larva decides where the adult belongs",
            hi: "डिंभक तय करता है कि वयस्क कहाँ का है",
            mr: "अळी ठरवते की प्रौढ कुठला",
          },
          right: {
            en: "the rod that need only appear once",
            hi: "वह छड़ जिसे केवल एक बार प्रकट होना है",
            mr: "केवळ एकदा उमटावी लागणारी ती दांडी",
          },
        },
      },
      {
        id: "a-temperature-held-against-the-weather",
        name: {
          en: "A temperature held against the weather",
          hi: "मौसम के विरुद्ध थामा गया ताप",
          mr: "हवामानाविरुद्ध धरलेले तापमान",
        },
        kind: "criterion",
        prompt: {
          en: "A lizard on a cold morning cannot move until the sun has warmed it, while a sparrow on the same branch has been awake and feeding since before dawn, and the difference costs the sparrow ten times more food. Which contrast is this?",
          hi: "ठंडी सुबह छिपकली तब तक हिल नहीं सकती जब तक धूप उसे गर्म न कर दे, जबकि उसी डाल पर बैठी गौरैया भोर से पहले से जाग कर खा रही है, और यह अंतर गौरैया को दस गुना अधिक भोजन में पड़ता है। यह कौन-सा विरोध है?",
          mr: "थंड सकाळी सरडा सूर्याने गरम करेपर्यंत हलू शकत नाही, तर त्याच फांदीवरची चिमणी पहाटेच्या आधीपासून जागी होऊन खात आहे, आणि हा फरक चिमणीला दहापट अधिक अन्नात पडतो. हा कोणता विरोध?",
        },
        statement: {
          en: "Warm-blooded animals hold a steady internal temperature by generating heat from their own metabolism, while cold-blooded animals take the temperature of their surroundings.",
          hi: "गर्म-रुधिर प्राणी अपने उपापचय से ऊष्मा बनाकर भीतर स्थिर ताप बनाए रखते हैं, जबकि ठंडे-रुधिर प्राणी अपने परिवेश का ताप ले लेते हैं।",
          mr: "उष्ण-रक्ती प्राणी स्वतःच्या चयापचयातून उष्णता निर्माण करून आत स्थिर तापमान राखतात, तर शीत-रक्ती प्राणी आपल्या परिसराचे तापमान घेतात.",
        },
        detail: {
          en: "Only birds and mammals are warm-blooded, and the arrangement is expensive: most of the food a mammal eats is spent on heat rather than on growth or movement.",
          hi: "केवल पक्षी और स्तनधारी गर्म-रुधिर हैं, और यह व्यवस्था महँगी है: स्तनधारी जो भोजन खाता है उसका अधिकांश वृद्धि या गति पर नहीं, ऊष्मा पर ख़र्च होता है।",
          mr: "केवळ पक्षी आणि सस्तन प्राणी उष्ण-रक्ती, आणि ही व्यवस्था महाग: सस्तन प्राणी जे अन्न खातो त्यातले बहुतांश वाढ वा हालचालीवर नव्हे, उष्णतेवर खर्च होते.",
        },
        extra: {
          en: "What it buys is independence from the weather: a mammal can hunt at night, in winter and at altitude, where a reptile of the same size would be immobile.",
          hi: "वह ख़रीदती है मौसम से स्वतंत्रता: स्तनधारी रात में, सर्दी में और ऊँचाई पर शिकार कर सकता है, जहाँ उसी आकार का सरीसृप निश्चल पड़ा होता।",
          mr: "ती विकत घेते हवामानापासूनचे स्वातंत्र्य: सस्तन प्राणी रात्री, हिवाळ्यात आणि उंचीवर शिकार करू शकतो, जिथे त्याच आकाराचा सरपटणारा प्राणी निश्चल पडला असता.",
        },
        pair: {
          left: {
            en: "Ten times the food, and the night to hunt in",
            hi: "दस गुना भोजन, और शिकार को पूरी रात",
            mr: "दहापट अन्न, आणि शिकारीसाठी अख्खी रात्र",
          },
          right: {
            en: "a temperature held against the weather",
            hi: "मौसम के विरुद्ध थामा गया ताप",
            mr: "हवामानाविरुद्ध धरलेले तापमान",
          },
        },
      },
      /*F4B*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student groups whales with fish because both are streamlined, live in the sea and swim with a tail, and groups bats with birds because both fly on wings. Assess the grouping and name the characters that decide it.",
          hi: "एक विद्यार्थी व्हेल को मछलियों के साथ रखता है क्योंकि दोनों धारारेखित हैं, समुद्र में रहते हैं और पूँछ से तैरते हैं, और चमगादड़ को पक्षियों के साथ क्योंकि दोनों पंखों पर उड़ते हैं। इस समूहन का आकलन करो और उन लक्षणों का नाम लो जो इसे तय करते हैं।",
          mr: "एक विद्यार्थी देवमाशाला माशांसोबत ठेवतो कारण दोघेही सुबक आकाराचे, समुद्रात राहतात आणि शेपटीने पोहतात, आणि वटवाघळाला पक्ष्यांसोबत कारण दोघेही पंखांवर उडतात. या गटवारीचे मूल्यमापन करा आणि ती ठरवणाऱ्या लक्षणांचे नाव सांगा.",
        },
        choices: [
          {
            en: "Both groupings fail, and they fail for the same reason: shape and habitat are shaped by the medium an animal moves through, not by its ancestry. Water forces a streamlined body on anything that swims fast and air forces an aerofoil on anything that flies, so these features arise repeatedly in unrelated lineages. The characters that classify are the ones fixed early and not moulded by the environment — a whale and a bat both have hair, a four-chambered heart, mammary glands and a lower jaw of a single bone, and both breathe air with lungs. Whales are mammals that returned to water and bats are mammals that took to the air",
            hi: "दोनों समूहन विफल हैं, और उसी एक कारण से विफल हैं: आकार और आवास उस माध्यम से गढ़े जाते हैं जिसमें प्राणी चलता है, उसकी पूर्वजता से नहीं। पानी तेज़ तैरने वाली हर चीज़ पर धारारेखित शरीर थोपता है और हवा उड़ने वाली हर चीज़ पर वायुफलक, अतः ये लक्षण असंबंधित वंशक्रमों में बार-बार उठ आते हैं। वर्गीकृत करने वाले लक्षण वे हैं जो जल्दी तय हो जाते हैं और पर्यावरण से नहीं ढाले जाते — व्हेल और चमगादड़ दोनों में बाल हैं, चार-कक्षीय हृदय, स्तन ग्रंथियाँ और एक ही अस्थि का निचला जबड़ा, और दोनों फेफड़ों से हवा में साँस लेते हैं। व्हेल पानी में लौटे स्तनधारी हैं और चमगादड़ हवा में उड़े स्तनधारी",
            mr: "दोन्ही गटवाऱ्या अपयशी, आणि त्याच एका कारणाने अपयशी: आकार आणि अधिवास प्राणी ज्या माध्यमातून चालतो त्याने घडवले जातात, त्याच्या पूर्वजतेने नव्हे. पाणी वेगाने पोहणाऱ्या प्रत्येकावर सुबक शरीर लादते आणि हवा उडणाऱ्या प्रत्येकावर वायुपंख, म्हणून ही लक्षणे असंबंधित वंशावळींत वारंवार उद्भवतात. वर्गीकरण करणारी लक्षणे ती जी लवकर ठरतात आणि पर्यावरणाने घडवली जात नाहीत — देवमासा आणि वटवाघूळ दोघांनाही केस आहेत, चार-कप्प्यांचे हृदय, स्तनग्रंथी आणि एकाच हाडाचा खालचा जबडा, आणि दोघेही फुफ्फुसांनी हवेत श्वास घेतात. देवमासे हे पाण्यात परतलेले सस्तन प्राणी आणि वटवाघळे हवेत गेलेले सस्तन प्राणी",
          },
          {
            en: "The whale grouping fails but the bat grouping holds, since wings are a complex structure and could not have evolved twice",
            hi: "व्हेल वाला समूहन विफल है पर चमगादड़ वाला टिकता है, क्योंकि पंख जटिल रचना हैं और दो बार विकसित नहीं हो सकते थे",
            mr: "देवमाशाची गटवारी अपयशी पण वटवाघळाची टिकते, कारण पंख ही गुंतागुंतीची रचना आणि दोनदा उत्क्रांत होऊ शकली नसती",
          },
          {
            en: "Both groupings hold, because classification is based on habitat and mode of locomotion, which is why animals are described as aquatic, aerial and terrestrial",
            hi: "दोनों समूहन टिकते हैं, क्योंकि वर्गीकरण आवास और गमन-विधि पर आधारित है, इसीलिए प्राणियों को जलीय, वायवीय और स्थलीय बताया जाता है",
            mr: "दोन्ही गटवाऱ्या टिकतात, कारण वर्गीकरण अधिवास आणि हालचालीच्या पद्धतीवर आधारित, म्हणूनच प्राण्यांना जलचर, हवाई आणि भूचर म्हटले जाते",
          },
          {
            en: "Both groupings fail because whales are actually reptiles and bats are actually birds that lost their feathers",
            hi: "दोनों समूहन विफल हैं क्योंकि व्हेल वस्तुतः सरीसृप हैं और चमगादड़ वस्तुतः ऐसे पक्षी जिन्होंने अपने पर खो दिए",
            mr: "दोन्ही गटवाऱ्या अपयशी कारण देवमासे प्रत्यक्षात सरपटणारे प्राणी आणि वटवाघळे प्रत्यक्षात पिसे गमावलेले पक्षी",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student has done what everyone's eyes do, and the correction is the central lesson of animal classification. Deal with the whale first. A whale is streamlined, lives in the sea and drives itself with a tail, and every one of those is a requirement of moving fast through water rather than a piece of family history. Water is eight hundred times denser than air, so anything that swims quickly is pushed towards the same torpedo shape — which is why a shark, an ichthyosaur, a dolphin and a tuna look alike while belonging to four separate groups, two of them not even vertebrate relatives of each other in any close sense. Now look at what the whale kept from its ancestry rather than acquired from the sea. It has lungs and must surface to breathe; a fish takes oxygen from water with gills. It has hair, sparse but present, especially in the foetus. It gives birth to live young and feeds them on milk from mammary glands. Its tail beats up and down, following the flexing of a land mammal's spine, while a fish's beats side to side. Its front flipper contains a humerus, radius, ulna and five sets of finger bones — the standard limb of a land vertebrate, rearranged but not replaced. And its lower jaw is a single bone, with the two bones a reptile has in the jaw hinge relocated into the middle ear. Not one of these is negotiable in water, and all of them are inherited. The bat is the same argument in a different medium. Its wing is a hand: the membrane is stretched over four enormously elongated fingers, and the thumb still projects as a claw. A bird's wing is built from a different arrangement altogether, with the feathers doing the work of the surface, and it has a beak, feathers, hollow bones and lays eggs. A bat has teeth, fur, live birth and milk. The two solved the same aerodynamic problem twice with the materials each already had, which is convergence. The general rule is worth stating exactly, because it does the work in every chapter of taxonomy. Characters imposed by the environment are unreliable for classification, because the environment can impose them on anybody. Characters laid down early in the embryo and not exposed to that pressure — germ layers, coelom, the fate of the blastopore, jaw structure, the type of heart — are the ones that carry ancestry. Anatomists have a name for the distinction: structures that share a common origin are homologous, like the whale's flipper and the bat's wing, both being a mammal's forelimb; structures that share only a function are analogous, like the bat's wing and the bird's wing. The first is evidence of relationship and the second is evidence of a shared problem. (The second answer exempts the wing without reason, when the wing is the clearest convergence there is — it evolved separately in insects, pterosaurs, birds and bats; the third makes habitat the criterion, which would file a whale, a squid and a seaweed together; and the fourth invents relationships with no evidence and gets both wrong.)",
          hi: "विद्यार्थी ने वही किया है जो सबकी आँखें करती हैं, और यह सुधार प्राणी-वर्गीकरण का केंद्रीय पाठ है। पहले व्हेल को लो। व्हेल धारारेखित है, समुद्र में रहती है और पूँछ से ख़ुद को धकेलती है, और उनमें से हर एक पानी में तेज़ चलने की आवश्यकता है, कोई कुल-इतिहास का टुकड़ा नहीं। पानी हवा से आठ सौ गुना सघन है, अतः जो भी तेज़ तैरता है वह उसी तारपीडो आकार की ओर धकेला जाता है — इसीलिए शार्क, इक्थियोसॉर, डॉल्फ़िन और टूना एक जैसे दिखते हैं जबकि चार अलग समूहों के हैं। अब देखो कि व्हेल ने समुद्र से अर्जित नहीं, पूर्वजता से क्या रखा। उसके फेफड़े हैं और साँस लेने को उसे सतह पर आना पड़ता है; मछली क्लोमों से पानी में से ऑक्सीजन लेती है। उसके बाल हैं, विरल पर मौजूद, विशेषकर भ्रूण में। वह जीवित बच्चे जनती है और उन्हें स्तन ग्रंथियों के दूध पर पालती है। उसकी पूँछ ऊपर-नीचे चलती है, स्थलीय स्तनधारी की रीढ़ के मुड़ने का अनुसरण करते हुए, जबकि मछली की अग़ल-बग़ल। उसके अग्र फ़्लिपर में प्रगंडिका, अंतःप्रकोष्ठिका, बहिःप्रकोष्ठिका और अंगुलियों की पाँच पंक्तियाँ हैं — स्थलीय कशेरुकी का मानक उपांग, पुनर्व्यवस्थित पर प्रतिस्थापित नहीं। और उसका निचला जबड़ा एक ही अस्थि का है, जबड़े की कब्ज़े वाली दो अस्थियाँ सरीसृप में होती हैं वे मध्य कर्ण में चली गई हैं। इनमें से एक भी पानी में सौदेबाज़ी योग्य नहीं, और सब वंशागत हैं। चमगादड़ भिन्न माध्यम में वही तर्क है। उसका पंख एक हाथ है: झिल्ली चार अत्यधिक लंबी अंगुलियों पर तनी है, और अंगूठा अब भी पंजे के रूप में निकला है। पक्षी का पंख बिलकुल भिन्न व्यवस्था से बना है, जिसमें सतह का काम पर करते हैं, और उसके पास चोंच, पर, खोखली अस्थियाँ हैं और वह अंडे देता है। चमगादड़ के दाँत, रोएँ, जीवित प्रसव और दूध हैं। दोनों ने वही वायुगतिकीय समस्या दो बार हल की, हर एक ने उन सामग्रियों से जो उसके पास पहले से थीं, और यही अभिसरण है। सामान्य नियम ठीक-ठीक कहने योग्य है, क्योंकि वह वर्गिकी के हर अध्याय में काम करता है। पर्यावरण द्वारा थोपे गए लक्षण वर्गीकरण के लिए अविश्वसनीय हैं, क्योंकि पर्यावरण उन्हें किसी पर भी थोप सकता है। भ्रूण में जल्दी बिछाए गए और उस दबाव के सामने न आने वाले लक्षण — जनन-स्तर, देहगुहा, कोरकरंध्र की नियति, जबड़े की संरचना, हृदय का प्रकार — वही पूर्वजता ढोते हैं। शरीररचनाविदों के पास इस भेद का नाम है: जिन रचनाओं का उद्गम साझा हो वे समजात हैं, जैसे व्हेल का फ़्लिपर और चमगादड़ का पंख, दोनों स्तनधारी के अग्रपाद; जिनका केवल कार्य साझा हो वे समवृत्ति, जैसे चमगादड़ का पंख और पक्षी का पंख। पहला संबंध का प्रमाण है और दूसरा साझा समस्या का। (दूसरा उत्तर पंख को बिना कारण छूट दे देता है, जबकि पंख सबसे स्पष्ट अभिसरण है — वह कीटों, टेरोसॉरों, पक्षियों और चमगादड़ों में अलग-अलग विकसित हुआ; तीसरा आवास को कसौटी बना देता है, जो व्हेल, स्क्विड और समुद्री शैवाल को एक साथ फ़ाइल कर देता; और चौथा बिना प्रमाण संबंध गढ़ता है और दोनों ग़लत करता है।)",
          mr: "विद्यार्थ्याने तेच केले आहे जे सर्वांचे डोळे करतात, आणि ही दुरुस्ती प्राणी-वर्गीकरणाचा मध्यवर्ती धडा आहे. आधी देवमासा घ्या. देवमासा सुबक आकाराचा, समुद्रात राहतो आणि शेपटीने स्वतःला ढकलतो, आणि यांतले प्रत्येक पाण्यात वेगाने चालण्याची गरज आहे, कुळाच्या इतिहासाचा तुकडा नव्हे. पाणी हवेहून आठशेपट दाट, म्हणून जो वेगाने पोहतो तो त्याच टॉर्पेडो आकाराकडे ढकलला जातो — म्हणूनच शार्क, इक्थिओसॉर, डॉल्फिन आणि ट्युना सारखे दिसतात तर चार वेगळ्या गटांचे आहेत. आता पाहा की देवमाशाने समुद्रातून मिळवले नव्हे, पूर्वजतेतून काय ठेवले. त्याला फुफ्फुसे आहेत आणि श्वासासाठी पृष्ठभागावर यावे लागते; मासा कल्ल्यांनी पाण्यातून ऑक्सिजन घेतो. त्याला केस आहेत, विरळ पण उपस्थित, विशेषतः गर्भात. तो जिवंत पिल्ले जन्माला घालतो आणि त्यांना स्तनग्रंथींच्या दुधावर वाढवतो. त्याची शेपूट वर-खाली चालते, भूचर सस्तन प्राण्याच्या पाठकण्याच्या वळणाचे अनुसरण करत, तर माशाची अलीकडे-पलीकडे. त्याच्या पुढच्या फ्लिपरमध्ये ह्युमरस, रेडियस, अल्ना आणि बोटांच्या पाच रांगा आहेत — भूचर पृष्ठवंशीयाचे प्रमाणित उपांग, पुनर्रचित पण बदललेले नाही. आणि त्याचा खालचा जबडा एकाच हाडाचा, सरपटणाऱ्या प्राण्यात जबड्याच्या बिजागरात असणारी दोन हाडे मधल्या कानात गेली आहेत. यांतले एकही पाण्यात तडजोडीयोग्य नाही, आणि सर्व अनुवंशिक आहेत. वटवाघूळ हा वेगळ्या माध्यमातला तोच युक्तिवाद. त्याचा पंख हा हात आहे: पडदा चार अत्यंत लांबलेल्या बोटांवर ताणलेला, आणि अंगठा अजूनही नखीच्या रूपात बाहेर आलेला. पक्ष्याचा पंख पूर्णपणे वेगळ्या मांडणीचा, ज्यात पृष्ठभागाचे काम पिसे करतात, आणि त्याला चोच, पिसे, पोकळ हाडे आणि तो अंडी घालतो. वटवाघळाला दात, केस, जिवंत जन्म आणि दूध आहे. दोघांनी तीच वायुगतिकीय समस्या दोनदा सोडवली, प्रत्येकाने आपल्याकडे आधीच असलेल्या साहित्याने, आणि हेच अभिसरण. सामान्य नियम नेमका सांगण्याजोगा, कारण तो वर्गीकरणशास्त्राच्या प्रत्येक प्रकरणात काम करतो. पर्यावरणाने लादलेली लक्षणे वर्गीकरणासाठी अविश्वसनीय, कारण पर्यावरण ती कोणावरही लादू शकते. गर्भात लवकर घातलेली आणि त्या दबावासमोर न येणारी लक्षणे — जनन-स्तर, देहगुहा, कोरकरंध्राची नियती, जबड्याची रचना, हृदयाचा प्रकार — तीच पूर्वजता वाहतात. शरीररचनाशास्त्रज्ञांकडे या भेदाला नाव आहे: ज्या रचनांचा उगम सामायिक त्या समजात, जसे देवमाशाचा फ्लिपर आणि वटवाघळाचा पंख, दोन्ही सस्तन प्राण्याचे पुढचे अंग; ज्यांचे केवळ कार्य सामायिक त्या समवृत्ती, जसे वटवाघळाचा पंख आणि पक्ष्याचा पंख. पहिले नात्याचा पुरावा आणि दुसरे सामायिक समस्येचा. (दुसरे उत्तर पंखाला विनाकारण सूट देते, तर पंख हे सर्वांत स्पष्ट अभिसरण — तो कीटक, टेरोसॉर, पक्षी आणि वटवाघळांत वेगवेगळा उत्क्रांत झाला; तिसरे अधिवासाला कसोटी बनवते, जे देवमासा, स्क्विड आणि समुद्री शैवाल एकत्र फाइल करेल; आणि चौथे पुराव्याविना नाती रचते आणि दोन्ही चुकवते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A student asks why the coelom is treated as a major classifying character when it is simply an empty space. Explain what having one makes possible, and why flatworms and roundworms sit where they do.",
          hi: "एक विद्यार्थी पूछता है कि देहगुहा को प्रमुख वर्गीकारक लक्षण क्यों माना जाता है जबकि वह बस ख़ाली जगह है। बताओ कि उसका होना क्या संभव बनाता है, और चपटे कृमि तथा गोल कृमि जहाँ हैं वहाँ क्यों हैं।",
          mr: "एक विद्यार्थी विचारतो की देहगुहेला प्रमुख वर्गीकारक लक्षण का मानले जाते जेव्हा ती फक्त रिकामी जागा आहे. ती असणे काय शक्य करते, आणि चपटे कृमी व गोलकृमी जिथे आहेत तिथे का, ते समजावा.",
        },
        choices: [
          {
            en: "The space is what lets an animal have organs that work independently of its body wall. Gut fluid can be churned while the animal lies still, the gut can be long and folded instead of straight, and the fluid itself acts as a hydrostatic skeleton for muscles to push against. A flatworm has no cavity, so its gut is packed in solid tissue, it must stay thin enough for oxygen to diffuse in, and it has no circulatory system. A roundworm has a cavity but one not lined by mesoderm all round, which gives it fluid pressure and body-wall muscles but no proper mesenteries to suspend organs. So the three grades are a sequence of what becomes structurally affordable",
            hi: "वह जगह ही प्राणी को ऐसे अंग रखने देती है जो उसकी शरीर-भित्ति से स्वतंत्र काम करें। आँत का तरल प्राणी के स्थिर पड़े रहते भी मथा जा सकता है, आँत सीधी के बजाय लंबी और मुड़ी हो सकती है, और वह तरल स्वयं मांसपेशियों को धकेलने के लिए जलस्थैतिक कंकाल का काम करता है। चपटे कृमि में गुहा नहीं, अतः उसकी आँत ठोस ऊतक में जड़ी है, उसे इतना पतला रहना पड़ता है कि ऑक्सीजन विसरित हो सके, और उसमें परिसंचरण तंत्र नहीं। गोल कृमि में गुहा है पर वह चारों ओर मध्यत्वचा से आस्तरित नहीं, जो उसे तरल दाब और शरीर-भित्ति की मांसपेशियाँ देती है पर अंगों को लटकाने को ठीक आंत्रयोजनी नहीं। अतः ये तीन श्रेणियाँ इस बात का अनुक्रम हैं कि संरचनात्मक रूप से क्या-क्या वहन योग्य होता जाता है",
            mr: "ती जागाच प्राण्याला आपल्या शरीरभिंतीपासून स्वतंत्रपणे काम करणारे अवयव ठेवू देते. आतड्यातला द्रव प्राणी स्थिर पडलेला असतानाही घुसळता येतो, आतडे सरळऐवजी लांब आणि वळणदार असू शकते, आणि तो द्रव स्वतः स्नायूंना ढकलायला जलस्थैतिक सांगाड्याचे काम करतो. चपट्या कृमीत पोकळी नाही, म्हणून त्याचे आतडे घन ऊतीत जखडलेले, त्याला ऑक्सिजन विसरू शकेल इतके पातळ राहावे लागते, आणि त्याच्यात अभिसरण संस्था नाही. गोलकृमीत पोकळी आहे पण ती चहूबाजूंनी मध्यस्तराने अस्तरित नाही, जी त्याला द्रवदाब आणि शरीरभिंतीचे स्नायू देते पण अवयव लटकवायला नीट आंत्रयोजनी नाही. म्हणून या तीन श्रेणी म्हणजे संरचनात्मकदृष्ट्या काय काय परवडू लागते याचा अनुक्रम",
          },
          {
            en: "The coelom matters only because it makes an animal larger, and size is the real character behind the grouping",
            hi: "देहगुहा केवल इसलिए मायने रखती है कि वह प्राणी को बड़ा बनाती है, और समूहन के पीछे असली लक्षण आकार ही है",
            mr: "देहगुहा केवळ यासाठी महत्त्वाची की ती प्राण्याला मोठे करते, आणि गटवारीमागचे खरे लक्षण आकारच आहे",
          },
          {
            en: "The student is right that it is arbitrary: the coelom is an empty space and taxonomists use it only because it is easy to see in a dissection",
            hi: "विद्यार्थी सही है कि वह मनमाना है: देहगुहा ख़ाली जगह है और वर्गिकीविद उसे केवल इसलिए बरतते हैं कि विच्छेदन में वह आसानी से दिख जाती है",
            mr: "विद्यार्थी बरोबर की ती मनमानी आहे: देहगुहा ही रिकामी जागा आणि वर्गीकरणशास्त्रज्ञ ती केवळ यासाठी वापरतात की विच्छेदनात ती सहज दिसते",
          },
          {
            en: "The coelom is what carries blood, so animals without one have no blood and animals with one all have a closed circulatory system",
            hi: "देहगुहा ही रुधिर ढोती है, अतः जिनमें वह नहीं उनमें रुधिर नहीं और जिनमें है उन सब में बंद परिसंचरण तंत्र है",
            mr: "देहगुहाच रक्त वाहते, म्हणून जिच्यात ती नाही त्यांच्यात रक्त नाही आणि जिच्यात आहे त्या सर्वांत बंद अभिसरण संस्था आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student's objection is a fair one and deserves a real answer rather than an appeal to convention. A space is not a structure, so why should it outrank things you can actually point at? The answer is that this particular space removes a constraint, and removing a constraint is often worth more than adding an organ. Begin with an animal that has none. A flatworm is triploblastic but acellomate: the region between gut and body wall is packed with solid mesodermal tissue. Three consequences follow, and they are not independent of one another. The gut cannot move except when the body moves, since it is embedded in the same block of tissue as the muscles. Every cell must be within diffusion distance of the outside, because there is no cavity in which a circulatory fluid could run — which forces the animal to stay flat and thin, and is exactly why a flatworm is flat. And there is no room to fold a long gut, so digestion is limited by the surface area of a simple branched sac. Now a roundworm, which is pseudocoelomate. There is a cavity, and it is full of fluid under pressure, so at once the animal gains a hydrostatic skeleton: the longitudinal muscles of the body wall have something to work against, which is why a nematode thrashes with that characteristic whipping motion. Nutrients can move in the fluid, so the body can be thicker. But the cavity is not lined by mesoderm on both surfaces, and without a complete mesodermal lining there are no mesenteries — the sheets that suspend organs in place. The gut is therefore a straight tube running through a pressurised bag, and it cannot be regionally specialised or coiled to any extent. There are also no circular muscles, so a roundworm cannot do peristalsis and cannot burrow the way an earthworm does. Finally a true coelomate such as an earthworm. The cavity is lined by mesoderm on both the gut side and the wall side, and where the two linings meet they form mesenteries that hold organs in position. Now everything becomes possible at once. The gut is suspended and free, so it can be coiled to several times the body length, regionalised into crop, gizzard and intestine, and moved by its own muscles while the animal rests. The body wall has both circular and longitudinal muscles working against the coelomic fluid, giving true peristalsis and burrowing. Organs can be built anywhere in the cavity, so a closed circulatory system and paired excretory organs become straightforward. And the coelomic fluid itself transports, cushions and provides space for gonads to swell seasonally. That is the answer to the student's question: the coelom is not an organ but a precondition for organs. Two footnotes are worth adding. The first is that the sequence acoelomate, pseudocoelomate, coelomate is a grade of organisation rather than a family tree — molecular evidence shows that some flatworms are secondarily simplified rather than primitively simple, so the tidy ladder is a description of what a body can do rather than a strict order of descent. The second is the general form of the reasoning, which recurs throughout biology: the informative characters are the ones that determine what else is possible. A coelom, a vascular bundle, a membrane-bound nucleus and a triploid endosperm are all classifying characters for the same reason — each one opens a door that stays shut without it. (The second answer names a consequence and calls it the cause; the third mistakes visibility for the reason and misses the functional argument entirely; and the fourth is factually confused, since the coelom is not a blood-filled space and open circulation is common among coelomates such as insects.)",
          hi: "विद्यार्थी की आपत्ति उचित है और परिपाटी की दुहाई नहीं, असली उत्तर की हक़दार है। जगह रचना नहीं है, तो वह उन चीज़ों से ऊपर क्यों हो जिन्हें तुम सचमुच दिखा सकते हो? उत्तर यह है कि यह विशेष जगह एक बंधन हटा देती है, और बंधन हटाना प्रायः अंग जोड़ने से अधिक क़ीमती होता है। ऐसे प्राणी से शुरू करो जिसमें वह नहीं। चपटा कृमि त्रिकोरकी है पर अगुही: आँत और शरीर-भित्ति के बीच का क्षेत्र ठोस मध्यत्वचीय ऊतक से भरा है। तीन परिणाम निकलते हैं, और वे एक-दूसरे से स्वतंत्र नहीं। आँत तब तक हिल नहीं सकती जब तक शरीर न हिले, क्योंकि वह मांसपेशियों के उसी खंड में जड़ी है। हर कोशिका को बाहर से विसरण-दूरी के भीतर होना पड़ता है, क्योंकि ऐसी कोई गुहा नहीं जिसमें परिसंचारी तरल चल सके — जो प्राणी को चपटा और पतला रहने को बाध्य करता है, और ठीक इसीलिए चपटा कृमि चपटा है। और लंबी आँत मोड़ने को जगह नहीं, अतः पाचन सीधी शाखित थैली के सतह-क्षेत्र से सीमित है। अब गोल कृमि, जो कूटगुहीय है। गुहा है, और वह दाब में तरल से भरी है, अतः प्राणी तुरंत जलस्थैतिक कंकाल पा जाता है: शरीर-भित्ति की अनुदैर्घ्य मांसपेशियों को काम करने को कुछ मिल जाता है, इसीलिए सूत्रकृमि उस विशिष्ट चाबुक जैसी गति से छटपटाता है। पोषक तत्व तरल में चल सकते हैं, अतः शरीर मोटा हो सकता है। पर गुहा दोनों सतहों पर मध्यत्वचा से आस्तरित नहीं, और पूर्ण मध्यत्वचीय आस्तर के बिना आंत्रयोजनी नहीं होतीं — वे चादरें जो अंगों को जगह पर लटकाती हैं। अतः आँत दाबयुक्त थैली में से गुज़रती सीधी नली है, और उसे क्षेत्रवार विशेषीकृत या किसी हद तक कुंडलित नहीं किया जा सकता। वर्तुल मांसपेशियाँ भी नहीं, अतः गोल कृमि क्रमाकुंचन नहीं कर सकता और केंचुए की तरह बिल नहीं खोद सकता। अंत में असली गुहीय, जैसे केंचुआ। गुहा आँत की ओर और भित्ति की ओर दोनों पर मध्यत्वचा से आस्तरित है, और जहाँ दोनों आस्तर मिलते हैं वहाँ वे आंत्रयोजनी बनाते हैं जो अंगों को स्थान पर थामती हैं। अब सब कुछ एक साथ संभव हो जाता है। आँत लटकी और मुक्त है, अतः वह शरीर की लंबाई से कई गुना कुंडलित हो सकती है, अन्नपुट, पेषणी और आंत्र में क्षेत्रबद्ध हो सकती है, और प्राणी के आराम करते हुए अपनी मांसपेशियों से हिल सकती है। शरीर-भित्ति में वर्तुल और अनुदैर्घ्य दोनों मांसपेशियाँ देहगुहा के तरल के विरुद्ध काम करती हैं, जो असली क्रमाकुंचन और बिल खोदना देती हैं। अंग गुहा में कहीं भी बनाए जा सकते हैं, अतः बंद परिसंचरण तंत्र और युग्मित उत्सर्जी अंग सीधे-सादे हो जाते हैं। और देहगुहा का तरल स्वयं परिवहन करता है, गद्दी देता है और जनन-ग्रंथियों को मौसम के अनुसार फूलने की जगह। यही विद्यार्थी के प्रश्न का उत्तर है: देहगुहा अंग नहीं, अंगों की पूर्वशर्त है। दो पाद-टिप्पणियाँ जोड़ने योग्य हैं। पहली यह कि अगुही, कूटगुहीय, गुहीय का अनुक्रम वंश-वृक्ष नहीं, संगठन की श्रेणी है — आणविक प्रमाण दिखाते हैं कि कुछ चपटे कृमि आदिम रूप से सरल नहीं, द्वितीयक रूप से सरलीकृत हैं, अतः यह सुथरी सीढ़ी वंश का कड़ा क्रम नहीं, इसका वर्णन है कि शरीर क्या कर सकता है। दूसरी है तर्क का सामान्य रूप, जो जीवविज्ञान भर में लौटता है: सूचनाप्रद लक्षण वे हैं जो तय करते हैं कि और क्या संभव है। देहगुहा, संवहन पूल, झिल्ली-बद्ध केंद्रक और त्रिगुणित भ्रूणपोष सब उसी कारण वर्गीकारक लक्षण हैं — हर एक ऐसा द्वार खोलता है जो उसके बिना बंद रहता है। (दूसरा उत्तर परिणाम का नाम लेकर उसे कारण कह देता है; तीसरा दिखाई देने को कारण समझ लेता है और कार्यात्मक तर्क पूरी तरह चूक जाता है; और चौथा तथ्यतः भ्रमित है, क्योंकि देहगुहा रुधिर-भरी जगह नहीं है और कीटों जैसे गुहीयों में खुला परिसंचरण आम है।)",
          mr: "विद्यार्थ्याचा आक्षेप रास्त आहे आणि रूढीची दुहाई नव्हे, खऱ्या उत्तराला पात्र आहे. जागा ही रचना नव्हे, मग ती तुम्ही खरोखर दाखवू शकता त्या गोष्टींहून वर का असावी? उत्तर असे की ही विशिष्ट जागा एक बंधन काढून टाकते, आणि बंधन काढणे बहुधा अवयव जोडण्याहून अधिक मोलाचे असते. जिच्यात ती नाही अशा प्राण्यापासून सुरू करा. चपटा कृमी त्रिस्तरीय पण अगुही: आतडे आणि शरीरभिंत यांच्यातला भाग घन मध्यस्तरीय ऊतीने भरलेला. तीन परिणाम निघतात, आणि ते एकमेकांपासून स्वतंत्र नाहीत. शरीर हलल्याशिवाय आतडे हलू शकत नाही, कारण ते स्नायूंच्याच त्या ठोकळ्यात जखडलेले. प्रत्येक पेशी बाहेरून विसरण-अंतराच्या आत असावी लागते, कारण अशी कोणतीही पोकळी नाही जिच्यात अभिसरणी द्रव चालू शकेल — जे प्राण्याला चपटे आणि पातळ राहायला भाग पाडते, आणि नेमके म्हणूनच चपटा कृमी चपटा आहे. आणि लांब आतडे वळवायला जागा नाही, म्हणून पचन साध्या शाखित पिशवीच्या पृष्ठभागाने मर्यादित. आता गोलकृमी, जो कूटदेहगुही आहे. पोकळी आहे, आणि ती दाबाखालच्या द्रवाने भरलेली, म्हणून प्राण्याला लगेच जलस्थैतिक सांगाडा मिळतो: शरीरभिंतीच्या लांबीच्या स्नायूंना काम करायला काहीतरी मिळते, म्हणूनच सूत्रकृमी त्या वैशिष्ट्यपूर्ण चाबकासारख्या हालचालीने तडफडतो. पोषकद्रव्ये द्रवात चालू शकतात, म्हणून शरीर जाड असू शकते. पण पोकळी दोन्ही पृष्ठभागांवर मध्यस्तराने अस्तरित नाही, आणि पूर्ण मध्यस्तरीय अस्तराविना आंत्रयोजनी नाहीत — त्या पापुद्र्या ज्या अवयव जागी लटकवतात. म्हणून आतडे हे दाबयुक्त पिशवीतून जाणारी सरळ नळी, आणि तिला भागवार विशेषीकृत वा कितीही वेटोळे करता येत नाही. वर्तुळाकार स्नायूही नाहीत, म्हणून गोलकृमी क्रमसंकोच करू शकत नाही आणि गांडुळासारखे बीळ खणू शकत नाही. शेवटी खरा देहगुही, जसे गांडूळ. पोकळी आतड्याच्या बाजूने आणि भिंतीच्या बाजूने दोन्हीकडे मध्यस्तराने अस्तरित, आणि जिथे दोन्ही अस्तरे भेटतात तिथे ती आंत्रयोजनी बनवतात ज्या अवयव जागी धरतात. आता सर्व काही एकाच वेळी शक्य होते. आतडे लटकलेले आणि मोकळे, म्हणून ते शरीराच्या लांबीच्या कित्येक पट वेटोळे होऊ शकते, अन्नपुट, पेषणी आणि आंत्र यांत भागबद्ध होऊ शकते, आणि प्राणी विसावला असताना स्वतःच्या स्नायूंनी हलू शकते. शरीरभिंतीत वर्तुळाकार आणि लांबीचे दोन्ही स्नायू देहगुहेच्या द्रवाविरुद्ध काम करतात, जे खरा क्रमसंकोच आणि बीळ खणणे देतात. अवयव पोकळीत कुठेही बांधता येतात, म्हणून बंद अभिसरण संस्था आणि जोडीने उत्सर्जी अवयव सोपे होतात. आणि देहगुहेचा द्रव स्वतः वहन करतो, उशी देतो आणि जननग्रंथींना हंगामानुसार फुगायला जागा. हेच विद्यार्थ्याच्या प्रश्नाचे उत्तर: देहगुहा हा अवयव नव्हे, अवयवांची पूर्वअट आहे. दोन तळटिपा जोडण्याजोग्या. पहिली अशी की अगुही, कूटदेहगुही, देहगुही हा अनुक्रम वंशवृक्ष नव्हे, संघटनाची श्रेणी आहे — रेणवीय पुरावा दाखवतो की काही चपटे कृमी आदिमपणे साधे नव्हे, दुय्यमपणे सरलीकृत आहेत, म्हणून ही नीटनेटकी शिडी वंशाचा कडक क्रम नव्हे, शरीर काय करू शकते याचे वर्णन आहे. दुसरी म्हणजे युक्तिवादाचे सामान्य रूप, जे जीवशास्त्रभर परतते: माहितीपूर्ण लक्षणे तीच जी आणखी काय शक्य आहे हे ठरवतात. देहगुहा, वहनगुच्छ, पटलबद्ध केंद्रक आणि त्रिगुणित भ्रूणपोष ही सर्व त्याच कारणाने वर्गीकारक लक्षणे — प्रत्येक असे दार उघडते जे त्याच्याविना बंद राहते. (दुसरे उत्तर परिणामाचे नाव घेऊन त्याला कारण म्हणते; तिसरे दिसण्याला कारण समजते आणि कार्यात्मक युक्तिवाद पूर्णपणे चुकवते; आणि चौथे वस्तुतः गोंधळलेले आहे, कारण देहगुहा ही रक्ताने भरलेली जागा नाही आणि कीटकांसारख्या देहगुहींत उघडे अभिसरण सामान्य आहे.)",
        },
      },
      /*H4B*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 5 — Morphology of Flowering Plants                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-11-morphology-of-flowering-plants",
    subject: "BIOLOGY",
    classLevel: 11,
    chapter: {
      en: "Chapter 5 — Morphology of Flowering Plants",
      hi: "अध्याय 5 — पुष्पी पादपों की आकारिकी",
      mr: "प्रकरण 5 — सपुष्प वनस्पतींची आकारिकी",
    },
    name: {
      en: "Morphology of Flowering Plants",
      hi: "पुष्पी पादपों की आकारिकी",
      mr: "सपुष्प वनस्पतींची आकारिकी",
    },
    summary: {
      en: "A potato and a ginger rhizome grow underground and are stems; a carrot and a sweet potato look alike and one is a root; a pea tendril is a leaf and a grapevine tendril is a stem — so the names in this chapter are settled by where a part arises and what it bears, never by where it is found or what shape it has taken.",
      hi: "आलू और अदरक का प्रकंद ज़मीन के नीचे उगते हैं और तने हैं; गाजर और शकरकंद एक जैसे दिखते हैं और एक जड़ है; मटर का प्रतान पत्ती है और अंगूर की बेल का प्रतान तना — अतः इस अध्याय के नाम इससे तय होते हैं कि कोई भाग कहाँ से निकलता है और क्या ढोता है, कभी इससे नहीं कि वह कहाँ मिलता है या उसने क्या आकार ले लिया है।",
      mr: "बटाटा आणि आल्याचा मूलक्षोड जमिनीखाली उगवतात आणि खोडे आहेत; गाजर आणि रताळे सारखे दिसतात आणि एक मूळ आहे; वाटाण्याचा तणावा हे पान आहे आणि द्राक्षवेलीचा तणावा हे खोड — म्हणून या प्रकरणातील नावे भाग कुठून निघतो आणि काय वाहतो यावरून ठरतात, तो कुठे सापडतो वा त्याने कोणता आकार घेतला यावरून कधीच नाही.",
    },
    position: 5,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "what-makes-a-stem-a-stem",
        name: {
          en: "What makes a stem a stem underground",
          hi: "ज़मीन के नीचे तने को तना क्या बनाता है",
          mr: "जमिनीखाली खोडाला खोड काय बनवते",
        },
        kind: "criterion",
        prompt: {
          en: "A potato lies buried in soil and is not a root, and the proof is on its own surface: it carries buds in the axils of tiny scale leaves, and no root ever does. Which criterion is this?",
          hi: "आलू मिट्टी में दबा पड़ा है और जड़ नहीं है, और प्रमाण उसकी अपनी सतह पर है: वह नन्ही शल्क-पत्तियों के कक्ष में कलिकाएँ ढोता है, और कोई जड़ कभी नहीं ढोती। यह कौन-सी कसौटी है?",
          mr: "बटाटा मातीत पुरलेला आहे आणि मूळ नाही, आणि पुरावा त्याच्याच पृष्ठभागावर आहे: तो इवल्या खवलेपानांच्या बगलेत कळ्या वाहतो, आणि कोणतेही मूळ कधीच वाहत नाही. ही कोणती कसोटी?",
        },
        statement: {
          en: "A stem is identified by bearing nodes with leaves and axillary buds, whatever its position or shape, so an underground potato tuber or a ginger rhizome is a stem and not a root.",
          hi: "तने की पहचान इससे होती है कि वह पर्व-संधियाँ ढोता है जिन पर पत्तियाँ और कक्षस्थ कलिकाएँ हों, चाहे उसकी स्थिति या आकार कुछ भी हो, अतः ज़मीन के नीचे का आलू का कंद या अदरक का प्रकंद तना है, जड़ नहीं।",
          mr: "खोडाची ओळख अशी की तो पेरे वाहतो ज्यांवर पाने आणि बगलेतल्या कळ्या असतात, त्याची जागा वा आकार काहीही असो, म्हणून जमिनीखालचा बटाट्याचा कंद वा आल्याचा मूलक्षोड हे खोड आहे, मूळ नव्हे.",
        },
        detail: {
          en: "The eyes of a potato are exactly those buds, which is why a cut piece with an eye grows a new plant and a piece without one does not.",
          hi: "आलू की आँखें ठीक वही कलिकाएँ हैं, इसीलिए आँख वाला कटा टुकड़ा नया पौधा उगाता है और बिना आँख वाला नहीं।",
          mr: "बटाट्याचे डोळे नेमक्या त्याच कळ्या, म्हणूनच डोळा असलेला कापलेला तुकडा नवे रोप उगवतो आणि डोळा नसलेला उगवत नाही.",
        },
        extra: {
          en: "Roots never bear leaves or buds at all, and they carry a root cap and root hairs instead, so the two are never genuinely ambiguous once you look.",
          hi: "जड़ें कभी पत्तियाँ या कलिकाएँ ढोती ही नहीं, और उनके बजाय मूलगोप और मूलरोम ढोती हैं, अतः एक बार देख लेने पर दोनों में कभी सचमुच संदेह नहीं रहता।",
          mr: "मुळे कधीच पाने वा कळ्या वाहत नाहीत, आणि त्यांच्याऐवजी मूलटोपी आणि मूलकेस वाहतात, म्हणून एकदा पाहिल्यावर दोघांत कधीच खरा संभ्रम राहत नाही.",
        },
        pair: {
          left: {
            en: "An eye in the potato, a bud in the axil",
            hi: "आलू में आँख, कक्ष में कलिका",
            mr: "बटाट्यात डोळा, बगलेत कळी",
          },
          right: {
            en: "what makes a stem a stem underground",
            hi: "ज़मीन के नीचे तने को तना क्या बनाता है",
            mr: "जमिनीखाली खोडाला खोड काय बनवते",
          },
        },
      },
      {
        id: "one-root-or-many-from-the-start",
        name: {
          en: "One root that keeps going, or many that start over",
          hi: "एक जड़ जो चलती रहे, या बहुत-सी जो नए सिरे से शुरू हों",
          mr: "चालत राहणारे एक मूळ, वा नव्याने सुरू होणारी अनेक",
        },
        kind: "contrast",
        prompt: {
          en: "Pull up a mustard seedling and one thick root goes straight down with side branches; pull up a rice seedling and a bundle of similar roots comes from the base of the stem. Which distinction is this?",
          hi: "सरसों का अंकुर उखाड़ो तो एक मोटी जड़ सीधी नीचे जाती है जिसमें बग़ल की शाखाएँ हैं; धान का अंकुर उखाड़ो तो तने के आधार से एक जैसी जड़ों का गुच्छा निकलता है। यह कौन-सा भेद है?",
          mr: "मोहरीचे रोप उपटा आणि एक जाड मूळ सरळ खाली जाते ज्याला बाजूच्या फांद्या आहेत; भाताचे रोप उपटा आणि खोडाच्या तळातून सारख्या मुळांचा जुडगा निघतो. हा कोणता भेद?",
        },
        statement: {
          en: "A taproot is the persistent primary root of the embryo with lateral branches, while a fibrous root system replaces the primary root early with many similar roots arising from the stem base.",
          hi: "मूसला जड़ भ्रूण की स्थायी प्राथमिक जड़ है जिसकी पार्श्व शाखाएँ होती हैं, जबकि रेशेदार जड़-तंत्र प्राथमिक जड़ को जल्दी हटाकर तने के आधार से निकलती बहुत-सी एक जैसी जड़ें रख देता है।",
          mr: "सोटमूळ हे गर्भाचे टिकाऊ प्राथमिक मूळ ज्याला बाजूच्या फांद्या असतात, तर तंतुमय मूलसंस्था प्राथमिक मूळ लवकर बदलून खोडाच्या तळातून निघणारी अनेक सारखी मुळे ठेवते.",
        },
        detail: {
          en: "The pattern tracks the two classes almost perfectly: dicots have taproots and monocots have fibrous roots, which is one of the quickest field tests there is.",
          hi: "यह प्रतिरूप दोनों वर्गों का लगभग पूर्ण अनुसरण करता है: द्विबीजपत्रियों में मूसला जड़ें और एकबीजपत्रियों में रेशेदार, और यह सबसे तेज़ क्षेत्र-परीक्षणों में है।",
          mr: "हा आकृतिबंध दोन्ही वर्गांचे जवळपास परिपूर्ण अनुसरण करतो: द्विदल वनस्पतींत सोटमुळे आणि एकदल वनस्पतींत तंतुमय, आणि ही सर्वांत जलद क्षेत्र-चाचण्यांपैकी एक.",
        },
        extra: {
          en: "The difference is not merely descriptive: a taproot reaches deep water in a dry season and a fibrous mat grips loose topsoil against erosion, which is why grasses hold a bund and a tree does not.",
          hi: "यह अंतर केवल वर्णनात्मक नहीं: मूसला जड़ सूखे मौसम में गहरे पानी तक पहुँचती है और रेशेदार चटाई ऊपरी ढीली मिट्टी को कटाव के विरुद्ध जकड़ती है, इसीलिए घास मेड़ थामती है और वृक्ष नहीं।",
          mr: "हा फरक केवळ वर्णनात्मक नाही: सोटमूळ कोरड्या हंगामात खोल पाण्यापर्यंत पोहोचते आणि तंतुमय चटई वरची सैल माती धुपेविरुद्ध पकडते, म्हणूनच गवत बांध धरते आणि वृक्ष धरत नाही.",
        },
        pair: {
          left: {
            en: "Grass holds the bund, the tree does not",
            hi: "घास मेड़ थामती है, वृक्ष नहीं",
            mr: "गवत बांध धरते, वृक्ष धरत नाही",
          },
          right: {
            en: "one root that keeps going, or many that start over",
            hi: "एक जड़ जो चलती रहे, या बहुत-सी जो नए सिरे से शुरू हों",
            mr: "चालत राहणारे एक मूळ, वा नव्याने सुरू होणारी अनेक",
          },
        },
      },
      {
        id: "the-same-organ-doing-a-different-job",
        name: {
          en: "The same organ hired for another job",
          hi: "वही अंग दूसरी नौकरी पर रखा गया",
          mr: "तोच अवयव दुसऱ्या कामावर ठेवलेला",
        },
        kind: "concept",
        prompt: {
          en: "A cactus spine and a pea tendril and an onion scale do three completely different jobs, and all three developed from the same organ, which is why each still sits at a node with a bud above it. What is this?",
          hi: "कैक्टस का काँटा, मटर का प्रतान और प्याज़ की शल्क तीन बिलकुल भिन्न काम करते हैं, और तीनों उसी एक अंग से विकसित हुए, इसीलिए हर एक अब भी पर्व-संधि पर बैठा है जिसके ऊपर कलिका है। यह क्या है?",
          mr: "निवडुंगाचा काटा, वाटाण्याचा तणावा आणि कांद्याचा खवला ही तीन पूर्णपणे वेगळी कामे करतात, आणि तिन्ही त्याच एका अवयवापासून विकसित झाली, म्हणूनच प्रत्येक अजूनही पेरावर बसलेले आहे ज्याच्या वर कळी आहे. हे काय?",
        },
        statement: {
          en: "Modification is the conversion of an organ to a new function without changing what it is, so a leaf may become a spine, a tendril, a storage scale or a pitcher and remain a leaf by origin and position.",
          hi: "रूपांतरण किसी अंग का नए कार्य में बदलना है, वह क्या है यह बदले बिना, अतः पत्ती काँटा, प्रतान, संचयी शल्क या घट बन सकती है और उद्गम तथा स्थिति से पत्ती ही रहती है।",
          mr: "रूपांतर म्हणजे एखाद्या अवयवाचे नव्या कार्यात बदलणे, तो काय आहे ते न बदलता, म्हणून पान काटा, तणावा, साठवण-खवला वा घट बनू शकते आणि उगम व स्थानाने पानच राहते.",
        },
        detail: {
          en: "Position is the giveaway: a leaf-derived tendril arises where a leaf would, and a stem-derived one arises in the axil where a branch would.",
          hi: "स्थिति ही भेद खोल देती है: पत्ती से बना प्रतान वहीं निकलता है जहाँ पत्ती निकलती, और तने से बना कक्ष में जहाँ शाखा निकलती।",
          mr: "स्थानच रहस्य उघडते: पानापासून बनलेला तणावा तिथेच निघतो जिथे पान निघाले असते, आणि खोडापासून बनलेला बगलेत जिथे फांदी निघाली असती.",
        },
        extra: {
          en: "The same logic sorts a pea tendril, which is a leaf, from a grapevine tendril, which is a stem, though the two look and behave identically.",
          hi: "वही तर्क मटर के प्रतान को, जो पत्ती है, अंगूर की बेल के प्रतान से अलग करता है, जो तना है, यद्यपि दोनों एक जैसे दिखते और बर्ताव करते हैं।",
          mr: "तोच तर्क वाटाण्याचा तणावा, जो पान आहे, द्राक्षवेलीच्या तणाव्यापासून वेगळा करतो, जो खोड आहे, जरी दोघे सारखे दिसतात आणि वागतात.",
        },
        pair: {
          left: {
            en: "Two tendrils, two different organs",
            hi: "दो प्रतान, दो भिन्न अंग",
            mr: "दोन तणावे, दोन वेगळे अवयव",
          },
          right: {
            en: "the same organ hired for another job",
            hi: "वही अंग दूसरी नौकरी पर रखा गया",
            mr: "तोच अवयव दुसऱ्या कामावर ठेवलेला",
          },
        },
      },
      {
        id: "how-a-leaf-is-divided",
        name: {
          en: "One blade or many, and how to tell",
          hi: "एक फलक या बहुत, और पहचानें कैसे",
          mr: "एक पाते वा अनेक, आणि ओळखायचे कसे",
        },
        kind: "criterion",
        prompt: {
          en: "A neem twig looks like a branch bearing many small leaves, but there is no bud where any of them joins, and there is one at the base of the whole thing. Which distinction is settled by that?",
          hi: "नीम की टहनी बहुत-सी छोटी पत्तियाँ ढोती शाखा जैसी दिखती है, पर उनमें से कोई जहाँ जुड़ती है वहाँ कलिका नहीं, और पूरी चीज़ के आधार पर एक है। उससे कौन-सा भेद निपटता है?",
          mr: "कडुनिंबाची फांदी अनेक लहान पाने वाहणाऱ्या फांदीसारखी दिसते, पण त्यांतले कोणतेही जिथे जोडते तिथे कळी नाही, आणि अख्ख्या गोष्टीच्या तळाशी एक आहे. त्याने कोणता भेद निकाली निघतो?",
        },
        statement: {
          en: "A simple leaf has an undivided blade and a compound leaf is divided into leaflets, and the test is the axillary bud: it sits at the base of the whole leaf and never in the axil of a leaflet.",
          hi: "सरल पत्ती का फलक अविभाजित होता है और संयुक्त पत्ती पर्णकों में विभाजित, और परीक्षण है कक्षस्थ कलिका: वह पूरी पत्ती के आधार पर बैठती है और कभी किसी पर्णक के कक्ष में नहीं।",
          mr: "साध्या पानाचे पाते अविभाजित असते आणि संयुक्त पान पर्णिकांत विभागलेले, आणि चाचणी म्हणजे बगलेतली कळी: ती अख्ख्या पानाच्या तळाशी बसते आणि कधीच कोणत्याही पर्णिकेच्या बगलेत नाही.",
        },
        detail: {
          en: "A leaflet also has no bud of its own and cannot grow into a shoot, which is the same fact stated from the other side.",
          hi: "पर्णक की अपनी कोई कलिका भी नहीं होती और वह प्ररोह में नहीं बढ़ सकता, जो वही तथ्य दूसरी ओर से कहा गया है।",
          mr: "पर्णिकेला स्वतःची कळीही नसते आणि ती प्ररोहात वाढू शकत नाही, जे तेच तथ्य दुसऱ्या बाजूने सांगितलेले आहे.",
        },
        extra: {
          en: "Compound leaves are pinnate when the leaflets are arranged along an axis, as in neem, and palmate when they radiate from a point, as in silk cotton.",
          hi: "संयुक्त पत्तियाँ पिच्छाकार होती हैं जब पर्णक किसी अक्ष के अनुदिश लगे हों, जैसे नीम में, और हस्ताकार जब वे एक बिंदु से फैलें, जैसे सेमल में।",
          mr: "संयुक्त पाने पिसासारखी असतात जेव्हा पर्णिका एका अक्षावर मांडलेल्या असतात, जसे कडुनिंबात, आणि हातासारखी जेव्हा त्या एका बिंदूतून पसरतात, जसे काटेसावरीत.",
        },
        pair: {
          left: {
            en: "Look for the bud, not for the shape",
            hi: "आकार नहीं, कलिका ढूँढ़ो",
            mr: "आकार नव्हे, कळी शोधा",
          },
          right: {
            en: "one blade or many, and how to tell",
            hi: "एक फलक या बहुत, और पहचानें कैसे",
            mr: "एक पाते वा अनेक, आणि ओळखायचे कसे",
          },
        },
      },
      {
        id: "the-flower-read-as-four-whorls",
        name: {
          en: "Four rings, read from the outside in",
          hi: "चार वलय, बाहर से भीतर की ओर पढ़े",
          mr: "चार वलये, बाहेरून आत वाचलेली",
        },
        kind: "structure",
        prompt: {
          en: "Take any flower apart and the parts come off in the same order in every species: protective, attractive, pollen-bearing, ovule-bearing, arranged in circles on a swollen stalk tip. Which arrangement is this?",
          hi: "किसी भी पुष्प को अलग करो और भाग हर जाति में उसी क्रम में उतरते हैं: रक्षक, आकर्षक, पराग-धारी, बीजांड-धारी, फूले हुए वृंत-शीर्ष पर वृत्तों में सजे। यह कौन-सी व्यवस्था है?",
          mr: "कोणतेही फूल वेगळे करा आणि भाग प्रत्येक जातीत त्याच क्रमाने निघतात: संरक्षक, आकर्षक, परागवाही, बीजांडवाही, फुगलेल्या देठाच्या टोकावर वर्तुळांत मांडलेले. ही कोणती मांडणी?",
        },
        statement: {
          en: "A flower is four whorls on the thalamus — calyx of sepals, corolla of petals, androecium of stamens and gynoecium of carpels — of which the last two are the reproductive whorls and the first two accessory.",
          hi: "पुष्प पुष्पासन पर चार चक्र हैं — बाह्यदलों का बाह्यदलपुंज, दलों का दलपुंज, पुंकेसरों का पुमंग और अंडपों का जायांग — जिनमें अंतिम दो जननिक चक्र हैं और पहले दो सहायक।",
          mr: "फूल म्हणजे पुष्पासनावरची चार वलये — निदलांचे निदलपुंज, पाकळ्यांचे दलपुंज, पुंकेसरांचे पुंकेसरमंडल आणि किंजदलांचे जायांग — ज्यांतली शेवटची दोन प्रजननात्मक वलये आणि पहिली दोन सहायक.",
        },
        detail: {
          en: "The reproductive whorls are the ones that cannot be missing without changing what the flower can do, and a flower lacking either is called unisexual.",
          hi: "जननिक चक्र वे हैं जिनके बिना पुष्प जो कर सकता है वह बदल जाता है, और जिस पुष्प में उनमें से कोई न हो उसे एकलिंगी कहते हैं।",
          mr: "प्रजननात्मक वलये तीच ज्यांच्याविना फूल जे करू शकते ते बदलते, आणि ज्या फुलात त्यांपैकी एक नसेल त्याला एकलिंगी म्हणतात.",
        },
        extra: {
          en: "The accessory whorls are where most of the variety is, because they answer to pollinators rather than to the plant's own machinery — which is why wind-pollinated grasses have almost no petals at all.",
          hi: "विविधता का अधिकांश सहायक चक्रों में है, क्योंकि वे पादप की अपनी मशीनरी को नहीं, परागणकर्ताओं को उत्तर देते हैं — इसीलिए पवन-परागित घासों में दल लगभग होते ही नहीं।",
          mr: "बहुतांश विविधता सहायक वलयांत आहे, कारण ती वनस्पतीच्या स्वतःच्या यंत्रणेला नव्हे, परागवाहकांना उत्तर देतात — म्हणूनच वारा-परागित गवतांत पाकळ्या जवळपास नसतातच.",
        },
        pair: {
          left: {
            en: "Grass has no petals and needs none",
            hi: "घास में दल नहीं और चाहिए भी नहीं",
            mr: "गवताला पाकळ्या नाहीत आणि लागतही नाहीत",
          },
          right: {
            en: "four rings, read from the outside in",
            hi: "चार वलय, बाहर से भीतर की ओर पढ़े",
            mr: "चार वलये, बाहेरून आत वाचलेली",
          },
        },
      },
      {
        id: "where-the-ovary-sits-relative-to-the-rest",
        name: {
          en: "Whether the ovary sits above or below",
          hi: "अंडाशय ऊपर बैठा है या नीचे",
          mr: "अंडाशय वर बसले आहे की खाली",
        },
        kind: "criterion",
        prompt: {
          en: "In a mustard flower the other three whorls are attached below the ovary; in a guava flower they are attached above it, and you can read which from the scar on the fruit. Which character is this?",
          hi: "सरसों के पुष्प में बाक़ी तीन चक्र अंडाशय के नीचे लगे होते हैं; अमरूद के पुष्प में वे उसके ऊपर लगे होते हैं, और कौन-सा है यह फल पर बने निशान से पढ़ा जा सकता है। यह कौन-सा लक्षण है?",
          mr: "मोहरीच्या फुलात इतर तीन वलये अंडाशयाच्या खाली जोडलेली असतात; पेरूच्या फुलात ती त्याच्या वर जोडलेली असतात, आणि कोणते ते फळावरच्या व्रणावरून वाचता येते. हे कोणते लक्षण?",
        },
        statement: {
          en: "The position of the ovary defines the flower as hypogynous when the ovary is above the other whorls, perigynous when they are at about the same level, and epigynous when the ovary is below them.",
          hi: "अंडाशय की स्थिति पुष्प को अधोजाय बनाती है जब अंडाशय बाक़ी चक्रों से ऊपर हो, परिजाय जब वे लगभग एक ही तल पर हों, और उपरिजाय जब अंडाशय उनसे नीचे हो।",
          mr: "अंडाशयाचे स्थान फुलाला अधोजाय बनवते जेव्हा अंडाशय इतर वलयांहून वर असते, परिजाय जेव्हा ती जवळपास एकाच पातळीवर असतात, आणि उपरिजाय जेव्हा अंडाशय त्यांच्या खाली असते.",
        },
        detail: {
          en: "In an epigynous flower the thalamus has grown up around the ovary and fused with it, so the fruit carries the remains of the other whorls at its far end.",
          hi: "उपरिजाय पुष्प में पुष्पासन अंडाशय के चारों ओर ऊपर बढ़कर उससे जुड़ गया है, अतः फल अपने दूर वाले सिरे पर बाक़ी चक्रों के अवशेष ढोता है।",
          mr: "उपरिजाय फुलात पुष्पासन अंडाशयाभोवती वर वाढून त्याच्याशी जुळले आहे, म्हणून फळ आपल्या दूरच्या टोकावर इतर वलयांचे अवशेष वाहते.",
        },
        extra: {
          en: "That is the little dry crown on the end of a guava or a pomegranate, and it is direct evidence of where the ovary sat in the flower months earlier.",
          hi: "वही अमरूद या अनार के सिरे पर लगा नन्हा सूखा मुकुट है, और वह इसका सीधा प्रमाण है कि महीनों पहले पुष्प में अंडाशय कहाँ बैठा था।",
          mr: "तोच पेरू वा डाळिंबाच्या टोकावरचा इवला वाळका मुकुट, आणि तो महिन्यांपूर्वी फुलात अंडाशय कुठे बसले होते याचा थेट पुरावा.",
        },
        pair: {
          left: {
            en: "The dry crown on the end of a guava",
            hi: "अमरूद के सिरे पर सूखा मुकुट",
            mr: "पेरूच्या टोकावरचा वाळका मुकुट",
          },
          right: {
            en: "whether the ovary sits above or below",
            hi: "अंडाशय ऊपर बैठा है या नीचे",
            mr: "अंडाशय वर बसले आहे की खाली",
          },
        },
      },
      /*F5B*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student says a potato is a root because it grows underground and stores food, and a carrot is a root for the same two reasons. Assess both claims and give the test that settles them.",
          hi: "एक विद्यार्थी कहता है कि आलू जड़ है क्योंकि वह ज़मीन के नीचे उगता है और भोजन संचित करता है, और गाजर उन्हीं दो कारणों से जड़ है। दोनों दावों का आकलन करो और वह परीक्षण दो जो उन्हें निपटा दे।",
          mr: "एक विद्यार्थी म्हणतो की बटाटा मूळ आहे कारण तो जमिनीखाली उगवतो आणि अन्न साठवतो, आणि गाजर त्याच दोन कारणांनी मूळ आहे. दोन्ही दाव्यांचे मूल्यमापन करा आणि ते निकाली काढणारी चाचणी द्या.",
        },
        choices: [
          {
            en: "The carrot claim is right and the potato claim is wrong, and both reasons given are worthless either way. Neither depth nor storage decides anything: onions, ginger and potatoes are all underground stores and all three are stems. The test is what the organ bears. A potato has nodes with scale leaves and axillary buds — its eyes — so it is a stem tuber, and a piece cut with an eye will sprout. A carrot has no nodes, no leaves and no buds anywhere along it; it has a root cap and root hairs and bears lateral roots, so it is a taproot swollen with food",
            hi: "गाजर वाला दावा सही है और आलू वाला ग़लत, और दिए गए दोनों कारण किसी भी हाल में बेकार हैं। न गहराई कुछ तय करती है न संचय: प्याज़, अदरक और आलू सब ज़मीन के नीचे के भंडार हैं और तीनों तने हैं। परीक्षण यह है कि अंग ढोता क्या है। आलू में शल्क-पत्तियों और कक्षस्थ कलिकाओं वाली पर्व-संधियाँ हैं — उसकी आँखें — अतः वह स्तंभ कंद है, और आँख सहित काटा टुकड़ा अंकुरित होगा। गाजर में कहीं भी न पर्व-संधियाँ हैं, न पत्तियाँ, न कलिकाएँ; उसमें मूलगोप और मूलरोम हैं और वह पार्श्व जड़ें ढोती है, अतः वह भोजन से फूली मूसला जड़ है",
            mr: "गाजराचा दावा बरोबर आणि बटाट्याचा चुकीचा, आणि दिलेली दोन्ही कारणे कोणत्याही परिस्थितीत निरुपयोगी. ना खोली काही ठरवते ना साठवण: कांदा, आले आणि बटाटा सर्व जमिनीखालचे साठे आणि तिन्ही खोडे आहेत. चाचणी अशी की अवयव काय वाहतो. बटाट्यात खवलेपाने आणि बगलेतल्या कळ्या असलेली पेरे आहेत — त्याचे डोळे — म्हणून तो खोडकंद आहे, आणि डोळ्यासह कापलेला तुकडा फुटेल. गाजरात कुठेही ना पेरे आहेत, ना पाने, ना कळ्या; त्यात मूलटोपी आणि मूलकेस आहेत आणि ते बाजूची मुळे वाहते, म्हणून ते अन्नाने फुगलेले सोटमूळ आहे",
          },
          {
            en: "Both claims are right: any underground storage organ is a root, which is why the two are always studied together",
            hi: "दोनों दावे सही हैं: ज़मीन के नीचे का कोई भी संचयी अंग जड़ है, इसीलिए दोनों सदा साथ पढ़े जाते हैं",
            mr: "दोन्ही दावे बरोबर: जमिनीखालचा कोणताही साठवण-अवयव मूळ आहे, म्हणूनच दोन्ही नेहमी एकत्र अभ्यासली जातात",
          },
          {
            en: "Both claims are wrong: a potato and a carrot are both modified stems, since only stems can store starch",
            hi: "दोनों दावे ग़लत हैं: आलू और गाजर दोनों रूपांतरित तने हैं, क्योंकि मंड केवल तने ही संचित कर सकते हैं",
            mr: "दोन्ही दावे चुकीचे: बटाटा आणि गाजर दोन्ही रूपांतरित खोडे आहेत, कारण पिष्ट केवळ खोडेच साठवू शकतात",
          },
          {
            en: "The potato claim is right and the carrot claim is wrong, because a carrot grows partly above the soil and anything visible above soil is a stem",
            hi: "आलू वाला दावा सही है और गाजर वाला ग़लत, क्योंकि गाजर आंशिक रूप से मिट्टी के ऊपर उगती है और मिट्टी के ऊपर जो भी दिखे वह तना है",
            mr: "बटाट्याचा दावा बरोबर आणि गाजराचा चुकीचा, कारण गाजर अंशतः मातीच्या वर उगवते आणि मातीवर जे दिसते ते खोड आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Look at the reasoning before the answers, because the student has arrived at one right conclusion for entirely wrong reasons, and that is worth catching. Both criteria offered — being underground, storing food — describe circumstances rather than identity. Consider what else they would sweep in. An onion is underground and stores food; it is a stem with fleshy leaves. Ginger and turmeric grow underground and store food; both are rhizomes, which are stems. Colocasia and Amorphophallus produce corms, again stems. Meanwhile some roots are above ground and store nothing: the prop roots of a banyan and the stilt roots of maize hold the plant up, and the breathing roots of a mangrove stick out of mud into air. Position and function are supplied by the environment and the plant's needs, and organs of every kind take them up as required. Now the test that does work. A stem, wherever it is and whatever it is doing, has nodes; at a node there is a leaf, however reduced, and in the axil of that leaf there is a bud. A root has none of these three, ever. It has instead a root cap protecting the growing tip and root hairs behind it, and it produces lateral roots from deep inside its own tissue rather than from the surface. Apply this to a potato. The eyes are the giveaway: each eye is an axillary bud, and if you look closely there is a small scale leaf below it — so the potato has nodes, and it is a stem tuber. The practical proof is one every farmer uses. Cut a potato into pieces and plant them; every piece bearing an eye grows a new plant and every piece without one rots. That is a bud doing what only a bud can do. Now a carrot. Run a finger along it and there are no nodes, no scales and no buds anywhere; the marks on the surface are the scars of lateral roots, which emerge in rows because they arise from internal tissue in files. The top of a carrot does carry a tuft of leaves, but that tuft is the stem — the very short compressed stem at the top of the root, which is why a carrot top will sprout leaves in a saucer of water and yet cannot produce a whole new plant the way a potato piece can. So the carrot is a taproot: the primary root of the embryo, swollen with stored food. The lesson here is the same as the one running through the chapter and through animal classification too: an organ is named by its origin and what it bears, never by its position, its shape or its job. That is why a pea tendril is a leaf and a grapevine tendril is a stem though they do the same work, and why a cactus spine is a leaf while a bougainvillea thorn is a stem. Ask where it arises and what sits in its axil, and the question answers itself every time. (The second answer keeps the failed criterion; the third states something false about starch and gets the carrot wrong to save a rule; and the fourth invents a position rule that would make a prop root a stem.)",
          hi: "उत्तरों से पहले तर्क देखो, क्योंकि विद्यार्थी बिलकुल ग़लत कारणों से एक सही निष्कर्ष पर पहुँच गया है, और यह पकड़ने योग्य है। दी गई दोनों कसौटियाँ — ज़मीन के नीचे होना, भोजन संचित करना — पहचान नहीं, परिस्थिति का वर्णन करती हैं। सोचो कि वे और क्या-क्या समेट लेतीं। प्याज़ ज़मीन के नीचे है और भोजन संचित करता है; वह मांसल पत्तियों वाला तना है। अदरक और हल्दी ज़मीन के नीचे उगते और भोजन संचित करते हैं; दोनों प्रकंद हैं, जो तने हैं। अरबी और सूरन घनकंद बनाते हैं, फिर तने। दूसरी ओर कुछ जड़ें ज़मीन के ऊपर हैं और कुछ संचित नहीं करतीं: बरगद की अवस्तंभ जड़ें और मक्का की अवरोही जड़ें पौधे को थामती हैं, और मैंग्रोव की श्वसन जड़ें कीचड़ से निकलकर हवा में तनी रहती हैं। स्थिति और कार्य पर्यावरण और पादप की ज़रूरत देती है, और हर क़िस्म के अंग उन्हें आवश्यकतानुसार उठा लेते हैं। अब वह परीक्षण जो काम करता है। तना, चाहे कहीं भी हो और कुछ भी कर रहा हो, पर्व-संधियाँ रखता है; पर्व-संधि पर पत्ती होती है, चाहे कितनी ही घटी हुई, और उस पत्ती के कक्ष में कलिका। जड़ में ये तीनों कभी नहीं होते। उसके बजाय उसमें बढ़ते शीर्ष की रक्षा करता मूलगोप और उसके पीछे मूलरोम होते हैं, और वह पार्श्व जड़ें सतह से नहीं, अपने ही ऊतक के भीतर गहरे से निकालती है। इसे आलू पर लगाओ। आँखें ही भेद खोल देती हैं: हर आँख एक कक्षस्थ कलिका है, और ग़ौर से देखो तो उसके नीचे नन्ही शल्क-पत्ती है — अतः आलू में पर्व-संधियाँ हैं, और वह स्तंभ कंद है। व्यावहारिक प्रमाण वही है जिसे हर किसान बरतता है। आलू को टुकड़ों में काटकर बो दो; आँख वाला हर टुकड़ा नया पौधा उगाता है और बिना आँख वाला हर टुकड़ा सड़ जाता है। वही कलिका वह कर रही है जो केवल कलिका कर सकती है। अब गाजर। उस पर उँगली फेरो और कहीं न पर्व-संधियाँ हैं, न शल्क, न कलिकाएँ; सतह के निशान पार्श्व जड़ों के घाव हैं, जो पंक्तियों में निकलते हैं क्योंकि वे भीतरी ऊतक से क़तारों में उठते हैं। गाजर के ऊपर पत्तियों का गुच्छा ज़रूर होता है, पर वह गुच्छा तना है — जड़ के शीर्ष पर बहुत छोटा संपीडित तना, इसीलिए गाजर का ऊपरी हिस्सा तश्तरी भर पानी में पत्तियाँ निकाल देता है और फिर भी वैसा पूरा नया पौधा नहीं बना सकता जैसा आलू का टुकड़ा बना देता है। अतः गाजर मूसला जड़ है: भ्रूण की प्राथमिक जड़, संचित भोजन से फूली हुई। यहाँ की सीख वही है जो पूरे अध्याय में और प्राणी-वर्गीकरण में भी चलती है: अंग का नाम उसके उद्गम और वह क्या ढोता है उससे पड़ता है, कभी उसकी स्थिति, आकार या नौकरी से नहीं। इसीलिए मटर का प्रतान पत्ती है और अंगूर की बेल का प्रतान तना, यद्यपि वे वही काम करते हैं, और इसीलिए कैक्टस का काँटा पत्ती है जबकि बोगनवेलिया का काँटा तना। पूछो कि वह कहाँ से निकलता है और उसके कक्ष में क्या बैठा है, और प्रश्न हर बार ख़ुद उत्तर दे देता है। (दूसरा उत्तर विफल कसौटी बनाए रखता है; तीसरा मंड के बारे में झूठ कहता है और नियम बचाने को गाजर ग़लत कर देता है; और चौथा स्थिति का ऐसा नियम गढ़ता है जो अवस्तंभ जड़ को तना बना देता।)",
          mr: "उत्तरांआधी युक्तिवाद पाहा, कारण विद्यार्थी पूर्णपणे चुकीच्या कारणांनी एका बरोबर निष्कर्षावर पोहोचला आहे, आणि हे पकडण्याजोगे. दिलेल्या दोन्ही कसोट्या — जमिनीखाली असणे, अन्न साठवणे — ओळख नव्हे, परिस्थितीचे वर्णन करतात. विचार करा त्या आणखी काय काय आत ओढतील. कांदा जमिनीखाली आहे आणि अन्न साठवतो; तो मांसल पानांचे खोड आहे. आले आणि हळद जमिनीखाली उगवतात आणि अन्न साठवतात; दोन्ही मूलक्षोड, जे खोडे आहेत. अळू आणि सुरण घनकंद बनवतात, पुन्हा खोडे. दुसरीकडे काही मुळे जमिनीवर आहेत आणि काहीच साठवत नाहीत: वडाची आधारमुळे आणि मक्याची आधारमुळे रोपाला धरतात, आणि खारफुटीची श्वसनमुळे चिखलातून निघून हवेत ताठ राहतात. स्थान आणि कार्य पर्यावरण आणि वनस्पतीची गरज देते, आणि प्रत्येक प्रकारचे अवयव ती गरजेनुसार उचलतात. आता ती चाचणी जी काम करते. खोड, ते कुठेही असो आणि काहीही करत असो, पेरे ठेवते; पेरावर पान असते, कितीही घटलेले असो, आणि त्या पानाच्या बगलेत कळी. मुळात ही तिन्ही कधीच नसतात. त्याऐवजी त्यात वाढत्या टोकाचे रक्षण करणारी मूलटोपी आणि तिच्यामागे मूलकेस असतात, आणि ते बाजूची मुळे पृष्ठभागातून नव्हे, स्वतःच्याच ऊतीच्या आत खोलवरून काढते. हे बटाट्यावर लावा. डोळेच रहस्य उघडतात: प्रत्येक डोळा ही बगलेतली कळी, आणि नीट पाहिल्यास तिच्याखाली इवले खवलेपान आहे — म्हणून बटाट्यात पेरे आहेत, आणि तो खोडकंद आहे. व्यावहारिक पुरावा तोच जो प्रत्येक शेतकरी वापरतो. बटाट्याचे तुकडे करून लावा; डोळा असलेला प्रत्येक तुकडा नवे रोप उगवतो आणि डोळा नसलेला प्रत्येक तुकडा कुजतो. तीच कळी तेच करते जे केवळ कळी करू शकते. आता गाजर. त्यावर बोट फिरवा आणि कुठेही ना पेरे आहेत, ना खवले, ना कळ्या; पृष्ठभागावरचे व्रण बाजूच्या मुळांचे, जी रांगांत निघतात कारण ती आतल्या ऊतीतून ओळींनी उठतात. गाजराच्या वर पानांचा झुबका असतो खरा, पण तो झुबका म्हणजे खोड — मुळाच्या टोकावरचे अतिशय आखूड दाबलेले खोड, म्हणूनच गाजराचा वरचा भाग बशीभर पाण्यात पाने काढतो आणि तरीही बटाट्याचा तुकडा बनवतो तसे अख्खे नवे रोप बनवू शकत नाही. म्हणून गाजर हे सोटमूळ: गर्भाचे प्राथमिक मूळ, साठवलेल्या अन्नाने फुगलेले. इथला धडा तोच जो अख्ख्या प्रकरणातून आणि प्राणी-वर्गीकरणातूनही चालतो: अवयवाचे नाव त्याच्या उगमावरून आणि तो काय वाहतो त्यावरून पडते, त्याच्या स्थानावरून, आकारावरून वा कामावरून कधीच नाही. म्हणूनच वाटाण्याचा तणावा पान आहे आणि द्राक्षवेलीचा तणावा खोड, जरी ते तेच काम करतात, आणि म्हणूनच निवडुंगाचा काटा पान आहे तर बोगनवेलचा काटा खोड. विचारा की तो कुठून निघतो आणि त्याच्या बगलेत काय बसले आहे, आणि प्रश्न प्रत्येक वेळी स्वतःच उत्तर देतो. (दुसरे उत्तर अपयशी कसोटी टिकवते; तिसरे पिष्टाबद्दल खोटे सांगते आणि नियम वाचवायला गाजर चुकवते; आणि चौथे स्थानाचा असा नियम रचते जो आधारमुळाला खोड ठरवेल.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A student asks why botanists bother with a floral formula when a drawing of the flower says more. Explain what the formula records and why it, rather than the drawing, is what identifies a family.",
          hi: "एक विद्यार्थी पूछता है कि जब पुष्प का चित्र अधिक बताता है तो वनस्पतिविद पुष्प-सूत्र की झंझट क्यों करते हैं। बताओ कि सूत्र क्या दर्ज करता है और चित्र नहीं, वही कुल की पहचान क्यों कराता है।",
          mr: "एक विद्यार्थी विचारतो की फुलाचे चित्र अधिक सांगत असताना वनस्पतिशास्त्रज्ञ पुष्पसूत्राची कटकट का करतात. सूत्र काय नोंदवते आणि चित्र नव्हे, तेच कुल का ओळखवते, ते समजावा.",
        },
        choices: [
          {
            en: "The formula records only the characters that are constant within a family and ignores everything a pollinator can change. It states how many parts are in each whorl, whether they are free or fused, whether the ovary is above or below the other whorls, and the symmetry — all fixed early in development. Colour, size and scent are left out precisely because they vary between species of the same family and even between varieties of one species. A drawing shows an individual flower; the formula shows the plan, and it is the plan that is inherited",
            hi: "सूत्र केवल वे लक्षण दर्ज करता है जो कुल के भीतर अचर हैं और वह सब अनदेखा कर देता है जिसे कोई परागणकर्ता बदल सकता है। वह बताता है कि हर चक्र में कितने भाग हैं, वे मुक्त हैं या संयुक्त, अंडाशय बाक़ी चक्रों से ऊपर है या नीचे, और सममिति — सब परिवर्धन में जल्दी तय। रंग, आकार और गंध ठीक इसलिए छोड़ दिए जाते हैं कि वे एक ही कुल की जातियों में और एक ही जाति की क़िस्मों तक में बदलते हैं। चित्र एक व्यष्टि पुष्प दिखाता है; सूत्र योजना दिखाता है, और वंशागत योजना ही होती है",
            mr: "सूत्र केवळ तीच लक्षणे नोंदवते जी कुलाच्या आत अचल आहेत आणि परागवाहक बदलू शकेल ते सर्व दुर्लक्षते. ते सांगते की प्रत्येक वलयात किती भाग आहेत, ते मोकळे आहेत की जुळलेले, अंडाशय इतर वलयांहून वर आहे की खाली, आणि सममिती — सर्व विकासात लवकर ठरणारे. रंग, आकार आणि गंध नेमके यासाठी वगळले जातात की ते एकाच कुलाच्या जातींत आणि एकाच जातीच्या प्रकारांतही बदलतात. चित्र एक व्यक्तिगत फूल दाखवते; सूत्र आराखडा दाखवते, आणि अनुवंशिक आराखडाच असतो",
          },
          {
            en: "The formula is only a shorthand for saving space in books, and a drawing would do the same job if there were room for it",
            hi: "सूत्र केवल पुस्तकों में जगह बचाने का संक्षेप है, और यदि जगह हो तो चित्र भी वही काम कर देता",
            mr: "सूत्र हे केवळ पुस्तकांत जागा वाचवण्याचे संक्षिप्त रूप, आणि जागा असती तर चित्रही तेच काम केले असते",
          },
          {
            en: "The formula records the colour and scent of the flower in coded form, which is what makes it useful for identification",
            hi: "सूत्र पुष्प का रंग और गंध कूट रूप में दर्ज करता है, और यही उसे पहचान के लिए उपयोगी बनाता है",
            mr: "सूत्र फुलाचा रंग आणि गंध सांकेतिक रूपात नोंदवते, आणि हेच त्याला ओळखीसाठी उपयुक्त बनवते",
          },
          {
            en: "The formula is used because families are defined by the number of petals alone, and the formula puts that number first",
            hi: "सूत्र इसलिए बरता जाता है कि कुल केवल दलों की संख्या से परिभाषित होते हैं, और सूत्र वह संख्या पहले रखता है",
            mr: "सूत्र यासाठी वापरले जाते की कुले केवळ पाकळ्यांच्या संख्येने परिभाषित होतात, आणि सूत्र ती संख्या आधी ठेवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student's objection assumes that more information is always better, and the answer is that a formula is useful because of what it leaves out. Start with what it puts in. A floral formula states the symmetry of the flower and whether it is bisexual; then, whorl by whorl, the number of sepals, petals, stamens and carpels; whether the members of a whorl are free or fused, shown by bracketing them; whether one whorl is attached to another; and whether the ovary is superior or inferior, shown by a line above or below the gynoecium symbol. Every one of these is a fact about the architecture of the flower, and every one is fixed early in the flower's development by the same genes across the whole family. Now what it omits, which is the more interesting half. It says nothing about colour, size, scent, nectar, the shape of the petals or the time of opening. These are the features a person notices first and they are exactly the features that vary most, because they are the ones under selection by pollinators. Within a single family the same architecture appears in a scarlet flower pollinated by sunbirds, a white one pollinated by night moths and a dull green one pollinated by wind. Colour tracks the pollinator, not the ancestry, so recording it would be recording noise. Take a worked case. The mustard family is written with four sepals, four petals, six stamens of which four are long and two short, and a superior ovary of two fused carpels — and that description fits mustard, radish, cabbage, cauliflower and the roadside weed next to them, plants that differ enormously in size, colour and what part of them we eat. Meanwhile the pea family has an entirely different signature: a bilaterally symmetric corolla of five unequal petals, ten stamens with nine fused and one free, and a single carpel with a superior ovary. Once a student can read those two signatures, several hundred species have been sorted without recourse to a picture of any of them. There is a further point that answers the question directly. A drawing shows one flower at one moment, and to compare two drawings you must decide for yourself what in them is significant. A formula has already made that decision, and made it the same way for every plant, so two formulae can be compared line by line and even sorted by machine. That is why floras and identification keys are built on these characters and not on photographs. Two cautions belong with it. The formula is a summary, not a substitute for looking: it will not tell you about a modified petal that forms a landing platform, or hairs that guide an insect, and a botanist writes descriptive notes alongside it. And the constancy is a strong tendency rather than a law — exceptions exist, families are occasionally redrawn when molecular evidence disagrees with floral architecture, and the formula is evidence rather than proof. But as a way of recording what is stable and discarding what is decorative, it is exactly the tool the job needs. (The second answer treats the formula as a mere abbreviation and misses that omission is the point; the third states the opposite of what a formula contains; and the fourth reduces the whole scheme to one number, when petal number alone is shared by hundreds of unrelated families.)",
          hi: "विद्यार्थी की आपत्ति यह मान लेती है कि अधिक सूचना सदा बेहतर है, और उत्तर यह है कि सूत्र इसलिए उपयोगी है कि वह क्या छोड़ देता है। पहले देखो वह डालता क्या है। पुष्प-सूत्र पुष्प की सममिति बताता है और यह कि वह द्विलिंगी है या नहीं; फिर चक्र-दर-चक्र बाह्यदलों, दलों, पुंकेसरों और अंडपों की संख्या; किसी चक्र के सदस्य मुक्त हैं या संयुक्त, कोष्ठक में दिखाकर; एक चक्र दूसरे से जुड़ा है या नहीं; और अंडाशय उपरिवर्ती है या अधोवर्ती, जायांग के चिह्न के ऊपर या नीचे रेखा से दिखाकर। इनमें से हर एक पुष्प की वास्तुकला का तथ्य है, और हर एक पूरे कुल में उन्हीं जीनों से पुष्प के परिवर्धन में जल्दी तय हो जाता है। अब वह जो वह छोड़ देता है, और यही अधिक रोचक आधा है। वह रंग, आकार, गंध, मकरंद, दलों की आकृति या खिलने के समय के बारे में कुछ नहीं कहता। ये वही लक्षण हैं जो व्यक्ति पहले देखता है और ठीक वही हैं जो सबसे अधिक बदलते हैं, क्योंकि परागणकर्ताओं के वरण में वही हैं। एक ही कुल के भीतर वही वास्तुकला शकरखोरों से परागित लाल पुष्प में, रात के पतंगों से परागित सफ़ेद में और हवा से परागित फीके हरे में प्रकट होती है। रंग परागणकर्ता का अनुसरण करता है, पूर्वजता का नहीं, अतः उसे दर्ज करना शोर दर्ज करना होता। एक हल किया मामला लो। सरसों कुल चार बाह्यदल, चार दल, छह पुंकेसर जिनमें चार लंबे और दो छोटे, और दो संयुक्त अंडपों का उपरिवर्ती अंडाशय लिखा जाता है — और यह वर्णन सरसों, मूली, बंदगोभी, फूलगोभी और उनके बग़ल की सड़क-किनारे की खरपतवार पर बैठता है, ऐसे पौधे जो आकार, रंग और हम उनका कौन-सा भाग खाते हैं इसमें बहुत भिन्न हैं। दूसरी ओर मटर कुल की बिलकुल भिन्न पहचान है: पाँच असमान दलों का द्विपार्श्व सममित दलपुंज, दस पुंकेसर जिनमें नौ संयुक्त और एक मुक्त, और उपरिवर्ती अंडाशय वाला अकेला अंडप। विद्यार्थी उन दो पहचानों को पढ़ना सीख ले तो कई सौ जातियाँ बिना किसी का चित्र देखे छँट जाती हैं। एक और बात है जो प्रश्न का सीधा उत्तर देती है। चित्र एक क्षण का एक पुष्प दिखाता है, और दो चित्रों की तुलना करने को तुम्हें ख़ुद तय करना पड़ता है कि उनमें महत्त्वपूर्ण क्या है। सूत्र वह निर्णय पहले ही कर चुका है, और हर पादप के लिए उसी तरह किया है, अतः दो सूत्रों की पंक्ति-दर-पंक्ति तुलना हो सकती है और मशीन से छँटाई भी। इसीलिए वनस्पति-सूचियाँ और पहचान-कुंजियाँ इन्हीं लक्षणों पर बनी हैं, छायाचित्रों पर नहीं। दो चेतावनियाँ इसके साथ चलती हैं। सूत्र सारांश है, देखने का विकल्प नहीं: वह उस रूपांतरित दल के बारे में नहीं बताएगा जो उतरने का मंच बनाता है, या उन रोमों के बारे में जो कीट को राह दिखाते हैं, और वनस्पतिविद उसके साथ वर्णनात्मक टिप्पणियाँ लिखता है। और यह अचरता नियम नहीं, प्रबल प्रवृत्ति है — अपवाद हैं, आणविक प्रमाण पुष्प-वास्तुकला से असहमत हो तो कुल कभी-कभी नए सिरे से खींचे जाते हैं, और सूत्र प्रमाण है, सबूत नहीं। पर जो स्थिर है उसे दर्ज करने और जो सजावटी है उसे फेंकने के तरीक़े के रूप में वह ठीक वही औज़ार है जो काम को चाहिए। (दूसरा उत्तर सूत्र को महज़ संक्षेप मान लेता है और चूक जाता है कि छोड़ देना ही पूरी बात है; तीसरा सूत्र में जो होता है उसका उलटा कहता है; और चौथा पूरी योजना को एक संख्या पर घटा देता है, जबकि केवल दलों की संख्या सैकड़ों असंबंधित कुल साझा करते हैं।)",
          mr: "विद्यार्थ्याचा आक्षेप हे गृहीत धरतो की अधिक माहिती नेहमी चांगली, आणि उत्तर असे की सूत्र यासाठी उपयुक्त की ते काय वगळते. आधी ते काय घालते ते पाहा. पुष्पसूत्र फुलाची सममिती सांगते आणि ते द्विलिंगी आहे का; मग वलयागणिक निदले, पाकळ्या, पुंकेसर आणि किंजदले यांची संख्या; एखाद्या वलयाचे सदस्य मोकळे आहेत की जुळलेले, कंसात दाखवून; एक वलय दुसऱ्याला जोडलेले आहे का; आणि अंडाशय ऊर्ध्वस्थ आहे की अधःस्थ, जायांगाच्या चिन्हावर वा खाली रेषेने दाखवून. यांतले प्रत्येक फुलाच्या वास्तुशिल्पाचे तथ्य आहे, आणि प्रत्येक अख्ख्या कुलात त्याच जनुकांनी फुलाच्या विकासात लवकर ठरते. आता ते जे वगळते, आणि हाच अधिक रोचक अर्धा भाग. ते रंग, आकार, गंध, मध, पाकळ्यांचा आकार वा उमलण्याची वेळ यांबद्दल काहीही सांगत नाही. हीच ती लक्षणे जी माणूस आधी पाहतो आणि नेमकी तीच जी सर्वांत अधिक बदलतात, कारण परागवाहकांच्या निवडीखाली तीच आहेत. एकाच कुलात तेच वास्तुशिल्प शिंजिरांनी परागित लाल फुलात, रात्रीच्या पतंगांनी परागित पांढऱ्यात आणि वाऱ्याने परागित फिकट हिरव्यात उमटते. रंग परागवाहकाचे अनुसरण करतो, पूर्वजतेचे नव्हे, म्हणून तो नोंदवणे म्हणजे गोंगाट नोंदवणे. एक सोडवलेले प्रकरण घ्या. मोहरी कुल चार निदले, चार पाकळ्या, सहा पुंकेसर ज्यांतले चार लांब आणि दोन आखूड, आणि दोन जुळलेल्या किंजदलांचे ऊर्ध्वस्थ अंडाशय असे लिहिले जाते — आणि हे वर्णन मोहरी, मुळा, कोबी, फुलकोबी आणि त्यांच्या शेजारच्या रस्त्याकडेच्या तणावर बसते, अशा वनस्पती ज्या आकार, रंग आणि आपण त्यांचा कोणता भाग खातो यात प्रचंड वेगळ्या. दुसरीकडे वाटाणा कुलाची पूर्णपणे वेगळी ओळख: पाच असमान पाकळ्यांचे द्विपार्श्व सममित दलपुंज, दहा पुंकेसर ज्यांतले नऊ जुळलेले आणि एक मोकळा, आणि ऊर्ध्वस्थ अंडाशय असलेले एकच किंजदल. विद्यार्थ्याला त्या दोन ओळखी वाचता आल्या की कित्येकशे जाती कोणाचेही चित्र न पाहता वर्गीकृत होतात. आणखी एक मुद्दा आहे जो प्रश्नाचे थेट उत्तर देतो. चित्र एका क्षणाचे एक फूल दाखवते, आणि दोन चित्रांची तुलना करायला तुम्हाला स्वतः ठरवावे लागते की त्यांत महत्त्वाचे काय. सूत्राने तो निर्णय आधीच घेतला आहे, आणि प्रत्येक वनस्पतीसाठी त्याच पद्धतीने घेतला आहे, म्हणून दोन सूत्रांची ओळीओळीने तुलना होऊ शकते आणि यंत्राने वर्गवारीही. म्हणूनच वनस्पतिसूची आणि ओळख-किल्ल्या याच लक्षणांवर बांधल्या आहेत, छायाचित्रांवर नव्हे. दोन इशारे याच्यासोबत चालतात. सूत्र हा सारांश आहे, पाहण्याचा पर्याय नव्हे: ते उतरण्याचा मंच बनवणाऱ्या रूपांतरित पाकळीबद्दल सांगणार नाही, वा कीटकाला वाट दाखवणाऱ्या केसांबद्दल, आणि वनस्पतिशास्त्रज्ञ त्यासोबत वर्णनात्मक टिपा लिहितो. आणि ही अचलता नियम नव्हे, प्रबळ कल आहे — अपवाद आहेत, रेणवीय पुरावा पुष्प-वास्तुशिल्पाशी असहमत असल्यास कुले अधूनमधून नव्याने आखली जातात, आणि सूत्र हा पुरावा आहे, सिद्धता नव्हे. पण जे स्थिर आहे ते नोंदवण्याचा आणि जे सजावटी आहे ते फेकण्याचा मार्ग म्हणून ते नेमके तेच साधन आहे जे कामाला लागते. (दुसरे उत्तर सूत्राला केवळ संक्षेप मानते आणि वगळणे हाच मुद्दा आहे हे चुकवते; तिसरे सूत्रात काय असते त्याच्या उलट सांगते; आणि चौथे अख्खी योजना एका संख्येवर घटवते, तर केवळ पाकळ्यांची संख्या शेकडो असंबंधित कुले वाटून घेतात.)",
        },
      },
      /*H5B*/
    ],
  },

];

export const G11_BIOLOGY_NUMERIC: Record<string, NumQ[]> = {
  /**
   * Ploidy is the one place in these five chapters where the counting is real
   * rather than decorative: the number is fixed by meiosis and fertilisation,
   * and a pupil who cannot do this arithmetic cannot follow the life cycle.
   */
  "biology-11-plant-kingdom": [
    {
      level: 1,
      stem: {
        en: "A moss gametophyte has 12 chromosomes in each cell. How many does its sporophyte have?",
        hi: "किसी मॉस के युग्मकोद्भिद की हर कोशिका में 12 गुणसूत्र हैं। उसके बीजाणुद्भिद में कितने हैं?",
        mr: "एका शेवाळाच्या युग्मकोद्भिदाच्या प्रत्येक पेशीत 12 गुणसूत्रे आहेत. त्याच्या बीजाणुद्भिदात किती?",
      },
      answer: 24,
      wrong: [12, 6, 36],
      checkExpr: "12*2",
      solution: {
        en: "The gametophyte is haploid, so n = 12. Fertilisation fuses two gametes of 12 each, giving 2n = 24 in the sporophyte. The doubling happens once, at fertilisation, and is undone once, at meiosis — those two events are the only places in the whole cycle where the number changes. (12 forgets that two gametes fused.)",
        hi: "युग्मकोद्भिद अगुणित है, अतः n = 12. निषेचन 12-12 के दो युग्मक मिलाता है, जिससे बीजाणुद्भिद में 2n = 24. दुगुना होना एक बार होता है, निषेचन पर, और एक बार पलटता है, अर्धसूत्री विभाजन पर — पूरे चक्र में केवल वही दो घटनाएँ संख्या बदलती हैं। (12 भूल जाता है कि दो युग्मक मिले थे।)",
        mr: "युग्मकोद्भिद एकगुणित, म्हणून n = 12. फलन 12-12 चे दोन युग्मक जोडते, ज्यातून बीजाणुद्भिदात 2n = 24. दुप्पट होणे एकदाच घडते, फलनाला, आणि एकदाच उलटते, अर्धसूत्री विभाजनाला — अख्ख्या चक्रात केवळ त्याच दोन घटना संख्या बदलतात. (12 विसरते की दोन युग्मक जुळले होते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A fern sporophyte has 40 chromosomes in each cell. How many does a spore have?",
        hi: "किसी फ़र्न के बीजाणुद्भिद की हर कोशिका में 40 गुणसूत्र हैं। एक बीजाणु में कितने हैं?",
        mr: "एका नेच्याच्या बीजाणुद्भिदाच्या प्रत्येक पेशीत 40 गुणसूत्रे आहेत. एका बीजाणूत किती?",
      },
      answer: 20,
      wrong: [40, 80, 10],
      checkExpr: "40/2",
      solution: {
        en: "Spores are made by meiosis, so 40/2 = 20. Note what the spore is not: it is not a gamete and does not fuse with anything. It germinates on its own into the prothallus, which is why the fern's haploid generation is a plant rather than a single cell. (40 treats spore formation as mitosis.)",
        hi: "बीजाणु अर्धसूत्री विभाजन से बनते हैं, अतः 40/2 = 20. ध्यान दो कि बीजाणु है क्या नहीं: वह युग्मक नहीं है और किसी से संलयित नहीं होता। वह स्वयं अंकुरित होकर प्रोथैलस बनता है, इसीलिए फ़र्न की अगुणित पीढ़ी एक कोशिका नहीं, एक पादप है। (40 बीजाणु-निर्माण को समसूत्री विभाजन मान लेता है।)",
        mr: "बीजाणू अर्धसूत्री विभाजनाने बनतात, म्हणून 40/2 = 20. लक्षात घ्या की बीजाणू काय नाही: तो युग्मक नाही आणि कशाशीही संयोग पावत नाही. तो स्वतः अंकुरून प्रोथॅलस बनतो, म्हणूनच नेच्याची एकगुणित पिढी एक पेशी नव्हे, एक वनस्पती आहे. (40 बीजाणुनिर्मितीला समविभाजन मानते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "In a flowering plant the egg cell has 7 chromosomes. How many are in the endosperm?",
        hi: "किसी सपुष्पक पादप के अंड कोशिका में 7 गुणसूत्र हैं। भ्रूणपोष में कितने हैं?",
        mr: "एका सपुष्प वनस्पतीच्या अंडपेशीत 7 गुणसूत्रे आहेत. भ्रूणपोषात किती?",
      },
      answer: 21,
      wrong: [14, 7, 28],
      checkExpr: "7*3",
      solution: {
        en: "The egg is haploid at n = 7, and the endosperm is triploid because it comes from two polar nuclei and one male gamete: 7 × 3 = 21. The embryo in the same seed is 14, so one seed carries two tissues of different ploidy side by side. (14 quotes the embryo.)",
        hi: "अंड अगुणित है, n = 7, और भ्रूणपोष त्रिगुणित है क्योंकि वह दो ध्रुवीय केंद्रकों और एक नर युग्मक से आता है: 7 × 3 = 21. उसी बीज में भ्रूण 14 का है, अतः एक बीज भिन्न गुणिता के दो ऊतक साथ-साथ ढोता है। (14 भ्रूण बता देता है।)",
        mr: "अंडे एकगुणित, n = 7, आणि भ्रूणपोष त्रिगुणित कारण तो दोन ध्रुवीय केंद्रके आणि एक नर युग्मक यांतून येतो: 7 × 3 = 21. त्याच बीजातला गर्भ 14 चा आहे, म्हणून एक बीज वेगळ्या गुणितेच्या दोन ऊती शेजारी-शेजारी वाहते. (14 गर्भ सांगते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A gymnosperm ovule's female gametophyte has 11 chromosomes per cell. How many will the zygote have?",
        hi: "किसी जिम्नोस्पर्म के बीजांड के मादा युग्मकोद्भिद में प्रति कोशिका 11 गुणसूत्र हैं। युग्मनज में कितने होंगे?",
        mr: "एका जिम्नोस्पर्म बीजांडाच्या मादी युग्मकोद्भिदात प्रति पेशी 11 गुणसूत्रे आहेत. युग्मनजात किती असतील?",
      },
      answer: 22,
      wrong: [11, 33, 44],
      checkExpr: "11*2",
      solution: {
        en: "The female gametophyte is haploid, so the egg it makes is n = 11 and the zygote is 11 × 2 = 22. Note that the food-storing tissue in a pine stays at 11, because it is that same haploid gametophyte — not a triploid endosperm, which only flowering plants make. (33 applies the angiosperm rule to the wrong group.)",
        hi: "मादा युग्मकोद्भिद अगुणित है, अतः उसका बनाया अंड n = 11 है और युग्मनज 11 × 2 = 22. ध्यान दो कि चीड़ में भोजन-संचयी ऊतक 11 पर ही रहता है, क्योंकि वह वही अगुणित युग्मकोद्भिद है — त्रिगुणित भ्रूणपोष नहीं, जो केवल सपुष्पक पादप बनाते हैं। (33 एंजियोस्पर्म का नियम ग़लत समूह पर लगा देता है।)",
        mr: "मादी युग्मकोद्भिद एकगुणित, म्हणून तिने बनवलेले अंडे n = 11 आणि युग्मनज 11 × 2 = 22. लक्षात घ्या की पाइनमधली अन्नसाठवणारी ऊती 11 वरच राहते, कारण ती तोच एकगुणित युग्मकोद्भिद आहे — त्रिगुणित भ्रूणपोष नव्हे, जो केवळ सपुष्प वनस्पती बनवतात. (33 अँजिओस्पर्मचा नियम चुकीच्या गटावर लावते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A moss sporophyte has 30 chromosomes. How many will each spore it releases have?",
        hi: "किसी मॉस के बीजाणुद्भिद में 30 गुणसूत्र हैं। वह जो बीजाणु छोड़ेगा उनमें से हर एक में कितने होंगे?",
        mr: "एका शेवाळाच्या बीजाणुद्भिदात 30 गुणसूत्रे आहेत. तो जे बीजाणू सोडेल त्यांतल्या प्रत्येकात किती असतील?",
      },
      answer: 15,
      wrong: [30, 60, 45],
      checkExpr: "30/2",
      solution: {
        en: "Meiosis in the capsule halves the number: 30/2 = 15. That spore germinates into the green cushion, which is therefore also 15 — the whole visible moss plant is haploid, which is the reverse of what a pupil expects from a plant. (30 keeps the sporophyte number.)",
        hi: "संपुट में अर्धसूत्री विभाजन संख्या आधी कर देता है: 30/2 = 15. वह बीजाणु अंकुरित होकर हरा गद्दा बनता है, अतः वह भी 15 का है — पूरा दिखने वाला मॉस पादप अगुणित है, जो पादप से विद्यार्थी की अपेक्षा का उलटा है। (30 बीजाणुद्भिद की संख्या बनाए रखता है।)",
        mr: "बीजपेटीतले अर्धसूत्री विभाजन संख्या निम्मी करते: 30/2 = 15. तो बीजाणू अंकुरून हिरवी उशी बनतो, म्हणून तीही 15 ची — अख्खी दिसणारी शेवाळ वनस्पती एकगुणित आहे, जे वनस्पतीकडून विद्यार्थ्याच्या अपेक्षेच्या उलट आहे. (30 बीजाणुद्भिदाची संख्या टिकवते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A flowering plant has 18 chromosomes in its leaf cells. How many are in a pollen grain's nucleus?",
        hi: "किसी सपुष्पक पादप की पर्ण कोशिकाओं में 18 गुणसूत्र हैं। पराग-कण के केंद्रक में कितने हैं?",
        mr: "एका सपुष्प वनस्पतीच्या पानाच्या पेशींत 18 गुणसूत्रे आहेत. परागकणाच्या केंद्रकात किती?",
      },
      answer: 9,
      wrong: [18, 27, 36],
      checkExpr: "18/2",
      solution: {
        en: "Leaf cells are sporophyte tissue at 2n = 18, and pollen is the male gametophyte made by meiosis, so 18/2 = 9. Pollen is not a gamete but a gametophyte — it goes on to divide and produce the two male gametes that double fertilisation needs. (18 confuses the parent plant with the pollen.)",
        hi: "पर्ण कोशिकाएँ 2n = 18 पर बीजाणुद्भिद ऊतक हैं, और पराग अर्धसूत्री विभाजन से बना नर युग्मकोद्भिद है, अतः 18/2 = 9. पराग युग्मक नहीं, युग्मकोद्भिद है — वह आगे विभाजित होकर वे दो नर युग्मक बनाता है जो द्विनिषेचन को चाहिए। (18 जनक पादप और पराग को गड्डमड्ड कर देता है।)",
        mr: "पानाच्या पेशी 2n = 18 वर बीजाणुद्भिद ऊती आहेत, आणि पराग हा अर्धसूत्री विभाजनाने बनलेला नर युग्मकोद्भिद, म्हणून 18/2 = 9. पराग हा युग्मक नव्हे, युग्मकोद्भिद आहे — तो पुढे विभागून द्विफलनाला लागणारे दोन नर युग्मक बनवतो. (18 जनक वनस्पती आणि पराग गोंधळवते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "In a flowering plant the embryo of a seed has 24 chromosomes. How many are in the endosperm of the same seed?",
        hi: "किसी सपुष्पक पादप के बीज के भ्रूण में 24 गुणसूत्र हैं। उसी बीज के भ्रूणपोष में कितने हैं?",
        mr: "एका सपुष्प वनस्पतीच्या बीजाच्या गर्भात 24 गुणसूत्रे आहेत. त्याच बीजाच्या भ्रूणपोषात किती?",
      },
      answer: 36,
      wrong: [24, 48, 12],
      checkExpr: "24*3/2",
      solution: {
        en: "The embryo is 2n = 24, so n = 12 and the endosperm is 3n = 36. The route matters more than the answer: halve to get the gametic number, then triple it. Getting this wrong usually means treating the endosperm as though it doubled the embryo rather than tripling the gamete. (48 doubles the embryo instead.)",
        hi: "भ्रूण 2n = 24 है, अतः n = 12 और भ्रूणपोष 3n = 36. उत्तर से अधिक मार्ग मायने रखता है: युग्मकीय संख्या पाने को आधा करो, फिर तिगुना करो। इसे ग़लत करने का अर्थ प्रायः यह होता है कि भ्रूणपोष को युग्मक का तिगुना नहीं, भ्रूण का दुगुना मान लिया गया। (48 इसके बजाय भ्रूण को दुगुना कर देता है।)",
        mr: "गर्भ 2n = 24, म्हणून n = 12 आणि भ्रूणपोष 3n = 36. उत्तराहून मार्ग अधिक महत्त्वाचा: युग्मकीय संख्या मिळवायला निम्मे करा, मग तिप्पट करा. हे चुकणे म्हणजे बहुधा भ्रूणपोषाला युग्मकाच्या तिप्पट नव्हे, गर्भाच्या दुप्पट मानणे. (48 त्याऐवजी गर्भ दुप्पट करते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A fern prothallus has 16 chromosomes per cell. How many will a cell of the young fern plant growing from it have?",
        hi: "किसी फ़र्न के प्रोथैलस में प्रति कोशिका 16 गुणसूत्र हैं। उससे उगते नए फ़र्न पादप की एक कोशिका में कितने होंगे?",
        mr: "एका नेच्याच्या प्रोथॅलसमध्ये प्रति पेशी 16 गुणसूत्रे आहेत. त्यातून उगवणाऱ्या नव्या नेचा वनस्पतीच्या एका पेशीत किती असतील?",
      },
      answer: 32,
      wrong: [16, 8, 48],
      checkExpr: "16*2",
      solution: {
        en: "The prothallus is the gametophyte at n = 16. It makes gametes by mitosis, so they are also 16 — a point worth pausing on, because gametes are made by meiosis in animals and by mitosis in plants, and the reason is that the halving already happened when the spore was formed. Fertilisation then fuses two gametes of 16 to give 32, and that zygote grows into the leafy fern. So a single fern life cycle contains cells of 16 and cells of 32, in two plants that look nothing alike and are genetically the same lineage. (16 forgets the fertilisation step.)",
        hi: "प्रोथैलस n = 16 पर युग्मकोद्भिद है। वह समसूत्री विभाजन से युग्मक बनाता है, अतः वे भी 16 के हैं — यह ठहरने योग्य बात है, क्योंकि प्राणियों में युग्मक अर्धसूत्री विभाजन से बनते हैं और पादपों में समसूत्री से, और कारण यह कि आधा करना बीजाणु बनते समय ही हो चुका था। फिर निषेचन 16-16 के दो युग्मक मिलाकर 32 देता है, और वह युग्मनज बढ़कर पत्तेदार फ़र्न बनता है। अतः एक ही फ़र्न जीवन-चक्र में 16 वाली और 32 वाली कोशिकाएँ हैं, दो ऐसे पादपों में जो बिलकुल एक जैसे नहीं दिखते और आनुवंशिक रूप से वही वंशक्रम हैं। (16 निषेचन का क़दम भूल जाता है।)",
        mr: "प्रोथॅलस हा n = 16 वर युग्मकोद्भिद. तो समविभाजनाने युग्मक बनवतो, म्हणून तेही 16 चे — इथे थांबण्याजोगे, कारण प्राण्यांत युग्मक अर्धसूत्री विभाजनाने बनतात आणि वनस्पतींत समविभाजनाने, आणि कारण असे की निम्मे करणे बीजाणू बनतानाच घडून गेले होते. मग फलन 16-16 चे दोन युग्मक जोडून 32 देते, आणि तो युग्मनज वाढून पानांचा नेचा बनतो. म्हणून एकाच नेचा जीवनचक्रात 16 च्या आणि 32 च्या पेशी आहेत, अजिबात सारख्या न दिसणाऱ्या दोन वनस्पतींत ज्या अनुवंशिकदृष्ट्या तीच वंशावळ आहेत. (16 फलनाचे पाऊल विसरते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A seed's endosperm has 45 chromosomes per cell. How many are in a leaf cell of the plant that grows from that seed?",
        hi: "किसी बीज के भ्रूणपोष में प्रति कोशिका 45 गुणसूत्र हैं। उस बीज से उगने वाले पादप की एक पर्ण कोशिका में कितने हैं?",
        mr: "एका बीजाच्या भ्रूणपोषात प्रति पेशी 45 गुणसूत्रे आहेत. त्या बीजापासून उगवणाऱ्या वनस्पतीच्या एका पानाच्या पेशीत किती?",
      },
      answer: 30,
      wrong: [45, 15, 90],
      checkExpr: "45*2/3",
      solution: {
        en: "Work backwards through the fusions. The endosperm is 3n, so 45/3 = 15 is the gametic number n. The leaf belongs to the sporophyte, which grew from the zygote, so it is 2n = 30. Two things in this question are worth more than the arithmetic. The first is that a single seed is not genetically uniform. Its endosperm is 45, its embryo is 30, and its seed coat is 30 but belongs to the mother plant rather than to the offspring — three tissues of two different ploidies and two different generations, packed inside one object a pupil is used to treating as a single thing. The second is the direction of the reasoning. Nearly every ploidy question in this chapter is solved the same way: find n first, whatever you are given, and then read off whatever is asked. Given the endosperm, divide by three. Given the sporophyte, divide by two. Given a gamete or a spore or a gametophyte cell, you already have it. Once n is known, the embryo is 2n, the endosperm 3n, the pollen n and the leaf 2n, and no separate rule has to be memorised for each. It is also worth noticing what the numbers rule out. If a tissue were reported as 45 in a gymnosperm the figure would be wrong, because there is no triploid tissue in a pine — its food store is the haploid female gametophyte at 15. Ploidy is therefore a diagnostic as well as a count: told that a seed contains 3n tissue, you already know it came from a flowering plant. (45 keeps the endosperm figure for the whole plant; 15 stops at the gametic number; and 90 doubles the endosperm instead of working back to n.)",
        hi: "संलयनों से उलटा चलो। भ्रूणपोष 3n है, अतः 45/3 = 15 युग्मकीय संख्या n है। पत्ती बीजाणुद्भिद की है, जो युग्मनज से बढ़ा, अतः वह 2n = 30 है। इस प्रश्न की दो बातें गणित से अधिक मूल्यवान हैं। पहली यह कि एक अकेला बीज आनुवंशिक रूप से एकसमान नहीं है। उसका भ्रूणपोष 45 है, उसका भ्रूण 30, और उसका बीजावरण 30 पर संतान का नहीं, माता पादप का है — दो भिन्न गुणिताओं और दो भिन्न पीढ़ियों के तीन ऊतक, एक ही वस्तु के भीतर भरे जिसे विद्यार्थी एक चीज़ मानने का आदी है। दूसरी है तर्क की दिशा। इस अध्याय का लगभग हर गुणिता-प्रश्न उसी तरह हल होता है: जो भी दिया हो उससे पहले n निकालो, फिर जो पूछा हो पढ़ लो। भ्रूणपोष दिया हो तो तीन से भाग दो। बीजाणुद्भिद दिया हो तो दो से। युग्मक या बीजाणु या युग्मकोद्भिद कोशिका दी हो तो वह तुम्हारे पास पहले से है। n ज्ञात होते ही भ्रूण 2n है, भ्रूणपोष 3n, पराग n और पत्ती 2n, और हर एक के लिए अलग नियम रटने की ज़रूरत नहीं। यह भी ध्यान देने योग्य है कि संख्याएँ किसे ख़ारिज कर देती हैं। यदि किसी जिम्नोस्पर्म में कोई ऊतक 45 बताया जाए तो आँकड़ा ग़लत होगा, क्योंकि चीड़ में कोई त्रिगुणित ऊतक होता ही नहीं — उसका भोजन-भंडार 15 पर अगुणित मादा युग्मकोद्भिद है। अतः गुणिता गिनती ही नहीं, निदान भी है: यह बताते ही कि किसी बीज में 3n ऊतक है, तुम पहले से जानते हो कि वह सपुष्पक पादप से आया। (45 पूरे पादप के लिए भ्रूणपोष का आँकड़ा बनाए रखता है; 15 युग्मकीय संख्या पर रुक जाता है; और 90 n तक लौटने के बजाय भ्रूणपोष को दुगुना कर देता है।)",
        mr: "संयोगांतून उलट चला. भ्रूणपोष 3n, म्हणून 45/3 = 15 ही युग्मकीय संख्या n. पान बीजाणुद्भिदाचे, जो युग्मनजापासून वाढला, म्हणून ते 2n = 30. या प्रश्नातल्या दोन गोष्टी गणिताहून अधिक मोलाच्या. पहिली अशी की एकटे बीज अनुवंशिकदृष्ट्या एकसमान नाही. त्याचा भ्रूणपोष 45, त्याचा गर्भ 30, आणि त्याचे बीजावरण 30 पण संततीचे नव्हे, मातृ वनस्पतीचे — दोन वेगळ्या गुणितांच्या आणि दोन वेगळ्या पिढ्यांच्या तीन ऊती, एकाच वस्तूत भरलेल्या जिला विद्यार्थी एक गोष्ट मानायची सवय ठेवतो. दुसरी म्हणजे युक्तिवादाची दिशा. या प्रकरणातला जवळपास प्रत्येक गुणिता-प्रश्न त्याच पद्धतीने सुटतो: जे दिले असेल त्यावरून आधी n काढा, मग जे विचारले ते वाचा. भ्रूणपोष दिला असेल तर तीनने भागा. बीजाणुद्भिद दिला असेल तर दोनने. युग्मक वा बीजाणू वा युग्मकोद्भिद पेशी दिली असेल तर तो तुमच्याकडे आधीच आहे. n कळताच गर्भ 2n, भ्रूणपोष 3n, पराग n आणि पान 2n, आणि प्रत्येकासाठी वेगळा नियम पाठ करण्याची गरज नाही. हेही लक्षात घेण्याजोगे की संख्या कशाला बाद करतात. एखाद्या जिम्नोस्पर्ममध्ये कोणतीही ऊती 45 सांगितली गेली तर आकडा चुकीचा असेल, कारण पाइनमध्ये त्रिगुणित ऊती असतच नाही — त्याचा अन्नसाठा 15 वर एकगुणित मादी युग्मकोद्भिद आहे. म्हणून गुणिता ही केवळ मोजणी नव्हे, निदानही आहे: एखाद्या बीजात 3n ऊती आहे असे सांगताच तुम्हाला आधीच माहीत की ते सपुष्प वनस्पतीकडून आले. (45 अख्ख्या वनस्पतीसाठी भ्रूणपोषाचा आकडा टिकवते; 15 युग्मकीय संख्येवर थांबते; आणि 90 n पर्यंत परतण्याऐवजी भ्रूणपोष दुप्पट करते.)",
      },
    },
  ],
  /*NB*/
};
