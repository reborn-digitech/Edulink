/**
 * Class 9 History — NCERT "India and the Contemporary World – I", chapter by
 * chapter, through the conceptual engine. The three revolutions that made the
 * modern political world: a monarchy toppled in the name of liberty, an empire
 * of tsars turned into a workers' state, and a wounded democracy that voted
 * itself a dictator. Every fact keeps its evidence habit — who benefited, who
 * paid, and what the slogans left out.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE =
  "EduLink original, written against NCERT India and the Contemporary World – I (Class 9)";
const LICENCE = "CC-BY-SA-4.0";

export const G9_HISTORY: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — The French Revolution (liberty, and its unfinished promise) */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-9-french-revolution",
    subject: "HISTORY",
    classLevel: 9,
    chapter: {
      en: "Chapter 1 — The French Revolution",
      hi: "अध्याय 1 — फ़्रांसीसी क्रांति",
      mr: "प्रकरण 1 — फ्रेंच राज्यक्रांती",
    },
    name: {
      en: "The French Revolution",
      hi: "फ़्रांसीसी क्रांति",
      mr: "फ्रेंच राज्यक्रांती",
    },
    summary: {
      en: "How a kingdom of privilege cracked: a society sorted into three estates where only the poorest paid, an empty treasury and costly bread, thinkers who dared imagine rule by consent — and the Bastille, the Declaration of Rights, and a promise of equality still unfinished.",
      hi: "विशेषाधिकार का राज्य कैसे चटका: तीन इस्टेटों में बँटा समाज जहाँ केवल सबसे ग़रीब कर देता, ख़ाली ख़ज़ाना और महँगी रोटी, वे विचारक जिन्होंने सहमति से शासन की कल्पना की — और बास्तील, अधिकारों की घोषणा, और समानता का अब भी अधूरा वादा।",
      mr: "विशेषाधिकारांचे राज्य कसे तडकले: तीन इस्टेटांत विभागलेला समाज जिथे फक्त सर्वांत गरीब कर देत, रिकामा खजिना आणि महाग भाकर, संमतीने राज्य कल्पणारे विचारवंत — आणि बास्तील, हक्कांची घोषणा, आणि समतेचे अजून अपुरे वचन.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "three-estates",
        name: {
          en: "The society of estates",
          hi: "इस्टेटों का समाज",
          mr: "इस्टेटांचा समाज",
        },
        kind: "structure",
        prompt: {
          en: "In old France a person's rights were fixed at birth into one of three ranks, and the burden of tax fell only on the lowest. How was this society divided?",
          hi: "पुराने फ़्रांस में किसी के अधिकार जन्म से तीन दर्जों में से एक में तय होते, और कर का बोझ केवल सबसे निचले पर पड़ता। यह समाज कैसे बँटा था?",
          mr: "जुन्या फ्रान्समध्ये एखाद्याचे हक्क जन्मापासून तीन दर्जांपैकी एकात ठरत, आणि कराचे ओझे फक्त सर्वांत खालच्यावर पडे. हा समाज कसा विभागलेला होता?",
        },
        statement: {
          en: "French society was split into three estates — clergy, nobility and everyone else — with the first two enjoying privileges by birth and paying no tax, so the whole burden fell on the Third Estate.",
          hi: "फ़्रांसीसी समाज तीन इस्टेटों में बँटा — पादरी, कुलीन और बाक़ी सब — पहली दो जन्म से विशेषाधिकार भोगतीं और कोई कर न देतीं, अतः पूरा बोझ तीसरी इस्टेट पर पड़ता।",
          mr: "फ्रेंच समाज तीन इस्टेटांत विभागला — धर्मगुरू, सरदार आणि बाकी सारे — पहिल्या दोन जन्मापासून विशेषाधिकार भोगत आणि कर देत नसत, म्हणून सारे ओझे तिसऱ्या इस्टेटवर पडे.",
        },
        detail: {
          en: "The Third Estate was itself unequal — rich merchants and lawyers at its top, poor peasants and servants at its base — but all of it paid the taxes the privileged escaped.",
          hi: "तीसरी इस्टेट स्वयं असमान थी — शीर्ष पर धनी व्यापारी-वकील, तल पर ग़रीब किसान-नौकर — पर उसका सब कर देता जिससे विशेषाधिकारी बचते।",
          mr: "तिसरी इस्टेट स्वतःच असमान होती — वर श्रीमंत व्यापारी-वकील, तळाशी गरीब शेतकरी-नोकर — पण तिचे सारे कर देत ज्यातून विशेषाधिकारी सुटत.",
        },
        extra: {
          en: "The heaviest of these was the taille, a direct tax on the Third Estate alone, on top of dues owed to the Church and the lord.",
          hi: "इनमें सबसे भारी थी ताय, केवल तीसरी इस्टेट पर सीधा कर, चर्च और सामंत को देय के ऊपर।",
          mr: "यांतले सर्वांत जड होते ताय, फक्त तिसऱ्या इस्टेटवर थेट कर, चर्च आणि जमीनदाराला देय रकमेवर.",
        },
        pair: {
          left: {
            en: "Only the lowest rank pays the tax",
            hi: "केवल निचला दर्जा कर देता",
            mr: "फक्त खालचा दर्जा कर देतो",
          },
          right: {
            en: "the society of estates",
            hi: "इस्टेटों का समाज",
            mr: "इस्टेटांचा समाज",
          },
        },
      },
      {
        id: "subsistence-crisis",
        name: {
          en: "The subsistence crisis",
          hi: "जीविका संकट",
          mr: "उदरनिर्वाह संकट",
        },
        kind: "cause",
        prompt: {
          en: "A growing population, poor harvests and a soaring price of bread meant the common family spent almost all its wage on food. What is this squeeze on the basic means of living called?",
          hi: "बढ़ती आबादी, ख़राब फ़सलें और रोटी की चढ़ती क़ीमत का अर्थ था आम परिवार अपनी लगभग पूरी मज़दूरी भोजन पर खर्चता। जीने के बुनियादी साधनों पर इस दबाव को क्या कहते?",
          mr: "वाढती लोकसंख्या, खराब पिके आणि भाकरीची चढती किंमत म्हणजे सामान्य कुटुंब आपली जवळपास सारी मजुरी अन्नावर खर्ची. जगण्याच्या मूलभूत साधनांवरील या दाबाला काय म्हणतात?",
        },
        statement: {
          en: "A subsistence crisis is a threat to the people's very means of living — when population outruns grain, harvests fail and bread prices soar, the poor can no longer feed themselves.",
          hi: "जीविका संकट लोगों के जीने के साधनों पर ही ख़तरा है — जब आबादी अनाज से आगे निकले, फ़सलें बिगड़ें और रोटी क़ीमत चढ़े, ग़रीब अपना पेट नहीं भर पाते।",
          mr: "उदरनिर्वाह संकट लोकांच्या जगण्याच्या साधनांवरच धोका आहे — जेव्हा लोकसंख्या धान्याहून पुढे जाते, पिके बुडतात आणि भाकरीची किंमत चढते, गरीब स्वतःचे पोट भरू शकत नाहीत.",
        },
        detail: {
          en: "It was made worse by an empty royal treasury, drained by wars and a lavish court, which the king tried to refill by taxing the Third Estate still harder.",
          hi: "इसे और बिगाड़ा ख़ाली शाही ख़ज़ाने ने, युद्धों और शानो-शौक़त वाले दरबार से रीता, जिसे राजा तीसरी इस्टेट पर और कठोर कर लगाकर भरना चाहता।",
          mr: "याला अधिक बिघडवले रिकाम्या राजखजिन्याने, युद्धे आणि थाटामाटाच्या दरबाराने रिता, जो राजा तिसऱ्या इस्टेटवर अधिक कठोर कर लावून भरू पाहत.",
        },
        extra: {
          en: "Hunger turned political: bread riots and the fear of famine put ordinary people, especially women, into the streets of Paris.",
          hi: "भूख राजनीतिक हो गई: रोटी-दंगों और अकाल के डर ने आम लोगों को, ख़ासकर स्त्रियों को, पेरिस की सड़कों पर उतारा।",
          mr: "भूक राजकीय झाली: भाकर-दंगे आणि दुष्काळाच्या भीतीने सामान्य लोकांना, विशेषतः स्त्रियांना, पॅरिसच्या रस्त्यांवर आणले.",
        },
        pair: {
          left: {
            en: "Wages swallowed whole by the price of bread",
            hi: "मज़दूरी पूरी रोटी की क़ीमत में निगली",
            mr: "मजुरी पूर्ण भाकरीच्या किमतीत गिळली",
          },
          right: {
            en: "the subsistence crisis",
            hi: "जीविका संकट",
            mr: "उदरनिर्वाह संकट",
          },
        },
      },
      {
        id: "philosophers",
        name: {
          en: "The Enlightenment thinkers",
          hi: "प्रबोधन के विचारक",
          mr: "प्रबोधनाचे विचारवंत",
        },
        kind: "idea",
        prompt: {
          en: "Writers like Rousseau and Montesquieu argued that power should rest on the consent of the governed and be split so none could tyrannise. Which movement of ideas prepared minds for revolution?",
          hi: "रूसो और मॉन्टेस्क्यू जैसे लेखकों ने तर्क दिया कि शक्ति शासितों की सहमति पर टिके और बँटी हो ताकि कोई अत्याचार न कर सके। विचारों के किस आंदोलन ने क्रांति के लिए मन तैयार किए?",
          mr: "रुसो आणि मॉन्टेस्क्यू सारख्या लेखकांनी युक्तिवाद केला की शक्ती शासितांच्या संमतीवर टिकावी आणि विभागलेली असावी जेणेकरून कोणी जुलूम करू शकणार नाही. विचारांच्या कोणत्या चळवळीने क्रांतीसाठी मने तयार केली?",
        },
        statement: {
          en: "Enlightenment thinkers argued that government must rest on the consent of the people, not the divine right of a king, and that power should be separated to prevent tyranny.",
          hi: "प्रबोधन के विचारकों ने तर्क दिया कि सरकार जनता की सहमति पर टिके, राजा के दैवी अधिकार पर नहीं, और अत्याचार रोकने को शक्ति अलग-अलग बँटे।",
          mr: "प्रबोधनाच्या विचारवंतांनी युक्तिवाद केला की सरकार जनतेच्या संमतीवर टिकावे, राजाच्या दैवी अधिकारावर नाही, आणि जुलूम रोखायला शक्ती वेगवेगळी विभागावी.",
        },
        detail: {
          en: "Rousseau's Social Contract imagined rulers and ruled bound by a common agreement; Montesquieu urged splitting power between a law-making, an executing and a judging branch.",
          hi: "रूसो के सामाजिक अनुबंध ने शासक-शासित को साझा समझौते से बँधा कल्पा; मॉन्टेस्क्यू ने शक्ति को क़ानून-बनाने, लागू-करने और न्याय-करने वाली शाखाओं में बाँटने का आग्रह किया।",
          mr: "रुसोच्या सामाजिक करारात शासक-शासित समान करारात बांधलेले कल्पिले; मॉन्टेस्क्यूने शक्ती कायदा-बनवणाऱ्या, अंमलात-आणणाऱ्या आणि न्याय-करणाऱ्या शाखांत विभागण्याचा आग्रह केला.",
        },
        extra: {
          en: "Their books were read aloud in salons and coffee houses, so ideas spread even among those who could not read.",
          hi: "उनकी किताबें सैलूनों और कॉफ़ी-घरों में ज़ोर से पढ़ी जातीं, अतः विचार उन तक भी फैले जो पढ़ नहीं सकते थे।",
          mr: "त्यांची पुस्तके सलून आणि कॉफी-घरांत मोठ्याने वाचली जात, म्हणून विचार त्यांच्यापर्यंतही पसरले जे वाचू शकत नव्हते.",
        },
        pair: {
          left: {
            en: "Rule by consent, power split to check tyranny",
            hi: "सहमति से शासन, अत्याचार रोकने को बँटी शक्ति",
            mr: "संमतीने राज्य, जुलूम रोखायला विभागलेली शक्ती",
          },
          right: {
            en: "the Enlightenment thinkers",
            hi: "प्रबोधन के विचारक",
            mr: "प्रबोधनाचे विचारवंत",
          },
        },
      },
      {
        id: "storming-bastille",
        name: {
          en: "The storming of the Bastille",
          hi: "बास्तील का पतन",
          mr: "बास्तीलचा पाडाव",
        },
        kind: "event",
        prompt: {
          en: "On 14 July 1789 an angry Paris crowd seized and tore down a royal prison-fortress, a hated symbol of the king's arbitrary power. Which event opened the revolution?",
          hi: "14 जुलाई 1789 को क्रुद्ध पेरिस भीड़ ने एक शाही जेल-क़िला, राजा की मनमानी शक्ति का घृणित प्रतीक, क़ब्ज़ाया और गिरा दिया। किस घटना ने क्रांति खोली?",
          mr: "14 जुलै 1789 रोजी संतप्त पॅरिस जमावाने एक राजकीय तुरुंग-किल्ला, राजाच्या मनमानी शक्तीचे तिरस्करणीय प्रतीक, ताब्यात घेऊन पाडला. कोणत्या घटनेने क्रांती उघडली?",
        },
        statement: {
          en: "The storming of the Bastille on 14 July 1789 saw a Paris crowd seize and demolish the royal fortress-prison, a symbol of the king's despotic power, igniting the revolution.",
          hi: "14 जुलाई 1789 को बास्तील के पतन में पेरिस भीड़ ने शाही क़िला-जेल, राजा की निरंकुश शक्ति का प्रतीक, क़ब्ज़ाया और ढहाया, क्रांति भड़का दी।",
          mr: "14 जुलै 1789 रोजी बास्तीलच्या पाडावात पॅरिस जमावाने राजकीय किल्ला-तुरुंग, राजाच्या निरंकुश शक्तीचे प्रतीक, ताब्यात घेऊन जमीनदोस्त केला, क्रांती पेटवली.",
        },
        detail: {
          en: "The crowd came seeking gunpowder to defend itself, freed the fortress's handful of prisoners, and left the walls to be pulled down stone by stone.",
          hi: "भीड़ अपनी रक्षा को बारूद खोजती आई, क़िले के मुट्ठी-भर क़ैदियों को छोड़ा, और दीवारें पत्थर-दर-पत्थर गिराने को छोड़ गई।",
          mr: "जमाव स्वतःच्या रक्षणाला दारू शोधत आला, किल्ल्यातील मूठभर कैद्यांना सोडवले, आणि भिंती दगड-दर-दगड पाडायला सोडून गेला.",
        },
        extra: {
          en: "The day is still France's national holiday, and 'the Bastille' remains a byword for toppling arbitrary power.",
          hi: "वह दिन आज भी फ़्रांस का राष्ट्रीय अवकाश है, और 'बास्तील' मनमानी शक्ति गिराने का मुहावरा बना हुआ।",
          mr: "तो दिवस आजही फ्रान्सची राष्ट्रीय सुट्टी आहे, आणि 'बास्तील' मनमानी शक्ती पाडण्याचा वाक्प्रचार राहिला.",
        },
        pair: {
          left: {
            en: "14 July 1789, a prison-fortress torn down",
            hi: "14 जुलाई 1789, गिराया जेल-क़िला",
            mr: "14 जुलै 1789, पाडलेला तुरुंग-किल्ला",
          },
          right: {
            en: "the storming of the Bastille",
            hi: "बास्तील का पतन",
            mr: "बास्तीलचा पाडाव",
          },
        },
      },
      {
        id: "declaration-rights",
        name: {
          en: "The Declaration of Rights",
          hi: "अधिकारों की घोषणा",
          mr: "हक्कांची घोषणा",
        },
        kind: "idea",
        prompt: {
          en: "In August 1789 the new Assembly proclaimed that men are born free and equal in rights, and that liberty, property and security belong to all by nature. Which document announced this?",
          hi: "अगस्त 1789 में नई सभा ने घोषित किया कि मनुष्य स्वतंत्र और अधिकारों में समान जन्मते हैं, और स्वतंत्रता, संपत्ति और सुरक्षा प्राकृतिक रूप से सबकी हैं। किस दस्तावेज़ ने यह घोषित किया?",
          mr: "ऑगस्ट 1789 मध्ये नव्या सभेने घोषित केले की माणसे स्वतंत्र आणि हक्कांत समान जन्मतात, आणि स्वातंत्र्य, मालमत्ता आणि सुरक्षा नैसर्गिकरीत्या सर्वांची आहेत. कोणत्या दस्तऐवजाने हे घोषित केले?",
        },
        statement: {
          en: "The Declaration of the Rights of Man proclaimed liberty, equality before the law, and the natural rights of property and security as belonging to every citizen, not gifts of a king.",
          hi: "मनुष्य के अधिकारों की घोषणा ने स्वतंत्रता, क़ानून के समक्ष समानता, और संपत्ति-सुरक्षा के प्राकृतिक अधिकार हर नागरिक के बताए, राजा की देन नहीं।",
          mr: "माणसाच्या हक्कांच्या घोषणेने स्वातंत्र्य, कायद्यापुढे समानता, आणि मालमत्ता-सुरक्षेचे नैसर्गिक हक्क प्रत्येक नागरिकाचे सांगितले, राजाची देणगी नाही.",
        },
        detail: {
          en: "It declared these rights natural and inviolable — held simply by being human — a claim that no government could grant them and none could rightfully take them away.",
          hi: "इसने इन अधिकारों को प्राकृतिक और अनुल्लंघनीय बताया — केवल मनुष्य होने से प्राप्त — दावा कि कोई सरकार इन्हें दे नहीं सकती और कोई इन्हें उचित रूप से छीन नहीं सकती।",
          mr: "याने हे हक्क नैसर्गिक आणि अनुल्लंघनीय सांगितले — फक्त माणूस असल्याने मिळालेले — दावा की कोणतेही सरकार ते देऊ शकत नाही आणि कोणी ते न्याय्यपणे हिरावू शकत नाही.",
        },
        extra: {
          en: "Its words echoed far beyond France, quoted by later movements against slavery, empire and unequal rule across the world.",
          hi: "इसके शब्द फ़्रांस से बहुत परे गूँजे, बाद के दासता, साम्राज्य और असमान शासन विरोधी आंदोलनों द्वारा दुनिया भर में उद्धृत।",
          mr: "याचे शब्द फ्रान्सपलीकडे खूप दूर घुमले, नंतरच्या गुलामगिरी, साम्राज्य आणि असमान राज्याविरुद्धच्या चळवळींनी जगभर उद्धृत.",
        },
        pair: {
          left: {
            en: "Born free and equal, rights held by nature",
            hi: "स्वतंत्र-समान जन्मे, प्राकृतिक अधिकार",
            mr: "स्वतंत्र-समान जन्मले, नैसर्गिक हक्क",
          },
          right: {
            en: "the Declaration of Rights",
            hi: "अधिकारों की घोषणा",
            mr: "हक्कांची घोषणा",
          },
        },
      },
      {
        id: "republic-terror",
        name: {
          en: "The Republic and the Terror",
          hi: "गणराज्य और आतंक",
          mr: "प्रजासत्ताक आणि दहशत",
        },
        kind: "event",
        prompt: {
          en: "By 1792 France abolished the monarchy and executed its king; then Robespierre's government ruled by the guillotine, killing even fellow revolutionaries it suspected. What phase does this describe?",
          hi: "1792 तक फ़्रांस ने राजतंत्र समाप्त कर अपने राजा को मृत्युदंड दिया; फिर रोबेस्पियर की सरकार ने गिलोटिन से शासन किया, संदिग्ध साथी क्रांतिकारियों तक को मारते। यह कौन-सा चरण बताता?",
          mr: "1792 पर्यंत फ्रान्सने राजेशाही रद्द करून आपल्या राजाला मृत्युदंड दिला; मग रोबेस्पिएरच्या सरकारने गिलोटिनने राज्य केले, संशयित सहकारी क्रांतिकारकांनाही मारत. हा कोणता टप्पा सांगतो?",
        },
        statement: {
          en: "France became a republic in 1792, abolishing the monarchy and executing the king; then the Reign of Terror under Robespierre used the guillotine against anyone judged an enemy, revolutionaries included.",
          hi: "फ़्रांस 1792 में गणराज्य बना, राजतंत्र समाप्त कर राजा को मृत्युदंड दिया; फिर रोबेस्पियर के आतंक-राज ने गिलोटिन को किसी भी शत्रु-ठहराए के विरुद्ध चलाया, क्रांतिकारी भी।",
          mr: "फ्रान्स 1792 मध्ये प्रजासत्ताक झाला, राजेशाही रद्द करून राजाला मृत्युदंड दिला; मग रोबेस्पिएरच्या दहशत-राजाने गिलोटिन कोणत्याही शत्रू-ठरवलेल्याविरुद्ध चालवले, क्रांतिकारकही.",
        },
        detail: {
          en: "Robespierre held that virtue needed terror to defend it; he set price limits on bread and meat, and jailed or beheaded those he called enemies of the republic.",
          hi: "रोबेस्पियर मानता कि सद्गुण की रक्षा को आतंक चाहिए; उसने रोटी-माँस पर क़ीमत-सीमा लगाई, और जिन्हें गणराज्य का शत्रु कहा उन्हें जेल या गर्दन-कलम किया।",
          mr: "रोबेस्पिएर मानत की सद्गुणाच्या रक्षणाला दहशत हवी; त्याने भाकर-मांसावर किंमत-मर्यादा लावली, आणि ज्यांना प्रजासत्ताकाचे शत्रू म्हटले त्यांना तुरुंग वा शिरच्छेद केला.",
        },
        extra: {
          en: "The Terror ended when Robespierre himself was sent to the guillotine in 1794 — the revolution had begun to devour its own.",
          hi: "आतंक तब समाप्त हुआ जब रोबेस्पियर स्वयं 1794 में गिलोटिन भेजा गया — क्रांति अपनों को ही निगलने लगी थी।",
          mr: "दहशत तेव्हा संपली जेव्हा रोबेस्पिएर स्वतः 1794 मध्ये गिलोटिनला पाठवला गेला — क्रांती स्वतःच्यांनाच गिळू लागली होती.",
        },
        pair: {
          left: {
            en: "Monarchy abolished, then rule by the guillotine",
            hi: "राजतंत्र समाप्त, फिर गिलोटिन का शासन",
            mr: "राजेशाही रद्द, मग गिलोटिनचे राज्य",
          },
          right: {
            en: "the Republic and the Terror",
            hi: "गणराज्य और आतंक",
            mr: "प्रजासत्ताक आणि दहशत",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "In old France the clergy and nobility owned much of the land and held the highest offices, yet paid almost no tax; the Third Estate owned little, held no privilege, and paid nearly everything. Why did this arrangement finally become explosive?",
          hi: "पुराने फ़्रांस में पादरी और कुलीन बहुत भूमि रखते और सर्वोच्च पद भोगते, फिर भी लगभग कोई कर न देते; तीसरी इस्टेट थोड़ा रखती, कोई विशेषाधिकार नहीं, और लगभग सब कुछ देती। यह व्यवस्था अंततः विस्फोटक क्यों बनी?",
          mr: "जुन्या फ्रान्समध्ये धर्मगुरू आणि सरदार पुष्कळ जमीन बाळगत आणि सर्वोच्च पदे भोगत, तरी जवळपास कर देत नसत; तिसरी इस्टेट थोडे बाळगे, कोणताही विशेषाधिकार नाही, आणि जवळपास सारे देई. ही व्यवस्था अखेर स्फोटक का बनली?",
        },
        choices: [
          {
            en: "As bread prices soared and the treasury emptied, the king raised taxes only on the Third Estate — those with the least were made to pay for a crisis the privileged had escaped, and the injustice of privilege by birth grew unbearable",
            hi: "जैसे रोटी क़ीमत चढ़ी और ख़ज़ाना रीता, राजा ने कर केवल तीसरी इस्टेट पर बढ़ाया — जिनके पास सबसे कम, उनसे उस संकट का दाम लिया गया जिससे विशेषाधिकारी बच निकले, और जन्म से विशेषाधिकार का अन्याय असह्य हो गया",
            mr: "जसे भाकरीची किंमत चढली आणि खजिना रिता झाला, राजाने कर फक्त तिसऱ्या इस्टेटवर वाढवला — ज्यांच्याकडे सर्वांत कमी, त्यांच्याकडून त्या संकटाची किंमत घेतली जिच्यातून विशेषाधिकारी सुटले, आणि जन्मापासून विशेषाधिकाराचा अन्याय असह्य झाला",
          },
          {
            en: "The nobility suddenly gave up all their land to the peasants",
            hi: "कुलीनों ने अचानक अपनी सारी भूमि किसानों को दे दी",
            mr: "सरदारांनी अचानक आपली सारी जमीन शेतकऱ्यांना दिली",
          },
          {
            en: "The Third Estate was actually richer and refused to share its wealth",
            hi: "तीसरी इस्टेट वास्तव में अधिक धनी थी और अपनी संपत्ति बाँटने से मना करती",
            mr: "तिसरी इस्टेट खरे तर अधिक श्रीमंत होती आणि आपली संपत्ती वाटायला नकार देई",
          },
          {
            en: "The king abolished all taxes, which angered the clergy",
            hi: "राजा ने सारे कर समाप्त कर दिए, जिससे पादरी क्रुद्ध हुए",
            mr: "राजाने सारे कर रद्द केले, ज्याने धर्मगुरू संतापले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The explosive core of old France was a mismatch between who held wealth and power and who paid for the state. The First Estate (clergy) and Second Estate (nobility) together were a tiny fraction of the population, yet they owned much of the land, filled the highest posts in the Church, army and court, and — by ancient privilege of birth — were exempt from the main taxes. The entire Third Estate, from wealthy merchants down to landless peasants, carried the burden: the taille and other direct taxes, plus dues to the Church and the lord. For a long time this was resented but endured. What lit the fuse was crisis stacked on injustice. A rising population and failing harvests sent bread prices soaring just as wars and court extravagance emptied the royal treasury. The king's answer was not to tax the rich, privileged estates but to squeeze the Third Estate harder still — asking those who had least to rescue a state whose luxuries they never shared. When privilege means the powerful pay nothing and the poor pay for a catastrophe they did not cause, the idea that rank should be fixed at birth collapses. Enlightenment writers had already given people the language to name it as injustice; the subsistence crisis turned that idea into hunger in the streets, and the two together brought down the estates.",
          hi: "पुराने फ़्रांस का विस्फोटक केंद्र था इस बेमेल में कि धन-शक्ति किसके पास और राज्य का दाम कौन चुकाता। पहली इस्टेट (पादरी) और दूसरी इस्टेट (कुलीन) मिलकर आबादी का नन्हा अंश, फिर भी बहुत भूमि रखते, चर्च-सेना-दरबार के सर्वोच्च पद भरते, और — जन्म के प्राचीन विशेषाधिकार से — मुख्य करों से मुक्त। पूरी तीसरी इस्टेट, धनी व्यापारी से भूमिहीन किसान तक, बोझ ढोती: ताय और अन्य सीधे कर, साथ चर्च-सामंत को देय। लंबे समय यह अखरता पर सहा जाता। फ़तीला जलाया संकट पर चढ़े अन्याय ने। बढ़ती आबादी और बिगड़ती फ़सलों ने रोटी क़ीमत चढ़ाई ठीक जब युद्धों-दरबारी फ़िज़ूलख़र्ची ने शाही ख़ज़ाना रीता किया। राजा का उत्तर धनी विशेषाधिकारी इस्टेटों पर कर नहीं बल्कि तीसरी इस्टेट को और निचोड़ना — जिनके पास सबसे कम उनसे उस राज्य को उबारने को कहना जिसकी विलासिता वे कभी न बाँटते। जब विशेषाधिकार का अर्थ शक्तिशाली कुछ न दें और ग़रीब उस विपत्ति का दाम दें जो उन्होंने नहीं रची, तो यह विचार कि दर्जा जन्म से तय हो ढह जाता। प्रबोधन लेखकों ने पहले ही लोगों को इसे अन्याय कहने की भाषा दी थी; जीविका संकट ने उस विचार को सड़कों की भूख बनाया, और दोनों मिलकर इस्टेटों को गिरा गए।",
          mr: "जुन्या फ्रान्सचा स्फोटक गाभा होता या विसंगतीत की धन-शक्ती कोणाकडे आणि राज्याची किंमत कोण मोजतो. पहिली इस्टेट (धर्मगुरू) आणि दुसरी इस्टेट (सरदार) मिळून लोकसंख्येचा इवला अंश, तरी पुष्कळ जमीन बाळगत, चर्च-सैन्य-दरबारातील सर्वोच्च पदे भरत, आणि — जन्माच्या प्राचीन विशेषाधिकाराने — मुख्य करांतून मुक्त. संपूर्ण तिसरी इस्टेट, श्रीमंत व्यापाऱ्यापासून भूमिहीन शेतकऱ्यापर्यंत, ओझे वाहे: ताय आणि इतर थेट कर, सोबत चर्च-जमीनदाराला देय. बराच काळ हे खटके पण सहन केले जाई. वात पेटवली संकटावर चढलेल्या अन्यायाने. वाढती लोकसंख्या आणि बुडती पिके यांनी भाकरीची किंमत चढवली नेमके जेव्हा युद्धे-दरबारी उधळपट्टीने राजखजिना रिता केला. राजाचे उत्तर श्रीमंत विशेषाधिकारी इस्टेटांवर कर नव्हे तर तिसऱ्या इस्टेटला अधिक पिळणे — ज्यांच्याकडे सर्वांत कमी त्यांना त्या राज्याला वाचवायला सांगणे ज्याची चैन ते कधी वाटत नसत. जेव्हा विशेषाधिकाराचा अर्थ शक्तिशाली काही देत नाहीत आणि गरीब त्या आपत्तीची किंमत देतात जी त्यांनी घडवली नाही, तेव्हा दर्जा जन्मापासून ठरावा ही कल्पना कोसळते. प्रबोधन लेखकांनी आधीच लोकांना याला अन्याय म्हणण्याची भाषा दिली होती; उदरनिर्वाह संकटाने त्या कल्पनेला रस्त्यांवरची भूक बनवले, आणि दोन्ही मिळून इस्टेटांना पाडले.",
        },
      },
      {
        level: 6,
        stem: {
          en: "The Declaration of 1789 announced that 'men are born free and equal in rights' — yet revolutionary France kept slavery in its colonies for years, and never gave women the vote. How should we read a promise of universal equality that so plainly excluded people?",
          hi: "1789 की घोषणा ने कहा 'मनुष्य स्वतंत्र और अधिकारों में समान जन्मते हैं' — फिर भी क्रांतिकारी फ़्रांस ने वर्षों अपने उपनिवेशों में दासता रखी, और स्त्रियों को कभी मत नहीं दिया। सार्वभौम समानता के उस वादे को कैसे पढ़ें जिसने इतने स्पष्ट लोगों को बाहर रखा?",
          mr: "1789 च्या घोषणेने सांगितले 'माणसे स्वतंत्र आणि हक्कांत समान जन्मतात' — तरी क्रांतिकारी फ्रान्सने वर्षानुवर्षे आपल्या वसाहतींत गुलामगिरी ठेवली, आणि स्त्रियांना कधी मत दिले नाही. सार्वत्रिक समतेचे ते वचन कसे वाचावे ज्याने इतक्या स्पष्टपणे लोकांना वगळले?",
        },
        choices: [
          {
            en: "The Declaration set a radical principle wider than its authors were willing to apply — and that very gap became a weapon: the excluded (slaves, women, colonised peoples) could turn the revolution's own words against it, demanding the equality it had promised on paper",
            hi: "घोषणा ने एक क्रांतिकारी सिद्धांत रखा जो उसके रचयिताओं की लागू करने की इच्छा से चौड़ा था — और वही अंतर हथियार बना: बहिष्कृत (दास, स्त्रियाँ, उपनिवेशित) क्रांति के अपने ही शब्द उसके विरुद्ध मोड़ सकते, काग़ज़ पर वादा की समानता माँगते",
            mr: "घोषणेने एक क्रांतिकारी तत्त्व मांडले जे तिच्या रचनाकारांच्या अंमलात आणण्याच्या इच्छेहून रुंद होते — आणि तीच दरी शस्त्र बनली: वगळलेले (गुलाम, स्त्रिया, वसाहतित) क्रांतीचेच शब्द तिच्याविरुद्ध वळवू शकत, कागदावर वचन दिलेली समता मागत",
          },
          {
            en: "It proves the Declaration meant nothing and changed nothing in history",
            hi: "यह सिद्ध करता कि घोषणा का कोई अर्थ नहीं और इतिहास में कुछ नहीं बदला",
            mr: "हे सिद्ध करते की घोषणेला काही अर्थ नव्हता आणि इतिहासात काही बदलले नाही",
          },
          {
            en: "Slavery and women's exclusion were actually forbidden by the Declaration from the start",
            hi: "दासता और स्त्रियों का बहिष्कार वास्तव में घोषणा ने शुरू से मना किया था",
            mr: "गुलामगिरी आणि स्त्रियांचे वगळणे खरे तर घोषणेने सुरुवातीपासून मनाई केले होते",
          },
          {
            en: "The word 'men' was a translation error and no exclusion was intended",
            hi: "'मनुष्य' शब्द अनुवाद-त्रुटि थी और कोई बहिष्कार अभिप्रेत नहीं था",
            mr: "'माणसे' हा शब्द भाषांतर-चूक होती आणि कोणतेही वगळणे अभिप्रेत नव्हते",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The honest reading holds two truths at once, without letting either cancel the other. On one side, the Declaration was genuinely hypocritical in practice: the same revolutionaries who proclaimed universal equality kept enslaved people labouring on French plantations in the Caribbean, and drew the circle of 'active citizens' who could vote to exclude women entirely, along with the poorest men. The promise and the practice did not match. But on the other side, the words themselves were more radical than the men who wrote them — and that is precisely what made them powerful. Once it is written down and celebrated that people are 'born free and equal in rights', that principle no longer belongs only to its authors; it becomes a standard the excluded can hold the revolution to. And they did. Enslaved people in the colony of Saint-Domingue rose and, invoking the very rights France had declared, forced the abolition of slavery and eventually won an independent Haiti. Women like Olympe de Gouges wrote a matching Declaration of the Rights of Woman, throwing the revolution's own logic back at it. The gap between promise and practice, rather than proving the ideal empty, became the engine of later struggles — against slavery, for women's suffrage, against colonial rule — each demanding that the words finally be kept. That is why the Declaration matters: not because 1789 France lived up to it, but because it set a promise the world has been trying to honour ever since.",
          hi: "ईमानदार पठन दो सत्य एक साथ थामे, बिना किसी को दूसरे को रद्द करने दिए। एक ओर, घोषणा व्यवहार में सचमुच पाखंडी थी: वही क्रांतिकारी जो सार्वभौम समानता घोषते, कैरिबियन के फ़्रांसीसी बाग़ानों में दासों से श्रम कराते रहे, और मत दे सकने वाले 'सक्रिय नागरिकों' का घेरा खींचकर स्त्रियों को पूरी तरह बाहर रखा, सबसे ग़रीब पुरुषों समेत। वादा और व्यवहार मेल न खाते। पर दूसरी ओर, शब्द स्वयं उन्हें लिखने वालों से अधिक क्रांतिकारी थे — और ठीक इसी ने उन्हें शक्तिशाली बनाया। एक बार लिख-मना लिया जाए कि लोग 'स्वतंत्र और अधिकारों में समान जन्मते हैं', वह सिद्धांत केवल रचयिताओं का नहीं रहता; वह मानक बनता जिस पर बहिष्कृत क्रांति को तौल सकते। और उन्होंने तौला। सैं-दोमैंग उपनिवेश के दास उठ खड़े हुए और, उन्हीं अधिकारों को पुकारते जो फ़्रांस ने घोषे, दासता की समाप्ति करवाई और अंततः स्वतंत्र हैती जीता। ओलम्प द गूज जैसी स्त्रियों ने मिलती-जुलती स्त्री-अधिकार घोषणा लिखी, क्रांति का अपना तर्क उस पर लौटाते। वादे और व्यवहार का अंतर, आदर्श को खोखला सिद्ध करने के बजाय, बाद के संघर्षों का इंजन बना — दासता विरुद्ध, स्त्री-मताधिकार को, औपनिवेशिक शासन विरुद्ध — हर एक माँगता कि शब्द अंततः निभाए जाएँ। इसी से घोषणा महत्वपूर्ण: इसलिए नहीं कि 1789 का फ़्रांस उस पर खरा उतरा, बल्कि इसलिए कि उसने एक वादा रखा जिसे दुनिया तब से निभाने की कोशिश करती आई।",
          mr: "प्रामाणिक वाचन दोन सत्ये एकाच वेळी धरते, कोणालाही दुसऱ्याला रद्द करू न देता. एका बाजूला, घोषणा व्यवहारात खरोखर ढोंगी होती: तेच क्रांतिकारक जे सार्वत्रिक समता घोषत, कॅरिबियनमधल्या फ्रेंच मळ्यांत गुलामांकडून श्रम करवत राहिले, आणि मत देऊ शकणाऱ्या 'सक्रिय नागरिकां'चे वर्तुळ आखून स्त्रियांना पूर्णपणे वगळले, सर्वांत गरीब पुरुषांसह. वचन आणि व्यवहार जुळत नव्हते. पण दुसऱ्या बाजूला, शब्द स्वतः त्यांना लिहिणाऱ्यांहून अधिक क्रांतिकारी होते — आणि नेमके यानेच त्यांना शक्तिशाली बनवले. एकदा लिहून-गौरवले जाते की माणसे 'स्वतंत्र आणि हक्कांत समान जन्मतात', ते तत्त्व फक्त रचनाकारांचे राहत नाही; ते मानक बनते ज्यावर वगळलेले क्रांतीला तोलू शकतात. आणि त्यांनी तोलले. सां-दोमांग वसाहतीतले गुलाम उठले आणि, तेच हक्क पुकारत जे फ्रान्सने घोषले, गुलामगिरी रद्द करवली आणि अखेर स्वतंत्र हैती जिंकले. ओलांप द गूज सारख्या स्त्रियांनी जुळती स्त्री-हक्क घोषणा लिहिली, क्रांतीचेच तर्कशास्त्र तिच्यावर परत फेकत. वचन आणि व्यवहारातील दरी, आदर्श पोकळ सिद्ध करण्याऐवजी, नंतरच्या संघर्षांचे इंजिन बनली — गुलामगिरीविरुद्ध, स्त्री-मताधिकाराला, वसाहती राज्याविरुद्ध — प्रत्येक मागत की शब्द अखेर पाळले जावेत. म्हणूनच घोषणा महत्त्वाची: म्हणून नाही की 1789 चा फ्रान्स तिच्यावर खरा उतरला, तर म्हणून की तिने एक वचन मांडले जे जग तेव्हापासून पाळण्याचा प्रयत्न करत आले.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Socialism in Europe and the Russian Revolution             */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-9-russian-revolution",
    subject: "HISTORY",
    classLevel: 9,
    chapter: {
      en: "Chapter 2 — Socialism in Europe and the Russian Revolution",
      hi: "अध्याय 2 — यूरोप में समाजवाद और रूसी क्रांति",
      mr: "प्रकरण 2 — युरोपातील समाजवाद आणि रशियन राज्यक्रांती",
    },
    name: {
      en: "Socialism in Europe and the Russian Revolution",
      hi: "यूरोप में समाजवाद और रूसी क्रांति",
      mr: "युरोपातील समाजवाद आणि रशियन राज्यक्रांती",
    },
    summary: {
      en: "How an empire of tsars became a workers' state: an idea that property should be owned in common, an autocrat who allowed no parliament to bind him, a world war that broke the army's patience — and two revolutions in one year, one that toppled the Tsar and one that gave power to the Bolsheviks.",
      hi: "ज़ारों का साम्राज्य कैसे मज़दूरों का राज्य बना: यह विचार कि संपत्ति साझा हो, एक निरंकुश जिसे कोई संसद न बाँधती, एक विश्वयुद्ध जिसने सेना का धैर्य तोड़ा — और एक ही वर्ष में दो क्रांतियाँ, एक जिसने ज़ार गिराया और एक जिसने बोल्शेविकों को शक्ति दी।",
      mr: "झारांचे साम्राज्य कसे कामगारांचे राज्य झाले: संपत्ती सामायिक असावी ही कल्पना, एक निरंकुश ज्याला कोणती संसद बांधत नसे, एक महायुद्ध ज्याने सैन्याचा संयम मोडला — आणि एकाच वर्षात दोन क्रांती, एक जिने झार पाडला आणि एक जिने बोल्शेविकांना शक्ती दिली.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "socialism-idea",
        name: {
          en: "The socialist idea",
          hi: "समाजवादी विचार",
          mr: "समाजवादी कल्पना",
        },
        kind: "idea",
        prompt: {
          en: "Some nineteenth-century thinkers argued that factories and land should be owned in common by society, not by private individuals for profit. What was this body of ideas called?",
          hi: "उन्नीसवीं सदी के कुछ विचारकों ने तर्क दिया कि कारख़ाने और भूमि समाज द्वारा साझा रूप से रखी जाएँ, निजी व्यक्तियों द्वारा लाभ को नहीं। इन विचारों को क्या कहा गया?",
          mr: "एकोणिसाव्या शतकातील काही विचारवंतांनी युक्तिवाद केला की कारखाने आणि जमीन समाजाने सामायिकपणे बाळगावी, खाजगी व्यक्तींनी नफ्यासाठी नाही. या विचारांना काय म्हटले गेले?",
        },
        statement: {
          en: "Socialism holds that the means of production — land, factories, capital — should be owned and controlled by society as a whole, not by private owners seeking profit.",
          hi: "समाजवाद मानता कि उत्पादन के साधन — भूमि, कारख़ाने, पूँजी — समाज द्वारा समग्र रूप से रखे और नियंत्रित हों, लाभ खोजते निजी मालिकों द्वारा नहीं।",
          mr: "समाजवाद मानतो की उत्पादनाची साधने — जमीन, कारखाने, भांडवल — समाजाने समग्रपणे बाळगावी आणि नियंत्रित करावी, नफा शोधणाऱ्या खाजगी मालकांनी नाही.",
        },
        detail: {
          en: "Karl Marx argued that industrial society was split between capitalists who owned the factories and workers who owned only their labour, and that workers would one day overthrow this order.",
          hi: "कार्ल मार्क्स ने तर्क दिया कि औद्योगिक समाज कारख़ाने रखने वाले पूँजीपतियों और केवल अपना श्रम रखने वाले मज़दूरों में बँटा, और मज़दूर एक दिन इस व्यवस्था को पलट देंगे।",
          mr: "कार्ल मार्क्सने युक्तिवाद केला की औद्योगिक समाज कारखाने बाळगणाऱ्या भांडवलदारांत आणि फक्त स्वतःचे श्रम बाळगणाऱ्या कामगारांत विभागला, आणि कामगार एक दिवस ही व्यवस्था उलथवतील.",
        },
        extra: {
          en: "Socialists disagreed on how to get there — some hoped for gradual reform through elections, others believed only a revolution could end private ownership.",
          hi: "समाजवादी वहाँ पहुँचने पर असहमत थे — कुछ चुनावों से क्रमिक सुधार की आशा करते, अन्य मानते केवल क्रांति निजी स्वामित्व समाप्त कर सकती।",
          mr: "समाजवादी तिथे पोहोचण्यावर असहमत होते — काही निवडणुकांतून क्रमिक सुधारणेची आशा करत, इतर मानत फक्त क्रांती खाजगी मालकी संपवू शकते.",
        },
        pair: {
          left: {
            en: "Property owned in common, not for private profit",
            hi: "संपत्ति साझा, निजी लाभ को नहीं",
            mr: "संपत्ती सामायिक, खाजगी नफ्यासाठी नाही",
          },
          right: {
            en: "socialism",
            hi: "समाजवाद",
            mr: "समाजवाद",
          },
        },
      },
      {
        id: "tsarist-autocracy",
        name: {
          en: "Tsarist autocracy",
          hi: "ज़ारशाही निरंकुशता",
          mr: "झारशाही निरंकुशता",
        },
        kind: "structure",
        prompt: {
          en: "Before 1917 Russia was ruled by an emperor who answered to no parliament and claimed his power came from God alone. What was this form of one-man rule called?",
          hi: "1917 से पहले रूस पर एक सम्राट शासन करता जो किसी संसद को जवाबदेह नहीं था और दावा करता उसकी शक्ति केवल ईश्वर से आती। इस एक-व्यक्ति शासन को क्या कहा गया?",
          mr: "1917 पूर्वी रशियावर एक सम्राट राज्य करी जो कोणत्याही संसदेला जबाबदार नव्हता आणि दावा करी की त्याची शक्ती फक्त देवाकडून येते. या एक-व्यक्ती राज्याला काय म्हटले?",
        },
        statement: {
          en: "Tsarist autocracy was the absolute rule of the Russian emperor, the Tsar, who was bound by no elected parliament and claimed his authority directly from God.",
          hi: "ज़ारशाही निरंकुशता रूसी सम्राट, ज़ार, का निरपेक्ष शासन थी, जो किसी निर्वाचित संसद से न बँधा और अपना अधिकार सीधे ईश्वर से बताता।",
          mr: "झारशाही निरंकुशता रशियन सम्राट, झार, याचे निरपेक्ष राज्य होते, जो कोणत्याही निवडून आलेल्या संसदेने बांधलेला नव्हता आणि आपला अधिकार थेट देवाकडून सांगे.",
        },
        detail: {
          en: "Most Russians were peasants, and industrial workers in the cities laboured long hours for low pay, with strikes banned and no legal way to demand change.",
          hi: "अधिकांश रूसी किसान थे, और शहरों के औद्योगिक मज़दूर कम वेतन को लंबे घंटे श्रम करते, हड़तालें प्रतिबंधित और परिवर्तन माँगने का कोई क़ानूनी रास्ता नहीं।",
          mr: "बहुतांश रशियन शेतकरी होते, आणि शहरांतले औद्योगिक कामगार कमी वेतनाला लांब तास श्रम करत, संप बंदी आणि बदल मागण्याचा कोणताही कायदेशीर मार्ग नाही.",
        },
        extra: {
          en: "The last Tsar, Nicholas II, granted a parliament (the Duma) only after unrest in 1905, then hobbled it, keeping real power in his own hands.",
          hi: "अंतिम ज़ार, निकोलस द्वितीय, ने संसद (ड्यूमा) केवल 1905 की अशांति के बाद दी, फिर उसे लँगड़ा किया, असली शक्ति अपने हाथ रखते।",
          mr: "शेवटचा झार, निकोलस दुसरा, याने संसद (ड्यूमा) फक्त 1905 च्या अशांततेनंतर दिली, मग तिला पंगू केले, खरी शक्ती स्वतःच्या हाती ठेवत.",
        },
        pair: {
          left: {
            en: "An emperor bound by no parliament",
            hi: "किसी संसद से न बँधा सम्राट",
            mr: "कोणत्याही संसदेने न बांधलेला सम्राट",
          },
          right: {
            en: "Tsarist autocracy",
            hi: "ज़ारशाही निरंकुशता",
            mr: "झारशाही निरंकुशता",
          },
        },
      },
      {
        id: "world-war-strain",
        name: {
          en: "The strain of the World War",
          hi: "विश्वयुद्ध का दबाव",
          mr: "महायुद्धाचा ताण",
        },
        kind: "cause",
        prompt: {
          en: "After 1914 Russia's army suffered huge defeats, millions died, and food and fuel ran short in the cities. What turned soldiers and workers alike against the Tsar?",
          hi: "1914 के बाद रूस की सेना ने भारी हारें झेलीं, लाखों मरे, और शहरों में भोजन-ईंधन की कमी पड़ी। किसने सैनिकों और मज़दूरों दोनों को ज़ार के विरुद्ध किया?",
          mr: "1914 नंतर रशियाच्या सैन्याने प्रचंड पराभव सोसले, लाखो मेले, आणि शहरांत अन्न-इंधनाची टंचाई पडली. कशाने सैनिक आणि कामगार दोघांना झारविरुद्ध केले?",
        },
        statement: {
          en: "The First World War strained Russia to breaking point — crushing military defeats, millions of casualties, and shortages of bread and fuel turned soldiers and city workers against the Tsar's rule.",
          hi: "प्रथम विश्वयुद्ध ने रूस को टूटने की हद तक दबाया — कुचलती सैन्य हारें, लाखों हताहत, और रोटी-ईंधन की कमी ने सैनिकों और शहरी मज़दूरों को ज़ार के शासन के विरुद्ध किया।",
          mr: "पहिल्या महायुद्धाने रशियाला तुटण्याच्या टोकापर्यंत ताणले — चिरडणारे लष्करी पराभव, लाखो बळी, आणि भाकर-इंधनाची टंचाई यांनी सैनिक आणि शहरी कामगारांना झारच्या राज्याविरुद्ध केले.",
        },
        detail: {
          en: "Soldiers, often sent to fight without enough rifles or boots, began to desert and to side with the protesting crowds rather than fire on them.",
          hi: "सैनिक, अक्सर पर्याप्त राइफ़लों या जूतों बिना लड़ने भेजे, भागने लगे और गोली चलाने के बजाय प्रदर्शनकारी भीड़ का पक्ष लेने लगे।",
          mr: "सैनिक, अनेकदा पुरेशा रायफली वा बुटांविना लढायला पाठवलेले, पळू लागले आणि गोळी झाडण्याऐवजी आंदोलक जमावाची बाजू घेऊ लागले.",
        },
        extra: {
          en: "The war also filled the cities with refugees and idled factories for want of supplies, so hunger and anger gathered exactly where the revolution would begin.",
          hi: "युद्ध ने शहरों को शरणार्थियों से भरा और आपूर्ति के अभाव में कारख़ाने ठप किए, अतः भूख-क्रोध ठीक वहाँ जमा जहाँ क्रांति शुरू होती।",
          mr: "युद्धाने शहरे निर्वासितांनी भरली आणि पुरवठ्याअभावी कारखाने ठप्प केले, म्हणून भूक-राग नेमके तिथे जमला जिथे क्रांती सुरू होणार.",
        },
        pair: {
          left: {
            en: "Defeat and shortages turn the army against the crown",
            hi: "हार-कमी सेना को राजगद्दी के विरुद्ध करती",
            mr: "पराभव-टंचाई सैन्याला राजगादीविरुद्ध करते",
          },
          right: {
            en: "the strain of the World War",
            hi: "विश्वयुद्ध का दबाव",
            mr: "महायुद्धाचा ताण",
          },
        },
      },
      {
        id: "february-revolution",
        name: {
          en: "The February Revolution",
          hi: "फ़रवरी क्रांति",
          mr: "फेब्रुवारी क्रांती",
        },
        kind: "event",
        prompt: {
          en: "In early 1917 strikes and bread marches in Petrograd swelled until the army refused to fire on the crowds and the Tsar gave up his throne. Which revolution ended the monarchy?",
          hi: "1917 के आरंभ में पेत्रोग्राद में हड़तालें और रोटी-जुलूस तब तक बढ़े जब तक सेना ने भीड़ पर गोली चलाने से मना किया और ज़ार ने गद्दी छोड़ी। किस क्रांति ने राजतंत्र समाप्त किया?",
          mr: "1917 च्या सुरुवातीला पेट्रोग्राडमध्ये संप आणि भाकर-मोर्चे तोवर वाढले जोवर सैन्याने जमावावर गोळी झाडायला नकार दिला आणि झारने गादी सोडली. कोणत्या क्रांतीने राजेशाही संपवली?",
        },
        statement: {
          en: "The February Revolution of 1917 was a spontaneous rising of strikers and hungry crowds in Petrograd that, once soldiers joined them, forced the Tsar to abdicate and ended the monarchy.",
          hi: "1917 की फ़रवरी क्रांति पेत्रोग्राद में हड़तालियों और भूखी भीड़ का स्वतःस्फूर्त उभार थी जिसने, सैनिकों के जुड़ते ही, ज़ार को गद्दी-त्याग को बाध्य किया और राजतंत्र समाप्त किया।",
          mr: "1917 ची फेब्रुवारी क्रांती पेट्रोग्राडमधील संपकरी आणि भुकेल्या जमावाचा स्वयंस्फूर्त उठाव होती जिने, सैनिक सामील होताच, झारला पदत्याग करायला भाग पाडले आणि राजेशाही संपवली.",
        },
        detail: {
          en: "It had no single party leading it; power passed to a Provisional Government of Duma leaders, meant to run the country until an assembly could be elected.",
          hi: "इसका नेतृत्व करता कोई एक दल नहीं था; शक्ति ड्यूमा नेताओं की अस्थायी सरकार को गई, जो सभा चुने जाने तक देश चलाने को थी।",
          mr: "तिचे नेतृत्व करणारा एकही पक्ष नव्हता; शक्ती ड्यूमा नेत्यांच्या हंगामी सरकारकडे गेली, जी सभा निवडली जाईपर्यंत देश चालवायला होती.",
        },
        extra: {
          en: "Alongside the Provisional Government stood the soviets — councils of workers and soldiers — creating a rivalry of two powers that the year would have to resolve.",
          hi: "अस्थायी सरकार के साथ खड़े थे सोवियत — मज़दूरों-सैनिकों की परिषदें — दो शक्तियों की प्रतिद्वंद्विता रचते जिसे वह वर्ष सुलझाना था।",
          mr: "हंगामी सरकारसोबत उभे होते सोव्हिएत — कामगार-सैनिकांच्या समित्या — दोन शक्तींची स्पर्धा घडवत जी ते वर्ष सोडवायचे होते.",
        },
        pair: {
          left: {
            en: "The Tsar abdicates, monarchy ends",
            hi: "ज़ार गद्दी छोड़ता, राजतंत्र समाप्त",
            mr: "झार गादी सोडतो, राजेशाही संपते",
          },
          right: {
            en: "the February Revolution",
            hi: "फ़रवरी क्रांति",
            mr: "फेब्रुवारी क्रांती",
          },
        },
      },
      {
        id: "october-revolution",
        name: {
          en: "The October Revolution",
          hi: "अक्टूबर क्रांति",
          mr: "ऑक्टोबर क्रांती",
        },
        kind: "event",
        prompt: {
          en: "Later in 1917 Lenin's party seized power from the Provisional Government, promising 'peace, land and bread' and rule by the workers' councils. Which revolution brought the Bolsheviks to power?",
          hi: "1917 में बाद में लेनिन के दल ने अस्थायी सरकार से शक्ति छीनी, 'शांति, भूमि और रोटी' और मज़दूर-परिषदों के शासन का वादा करते। किस क्रांति ने बोल्शेविकों को शक्ति में लाया?",
          mr: "1917 मध्ये नंतर लेनिनच्या पक्षाने हंगामी सरकारकडून शक्ती हिसकावली, 'शांती, जमीन आणि भाकर' आणि कामगार-समित्यांच्या राज्याचे वचन देत. कोणत्या क्रांतीने बोल्शेविकांना शक्तीत आणले?",
        },
        statement: {
          en: "In the October Revolution of 1917 the Bolsheviks under Lenin overthrew the Provisional Government and took power in the name of the soviets, promising peace, land and bread.",
          hi: "1917 की अक्टूबर क्रांति में लेनिन के नेतृत्व में बोल्शेविकों ने अस्थायी सरकार को उलटा और सोवियतों के नाम पर शक्ति ली, शांति, भूमि और रोटी का वादा करते।",
          mr: "1917 च्या ऑक्टोबर क्रांतीत लेनिनच्या नेतृत्वाखाली बोल्शेविकांनी हंगामी सरकार उलथवले आणि सोव्हिएतांच्या नावाने शक्ती घेतली, शांती, जमीन आणि भाकरीचे वचन देत.",
        },
        detail: {
          en: "Unlike February's leaderless crowd, October was a planned seizure — armed workers and soldiers took the telephone exchange, bridges and the Winter Palace in a single night.",
          hi: "फ़रवरी की नेतृत्वहीन भीड़ के विपरीत, अक्टूबर एक नियोजित क़ब्ज़ा था — सशस्त्र मज़दूर-सैनिकों ने एक ही रात में टेलीफ़ोन-केंद्र, पुल और शीतमहल लिए।",
          mr: "फेब्रुवारीच्या नेतृत्वहीन जमावाविरुद्ध, ऑक्टोबर एक नियोजित ताबा होता — सशस्त्र कामगार-सैनिकांनी एकाच रात्रीत टेलिफोन-केंद्र, पूल आणि हिवाळी राजवाडा घेतले.",
        },
        extra: {
          en: "The new government soon made a separate peace to leave the war, and began handing land to peasants and nationalising industry and banks.",
          hi: "नई सरकार ने शीघ्र युद्ध छोड़ने को अलग संधि की, और किसानों को भूमि सौंपने और उद्योग-बैंकों का राष्ट्रीयकरण शुरू किया।",
          mr: "नव्या सरकारने लवकरच युद्ध सोडायला वेगळी तह केली, आणि शेतकऱ्यांना जमीन सोपवणे आणि उद्योग-बँकांचे राष्ट्रीयीकरण सुरू केले.",
        },
        pair: {
          left: {
            en: "A planned Bolshevik seizure of power",
            hi: "नियोजित बोल्शेविक शक्ति-क़ब्ज़ा",
            mr: "नियोजित बोल्शेविक शक्ती-ताबा",
          },
          right: {
            en: "the October Revolution",
            hi: "अक्टूबर क्रांति",
            mr: "ऑक्टोबर क्रांती",
          },
        },
      },
      {
        id: "planned-economy",
        name: {
          en: "The planned economy",
          hi: "नियोजित अर्थव्यवस्था",
          mr: "नियोजित अर्थव्यवस्था",
        },
        kind: "structure",
        prompt: {
          en: "After the revolution the new state took over industry and merged peasant holdings into large collective farms, directing what should be produced through five-year targets. What was this economic system called?",
          hi: "क्रांति के बाद नए राज्य ने उद्योग अपने अधीन लिए और किसान जोतों को बड़े सामूहिक खेतों में मिलाया, पंचवर्षीय लक्ष्यों से तय करते क्या उत्पादित हो। इस आर्थिक व्यवस्था को क्या कहा गया?",
          mr: "क्रांतीनंतर नव्या राज्याने उद्योग ताब्यात घेतले आणि शेतकरी जमिनी मोठ्या सामूहिक शेतांत विलीन केल्या, पंचवार्षिक उद्दिष्टांतून काय उत्पादित व्हावे ठरवत. या आर्थिक व्यवस्थेला काय म्हटले?",
        },
        statement: {
          en: "The planned economy put industry, banks and land under state ownership, replacing the market's prices with government targets that decided what was produced and how much.",
          hi: "नियोजित अर्थव्यवस्था ने उद्योग, बैंक और भूमि को राज्य-स्वामित्व में रखा, बाज़ार की क़ीमतों को सरकारी लक्ष्यों से बदलते जो तय करते क्या और कितना उत्पादित हो।",
          mr: "नियोजित अर्थव्यवस्थेने उद्योग, बँका आणि जमीन राज्य-मालकीत ठेवली, बाजाराच्या किमतींना सरकारी उद्दिष्टांनी बदलत जी ठरवत काय आणि किती उत्पादित व्हावे.",
        },
        detail: {
          en: "Collectivisation forced peasants off their own plots into state and collective farms; it raised output in theory but caused bitter resistance and, in places, famine.",
          hi: "सामूहिकीकरण ने किसानों को अपनी जोतों से हटा राज्य और सामूहिक खेतों में धकेला; इसने सिद्धांततः उत्पादन बढ़ाया पर कड़वा प्रतिरोध और, कहीं-कहीं, अकाल लाया।",
          mr: "सामूहिकीकरणाने शेतकऱ्यांना स्वतःच्या जमिनींतून हटवून राज्य आणि सामूहिक शेतांत ढकलले; याने सैद्धांतिकदृष्ट्या उत्पादन वाढवले पण कडवा प्रतिकार आणि, ठिकठिकाणी, दुष्काळ आणला.",
        },
        extra: {
          en: "The state also became a one-party dictatorship: rapid industrial growth came alongside censorship, the crushing of critics, and no free elections.",
          hi: "राज्य एक-दलीय तानाशाही भी बना: तेज़ औद्योगिक वृद्धि सेंसरशिप, आलोचकों के दमन, और मुक्त चुनावों के अभाव के साथ आई।",
          mr: "राज्य एक-पक्षीय हुकूमशाहीही बनले: जलद औद्योगिक वाढ सेन्सॉरशिप, टीकाकारांचे दमन, आणि मुक्त निवडणुकांच्या अभावासह आली.",
        },
        pair: {
          left: {
            en: "State targets replace market prices",
            hi: "राज्य-लक्ष्य बाज़ार-क़ीमतों को बदलते",
            mr: "राज्य-उद्दिष्टे बाजार-किमती बदलतात",
          },
          right: {
            en: "the planned economy",
            hi: "नियोजित अर्थव्यवस्था",
            mr: "नियोजित अर्थव्यवस्था",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "The First World War is often called the true trigger of the Russian Revolution, even though discontent with the Tsar was decades old. Why did the war specifically push Russia over the edge in 1917?",
          hi: "प्रथम विश्वयुद्ध को अक्सर रूसी क्रांति का असली प्रेरक कहा जाता, यद्यपि ज़ार से असंतोष दशकों पुराना था। युद्ध ने विशेष रूप से 1917 में रूस को कगार पार क्यों धकेला?",
          mr: "पहिल्या महायुद्धाला अनेकदा रशियन क्रांतीचा खरा चालक म्हणतात, जरी झारविषयीचा असंतोष दशके जुना होता. युद्धाने विशेषतः 1917 मध्ये रशियाला कड्यापलीकडे का ढकलले?",
        },
        choices: [
          {
            en: "The war piled catastrophic defeats, mass deaths and severe food and fuel shortages onto old grievances; crucially, soldiers stopped obeying orders to fire on protesters and joined them, so the Tsar lost the very force that had kept him in power",
            hi: "युद्ध ने पुरानी शिकायतों पर विनाशकारी हारें, सामूहिक मृत्यु और भोजन-ईंधन की भारी कमी ढेर की; मुख्यतः, सैनिकों ने प्रदर्शनकारियों पर गोली के आदेश मानने बंद किए और उनसे जुड़ गए, अतः ज़ार ने वही बल खोया जिसने उसे शक्ति में रखा था",
            mr: "युद्धाने जुन्या तक्रारींवर विनाशकारी पराभव, सामूहिक मृत्यू आणि तीव्र अन्न-इंधन टंचाई रचली; मुख्यतः, सैनिकांनी आंदोलकांवर गोळी झाडण्याचे आदेश पाळणे थांबवले आणि त्यांना सामील झाले, म्हणून झारने तेच बल गमावले ज्याने त्याला शक्तीत ठेवले होते",
          },
          {
            en: "The war made the Tsar so popular that people revolted out of jealousy",
            hi: "युद्ध ने ज़ार को इतना लोकप्रिय किया कि लोग ईर्ष्या से विद्रोह कर उठे",
            mr: "युद्धाने झारला इतका लोकप्रिय केला की लोक मत्सराने बंड करून उठले",
          },
          {
            en: "Russia won the war easily and the soldiers demanded a republic as a reward",
            hi: "रूस युद्ध सहज जीता और सैनिकों ने इनाम में गणराज्य माँगा",
            mr: "रशिया युद्ध सहज जिंकला आणि सैनिकांनी बक्षीस म्हणून प्रजासत्ताक मागितले",
          },
          {
            en: "The war had no effect; the revolution would have happened identically without it",
            hi: "युद्ध का कोई असर नहीं; क्रांति उसके बिना भी वैसे ही होती",
            mr: "युद्धाचा काही परिणाम नाही; क्रांती त्याविनाही तशीच झाली असती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Discontent alone had simmered for decades — an autocrat who allowed no real parliament, peasants hungry for land, workers labouring long hours with strikes banned. What the war did was convert that chronic discontent into an acute, unsurvivable crisis, and knock away the one prop that had held the Tsar up. On the crisis side, the war was a disaster for Russia: its poorly equipped armies suffered enormous defeats and millions of casualties, while at home the diversion of men, trains and grain to the front left the cities short of bread and fuel exactly as prices soared. Hunger and grief now had a clear address — the Tsar, who had personally taken command of the army and so owned its failures. But the decisive point is about force. An autocracy ultimately rests on soldiers willing to shoot when ordered. In February 1917, when strikers and bread-marchers filled Petrograd, the soldiers — themselves war-weary conscripts from peasant and worker families — refused to fire and instead crossed over to the crowd. The moment the army would no longer defend him, the Tsar had nothing left to rule with, and he abdicated. So the war did not invent Russia's grievances; it deepened them past endurance and, more importantly, dissolved the loyalty of the men with the guns — which is why a monarchy that had survived 1905 fell within days in 1917.",
          hi: "असंतोष अकेला दशकों सुलगा था — एक निरंकुश जो कोई असली संसद न देता, भूमि को भूखे किसान, हड़तालें प्रतिबंधित होते लंबे घंटे श्रमते मज़दूर। युद्ध ने जो किया वह उस पुराने असंतोष को तीव्र, अजीवित संकट में बदलना, और ज़ार को थामे उस एक टेक को गिराना था। संकट-पक्ष पर, युद्ध रूस के लिए विपत्ति था: उसकी बुरी तरह सज्जित सेनाओं ने भारी हारें और लाखों हताहत झेले, जबकि घर पर मोर्चे को पुरुष-रेल-अनाज मोड़ने ने शहरों को रोटी-ईंधन की कमी में छोड़ा ठीक जब क़ीमतें चढ़ीं। भूख-शोक का अब स्पष्ट पता था — ज़ार, जिसने स्वयं सेना की कमान ली और यों उसकी विफलताएँ अपनाईं। पर निर्णायक बिंदु बल का है। निरंकुशता अंततः आदेश पर गोली चलाने को तैयार सैनिकों पर टिकती। फ़रवरी 1917 में, जब हड़तालियों और रोटी-जुलूसियों ने पेत्रोग्राद भरा, सैनिकों ने — स्वयं किसान-मज़दूर परिवारों के युद्ध-थके भर्ती — गोली से मना किया और भीड़ की ओर पार हो गए। जिस क्षण सेना उसकी रक्षा नहीं करेगी, ज़ार के पास शासन को कुछ न बचा, और उसने गद्दी छोड़ी। अतः युद्ध ने रूस की शिकायतें नहीं गढ़ीं; उसने उन्हें सहनशक्ति से परे गहराया और, अधिक महत्वपूर्ण, बंदूक वाले पुरुषों की वफ़ादारी घोली — इसी से 1905 झेली राजगद्दी 1917 में दिनों में गिरी।",
          mr: "असंतोष एकटा दशके धुमसत होता — एक निरंकुश जो कोणतीही खरी संसद देत नसे, जमिनीला भुकेले शेतकरी, संप बंदी असता लांब तास श्रमणारे कामगार. युद्धाने जे केले ते त्या जुनाट असंतोषाला तीव्र, न जगवणाऱ्या संकटात बदलणे, आणि झारला धरून ठेवणारा तो एक आधार पाडणे. संकट-बाजूला, युद्ध रशियासाठी आपत्ती होते: तिच्या वाईट सज्ज सैन्यांनी प्रचंड पराभव आणि लाखो बळी सोसले, तर घरी आघाडीकडे माणसे-रेल्वे-धान्य वळवल्याने शहरे भाकर-इंधन टंचाईत सोडली नेमके जेव्हा किमती चढल्या. भूक-शोकाला आता स्पष्ट पत्ता होता — झार, ज्याने स्वतः सैन्याचे नेतृत्व घेतले आणि म्हणून त्याचे अपयश स्वतःचे केले. पण निर्णायक मुद्दा बलाचा आहे. निरंकुशता अखेर आदेशावर गोळी झाडायला तयार सैनिकांवर टिकते. फेब्रुवारी 1917 मध्ये, जेव्हा संपकरी आणि भाकर-मोर्चेकऱ्यांनी पेट्रोग्राड भरले, सैनिकांनी — स्वतः शेतकरी-कामगार कुटुंबांतले युद्ध-कंटाळलेले भरती — गोळी झाडायला नकार दिला आणि जमावाकडे ओलांडले. ज्या क्षणी सैन्य त्याचे रक्षण करणार नाही, झारकडे राज्य करायला काही उरले नाही, आणि त्याने गादी सोडली. म्हणून युद्धाने रशियाच्या तक्रारी घडवल्या नाहीत; त्याने त्या सहनशक्तीपलीकडे खोल केल्या आणि, अधिक महत्त्वाचे, बंदूकवाल्या माणसांची निष्ठा विरघळवली — म्हणूनच 1905 टिकलेली राजगादी 1917 मध्ये दिवसांत पडली.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Russia had two revolutions in a single year — February and October 1917 — yet they were very different kinds of event. What was the essential difference between them?",
          hi: "रूस में एक ही वर्ष दो क्रांतियाँ हुईं — फ़रवरी और अक्टूबर 1917 — फिर भी वे बहुत भिन्न प्रकार की घटनाएँ थीं। उनके बीच मूल अंतर क्या था?",
          mr: "रशियात एकाच वर्षी दोन क्रांती झाल्या — फेब्रुवारी आणि ऑक्टोबर 1917 — तरी त्या अतिशय वेगळ्या प्रकारच्या घटना होत्या. त्यांच्यातील मूलभूत फरक काय होता?",
        },
        choices: [
          {
            en: "February was a spontaneous, leaderless mass uprising that toppled the Tsar and left power with a Provisional Government; October was a planned, party-led seizure in which the Bolsheviks overthrew that government and took power for the soviets",
            hi: "फ़रवरी एक स्वतःस्फूर्त, नेतृत्वहीन जन-उभार थी जिसने ज़ार गिराया और शक्ति अस्थायी सरकार के पास छोड़ी; अक्टूबर एक नियोजित, दल-नेतृत्व क़ब्ज़ा था जिसमें बोल्शेविकों ने उस सरकार को उलटा और सोवियतों के लिए शक्ति ली",
            mr: "फेब्रुवारी एक स्वयंस्फूर्त, नेतृत्वहीन जन-उठाव होती जिने झार पाडला आणि शक्ती हंगामी सरकारकडे सोडली; ऑक्टोबर एक नियोजित, पक्ष-नेतृत्व ताबा होता ज्यात बोल्शेविकांनी ते सरकार उलथवले आणि सोव्हिएतांसाठी शक्ती घेतली",
          },
          {
            en: "February and October were the same event described twice",
            hi: "फ़रवरी और अक्टूबर एक ही घटना दो बार वर्णित",
            mr: "फेब्रुवारी आणि ऑक्टोबर एकच घटना दोनदा वर्णिलेली",
          },
          {
            en: "February was led by the Bolsheviks and October by the Tsar",
            hi: "फ़रवरी का नेतृत्व बोल्शेविकों ने और अक्टूबर का ज़ार ने किया",
            mr: "फेब्रुवारीचे नेतृत्व बोल्शेविकांनी आणि ऑक्टोबरचे झारने केले",
          },
          {
            en: "Both revolutions restored the monarchy to full power",
            hi: "दोनों क्रांतियों ने राजतंत्र को पूर्ण शक्ति में लौटाया",
            mr: "दोन्ही क्रांतींनी राजेशाहीला पूर्ण शक्तीत परत आणले",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The two revolutions differ in almost every way that matters: who made them, how they were organised, and what they produced. The February Revolution was a spontaneous eruption from below. No single party planned or led it; it began as strikes and bread-marches in Petrograd, swelled as soldiers refused to fire and joined in, and simply overwhelmed a regime that had lost the will and the means to resist. Its result was the abdication of the Tsar and the end of the monarchy — but it left a power vacuum, hastily filled by a Provisional Government of Duma politicians, while workers' and soldiers' soviets held real influence in the streets. February was thus a broad, leaderless overthrow that ended one thing (autocracy) without clearly deciding what would replace it. The October Revolution was the opposite in character: a deliberate, tightly organised seizure of power by one party. The Bolsheviks under Lenin, arguing that the Provisional Government had failed to deliver peace, land or bread and had no right to rule, planned and executed a near-bloodless coup — armed detachments taking the key points of Petrograd and arresting the government in the Winter Palace in a single night. Its result was not the fall of a monarchy (that was already gone) but the transfer of power from the Provisional Government to the Bolshevik party ruling in the name of the soviets, which then began building a socialist, one-party state. So the neat contrast is: February — spontaneous, popular, leaderless, ends the Tsar; October — planned, party-driven, disciplined, installs the Bolsheviks. Calling both simply 'the Russian Revolution' hides that one was a mass collapse of the old order and the other a decisive capture of the new.",
          hi: "दोनों क्रांतियाँ लगभग हर महत्वपूर्ण तरीक़े में भिन्न: किसने कीं, कैसे संगठित थीं, और क्या पैदा कीं। फ़रवरी क्रांति नीचे से स्वतःस्फूर्त विस्फोट थी। कोई एक दल न उसे रचा न नेतृत्व दिया; वह पेत्रोग्राद में हड़तालों-रोटी-जुलूसों से शुरू हुई, सैनिकों के गोली से मना कर जुड़ते बढ़ी, और उस शासन को बस अभिभूत किया जिसने प्रतिरोध की इच्छा-साधन खो दिए। उसका परिणाम ज़ार का गद्दी-त्याग और राजतंत्र का अंत — पर उसने शक्ति-शून्य छोड़ा, जल्दबाज़ी में ड्यूमा राजनेताओं की अस्थायी सरकार से भरा, जबकि मज़दूर-सैनिक सोवियत सड़कों पर असली प्रभाव रखते। यों फ़रवरी एक व्यापक, नेतृत्वहीन उलटाव थी जिसने एक चीज़ (निरंकुशता) समाप्त की बिना स्पष्ट तय किए क्या उसे बदलेगा। अक्टूबर क्रांति चरित्र में उलटी: एक दल द्वारा जान-बूझकर, कसकर संगठित शक्ति-क़ब्ज़ा। लेनिन के बोल्शेविकों ने, तर्क देते कि अस्थायी सरकार शांति-भूमि-रोटी न दे पाई और शासन का अधिकार नहीं रखती, एक लगभग रक्तहीन तख़्ता-पलट रचा-किया — सशस्त्र टुकड़ियाँ पेत्रोग्राद के मुख्य बिंदु लेतीं और एक ही रात शीतमहल में सरकार गिरफ़्तार करतीं। उसका परिणाम राजतंत्र का पतन नहीं (वह पहले ही गया) बल्कि अस्थायी सरकार से सोवियतों के नाम शासन करते बोल्शेविक दल को शक्ति-हस्तांतरण, जो फिर समाजवादी, एक-दलीय राज्य बनाने लगा। अतः सुथरा विरोध: फ़रवरी — स्वतःस्फूर्त, जन, नेतृत्वहीन, ज़ार समाप्त; अक्टूबर — नियोजित, दल-चालित, अनुशासित, बोल्शेविक स्थापित। दोनों को बस 'रूसी क्रांति' कहना छिपाता कि एक पुरानी व्यवस्था का जन-पतन था और दूसरा नई का निर्णायक क़ब्ज़ा।",
          mr: "दोन्ही क्रांती जवळपास प्रत्येक महत्त्वाच्या बाबतीत वेगळ्या: कोणी केल्या, कशा संघटित होत्या, आणि काय घडवल्या. फेब्रुवारी क्रांती खालून स्वयंस्फूर्त उद्रेक होती. कोणत्याही एका पक्षाने ती रचली वा नेतृत्व दिले नाही; ती पेट्रोग्राडमधील संप-भाकर-मोर्च्यांनी सुरू झाली, सैनिक गोळी झाडायला नकार देत सामील होत वाढली, आणि त्या राजवटीला फक्त गारद केले जिने प्रतिकाराची इच्छा-साधने गमावली. तिचा परिणाम झारचा पदत्याग आणि राजेशाहीचा अंत — पण तिने शक्ती-पोकळी सोडली, घाईने ड्यूमा राजकारण्यांच्या हंगामी सरकारने भरली, तर कामगार-सैनिक सोव्हिएत रस्त्यांवर खरा प्रभाव राखत. अशी फेब्रुवारी एक व्यापक, नेतृत्वहीन उलथापालथ होती जिने एक गोष्ट (निरंकुशता) संपवली स्पष्ट न ठरवता तिला काय बदलेल. ऑक्टोबर क्रांती स्वभावात उलट: एका पक्षाने जाणीवपूर्वक, घट्ट संघटित शक्ती-ताबा. लेनिनच्या बोल्शेविकांनी, युक्तिवाद करत की हंगामी सरकार शांती-जमीन-भाकर देऊ शकली नाही आणि राज्याचा अधिकार राखत नाही, एक जवळपास रक्तहीन उठाव रचला-केला — सशस्त्र तुकड्या पेट्रोग्राडचे मुख्य बिंदू घेत आणि एकाच रात्री हिवाळी राजवाड्यात सरकार अटक करत. तिचा परिणाम राजेशाहीचे पतन नाही (ते आधीच गेले) तर हंगामी सरकारकडून सोव्हिएतांच्या नावाने राज्य करणाऱ्या बोल्शेविक पक्षाकडे शक्ती-हस्तांतरण, जो मग समाजवादी, एक-पक्षीय राज्य बांधू लागला. म्हणून नीटनेटका विरोध: फेब्रुवारी — स्वयंस्फूर्त, जन, नेतृत्वहीन, झार संपवते; ऑक्टोबर — नियोजित, पक्ष-चालित, शिस्तबद्ध, बोल्शेविक बसवते. दोन्हींना फक्त 'रशियन क्रांती' म्हणणे लपवते की एक जुन्या व्यवस्थेचे जन-पतन होते आणि दुसरा नव्याचा निर्णायक ताबा.",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Nazism and the Rise of Hitler                              */
  /* ----------------------------------------------------------------------- */
  {
    slug: "history-9-nazism-rise-hitler",
    subject: "HISTORY",
    classLevel: 9,
    chapter: {
      en: "Chapter 3 — Nazism and the Rise of Hitler",
      hi: "अध्याय 3 — नात्सीवाद और हिटलर का उदय",
      mr: "प्रकरण 3 — नाझीवाद आणि हिटलरचा उदय",
    },
    name: {
      en: "Nazism and the Rise of Hitler",
      hi: "नात्सीवाद और हिटलर का उदय",
      mr: "नाझीवाद आणि हिटलरचा उदय",
    },
    summary: {
      en: "How a democracy voted in its own destroyer: a punishing peace that bred resentment, a young republic broken by inflation and depression, a party that offered pride and a scapegoat, and a dictatorship built on propaganda, fear and a racism that ended in genocide.",
      hi: "एक लोकतंत्र ने अपने ही विनाशक को कैसे चुना: एक दंडात्मक शांति जिसने आक्रोश पाला, मुद्रास्फीति और मंदी से टूटा युवा गणराज्य, एक दल जिसने गर्व और एक बलि का बकरा दिया, और प्रचार, भय तथा नरसंहार में समाप्त नस्लवाद पर बनी तानाशाही।",
      mr: "एका लोकशाहीने आपल्याच विनाशकाला कसे निवडले: एक शिक्षादायक शांती जिने संताप पोसला, चलनवाढ आणि मंदीने मोडलेले तरुण प्रजासत्ताक, एक पक्ष ज्याने अभिमान आणि एक बळीचा बकरा दिला, आणि प्रचार, भीती आणि वंशसंहारात संपलेल्या वंशवादावर बांधलेली हुकूमशाही.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "treaty-versailles",
        name: {
          en: "The Treaty of Versailles",
          hi: "वर्साय की संधि",
          mr: "व्हर्सायचा तह",
        },
        kind: "cause",
        prompt: {
          en: "After losing the First World War, Germany was made to accept sole guilt, huge reparations, lost territory and a shrunken army. Which harsh peace treaty imposed these terms?",
          hi: "प्रथम विश्वयुद्ध हारने के बाद, जर्मनी को अकेला अपराध, भारी क्षतिपूर्ति, खोया क्षेत्र और सिकुड़ी सेना मानने को बाध्य किया गया। किस कठोर शांति-संधि ने ये शर्तें थोपीं?",
          mr: "पहिले महायुद्ध हरल्यानंतर, जर्मनीला एकट्याने अपराध, प्रचंड नुकसानभरपाई, गमावलेला प्रदेश आणि आकुंचलेले सैन्य मान्य करायला भाग पाडले. कोणत्या कठोर शांती-तहाने या अटी लादल्या?",
        },
        statement: {
          en: "The Treaty of Versailles imposed a harsh peace on defeated Germany — sole war guilt, crippling reparations, lost colonies and territory, and a drastically limited army.",
          hi: "वर्साय की संधि ने पराजित जर्मनी पर कठोर शांति थोपी — अकेला युद्ध-अपराध, अपंग करती क्षतिपूर्ति, खोए उपनिवेश-क्षेत्र, और अत्यंत सीमित सेना।",
          mr: "व्हर्सायच्या तहाने पराभूत जर्मनीवर कठोर शांती लादली — एकट्याने युद्ध-अपराध, अपंग करणारी नुकसानभरपाई, गमावलेल्या वसाहती-प्रदेश, आणि अत्यंत मर्यादित सैन्य.",
        },
        detail: {
          en: "The 'war guilt clause' forcing Germany to accept full blame was felt as a national humiliation, and the reparations seemed an impossible debt hung on the whole people.",
          hi: "जर्मनी को पूरा दोष मानने को बाध्य करता 'युद्ध-अपराध खंड' राष्ट्रीय अपमान लगा, और क्षतिपूर्ति पूरी जनता पर लटका असंभव ऋण लगी।",
          mr: "जर्मनीला पूर्ण दोष मान्य करायला भाग पाडणारे 'युद्ध-अपराध कलम' राष्ट्रीय अपमान वाटले, आणि नुकसानभरपाई अख्ख्या जनतेवर टांगलेले अशक्य कर्ज वाटली.",
        },
        extra: {
          en: "Nazis would later exploit this bitterness, branding the politicians who signed the treaty the 'November criminals' who had stabbed Germany in the back.",
          hi: "नात्सी बाद में इस कड़वाहट का दोहन करेंगे, संधि पर हस्ताक्षर करने वाले राजनेताओं को 'नवंबर के अपराधी' नाम देते जिन्होंने जर्मनी की पीठ में छुरा घोंपा।",
          mr: "नाझी नंतर या कडवटपणाचा फायदा घेतील, तहावर सही करणाऱ्या राजकारण्यांना 'नोव्हेंबरचे गुन्हेगार' नाव देत ज्यांनी जर्मनीच्या पाठीत खंजीर खुपसला.",
        },
        pair: {
          left: {
            en: "War guilt, reparations, a shrunken army",
            hi: "युद्ध-अपराध, क्षतिपूर्ति, सिकुड़ी सेना",
            mr: "युद्ध-अपराध, नुकसानभरपाई, आकुंचलेले सैन्य",
          },
          right: {
            en: "the Treaty of Versailles",
            hi: "वर्साय की संधि",
            mr: "व्हर्सायचा तह",
          },
        },
      },
      {
        id: "weimar-crisis",
        name: {
          en: "The Weimar Republic's crises",
          hi: "वाइमर गणराज्य के संकट",
          mr: "वायमर प्रजासत्ताकाची संकटे",
        },
        kind: "cause",
        prompt: {
          en: "Germany's post-war democracy was battered by runaway inflation that made money worthless, then by mass unemployment in the Great Depression. Which fragile republic staggered under these blows?",
          hi: "जर्मनी के युद्धोत्तर लोकतंत्र को बेलगाम मुद्रास्फीति ने पीटा जिसने पैसे को बेकार किया, फिर महामंदी में सामूहिक बेरोज़गारी ने। कौन-सा नाज़ुक गणराज्य इन चोटों तले लड़खड़ाया?",
          mr: "जर्मनीच्या युद्धोत्तर लोकशाहीला बेलगाम चलनवाढीने बडवले जिने पैसा निरुपयोगी केला, मग महामंदीत सामूहिक बेरोजगारीने. कोणते नाजूक प्रजासत्ताक या आघातांखाली डगमगले?",
        },
        statement: {
          en: "The Weimar Republic, Germany's new democracy, was rocked by hyperinflation that destroyed people's savings and then by the Great Depression's mass unemployment, leaving many desperate and disillusioned with democracy.",
          hi: "वाइमर गणराज्य, जर्मनी का नया लोकतंत्र, अति-मुद्रास्फीति से हिला जिसने लोगों की बचत नष्ट की और फिर महामंदी की सामूहिक बेरोज़गारी से, अनेकों को हताश और लोकतंत्र से मोहभंग करते।",
          mr: "वायमर प्रजासत्ताक, जर्मनीची नवी लोकशाही, अति-चलनवाढीने हादरली जिने लोकांची बचत नष्ट केली आणि मग महामंदीच्या सामूहिक बेरोजगारीने, अनेकांना हताश आणि लोकशाहीबद्दल भ्रमनिरास करत.",
        },
        detail: {
          en: "At inflation's peak a loaf of bread cost billions of marks; people carried cash in wheelbarrows, and a lifetime's savings could not buy a meal.",
          hi: "मुद्रास्फीति के शिखर पर रोटी की एक टिक्की अरबों मार्क की; लोग नक़दी ठेलों में ढोते, और जीवन-भर की बचत एक भोजन न ख़रीद पाती।",
          mr: "चलनवाढीच्या शिखरावर भाकरीचा एक तुकडा अब्जावधी मार्कचा; लोक रोकड ढकलगाड्यांत वाहत, आणि आयुष्यभराची बचत एक जेवण विकत घेऊ शकत नसे.",
        },
        extra: {
          en: "The republic's constitution let a president rule by emergency decree, a loophole that would let democracy be dismantled by legal means.",
          hi: "गणराज्य के संविधान ने राष्ट्रपति को आपात-अध्यादेश से शासन करने दिया, एक झरोखा जो लोकतंत्र को क़ानूनी तरीक़ों से ध्वस्त होने देगा।",
          mr: "प्रजासत्ताकाच्या संविधानाने राष्ट्रपतीला आणीबाणी-अध्यादेशाने राज्य करू दिले, एक पळवाट जी लोकशाहीला कायदेशीर मार्गांनी उद्ध्वस्त होऊ देईल.",
        },
        pair: {
          left: {
            en: "Hyperinflation and mass unemployment",
            hi: "अति-मुद्रास्फीति और सामूहिक बेरोज़गारी",
            mr: "अति-चलनवाढ आणि सामूहिक बेरोजगारी",
          },
          right: {
            en: "the Weimar Republic's crises",
            hi: "वाइमर गणराज्य के संकट",
            mr: "वायमर प्रजासत्ताकाची संकटे",
          },
        },
      },
      {
        id: "nazi-ideology",
        name: {
          en: "Nazi racial ideology",
          hi: "नात्सी नस्लीय विचारधारा",
          mr: "नाझी वांशिक विचारसरणी",
        },
        kind: "idea",
        prompt: {
          en: "The Nazis taught that humanity was ranked into superior and inferior races, that Germans were a master 'Aryan' race, and that they needed to seize 'living space' from others. What was this false doctrine?",
          hi: "नात्सियों ने सिखाया कि मानवता श्रेष्ठ और हीन नस्लों में क्रमबद्ध, कि जर्मन एक स्वामी 'आर्य' नस्ल, और उन्हें दूसरों से 'रहने की जगह' छीननी थी। यह झूठा सिद्धांत क्या था?",
          mr: "नाझींनी शिकवले की मानवता श्रेष्ठ आणि कनिष्ठ वंशांत क्रमबद्ध, की जर्मन एक स्वामी 'आर्य' वंश, आणि त्यांना इतरांकडून 'राहण्याची जागा' हिसकावायची होती. हा खोटा सिद्धांत काय होता?",
        },
        statement: {
          en: "Nazi ideology falsely ranked humanity into 'superior' and 'inferior' races, glorified Germans as a master Aryan race, and demanded Lebensraum — living space seized from other peoples.",
          hi: "नात्सी विचारधारा ने झूठे रूप से मानवता को 'श्रेष्ठ' और 'हीन' नस्लों में क्रमबद्ध किया, जर्मनों को स्वामी आर्य नस्ल बताकर महिमामंडित किया, और लेबेन्सराउम — दूसरे लोगों से छीनी रहने की जगह — माँगी।",
          mr: "नाझी विचारसरणीने खोट्या रीतीने मानवतेला 'श्रेष्ठ' आणि 'कनिष्ठ' वंशांत क्रमबद्ध केले, जर्मनांना स्वामी आर्य वंश म्हणून गौरवले, आणि लेबेन्सराउम — इतर लोकांकडून हिसकावलेली राहण्याची जागा — मागितली.",
        },
        detail: {
          en: "This pseudo-science had no basis in biology; 'race' as the Nazis used it was a political fiction built to justify domination and murder.",
          hi: "इस छद्म-विज्ञान का जीव-विज्ञान में कोई आधार नहीं; नात्सियों द्वारा प्रयुक्त 'नस्ल' प्रभुत्व और हत्या को उचित ठहराने बनी राजनीतिक कल्पना थी।",
          mr: "या छद्म-विज्ञानाला जीवशास्त्रात काही आधार नव्हता; नाझींनी वापरलेला 'वंश' वर्चस्व आणि हत्या समर्थन करायला बनवलेली राजकीय कल्पना होती.",
        },
        extra: {
          en: "Jews above all were cast as the enemy of the imagined pure nation, targets of a hatred that Nazi teaching drilled into children at school.",
          hi: "यहूदी सबसे बढ़कर कल्पित शुद्ध राष्ट्र के शत्रु ठहराए गए, उस घृणा के लक्ष्य जिसे नात्सी शिक्षा बच्चों में स्कूल में भरती।",
          mr: "ज्यू सर्वांहून कल्पित शुद्ध राष्ट्राचे शत्रू ठरवले गेले, त्या द्वेषाचे लक्ष्य जो नाझी शिक्षण मुलांत शाळेत भरत असे.",
        },
        pair: {
          left: {
            en: "A master race seizing others' 'living space'",
            hi: "स्वामी नस्ल दूसरों की 'रहने की जगह' छीनती",
            mr: "स्वामी वंश इतरांची 'राहण्याची जागा' हिसकावतो",
          },
          right: {
            en: "Nazi racial ideology",
            hi: "नात्सी नस्लीय विचारधारा",
            mr: "नाझी वांशिक विचारसरणी",
          },
        },
      },
      {
        id: "hitler-power",
        name: {
          en: "Hitler's rise to power",
          hi: "हिटलर का सत्ता में उदय",
          mr: "हिटलरचा सत्तेत उदय",
        },
        kind: "event",
        prompt: {
          en: "By 1932 the Nazis were the largest party in the Reichstag, and in 1933 Hitler was appointed Chancellor — reaching power not by a coup but through the ballot box and back-room deals. How did he first come to rule?",
          hi: "1932 तक नात्सी राइख़्स्टाग में सबसे बड़ा दल थे, और 1933 में हिटलर चांसलर नियुक्त हुआ — तख़्ता-पलट से नहीं बल्कि मतपेटी और पर्दे के पीछे के सौदों से शक्ति पाते। वह पहले शासन में कैसे आया?",
          mr: "1932 पर्यंत नाझी राइकस्टागमध्ये सर्वांत मोठा पक्ष होते, आणि 1933 मध्ये हिटलर चॅन्सेलर नियुक्त झाला — उठावाने नव्हे तर मतपेटी आणि पडद्यामागच्या व्यवहारांतून शक्ती मिळवत. तो प्रथम राज्यात कसा आला?",
        },
        statement: {
          en: "Hitler rose to power legally — the Nazis won the most seats through elections as the crisis deepened, and in 1933 he was appointed Chancellor by the president, not by force.",
          hi: "हिटलर क़ानूनी रूप से शक्ति में आया — संकट गहराते नात्सियों ने चुनावों से सबसे अधिक सीटें जीतीं, और 1933 में राष्ट्रपति ने उसे चांसलर नियुक्त किया, बल से नहीं।",
          mr: "हिटलर कायदेशीररीत्या सत्तेत आला — संकट खोल होताना नाझींनी निवडणुकांतून सर्वांत अधिक जागा जिंकल्या, आणि 1933 मध्ये राष्ट्रपतींनी त्याला चॅन्सेलर नियुक्त केले, बळाने नाही.",
        },
        detail: {
          en: "His powerful speeches and the Nazis' mass rallies promised jobs, national pride and a strong Germany to a people worn down by depression and defeat.",
          hi: "उसके शक्तिशाली भाषण और नात्सियों की विशाल रैलियाँ मंदी-हार से थकी जनता को रोज़गार, राष्ट्रीय गर्व और मज़बूत जर्मनी का वादा करतीं।",
          mr: "त्याची शक्तिशाली भाषणे आणि नाझींच्या विराट सभा मंदी-पराभवाने थकलेल्या जनतेला रोजगार, राष्ट्रीय अभिमान आणि बलवान जर्मनीचे वचन देत.",
        },
        extra: {
          en: "That he came to power by legal means, not a violent seizure, is the chapter's chilling lesson — a democracy can vote away its own freedom.",
          hi: "कि वह क़ानूनी तरीक़ों से शक्ति में आया, हिंसक क़ब्ज़े से नहीं, अध्याय का सिहरन-भरा सबक़ है — एक लोकतंत्र अपनी ही स्वतंत्रता मत देकर गँवा सकता है।",
          mr: "तो कायदेशीर मार्गांनी सत्तेत आला, हिंसक ताब्याने नाही, हा प्रकरणाचा थरकाप उडवणारा धडा — एक लोकशाही आपलेच स्वातंत्र्य मत देऊन गमावू शकते.",
        },
        pair: {
          left: {
            en: "Made Chancellor through the ballot box, not a coup",
            hi: "मतपेटी से चांसलर बना, तख़्ता-पलट से नहीं",
            mr: "मतपेटीतून चॅन्सेलर झाला, उठावाने नाही",
          },
          right: {
            en: "Hitler's rise to power",
            hi: "हिटलर का सत्ता में उदय",
            mr: "हिटलरचा सत्तेत उदय",
          },
        },
      },
      {
        id: "propaganda-dictatorship",
        name: {
          en: "Propaganda and the total state",
          hi: "प्रचार और समग्र राज्य",
          mr: "प्रचार आणि समग्र राज्य",
        },
        kind: "structure",
        prompt: {
          en: "Once in office Hitler banned other parties, silenced the press, and used posters, radio and film to flood every mind with one message, while critics were jailed. What kind of state did this build?",
          hi: "पद पाते ही हिटलर ने अन्य दल प्रतिबंधित किए, प्रेस को मौन किया, और पोस्टर-रेडियो-फ़िल्म से हर मन को एक संदेश से भर दिया, जबकि आलोचक जेल भेजे गए। इसने कैसा राज्य बनाया?",
          mr: "पद मिळताच हिटलरने इतर पक्ष बंदी घातली, वृत्तपत्रे मूक केली, आणि पोस्टर-रेडिओ-चित्रपटांतून प्रत्येक मन एका संदेशाने भरले, तर टीकाकार तुरुंगात गेले. याने कोणते राज्य बांधले?",
        },
        statement: {
          en: "Hitler built a total dictatorship — banning all other parties, crushing free press and dissent, and using relentless propaganda through radio, film and rallies to control what people thought.",
          hi: "हिटलर ने समग्र तानाशाही बनाई — सारे अन्य दल प्रतिबंधित करते, मुक्त प्रेस और असहमति कुचलते, और रेडियो-फ़िल्म-रैलियों से अथक प्रचार से लोग क्या सोचें नियंत्रित करते।",
          mr: "हिटलरने समग्र हुकूमशाही बांधली — सारे इतर पक्ष बंदी घालत, मुक्त वृत्तपत्रे आणि मतभेद चिरडत, आणि रेडिओ-चित्रपट-सभांतून अथक प्रचाराने लोक काय विचार करतात नियंत्रित करत.",
        },
        detail: {
          en: "An Enabling Act let Hitler make laws without parliament; the Reichstag fire was used as a pretext to arrest opponents and suspend civil rights overnight.",
          hi: "एक सक्षमकारी अधिनियम ने हिटलर को संसद बिना क़ानून बनाने दिया; राइख़्स्टाग-अग्नि को विरोधियों को गिरफ़्तार करने और नागरिक अधिकार रातोंरात निलंबित करने का बहाना बनाया गया।",
          mr: "एका सक्षमीकरण कायद्याने हिटलरला संसदेविना कायदे करू दिले; राइकस्टाग-आग विरोधकांना अटक करायला आणि नागरी हक्क रातोरात निलंबित करायला निमित्त बनवली गेली.",
        },
        extra: {
          en: "Propaganda worked by repetition and spectacle — vast torch-lit rallies, simple slogans and a relentless enemy image — not by honest argument.",
          hi: "प्रचार पुनरावृत्ति और तमाशे से काम करता — विशाल मशाल-रैलियाँ, सरल नारे और अथक शत्रु-छवि — ईमानदार तर्क से नहीं।",
          mr: "प्रचार पुनरावृत्ती आणि देखाव्याने काम करी — विराट मशाल-सभा, सोपे घोषवाक्ये आणि अथक शत्रू-प्रतिमा — प्रामाणिक युक्तिवादाने नाही.",
        },
        pair: {
          left: {
            en: "One party, silenced press, all minds flooded",
            hi: "एक दल, मौन प्रेस, सब मन भरे",
            mr: "एक पक्ष, मूक वृत्तपत्रे, सारी मने भरलेली",
          },
          right: {
            en: "propaganda and the total state",
            hi: "प्रचार और समग्र राज्य",
            mr: "प्रचार आणि समग्र राज्य",
          },
        },
      },
      {
        id: "the-holocaust",
        name: {
          en: "The Holocaust",
          hi: "यहूदी-नरसंहार",
          mr: "ज्यू-वंशसंहार",
        },
        kind: "event",
        prompt: {
          en: "The Nazi state moved from persecuting Jews and other targeted groups to their systematic mass murder, killing about six million Jews in camps built for the purpose. What is this genocide called?",
          hi: "नात्सी राज्य यहूदियों और अन्य लक्षित समूहों को सताने से उनकी व्यवस्थित सामूहिक हत्या तक बढ़ा, इस हेतु बने शिविरों में लगभग साठ लाख यहूदी मारते। इस नरसंहार को क्या कहते?",
          mr: "नाझी राज्य ज्यू आणि इतर लक्ष्यित गटांना छळण्यापासून त्यांच्या पद्धतशीर सामूहिक हत्येपर्यंत गेले, यासाठी बांधलेल्या छावण्यांत सुमारे साठ लाख ज्यू मारत. या वंशसंहाराला काय म्हणतात?",
        },
        statement: {
          en: "The Holocaust was the Nazi state's systematic genocide of about six million Jews, along with Roma, disabled people and others, murdered in ghettos and death camps.",
          hi: "यहूदी-नरसंहार नात्सी राज्य द्वारा लगभग साठ लाख यहूदियों का व्यवस्थित जनसंहार था, साथ रोमा, विकलांग और अन्य, यहूदी-बस्तियों और मृत्यु-शिविरों में मारे गए।",
          mr: "ज्यू-वंशसंहार नाझी राज्याने सुमारे साठ लाख ज्यूंचा पद्धतशीर वंशसंहार होता, सोबत रोमा, अपंग आणि इतर, वस्त्यांत आणि मृत्यू-छावण्यांत मारले गेले.",
        },
        detail: {
          en: "It began with laws stripping Jews of citizenship and property, herded them into sealed ghettos, and ended in industrialised killing at camps like Auschwitz.",
          hi: "यह यहूदियों से नागरिकता-संपत्ति छीनते क़ानूनों से शुरू हुआ, उन्हें बंद यहूदी-बस्तियों में हाँका, और ऑश्विट्ज़ जैसे शिविरों में औद्योगिक हत्या में समाप्त।",
          mr: "हे ज्यूंकडून नागरिकत्व-मालमत्ता हिरावणाऱ्या कायद्यांनी सुरू झाले, त्यांना बंद वस्त्यांत हाकलले, आणि ऑशविट्झसारख्या छावण्यांत औद्योगिक हत्येत संपले.",
        },
        extra: {
          en: "It stands as the gravest warning of where hatred, obedience and dehumanising propaganda can lead when a state turns them into policy.",
          hi: "यह सबसे गंभीर चेतावनी है कि घृणा, आज्ञापालन और अमानवीकरण-प्रचार कहाँ ले जा सकते जब राज्य उन्हें नीति बना दे।",
          mr: "हे सर्वांत गंभीर इशारा आहे की द्वेष, आज्ञापालन आणि अमानवीकरण-प्रचार कुठे नेऊ शकतात जेव्हा राज्य त्यांना धोरण बनवते.",
        },
        pair: {
          left: {
            en: "Systematic mass murder in the death camps",
            hi: "मृत्यु-शिविरों में व्यवस्थित सामूहिक हत्या",
            mr: "मृत्यू-छावण्यांत पद्धतशीर सामूहिक हत्या",
          },
          right: {
            en: "the Holocaust",
            hi: "यहूदी-नरसंहार",
            mr: "ज्यू-वंशसंहार",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "The Nazi party won only a small share of the vote in the 1920s, then surged to become Germany's largest party by 1932. What changed in those years to make so many Germans turn to Hitler?",
          hi: "नात्सी दल ने 1920 के दशक में मतों का केवल छोटा हिस्सा जीता, फिर 1932 तक उभरकर जर्मनी का सबसे बड़ा दल बना। उन वर्षों में क्या बदला कि इतने जर्मन हिटलर की ओर मुड़े?",
          mr: "नाझी पक्षाने 1920 च्या दशकात मतांचा फक्त लहान वाटा जिंकला, मग 1932 पर्यंत उसळून जर्मनीचा सर्वांत मोठा पक्ष बनला. त्या वर्षांत काय बदलले की इतके जर्मन हिटलरकडे वळले?",
        },
        choices: [
          {
            en: "The Great Depression from 1929 threw millions out of work and wrecked confidence in the democratic government; Hitler offered jobs, national pride and a scapegoat, and desperate people gambled on him when the mainstream parties seemed to offer nothing",
            hi: "1929 से महामंदी ने लाखों को बेरोज़गार किया और लोकतांत्रिक सरकार में भरोसा तोड़ा; हिटलर ने रोज़गार, राष्ट्रीय गर्व और एक बलि का बकरा दिया, और हताश लोगों ने उस पर दाँव लगाया जब मुख्यधारा दल कुछ न देते लगे",
            mr: "1929 पासून महामंदीने लाखोंना बेरोजगार केले आणि लोकशाही सरकारवरील विश्वास मोडला; हिटलरने रोजगार, राष्ट्रीय अभिमान आणि एक बळीचा बकरा दिला, आणि हताश लोकांनी त्याच्यावर पैज लावली जेव्हा मुख्य प्रवाहातले पक्ष काही देत नाहीत असे वाटले",
          },
          {
            en: "Germany suddenly became very prosperous, and voters rewarded Hitler for the good times",
            hi: "जर्मनी अचानक बहुत समृद्ध हुआ, और मतदाताओं ने अच्छे समय के लिए हिटलर को पुरस्कृत किया",
            mr: "जर्मनी अचानक फार समृद्ध झाला, आणि मतदारांनी चांगल्या काळासाठी हिटलरला बक्षीस दिले",
          },
          {
            en: "Foreign armies installed Hitler against the people's wishes",
            hi: "विदेशी सेनाओं ने जनता की इच्छा के विरुद्ध हिटलर को बिठाया",
            mr: "परकीय सैन्यांनी जनतेच्या इच्छेविरुद्ध हिटलरला बसवले",
          },
          {
            en: "Voting was abolished, so the Nazis' vote share is meaningless",
            hi: "मतदान समाप्त कर दिया गया, अतः नात्सियों का मत-हिस्सा निरर्थक",
            mr: "मतदान रद्द केले गेले, म्हणून नाझींचा मत-वाटा निरर्थक",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The turning point was economic catastrophe. Through the mid-1920s the Weimar Republic had stabilised a little, and with things merely difficult rather than desperate, an extremist party like the Nazis attracted only a fringe. Then the Great Depression struck from 1929: world trade collapsed, and in Germany — which had leaned on foreign loans — factories closed and unemployment climbed to around six million. Savings had already been wiped out by earlier hyperinflation, so now families faced hunger with no cushion and no clear hope. In that despair, the democratic government looked helpless: the mainstream parties quarrelled, tried austerity, and seemed to offer the suffering nothing. Hitler offered the opposite of helplessness. His speeches promised work, the restoration of national pride after the humiliation of Versailles, and — poisonously — a scapegoat, blaming Jews and the 'November criminals' for Germany's woes so that ordinary Germans need not blame themselves or the complexity of the crisis. To a frightened, jobless population, a confident strongman promising decisive action was a gamble many were willing to take, and Nazi support surged election by election until they were the largest party. The lesson is grim: economic collapse and lost faith in democracy, not sudden prosperity, are what made a hateful fringe movement into a mass one.",
          hi: "मोड़ आर्थिक विपत्ति थी। 1920 के दशक के मध्य तक वाइमर गणराज्य थोड़ा स्थिर हुआ था, और चीज़ें केवल कठिन थीं हताश नहीं, तो नात्सियों जैसा उग्रवादी दल केवल हाशिये को खींचता। फिर 1929 से महामंदी टूटी: विश्व-व्यापार ढहा, और जर्मनी में — जो विदेशी ऋणों पर टिका था — कारख़ाने बंद हुए और बेरोज़गारी लगभग साठ लाख चढ़ी। बचत पहले ही अति-मुद्रास्फीति ने मिटा दी थी, अतः अब परिवार बिना गद्दी बिना स्पष्ट आशा भूख का सामना करते। उस हताशा में लोकतांत्रिक सरकार असहाय दिखी: मुख्यधारा दल झगड़ते, मितव्ययिता आज़माते, और पीड़ित को कुछ न देते लगे। हिटलर ने असहायता का उलटा दिया। उसके भाषण रोज़गार, वर्साय के अपमान के बाद राष्ट्रीय गर्व की बहाली, और — विषैले रूप से — एक बलि का बकरा वादा करते, जर्मनी की मुसीबतों का दोष यहूदियों और 'नवंबर के अपराधियों' पर मढ़ते ताकि आम जर्मन स्वयं को या संकट की जटिलता को दोष न दें। डरी, बेरोज़गार जनता को, निर्णायक क़दम का वादा करता आत्मविश्वासी बलवान एक दाँव था जो अनेक लगाने को तैयार थे, और नात्सी समर्थन चुनाव-दर-चुनाव उभरा जब तक वे सबसे बड़ा दल न बने। सबक़ भयावह है: आर्थिक पतन और लोकतंत्र में खोया विश्वास, अचानक समृद्धि नहीं, वही जो एक घृणित हाशिया-आंदोलन को जन-आंदोलन बनाते।",
          mr: "वळण आर्थिक आपत्ती होती. 1920 च्या दशकाच्या मध्यापर्यंत वायमर प्रजासत्ताक थोडे स्थिर झाले होते, आणि गोष्टी फक्त कठीण होत्या हताश नव्हे, तर नाझींसारखा टोकाचा पक्ष फक्त कडेला खेचे. मग 1929 पासून महामंदी कोसळली: जागतिक व्यापार ढासळला, आणि जर्मनीत — जे परकीय कर्जांवर टेकले होते — कारखाने बंद झाले आणि बेरोजगारी सुमारे साठ लाख चढली. बचत आधीच अति-चलनवाढीने पुसली होती, म्हणून आता कुटुंबे उशीविना स्पष्ट आशेविना भुकेला सामोरे जात. त्या हताशेत लोकशाही सरकार हतबल दिसले: मुख्य प्रवाहातले पक्ष भांडत, काटकसर आजमावत, आणि दुःखितांना काही देत नाहीत असे वाटले. हिटलरने हतबलतेचे उलट दिले. त्याची भाषणे रोजगार, व्हर्सायच्या अपमानानंतर राष्ट्रीय अभिमानाची पुनर्स्थापना, आणि — विषारीपणे — एक बळीचा बकरा वचन देत, जर्मनीच्या संकटांचा दोष ज्यू आणि 'नोव्हेंबरच्या गुन्हेगारां'वर टाकत जेणेकरून सामान्य जर्मनांना स्वतःला वा संकटाच्या गुंतागुंतीला दोष द्यावा लागू नये. भ्यालेल्या, बेरोजगार जनतेला, निर्णायक कृतीचे वचन देणारा आत्मविश्वासी बलदंड एक पैज होती जी अनेक लावायला तयार होते, आणि नाझी पाठिंबा निवडणुकीमागून निवडणूक उसळला जोवर ते सर्वांत मोठा पक्ष बनले. धडा भयंकर आहे: आर्थिक पतन आणि लोकशाहीवरील गमावलेला विश्वास, अचानक समृद्धी नव्हे, तेच ज्यांनी एका द्वेषपूर्ण कडेच्या चळवळीला जन-चळवळ बनवले.",
        },
      },
      {
        level: 6,
        stem: {
          en: "Hitler became Chancellor in January 1933 through legal, constitutional means — yet within months Germany was a one-party dictatorship with no free press, no opposition and no free elections. How did a functioning democracy dismantle itself so fast, and largely by law?",
          hi: "हिटलर जनवरी 1933 में क़ानूनी, संवैधानिक तरीक़ों से चांसलर बना — फिर भी महीनों में जर्मनी बिना मुक्त प्रेस, बिना विपक्ष, बिना मुक्त चुनाव एक-दलीय तानाशाही बन गया। एक चलता लोकतंत्र इतनी तेज़ी से, और बड़े पैमाने पर क़ानून से, स्वयं को कैसे ध्वस्त कर गया?",
          mr: "हिटलर जानेवारी 1933 मध्ये कायदेशीर, घटनात्मक मार्गांनी चॅन्सेलर झाला — तरी काही महिन्यांत जर्मनी मुक्त वृत्तपत्रांविना, विरोधाविना, मुक्त निवडणुकांविना एक-पक्षीय हुकूमशाही बनला. एक चालणारी लोकशाही इतक्या वेगाने, आणि बहुतांश कायद्याने, स्वतःला कशी उद्ध्वस्त करून गेली?",
        },
        choices: [
          {
            en: "Hitler used the constitution's own emergency powers and a compliant parliament: the Reichstag fire became a pretext to suspend civil rights and jail opponents, then the Enabling Act let him make laws without parliament — so each step looked legal even as it destroyed the democracy that permitted it",
            hi: "हिटलर ने संविधान की अपनी आपात-शक्तियों और एक अनुगत संसद का उपयोग किया: राइख़्स्टाग-अग्नि नागरिक अधिकार निलंबित करने और विरोधी जेल भेजने का बहाना बनी, फिर सक्षमकारी अधिनियम ने उसे संसद बिना क़ानून बनाने दिया — अतः हर क़दम क़ानूनी दिखा भले ही उसने उस लोकतंत्र को नष्ट किया जिसने उसे अनुमति दी",
            mr: "हिटलरने संविधानाच्या स्वतःच्या आणीबाणी-शक्ती आणि एक आज्ञाधारक संसद वापरली: राइकस्टाग-आग नागरी हक्क निलंबित करायला आणि विरोधकांना तुरुंगात टाकायला निमित्त बनली, मग सक्षमीकरण कायद्याने त्याला संसदेविना कायदे करू दिले — म्हणून प्रत्येक पाऊल कायदेशीर दिसले जरी त्याने ती लोकशाही नष्ट केली जिने त्याला परवानगी दिली",
          },
          {
            en: "The people held a referendum specifically asking for a dictatorship, and it passed unanimously",
            hi: "जनता ने विशेष रूप से तानाशाही माँगता जनमत-संग्रह किया, और वह सर्वसम्मति से पारित हुआ",
            mr: "जनतेने विशेषतः हुकूमशाही मागणारा सार्वमत घेतला, आणि तो एकमताने मंजूर झाला",
          },
          {
            en: "A foreign power invaded and abolished the German parliament",
            hi: "एक विदेशी शक्ति ने आक्रमण कर जर्मन संसद समाप्त की",
            mr: "एका परकीय शक्तीने आक्रमण करून जर्मन संसद रद्द केली",
          },
          {
            en: "Nothing legal was involved; Hitler simply seized power in a violent overnight coup",
            hi: "कुछ भी क़ानूनी शामिल नहीं; हिटलर ने बस एक हिंसक रातोंरात तख़्ता-पलट में शक्ति छीनी",
            mr: "काहीही कायदेशीर सामील नव्हते; हिटलरने फक्त एका हिंसक रातोरात उठावात शक्ती हिसकावली",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The frightening answer is that Hitler dismantled democracy largely by using democracy's own machinery, so that each move wore a mask of legality. He was appointed Chancellor lawfully in January 1933 by the president, heading a coalition, with limited power on paper. What let him break out was a chain of legal-looking steps exploiting the Weimar constitution's weaknesses. When the Reichstag (parliament) building burned in February 1933, the Nazis blamed communists and used it as a pretext: the president, using an emergency article of the constitution, signed a decree suspending civil rights — free speech, free press, freedom from arbitrary arrest — allowing the regime to jail and intimidate its opponents, especially the communists and socialists, before the next election. Then came the decisive stroke: the Enabling Act of March 1933, passed by a Reichstag from which many opponents had been arrested or barred and the rest pressured, which handed Hitler's cabinet the power to make laws on its own, without parliament and even against the constitution. From that point the forms of law could be used to abolish other parties, bring the press and courts to heel, and merge state power into the Nazi party — all technically 'legal', because the body that could have said no had voted away its own authority. This is the chapter's darkest lesson: a democracy does not always fall to tanks in the street. It can be hollowed out from within, step by lawful-looking step, by leaders who use its rules, its fears and its emergencies to strangle the very freedoms that put them in office — which is exactly why constitutional safeguards, a free press and an independent judiciary matter most precisely when a crisis makes them inconvenient.",
          hi: "भयावह उत्तर यह कि हिटलर ने लोकतंत्र को बड़े पैमाने पर लोकतंत्र की अपनी मशीनरी से ध्वस्त किया, ताकि हर चाल क़ानूनी मुखौटा पहने। वह जनवरी 1933 में राष्ट्रपति द्वारा वैध रूप से चांसलर नियुक्त हुआ, एक गठबंधन का नेतृत्व करते, काग़ज़ पर सीमित शक्ति से। उसे निकलने दिया वाइमर संविधान की कमज़ोरियों का दोहन करते क़ानूनी-दिखते क़दमों की श्रृंखला ने। जब फ़रवरी 1933 में राइख़्स्टाग (संसद) भवन जला, नात्सियों ने कम्युनिस्टों को दोषी ठहराया और उसे बहाना बनाया: राष्ट्रपति ने, संविधान के एक आपात-अनुच्छेद से, नागरिक अधिकार — वाक्-स्वतंत्रता, मुक्त प्रेस, मनमानी गिरफ़्तारी से मुक्ति — निलंबित करता अध्यादेश हस्ताक्षरित किया, शासन को अगले चुनाव से पहले विरोधियों, ख़ासकर कम्युनिस्ट-समाजवादियों, को जेल भेजने-डराने देते। फिर आया निर्णायक प्रहार: मार्च 1933 का सक्षमकारी अधिनियम, ऐसी राइख़्स्टाग से पारित जिससे अनेक विरोधी गिरफ़्तार या वर्जित थे और बाक़ी दबाए गए, जिसने हिटलर के मंत्रिमंडल को स्वयं, संसद बिना और संविधान के विरुद्ध भी, क़ानून बनाने की शक्ति सौंपी। उस बिंदु से क़ानून के रूप अन्य दल समाप्त करने, प्रेस-अदालतों को झुकाने, और राज्य-शक्ति को नात्सी दल में विलीन करने को प्रयुक्त हो सकते — सब तकनीकी रूप से 'क़ानूनी', क्योंकि जो निकाय ना कह सकता था उसने अपना अधिकार मत देकर गँवा दिया। यह अध्याय का सबसे अँधेरा सबक़: लोकतंत्र सदा सड़क के टैंकों से नहीं गिरता। यह भीतर से खोखला हो सकता, क़ानूनी-दिखते क़दम-दर-क़दम, उन नेताओं द्वारा जो उसके नियम, भय और आपात उन्हीं स्वतंत्रताओं का गला घोंटने प्रयोग करते जिन्होंने उन्हें पद दिया — ठीक इसीलिए संवैधानिक सुरक्षा, मुक्त प्रेस और स्वतंत्र न्यायपालिका तभी सबसे अधिक मायने रखते जब संकट उन्हें असुविधाजनक बनाए।",
          mr: "भयंकर उत्तर हे की हिटलरने लोकशाही बहुतांश लोकशाहीच्याच यंत्रणेने उद्ध्वस्त केली, जेणेकरून प्रत्येक चाल कायदेशीर मुखवटा घाली. तो जानेवारी 1933 मध्ये राष्ट्रपतींनी कायदेशीररीत्या चॅन्सेलर नियुक्त झाला, एका आघाडीचे नेतृत्व करत, कागदावर मर्यादित शक्तीने. त्याला बाहेर पडू दिले वायमर संविधानाच्या कमजोरींचा फायदा घेणाऱ्या कायदेशीर-दिसणाऱ्या पावलांच्या साखळीने. जेव्हा फेब्रुवारी 1933 मध्ये राइकस्टाग (संसद) इमारत जळली, नाझींनी कम्युनिस्टांना दोष दिला आणि तिला निमित्त बनवले: राष्ट्रपतींनी, संविधानाच्या एका आणीबाणी-अनुच्छेदाने, नागरी हक्क — भाषण-स्वातंत्र्य, मुक्त वृत्तपत्रे, मनमानी अटकेतून मुक्ती — निलंबित करणारा अध्यादेश सही केला, राजवटीला पुढच्या निवडणुकीआधी विरोधकांना, विशेषतः कम्युनिस्ट-समाजवाद्यांना, तुरुंगात टाकायला-घाबरवायला देत. मग आला निर्णायक प्रहार: मार्च 1933 चा सक्षमीकरण कायदा, अशा राइकस्टागकडून मंजूर जिच्यातून अनेक विरोधक अटक वा बंदी होते आणि बाकीचे दबले गेले, ज्याने हिटलरच्या मंत्रिमंडळाला स्वतः, संसदेविना आणि संविधानाविरुद्धही, कायदे करण्याची शक्ती सोपवली. त्या बिंदूपासून कायद्याचे रूप इतर पक्ष रद्द करायला, वृत्तपत्रे-न्यायालये वाकवायला, आणि राज्य-शक्ती नाझी पक्षात विलीन करायला वापरता येत — सारे तांत्रिकदृष्ट्या 'कायदेशीर', कारण जो निकाय नाही म्हणू शकत होता त्याने आपला अधिकार मत देऊन गमावला. हा प्रकरणाचा सर्वांत अंधारा धडा: लोकशाही नेहमी रस्त्यावरच्या रणगाड्यांनी पडत नाही. ती आतून पोकळ होऊ शकते, कायदेशीर-दिसणाऱ्या पावला-पावलाने, त्या नेत्यांकडून जे तिचे नियम, भीती आणि आणीबाणी त्याच स्वातंत्र्यांचा गळा घोटायला वापरतात ज्यांनी त्यांना पद दिले — नेमके म्हणूनच घटनात्मक सुरक्षा, मुक्त वृत्तपत्रे आणि स्वतंत्र न्यायव्यवस्था तेव्हाच सर्वांत महत्त्वाची जेव्हा संकट त्यांना गैरसोयीचे बनवते.",
        },
      },
    ],
  },
];
