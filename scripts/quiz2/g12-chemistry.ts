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
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Chemical Kinetics                                           */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-12-chemical-kinetics",
    subject: "CHEMISTRY",
    classLevel: 12,
    chapter: {
      en: "Chapter 3 — Chemical Kinetics",
      hi: "अध्याय 3 — रासायनिक बलगतिकी",
      mr: "प्रकरण 3 — रासायनिक गतिकी",
    },
    name: {
      en: "Chemical Kinetics",
      hi: "रासायनिक बलगतिकी",
      mr: "रासायनिक गतिकी",
    },
    summary: {
      en: "The half of chemistry that thermodynamics leaves out: a diamond is thermodynamically bound to turn into graphite and does not, because nothing in a free energy change says how long. A rate law that has to be found by experiment because it cannot be read off the balanced equation, and whose exponents are therefore evidence about a mechanism rather than a restatement of the recipe; a constant whose units change with the order, which is a warning that it is not one quantity but a family; a hill the reactants must climb before they can fall, so that a reaction which releases energy may still need some to start; a temperature dependence so steep that ten degrees can double a rate; and a catalyst that lowers the hill from both sides at once and therefore changes when equilibrium is reached without changing where.",
      hi: "रसायन का वह आधा जो ऊष्मागतिकी छोड़ देती है: हीरे को ऊष्मागतिकी की दृष्टि से ग्रैफ़ाइट बन ही जाना चाहिए और वह नहीं बनता, क्योंकि मुक्त ऊर्जा परिवर्तन में कहीं नहीं लिखा कि कितनी देर में। ऐसा वेग नियम जिसे प्रयोग से खोजना पड़ता है क्योंकि वह संतुलित समीकरण से पढ़ा नहीं जा सकता, और जिसकी घातें इसलिए किसी क्रियाविधि का प्रमाण हैं, नुस्ख़े का दुहराव नहीं; ऐसा स्थिरांक जिसके मात्रक कोटि के साथ बदलते हैं, जो चेतावनी है कि वह एक राशि नहीं बल्कि एक कुल है; वह पहाड़ी जिस पर अभिकारकों को गिरने से पहले चढ़ना पड़ता है, अतः जो अभिक्रिया ऊर्जा देती है उसे भी शुरू होने के लिए कुछ चाहिए हो सकती है; इतनी तीखी ताप-निर्भरता कि दस अंश वेग दुगुना कर दें; और वह उत्प्रेरक जो पहाड़ी को दोनों ओर से एक साथ नीचा करता है और इसलिए बदलता है कि साम्य कब आएगा, यह नहीं कि कहाँ।",
      mr: "रसायनाचा तो अर्धा भाग जो उष्मागतिकी सोडून देते: हिऱ्याने उष्मागतिकीच्या दृष्टीने ग्रॅफाइट बनायलाच हवे आणि तो बनत नाही, कारण मुक्त ऊर्जा बदलात कुठेही लिहिलेले नाही की किती वेळात. असा वेग नियम जो प्रयोगाने शोधावा लागतो कारण तो संतुलित समीकरणावरून वाचता येत नाही, आणि ज्याच्या घाती म्हणून एखाद्या यंत्रणेचा पुरावा आहेत, कृतीची पुनरुक्ती नव्हे; असा स्थिरांक ज्याची एकके कोटीसोबत बदलतात, जी सूचना आहे की तो एक राशी नसून एक कुळ आहे; ती टेकडी जिच्यावर अभिक्रियकांना पडण्याआधी चढावे लागते, म्हणून जी अभिक्रिया ऊर्जा देते तिलाही सुरू होण्यास काहीशी लागू शकते; इतकी तीक्ष्ण तापमान-अवलंबिता की दहा अंश वेग दुप्पट करावेत; आणि तो उत्प्रेरक जो टेकडी दोन्ही बाजूंनी एकाच वेळी खाली आणतो आणि म्हणून बदलतो की समतोल कधी येईल, हे नाही की कुठे.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "rate-law-and-order",
        name: {
          en: "The rate law and order of reaction",
          hi: "वेग नियम और अभिक्रिया की कोटि",
          mr: "वेग नियम आणि अभिक्रियेची कोटी",
        },
        kind: "rate concept",
        prompt: {
          en: "An equation showing how the rate depends on the concentrations, with exponents that must be found by measurement and which frequently do not match the coefficients in the balanced equation at all. What is this?",
          hi: "ऐसा समीकरण जो दिखाता है कि वेग सांद्रताओं पर कैसे निर्भर है, जिसकी घातें माप से खोजनी पड़ती हैं और जो प्रायः संतुलित समीकरण के गुणांकों से मेल खाती ही नहीं। यह क्या है?",
          mr: "असे समीकरण जे दाखवते की वेग संहतींवर कसा अवलंबून आहे, ज्याच्या घाती मापनाने शोधाव्या लागतात आणि ज्या बहुधा संतुलित समीकरणाच्या गुणकांशी जुळतच नाहीत. हे काय आहे?",
        },
        statement: {
          en: "The rate law expresses the rate as k[A]^x[B]^y with x and y determined experimentally, and their sum is the order of the reaction.",
          hi: "वेग नियम वेग को k[A]^x[B]^y के रूप में व्यक्त करता है जिसमें x और y प्रयोग से तय होते हैं, और उनका योग अभिक्रिया की कोटि है।",
          mr: "वेग नियम वेगाला k[A]^x[B]^y या रूपात मांडतो जिथे x आणि y प्रयोगाने ठरतात, आणि त्यांची बेरीज अभिक्रियेची कोटी आहे.",
        },
        detail: {
          en: "Order is a property of the mechanism while the coefficients are a property of the bookkeeping, so a reaction written with a 2 in front of a reactant may still be first order in it.",
          hi: "कोटि क्रियाविधि का गुण है जबकि गुणांक हिसाब का गुण हैं, अतः जिस अभिक्रिया के किसी अभिकारक के आगे 2 लिखा हो वह उसमें प्रथम कोटि की हो सकती है।",
          mr: "कोटी ही यंत्रणेचा गुणधर्म आहे तर गुणक हिशेबाचा गुणधर्म आहेत, म्हणून ज्या अभिक्रियेच्या एखाद्या अभिक्रियकासमोर 2 लिहिलेले असेल ती त्यात प्रथम कोटीची असू शकते.",
        },
        extra: {
          en: "It can be zero or even fractional, which no molecular count could ever be, and that alone shows the exponents are not counting molecules colliding but describing a many-step process from outside.",
          hi: "वह शून्य या भिन्नात्मक तक हो सकती है, जो कोई आणविक गिनती कभी नहीं हो सकती, और यही अकेला दिखा देता है कि घातें टकराते अणु नहीं गिन रहीं बल्कि बहु-चरण प्रक्रिया को बाहर से बता रही हैं।",
          mr: "ती शून्य वा अपूर्णांकीही असू शकते, जी कोणतीही रेणवीय मोजणी कधीच असू शकत नाही, आणि हेच एकटे दाखवते की घाती आदळणारे रेणू मोजत नसून बहु-पायरी प्रक्रियेचे बाहेरून वर्णन करत आहेत.",
        },
        pair: {
          left: {
            en: "Found by experiment, never read off the equation",
            hi: "प्रयोग से खोजी गई, समीकरण से कभी नहीं पढ़ी गई",
            mr: "प्रयोगाने शोधलेली, समीकरणावरून कधीच वाचलेली नाही",
          },
          right: {
            en: "the rate law and order of reaction",
            hi: "वेग नियम और अभिक्रिया की कोटि",
            mr: "वेग नियम आणि अभिक्रियेची कोटी",
          },
        },
      },
      {
        id: "rate-constant",
        name: {
          en: "The rate constant",
          hi: "वेग स्थिरांक",
          mr: "वेग स्थिरांक",
        },
        kind: "rate concept",
        prompt: {
          en: "The proportionality factor in a rate law, unchanged by how much of anything is present but changed sharply by temperature — and whose very units give away the order of the reaction. What is it?",
          hi: "वेग नियम का समानुपात गुणक, जो कितना कुछ मौजूद है इससे नहीं बदलता पर ताप से तीखेपन से बदलता है — और जिसके मात्रक ही अभिक्रिया की कोटि बता देते हैं। यह क्या है?",
          mr: "वेग नियमातील समानुपात गुणक, जो किती काही उपस्थित आहे याने बदलत नाही पण तापमानाने तीव्रपणे बदलतो — आणि ज्याची एककेच अभिक्रियेची कोटी सांगून टाकतात. हा काय आहे?",
        },
        statement: {
          en: "The rate constant k is the rate when every concentration is unity, independent of concentration but strongly dependent on temperature and on the presence of a catalyst.",
          hi: "वेग स्थिरांक k वह वेग है जब हर सांद्रता एकांक हो, जो सांद्रता से स्वतंत्र है पर ताप और उत्प्रेरक की उपस्थिति पर प्रबल रूप से निर्भर।",
          mr: "वेग स्थिरांक k म्हणजे तो वेग जेव्हा प्रत्येक संहती एकक असेल, जो संहतीपासून स्वतंत्र आहे पण तापमानावर आणि उत्प्रेरकाच्या उपस्थितीवर तीव्रपणे अवलंबून.",
        },
        detail: {
          en: "Its units change with the order — s⁻¹ for first order, L mol⁻¹ s⁻¹ for second — so quoting a rate constant without saying the order is like quoting a length without saying whether it is metres or feet.",
          hi: "उसके मात्रक कोटि के साथ बदलते हैं — प्रथम कोटि के लिए s⁻¹, द्वितीय के लिए L mol⁻¹ s⁻¹ — अतः कोटि बताए बिना वेग स्थिरांक बताना ऐसा है जैसे यह कहे बिना लंबाई बताना कि वह मीटर में है या फुट में।",
          mr: "त्याची एकके कोटीसोबत बदलतात — प्रथम कोटीसाठी s⁻¹, द्वितीयसाठी L mol⁻¹ s⁻¹ — म्हणून कोटी न सांगता वेग स्थिरांक सांगणे म्हणजे मीटरमध्ये आहे की फुटांत हे न सांगता लांबी सांगण्यासारखे.",
        },
        extra: {
          en: "It is a constant only with respect to concentration, which is exactly the sense in which it is useful: it lets a rate measured at one concentration predict the rate at another without repeating the experiment.",
          hi: "वह केवल सांद्रता के सापेक्ष स्थिरांक है, और ठीक उसी अर्थ में वह काम का है: वह एक सांद्रता पर नापे गए वेग से दूसरी सांद्रता का वेग बता देता है, प्रयोग दोहराए बिना।",
          mr: "तो केवळ संहतीच्या सापेक्ष स्थिरांक आहे, आणि नेमक्या त्याच अर्थाने तो उपयुक्त आहे: तो एका संहतीवर मोजलेल्या वेगावरून दुसऱ्या संहतीचा वेग सांगतो, प्रयोग पुन्हा न करता.",
        },
        pair: {
          left: {
            en: "Its units confess the order",
            hi: "उसके मात्रक कोटि उगल देते हैं",
            mr: "त्याची एकके कोटी सांगून टाकतात",
          },
          right: {
            en: "the rate constant",
            hi: "वेग स्थिरांक",
            mr: "वेग स्थिरांक",
          },
        },
      },
      {
        id: "first-order-half-life",
        name: {
          en: "The half-life of a first-order reaction",
          hi: "प्रथम कोटि अभिक्रिया की अर्धायु",
          mr: "प्रथम कोटी अभिक्रियेचे अर्धायुष्य",
        },
        kind: "rate concept",
        prompt: {
          en: "The time in which half of what is present is used up, and which for one particular order comes out the same whether you start with a gram or a tonne. Which quantity is this?",
          hi: "वह समय जिसमें जो मौजूद है उसका आधा खप जाता है, और जो एक विशेष कोटि के लिए एक जैसा निकलता है, चाहे तुम एक ग्राम से शुरू करो या एक टन से। यह कौन-सी राशि है?",
          mr: "तो काळ ज्यात जे उपस्थित आहे त्याचा निम्मा खर्च होतो, आणि जो एका विशिष्ट कोटीसाठी सारखाच निघतो, तुम्ही एका ग्रॅमपासून सुरू करा वा एका टनापासून. ही कोणती राशी?",
        },
        statement: {
          en: "The half-life of a first-order reaction is t½ = 0.693/k, independent of the starting concentration, so successive halvings take equal times.",
          hi: "प्रथम कोटि अभिक्रिया की अर्धायु t½ = 0.693/k है, जो आरंभिक सांद्रता से स्वतंत्र है, अतः लगातार आधे होने में बराबर समय लगता है।",
          mr: "प्रथम कोटी अभिक्रियेचे अर्धायुष्य t½ = 0.693/k आहे, जे प्रारंभिक संहतीपासून स्वतंत्र आहे, म्हणून लागोपाठ निम्मे होण्यास समान काळ लागतो.",
        },
        detail: {
          en: "The independence is the signature of first order and of no other: a zero-order half-life halves as the concentration halves, and a second-order one doubles.",
          hi: "यह स्वतंत्रता प्रथम कोटि की पहचान है और किसी और की नहीं: शून्य कोटि की अर्धायु सांद्रता आधी होते ही आधी हो जाती है, और द्वितीय कोटि की दुगुनी।",
          mr: "हे स्वातंत्र्य प्रथम कोटीची खूण आहे आणि दुसऱ्या कोणाचीही नाही: शून्य कोटीचे अर्धायुष्य संहती निम्मी होताच निम्मे होते, आणि द्वितीय कोटीचे दुप्पट.",
        },
        extra: {
          en: "It is the same mathematics as radioactive decay, and for the same reason: in both, each individual has a fixed chance of reacting per second regardless of how many neighbours it has.",
          hi: "यह रेडियोऐक्टिव क्षय जैसा ही गणित है, और उसी कारण से: दोनों में हर व्यक्ति के प्रति सेकंड अभिक्रिया करने की संभावना नियत है, चाहे उसके कितने भी पड़ोसी हों।",
          mr: "हे किरणोत्सर्गी क्षयासारखेच गणित आहे, आणि त्याच कारणाने: दोन्हींत प्रत्येक व्यक्तीची दर सेकंदाला अभिक्रिया करण्याची शक्यता ठराविक आहे, त्याला कितीही शेजारी असोत.",
        },
        pair: {
          left: {
            en: "The same whether you start with a gram or a tonne",
            hi: "एक जैसी, चाहे ग्राम से शुरू करो या टन से",
            mr: "सारखेच, ग्रॅमपासून सुरू करा वा टनापासून",
          },
          right: {
            en: "the half-life of a first-order reaction",
            hi: "प्रथम कोटि अभिक्रिया की अर्धायु",
            mr: "प्रथम कोटी अभिक्रियेचे अर्धायुष्य",
          },
        },
      },
      {
        id: "activation-energy",
        name: {
          en: "Activation energy",
          hi: "सक्रियण ऊर्जा",
          mr: "सक्रियण ऊर्जा",
        },
        kind: "what changes the rate",
        prompt: {
          en: "The barrier that must be climbed before bonds can be rearranged, which is why a mixture of petrol and air sits in a tank for months and then burns in a millisecond once a spark supplies the first push. What is it?",
          hi: "वह अवरोध जिस पर चढ़े बिना बंध फिर से जमाए नहीं जा सकते, इसीलिए पेट्रोल और हवा का मिश्रण टंकी में महीनों पड़ा रहता है और चिनगारी पहला धक्का देते ही मिलीसेकंड में जल जाता है। यह क्या है?",
          mr: "तो अडसर ज्यावर चढल्याशिवाय बंध पुन्हा मांडता येत नाहीत, म्हणूनच पेट्रोल आणि हवेचे मिश्रण टाकीत महिने पडून राहते आणि ठिणगी पहिला धक्का देताच मिलिसेकंदात जळते. हे काय आहे?",
        },
        statement: {
          en: "Activation energy is the minimum energy a colliding pair must have for reaction, measured from the reactants up to the top of the barrier and not from the products.",
          hi: "सक्रियण ऊर्जा वह न्यूनतम ऊर्जा है जो टकराते युग्म के पास अभिक्रिया के लिए होनी चाहिए, जो अभिकारकों से अवरोध की चोटी तक नापी जाती है, उत्पादों से नहीं।",
          mr: "सक्रियण ऊर्जा म्हणजे ती किमान ऊर्जा जी आदळणाऱ्या जोडीकडे अभिक्रियेसाठी असावी लागते, जी अभिक्रियकांपासून अडसराच्या शिखरापर्यंत मोजली जाते, उत्पादनांपासून नाही.",
        },
        detail: {
          en: "It is entirely separate from the enthalpy change: a strongly exothermic reaction can have a huge barrier and be immeasurably slow, which is why diamond has not turned into graphite.",
          hi: "यह एन्थैल्पी परिवर्तन से पूरी तरह अलग है: प्रबल ऊष्माक्षेपी अभिक्रिया का अवरोध विशाल हो सकता है और वह अनापनीय रूप से धीमी हो सकती है, इसीलिए हीरा ग्रैफ़ाइट नहीं बना है।",
          mr: "हे एन्थॅल्पी बदलापासून पूर्णपणे वेगळे आहे: तीव्र उष्माक्षेपी अभिक्रियेचा अडसर प्रचंड असू शकतो आणि ती अमापनीयरीत्या सावकाश असू शकते, म्हणूनच हिरा ग्रॅफाइट बनलेला नाही.",
        },
        extra: {
          en: "The forward and reverse barriers differ by exactly the enthalpy change, so knowing two of the three fixes the third and the energy profile can be drawn from either end.",
          hi: "अग्र और प्रतीप अवरोध ठीक एन्थैल्पी परिवर्तन जितने भिन्न हैं, अतः तीन में से दो जानने पर तीसरा तय हो जाता है और ऊर्जा-रूपरेखा किसी भी सिरे से खींची जा सकती है।",
          mr: "अग्र आणि प्रतीप अडसर नेमक्या एन्थॅल्पी बदलाइतके वेगळे आहेत, म्हणून तिघांपैकी दोन जाणल्यास तिसरा ठरतो आणि ऊर्जा-आराखडा कोणत्याही टोकाकडून काढता येतो.",
        },
        pair: {
          left: {
            en: "Why a tank of petrol is safe until it is not",
            hi: "इसीलिए पेट्रोल की टंकी तब तक सुरक्षित है जब तक नहीं है",
            mr: "म्हणूनच पेट्रोलची टाकी तोवर सुरक्षित जोवर नाही",
          },
          right: {
            en: "activation energy",
            hi: "सक्रियण ऊर्जा",
            mr: "सक्रियण ऊर्जा",
          },
        },
      },
      {
        id: "arrhenius-temperature-dependence",
        name: {
          en: "The Arrhenius dependence on temperature",
          hi: "ताप पर आरेनियस निर्भरता",
          mr: "तापमानावरील अरेनियस अवलंबिता",
        },
        kind: "what changes the rate",
        prompt: {
          en: "Raising the temperature by ten degrees near room temperature roughly doubles most rates, although the molecules are moving only about two per cent faster. Which relation accounts for that mismatch?",
          hi: "कमरे के ताप के पास ताप दस अंश बढ़ाने से अधिकांश वेग मोटे तौर पर दुगुने हो जाते हैं, यद्यपि अणु केवल लगभग दो प्रतिशत तेज़ चल रहे होते हैं। उस बेमेल का हिसाब कौन-सा संबंध देता है?",
          mr: "खोलीच्या तापमानाजवळ तापमान दहा अंशांनी वाढवल्याने बहुतांश वेग ढोबळमानाने दुप्पट होतात, जरी रेणू केवळ सुमारे दोन टक्के वेगाने जात असले तरी. त्या विजोडपणाचा हिशेब कोणता संबंध देतो?",
        },
        statement: {
          en: "The Arrhenius dependence is k = A e^(−Ea/RT), so the rate constant depends exponentially on temperature through the fraction of collisions energetic enough to react.",
          hi: "आरेनियस निर्भरता k = A e^(−Ea/RT) है, अतः वेग स्थिरांक ताप पर चरघातांकी रूप से निर्भर है, उन टक्करों के अंश के माध्यम से जो अभिक्रिया करने लायक़ ऊर्जावान हैं।",
          mr: "अरेनियस अवलंबिता k = A e^(−Ea/RT) आहे, म्हणून वेग स्थिरांक तापमानावर घातांकीरीत्या अवलंबून आहे, अभिक्रिया करण्याइतक्या ऊर्जावान टकरांच्या अंशामार्गे.",
        },
        detail: {
          en: "The steepness comes from the exponential and not from faster motion: heating shifts only a little of the energy distribution, but it is the far tail above Ea that matters and that tail can double.",
          hi: "तीखापन चरघातांक से आता है, तेज़ गति से नहीं: गर्म करने से ऊर्जा वितरण का थोड़ा ही खिसकता है, पर मायने Ea से ऊपर वाली दूर की पूँछ रखती है और वह पूँछ दुगुनी हो सकती है।",
          mr: "तीक्ष्णपणा घातांकातून येतो, वेगवान गतीतून नाही: तापवल्याने ऊर्जा वितरणाचा थोडाच सरकतो, पण महत्त्वाची Ea च्या वरची दूरची शेपूट आहे आणि ती शेपूट दुप्पट होऊ शकते.",
        },
        extra: {
          en: "Plotting log k against 1/T gives a straight line whose slope is −Ea/2.303R, which is how activation energies are measured — from two rate constants at two temperatures and nothing else.",
          hi: "log k को 1/T के विरुद्ध खींचने पर सरल रेखा मिलती है जिसकी प्रवणता −Ea/2.303R है, और सक्रियण ऊर्जाएँ इसी तरह नापी जाती हैं — दो तापों पर दो वेग स्थिरांकों से और किसी चीज़ से नहीं।",
          mr: "log k हे 1/T विरुद्ध काढल्यास सरळ रेषा मिळते जिचा उतार −Ea/2.303R आहे, आणि सक्रियण ऊर्जा अशाच मोजल्या जातात — दोन तापमानांवरील दोन वेग स्थिरांकांतून आणि दुसऱ्या कशातूनही नाही.",
        },
        pair: {
          left: {
            en: "Two per cent faster, twice as fast a reaction",
            hi: "दो प्रतिशत तेज़ गति, दुगुनी तेज़ अभिक्रिया",
            mr: "दोन टक्के वेगवान गती, दुप्पट वेगवान अभिक्रिया",
          },
          right: {
            en: "the Arrhenius dependence on temperature",
            hi: "ताप पर आरेनियस निर्भरता",
            mr: "तापमानावरील अरेनियस अवलंबिता",
          },
        },
      },
      {
        id: "catalyst",
        name: {
          en: "The catalyst",
          hi: "उत्प्रेरक",
          mr: "उत्प्रेरक",
        },
        kind: "what changes the rate",
        prompt: {
          en: "Something that provides a different route with a lower barrier, is recovered unchanged at the end, and speeds the reverse reaction by exactly the same factor as the forward one. What is it?",
          hi: "ऐसी चीज़ जो कम अवरोध वाला भिन्न रास्ता देती है, अंत में अपरिवर्तित लौट आती है, और प्रतीप अभिक्रिया को ठीक उतने ही गुणक से तेज़ करती है जितने से अग्र को। यह क्या है?",
          mr: "अशी गोष्ट जी कमी अडसराचा वेगळा मार्ग देते, शेवटी अपरिवर्तित परत मिळते, आणि प्रतीप अभिक्रिया नेमक्या तितक्याच पटीने वेगवान करते जितक्याने अग्र. ती काय आहे?",
        },
        statement: {
          en: "A catalyst provides an alternative path of lower activation energy and is regenerated unchanged, so it alters the rate without being consumed or appearing in the overall equation.",
          hi: "उत्प्रेरक कम सक्रियण ऊर्जा का वैकल्पिक पथ देता है और अपरिवर्तित पुनर्जनित होता है, अतः वह वेग बदलता है बिना खपे और बिना समग्र समीकरण में आए।",
          mr: "उत्प्रेरक कमी सक्रियण ऊर्जेचा पर्यायी मार्ग देतो आणि अपरिवर्तित पुनर्निर्मित होतो, म्हणून तो वेग बदलतो, न खर्च होता आणि एकूण समीकरणात न येता.",
        },
        detail: {
          en: "It lowers the barrier from both sides by the same amount, so the forward and reverse rates rise by the same factor and the position of equilibrium is left exactly where it was.",
          hi: "वह अवरोध को दोनों ओर से उतना ही नीचा करता है, अतः अग्र और प्रतीप वेग उसी गुणक से बढ़ते हैं और साम्य की स्थिति ठीक वहीं रहती है जहाँ थी।",
          mr: "तो अडसर दोन्ही बाजूंनी तितकाच खाली आणतो, म्हणून अग्र आणि प्रतीप वेग त्याच पटीने वाढतात आणि समतोलाची जागा नेमकी तिथेच राहते जिथे होती.",
        },
        extra: {
          en: "That is why a catalyst can only bring forward a reaction that was going to happen anyway, and why no catalyst has ever been found for a reaction with a positive free energy change.",
          hi: "इसीलिए उत्प्रेरक केवल उस अभिक्रिया को जल्दी ला सकता है जो वैसे भी होने वाली थी, और इसीलिए धनात्मक मुक्त ऊर्जा परिवर्तन वाली अभिक्रिया के लिए कोई उत्प्रेरक आज तक नहीं मिला।",
          mr: "म्हणूनच उत्प्रेरक केवळ त्या अभिक्रियेला लवकर आणू शकतो जी तसेही होणार होती, आणि म्हणूनच धन मुक्त ऊर्जा बदल असलेल्या अभिक्रियेसाठी कोणताही उत्प्रेरक आजवर सापडलेला नाही.",
        },
        pair: {
          left: {
            en: "Changes when equilibrium arrives, never where",
            hi: "बदलता है कि साम्य कब आएगा, कभी नहीं कि कहाँ",
            mr: "बदलतो की समतोल कधी येईल, कधीच नाही की कुठे",
          },
          right: {
            en: "the catalyst",
            hi: "उत्प्रेरक",
            mr: "उत्प्रेरक",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "For the reaction 2NO + O₂ → 2NO₂ the rate law is found to be k[NO]²[O₂], which matches the coefficients. For CH₃COOC₂H₅ + H₂O → acid + alcohol in dilute solution the rate law is k[ester], although water appears in the equation. Explain both, and say what order and molecularity are.",
          hi: "अभिक्रिया 2NO + O₂ → 2NO₂ के लिए वेग नियम k[NO]²[O₂] पाया जाता है, जो गुणांकों से मेल खाता है। तनु विलयन में CH₃COOC₂H₅ + H₂O → अम्ल + ऐल्कोहॉल के लिए वेग नियम k[एस्टर] है, यद्यपि समीकरण में पानी आता है। दोनों समझाओ, और बताओ कि कोटि और आणविकता क्या हैं।",
          mr: "अभिक्रिया 2NO + O₂ → 2NO₂ साठी वेग नियम k[NO]²[O₂] आढळतो, जो गुणकांशी जुळतो. विरळ द्रावणात CH₃COOC₂H₅ + H₂O → आम्ल + अल्कोहोल साठी वेग नियम k[एस्टर] आहे, जरी समीकरणात पाणी येते. दोन्ही समजावा, आणि कोटी व रेणुकता म्हणजे काय ते सांगा.",
        },
        choices: [
          {
            en: "Order is experimental and describes the observed dependence; molecularity counts the particles in a single elementary step and can only be a small whole number. The first rate law matches the coefficients by coincidence — because that reaction happens in one step. The ester hydrolysis does not: water is present in vast excess, so its concentration barely changes as the reaction runs and its effect is absorbed into k. The reaction is genuinely second order but behaves as first order under these conditions, which is called PSEUDO first order. Matching coefficients is therefore evidence for a one-step mechanism, and a mismatch is evidence against it",
            hi: "कोटि प्रायोगिक है और देखी गई निर्भरता बताती है; आणविकता एक ही प्रारंभिक चरण के कणों को गिनती है और केवल छोटा पूर्णांक हो सकती है। पहला वेग नियम गुणांकों से संयोग से मेल खाता है — क्योंकि वह अभिक्रिया एक ही चरण में होती है। एस्टर का जल-अपघटन नहीं: पानी विशाल अधिकता में है, अतः अभिक्रिया चलते समय उसकी सांद्रता मुश्किल से बदलती है और उसका प्रभाव k में समा जाता है। अभिक्रिया वस्तुतः द्वितीय कोटि की है पर इन शर्तों में प्रथम कोटि जैसी बरतती है, और इसे छद्म प्रथम कोटि कहते हैं। अतः गुणांकों का मेल एक-चरण क्रियाविधि का प्रमाण है, और बेमेल उसके विरुद्ध प्रमाण",
            mr: "कोटी प्रायोगिक आहे आणि निरीक्षिलेले अवलंबित्व सांगते; रेणुकता एकाच प्राथमिक पायरीतले कण मोजते आणि केवळ लहान पूर्णांक असू शकते. पहिला वेग नियम गुणकांशी योगायोगाने जुळतो — कारण ती अभिक्रिया एकाच पायरीत घडते. एस्टरचे जलअपघटन नाही: पाणी प्रचंड अधिकतेत आहे, म्हणून अभिक्रिया चालताना त्याची संहती जेमतेम बदलते आणि त्याचा परिणाम k मध्ये सामावतो. अभिक्रिया प्रत्यक्षात द्वितीय कोटीची आहे पण या अटींत प्रथम कोटीसारखी वागते, आणि याला छद्म प्रथम कोटी म्हणतात. म्हणून गुणकांचे जुळणे एक-पायरी यंत्रणेचा पुरावा आहे, आणि विजोड त्याविरुद्ध पुरावा",
          },
          {
            en: "The ester reaction is first order because water is a solvent and solvents never appear in rate laws, which is a general rule with no exceptions",
            hi: "एस्टर की अभिक्रिया प्रथम कोटि की है क्योंकि पानी विलायक है और विलायक वेग नियमों में कभी नहीं आते, और यह बिना अपवाद का सामान्य नियम है",
            mr: "एस्टरची अभिक्रिया प्रथम कोटीची आहे कारण पाणी द्रावक आहे आणि द्रावक वेग नियमांत कधीच येत नाहीत, आणि हा अपवादाविना सर्वसाधारण नियम आहे",
          },
          {
            en: "Order and molecularity are two names for the same thing, and the ester result must therefore be an experimental error",
            hi: "कोटि और आणविकता एक ही चीज़ के दो नाम हैं, अतः एस्टर वाला परिणाम प्रायोगिक त्रुटि ही होगी",
            mr: "कोटी आणि रेणुकता ही एकाच गोष्टीची दोन नावे आहेत, म्हणून एस्टरचा निकाल प्रायोगिक चूकच असावी",
          },
          {
            en: "The rate law can always be written from the balanced equation, and the ester case differs only because the equation is usually written without its catalyst",
            hi: "वेग नियम सदा संतुलित समीकरण से लिखा जा सकता है, और एस्टर वाली स्थिति केवल इसलिए भिन्न है कि समीकरण प्रायः अपने उत्प्रेरक के बिना लिखा जाता है",
            mr: "वेग नियम नेहमी संतुलित समीकरणावरून लिहिता येतो, आणि एस्टरची स्थिती केवळ यासाठी वेगळी की समीकरण बहुधा त्याच्या उत्प्रेरकाविना लिहिले जाते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The habit this question is trying to break is reading a rate law off a balanced equation, and the two examples are chosen because one appears to license the habit and the other refutes it. FIRST, THE TWO WORDS. MOLECULARITY is the number of species that must come together in a SINGLE elementary step — one for a decomposition, two for a collision, three for the rare simultaneous three-body encounter. It is a theoretical count about a step nobody sees directly, and it must be a small positive whole number, because you cannot have half a molecule colliding. ORDER is the sum of the exponents in the experimentally measured rate law. It is a description of what a graph does, it can be zero, fractional or even negative, and it belongs to the reaction as a whole rather than to any one step. The two coincide only for a reaction that happens in one step, and that coincidence is exactly the information a kineticist is after. NOW 2NO + O₂. The measured law k[NO]²[O₂] is third order and matches the coefficients. That is consistent with the reaction happening in a single termolecular step, and for this reaction it is believed to be roughly what happens. But note the direction of the inference: the experiment came first and the mechanism was fitted to it. Had the measured law come out k[NO]², nobody would have been entitled to insist on the coefficients. NOW THE ESTER. Written out, the reaction consumes one ester and one water. Measure the rate and it depends on the ester alone. There is nothing wrong with the measurement, and water is certainly involved — it ends up in the products. What has happened is that the experiment was done in dilute aqueous solution, where water is present at about 55 mol/L against perhaps 0.01 mol/L of ester. Even when every ester molecule has reacted, the water concentration has fallen by less than a fiftieth of one per cent. A quantity that does not change cannot show up as a dependence, so [H₂O] behaves as a constant and is quietly absorbed into k. The true law is rate = k'[ester][H₂O]; what is measured is rate = k[ester] with k = k'[H₂O]. The reaction is second order and pseudo first order under these conditions. The word 'pseudo' is doing honest work: it records that the observed simplicity is a property of the experiment and not of the chemistry, and it warns that the same reaction run in a non-aqueous solvent with limited water would show the second-order behaviour plainly. Two consequences worth carrying. First, a rate law is evidence about mechanism and nothing else — the exponents are a fingerprint, and a mismatch with the coefficients proves the reaction takes more than one step. A reaction with a coefficient of 4 in front of a reactant is essentially never fourth order in it, because a four-body simultaneous collision is vanishingly rare; the mechanism must be a sequence, and the rate law reports whichever step is slowest. Second, pseudo-order conditions are a deliberate technique, not an accident: flooding a system with all but one reactant is how a complicated rate law is taken apart one variable at a time, and it is called the isolation method for that reason. (The second option turns a useful approximation into a law without exceptions; the third denies a distinction the chapter is built on; the fourth is the very habit the question exists to break.)",
          hi: "यह प्रश्न जिस आदत को तोड़ना चाहता है वह है संतुलित समीकरण से वेग नियम पढ़ लेना, और दोनों उदाहरण इसलिए चुने गए कि एक उस आदत को जायज़ ठहराता दिखता है और दूसरा उसे झुठलाता है। पहले, दो शब्द। आणविकता उन स्पीशीज़ की संख्या है जिन्हें एक ही प्रारंभिक चरण में साथ आना पड़े — वियोजन के लिए एक, टक्कर के लिए दो, दुर्लभ एक साथ तीन-पिंड मुलाक़ात के लिए तीन। यह ऐसे चरण के बारे में सैद्धांतिक गिनती है जिसे कोई सीधे देखता नहीं, और वह छोटा धन पूर्णांक होनी ही चाहिए, क्योंकि आधा अणु टकरा नहीं सकता। कोटि प्रयोग से नापे गए वेग नियम की घातों का योग है। वह इस बात का वर्णन है कि ग्राफ़ क्या करता है, वह शून्य, भिन्नात्मक या ऋणात्मक तक हो सकती है, और वह किसी एक चरण की नहीं बल्कि पूरी अभिक्रिया की है। दोनों केवल उस अभिक्रिया के लिए मिलते हैं जो एक ही चरण में होती है, और वही मेल वह सूचना है जिसके पीछे बलगतिकीविद् है। अब 2NO + O₂. नापा गया नियम k[NO]²[O₂] तृतीय कोटि का है और गुणांकों से मेल खाता है। यह इस बात से संगत है कि अभिक्रिया एक ही त्रिअणुक चरण में होती है, और इस अभिक्रिया के लिए माना जाता है कि मोटे तौर पर यही होता है। पर अनुमान की दिशा पर ध्यान दो: प्रयोग पहले आया और क्रियाविधि उससे मिलाई गई। यदि नापा गया नियम k[NO]² निकलता, तो किसी को गुणांकों पर अड़ने का अधिकार न होता। अब एस्टर। लिखने पर अभिक्रिया एक एस्टर और एक पानी खपाती है। वेग नापो और वह अकेले एस्टर पर निर्भर है। माप में कुछ ग़लत नहीं, और पानी निश्चय ही शामिल है — वह उत्पादों में पहुँचता है। जो हुआ वह यह कि प्रयोग तनु जलीय विलयन में किया गया, जहाँ पानी लगभग 55 mol/L पर है और एस्टर शायद 0.01 mol/L पर। हर एस्टर अणु के अभिक्रिया कर लेने पर भी पानी की सांद्रता एक प्रतिशत के पचासवें भाग से भी कम गिरी है। जो राशि बदलती नहीं वह निर्भरता के रूप में दिख नहीं सकती, अतः [H₂O] स्थिरांक की तरह बरतता है और चुपचाप k में समा जाता है। सच्चा नियम वेग = k'[एस्टर][H₂O] है; जो नापा जाता है वह वेग = k[एस्टर] है जिसमें k = k'[H₂O]. अभिक्रिया द्वितीय कोटि की है और इन शर्तों में छद्म प्रथम कोटि की। 'छद्म' शब्द ईमानदार काम कर रहा है: वह दर्ज करता है कि देखी गई सरलता प्रयोग का गुण है, रसायन का नहीं, और चेताता है कि वही अभिक्रिया सीमित पानी वाले अजलीय विलायक में चलाई जाए तो द्वितीय कोटि का आचरण साफ़ दिखा देगी। साथ ले जाने योग्य दो परिणाम। पहला, वेग नियम क्रियाविधि का प्रमाण है और कुछ नहीं — घातें एक अंगुलिचिह्न हैं, और गुणांकों से बेमेल सिद्ध करता है कि अभिक्रिया एक से अधिक चरण लेती है। जिस अभिक्रिया में किसी अभिकारक के आगे 4 का गुणांक हो वह उसमें चतुर्थ कोटि की वस्तुतः कभी नहीं होती, क्योंकि चार पिंडों की एक साथ टक्कर लुप्तप्राय दुर्लभ है; क्रियाविधि को अनुक्रम होना ही पड़ेगा, और वेग नियम बताता है कि उनमें सबसे धीमा चरण कौन-सा है। दूसरा, छद्म-कोटि शर्तें जान-बूझकर अपनाई गई तकनीक हैं, संयोग नहीं: एक को छोड़कर सारे अभिकारकों से तंत्र को भर देना ही वह रास्ता है जिससे उलझा वेग नियम एक-एक चर करके खोला जाता है, और उसी कारण उसे पृथक्करण विधि कहते हैं। (दूसरा विकल्प काम के सन्निकटन को बिना अपवाद के नियम बना देता है; तीसरा उस भेद से इनकार करता है जिस पर अध्याय खड़ा है; चौथा वही आदत है जिसे तोड़ने के लिए प्रश्न है।)",
          mr: "हा प्रश्न ज्या सवयीला मोडू पाहतो ती म्हणजे संतुलित समीकरणावरून वेग नियम वाचून टाकणे, आणि दोन्ही उदाहरणे यासाठी निवडली की एक त्या सवयीला रास्त ठरवताना दिसते आणि दुसरे तिला खोडते. आधी, दोन शब्द. रेणुकता म्हणजे त्या जातींची संख्या ज्यांना एकाच प्राथमिक पायरीत एकत्र यावे लागते — विघटनासाठी एक, टकरीसाठी दोन, दुर्मीळ एकाच वेळी तीन-पदार्थ भेटीसाठी तीन. ही अशा पायरीबद्दलची सैद्धांतिक मोजणी आहे जिला कोणी थेट पाहत नाही, आणि ती लहान धन पूर्णांक असलीच पाहिजे, कारण अर्धा रेणू आदळू शकत नाही. कोटी म्हणजे प्रयोगाने मोजलेल्या वेग नियमातील घातींची बेरीज. ती आलेख काय करतो याचे वर्णन आहे, ती शून्य, अपूर्णांकी वा ऋणही असू शकते, आणि ती कोणत्याही एका पायरीची नसून अख्ख्या अभिक्रियेची आहे. दोन्ही केवळ त्या अभिक्रियेसाठी जुळतात जी एकाच पायरीत घडते, आणि तेच जुळणे ही ती माहिती जिच्या मागे गतिकीतज्ज्ञ आहे. आता 2NO + O₂. मोजलेला नियम k[NO]²[O₂] तृतीय कोटीचा आहे आणि गुणकांशी जुळतो. हे अभिक्रिया एकाच त्रिरेणुक पायरीत घडते याच्याशी सुसंगत आहे, आणि या अभिक्रियेसाठी ढोबळमानाने तेच घडते असे मानले जाते. पण अनुमानाची दिशा लक्षात घ्या: प्रयोग आधी आला आणि यंत्रणा त्याच्याशी जुळवली गेली. मोजलेला नियम k[NO]² निघाला असता, तर कोणालाही गुणकांवर अडून बसण्याचा अधिकार नव्हता. आता एस्टर. लिहिल्यास अभिक्रिया एक एस्टर आणि एक पाणी खर्चते. वेग मोजा आणि तो एकट्या एस्टरवर अवलंबून आहे. मापात काहीही चूक नाही, आणि पाणी नक्कीच सामील आहे — ते उत्पादनांत पोहोचते. जे घडले ते हे की प्रयोग विरळ जलीय द्रावणात केला गेला, जिथे पाणी सुमारे 55 mol/L वर आहे आणि एस्टर कदाचित 0.01 mol/L वर. प्रत्येक एस्टर रेणूने अभिक्रिया केल्यावरही पाण्याची संहती एका टक्क्याच्या पन्नासाव्या भागाहूनही कमी घसरली आहे. जी राशी बदलत नाही ती अवलंबित्वाच्या रूपात दिसू शकत नाही, म्हणून [H₂O] स्थिरांकासारखे वागते आणि मुकाट्याने k मध्ये सामावते. खरा नियम वेग = k'[एस्टर][H₂O] आहे; जे मोजले जाते ते वेग = k[एस्टर] आहे जिथे k = k'[H₂O]. अभिक्रिया द्वितीय कोटीची आहे आणि या अटींत छद्म प्रथम कोटीची. 'छद्म' हा शब्द प्रामाणिक काम करत आहे: तो नोंदवतो की निरीक्षिलेली साधेपणा प्रयोगाचा गुणधर्म आहे, रसायनाचा नाही, आणि इशारा देतो की तीच अभिक्रिया मर्यादित पाणी असलेल्या अजलीय द्रावकात चालवली तर द्वितीय कोटीचे वर्तन स्पष्ट दाखवेल. सोबत न्यायचे दोन परिणाम. पहिला, वेग नियम हा यंत्रणेचा पुरावा आहे आणि दुसरे काही नाही — घाती हे बोटांचे ठसे आहेत, आणि गुणकांशी विजोड सिद्ध करतो की अभिक्रिया एकाहून अधिक पायऱ्या घेते. ज्या अभिक्रियेत एखाद्या अभिक्रियकासमोर 4 चा गुणक असेल ती त्यात चतुर्थ कोटीची प्रत्यक्षात कधीच नसते, कारण चार पदार्थांची एकाच वेळी टक्कर नाहीशी होण्याइतकी दुर्मीळ आहे; यंत्रणा क्रम असलीच पाहिजे, आणि वेग नियम सांगतो की त्यांतली सर्वांत सावकाश पायरी कोणती. दुसरा, छद्म-कोटी अटी या जाणीवपूर्वक स्वीकारलेले तंत्र आहे, योगायोग नव्हे: एक सोडून सर्व अभिक्रियकांनी संस्था भरून टाकणे हाच तो मार्ग ज्याने गुंतागुंतीचा वेग नियम एकेक चल करून उलगडला जातो, आणि त्याच कारणाने त्याला पृथक्करण पद्धत म्हणतात. (दुसरा पर्याय उपयुक्त अंदाजाला अपवादाविना नियम बनवतो; तिसरा ज्या भेदावर प्रकरण उभे आहे तोच नाकारतो; चौथा तीच सवय आहे जी मोडण्यासाठी प्रश्न आहे.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A student proposes that since a catalyst speeds up a reaction, adding one to a reversible reaction at equilibrium will push it towards the products and increase the yield. Assess this, and say precisely what a catalyst does and does not change.",
          hi: "एक विद्यार्थी सुझाव देता है कि चूँकि उत्प्रेरक अभिक्रिया तेज़ करता है, साम्य पर पड़ी उत्क्रमणीय अभिक्रिया में उसे जोड़ना उसे उत्पादों की ओर धकेलेगा और उपज बढ़ाएगा। इसका आकलन करो, और ठीक-ठीक बताओ कि उत्प्रेरक क्या बदलता है और क्या नहीं।",
          mr: "एक विद्यार्थी सुचवतो की उत्प्रेरक अभिक्रिया वेगवान करत असल्याने, समतोलावर असलेल्या उलट करता येणाऱ्या अभिक्रियेत तो जोडल्याने ती उत्पादनांकडे ढकलली जाईल आणि उत्पन्न वाढेल. याचे मूल्यमापन करा, आणि नेमके सांगा की उत्प्रेरक काय बदलतो आणि काय नाही.",
        },
        choices: [
          {
            en: "It will not. A catalyst provides a lower-energy path, and that path is available in BOTH directions — the barrier from the products' side is lowered by exactly the same amount, so the forward and reverse rate constants rise by the same factor. Since K = k_forward/k_reverse, the equilibrium constant is unchanged and so is the yield. What the catalyst changes is the TIME taken to reach equilibrium, which may be the difference between a useful industrial process and one that takes a century. It cannot make a reaction with a positive ΔG happen at all",
            hi: "नहीं धकेलेगा। उत्प्रेरक कम ऊर्जा का पथ देता है, और वह पथ दोनों दिशाओं में उपलब्ध है — उत्पादों की ओर से अवरोध ठीक उतना ही नीचा होता है, अतः अग्र और प्रतीप वेग स्थिरांक उसी गुणक से बढ़ते हैं। चूँकि K = k_अग्र/k_प्रतीप, साम्य स्थिरांक अपरिवर्तित रहता है और उपज भी। उत्प्रेरक जो बदलता है वह साम्य तक पहुँचने में लगा समय है, जो काम के औद्योगिक प्रक्रम और सदी भर लेने वाले प्रक्रम का अंतर हो सकता है। धनात्मक ΔG वाली अभिक्रिया को वह घटित करा ही नहीं सकता",
            mr: "ढकलणार नाही. उत्प्रेरक कमी ऊर्जेचा मार्ग देतो, आणि तो मार्ग दोन्ही दिशांनी उपलब्ध आहे — उत्पादनांच्या बाजूकडून अडसर नेमका तितकाच खाली येतो, म्हणून अग्र आणि प्रतीप वेग स्थिरांक त्याच पटीने वाढतात. K = k_अग्र/k_प्रतीप असल्याने, समतोल स्थिरांक अपरिवर्तित राहतो आणि उत्पन्नही. उत्प्रेरक जे बदलतो ते समतोलापर्यंत पोहोचायला लागलेला काळ, जो उपयुक्त औद्योगिक प्रक्रिया आणि शतकभर घेणारी प्रक्रिया यांतील फरक असू शकतो. धन ΔG असलेली अभिक्रिया तो घडवूच शकत नाही",
          },
          {
            en: "The student is right: a catalyst lowers the forward activation energy only, since it is designed to help the reaction go forwards, and the yield therefore rises",
            hi: "विद्यार्थी सही है: उत्प्रेरक केवल अग्र सक्रियण ऊर्जा घटाता है, क्योंकि वह अभिक्रिया को आगे बढ़ाने में मदद के लिए बना है, अतः उपज बढ़ती है",
            mr: "विद्यार्थी बरोबर आहे: उत्प्रेरक केवळ अग्र सक्रियण ऊर्जा घटवतो, कारण तो अभिक्रिया पुढे नेण्यास मदत करण्यासाठी बनवलेला आहे, म्हणून उत्पन्न वाढते",
          },
          {
            en: "The catalyst leaves both the rate and the yield unchanged and only makes the reaction cleaner by suppressing side products",
            hi: "उत्प्रेरक वेग और उपज दोनों को अपरिवर्तित छोड़ता है और केवल पार्श्व उत्पादों को दबाकर अभिक्रिया को साफ़ बनाता है",
            mr: "उत्प्रेरक वेग आणि उत्पन्न दोन्ही अपरिवर्तित सोडतो आणि केवळ उप-उत्पादने दाबून अभिक्रिया स्वच्छ बनवतो",
          },
          {
            en: "A catalyst does increase the yield, but only for exothermic reactions, because it removes the heat that would otherwise shift the equilibrium backwards",
            hi: "उत्प्रेरक उपज बढ़ाता तो है, पर केवल ऊष्माक्षेपी अभिक्रियाओं के लिए, क्योंकि वह वह ऊष्मा हटा देता है जो अन्यथा साम्य को पीछे खिसका देती",
            mr: "उत्प्रेरक उत्पन्न वाढवतो खरे, पण केवळ उष्माक्षेपी अभिक्रियांसाठी, कारण तो ती उष्णता काढून टाकतो जी अन्यथा समतोल मागे सरकवेल",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The proposal is reasonable and wrong, and seeing exactly where it fails is worth more than the conclusion. Draw the energy profile. Reactants sit at one level, products at another, and between them is a hill whose summit is the transition state. The forward activation energy is the climb from reactants to summit; the reverse is the climb from products to the same summit. Those two are not independent — their difference is fixed at ΔH, the enthalpy change, because the two ends of the profile do not move. Now add a catalyst. It does not tunnel through the hill; it opens a different route with a lower summit. But the summit is a single point on the diagram, and lowering it lowers the climb from BOTH ends by the same amount. If Ea forward falls by 20 kJ/mol, Ea reverse falls by 20 kJ/mol too. The reactants and the products are where they always were; only the pass between them has been dug out. The arithmetic follows immediately. By Arrhenius, k = A e^(−Ea/RT), so lowering both barriers by the same amount multiplies both rate constants by the same factor e^(+20000/RT). But the equilibrium constant is K = k_forward/k_reverse, and a common factor in numerator and denominator cancels. K is exactly what it was. So is the position of equilibrium, so is the yield, so is every equilibrium concentration. This is not a coincidence but a requirement. K is fixed by ΔG° through ΔG° = −RT ln K, and ΔG° is a difference between two states — reactants and products — which a catalyst does not touch. If a catalyst could shift K, one could build a machine that adds catalyst, extracts product, removes catalyst and repeats, generating free energy from nothing. The impossibility of that machine is the thermodynamic reason no such catalyst exists. What a catalyst does change is worth stating just as precisely, because it is enormous. It changes the TIME. The Haber process at 700 K without iron would reach the same equilibrium composition it reaches with iron, but not in any human timescale; industrially the difference between an hour and a millennium is the whole difference between a process and a curiosity. Enzymes routinely accelerate reactions by factors of 10¹⁰ or more without altering a single equilibrium constant in the cell. Two further boundaries are worth marking. First, a catalyst cannot make a non-spontaneous reaction go: if ΔG is positive, K is less than one and stays less than one, and no catalyst has ever been found that changes this — a catalyst shortens the wait for something that was going to happen, and there is no waiting for something that is not. Second, a catalyst that appears to improve yield in practice is almost always doing something else: it is a SELECTIVE catalyst, speeding one of several competing reactions more than the others, so more of the material ends up in the wanted product before the mixture is quenched. That is a kinetic effect on a system not at equilibrium, and it is why industrial chemists talk about selectivity as a separate property from activity. (The second option gives a catalyst a directionality that an energy profile forbids; the third denies the rate change that is a catalyst's entire purpose; the fourth invokes a heat-removal mechanism that would be a change of temperature, not of catalysis.)",
          hi: "सुझाव उचित है और ग़लत है, और वह ठीक कहाँ विफल होता है यह देखना निष्कर्ष से अधिक मूल्यवान है। ऊर्जा-रूपरेखा खींचो। अभिकारक एक स्तर पर बैठे हैं, उत्पाद दूसरे पर, और उनके बीच वह पहाड़ी है जिसकी चोटी संक्रमण अवस्था है। अग्र सक्रियण ऊर्जा अभिकारकों से चोटी तक की चढ़ाई है; प्रतीप उसी चोटी तक उत्पादों से की चढ़ाई। ये दोनों स्वतंत्र नहीं — उनका अंतर ΔH पर नियत है, अर्थात् एन्थैल्पी परिवर्तन, क्योंकि रूपरेखा के दोनों सिरे हिलते नहीं। अब उत्प्रेरक जोड़ो। वह पहाड़ी में सुरंग नहीं बनाता; वह नीची चोटी वाला भिन्न रास्ता खोलता है। पर चोटी आरेख पर एक ही बिंदु है, और उसे नीचा करना दोनों सिरों से चढ़ाई को उतना ही नीचा कर देता है। यदि अग्र Ea 20 kJ/mol गिरे, तो प्रतीप Ea भी 20 kJ/mol गिरता है। अभिकारक और उत्पाद वहीं हैं जहाँ सदा थे; केवल उनके बीच का दर्रा खोदा गया है। अंकगणित तुरंत निकलता है। आरेनियस से k = A e^(−Ea/RT), अतः दोनों अवरोध उतने ही नीचे करने से दोनों वेग स्थिरांक उसी गुणक e^(+20000/RT) से गुणा हो जाते हैं। पर साम्य स्थिरांक K = k_अग्र/k_प्रतीप है, और अंश तथा हर का साझा गुणक कट जाता है। K ठीक वही है जो था। साम्य की स्थिति भी, उपज भी, और हर साम्य सांद्रता भी। यह संयोग नहीं बल्कि आवश्यकता है। K को ΔG° तय करता है ΔG° = −RT ln K के ज़रिए, और ΔG° दो अवस्थाओं का अंतर है — अभिकारक और उत्पाद — जिन्हें उत्प्रेरक छूता नहीं। यदि उत्प्रेरक K खिसका सकता, तो ऐसी मशीन बनाई जा सकती जो उत्प्रेरक जोड़े, उत्पाद निकाले, उत्प्रेरक हटाए और दोहराए, और शून्य से मुक्त ऊर्जा बनाती रहे। उस मशीन की असंभवता ही वह ऊष्मागतिक कारण है कि ऐसा कोई उत्प्रेरक नहीं। उत्प्रेरक जो बदलता है उसे भी उतनी ही ठीकाई से कहना चाहिए, क्योंकि वह विशाल है। वह समय बदलता है। 700 K पर लोहे के बिना हैबर प्रक्रम वही साम्य संघटन पाता जो लोहे के साथ पाता है, पर किसी मानवीय काल-पैमाने में नहीं; औद्योगिक रूप से एक घंटे और एक सहस्राब्दी का अंतर ही प्रक्रम और कौतुक का पूरा अंतर है। एंज़ाइम नियमित रूप से अभिक्रियाओं को 10¹⁰ या अधिक गुणकों से तेज़ करते हैं और कोशिका का एक भी साम्य स्थिरांक नहीं बदलते। दो और सीमाएँ अंकित करने योग्य हैं। पहली, उत्प्रेरक अस्वतःप्रवर्तित अभिक्रिया को चला नहीं सकता: यदि ΔG धनात्मक है, तो K एक से कम है और कम ही रहता है, और आज तक ऐसा कोई उत्प्रेरक नहीं मिला जो इसे बदले — उत्प्रेरक उस चीज़ की प्रतीक्षा छोटी करता है जो होने वाली थी, और जो होने वाली ही नहीं उसकी कोई प्रतीक्षा है ही नहीं। दूसरी, जो उत्प्रेरक व्यवहार में उपज सुधारता दिखता है वह लगभग सदा कुछ और कर रहा होता है: वह वरणात्मक उत्प्रेरक है, जो कई प्रतिस्पर्धी अभिक्रियाओं में से एक को बाक़ी से अधिक तेज़ करता है, अतः मिश्रण बुझाए जाने से पहले अधिक पदार्थ चाहे गए उत्पाद में पहुँच जाता है। वह साम्य पर न पड़े तंत्र पर बलगतिक प्रभाव है, और इसीलिए औद्योगिक रसायनज्ञ वरणात्मकता की बात सक्रियता से अलग गुण के रूप में करते हैं। (दूसरा विकल्प उत्प्रेरक को ऐसी दिशात्मकता देता है जिसे ऊर्जा-रूपरेखा मना करती है; तीसरा उसी वेग-परिवर्तन से इनकार करता है जो उत्प्रेरक का पूरा प्रयोजन है; चौथा ऊष्मा हटाने की ऐसी क्रियाविधि बुलाता है जो ताप का परिवर्तन होगी, उत्प्रेरण का नहीं।)",
          mr: "सूचना रास्त आहे आणि चूक आहे, आणि ती नेमकी कुठे अपयशी ठरते हे पाहणे निष्कर्षाहून अधिक मोलाचे आहे. ऊर्जा-आराखडा काढा. अभिक्रियक एका पातळीवर बसले आहेत, उत्पादने दुसऱ्या, आणि त्यांच्यामध्ये ती टेकडी आहे जिचे शिखर संक्रमण अवस्था आहे. अग्र सक्रियण ऊर्जा म्हणजे अभिक्रियकांपासून शिखरापर्यंतची चढाई; प्रतीप म्हणजे त्याच शिखरापर्यंत उत्पादनांपासूनची चढाई. ही दोन्ही स्वतंत्र नाहीत — त्यांचा फरक ΔH वर स्थिर आहे, म्हणजे एन्थॅल्पी बदल, कारण आराखड्याची दोन्ही टोके हलत नाहीत. आता उत्प्रेरक जोडा. तो टेकडीत बोगदा करत नाही; तो खालच्या शिखराचा वेगळा मार्ग उघडतो. पण शिखर हा आकृतीवरचा एकच बिंदू आहे, आणि तो खाली आणल्याने दोन्ही टोकांकडून चढाई तितकीच खाली येते. जर अग्र Ea 20 kJ/mol ने घसरला, तर प्रतीप Ea सुद्धा 20 kJ/mol ने घसरतो. अभिक्रियक आणि उत्पादने तिथेच आहेत जिथे नेहमी होती; केवळ त्यांच्यामधली खिंड खोदली गेली आहे. अंकगणित लगेच निघते. अरेनियसनुसार k = A e^(−Ea/RT), म्हणून दोन्ही अडसर तितकेच खाली आणल्याने दोन्ही वेग स्थिरांक त्याच गुणक e^(+20000/RT) ने गुणले जातात. पण समतोल स्थिरांक K = k_अग्र/k_प्रतीप आहे, आणि अंश व छेदातला समान गुणक कापला जातो. K नेमके तेच आहे जे होते. समतोलाची जागाही, उत्पन्नही, आणि प्रत्येक समतोल संहतीही. हा योगायोग नसून आवश्यकता आहे. K हे ΔG° ठरवते ΔG° = −RT ln K मार्गे, आणि ΔG° हा दोन अवस्थांचा फरक आहे — अभिक्रियक आणि उत्पादने — ज्यांना उत्प्रेरक स्पर्शत नाही. जर उत्प्रेरक K सरकवू शकला असता, तर असे यंत्र बांधता आले असते जे उत्प्रेरक जोडेल, उत्पादन काढेल, उत्प्रेरक काढेल आणि पुन्हा करेल, आणि शून्यातून मुक्त ऊर्जा घडवत राहील. त्या यंत्राची अशक्यता हेच ते उष्मागतिक कारण की असा कोणताही उत्प्रेरक नाही. उत्प्रेरक जे बदलतो तेही तितक्याच नेमकेपणाने सांगायला हवे, कारण ते प्रचंड आहे. तो काळ बदलतो. 700 K वर लोखंडाविना हेबर प्रक्रिया तेच समतोल संघटन गाठेल जे लोखंडासह गाठते, पण कोणत्याही मानवी कालमापात नाही; औद्योगिकदृष्ट्या एक तास आणि एक सहस्रक यांतील फरक हाच प्रक्रिया आणि कुतूहल यांतील अख्खा फरक. विकरे नियमितपणे अभिक्रिया 10¹⁰ वा अधिक पटींनी वेगवान करतात आणि पेशीतला एकही समतोल स्थिरांक बदलत नाहीत. आणखी दोन सीमा नोंदवण्याजोग्या आहेत. पहिली, उत्प्रेरक अस्वयंस्फूर्त अभिक्रिया चालवू शकत नाही: जर ΔG धन असेल, तर K एकाहून कमी आहे आणि कमीच राहतो, आणि आजवर असा कोणताही उत्प्रेरक सापडलेला नाही जो हे बदलेल — उत्प्रेरक त्या गोष्टीची प्रतीक्षा लहान करतो जी होणार होती, आणि जी होणारच नाही तिची कोणतीही प्रतीक्षा नाहीच. दुसरी, जो उत्प्रेरक व्यवहारात उत्पन्न सुधारताना दिसतो तो जवळपास नेहमी दुसरे काहीतरी करत असतो: तो निवडक उत्प्रेरक आहे, जो अनेक स्पर्धी अभिक्रियांपैकी एकीला बाकीच्यांहून अधिक वेगवान करतो, म्हणून मिश्रण विझवण्याआधी अधिक पदार्थ हव्या असलेल्या उत्पादनात पोहोचतो. तो समतोलावर नसलेल्या संस्थेवरचा गतिक परिणाम आहे, आणि म्हणूनच औद्योगिक रसायनशास्त्रज्ञ निवडकतेची चर्चा क्रियाशीलतेहून वेगळा गुणधर्म म्हणून करतात. (दुसरा पर्याय उत्प्रेरकाला अशी दिशात्मकता देतो जिला ऊर्जा-आराखडा वर्ज्य करतो; तिसरा तोच वेग-बदल नाकारतो जो उत्प्रेरकाचा अख्खा हेतू आहे; चौथा उष्णता काढण्याची अशी यंत्रणा बोलावतो जी तापमानाचा बदल ठरेल, उत्प्रेरणाचा नाही.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 4 — The d- and f-Block Elements                                 */
  /* ----------------------------------------------------------------------- */
  {
    slug: "chemistry-12-d-and-f-block-elements",
    subject: "CHEMISTRY",
    classLevel: 12,
    chapter: {
      en: "Chapter 4 — The d- and f-Block Elements",
      hi: "अध्याय 4 — d एवं f ब्लॉक के तत्व",
      mr: "प्रकरण 4 — d व f खंडातील मूलद्रव्ये",
    },
    name: {
      en: "The d- and f-Block Elements",
      hi: "d एवं f ब्लॉक के तत्व",
      mr: "d व f खंडातील मूलद्रव्ये",
    },
    summary: {
      en: "A block of elements whose two outermost sets of orbitals are so close in energy that the atom cannot decide how many electrons to give away, which is why manganese runs from +2 to +7 while sodium only ever manages +1; ions that are coloured because a small energy gap happens to fall in the visible, and colourless when the shell is empty or full; metals that catalyse by lending electrons and taking them back, which a fixed-valency metal cannot do; a row across which the radius barely changes because each added proton is matched by an added electron in the shell just inside; a magnetism that counts unpaired electrons and can therefore be used to count them; and, one row lower, a contraction accumulated over fourteen elements that makes the metal below almost exactly the size of the metal above it.",
      hi: "तत्वों का ऐसा ब्लॉक जिसके दो बाहरतम कक्षक-समुच्चय ऊर्जा में इतने पास हैं कि परमाणु तय ही नहीं कर पाता कि कितने इलेक्ट्रॉन दे दे, इसीलिए मैंगनीज़ +2 से +7 तक जाता है जबकि सोडियम कभी +1 से आगे नहीं; ऐसे आयन जो इसलिए रंगीन हैं कि एक छोटा ऊर्जा अंतराल संयोग से दृश्य में पड़ता है, और खोल ख़ाली या भरी हो तो रंगहीन; ऐसी धातुएँ जो इलेक्ट्रॉन उधार देकर और वापस लेकर उत्प्रेरण करती हैं, जो नियत संयोजकता वाली धातु नहीं कर सकती; ऐसी पंक्ति जिसके आर-पार त्रिज्या मुश्किल से बदलती है क्योंकि हर जोड़े गए प्रोटॉन का जवाब ठीक भीतर वाली खोल में जोड़ा गया इलेक्ट्रॉन दे देता है; ऐसा चुंबकत्व जो अयुग्मित इलेक्ट्रॉन गिनता है और इसलिए उन्हें गिनने को काम में लाया जा सकता है; और एक पंक्ति नीचे, चौदह तत्वों पर जमा हुआ ऐसा संकुचन जो नीचे की धातु को ऊपर वाली धातु के लगभग ठीक बराबर कर देता है।",
      mr: "मूलद्रव्यांचा असा खंड ज्याचे दोन बाहेरचे कक्षक-संच ऊर्जेत इतके जवळ आहेत की अणू ठरवूच शकत नाही की किती इलेक्ट्रॉन देऊन टाकावेत, म्हणूनच मँगेनीज +2 पासून +7 पर्यंत जातो तर सोडियम कधी +1 च्या पुढे जात नाही; असे आयन जे यासाठी रंगीत आहेत की एक लहान ऊर्जा फट योगायोगाने दृश्यात पडते, आणि कवच रिकामे वा भरलेले असल्यास रंगहीन; अशा धातू ज्या इलेक्ट्रॉन उसने देऊन आणि परत घेऊन उत्प्रेरण करतात, जे ठराविक संयुजा असलेली धातू करू शकत नाही; अशी रांग जिच्या आरपार त्रिज्या जेमतेम बदलते कारण प्रत्येक जोडलेल्या प्रोटॉनला अगदी आतल्या कवचात जोडलेला इलेक्ट्रॉन उत्तर देतो; असे चुंबकत्व जे अयुग्मित इलेक्ट्रॉन मोजते आणि म्हणून त्यांना मोजायला वापरता येते; आणि एक रांग खाली, चौदा मूलद्रव्यांवर साठलेले असे आकुंचन जे खालच्या धातूला वरच्या धातूच्या जवळपास नेमके बरोबर करते.",
    },
    position: 4,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "variable-oxidation-states",
        name: {
          en: "Variable oxidation states",
          hi: "परिवर्ती ऑक्सीकरण अवस्थाएँ",
          mr: "बदलत्या उपचयन अवस्था",
        },
        kind: "property of the transition metals",
        prompt: {
          en: "Manganese is found as +2, +3, +4, +6 and +7 in ordinary compounds; sodium next door manages only +1 and nothing else, ever. Which property is this?",
          hi: "मैंगनीज़ साधारण यौगिकों में +2, +3, +4, +6 और +7 के रूप में मिलता है; बग़ल का सोडियम केवल +1 सँभालता है और कभी कुछ और नहीं। यह कौन-सा गुण है?",
          mr: "मँगेनीज साध्या संयुगांत +2, +3, +4, +6 आणि +7 म्हणून आढळतो; शेजारचा सोडियम केवळ +1 सांभाळतो आणि कधी दुसरे काहीही नाही. हा कोणता गुणधर्म?",
        },
        statement: {
          en: "Variable oxidation states arise because the (n−1)d and ns orbitals are close in energy, so a transition metal can lose a varying number of electrons with little difference in cost.",
          hi: "परिवर्ती ऑक्सीकरण अवस्थाएँ इसलिए उठती हैं कि (n−1)d और ns कक्षक ऊर्जा में पास हैं, अतः संक्रमण धातु भिन्न-भिन्न संख्या में इलेक्ट्रॉन खो सकती है और क़ीमत में ख़ास अंतर नहीं पड़ता।",
          mr: "बदलत्या उपचयन अवस्था यासाठी उद्भवतात की (n−1)d आणि ns कक्षक ऊर्जेत जवळ आहेत, म्हणून संक्रमण धातू वेगवेगळ्या संख्येने इलेक्ट्रॉन गमावू शकते आणि किमतीत फारसा फरक पडत नाही.",
        },
        detail: {
          en: "The states differ by one rather than by two, unlike the p-block, because electrons are being removed one at a time from orbitals of nearly equal energy rather than from a filled pair.",
          hi: "अवस्थाएँ p-ब्लॉक के विपरीत दो के बजाय एक-एक से भिन्न हैं, क्योंकि इलेक्ट्रॉन भरे हुए युग्म से नहीं बल्कि लगभग बराबर ऊर्जा के कक्षकों से एक-एक करके हटाए जा रहे हैं।",
          mr: "अवस्था p-खंडाच्या उलट दोनऐवजी एकेकाने वेगळ्या आहेत, कारण इलेक्ट्रॉन भरलेल्या जोडीतून नव्हे तर जवळपास समान ऊर्जेच्या कक्षकांतून एकेक करून काढले जात आहेत.",
        },
        extra: {
          en: "The highest states appear only with oxygen and fluorine, which are small and strongly electronegative enough to hold seven bonds together — permanganate exists and heptachloride does not.",
          hi: "सबसे ऊँची अवस्थाएँ केवल ऑक्सीजन और फ़्लुओरीन के साथ आती हैं, जो सात बंध साथ रखने भर छोटे और प्रबल विद्युत ऋणात्मक हैं — परमैंगनेट है और हेप्टाक्लोराइड नहीं।",
          mr: "सर्वांत उंच अवस्था केवळ ऑक्सिजन आणि फ्लोरिनसोबत येतात, जे सात बंध एकत्र ठेवण्याइतके लहान आणि तीव्र विद्युत ऋण आहेत — परमँगेनेट आहे आणि हेप्टाक्लोराइड नाही.",
        },
        pair: {
          left: {
            en: "Cannot decide how many electrons to part with",
            hi: "तय नहीं कर पाता कि कितने इलेक्ट्रॉन छोड़े",
            mr: "किती इलेक्ट्रॉन सोडावेत हे ठरवू शकत नाही",
          },
          right: {
            en: "variable oxidation states",
            hi: "परिवर्ती ऑक्सीकरण अवस्थाएँ",
            mr: "बदलत्या उपचयन अवस्था",
          },
        },
      },
      {
        id: "colour-of-transition-ions",
        name: {
          en: "The colour of transition metal ions",
          hi: "संक्रमण धातु आयनों का रंग",
          mr: "संक्रमण धातू आयनांचा रंग",
        },
        kind: "property of the transition metals",
        prompt: {
          en: "Copper sulphate solution is blue and nickel salts green, but zinc and scandium salts are colourless — and the difference tracks exactly whether the d-shell is partly filled. Which property is this?",
          hi: "कॉपर सल्फ़ेट का विलयन नीला और निकल के लवण हरे हैं, पर ज़िंक और स्कैंडियम के लवण रंगहीन — और अंतर ठीक इस बात के साथ चलता है कि d-खोल आंशिक रूप से भरी है या नहीं। यह कौन-सा गुण है?",
          mr: "कॉपर सल्फेटचे द्रावण निळे आणि निकेलचे क्षार हिरवे आहेत, पण जस्त आणि स्कँडियमचे क्षार रंगहीन — आणि फरक नेमका d-कवच अंशतः भरलेले आहे की नाही याच्यासोबत चालतो. हा कोणता गुणधर्म?",
        },
        statement: {
          en: "The colour of transition metal ions comes from electrons jumping between d-orbitals split by the surrounding ligands, and requires a partly filled d-shell.",
          hi: "संक्रमण धातु आयनों का रंग उन इलेक्ट्रॉनों से आता है जो आसपास के लिगैंडों से विपाटित d-कक्षकों के बीच छलाँग लगाते हैं, और उसके लिए आंशिक भरी d-खोल चाहिए।",
          mr: "संक्रमण धातू आयनांचा रंग त्या इलेक्ट्रॉनांतून येतो जे भोवतीच्या लिगँडांनी विभाजित d-कक्षकांमध्ये उड्या मारतात, आणि त्यासाठी अंशतः भरलेले d-कवच लागते.",
        },
        detail: {
          en: "The colour seen is the COMPLEMENT of the colour absorbed: copper solutions look blue because the ion absorbs in the orange and red and what passes through is what is left.",
          hi: "जो रंग दिखता है वह सोखे गए रंग का पूरक है: ताँबे के विलयन नीले दिखते हैं क्योंकि आयन नारंगी और लाल में सोखता है और जो पार निकलता है वही बचा हुआ है।",
          mr: "जो रंग दिसतो तो शोषलेल्या रंगाचा पूरक आहे: तांब्याची द्रावणे निळी दिसतात कारण आयन नारिंगी आणि लालात शोषतो आणि जे पलीकडे जाते तेच उरलेले आहे.",
        },
        extra: {
          en: "The size of the splitting depends on the ligands, so the same metal ion changes colour when its surroundings change — which is why copper turns from pale blue to deep blue on adding ammonia.",
          hi: "विपाटन का आकार लिगैंडों पर निर्भर है, अतः वही धातु आयन परिवेश बदलने पर रंग बदल लेता है — इसीलिए अमोनिया डालने पर ताँबा हल्के नीले से गहरे नीले में बदल जाता है।",
          mr: "विभाजनाचा आकार लिगँडांवर अवलंबून आहे, म्हणून तोच धातू आयन परिसर बदलल्यावर रंग बदलतो — म्हणूनच अमोनिया घातल्यावर तांबे फिकट निळ्यातून गडद निळ्यात बदलते.",
        },
        pair: {
          left: {
            en: "Empty or full d-shell means colourless",
            hi: "ख़ाली या भरी d-खोल का अर्थ रंगहीन",
            mr: "रिकामे वा भरलेले d-कवच म्हणजे रंगहीन",
          },
          right: {
            en: "the colour of transition metal ions",
            hi: "संक्रमण धातु आयनों का रंग",
            mr: "संक्रमण धातू आयनांचा रंग",
          },
        },
      },
      {
        id: "catalytic-activity",
        name: {
          en: "Catalytic activity of the transition metals",
          hi: "संक्रमण धातुओं की उत्प्रेरक सक्रियता",
          mr: "संक्रमण धातूंची उत्प्रेरक क्रियाशीलता",
        },
        kind: "property of the transition metals",
        prompt: {
          en: "Iron in the Haber process, vanadium pentoxide in the contact process, nickel in hydrogenation, platinum in a car's exhaust — one block supplies almost every industrial catalyst there is. Which property explains that?",
          hi: "हैबर प्रक्रम में लोहा, संस्पर्श प्रक्रम में वैनेडियम पेंटॉक्साइड, हाइड्रोजनीकरण में निकल, कार के निकास में प्लैटिनम — लगभग हर औद्योगिक उत्प्रेरक एक ही ब्लॉक से आता है। कौन-सा गुण इसे समझाता है?",
          mr: "हेबर प्रक्रियेत लोखंड, संपर्क प्रक्रियेत व्हॅनेडियम पेंटॉक्साइड, हायड्रोजनीकरणात निकेल, गाडीच्या धुरात प्लॅटिनम — जवळपास प्रत्येक औद्योगिक उत्प्रेरक एकाच खंडातून येतो. कोणता गुणधर्म हे समजावतो?",
        },
        statement: {
          en: "Catalytic activity of the transition metals rests on their variable oxidation states and their ability to adsorb reactants on a surface, both of which let them lend electrons and take them back.",
          hi: "संक्रमण धातुओं की उत्प्रेरक सक्रियता उनकी परिवर्ती ऑक्सीकरण अवस्थाओं और सतह पर अभिकारकों को अधिशोषित कर सकने की क्षमता पर टिकी है, और दोनों उन्हें इलेक्ट्रॉन उधार देने तथा वापस लेने देते हैं।",
          mr: "संक्रमण धातूंची उत्प्रेरक क्रियाशीलता त्यांच्या बदलत्या उपचयन अवस्थांवर आणि पृष्ठभागावर अभिक्रियक अधिशोषित करू शकण्याच्या क्षमतेवर टिकली आहे, आणि दोन्ही त्यांना इलेक्ट्रॉन उसने देऊ आणि परत घेऊ देतात.",
        },
        detail: {
          en: "A catalyst must change and then change back, which is exactly what a metal with several accessible oxidation states can do and a fixed-valency metal such as sodium cannot.",
          hi: "उत्प्रेरक को बदलना और फिर लौट आना पड़ता है, और यही वह धातु कर सकती है जिसकी कई ऑक्सीकरण अवस्थाएँ पहुँच में हों, तथा सोडियम जैसी नियत संयोजकता वाली धातु नहीं कर सकती।",
          mr: "उत्प्रेरकाला बदलावे आणि मग परत यावे लागते, आणि हेच ती धातू करू शकते जिच्या अनेक उपचयन अवस्था आवाक्यात असतील, आणि सोडियमसारखी ठराविक संयुजेची धातू करू शकत नाही.",
        },
        extra: {
          en: "Surface adsorption does a second job: it holds two reactants next to each other in the right orientation, so a collision that would otherwise be a matter of chance becomes something close to a certainty.",
          hi: "सतह पर अधिशोषण दूसरा काम भी करता है: वह दो अभिकारकों को सही अभिविन्यास में अगल-बगल पकड़े रखता है, अतः जो टक्कर अन्यथा संयोग की बात होती वह लगभग निश्चितता बन जाती है।",
          mr: "पृष्ठभागावरील अधिशोषण दुसरे कामही करते: ते दोन अभिक्रियकांना योग्य मांडणीत शेजारीशेजारी धरून ठेवते, म्हणून जी टक्कर अन्यथा योगायोगाची बाब असती ती जवळपास निश्चितता बनते.",
        },
        pair: {
          left: {
            en: "Must change and change back, which sodium cannot",
            hi: "बदलना और लौटना पड़ता है, जो सोडियम नहीं कर सकता",
            mr: "बदलावे आणि परत यावे लागते, जे सोडियम करू शकत नाही",
          },
          right: {
            en: "catalytic activity of the transition metals",
            hi: "संक्रमण धातुओं की उत्प्रेरक सक्रियता",
            mr: "संक्रमण धातूंची उत्प्रेरक क्रियाशीलता",
          },
        },
      },
      {
        id: "near-constant-radii",
        name: {
          en: "The near-constant radii across a series",
          hi: "एक श्रेणी में लगभग अचर त्रिज्याएँ",
          mr: "एका श्रेणीत जवळपास अचल त्रिज्या",
        },
        kind: "trend across the block",
        prompt: {
          en: "Going from titanium to copper adds eight protons, yet the atoms barely shrink — a striking contrast with a p-block row, where the same number of protons squeezes the atom noticeably. Which trend is this?",
          hi: "टाइटेनियम से ताँबे तक जाने में आठ प्रोटॉन जुड़ते हैं, फिर भी परमाणु मुश्किल से सिकुड़ते हैं — p-ब्लॉक की पंक्ति से चौंकाने वाला विरोधाभास, जहाँ उतने ही प्रोटॉन परमाणु को ध्यान देने योग्य ढंग से दबा देते हैं। यह कौन-सी प्रवृत्ति है?",
          mr: "टायटॅनियमपासून तांब्यापर्यंत जाताना आठ प्रोटॉन जोडले जातात, तरीही अणू जेमतेम आकुंचन पावतात — p-खंडाच्या रांगेशी चकित करणारा विरोधाभास, जिथे तितकेच प्रोटॉन अणूला लक्षणीयरीत्या दाबतात. ही कोणती प्रवृत्ती?",
        },
        statement: {
          en: "The near-constant radii across a transition series arise because each added electron enters an inner (n−1)d orbital and screens the added proton from the outermost electrons almost completely.",
          hi: "संक्रमण श्रेणी में लगभग अचर त्रिज्याएँ इसलिए हैं कि हर जोड़ा गया इलेक्ट्रॉन भीतरी (n−1)d कक्षक में जाता है और जोड़े गए प्रोटॉन को बाहरतम इलेक्ट्रॉनों से लगभग पूरी तरह ढक देता है।",
          mr: "संक्रमण श्रेणीत जवळपास अचल त्रिज्या यासाठी आहेत की प्रत्येक जोडलेला इलेक्ट्रॉन आतल्या (n−1)d कक्षकात जातो आणि जोडलेल्या प्रोटॉनला बाहेरच्या इलेक्ट्रॉनांपासून जवळपास पूर्णपणे झाकतो.",
        },
        detail: {
          en: "The two effects nearly cancel: the extra nuclear charge pulls inwards and the extra inner electron pushes outwards, and neither wins by much.",
          hi: "दोनों प्रभाव लगभग कट जाते हैं: अतिरिक्त नाभिकीय आवेश भीतर खींचता है और अतिरिक्त भीतरी इलेक्ट्रॉन बाहर धकेलता है, और कोई ख़ास नहीं जीतता।",
          mr: "दोन्ही परिणाम जवळपास कापले जातात: जादा केंद्रकीय प्रभार आत ओढतो आणि जादा आतला इलेक्ट्रॉन बाहेर ढकलतो, आणि कोणीही फारसे जिंकत नाही.",
        },
        extra: {
          en: "It is why transition metals form alloys so freely with each other: atoms of nearly equal size can substitute in a lattice without straining it, which is what brass, bronze and steel all depend on.",
          hi: "इसीलिए संक्रमण धातुएँ एक-दूसरे से इतनी सहजता से मिश्रधातु बनाती हैं: लगभग बराबर आकार के परमाणु जालक में एक-दूसरे की जगह ले सकते हैं बिना उसे तनाव दिए, और पीतल, काँसा तथा इस्पात सब इसी पर निर्भर हैं।",
          mr: "म्हणूनच संक्रमण धातू एकमेकांशी इतक्या सहजतेने मिश्रधातू बनवतात: जवळपास समान आकाराचे अणू जाळीत एकमेकांची जागा घेऊ शकतात तिला ताण न देता, आणि पितळ, कांस्य तसेच पोलाद सर्व यावर अवलंबून आहेत.",
        },
        pair: {
          left: {
            en: "Eight more protons and hardly any smaller",
            hi: "आठ और प्रोटॉन और मुश्किल से कुछ छोटा",
            mr: "आठ अधिक प्रोटॉन आणि जेमतेम काही लहान",
          },
          right: {
            en: "the near-constant radii across a series",
            hi: "एक श्रेणी में लगभग अचर त्रिज्याएँ",
            mr: "एका श्रेणीत जवळपास अचल त्रिज्या",
          },
        },
      },
      {
        id: "lanthanoid-contraction",
        name: {
          en: "The lanthanoid contraction",
          hi: "लैंथेनॉयड संकुचन",
          mr: "लॅंथेनॉइड आकुंचन",
        },
        kind: "trend across the block",
        prompt: {
          en: "Fourteen small shrinkages accumulated across one inner series leave hafnium almost exactly the size of zirconium in the row above, so the two are chemically almost inseparable. What is this effect called?",
          hi: "एक भीतरी श्रेणी में जमा हुए चौदह छोटे संकुचन हैफ़्नियम को ऊपर की पंक्ति के ज़र्कोनियम के लगभग ठीक बराबर छोड़ देते हैं, अतः दोनों रासायनिक रूप से लगभग अवियोज्य हैं। इस प्रभाव को क्या कहते हैं?",
          mr: "एका आतल्या श्रेणीत साठलेली चौदा लहान आकुंचने हाफ्नियमला वरच्या रांगेतील झिर्कोनियमच्या जवळपास नेमके बरोबर सोडतात, म्हणून दोन्ही रासायनिकदृष्ट्या जवळपास अविभाज्य आहेत. या परिणामाला काय म्हणतात?",
        },
        statement: {
          en: "The lanthanoid contraction is the steady decrease in size across the fourteen lanthanoids, caused by poor shielding by 4f electrons, and it shrinks every element that follows them.",
          hi: "लैंथेनॉयड संकुचन चौदह लैंथेनॉयडों में आकार की लगातार कमी है, जो 4f इलेक्ट्रॉनों के कमज़ोर परिरक्षण से होती है, और वह उनके बाद आने वाले हर तत्व को सिकोड़ देती है।",
          mr: "लॅंथेनॉइड आकुंचन म्हणजे चौदा लॅंथेनॉइडांत आकाराची सतत घट, जी 4f इलेक्ट्रॉनांच्या कमकुवत आवरणामुळे होते, आणि ती त्यांच्यानंतर येणाऱ्या प्रत्येक मूलद्रव्याला आकुंचित करते.",
        },
        detail: {
          en: "The 4f orbitals are diffuse and shield badly, so each added proton is felt more than it is cancelled, and a small deficit repeated fourteen times becomes a large one.",
          hi: "4f कक्षक फैले हुए हैं और बुरी तरह परिरक्षण करते हैं, अतः हर जोड़ा गया प्रोटॉन जितना कटता है उससे अधिक महसूस होता है, और चौदह बार दोहराई गई छोटी कमी बड़ी बन जाती है।",
          mr: "4f कक्षक पसरलेले आहेत आणि वाईट आवरण करतात, म्हणून प्रत्येक जोडलेला प्रोटॉन जितका कापला जातो त्याहून अधिक जाणवतो, आणि चौदा वेळा पुनरावृत्त झालेली लहान तूट मोठी बनते.",
        },
        extra: {
          en: "The consequence reaches far beyond the lanthanoids themselves: the second and third transition series resemble each other far more than either resembles the first, which is not a coincidence but this contraction's shadow.",
          hi: "परिणाम स्वयं लैंथेनॉयडों से कहीं आगे तक पहुँचता है: दूसरी और तीसरी संक्रमण श्रेणियाँ एक-दूसरे से कहीं अधिक मिलती हैं, बनिस्बत किसी के पहली से मिलने के, और यह संयोग नहीं बल्कि इसी संकुचन की छाया है।",
          mr: "परिणाम स्वतः लॅंथेनॉइडांहून कितीतरी पुढे पोहोचतो: दुसरी आणि तिसरी संक्रमण श्रेणी एकमेकांशी कितीतरी अधिक जुळतात, कोणाच्याही पहिलीशी जुळण्याहून, आणि हा योगायोग नसून याच आकुंचनाची सावली आहे.",
        },
        pair: {
          left: {
            en: "Fourteen small deficits that add up to a whole row",
            hi: "चौदह छोटी कमियाँ जो जुड़कर पूरी पंक्ति बन जाती हैं",
            mr: "चौदा लहान तुटी ज्या जुळून अख्खी रांग बनतात",
          },
          right: {
            en: "the lanthanoid contraction",
            hi: "लैंथेनॉयड संकुचन",
            mr: "लॅंथेनॉइड आकुंचन",
          },
        },
      },
      {
        id: "magnetic-moment-unpaired",
        name: {
          en: "Magnetic moment and unpaired electrons",
          hi: "चुंबकीय आघूर्ण और अयुग्मित इलेक्ट्रॉन",
          mr: "चुंबकीय आघूर्ण आणि अयुग्मित इलेक्ट्रॉन",
        },
        kind: "trend across the block",
        prompt: {
          en: "Weigh a sample in and out of a magnetic field, convert the difference into a number of Bohr magnetons, and you have counted something inside the atom that no chemical test could reach. What is being counted?",
          hi: "किसी नमूने को चुंबकीय क्षेत्र के भीतर और बाहर तौलो, अंतर को बोर मैग्नेटॉनों की संख्या में बदलो, और तुमने परमाणु के भीतर ऐसी चीज़ गिन ली जहाँ कोई रासायनिक परीक्षण पहुँच ही नहीं सकता। क्या गिना जा रहा है?",
          mr: "एखादा नमुना चुंबकीय क्षेत्राच्या आत आणि बाहेर तोला, फरकाचे बोर मॅग्नेटॉनांच्या संख्येत रूपांतर करा, आणि तुम्ही अणूच्या आत अशी गोष्ट मोजली जिथे कोणतीही रासायनिक चाचणी पोहोचूच शकत नाही. काय मोजले जात आहे?",
        },
        statement: {
          en: "The spin-only magnetic moment is μ = √(n(n+2)) Bohr magnetons with n the number of unpaired electrons, so a magnetic measurement counts them directly.",
          hi: "केवल-चक्रण चुंबकीय आघूर्ण μ = √(n(n+2)) बोर मैग्नेटॉन है जिसमें n अयुग्मित इलेक्ट्रॉनों की संख्या है, अतः चुंबकीय माप उन्हें सीधे गिन देता है।",
          mr: "केवळ-परिवलन चुंबकीय आघूर्ण μ = √(n(n+2)) बोर मॅग्नेटॉन आहे जिथे n ही अयुग्मित इलेक्ट्रॉनांची संख्या आहे, म्हणून चुंबकीय माप त्यांना थेट मोजते.",
        },
        detail: {
          en: "Paired electrons contribute nothing because their spins cancel, so the measurement is blind to the great majority of the atom's electrons and sees only the odd ones out.",
          hi: "युग्मित इलेक्ट्रॉन कुछ नहीं जोड़ते क्योंकि उनके चक्रण कट जाते हैं, अतः माप परमाणु के अधिकांश इलेक्ट्रॉनों के प्रति अंधा है और केवल बचे हुए अकेलों को देखता है।",
          mr: "युग्मित इलेक्ट्रॉन काहीही जोडत नाहीत कारण त्यांची परिवलने कापली जातात, म्हणून माप अणूच्या बहुतांश इलेक्ट्रॉनांबाबत आंधळे आहे आणि केवळ उरलेल्या एकट्यांना पाहते.",
        },
        extra: {
          en: "It is how a complex is diagnosed as high-spin or low-spin without any structural work at all: the same ion with the same charge gives two quite different moments depending on which ligands surround it.",
          hi: "इसी से किसी संकुल को उच्च-चक्रण या निम्न-चक्रण ठहराया जाता है, बिना किसी संरचनात्मक काम के: वही आयन उसी आवेश के साथ दो बिलकुल भिन्न आघूर्ण देता है, यह इस पर निर्भर कि उसे कौन-से लिगैंड घेरे हैं।",
          mr: "याच मार्गाने एखादे संकुल उच्च-परिवलन वा निम्न-परिवलन ठरवले जाते, कोणत्याही संरचनात्मक कामाविना: तोच आयन त्याच प्रभारासह दोन अगदी वेगळी आघूर्णे देतो, हे कोणते लिगँड त्याला वेढले आहेत यावर अवलंबून.",
        },
        pair: {
          left: {
            en: "A balance that counts electrons",
            hi: "ऐसी तराज़ू जो इलेक्ट्रॉन गिनती है",
            mr: "असा तराजू जो इलेक्ट्रॉन मोजतो",
          },
          right: {
            en: "magnetic moment and unpaired electrons",
            hi: "चुंबकीय आघूर्ण और अयुग्मित इलेक्ट्रॉन",
            mr: "चुंबकीय आघूर्ण आणि अयुग्मित इलेक्ट्रॉन",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Sodium forms only Na⁺ and magnesium only Mg²⁺, but manganese forms compounds in every state from +2 to +7. A student says this must be because manganese has more electrons. Assess that and give the real reason.",
          hi: "सोडियम केवल Na⁺ बनाता है और मैग्नीशियम केवल Mg²⁺, पर मैंगनीज़ +2 से +7 तक हर अवस्था में यौगिक बनाता है। विद्यार्थी कहता है कि इसका कारण यही होगा कि मैंगनीज़ के पास अधिक इलेक्ट्रॉन हैं। इसका आकलन करो और असली कारण दो।",
          mr: "सोडियम केवळ Na⁺ बनवतो आणि मॅग्नेशियम केवळ Mg²⁺, पण मँगेनीज +2 पासून +7 पर्यंत प्रत्येक अवस्थेत संयुगे बनवतो. विद्यार्थी म्हणतो की याचे कारण हेच असावे की मँगेनीजकडे अधिक इलेक्ट्रॉन आहेत. याचे मूल्यमापन करा आणि खरे कारण द्या.",
        },
        choices: [
          {
            en: "Having more electrons is not enough — caesium has fifty-five and still forms only Cs⁺. What matters is that in a transition metal the inner d orbitals and the outer s orbitals lie CLOSE IN ENERGY, so removing a d electron costs little more than removing an s electron and the atom has several nearly equally cheap options. In sodium the next electron after the 3s lies in a filled inner shell far below, so removing it is prohibitively expensive and +1 is the only accessible state. The states differ by one rather than two, and the highest ones appear only with small electronegative partners such as oxygen and fluorine",
            hi: "अधिक इलेक्ट्रॉन होना पर्याप्त नहीं — सीज़ियम के पचपन हैं और वह फिर भी केवल Cs⁺ बनाता है। मायने यह रखता है कि संक्रमण धातु में भीतरी d कक्षक और बाहरी s कक्षक ऊर्जा में पास पड़े हैं, अतः d इलेक्ट्रॉन हटाने की क़ीमत s इलेक्ट्रॉन हटाने से ख़ास अधिक नहीं और परमाणु के पास कई लगभग बराबर सस्ते विकल्प हैं। सोडियम में 3s के बाद अगला इलेक्ट्रॉन बहुत नीचे भरी भीतरी खोल में पड़ा है, अतः उसे हटाना निषेधात्मक रूप से महँगा है और +1 ही एकमात्र पहुँच वाली अवस्था। अवस्थाएँ दो के बजाय एक से भिन्न हैं, और सबसे ऊँची केवल ऑक्सीजन तथा फ़्लुओरीन जैसे छोटे विद्युत ऋणात्मक साथियों के साथ आती हैं",
            mr: "अधिक इलेक्ट्रॉन असणे पुरेसे नाही — सीझियमकडे पंचावन्न आहेत आणि तो तरीही केवळ Cs⁺ बनवतो. महत्त्वाचे हे की संक्रमण धातूत आतले d कक्षक आणि बाहेरचे s कक्षक ऊर्जेत जवळ पडलेले आहेत, म्हणून d इलेक्ट्रॉन काढण्याची किंमत s इलेक्ट्रॉन काढण्याहून फारशी अधिक नाही आणि अणूकडे अनेक जवळपास समान स्वस्त पर्याय आहेत. सोडियममध्ये 3s नंतरचा पुढचा इलेक्ट्रॉन खूप खाली भरलेल्या आतल्या कवचात पडला आहे, म्हणून तो काढणे निषिद्धपणे महाग आहे आणि +1 हीच एकमेव आवाक्यातली अवस्था. अवस्था दोनऐवजी एकाने वेगळ्या आहेत, आणि सर्वांत उंच केवळ ऑक्सिजन आणि फ्लोरिनसारख्या लहान विद्युत ऋण साथीदारांसोबत येतात",
          },
          {
            en: "The student is right: the number of oxidation states is simply the number of electrons an element has, which is why heavier elements always show more of them",
            hi: "विद्यार्थी सही है: ऑक्सीकरण अवस्थाओं की संख्या बस उन इलेक्ट्रॉनों की संख्या है जो तत्व के पास हैं, इसीलिए भारी तत्व सदा अधिक दिखाते हैं",
            mr: "विद्यार्थी बरोबर आहे: उपचयन अवस्थांची संख्या म्हणजे मूलद्रव्याकडे असलेल्या इलेक्ट्रॉनांची संख्याच, म्हणूनच जड मूलद्रव्ये नेहमी अधिक दाखवतात",
          },
          {
            en: "Manganese shows many states because it is a metal, and all metals lose as many electrons as their partners demand",
            hi: "मैंगनीज़ कई अवस्थाएँ इसलिए दिखाता है कि वह धातु है, और सभी धातुएँ उतने इलेक्ट्रॉन खोती हैं जितने उनके साथी माँगें",
            mr: "मँगेनीज अनेक अवस्था यासाठी दाखवतो की तो धातू आहे, आणि सर्व धातू तितके इलेक्ट्रॉन गमावतात जितके त्यांचे साथीदार मागतील",
          },
          {
            en: "The variety comes from manganese's d-orbitals being empty, so there is nothing to prevent electrons being removed from anywhere in the atom",
            hi: "विविधता मैंगनीज़ के d-कक्षकों के ख़ाली होने से आती है, अतः परमाणु में कहीं से भी इलेक्ट्रॉन हटाने से रोकने वाला कुछ नहीं",
            mr: "विविधता मँगेनीजचे d-कक्षक रिकामे असल्याने येते, म्हणून अणूत कुठूनही इलेक्ट्रॉन काढण्यापासून रोखणारे काही नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The student's suggestion has an easy counterexample and it is worth producing first, because a counterexample settles the matter faster than an explanation. Caesium has fifty-five electrons — more than manganese's twenty-five — and forms Cs⁺ and nothing else, ever. Barium has fifty-six and manages only Ba²⁺. Having many electrons is plainly not sufficient. The real question is not how many electrons an atom has but HOW MUCH IT COSTS TO REMOVE THE NEXT ONE. Look at sodium first. Its configuration is [Ne]3s¹. Take the 3s electron away and you have a neon core: a complete, tightly bound shell in which every electron is much closer to the nucleus and much more strongly held. The second ionisation energy is nearly ten times the first — 4562 kJ/mol against 496 — and nothing an ordinary chemical partner can offer comes close to paying it. So Na⁺ and only Na⁺. The energy landscape has a cliff immediately after the first electron. Now manganese, [Ar]3d⁵4s². The 4s and 3d orbitals are close in energy — so close that which fills first is a matter of a few tens of kilojoules and depends on the element. Removing the two 4s electrons gives Mn²⁺. Removing a 3d electron after that costs somewhat more, but not enormously more, because the 3d electrons are not in a deeper closed shell; they are in the same energy neighbourhood. So the ionisation energies climb gently rather than jumping, and each successive state is reachable if the partner offers enough in return. The landscape is a slope, not a cliff. Three consequences follow from that single structural fact. FIRST, the states differ by ONE. In the p-block, oxidation states usually differ by two — thallium shows +1 and +3, tin +2 and +4 — because electrons come and go in pairs from a filled s orbital. In the d-block they differ by one, because electrons are being removed singly from a set of near-degenerate orbitals. SECOND, the highest states need particular partners. Manganese reaches +7 in permanganate and in Mn₂O₇, both with oxygen, and never in a chloride. Oxygen and fluorine are small enough to crowd around one metal atom and electronegative enough to stabilise the enormous positive charge; chlorine is neither, and instead of forming MnCl₇ the system oxidises the chloride to chlorine gas. So the accessible state depends on the partner as much as on the metal. THIRD, the middle states are often the most stable, and the extremes are strong oxidising or reducing agents for the obvious reason — Mn⁷⁺ is a powerful oxidant because it has a long way to fall, and Cr²⁺ is a reducing agent because it has room to rise. A final structural note worth carrying: the d⁵ and d¹⁰ configurations show up repeatedly as unusually stable, which is why Mn²⁺ is the most common manganese state and Fe³⁺ is more stable than Fe²⁺ although iron is the later element. Half-filled and fully-filled sets are a recurring theme in this block, and noticing them explains a great many otherwise arbitrary-looking preferences. (The second option is refuted by caesium; the third would predict variable valency for every metal including sodium; the fourth misstates manganese's configuration, which has five d electrons and not none.)",
          hi: "विद्यार्थी के सुझाव का आसान प्रतिउदाहरण है और उसे पहले रखना चाहिए, क्योंकि प्रतिउदाहरण मामला किसी व्याख्या से तेज़ी से निपटा देता है। सीज़ियम के पचपन इलेक्ट्रॉन हैं — मैंगनीज़ के पच्चीस से अधिक — और वह Cs⁺ बनाता है और कभी कुछ और नहीं। बेरियम के छप्पन हैं और वह केवल Ba²⁺ सँभालता है। बहुत इलेक्ट्रॉन होना स्पष्टतः पर्याप्त नहीं। असली प्रश्न यह नहीं कि परमाणु के पास कितने इलेक्ट्रॉन हैं बल्कि यह कि अगला हटाने में कितना ख़र्च आता है। पहले सोडियम देखो। उसका विन्यास [Ne]3s¹ है। 3s इलेक्ट्रॉन हटाओ और तुम्हारे पास नियॉन का क्रोड है: पूरी, कसकर बँधी खोल जिसमें हर इलेक्ट्रॉन नाभिक के कहीं अधिक पास और कहीं अधिक प्रबलता से पकड़ा है। द्वितीय आयनन ऊर्जा प्रथम की लगभग दस गुनी है — 4562 kJ/mol बनाम 496 — और कोई साधारण रासायनिक साथी जो दे सकता है वह उसके पास तक नहीं पहुँचता। अतः Na⁺ और केवल Na⁺. ऊर्जा-भूदृश्य में पहले इलेक्ट्रॉन के तुरंत बाद खाई है। अब मैंगनीज़, [Ar]3d⁵4s². 4s और 3d कक्षक ऊर्जा में पास हैं — इतने पास कि कौन पहले भरता है यह कुछ दसियों किलोजूल की बात है और तत्व पर निर्भर है। दोनों 4s इलेक्ट्रॉन हटाने से Mn²⁺ मिलता है। उसके बाद एक 3d इलेक्ट्रॉन हटाना कुछ अधिक महँगा है, पर बहुत अधिक नहीं, क्योंकि 3d इलेक्ट्रॉन किसी गहरी बंद खोल में नहीं; वे उसी ऊर्जा-पड़ोस में हैं। अतः आयनन ऊर्जाएँ छलाँग लगाने के बजाय धीरे-धीरे चढ़ती हैं, और हर अगली अवस्था पहुँच में है यदि साथी बदले में पर्याप्त दे। भूदृश्य ढलान है, खाई नहीं। उसी एक संरचनात्मक तथ्य से तीन परिणाम निकलते हैं। पहला, अवस्थाएँ एक से भिन्न हैं। p-ब्लॉक में ऑक्सीकरण अवस्थाएँ प्रायः दो से भिन्न होती हैं — थैलियम +1 और +3 दिखाता है, टिन +2 और +4 — क्योंकि इलेक्ट्रॉन भरे s कक्षक से युग्मों में आते-जाते हैं। d-ब्लॉक में वे एक से भिन्न हैं, क्योंकि इलेक्ट्रॉन लगभग समान ऊर्जा के कक्षकों के समुच्चय से एक-एक करके हटाए जा रहे हैं। दूसरा, सबसे ऊँची अवस्थाओं को विशेष साथी चाहिए। मैंगनीज़ परमैंगनेट और Mn₂O₇ में +7 तक पहुँचता है, दोनों ऑक्सीजन के साथ, और किसी क्लोराइड में कभी नहीं। ऑक्सीजन और फ़्लुओरीन एक धातु परमाणु के गिर्द भीड़ करने भर छोटे और उस विशाल धन आवेश को स्थायी करने भर विद्युत ऋणात्मक हैं; क्लोरीन दोनों नहीं, और MnCl₇ बनाने के बजाय तंत्र क्लोराइड को क्लोरीन गैस में उपचयित कर देता है। अतः पहुँच वाली अवस्था धातु जितनी ही साथी पर निर्भर है। तीसरा, बीच की अवस्थाएँ प्रायः सबसे स्थायी हैं, और सिरे प्रबल उपचायक या अपचायक हैं, और कारण स्पष्ट है — Mn⁷⁺ प्रबल उपचायक है क्योंकि उसे गिरने को लंबा रास्ता है, और Cr²⁺ अपचायक है क्योंकि उसे चढ़ने की जगह है। साथ ले जाने योग्य एक अंतिम संरचनात्मक टिप्पणी: d⁵ और d¹⁰ विन्यास बार-बार असामान्य रूप से स्थायी निकलते हैं, इसीलिए Mn²⁺ मैंगनीज़ की सबसे आम अवस्था है और Fe³⁺, Fe²⁺ से अधिक स्थायी है यद्यपि लोहा बाद का तत्व है। आधी भरी और पूरी भरी समुच्चय इस ब्लॉक का लौटता विषय हैं, और उन्हें पहचानना बहुत सारी अन्यथा मनमानी दिखती वरीयताओं को समझा देता है। (दूसरा विकल्प सीज़ियम से झुठलाया जाता है; तीसरा सोडियम सहित हर धातु के लिए परिवर्ती संयोजकता की भविष्यवाणी करता; चौथा मैंगनीज़ का विन्यास ग़लत बताता है, जिसमें पाँच d इलेक्ट्रॉन हैं, कोई नहीं ऐसा नहीं।)",
          mr: "विद्यार्थ्याच्या सूचनेला सोपे प्रतिउदाहरण आहे आणि ते आधी मांडायला हवे, कारण प्रतिउदाहरण प्रकरण कोणत्याही स्पष्टीकरणाहून वेगाने निकालात काढते. सीझियमकडे पंचावन्न इलेक्ट्रॉन आहेत — मँगेनीजच्या पंचवीसहून अधिक — आणि तो Cs⁺ बनवतो आणि कधी दुसरे काहीही नाही. बेरियमकडे छप्पन आहेत आणि तो केवळ Ba²⁺ सांभाळतो. पुष्कळ इलेक्ट्रॉन असणे स्पष्टपणे पुरेसे नाही. खरा प्रश्न हा नाही की अणूकडे किती इलेक्ट्रॉन आहेत तर हा की पुढचा काढायला किती खर्च येतो. आधी सोडियम पाहा. त्याची मांडणी [Ne]3s¹ आहे. 3s इलेक्ट्रॉन काढा आणि तुमच्याकडे निऑनचा गाभा आहे: पूर्ण, घट्ट बांधलेले कवच ज्यात प्रत्येक इलेक्ट्रॉन केंद्रकाच्या कितीतरी जवळ आणि कितीतरी तीव्रपणे धरलेला. द्वितीय आयनन ऊर्जा प्रथमच्या जवळपास दहापट आहे — 4562 kJ/mol विरुद्ध 496 — आणि कोणताही साधा रासायनिक साथीदार जे देऊ शकतो ते तिच्याजवळही पोहोचत नाही. म्हणून Na⁺ आणि केवळ Na⁺. ऊर्जा-भूदृश्यात पहिल्या इलेक्ट्रॉननंतर लगेच दरी आहे. आता मँगेनीज, [Ar]3d⁵4s². 4s आणि 3d कक्षक ऊर्जेत जवळ आहेत — इतके जवळ की कोण आधी भरतो ही काही दशकांच्या किलोज्यूलची बाब आहे आणि मूलद्रव्यावर अवलंबून आहे. दोन्ही 4s इलेक्ट्रॉन काढल्याने Mn²⁺ मिळतो. त्यानंतर एक 3d इलेक्ट्रॉन काढणे काहीसे महाग आहे, पण फार अधिक नाही, कारण 3d इलेक्ट्रॉन कोणत्याही खोल बंद कवचात नाहीत; ते त्याच ऊर्जा-शेजारात आहेत. म्हणून आयनन ऊर्जा उडी मारण्याऐवजी हळूहळू चढतात, आणि प्रत्येक पुढची अवस्था आवाक्यात आहे जर साथीदार बदल्यात पुरेसे देईल. भूदृश्य उतार आहे, दरी नाही. त्याच एका संरचनात्मक सत्यातून तीन परिणाम निघतात. पहिला, अवस्था एकाने वेगळ्या आहेत. p-खंडात उपचयन अवस्था बहुधा दोनने वेगळ्या असतात — थॅलियम +1 आणि +3 दाखवतो, कथिल +2 आणि +4 — कारण इलेक्ट्रॉन भरलेल्या s कक्षकातून जोड्यांत येतात-जातात. d-खंडात त्या एकाने वेगळ्या आहेत, कारण इलेक्ट्रॉन जवळपास समान ऊर्जेच्या कक्षकांच्या संचातून एकेक करून काढले जात आहेत. दुसरा, सर्वांत उंच अवस्थांना विशिष्ट साथीदार लागतात. मँगेनीज परमँगेनेट आणि Mn₂O₇ मध्ये +7 पर्यंत पोहोचतो, दोन्ही ऑक्सिजनसह, आणि कोणत्याही क्लोराइडमध्ये कधीच नाही. ऑक्सिजन आणि फ्लोरिन एका धातू अणूभोवती गर्दी करण्याइतके लहान आणि त्या प्रचंड धन प्रभाराला स्थिर करण्याइतके विद्युत ऋण आहेत; क्लोरीन दोन्ही नाही, आणि MnCl₇ बनवण्याऐवजी संस्था क्लोराइडचे क्लोरीन वायूत उपचयन करते. म्हणून आवाक्यातली अवस्था धातूइतकीच साथीदारावर अवलंबून आहे. तिसरा, मधल्या अवस्था बहुधा सर्वांत स्थिर आहेत, आणि टोके तीव्र उपचायक वा अपचायक आहेत, आणि कारण स्पष्ट आहे — Mn⁷⁺ तीव्र उपचायक आहे कारण त्याला पडायला लांब वाट आहे, आणि Cr²⁺ अपचायक आहे कारण त्याला चढायला जागा आहे. सोबत न्यायची एक अखेरची संरचनात्मक टीप: d⁵ आणि d¹⁰ मांडण्या वारंवार असामान्यपणे स्थिर निघतात, म्हणूनच Mn²⁺ ही मँगेनीजची सर्वांत सामान्य अवस्था आहे आणि Fe³⁺ हे Fe²⁺ हून अधिक स्थिर आहे जरी लोखंड नंतरचे मूलद्रव्य असले तरी. अर्धी भरलेली आणि पूर्ण भरलेली संचे या खंडाचा परतणारा विषय आहेत, आणि त्यांना ओळखणे पुष्कळशा अन्यथा मनमानी दिसणाऱ्या प्राधान्यांना समजावते. (दुसरा पर्याय सीझियमने खोडला जातो; तिसरा सोडियमसह प्रत्येक धातूसाठी बदलती संयुजा भाकीत करेल; चौथा मँगेनीजची मांडणी चुकीची सांगतो, जिच्यात पाच d इलेक्ट्रॉन आहेत, एकही नाही असे नाही.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Zirconium and hafnium have almost identical atomic radii — about 160 pm each — although hafnium is a whole period lower and has thirty-two more protons. They were not separated until 1923 and are still hard to separate. Explain.",
          hi: "ज़र्कोनियम और हैफ़्नियम की परमाणु त्रिज्याएँ लगभग समरूप हैं — हर एक लगभग 160 pm — यद्यपि हैफ़्नियम पूरी एक आवर्त नीचे है और उसके बत्तीस प्रोटॉन अधिक हैं। वे 1923 तक अलग नहीं किए जा सके और आज भी अलग करना कठिन है। समझाओ।",
          mr: "झिर्कोनियम आणि हाफ्नियम यांच्या अणुत्रिज्या जवळपास सारख्या आहेत — प्रत्येकी सुमारे 160 pm — जरी हाफ्नियम अख्खी एक आवर्त खाली आहे आणि त्याच्याकडे बत्तीस प्रोटॉन अधिक आहेत. ते 1923 पर्यंत वेगळे केले जाऊ शकले नाहीत आणि आजही वेगळे करणे कठीण आहे. समजावा.",
        },
        choices: [
          {
            en: "Between them lie the fourteen lanthanoids, across which the 4f electrons shield the nucleus badly, so each added proton pulls the outer shell in a little more than the added electron pushes it out. Fourteen small contractions accumulate into a large one, and it almost exactly cancels the increase in size that going down a period would otherwise give. Since chemical behaviour is governed mainly by size and charge, and these two share both, they behave almost identically — which is why they occur together in ores and resisted separation for over a century",
            hi: "उनके बीच चौदह लैंथेनॉयड पड़े हैं, जिनके आर-पार 4f इलेक्ट्रॉन नाभिक को बुरी तरह ढकते हैं, अतः हर जोड़ा गया प्रोटॉन बाहरी खोल को उससे थोड़ा अधिक भीतर खींचता है जितना जोड़ा गया इलेक्ट्रॉन उसे बाहर धकेलता है। चौदह छोटे संकुचन जुड़कर एक बड़ा बनते हैं, और वह आकार में उस वृद्धि को लगभग ठीक-ठीक काट देता है जो एक आवर्त नीचे जाने से अन्यथा मिलती। चूँकि रासायनिक आचरण मुख्यतः आकार और आवेश से चलता है, और ये दोनों दोनों बाँटते हैं, वे लगभग समरूप बरतते हैं — इसीलिए वे अयस्कों में साथ मिलते हैं और सदी भर से अधिक पृथक्करण का प्रतिरोध करते रहे",
            mr: "त्यांच्यामध्ये चौदा लॅंथेनॉइड पडले आहेत, ज्यांच्या आरपार 4f इलेक्ट्रॉन केंद्रकाला वाईट रीतीने झाकतात, म्हणून प्रत्येक जोडलेला प्रोटॉन बाहेरचे कवच त्याहून थोडे अधिक आत ओढतो जितके जोडलेला इलेक्ट्रॉन ते बाहेर ढकलतो. चौदा लहान आकुंचने जुळून एक मोठे बनतात, आणि ते आकारातील त्या वाढीला जवळपास नेमके कापते जी एक आवर्त खाली गेल्याने अन्यथा मिळाली असती. रासायनिक वर्तन मुख्यतः आकार आणि प्रभाराने चालत असल्याने, आणि हे दोघे दोन्ही वाटून घेत असल्याने, ते जवळपास सारखे वागतात — म्हणूनच ते खनिजांत एकत्र आढळतात आणि शतकाहून अधिक काळ वेगळेपणाला विरोध करत राहिले",
          },
          {
            en: "The two are almost the same size because hafnium's extra protons are balanced by its extra neutrons, which add mass without adding charge",
            hi: "दोनों लगभग एक ही आकार के हैं क्योंकि हैफ़्नियम के अतिरिक्त प्रोटॉन उसके अतिरिक्त न्यूट्रॉनों से संतुलित हैं, जो आवेश जोड़े बिना द्रव्यमान जोड़ते हैं",
            mr: "दोघे जवळपास एकाच आकाराचे आहेत कारण हाफ्नियमचे जादा प्रोटॉन त्याच्या जादा न्यूट्रॉनांनी तोलले जातात, जे प्रभार न जोडता वस्तुमान जोडतात",
          },
          {
            en: "They are the same size by coincidence, and there is no general reason — the second and third transition series are otherwise quite unlike each other",
            hi: "वे संयोग से एक आकार के हैं, और कोई सामान्य कारण नहीं — दूसरी और तीसरी संक्रमण श्रेणियाँ अन्यथा एक-दूसरे से काफ़ी भिन्न हैं",
            mr: "ते योगायोगाने एकाच आकाराचे आहेत, आणि कोणतेही सर्वसाधारण कारण नाही — दुसरी आणि तिसरी संक्रमण श्रेणी अन्यथा एकमेकांहून बऱ्याच वेगळ्या आहेत",
          },
          {
            en: "Hafnium is smaller than expected because its 5d electrons are held in orbitals that do not extend as far as 4d ones, which has nothing to do with the lanthanoids",
            hi: "हैफ़्नियम अपेक्षा से छोटा है क्योंकि उसके 5d इलेक्ट्रॉन ऐसे कक्षकों में हैं जो 4d जितनी दूर नहीं फैलते, और इसका लैंथेनॉयडों से कोई लेना-देना नहीं",
            mr: "हाफ्नियम अपेक्षेहून लहान आहे कारण त्याचे 5d इलेक्ट्रॉन अशा कक्षकांत आहेत जे 4d इतके दूर पसरत नाहीत, आणि याचा लॅंथेनॉइडांशी काहीही संबंध नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "This is a case where a small effect, repeated enough times, changes the chemistry of a whole row — and it is worth working through because the reasoning generalises. WHAT THE EXPECTATION IS. Going down a group normally increases the atomic radius substantially: a new shell is added, and the outer electrons sit further out. Titanium to zirconium is a jump of about 15 pm. On that pattern zirconium to hafnium should be a similar jump, and hafnium should be noticeably the larger. It is not. The two measure about 160 and 159 pm — a difference of a picometre, which is nothing. WHAT INTERVENES. Between zirconium (Z = 40) and hafnium (Z = 72) lie the fourteen lanthanoids, and going across them adds fourteen protons while filling the 4f subshell. The key point is about SHIELDING. An added electron partly cancels the effect of the added proton on the outer electrons, and how well it does so depends on the shape of the orbital it occupies. An s electron shields well; a p electron less well; a d electron less again; and a 4f electron shields poorly, because 4f orbitals are diffuse and heavily lobed and spend little time between the nucleus and the outer shell. So across the lanthanoids each added proton is felt by the outer electrons more than the added 4f electron cancels it. The net effective nuclear charge creeps up, and the atom contracts a little at each step. A single step is small — a picometre or two. Fourteen of them are not. The accumulated contraction is enough to cancel almost exactly the expansion that adding a shell would have produced, and hafnium ends up the same size as zirconium. WHAT FOLLOWS. Chemical behaviour is governed largely by size and by charge, and these two elements share both: same group, same common oxidation state of +4, same ionic radius to within a fraction of a picometre. So they form the same compounds with the same structures and almost the same solubilities. They occur together in the same ores, and hafnium was not identified as a separate element until 1923 — the last stable element to be discovered, hidden inside zirconium samples the whole time. Separating them today is done by solvent extraction or ion exchange, and it is expensive; it matters because zirconium is nearly transparent to neutrons and hafnium absorbs them greedily, so nuclear reactor cladding needs hafnium-free zirconium and control rods want the hafnium. Two elements a chemist can barely tell apart are opposites to a neutron. THE GENERAL POINT. The lanthanoid contraction is why the second and third transition series resemble each other far more closely than either resembles the first — niobium and tantalum, molybdenum and tungsten, ruthenium and osmium are all near-twins for the same reason. A small systematic effect, accumulated over enough steps, has restructured the periodic table's lower half. That is worth noticing as a pattern in its own right: many chemical trends are not single large causes but small ones that were repeated. (The second option gives neutrons an electrostatic role they do not have; the third denies a general effect that explains an entire row of near-twins; the fourth invents an orbital-extent argument that would apply equally to titanium and zirconium and so cannot explain the anomaly.)",
          hi: "यह ऐसी स्थिति है जहाँ छोटा प्रभाव, पर्याप्त बार दोहराया जाकर, पूरी पंक्ति का रसायन बदल देता है — और इसे साधना चाहिए क्योंकि तर्क सामान्यीकृत होता है। अपेक्षा क्या है। किसी वर्ग में नीचे जाने पर परमाणु त्रिज्या प्रायः काफ़ी बढ़ती है: नई खोल जुड़ती है, और बाहरी इलेक्ट्रॉन अधिक बाहर बैठते हैं। टाइटेनियम से ज़र्कोनियम लगभग 15 pm की छलाँग है। उस ढर्रे पर ज़र्कोनियम से हैफ़्नियम भी वैसी ही छलाँग होनी चाहिए, और हैफ़्नियम ध्यान देने योग्य ढंग से बड़ा होना चाहिए। वह नहीं है। दोनों लगभग 160 और 159 pm नापते हैं — एक पिकोमीटर का अंतर, जो कुछ भी नहीं। बीच में क्या पड़ता है। ज़र्कोनियम (Z = 40) और हैफ़्नियम (Z = 72) के बीच चौदह लैंथेनॉयड पड़े हैं, और उनके आर-पार जाने में चौदह प्रोटॉन जुड़ते हैं जबकि 4f उपखोल भरती है। मुख्य बात परिरक्षण की है। जोड़ा गया इलेक्ट्रॉन बाहरी इलेक्ट्रॉनों पर जोड़े गए प्रोटॉन के प्रभाव को आंशिक रूप से काटता है, और वह कितना अच्छा काटता है यह उस कक्षक के आकार पर निर्भर है जिसमें वह बैठा है। s इलेक्ट्रॉन अच्छा परिरक्षण करता है; p इलेक्ट्रॉन उससे कम; d इलेक्ट्रॉन फिर कम; और 4f इलेक्ट्रॉन बुरा परिरक्षण करता है, क्योंकि 4f कक्षक फैले हुए और बहुत पालियों वाले हैं तथा नाभिक और बाहरी खोल के बीच कम समय बिताते हैं। अतः लैंथेनॉयडों के आर-पार हर जोड़ा गया प्रोटॉन बाहरी इलेक्ट्रॉनों को उससे अधिक महसूस होता है जितना जोड़ा गया 4f इलेक्ट्रॉन उसे काटता है। प्रभावी नाभिकीय आवेश चुपचाप चढ़ता है, और हर क़दम पर परमाणु थोड़ा सिकुड़ता है। एक क़दम छोटा है — एक-दो पिकोमीटर। उनमें से चौदह नहीं। जमा हुआ संकुचन उस प्रसार को लगभग ठीक-ठीक काटने भर है जो खोल जोड़ने से मिलता, और हैफ़्नियम ज़र्कोनियम जितना ही निकलता है। इससे क्या निकलता है। रासायनिक आचरण मुख्यतः आकार और आवेश से चलता है, और ये दोनों दोनों बाँटते हैं: वही वर्ग, वही आम ऑक्सीकरण अवस्था +4, वही आयनिक त्रिज्या पिकोमीटर के अंश तक। अतः वे एक ही संरचनाओं वाले वही यौगिक और लगभग वही विलेयताएँ बनाते हैं। वे उन्हीं अयस्कों में साथ मिलते हैं, और हैफ़्नियम 1923 तक अलग तत्व के रूप में पहचाना ही नहीं गया — खोजा गया अंतिम स्थायी तत्व, पूरे समय ज़र्कोनियम के नमूनों के भीतर छिपा। आज उन्हें विलायक निष्कर्षण या आयन विनिमय से अलग किया जाता है, और वह महँगा है; वह मायने इसलिए रखता है कि ज़र्कोनियम न्यूट्रॉनों के लिए लगभग पारदर्शी है और हैफ़्नियम उन्हें लालच से सोखता है, अतः नाभिकीय रिएक्टर के आवरण को हैफ़्नियम-रहित ज़र्कोनियम चाहिए और नियंत्रण छड़ों को हैफ़्नियम। दो तत्व जिन्हें रसायनज्ञ मुश्किल से अलग बता सकता है, न्यूट्रॉन के लिए उलटे हैं। सामान्य बात। लैंथेनॉयड संकुचन ही कारण है कि दूसरी और तीसरी संक्रमण श्रेणियाँ एक-दूसरे से कहीं अधिक मिलती हैं, बनिस्बत किसी के पहली से — नाइओबियम और टैंटलम, मॉलिब्डेनम और टंगस्टन, रूथीनियम और ऑस्मियम सब उसी कारण लगभग जुड़वाँ हैं। छोटा व्यवस्थित प्रभाव, पर्याप्त क़दमों पर जमा होकर, आवर्त सारणी का निचला आधा फिर से गढ़ चुका है। यह अपने आप में ढर्रे के रूप में ध्यान देने योग्य है: बहुत सारी रासायनिक प्रवृत्तियाँ एकल बड़े कारण नहीं बल्कि छोटे कारण हैं जो दोहराए गए। (दूसरा विकल्प न्यूट्रॉनों को ऐसी स्थिरवैद्युत भूमिका देता है जो उनकी नहीं; तीसरा ऐसे सामान्य प्रभाव से इनकार करता है जो लगभग जुड़वाँ तत्वों की पूरी पंक्ति समझाता है; चौथा कक्षक-विस्तार का तर्क गढ़ता है जो टाइटेनियम और ज़र्कोनियम पर भी उतना ही लागू होता और इसलिए विषमता समझा नहीं सकता।)",
          mr: "ही अशी स्थिती आहे जिथे लहान परिणाम, पुरेशा वेळा पुनरावृत्त होऊन, अख्ख्या रांगेचे रसायन बदलतो — आणि हे सोडवण्याजोगे आहे कारण युक्तिवाद सर्वसाधारण होतो. अपेक्षा काय आहे. एखाद्या गटात खाली जाताना अणुत्रिज्या सहसा बरीच वाढते: नवे कवच जोडले जाते, आणि बाहेरचे इलेक्ट्रॉन अधिक बाहेर बसतात. टायटॅनियमपासून झिर्कोनियम ही सुमारे 15 pm ची उडी आहे. त्या आकृतिबंधावर झिर्कोनियमपासून हाफ्नियमही तशीच उडी असावी, आणि हाफ्नियम लक्षणीयरीत्या मोठे असावे. ते नाही. दोन्ही सुमारे 160 आणि 159 pm मोजतात — एका पिकोमीटरचा फरक, जो काहीच नाही. मध्ये काय पडते. झिर्कोनियम (Z = 40) आणि हाफ्नियम (Z = 72) यांच्यामध्ये चौदा लॅंथेनॉइड पडले आहेत, आणि त्यांच्या आरपार जाताना चौदा प्रोटॉन जोडले जातात तर 4f उपकवच भरते. मुख्य मुद्दा आवरणाचा आहे. जोडलेला इलेक्ट्रॉन बाहेरच्या इलेक्ट्रॉनांवरील जोडलेल्या प्रोटॉनचा परिणाम अंशतः कापतो, आणि तो किती चांगला कापतो हे तो ज्या कक्षकात बसला आहे त्याच्या आकारावर अवलंबून आहे. s इलेक्ट्रॉन चांगले आवरण करतो; p इलेक्ट्रॉन त्याहून कमी; d इलेक्ट्रॉन आणखी कमी; आणि 4f इलेक्ट्रॉन वाईट आवरण करतो, कारण 4f कक्षक पसरलेले आणि खूप पाकळ्यांचे आहेत आणि केंद्रक व बाहेरचे कवच यांच्यामध्ये कमी वेळ घालवतात. म्हणून लॅंथेनॉइडांच्या आरपार प्रत्येक जोडलेला प्रोटॉन बाहेरच्या इलेक्ट्रॉनांना त्याहून अधिक जाणवतो जितका जोडलेला 4f इलेक्ट्रॉन त्याला कापतो. प्रभावी केंद्रकीय प्रभार मुकाट्याने चढतो, आणि प्रत्येक पावलावर अणू थोडा आकुंचन पावतो. एक पाऊल लहान आहे — एक-दोन पिकोमीटर. त्यांतली चौदा नाहीत. साठलेले आकुंचन त्या प्रसरणाला जवळपास नेमके कापण्याइतके आहे जे कवच जोडल्याने मिळाले असते, आणि हाफ्नियम झिर्कोनियमइतकेच निघते. यातून काय निघते. रासायनिक वर्तन मुख्यतः आकार आणि प्रभाराने चालते, आणि हे दोघे दोन्ही वाटून घेतात: तोच गट, तीच सामान्य उपचयन अवस्था +4, तीच आयनी त्रिज्या पिकोमीटरच्या अंशापर्यंत. म्हणून ते एकाच रचनांची तीच संयुगे आणि जवळपास त्याच विद्राव्यता बनवतात. ते त्याच खनिजांत एकत्र आढळतात, आणि हाफ्नियम 1923 पर्यंत वेगळे मूलद्रव्य म्हणून ओळखलेच गेले नाही — शोधलेले शेवटचे स्थिर मूलद्रव्य, अख्खा काळ झिर्कोनियमच्या नमुन्यांत लपलेले. आज त्यांना द्रावक निष्कर्षण वा आयन विनिमयाने वेगळे केले जाते, आणि ते महाग आहे; ते महत्त्वाचे यासाठी की झिर्कोनियम न्यूट्रॉनांसाठी जवळपास पारदर्शक आहे आणि हाफ्नियम त्यांना लोभाने शोषते, म्हणून केंद्रकीय अणुभट्टीच्या आवरणाला हाफ्नियम-विरहित झिर्कोनियम लागते आणि नियंत्रण कांड्यांना हाफ्नियम. दोन मूलद्रव्ये जी रसायनशास्त्रज्ञ जेमतेम वेगळी सांगू शकतो, न्यूट्रॉनसाठी उलट आहेत. सर्वसाधारण मुद्दा. लॅंथेनॉइड आकुंचन हेच कारण की दुसरी आणि तिसरी संक्रमण श्रेणी एकमेकांशी कितीतरी अधिक जुळतात, कोणाच्याही पहिलीशी जुळण्याहून — नायोबियम आणि टँटॅलम, मॉलिब्डेनम आणि टंगस्टन, रुथेनियम आणि ऑस्मियम सर्व त्याच कारणाने जवळपास जुळे आहेत. लहान पद्धतशीर परिणाम, पुरेशा पावलांवर साठून, आवर्त सारणीचा खालचा अर्धा भाग पुन्हा घडवून बसला आहे. हे स्वतःच आकृतिबंध म्हणून लक्षात घेण्याजोगे आहे: पुष्कळशा रासायनिक प्रवृत्ती एकेरी मोठी कारणे नसून लहान कारणे आहेत जी पुनरावृत्त झाली. (दुसरा पर्याय न्यूट्रॉनांना अशी स्थिरविद्युत भूमिका देतो जी त्यांची नाही; तिसरा असा सर्वसाधारण परिणाम नाकारतो जो जवळपास जुळ्या मूलद्रव्यांची अख्खी रांग समजावतो; चौथा कक्षक-विस्ताराचा युक्तिवाद घडवतो जो टायटॅनियम आणि झिर्कोनियमवरही तितकाच लागू होईल आणि म्हणून विसंगती समजावू शकत नाही.)",
        },
      },
    ],
  },
  /*C3*/
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
  "chemistry-12-chemical-kinetics": [
    {
      level: 1,
      stem: {
        en: "A first-order reaction has a rate constant of 0.0231 min⁻¹. What is its half-life, in minutes? Take ln 2 = 0.693.",
        hi: "किसी प्रथम कोटि अभिक्रिया का वेग स्थिरांक 0.0231 min⁻¹ है। उसकी अर्धायु, मिनट में, क्या है? ln 2 = 0.693 लो।",
        mr: "एका प्रथम कोटी अभिक्रियेचा वेग स्थिरांक 0.0231 min⁻¹ आहे. तिचे अर्धायुष्य, मिनिटांत, किती? ln 2 = 0.693 घ्या.",
      },
      answer: 30,
      wrong: [0.0231, 3, 300],
      checkExpr: "0.693/0.0231",
      solution: {
        en: "t½ = 0.693/k = 0.693/0.0231 = 30 min. Note what the answer does NOT contain: the starting concentration. For first order alone the half-life is independent of how much you began with, which is why a first-order plot can be identified from the data without knowing the initial amount. (0.0231 quotes k back as a time.)",
        hi: "t½ = 0.693/k = 0.693/0.0231 = 30 min. ध्यान दो कि उत्तर में क्या नहीं है: आरंभिक सांद्रता। केवल प्रथम कोटि के लिए अर्धायु इस बात से स्वतंत्र है कि तुमने कितने से शुरू किया, इसीलिए प्रथम कोटि का ग्राफ़ आरंभिक मात्रा जाने बिना आँकड़ों से पहचाना जा सकता है। (0.0231 k को ही समय बताकर लौटा देता है।)",
        mr: "t½ = 0.693/k = 0.693/0.0231 = 30 min. उत्तरात काय नाही ते लक्षात घ्या: प्रारंभिक संहती. केवळ प्रथम कोटीसाठी अर्धायुष्य तुम्ही किती पासून सुरू केले यापासून स्वतंत्र आहे, म्हणूनच प्रथम कोटीचा आलेख प्रारंभिक प्रमाण न जाणता माहितीवरून ओळखता येतो. (0.0231 k लाच काळ म्हणून परत सांगते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "A reaction has the experimentally determined rate law rate = k[A][B]². What is its overall order?",
        hi: "किसी अभिक्रिया का प्रयोग से तय वेग नियम वेग = k[A][B]² है। उसकी समग्र कोटि क्या है?",
        mr: "एका अभिक्रियेचा प्रयोगाने ठरलेला वेग नियम वेग = k[A][B]² आहे. तिची एकूण कोटी किती?",
      },
      answer: 3,
      wrong: [2, 4, 1],
      checkExpr: "1+2",
      solution: {
        en: "Overall order is the sum of the exponents: 1 + 2 = 3. The reaction is first order in A and second order in B, and the two facts together make it third order overall. Note that this says nothing about the coefficients in the balanced equation, which are a separate matter entirely. (2 counts only the largest exponent.)",
        hi: "समग्र कोटि घातों का योग है: 1 + 2 = 3. अभिक्रिया A में प्रथम कोटि की और B में द्वितीय कोटि की है, और दोनों तथ्य मिलकर उसे समग्र रूप से तृतीय कोटि का बनाते हैं। ध्यान दो कि यह संतुलित समीकरण के गुणांकों के बारे में कुछ नहीं कहता, जो बिलकुल अलग मामला हैं। (2 केवल सबसे बड़ी घात गिन लेता है।)",
        mr: "एकूण कोटी म्हणजे घातींची बेरीज: 1 + 2 = 3. अभिक्रिया A मध्ये प्रथम कोटीची आणि B मध्ये द्वितीय कोटीची आहे, आणि दोन्ही सत्ये मिळून तिला एकूण तृतीय कोटीची बनवतात. लक्षात घ्या की हे संतुलित समीकरणाच्या गुणकांबद्दल काहीही सांगत नाही, जे पूर्णपणे वेगळे प्रकरण आहे. (2 केवळ सर्वांत मोठी घात मोजते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Doubling the concentration of A quadruples the rate, with everything else held constant. What is the order of the reaction with respect to A?",
        hi: "बाक़ी सब स्थिर रखते हुए A की सांद्रता दुगुनी करने पर वेग चौगुना हो जाता है। A के सापेक्ष अभिक्रिया की कोटि क्या है?",
        mr: "बाकी सर्व स्थिर ठेवून A ची संहती दुप्पट केल्यावर वेग चौपट होतो. A च्या सापेक्ष अभिक्रियेची कोटी किती?",
      },
      answer: 2,
      wrong: [1, 4, 0.5],
      checkExpr: "4/2",
      solution: {
        en: "If doubling gives 2ⁿ = 4, then n = 2 — that is, 4/2 = 2. Changing one concentration at a time and watching what the rate does is exactly how orders are measured, and it is the only way: no amount of staring at the balanced equation would have given this. (4 quotes the rate factor as the order.)",
        hi: "यदि दुगुना करने पर 2ⁿ = 4, तो n = 2 — अर्थात् 4/2 = 2. एक बार में एक सांद्रता बदलना और देखना कि वेग क्या करता है, ठीक इसी तरह कोटियाँ नापी जाती हैं, और यही एकमात्र रास्ता है: संतुलित समीकरण को कितना भी घूरने से यह नहीं मिलता। (4 वेग के गुणक को ही कोटि बता देता है।)",
        mr: "जर दुप्पट केल्यावर 2ⁿ = 4, तर n = 2 — म्हणजे 4/2 = 2. एका वेळी एक संहती बदलणे आणि वेग काय करतो ते पाहणे, नेमक्या याच प्रकारे कोट्या मोजल्या जातात, आणि हाच एकमेव मार्ग: संतुलित समीकरणाकडे कितीही टक लावून पाहून हे मिळाले नसते. (4 वेगाचा गुणकच कोटी सांगते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "A first-order reaction is 75 per cent complete in 20 minutes. What is its half-life, in minutes?",
        hi: "कोई प्रथम कोटि अभिक्रिया 20 मिनट में 75 प्रतिशत पूरी हो जाती है। उसकी अर्धायु, मिनट में, क्या है?",
        mr: "एक प्रथम कोटी अभिक्रिया 20 मिनिटांत 75 टक्के पूर्ण होते. तिचे अर्धायुष्य, मिनिटांत, किती?",
      },
      answer: 10,
      wrong: [15, 5, 40],
      checkExpr: "20/2",
      solution: {
        en: "Seventy-five per cent complete means a quarter remains, which is two halvings, so 20 minutes is two half-lives and each is 20/2 = 10 min. Counting in halvings rather than in percentages is much the quicker route: 50 per cent is one, 75 is two, 87.5 is three. (15 treats the decay as linear in time.)",
        hi: "पचहत्तर प्रतिशत पूरी होने का अर्थ है चौथाई बचा, जो दो बार आधा होना है, अतः 20 मिनट दो अर्धायुएँ हैं और हर एक 20/2 = 10 min. प्रतिशतों के बजाय आधे होने में गिनना कहीं तेज़ रास्ता है: 50 प्रतिशत एक है, 75 दो, 87.5 तीन। (15 क्षय को समय में रैखिक मान लेता है।)",
        mr: "पंचाहत्तर टक्के पूर्ण होणे म्हणजे चतुर्थांश उरला, जे दोनदा निम्मे होणे आहे, म्हणून 20 मिनिटे ही दोन अर्धायुष्ये आहेत आणि प्रत्येक 20/2 = 10 min. टक्केवारीऐवजी निम्मे होण्यात मोजणे कितीतरी जलद मार्ग: 50 टक्के एक आहे, 75 दोन, 87.5 तीन. (15 क्षयाला काळात रेषीय मानते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A first-order reaction has k = 0.05 s⁻¹. What is the rate, in mol L⁻¹ s⁻¹, when the concentration is 2 mol/L?",
        hi: "किसी प्रथम कोटि अभिक्रिया का k = 0.05 s⁻¹ है। सांद्रता 2 mol/L होने पर वेग, mol L⁻¹ s⁻¹ में, क्या है?",
        mr: "एका प्रथम कोटी अभिक्रियेचा k = 0.05 s⁻¹ आहे. संहती 2 mol/L असताना वेग, mol L⁻¹ s⁻¹ मध्ये, किती?",
      },
      answer: 0.1,
      wrong: [0.025, 40, 0.2],
      checkExpr: "0.05*2",
      solution: {
        en: "Rate = k[A] = 0.05 × 2 = 0.1 mol L⁻¹ s⁻¹. Notice that the rate falls as the reaction proceeds and the concentration drops, while k does not — the rate is a moving quantity and the rate constant is the fixed one, and confusing them is the commonest error in this chapter. (0.025 divides rather than multiplying.)",
        hi: "वेग = k[A] = 0.05 × 2 = 0.1 mol L⁻¹ s⁻¹. ध्यान दो कि अभिक्रिया चलते और सांद्रता गिरते हुए वेग घटता है, जबकि k नहीं — वेग चलती राशि है और वेग स्थिरांक स्थिर, और उन्हें गड्डमड्ड करना इस अध्याय की सबसे आम भूल है। (0.025 गुणा करने के बजाय भाग दे देता है।)",
        mr: "वेग = k[A] = 0.05 × 2 = 0.1 mol L⁻¹ s⁻¹. लक्षात घ्या की अभिक्रिया चालताना आणि संहती घसरताना वेग घटतो, तर k नाही — वेग ही हलती राशी आहे आणि वेग स्थिरांक स्थिर, आणि त्यांची गल्लत करणे ही या प्रकरणातली सर्वांत सामान्य चूक. (0.025 गुणण्याऐवजी भागते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "A reaction's rate constant doubles for every 10 K rise in temperature. By what factor does it change for a rise of 30 K?",
        hi: "किसी अभिक्रिया का वेग स्थिरांक ताप में हर 10 K की वृद्धि पर दुगुना हो जाता है। 30 K की वृद्धि पर वह कितने गुणक से बदलता है?",
        mr: "एका अभिक्रियेचा वेग स्थिरांक तापमानातील प्रत्येक 10 K वाढीवर दुप्पट होतो. 30 K च्या वाढीवर तो किती पटीने बदलतो?",
      },
      answer: 8,
      wrong: [6, 3, 4],
      checkExpr: "2*2*2",
      solution: {
        en: "Three ten-degree steps multiply rather than add: 2 × 2 × 2 = 8. That a modest warming can make a reaction eight times faster while the molecules speed up by only a few per cent is the point of the Arrhenius exponential — it is not the average speed that matters but the tail of the distribution above the activation energy. (6 adds the doublings instead of multiplying them.)",
        hi: "दस-अंश के तीन क़दम जुड़ते नहीं, गुणा होते हैं: 2 × 2 × 2 = 8. मामूली गर्माहट अभिक्रिया को आठ गुना तेज़ कर सकती है जबकि अणु केवल कुछ प्रतिशत तेज़ होते हैं — यही आरेनियस चरघातांक का मर्म है: मायने औसत चाल नहीं बल्कि सक्रियण ऊर्जा से ऊपर वितरण की पूँछ रखती है। (6 दुगुने होने को गुणा करने के बजाय जोड़ देता है।)",
        mr: "दहा-अंशांची तीन पावले जुळत नाहीत, गुणली जातात: 2 × 2 × 2 = 8. माफक ऊब अभिक्रिया आठपट वेगवान करू शकते तर रेणू केवळ काही टक्के वेगवान होतात — हाच अरेनियस घातांकाचा गाभा: महत्त्वाची सरासरी गती नसून सक्रियण ऊर्जेवरची वितरणाची शेपूट. (6 दुप्पट होणे गुणण्याऐवजी जोडते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A first-order reaction has a half-life of 5 minutes. What percentage of the reactant remains after 15 minutes?",
        hi: "किसी प्रथम कोटि अभिक्रिया की अर्धायु 5 मिनट है। 15 मिनट बाद अभिकारक का कितना प्रतिशत बचता है?",
        mr: "एका प्रथम कोटी अभिक्रियेचे अर्धायुष्य 5 मिनिटे आहे. 15 मिनिटांनंतर अभिक्रियकाचा किती टक्के उरतो?",
      },
      answer: 12.5,
      wrong: [25, 50, 6.25],
      checkExpr: "100/8",
      solution: {
        en: "Fifteen minutes is three half-lives, so the survivor is 100/2³ = 100/8 = 12.5 per cent. Follow it step by step: 100 → 50 → 25 → 12.5. The reactant never reaches zero exactly, because each interval removes a fraction rather than an amount, which is why a first-order reaction is quoted as complete after some agreed number of half-lives rather than at a definite time. (25 stops one half-life short.)",
        hi: "पंद्रह मिनट तीन अर्धायुएँ हैं, अतः बचा 100/2³ = 100/8 = 12.5 प्रतिशत है। क़दम-दर-क़दम पीछा करो: 100 → 50 → 25 → 12.5. अभिकारक ठीक शून्य तक कभी नहीं पहुँचता, क्योंकि हर अंतराल मात्रा के बजाय एक अंश हटाता है, इसीलिए प्रथम कोटि अभिक्रिया को किसी निश्चित समय पर नहीं बल्कि सहमत अर्धायुओं की संख्या के बाद पूरी बताया जाता है। (25 एक अर्धायु पहले रुक जाता है।)",
        mr: "पंधरा मिनिटे म्हणजे तीन अर्धायुष्ये, म्हणून उरलेला 100/2³ = 100/8 = 12.5 टक्के आहे. पावलापावलाने मागोवा घ्या: 100 → 50 → 25 → 12.5. अभिक्रियक नेमक्या शून्यापर्यंत कधीच पोहोचत नाही, कारण प्रत्येक अंतराल प्रमाणाऐवजी एक अंश काढते, म्हणूनच प्रथम कोटी अभिक्रिया कोणत्याही ठराविक वेळेवर नव्हे तर संमत अर्धायुष्यांच्या संख्येनंतर पूर्ण सांगितली जाते. (25 एक अर्धायुष्य आधी थांबते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "A reaction has a forward activation energy of 50 kJ/mol and an enthalpy change of −30 kJ/mol. What is the activation energy of the reverse reaction, in kJ/mol?",
        hi: "किसी अभिक्रिया की अग्र सक्रियण ऊर्जा 50 kJ/mol और एन्थैल्पी परिवर्तन −30 kJ/mol है। प्रतीप अभिक्रिया की सक्रियण ऊर्जा, kJ/mol में, क्या है?",
        mr: "एका अभिक्रियेची अग्र सक्रियण ऊर्जा 50 kJ/mol आणि एन्थॅल्पी बदल −30 kJ/mol आहे. प्रतीप अभिक्रियेची सक्रियण ऊर्जा, kJ/mol मध्ये, किती?",
      },
      answer: 80,
      wrong: [20, 30, 50],
      checkExpr: "50+30",
      solution: {
        en: "The products lie 30 kJ/mol below the reactants, and the summit is 50 above the reactants, so the climb from the products is 50 + 30 = 80 kJ/mol. Drawing the profile makes it obvious and is worth the ten seconds: the reverse barrier of an exothermic reaction is always the larger, which is why exothermic reactions are usually the ones that go. (20 subtracts instead of adding.)",
        hi: "उत्पाद अभिकारकों से 30 kJ/mol नीचे पड़े हैं, और चोटी अभिकारकों से 50 ऊपर, अतः उत्पादों से चढ़ाई 50 + 30 = 80 kJ/mol है। रूपरेखा खींचना इसे स्पष्ट कर देता है और वे दस सेकंड लगाने योग्य हैं: ऊष्माक्षेपी अभिक्रिया का प्रतीप अवरोध सदा बड़ा होता है, इसीलिए प्रायः ऊष्माक्षेपी अभिक्रियाएँ ही चलती हैं। (20 जोड़ने के बजाय घटा देता है।)",
        mr: "उत्पादने अभिक्रियकांहून 30 kJ/mol खाली पडली आहेत, आणि शिखर अभिक्रियकांहून 50 वर, म्हणून उत्पादनांपासून चढाई 50 + 30 = 80 kJ/mol आहे. आराखडा काढणे हे स्पष्ट करते आणि ती दहा सेकंदे घालवण्याजोगी आहेत: उष्माक्षेपी अभिक्रियेचा प्रतीप अडसर नेहमी मोठा असतो, म्हणूनच बहुधा उष्माक्षेपी अभिक्रियाच चालतात. (20 जोडण्याऐवजी वजा करते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "A zero-order reaction has k = 0.02 mol L⁻¹ s⁻¹ and an initial concentration of 1 mol/L. After how many seconds is the reactant completely used up?",
        hi: "किसी शून्य कोटि अभिक्रिया का k = 0.02 mol L⁻¹ s⁻¹ है और आरंभिक सांद्रता 1 mol/L. कितने सेकंड बाद अभिकारक पूरी तरह खप जाता है?",
        mr: "एका शून्य कोटी अभिक्रियेचा k = 0.02 mol L⁻¹ s⁻¹ आहे आणि प्रारंभिक संहती 1 mol/L. किती सेकंदांनंतर अभिक्रियक पूर्णपणे खर्च होतो?",
      },
      answer: 50,
      wrong: [0.02, 100, 25],
      checkExpr: "1/0.02",
      solution: {
        en: "A zero-order reaction proceeds at a constant rate regardless of concentration, so the time is simply amount divided by rate: 1/0.02 = 50 s. The contrast with first order is worth dwelling on. A first-order reaction never finishes, because each interval removes a fraction; a zero-order one finishes at a definite moment, because it removes a fixed amount per second right up to the last molecule. Zero order usually means something else is rate-limiting — a saturated enzyme, a catalyst surface with every site occupied — so the reactant's concentration has stopped mattering. (100 doubles the answer.)",
        hi: "शून्य कोटि अभिक्रिया सांद्रता की परवाह किए बिना अचर वेग से चलती है, अतः समय बस मात्रा बटा वेग है: 1/0.02 = 50 s. प्रथम कोटि से विरोधाभास पर ठहरना चाहिए। प्रथम कोटि अभिक्रिया कभी ख़त्म नहीं होती, क्योंकि हर अंतराल एक अंश हटाता है; शून्य कोटि वाली निश्चित क्षण पर ख़त्म होती है, क्योंकि वह अंतिम अणु तक प्रति सेकंड नियत मात्रा हटाती है। शून्य कोटि प्रायः यह कहती है कि वेग कोई और चीज़ सीमित कर रही है — संतृप्त एंज़ाइम, ऐसी उत्प्रेरक सतह जिसका हर स्थल भरा है — अतः अभिकारक की सांद्रता मायने रखना बंद कर चुकी है। (100 उत्तर दुगुना कर देता है।)",
        mr: "शून्य कोटी अभिक्रिया संहतीची पर्वा न करता अचल वेगाने चालते, म्हणून काळ म्हणजे फक्त प्रमाण भागिले वेग: 1/0.02 = 50 s. प्रथम कोटीशी विरोधाभासावर थांबण्याजोगे आहे. प्रथम कोटी अभिक्रिया कधीच संपत नाही, कारण प्रत्येक अंतराल एक अंश काढते; शून्य कोटीची ठराविक क्षणी संपते, कारण ती शेवटच्या रेणूपर्यंत दर सेकंदाला ठराविक प्रमाण काढते. शून्य कोटी बहुधा हे सांगते की वेग दुसरे काहीतरी मर्यादित करत आहे — संपृक्त विकर, अशी उत्प्रेरक पृष्ठभाग जिचे प्रत्येक स्थळ भरलेले आहे — म्हणून अभिक्रियकाची संहती महत्त्वाची असणे थांबले आहे. (100 उत्तर दुप्पट करते.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "A catalyst lowers the forward activation energy of a reaction from 80 to 60 kJ/mol. By how much, in kJ/mol, does it lower the activation energy of the reverse reaction?",
        hi: "एक उत्प्रेरक किसी अभिक्रिया की अग्र सक्रियण ऊर्जा 80 से घटाकर 60 kJ/mol कर देता है। वह प्रतीप अभिक्रिया की सक्रियण ऊर्जा कितनी, kJ/mol में, घटाता है?",
        mr: "एक उत्प्रेरक एका अभिक्रियेची अग्र सक्रियण ऊर्जा 80 वरून घटवून 60 kJ/mol करतो. तो प्रतीप अभिक्रियेची सक्रियण ऊर्जा किती, kJ/mol ने, घटवतो?",
      },
      answer: 20,
      wrong: [0, 40, 60],
      checkExpr: "80-60",
      solution: {
        en: "By exactly the same amount, 80 − 60 = 20 kJ/mol. The reason is geometric rather than chemical: the reactants and the products sit at fixed energies and the catalyst lowers only the summit between them, so the climb from EITHER side shortens by the height the summit dropped. That single fact is why a catalyst cannot shift an equilibrium. Both rate constants rise by the same factor through the Arrhenius expression, and since K = k_forward/k_reverse the common factor cancels — the equilibrium constant, the position of equilibrium and the yield are all untouched. What has changed is only how long the mixture takes to get there, which for the Haber process is the difference between an industry and a curiosity. (0 assumes the catalyst helps only the forward direction, which would let it manufacture free energy.)",
        hi: "ठीक उतनी ही, 80 − 60 = 20 kJ/mol. कारण रासायनिक नहीं, ज्यामितीय है: अभिकारक और उत्पाद नियत ऊर्जाओं पर बैठे हैं और उत्प्रेरक केवल उनके बीच की चोटी नीची करता है, अतः किसी भी ओर से चढ़ाई उतनी ही छोटी हो जाती है जितनी चोटी गिरी। वही एक तथ्य कारण है कि उत्प्रेरक साम्य नहीं खिसका सकता। आरेनियस व्यंजक से दोनों वेग स्थिरांक उसी गुणक से बढ़ते हैं, और चूँकि K = k_अग्र/k_प्रतीप, साझा गुणक कट जाता है — साम्य स्थिरांक, साम्य की स्थिति और उपज सब अछूते हैं। जो बदला है वह केवल यह कि मिश्रण को वहाँ पहुँचने में कितना समय लगता है, और हैबर प्रक्रम के लिए वही उद्योग और कौतुक का अंतर है। (0 मान लेता है कि उत्प्रेरक केवल अग्र दिशा में मदद करता है, जिससे वह मुक्त ऊर्जा बना सकता।)",
        mr: "नेमकी तितकीच, 80 − 60 = 20 kJ/mol. कारण रासायनिक नसून भूमितीय आहे: अभिक्रियक आणि उत्पादने स्थिर ऊर्जांवर बसली आहेत आणि उत्प्रेरक केवळ त्यांच्यामधले शिखर खाली आणतो, म्हणून कोणत्याही बाजूकडून चढाई तितकीच लहान होते जितके शिखर घसरले. तेच एक सत्य कारण आहे की उत्प्रेरक समतोल सरकवू शकत नाही. अरेनियस पदावलीने दोन्ही वेग स्थिरांक त्याच पटीने वाढतात, आणि K = k_अग्र/k_प्रतीप असल्याने समान गुणक कापला जातो — समतोल स्थिरांक, समतोलाची जागा आणि उत्पन्न सर्व अस्पर्श आहेत. जे बदलले ते केवळ हे की मिश्रणाला तिथे पोहोचायला किती वेळ लागतो, आणि हेबर प्रक्रियेसाठी तोच उद्योग आणि कुतूहल यांतील फरक. (0 गृहीत धरते की उत्प्रेरक केवळ अग्र दिशेला मदत करतो, ज्याने तो मुक्त ऊर्जा घडवू शकला असता.)",
      },
    },
  ],
  "chemistry-12-d-and-f-block-elements": [
    {
      level: 1,
      stem: {
        en: "Chromium has the configuration [Ar]3d⁵4s¹. How many unpaired electrons does the atom have?",
        hi: "क्रोमियम का विन्यास [Ar]3d⁵4s¹ है। परमाणु के पास कितने अयुग्मित इलेक्ट्रॉन हैं?",
        mr: "क्रोमियमची मांडणी [Ar]3d⁵4s¹ आहे. अणूकडे किती अयुग्मित इलेक्ट्रॉन आहेत?",
      },
      answer: 6,
      wrong: [5, 4, 1],
      checkExpr: "5+1",
      solution: {
        en: "Five d electrons occupy the five d orbitals singly and the one s electron is alone in its orbital, so 5 + 1 = 6 unpaired electrons. The configuration is itself the point: chromium promotes an s electron to reach a half-filled d shell, which is more stable than the 3d⁴4s² arrangement the filling rules would naively predict. (5 counts only the d electrons.)",
        hi: "पाँच d इलेक्ट्रॉन पाँचों d कक्षकों में अकेले-अकेले बैठते हैं और एक s इलेक्ट्रॉन अपने कक्षक में अकेला है, अतः 5 + 1 = 6 अयुग्मित इलेक्ट्रॉन। विन्यास स्वयं ही मर्म है: क्रोमियम आधी भरी d खोल पाने के लिए एक s इलेक्ट्रॉन को ऊपर चढ़ा देता है, जो उस 3d⁴4s² व्यवस्था से अधिक स्थायी है जिसकी भरने के नियम सीधे-सादे ढंग से भविष्यवाणी करते। (5 केवल d इलेक्ट्रॉन गिनता है।)",
        mr: "पाच d इलेक्ट्रॉन पाचही d कक्षकांत एकेकटे बसतात आणि एक s इलेक्ट्रॉन आपल्या कक्षकात एकटा आहे, म्हणून 5 + 1 = 6 अयुग्मित इलेक्ट्रॉन. मांडणी स्वतःच गाभा आहे: क्रोमियम अर्धे भरलेले d कवच मिळवण्यासाठी एक s इलेक्ट्रॉन वर चढवतो, जे त्या 3d⁴4s² मांडणीहून अधिक स्थिर आहे जिचे भरण्याचे नियम साधेपणाने भाकीत करतील. (5 केवळ d इलेक्ट्रॉन मोजते.)",
      },
    },
    {
      level: 1,
      stem: {
        en: "The spin-only magnetic moment is μ = √(n(n+2)) Bohr magnetons. For n = 5 unpaired electrons, what is the value of n(n+2)?",
        hi: "केवल-चक्रण चुंबकीय आघूर्ण μ = √(n(n+2)) बोर मैग्नेटॉन है। n = 5 अयुग्मित इलेक्ट्रॉनों के लिए n(n+2) का मान क्या है?",
        mr: "केवळ-परिवलन चुंबकीय आघूर्ण μ = √(n(n+2)) बोर मॅग्नेटॉन आहे. n = 5 अयुग्मित इलेक्ट्रॉनांसाठी n(n+2) चे मूल्य किती?",
      },
      answer: 35,
      wrong: [25, 30, 10],
      checkExpr: "5*7",
      solution: {
        en: "n(n+2) = 5 × 7 = 35, so μ = √35 ≈ 5.92 Bohr magnetons. Five unpaired electrons is the maximum for a d-block ion and gives the largest spin-only moment available, which is why Mn²⁺ and Fe³⁺ — both d⁵ — are the most strongly paramagnetic common ions of the first series. (25 squares n instead of taking n(n+2).)",
        hi: "n(n+2) = 5 × 7 = 35, अतः μ = √35 ≈ 5.92 बोर मैग्नेटॉन। पाँच अयुग्मित इलेक्ट्रॉन d-ब्लॉक आयन के लिए अधिकतम हैं और उपलब्ध सबसे बड़ा केवल-चक्रण आघूर्ण देते हैं, इसीलिए Mn²⁺ और Fe³⁺ — दोनों d⁵ — पहली श्रेणी के सबसे प्रबल अनुचुंबकीय आम आयन हैं। (25 n(n+2) लेने के बजाय n का वर्ग कर देता है।)",
        mr: "n(n+2) = 5 × 7 = 35, म्हणून μ = √35 ≈ 5.92 बोर मॅग्नेटॉन. पाच अयुग्मित इलेक्ट्रॉन d-खंड आयनासाठी कमाल आहेत आणि उपलब्ध सर्वांत मोठे केवळ-परिवलन आघूर्ण देतात, म्हणूनच Mn²⁺ आणि Fe³⁺ — दोन्ही d⁵ — पहिल्या श्रेणीचे सर्वांत तीव्र अनुचुंबकीय सामान्य आयन आहेत. (25 n(n+2) घेण्याऐवजी n चा वर्ग करते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "Fe²⁺ has the configuration 3d⁶. In a high-spin octahedral complex, how many unpaired electrons does it have?",
        hi: "Fe²⁺ का विन्यास 3d⁶ है। उच्च-चक्रण अष्टफलकीय संकुल में उसके पास कितने अयुग्मित इलेक्ट्रॉन हैं?",
        mr: "Fe²⁺ ची मांडणी 3d⁶ आहे. उच्च-परिवलन अष्टफलकी संकुलात त्याच्याकडे किती अयुग्मित इलेक्ट्रॉन आहेत?",
      },
      answer: 4,
      wrong: [6, 2, 5],
      checkExpr: "6-2",
      solution: {
        en: "In a high-spin arrangement all five orbitals are singly filled before any pairing begins, so the sixth electron must pair with one of them: five singles minus the one now paired leaves 6 − 2 = 4 unpaired. High spin is what happens when the field splitting is smaller than the energy cost of pairing, so electrons prefer the upper orbitals to a shared one. (6 counts every d electron as unpaired.)",
        hi: "उच्च-चक्रण व्यवस्था में युग्मन शुरू होने से पहले पाँचों कक्षक अकेले-अकेले भर जाते हैं, अतः छठे इलेक्ट्रॉन को उनमें से एक के साथ युग्मित होना ही पड़ता है: पाँच अकेले में से अब युग्मित हुआ एक घटाने पर 6 − 2 = 4 अयुग्मित बचते हैं। उच्च चक्रण तब होता है जब क्षेत्र का विपाटन युग्मन की ऊर्जा-क़ीमत से छोटा हो, अतः इलेक्ट्रॉन साझा कक्षक के बजाय ऊपरी कक्षक चुनते हैं। (6 हर d इलेक्ट्रॉन को अयुग्मित गिन लेता है।)",
        mr: "उच्च-परिवलन मांडणीत युग्मन सुरू होण्याआधी पाचही कक्षक एकेकटे भरतात, म्हणून सहाव्या इलेक्ट्रॉनला त्यांतल्या एकाशी युग्मित व्हावेच लागते: पाच एकट्यांतून आता युग्मित झालेला एक वजा केल्यास 6 − 2 = 4 अयुग्मित उरतात. उच्च परिवलन तेव्हा घडते जेव्हा क्षेत्राचे विभाजन युग्मनाच्या ऊर्जा-किमतीहून लहान असेल, म्हणून इलेक्ट्रॉन सामायिक कक्षकाऐवजी वरचे कक्षक निवडतात. (6 प्रत्येक d इलेक्ट्रॉनला अयुग्मित मोजते.)",
      },
    },
    {
      level: 2,
      stem: {
        en: "For an ion with 3 unpaired electrons, what is the value of n(n+2) in the spin-only formula?",
        hi: "3 अयुग्मित इलेक्ट्रॉनों वाले आयन के लिए केवल-चक्रण सूत्र में n(n+2) का मान क्या है?",
        mr: "3 अयुग्मित इलेक्ट्रॉन असलेल्या आयनासाठी केवळ-परिवलन सूत्रात n(n+2) चे मूल्य किती?",
      },
      answer: 15,
      wrong: [9, 12, 6],
      checkExpr: "3*5",
      solution: {
        en: "n(n+2) = 3 × 5 = 15, giving μ = √15 ≈ 3.87 Bohr magnetons. Working with n(n+2) before taking the root keeps the arithmetic exact and makes the pattern visible: the values run 3, 8, 15, 24, 35 for one to five unpaired electrons, so a measured moment can be matched to a whole number of electrons without ambiguity. (9 squares n.)",
        hi: "n(n+2) = 3 × 5 = 15, जिससे μ = √15 ≈ 3.87 बोर मैग्नेटॉन। मूल लेने से पहले n(n+2) से काम करना अंकगणित को ठीक रखता है और ढर्रा दिखा देता है: एक से पाँच अयुग्मित इलेक्ट्रॉनों के लिए मान 3, 8, 15, 24, 35 चलते हैं, अतः नापा गया आघूर्ण बिना दुविधा इलेक्ट्रॉनों की पूर्णांक संख्या से मिलाया जा सकता है। (9 n का वर्ग कर देता है।)",
        mr: "n(n+2) = 3 × 5 = 15, ज्यातून μ = √15 ≈ 3.87 बोर मॅग्नेटॉन. मूळ घेण्याआधी n(n+2) ने काम करणे अंकगणित नेमके ठेवते आणि आकृतिबंध दाखवते: एक ते पाच अयुग्मित इलेक्ट्रॉनांसाठी मूल्ये 3, 8, 15, 24, 35 चालतात, म्हणून मोजलेले आघूर्ण संदिग्धतेविना इलेक्ट्रॉनांच्या पूर्णांक संख्येशी जुळवता येते. (9 n चा वर्ग करते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "What is the oxidation number of manganese in KMnO₄? Take potassium as +1 and each oxygen as −2.",
        hi: "KMnO₄ में मैंगनीज़ की ऑक्सीकरण संख्या क्या है? पोटैशियम को +1 और हर ऑक्सीजन को −2 लो।",
        mr: "KMnO₄ मध्ये मँगेनीजची उपचयन संख्या किती? पोटॅशियम +1 आणि प्रत्येक ऑक्सिजन −2 घ्या.",
      },
      answer: 7,
      wrong: [6, 4, 2],
      checkExpr: "8-1",
      solution: {
        en: "The four oxygens contribute −8 and potassium +1, and the compound is neutral, so manganese must be 8 − 1 = +7. This is the highest oxidation state manganese reaches, and it is available only with oxygen: MnCl₇ does not exist, because chlorine would be oxidised to chlorine gas rather than hold a metal at +7. (6 gives the state in a dichromate rather than a permanganate.)",
        hi: "चार ऑक्सीजन −8 और पोटैशियम +1 जोड़ते हैं, और यौगिक उदासीन है, अतः मैंगनीज़ को 8 − 1 = +7 होना ही पड़ेगा। यह सबसे ऊँची ऑक्सीकरण अवस्था है जहाँ मैंगनीज़ पहुँचता है, और वह केवल ऑक्सीजन के साथ उपलब्ध है: MnCl₇ है ही नहीं, क्योंकि क्लोरीन धातु को +7 पर रखने के बजाय ख़ुद क्लोरीन गैस में उपचयित हो जाती। (6 परमैंगनेट के बजाय डाइक्रोमेट वाली अवस्था दे देता है।)",
        mr: "चार ऑक्सिजन −8 आणि पोटॅशियम +1 जोडतात, आणि संयुग उदासीन आहे, म्हणून मँगेनीजला 8 − 1 = +7 असावेच लागेल. ही सर्वांत उंच उपचयन अवस्था आहे जिथे मँगेनीज पोहोचतो, आणि ती केवळ ऑक्सिजनसोबत उपलब्ध आहे: MnCl₇ अस्तित्वातच नाही, कारण क्लोरीन धातूला +7 वर ठेवण्याऐवजी स्वतः क्लोरीन वायूत उपचयित होईल. (6 परमँगेनेटऐवजी डायक्रोमेटची अवस्था देते.)",
      },
    },
    {
      level: 3,
      stem: {
        en: "What is the oxidation number of chromium in K₂Cr₂O₇? Take potassium as +1 and each oxygen as −2.",
        hi: "K₂Cr₂O₇ में क्रोमियम की ऑक्सीकरण संख्या क्या है? पोटैशियम को +1 और हर ऑक्सीजन को −2 लो।",
        mr: "K₂Cr₂O₇ मध्ये क्रोमियमची उपचयन संख्या किती? पोटॅशियम +1 आणि प्रत्येक ऑक्सिजन −2 घ्या.",
      },
      answer: 6,
      wrong: [7, 3, 12],
      checkExpr: "(14-2)/2",
      solution: {
        en: "Seven oxygens give −14 and two potassiums give +2, so the two chromiums together must supply +12 and each is (14 − 2)/2 = +6. The division by two is the step most often missed: the formula contains two chromium atoms, and the charge is shared between them. (12 gives the total for both atoms rather than the number per atom.)",
        hi: "सात ऑक्सीजन −14 देते हैं और दो पोटैशियम +2, अतः दोनों क्रोमियम मिलकर +12 देने ही चाहिए और हर एक (14 − 2)/2 = +6 है। दो से भाग देना वही चरण है जो सबसे अधिक छूटता है: सूत्र में दो क्रोमियम परमाणु हैं, और आवेश उनमें बँटा है। (12 प्रति परमाणु संख्या के बजाय दोनों का कुल दे देता है।)",
        mr: "सात ऑक्सिजन −14 देतात आणि दोन पोटॅशियम +2, म्हणून दोन्ही क्रोमियम मिळून +12 द्यावेच लागतील आणि प्रत्येक (14 − 2)/2 = +6 आहे. दोनने भागणे हीच ती पायरी जी सर्वांत जास्त सुटते: सूत्रात दोन क्रोमियम अणू आहेत, आणि प्रभार त्यांच्यात वाटलेला आहे. (12 प्रति अणू संख्येऐवजी दोघांचे एकूण देते.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "Copper has the configuration [Ar]3d¹⁰4s¹. How many 3d electrons has the Cu²⁺ ion?",
        hi: "ताँबे का विन्यास [Ar]3d¹⁰4s¹ है। Cu²⁺ आयन के पास कितने 3d इलेक्ट्रॉन हैं?",
        mr: "तांब्याची मांडणी [Ar]3d¹⁰4s¹ आहे. Cu²⁺ आयनाकडे किती 3d इलेक्ट्रॉन आहेत?",
      },
      answer: 9,
      wrong: [10, 11, 7],
      checkExpr: "10-1",
      solution: {
        en: "The 4s electron goes first and the second electron then comes from the 3d shell, leaving 10 − 1 = 9. The order matters and catches people out: 4s fills before 3d but empties before it too, because once the d orbitals are occupied they drop below the 4s in energy. Nine d electrons means one unpaired, which is why Cu²⁺ salts are paramagnetic and coloured while Cu⁺ salts, with a full d¹⁰ shell, are neither. (10 removes both electrons from the 4s, which holds only one.)",
        hi: "4s इलेक्ट्रॉन पहले जाता है और दूसरा इलेक्ट्रॉन फिर 3d खोल से आता है, जिससे 10 − 1 = 9 बचते हैं। क्रम मायने रखता है और लोगों को चकमा देता है: 4s, 3d से पहले भरता है पर उससे पहले ख़ाली भी होता है, क्योंकि d कक्षक भर जाने पर वे ऊर्जा में 4s से नीचे चले जाते हैं। नौ d इलेक्ट्रॉन का अर्थ एक अयुग्मित है, इसीलिए Cu²⁺ लवण अनुचुंबकीय और रंगीन हैं जबकि पूरी d¹⁰ खोल वाले Cu⁺ लवण दोनों में से कुछ नहीं। (10 दोनों इलेक्ट्रॉन 4s से हटा देता है, जिसमें केवल एक है।)",
        mr: "4s इलेक्ट्रॉन आधी जातो आणि दुसरा इलेक्ट्रॉन मग 3d कवचातून येतो, ज्यामुळे 10 − 1 = 9 उरतात. क्रम महत्त्वाचा आहे आणि लोकांना फसवतो: 4s हे 3d आधी भरते पण त्याआधी रिकामेही होते, कारण d कक्षक भरताच ते ऊर्जेत 4s हून खाली जातात. नऊ d इलेक्ट्रॉन म्हणजे एक अयुग्मित, म्हणूनच Cu²⁺ क्षार अनुचुंबकीय आणि रंगीत आहेत तर पूर्ण d¹⁰ कवच असलेले Cu⁺ क्षार दोन्हींपैकी काहीही नाहीत. (10 दोन्ही इलेक्ट्रॉन 4s मधून काढते, ज्यात केवळ एक आहे.)",
      },
    },
    {
      level: 4,
      stem: {
        en: "The lanthanoids run from cerium, atomic number 58, to lutetium, atomic number 71. How many elements is that?",
        hi: "लैंथेनॉयड सीरियम, परमाणु संख्या 58, से ल्यूटीशियम, परमाणु संख्या 71, तक चलते हैं। यह कितने तत्व हैं?",
        mr: "लॅंथेनॉइड सीरियम, अणुक्रमांक 58, पासून ल्युटेशियम, अणुक्रमांक 71, पर्यंत चालतात. ही किती मूलद्रव्ये आहेत?",
      },
      answer: 14,
      wrong: [15, 13, 71],
      checkExpr: "71-58+1",
      solution: {
        en: "Counting inclusively, 71 − 58 + 1 = 14 elements. The plus one is the fencepost: both ends are members, so subtracting alone counts the gaps rather than the elements. Fourteen is exactly the number of electrons a 4f subshell holds, which is not a coincidence — the series exists precisely to fill it, and it is those fourteen poorly shielding electrons whose accumulated effect is the lanthanoid contraction. (13 forgets to count both endpoints.)",
        hi: "समावेशी गिनती से, 71 − 58 + 1 = 14 तत्व। जोड़ा गया एक बाड़-खंभे वाली बात है: दोनों सिरे सदस्य हैं, अतः केवल घटाने से तत्व नहीं बल्कि अंतराल गिने जाते हैं। चौदह ठीक उतने ही इलेक्ट्रॉन हैं जितने 4f उपखोल रखती है, और यह संयोग नहीं — श्रेणी ठीक उसे भरने के लिए है, और वही चौदह कमज़ोर परिरक्षण करते इलेक्ट्रॉन हैं जिनका जमा प्रभाव लैंथेनॉयड संकुचन है। (13 दोनों सिरे गिनना भूल जाता है।)",
        mr: "समावेशक मोजणीने, 71 − 58 + 1 = 14 मूलद्रव्ये. जोडलेला एक ही कुंपण-खांबाची बाब आहे: दोन्ही टोके सदस्य आहेत, म्हणून केवळ वजा केल्याने मूलद्रव्ये नव्हे तर अंतरे मोजली जातात. चौदा हे नेमके तितकेच इलेक्ट्रॉन आहेत जितके 4f उपकवच धरते, आणि हा योगायोग नाही — श्रेणी नेमकी ते भरण्यासाठी आहे, आणि तेच चौदा कमकुवत आवरण करणारे इलेक्ट्रॉन आहेत ज्यांचा साठलेला परिणाम लॅंथेनॉइड आकुंचन आहे. (13 दोन्ही टोके मोजणे विसरते.)",
      },
    },
    {
      level: 5,
      stem: {
        en: "The first transition series runs from scandium, atomic number 21, to zinc, atomic number 30. How many elements does it contain?",
        hi: "पहली संक्रमण श्रेणी स्कैंडियम, परमाणु संख्या 21, से ज़िंक, परमाणु संख्या 30, तक चलती है। उसमें कितने तत्व हैं?",
        mr: "पहिली संक्रमण श्रेणी स्कँडियम, अणुक्रमांक 21, पासून जस्त, अणुक्रमांक 30, पर्यंत चालते. तिच्यात किती मूलद्रव्ये आहेत?",
      },
      answer: 10,
      wrong: [8, 9, 11],
      checkExpr: "30-21+1",
      solution: {
        en: "30 − 21 + 1 = 10 elements, matching the ten electrons a d subshell can hold. Two of them sit awkwardly with the strict definition of a transition element as one with a partly filled d shell in at least one of its common oxidation states: scandium is d⁰ as Sc³⁺ and zinc is d¹⁰ as Zn²⁺, so on that definition neither qualifies. This is worth noticing rather than glossing over, because it explains why zinc compounds are colourless and diamagnetic while every element between behaves as the chapter describes — the definition and the block boundary do not quite coincide. (8 counts only the strict transition elements without saying so.)",
        hi: "30 − 21 + 1 = 10 तत्व, जो d उपखोल के रख सकने वाले दस इलेक्ट्रॉनों से मेल खाते हैं। उनमें से दो संक्रमण तत्व की कड़ी परिभाषा के साथ असहज बैठते हैं, जो कहती है कि उसकी कम से कम एक आम ऑक्सीकरण अवस्था में d खोल आंशिक भरी हो: स्कैंडियम Sc³⁺ के रूप में d⁰ है और ज़िंक Zn²⁺ के रूप में d¹⁰, अतः उस परिभाषा पर कोई भी योग्य नहीं। इसे टाल देने के बजाय ध्यान देना चाहिए, क्योंकि यह समझाता है कि ज़िंक के यौगिक रंगहीन और प्रतिचुंबकीय क्यों हैं जबकि बीच का हर तत्व वैसा बरतता है जैसा अध्याय बताता है — परिभाषा और ब्लॉक की सीमा ठीक-ठीक मेल नहीं खातीं। (8 कड़ी परिभाषा वाले संक्रमण तत्व ही गिनता है, यह कहे बिना।)",
        mr: "30 − 21 + 1 = 10 मूलद्रव्ये, जी d उपकवच धरू शकणाऱ्या दहा इलेक्ट्रॉनांशी जुळतात. त्यांतली दोन संक्रमण मूलद्रव्याच्या कडक व्याख्येशी अवघडून बसतात, जी सांगते की त्याच्या किमान एका सामान्य उपचयन अवस्थेत d कवच अंशतः भरलेले असावे: स्कँडियम Sc³⁺ म्हणून d⁰ आहे आणि जस्त Zn²⁺ म्हणून d¹⁰, म्हणून त्या व्याख्येवर कोणीही पात्र नाही. हे टाळण्याऐवजी लक्षात घ्यायला हवे, कारण हे समजावते की जस्ताची संयुगे रंगहीन आणि प्रतिचुंबकीय का आहेत तर मधले प्रत्येक मूलद्रव्य प्रकरण सांगते तसे वागते — व्याख्या आणि खंडाची सीमा नेमक्या जुळत नाहीत. (8 कडक व्याख्येची संक्रमण मूलद्रव्येच मोजते, तसे न सांगता.)",
      },
    },
    {
      level: 6,
      stem: {
        en: "Zirconium has an atomic radius of 160 pm and hafnium, a whole period lower, has 159 pm. What is the difference, in pm?",
        hi: "ज़र्कोनियम की परमाणु त्रिज्या 160 pm है और पूरी एक आवर्त नीचे के हैफ़्नियम की 159 pm. अंतर, pm में, क्या है?",
        mr: "झिर्कोनियमची अणुत्रिज्या 160 pm आहे आणि अख्खी एक आवर्त खालच्या हाफ्नियमची 159 pm. फरक, pm मध्ये, किती?",
      },
      answer: 1,
      wrong: [319, 0, 2],
      checkExpr: "160-159",
      solution: {
        en: "160 − 159 = 1 pm. The arithmetic is trivial; what it records is not. Going down a group normally adds a whole shell and increases the radius substantially — titanium to zirconium gains about 15 pm. Zirconium to hafnium gains nothing, and the reason is that fourteen lanthanoids lie between them. Across that inner series the 4f electrons shield the added protons badly, so each step contracts the atom slightly, and fourteen such steps almost exactly cancel the expansion a new shell would have given. The consequence is chemical, not merely dimensional: size and charge govern behaviour, these two share both, and so they form the same compounds, occur in the same ores and resisted separation until 1923. It matters practically because zirconium is nearly transparent to neutrons and hafnium absorbs them, so reactor cladding needs one and control rods the other — two elements a chemist can barely distinguish are opposites to a neutron. (319 adds the radii; 0 rounds the difference away and loses the point that they are not quite identical.)",
        hi: "160 − 159 = 1 pm. अंकगणित मामूली है; वह जो दर्ज करता है वह नहीं। किसी वर्ग में नीचे जाने पर प्रायः पूरी खोल जुड़ती है और त्रिज्या काफ़ी बढ़ती है — टाइटेनियम से ज़र्कोनियम लगभग 15 pm पाता है। ज़र्कोनियम से हैफ़्नियम कुछ नहीं पाता, और कारण यह कि उनके बीच चौदह लैंथेनॉयड पड़े हैं। उस भीतरी श्रेणी के आर-पार 4f इलेक्ट्रॉन जोड़े गए प्रोटॉनों को बुरी तरह ढकते हैं, अतः हर क़दम परमाणु को थोड़ा सिकोड़ता है, और चौदह ऐसे क़दम उस प्रसार को लगभग ठीक-ठीक काट देते हैं जो नई खोल देती। परिणाम रासायनिक है, केवल विमीय नहीं: आकार और आवेश आचरण चलाते हैं, ये दोनों दोनों बाँटते हैं, अतः वे वही यौगिक बनाते हैं, वही अयस्कों में मिलते हैं और 1923 तक पृथक्करण का प्रतिरोध करते रहे। व्यावहारिक रूप से यह मायने रखता है क्योंकि ज़र्कोनियम न्यूट्रॉनों के लिए लगभग पारदर्शी है और हैफ़्नियम उन्हें सोखता है, अतः रिएक्टर के आवरण को एक चाहिए और नियंत्रण छड़ों को दूसरा — दो तत्व जिन्हें रसायनज्ञ मुश्किल से अलग बता सकता है, न्यूट्रॉन के लिए उलटे हैं। (319 त्रिज्याएँ जोड़ देता है; 0 अंतर को गोल करके उड़ा देता है और यह बात खो देता है कि वे बिलकुल समरूप नहीं हैं।)",
        mr: "160 − 159 = 1 pm. अंकगणित किरकोळ आहे; ते जे नोंदवते ते नाही. एखाद्या गटात खाली जाताना सहसा अख्खे कवच जोडले जाते आणि त्रिज्या बरीच वाढते — टायटॅनियमपासून झिर्कोनियम सुमारे 15 pm मिळवते. झिर्कोनियमपासून हाफ्नियम काहीच मिळवत नाही, आणि कारण हे की त्यांच्यामध्ये चौदा लॅंथेनॉइड पडले आहेत. त्या आतल्या श्रेणीच्या आरपार 4f इलेक्ट्रॉन जोडलेल्या प्रोटॉनांना वाईट रीतीने झाकतात, म्हणून प्रत्येक पाऊल अणूला थोडे आकुंचित करते, आणि चौदा अशी पावले त्या प्रसरणाला जवळपास नेमके कापतात जे नवे कवच देईल. परिणाम रासायनिक आहे, केवळ मितीय नाही: आकार आणि प्रभार वर्तन चालवतात, हे दोघे दोन्ही वाटून घेतात, म्हणून ते तीच संयुगे बनवतात, त्याच खनिजांत आढळतात आणि 1923 पर्यंत वेगळेपणाला विरोध करत राहिले. व्यावहारिकदृष्ट्या हे महत्त्वाचे कारण झिर्कोनियम न्यूट्रॉनांसाठी जवळपास पारदर्शक आहे आणि हाफ्नियम त्यांना शोषते, म्हणून अणुभट्टीच्या आवरणाला एक लागते आणि नियंत्रण कांड्यांना दुसरे — दोन मूलद्रव्ये जी रसायनशास्त्रज्ञ जेमतेम वेगळी सांगू शकतो, न्यूट्रॉनसाठी उलट आहेत. (319 त्रिज्या जोडते; 0 फरक गोल करून उडवते आणि ते अगदी सारखे नाहीत हा मुद्दा गमावते.)",
      },
    },
  ],
};
