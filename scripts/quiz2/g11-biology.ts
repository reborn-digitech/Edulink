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

  /* ----------------------------------------------------------------------- */
  /* Chapter 6 — Anatomy of Flowering Plants                                 */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-11-anatomy-of-flowering-plants",
    subject: "BIOLOGY",
    classLevel: 11,
    chapter: {
      en: "Chapter 6 — Anatomy of Flowering Plants",
      hi: "अध्याय 6 — पुष्पी पादपों की शारीरिकी",
      mr: "प्रकरण 6 — सपुष्प वनस्पतींची शारीरिकी",
    },
    name: {
      en: "Anatomy of Flowering Plants",
      hi: "पुष्पी पादपों की शारीरिकी",
      mr: "सपुष्प वनस्पतींची शारीरिकी",
    },
    summary: {
      en: "A plant is built by cells that stop dividing almost as soon as they are made, so everything about its inside follows from where the few still-dividing cells sit: growth in length only at the tips, growth in girth only from a ring inside the bark, a nail hammered into a trunk that stays at the same height for forty years, and a hole in the leaf the plant can shut when the water runs short.",
      hi: "पादप ऐसी कोशिकाओं से बना है जो बनते ही लगभग तुरंत विभाजन बंद कर देती हैं, अतः उसके भीतर की हर बात इससे निकलती है कि अब भी विभाजित होती थोड़ी-सी कोशिकाएँ कहाँ बैठी हैं: लंबाई में वृद्धि केवल सिरों पर, मोटाई में वृद्धि केवल छाल के भीतर के वलय से, तने में ठोकी कील जो चालीस वर्ष उसी ऊँचाई पर रहती है, और पत्ती में वह छिद्र जिसे पानी घटने पर पादप बंद कर सकता है।",
      mr: "वनस्पती अशा पेशींनी बांधलेली आहे ज्या बनताच जवळपास लगेच विभाजन थांबवतात, म्हणून तिच्या आतल्या प्रत्येक गोष्टीचा उगम इथे: अजूनही विभाजित होणाऱ्या थोड्या पेशी कुठे बसल्या आहेत — लांबीत वाढ केवळ टोकांवर, जाडीत वाढ केवळ सालीच्या आतल्या वलयातून, खोडात ठोकलेला खिळा जो चाळीस वर्षे त्याच उंचीवर राहतो, आणि पानातले ते छिद्र जे पाणी कमी पडताच वनस्पती बंद करू शकते.",
    },
    position: 6,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "the-only-cells-still-allowed-to-divide",
        name: {
          en: "The only cells still allowed to divide",
          hi: "वे इकलौती कोशिकाएँ जिन्हें अब भी विभाजन की छूट है",
          mr: "अजूनही विभाजनाची मुभा असलेल्या त्या एकमेव पेशी",
        },
        kind: "structure",
        prompt: {
          en: "Almost every cell in a plant has stopped dividing for good; growth happens only where a small reservoir of cells has never stopped, and everything else was once one of them. What are these?",
          hi: "पादप की लगभग हर कोशिका सदा के लिए विभाजन बंद कर चुकी है; वृद्धि केवल वहीं होती है जहाँ कोशिकाओं का छोटा भंडार कभी रुका ही नहीं, और बाक़ी सब कभी उन्हीं में से एक था। ये क्या हैं?",
          mr: "वनस्पतीची जवळपास प्रत्येक पेशी कायमची विभाजन थांबवून बसली आहे; वाढ केवळ तिथेच होते जिथे पेशींचा एक लहान साठा कधी थांबलाच नाही, आणि बाकी सर्व कधीतरी त्यांतलेच एक होते. ही काय आहेत?",
        },
        statement: {
          en: "Meristems are the plant's dividing tissue: their cells are thin-walled, have dense cytoplasm and no large vacuole, and every permanent tissue in the plant was made by one of them and then stopped.",
          hi: "विभज्योतक पादप का विभाजनशील ऊतक है: उसकी कोशिकाओं की भित्तियाँ पतली, कोशिकाद्रव्य सघन और कोई बड़ी रिक्तिका नहीं, और पादप का हर स्थायी ऊतक उन्हीं में से किसी ने बनाया और फिर रुक गया।",
          mr: "विभाजी ऊती ही वनस्पतीची विभाजनशील ऊती: तिच्या पेशींच्या भित्तिका पातळ, पेशीद्रव्य दाट आणि मोठी रिक्तिका नाही, आणि वनस्पतीची प्रत्येक स्थायी ऊती त्यांतल्याच कोणीतरी बनवली आणि मग थांबली.",
        },
        detail: {
          en: "Where a meristem sits decides what kind of growth is possible: apical ones at root and shoot tips add length, lateral ones in a cylinder add girth.",
          hi: "विभज्योतक कहाँ बैठा है यह तय करता है कि कैसी वृद्धि संभव है: जड़ और प्ररोह के सिरों पर शीर्षस्थ लंबाई जोड़ते हैं, बेलन में लगे पार्श्व मोटाई।",
          mr: "विभाजी ऊती कुठे बसली आहे हे ठरवते की कोणती वाढ शक्य: मुळाच्या आणि प्ररोहाच्या टोकांवरची अग्रस्थ लांबी जोडते, दंडगोलातली पार्श्व जाडी.",
        },
        extra: {
          en: "This is why a plant cannot heal a wound the way an animal does — the cells around a cut are permanent, and only a meristem or a wound cambium can produce new ones.",
          hi: "इसीलिए पादप घाव को वैसे नहीं भर सकता जैसे प्राणी भरता है — कटान के आसपास की कोशिकाएँ स्थायी हैं, और नई केवल विभज्योतक या क्षत-एधा ही बना सकती है।",
          mr: "म्हणूनच वनस्पती जखम प्राण्यासारखी भरून काढू शकत नाही — कापाभोवतीच्या पेशी स्थायी आहेत, आणि नव्या केवळ विभाजी ऊती वा क्षत-एधाच बनवू शकते.",
        },
        pair: {
          left: {
            en: "A plant cannot heal the way an animal does",
            hi: "पादप वैसे नहीं भर सकता जैसे प्राणी भरता है",
            mr: "वनस्पती प्राण्यासारखी भरून येऊ शकत नाही",
          },
          right: {
            en: "the only cells still allowed to divide",
            hi: "वे इकलौती कोशिकाएँ जिन्हें अब भी विभाजन की छूट है",
            mr: "अजूनही विभाजनाची मुभा असलेल्या त्या एकमेव पेशी",
          },
        },
      },
      {
        id: "three-systems-in-every-organ",
        name: {
          en: "Three systems, and every organ has all three",
          hi: "तीन तंत्र, और हर अंग में तीनों",
          mr: "तीन संस्था, आणि प्रत्येक अवयवात तिन्ही",
        },
        kind: "structure",
        prompt: {
          en: "Cut a root, a stem or a leaf across and the same three layers appear in the same order: a skin outside, a filling in the middle, and pipes running through it. Which arrangement is this?",
          hi: "जड़, तना या पत्ती को आर-पार काटो और वही तीन परतें उसी क्रम में दिखती हैं: बाहर एक त्वचा, बीच में भराव, और उसमें से गुज़रती नलिकाएँ। यह कौन-सी व्यवस्था है?",
          mr: "मूळ, खोड वा पान आडवे कापा आणि तेच तीन थर त्याच क्रमाने दिसतात: बाहेर एक त्वचा, मध्यभागी भरण, आणि त्यातून जाणाऱ्या नळ्या. ही कोणती मांडणी?",
        },
        statement: {
          en: "Every plant organ is built from three tissue systems — the epidermal covering it, the ground tissue filling it, and the vascular tissue running through it — so the organs differ in how the three are arranged, not in which ones are present.",
          hi: "हर पादप-अंग तीन ऊतक-तंत्रों से बना है — उसे ढकता बाह्यत्वचीय, उसे भरता भरण, और उसमें से गुज़रता संवहन — अतः अंग इस बात में भिन्न हैं कि तीनों सजे कैसे हैं, न कि कौन-से मौजूद हैं।",
          mr: "प्रत्येक वनस्पती-अवयव तीन ऊती-संस्थांनी बांधलेला — त्याला झाकणारी अपित्वचीय, त्याला भरणारी भरण, आणि त्यातून जाणारी वहन — म्हणून अवयव तिन्ही कशा मांडल्या आहेत यात वेगळे, कोणत्या उपस्थित आहेत यात नाही.",
        },
        detail: {
          en: "The epidermis is one cell thick and covered in a waxy cuticle, which is why a leaf loses far less water than its surface area suggests.",
          hi: "बाह्यत्वचा एक कोशिका मोटी है और मोमी उपत्वचा से ढकी, इसीलिए पत्ती अपने सतह-क्षेत्र से लगाए अनुमान से कहीं कम पानी खोती है।",
          mr: "अपित्वचा एक पेशी जाड आणि मेणचट उपत्वचेने झाकलेली, म्हणूनच पान त्याच्या पृष्ठभागावरून वाटेल त्याहून कितीतरी कमी पाणी गमावते.",
        },
        extra: {
          en: "Naming the systems rather than the organs is what lets one description cover a cactus, a water lily and an oak — the same three, differently proportioned.",
          hi: "अंगों के बजाय तंत्रों के नाम लेना ही एक वर्णन को कैक्टस, कुमुदिनी और बलूत पर लागू करने देता है — वही तीन, भिन्न अनुपात में।",
          mr: "अवयवांऐवजी संस्थांची नावे घेणेच एका वर्णनाला निवडुंग, कमळ आणि ओकवर लागू करू देते — त्याच तीन, वेगळ्या प्रमाणात.",
        },
        pair: {
          left: {
            en: "A cactus and a water lily, one description",
            hi: "कैक्टस और कुमुदिनी, एक ही वर्णन",
            mr: "निवडुंग आणि कमळ, एकच वर्णन",
          },
          right: {
            en: "three systems, and every organ has all three",
            hi: "तीन तंत्र, और हर अंग में तीनों",
            mr: "तीन संस्था, आणि प्रत्येक अवयवात तिन्ही",
          },
        },
      },
      {
        id: "the-bundle-that-gives-the-plant-away",
        name: {
          en: "The bundle that gives the plant away",
          hi: "वह पूल जो पादप का भेद खोल देता है",
          mr: "वनस्पतीचे रहस्य उघडणारा तो गुच्छ",
        },
        kind: "contrast",
        prompt: {
          en: "One thin section under a microscope settles it: bundles in a neat ring with a layer of dividing cells inside each, or bundles scattered through the filling with no such layer at all. Which distinction is this?",
          hi: "सूक्ष्मदर्शी के नीचे एक पतली काट मामला निपटा देती है: सुथरे वलय में पूल जिनमें से हर एक के भीतर विभाजनशील कोशिकाओं की परत, या भराव में बिखरे पूल जिनमें ऐसी कोई परत ही नहीं। यह कौन-सा भेद है?",
          mr: "सूक्ष्मदर्शकाखालचा एक पातळ छेद प्रकरण निकाली काढतो: नीटनेटक्या वलयातले गुच्छ ज्यांतल्या प्रत्येकाच्या आत विभाजनशील पेशींचा थर, वा भरणात विखुरलेले गुच्छ ज्यांत असा थरच नाही. हा कोणता भेद?",
        },
        statement: {
          en: "A dicot stem has open vascular bundles — cambium between xylem and phloem — arranged in a ring, while a monocot stem has closed bundles with no cambium, scattered through the ground tissue.",
          hi: "द्विबीजपत्री तने में खुले संवहन पूल होते हैं — दारु और पोषवाह के बीच एधा — जो वलय में सजे रहते हैं, जबकि एकबीजपत्री तने में बंद पूल होते हैं जिनमें एधा नहीं, और वे भरण ऊतक में बिखरे रहते हैं।",
          mr: "द्विदल खोडात उघडे वहनगुच्छ असतात — जलवाहिनी आणि रसवाहिनी यांच्यामध्ये एधा — जे वलयात मांडलेले, तर एकदल खोडात बंद गुच्छ ज्यांत एधा नाही, आणि ते भरण ऊतीत विखुरलेले.",
        },
        detail: {
          en: "The word open is doing the real work: an open bundle can go on making new xylem and phloem, and a closed one is finished the day it forms.",
          hi: "असली काम \"खुला\" शब्द कर रहा है: खुला पूल नया दारु और पोषवाह बनाता रह सकता है, और बंद पूल जिस दिन बना उसी दिन पूरा हो गया।",
          mr: "खरे काम \"उघडा\" हा शब्द करत आहे: उघडा गुच्छ नवी जलवाहिनी आणि रसवाहिनी बनवत राहू शकतो, आणि बंद गुच्छ ज्या दिवशी बनला त्याच दिवशी संपला.",
        },
        extra: {
          en: "That one word explains why a mango tree thickens for a century and a bamboo, however tall, never does.",
          hi: "वही एक शब्द समझाता है कि आम का पेड़ सदी भर मोटा होता जाता है और बाँस, कितना भी ऊँचा हो, कभी नहीं।",
          mr: "तोच एक शब्द समजावतो की आंब्याचे झाड शतकभर जाड होत जाते आणि बांबू, कितीही उंच असो, कधीच होत नाही.",
        },
        pair: {
          left: {
            en: "Bamboo grows tall and never thickens",
            hi: "बाँस ऊँचा बढ़ता है और कभी मोटा नहीं होता",
            mr: "बांबू उंच वाढतो आणि कधीच जाड होत नाही",
          },
          right: {
            en: "the bundle that gives the plant away",
            hi: "वह पूल जो पादप का भेद खोल देता है",
            mr: "वनस्पतीचे रहस्य उघडणारा तो गुच्छ",
          },
        },
      },
      {
        id: "how-a-stem-gets-thicker",
        name: {
          en: "How a stem thickens after it has stopped lengthening",
          hi: "लंबा होना रुक जाने के बाद तना मोटा कैसे होता है",
          mr: "लांब होणे थांबल्यावर खोड जाड कसे होते",
        },
        kind: "process",
        prompt: {
          en: "The wood of a trunk was never laid down by the tip that made that height; it was added, year after year, by a cylinder of dividing cells just inside the bark. Which growth is this?",
          hi: "तने की लकड़ी उस सिरे ने कभी नहीं बिछाई जिसने वह ऊँचाई बनाई थी; वह वर्ष-दर-वर्ष छाल के ठीक भीतर विभाजनशील कोशिकाओं के बेलन ने जोड़ी। यह कौन-सी वृद्धि है?",
          mr: "खोडाचे लाकूड ती उंची बनवणाऱ्या टोकाने कधीच घातले नाही; ते वर्षानुवर्षे सालीच्या अगदी आतल्या विभाजनशील पेशींच्या दंडगोलाने जोडले. ही कोणती वाढ?",
        },
        statement: {
          en: "Secondary growth is the increase in girth produced by two lateral meristems: the vascular cambium, which makes secondary xylem inwards and secondary phloem outwards, and the cork cambium, which makes the bark.",
          hi: "द्वितीयक वृद्धि दो पार्श्व विभज्योतकों से बनी मोटाई की बढ़ोतरी है: संवहन एधा, जो भीतर की ओर द्वितीयक दारु और बाहर की ओर द्वितीयक पोषवाह बनाती है, और कॉर्क एधा, जो छाल बनाती है।",
          mr: "द्वितीयक वाढ ही दोन पार्श्व विभाजी ऊतींनी बनवलेली जाडीची वाढ: वहन एधा, जी आतल्या बाजूला द्वितीयक जलवाहिनी आणि बाहेरच्या बाजूला द्वितीयक रसवाहिनी बनवते, आणि बूच एधा, जी साल बनवते.",
        },
        detail: {
          en: "Far more xylem is made than phloem, which is why a trunk is almost entirely wood and the bark stays a thin skin however old the tree gets.",
          hi: "पोषवाह से कहीं अधिक दारु बनता है, इसीलिए तना लगभग पूरा लकड़ी है और छाल पेड़ कितना भी पुराना हो, पतली त्वचा ही रहती है।",
          mr: "रसवाहिनीहून कितीतरी अधिक जलवाहिनी बनते, म्हणूनच खोड जवळपास पूर्ण लाकूड आणि साल झाड कितीही जुने झाले तरी पातळ त्वचाच राहते.",
        },
        extra: {
          en: "Since nothing is added between the tip and the ground, a nail hammered into a trunk at chest height is still at chest height forty years later — the tree grew around it and above it, never under it.",
          hi: "चूँकि सिरे और ज़मीन के बीच कुछ जुड़ता ही नहीं, छाती की ऊँचाई पर तने में ठोकी कील चालीस वर्ष बाद भी छाती की ऊँचाई पर है — पेड़ उसके चारों ओर और उसके ऊपर बढ़ा, उसके नीचे कभी नहीं।",
          mr: "टोक आणि जमीन यांच्यात काहीच जोडले जात नसल्याने, छातीच्या उंचीवर खोडात ठोकलेला खिळा चाळीस वर्षांनंतरही छातीच्याच उंचीवर आहे — झाड त्याच्याभोवती आणि त्याच्यावर वाढले, त्याच्याखाली कधीच नाही.",
        },
        pair: {
          left: {
            en: "The nail stays at chest height for forty years",
            hi: "कील चालीस वर्ष छाती की ऊँचाई पर रहती है",
            mr: "खिळा चाळीस वर्षे छातीच्या उंचीवर राहतो",
          },
          right: {
            en: "how a stem thickens after it has stopped lengthening",
            hi: "लंबा होना रुक जाने के बाद तना मोटा कैसे होता है",
            mr: "लांब होणे थांबल्यावर खोड जाड कसे होते",
          },
        },
      },
      {
        id: "a-year-written-in-wood",
        name: {
          en: "A year written into the wood",
          hi: "लकड़ी में लिखा गया एक वर्ष",
          mr: "लाकडात लिहिले गेलेले एक वर्ष",
        },
        kind: "evidence",
        prompt: {
          en: "The cambium works fast in spring and slowly before winter, so it lays wide pale cells and then narrow dark ones, and the boundary between them is a date anybody can count. What is this?",
          hi: "एधा वसंत में तेज़ और सर्दी से पहले धीमे काम करती है, अतः वह पहले चौड़ी हल्की कोशिकाएँ बिछाती है फिर सँकरी गहरी, और उनके बीच की सीमा एक तिथि है जिसे कोई भी गिन सकता है। यह क्या है?",
          mr: "एधा वसंतात वेगाने आणि हिवाळ्याआधी सावकाश काम करते, म्हणून ती आधी रुंद फिकट पेशी घालते मग अरुंद गडद, आणि त्यांच्यामधली सीमा ही कोणीही मोजू शकेल अशी तारीख आहे. हे काय?",
        },
        statement: {
          en: "An annual ring is one year's spring wood and autumn wood together, so counting the rings in a cross-section gives the age of the trunk at that height.",
          hi: "वार्षिक वलय एक वर्ष की वसंत-काष्ठ और शरद-काष्ठ मिलकर है, अतः अनुप्रस्थ काट में वलय गिनने से उस ऊँचाई पर तने की आयु मिल जाती है।",
          mr: "वार्षिक वलय म्हणजे एका वर्षाचे वसंत-काष्ठ आणि शरद-काष्ठ मिळून, म्हणून आडव्या छेदातली वलये मोजल्याने त्या उंचीवरच्या खोडाचे वय मिळते.",
        },
        detail: {
          en: "The width of each ring records that year's weather, so a drought is a thin ring and a good monsoon a wide one — a climate record the tree kept without being asked.",
          hi: "हर वलय की चौड़ाई उस वर्ष का मौसम दर्ज करती है, अतः सूखा पतला वलय है और अच्छा मानसून चौड़ा — जलवायु का अभिलेख जो पेड़ ने बिना कहे रखा।",
          mr: "प्रत्येक वलयाची रुंदी त्या वर्षाचे हवामान नोंदवते, म्हणून दुष्काळ म्हणजे पातळ वलय आणि चांगला पाऊस रुंद — झाडाने न सांगता ठेवलेली हवामानाची नोंद.",
        },
        extra: {
          en: "The rings need a seasonal contrast to exist at all, so a tree in an equatorial rainforest with no dry season may lay down no countable rings whatever its age.",
          hi: "वलयों के होने के लिए मौसमी अंतर चाहिए, अतः बिना शुष्क ऋतु वाले भूमध्यरेखीय वर्षावन का पेड़ आयु चाहे जो हो, गिनने योग्य वलय बनाए ही नहीं।",
          mr: "वलये असण्यासाठी हंगामी फरक लागतो, म्हणून कोरडा ऋतू नसलेल्या विषुववृत्तीय पर्जन्यवनातले झाड वय काहीही असो, मोजण्याजोगी वलये घालतच नाही.",
        },
        pair: {
          left: {
            en: "No dry season, no countable rings",
            hi: "शुष्क ऋतु नहीं, गिनने योग्य वलय नहीं",
            mr: "कोरडा ऋतू नाही, मोजण्याजोगी वलये नाहीत",
          },
          right: {
            en: "a year written into the wood",
            hi: "लकड़ी में लिखा गया एक वर्ष",
            mr: "लाकडात लिहिले गेलेले एक वर्ष",
          },
        },
      },
      {
        id: "a-hole-the-plant-can-shut",
        name: {
          en: "A hole the plant can shut",
          hi: "वह छिद्र जिसे पादप बंद कर सकता है",
          mr: "वनस्पती बंद करू शकेल असे छिद्र",
        },
        kind: "structure",
        prompt: {
          en: "A leaf must let carbon dioxide in and cannot afford the water that goes out with it, so the opening is bounded by two cells that swell to open and slacken to close. What is this?",
          hi: "पत्ती को कार्बन डाइऑक्साइड भीतर लेनी है और उसके साथ बाहर जाता पानी वह वहन नहीं कर सकती, अतः छिद्र दो ऐसी कोशिकाओं से घिरा है जो फूलकर खोलती हैं और ढीली पड़कर बंद। यह क्या है?",
          mr: "पानाला कार्बन डायऑक्साइड आत घ्यायचा आहे आणि त्याच्यासोबत बाहेर जाणारे पाणी ते पेलू शकत नाही, म्हणून छिद्र अशा दोन पेशींनी वेढलेले ज्या फुगून उघडतात आणि सैलावून बंद करतात. हे काय?",
        },
        statement: {
          en: "A stoma is a pore between two guard cells whose walls are thicker on the inner side, so when they take up water they bow outwards and the pore opens, and when they lose it the pore shuts.",
          hi: "रंध्र दो रक्षक कोशिकाओं के बीच का छिद्र है जिनकी भित्तियाँ भीतरी ओर मोटी हैं, अतः पानी लेने पर वे बाहर की ओर झुक जाती हैं और छिद्र खुल जाता है, और पानी खोने पर छिद्र बंद।",
          mr: "पर्णरंध्र म्हणजे दोन रक्षक पेशींमधले छिद्र ज्यांच्या भित्तिका आतल्या बाजूला जाड आहेत, म्हणून पाणी घेताच त्या बाहेरच्या बाजूला वाकतात आणि छिद्र उघडते, आणि पाणी गमावताच छिद्र बंद.",
        },
        detail: {
          en: "The uneven wall is the whole mechanism: two cells that thickened evenly would simply get fatter and leave the pore exactly as it was.",
          hi: "असमान भित्ति ही पूरी क्रियाविधि है: समान रूप से मोटी हुई दो कोशिकाएँ बस और फूल जातीं और छिद्र ठीक वैसा ही छोड़ देतीं।",
          mr: "असमान भित्तिका हीच अख्खी कार्यपद्धती: समानपणे जाड झालेल्या दोन पेशी फक्त अधिक फुगल्या असत्या आणि छिद्र जसेच्या तसे सोडले असते.",
        },
        extra: {
          en: "Most plants keep them shut through the hottest hours and pay for it in lost photosynthesis, which is the trade every land plant has had to make since leaving the water.",
          hi: "अधिकांश पादप उन्हें सबसे गर्म घंटों में बंद रखते हैं और खोए प्रकाश-संश्लेषण से क़ीमत चुकाते हैं, और यही वह सौदा है जो पानी छोड़ने के बाद से हर थलीय पादप को करना पड़ा है।",
          mr: "बहुतेक वनस्पती ती सर्वांत उष्ण तासांत बंद ठेवतात आणि गमावलेल्या प्रकाशसंश्लेषणाने किंमत मोजतात, आणि हाच तो सौदा जो पाणी सोडल्यापासून प्रत्येक भूचर वनस्पतीला करावा लागला आहे.",
        },
        pair: {
          left: {
            en: "Shut at noon, and photosynthesis pays",
            hi: "दोपहर में बंद, और क़ीमत प्रकाश-संश्लेषण चुकाता है",
            mr: "दुपारी बंद, आणि किंमत प्रकाशसंश्लेषण मोजते",
          },
          right: {
            en: "a hole the plant can shut",
            hi: "वह छिद्र जिसे पादप बंद कर सकता है",
            mr: "वनस्पती बंद करू शकेल असे छिद्र",
          },
        },
      },
      /*F6B*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student hammers a nail into a young tree at one metre and predicts it will be at three metres in twenty years. It is still at one metre. Explain, and say what DID change about that spot.",
          hi: "एक विद्यार्थी नए पेड़ में एक मीटर पर कील ठोकता है और भविष्यवाणी करता है कि बीस वर्ष में वह तीन मीटर पर होगी। वह अब भी एक मीटर पर है। समझाओ, और बताओ कि उस स्थान के बारे में बदला क्या।",
          mr: "एक विद्यार्थी नव्या झाडात एक मीटरवर खिळा ठोकतो आणि भाकीत करतो की वीस वर्षांत तो तीन मीटरवर असेल. तो अजूनही एक मीटरवरच आहे. समजावा, आणि त्या जागेबद्दल बदलले काय ते सांगा.",
        },
        choices: [
          {
            en: "A stem does not lengthen along its whole body — only at the apical meristem in the tip. Everything below the tip is permanent tissue that never elongates again, so the nail's height was fixed the day it went in. What did change is girth: the vascular cambium, a cylinder just inside the bark, added a layer of secondary xylem every year, so the trunk grew outwards around the nail and swallowed it. Twenty rings now lie between the nail and the bark",
            hi: "तना अपने पूरे शरीर में लंबा नहीं होता — केवल सिरे के शीर्षस्थ विभज्योतक पर। सिरे से नीचे सब स्थायी ऊतक है जो फिर कभी नहीं बढ़ता, अतः कील की ऊँचाई उसी दिन तय हो गई जिस दिन वह ठुकी। बदला मोटाई: संवहन एधा, छाल के ठीक भीतर का बेलन, हर वर्ष द्वितीयक दारु की एक परत जोड़ती रही, अतः तना कील के चारों ओर बाहर की ओर बढ़ा और उसे निगल गया। अब कील और छाल के बीच बीस वलय हैं",
            mr: "खोड आपल्या अख्ख्या शरीरात लांब होत नाही — केवळ टोकाच्या अग्रस्थ विभाजी ऊतीवर. टोकाखालचे सर्व स्थायी ऊती जी पुन्हा कधीच वाढत नाही, म्हणून खिळ्याची उंची तो ठोकल्याच दिवशी ठरली. बदलली ती जाडी: वहन एधा, सालीच्या अगदी आतला दंडगोल, दरवर्षी द्वितीयक जलवाहिनीचा एक थर जोडत राहिली, म्हणून खोड खिळ्याभोवती बाहेरच्या दिशेने वाढले आणि त्याला गिळले. आता खिळा आणि साल यांच्यात वीस वलये आहेत",
          },
          {
            en: "The student is right in principle and the tree simply grew too slowly to move the nail a measurable distance",
            hi: "विद्यार्थी सिद्धांततः सही है और पेड़ बस इतना धीमा बढ़ा कि कील नापने योग्य दूरी हिल नहीं सकी",
            mr: "विद्यार्थी तत्त्वतः बरोबर आणि झाड इतके सावकाश वाढले की खिळा मोजण्याजोगे अंतर हलू शकला नाही",
          },
          {
            en: "The nail stayed put because the stem lengthens only from the base, pushing the tip up while the lower parts never move",
            hi: "कील इसलिए टिकी रही कि तना केवल आधार से लंबा होता है, सिरे को ऊपर धकेलते हुए, जबकि निचले भाग कभी नहीं हिलते",
            mr: "खिळा यासाठी जागीच राहिला की खोड केवळ तळापासून लांब होते, टोकाला वर ढकलत, तर खालचे भाग कधीच हलत नाहीत",
          },
          {
            en: "The nail stayed put because the iron killed the cambium around it, and a tree with dead cambium at one metre cannot lengthen above that point",
            hi: "कील इसलिए टिकी रही कि लोहे ने उसके आसपास की एधा मार दी, और एक मीटर पर मृत एधा वाला पेड़ उस बिंदु से ऊपर लंबा नहीं हो सकता",
            mr: "खिळा यासाठी जागीच राहिला की लोखंडाने त्याभोवतीची एधा मारली, आणि एक मीटरवर मृत एधा असलेले झाड त्या बिंदूच्या वर लांब होऊ शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The prediction assumes a plant stretches like a rubber band, and a plant does not. Growth in a flowering plant happens only where a meristem is, and there are two kinds in two places doing two different jobs. The apical meristem sits in the very tip of the shoot. It makes new cells, those cells elongate just below it, and then they stop — permanently. So a stem gets taller by ADDING at the top, not by expanding along its length. Every centimetre of trunk below the tip was finished years ago and will never move again relative to the ground. That fixes the nail. The lateral meristem — the vascular cambium — is a thin cylinder running the whole length of the trunk just inside the bark. It divides sideways: secondary xylem inwards, secondary phloem outwards, far more of the first than the second. That is the growth that DID happen at the nail's height. Twenty years of it means twenty annual rings laid down between the nail and the surface, so the nail is now buried well inside the wood, and a sawmill blade will find it long after nobody remembers it is there. Two consequences follow that a pupil can check. First, a fence wire nailed to a row of young trees ends up embedded in every one of them at exactly the height it was strung — the trees grew around it. Second, a carving or a name cut into bark at eye level is still at eye level decades later, distorted and widened but never lifted, which is exactly what the two meristems predict. The contrast with an animal is worth naming. A puppy's leg bones lengthen along growth plates near their ends and the whole limb scales up; a plant's stem is a stack of finished segments with one live tip. That is why plant growth is described as INDETERMINATE and localised — it never stops, but it only ever happens in a few square millimetres of tissue. (The second answer keeps the wrong model and blames the rate; the third invents basal growth, which is real in grasses via intercalary meristems but would push the nail UP, not hold it; and the fourth invents a mechanism that would stop the tree growing above one metre entirely.)",
          hi: "भविष्यवाणी मान लेती है कि पादप रबर बैंड की तरह खिंचता है, और पादप ऐसा नहीं करता। सपुष्पक पादप में वृद्धि केवल वहीं होती है जहाँ विभज्योतक हो, और दो जगह दो क़िस्म के हैं जो दो भिन्न काम करते हैं। शीर्षस्थ विभज्योतक प्ररोह के बिलकुल सिरे में बैठा है। वह नई कोशिकाएँ बनाता है, वे कोशिकाएँ उसके ठीक नीचे लंबी होती हैं, और फिर रुक जाती हैं — सदा के लिए। अतः तना ऊपर जोड़कर ऊँचा होता है, अपनी लंबाई भर फैलकर नहीं। सिरे से नीचे तने का हर सेंटीमीटर वर्षों पहले पूरा हो चुका और ज़मीन के सापेक्ष फिर कभी नहीं हिलेगा। इससे कील तय हो जाती है। पार्श्व विभज्योतक — संवहन एधा — छाल के ठीक भीतर तने की पूरी लंबाई में चलता पतला बेलन है। वह बग़ल की ओर विभाजित होती है: भीतर द्वितीयक दारु, बाहर द्वितीयक पोषवाह, पहला दूसरे से कहीं अधिक। यही वह वृद्धि है जो कील की ऊँचाई पर हुई। बीस वर्ष का अर्थ है कील और सतह के बीच बिछे बीस वार्षिक वलय, अतः कील अब लकड़ी के भीतर गहरे दबी है, और आरा-मिल का फल उसे तब भी पा लेगा जब किसी को याद न हो कि वह वहाँ है। दो परिणाम निकलते हैं जिन्हें विद्यार्थी जाँच सकता है। पहला, नए पेड़ों की क़तार पर कीलों से बाँधा बाड़ का तार अंत में हर एक में ठीक उसी ऊँचाई पर धँसा मिलता है जिस पर वह तना था — पेड़ उसके चारों ओर बढ़े। दूसरा, आँख की ऊँचाई पर छाल में खोदी नक्काशी या नाम दशकों बाद भी आँख की ऊँचाई पर है, विकृत और चौड़ा हुआ पर कभी उठा नहीं, और यही दोनों विभज्योतक भविष्यवाणी करते हैं। प्राणी से विरोध का नाम लेना उचित है। पिल्ले की टाँग की अस्थियाँ अपने सिरों के पास वृद्धि-पट्टों पर लंबी होती हैं और पूरा अंग बढ़ जाता है; पादप का तना पूरे हो चुके खंडों का ढेर है जिसका एक जीवित सिरा है। इसीलिए पादप-वृद्धि को अनिश्चित और स्थानीकृत कहा जाता है — वह कभी रुकती नहीं, पर होती सदा ऊतक के कुछ वर्ग मिलीमीटर में ही है। (दूसरा उत्तर ग़लत प्रतिरूप बनाए रखता है और दर को दोष देता है; तीसरा आधारीय वृद्धि गढ़ता है, जो घासों में अंतर्वेशी विभज्योतक से असली है पर कील को ऊपर धकेलती, थामती नहीं; और चौथा ऐसी क्रियाविधि गढ़ता है जो पेड़ को एक मीटर से ऊपर बढ़ने से पूरी तरह रोक देती।)",
          mr: "भाकीत गृहीत धरते की वनस्पती रबरबँडसारखी ताणली जाते, आणि वनस्पती तसे करत नाही. सपुष्प वनस्पतीत वाढ केवळ तिथेच होते जिथे विभाजी ऊती असेल, आणि दोन जागी दोन प्रकारच्या दोन वेगळी कामे करत आहेत. अग्रस्थ विभाजी ऊती प्ररोहाच्या अगदी टोकात बसलेली. ती नव्या पेशी बनवते, त्या पेशी तिच्या अगदी खाली लांब होतात, आणि मग थांबतात — कायमच्या. म्हणून खोड वर जोडून उंच होते, आपल्या लांबीभर पसरून नाही. टोकाखालचा खोडाचा प्रत्येक सेंटिमीटर वर्षांपूर्वी पूर्ण झाला आणि जमिनीच्या सापेक्ष पुन्हा कधीच हलणार नाही. यानेच खिळा ठरतो. पार्श्व विभाजी ऊती — वहन एधा — सालीच्या अगदी आत खोडाच्या अख्ख्या लांबीत चालणारा पातळ दंडगोल. ती बाजूला विभागते: आत द्वितीयक जलवाहिनी, बाहेर द्वितीयक रसवाहिनी, पहिली दुसरीहून कितीतरी अधिक. हीच ती वाढ जी खिळ्याच्या उंचीवर झाली. वीस वर्षांचा अर्थ खिळा आणि पृष्ठभाग यांच्यात घातलेली वीस वार्षिक वलये, म्हणून खिळा आता लाकडाच्या आत खोलवर पुरलेला, आणि करवतीचे पाते त्याला तेव्हाही सापडेल जेव्हा तो तिथे आहे हे कोणाला आठवणारही नाही. दोन परिणाम निघतात जे विद्यार्थी तपासू शकतो. पहिला, नव्या झाडांच्या रांगेवर खिळ्यांनी बांधलेली कुंपणाची तार शेवटी प्रत्येकात नेमक्या त्याच उंचीवर रुतलेली सापडते जिथे ती ताणली होती — झाडे तिच्याभोवती वाढली. दुसरा, डोळ्याच्या उंचीवर सालीत कोरलेले नक्षीकाम वा नाव दशकांनंतरही डोळ्याच्याच उंचीवर आहे, विकृत आणि रुंदावलेले पण कधीच उचलले गेलेले नाही, आणि नेमके हेच दोन्ही विभाजी ऊती भाकीत करतात. प्राण्याशी विरोधाचे नाव घेणे योग्य. पिल्लाच्या पायाची हाडे त्यांच्या टोकांजवळच्या वाढ-पट्ट्यांवर लांब होतात आणि अख्खा अवयव मोठा होतो; वनस्पतीचे खोड पूर्ण झालेल्या खंडांचा ढीग ज्याला एक जिवंत टोक आहे. म्हणूनच वनस्पती-वाढीला अनिश्चित आणि स्थानिक म्हणतात — ती कधीच थांबत नाही, पण होते नेहमी ऊतीच्या काही चौरस मिलिमीटरांतच. (दुसरे उत्तर चुकीचे प्रतिमान टिकवते आणि दराला दोष देते; तिसरे तळातली वाढ रचते, जी गवतांत आंतरवेशी विभाजी ऊतीने खरी आहे पण खिळ्याला वर ढकलेल, धरून ठेवणार नाही; आणि चौथे अशी कार्यपद्धती रचते जी झाडाला एक मीटरच्या वर वाढण्यापासून पूर्णपणे रोखेल.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A student says the age of any tree can be found by counting its rings. Assess this for a teak in Kerala's evergreen belt, a coconut palm, and a five-hundred-year-old deodar in Himachal.",
          hi: "एक विद्यार्थी कहता है कि किसी भी पेड़ की आयु उसके वलय गिनकर निकाली जा सकती है। केरल की सदाबहार पट्टी के सागौन, नारियल के ताड़, और हिमाचल के पाँच सौ वर्ष पुराने देवदार के लिए इसका आकलन करो।",
          mr: "एक विद्यार्थी म्हणतो की कोणत्याही झाडाचे वय त्याची वलये मोजून काढता येते. केरळच्या सदाहरित पट्ट्यातील साग, नारळाचे झाड, आणि हिमाचलमधील पाचशे वर्षे जुना देवदार यांसाठी याचे मूल्यमापन करा.",
        },
        choices: [
          {
            en: "It works for the deodar and fails for the other two, for two different reasons. A ring exists because the cambium works fast in one season and slowly in another; a tree in an evergreen belt with no marked dry season may lay wood at a steady rate and produce faint or missing rings, and a stressed tree can lay two in one year. The coconut fails at an earlier step: it is a monocot with closed vascular bundles and NO cambium at all, so it has no secondary growth, no wood and no rings to count — its trunk thickens only by cell enlargement and stops",
            hi: "यह देवदार के लिए चलता है और बाक़ी दोनों के लिए दो भिन्न कारणों से विफल है। वलय इसलिए होता है कि एधा एक ऋतु में तेज़ और दूसरी में धीमे काम करती है; बिना स्पष्ट शुष्क ऋतु वाली सदाबहार पट्टी का पेड़ स्थिर दर से लकड़ी बिछा सकता है और धुँधले या अनुपस्थित वलय बना सकता है, और तनावग्रस्त पेड़ एक वर्ष में दो बना सकता है। नारियल पहले ही क़दम पर विफल है: वह बंद संवहन पूलों वाला एकबीजपत्री है जिसमें एधा है ही नहीं, अतः उसमें द्वितीयक वृद्धि नहीं, लकड़ी नहीं और गिनने को वलय नहीं — उसका तना केवल कोशिका-विस्तार से मोटा होता है और रुक जाता है",
            mr: "हे देवदारासाठी चालते आणि उरलेल्या दोघांसाठी दोन वेगळ्या कारणांनी अपयशी. वलय यासाठी असते की एधा एका ऋतूत वेगाने आणि दुसऱ्यात सावकाश काम करते; स्पष्ट कोरडा ऋतू नसलेल्या सदाहरित पट्ट्यातले झाड स्थिर दराने लाकूड घालू शकते आणि पुसट वा अनुपस्थित वलये बनवू शकते, आणि ताणाखालचे झाड एका वर्षात दोन बनवू शकते. नारळ आधीच्याच पावलावर अपयशी: तो बंद वहनगुच्छ असलेला एकदल ज्याच्यात एधाच नाही, म्हणून त्याच्यात द्वितीयक वाढ नाही, लाकूड नाही आणि मोजायला वलये नाहीत — त्याचे खोड केवळ पेशी-विस्ताराने जाड होते आणि थांबते",
          },
          {
            en: "The student is right in all three cases: every tree lays exactly one ring per year, which is what makes the method a method",
            hi: "विद्यार्थी तीनों हाल में सही है: हर पेड़ ठीक एक वलय प्रति वर्ष बिछाता है, और यही इस विधि को विधि बनाता है",
            mr: "विद्यार्थी तिन्ही बाबतीत बरोबर: प्रत्येक झाड नेमके एक वलय प्रति वर्ष घालते, आणि हेच या पद्धतीला पद्धत बनवते",
          },
          {
            en: "It fails for all three, because rings record rainfall rather than time and can therefore never be counted as years",
            hi: "यह तीनों के लिए विफल है, क्योंकि वलय समय नहीं, वर्षा दर्ज करते हैं और इसलिए उन्हें कभी वर्ष के रूप में नहीं गिना जा सकता",
            mr: "हे तिघांसाठी अपयशी, कारण वलये काळ नव्हे, पाऊस नोंदवतात आणि म्हणून त्यांना कधीच वर्षे म्हणून मोजता येत नाही",
          },
          {
            en: "It works for the coconut and the teak but not the deodar, because conifers lay rings too irregularly to be counted",
            hi: "यह नारियल और सागौन के लिए चलता है पर देवदार के लिए नहीं, क्योंकि शंकुधारी वलय इतने अनियमित बिछाते हैं कि गिने न जा सकें",
            mr: "हे नारळ आणि सागासाठी चालते पण देवदारासाठी नाही, कारण शंकुधारी वलये इतकी अनियमित घालतात की मोजता येत नाहीत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Three trees, three different answers, and the useful part is that the two failures fail for reasons at completely different depths. Start with what a ring actually is, because the method stands or falls on it. The vascular cambium divides all year in a favourable climate, but it divides FASTER when water and warmth are plentiful and slower as they run out. Fast division makes spring wood: wide vessels, thin walls, pale. Slow division makes autumn wood: narrow vessels, thick walls, dark. The visible ring boundary is where dark autumn wood of one year meets pale spring wood of the next. So a ring is not a year — it is a CONTRAST, and it happens to coincide with a year wherever the climate provides exactly one such contrast annually. The deodar has that. Himachal gives a hard winter and a distinct growing season, one cycle a year, unambiguous boundaries. Counting rings there is sound enough that dendrochronology — dating by ring patterns — is built on conifers of exactly this kind, and the ring WIDTHS additionally record which years were dry. The teak in an evergreen belt is the interesting failure, because the tree is perfectly capable of making rings and the climate may not ask it to. Where rainfall is spread through the year with no pronounced dry season, cambial activity can stay near-constant and the boundaries become faint or vanish. Worse, the error goes both ways: a tree that suffers an unseasonal drought and then recovers can lay a false ring inside a single year, and one that is severely stressed can miss a year entirely. So a count in the tropics is a lower bound with error bars, not an age, and foresters cross-date against known-age trees rather than trusting a single trunk. The coconut fails before any of that can be discussed, and this is the answer that shows whether the anatomy was understood. A palm is a monocot. Its vascular bundles are CLOSED — there is no cambium between the xylem and the phloem — so there is no lateral meristem, no secondary xylem, and therefore no wood in the botanical sense at all. What thickens a palm trunk is primary: cells enlarging, plus a limited diffuse thickening near the crown. A cross-section shows scattered bundles in ground tissue, unchanged for the tree's whole life, and no concentric anything. Ask a palm its age with a saw and it has no way to answer. The general lesson is one this chapter keeps making: a technique inherits every assumption of the anatomy it rests on. Ring-counting assumes secondary growth from a cambium AND a single annual climatic cycle, and the honest way to use it is to state both, check both, and say which one is missing when the number comes out wrong. (The second answer treats a good rule as a law; the third overcorrects into uselessness, when dendrochronology demonstrably works; and the fourth reverses the botany completely — the conifer is the reliable case and the palm has no rings at all.)",
          hi: "तीन पेड़, तीन भिन्न उत्तर, और उपयोगी बात यह है कि दोनों विफलताएँ बिलकुल भिन्न गहराइयों के कारणों से विफल हैं। पहले देखो वलय है क्या, क्योंकि विधि उसी पर टिकी या गिरी है। अनुकूल जलवायु में संवहन एधा साल भर विभाजित होती है, पर वह तब तेज़ विभाजित होती है जब पानी और गर्मी प्रचुर हों और तब धीमे जब वे चुकने लगें। तेज़ विभाजन वसंत-काष्ठ बनाता है: चौड़ी वाहिकाएँ, पतली भित्तियाँ, हल्का रंग। धीमा विभाजन शरद-काष्ठ बनाता है: सँकरी वाहिकाएँ, मोटी भित्तियाँ, गहरा रंग। दिखने वाली वलय-सीमा वहीं है जहाँ एक वर्ष की गहरी शरद-काष्ठ अगले की हल्की वसंत-काष्ठ से मिलती है। अतः वलय वर्ष नहीं — वह विरोध है, और वह वहीं वर्ष से मेल खाता है जहाँ जलवायु सालाना ठीक एक ऐसा विरोध दे। देवदार के पास वह है। हिमाचल कड़ी सर्दी और स्पष्ट वृद्धि-ऋतु देता है, साल में एक चक्र, असंदिग्ध सीमाएँ। वहाँ वलय गिनना इतना ठोस है कि वृक्ष-कालक्रम — वलय-प्रतिरूपों से तिथि निकालना — ठीक इसी क़िस्म के शंकुधारियों पर बना है, और वलयों की चौड़ाइयाँ अतिरिक्त रूप से यह भी दर्ज करती हैं कि कौन-से वर्ष सूखे थे। सदाबहार पट्टी का सागौन रोचक विफलता है, क्योंकि पेड़ वलय बनाने में पूरी तरह सक्षम है और जलवायु उससे वह माँगती ही न हो। जहाँ वर्षा साल भर फैली हो और कोई स्पष्ट शुष्क ऋतु न हो, वहाँ एधा की सक्रियता लगभग अचर रह सकती है और सीमाएँ धुँधली या ग़ायब हो जाती हैं। और बुरा यह कि त्रुटि दोनों ओर जाती है: जो पेड़ बेमौसम सूखा झेलकर फिर सँभले वह एक ही वर्ष में झूठा वलय बिछा सकता है, और जो गंभीर तनाव में हो वह पूरा वर्ष छोड़ सकता है। अतः उष्णकटिबंध में गिनती त्रुटि-सीमा सहित निचली सीमा है, आयु नहीं, और वनकर्मी एक तने पर भरोसा करने के बजाय ज्ञात-आयु पेड़ों से मिलान करते हैं। नारियल इन सबकी चर्चा शुरू होने से पहले ही विफल है, और यही वह उत्तर है जो दिखाता है कि शारीरिकी समझी गई या नहीं। ताड़ एकबीजपत्री है। उसके संवहन पूल बंद हैं — दारु और पोषवाह के बीच कोई एधा नहीं — अतः कोई पार्श्व विभज्योतक नहीं, कोई द्वितीयक दारु नहीं, और इसलिए वानस्पतिक अर्थ में लकड़ी ही नहीं। ताड़ का तना जो मोटा करता है वह प्राथमिक है: कोशिकाओं का बड़ा होना, साथ में शीर्ष के पास सीमित विसरित मोटाई। अनुप्रस्थ काट भरण ऊतक में बिखरे पूल दिखाती है, पेड़ के पूरे जीवन में अपरिवर्तित, और संकेंद्री कुछ भी नहीं। ताड़ से आरे के साथ उसकी आयु पूछो और उसके पास उत्तर देने का कोई साधन नहीं। सामान्य सीख वही है जो यह अध्याय बार-बार देता है: कोई तकनीक उस शारीरिकी की हर मान्यता विरासत में पाती है जिस पर वह टिकी है। वलय-गणना मानती है एधा से द्वितीयक वृद्धि और एक ही वार्षिक जलवायु-चक्र, और उसे बरतने का ईमानदार तरीक़ा है दोनों बताना, दोनों जाँचना, और संख्या ग़लत निकलने पर कहना कि इनमें से कौन-सी ग़ायब है। (दूसरा उत्तर अच्छे नियम को क़ानून मान लेता है; तीसरा सुधारते-सुधारते बेकार कर देता है, जबकि वृक्ष-कालक्रम प्रत्यक्षतः काम करता है; और चौथा वनस्पति-विज्ञान पूरी तरह उलट देता है — शंकुधारी ही भरोसेमंद हाल है और ताड़ में वलय हैं ही नहीं।)",
          mr: "तीन झाडे, तीन वेगळी उत्तरे, आणि उपयुक्त भाग असा की दोन्ही अपयशे पूर्णपणे वेगळ्या खोलीच्या कारणांनी अपयशी. आधी वलय म्हणजे नेमके काय ते पाहा, कारण पद्धत त्यावरच टिकते वा कोसळते. अनुकूल हवामानात वहन एधा वर्षभर विभागते, पण ती तेव्हा वेगाने विभागते जेव्हा पाणी आणि ऊब विपुल असतात आणि तेव्हा सावकाश जेव्हा ती संपू लागतात. वेगवान विभाजन वसंत-काष्ठ बनवते: रुंद वाहिन्या, पातळ भित्तिका, फिकट. सावकाश विभाजन शरद-काष्ठ बनवते: अरुंद वाहिन्या, जाड भित्तिका, गडद. दिसणारी वलय-सीमा तिथेच जिथे एका वर्षाचे गडद शरद-काष्ठ पुढच्याच्या फिकट वसंत-काष्ठाला भेटते. म्हणून वलय हे वर्ष नव्हे — तो विरोध आहे, आणि तो तिथेच वर्षाशी जुळतो जिथे हवामान वर्षाला नेमका एक असा विरोध देते. देवदाराकडे तो आहे. हिमाचल कडक हिवाळा आणि स्पष्ट वाढ-ऋतू देतो, वर्षाला एक चक्र, निःसंदिग्ध सीमा. तिथे वलये मोजणे इतके भक्कम की वृक्ष-कालमापन — वलय-आकृतिबंधांवरून तारीख काढणे — नेमक्या याच प्रकारच्या शंकुधारींवर उभे आहे, आणि वलयांच्या रुंदी शिवाय हेही नोंदवतात की कोणती वर्षे कोरडी होती. सदाहरित पट्ट्यातला साग हे रोचक अपयश, कारण झाड वलये बनवण्यास पूर्णपणे सक्षम आहे आणि हवामान त्याच्याकडून ती मागतच नसेल. जिथे पाऊस वर्षभर पसरलेला आणि स्पष्ट कोरडा ऋतू नाही, तिथे एधेची सक्रियता जवळपास अचल राहू शकते आणि सीमा पुसट होतात वा नाहीशा. आणि वाईट हे की चूक दोन्ही दिशांनी जाते: बेमोसमी दुष्काळ सोसून सावरलेले झाड एकाच वर्षात खोटे वलय घालू शकते, आणि तीव्र ताणाखालचे अख्खे वर्ष वगळू शकते. म्हणून उष्णकटिबंधातली मोजणी ही चूक-मर्यादेसह खालची सीमा आहे, वय नव्हे, आणि वनाधिकारी एका खोडावर विश्वास ठेवण्याऐवजी ज्ञात-वयाच्या झाडांशी ताडून पाहतात. नारळ या सर्वांची चर्चा सुरू होण्याआधीच अपयशी, आणि हेच ते उत्तर जे दाखवते की शारीरिकी समजली की नाही. ताड हा एकदल. त्याचे वहनगुच्छ बंद — जलवाहिनी आणि रसवाहिनी यांच्यात एधा नाही — म्हणून पार्श्व विभाजी ऊती नाही, द्वितीयक जलवाहिनी नाही, आणि म्हणून वनस्पतिशास्त्रीय अर्थाने लाकूडच नाही. ताडाचे खोड जे जाड करते ते प्राथमिक: पेशी मोठ्या होणे, सोबत शेंड्याजवळ मर्यादित विखुरलेली जाडी. आडवा छेद भरण ऊतीत विखुरलेले गुच्छ दाखवतो, झाडाच्या अख्ख्या आयुष्यात अपरिवर्तित, आणि संकेंद्री काहीही नाही. ताडाला करवतीसह त्याचे वय विचारा आणि त्याच्याकडे उत्तर द्यायचे साधनच नाही. सामान्य धडा तोच जो हे प्रकरण वारंवार देते: कोणतेही तंत्र ते ज्या शारीरिकीवर टेकले आहे तिची प्रत्येक गृहीतके वारशाने घेते. वलय-मोजणी गृहीत धरते एधेकडून द्वितीयक वाढ आणि एकच वार्षिक हवामान-चक्र, आणि ती वापरण्याचा प्रामाणिक मार्ग म्हणजे दोन्ही सांगणे, दोन्ही तपासणे, आणि आकडा चुकीचा निघाल्यास त्यांतले कोणते गायब आहे ते सांगणे. (दुसरे उत्तर चांगल्या नियमाला कायदा मानते; तिसरे दुरुस्त करता करता निरुपयोगी करते, तर वृक्ष-कालमापन प्रत्यक्षात चालते; आणि चौथे वनस्पतिशास्त्र पूर्णपणे उलटवते — शंकुधारीच विश्वासार्ह प्रकरण आहे आणि ताडात वलये नाहीतच.)",
        },
      },
      /*H6B*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 7 — Structural Organisation in Animals                          */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-11-structural-organisation-in-animals",
    subject: "BIOLOGY",
    classLevel: 11,
    chapter: {
      en: "Chapter 7 — Structural Organisation in Animals",
      hi: "अध्याय 7 — प्राणियों में संरचनात्मक संगठन",
      mr: "प्रकरण 7 — प्राण्यांतील संरचनात्मक संघटन",
    },
    name: {
      en: "Structural Organisation in Animals",
      hi: "प्राणियों में संरचनात्मक संगठन",
      mr: "प्राण्यांतील संरचनात्मक संघटन",
    },
    summary: {
      en: "Cells become an animal only by being joined, and how they are joined decides everything above them: seams that leak nothing, so a stomach can hold acid; a lining named by its shape rather than its address; a tissue that is mostly the jelly between its cells; blood that leaves its pipes entirely in an insect; and a frog whose skin does a lung's work and therefore must never dry.",
      hi: "कोशिकाएँ जुड़कर ही प्राणी बनती हैं, और वे कैसे जुड़ी हैं यह उनसे ऊपर का सब तय करता है: वे सीवन जो कुछ भी नहीं रिसने देतीं, ताकि आमाशय अम्ल थाम सके; वह आस्तर जिसका नाम उसके पते से नहीं, आकार से पड़ता है; वह ऊतक जो अधिकतर अपनी कोशिकाओं के बीच की जेली है; वह रुधिर जो कीट में अपनी नलिकाएँ पूरी तरह छोड़ देता है; और वह मेंढक जिसकी त्वचा फेफड़े का काम करती है और इसीलिए कभी सूखनी नहीं चाहिए।",
      mr: "पेशी जोडल्या जाऊनच प्राणी बनतात, आणि त्या कशा जोडल्या आहेत हे त्यांच्यावरचे सर्व ठरवते: काहीही न गळू देणारे ते शिवण, जेणेकरून जठर आम्ल धरू शकेल; ते अस्तर ज्याचे नाव त्याच्या पत्त्याने नव्हे, आकाराने पडते; ती ऊती जी बहुतांशी आपल्या पेशींमधली जेली आहे; ते रक्त जे कीटकात आपल्या नळ्या पूर्णपणे सोडते; आणि तो बेडूक ज्याची त्वचा फुफ्फुसाचे काम करते आणि म्हणूनच कधीही वाळता कामा नये.",
    },
    position: 7,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "the-seams-between-cells",
        name: {
          en: "The seams between cells, and what each decides",
          hi: "कोशिकाओं के बीच की सीवन, और हर एक क्या तय करती है",
          mr: "पेशींमधली शिवणे, आणि प्रत्येक काय ठरवते",
        },
        kind: "structure",
        prompt: {
          en: "A stomach holds acid strong enough to dissolve metal and none of it seeps between the cells of the lining, because one kind of join is watertight, another glues, and a third opens a channel from cell to cell. What are these?",
          hi: "आमाशय इतना प्रबल अम्ल थामे रहता है कि धातु घुल जाए और उसका कुछ भी आस्तर की कोशिकाओं के बीच से नहीं रिसता, क्योंकि एक क़िस्म का जोड़ जल-रोधी है, दूसरा चिपकाता है, और तीसरा कोशिका से कोशिका तक नाली खोल देता है। ये क्या हैं?",
          mr: "जठर धातू विरघळेल इतके प्रबळ आम्ल धरून ठेवते आणि त्यातले काहीही अस्तराच्या पेशींमधून झिरपत नाही, कारण एका प्रकारचा सांधा जलरोधक आहे, दुसरा चिकटवतो, आणि तिसरा पेशीपासून पेशीपर्यंत नळी उघडतो. ही काय आहेत?",
        },
        statement: {
          en: "Cells are held together by three kinds of junction: tight junctions that stop anything leaking between cells, adhering junctions that cement neighbours together, and gap junctions that connect their cytoplasms so signals and small molecules pass directly.",
          hi: "कोशिकाएँ तीन क़िस्म के संधि-स्थलों से जुड़ी रहती हैं: दृढ़ संधि जो कोशिकाओं के बीच से कुछ भी रिसने नहीं देती, आसंजी संधि जो पड़ोसियों को जोड़े रखती है, और अंतराल संधि जो उनके कोशिकाद्रव्यों को जोड़ देती है ताकि संकेत और छोटे अणु सीधे जा सकें।",
          mr: "पेशी तीन प्रकारच्या सांध्यांनी जोडलेल्या असतात: घट्ट सांधा जो पेशींमधून काहीही गळू देत नाही, चिकट सांधा जो शेजाऱ्यांना जोडून ठेवतो, आणि अंतराल सांधा जो त्यांची पेशीद्रव्ये जोडतो जेणेकरून संकेत आणि लहान रेणू थेट जाऊ शकतील.",
        },
        detail: {
          en: "Each junction is a different answer to a different question — leakage, strength, communication — so a tissue's job can be read off which kinds it is rich in.",
          hi: "हर संधि भिन्न प्रश्न का भिन्न उत्तर है — रिसाव, मज़बूती, संचार — अतः किसी ऊतक का काम इससे पढ़ा जा सकता है कि उसमें किन क़िस्मों की भरमार है।",
          mr: "प्रत्येक सांधा वेगळ्या प्रश्नाचे वेगळे उत्तर — गळती, बळकटी, संदेशवहन — म्हणून एखाद्या ऊतीचे काम त्यात कोणत्या प्रकारांची विपुलता आहे यावरून वाचता येते.",
        },
        extra: {
          en: "Gap junctions are why heart muscle contracts as one sheet rather than cell by cell: the signal does not have to be re-announced at every boundary.",
          hi: "अंतराल संधियों के कारण ही हृदय-पेशी एक चादर की तरह सिकुड़ती है, कोशिका-दर-कोशिका नहीं: संकेत को हर सीमा पर फिर से घोषित नहीं करना पड़ता।",
          mr: "अंतराल सांध्यांमुळेच हृदयस्नायू एका चादरीसारखा आकुंचन पावतो, पेशी-दर-पेशी नव्हे: संकेत प्रत्येक सीमेवर पुन्हा जाहीर करावा लागत नाही.",
        },
        pair: {
          left: {
            en: "The heart contracts as one sheet",
            hi: "हृदय एक चादर की तरह सिकुड़ता है",
            mr: "हृदय एका चादरीसारखे आकुंचन पावते",
          },
          right: {
            en: "the seams between cells, and what each decides",
            hi: "कोशिकाओं के बीच की सीवन, और हर एक क्या तय करती है",
            mr: "पेशींमधली शिवणे, आणि प्रत्येक काय ठरवते",
          },
        },
      },
      {
        id: "a-lining-named-by-its-shape",
        name: {
          en: "A lining named by its shape, not its address",
          hi: "वह आस्तर जिसका नाम उसके पते से नहीं, आकार से है",
          mr: "पत्त्याने नव्हे, आकाराने नाव मिळालेले अस्तर",
        },
        kind: "criterion",
        prompt: {
          en: "The lining of an air sac is one layer of flat cells because gas must cross it, and the lining of the gullet is many layers of the same flat cells because food scrapes past. Which naming is this?",
          hi: "वायुकोष का आस्तर चपटी कोशिकाओं की एक परत है क्योंकि उसके पार गैस जानी है, और ग्रसनी का आस्तर उन्हीं चपटी कोशिकाओं की कई परतें हैं क्योंकि भोजन रगड़ता हुआ जाता है। यह कौन-सा नामकरण है?",
          mr: "वायुकोशाचे अस्तर सपाट पेशींचा एक थर आहे कारण त्यातून वायू जायचा आहे, आणि अन्ननलिकेचे अस्तर त्याच सपाट पेशींचे अनेक थर आहेत कारण अन्न घासत जाते. हे कोणते नामकरण?",
        },
        statement: {
          en: "Epithelium is classified by cell shape — squamous, cuboidal or columnar — and by the number of layers, simple for one and compound for many, so the name states the job before the location is even mentioned.",
          hi: "उपकला कोशिका के आकार से वर्गीकृत होती है — शल्की, घनाकार या स्तंभाकार — और परतों की संख्या से, एक के लिए सरल और अनेक के लिए संयुक्त, अतः नाम स्थान का ज़िक्र होने से पहले ही काम बता देता है।",
          mr: "अपिस्तर पेशीच्या आकाराने वर्गीकृत होते — शल्की, घनाकार वा स्तंभाकार — आणि थरांच्या संख्येने, एकासाठी साधे आणि अनेकांसाठी संयुक्त, म्हणून नाव जागेचा उल्लेख होण्याआधीच काम सांगते.",
        },
        detail: {
          en: "Simple means exchange and compound means protection, without exception: one layer wherever something must cross, many wherever something must be resisted.",
          hi: "सरल का अर्थ विनिमय और संयुक्त का अर्थ रक्षा, बिना अपवाद: जहाँ कुछ पार जाना हो वहाँ एक परत, जहाँ कुछ रोकना हो वहाँ अनेक।",
          mr: "साधे म्हणजे देवाणघेवाण आणि संयुक्त म्हणजे संरक्षण, अपवादाशिवाय: जिथे काही पार जायचे तिथे एक थर, जिथे काही रोखायचे तिथे अनेक.",
        },
        extra: {
          en: "Columnar cells are tall because tall cells have room for machinery, which is why the gut lining that secretes and absorbs is columnar and the air sac that only lets gas through is not.",
          hi: "स्तंभाकार कोशिकाएँ ऊँची हैं क्योंकि ऊँची कोशिकाओं में मशीनरी की जगह होती है, इसीलिए स्रावण और अवशोषण करता आँत का आस्तर स्तंभाकार है और केवल गैस जाने देता वायुकोष नहीं।",
          mr: "स्तंभाकार पेशी उंच आहेत कारण उंच पेशींत यंत्रणेला जागा असते, म्हणूनच स्रवणारे आणि शोषणारे आतड्याचे अस्तर स्तंभाकार आणि केवळ वायू जाऊ देणारा वायुकोश नाही.",
        },
        pair: {
          left: {
            en: "One layer to cross, many to resist",
            hi: "पार जाने को एक परत, रोकने को अनेक",
            mr: "पार जायला एक थर, रोखायला अनेक",
          },
          right: {
            en: "a lining named by its shape, not its address",
            hi: "वह आस्तर जिसका नाम उसके पते से नहीं, आकार से है",
            mr: "पत्त्याने नव्हे, आकाराने नाव मिळालेले अस्तर",
          },
        },
      },
      {
        id: "mostly-the-space-between-its-cells",
        name: {
          en: "The tissue that is mostly the space between its cells",
          hi: "वह ऊतक जो अधिकतर अपनी कोशिकाओं के बीच की जगह है",
          mr: "बहुतांशी आपल्या पेशींमधली जागा असलेली ऊती",
        },
        kind: "structure",
        prompt: {
          en: "Bone, cartilage, tendon, fat and blood look nothing alike and are one family, because in every one of them the cells are scattered and what does the work is the material they secreted around themselves. What is that?",
          hi: "अस्थि, उपास्थि, कंडरा, वसा और रुधिर बिलकुल एक जैसे नहीं दिखते और एक ही कुनबा हैं, क्योंकि उनमें से हर एक में कोशिकाएँ बिखरी हैं और काम वह पदार्थ करता है जो उन्होंने अपने चारों ओर स्रवित किया। वह क्या है?",
          mr: "हाड, कूर्चा, कंडरा, चरबी आणि रक्त अजिबात सारखे दिसत नाहीत आणि एकच कुटुंब आहेत, कारण त्यांतल्या प्रत्येकात पेशी विखुरलेल्या आहेत आणि काम ते द्रव्य करते जे त्यांनी स्वतःभोवती स्रवले. ते काय?",
        },
        statement: {
          en: "Connective tissue is defined by its matrix — the material between the cells — so its properties come from what that matrix is made of: fibres for a tendon, minerals for bone, plasma for blood.",
          hi: "संयोजी ऊतक अपने आधात्री से परिभाषित है — कोशिकाओं के बीच का पदार्थ — अतः उसके गुण इससे आते हैं कि वह आधात्री बनी किससे है: कंडरा के लिए तंतु, अस्थि के लिए खनिज, रुधिर के लिए प्लाज़्मा।",
          mr: "संयोजी ऊती आपल्या आधारद्रव्याने परिभाषित — पेशींमधले द्रव्य — म्हणून तिचे गुणधर्म ते आधारद्रव्य कशाचे बनले आहे यातून येतात: कंडरेसाठी तंतू, हाडासाठी खनिजे, रक्तासाठी प्लाझ्मा.",
        },
        detail: {
          en: "Blood belongs here for exactly that reason, and it startles everyone: its matrix is liquid, and a tissue whose matrix flows is still a tissue.",
          hi: "रुधिर ठीक इसी कारण यहाँ है, और यह सबको चौंकाता है: उसकी आधात्री तरल है, और जिस ऊतक की आधात्री बहती हो वह भी ऊतक ही है।",
          mr: "रक्त नेमक्या याच कारणाने इथे आहे, आणि हे सर्वांना चकित करते: त्याचे आधारद्रव्य द्रव आहे, आणि ज्या ऊतीचे आधारद्रव्य वाहते ती देखील ऊतीच आहे.",
        },
        extra: {
          en: "It is also why a tendon heals so slowly: the cells are few and far apart, and most of what must be rebuilt is material rather than cells.",
          hi: "इसीलिए कंडरा इतना धीमे भरता है: कोशिकाएँ थोड़ी और दूर-दूर हैं, और जो पुनर्निर्मित करना है उसका अधिकांश कोशिकाएँ नहीं, पदार्थ है।",
          mr: "म्हणूनच कंडरा इतकी सावकाश भरून येते: पेशी थोड्या आणि दूरदूर, आणि पुन्हा बांधायचे बहुतांश पेशी नव्हे, द्रव्य आहे.",
        },
        pair: {
          left: {
            en: "Blood is a tissue whose matrix flows",
            hi: "रुधिर वह ऊतक है जिसकी आधात्री बहती है",
            mr: "रक्त ही ऊती जिचे आधारद्रव्य वाहते",
          },
          right: {
            en: "the tissue that is mostly the space between its cells",
            hi: "वह ऊतक जो अधिकतर अपनी कोशिकाओं के बीच की जगह है",
            mr: "बहुतांशी आपल्या पेशींमधली जागा असलेली ऊती",
          },
        },
      },
      {
        id: "blood-that-leaves-its-pipes",
        name: {
          en: "Blood that leaves its pipes on purpose",
          hi: "वह रुधिर जो जानबूझकर अपनी नलिकाएँ छोड़ देता है",
          mr: "मुद्दाम आपल्या नळ्या सोडणारे रक्त",
        },
        kind: "contrast",
        prompt: {
          en: "In an earthworm the blood never leaves its vessels; in a cockroach it is pumped into the body cavity and washes over the organs before draining back. Which contrast is this?",
          hi: "केंचुए में रुधिर अपनी वाहिकाएँ कभी नहीं छोड़ता; तिलचट्टे में उसे शरीर-गुहा में पंप किया जाता है और वह अंगों पर बहकर फिर लौट आता है। यह कौन-सा विरोध है?",
          mr: "गांडुळात रक्त आपल्या वाहिन्या कधीच सोडत नाही; झुरळात ते शरीरपोकळीत पंप केले जाते आणि अवयवांवरून वाहून पुन्हा परतते. हा कोणता विरोध?",
        },
        statement: {
          en: "Circulation is closed when the blood stays inside vessels the whole way round, as in an earthworm or a vertebrate, and open when it is pumped into an open body cavity, as in a cockroach.",
          hi: "परिसंचरण बंद है जब रुधिर पूरे चक्कर में वाहिकाओं के भीतर ही रहे, जैसे केंचुए या कशेरुकी में, और खुला जब उसे खुली शरीर-गुहा में पंप किया जाए, जैसे तिलचट्टे में।",
          mr: "अभिसरण बंद असते जेव्हा रक्त अख्ख्या फेरीत वाहिन्यांच्या आतच राहते, जसे गांडुळात वा पृष्ठवंशीयात, आणि उघडे जेव्हा ते उघड्या शरीरपोकळीत पंप केले जाते, जसे झुरळात.",
        },
        detail: {
          en: "A closed system can push blood hard and send it where it is wanted; an open one cannot control the pressure or the destination, so delivery is slow and undirected.",
          hi: "बंद तंत्र रुधिर को ज़ोर से धकेल सकता है और जहाँ चाहिए वहाँ भेज सकता है; खुला तंत्र न दाब पर नियंत्रण रख सकता है न गंतव्य पर, अतः वितरण धीमा और बिना दिशा का है।",
          mr: "बंद संस्था रक्त जोराने ढकलू शकते आणि हवे तिथे पाठवू शकते; उघडी संस्था ना दाबावर नियंत्रण ठेवू शकते ना गंतव्यावर, म्हणून वितरण मंद आणि दिशाहीन.",
        },
        extra: {
          en: "The cockroach gets away with it because its blood carries almost no oxygen — air reaches its tissues directly through tracheal tubes, so the slow circulation never has to deliver a breath.",
          hi: "तिलचट्टा इससे बच जाता है क्योंकि उसका रुधिर लगभग कोई ऑक्सीजन नहीं ढोता — हवा उसके ऊतकों तक श्वासनलियों से सीधे पहुँचती है, अतः धीमे परिसंचरण को साँस कभी नहीं पहुँचानी पड़ती।",
          mr: "झुरळ यातून सुटते कारण त्याचे रक्त जवळपास ऑक्सिजन वाहतच नाही — हवा त्याच्या ऊतींपर्यंत श्वासनलिकांतून थेट पोहोचते, म्हणून मंद अभिसरणाला श्वास कधीच पोहोचवावा लागत नाही.",
        },
        pair: {
          left: {
            en: "Air reaches the tissues without the blood",
            hi: "हवा रुधिर के बिना ऊतकों तक पहुँचती है",
            mr: "हवा रक्ताविना ऊतींपर्यंत पोहोचते",
          },
          right: {
            en: "blood that leaves its pipes on purpose",
            hi: "वह रुधिर जो जानबूझकर अपनी नलिकाएँ छोड़ देता है",
            mr: "मुद्दाम आपल्या नळ्या सोडणारे रक्त",
          },
        },
      },
      {
        id: "an-animal-that-breathes-through-its-skin",
        name: {
          en: "The animal that breathes through its skin",
          hi: "वह प्राणी जो अपनी त्वचा से साँस लेता है",
          mr: "आपल्या त्वचेने श्वास घेणारा तो प्राणी",
        },
        kind: "process",
        prompt: {
          en: "A frog underwater for an hour with its mouth and nostrils shut is not holding its breath: gas is crossing a surface it keeps deliberately wet, and it has lungs it is not using. What is this?",
          hi: "मुँह और नथुने बंद किए घंटे भर पानी के नीचे रहा मेंढक साँस रोके नहीं है: गैस उस सतह के पार जा रही है जिसे वह जानबूझकर गीली रखता है, और उसके पास फेफड़े हैं जिन्हें वह काम में नहीं ले रहा। यह क्या है?",
          mr: "तोंड आणि नाकपुड्या बंद करून तासभर पाण्याखाली राहिलेला बेडूक श्वास रोखून नाही: वायू तो मुद्दाम ओली ठेवत असलेल्या पृष्ठभागातून जात आहे, आणि त्याच्याकडे फुफ्फुसे आहेत जी तो वापरत नाही. हे काय?",
        },
        statement: {
          en: "Cutaneous respiration is gas exchange across the skin, which works only while the skin is moist, richly supplied with blood and thin enough for gases to diffuse through.",
          hi: "त्वचीय श्वसन त्वचा के पार गैस-विनिमय है, जो केवल तभी चलता है जब त्वचा नम हो, रुधिर से भरपूर हो और इतनी पतली हो कि गैसें विसरित हो सकें।",
          mr: "त्वचीय श्वसन म्हणजे त्वचेपलीकडे वायुविनिमय, जो केवळ तेव्हाच चालतो जेव्हा त्वचा ओलसर, रक्ताने भरपूर आणि वायू विसरण्याइतकी पातळ असेल.",
        },
        detail: {
          en: "It is not a spare lung but the frog's main route during hibernation underwater, when the lungs are useless and the metabolic demand is low.",
          hi: "यह कोई फ़ालतू फेफड़ा नहीं, बल्कि पानी के नीचे शीत-निष्क्रियता में मेंढक का मुख्य मार्ग है, जब फेफड़े बेकार हैं और उपापचयी माँग कम।",
          mr: "हे काही जादा फुफ्फुस नव्हे, तर पाण्याखालच्या शीतनिष्क्रियतेत बेडकाचा मुख्य मार्ग, जेव्हा फुफ्फुसे निरुपयोगी आणि चयापचयी मागणी कमी.",
        },
        extra: {
          en: "The price is a habitat: a skin thin and wet enough to breathe through cannot keep water in, which is why no amphibian has ever colonised a desert the way a reptile did.",
          hi: "क़ीमत है आवास: साँस लेने लायक़ पतली और गीली त्वचा पानी भीतर नहीं रोक सकती, इसीलिए कोई उभयचर मरुस्थल वैसे कभी नहीं बसा सका जैसे सरीसृप ने बसाया।",
          mr: "किंमत आहे अधिवास: श्वास घेण्याइतकी पातळ आणि ओली त्वचा पाणी आत ठेवू शकत नाही, म्हणूनच कोणत्याही उभयचराने वाळवंट तसे कधीच वसवले नाही जसे सरपटणाऱ्याने वसवले.",
        },
        pair: {
          left: {
            en: "No amphibian ever took the desert",
            hi: "कोई उभयचर कभी मरुस्थल नहीं ले सका",
            mr: "कोणत्याही उभयचराने वाळवंट कधीच घेतले नाही",
          },
          right: {
            en: "the animal that breathes through its skin",
            hi: "वह प्राणी जो अपनी त्वचा से साँस लेता है",
            mr: "आपल्या त्वचेने श्वास घेणारा तो प्राणी",
          },
        },
      },
      {
        id: "when-organs-stop-working-alone",
        name: {
          en: "When organs stop working alone",
          hi: "जब अंग अकेले काम करना छोड़ देते हैं",
          mr: "जेव्हा अवयव एकटे काम करणे थांबवतात",
        },
        kind: "structure",
        prompt: {
          en: "A stomach can digest and a kidney can filter, but neither can feed the other or itself; the level above them is where a set of organs is arranged so one hands its output to the next. What is this?",
          hi: "आमाशय पचा सकता है और वृक्क छान सकता है, पर न कोई दूसरे को खिला सकता है न स्वयं को; उनसे ऊपर का स्तर वह है जहाँ अंगों का समुच्चय ऐसे सजा हो कि एक अपना उत्पाद अगले को थमाए। यह क्या है?",
          mr: "जठर पचवू शकते आणि वृक्क गाळू शकते, पण कोणीही दुसऱ्याला खाऊ घालू शकत नाही ना स्वतःला; त्यांच्यावरची पातळी ती जिथे अवयवांचा संच असा मांडलेला की एक आपले उत्पादन पुढच्याला देतो. हे काय?",
        },
        statement: {
          en: "An organ system is a set of organs whose functions are linked in sequence, so the level of organisation runs cell, tissue, organ, organ system, organism, each level doing what the one below cannot.",
          hi: "अंग-तंत्र अंगों का ऐसा समुच्चय है जिनके कार्य क्रम में जुड़े हों, अतः संगठन का स्तर चलता है कोशिका, ऊतक, अंग, अंग-तंत्र, जीव, और हर स्तर वह करता है जो उससे नीचे वाला नहीं कर सकता।",
          mr: "अवयवसंस्था म्हणजे अशा अवयवांचा संच ज्यांची कार्ये क्रमाने जोडलेली, म्हणून संघटनाची पातळी चालते पेशी, ऊती, अवयव, अवयवसंस्था, सजीव, आणि प्रत्येक पातळी ते करते जे तिच्या खालची करू शकत नाही.",
        },
        detail: {
          en: "The jump that matters is organ to system: a system can regulate itself, because one organ's output is another's input and the loop can be corrected.",
          hi: "जो छलाँग मायने रखती है वह अंग से तंत्र की है: तंत्र स्वयं को नियंत्रित कर सकता है, क्योंकि एक अंग का उत्पाद दूसरे का निवेश है और वह चक्र सुधारा जा सकता है।",
          mr: "महत्त्वाची झेप अवयवाकडून संस्थेकडे: संस्था स्वतःचे नियमन करू शकते, कारण एका अवयवाचे उत्पादन दुसऱ्याचे निविष्ट आहे आणि तो फेरा दुरुस्त करता येतो.",
        },
        extra: {
          en: "Sponges never made that jump: they have cells with jobs but no true tissues, and everything they do happens at the level of a single cell.",
          hi: "स्पंजों ने वह छलाँग कभी नहीं लगाई: उनमें काम वाली कोशिकाएँ हैं पर असली ऊतक नहीं, और वे जो कुछ करते हैं वह एक अकेली कोशिका के स्तर पर होता है।",
          mr: "स्पंजांनी ती झेप कधीच घेतली नाही: त्यांच्यात कामे असलेल्या पेशी आहेत पण खऱ्या ऊती नाहीत, आणि ते जे काही करतात ते एकाच पेशीच्या पातळीवर घडते.",
        },
        pair: {
          left: {
            en: "A sponge does everything one cell at a time",
            hi: "स्पंज सब कुछ एक-एक कोशिका करके करता है",
            mr: "स्पंज सर्व काही एकेका पेशीने करतो",
          },
          right: {
            en: "when organs stop working alone",
            hi: "जब अंग अकेले काम करना छोड़ देते हैं",
            mr: "जेव्हा अवयव एकटे काम करणे थांबवतात",
          },
        },
      },
      /*F7B*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student says a cockroach's open circulation is a poor version of ours, and that this is why insects stay small. Assess the first claim and correct the reasoning behind the second.",
          hi: "एक विद्यार्थी कहता है कि तिलचट्टे का खुला परिसंचरण हमारे वाले का घटिया संस्करण है, और इसीलिए कीट छोटे रहते हैं। पहले दावे का आकलन करो और दूसरे के पीछे के तर्क को सुधारो।",
          mr: "एक विद्यार्थी म्हणतो की झुरळाचे उघडे अभिसरण हे आपल्याचे निकृष्ट रूप आहे, आणि म्हणूनच कीटक लहान राहतात. पहिल्या दाव्याचे मूल्यमापन करा आणि दुसऱ्यामागचा युक्तिवाद दुरुस्त करा.",
        },
        choices: [
          {
            en: "The first claim misreads what the system is for. A cockroach's blood carries hardly any oxygen: air reaches its tissues directly through tracheae, tubes that open at spiracles and branch until they end AT the cells. So the circulation only has to distribute food, hormones and waste, and for that a slow open system is adequate rather than deficient. The size limit is real but belongs to the TRACHEAE, not the blood — a tube delivering oxygen by diffusion works over short distances only, and beyond a few centimetres the innermost tissues cannot be supplied",
            hi: "पहला दावा ग़लत पढ़ता है कि तंत्र है किसलिए। तिलचट्टे का रुधिर मुश्किल से कोई ऑक्सीजन ढोता है: हवा उसके ऊतकों तक श्वासनलियों से सीधे पहुँचती है, ऐसी नलियाँ जो श्वास-रंध्रों पर खुलती हैं और शाखित होते-होते कोशिकाओं पर ही समाप्त होती हैं। अतः परिसंचरण को केवल भोजन, हार्मोन और अपशिष्ट बाँटने हैं, और उसके लिए धीमा खुला तंत्र अपर्याप्त नहीं, पर्याप्त है। आकार की सीमा असली है पर वह श्वासनलियों की है, रुधिर की नहीं — विसरण से ऑक्सीजन पहुँचाती नली केवल छोटी दूरियों पर चलती है, और कुछ सेंटीमीटर से आगे भीतरतम ऊतकों तक आपूर्ति हो ही नहीं सकती",
            mr: "पहिला दावा संस्था कशासाठी आहे ते चुकीचे वाचतो. झुरळाचे रक्त जेमतेम ऑक्सिजन वाहते: हवा त्याच्या ऊतींपर्यंत श्वासनलिकांतून थेट पोहोचते, अशा नळ्या ज्या श्वासरंध्रांवर उघडतात आणि शाखा होत होत पेशींपाशीच संपतात. म्हणून अभिसरणाला केवळ अन्न, संप्रेरके आणि टाकाऊ वाटायचे आहेत, आणि त्यासाठी मंद उघडी संस्था अपुरी नव्हे, पुरेशी आहे. आकाराची मर्यादा खरी आहे पण ती श्वासनलिकांची, रक्ताची नव्हे — विसरणाने ऑक्सिजन पोहोचवणारी नळी केवळ लहान अंतरांवर चालते, आणि काही सेंटिमीटरपलीकडे आतल्या ऊतींपर्यंत पुरवठा होऊच शकत नाही",
          },
          {
            en: "The student is right on both counts: open circulation delivers oxygen badly, and that alone is what caps insect size",
            hi: "विद्यार्थी दोनों बातों में सही है: खुला परिसंचरण ऑक्सीजन बुरी तरह पहुँचाता है, और अकेली वही बात कीट के आकार की सीमा तय करती है",
            mr: "विद्यार्थी दोन्ही बाबतीत बरोबर: उघडे अभिसरण ऑक्सिजन वाईटरीत्या पोहोचवते, आणि तेच एकटे कीटकाच्या आकाराची मर्यादा ठरवते",
          },
          {
            en: "Both claims fail because a cockroach has no circulation at all — the tracheae carry everything, food and oxygen alike",
            hi: "दोनों दावे विफल हैं क्योंकि तिलचट्टे में परिसंचरण है ही नहीं — श्वासनलियाँ सब कुछ ढोती हैं, भोजन और ऑक्सीजन दोनों",
            mr: "दोन्ही दावे अपयशी कारण झुरळात अभिसरणच नाही — श्वासनलिका सर्व काही वाहतात, अन्न आणि ऑक्सिजन दोन्ही",
          },
          {
            en: "The first claim holds and the second fails, because insect size is limited by the exoskeleton having to be moulted rather than by any transport system",
            hi: "पहला दावा टिकता है और दूसरा विफल है, क्योंकि कीट का आकार किसी परिवहन तंत्र से नहीं, बाह्यकंकाल को निर्मोचित करना पड़ने से सीमित है",
            mr: "पहिला दावा टिकतो आणि दुसरा अपयशी, कारण कीटकाचा आकार कोणत्याही वहनसंस्थेने नव्हे, बाह्यसांगाडा कात टाकावा लागतो त्याने मर्यादित",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Two errors, and they are the same error in different places: judging a system by what OUR version of it does. Take the circulation first. In a vertebrate, blood is the oxygen delivery service, so a slow, low-pressure, undirected flow would indeed be a catastrophe — a heart cannot send more blood to a working muscle if it cannot aim it, and an animal that could not raise the supply to its legs could not run. Every complaint against open circulation assumes that job. A cockroach has given that job to something else entirely. Air enters through spiracles along its sides, travels down tracheae, and those tracheae branch and branch again into tracheoles fine enough to end against individual cells — often INSIDE the muscle fibres of the flight muscles, where the demand is highest. Oxygen therefore never enters the blood at all; it arrives as gas, by diffusion, at its point of use. What is left for the haemolymph to do is carry nutrients from the gut, hormones from the glands, and waste to the excretory tubules — errands with no deadline. For those, sloshing slowly through a body cavity is not a compromise; it is enough, and it is cheaper than plumbing. Now the size limit, which is real and which the student attributes to the wrong organ. Diffusion is quick over micrometres and hopeless over centimetres — the time it takes rises with the SQUARE of the distance. A tracheal tube can supply tissue a few millimetres away readily and a few centimetres away barely. Push the body plan bigger and the innermost tissues suffocate no matter how many spiracles are added, because the limit is in the physics of the delivery, not the number of doors. That is why the largest insects are a few centimetres of body, and why the dragonflies of the Carboniferous — with wingspans of seventy centimetres — lived when the atmosphere held about 35 per cent oxygen instead of 21, which steepened the gradient and pushed diffusion further. The general point is worth keeping. Comparing two animals organ by organ produces nonsense unless you ask first what each organ is FOR in that animal. An insect's blood is not bad at carrying oxygen; it is not asked to. And an animal is not primitive for solving a problem differently — it is primitive only if the solution costs it something the alternative would not, which here is size and nothing else. (The second answer accepts both mistakes; the third denies a circulation the cockroach demonstrably has, complete with a dorsal heart; and the fourth names moulting, which does constrain arthropods but is not what stops oxygen reaching a deep tissue.)",
          hi: "दो भूलें, और वे भिन्न जगहों पर वही एक भूल हैं: किसी तंत्र को इससे आँकना कि उसका हमारा संस्करण क्या करता है। पहले परिसंचरण लो। कशेरुकी में रुधिर ही ऑक्सीजन-वितरण सेवा है, अतः धीमा, कम-दाब वाला, बिना दिशा का प्रवाह सचमुच विपत्ति होता — हृदय काम करती पेशी को अधिक रुधिर नहीं भेज सकता यदि वह निशाना न साध सके, और जो प्राणी अपनी टाँगों तक आपूर्ति न बढ़ा सके वह दौड़ नहीं सकता। खुले परिसंचरण के विरुद्ध हर शिकायत वही काम मान लेती है। तिलचट्टे ने वह काम किसी और को ही सौंप दिया है। हवा उसके पार्श्वों के श्वास-रंध्रों से भीतर आती है, श्वासनलियों से नीचे जाती है, और वे श्वासनलियाँ शाखित होते-होते इतनी महीन श्वासनलिकाओं में बँटती हैं कि अलग-अलग कोशिकाओं से सटकर समाप्त हों — प्रायः उड़ान-पेशियों के तंतुओं के भीतर ही, जहाँ माँग सबसे अधिक है। अतः ऑक्सीजन रुधिर में प्रवेश करती ही नहीं; वह गैस के रूप में, विसरण से, अपने उपयोग-स्थल पर पहुँचती है। रुधिर-लसीका के लिए जो बचता है वह है आँत से पोषक तत्व, ग्रंथियों से हार्मोन और उत्सर्जी नलिकाओं तक अपशिष्ट ढोना — ऐसे काम जिनकी कोई समय-सीमा नहीं। उनके लिए शरीर-गुहा में धीरे छलकना समझौता नहीं; वह पर्याप्त है, और नलसाज़ी से सस्ता। अब आकार की सीमा, जो असली है और जिसे विद्यार्थी ग़लत अंग को सौंपता है। विसरण माइक्रोमीटर पर तेज़ और सेंटीमीटर पर निराशाजनक है — लगने वाला समय दूरी के वर्ग के साथ बढ़ता है। श्वासनली कुछ मिलीमीटर दूर के ऊतक को सहज और कुछ सेंटीमीटर दूर के को मुश्किल से आपूर्ति दे सकती है। शरीर-योजना बड़ी करो और भीतरतम ऊतक दम तोड़ देते हैं चाहे कितने भी श्वास-रंध्र जोड़ दो, क्योंकि सीमा वितरण की भौतिकी में है, दरवाज़ों की संख्या में नहीं। इसीलिए सबसे बड़े कीट कुछ सेंटीमीटर शरीर के हैं, और इसीलिए कार्बनी युग के व्याध-पतंग — सत्तर सेंटीमीटर के पंख-विस्तार वाले — तब जिए जब वायुमंडल में 21 के बजाय लगभग 35 प्रतिशत ऑक्सीजन थी, जिसने प्रवणता तीखी की और विसरण को आगे धकेला। सामान्य बात रखने योग्य है। दो प्राणियों की अंग-दर-अंग तुलना बकवास पैदा करती है जब तक पहले यह न पूछा जाए कि उस प्राणी में हर अंग किसलिए है। कीट का रुधिर ऑक्सीजन ढोने में बुरा नहीं; उससे वह माँगा ही नहीं जाता। और कोई प्राणी समस्या भिन्न ढंग से हल करने से आदिम नहीं होता — वह तभी आदिम है जब समाधान उसे कुछ ऐसा चुकाए जो विकल्प न चुकाता, और यहाँ वह आकार है और कुछ नहीं। (दूसरा उत्तर दोनों भूलें स्वीकार कर लेता है; तीसरा उस परिसंचरण से इनकार करता है जो तिलचट्टे में प्रत्यक्षतः है, पृष्ठीय हृदय सहित; और चौथा निर्मोचन का नाम लेता है, जो आर्थ्रोपोडों को बाँधता तो है पर गहरे ऊतक तक ऑक्सीजन पहुँचने से नहीं रोकता।)",
          mr: "दोन चुका, आणि त्या वेगळ्या जागी तीच एक चूक आहेत: एखाद्या संस्थेला तिचे आपले रूप काय करते यावरून जोखणे. आधी अभिसरण घ्या. पृष्ठवंशीयात रक्तच ऑक्सिजन-वितरण सेवा आहे, म्हणून मंद, कमी-दाबाचा, दिशाहीन प्रवाह खरोखर आपत्ती ठरला असता — हृदय काम करणाऱ्या स्नायूला अधिक रक्त पाठवू शकत नाही जर ते नेम धरू शकत नसेल, आणि जो प्राणी आपल्या पायांपर्यंत पुरवठा वाढवू शकत नाही तो धावू शकत नाही. उघड्या अभिसरणाविरुद्धची प्रत्येक तक्रार तेच काम गृहीत धरते. झुरळाने ते काम पूर्णपणे दुसऱ्याकडे सोपवले आहे. हवा त्याच्या बाजूंच्या श्वासरंध्रांतून आत येते, श्वासनलिकांतून खाली जाते, आणि त्या श्वासनलिका शाखा होत होत इतक्या बारीक उपनलिकांत विभागतात की वेगवेगळ्या पेशींना टेकून संपाव्यात — बहुधा उड्डाण-स्नायूंच्या तंतूंच्या आतच, जिथे मागणी सर्वाधिक. म्हणून ऑक्सिजन रक्तात प्रवेशच करत नाही; तो वायूच्या रूपात, विसरणाने, आपल्या वापराच्या ठिकाणी पोहोचतो. रक्तलसिकेसाठी जे उरते ते म्हणजे आतड्यातून पोषकद्रव्ये, ग्रंथींतून संप्रेरके आणि उत्सर्जी नलिकांपर्यंत टाकाऊ वाहणे — ज्यांना कोणतीही मुदत नाही अशी कामे. त्यांच्यासाठी शरीरपोकळीत सावकाश हेलकावणे ही तडजोड नव्हे; ते पुरेसे आहे, आणि नळकामाहून स्वस्त. आता आकाराची मर्यादा, जी खरी आहे आणि जिचे श्रेय विद्यार्थी चुकीच्या अवयवाला देतो. विसरण मायक्रोमीटरवर जलद आणि सेंटिमीटरवर निराशाजनक — लागणारा वेळ अंतराच्या वर्गासोबत वाढतो. श्वासनलिका काही मिलिमीटर दूरच्या ऊतीला सहज आणि काही सेंटिमीटर दूरच्याला जेमतेम पुरवठा देऊ शकते. शरीर-आराखडा मोठा करा आणि आतल्या ऊती गुदमरतात, कितीही श्वासरंध्रे जोडा, कारण मर्यादा वितरणाच्या भौतिकीत आहे, दारांच्या संख्येत नाही. म्हणूनच सर्वांत मोठे कीटक काही सेंटिमीटर शरीराचे आहेत, आणि म्हणूनच कार्बनी युगातले चतुर — सत्तर सेंटिमीटर पंखविस्ताराचे — तेव्हा जगले जेव्हा वातावरणात 21 ऐवजी सुमारे 35 टक्के ऑक्सिजन होता, ज्याने उतार तीव्र केला आणि विसरण पुढे ढकलले. सामान्य मुद्दा ठेवण्याजोगा. दोन प्राण्यांची अवयव-दर-अवयव तुलना निरर्थकता निर्माण करते जोवर आधी विचारले जात नाही की त्या प्राण्यात प्रत्येक अवयव कशासाठी आहे. कीटकाचे रक्त ऑक्सिजन वाहण्यात वाईट नाही; त्याच्याकडून ते मागितलेच जात नाही. आणि कोणताही प्राणी समस्या वेगळ्या पद्धतीने सोडवल्याने आदिम ठरत नाही — तो तेव्हाच आदिम जेव्हा उपाय त्याला असे काही मोजायला लावतो जे पर्यायाने लावले नसते, आणि इथे ते आकार आहे आणि दुसरे काही नाही. (दुसरे उत्तर दोन्ही चुका स्वीकारते; तिसरे झुरळात प्रत्यक्षात असलेले अभिसरण नाकारते, पृष्ठीय हृदयासह; आणि चौथे कात टाकण्याचे नाव घेते, जे आर्थ्रोपोडांना बांधते खरे पण खोलच्या ऊतीपर्यंत ऑक्सिजन पोहोचण्यापासून रोखत नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A frog kept in a dry terrarium dies within a day although it has food, water in a bowl and air. Explain what killed it, and why the same conditions are harmless to a lizard of the same size.",
          hi: "सूखे टेरेरियम में रखा मेंढक एक दिन के भीतर मर जाता है यद्यपि उसके पास भोजन, कटोरे में पानी और हवा है। बताओ उसे मारा क्या, और वही परिस्थितियाँ उसी आकार की छिपकली के लिए हानिरहित क्यों हैं।",
          mr: "कोरड्या टेरेरियममध्ये ठेवलेला बेडूक दिवसाभरात मरतो जरी त्याच्याकडे अन्न, वाडग्यात पाणी आणि हवा आहे. त्याला काय मारले, आणि त्याच परिस्थिती त्याच आकाराच्या सरड्याला निरुपद्रवी का, ते समजावा.",
        },
        choices: [
          {
            en: "The frog's skin is a respiratory organ, and a respiratory surface must be thin, permeable and wet for gases to dissolve and diffuse across it. Those same three properties make it useless at holding water in, so in dry air the frog loses water through its whole body surface far faster than it can drink, and the skin dries past the point where gas exchange works. A lizard solved the problem the other way: a thick, keratinised, scaly skin that breathes not at all and leaks almost nothing, with lungs doing the whole job behind it",
            hi: "मेंढक की त्वचा श्वसन-अंग है, और श्वसन-सतह को पतला, पारगम्य और गीला होना ही पड़ता है ताकि गैसें घुलकर उसके पार विसरित हो सकें। वही तीन गुण उसे पानी भीतर रोकने में बेकार बना देते हैं, अतः सूखी हवा में मेंढक अपनी पूरी शरीर-सतह से पानी उससे कहीं तेज़ खोता है जितना पी सकता है, और त्वचा उस बिंदु से आगे सूख जाती है जहाँ गैस-विनिमय चलता है। छिपकली ने समस्या दूसरी ओर से हल की: मोटी, कीरेटिनयुक्त, शल्कदार त्वचा जो साँस बिलकुल नहीं लेती और लगभग कुछ नहीं रिसने देती, और उसके पीछे पूरा काम फेफड़े करते हैं",
            mr: "बेडकाची त्वचा हा श्वसन-अवयव आहे, आणि श्वसन-पृष्ठभाग पातळ, पार्य आणि ओला असावाच लागतो जेणेकरून वायू विरघळून त्यातून विसरू शकतील. तेच तीन गुणधर्म तिला पाणी आत ठेवण्यात निरुपयोगी करतात, म्हणून कोरड्या हवेत बेडूक आपल्या अख्ख्या शरीरपृष्ठातून पाणी पिऊ शकेल त्याहून कितीतरी वेगाने गमावतो, आणि त्वचा वायुविनिमय चालतो त्या बिंदूपलीकडे वाळते. सरड्याने समस्या दुसऱ्या बाजूने सोडवली: जाड, केराटिनयुक्त, खवलेदार त्वचा जी श्वासच घेत नाही आणि जवळपास काहीच गळू देत नाही, आणि तिच्यामागे अख्खे काम फुफ्फुसे करतात",
          },
          {
            en: "The frog died of thirst: an amphibian must drink far more than a reptile, and a single bowl cannot supply it",
            hi: "मेंढक प्यास से मरा: उभयचर को सरीसृप से कहीं अधिक पीना पड़ता है, और एक कटोरा उसे नहीं दे सकता",
            mr: "बेडूक तहानेने मेला: उभयचराला सरपटणाऱ्याहून कितीतरी अधिक प्यावे लागते, आणि एक वाडगा त्याला पुरवू शकत नाही",
          },
          {
            en: "The frog died because amphibians have no lungs at all and depend entirely on their skin, while reptiles have lungs",
            hi: "मेंढक इसलिए मरा कि उभयचरों में फेफड़े होते ही नहीं और वे पूरी तरह त्वचा पर निर्भर हैं, जबकि सरीसृपों में फेफड़े हैं",
            mr: "बेडूक यासाठी मेला की उभयचरांना फुफ्फुसेच नसतात आणि ते पूर्णपणे त्वचेवर अवलंबून, तर सरपटणाऱ्यांना फुफ्फुसे आहेत",
          },
          {
            en: "The frog died of overheating: wet skin cools by evaporation, and in dry air that cooling runs away with the animal's body temperature",
            hi: "मेंढक अत्यधिक ठंडक से मरा: गीली त्वचा वाष्पीकरण से ठंडी होती है, और सूखी हवा में वह ठंडक प्राणी के शरीर-ताप को ले भागती है",
            mr: "बेडूक अतिथंडाव्याने मेला: ओली त्वचा बाष्पीभवनाने थंड होते, आणि कोरड्या हवेत तो थंडावा प्राण्याचे शरीरतापमान घेऊन पळतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The answer is a single trade-off, and both animals are on it — at opposite ends. Any surface used for gas exchange has to obey the same physics. Oxygen and carbon dioxide cross a membrane only when dissolved, so the surface must be WET. Diffusion is hopeless over distance, so it must be THIN. And it must be PERMEABLE, or nothing crosses at all. Those three requirements are not negotiable and they are not separable — they come as a set. Now notice what a surface with all three cannot do: it cannot hold water in. Every property that lets oxygen through lets water out, because both are small molecules crossing the same barrier by the same route. So an animal that breathes through its skin is, by construction, an animal that evaporates through its skin. Put that frog in dry air and two clocks start. Water leaves the whole body surface continuously — a frog's rate of loss through skin approaches that of an open dish of water, because that is very nearly what the skin is. Drinking cannot keep up, and in any case a frog absorbs water through a patch of skin rather than by swallowing, which needs contact with wet ground and not a bowl. As the skin dries, the second clock runs out first: the mucus layer goes, gases stop dissolving, cutaneous respiration fails, and the lungs — which are small, simple sacs adequate only as a partner to the skin — cannot make up the difference. The animal dies of a respiratory failure that looks like dehydration. The lizard took the opposite branch, and paid a different price. Its skin is thick, scaly and keratinised: waterproof, and therefore useless for breathing. So the lungs had to become the whole answer — larger, more folded, ventilated by ribs rather than by the throat-pumping a frog uses. Having done that, the reptile could leave water entirely, which is exactly what happened: reptiles colonised deserts, amphibians never did, and the amphibian is still tied to damp shade three hundred million years later. The shape of this argument recurs everywhere in the chapter and beyond. A structure optimised for one job is usually thereby disqualified from its opposite, and evolution does not get to have both. A thin surface exchanges and leaks; a thick one protects and suffocates. Asking which is better is asking the wrong question — the right one is which problem the animal's habitat makes urgent, and the answer explains where you find it. (The second answer stops at thirst, which is a symptom rather than the mechanism; the third states something false, since frogs have lungs and use them on land; and the fourth inverts the thermal argument — evaporation is a real cost but a frog in a dry terrarium dies of drying, not of cold.)",
          hi: "उत्तर एक ही सौदा है, और दोनों प्राणी उसी पर हैं — विपरीत सिरों पर। गैस-विनिमय को बरती जाने वाली किसी भी सतह को वही भौतिकी माननी पड़ती है। ऑक्सीजन और कार्बन डाइऑक्साइड झिल्ली के पार तभी जाते हैं जब घुले हों, अतः सतह गीली होनी चाहिए। दूरी पर विसरण निराशाजनक है, अतः वह पतली होनी चाहिए। और वह पारगम्य होनी चाहिए, वरना कुछ पार जाएगा ही नहीं। ये तीनों आवश्यकताएँ सौदेबाज़ी योग्य नहीं और अलग की जाने योग्य भी नहीं — वे एक समुच्चय में आती हैं। अब ध्यान दो कि तीनों वाली सतह क्या नहीं कर सकती: वह पानी भीतर नहीं रोक सकती। जो भी गुण ऑक्सीजन को भीतर आने देता है वही पानी को बाहर जाने देता है, क्योंकि दोनों छोटे अणु हैं जो उसी अवरोध को उसी मार्ग से पार करते हैं। अतः जो प्राणी त्वचा से साँस लेता है वह रचना से ही ऐसा प्राणी है जो त्वचा से वाष्पित होता है। उस मेंढक को सूखी हवा में रखो और दो घड़ियाँ चल पड़ती हैं। पानी पूरी शरीर-सतह से लगातार जाता है — मेंढक की त्वचा से हानि की दर खुले पानी के बर्तन के पास पहुँचती है, क्योंकि त्वचा लगभग वही है। पीना साथ नहीं दे सकता, और वैसे भी मेंढक पानी निगलकर नहीं, त्वचा के एक टुकड़े से सोखकर लेता है, जिसके लिए गीली ज़मीन का स्पर्श चाहिए, कटोरा नहीं। त्वचा सूखते ही दूसरी घड़ी पहले चुक जाती है: श्लेष्म की परत जाती है, गैसें घुलना बंद कर देती हैं, त्वचीय श्वसन विफल हो जाता है, और फेफड़े — जो छोटे, सरल थैले हैं और केवल त्वचा के साथी के रूप में पर्याप्त — अंतर नहीं पाट सकते। प्राणी श्वसन-विफलता से मरता है जो निर्जलीकरण जैसी दिखती है। छिपकली ने उलटी शाखा ली, और भिन्न क़ीमत चुकाई। उसकी त्वचा मोटी, शल्कदार और कीरेटिनयुक्त है: जल-रोधी, और इसलिए साँस लेने में बेकार। अतः फेफड़ों को पूरा उत्तर बनना पड़ा — बड़े, अधिक मुड़े हुए, पसलियों से हवादार, न कि मेंढक वाले गले के पंप से। ऐसा कर लेने पर सरीसृप पानी पूरी तरह छोड़ सका, और ठीक यही हुआ: सरीसृपों ने मरुस्थल बसाए, उभयचरों ने कभी नहीं, और तीस करोड़ वर्ष बाद भी उभयचर नम छाया से बँधा है। इस तर्क का आकार अध्याय में और उससे आगे हर जगह लौटता है। एक काम के लिए अनुकूलित रचना प्रायः उसी से अपने उलटे काम के लिए अयोग्य हो जाती है, और विकास को दोनों नहीं मिलते। पतली सतह विनिमय करती है और रिसती है; मोटी रक्षा करती है और दम घोंटती है। कौन-सी बेहतर है यह पूछना ग़लत प्रश्न पूछना है — सही प्रश्न यह है कि प्राणी का आवास किस समस्या को अत्यावश्यक बनाता है, और उत्तर बता देता है कि वह मिलेगा कहाँ। (दूसरा उत्तर प्यास पर रुक जाता है, जो क्रियाविधि नहीं लक्षण है; तीसरा झूठ कहता है, क्योंकि मेंढकों में फेफड़े हैं और वे थल पर उन्हें बरतते हैं; और चौथा तापीय तर्क उलट देता है — वाष्पीकरण असली क़ीमत है पर सूखे टेरेरियम में मेंढक सूखने से मरता है, ठंड से नहीं।)",
          mr: "उत्तर एकच तडजोड आहे, आणि दोन्ही प्राणी तिच्यावरच आहेत — विरुद्ध टोकांना. वायुविनिमयासाठी वापरल्या जाणाऱ्या कोणत्याही पृष्ठभागाला तीच भौतिकी पाळावी लागते. ऑक्सिजन आणि कार्बन डायऑक्साइड पटलापलीकडे तेव्हाच जातात जेव्हा विरघळलेले असतील, म्हणून पृष्ठभाग ओला असावा. अंतरावर विसरण निराशाजनक, म्हणून तो पातळ असावा. आणि तो पार्य असावा, नाहीतर काहीच पार जाणार नाही. या तिन्ही गरजा तडजोडयोग्य नाहीत आणि वेगळ्या करण्याजोग्याही नाहीत — त्या एका संचात येतात. आता लक्षात घ्या की तिन्ही असलेला पृष्ठभाग काय करू शकत नाही: तो पाणी आत ठेवू शकत नाही. जो गुणधर्म ऑक्सिजनला आत येऊ देतो तोच पाण्याला बाहेर जाऊ देतो, कारण दोन्ही लहान रेणू जे त्याच अडथळ्याला त्याच मार्गाने ओलांडतात. म्हणून जो प्राणी त्वचेने श्वास घेतो तो रचनेनेच असा प्राणी आहे जो त्वचेतून बाष्पीभूत होतो. त्या बेडकाला कोरड्या हवेत ठेवा आणि दोन घड्याळे सुरू होतात. पाणी अख्ख्या शरीरपृष्ठातून सतत जाते — बेडकाच्या त्वचेतून होणाऱ्या हानीचा दर उघड्या पाण्याच्या भांड्याजवळ पोहोचतो, कारण त्वचा जवळपास तेच आहे. पिणे साथ देऊ शकत नाही, आणि तसेही बेडूक पाणी गिळून नव्हे, त्वचेच्या एका ठिपक्यातून शोषून घेतो, ज्यासाठी ओल्या जमिनीचा स्पर्श लागतो, वाडगा नव्हे. त्वचा वाळताच दुसरे घड्याळ आधी संपते: श्लेष्माचा थर जातो, वायू विरघळणे थांबतात, त्वचीय श्वसन अपयशी ठरते, आणि फुफ्फुसे — जी लहान, साध्या पिशव्या आणि केवळ त्वचेची जोडीदार म्हणून पुरेशी — फरक भरून काढू शकत नाहीत. प्राणी श्वसन-अपयशाने मरतो जे निर्जलीकरणासारखे दिसते. सरड्याने उलटी फांदी घेतली, आणि वेगळी किंमत मोजली. त्याची त्वचा जाड, खवलेदार आणि केराटिनयुक्त: जलरोधक, आणि म्हणून श्वासासाठी निरुपयोगी. म्हणून फुफ्फुसांना अख्खे उत्तर बनावे लागले — मोठी, अधिक घड्या असलेली, बरगड्यांनी हवा भरली जाणारी, बेडूक वापरतो त्या घशाच्या पंपाने नव्हे. एवढे केल्यावर सरपटणारा प्राणी पाणी पूर्णपणे सोडू शकला, आणि नेमके तेच घडले: सरपटणाऱ्यांनी वाळवंटे वसवली, उभयचरांनी कधीच नाही, आणि तीस कोटी वर्षांनंतरही उभयचर ओलसर सावलीशी बांधलेला. या युक्तिवादाचा आकार प्रकरणात आणि त्यापलीकडे सर्वत्र परततो. एका कामासाठी अनुकूलित रचना बहुधा त्यामुळेच आपल्या उलट कामासाठी अपात्र ठरते, आणि उत्क्रांतीला दोन्ही मिळत नाहीत. पातळ पृष्ठभाग देवाणघेवाण करतो आणि गळतो; जाड संरक्षण देतो आणि गुदमरवतो. कोणता चांगला हे विचारणे म्हणजे चुकीचा प्रश्न विचारणे — बरोबर प्रश्न असा की प्राण्याचा अधिवास कोणती समस्या तातडीची करतो, आणि उत्तर सांगते की तो कुठे सापडेल. (दुसरे उत्तर तहानेवर थांबते, जे कार्यपद्धती नव्हे लक्षण; तिसरे खोटे सांगते, कारण बेडकांना फुफ्फुसे आहेत आणि ते जमिनीवर ती वापरतात; आणि चौथे औष्णिक युक्तिवाद उलटवते — बाष्पीभवन ही खरी किंमत आहे पण कोरड्या टेरेरियममध्ये बेडूक वाळून मरतो, थंडीने नाही.)",
        },
      },
      /*H7B*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 8 — Cell: The Unit of Life                                      */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-11-cell-the-unit-of-life",
    subject: "BIOLOGY",
    classLevel: 11,
    chapter: {
      en: "Chapter 8 — Cell: The Unit of Life",
      hi: "अध्याय 8 — कोशिका: जीवन की इकाई",
      mr: "प्रकरण 8 — पेशी: जीवनाचे एकक",
    },
    name: {
      en: "Cell: The Unit of Life",
      hi: "कोशिका: जीवन की इकाई",
      mr: "पेशी: जीवनाचे एकक",
    },
    summary: {
      en: "One sentence — every cell comes from a cell — ended two thousand years of believing life could start in mud, and everything else in the chapter follows from what a cell has to be to make that true: a boundary that decides rather than merely divides, a size limit set by geometry alone, two organelles that still carry instructions of their own, and a machine whose size gives away which kingdom the cell belongs to.",
      hi: "एक वाक्य — हर कोशिका किसी कोशिका से आती है — ने दो हज़ार वर्षों की इस मान्यता का अंत कर दिया कि जीवन कीचड़ में शुरू हो सकता है, और अध्याय का बाक़ी सब इससे निकलता है कि उसे सच करने के लिए कोशिका को होना क्या पड़ता है: ऐसी सीमा जो केवल बाँटती नहीं, तय करती है, अकेली ज्यामिति से बँधी आकार-सीमा, दो कोशिकांग जो अब भी अपने निर्देश ढोते हैं, और वह मशीन जिसका आकार बता देता है कि कोशिका किस जगत की है।",
      mr: "एक वाक्य — प्रत्येक पेशी कोणत्यातरी पेशीतून येते — याने दोन हजार वर्षांचा हा समज संपवला की जीवन चिखलात सुरू होऊ शकते, आणि प्रकरणातले बाकी सर्व यातून निघते की ते खरे करण्यासाठी पेशीला काय असावे लागते: केवळ विभागत नाही तर ठरवते अशी सीमा, एकट्या भूमितीने बांधलेली आकारमर्यादा, अजूनही स्वतःच्या सूचना वाहणारी दोन पेशीअंगे, आणि ते यंत्र ज्याचा आकार सांगतो की पेशी कोणत्या सृष्टीची.",
    },
    position: 8,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "the-sentence-that-ended-spontaneous-generation",
        name: {
          en: "The sentence that ended life from mud",
          hi: "वह वाक्य जिसने कीचड़ से जीवन का अंत किया",
          mr: "चिखलातून जीवन संपवणारे ते वाक्य",
        },
        kind: "principle",
        prompt: {
          en: "For two thousand years maggots were thought to arise from meat and mice from grain, and one three-word Latin claim about where a cell comes from made every one of those explanations impossible. What is it?",
          hi: "दो हज़ार वर्ष तक माना गया कि कीड़े माँस से और चूहे अनाज से उपजते हैं, और कोशिका कहाँ से आती है इस पर तीन लैटिन शब्दों के एक दावे ने उन सब व्याख्याओं को असंभव कर दिया। वह क्या है?",
          mr: "दोन हजार वर्षे मानले गेले की अळ्या मांसातून आणि उंदीर धान्यातून उपजतात, आणि पेशी कुठून येते याबद्दलच्या तीन लॅटिन शब्दांच्या एका दाव्याने त्या सर्व स्पष्टीकरणांना अशक्य केले. ते काय?",
        },
        statement: {
          en: "The cell theory holds that every living thing is made of cells, that the cell is the basic unit of life, and — Virchow's addition — that every cell arises only from a pre-existing cell.",
          hi: "कोशिका सिद्धांत कहता है कि हर सजीव कोशिकाओं से बना है, कि कोशिका जीवन की मूल इकाई है, और — विरचो का जोड़ — कि हर कोशिका केवल पहले से मौजूद किसी कोशिका से उत्पन्न होती है।",
          mr: "पेशी सिद्धांत सांगतो की प्रत्येक सजीव पेशींनी बनलेला आहे, की पेशी हे जीवनाचे मूलभूत एकक आहे, आणि — विर्खोची भर — की प्रत्येक पेशी केवळ आधीपासून असलेल्या पेशीतूनच उत्पन्न होते.",
        },
        detail: {
          en: "The third clause is the one that did the work: it makes an unbroken chain of cells reaching back from you to the first one, with no gap anywhere for a fresh start.",
          hi: "काम तीसरे खंड ने किया: वह तुमसे लेकर पहली कोशिका तक कोशिकाओं की अटूट शृंखला बना देता है, जिसमें कहीं भी नई शुरुआत के लिए दरार नहीं।",
          mr: "काम तिसऱ्या खंडाने केले: तो तुमच्यापासून पहिल्या पेशीपर्यंत पेशींची अखंड साखळी बनवतो, जिच्यात कुठेही नव्या सुरुवातीसाठी फट नाही.",
        },
        extra: {
          en: "Viruses are the standing exception, which is why they are placed outside the theory rather than inside it — they are made and copied by cells rather than being cells.",
          hi: "विषाणु स्थायी अपवाद हैं, इसीलिए उन्हें सिद्धांत के भीतर नहीं, बाहर रखा जाता है — वे कोशिकाएँ हैं नहीं, कोशिकाओं द्वारा बनाए और नकल किए जाते हैं।",
          mr: "विषाणू हे कायमचे अपवाद, म्हणूनच त्यांना सिद्धांताच्या आत नव्हे, बाहेर ठेवले जाते — ते पेशी नाहीत, पेशींकडून बनवले आणि नक्कल केले जातात.",
        },
        pair: {
          left: {
            en: "An unbroken chain back to the first cell",
            hi: "पहली कोशिका तक अटूट शृंखला",
            mr: "पहिल्या पेशीपर्यंत अखंड साखळी",
          },
          right: {
            en: "the sentence that ended life from mud",
            hi: "वह वाक्य जिसने कीचड़ से जीवन का अंत किया",
            mr: "चिखलातून जीवन संपवणारे ते वाक्य",
          },
        },
      },
      {
        id: "a-boundary-that-decides",
        name: {
          en: "A boundary that decides rather than divides",
          hi: "वह सीमा जो बाँटती नहीं, तय करती है",
          mr: "विभागत नाही तर ठरवते अशी सीमा",
        },
        kind: "structure",
        prompt: {
          en: "A cell sits in water full of sodium and keeps almost none of it inside while holding potassium in against the same gradient, so its edge is not a wall but a set of gates with a list. What is this?",
          hi: "कोशिका सोडियम से भरे पानी में बैठी है और उसमें से लगभग कुछ भी भीतर नहीं रखती, जबकि उसी प्रवणता के विरुद्ध पोटैशियम भीतर थामे रहती है, अतः उसका किनारा दीवार नहीं, सूची लिए द्वारों का समुच्चय है। यह क्या है?",
          mr: "पेशी सोडियमने भरलेल्या पाण्यात बसली आहे आणि त्यातले जवळपास काहीच आत ठेवत नाही, तर त्याच उतारापुढे पोटॅशियम आत धरून ठेवते, म्हणून तिची कड ही भिंत नव्हे, यादी असलेल्या दारांचा संच आहे. हे काय?",
        },
        statement: {
          en: "The plasma membrane is a fluid mosaic — a bilayer of lipids with proteins drifting in it — and it is selectively permeable, letting some substances through freely, some only through a protein, and some not at all.",
          hi: "जीवद्रव्य झिल्ली तरल मोज़ेक है — लिपिडों का द्विस्तर जिसमें प्रोटीन बहते रहते हैं — और वह वरणात्मक पारगम्य है, कुछ पदार्थों को स्वतंत्र जाने देती है, कुछ को केवल किसी प्रोटीन से, और कुछ को बिलकुल नहीं।",
          mr: "प्लाझ्मा पटल हे तरल मोझेक — लिपिडांचा द्विथर ज्यात प्रथिने तरंगत असतात — आणि ते निवडक पार्य आहे, काही पदार्थ मोकळे जाऊ देते, काही केवळ एखाद्या प्रथिनातून, आणि काही अजिबात नाही.",
        },
        detail: {
          en: "Fluid is the load-bearing word: the lipids are not fixed, so the membrane heals a puncture, lets proteins move to where they are needed, and can be pinched to make a vesicle.",
          hi: "\"तरल\" ही भार उठाता शब्द है: लिपिड जमे नहीं हैं, अतः झिल्ली छेद भर लेती है, प्रोटीनों को वहाँ जाने देती है जहाँ ज़रूरत हो, और सिकोड़कर पुटिका बनाई जा सकती है।",
          mr: "\"तरल\" हाच भार उचलणारा शब्द: लिपिड स्थिर नाहीत, म्हणून पटल छिद्र भरून काढते, प्रथिनांना गरज असेल तिथे जाऊ देते, आणि चिमटून पुटिका बनवता येते.",
        },
        extra: {
          en: "Keeping an ion out costs energy for as long as the cell lives, which is why a third of what a resting animal eats is spent on pumps that do nothing but maintain a difference.",
          hi: "किसी आयन को बाहर रखना कोशिका के जीने भर ऊर्जा माँगता है, इसीलिए विश्राम कर रहा प्राणी जो खाता है उसका एक-तिहाई उन पंपों पर ख़र्च होता है जो एक अंतर बनाए रखने के सिवा कुछ नहीं करते।",
          mr: "एखादा आयन बाहेर ठेवणे पेशी जगेपर्यंत ऊर्जा मागते, म्हणूनच विश्रांती घेणारा प्राणी जे खातो त्यातला एक तृतीयांश त्या पंपांवर खर्च होतो जे एक फरक टिकवण्यापलीकडे काहीच करत नाहीत.",
        },
        pair: {
          left: {
            en: "A third of a resting meal spent on pumps",
            hi: "विश्राम के भोजन का एक-तिहाई पंपों पर",
            mr: "विश्रांतीच्या जेवणाचा एक तृतीयांश पंपांवर",
          },
          right: {
            en: "a boundary that decides rather than divides",
            hi: "वह सीमा जो बाँटती नहीं, तय करती है",
            mr: "विभागत नाही तर ठरवते अशी सीमा",
          },
        },
      },
      {
        id: "why-a-cell-cannot-just-grow",
        name: {
          en: "Why a cell cannot solve anything by growing",
          hi: "कोशिका बढ़कर कुछ हल क्यों नहीं कर सकती",
          mr: "पेशी वाढून काहीच का सोडवू शकत नाही",
        },
        kind: "constraint",
        prompt: {
          en: "Double a cell's diameter and its surface goes up fourfold while the contents it must feed go up eightfold, so every doubling makes the supply per unit of demand worse. Which limit is this?",
          hi: "कोशिका का व्यास दोगुना करो और उसकी सतह चार गुना होती है जबकि जिस भीतरी भाग को खिलाना है वह आठ गुना, अतः हर दुगुना करना प्रति इकाई माँग आपूर्ति और बिगाड़ देता है। यह कौन-सी सीमा है?",
          mr: "पेशीचा व्यास दुप्पट करा आणि तिचा पृष्ठभाग चौपट होतो तर जो आतला भाग पोसायचा तो आठपट, म्हणून प्रत्येक दुप्पट करणे प्रति एकक मागणी पुरवठा अधिकच बिघडवते. ही कोणती मर्यादा?",
        },
        statement: {
          en: "The surface-area-to-volume ratio falls as a cell grows, because area rises with the square of the radius and volume with the cube, so a cell that gets too big cannot exchange enough across its membrane to serve its inside.",
          hi: "कोशिका बढ़ने पर सतह-क्षेत्र और आयतन का अनुपात गिरता है, क्योंकि क्षेत्रफल त्रिज्या के वर्ग से और आयतन घन से बढ़ता है, अतः बहुत बड़ी हो गई कोशिका अपने भीतर को सेवा देने भर विनिमय अपनी झिल्ली के पार नहीं कर सकती।",
          mr: "पेशी वाढताच पृष्ठभाग-आणि-आकारमान गुणोत्तर घटते, कारण क्षेत्रफळ त्रिज्येच्या वर्गाने आणि आकारमान घनाने वाढते, म्हणून खूप मोठी झालेली पेशी आपल्या आतल्या भागाला पुरवण्याइतकी देवाणघेवाण आपल्या पटलापलीकडे करू शकत नाही.",
        },
        detail: {
          en: "This is why cells are microscopic almost everywhere in nature and why an organism grows by making more of them rather than by making them larger.",
          hi: "इसीलिए प्रकृति में लगभग हर जगह कोशिकाएँ सूक्ष्मदर्शीय हैं और इसीलिए जीव उन्हें बड़ा करके नहीं, अधिक बनाकर बढ़ता है।",
          mr: "म्हणूनच निसर्गात जवळपास सर्वत्र पेशी सूक्ष्मदर्शीय आहेत आणि म्हणूनच सजीव त्यांना मोठे करून नव्हे, अधिक बनवून वाढतो.",
        },
        extra: {
          en: "The exceptions prove it: a nerve cell a metre long is still micrometres thick, and an ostrich egg is one huge cell only because almost all of it is stored yolk that no membrane has to serve.",
          hi: "अपवाद इसे सिद्ध करते हैं: एक मीटर लंबी तंत्रिका कोशिका भी माइक्रोमीटर भर मोटी है, और शुतुरमुर्ग का अंडा एक विशाल कोशिका केवल इसलिए है कि उसका लगभग सब संचित पीतक है जिसे किसी झिल्ली को सेवा नहीं देनी।",
          mr: "अपवाद हेच सिद्ध करतात: एक मीटर लांब चेतापेशीही मायक्रोमीटरभर जाड आहे, आणि शहामृगाचे अंडे एक अवाढव्य पेशी केवळ यासाठी की त्यातले जवळपास सर्व साठवलेला बलक आहे ज्याला कोणत्याही पटलाने पुरवायचे नाही.",
        },
        pair: {
          left: {
            en: "A metre-long nerve, micrometres thick",
            hi: "एक मीटर लंबी तंत्रिका, माइक्रोमीटर भर मोटी",
            mr: "एक मीटर लांब चेता, मायक्रोमीटरभर जाड",
          },
          right: {
            en: "why a cell cannot solve anything by growing",
            hi: "कोशिका बढ़कर कुछ हल क्यों नहीं कर सकती",
            mr: "पेशी वाढून काहीच का सोडवू शकत नाही",
          },
        },
      },
      {
        id: "the-two-that-kept-their-own-instructions",
        name: {
          en: "The two that kept instructions of their own",
          hi: "वे दो जिन्होंने अपने निर्देश अपने पास रखे",
          mr: "स्वतःच्या सूचना स्वतःकडे ठेवलेली ती दोन",
        },
        kind: "evidence",
        prompt: {
          en: "Two organelles have a double membrane, a circular loop of DNA, ribosomes of the bacterial size, and divide by splitting in two — four facts nothing else in a eukaryotic cell can claim. Which are they?",
          hi: "दो कोशिकांगों में दोहरी झिल्ली है, DNA का वृत्ताकार फंदा है, जीवाणु-आकार के राइबोसोम हैं, और वे दो में बँटकर विभाजित होते हैं — चार तथ्य जिनका दावा यूकैरियोटी कोशिका में और कुछ नहीं कर सकता। वे कौन हैं?",
          mr: "दोन पेशीअंगांना दुहेरी पटल आहे, DNA चा वर्तुळाकार फास आहे, जीवाणू-आकाराचे रायबोसोम आहेत, आणि ती दोनांत विभागून विभाजित होतात — चार तथ्ये ज्यांचा दावा युकॅरिओटिक पेशीत दुसरे काहीही करू शकत नाही. ती कोणती?",
        },
        statement: {
          en: "Mitochondria and chloroplasts are semi-autonomous: each has a double membrane, its own circular DNA and 70S ribosomes, and each divides independently of the cell — the evidence that both descend from free-living bacteria taken in long ago.",
          hi: "सूत्रकणिका और हरितलवक अर्ध-स्वायत्त हैं: हर एक में दोहरी झिल्ली, अपना वृत्ताकार DNA और 70S राइबोसोम हैं, और हर एक कोशिका से स्वतंत्र विभाजित होता है — प्रमाण कि दोनों बहुत पहले भीतर लिए गए स्वतंत्रजीवी जीवाणुओं से उतरे हैं।",
          mr: "तंतुकणिका आणि हरितलवक अर्ध-स्वायत्त: प्रत्येकाला दुहेरी पटल, स्वतःचे वर्तुळाकार DNA आणि 70S रायबोसोम आहेत, आणि प्रत्येक पेशीपासून स्वतंत्रपणे विभागते — पुरावा की दोन्ही खूप आधी आत घेतलेल्या स्वतंत्रजीवी जीवाणूंपासून उतरले आहेत.",
        },
        detail: {
          en: "The inner membrane is the old bacterium's own and the outer one is the host's vesicle that engulfed it, which is why the two membranes differ in their lipids and their proteins.",
          hi: "भीतरी झिल्ली पुराने जीवाणु की अपनी है और बाहरी वह पुटिका है जिससे परपोषी ने उसे निगला, इसीलिए दोनों झिल्लियाँ अपने लिपिडों और प्रोटीनों में भिन्न हैं।",
          mr: "आतले पटल जुन्या जीवाणूचे स्वतःचे आणि बाहेरचे ती पुटिका जिने यजमानाने त्याला गिळले, म्हणूनच दोन्ही पटले आपल्या लिपिड आणि प्रथिनांत वेगळी.",
        },
        extra: {
          en: "The partnership is long past reversible: most of the genes moved to the nucleus over time, so neither organelle can live alone and no cell can build one from scratch.",
          hi: "साझेदारी अब पलटने से बहुत आगे है: अधिकांश जीन समय के साथ केंद्रक में चले गए, अतः न कोई कोशिकांग अकेला जी सकता है न कोई कोशिका उसे शून्य से बना सकती है।",
          mr: "भागीदारी आता उलटवण्यापलीकडे गेली: बहुतांश जनुके काळाच्या ओघात केंद्रकात गेली, म्हणून ना कोणतेही पेशीअंग एकटे जगू शकते ना कोणतीही पेशी ते शून्यातून बनवू शकते.",
        },
        pair: {
          left: {
            en: "Two membranes with different chemistry",
            hi: "भिन्न रसायन वाली दो झिल्लियाँ",
            mr: "वेगळ्या रसायनाची दोन पटले",
          },
          right: {
            en: "the two that kept instructions of their own",
            hi: "वे दो जिन्होंने अपने निर्देश अपने पास रखे",
            mr: "स्वतःच्या सूचना स्वतःकडे ठेवलेली ती दोन",
          },
        },
      },
      {
        id: "the-machine-that-gives-the-cell-away",
        name: {
          en: "The machine whose size gives the cell away",
          hi: "वह मशीन जिसका आकार कोशिका का भेद खोल देता है",
          mr: "ज्याचा आकार पेशीचे रहस्य उघडतो ते यंत्र",
        },
        kind: "contrast",
        prompt: {
          en: "Every cell alive makes protein on the same kind of machine, but a bacterium's sediments at 70 and yours at 80, and an antibiotic that jams the first leaves the second untouched. What is this?",
          hi: "हर जीवित कोशिका उसी क़िस्म की मशीन पर प्रोटीन बनाती है, पर जीवाणु की 70 पर अवसादित होती है और तुम्हारी 80 पर, और जो प्रतिजैविक पहली को जाम करे वह दूसरी को अछूता छोड़ देता है। यह क्या है?",
          mr: "प्रत्येक जिवंत पेशी त्याच प्रकारच्या यंत्रावर प्रथिन बनवते, पण जीवाणूचे 70 वर अवसादित होते आणि तुमचे 80 वर, आणि पहिले अडवणारे प्रतिजैविक दुसऱ्याला अस्पर्श सोडते. हे काय?",
        },
        statement: {
          en: "Ribosomes are the protein factories of every cell, 70S in prokaryotes and in mitochondria and chloroplasts, and 80S in the cytoplasm of eukaryotes, and they are made of RNA and protein with no membrane at all.",
          hi: "राइबोसोम हर कोशिका के प्रोटीन-कारख़ाने हैं, प्रोकैरियोटों में तथा सूत्रकणिका और हरितलवक में 70S, और यूकैरियोटों के कोशिकाद्रव्य में 80S, और वे RNA तथा प्रोटीन से बने हैं जिन पर कोई झिल्ली नहीं।",
          mr: "रायबोसोम हे प्रत्येक पेशीचे प्रथिन-कारखाने, प्रोकॅरिओटांत आणि तंतुकणिका व हरितलवकात 70S, आणि युकॅरिओटांच्या पेशीद्रव्यात 80S, आणि ते RNA आणि प्रथिनांचे बनलेले ज्यांवर कोणतेही पटल नाही.",
        },
        detail: {
          en: "S is a sedimentation coefficient, not a mass, which is why the two subunits of the 70S ribosome are 50S and 30S and the numbers do not add up.",
          hi: "S अवसादन गुणांक है, द्रव्यमान नहीं, इसीलिए 70S राइबोसोम की दोनों उपइकाइयाँ 50S और 30S हैं और संख्याएँ जुड़तीं नहीं।",
          mr: "S हा अवसादन गुणांक आहे, वस्तुमान नव्हे, म्हणूनच 70S रायबोसोमची दोन उपएकके 50S आणि 30S आहेत आणि आकडे जुळत नाहीत.",
        },
        extra: {
          en: "The whole of antibiotic medicine rests on that gap: a drug shaped to fit a 70S ribosome kills the bacterium and cannot touch the patient's own 80S machinery.",
          hi: "प्रतिजैविक चिकित्सा का पूरा आधार वही अंतर है: 70S राइबोसोम में फिट होने को गढ़ी औषधि जीवाणु को मारती है और रोगी की अपनी 80S मशीनरी को छू नहीं सकती।",
          mr: "प्रतिजैविक वैद्यकाचा अख्खा पाया तोच फरक: 70S रायबोसोममध्ये बसण्यासाठी घडवलेले औषध जीवाणूला मारते आणि रुग्णाच्या स्वतःच्या 80S यंत्रणेला स्पर्शही करू शकत नाही.",
        },
        pair: {
          left: {
            en: "A drug that kills the germ and not the patient",
            hi: "वह औषधि जो रोगाणु मारे और रोगी को नहीं",
            mr: "जंतू मारणारे आणि रुग्णाला न मारणारे औषध",
          },
          right: {
            en: "the machine whose size gives the cell away",
            hi: "वह मशीन जिसका आकार कोशिका का भेद खोल देता है",
            mr: "ज्याचा आकार पेशीचे रहस्य उघडतो ते यंत्र",
          },
        },
      },
      {
        id: "the-scaffolding-inside-the-bag",
        name: {
          en: "The scaffolding nobody expected a bag of fluid to have",
          hi: "वह मचान जिसकी तरल की थैली से किसी ने आशा न की थी",
          mr: "द्रवाच्या पिशवीत कोणी अपेक्षिली नव्हती ती मचाण",
        },
        kind: "structure",
        prompt: {
          en: "A cell holds its shape, drags chromosomes to opposite poles and walks vesicles from one end of itself to the other, none of which a bag of jelly could do, because filaments run through it like cables. What is this?",
          hi: "कोशिका अपना आकार थामे रखती है, गुणसूत्रों को विपरीत ध्रुवों तक घसीटती है और पुटिकाओं को अपने एक सिरे से दूसरे तक चलाती है, जिनमें से कुछ भी जेली की थैली नहीं कर सकती थी, क्योंकि उसमें से तार जैसे तंतु गुज़रते हैं। यह क्या है?",
          mr: "पेशी आपला आकार धरून ठेवते, गुणसूत्रे विरुद्ध ध्रुवांकडे ओढते आणि पुटिका आपल्या एका टोकाकडून दुसऱ्याकडे चालवते, यांतले काहीही जेलीची पिशवी करू शकली नसती, कारण तिच्यातून तारांसारखे तंतू जातात. हे काय?",
        },
        statement: {
          en: "The cytoskeleton is a network of protein filaments — microtubules, microfilaments and intermediate filaments — that gives the cell its shape, moves things inside it, and pulls the chromosomes apart when it divides.",
          hi: "कोशिका-कंकाल प्रोटीन तंतुओं का जाल है — सूक्ष्मनलिकाएँ, सूक्ष्म तंतु और मध्यवर्ती तंतु — जो कोशिका को आकार देता है, उसके भीतर चीज़ें हिलाता है, और विभाजन के समय गुणसूत्रों को खींचकर अलग करता है।",
          mr: "पेशी-सांगाडा हे प्रथिन तंतूंचे जाळे — सूक्ष्मनलिका, सूक्ष्मतंतू आणि मध्यवर्ती तंतू — जे पेशीला आकार देते, तिच्या आत गोष्टी हलवते, आणि विभाजनाच्या वेळी गुणसूत्रे ओढून वेगळी करते.",
        },
        detail: {
          en: "It is built to be taken apart: microtubules grow and shrink continuously, which is what lets a cell rebuild its whole interior for division in minutes.",
          hi: "वह तोड़े जाने के लिए ही बना है: सूक्ष्मनलिकाएँ लगातार बढ़ती और घटती हैं, और यही कोशिका को मिनटों में विभाजन के लिए अपना पूरा भीतरी ढाँचा फिर से बनाने देता है।",
          mr: "तो मोडला जाण्यासाठीच बांधलेला: सूक्ष्मनलिका सतत वाढतात आणि आकसतात, आणि हेच पेशीला मिनिटांत विभाजनासाठी आपली अख्खी आतील रचना पुन्हा बांधू देते.",
        },
        extra: {
          en: "Cilia and flagella are cytoskeleton too, built on a nine-plus-two ring of microtubules that is the same in a paramecium and in the tail of a human sperm.",
          hi: "पक्ष्माभ और कशाभिका भी कोशिका-कंकाल हैं, सूक्ष्मनलिकाओं के नौ-और-दो वलय पर बने, जो पैरामीशियम में और मानव शुक्राणु की पूँछ में वही है।",
          mr: "पक्ष्माभिका आणि कशाभिका याही पेशी-सांगाडा, सूक्ष्मनलिकांच्या नऊ-अधिक-दोन वलयावर बांधलेल्या, जे पॅरामिशियममध्ये आणि मानवी शुक्राणूच्या शेपटीत तेच आहे.",
        },
        pair: {
          left: {
            en: "The same ring in a paramecium and a sperm",
            hi: "पैरामीशियम में और शुक्राणु में वही वलय",
            mr: "पॅरामिशियममध्ये आणि शुक्राणूत तेच वलय",
          },
          right: {
            en: "the scaffolding nobody expected a bag of fluid to have",
            hi: "वह मचान जिसकी तरल की थैली से किसी ने आशा न की थी",
            mr: "द्रवाच्या पिशवीत कोणी अपेक्षिली नव्हती ती मचाण",
          },
        },
      },
      /*F8B*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student says an amoeba could grow to the size of a fist if only it ate enough, since it has no skeleton to limit it. Explain what actually stops it, using numbers.",
          hi: "एक विद्यार्थी कहता है कि अमीबा मुट्ठी जितना बड़ा हो सकता था बशर्ते वह पर्याप्त खाता, क्योंकि उसे सीमित करने को कोई कंकाल नहीं। संख्याओं से समझाओ कि उसे वस्तुतः रोकता क्या है।",
          mr: "एक विद्यार्थी म्हणतो की अमिबा मुठीएवढा मोठा होऊ शकला असता जर त्याने पुरेसे खाल्ले असते, कारण त्याला मर्यादित करायला सांगाडा नाही. आकड्यांनी समजावा की त्याला प्रत्यक्षात काय थांबवते.",
        },
        choices: [
          {
            en: "Geometry stops it. Surface area rises with the square of the radius and volume with the cube, so doubling the radius multiplies the membrane by 4 and the contents by 8 — the surface available per unit of volume halves. Every nutrient in and every waste out must cross that membrane, and diffusion inside gets slower with the square of the distance as well. Long before fist size the centre of the cell would be starved and poisoned no matter how much the amoeba ate, which is why cells stay microscopic and organisms grow by making MORE cells",
            hi: "उसे ज्यामिति रोकती है। सतह-क्षेत्र त्रिज्या के वर्ग से और आयतन घन से बढ़ता है, अतः त्रिज्या दोगुनी करने पर झिल्ली 4 गुना और भीतरी भाग 8 गुना हो जाता है — प्रति इकाई आयतन उपलब्ध सतह आधी रह जाती है। हर पोषक तत्व भीतर और हर अपशिष्ट बाहर उसी झिल्ली के पार जाना है, और भीतर विसरण भी दूरी के वर्ग से धीमा होता जाता है। मुट्ठी के आकार से बहुत पहले कोशिका का केंद्र भूखा और विषाक्त होता, चाहे अमीबा कितना भी खाए, इसीलिए कोशिकाएँ सूक्ष्मदर्शीय रहती हैं और जीव अधिक कोशिकाएँ बनाकर बढ़ते हैं",
            mr: "त्याला भूमिती थांबवते. पृष्ठभाग त्रिज्येच्या वर्गाने आणि आकारमान घनाने वाढते, म्हणून त्रिज्या दुप्पट केल्यास पटल 4 पट आणि आतला भाग 8 पट होतो — प्रति एकक आकारमान उपलब्ध पृष्ठभाग निम्मा उरतो. प्रत्येक पोषकद्रव्य आत आणि प्रत्येक टाकाऊ बाहेर त्याच पटलापलीकडे जायचे आहे, आणि आत विसरणही अंतराच्या वर्गाने मंदावते. मुठीच्या आकाराच्या खूप आधी पेशीचा मध्यभाग उपाशी आणि विषारी झाला असता, अमिबाने कितीही खाल्ले तरी, म्हणूनच पेशी सूक्ष्मदर्शीय राहतात आणि सजीव अधिक पेशी बनवून वाढतात",
          },
          {
            en: "The student is right: with unlimited food an amoeba would keep growing, and the microscopic size we see is simply a shortage of food in pond water",
            hi: "विद्यार्थी सही है: असीमित भोजन के साथ अमीबा बढ़ता रहता, और जो सूक्ष्मदर्शीय आकार हम देखते हैं वह बस तालाब के पानी में भोजन की कमी है",
            mr: "विद्यार्थी बरोबर: अमर्याद अन्नासह अमिबा वाढतच राहिला असता, आणि आपण पाहतो तो सूक्ष्मदर्शीय आकार म्हणजे फक्त तळ्याच्या पाण्यातली अन्नाची कमतरता",
          },
          {
            en: "The cell membrane would burst, because a membrane can only hold a fixed volume however much surface it has",
            hi: "कोशिका झिल्ली फट जाती, क्योंकि झिल्ली चाहे कितनी भी सतह रखे, केवल एक निश्चित आयतन थाम सकती है",
            mr: "पेशीपटल फुटले असते, कारण पटल कितीही पृष्ठभाग असो, केवळ ठरावीक आकारमान धरू शकते",
          },
          {
            en: "The nucleus stops it: one nucleus can control only a fixed volume of cytoplasm, and no cell can ever have more than one",
            hi: "उसे केंद्रक रोकता है: एक केंद्रक केवल निश्चित आयतन के कोशिकाद्रव्य पर नियंत्रण रख सकता है, और किसी कोशिका में एक से अधिक कभी नहीं हो सकते",
            mr: "त्याला केंद्रक थांबवते: एक केंद्रक केवळ ठरावीक आकारमानाच्या पेशीद्रव्यावर नियंत्रण ठेवू शकते, आणि कोणत्याही पेशीत एकाहून अधिक कधीच असू शकत नाहीत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The limit is not biological at all — it is arithmetic, and doing the arithmetic is the answer. Treat the amoeba as a sphere of radius r. Its membrane has area 4πr², its contents have volume (4/3)πr³, and the ratio of the two is 3/r. That last expression is the whole argument: the surface available per unit of volume is inversely proportional to the radius, so it can only ever get worse as the cell grows. Put numbers on it. A radius of 10 micrometres gives a ratio of 0.3 per micrometre. Double the radius to 20 and the membrane area has gone up by a factor of 4, the volume by a factor of 8, and the ratio has halved to 0.15. Ten-fold the radius and the ratio is a tenth of what it was. A fist is about five centimetres across — some 2,500 times a 20-micrometre amoeba — and by then the membrane per unit of contents is a fraction of a per cent of what a working cell needs. Now why that is fatal. Everything a cell takes in and everything it expels crosses the membrane: oxygen, glucose, ions, carbon dioxide, waste. The demand for all of them scales with the VOLUME of living material, and the supply route scales with the AREA. Once the ratio falls far enough, the membrane physically cannot pass enough per second to serve the interior, and no amount of eating helps — the food cannot get in fast enough. A second problem compounds it. Once inside, molecules move by diffusion, and diffusion time rises with the SQUARE of distance. Crossing 10 micrometres takes a fraction of a second; crossing 5 centimetres would take days. The centre of a fist-sized amoeba would be waiting a week for the oxygen that reached its surface this morning. Notice how life's actual solutions all respect this rather than escape it. Organisms grow by making more small cells, not bigger ones. Cells that must be large are shaped to cheat the ratio: a nerve cell is a metre long and still microns thick, so every point is close to a surface. The gut lining is folded into villi and microvilli, multiplying area without volume. A red blood cell is a biconcave disc — hollowed in the middle — for exactly the same reason. And an ostrich egg is one cell only because nearly all of it is inert stored yolk, not living cytoplasm demanding supply. The lesson is that a constraint from pure geometry can be as binding as any biological one, and often more so — it cannot be evolved around, only designed around. (The second answer treats a physical limit as an economic one; the third invents a bursting rule that osmosis governs rather than size; and the fourth misstates the cell — multinucleate cells exist, and a striated muscle fibre is exactly the workaround it claims is impossible.)",
          hi: "सीमा जैविक है ही नहीं — वह गणित है, और गणित कर लेना ही उत्तर है। अमीबा को त्रिज्या r का गोला मानो। उसकी झिल्ली का क्षेत्रफल 4πr², उसके भीतरी भाग का आयतन (4/3)πr³, और दोनों का अनुपात 3/r। वही अंतिम व्यंजक पूरा तर्क है: प्रति इकाई आयतन उपलब्ध सतह त्रिज्या के व्युत्क्रमानुपाती है, अतः कोशिका बढ़ने पर वह केवल बिगड़ ही सकती है। उस पर संख्याएँ रखो। 10 माइक्रोमीटर की त्रिज्या 0.3 प्रति माइक्रोमीटर का अनुपात देती है। त्रिज्या दोगुनी कर 20 करो और झिल्ली का क्षेत्रफल 4 गुना, आयतन 8 गुना हो गया, और अनुपात आधा होकर 0.15। त्रिज्या दस गुनी करो और अनुपात पहले का दसवाँ भाग। मुट्ठी लगभग पाँच सेंटीमीटर की है — 20 माइक्रोमीटर के अमीबा से क़रीब 2,500 गुना — और तब तक प्रति इकाई भीतरी भाग झिल्ली उसका एक प्रतिशत का अंश रह जाती है जितनी काम करती कोशिका को चाहिए। अब वह घातक क्यों है। कोशिका जो कुछ भीतर लेती है और जो कुछ बाहर फेंकती है सब झिल्ली पार करता है: ऑक्सीजन, ग्लूकोज़, आयन, कार्बन डाइऑक्साइड, अपशिष्ट। उन सबकी माँग जीवित पदार्थ के आयतन के साथ बढ़ती है, और आपूर्ति का मार्ग क्षेत्रफल के साथ। अनुपात पर्याप्त गिर जाने पर झिल्ली भौतिक रूप से इतना प्रति सेकंड पार नहीं करा सकती कि भीतर की सेवा हो, और कितना भी खाना काम नहीं आता — भोजन इतनी तेज़ भीतर जा ही नहीं सकता। दूसरी समस्या उसे और बढ़ा देती है। भीतर पहुँचने के बाद अणु विसरण से चलते हैं, और विसरण का समय दूरी के वर्ग से बढ़ता है। 10 माइक्रोमीटर पार करने में सेकंड का अंश लगता है; 5 सेंटीमीटर पार करने में दिन लगते। मुट्ठी जितने अमीबा का केंद्र उस ऑक्सीजन के लिए हफ़्ता भर प्रतीक्षा करता जो आज सुबह उसकी सतह पर पहुँची थी। ध्यान दो कि जीवन के असली समाधान सब इसका पालन करते हैं, इससे बचते नहीं। जीव अधिक छोटी कोशिकाएँ बनाकर बढ़ते हैं, बड़ी बनाकर नहीं। जिन कोशिकाओं को बड़ा होना ही है वे अनुपात को चकमा देने के लिए गढ़ी जाती हैं: तंत्रिका कोशिका एक मीटर लंबी और फिर भी माइक्रोन भर मोटी है, अतः हर बिंदु सतह के पास है। आँत का आस्तर रसांकुरों और सूक्ष्म रसांकुरों में मुड़ा है, आयतन बढ़ाए बिना क्षेत्रफल कई गुना करता। लाल रुधिर कोशिका उभयावतल चक्रिका है — बीच से खोखली — ठीक इसी कारण। और शुतुरमुर्ग का अंडा एक कोशिका केवल इसलिए है कि उसका लगभग सब निष्क्रिय संचित पीतक है, आपूर्ति माँगता जीवित कोशिकाद्रव्य नहीं। सीख यह है कि शुद्ध ज्यामिति से आया बंधन किसी भी जैविक बंधन जितना ही बाध्यकारी हो सकता है, और प्रायः उससे अधिक — उसके इर्द-गिर्द विकास नहीं हो सकता, केवल अभिकल्प हो सकता है। (दूसरा उत्तर भौतिक सीमा को आर्थिक मान लेता है; तीसरा फटने का नियम गढ़ता है जिसे आकार नहीं, परासरण चलाता है; और चौथा कोशिका को ग़लत बताता है — बहुकेंद्रकी कोशिकाएँ होती हैं, और रेखित पेशी तंतु ठीक वही उपाय है जिसे वह असंभव बताता है।)",
          mr: "मर्यादा जैविक आहेच नाही — ती गणित आहे, आणि गणित करणे हेच उत्तर आहे. अमिबाला त्रिज्या r चा गोल माना. त्याच्या पटलाचे क्षेत्रफळ 4πr², त्याच्या आतल्या भागाचे आकारमान (4/3)πr³, आणि दोघांचे गुणोत्तर 3/r. तेच शेवटचे पद अख्खा युक्तिवाद: प्रति एकक आकारमान उपलब्ध पृष्ठभाग त्रिज्येच्या व्यस्त प्रमाणात, म्हणून पेशी वाढताच तो केवळ बिघडूच शकतो. त्यावर आकडे ठेवा. 10 मायक्रोमीटर त्रिज्या 0.3 प्रति मायक्रोमीटर गुणोत्तर देते. त्रिज्या दुप्पट करून 20 करा आणि पटलाचे क्षेत्रफळ 4 पट, आकारमान 8 पट झाले, आणि गुणोत्तर निम्मे होऊन 0.15. त्रिज्या दहापट करा आणि गुणोत्तर आधीच्या दशांश. मूठ सुमारे पाच सेंटिमीटरची — 20 मायक्रोमीटरच्या अमिबाहून जवळपास 2,500 पट — आणि तोवर प्रति एकक आतला भाग पटल काम करणाऱ्या पेशीला लागते त्याच्या एक टक्क्याचा अंश उरते. आता ते घातक का. पेशी जे काही आत घेते आणि जे काही बाहेर फेकते ते सर्व पटल ओलांडते: ऑक्सिजन, ग्लुकोज, आयन, कार्बन डायऑक्साइड, टाकाऊ. त्या सर्वांची मागणी जिवंत द्रव्याच्या आकारमानासोबत वाढते, आणि पुरवठ्याचा मार्ग क्षेत्रफळासोबत. गुणोत्तर पुरेसे घटताच पटल भौतिकदृष्ट्या इतके प्रति सेकंद पार करवू शकत नाही की आतल्याची सेवा व्हावी, आणि कितीही खाणे उपयोगी पडत नाही — अन्न इतक्या वेगाने आत जाऊच शकत नाही. दुसरी समस्या ती अधिकच वाढवते. आत पोहोचल्यावर रेणू विसरणाने चालतात, आणि विसरणाचा वेळ अंतराच्या वर्गाने वाढतो. 10 मायक्रोमीटर ओलांडायला सेकंदाचा अंश लागतो; 5 सेंटिमीटर ओलांडायला दिवस लागले असते. मुठीएवढ्या अमिबाचा मध्यभाग आज सकाळी त्याच्या पृष्ठभागावर पोहोचलेल्या ऑक्सिजनसाठी आठवडाभर वाट पाहत बसला असता. लक्षात घ्या की जीवनाचे खरे उपाय सर्व याचे पालन करतात, यातून सुटत नाहीत. सजीव अधिक लहान पेशी बनवून वाढतात, मोठ्या बनवून नाही. ज्या पेशींना मोठे व्हावेच लागते त्या गुणोत्तराला चकवण्यासाठी घडवल्या जातात: चेतापेशी एक मीटर लांब आणि तरीही मायक्रॉनभर जाड, म्हणून प्रत्येक बिंदू पृष्ठभागाजवळ. आतड्याचे अस्तर रसांकुर आणि सूक्ष्म रसांकुरांत घडी घातलेले, आकारमान न वाढवता क्षेत्रफळ कैकपट करत. तांबडी रक्तपेशी उभयनतोदर चकती — मध्यभागी पोकळ — नेमक्या याच कारणाने. आणि शहामृगाचे अंडे एक पेशी केवळ यासाठी की त्यातले जवळपास सर्व निष्क्रिय साठवलेला बलक आहे, पुरवठा मागणारे जिवंत पेशीद्रव्य नव्हे. धडा असा की शुद्ध भूमितीतून आलेले बंधन कोणत्याही जैविक बंधनाइतकेच बंधनकारक असू शकते, आणि बहुधा त्याहून अधिक — त्याभोवती उत्क्रांती होऊ शकत नाही, केवळ रचना होऊ शकते. (दुसरे उत्तर भौतिक मर्यादेला आर्थिक मानते; तिसरे फुटण्याचा नियम रचते जो आकार नव्हे, तर परासरण चालवते; आणि चौथे पेशी चुकीची सांगते — बहुकेंद्रकी पेशी असतात, आणि रेखित स्नायुतंतू नेमका तोच उपाय आहे जो ते अशक्य म्हणते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A doctor prescribes an antibiotic that jams the ribosome. A student asks why it does not jam the patient's ribosomes too, and whether the same drug should work on a fungal infection. Answer both.",
          hi: "एक चिकित्सक ऐसा प्रतिजैविक लिखता है जो राइबोसोम को जाम कर देता है। एक विद्यार्थी पूछता है कि वह रोगी के राइबोसोम क्यों नहीं जाम करता, और क्या वही औषधि कवक-संक्रमण पर चलनी चाहिए। दोनों का उत्तर दो।",
          mr: "एक डॉक्टर रायबोसोम अडवणारे प्रतिजैविक लिहून देतो. एक विद्यार्थी विचारतो की ते रुग्णाचे रायबोसोम का अडवत नाही, आणि तेच औषध कवक-संसर्गावर चालावे का. दोन्हीचे उत्तर द्या.",
        },
        choices: [
          {
            en: "The drug fits a 70S ribosome and the patient's cytoplasmic ribosomes are 80S — different sizes, different subunits, different shapes at the binding site — so it cannot dock on them. It will NOT work on a fungus: a fungus is a eukaryote and its cytoplasmic ribosomes are 80S like ours, so the same selectivity that spares the patient also spares the fungus, and fungal infections need an entirely different class of drug aimed at something fungi have and we do not, such as ergosterol in the membrane. The one caveat: human mitochondria carry 70S ribosomes, which is why some of these antibiotics have side effects",
            hi: "औषधि 70S राइबोसोम में फिट होती है और रोगी के कोशिकाद्रव्यी राइबोसोम 80S हैं — भिन्न आकार, भिन्न उपइकाइयाँ, बंधन-स्थल पर भिन्न आकृति — अतः वह उन पर बैठ ही नहीं सकती। वह कवक पर नहीं चलेगी: कवक यूकैरियोट है और उसके कोशिकाद्रव्यी राइबोसोम हमारी तरह 80S हैं, अतः जो वरणात्मकता रोगी को बचाती है वही कवक को भी बचा देती है, और कवक-संक्रमणों को बिलकुल भिन्न वर्ग की औषधि चाहिए जो उस पर निशाना साधे जो कवकों में है और हममें नहीं, जैसे झिल्ली में अर्गोस्टेरॉल। एक चेतावनी: मानव सूत्रकणिकाओं में 70S राइबोसोम होते हैं, इसीलिए इनमें से कुछ प्रतिजैविकों के दुष्प्रभाव हैं",
            mr: "औषध 70S रायबोसोममध्ये बसते आणि रुग्णाचे पेशीद्रव्यी रायबोसोम 80S आहेत — वेगळे आकार, वेगळी उपएकके, बंधनस्थळी वेगळी आकृती — म्हणून ते त्यांवर बसूच शकत नाही. ते कवकावर चालणार नाही: कवक हा युकॅरिओट आणि त्याचे पेशीद्रव्यी रायबोसोम आपल्यासारखे 80S, म्हणून जी निवडकता रुग्णाला वाचवते तीच कवकालाही वाचवते, आणि कवक-संसर्गांना पूर्णपणे वेगळ्या वर्गाचे औषध लागते जे कवकांत आहे आणि आपल्यात नाही त्यावर नेम धरते, जसे पटलातले अर्गोस्टेरॉल. एक इशारा: मानवी तंतुकणिकांत 70S रायबोसोम असतात, म्हणूनच यांतल्या काही प्रतिजैविकांचे दुष्परिणाम आहेत",
          },
          {
            en: "It spares the patient because human cells have no ribosomes in the cytoplasm, and it will work on a fungus because all infections are caused by prokaryotes",
            hi: "वह रोगी को इसलिए बचाती है कि मानव कोशिकाओं के कोशिकाद्रव्य में राइबोसोम होते ही नहीं, और वह कवक पर चलेगी क्योंकि सारे संक्रमण प्रोकैरियोट करते हैं",
            mr: "ते रुग्णाला यासाठी वाचवते की मानवी पेशींच्या पेशीद्रव्यात रायबोसोमच नसतात, आणि ते कवकावर चालेल कारण सर्व संसर्ग प्रोकॅरिओट करतात",
          },
          {
            en: "It spares the patient because the drug cannot cross a human cell membrane at all, and for the same reason it will not work on a fungus",
            hi: "वह रोगी को इसलिए बचाती है कि औषधि मानव कोशिका झिल्ली पार कर ही नहीं सकती, और उसी कारण वह कवक पर भी नहीं चलेगी",
            mr: "ते रुग्णाला यासाठी वाचवते की औषध मानवी पेशीपटल ओलांडूच शकत नाही, आणि त्याच कारणाने ते कवकावरही चालणार नाही",
          },
          {
            en: "It spares the patient because human ribosomes are 70S and bacterial ones 80S, and it will work on a fungus because fungal ribosomes are 80S like the bacteria's",
            hi: "वह रोगी को इसलिए बचाती है कि मानव राइबोसोम 70S और जीवाणु के 80S हैं, और वह कवक पर चलेगी क्योंकि कवक के राइबोसोम जीवाणु की तरह 80S हैं",
            mr: "ते रुग्णाला यासाठी वाचवते की मानवी रायबोसोम 70S आणि जीवाणूचे 80S आहेत, आणि ते कवकावर चालेल कारण कवकाचे रायबोसोम जीवाणूसारखे 80S आहेत",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "This question is the cell-biology chapter cashing itself out at a hospital bedside, and both halves turn on one number. Start with the first half. Every living cell makes protein on a ribosome, so a drug that jams ribosomes should in principle kill everything, including the patient. What saves the patient is that not all ribosomes are the same. A bacterial ribosome sediments at 70S and is built from a 50S and a 30S subunit; a eukaryotic cytoplasmic ribosome sediments at 80S from 60S and 40S subunits. The S is a sedimentation coefficient — a measure of how fast the particle settles in a centrifuge, depending on mass AND shape — which is why the subunits do not add up arithmetically and why the number is a fingerprint of the whole assembly rather than a weight. Different assembly means differently shaped pockets, and a drug molecule is shaped to fit one pocket. Tetracycline binds the 30S subunit and blocks the incoming transfer RNA; erythromycin plugs the exit tunnel of the 50S. Neither pocket exists in the same form on a 60S or 40S subunit, so the drug drifts past the patient's ribosomes without docking. This is what pharmacology calls selective toxicity, and it is the reason antibiotics are safe in a way that most poisons are not: the difference is not a matter of dose but of shape. Now the second half, which is where the student's intuition fails informatively. A fungus is not a bacterium — it is a eukaryote, in the same domain as the patient. Its cytoplasmic ribosomes are 80S, built exactly like ours. So the drug's selectivity does not merely fail to help; it works in the fungus's favour, sparing it for the same reason it spares the patient. Antifungals therefore have to attack a different difference. The usual one is the membrane: fungi build theirs with ergosterol where animals use cholesterol, so azoles block ergosterol synthesis and polyenes punch holes wherever ergosterol sits. Fewer such differences exist, which is exactly why antifungal drugs are fewer, more toxic and harder to develop than antibacterials — the closer the pathogen is to you, the smaller the target. One caveat completes the picture and is worth knowing because it explains real side effects. Human mitochondria descend from bacteria and kept 70S ribosomes. An antibiotic aimed at 70S therefore does have something to bind inside the patient's own cells, which is why aminoglycosides can damage hearing and chloramphenicol can suppress bone marrow. The selectivity is excellent, not perfect, and the imperfection is a direct fingerprint of the endosymbiosis this chapter described. The transferable idea is that every safe drug is built on a difference between the pathogen and the patient, and the size of that difference sets how safe the drug can be. (The second answer states something plainly false about human cells; the third invents a permeability barrier that would prevent the drug reaching an intracellular infection at all; and the fourth reverses the two numbers, which would make every antibiotic lethal to the patient.)",
          hi: "यह प्रश्न कोशिका-विज्ञान के अध्याय का अस्पताल की खाट पर भुनाया जाना है, और दोनों आधे एक ही संख्या पर टिके हैं। पहला आधा लो। हर जीवित कोशिका राइबोसोम पर प्रोटीन बनाती है, अतः राइबोसोम जाम करती औषधि सिद्धांततः सब कुछ मार देनी चाहिए, रोगी सहित। रोगी को यह बचाता है कि सभी राइबोसोम एक जैसे नहीं। जीवाणु का राइबोसोम 70S पर अवसादित होता है और 50S तथा 30S उपइकाइयों से बना है; यूकैरियोटी कोशिकाद्रव्यी राइबोसोम 60S और 40S उपइकाइयों से 80S पर। S अवसादन गुणांक है — माप कि कण अपकेंद्रित्र में कितनी तेज़ बैठता है, जो द्रव्यमान और आकृति दोनों पर निर्भर है — इसीलिए उपइकाइयाँ गणितीय रूप से जुड़तीं नहीं और इसीलिए वह संख्या भार नहीं, पूरे जोड़ की छाप है। भिन्न जोड़ का अर्थ भिन्न आकार की खाँचें, और औषधि का अणु एक खाँचे में फिट होने को गढ़ा है। टेट्रासाइक्लिन 30S उपइकाई से बँधती है और आते ट्रांसफ़र RNA को रोकती है; एरिथ्रोमाइसिन 50S की निकास-सुरंग में ठेप लगाती है। दोनों में से कोई खाँचा 60S या 40S उपइकाई पर उसी रूप में नहीं है, अतः औषधि रोगी के राइबोसोमों के पास से बिना बैठे गुज़र जाती है। इसे औषध-विज्ञान वरणात्मक विषाक्तता कहता है, और यही कारण है कि प्रतिजैविक उस तरह सुरक्षित हैं जिस तरह अधिकांश विष नहीं: भेद मात्रा का नहीं, आकृति का है। अब दूसरा आधा, जहाँ विद्यार्थी की सहज बुद्धि शिक्षाप्रद ढंग से विफल होती है। कवक जीवाणु नहीं — वह यूकैरियोट है, रोगी के ही डोमेन का। उसके कोशिकाद्रव्यी राइबोसोम 80S हैं, ठीक हमारी तरह बने। अतः औषधि की वरणात्मकता केवल मदद करने में विफल नहीं होती; वह कवक के पक्ष में काम करती है, उसे उसी कारण बचाते हुए जिस कारण रोगी को बचाती है। इसलिए कवकरोधी औषधियों को भिन्न भेद पर हमला करना पड़ता है। सामान्य भेद है झिल्ली: कवक अपनी झिल्ली अर्गोस्टेरॉल से बनाते हैं जहाँ प्राणी कोलेस्टेरॉल बरतते हैं, अतः एज़ोल अर्गोस्टेरॉल का संश्लेषण रोकते हैं और पॉलीईन जहाँ भी अर्गोस्टेरॉल हो वहाँ छेद कर देते हैं। ऐसे भेद कम हैं, ठीक इसीलिए कवकरोधी औषधियाँ जीवाणुरोधियों से कम, अधिक विषैली और बनाने में कठिन हैं — रोगजनक तुम्हारे जितना निकट हो, निशाना उतना छोटा। एक चेतावनी चित्र पूरा करती है और जानने योग्य है क्योंकि वह असली दुष्प्रभाव समझाती है। मानव सूत्रकणिकाएँ जीवाणुओं से उतरीं और उन्होंने 70S राइबोसोम रखे। अतः 70S पर निशाना साधे प्रतिजैविक के पास रोगी की अपनी कोशिकाओं के भीतर बँधने को कुछ है, इसीलिए एमिनोग्लाइकोसाइड श्रवण को क्षति पहुँचा सकते हैं और क्लोरैम्फ़ेनिकॉल अस्थि-मज्जा दबा सकता है। वरणात्मकता उत्कृष्ट है, पूर्ण नहीं, और वह अपूर्णता उसी अंतःसहजीविता की सीधी छाप है जिसका वर्णन इस अध्याय ने किया। हस्तांतरणीय विचार यह है कि हर सुरक्षित औषधि रोगजनक और रोगी के बीच किसी भेद पर बनी है, और उस भेद का आकार तय करता है कि औषधि कितनी सुरक्षित हो सकती है। (दूसरा उत्तर मानव कोशिकाओं के बारे में खुला झूठ कहता है; तीसरा ऐसा पारगम्यता-अवरोध गढ़ता है जो औषधि को अंतःकोशिकीय संक्रमण तक पहुँचने ही न देता; और चौथा दोनों संख्याएँ उलट देता है, जिससे हर प्रतिजैविक रोगी के लिए घातक हो जाता।)",
          mr: "हा प्रश्न म्हणजे पेशी-विज्ञानाच्या प्रकरणाचे रुग्णालयाच्या खाटेपाशी वटवले जाणे, आणि दोन्ही अर्धे एकाच आकड्यावर टेकलेले. पहिला अर्धा घ्या. प्रत्येक जिवंत पेशी रायबोसोमवर प्रथिन बनवते, म्हणून रायबोसोम अडवणारे औषध तत्त्वतः सर्व काही मारायला हवे, रुग्णासह. रुग्णाला हे वाचवते की सर्व रायबोसोम सारखे नाहीत. जीवाणूचा रायबोसोम 70S वर अवसादित होतो आणि 50S व 30S उपएककांचा बनलेला; युकॅरिओटिक पेशीद्रव्यी रायबोसोम 60S आणि 40S उपएककांतून 80S वर. S हा अवसादन गुणांक — कण अपकेंद्रित्रात किती वेगाने बसतो याचे माप, जे वस्तुमान आणि आकृती दोन्हींवर अवलंबून — म्हणूनच उपएकके गणिती जुळत नाहीत आणि म्हणूनच तो आकडा वजन नव्हे, अख्ख्या जुळणीची ओळख. वेगळी जुळणी म्हणजे वेगळ्या आकाराच्या खाचा, आणि औषधाचा रेणू एका खाचेत बसण्यासाठी घडवलेला. टेट्रासायक्लिन 30S उपएककाशी बांधले जाते आणि येणारा ट्रान्सफर RNA अडवते; एरिथ्रोमायसिन 50S च्या निर्गम-बोगद्यात बूच घालते. दोन्हीपैकी कोणतीही खाच 60S वा 40S उपएककावर त्याच रूपात नाही, म्हणून औषध रुग्णाच्या रायबोसोमांजवळून न बसता निघून जाते. याला औषधशास्त्र निवडक विषारीपणा म्हणते, आणि हेच कारण की प्रतिजैविके अशा प्रकारे सुरक्षित आहेत जशी बहुतेक विषे नाहीत: फरक मात्रेचा नव्हे, आकृतीचा आहे. आता दुसरा अर्धा, जिथे विद्यार्थ्याची सहजबुद्धी शिकवणाऱ्या पद्धतीने अपयशी ठरते. कवक हा जीवाणू नव्हे — तो युकॅरिओट, रुग्णाच्याच क्षेत्रातला. त्याचे पेशीद्रव्यी रायबोसोम 80S, नेमके आपल्यासारखे बांधलेले. म्हणून औषधाची निवडकता केवळ मदत करण्यात अपयशी ठरत नाही; ती कवकाच्या बाजूने काम करते, त्याला त्याच कारणाने वाचवत ज्या कारणाने रुग्णाला वाचवते. म्हणून कवकरोधी औषधांना वेगळ्या फरकावर हल्ला करावा लागतो. नेहमीचा फरक म्हणजे पटल: कवक आपले पटल अर्गोस्टेरॉलने बांधतात जिथे प्राणी कोलेस्टेरॉल वापरतात, म्हणून अझोल अर्गोस्टेरॉलचे संश्लेषण अडवतात आणि पॉलिईन जिथे अर्गोस्टेरॉल असेल तिथे छिद्रे पाडतात. असे फरक कमी आहेत, नेमके म्हणूनच कवकरोधी औषधे जीवाणुरोधींहून कमी, अधिक विषारी आणि बनवायला कठीण — रोगजनक तुमच्या जितका जवळ, नेम तितका लहान. एक इशारा चित्र पूर्ण करतो आणि जाणण्याजोगा कारण तो खरे दुष्परिणाम समजावतो. मानवी तंतुकणिका जीवाणूंपासून उतरल्या आणि त्यांनी 70S रायबोसोम ठेवले. म्हणून 70S वर नेम धरलेल्या प्रतिजैविकाकडे रुग्णाच्या स्वतःच्या पेशींच्या आत बांधले जायला काहीतरी आहे, म्हणूनच अमिनोग्लायकोसाइड श्रवणाला हानी पोहोचवू शकतात आणि क्लोराम्फेनिकॉल अस्थिमज्जा दाबू शकते. निवडकता उत्कृष्ट आहे, परिपूर्ण नाही, आणि ती अपूर्णता याच प्रकरणाने वर्णिलेल्या अंतःसहजीवनाची थेट ओळख आहे. हस्तांतरणीय कल्पना अशी की प्रत्येक सुरक्षित औषध रोगजनक आणि रुग्ण यांच्यातल्या एखाद्या फरकावर बांधलेले आहे, आणि त्या फरकाचा आकार ठरवतो की औषध किती सुरक्षित असू शकते. (दुसरे उत्तर मानवी पेशींबद्दल उघड खोटे सांगते; तिसरे असा पार्यता-अडथळा रचते जो औषधाला अंतःपेशीय संसर्गापर्यंत पोहोचूच देणार नाही; आणि चौथे दोन्ही आकडे उलटवते, ज्याने प्रत्येक प्रतिजैविक रुग्णासाठी घातक ठरेल.)",
        },
      },
      /*H8B*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 9 — Biomolecules                                                */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-11-biomolecules",
    subject: "BIOLOGY",
    classLevel: 11,
    chapter: {
      en: "Chapter 9 — Biomolecules",
      hi: "अध्याय 9 — जैव अणु",
      mr: "प्रकरण 9 — जैवरेणू",
    },
    name: {
      en: "Biomolecules",
      hi: "जैव अणु",
      mr: "जैवरेणू",
    },
    summary: {
      en: "Life builds almost everything it owns from a short list of small units joined by one kind of reaction that removes a water molecule each time, so the interesting facts are all about arrangement: twenty letters spelling every protein there is, a chain that does nothing until it folds, two polymers of the same sugar that make bread and wood, and a catalyst that lowers a hill without moving either end of it.",
      hi: "जीवन अपनी लगभग हर चीज़ छोटी इकाइयों की छोटी-सी सूची से बनाता है जो एक ही क़िस्म की अभिक्रिया से जुड़ती हैं जो हर बार पानी का एक अणु हटा देती है, अतः रोचक तथ्य सब व्यवस्था के हैं: बीस अक्षर जिनसे संसार का हर प्रोटीन लिखा जाता है, वह शृंखला जो मुड़ने तक कुछ नहीं करती, उसी शर्करा के दो बहुलक जो रोटी और लकड़ी बनाते हैं, और वह उत्प्रेरक जो पहाड़ी नीची करता है बिना उसका कोई सिरा हिलाए।",
      mr: "जीवन आपली जवळपास प्रत्येक गोष्ट लहान एककांच्या छोट्या यादीतून बांधते जी एकाच प्रकारच्या अभिक्रियेने जोडली जातात जी प्रत्येक वेळी पाण्याचा एक रेणू काढते, म्हणून रोचक तथ्ये सर्व मांडणीची: वीस अक्षरे ज्यांनी जगातले प्रत्येक प्रथिन लिहिले जाते, ती साखळी जी घडी पडेपर्यंत काहीच करत नाही, त्याच साखरेचे दोन बहुवारिक जे भाकरी आणि लाकूड बनवतात, आणि तो उत्प्रेरक जो टेकडी खाली आणतो तिचे कोणतेही टोक न हलवता.",
    },
    position: 9,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "twenty-letters-for-every-protein",
        name: {
          en: "Twenty letters, and every protein spelled with them",
          hi: "बीस अक्षर, और हर प्रोटीन उन्हीं से लिखा",
          mr: "वीस अक्षरे, आणि प्रत्येक प्रथिन त्यांनीच लिहिलेले",
        },
        kind: "structure",
        prompt: {
          en: "Haemoglobin, insulin, the enzyme in your saliva and the keratin in your hair are built from the same short alphabet, differing only in the order of the letters. What are these?",
          hi: "हीमोग्लोबिन, इंसुलिन, तुम्हारी लार का एंज़ाइम और तुम्हारे बालों का कीरेटिन उसी छोटी वर्णमाला से बने हैं, और केवल अक्षरों के क्रम में भिन्न हैं। ये क्या हैं?",
          mr: "हिमोग्लोबिन, इन्शुलिन, तुमच्या लाळेतले एंझाइम आणि तुमच्या केसांतले केराटिन याच लहान वर्णमालेतून बांधलेले, आणि केवळ अक्षरांच्या क्रमात वेगळे. ही काय आहेत?",
        },
        statement: {
          en: "Proteins are polymers of amino acids, of which twenty occur in proteins, each with the same backbone of an amino group, a carboxyl group and a central carbon, and differing only in the side chain attached to it.",
          hi: "प्रोटीन एमीनो अम्लों के बहुलक हैं, जिनमें से बीस प्रोटीनों में मिलते हैं, हर एक में एमीनो समूह, कार्बोक्सिल समूह और केंद्रीय कार्बन का वही ढाँचा, और भिन्नता केवल उससे जुड़ी पार्श्व शृंखला में।",
          mr: "प्रथिने अमिनो आम्लांची बहुवारिके, ज्यांतली वीस प्रथिनांत आढळतात, प्रत्येकात अमिनो गट, कार्बोक्सिल गट आणि मध्यवर्ती कार्बन असा तोच सांगाडा, आणि फरक केवळ त्याला जोडलेल्या बाजूच्या साखळीत.",
        },
        detail: {
          en: "The side chain is the whole of the difference: it decides whether the amino acid is acidic, basic, water-loving or water-fearing, and therefore where in a folded protein it will end up.",
          hi: "पार्श्व शृंखला ही पूरा भेद है: वही तय करती है कि एमीनो अम्ल अम्लीय है, क्षारीय, जल-प्रेमी या जल-भीरु, और इसलिए मुड़े प्रोटीन में वह कहाँ जा बैठेगा।",
          mr: "बाजूची साखळी हाच अख्खा फरक: तीच ठरवते की अमिनो आम्ल आम्लधर्मी आहे, आम्लारिधर्मी, जलप्रेमी की जलभीरू, आणि म्हणून घडी पडलेल्या प्रथिनात ते कुठे जाऊन बसेल.",
        },
        extra: {
          en: "Nine of the twenty cannot be made by the human body and must come from food, which is what the word essential means in nutrition and why a diet's protein quality is judged by which letters it supplies.",
          hi: "बीस में से नौ मानव शरीर बना नहीं सकता और वे भोजन से आने चाहिए, पोषण में \"आवश्यक\" शब्द का यही अर्थ है और इसीलिए आहार की प्रोटीन-गुणवत्ता इससे आँकी जाती है कि वह कौन-से अक्षर देता है।",
          mr: "वीसांपैकी नऊ मानवी शरीर बनवू शकत नाही आणि ते अन्नातून यावेत, पोषणात \"अत्यावश्यक\" शब्दाचा हाच अर्थ आणि म्हणूनच आहाराची प्रथिन-गुणवत्ता तो कोणती अक्षरे देतो यावरून जोखली जाते.",
        },
        pair: {
          left: {
            en: "Nine letters the body cannot write itself",
            hi: "नौ अक्षर जो शरीर स्वयं नहीं लिख सकता",
            mr: "शरीर स्वतः लिहू शकत नाही अशी नऊ अक्षरे",
          },
          right: {
            en: "twenty letters, and every protein spelled with them",
            hi: "बीस अक्षर, और हर प्रोटीन उन्हीं से लिखा",
            mr: "वीस अक्षरे, आणि प्रत्येक प्रथिन त्यांनीच लिहिलेले",
          },
        },
      },
      {
        id: "the-bond-made-by-removing-water",
        name: {
          en: "The bond made by taking a water away",
          hi: "वह बंध जो पानी हटाकर बनता है",
          mr: "पाणी काढून बनणारा तो बंध",
        },
        kind: "process",
        prompt: {
          en: "Joining two sugars, two amino acids or two nucleotides is the same reaction each time: a hydrogen from one and a hydroxyl from the other leave together, and the gap closes. What is this?",
          hi: "दो शर्कराओं, दो एमीनो अम्लों या दो न्यूक्लियोटाइडों को जोड़ना हर बार वही अभिक्रिया है: एक से हाइड्रोजन और दूसरे से हाइड्रॉक्सिल साथ निकल जाते हैं, और अंतराल बंद हो जाता है। यह क्या है?",
          mr: "दोन साखरा, दोन अमिनो आम्ले वा दोन न्यूक्लिओटाइड जोडणे ही प्रत्येक वेळी तीच अभिक्रिया: एकातून हायड्रोजन आणि दुसऱ्यातून हायड्रॉक्सिल एकत्र निघून जातात, आणि फट बंद होते. हे काय?",
        },
        statement: {
          en: "A condensation reaction joins two units by releasing one molecule of water, and hydrolysis reverses it by adding water back — so a polymer of n units was built by n − 1 condensations.",
          hi: "संघनन अभिक्रिया दो इकाइयों को पानी का एक अणु छोड़कर जोड़ती है, और जल-अपघटन पानी वापस जोड़कर उसे पलट देता है — अतः n इकाइयों का बहुलक n − 1 संघननों से बना है।",
          mr: "संघनन अभिक्रिया दोन एकके पाण्याचा एक रेणू सोडून जोडते, आणि जलअपघटन पाणी परत जोडून ते उलटवते — म्हणून n एककांचे बहुवारिक n − 1 संघननांनी बांधले गेले.",
        },
        detail: {
          en: "The bond is called peptide in a protein, glycosidic in a sugar and phosphodiester in a nucleic acid, but the arithmetic of the water molecules is identical in all three.",
          hi: "उस बंध को प्रोटीन में पेप्टाइड, शर्करा में ग्लाइकोसाइडी और न्यूक्लिक अम्ल में फ़ॉस्फ़ोडाइएस्टर कहते हैं, पर पानी के अणुओं का गणित तीनों में एक ही है।",
          mr: "त्या बंधाला प्रथिनात पेप्टाइड, साखरेत ग्लायकोसिडी आणि न्यूक्लिक आम्लात फॉस्फोडायएस्टर म्हणतात, पण पाण्याच्या रेणूंचे गणित तिन्हींत एकच.",
        },
        extra: {
          en: "Digestion is that arithmetic run backwards: every enzyme in the gut is a hydrolase putting water back in, one molecule per bond broken.",
          hi: "पाचन वही गणित उलटा चलाना है: आँत का हर एंज़ाइम जल-अपघटनी है जो पानी वापस डालता है, प्रति टूटा बंध एक अणु।",
          mr: "पचन म्हणजे तेच गणित उलटे चालवणे: आतड्यातले प्रत्येक एंझाइम जलअपघटनी जे पाणी परत घालते, प्रति तुटलेला बंध एक रेणू.",
        },
        pair: {
          left: {
            en: "Digestion is the same arithmetic reversed",
            hi: "पाचन वही गणित उलटा है",
            mr: "पचन म्हणजे तेच गणित उलटे",
          },
          right: {
            en: "the bond made by taking a water away",
            hi: "वह बंध जो पानी हटाकर बनता है",
            mr: "पाणी काढून बनणारा तो बंध",
          },
        },
      },
      {
        id: "a-chain-that-does-nothing-until-it-folds",
        name: {
          en: "A chain that does nothing until it folds",
          hi: "वह शृंखला जो मुड़ने तक कुछ नहीं करती",
          mr: "घडी पडेपर्यंत काहीच न करणारी साखळी",
        },
        kind: "structure",
        prompt: {
          en: "Boil an egg and the protein is chemically unchanged — every amino acid still there, every bond intact — and yet it will never work again, because what was destroyed was a shape. Which levels are these?",
          hi: "अंडा उबालो और प्रोटीन रासायनिक रूप से अपरिवर्तित है — हर एमीनो अम्ल अब भी वहीं, हर बंध बरक़रार — फिर भी वह कभी काम नहीं करेगा, क्योंकि जो नष्ट हुआ वह आकृति थी। ये कौन-से स्तर हैं?",
          mr: "अंडे उकळा आणि प्रथिन रासायनिकदृष्ट्या अपरिवर्तित — प्रत्येक अमिनो आम्ल अजूनही तिथेच, प्रत्येक बंध शाबूत — तरीही ते पुन्हा कधीच काम करणार नाही, कारण जे नष्ट झाले ती आकृती होती. ही कोणती पातळ्या?",
        },
        statement: {
          en: "A protein has four levels of structure: the primary sequence of amino acids, the secondary helices and sheets held by hydrogen bonds, the tertiary three-dimensional fold, and the quaternary assembly of more than one chain.",
          hi: "प्रोटीन की चार संरचना-स्तर हैं: एमीनो अम्लों का प्राथमिक अनुक्रम, हाइड्रोजन बंधों से थमे द्वितीयक कुंडल और चादरें, तृतीयक त्रिविम मोड़, और एक से अधिक शृंखलाओं का चतुष्क संयोजन।",
          mr: "प्रथिनाच्या संरचनेच्या चार पातळ्या: अमिनो आम्लांचा प्राथमिक अनुक्रम, हायड्रोजन बंधांनी धरलेली द्वितीयक कुंडले आणि पापुद्रे, तृतीयक त्रिमितीय घडी, आणि एकाहून अधिक साखळ्यांची चतुर्थ जुळणी.",
        },
        detail: {
          en: "Only the primary level is held by covalent bonds; the rest is held by hydrogen bonds and weak attractions, which is exactly why heat and acid destroy shape without breaking the chain.",
          hi: "केवल प्राथमिक स्तर सहसंयोजी बंधों से थमा है; बाक़ी हाइड्रोजन बंधों और दुर्बल आकर्षणों से, ठीक इसीलिए ऊष्मा और अम्ल शृंखला तोड़े बिना आकृति नष्ट कर देते हैं।",
          mr: "केवळ प्राथमिक पातळी सहसंयुज बंधांनी धरलेली; बाकी हायड्रोजन बंध आणि दुर्बळ आकर्षणांनी, नेमक्या याच कारणाने उष्णता आणि आम्ल साखळी न तोडता आकृती नष्ट करतात.",
        },
        extra: {
          en: "Haemoglobin is quaternary — four chains, and a single wrong letter in one of them is sickle-cell anaemia, which shows how little of the sequence has to change to ruin the shape.",
          hi: "हीमोग्लोबिन चतुष्क है — चार शृंखलाएँ, और उनमें से एक में एक ही ग़लत अक्षर सिकल-सेल रक्ताल्पता है, जो दिखाता है कि आकृति बिगाड़ने को अनुक्रम का कितना कम बदलना काफ़ी है।",
          mr: "हिमोग्लोबिन चतुर्थ — चार साखळ्या, आणि त्यांतल्या एकातले एकच चुकीचे अक्षर म्हणजे सिकल-सेल पंडुरोग, जे दाखवते की आकृती बिघडवायला अनुक्रमाचे किती थोडे बदलणे पुरते.",
        },
        pair: {
          left: {
            en: "One wrong letter in four chains",
            hi: "चार शृंखलाओं में एक ग़लत अक्षर",
            mr: "चार साखळ्यांत एक चुकीचे अक्षर",
          },
          right: {
            en: "a chain that does nothing until it folds",
            hi: "वह शृंखला जो मुड़ने तक कुछ नहीं करती",
            mr: "घडी पडेपर्यंत काहीच न करणारी साखळी",
          },
        },
      },
      {
        id: "same-brick-different-mortar",
        name: {
          en: "Same brick, different mortar",
          hi: "वही ईंट, दूसरा गारा",
          mr: "तीच वीट, वेगळा चुना",
        },
        kind: "contrast",
        prompt: {
          en: "Bread and wood are both long chains of nothing but glucose, and a human digests one and cannot touch the other, because the two chains differ only in the orientation of the link. Which contrast is this?",
          hi: "रोटी और लकड़ी दोनों केवल ग्लूकोज़ की लंबी शृंखलाएँ हैं, और मनुष्य एक पचा लेता है और दूसरी को छू भी नहीं सकता, क्योंकि दोनों शृंखलाएँ केवल कड़ी के अभिविन्यास में भिन्न हैं। यह कौन-सा विरोध है?",
          mr: "भाकरी आणि लाकूड दोन्ही केवळ ग्लुकोजच्या लांब साखळ्या, आणि माणूस एक पचवतो आणि दुसरीला स्पर्शही करू शकत नाही, कारण दोन्ही साखळ्या केवळ दुव्याच्या अभिमुखतेत वेगळ्या. हा कोणता विरोध?",
        },
        statement: {
          en: "Starch and cellulose are both polymers of glucose, joined by alpha links in starch and beta links in cellulose, and human enzymes fit only the alpha form.",
          hi: "मंड और सेलुलोस दोनों ग्लूकोज़ के बहुलक हैं, मंड में एल्फ़ा कड़ियों से जुड़े और सेलुलोस में बीटा कड़ियों से, और मानव एंज़ाइम केवल एल्फ़ा रूप में फिट होते हैं।",
          mr: "पिष्ट आणि सेल्युलोज दोन्ही ग्लुकोजची बहुवारिके, पिष्टात अल्फा दुव्यांनी जोडलेली आणि सेल्युलोजात बीटा दुव्यांनी, आणि मानवी एंझाइम केवळ अल्फा रूपात बसतात.",
        },
        detail: {
          en: "The beta link flips every second glucose upside down, so the chain lies straight and packs into fibres, while the alpha link curls it into a helix that an enzyme can get at.",
          hi: "बीटा कड़ी हर दूसरे ग्लूकोज़ को उलट देती है, अतः शृंखला सीधी पड़ती है और तंतुओं में जमती है, जबकि एल्फ़ा कड़ी उसे कुंडली में लपेट देती है जहाँ एंज़ाइम पहुँच सकता है।",
          mr: "बीटा दुवा प्रत्येक दुसऱ्या ग्लुकोजला उलटा करतो, म्हणून साखळी सरळ पडते आणि तंतूंत बसते, तर अल्फा दुवा तिला कुंडलीत गुंडाळतो जिथे एंझाइम पोहोचू शकते.",
        },
        extra: {
          en: "A cow cannot digest cellulose either; the bacteria in its rumen can, which is why a herbivore is really a container for microbes that pay rent in sugar.",
          hi: "गाय भी सेलुलोस नहीं पचा सकती; उसके रुमेन के जीवाणु पचा सकते हैं, इसीलिए शाकाहारी असल में उन सूक्ष्मजीवों का पात्र है जो शर्करा में किराया चुकाते हैं।",
          mr: "गायही सेल्युलोज पचवू शकत नाही; तिच्या रुमेनमधले जीवाणू पचवू शकतात, म्हणूनच शाकाहारी प्राणी खरे तर साखरेत भाडे देणाऱ्या सूक्ष्मजीवांचे भांडे आहे.",
        },
        pair: {
          left: {
            en: "The cow does not digest grass; its bacteria do",
            hi: "गाय घास नहीं पचाती; उसके जीवाणु पचाते हैं",
            mr: "गाय गवत पचवत नाही; तिचे जीवाणू पचवतात",
          },
          right: {
            en: "same brick, different mortar",
            hi: "वही ईंट, दूसरा गारा",
            mr: "तीच वीट, वेगळा चुना",
          },
        },
      },
      {
        id: "lowering-the-hill-without-moving-the-ends",
        name: {
          en: "Lowering the hill without moving either end",
          hi: "कोई सिरा हिलाए बिना पहाड़ी नीची करना",
          mr: "कोणतेही टोक न हलवता टेकडी खाली आणणे",
        },
        kind: "principle",
        prompt: {
          en: "A reaction that would take a century in a beaker finishes in a second in a cell, and yet the products are the same, the energy released is the same, and the catalyst comes out unchanged. What is this?",
          hi: "जो अभिक्रिया बीकर में सदी भर लेती, वह कोशिका में सेकंड भर में पूरी हो जाती है, फिर भी उत्पाद वही हैं, निकली ऊर्जा वही है, और उत्प्रेरक अपरिवर्तित बाहर आता है। यह क्या है?",
          mr: "जी अभिक्रिया चंचूपात्रात शतकभर घेतली असती, ती पेशीत सेकंदात पूर्ण होते, तरीही उत्पादे तीच, निघालेली ऊर्जा तीच, आणि उत्प्रेरक अपरिवर्तित बाहेर येतो. हे काय?",
        },
        statement: {
          en: "An enzyme is a protein catalyst that lowers the activation energy of a reaction, speeding it up enormously without altering the energy of the reactants or products and without being consumed.",
          hi: "एंज़ाइम प्रोटीन उत्प्रेरक है जो अभिक्रिया की सक्रियण ऊर्जा घटाता है, उसे अत्यधिक तेज़ करते हुए, बिना अभिकारकों या उत्पादों की ऊर्जा बदले और बिना स्वयं ख़र्च हुए।",
          mr: "एंझाइम हा प्रथिन उत्प्रेरक जो अभिक्रियेची सक्रियण ऊर्जा घटवतो, तिला प्रचंड वेगवान करत, अभिक्रियाकारक वा उत्पादांची ऊर्जा न बदलता आणि स्वतः खर्च न होता.",
        },
        detail: {
          en: "It works by binding the reactants in an active site shaped to hold them in the arrangement they must pass through, so the improbable step becomes the likely one.",
          hi: "वह अभिकारकों को ऐसे सक्रिय स्थल में बाँधकर काम करता है जो उन्हें उसी व्यवस्था में थामने को गढ़ा है जिससे उन्हें गुज़रना है, अतः असंभाव्य क़दम संभाव्य बन जाता है।",
          mr: "तो अभिक्रियाकारकांना अशा सक्रिय स्थळात बांधून काम करतो जे त्यांना ज्या मांडणीतून जायचे आहे तीच धरण्यासाठी घडवलेले, म्हणून असंभाव्य पाऊल संभाव्य बनते.",
        },
        extra: {
          en: "Because the active site is a shape, an enzyme stops working the moment its protein unfolds, which is why a fever of a few degrees is dangerous and why every enzyme has a temperature and a pH at which it is fastest.",
          hi: "चूँकि सक्रिय स्थल एक आकृति है, प्रोटीन के खुलते ही एंज़ाइम काम करना बंद कर देता है, इसीलिए कुछ अंश का ज्वर ख़तरनाक है और इसीलिए हर एंज़ाइम का एक ताप और एक pH है जिस पर वह सबसे तेज़ है।",
          mr: "सक्रिय स्थळ ही आकृती असल्याने, प्रथिनाची घडी उलगडताच एंझाइम काम करणे थांबवते, म्हणूनच काही अंशांचा ताप धोकादायक आणि म्हणूनच प्रत्येक एंझाइमला एक तापमान आणि एक pH आहे ज्यावर तो सर्वांत वेगवान.",
        },
        pair: {
          left: {
            en: "A few degrees of fever is dangerous",
            hi: "कुछ अंश का ज्वर ख़तरनाक है",
            mr: "काही अंशांचा ताप धोकादायक आहे",
          },
          right: {
            en: "lowering the hill without moving either end",
            hi: "कोई सिरा हिलाए बिना पहाड़ी नीची करना",
            mr: "कोणतेही टोक न हलवता टेकडी खाली आणणे",
          },
        },
      },
      {
        id: "three-parts-and-only-one-varies",
        name: {
          en: "Three parts, and only one of them varies",
          hi: "तीन भाग, और उनमें से केवल एक बदलता है",
          mr: "तीन भाग, आणि त्यांतला केवळ एक बदलतो",
        },
        kind: "structure",
        prompt: {
          en: "Every unit of DNA carries a sugar and a phosphate that are identical in all of them, and a third piece that comes in four kinds — and the whole of heredity is written in that third piece. What is this?",
          hi: "DNA की हर इकाई में एक शर्करा और एक फ़ॉस्फ़ेट है जो सब में समान हैं, और तीसरा टुकड़ा जो चार क़िस्मों में आता है — और पूरी आनुवंशिकता उसी तीसरे टुकड़े में लिखी है। यह क्या है?",
          mr: "DNA च्या प्रत्येक एककात एक साखर आणि एक फॉस्फेट जे सर्वांत सारखे, आणि तिसरा तुकडा जो चार प्रकारांत येतो — आणि अख्खी अनुवंशिकता त्याच तिसऱ्या तुकड्यात लिहिलेली. हे काय?",
        },
        statement: {
          en: "A nucleotide is a phosphate, a five-carbon sugar and a nitrogenous base, and only the base varies — adenine, guanine, cytosine and thymine in DNA, with uracil replacing thymine in RNA.",
          hi: "न्यूक्लियोटाइड एक फ़ॉस्फ़ेट, एक पाँच-कार्बन शर्करा और एक नाइट्रोजनी क्षारक है, और केवल क्षारक बदलता है — DNA में एडेनीन, ग्वानीन, साइटोसीन और थायमीन, और RNA में थायमीन की जगह यूरैसिल।",
          mr: "न्यूक्लिओटाइड म्हणजे एक फॉस्फेट, एक पाच-कार्बन साखर आणि एक नायट्रोजनी आम्लारी, आणि केवळ आम्लारी बदलतो — DNA मध्ये अॅडेनिन, ग्वानिन, सायटोसिन आणि थायमिन, आणि RNA मध्ये थायमिनऐवजी युरॅसिल.",
        },
        detail: {
          en: "The sugar names the acid: deoxyribose gives DNA and ribose gives RNA, and that one missing oxygen is why DNA is the stabler of the two and got the job of long-term storage.",
          hi: "शर्करा ही अम्ल का नाम रखती है: डिऑक्सीराइबोज़ DNA देती है और राइबोज़ RNA, और वही एक ग़ायब ऑक्सीजन कारण है कि DNA दोनों में अधिक स्थायी है और उसे दीर्घकालिक भंडारण का काम मिला।",
          mr: "साखरच आम्लाचे नाव ठेवते: डिऑक्सिरायबोज DNA देते आणि रायबोज RNA, आणि तोच एक हरवलेला ऑक्सिजन कारण की DNA दोघांत अधिक स्थिर आणि त्याला दीर्घकालीन साठवणीचे काम मिळाले.",
        },
        extra: {
          en: "The bases pair by size and by hydrogen bonds — A with T by two, G with C by three — which is why the two strands carry the same information and either can rebuild the other.",
          hi: "क्षारक आकार और हाइड्रोजन बंधों से युग्मित होते हैं — A के साथ T दो से, G के साथ C तीन से — इसीलिए दोनों लड़ियाँ वही सूचना ढोती हैं और कोई भी दूसरी को फिर से बना सकती है।",
          mr: "आम्लारी आकाराने आणि हायड्रोजन बंधांनी जोड्या बनवतात — A सोबत T दोनने, G सोबत C तीनने — म्हणूनच दोन्ही तंतू तीच माहिती वाहतात आणि कोणताही दुसरा पुन्हा बांधू शकतो.",
        },
        pair: {
          left: {
            en: "Either strand can rebuild the other",
            hi: "कोई भी लड़ी दूसरी को फिर बना सकती है",
            mr: "कोणताही तंतू दुसरा पुन्हा बांधू शकतो",
          },
          right: {
            en: "three parts, and only one of them varies",
            hi: "तीन भाग, और उनमें से केवल एक बदलता है",
            mr: "तीन भाग, आणि त्यांतला केवळ एक बदलतो",
          },
        },
      },
      /*F9B*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student says boiling destroys a protein by breaking it into its amino acids, which is why a boiled egg cannot be un-boiled. Correct the mechanism, and say what actually cannot be undone.",
          hi: "एक विद्यार्थी कहता है कि उबालना प्रोटीन को उसके एमीनो अम्लों में तोड़कर नष्ट कर देता है, इसीलिए उबला अंडा वापस कच्चा नहीं हो सकता। क्रियाविधि सुधारो, और बताओ कि वस्तुतः पलटा क्या नहीं जा सकता।",
          mr: "एक विद्यार्थी म्हणतो की उकळणे प्रथिनाला त्याच्या अमिनो आम्लांत तोडून नष्ट करते, म्हणूनच उकडलेले अंडे पुन्हा कच्चे होऊ शकत नाही. कार्यपद्धती दुरुस्त करा, आणि प्रत्यक्षात काय उलटवता येत नाही ते सांगा.",
        },
        choices: [
          {
            en: "Nothing is broken into amino acids. The peptide bonds are covalent and heat of that order does not touch them, so the primary structure — the sequence — survives a boiling intact. What heat destroys is the hydrogen bonds and weak attractions holding the secondary, tertiary and quaternary levels, so the chain unfolds. That is denaturation. It is irreversible in practice not because a bond was cut but because the unfolded chains tangle with each other and cannot find their way back to a single correct shape",
            hi: "कुछ भी एमीनो अम्लों में नहीं टूटता। पेप्टाइड बंध सहसंयोजी हैं और उस कोटि की ऊष्मा उन्हें छूती नहीं, अतः प्राथमिक संरचना — अनुक्रम — उबलने में साबुत बच जाती है। ऊष्मा जो नष्ट करती है वे हाइड्रोजन बंध और दुर्बल आकर्षण हैं जो द्वितीयक, तृतीयक और चतुष्क स्तरों को थामे हैं, अतः शृंखला खुल जाती है। यही विकृतीकरण है। वह व्यवहार में अपरिवर्तनीय इसलिए है, बंध कटने से नहीं, कि खुली शृंखलाएँ आपस में उलझ जाती हैं और एक सही आकृति तक वापस राह नहीं पातीं",
            mr: "काहीही अमिनो आम्लांत तुटत नाही. पेप्टाइड बंध सहसंयुज आहेत आणि त्या कोटीची उष्णता त्यांना स्पर्शही करत नाही, म्हणून प्राथमिक संरचना — अनुक्रम — उकळण्यातून शाबूत राहते. उष्णता जे नष्ट करते ते हायड्रोजन बंध आणि दुर्बळ आकर्षणे जी द्वितीयक, तृतीयक आणि चतुर्थ पातळ्या धरून ठेवतात, म्हणून साखळी उलगडते. हेच विकृतीकरण. ते व्यवहारात अपरिवर्तनीय बंध कापला गेला म्हणून नव्हे, तर उलगडलेल्या साखळ्या एकमेकींत गुंतून जातात आणि एका बरोबर आकृतीकडे परतीचा मार्ग सापडत नाही म्हणून",
          },
          {
            en: "The student is right: boiling hydrolyses every peptide bond, which is exactly what digestion does more slowly",
            hi: "विद्यार्थी सही है: उबालना हर पेप्टाइड बंध का जल-अपघटन कर देता है, ठीक वही जो पाचन धीरे-धीरे करता है",
            mr: "विद्यार्थी बरोबर: उकळणे प्रत्येक पेप्टाइड बंधाचे जलअपघटन करते, नेमके तेच जे पचन सावकाश करते",
          },
          {
            en: "Boiling breaks the primary structure but leaves the folding intact, which is why the egg keeps its shape while losing its function",
            hi: "उबालना प्राथमिक संरचना तोड़ता है पर मुड़ान को बरक़रार छोड़ देता है, इसीलिए अंडा अपना आकार रखता है और कार्य खो देता है",
            mr: "उकळणे प्राथमिक संरचना तोडते पण घडी शाबूत ठेवते, म्हणूनच अंडे आपला आकार टिकवते आणि कार्य गमावते",
          },
          {
            en: "Boiling changes the amino acid sequence by swapping side chains, and a protein with a new sequence cannot fold the old way",
            hi: "उबालना पार्श्व शृंखलाएँ अदल-बदलकर एमीनो अम्ल अनुक्रम बदल देता है, और नए अनुक्रम वाला प्रोटीन पुराने ढंग से नहीं मुड़ सकता",
            mr: "उकळणे बाजूच्या साखळ्या अदलाबदल करून अमिनो आम्ल अनुक्रम बदलते, आणि नव्या अनुक्रमाचे प्रथिन जुन्या पद्धतीने घडी घालू शकत नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The word destroy is doing the damage here, because it hides which of four levels was destroyed. A protein's structure comes in four levels held by two very different kinds of force, and the whole answer is in that asymmetry. The primary structure is the sequence of amino acids, and it is held by PEPTIDE BONDS — covalent, sharing electrons, taking hundreds of kilojoules per mole to break. Boiling water supplies nothing like that. So after twenty minutes at a hundred degrees, every peptide bond in the egg is exactly where it was, and the chain is the same length with the same letters in the same order as when the hen laid it. The secondary, tertiary and quaternary levels are a different matter. Helices and sheets are held by hydrogen bonds; the three-dimensional fold is held by hydrogen bonds, ionic attractions, hydrophobic clustering and the occasional disulphide bridge. Almost all of those are weak — a few tens of kilojoules per mole at most, and hydrogen bonds far less. Heat is molecular motion, and enough of it shakes those weak attractions apart while leaving the covalent backbone untouched. The chain, no longer held, unfolds. That is denaturation, and its definition is precise: loss of higher-order structure with the primary sequence intact. Now why it does not come back, which is the part the student's version cannot explain at all. In principle an unfolded chain should be able to refold — the information for the correct shape is in the sequence, and the sequence survived. In a dilute solution, some proteins do exactly that. In an egg white, the protein is concentrated, and the moment the chains unfold their sticky hydrophobic interiors are exposed to each other rather than only to water. They aggregate. Chain A's buried patch finds chain B's rather than its own, and thousands of chains lock into an insoluble tangle — the white solid. Nothing was cut; everything was mis-stuck. That the sequence survives is not an academic point. It is why boiled egg is still nutritious — digestion hydrolyses those peptide bonds afterwards, one water molecule per bond, and the amino acids are recovered exactly as they would have been from a raw one. Cooking has cost the egg its function and none of its food value. And it is why denaturation is used deliberately: heat sterilises by unfolding a bacterium's enzymes, curd sets when acid denatures milk protein, and a fever of three degrees is dangerous for exactly the reason an enzyme is a shape. The habit worth taking away is to ask, whenever something is said to be destroyed, WHICH level was destroyed and by what force — a question that separates covalent from non-covalent and usually answers itself. (The second answer confuses denaturation with hydrolysis, which is the entire error being corrected; the third inverts the two levels; and the fourth invents a chemistry in which heat rewrites a sequence, which no amount of boiling does.)",
          hi: "यहाँ नुक़सान \"नष्ट\" शब्द कर रहा है, क्योंकि वह छिपा देता है कि चार में से कौन-सा स्तर नष्ट हुआ। प्रोटीन की संरचना चार स्तरों में आती है जिन्हें दो बहुत भिन्न क़िस्म के बल थामे हैं, और पूरा उत्तर उसी असममिति में है। प्राथमिक संरचना एमीनो अम्लों का अनुक्रम है, और उसे पेप्टाइड बंध थामे हैं — सहसंयोजी, इलेक्ट्रॉन साझा करते, तोड़ने को प्रति मोल सैकड़ों किलोजूल माँगते। उबलता पानी वैसा कुछ नहीं देता। अतः सौ अंश पर बीस मिनट के बाद अंडे का हर पेप्टाइड बंध ठीक वहीं है जहाँ था, और शृंखला उसी लंबाई की है, वही अक्षर उसी क्रम में, जैसी मुर्गी ने दी थी। द्वितीयक, तृतीयक और चतुष्क स्तर दूसरी बात हैं। कुंडल और चादरें हाइड्रोजन बंधों से थमी हैं; त्रिविम मोड़ हाइड्रोजन बंधों, आयनिक आकर्षणों, जल-भीरु गुच्छन और कभी-कभार डाइसल्फ़ाइड सेतु से। उनमें लगभग सब दुर्बल हैं — अधिक से अधिक कुछ दसियों किलोजूल प्रति मोल, और हाइड्रोजन बंध उससे कहीं कम। ऊष्मा आणविक गति है, और उसकी पर्याप्त मात्रा उन दुर्बल आकर्षणों को हिलाकर अलग कर देती है और सहसंयोजी ढाँचे को अछूता छोड़ देती है। शृंखला, अब बिना थमे, खुल जाती है। यही विकृतीकरण है, और उसकी परिभाषा सटीक है: प्राथमिक अनुक्रम बरक़रार रखते हुए उच्चतर संरचना की हानि। अब वह लौटती क्यों नहीं, और यही वह भाग है जिसे विद्यार्थी का संस्करण समझा ही नहीं सकता। सिद्धांततः खुली शृंखला को फिर मुड़ सकना चाहिए — सही आकृति की सूचना अनुक्रम में है, और अनुक्रम बच गया। तनु विलयन में कुछ प्रोटीन ठीक वही करते हैं। अंडे की सफ़ेदी में प्रोटीन सांद्र है, और शृंखलाओं के खुलते ही उनके चिपचिपे जल-भीरु भीतरी भाग केवल पानी के नहीं, एक-दूसरे के सामने आ जाते हैं। वे संगुच्छित हो जाती हैं। शृंखला A का दबा हुआ टुकड़ा अपने नहीं, शृंखला B का पा लेता है, और हज़ारों शृंखलाएँ अघुलनशील उलझन में जकड़ जाती हैं — वही सफ़ेद ठोस। कुछ काटा नहीं गया; सब कुछ ग़लत चिपक गया। अनुक्रम का बच जाना कोई शैक्षणिक बात नहीं। इसीलिए उबला अंडा अब भी पौष्टिक है — पाचन बाद में उन्हीं पेप्टाइड बंधों का जल-अपघटन करता है, प्रति बंध पानी का एक अणु, और एमीनो अम्ल ठीक वैसे ही मिल जाते हैं जैसे कच्चे से मिलते। पकाने ने अंडे से उसका कार्य लिया है, उसका कोई भोजन-मूल्य नहीं। और इसीलिए विकृतीकरण जानबूझकर बरता जाता है: ऊष्मा जीवाणु के एंज़ाइम खोलकर निर्जर्मीकरण करती है, अम्ल दूध का प्रोटीन विकृत करे तो दही जमता है, और तीन अंश का ज्वर ठीक उसी कारण ख़तरनाक है जिस कारण एंज़ाइम एक आकृति है। ले जाने योग्य आदत यह है कि जब भी कहा जाए कि कुछ नष्ट हुआ, पूछो कौन-सा स्तर नष्ट हुआ और किस बल से — ऐसा प्रश्न जो सहसंयोजी को असहसंयोजी से अलग कर देता है और प्रायः स्वयं उत्तर दे देता है। (दूसरा उत्तर विकृतीकरण को जल-अपघटन से गड्डमड्ड करता है, और वही पूरी भूल सुधारी जा रही है; तीसरा दोनों स्तर उलट देता है; और चौथा ऐसा रसायन गढ़ता है जिसमें ऊष्मा अनुक्रम फिर से लिख देती है, जो कितना भी उबालने से नहीं होता।)",
          mr: "इथे नुकसान \"नष्ट\" हा शब्द करत आहे, कारण तो लपवतो की चारांपैकी कोणती पातळी नष्ट झाली. प्रथिनाची संरचना चार पातळ्यांत येते ज्या दोन अतिशय वेगळ्या प्रकारच्या बलांनी धरलेल्या, आणि अख्खे उत्तर त्याच असममितीत आहे. प्राथमिक संरचना म्हणजे अमिनो आम्लांचा अनुक्रम, आणि तो पेप्टाइड बंधांनी धरलेला — सहसंयुज, इलेक्ट्रॉन वाटून घेणारे, तोडायला प्रति मोल शेकडो किलोज्यूल मागणारे. उकळते पाणी तसे काहीही देत नाही. म्हणून शंभर अंशांवर वीस मिनिटांनंतर अंड्यातला प्रत्येक पेप्टाइड बंध नेमका तिथेच जिथे होता, आणि साखळी त्याच लांबीची, तीच अक्षरे त्याच क्रमात, जशी कोंबडीने घातली होती. द्वितीयक, तृतीयक आणि चतुर्थ पातळ्या वेगळी बाब. कुंडले आणि पापुद्रे हायड्रोजन बंधांनी धरलेले; त्रिमितीय घडी हायड्रोजन बंध, आयनिक आकर्षणे, जलभीरू गुच्छन आणि क्वचित डायसल्फाइड पूल यांनी. त्यांतली जवळपास सर्व दुर्बळ — फार तर काही दहा किलोज्यूल प्रति मोल, आणि हायड्रोजन बंध त्याहून कितीतरी कमी. उष्णता ही रेणवीय हालचाल, आणि तिची पुरेशी मात्रा त्या दुर्बळ आकर्षणांना हलवून वेगळे करते आणि सहसंयुज सांगाड्याला अस्पर्श सोडते. साखळी, आता न धरलेली, उलगडते. हेच विकृतीकरण, आणि त्याची व्याख्या नेमकी: प्राथमिक अनुक्रम शाबूत ठेवून उच्चतर संरचनेची हानी. आता ती परत का येत नाही, आणि हाच तो भाग जो विद्यार्थ्याची आवृत्ती समजावूच शकत नाही. तत्त्वतः उलगडलेल्या साखळीला पुन्हा घडी घालता यावी — बरोबर आकृतीची माहिती अनुक्रमात आहे, आणि अनुक्रम वाचला. विरळ द्रावणात काही प्रथिने नेमके तेच करतात. अंड्याच्या पांढऱ्यात प्रथिन संहत आहे, आणि साखळ्या उलगडताच त्यांचे चिकट जलभीरू आतले भाग केवळ पाण्यासमोर नव्हे, एकमेकांसमोर येतात. त्या गुच्छ बनवतात. साखळी A चा दडलेला ठिपका आपला नव्हे, साखळी B चा सापडतो, आणि हजारो साखळ्या अविद्राव्य गुंत्यात अडकतात — तोच पांढरा घनपदार्थ. काहीही कापले गेले नाही; सर्व काही चुकीचे चिकटले. अनुक्रम वाचणे ही शैक्षणिक बाब नव्हे. म्हणूनच उकडलेले अंडे अजूनही पौष्टिक — पचन नंतर त्याच पेप्टाइड बंधांचे जलअपघटन करते, प्रति बंध पाण्याचा एक रेणू, आणि अमिनो आम्ले नेमकी तशीच मिळतात जशी कच्च्यातून मिळाली असती. शिजवण्याने अंड्याकडून त्याचे कार्य घेतले, त्याचे कोणतेही अन्नमूल्य नाही. आणि म्हणूनच विकृतीकरण मुद्दाम वापरले जाते: उष्णता जीवाणूची एंझाइमे उलगडून निर्जंतुकीकरण करते, आम्लाने दुधाचे प्रथिन विकृत झाले की दही लागते, आणि तीन अंशांचा ताप नेमक्या त्याच कारणाने धोकादायक ज्या कारणाने एंझाइम ही आकृती आहे. नेण्याजोगी सवय अशी की जेव्हा जेव्हा काही नष्ट झाले असे म्हटले जाईल, विचारा कोणती पातळी नष्ट झाली आणि कोणत्या बलाने — असा प्रश्न जो सहसंयुजाला असहसंयुजापासून वेगळे करतो आणि बहुधा स्वतःच उत्तर देतो. (दुसरे उत्तर विकृतीकरणाला जलअपघटनाशी गोंधळवते, आणि तीच अख्खी चूक दुरुस्त केली जात आहे; तिसरे दोन्ही पातळ्या उलटवते; आणि चौथे असे रसायन रचते ज्यात उष्णता अनुक्रम पुन्हा लिहिते, जे कितीही उकळल्याने होत नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Cellulose and starch are both chains of glucose, yet a human lives on one and cannot digest a gram of the other. Explain why, and say what a termite does differently.",
          hi: "सेलुलोस और मंड दोनों ग्लूकोज़ की शृंखलाएँ हैं, फिर भी मनुष्य एक पर जीता है और दूसरे का एक ग्राम भी नहीं पचा सकता। बताओ क्यों, और दीमक अलग क्या करती है।",
          mr: "सेल्युलोज आणि पिष्ट दोन्ही ग्लुकोजच्या साखळ्या, तरीही माणूस एकावर जगतो आणि दुसऱ्याचा एक ग्रॅमही पचवू शकत नाही. का ते समजावा, आणि वाळवी वेगळे काय करते ते सांगा.",
        },
        choices: [
          {
            en: "The monomer is identical; the LINK is not. Starch joins its glucoses by alpha links from carbon one to carbon four and cellulose by beta links between the same two carbons, which flips every second unit over, so the cellulose chain lies flat and packs into hydrogen-bonded fibres while starch curls into a helix. An enzyme's active site is a shape, and human amylase fits only the alpha link — so cellulose passes through undigested, as fibre. A termite has no cellulase either: protists and bacteria in its gut do, and the termite lives on what they release",
            hi: "एकलक समान है; कड़ी नहीं। मंड अपने ग्लूकोज़ कार्बन एक से कार्बन चार तक एल्फ़ा कड़ियों से जोड़ता है और सेलुलोस उन्हीं दो कार्बनों के बीच बीटा कड़ियों से, जो हर दूसरी इकाई उलट देता है, अतः सेलुलोस की शृंखला चपटी पड़ती है और हाइड्रोजन-बद्ध तंतुओं में जमती है जबकि मंड कुंडली में लिपट जाता है। एंज़ाइम का सक्रिय स्थल एक आकृति है, और मानव एमाइलेज केवल एल्फ़ा कड़ी में फिट होता है — अतः सेलुलोस बिना पचे रेशे के रूप में निकल जाता है। दीमक के पास भी सेल्युलेज नहीं: उसकी आँत के प्रोटिस्ट और जीवाणुओं के पास है, और दीमक उसी पर जीती है जो वे छोड़ते हैं",
            mr: "एकवारिक सारखे; दुवा नाही. पिष्ट आपले ग्लुकोज कार्बन एकपासून कार्बन चारपर्यंत अल्फा दुव्यांनी जोडते आणि सेल्युलोज त्याच दोन कार्बनांमधल्या बीटा दुव्यांनी, जो प्रत्येक दुसरे एकक उलटवतो, म्हणून सेल्युलोजची साखळी सपाट पडते आणि हायड्रोजन-बद्ध तंतूंत बसते तर पिष्ट कुंडलीत गुंडाळते. एंझाइमचे सक्रिय स्थळ ही आकृती आहे, आणि मानवी अमायलेज केवळ अल्फा दुव्यात बसते — म्हणून सेल्युलोज न पचता तंतू म्हणून निघून जाते. वाळवीकडेही सेल्युलेज नाही: तिच्या आतड्यातल्या प्रोटिस्ट आणि जीवाणूंकडे आहे, आणि वाळवी ते जे सोडतात त्यावर जगते",
          },
          {
            en: "Starch is made of glucose and cellulose of a different sugar altogether, which is why one enzyme cannot handle both",
            hi: "मंड ग्लूकोज़ से बना है और सेलुलोस बिलकुल दूसरी शर्करा से, इसीलिए एक एंज़ाइम दोनों नहीं सँभाल सकता",
            mr: "पिष्ट ग्लुकोजचे बनलेले आणि सेल्युलोज पूर्णपणे वेगळ्या साखरेचे, म्हणूनच एक एंझाइम दोन्ही हाताळू शकत नाही",
          },
          {
            en: "Cellulose chains are simply too long for any enzyme to reach the ends of, and a termite solves this by chewing the wood into shorter pieces first",
            hi: "सेलुलोस की शृंखलाएँ बस इतनी लंबी हैं कि कोई एंज़ाइम उनके सिरों तक नहीं पहुँच सकता, और दीमक इसे पहले लकड़ी को छोटे टुकड़ों में चबाकर हल करती है",
            mr: "सेल्युलोजच्या साखळ्या फक्त इतक्या लांब की कोणतेही एंझाइम त्यांच्या टोकांपर्यंत पोहोचू शकत नाही, आणि वाळवी हे आधी लाकूड लहान तुकड्यांत चावून सोडवते",
          },
          {
            en: "Humans lack the enzyme because cellulose is not a food, and a termite makes its own cellulase in its salivary glands",
            hi: "मनुष्यों में एंज़ाइम नहीं क्योंकि सेलुलोस भोजन ही नहीं है, और दीमक अपनी लार-ग्रंथियों में अपना सेल्युलेज स्वयं बनाती है",
            mr: "माणसांत एंझाइम नाही कारण सेल्युलोज अन्नच नाही, आणि वाळवी आपल्या लाळग्रंथींत स्वतःचे सेल्युलेज स्वतः बनवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Two polymers, one monomer, and the entire difference is in a bond's geometry — which makes this the cleanest demonstration in the chapter that in biology arrangement matters more than composition. Glucose is a six-carbon ring, and its carbon-1 hydroxyl can point either below the ring plane (alpha) or above it (beta). Link carbon 1 of one glucose to carbon 4 of the next and you get a link between carbon one and carbon four either way, but the two are geometrically different. In the alpha form, successive glucoses tilt the same way, and the chain curves — starch's amylose is a helix, loose and open, with its bonds exposed on the outside of the coil. In the beta form, each glucose must rotate 180 degrees relative to its neighbour for the link to form at all, so the chain alternates and comes out perfectly straight. A straight chain can lie against its neighbours along its whole length, and cellulose chains do exactly that, hydrogen-bonding to each other into microfibrils with the tensile strength of steel wire by weight. This is why wood is structural and bread is not, from the same sugar. Now the enzyme. An active site works by shape complementarity, and the shape it must complement here is the bond and the two rings on either side of it. Human amylase evolved fitting the alpha geometry; the beta link presents a mirror-like arrangement that will not seat in that pocket. Nothing about cellulose is chemically tougher — a laboratory can hydrolyse it with acid and heat quite easily — it is simply the wrong shape for the tools we have. Add that the fibrils are packed and hydrogen-bonded, so even a correct enzyme faces a crystalline surface rather than a loose chain, and cellulose passes through the human gut essentially untouched. That is dietary fibre, and it is useful for exactly that reason: it adds bulk and holds water without adding a calorie. The termite is the interesting half, because the answer is not the one the phrase wood-eating insect suggests. Termites do not make cellulase — or, in some species, make a little and cannot manage on it. What digests the wood is a community of flagellate protists and bacteria in the hindgut, which secrete cellulases, break the beta links, and release glucose and short-chain fatty acids the termite absorbs. Remove that community, by heat or by antibiotic, and the termite starves in a gut full of sawdust. The same arrangement runs a cow: the rumen is a fermentation vessel of microbes, and a cow is best described as an animal that farms bacteria and eats the crop. The generalisable idea has two halves. First, in polymers, the LINK carries as much information as the unit — the same lesson organic chemistry teaches with isomers and this chapter repeats with sugars. Second, an organism's diet is not a list of what it can chew but of what its enzymes — its own or its tenants' — can take apart, which is why so much of nutrition is really microbiology. (The second answer denies the shared monomer, which is the fact the question rests on; the third invents a length problem, when chain length is not what defeats amylase; and the fourth misplaces the cellulase, when the termite's own contribution is minor and the gut community does the work.)",
          hi: "दो बहुलक, एक एकलक, और पूरा भेद एक बंध की ज्यामिति में है — जो इसे अध्याय का सबसे साफ़ प्रदर्शन बनाता है कि जीवविज्ञान में व्यवस्था संघटन से अधिक मायने रखती है। ग्लूकोज़ छह-कार्बन वलय है, और उसके कार्बन-1 का हाइड्रॉक्सिल वलय-तल के नीचे (एल्फ़ा) या ऊपर (बीटा) संकेत कर सकता है। एक ग्लूकोज़ के कार्बन 1 को अगले के कार्बन 4 से जोड़ो और दोनों हाल में कार्बन एक और कार्बन चार के बीच कड़ी मिलती है, पर दोनों ज्यामितीय रूप से भिन्न हैं। एल्फ़ा रूप में क्रमिक ग्लूकोज़ उसी ओर झुकते हैं, और शृंखला मुड़ती है — मंड का एमाइलोज़ कुंडली है, ढीली और खुली, जिसके बंध कुंडली के बाहर उजागर हैं। बीटा रूप में हर ग्लूकोज़ को अपने पड़ोसी के सापेक्ष 180 अंश घूमना ही पड़ता है ताकि कड़ी बन सके, अतः शृंखला बारी-बारी चलती है और पूर्णतः सीधी निकलती है। सीधी शृंखला अपनी पूरी लंबाई में पड़ोसियों से सट सकती है, और सेलुलोस की शृंखलाएँ ठीक वही करती हैं, आपस में हाइड्रोजन-बंध बनाकर सूक्ष्म-तंतुओं में जमती हैं जिनकी भार के अनुपात में तन्य शक्ति इस्पात के तार जितनी है। इसीलिए उसी शर्करा से लकड़ी संरचनात्मक है और रोटी नहीं। अब एंज़ाइम। सक्रिय स्थल आकृति की पूरकता से काम करता है, और यहाँ उसे जिस आकृति का पूरक बनना है वह बंध और उसके दोनों ओर के दो वलय हैं। मानव एमाइलेज एल्फ़ा ज्यामिति में फिट होते हुए विकसित हुआ; बीटा कड़ी दर्पण-जैसी व्यवस्था प्रस्तुत करती है जो उस खाँचे में बैठेगी नहीं। सेलुलोस के बारे में रासायनिक रूप से कुछ भी अधिक कठोर नहीं — प्रयोगशाला अम्ल और ऊष्मा से उसका जल-अपघटन सहज कर लेती है — वह बस हमारे औज़ारों के लिए ग़लत आकृति है। साथ यह भी कि तंतुक ठसाठस और हाइड्रोजन-बद्ध हैं, अतः सही एंज़ाइम भी ढीली शृंखला नहीं, क्रिस्टलीय सतह का सामना करता है, और सेलुलोस मानव आँत से लगभग अछूता निकल जाता है। यही आहारीय रेशा है, और वह ठीक इसी कारण उपयोगी है: वह भार और पानी थामता है बिना एक भी कैलोरी जोड़े। दीमक रोचक आधा है, क्योंकि उत्तर वह नहीं जो \"लकड़ी खाता कीट\" वाक्यांश सुझाता है। दीमकें सेल्युलेज बनातीं नहीं — या कुछ जातियों में थोड़ा बनाती हैं और उस पर गुज़ारा नहीं कर सकतीं। लकड़ी को पचाता है पश्च-आंत्र में कशाभिकाधारी प्रोटिस्टों और जीवाणुओं का समुदाय, जो सेल्युलेज स्रवित करते हैं, बीटा कड़ियाँ तोड़ते हैं, और ग्लूकोज़ तथा लघु-शृंखला वसा अम्ल छोड़ते हैं जिन्हें दीमक सोख लेती है। उस समुदाय को ऊष्मा या प्रतिजैविक से हटा दो और दीमक बुरादे से भरी आँत लिए भूखी मर जाती है। वही व्यवस्था गाय चलाती है: रुमेन सूक्ष्मजीवों का किण्वन-पात्र है, और गाय का सबसे अच्छा वर्णन है वह प्राणी जो जीवाणु उगाता है और फ़सल खाता है। सामान्यीकरण योग्य विचार के दो आधे हैं। पहला, बहुलकों में कड़ी उतनी ही सूचना ढोती है जितनी इकाई — वही पाठ जो कार्बनिक रसायन समावयवों से देता है और यह अध्याय शर्कराओं से दोहराता है। दूसरा, किसी जीव का आहार इस बात की सूची नहीं कि वह क्या चबा सकता है, बल्कि इसकी कि उसके एंज़ाइम — अपने या किरायेदारों के — क्या तोड़ सकते हैं, इसीलिए पोषण का इतना बड़ा हिस्सा असल में सूक्ष्मजीव-विज्ञान है। (दूसरा उत्तर साझा एकलक से इनकार करता है, जो वही तथ्य है जिस पर प्रश्न टिका है; तीसरा लंबाई की समस्या गढ़ता है, जबकि एमाइलेज को शृंखला की लंबाई नहीं हराती; और चौथा सेल्युलेज को ग़लत जगह रखता है, जबकि दीमक का अपना योगदान गौण है और काम आँत का समुदाय करता है।)",
          mr: "दोन बहुवारिके, एक एकवारिक, आणि अख्खा फरक एका बंधाच्या भूमितीत — जे याला प्रकरणातले सर्वांत स्वच्छ प्रात्यक्षिक बनवते की जीवशास्त्रात मांडणी संघटनाहून अधिक महत्त्वाची. ग्लुकोज हे सहा-कार्बन वलय, आणि त्याच्या कार्बन-1 चा हायड्रॉक्सिल वलय-पातळीच्या खाली (अल्फा) वा वर (बीटा) निर्देश करू शकतो. एका ग्लुकोजचा कार्बन 1 पुढच्याच्या कार्बन 4 ला जोडा आणि दोन्ही बाबतीत कार्बन एक आणि कार्बन चार यांच्यात दुवा मिळतो, पण दोन्ही भूमितीदृष्ट्या वेगळे. अल्फा रूपात क्रमवार ग्लुकोज त्याच दिशेने कलतात, आणि साखळी वळते — पिष्टाचे अमायलोज ही कुंडली, सैल आणि उघडी, जिचे बंध कुंडलीच्या बाहेर उघडे. बीटा रूपात प्रत्येक ग्लुकोजला आपल्या शेजाऱ्याच्या सापेक्ष 180 अंश फिरावेच लागते जेणेकरून दुवा बनावा, म्हणून साखळी आलटून-पालटून चालते आणि पूर्णपणे सरळ निघते. सरळ साखळी आपल्या अख्ख्या लांबीत शेजाऱ्यांना टेकू शकते, आणि सेल्युलोजच्या साखळ्या नेमके तेच करतात, परस्परांशी हायड्रोजन-बंध बनवून सूक्ष्मतंतूंत बसतात ज्यांची वजनाच्या प्रमाणात ताणशक्ती पोलादी तारेइतकी. म्हणूनच त्याच साखरेतून लाकूड संरचनात्मक आणि भाकरी नाही. आता एंझाइम. सक्रिय स्थळ आकृतीच्या पूरकतेने काम करते, आणि इथे त्याला ज्या आकृतीचे पूरक व्हायचे तो बंध आणि त्याच्या दोन्ही बाजूंची दोन वलये. मानवी अमायलेज अल्फा भूमितीत बसत उत्क्रांत झाले; बीटा दुवा आरशासारखी मांडणी सादर करतो जी त्या खाचेत बसणार नाही. सेल्युलोजबद्दल रासायनिकदृष्ट्या काहीही अधिक कठीण नाही — प्रयोगशाळा आम्ल आणि उष्णतेने त्याचे जलअपघटन सहज करते — ते फक्त आपल्या हत्यारांसाठी चुकीच्या आकाराचे. सोबत हेही की तंतुक दाटीवाटीने आणि हायड्रोजन-बद्ध, म्हणून बरोबर एंझाइमही सैल साखळी नव्हे, स्फटिकी पृष्ठभागाला सामोरे जाते, आणि सेल्युलोज मानवी आतड्यातून जवळपास अस्पर्श निघून जाते. हाच आहारातील तंतू, आणि तो नेमक्या याच कारणाने उपयुक्त: तो भार आणि पाणी धरतो एकही कॅलरी न जोडता. वाळवी हा रोचक अर्धा भाग, कारण उत्तर ते नाही जे \"लाकूड खाणारा कीटक\" हा शब्दप्रयोग सुचवतो. वाळव्या सेल्युलेज बनवत नाहीत — वा काही जातींत थोडे बनवतात आणि त्यावर भागवू शकत नाहीत. लाकूड पचवतो पश्च-आतड्यातला कशाभिकाधारी प्रोटिस्ट आणि जीवाणूंचा समुदाय, जो सेल्युलेज स्रवतो, बीटा दुवे तोडतो, आणि ग्लुकोज व लघु-साखळी वसाम्ले सोडतो जी वाळवी शोषते. तो समुदाय उष्णतेने वा प्रतिजैविकाने काढा आणि वाळवी भुसा भरलेले आतडे घेऊन उपाशी मरते. तीच व्यवस्था गाय चालवते: रुमेन हे सूक्ष्मजीवांचे किण्वन-भांडे, आणि गायीचे उत्तम वर्णन म्हणजे जीवाणू पिकवणारा आणि पीक खाणारा प्राणी. सामान्यीकरणयोग्य कल्पनेचे दोन अर्धे. पहिला, बहुवारिकांत दुवा एककाइतकीच माहिती वाहतो — तोच धडा जो कार्बनी रसायन समघटकांनी देते आणि हे प्रकरण साखरांनी पुन्हा सांगते. दुसरा, एखाद्या सजीवाचा आहार म्हणजे तो काय चावू शकतो याची यादी नव्हे, तर त्याची एंझाइमे — स्वतःची वा भाडेकरूंची — काय तोडू शकतात याची, म्हणूनच पोषणाचा इतका मोठा भाग प्रत्यक्षात सूक्ष्मजीवशास्त्र आहे. (दुसरे उत्तर सामायिक एकवारिक नाकारते, जे प्रश्न ज्यावर टेकला आहे तेच तथ्य; तिसरे लांबीची समस्या रचते, तर साखळीची लांबी अमायलेजला हरवत नाही; आणि चौथे सेल्युलेज चुकीच्या जागी ठेवते, तर वाळवीचे स्वतःचे योगदान गौण आणि काम आतड्याचा समुदाय करतो.)",
        },
      },
      /*H9B*/
    ],
  },

  /* ----------------------------------------------------------------------- */
  /* Chapter 10 — Cell Cycle and Cell Division                               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "biology-11-cell-cycle-and-cell-division",
    subject: "BIOLOGY",
    classLevel: 11,
    chapter: {
      en: "Chapter 10 — Cell Cycle and Cell Division",
      hi: "अध्याय 10 — कोशिका चक्र और कोशिका विभाजन",
      mr: "प्रकरण 10 — पेशीचक्र आणि पेशीविभाजन",
    },
    name: {
      en: "Cell Cycle and Cell Division",
      hi: "कोशिका चक्र और कोशिका विभाजन",
      mr: "पेशीचक्र आणि पेशीविभाजन",
    },
    summary: {
      en: "Dividing is the visible tenth of a cell's life and the copying that makes it possible is the invisible rest, so the chapter is really about bookkeeping: one division that keeps the chromosome number exactly and one that halves it in two goes, a swap between partners that makes every gamete unique, a checkpoint that can be bribed, and a plant that builds a wall where an animal pinches a waist.",
      hi: "विभाजन कोशिका के जीवन का दिखने वाला दसवाँ भाग है और उसे संभव बनाती नक़ल अदृश्य बाक़ी हिस्सा, अतः अध्याय असल में बहीखाते का है: एक विभाजन जो गुणसूत्र संख्या ठीक-ठीक बनाए रखता है और एक जो उसे दो चरणों में आधा करता है, साथियों के बीच अदला-बदली जो हर युग्मक को अद्वितीय बनाती है, एक जाँच-चौकी जिसे रिश्वत दी जा सकती है, और वह पादप जो दीवार बनाता है जहाँ प्राणी कमर दबाता है।",
      mr: "विभाजन हा पेशीच्या आयुष्याचा दिसणारा दशांश आणि ते शक्य करणारी नक्कल हा अदृश्य उरलेला भाग, म्हणून प्रकरण खरे तर हिशेबाचे: एक विभाजन जे गुणसूत्रसंख्या नेमकी टिकवते आणि एक जे ती दोन टप्प्यांत निम्मी करते, जोडीदारांमधली अदलाबदल जी प्रत्येक युग्मक अद्वितीय करते, एक तपासनाका ज्याला लाच देता येते, आणि ती वनस्पती जी भिंत बांधते जिथे प्राणी कंबर आवळतो.",
    },
    position: 10,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "the-visible-tenth-of-a-cells-life",
        name: {
          en: "The visible tenth, and the invisible rest",
          hi: "दिखने वाला दसवाँ भाग, और अदृश्य बाक़ी",
          mr: "दिसणारा दशांश, आणि अदृश्य उरलेला",
        },
        kind: "cycle",
        prompt: {
          en: "Watch a dividing tissue for a day and you see chromosomes moving for less than an hour of it; the other twenty-odd hours look like nothing happening and are when the cell copies everything it owns. What is this?",
          hi: "विभाजित होते ऊतक को दिन भर देखो और गुणसूत्रों को हिलते हुए एक घंटे से कम ही दिखोगे; बाक़ी बीसेक घंटे ऐसे लगते हैं मानो कुछ हो ही नहीं रहा और तभी कोशिका अपनी हर चीज़ की नक़ल करती है। यह क्या है?",
          mr: "विभाजित होणारी ऊती दिवसभर पाहा आणि गुणसूत्रे हलताना तासाहून कमीच दिसतील; उरलेले वीसेक तास काहीच घडत नसल्यासारखे वाटतात आणि तेव्हाच पेशी आपल्या प्रत्येक गोष्टीची नक्कल करते. हे काय?",
        },
        statement: {
          en: "The cell cycle is interphase followed by division, and interphase is by far the longer: G1 for growth, S for copying the DNA, and G2 for preparing to divide.",
          hi: "कोशिका चक्र अंतरावस्था और उसके बाद विभाजन है, और अंतरावस्था कहीं अधिक लंबी है: वृद्धि के लिए G1, DNA की नक़ल के लिए S, और विभाजन की तैयारी के लिए G2.",
          mr: "पेशीचक्र म्हणजे आंतरावस्था आणि नंतर विभाजन, आणि आंतरावस्था कितीतरी अधिक लांब: वाढीसाठी G1, DNA च्या नकलेसाठी S, आणि विभाजनाच्या तयारीसाठी G2.",
        },
        detail: {
          en: "Only in S phase does the DNA amount double while the chromosome NUMBER stays the same, because each chromosome becomes two sister chromatids still joined at the centromere.",
          hi: "केवल S प्रावस्था में DNA की मात्रा दोगुनी होती है जबकि गुणसूत्र संख्या वही रहती है, क्योंकि हर गुणसूत्र दो सहोदर अर्धगुणसूत्र बन जाता है जो अब भी गुणसूत्रबिंदु पर जुड़े हैं।",
          mr: "केवळ S प्रावस्थेत DNA चे प्रमाण दुप्पट होते तर गुणसूत्रांची संख्या तीच राहते, कारण प्रत्येक गुणसूत्र दोन सहोदर अर्धगुणसूत्रे बनते जी अजूनही गुणसूत्रबिंदूवर जोडलेली.",
        },
        extra: {
          en: "Cells that will never divide again leave the cycle altogether into a resting state called G0, which is where a mature nerve cell spends the whole of your life.",
          hi: "जो कोशिकाएँ फिर कभी विभाजित नहीं होंगी वे चक्र से पूरी तरह निकलकर G0 नाम की विश्राम-अवस्था में चली जाती हैं, और वहीं परिपक्व तंत्रिका कोशिका तुम्हारा पूरा जीवन बिताती है।",
          mr: "ज्या पेशी पुन्हा कधीच विभाजित होणार नाहीत त्या चक्रातून पूर्णपणे निघून G0 नावाच्या विश्रांती-अवस्थेत जातात, आणि तिथेच प्रौढ चेतापेशी तुमचे अख्खे आयुष्य घालवते.",
        },
        pair: {
          left: {
            en: "A nerve cell spends your whole life in G0",
            hi: "तंत्रिका कोशिका तुम्हारा पूरा जीवन G0 में बिताती है",
            mr: "चेतापेशी तुमचे अख्खे आयुष्य G0 मध्ये घालवते",
          },
          right: {
            en: "the visible tenth, and the invisible rest",
            hi: "दिखने वाला दसवाँ भाग, और अदृश्य बाक़ी",
            mr: "दिसणारा दशांश, आणि अदृश्य उरलेला",
          },
        },
      },
      {
        id: "the-division-that-changes-nothing",
        name: {
          en: "The division that changes nothing at all",
          hi: "वह विभाजन जो कुछ भी नहीं बदलता",
          mr: "काहीच न बदलणारे ते विभाजन",
        },
        kind: "process",
        prompt: {
          en: "Your skin makes millions of new cells today and every one has the same forty-six chromosomes and the same genes as the one it came from, which is what a repair needs and a variation would ruin. What is this?",
          hi: "तुम्हारी त्वचा आज लाखों नई कोशिकाएँ बनाती है और हर एक में वही छियालीस गुणसूत्र और वही जीन हैं जो उस कोशिका में थे जिससे वह आई, और मरम्मत को यही चाहिए और विभिन्नता इसे बिगाड़ देती। यह क्या है?",
          mr: "तुमची त्वचा आज लाखो नव्या पेशी बनवते आणि प्रत्येकीत तीच सेहेचाळीस गुणसूत्रे आणि तीच जनुके जी ती ज्यातून आली त्या पेशीत होती, आणि दुरुस्तीला हेच लागते आणि विविधता ते बिघडवली असती. हे काय?",
        },
        statement: {
          en: "Mitosis is one division producing two daughter cells with the same chromosome number and the same genes as the parent, and it is how a body grows, repairs and replaces.",
          hi: "समसूत्री विभाजन एक ऐसा विभाजन है जो जनक जितनी ही गुणसूत्र संख्या और वही जीन रखती दो संतति कोशिकाएँ बनाता है, और शरीर इसी से बढ़ता, मरम्मत करता और बदलता है।",
          mr: "समविभाजन म्हणजे एक असे विभाजन जे जनकाइतकीच गुणसूत्रसंख्या आणि तीच जनुके असलेल्या दोन कन्यापेशी बनवते, आणि शरीर याच्यानेच वाढते, दुरुस्त करते आणि बदलते.",
        },
        detail: {
          en: "The number is kept because S phase doubled the DNA first and mitosis then separates sister chromatids, so each daughter gets one of each pair and the count returns to where it started.",
          hi: "संख्या इसलिए बनी रहती है कि S प्रावस्था ने पहले DNA दोगुना किया और फिर समसूत्री विभाजन सहोदर अर्धगुणसूत्रों को अलग करता है, अतः हर संतति को हर युग्म का एक मिलता है और गिनती वहीं लौट आती है जहाँ से शुरू हुई थी।",
          mr: "संख्या यासाठी टिकते की S प्रावस्थेने आधी DNA दुप्पट केले आणि मग समविभाजन सहोदर अर्धगुणसूत्रे वेगळी करते, म्हणून प्रत्येक कन्येला प्रत्येक जोडीतले एक मिळते आणि मोजणी जिथून सुरू झाली तिथेच परतते.",
        },
        extra: {
          en: "In plants it happens in meristems and in animals almost everywhere, and where it happens without a stop signal being obeyed the result is a tumour.",
          hi: "पादपों में यह विभज्योतकों में होता है और प्राणियों में लगभग हर जगह, और जहाँ यह रुकने का संकेत माने बिना होता है वहाँ परिणाम अर्बुद है।",
          mr: "वनस्पतींत हे विभाजी ऊतींत घडते आणि प्राण्यांत जवळपास सर्वत्र, आणि जिथे हे थांबण्याचा संकेत न पाळता घडते तिथे परिणाम अर्बुद.",
        },
        pair: {
          left: {
            en: "Division without a stop signal is a tumour",
            hi: "रुकने के संकेत बिना विभाजन अर्बुद है",
            mr: "थांबण्याच्या संकेताविना विभाजन म्हणजे अर्बुद",
          },
          right: {
            en: "the division that changes nothing at all",
            hi: "वह विभाजन जो कुछ भी नहीं बदलता",
            mr: "काहीच न बदलणारे ते विभाजन",
          },
        },
      },
      {
        id: "halving-it-in-two-goes",
        name: {
          en: "Halving the number, in two goes",
          hi: "संख्या आधी करना, दो चरणों में",
          mr: "संख्या निम्मी करणे, दोन टप्प्यांत",
        },
        kind: "process",
        prompt: {
          en: "A gamete must carry half of what its parent cell had, and the cell gets there by copying its DNA once and then dividing twice, which is the only way to halve a number that comes in pairs. What is this?",
          hi: "युग्मक को अपनी जनक कोशिका के आधे गुणसूत्र ढोने हैं, और कोशिका वहाँ अपने DNA की एक बार नक़ल करके फिर दो बार विभाजित होकर पहुँचती है, और युग्मों में आती संख्या को आधा करने का यही एकमात्र रास्ता है। यह क्या है?",
          mr: "युग्मकाला आपल्या जनक पेशीच्या निम्मी गुणसूत्रे वाहायची आहेत, आणि पेशी तिथे आपल्या DNA ची एकदा नक्कल करून मग दोनदा विभागून पोहोचते, आणि जोड्यांत येणारी संख्या निम्मी करण्याचा हाच एकमेव मार्ग. हे काय?",
        },
        statement: {
          en: "Meiosis is one round of DNA replication followed by two divisions, giving four cells with half the chromosome number: the first division separates the homologous pairs and the second separates the sister chromatids.",
          hi: "अर्धसूत्री विभाजन DNA की एक बार प्रतिकृति और उसके बाद दो विभाजन है, जो आधी गुणसूत्र संख्या वाली चार कोशिकाएँ देता है: पहला विभाजन समजात युग्मों को अलग करता है और दूसरा सहोदर अर्धगुणसूत्रों को।",
          mr: "अर्धसूत्री विभाजन म्हणजे DNA ची एकदा प्रतिकृती आणि नंतर दोन विभाजने, जे निम्मी गुणसूत्रसंख्या असलेल्या चार पेशी देते: पहिले विभाजन समजात जोड्या वेगळ्या करते आणि दुसरे सहोदर अर्धगुणसूत्रे.",
        },
        detail: {
          en: "The halving happens entirely in the FIRST division, which is why it is called reductional and the second, which merely splits chromatids like a mitosis, is called equational.",
          hi: "आधा होना पूरी तरह पहले विभाजन में होता है, इसीलिए उसे न्यूनकारी कहते हैं और दूसरे को, जो समसूत्री विभाजन की तरह बस अर्धगुणसूत्र बाँटता है, समकारी।",
          mr: "निम्मे होणे संपूर्णपणे पहिल्या विभाजनात घडते, म्हणूनच त्याला न्यूनकारी म्हणतात आणि दुसऱ्याला, जे समविभाजनासारखे फक्त अर्धगुणसूत्रे वाटते, समकारी.",
        },
        extra: {
          en: "Fertilisation restores the number, so meiosis and fertilisation are a matched pair — take one away and the chromosome count would double every generation.",
          hi: "निषेचन संख्या लौटा देता है, अतः अर्धसूत्री विभाजन और निषेचन जोड़ीदार हैं — एक को हटा दो और गुणसूत्र संख्या हर पीढ़ी दोगुनी होती जाए।",
          mr: "फलन संख्या परत आणते, म्हणून अर्धसूत्री विभाजन आणि फलन ही जुळी जोडी — एक काढा आणि गुणसूत्रसंख्या प्रत्येक पिढीत दुप्पट होत जाईल.",
        },
        pair: {
          left: {
            en: "Remove one and the count doubles every generation",
            hi: "एक हटाओ और गिनती हर पीढ़ी दोगुनी",
            mr: "एक काढा आणि मोजणी प्रत्येक पिढीत दुप्पट",
          },
          right: {
            en: "halving the number, in two goes",
            hi: "संख्या आधी करना, दो चरणों में",
            mr: "संख्या निम्मी करणे, दोन टप्प्यांत",
          },
        },
      },
      {
        id: "the-swap-that-makes-every-gamete-new",
        name: {
          en: "The swap that makes every gamete new",
          hi: "वह अदला-बदली जो हर युग्मक को नया बनाती है",
          mr: "प्रत्येक युग्मक नवे करणारी ती अदलाबदल",
        },
        kind: "process",
        prompt: {
          en: "Two chromosomes of a pair lie side by side, break at matching points and exchange the pieces, so a chromosome that leaves is neither the one from the mother nor the one from the father. What is this?",
          hi: "युग्म के दो गुणसूत्र अगल-बग़ल पड़ते हैं, मेल खाते बिंदुओं पर टूटते हैं और टुकड़े अदल-बदल लेते हैं, अतः जो गुणसूत्र निकलता है वह न माता वाला है न पिता वाला। यह क्या है?",
          mr: "जोडीतली दोन गुणसूत्रे शेजारीशेजारी पडतात, जुळणाऱ्या बिंदूंवर तुटतात आणि तुकडे अदलाबदल करतात, म्हणून जे गुणसूत्र निघते ते ना आईचे ना वडिलांचे. हे काय?",
        },
        statement: {
          en: "Crossing over is the exchange of segments between homologous chromosomes during the first meiotic prophase, at points called chiasmata, and it produces chromosomes carrying a new combination of the parents' alleles.",
          hi: "जीन-विनिमय पहली अर्धसूत्री पूर्वावस्था में समजात गुणसूत्रों के बीच खंडों की अदला-बदली है, काएज़्मा कहे जाते बिंदुओं पर, और वह माता-पिता के युग्मविकल्पियों का नया संयोजन ढोते गुणसूत्र बनाता है।",
          mr: "जनुक-विनिमय म्हणजे पहिल्या अर्धसूत्री पूर्वावस्थेत समजात गुणसूत्रांमधली खंडांची अदलाबदल, कायाझ्मा म्हटल्या जाणाऱ्या बिंदूंवर, आणि तो आई-वडिलांच्या युग्मविकल्पींचे नवे संयोजन वाहणारी गुणसूत्रे बनवतो.",
        },
        detail: {
          en: "It is the second of two shuffles: the pairs also line up independently at the metaphase plate, so which member of each pair goes to which pole is decided afresh for every pair.",
          hi: "यह दो फेंटनों में दूसरा है: युग्म मध्यावस्था पट्टिका पर स्वतंत्र रूप से भी क़तार में लगते हैं, अतः हर युग्म का कौन-सा सदस्य किस ध्रुव पर जाएगा यह हर युग्म के लिए नए सिरे से तय होता है।",
          mr: "हे दोन फेरबदलांतले दुसरे: जोड्या मध्यावस्था पट्टीवर स्वतंत्रपणेही रांगेत लागतात, म्हणून प्रत्येक जोडीतला कोणता सदस्य कोणत्या ध्रुवाकडे जाईल हे प्रत्येक जोडीसाठी नव्याने ठरते.",
        },
        extra: {
          en: "Between the two, a human can make more than eight million chromosome combinations before crossing over is even counted, which is why no two children of the same parents are ever the same.",
          hi: "दोनों मिलकर, जीन-विनिमय गिनने से पहले ही मनुष्य अस्सी लाख से अधिक गुणसूत्र-संयोजन बना सकता है, इसीलिए एक ही माता-पिता के दो बच्चे कभी एक जैसे नहीं होते।",
          mr: "दोन्ही मिळून, जनुक-विनिमय मोजण्याआधीच माणूस ऐंशी लाखांहून अधिक गुणसूत्र-संयोजने बनवू शकतो, म्हणूनच एकाच आई-वडिलांची दोन मुले कधीच सारखी नसतात.",
        },
        pair: {
          left: {
            en: "No two children of one pair are ever the same",
            hi: "एक ही युग्म के दो बच्चे कभी एक जैसे नहीं",
            mr: "एकाच जोडप्याची दोन मुले कधीच सारखी नाहीत",
          },
          right: {
            en: "the swap that makes every gamete new",
            hi: "वह अदला-बदली जो हर युग्मक को नया बनाती है",
            mr: "प्रत्येक युग्मक नवे करणारी ती अदलाबदल",
          },
        },
      },
      {
        id: "the-checkpoint-that-can-fail",
        name: {
          en: "The gate a cell must pass before it may divide",
          hi: "वह द्वार जिससे कोशिका को विभाजन से पहले गुज़रना है",
          mr: "विभाजनाआधी पेशीला ओलांडावे लागणारे ते दार",
        },
        kind: "control",
        prompt: {
          en: "A cell with damaged DNA is stopped before it can copy it, given time to repair, and destroyed if it cannot — and a cell that has lost that machinery divides on regardless. What is this?",
          hi: "क्षतिग्रस्त DNA वाली कोशिका को नक़ल करने से पहले रोका जाता है, मरम्मत का समय दिया जाता है, और न कर सके तो नष्ट कर दिया जाता है — और जिस कोशिका ने वह मशीनरी खो दी हो वह बेपरवाह विभाजित होती रहती है। यह क्या है?",
          mr: "क्षतिग्रस्त DNA असलेल्या पेशीला नक्कल करण्याआधी थांबवले जाते, दुरुस्तीला वेळ दिला जातो, आणि जमले नाही तर नष्ट केले जाते — आणि ज्या पेशीने ती यंत्रणा गमावली ती बेफिकीर विभाजित होत राहते. हे काय?",
        },
        statement: {
          en: "Checkpoints are control points in the cell cycle where division halts unless conditions are met — DNA undamaged, replication complete, chromosomes properly attached — and a cell that fails and cannot repair is normally destroyed.",
          hi: "जाँच-चौकियाँ कोशिका चक्र के वे नियंत्रण-बिंदु हैं जहाँ शर्तें पूरी न होने पर विभाजन रुक जाता है — DNA अक्षत, प्रतिकृति पूर्ण, गुणसूत्र ठीक से जुड़े — और जो कोशिका विफल हो और मरम्मत न कर सके वह सामान्यतः नष्ट कर दी जाती है।",
          mr: "तपासनाके ही पेशीचक्रातील ती नियंत्रण-स्थळे जिथे अटी पूर्ण न झाल्यास विभाजन थांबते — DNA अक्षत, प्रतिकृती पूर्ण, गुणसूत्रे नीट जोडलेली — आणि जी पेशी अपयशी ठरते आणि दुरुस्त करू शकत नाही ती सामान्यतः नष्ट केली जाते.",
        },
        detail: {
          en: "The order matters: the gate before S phase asks whether it is safe to copy, and the gate in mitosis asks whether every chromosome is attached before any is pulled.",
          hi: "क्रम मायने रखता है: S प्रावस्था से पहले का द्वार पूछता है कि नक़ल करना सुरक्षित है या नहीं, और समसूत्री विभाजन का द्वार पूछता है कि किसी को खींचने से पहले हर गुणसूत्र जुड़ा है या नहीं।",
          mr: "क्रम महत्त्वाचा: S प्रावस्थेआधीचे दार विचारते की नक्कल करणे सुरक्षित आहे का, आणि समविभाजनातले दार विचारते की कोणतेही ओढण्याआधी प्रत्येक गुणसूत्र जोडलेले आहे का.",
        },
        extra: {
          en: "Cancer is what a failed checkpoint looks like from outside: the damage accumulates because the cell that should have stopped or died did neither.",
          hi: "कर्क रोग वही है जो विफल जाँच-चौकी बाहर से दिखती है: क्षति जमा होती जाती है क्योंकि जिस कोशिका को रुकना या मरना था उसने दोनों में से कुछ नहीं किया।",
          mr: "कर्करोग म्हणजे अपयशी तपासनाका बाहेरून जसा दिसतो ते: हानी साचत जाते कारण जिला थांबायचे वा मरायचे होते त्या पेशीने दोन्हीपैकी काहीच केले नाही.",
        },
        pair: {
          left: {
            en: "Neither stopped nor died",
            hi: "न रुकी, न मरी",
            mr: "ना थांबली, ना मेली",
          },
          right: {
            en: "the gate a cell must pass before it may divide",
            hi: "वह द्वार जिससे कोशिका को विभाजन से पहले गुज़रना है",
            mr: "विभाजनाआधी पेशीला ओलांडावे लागणारे ते दार",
          },
        },
      },
      {
        id: "a-wall-where-an-animal-pinches",
        name: {
          en: "A wall built where an animal pinches a waist",
          hi: "वहाँ बनी दीवार जहाँ प्राणी कमर दबाता है",
          mr: "प्राणी कंबर आवळतो तिथे बांधलेली भिंत",
        },
        kind: "contrast",
        prompt: {
          en: "An animal cell divides its cytoplasm by a ring of filaments tightening like a purse string, and a plant cell cannot, because a rigid box will not be squeezed. Which contrast is this?",
          hi: "प्राणी कोशिका अपना कोशिकाद्रव्य तंतुओं के ऐसे वलय से बाँटती है जो बटुए की डोरी की तरह कसता है, और पादप कोशिका ऐसा नहीं कर सकती, क्योंकि कठोर डिब्बा दबेगा नहीं। यह कौन-सा विरोध है?",
          mr: "प्राणिपेशी आपले पेशीद्रव्य तंतूंच्या अशा वलयाने विभागते जे पिशवीच्या दोरीसारखे आवळते, आणि वनस्पतिपेशी तसे करू शकत नाही, कारण कठीण खोका दाबला जाणार नाही. हा कोणता विरोध?",
        },
        statement: {
          en: "Cytokinesis divides the cytoplasm by a cleavage furrow in animal cells, where a contractile ring pinches the cell in two, and by a cell plate in plant cells, which grows outwards from the centre into a new wall.",
          hi: "कोशिकाद्रव्य विभाजन प्राणी कोशिकाओं में विदलन खाँच से होता है, जहाँ संकुचनशील वलय कोशिका को दो में दबा देता है, और पादप कोशिकाओं में कोशिका-पट्टिका से, जो केंद्र से बाहर की ओर बढ़कर नई भित्ति बन जाती है।",
          mr: "पेशीद्रव्य विभाजन प्राणिपेशींत विदलन खाचेने होते, जिथे आकुंचनशील वलय पेशीला दोनांत दाबते, आणि वनस्पतिपेशींत पेशी-पट्टीने, जी मध्यातून बाहेरच्या दिशेने वाढून नवी भित्तिका बनते.",
        },
        detail: {
          en: "The plate grows from the middle outwards while the furrow closes from the outside in, which is the geometry each is forced into by having or not having a wall.",
          hi: "पट्टिका बीच से बाहर की ओर बढ़ती है जबकि खाँच बाहर से भीतर की ओर बंद होती है, और भित्ति होने या न होने से हर एक पर यही ज्यामिति थोपी जाती है।",
          mr: "पट्टी मध्यातून बाहेरच्या दिशेने वाढते तर खाच बाहेरून आतल्या दिशेने बंद होते, आणि भित्तिका असणे वा नसणे यानेच प्रत्येकावर हीच भूमिती लादली जाते.",
        },
        extra: {
          en: "Some divisions skip it entirely: a cell that divides its nucleus without dividing its cytoplasm becomes multinucleate, which is how a striated muscle fibre and a coconut's liquid endosperm are made.",
          hi: "कुछ विभाजन उसे पूरी तरह छोड़ देते हैं: जो कोशिका अपना केंद्रक बाँटे और कोशिकाद्रव्य नहीं वह बहुकेंद्रकी हो जाती है, और रेखित पेशी तंतु तथा नारियल का तरल भ्रूणपोष ऐसे ही बनते हैं।",
          mr: "काही विभाजने ते पूर्णपणे वगळतात: जी पेशी आपले केंद्रक विभागते आणि पेशीद्रव्य नाही ती बहुकेंद्रकी होते, आणि रेखित स्नायुतंतू व नारळाचा द्रव भ्रूणपोष असेच बनतात.",
        },
        pair: {
          left: {
            en: "Coconut water is a cell that never finished dividing",
            hi: "नारियल का पानी वह कोशिका है जिसका विभाजन कभी पूरा नहीं हुआ",
            mr: "नारळाचे पाणी म्हणजे विभाजन कधीच पूर्ण न झालेली पेशी",
          },
          right: {
            en: "a wall built where an animal pinches a waist",
            hi: "वहाँ बनी दीवार जहाँ प्राणी कमर दबाता है",
            mr: "प्राणी कंबर आवळतो तिथे बांधलेली भिंत",
          },
        },
      },
      /*F10B*/
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student says meiosis needs two divisions because one could not possibly halve the chromosome number. Explain why one division genuinely cannot do it, and what each of the two actually separates.",
          hi: "एक विद्यार्थी कहता है कि अर्धसूत्री विभाजन को दो विभाजन चाहिए क्योंकि एक से गुणसूत्र संख्या आधी हो ही नहीं सकती। समझाओ कि एक विभाजन वास्तव में ऐसा क्यों नहीं कर सकता, और दोनों में से हर एक वस्तुतः क्या अलग करता है।",
          mr: "एक विद्यार्थी म्हणतो की अर्धसूत्री विभाजनाला दोन विभाजने लागतात कारण एकाने गुणसूत्रसंख्या निम्मी होऊच शकत नाही. एक विभाजन प्रत्यक्षात असे का करू शकत नाही, आणि दोघांपैकी प्रत्येक प्रत्यक्षात काय वेगळे करते, ते समजावा.",
        },
        choices: [
          {
            en: "The conclusion is right and the reason needs stating precisely. The cell entered meiosis having already copied its DNA, so every chromosome is two sister chromatids joined at a centromere. The FIRST division separates the homologous pairs — the maternal chromosome goes one way and the paternal the other, still as doubled chromosomes — and that is where the number halves, which is why it is called reductional. The SECOND division then separates those sister chromatids, exactly as a mitosis does, without changing the number again — the equational one. One division could deliver either the halving or the chromatid separation, never both",
            hi: "निष्कर्ष सही है और कारण सटीक कहा जाना चाहिए। कोशिका अर्धसूत्री विभाजन में अपना DNA पहले ही नक़ल कर चुकी होकर घुसी, अतः हर गुणसूत्र गुणसूत्रबिंदु पर जुड़े दो सहोदर अर्धगुणसूत्र है। पहला विभाजन समजात युग्मों को अलग करता है — मातृ गुणसूत्र एक ओर और पितृ दूसरी ओर, अब भी दोहरे गुणसूत्रों के रूप में — और वहीं संख्या आधी होती है, इसीलिए उसे न्यूनकारी कहते हैं। फिर दूसरा विभाजन उन्हीं सहोदर अर्धगुणसूत्रों को अलग करता है, ठीक जैसे समसूत्री विभाजन करता है, संख्या फिर बदले बिना — वही समकारी है। एक विभाजन या तो आधा करना दे सकता था या अर्धगुणसूत्र अलग करना, दोनों कभी नहीं",
            mr: "निष्कर्ष बरोबर आणि कारण नेमके सांगायला हवे. पेशी अर्धसूत्री विभाजनात आपले DNA आधीच नक्कल करून शिरली, म्हणून प्रत्येक गुणसूत्र गुणसूत्रबिंदूवर जोडलेली दोन सहोदर अर्धगुणसूत्रे. पहिले विभाजन समजात जोड्या वेगळ्या करते — मातृ गुणसूत्र एका बाजूला आणि पितृ दुसऱ्या, अजूनही दुहेरी गुणसूत्रांच्या रूपात — आणि तिथेच संख्या निम्मी होते, म्हणूनच त्याला न्यूनकारी म्हणतात. मग दुसरे विभाजन त्याच सहोदर अर्धगुणसूत्रांना वेगळे करते, नेमके समविभाजन करते तसे, संख्या पुन्हा न बदलता — तेच समकारी. एक विभाजन एकतर निम्मे करणे देऊ शकले असते वा अर्धगुणसूत्रे वेगळी करणे, दोन्ही कधीच नाही",
          },
          {
            en: "The student is wrong: one division could halve the number, and the second exists only to produce four gametes instead of two",
            hi: "विद्यार्थी ग़लत है: एक विभाजन संख्या आधी कर सकता था, और दूसरा केवल दो के बजाय चार युग्मक बनाने को है",
            mr: "विद्यार्थी चुकीचा: एक विभाजन संख्या निम्मी करू शकले असते, आणि दुसरे केवळ दोनऐवजी चार युग्मके बनवायला आहे",
          },
          {
            en: "The first division separates sister chromatids and the second separates the homologous pairs, so the halving happens in the second",
            hi: "पहला विभाजन सहोदर अर्धगुणसूत्रों को अलग करता है और दूसरा समजात युग्मों को, अतः आधा होना दूसरे में होता है",
            mr: "पहिले विभाजन सहोदर अर्धगुणसूत्रे वेगळी करते आणि दुसरे समजात जोड्या, म्हणून निम्मे होणे दुसऱ्यात घडते",
          },
          {
            en: "Two divisions are needed because the DNA is copied twice, once before each, and each division undoes one copying",
            hi: "दो विभाजन इसलिए चाहिए कि DNA दो बार नक़ल होता है, हर एक से पहले एक बार, और हर विभाजन एक नक़ल पलट देता है",
            mr: "दोन विभाजने यासाठी लागतात की DNA दोनदा नक्कल होते, प्रत्येकाआधी एकदा, आणि प्रत्येक विभाजन एक नक्कल उलटवते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student has the right answer and a vague reason, and making the reason exact is the whole of the learning here. Begin with what the cell is holding when meiosis starts. Interphase has already run, including S phase, so the DNA has been copied. A human cell entering meiosis therefore has 46 chromosomes, and each of those 46 is two identical sister chromatids stuck together at a centromere. The chromosome COUNT is 46; the DNA amount is double what a resting cell carries. Two separate things could be pulled apart here, and they are genuinely different. The homologous pairs could be separated: the chromosome 7 that came from the mother going one way, the chromosome 7 that came from the father going the other. That halves the count, from 46 to 23, and each of the 23 is still a doubled chromosome. Or the sister chromatids could be separated: each chromosome splitting at its centromere so that both daughters get 46 single chromosomes. That keeps the count and undoes the doubling — which is precisely what mitosis does. One division can perform one of those. It physically cannot perform both, because the two require the chromosomes to be attached to the spindle in different ways: in the first, both chromatids of one chromosome face the SAME pole and it is the pair that is pulled apart; in the second, the two chromatids of one chromosome face OPPOSITE poles. A chromosome cannot be arranged both ways at once. So meiosis does them in order, and the names record which is which. Meiosis I is reductional: homologues part, 46 becomes 23, and it is here that crossing over and independent assortment have already shuffled the alleles. Meiosis II is equational: the 23 doubled chromosomes split into 23 single ones in each of two cells, so four cells result, each with 23 single chromosomes. The count halved once and only once. Check the arithmetic of the DNA alongside the chromosome count, because tracking both is what makes the whole thing legible. Call a resting cell's DNA content 2C. After S phase it is 4C with 46 chromosomes. After meiosis I: 2C with 23 chromosomes. After meiosis II: 1C with 23 chromosomes. The chromosome number halved at the first division and the DNA content halved at both — two different quantities, halving at different times, which is exactly the confusion the two names exist to prevent. (The second answer misses that the count could not halve twice; the third swaps the two divisions, which would leave every gamete with 46 chromosomes; and the fourth invents a second S phase, which does not occur — the single replication is what makes the second division possible without a third.)",
          hi: "विद्यार्थी के पास सही उत्तर है और अस्पष्ट कारण, और कारण को सटीक करना ही यहाँ की पूरी सीख है। शुरू करो इससे कि अर्धसूत्री विभाजन शुरू होते समय कोशिका थामे क्या है। अंतरावस्था चल चुकी है, S प्रावस्था सहित, अतः DNA नक़ल हो चुका है। अर्धसूत्री विभाजन में घुसती मानव कोशिका के पास इसलिए 46 गुणसूत्र हैं, और उन 46 में से हर एक गुणसूत्रबिंदु पर चिपके दो समान सहोदर अर्धगुणसूत्र है। गुणसूत्र गिनती 46 है; DNA की मात्रा विश्राम कर रही कोशिका से दोगुनी। यहाँ दो अलग चीज़ें खींची जा सकती थीं, और वे सचमुच भिन्न हैं। समजात युग्म अलग किए जा सकते थे: माता से आया गुणसूत्र 7 एक ओर, पिता से आया गुणसूत्र 7 दूसरी ओर। इससे गिनती आधी होती है, 46 से 23, और 23 में से हर एक अब भी दोहरा गुणसूत्र है। या सहोदर अर्धगुणसूत्र अलग किए जा सकते थे: हर गुणसूत्र अपने गुणसूत्रबिंदु पर बँटकर, ताकि दोनों संततियों को 46 एकल गुणसूत्र मिलें। इससे गिनती बनी रहती है और दोहरापन पलट जाता है — ठीक वही जो समसूत्री विभाजन करता है। एक विभाजन इनमें से एक कर सकता है। वह भौतिक रूप से दोनों नहीं कर सकता, क्योंकि दोनों के लिए गुणसूत्रों का तर्कु से भिन्न ढंग से जुड़ना ज़रूरी है: पहले में एक गुणसूत्र के दोनों अर्धगुणसूत्र उसी ध्रुव की ओर मुँह किए हैं और युग्म खींचकर अलग किया जाता है; दूसरे में एक गुणसूत्र के दो अर्धगुणसूत्र विपरीत ध्रुवों की ओर। कोई गुणसूत्र एक साथ दोनों ढंग से नहीं सज सकता। अतः अर्धसूत्री विभाजन उन्हें क्रम से करता है, और नाम दर्ज करते हैं कि कौन-सा कौन है। अर्धसूत्री I न्यूनकारी है: समजात अलग होते हैं, 46 से 23 होता है, और यहीं जीन-विनिमय और स्वतंत्र अपव्यूहन पहले ही युग्मविकल्पी फेंट चुके हैं। अर्धसूत्री II समकारी है: 23 दोहरे गुणसूत्र दो कोशिकाओं में से हर एक में 23 एकल में बँट जाते हैं, अतः चार कोशिकाएँ बनती हैं, हर एक में 23 एकल गुणसूत्र। गिनती एक बार आधी हुई और केवल एक बार। गुणसूत्र गिनती के साथ-साथ DNA का गणित भी जाँचो, क्योंकि दोनों का पीछा करना ही पूरी बात पठनीय बनाता है। विश्राम कर रही कोशिका की DNA मात्रा 2C कहो। S प्रावस्था के बाद वह 46 गुणसूत्रों के साथ 4C है। अर्धसूत्री I के बाद: 23 गुणसूत्रों के साथ 2C. अर्धसूत्री II के बाद: 23 गुणसूत्रों के साथ 1C. गुणसूत्र संख्या पहले विभाजन पर आधी हुई और DNA मात्रा दोनों पर — दो भिन्न राशियाँ, भिन्न समय पर आधी होतीं, और ठीक वही भ्रम रोकने को दोनों नाम हैं। (दूसरा उत्तर चूक जाता है कि गिनती दो बार आधी नहीं हो सकती थी; तीसरा दोनों विभाजन अदल-बदल देता है, जिससे हर युग्मक में 46 गुणसूत्र रह जाते; और चौथा दूसरी S प्रावस्था गढ़ता है, जो होती नहीं — इकलौती प्रतिकृति ही दूसरे विभाजन को तीसरे बिना संभव बनाती है।)",
          mr: "विद्यार्थ्याकडे बरोबर उत्तर आहे आणि अस्पष्ट कारण, आणि कारण नेमके करणे हीच इथली अख्खी शिकवण. सुरुवात यापासून की अर्धसूत्री विभाजन सुरू होताना पेशी काय धरून आहे. आंतरावस्था चालून गेली आहे, S प्रावस्थेसह, म्हणून DNA नक्कल झाले आहे. अर्धसूत्री विभाजनात शिरणाऱ्या मानवी पेशीकडे म्हणून 46 गुणसूत्रे, आणि त्या 46 पैकी प्रत्येक गुणसूत्रबिंदूवर चिकटलेली दोन सारखी सहोदर अर्धगुणसूत्रे. गुणसूत्र मोजणी 46; DNA चे प्रमाण विश्रांती घेणाऱ्या पेशीच्या दुप्पट. इथे दोन वेगळ्या गोष्टी ओढल्या जाऊ शकत होत्या, आणि त्या खरोखर वेगळ्या. समजात जोड्या वेगळ्या करता आल्या असत्या: आईकडून आलेले गुणसूत्र 7 एका बाजूला, वडिलांकडून आलेले गुणसूत्र 7 दुसऱ्या. याने मोजणी निम्मी होते, 46 वरून 23, आणि 23 पैकी प्रत्येक अजूनही दुहेरी गुणसूत्र. वा सहोदर अर्धगुणसूत्रे वेगळी करता आली असती: प्रत्येक गुणसूत्र आपल्या गुणसूत्रबिंदूवर विभागून, जेणेकरून दोन्ही कन्यांना 46 एकेरी गुणसूत्रे मिळावीत. याने मोजणी टिकते आणि दुहेरीपणा उलटतो — नेमके तेच जे समविभाजन करते. एक विभाजन यांतले एक करू शकते. ते भौतिकदृष्ट्या दोन्ही करू शकत नाही, कारण दोन्हींसाठी गुणसूत्रे तर्कूला वेगळ्या पद्धतीने जोडली जाणे आवश्यक: पहिल्यात एका गुणसूत्राची दोन्ही अर्धगुणसूत्रे त्याच ध्रुवाकडे तोंड करून आणि जोडी ओढून वेगळी केली जाते; दुसऱ्यात एका गुणसूत्राची दोन अर्धगुणसूत्रे विरुद्ध ध्रुवांकडे. कोणतेही गुणसूत्र एकाच वेळी दोन्ही पद्धतींनी मांडले जाऊ शकत नाही. म्हणून अर्धसूत्री विभाजन ती क्रमाने करते, आणि नावे नोंदवतात की कोणते कोणते. अर्धसूत्री I न्यूनकारी: समजात वेगळे होतात, 46 चे 23 होते, आणि इथेच जनुक-विनिमय आणि स्वतंत्र अपव्यूहन आधीच युग्मविकल्पी फेटून गेले आहेत. अर्धसूत्री II समकारी: 23 दुहेरी गुणसूत्रे दोन पेशींपैकी प्रत्येकीत 23 एकेरींत विभागतात, म्हणून चार पेशी बनतात, प्रत्येकीत 23 एकेरी गुणसूत्रे. मोजणी एकदा निम्मी झाली आणि फक्त एकदाच. गुणसूत्र मोजणीसोबतच DNA चे गणितही तपासा, कारण दोन्हींचा माग काढणेच अख्खी गोष्ट वाचनीय करते. विश्रांती घेणाऱ्या पेशीचे DNA प्रमाण 2C म्हणा. S प्रावस्थेनंतर ते 46 गुणसूत्रांसह 4C. अर्धसूत्री I नंतर: 23 गुणसूत्रांसह 2C. अर्धसूत्री II नंतर: 23 गुणसूत्रांसह 1C. गुणसूत्रसंख्या पहिल्या विभाजनावर निम्मी झाली आणि DNA प्रमाण दोन्हींवर — दोन वेगळ्या राशी, वेगळ्या वेळी निम्म्या होत, आणि नेमका तोच गोंधळ टाळायला दोन्ही नावे आहेत. (दुसरे उत्तर चुकवते की मोजणी दोनदा निम्मी होऊ शकली नसती; तिसरे दोन्ही विभाजने अदलाबदल करते, ज्याने प्रत्येक युग्मकात 46 गुणसूत्रे उरली असती; आणि चौथे दुसरी S प्रावस्था रचते, जी घडत नाही — एकमेव प्रतिकृतीच दुसरे विभाजन तिसऱ्याविना शक्य करते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A student asks why sexual reproduction is worth its cost, since an organism that simply copied itself would pass on all its genes instead of half. Answer using what meiosis does.",
          hi: "एक विद्यार्थी पूछता है कि लैंगिक जनन अपनी क़ीमत के लायक़ क्यों है, जबकि जो जीव बस अपनी नक़ल बनाता वह आधे नहीं, अपने सारे जीन आगे पहुँचाता। अर्धसूत्री विभाजन जो करता है उससे उत्तर दो।",
          mr: "एक विद्यार्थी विचारतो की लैंगिक प्रजनन आपल्या किमतीला योग्य का, जेव्हा जो सजीव फक्त स्वतःची नक्कल करेल तो निम्मी नव्हे, आपली सर्व जनुके पुढे पोहोचवेल. अर्धसूत्री विभाजन जे करते त्यातून उत्तर द्या.",
        },
        choices: [
          {
            en: "The cost is real — halving your genetic contribution is a fifty per cent tax — and what it buys is variation in the offspring. Meiosis shuffles twice: crossing over rewrites each chromosome as a mix of the two parents', and independent assortment sends either member of each pair to either pole, giving 2²³ combinations in a human before crossing over is counted. Fertilisation then combines two such shuffles. An asexual line passes on a fixed genome and can only wait for mutation, so when a parasite or a climate changes, the varied population almost always contains someone who survives and the clone may contain nobody",
            hi: "क़ीमत असली है — अपना आनुवंशिक योगदान आधा करना पचास प्रतिशत कर है — और वह ख़रीदती है संतान में विभिन्नता। अर्धसूत्री विभाजन दो बार फेंटता है: जीन-विनिमय हर गुणसूत्र को दोनों जनकों के मिश्रण के रूप में फिर से लिखता है, और स्वतंत्र अपव्यूहन हर युग्म का कोई भी सदस्य किसी भी ध्रुव पर भेजता है, जो मनुष्य में जीन-विनिमय गिनने से पहले ही 2²³ संयोजन देता है। फिर निषेचन ऐसे दो फेंटन जोड़ देता है। अलैंगिक वंश एक निश्चित जीनोम आगे देता है और केवल उत्परिवर्तन की प्रतीक्षा कर सकता है, अतः जब कोई परजीवी या जलवायु बदले, विविध समष्टि में लगभग सदा कोई ऐसा होता है जो बच जाए और क्लोन में कोई नहीं भी हो सकता",
            mr: "किंमत खरी आहे — आपले अनुवंशिक योगदान निम्मे करणे हा पन्नास टक्के कर — आणि ती विकत घेते संततीतली विविधता. अर्धसूत्री विभाजन दोनदा फेटते: जनुक-विनिमय प्रत्येक गुणसूत्राला दोन्ही जनकांच्या मिश्रणाच्या रूपात पुन्हा लिहितो, आणि स्वतंत्र अपव्यूहन प्रत्येक जोडीतला कोणताही सदस्य कोणत्याही ध्रुवाकडे पाठवते, जे माणसात जनुक-विनिमय मोजण्याआधीच 2²³ संयोजने देते. मग फलन अशी दोन फेटणी जोडते. अलैंगिक वंश एक ठरावीक जीनोम पुढे देतो आणि केवळ उत्परिवर्तनाची वाट पाहू शकतो, म्हणून जेव्हा एखादा परजीवी वा हवामान बदलते, विविध लोकसंख्येत जवळपास नेहमी कोणीतरी असतो जो वाचतो आणि क्लोनमध्ये कोणीही नसू शकतो",
          },
          {
            en: "There is no real cost: meiosis halves the number but fertilisation restores it, so a sexual parent passes on just as many genes as an asexual one",
            hi: "कोई असली क़ीमत नहीं: अर्धसूत्री विभाजन संख्या आधी करता है पर निषेचन उसे लौटा देता है, अतः लैंगिक जनक अलैंगिक जितने ही जीन आगे देता है",
            mr: "कोणतीही खरी किंमत नाही: अर्धसूत्री विभाजन संख्या निम्मी करते पण फलन ती परत आणते, म्हणून लैंगिक जनक अलैंगिकाइतकीच जनुके पुढे देतो",
          },
          {
            en: "Sexual reproduction is worth it because it produces more offspring than asexual reproduction, and numbers are what survival depends on",
            hi: "लैंगिक जनन इसलिए सार्थक है कि वह अलैंगिक जनन से अधिक संतान बनाता है, और उत्तरजीविता संख्या पर ही निर्भर है",
            mr: "लैंगिक प्रजनन यासाठी सार्थक की ते अलैंगिक प्रजननाहून अधिक संतती बनवते, आणि जगणे संख्येवरच अवलंबून",
          },
          {
            en: "It is worth it because meiosis repairs mutations, so sexual offspring carry fewer damaged genes than their parents did",
            hi: "यह इसलिए सार्थक है कि अर्धसूत्री विभाजन उत्परिवर्तनों की मरम्मत करता है, अतः लैंगिक संतान अपने जनकों से कम क्षतिग्रस्त जीन ढोती है",
            mr: "हे यासाठी सार्थक की अर्धसूत्री विभाजन उत्परिवर्तने दुरुस्त करते, म्हणून लैंगिक संतती आपल्या जनकांहून कमी क्षतिग्रस्त जनुके वाहते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student has spotted a genuine problem — biologists call it the twofold cost of sex — and the answer is not that the cost is imaginary but that something is bought with it. State the cost honestly first. An asexual female puts a complete copy of her genome into every offspring. A sexual female puts half of hers into each, and spends the other half of each offspring on somebody else's genes. On the arithmetic of gene transmission alone, asexual reproduction wins by a factor of two, every generation, forever. Any explanation that waves this away has not understood the question. Now what meiosis produces for the price. It shuffles twice, and the two shuffles are independent. INDEPENDENT ASSORTMENT: at metaphase I each homologous pair lines up with either member facing either pole, and each pair decides separately. With 23 pairs that is 2²³ — about 8.4 million — different chromosome combinations from one person, before anything else happens. CROSSING OVER: during prophase I the homologues exchange segments at chiasmata, so the chromosome that ends up in a gamete is not the mother's or the father's but a new mosaic of both. Since the breakpoints vary, this makes the number of possible gametes effectively unlimited. Fertilisation then multiplies two such numbers together. The result is that no two siblings are alike and no gamete has ever been made twice. What that is FOR is the second half of the answer. A clone's offspring are as fit as the parent was and no fitter, and their only route to novelty is mutation, which is slow and mostly harmful. A sexual population carries variation as standing stock, spread across individuals. When the environment changes — a new parasite, a drought, a pesticide — the question is no longer whether a helpful mutation might arise, but whether somebody in the population already has the combination that works. Usually somebody does. This matters most against living opponents, because a parasite evolves too. A clone is the same lock every generation, and a parasite that picks it once picks it in every host; a sexual population changes the lock each generation, which is why the fastest sexual reproduction is often found where parasite pressure is highest. Two honest qualifications keep the answer from becoming a slogan. Asexual reproduction is not a mistake — it is superior when conditions are stable and a well-adapted genome should be preserved intact, which is why aphids clone all summer and reproduce sexually only before winter, and why a farmer propagates a good mango variety by grafting rather than from seed. And meiosis does not repair anything; recombination can bring damaged genes together as easily as it separates them, and what it does is create the variation on which selection then acts. The general shape is worth keeping: when biology pays an obvious price for something, look for what the price buys, and expect the answer to be about a changing world rather than a static one. (The second answer denies the cost, which is the whole question; the third makes a claim about numbers that is usually the reverse of true; and the fourth attributes a repair function to meiosis that it does not have.)",
          hi: "विद्यार्थी ने असली समस्या पकड़ी है — जीवविज्ञानी उसे लिंग की दोगुनी क़ीमत कहते हैं — और उत्तर यह नहीं कि क़ीमत काल्पनिक है, बल्कि यह कि उससे कुछ ख़रीदा जाता है। पहले क़ीमत ईमानदारी से बताओ। अलैंगिक मादा अपने जीनोम की पूरी प्रति हर संतान में डालती है। लैंगिक मादा हर एक में अपना आधा डालती है, और हर संतान का दूसरा आधा किसी और के जीनों पर ख़र्च करती है। केवल जीन-संचरण के गणित पर अलैंगिक जनन दो के गुणक से जीतता है, हर पीढ़ी, सदा। जो व्याख्या इसे टाल दे उसने प्रश्न समझा ही नहीं। अब अर्धसूत्री विभाजन उस क़ीमत पर बनाता क्या है। वह दो बार फेंटता है, और दोनों फेंटन स्वतंत्र हैं। स्वतंत्र अपव्यूहन: मध्यावस्था I पर हर समजात युग्म ऐसे क़तार में लगता है कि कोई भी सदस्य किसी भी ध्रुव की ओर मुँह किए हो, और हर युग्म अलग तय करता है। 23 युग्मों के साथ वह 2²³ है — लगभग 84 लाख — एक व्यक्ति से भिन्न गुणसूत्र-संयोजन, और कुछ होने से पहले। जीन-विनिमय: पूर्वावस्था I में समजात काएज़्मा पर खंड अदल-बदलते हैं, अतः युग्मक में पहुँचता गुणसूत्र न माता का है न पिता का, बल्कि दोनों का नया पच्चीकारी है। चूँकि टूटने के बिंदु बदलते हैं, इससे संभव युग्मकों की संख्या प्रभावतः असीमित हो जाती है। फिर निषेचन ऐसी दो संख्याएँ गुणा कर देता है। परिणाम यह कि दो भाई-बहन एक जैसे नहीं और कोई युग्मक कभी दो बार नहीं बना। वह किसलिए है यह उत्तर का दूसरा आधा है। क्लोन की संतान जनक जितनी ही योग्य है, उससे अधिक नहीं, और नएपन का उनका इकलौता रास्ता उत्परिवर्तन है, जो धीमा और अधिकतर हानिकारक है। लैंगिक समष्टि विभिन्नता को खड़े भंडार के रूप में ढोती है, व्यष्टियों में बँटी। पर्यावरण बदलने पर — नया परजीवी, सूखा, कीटनाशी — प्रश्न अब यह नहीं कि कोई उपयोगी उत्परिवर्तन उठ सकता है या नहीं, बल्कि यह कि समष्टि में किसी के पास पहले से वह संयोजन है या नहीं जो काम करे। प्रायः किसी के पास होता है। यह जीवित प्रतिद्वंद्वियों के विरुद्ध सबसे अधिक मायने रखता है, क्योंकि परजीवी भी विकसित होता है। क्लोन हर पीढ़ी वही ताला है, और जो परजीवी उसे एक बार खोल ले वह हर परपोषी में खोल लेता है; लैंगिक समष्टि हर पीढ़ी ताला बदल देती है, इसीलिए सबसे तेज़ लैंगिक जनन प्रायः वहाँ मिलता है जहाँ परजीवी का दबाव सबसे अधिक है। दो ईमानदार शर्तें उत्तर को नारा बनने से रोकती हैं। अलैंगिक जनन भूल नहीं — वह तब श्रेष्ठ है जब परिस्थितियाँ स्थिर हों और भलीभाँति अनुकूलित जीनोम अक्षत रखा जाना चाहिए, इसीलिए ऐफ़िड पूरी गर्मी क्लोन बनाते हैं और लैंगिक जनन केवल सर्दी से पहले करते हैं, और इसीलिए किसान आम की अच्छी क़िस्म बीज से नहीं, कलम से बढ़ाता है। और अर्धसूत्री विभाजन कुछ मरम्मत नहीं करता; पुनर्संयोजन क्षतिग्रस्त जीनों को जितनी आसानी से अलग करता है उतनी ही आसानी से साथ भी ला सकता है, और वह जो करता है वह वही विभिन्नता बनाना है जिस पर फिर वरण काम करता है। सामान्य आकार रखने योग्य है: जब जीवविज्ञान किसी चीज़ की स्पष्ट क़ीमत चुकाए, देखो कि वह क़ीमत ख़रीदती क्या है, और अपेक्षा रखो कि उत्तर स्थिर नहीं, बदलती दुनिया के बारे में होगा। (दूसरा उत्तर क़ीमत से ही इनकार करता है, जो पूरा प्रश्न है; तीसरा संख्याओं के बारे में ऐसा दावा करता है जो प्रायः सच का उलटा है; और चौथा अर्धसूत्री विभाजन को मरम्मत का काम सौंपता है जो उसका है ही नहीं।)",
          mr: "विद्यार्थ्याने खरी समस्या पकडली आहे — जीवशास्त्रज्ञ तिला लिंगाची दुप्पट किंमत म्हणतात — आणि उत्तर हे नाही की किंमत काल्पनिक आहे, तर हे की तिच्याने काहीतरी विकत घेतले जाते. आधी किंमत प्रामाणिकपणे सांगा. अलैंगिक मादी आपल्या जीनोमची पूर्ण प्रत प्रत्येक संततीत घालते. लैंगिक मादी प्रत्येकात आपले निम्मे घालते, आणि प्रत्येक संततीचा दुसरा निम्मा भाग दुसऱ्याच्या जनुकांवर खर्च करते. केवळ जनुक-संक्रमणाच्या गणितावर अलैंगिक प्रजनन दोनच्या पटीने जिंकते, प्रत्येक पिढीत, कायम. जे स्पष्टीकरण हे टाळते त्याने प्रश्न समजलाच नाही. आता अर्धसूत्री विभाजन त्या किमतीवर बनवते काय. ते दोनदा फेटते, आणि दोन्ही फेटणी स्वतंत्र. स्वतंत्र अपव्यूहन: मध्यावस्था I वर प्रत्येक समजात जोडी अशी रांगेत लागते की कोणताही सदस्य कोणत्याही ध्रुवाकडे तोंड करून असावा, आणि प्रत्येक जोडी वेगळी ठरवते. 23 जोड्यांसह ते 2²³ — सुमारे 84 लाख — एका व्यक्तीकडून वेगळी गुणसूत्र-संयोजने, आणि दुसरे काही घडण्याआधी. जनुक-विनिमय: पूर्वावस्था I मध्ये समजात कायाझ्मावर खंड अदलाबदल करतात, म्हणून युग्मकात पोहोचणारे गुणसूत्र ना आईचे ना वडिलांचे, तर दोघांचे नवे कलाकाम. तुटण्याचे बिंदू बदलत असल्याने, यामुळे शक्य युग्मकांची संख्या प्रभावीपणे अमर्याद होते. मग फलन अशा दोन संख्या गुणते. परिणाम असा की दोन भावंडे सारखी नाहीत आणि कोणतेही युग्मक कधीच दोनदा बनले नाही. ते कशासाठी हा उत्तराचा दुसरा अर्धा भाग. क्लोनची संतती जनकाइतकीच सक्षम, तिच्याहून अधिक नाही, आणि नावीन्याचा त्यांचा एकमेव मार्ग उत्परिवर्तन, जे मंद आणि बहुतांशी हानिकारक. लैंगिक लोकसंख्या विविधता उभा साठा म्हणून वाहते, व्यक्तींत विभागलेली. पर्यावरण बदलताच — नवा परजीवी, दुष्काळ, कीटकनाशक — प्रश्न आता हा नाही की एखादे उपयुक्त उत्परिवर्तन उद्भवू शकते का, तर हा की लोकसंख्येत कोणाकडे आधीच ते संयोजन आहे का जे चालते. बहुधा कोणाकडे तरी असते. हे जिवंत प्रतिस्पर्ध्यांविरुद्ध सर्वांत महत्त्वाचे, कारण परजीवीही उत्क्रांत होतो. क्लोन प्रत्येक पिढीत तेच कुलूप, आणि जो परजीवी ते एकदा उघडतो तो प्रत्येक यजमानात उघडतो; लैंगिक लोकसंख्या प्रत्येक पिढीत कुलूप बदलते, म्हणूनच सर्वांत वेगवान लैंगिक प्रजनन बहुधा तिथे आढळते जिथे परजीवीचा दबाव सर्वाधिक. दोन प्रामाणिक अटी उत्तराला घोषणा बनण्यापासून रोखतात. अलैंगिक प्रजनन ही चूक नव्हे — ते तेव्हा श्रेष्ठ जेव्हा परिस्थिती स्थिर आणि उत्तम अनुकूलित जीनोम अक्षत ठेवायचा असेल, म्हणूनच मावा अख्खा उन्हाळा क्लोन बनवतो आणि लैंगिक प्रजनन केवळ हिवाळ्याआधी करतो, आणि म्हणूनच शेतकरी आंब्याची चांगली जात बीजातून नव्हे, कलमाने वाढवतो. आणि अर्धसूत्री विभाजन काहीही दुरुस्त करत नाही; पुनर्संयोजन क्षतिग्रस्त जनुके जितक्या सहजतेने वेगळी करते तितक्याच सहजतेने एकत्रही आणू शकते, आणि ते जे करते ते तीच विविधता निर्माण करणे जिच्यावर मग निवड काम करते. सामान्य आकार ठेवण्याजोगा: जेव्हा जीवशास्त्र एखाद्या गोष्टीची स्पष्ट किंमत मोजते, ती किंमत काय विकत घेते ते पाहा, आणि उत्तर स्थिर नव्हे, बदलत्या जगाबद्दल असेल अशी अपेक्षा ठेवा. (दुसरे उत्तर किंमतच नाकारते, जो अख्खा प्रश्न आहे; तिसरे संख्यांबद्दल असा दावा करते जो बहुधा सत्याच्या उलट; आणि चौथे अर्धसूत्री विभाजनाला दुरुस्तीचे काम देते जे त्याचे नाहीच.)",
        },
      },
      /*H10B*/
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
  /**
   * The second place in Class 11 Biology where the counting is real. A cell's
   * size limit is not a fact to be recalled; it is a ratio, and a pupil who
   * cannot compute it has not understood why cells are small.
   */
  "biology-11-cell-the-unit-of-life": [
    {
      level: 1,
      stem: {
        en: "A cube-shaped cell is 2 µm along each edge. What is its total surface area, in square micrometres?",
        hi: "घन आकार की कोशिका की हर कोर 2 µm है। उसका कुल पृष्ठीय क्षेत्रफल वर्ग माइक्रोमीटर में कितना है?",
        mr: "घनाकार पेशीची प्रत्येक कड 2 µm आहे. तिचे एकूण पृष्ठीय क्षेत्रफळ चौरस मायक्रोमीटरमध्ये किती?",
      },
      answer: 24,
      wrong: [8, 12, 4],
      checkExpr: "6*2*2",
      solution: {
        en: "A cube has six faces, each 2 × 2 = 4, so 6 × 4 = 24 µm². The cube is the standard model here not because cells are cubic but because its area and volume are easy to compute exactly, and the RATIO between them behaves the same way for any shape. (8 gives the volume instead.)",
        hi: "घन के छह फलक हैं, हर एक 2 × 2 = 4, अतः 6 × 4 = 24 µm². यहाँ घन मानक प्रतिरूप इसलिए है कि उसके क्षेत्रफल और आयतन ठीक-ठीक निकाले जा सकते हैं, न कि इसलिए कि कोशिकाएँ घनाकार हैं, और उनके बीच का अनुपात किसी भी आकृति के लिए वैसे ही बर्ताव करता है। (8 इसके बजाय आयतन दे देता है।)",
        mr: "घनाला सहा पृष्ठे, प्रत्येक 2 × 2 = 4, म्हणून 6 × 4 = 24 µm². इथे घन हे प्रमाणित प्रतिमान यासाठी की त्याचे क्षेत्रफळ आणि आकारमान नेमके काढता येतात, पेशी घनाकार आहेत म्हणून नव्हे, आणि त्यांच्यातले गुणोत्तर कोणत्याही आकृतीसाठी तसेच वागते. (8 त्याऐवजी आकारमान देते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "The same cube-shaped cell is 2 µm along each edge. What is its volume, in cubic micrometres?",
        hi: "उसी घन आकार की कोशिका की हर कोर 2 µm है। उसका आयतन घन माइक्रोमीटर में कितना है?",
        mr: "त्याच घनाकार पेशीची प्रत्येक कड 2 µm आहे. तिचे आकारमान घन मायक्रोमीटरमध्ये किती?",
      },
      answer: 8,
      wrong: [24, 6, 4],
      checkExpr: "2*2*2",
      solution: {
        en: "2 × 2 × 2 = 8 µm³. Set beside the surface area of 24, this gives a ratio of 3 to 1 — three units of membrane for every unit of contents, which is comfortable. Watch what happens to that comfort as the edge grows. (24 quotes the area.)",
        hi: "2 × 2 × 2 = 8 µm³. 24 के पृष्ठीय क्षेत्रफल के बग़ल में रखने पर यह 3 : 1 का अनुपात देता है — भीतरी भाग की हर इकाई पर झिल्ली की तीन इकाइयाँ, जो सुखद है। कोर बढ़ने पर उस सुख का क्या होता है, देखो। (24 क्षेत्रफल बता देता है।)",
        mr: "2 × 2 × 2 = 8 µm³. 24 च्या पृष्ठीय क्षेत्रफळाशेजारी ठेवल्यास हे 3 : 1 गुणोत्तर देते — आतल्या भागाच्या प्रत्येक एककामागे पटलाची तीन एकके, जे सुखद. कड वाढताच त्या सुखाचे काय होते ते पाहा. (24 क्षेत्रफळ सांगते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A cube-shaped cell has an edge of 4 µm. What is its surface-area-to-volume ratio?",
        hi: "घन आकार की कोशिका की कोर 4 µm है। उसका पृष्ठीय क्षेत्रफल और आयतन का अनुपात क्या है?",
        mr: "घनाकार पेशीची कड 4 µm आहे. तिचे पृष्ठीय क्षेत्रफळ आणि आकारमान गुणोत्तर किती?",
      },
      answer: 1.5,
      wrong: [3, 6, 2],
      checkExpr: "96/64",
      solution: {
        en: "Area is 6 × 16 = 96 and volume is 4³ = 64, so 96/64 = 1.5. The 2 µm cell had 3. Doubling the edge halved the ratio, and it will halve again at 8 µm — the ratio for a cube is always 6/edge, so it can only fall. (3 quotes the smaller cell's ratio.)",
        hi: "क्षेत्रफल 6 × 16 = 96 और आयतन 4³ = 64, अतः 96/64 = 1.5. 2 µm वाली कोशिका का 3 था। कोर दोगुनी करने से अनुपात आधा हो गया, और 8 µm पर वह फिर आधा होगा — घन के लिए अनुपात सदा 6/कोर है, अतः वह केवल गिर ही सकता है। (3 छोटी कोशिका का अनुपात बता देता है।)",
        mr: "क्षेत्रफळ 6 × 16 = 96 आणि आकारमान 4³ = 64, म्हणून 96/64 = 1.5. 2 µm पेशीचे 3 होते. कड दुप्पट केल्याने गुणोत्तर निम्मे झाले, आणि 8 µm वर ते पुन्हा निम्मे होईल — घनासाठी गुणोत्तर नेहमी 6/कड, म्हणून ते केवळ घटूच शकते. (3 लहान पेशीचे गुणोत्तर सांगते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A cell is 20 µm across and appears 60 mm across in a photograph. What is the magnification?",
        hi: "कोई कोशिका 20 µm चौड़ी है और छायाचित्र में 60 mm चौड़ी दिखती है। आवर्धन कितना है?",
        mr: "एक पेशी 20 µm रुंद आहे आणि छायाचित्रात 60 mm रुंद दिसते. विवर्धन किती?",
      },
      answer: 3000,
      wrong: [3, 300, 30000],
      checkExpr: "60000/20",
      solution: {
        en: "Both lengths must be in the same unit before dividing: 60 mm is 60,000 µm, so 60,000/20 = 3,000 times. Forgetting to convert is the whole difficulty here, and it is why a magnification is written as a bare number — it is a ratio of two lengths, so the units cancel and none is left. (3 divides 60 by 20 without converting.)",
        hi: "भाग देने से पहले दोनों लंबाइयाँ एक ही मात्रक में होनी चाहिए: 60 mm यानी 60,000 µm, अतः 60,000/20 = 3,000 गुना। यहाँ पूरी कठिनाई मात्रक बदलना भूल जाना है, और इसीलिए आवर्धन नंगी संख्या में लिखा जाता है — वह दो लंबाइयों का अनुपात है, अतः मात्रक कट जाते हैं और कोई नहीं बचता। (3 बिना बदले 60 में 20 का भाग दे देता है।)",
        mr: "भागण्याआधी दोन्ही लांबी एकाच एककात असाव्यात: 60 mm म्हणजे 60,000 µm, म्हणून 60,000/20 = 3,000 पट. इथली अख्खी अडचण एकक बदलायला विसरणे, आणि म्हणूनच विवर्धन उघड्या आकड्यात लिहिले जाते — ते दोन लांबींचे गुणोत्तर, म्हणून एकके कापली जातात आणि एकही उरत नाही. (3 न बदलता 60 ला 20 ने भागते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A cube-shaped cell has an edge of 6 µm. What is its surface-area-to-volume ratio?",
        hi: "घन आकार की कोशिका की कोर 6 µm है। उसका पृष्ठीय क्षेत्रफल और आयतन का अनुपात क्या है?",
        mr: "घनाकार पेशीची कड 6 µm आहे. तिचे पृष्ठीय क्षेत्रफळ आणि आकारमान गुणोत्तर किती?",
      },
      answer: 1,
      wrong: [1.5, 2, 6],
      checkExpr: "216/216",
      solution: {
        en: "Area is 6 × 36 = 216 and volume is 6³ = 216, so the ratio is exactly 1. This is the size at which a cube has as much membrane as contents; beyond it, every added micrometre of edge leaves the interior with less supply per unit of demand than the one before. (1.5 quotes the 4 µm cell.)",
        hi: "क्षेत्रफल 6 × 36 = 216 और आयतन 6³ = 216, अतः अनुपात ठीक 1 है। यही वह आकार है जिस पर घन के पास जितनी झिल्ली उतना भीतरी भाग है; उससे आगे कोर का हर जुड़ा माइक्रोमीटर भीतर को प्रति इकाई माँग पिछले से कम आपूर्ति देता है। (1.5 4 µm वाली कोशिका बता देता है।)",
        mr: "क्षेत्रफळ 6 × 36 = 216 आणि आकारमान 6³ = 216, म्हणून गुणोत्तर नेमके 1. हाच तो आकार जिथे घनाकडे जितके पटल तितकाच आतला भाग; त्यापलीकडे कडेचा प्रत्येक जोडलेला मायक्रोमीटर आतल्या भागाला प्रति एकक मागणी आधीच्याहून कमी पुरवठा देतो. (1.5 4 µm पेशी सांगते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Diffusion time rises with the square of distance. If crossing 10 µm takes 1 unit of time, how many units does crossing 30 µm take?",
        hi: "विसरण का समय दूरी के वर्ग से बढ़ता है। यदि 10 µm पार करने में 1 इकाई समय लगे, तो 30 µm पार करने में कितनी इकाइयाँ लगेंगी?",
        mr: "विसरणाचा वेळ अंतराच्या वर्गाने वाढतो. 10 µm ओलांडायला 1 एकक वेळ लागत असेल, तर 30 µm ओलांडायला किती एकके लागतील?",
      },
      answer: 9,
      wrong: [3, 6, 27],
      checkExpr: "3^2",
      solution: {
        en: "Three times the distance is 3² = 9 times the time. This is the second reason cells stay small, independent of the surface ratio: even if enough material crossed the membrane, it would take too long to reach the middle. Tripling a cell's radius makes its centre nine times as far away in time. (3 forgets to square.)",
        hi: "तीन गुनी दूरी यानी 3² = 9 गुना समय। सतह-अनुपात से स्वतंत्र, कोशिकाओं के छोटे रहने का यह दूसरा कारण है: यदि पर्याप्त पदार्थ झिल्ली पार कर भी जाए, तो बीच तक पहुँचने में बहुत देर लगेगी। कोशिका की त्रिज्या तिगुनी करना उसके केंद्र को समय में नौ गुना दूर कर देता है। (3 वर्ग करना भूल जाता है।)",
        mr: "तिप्पट अंतर म्हणजे 3² = 9 पट वेळ. पृष्ठ-गुणोत्तरापासून स्वतंत्र, पेशी लहान राहण्याचे हे दुसरे कारण: पुरेसे द्रव्य पटल ओलांडून गेले तरी मध्यापर्यंत पोहोचायला खूप वेळ लागेल. पेशीची त्रिज्या तिप्पट करणे तिच्या मध्याला वेळेत नऊपट दूर करते. (3 वर्ग करायला विसरते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A 70S ribosome has subunits of 50S and 30S. By how much does the sum of the subunits exceed the whole?",
        hi: "70S राइबोसोम की उपइकाइयाँ 50S और 30S हैं। उपइकाइयों का योग पूरे से कितना अधिक है?",
        mr: "70S रायबोसोमची उपएकके 50S आणि 30S आहेत. उपएककांची बेरीज अख्ख्याहून किती अधिक?",
      },
      answer: 10,
      wrong: [0, 20, 80],
      checkExpr: "50+30-70",
      solution: {
        en: "50 + 30 − 70 = 10, and the fact that the answer is not zero is the point. S is a sedimentation coefficient — how fast a particle settles in a centrifuge — and it depends on shape and density as well as mass. Two subunits joined make a more compact particle than the two apart, so it sediments at less than the sum. Anyone who expects the numbers to add has read S as a weight. (0 assumes exactly that.)",
        hi: "50 + 30 − 70 = 10, और उत्तर शून्य न होना ही असली बात है। S अवसादन गुणांक है — कण अपकेंद्रित्र में कितनी तेज़ बैठता है — और वह द्रव्यमान के साथ आकृति और घनत्व पर भी निर्भर है। जुड़ी दो उपइकाइयाँ अलग-अलग दो से अधिक ठस कण बनाती हैं, अतः वह योग से कम पर अवसादित होता है। जो संख्याओं के जुड़ने की आशा करे उसने S को भार पढ़ा है। (0 ठीक वही मान लेता है।)",
        mr: "50 + 30 − 70 = 10, आणि उत्तर शून्य नसणे हाच मुद्दा. S हा अवसादन गुणांक — कण अपकेंद्रित्रात किती वेगाने बसतो — आणि तो वस्तुमानासोबत आकृती आणि घनतेवरही अवलंबून. जोडलेली दोन उपएकके वेगळ्या दोघांहून अधिक घट्ट कण बनवतात, म्हणून तो बेरजेहून कमी वर अवसादित होतो. जो आकडे जुळण्याची अपेक्षा करतो त्याने S ला वजन वाचले आहे. (0 नेमके तेच गृहीत धरते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A cube-shaped cell of edge 3 µm grows until each edge is 9 µm. By what factor does its volume increase?",
        hi: "3 µm कोर की घन आकार कोशिका बढ़कर हर कोर 9 µm कर लेती है। उसका आयतन कितने गुना बढ़ता है?",
        mr: "3 µm कड असलेली घनाकार पेशी वाढून प्रत्येक कड 9 µm करते. तिचे आकारमान किती पट वाढते?",
      },
      answer: 27,
      wrong: [3, 9, 81],
      checkExpr: "729/27",
      solution: {
        en: "729/27 = 27, which is 3³ — tripling every edge multiplies the volume by twenty-seven. The surface area meanwhile went up by only 3² = 9 times, from 54 to 486 µm². Put those together and the whole chapter's constraint appears in two numbers: the cell now has nine times the doorway and twenty-seven times the room to supply, so the supply per unit of demand has fallen to a third of what it was. The ratio itself confirms it — 6/3 = 2 before, 6/9 = 0.67 after. This is why an organism that needs to be bigger makes more cells rather than larger ones: a thousand small cells have the same total volume as one big one and vastly more membrane between them. It is also why the exceptions are shaped the way they are. A cell that must hold a lot — an egg — fills itself with inert yolk that demands no supply. A cell that must be long — a neuron — stays thin, so no point inside it is far from the surface. And a tissue that must exchange a great deal — the gut lining, the lung, a root — is folded, villous or hairy, buying area without buying volume. (3 quotes the edge factor and 9 the area factor; both are the right arithmetic applied to the wrong quantity.)",
        hi: "729/27 = 27, जो 3³ है — हर कोर तिगुनी करने से आयतन सत्ताईस गुना हो जाता है। इस बीच पृष्ठीय क्षेत्रफल केवल 3² = 9 गुना बढ़ा, 54 से 486 µm². दोनों साथ रखो और पूरे अध्याय का बंधन दो संख्याओं में प्रकट हो जाता है: कोशिका के पास अब नौ गुना द्वार और सत्ताईस गुना कमरा है जिसे आपूर्ति देनी है, अतः प्रति इकाई माँग आपूर्ति गिरकर पहले की एक-तिहाई रह गई। अनुपात स्वयं इसकी पुष्टि करता है — पहले 6/3 = 2, बाद में 6/9 = 0.67. इसीलिए जिस जीव को बड़ा होना है वह बड़ी कोशिकाएँ नहीं, अधिक कोशिकाएँ बनाता है: हज़ार छोटी कोशिकाओं का कुल आयतन एक बड़ी जितना ही है और उनके बीच झिल्ली कहीं अधिक। इसीलिए अपवाद जिस आकार के हैं उसी के हैं। जिस कोशिका को बहुत कुछ थामना है — अंडा — वह स्वयं को निष्क्रिय पीतक से भर लेती है जो आपूर्ति माँगता ही नहीं। जिस कोशिका को लंबा होना है — तंत्रिका कोशिका — वह पतली रहती है, अतः उसके भीतर कोई बिंदु सतह से दूर नहीं। और जिस ऊतक को बहुत विनिमय करना है — आँत का आस्तर, फेफड़ा, जड़ — वह मुड़ा, रसांकुरित या रोमिल है, आयतन ख़रीदे बिना क्षेत्रफल ख़रीदता। (3 कोर का गुणक बता देता है और 9 क्षेत्रफल का; दोनों सही गणित ग़लत राशि पर लगाए गए हैं।)",
        mr: "729/27 = 27, जे 3³ — प्रत्येक कड तिप्पट केल्याने आकारमान सत्तावीस पट होते. दरम्यान पृष्ठीय क्षेत्रफळ केवळ 3² = 9 पट वाढले, 54 वरून 486 µm². दोन्ही एकत्र ठेवा आणि अख्ख्या प्रकरणाचे बंधन दोन आकड्यांत उमटते: पेशीकडे आता नऊपट दार आणि सत्तावीसपट खोली आहे जिला पुरवायचे, म्हणून प्रति एकक मागणी पुरवठा घटून आधीच्या एक तृतीयांश उरला. गुणोत्तर स्वतःच याची पुष्टी करते — आधी 6/3 = 2, नंतर 6/9 = 0.67. म्हणूनच ज्या सजीवाला मोठे व्हायचे तो मोठ्या पेशी नव्हे, अधिक पेशी बनवतो: हजार लहान पेशींचे एकूण आकारमान एका मोठीइतकेच आणि त्यांच्यामध्ये पटल कितीतरी अधिक. म्हणूनच अपवाद ज्या आकाराचे आहेत त्याच आकाराचे. ज्या पेशीला बरेच धरायचे — अंडे — ती स्वतःला निष्क्रिय बलकाने भरते जो पुरवठा मागतच नाही. ज्या पेशीला लांब व्हायचे — चेतापेशी — ती पातळ राहते, म्हणून तिच्या आत कोणताही बिंदू पृष्ठभागापासून दूर नाही. आणि ज्या ऊतीला भरपूर देवाणघेवाण करायची — आतड्याचे अस्तर, फुफ्फुस, मूळ — ती घडी घातलेली, रसांकुरित वा केसाळ, आकारमान न विकत घेता क्षेत्रफळ विकत घेत. (3 कडेचा गुणक सांगते आणि 9 क्षेत्रफळाचा; दोन्ही बरोबर गणित चुकीच्या राशीवर लावलेले.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A spherical cell has a radius of 5 µm. Its surface-area-to-volume ratio is 3/r. What is the ratio, per micrometre?",
        hi: "किसी गोलाकार कोशिका की त्रिज्या 5 µm है। उसका पृष्ठीय क्षेत्रफल और आयतन का अनुपात 3/r है। वह अनुपात प्रति माइक्रोमीटर कितना है?",
        mr: "एका गोलाकार पेशीची त्रिज्या 5 µm आहे. तिचे पृष्ठीय क्षेत्रफळ आणि आकारमान गुणोत्तर 3/r आहे. ते गुणोत्तर प्रति मायक्रोमीटर किती?",
      },
      answer: 0.6,
      wrong: [1.67, 15, 5],
      checkExpr: "3/5",
      solution: {
        en: "3/5 = 0.6 per micrometre. Where the formula comes from is worth deriving once, because it makes the whole argument portable. A sphere's surface area is 4πr² and its volume is (4/3)πr³. Divide the first by the second: the 4 and the π cancel, r² over r³ leaves 1/r, and dividing by one-third multiplies by three — so the ratio is 3/r exactly, with no constants left to argue about. Read that expression and the biology falls out of it. The ratio depends on NOTHING except the radius, and it is INVERSELY proportional to it, so there is no size at which growth stops making things worse and no shape parameter a cell could tune to escape it. Halving the radius doubles the ratio; doubling the radius halves it. A bacterium at r = 0.5 µm has a ratio of 6, a human cell at r = 10 has 0.3, and the fist-sized amoeba of the earlier question would have about 0.0001 — four orders of magnitude short of what a working cell needs. The cube gives the same answer in a different dress: its ratio is 6/edge, again inverse and again with no escape. That the two shapes agree is the signal that the result belongs to geometry rather than to spheres. What life does about it is the interesting part, and every solution accepts the formula rather than beating it. Stay small and multiply — the universal answer. Keep one dimension small even if another is enormous, which is a neuron, a muscle fibre and a hypha. Fold the surface without adding volume, which is a mitochondrial crista, a villus, a root hair and an alveolus. Or fill the volume with material that makes no demands, which is an egg and a fat cell. Notice that none of these changes the ratio's dependence on r; they change WHICH r is doing the work. That is what a real constraint looks like: you do not defeat it, you design around it, and knowing the formula tells you exactly which designs are available. (1.67 inverts the fraction to 5/3; 15 multiplies instead of dividing; and 5 repeats the radius.)",
        hi: "3/5 = 0.6 प्रति माइक्रोमीटर। सूत्र आता कहाँ से है यह एक बार निकाल लेना उचित है, क्योंकि इससे पूरा तर्क कहीं भी ले जाया जा सकता है। गोले का पृष्ठीय क्षेत्रफल 4πr² और आयतन (4/3)πr³. पहले में दूसरे का भाग दो: 4 और π कट जाते हैं, r² बटा r³ से 1/r बचता है, और एक-तिहाई से भाग देना तीन से गुणा करना है — अतः अनुपात ठीक 3/r है, जिसमें बहस को कोई अचर नहीं बचा। उस व्यंजक को पढ़ो और जीवविज्ञान उसी से निकल आता है। अनुपात त्रिज्या के सिवा किसी पर निर्भर नहीं, और उसका व्युत्क्रमानुपाती है, अतः ऐसा कोई आकार नहीं जिस पर वृद्धि बात बिगाड़ना बंद कर दे और ऐसा कोई आकृति-प्राचल नहीं जिसे साधकर कोशिका बच निकले। त्रिज्या आधी करना अनुपात दोगुना करता है; त्रिज्या दोगुनी करना उसे आधा। r = 0.5 µm का जीवाणु 6 का अनुपात रखता है, r = 10 की मानव कोशिका 0.3, और पिछले प्रश्न का मुट्ठी जितना अमीबा लगभग 0.0001 — काम करती कोशिका को जो चाहिए उससे चार कोटि कम। घन वही उत्तर दूसरे लिबास में देता है: उसका अनुपात 6/कोर है, फिर व्युत्क्रम और फिर बचाव नहीं। दोनों आकृतियों का सहमत होना ही संकेत है कि परिणाम गोलों का नहीं, ज्यामिति का है। जीवन इस बारे में क्या करता है वह रोचक भाग है, और हर समाधान सूत्र को हराता नहीं, स्वीकार करता है। छोटे रहो और गुणा करो — सार्वभौम उत्तर। एक विमा छोटी रखो चाहे दूसरी विशाल हो, और यही तंत्रिका कोशिका, पेशी तंतु और कवक-तंतु है। आयतन जोड़े बिना सतह मोड़ो, और यही सूत्रकणिका की क्रिस्टी, रसांकुर, मूलरोम और कूपिका है। या आयतन को ऐसे पदार्थ से भर दो जो कोई माँग न करे, और यही अंडा और वसा कोशिका है। ध्यान दो कि इनमें से कोई अनुपात की r पर निर्भरता नहीं बदलता; वे बदलते हैं कि काम कौन-सा r कर रहा है। असली बंधन ऐसा ही दिखता है: तुम उसे हराते नहीं, उसके इर्द-गिर्द अभिकल्प करते हो, और सूत्र जानना ठीक-ठीक बता देता है कि कौन-से अभिकल्प उपलब्ध हैं। (1.67 भिन्न को उलटकर 5/3 कर देता है; 15 भाग के बजाय गुणा करता है; और 5 त्रिज्या दोहरा देता है।)",
        mr: "3/5 = 0.6 प्रति मायक्रोमीटर. सूत्र कुठून येते हे एकदा काढणे योग्य, कारण त्याने अख्खा युक्तिवाद कुठेही नेता येतो. गोलाचे पृष्ठीय क्षेत्रफळ 4πr² आणि आकारमान (4/3)πr³. पहिल्याला दुसऱ्याने भागा: 4 आणि π कापले जातात, r² भागिले r³ मधून 1/r उरते, आणि एक तृतीयांशाने भागणे म्हणजे तीनने गुणणे — म्हणून गुणोत्तर नेमके 3/r, ज्यात वादासाठी कोणताही अचल उरला नाही. ते पद वाचा आणि जीवशास्त्र त्यातूनच निघते. गुणोत्तर त्रिज्येखेरीज कशावरही अवलंबून नाही, आणि तिच्या व्यस्त प्रमाणात, म्हणून असा कोणताही आकार नाही जिथे वाढ गोष्टी बिघडवणे थांबवेल आणि असा कोणताही आकृती-प्राचल नाही जो जुळवून पेशी सुटेल. त्रिज्या निम्मी करणे गुणोत्तर दुप्पट करते; त्रिज्या दुप्पट करणे ते निम्मे. r = 0.5 µm चा जीवाणू 6 चे गुणोत्तर ठेवतो, r = 10 ची मानवी पेशी 0.3, आणि मागच्या प्रश्नातला मुठीएवढा अमिबा सुमारे 0.0001 — काम करणाऱ्या पेशीला लागते त्याहून चार कोटी कमी. घन तेच उत्तर वेगळ्या वेशात देतो: त्याचे गुणोत्तर 6/कड, पुन्हा व्यस्त आणि पुन्हा सुटका नाही. दोन्ही आकृती सहमत असणे हाच संकेत की निकाल गोलांचा नव्हे, भूमितीचा आहे. जीवन याबद्दल काय करते हा रोचक भाग, आणि प्रत्येक उपाय सूत्राला हरवत नाही, स्वीकारतो. लहान राहा आणि गुणा — वैश्विक उत्तर. एक मिती लहान ठेवा जरी दुसरी अवाढव्य असो, आणि हीच चेतापेशी, स्नायुतंतू आणि कवकतंतू. आकारमान न जोडता पृष्ठभाग घडी घाला, आणि हीच तंतुकणिकेची क्रिस्टी, रसांकुर, मूलकेस आणि वायुकोश. वा आकारमान अशा द्रव्याने भरा जे कोणतीही मागणी करत नाही, आणि हेच अंडे आणि चरबीपेशी. लक्षात घ्या की यांतले कोणतेही गुणोत्तराचे r वरचे अवलंबन बदलत नाही; ते बदलतात की काम कोणता r करत आहे. खरे बंधन असेच दिसते: तुम्ही ते हरवत नाही, त्याभोवती रचना करता, आणि सूत्र जाणणे नेमके सांगते की कोणत्या रचना उपलब्ध आहेत. (1.67 अपूर्णांक उलटवून 5/3 करते; 15 भागण्याऐवजी गुणते; आणि 5 त्रिज्या पुन्हा सांगते.)",
      },
    },
  ],
  /**
   * Polymer arithmetic: n units, n − 1 bonds, n − 1 waters. Real counting —
   * the same sum answers a peptide, a starch chain and a nucleic acid, and a
   * pupil who has not done it once tends to write n instead of n − 1 forever.
   */
  "biology-11-biomolecules": [
    {
      level: 1,
      stem: {
        en: "A peptide is made of 8 amino acids in one chain. How many peptide bonds does it contain?",
        hi: "किसी पेप्टाइड में एक ही शृंखला में 8 एमीनो अम्ल हैं। उसमें कितने पेप्टाइड बंध हैं?",
        mr: "एका पेप्टाइडमध्ये एकाच साखळीत 8 अमिनो आम्ले आहेत. त्यात किती पेप्टाइड बंध आहेत?",
      },
      answer: 7,
      wrong: [8, 9, 16],
      checkExpr: "8-1",
      solution: {
        en: "8 − 1 = 7. Count the gaps rather than the units: eight beads on a string have seven threads between them. The same n − 1 answers a starch chain and a nucleic acid, because it is a fact about chains rather than about proteins. (8 counts the units instead of the joins.)",
        hi: "8 − 1 = 7. इकाइयाँ नहीं, अंतराल गिनो: डोरी पर आठ मनकों के बीच सात धागे हैं। वही n − 1 मंड की शृंखला और न्यूक्लिक अम्ल का भी उत्तर है, क्योंकि यह प्रोटीनों का नहीं, शृंखलाओं का तथ्य है। (8 जोड़ों के बजाय इकाइयाँ गिन लेता है।)",
        mr: "8 − 1 = 7. एकके नव्हे, फटी मोजा: दोरीवरच्या आठ मण्यांमध्ये सात धागे. तेच n − 1 पिष्टाच्या साखळीचे आणि न्यूक्लिक आम्लाचेही उत्तर, कारण हे प्रथिनांचे नव्हे, साखळ्यांचे तथ्य आहे. (8 सांध्यांऐवजी एकके मोजते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "How many molecules of water are released when 8 amino acids join into one chain?",
        hi: "जब 8 एमीनो अम्ल एक शृंखला में जुड़ते हैं तो पानी के कितने अणु निकलते हैं?",
        mr: "जेव्हा 8 अमिनो आम्ले एका साखळीत जुळतात तेव्हा पाण्याचे किती रेणू निघतात?",
      },
      answer: 7,
      wrong: [8, 1, 14],
      checkExpr: "8-1",
      solution: {
        en: "One water per bond, and there are 7 bonds, so 7 waters. This is why the mass of a protein is always less than the masses of its amino acids added together — the difference is exactly the water that left. (8 counts one per amino acid.)",
        hi: "प्रति बंध एक पानी, और बंध 7 हैं, अतः 7 पानी। इसीलिए प्रोटीन का द्रव्यमान उसके एमीनो अम्लों के जोड़ से सदा कम होता है — अंतर ठीक वही पानी है जो निकल गया। (8 प्रति एमीनो अम्ल एक गिन लेता है।)",
        mr: "प्रति बंध एक पाणी, आणि बंध 7 आहेत, म्हणून 7 पाणी. म्हणूनच प्रथिनाचे वस्तुमान त्याच्या अमिनो आम्लांच्या बेरजेहून नेहमी कमी — फरक नेमके तेच पाणी जे निघून गेले. (8 प्रति अमिनो आम्ल एक मोजते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A protein of 100 amino acids is fully hydrolysed. How many molecules of water are consumed?",
        hi: "100 एमीनो अम्लों के प्रोटीन का पूर्ण जल-अपघटन किया जाता है। पानी के कितने अणु ख़र्च होते हैं?",
        mr: "100 अमिनो आम्लांच्या प्रथिनाचे पूर्ण जलअपघटन केले जाते. पाण्याचे किती रेणू खर्च होतात?",
      },
      answer: 99,
      wrong: [100, 101, 50],
      checkExpr: "100-1",
      solution: {
        en: "Hydrolysis is condensation run backwards, one water in per bond broken, and there are 100 − 1 = 99 bonds. Digestion is exactly this sum performed by enzymes, which is why a protein meal consumes water as it is broken down. (100 counts the residues.)",
        hi: "जल-अपघटन संघनन का उलटा है, प्रति टूटा बंध एक पानी भीतर, और बंध 100 − 1 = 99 हैं। पाचन ठीक यही जोड़ है जो एंज़ाइम करते हैं, इसीलिए प्रोटीन-भोजन टूटते समय पानी ख़र्च करता है। (100 अवशेष गिन लेता है।)",
        mr: "जलअपघटन म्हणजे संघनन उलटे, प्रति तुटलेला बंध एक पाणी आत, आणि बंध 100 − 1 = 99 आहेत. पचन नेमकी हीच बेरीज जी एंझाइमे करतात, म्हणूनच प्रथिन-जेवण तुटताना पाणी खर्च करते. (100 अवशेष मोजते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A chain of 5 glucose units is built by condensation. How many glycosidic bonds are formed?",
        hi: "5 ग्लूकोज़ इकाइयों की शृंखला संघनन से बनती है। कितने ग्लाइकोसाइडी बंध बनते हैं?",
        mr: "5 ग्लुकोज एककांची साखळी संघननाने बनते. किती ग्लायकोसिडी बंध तयार होतात?",
      },
      answer: 4,
      wrong: [5, 6, 10],
      checkExpr: "5-1",
      solution: {
        en: "5 − 1 = 4. The bond has a different name in a sugar than in a protein — glycosidic rather than peptide — but the counting does not change, which is the point of learning it once. (5 counts the sugars.)",
        hi: "5 − 1 = 4. शर्करा में बंध का नाम प्रोटीन से भिन्न है — पेप्टाइड नहीं, ग्लाइकोसाइडी — पर गिनती नहीं बदलती, और उसे एक बार सीख लेने का यही प्रयोजन है। (5 शर्कराएँ गिन लेता है।)",
        mr: "5 − 1 = 4. साखरेत बंधाचे नाव प्रथिनाहून वेगळे — पेप्टाइड नव्हे, ग्लायकोसिडी — पण मोजणी बदलत नाही, आणि ते एकदा शिकण्याचा हाच हेतू. (5 साखरा मोजते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "Two amino acids of molar mass 75 and 89 join into a dipeptide. Taking water as 18, what is the dipeptide's molar mass?",
        hi: "75 और 89 मोलर द्रव्यमान के दो एमीनो अम्ल जुड़कर द्विपेप्टाइड बनाते हैं। पानी 18 लेते हुए, द्विपेप्टाइड का मोलर द्रव्यमान कितना है?",
        mr: "75 आणि 89 मोलर वस्तुमानाची दोन अमिनो आम्ले जुळून द्विपेप्टाइड बनवतात. पाणी 18 घेतल्यास, द्विपेप्टाइडचे मोलर वस्तुमान किती?",
      },
      answer: 146,
      wrong: [164, 182, 128],
      checkExpr: "75+89-18",
      solution: {
        en: "75 + 89 − 18 = 146. One bond means one water leaves, so the product weighs 18 less than its parts. This is the arithmetic behind the general rule: a polymer of n units weighs the sum of the units minus 18(n − 1). (164 adds the two and forgets the water.)",
        hi: "75 + 89 − 18 = 146. एक बंध यानी एक पानी निकला, अतः उत्पाद अपने भागों से 18 कम तौलता है। सामान्य नियम के पीछे यही गणित है: n इकाइयों का बहुलक इकाइयों के जोड़ में से 18(n − 1) घटाकर तौलता है। (164 दोनों जोड़ देता है और पानी भूल जाता है।)",
        mr: "75 + 89 − 18 = 146. एक बंध म्हणजे एक पाणी निघाले, म्हणून उत्पाद आपल्या भागांहून 18 कमी तोलते. सामान्य नियमामागे हेच गणित: n एककांचे बहुवारिक एककांच्या बेरजेतून 18(n − 1) वजा करून तोलते. (164 दोन्ही जोडते आणि पाणी विसरते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A DNA strand has 30 nucleotides. How many phosphodiester bonds join them?",
        hi: "किसी DNA लड़ी में 30 न्यूक्लियोटाइड हैं। उन्हें कितने फ़ॉस्फ़ोडाइएस्टर बंध जोड़ते हैं?",
        mr: "एका DNA तंतूत 30 न्यूक्लिओटाइड आहेत. त्यांना किती फॉस्फोडायएस्टर बंध जोडतात?",
      },
      answer: 29,
      wrong: [30, 60, 15],
      checkExpr: "30-1",
      solution: {
        en: "30 − 1 = 29 — the third polymer, the same sum. Note this is one STRAND: the double helix has two strands running in opposite directions, so a 30-base-pair molecule contains 58 such bonds in total. (30 counts the nucleotides.)",
        hi: "30 − 1 = 29 — तीसरा बहुलक, वही जोड़। ध्यान दो यह एक लड़ी है: द्विकुंडली में दो लड़ियाँ विपरीत दिशाओं में चलती हैं, अतः 30 क्षारक-युग्म के अणु में कुल 58 ऐसे बंध हैं। (30 न्यूक्लियोटाइड गिन लेता है।)",
        mr: "30 − 1 = 29 — तिसरे बहुवारिक, तीच बेरीज. लक्षात घ्या हा एक तंतू आहे: द्विकुंडलीत दोन तंतू विरुद्ध दिशांनी चालतात, म्हणून 30 आम्लारी-जोड्यांच्या रेणूत एकूण 58 असे बंध. (30 न्यूक्लिओटाइड मोजते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "In a DNA double helix, 30 per cent of the bases are adenine. What percentage are guanine?",
        hi: "किसी DNA द्विकुंडली में 30 प्रतिशत क्षारक एडेनीन हैं। ग्वानीन कितने प्रतिशत हैं?",
        mr: "एका DNA द्विकुंडलीत 30 टक्के आम्लारी अॅडेनिन आहेत. ग्वानिन किती टक्के?",
      },
      answer: 20,
      wrong: [30, 40, 70],
      checkExpr: "(100-2*30)/2",
      solution: {
        en: "A pairs with T, so thymine is also 30 and the two together are 60. That leaves 40 for G and C, split equally because G pairs with C: (100 − 60)/2 = 20. Chargaff measured these equalities before anyone knew why, and the pairing rule explained them afterwards. (30 assumes all four bases are equal.)",
        hi: "A का युग्म T से है, अतः थायमीन भी 30 है और दोनों मिलकर 60. बचते हैं G और C के लिए 40, जो बराबर बँटते हैं क्योंकि G का युग्म C से है: (100 − 60)/2 = 20. चारगाफ़ ने ये समानताएँ तब नापीं जब कारण कोई नहीं जानता था, और युग्मन-नियम ने उन्हें बाद में समझाया। (30 मान लेता है कि चारों क्षारक बराबर हैं।)",
        mr: "A ची जोडी T शी, म्हणून थायमिनही 30 आणि दोन्ही मिळून 60. उरतात G आणि C साठी 40, जे समान वाटले जातात कारण G ची जोडी C शी: (100 − 60)/2 = 20. चारगाफने ही समानता तेव्हा मोजली जेव्हा कारण कोणालाच माहीत नव्हते, आणि जोडी-नियमाने ती नंतर समजावली. (30 गृहीत धरते की चारही आम्लारी समान.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A protein has two chains, one of 60 amino acids and one of 40. How many peptide bonds does the whole molecule contain?",
        hi: "किसी प्रोटीन में दो शृंखलाएँ हैं, एक 60 एमीनो अम्लों की और एक 40 की। पूरे अणु में कितने पेप्टाइड बंध हैं?",
        mr: "एका प्रथिनात दोन साखळ्या, एक 60 अमिनो आम्लांची आणि एक 40 ची. अख्ख्या रेणूत किती पेप्टाइड बंध आहेत?",
      },
      answer: 98,
      wrong: [99, 100, 97],
      checkExpr: "60-1+40-1",
      solution: {
        en: "Each chain is counted separately: (60 − 1) + (40 − 1) = 59 + 39 = 98. The trap is treating 100 amino acids as one chain and answering 99 — but the two chains are not joined end to end by peptide bonds; they are held together at the quaternary level by hydrogen bonds and disulphide bridges, which are not peptide bonds at all. This is insulin's arrangement in miniature, and it is why the number of bonds cannot be read off the total residue count without knowing how many chains there are. Note also what the disulphide bridge is: a covalent link between two cysteine side chains, so it is strong like a peptide bond but joins side chains rather than backbones — which is why boiling, which spares covalent bonds, leaves both the peptide bonds and the bridges intact while destroying everything held by weaker forces. (99 treats the two chains as one.)",
        hi: "हर शृंखला अलग गिनी जाती है: (60 − 1) + (40 − 1) = 59 + 39 = 98. जाल है 100 एमीनो अम्लों को एक शृंखला मानकर 99 उत्तर देना — पर दोनों शृंखलाएँ सिरे-से-सिरे पेप्टाइड बंधों से जुड़ी नहीं हैं; वे चतुष्क स्तर पर हाइड्रोजन बंधों और डाइसल्फ़ाइड सेतुओं से थमी हैं, जो पेप्टाइड बंध हैं ही नहीं। यह लघु रूप में इंसुलिन की व्यवस्था है, और इसीलिए बंधों की संख्या कुल अवशेष-गिनती से नहीं पढ़ी जा सकती जब तक यह न पता हो कि शृंखलाएँ कितनी हैं। यह भी ध्यान दो कि डाइसल्फ़ाइड सेतु है क्या: दो सिस्टीन पार्श्व शृंखलाओं के बीच सहसंयोजी कड़ी, अतः वह पेप्टाइड बंध जितना प्रबल है पर ढाँचों को नहीं, पार्श्व शृंखलाओं को जोड़ता है — इसीलिए उबालना, जो सहसंयोजी बंधों को बख़्श देता है, पेप्टाइड बंध और सेतु दोनों साबुत छोड़ देता है और दुर्बल बलों से थमा सब कुछ नष्ट कर देता है। (99 दोनों शृंखलाओं को एक मान लेता है।)",
        mr: "प्रत्येक साखळी वेगळी मोजली जाते: (60 − 1) + (40 − 1) = 59 + 39 = 98. सापळा म्हणजे 100 अमिनो आम्लांना एक साखळी मानून 99 उत्तर देणे — पण दोन्ही साखळ्या टोकाला टोक पेप्टाइड बंधांनी जोडलेल्या नाहीत; त्या चतुर्थ पातळीवर हायड्रोजन बंध आणि डायसल्फाइड पुलांनी धरलेल्या, जे पेप्टाइड बंध नाहीतच. ही लघुरूपात इन्शुलिनची मांडणी, आणि म्हणूनच बंधांची संख्या एकूण अवशेष-मोजणीवरून वाचता येत नाही जोवर साखळ्या किती आहेत हे माहीत नसेल. हेही लक्षात घ्या की डायसल्फाइड पूल म्हणजे काय: दोन सिस्टीन बाजू-साखळ्यांमधला सहसंयुज दुवा, म्हणून तो पेप्टाइड बंधाइतका प्रबळ पण सांगाड्यांना नव्हे, बाजू-साखळ्यांना जोडतो — म्हणूनच उकळणे, जे सहसंयुज बंधांना सोडते, पेप्टाइड बंध आणि पूल दोन्ही शाबूत ठेवते आणि दुर्बळ बलांनी धरलेले सर्व काही नष्ट करते. (99 दोन्ही साखळ्यांना एक मानते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "Ten amino acids of average molar mass 110 join into one chain. Taking water as 18, what is the peptide's molar mass?",
        hi: "औसतन 110 मोलर द्रव्यमान के दस एमीनो अम्ल एक शृंखला में जुड़ते हैं। पानी 18 लेते हुए, पेप्टाइड का मोलर द्रव्यमान कितना है?",
        mr: "सरासरी 110 मोलर वस्तुमानाची दहा अमिनो आम्ले एका साखळीत जुळतात. पाणी 18 घेतल्यास, पेप्टाइडचे मोलर वस्तुमान किती?",
      },
      answer: 938,
      wrong: [1100, 920, 1082],
      checkExpr: "10*110-9*18",
      solution: {
        en: "10 × 110 = 1,100 for the amino acids, minus 9 × 18 = 162 for the nine waters that left, giving 938. Three things in this sum are worth more than the answer. The first is the shape of the general formula: mass = n × (average residue) − 18(n − 1). Notice that the correction is not negligible — 162 out of 1,100 is about 15 per cent — so anyone who adds the amino acid masses and stops has overestimated a small peptide by roughly a seventh. The second is what happens as n grows. For a real protein of 300 residues the sum is 300 × 110 − 299 × 18 = 33,000 − 5,382 ≈ 27,600, and the water removed is still about 16 per cent. The fraction converges on 18/110, or a little over 16 per cent, and stays there — because as n gets large, n − 1 approaches n and each residue in the chain has effectively lost one water. That is why biochemists speak of a RESIDUE mass of about 110 rather than an amino acid mass of 110: the residue is what is left after the water has gone, and using it makes the correction unnecessary. The third is the check that catches an error. The product of a condensation must always weigh LESS than its reactants — mass left the system as water — so any calculation that makes a polymer heavier than the sum of its units has an arithmetic sign wrong somewhere. The same test works on starch, where 18 comes off per glycosidic bond, and on nucleic acids. It is worth carrying the habit beyond this chapter: whenever a reaction removes a small molecule, the mass balance is a free check on the answer, and it costs one subtraction. (1,100 forgets the water entirely; 920 removes ten waters instead of nine; and 1,082 removes only one.)",
        hi: "एमीनो अम्लों के लिए 10 × 110 = 1,100, में से निकले नौ पानी के लिए 9 × 18 = 162 घटाओ, मिलता है 938. इस जोड़ की तीन बातें उत्तर से अधिक क़ीमती हैं। पहली है सामान्य सूत्र का आकार: द्रव्यमान = n × (औसत अवशेष) − 18(n − 1). ध्यान दो कि सुधार नगण्य नहीं — 1,100 में से 162 यानी लगभग 15 प्रतिशत — अतः जो एमीनो अम्लों के द्रव्यमान जोड़कर रुक जाए उसने छोटे पेप्टाइड को क़रीब एक-सातवाँ अधिक आँका है। दूसरी है कि n बढ़ने पर क्या होता है। 300 अवशेषों के असली प्रोटीन के लिए जोड़ है 300 × 110 − 299 × 18 = 33,000 − 5,382 ≈ 27,600, और हटा पानी अब भी लगभग 16 प्रतिशत है। वह अंश 18/110 पर, यानी 16 प्रतिशत से कुछ ऊपर, अभिसरित होकर वहीं रहता है — क्योंकि n बड़ा होते-होते n − 1 लगभग n हो जाता है और शृंखला के हर अवशेष ने प्रभावतः एक पानी खो दिया है। इसीलिए जैवरसायनज्ञ 110 के एमीनो अम्ल द्रव्यमान की नहीं, लगभग 110 के अवशेष द्रव्यमान की बात करते हैं: अवशेष वही है जो पानी जाने के बाद बचा, और उसे बरतने से सुधार की ज़रूरत ही नहीं रहती। तीसरी है वह जाँच जो त्रुटि पकड़ लेती है। संघनन का उत्पाद अपने अभिकारकों से सदा कम तौलेगा — द्रव्यमान पानी बनकर तंत्र से निकला — अतः जो भी गणना बहुलक को उसकी इकाइयों के जोड़ से भारी बना दे उसमें कहीं चिह्न ग़लत है। वही परीक्षण मंड पर चलता है, जहाँ प्रति ग्लाइकोसाइडी बंध 18 निकलता है, और न्यूक्लिक अम्लों पर भी। आदत इस अध्याय से आगे भी ले जाने योग्य है: जब भी कोई अभिक्रिया छोटा अणु हटाए, द्रव्यमान-संतुलन उत्तर की मुफ़्त जाँच है, और उसकी क़ीमत एक घटाव है। (1,100 पानी पूरी तरह भूल जाता है; 920 नौ के बजाय दस पानी हटाता है; और 1,082 केवल एक।)",
        mr: "अमिनो आम्लांसाठी 10 × 110 = 1,100, त्यातून निघालेल्या नऊ पाण्यांसाठी 9 × 18 = 162 वजा करा, मिळते 938. या बेरजेतल्या तीन गोष्टी उत्तराहून अधिक मोलाच्या. पहिली म्हणजे सामान्य सूत्राचा आकार: वस्तुमान = n × (सरासरी अवशेष) − 18(n − 1). लक्षात घ्या की दुरुस्ती नगण्य नाही — 1,100 पैकी 162 म्हणजे सुमारे 15 टक्के — म्हणून जो अमिनो आम्लांची वस्तुमाने जोडून थांबतो त्याने लहान पेप्टाइड जवळपास एक सप्तमांश अधिक अंदाजले आहे. दुसरी म्हणजे n वाढताच काय होते. 300 अवशेषांच्या खऱ्या प्रथिनासाठी बेरीज आहे 300 × 110 − 299 × 18 = 33,000 − 5,382 ≈ 27,600, आणि काढलेले पाणी अजूनही सुमारे 16 टक्के. तो अंश 18/110 वर, म्हणजे 16 टक्क्यांहून थोडा वर, अभिसरून तिथेच राहतो — कारण n मोठा होताच n − 1 जवळपास n होतो आणि साखळीतल्या प्रत्येक अवशेषाने प्रभावीपणे एक पाणी गमावले आहे. म्हणूनच जीवरसायनशास्त्रज्ञ 110 च्या अमिनो आम्ल वस्तुमानाची नव्हे, सुमारे 110 च्या अवशेष वस्तुमानाची भाषा करतात: अवशेष म्हणजे पाणी गेल्यावर उरलेले, आणि ते वापरल्याने दुरुस्तीची गरजच उरत नाही. तिसरी म्हणजे ती तपासणी जी चूक पकडते. संघननाचे उत्पाद आपल्या अभिक्रियाकारकांहून नेहमी कमी तोलेल — वस्तुमान पाणी बनून संस्थेतून निघाले — म्हणून जी कोणतीही गणना बहुवारिकाला त्याच्या एककांच्या बेरजेहून जड करते तिच्यात कुठेतरी चिन्ह चुकीचे. तीच चाचणी पिष्टावर चालते, जिथे प्रति ग्लायकोसिडी बंध 18 निघते, आणि न्यूक्लिक आम्लांवरही. सवय या प्रकरणापलीकडेही नेण्याजोगी: जेव्हा जेव्हा एखादी अभिक्रिया लहान रेणू काढते, वस्तुमान-संतुलन ही उत्तराची फुकट तपासणी, आणि तिची किंमत एक वजाबाकी. (1,100 पाणी पूर्णपणे विसरते; 920 नऊऐवजी दहा पाणी काढते; आणि 1,082 केवळ एक.)",
      },
    },
  ],
  /**
   * Chromosome bookkeeping — the third and last place the counting is real.
   * Two quantities move at different times (number halves once, DNA halves
   * twice) and confusing them is the commonest error in the chapter, so the
   * ladder makes a pupil track both.
   */
  "biology-11-cell-cycle-and-cell-division": [
    {
      level: 1,
      stem: {
        en: "A cell with 24 chromosomes divides by mitosis. How many chromosomes does each daughter cell have?",
        hi: "24 गुणसूत्रों वाली कोशिका समसूत्री विभाजन करती है। हर संतति कोशिका में कितने गुणसूत्र हैं?",
        mr: "24 गुणसूत्रे असलेली पेशी समविभाजन करते. प्रत्येक कन्यापेशीत किती गुणसूत्रे आहेत?",
      },
      answer: 24,
      wrong: [12, 48, 6],
      checkExpr: "24*1",
      solution: {
        en: "Mitosis keeps the number, so 24. The DNA was doubled in S phase and then split again when the sister chromatids separated, so the count returns exactly to where it started — which is the whole point of a division used for growth and repair. (12 applies meiosis to a mitosis.)",
        hi: "समसूत्री विभाजन संख्या बनाए रखता है, अतः 24. DNA S प्रावस्था में दोगुना हुआ था और सहोदर अर्धगुणसूत्रों के अलग होने पर फिर बँट गया, अतः गिनती ठीक वहीं लौट आती है जहाँ से शुरू हुई थी — और वृद्धि तथा मरम्मत के लिए बरते जाने वाले विभाजन का यही पूरा प्रयोजन है। (12 समसूत्री पर अर्धसूत्री लगा देता है।)",
        mr: "समविभाजन संख्या टिकवते, म्हणून 24. DNA S प्रावस्थेत दुप्पट झाले होते आणि सहोदर अर्धगुणसूत्रे वेगळी होताच पुन्हा विभागले, म्हणून मोजणी नेमकी जिथून सुरू झाली तिथेच परतते — आणि वाढ व दुरुस्तीसाठी वापरल्या जाणाऱ्या विभाजनाचा हाच अख्खा हेतू. (12 समविभाजनावर अर्धसूत्री लावते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A cell with 24 chromosomes undergoes meiosis. How many chromosomes does each gamete have?",
        hi: "24 गुणसूत्रों वाली कोशिका अर्धसूत्री विभाजन करती है। हर युग्मक में कितने गुणसूत्र हैं?",
        mr: "24 गुणसूत्रे असलेली पेशी अर्धसूत्री विभाजन करते. प्रत्येक युग्मकात किती गुणसूत्रे आहेत?",
      },
      answer: 12,
      wrong: [24, 48, 6],
      checkExpr: "24/2",
      solution: {
        en: "24/2 = 12. The halving happens once, entirely in the first division, when the homologous pairs are separated. Fertilisation will put two twelves back together and the species returns to 24 — which is why meiosis and fertilisation only make sense as a pair. (24 keeps the parent's number.)",
        hi: "24/2 = 12. आधा होना एक बार होता है, पूरी तरह पहले विभाजन में, जब समजात युग्म अलग किए जाते हैं। निषेचन दो बारह फिर जोड़ देगा और जाति 24 पर लौट आएगी — इसीलिए अर्धसूत्री विभाजन और निषेचन केवल जोड़ी के रूप में अर्थ रखते हैं। (24 जनक की संख्या बनाए रखता है।)",
        mr: "24/2 = 12. निम्मे होणे एकदाच घडते, संपूर्णपणे पहिल्या विभाजनात, जेव्हा समजात जोड्या वेगळ्या केल्या जातात. फलन दोन बारा पुन्हा जोडेल आणि जात 24 वर परतेल — म्हणूनच अर्धसूत्री विभाजन आणि फलन केवळ जोडी म्हणूनच अर्थ ठेवतात. (24 जनकाची संख्या टिकवते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "One cell divides by mitosis, and each daughter divides again, and so on for 4 rounds. How many cells are there at the end?",
        hi: "एक कोशिका समसूत्री विभाजन करती है, और हर संतति फिर विभाजित होती है, और ऐसे 4 चक्र चलते हैं। अंत में कितनी कोशिकाएँ हैं?",
        mr: "एक पेशी समविभाजन करते, आणि प्रत्येक कन्या पुन्हा विभागते, आणि असे 4 फेरे चालतात. शेवटी किती पेशी आहेत?",
      },
      answer: 16,
      wrong: [8, 4, 32],
      checkExpr: "2^4",
      solution: {
        en: "2⁴ = 16. Each round doubles the count, so growth by mitosis is exponential — which is how a single fertilised egg reaches a few trillion cells, and also why an unchecked division is dangerous so quickly. (8 gives three rounds.)",
        hi: "2⁴ = 16. हर चक्र गिनती दोगुनी करता है, अतः समसूत्री विभाजन से वृद्धि चरघातांकी है — इसी से एक निषेचित अंडा कुछ खरब कोशिकाओं तक पहुँचता है, और इसीलिए बिना रोक-टोक विभाजन इतनी जल्दी ख़तरनाक है। (8 तीन चक्र देता है।)",
        mr: "2⁴ = 16. प्रत्येक फेरा मोजणी दुप्पट करतो, म्हणून समविभाजनाने वाढ घातांकी — याच्यानेच एक फलित अंडे काही ट्रिलियन पेशींपर्यंत पोहोचते, आणि म्हणूनच बेबंद विभाजन इतक्या लवकर धोकादायक. (8 तीन फेरे देते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "How many cells does ONE cell produce by completing meiosis?",
        hi: "एक कोशिका अर्धसूत्री विभाजन पूरा करके कितनी कोशिकाएँ बनाती है?",
        mr: "एक पेशी अर्धसूत्री विभाजन पूर्ण करून किती पेशी बनवते?",
      },
      answer: 4,
      wrong: [2, 8, 1],
      checkExpr: "2*2",
      solution: {
        en: "Two divisions, each doubling the cell count: 2 × 2 = 4. In a male all four become sperm; in a female only one becomes the egg and three are discarded as polar bodies, because the cytoplasm is worth more concentrated in one. (2 counts only the first division.)",
        hi: "दो विभाजन, हर एक कोशिका-गिनती दोगुनी करता: 2 × 2 = 4. नर में चारों शुक्राणु बनते हैं; मादा में केवल एक अंड बनता है और तीन ध्रुवीय काय के रूप में छोड़ दिए जाते हैं, क्योंकि कोशिकाद्रव्य एक में केंद्रित होकर अधिक क़ीमती है। (2 केवल पहला विभाजन गिनता है।)",
        mr: "दोन विभाजने, प्रत्येक पेशी-मोजणी दुप्पट करत: 2 × 2 = 4. नरात चारही शुक्राणू बनतात; मादीत केवळ एक अंडे बनते आणि तीन ध्रुवीय काय म्हणून टाकली जातात, कारण पेशीद्रव्य एकात केंद्रित होऊन अधिक मोलाचे. (2 केवळ पहिले विभाजन मोजते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A human cell has 46 chromosomes. How many chromatids does it contain at the end of S phase?",
        hi: "किसी मानव कोशिका में 46 गुणसूत्र हैं। S प्रावस्था के अंत में उसमें कितने अर्धगुणसूत्र हैं?",
        mr: "एका मानवी पेशीत 46 गुणसूत्रे आहेत. S प्रावस्थेच्या शेवटी तिच्यात किती अर्धगुणसूत्रे आहेत?",
      },
      answer: 92,
      wrong: [46, 23, 184],
      checkExpr: "46*2",
      solution: {
        en: "Each chromosome becomes two sister chromatids, so 46 × 2 = 92 chromatids — while the chromosome NUMBER is still 46, because the two chromatids stay joined at one centromere and count as one chromosome until they part. Counting centromeres rather than arms is the reliable way to count chromosomes. (46 counts chromosomes rather than chromatids.)",
        hi: "हर गुणसूत्र दो सहोदर अर्धगुणसूत्र बन जाता है, अतः 46 × 2 = 92 अर्धगुणसूत्र — जबकि गुणसूत्र संख्या अब भी 46 है, क्योंकि दोनों अर्धगुणसूत्र एक ही गुणसूत्रबिंदु पर जुड़े रहते हैं और अलग होने तक एक गुणसूत्र गिने जाते हैं। भुजाओं के बजाय गुणसूत्रबिंदु गिनना गुणसूत्र गिनने का भरोसेमंद तरीक़ा है। (46 अर्धगुणसूत्रों के बजाय गुणसूत्र गिन लेता है।)",
        mr: "प्रत्येक गुणसूत्र दोन सहोदर अर्धगुणसूत्रे बनते, म्हणून 46 × 2 = 92 अर्धगुणसूत्रे — तर गुणसूत्रांची संख्या अजूनही 46, कारण दोन्ही अर्धगुणसूत्रे एकाच गुणसूत्रबिंदूवर जोडलेली राहतात आणि वेगळी होईपर्यंत एक गुणसूत्र मोजली जातात. भुजांऐवजी गुणसूत्रबिंदू मोजणे हा गुणसूत्रे मोजण्याचा विश्वासार्ह मार्ग. (46 अर्धगुणसूत्रांऐवजी गुणसूत्रे मोजते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A cell has 20 chromosomes. How many chromosomes are in each cell at the end of the FIRST meiotic division?",
        hi: "किसी कोशिका में 20 गुणसूत्र हैं। पहले अर्धसूत्री विभाजन के अंत में हर कोशिका में कितने गुणसूत्र हैं?",
        mr: "एका पेशीत 20 गुणसूत्रे आहेत. पहिल्या अर्धसूत्री विभाजनाच्या शेवटी प्रत्येक पेशीत किती गुणसूत्रे आहेत?",
      },
      answer: 10,
      wrong: [20, 5, 40],
      checkExpr: "20/2",
      solution: {
        en: "20/2 = 10. All the halving happens here — this is the reductional division, where homologous pairs are separated. Each of those 10 is still a doubled chromosome of two chromatids; the second division will split them without changing the count. (20 assumes the number falls only at the end.)",
        hi: "20/2 = 10. सारा आधा होना यहीं होता है — यही न्यूनकारी विभाजन है, जहाँ समजात युग्म अलग किए जाते हैं। उन 10 में से हर एक अब भी दो अर्धगुणसूत्रों वाला दोहरा गुणसूत्र है; दूसरा विभाजन उन्हें गिनती बदले बिना बाँट देगा। (20 मान लेता है कि संख्या केवल अंत में गिरती है।)",
        mr: "20/2 = 10. सर्व निम्मे होणे इथेच घडते — हेच न्यूनकारी विभाजन, जिथे समजात जोड्या वेगळ्या केल्या जातात. त्या 10 पैकी प्रत्येक अजूनही दोन अर्धगुणसूत्रांचे दुहेरी गुणसूत्र; दुसरे विभाजन त्यांना मोजणी न बदलता विभागेल. (20 गृहीत धरते की संख्या केवळ शेवटी घटते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A species has 8 pairs of chromosomes. How many different chromosome combinations can independent assortment alone produce in a gamete?",
        hi: "किसी जाति में गुणसूत्रों के 8 युग्म हैं। अकेला स्वतंत्र अपव्यूहन युग्मक में कितने भिन्न गुणसूत्र-संयोजन बना सकता है?",
        mr: "एका जातीत गुणसूत्रांच्या 8 जोड्या आहेत. एकटे स्वतंत्र अपव्यूहन युग्मकात किती वेगळी गुणसूत्र-संयोजने बनवू शकते?",
      },
      answer: 256,
      wrong: [16, 64, 8],
      checkExpr: "2^8",
      solution: {
        en: "Each pair independently sends either member to either pole, so 2⁸ = 256. Note it is 2 to the power of the number of PAIRS, not of chromosomes — with 16 chromosomes in 8 pairs the exponent is 8. For a human's 23 pairs this gives 2²³, about 8.4 million, and crossing over multiplies it further. (16 counts the chromosomes instead.)",
        hi: "हर युग्म स्वतंत्र रूप से कोई भी सदस्य किसी भी ध्रुव पर भेजता है, अतः 2⁸ = 256. ध्यान दो कि यह युग्मों की संख्या की घात 2 है, गुणसूत्रों की नहीं — 8 युग्मों में 16 गुणसूत्र होने पर घातांक 8 है। मनुष्य के 23 युग्मों के लिए यह 2²³ देता है, लगभग 84 लाख, और जीन-विनिमय उसे और गुणा कर देता है। (16 इसके बजाय गुणसूत्र गिन लेता है।)",
        mr: "प्रत्येक जोडी स्वतंत्रपणे कोणताही सदस्य कोणत्याही ध्रुवाकडे पाठवते, म्हणून 2⁸ = 256. लक्षात घ्या की हे जोड्यांच्या संख्येची घात 2 आहे, गुणसूत्रांची नव्हे — 8 जोड्यांत 16 गुणसूत्रे असताना घातांक 8. माणसाच्या 23 जोड्यांसाठी हे 2²³ देते, सुमारे 84 लाख, आणि जनुक-विनिमय ते आणखी गुणते. (16 त्याऐवजी गुणसूत्रे मोजते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "An onion root-tip cell has 16 chromosomes. Counting every cell produced, how many chromosomes are there in total after one mitosis?",
        hi: "प्याज़ की मूल-नोक की कोशिका में 16 गुणसूत्र हैं। बनी हर कोशिका गिनते हुए, एक समसूत्री विभाजन के बाद कुल कितने गुणसूत्र हैं?",
        mr: "कांद्याच्या मूळटोकाच्या पेशीत 16 गुणसूत्रे आहेत. बनलेली प्रत्येक पेशी मोजून, एका समविभाजनानंतर एकूण किती गुणसूत्रे आहेत?",
      },
      answer: 32,
      wrong: [16, 64, 8],
      checkExpr: "2*16",
      solution: {
        en: "Two daughter cells of 16 each, so 32 chromosomes in total. Nothing was created from nothing: S phase copied the DNA first, so the 16 became 16 doubled chromosomes — 32 chromatids — and the division simply gave each daughter one chromatid of each pair. This is the distinction that makes the chapter's arithmetic work. PER CELL, mitosis is conservative: 16 in, 16 out, and every daughter is genetically identical to the parent. IN TOTAL, the material has doubled, and it doubled during interphase rather than during the division everyone watches. A pupil who tracks only the per-cell number thinks nothing happened; one who tracks only the total thinks mitosis creates chromosomes. Both quantities have to be carried at once, which is why examiners ask this in the total form. (16 gives the per-cell number and 64 doubles a doubling that already happened.)",
        hi: "16-16 की दो संतति कोशिकाएँ, अतः कुल 32 गुणसूत्र। शून्य से कुछ नहीं बना: S प्रावस्था ने पहले DNA की नक़ल की, अतः 16 दोहरे गुणसूत्र बन गए — 32 अर्धगुणसूत्र — और विभाजन ने बस हर संतति को हर युग्म का एक अर्धगुणसूत्र दे दिया। यही वह भेद है जो अध्याय का गणित चलाता है। प्रति कोशिका, समसूत्री विभाजन संरक्षी है: 16 भीतर, 16 बाहर, और हर संतति जनक की आनुवंशिक प्रतिलिपि। कुल में, पदार्थ दोगुना हुआ है, और वह अंतरावस्था में दोगुना हुआ, उस विभाजन में नहीं जिसे सब देखते हैं। जो विद्यार्थी केवल प्रति-कोशिका संख्या का पीछा करे वह सोचता है कुछ हुआ ही नहीं; जो केवल कुल का पीछा करे वह सोचता है समसूत्री विभाजन गुणसूत्र बनाता है। दोनों राशियाँ एक साथ ढोनी पड़ती हैं, इसीलिए परीक्षक इसे कुल के रूप में पूछते हैं। (16 प्रति-कोशिका संख्या देता है और 64 पहले ही हो चुके दुगुने को फिर दोगुना कर देता है।)",
        mr: "16-16 च्या दोन कन्यापेशी, म्हणून एकूण 32 गुणसूत्रे. शून्यातून काहीही बनले नाही: S प्रावस्थेने आधी DNA ची नक्कल केली, म्हणून 16 दुहेरी गुणसूत्रे बनली — 32 अर्धगुणसूत्रे — आणि विभाजनाने फक्त प्रत्येक कन्येला प्रत्येक जोडीतले एक अर्धगुणसूत्र दिले. हाच तो भेद जो प्रकरणाचे गणित चालवतो. प्रति पेशी, समविभाजन संरक्षी: 16 आत, 16 बाहेर, आणि प्रत्येक कन्या जनकाची अनुवंशिक प्रत. एकूणात, द्रव्य दुप्पट झाले आहे, आणि ते आंतरावस्थेत दुप्पट झाले, सर्व जे पाहतात त्या विभाजनात नव्हे. जो विद्यार्थी केवळ प्रति-पेशी संख्येचा माग काढतो त्याला वाटते काहीच घडले नाही; जो केवळ एकूणाचा माग काढतो त्याला वाटते समविभाजन गुणसूत्रे बनवते. दोन्ही राशी एकाच वेळी वाहाव्या लागतात, म्हणूनच परीक्षक हे एकूणाच्या रूपात विचारतात. (16 प्रति-पेशी संख्या देते आणि 64 आधीच झालेले दुप्पट पुन्हा दुप्पट करते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A cell has 12 chromosomes and completes meiosis. Counting every cell produced, how many chromosomes are there in total at the end?",
        hi: "किसी कोशिका में 12 गुणसूत्र हैं और वह अर्धसूत्री विभाजन पूरा करती है। बनी हर कोशिका गिनते हुए, अंत में कुल कितने गुणसूत्र हैं?",
        mr: "एका पेशीत 12 गुणसूत्रे आहेत आणि ती अर्धसूत्री विभाजन पूर्ण करते. बनलेली प्रत्येक पेशी मोजून, शेवटी एकूण किती गुणसूत्रे आहेत?",
      },
      answer: 24,
      wrong: [12, 48, 6],
      checkExpr: "4*6",
      solution: {
        en: "Four cells of 6 chromosomes each: 4 × 6 = 24. Walking the whole cycle with both quantities in hand is what this question is for, so do it properly. Start: 12 chromosomes, DNA content call it 2C. After S phase: still 12 chromosomes, now 24 chromatids, DNA 4C. After meiosis I: two cells, 6 chromosomes each, each chromosome still two chromatids, so 12 chromatids and 2C per cell. After meiosis II: four cells, 6 chromosomes each, one chromatid apiece, 1C per cell. Total chromosomes across the four cells: 24. Now read the two quantities against each other, because this is the confusion the whole chapter is built to prevent. The chromosome NUMBER per cell halved ONCE, at meiosis I, when homologous pairs were pulled apart. The DNA CONTENT per cell halved TWICE — 4C to 2C at the first division, 2C to 1C at the second — because the second division separated chromatids without touching the number. Two different quantities, halving at different moments, which is exactly why the divisions have the names reductional and equational. And notice the total is 24 rather than 12 for the same reason as in the mitosis question: interphase copied everything before any division happened, so 12 chromosomes' worth of material became 24 chromatids' worth, and the two divisions distributed that material into four packets rather than creating any. The check that catches an error here is the same one that works throughout: material is conserved across a division, and only interphase adds any. If a calculation produces more chromosomes at the end than replication could account for, a doubling has been counted twice. (12 forgets that four cells were made; 48 doubles the replication; and 6 gives the per-cell number.)",
        hi: "6-6 गुणसूत्रों की चार कोशिकाएँ: 4 × 6 = 24. दोनों राशियाँ हाथ में लेकर पूरा चक्र चलना ही इस प्रश्न का प्रयोजन है, अतः उसे ठीक से करो। शुरुआत: 12 गुणसूत्र, DNA मात्रा उसे 2C कहो। S प्रावस्था के बाद: अब भी 12 गुणसूत्र, अब 24 अर्धगुणसूत्र, DNA 4C. अर्धसूत्री I के बाद: दो कोशिकाएँ, 6-6 गुणसूत्र, हर गुणसूत्र अब भी दो अर्धगुणसूत्रों का, अतः प्रति कोशिका 12 अर्धगुणसूत्र और 2C. अर्धसूत्री II के बाद: चार कोशिकाएँ, 6-6 गुणसूत्र, प्रत्येक में एक-एक अर्धगुणसूत्र, प्रति कोशिका 1C. चारों कोशिकाओं में कुल गुणसूत्र: 24. अब दोनों राशियाँ एक-दूसरे के सामने पढ़ो, क्योंकि पूरा अध्याय यही भ्रम रोकने को बना है। प्रति कोशिका गुणसूत्र संख्या एक बार आधी हुई, अर्धसूत्री I पर, जब समजात युग्म खींचकर अलग किए गए। प्रति कोशिका DNA मात्रा दो बार आधी हुई — पहले विभाजन पर 4C से 2C, दूसरे पर 2C से 1C — क्योंकि दूसरे विभाजन ने संख्या छुए बिना अर्धगुणसूत्र अलग किए। दो भिन्न राशियाँ, भिन्न क्षणों पर आधी होतीं, ठीक इसीलिए विभाजनों के नाम न्यूनकारी और समकारी हैं। और ध्यान दो कि कुल 12 नहीं 24 है, उसी कारण से जो समसूत्री वाले प्रश्न में था: अंतरावस्था ने किसी भी विभाजन से पहले सब कुछ नक़ल कर लिया, अतः 12 गुणसूत्रों जितना पदार्थ 24 अर्धगुणसूत्रों जितना हो गया, और दोनों विभाजनों ने उस पदार्थ को चार पुड़ियों में बाँटा, बनाया कुछ नहीं। यहाँ त्रुटि पकड़ने वाली जाँच वही है जो हर जगह चलती है: विभाजन के आर-पार पदार्थ संरक्षित है, और जोड़ती केवल अंतरावस्था है। यदि कोई गणना अंत में उससे अधिक गुणसूत्र दे जितने प्रतिकृति से समझाए जा सकें, तो कहीं दुगुना दो बार गिना गया है। (12 भूल जाता है कि चार कोशिकाएँ बनीं; 48 प्रतिकृति दोगुनी कर देता है; और 6 प्रति-कोशिका संख्या देता है।)",
        mr: "6-6 गुणसूत्रांच्या चार पेशी: 4 × 6 = 24. दोन्ही राशी हातात घेऊन अख्खे चक्र चालणे हाच या प्रश्नाचा हेतू, म्हणून ते नीट करा. सुरुवात: 12 गुणसूत्रे, DNA प्रमाण त्याला 2C म्हणा. S प्रावस्थेनंतर: अजूनही 12 गुणसूत्रे, आता 24 अर्धगुणसूत्रे, DNA 4C. अर्धसूत्री I नंतर: दोन पेशी, 6-6 गुणसूत्रे, प्रत्येक गुणसूत्र अजूनही दोन अर्धगुणसूत्रांचे, म्हणून प्रति पेशी 12 अर्धगुणसूत्रे आणि 2C. अर्धसूत्री II नंतर: चार पेशी, 6-6 गुणसूत्रे, प्रत्येकात एकेक अर्धगुणसूत्र, प्रति पेशी 1C. चारही पेशींत एकूण गुणसूत्रे: 24. आता दोन्ही राशी एकमेकांसमोर वाचा, कारण अख्खे प्रकरण हाच गोंधळ टाळायला बांधलेले. प्रति पेशी गुणसूत्रसंख्या एकदा निम्मी झाली, अर्धसूत्री I वर, जेव्हा समजात जोड्या ओढून वेगळ्या केल्या. प्रति पेशी DNA प्रमाण दोनदा निम्मे झाले — पहिल्या विभाजनावर 4C वरून 2C, दुसऱ्यावर 2C वरून 1C — कारण दुसऱ्या विभाजनाने संख्येला स्पर्श न करता अर्धगुणसूत्रे वेगळी केली. दोन वेगळ्या राशी, वेगळ्या क्षणी निम्म्या होत, नेमक्या याच कारणाने विभाजनांची नावे न्यूनकारी आणि समकारी. आणि लक्षात घ्या की एकूण 12 नव्हे 24 आहे, त्याच कारणाने जे समविभाजनाच्या प्रश्नात होते: आंतरावस्थेने कोणत्याही विभाजनाआधी सर्व काही नक्कल केले, म्हणून 12 गुणसूत्रांइतके द्रव्य 24 अर्धगुणसूत्रांइतके झाले, आणि दोन्ही विभाजनांनी ते द्रव्य चार पुड्यांत वाटले, बनवले काहीच नाही. इथे चूक पकडणारी तपासणी तीच जी सर्वत्र चालते: विभाजनापलीकडे द्रव्य संरक्षित, आणि जोडते केवळ आंतरावस्था. एखादी गणना शेवटी प्रतिकृतीने समजावता येईल त्याहून अधिक गुणसूत्रे देत असेल, तर कुठेतरी दुप्पट दोनदा मोजले गेले आहे. (12 विसरते की चार पेशी बनल्या; 48 प्रतिकृती दुप्पट करते; आणि 6 प्रति-पेशी संख्या देते.)",
      },
    },
  ],
  /*NB*/
};
