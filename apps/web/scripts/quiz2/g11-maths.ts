/**
 * Class 11 Maths — NCERT, chapter by chapter, and the first maths family where
 * the subject stops being about numbers and starts being about the objects
 * numbers are made of.
 *
 * The shape is the one every maths chapter in this bank uses: fourteen
 * questions authored one at a time, three at level 1 down to two at level 6,
 * every answer proven by a `checkExpr` the verifier evaluates, and every wrong
 * option a mistake a real seventeen-year-old makes — the union counted twice,
 * the discriminant taken as b² − 4c, the greatest integer less than 4 given as
 * 4, the modulus of a complex number added instead of squared.
 *
 * What is new at this level is that a question can be about a COUNT of things
 * rather than a measurement: how many subsets, how many relations, how many
 * one-one functions, how many integers satisfy an inequality. Those are still
 * computations and still provable, which is why they belong here rather than in
 * the conceptual engine — but they are the first questions in the bank whose
 * answer is a fact about a structure instead of about a quantity.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { OutQuestion, TopicFileOut } from "./engine";
import { rng } from "./engine";
import { numQ, unit } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Mathematics (Class 11)";
const LICENCE = "CC-BY-SA-4.0";

function topic(
  meta: Omit<TopicFileOut, "questions" | "source" | "licence">,
  questions: OutQuestion[],
): TopicFileOut {
  return { ...meta, source: SOURCE, licence: LICENCE, questions };
}

/* ------------------------------------------------------------------------- */
/* Chapter 1 — Sets (counting the members of a collection)                   */
/* ------------------------------------------------------------------------- */
function sets11(): TopicFileOut {
  const rand = rng("maths-11-sets");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A set has 3 elements. How many subsets does it have altogether?",
          hi: "किसी समुच्चय में 3 अवयव हैं। उसके कुल कितने उपसमुच्चय हैं?",
          mr: "एका संचात 3 घटक आहेत. त्याचे एकूण किती उपसंच आहेत?",
        },
        answer: 8,
        wrong: [6, 3, 9],
        checkExpr: "2*2*2",
        solution: {
          en: "Each element is either in a subset or out of it, so there are two choices per element and 2 × 2 × 2 = 8 subsets in all. That count includes the empty set and the whole set itself, both of which are subsets. (6 doubles the number of elements instead of raising 2 to that power.)",
          hi: "हर अवयव या तो किसी उपसमुच्चय में है या बाहर, अतः प्रति अवयव दो विकल्प और कुल 2 × 2 × 2 = 8 उपसमुच्चय। उस गिनती में रिक्त समुच्चय और स्वयं पूरा समुच्चय दोनों शामिल हैं, और दोनों उपसमुच्चय हैं। (6 अवयवों की संख्या दोगुनी कर देता है, 2 को उस घात तक उठाने के बजाय।)",
          mr: "प्रत्येक घटक एकतर एखाद्या उपसंचात असतो किंवा बाहेर, म्हणून प्रति घटक दोन पर्याय आणि एकूण 2 × 2 × 2 = 8 उपसंच. त्या मोजणीत रिक्त संच आणि स्वतः अख्खा संच दोन्ही समाविष्ट, आणि दोन्ही उपसंच आहेत. (6 घटकांची संख्या दुप्पट करते, 2 ला त्या घातापर्यंत नेण्याऐवजी.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A set has 4 elements. How many PROPER subsets does it have?",
          hi: "किसी समुच्चय में 4 अवयव हैं। उसके कितने उचित उपसमुच्चय हैं?",
          mr: "एका संचात 4 घटक आहेत. त्याचे किती उचित उपसंच आहेत?",
        },
        answer: 15,
        wrong: [16, 8, 14],
        checkExpr: "2*2*2*2-1",
        solution: {
          en: "There are 2 × 2 × 2 × 2 = 16 subsets in all, and a proper subset is any one of them except the set itself, so 16 − 1 = 15. The empty set is still counted, because it is a proper subset of every non-empty set. (16 forgets to remove the set itself; 14 removes the empty set as well, which the definition does not.)",
          hi: "कुल 2 × 2 × 2 × 2 = 16 उपसमुच्चय हैं, और उचित उपसमुच्चय उनमें से स्वयं समुच्चय को छोड़कर कोई भी है, अतः 16 − 1 = 15. रिक्त समुच्चय फिर भी गिना जाता है, क्योंकि वह हर अरिक्त समुच्चय का उचित उपसमुच्चय है। (16 स्वयं समुच्चय हटाना भूल जाता है; 14 रिक्त समुच्चय भी हटा देता है, जो परिभाषा नहीं कहती।)",
          mr: "एकूण 2 × 2 × 2 × 2 = 16 उपसंच आहेत, आणि उचित उपसंच म्हणजे त्यांपैकी स्वतः संच वगळता कोणताही, म्हणून 16 − 1 = 15. रिक्त संच तरीही मोजला जातो, कारण तो प्रत्येक अरिक्त संचाचा उचित उपसंच आहे. (16 स्वतः संच काढणे विसरते; 14 रिक्त संचही काढते, जे व्याख्या सांगत नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "n(A) = 4, n(B) = 3 and n(A ∩ B) = 2. What is n(A ∪ B)?",
          hi: "n(A) = 4, n(B) = 3 और n(A ∩ B) = 2. n(A ∪ B) क्या है?",
          mr: "n(A) = 4, n(B) = 3 आणि n(A ∩ B) = 2. n(A ∪ B) किती?",
        },
        answer: 5,
        wrong: [7, 9, 2],
        checkExpr: "4+3-2",
        solution: {
          en: "Adding 4 and 3 counts the two shared elements twice over, so one copy has to be taken back: 4 + 3 − 2 = 5. This subtraction is the whole reason the union formula exists, and forgetting it is the commonest mistake in the chapter. (7 adds the two sets and never removes the overlap.)",
          hi: "4 और 3 जोड़ने पर दोनों साझा अवयव दो बार गिने जाते हैं, अतः एक प्रति वापस लेनी पड़ती है: 4 + 3 − 2 = 5. यही घटाव सम्मिलन सूत्र के होने का पूरा कारण है, और उसे भूलना इस अध्याय की सबसे आम भूल है। (7 दोनों समुच्चय जोड़ देता है और अतिव्यापन कभी हटाता नहीं।)",
          mr: "4 आणि 3 जोडल्यावर दोन्ही सामायिक घटक दोनदा मोजले जातात, म्हणून एक प्रत परत घ्यावी लागते: 4 + 3 − 2 = 5. हीच वजाबाकी संयोग सूत्र असण्याचे अख्खे कारण, आणि ती विसरणे ही या प्रकरणातली सर्वांत सामान्य चूक. (7 दोन्ही संच जोडते आणि आच्छादन कधीच काढत नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "In a class of 40 pupils, 25 like tea and 20 like coffee, and 10 like both. How many like at least one of the two?",
          hi: "40 विद्यार्थियों की कक्षा में 25 को चाय पसंद है और 20 को कॉफ़ी, और 10 को दोनों। कितनों को दोनों में से कम से कम एक पसंद है?",
          mr: "40 विद्यार्थ्यांच्या वर्गात 25 जणांना चहा आवडतो आणि 20 जणांना कॉफी, आणि 10 जणांना दोन्ही. किती जणांना दोघांपैकी किमान एक आवडतो?",
        },
        answer: 35,
        wrong: [45, 55, 15],
        checkExpr: "25+20-10",
        solution: {
          en: "At least one means the union: 25 + 20 − 10 = 35. Notice that the class size of 40 is not needed here — it is only needed for the next question, which asks about the ones left out. (45 adds the two groups and counts the ten who like both twice.)",
          hi: "कम से कम एक का अर्थ है सम्मिलन: 25 + 20 − 10 = 35. ध्यान दो कि 40 की कक्षा-संख्या यहाँ चाहिए ही नहीं — वह केवल अगले प्रश्न के लिए चाहिए, जो बचे हुओं के बारे में पूछता है। (45 दोनों समूह जोड़ देता है और दोनों पसंद करने वाले दस को दो बार गिनता है।)",
          mr: "किमान एक म्हणजे संयोग: 25 + 20 − 10 = 35. लक्षात घ्या की 40 ची वर्गसंख्या इथे लागतच नाही — ती केवळ पुढच्या प्रश्नासाठी लागते, जो उरलेल्यांबद्दल विचारतो. (45 दोन्ही गट जोडते आणि दोन्ही आवडणाऱ्या दहांना दोनदा मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "In the same class of 40, with 25 liking tea, 20 liking coffee and 10 liking both, how many like neither?",
          hi: "उसी 40 की कक्षा में, जहाँ 25 को चाय, 20 को कॉफ़ी और 10 को दोनों पसंद हैं, कितनों को इनमें से कुछ भी पसंद नहीं?",
          mr: "त्याच 40 च्या वर्गात, जिथे 25 जणांना चहा, 20 जणांना कॉफी आणि 10 जणांना दोन्ही आवडतात, किती जणांना यांपैकी काहीच आवडत नाही?",
        },
        answer: 5,
        wrong: [10, 15, 0],
        checkExpr: "40-(25+20-10)",
        solution: {
          en: "Take the union away from the whole class: 40 − (25 + 20 − 10) = 40 − 35 = 5. In set language these five are the complement of A ∪ B, and the fact that the answer came out positive is a check on the data — if it had come out negative, the numbers could not all be true at once. (10 subtracts only the tea drinkers' overlap.)",
          hi: "पूरी कक्षा में से सम्मिलन घटाओ: 40 − (25 + 20 − 10) = 40 − 35 = 5. समुच्चय की भाषा में ये पाँच A ∪ B के पूरक हैं, और उत्तर का धनात्मक निकलना आँकड़ों की जाँच है — यदि ऋणात्मक निकलता तो सारी संख्याएँ एक साथ सच नहीं हो सकतीं। (10 केवल चाय वालों का अतिव्यापन घटा देता है।)",
          mr: "अख्ख्या वर्गातून संयोग वजा करा: 40 − (25 + 20 − 10) = 40 − 35 = 5. संचाच्या भाषेत हे पाच म्हणजे A ∪ B चे पूरक, आणि उत्तर धन निघणे ही आकडेवारीची तपासणी — ऋण निघाले असते तर सर्व संख्या एकाच वेळी खऱ्या असू शकल्या नसत्या. (10 केवळ चहा घेणाऱ्यांचे आच्छादन वजा करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A has 5 elements, B has 8, and every element of A is also in B. What is n(A ∪ B)?",
          hi: "A में 5 अवयव हैं, B में 8, और A का हर अवयव B में भी है। n(A ∪ B) क्या है?",
          mr: "A मध्ये 5 घटक आहेत, B मध्ये 8, आणि A चा प्रत्येक घटक B मध्येही आहे. n(A ∪ B) किती?",
        },
        answer: 8,
        wrong: [13, 3, 5],
        checkExpr: "5+8-5",
        solution: {
          en: "If A is contained in B then the intersection IS A, so n(A ∩ B) = 5 and the union is 5 + 8 − 5 = 8. Put more plainly, adding a subset to its superset adds nothing new. The general lesson: before using the formula, ask what the intersection actually is — here it was given in words rather than as a number. (13 adds the two counts as though the sets were disjoint.)",
          hi: "यदि A, B में समाहित है तो प्रतिच्छेदन A ही है, अतः n(A ∩ B) = 5 और सम्मिलन 5 + 8 − 5 = 8. सीधे कहें तो किसी उपसमुच्चय को उसके अधिसमुच्चय में जोड़ने से कुछ नया नहीं जुड़ता। सामान्य सीख: सूत्र लगाने से पहले पूछो कि प्रतिच्छेदन वस्तुतः क्या है — यहाँ वह संख्या के रूप में नहीं, शब्दों में दिया गया था। (13 दोनों गिनतियाँ ऐसे जोड़ देता है मानो समुच्चय असंयुक्त हों।)",
          mr: "जर A हा B मध्ये सामावलेला असेल तर छेद हा A च आहे, म्हणून n(A ∩ B) = 5 आणि संयोग 5 + 8 − 5 = 8. सरळ सांगायचे तर एखादा उपसंच त्याच्या अधिसंचात जोडल्याने काहीही नवे जोडले जात नाही. सामान्य धडा: सूत्र लावण्याआधी विचारा की छेद प्रत्यक्षात काय आहे — इथे तो संख्येच्या रूपात नव्हे, शब्दांत दिला होता. (13 दोन्ही मोजण्या असे जोडते जणू संच विभक्त असावेत.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "A set A has 2 elements. How many elements does the power set of the power set of A have?",
          hi: "किसी समुच्चय A में 2 अवयव हैं। A के घात समुच्चय के घात समुच्चय में कितने अवयव हैं?",
          mr: "एका संच A मध्ये 2 घटक आहेत. A च्या घातसंचाच्या घातसंचात किती घटक आहेत?",
        },
        answer: 16,
        wrong: [4, 8, 32],
        checkExpr: "2*2*2*2",
        solution: {
          en: "Work outward one layer at a time. P(A) has 2 × 2 = 4 elements, and the power set of a 4-element set has 2 × 2 × 2 × 2 = 16. The trap is to double 4 rather than raise 2 to the fourth power — the count of subsets grows explosively, and by the next layer it would be over sixty-five thousand. (8 doubles the previous answer instead of exponentiating it.)",
          hi: "एक-एक परत बाहर की ओर चलो। P(A) में 2 × 2 = 4 अवयव हैं, और 4 अवयवों वाले समुच्चय के घात समुच्चय में 2 × 2 × 2 × 2 = 16. जाल यह है कि 4 को दोगुना कर दो, न कि 2 को चौथी घात तक उठाओ — उपसमुच्चयों की गिनती विस्फोटक ढंग से बढ़ती है, और अगली परत पर वह पैंसठ हज़ार से ऊपर होती। (8 पिछले उत्तर को दोगुना कर देता है, घात लगाने के बजाय।)",
          mr: "एकेक थर बाहेरच्या दिशेने चला. P(A) मध्ये 2 × 2 = 4 घटक आहेत, आणि 4 घटकांच्या संचाच्या घातसंचात 2 × 2 × 2 × 2 = 16. सापळा असा की 4 दुप्पट करावे, 2 ला चौथ्या घातापर्यंत नेण्याऐवजी — उपसंचांची मोजणी स्फोटकपणे वाढते, आणि पुढच्या थरावर ती पासष्ट हजारांहून वर गेली असती. (8 मागचे उत्तर दुप्पट करते, घात लावण्याऐवजी.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A = {x : x is a natural number, x < 10 and x is divisible by 3}. How many elements does A have?",
          hi: "A = {x : x प्राकृत संख्या है, x < 10 और x, 3 से विभाज्य है}. A में कितने अवयव हैं?",
          mr: "A = {x : x ही नैसर्गिक संख्या आहे, x < 10 आणि x हा 3 ने भाग जाणारा}. A मध्ये किती घटक आहेत?",
        },
        answer: 3,
        wrong: [4, 2, 9],
        checkExpr: "9/3",
        solution: {
          en: "The multiples of 3 below 10 are 3, 6 and 9, so 9/3 = 3 elements. The two things worth checking every time a set is given in this builder form are whether the bound is strict and whether zero counts: 10 itself is excluded because the condition says less than 10, and 0 is excluded because it is not a natural number. (4 counts 0 as a multiple of 3.)",
          hi: "10 से नीचे 3 के गुणज 3, 6 और 9 हैं, अतः 9/3 = 3 अवयव। जब भी समुच्चय इस निर्माण-रूप में दिया जाए तब हर बार दो बातें जाँचने योग्य हैं: सीमा कठोर है या नहीं और शून्य गिना जाएगा या नहीं: 10 स्वयं बाहर है क्योंकि शर्त 10 से कम कहती है, और 0 बाहर है क्योंकि वह प्राकृत संख्या नहीं। (4 शून्य को 3 का गुणज गिन लेता है।)",
          mr: "10 खालचे 3 चे पट 3, 6 आणि 9 आहेत, म्हणून 9/3 = 3 घटक. संच या बांधणी-रूपात दिला जातो तेव्हा प्रत्येक वेळी दोन गोष्टी तपासण्याजोग्या: मर्यादा कठोर आहे का आणि शून्य मोजायचे का: 10 स्वतः बाहेर आहे कारण अट 10 हून कमी म्हणते, आणि 0 बाहेर आहे कारण ती नैसर्गिक संख्या नाही. (4 शून्याला 3 चा पट मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Of 100 people surveyed, 60 read newspaper A, 50 read newspaper B and 30 read both. How many read EXACTLY ONE of the two?",
          hi: "सर्वेक्षण किए गए 100 लोगों में 60 समाचार-पत्र A पढ़ते हैं, 50 समाचार-पत्र B और 30 दोनों। कितने ठीक एक ही पढ़ते हैं?",
          mr: "सर्वेक्षण केलेल्या 100 लोकांपैकी 60 जण वृत्तपत्र A वाचतात, 50 जण वृत्तपत्र B आणि 30 जण दोन्ही. किती जण नेमके एकच वाचतात?",
        },
        answer: 50,
        wrong: [80, 30, 20],
        checkExpr: "60+50-2*30",
        solution: {
          en: "Exactly one is not the same as at least one. Those who read only A number 60 − 30 = 30 and those who read only B number 50 − 30 = 20, giving 50 — which is the union minus the overlap once more, so the thirty are removed TWICE in total: 60 + 50 − 2 × 30 = 50. (80 answers at least one, which removes the overlap only once.)",
          hi: "ठीक एक और कम से कम एक एक बात नहीं। केवल A पढ़ने वाले 60 − 30 = 30 और केवल B पढ़ने वाले 50 − 30 = 20, जिससे 50 — जो सम्मिलन में से अतिव्यापन एक बार और घटाना है, अतः वे तीस कुल मिलाकर दो बार हटते हैं: 60 + 50 − 2 × 30 = 50. (80 कम से कम एक का उत्तर देता है, जो अतिव्यापन केवल एक बार हटाता है।)",
          mr: "नेमके एक आणि किमान एक एकच गोष्ट नाही. केवळ A वाचणारे 60 − 30 = 30 आणि केवळ B वाचणारे 50 − 30 = 20, ज्यातून 50 — जे संयोगातून आच्छादन आणखी एकदा वजा करणे, म्हणून ते तीस एकूण दोनदा वजा होतात: 60 + 50 − 2 × 30 = 50. (80 किमान एकचे उत्तर देते, जे आच्छादन केवळ एकदा वजा करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "n(A) = 20, n(B) = 15, n(C) = 10, n(A ∩ B) = 5, n(B ∩ C) = 4, n(A ∩ C) = 3 and n(A ∩ B ∩ C) = 2. What is n(A ∪ B ∪ C)?",
          hi: "n(A) = 20, n(B) = 15, n(C) = 10, n(A ∩ B) = 5, n(B ∩ C) = 4, n(A ∩ C) = 3 और n(A ∩ B ∩ C) = 2. n(A ∪ B ∪ C) क्या है?",
          mr: "n(A) = 20, n(B) = 15, n(C) = 10, n(A ∩ B) = 5, n(B ∩ C) = 4, n(A ∩ C) = 3 आणि n(A ∩ B ∩ C) = 2. n(A ∪ B ∪ C) किती?",
        },
        answer: 35,
        wrong: [45, 33, 37],
        checkExpr: "20+15+10-5-4-3+2",
        solution: {
          en: "Add the three, take back each pairwise overlap, then put the triple overlap back: 20 + 15 + 10 − 5 − 4 − 3 + 2 = 35. The final addition looks arbitrary until you track one person in all three sets: they were counted three times by the additions and removed three times by the subtractions, leaving them out altogether, so one copy has to be restored. (33 subtracts the triple overlap instead of adding it back.)",
          hi: "तीनों जोड़ो, हर युग्म-अतिव्यापन वापस लो, फिर त्रिक अतिव्यापन लौटा दो: 20 + 15 + 10 − 5 − 4 − 3 + 2 = 35. अंतिम जोड़ मनमाना लगता है जब तक तुम तीनों समुच्चयों में आए एक व्यक्ति का पीछा न करो: उसे जोड़ों ने तीन बार गिना और घटावों ने तीन बार हटाया, जिससे वह पूरी तरह छूट गया, अतः एक प्रति लौटानी पड़ती है। (33 त्रिक अतिव्यापन लौटाने के बजाय घटा देता है।)",
          mr: "तिन्ही जोडा, प्रत्येक जोडी-आच्छादन परत घ्या, मग त्रिक आच्छादन परत घाला: 20 + 15 + 10 − 5 − 4 − 3 + 2 = 35. शेवटची बेरीज मनमानी वाटते जोवर तुम्ही तिन्ही संचांत आलेल्या एका व्यक्तीचा मागोवा घेत नाही: तिला बेरजांनी तीनदा मोजले आणि वजाबाकींनी तीनदा काढले, ज्याने ती पूर्णपणे सुटली, म्हणून एक प्रत परत आणावी लागते. (33 त्रिक आच्छादन परत घालण्याऐवजी वजा करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "In a group of 65 people, every person likes cricket or tennis or both. 40 like cricket and 10 like both. How many like tennis ONLY?",
          hi: "65 लोगों के समूह में हर व्यक्ति को क्रिकेट या टेनिस या दोनों पसंद हैं। 40 को क्रिकेट पसंद है और 10 को दोनों। कितनों को केवल टेनिस पसंद है?",
          mr: "65 लोकांच्या गटात प्रत्येकाला क्रिकेट किंवा टेनिस किंवा दोन्ही आवडतात. 40 जणांना क्रिकेट आवडते आणि 10 जणांना दोन्ही. किती जणांना फक्त टेनिस आवडते?",
        },
        answer: 25,
        wrong: [30, 35, 15],
        checkExpr: "65-40",
        solution: {
          en: "Because nobody is outside the union, everyone who does not like cricket must like tennis: 65 − 40 = 25 like tennis only. Note what the ten who like both are for — they are not needed for this answer, but they give the tennis total, which is 25 + 10 = 35. Reading the question as tennis ONLY rather than tennis altogether is the whole difficulty. (35 gives the total who like tennis, including those who also like cricket.)",
          hi: "चूँकि कोई सम्मिलन के बाहर नहीं, जिसे क्रिकेट पसंद नहीं उसे टेनिस पसंद होना ही चाहिए: 65 − 40 = 25 को केवल टेनिस पसंद है। ध्यान दो कि दोनों पसंद करने वाले दस किसलिए हैं — इस उत्तर के लिए वे चाहिए नहीं, पर वे टेनिस का कुल देते हैं, जो 25 + 10 = 35 है। प्रश्न को कुल टेनिस नहीं, केवल टेनिस पढ़ना ही पूरी कठिनाई है। (35 टेनिस पसंद करने वालों का कुल देता है, उन्हें मिलाकर जिन्हें क्रिकेट भी पसंद है।)",
          mr: "कोणीही संयोगाबाहेर नसल्याने, ज्याला क्रिकेट आवडत नाही त्याला टेनिस आवडलेच पाहिजे: 65 − 40 = 25 जणांना फक्त टेनिस आवडते. लक्षात घ्या की दोन्ही आवडणारे दहा कशासाठी आहेत — या उत्तरासाठी ते लागत नाहीत, पण ते टेनिसचे एकूण देतात, जे 25 + 10 = 35. प्रश्न एकूण टेनिस नव्हे, फक्त टेनिस वाचणे हीच अख्खी अडचण. (35 टेनिस आवडणाऱ्यांचे एकूण देते, ज्यांना क्रिकेटही आवडते त्यांच्यासह.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "In a class of 60, 30 play football and 25 play hockey, while 10 play neither. How many play both?",
          hi: "60 की कक्षा में 30 फ़ुटबॉल खेलते हैं और 25 हॉकी, जबकि 10 कोई भी नहीं खेलते। कितने दोनों खेलते हैं?",
          mr: "60 च्या वर्गात 30 जण फुटबॉल खेळतात आणि 25 जण हॉकी, तर 10 जण दोन्हीही खेळत नाहीत. किती जण दोन्ही खेळतात?",
        },
        answer: 5,
        wrong: [15, 10, 20],
        checkExpr: "30+25-(60-10)",
        solution: {
          en: "This runs the union formula backwards. The union is everyone except the ten who play neither, so n(A ∪ B) = 60 − 10 = 50. Then 30 + 25 − n(A ∩ B) = 50 gives n(A ∩ B) = 5. Whenever a question gives you the neither figure, it is really handing you the union in disguise — convert it first and the formula does the rest. (15 forgets the ten who play neither and works from a union of 60.)",
          hi: "यह सम्मिलन सूत्र को उलटा चलाना है। सम्मिलन है वे सब जो कोई भी न खेलने वाले दस को छोड़कर हैं, अतः n(A ∪ B) = 60 − 10 = 50. फिर 30 + 25 − n(A ∩ B) = 50 से n(A ∩ B) = 5. जब भी प्रश्न कोई भी नहीं का आँकड़ा दे, वह असल में भेस बदलकर सम्मिलन ही सौंप रहा है — पहले उसे बदलो और बाक़ी सूत्र कर देता है। (15 कोई भी न खेलने वाले दस को भूलकर 60 के सम्मिलन से चलता है।)",
          mr: "हे संयोग सूत्र उलटे चालवणे आहे. संयोग म्हणजे दोन्हीही न खेळणाऱ्या दहा वगळता सर्वजण, म्हणून n(A ∪ B) = 60 − 10 = 50. मग 30 + 25 − n(A ∩ B) = 50 यातून n(A ∩ B) = 5. जेव्हा जेव्हा प्रश्न दोन्हीही नाही असा आकडा देतो, तो प्रत्यक्षात वेष बदलून संयोगच सोपवत असतो — आधी त्याचे रूपांतर करा आणि बाकी सूत्र करते. (15 दोन्हीही न खेळणारे दहा विसरून 60 च्या संयोगातून चालते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "In a town of 10000 families, 3500 take newspaper A, 2500 take newspaper B and 1200 take both. How many families take neither?",
          hi: "10000 परिवारों के नगर में 3500 समाचार-पत्र A लेते हैं, 2500 समाचार-पत्र B और 1200 दोनों। कितने परिवार कोई भी नहीं लेते?",
          mr: "10000 कुटुंबांच्या गावात 3500 कुटुंबे वृत्तपत्र A घेतात, 2500 कुटुंबे वृत्तपत्र B आणि 1200 दोन्ही. किती कुटुंबे एकही घेत नाहीत?",
        },
        answer: 5200,
        wrong: [4800, 5800, 4000],
        checkExpr: "10000-(3500+2500-1200)",
        solution: {
          en: "The union is 3500 + 2500 − 1200 = 4800, so the families outside it number 10000 − 4800 = 5200. The size of the numbers changes nothing about the method, which is the point of putting a large one here: the same two steps that handled a class of forty handle a town of ten thousand. It is worth sanity-checking the result — more than half the town takes no paper at all, which is entirely plausible and would not have been if the answer had come out above 10000. (4800 answers the union rather than its complement.)",
          hi: "सम्मिलन 3500 + 2500 − 1200 = 4800 है, अतः उसके बाहर के परिवार 10000 − 4800 = 5200. संख्याओं का बड़ा होना तरीक़े में कुछ नहीं बदलता, और यहाँ बड़ी संख्या रखने का प्रयोजन यही है: चालीस की कक्षा जिन दो चरणों से निपटी उन्हीं से दस हज़ार का नगर निपटता है। परिणाम की समझ-जाँच करने योग्य है — नगर का आधे से अधिक कोई पत्र नहीं लेता, जो पूरी तरह संभव है और तब न होता जब उत्तर 10000 से ऊपर निकलता। (4800 पूरक के बजाय सम्मिलन का उत्तर देता है।)",
          mr: "संयोग 3500 + 2500 − 1200 = 4800 आहे, म्हणून त्याबाहेरची कुटुंबे 10000 − 4800 = 5200. संख्या मोठ्या असणे पद्धतीत काहीच बदलत नाही, आणि इथे मोठी संख्या ठेवण्याचा हेतू हाच: चाळीसच्या वर्गाला ज्या दोन पायऱ्यांनी हाताळले त्याच दहा हजारांच्या गावाला हाताळतात. निकालाची समजून-तपासणी करण्याजोगी — गावातली निम्म्याहून अधिक कुटुंबे कोणतेच वृत्तपत्र घेत नाहीत, जे पूर्णपणे संभवनीय आहे आणि उत्तर 10000 हून वर निघाले असते तर नसते. (4800 पूरकाऐवजी संयोगाचे उत्तर देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Of 200 students, 120 take maths, 90 take physics and 70 take chemistry; 40 take maths and physics, 30 take physics and chemistry, 50 take maths and chemistry, and 20 take all three. How many take none of the three?",
          hi: "200 विद्यार्थियों में 120 गणित लेते हैं, 90 भौतिकी और 70 रसायन; 40 गणित और भौतिकी, 30 भौतिकी और रसायन, 50 गणित और रसायन, तथा 20 तीनों लेते हैं। कितने तीनों में से कोई नहीं लेते?",
          mr: "200 विद्यार्थ्यांपैकी 120 जण गणित घेतात, 90 जण भौतिकी आणि 70 जण रसायन; 40 जण गणित आणि भौतिकी, 30 जण भौतिकी आणि रसायन, 50 जण गणित आणि रसायन, आणि 20 जण तिन्ही घेतात. किती जण तिन्हींपैकी एकही घेत नाहीत?",
        },
        answer: 20,
        wrong: [180, 30, 0],
        checkExpr: "200-(120+90+70-40-30-50+20)",
        solution: {
          en: "The three-set union is 120 + 90 + 70 − 40 − 30 − 50 + 20 = 180, so 200 − 180 = 20 take none. Two habits make this kind of question safe. First, keep the alternating pattern in order — add the singles, subtract the pairs, add the triple — because it is the only part that has to be memorised. Second, check the result against the data before writing it down: a union of 180 out of 200 leaves a positive remainder, whereas an arithmetic slip that pushed the union above 200 would be flagged immediately by an impossible negative. (180 answers the union instead of what is left outside it.)",
          hi: "तीन-समुच्चय सम्मिलन 120 + 90 + 70 − 40 − 30 − 50 + 20 = 180 है, अतः 200 − 180 = 20 कोई नहीं लेते। दो आदतें ऐसे प्रश्न को सुरक्षित बनाती हैं। पहली, बारी-बारी का क्रम बनाए रखो — इकाइयाँ जोड़ो, युग्म घटाओ, त्रिक जोड़ो — क्योंकि केवल यही हिस्सा याद रखना पड़ता है। दूसरी, लिखने से पहले परिणाम को आँकड़ों के सामने जाँचो: 200 में से 180 का सम्मिलन धनात्मक शेष छोड़ता है, जबकि गणित की जो चूक सम्मिलन को 200 से ऊपर ठेल देती वह असंभव ऋणात्मक बनकर तुरंत पकड़ी जाती। (180 बाहर बचे हुए के बजाय सम्मिलन का उत्तर देता है।)",
          mr: "तीन-संच संयोग 120 + 90 + 70 − 40 − 30 − 50 + 20 = 180 आहे, म्हणून 200 − 180 = 20 जण एकही घेत नाहीत. दोन सवयी असा प्रश्न सुरक्षित करतात. पहिली, आळीपाळीचा क्रम टिकवा — एकके जोडा, जोड्या वजा करा, त्रिक जोडा — कारण केवळ हाच भाग लक्षात ठेवावा लागतो. दुसरी, लिहिण्याआधी निकाल आकडेवारीसमोर तपासा: 200 पैकी 180 चा संयोग धन शिल्लक ठेवतो, तर गणिताची जी चूक संयोगाला 200 हून वर ढकलेल ती अशक्य ऋण बनून लगेच पकडली गेली असती. (180 बाहेर उरलेल्याऐवजी संयोगाचे उत्तर देते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-sets",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 1 — Sets",
      name: "Sets",
      summary:
        "A collection given a name and then counted: how many subsets a set of n members has, why the union has to subtract the overlap it counted twice, and how three overlapping surveys are added and subtracted back into one honest total.",
      position: 1,
      translations: {
        hi: {
          name: "समुच्चय",
          summary:
            "किसी संग्रह को नाम देकर फिर गिनना: n सदस्यों के समुच्चय के कितने उपसमुच्चय होते हैं, सम्मिलन को वह अतिव्यापन क्यों घटाना पड़ता है जिसे उसने दो बार गिना, और तीन अतिव्यापी सर्वेक्षण जोड़-घटाकर एक ईमानदार कुल कैसे बनते हैं।",
        },
        mr: {
          name: "संच",
          summary:
            "एखाद्या संग्रहाला नाव देऊन मग मोजणे: n सदस्यांच्या संचाचे किती उपसंच असतात, संयोगाला त्याने दोनदा मोजलेले आच्छादन का वजा करावे लागते, आणि तीन आच्छादित सर्वेक्षणे बेरीज-वजाबाकी करून एक प्रामाणिक एकूण कशी बनतात.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 2 — Relations and Functions (pairing, and rules that pair)        */
/* ------------------------------------------------------------------------- */
function relationsFunctions11(): TopicFileOut {
  const rand = rng("maths-11-relations-and-functions");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A has 3 elements and B has 4. How many elements does A × B have?",
          hi: "A में 3 अवयव हैं और B में 4. A × B में कितने अवयव हैं?",
          mr: "A मध्ये 3 घटक आहेत आणि B मध्ये 4. A × B मध्ये किती घटक आहेत?",
        },
        answer: 12,
        wrong: [7, 9, 16],
        checkExpr: "3*4",
        solution: {
          en: "Every element of A can be paired with every element of B, so the count is 3 × 4 = 12. Picture it as a grid with 3 rows and 4 columns and the multiplication becomes obvious. Note also that A × B and B × A have the same size but are not the same set, because (1, a) is not the pair (a, 1). (7 adds the two sizes instead of multiplying them.)",
          hi: "A का हर अवयव B के हर अवयव के साथ युग्म बना सकता है, अतः गिनती 3 × 4 = 12. इसे 3 पंक्तियों और 4 स्तंभों के जाल की तरह देखो और गुणा स्पष्ट हो जाता है। यह भी ध्यान दो कि A × B और B × A का आकार वही है पर वे एक ही समुच्चय नहीं, क्योंकि (1, a) युग्म (a, 1) नहीं है। (7 दोनों आकार गुणा करने के बजाय जोड़ देता है।)",
          mr: "A चा प्रत्येक घटक B च्या प्रत्येक घटकाशी जोडी बनवू शकतो, म्हणून मोजणी 3 × 4 = 12. याला 3 ओळी आणि 4 स्तंभांचे जाळे म्हणून पाहा आणि गुणाकार स्पष्ट होतो. हेही लक्षात घ्या की A × B आणि B × A यांचा आकार तोच पण ते एकच संच नाहीत, कारण (1, a) ही जोडी (a, 1) नाही. (7 दोन्ही आकार गुणण्याऐवजी जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A = {1, 2} and B = {3, 4, 5}. How many different relations are there from A to B?",
          hi: "A = {1, 2} और B = {3, 4, 5}. A से B तक कितने भिन्न संबंध हैं?",
          mr: "A = {1, 2} आणि B = {3, 4, 5}. A पासून B पर्यंत किती वेगवेगळे संबंध आहेत?",
        },
        answer: 64,
        wrong: [6, 32, 12],
        checkExpr: "2*2*2*2*2*2",
        solution: {
          en: "A relation from A to B is any subset of A × B, and A × B has 2 × 3 = 6 pairs. Each of those six pairs is either kept or dropped, giving 2 × 2 × 2 × 2 × 2 × 2 = 64 relations. The empty relation and the whole of A × B are both counted, because both are subsets. (6 gives the size of A × B rather than the number of its subsets.)",
          hi: "A से B तक कोई संबंध A × B का कोई भी उपसमुच्चय है, और A × B में 2 × 3 = 6 युग्म हैं। उन छह में से हर युग्म या तो रखा जाता है या छोड़ा, जिससे 2 × 2 × 2 × 2 × 2 × 2 = 64 संबंध। रिक्त संबंध और पूरा A × B दोनों गिने जाते हैं, क्योंकि दोनों उपसमुच्चय हैं। (6 A × B का आकार देता है, उसके उपसमुच्चयों की संख्या नहीं।)",
          mr: "A पासून B पर्यंतचा कोणताही संबंध म्हणजे A × B चा कोणताही उपसंच, आणि A × B मध्ये 2 × 3 = 6 जोड्या आहेत. त्या सहापैकी प्रत्येक जोडी एकतर ठेवली जाते वा सोडली, ज्यातून 2 × 2 × 2 × 2 × 2 × 2 = 64 संबंध. रिक्त संबंध आणि अख्खा A × B दोन्ही मोजले जातात, कारण दोन्ही उपसंच आहेत. (6 A × B चा आकार देते, त्याच्या उपसंचांची संख्या नव्हे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "If (x + 1, 5) = (3, y), what is x + y?",
          hi: "यदि (x + 1, 5) = (3, y), तो x + y क्या है?",
          mr: "जर (x + 1, 5) = (3, y), तर x + y किती?",
        },
        answer: 7,
        wrong: [8, 3, 2],
        checkExpr: "3-1+5",
        solution: {
          en: "Two ordered pairs are equal only when their first entries match and their second entries match, so x + 1 = 3 and 5 = y. That gives x = 2 and y = 5, so x + y = 7. The rule is worth stating out loud because it is what makes an ordered pair different from a set: {1, 2} equals {2, 1}, but (1, 2) does not equal (2, 1). (8 forgets to subtract the 1 and takes x as 3.)",
          hi: "दो क्रमित युग्म तभी बराबर हैं जब उनकी पहली प्रविष्टियाँ मेल खाएँ और दूसरी भी, अतः x + 1 = 3 और 5 = y. इससे x = 2 और y = 5, अतः x + y = 7. नियम को ज़ोर से कहने योग्य है क्योंकि वही क्रमित युग्म को समुच्चय से अलग करता है: {1, 2} बराबर है {2, 1} के, पर (1, 2) बराबर नहीं (2, 1) के। (8 1 घटाना भूलकर x को 3 मान लेता है।)",
          mr: "दोन क्रमित जोड्या तेव्हाच समान जेव्हा त्यांच्या पहिल्या नोंदी जुळतात आणि दुसऱ्याही, म्हणून x + 1 = 3 आणि 5 = y. यातून x = 2 आणि y = 5, म्हणून x + y = 7. नियम मोठ्याने सांगण्याजोगा कारण तोच क्रमित जोडीला संचापासून वेगळा करतो: {1, 2} बरोबर आहे {2, 1} शी, पण (1, 2) बरोबर नाही (2, 1) शी. (8 1 वजा करणे विसरून x ला 3 मानते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A has 4 elements and B has 3. How many functions are there from A to B?",
          hi: "A में 4 अवयव हैं और B में 3. A से B तक कितने फलन हैं?",
          mr: "A मध्ये 4 घटक आहेत आणि B मध्ये 3. A पासून B पर्यंत किती फलने आहेत?",
        },
        answer: 81,
        wrong: [12, 64, 7],
        checkExpr: "3*3*3*3",
        solution: {
          en: "A function must send each element of A to exactly one element of B, so there are 3 choices for each of the 4 elements: 3 × 3 × 3 × 3 = 81. Note which number goes upstairs — it is the size of the CODOMAIN raised to the size of the domain, not the other way round, because the choosing is done once per element of A. (64 raises 4 to the power 3, swapping the two.)",
          hi: "फलन को A के हर अवयव को B के ठीक एक अवयव पर भेजना पड़ता है, अतः 4 अवयवों में से हर एक के लिए 3 विकल्प: 3 × 3 × 3 × 3 = 81. ध्यान दो कि ऊपर कौन-सी संख्या जाती है — वह सहप्रांत का आकार है जो प्रांत के आकार की घात तक उठता है, उलटा नहीं, क्योंकि चुनाव A के प्रति अवयव एक बार होता है। (64 4 को 3 की घात तक उठाकर दोनों बदल देता है।)",
          mr: "फलनाला A च्या प्रत्येक घटकाला B च्या नेमक्या एका घटकावर पाठवावे लागते, म्हणून 4 घटकांपैकी प्रत्येकासाठी 3 पर्याय: 3 × 3 × 3 × 3 = 81. लक्षात घ्या की वर कोणती संख्या जाते — ती सहप्रांताचा आकार आहे जो प्रांताच्या आकाराच्या घातापर्यंत जातो, उलट नव्हे, कारण निवड A च्या प्रति घटक एकदा होते. (64 4 ला 3 च्या घातापर्यंत नेऊन दोन्ही बदलते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "If f(x) = 2x + 3, what is f(4)?",
          hi: "यदि f(x) = 2x + 3, तो f(4) क्या है?",
          mr: "जर f(x) = 2x + 3, तर f(4) किती?",
        },
        answer: 11,
        wrong: [14, 10, 5],
        checkExpr: "2*4+3",
        solution: {
          en: "Substitute 4 wherever x appears: 2 × 4 + 3 = 11. The order matters — multiply first, then add — and writing the substitution out rather than doing it in the head is what prevents the commonest slip here. (14 adds 3 to 4 first and then doubles, which is the rule for f(x) = 2(x + 3).)",
          hi: "जहाँ भी x आए वहाँ 4 रखो: 2 × 4 + 3 = 11. क्रम मायने रखता है — पहले गुणा, फिर जोड़ — और प्रतिस्थापन को मन में करने के बजाय लिखकर करना ही यहाँ की सबसे आम चूक रोकता है। (14 पहले 4 में 3 जोड़ता है और फिर दोगुना करता है, जो f(x) = 2(x + 3) का नियम है।)",
          mr: "जिथे जिथे x येईल तिथे 4 ठेवा: 2 × 4 + 3 = 11. क्रम महत्त्वाचा — आधी गुणाकार, मग बेरीज — आणि प्रतिस्थापन मनात करण्याऐवजी लिहून करणेच इथली सर्वांत सामान्य चूक टाळते. (14 आधी 4 मध्ये 3 जोडते आणि मग दुप्पट करते, जो f(x) = 2(x + 3) चा नियम आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "f(x) = x² − 1 with domain {−2, −1, 0, 1, 2}. How many DISTINCT values does the range contain?",
          hi: "f(x) = x² − 1 और प्रांत {−2, −1, 0, 1, 2}. परिसर में कितने भिन्न मान हैं?",
          mr: "f(x) = x² − 1 आणि प्रांत {−2, −1, 0, 1, 2}. परिसरात किती वेगळी मूल्ये आहेत?",
        },
        answer: 3,
        wrong: [5, 4, 2],
        checkExpr: "5-2",
        solution: {
          en: "The five inputs give 3, 0, −1, 0 and 3, and a range is a SET, so repeats are written once: {−1, 0, 3}, which is 3 values. Five inputs minus the two duplicates leaves 5 − 2 = 3. This is exactly why a function may be many-one: two different inputs are allowed to share an output, and only the reverse is forbidden. (5 counts one range value per input and forgets that a set does not repeat.)",
          hi: "पाँच निवेश 3, 0, −1, 0 और 3 देते हैं, और परिसर एक समुच्चय है, अतः दोहराव एक बार ही लिखे जाते हैं: {−1, 0, 3}, यानी 3 मान। पाँच निवेश में से दो दोहराव घटाकर 5 − 2 = 3 बचते हैं। ठीक इसीलिए फलन बहु-एक हो सकता है: दो भिन्न निवेशों को एक निर्गम साझा करने की छूट है, और केवल उलटा वर्जित है। (5 प्रति निवेश एक परिसर-मान गिन लेता है और भूल जाता है कि समुच्चय दोहराता नहीं।)",
          mr: "पाच आदाने 3, 0, −1, 0 आणि 3 देतात, आणि परिसर हा एक संच आहे, म्हणून पुनरावृत्ती एकदाच लिहिली जाते: {−1, 0, 3}, म्हणजे 3 मूल्ये. पाच आदानांतून दोन पुनरावृत्ती वजा करून 5 − 2 = 3 उरतात. नेमके म्हणूनच फलन बहु-एक असू शकते: दोन वेगळ्या आदानांना एक निर्गम वाटून घेण्याची मुभा आहे, आणि केवळ उलटे निषिद्ध. (5 प्रति आदान एक परिसर-मूल्य मोजते आणि संच पुनरावृत्ती करत नाही हे विसरते.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "f(x) = x² and g(x) = 2x + 1. What is (f + g)(3)?",
          hi: "f(x) = x² और g(x) = 2x + 1. (f + g)(3) क्या है?",
          mr: "f(x) = x² आणि g(x) = 2x + 1. (f + g)(3) किती?",
        },
        answer: 16,
        wrong: [10, 13, 22],
        checkExpr: "3*3+2*3+1",
        solution: {
          en: "The sum of two functions is defined pointwise: work out each at 3 and add. f(3) = 9, g(3) = 7, so (f + g)(3) = 16. Note what is NOT being asked — f(g(3)) would be f(7) = 49, and composing is a different operation from adding. (13 computes f(3) + 3 + 1, dropping the coefficient in g.)",
          hi: "दो फलनों का योग बिंदुवार परिभाषित है: हर एक का 3 पर मान निकालो और जोड़ो। f(3) = 9, g(3) = 7, अतः (f + g)(3) = 16. ध्यान दो कि क्या नहीं पूछा गया — f(g(3)) होता f(7) = 49, और संयोजन जोड़ से अलग संक्रिया है। (13 f(3) + 3 + 1 निकालता है, g का गुणांक छोड़कर।)",
          mr: "दोन फलनांची बेरीज बिंदूनिहाय व्याख्यायित आहे: प्रत्येकाचे 3 वरचे मूल्य काढा आणि जोडा. f(3) = 9, g(3) = 7, म्हणून (f + g)(3) = 16. लक्षात घ्या की काय विचारले नाही — f(g(3)) झाले असते f(7) = 49, आणि संयोजन ही बेरजेहून वेगळी क्रिया आहे. (13 f(3) + 3 + 1 काढते, g चा सहगुणक सोडून.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "f(x) = (x² − 9)/(x − 3). What is f(5)?",
          hi: "f(x) = (x² − 9)/(x − 3). f(5) क्या है?",
          mr: "f(x) = (x² − 9)/(x − 3). f(5) किती?",
        },
        answer: 8,
        wrong: [16, 2, 4],
        checkExpr: "(5*5-9)/(5-3)",
        solution: {
          en: "Substituting gives (25 − 9)/(5 − 3) = 16/2 = 8. It is worth noticing what the expression simplifies to: x² − 9 factorises as (x − 3)(x + 3), so f(x) = x + 3 for every x except 3, where the denominator is zero and the function is undefined. That single excluded point is the whole reason a domain has to be stated rather than assumed. (16 stops at the numerator and never divides.)",
          hi: "प्रतिस्थापन से (25 − 9)/(5 − 3) = 16/2 = 8. ध्यान देने योग्य है कि व्यंजक सरल होकर क्या बनता है: x² − 9 का गुणनखंड (x − 3)(x + 3) है, अतः 3 को छोड़कर हर x के लिए f(x) = x + 3, और 3 पर हर शून्य है और फलन अपरिभाषित। वही एक बहिष्कृत बिंदु पूरा कारण है कि प्रांत मान नहीं लिया जाता, बताया जाता है। (16 अंश पर रुक जाता है और भाग देता ही नहीं।)",
          mr: "प्रतिस्थापनाने (25 − 9)/(5 − 3) = 16/2 = 8. लक्षात घेण्याजोगे की पदावली सोपी होऊन काय बनते: x² − 9 चे अवयव (x − 3)(x + 3) आहेत, म्हणून 3 वगळता प्रत्येक x साठी f(x) = x + 3, आणि 3 वर छेद शून्य आहे आणि फलन अव्याख्यायित. तोच एक वगळलेला बिंदू अख्खे कारण की प्रांत गृहीत धरला जात नाही, सांगितला जातो. (16 अंशावर थांबते आणि भागाकार करतच नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "f(x) = 3x − 2 and f(a) = 13. What is a?",
          hi: "f(x) = 3x − 2 और f(a) = 13. a क्या है?",
          mr: "f(x) = 3x − 2 आणि f(a) = 13. a किती?",
        },
        answer: 5,
        wrong: [3, 11, 15],
        checkExpr: "(13+2)/3",
        solution: {
          en: "This runs the rule backwards. From 3a − 2 = 13 comes 3a = 15 and a = 5, or in one line a = (13 + 2)/3 = 5. Undoing operations in reverse order is the whole skill: the rule multiplied then subtracted, so the undoing adds then divides. (11 applies the rule forwards to 13 instead of reversing it.)",
          hi: "यह नियम को उलटा चलाना है। 3a − 2 = 13 से 3a = 15 और a = 5, या एक पंक्ति में a = (13 + 2)/3 = 5. संक्रियाओं को उलटे क्रम में खोलना ही पूरा कौशल है: नियम ने पहले गुणा किया फिर घटाया, अतः खोलना पहले जोड़ता है फिर भाग देता है। (11 उलटने के बजाय 13 पर नियम सीधा लगा देता है।)",
          mr: "हे नियम उलटा चालवणे आहे. 3a − 2 = 13 यातून 3a = 15 आणि a = 5, वा एका ओळीत a = (13 + 2)/3 = 5. क्रिया उलट्या क्रमाने सोडवणे हेच अख्खे कौशल्य: नियमाने आधी गुणले मग वजा केले, म्हणून सोडवणे आधी जोडते मग भागते. (11 उलटवण्याऐवजी 13 वर नियम सरळ लावते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "How many ONE-ONE functions are there from a set of 3 elements into a set of 4 elements?",
          hi: "3 अवयवों के समुच्चय से 4 अवयवों के समुच्चय में कितने एकैकी फलन हैं?",
          mr: "3 घटकांच्या संचातून 4 घटकांच्या संचात किती एकास-एक फलने आहेत?",
        },
        answer: 24,
        wrong: [12, 64, 81],
        checkExpr: "4*3*2",
        solution: {
          en: "One-one means no two inputs may share an output, so each choice uses up a target: 4 choices for the first element, 3 left for the second, 2 for the third — 4 × 3 × 2 = 24. Compare it with the count of ALL functions, which is 4 × 4 × 4 = 64, and the difference is exactly the ones that repeat a target. Note also that no one-one function could exist the other way round, from 4 elements into 3, because the fourth would have nowhere left to go. (64 counts every function and ignores the one-one condition.)",
          hi: "एकैकी का अर्थ है कि दो निवेश एक निर्गम साझा नहीं कर सकते, अतः हर चुनाव एक लक्ष्य खा जाता है: पहले अवयव के लिए 4 विकल्प, दूसरे के लिए बचे 3, तीसरे के लिए 2 — 4 × 3 × 2 = 24. इसकी तुलना सभी फलनों की गिनती से करो, जो 4 × 4 × 4 = 64 है, और अंतर ठीक वे हैं जो कोई लक्ष्य दोहराते हैं। यह भी ध्यान दो कि उलटी दिशा में, 4 अवयवों से 3 में, कोई एकैकी फलन हो ही नहीं सकता, क्योंकि चौथे के लिए जगह ही नहीं बचती। (64 हर फलन गिनता है और एकैकी शर्त अनदेखी कर देता है।)",
          mr: "एकास-एक म्हणजे दोन आदाने एक निर्गम वाटून घेऊ शकत नाहीत, म्हणून प्रत्येक निवड एक लक्ष्य संपवते: पहिल्या घटकासाठी 4 पर्याय, दुसऱ्यासाठी उरलेले 3, तिसऱ्यासाठी 2 — 4 × 3 × 2 = 24. याची तुलना सर्व फलनांच्या मोजणीशी करा, जी 4 × 4 × 4 = 64 आहे, आणि फरक नेमका तीच जी एखादे लक्ष्य पुन्हा वापरतात. हेही लक्षात घ्या की उलट दिशेने, 4 घटकांतून 3 मध्ये, कोणतेही एकास-एक फलन असूच शकत नाही, कारण चौथ्यासाठी जागाच उरत नाही. (64 प्रत्येक फलन मोजते आणि एकास-एक अट दुर्लक्षते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "f(x) = x² + 2x + 3. What is f(1) + f(−1)?",
          hi: "f(x) = x² + 2x + 3. f(1) + f(−1) क्या है?",
          mr: "f(x) = x² + 2x + 3. f(1) + f(−1) किती?",
        },
        answer: 8,
        wrong: [12, 4, 6],
        checkExpr: "(1+2+3)+(1-2+3)",
        solution: {
          en: "f(1) = 1 + 2 + 3 = 6 and f(−1) = 1 − 2 + 3 = 2, so the sum is 8. The square makes both x² terms positive while the linear term changes sign, which is why the two values differ by exactly twice the linear part. A useful check: adding f(x) and f(−x) always cancels every odd-powered term and doubles every even one, so here the answer had to be 2(1 + 3) = 8. (12 doubles f(1), assuming the two values are equal.)",
          hi: "f(1) = 1 + 2 + 3 = 6 और f(−1) = 1 − 2 + 3 = 2, अतः योग 8. वर्ग दोनों x² पदों को धनात्मक रखता है जबकि रैखिक पद चिह्न बदल देता है, इसीलिए दोनों मान ठीक रैखिक भाग के दुगुने से भिन्न हैं। एक उपयोगी जाँच: f(x) और f(−x) जोड़ने पर हर विषम-घात पद कट जाता है और हर सम-घात दोगुना हो जाता है, अतः यहाँ उत्तर 2(1 + 3) = 8 होना ही था। (12 f(1) को दोगुना कर देता है, यह मानकर कि दोनों मान बराबर हैं।)",
          mr: "f(1) = 1 + 2 + 3 = 6 आणि f(−1) = 1 − 2 + 3 = 2, म्हणून बेरीज 8. वर्ग दोन्ही x² पदे धन ठेवतो तर रेषीय पद चिन्ह बदलते, म्हणूनच दोन्ही मूल्ये नेमकी रेषीय भागाच्या दुपटीने वेगळी. एक उपयुक्त तपासणी: f(x) आणि f(−x) जोडल्यावर प्रत्येक विषम-घात पद छेदते आणि प्रत्येक सम-घात दुप्पट होते, म्हणून इथे उत्तर 2(1 + 3) = 8 असणारच होते. (12 f(1) दुप्पट करते, दोन्ही मूल्ये समान मानून.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A = {1, 2, 3} and R = {(1,1), (2,2), (3,3), (1,2), (2,1)} is a relation on A. How many more ordered pairs would have to be added to make R equal to A × A?",
          hi: "A = {1, 2, 3} और R = {(1,1), (2,2), (3,3), (1,2), (2,1)} A पर एक संबंध है। R को A × A के बराबर करने के लिए और कितने क्रमित युग्म जोड़ने पड़ेंगे?",
          mr: "A = {1, 2, 3} आणि R = {(1,1), (2,2), (3,3), (1,2), (2,1)} हा A वरचा एक संबंध आहे. R ला A × A बरोबर करण्यासाठी आणखी किती क्रमित जोड्या जोडाव्या लागतील?",
        },
        answer: 4,
        wrong: [5, 9, 3],
        checkExpr: "3*3-5",
        solution: {
          en: "A × A has 3 × 3 = 9 ordered pairs and R already holds 5, so 9 − 5 = 4 are missing — namely (1,3), (3,1), (2,3) and (3,2). The point of listing them is to see that A × A is the largest relation on A and the empty set is the smallest, with every other relation sitting somewhere between. (9 gives the size of A × A and forgets that five pairs are already there.)",
          hi: "A × A में 3 × 3 = 9 क्रमित युग्म हैं और R में पहले से 5, अतः 9 − 5 = 4 अनुपस्थित हैं — यानी (1,3), (3,1), (2,3) और (3,2). उन्हें गिनाने का प्रयोजन यह देखना है कि A × A, A पर सबसे बड़ा संबंध है और रिक्त समुच्चय सबसे छोटा, और बाक़ी हर संबंध कहीं बीच में बैठता है। (9 A × A का आकार देता है और भूल जाता है कि पाँच युग्म पहले से हैं।)",
          mr: "A × A मध्ये 3 × 3 = 9 क्रमित जोड्या आहेत आणि R मध्ये आधीच 5, म्हणून 9 − 5 = 4 गैरहजर आहेत — म्हणजे (1,3), (3,1), (2,3) आणि (3,2). त्यांची यादी करण्याचा हेतू हे पाहणे की A × A हा A वरचा सर्वांत मोठा संबंध आणि रिक्त संच सर्वांत लहान, आणि उरलेला प्रत्येक संबंध कुठेतरी मध्ये बसतो. (9 A × A चा आकार देते आणि पाच जोड्या आधीच आहेत हे विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A set A has 3 elements. How many different relations can be defined FROM A TO A?",
          hi: "किसी समुच्चय A में 3 अवयव हैं। A से A तक कितने भिन्न संबंध परिभाषित किए जा सकते हैं?",
          mr: "एका संच A मध्ये 3 घटक आहेत. A पासून A पर्यंत किती वेगवेगळे संबंध व्याख्यायित करता येतील?",
        },
        answer: 512,
        wrong: [64, 9, 81],
        checkExpr: "2*2*2*2*2*2*2*2*2",
        solution: {
          en: "A × A has 3 × 3 = 9 ordered pairs, and a relation is any subset of those nine, so the count is 2 raised to the ninth power: 512. Two levels of counting are stacked here, and getting them in the right order is the whole question — first count the pairs by multiplying, then count the subsets by exponentiating. It is worth feeling how fast this grows: a set of four elements gives 16 pairs and 65536 relations, and a set of five gives over thirty million. (9 stops after counting the pairs.)",
          hi: "A × A में 3 × 3 = 9 क्रमित युग्म हैं, और संबंध उन नौ का कोई भी उपसमुच्चय है, अतः गिनती 2 की नौवीं घात है: 512. यहाँ गिनती की दो परतें एक पर एक रखी हैं, और उन्हें सही क्रम में लेना ही पूरा प्रश्न है — पहले गुणा करके युग्म गिनो, फिर घात लगाकर उपसमुच्चय। यह महसूस करने योग्य है कि यह कितनी तेज़ी से बढ़ता है: चार अवयवों का समुच्चय 16 युग्म और 65536 संबंध देता है, और पाँच का तीन करोड़ से ऊपर। (9 युग्म गिनकर रुक जाता है।)",
          mr: "A × A मध्ये 3 × 3 = 9 क्रमित जोड्या आहेत, आणि संबंध म्हणजे त्या नऊंचा कोणताही उपसंच, म्हणून मोजणी 2 ची नववी घात: 512. इथे मोजणीचे दोन थर एकावर एक ठेवले आहेत, आणि ते योग्य क्रमाने घेणे हाच अख्खा प्रश्न — आधी गुणून जोड्या मोजा, मग घात लावून उपसंच. हे जाणवण्याजोगे की हे किती वेगाने वाढते: चार घटकांचा संच 16 जोड्या आणि 65536 संबंध देतो, आणि पाचचा तीन कोटींहून वर. (9 जोड्या मोजून थांबते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "f(x) = (x − 1)/(x + 1). What is f(f(2))?",
          hi: "f(x) = (x − 1)/(x + 1). f(f(2)) क्या है?",
          mr: "f(x) = (x − 1)/(x + 1). f(f(2)) किती?",
        },
        answer: -0.5,
        wrong: [0.5, 2, -2],
        checkExpr: "((2-1)/(2+1)-1)/((2-1)/(2+1)+1)",
        solution: {
          en: "Work from the inside out. f(2) = 1/3. Then f(1/3) = (1/3 − 1)/(1/3 + 1) = (−2/3)/(4/3) = −1/2 = −0.5. Two habits keep this clean: never simplify the outer call before the inner one has a number, and clear the fractions by multiplying top and bottom by 3 rather than wrestling with them. There is a pattern hiding here worth chasing — apply f twice more and you return to 2, so this function has period four under composition. (0.5 loses the minus sign when dividing a negative by a positive.)",
          hi: "भीतर से बाहर चलो। f(2) = 1/3. फिर f(1/3) = (1/3 − 1)/(1/3 + 1) = (−2/3)/(4/3) = −1/2 = −0.5. दो आदतें इसे साफ़ रखती हैं: भीतरी आह्वान को संख्या मिलने से पहले बाहरी को कभी सरल मत करो, और भिन्नों से जूझने के बजाय ऊपर-नीचे 3 से गुणा करके उन्हें साफ़ कर दो। यहाँ एक ढर्रा छिपा है जिसका पीछा करने योग्य है — f को दो बार और लगाओ और तुम 2 पर लौट आते हो, अतः संयोजन के अंतर्गत इस फलन का आवर्तकाल चार है। (0.5 ऋण को धन से भाग देते समय ऋण चिह्न खो देता है।)",
          mr: "आतून बाहेर चला. f(2) = 1/3. मग f(1/3) = (1/3 − 1)/(1/3 + 1) = (−2/3)/(4/3) = −1/2 = −0.5. दोन सवयी हे स्वच्छ ठेवतात: आतल्या आवाहनाला संख्या मिळण्याआधी बाहेरचे कधीही सोपे करू नका, आणि अपूर्णांकांशी झगडण्याऐवजी वर-खाली 3 ने गुणून ते साफ करा. इथे एक साचा दडलेला आहे ज्याचा मागोवा घेण्याजोगा — f आणखी दोनदा लावा आणि तुम्ही 2 वर परतता, म्हणून संयोजनाखाली या फलनाचा आवर्तकाल चार आहे. (0.5 ऋणाला धनाने भागताना ऋण चिन्ह गमावते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-relations-and-functions",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 2 — Relations and Functions",
      name: "Relations and Functions",
      summary:
        "Every possible pairing of two sets laid out as a grid, every relation a choice of which cells to keep, and a function the special case where each row is allowed exactly one — which is why the relations are counted with powers of two and the functions are not.",
      position: 2,
      translations: {
        hi: {
          name: "संबंध एवं फलन",
          summary:
            "दो समुच्चयों के हर संभव युग्म को एक जाल की तरह बिछाना, हर संबंध यह चुनाव कि कौन-से ख़ाने रखने हैं, और फलन वह विशेष स्थिति जहाँ हर पंक्ति को ठीक एक की अनुमति है — इसीलिए संबंध दो की घातों से गिने जाते हैं और फलन नहीं।",
        },
        mr: {
          name: "संबंध आणि फलने",
          summary:
            "दोन संचांच्या प्रत्येक शक्य जोडीला जाळ्यासारखे मांडणे, प्रत्येक संबंध म्हणजे कोणते कप्पे ठेवायचे ही निवड, आणि फलन ही ती खास स्थिती जिथे प्रत्येक ओळीला नेमके एकच परवानगी — म्हणूनच संबंध दोनच्या घातांनी मोजले जातात आणि फलने नाहीत.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 3 — Trigonometric Functions (angles off the triangle)             */
/* ------------------------------------------------------------------------- */
function trigFunctions11(): TopicFileOut {
  const rand = rng("maths-11-trigonometric-functions");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many degrees is an angle of π/3 radians?",
          hi: "π/3 रेडियन का कोण कितने डिग्री का है?",
          mr: "π/3 रेडियनचा कोन किती अंशांचा आहे?",
        },
        answer: 60,
        wrong: [30, 45, 90],
        checkExpr: "180/3",
        solution: {
          en: "π radians is a straight angle, which is 180 degrees, so π/3 is 180/3 = 60 degrees. That one equivalence converts every angle in the chapter in either direction — multiply by 180/π to reach degrees, by π/180 to reach radians. (30 halves the answer, which is π/6.)",
          hi: "π रेडियन ऋजु कोण है, जो 180 डिग्री का है, अतः π/3 है 180/3 = 60 डिग्री। वही एक तुल्यता अध्याय के हर कोण को दोनों दिशाओं में बदल देती है — डिग्री तक पहुँचने को 180/π से गुणा, रेडियन तक पहुँचने को π/180 से। (30 उत्तर आधा कर देता है, जो π/6 है।)",
          mr: "π रेडियन हा सरळ कोन आहे, जो 180 अंशांचा, म्हणून π/3 म्हणजे 180/3 = 60 अंश. तीच एक समतुल्यता प्रकरणातला प्रत्येक कोन दोन्ही दिशांना बदलते — अंशांपर्यंत जाण्यास 180/π ने गुणा, रेडियनपर्यंत जाण्यास π/180 ने. (30 उत्तर निम्मे करते, जे π/6 आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many degrees is an angle of 2π/5 radians?",
          hi: "2π/5 रेडियन का कोण कितने डिग्री का है?",
          mr: "2π/5 रेडियनचा कोन किती अंशांचा आहे?",
        },
        answer: 72,
        wrong: [36, 144, 60],
        checkExpr: "2*180/5",
        solution: {
          en: "Replace π by 180: 2 × 180/5 = 360/5 = 72 degrees. Keeping the numerator and denominator apart until the end avoids the usual slip of dividing before multiplying. The angle is worth recognising — 72 degrees is a fifth of a full turn, the angle at the centre of a regular pentagon. (36 divides 180 by 5 and forgets the 2 on top.)",
          hi: "π की जगह 180 रखो: 2 × 180/5 = 360/5 = 72 डिग्री। अंश और हर को अंत तक अलग रखना उस आम चूक से बचाता है जिसमें गुणा से पहले भाग दे दिया जाता है। कोण पहचानने योग्य है — 72 डिग्री पूरे चक्कर का पाँचवाँ भाग है, समपंचभुज के केंद्र पर बना कोण। (36 180 को 5 से भाग देकर ऊपर का 2 भूल जाता है।)",
          mr: "π च्या जागी 180 ठेवा: 2 × 180/5 = 360/5 = 72 अंश. अंश आणि छेद शेवटपर्यंत वेगळे ठेवणे त्या सामान्य चुकीपासून वाचवते जिच्यात गुणाकाराआधी भागाकार केला जातो. कोन ओळखण्याजोगा — 72 अंश हा पूर्ण फेऱ्याचा पाचवा भाग, समपंचकोनाच्या केंद्रावरचा कोन. (36 180 ला 5 ने भागून वरचा 2 विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the value of tan 45° + cot 45°?",
          hi: "tan 45° + cot 45° का मान क्या है?",
          mr: "tan 45° + cot 45° चे मूल्य किती?",
        },
        answer: 2,
        wrong: [1, 0, 4],
        checkExpr: "1+1",
        solution: {
          en: "At 45 degrees the opposite and adjacent sides are equal, so tan 45° = 1, and cot is its reciprocal, which is also 1. The sum is 1 + 1 = 2. The reason both come out to 1 at exactly this angle is worth holding: it is the only acute angle at which a right-angled triangle is isosceles. (1 gives just one of the two terms.)",
          hi: "45 डिग्री पर सम्मुख और संलग्न भुजाएँ बराबर हैं, अतः tan 45° = 1, और cot उसका व्युत्क्रम है, जो भी 1 है। योग 1 + 1 = 2. ठीक इसी कोण पर दोनों का 1 निकलना पकड़ने योग्य है: यही इकलौता न्यून कोण है जिस पर समकोण त्रिभुज समद्विबाहु होता है। (1 दोनों में से केवल एक पद देता है।)",
          mr: "45 अंशांवर समोरची आणि लगतची बाजू समान असतात, म्हणून tan 45° = 1, आणि cot हा त्याचा व्यस्त, जोही 1 आहे. बेरीज 1 + 1 = 2. नेमक्या याच कोनावर दोन्हींचे 1 निघणे धरून ठेवण्याजोगे: हाच एकमेव लघुकोन ज्यावर काटकोन त्रिकोण समद्विभुज असतो. (1 दोघांपैकी केवळ एक पद देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the period of the function sin x, measured in degrees?",
          hi: "फलन sin x का आवर्तकाल डिग्री में कितना है?",
          mr: "फलन sin x चा आवर्तकाल अंशांत किती?",
        },
        answer: 360,
        wrong: [180, 90, 720],
        checkExpr: "180*2",
        solution: {
          en: "The sine is defined by a point going round a circle, and the point returns to where it started after one full turn: 180 × 2 = 360 degrees, or 2π radians. Note that a period is the SMALLEST such repeat — 720 degrees also returns the value, which is why 720 is wrong rather than merely unusual. (180 gives the period of tan x instead.)",
          hi: "ज्या को वृत्त पर घूमते एक बिंदु से परिभाषित किया जाता है, और बिंदु एक पूरे चक्कर के बाद वहीं लौट आता है जहाँ से चला था: 180 × 2 = 360 डिग्री, या 2π रेडियन। ध्यान दो कि आवर्तकाल सबसे छोटा ऐसा दोहराव है — 720 डिग्री पर भी मान लौटता है, इसीलिए 720 केवल असामान्य नहीं, ग़लत है। (180 इसके बदले tan x का आवर्तकाल दे देता है।)",
          mr: "ज्या ही वर्तुळावर फिरणाऱ्या एका बिंदूने व्याख्यायित होते, आणि बिंदू एका पूर्ण फेऱ्यानंतर जिथून निघाला तिथेच परततो: 180 × 2 = 360 अंश, वा 2π रेडियन. लक्षात घ्या की आवर्तकाल म्हणजे सर्वांत लहान अशी पुनरावृत्ती — 720 अंशांवरही मूल्य परतते, म्हणूनच 720 केवळ असामान्य नव्हे, चुकीचे आहे. (180 त्याऐवजी tan x चा आवर्तकाल देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the period of the function tan x, measured in degrees?",
          hi: "फलन tan x का आवर्तकाल डिग्री में कितना है?",
          mr: "फलन tan x चा आवर्तकाल अंशांत किती?",
        },
        answer: 180,
        wrong: [360, 90, 45],
        checkExpr: "360/2",
        solution: {
          en: "Tangent is sine over cosine, and both change sign together after half a turn, so the ratio is unchanged: 360/2 = 180 degrees. This is why tan repeats twice as often as sin and cos, and why its graph has a break every 180 degrees where cosine is zero. (360 assumes every trigonometric function shares the sine's period.)",
          hi: "स्पर्शज्या ज्या बटा कोज्या है, और आधे चक्कर के बाद दोनों साथ-साथ चिह्न बदलते हैं, अतः अनुपात वही रहता है: 360/2 = 180 डिग्री। इसीलिए tan, sin और cos से दुगुनी बार दोहराता है, और इसीलिए उसके आलेख में हर 180 डिग्री पर एक टूट है जहाँ कोज्या शून्य है। (360 मान लेता है कि हर त्रिकोणमितीय फलन का आवर्तकाल ज्या जैसा है।)",
          mr: "स्पर्शिका ही ज्या भागिले कोज्या आहे, आणि अर्ध्या फेऱ्यानंतर दोन्ही एकत्रच चिन्ह बदलतात, म्हणून गुणोत्तर तेच राहते: 360/2 = 180 अंश. म्हणूनच tan हा sin आणि cos हून दुप्पट वेळा पुनरावृत्त होतो, आणि म्हणूनच त्याच्या आलेखात दर 180 अंशांवर एक तुटलेपण आहे जिथे कोज्या शून्य आहे. (360 गृहीत धरते की प्रत्येक त्रिकोणमितीय फलनाचा आवर्तकाल ज्येसारखा आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the maximum value of 3 sin x + 4?",
          hi: "3 sin x + 4 का अधिकतम मान क्या है?",
          mr: "3 sin x + 4 चे कमाल मूल्य किती?",
        },
        answer: 7,
        wrong: [4, 3, 1],
        checkExpr: "3+4",
        solution: {
          en: "The sine never exceeds 1 and never falls below −1, so 3 sin x runs from −3 to 3 and the whole expression from 1 to 7. The maximum is 3 + 4 = 7, reached when sin x = 1. Every question of this shape reduces to the same two steps: scale the bounds by the coefficient, then shift them by the constant. (1 gives the minimum instead of the maximum.)",
          hi: "ज्या कभी 1 से ऊपर नहीं जाती और कभी −1 से नीचे नहीं, अतः 3 sin x −3 से 3 तक चलता है और पूरा व्यंजक 1 से 7 तक। अधिकतम 3 + 4 = 7 है, जो sin x = 1 पर मिलता है। इस आकार का हर प्रश्न उन्हीं दो चरणों पर सिमट जाता है: सीमाओं को गुणांक से बढ़ाओ, फिर उन्हें अचर से खिसकाओ। (1 अधिकतम के बजाय न्यूनतम देता है।)",
          mr: "ज्या कधीच 1 हून वर जात नाही आणि कधीच −1 हून खाली नाही, म्हणून 3 sin x −3 पासून 3 पर्यंत चालतो आणि अख्खी पदावली 1 पासून 7 पर्यंत. कमाल 3 + 4 = 7 आहे, जे sin x = 1 वर मिळते. या आकाराचा प्रत्येक प्रश्न त्याच दोन पायऱ्यांवर येतो: मर्यादा सहगुणकाने वाढवा, मग त्या स्थिरांकाने सरकवा. (1 कमालऐवजी किमान देते.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the maximum value of 5 sin x − 12 cos x?",
          hi: "5 sin x − 12 cos x का अधिकतम मान क्या है?",
          mr: "5 sin x − 12 cos x चे कमाल मूल्य किती?",
        },
        answer: 13,
        wrong: [17, 7, 12],
        checkExpr: "(25+144)/13",
        solution: {
          en: "An expression a sin x + b cos x can always be rewritten as a single sine wave of amplitude √(a² + b²), so the largest value it reaches is √(25 + 144) = √169 = 13. The minus sign changes nothing, because b is squared. The trap is to add the coefficients: 5 + 12 = 17 is impossible, since the two terms peak at different angles and can never both be at their maximum together. (17 adds the coefficients as though both peaked at once.)",
          hi: "व्यंजक a sin x + b cos x को सदा √(a² + b²) आयाम की एक ही ज्या-तरंग के रूप में फिर से लिखा जा सकता है, अतः उसका सबसे बड़ा मान √(25 + 144) = √169 = 13. ऋण चिह्न कुछ नहीं बदलता, क्योंकि b का वर्ग होता है। जाल है गुणांक जोड़ देना: 5 + 12 = 17 असंभव है, क्योंकि दोनों पद भिन्न कोणों पर शिखर छूते हैं और दोनों एक साथ कभी अपने अधिकतम पर नहीं हो सकते। (17 गुणांक ऐसे जोड़ देता है मानो दोनों एक साथ शिखर छूते हों।)",
          mr: "पदावली a sin x + b cos x नेहमी √(a² + b²) मोठेपणाच्या एकाच ज्या-लहरीच्या रूपात पुन्हा लिहिता येते, म्हणून तिचे सर्वांत मोठे मूल्य √(25 + 144) = √169 = 13. ऋण चिन्ह काहीच बदलत नाही, कारण b चा वर्ग होतो. सापळा म्हणजे सहगुणक जोडणे: 5 + 12 = 17 अशक्य आहे, कारण दोन्ही पदे वेगवेगळ्या कोनांवर शिखर गाठतात आणि दोन्ही एकाच वेळी कधीच आपल्या कमालवर असू शकत नाहीत. (17 सहगुणक असे जोडते जणू दोन्ही एकाच वेळी शिखर गाठत असावेत.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "If sin θ = 3/5, what is the value of 25 cos²θ?",
          hi: "यदि sin θ = 3/5, तो 25 cos²θ का मान क्या है?",
          mr: "जर sin θ = 3/5, तर 25 cos²θ चे मूल्य किती?",
        },
        answer: 16,
        wrong: [9, 25, 4],
        checkExpr: "25-9",
        solution: {
          en: "From sin²θ + cos²θ = 1 comes cos²θ = 1 − 9/25 = 16/25, so 25 cos²θ = 16. Multiplying the identity through by 25 first is quicker still: 25 sin²θ + 25 cos²θ = 25, and 25 sin²θ = 9, leaving 25 − 9 = 16. Notice that the question deliberately asks for the SQUARE, which sidesteps the ambiguity of sign — cos θ itself could be 4/5 or −4/5 depending on the quadrant. (9 answers 25 sin²θ instead.)",
          hi: "sin²θ + cos²θ = 1 से cos²θ = 1 − 9/25 = 16/25, अतः 25 cos²θ = 16. सर्वसमिका को पहले 25 से गुणा करना और भी तेज़ है: 25 sin²θ + 25 cos²θ = 25, और 25 sin²θ = 9, अतः 25 − 9 = 16 बचता है। ध्यान दो कि प्रश्न जानबूझकर वर्ग माँगता है, जो चिह्न की द्विअर्थता टाल देता है — cos θ स्वयं चतुर्थांश के अनुसार 4/5 या −4/5 हो सकता है। (9 इसके बदले 25 sin²θ का उत्तर देता है।)",
          mr: "sin²θ + cos²θ = 1 यातून cos²θ = 1 − 9/25 = 16/25, म्हणून 25 cos²θ = 16. नित्यसमीकरण आधी 25 ने गुणणे आणखी वेगवान: 25 sin²θ + 25 cos²θ = 25, आणि 25 sin²θ = 9, म्हणून 25 − 9 = 16 उरते. लक्षात घ्या की प्रश्न मुद्दाम वर्ग विचारतो, जे चिन्हाची द्विअर्थता टाळते — cos θ स्वतः चतुर्थांशानुसार 4/5 वा −4/5 असू शकतो. (9 त्याऐवजी 25 sin²θ चे उत्तर देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "In a circle of radius 7 cm, an arc subtends an angle of 2 radians at the centre. How long is the arc?",
          hi: "7 cm त्रिज्या के वृत्त में एक चाप केंद्र पर 2 रेडियन का कोण बनाता है। चाप कितना लंबा है?",
          mr: "7 cm त्रिज्येच्या वर्तुळात एक कमान केंद्रावर 2 रेडियनचा कोन करते. कमान किती लांब आहे?",
        },
        answer: 14,
        wrong: [3.5, 49, 28],
        checkExpr: "7*2",
        solution: {
          en: "Arc length is radius times angle in radians: 7 × 2 = 14 cm. This is the whole reason radians exist as a unit — the formula has no conversion factor in it, whereas in degrees it would need a π/180. The definition follows from the same equation: one radian is exactly the angle whose arc equals the radius. (3.5 divides instead of multiplying.)",
          hi: "चाप की लंबाई त्रिज्या गुणा रेडियन में कोण है: 7 × 2 = 14 cm. रेडियन के मात्रक के रूप में होने का पूरा कारण यही है — सूत्र में कोई रूपांतरण गुणक है ही नहीं, जबकि डिग्री में π/180 चाहिए होता। परिभाषा उसी समीकरण से निकलती है: एक रेडियन ठीक वह कोण है जिसका चाप त्रिज्या के बराबर हो। (3.5 गुणा करने के बजाय भाग दे देता है।)",
          mr: "कमानीची लांबी म्हणजे त्रिज्या गुणिले रेडियनमधला कोन: 7 × 2 = 14 cm. रेडियन हे एकक असण्याचे अख्खे कारण हेच — सूत्रात कोणताही रूपांतर गुणक नाहीच, तर अंशांत π/180 लागला असता. व्याख्या त्याच समीकरणातून निघते: एक रेडियन म्हणजे नेमका तो कोन ज्याची कमान त्रिज्येइतकी असेल. (3.5 गुणण्याऐवजी भागते.)",
        },
        fmt: unit("cm"),
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A wheel makes 60 revolutions per minute. Through how many degrees does it turn in one second?",
          hi: "कोई पहिया प्रति मिनट 60 चक्कर लगाता है। एक सेकंड में वह कितने डिग्री घूमता है?",
          mr: "एक चाक प्रति मिनिट 60 फेऱ्या मारते. एका सेकंदात ते किती अंश फिरते?",
        },
        answer: 360,
        wrong: [60, 3600, 6],
        checkExpr: "60*360/60",
        solution: {
          en: "Sixty revolutions in sixty seconds is one revolution per second, and one revolution is 360 degrees: 60 × 360/60 = 360. Watch the units rather than the numbers and the cancellation does itself — revolutions per minute, times degrees per revolution, divided by seconds per minute, leaves degrees per second. (60 quotes the revolutions and forgets to convert them to degrees.)",
          hi: "साठ सेकंड में साठ चक्कर यानी प्रति सेकंड एक चक्कर, और एक चक्कर 360 डिग्री का: 60 × 360/60 = 360. संख्याओं के बजाय मात्रकों पर नज़र रखो और कटाई अपने आप हो जाती है — चक्कर प्रति मिनट, गुणा डिग्री प्रति चक्कर, बटा सेकंड प्रति मिनट, बचा डिग्री प्रति सेकंड। (60 चक्कर बता देता है और उन्हें डिग्री में बदलना भूल जाता है।)",
          mr: "साठ सेकंदांत साठ फेऱ्या म्हणजे प्रति सेकंद एक फेरी, आणि एक फेरी 360 अंशांची: 60 × 360/60 = 360. संख्यांऐवजी एककांवर लक्ष ठेवा आणि छेदन आपोआप होते — फेऱ्या प्रति मिनिट, गुणिले अंश प्रति फेरी, भागिले सेकंद प्रति मिनिट, उरते अंश प्रति सेकंद. (60 फेऱ्या सांगते आणि त्यांना अंशांत बदलणे विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A and B are acute angles with sin A = 3/5 and cos B = 5/13. What is the value of 65 sin(A + B)?",
          hi: "A और B न्यून कोण हैं जिनमें sin A = 3/5 और cos B = 5/13. 65 sin(A + B) का मान क्या है?",
          mr: "A आणि B हे लघुकोन असून sin A = 3/5 आणि cos B = 5/13. 65 sin(A + B) चे मूल्य किती?",
        },
        answer: 63,
        wrong: [33, 56, 16],
        checkExpr: "3*5+4*12",
        solution: {
          en: "Fill in the missing ratios first: since A is acute, cos A = 4/5, and since B is acute, sin B = 12/13. Then sin(A + B) = sin A cos B + cos A sin B = 15/65 + 48/65 = 63/65, so 65 sin(A + B) = 3 × 5 + 4 × 12 = 63. The question multiplies by 65 precisely so that the answer is a whole number and the two products stay visible. Note that both angles had to be acute for the missing ratios to be positive — that phrase in the question is doing real work. (56 uses sin A sin B + cos A cos B, which is the formula for cos(A − B).)",
          hi: "पहले लुप्त अनुपात भरो: चूँकि A न्यून है, cos A = 4/5, और चूँकि B न्यून है, sin B = 12/13. फिर sin(A + B) = sin A cos B + cos A sin B = 15/65 + 48/65 = 63/65, अतः 65 sin(A + B) = 3 × 5 + 4 × 12 = 63. प्रश्न 65 से गुणा ठीक इसलिए करता है कि उत्तर पूर्ण संख्या रहे और दोनों गुणनफल दिखते रहें। ध्यान दो कि लुप्त अनुपात धनात्मक होने के लिए दोनों कोणों का न्यून होना ज़रूरी था — प्रश्न का वह वाक्यांश असली काम कर रहा है। (56 sin A sin B + cos A cos B लगाता है, जो cos(A − B) का सूत्र है।)",
          mr: "आधी हरवलेली गुणोत्तरे भरा: A लघुकोन असल्याने cos A = 4/5, आणि B लघुकोन असल्याने sin B = 12/13. मग sin(A + B) = sin A cos B + cos A sin B = 15/65 + 48/65 = 63/65, म्हणून 65 sin(A + B) = 3 × 5 + 4 × 12 = 63. प्रश्न 65 ने गुणतो नेमके यासाठी की उत्तर पूर्ण संख्या राहावे आणि दोन्ही गुणाकार दिसत राहावेत. लक्षात घ्या की हरवलेली गुणोत्तरे धन असण्यासाठी दोन्ही कोन लघुकोन असणे आवश्यक होते — प्रश्नातला तो वाक्यांश खरे काम करतो आहे. (56 sin A sin B + cos A cos B लावते, जे cos(A − B) चे सूत्र आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "If cos θ = 3/5, what is the value of cos 2θ?",
          hi: "यदि cos θ = 3/5, तो cos 2θ का मान क्या है?",
          mr: "जर cos θ = 3/5, तर cos 2θ चे मूल्य किती?",
        },
        answer: -0.28,
        wrong: [0.28, 0.6, -0.6],
        checkExpr: "2*(3/5)*(3/5)-1",
        solution: {
          en: "Use the form of the double-angle identity that needs only the cosine: cos 2θ = 2cos²θ − 1 = 2 × 9/25 − 1 = 18/25 − 1 = −7/25 = −0.28. Choosing that form rather than cos²θ − sin²θ saves finding sin θ at all, and it also sidesteps the sign ambiguity, since only the square appears. The negative result is worth pausing on: doubling an angle whose cosine is positive can easily carry it past 90 degrees into the second quadrant. (0.6 doubles the value of cos θ, which is what the notation invites and never what it means.)",
          hi: "द्विकोण सर्वसमिका का वह रूप लो जिसे केवल कोज्या चाहिए: cos 2θ = 2cos²θ − 1 = 2 × 9/25 − 1 = 18/25 − 1 = −7/25 = −0.28. cos²θ − sin²θ के बजाय वह रूप चुनना sin θ निकालने से पूरी तरह बचा लेता है, और चिह्न की द्विअर्थता भी टाल देता है, क्योंकि केवल वर्ग आता है। ऋणात्मक परिणाम पर ठहरने योग्य है: जिस कोण की कोज्या धनात्मक है उसे दोगुना करने पर वह आसानी से 90 डिग्री पार करके दूसरे चतुर्थांश में जा सकता है। (0.6 cos θ का मान दोगुना कर देता है, जिसका निमंत्रण संकेतन देता है और अर्थ कभी नहीं।)",
          mr: "द्विकोन नित्यसमीकरणाचे ते रूप घ्या ज्याला केवळ कोज्या लागते: cos 2θ = 2cos²θ − 1 = 2 × 9/25 − 1 = 18/25 − 1 = −7/25 = −0.28. cos²θ − sin²θ ऐवजी ते रूप निवडणे sin θ काढण्यापासून पूर्ण वाचवते, आणि चिन्हाची द्विअर्थताही टाळते, कारण केवळ वर्ग येतो. ऋण निकालावर थांबण्याजोगे: ज्या कोनाची कोज्या धन आहे तो दुप्पट केल्यावर तो सहज 90 अंश ओलांडून दुसऱ्या चतुर्थांशात जाऊ शकतो. (0.6 cos θ चे मूल्य दुप्पट करते, ज्याचे निमंत्रण संकेतन देते आणि अर्थ कधीच नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "The angles of a triangle are in the ratio 1 : 2 : 3. How many degrees is the largest angle?",
          hi: "किसी त्रिभुज के कोण 1 : 2 : 3 के अनुपात में हैं। सबसे बड़ा कोण कितने डिग्री का है?",
          mr: "एका त्रिकोणाचे कोन 1 : 2 : 3 या प्रमाणात आहेत. सर्वांत मोठा कोन किती अंशांचा?",
        },
        answer: 90,
        wrong: [60, 30, 120],
        checkExpr: "180*3/6",
        solution: {
          en: "The ratio splits the angle sum into 1 + 2 + 3 = 6 parts, so each part is 180/6 = 30 degrees and the largest is 3 parts: 180 × 3/6 = 90. The result is worth noticing rather than just recording — any triangle whose angles are in the ratio 1 : 2 : 3 is right-angled, and it is exactly the 30-60-90 triangle whose exact ratios the chapter keeps using. (60 gives the middle angle.)",
          hi: "अनुपात कोण-योग को 1 + 2 + 3 = 6 भागों में बाँटता है, अतः हर भाग 180/6 = 30 डिग्री का है और सबसे बड़ा 3 भाग: 180 × 3/6 = 90. परिणाम केवल दर्ज करने के बजाय देखने योग्य है — जिस भी त्रिभुज के कोण 1 : 2 : 3 के अनुपात में हों वह समकोण है, और वह ठीक वही 30-60-90 त्रिभुज है जिसके यथार्थ अनुपात अध्याय बार-बार काम में लेता है। (60 बीच का कोण देता है।)",
          mr: "प्रमाण कोन-बेरीज 1 + 2 + 3 = 6 भागांत वाटते, म्हणून प्रत्येक भाग 180/6 = 30 अंशांचा आणि सर्वांत मोठा 3 भाग: 180 × 3/6 = 90. निकाल केवळ नोंदवण्याऐवजी पाहण्याजोगा — ज्या कोणत्याही त्रिकोणाचे कोन 1 : 2 : 3 प्रमाणात असतील तो काटकोन त्रिकोण आहे, आणि तो नेमका तोच 30-60-90 त्रिकोण ज्याची अचूक गुणोत्तरे प्रकरण पुन्हा पुन्हा वापरते. (60 मधला कोन देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "If tan A = 1/2 and tan B = 1/3, what is tan(A + B)?",
          hi: "यदि tan A = 1/2 और tan B = 1/3, तो tan(A + B) क्या है?",
          mr: "जर tan A = 1/2 आणि tan B = 1/3, तर tan(A + B) किती?",
        },
        answer: 1,
        wrong: [0.5, 2, 5],
        checkExpr: "(1/2+1/3)/(1-1/6)",
        solution: {
          en: "The addition formula is tan(A + B) = (tan A + tan B)/(1 − tan A tan B). The top is 1/2 + 1/3 = 5/6 and the bottom is 1 − 1/6 = 5/6, so the whole thing is exactly 1. That answer says something rather elegant: since tan 45° = 1, the two angles A and B add to precisely 45 degrees, even though neither is a familiar angle on its own. The denominator is where most of the marks are lost — it is a subtraction, not an addition, and forgetting it turns the answer into 5/6. (0.5 quotes tan A and never applies the formula.)",
          hi: "योग सूत्र है tan(A + B) = (tan A + tan B)/(1 − tan A tan B). ऊपर 1/2 + 1/3 = 5/6 और नीचे 1 − 1/6 = 5/6, अतः पूरा ठीक 1 है। वह उत्तर कुछ सुंदर कहता है: चूँकि tan 45° = 1, दोनों कोण A और B ठीक 45 डिग्री बनाते हैं, भले ही अकेला कोई भी परिचित कोण न हो। हर वहीं है जहाँ अधिकांश अंक जाते हैं — वह घटाव है, जोड़ नहीं, और उसे भूलने पर उत्तर 5/6 बन जाता है। (0.5 tan A बता देता है और सूत्र लगाता ही नहीं।)",
          mr: "बेरीज सूत्र आहे tan(A + B) = (tan A + tan B)/(1 − tan A tan B). वर 1/2 + 1/3 = 5/6 आणि खाली 1 − 1/6 = 5/6, म्हणून अख्खे नेमके 1 आहे. ते उत्तर काहीतरी देखणे सांगते: tan 45° = 1 असल्याने, दोन्ही कोन A आणि B नेमके 45 अंश बनवतात, जरी एकटा कोणीही परिचित कोन नसला तरी. छेद तिथेच आहे जिथे बहुतांश गुण जातात — ती वजाबाकी आहे, बेरीज नव्हे, आणि ती विसरल्यावर उत्तर 5/6 बनते. (0.5 tan A सांगते आणि सूत्र लावतच नाही.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-trigonometric-functions",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 3 — Trigonometric Functions",
      name: "Trigonometric Functions",
      summary:
        "The ratios cut loose from the right-angled triangle: an angle measured by the arc it cuts rather than by degrees, a function that repeats for ever and therefore has a period, a bounded value with a largest and smallest, and addition formulae that turn two known angles into a third.",
      position: 3,
      translations: {
        hi: {
          name: "त्रिकोणमितीय फलन",
          summary:
            "अनुपात समकोण त्रिभुज से खुले: कोण डिग्री से नहीं, काटे गए चाप से मापा गया, ऐसा फलन जो सदा दोहराता है और इसीलिए जिसका आवर्तकाल है, अधिकतम और न्यूनतम वाला परिबद्ध मान, और योग सूत्र जो दो ज्ञात कोणों से तीसरा बना देते हैं।",
        },
        mr: {
          name: "त्रिकोणमितीय फलने",
          summary:
            "गुणोत्तरे काटकोन त्रिकोणापासून मोकळी: कोन अंशांनी नव्हे, कापलेल्या कमानीने मोजलेला, असे फलन जे सदैव पुनरावृत्त होते आणि म्हणून ज्याला आवर्तकाल आहे, कमाल आणि किमान असलेले परिबद्ध मूल्य, आणि बेरीज सूत्रे जी दोन ज्ञात कोनांतून तिसरा बनवतात.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 4 — Complex Numbers and Quadratic Equations                       */
/* ------------------------------------------------------------------------- */
function complexNumbers11(): TopicFileOut {
  const rand = rng("maths-11-complex-numbers");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Given that i² = −1, what is the value of i⁴?",
          hi: "यह देखते हुए कि i² = −1, i⁴ का मान क्या है?",
          mr: "i² = −1 हे पाहता, i⁴ चे मूल्य किती?",
        },
        answer: 1,
        wrong: [-1, 2, 0],
        checkExpr: "(0-1)*(0-1)",
        solution: {
          en: "i⁴ is i² times i², which is (−1) × (−1) = 1. That single result is what makes the powers of i cycle: i, −1, −i, 1, and then round again, so any power can be settled by dividing the exponent by 4 and looking at the remainder. (−1 gives i², stopping one step early.)",
          hi: "i⁴ है i² गुणा i², जो (−1) × (−1) = 1 है। वही एक परिणाम i की घातों को चक्कर कटवाता है: i, −1, −i, 1, और फिर से वही, अतः कोई भी घात घातांक को 4 से भाग देकर शेषफल देखकर तय की जा सकती है। (−1 i² देता है, एक क़दम पहले रुककर।)",
          mr: "i⁴ म्हणजे i² गुणिले i², जे (−1) × (−1) = 1. तोच एक निकाल i च्या घातींना फेरी मारायला लावतो: i, −1, −i, 1, आणि पुन्हा तेच, म्हणून कोणतीही घात घातांकाला 4 ने भागून बाकी पाहून ठरवता येते. (−1 i² देते, एक पाऊल आधी थांबून.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the imaginary part of (3 + 2i) + (1 + 4i)?",
          hi: "(3 + 2i) + (1 + 4i) का काल्पनिक भाग क्या है?",
          mr: "(3 + 2i) + (1 + 4i) चा काल्पनिक भाग किती?",
        },
        answer: 6,
        wrong: [4, 5, 8],
        checkExpr: "2+4",
        solution: {
          en: "Complex numbers add componentwise: the real parts give 3 + 1 = 4 and the imaginary parts give 2 + 4 = 6, so the sum is 4 + 6i and the imaginary part is 6. Note that the imaginary part is the coefficient of i, a plain real number — not 6i. (4 quotes the real part instead.)",
          hi: "सम्मिश्र संख्याएँ घटकवार जुड़ती हैं: वास्तविक भाग 3 + 1 = 4 देते हैं और काल्पनिक भाग 2 + 4 = 6, अतः योग 4 + 6i है और काल्पनिक भाग 6. ध्यान दो कि काल्पनिक भाग i का गुणांक है, एक सादा वास्तविक संख्या — 6i नहीं। (4 इसके बदले वास्तविक भाग बता देता है।)",
          mr: "संमिश्र संख्या घटकनिहाय जुळतात: वास्तव भाग 3 + 1 = 4 देतात आणि काल्पनिक भाग 2 + 4 = 6, म्हणून बेरीज 4 + 6i आणि काल्पनिक भाग 6. लक्षात घ्या की काल्पनिक भाग हा i चा सहगुणक आहे, एक साधी वास्तव संख्या — 6i नव्हे. (4 त्याऐवजी वास्तव भाग सांगते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the modulus of the complex number 3 + 4i?",
          hi: "सम्मिश्र संख्या 3 + 4i का मापांक क्या है?",
          mr: "संमिश्र संख्या 3 + 4i चे मापांक किती?",
        },
        answer: 5,
        wrong: [7, 25, 12],
        checkExpr: "(9+16)/5",
        solution: {
          en: "The modulus is √(3² + 4²) = √25 = 5, which is exactly the distance from the origin to the point (3, 4) on the plane. Because it is a distance it can never be negative, whatever the signs of the parts — the modulus of −3 − 4i is also 5. (7 adds the two parts, which is what you would do for a real number and never for a point in a plane.)",
          hi: "मापांक है √(3² + 4²) = √25 = 5, जो ठीक मूलबिंदु से तल पर बिंदु (3, 4) तक की दूरी है। चूँकि वह दूरी है, वह कभी ऋणात्मक नहीं हो सकता, भागों के चिह्न चाहे जो हों — −3 − 4i का मापांक भी 5 है। (7 दोनों भाग जोड़ देता है, जो तुम किसी वास्तविक संख्या के लिए करते और तल के किसी बिंदु के लिए कभी नहीं।)",
          mr: "मापांक म्हणजे √(3² + 4²) = √25 = 5, जे नेमके आरंभबिंदूपासून प्रतलावरील बिंदू (3, 4) पर्यंतचे अंतर. ते अंतर असल्याने ते कधीच ऋण असू शकत नाही, भागांची चिन्हे कोणतीही असोत — −3 − 4i चे मापांकही 5 आहे. (7 दोन्ही भाग जोडते, जे तुम्ही एखाद्या वास्तव संख्येसाठी केले असते आणि प्रतलावरील बिंदूसाठी कधीच नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the value of i¹⁰ + i²⁰?",
          hi: "i¹⁰ + i²⁰ का मान क्या है?",
          mr: "i¹⁰ + i²⁰ चे मूल्य किती?",
        },
        answer: 0,
        wrong: [2, -2, 1],
        checkExpr: "(0-1)+1",
        solution: {
          en: "Divide each exponent by 4 and keep the remainder. 10 leaves 2, so i¹⁰ = i² = −1; 20 leaves 0, so i²⁰ = i⁴ = 1. The sum is −1 + 1 = 0. Reducing the exponent modulo 4 turns any power of i, however large, into one of exactly four values. (2 treats both terms as 1, forgetting that 10 is not a multiple of 4.)",
          hi: "हर घातांक को 4 से भाग दो और शेषफल रखो। 10 का शेष 2, अतः i¹⁰ = i² = −1; 20 का शेष 0, अतः i²⁰ = i⁴ = 1. योग −1 + 1 = 0. घातांक को 4 से मापांकित करना i की किसी भी घात को, चाहे कितनी बड़ी हो, ठीक चार मानों में से एक बना देता है। (2 दोनों पदों को 1 मान लेता है, यह भूलकर कि 10, 4 का गुणज नहीं।)",
          mr: "प्रत्येक घातांकाला 4 ने भागा आणि बाकी ठेवा. 10 ची बाकी 2, म्हणून i¹⁰ = i² = −1; 20 ची बाकी 0, म्हणून i²⁰ = i⁴ = 1. बेरीज −1 + 1 = 0. घातांकाला 4 ने मापांकित करणे i ची कोणतीही घात, कितीही मोठी असो, नेमक्या चार मूल्यांपैकी एक बनवते. (2 दोन्ही पदे 1 मानते, 10 हा 4 चा पट नाही हे विसरून.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the value of (2 + 3i)(2 − 3i)?",
          hi: "(2 + 3i)(2 − 3i) का मान क्या है?",
          mr: "(2 + 3i)(2 − 3i) चे मूल्य किती?",
        },
        answer: 13,
        wrong: [4, -5, 5],
        checkExpr: "2*2+3*3",
        solution: {
          en: "This is a difference of two squares: 2² − (3i)² = 4 − 9i² = 4 + 9 = 13, because i² is −1 and the minus becomes a plus. Multiplying a complex number by its conjugate always leaves a real answer equal to the square of the modulus, and that is precisely why the conjugate is the tool used to clear an i out of a denominator. (−5 keeps i² as +1 and gets 4 − 9.)",
          hi: "यह दो वर्गों का अंतर है: 2² − (3i)² = 4 − 9i² = 4 + 9 = 13, क्योंकि i² −1 है और ऋण धन बन जाता है। किसी सम्मिश्र संख्या को उसके संयुग्मी से गुणा करने पर सदा वास्तविक उत्तर बचता है जो मापांक के वर्ग के बराबर है, और ठीक इसीलिए हर में से i हटाने का औज़ार संयुग्मी है। (−5 i² को +1 रखकर 4 − 9 पा लेता है।)",
          mr: "हा दोन वर्गांचा फरक आहे: 2² − (3i)² = 4 − 9i² = 4 + 9 = 13, कारण i² हा −1 आहे आणि ऋण धन बनते. एखाद्या संमिश्र संख्येला तिच्या संयुग्मीने गुणल्यावर नेहमी वास्तव उत्तर उरते जे मापांकाच्या वर्गाइतके, आणि नेमके म्हणूनच छेदातून i काढण्याचे हत्यार म्हणजे संयुग्मी. (−5 i² ला +1 ठेवून 4 − 9 मिळवते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the imaginary part of the conjugate of 5 − 7i?",
          hi: "5 − 7i के संयुग्मी का काल्पनिक भाग क्या है?",
          mr: "5 − 7i च्या संयुग्मीचा काल्पनिक भाग किती?",
        },
        answer: 7,
        wrong: [-7, 5, 12],
        checkExpr: "0+7",
        solution: {
          en: "Taking the conjugate flips the sign of the imaginary part and leaves the real part alone, so the conjugate of 5 − 7i is 5 + 7i and its imaginary part is 7. Geometrically the conjugate is the mirror image in the real axis, which is why the modulus is unchanged by it. (−7 gives the imaginary part of the original number rather than of its conjugate.)",
          hi: "संयुग्मी लेने पर काल्पनिक भाग का चिह्न पलटता है और वास्तविक भाग वैसा ही रहता है, अतः 5 − 7i का संयुग्मी 5 + 7i है और उसका काल्पनिक भाग 7. ज्यामितीय रूप से संयुग्मी वास्तविक अक्ष में दर्पण-प्रतिबिंब है, इसीलिए उससे मापांक नहीं बदलता। (−7 संयुग्मी के नहीं, मूल संख्या के काल्पनिक भाग को देता है।)",
          mr: "संयुग्मी घेतल्यावर काल्पनिक भागाचे चिन्ह उलटते आणि वास्तव भाग तसाच राहतो, म्हणून 5 − 7i चा संयुग्मी 5 + 7i आणि त्याचा काल्पनिक भाग 7. भूमितीयदृष्ट्या संयुग्मी हे वास्तव अक्षातले आरशातले प्रतिबिंब आहे, म्हणूनच त्याने मापांक बदलत नाही. (−7 संयुग्मीचा नव्हे, मूळ संख्येचा काल्पनिक भाग देते.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the discriminant of x² + 4x + 5?",
          hi: "x² + 4x + 5 का विविक्तकर क्या है?",
          mr: "x² + 4x + 5 चा विविक्तकर किती?",
        },
        answer: -4,
        wrong: [4, 36, 11],
        checkExpr: "4*4-4*1*5",
        solution: {
          en: "The discriminant is b² − 4ac = 16 − 20 = −4. Its sign is the whole message: negative means no real roots, and before this chapter that would have been the end of the matter. Now it means the two roots are complex conjugates instead — a quadratic always has exactly two roots once the number system is wide enough to hold them. (11 computes b² − 4c and forgets the coefficient a.)",
          hi: "विविक्तकर है b² − 4ac = 16 − 20 = −4. उसका चिह्न ही पूरा संदेश है: ऋणात्मक का अर्थ कोई वास्तविक मूल नहीं, और इस अध्याय से पहले बात वहीं ख़त्म हो जाती। अब उसका अर्थ है कि दोनों मूल सम्मिश्र संयुग्मी हैं — द्विघात के सदा ठीक दो मूल होते हैं, बशर्ते संख्या-पद्धति उन्हें रखने लायक़ चौड़ी हो। (11 b² − 4c निकालता है और गुणांक a भूल जाता है।)",
          mr: "विविक्तकर म्हणजे b² − 4ac = 16 − 20 = −4. त्याचे चिन्हच अख्खा संदेश आहे: ऋण म्हणजे कोणतीही वास्तव मुळे नाहीत, आणि या प्रकरणाआधी गोष्ट तिथेच संपली असती. आता त्याचा अर्थ दोन्ही मुळे संमिश्र संयुग्मी आहेत — वर्गसमीकरणाला नेहमी नेमकी दोन मुळे असतात, जर संख्या-पद्धती ती ठेवण्याइतकी रुंद असेल तर. (11 b² − 4c काढते आणि सहगुणक a विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "How many REAL roots does the equation x² + 1 = 0 have?",
          hi: "समीकरण x² + 1 = 0 के कितने वास्तविक मूल हैं?",
          mr: "समीकरण x² + 1 = 0 ला किती वास्तव मुळे आहेत?",
        },
        answer: 0,
        wrong: [1, 2, -1],
        checkExpr: "1-1",
        solution: {
          en: "A real number squared is never negative, so x² = −1 has no solution among the reals and the count is 0. The equation does have two roots, i and −i, but they are not real — which is exactly the gap this chapter was invented to fill. Note that the question asks how MANY, so the answer is a count and can never itself be negative. (2 counts the complex roots, which the question excluded.)",
          hi: "किसी वास्तविक संख्या का वर्ग कभी ऋणात्मक नहीं होता, अतः x² = −1 का वास्तविकों में कोई हल नहीं और गिनती 0 है। समीकरण के दो मूल हैं ही, i और −i, पर वे वास्तविक नहीं — और ठीक यही खाई पाटने को यह अध्याय गढ़ा गया। ध्यान दो कि प्रश्न कितने पूछता है, अतः उत्तर गिनती है और स्वयं कभी ऋणात्मक नहीं हो सकता। (2 सम्मिश्र मूल गिन लेता है, जिन्हें प्रश्न ने बाहर रखा था।)",
          mr: "कोणत्याही वास्तव संख्येचा वर्ग कधीच ऋण नसतो, म्हणून x² = −1 ला वास्तवांत कोणतेही उत्तर नाही आणि मोजणी 0 आहे. समीकरणाला दोन मुळे आहेतच, i आणि −i, पण ती वास्तव नाहीत — आणि नेमकी हीच दरी भरण्यासाठी हे प्रकरण घडवले गेले. लक्षात घ्या की प्रश्न किती विचारतो, म्हणून उत्तर ही मोजणी आहे आणि ती स्वतः कधीच ऋण असू शकत नाही. (2 संमिश्र मुळे मोजते, जी प्रश्नाने वगळली होती.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "If z = 1 + i, what is the value of |z|²?",
          hi: "यदि z = 1 + i, तो |z|² का मान क्या है?",
          mr: "जर z = 1 + i, तर |z|² चे मूल्य किती?",
        },
        answer: 2,
        wrong: [1, 4, 0],
        checkExpr: "1*1+1*1",
        solution: {
          en: "The modulus is √(1² + 1²) = √2, so its square is 2 — and squaring undoes the root, which is why |z|² is always the tidier quantity to work with: 1² + 1² = 2, no surd anywhere. It is also equal to z times its conjugate, which is the identity that makes division of complex numbers possible. (4 squares the sum of the parts, computing (1 + 1)² instead of 1² + 1².)",
          hi: "मापांक है √(1² + 1²) = √2, अतः उसका वर्ग 2 है — और वर्ग करने से मूल कट जाता है, इसीलिए |z|² सदा काम करने को साफ़-सुथरी राशि है: 1² + 1² = 2, कहीं कोई करणी नहीं। वह z गुणा उसके संयुग्मी के भी बराबर है, और वही सर्वसमिका सम्मिश्र संख्याओं का भाग संभव बनाती है। (4 भागों के योग का वर्ग करता है, 1² + 1² के बजाय (1 + 1)² निकालकर।)",
          mr: "मापांक म्हणजे √(1² + 1²) = √2, म्हणून त्याचा वर्ग 2 — आणि वर्ग केल्याने मूळ छेदते, म्हणूनच |z|² ही नेहमी काम करण्यास स्वच्छ राशी: 1² + 1² = 2, कुठेही करणी नाही. ती z गुणिले त्याचा संयुग्मी यालाही समान आहे, आणि तेच नित्यसमीकरण संमिश्र संख्यांचा भागाकार शक्य करते. (4 भागांच्या बेरजेचा वर्ग करते, 1² + 1² ऐवजी (1 + 1)² काढून.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the sum of the roots of 2x² − 6x + 5 = 0?",
          hi: "2x² − 6x + 5 = 0 के मूलों का योग क्या है?",
          mr: "2x² − 6x + 5 = 0 च्या मुळांची बेरीज किती?",
        },
        answer: 3,
        wrong: [-3, 2.5, 6],
        checkExpr: "6/2",
        solution: {
          en: "The sum of the roots is −b/a = 6/2 = 3. The point of the formula is that it works without finding the roots at all — and here that matters, because the discriminant is 36 − 40 = −4, so the roots are complex. Two complex conjugate roots still add to a real number, since their imaginary parts cancel. (−3 keeps the minus sign that the formula has already used up on the negative b.)",
          hi: "मूलों का योग है −b/a = 6/2 = 3. सूत्र का प्रयोजन यह है कि वह मूल निकाले बिना ही काम करता है — और यहाँ यह मायने रखता है, क्योंकि विविक्तकर 36 − 40 = −4 है, अतः मूल सम्मिश्र हैं। दो सम्मिश्र संयुग्मी मूल फिर भी वास्तविक संख्या में जुड़ते हैं, क्योंकि उनके काल्पनिक भाग कट जाते हैं। (−3 वह ऋण चिह्न बनाए रखता है जिसे सूत्र ऋणात्मक b पर पहले ही ख़र्च कर चुका है।)",
          mr: "मुळांची बेरीज म्हणजे −b/a = 6/2 = 3. सूत्राचा हेतू हा की ते मुळे न काढताच चालते — आणि इथे हे महत्त्वाचे, कारण विविक्तकर 36 − 40 = −4 आहे, म्हणून मुळे संमिश्र आहेत. दोन संमिश्र संयुग्मी मुळे तरीही वास्तव संख्येत जुळतात, कारण त्यांचे काल्पनिक भाग छेदतात. (−3 ते ऋण चिन्ह टिकवते जे सूत्राने ऋण b वर आधीच खर्चले आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "What is the product of the roots of 3x² + 5x + 12 = 0?",
          hi: "3x² + 5x + 12 = 0 के मूलों का गुणनफल क्या है?",
          mr: "3x² + 5x + 12 = 0 च्या मुळांचा गुणाकार किती?",
        },
        answer: 4,
        wrong: [-4, 3, 12],
        checkExpr: "12/3",
        solution: {
          en: "The product of the roots is c/a = 12/3 = 4, with no minus sign — that belongs to the sum, which is −5/3. Mixing the two up is the single commonest error in this chapter, and the fix is to remember that only the sum carries the sign flip. Once more the roots themselves are complex, since 25 − 144 is negative, and once more the product comes out real, because a complex number times its conjugate is |z|². (−4 borrows the minus sign from the sum formula.)",
          hi: "मूलों का गुणनफल है c/a = 12/3 = 4, बिना किसी ऋण चिह्न के — वह योग का है, जो −5/3 है। दोनों को गड्डमड्ड करना इस अध्याय की इकलौती सबसे आम भूल है, और उपाय है यह याद रखना कि चिह्न-पलट केवल योग ढोता है। एक बार फिर मूल स्वयं सम्मिश्र हैं, क्योंकि 25 − 144 ऋणात्मक है, और एक बार फिर गुणनफल वास्तविक निकलता है, क्योंकि सम्मिश्र संख्या गुणा उसका संयुग्मी |z|² है। (−4 योग-सूत्र से ऋण चिह्न उधार ले लेता है।)",
          mr: "मुळांचा गुणाकार म्हणजे c/a = 12/3 = 4, कोणत्याही ऋण चिन्हाविना — ते बेरजेचे आहे, जी −5/3 आहे. दोन्ही गोंधळून टाकणे ही या प्रकरणातली सर्वांत सामान्य चूक, आणि उपाय म्हणजे हे लक्षात ठेवणे की चिन्ह-पालट केवळ बेरीजच वाहते. पुन्हा एकदा मुळे स्वतः संमिश्र आहेत, कारण 25 − 144 ऋण आहे, आणि पुन्हा एकदा गुणाकार वास्तव निघतो, कारण संमिश्र संख्या गुणिले तिचा संयुग्मी म्हणजे |z|². (−4 बेरीज-सूत्रातून ऋण चिन्ह उसने घेते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "One root of x² − 6x + k = 0 is 2. What is k?",
          hi: "x² − 6x + k = 0 का एक मूल 2 है। k क्या है?",
          mr: "x² − 6x + k = 0 चे एक मूळ 2 आहे. k किती?",
        },
        answer: 8,
        wrong: [4, 2, 12],
        checkExpr: "6*2-2*2",
        solution: {
          en: "Substituting the root must satisfy the equation: 4 − 12 + k = 0, so k = 8, or in one line k = 6 × 2 − 2 × 2 = 8. There is a second route worth knowing — the roots sum to 6, so the other root is 4, and the product 2 × 4 = 8 is k directly. When two methods agree the answer is worth trusting, and when they disagree one of them has misremembered a sign. (4 gives the other root rather than k.)",
          hi: "मूल रखने पर समीकरण संतुष्ट होना ही चाहिए: 4 − 12 + k = 0, अतः k = 8, या एक पंक्ति में k = 6 × 2 − 2 × 2 = 8. एक दूसरा रास्ता भी जानने योग्य है — मूलों का योग 6 है, अतः दूसरा मूल 4 है, और गुणनफल 2 × 4 = 8 सीधे k है। जब दो विधियाँ सहमत हों तो उत्तर पर भरोसा करने योग्य है, और जब असहमत हों तो उनमें से एक ने कोई चिह्न ग़लत याद रखा है। (4 k के बजाय दूसरा मूल देता है।)",
          mr: "मूळ ठेवल्यावर समीकरण समाधानी व्हायलाच हवे: 4 − 12 + k = 0, म्हणून k = 8, वा एका ओळीत k = 6 × 2 − 2 × 2 = 8. दुसरा मार्गही जाणण्याजोगा — मुळांची बेरीज 6 आहे, म्हणून दुसरे मूळ 4 आहे, आणि गुणाकार 2 × 4 = 8 हा थेट k. दोन पद्धती सहमत असतील तर उत्तरावर विश्वास ठेवण्याजोगे, आणि असहमत असतील तर त्यांपैकी एकीने एखादे चिन्ह चुकीचे लक्षात ठेवले आहे. (4 k ऐवजी दुसरे मूळ देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "What is the modulus of (1 + i)/(1 − i)?",
          hi: "(1 + i)/(1 − i) का मापांक क्या है?",
          mr: "(1 + i)/(1 − i) चे मापांक किती?",
        },
        answer: 1,
        wrong: [2, 0, 0.5],
        checkExpr: "(1+1)/(1+1)",
        solution: {
          en: "The modulus of a quotient is the quotient of the moduli, so there is no need to simplify the fraction at all: |1 + i| = √2 and |1 − i| = √2, and the ratio is 1. Working with the squares avoids the surds entirely — (1 + 1)/(1 + 1) = 1. If you do simplify, multiplying top and bottom by (1 + i) gives 2i/2 = i, whose modulus is indeed 1, and the two routes agreeing is the check. Note the general lesson: a modulus turns multiplication and division into ordinary arithmetic, which is why it is worth reaching for before the algebra. (2 adds the two moduli instead of dividing them.)",
          hi: "किसी भागफल का मापांक मापांकों का भागफल है, अतः भिन्न को सरल करने की ज़रूरत ही नहीं: |1 + i| = √2 और |1 − i| = √2, और अनुपात 1. वर्गों से काम करना करणियों से पूरी तरह बचा देता है — (1 + 1)/(1 + 1) = 1. यदि सरल करो भी, तो ऊपर-नीचे (1 + i) से गुणा करने पर 2i/2 = i मिलता है, जिसका मापांक सचमुच 1 है, और दोनों रास्तों का सहमत होना ही जाँच है। सामान्य सीख ध्यान दो: मापांक गुणा और भाग को साधारण अंकगणित बना देता है, इसीलिए बीजगणित से पहले उसकी ओर हाथ बढ़ाना उचित है। (2 दोनों मापांक भाग देने के बजाय जोड़ देता है।)",
          mr: "कोणत्याही भागाकाराचे मापांक म्हणजे मापांकांचा भागाकार, म्हणून अपूर्णांक सोपा करण्याची गरजच नाही: |1 + i| = √2 आणि |1 − i| = √2, आणि गुणोत्तर 1. वर्गांनी काम करणे करणींपासून पूर्ण वाचवते — (1 + 1)/(1 + 1) = 1. सोपे केलेच तर वर-खाली (1 + i) ने गुणल्यावर 2i/2 = i मिळते, ज्याचे मापांक खरोखर 1 आहे, आणि दोन्ही मार्ग सहमत असणे हीच तपासणी. सामान्य धडा लक्षात घ्या: मापांक गुणाकार आणि भागाकाराला साधे अंकगणित बनवते, म्हणूनच बीजगणिताआधी त्याकडे हात वळवणे योग्य. (2 दोन्ही मापांके भागण्याऐवजी जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "If z = 2 + 3i and z̄ is its conjugate, what is the value of z·z̄ + |z|²?",
          hi: "यदि z = 2 + 3i और z̄ उसका संयुग्मी है, तो z·z̄ + |z|² का मान क्या है?",
          mr: "जर z = 2 + 3i आणि z̄ हा त्याचा संयुग्मी असेल, तर z·z̄ + |z|² चे मूल्य किती?",
        },
        answer: 26,
        wrong: [13, 52, 39],
        checkExpr: "2*(2*2+3*3)",
        solution: {
          en: "The two terms are the same quantity written twice. z·z̄ = (2 + 3i)(2 − 3i) = 4 + 9 = 13, and |z|² = 2² + 3² = 13 as well, so the total is 2 × 13 = 26. Recognising that z·z̄ IS |z|² is the point of the question — it is the identity that lets you divide by a complex number, since multiplying top and bottom by the conjugate turns the denominator into a plain real number. The alternative is to expand both terms separately and hope the arithmetic agrees, which is slower and no safer. (13 works out one of the two terms and stops.)",
          hi: "दोनों पद एक ही राशि दो बार लिखी हुई हैं। z·z̄ = (2 + 3i)(2 − 3i) = 4 + 9 = 13, और |z|² = 2² + 3² = 13 भी, अतः कुल 2 × 13 = 26. यह पहचानना कि z·z̄ ही |z|² है प्रश्न का प्रयोजन है — वही सर्वसमिका सम्मिश्र संख्या से भाग देने देती है, क्योंकि ऊपर-नीचे संयुग्मी से गुणा करने पर हर सादा वास्तविक संख्या बन जाता है। विकल्प है दोनों पद अलग-अलग खोलकर आशा करना कि गणित मेल खाए, जो धीमा है और अधिक सुरक्षित नहीं। (13 दोनों में से एक पद निकालकर रुक जाता है।)",
          mr: "दोन्ही पदे म्हणजे एकच राशी दोनदा लिहिलेली. z·z̄ = (2 + 3i)(2 − 3i) = 4 + 9 = 13, आणि |z|² = 2² + 3² = 13 सुद्धा, म्हणून एकूण 2 × 13 = 26. z·z̄ हेच |z|² आहे हे ओळखणे हा प्रश्नाचा हेतू — तेच नित्यसमीकरण संमिश्र संख्येने भागू देते, कारण वर-खाली संयुग्मीने गुणल्यावर छेद साधी वास्तव संख्या बनतो. पर्याय म्हणजे दोन्ही पदे वेगवेगळी उलगडून गणित जुळेल अशी आशा करणे, जे मंद आहे आणि अधिक सुरक्षितही नाही. (13 दोघांपैकी एक पद काढून थांबते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-complex-numbers",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 4 — Complex Numbers and Quadratic Equations",
      name: "Complex Numbers and Quadratic Equations",
      summary:
        "One invented number closes a gap the real line could not: powers of i that cycle in fours, a modulus that is a distance and therefore never negative, a conjugate that clears the imaginary part by multiplication, and a discriminant that stops predicting no roots and starts predicting two.",
      position: 4,
      translations: {
        hi: {
          name: "सम्मिश्र संख्याएँ तथा द्विघात समीकरण",
          summary:
            "एक गढ़ी हुई संख्या वह खाई पाट देती है जो वास्तविक रेखा नहीं पाट सकी: i की घातें जो चार-चार में चक्कर काटती हैं, ऐसा मापांक जो दूरी है और इसलिए कभी ऋणात्मक नहीं, ऐसा संयुग्मी जो गुणा से काल्पनिक भाग साफ़ कर देता है, और वह विविक्तकर जो अब मूल न होने की नहीं, दो मूल होने की भविष्यवाणी करता है।",
        },
        mr: {
          name: "संमिश्र संख्या आणि वर्गसमीकरणे",
          summary:
            "एक घडवलेली संख्या ती दरी भरते जी वास्तव रेषा भरू शकली नाही: i च्या घाती ज्या चार-चारांत फेरी मारतात, असे मापांक जे अंतर आहे आणि म्हणून कधीच ऋण नाही, असे संयुग्मी जे गुणाकाराने काल्पनिक भाग साफ करते, आणि तो विविक्तकर जो आता मुळे नसण्याची नव्हे, दोन मुळे असण्याची भविष्यवाणी करतो.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 5 — Linear Inequalities (a range instead of an answer)            */
/* ------------------------------------------------------------------------- */
function linearInequalities11(): TopicFileOut {
  const rand = rng("maths-11-linear-inequalities");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Solve 3x < 12. What is the greatest INTEGER value of x that satisfies it?",
          hi: "3x < 12 हल करो। x का सबसे बड़ा पूर्णांक मान क्या है जो इसे संतुष्ट करता है?",
          mr: "3x < 12 सोडवा. x चे सर्वांत मोठे पूर्णांक मूल्य किती जे हे समाधानी करते?",
        },
        answer: 3,
        wrong: [4, 5, 2],
        checkExpr: "12/3-1",
        solution: {
          en: "Dividing both sides by 3 gives x < 4. Since the sign is strict, 4 itself does not satisfy it, so the greatest integer is 12/3 − 1 = 3. The habit worth building is to solve for the range first and only then read off whatever the question actually asked for. (4 gives the boundary, which is excluded by the strict inequality.)",
          hi: "दोनों ओर 3 से भाग देने पर x < 4. चूँकि चिह्न कठोर है, 4 स्वयं उसे संतुष्ट नहीं करता, अतः सबसे बड़ा पूर्णांक 12/3 − 1 = 3. बनाने योग्य आदत यह है कि पहले परास हल करो और तभी वह पढ़ो जो प्रश्न ने वस्तुतः माँगा है। (4 सीमा देता है, जिसे कठोर असमिका बाहर रखती है।)",
          mr: "दोन्ही बाजूंना 3 ने भागल्यावर x < 4. चिन्ह कठोर असल्याने 4 स्वतः ते समाधानी करत नाही, म्हणून सर्वांत मोठा पूर्णांक 12/3 − 1 = 3. बांधण्याजोगी सवय अशी की आधी पल्ला सोडवा आणि तेव्हाच प्रश्नाने प्रत्यक्षात जे मागितले ते वाचा. (4 सीमा देते, जिला कठोर असमानता बाहेर ठेवते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Solve 2x + 5 ≤ 11. How many NATURAL numbers satisfy it?",
          hi: "2x + 5 ≤ 11 हल करो। कितनी प्राकृत संख्याएँ इसे संतुष्ट करती हैं?",
          mr: "2x + 5 ≤ 11 सोडवा. किती नैसर्गिक संख्या हे समाधानी करतात?",
        },
        answer: 3,
        wrong: [4, 6, 2],
        checkExpr: "(11-5)/2",
        solution: {
          en: "Subtracting 5 and halving gives x ≤ (11 − 5)/2 = 3, and the natural numbers meeting that are 1, 2 and 3 — three of them. Because the sign allows equality, 3 itself counts. Note that the answer is a COUNT, not the boundary, even though the two happen to coincide here — they would not have if the question had allowed zero. (4 counts 0 as a natural number.)",
          hi: "5 घटाकर आधा करने पर x ≤ (11 − 5)/2 = 3, और इसे पूरा करने वाली प्राकृत संख्याएँ 1, 2 और 3 हैं — तीन। चूँकि चिह्न बराबरी की छूट देता है, 3 स्वयं गिना जाता है। ध्यान दो कि उत्तर गिनती है, सीमा नहीं, भले ही यहाँ दोनों संयोग से एक हों — यदि प्रश्न शून्य की छूट देता तो न होते। (4 शून्य को प्राकृत संख्या गिन लेता है।)",
          mr: "5 वजा करून निम्मे केल्यावर x ≤ (11 − 5)/2 = 3, आणि हे पूर्ण करणाऱ्या नैसर्गिक संख्या 1, 2 आणि 3 आहेत — तीन. चिन्ह समानतेची मुभा देत असल्याने 3 स्वतः मोजले जाते. लक्षात घ्या की उत्तर ही मोजणी आहे, सीमा नव्हे, जरी इथे दोन्ही योगायोगाने एक असली तरी — प्रश्नाने शून्याची मुभा दिली असती तर नसती. (4 शून्याला नैसर्गिक संख्या मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Solve x − 3 > 0. What is the smallest INTEGER value of x that satisfies it?",
          hi: "x − 3 > 0 हल करो। x का सबसे छोटा पूर्णांक मान क्या है जो इसे संतुष्ट करता है?",
          mr: "x − 3 > 0 सोडवा. x चे सर्वांत लहान पूर्णांक मूल्य किती जे हे समाधानी करते?",
        },
        answer: 4,
        wrong: [3, 2, 0],
        checkExpr: "3+1",
        solution: {
          en: "Adding 3 to both sides gives x > 3, and because the inequality is strict, 3 does not qualify — the smallest integer that does is 3 + 1 = 4. Every question of this kind turns on one word: greater than excludes the boundary, greater than or equal to includes it. (3 gives the boundary that the strict sign has just ruled out.)",
          hi: "दोनों ओर 3 जोड़ने पर x > 3, और चूँकि असमिका कठोर है, 3 योग्य नहीं — सबसे छोटा योग्य पूर्णांक 3 + 1 = 4 है। इस तरह का हर प्रश्न एक शब्द पर टिका है: से बड़ा सीमा को बाहर रखता है, से बड़ा या बराबर उसे भीतर लेता है। (3 वही सीमा देता है जिसे कठोर चिह्न अभी-अभी बाहर कर चुका है।)",
          mr: "दोन्ही बाजूंना 3 जोडल्यावर x > 3, आणि असमानता कठोर असल्याने 3 पात्र नाही — सर्वांत लहान पात्र पूर्णांक 3 + 1 = 4. या प्रकारचा प्रत्येक प्रश्न एका शब्दावर उभा आहे: हून मोठा सीमा बाहेर ठेवतो, हून मोठा वा समान तिला आत घेतो. (3 तीच सीमा देते जिला कठोर चिन्हाने आत्ताच बाहेर केले आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Solve −2x > 6. What is the greatest INTEGER value of x that satisfies it?",
          hi: "−2x > 6 हल करो। x का सबसे बड़ा पूर्णांक मान क्या है जो इसे संतुष्ट करता है?",
          mr: "−2x > 6 सोडवा. x चे सर्वांत मोठे पूर्णांक मूल्य किती जे हे समाधानी करते?",
        },
        answer: -4,
        wrong: [-3, 3, 4],
        checkExpr: "(0-6)/2-1",
        solution: {
          en: "Dividing both sides by −2 REVERSES the inequality, giving x < −3, so the greatest integer is −4. This is the one rule that separates inequalities from equations, and the reason for it is easy to see with numbers: 2 is less than 5, but multiplying both by −1 makes −2 greater than −5. (−3 gives the boundary and also forgets that it is excluded; 3 forgets to reverse the sign at all.)",
          hi: "दोनों ओर −2 से भाग देने पर असमिका पलट जाती है, जिससे x < −3, अतः सबसे बड़ा पूर्णांक −4. यही एक नियम असमिकाओं को समीकरणों से अलग करता है, और उसका कारण संख्याओं से आसानी से दिखता है: 2, 5 से छोटा है, पर दोनों को −1 से गुणा करने पर −2, −5 से बड़ा हो जाता है। (−3 सीमा देता है और यह भी भूल जाता है कि वह बाहर है; 3 चिह्न पलटना ही भूल जाता है।)",
          mr: "दोन्ही बाजूंना −2 ने भागल्यावर असमानता उलटते, ज्यातून x < −3, म्हणून सर्वांत मोठा पूर्णांक −4. हाच एक नियम असमानतांना समीकरणांपासून वेगळा करतो, आणि त्याचे कारण संख्यांनी सहज दिसते: 2 हा 5 हून लहान, पण दोघांना −1 ने गुणल्यावर −2 हा −5 हून मोठा होतो. (−3 सीमा देते आणि ती वगळली आहे हेही विसरते; 3 चिन्ह उलटवणेच विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Solve 5x − 3 < 3x + 1. How many POSITIVE INTEGERS satisfy it?",
          hi: "5x − 3 < 3x + 1 हल करो। कितने धन पूर्णांक इसे संतुष्ट करते हैं?",
          mr: "5x − 3 < 3x + 1 सोडवा. किती धन पूर्णांक हे समाधानी करतात?",
        },
        answer: 1,
        wrong: [2, 3, 0],
        checkExpr: "(1+3)/2-1",
        solution: {
          en: "Collect the x terms on one side: 2x < 4, so x < 2. The positive integers below 2 are just 1, so the count is (1 + 3)/2 − 1 = 1. Moving terms across works exactly as it does for an equation — it is only multiplying or dividing by a negative that flips the sign. (2 counts the boundary value 2, which a strict inequality excludes.)",
          hi: "x वाले पद एक ओर इकट्ठे करो: 2x < 4, अतः x < 2. 2 से नीचे के धन पूर्णांक केवल 1 है, अतः गिनती (1 + 3)/2 − 1 = 1. पदों को इधर-उधर ले जाना ठीक वैसे ही चलता है जैसे किसी समीकरण में — केवल ऋणात्मक से गुणा या भाग ही चिह्न पलटता है। (2 सीमा-मान 2 को गिन लेता है, जिसे कठोर असमिका बाहर रखती है।)",
          mr: "x ची पदे एका बाजूला गोळा करा: 2x < 4, म्हणून x < 2. 2 खालचे धन पूर्णांक केवळ 1 आहे, म्हणून मोजणी (1 + 3)/2 − 1 = 1. पदे इकडून तिकडे नेणे नेमके समीकरणाप्रमाणेच चालते — केवळ ऋणाने गुणाकार वा भागाकारच चिन्ह उलटवतो. (2 सीमा-मूल्य 2 मोजते, जिला कठोर असमानता वगळते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Solve 4x + 3 ≥ 2x + 17. What is the smallest INTEGER value of x that satisfies it?",
          hi: "4x + 3 ≥ 2x + 17 हल करो। x का सबसे छोटा पूर्णांक मान क्या है जो इसे संतुष्ट करता है?",
          mr: "4x + 3 ≥ 2x + 17 सोडवा. x चे सर्वांत लहान पूर्णांक मूल्य किती जे हे समाधानी करते?",
        },
        answer: 7,
        wrong: [10, 14, 8],
        checkExpr: "(17-3)/2",
        solution: {
          en: "Gathering terms gives 2x ≥ 14, so x ≥ 7 and the smallest integer is 7 itself — this time the boundary IS included, because the sign allows equality. Comparing this with the previous question is the whole lesson: the algebra was the same and only one symbol differed, and that symbol decided whether the answer was the boundary or the next number along. (8 excludes the boundary as though the inequality were strict.)",
          hi: "पद इकट्ठे करने पर 2x ≥ 14, अतः x ≥ 7 और सबसे छोटा पूर्णांक 7 ही है — इस बार सीमा भीतर है, क्योंकि चिह्न बराबरी की छूट देता है। इसकी पिछले प्रश्न से तुलना ही पूरा पाठ है: बीजगणित वही था और केवल एक संकेत भिन्न, और उसी संकेत ने तय किया कि उत्तर सीमा है या उससे अगली संख्या। (8 सीमा को ऐसे बाहर कर देता है मानो असमिका कठोर हो।)",
          mr: "पदे गोळा केल्यावर 2x ≥ 14, म्हणून x ≥ 7 आणि सर्वांत लहान पूर्णांक 7 च आहे — यावेळी सीमा आत आहे, कारण चिन्ह समानतेची मुभा देते. याची मागच्या प्रश्नाशी तुलना हाच अख्खा धडा: बीजगणित तेच होते आणि केवळ एक चिन्ह वेगळे, आणि त्याच चिन्हाने ठरवले की उत्तर सीमा आहे की तिच्यापुढची संख्या. (8 सीमा अशी वगळते जणू असमानता कठोर असावी.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "Solve 3(x − 1) ≤ 2(x − 3). What is the greatest INTEGER value of x that satisfies it?",
          hi: "3(x − 1) ≤ 2(x − 3) हल करो। x का सबसे बड़ा पूर्णांक मान क्या है जो इसे संतुष्ट करता है?",
          mr: "3(x − 1) ≤ 2(x − 3) सोडवा. x चे सर्वांत मोठे पूर्णांक मूल्य किती जे हे समाधानी करते?",
        },
        answer: -3,
        wrong: [3, -4, -2],
        checkExpr: "3-6",
        solution: {
          en: "Expand both sides first: 3x − 3 ≤ 2x − 6. Subtracting 2x and adding 3 gives x ≤ −3, so the greatest integer is −3 itself, since equality is allowed. Expanding before collecting is what keeps this safe — trying to cancel the brackets by inspection is where the sign of the 6 usually goes astray. (−4 excludes the boundary, forgetting that the sign permits equality.)",
          hi: "पहले दोनों ओर खोलो: 3x − 3 ≤ 2x − 6. 2x घटाकर और 3 जोड़कर x ≤ −3, अतः सबसे बड़ा पूर्णांक −3 ही है, क्योंकि बराबरी की छूट है। इकट्ठा करने से पहले खोलना ही इसे सुरक्षित रखता है — कोष्ठकों को देखकर काटने की कोशिश में ही 6 का चिह्न प्रायः भटक जाता है। (−4 सीमा को बाहर कर देता है, यह भूलकर कि चिह्न बराबरी की छूट देता है।)",
          mr: "आधी दोन्ही बाजू उघडा: 3x − 3 ≤ 2x − 6. 2x वजा करून आणि 3 जोडून x ≤ −3, म्हणून सर्वांत मोठा पूर्णांक −3 च आहे, कारण समानतेची मुभा आहे. गोळा करण्याआधी उघडणेच हे सुरक्षित ठेवते — कंस पाहून छेदण्याच्या प्रयत्नातच 6 चे चिन्ह बहुधा भरकटते. (−4 सीमा वगळते, चिन्ह समानतेची मुभा देते हे विसरून.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "How many INTEGERS x satisfy −3 ≤ x < 4?",
          hi: "कितने पूर्णांक x, −3 ≤ x < 4 को संतुष्ट करते हैं?",
          mr: "किती पूर्णांक x, −3 ≤ x < 4 समाधानी करतात?",
        },
        answer: 7,
        wrong: [6, 8, 3],
        checkExpr: "4-(0-3)",
        solution: {
          en: "List them: −3, −2, −1, 0, 1, 2, 3 — seven values. The count is 4 − (−3) = 7, and it works out neatly because one end is included and the other excluded, so the two adjustments cancel. Change either sign and the count changes: with both ends closed it would be 8, with both open it would be 6. Counting zero is the other place this goes wrong — it is an integer and belongs in the list. (6 drops zero from the count.)",
          hi: "गिनाओ: −3, −2, −1, 0, 1, 2, 3 — सात मान। गिनती 4 − (−3) = 7 है, और यह साफ़ बैठती है क्योंकि एक सिरा भीतर है और दूसरा बाहर, अतः दोनों समायोजन कट जाते हैं। कोई भी चिह्न बदलो और गिनती बदल जाती है: दोनों सिरे बंद हों तो 8, दोनों खुले हों तो 6. शून्य गिनना वह दूसरी जगह है जहाँ यह बिगड़ता है — वह पूर्णांक है और सूची में है। (6 गिनती से शून्य गिरा देता है।)",
          mr: "यादी करा: −3, −2, −1, 0, 1, 2, 3 — सात मूल्ये. मोजणी 4 − (−3) = 7 आहे, आणि ती स्वच्छ बसते कारण एक टोक आत आहे आणि दुसरे बाहेर, म्हणून दोन्ही जुळवण्या छेदतात. कोणतेही चिन्ह बदला आणि मोजणी बदलते: दोन्ही टोके बंद असतील तर 8, दोन्ही उघडी असतील तर 6. शून्य मोजणे ही ती दुसरी जागा जिथे हे बिघडते — तो पूर्णांक आहे आणि यादीत आहे. (6 मोजणीतून शून्य वगळते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Ravi scored 70 and 75 in his first two tests. What is the minimum he must score in the third for his average over the three to be at least 60?",
          hi: "रवि ने अपनी पहली दो परीक्षाओं में 70 और 75 अंक पाए। तीनों का औसत कम से कम 60 होने के लिए उसे तीसरी में न्यूनतम कितने अंक चाहिए?",
          mr: "रवीला त्याच्या पहिल्या दोन चाचण्यांत 70 आणि 75 गुण मिळाले. तिन्हींची सरासरी किमान 60 होण्यासाठी त्याला तिसरीत किमान किती गुण हवेत?",
        },
        answer: 35,
        wrong: [45, 60, 25],
        checkExpr: "3*60-70-75",
        solution: {
          en: "An average of at least 60 over three tests means a total of at least 3 × 60 = 180. He already has 145, so he needs 180 − 145 = 35. Turning an average condition into a TOTAL condition is the move that makes every question of this family straightforward — averages are awkward to manipulate, totals are not. Note that the answer being comfortably low is a real result, not a mistake: two good scores buy a lot of room in the third. (45 works from an average of 60 on the two remaining marks rather than on all three.)",
          hi: "तीन परीक्षाओं में कम से कम 60 के औसत का अर्थ है कम से कम 3 × 60 = 180 का कुल। उसके पास पहले से 145 हैं, अतः उसे 180 − 145 = 35 चाहिए। औसत की शर्त को कुल की शर्त में बदलना ही वह चाल है जो इस परिवार के हर प्रश्न को सीधा कर देती है — औसत के साथ खेलना असुविधाजनक है, कुल के साथ नहीं। ध्यान दो कि उत्तर का आराम से कम निकलना असली परिणाम है, भूल नहीं: दो अच्छे अंक तीसरे में बहुत जगह ख़रीद लेते हैं। (45 शेष अंकों पर 60 के औसत से चलता है, तीनों पर नहीं।)",
          mr: "तीन चाचण्यांत किमान 60 च्या सरासरीचा अर्थ किमान 3 × 60 = 180 ची बेरीज. त्याच्याकडे आधीच 145 आहेत, म्हणून त्याला 180 − 145 = 35 हवेत. सरासरीची अट बेरजेच्या अटीत बदलणे हीच ती खेळी जी या कुटुंबातला प्रत्येक प्रश्न सरळ करते — सरासरीशी खेळणे गैरसोयीचे, बेरजेशी नाही. लक्षात घ्या की उत्तर आरामात कमी निघणे हा खरा निकाल आहे, चूक नव्हे: दोन चांगले गुण तिसऱ्यात भरपूर जागा विकत घेतात. (45 उरलेल्या गुणांवर 60 च्या सरासरीने चालते, तिन्हींवर नव्हे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "The longest side of a triangle is 3 times the shortest and the third side is 2 cm shorter than the longest. If the perimeter is more than 61 cm, what is the smallest possible WHOLE-NUMBER length of the shortest side?",
          hi: "किसी त्रिभुज की सबसे लंबी भुजा सबसे छोटी की 3 गुनी है और तीसरी भुजा सबसे लंबी से 2 cm छोटी है। यदि परिमाप 61 cm से अधिक है, तो सबसे छोटी भुजा की न्यूनतम संभव पूर्ण-संख्या लंबाई क्या है?",
          mr: "एका त्रिकोणाची सर्वांत लांब बाजू सर्वांत लहान बाजूच्या 3 पट आहे आणि तिसरी बाजू सर्वांत लांब बाजूहून 2 cm आखूड आहे. जर परिमिती 61 cm हून अधिक असेल, तर सर्वांत लहान बाजूची किमान शक्य पूर्ण-संख्या लांबी किती?",
        },
        answer: 10,
        wrong: [9, 11, 63],
        checkExpr: "(61+2)/7+1",
        solution: {
          en: "Call the shortest side x. Then the sides are x, 3x and 3x − 2, and the perimeter is 7x − 2 > 61, giving 7x > 63 and x > 9. Since the inequality is strict, 9 does not qualify and the smallest whole number that does is 10. Naming the unknown as the quantity the question asks about — rather than as one of the other sides — is what keeps the algebra short. (9 gives the boundary the strict sign has just excluded.)",
          hi: "सबसे छोटी भुजा को x कहो। तब भुजाएँ x, 3x और 3x − 2 हैं, और परिमाप 7x − 2 > 61, जिससे 7x > 63 और x > 9. चूँकि असमिका कठोर है, 9 योग्य नहीं और सबसे छोटी योग्य पूर्ण संख्या 10 है। अज्ञात को वही राशि नाम देना जिसके बारे में प्रश्न पूछता है — न कि दूसरी भुजाओं में से कोई — ही बीजगणित छोटा रखता है। (9 वही सीमा देता है जिसे कठोर चिह्न अभी बाहर कर चुका है।)",
          mr: "सर्वांत लहान बाजूला x म्हणा. मग बाजू x, 3x आणि 3x − 2 आहेत, आणि परिमिती 7x − 2 > 61, ज्यातून 7x > 63 आणि x > 9. असमानता कठोर असल्याने 9 पात्र नाही आणि सर्वांत लहान पात्र पूर्ण संख्या 10. अज्ञाताला तीच राशी नाव देणे जिच्याबद्दल प्रश्न विचारतो — इतर बाजूंपैकी कोणतीही नव्हे — हेच बीजगणित आखूड ठेवते. (9 तीच सीमा देते जिला कठोर चिन्हाने आत्ताच वगळले आहे.)",
        },
        fmt: unit("cm"),
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A man cuts three lengths from a board 91 cm long. The second is 3 cm longer than the shortest and the third is twice the shortest. What is the maximum possible length of the shortest piece?",
          hi: "एक आदमी 91 cm लंबे तख़्ते से तीन टुकड़े काटता है। दूसरा सबसे छोटे से 3 cm लंबा है और तीसरा सबसे छोटे का दुगुना। सबसे छोटे टुकड़े की अधिकतम संभव लंबाई क्या है?",
          mr: "एक माणूस 91 cm लांब फळीतून तीन तुकडे कापतो. दुसरा सर्वांत लहानाहून 3 cm लांब आहे आणि तिसरा सर्वांत लहानाच्या दुप्पट. सर्वांत लहान तुकड्याची कमाल शक्य लांबी किती?",
        },
        answer: 22,
        wrong: [8, 23, 88],
        checkExpr: "(91-3)/4",
        solution: {
          en: "Let the shortest be x. The three pieces are x, x + 3 and 2x, and together they cannot exceed the board: 4x + 3 ≤ 91, so 4x ≤ 88 and x ≤ 22. The maximum is therefore 22 cm. Two checks are worth making before writing that down. The pieces then measure 22, 25 and 44, which sum to 91 exactly — the board is used up with nothing wasted. And the answer had to be a maximum rather than a minimum, because the constraint was an upper limit on total length; a question that asked for a minimum would need a different constraint entirely. (23 rounds the wrong way past a boundary that equality allows.)",
          hi: "सबसे छोटे को x कहो। तीनों टुकड़े x, x + 3 और 2x हैं, और मिलकर वे तख़्ते से अधिक नहीं हो सकते: 4x + 3 ≤ 91, अतः 4x ≤ 88 और x ≤ 22. अतः अधिकतम 22 cm है। लिखने से पहले दो जाँचें करने योग्य हैं। तब टुकड़े 22, 25 और 44 के हैं, जो ठीक 91 बनते हैं — तख़्ता पूरा काम आ जाता है और कुछ बर्बाद नहीं होता। और उत्तर को न्यूनतम नहीं, अधिकतम होना ही था, क्योंकि प्रतिबंध कुल लंबाई की ऊपरी सीमा था; न्यूनतम माँगने वाले प्रश्न को बिलकुल दूसरा प्रतिबंध चाहिए होता। (23 उस सीमा से आगे ग़लत दिशा में जाता है जिसकी बराबरी छूट देती है।)",
          mr: "सर्वांत लहानाला x म्हणा. तिन्ही तुकडे x, x + 3 आणि 2x आहेत, आणि मिळून ते फळीहून अधिक असू शकत नाहीत: 4x + 3 ≤ 91, म्हणून 4x ≤ 88 आणि x ≤ 22. म्हणून कमाल 22 cm. लिहिण्याआधी दोन तपासण्या करण्याजोग्या. मग तुकडे 22, 25 आणि 44 चे आहेत, जे नेमके 91 बनतात — फळी पूर्ण वापरली जाते आणि काहीच वाया जात नाही. आणि उत्तर किमान नव्हे, कमालच असायला हवे होते, कारण अट ही एकूण लांबीची वरची मर्यादा होती; किमान विचारणाऱ्या प्रश्नाला अगदी वेगळी अट लागली असती. (23 त्या सीमेपलीकडे चुकीच्या दिशेने जाते जिला समानता मुभा देते.)",
        },
        fmt: unit("cm"),
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "640 litres of an 8% boric acid solution is to be diluted with a 2% solution so that the mixture is more than 4% and less than 6%. What is the smallest WHOLE NUMBER of litres of the 2% solution that must be added?",
          hi: "8% बोरिक अम्ल विलयन के 640 लीटर को 2% विलयन से इतना तनु करना है कि मिश्रण 4% से अधिक और 6% से कम हो। 2% विलयन के कम से कम कितने पूर्ण लीटर मिलाने पड़ेंगे?",
          mr: "8% बोरिक आम्ल द्रावणाचे 640 लिटर 2% द्रावणाने इतके विरळ करायचे आहे की मिश्रण 4% हून अधिक आणि 6% हून कमी व्हावे. 2% द्रावणाचे किमान किती पूर्ण लिटर मिसळावे लागतील?",
        },
        answer: 321,
        wrong: [320, 1280, 640],
        checkExpr: "1280/4+1",
        solution: {
          en: "Let x litres of the 2% solution be added. The acid present is 2x + 8 × 640 parts in a total of x + 640 litres. The upper condition, mixture below 6%, gives 2x + 5120 < 6x + 3840, so 4x > 1280 and x > 320. The lower condition, above 4%, gives 2x + 5120 > 4x + 2560, so x < 1280. The permitted range is therefore 320 < x < 1280, and the smallest whole number in it is 321. Note which end each condition produced: making the mixture weaker needs MORE of the dilute solution, so the 6% ceiling sets the lower bound and the 4% floor sets the upper one. Getting that pairing backwards is the main trap, and the check is a sanity test — adding nothing at all would leave the mixture at 8%, which is above both limits, so the lower bound has to be positive. (320 gives the boundary, which the strict inequality excludes.)",
          hi: "मान लो 2% विलयन के x लीटर मिलाए जाते हैं। कुल x + 640 लीटर में उपस्थित अम्ल 2x + 8 × 640 भाग है। ऊपरी शर्त, मिश्रण 6% से नीचे, देती है 2x + 5120 < 6x + 3840, अतः 4x > 1280 और x > 320. निचली शर्त, 4% से ऊपर, देती है 2x + 5120 > 4x + 2560, अतः x < 1280. अतः अनुमत परास 320 < x < 1280 है, और उसमें सबसे छोटी पूर्ण संख्या 321. ध्यान दो कि हर शर्त ने कौन-सा सिरा बनाया: मिश्रण को कमज़ोर करने को तनु विलयन अधिक चाहिए, अतः 6% की छत निचली सीमा बनाती है और 4% का फ़र्श ऊपरी। इस जोड़ी को उलट देना ही मुख्य जाल है, और जाँच एक समझ-परीक्षा है — कुछ भी न मिलाने पर मिश्रण 8% पर रहता, जो दोनों सीमाओं से ऊपर है, अतः निचली सीमा का धनात्मक होना ज़रूरी था। (320 सीमा देता है, जिसे कठोर असमिका बाहर रखती है।)",
          mr: "समजा 2% द्रावणाचे x लिटर मिसळले जातात. एकूण x + 640 लिटरात असलेले आम्ल 2x + 8 × 640 भाग आहे. वरची अट, मिश्रण 6% खाली, देते 2x + 5120 < 6x + 3840, म्हणून 4x > 1280 आणि x > 320. खालची अट, 4% वर, देते 2x + 5120 > 4x + 2560, म्हणून x < 1280. म्हणून अनुज्ञेय पल्ला 320 < x < 1280, आणि त्यातली सर्वांत लहान पूर्ण संख्या 321. लक्षात घ्या की प्रत्येक अटीने कोणते टोक बनवले: मिश्रण दुर्बळ करण्यास विरळ द्रावण अधिक लागते, म्हणून 6% चे छत खालची मर्यादा बनवते आणि 4% ची जमीन वरची. ही जोडी उलटवणे हाच मुख्य सापळा, आणि तपासणी ही समजून-परीक्षा — काहीही न मिसळल्यास मिश्रण 8% वर राहिले असते, जे दोन्ही मर्यादांहून वर आहे, म्हणून खालची मर्यादा धन असणे आवश्यक होते. (320 सीमा देते, जिला कठोर असमानता वगळते.)",
        },
        fmt: unit("litres"),
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "IQ is 100 × MA/CA, where MA is mental age and CA is chronological age. For a group of 12-year-olds whose IQ lies between 80 and 140, what is the LEAST possible mental age in years?",
          hi: "IQ = 100 × MA/CA है, जहाँ MA मानसिक आयु और CA कालानुक्रमिक आयु है। 12 वर्ष के उस समूह के लिए जिसका IQ 80 और 140 के बीच है, न्यूनतम संभव मानसिक आयु वर्षों में कितनी है?",
          mr: "IQ = 100 × MA/CA आहे, जिथे MA ही मानसिक वये आणि CA ही कालानुक्रमिक वये. 12 वर्षांच्या त्या गटासाठी ज्याचा IQ 80 आणि 140 दरम्यान आहे, किमान शक्य मानसिक वय वर्षांत किती?",
        },
        answer: 9.6,
        wrong: [9.4, 16.8, 12],
        checkExpr: "80*12/100",
        solution: {
          en: "Rearrange the definition to make MA the subject: MA = IQ × CA/100. With CA fixed at 12, the least mental age comes from the least IQ: 80 × 12/100 = 9.6 years. The other end gives 140 × 12/100 = 16.8, so the range is 9.6 to 16.8 years. Two things are worth taking from this. Because MA depends on IQ through a positive multiplier, the smaller IQ produces the smaller MA and the inequality keeps its direction throughout — had the relationship been a reciprocal, the ends would have swapped. And the answer need not be a whole number of years; a mental age is a measured quantity, not a count of birthdays. (16.8 answers the greatest instead of the least.)",
          hi: "परिभाषा को इस तरह जमाओ कि MA विषय बने: MA = IQ × CA/100. CA 12 पर स्थिर रहते हुए, न्यूनतम मानसिक आयु न्यूनतम IQ से आती है: 80 × 12/100 = 9.6 वर्ष। दूसरा सिरा देता है 140 × 12/100 = 16.8, अतः परास 9.6 से 16.8 वर्ष है। इससे दो बातें लेने योग्य हैं। चूँकि MA, IQ पर एक धनात्मक गुणक से निर्भर है, छोटा IQ छोटा MA बनाता है और असमिका पूरे समय अपनी दिशा बनाए रखती है — यदि संबंध व्युत्क्रम होता, तो सिरे बदल जाते। और उत्तर का पूर्ण वर्षों में होना ज़रूरी नहीं; मानसिक आयु मापी गई राशि है, जन्मदिनों की गिनती नहीं। (16.8 न्यूनतम के बजाय अधिकतम का उत्तर देता है।)",
          mr: "व्याख्या अशी मांडा की MA विषय बनेल: MA = IQ × CA/100. CA 12 वर स्थिर असताना, किमान मानसिक वय किमान IQ मधून येते: 80 × 12/100 = 9.6 वर्षे. दुसरे टोक देते 140 × 12/100 = 16.8, म्हणून पल्ला 9.6 ते 16.8 वर्षे. यातून दोन गोष्टी घेण्याजोग्या. MA हा IQ वर एका धन गुणकाने अवलंबून असल्याने, लहान IQ लहान MA बनवतो आणि असमानता अख्खा वेळ आपली दिशा टिकवते — संबंध व्यस्त असता, तर टोके बदलली असती. आणि उत्तर पूर्ण वर्षांत असणे आवश्यक नाही; मानसिक वय ही मोजलेली राशी आहे, वाढदिवसांची मोजणी नव्हे. (16.8 किमानऐवजी कमालचे उत्तर देते.)",
        },
        fmt: unit("years"),
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A solution must be kept between 68°F and 77°F. Using C = 5(F − 32)/9, what is the upper limit of the range in degrees Celsius?",
          hi: "किसी विलयन को 68°F और 77°F के बीच रखना है। C = 5(F − 32)/9 काम में लेकर, परास की ऊपरी सीमा सेल्सियस में कितनी है?",
          mr: "एखादे द्रावण 68°F आणि 77°F दरम्यान ठेवायचे आहे. C = 5(F − 32)/9 वापरून, पल्ल्याची वरची मर्यादा सेल्सियसमध्ये किती?",
        },
        answer: 25,
        wrong: [20, 45, 30],
        checkExpr: "5*(77-32)/9",
        solution: {
          en: "Convert each end separately: 5 × (68 − 32)/9 = 20 and 5 × (77 − 32)/9 = 25, so the range is 20°C to 25°C and the upper limit is 25. The conversion has a positive multiplier, so the order of the two ends is preserved and the larger Fahrenheit value stays the larger Celsius one. That is worth stating because it is not automatic — any conversion involving a negative factor would reverse the inequality, and the two ends would have to swap places. Note also that the subtraction of 32 must happen before the multiplication by 5/9; doing it the other way round is the arithmetic slip that produces 45. (45 multiplies before subtracting the 32.)",
          hi: "हर सिरा अलग-अलग बदलो: 5 × (68 − 32)/9 = 20 और 5 × (77 − 32)/9 = 25, अतः परास 20°C से 25°C है और ऊपरी सीमा 25. रूपांतरण का गुणक धनात्मक है, अतः दोनों सिरों का क्रम बना रहता है और बड़ा फ़ारेनहाइट मान बड़ा सेल्सियस ही रहता है। यह कहने योग्य है क्योंकि वह अपने आप नहीं होता — ऋणात्मक गुणक वाला कोई भी रूपांतरण असमिका पलट देता और दोनों सिरों को जगह बदलनी पड़ती। यह भी ध्यान दो कि 32 का घटाव 5/9 से गुणा करने से पहले होना चाहिए; उलटा करना वही अंकगणितीय चूक है जो 45 बनाती है। (45 32 घटाने से पहले गुणा कर देता है।)",
          mr: "प्रत्येक टोक वेगवेगळे बदला: 5 × (68 − 32)/9 = 20 आणि 5 × (77 − 32)/9 = 25, म्हणून पल्ला 20°C ते 25°C आणि वरची मर्यादा 25. रूपांतरणाचा गुणक धन आहे, म्हणून दोन्ही टोकांचा क्रम टिकतो आणि मोठे फॅरनहाइट मूल्य मोठे सेल्सियसच राहते. हे सांगण्याजोगे कारण ते आपोआप घडत नाही — ऋण गुणक असलेले कोणतेही रूपांतर असमानता उलटवले असते आणि दोन्ही टोकांना जागा बदलावी लागली असती. हेही लक्षात घ्या की 32 ची वजाबाकी 5/9 ने गुणण्याआधी व्हायला हवी; उलटे करणे हीच ती अंकगणिती चूक जी 45 बनवते. (45 32 वजा करण्याआधी गुणते.)",
        },
        fmt: unit("°C"),
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-linear-inequalities",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 5 — Linear Inequalities",
      name: "Linear Inequalities",
      summary:
        "The first equations whose answer is a range rather than a number: dividing by a negative that turns the sign around, a solution set that has to be reported as the largest or smallest whole number in it, and word problems where the question is not what the length is but how long it is allowed to be.",
      position: 5,
      translations: {
        hi: {
          name: "रैखिक असमिकाएँ",
          summary:
            "पहले ऐसे समीकरण जिनका उत्तर संख्या नहीं, परास है: ऋणात्मक से भाग जो चिह्न पलट देता है, ऐसा हल-समुच्चय जिसे उसमें की सबसे बड़ी या सबसे छोटी पूर्ण संख्या के रूप में बताना पड़ता है, और वे शब्द-प्रश्न जहाँ पूछा यह नहीं जाता कि लंबाई कितनी है बल्कि यह कि कितनी होने की छूट है।",
        },
        mr: {
          name: "रेषीय असमानता",
          summary:
            "पहिली अशी समीकरणे ज्यांचे उत्तर संख्या नव्हे, पल्ला आहे: ऋणाने भागाकार जो चिन्ह उलटवतो, असा उत्तर-संच जो त्यातल्या सर्वांत मोठ्या वा सर्वांत लहान पूर्ण संख्येच्या रूपात सांगावा लागतो, आणि ते शब्द-प्रश्न जिथे विचारले जाते ते लांबी किती आहे हे नव्हे तर किती असण्याची मुभा आहे हे.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 6 — Permutations and Combinations (counting without listing)      */
/* ------------------------------------------------------------------------- */
function permutations11(): TopicFileOut {
  const rand = rng("maths-11-permutations-and-combinations");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the value of 5! ?",
          hi: "5! का मान क्या है?",
          mr: "5! चे मूल्य किती?",
        },
        answer: 120,
        wrong: [25, 20, 60],
        checkExpr: "5*4*3*2*1",
        solution: {
          en: "The factorial multiplies every whole number from 5 down to 1: 5 × 4 × 3 × 2 × 1 = 120. It counts the arrangements of five distinct objects, which is why it grows so fast — 10! is already over three million. (25 squares the number instead of multiplying the chain.)",
          hi: "क्रमगुणित 5 से नीचे 1 तक हर पूर्ण संख्या को गुणा करता है: 5 × 4 × 3 × 2 × 1 = 120. वह पाँच भिन्न वस्तुओं की व्यवस्थाएँ गिनता है, इसीलिए वह इतनी तेज़ी से बढ़ता है — 10! पहले ही तीस लाख से ऊपर है। (25 शृंखला गुणा करने के बजाय संख्या का वर्ग कर देता है।)",
          mr: "क्रमगुणित 5 पासून खाली 1 पर्यंत प्रत्येक पूर्ण संख्या गुणतो: 5 × 4 × 3 × 2 × 1 = 120. तो पाच वेगळ्या वस्तूंच्या मांडण्या मोजतो, म्हणूनच तो इतक्या वेगाने वाढतो — 10! आधीच तीस लाखांहून वर आहे. (25 साखळी गुणण्याऐवजी संख्येचा वर्ग करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "In how many ways can 4 different books be arranged in a row on a shelf?",
          hi: "4 भिन्न पुस्तकों को किसी ताक़ पर एक क़तार में कितने तरीक़ों से जमाया जा सकता है?",
          mr: "4 वेगवेगळी पुस्तके एका फळीवर रांगेत किती प्रकारे मांडता येतील?",
        },
        answer: 24,
        wrong: [16, 12, 8],
        checkExpr: "4*3*2*1",
        solution: {
          en: "There are 4 books to choose for the first place, 3 left for the second, 2 for the third and 1 for the last: 4 × 3 × 2 × 1 = 24. Each choice removes one option from the next, which is exactly what makes this a factorial rather than a power. (16 uses 4 choices at every place, which would be right only if books could repeat.)",
          hi: "पहले स्थान के लिए 4 पुस्तकें, दूसरे के लिए बची 3, तीसरे के लिए 2 और अंतिम के लिए 1: 4 × 3 × 2 × 1 = 24. हर चुनाव अगले से एक विकल्प हटा देता है, और ठीक यही इसे घात नहीं, क्रमगुणित बनाता है। (16 हर स्थान पर 4 विकल्प लेता है, जो तभी ठीक होता जब पुस्तकें दोहराई जा सकतीं।)",
          mr: "पहिल्या जागेसाठी 4 पुस्तके, दुसऱ्यासाठी उरलेली 3, तिसऱ्यासाठी 2 आणि शेवटच्यासाठी 1: 4 × 3 × 2 × 1 = 24. प्रत्येक निवड पुढच्यातून एक पर्याय काढते, आणि नेमके हेच याला घात नव्हे, क्रमगुणित बनवते. (16 प्रत्येक जागी 4 पर्याय घेते, जे पुस्तके पुन्हा वापरता आली असती तरच बरोबर.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "In how many ways can 2 pupils be chosen from a group of 6?",
          hi: "6 के समूह से 2 विद्यार्थी कितने तरीक़ों से चुने जा सकते हैं?",
          mr: "6 च्या गटातून 2 विद्यार्थी किती प्रकारे निवडता येतील?",
        },
        answer: 15,
        wrong: [30, 12, 36],
        checkExpr: "6*5/2",
        solution: {
          en: "There are 6 × 5 = 30 ways to pick a first and a second pupil, but choosing Asha then Bina gives the same PAIR as choosing Bina then Asha, so every pair has been counted twice: 30/2 = 15. Dividing out the double count is the only thing that separates a combination from a permutation. (30 counts ordered pairs and never divides.)",
          hi: "पहला और दूसरा विद्यार्थी चुनने के 6 × 5 = 30 तरीक़े हैं, पर पहले आशा फिर बीना चुनना वही युग्म देता है जो पहले बीना फिर आशा, अतः हर युग्म दो बार गिना गया: 30/2 = 15. दोहरी गिनती को भाग देकर हटाना ही इकलौती बात है जो संचय को क्रमचय से अलग करती है। (30 क्रमित युग्म गिनता है और भाग देता ही नहीं।)",
          mr: "पहिला आणि दुसरा विद्यार्थी निवडण्याचे 6 × 5 = 30 मार्ग आहेत, पण आधी आशा मग बीना निवडणे तीच जोडी देते जी आधी बीना मग आशा, म्हणून प्रत्येक जोडी दोनदा मोजली गेली: 30/2 = 15. दुहेरी मोजणी भागाकाराने काढणे हीच एकमेव गोष्ट जी संचयाला क्रमचयापासून वेगळी करते. (30 क्रमित जोड्या मोजते आणि भागतच नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the value of ⁷P₂ ?",
          hi: "⁷P₂ का मान क्या है?",
          mr: "⁷P₂ चे मूल्य किती?",
        },
        answer: 42,
        wrong: [21, 14, 49],
        checkExpr: "7*6",
        solution: {
          en: "A permutation of 2 objects from 7 fills two ordered places: 7 choices then 6, so 7 × 6 = 42. The general shape is that ⁿPᵣ is r factors counted down from n — no more and no fewer — so ⁷P₂ needs exactly two of them. (21 divides by 2, which would turn the permutation into the combination ⁷C₂.)",
          hi: "7 में से 2 वस्तुओं का क्रमचय दो क्रमित स्थान भरता है: 7 विकल्प फिर 6, अतः 7 × 6 = 42. सामान्य आकार यह है कि ⁿPᵣ में n से नीचे गिनते r गुणनखंड होते हैं — न अधिक न कम — अतः ⁷P₂ को ठीक दो चाहिए। (21 2 से भाग दे देता है, जो क्रमचय को संचय ⁷C₂ बना देता।)",
          mr: "7 पैकी 2 वस्तूंचा क्रमचय दोन क्रमित जागा भरतो: 7 पर्याय मग 6, म्हणून 7 × 6 = 42. सामान्य आकार असा की ⁿPᵣ मध्ये n पासून खाली मोजत r अवयव असतात — ना अधिक ना कमी — म्हणून ⁷P₂ ला नेमके दोन लागतात. (21 2 ने भागते, जे क्रमचयाला संचय ⁷C₂ बनवले असते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many 3-digit numbers can be formed from the digits 1, 2, 3, 4, 5 if no digit is repeated?",
          hi: "अंक 1, 2, 3, 4, 5 से कितनी 3-अंकीय संख्याएँ बन सकती हैं यदि कोई अंक दोहराया न जाए?",
          mr: "अंक 1, 2, 3, 4, 5 पासून किती 3-अंकी संख्या बनू शकतात जर कोणताही अंक पुनरावृत्त होत नसेल?",
        },
        answer: 60,
        wrong: [125, 15, 10],
        checkExpr: "5*4*3",
        solution: {
          en: "Fill the places left to right: 5 digits for the hundreds, 4 remaining for the tens, 3 for the units — 5 × 4 × 3 = 60. Order matters here because 123 and 321 are different numbers, so this is a permutation and nothing gets divided out. (125 allows repetition, giving 5 × 5 × 5.)",
          hi: "स्थान बाएँ से दाएँ भरो: सैकड़े के लिए 5 अंक, दहाई के लिए बचे 4, इकाई के लिए 3 — 5 × 4 × 3 = 60. यहाँ क्रम मायने रखता है क्योंकि 123 और 321 भिन्न संख्याएँ हैं, अतः यह क्रमचय है और कुछ भाग देकर हटाया नहीं जाता। (125 दोहराव की छूट देता है, जिससे 5 × 5 × 5.)",
          mr: "जागा डावीकडून उजवीकडे भरा: शतकासाठी 5 अंक, दशकासाठी उरलेले 4, एककासाठी 3 — 5 × 4 × 3 = 60. इथे क्रम महत्त्वाचा कारण 123 आणि 321 वेगळ्या संख्या आहेत, म्हणून हा क्रमचय आणि काहीही भागाकाराने काढले जात नाही. (125 पुनरावृत्तीची मुभा देते, ज्यातून 5 × 5 × 5.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the value of ⁸C₃ ?",
          hi: "⁸C₃ का मान क्या है?",
          mr: "⁸C₃ चे मूल्य किती?",
        },
        answer: 56,
        wrong: [336, 24, 112],
        checkExpr: "8*7*6/(3*2*1)",
        solution: {
          en: "Take three factors counting down from 8 and divide by 3!: (8 × 7 × 6)/(3 × 2 × 1) = 336/6 = 56. The division removes the 6 different orders in which the same three people could have been picked. A useful check is that ⁸C₃ must equal ⁸C₅, since choosing three to include is the same as choosing five to leave out. (336 gives ⁸P₃ and forgets to divide by 3!.)",
          hi: "8 से नीचे गिनते तीन गुणनखंड लो और 3! से भाग दो: (8 × 7 × 6)/(3 × 2 × 1) = 336/6 = 56. भाग वे 6 भिन्न क्रम हटा देता है जिनमें वही तीन लोग चुने जा सकते थे। एक उपयोगी जाँच यह है कि ⁸C₃ को ⁸C₅ के बराबर होना चाहिए, क्योंकि तीन को भीतर लेना पाँच को बाहर छोड़ना ही है। (336 ⁸P₃ देता है और 3! से भाग देना भूल जाता है।)",
          mr: "8 पासून खाली मोजत तीन अवयव घ्या आणि 3! ने भागा: (8 × 7 × 6)/(3 × 2 × 1) = 336/6 = 56. भागाकार ते 6 वेगळे क्रम काढतो ज्यांत तीच तीन माणसे निवडली गेली असती. एक उपयुक्त तपासणी अशी की ⁸C₃ हे ⁸C₅ इतके असावे, कारण तिघांना आत घेणे म्हणजे पाचांना बाहेर सोडणेच. (336 ⁸P₃ देते आणि 3! ने भागणे विसरते.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "In how many ways can a committee of 3 be formed from 10 people?",
          hi: "10 लोगों में से 3 की समिति कितने तरीक़ों से बनाई जा सकती है?",
          mr: "10 लोकांतून 3 जणांची समिती किती प्रकारे बनवता येईल?",
        },
        answer: 120,
        wrong: [720, 30, 1000],
        checkExpr: "10*9*8/(3*2*1)",
        solution: {
          en: "A committee has no first or second member, so order does not matter: (10 × 9 × 8)/(3 × 2 × 1) = 720/6 = 120. The single question to ask before choosing a formula is whether swapping two of the chosen people would give a different outcome. For a committee it would not; for a president and a secretary it would, and then the answer would be 720. (720 counts ordered selections, which is the answer to a different question.)",
          hi: "समिति में पहला या दूसरा सदस्य नहीं होता, अतः क्रम मायने नहीं रखता: (10 × 9 × 8)/(3 × 2 × 1) = 720/6 = 120. सूत्र चुनने से पहले पूछने का इकलौता प्रश्न यह है कि चुने गए दो लोगों को अदल-बदल देने से परिणाम बदलेगा या नहीं। समिति के लिए नहीं बदलेगा; अध्यक्ष और सचिव के लिए बदलेगा, और तब उत्तर 720 होता। (720 क्रमित चयन गिनता है, जो दूसरे प्रश्न का उत्तर है।)",
          mr: "समितीत पहिला वा दुसरा सदस्य नसतो, म्हणून क्रम महत्त्वाचा नाही: (10 × 9 × 8)/(3 × 2 × 1) = 720/6 = 120. सूत्र निवडण्याआधी विचारण्याचा एकमेव प्रश्न असा की निवडलेल्या दोघांची अदलाबदल केल्याने निकाल बदलेल का. समितीसाठी बदलणार नाही; अध्यक्ष आणि सचिवासाठी बदलेल, आणि तेव्हा उत्तर 720 झाले असते. (720 क्रमित निवडी मोजते, जे वेगळ्या प्रश्नाचे उत्तर.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "How many distinct arrangements are there of the letters of the word LEVEL?",
          hi: "शब्द LEVEL के अक्षरों की कितनी भिन्न व्यवस्थाएँ हैं?",
          mr: "LEVEL या शब्दाच्या अक्षरांच्या किती वेगळ्या मांडण्या आहेत?",
        },
        answer: 30,
        wrong: [120, 60, 20],
        checkExpr: "5*4*3*2*1/(2*2)",
        solution: {
          en: "There are 5 letters, so 5! = 120 arrangements if all were different — but the two L's can be swapped without changing anything, and so can the two E's. Divide by 2! for each: 120/(2 × 2) = 30. Repeated letters are the same double-counting problem as an unordered committee, wearing a different hat. (120 treats all five letters as distinct.)",
          hi: "5 अक्षर हैं, अतः सब भिन्न होते तो 5! = 120 व्यवस्थाएँ — पर दोनों L बिना कुछ बदले अदल-बदल सकते हैं, और दोनों E भी। हर एक के लिए 2! से भाग दो: 120/(2 × 2) = 30. दोहराए गए अक्षर वही दोहरी-गिनती की समस्या हैं जो अक्रमित समिति की है, बस दूसरी टोपी पहने। (120 पाँचों अक्षरों को भिन्न मान लेता है।)",
          mr: "5 अक्षरे आहेत, म्हणून सर्व वेगळी असती तर 5! = 120 मांडण्या — पण दोन्ही L काहीही न बदलता अदलाबदल करू शकतात, आणि दोन्ही E सुद्धा. प्रत्येकासाठी 2! ने भागा: 120/(2 × 2) = 30. पुनरावृत्त अक्षरे हीच दुहेरी-मोजणीची अडचण जी अक्रमित समितीची आहे, फक्त दुसरी टोपी घालून. (120 पाचही अक्षरे वेगळी मानते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "In how many ways can 7 people be seated around a circular table?",
          hi: "7 लोगों को गोल मेज़ के चारों ओर कितने तरीक़ों से बिठाया जा सकता है?",
          mr: "7 लोकांना गोल टेबलाभोवती किती प्रकारे बसवता येईल?",
        },
        answer: 720,
        wrong: [5040, 120, 49],
        checkExpr: "6*5*4*3*2*1",
        solution: {
          en: "Around a circle there is no first seat, so rotating everyone by one place gives the same arrangement. Fix one person and arrange the other six relative to them: 6! = 720. In general n people in a circle give (n − 1)! arrangements, and the whole difference from a row is that a circle has no starting point. (5040 gives 7!, the answer for a straight row.)",
          hi: "गोल में कोई पहली कुर्सी नहीं होती, अतः सबको एक स्थान घुमा देने पर वही व्यवस्था मिलती है। एक व्यक्ति को स्थिर करो और बाक़ी छह को उसके सापेक्ष जमाओ: 6! = 720. सामान्यतः गोल में n लोग (n − 1)! व्यवस्थाएँ देते हैं, और क़तार से पूरा अंतर यही है कि गोल का कोई आरंभ-बिंदु नहीं। (5040 7! देता है, जो सीधी क़तार का उत्तर है।)",
          mr: "गोलात पहिली खुर्ची नसते, म्हणून सर्वांना एक जागा फिरवल्यावर तीच मांडणी मिळते. एका व्यक्तीला स्थिर करा आणि उरलेल्या सहांना तिच्या सापेक्ष मांडा: 6! = 720. सामान्यतः गोलात n माणसे (n − 1)! मांडण्या देतात, आणि रांगेहून अख्खा फरक हाच की गोलाला आरंभबिंदू नाही. (5040 7! देते, जे सरळ रांगेचे उत्तर.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "From 5 men and 4 women, how many committees of 3 can be formed containing exactly 2 men?",
          hi: "5 पुरुषों और 4 स्त्रियों में से 3 की कितनी समितियाँ बनाई जा सकती हैं जिनमें ठीक 2 पुरुष हों?",
          mr: "5 पुरुष आणि 4 स्त्रियांतून 3 जणांच्या किती समित्या बनवता येतील ज्यांत नेमके 2 पुरुष असतील?",
        },
        answer: 40,
        wrong: [60, 20, 84],
        checkExpr: "5*4/2*4",
        solution: {
          en: "Choose the men and the women separately, then multiply: ⁵C₂ = 10 ways to pick two men, ⁴C₁ = 4 ways to pick one woman, giving 10 × 4 = 40. Multiplying is right because every choice of men can go with every choice of women — the two decisions are independent. Note that the word EXACTLY does real work: without it you would have to add the cases of three men, two men, one man and none, which comes to ⁹C₃ = 84. (84 counts every committee of three regardless of composition.)",
          hi: "पुरुष और स्त्रियाँ अलग-अलग चुनो, फिर गुणा करो: दो पुरुष चुनने के ⁵C₂ = 10 तरीक़े, एक स्त्री चुनने के ⁴C₁ = 4, जिससे 10 × 4 = 40. गुणा इसलिए ठीक है कि पुरुषों का हर चुनाव स्त्रियों के हर चुनाव के साथ जा सकता है — दोनों निर्णय स्वतंत्र हैं। ध्यान दो कि ठीक शब्द असली काम करता है: उसके बिना तीन पुरुष, दो, एक और शून्य के मामले जोड़ने पड़ते, जो ⁹C₃ = 84 बनता है। (84 संरचना की परवाह किए बिना तीन की हर समिति गिनता है।)",
          mr: "पुरुष आणि स्त्रिया वेगवेगळ्या निवडा, मग गुणा: दोन पुरुष निवडण्याचे ⁵C₂ = 10 मार्ग, एक स्त्री निवडण्याचे ⁴C₁ = 4, ज्यातून 10 × 4 = 40. गुणाकार यासाठी बरोबर की पुरुषांची प्रत्येक निवड स्त्रियांच्या प्रत्येक निवडीसोबत जाऊ शकते — दोन्ही निर्णय स्वतंत्र आहेत. लक्षात घ्या की नेमके हा शब्द खरे काम करतो: त्याविना तीन पुरुष, दोन, एक आणि शून्य ही प्रकरणे जोडावी लागली असती, जे ⁹C₃ = 84 बनते. (84 रचनेची पर्वा न करता तिघांची प्रत्येक समिती मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "How many 4-letter arrangements can be made from the 8 distinct letters of EQUATION if no letter is repeated?",
          hi: "EQUATION के 8 भिन्न अक्षरों से 4-अक्षरी कितनी व्यवस्थाएँ बन सकती हैं यदि कोई अक्षर दोहराया न जाए?",
          mr: "EQUATION च्या 8 वेगळ्या अक्षरांतून 4-अक्षरी किती मांडण्या बनू शकतील जर कोणतेही अक्षर पुनरावृत्त होत नसेल?",
        },
        answer: 1680,
        wrong: [70, 4096, 336],
        checkExpr: "8*7*6*5",
        solution: {
          en: "Four ordered places, filled from eight letters without repetition: 8 × 7 × 6 × 5 = 1680, which is ⁸P₄. The word ARRANGEMENTS is the signal that order counts — had the question asked how many SETS of four letters could be chosen, the answer would be ⁸C₄ = 70, smaller by the 24 orderings of each set. (70 answers the combination question instead of the permutation one.)",
          hi: "चार क्रमित स्थान, आठ अक्षरों से बिना दोहराव भरे: 8 × 7 × 6 × 5 = 1680, जो ⁸P₄ है। व्यवस्थाएँ शब्द ही संकेत है कि क्रम गिना जाता है — यदि प्रश्न पूछता कि चार अक्षरों के कितने समुच्चय चुने जा सकते हैं, तो उत्तर ⁸C₄ = 70 होता, हर समुच्चय के 24 क्रमों जितना छोटा। (70 क्रमचय के बजाय संचय वाले प्रश्न का उत्तर देता है।)",
          mr: "चार क्रमित जागा, आठ अक्षरांतून पुनरावृत्तीविना भरलेल्या: 8 × 7 × 6 × 5 = 1680, जे ⁸P₄ आहे. मांडण्या हा शब्दच संकेत की क्रम मोजला जातो — प्रश्नाने चार अक्षरांचे किती संच निवडता येतील असे विचारले असते, तर उत्तर ⁸C₄ = 70 झाले असते, प्रत्येक संचाच्या 24 क्रमांइतके लहान. (70 क्रमचयाऐवजी संचयाच्या प्रश्नाचे उत्तर देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "In how many ways can 5 boys and 3 girls sit in a row so that no two girls are next to each other?",
          hi: "5 लड़के और 3 लड़कियाँ एक क़तार में कितने तरीक़ों से बैठ सकते हैं कि कोई दो लड़कियाँ साथ-साथ न हों?",
          mr: "5 मुले आणि 3 मुली एका रांगेत किती प्रकारे बसू शकतील की कोणत्याही दोन मुली शेजारी नसतील?",
        },
        answer: 14400,
        wrong: [720, 2880, 40320],
        checkExpr: "5*4*3*2*1*6*5*4",
        solution: {
          en: "Seat the boys first: 5! = 120 ways. That creates 6 gaps — one at each end and four between them — and the girls must go into different gaps, which is ⁶P₃ = 6 × 5 × 4 = 120 ways. Multiply: 120 × 120 = 14400. The technique is worth naming: when a condition forbids two things from touching, arrange everything else first and drop the restricted items into the gaps that arrangement creates. (40320 gives 8!, the count with no restriction at all.)",
          hi: "पहले लड़कों को बिठाओ: 5! = 120 तरीक़े। इससे 6 अंतराल बनते हैं — हर सिरे पर एक और बीच में चार — और लड़कियों को भिन्न अंतरालों में जाना है, जो ⁶P₃ = 6 × 5 × 4 = 120 तरीक़े हैं। गुणा करो: 120 × 120 = 14400. तकनीक का नाम लेने योग्य है: जब कोई शर्त दो चीज़ों को छूने से रोके, पहले बाक़ी सब जमाओ और प्रतिबंधित वस्तुओं को उस व्यवस्था से बने अंतरालों में गिरा दो। (40320 8! देता है, जो बिना किसी प्रतिबंध की गिनती है।)",
          mr: "आधी मुलांना बसवा: 5! = 120 मार्ग. यातून 6 फटी बनतात — प्रत्येक टोकाला एक आणि मध्ये चार — आणि मुलींना वेगवेगळ्या फटींत जायचे आहे, जे ⁶P₃ = 6 × 5 × 4 = 120 मार्ग. गुणा: 120 × 120 = 14400. तंत्राचे नाव घेण्याजोगे: जेव्हा एखादी अट दोन गोष्टींना स्पर्श करण्यापासून रोखते, तेव्हा आधी बाकी सारे मांडा आणि निर्बंधित वस्तू त्या मांडणीतून बनलेल्या फटींत टाका. (40320 8! देते, जी कोणत्याही निर्बंधाविनाची मोजणी.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "How many diagonals does a polygon with 10 sides have?",
          hi: "10 भुजाओं वाले बहुभुज में कितने विकर्ण होते हैं?",
          mr: "10 बाजू असलेल्या बहुभुजात किती कर्ण असतात?",
        },
        answer: 35,
        wrong: [45, 20, 90],
        checkExpr: "10*9/2-10",
        solution: {
          en: "Every pair of vertices joins to make a straight segment, and there are ¹⁰C₂ = 45 such pairs. But 10 of those segments are the sides of the polygon rather than diagonals, so 45 − 10 = 35. The whole method is to count something easy and then subtract what should not have been counted — which is far quicker than trying to enumerate diagonals directly, and generalises to n(n − 3)/2 for any polygon. (45 counts every segment, sides included.)",
          hi: "शीर्षों का हर युग्म जुड़कर एक सरल खंड बनाता है, और ऐसे ¹⁰C₂ = 45 युग्म हैं। पर उनमें से 10 खंड विकर्ण नहीं, बहुभुज की भुजाएँ हैं, अतः 45 − 10 = 35. पूरी विधि यह है कि कोई आसान चीज़ गिनो और फिर वह घटा दो जिसे गिना नहीं जाना चाहिए था — जो विकर्ण सीधे गिनने की कोशिश से कहीं तेज़ है, और किसी भी बहुभुज के लिए n(n − 3)/2 बन जाता है। (45 भुजाओं सहित हर खंड गिनता है।)",
          mr: "शिरोबिंदूंची प्रत्येक जोडी जुळून एक सरळ खंड बनवते, आणि असे ¹⁰C₂ = 45 जोड्या आहेत. पण त्यांपैकी 10 खंड कर्ण नव्हे, बहुभुजाच्या बाजू आहेत, म्हणून 45 − 10 = 35. अख्खी पद्धत अशी की काहीतरी सोपे मोजा आणि मग जे मोजायला नको होते ते वजा करा — जे कर्ण थेट मोजण्याच्या प्रयत्नाहून कितीतरी वेगवान, आणि कोणत्याही बहुभुजासाठी n(n − 3)/2 बनते. (45 बाजूंसह प्रत्येक खंड मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "How many distinct arrangements are there of the letters of the word ALLAHABAD?",
          hi: "शब्द ALLAHABAD के अक्षरों की कितनी भिन्न व्यवस्थाएँ हैं?",
          mr: "ALLAHABAD या शब्दाच्या अक्षरांच्या किती वेगळ्या मांडण्या आहेत?",
        },
        answer: 7560,
        wrong: [362880, 15120, 3780],
        checkExpr: "9*8*7*6*5*4*3*2*1/(24*2)",
        solution: {
          en: "The word has 9 letters, of which A appears 4 times and L appears twice, while H, B and D appear once each. Were all nine distinct there would be 9! = 362880 arrangements; but the four A's can be permuted among themselves in 4! = 24 ways without changing the word, and the two L's in 2! = 2 ways. Divide both out: 362880/(24 × 2) = 362880/48 = 7560. Two habits make this safe. Count the letters before anything else — nine, not eight, since it is easy to miss a repeat. And divide by the factorial of each repeat COUNT, not by the count itself; dividing by 4 × 2 instead of 24 × 2 gives 45360 and is the commonest error here. (362880 treats all nine letters as different.)",
          hi: "शब्द में 9 अक्षर हैं, जिनमें A चार बार आता है और L दो बार, जबकि H, B और D एक-एक बार। नौ भिन्न होते तो 9! = 362880 व्यवस्थाएँ होतीं; पर चारों A आपस में 4! = 24 तरीक़ों से बदल सकते हैं बिना शब्द बदले, और दोनों L 2! = 2 तरीक़ों से। दोनों भाग देकर हटाओ: 362880/(24 × 2) = 362880/48 = 7560. दो आदतें इसे सुरक्षित बनाती हैं। किसी और चीज़ से पहले अक्षर गिनो — नौ, आठ नहीं, क्योंकि कोई दोहराव छूट जाना आसान है। और हर दोहराव की गिनती के क्रमगुणित से भाग दो, गिनती से नहीं; 24 × 2 के बजाय 4 × 2 से भाग देने पर 45360 मिलता है और यही यहाँ की सबसे आम भूल है। (362880 नौों अक्षरों को भिन्न मान लेता है।)",
          mr: "शब्दात 9 अक्षरे आहेत, ज्यांत A चार वेळा येते आणि L दोनदा, तर H, B आणि D एकेकदा. नऊही वेगळी असती तर 9! = 362880 मांडण्या झाल्या असत्या; पण चारही A आपापसात 4! = 24 प्रकारे बदलू शकतात शब्द न बदलता, आणि दोन्ही L 2! = 2 प्रकारे. दोन्ही भागाकाराने काढा: 362880/(24 × 2) = 362880/48 = 7560. दोन सवयी हे सुरक्षित करतात. इतर कशाहीआधी अक्षरे मोजा — नऊ, आठ नव्हे, कारण एखादी पुनरावृत्ती निसटणे सोपे. आणि प्रत्येक पुनरावृत्तीच्या मोजणीच्या क्रमगुणिताने भागा, मोजणीने नव्हे; 24 × 2 ऐवजी 4 × 2 ने भागल्यास 45360 मिळते आणि हीच इथली सर्वांत सामान्य चूक. (362880 नऊही अक्षरे वेगळी मानते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-permutations-and-combinations",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 6 — Permutations and Combinations",
      name: "Permutations and Combinations",
      summary:
        "Counting arrangements too numerous to list, by multiplying the choices instead: the one question that decides everything is whether order matters, and after that it is a matter of dividing out the arrangements you have counted twice — of a committee that does not care who was picked first, or of two letters that look the same.",
      position: 6,
      translations: {
        hi: {
          name: "क्रमचय तथा संचय",
          summary:
            "इतनी अधिक व्यवस्थाएँ गिनना कि सूची बने ही नहीं, और वह भी विकल्पों को गुणा करके: सब कुछ तय करने वाला इकलौता प्रश्न यह है कि क्रम मायने रखता है या नहीं, और उसके बाद बात इतनी रह जाती है कि जो व्यवस्थाएँ दो बार गिनी गईं उन्हें भाग देकर हटा दो — उस समिति की जिसे परवाह नहीं कि पहले किसे चुना गया, या उन दो अक्षरों की जो एक जैसे दिखते हैं।",
        },
        mr: {
          name: "क्रमचय आणि संचय",
          summary:
            "यादी बनवता येणार नाहीत इतक्या मांडण्या मोजणे, आणि तेही पर्याय गुणून: सारे ठरवणारा एकमेव प्रश्न म्हणजे क्रम महत्त्वाचा आहे का, आणि त्यानंतर गोष्ट इतकीच उरते की दोनदा मोजल्या गेलेल्या मांडण्या भागाकाराने काढून टाका — त्या समितीच्या जिला आधी कोणाला निवडले याची पर्वा नाही, वा त्या दोन अक्षरांच्या जी सारखी दिसतात.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 7 — Binomial Theorem (a bracket expanded without expanding it)    */
/* ------------------------------------------------------------------------- */
function binomialTheorem11(): TopicFileOut {
  const rand = rng("maths-11-binomial-theorem");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many terms are there in the expansion of (a + b)⁷ ?",
          hi: "(a + b)⁷ के प्रसार में कितने पद हैं?",
          mr: "(a + b)⁷ च्या विस्तारात किती पदे आहेत?",
        },
        answer: 8,
        wrong: [7, 14, 6],
        checkExpr: "7+1",
        solution: {
          en: "The exponent of a runs from 7 down to 0, which is 8 values, so there are 7 + 1 = 8 terms. Counting from a zero rather than a one is the whole trap — the same reason a fence with 7 gaps needs 8 posts. (7 quotes the power and forgets the term in which a has vanished.)",
          hi: "a का घातांक 7 से नीचे 0 तक चलता है, जो 8 मान हैं, अतः 7 + 1 = 8 पद हैं। शून्य से गिनना, एक से नहीं, ही पूरा जाल है — वही कारण कि 7 अंतरालों की बाड़ को 8 खंभे चाहिए। (7 घात बता देता है और वह पद भूल जाता है जिसमें a लुप्त हो चुका है।)",
          mr: "a चा घातांक 7 पासून खाली 0 पर्यंत चालतो, जी 8 मूल्ये आहेत, म्हणून 7 + 1 = 8 पदे. शून्यापासून मोजणे, एकापासून नव्हे, हाच अख्खा सापळा — तेच कारण की 7 फटींच्या कुंपणाला 8 खांब लागतात. (7 घात सांगते आणि ते पद विसरते ज्यात a नाहीसा झाला आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the sum of all the binomial coefficients in the expansion of (1 + x)⁵ ?",
          hi: "(1 + x)⁵ के प्रसार के सभी द्विपद गुणांकों का योग क्या है?",
          mr: "(1 + x)⁵ च्या विस्तारातील सर्व द्विपद सहगुणकांची बेरीज किती?",
        },
        answer: 32,
        wrong: [10, 5, 25],
        checkExpr: "2*2*2*2*2",
        solution: {
          en: "Put x = 1 and every term collapses to its coefficient, so the sum is (1 + 1)⁵ = 2⁵ = 32. That substitution trick works for any binomial: the sum of the coefficients is always what the expression itself equals when every variable is set to 1. It also matches the counting story, since the coefficients are ⁵C₀ through ⁵C₅ and those add to the number of subsets of a 5-element set. (10 gives just the largest single coefficient, ⁵C₂.)",
          hi: "x = 1 रखो और हर पद अपने गुणांक पर सिमट जाता है, अतः योग (1 + 1)⁵ = 2⁵ = 32. वह प्रतिस्थापन-तरकीब किसी भी द्विपद पर चलती है: गुणांकों का योग सदा वही है जो हर चर को 1 रखने पर व्यंजक स्वयं बनता है। यह गिनती की कहानी से भी मेल खाता है, क्योंकि गुणांक ⁵C₀ से ⁵C₅ तक हैं और वे 5-अवयवी समुच्चय के उपसमुच्चयों की संख्या बनाते हैं। (10 केवल सबसे बड़ा अकेला गुणांक ⁵C₂ देता है।)",
          mr: "x = 1 ठेवा आणि प्रत्येक पद आपल्या सहगुणकावर येते, म्हणून बेरीज (1 + 1)⁵ = 2⁵ = 32. ती प्रतिस्थापन-युक्ती कोणत्याही द्विपदावर चालते: सहगुणकांची बेरीज नेहमी तीच जी प्रत्येक चलाला 1 ठेवल्यावर पदावली स्वतः बनते. हे मोजणीच्या कथेशीही जुळते, कारण सहगुणक ⁵C₀ पासून ⁵C₅ पर्यंत आहेत आणि ते 5-घटकी संचाच्या उपसंचांची संख्या बनवतात. (10 केवळ सर्वांत मोठा एकटा सहगुणक ⁵C₂ देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the coefficient of x² in the expansion of (1 + x)⁵ ?",
          hi: "(1 + x)⁵ के प्रसार में x² का गुणांक क्या है?",
          mr: "(1 + x)⁵ च्या विस्तारात x² चा सहगुणक किती?",
        },
        answer: 10,
        wrong: [20, 5, 25],
        checkExpr: "5*4/2",
        solution: {
          en: "The coefficient of xʳ in (1 + x)ⁿ is ⁿCᵣ, so here it is ⁵C₂ = (5 × 4)/2 = 10. The reason is pure counting: expanding the product means choosing x from two of the five brackets and 1 from the rest, and there are ⁵C₂ ways to decide which two. (20 gives ⁵P₂ and forgets that the brackets chosen have no order.)",
          hi: "(1 + x)ⁿ में xʳ का गुणांक ⁿCᵣ है, अतः यहाँ वह ⁵C₂ = (5 × 4)/2 = 10. कारण विशुद्ध गिनती है: गुणनफल खोलने का अर्थ है पाँच कोष्ठकों में से दो से x लेना और बाक़ी से 1, और कौन-से दो यह तय करने के ⁵C₂ तरीक़े हैं। (20 ⁵P₂ देता है और भूल जाता है कि चुने गए कोष्ठकों का कोई क्रम नहीं।)",
          mr: "(1 + x)ⁿ मध्ये xʳ चा सहगुणक ⁿCᵣ आहे, म्हणून इथे तो ⁵C₂ = (5 × 4)/2 = 10. कारण निव्वळ मोजणी: गुणाकार उलगडणे म्हणजे पाच कंसांपैकी दोघांतून x घेणे आणि बाकीच्यांतून 1, आणि कोणते दोन हे ठरवण्याचे ⁵C₂ मार्ग आहेत. (20 ⁵P₂ देते आणि निवडलेल्या कंसांना क्रम नाही हे विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "In the expansion of (a + b)⁸, which term is the middle one? Give its position number.",
          hi: "(a + b)⁸ के प्रसार में बीच का पद कौन-सा है? उसका स्थान-क्रमांक बताओ।",
          mr: "(a + b)⁸ च्या विस्तारात मधले पद कोणते? त्याचा जागा-क्रमांक सांगा.",
        },
        answer: 5,
        wrong: [4, 9, 8],
        checkExpr: "8/2+1",
        solution: {
          en: "There are 9 terms in all, and the middle of an odd number of terms is a single one: position 8/2 + 1 = 5. When the power is even there is exactly one middle term; when it is odd the count of terms is even and there are two middle terms instead. (4 halves the power and forgets that positions start at 1.)",
          hi: "कुल 9 पद हैं, और विषम संख्या के पदों का बीच एक ही होता है: स्थान 8/2 + 1 = 5. जब घात सम हो तो ठीक एक बीच का पद होता है; जब विषम हो तो पदों की गिनती सम होती है और बीच के पद दो होते हैं। (4 घात आधी कर देता है और भूल जाता है कि स्थान 1 से शुरू होते हैं।)",
          mr: "एकूण 9 पदे आहेत, आणि विषम संख्येच्या पदांचा मध्य एकच असतो: जागा 8/2 + 1 = 5. घात सम असेल तेव्हा नेमके एक मधले पद असते; विषम असेल तेव्हा पदांची मोजणी सम असते आणि मधली पदे दोन असतात. (4 घात निम्मी करते आणि जागा 1 पासून सुरू होतात हे विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the coefficient of x³ in the expansion of (1 + x)⁶ ?",
          hi: "(1 + x)⁶ के प्रसार में x³ का गुणांक क्या है?",
          mr: "(1 + x)⁶ च्या विस्तारात x³ चा सहगुणक किती?",
        },
        answer: 20,
        wrong: [15, 6, 120],
        checkExpr: "6*5*4/(3*2*1)",
        solution: {
          en: "The coefficient is ⁶C₃ = (6 × 5 × 4)/(3 × 2 × 1) = 120/6 = 20. This is the largest coefficient in the row, which is always the case when the power is even and the index sits exactly in the middle — the binomial coefficients rise to a peak and fall away symmetrically. (120 gives ⁶P₃ and never divides by 3!.)",
          hi: "गुणांक है ⁶C₃ = (6 × 5 × 4)/(3 × 2 × 1) = 120/6 = 20. यह पंक्ति का सबसे बड़ा गुणांक है, जो सदा तब होता है जब घात सम हो और सूचकांक ठीक बीच में बैठे — द्विपद गुणांक एक शिखर तक चढ़ते हैं और सममित रूप से उतर जाते हैं। (120 ⁶P₃ देता है और 3! से भाग देता ही नहीं।)",
          mr: "सहगुणक आहे ⁶C₃ = (6 × 5 × 4)/(3 × 2 × 1) = 120/6 = 20. हा ओळीतला सर्वांत मोठा सहगुणक, जे नेहमी तेव्हा घडते जेव्हा घात सम असते आणि निर्देशांक नेमका मध्यात बसतो — द्विपद सहगुणक एका शिखरापर्यंत चढतात आणि सममितपणे उतरतात. (120 ⁶P₃ देते आणि 3! ने भागतच नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "In the expansion of (a + b)⁹, what is the exponent of a in the 4th term?",
          hi: "(a + b)⁹ के प्रसार में चौथे पद में a का घातांक क्या है?",
          mr: "(a + b)⁹ च्या विस्तारात चौथ्या पदात a चा घातांक किती?",
        },
        answer: 6,
        wrong: [5, 4, 3],
        checkExpr: "9-3",
        solution: {
          en: "The general term is the (r + 1)th, carrying aⁿ⁻ʳbʳ, so the 4th term has r = 3 and the exponent of a is 9 − 3 = 6. The off-by-one between the term NUMBER and the value of r is where most marks go, and the check is easy: the two exponents must add to the power, and 6 + 3 = 9. (5 uses r = 4, reading the term number as r itself.)",
          hi: "व्यापक पद (r + 1)वाँ है, जो aⁿ⁻ʳbʳ ढोता है, अतः चौथे पद में r = 3 और a का घातांक 9 − 3 = 6. पद-संख्या और r के मान के बीच का एक का अंतर ही अधिकांश अंक खा जाता है, और जाँच आसान है: दोनों घातांक जुड़कर वही घात बनें, और 6 + 3 = 9. (5 r = 4 लेता है, पद-संख्या को ही r पढ़कर।)",
          mr: "व्यापक पद (r + 1)वे आहे, जे aⁿ⁻ʳbʳ वाहते, म्हणून चौथ्या पदात r = 3 आणि a चा घातांक 9 − 3 = 6. पद-संख्या आणि r चे मूल्य यांच्यातला एकाचा फरक बहुतांश गुण खातो, आणि तपासणी सोपी: दोन्ही घातांक जुळून तीच घात बनावी, आणि 6 + 3 = 9. (5 r = 4 घेते, पद-संख्येलाच r वाचून.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the coefficient of x³ in the expansion of (1 + x)⁸ ?",
          hi: "(1 + x)⁸ के प्रसार में x³ का गुणांक क्या है?",
          mr: "(1 + x)⁸ च्या विस्तारात x³ चा सहगुणक किती?",
        },
        answer: 56,
        wrong: [24, 336, 70],
        checkExpr: "8*7*6/(3*2*1)",
        solution: {
          en: "It is ⁸C₃ = (8 × 7 × 6)/(3 × 2 × 1) = 336/6 = 56. Worth noticing that this equals ⁸C₅, because choosing which three brackets supply an x is the same decision as choosing which five supply a 1 — every row of coefficients reads the same forwards and backwards. (70 is ⁸C₄, the peak of the row rather than the term asked for.)",
          hi: "वह ⁸C₃ = (8 × 7 × 6)/(3 × 2 × 1) = 336/6 = 56. ध्यान देने योग्य है कि यह ⁸C₅ के बराबर है, क्योंकि कौन-से तीन कोष्ठक x देंगे यह चुनना वही निर्णय है जो कौन-से पाँच 1 देंगे — गुणांकों की हर पंक्ति आगे से और पीछे से एक जैसी पढ़ी जाती है। (70 ⁸C₄ है, पंक्ति का शिखर, माँगा गया पद नहीं।)",
          mr: "तो ⁸C₃ = (8 × 7 × 6)/(3 × 2 × 1) = 336/6 = 56. लक्षात घेण्याजोगे की हा ⁸C₅ इतकाच आहे, कारण कोणते तीन कंस x देतील हे निवडणे तोच निर्णय जो कोणते पाच 1 देतील — सहगुणकांची प्रत्येक ओळ पुढून आणि मागून सारखीच वाचली जाते. (70 हा ⁸C₄, ओळीचे शिखर, विचारलेले पद नव्हे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the constant term (the term free of x) in the expansion of (2x + 3)⁴ ?",
          hi: "(2x + 3)⁴ के प्रसार में अचर पद (x से मुक्त पद) क्या है?",
          mr: "(2x + 3)⁴ च्या विस्तारात स्थिर पद (x विरहित पद) किती?",
        },
        answer: 81,
        wrong: [16, 12, 24],
        checkExpr: "3*3*3*3",
        solution: {
          en: "The only term with no x is the one that takes 3 from all four brackets: 3⁴ = 81, with a coefficient of ⁴C₀ = 1. It is also what the whole expression becomes at x = 0, which is a quick way to check any constant term without expanding. (16 gives 2⁴, taking 2x from every bracket instead, which is the term in x⁴.)",
          hi: "बिना x वाला इकलौता पद वही है जो चारों कोष्ठकों से 3 लेता है: 3⁴ = 81, और गुणांक ⁴C₀ = 1. वह वही भी है जो x = 0 पर पूरा व्यंजक बनता है, और यह बिना प्रसार किए किसी भी अचर पद की जाँच का तेज़ रास्ता है। (16 2⁴ देता है, हर कोष्ठक से 2x लेकर, जो x⁴ वाला पद है।)",
          mr: "x विरहित एकमेव पद तेच जे चारही कंसांतून 3 घेते: 3⁴ = 81, आणि सहगुणक ⁴C₀ = 1. तेच x = 0 वर अख्खी पदावली बनते, आणि हा विस्तार न करता कोणतेही स्थिर पद तपासण्याचा वेगवान मार्ग. (16 2⁴ देते, प्रत्येक कंसातून 2x घेऊन, जे x⁴ चे पद आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the coefficient of x² in the expansion of (1 + 2x)⁵ ?",
          hi: "(1 + 2x)⁵ के प्रसार में x² का गुणांक क्या है?",
          mr: "(1 + 2x)⁵ च्या विस्तारात x² चा सहगुणक किती?",
        },
        answer: 40,
        wrong: [10, 20, 80],
        checkExpr: "5*4/2*4",
        solution: {
          en: "The term is ⁵C₂ (2x)² = 10 × 4x², so the coefficient is 40. The 2 inside the bracket is squared along with the x, and forgetting that is the standard slip — it turns a factor of 4 into a factor of 2, or into nothing at all. Always raise the whole of the second term to the power, coefficient included. (10 gives the binomial coefficient alone and ignores the 2.)",
          hi: "पद है ⁵C₂ (2x)² = 10 × 4x², अतः गुणांक 40. कोष्ठक के भीतर का 2 भी x के साथ वर्ग होता है, और उसे भूलना मानक चूक है — वह 4 के गुणक को 2 का बना देती है, या बिलकुल ही मिटा देती है। दूसरे पद को सदा गुणांक सहित पूरा घात तक उठाओ। (10 अकेला द्विपद गुणांक देता है और 2 की अनदेखी कर देता है।)",
          mr: "पद आहे ⁵C₂ (2x)² = 10 × 4x², म्हणून सहगुणक 40. कंसातला 2 सुद्धा x सोबत वर्ग होतो, आणि तो विसरणे ही प्रमाण चूक — ती 4 च्या गुणकाला 2 चा बनवते, वा अजिबातच मिटवते. दुसरे पद नेहमी सहगुणकासह पूर्ण घातापर्यंत न्या. (10 एकटा द्विपद सहगुणक देते आणि 2 दुर्लक्षते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the coefficient of the middle term in the expansion of (x + 1/x)¹⁰ ?",
          hi: "(x + 1/x)¹⁰ के प्रसार में बीच के पद का गुणांक क्या है?",
          mr: "(x + 1/x)¹⁰ च्या विस्तारात मधल्या पदाचा सहगुणक किती?",
        },
        answer: 252,
        wrong: [210, 120, 45],
        checkExpr: "10*9*8*7*6/(5*4*3*2*1)",
        solution: {
          en: "There are 11 terms, so the middle one is the 6th, with r = 5: ¹⁰C₅ x⁵ (1/x)⁵ = ¹⁰C₅. That works out to (10 × 9 × 8 × 7 × 6)/(5 × 4 × 3 × 2 × 1) = 30240/120 = 252. Notice that the x's cancel exactly here, so the middle term is also the constant term — which is why this particular expansion is a favourite for asking about the term independent of x. (210 gives ¹⁰C₄, the term one place to the left.)",
          hi: "11 पद हैं, अतः बीच वाला छठा है, जिसमें r = 5: ¹⁰C₅ x⁵ (1/x)⁵ = ¹⁰C₅. वह बनता है (10 × 9 × 8 × 7 × 6)/(5 × 4 × 3 × 2 × 1) = 30240/120 = 252. ध्यान दो कि यहाँ x ठीक-ठीक कट जाते हैं, अतः बीच का पद अचर पद भी है — इसीलिए x से स्वतंत्र पद पूछने के लिए यही प्रसार सबसे प्रिय है। (210 ¹⁰C₄ देता है, बाईं ओर एक स्थान का पद।)",
          mr: "11 पदे आहेत, म्हणून मधले सहावे, ज्यात r = 5: ¹⁰C₅ x⁵ (1/x)⁵ = ¹⁰C₅. ते बनते (10 × 9 × 8 × 7 × 6)/(5 × 4 × 3 × 2 × 1) = 30240/120 = 252. लक्षात घ्या की इथे x नेमके छेदतात, म्हणून मधले पद हे स्थिर पदही आहे — म्हणूनच x पासून स्वतंत्र पद विचारण्यासाठी हाच विस्तार सर्वांत आवडता. (210 ¹⁰C₄ देते, डावीकडे एक जागेचे पद.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "What is the term independent of x in the expansion of (x² + 1/x)⁶ ?",
          hi: "(x² + 1/x)⁶ के प्रसार में x से स्वतंत्र पद क्या है?",
          mr: "(x² + 1/x)⁶ च्या विस्तारात x पासून स्वतंत्र पद किती?",
        },
        answer: 15,
        wrong: [20, 6, 30],
        checkExpr: "6*5/2",
        solution: {
          en: "The general term is ⁶Cᵣ (x²)⁶⁻ʳ (1/x)ʳ, whose power of x is 2(6 − r) − r = 12 − 3r. Setting 12 − 3r = 0 gives r = 4, so the term is ⁶C₄ = ⁶C₂ = 15. The method is worth extracting: write the exponent of x as a formula in r, set it to zero, and solve. If r had come out fractional or negative there would simply be no such term, which is itself a legitimate answer to this kind of question. (20 gives ⁶C₃, taking the middle term without checking where the x's cancel.)",
          hi: "व्यापक पद है ⁶Cᵣ (x²)⁶⁻ʳ (1/x)ʳ, जिसमें x की घात 2(6 − r) − r = 12 − 3r है। 12 − 3r = 0 रखने पर r = 4, अतः पद ⁶C₄ = ⁶C₂ = 15. विधि निकालने योग्य है: x का घातांक r में सूत्र के रूप में लिखो, उसे शून्य रखो, और हल करो। यदि r भिन्नात्मक या ऋणात्मक निकलता तो ऐसा कोई पद होता ही नहीं, और वह भी इस तरह के प्रश्न का वैध उत्तर है। (20 ⁶C₃ देता है, बीच का पद लेकर बिना जाँचे कि x कहाँ कटते हैं।)",
          mr: "व्यापक पद आहे ⁶Cᵣ (x²)⁶⁻ʳ (1/x)ʳ, ज्यात x ची घात 2(6 − r) − r = 12 − 3r आहे. 12 − 3r = 0 ठेवल्यावर r = 4, म्हणून पद ⁶C₄ = ⁶C₂ = 15. पद्धत काढण्याजोगी: x चा घातांक r मध्ये सूत्र म्हणून लिहा, तो शून्य ठेवा, आणि सोडवा. r अपूर्णांकी वा ऋण निघाला असता तर असे पद नसतेच, आणि तेही या प्रकारच्या प्रश्नाचे वैध उत्तर आहे. (20 ⁶C₃ देते, मधले पद घेऊन x कुठे छेदतात हे न तपासता.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Using the first two terms of the binomial expansion, what is the approximate value of (1.01)⁵ ?",
          hi: "द्विपद प्रसार के पहले दो पदों से (1.01)⁵ का सन्निकट मान क्या है?",
          mr: "द्विपद विस्ताराच्या पहिल्या दोन पदांनी (1.01)⁵ चे अंदाजे मूल्य किती?",
        },
        answer: 1.05,
        wrong: [1.5, 1.01, 1.005],
        checkExpr: "1+5*0.01",
        solution: {
          en: "Write it as (1 + 0.01)⁵ and expand: 1 + 5(0.01) + 10(0.01)² + … The first two terms give 1 + 0.05 = 1.05. The third term is only 0.001, and the ones after it are smaller still, which is what makes stopping early legitimate — the expansion converges quickly because 0.01 raised to a power shrinks fast. The true value is 1.0510, so the approximation is right to three decimal places. This is the everyday use of the theorem: not expanding brackets but estimating a power that would be tedious to compute exactly. (1.5 treats 0.01 as 0.1.)",
          hi: "इसे (1 + 0.01)⁵ लिखकर खोलो: 1 + 5(0.01) + 10(0.01)² + … पहले दो पद देते हैं 1 + 0.05 = 1.05. तीसरा पद केवल 0.001 है, और उसके बाद वाले और भी छोटे, और यही जल्दी रुकना वैध बनाता है — प्रसार तेज़ी से अभिसरित होता है क्योंकि 0.01 घात तक उठकर तेज़ी से सिकुड़ता है। असली मान 1.0510 है, अतः सन्निकटन तीन दशमलव स्थानों तक ठीक है। प्रमेय का रोज़मर्रा का उपयोग यही है: कोष्ठक खोलना नहीं, बल्कि ऐसी घात का अनुमान लगाना जिसे ठीक-ठीक निकालना थकाऊ हो। (1.5 0.01 को 0.1 मान लेता है।)",
          mr: "हे (1 + 0.01)⁵ असे लिहून उलगडा: 1 + 5(0.01) + 10(0.01)² + … पहिली दोन पदे देतात 1 + 0.05 = 1.05. तिसरे पद केवळ 0.001 आहे, आणि त्यानंतरची आणखी लहान, आणि हेच लवकर थांबणे वैध करते — विस्तार वेगाने अभिसरतो कारण 0.01 घातापर्यंत जाऊन वेगाने आकसतो. खरे मूल्य 1.0510 आहे, म्हणून अंदाज तीन दशांश स्थानांपर्यंत बरोबर. प्रमेयाचा रोजचा उपयोग हाच: कंस उलगडणे नव्हे, तर अशा घातेचा अंदाज लावणे जी नेमकी काढणे कंटाळवाणे असेल. (1.5 0.01 ला 0.1 मानते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "In the expansion of (1 + x)ⁿ the coefficient of x² is 66. What is n?",
          hi: "(1 + x)ⁿ के प्रसार में x² का गुणांक 66 है। n क्या है?",
          mr: "(1 + x)ⁿ च्या विस्तारात x² चा सहगुणक 66 आहे. n किती?",
        },
        answer: 12,
        wrong: [11, 66, 33],
        checkExpr: "132/11",
        solution: {
          en: "The coefficient of x² is ⁿC₂ = n(n − 1)/2, so n(n − 1) = 132. Looking for two consecutive whole numbers whose product is 132 gives 12 × 11, so n = 12. Solving the quadratic n² − n − 132 = 0 gives the same pair, 12 and −11, and the negative root is discarded because a power cannot be negative. Note the useful shortcut: n(n − 1) = 132 means n is close to the square root of 132, which is a little under 12 — so trying 12 first is not a guess but an estimate. (11 gives n − 1 rather than n.)",
          hi: "x² का गुणांक ⁿC₂ = n(n − 1)/2 है, अतः n(n − 1) = 132. ऐसी दो क्रमागत पूर्ण संख्याएँ ढूँढ़ो जिनका गुणनफल 132 हो, वे 12 × 11 हैं, अतः n = 12. द्विघात n² − n − 132 = 0 हल करने पर वही युग्म मिलता है, 12 और −11, और ऋणात्मक मूल छोड़ दिया जाता है क्योंकि घात ऋणात्मक नहीं हो सकती। उपयोगी शॉर्टकट ध्यान दो: n(n − 1) = 132 का अर्थ है कि n 132 के वर्गमूल के पास है, जो 12 से कुछ नीचे है — अतः पहले 12 आज़माना अनुमान नहीं, आकलन है। (11 n के बजाय n − 1 देता है।)",
          mr: "x² चा सहगुणक ⁿC₂ = n(n − 1)/2 आहे, म्हणून n(n − 1) = 132. अशा दोन लागोपाठच्या पूर्ण संख्या शोधा ज्यांचा गुणाकार 132 असेल, त्या 12 × 11 आहेत, म्हणून n = 12. वर्गसमीकरण n² − n − 132 = 0 सोडवल्यावर तीच जोडी मिळते, 12 आणि −11, आणि ऋण मूळ सोडले जाते कारण घात ऋण असू शकत नाही. उपयुक्त शॉर्टकट लक्षात घ्या: n(n − 1) = 132 म्हणजे n हा 132 च्या वर्गमुळाजवळ आहे, जो 12 हून काहीसा खाली — म्हणून आधी 12 आजमावणे अंदाज नव्हे, आकलन आहे. (11 n ऐवजी n − 1 देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "What is the greatest binomial coefficient in the expansion of (1 + x)⁸ ?",
          hi: "(1 + x)⁸ के प्रसार का सबसे बड़ा द्विपद गुणांक क्या है?",
          mr: "(1 + x)⁸ च्या विस्तारातील सर्वांत मोठा द्विपद सहगुणक किती?",
        },
        answer: 70,
        wrong: [56, 256, 28],
        checkExpr: "8*7*6*5/(4*3*2*1)",
        solution: {
          en: "The coefficients ⁸C₀ through ⁸C₈ rise to a single peak in the middle and fall away symmetrically, so the largest is ⁸C₄ = (8 × 7 × 6 × 5)/(4 × 3 × 2 × 1) = 1680/24 = 70. Two things generalise. When n is even the peak is a single coefficient at r = n/2; when n is odd there are two equal largest coefficients side by side, at r = (n − 1)/2 and (n + 1)/2. And the peak is not the sum — the coefficients here total 2⁸ = 256, so the largest single one is well under a third of the whole. (256 gives the sum of all the coefficients rather than the biggest.)",
          hi: "गुणांक ⁸C₀ से ⁸C₈ तक बीच में एक ही शिखर तक चढ़ते हैं और सममित रूप से उतर जाते हैं, अतः सबसे बड़ा ⁸C₄ = (8 × 7 × 6 × 5)/(4 × 3 × 2 × 1) = 1680/24 = 70. दो बातें सामान्य हैं। n सम हो तो शिखर r = n/2 पर एक अकेला गुणांक है; n विषम हो तो दो बराबर सबसे बड़े गुणांक साथ-साथ होते हैं, r = (n − 1)/2 और (n + 1)/2 पर। और शिखर योग नहीं है — यहाँ गुणांकों का कुल 2⁸ = 256 है, अतः सबसे बड़ा अकेला पूरे के तिहाई से भी अच्छा-ख़ासा नीचे है। (256 सबसे बड़े के बजाय सभी गुणांकों का योग देता है।)",
          mr: "सहगुणक ⁸C₀ पासून ⁸C₈ पर्यंत मध्यात एकाच शिखरापर्यंत चढतात आणि सममितपणे उतरतात, म्हणून सर्वांत मोठा ⁸C₄ = (8 × 7 × 6 × 5)/(4 × 3 × 2 × 1) = 1680/24 = 70. दोन गोष्टी सामान्य आहेत. n सम असेल तर शिखर r = n/2 वर एकच सहगुणक; n विषम असेल तर दोन समान सर्वांत मोठे सहगुणक शेजारी असतात, r = (n − 1)/2 आणि (n + 1)/2 वर. आणि शिखर ही बेरीज नव्हे — इथे सहगुणकांची एकूण 2⁸ = 256 आहे, म्हणून सर्वांत मोठा एकटा अख्ख्याच्या तृतीयांशाहूनही बराच खाली. (256 सर्वांत मोठ्याऐवजी सर्व सहगुणकांची बेरीज देते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-binomial-theorem",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 7 — Binomial Theorem",
      name: "Binomial Theorem",
      summary:
        "A bracket raised to a high power, read one term at a time instead of multiplied out: the coefficients turn out to be the combinations of the last chapter, the exponents of the two letters always add to the power, and a single general term lets you reach the middle of an expansion without writing any of it down.",
      position: 7,
      translations: {
        hi: {
          name: "द्विपद प्रमेय",
          summary:
            "ऊँची घात तक उठाया कोष्ठक, पूरा गुणा किए बिना एक-एक पद पढ़ा हुआ: गुणांक पिछले अध्याय के संचय ही निकलते हैं, दोनों अक्षरों के घातांक सदा जुड़कर वही घात बनाते हैं, और एक अकेला व्यापक पद तुम्हें प्रसार का बीच तक पहुँचा देता है बिना उसमें से कुछ भी लिखे।",
        },
        mr: {
          name: "द्विपद प्रमेय",
          summary:
            "उच्च घातापर्यंत नेलेला कंस, पूर्ण गुणाकार न करता एकेक पद वाचलेला: सहगुणक मागच्या प्रकरणातले संचयच निघतात, दोन्ही अक्षरांचे घातांक नेहमी जुळून तीच घात बनवतात, आणि एकच व्यापक पद तुम्हाला विस्ताराच्या मध्यापर्यंत नेते त्यातले काहीही न लिहिता.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 8 — Sequences and Series (a list with a rule, and its total)      */
/* ------------------------------------------------------------------------- */
function sequences11(): TopicFileOut {
  const rand = rng("maths-11-sequences-and-series");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A geometric progression has first term 2 and common ratio 3. What is its 3rd term?",
          hi: "किसी गुणोत्तर श्रेढी का पहला पद 2 और सार्व अनुपात 3 है। उसका तीसरा पद क्या है?",
          mr: "एका गुणोत्तर श्रेढीचे पहिले पद 2 आणि सामाईक गुणोत्तर 3 आहे. तिचे तिसरे पद किती?",
        },
        answer: 18,
        wrong: [6, 54, 12],
        checkExpr: "2*3*3",
        solution: {
          en: "Each term is the previous one multiplied by 3, so the terms run 2, 6, 18. The nth term is a·rⁿ⁻¹, and for n = 3 that is 2 × 3² = 18 — note the exponent is 2, not 3, because the first term has not been multiplied at all. (54 uses r³ and multiplies once too often.)",
          hi: "हर पद पिछले को 3 से गुणा करके बनता है, अतः पद 2, 6, 18 चलते हैं। nवाँ पद a·rⁿ⁻¹ है, और n = 3 के लिए वह 2 × 3² = 18 — ध्यान दो कि घातांक 2 है, 3 नहीं, क्योंकि पहला पद गुणा हुआ ही नहीं। (54 r³ लेता है और एक बार अधिक गुणा कर देता है।)",
          mr: "प्रत्येक पद आधीच्याला 3 ने गुणून बनते, म्हणून पदे 2, 6, 18 अशी चालतात. nवे पद a·rⁿ⁻¹ आहे, आणि n = 3 साठी ते 2 × 3² = 18 — लक्षात घ्या की घातांक 2 आहे, 3 नव्हे, कारण पहिले पद गुणलेच गेले नाही. (54 r³ घेते आणि एकदा जास्त गुणते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the common ratio of the geometric progression 3, 12, 48, … ?",
          hi: "गुणोत्तर श्रेढी 3, 12, 48, … का सार्व अनुपात क्या है?",
          mr: "गुणोत्तर श्रेढी 3, 12, 48, … चे सामाईक गुणोत्तर किती?",
        },
        answer: 4,
        wrong: [9, 3, 16],
        checkExpr: "12/3",
        solution: {
          en: "Divide any term by the one before it: 12/3 = 4, and checking the next pair gives 48/12 = 4 as well. Dividing rather than subtracting is what separates a geometric progression from an arithmetic one, and doing the check on a second pair is what confirms the sequence really is geometric. (9 subtracts the terms, which would be the common difference if this were an arithmetic progression.)",
          hi: "किसी भी पद को उससे पहले वाले से भाग दो: 12/3 = 4, और अगला युग्म जाँचने पर 48/12 = 4 भी। घटाने के बजाय भाग देना ही गुणोत्तर श्रेढी को समांतर श्रेढी से अलग करता है, और दूसरे युग्म पर जाँच करना ही पक्का करता है कि अनुक्रम सचमुच गुणोत्तर है। (9 पद घटा देता है, जो समांतर श्रेढी होती तो सार्व अंतर होता।)",
          mr: "कोणतेही पद त्याच्या आधीच्याने भागा: 12/3 = 4, आणि पुढची जोडी तपासल्यावर 48/12 = 4 सुद्धा. वजा करण्याऐवजी भागणे हेच गुणोत्तर श्रेढीला समांतर श्रेढीपासून वेगळे करते, आणि दुसऱ्या जोडीवर तपासणी करणेच पक्के करते की श्रेढी खरोखर गुणोत्तर आहे. (9 पदे वजा करते, जे समांतर श्रेढी असती तर सामाईक फरक झाला असता.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the sum of the first 4 terms of the geometric progression 1, 2, 4, 8, … ?",
          hi: "गुणोत्तर श्रेढी 1, 2, 4, 8, … के पहले 4 पदों का योग क्या है?",
          mr: "गुणोत्तर श्रेढी 1, 2, 4, 8, … च्या पहिल्या 4 पदांची बेरीज किती?",
        },
        answer: 15,
        wrong: [16, 8, 14],
        checkExpr: "1+2+4+8",
        solution: {
          en: "Simply add them: 1 + 2 + 4 + 8 = 15. The pattern is worth spotting — the sum is always one less than the next term, because 1 + 2 + 4 + 8 = 16 − 1. That is the doubling series behind the old story of the grains of rice on a chessboard, where the last square alone holds more than every square before it put together. (16 gives the next term rather than the sum of the four.)",
          hi: "बस जोड़ो: 1 + 2 + 4 + 8 = 15. ढर्रा पकड़ने योग्य है — योग सदा अगले पद से एक कम होता है, क्योंकि 1 + 2 + 4 + 8 = 16 − 1. यही दोगुनी होती श्रेणी शतरंज की बिसात पर चावल के दानों की पुरानी कहानी के पीछे है, जहाँ अकेला अंतिम ख़ाना उससे पहले के सब ख़ानों को मिलाकर भी अधिक रखता है। (16 चारों का योग नहीं, अगला पद देता है।)",
          mr: "फक्त जोडा: 1 + 2 + 4 + 8 = 15. साचा पकडण्याजोगा — बेरीज नेहमी पुढच्या पदाहून एकने कमी असते, कारण 1 + 2 + 4 + 8 = 16 − 1. हीच दुप्पट होणारी श्रेणी बुद्धिबळाच्या पटावरील तांदळाच्या दाण्यांच्या जुन्या गोष्टीमागे आहे, जिथे एकटा शेवटचा घर त्याच्या आधीच्या सर्व घरांना मिळूनही अधिक धरतो. (16 चौघांची बेरीज नव्हे, पुढचे पद देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A geometric progression has first term 5 and common ratio 2. What is its 6th term?",
          hi: "किसी गुणोत्तर श्रेढी का पहला पद 5 और सार्व अनुपात 2 है। उसका छठा पद क्या है?",
          mr: "एका गुणोत्तर श्रेढीचे पहिले पद 5 आणि सामाईक गुणोत्तर 2 आहे. तिचे सहावे पद किती?",
        },
        answer: 160,
        wrong: [320, 60, 80],
        checkExpr: "5*2*2*2*2*2",
        solution: {
          en: "The 6th term is a·r⁵ = 5 × 2⁵ = 5 × 32 = 160. Counting the multiplications rather than the terms is the safe habit: going from the 1st term to the 6th means five steps, so the exponent is 5. (320 uses r⁶ and takes one step too many.)",
          hi: "छठा पद a·r⁵ = 5 × 2⁵ = 5 × 32 = 160. पद नहीं, गुणा गिनना सुरक्षित आदत है: पहले पद से छठे तक जाना पाँच क़दम हैं, अतः घातांक 5 है। (320 r⁶ लेता है और एक क़दम अधिक चल जाता है।)",
          mr: "सहावे पद a·r⁵ = 5 × 2⁵ = 5 × 32 = 160. पदे नव्हे, गुणाकार मोजणे ही सुरक्षित सवय: पहिल्या पदापासून सहाव्यापर्यंत जाणे म्हणजे पाच पावले, म्हणून घातांक 5. (320 r⁶ घेते आणि एक पाऊल जास्त चालते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the sum to infinity of the geometric progression with first term 8 and common ratio 0.5?",
          hi: "पहला पद 8 और सार्व अनुपात 0.5 वाली गुणोत्तर श्रेढी का अनंत तक योग क्या है?",
          mr: "पहिले पद 8 आणि सामाईक गुणोत्तर 0.5 असलेल्या गुणोत्तर श्रेढीची अनंतापर्यंतची बेरीज किती?",
        },
        answer: 16,
        wrong: [8, 4, 32],
        checkExpr: "8/(1-0.5)",
        solution: {
          en: "The sum to infinity is a/(1 − r) = 8/(1 − 0.5) = 8/0.5 = 16. Adding endlessly many positive numbers and arriving at a finite total is the surprise of the chapter, and it works only because the terms shrink fast enough: 8 + 4 + 2 + 1 + 0.5 + … creeps towards 16 without ever reaching it. The formula holds only when the ratio lies strictly between −1 and 1; outside that range the terms do not shrink and there is no sum at all. (8 quotes the first term as if the rest added to nothing.)",
          hi: "अनंत तक योग है a/(1 − r) = 8/(1 − 0.5) = 8/0.5 = 16. अंतहीन धनात्मक संख्याएँ जोड़कर परिमित कुल पर पहुँचना ही अध्याय का आश्चर्य है, और वह केवल इसलिए चलता है कि पद पर्याप्त तेज़ी से सिकुड़ते हैं: 8 + 4 + 2 + 1 + 0.5 + … 16 की ओर सरकता है और उस तक कभी पहुँचता नहीं। सूत्र तभी चलता है जब अनुपात कठोरता से −1 और 1 के बीच हो; उस परास के बाहर पद सिकुड़ते ही नहीं और कोई योग होता ही नहीं। (8 पहला पद बता देता है मानो बाक़ी जुड़कर कुछ न बनते हों।)",
          mr: "अनंतापर्यंतची बेरीज आहे a/(1 − r) = 8/(1 − 0.5) = 8/0.5 = 16. अंतहीन धन संख्या जोडून सांत एकूणावर पोहोचणे हेच प्रकरणाचे आश्चर्य, आणि ते केवळ यासाठी चालते की पदे पुरेशा वेगाने आकसतात: 8 + 4 + 2 + 1 + 0.5 + … 16 कडे सरकते आणि तिथवर कधीच पोहोचत नाही. सूत्र तेव्हाच चालते जेव्हा गुणोत्तर काटेकोरपणे −1 आणि 1 दरम्यान असेल; त्या पल्ल्याबाहेर पदे आकसतच नाहीत आणि बेरीज असतच नाही. (8 पहिले पद सांगते जणू बाकीची जुळून काहीच बनत नसावीत.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the SQUARE of the geometric mean of 4 and 9?",
          hi: "4 और 9 के गुणोत्तर माध्य का वर्ग क्या है?",
          mr: "4 आणि 9 च्या गुणोत्तर माध्याचा वर्ग किती?",
        },
        answer: 36,
        wrong: [13, 6.5, 6],
        checkExpr: "4*9",
        solution: {
          en: "If G is the geometric mean of a and b then a, G, b form a geometric progression, so G/a = b/G and therefore G² = ab = 4 × 9 = 36. The mean itself is 6, and the question asks for its square precisely because the square is the quantity the definition hands you directly. Compare it with the arithmetic mean of the same pair, (4 + 9)/2 = 6.5: the geometric mean is the smaller of the two, and that is true of every pair of distinct positive numbers. (13 adds the two numbers instead of multiplying them.)",
          hi: "यदि G, a और b का गुणोत्तर माध्य है तो a, G, b गुणोत्तर श्रेढी बनाते हैं, अतः G/a = b/G और इसलिए G² = ab = 4 × 9 = 36. माध्य स्वयं 6 है, और प्रश्न उसका वर्ग ठीक इसलिए माँगता है कि वर्ग ही वह राशि है जो परिभाषा सीधे सौंपती है। उसी युग्म के समांतर माध्य (4 + 9)/2 = 6.5 से तुलना करो: गुणोत्तर माध्य दोनों में छोटा है, और यह हर भिन्न धनात्मक युग्म के लिए सच है। (13 दोनों संख्याएँ गुणा करने के बजाय जोड़ देता है।)",
          mr: "जर G हा a आणि b चा गुणोत्तर माध्य असेल तर a, G, b गुणोत्तर श्रेढी बनवतात, म्हणून G/a = b/G आणि म्हणून G² = ab = 4 × 9 = 36. माध्य स्वतः 6 आहे, आणि प्रश्न त्याचा वर्ग नेमके यासाठी विचारतो की वर्गच ती राशी जी व्याख्या थेट सोपवते. त्याच जोडीच्या समांतर माध्याशी (4 + 9)/2 = 6.5 तुलना करा: गुणोत्तर माध्य दोघांतला लहान आहे, आणि हे प्रत्येक वेगळ्या धन जोडीसाठी खरे. (13 दोन्ही संख्या गुणण्याऐवजी जोडते.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the arithmetic mean of 4 and 9?",
          hi: "4 और 9 का समांतर माध्य क्या है?",
          mr: "4 आणि 9 चा समांतर माध्य किती?",
        },
        answer: 6.5,
        wrong: [6, 13, 5],
        checkExpr: "(4+9)/2",
        solution: {
          en: "The arithmetic mean is (4 + 9)/2 = 6.5, the number that sits midway between the two so that 4, 6.5, 9 is an arithmetic progression with common difference 2.5. Set it beside the geometric mean of the same pair, which is 6: the arithmetic mean is always the larger unless the two numbers are equal, in which case both means coincide. That inequality is one of the most used facts in all of algebra. (6 gives the geometric mean instead.)",
          hi: "समांतर माध्य है (4 + 9)/2 = 6.5, वह संख्या जो दोनों के ठीक बीच बैठती है ताकि 4, 6.5, 9 सार्व अंतर 2.5 की समांतर श्रेढी बने। इसे उसी युग्म के गुणोत्तर माध्य के साथ रखो, जो 6 है: समांतर माध्य सदा बड़ा होता है, बशर्ते दोनों संख्याएँ बराबर न हों, और तब दोनों माध्य एक हो जाते हैं। वह असमिका पूरे बीजगणित में सबसे अधिक काम में आने वाले तथ्यों में है। (6 इसके बदले गुणोत्तर माध्य दे देता है।)",
          mr: "समांतर माध्य आहे (4 + 9)/2 = 6.5, ती संख्या जी दोघांच्या नेमकी मध्ये बसते जेणेकरून 4, 6.5, 9 ही सामाईक फरक 2.5 ची समांतर श्रेढी बनावी. हे त्याच जोडीच्या गुणोत्तर माध्याशेजारी ठेवा, जो 6 आहे: समांतर माध्य नेहमी मोठा असतो, जोवर दोन्ही संख्या समान नसतील, आणि तेव्हा दोन्ही माध्य एक होतात. ती असमानता अख्ख्या बीजगणितातल्या सर्वाधिक वापरल्या जाणाऱ्या तथ्यांपैकी एक. (6 त्याऐवजी गुणोत्तर माध्य देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the sum of the first 10 natural numbers?",
          hi: "पहली 10 प्राकृत संख्याओं का योग क्या है?",
          mr: "पहिल्या 10 नैसर्गिक संख्यांची बेरीज किती?",
        },
        answer: 55,
        wrong: [50, 100, 45],
        checkExpr: "10*11/2",
        solution: {
          en: "The formula is n(n + 1)/2 = 10 × 11/2 = 55. The reason is worth seeing rather than memorising: pair the first with the last, the second with the second-last, and so on — 1 + 10, 2 + 9, 3 + 8 — and every pair adds to 11, with five such pairs. That is Gauss's schoolroom trick and it explains the shape of the formula exactly. (45 gives the sum of the first 9, or equivalently n(n − 1)/2.)",
          hi: "सूत्र है n(n + 1)/2 = 10 × 11/2 = 55. कारण रटने के बजाय देखने योग्य है: पहले को अंतिम के साथ, दूसरे को दूसरे-अंतिम के साथ जोड़ो — 1 + 10, 2 + 9, 3 + 8 — और हर युग्म 11 बनाता है, और ऐसे पाँच युग्म हैं। यही गाउस की कक्षा वाली तरकीब है और वही सूत्र का आकार ठीक-ठीक समझाती है। (45 पहली 9 का योग देता है, यानी n(n − 1)/2.)",
          mr: "सूत्र आहे n(n + 1)/2 = 10 × 11/2 = 55. कारण पाठ करण्याऐवजी पाहण्याजोगे: पहिल्याला शेवटच्याशी, दुसऱ्याला दुसऱ्या-शेवटच्याशी जोडा — 1 + 10, 2 + 9, 3 + 8 — आणि प्रत्येक जोडी 11 बनवते, आणि अशा पाच जोड्या आहेत. हीच गाउसची वर्गातली युक्ती आणि तीच सूत्राचा आकार नेमका समजावते. (45 पहिल्या 9 ची बेरीज देते, म्हणजे n(n − 1)/2.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the sum of the squares of the first 6 natural numbers?",
          hi: "पहली 6 प्राकृत संख्याओं के वर्गों का योग क्या है?",
          mr: "पहिल्या 6 नैसर्गिक संख्यांच्या वर्गांची बेरीज किती?",
        },
        answer: 91,
        wrong: [441, 21, 55],
        checkExpr: "6*7*13/6",
        solution: {
          en: "The formula is n(n + 1)(2n + 1)/6 = 6 × 7 × 13/6 = 91, which you can check by adding directly: 1 + 4 + 9 + 16 + 25 + 36 = 91. Note the trap the third option sets — the sum of the squares is not the square of the sum. The first 6 numbers add to 21, and 21² = 441, which is nearly five times too big. (441 squares the sum instead of summing the squares.)",
          hi: "सूत्र है n(n + 1)(2n + 1)/6 = 6 × 7 × 13/6 = 91, जिसे सीधे जोड़कर जाँचा जा सकता है: 1 + 4 + 9 + 16 + 25 + 36 = 91. तीसरा विकल्प जो जाल बिछाता है उस पर ध्यान दो — वर्गों का योग, योग का वर्ग नहीं होता। पहली 6 संख्याएँ जुड़कर 21 बनती हैं, और 21² = 441, जो लगभग पाँच गुना अधिक है। (441 वर्गों को जोड़ने के बजाय योग का वर्ग कर देता है।)",
          mr: "सूत्र आहे n(n + 1)(2n + 1)/6 = 6 × 7 × 13/6 = 91, जे थेट जोडून तपासता येते: 1 + 4 + 9 + 16 + 25 + 36 = 91. तिसरा पर्याय जो सापळा रचतो त्याकडे लक्ष द्या — वर्गांची बेरीज ही बेरजेचा वर्ग नसते. पहिल्या 6 संख्या जुळून 21 बनतात, आणि 21² = 441, जे जवळपास पाचपट अधिक. (441 वर्ग जोडण्याऐवजी बेरजेचा वर्ग करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the sum of the first 5 terms of a geometric progression with first term 3 and common ratio 2?",
          hi: "पहला पद 3 और सार्व अनुपात 2 वाली गुणोत्तर श्रेढी के पहले 5 पदों का योग क्या है?",
          mr: "पहिले पद 3 आणि सामाईक गुणोत्तर 2 असलेल्या गुणोत्तर श्रेढीच्या पहिल्या 5 पदांची बेरीज किती?",
        },
        answer: 93,
        wrong: [48, 96, 31],
        checkExpr: "3*(32-1)/(2-1)",
        solution: {
          en: "The sum of n terms is a(rⁿ − 1)/(r − 1) = 3(2⁵ − 1)/(2 − 1) = 3 × 31 = 93, which matches adding directly: 3 + 6 + 12 + 24 + 48 = 93. The exponent in the formula is n, not n − 1 — that is the one place it differs from the nth-term formula, and confusing the two is the usual error. (48 gives the 5th term rather than the sum of the five.)",
          hi: "n पदों का योग है a(rⁿ − 1)/(r − 1) = 3(2⁵ − 1)/(2 − 1) = 3 × 31 = 93, जो सीधे जोड़ने से मेल खाता है: 3 + 6 + 12 + 24 + 48 = 93. सूत्र में घातांक n है, n − 1 नहीं — यही इकलौती जगह है जहाँ वह nवें पद के सूत्र से भिन्न है, और दोनों को गड्डमड्ड करना आम भूल है। (48 पाँचों का योग नहीं, पाँचवाँ पद देता है।)",
          mr: "n पदांची बेरीज आहे a(rⁿ − 1)/(r − 1) = 3(2⁵ − 1)/(2 − 1) = 3 × 31 = 93, जे थेट जोडण्याशी जुळते: 3 + 6 + 12 + 24 + 48 = 93. सूत्रातला घातांक n आहे, n − 1 नव्हे — हीच एकमेव जागा जिथे तो nव्या पदाच्या सूत्राहून वेगळा आहे, आणि दोन्ही गोंधळणे ही नेहमीची चूक. (48 पाचांची बेरीज नव्हे, पाचवे पद देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "In a geometric progression the 3rd term is 12 and the 6th term is 96. What is r³ ?",
          hi: "किसी गुणोत्तर श्रेढी का तीसरा पद 12 और छठा पद 96 है। r³ क्या है?",
          mr: "एका गुणोत्तर श्रेढीचे तिसरे पद 12 आणि सहावे पद 96 आहे. r³ किती?",
        },
        answer: 8,
        wrong: [4, 84, 2],
        checkExpr: "96/12",
        solution: {
          en: "Going from the 3rd term to the 6th means multiplying by r three times, so the 6th term is the 3rd times r³. Dividing gives r³ = 96/12 = 8, from which r = 2 and the progression is 3, 6, 12, 24, 48, 96. Dividing one term by another to cancel the unknown first term is the standard opening move for this kind of question, and it works because the two terms share everything except the powers of r. (84 subtracts the terms, which is what you would do in an arithmetic progression.)",
          hi: "तीसरे पद से छठे तक जाने का अर्थ है r से तीन बार गुणा, अतः छठा पद तीसरे गुणा r³ है। भाग देने पर r³ = 96/12 = 8, जिससे r = 2 और श्रेढी 3, 6, 12, 24, 48, 96 है। अज्ञात पहला पद काटने को एक पद को दूसरे से भाग देना इस तरह के प्रश्न की मानक शुरुआती चाल है, और वह इसलिए चलती है कि दोनों पदों में r की घातों को छोड़कर सब साझा है। (84 पद घटा देता है, जो तुम समांतर श्रेढी में करते।)",
          mr: "तिसऱ्या पदापासून सहाव्यापर्यंत जाणे म्हणजे r ने तीनदा गुणणे, म्हणून सहावे पद हे तिसरे गुणिले r³. भागल्यावर r³ = 96/12 = 8, ज्यातून r = 2 आणि श्रेढी 3, 6, 12, 24, 48, 96. अज्ञात पहिले पद छेदण्यासाठी एका पदाला दुसऱ्याने भागणे ही या प्रकारच्या प्रश्नाची प्रमाण सुरुवातीची खेळी, आणि ती यासाठी चालते की दोन्ही पदांत r च्या घाती वगळता सारे सामायिक. (84 पदे वजा करते, जे तुम्ही समांतर श्रेढीत केले असते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "An infinite geometric progression has first term 5 and sums to 20. What is its common ratio?",
          hi: "किसी अनंत गुणोत्तर श्रेढी का पहला पद 5 है और योग 20. उसका सार्व अनुपात क्या है?",
          mr: "एका अनंत गुणोत्तर श्रेढीचे पहिले पद 5 आहे आणि बेरीज 20. तिचे सामाईक गुणोत्तर किती?",
        },
        answer: 0.75,
        wrong: [0.25, 4, 0.5],
        checkExpr: "1-5/20",
        solution: {
          en: "From S = a/(1 − r) comes 20 = 5/(1 − r), so 1 − r = 5/20 = 0.25 and r = 0.75. The progression is 5, 3.75, 2.8125, … creeping towards 20. A quick sanity check: the ratio has to lie strictly between −1 and 1 for the sum to exist at all, so an answer of 4 would have been impossible before any arithmetic was done. And the closer the ratio is to 1, the larger the total — which is why a sum four times the first term needs a ratio as high as three-quarters. (0.25 gives 1 − r rather than r.)",
          hi: "S = a/(1 − r) से 20 = 5/(1 − r), अतः 1 − r = 5/20 = 0.25 और r = 0.75. श्रेढी 5, 3.75, 2.8125, … है जो 20 की ओर सरकती है। एक तेज़ समझ-जाँच: योग के होने के लिए अनुपात को कठोरता से −1 और 1 के बीच होना ही पड़ता है, अतः 4 का उत्तर कोई गणित करने से पहले ही असंभव था। और अनुपात 1 के जितना पास, कुल उतना बड़ा — इसीलिए पहले पद से चार गुने योग को तीन-चौथाई जितना ऊँचा अनुपात चाहिए। (0.25 r के बजाय 1 − r देता है।)",
          mr: "S = a/(1 − r) यातून 20 = 5/(1 − r), म्हणून 1 − r = 5/20 = 0.25 आणि r = 0.75. श्रेढी 5, 3.75, 2.8125, … अशी 20 कडे सरकते. एक झटपट समजून-तपासणी: बेरीज अस्तित्वात असण्यासाठी गुणोत्तर काटेकोरपणे −1 आणि 1 दरम्यान असावेच लागते, म्हणून 4 चे उत्तर कोणतेही गणित करण्याआधीच अशक्य होते. आणि गुणोत्तर 1 च्या जितके जवळ, एकूण तितकी मोठी — म्हणूनच पहिल्या पदाच्या चौपट बेरजेला तीनचतुर्थांशाइतके उच्च गुणोत्तर लागते. (0.25 r ऐवजी 1 − r देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A ball is dropped from a height of 24 m and rebounds to half its previous height each time. What total distance does it travel before coming to rest?",
          hi: "कोई गेंद 24 m की ऊँचाई से गिराई जाती है और हर बार पिछली ऊँचाई के आधे तक उछलती है। रुकने से पहले वह कुल कितनी दूरी तय करती है?",
          mr: "एक चेंडू 24 m उंचीवरून टाकला जातो आणि प्रत्येक वेळी आधीच्या उंचीच्या निम्म्यापर्यंत उसळतो. थांबण्याआधी तो एकूण किती अंतर कापतो?",
        },
        answer: 72,
        wrong: [48, 24, 96],
        checkExpr: "24+2*12/(1-0.5)",
        solution: {
          en: "The first fall is 24 m. After that the ball rises 12 m and falls 12 m, rises 6 and falls 6, and so on — every rebound height is travelled twice. So the total is 24 + 2(12 + 6 + 3 + …), and the bracket is an infinite geometric progression with first term 12 and ratio 0.5, summing to 12/0.5 = 24. The total is 24 + 2 × 24 = 72 m. Two things make this question worth doing. The first drop is counted once and everything after it twice, which is the step most people miss. And the answer is finite even though the ball bounces infinitely often, because the distances shrink faster than the count of bounces grows — in the same way the total TIME is finite too, which is why the ball actually stops. (48 counts each rebound only once.)",
          hi: "पहला गिरना 24 m है। उसके बाद गेंद 12 m चढ़ती और 12 m गिरती है, 6 चढ़ती और 6 गिरती है, और यों ही — हर उछाल की ऊँचाई दो बार तय होती है। अतः कुल है 24 + 2(12 + 6 + 3 + …), और कोष्ठक एक अनंत गुणोत्तर श्रेढी है जिसका पहला पद 12 और अनुपात 0.5 है, जिसका योग 12/0.5 = 24. कुल हुआ 24 + 2 × 24 = 72 m. दो बातें इस प्रश्न को करने योग्य बनाती हैं। पहला गिरना एक बार गिना जाता है और उसके बाद सब दो बार, और यही वह चरण है जो अधिकांश लोग चूक जाते हैं। और उत्तर परिमित है भले ही गेंद अनंत बार उछले, क्योंकि दूरियाँ उछालों की गिनती बढ़ने से तेज़ी से सिकुड़ती हैं — उसी तरह कुल समय भी परिमित है, इसीलिए गेंद वस्तुतः रुक जाती है। (48 हर उछाल केवल एक बार गिनता है।)",
          mr: "पहिले पडणे 24 m. त्यानंतर चेंडू 12 m चढतो आणि 12 m पडतो, 6 चढतो आणि 6 पडतो, असेच — प्रत्येक उसळीची उंची दोनदा कापली जाते. म्हणून एकूण आहे 24 + 2(12 + 6 + 3 + …), आणि कंस ही अनंत गुणोत्तर श्रेढी जिचे पहिले पद 12 आणि गुणोत्तर 0.5, जिची बेरीज 12/0.5 = 24. एकूण झाले 24 + 2 × 24 = 72 m. दोन गोष्टी हा प्रश्न करण्याजोगा करतात. पहिले पडणे एकदा मोजले जाते आणि त्यानंतरचे सारे दोनदा, आणि हीच ती पायरी जी बहुतेकजण चुकवतात. आणि उत्तर सांत आहे जरी चेंडू अनंत वेळा उसळला तरी, कारण अंतरे उसळ्यांच्या मोजणीहून वेगाने आकसतात — त्याचप्रमाणे एकूण वेळही सांत आहे, म्हणूनच चेंडू प्रत्यक्षात थांबतो. (48 प्रत्येक उसळी केवळ एकदा मोजते.)",
        },
        fmt: unit("m"),
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "What is the sum of the infinite series 1 + 1/3 + 1/9 + 1/27 + … ?",
          hi: "अनंत श्रेणी 1 + 1/3 + 1/9 + 1/27 + … का योग क्या है?",
          mr: "अनंत श्रेणी 1 + 1/3 + 1/9 + 1/27 + … ची बेरीज किती?",
        },
        answer: 1.5,
        wrong: [3, 2, 1.33],
        checkExpr: "1/(1-1/3)",
        solution: {
          en: "The first term is 1 and each term is a third of the one before, so the sum is a/(1 − r) = 1/(1 − 1/3) = 1/(2/3) = 3/2 = 1.5. Watching the partial sums makes the result believable: 1, then 1.333, then 1.444, then 1.481 — climbing steadily and never passing 1.5. That is what convergence looks like, and it is the reason an infinite sum can be written down as a single number at all. The condition is only that the ratio's size is under 1; had the terms been 1 + 3 + 9 + 27 the same formula would have produced a nonsense answer of −1/2, which is the standard warning against applying it without checking. (3 inverts the denominator, using 1/r rather than 1/(1 − r).)",
          hi: "पहला पद 1 है और हर पद पिछले का तिहाई, अतः योग है a/(1 − r) = 1/(1 − 1/3) = 1/(2/3) = 3/2 = 1.5. आंशिक योग देखने से परिणाम विश्वसनीय लगता है: 1, फिर 1.333, फिर 1.444, फिर 1.481 — लगातार चढ़ते और 1.5 कभी पार न करते। अभिसरण ऐसा ही दिखता है, और यही कारण है कि कोई अनंत योग एक अकेली संख्या के रूप में लिखा जा सकता है। शर्त केवल यह है कि अनुपात का आकार 1 से कम हो; यदि पद 1 + 3 + 9 + 27 होते तो वही सूत्र −1/2 का बेतुका उत्तर बनाता, और यही बिना जाँचे उसे लगाने के विरुद्ध मानक चेतावनी है। (3 हर उलट देता है, 1/(1 − r) के बजाय 1/r लेकर।)",
          mr: "पहिले पद 1 आहे आणि प्रत्येक पद आधीच्याचा तृतीयांश, म्हणून बेरीज आहे a/(1 − r) = 1/(1 − 1/3) = 1/(2/3) = 3/2 = 1.5. आंशिक बेरजा पाहिल्याने निकाल विश्वासार्ह वाटतो: 1, मग 1.333, मग 1.444, मग 1.481 — सतत चढत आणि 1.5 कधीच ओलांडत नाही. अभिसरण असेच दिसते, आणि हेच कारण की कोणतीही अनंत बेरीज एका संख्येच्या रूपात लिहिता येते. अट केवळ इतकीच की गुणोत्तराचा आकार 1 हून कमी असावा; पदे 1 + 3 + 9 + 27 असती तर तेच सूत्र −1/2 चे निरर्थक उत्तर बनवले असते, आणि हीच न तपासता ते लावण्याविरुद्धची प्रमाण सूचना. (3 छेद उलटवते, 1/(1 − r) ऐवजी 1/r घेऊन.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-sequences-and-series",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 8 — Sequences and Series",
      name: "Sequences and Series",
      summary:
        "A list built by repeated multiplication rather than repeated addition, and the strange result that follows: when each term is a fraction of the one before, an endless sum can still stop at a finite number — which is why a bouncing ball travels a measurable distance in infinitely many bounces.",
      position: 8,
      translations: {
        hi: {
          name: "अनुक्रम तथा श्रेणी",
          summary:
            "बार-बार जोड़ने के बजाय बार-बार गुणा करके बनी सूची, और उससे निकलता अजीब परिणाम: जब हर पद पिछले का कोई अंश हो, अनंत योग भी किसी परिमित संख्या पर रुक सकता है — इसीलिए उछलती गेंद अनंत उछालों में एक मापी जा सकने वाली दूरी तय करती है।",
        },
        mr: {
          name: "श्रेढी आणि श्रेणी",
          summary:
            "पुन्हा पुन्हा बेरजेऐवजी पुन्हा पुन्हा गुणाकाराने बनलेली यादी, आणि त्यातून निघणारा विचित्र निकाल: प्रत्येक पद आधीच्याचा अंश असेल, तेव्हा अनंत बेरीजही एखाद्या सांत संख्येवर थांबू शकते — म्हणूनच उसळणारा चेंडू अनंत उसळ्यांत मोजता येण्याजोगे अंतर कापतो.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 9 — Straight Lines (geometry done with arithmetic)                */
/* ------------------------------------------------------------------------- */
function straightLines11(): TopicFileOut {
  const rand = rng("maths-11-straight-lines");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the slope of the line joining the points (1, 2) and (3, 6)?",
          hi: "बिंदुओं (1, 2) और (3, 6) को मिलाने वाली रेखा की ढाल क्या है?",
          mr: "बिंदू (1, 2) आणि (3, 6) यांना जोडणाऱ्या रेषेची उतारी किती?",
        },
        answer: 2,
        wrong: [4, 0.5, 8],
        checkExpr: "(6-2)/(3-1)",
        solution: {
          en: "Slope is the rise divided by the run: (6 − 2)/(3 − 1) = 4/2 = 2. Taking the points in the other order gives (2 − 6)/(1 − 3) = −4/−2 = 2 as well, which is the check worth doing — the slope of a line cannot depend on which end you started from. (0.5 divides the run by the rise, inverting the definition.)",
          hi: "ढाल है चढ़ाव बटा बढ़ाव: (6 − 2)/(3 − 1) = 4/2 = 2. बिंदुओं को उलटे क्रम में लेने पर (2 − 6)/(1 − 3) = −4/−2 = 2 भी मिलता है, और यही करने योग्य जाँच है — किसी रेखा की ढाल इस पर निर्भर नहीं हो सकती कि तुमने किस सिरे से शुरू किया। (0.5 चढ़ाव से बढ़ाव को भाग देकर परिभाषा उलट देता है।)",
          mr: "उतारी म्हणजे चढ भागिले सरक: (6 − 2)/(3 − 1) = 4/2 = 2. बिंदू उलट्या क्रमाने घेतल्यावर (2 − 6)/(1 − 3) = −4/−2 = 2 सुद्धा मिळते, आणि हीच करण्याजोगी तपासणी — रेषेची उतारी तुम्ही कोणत्या टोकापासून सुरू केले यावर अवलंबून असू शकत नाही. (0.5 चढाने सरक भागून व्याख्या उलटवते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the slope of the line y = 3x + 5?",
          hi: "रेखा y = 3x + 5 की ढाल क्या है?",
          mr: "रेषा y = 3x + 5 ची उतारी किती?",
        },
        answer: 3,
        wrong: [5, 8, 15],
        checkExpr: "3*1",
        solution: {
          en: "In the form y = mx + c the slope is m, read straight off the coefficient of x: here 3. The 5 is the y-intercept, the height at which the line crosses the vertical axis, and it has no effect on steepness at all — every line y = 3x + c is parallel to this one. (5 quotes the intercept instead of the slope.)",
          hi: "रूप y = mx + c में ढाल m है, जो x के गुणांक से सीधे पढ़ी जाती है: यहाँ 3. 5 y-अंतःखंड है, वह ऊँचाई जिस पर रेखा ऊर्ध्व अक्ष काटती है, और उसका तीव्रता पर कोई प्रभाव नहीं — हर रेखा y = 3x + c इसके समांतर है। (5 ढाल के बजाय अंतःखंड बता देता है।)",
          mr: "रूप y = mx + c मध्ये उतारी m आहे, जी x च्या सहगुणकावरून थेट वाचली जाते: इथे 3. 5 हा y-अंतःखंड, ती उंची जिथे रेषा उभा अक्ष कापते, आणि त्याचा तीव्रतेवर काहीच परिणाम नाही — प्रत्येक रेषा y = 3x + c ही हिच्या समांतर आहे. (5 उतारीऐवजी अंतःखंड सांगते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the y-intercept of the line 2x + y = 7?",
          hi: "रेखा 2x + y = 7 का y-अंतःखंड क्या है?",
          mr: "रेषा 2x + y = 7 चा y-अंतःखंड किती?",
        },
        answer: 7,
        wrong: [3.5, 2, 0],
        checkExpr: "7-0",
        solution: {
          en: "The y-intercept is the value of y where the line meets the vertical axis, which is where x = 0. Substituting gives y = 7 − 0 = 7. Rearranging to y = −2x + 7 shows the same thing in the familiar form. (3.5 gives the x-intercept, found by setting y to zero instead.)",
          hi: "y-अंतःखंड y का वह मान है जहाँ रेखा ऊर्ध्व अक्ष से मिलती है, यानी जहाँ x = 0. प्रतिस्थापन से y = 7 − 0 = 7. y = −2x + 7 में जमाने पर वही बात परिचित रूप में दिखती है। (3.5 x-अंतःखंड देता है, जो इसके बजाय y को शून्य रखने से मिलता है।)",
          mr: "y-अंतःखंड म्हणजे y चे ते मूल्य जिथे रेषा उभ्या अक्षाला भेटते, म्हणजे जिथे x = 0. प्रतिस्थापनाने y = 7 − 0 = 7. y = −2x + 7 असे मांडल्यावर तीच गोष्ट परिचित रूपात दिसते. (3.5 x-अंतःखंड देते, जो त्याऐवजी y शून्य ठेवल्याने मिळतो.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the slope of a line perpendicular to y = 2x + 1?",
          hi: "y = 2x + 1 पर लंब रेखा की ढाल क्या है?",
          mr: "y = 2x + 1 ला लंब असलेल्या रेषेची उतारी किती?",
        },
        answer: -0.5,
        wrong: [2, 0.5, -2],
        checkExpr: "(0-1)/2",
        solution: {
          en: "Perpendicular slopes multiply to −1, so the required slope is −1/2 = −0.5. Both changes matter: flip the fraction AND change the sign. Doing only one of them gives 0.5 or −2, which are the two commonest wrong answers and both appear here. (0.5 inverts without changing the sign.)",
          hi: "लंब ढालों का गुणनफल −1 होता है, अतः चाहिए ढाल −1/2 = −0.5. दोनों बदलाव मायने रखते हैं: भिन्न उलटो और चिह्न भी बदलो। इनमें से केवल एक करने पर 0.5 या −2 मिलता है, जो दो सबसे आम ग़लत उत्तर हैं और दोनों यहाँ मौजूद हैं। (0.5 उलटता है पर चिह्न नहीं बदलता।)",
          mr: "लंब उतारींचा गुणाकार −1 असतो, म्हणून हवी असलेली उतारी −1/2 = −0.5. दोन्ही बदल महत्त्वाचे: अपूर्णांक उलटा आणि चिन्हही बदला. यांपैकी केवळ एक केल्यास 0.5 वा −2 मिळते, जी दोन सर्वांत सामान्य चुकीची उत्तरे आणि दोन्ही इथे हजर आहेत. (0.5 उलटवते पण चिन्ह बदलत नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the slope of a line parallel to 4x + 2y = 5?",
          hi: "4x + 2y = 5 के समांतर रेखा की ढाल क्या है?",
          mr: "4x + 2y = 5 ला समांतर असलेल्या रेषेची उतारी किती?",
        },
        answer: -2,
        wrong: [2, 4, -0.5],
        checkExpr: "(0-4)/2",
        solution: {
          en: "Rearrange to y = −2x + 2.5, so the slope is −2, and parallel lines share it exactly. For a line written as ax + by = c the slope is always −a/b, which here is −4/2 = −2 without any rearranging at all. The minus sign is not optional — a line with a positive x-coefficient and a positive y-coefficient always slopes downward. (2 drops the sign.)",
          hi: "y = −2x + 2.5 में जमाओ, अतः ढाल −2 है, और समांतर रेखाएँ उसे ठीक-ठीक साझा करती हैं। ax + by = c रूप में लिखी रेखा की ढाल सदा −a/b होती है, जो यहाँ बिना कुछ जमाए ही −4/2 = −2 है। ऋण चिह्न वैकल्पिक नहीं — धनात्मक x-गुणांक और धनात्मक y-गुणांक वाली रेखा सदा नीचे की ओर ढलती है। (2 चिह्न गिरा देता है।)",
          mr: "y = −2x + 2.5 असे मांडा, म्हणून उतारी −2, आणि समांतर रेषा ती नेमकी वाटून घेतात. ax + by = c या रूपात लिहिलेल्या रेषेची उतारी नेहमी −a/b असते, जी इथे काहीही न मांडता −4/2 = −2 आहे. ऋण चिन्ह ऐच्छिक नाही — धन x-सहगुणक आणि धन y-सहगुणक असलेली रेषा नेहमी खालच्या दिशेने उतरते. (2 चिन्ह गाळते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the x-intercept of the line 3x + 4y = 12?",
          hi: "रेखा 3x + 4y = 12 का x-अंतःखंड क्या है?",
          mr: "रेषा 3x + 4y = 12 चा x-अंतःखंड किती?",
        },
        answer: 4,
        wrong: [3, 12, 6],
        checkExpr: "12/3",
        solution: {
          en: "The x-intercept is where the line crosses the horizontal axis, so set y = 0: 3x = 12 and x = 12/3 = 4. The y-intercept comes from the mirror step, setting x = 0 to get y = 3. Knowing both lets you sketch any such line from two dots and a ruler, with no table of values at all. (3 gives the y-intercept, having set the wrong variable to zero.)",
          hi: "x-अंतःखंड वहाँ है जहाँ रेखा क्षैतिज अक्ष काटती है, अतः y = 0 रखो: 3x = 12 और x = 12/3 = 4. y-अंतःखंड दर्पण-चरण से आता है, x = 0 रखकर y = 3. दोनों जानने पर तुम ऐसी कोई भी रेखा दो बिंदुओं और एक पैमाने से खींच सकते हो, बिना किसी मान-सारणी के। (3 y-अंतःखंड देता है, ग़लत चर को शून्य रखकर।)",
          mr: "x-अंतःखंड तिथे जिथे रेषा आडवा अक्ष कापते, म्हणून y = 0 ठेवा: 3x = 12 आणि x = 12/3 = 4. y-अंतःखंड आरसा-पायरीतून येतो, x = 0 ठेवून y = 3. दोन्ही जाणल्यावर तुम्ही अशी कोणतीही रेषा दोन ठिपके आणि एका पट्टीने काढू शकता, कोणत्याही मूल्य-कोष्टकाविना. (3 y-अंतःखंड देते, चुकीचे चल शून्य ठेवून.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the perpendicular distance of the point (5, 6) from the line 3x + 4y − 10 = 0?",
          hi: "बिंदु (5, 6) की रेखा 3x + 4y − 10 = 0 से लंब दूरी क्या है?",
          mr: "बिंदू (5, 6) चे रेषा 3x + 4y − 10 = 0 पासूनचे लंब अंतर किती?",
        },
        answer: 5.8,
        wrong: [29, 5, 7.25],
        checkExpr: "(3*5+4*6-10)/5",
        solution: {
          en: "Substitute the point into the left-hand side and divide by the square root of the sum of the squares of the coefficients: (3 × 5 + 4 × 6 − 10)/√(9 + 16) = 29/5 = 5.8. The division is what makes it a distance rather than just a number — without it the answer would change if the equation were multiplied through by 2, even though the line had not moved. (29 stops at the numerator and never scales it.)",
          hi: "बिंदु को बाईं ओर रखो और गुणांकों के वर्गों के योग के वर्गमूल से भाग दो: (3 × 5 + 4 × 6 − 10)/√(9 + 16) = 29/5 = 5.8. वही भाग इसे दूरी बनाता है, केवल संख्या नहीं — उसके बिना उत्तर बदल जाता यदि समीकरण को 2 से गुणा कर दिया जाता, भले ही रेखा हिली ही न हो। (29 अंश पर रुक जाता है और उसे कभी मापता नहीं।)",
          mr: "बिंदू डाव्या बाजूत ठेवा आणि सहगुणकांच्या वर्गांच्या बेरजेच्या वर्गमुळाने भागा: (3 × 5 + 4 × 6 − 10)/√(9 + 16) = 29/5 = 5.8. तोच भागाकार याला अंतर बनवतो, केवळ संख्या नव्हे — त्याविना उत्तर बदलले असते जर समीकरण 2 ने गुणले असते, जरी रेषा हललीच नसती तरी. (29 अंशावर थांबते आणि त्याला कधी मोजत नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A line through the point (2, 3) has slope 2. At what value of y does it cross the y-axis?",
          hi: "बिंदु (2, 3) से जाती किसी रेखा की ढाल 2 है। वह y-अक्ष को y के किस मान पर काटती है?",
          mr: "बिंदू (2, 3) मधून जाणाऱ्या एका रेषेची उतारी 2 आहे. ती y-अक्ष y च्या कोणत्या मूल्यावर कापते?",
        },
        answer: -1,
        wrong: [1, 7, -7],
        checkExpr: "3-2*2",
        solution: {
          en: "Use y = mx + c with the known point: 3 = 2 × 2 + c, so c = 3 − 4 = −1. Equivalently, walking from x = 2 back to x = 0 means going two steps left, and each step down the line loses 2 in height, so the height falls from 3 to −1. Both routes agree, and the second is worth having because it needs no algebra at all. (7 adds the two instead of subtracting, walking the wrong way along the line.)",
          hi: "ज्ञात बिंदु के साथ y = mx + c लो: 3 = 2 × 2 + c, अतः c = 3 − 4 = −1. उसी बात को यों कहो: x = 2 से x = 0 तक लौटने का अर्थ है दो क़दम बाएँ, और रेखा पर हर क़दम ऊँचाई में 2 खोता है, अतः ऊँचाई 3 से −1 तक गिरती है। दोनों रास्ते सहमत हैं, और दूसरा रखने योग्य है क्योंकि उसमें बीजगणित लगता ही नहीं। (7 घटाने के बजाय जोड़ देता है, रेखा पर ग़लत दिशा चलकर।)",
          mr: "ज्ञात बिंदूसह y = mx + c घ्या: 3 = 2 × 2 + c, म्हणून c = 3 − 4 = −1. तेच वेगळ्या शब्दांत: x = 2 पासून x = 0 पर्यंत परतणे म्हणजे दोन पावले डावीकडे, आणि रेषेवरचे प्रत्येक पाऊल उंचीत 2 गमावते, म्हणून उंची 3 वरून −1 पर्यंत उतरते. दोन्ही मार्ग सहमत आहेत, आणि दुसरा ठेवण्याजोगा कारण त्यात बीजगणित लागतच नाही. (7 वजा करण्याऐवजी जोडते, रेषेवर चुकीच्या दिशेने चालून.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the area of the triangle formed by the line 3x + 4y = 12 with the two coordinate axes?",
          hi: "रेखा 3x + 4y = 12 द्वारा दोनों निर्देशांक अक्षों के साथ बने त्रिभुज का क्षेत्रफल क्या है?",
          mr: "रेषा 3x + 4y = 12 ने दोन्ही निर्देशांक अक्षांसह बनवलेल्या त्रिकोणाचे क्षेत्रफळ किती?",
        },
        answer: 6,
        wrong: [12, 24, 7],
        checkExpr: "4*3/2",
        solution: {
          en: "The line meets the axes at (4, 0) and (0, 3), and together with the origin those points form a right-angled triangle whose legs are the two intercepts. Its area is 4 × 3/2 = 6. The right angle at the origin is what makes this easy — the two intercepts serve directly as base and height, with no need to find any perpendicular. (12 multiplies the intercepts and forgets to halve.)",
          hi: "रेखा अक्षों से (4, 0) और (0, 3) पर मिलती है, और मूलबिंदु के साथ मिलकर वे बिंदु ऐसा समकोण त्रिभुज बनाते हैं जिसकी भुजाएँ दोनों अंतःखंड हैं। उसका क्षेत्रफल 4 × 3/2 = 6. मूलबिंदु पर समकोण ही इसे आसान बनाता है — दोनों अंतःखंड सीधे आधार और ऊँचाई का काम करते हैं, किसी लंब को ढूँढ़ने की ज़रूरत ही नहीं। (12 अंतःखंड गुणा करके आधा करना भूल जाता है।)",
          mr: "रेषा अक्षांना (4, 0) आणि (0, 3) वर भेटते, आणि आरंभबिंदूसह ते बिंदू असा काटकोन त्रिकोण बनवतात ज्याच्या बाजू दोन्ही अंतःखंड आहेत. त्याचे क्षेत्रफळ 4 × 3/2 = 6. आरंभबिंदूवरचा काटकोनच हे सोपे करतो — दोन्ही अंतःखंड थेट पाया आणि उंचीचे काम करतात, कोणताही लंब शोधण्याची गरजच नाही. (12 अंतःखंड गुणून निम्मे करणे विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the distance between the parallel lines 3x + 4y = 10 and 3x + 4y = 60?",
          hi: "समांतर रेखाओं 3x + 4y = 10 और 3x + 4y = 60 के बीच की दूरी क्या है?",
          mr: "समांतर रेषा 3x + 4y = 10 आणि 3x + 4y = 60 यांच्यातील अंतर किती?",
        },
        answer: 10,
        wrong: [50, 5, 25],
        checkExpr: "(60-10)/5",
        solution: {
          en: "For two lines with identical left-hand sides, the distance is the gap between the constants divided by √(a² + b²): (60 − 10)/√(9 + 16) = 50/5 = 10. The lines must be written with matching coefficients first — if the second had been given as 6x + 8y = 120 it would be the same line, and dividing through by 2 is what reveals that. (50 gives the raw difference and never divides.)",
          hi: "जिन दो रेखाओं का बायाँ पक्ष एक जैसा हो, उनके बीच की दूरी अचरों का अंतर बटा √(a² + b²) है: (60 − 10)/√(9 + 16) = 50/5 = 10. रेखाओं को पहले मेल खाते गुणांकों के साथ लिखना ही पड़ता है — यदि दूसरी 6x + 8y = 120 दी होती तो वह वही रेखा होती, और 2 से भाग देना ही यह उजागर करता है। (50 कच्चा अंतर देता है और भाग देता ही नहीं।)",
          mr: "ज्या दोन रेषांची डावी बाजू सारखी असेल, त्यांच्यातले अंतर म्हणजे स्थिरांकांतला फरक भागिले √(a² + b²): (60 − 10)/√(9 + 16) = 50/5 = 10. रेषा आधी जुळणाऱ्या सहगुणकांसह लिहाव्याच लागतात — दुसरी 6x + 8y = 120 अशी दिली असती तर ती तीच रेषा असती, आणि 2 ने भागणेच ते उघड करते. (50 कच्चा फरक देते आणि भागतच नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "For what value of k are the lines 2x + 3y = 7 and kx − 6y = 5 perpendicular?",
          hi: "k के किस मान पर रेखाएँ 2x + 3y = 7 और kx − 6y = 5 परस्पर लंब हैं?",
          mr: "k च्या कोणत्या मूल्यावर रेषा 2x + 3y = 7 आणि kx − 6y = 5 परस्पर लंब आहेत?",
        },
        answer: 9,
        wrong: [4, 6, -9],
        checkExpr: "18/2",
        solution: {
          en: "The slopes are −2/3 and −k/(−6) = k/6. For perpendicularity their product must be −1: (−2/3)(k/6) = −1, so −2k = −18 and k = 9. The two minus signs are where this goes wrong — the second line has −6y, so its slope is positive, and missing that produces −9. A quick check confirms the answer: the slopes are then −2/3 and 3/2, which do multiply to −1. (−9 mishandles the sign of the second slope.)",
          hi: "ढालें हैं −2/3 और −k/(−6) = k/6. लंबता के लिए उनका गुणनफल −1 होना चाहिए: (−2/3)(k/6) = −1, अतः −2k = −18 और k = 9. दोनों ऋण चिह्न ही वह जगह हैं जहाँ यह बिगड़ता है — दूसरी रेखा में −6y है, अतः उसकी ढाल धनात्मक है, और उसे चूकने पर −9 बनता है। तेज़ जाँच उत्तर की पुष्टि करती है: तब ढालें −2/3 और 3/2 हैं, जिनका गुणनफल सचमुच −1 है। (−9 दूसरी ढाल का चिह्न ग़लत सँभालता है।)",
          mr: "उतारी आहेत −2/3 आणि −k/(−6) = k/6. लंबतेसाठी त्यांचा गुणाकार −1 असावा: (−2/3)(k/6) = −1, म्हणून −2k = −18 आणि k = 9. दोन्ही ऋण चिन्हे हीच ती जागा जिथे हे बिघडते — दुसऱ्या रेषेत −6y आहे, म्हणून तिची उतारी धन आहे, आणि ते चुकवल्यास −9 बनते. झटपट तपासणी उत्तराची खात्री देते: तेव्हा उतारी −2/3 आणि 3/2 आहेत, ज्यांचा गुणाकार खरोखर −1. (−9 दुसऱ्या उतारीचे चिन्ह चुकीचे हाताळते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A line segment joins (1, 2) and (5, 8). What is the sum of the coordinates of its midpoint?",
          hi: "कोई रेखाखंड (1, 2) और (5, 8) को मिलाता है। उसके मध्यबिंदु के निर्देशांकों का योग क्या है?",
          mr: "एक रेषाखंड (1, 2) आणि (5, 8) यांना जोडतो. त्याच्या मध्यबिंदूच्या निर्देशांकांची बेरीज किती?",
        },
        answer: 8,
        wrong: [16, 7, 9],
        checkExpr: "(1+5)/2+(2+8)/2",
        solution: {
          en: "The midpoint averages each coordinate separately: x = (1 + 5)/2 = 3 and y = (2 + 8)/2 = 5, so the point is (3, 5) and the sum asked for is 8. Averaging the two coordinates independently is the whole method, and it is worth seeing why it works — the midpoint is half a step along in both directions at once, and the two directions do not interfere. (16 adds all four coordinates without halving.)",
          hi: "मध्यबिंदु हर निर्देशांक का अलग-अलग औसत लेता है: x = (1 + 5)/2 = 3 और y = (2 + 8)/2 = 5, अतः बिंदु (3, 5) है और माँगा गया योग 8. दोनों निर्देशांकों का स्वतंत्र औसत लेना ही पूरी विधि है, और यह देखने योग्य है कि वह क्यों चलती है — मध्यबिंदु दोनों दिशाओं में एक साथ आधा क़दम है, और दोनों दिशाएँ एक-दूसरे में दख़ल नहीं देतीं। (16 चारों निर्देशांक जोड़ देता है बिना आधा किए।)",
          mr: "मध्यबिंदू प्रत्येक निर्देशांकाची वेगवेगळी सरासरी घेतो: x = (1 + 5)/2 = 3 आणि y = (2 + 8)/2 = 5, म्हणून बिंदू (3, 5) आणि विचारलेली बेरीज 8. दोन्ही निर्देशांकांची स्वतंत्र सरासरी घेणे हीच अख्खी पद्धत, आणि ती का चालते हे पाहण्याजोगे — मध्यबिंदू दोन्ही दिशांना एकाच वेळी अर्धे पाऊल आहे, आणि दोन्ही दिशा एकमेकांत ढवळाढवळ करत नाहीत. (16 चारही निर्देशांक जोडते निम्मे न करता.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "The points (1, 2), (3, k) and (5, 8) are collinear. What is k?",
          hi: "बिंदु (1, 2), (3, k) और (5, 8) संरेख हैं। k क्या है?",
          mr: "बिंदू (1, 2), (3, k) आणि (5, 8) एकरेषीय आहेत. k किती?",
        },
        answer: 5,
        wrong: [4, 6, 10],
        checkExpr: "2+(8-2)/4*2",
        solution: {
          en: "Collinear means all three lie on one line, so any two of them give the same slope. The outer pair gives (8 − 2)/(5 − 1) = 6/4 = 1.5. Starting at (1, 2) and moving 2 across therefore lifts you 2 × 1.5 = 3, so k = 2 + 3 = 5. Testing collinearity by comparing slopes is the arithmetic version of looking along a ruler, and it is exact where the eye is not. Note that the middle point here happens to be the midpoint of the outer two, which is why the answer is also the average of 2 and 8. (6 uses a slope of 2, read from the y-values alone without dividing by the x-gap.)",
          hi: "संरेख का अर्थ है तीनों एक ही रेखा पर हैं, अतः उनमें से कोई भी दो वही ढाल देते हैं। बाहरी युग्म देता है (8 − 2)/(5 − 1) = 6/4 = 1.5. अतः (1, 2) से चलकर 2 आगे बढ़ने पर तुम 2 × 1.5 = 3 ऊपर उठते हो, अतः k = 2 + 3 = 5. ढालों की तुलना करके संरेखता जाँचना पैमाने के साथ नज़र दौड़ाने का अंकगणितीय रूप है, और वह वहाँ यथार्थ है जहाँ आँख नहीं। ध्यान दो कि यहाँ बीच का बिंदु संयोग से बाहरी दोनों का मध्यबिंदु है, इसीलिए उत्तर 2 और 8 का औसत भी है। (6 ढाल 2 लेता है, केवल y-मानों से पढ़कर, x-अंतर से भाग दिए बिना।)",
          mr: "एकरेषीय म्हणजे तिन्ही एकाच रेषेवर आहेत, म्हणून त्यांपैकी कोणतेही दोन तीच उतारी देतात. बाहेरची जोडी देते (8 − 2)/(5 − 1) = 6/4 = 1.5. म्हणून (1, 2) पासून चालून 2 पुढे सरकल्यावर तुम्ही 2 × 1.5 = 3 वर उचलले जाता, म्हणून k = 2 + 3 = 5. उतारींची तुलना करून एकरेषीयता तपासणे हे पट्टीबरोबर नजर फिरवण्याचे अंकगणिती रूप, आणि ते तिथे अचूक जिथे डोळा नाही. लक्षात घ्या की इथे मधला बिंदू योगायोगाने बाहेरच्या दोघांचा मध्यबिंदू आहे, म्हणूनच उत्तर 2 आणि 8 ची सरासरीही आहे. (6 उतारी 2 घेते, केवळ y-मूल्यांवरून वाचून, x-फरकाने न भागता.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "The line 4x + 3y = 24 cuts the axes at two points. How long is the segment between them?",
          hi: "रेखा 4x + 3y = 24 अक्षों को दो बिंदुओं पर काटती है। उनके बीच का खंड कितना लंबा है?",
          mr: "रेषा 4x + 3y = 24 अक्षांना दोन बिंदूंवर कापते. त्यांच्यातील खंड किती लांब आहे?",
        },
        answer: 10,
        wrong: [14, 25, 7],
        checkExpr: "(36+64)/10",
        solution: {
          en: "The intercepts are at (6, 0) and (0, 8), so the segment is the hypotenuse of a right-angled triangle with legs 6 and 8: √(36 + 64) = √100 = 10. Reaching for Pythagoras rather than the distance formula is the shortcut worth having here, because the right angle at the origin is already given. Note the trap the first option sets — the length of the slanted segment is not the sum of the two intercepts, and 6 + 8 = 14 would be the distance only if you walked along the axes instead of straight across. (14 adds the intercepts as though travelling along the axes.)",
          hi: "अंतःखंड (6, 0) और (0, 8) पर हैं, अतः खंड 6 और 8 भुजाओं वाले समकोण त्रिभुज का कर्ण है: √(36 + 64) = √100 = 10. दूरी-सूत्र के बजाय पाइथागोरस की ओर हाथ बढ़ाना यहाँ रखने योग्य शॉर्टकट है, क्योंकि मूलबिंदु पर समकोण पहले से दिया हुआ है। पहला विकल्प जो जाल बिछाता है उस पर ध्यान दो — तिरछे खंड की लंबाई दोनों अंतःखंडों का योग नहीं, और 6 + 8 = 14 दूरी तभी होती जब तुम सीधे पार जाने के बजाय अक्षों के साथ-साथ चलते। (14 अंतःखंड जोड़ देता है मानो अक्षों के साथ चला जा रहा हो।)",
          mr: "अंतःखंड (6, 0) आणि (0, 8) वर आहेत, म्हणून खंड हा 6 आणि 8 बाजू असलेल्या काटकोन त्रिकोणाचा कर्ण: √(36 + 64) = √100 = 10. अंतर-सूत्राऐवजी पायथागोरसकडे हात वळवणे हा इथे ठेवण्याजोगा शॉर्टकट, कारण आरंभबिंदूवरचा काटकोन आधीच दिलेला आहे. पहिला पर्याय जो सापळा रचतो त्याकडे लक्ष द्या — तिरप्या खंडाची लांबी दोन्ही अंतःखंडांची बेरीज नव्हे, आणि 6 + 8 = 14 हे अंतर तेव्हाच झाले असते जेव्हा तुम्ही सरळ पार जाण्याऐवजी अक्षांबरोबर चालला असता. (14 अंतःखंड जोडते जणू अक्षांबरोबर चालले जात असावे.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-straight-lines",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 9 — Straight Lines",
      name: "Straight Lines",
      summary:
        "A line turned into an equation and then interrogated by arithmetic: a slope that decides at a glance whether two lines meet, a formula that measures the distance from a point to a line without drawing the perpendicular, and three points tested for collinearity by comparing two slopes rather than by looking.",
      position: 9,
      translations: {
        hi: {
          name: "सरल रेखाएँ",
          summary:
            "रेखा को समीकरण बनाकर फिर अंकगणित से पूछताछ: ऐसी ढाल जो एक नज़र में तय कर दे कि दो रेखाएँ मिलेंगी या नहीं, ऐसा सूत्र जो लंब खींचे बिना किसी बिंदु से रेखा की दूरी नाप ले, और तीन बिंदु जिनकी संरेखता देखकर नहीं, दो ढालों की तुलना करके जाँची जाती है।",
        },
        mr: {
          name: "सरळ रेषा",
          summary:
            "रेषेला समीकरण बनवून मग अंकगणिताने विचारपूस: अशी उतारी जी एका नजरेत ठरवते की दोन रेषा भेटतील का, असे सूत्र जे लंब न काढता एखाद्या बिंदूपासून रेषेचे अंतर मोजते, आणि तीन बिंदू ज्यांची एकरेषीयता पाहून नव्हे, दोन उतारींची तुलना करून तपासली जाते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 10 — Conic Sections (one cone, four curves)                       */
/* ------------------------------------------------------------------------- */
function conicSections11(): TopicFileOut {
  const rand = rng("maths-11-conic-sections");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the radius of the circle x² + y² = 49?",
          hi: "वृत्त x² + y² = 49 की त्रिज्या क्या है?",
          mr: "वर्तुळ x² + y² = 49 ची त्रिज्या किती?",
        },
        answer: 7,
        wrong: [49, 24.5, 14],
        checkExpr: "49/7",
        solution: {
          en: "In the form x² + y² = r² the right-hand side is the radius SQUARED, so r² = 49 and r = 7. The equation is just Pythagoras applied to every point: a point (x, y) lies on the circle exactly when its distance from the origin is 7. (49 quotes the square rather than the radius itself.)",
          hi: "रूप x² + y² = r² में दायाँ पक्ष त्रिज्या का वर्ग है, अतः r² = 49 और r = 7. समीकरण हर बिंदु पर लगाया गया पाइथागोरस ही है: बिंदु (x, y) वृत्त पर ठीक तभी है जब मूलबिंदु से उसकी दूरी 7 हो। (49 त्रिज्या नहीं, उसका वर्ग बता देता है।)",
          mr: "रूप x² + y² = r² मध्ये उजवी बाजू ही त्रिज्येचा वर्ग आहे, म्हणून r² = 49 आणि r = 7. समीकरण म्हणजे प्रत्येक बिंदूवर लावलेला पायथागोरसच: बिंदू (x, y) वर्तुळावर नेमका तेव्हाच जेव्हा आरंभबिंदूपासून त्याचे अंतर 7 असेल. (49 त्रिज्या नव्हे, तिचा वर्ग सांगते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "For the circle (x − 3)² + (y + 4)² = 25, what is the SUM of the coordinates of the centre?",
          hi: "वृत्त (x − 3)² + (y + 4)² = 25 के केंद्र के निर्देशांकों का योग क्या है?",
          mr: "वर्तुळ (x − 3)² + (y + 4)² = 25 च्या केंद्राच्या निर्देशांकांची बेरीज किती?",
        },
        answer: -1,
        wrong: [7, 1, -7],
        checkExpr: "3-4",
        solution: {
          en: "The centre is read off with the signs REVERSED: (x − 3)² gives 3 and (y + 4)² gives −4, so the centre is (3, −4) and the sum is 3 − 4 = −1. Writing the second bracket as (y − (−4))² makes the reversal obvious rather than a rule to memorise. (7 takes the signs as written and reads the centre as (3, 4).)",
          hi: "केंद्र चिह्न उलटकर पढ़ा जाता है: (x − 3)² से 3 और (y + 4)² से −4, अतः केंद्र (3, −4) है और योग 3 − 4 = −1. दूसरे कोष्ठक को (y − (−4))² लिखने पर उलटाव नियम रटने के बजाय स्पष्ट दिखने लगता है। (7 चिह्न जैसे लिखे हैं वैसे ले लेता है और केंद्र (3, 4) पढ़ता है।)",
          mr: "केंद्र चिन्हे उलटवून वाचले जाते: (x − 3)² मधून 3 आणि (y + 4)² मधून −4, म्हणून केंद्र (3, −4) आणि बेरीज 3 − 4 = −1. दुसरा कंस (y − (−4))² असा लिहिल्यावर उलटापालट नियम पाठ करण्याऐवजी स्पष्ट दिसते. (7 चिन्हे लिहिल्याप्रमाणे घेते आणि केंद्र (3, 4) वाचते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the radius of the circle (x − 3)² + (y + 4)² = 25?",
          hi: "वृत्त (x − 3)² + (y + 4)² = 25 की त्रिज्या क्या है?",
          mr: "वर्तुळ (x − 3)² + (y + 4)² = 25 ची त्रिज्या किती?",
        },
        answer: 5,
        wrong: [25, 12.5, 10],
        checkExpr: "25/5",
        solution: {
          en: "Again the right-hand side is r², so r = 5. Moving the centre away from the origin changes nothing about the radius — shifting a circle does not resize it, and the two brackets carry the position while the constant carries the size. (25 gives r² instead of r.)",
          hi: "फिर दायाँ पक्ष r² है, अतः r = 5. केंद्र को मूलबिंदु से हटाने पर त्रिज्या के बारे में कुछ नहीं बदलता — वृत्त को सरकाने से उसका आकार नहीं बदलता, और दोनों कोष्ठक स्थिति ढोते हैं जबकि अचर आकार। (25 r के बजाय r² दे देता है।)",
          mr: "पुन्हा उजवी बाजू r² आहे, म्हणून r = 5. केंद्र आरंभबिंदूपासून हलवल्याने त्रिज्येबद्दल काहीच बदलत नाही — वर्तुळ सरकवल्याने त्याचा आकार बदलत नाही, आणि दोन्ही कंस स्थान वाहतात तर स्थिरांक आकार. (25 r ऐवजी r² देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "For the parabola y² = 12x, what is the x-coordinate of the focus?",
          hi: "परवलय y² = 12x के लिए नाभि का x-निर्देशांक क्या है?",
          mr: "पॅराबोला y² = 12x साठी नाभीचा x-निर्देशांक किती?",
        },
        answer: 3,
        wrong: [12, 6, 1.5],
        checkExpr: "12/4",
        solution: {
          en: "Compare with the standard form y² = 4ax: here 4a = 12, so a = 3 and the focus is at (3, 0). The same a places the directrix at x = −3, the mirror of the focus on the other side of the vertex — and every point of the curve is equidistant from those two. (6 halves 12 instead of quartering it.)",
          hi: "मानक रूप y² = 4ax से तुलना करो: यहाँ 4a = 12, अतः a = 3 और नाभि (3, 0) पर है। वही a नियता को x = −3 पर रखता है, जो शीर्ष के दूसरी ओर नाभि का दर्पण है — और वक्र का हर बिंदु उन दोनों से समान दूरी पर है। (6 12 को चौथाई करने के बजाय आधा कर देता है।)",
          mr: "प्रमाण रूप y² = 4ax शी तुलना करा: इथे 4a = 12, म्हणून a = 3 आणि नाभी (3, 0) वर आहे. तोच a नियताला x = −3 वर ठेवतो, जो शिरोबिंदूच्या दुसऱ्या बाजूला नाभीचा आरसा — आणि वक्राचा प्रत्येक बिंदू त्या दोघांपासून समान अंतरावर आहे. (6 12 ला चतुर्थांश करण्याऐवजी निम्मे करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the length of the latus rectum of the parabola y² = 12x?",
          hi: "परवलय y² = 12x के नाभिलंब की लंबाई क्या है?",
          mr: "पॅराबोला y² = 12x च्या नाभिलंबाची लांबी किती?",
        },
        answer: 12,
        wrong: [3, 6, 24],
        checkExpr: "4*3",
        solution: {
          en: "The latus rectum is the chord through the focus at right angles to the axis, and its length is 4a = 4 × 3 = 12 — which is exactly the coefficient of x, already sitting in the equation. That is worth noticing: for y² = 4ax the number in front of x IS the latus rectum, so no working is needed once the form is recognised. (3 gives a, the distance from vertex to focus.)",
          hi: "नाभिलंब वह जीवा है जो नाभि से होकर अक्ष पर लंब है, और उसकी लंबाई 4a = 4 × 3 = 12 है — जो ठीक x का गुणांक है, समीकरण में पहले से बैठा हुआ। यह ध्यान देने योग्य है: y² = 4ax के लिए x के आगे की संख्या ही नाभिलंब है, अतः रूप पहचान लेने पर कोई काम करना ही नहीं पड़ता। (3 a देता है, शीर्ष से नाभि तक की दूरी।)",
          mr: "नाभिलंब ही ती जीवा जी नाभीतून जाऊन अक्षाला लंब आहे, आणि तिची लांबी 4a = 4 × 3 = 12 — जो नेमका x चा सहगुणक, समीकरणात आधीच बसलेला. हे लक्षात घेण्याजोगे: y² = 4ax साठी x पुढची संख्याच नाभिलंब आहे, म्हणून रूप ओळखल्यावर काहीही काम करावे लागत नाही. (3 a देते, शिरोबिंदूपासून नाभीपर्यंतचे अंतर.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "For the ellipse x²/25 + y²/9 = 1, what is the length of the major axis?",
          hi: "दीर्घवृत्त x²/25 + y²/9 = 1 के दीर्घ अक्ष की लंबाई क्या है?",
          mr: "दीर्घवर्तुळ x²/25 + y²/9 = 1 च्या दीर्घ अक्षाची लांबी किती?",
        },
        answer: 10,
        wrong: [5, 25, 6],
        checkExpr: "2*5",
        solution: {
          en: "The larger denominator is a² = 25, so a = 5 and the major axis, which stretches from one end of the ellipse to the other through the centre, is 2a = 10. The word AXIS means the whole width, not the half — that doubling is the step most often dropped. (5 gives a, the semi-major axis.)",
          hi: "बड़ा हर a² = 25 है, अतः a = 5 और दीर्घ अक्ष, जो दीर्घवृत्त के एक सिरे से केंद्र होकर दूसरे तक फैलता है, 2a = 10 है। अक्ष शब्द का अर्थ पूरी चौड़ाई है, आधी नहीं — वही दुगुना करना सबसे अधिक छूटता है। (5 a देता है, अर्ध-दीर्घ अक्ष।)",
          mr: "मोठा छेद a² = 25 आहे, म्हणून a = 5 आणि दीर्घ अक्ष, जो दीर्घवर्तुळाच्या एका टोकापासून केंद्रातून दुसऱ्यापर्यंत पसरतो, 2a = 10 आहे. अक्ष या शब्दाचा अर्थ अख्खी रुंदी, अर्धी नव्हे — तेच दुप्पट करणे सर्वाधिक वेळा गळते. (5 a देते, अर्ध-दीर्घ अक्ष.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "For the ellipse x²/25 + y²/9 = 1, what is the length of the minor axis?",
          hi: "दीर्घवृत्त x²/25 + y²/9 = 1 के लघु अक्ष की लंबाई क्या है?",
          mr: "दीर्घवर्तुळ x²/25 + y²/9 = 1 च्या लघु अक्षाची लांबी किती?",
        },
        answer: 6,
        wrong: [3, 9, 18],
        checkExpr: "2*3",
        solution: {
          en: "The smaller denominator is b² = 9, so b = 3 and the minor axis is 2b = 6. Which denominator is larger decides which way the ellipse is stretched — here the 25 sits under x², so the long direction is horizontal. Swap the two numbers and the same ellipse stands on its end. (3 gives the semi-minor axis rather than the full width.)",
          hi: "छोटा हर b² = 9 है, अतः b = 3 और लघु अक्ष 2b = 6. कौन-सा हर बड़ा है यह तय करता है कि दीर्घवृत्त किस ओर खिंचा है — यहाँ 25 x² के नीचे है, अतः लंबी दिशा क्षैतिज है। दोनों संख्याएँ अदल-बदल दो और वही दीर्घवृत्त खड़ा हो जाता है। (3 पूरी चौड़ाई नहीं, अर्ध-लघु अक्ष देता है।)",
          mr: "लहान छेद b² = 9 आहे, म्हणून b = 3 आणि लघु अक्ष 2b = 6. कोणता छेद मोठा हे ठरवते की दीर्घवर्तुळ कोणत्या दिशेने ताणले आहे — इथे 25 हा x² खाली आहे, म्हणून लांब दिशा आडवी. दोन्ही संख्या अदलाबदल करा आणि तेच दीर्घवर्तुळ उभे राहते. (3 अख्खी रुंदी नव्हे, अर्ध-लघु अक्ष देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the eccentricity of the ellipse x²/25 + y²/9 = 1?",
          hi: "दीर्घवृत्त x²/25 + y²/9 = 1 की उत्केंद्रता क्या है?",
          mr: "दीर्घवर्तुळ x²/25 + y²/9 = 1 ची उत्केंद्रता किती?",
        },
        answer: 0.8,
        wrong: [0.6, 1.25, 0.36],
        checkExpr: "4/5",
        solution: {
          en: "For an ellipse c² = a² − b² = 25 − 9 = 16, so c = 4 and e = c/a = 4/5 = 0.8. The eccentricity measures how far the shape has departed from a circle: at e = 0 the two foci coincide at the centre and the ellipse IS a circle, while as e approaches 1 it flattens towards a line segment. An answer above 1 is therefore impossible here, which rules out one of the options before any arithmetic. (1.25 inverts the ratio, giving a/c.)",
          hi: "दीर्घवृत्त के लिए c² = a² − b² = 25 − 9 = 16, अतः c = 4 और e = c/a = 4/5 = 0.8. उत्केंद्रता मापती है कि आकृति वृत्त से कितनी दूर चली गई है: e = 0 पर दोनों नाभियाँ केंद्र पर मिल जाती हैं और दीर्घवृत्त वृत्त ही होता है, जबकि e के 1 के पास पहुँचते ही वह रेखाखंड की ओर चपटा हो जाता है। अतः यहाँ 1 से ऊपर का उत्तर असंभव है, जो कोई गणित करने से पहले ही एक विकल्प बाहर कर देता है। (1.25 अनुपात उलट देता है, a/c देकर।)",
          mr: "दीर्घवर्तुळासाठी c² = a² − b² = 25 − 9 = 16, म्हणून c = 4 आणि e = c/a = 4/5 = 0.8. उत्केंद्रता मोजते की आकृती वर्तुळापासून किती दूर गेली आहे: e = 0 वर दोन्ही नाभी केंद्रावर एकत्र येतात आणि दीर्घवर्तुळ वर्तुळच असते, तर e 1 च्या जवळ जाताच ते रेषाखंडाकडे सपाट होते. म्हणून इथे 1 हून वरचे उत्तर अशक्य आहे, जे कोणतेही गणित करण्याआधीच एक पर्याय बाद करते. (1.25 गुणोत्तर उलटवते, a/c देऊन.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the eccentricity of the hyperbola x²/16 − y²/9 = 1?",
          hi: "अतिपरवलय x²/16 − y²/9 = 1 की उत्केंद्रता क्या है?",
          mr: "अतिपरावलय x²/16 − y²/9 = 1 ची उत्केंद्रता किती?",
        },
        answer: 1.25,
        wrong: [0.8, 0.75, 1.75],
        checkExpr: "5/4",
        solution: {
          en: "For a hyperbola c² = a² + b² = 16 + 9 = 25, so c = 5 and e = c/a = 5/4 = 1.25. Note the single change from the ellipse: the relation adds instead of subtracting, which follows from the minus sign in the equation. That one sign is the whole difference between the two curves, and it forces the eccentricity above 1 — a hyperbola always has e greater than 1, an ellipse always less, and a parabola sits exactly at 1. (0.8 uses the ellipse relation with subtraction.)",
          hi: "अतिपरवलय के लिए c² = a² + b² = 16 + 9 = 25, अतः c = 5 और e = c/a = 5/4 = 1.25. दीर्घवृत्त से इकलौता बदलाव ध्यान दो: संबंध घटाने के बजाय जोड़ता है, जो समीकरण के ऋण चिह्न से निकलता है। वही एक चिह्न दोनों वक्रों का पूरा अंतर है, और वह उत्केंद्रता को 1 से ऊपर कर देता है — अतिपरवलय का e सदा 1 से बड़ा, दीर्घवृत्त का सदा छोटा, और परवलय ठीक 1 पर बैठता है। (0.8 घटाव के साथ दीर्घवृत्त वाला संबंध लगा देता है।)",
          mr: "अतिपरावलयासाठी c² = a² + b² = 16 + 9 = 25, म्हणून c = 5 आणि e = c/a = 5/4 = 1.25. दीर्घवर्तुळाहून एकमेव बदल लक्षात घ्या: संबंध वजा करण्याऐवजी जोडतो, जो समीकरणातल्या ऋण चिन्हातून निघतो. तेच एक चिन्ह दोन्ही वक्रांचा अख्खा फरक, आणि ते उत्केंद्रता 1 हून वर नेते — अतिपरावलयाचा e नेहमी 1 हून मोठा, दीर्घवर्तुळाचा नेहमी लहान, आणि पॅराबोला नेमका 1 वर बसतो. (0.8 वजाबाकीसह दीर्घवर्तुळाचा संबंध लावते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is the radius of the circle x² + y² − 6x − 8y = 0?",
          hi: "वृत्त x² + y² − 6x − 8y = 0 की त्रिज्या क्या है?",
          mr: "वर्तुळ x² + y² − 6x − 8y = 0 ची त्रिज्या किती?",
        },
        answer: 5,
        wrong: [25, 7, 10],
        checkExpr: "(9+16)/5",
        solution: {
          en: "Complete the square in each variable: (x − 3)² + (y − 4)² = 9 + 16 = 25, so the centre is (3, 4) and the radius is 5. Notice that the equation has no constant term, which means the origin satisfies it — the circle passes through (0, 0), and indeed the distance from (3, 4) to the origin is exactly 5. That is a free check on the working. (25 quotes r² without taking the root.)",
          hi: "हर चर में वर्ग पूरा करो: (x − 3)² + (y − 4)² = 9 + 16 = 25, अतः केंद्र (3, 4) और त्रिज्या 5. ध्यान दो कि समीकरण में कोई अचर पद नहीं, जिसका अर्थ है कि मूलबिंदु उसे संतुष्ट करता है — वृत्त (0, 0) से होकर जाता है, और सचमुच (3, 4) से मूलबिंदु की दूरी ठीक 5 है। यह काम की मुफ़्त जाँच है। (25 r² बता देता है, मूल लिए बिना।)",
          mr: "प्रत्येक चलात वर्ग पूर्ण करा: (x − 3)² + (y − 4)² = 9 + 16 = 25, म्हणून केंद्र (3, 4) आणि त्रिज्या 5. लक्षात घ्या की समीकरणात स्थिर पद नाही, म्हणजे आरंभबिंदू ते समाधानी करतो — वर्तुळ (0, 0) मधून जाते, आणि खरोखर (3, 4) पासून आरंभबिंदूचे अंतर नेमके 5 आहे. ही कामाची फुकट तपासणी. (25 r² सांगते, मूळ न घेता.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "For the parabola x² = 16y, what is the distance from the vertex to the directrix?",
          hi: "परवलय x² = 16y के लिए शीर्ष से नियता तक की दूरी क्या है?",
          mr: "पॅराबोला x² = 16y साठी शिरोबिंदूपासून नियतेपर्यंतचे अंतर किती?",
        },
        answer: 4,
        wrong: [16, 8, 2],
        checkExpr: "16/4",
        solution: {
          en: "This parabola opens upward, so compare it with x² = 4ay: 4a = 16 gives a = 4. The focus is at (0, 4) and the directrix is the line y = −4, both a distance of 4 from the vertex at the origin. The vertex is always exactly halfway between focus and directrix — that is what the defining property demands, since the vertex is a point of the curve and must be equidistant from the two. Note that the roles of x and y have swapped from the earlier questions; the curve opens along whichever variable is NOT squared. (8 gives the distance from the focus to the directrix, which is twice the answer.)",
          hi: "यह परवलय ऊपर की ओर खुलता है, अतः x² = 4ay से तुलना करो: 4a = 16 से a = 4. नाभि (0, 4) पर है और नियता रेखा y = −4, दोनों मूलबिंदु पर बैठे शीर्ष से 4 की दूरी पर। शीर्ष सदा नाभि और नियता के ठीक बीच होता है — परिभाषक गुण यही माँगता है, क्योंकि शीर्ष वक्र का बिंदु है और उसे दोनों से समान दूरी पर होना ही पड़ता है। ध्यान दो कि पहले के प्रश्नों से x और y की भूमिकाएँ बदल गई हैं; वक्र उसी चर के साथ खुलता है जिसका वर्ग नहीं है। (8 नाभि से नियता तक की दूरी देता है, जो उत्तर की दुगुनी है।)",
          mr: "हा पॅराबोला वरच्या दिशेने उघडतो, म्हणून x² = 4ay शी तुलना करा: 4a = 16 यातून a = 4. नाभी (0, 4) वर आहे आणि नियता ही रेषा y = −4, दोन्ही आरंभबिंदूवरच्या शिरोबिंदूपासून 4 अंतरावर. शिरोबिंदू नेहमी नाभी आणि नियतेच्या नेमका मध्ये असतो — परिभाषक गुणधर्म हेच मागतो, कारण शिरोबिंदू हा वक्राचा बिंदू आहे आणि त्याला दोघांपासून समान अंतरावर असावेच लागते. लक्षात घ्या की आधीच्या प्रश्नांहून x आणि y च्या भूमिका बदलल्या आहेत; वक्र त्याच चलाबरोबर उघडतो ज्याचा वर्ग नाही. (8 नाभीपासून नियतेपर्यंतचे अंतर देते, जे उत्तराच्या दुप्पट.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "An ellipse has a major axis of 26 and a minor axis of 24. What is the distance between its two foci?",
          hi: "किसी दीर्घवृत्त का दीर्घ अक्ष 26 और लघु अक्ष 24 है। उसकी दोनों नाभियों के बीच की दूरी क्या है?",
          mr: "एका दीर्घवर्तुळाचा दीर्घ अक्ष 26 आणि लघु अक्ष 24 आहे. त्याच्या दोन नाभींमधील अंतर किती?",
        },
        answer: 10,
        wrong: [5, 13, 24],
        checkExpr: "2*5",
        solution: {
          en: "Halve the axes first: a = 13 and b = 12. Then c² = a² − b² = 169 − 144 = 25, so c = 5 and the two foci, one on each side of the centre, are 2c = 10 apart. Two halvings and one doubling is the shape of this question, and skipping either is where marks go. The eccentricity here is 5/13, well under 1, so the ellipse is only mildly flattened — consistent with axes that differ by less than a tenth. (5 gives c, the distance from the centre to ONE focus.)",
          hi: "पहले अक्ष आधे करो: a = 13 और b = 12. फिर c² = a² − b² = 169 − 144 = 25, अतः c = 5 और दोनों नाभियाँ, केंद्र के हर ओर एक, 2c = 10 दूर हैं। दो बार आधा और एक बार दुगुना करना ही इस प्रश्न का आकार है, और इनमें से कोई छोड़ना ही अंक खाता है। यहाँ उत्केंद्रता 5/13 है, 1 से अच्छी-ख़ासी नीचे, अतः दीर्घवृत्त केवल हल्का-सा चपटा है — उन अक्षों के अनुरूप जो दसवें भाग से भी कम भिन्न हैं। (5 c देता है, केंद्र से एक नाभि तक की दूरी।)",
          mr: "आधी अक्ष निम्मे करा: a = 13 आणि b = 12. मग c² = a² − b² = 169 − 144 = 25, म्हणून c = 5 आणि दोन्ही नाभी, केंद्राच्या प्रत्येक बाजूला एक, 2c = 10 अंतरावर. दोनदा निम्मे आणि एकदा दुप्पट करणे हाच या प्रश्नाचा आकार, आणि यांपैकी कोणतेही सोडणे गुण खाते. इथे उत्केंद्रता 5/13 आहे, 1 हून बरीच खाली, म्हणून दीर्घवर्तुळ केवळ किंचित सपाट — दशांशाहूनही कमी वेगळ्या असलेल्या अक्षांशी सुसंगत. (5 c देते, केंद्रापासून एका नाभीपर्यंतचे अंतर.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A parabolic reflector is 20 cm across at its rim and 5 cm deep at the centre. How far from the vertex is its focus?",
          hi: "कोई परवलयी परावर्तक अपने किनारे पर 20 cm चौड़ा और बीच में 5 cm गहरा है। उसकी नाभि शीर्ष से कितनी दूर है?",
          mr: "एक पॅराबोलिक परावर्तक आपल्या कडेला 20 cm रुंद आणि मध्यात 5 cm खोल आहे. त्याची नाभी शिरोबिंदूपासून किती दूर आहे?",
        },
        answer: 5,
        wrong: [10, 20, 2.5],
        checkExpr: "100/20",
        solution: {
          en: "Put the vertex at the origin with the dish opening along the x-axis, so the curve is y² = 4ax. The rim is 20 cm across, meaning it reaches 10 cm above the axis, and it does so at a depth of 5 cm — so the point (5, 10) lies on the curve. Substituting: 100 = 4a × 5 = 20a, giving a = 5 cm. The focus is therefore 5 cm from the vertex, which happens to be exactly at the plane of the rim. Setting up the axes yourself is the real work in a question like this; the algebra afterwards is one substitution. This is also why the shape is used at all — every ray arriving parallel to the axis is reflected through that single point, which is what makes a dish antenna, a torch reflector and a solar cooker possible. (10 uses the full width of 20 as the y-value instead of half of it.)",
          hi: "शीर्ष को मूलबिंदु पर रखो और थाली को x-अक्ष के साथ खुलने दो, अतः वक्र y² = 4ax है। किनारा 20 cm चौड़ा है, यानी वह अक्ष से 10 cm ऊपर पहुँचता है, और वह भी 5 cm की गहराई पर — अतः बिंदु (5, 10) वक्र पर है। प्रतिस्थापन: 100 = 4a × 5 = 20a, जिससे a = 5 cm. अतः नाभि शीर्ष से 5 cm दूर है, जो संयोग से ठीक किनारे के तल पर पड़ती है। ऐसे प्रश्न में असली काम अक्ष स्वयं जमाना है; उसके बाद का बीजगणित एक प्रतिस्थापन है। यही कारण भी है कि यह आकार काम में लिया जाता है — अक्ष के समांतर आती हर किरण उसी एक बिंदु से होकर परावर्तित होती है, और इसी से डिश एंटीना, टॉर्च का परावर्तक और सौर कुकर संभव होते हैं। (10 आधी के बजाय पूरी 20 की चौड़ाई को y-मान मान लेता है।)",
          mr: "शिरोबिंदू आरंभबिंदूवर ठेवा आणि तबकडी x-अक्षाबरोबर उघडू द्या, म्हणून वक्र y² = 4ax. कडा 20 cm रुंद आहे, म्हणजे ती अक्षापासून 10 cm वर पोहोचते, आणि तेही 5 cm खोलीवर — म्हणून बिंदू (5, 10) वक्रावर आहे. प्रतिस्थापन: 100 = 4a × 5 = 20a, ज्यातून a = 5 cm. म्हणून नाभी शिरोबिंदूपासून 5 cm दूर, जी योगायोगाने नेमकी कडेच्या पातळीवर पडते. अशा प्रश्नात खरे काम अक्ष स्वतः मांडणे; त्यानंतरचे बीजगणित एक प्रतिस्थापन. हेच कारणही की हा आकार वापरला जातो — अक्षाला समांतर येणारा प्रत्येक किरण त्याच एका बिंदूतून परावर्तित होतो, आणि यातूनच डिश अँटेना, बॅटरीचा परावर्तक आणि सौर कुकर शक्य होतात. (10 अर्ध्याऐवजी अख्खी 20 ची रुंदी y-मूल्य मानते.)",
        },
        fmt: unit("cm"),
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A circle passes through the points (0, 0), (6, 0) and (0, 8). What is the SUM of the coordinates of its centre?",
          hi: "कोई वृत्त बिंदुओं (0, 0), (6, 0) और (0, 8) से होकर जाता है। उसके केंद्र के निर्देशांकों का योग क्या है?",
          mr: "एक वर्तुळ बिंदू (0, 0), (6, 0) आणि (0, 8) मधून जाते. त्याच्या केंद्राच्या निर्देशांकांची बेरीज किती?",
        },
        answer: 7,
        wrong: [10, 5, 14],
        checkExpr: "6/2+8/2",
        solution: {
          en: "The three points form a right-angled triangle with the right angle at the origin, and a well-known fact settles it at once: an angle in a semicircle is a right angle, so the hypotenuse joining (6, 0) and (0, 8) must be a diameter. The centre is therefore its midpoint, (3, 4), and the sum is 6/2 + 8/2 = 7. The alternative is to substitute all three points into x² + y² + 2gx + 2fy + c = 0 and solve three equations — which gives the same answer and takes ten times as long. Recognising the geometry before reaching for the algebra is the point of the question. As a check, the radius is 5, and each of the three points is indeed 5 away from (3, 4). (10 gives the length of the diameter rather than the sum of the centre's coordinates.)",
          hi: "तीनों बिंदु मूलबिंदु पर समकोण वाला समकोण त्रिभुज बनाते हैं, और एक जाना-माना तथ्य इसे तुरंत तय कर देता है: अर्धवृत्त में बना कोण समकोण होता है, अतः (6, 0) और (0, 8) को मिलाता कर्ण व्यास होना ही चाहिए। अतः केंद्र उसका मध्यबिंदु (3, 4) है, और योग 6/2 + 8/2 = 7. विकल्प यह है कि तीनों बिंदु x² + y² + 2gx + 2fy + c = 0 में रखो और तीन समीकरण हल करो — जो वही उत्तर देता है और दस गुना समय लेता है। बीजगणित की ओर हाथ बढ़ाने से पहले ज्यामिति पहचानना ही प्रश्न का प्रयोजन है। जाँच के तौर पर, त्रिज्या 5 है, और तीनों बिंदु सचमुच (3, 4) से 5 दूर हैं। (10 केंद्र के निर्देशांकों के योग के बजाय व्यास की लंबाई देता है।)",
          mr: "तिन्ही बिंदू आरंभबिंदूवर काटकोन असलेला काटकोन त्रिकोण बनवतात, आणि एक सुप्रसिद्ध तथ्य हे लगेच ठरवते: अर्धवर्तुळातला कोन काटकोन असतो, म्हणून (6, 0) आणि (0, 8) यांना जोडणारा कर्ण व्यासच असला पाहिजे. म्हणून केंद्र हा त्याचा मध्यबिंदू (3, 4), आणि बेरीज 6/2 + 8/2 = 7. पर्याय असा की तिन्ही बिंदू x² + y² + 2gx + 2fy + c = 0 मध्ये ठेवा आणि तीन समीकरणे सोडवा — जे तेच उत्तर देते आणि दहापट वेळ घेते. बीजगणिताकडे हात वळवण्याआधी भूमिती ओळखणे हाच प्रश्नाचा हेतू. तपासणी म्हणून, त्रिज्या 5 आहे, आणि तिन्ही बिंदू खरोखर (3, 4) पासून 5 दूर आहेत. (10 केंद्राच्या निर्देशांकांच्या बेरजेऐवजी व्यासाची लांबी देते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-conic-sections",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 10 — Conic Sections",
      name: "Conic Sections",
      summary:
        "Four curves cut from one cone by tilting the knife: a circle where every point is the same distance from a centre, a parabola where a point is as far from a focus as from a line, and an ellipse and a hyperbola separated by nothing more than the sign between two squares.",
      position: 10,
      translations: {
        hi: {
          name: "शंकु परिच्छेद",
          summary:
            "एक ही शंकु से छुरी झुकाकर काटी गई चार वक्र: वृत्त जिसमें हर बिंदु केंद्र से एक ही दूरी पर है, परवलय जिसमें कोई बिंदु नाभि से उतना ही दूर है जितना एक रेखा से, और दीर्घवृत्त तथा अतिपरवलय जिन्हें दो वर्गों के बीच के चिह्न से अधिक कुछ अलग नहीं करता।",
        },
        mr: {
          name: "शंकुच्छेद",
          summary:
            "एकाच शंकूतून सुरी कलती करून कापलेली चार वक्रे: वर्तुळ ज्यात प्रत्येक बिंदू केंद्रापासून एकाच अंतरावर, पॅराबोला ज्यात एखादा बिंदू नाभीपासून जितका दूर तितकाच एका रेषेपासून, आणि दीर्घवर्तुळ व अतिपरावलय ज्यांना दोन वर्गांमधल्या चिन्हाहून अधिक काहीच वेगळे करत नाही.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 11 — Three Dimensional Geometry (one axis more)                   */
/* ------------------------------------------------------------------------- */
function threeDGeometry11(): TopicFileOut {
  const rand = rng("maths-11-three-dimensional-geometry");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the distance of the point (3, 4, 12) from the origin?",
          hi: "बिंदु (3, 4, 12) की मूलबिंदु से दूरी क्या है?",
          mr: "बिंदू (3, 4, 12) चे आरंभबिंदूपासूनचे अंतर किती?",
        },
        answer: 13,
        wrong: [19, 169, 12],
        checkExpr: "(9+16+144)/13",
        solution: {
          en: "Square each coordinate, add, and take the root: √(9 + 16 + 144) = √169 = 13. It is Pythagoras with one extra term — the flat formula did not have to be replaced, only extended, and a fourth axis would add a fourth square in exactly the same way. (19 adds the coordinates instead of their squares.)",
          hi: "हर निर्देशांक का वर्ग करो, जोड़ो, और मूल लो: √(9 + 16 + 144) = √169 = 13. यह एक अतिरिक्त पद वाला पाइथागोरस है — चपटा सूत्र बदलना नहीं पड़ा, केवल बढ़ाना पड़ा, और चौथा अक्ष ठीक इसी तरह चौथा वर्ग जोड़ देता। (19 वर्गों के बजाय निर्देशांक जोड़ देता है।)",
          mr: "प्रत्येक निर्देशांकाचा वर्ग करा, जोडा, आणि मूळ घ्या: √(9 + 16 + 144) = √169 = 13. हा एक अधिकच्या पदासह पायथागोरस — सपाट सूत्र बदलावे लागले नाही, केवळ वाढवावे लागले, आणि चौथा अक्ष नेमक्या याच पद्धतीने चौथा वर्ग जोडला असता. (19 वर्गांऐवजी निर्देशांक जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Into how many octants do the three coordinate planes divide space?",
          hi: "तीनों निर्देशांक तल आकाश को कितने अष्टांशों में बाँटते हैं?",
          mr: "तिन्ही निर्देशांक प्रतले अवकाशाला किती अष्टांशांत विभागतात?",
        },
        answer: 8,
        wrong: [4, 6, 3],
        checkExpr: "2*2*2",
        solution: {
          en: "Each coordinate can be positive or negative independently of the others, so there are 2 × 2 × 2 = 8 sign combinations and therefore 8 regions. In two dimensions the same argument gives 2 × 2 = 4 quadrants, which is why the count doubles with each new axis. (4 quotes the number of quadrants in the plane.)",
          hi: "हर निर्देशांक दूसरों से स्वतंत्र रूप से धनात्मक या ऋणात्मक हो सकता है, अतः 2 × 2 × 2 = 8 चिह्न-संयोजन और इसलिए 8 प्रदेश। दो विमाओं में वही तर्क 2 × 2 = 4 चतुर्थांश देता है, इसीलिए हर नए अक्ष के साथ गिनती दोगुनी हो जाती है। (4 तल के चतुर्थांशों की संख्या बता देता है।)",
          mr: "प्रत्येक निर्देशांक इतरांपासून स्वतंत्रपणे धन वा ऋण असू शकतो, म्हणून 2 × 2 × 2 = 8 चिन्ह-संयोजने आणि म्हणून 8 प्रदेश. दोन मितींत तोच युक्तिवाद 2 × 2 = 4 चतुर्थांश देतो, म्हणूनच प्रत्येक नव्या अक्षासोबत मोजणी दुप्पट होते. (4 प्रतलातल्या चतुर्थांशांची संख्या सांगते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "For the point (4, −3, 12), what is the sum of the squares of its coordinates?",
          hi: "बिंदु (4, −3, 12) के लिए उसके निर्देशांकों के वर्गों का योग क्या है?",
          mr: "बिंदू (4, −3, 12) साठी त्याच्या निर्देशांकांच्या वर्गांची बेरीज किती?",
        },
        answer: 169,
        wrong: [13, 19, 144],
        checkExpr: "16+9+144",
        solution: {
          en: "16 + 9 + 144 = 169. The negative sign disappears under the square, which is exactly why distances built this way are never negative. Note that 169 is the square of the distance from the origin, so the point lies 13 units away — the sum of squares is always one step short of the distance itself. (13 gives the distance rather than the sum of the squares.)",
          hi: "16 + 9 + 144 = 169. ऋण चिह्न वर्ग के नीचे ग़ायब हो जाता है, और ठीक इसीलिए यों बनी दूरियाँ कभी ऋणात्मक नहीं होतीं। ध्यान दो कि 169 मूलबिंदु से दूरी का वर्ग है, अतः बिंदु 13 इकाई दूर है — वर्गों का योग सदा दूरी से एक क़दम पीछे रहता है। (13 वर्गों के योग के बजाय दूरी दे देता है।)",
          mr: "16 + 9 + 144 = 169. ऋण चिन्ह वर्गाखाली नाहीसे होते, आणि नेमके म्हणूनच अशी बनलेली अंतरे कधीच ऋण नसतात. लक्षात घ्या की 169 हा आरंभबिंदूपासूनच्या अंतराचा वर्ग आहे, म्हणून बिंदू 13 एकके दूर आहे — वर्गांची बेरीज नेहमी अंतराहून एक पाऊल मागे असते. (13 वर्गांच्या बेरजेऐवजी अंतर देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the distance between the points (1, 2, 3) and (4, 6, 3)?",
          hi: "बिंदुओं (1, 2, 3) और (4, 6, 3) के बीच की दूरी क्या है?",
          mr: "बिंदू (1, 2, 3) आणि (4, 6, 3) यांच्यातील अंतर किती?",
        },
        answer: 5,
        wrong: [25, 7, 3],
        checkExpr: "(9+16)/5",
        solution: {
          en: "The differences are 3, 4 and 0, so the distance is √(9 + 16 + 0) = √25 = 5. The zero is worth noticing: both points sit at the same height, so they lie in a horizontal plane and the third dimension contributes nothing at all. This is the ordinary two-dimensional case turning up inside the three-dimensional formula. (25 gives the square of the distance.)",
          hi: "अंतर 3, 4 और 0 हैं, अतः दूरी √(9 + 16 + 0) = √25 = 5. शून्य ध्यान देने योग्य है: दोनों बिंदु एक ही ऊँचाई पर बैठे हैं, अतः वे एक क्षैतिज तल में हैं और तीसरी विमा कुछ भी योगदान नहीं देती। यह साधारण द्विविमीय मामला ही त्रिविमीय सूत्र के भीतर उभर आया है। (25 दूरी का वर्ग दे देता है।)",
          mr: "फरक 3, 4 आणि 0 आहेत, म्हणून अंतर √(9 + 16 + 0) = √25 = 5. शून्य लक्षात घेण्याजोगे: दोन्ही बिंदू एकाच उंचीवर बसले आहेत, म्हणून ते एका आडव्या प्रतलात आहेत आणि तिसरी मिती काहीच योगदान देत नाही. हे साधे द्विमितीय प्रकरणच त्रिमितीय सूत्राच्या आत उमटले आहे. (25 अंतराचा वर्ग देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the SUM of the coordinates of the midpoint of the segment joining (2, 4, 6) and (8, 10, 12)?",
          hi: "(2, 4, 6) और (8, 10, 12) को मिलाते खंड के मध्यबिंदु के निर्देशांकों का योग क्या है?",
          mr: "(2, 4, 6) आणि (8, 10, 12) यांना जोडणाऱ्या खंडाच्या मध्यबिंदूच्या निर्देशांकांची बेरीज किती?",
        },
        answer: 21,
        wrong: [42, 12, 30],
        checkExpr: "(2+8)/2+(4+10)/2+(6+12)/2",
        solution: {
          en: "Average each coordinate on its own: (2 + 8)/2 = 5, (4 + 10)/2 = 7, (6 + 12)/2 = 9, so the midpoint is (5, 7, 9) and the sum is 21. Nothing about the method changed when the third axis appeared — the coordinates never interfere with one another, which is the whole convenience of using axes at right angles. (42 adds all six coordinates without halving.)",
          hi: "हर निर्देशांक का अलग औसत लो: (2 + 8)/2 = 5, (4 + 10)/2 = 7, (6 + 12)/2 = 9, अतः मध्यबिंदु (5, 7, 9) और योग 21. तीसरा अक्ष आने पर विधि में कुछ नहीं बदला — निर्देशांक कभी एक-दूसरे में दख़ल नहीं देते, और समकोण पर अक्ष लेने की पूरी सुविधा यही है। (42 छहों निर्देशांक जोड़ देता है बिना आधा किए।)",
          mr: "प्रत्येक निर्देशांकाची स्वतंत्र सरासरी घ्या: (2 + 8)/2 = 5, (4 + 10)/2 = 7, (6 + 12)/2 = 9, म्हणून मध्यबिंदू (5, 7, 9) आणि बेरीज 21. तिसरा अक्ष आल्यावर पद्धतीत काहीच बदलले नाही — निर्देशांक कधीही एकमेकांत ढवळाढवळ करत नाहीत, आणि काटकोनात अक्ष घेण्याची अख्खी सोय हीच. (42 सहाही निर्देशांक जोडते निम्मे न करता.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the distance of the point (1, 2, 2) from the origin?",
          hi: "बिंदु (1, 2, 2) की मूलबिंदु से दूरी क्या है?",
          mr: "बिंदू (1, 2, 2) चे आरंभबिंदूपासूनचे अंतर किती?",
        },
        answer: 3,
        wrong: [5, 9, 7],
        checkExpr: "(1+4+4)/3",
        solution: {
          en: "√(1 + 4 + 4) = √9 = 3. Triples like (1, 2, 2), (2, 3, 6) and (3, 4, 12) whose squares add to a perfect square are the three-dimensional cousins of Pythagorean triples, and questions are usually built around them so the root comes out whole. Spotting one saves you reaching for a calculator. (5 adds the coordinates rather than their squares.)",
          hi: "√(1 + 4 + 4) = √9 = 3. (1, 2, 2), (2, 3, 6) और (3, 4, 12) जैसे त्रिक जिनके वर्ग जुड़कर पूर्ण वर्ग बनते हैं, पाइथागोरसी त्रिकों के त्रिविमीय चचेरे भाई हैं, और प्रश्न प्रायः उन्हीं के इर्द-गिर्द बनाए जाते हैं ताकि मूल पूरा निकले। एक पहचान लेना तुम्हें परिकलक की ओर हाथ बढ़ाने से बचा देता है। (5 वर्गों के बजाय निर्देशांक जोड़ देता है।)",
          mr: "√(1 + 4 + 4) = √9 = 3. (1, 2, 2), (2, 3, 6) आणि (3, 4, 12) सारखी त्रिके ज्यांचे वर्ग जुळून पूर्ण वर्ग बनतात, ती पायथागोरसी त्रिकांची त्रिमितीय भावंडे आहेत, आणि प्रश्न बहुधा त्यांच्याभोवतीच बांधले जातात जेणेकरून मूळ पूर्ण निघावे. एक ओळखणे तुम्हाला गणकयंत्राकडे हात वळवण्यापासून वाचवते. (5 वर्गांऐवजी निर्देशांक जोडते.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the distance between the points (1, 2, 3) and (5, 6, 10)?",
          hi: "बिंदुओं (1, 2, 3) और (5, 6, 10) के बीच की दूरी क्या है?",
          mr: "बिंदू (1, 2, 3) आणि (5, 6, 10) यांच्यातील अंतर किती?",
        },
        answer: 9,
        wrong: [15, 81, 7],
        checkExpr: "(16+16+49)/9",
        solution: {
          en: "The differences are 4, 4 and 7, so the distance is √(16 + 16 + 49) = √81 = 9. Take the differences before squaring, never the coordinates themselves — squaring first and subtracting afterwards is the standard wrong turn and would give a different, meaningless number. (15 adds the three differences instead of using Pythagoras.)",
          hi: "अंतर 4, 4 और 7 हैं, अतः दूरी √(16 + 16 + 49) = √81 = 9. वर्ग करने से पहले अंतर लो, निर्देशांक स्वयं कभी नहीं — पहले वर्ग करके बाद में घटाना मानक ग़लत मोड़ है और वह भिन्न, अर्थहीन संख्या देता। (15 पाइथागोरस लगाने के बजाय तीनों अंतर जोड़ देता है।)",
          mr: "फरक 4, 4 आणि 7 आहेत, म्हणून अंतर √(16 + 16 + 49) = √81 = 9. वर्ग करण्याआधी फरक घ्या, निर्देशांक स्वतः कधीच नाही — आधी वर्ग करून नंतर वजा करणे हे प्रमाण चुकीचे वळण आणि ते वेगळी, निरर्थक संख्या दिली असती. (15 पायथागोरस लावण्याऐवजी तिन्ही फरक जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the z-coordinate of the midpoint of the segment joining (1, 2, 3) and (5, 6, 11)?",
          hi: "(1, 2, 3) और (5, 6, 11) को मिलाते खंड के मध्यबिंदु का z-निर्देशांक क्या है?",
          mr: "(1, 2, 3) आणि (5, 6, 11) यांना जोडणाऱ्या खंडाच्या मध्यबिंदूचा z-निर्देशांक किती?",
        },
        answer: 7,
        wrong: [4, 14, 6],
        checkExpr: "(3+11)/2",
        solution: {
          en: "The z-coordinate of the midpoint is the average of the two z-values: (3 + 11)/2 = 7. The other coordinates are irrelevant to this one — a useful thing to notice, because it means you never have to compute the whole midpoint when only one component is asked for. (14 adds the two z-values without halving.)",
          hi: "मध्यबिंदु का z-निर्देशांक दोनों z-मानों का औसत है: (3 + 11)/2 = 7. बाक़ी निर्देशांक इससे असंबद्ध हैं — ध्यान देने योग्य बात, क्योंकि इसका अर्थ है कि जब केवल एक घटक माँगा जाए तो पूरा मध्यबिंदु निकालना कभी नहीं पड़ता। (14 दोनों z-मान जोड़ देता है बिना आधा किए।)",
          mr: "मध्यबिंदूचा z-निर्देशांक म्हणजे दोन्ही z-मूल्यांची सरासरी: (3 + 11)/2 = 7. उरलेले निर्देशांक याच्याशी असंबंधित — लक्षात घेण्याजोगी गोष्ट, कारण याचा अर्थ केवळ एक घटक विचारला असता अख्खा मध्यबिंदू काढावा लागत नाही. (14 दोन्ही z-मूल्ये जोडते निम्मे न करता.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A point divides the segment joining A(1, 2, 3) and B(6, 7, 8) internally in the ratio 2 : 3. What is its x-coordinate?",
          hi: "कोई बिंदु A(1, 2, 3) और B(6, 7, 8) को मिलाते खंड को 2 : 3 के अनुपात में अंतःविभाजित करता है। उसका x-निर्देशांक क्या है?",
          mr: "एक बिंदू A(1, 2, 3) आणि B(6, 7, 8) यांना जोडणाऱ्या खंडाचे 2 : 3 या प्रमाणात अंतर्विभाजन करतो. त्याचा x-निर्देशांक किती?",
        },
        answer: 3,
        wrong: [4, 2.6, 7],
        checkExpr: "(2*6+3*1)/5",
        solution: {
          en: "The section formula weights each endpoint with the OPPOSITE part of the ratio: (2 × 6 + 3 × 1)/(2 + 3) = 15/5 = 3. The crossing over is the whole difficulty — the 2 belongs to B and the 3 to A, because a point nearer A is dominated by A's coordinate. A quick check confirms it: 3 is closer to 1 than to 6, exactly as a 2 : 3 division should be. (4 pairs each number with its own endpoint instead of crossing them.)",
          hi: "विभाजन सूत्र हर सिरे को अनुपात के उलटे भाग से भार देता है: (2 × 6 + 3 × 1)/(2 + 3) = 15/5 = 3. यही आड़ा-तिरछा जोड़ पूरी कठिनाई है — 2 B का है और 3 A का, क्योंकि A के पास वाले बिंदु पर A का निर्देशांक हावी रहता है। तेज़ जाँच पुष्टि करती है: 3, 6 से नहीं 1 से पास है, ठीक जैसा 2 : 3 विभाजन होना चाहिए। (4 हर संख्या को उसके अपने सिरे से जोड़ देता है, आड़ा करने के बजाय।)",
          mr: "विभाजन सूत्र प्रत्येक टोकाला प्रमाणाच्या उलट भागाने भार देते: (2 × 6 + 3 × 1)/(2 + 3) = 15/5 = 3. हीच आडवी जोडणी अख्खी अडचण — 2 हा B चा आणि 3 हा A चा, कारण A जवळच्या बिंदूवर A चा निर्देशांक वरचढ राहतो. झटपट तपासणी खात्री देते: 3 हा 6 हून नव्हे 1 च्या जवळ आहे, नेमके 2 : 3 विभाजन असावे तसे. (4 प्रत्येक संख्या तिच्याच टोकाशी जोडते, आडवे करण्याऐवजी.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "For the point (2, 3, −5), what is the sum of its distances from the three coordinate planes?",
          hi: "बिंदु (2, 3, −5) के लिए तीनों निर्देशांक तलों से उसकी दूरियों का योग क्या है?",
          mr: "बिंदू (2, 3, −5) साठी तिन्ही निर्देशांक प्रतलांपासूनच्या त्याच्या अंतरांची बेरीज किती?",
        },
        answer: 10,
        wrong: [0, 6, 30],
        checkExpr: "2+3+5",
        solution: {
          en: "The distance from a coordinate plane is the size of the coordinate perpendicular to it, taken without its sign: 3 from the yz-plane, 2 from the xz-plane and 5 from the xy-plane, giving 2 + 3 + 5 = 10. The negative z means the point sits below the xy-plane, but a distance cannot record which side — dropping the minus sign is required, not optional. (0 adds the coordinates with their signs, letting the −5 cancel the others.)",
          hi: "किसी निर्देशांक तल से दूरी उस पर लंब निर्देशांक का आकार है, चिह्न के बिना: yz-तल से 3, xz-तल से 2 और xy-तल से 5, जिससे 2 + 3 + 5 = 10. ऋणात्मक z का अर्थ है कि बिंदु xy-तल के नीचे बैठा है, पर दूरी यह दर्ज नहीं कर सकती कि किस ओर — ऋण चिह्न गिराना आवश्यक है, वैकल्पिक नहीं। (0 निर्देशांकों को उनके चिह्नों सहित जोड़ देता है, और −5 बाक़ी को काट देता है।)",
          mr: "कोणत्याही निर्देशांक प्रतलापासूनचे अंतर म्हणजे त्याला लंब असलेल्या निर्देशांकाचा आकार, चिन्हाविना: yz-प्रतलापासून 3, xz-प्रतलापासून 2 आणि xy-प्रतलापासून 5, ज्यातून 2 + 3 + 5 = 10. ऋण z म्हणजे बिंदू xy-प्रतलाखाली बसला आहे, पण अंतर कोणत्या बाजूला हे नोंदवू शकत नाही — ऋण चिन्ह गाळणे आवश्यक आहे, ऐच्छिक नव्हे. (0 निर्देशांक त्यांच्या चिन्हांसह जोडते, आणि −5 बाकीचे छेदते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Find the point on the y-axis that is equidistant from A(3, 1, 2) and B(5, 5, 2). What is its y-coordinate?",
          hi: "y-अक्ष पर वह बिंदु ढूँढ़ो जो A(3, 1, 2) और B(5, 5, 2) से समान दूरी पर है। उसका y-निर्देशांक क्या है?",
          mr: "y-अक्षावरचा तो बिंदू शोधा जो A(3, 1, 2) आणि B(5, 5, 2) पासून समान अंतरावर आहे. त्याचा y-निर्देशांक किती?",
        },
        answer: 5,
        wrong: [3, 4, 8],
        checkExpr: "(54-14)/8",
        solution: {
          en: "A point on the y-axis has the form (0, y, 0). Equating the squared distances avoids the roots entirely: 9 + (y − 1)² + 4 = 25 + (y − 5)² + 4. Expanding gives 14 − 2y = 54 − 10y, so 8y = 40 and y = 5, making the point (0, 5, 0). Two habits do the work here. Write down what a point on the named axis must look like before anything else — two of its coordinates are already zero. And square both distances rather than comparing the roots, since the squares are equal exactly when the distances are. (4 gives the average of the two y-values, which happens not to be the answer because the other coordinates differ too.)",
          hi: "y-अक्ष पर बिंदु का रूप (0, y, 0) है। वर्ग की गई दूरियाँ बराबर करने से मूल पूरी तरह टल जाते हैं: 9 + (y − 1)² + 4 = 25 + (y − 5)² + 4. खोलने पर 14 − 2y = 54 − 10y, अतः 8y = 40 और y = 5, और बिंदु (0, 5, 0) बनता है। यहाँ दो आदतें काम करती हैं। किसी और चीज़ से पहले लिखो कि नामित अक्ष पर बिंदु कैसा दिखना चाहिए — उसके दो निर्देशांक पहले से शून्य हैं। और मूलों की तुलना करने के बजाय दोनों दूरियों का वर्ग करो, क्योंकि वर्ग ठीक तभी बराबर हैं जब दूरियाँ हों। (4 दोनों y-मानों का औसत देता है, जो संयोग से उत्तर नहीं है क्योंकि बाक़ी निर्देशांक भी भिन्न हैं।)",
          mr: "y-अक्षावरील बिंदूचे रूप (0, y, 0) असते. वर्ग केलेली अंतरे समान करणे मुळे पूर्णपणे टाळते: 9 + (y − 1)² + 4 = 25 + (y − 5)² + 4. उलगडल्यावर 14 − 2y = 54 − 10y, म्हणून 8y = 40 आणि y = 5, आणि बिंदू (0, 5, 0) बनतो. इथे दोन सवयी काम करतात. इतर कशाहीआधी लिहा की नामनिर्देशित अक्षावरचा बिंदू कसा दिसला पाहिजे — त्याचे दोन निर्देशांक आधीच शून्य आहेत. आणि मुळांची तुलना करण्याऐवजी दोन्ही अंतरांचा वर्ग करा, कारण वर्ग नेमके तेव्हाच समान जेव्हा अंतरे समान. (4 दोन्ही y-मूल्यांची सरासरी देते, जी योगायोगाने उत्तर नाही कारण उरलेले निर्देशांकही वेगळे आहेत.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A triangle has vertices (1, 2, 3), (4, 5, 6) and (7, 8, 9). What is the SUM of the coordinates of its centroid?",
          hi: "किसी त्रिभुज के शीर्ष (1, 2, 3), (4, 5, 6) और (7, 8, 9) हैं। उसके केंद्रक के निर्देशांकों का योग क्या है?",
          mr: "एका त्रिकोणाचे शिरोबिंदू (1, 2, 3), (4, 5, 6) आणि (7, 8, 9) आहेत. त्याच्या मध्यकेंद्राच्या निर्देशांकांची बेरीज किती?",
        },
        answer: 15,
        wrong: [45, 5, 12],
        checkExpr: "(1+4+7)/3+(2+5+8)/3+(3+6+9)/3",
        solution: {
          en: "The centroid averages the three vertices coordinate by coordinate: x = 12/3 = 4, y = 15/3 = 5, z = 18/3 = 6, so the centroid is (4, 5, 6) and the sum is 15. Notice that the centroid here is one of the vertices — which happens because these three points are collinear, evenly spaced along a line, so the middle one is already the average. A triangle with these vertices would in fact be degenerate. (45 adds all nine coordinates without dividing by 3.)",
          hi: "केंद्रक तीनों शीर्षों का निर्देशांक-दर-निर्देशांक औसत लेता है: x = 12/3 = 4, y = 15/3 = 5, z = 18/3 = 6, अतः केंद्रक (4, 5, 6) और योग 15. ध्यान दो कि यहाँ केंद्रक स्वयं एक शीर्ष है — ऐसा इसलिए कि ये तीनों बिंदु संरेख हैं, एक रेखा पर बराबर दूरी पर, अतः बीच वाला पहले से औसत है। इन शीर्षों वाला त्रिभुज वस्तुतः अपभ्रष्ट होगा। (45 नौों निर्देशांक जोड़ देता है बिना 3 से भाग दिए।)",
          mr: "मध्यकेंद्र तिन्ही शिरोबिंदूंची निर्देशांक-दर-निर्देशांक सरासरी घेते: x = 12/3 = 4, y = 15/3 = 5, z = 18/3 = 6, म्हणून मध्यकेंद्र (4, 5, 6) आणि बेरीज 15. लक्षात घ्या की इथे मध्यकेंद्र स्वतःच एक शिरोबिंदू आहे — असे यासाठी की हे तिन्ही बिंदू एकरेषीय आहेत, एका रेषेवर समान अंतरावर, म्हणून मधला आधीच सरासरी आहे. या शिरोबिंदूंचा त्रिकोण प्रत्यक्षात अपभ्रष्ट असेल. (45 नऊही निर्देशांक जोडते 3 ने न भागता.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "For the points A(1, 2, 3) and B(3, 4, 5), what is the value of AB² ?",
          hi: "बिंदुओं A(1, 2, 3) और B(3, 4, 5) के लिए AB² का मान क्या है?",
          mr: "बिंदू A(1, 2, 3) आणि B(3, 4, 5) साठी AB² चे मूल्य किती?",
        },
        answer: 12,
        wrong: [48, 24, 6],
        checkExpr: "4+4+4",
        solution: {
          en: "The differences are 2, 2 and 2, so AB² = 4 + 4 + 4 = 12. This number is worth keeping because of what it proves about a third point. Take C(5, 6, 7): BC² is also 12, while AC² = 16 + 16 + 16 = 48. Since √48 = 2√12, the longest distance equals the sum of the other two exactly — AC = AB + BC — and three points can only satisfy that if they lie on one straight line. Squared distances are the usual tool for collinearity in space, because they avoid roots until the very last comparison. (48 gives AC² rather than AB².)",
          hi: "अंतर 2, 2 और 2 हैं, अतः AB² = 4 + 4 + 4 = 12. यह संख्या इसलिए रखने योग्य है कि वह किसी तीसरे बिंदु के बारे में क्या सिद्ध करती है। C(5, 6, 7) लो: BC² भी 12 है, जबकि AC² = 16 + 16 + 16 = 48. चूँकि √48 = 2√12, सबसे लंबी दूरी ठीक बाक़ी दोनों के योग के बराबर है — AC = AB + BC — और तीन बिंदु यह तभी पूरा कर सकते हैं जब वे एक ही सरल रेखा पर हों। आकाश में संरेखता के लिए वर्ग की गई दूरियाँ ही सामान्य औज़ार हैं, क्योंकि वे अंतिम तुलना तक मूलों से बचा लेती हैं। (48 AB² के बजाय AC² दे देता है।)",
          mr: "फरक 2, 2 आणि 2 आहेत, म्हणून AB² = 4 + 4 + 4 = 12. हा आकडा यासाठी ठेवण्याजोगा की तो तिसऱ्या बिंदूबद्दल काय सिद्ध करतो. C(5, 6, 7) घ्या: BC² सुद्धा 12 आहे, तर AC² = 16 + 16 + 16 = 48. √48 = 2√12 असल्याने, सर्वांत लांब अंतर नेमके उरलेल्या दोघांच्या बेरजेइतके आहे — AC = AB + BC — आणि तीन बिंदू हे तेव्हाच पूर्ण करू शकतात जेव्हा ते एकाच सरळ रेषेवर असतील. अवकाशात एकरेषीयतेसाठी वर्ग केलेली अंतरे हेच नेहमीचे हत्यार, कारण ती शेवटच्या तुलनेपर्यंत मुळे टाळतात. (48 AB² ऐवजी AC² देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A room is 12 m long, 9 m wide and 8 m high. How long is the diagonal from one bottom corner to the opposite top corner?",
          hi: "कोई कमरा 12 m लंबा, 9 m चौड़ा और 8 m ऊँचा है। एक निचले कोने से सामने के ऊपरी कोने तक का विकर्ण कितना लंबा है?",
          mr: "एक खोली 12 m लांब, 9 m रुंद आणि 8 m उंच आहे. एका खालच्या कोपऱ्यापासून समोरच्या वरच्या कोपऱ्यापर्यंतचा कर्ण किती लांब आहे?",
        },
        answer: 17,
        wrong: [29, 289, 15],
        checkExpr: "(144+81+64)/17",
        solution: {
          en: "Put one corner at the origin and the opposite one is at (12, 9, 8), so the diagonal is √(144 + 81 + 64) = √289 = 17 m. It is worth seeing why the three-dimensional formula works, because the answer can be built in two ordinary steps. The diagonal of the floor is √(144 + 81) = 15 m, and that floor diagonal together with the 8 m height forms a right-angled triangle standing upright inside the room: √(225 + 64) = 17. So the space diagonal is Pythagoras applied twice, and the compact formula is just those two steps written as one. (15 stops at the floor diagonal and never goes up.)",
          hi: "एक कोना मूलबिंदु पर रखो और सामने वाला (12, 9, 8) पर है, अतः विकर्ण √(144 + 81 + 64) = √289 = 17 m. त्रिविमीय सूत्र क्यों चलता है यह देखने योग्य है, क्योंकि उत्तर दो साधारण चरणों में बनाया जा सकता है। फ़र्श का विकर्ण √(144 + 81) = 15 m है, और वह फ़र्श-विकर्ण 8 m की ऊँचाई के साथ मिलकर कमरे के भीतर खड़ा समकोण त्रिभुज बनाता है: √(225 + 64) = 17. अतः आकाशीय विकर्ण दो बार लगाया गया पाइथागोरस है, और सघन सूत्र उन्हीं दो चरणों को एक में लिखना है। (15 फ़र्श के विकर्ण पर रुक जाता है और ऊपर जाता ही नहीं।)",
          mr: "एक कोपरा आरंभबिंदूवर ठेवा आणि समोरचा (12, 9, 8) वर आहे, म्हणून कर्ण √(144 + 81 + 64) = √289 = 17 m. त्रिमितीय सूत्र का चालते हे पाहण्याजोगे, कारण उत्तर दोन साध्या पायऱ्यांत बांधता येते. जमिनीचा कर्ण √(144 + 81) = 15 m आहे, आणि तो जमीन-कर्ण 8 m उंचीसह मिळून खोलीच्या आत उभा काटकोन त्रिकोण बनवतो: √(225 + 64) = 17. म्हणून अवकाश-कर्ण म्हणजे दोनदा लावलेला पायथागोरस, आणि संक्षिप्त सूत्र म्हणजे त्याच दोन पायऱ्या एकात लिहिणे. (15 जमिनीच्या कर्णावर थांबते आणि वर जातच नाही.)",
        },
        fmt: unit("m"),
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-three-dimensional-geometry",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 11 — Introduction to Three Dimensional Geometry",
      name: "Three Dimensional Geometry",
      summary:
        "The plane given a third axis, and almost nothing else changing: distance is still Pythagoras with one more square added, a midpoint is still an average taken coordinate by coordinate, and the four quadrants become eight octants — the arithmetic of the flat page carried into a room without a single new idea.",
      position: 11,
      translations: {
        hi: {
          name: "त्रिविमीय ज्यामिति",
          summary:
            "तल को तीसरा अक्ष मिला, और उसके सिवा लगभग कुछ नहीं बदला: दूरी अब भी पाइथागोरस है, बस एक वर्ग और जुड़ गया, मध्यबिंदु अब भी निर्देशांक-दर-निर्देशांक लिया गया औसत है, और चार चतुर्थांश आठ अष्टांश बन जाते हैं — चपटे पन्ने का अंकगणित एक भी नए विचार बिना कमरे में उठा लाया गया।",
        },
        mr: {
          name: "त्रिमितीय भूमिती",
          summary:
            "प्रतलाला तिसरा अक्ष मिळाला, आणि त्याखेरीज जवळपास काहीच बदलले नाही: अंतर अजूनही पायथागोरस आहे, फक्त एक वर्ग जोडला गेला, मध्यबिंदू अजूनही निर्देशांक-दर-निर्देशांक घेतलेली सरासरी आहे, आणि चार चतुर्थांश आठ अष्टांश बनतात — सपाट पानाचे अंकगणित एकही नवी कल्पना न घेता खोलीत उचलून आणलेले.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 12 — Limits and Derivatives (approaching without arriving)        */
/* ------------------------------------------------------------------------- */
function limitsDerivatives11(): TopicFileOut {
  const rand = rng("maths-11-limits-and-derivatives");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the limit of 3x + 1 as x approaches 2?",
          hi: "जब x, 2 की ओर जाता है तो 3x + 1 की सीमा क्या है?",
          mr: "x हा 2 कडे जातो तेव्हा 3x + 1 ची सीमा किती?",
        },
        answer: 7,
        wrong: [4, 6, 3],
        checkExpr: "3*2+1",
        solution: {
          en: "For an expression with no break in it, the limit is simply the value: 3 × 2 + 1 = 7. Substitution works here because the function is continuous at 2 — the whole subject of limits only becomes interesting when substitution FAILS, which is what the later questions are about. (4 substitutes into 3 + 1 and loses the x.)",
          hi: "जिस व्यंजक में कोई टूट न हो, उसकी सीमा बस उसका मान है: 3 × 2 + 1 = 7. यहाँ प्रतिस्थापन इसलिए चलता है कि फलन 2 पर संतत है — सीमाओं का पूरा विषय तभी रोचक होता है जब प्रतिस्थापन विफल हो, और आगे के प्रश्न उसी के हैं। (4 3 + 1 में रखकर x खो देता है।)",
          mr: "ज्या पदावलीत खंड नाही, तिची सीमा म्हणजे फक्त तिचे मूल्य: 3 × 2 + 1 = 7. इथे प्रतिस्थापन यासाठी चालते की फलन 2 वर संतत आहे — सीमांचा अख्खा विषय तेव्हाच रोचक होतो जेव्हा प्रतिस्थापन अपयशी ठरते, आणि पुढचे प्रश्न त्याचेच आहेत. (4 3 + 1 मध्ये ठेवून x गमावते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the value of the derivative of x³ at x = 3?",
          hi: "x = 3 पर x³ के अवकलज का मान क्या है?",
          mr: "x = 3 वर x³ च्या अवकलजाचे मूल्य किती?",
        },
        answer: 27,
        wrong: [9, 6, 81],
        checkExpr: "3*3*3",
        solution: {
          en: "Differentiating xⁿ gives nxⁿ⁻¹, so the derivative of x³ is 3x², and at x = 3 that is 3 × 9 = 27. Bring the power down in front and reduce it by one — those two moves are the whole rule. (9 substitutes into x² and forgets to multiply by the 3 that came down.)",
          hi: "xⁿ का अवकलन nxⁿ⁻¹ देता है, अतः x³ का अवकलज 3x² है, और x = 3 पर वह 3 × 9 = 27. घात को आगे नीचे लाओ और उसे एक घटाओ — यही दो चालें पूरा नियम हैं। (9 x² में रखकर नीचे आए 3 से गुणा करना भूल जाता है।)",
          mr: "xⁿ चे अवकलन nxⁿ⁻¹ देते, म्हणून x³ चा अवकलज 3x² आहे, आणि x = 3 वर तो 3 × 9 = 27. घात पुढे खाली आणा आणि तिला एकने कमी करा — याच दोन खेळी अख्खा नियम. (9 x² मध्ये ठेवून खाली आलेल्या 3 ने गुणणे विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the derivative of the constant function f(x) = 7?",
          hi: "अचर फलन f(x) = 7 का अवकलज क्या है?",
          mr: "स्थिर फलन f(x) = 7 चा अवकलज किती?",
        },
        answer: 0,
        wrong: [7, 1, 14],
        checkExpr: "7-7",
        solution: {
          en: "A derivative measures the rate at which the output changes, and a constant function never changes at all, so the answer is 0. Its graph is a horizontal line and the slope of a horizontal line is zero — the algebra and the picture agree exactly. (7 quotes the value of the function rather than its rate of change.)",
          hi: "अवकलज मापता है कि निर्गम किस दर से बदलता है, और अचर फलन कभी बदलता ही नहीं, अतः उत्तर 0 है। उसका आलेख क्षैतिज रेखा है और क्षैतिज रेखा की ढाल शून्य है — बीजगणित और चित्र ठीक-ठीक सहमत हैं। (7 परिवर्तन की दर के बजाय फलन का मान बता देता है।)",
          mr: "अवकलज मोजतो की निर्गम कोणत्या दराने बदलतो, आणि स्थिर फलन कधी बदलतच नाही, म्हणून उत्तर 0. त्याचा आलेख आडवी रेषा आहे आणि आडव्या रेषेची उतारी शून्य आहे — बीजगणित आणि चित्र नेमके सहमत आहेत. (7 बदलाच्या दराऐवजी फलनाचे मूल्य सांगते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the limit of (x² − 9)/(x − 3) as x approaches 3?",
          hi: "जब x, 3 की ओर जाता है तो (x² − 9)/(x − 3) की सीमा क्या है?",
          mr: "x हा 3 कडे जातो तेव्हा (x² − 9)/(x − 3) ची सीमा किती?",
        },
        answer: 6,
        wrong: [0, 9, 3],
        checkExpr: "3+3",
        solution: {
          en: "Substituting 3 gives 0/0, which is not a number and settles nothing. Factorise instead: (x − 3)(x + 3)/(x − 3) = x + 3 for every x except 3 itself, and as x approaches 3 that heads towards 6. The cancellation is legitimate precisely because a limit never asks about the value AT the point, only about the values near it. (0 reads 0/0 as zero.)",
          hi: "3 रखने पर 0/0 मिलता है, जो कोई संख्या नहीं और कुछ तय नहीं करता। इसके बजाय गुणनखंड करो: (x − 3)(x + 3)/(x − 3) = x + 3, 3 को छोड़कर हर x के लिए, और x के 3 की ओर जाते ही वह 6 की ओर बढ़ता है। कटाई ठीक इसलिए वैध है कि सीमा कभी बिंदु पर मान नहीं पूछती, केवल उसके पास के मान पूछती है। (0 0/0 को शून्य पढ़ लेता है।)",
          mr: "3 ठेवल्यावर 0/0 मिळते, जी संख्या नाही आणि काहीच ठरवत नाही. त्याऐवजी अवयव पाडा: (x − 3)(x + 3)/(x − 3) = x + 3, 3 वगळता प्रत्येक x साठी, आणि x हा 3 कडे जाताच ते 6 कडे सरकते. छेदन नेमके यासाठी वैध की सीमा कधीच बिंदूवरचे मूल्य विचारत नाही, केवळ त्याच्या जवळची मूल्ये विचारते. (0 0/0 ला शून्य वाचते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the value of the derivative of 5x² + 3x at x = 1?",
          hi: "x = 1 पर 5x² + 3x के अवकलज का मान क्या है?",
          mr: "x = 1 वर 5x² + 3x च्या अवकलजाचे मूल्य किती?",
        },
        answer: 13,
        wrong: [8, 5, 3],
        checkExpr: "10*1+3",
        solution: {
          en: "Differentiate term by term: 5x² gives 10x and 3x gives 3, so the derivative is 10x + 3, which at x = 1 is 13. Differentiation splits across a sum, so a long polynomial is never harder than its individual terms — only longer. (8 substitutes into the original expression instead of the derivative.)",
          hi: "पद-दर-पद अवकलन करो: 5x² देता है 10x और 3x देता है 3, अतः अवकलज 10x + 3 है, जो x = 1 पर 13. अवकलन योग पर बँट जाता है, अतः लंबा बहुपद अपने अलग-अलग पदों से कभी कठिन नहीं, केवल लंबा होता है। (8 अवकलज के बजाय मूल व्यंजक में रख देता है।)",
          mr: "पद-दर-पद अवकलन करा: 5x² देते 10x आणि 3x देते 3, म्हणून अवकलज 10x + 3, जो x = 1 वर 13. अवकलन बेरजेवर विभागते, म्हणून लांब बहुपदी आपल्या वेगवेगळ्या पदांहून कधीच कठीण नाही, केवळ लांब असते. (8 अवकलजाऐवजी मूळ पदावलीत ठेवते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the limit of (sin x)/x as x approaches 0, with x in radians?",
          hi: "जब x, 0 की ओर जाता है तो (sin x)/x की सीमा क्या है, जहाँ x रेडियन में है?",
          mr: "x हा 0 कडे जातो तेव्हा (sin x)/x ची सीमा किती, जिथे x रेडियनमध्ये आहे?",
        },
        answer: 1,
        wrong: [0, 2, 0.5],
        checkExpr: "2-1",
        solution: {
          en: "Substitution again gives 0/0, but the value is 1 — for a small angle the sine and the angle itself are almost identical, and the smaller the angle the closer they get. Try it: at 0.1 radians the sine is 0.0998, and at 0.01 it is 0.0099998. The result holds only in radians, which is the real reason radians are the unit of choice in calculus. (0 reads 0/0 as zero once more.)",
          hi: "प्रतिस्थापन फिर 0/0 देता है, पर मान 1 है — छोटे कोण के लिए ज्या और कोण स्वयं लगभग एक ही हैं, और कोण जितना छोटा वे उतने ही पास। आज़माओ: 0.1 रेडियन पर ज्या 0.0998 है, और 0.01 पर 0.0099998. परिणाम केवल रेडियन में चलता है, और कलन में रेडियन को ही मात्रक चुनने का असली कारण यही है। (0 फिर 0/0 को शून्य पढ़ लेता है।)",
          mr: "प्रतिस्थापन पुन्हा 0/0 देते, पण मूल्य 1 आहे — लहान कोनासाठी ज्या आणि कोन स्वतः जवळपास एकच आहेत, आणि कोन जितका लहान ते तितके जवळ. आजमावा: 0.1 रेडियनवर ज्या 0.0998 आहे, आणि 0.01 वर 0.0099998. निकाल केवळ रेडियनमध्ये चालतो, आणि कलनात रेडियनलाच एकक निवडण्याचे खरे कारण हेच. (0 पुन्हा 0/0 ला शून्य वाचते.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the value of the derivative of x² + 3x + 2 at x = 3?",
          hi: "x = 3 पर x² + 3x + 2 के अवकलज का मान क्या है?",
          mr: "x = 3 वर x² + 3x + 2 च्या अवकलजाचे मूल्य किती?",
        },
        answer: 9,
        wrong: [6, 11, 15],
        checkExpr: "2*3+3",
        solution: {
          en: "The derivative is 2x + 3, and at x = 3 that is 9. The constant 2 has vanished, and that is worth pausing on: shifting a whole curve up or down does not change how steep it is anywhere, so every constant differentiates away. Two curves differing only by a constant have identical derivatives everywhere. (15 substitutes 3 into the original expression instead of the derivative.)",
          hi: "अवकलज 2x + 3 है, और x = 3 पर वह 9. अचर 2 ग़ायब हो गया, और उस पर ठहरने योग्य है: पूरी वक्र को ऊपर या नीचे खिसकाने से वह कहीं भी अधिक या कम तीव्र नहीं होती, अतः हर अचर अवकलन में मिट जाता है। केवल अचर से भिन्न दो वक्रों के अवकलज हर जगह एक जैसे होते हैं। (15 अवकलज के बजाय मूल व्यंजक में 3 रख देता है।)",
          mr: "अवकलज 2x + 3 आहे, आणि x = 3 वर तो 9. स्थिरांक 2 नाहीसा झाला, आणि त्यावर थांबण्याजोगे: अख्खी वक्र वर वा खाली सरकवल्याने ती कुठेही अधिक वा कमी तीव्र होत नाही, म्हणून प्रत्येक स्थिरांक अवकलनात मिटतो. केवळ स्थिरांकाने वेगळ्या असलेल्या दोन वक्रांचे अवकलज सर्वत्र सारखे असतात. (15 अवकलजाऐवजी मूळ पदावलीत 3 ठेवते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the limit of (x³ − 8)/(x − 2) as x approaches 2?",
          hi: "जब x, 2 की ओर जाता है तो (x³ − 8)/(x − 2) की सीमा क्या है?",
          mr: "x हा 2 कडे जातो तेव्हा (x³ − 8)/(x − 2) ची सीमा किती?",
        },
        answer: 12,
        wrong: [8, 6, 4],
        checkExpr: "3*2*2",
        solution: {
          en: "Factorising the difference of cubes gives (x − 2)(x² + 2x + 4)/(x − 2) = x² + 2x + 4, which at x = 2 is 4 + 4 + 4 = 12. There is a shortcut worth learning: the limit of (xⁿ − aⁿ)/(x − a) as x approaches a is always n·aⁿ⁻¹, which here is 3 × 2² = 12 with no factorising at all. Notice that this is also the derivative of x³ at x = 2 — the standard limit IS the definition of a derivative in disguise. (8 substitutes 2 into x³ and stops.)",
          hi: "घनों के अंतर का गुणनखंड करने पर (x − 2)(x² + 2x + 4)/(x − 2) = x² + 2x + 4, जो x = 2 पर 4 + 4 + 4 = 12. एक शॉर्टकट सीखने योग्य है: x के a की ओर जाने पर (xⁿ − aⁿ)/(x − a) की सीमा सदा n·aⁿ⁻¹ है, जो यहाँ बिना गुणनखंड किए 3 × 2² = 12. ध्यान दो कि यह x = 2 पर x³ का अवकलज भी है — मानक सीमा भेस बदले अवकलज की परिभाषा ही है। (8 x³ में 2 रखकर रुक जाता है।)",
          mr: "घनांच्या फरकाचे अवयव पाडल्यावर (x − 2)(x² + 2x + 4)/(x − 2) = x² + 2x + 4, जे x = 2 वर 4 + 4 + 4 = 12. एक शॉर्टकट शिकण्याजोगा: x हा a कडे जाताना (xⁿ − aⁿ)/(x − a) ची सीमा नेहमी n·aⁿ⁻¹ आहे, जी इथे अवयव न पाडता 3 × 2² = 12. लक्षात घ्या की हा x = 2 वरचा x³ चा अवकलजही आहे — प्रमाण सीमा ही वेष बदललेली अवकलजाची व्याख्याच आहे. (8 x³ मध्ये 2 ठेवून थांबते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "If f(x) = (2x + 1)(x + 3), what is f′(1)?",
          hi: "यदि f(x) = (2x + 1)(x + 3), तो f′(1) क्या है?",
          mr: "जर f(x) = (2x + 1)(x + 3), तर f′(1) किती?",
        },
        answer: 11,
        wrong: [7, 4, 3],
        checkExpr: "4*1+7",
        solution: {
          en: "By the product rule, f′ = 2(x + 3) + (2x + 1)(1) = 4x + 7, so f′(1) = 11. Expanding first is just as good here: f(x) = 2x² + 7x + 3 differentiates to 4x + 7, the same answer by a different road. That agreement is the check worth making, because the commonest error is to differentiate each bracket and multiply the results — which would give 2 × 1 = 2 and is simply not what the product rule says. (4 multiplies the two derivatives together.)",
          hi: "गुणनफल नियम से f′ = 2(x + 3) + (2x + 1)(1) = 4x + 7, अतः f′(1) = 11. यहाँ पहले खोल देना भी उतना ही अच्छा है: f(x) = 2x² + 7x + 3 का अवकलन 4x + 7 देता है, वही उत्तर दूसरे रास्ते से। वह सहमति ही करने योग्य जाँच है, क्योंकि सबसे आम भूल है हर कोष्ठक का अवकलन करके परिणाम गुणा कर देना — जो 2 × 1 = 2 देता और गुणनफल नियम वह कहता ही नहीं। (4 दोनों अवकलज आपस में गुणा कर देता है।)",
          mr: "गुणाकार नियमाने f′ = 2(x + 3) + (2x + 1)(1) = 4x + 7, म्हणून f′(1) = 11. इथे आधी उलगडणेही तितकेच चांगले: f(x) = 2x² + 7x + 3 चे अवकलन 4x + 7 देते, तेच उत्तर दुसऱ्या मार्गाने. ती सहमतीच करण्याजोगी तपासणी, कारण सर्वांत सामान्य चूक म्हणजे प्रत्येक कंसाचे अवकलन करून निकाल गुणणे — जे 2 × 1 = 2 दिले असते आणि गुणाकार नियम ते सांगतच नाही. (4 दोन्ही अवकलज एकमेकांशी गुणते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "If f(x) = x²/(x + 1), what is f′(1)?",
          hi: "यदि f(x) = x²/(x + 1), तो f′(1) क्या है?",
          mr: "जर f(x) = x²/(x + 1), तर f′(1) किती?",
        },
        answer: 0.75,
        wrong: [0.5, 1.5, 2],
        checkExpr: "(2*1*(1+1)-1*1)/((1+1)*(1+1))",
        solution: {
          en: "The quotient rule gives f′ = [2x(x + 1) − x²]/(x + 1)². At x = 1 the top is 2 × 2 − 1 = 3 and the bottom is 4, so f′(1) = 3/4 = 0.75. The order on top matters — it is derivative of the numerator times the denominator MINUS the numerator times the derivative of the denominator, and reversing those two flips the sign of the whole answer. Unlike a product, a quotient cannot be rewritten to avoid the rule here, since x²/(x + 1) does not simplify. (2 divides the two derivatives, 2x by 1, which is not a rule at all.)",
          hi: "भागफल नियम देता है f′ = [2x(x + 1) − x²]/(x + 1)². x = 1 पर ऊपर 2 × 2 − 1 = 3 और नीचे 4, अतः f′(1) = 3/4 = 0.75. ऊपर का क्रम मायने रखता है — वह अंश का अवकलज गुणा हर, घटा अंश गुणा हर का अवकलज है, और दोनों उलटने पर पूरा उत्तर चिह्न बदल लेता है। गुणनफल के विपरीत, यहाँ भागफल को नियम से बचने के लिए फिर से नहीं लिखा जा सकता, क्योंकि x²/(x + 1) सरल होता ही नहीं। (2 दोनों अवकलज भाग दे देता है, 2x बटा 1, जो कोई नियम है ही नहीं।)",
          mr: "भागाकार नियम देतो f′ = [2x(x + 1) − x²]/(x + 1)². x = 1 वर वर 2 × 2 − 1 = 3 आणि खाली 4, म्हणून f′(1) = 3/4 = 0.75. वरचा क्रम महत्त्वाचा — तो अंशाचा अवकलज गुणिले छेद, वजा अंश गुणिले छेदाचा अवकलज, आणि दोन्ही उलटवल्यास अख्खे उत्तर चिन्ह बदलते. गुणाकाराच्या उलट, इथे भागाकार नियम टाळण्यासाठी पुन्हा लिहिता येत नाही, कारण x²/(x + 1) सोपे होतच नाही. (2 दोन्ही अवकलज भागते, 2x भागिले 1, जो नियमच नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "What is the limit of (√(1 + x) − 1)/x as x approaches 0?",
          hi: "जब x, 0 की ओर जाता है तो (√(1 + x) − 1)/x की सीमा क्या है?",
          mr: "x हा 0 कडे जातो तेव्हा (√(1 + x) − 1)/x ची सीमा किती?",
        },
        answer: 0.5,
        wrong: [0, 1, 2],
        checkExpr: "1/2",
        solution: {
          en: "Substituting gives 0/0 again, and factorising will not help because of the root. Multiply top and bottom by the conjugate √(1 + x) + 1 instead: the numerator becomes (1 + x) − 1 = x, which cancels the x below, leaving 1/(√(1 + x) + 1). Now substitution is safe and gives 1/2 = 0.5. Rationalising is the standard move whenever a root sits inside a 0/0 limit, and it works for the same reason the difference of two squares does. A useful check: 0.5 is also the derivative of √(1 + x) at x = 0, which is what this limit was measuring all along. (1 assumes the root and the 1 cancel directly.)",
          hi: "प्रतिस्थापन फिर 0/0 देता है, और मूल के कारण गुणनखंड करना काम नहीं आएगा। इसके बजाय ऊपर-नीचे संयुग्मी √(1 + x) + 1 से गुणा करो: अंश बनता है (1 + x) − 1 = x, जो नीचे का x काट देता है, और 1/(√(1 + x) + 1) बचता है। अब प्रतिस्थापन सुरक्षित है और 1/2 = 0.5 देता है। जब भी कोई मूल 0/0 सीमा के भीतर बैठा हो तब परिमेयकरण मानक चाल है, और वह उसी कारण चलती है जिससे दो वर्गों का अंतर। एक उपयोगी जाँच: 0.5 x = 0 पर √(1 + x) का अवकलज भी है, और यह सीमा शुरू से वही माप रही थी। (1 मान लेता है कि मूल और 1 सीधे कट जाते हैं।)",
          mr: "प्रतिस्थापन पुन्हा 0/0 देते, आणि मुळामुळे अवयव पाडणे उपयोगी पडणार नाही. त्याऐवजी वर-खाली संयुग्मी √(1 + x) + 1 ने गुणा: अंश बनतो (1 + x) − 1 = x, जो खालचा x छेदतो, आणि 1/(√(1 + x) + 1) उरते. आता प्रतिस्थापन सुरक्षित आहे आणि 1/2 = 0.5 देते. जेव्हा जेव्हा एखादे मूळ 0/0 सीमेच्या आत बसलेले असते तेव्हा परिमेयीकरण ही प्रमाण खेळी, आणि ती त्याच कारणाने चालते ज्याने दोन वर्गांचा फरक. एक उपयुक्त तपासणी: 0.5 हा x = 0 वरचा √(1 + x) चा अवकलजही आहे, आणि ही सीमा सुरुवातीपासून तेच मोजत होती. (1 गृहीत धरते की मूळ आणि 1 थेट छेदतात.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "For f(x) = x³ − 12x, at which POSITIVE value of x is f′(x) = 0?",
          hi: "f(x) = x³ − 12x के लिए x के किस धनात्मक मान पर f′(x) = 0 है?",
          mr: "f(x) = x³ − 12x साठी x च्या कोणत्या धन मूल्यावर f′(x) = 0 आहे?",
        },
        answer: 2,
        wrong: [4, 12, 6],
        checkExpr: "12/6",
        solution: {
          en: "Differentiate: f′(x) = 3x² − 12. Setting it to zero gives 3x² = 12, so x² = 4 and x = ±2, of which the positive value is 2. What the answer means is worth stating: at x = 2 the curve is momentarily flat, which is where a turning point sits — a maximum, a minimum or a point of inflection. Solving f′ = 0 is how every optimisation problem begins, from the largest box that can be cut from a sheet to the cheapest tin that holds a litre. (4 gives x², stopping one step before taking the root.)",
          hi: "अवकलन करो: f′(x) = 3x² − 12. उसे शून्य रखने पर 3x² = 12, अतः x² = 4 और x = ±2, जिनमें धनात्मक मान 2 है। उत्तर का अर्थ कहने योग्य है: x = 2 पर वक्र क्षण भर के लिए चपटी है, और वहीं कोई मोड़-बिंदु बैठता है — उच्चिष्ठ, निम्निष्ठ या नति-परिवर्तन बिंदु। f′ = 0 हल करना ही हर उच्चतमीकरण समस्या की शुरुआत है, उस सबसे बड़े डिब्बे से लेकर जो किसी चादर से काटा जा सके, उस सबसे सस्ते टिन तक जो एक लीटर रखे। (4 x² देता है, मूल लेने से एक क़दम पहले रुककर।)",
          mr: "अवकलन करा: f′(x) = 3x² − 12. ते शून्य ठेवल्यावर 3x² = 12, म्हणून x² = 4 आणि x = ±2, ज्यांतले धन मूल्य 2. उत्तराचा अर्थ सांगण्याजोगा: x = 2 वर वक्र क्षणभर सपाट आहे, आणि तिथेच एखादा वळण-बिंदू बसतो — कमाल, किमान वा नती-बदल बिंदू. f′ = 0 सोडवणे हीच प्रत्येक इष्टतमीकरण समस्येची सुरुवात, एखाद्या पत्र्यातून कापता येणाऱ्या सर्वांत मोठ्या पेटीपासून ते एक लिटर धरणाऱ्या सर्वांत स्वस्त डब्यापर्यंत. (4 x² देते, मूळ घेण्याच्या एक पाऊल आधी थांबून.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "What is the limit of (x⁴ − 16)/(x − 2) as x approaches 2?",
          hi: "जब x, 2 की ओर जाता है तो (x⁴ − 16)/(x − 2) की सीमा क्या है?",
          mr: "x हा 2 कडे जातो तेव्हा (x⁴ − 16)/(x − 2) ची सीमा किती?",
        },
        answer: 32,
        wrong: [16, 8, 24],
        checkExpr: "4*2*2*2",
        solution: {
          en: "Use the standard limit: (xⁿ − aⁿ)/(x − a) tends to n·aⁿ⁻¹, so here it is 4 × 2³ = 32. Factorising by hand gives the same thing the long way — x⁴ − 16 = (x − 2)(x³ + 2x² + 4x + 8), and substituting 2 into that cubic gives 8 + 8 + 8 + 8 = 32. The two routes agreeing is the check. It is worth seeing what the result really is: this limit is precisely the derivative of x⁴ evaluated at 2, which is why the standard limit and the power rule are the same statement written twice. (16 substitutes 2 into x⁴ and never divides.)",
          hi: "मानक सीमा लो: (xⁿ − aⁿ)/(x − a) n·aⁿ⁻¹ की ओर जाती है, अतः यहाँ वह 4 × 2³ = 32. हाथ से गुणनखंड करने पर लंबे रास्ते से वही मिलता है — x⁴ − 16 = (x − 2)(x³ + 2x² + 4x + 8), और उस त्रिघात में 2 रखने पर 8 + 8 + 8 + 8 = 32. दोनों रास्तों का सहमत होना ही जाँच है। परिणाम वस्तुतः क्या है यह देखने योग्य है: यह सीमा ठीक 2 पर आँका गया x⁴ का अवकलज है, इसीलिए मानक सीमा और घात नियम एक ही कथन दो बार लिखा हुआ हैं। (16 x⁴ में 2 रखकर भाग देता ही नहीं।)",
          mr: "प्रमाण सीमा घ्या: (xⁿ − aⁿ)/(x − a) ही n·aⁿ⁻¹ कडे जाते, म्हणून इथे ती 4 × 2³ = 32. हाताने अवयव पाडल्यावर लांब मार्गाने तेच मिळते — x⁴ − 16 = (x − 2)(x³ + 2x² + 4x + 8), आणि त्या त्रिघातात 2 ठेवल्यावर 8 + 8 + 8 + 8 = 32. दोन्ही मार्ग सहमत असणे हीच तपासणी. निकाल प्रत्यक्षात काय आहे हे पाहण्याजोगे: ही सीमा नेमका 2 वर मोजलेला x⁴ चा अवकलज आहे, म्हणूनच प्रमाण सीमा आणि घात नियम हे एकच विधान दोनदा लिहिलेले आहे. (16 x⁴ मध्ये 2 ठेवते आणि भागतच नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A particle moves so that its distance is s = 2t² + 5t metres after t seconds. What is its velocity, in metres per second, at t = 3?",
          hi: "कोई कण ऐसे चलता है कि t सेकंड बाद उसकी दूरी s = 2t² + 5t मीटर है। t = 3 पर उसका वेग मीटर प्रति सेकंड में क्या है?",
          mr: "एक कण असा चालतो की t सेकंदांनी त्याचे अंतर s = 2t² + 5t मीटर आहे. t = 3 वर त्याचा वेग मीटर प्रति सेकंदात किती?",
        },
        answer: 17,
        wrong: [12, 33, 11],
        checkExpr: "4*3+5",
        solution: {
          en: "Velocity is the derivative of distance with respect to time: ds/dt = 4t + 5, which at t = 3 gives 17 m/s. This is the whole reason derivatives were invented, so it is worth separating two ideas that are easy to confuse. The AVERAGE velocity over the first 3 seconds is total distance over total time: s(3) = 33, so 33/3 = 11 m/s. The INSTANTANEOUS velocity at the moment t = 3 is 17 m/s, and it is larger because the particle has been speeding up throughout. Only a limit can give the second number — dividing distance by time always produces an average over an interval, and shrinking the interval to nothing is exactly what a derivative does. (11 gives the average velocity over the first three seconds instead of the velocity at that instant.)",
          hi: "वेग समय के सापेक्ष दूरी का अवकलज है: ds/dt = 4t + 5, जो t = 3 पर 17 m/s देता है। अवकलज गढ़े ही इसीलिए गए थे, अतः दो विचारों को अलग करना उचित है जिन्हें गड्डमड्ड करना आसान है। पहले 3 सेकंड का औसत वेग कुल दूरी बटा कुल समय है: s(3) = 33, अतः 33/3 = 11 m/s. t = 3 के क्षण पर तात्क्षणिक वेग 17 m/s है, और वह बड़ा है क्योंकि कण पूरे समय तेज़ होता रहा है। दूसरी संख्या केवल सीमा दे सकती है — दूरी को समय से भाग देना सदा किसी अंतराल का औसत बनाता है, और अंतराल को शून्य तक सिकोड़ना ही वह है जो अवकलज करता है। (11 उस क्षण के वेग के बजाय पहले तीन सेकंड का औसत वेग देता है।)",
          mr: "वेग म्हणजे काळाच्या सापेक्ष अंतराचा अवकलज: ds/dt = 4t + 5, जो t = 3 वर 17 m/s देतो. अवकलज घडवलेच यासाठी होते, म्हणून गोंधळायला सोप्या दोन कल्पना वेगळ्या करणे योग्य. पहिल्या 3 सेकंदांचा सरासरी वेग म्हणजे एकूण अंतर भागिले एकूण काळ: s(3) = 33, म्हणून 33/3 = 11 m/s. t = 3 या क्षणीचा तात्कालिक वेग 17 m/s आहे, आणि तो मोठा आहे कारण कण अख्खा वेळ वेगवान होत गेला आहे. दुसरी संख्या केवळ सीमाच देऊ शकते — अंतराला काळाने भागणे नेहमी एखाद्या अंतरावरची सरासरी बनवते, आणि अंतर शून्यापर्यंत आकसवणे हेच अवकलज करतो. (11 त्या क्षणीच्या वेगाऐवजी पहिल्या तीन सेकंदांचा सरासरी वेग देते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-limits-and-derivatives",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 12 — Limits and Derivatives",
      name: "Limits and Derivatives",
      summary:
        "Asking what a function is heading towards rather than what it equals — which is the only way to give a meaning to zero divided by zero, and therefore the only way to measure a rate at a single instant rather than over an interval.",
      position: 12,
      translations: {
        hi: {
          name: "सीमा और अवकलज",
          summary:
            "यह पूछना कि फलन किस ओर जा रहा है, यह नहीं कि वह बराबर क्या है — और शून्य बटा शून्य को अर्थ देने का यही इकलौता रास्ता है, अतः किसी अंतराल पर नहीं बल्कि एक ही क्षण पर दर मापने का भी यही इकलौता रास्ता।",
        },
        mr: {
          name: "सीमा आणि अवकलज",
          summary:
            "फलन कोणत्या दिशेने जाते आहे हे विचारणे, ते बरोबर काय आहे हे नव्हे — आणि शून्य भागिले शून्य याला अर्थ देण्याचा हाच एकमेव मार्ग, म्हणून एखाद्या अंतरावर नव्हे तर एकाच क्षणी दर मोजण्याचाही हाच एकमेव मार्ग.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 13 — Statistics (how spread out, not where the middle is)         */
/* ------------------------------------------------------------------------- */
function statistics11(): TopicFileOut {
  const rand = rng("maths-11-statistics");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the range of the data 3, 7, 12, 5, 20?",
          hi: "आँकड़ों 3, 7, 12, 5, 20 का परिसर क्या है?",
          mr: "माहिती 3, 7, 12, 5, 20 चा पल्ला किती?",
        },
        answer: 17,
        wrong: [20, 23, 12],
        checkExpr: "20-3",
        solution: {
          en: "The range is the largest value minus the smallest: 20 − 3 = 17. It is the crudest measure of spread there is, because it uses only two of the five numbers and would not notice if everything in between were rearranged — which is exactly why the chapter goes on to build better ones. (20 quotes the largest value rather than the difference.)",
          hi: "परिसर सबसे बड़े मान में से सबसे छोटा घटाकर मिलता है: 20 − 3 = 17. यह फैलाव की सबसे कच्ची माप है, क्योंकि वह पाँच में से केवल दो संख्याएँ काम में लेती है और बीच का सब कुछ फिर से जमा दिया जाए तो उसे पता ही नहीं चलेगा — ठीक इसीलिए अध्याय आगे बेहतर मापें बनाता है। (20 अंतर के बजाय सबसे बड़ा मान बता देता है।)",
          mr: "पल्ला म्हणजे सर्वांत मोठे मूल्य वजा सर्वांत लहान: 20 − 3 = 17. हे विखुरलेपणाचे सर्वांत ओबडधोबड माप, कारण ते पाचांपैकी केवळ दोन संख्या वापरते आणि मधले सारे पुन्हा मांडले तरी त्याला कळणारच नाही — नेमके म्हणूनच प्रकरण पुढे अधिक चांगली मापे बांधते. (20 फरकाऐवजी सर्वांत मोठे मूल्य सांगते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the mean of 2, 4, 6, 8 and 10?",
          hi: "2, 4, 6, 8 और 10 का माध्य क्या है?",
          mr: "2, 4, 6, 8 आणि 10 चा माध्य किती?",
        },
        answer: 6,
        wrong: [5, 30, 8],
        checkExpr: "(2+4+6+8+10)/5",
        solution: {
          en: "Add and divide by how many there are: 30/5 = 6. Because these values are evenly spaced, the mean is also the middle one, which is a useful check whenever the data form a regular ladder. (30 gives the total and forgets to divide.)",
          hi: "जोड़ो और कितनी हैं उससे भाग दो: 30/5 = 6. चूँकि ये मान बराबर दूरी पर हैं, माध्य बीच वाला भी है, और जब भी आँकड़े नियमित सीढ़ी बनाएँ तब यह उपयोगी जाँच है। (30 कुल देता है और भाग देना भूल जाता है।)",
          mr: "जोडा आणि किती आहेत त्याने भागा: 30/5 = 6. ही मूल्ये समान अंतरावर असल्याने, माध्य हा मधलाही आहे, आणि माहिती नियमित शिडी बनवते तेव्हा ही उपयुक्त तपासणी. (30 एकूण देते आणि भागणे विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The variance of a set of observations is 25. What is the standard deviation?",
          hi: "प्रेक्षणों के किसी समुच्चय का प्रसरण 25 है। मानक विचलन क्या है?",
          mr: "निरीक्षणांच्या एका संचाचे विचरण 25 आहे. प्रमाण विचलन किती?",
        },
        answer: 5,
        wrong: [25, 12.5, 625],
        checkExpr: "25/5",
        solution: {
          en: "The standard deviation is the square root of the variance: √25 = 5. The root is not decoration — squaring the deviations changed their units, so a variance of marks is in marks squared, and only the root brings the answer back to the units of the original data. (625 squares the variance instead of rooting it.)",
          hi: "मानक विचलन प्रसरण का वर्गमूल है: √25 = 5. मूल सजावट नहीं — विचलनों का वर्ग करने से उनके मात्रक बदल गए, अतः अंकों का प्रसरण अंक-वर्ग में होता है, और केवल मूल ही उत्तर को मूल आँकड़ों के मात्रकों में लौटाता है। (625 प्रसरण का मूल लेने के बजाय उसका वर्ग कर देता है।)",
          mr: "प्रमाण विचलन म्हणजे विचरणाचे वर्गमूळ: √25 = 5. मूळ ही सजावट नाही — विचलनांचा वर्ग केल्याने त्यांची एकके बदलली, म्हणून गुणांचे विचरण गुण-वर्गात असते, आणि केवळ मूळच उत्तराला मूळ माहितीच्या एककांत परत आणते. (625 विचरणाचे मूळ घेण्याऐवजी त्याचा वर्ग करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the mean deviation about the mean for the data 2, 4, 6, 8?",
          hi: "आँकड़ों 2, 4, 6, 8 का माध्य से माध्य विचलन क्या है?",
          mr: "माहिती 2, 4, 6, 8 चे माध्यापासूनचे माध्य विचलन किती?",
        },
        answer: 2,
        wrong: [4, 8, 5],
        checkExpr: "(3+1+1+3)/4",
        solution: {
          en: "The mean is 5, so the deviations are −3, −1, 1 and 3. Taken without their signs they are 3, 1, 1 and 3, adding to 8, and 8/4 = 2. Dropping the signs is compulsory rather than convenient: the signed deviations from a mean always add to exactly zero, so without that step every data set in the world would have a mean deviation of nothing at all. (5 quotes the mean of the data instead of the mean deviation.)",
          hi: "माध्य 5 है, अतः विचलन −3, −1, 1 और 3 हैं। चिह्नों के बिना वे 3, 1, 1 और 3 हैं, जो जुड़कर 8 बनते हैं, और 8/4 = 2. चिह्न गिराना सुविधा नहीं, अनिवार्यता है: माध्य से चिह्नित विचलन सदा ठीक शून्य बनते हैं, अतः उस चरण के बिना दुनिया के हर आँकड़ा-समुच्चय का माध्य विचलन शून्य ही होता। (5 माध्य विचलन के बजाय आँकड़ों का माध्य बता देता है।)",
          mr: "माध्य 5 आहे, म्हणून विचलने −3, −1, 1 आणि 3 आहेत. चिन्हांविना ती 3, 1, 1 आणि 3 आहेत, जी जुळून 8 बनतात, आणि 8/4 = 2. चिन्हे गाळणे ही सोय नव्हे, सक्ती आहे: माध्यापासूनची चिन्हांकित विचलने नेहमी नेमकी शून्य बनतात, म्हणून त्या पायरीविना जगातल्या प्रत्येक माहिती-संचाचे माध्य विचलन शून्यच झाले असते. (5 माध्य विचलनाऐवजी माहितीचा माध्य सांगते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The standard deviation of a set of observations is 4. What is the variance?",
          hi: "प्रेक्षणों के किसी समुच्चय का मानक विचलन 4 है। प्रसरण क्या है?",
          mr: "निरीक्षणांच्या एका संचाचे प्रमाण विचलन 4 आहे. विचरण किती?",
        },
        answer: 16,
        wrong: [2, 8, 4],
        checkExpr: "4*4",
        solution: {
          en: "The variance is the square of the standard deviation: 4² = 16. Compare this with the previous pair of questions and the relationship is one step in either direction — square to go from deviation to variance, take the root to come back. (2 takes the square root, going the wrong way.)",
          hi: "प्रसरण मानक विचलन का वर्ग है: 4² = 16. इसकी पिछले प्रश्नों से तुलना करो और संबंध किसी भी दिशा में एक ही क़दम है — विचलन से प्रसरण तक जाने को वर्ग, लौटने को मूल। (2 वर्गमूल ले लेता है, ग़लत दिशा में जाकर।)",
          mr: "विचरण म्हणजे प्रमाण विचलनाचा वर्ग: 4² = 16. याची मागच्या प्रश्नांशी तुलना करा आणि संबंध कोणत्याही दिशेने एकच पाऊल आहे — विचलनापासून विचरणापर्यंत जाण्यास वर्ग, परतण्यास मूळ. (2 वर्गमूळ घेते, चुकीच्या दिशेने जाऊन.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The mean of 5 observations is 20. What is their total?",
          hi: "5 प्रेक्षणों का माध्य 20 है। उनका कुल योग क्या है?",
          mr: "5 निरीक्षणांचा माध्य 20 आहे. त्यांची एकूण बेरीज किती?",
        },
        answer: 100,
        wrong: [4, 25, 20],
        checkExpr: "5*20",
        solution: {
          en: "Mean equals total divided by count, so total equals mean times count: 5 × 20 = 100. Running the definition backwards like this is what makes the harder questions later in the chapter possible — a mean is a promise about a total, and recovering that total is nearly always the first step. (4 divides the count by the mean.)",
          hi: "माध्य बराबर कुल बटा गिनती, अतः कुल बराबर माध्य गुणा गिनती: 5 × 20 = 100. परिभाषा को यों उलटा चलाना ही अध्याय के आगे के कठिन प्रश्नों को संभव बनाता है — माध्य कुल के बारे में एक वादा है, और उस कुल को वापस निकालना लगभग सदा पहला चरण होता है। (4 गिनती को माध्य से भाग दे देता है।)",
          mr: "माध्य बरोबर एकूण भागिले मोजणी, म्हणून एकूण बरोबर माध्य गुणिले मोजणी: 5 × 20 = 100. व्याख्या अशी उलटी चालवणेच प्रकरणातले पुढचे कठीण प्रश्न शक्य करते — माध्य हे एकूणाबद्दलचे वचन आहे, आणि ते एकूण परत काढणे जवळपास नेहमीच पहिली पायरी. (4 मोजणीला माध्याने भागते.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the variance of the data 1, 3, 5, 7?",
          hi: "आँकड़ों 1, 3, 5, 7 का प्रसरण क्या है?",
          mr: "माहिती 1, 3, 5, 7 चे विचरण किती?",
        },
        answer: 5,
        wrong: [4, 20, 2.5],
        checkExpr: "(9+1+1+9)/4",
        solution: {
          en: "The mean is 4, so the deviations are −3, −1, 1 and 3. Square them to get 9, 1, 1 and 9, add to 20, and divide by 4: the variance is 5. Squaring rather than dropping signs is what makes this a variance and not a mean deviation, and it has a consequence — squaring gives extra weight to the values furthest from the mean, so one wild reading moves the variance far more than it moves the mean deviation. (20 gives the sum of the squares and forgets to divide.)",
          hi: "माध्य 4 है, अतः विचलन −3, −1, 1 और 3 हैं। उनका वर्ग करके 9, 1, 1 और 9 पाओ, जोड़कर 20, और 4 से भाग दो: प्रसरण 5. चिह्न गिराने के बजाय वर्ग करना ही इसे प्रसरण बनाता है, माध्य विचलन नहीं, और उसका एक परिणाम है — वर्ग करना माध्य से सबसे दूर के मानों को अतिरिक्त भार देता है, अतः एक बेतुका पाठ प्रसरण को माध्य विचलन से कहीं अधिक हिला देता है। (20 वर्गों का योग देता है और भाग देना भूल जाता है।)",
          mr: "माध्य 4 आहे, म्हणून विचलने −3, −1, 1 आणि 3 आहेत. त्यांचा वर्ग करून 9, 1, 1 आणि 9 मिळवा, जोडून 20, आणि 4 ने भागा: विचरण 5. चिन्हे गाळण्याऐवजी वर्ग करणेच याला विचरण बनवते, माध्य विचलन नव्हे, आणि त्याचा एक परिणाम आहे — वर्ग करणे माध्यापासून सर्वांत दूरच्या मूल्यांना अधिकचा भार देते, म्हणून एक विचित्र नोंद विचरणाला माध्य विचलनाहून कितीतरी अधिक हलवते. (20 वर्गांची बेरीज देते आणि भागणे विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the variance of the data 2, 4, 6, 8, 10?",
          hi: "आँकड़ों 2, 4, 6, 8, 10 का प्रसरण क्या है?",
          mr: "माहिती 2, 4, 6, 8, 10 चे विचरण किती?",
        },
        answer: 8,
        wrong: [40, 6, 4],
        checkExpr: "(16+4+0+4+16)/5",
        solution: {
          en: "The mean is 6, so the squared deviations are 16, 4, 0, 4 and 16, adding to 40, and 40/5 = 8. Compare with the previous question: that data set was spaced 2 apart and had variance 5; this one is also spaced 2 apart but has one more value at each end, so the spread is wider and the variance larger. The variance really is measuring what it claims to. (6 quotes the mean instead of the variance.)",
          hi: "माध्य 6 है, अतः वर्ग किए विचलन 16, 4, 0, 4 और 16 हैं, जो जुड़कर 40, और 40/5 = 8. पिछले प्रश्न से तुलना करो: वह समुच्चय भी 2 की दूरी पर था और उसका प्रसरण 5 था; यह भी 2 की दूरी पर है पर हर सिरे पर एक मान अधिक है, अतः फैलाव चौड़ा और प्रसरण बड़ा। प्रसरण सचमुच वही माप रहा है जिसका वह दावा करता है। (6 प्रसरण के बजाय माध्य बता देता है।)",
          mr: "माध्य 6 आहे, म्हणून वर्ग केलेली विचलने 16, 4, 0, 4 आणि 16 आहेत, जी जुळून 40, आणि 40/5 = 8. मागच्या प्रश्नाशी तुलना करा: तो संचही 2 अंतरावर होता आणि त्याचे विचरण 5 होते; हाही 2 अंतरावर आहे पण प्रत्येक टोकाला एक मूल्य अधिक आहे, म्हणून विखुरलेपण रुंद आणि विचरण मोठे. विचरण खरोखर तेच मोजते आहे ज्याचा तो दावा करतो. (6 विचरणाऐवजी माध्य सांगते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A data set has mean 25 and standard deviation 5. What is its coefficient of variation, as a percentage?",
          hi: "किसी आँकड़ा-समुच्चय का माध्य 25 और मानक विचलन 5 है। उसका विचरण गुणांक प्रतिशत में क्या है?",
          mr: "एका माहिती-संचाचा माध्य 25 आणि प्रमाण विचलन 5 आहे. त्याचा विचरण सहगुणक टक्केवारीत किती?",
        },
        answer: 20,
        wrong: [5, 500, 25],
        checkExpr: "5/25*100",
        solution: {
          en: "The coefficient of variation is the standard deviation as a percentage of the mean: 5/25 × 100 = 20 per cent. Its purpose is comparison across different quantities. A spread of 5 kg among adult weights is small; a spread of 5 kg among newborn weights would be enormous — and only dividing by the mean lets the two be judged on the same scale. Because the units cancel in the division, the result is a pure number and a spread in rupees can be set beside a spread in kilograms. (5 quotes the standard deviation without scaling it to the mean.)",
          hi: "विचरण गुणांक मानक विचलन को माध्य के प्रतिशत के रूप में बताता है: 5/25 × 100 = 20 प्रतिशत। उसका प्रयोजन भिन्न राशियों के बीच तुलना है। वयस्कों के भार में 5 kg का फैलाव छोटा है; नवजातों के भार में 5 kg का फैलाव विशाल होता — और केवल माध्य से भाग देना ही दोनों को एक ही पैमाने पर आँकने देता है। चूँकि भाग में मात्रक कट जाते हैं, परिणाम विशुद्ध संख्या है और रुपयों का फैलाव किलोग्राम के फैलाव के साथ रखा जा सकता है। (5 मानक विचलन बता देता है, उसे माध्य पर मापे बिना।)",
          mr: "विचरण सहगुणक प्रमाण विचलनाला माध्याच्या टक्केवारीत सांगतो: 5/25 × 100 = 20 टक्के. त्याचा हेतू वेगवेगळ्या राशींमधली तुलना. प्रौढांच्या वजनांत 5 kg चे विखुरलेपण लहान आहे; नवजातांच्या वजनांत 5 kg चे विखुरलेपण अवाढव्य झाले असते — आणि केवळ माध्याने भागणेच दोघांना एकाच मापावर तपासू देते. भागाकारात एकके छेदत असल्याने, निकाल ही निव्वळ संख्या आहे आणि रुपयांतले विखुरलेपण किलोग्रॅममधल्या विखुरलेपणाशेजारी ठेवता येते. (5 प्रमाण विचलन सांगते, त्याला माध्यावर न मोजता.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A data set has variance 9. Every observation is increased by 5. What is the new variance?",
          hi: "किसी आँकड़ा-समुच्चय का प्रसरण 9 है। हर प्रेक्षण में 5 जोड़ दिया जाता है। नया प्रसरण क्या है?",
          mr: "एका माहिती-संचाचे विचरण 9 आहे. प्रत्येक निरीक्षणात 5 जोडले जाते. नवे विचरण किती?",
        },
        answer: 9,
        wrong: [14, 45, 34],
        checkExpr: "9+0",
        solution: {
          en: "The variance is unchanged at 9. Adding 5 to every value shifts the mean up by 5 as well, so every deviation from the mean stays exactly as it was — and the variance is built entirely from those deviations. Picture the data as marks on a ruler: sliding the whole ruler along does not change the gaps between the marks. This is why a variance is a measure of SPREAD and carries no information about where the data sit. (14 adds 5 to the variance, treating a shift as though it widened the data.)",
          hi: "प्रसरण अपरिवर्तित 9 रहता है। हर मान में 5 जोड़ने से माध्य भी 5 ऊपर खिसक जाता है, अतः माध्य से हर विचलन ठीक वैसा ही रहता है — और प्रसरण पूरी तरह उन्हीं विचलनों से बना है। आँकड़ों को पैमाने के निशानों की तरह देखो: पूरे पैमाने को सरका देने से निशानों के बीच के अंतराल नहीं बदलते। इसीलिए प्रसरण फैलाव की माप है और यह कोई सूचना नहीं ढोता कि आँकड़े कहाँ बैठे हैं। (14 प्रसरण में 5 जोड़ देता है, खिसकाव को ऐसे मानकर मानो उसने आँकड़े चौड़े किए हों।)",
          mr: "विचरण अपरिवर्तित 9 राहते. प्रत्येक मूल्यात 5 जोडल्याने माध्यही 5 वर सरकतो, म्हणून माध्यापासूनचे प्रत्येक विचलन नेमके तसेच राहते — आणि विचरण पूर्णपणे त्याच विचलनांतून बनलेले आहे. माहितीला पट्टीवरच्या खुणांसारखे पाहा: अख्खी पट्टी सरकवल्याने खुणांमधली अंतरे बदलत नाहीत. म्हणूनच विचरण हे विखुरलेपणाचे माप आहे आणि ते माहिती कुठे बसली आहे याबद्दल कोणतीही माहिती वाहत नाही. (14 विचरणात 5 जोडते, सरकावाला त्याने माहिती रुंदावली असे मानून.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A data set has standard deviation 4. Every observation is multiplied by 3. What is the new standard deviation?",
          hi: "किसी आँकड़ा-समुच्चय का मानक विचलन 4 है। हर प्रेक्षण को 3 से गुणा कर दिया जाता है। नया मानक विचलन क्या है?",
          mr: "एका माहिती-संचाचे प्रमाण विचलन 4 आहे. प्रत्येक निरीक्षण 3 ने गुणले जाते. नवे प्रमाण विचलन किती?",
        },
        answer: 12,
        wrong: [4, 36, 7],
        checkExpr: "4*3",
        solution: {
          en: "Multiplying every value by 3 multiplies the mean by 3 and every deviation by 3, so the standard deviation becomes 4 × 3 = 12. Set this against the previous question and the pair is the whole lesson: adding leaves the spread alone, multiplying stretches it in proportion. The variance behaves differently again — it is multiplied by 3², or 9, becoming 144, because it is built from squared deviations. Note the practical consequence: converting a set of measurements from metres to centimetres multiplies the standard deviation by 100 and the variance by ten thousand. (36 multiplies the variance by 9 and reports that as the standard deviation.)",
          hi: "हर मान को 3 से गुणा करने पर माध्य 3 से और हर विचलन भी 3 से गुणा होता है, अतः मानक विचलन 4 × 3 = 12 बन जाता है। इसे पिछले प्रश्न के सामने रखो और जोड़ी ही पूरा पाठ है: जोड़ना फैलाव को छोड़ देता है, गुणा करना उसे अनुपात में खींच देता है। प्रसरण फिर से भिन्न व्यवहार करता है — वह 3² यानी 9 से गुणा होकर 144 बनता है, क्योंकि वह वर्ग किए विचलनों से बना है। व्यावहारिक परिणाम ध्यान दो: मापों के किसी समुच्चय को मीटर से सेंटीमीटर में बदलना मानक विचलन को 100 से और प्रसरण को दस हज़ार से गुणा कर देता है। (36 प्रसरण को 9 से गुणा करके उसे मानक विचलन बता देता है।)",
          mr: "प्रत्येक मूल्य 3 ने गुणल्याने माध्य 3 ने आणि प्रत्येक विचलनही 3 ने गुणले जाते, म्हणून प्रमाण विचलन 4 × 3 = 12 बनते. हे मागच्या प्रश्नासमोर ठेवा आणि जोडीच अख्खा धडा: जोडणे विखुरलेपण सोडते, गुणणे ते प्रमाणात ताणते. विचरण पुन्हा वेगळे वागते — ते 3² म्हणजे 9 ने गुणले जाऊन 144 बनते, कारण ते वर्ग केलेल्या विचलनांतून बनले आहे. व्यावहारिक परिणाम लक्षात घ्या: मोजमापांचा संच मीटरवरून सेंटीमीटरमध्ये बदलणे प्रमाण विचलन 100 ने आणि विचरण दहा हजाराने गुणते. (36 विचरण 9 ने गुणून ते प्रमाण विचलन सांगते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "The mean of 10 observations is 15. Later one observation, which was 20, is found to have been recorded as 30. What is the corrected mean?",
          hi: "10 प्रेक्षणों का माध्य 15 है। बाद में पाया जाता है कि एक प्रेक्षण, जो 20 था, 30 दर्ज कर लिया गया था। सही किया गया माध्य क्या है?",
          mr: "10 निरीक्षणांचा माध्य 15 आहे. नंतर आढळते की एक निरीक्षण, जे 20 होते, ते 30 नोंदवले गेले होते. दुरुस्त केलेला माध्य किती?",
        },
        answer: 14,
        wrong: [16, 15, 13],
        checkExpr: "(150-30+20)/10",
        solution: {
          en: "Work through the total rather than the mean. The recorded total is 10 × 15 = 150. Remove the wrong entry and put back the right one: 150 − 30 + 20 = 140, and 140/10 = 14. The direction is worth checking against common sense — the recorded value was too high, so the true mean must be lower than 15, and any answer above 15 is wrong before the arithmetic is examined. Note also that the count stays at 10; nothing was added or removed, only replaced. (16 corrects in the wrong direction, adding the error instead of subtracting it.)",
          hi: "माध्य के बजाय कुल से चलो। दर्ज कुल 10 × 15 = 150 है। ग़लत प्रविष्टि हटाओ और सही वापस रखो: 150 − 30 + 20 = 140, और 140/10 = 14. दिशा को समझ के सामने जाँचना उचित है — दर्ज मान बहुत ऊँचा था, अतः सच्चा माध्य 15 से नीचा होना ही चाहिए, और 15 से ऊपर का कोई भी उत्तर गणित देखे बिना ही ग़लत है। यह भी ध्यान दो कि गिनती 10 ही रहती है; कुछ जोड़ा या हटाया नहीं गया, केवल बदला गया। (16 ग़लत दिशा में सुधार करता है, त्रुटि घटाने के बजाय जोड़कर।)",
          mr: "माध्याऐवजी एकूणातून चला. नोंदवलेली बेरीज 10 × 15 = 150 आहे. चुकीची नोंद काढा आणि बरोबरची परत ठेवा: 150 − 30 + 20 = 140, आणि 140/10 = 14. दिशा समजेसमोर तपासणे योग्य — नोंदवलेले मूल्य फार उच्च होते, म्हणून खरा माध्य 15 हून खाली असावाच लागतो, आणि 15 हून वरचे कोणतेही उत्तर गणित पाहण्याआधीच चुकीचे. हेही लक्षात घ्या की मोजणी 10 च राहते; काही जोडले वा काढले गेले नाही, केवळ बदलले गेले. (16 चुकीच्या दिशेने दुरुस्ती करते, चूक वजा करण्याऐवजी जोडून.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "For 5 observations the sum of the squares is 200 and the mean is 6. What is the variance?",
          hi: "5 प्रेक्षणों के लिए वर्गों का योग 200 है और माध्य 6. प्रसरण क्या है?",
          mr: "5 निरीक्षणांसाठी वर्गांची बेरीज 200 आहे आणि माध्य 6. विचरण किती?",
        },
        answer: 4,
        wrong: [40, 36, 8],
        checkExpr: "200/5-6*6",
        solution: {
          en: "Use the shortcut form: variance equals the mean of the squares minus the square of the mean, so 200/5 − 6² = 40 − 36 = 4. This version exists because it needs only two running totals — the sum of the values and the sum of their squares — and never requires the individual deviations, so a calculator or a spreadsheet can compute a variance in one pass without storing the data at all. Note that it also guarantees something: since a variance can never be negative, the mean of the squares is always at least the square of the mean, which is a genuine inequality in its own right. (40 gives the mean of the squares and forgets to subtract the square of the mean.)",
          hi: "शॉर्टकट रूप लो: प्रसरण बराबर वर्गों का माध्य घटा माध्य का वर्ग, अतः 200/5 − 6² = 40 − 36 = 4. यह रूप इसलिए है कि उसे केवल दो चलते जोड़ चाहिए — मानों का योग और उनके वर्गों का योग — और अलग-अलग विचलन कभी नहीं चाहिए, अतः परिकलक या स्प्रेडशीट एक ही चक्कर में प्रसरण निकाल सकता है बिना आँकड़े जमा किए। ध्यान दो कि वह कुछ पक्का भी करता है: चूँकि प्रसरण कभी ऋणात्मक नहीं हो सकता, वर्गों का माध्य सदा माध्य के वर्ग से कम से कम उतना ही होता है, जो अपने आप में एक असली असमिका है। (40 वर्गों का माध्य देता है और माध्य का वर्ग घटाना भूल जाता है।)",
          mr: "शॉर्टकट रूप घ्या: विचरण बरोबर वर्गांचा माध्य वजा माध्याचा वर्ग, म्हणून 200/5 − 6² = 40 − 36 = 4. हे रूप यासाठी आहे की त्याला केवळ दोन चालत्या बेरजा लागतात — मूल्यांची बेरीज आणि त्यांच्या वर्गांची बेरीज — आणि वेगवेगळी विचलने कधीच लागत नाहीत, म्हणून गणकयंत्र वा स्प्रेडशीट एकाच फेऱ्यात विचरण काढू शकते माहिती न साठवता. लक्षात घ्या की ते काहीतरी पक्केही करते: विचरण कधीच ऋण असू शकत नसल्याने, वर्गांचा माध्य नेहमी माध्याच्या वर्गाइतका तरी असतो, जी स्वतःच एक खरी असमानता आहे. (40 वर्गांचा माध्य देते आणि माध्याचा वर्ग वजा करणे विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "One group of 30 students has mean marks 50 and another group of 20 has mean marks 60. What is the mean of all 50 students together?",
          hi: "30 विद्यार्थियों के एक समूह के औसत अंक 50 हैं और 20 के दूसरे समूह के 60. मिलाकर सभी 50 विद्यार्थियों का माध्य क्या है?",
          mr: "30 विद्यार्थ्यांच्या एका गटाचे सरासरी गुण 50 आहेत आणि 20 च्या दुसऱ्या गटाचे 60. मिळून सर्व 50 विद्यार्थ्यांचा माध्य किती?",
        },
        answer: 54,
        wrong: [55, 110, 52],
        checkExpr: "(30*50+20*60)/50",
        solution: {
          en: "Recover each total and add: 30 × 50 = 1500 and 20 × 60 = 1200, giving 2700 over 50 students, so the combined mean is 54. The trap is to average the two means and get 55, which would only be right if the groups were the same size. Here the larger group pulls the answer towards its own mean, and the result of 54 sits closer to 50 than to 60 exactly as it should — a weighted average always leans towards the heavier weight. This is the same reasoning that makes a batting average over two seasons depend on how many innings were played in each, not just on the two averages. (55 takes the plain average of the two means, ignoring the group sizes.)",
          hi: "हर कुल वापस निकालो और जोड़ो: 30 × 50 = 1500 और 20 × 60 = 1200, जिससे 50 विद्यार्थियों पर 2700, अतः मिला-जुला माध्य 54. जाल है दोनों माध्यों का औसत लेकर 55 पा लेना, जो तभी ठीक होता जब समूह बराबर आकार के होते। यहाँ बड़ा समूह उत्तर को अपने माध्य की ओर खींचता है, और 54 का परिणाम ठीक वैसे 50 के पास बैठता है, 60 के नहीं, जैसा उसे बैठना चाहिए — भारित औसत सदा भारी पलड़े की ओर झुकता है। यही तर्क दो सत्रों की बल्लेबाज़ी औसत को इस पर निर्भर बनाता है कि हर सत्र में कितनी पारियाँ खेली गईं, केवल दो औसतों पर नहीं। (55 दोनों माध्यों का सादा औसत ले लेता है, समूहों के आकार की अनदेखी करके।)",
          mr: "प्रत्येक बेरीज परत काढा आणि जोडा: 30 × 50 = 1500 आणि 20 × 60 = 1200, ज्यातून 50 विद्यार्थ्यांवर 2700, म्हणून एकत्रित माध्य 54. सापळा म्हणजे दोन्ही माध्यांची सरासरी घेऊन 55 मिळवणे, जे गट समान आकाराचे असते तरच बरोबर झाले असते. इथे मोठा गट उत्तराला आपल्या माध्याकडे ओढतो, आणि 54 चा निकाल नेमका तसाच 50 च्या जवळ बसतो, 60 च्या नव्हे, जसा त्याने बसावा — भारित सरासरी नेहमी जड पारड्याकडे झुकते. हाच तर्क दोन हंगामांची फलंदाजी सरासरी प्रत्येक हंगामात किती डाव खेळले यावर अवलंबून करतो, केवळ दोन सरासरींवर नव्हे. (55 दोन्ही माध्यांची साधी सरासरी घेते, गटांचे आकार दुर्लक्षून.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-statistics",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 13 — Statistics",
      name: "Statistics",
      summary:
        "Two sets of marks can share a mean and describe completely different classes, so this chapter measures the SPREAD instead: deviations squared so that they cannot cancel, a variance that ignores a shift and obeys a stretch, and a coefficient that lets a spread in rupees be compared with a spread in kilograms.",
      position: 13,
      translations: {
        hi: {
          name: "सांख्यिकी",
          summary:
            "अंकों के दो समुच्चय एक ही माध्य साझा करके भी बिलकुल भिन्न कक्षाओं का वर्णन कर सकते हैं, अतः यह अध्याय इसके बजाय फैलाव मापता है: विचलन जिनका वर्ग किया जाता है ताकि वे कट न जाएँ, ऐसा प्रसरण जो खिसकाव की अनदेखी करता है और खिंचाव मानता है, और ऐसा गुणांक जो रुपयों के फैलाव की तुलना किलोग्राम के फैलाव से करने देता है।",
        },
        mr: {
          name: "सांख्यिकी",
          summary:
            "गुणांचे दोन संच एकच माध्य वाटून घेऊनही अगदी वेगळ्या वर्गांचे वर्णन करू शकतात, म्हणून हे प्रकरण त्याऐवजी विखुरलेपण मोजते: विचलने ज्यांचा वर्ग केला जातो जेणेकरून ती छेदू नयेत, असे विचरण जे सरकाव दुर्लक्षते आणि ताण मानते, आणि असा सहगुणक जो रुपयांतल्या विखुरलेपणाची तुलना किलोग्रॅममधल्या विखुरलेपणाशी करू देतो.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 14 — Probability (counting what might happen)                     */
/* ------------------------------------------------------------------------- */
function probability11(): TopicFileOut {
  const rand = rng("maths-11-probability");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Two coins are tossed together. How many outcomes are there in the sample space?",
          hi: "दो सिक्के एक साथ उछाले जाते हैं। प्रतिदर्श समष्टि में कितने परिणाम हैं?",
          mr: "दोन नाणी एकत्र उडवली जातात. नमुना अवकाशात किती परिणाम आहेत?",
        },
        answer: 4,
        wrong: [2, 3, 8],
        checkExpr: "2*2",
        solution: {
          en: "Each coin has 2 faces and the two coins are independent, so there are 2 × 2 = 4 outcomes: HH, HT, TH and TT. Note that HT and TH are counted separately even though both show one head — treating them as a single outcome is the mistake that makes 3, and it would wrongly suggest that one head is as likely as two. (3 counts by the number of heads rather than by outcome.)",
          hi: "हर सिक्के के 2 फलक हैं और दोनों सिक्के स्वतंत्र हैं, अतः 2 × 2 = 4 परिणाम: HH, HT, TH और TT. ध्यान दो कि HT और TH अलग-अलग गिने जाते हैं भले ही दोनों एक चित दिखाते हों — उन्हें एक ही परिणाम मानना वही भूल है जो 3 बनाती है, और वह ग़लत ढंग से सुझाती कि एक चित उतना ही संभव है जितना दो। (3 परिणाम से नहीं, चितों की संख्या से गिनता है।)",
          mr: "प्रत्येक नाण्याला 2 बाजू आहेत आणि दोन्ही नाणी स्वतंत्र आहेत, म्हणून 2 × 2 = 4 परिणाम: HH, HT, TH आणि TT. लक्षात घ्या की HT आणि TH वेगवेगळे मोजले जातात जरी दोन्ही एक छापा दाखवत असले तरी — त्यांना एकच परिणाम मानणे हीच ती चूक जी 3 बनवते, आणि ती चुकीच्या पद्धतीने सुचवेल की एक छापा दोनइतकाच संभवनीय आहे. (3 परिणामाने नव्हे, छाप्यांच्या संख्येने मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Two dice are thrown together. How many outcomes are there in the sample space?",
          hi: "दो पासे एक साथ फेंके जाते हैं। प्रतिदर्श समष्टि में कितने परिणाम हैं?",
          mr: "दोन फासे एकत्र टाकले जातात. नमुना अवकाशात किती परिणाम आहेत?",
        },
        answer: 36,
        wrong: [12, 6, 30],
        checkExpr: "6*6",
        solution: {
          en: "Each die can show any of 6 faces independently of the other, so 6 × 6 = 36 outcomes. The sample space is the set of ORDERED pairs, so (2, 5) and (5, 2) are two different outcomes even though the dice are identical to look at — which is why sums such as 7 turn out to be more likely than 2. (12 adds the two counts instead of multiplying them.)",
          hi: "हर पासा दूसरे से स्वतंत्र रूप से 6 में से कोई भी फलक दिखा सकता है, अतः 6 × 6 = 36 परिणाम। प्रतिदर्श समष्टि क्रमित युग्मों का समुच्चय है, अतः (2, 5) और (5, 2) दो भिन्न परिणाम हैं भले ही पासे देखने में एक जैसे हों — इसीलिए 7 जैसे योग 2 से अधिक संभव निकलते हैं। (12 दोनों गिनतियाँ गुणा करने के बजाय जोड़ देता है।)",
          mr: "प्रत्येक फासा दुसऱ्यापासून स्वतंत्रपणे 6 पैकी कोणतीही बाजू दाखवू शकतो, म्हणून 6 × 6 = 36 परिणाम. नमुना अवकाश हा क्रमित जोड्यांचा संच आहे, म्हणून (2, 5) आणि (5, 2) हे दोन वेगळे परिणाम आहेत जरी फासे दिसायला सारखे असले तरी — म्हणूनच 7 सारख्या बेरजा 2 हून अधिक संभवनीय निघतात. (12 दोन्ही मोजण्या गुणण्याऐवजी जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A fair coin is tossed once. What is the probability of getting a head, as a percentage?",
          hi: "एक निष्पक्ष सिक्का एक बार उछाला जाता है। चित आने की प्रायिकता प्रतिशत में क्या है?",
          mr: "एक निष्पक्ष नाणे एकदा उडवले जाते. छापा येण्याची संभाव्यता टक्केवारीत किती?",
        },
        answer: 50,
        wrong: [100, 25, 1],
        checkExpr: "1/2*100",
        solution: {
          en: "One favourable outcome out of two equally likely ones: 1/2 × 100 = 50 per cent. The phrase equally likely is doing real work — the whole formula of favourable over total is valid only when every outcome in the sample space has the same chance, which is exactly what fair means. (100 treats a certainty as the answer.)",
          hi: "दो समसंभावी परिणामों में से एक अनुकूल: 1/2 × 100 = 50 प्रतिशत। समसंभावी वाक्यांश असली काम कर रहा है — अनुकूल बटा कुल का पूरा सूत्र तभी वैध है जब प्रतिदर्श समष्टि के हर परिणाम की संभावना एक जैसी हो, और निष्पक्ष का ठीक यही अर्थ है। (100 निश्चितता को उत्तर मान लेता है।)",
          mr: "दोन समसंभाव्य परिणामांपैकी एक अनुकूल: 1/2 × 100 = 50 टक्के. समसंभाव्य हा वाक्यांश खरे काम करतो — अनुकूल भागिले एकूण हे अख्खे सूत्र तेव्हाच वैध जेव्हा नमुना अवकाशातल्या प्रत्येक परिणामाची शक्यता सारखी असेल, आणि निष्पक्षचा नेमका हाच अर्थ. (100 निश्चिततेला उत्तर मानते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Two dice are thrown. How many outcomes give a sum of 7?",
          hi: "दो पासे फेंके जाते हैं। कितने परिणाम योग 7 देते हैं?",
          mr: "दोन फासे टाकले जातात. किती परिणाम बेरीज 7 देतात?",
        },
        answer: 6,
        wrong: [7, 5, 3],
        checkExpr: "36/6",
        solution: {
          en: "List them by the first die: 1 with 6, then 2 with 5, then 3 with 4, then 4 with 3, then 5 with 2, then 6 with 1 — a count of 6 outcomes. A sum of 7 has more ways than any other, which is why it is the most likely total on two dice; a sum of 2 or 12 can happen in only one way each. Listing in order of the first die is what stops you missing a pair or counting one twice. (3 lists only the pairs and forgets that each can occur in either order.)",
          hi: "पहले पासे के क्रम में गिनाओ: 1 के साथ 6, फिर 2 के साथ 5, फिर 3 के साथ 4, फिर 4 के साथ 3, फिर 5 के साथ 2, फिर 6 के साथ 1 — कुल 6 परिणाम। योग 7 के तरीक़े किसी भी दूसरे से अधिक हैं, इसीलिए दो पासों पर वही सबसे संभव कुल है; योग 2 या 12 केवल एक-एक तरीक़े से हो सकता है। पहले पासे के क्रम में गिनाना ही तुम्हें कोई युग्म चूकने या दो बार गिनने से रोकता है। (3 केवल युग्म गिनाता है और भूल जाता है कि हर एक दोनों क्रमों में हो सकता है।)",
          mr: "पहिल्या फाशाच्या क्रमाने यादी करा: 1 सोबत 6, मग 2 सोबत 5, मग 3 सोबत 4, मग 4 सोबत 3, मग 5 सोबत 2, मग 6 सोबत 1 — एकूण 6 परिणाम. बेरीज 7 चे मार्ग इतर कोणत्याहीहून अधिक आहेत, म्हणूनच दोन फाशांवर तीच सर्वांत संभवनीय बेरीज; बेरीज 2 वा 12 केवळ एकेका मार्गाने घडू शकते. पहिल्या फाशाच्या क्रमाने यादी करणेच तुम्हाला एखादी जोडी चुकवण्यापासून वा दोनदा मोजण्यापासून रोखते. (3 केवळ जोड्या मोजते आणि प्रत्येक दोन्ही क्रमांत घडू शकते हे विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A die is thrown once. How many outcomes show a prime number?",
          hi: "एक पासा एक बार फेंका जाता है। कितने परिणाम अभाज्य संख्या दिखाते हैं?",
          mr: "एक फासा एकदा टाकला जातो. किती परिणाम अवयवी संख्या दाखवतात?",
        },
        answer: 3,
        wrong: [2, 4, 6],
        checkExpr: "6/2",
        solution: {
          en: "The primes among 1 to 6 are 2, 3 and 5 — three of them. The two easy slips are counting 1 as prime, which it is not by definition, and forgetting 2, which is prime despite being even. Getting the event right is usually harder than the arithmetic that follows it. (4 counts 1 as a prime as well.)",
          hi: "1 से 6 में अभाज्य 2, 3 और 5 हैं — तीन। दो आसान चूकें हैं 1 को अभाज्य गिन लेना, जो वह परिभाषा से नहीं है, और 2 को भूल जाना, जो सम होते हुए भी अभाज्य है। घटना को ठीक पकड़ना प्रायः उसके बाद के गणित से कठिन होता है। (4 1 को भी अभाज्य गिन लेता है।)",
          mr: "1 ते 6 मधली अवयवी 2, 3 आणि 5 — तीन. दोन सोप्या चुका म्हणजे 1 ला अवयवी मोजणे, जी ती व्याख्येने नाही, आणि 2 विसरणे, जी सम असूनही अवयवी आहे. घटना नीट पकडणे बहुधा त्यानंतरच्या गणिताहून कठीण असते. (4 1 लाही अवयवी मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A and B are mutually exclusive events with P(A) = 0.3 and P(B) = 0.4. What is P(A or B)?",
          hi: "A और B परस्पर अपवर्जी घटनाएँ हैं जिनमें P(A) = 0.3 और P(B) = 0.4. P(A या B) क्या है?",
          mr: "A आणि B या परस्पर वर्जक घटना असून P(A) = 0.3 आणि P(B) = 0.4. P(A किंवा B) किती?",
        },
        answer: 0.7,
        wrong: [0.12, 0.1, 1],
        checkExpr: "0.3+0.4",
        solution: {
          en: "Mutually exclusive means the two events cannot both happen, so there is no overlap to subtract and the probabilities simply add: 0.3 + 0.4 = 0.7. This is the union formula from the chapter on sets with the intersection equal to zero — the addition rule is not a new idea, only a familiar one applied to a sample space. (0.12 multiplies the two, which is the rule for INDEPENDENT events happening together, a different situation entirely.)",
          hi: "परस्पर अपवर्जी का अर्थ है दोनों घटनाएँ एक साथ हो ही नहीं सकतीं, अतः घटाने को कोई अतिव्यापन नहीं और प्रायिकताएँ बस जुड़ जाती हैं: 0.3 + 0.4 = 0.7. यह समुच्चय अध्याय का सम्मिलन सूत्र ही है जिसमें प्रतिच्छेदन शून्य है — योग-नियम कोई नया विचार नहीं, केवल परिचित विचार प्रतिदर्श समष्टि पर लगाया हुआ। (0.12 दोनों को गुणा कर देता है, जो स्वतंत्र घटनाओं के एक साथ होने का नियम है, बिलकुल अलग स्थिति।)",
          mr: "परस्पर वर्जक म्हणजे दोन्ही घटना एकाच वेळी घडूच शकत नाहीत, म्हणून वजा करायला आच्छादन नाही आणि संभाव्यता फक्त जुळतात: 0.3 + 0.4 = 0.7. हे संच प्रकरणातले संयोग सूत्रच आहे ज्यात छेद शून्य आहे — बेरीज-नियम ही नवी कल्पना नव्हे, केवळ परिचित कल्पना नमुना अवकाशावर लावलेली. (0.12 दोन्ही गुणते, जो स्वतंत्र घटना एकत्र घडण्याचा नियम आहे, अगदी वेगळी स्थिती.)",
        },
      },
      rand,
    ),
  );
  qs.push(
    numQ(
      {
        level: 3,
        stem: {
          en: "If P(A) = 0.6, what is the probability that A does NOT happen?",
          hi: "यदि P(A) = 0.6, तो A के न होने की प्रायिकता क्या है?",
          mr: "जर P(A) = 0.6, तर A न घडण्याची संभाव्यता किती?",
        },
        answer: 0.4,
        wrong: [0.6, 1.6, 0.36],
        checkExpr: "1-0.6",
        solution: {
          en: "Either A happens or it does not, and those two possibilities cover the whole sample space with no overlap, so their probabilities must add to 1: P(not A) = 1 − 0.6 = 0.4. The complement is the most useful tool in the chapter, because counting the ways something can FAIL is often far easier than counting the ways it can happen. (0.36 squares the probability, which answers a different question about two independent trials.)",
          hi: "या तो A होती है या नहीं होती, और वे दोनों संभावनाएँ बिना अतिव्यापन पूरी प्रतिदर्श समष्टि ढाँप देती हैं, अतः उनकी प्रायिकताएँ जुड़कर 1 बननी ही चाहिए: P(A नहीं) = 1 − 0.6 = 0.4. पूरक इस अध्याय का सबसे उपयोगी औज़ार है, क्योंकि किसी चीज़ के विफल होने के तरीक़े गिनना प्रायः उसके होने के तरीक़े गिनने से कहीं आसान है। (0.36 प्रायिकता का वर्ग कर देता है, जो दो स्वतंत्र परीक्षणों के बारे में दूसरे प्रश्न का उत्तर है।)",
          mr: "एकतर A घडते किंवा घडत नाही, आणि त्या दोन शक्यता आच्छादनाविना अख्खा नमुना अवकाश झाकतात, म्हणून त्यांच्या संभाव्यता जुळून 1 बनल्याच पाहिजेत: P(A नाही) = 1 − 0.6 = 0.4. पूरक हे या प्रकरणातले सर्वांत उपयुक्त हत्यार, कारण एखादी गोष्ट अपयशी होण्याचे मार्ग मोजणे बहुधा ती घडण्याचे मार्ग मोजण्याहून कितीतरी सोपे. (0.36 संभाव्यतेचा वर्ग करते, जे दोन स्वतंत्र चाचण्यांबद्दलच्या वेगळ्या प्रश्नाचे उत्तर.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "P(A) = 0.6, P(B) = 0.5 and P(A and B) = 0.2. What is P(A or B)?",
          hi: "P(A) = 0.6, P(B) = 0.5 और P(A और B) = 0.2. P(A या B) क्या है?",
          mr: "P(A) = 0.6, P(B) = 0.5 आणि P(A आणि B) = 0.2. P(A किंवा B) किती?",
        },
        answer: 0.9,
        wrong: [1.1, 0.3, 0.7],
        checkExpr: "0.6+0.5-0.2",
        solution: {
          en: "Add and take back the overlap: 0.6 + 0.5 − 0.2 = 0.9. Without the subtraction the answer would be 1.1, and a probability above 1 is impossible — which is a free check on every question of this kind. Note that these two events are NOT mutually exclusive, since P(A and B) is not zero; the previous question was the special case where that intersection vanishes. (1.1 forgets to subtract the overlap and produces an impossible value.)",
          hi: "जोड़ो और अतिव्यापन वापस लो: 0.6 + 0.5 − 0.2 = 0.9. घटाव बिना उत्तर 1.1 होता, और 1 से ऊपर की प्रायिकता असंभव है — जो इस तरह के हर प्रश्न पर मुफ़्त जाँच है। ध्यान दो कि ये दोनों घटनाएँ परस्पर अपवर्जी नहीं हैं, क्योंकि P(A और B) शून्य नहीं; पिछला प्रश्न वही विशेष स्थिति थी जहाँ वह प्रतिच्छेदन लुप्त हो जाता है। (1.1 अतिव्यापन घटाना भूल जाता है और असंभव मान बना देता है।)",
          mr: "जोडा आणि आच्छादन परत घ्या: 0.6 + 0.5 − 0.2 = 0.9. वजाबाकीविना उत्तर 1.1 झाले असते, आणि 1 हून वरची संभाव्यता अशक्य आहे — जी या प्रकारच्या प्रत्येक प्रश्नावर फुकट तपासणी. लक्षात घ्या की या दोन्ही घटना परस्पर वर्जक नाहीत, कारण P(A आणि B) शून्य नाही; मागचा प्रश्न तीच खास स्थिती होती जिथे तो छेद नाहीसा होतो. (1.1 आच्छादन वजा करणे विसरते आणि अशक्य मूल्य बनवते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A bag holds 4 red and 2 blue balls. Two are drawn together. In how many ways can both be red?",
          hi: "किसी थैले में 4 लाल और 2 नीली गेंदें हैं। दो एक साथ निकाली जाती हैं। दोनों लाल होने के कितने तरीक़े हैं?",
          mr: "एका पिशवीत 4 लाल आणि 2 निळे चेंडू आहेत. दोन एकत्र काढले जातात. दोन्ही लाल असण्याचे किती मार्ग आहेत?",
        },
        answer: 6,
        wrong: [12, 8, 4],
        checkExpr: "4*3/2",
        solution: {
          en: "Choosing 2 of the 4 red balls is ⁴C₂ = (4 × 3)/2 = 6. The words DRAWN TOGETHER matter: the two balls come out at the same moment, so there is no first or second and the count is a combination rather than a permutation. (12 counts ordered draws, which would be right if one ball were taken and then another.)",
          hi: "4 लाल गेंदों में से 2 चुनना ⁴C₂ = (4 × 3)/2 = 6. एक साथ निकाली शब्द मायने रखते हैं: दोनों गेंदें एक ही क्षण बाहर आती हैं, अतः पहली या दूसरी कोई नहीं और गिनती क्रमचय नहीं, संचय है। (12 क्रमित निकासी गिनता है, जो तब ठीक होता जब एक गेंद लेकर फिर दूसरी ली जाती।)",
          mr: "4 लाल चेंडूंपैकी 2 निवडणे म्हणजे ⁴C₂ = (4 × 3)/2 = 6. एकत्र काढले हे शब्द महत्त्वाचे: दोन्ही चेंडू एकाच क्षणी बाहेर येतात, म्हणून पहिला वा दुसरा कोणी नाही आणि मोजणी क्रमचय नव्हे, संचय आहे. (12 क्रमित काढण्या मोजते, जे एक चेंडू घेऊन मग दुसरा घेतला असता तर बरोबर झाले असते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "From the same bag of 6 balls, in how many ways can any 2 balls be drawn together?",
          hi: "उसी 6 गेंदों के थैले से कोई भी 2 गेंदें एक साथ कितने तरीक़ों से निकाली जा सकती हैं?",
          mr: "त्याच 6 चेंडूंच्या पिशवीतून कोणतेही 2 चेंडू एकत्र किती प्रकारे काढता येतील?",
        },
        answer: 15,
        wrong: [30, 12, 36],
        checkExpr: "6*5/2",
        solution: {
          en: "⁶C₂ = (6 × 5)/2 = 15. This is the size of the sample space for the next question, and building it separately is the right habit — a probability is a fraction, and the two halves of that fraction are counted by the same method applied to different sets. (30 counts ordered pairs and never divides by 2.)",
          hi: "⁶C₂ = (6 × 5)/2 = 15. यह अगले प्रश्न की प्रतिदर्श समष्टि का आकार है, और उसे अलग से बनाना सही आदत है — प्रायिकता एक भिन्न है, और उस भिन्न के दोनों हिस्से भिन्न समुच्चयों पर लगाई गई उसी विधि से गिने जाते हैं। (30 क्रमित युग्म गिनता है और 2 से भाग देता ही नहीं।)",
          mr: "⁶C₂ = (6 × 5)/2 = 15. हा पुढच्या प्रश्नाच्या नमुना अवकाशाचा आकार, आणि तो वेगळा बांधणे ही योग्य सवय — संभाव्यता हा एक अपूर्णांक आहे, आणि त्या अपूर्णांकाचे दोन्ही भाग वेगवेगळ्या संचांवर लावलेल्या त्याच पद्धतीने मोजले जातात. (30 क्रमित जोड्या मोजते आणि 2 ने भागतच नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A bag holds 4 red and 2 blue balls, and two are drawn together. What is the probability that both are red?",
          hi: "किसी थैले में 4 लाल और 2 नीली गेंदें हैं, और दो एक साथ निकाली जाती हैं। दोनों के लाल होने की प्रायिकता क्या है?",
          mr: "एका पिशवीत 4 लाल आणि 2 निळे चेंडू आहेत, आणि दोन एकत्र काढले जातात. दोन्ही लाल असण्याची संभाव्यता किती?",
        },
        answer: 0.4,
        wrong: [0.5, 0.6, 0.25],
        checkExpr: "6/15",
        solution: {
          en: "Favourable outcomes over total outcomes: 6/15 = 0.4. Both counts had to be combinations for the fraction to be honest — mixing a combination on top with a permutation below is the error that quietly halves or doubles an answer. Note that 0.4 is less than the 4/6 chance of a single red ball, which makes sense: after one red is taken there is one fewer red left, so the second draw is harder than the first. (0.6 gives the chance that a single ball drawn is red.)",
          hi: "अनुकूल परिणाम बटा कुल परिणाम: 6/15 = 0.4. भिन्न के ईमानदार होने के लिए दोनों गिनतियों का संचय होना ज़रूरी था — ऊपर संचय और नीचे क्रमचय मिला देना वही भूल है जो चुपचाप उत्तर आधा या दुगुना कर देती है। ध्यान दो कि 0.4 अकेली लाल गेंद की 4/6 संभावना से कम है, जो समझ में आता है: एक लाल निकल जाने पर एक लाल कम बचती है, अतः दूसरी निकासी पहली से कठिन है। (0.6 अकेली निकाली गेंद के लाल होने की संभावना देता है।)",
          mr: "अनुकूल परिणाम भागिले एकूण परिणाम: 6/15 = 0.4. अपूर्णांक प्रामाणिक असण्यासाठी दोन्ही मोजण्या संचय असणे आवश्यक होते — वर संचय आणि खाली क्रमचय मिसळणे हीच ती चूक जी गुपचूप उत्तर निम्मे वा दुप्पट करते. लक्षात घ्या की 0.4 हे एकाच लाल चेंडूच्या 4/6 शक्यतेहून कमी आहे, जे समजण्याजोगे: एक लाल निघाल्यावर एक लाल कमी उरतो, म्हणून दुसरी काढणी पहिलीहून कठीण. (0.6 एकच काढलेला चेंडू लाल असण्याची शक्यता देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "One card is drawn from a pack of 52. How many cards are either a king or a heart?",
          hi: "52 पत्तों की गड्डी से एक पत्ता निकाला जाता है। कितने पत्ते या तो बादशाह हैं या पान?",
          mr: "52 पत्त्यांच्या जुडग्यातून एक पत्ता काढला जातो. किती पत्ते एकतर राजा आहेत किंवा बदाम?",
        },
        answer: 16,
        wrong: [17, 13, 4],
        checkExpr: "4+13-1",
        solution: {
          en: "There are 4 kings and 13 hearts, but the king of hearts is in both lists and would be counted twice, so the answer is 4 + 13 − 1 = 16. This is the addition rule doing exactly what the union formula did for sets, and the single card in the overlap is the whole reason the answer is not 17. Whenever two categories in a question can both apply to one object, look for that object before adding. (17 adds the two counts and double-counts the king of hearts.)",
          hi: "4 बादशाह और 13 पान हैं, पर पान का बादशाह दोनों सूचियों में है और दो बार गिना जाता, अतः उत्तर 4 + 13 − 1 = 16. यह योग-नियम ठीक वही कर रहा है जो सम्मिलन सूत्र समुच्चयों के लिए करता था, और अतिव्यापन का वह अकेला पत्ता ही पूरा कारण है कि उत्तर 17 नहीं। जब भी प्रश्न की दो श्रेणियाँ किसी एक वस्तु पर एक साथ लागू हो सकें, जोड़ने से पहले उस वस्तु को ढूँढ़ो। (17 दोनों गिनतियाँ जोड़ देता है और पान के बादशाह को दो बार गिन लेता है।)",
          mr: "4 राजे आणि 13 बदाम आहेत, पण बदामाचा राजा दोन्ही यादींत आहे आणि दोनदा मोजला गेला असता, म्हणून उत्तर 4 + 13 − 1 = 16. हा बेरीज-नियम नेमके तेच करतो आहे जे संयोग सूत्र संचांसाठी करत होते, आणि आच्छादनातला तो एकच पत्ता हेच अख्खे कारण की उत्तर 17 नाही. जेव्हा जेव्हा प्रश्नातल्या दोन श्रेणी एकाच वस्तूवर एकाच वेळी लागू होऊ शकतील, तेव्हा जोडण्याआधी ती वस्तू शोधा. (17 दोन्ही मोजण्या जोडते आणि बदामाचा राजा दोनदा मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Three fair coins are tossed together. What is the probability of getting exactly two heads?",
          hi: "तीन निष्पक्ष सिक्के एक साथ उछाले जाते हैं। ठीक दो चित आने की प्रायिकता क्या है?",
          mr: "तीन निष्पक्ष नाणी एकत्र उडवली जातात. नेमके दोन छापे येण्याची संभाव्यता किती?",
        },
        answer: 0.375,
        wrong: [0.5, 0.25, 0.125],
        checkExpr: "3/8",
        solution: {
          en: "The sample space has 2 × 2 × 2 = 8 outcomes. Exactly two heads happens in three of them — HHT, HTH and THH — so the probability is 3/8 = 0.375. Choosing WHICH two coins show heads is ³C₂ = 3, which is why the binomial coefficients appear here at all; the same reasoning gives 1, 3, 3, 1 for zero, one, two and three heads, adding to the full 8. The commonest wrong route is to reason that two heads out of three is a fraction of two-thirds, which confuses the count of heads with the count of outcomes. (0.125 gives the chance of one specific outcome such as HHT.)",
          hi: "प्रतिदर्श समष्टि में 2 × 2 × 2 = 8 परिणाम हैं। ठीक दो चित उनमें से तीन में होते हैं — HHT, HTH और THH — अतः प्रायिकता 3/8 = 0.375. कौन-से दो सिक्के चित दिखाएँ यह चुनना ³C₂ = 3 है, और इसीलिए द्विपद गुणांक यहाँ प्रकट होते हैं; वही तर्क शून्य, एक, दो और तीन चित के लिए 1, 3, 3, 1 देता है, जो जुड़कर पूरे 8 बनते हैं। सबसे आम ग़लत रास्ता यह तर्क है कि तीन में से दो चित दो-तिहाई का अंश है, जो चितों की गिनती को परिणामों की गिनती से गड्डमड्ड कर देता है। (0.125 HHT जैसे किसी एक विशिष्ट परिणाम की संभावना देता है।)",
          mr: "नमुना अवकाशात 2 × 2 × 2 = 8 परिणाम आहेत. नेमके दोन छापे त्यांपैकी तिघांत घडतात — HHT, HTH आणि THH — म्हणून संभाव्यता 3/8 = 0.375. कोणती दोन नाणी छापा दाखवतील हे निवडणे म्हणजे ³C₂ = 3, आणि म्हणूनच द्विपद सहगुणक इथे प्रकटतात; तोच तर्क शून्य, एक, दोन आणि तीन छाप्यांसाठी 1, 3, 3, 1 देतो, जे जुळून पूर्ण 8 बनतात. सर्वांत सामान्य चुकीचा मार्ग म्हणजे तिघांपैकी दोन छापे हा दोनतृतीयांशाचा अंश असा तर्क, जो छाप्यांची मोजणी परिणामांच्या मोजणीशी गोंधळतो. (0.125 HHT सारख्या एका विशिष्ट परिणामाची शक्यता देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A fair coin is tossed twice. What is the probability of getting at least one head?",
          hi: "एक निष्पक्ष सिक्का दो बार उछाला जाता है। कम से कम एक चित आने की प्रायिकता क्या है?",
          mr: "एक निष्पक्ष नाणे दोनदा उडवले जाते. किमान एक छापा येण्याची संभाव्यता किती?",
        },
        answer: 0.75,
        wrong: [0.5, 0.25, 1],
        checkExpr: "1-1/4",
        solution: {
          en: "At least one head means one head or two, and counting both cases works — but the complement is quicker and far safer. The only way to fail is to get no heads at all, which is the single outcome TT out of four, with probability 1/4. So the answer is 1 − 1/4 = 0.75. The advantage grows enormously with the number of tosses: for ten coins, at least one head has 1023 favourable outcomes to enumerate, while no heads has exactly one, so the complement turns a page of work into a single subtraction. Whenever a question says AT LEAST, ask what the opposite is before counting anything. (0.5 counts only the case of exactly one head.)",
          hi: "कम से कम एक चित का अर्थ है एक चित या दो, और दोनों मामले गिनना चलता है — पर पूरक तेज़ और कहीं अधिक सुरक्षित है। विफल होने का इकलौता तरीक़ा है एक भी चित न आना, जो चार में से अकेला परिणाम TT है, जिसकी प्रायिकता 1/4. अतः उत्तर 1 − 1/4 = 0.75. उछालों की संख्या के साथ लाभ बहुत बढ़ता है: दस सिक्कों के लिए कम से कम एक चित के 1023 अनुकूल परिणाम गिनने पड़ते, जबकि कोई चित नहीं का ठीक एक, अतः पूरक पन्ने भर के काम को एक घटाव बना देता है। जब भी प्रश्न कम से कम कहे, कुछ भी गिनने से पहले पूछो कि उलटा क्या है। (0.5 केवल ठीक एक चित का मामला गिनता है।)",
          mr: "किमान एक छापा म्हणजे एक छापा किंवा दोन, आणि दोन्ही प्रकरणे मोजणे चालते — पण पूरक वेगवान आणि कितीतरी सुरक्षित. अपयशी होण्याचा एकमेव मार्ग म्हणजे एकही छापा न येणे, जो चारांपैकी एकटा परिणाम TT आहे, ज्याची संभाव्यता 1/4. म्हणून उत्तर 1 − 1/4 = 0.75. उडवण्यांच्या संख्येसोबत फायदा प्रचंड वाढतो: दहा नाण्यांसाठी किमान एक छाप्याचे 1023 अनुकूल परिणाम मोजावे लागले असते, तर एकही छापा नाहीचा नेमका एक, म्हणून पूरक पानभर कामाला एका वजाबाकीत बदलतो. जेव्हा जेव्हा प्रश्न किमान म्हणतो, तेव्हा काहीही मोजण्याआधी विचारा की उलटे काय आहे. (0.5 केवळ नेमक्या एका छाप्याचे प्रकरण मोजते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-11-probability",
      subject: "MATHS",
      classLevel: 11,
      chapter: "Chapter 14 — Probability",
      name: "Probability",
      summary:
        "Chance rebuilt on sets: the sample space is a set, an event is a subset of it, and the addition rule turns out to be the union formula wearing a new name — with the complement standing ready for every question where counting what you want is harder than counting what you do not.",
      position: 14,
      translations: {
        hi: {
          name: "प्रायिकता",
          summary:
            "संयोग को समुच्चयों पर फिर से खड़ा किया गया: प्रतिदर्श समष्टि एक समुच्चय है, घटना उसका उपसमुच्चय, और योग-नियम वही सम्मिलन सूत्र निकलता है जो नया नाम पहने है — और पूरक हर उस प्रश्न के लिए तैयार खड़ा है जहाँ जो चाहिए उसे गिनना उससे कठिन है जो नहीं चाहिए।",
        },
        mr: {
          name: "संभाव्यता",
          summary:
            "योग संचांवर पुन्हा उभा केला गेला: नमुना अवकाश हा एक संच आहे, घटना हा त्याचा उपसंच, आणि बेरीज-नियम तेच संयोग सूत्र निघते जे नवे नाव घालून आहे — आणि पूरक प्रत्येक अशा प्रश्नासाठी तयार उभा आहे जिथे जे हवे ते मोजणे जे नको ते मोजण्याहून कठीण असते.",
        },
      },
    },
    qs,
  );
}

export const G11_MATHS: TopicFileOut[] = [
  sets11(),
  relationsFunctions11(),
  trigFunctions11(),
  complexNumbers11(),
  linearInequalities11(),
  permutations11(),
  binomialTheorem11(),
  sequences11(),
  straightLines11(),
  conicSections11(),
  threeDGeometry11(),
  limitsDerivatives11(),
  statistics11(),
  probability11(),
];
