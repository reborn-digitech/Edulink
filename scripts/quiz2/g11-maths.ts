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

export const G11_MATHS: TopicFileOut[] = [
  sets11(),
  relationsFunctions11(),
  trigFunctions11(),
  complexNumbers11(),
  linearInequalities11(),
];
