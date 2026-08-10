/**
 * Class 12 Chemistry — NCERT, chapter by chapter, in the shape Class 11
 * established: a conceptual ladder from the fact engine with individually
 * authored computed problems bolted on by `withNumeric`.
 *
 * What changes at this level is that the questions worth asking are mostly
 * about WHY A NUMBER COMES OUT AS IT DOES rather than what it is. Class 11
 * asked what a mole counts; Class 12 asks why one mole of sodium chloride
 * lowers a freezing point twice as far as one mole of glucose, why a single
 * electrode potential can never be measured on its own, why the order of a
 * reaction cannot be read off its equation, and why zirconium and hafnium are
 * so nearly the same size that a century of chemists could not separate them.
 * Each of those is a fact table's worth of mechanism attached to an arithmetic
 * the verifier can prove, which is why the two halves stay on one card.
 *
 * Entity names avoid what Classes 9–11 already hold — "Molarity against
 * molality", "Redox as electron transfer", "The trend in atomic radius",
 * "Le Chatelier's principle" are all taken, and this file is not those
 * chapters restated.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";
import type { NumQ } from "./numeric";
import { unit } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Chemistry (Class 12)";
const LICENCE = "CC-BY-SA-4.0";

const volts = unit("V");
const kelvin = unit("K");

export const G12_CHEMISTRY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Solutions                                                   */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-12-solutions",
    subject: "CHEMISTRY",
    classLevel: 12,
    chapter: {
      en: "Chapter 1 — Solutions",
      hi: "अध्याय 1 — विलयन",
      mr: "प्रकरण 1 — द्रावण",
    },
    name: {
      en: "Solutions",
      hi: "विलयन",
      mr: "द्रावण",
    },
    summary: {
      en: "Four properties of a solution that depend on HOW MANY dissolved particles there are and not at all on what they are, so a spoonful of sugar and a spoonful of salt do quite different things for a reason that has nothing to do with either being sweet or salty; a law that predicts the vapour pressure of an ideal mixture and whose failures are more informative than its successes, since a solution that boils too easily is telling you its two components dislike each other; and a correction factor that counts the particles a solute actually breaks into, which is two for common salt, three for calcium chloride, and rather less than two for either at concentrations where the ions have not quite let go of one another.",
      hi: "विलयन के चार ऐसे गुण जो इस पर निर्भर हैं कि घुले कण कितने हैं और इस पर बिलकुल नहीं कि वे क्या हैं, अतः एक चम्मच चीनी और एक चम्मच नमक बिलकुल भिन्न काम करते हैं और उसका कारण किसी के मीठे या नमकीन होने से नहीं जुड़ा; वह नियम जो आदर्श मिश्रण का वाष्प दाब बताता है और जिसकी विफलताएँ उसकी सफलताओं से अधिक ज्ञानप्रद हैं, क्योंकि बहुत आसानी से उबलता विलयन तुम्हें बता रहा है कि उसके दो घटक एक-दूसरे को पसंद नहीं करते; और वह संशोधन गुणक जो गिनता है कि विलेय वस्तुतः कितने कणों में टूटा, जो साधारण नमक के लिए दो, कैल्शियम क्लोराइड के लिए तीन, और उन सांद्रताओं पर दोनों के लिए दो से कुछ कम है जहाँ आयनों ने एक-दूसरे को पूरी तरह छोड़ा नहीं है।",
      mr: "द्रावणाचे चार असे गुणधर्म जे यावर अवलंबून आहेत की विरघळलेले कण किती आहेत आणि यावर मुळीच नाही की ते काय आहेत, म्हणून एक चमचा साखर आणि एक चमचा मीठ अगदी वेगळी कामे करतात आणि त्याचे कारण कोणी गोड वा खारट असण्याशी जोडलेले नाही; तो नियम जो आदर्श मिश्रणाचा बाष्प दाब सांगतो आणि ज्याची अपयशे त्याच्या यशांहून अधिक ज्ञानप्रद आहेत, कारण फार सहज उकळणारे द्रावण तुम्हाला सांगत आहे की त्याचे दोन घटक एकमेकांना आवडत नाहीत; आणि तो दुरुस्ती गुणक जो मोजतो की विद्राव्य प्रत्यक्षात किती कणांत तुटले, जो साध्या मिठासाठी दोन, कॅल्शियम क्लोराइडसाठी तीन, आणि ज्या संहतींवर आयनांनी एकमेकांना पूर्णपणे सोडलेले नाही तिथे दोघांसाठीही दोनहून काहीसा कमी आहे.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "relative-lowering-vapour-pressure",
        name: {
          en: "Relative lowering of vapour pressure",
          hi: "वाष्प दाब का आपेक्षिक अवनमन",
          mr: "बाष्प दाबाचे सापेक्ष अवनमन",
        },
        kind: "colligative property",
        prompt: {
          en: "Dissolve anything non-volatile in a liquid and fewer solvent molecules reach the surface to escape, so the pressure of vapour above it drops by a fraction equal to the mole fraction of what was added. Which property is this?",
          hi: "किसी द्रव में कोई भी अवाष्पशील चीज़ घोलो और कम विलायक अणु निकलने के लिए सतह तक पहुँचते हैं, अतः उसके ऊपर वाष्प का दाब उतने अंश से गिरता है जितना जोड़ी गई चीज़ का मोल अंश है। यह कौन-सा गुण है?",
          mr: "कोणत्याही द्रवात काहीही अबाष्पशील विरघळवा आणि कमी द्रावक रेणू निसटण्यासाठी पृष्ठभागापर्यंत पोहोचतात, म्हणून त्याच्यावरील बाष्पाचा दाब तितक्या अंशाने घसरतो जितका जोडलेल्या गोष्टीचा मोल अंश आहे. हा कोणता गुणधर्म?",
        },
        statement: {
          en: "Relative lowering of vapour pressure is (p° − p)/p°, and for an ideal dilute solution it equals the mole fraction of the solute, whatever the solute happens to be.",
          hi: "वाष्प दाब का आपेक्षिक अवनमन (p° − p)/p° है, और आदर्श तनु विलयन के लिए वह विलेय के मोल अंश के बराबर है, विलेय चाहे जो हो।",
          mr: "बाष्प दाबाचे सापेक्ष अवनमन म्हणजे (p° − p)/p°, आणि आदर्श विरळ द्रावणासाठी ते विद्राव्याच्या मोल अंशाइतके असते, विद्राव्य कोणतेही असो.",
        },
        detail: {
          en: "The mechanism is a matter of surface real estate: solute particles occupy part of the surface without evaporating themselves, so the escape rate falls while the return rate does not.",
          hi: "क्रियाविधि सतह की जगह का मामला है: विलेय कण सतह का कुछ हिस्सा घेरते हैं और स्वयं वाष्पित नहीं होते, अतः निकलने की दर गिरती है और लौटने की नहीं।",
          mr: "यंत्रणा ही पृष्ठभागाच्या जागेची बाब आहे: विद्राव्य कण पृष्ठभागाचा काही भाग व्यापतात आणि स्वतः बाष्पित होत नाहीत, म्हणून निसटण्याचा दर घसरतो आणि परतण्याचा नाही.",
        },
        extra: {
          en: "It is the parent of the other three: a lowered vapour pressure is why the solution must be heated further to boil and cooled further to freeze, so all four properties are one phenomenon counted four ways.",
          hi: "यह बाक़ी तीनों का जनक है: गिरा हुआ वाष्प दाब ही कारण है कि विलयन को उबालने के लिए और गर्म तथा जमाने के लिए और ठंडा करना पड़ता है, अतः चारों गुण एक ही परिघटना हैं जो चार ढंगों से गिनी गई।",
          mr: "हा बाकी तिघांचा जनक आहे: घसरलेला बाष्प दाबच कारण आहे की द्रावणाला उकळण्यासाठी अधिक तापवावे आणि गोठवण्यासाठी अधिक थंड करावे लागते, म्हणून चारही गुणधर्म एकच घटना आहेत जी चार प्रकारे मोजली गेली.",
        },
        pair: {
          left: {
            en: "Fewer molecules reach the surface to leave",
            hi: "कम अणु निकलने को सतह तक पहुँचते हैं",
            mr: "कमी रेणू निसटायला पृष्ठभागापर्यंत पोहोचतात",
          },
          right: {
            en: "relative lowering of vapour pressure",
            hi: "वाष्प दाब का आपेक्षिक अवनमन",
            mr: "बाष्प दाबाचे सापेक्ष अवनमन",
          },
        },
      },
      {
        id: "depression-of-freezing-point",
        name: {
          en: "Depression of freezing point",
          hi: "हिमांक का अवनमन",
          mr: "गोठणबिंदूचे अवनमन",
        },
        kind: "colligative property",
        prompt: {
          en: "Salt scattered on an icy road does not melt the ice by warming it; it makes the solution unable to freeze until a lower temperature is reached. Which property is being used?",
          hi: "बर्फ़ीली सड़क पर बिखेरा नमक बर्फ़ को गर्म करके नहीं पिघलाता; वह विलयन को ऐसा बना देता है कि वह और कम ताप तक जमे ही नहीं। कौन-सा गुण काम में लाया जा रहा है?",
          mr: "बर्फाळ रस्त्यावर पसरलेले मीठ बर्फ तापवून वितळवत नाही; ते द्रावणाला असे बनवते की ते अधिक कमी तापमानापर्यंत गोठूच नये. कोणता गुणधर्म वापरला जात आहे?",
        },
        statement: {
          en: "Depression of freezing point is ΔT_f = K_f × m, proportional to the molality of dissolved particles, with K_f = 1.86 K kg/mol for water.",
          hi: "हिमांक का अवनमन ΔT_f = K_f × m है, जो घुले कणों की मोललता का समानुपाती है, और पानी के लिए K_f = 1.86 K kg/mol.",
          mr: "गोठणबिंदूचे अवनमन म्हणजे ΔT_f = K_f × m, जे विरघळलेल्या कणांच्या मोललतेशी समानुपाती आहे, आणि पाण्यासाठी K_f = 1.86 K kg/mol.",
        },
        detail: {
          en: "Freezing means solvent molecules locking into a crystal that excludes the solute, so the solute molecules left behind in the shrinking liquid make it steadily harder for the next ones to join the solid.",
          hi: "जमना का अर्थ है विलायक अणुओं का ऐसे क्रिस्टल में जुड़ना जो विलेय को बाहर रखता है, अतः सिकुड़ते द्रव में पीछे छूटे विलेय अणु अगले अणुओं के ठोस में जुड़ने को उत्तरोत्तर कठिन बनाते जाते हैं।",
          mr: "गोठणे म्हणजे द्रावक रेणूंचे अशा स्फटिकात जखडणे जो विद्राव्याला बाहेर ठेवतो, म्हणून आकसणाऱ्या द्रवात मागे राहिलेले विद्राव्य रेणू पुढच्यांना घनात जोडणे उत्तरोत्तर कठीण करत जातात.",
        },
        extra: {
          en: "The constant K_f belongs to the solvent and not to the solute, which is why one table of values serves for every solution made in water and a different one for every solution made in benzene.",
          hi: "स्थिरांक K_f विलायक का है, विलेय का नहीं, इसीलिए मानों की एक ही तालिका पानी में बने हर विलयन के काम आती है और बेंज़ीन में बने हर विलयन के लिए दूसरी।",
          mr: "स्थिरांक K_f द्रावकाचा आहे, विद्राव्याचा नाही, म्हणूनच मूल्यांचे एकच कोष्टक पाण्यात बनवलेल्या प्रत्येक द्रावणासाठी कामी येते आणि बेंझिनमध्ये बनवलेल्या प्रत्येकासाठी दुसरे.",
        },
        pair: {
          left: {
            en: "The road salt that warms nothing at all",
            hi: "वह सड़क-नमक जो कुछ भी गर्म नहीं करता",
            mr: "ते रस्ता-मीठ जे काहीही तापवत नाही",
          },
          right: {
            en: "depression of freezing point",
            hi: "हिमांक का अवनमन",
            mr: "गोठणबिंदूचे अवनमन",
          },
        },
      },
      {
        id: "osmotic-pressure",
        name: {
          en: "Osmotic pressure",
          hi: "परासरण दाब",
          mr: "अभिसरण दाब",
        },
        kind: "colligative property",
        prompt: {
          en: "Separate a solution from its pure solvent by a membrane that lets only solvent through, and the solvent flows in until a measurable head of liquid pushes back hard enough to stop it. What is that pressure called?",
          hi: "किसी विलयन को उसके शुद्ध विलायक से ऐसी झिल्ली द्वारा अलग करो जो केवल विलायक को जाने दे, और विलायक तब तक भीतर बहता है जब तक द्रव का नापा जा सकने वाला स्तंभ इतना ज़ोर से पीछे न धकेले कि वह रुक जाए। उस दाब को क्या कहते हैं?",
          mr: "एखाद्या द्रावणाला त्याच्या शुद्ध द्रावकापासून अशा पडद्याने वेगळे करा जो केवळ द्रावकाला जाऊ देतो, आणि द्रावक तोवर आत वाहतो जोवर द्रवाचा मोजता येणारा स्तंभ इतक्या जोराने मागे ढकलत नाही की तो थांबावा. त्या दाबाला काय म्हणतात?",
        },
        statement: {
          en: "Osmotic pressure is π = CRT, the pressure that must be applied to a solution to stop solvent entering it through a semipermeable membrane.",
          hi: "परासरण दाब π = CRT है, वह दाब जो विलयन पर लगाना पड़े ताकि अर्धपारगम्य झिल्ली से होकर विलायक उसमें घुसना बंद कर दे।",
          mr: "अभिसरण दाब म्हणजे π = CRT, तो दाब जो द्रावणावर लावावा लागतो जेणेकरून अर्धपार्य पडद्यातून द्रावक त्यात शिरणे थांबवेल.",
        },
        detail: {
          en: "It is by far the largest of the four in size — a 0.1 molar solution gives about 2.5 atmospheres at room temperature while depressing the freezing point by under a fifth of a degree — which makes it the only one usable on very dilute solutions.",
          hi: "आकार में यह चारों में कहीं सबसे बड़ा है — 0.1 मोलर विलयन कमरे के ताप पर लगभग 2.5 वायुमंडल देता है जबकि हिमांक को एक अंश के पाँचवें भाग से भी कम गिराता है — और यही उसे बहुत तनु विलयनों पर काम में आने योग्य एकमात्र गुण बनाता है।",
          mr: "आकाराने हा चौघांत कितीतरी मोठा आहे — 0.1 मोलर द्रावण खोलीच्या तापमानावर सुमारे 2.5 वातावरण देते तर गोठणबिंदू एका अंशाच्या पाचव्या भागाहूनही कमी घसरवते — आणि हेच त्याला अतिशय विरळ द्रावणांवर वापरण्याजोगा एकमेव गुणधर्म बनवते.",
        },
        extra: {
          en: "That size is why it is the measurement of choice for proteins and polymers, whose molecules are so heavy that a gram of them supplies too few particles for any of the other three to register.",
          hi: "वही आकार कारण है कि प्रोटीनों और बहुलकों के लिए यही माप चुना जाता है, जिनके अणु इतने भारी हैं कि उनका एक ग्राम इतने कम कण देता है कि बाक़ी तीनों में से कोई दर्ज ही न कर पाए।",
          mr: "तोच आकार कारण आहे की प्रथिने आणि बहुवारिकांसाठी हेच माप निवडले जाते, ज्यांचे रेणू इतके जड आहेत की त्यांचा एक ग्रॅम इतके कमी कण देतो की बाकी तिघांपैकी कोणीही नोंदवूच शकणार नाही.",
        },
        pair: {
          left: {
            en: "Big enough to weigh a protein with",
            hi: "इतना बड़ा कि उससे प्रोटीन तौला जा सके",
            mr: "इतका मोठा की त्याने प्रथिन तोलता यावे",
          },
          right: {
            en: "osmotic pressure",
            hi: "परासरण दाब",
            mr: "अभिसरण दाब",
          },
        },
      },
      {
        id: "raoults-law",
        name: {
          en: "Raoult's law",
          hi: "राउल्ट का नियम",
          mr: "राउल्टचा नियम",
        },
        kind: "law or correction",
        prompt: {
          en: "In an ideal mixture each component contributes vapour in proportion to how much of the liquid it is, so the partial pressure of each is its pure vapour pressure times its mole fraction. Which law is this?",
          hi: "आदर्श मिश्रण में हर घटक उतने अनुपात में वाष्प देता है जितना वह द्रव में है, अतः हर एक का आंशिक दाब उसका शुद्ध वाष्प दाब गुणा उसका मोल अंश है। यह कौन-सा नियम है?",
          mr: "आदर्श मिश्रणात प्रत्येक घटक तितक्या प्रमाणात बाष्प देतो जितका तो द्रवात आहे, म्हणून प्रत्येकाचा आंशिक दाब त्याचा शुद्ध बाष्प दाब गुणिले त्याचा मोल अंश आहे. हा कोणता नियम?",
        },
        statement: {
          en: "Raoult's law states that the partial vapour pressure of a component is p = p°x, its pure vapour pressure multiplied by its mole fraction in the liquid.",
          hi: "राउल्ट का नियम कहता है कि किसी घटक का आंशिक वाष्प दाब p = p°x है, अर्थात् उसका शुद्ध वाष्प दाब गुणा द्रव में उसका मोल अंश।",
          mr: "राउल्टचा नियम सांगतो की एखाद्या घटकाचा आंशिक बाष्प दाब p = p°x आहे, म्हणजे त्याचा शुद्ध बाष्प दाब गुणिले द्रवातील त्याचा मोल अंश.",
        },
        detail: {
          en: "It holds exactly only when the two kinds of molecule are indifferent to each other, so that A next to B is neither more nor less comfortable than A next to A.",
          hi: "यह ठीक-ठीक तभी टिकता है जब दोनों तरह के अणु एक-दूसरे के प्रति उदासीन हों, ताकि B के बग़ल में A न अधिक न कम सहज हो, बनिस्बत A के बग़ल में A के।",
          mr: "हा नेमका तेव्हाच टिकतो जेव्हा दोन्ही प्रकारचे रेणू एकमेकांबाबत उदासीन असतील, जेणेकरून B च्या शेजारी A ना अधिक ना कमी सुखावह असावा, A च्या शेजारी A च्या तुलनेत.",
        },
        extra: {
          en: "It is the liquid-phase cousin of the ideal gas law in temperament: an idealisation that no real pair obeys perfectly, useful because the departures are small for similar molecules and instructive when they are not.",
          hi: "स्वभाव में यह आदर्श गैस नियम का द्रव-प्रावस्था वाला भाई है: ऐसा आदर्शीकरण जिसे कोई असली युग्म पूरी तरह नहीं मानता, काम का इसलिए कि समान अणुओं के लिए विचलन छोटे हैं और जब नहीं हैं तब ज्ञानप्रद।",
          mr: "स्वभावाने हा आदर्श वायू नियमाचा द्रव-अवस्थेतील भाऊ आहे: असे आदर्शीकरण जे कोणतीही खरी जोडी पूर्णपणे मानत नाही, उपयुक्त यासाठी की सारख्या रेणूंसाठी विचलने लहान आहेत आणि जेव्हा नाहीत तेव्हा ज्ञानप्रद.",
        },
        pair: {
          left: {
            en: "True when the molecules do not mind their neighbours",
            hi: "तब सच जब अणुओं को अपने पड़ोसियों से कोई शिकायत न हो",
            mr: "तेव्हा खरा जेव्हा रेणूंना आपल्या शेजाऱ्यांची तक्रार नसेल",
          },
          right: {
            en: "Raoult's law",
            hi: "राउल्ट का नियम",
            mr: "राउल्टचा नियम",
          },
        },
      },
      {
        id: "deviations-from-raoult",
        name: {
          en: "Deviations from Raoult's law",
          hi: "राउल्ट के नियम से विचलन",
          mr: "राउल्टच्या नियमापासून विचलने",
        },
        kind: "law or correction",
        prompt: {
          en: "A mixture of ethanol and acetone has a higher vapour pressure than the law predicts and gets slightly cold on mixing; a mixture of chloroform and acetone has a lower one and gets warm. What are these two behaviours called?",
          hi: "एथेनॉल और ऐसीटोन का मिश्रण नियम की भविष्यवाणी से ऊँचा वाष्प दाब रखता है और मिलाने पर थोड़ा ठंडा हो जाता है; क्लोरोफ़ॉर्म और ऐसीटोन का मिश्रण नीचा रखता है और गर्म हो जाता है। इन दोनों आचरणों को क्या कहते हैं?",
          mr: "इथेनॉल आणि ॲसिटोनचे मिश्रण नियमाच्या भाकिताहून उंच बाष्प दाब बाळगते आणि मिसळताना किंचित थंड होते; क्लोरोफॉर्म आणि ॲसिटोनचे मिश्रण खालचा बाळगते आणि उबदार होते. या दोन वर्तनांना काय म्हणतात?",
        },
        statement: {
          en: "Deviations from Raoult's law are positive when unlike molecules attract each other less than like ones, raising the vapour pressure, and negative when they attract more, lowering it.",
          hi: "राउल्ट के नियम से विचलन धनात्मक तब होते हैं जब असमान अणु समान अणुओं की तुलना में एक-दूसरे को कम खींचते हैं, जिससे वाष्प दाब बढ़ता है, और ऋणात्मक तब जब वे अधिक खींचते हैं, जिससे वह घटता है।",
          mr: "राउल्टच्या नियमापासूनची विचलने धन तेव्हा असतात जेव्हा असमान रेणू समान रेणूंच्या तुलनेत एकमेकांना कमी ओढतात, ज्याने बाष्प दाब वाढतो, आणि ऋण तेव्हा जेव्हा ते अधिक ओढतात, ज्याने तो घटतो.",
        },
        detail: {
          en: "The sign of the temperature change on mixing gives the sign of the deviation away: a mixture that cools has absorbed energy to break stronger like-like attractions, and one that warms has formed stronger unlike-unlike ones.",
          hi: "मिलाने पर ताप परिवर्तन का चिह्न विचलन का चिह्न तुरंत बता देता है: जो मिश्रण ठंडा होता है उसने प्रबल समान-समान आकर्षण तोड़ने को ऊर्जा सोखी है, और जो गर्म होता है उसने प्रबल असमान-असमान आकर्षण बनाए हैं।",
          mr: "मिसळताना तापमान बदलाचे चिन्ह विचलनाचे चिन्ह लगेच सांगते: जे मिश्रण थंड होते त्याने तीव्र समान-समान आकर्षणे तोडायला ऊर्जा शोषली आहे, आणि जे उबदार होते त्याने तीव्र असमान-असमान आकर्षणे बनवली आहेत.",
        },
        extra: {
          en: "A large enough deviation produces an azeotrope, a mixture that boils at constant composition and therefore cannot be separated by distillation at all — which is why ethanol and water part company at 95 per cent.",
          hi: "पर्याप्त बड़ा विचलन स्थिरक्वाथी बनाता है, ऐसा मिश्रण जो अचर संघटन पर उबलता है और इसलिए आसवन से अलग किया ही नहीं जा सकता — इसीलिए एथेनॉल और पानी 95 प्रतिशत पर साथ छोड़ देते हैं।",
          mr: "पुरेसे मोठे विचलन स्थिरक्वाथी बनवते, असे मिश्रण जे अचल संघटनावर उकळते आणि म्हणून ऊर्ध्वपातनाने वेगळे करताच येत नाही — म्हणूनच इथेनॉल आणि पाणी 95 टक्क्यांवर साथ सोडतात.",
        },
        pair: {
          left: {
            en: "The mixture that cools, and the one that warms",
            hi: "वह मिश्रण जो ठंडा होता है, और वह जो गर्म",
            mr: "ते मिश्रण जे थंड होते, आणि ते जे उबदार",
          },
          right: {
            en: "deviations from Raoult's law",
            hi: "राउल्ट के नियम से विचलन",
            mr: "राउल्टच्या नियमापासून विचलने",
          },
        },
      },
      {
        id: "vant-hoff-factor",
        name: {
          en: "The van't Hoff factor",
          hi: "वान्ट हॉफ गुणक",
          mr: "व्हॅन्ट हॉफ गुणक",
        },
        kind: "law or correction",
        prompt: {
          en: "One mole of glucose in a kilogram of water depresses the freezing point by 1.86 K; one mole of common salt depresses it by nearly twice as much, and one mole of calcium chloride by nearly three times. What number accounts for this?",
          hi: "एक किलोग्राम पानी में ग्लूकोस का एक मोल हिमांक को 1.86 K गिराता है; साधारण नमक का एक मोल उसे लगभग दुगुना गिराता है, और कैल्शियम क्लोराइड का एक मोल लगभग तिगुना। कौन-सी संख्या इसका हिसाब देती है?",
          mr: "एक किलोग्रॅम पाण्यात ग्लुकोजचा एक मोल गोठणबिंदू 1.86 K ने घसरवतो; साध्या मिठाचा एक मोल तो जवळपास दुप्पट घसरवतो, आणि कॅल्शियम क्लोराइडचा एक मोल जवळपास तिप्पट. कोणती संख्या याचा हिशेब देते?",
        },
        statement: {
          en: "The van't Hoff factor i is the ratio of the particles actually present to the formula units dissolved, so every colligative expression is multiplied by it.",
          hi: "वान्ट हॉफ गुणक i वस्तुतः मौजूद कणों और घोली गई सूत्र इकाइयों का अनुपात है, अतः हर अणुसंख्य व्यंजक उससे गुणा किया जाता है।",
          mr: "व्हॅन्ट हॉफ गुणक i म्हणजे प्रत्यक्षात उपस्थित कण आणि विरघळलेली सूत्र एकके यांचे गुणोत्तर, म्हणून प्रत्येक अणुसंख्य पदावली त्याने गुणली जाते.",
        },
        detail: {
          en: "It is greater than one for a solute that dissociates and LESS than one for a solute that associates, which is how benzoic acid in benzene gives i ≈ 0.5 by pairing up into dimers.",
          hi: "जो विलेय वियोजित होता है उसके लिए यह एक से बड़ा है और जो संगुणित होता है उसके लिए एक से कम, और इसी तरह बेंज़ीन में बेंज़ोइक अम्ल द्विलक बनाकर जुड़ जाने से i ≈ 0.5 देता है।",
          mr: "जे विद्राव्य विघटित होते त्यासाठी हा एकाहून मोठा आहे आणि जे संयुगित होते त्यासाठी एकाहून कमी, आणि अशाच प्रकारे बेंझिनमधले बेंझोइक आम्ल द्विलक बनवून जुळल्याने i ≈ 0.5 देते.",
        },
        extra: {
          en: "For salt it is not exactly 2 but a little less, because at real concentrations some sodium and chloride ions stay close enough to travel as a pair, and the shortfall is a measure of how incomplete the separation is.",
          hi: "नमक के लिए यह ठीक 2 नहीं बल्कि कुछ कम है, क्योंकि असली सांद्रताओं पर कुछ सोडियम और क्लोराइड आयन इतने पास रहते हैं कि युग्म बनकर चलें, और वह कमी बताती है कि पृथक्करण कितना अधूरा है।",
          mr: "मिठासाठी हा नेमका 2 नसून काहीसा कमी आहे, कारण खऱ्या संहतींवर काही सोडियम आणि क्लोराइड आयन इतके जवळ राहतात की जोडी बनून जावेत, आणि ती कमतरता सांगते की वेगळेपण किती अपूर्ण आहे.",
        },
        pair: {
          left: {
            en: "Two for salt, three for calcium chloride, a half for a dimer",
            hi: "नमक के लिए दो, कैल्शियम क्लोराइड के लिए तीन, द्विलक के लिए आधा",
            mr: "मिठासाठी दोन, कॅल्शियम क्लोराइडसाठी तीन, द्विलकासाठी अर्धा",
          },
          right: {
            en: "the van't Hoff factor",
            hi: "वान्ट हॉफ गुणक",
            mr: "व्हॅन्ट हॉफ गुणक",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "One mole of glucose and one mole of sodium chloride are dissolved separately in one kilogram of water each. The salt solution freezes at nearly twice the depression of the glucose one, but not exactly twice. Explain both the factor of two and the shortfall.",
          hi: "एक मोल ग्लूकोस और एक मोल सोडियम क्लोराइड अलग-अलग एक-एक किलोग्राम पानी में घोले जाते हैं। नमक का विलयन ग्लूकोस वाले से लगभग दुगुने अवनमन पर जमता है, पर ठीक दुगुने पर नहीं। दो का गुणक और कमी दोनों समझाओ।",
          mr: "एक मोल ग्लुकोज आणि एक मोल सोडियम क्लोराइड वेगवेगळे एकेका किलोग्रॅम पाण्यात विरघळवले जातात. मिठाचे द्रावण ग्लुकोजच्याहून जवळपास दुप्पट अवनमनावर गोठते, पण नेमक्या दुप्पटावर नाही. दोनचा गुणक आणि कमतरता दोन्ही समजावा.",
        },
        choices: [
          {
            en: "Colligative properties count PARTICLES, not molecules of a named substance and not their size or chemistry. Glucose dissolves as intact molecules, giving one particle per formula unit; sodium chloride separates into Na⁺ and Cl⁻, giving two, so the depression roughly doubles. It is not exactly double because at any real concentration a fraction of the ions remain close enough to move as pairs, so the effective particle count — the van't Hoff factor — comes out a little below 2 and falls further as the solution is made more concentrated",
            hi: "अणुसंख्य गुण कण गिनते हैं, किसी नामित पदार्थ के अणु नहीं और न उनका आकार या रसायन। ग्लूकोस सलामत अणुओं के रूप में घुलता है, प्रति सूत्र इकाई एक कण देता है; सोडियम क्लोराइड Na⁺ और Cl⁻ में अलग होता है, दो देता है, अतः अवनमन मोटे तौर पर दुगुना हो जाता है। वह ठीक दुगुना इसलिए नहीं कि किसी भी असली सांद्रता पर आयनों का एक अंश इतना पास रहता है कि युग्म बनकर चले, अतः प्रभावी कण-गिनती — वान्ट हॉफ गुणक — 2 से कुछ नीचे निकलती है और विलयन अधिक सांद्र करने पर और गिरती है",
            mr: "अणुसंख्य गुणधर्म कण मोजतात, कोणत्याही नामित पदार्थाचे रेणू नव्हे आणि त्यांचा आकार वा रसायनही नव्हे. ग्लुकोज शाबूत रेणूंच्या रूपात विरघळते, प्रति सूत्र एकक एक कण देते; सोडियम क्लोराइड Na⁺ आणि Cl⁻ मध्ये वेगळे होते, दोन देते, म्हणून अवनमन ढोबळमानाने दुप्पट होते. ते नेमके दुप्पट यासाठी नाही की कोणत्याही खऱ्या संहतीवर आयनांचा एक अंश इतका जवळ राहतो की जोडी बनून जावा, म्हणून प्रभावी कण-मोजणी — व्हॅन्ट हॉफ गुणक — 2 हून काहीशी खाली निघते आणि द्रावण अधिक संहत केल्यावर आणखी घसरते",
          },
          {
            en: "The salt depresses the freezing point more because sodium chloride is a much smaller molecule than glucose and so disturbs the ice lattice more effectively",
            hi: "नमक हिमांक अधिक गिराता है क्योंकि सोडियम क्लोराइड ग्लूकोस से कहीं छोटा अणु है और इसलिए बर्फ़ के जालक को अधिक प्रभावी ढंग से बिगाड़ता है",
            mr: "मीठ गोठणबिंदू अधिक घसरवते कारण सोडियम क्लोराइड ग्लुकोजहून कितीतरी लहान रेणू आहे आणि म्हणून बर्फाची जाळी अधिक परिणामकारकपणे बिघडवते",
          },
          {
            en: "The factor of two comes from sodium chloride having twice the molar mass of glucose, and the shortfall from experimental error in measuring such small temperature changes",
            hi: "दो का गुणक इससे आता है कि सोडियम क्लोराइड का मोलर द्रव्यमान ग्लूकोस का दुगुना है, और कमी इतने छोटे ताप परिवर्तन नापने की प्रायोगिक त्रुटि से",
            mr: "दोनचा गुणक यातून येतो की सोडियम क्लोराइडचे मोलर वस्तुमान ग्लुकोजच्या दुप्पट आहे, आणि कमतरता इतके लहान तापमान बदल मोजण्यातील प्रायोगिक त्रुटीतून",
          },
          {
            en: "Salt is an electrolyte and conducts electricity, and it is the current carried through the solution that prevents it from freezing",
            hi: "नमक विद्युत अपघट्य है और बिजली चलाता है, और विलयन में से बहती वही धारा उसे जमने से रोकती है",
            mr: "मीठ विद्युत अपघटनी आहे आणि वीज चालवते, आणि द्रावणातून वाहणारी तीच धारा त्याला गोठण्यापासून रोखते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The word 'colligative' comes from the Latin for 'bound together', and what it names is a class of properties that depend on a COUNT and on nothing else about what is counted. Four of them behave this way: the lowering of vapour pressure, the elevation of boiling point, the depression of freezing point and the osmotic pressure. In each, the size of the effect is fixed by how many dissolved particles are present per kilogram or per litre, and the identity of those particles — heavy or light, sweet or salty, organic or ionic — makes no difference whatever. That is a strong claim, and it is worth seeing why it holds. The mechanism in each case is about the solvent, not the solute. Freezing means solvent molecules leaving the liquid and locking into a crystal that excludes the solute. Whatever is dissolved simply gets in the way of that departure, and one obstruction is as good as another regardless of what it is made of. So the count is what matters. Now the two solutions. Glucose is a molecular solid: it dissolves as whole C₆H₁₂O₆ molecules, held together by covalent bonds that water cannot break. One mole of glucose gives one mole of particles, and ΔT_f = K_f m = 1.86 × 1 = 1.86 K. Sodium chloride is ionic. Water pulls the lattice apart into separate Na⁺ and Cl⁻ ions, and each of them is an independent particle for counting purposes — nothing about being charged, or about the two coming from the same crystal, makes them count as one. One mole of NaCl therefore gives two moles of particles, and ΔT_f should be 3.72 K. Calcium chloride gives three, and would depress by 5.58 K. Now the shortfall, which is where the real chemistry is. The measured depression for one molal sodium chloride is not 3.72 K but around 3.4 K, corresponding to i ≈ 1.85 rather than 2. The ions have not all got away from each other. In a solution of appreciable concentration, a Na⁺ and a Cl⁻ that happen to be close are held by an attraction that is weakened by the water but not abolished, and a fraction of them travel as a loosely bound pair. A pair is one particle for colligative purposes, not two. So the effective count falls short, and it falls further as the concentration rises and the ions crowd closer — which is why i approaches 2 only in the limit of infinite dilution, where the ions are too far apart to notice each other. Define i as the observed effect divided by the effect one formula unit per particle would give, and every colligative equation carries it: ΔT_f = i K_f m, π = i CRT, and so on. The factor is not a fudge but a measurement — it is how the fraction of ions that have genuinely separated is determined, and for a weak acid the same number gives the degree of dissociation directly. Note also the opposite case, which the same definition covers without amendment: benzoic acid dissolved in benzene gives i ≈ 0.5, because its molecules pair up into hydrogen-bonded dimers and two formula units travel as one particle. A number below one is a statement about association exactly as a number above one is a statement about dissociation. (The second and third options attribute the effect to a molecular property — size, mass — that colligative properties are by definition blind to; the fourth invents a role for conduction, which would predict a dependence on whether the solution is connected to anything.)",
          hi: "'अणुसंख्य' शब्द 'साथ बँधा हुआ' के लिए लातीनी से आता है, और वह ऐसे गुणों के वर्ग का नाम है जो एक गिनती पर निर्भर हैं और जो गिना जा रहा है उसके बारे में और किसी बात पर नहीं। चार गुण यों बरतते हैं: वाष्प दाब का अवनमन, क्वथनांक का उन्नयन, हिमांक का अवनमन और परासरण दाब। हर एक में प्रभाव का आकार इससे तय है कि प्रति किलोग्राम या प्रति लीटर कितने घुले कण मौजूद हैं, और उन कणों की पहचान — भारी या हल्के, मीठे या नमकीन, कार्बनिक या आयनिक — कोई फ़र्क़ नहीं डालती। यह प्रबल दावा है, और यह क्यों टिकता है यह देखने योग्य है। हर स्थिति में क्रियाविधि विलायक की है, विलेय की नहीं। जमना का अर्थ है विलायक अणुओं का द्रव छोड़कर ऐसे क्रिस्टल में जुड़ना जो विलेय को बाहर रखता है। जो कुछ भी घुला है वह बस उस प्रस्थान के रास्ते में आता है, और एक रुकावट दूसरी जितनी ही अच्छी है, चाहे वह किसी की बनी हो। अतः गिनती ही मायने रखती है। अब दोनों विलयन। ग्लूकोस आणविक ठोस है: वह पूरे C₆H₁₂O₆ अणुओं के रूप में घुलता है, जो ऐसे सहसंयोजक बंधों से बँधे हैं जिन्हें पानी तोड़ नहीं सकता। ग्लूकोस का एक मोल कणों का एक मोल देता है, और ΔT_f = K_f m = 1.86 × 1 = 1.86 K. सोडियम क्लोराइड आयनिक है। पानी जालक को अलग-अलग Na⁺ और Cl⁻ आयनों में खींच देता है, और गिनती के प्रयोजन से उनमें से हर एक स्वतंत्र कण है — आवेशित होना, या दोनों का एक ही क्रिस्टल से आना, उन्हें एक नहीं बना देता। अतः NaCl का एक मोल कणों के दो मोल देता है, और ΔT_f 3.72 K होना चाहिए। कैल्शियम क्लोराइड तीन देता है, और 5.58 K गिराता। अब कमी, जहाँ असली रसायन है। एक मोलल सोडियम क्लोराइड के लिए नापा गया अवनमन 3.72 K नहीं बल्कि लगभग 3.4 K है, जो i ≈ 1.85 के अनुरूप है, 2 के नहीं। सारे आयन एक-दूसरे से दूर नहीं हो पाए। ध्यान देने योग्य सांद्रता के विलयन में, संयोग से पास पड़े Na⁺ और Cl⁻ ऐसे आकर्षण से बँधे रहते हैं जिसे पानी कमज़ोर करता है पर मिटाता नहीं, और उनका एक अंश ढीले बँधे युग्म के रूप में चलता है। युग्म अणुसंख्य प्रयोजन के लिए एक कण है, दो नहीं। अतः प्रभावी गिनती कम पड़ती है, और सांद्रता बढ़ने तथा आयनों के पास आने पर वह और गिरती है — इसीलिए i, 2 के पास केवल अनंत तनुता की सीमा में जाता है, जहाँ आयन एक-दूसरे को देखने के लिए बहुत दूर हैं। i को देखे गए प्रभाव बटा उस प्रभाव के रूप में परिभाषित करो जो प्रति कण एक सूत्र इकाई देती, और हर अणुसंख्य समीकरण उसे ढोता है: ΔT_f = i K_f m, π = i CRT, इत्यादि। यह गुणक झोल नहीं बल्कि माप है — इसी से तय होता है कि आयनों का कितना अंश सचमुच अलग हुआ, और दुर्बल अम्ल के लिए वही संख्या वियोजन की मात्रा सीधे दे देती है। उलटी स्थिति भी ध्यान दो, जिसे वही परिभाषा बिना संशोधन समेट लेती है: बेंज़ीन में घुला बेंज़ोइक अम्ल i ≈ 0.5 देता है, क्योंकि उसके अणु हाइड्रोजन बंधित द्विलकों में जुड़ जाते हैं और दो सूत्र इकाइयाँ एक कण की तरह चलती हैं। एक से नीचे की संख्या संगुणन के बारे में ठीक वैसा ही कथन है जैसा एक से ऊपर की संख्या वियोजन के बारे में। (दूसरा और तीसरा विकल्प प्रभाव का श्रेय ऐसे आणविक गुण को देते हैं — आकार, द्रव्यमान — जिसके प्रति अणुसंख्य गुण परिभाषा से ही अंधे हैं; चौथा चालन को भूमिका दे देता है, जो यह भविष्यवाणी करता कि विलयन किसी चीज़ से जुड़ा है या नहीं इस पर निर्भरता होगी।)",
          mr: "'अणुसंख्य' हा शब्द 'एकत्र बांधलेला' साठीच्या लॅटिनमधून येतो, आणि तो अशा गुणधर्मांच्या वर्गाचे नाव आहे जे एका मोजणीवर अवलंबून आहेत आणि जे मोजले जात आहे त्याबद्दलच्या दुसऱ्या कशावरही नाही. चार गुणधर्म असे वागतात: बाष्प दाबाचे अवनमन, उत्कलनबिंदूचे उन्नयन, गोठणबिंदूचे अवनमन आणि अभिसरण दाब. प्रत्येकात परिणामाचा आकार यावरून ठरतो की प्रति किलोग्रॅम वा प्रति लिटर किती विरघळलेले कण उपस्थित आहेत, आणि त्या कणांची ओळख — जड की हलके, गोड की खारट, कार्बनी की आयनी — काहीही फरक पाडत नाही. हा भक्कम दावा आहे, आणि तो का टिकतो हे पाहण्याजोगे आहे. प्रत्येक स्थितीत यंत्रणा द्रावकाची आहे, विद्राव्याची नाही. गोठणे म्हणजे द्रावक रेणूंचे द्रव सोडून अशा स्फटिकात जखडणे जो विद्राव्याला बाहेर ठेवतो. जे काही विरघळले आहे ते फक्त त्या निघण्याच्या वाटेत येते, आणि एक अडथळा दुसऱ्याइतकाच चांगला, तो कशाचाही बनलेला असो. म्हणून मोजणीच महत्त्वाची. आता दोन्ही द्रावणे. ग्लुकोज हे रेणवीय घन आहे: ते पूर्ण C₆H₁₂O₆ रेणूंच्या रूपात विरघळते, जे अशा सहसंयुज बंधांनी बांधलेले आहेत जे पाणी तोडू शकत नाही. ग्लुकोजचा एक मोल कणांचा एक मोल देतो, आणि ΔT_f = K_f m = 1.86 × 1 = 1.86 K. सोडियम क्लोराइड आयनी आहे. पाणी जाळी वेगवेगळ्या Na⁺ आणि Cl⁻ आयनांत ओढते, आणि मोजणीच्या हेतूने त्यांतला प्रत्येक स्वतंत्र कण आहे — प्रभारित असणे, वा दोघांचे एकाच स्फटिकातून येणे, त्यांना एक बनवत नाही. म्हणून NaCl चा एक मोल कणांचे दोन मोल देतो, आणि ΔT_f 3.72 K असावे. कॅल्शियम क्लोराइड तीन देते, आणि 5.58 K ने घसरवेल. आता कमतरता, जिथे खरे रसायन आहे. एक मोलल सोडियम क्लोराइडसाठी मोजलेले अवनमन 3.72 K नसून सुमारे 3.4 K आहे, जे i ≈ 1.85 शी जुळते, 2 शी नाही. सर्व आयन एकमेकांपासून दूर होऊ शकले नाहीत. लक्षणीय संहतीच्या द्रावणात, योगायोगाने जवळ आलेले Na⁺ आणि Cl⁻ अशा आकर्षणाने बांधलेले राहतात जे पाणी क्षीण करते पण नष्ट करत नाही, आणि त्यांचा एक अंश सैल बांधलेल्या जोडीच्या रूपात जातो. जोडी अणुसंख्य हेतूसाठी एक कण आहे, दोन नाही. म्हणून प्रभावी मोजणी कमी पडते, आणि संहती वाढून आयन जवळ आल्यावर ती आणखी घसरते — म्हणूनच i हा 2 जवळ केवळ अनंत विरळतेच्या मर्यादेत जातो, जिथे आयन एकमेकांना पाहण्याइतके दूर आहेत. i ला निरीक्षिलेला परिणाम भागिले प्रति कण एक सूत्र एकक देईल तो परिणाम अशी व्याख्या करा, आणि प्रत्येक अणुसंख्य समीकरण तो वाहते: ΔT_f = i K_f m, π = i CRT, इत्यादी. हा गुणक थातुरमातुर नसून माप आहे — यातूनच ठरते की आयनांचा किती अंश खरोखर वेगळा झाला, आणि दुर्बल आम्लासाठी तीच संख्या विघटनाची मात्रा थेट देते. उलट स्थितीही लक्षात घ्या, जिला तीच व्याख्या दुरुस्तीविना सामावते: बेंझिनमध्ये विरघळलेले बेंझोइक आम्ल i ≈ 0.5 देते, कारण त्याचे रेणू हायड्रोजन बंधित द्विलकांत जुळतात आणि दोन सूत्र एकके एका कणासारखी जातात. एकाहून खालची संख्या संयुगनाबद्दल नेमके तसेच विधान आहे जसे एकाहून वरची संख्या विघटनाबद्दल. (दुसरा आणि तिसरा पर्याय परिणामाचे श्रेय अशा रेणवीय गुणधर्माला देतात — आकार, वस्तुमान — ज्याबाबत अणुसंख्य गुणधर्म व्याख्येनेच आंधळे आहेत; चौथा वहनाला भूमिका देतो, जे द्रावण कशाशी जोडलेले आहे की नाही यावर अवलंबित्व भाकीत करेल.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A laboratory must find the molar mass of a protein available only as a few milligrams. Freezing point depression and boiling point elevation both give unusable readings; osmotic pressure works well. Explain why, and what the choice of method reveals about the four colligative properties.",
          hi: "एक प्रयोगशाला को ऐसे प्रोटीन का मोलर द्रव्यमान निकालना है जो केवल कुछ मिलीग्राम में उपलब्ध है। हिमांक अवनमन और क्वथनांक उन्नयन दोनों बेकार पाठ्यांक देते हैं; परासरण दाब अच्छा चलता है। बताओ क्यों, और विधि का यह चुनाव चारों अणुसंख्य गुणों के बारे में क्या प्रकट करता है।",
          mr: "एका प्रयोगशाळेला अशा प्रथिनाचे मोलर वस्तुमान काढायचे आहे जे केवळ काही मिलिग्रॅममध्ये उपलब्ध आहे. गोठणबिंदू अवनमन आणि उत्कलनबिंदू उन्नयन दोन्ही निरुपयोगी वाचने देतात; अभिसरण दाब चांगला चालतो. का ते सांगा, आणि पद्धतीची ही निवड चारही अणुसंख्य गुणधर्मांबद्दल काय उघड करते.",
        },
        choices: [
          {
            en: "All four count particles, but they differ enormously in how large a signal a given count produces. A protein of molar mass 60000 supplies very few moles per gram, so a realistic solution is perhaps 10⁻⁴ molal — which depresses the freezing point by about 0.0002 K, far below what any thermometer can resolve. The same concentration gives an osmotic pressure of a few millimetres of mercury, easily measured as a visible column of liquid. The choice of method is therefore about SENSITIVITY, not about principle: osmotic pressure is used for macromolecules because it turns a tiny particle count into a large mechanical quantity",
            hi: "चारों कण गिनते हैं, पर वे इसमें बहुत भिन्न हैं कि दी गई गिनती कितना बड़ा संकेत देती है। 60000 मोलर द्रव्यमान का प्रोटीन प्रति ग्राम बहुत कम मोल देता है, अतः यथार्थ विलयन शायद 10⁻⁴ मोलल है — जो हिमांक को लगभग 0.0002 K गिराता है, किसी भी तापमापी की विभेदन क्षमता से कहीं नीचे। वही सांद्रता कुछ मिलीमीटर पारे का परासरण दाब देती है, जिसे द्रव के दिखते स्तंभ के रूप में आसानी से नापा जा सकता है। अतः विधि का चुनाव संवेदनशीलता का मामला है, सिद्धांत का नहीं: वृहदणुओं के लिए परासरण दाब इसलिए काम आता है कि वह नन्ही कण-गिनती को बड़ी यांत्रिक राशि में बदल देता है",
            mr: "चारही कण मोजतात, पण दिलेली मोजणी किती मोठा संकेत देते यात ते खूप वेगळे आहेत. 60000 मोलर वस्तुमानाचे प्रथिन प्रति ग्रॅम फार कमी मोल देते, म्हणून वास्तववादी द्रावण कदाचित 10⁻⁴ मोलल आहे — जे गोठणबिंदू सुमारे 0.0002 K ने घसरवते, कोणत्याही तापमापीच्या विभेदन क्षमतेहून कितीतरी खाली. तीच संहती काही मिलीमीटर पाऱ्याचा अभिसरण दाब देते, जो द्रवाच्या दिसणाऱ्या स्तंभाच्या रूपात सहज मोजता येतो. म्हणून पद्धतीची निवड संवेदनशीलतेची बाब आहे, तत्त्वाची नाही: महारेणूंसाठी अभिसरण दाब यासाठी वापरला जातो की तो चिमुकली कण-मोजणी मोठ्या यांत्रिक राशीत बदलतो",
          },
          {
            en: "Freezing and boiling methods fail because proteins are destroyed by heating and by freezing, so only a method carried out at room temperature can be used",
            hi: "जमाने और उबालने की विधियाँ इसलिए विफल होती हैं कि प्रोटीन गर्म करने और जमाने से नष्ट हो जाते हैं, अतः केवल कमरे के ताप पर की जाने वाली विधि काम आ सकती है",
            mr: "गोठवणे आणि उकळण्याच्या पद्धती यासाठी अपयशी ठरतात की प्रथिने तापवल्याने आणि गोठवल्याने नष्ट होतात, म्हणून केवळ खोलीच्या तापमानावर केलेली पद्धतच वापरता येते",
          },
          {
            en: "Osmotic pressure is not a colligative property at all but depends on molecular size, which is why it works for large molecules where the counting methods fail",
            hi: "परासरण दाब अणुसंख्य गुण है ही नहीं बल्कि आणविक आकार पर निर्भर है, इसीलिए वह बड़े अणुओं के लिए चलता है जहाँ गिनने वाली विधियाँ विफल होती हैं",
            mr: "अभिसरण दाब हा अणुसंख्य गुणधर्म आहेच नाही तर रेणवीय आकारावर अवलंबून आहे, म्हणूनच तो मोठ्या रेणूंसाठी चालतो जिथे मोजणाऱ्या पद्धती अपयशी ठरतात",
          },
          {
            en: "The other three methods would work equally well if a more concentrated solution were used, and the only obstacle is that the laboratory has too little protein",
            hi: "बाक़ी तीनों विधियाँ भी उतनी ही अच्छी चलतीं यदि अधिक सांद्र विलयन काम में लिया जाता, और एकमात्र बाधा यह है कि प्रयोगशाला के पास प्रोटीन बहुत कम है",
            mr: "बाकी तिन्ही पद्धतीही तितक्याच चांगल्या चालल्या असत्या जर अधिक संहत द्रावण वापरले असते, आणि एकमेव अडथळा हा की प्रयोगशाळेकडे प्रथिन फार कमी आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "This is a question about instrument choice, and the reasoning behind it is the same wherever a small quantity has to be turned into a readable one. Start with what the four properties have in common and then with what separates them in practice. IN COMMON: all four are proportional to the number of dissolved particles per unit of solvent, and to nothing else about them. Any of the four can therefore be used to find a molar mass — dissolve a known mass, measure the effect, deduce the number of moles, divide. In principle the four are interchangeable. IN PRACTICE: the constant of proportionality differs by orders of magnitude, and a measurement is only as good as the size of the signal it produces against the noise of the instrument. Put numbers to the protein. Suppose 1 g of a protein of molar mass 60000 is dissolved in 100 g of water. That is 1/60000 = 1.7 × 10⁻⁵ mol in 0.1 kg, so the molality is about 1.7 × 10⁻⁴. Now compute each effect. FREEZING POINT: ΔT_f = 1.86 × 1.7 × 10⁻⁴ ≈ 3 × 10⁻⁴ K. A good laboratory thermometer resolves perhaps 0.01 K, and even a Beckmann thermometer struggles below 0.001 K. The signal is at least ten times smaller than the smallest division. BOILING POINT: K_b for water is 0.52, smaller still, so the elevation is about 9 × 10⁻⁵ K — worse. And boiling a protein solution for long enough to read a steady temperature would in any case denature it. VAPOUR PRESSURE: the relative lowering equals the mole fraction of the solute, about 3 × 10⁻⁶, which means measuring a pressure change of a few thousandths of a millimetre of mercury against a background of about 20 mm. OSMOTIC PRESSURE: π = CRT. With C ≈ 1.7 × 10⁻⁴ mol/L, R = 0.0821 and T = 300 K, π ≈ 4 × 10⁻³ atm. That sounds small until it is converted: 4 × 10⁻³ atm is about 3 mm of mercury, or — since the liquid in the tube is water rather than mercury — roughly 4 cm of water. A column four centimetres high is not a delicate measurement at all; it can be read off a ruler. The reason for the difference is worth stating rather than just observing. The three thermal properties convert a particle count into a temperature shift, and temperature shifts of a few ten-thousandths of a degree are at the edge of what thermometry can do. Osmotic pressure converts the same count into a mechanical pressure, and pressure can be amplified for free by measuring it as the height of a liquid column — a small pressure in a narrow tube becomes a long, easily visible length. The method wins on units, not on physics. Two consequences follow. First, the choice reverses for small molecules: for a solute of molar mass 60, the same gram gives a thousand times more particles, the freezing point depression becomes a comfortable 0.3 K, and cryoscopy is the quicker and cheaper method — osmometry would give a pressure of several atmospheres and burst the membrane. Second, the molar mass obtained by osmometry for a polymer is a number-average, since the method counts molecules without regard to their individual sizes, and a sample containing a few very long chains and many short ones will report a value dominated by the short ones. That is not a defect but a definition, and it is why polymer chemists quote more than one kind of average molar mass and say which method produced it. (The second option cites a real concern about denaturation but makes it the reason, when the arithmetic already rules the thermal methods out before any protein is harmed; the third denies that osmotic pressure is colligative, which its CRT form contradicts; the fourth assumes the effects scale into usable range, when a solution concentrated enough to give a readable freezing point depression would need more protein than exists in the sample.)",
          hi: "यह यंत्र चुनने का प्रश्न है, और उसके पीछे का तर्क वहीं-वहीं वही है जहाँ छोटी राशि को पढ़ने लायक़ बनाना पड़ता है। पहले लो कि चारों गुणों में क्या साझा है और फिर कि व्यवहार में उन्हें क्या अलग करता है। साझा: चारों घुले कणों की प्रति एकांक विलायक संख्या के समानुपाती हैं, और उनके बारे में और किसी बात के नहीं। अतः चारों में से किसी से भी मोलर द्रव्यमान निकाला जा सकता है — ज्ञात द्रव्यमान घोलो, प्रभाव नापो, मोलों की संख्या निकालो, भाग दो। सिद्धांततः चारों आपस में बदले जा सकते हैं। व्यवहार में: समानुपात का स्थिरांक कोटियों से भिन्न है, और कोई माप उतना ही अच्छा है जितना बड़ा संकेत वह यंत्र के शोर के मुक़ाबले देता है। प्रोटीन में संख्याएँ भरो। मानो 60000 मोलर द्रव्यमान के प्रोटीन का 1 g, 100 g पानी में घोला गया। वह 0.1 kg में 1/60000 = 1.7 × 10⁻⁵ मोल है, अतः मोललता लगभग 1.7 × 10⁻⁴ है। अब हर प्रभाव निकालो। हिमांक: ΔT_f = 1.86 × 1.7 × 10⁻⁴ ≈ 3 × 10⁻⁴ K. अच्छा प्रयोगशाला तापमापी शायद 0.01 K विभेदित करता है, और बेकमान तापमापी भी 0.001 K से नीचे जूझता है। संकेत सबसे छोटे विभाजन से कम से कम दस गुना छोटा है। क्वथनांक: पानी के लिए K_b 0.52 है, और भी छोटा, अतः उन्नयन लगभग 9 × 10⁻⁵ K — और बुरा। और प्रोटीन विलयन को स्थिर ताप पढ़ने भर देर उबालना उसे वैसे भी विकृत कर देता। वाष्प दाब: आपेक्षिक अवनमन विलेय के मोल अंश के बराबर है, लगभग 3 × 10⁻⁶, अर्थात् लगभग 20 mm की पृष्ठभूमि पर पारे के कुछ हज़ारवें मिलीमीटर का दाब परिवर्तन नापना। परासरण दाब: π = CRT. C ≈ 1.7 × 10⁻⁴ mol/L, R = 0.0821 और T = 300 K के साथ, π ≈ 4 × 10⁻³ atm. बदलने तक यह छोटा लगता है: 4 × 10⁻³ atm लगभग 3 mm पारा है, या — चूँकि नली में द्रव पारा नहीं पानी है — मोटे तौर पर 4 cm पानी। चार सेंटीमीटर ऊँचा स्तंभ कोई नाज़ुक माप है ही नहीं; उसे रूलर से पढ़ा जा सकता है। अंतर का कारण केवल देखने के बजाय कहना चाहिए। तीनों ऊष्मीय गुण कण-गिनती को ताप के खिसकाव में बदलते हैं, और अंश के कुछ दस-हज़ारवें भाग के ताप खिसकाव तापमिति की सीमा पर हैं। परासरण दाब उसी गिनती को यांत्रिक दाब में बदलता है, और दाब को द्रव स्तंभ की ऊँचाई के रूप में नापकर मुफ़्त में बढ़ाया जा सकता है — सँकरी नली में छोटा दाब लंबी, आसानी से दिखती लंबाई बन जाता है। विधि मात्रकों पर जीतती है, भौतिकी पर नहीं। दो परिणाम निकलते हैं। पहला, छोटे अणुओं के लिए चुनाव उलट जाता है: 60 मोलर द्रव्यमान के विलेय के लिए वही ग्राम हज़ार गुना अधिक कण देता है, हिमांक अवनमन आरामदेह 0.3 K हो जाता है, और हिमांकमिति तेज़ तथा सस्ती विधि है — परासरणमिति कई वायुमंडल का दाब देती और झिल्ली फाड़ देती। दूसरा, बहुलक के लिए परासरणमिति से मिला मोलर द्रव्यमान संख्या-औसत है, क्योंकि विधि अणुओं को उनके अलग-अलग आकारों की परवाह किए बिना गिनती है, और जिस नमूने में कुछ बहुत लंबी शृंखलाएँ और बहुत सारी छोटी हों वह ऐसा मान बताएगा जिस पर छोटी शृंखलाओं का दबदबा है। यह दोष नहीं बल्कि परिभाषा है, और इसीलिए बहुलक रसायनज्ञ एक से अधिक तरह के औसत मोलर द्रव्यमान बताते हैं और कहते हैं कि कौन-सी विधि से निकला। (दूसरा विकल्प विकृतीकरण की असली चिंता गिनाता है पर उसे कारण बना देता है, जबकि अंकगणित किसी प्रोटीन को नुक़सान होने से पहले ही ऊष्मीय विधियों को ख़ारिज कर चुका है; तीसरा इनकार करता है कि परासरण दाब अणुसंख्य है, जिसका खंडन उसका CRT रूप करता है; चौथा मान लेता है कि प्रभाव काम की परास में आ जाएँगे, जबकि पढ़ने लायक़ हिमांक अवनमन देने भर सांद्र विलयन को उससे अधिक प्रोटीन चाहिए जितना नमूने में है।)",
          mr: "हा उपकरण निवडण्याचा प्रश्न आहे, आणि त्यामागचा युक्तिवाद तिथेतिथे तोच आहे जिथे लहान राशी वाचण्याजोगी करावी लागते. आधी घ्या की चारही गुणधर्मांत काय समान आहे आणि मग व्यवहारात त्यांना काय वेगळे करते. समान: चारही विरघळलेल्या कणांच्या प्रति एकक द्रावक संख्येशी समानुपाती आहेत, आणि त्यांच्याबद्दलच्या दुसऱ्या कशाशीही नाही. म्हणून चारांपैकी कोणत्याहीने मोलर वस्तुमान काढता येते — ज्ञात वस्तुमान विरघळवा, परिणाम मोजा, मोलांची संख्या काढा, भागा. तत्त्वतः चारही अदलाबदल करण्याजोगे आहेत. व्यवहारात: समानुपाताचा स्थिरांक कोटींनी वेगळा आहे, आणि कोणतेही माप तितकेच चांगले जितका मोठा संकेत ते उपकरणाच्या गोंगाटासमोर देते. प्रथिनात संख्या भरा. समजा 60000 मोलर वस्तुमानाच्या प्रथिनाचा 1 g, 100 g पाण्यात विरघळवला. ते 0.1 kg मध्ये 1/60000 = 1.7 × 10⁻⁵ मोल आहे, म्हणून मोललता सुमारे 1.7 × 10⁻⁴ आहे. आता प्रत्येक परिणाम काढा. गोठणबिंदू: ΔT_f = 1.86 × 1.7 × 10⁻⁴ ≈ 3 × 10⁻⁴ K. चांगला प्रयोगशाळा तापमापी कदाचित 0.01 K विभेदित करतो, आणि बेकमान तापमापीही 0.001 K खाली झगडतो. संकेत सर्वांत लहान विभागाहून किमान दहापट लहान आहे. उत्कलनबिंदू: पाण्यासाठी K_b 0.52 आहे, आणखी लहान, म्हणून उन्नयन सुमारे 9 × 10⁻⁵ K — आणखी वाईट. आणि प्रथिन द्रावण स्थिर तापमान वाचण्याइतका वेळ उकळणे ते तसेही विकृत करेल. बाष्प दाब: सापेक्ष अवनमन विद्राव्याच्या मोल अंशाइतके आहे, सुमारे 3 × 10⁻⁶, म्हणजे सुमारे 20 mm च्या पार्श्वभूमीवर पाऱ्याच्या काही हजारांश मिलीमीटरचा दाब बदल मोजणे. अभिसरण दाब: π = CRT. C ≈ 1.7 × 10⁻⁴ mol/L, R = 0.0821 आणि T = 300 K सह, π ≈ 4 × 10⁻³ atm. रूपांतर करेपर्यंत हे लहान वाटते: 4 × 10⁻³ atm म्हणजे सुमारे 3 mm पारा, वा — नळीतले द्रव पारा नसून पाणी असल्याने — ढोबळमानाने 4 cm पाणी. चार सेंटीमीटर उंच स्तंभ हे नाजूक माप मुळीच नाही; ते पट्टीने वाचता येते. फरकाचे कारण केवळ पाहण्याऐवजी सांगायला हवे. तिन्ही औष्णिक गुणधर्म कण-मोजणीचे तापमान सरकावात रूपांतर करतात, आणि अंशाच्या काही दहा-हजारांश भागाचे तापमान सरकाव तापमापनाच्या सीमेवर आहेत. अभिसरण दाब तीच मोजणी यांत्रिक दाबात बदलतो, आणि दाब द्रव स्तंभाच्या उंचीच्या रूपात मोजून फुकट वाढवता येतो — अरुंद नळीतला लहान दाब लांब, सहज दिसणारी लांबी बनतो. पद्धत एककांवर जिंकते, भौतिकीवर नाही. दोन परिणाम निघतात. पहिला, लहान रेणूंसाठी निवड उलटते: 60 मोलर वस्तुमानाच्या विद्राव्यासाठी तोच ग्रॅम हजारपट अधिक कण देतो, गोठणबिंदू अवनमन आरामदायक 0.3 K होते, आणि गोठणमापन जलद आणि स्वस्त पद्धत आहे — अभिसरणमापन कित्येक वातावरणांचा दाब देईल आणि पडदा फाडेल. दुसरा, बहुवारिकासाठी अभिसरणमापनाने मिळालेले मोलर वस्तुमान संख्या-सरासरी आहे, कारण पद्धत रेणूंना त्यांच्या वेगवेगळ्या आकारांची पर्वा न करता मोजते, आणि ज्या नमुन्यात काही अतिशय लांब साखळ्या आणि पुष्कळ लहान असतील तो असे मूल्य सांगेल ज्यावर लहान साखळ्यांचे वर्चस्व आहे. हा दोष नसून व्याख्या आहे, आणि म्हणूनच बहुवारिक रसायनशास्त्रज्ञ एकाहून अधिक प्रकारची सरासरी मोलर वस्तुमाने सांगतात आणि कोणत्या पद्धतीने निघाली ते सांगतात. (दुसरा पर्याय विकृतीकरणाची खरी काळजी सांगतो पण तिला कारण बनवतो, तर अंकगणित कोणत्याही प्रथिनाला हानी होण्याआधीच औष्णिक पद्धती नाकारून बसले आहे; तिसरा अभिसरण दाब अणुसंख्य आहे हे नाकारतो, ज्याचे खंडन त्याचे CRT रूप करते; चौथा गृहीत धरतो की परिणाम वापरण्याजोग्या पल्ल्यात येतील, तर वाचण्याजोगे गोठणबिंदू अवनमन देण्याइतक्या संहत द्रावणाला नमुन्यात आहे त्याहून अधिक प्रथिन लागेल.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Electrochemistry                                            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-12-electrochemistry",
    subject: "CHEMISTRY",
    classLevel: 12,
    chapter: {
      en: "Chapter 2 — Electrochemistry",
      hi: "अध्याय 2 — वैद्युतरसायन",
      mr: "प्रकरण 2 — विद्युतरसायन",
    },
    name: {
      en: "Electrochemistry",
      hi: "वैद्युतरसायन",
      mr: "विद्युतरसायन",
    },
    summary: {
      en: "A redox reaction pulled apart into two halves so that the electrons have to travel through a wire to get from one to the other, which is a battery; a reference electrode whose potential is declared to be zero because no single electrode's potential can ever be measured on its own, only the difference between two; a table built from that convention which then predicts, for any pair of metals, which will dissolve and which will plate out; an equation that says how the voltage sags as the reaction proceeds and reaches zero exactly at equilibrium; a law relating the mass deposited to the charge passed, so a coulomb is a countable number of electrons; and a conductivity that rises on dilution for two entirely different reasons in the two kinds of electrolyte.",
      hi: "किसी उपचयन-अपचयन अभिक्रिया को दो आधों में चीर देना ताकि इलेक्ट्रॉनों को एक से दूसरे तक जाने के लिए तार से होकर चलना पड़े, और यही बैटरी है; ऐसा संदर्भ इलेक्ट्रोड जिसका विभव शून्य घोषित किया जाता है क्योंकि किसी अकेले इलेक्ट्रोड का विभव कभी अपने आप नापा ही नहीं जा सकता, केवल दो के बीच का अंतर; उसी परिपाटी से बनी तालिका जो फिर धातुओं के किसी भी युग्म के लिए बता देती है कि कौन घुलेगा और कौन जमेगा; वह समीकरण जो बताता है कि अभिक्रिया चलते-चलते वोल्टता कैसे बैठती जाती है और ठीक साम्य पर शून्य हो जाती है; वह नियम जो जमे द्रव्यमान को बहाए गए आवेश से जोड़ता है, अतः एक कूलॉम इलेक्ट्रॉनों की गिनी जा सकने वाली संख्या है; और वह चालकता जो तनुकरण पर दो तरह के विद्युत अपघट्यों में बिलकुल भिन्न दो कारणों से बढ़ती है।",
      mr: "एखादी उपचयन-अपचयन अभिक्रिया दोन अर्ध्यांत फाडणे जेणेकरून इलेक्ट्रॉनांना एकाकडून दुसऱ्याकडे जाण्यास तारेतून जावे लागेल, आणि हीच बॅटरी; असा संदर्भ विद्युताग्र ज्याचा विभव शून्य घोषित केला जातो कारण कोणत्याही एकट्या विद्युताग्राचा विभव कधी स्वतःहून मोजताच येत नाही, केवळ दोघांतील फरक; त्याच संकेतातून बनलेले कोष्टक जे मग धातूंच्या कोणत्याही जोडीसाठी सांगते की कोण विरघळेल आणि कोण जमेल; ते समीकरण जे सांगते की अभिक्रिया चालता चालता व्होल्टेज कसा बसत जातो आणि नेमक्या समतोलावर शून्य होतो; तो नियम जो जमलेल्या वस्तुमानाला वाहलेल्या प्रभाराशी जोडतो, म्हणून एक कुलोम म्हणजे इलेक्ट्रॉनांची मोजता येणारी संख्या; आणि ती वाहकता जी विरळीकरणावर दोन प्रकारच्या विद्युत अपघटनींत पूर्णपणे वेगळ्या दोन कारणांनी वाढते.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "galvanic-cell",
        name: {
          en: "The galvanic cell",
          hi: "गैल्वेनी सेल",
          mr: "गॅल्व्हॅनी घट",
        },
        kind: "cell concept",
        prompt: {
          en: "Put the zinc in one beaker and the copper sulphate in another, join them by a wire and a salt bridge, and the same reaction that would have released its energy as heat now drives a current instead. Which arrangement is this?",
          hi: "ज़िंक को एक बीकर में और कॉपर सल्फ़ेट को दूसरे में रखो, उन्हें तार और लवण सेतु से जोड़ो, और वही अभिक्रिया जो अपनी ऊर्जा ऊष्मा के रूप में छोड़ती, अब उसके बजाय धारा चलाती है। यह कौन-सी व्यवस्था है?",
          mr: "जस्त एका बीकरमध्ये आणि कॉपर सल्फेट दुसऱ्यात ठेवा, त्यांना तार आणि क्षार सेतूने जोडा, आणि जी अभिक्रिया आपली ऊर्जा उष्णतेच्या रूपात सोडली असती ती आता त्याऐवजी धारा चालवते. ही कोणती मांडणी?",
        },
        statement: {
          en: "A galvanic cell separates the two halves of a spontaneous redox reaction so that the electrons must travel through an external circuit, converting chemical energy directly into electrical energy.",
          hi: "गैल्वेनी सेल किसी स्वतःप्रवर्तित उपचयन-अपचयन अभिक्रिया के दोनों आधों को अलग कर देता है ताकि इलेक्ट्रॉनों को बाहरी परिपथ से होकर चलना पड़े, और रासायनिक ऊर्जा सीधे विद्युत ऊर्जा में बदल जाए।",
          mr: "गॅल्व्हॅनी घट एखाद्या स्वयंस्फूर्त उपचयन-अपचयन अभिक्रियेचे दोन्ही अर्धे वेगळे करतो जेणेकरून इलेक्ट्रॉनांना बाह्य परिपथातून जावे लागेल, आणि रासायनिक ऊर्जा थेट विद्युत ऊर्जेत बदलेल.",
        },
        detail: {
          en: "The salt bridge is not optional decoration: without it, charge would build up in each beaker within moments and stop the reaction, so its job is to let ions move and keep both solutions neutral.",
          hi: "लवण सेतु वैकल्पिक सजावट नहीं: उसके बिना क्षणों में हर बीकर में आवेश जमा हो जाता और अभिक्रिया रुक जाती, अतः उसका काम आयनों को चलने देना और दोनों विलयनों को उदासीन रखना है।",
          mr: "क्षार सेतू ऐच्छिक सजावट नाही: त्याविना क्षणांत प्रत्येक बीकरमध्ये प्रभार साठला असता आणि अभिक्रिया थांबली असती, म्हणून त्याचे काम आयनांना हलू देणे आणि दोन्ही द्रावणे उदासीन ठेवणे.",
        },
        extra: {
          en: "Drop the zinc straight into the copper sulphate and exactly the same reaction happens with exactly the same energy release, but as heat and with no useful work — the cell's whole achievement is to make the electrons take the long way round.",
          hi: "ज़िंक को सीधे कॉपर सल्फ़ेट में डालो और ठीक वही अभिक्रिया ठीक उतनी ही ऊर्जा छोड़ते हुए होती है, पर ऊष्मा के रूप में और बिना किसी काम के — सेल की पूरी उपलब्धि इलेक्ट्रॉनों को लंबा रास्ता लेने पर मजबूर करना है।",
          mr: "जस्त थेट कॉपर सल्फेटमध्ये टाका आणि नेमकी तीच अभिक्रिया नेमकी तितकीच ऊर्जा सोडत घडते, पण उष्णतेच्या रूपात आणि कोणत्याही कामाविना — घटाची अख्खी कामगिरी इलेक्ट्रॉनांना लांबचा मार्ग घ्यायला भाग पाडणे.",
        },
        pair: {
          left: {
            en: "Makes the electrons take the long way round",
            hi: "इलेक्ट्रॉनों को लंबा रास्ता लेने पर मजबूर करता है",
            mr: "इलेक्ट्रॉनांना लांबचा मार्ग घ्यायला भाग पाडतो",
          },
          right: {
            en: "the galvanic cell",
            hi: "गैल्वेनी सेल",
            mr: "गॅल्व्हॅनी घट",
          },
        },
      },
      {
        id: "standard-hydrogen-electrode",
        name: {
          en: "The standard hydrogen electrode",
          hi: "मानक हाइड्रोजन इलेक्ट्रोड",
          mr: "प्रमाणित हायड्रोजन विद्युताग्र",
        },
        kind: "cell concept",
        prompt: {
          en: "Hydrogen gas at one bar bubbled over platinised platinum in one molar acid, given a potential of exactly zero not because it has none but because every measurement is a comparison. What is this?",
          hi: "एक बार पर हाइड्रोजन गैस, जो एक मोलर अम्ल में प्लैटिनमीकृत प्लैटिनम पर बुदबुदाती है, जिसे ठीक शून्य विभव दिया गया है, इसलिए नहीं कि उसका कोई विभव नहीं बल्कि इसलिए कि हर माप एक तुलना है। यह क्या है?",
          mr: "एक बारवर हायड्रोजन वायू, जो एक मोलर आम्लात प्लॅटिनमित प्लॅटिनमवर बुडबुडतो, ज्याला नेमका शून्य विभव दिलेला आहे, यासाठी नाही की त्याला विभव नाही तर यासाठी की प्रत्येक माप ही तुलना आहे. हे काय आहे?",
        },
        statement: {
          en: "The standard hydrogen electrode is the reference against which all electrode potentials are quoted, assigned a potential of exactly zero at 298 K, one bar of hydrogen and unit activity of H⁺.",
          hi: "मानक हाइड्रोजन इलेक्ट्रोड वह संदर्भ है जिसके सापेक्ष सभी इलेक्ट्रोड विभव बताए जाते हैं, और उसे 298 K, एक बार हाइड्रोजन तथा H⁺ की एकांक सक्रियता पर ठीक शून्य विभव दिया गया है।",
          mr: "प्रमाणित हायड्रोजन विद्युताग्र हा तो संदर्भ ज्याच्या सापेक्ष सर्व विद्युताग्र विभव सांगितले जातात, आणि त्याला 298 K, एक बार हायड्रोजन आणि H⁺ ची एकक क्रियाशीलता यावर नेमका शून्य विभव दिलेला आहे.",
        },
        detail: {
          en: "The choice of zero is a convention and could have fallen anywhere: shifting it by a volt would change every tabulated potential by a volt and leave every measurable cell voltage exactly as it was.",
          hi: "शून्य का चुनाव परिपाटी है और वह कहीं भी पड़ सकता था: उसे एक वोल्ट खिसकाने से हर तालिकाबद्ध विभव एक वोल्ट बदल जाता और हर नापी जा सकने वाली सेल वोल्टता ज्यों की त्यों रहती।",
          mr: "शून्याची निवड ही संकेतपद्धत आहे आणि ती कुठेही पडू शकली असती: तिला एक व्होल्टने सरकवल्याने प्रत्येक कोष्टकबद्ध विभव एक व्होल्टने बदलला असता आणि प्रत्येक मोजता येणारा घट व्होल्टेज जसाच्या तसा राहिला असता.",
        },
        extra: {
          en: "It is awkward in practice — the platinum is poisoned by traces of impurity and the gas pressure must be held steady — so working laboratories use a calomel electrode and convert, which is a reference to a reference.",
          hi: "व्यवहार में यह असुविधाजनक है — अशुद्धि के अंश से प्लैटिनम विषाक्त हो जाता है और गैस का दाब स्थिर रखना पड़ता है — अतः चलती प्रयोगशालाएँ कैलोमल इलेक्ट्रोड काम में लेकर बदल लेती हैं, जो संदर्भ का संदर्भ है।",
          mr: "व्यवहारात हे गैरसोयीचे आहे — अशुद्धीच्या अंशाने प्लॅटिनम विषारी होते आणि वायूचा दाब स्थिर ठेवावा लागतो — म्हणून चालत्या प्रयोगशाळा कॅलोमेल विद्युताग्र वापरून रूपांतर करतात, जो संदर्भाचा संदर्भ आहे.",
        },
        pair: {
          left: {
            en: "Zero by agreement, because only differences can be read",
            hi: "सहमति से शून्य, क्योंकि केवल अंतर ही पढ़े जा सकते हैं",
            mr: "संमतीने शून्य, कारण केवळ फरकच वाचता येतात",
          },
          right: {
            en: "the standard hydrogen electrode",
            hi: "मानक हाइड्रोजन इलेक्ट्रोड",
            mr: "प्रमाणित हायड्रोजन विद्युताग्र",
          },
        },
      },
      {
        id: "electrochemical-series",
        name: {
          en: "The electrochemical series",
          hi: "वैद्युतरासायनिक श्रेणी",
          mr: "विद्युतरासायनिक श्रेणी",
        },
        kind: "cell concept",
        prompt: {
          en: "A list of half-reactions ordered by their standard potentials, from which one can tell at a glance that zinc will displace copper from solution and that copper will not displace zinc. What is this list?",
          hi: "अर्ध-अभिक्रियाओं की ऐसी सूची जो उनके मानक विभवों से क्रमित है, जिससे एक नज़र में बताया जा सकता है कि ज़िंक विलयन से ताँबे को विस्थापित करेगा और ताँबा ज़िंक को नहीं। यह सूची क्या है?",
          mr: "अर्ध-अभिक्रियांची अशी यादी जी त्यांच्या प्रमाणित विभवांनी क्रमबद्ध आहे, जिच्यातून एका नजरेत सांगता येते की जस्त द्रावणातून तांबे विस्थापित करेल आणि तांबे जस्त करणार नाही. ही यादी काय आहे?",
        },
        statement: {
          en: "The electrochemical series arranges half-reactions by standard reduction potential, so a species higher in the table oxidises anything lower and is itself reduced.",
          hi: "वैद्युतरासायनिक श्रेणी अर्ध-अभिक्रियाओं को मानक अपचयन विभव से क्रमित करती है, अतः तालिका में ऊपर वाली स्पीशीज़ नीचे वाली किसी को भी उपचयित करती है और स्वयं अपचयित होती है।",
          mr: "विद्युतरासायनिक श्रेणी अर्ध-अभिक्रियांना प्रमाणित अपचयन विभवाने क्रमबद्ध करते, म्हणून कोष्टकात वरची जाती खालच्या कोणालाही उपचयित करते आणि स्वतः अपचयित होते.",
        },
        detail: {
          en: "It predicts only what CAN happen and never how fast: aluminium sits well above hydrogen and should dissolve vigorously in water, and does not, because an oxide film a few atoms thick stops it.",
          hi: "यह केवल यह बताती है कि क्या हो सकता है, यह कभी नहीं कि कितनी जल्दी: ऐलुमिनियम हाइड्रोजन से काफ़ी ऊपर है और उसे पानी में ज़ोर से घुलना चाहिए, और वह घुलता नहीं, क्योंकि कुछ परमाणु मोटी ऑक्साइड झिल्ली उसे रोक देती है।",
          mr: "ती केवळ हे सांगते की काय घडू शकते, हे कधीच नाही की किती लवकर: ॲल्युमिनियम हायड्रोजनहून बरेच वर आहे आणि त्याने पाण्यात जोराने विरघळावे, आणि ते विरघळत नाही, कारण काही अणू जाड ऑक्साइड पडदा त्याला थांबवतो.",
        },
        extra: {
          en: "The same ordering explains why a galvanised bucket survives a scratch: zinc is the more easily oxidised, so it corrodes in preference to the iron beneath and protects it even where the coating is broken.",
          hi: "वही क्रम समझाता है कि जस्तीकृत बाल्टी खरोंच के बाद भी क्यों टिकती है: ज़िंक अधिक आसानी से उपचयित होता है, अतः वह नीचे के लोहे की जगह ख़ुद संक्षारित होता है और परत टूटी हो वहाँ भी उसकी रक्षा करता है।",
          mr: "तोच क्रम समजावतो की गॅल्व्हनाइज केलेली बादली ओरखडा पडूनही का टिकते: जस्त अधिक सहज उपचयित होते, म्हणून ते खालच्या लोखंडाऐवजी स्वतः गंजते आणि थर तुटला असेल तिथेही त्याचे रक्षण करते.",
        },
        pair: {
          left: {
            en: "Says what can happen, never how fast",
            hi: "बताती है क्या हो सकता है, कभी नहीं कि कितनी जल्दी",
            mr: "सांगते काय घडू शकते, कधीच नाही की किती लवकर",
          },
          right: {
            en: "the electrochemical series",
            hi: "वैद्युतरासायनिक श्रेणी",
            mr: "विद्युतरासायनिक श्रेणी",
          },
        },
      },
      {
        id: "nernst-equation",
        name: {
          en: "The Nernst equation",
          hi: "नेर्न्स्ट समीकरण",
          mr: "नर्न्स्ट समीकरण",
        },
        kind: "quantitative relation",
        prompt: {
          en: "A fresh cell reads its full standard voltage; as it runs, the products build up and the reading falls, reaching exactly zero when the reaction has nothing left to gain. Which equation describes that fall?",
          hi: "ताज़ा सेल अपनी पूरी मानक वोल्टता दिखाता है; चलते-चलते उत्पाद जमा होते हैं और पाठ्यांक गिरता है, और ठीक शून्य पर पहुँचता है जब अभिक्रिया के पास पाने को कुछ न बचे। उस गिरावट का वर्णन कौन-सा समीकरण करता है?",
          mr: "ताजा घट आपला पूर्ण प्रमाणित व्होल्टेज दाखवतो; चालता चालता उत्पादने साठतात आणि वाचन घसरते, आणि नेमक्या शून्यावर पोहोचते जेव्हा अभिक्रियेकडे मिळवायला काहीच उरत नाही. त्या घसरणीचे वर्णन कोणते समीकरण करते?",
        },
        statement: {
          en: "The Nernst equation gives E = E° − (0.059/n) log Q at 298 K, so the cell voltage falls as products accumulate and becomes zero when Q reaches the equilibrium constant.",
          hi: "नेर्न्स्ट समीकरण 298 K पर E = E° − (0.059/n) log Q देता है, अतः उत्पाद जमा होते ही सेल वोल्टता गिरती है और तब शून्य हो जाती है जब Q साम्य स्थिरांक तक पहुँच जाए।",
          mr: "नर्न्स्ट समीकरण 298 K वर E = E° − (0.059/n) log Q देते, म्हणून उत्पादने साठताच घट व्होल्टेज घसरतो आणि तेव्हा शून्य होतो जेव्हा Q समतोल स्थिरांकापर्यंत पोहोचतो.",
        },
        detail: {
          en: "A dead battery is not one whose reaction has stopped but one that has reached equilibrium, where the forward and reverse rates are equal and there is no longer any free energy to be had.",
          hi: "मरी हुई बैटरी वह नहीं जिसकी अभिक्रिया रुक गई हो बल्कि वह जो साम्य तक पहुँच गई हो, जहाँ अग्र और प्रतीप दरें बराबर हैं और अब पाने को कोई मुक्त ऊर्जा नहीं।",
          mr: "मेलेली बॅटरी ती नव्हे जिची अभिक्रिया थांबली आहे तर ती जी समतोलापर्यंत पोहोचली आहे, जिथे अग्र आणि प्रतीप दर समान आहेत आणि आता मिळवायला कोणतीही मुक्त ऊर्जा नाही.",
        },
        extra: {
          en: "Setting E = 0 turns it into a way of measuring an equilibrium constant with a voltmeter, which is how some very large and very small K values are known at all.",
          hi: "E = 0 रखने पर वह वोल्टमापी से साम्य स्थिरांक नापने का रास्ता बन जाता है, और कुछ बहुत बड़े तथा बहुत छोटे K मान इसी तरह ज्ञात हैं।",
          mr: "E = 0 ठेवल्यास ते व्होल्टमापकाने समतोल स्थिरांक मोजण्याचा मार्ग बनते, आणि काही अतिशय मोठी तसेच अतिशय लहान K मूल्ये याच प्रकारे ज्ञात आहेत.",
        },
        pair: {
          left: {
            en: "A flat battery is one at equilibrium",
            hi: "बैठी हुई बैटरी वह है जो साम्य पर है",
            mr: "बसलेली बॅटरी ती जी समतोलावर आहे",
          },
          right: {
            en: "the Nernst equation",
            hi: "नेर्न्स्ट समीकरण",
            mr: "नर्न्स्ट समीकरण",
          },
        },
      },
      {
        id: "faradays-laws-electrolysis",
        name: {
          en: "Faraday's laws of electrolysis",
          hi: "फैराडे के विद्युत अपघटन नियम",
          mr: "फॅरेडेचे विद्युत अपघटन नियम",
        },
        kind: "quantitative relation",
        prompt: {
          en: "The mass deposited at an electrode is proportional to the charge passed, and for a given charge the masses of different metals stand in the ratio of their equivalent weights. Which laws are these?",
          hi: "इलेक्ट्रोड पर जमा द्रव्यमान बहाए गए आवेश का समानुपाती है, और दिए गए आवेश के लिए भिन्न धातुओं के द्रव्यमान उनके तुल्यांकी भारों के अनुपात में होते हैं। ये कौन-से नियम हैं?",
          mr: "विद्युताग्रावर जमलेले वस्तुमान वाहलेल्या प्रभाराशी समानुपाती आहे, आणि दिलेल्या प्रभारासाठी वेगवेगळ्या धातूंची वस्तुमाने त्यांच्या तुल्यांक भारांच्या गुणोत्तरात असतात. हे कोणते नियम?",
        },
        statement: {
          en: "Faraday's laws of electrolysis state that the amount deposited is proportional to the charge passed, one faraday of 96500 C depositing one mole of any singly charged species.",
          hi: "फैराडे के विद्युत अपघटन नियम कहते हैं कि जमी मात्रा बहाए गए आवेश की समानुपाती है, और 96500 C का एक फैराडे किसी भी एकल आवेशित स्पीशीज़ का एक मोल जमा देता है।",
          mr: "फॅरेडेचे विद्युत अपघटन नियम सांगतात की जमलेले प्रमाण वाहलेल्या प्रभाराशी समानुपाती आहे, आणि 96500 C चा एक फॅरेडे कोणत्याही एकल प्रभारित जातीचा एक मोल जमवतो.",
        },
        detail: {
          en: "The faraday is nothing but Avogadro's number of electronic charges, so the laws are a statement that electrolysis counts electrons one at a time and that charge itself is quantised.",
          hi: "फैराडे इलेक्ट्रॉनिक आवेशों की आवोगाद्रो संख्या के सिवा कुछ नहीं, अतः ये नियम यह कथन हैं कि विद्युत अपघटन इलेक्ट्रॉनों को एक-एक करके गिनता है और आवेश स्वयं क्वांटमित है।",
          mr: "फॅरेडे म्हणजे इलेक्ट्रॉनिक प्रभारांच्या ॲव्होगाड्रो संख्येखेरीज काहीच नाही, म्हणून हे नियम असे विधान आहेत की विद्युत अपघटन इलेक्ट्रॉन एकेक करून मोजते आणि प्रभार स्वतः पुंजित आहे.",
        },
        extra: {
          en: "The charge on the ion divides the mole: one faraday gives a whole mole of silver but only half a mole of copper and a third of a mole of aluminium, since each of those needs more electrons per atom.",
          hi: "आयन का आवेश मोल को बाँट देता है: एक फैराडे चाँदी का पूरा मोल देता है पर ताँबे का केवल आधा मोल और ऐलुमिनियम का एक-तिहाई, क्योंकि उनमें से हर एक को प्रति परमाणु अधिक इलेक्ट्रॉन चाहिए।",
          mr: "आयनाचा प्रभार मोल विभागतो: एक फॅरेडे चांदीचा पूर्ण मोल देतो पण तांब्याचा केवळ अर्धा मोल आणि ॲल्युमिनियमचा एक-तृतीयांश, कारण त्यांतल्या प्रत्येकाला प्रति अणू अधिक इलेक्ट्रॉन लागतात.",
        },
        pair: {
          left: {
            en: "A coulomb is a counted number of electrons",
            hi: "कूलॉम इलेक्ट्रॉनों की गिनी हुई संख्या है",
            mr: "कुलोम म्हणजे इलेक्ट्रॉनांची मोजलेली संख्या",
          },
          right: {
            en: "Faraday's laws of electrolysis",
            hi: "फैराडे के विद्युत अपघटन नियम",
            mr: "फॅरेडेचे विद्युत अपघटन नियम",
          },
        },
      },
      {
        id: "molar-conductivity",
        name: {
          en: "Molar conductivity",
          hi: "मोलर चालकता",
          mr: "मोलर वाहकता",
        },
        kind: "quantitative relation",
        prompt: {
          en: "Divide the conductivity by the concentration and you get a quantity that RISES on dilution — steadily and slightly for potassium chloride, and steeply and without limit for acetic acid. Which quantity is this?",
          hi: "चालकता को सांद्रता से भाग दो और ऐसी राशि मिलती है जो तनुकरण पर बढ़ती है — पोटैशियम क्लोराइड के लिए धीरे-धीरे और थोड़ा, और ऐसीटिक अम्ल के लिए तेज़ी से और बिना सीमा। यह कौन-सी राशि है?",
          mr: "वाहकतेला संहतीने भागा आणि अशी राशी मिळते जी विरळीकरणावर वाढते — पोटॅशियम क्लोराइडसाठी हळूहळू आणि थोडी, आणि ॲसिटिक आम्लासाठी झपाट्याने आणि मर्यादेविना. ही कोणती राशी?",
        },
        statement: {
          en: "Molar conductivity is Λ_m = κ/c, the conducting power of all the ions from one mole of electrolyte, and it increases as the solution is diluted.",
          hi: "मोलर चालकता Λ_m = κ/c है, अर्थात् विद्युत अपघट्य के एक मोल से आए सारे आयनों की चालन शक्ति, और विलयन तनु करने पर वह बढ़ती है।",
          mr: "मोलर वाहकता म्हणजे Λ_m = κ/c, म्हणजे विद्युत अपघटनीच्या एका मोलमधून आलेल्या सर्व आयनांची वहन शक्ती, आणि द्रावण विरळ केल्यावर ती वाढते.",
        },
        detail: {
          en: "The rise means opposite things in the two cases: for a strong electrolyte the ions were always all there and are merely getting out of each other's way, while for a weak one more molecules are actually dissociating.",
          hi: "दोनों स्थितियों में वृद्धि का अर्थ उलटा है: प्रबल विद्युत अपघट्य में आयन सदा सब मौजूद थे और वे बस एक-दूसरे के रास्ते से हट रहे हैं, जबकि दुर्बल में वस्तुतः अधिक अणु वियोजित हो रहे हैं।",
          mr: "दोन्ही स्थितींत वाढीचा अर्थ उलटा आहे: तीव्र विद्युत अपघटनीत आयन नेहमी सर्व उपस्थित होते आणि ते फक्त एकमेकांच्या वाटेतून बाजूला होत आहेत, तर दुर्बलात प्रत्यक्षात अधिक रेणू विघटित होत आहेत.",
        },
        extra: {
          en: "The limiting value at infinite dilution can be read off a graph for a strong electrolyte but never for a weak one, whose curve is still climbing steeply where the measurements run out — which is what Kohlrausch's law exists to supply.",
          hi: "अनंत तनुता पर सीमांत मान प्रबल विद्युत अपघट्य के लिए ग्राफ़ से पढ़ा जा सकता है पर दुर्बल के लिए कभी नहीं, जिसका वक्र वहीं तेज़ी से चढ़ रहा होता है जहाँ माप ख़त्म हो जाते हैं — और कोह्लराउश का नियम उसी को देने के लिए है।",
          mr: "अनंत विरळतेवरचे सीमांत मूल्य तीव्र विद्युत अपघटनीसाठी आलेखावरून वाचता येते पण दुर्बलासाठी कधीच नाही, ज्याचा वक्र तिथेच झपाट्याने चढत असतो जिथे मापे संपतात — आणि कोहलराउशचा नियम तेच देण्यासाठी आहे.",
        },
        pair: {
          left: {
            en: "Rises on dilution for two opposite reasons",
            hi: "तनुकरण पर दो उलटे कारणों से बढ़ती है",
            mr: "विरळीकरणावर दोन उलट कारणांनी वाढते",
          },
          right: {
            en: "molar conductivity",
            hi: "मोलर चालकता",
            mr: "मोलर वाहकता",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "A student asks why the standard hydrogen electrode is 'defined' to be zero rather than measured, and whether the whole table of electrode potentials is therefore arbitrary. Answer both parts.",
          hi: "एक विद्यार्थी पूछता है कि मानक हाइड्रोजन इलेक्ट्रोड को शून्य नापने के बजाय 'परिभाषित' क्यों किया जाता है, और क्या इसलिए इलेक्ट्रोड विभवों की पूरी तालिका मनमानी है। दोनों भागों का उत्तर दो।",
          mr: "एक विद्यार्थी विचारतो की प्रमाणित हायड्रोजन विद्युताग्राला शून्य मोजण्याऐवजी 'व्याख्यायित' का केले जाते, आणि म्हणून विद्युताग्र विभवांचे अख्खे कोष्टक मनमानी आहे का. दोन्ही भागांचे उत्तर द्या.",
        },
        choices: [
          {
            en: "A single electrode potential cannot be measured because measuring means connecting a voltmeter, and the second lead is itself another electrode — any reading is always the DIFFERENCE between two half-cells. So one must be chosen as the origin, and hydrogen was chosen. The convention is arbitrary in the same way sea level is: shift it by a volt and every tabulated potential shifts by a volt while every measurable cell voltage stays identical. What is not arbitrary is the ORDER and the SPACING of the entries, which are experimental facts and are what the table is actually used for",
            hi: "किसी अकेले इलेक्ट्रोड का विभव नापा नहीं जा सकता क्योंकि नापने का अर्थ है वोल्टमापी जोड़ना, और दूसरा तार स्वयं एक और इलेक्ट्रोड है — कोई भी पाठ्यांक सदा दो अर्ध-सेलों का अंतर होता है। अतः किसी एक को मूल बिंदु चुनना ही पड़ता है, और हाइड्रोजन चुना गया। परिपाटी उसी अर्थ में मनमानी है जिसमें समुद्र-तल: उसे एक वोल्ट खिसकाओ और हर तालिकाबद्ध विभव एक वोल्ट खिसक जाता है जबकि हर नापी जा सकने वाली सेल वोल्टता समरूप रहती है। जो मनमाना नहीं वह प्रविष्टियों का क्रम और उनका अंतराल है, जो प्रायोगिक तथ्य हैं और तालिका वस्तुतः जिनके लिए काम आती है",
            mr: "कोणत्याही एकट्या विद्युताग्राचा विभव मोजता येत नाही कारण मोजणे म्हणजे व्होल्टमापक जोडणे, आणि दुसरी तार स्वतः आणखी एक विद्युताग्र आहे — कोणतेही वाचन नेहमी दोन अर्ध-घटांचा फरक असते. म्हणून एकाला मूळबिंदू निवडावेच लागते, आणि हायड्रोजन निवडला गेला. संकेतपद्धत त्याच अर्थाने मनमानी आहे ज्या अर्थाने समुद्र-पातळी: तिला एक व्होल्टने सरकवा आणि प्रत्येक कोष्टकबद्ध विभव एक व्होल्टने सरकतो तर प्रत्येक मोजता येणारा घट व्होल्टेज सारखाच राहतो. जे मनमानी नाही ते नोंदींचा क्रम आणि त्यांचे अंतर, जे प्रायोगिक सत्ये आहेत आणि कोष्टक प्रत्यक्षात ज्यांसाठी वापरले जाते",
          },
          {
            en: "Hydrogen is defined as zero because its electrode genuinely has no potential, being the lightest element and having no tendency either to gain or to lose electrons",
            hi: "हाइड्रोजन को शून्य इसलिए परिभाषित किया गया कि उसके इलेक्ट्रोड का सचमुच कोई विभव नहीं, क्योंकि वह सबसे हल्का तत्व है और उसमें इलेक्ट्रॉन पाने या खोने की कोई प्रवृत्ति नहीं",
            mr: "हायड्रोजनला शून्य यासाठी व्याख्यायित केले की त्याच्या विद्युताग्राला खरोखर कोणताही विभव नाही, कारण तो सर्वांत हलका मूलद्रव्य आहे आणि त्याच्यात इलेक्ट्रॉन मिळवण्याची वा गमावण्याची कोणतीही प्रवृत्ती नाही",
          },
          {
            en: "The table is indeed arbitrary and its predictions are conventions rather than facts, which is why different textbooks give different signs for the same half-reaction",
            hi: "तालिका सचमुच मनमानी है और उसकी भविष्यवाणियाँ तथ्य नहीं बल्कि परिपाटियाँ हैं, इसीलिए अलग-अलग पाठ्यपुस्तकें एक ही अर्ध-अभिक्रिया के लिए भिन्न चिह्न देती हैं",
            mr: "कोष्टक खरोखर मनमानी आहे आणि त्याची भाकिते सत्ये नसून संकेत आहेत, म्हणूनच वेगवेगळी पाठ्यपुस्तके एकाच अर्ध-अभिक्रियेसाठी वेगळी चिन्हे देतात",
          },
          {
            en: "Single electrode potentials can be measured directly with a sensitive enough voltmeter, and the hydrogen electrode is used only because it is convenient and cheap",
            hi: "पर्याप्त संवेदनशील वोल्टमापी से अकेले इलेक्ट्रोड के विभव सीधे नापे जा सकते हैं, और हाइड्रोजन इलेक्ट्रोड केवल इसलिए काम आता है कि वह सुविधाजनक और सस्ता है",
            mr: "पुरेशा संवेदनशील व्होल्टमापकाने एकट्या विद्युताग्राचे विभव थेट मोजता येतात, आणि हायड्रोजन विद्युताग्र केवळ यासाठी वापरला जातो की तो सोयीचा आणि स्वस्त आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "There are two questions here and they have different answers, so it is worth separating them before either is answered. WHY IT CANNOT BE MEASURED. Think about what measuring a potential involves. A voltmeter has two leads, and both have to go somewhere. Put one in the solution beside the zinc and the other has to be in a solution too — and the moment it touches an electrolyte, a second electrode has been created, with a potential of its own that the meter cannot separate from the first. There is no arrangement in which only one metal–solution interface exists in the circuit. Every possible measurement is therefore a comparison, and 'the potential of the zinc electrode' is not a quantity any experiment can return. This is not a limitation of instruments. It is the same structure as electrical potential itself in Class 12 physics, where only differences are measurable and the zero is put at infinity or at earth by choice; or as altitude, where the sea is chosen as the datum and no measurement can find 'the true height above nothing'. WHY THE TABLE IS NOT THEREBY ARBITRARY. Because what the table is used for survives the choice completely. Suppose the convention were changed and hydrogen assigned +1.00 V instead of zero. Then copper's +0.34 would become +1.34, zinc's −0.76 would become +0.24, and every entry would shift by the same volt. Now compute a cell: E°cell = E°cathode − E°anode. Under the old convention, 0.34 − (−0.76) = 1.10 V. Under the new one, 1.34 − 0.24 = 1.10 V. Identical, because the shift cancels in every subtraction. Every prediction the table makes is of this form, so nothing measurable depends on where the zero sits. What the table genuinely contains is the ORDER of the entries and the GAPS between them, and those are experimental. That zinc lies below copper is a fact about which metal displaces which from solution, checked by dropping zinc into copper sulphate and watching it happen. That the gap is 1.10 V and not 0.5 V is a fact about how much energy the reaction can deliver per coulomb, checked with a voltmeter. Neither is a matter of convention. The practical yield is large. From about fifty tabulated half-reactions one can predict the voltage and the direction of every one of the thousand-odd cells that can be built by pairing them, without doing any of those experiments — which is exactly the economy a good table of standard values buys. One caution belongs with it, and it is the one students most often forget: the table is thermodynamic and says nothing about rate. Aluminium sits well above hydrogen and 'should' fizz vigorously in water; it does not, because an oxide layer a few atoms thick seals it. A prediction from the series is a statement about which way the reaction would go if it went at all. (The second option confuses a defined zero with a physically absent quantity; the third mistakes the arbitrariness of the origin for arbitrariness of the differences, and asserts a textbook disagreement that does not exist once the sign convention for reduction potentials is fixed; the fourth denies the measurement problem that makes the convention necessary in the first place.)",
          hi: "यहाँ दो प्रश्न हैं और उनके उत्तर भिन्न हैं, अतः किसी का उत्तर देने से पहले उन्हें अलग करना चाहिए। यह नापा क्यों नहीं जा सकता। सोचो कि विभव नापने में क्या लगता है। वोल्टमापी के दो तार हैं, और दोनों को कहीं न कहीं जाना है। एक को ज़िंक के पास विलयन में डालो और दूसरे को भी किसी विलयन में होना पड़ेगा — और जिस क्षण वह किसी विद्युत अपघट्य को छूता है, एक दूसरा इलेक्ट्रोड बन जाता है, जिसका अपना विभव है और जिसे मापी पहले से अलग नहीं कर सकता। ऐसी कोई व्यवस्था नहीं जिसमें परिपथ में केवल एक धातु–विलयन अंतरापृष्ठ हो। अतः हर संभव माप एक तुलना है, और 'ज़िंक इलेक्ट्रोड का विभव' ऐसी राशि नहीं जो कोई प्रयोग लौटा सके। यह यंत्रों की सीमा नहीं। यह वही संरचना है जो कक्षा 12 भौतिकी में स्वयं विद्युत विभव की है, जहाँ केवल अंतर नापे जा सकते हैं और शून्य अनंत पर या पृथ्वी पर चुनाव से रखा जाता है; या ऊँचाई की, जहाँ समुद्र को आधार चुना जाता है और कोई माप 'शून्य से सच्ची ऊँचाई' नहीं खोज सकता। तालिका इसलिए मनमानी क्यों नहीं। क्योंकि तालिका जिसके लिए काम आती है वह इस चुनाव को पूरी तरह झेल जाता है। मानो परिपाटी बदल दी जाए और हाइड्रोजन को शून्य के बजाय +1.00 V दिया जाए। तब ताँबे का +0.34, +1.34 हो जाता, ज़िंक का −0.76, +0.24, और हर प्रविष्टि उसी एक वोल्ट से खिसक जाती। अब सेल निकालो: E°सेल = E°कैथोड − E°ऐनोड. पुरानी परिपाटी में, 0.34 − (−0.76) = 1.10 V. नई में, 1.34 − 0.24 = 1.10 V. समरूप, क्योंकि खिसकाव हर घटाव में कट जाता है। तालिका की हर भविष्यवाणी इसी रूप की है, अतः नापी जा सकने वाली कोई चीज़ इस पर निर्भर नहीं कि शून्य कहाँ बैठा है। तालिका में सचमुच जो है वह प्रविष्टियों का क्रम और उनके बीच के अंतराल हैं, और वे प्रायोगिक हैं। ज़िंक का ताँबे से नीचे होना इस बारे में तथ्य है कि कौन-सी धातु किसे विलयन से विस्थापित करती है, और वह ज़िंक को कॉपर सल्फ़ेट में डालकर होते देखकर जाँचा जाता है। अंतर 1.10 V है और 0.5 V नहीं, यह इस बारे में तथ्य है कि अभिक्रिया प्रति कूलॉम कितनी ऊर्जा दे सकती है, और वह वोल्टमापी से जाँचा जाता है। दोनों में से कोई परिपाटी का मामला नहीं। व्यावहारिक लाभ बड़ा है। लगभग पचास तालिकाबद्ध अर्ध-अभिक्रियाओं से उन हज़ार से अधिक सेलों में से हर एक की वोल्टता और दिशा बताई जा सकती है जो उन्हें जोड़कर बनाए जा सकते हैं, उनमें से कोई प्रयोग किए बिना — मानक मानों की अच्छी तालिका ठीक यही किफ़ायत ख़रीदती है। एक चेतावनी उसके साथ जुड़ी है, और वही विद्यार्थी सबसे अधिक भूलते हैं: तालिका ऊष्मागतिक है और दर के बारे में कुछ नहीं कहती। ऐलुमिनियम हाइड्रोजन से काफ़ी ऊपर है और उसे पानी में ज़ोर से बुलबुले छोड़ने 'चाहिए'; वह नहीं छोड़ता, क्योंकि कुछ परमाणु मोटी ऑक्साइड परत उसे सील कर देती है। श्रेणी से की गई भविष्यवाणी इस बारे में कथन है कि अभिक्रिया अगर चले तो किस ओर चलेगी। (दूसरा विकल्प परिभाषित शून्य को भौतिक रूप से अनुपस्थित राशि समझ लेता है; तीसरा मूल बिंदु की मनमानी को अंतरों की मनमानी समझ लेता है, और पाठ्यपुस्तकों में ऐसी असहमति ठहराता है जो अपचयन विभवों की चिह्न-परिपाटी तय होते ही नहीं रहती; चौथा उसी माप-समस्या से इनकार करता है जो परिपाटी को पहले स्थान पर आवश्यक बनाती है।)",
          mr: "इथे दोन प्रश्न आहेत आणि त्यांची उत्तरे वेगळी आहेत, म्हणून कोणाचेही उत्तर देण्याआधी त्यांना वेगळे करायला हवे. हे का मोजता येत नाही. विभव मोजण्यात काय लागते याचा विचार करा. व्होल्टमापकाला दोन तारा आहेत, आणि दोन्हींना कुठेतरी जावे लागते. एक जस्ताजवळ द्रावणात घाला आणि दुसरीलाही कोणत्यातरी द्रावणात असावे लागेल — आणि ज्या क्षणी ती एखाद्या विद्युत अपघटनीला स्पर्श करते, दुसरा विद्युताग्र तयार होतो, ज्याचा स्वतःचा विभव आहे आणि जो मापक पहिल्यापासून वेगळा करू शकत नाही. अशी कोणतीही मांडणी नाही ज्यात परिपथात केवळ एक धातू–द्रावण आंतरपृष्ठ असेल. म्हणून प्रत्येक शक्य माप ही तुलना आहे, आणि 'जस्त विद्युताग्राचा विभव' ही अशी राशी नाही जी कोणताही प्रयोग परत करू शकेल. ही उपकरणांची मर्यादा नाही. हीच रचना इयत्ता 12 भौतिकीत स्वतः विद्युत विभवाची आहे, जिथे केवळ फरक मोजता येतात आणि शून्य अनंतावर वा पृथ्वीवर निवडीने ठेवला जातो; वा उंचीची, जिथे समुद्राला आधार निवडला जातो आणि कोणतेही माप 'शून्याहून खरी उंची' शोधू शकत नाही. कोष्टक म्हणून मनमानी का नाही. कारण कोष्टक ज्यासाठी वापरले जाते ते ही निवड पूर्णपणे सोसते. समजा संकेत बदलला आणि हायड्रोजनला शून्याऐवजी +1.00 V दिला. तर तांब्याचा +0.34 हा +1.34 झाला असता, जस्ताचा −0.76 हा +0.24, आणि प्रत्येक नोंद त्याच एका व्होल्टने सरकली असती. आता घट काढा: E°घट = E°कॅथोड − E°अ‍ॅनोड. जुन्या संकेतात, 0.34 − (−0.76) = 1.10 V. नव्यात, 1.34 − 0.24 = 1.10 V. सारखेच, कारण सरकाव प्रत्येक वजाबाकीत कापला जातो. कोष्टकाचे प्रत्येक भाकीत याच स्वरूपाचे आहे, म्हणून मोजता येणारी कोणतीही गोष्ट शून्य कुठे बसला यावर अवलंबून नाही. कोष्टकात खरोखर जे आहे ते नोंदींचा क्रम आणि त्यांच्यातील अंतरे, आणि ती प्रायोगिक आहेत. जस्त तांब्याहून खाली असणे हे कोणती धातू कोणाला द्रावणातून विस्थापित करते याबद्दलचे सत्य आहे, आणि ते जस्त कॉपर सल्फेटमध्ये टाकून घडताना पाहून तपासले जाते. फरक 1.10 V आहे आणि 0.5 V नाही, हे अभिक्रिया प्रति कुलोम किती ऊर्जा देऊ शकते याबद्दलचे सत्य आहे, आणि ते व्होल्टमापकाने तपासले जाते. दोहोंपैकी कोणतीही संकेताची बाब नाही. व्यावहारिक लाभ मोठा आहे. सुमारे पन्नास कोष्टकबद्ध अर्ध-अभिक्रियांतून त्या हजाराहून अधिक घटांपैकी प्रत्येकाचा व्होल्टेज आणि दिशा सांगता येते जे त्यांना जोडून बनवता येतील, त्यांपैकी कोणताही प्रयोग न करता — प्रमाणित मूल्यांचे चांगले कोष्टक नेमकी हीच काटकसर विकत घेते. एक इशारा त्यासोबत जोडलेला आहे, आणि तोच विद्यार्थी सर्वांत जास्त विसरतात: कोष्टक उष्मागतिक आहे आणि दराबद्दल काहीही सांगत नाही. ॲल्युमिनियम हायड्रोजनहून बरेच वर आहे आणि त्याने पाण्यात जोराने बुडबुडे सोडावेत; ते सोडत नाही, कारण काही अणू जाड ऑक्साइड थर त्याला सीलबंद करतो. श्रेणीवरून केलेले भाकीत अभिक्रिया चालली तर कोणत्या दिशेने चालेल याबद्दलचे विधान आहे. (दुसरा पर्याय व्याख्यायित शून्याला भौतिकदृष्ट्या अनुपस्थित राशी समजतो; तिसरा मूळबिंदूच्या मनमानीला फरकांची मनमानी समजतो, आणि पाठ्यपुस्तकांत अशी असहमती ठरवतो जी अपचयन विभवांची चिन्ह-संकेतपद्धत ठरताच उरत नाही; चौथा तीच माप-समस्या नाकारतो जी संकेतपद्धत मुळात आवश्यक करते.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Molar conductivity rises on dilution for both potassium chloride and acetic acid, but the graphs look completely different — one flattens to a clear limit, the other keeps climbing steeply. Explain both, and say how the limiting value for acetic acid is obtained at all.",
          hi: "मोलर चालकता पोटैशियम क्लोराइड और ऐसीटिक अम्ल दोनों के लिए तनुकरण पर बढ़ती है, पर ग्राफ़ बिलकुल भिन्न दिखते हैं — एक साफ़ सीमा पर सपाट हो जाता है, दूसरा तेज़ी से चढ़ता ही रहता है। दोनों समझाओ, और बताओ कि ऐसीटिक अम्ल का सीमांत मान मिलता कैसे है।",
          mr: "मोलर वाहकता पोटॅशियम क्लोराइड आणि ॲसिटिक आम्ल दोघांसाठी विरळीकरणावर वाढते, पण आलेख पूर्णपणे वेगळे दिसतात — एक स्पष्ट मर्यादेवर सपाट होतो, दुसरा झपाट्याने चढतच राहतो. दोन्ही समजावा, आणि ॲसिटिक आम्लाचे सीमांत मूल्य मुळात कसे मिळते ते सांगा.",
        },
        choices: [
          {
            en: "For a strong electrolyte all the ions are present at every concentration, and the rise on dilution is only because they stop interfering with each other's motion — a small effect that saturates, so the graph flattens and Λ°m can be read off directly. For a weak electrolyte the NUMBER of ions is itself changing: dilution shifts the dissociation equilibrium and more molecules break up, so the curve keeps climbing and never levels within measurable range. Λ°m is then obtained from Kohlrausch's law by adding and subtracting the limiting conductivities of strong electrolytes containing the same ions",
            hi: "प्रबल विद्युत अपघट्य में हर सांद्रता पर सारे आयन मौजूद हैं, और तनुकरण पर वृद्धि केवल इसलिए है कि वे एक-दूसरे की गति में दख़ल देना बंद कर देते हैं — छोटा प्रभाव जो संतृप्त हो जाता है, अतः ग्राफ़ सपाट होता है और Λ°m सीधे पढ़ा जा सकता है। दुर्बल विद्युत अपघट्य में आयनों की संख्या ही बदल रही है: तनुकरण वियोजन साम्य को खिसकाता है और अधिक अणु टूटते हैं, अतः वक्र चढ़ता ही रहता है और नापी जा सकने वाली परास में कभी समतल नहीं होता। तब Λ°m कोह्लराउश के नियम से मिलता है, उन्हीं आयनों वाले प्रबल विद्युत अपघट्यों की सीमांत चालकताएँ जोड़-घटाकर",
            mr: "तीव्र विद्युत अपघटनीत प्रत्येक संहतीवर सर्व आयन उपस्थित आहेत, आणि विरळीकरणावरची वाढ केवळ यासाठी की ते एकमेकांच्या गतीत ढवळाढवळ करणे थांबवतात — लहान परिणाम जो संपृक्त होतो, म्हणून आलेख सपाट होतो आणि Λ°m थेट वाचता येते. दुर्बल विद्युत अपघटनीत आयनांची संख्याच बदलत आहे: विरळीकरण विघटन समतोल सरकवते आणि अधिक रेणू तुटतात, म्हणून वक्र चढतच राहतो आणि मोजता येणाऱ्या पल्ल्यात कधीच सपाट होत नाही. मग Λ°m कोहलराउशच्या नियमाने मिळते, त्याच आयनांच्या तीव्र विद्युत अपघटनींच्या सीमांत वाहकता जोडून-वजा करून",
          },
          {
            en: "Both graphs are really the same shape, and acetic acid only appears different because its conductivity is so much smaller that the flattening is hidden by experimental scatter",
            hi: "दोनों ग्राफ़ वस्तुतः एक ही आकार के हैं, और ऐसीटिक अम्ल केवल इसलिए भिन्न लगता है कि उसकी चालकता इतनी छोटी है कि सपाट होना प्रायोगिक बिखराव में छिप जाता है",
            mr: "दोन्ही आलेख प्रत्यक्षात एकाच आकाराचे आहेत, आणि ॲसिटिक आम्ल केवळ यासाठी वेगळे वाटते की त्याची वाहकता इतकी लहान आहे की सपाट होणे प्रायोगिक विखुरण्यात लपते",
          },
          {
            en: "Acetic acid keeps climbing because acetate ions are larger and slower than chloride ions, so they take longer to reach their maximum mobility as the solution thins",
            hi: "ऐसीटिक अम्ल इसलिए चढ़ता रहता है कि ऐसीटेट आयन क्लोराइड आयनों से बड़े और धीमे हैं, अतः विलयन पतला होते समय उन्हें अपनी अधिकतम गतिशीलता तक पहुँचने में अधिक समय लगता है",
            mr: "ॲसिटिक आम्ल यासाठी चढतच राहते की ॲसिटेट आयन क्लोराइड आयनांहून मोठे आणि सावकाश आहेत, म्हणून द्रावण पातळ होताना त्यांना आपल्या कमाल गतिशीलतेपर्यंत पोहोचायला अधिक वेळ लागतो",
          },
          {
            en: "The limiting value for a weak electrolyte simply cannot be obtained by any method, which is why weak acids are always characterised by their pH instead",
            hi: "दुर्बल विद्युत अपघट्य का सीमांत मान किसी भी विधि से मिल ही नहीं सकता, इसीलिए दुर्बल अम्लों को सदा उनके pH से ही चिह्नित किया जाता है",
            mr: "दुर्बल विद्युत अपघटनीचे सीमांत मूल्य कोणत्याही पद्धतीने मिळूच शकत नाही, म्हणूनच दुर्बल आम्ले नेहमी त्यांच्या pH नेच ओळखली जातात",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The two curves look different because two different things are changing, and separating them is the whole content of the question. Start with what molar conductivity is. Λ_m = κ/c divides the measured conductivity by the concentration, so it asks: how well do all the ions that ONE MOLE of this substance can supply conduct, when they are spread through however much solvent it takes? Written that way, the quantity has two ingredients — how many ions there actually are, and how freely each of them moves. Dilution can change either. STRONG ELECTROLYTE. Potassium chloride is fully ionised at every concentration; there are no KCl molecules in the solution to break up. So the first ingredient is fixed at two moles of ions per mole of salt, always. What changes is the second. In a concentrated solution each ion is surrounded by a cloud of oppositely charged neighbours which drags on it as it moves, and there are two named effects — the ionic atmosphere being dragged the wrong way and the solvent flow it carries with it. Dilute the solution and the neighbours get further away, the drag falls, and the mobility rises. But there is a limit: once the ions are far enough apart to ignore each other completely, no further dilution helps. So Λ_m climbs and then flattens, and the flat part is Λ°m, read straight off the graph. The rise from a moderate concentration to infinite dilution is typically only a few per cent. WEAK ELECTROLYTE. Acetic acid at 0.1 M is about 1 per cent dissociated. The overwhelming majority of it is present as intact CH₃COOH molecules, which conduct nothing. Now dilute it. The dissociation equilibrium CH₃COOH ⇌ CH₃COO⁻ + H⁺ responds to the increase in volume by shifting towards the side with more particles, so the degree of dissociation climbs — 1 per cent, then 3, then 10, and towards 100 per cent as the dilution goes to infinity. The number of ions per mole of acid is therefore rising steeply, and that swamps the small mobility effect entirely. The curve keeps climbing, and at the most dilute solution anyone can measure reliably the acid is still only partly dissociated. The flat part exists in principle but lies at concentrations where the conductivity of the water itself is comparable with that of the acid. HOW Λ°m IS OBTAINED ANYWAY. Kohlrausch's law of independent migration says that at infinite dilution each ion contributes its own fixed amount regardless of what it came in with, because the ions are then too far apart to affect one another. So Λ°m for a substance is the sum of the limiting conductivities of its ions, and those can be assembled from strong electrolytes whose graphs do flatten. For acetic acid: take Λ°m of HCl, add Λ°m of sodium acetate, subtract Λ°m of NaCl. Every ion balances except H⁺ and CH₃COO⁻, so what is left is exactly Λ°m of acetic acid. Nothing has been measured on acetic acid at all beyond ordinary concentrations. This is worth admiring as a method rather than just learning as a formula: a quantity defined at a limit that cannot be reached experimentally has been obtained exactly, by arranging three measurable quantities so that the unreachable parts cancel. The payoff is immediate — the degree of dissociation at any concentration is α = Λ_m/Λ°m, and from it the dissociation constant K_a, which is how the strength of a weak acid is measured with a conductivity cell. (The second option attributes a real structural difference to noise; the third cites an ion-size effect that is real but far too small and does not explain the absence of a plateau; the fourth denies a standard and elegant method.)",
          hi: "दोनों वक्र भिन्न इसलिए दिखते हैं कि दो भिन्न चीज़ें बदल रही हैं, और उन्हें अलग करना ही प्रश्न का पूरा सार है। पहले लो कि मोलर चालकता है क्या। Λ_m = κ/c नापी गई चालकता को सांद्रता से भाग देता है, अतः वह पूछता है: इस पदार्थ का एक मोल जितने आयन दे सकता है, वे सब कितना अच्छा चालन करते हैं, जब वे जितना भी विलायक लगे उतने में फैले हों? यों लिखने पर राशि के दो अवयव हैं — आयन वस्तुतः कितने हैं, और उनमें से हर एक कितनी स्वतंत्रता से चलता है। तनुकरण दोनों में से किसी को बदल सकता है। प्रबल विद्युत अपघट्य। पोटैशियम क्लोराइड हर सांद्रता पर पूरी तरह आयनित है; विलयन में टूटने को कोई KCl अणु है ही नहीं। अतः पहला अवयव प्रति मोल नमक दो मोल आयन पर नियत है, सदा। जो बदलता है वह दूसरा है। सांद्र विलयन में हर आयन विपरीत आवेशित पड़ोसियों के बादल से घिरा है जो उसके चलते समय उस पर घसीट डालता है, और दो नामित प्रभाव हैं — आयनिक वायुमंडल का ग़लत दिशा में खिंचना और उसके साथ चलता विलायक प्रवाह। विलयन तनु करो और पड़ोसी दूर हट जाते हैं, घसीट घटती है, और गतिशीलता बढ़ती है। पर एक सीमा है: एक बार आयन इतने दूर हो जाएँ कि एक-दूसरे को पूरी तरह अनदेखा कर सकें, तो आगे तनुकरण से मदद नहीं मिलती। अतः Λ_m चढ़ता है और फिर सपाट हो जाता है, और सपाट भाग ही Λ°m है, सीधे ग्राफ़ से पढ़ा हुआ। मध्यम सांद्रता से अनंत तनुता तक की वृद्धि प्रायः कुछ ही प्रतिशत होती है। दुर्बल विद्युत अपघट्य। 0.1 M पर ऐसीटिक अम्ल लगभग 1 प्रतिशत वियोजित है। उसका अत्यधिक बड़ा भाग सलामत CH₃COOH अणुओं के रूप में मौजूद है, जो कुछ भी चालन नहीं करते। अब उसे तनु करो। वियोजन साम्य CH₃COOH ⇌ CH₃COO⁻ + H⁺ आयतन की वृद्धि पर अधिक कणों वाली ओर खिसककर उत्तर देता है, अतः वियोजन की मात्रा चढ़ती है — 1 प्रतिशत, फिर 3, फिर 10, और तनुता अनंत होते-होते 100 प्रतिशत की ओर। अतः प्रति मोल अम्ल आयनों की संख्या तेज़ी से बढ़ रही है, और वह छोटे गतिशीलता प्रभाव को पूरी तरह डुबो देती है। वक्र चढ़ता ही रहता है, और जितने तनु विलयन को कोई भरोसे से नाप सकता है वहाँ भी अम्ल अब भी केवल आंशिक रूप से वियोजित है। सपाट भाग सिद्धांततः है पर वह उन सांद्रताओं पर पड़ता है जहाँ स्वयं पानी की चालकता अम्ल की चालकता के दर्जे की है। फिर भी Λ°m मिलता कैसे है। कोह्लराउश का स्वतंत्र प्रवास नियम कहता है कि अनंत तनुता पर हर आयन अपना नियत अंश देता है, चाहे वह जिसके साथ आया हो, क्योंकि तब आयन एक-दूसरे को प्रभावित करने के लिए बहुत दूर हैं। अतः किसी पदार्थ का Λ°m उसके आयनों की सीमांत चालकताओं का योग है, और वे उन प्रबल विद्युत अपघट्यों से जुटाई जा सकती हैं जिनके ग्राफ़ सपाट होते ही हैं। ऐसीटिक अम्ल के लिए: HCl का Λ°m लो, सोडियम ऐसीटेट का Λ°m जोड़ो, NaCl का Λ°m घटाओ। H⁺ और CH₃COO⁻ के सिवा हर आयन कट जाता है, अतः जो बचता है वह ठीक ऐसीटिक अम्ल का Λ°m है। ऐसीटिक अम्ल पर साधारण सांद्रताओं से आगे कुछ नापा ही नहीं गया। इसे केवल सूत्र की तरह सीखने के बजाय विधि की तरह सराहना चाहिए: ऐसी सीमा पर परिभाषित राशि जो प्रयोग से पहुँची ही नहीं जा सकती, ठीक-ठीक निकाल ली गई है, तीन नापी जा सकने वाली राशियों को यों जमाकर कि न पहुँचने वाले हिस्से कट जाएँ। लाभ तुरंत है — किसी भी सांद्रता पर वियोजन की मात्रा α = Λ_m/Λ°m है, और उससे वियोजन स्थिरांक K_a, और दुर्बल अम्ल की प्रबलता चालकता सेल से इसी तरह नापी जाती है। (दूसरा विकल्प असली संरचनात्मक भेद को शोर बता देता है; तीसरा आयन-आकार का ऐसा प्रभाव गिनाता है जो असली पर कहीं बहुत छोटा है और पठार की अनुपस्थिति नहीं समझाता; चौथा एक मानक और सुंदर विधि से इनकार करता है।)",
          mr: "दोन्ही वक्र वेगळे यासाठी दिसतात की दोन वेगळ्या गोष्टी बदलत आहेत, आणि त्यांना वेगळे करणे हाच प्रश्नाचा अख्खा आशय. आधी घ्या की मोलर वाहकता म्हणजे काय. Λ_m = κ/c मोजलेल्या वाहकतेला संहतीने भागते, म्हणून ती विचारते: या पदार्थाचा एक मोल जितके आयन देऊ शकतो, ते सर्व किती चांगले वहन करतात, जेव्हा ते जितका द्रावक लागेल तितक्यात पसरलेले असतील? असे लिहिल्यास राशीचे दोन घटक आहेत — आयन प्रत्यक्षात किती आहेत, आणि त्यांतला प्रत्येक किती मुक्तपणे हलतो. विरळीकरण दोघांपैकी कोणतेही बदलू शकते. तीव्र विद्युत अपघटनी. पोटॅशियम क्लोराइड प्रत्येक संहतीवर पूर्णपणे आयनित आहे; द्रावणात तुटायला कोणताही KCl रेणू नाहीच. म्हणून पहिला घटक प्रति मोल मीठ दोन मोल आयनांवर स्थिर आहे, नेहमी. जे बदलते ते दुसरे. संहत द्रावणात प्रत्येक आयन विरुद्ध प्रभारित शेजाऱ्यांच्या ढगाने वेढलेला आहे जो त्याच्या हलण्यावर ओढ टाकतो, आणि दोन नामित परिणाम आहेत — आयनी वातावरण चुकीच्या दिशेने ओढले जाणे आणि त्यासोबत जाणारा द्रावक प्रवाह. द्रावण विरळ करा आणि शेजारी दूर होतात, ओढ घटते, आणि गतिशीलता वाढते. पण एक मर्यादा आहे: एकदा आयन इतके दूर झाले की एकमेकांकडे पूर्णपणे दुर्लक्ष करू शकतील, तर पुढच्या विरळीकरणाने मदत होत नाही. म्हणून Λ_m चढते आणि मग सपाट होते, आणि सपाट भागच Λ°m आहे, थेट आलेखावरून वाचलेले. मध्यम संहतीपासून अनंत विरळतेपर्यंतची वाढ सहसा काही टक्केच असते. दुर्बल विद्युत अपघटनी. 0.1 M वर ॲसिटिक आम्ल सुमारे 1 टक्का विघटित आहे. त्याचा प्रचंड मोठा भाग शाबूत CH₃COOH रेणूंच्या रूपात उपस्थित आहे, जे काहीही वहन करत नाहीत. आता ते विरळ करा. विघटन समतोल CH₃COOH ⇌ CH₃COO⁻ + H⁺ घनफळाच्या वाढीला अधिक कण असलेल्या बाजूकडे सरकून उत्तर देतो, म्हणून विघटनाची मात्रा चढते — 1 टक्का, मग 3, मग 10, आणि विरळता अनंत होताहोता 100 टक्क्यांकडे. म्हणून प्रति मोल आम्ल आयनांची संख्या झपाट्याने वाढत आहे, आणि ती लहान गतिशीलता परिणामाला पूर्णपणे बुडवते. वक्र चढतच राहतो, आणि जितके विरळ द्रावण कोणी विश्वासाने मोजू शकेल तिथेही आम्ल अजूनही केवळ अंशतः विघटित आहे. सपाट भाग तत्त्वतः आहे पण तो अशा संहतींवर पडतो जिथे स्वतः पाण्याची वाहकता आम्लाच्या वाहकतेच्या तोडीची आहे. तरीही Λ°m कसे मिळते. कोहलराउशचा स्वतंत्र स्थलांतर नियम सांगतो की अनंत विरळतेवर प्रत्येक आयन आपला ठराविक वाटा देतो, तो कोणासोबत आला असो, कारण तेव्हा आयन एकमेकांवर परिणाम करण्यास फार दूर आहेत. म्हणून एखाद्या पदार्थाचे Λ°m हे त्याच्या आयनांच्या सीमांत वाहकतांची बेरीज आहे, आणि त्या अशा तीव्र विद्युत अपघटनींतून जुळवता येतात ज्यांचे आलेख सपाट होतातच. ॲसिटिक आम्लासाठी: HCl चे Λ°m घ्या, सोडियम ॲसिटेटचे Λ°m जोडा, NaCl चे Λ°m वजा करा. H⁺ आणि CH₃COO⁻ खेरीज प्रत्येक आयन कापला जातो, म्हणून जे उरते ते नेमके ॲसिटिक आम्लाचे Λ°m आहे. ॲसिटिक आम्लावर साध्या संहतींपुढे काहीही मोजलेच गेले नाही. याचे केवळ सूत्रासारखे शिकण्याऐवजी पद्धत म्हणून कौतुक करावे: अशा मर्यादेवर व्याख्यायित राशी जिच्यापर्यंत प्रयोगाने पोहोचताच येत नाही, नेमकी काढली गेली आहे, तीन मोजता येणाऱ्या राशी अशा मांडून की न पोहोचणारे भाग कापले जावेत. लाभ लगेच आहे — कोणत्याही संहतीवर विघटनाची मात्रा α = Λ_m/Λ°m आहे, आणि तिच्यातून विघटन स्थिरांक K_a, आणि दुर्बल आम्लाची तीव्रता वाहकता घटाने अशीच मोजली जाते. (दुसरा पर्याय खऱ्या संरचनात्मक भेदाला गोंगाट म्हणतो; तिसरा आयन-आकाराचा असा परिणाम सांगतो जो खरा पण कितीतरी लहान आहे आणि पठाराची अनुपस्थिती समजावत नाही; चौथा एका प्रमाणित आणि देखण्या पद्धतीला नकार देतो.)",
        },
      },
    ],
  },
  /*C1*/
];

export const G12_CHEMISTRY_NUMERIC: Record<string, NumQ[]> = {
  "chemistry-12-solutions": [
    {
      level: 1,
      stem: {
        en: "In a solution the mole fraction of the solute is 0.2. What is the mole fraction of the solvent?",
        hi: "किसी विलयन में विलेय का मोल अंश 0.2 है। विलायक का मोल अंश क्या है?",
        mr: "एका द्रावणात विद्राव्याचा मोल अंश 0.2 आहे. द्रावकाचा मोल अंश किती?",
      },
      answer: 0.8,
      wrong: [0.2, 5, 0.4],
      checkExpr: "1-0.2",
      solution: {
        en: "Mole fractions of all components add to one, so the solvent's is 1 − 0.2 = 0.8. That they sum to one is what makes the quantity useful: it is a proportion of the total particles, so no separate total needs to be quoted alongside it. (5 inverts the fraction, and 0.4 doubles it.)",
        hi: "सभी घटकों के मोल अंश जुड़कर एक बनते हैं, अतः विलायक का 1 − 0.2 = 0.8 है। उनका योग एक होना ही राशि को काम का बनाता है: वह कुल कणों का अनुपात है, अतः उसके साथ कोई अलग कुल बताने की ज़रूरत नहीं। (5 भिन्न उलट देता है, और 0.4 उसे दुगुना कर देता है।)",
        mr: "सर्व घटकांचे मोल अंश जुळून एक बनतात, म्हणून द्रावकाचा 1 − 0.2 = 0.8 आहे. त्यांची बेरीज एक होणेच राशीला उपयुक्त बनवते: तो एकूण कणांचा अनुपात आहे, म्हणून त्याच्यासोबत वेगळे एकूण सांगण्याची गरज नाही. (5 अपूर्णांक उलटवते, आणि 0.4 तो दुप्पट करते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "18 g of glucose, of molar mass 180 g/mol, is dissolved in water. How many moles is that?",
        hi: "180 g/mol मोलर द्रव्यमान वाले ग्लूकोस के 18 g पानी में घोले जाते हैं। यह कितने मोल है?",
        mr: "180 g/mol मोलर वस्तुमान असलेल्या ग्लुकोजचे 18 g पाण्यात विरघळवले जातात. हे किती मोल आहे?",
      },
      answer: 0.1,
      wrong: [10, 180, 1.8],
      checkExpr: "18/180",
      solution: {
        en: "Moles are mass divided by molar mass: 18/180 = 0.1 mol. Every colligative calculation begins here, because the effects depend on a count of particles and the mass has to be converted into a count before anything else can be done. (10 inverts the division.)",
        hi: "मोल द्रव्यमान बटा मोलर द्रव्यमान हैं: 18/180 = 0.1 mol. हर अणुसंख्य गणना यहीं से शुरू होती है, क्योंकि प्रभाव कणों की गिनती पर निर्भर हैं और कुछ भी करने से पहले द्रव्यमान को गिनती में बदलना ही पड़ता है। (10 भाग उलट देता है।)",
        mr: "मोल म्हणजे वस्तुमान भागिले मोलर वस्तुमान: 18/180 = 0.1 mol. प्रत्येक अणुसंख्य गणना इथूनच सुरू होते, कारण परिणाम कणांच्या मोजणीवर अवलंबून आहेत आणि काहीही करण्याआधी वस्तुमानाचे मोजणीत रूपांतर करावेच लागते. (10 भागाकार उलटवते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A solution contains 0.5 mol of solute in 2 kg of solvent. What is its molality, in mol/kg?",
        hi: "किसी विलयन में 2 kg विलायक में 0.5 mol विलेय है। उसकी मोललता, mol/kg में, क्या है?",
        mr: "एका द्रावणात 2 kg द्रावकात 0.5 mol विद्राव्य आहे. त्याची मोललता, mol/kg मध्ये, किती?",
      },
      answer: 0.25,
      wrong: [4, 1, 2.5],
      checkExpr: "0.5/2",
      solution: {
        en: "Molality is moles of solute per kilogram of SOLVENT: 0.5/2 = 0.25 mol/kg. The denominator is the solvent and not the solution, which is what distinguishes molality from molarity and why it is preferred for colligative work — a mass does not change with temperature, whereas a volume does. (4 inverts the ratio.)",
        hi: "मोललता प्रति किलोग्राम विलायक विलेय के मोल हैं: 0.5/2 = 0.25 mol/kg. हर विलायक है, विलयन नहीं, और यही मोललता को मोलरता से अलग करता है तथा इसीलिए अणुसंख्य काम के लिए वही चुनी जाती है — द्रव्यमान ताप के साथ नहीं बदलता, आयतन बदलता है। (4 अनुपात उलट देता है।)",
        mr: "मोललता म्हणजे प्रति किलोग्रॅम द्रावक विद्राव्याचे मोल: 0.5/2 = 0.25 mol/kg. छेद द्रावक आहे, द्रावण नव्हे, आणि हेच मोललतेला मोलरतेपासून वेगळे करते तसेच म्हणूनच अणुसंख्य कामासाठी तीच निवडली जाते — वस्तुमान तापमानासोबत बदलत नाही, घनफळ बदलते. (4 गुणोत्तर उलटवते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A pure solvent has a vapour pressure of 100 mm Hg. In a solution its mole fraction is 0.8. What is the vapour pressure of the solution, in mm Hg?",
        hi: "किसी शुद्ध विलायक का वाष्प दाब 100 mm Hg है। विलयन में उसका मोल अंश 0.8 है। विलयन का वाष्प दाब, mm Hg में, क्या है?",
        mr: "एका शुद्ध द्रावकाचा बाष्प दाब 100 mm Hg आहे. द्रावणात त्याचा मोल अंश 0.8 आहे. द्रावणाचा बाष्प दाब, mm Hg मध्ये, किती?",
      },
      answer: 80,
      wrong: [20, 125, 100],
      checkExpr: "100*0.8",
      solution: {
        en: "Raoult's law gives p = p°x = 100 × 0.8 = 80 mm Hg. Note which mole fraction is used: the SOLVENT's, since only the solvent is volatile here. The lowering, 20 mm Hg, is 0.2 of the pure value — the solute's mole fraction — which is the relative lowering restated. (20 quotes the lowering rather than the pressure.)",
        hi: "राउल्ट का नियम देता है p = p°x = 100 × 0.8 = 80 mm Hg. ध्यान दो कि कौन-सा मोल अंश काम में आया: विलायक का, क्योंकि यहाँ केवल विलायक वाष्पशील है। अवनमन 20 mm Hg शुद्ध मान का 0.2 है — विलेय का मोल अंश — और यही आपेक्षिक अवनमन दुबारा कहा हुआ है। (20 दाब के बजाय अवनमन बता देता है।)",
        mr: "राउल्टचा नियम देतो p = p°x = 100 × 0.8 = 80 mm Hg. कोणता मोल अंश वापरला ते लक्षात घ्या: द्रावकाचा, कारण इथे केवळ द्रावक बाष्पशील आहे. अवनमन 20 mm Hg हे शुद्ध मूल्याच्या 0.2 आहे — विद्राव्याचा मोल अंश — आणि हेच सापेक्ष अवनमन पुन्हा सांगितलेले. (20 दाबाऐवजी अवनमन सांगते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A 0.5 molal solution of a non-electrolyte is made in water, for which K_f = 1.86 K kg/mol. What is the depression of freezing point, in K?",
        hi: "पानी में किसी अन-विद्युत अपघट्य का 0.5 मोलल विलयन बनाया जाता है, जिसके लिए K_f = 1.86 K kg/mol है। हिमांक का अवनमन, K में, क्या है?",
        mr: "पाण्यात एका अ-विद्युत अपघटनीचे 0.5 मोलल द्रावण बनवले जाते, ज्यासाठी K_f = 1.86 K kg/mol आहे. गोठणबिंदूचे अवनमन, K मध्ये, किती?",
      },
      answer: 0.93,
      wrong: [3.72, 0.5, 2.36],
      checkExpr: "1.86*0.5",
      fmt: kelvin,
      solution: {
        en: "ΔT_f = K_f × m = 1.86 × 0.5 = 0.93 K. The solute being a non-electrolyte matters: it dissolves as whole molecules, so the van't Hoff factor is 1 and no multiplication by i is needed. Had it been sodium chloride, the answer would have been close to twice this. (3.72 uses a molality of 2 and 2.36 adds the two numbers.)",
        hi: "ΔT_f = K_f × m = 1.86 × 0.5 = 0.93 K. विलेय का अन-विद्युत अपघट्य होना मायने रखता है: वह पूरे अणुओं के रूप में घुलता है, अतः वान्ट हॉफ गुणक 1 है और i से गुणा करने की ज़रूरत नहीं। यदि वह सोडियम क्लोराइड होता, तो उत्तर इसका लगभग दुगुना होता। (3.72 मोललता 2 लगा देता है और 2.36 दोनों संख्याएँ जोड़ देता है।)",
        mr: "ΔT_f = K_f × m = 1.86 × 0.5 = 0.93 K. विद्राव्य अ-विद्युत अपघटनी असणे महत्त्वाचे आहे: ते पूर्ण रेणूंच्या रूपात विरघळते, म्हणून व्हॅन्ट हॉफ गुणक 1 आहे आणि i ने गुणण्याची गरज नाही. ते सोडियम क्लोराइड असते, तर उत्तर याच्या जवळपास दुप्पट झाले असते. (3.72 मोललता 2 लावते आणि 2.36 दोन्ही संख्या जोडते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "For water K_b = 0.52 K kg/mol. At what temperature, in °C, does a 2 molal solution of a non-electrolyte boil at one atmosphere?",
        hi: "पानी के लिए K_b = 0.52 K kg/mol है। एक वायुमंडल पर किसी अन-विद्युत अपघट्य का 2 मोलल विलयन किस ताप, °C में, पर उबलता है?",
        mr: "पाण्यासाठी K_b = 0.52 K kg/mol आहे. एका वातावरणावर एका अ-विद्युत अपघटनीचे 2 मोलल द्रावण कोणत्या तापमानावर, °C मध्ये, उकळते?",
      },
      answer: 101.04,
      wrong: [1.04, 100, 102.08],
      checkExpr: "100+0.52*2",
      solution: {
        en: "The elevation is ΔT_b = K_b × m = 0.52 × 2 = 1.04 K, and the solution boils at 100 + 1.04 = 101.04 °C. The question asks for a temperature, not a change, so the last step is the one that is most often forgotten. Note also how small the effect is: doubling the concentration again would still leave the water boiling barely two degrees above normal. (1.04 gives the elevation and stops.)",
        hi: "उन्नयन ΔT_b = K_b × m = 0.52 × 2 = 1.04 K है, और विलयन 100 + 1.04 = 101.04 °C पर उबलता है। प्रश्न ताप माँगता है, परिवर्तन नहीं, अतः अंतिम चरण ही सबसे अधिक भुलाया जाता है। यह भी ध्यान दो कि प्रभाव कितना छोटा है: सांद्रता फिर दुगुनी करने पर भी पानी सामान्य से मुश्किल से दो अंश ऊपर ही उबलता। (1.04 उन्नयन देकर रुक जाता है।)",
        mr: "उन्नयन ΔT_b = K_b × m = 0.52 × 2 = 1.04 K आहे, आणि द्रावण 100 + 1.04 = 101.04 °C वर उकळते. प्रश्न तापमान मागतो, बदल नाही, म्हणून शेवटची पायरीच सर्वांत जास्त विसरली जाते. हेही लक्षात घ्या की परिणाम किती लहान आहे: संहती पुन्हा दुप्पट केल्यावरही पाणी सामान्याहून जेमतेम दोन अंश वरच उकळेल. (1.04 उन्नयन देऊन थांबते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Sodium chloride has a van't Hoff factor of 2. What is the depression of freezing point, in K, for a 0.1 molal solution in water? Take K_f = 1.86 K kg/mol.",
        hi: "सोडियम क्लोराइड का वान्ट हॉफ गुणक 2 है। पानी में 0.1 मोलल विलयन के लिए हिमांक का अवनमन, K में, क्या है? K_f = 1.86 K kg/mol लो।",
        mr: "सोडियम क्लोराइडचा व्हॅन्ट हॉफ गुणक 2 आहे. पाण्यात 0.1 मोलल द्रावणासाठी गोठणबिंदूचे अवनमन, K मध्ये, किती? K_f = 1.86 K kg/mol घ्या.",
      },
      answer: 0.372,
      wrong: [0.186, 0.744, 1.86],
      checkExpr: "2*1.86*0.1",
      fmt: kelvin,
      solution: {
        en: "With an electrolyte the expression carries the van't Hoff factor: ΔT_f = i K_f m = 2 × 1.86 × 0.1 = 0.372 K. The factor is not a correction to the formula but a correction to the COUNT — one mole of NaCl supplies two moles of particles, and colligative properties count particles. (0.186 omits i altogether.)",
        hi: "विद्युत अपघट्य के साथ व्यंजक वान्ट हॉफ गुणक ढोता है: ΔT_f = i K_f m = 2 × 1.86 × 0.1 = 0.372 K. गुणक सूत्र का संशोधन नहीं बल्कि गिनती का संशोधन है — NaCl का एक मोल कणों के दो मोल देता है, और अणुसंख्य गुण कण गिनते हैं। (0.186 i को बिलकुल छोड़ देता है।)",
        mr: "विद्युत अपघटनीसह पदावली व्हॅन्ट हॉफ गुणक वाहते: ΔT_f = i K_f m = 2 × 1.86 × 0.1 = 0.372 K. गुणक हा सूत्राची दुरुस्ती नसून मोजणीची दुरुस्ती आहे — NaCl चा एक मोल कणांचे दोन मोल देतो, आणि अणुसंख्य गुणधर्म कण मोजतात. (0.186 i पूर्णपणे गाळते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A solution is 0.1 mol/L at 300 K. What is its osmotic pressure, in atm? Take R = 0.0821 L atm mol⁻¹ K⁻¹.",
        hi: "एक विलयन 300 K पर 0.1 mol/L है। उसका परासरण दाब, atm में, क्या है? R = 0.0821 L atm mol⁻¹ K⁻¹ लो।",
        mr: "एक द्रावण 300 K वर 0.1 mol/L आहे. त्याचा अभिसरण दाब, atm मध्ये, किती? R = 0.0821 L atm mol⁻¹ K⁻¹ घ्या.",
      },
      answer: 2.463,
      wrong: [24.63, 0.821, 0.246],
      checkExpr: "0.1*0.0821*300",
      solution: {
        en: "π = CRT = 0.1 × 0.0821 × 300 = 2.463 atm. Compare this with what the same solution does to the freezing point — a depression of under 0.2 K — and the reason osmometry is the method of choice for dilute solutions becomes plain: the same particle count is being read as two and a half atmospheres rather than as a fifth of a degree. (24.63 misplaces a decimal.)",
        hi: "π = CRT = 0.1 × 0.0821 × 300 = 2.463 atm. इसकी तुलना उससे करो जो वही विलयन हिमांक के साथ करता है — 0.2 K से कम का अवनमन — और साफ़ हो जाता है कि तनु विलयनों के लिए परासरणमिति ही क्यों चुनी जाती है: वही कण-गिनती एक अंश के पाँचवें भाग के बजाय ढाई वायुमंडल के रूप में पढ़ी जा रही है। (24.63 में दशमलव खिसक जाता है।)",
        mr: "π = CRT = 0.1 × 0.0821 × 300 = 2.463 atm. याची तुलना तेच द्रावण गोठणबिंदूशी काय करते त्याच्याशी करा — 0.2 K हून कमी अवनमन — आणि स्पष्ट होते की विरळ द्रावणांसाठी अभिसरणमापनच का निवडले जाते: तीच कण-मोजणी एका अंशाच्या पाचव्या भागाऐवजी अडीच वातावरणांच्या रूपात वाचली जात आहे. (24.63 मध्ये दशांश सरकतो.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "Equal masses of urea (molar mass 60) and glucose (molar mass 180) are dissolved in equal masses of water. The ratio of the freezing point depressions, urea to glucose, is n : 1. What is n?",
        hi: "यूरिया (मोलर द्रव्यमान 60) और ग्लूकोस (मोलर द्रव्यमान 180) के बराबर द्रव्यमान बराबर द्रव्यमान के पानी में घोले जाते हैं। हिमांक अवनमनों का अनुपात, यूरिया बनाम ग्लूकोस, n : 1 है। n क्या है?",
        mr: "युरिया (मोलर वस्तुमान 60) आणि ग्लुकोज (मोलर वस्तुमान 180) यांची समान वस्तुमाने समान वस्तुमानाच्या पाण्यात विरघळवली जातात. गोठणबिंदू अवनमनांचे गुणोत्तर, युरिया विरुद्ध ग्लुकोज, n : 1 आहे. n किती?",
      },
      answer: 3,
      wrong: [0.33, 120, 1],
      checkExpr: "180/60",
      solution: {
        en: "Equal masses do not mean equal moles. A gram of urea contains 1/60 mol while a gram of glucose contains 1/180, so urea supplies three times as many particles and depresses the freezing point three times as far: the ratio is 180/60 = 3. The lighter the molecule, the more particles a gram of it provides, which is why colligative effects are large for small solutes and vanishingly small for proteins. (0.33 inverts the ratio.)",
        hi: "बराबर द्रव्यमान का अर्थ बराबर मोल नहीं। यूरिया के एक ग्राम में 1/60 मोल हैं जबकि ग्लूकोस के एक ग्राम में 1/180, अतः यूरिया तीन गुना कण देता है और हिमांक को तीन गुना गिराता है: अनुपात 180/60 = 3 है। अणु जितना हल्का, उसका एक ग्राम उतने अधिक कण देता है, इसीलिए अणुसंख्य प्रभाव छोटे विलेयों के लिए बड़े और प्रोटीनों के लिए लुप्तप्राय होते हैं। (0.33 अनुपात उलट देता है।)",
        mr: "समान वस्तुमान म्हणजे समान मोल नव्हे. युरियाच्या एका ग्रॅममध्ये 1/60 मोल आहेत तर ग्लुकोजच्या एका ग्रॅममध्ये 1/180, म्हणून युरिया तिप्पट कण देतो आणि गोठणबिंदू तिप्पट घसरवतो: गुणोत्तर 180/60 = 3 आहे. रेणू जितका हलका, त्याचा एक ग्रॅम तितके अधिक कण देतो, म्हणूनच अणुसंख्य परिणाम लहान विद्राव्यांसाठी मोठे आणि प्रथिनांसाठी नाहीसे होणारे असतात. (0.33 गुणोत्तर उलटवते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A 0.1 molal aqueous solution of an electrolyte AB shows a freezing point depression of 0.279 K. Taking K_f = 1.86 K kg/mol, what is its van't Hoff factor?",
        hi: "किसी विद्युत अपघट्य AB का 0.1 मोलल जलीय विलयन 0.279 K का हिमांक अवनमन दिखाता है। K_f = 1.86 K kg/mol लेकर, उसका वान्ट हॉफ गुणक क्या है?",
        mr: "एका विद्युत अपघटनी AB चे 0.1 मोलल जलीय द्रावण 0.279 K चे गोठणबिंदू अवनमन दाखवते. K_f = 1.86 K kg/mol घेऊन, त्याचा व्हॅन्ट हॉफ गुणक किती?",
      },
      answer: 1.5,
      wrong: [2, 1, 0.75],
      checkExpr: "0.279/0.186",
      solution: {
        en: "The depression expected for an undissociated solute is K_f m = 1.86 × 0.1 = 0.186 K, so i = 0.279/0.186 = 1.5. That value is the whole answer to the question of how far AB has broken up. If it were fully dissociated into A⁺ and B⁻, i would be 2; if it stayed intact, 1. A value of 1.5 says half the formula units have separated, since α = (i − 1)/(2 − 1) = 0.5. Note what this measurement has achieved: a thermometer reading, converted through a table constant, has counted the fraction of molecules that came apart — no ions have been seen, and none needed to be. The same arithmetic run on a weak acid gives its degree of dissociation and from that its dissociation constant, which is why cryoscopy was for decades a standard way of studying electrolytes. (2 assumes complete dissociation, and 1 assumes none.)",
        hi: "अवियोजित विलेय के लिए अपेक्षित अवनमन K_f m = 1.86 × 0.1 = 0.186 K है, अतः i = 0.279/0.186 = 1.5. वही मान इस प्रश्न का पूरा उत्तर है कि AB कितना टूटा। यदि वह पूरी तरह A⁺ और B⁻ में वियोजित होता, तो i, 2 होता; यदि सलामत रहता, 1. 1.5 का मान कहता है कि आधी सूत्र इकाइयाँ अलग हुई हैं, क्योंकि α = (i − 1)/(2 − 1) = 0.5. ध्यान दो कि इस माप ने क्या हासिल किया: एक तापमापी पाठ्यांक ने, तालिका के स्थिरांक से होकर, उन अणुओं का अंश गिन लिया जो टूटे — कोई आयन देखा नहीं गया, और देखने की ज़रूरत भी नहीं थी। वही गणित दुर्बल अम्ल पर चलाने से उसकी वियोजन मात्रा मिलती है और उससे उसका वियोजन स्थिरांक, इसीलिए हिमांकमिति दशकों तक विद्युत अपघट्यों के अध्ययन का मानक रास्ता रही। (2 पूर्ण वियोजन मान लेता है, और 1 कोई नहीं।)",
        mr: "अविघटित विद्राव्यासाठी अपेक्षित अवनमन K_f m = 1.86 × 0.1 = 0.186 K आहे, म्हणून i = 0.279/0.186 = 1.5. तेच मूल्य AB किती तुटले या प्रश्नाचे अख्खे उत्तर आहे. ते पूर्णपणे A⁺ आणि B⁻ मध्ये विघटित झाले असते, तर i हा 2 झाला असता; शाबूत राहिले असते, तर 1. 1.5 चे मूल्य सांगते की अर्धी सूत्र एकके वेगळी झाली आहेत, कारण α = (i − 1)/(2 − 1) = 0.5. या मापाने काय साधले ते लक्षात घ्या: एका तापमापी वाचनाने, कोष्टकाच्या स्थिरांकातून जात, तुटलेल्या रेणूंचा अंश मोजून टाकला — कोणताही आयन पाहिला गेला नाही, आणि पाहण्याची गरजही नव्हती. तेच गणित दुर्बल आम्लावर चालवल्यास त्याची विघटन मात्रा मिळते आणि तिच्यातून त्याचा विघटन स्थिरांक, म्हणूनच गोठणमापन दशके विद्युत अपघटनींच्या अभ्यासाचा प्रमाणित मार्ग राहिले. (2 पूर्ण विघटन गृहीत धरते, आणि 1 काहीच नाही.)",
      },
    },
  ],
  "chemistry-12-electrochemistry": [
    {
      level: 1,
      stem: {
        en: "A cell has a cathode of standard potential +0.34 V and an anode of standard potential −0.76 V. What is the standard cell potential, in V?",
        hi: "किसी सेल के कैथोड का मानक विभव +0.34 V और ऐनोड का −0.76 V है। मानक सेल विभव, V में, क्या है?",
        mr: "एका घटाच्या कॅथोडचा प्रमाणित विभव +0.34 V आणि अ‍ॅनोडचा −0.76 V आहे. प्रमाणित घट विभव, V मध्ये, किती?",
      },
      answer: 1.1,
      wrong: [-0.42, 0.42, -1.1],
      checkExpr: "0.34-(-0.76)",
      fmt: volts,
      solution: {
        en: "E°cell = E°cathode − E°anode = 0.34 − (−0.76) = 1.1 V. Subtracting a negative is where the sign goes wrong; the two potentials are 1.1 V apart on the table and that gap is the answer. A positive cell potential means the reaction as written is spontaneous, which is the check to run before trusting any answer here. (−0.42 adds the two instead of subtracting.)",
        hi: "E°सेल = E°कैथोड − E°ऐनोड = 0.34 − (−0.76) = 1.1 V. ऋण घटाना ही वह जगह है जहाँ चिह्न बिगड़ता है; दोनों विभव तालिका पर 1.1 V दूर हैं और वही अंतर उत्तर है। धनात्मक सेल विभव का अर्थ है कि जैसी लिखी गई अभिक्रिया वैसी स्वतःप्रवर्तित है, और यहाँ किसी भी उत्तर पर भरोसा करने से पहले यही जाँच चलानी चाहिए। (−0.42 घटाने के बजाय दोनों जोड़ देता है।)",
        mr: "E°घट = E°कॅथोड − E°अ‍ॅनोड = 0.34 − (−0.76) = 1.1 V. ऋण वजा करणे हीच ती जागा जिथे चिन्ह बिघडते; दोन्ही विभव कोष्टकावर 1.1 V दूर आहेत आणि तोच फरक उत्तर आहे. धन घट विभव म्हणजे जशी लिहिली तशी अभिक्रिया स्वयंस्फूर्त आहे, आणि इथे कोणत्याही उत्तरावर विश्वास ठेवण्याआधी हीच तपासणी चालवावी. (−0.42 वजा करण्याऐवजी दोन्ही जोडते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "How many moles of electrons are needed to deposit 2 mol of copper from Cu²⁺?",
        hi: "Cu²⁺ से 2 mol ताँबा जमाने के लिए इलेक्ट्रॉनों के कितने मोल चाहिए?",
        mr: "Cu²⁺ पासून 2 mol तांबे जमवण्यासाठी इलेक्ट्रॉनांचे किती मोल लागतील?",
      },
      answer: 4,
      wrong: [2, 1, 8],
      checkExpr: "2*2",
      solution: {
        en: "Each Cu²⁺ ion needs two electrons to become a copper atom, so 2 mol of copper needs 2 × 2 = 4 mol of electrons. The charge on the ion is the multiplier, which is why one faraday deposits a whole mole of silver but only half a mole of copper. (2 forgets the ion's charge.)",
        hi: "हर Cu²⁺ आयन को ताँबे का परमाणु बनने के लिए दो इलेक्ट्रॉन चाहिए, अतः 2 mol ताँबे को 2 × 2 = 4 mol इलेक्ट्रॉन चाहिए। आयन का आवेश ही गुणक है, इसीलिए एक फैराडे चाँदी का पूरा मोल जमाता है पर ताँबे का केवल आधा मोल। (2 आयन का आवेश भूल जाता है।)",
        mr: "प्रत्येक Cu²⁺ आयनाला तांब्याचा अणू बनण्यासाठी दोन इलेक्ट्रॉन लागतात, म्हणून 2 mol तांब्याला 2 × 2 = 4 mol इलेक्ट्रॉन लागतील. आयनाचा प्रभार हाच गुणक, म्हणूनच एक फॅरेडे चांदीचा पूर्ण मोल जमवतो पण तांब्याचा केवळ अर्धा मोल. (2 आयनाचा प्रभार विसरते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "How much charge, in coulombs, is needed to deposit 0.5 mol of silver from Ag⁺? Take 1 F = 96500 C.",
        hi: "Ag⁺ से 0.5 mol चाँदी जमाने के लिए कितना आवेश, कूलॉम में, चाहिए? 1 F = 96500 C लो।",
        mr: "Ag⁺ पासून 0.5 mol चांदी जमवण्यासाठी किती प्रभार, कुलोममध्ये, लागेल? 1 F = 96500 C घ्या.",
      },
      answer: 48250,
      wrong: [193000, 96500, 24125],
      checkExpr: "96500*0.5",
      solution: {
        en: "Silver is deposited from Ag⁺, so one electron per atom and one faraday per mole: 0.5 × 96500 = 48250 C. The faraday is Avogadro's number of electronic charges, so this calculation is really counting 3 × 10²³ electrons and converting the count into coulombs. (193000 uses two electrons per atom, which would be right for copper and is not for silver.)",
        hi: "चाँदी Ag⁺ से जमती है, अतः प्रति परमाणु एक इलेक्ट्रॉन और प्रति मोल एक फैराडे: 0.5 × 96500 = 48250 C. फैराडे इलेक्ट्रॉनिक आवेशों की आवोगाद्रो संख्या है, अतः यह गणना वस्तुतः 3 × 10²³ इलेक्ट्रॉन गिन रही है और गिनती को कूलॉम में बदल रही है। (193000 प्रति परमाणु दो इलेक्ट्रॉन लगा देता है, जो ताँबे के लिए सही होता और चाँदी के लिए नहीं है।)",
        mr: "चांदी Ag⁺ पासून जमते, म्हणून प्रति अणू एक इलेक्ट्रॉन आणि प्रति मोल एक फॅरेडे: 0.5 × 96500 = 48250 C. फॅरेडे म्हणजे इलेक्ट्रॉनिक प्रभारांची ॲव्होगाड्रो संख्या, म्हणून ही गणना प्रत्यक्षात 3 × 10²³ इलेक्ट्रॉन मोजत आहे आणि मोजणीचे कुलोममध्ये रूपांतर करत आहे. (193000 प्रति अणू दोन इलेक्ट्रॉन लावते, जे तांब्यासाठी बरोबर ठरले असते आणि चांदीसाठी नाही.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A current of 2 A flows through a cell for 500 s. How much charge, in coulombs, has passed?",
        hi: "किसी सेल में से 2 A धारा 500 s तक बहती है। कितना आवेश, कूलॉम में, गुज़रा है?",
        mr: "एका घटातून 2 A धारा 500 s पर्यंत वाहते. किती प्रभार, कुलोममध्ये, गेला आहे?",
      },
      answer: 1000,
      wrong: [250, 0.004, 100],
      checkExpr: "2*500",
      solution: {
        en: "Q = It = 2 × 500 = 1000 C. This is the bridge between the electrical measurement and the chemical one: an ammeter and a stopwatch give the charge, the faraday converts it to moles of electrons, and the ion's charge converts that to moles of substance. Every electrolysis calculation is those three steps in order. (250 divides instead of multiplying.)",
        hi: "Q = It = 2 × 500 = 1000 C. यही विद्युत माप और रासायनिक माप के बीच का पुल है: अमीटर और स्टॉपवाच आवेश देते हैं, फैराडे उसे इलेक्ट्रॉनों के मोल में बदलता है, और आयन का आवेश उसे पदार्थ के मोल में। हर विद्युत अपघटन गणना क्रम से यही तीन चरण है। (250 गुणा करने के बजाय भाग दे देता है।)",
        mr: "Q = It = 2 × 500 = 1000 C. हाच विद्युत माप आणि रासायनिक माप यांतील पूल: अ‍ॅमीटर आणि स्टॉपवॉच प्रभार देतात, फॅरेडे त्याचे इलेक्ट्रॉनांच्या मोलमध्ये रूपांतर करतो, आणि आयनाचा प्रभार त्याचे पदार्थाच्या मोलमध्ये. प्रत्येक विद्युत अपघटन गणना क्रमाने हीच तीन पावले आहे. (250 गुणण्याऐवजी भागते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A solution has conductivity 0.02 S/cm and concentration 0.1 mol/L. What is its molar conductivity, in S cm²/mol?",
        hi: "किसी विलयन की चालकता 0.02 S/cm और सांद्रता 0.1 mol/L है। उसकी मोलर चालकता, S cm²/mol में, क्या है?",
        mr: "एका द्रावणाची वाहकता 0.02 S/cm आणि संहती 0.1 mol/L आहे. त्याची मोलर वाहकता, S cm²/mol मध्ये, किती?",
      },
      answer: 200,
      wrong: [0.002, 2, 20],
      checkExpr: "0.02*1000/0.1",
      solution: {
        en: "Λ_m = κ × 1000/c = 0.02 × 1000/0.1 = 200 S cm²/mol. The factor of 1000 converts litres to cubic centimetres so that the units match, and forgetting it is the standard error here. What the quantity means is the conducting power of all the ions from one mole, however much water they are spread through. (0.002 multiplies by the concentration instead of dividing.)",
        hi: "Λ_m = κ × 1000/c = 0.02 × 1000/0.1 = 200 S cm²/mol. 1000 का गुणक लीटर को घन सेंटीमीटर में बदलता है ताकि मात्रक मिलें, और उसे भूलना ही यहाँ की मानक भूल है। राशि का अर्थ है एक मोल से आए सारे आयनों की चालन शक्ति, वे जितने भी पानी में फैले हों। (0.002 भाग देने के बजाय सांद्रता से गुणा कर देता है।)",
        mr: "Λ_m = κ × 1000/c = 0.02 × 1000/0.1 = 200 S cm²/mol. 1000 चा गुणक लिटरचे घन सेंटीमीटरमध्ये रूपांतर करतो जेणेकरून एकके जुळावीत, आणि तो विसरणे हीच इथली प्रमाणित चूक. राशीचा अर्थ म्हणजे एका मोलमधून आलेल्या सर्व आयनांची वहन शक्ती, ते कितीही पाण्यात पसरलेले असोत. (0.002 भागण्याऐवजी संहतीने गुणते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "For a cell with E° = 1.1 V and n = 2, the Nernst equation at 298 K gives E = E° − (0.059/n) log Q. What is E, in V, when log Q = 2?",
        hi: "E° = 1.1 V और n = 2 वाले सेल के लिए 298 K पर नेर्न्स्ट समीकरण E = E° − (0.059/n) log Q देता है। log Q = 2 होने पर E, V में, क्या है?",
        mr: "E° = 1.1 V आणि n = 2 असलेल्या घटासाठी 298 K वर नर्न्स्ट समीकरण E = E° − (0.059/n) log Q देते. log Q = 2 असताना E, V मध्ये, किती?",
      },
      answer: 1.041,
      wrong: [1.159, 1.0705, 0.059],
      checkExpr: "1.1-0.059/2*2",
      fmt: volts,
      solution: {
        en: "E = 1.1 − (0.059/2) × 2 = 1.1 − 0.059 = 1.041 V. The voltage has fallen because products have built up: Q greater than one means the reaction has run some way forward, and every step forward costs a little voltage. The fall is small here, but as Q climbs towards K the term grows without limit and E reaches zero exactly at equilibrium. (1.159 adds instead of subtracting.)",
        hi: "E = 1.1 − (0.059/2) × 2 = 1.1 − 0.059 = 1.041 V. वोल्टता इसलिए गिरी कि उत्पाद जमा हो गए: Q का एक से बड़ा होना कहता है कि अभिक्रिया कुछ आगे चल चुकी है, और हर क़दम थोड़ी वोल्टता लेता है। यहाँ गिरावट छोटी है, पर Q जैसे-जैसे K की ओर चढ़ता है वह पद बिना सीमा बढ़ता है और E ठीक साम्य पर शून्य हो जाता है। (1.159 घटाने के बजाय जोड़ देता है।)",
        mr: "E = 1.1 − (0.059/2) × 2 = 1.1 − 0.059 = 1.041 V. व्होल्टेज यासाठी घसरला की उत्पादने साठली: Q एकाहून मोठा असणे सांगते की अभिक्रिया काहीशी पुढे गेली आहे, आणि प्रत्येक पाऊल थोडा व्होल्टेज घेते. इथे घसरण लहान आहे, पण Q जसजसा K कडे चढतो ते पद मर्यादेविना वाढते आणि E नेमक्या समतोलावर शून्य होतो. (1.159 वजा करण्याऐवजी जोडते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Limiting molar conductivities are 426 for HCl, 91 for sodium acetate and 126 for NaCl, all in S cm²/mol. What is the limiting molar conductivity of acetic acid?",
        hi: "सीमांत मोलर चालकताएँ HCl के लिए 426, सोडियम ऐसीटेट के लिए 91 और NaCl के लिए 126 हैं, सब S cm²/mol में। ऐसीटिक अम्ल की सीमांत मोलर चालकता क्या है?",
        mr: "सीमांत मोलर वाहकता HCl साठी 426, सोडियम ॲसिटेटसाठी 91 आणि NaCl साठी 126 आहेत, सर्व S cm²/mol मध्ये. ॲसिटिक आम्लाची सीमांत मोलर वाहकता किती?",
      },
      answer: 391,
      wrong: [461, 361, 643],
      checkExpr: "426+91-126",
      solution: {
        en: "By Kohlrausch's law each ion contributes independently at infinite dilution, so add and subtract until only the wanted pair is left: HCl gives H⁺ and Cl⁻, sodium acetate gives Na⁺ and CH₃COO⁻, and NaCl removes the Na⁺ and Cl⁻ that are not wanted. That leaves 426 + 91 − 126 = 391 S cm²/mol for H⁺ and CH₃COO⁻. Nothing has been measured on acetic acid itself, which is the point: its curve never flattens within reach, so the value is assembled from three that do. (461 adds all three.)",
        hi: "कोह्लराउश के नियम से अनंत तनुता पर हर आयन स्वतंत्र रूप से अंश देता है, अतः तब तक जोड़ो-घटाओ जब तक केवल चाहा गया युग्म न बचे: HCl से H⁺ और Cl⁻ आते हैं, सोडियम ऐसीटेट से Na⁺ और CH₃COO⁻, और NaCl वे Na⁺ तथा Cl⁻ हटा देता है जो नहीं चाहिए। बचता है H⁺ और CH₃COO⁻ के लिए 426 + 91 − 126 = 391 S cm²/mol. स्वयं ऐसीटिक अम्ल पर कुछ नापा ही नहीं गया, और यही मर्म है: उसका वक्र पहुँच के भीतर कभी सपाट नहीं होता, अतः मान उन तीन से जुटाया जाता है जिनके होते हैं। (461 तीनों जोड़ देता है।)",
        mr: "कोहलराउशच्या नियमाने अनंत विरळतेवर प्रत्येक आयन स्वतंत्रपणे वाटा देतो, म्हणून तोवर जोडा-वजा करा जोवर केवळ हवी असलेली जोडी उरत नाही: HCl मधून H⁺ आणि Cl⁻ येतात, सोडियम ॲसिटेटमधून Na⁺ आणि CH₃COO⁻, आणि NaCl ते Na⁺ व Cl⁻ काढून टाकते जे नकोत. उरते H⁺ आणि CH₃COO⁻ साठी 426 + 91 − 126 = 391 S cm²/mol. स्वतः ॲसिटिक आम्लावर काहीही मोजलेच गेले नाही, आणि हाच गाभा: त्याचा वक्र आवाक्यात कधीच सपाट होत नाही, म्हणून मूल्य त्या तिघांतून जुळवले जाते ज्यांचे होतात. (461 तिन्ही जोडते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A cell has E°cell = 1.1 V with n = 2. Using ΔG° = −nFE° with F = 96500 C/mol, what is ΔG° in kJ/mol?",
        hi: "किसी सेल का E°सेल = 1.1 V है और n = 2. ΔG° = −nFE° का उपयोग करते हुए, F = 96500 C/mol लेकर, ΔG°, kJ/mol में, क्या है?",
        mr: "एका घटाचा E°घट = 1.1 V आहे आणि n = 2. ΔG° = −nFE° वापरून, F = 96500 C/mol घेऊन, ΔG°, kJ/mol मध्ये, किती?",
      },
      answer: -212.3,
      wrong: [-106.15, 212.3, -424.6],
      checkExpr: "-2*96500*1.1/1000",
      solution: {
        en: "ΔG° = −nFE° = −2 × 96500 × 1.1 = −212300 J/mol, which is −212.3 kJ/mol. The negative sign is the whole point: a positive cell potential means a negative free energy change, which means the reaction is spontaneous. The equation is also the bridge between two chapters — a voltmeter reading and a thermodynamic quantity turn out to be the same measurement in different units. (212.3 loses the sign, which reverses the conclusion about spontaneity.)",
        hi: "ΔG° = −nFE° = −2 × 96500 × 1.1 = −212300 J/mol, अर्थात् −212.3 kJ/mol. ऋण चिह्न ही पूरा मर्म है: धनात्मक सेल विभव का अर्थ ऋणात्मक मुक्त ऊर्जा परिवर्तन है, जिसका अर्थ अभिक्रिया स्वतःप्रवर्तित है। यह समीकरण दो अध्यायों के बीच का पुल भी है — वोल्टमापी का पाठ्यांक और ऊष्मागतिक राशि भिन्न मात्रकों में एक ही माप निकलते हैं। (212.3 चिह्न खो देता है, जिससे स्वतःप्रवर्तन का निष्कर्ष उलट जाता है।)",
        mr: "ΔG° = −nFE° = −2 × 96500 × 1.1 = −212300 J/mol, म्हणजे −212.3 kJ/mol. ऋण चिन्ह हाच अख्खा गाभा: धन घट विभव म्हणजे ऋण मुक्त ऊर्जा बदल, म्हणजे अभिक्रिया स्वयंस्फूर्त आहे. हे समीकरण दोन प्रकरणांमधला पूलही आहे — व्होल्टमापकाचे वाचन आणि उष्मागतिक राशी वेगळ्या एककांत एकच माप निघतात. (212.3 चिन्ह गमावते, ज्याने स्वयंस्फूर्ततेचा निष्कर्ष उलटतो.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "For how long, in seconds, must a current of 5 A flow to deposit 0.1 mol of copper from Cu²⁺? Take F = 96500 C/mol.",
        hi: "Cu²⁺ से 0.1 mol ताँबा जमाने के लिए 5 A की धारा कितने सेकंड बहनी चाहिए? F = 96500 C/mol लो।",
        mr: "Cu²⁺ पासून 0.1 mol तांबे जमवण्यासाठी 5 A ची धारा किती सेकंद वाहावी लागेल? F = 96500 C/mol घ्या.",
      },
      answer: 3860,
      wrong: [1930, 7720, 965],
      checkExpr: "0.1*2*96500/5",
      solution: {
        en: "Copper needs two electrons per atom, so the charge required is 0.1 × 2 × 96500 = 19300 C, and at 5 A the time is 19300/5 = 3860 s, a little over an hour. The three steps run in order: moles of substance, then moles of electrons using the ion's charge, then coulombs using the faraday, then seconds using the current. Omitting the factor of 2 is the standard slip and halves the answer. (1930 forgets the two electrons per copper atom.)",
        hi: "ताँबे को प्रति परमाणु दो इलेक्ट्रॉन चाहिए, अतः चाहिए आवेश 0.1 × 2 × 96500 = 19300 C है, और 5 A पर समय 19300/5 = 3860 s, यानी घंटे से कुछ अधिक। तीन चरण क्रम से चलते हैं: पदार्थ के मोल, फिर आयन के आवेश से इलेक्ट्रॉनों के मोल, फिर फैराडे से कूलॉम, फिर धारा से सेकंड। 2 का गुणक छोड़ना मानक चूक है और उत्तर आधा कर देती है। (1930 प्रति ताँबा परमाणु दो इलेक्ट्रॉन भूल जाता है।)",
        mr: "तांब्याला प्रति अणू दोन इलेक्ट्रॉन लागतात, म्हणून लागणारा प्रभार 0.1 × 2 × 96500 = 19300 C आहे, आणि 5 A वर काळ 19300/5 = 3860 s, म्हणजे तासाहून काहीसा अधिक. तीन पावले क्रमाने चालतात: पदार्थाचे मोल, मग आयनाच्या प्रभाराने इलेक्ट्रॉनांचे मोल, मग फॅरेडेने कुलोम, मग धारेने सेकंद. 2 चा गुणक गाळणे ही प्रमाणित चूक आणि ती उत्तर निम्मे करते. (1930 प्रति तांबे अणू दोन इलेक्ट्रॉन विसरते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A weak acid has molar conductivity 20 S cm²/mol at a given concentration and a limiting molar conductivity of 400 S cm²/mol. What is its degree of dissociation, as a percentage?",
        hi: "किसी दुर्बल अम्ल की दी गई सांद्रता पर मोलर चालकता 20 S cm²/mol है और सीमांत मोलर चालकता 400 S cm²/mol. उसकी वियोजन मात्रा, प्रतिशत में, क्या है?",
        mr: "एका दुर्बल आम्लाची दिलेल्या संहतीवर मोलर वाहकता 20 S cm²/mol आहे आणि सीमांत मोलर वाहकता 400 S cm²/mol. त्याची विघटन मात्रा, टक्केवारीत, किती?",
      },
      answer: 5,
      wrong: [20, 0.05, 2],
      checkExpr: "20/400*100",
      solution: {
        en: "α = Λ_m/Λ°m = 20/400 = 0.05, that is 5 per cent. The reasoning behind the ratio is worth stating: Λ°m is what the acid would conduct if every molecule had dissociated, and Λ_m is what it actually conducts, so the ratio is the fraction that has. Two things follow. First, this is a measurement of a chemical equilibrium made with a conductivity cell and no chemistry at all — no ions are detected individually, only their collective effect. Second, α feeds straight into the dissociation constant through K_a = cα²/(1 − α), so a single conductivity reading at known concentration yields the strength of the acid. Note that Λ°m for a weak acid cannot itself be measured, and has to come from Kohlrausch's law applied to three strong electrolytes — so this apparently simple ratio rests on a piece of indirect reasoning done earlier. (20 quotes Λ_m as a percentage; 0.05 gives the fraction where a percentage was asked.)",
        hi: "α = Λ_m/Λ°m = 20/400 = 0.05, अर्थात् 5 प्रतिशत। अनुपात के पीछे का तर्क कहने योग्य है: Λ°m वह है जो अम्ल तब चालन करता यदि हर अणु वियोजित हो जाता, और Λ_m वह है जो वह वस्तुतः करता है, अतः अनुपात वही अंश है जो हुआ। दो बातें निकलती हैं। पहली, यह रासायनिक साम्य का माप है जो चालकता सेल से और बिना किसी रसायन के किया गया — कोई आयन अलग से पकड़ा नहीं गया, केवल उनका सामूहिक प्रभाव। दूसरी, α सीधे वियोजन स्थिरांक में जाता है K_a = cα²/(1 − α) के ज़रिए, अतः ज्ञात सांद्रता पर एक ही चालकता पाठ्यांक अम्ल की प्रबलता दे देता है। ध्यान दो कि दुर्बल अम्ल का Λ°m स्वयं नापा नहीं जा सकता, और उसे तीन प्रबल विद्युत अपघट्यों पर लगे कोह्लराउश के नियम से आना पड़ता है — अतः यह देखने में सरल अनुपात पहले किए गए एक अप्रत्यक्ष तर्क पर टिका है। (20 Λ_m को ही प्रतिशत बता देता है; 0.05 अंश देता है जहाँ प्रतिशत पूछा गया था।)",
        mr: "α = Λ_m/Λ°m = 20/400 = 0.05, म्हणजे 5 टक्के. गुणोत्तरामागचा युक्तिवाद सांगण्याजोगा आहे: Λ°m हे ते जे आम्ल तेव्हा वहन करेल जर प्रत्येक रेणू विघटित झाला असता, आणि Λ_m हे ते जे ते प्रत्यक्षात करते, म्हणून गुणोत्तर हाच तो अंश जो झाला. दोन गोष्टी निघतात. पहिली, हे रासायनिक समतोलाचे माप आहे जे वाहकता घटाने आणि कोणत्याही रसायनाविना केले — कोणताही आयन वेगळा पकडला गेला नाही, केवळ त्यांचा सामूहिक परिणाम. दुसरी, α थेट विघटन स्थिरांकात जातो K_a = cα²/(1 − α) मार्गे, म्हणून ज्ञात संहतीवर एकच वाहकता वाचन आम्लाची तीव्रता देते. लक्षात घ्या की दुर्बल आम्लाचे Λ°m स्वतः मोजता येत नाही, आणि ते तीन तीव्र विद्युत अपघटनींवर लावलेल्या कोहलराउशच्या नियमातून यावे लागते — म्हणून हे दिसायला साधे गुणोत्तर आधी केलेल्या एका अप्रत्यक्ष युक्तिवादावर टिकले आहे. (20 Λ_m लाच टक्केवारी सांगते; 0.05 अंश देते जिथे टक्केवारी विचारली होती.)",
      },
    },
  ],
};
