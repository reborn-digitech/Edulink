/**
 * Class 12 Maths — NCERT, chapter by chapter, and the last family in the bank.
 *
 * The shape is the one every maths chapter here uses: fourteen questions
 * authored one at a time, three at level 1 down to two at level 6, every answer
 * proven by a `checkExpr` the verifier evaluates, and every wrong option a
 * mistake a real eighteen-year-old makes — the determinant of 2A taken as twice
 * the determinant, sin⁻¹(sin θ) answered with θ when θ is outside the principal
 * range, the number of onto functions counted as the number of all functions.
 *
 * What is new at this level is that most of the chapters are about OPERATIONS
 * ON WHOLE OBJECTS rather than on numbers: a matrix multiplied by a matrix, a
 * function composed with a function, a relation classified by properties it
 * either has or has not. The arithmetic stays checkable — that is the point of
 * a computed bank — but the quantity being computed is increasingly a fact
 * about a structure. A determinant is one number that decides whether a whole
 * system of equations has a solution; the order of a product is fixed before
 * any entry is calculated; and the count of equivalence relations on a set is
 * the count of ways to partition it. Those are still sums, and every one of
 * them is proven here, but the reason to do the sum has changed.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { OutQuestion, TopicFileOut } from "./engine";
import { rng } from "./engine";
import { numQ } from "./numeric";

const SOURCE = "EduLink original, written against NCERT Mathematics (Class 12)";
const LICENCE = "CC-BY-SA-4.0";

function topic(
  meta: Omit<TopicFileOut, "questions" | "source" | "licence">,
  questions: OutQuestion[],
): TopicFileOut {
  return { ...meta, source: SOURCE, licence: LICENCE, questions };
}

/* ------------------------------------------------------------------------- */
/* Chapter 1 — Relations and Functions (classifying a whole mapping)         */
/* ------------------------------------------------------------------------- */
function relationsFunctions12(): TopicFileOut {
  const rand = rng("maths-12-relations-and-functions");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A set A has 3 elements. How many ordered pairs are there in A × A?",
          hi: "किसी समुच्चय A में 3 अवयव हैं। A × A में कितने क्रमित युग्म हैं?",
          mr: "एका संच A मध्ये 3 घटक आहेत. A × A मध्ये किती क्रमित जोड्या आहेत?",
        },
        answer: 9,
        wrong: [6, 3, 27],
        checkExpr: "3*3",
        solution: {
          en: "Each pair needs a first element and a second, and each can be any of the 3, so 3 × 3 = 9 pairs. This count matters because a relation on A is any subset of A × A — so every question about how many relations there are starts from this number. (6 doubles the elements instead of multiplying the choices.)",
          hi: "हर युग्म को एक पहला अवयव और एक दूसरा चाहिए, और हर एक तीनों में से कोई भी हो सकता है, अतः 3 × 3 = 9 युग्म। यह गिनती इसलिए मायने रखती है कि A पर कोई संबंध A × A का कोई भी उपसमुच्चय है — अतः कितने संबंध हैं, इस बारे में हर प्रश्न इसी संख्या से शुरू होता है। (6 विकल्पों का गुणा करने के बजाय अवयव दुगुने कर देता है।)",
          mr: "प्रत्येक जोडीला एक पहिला घटक आणि एक दुसरा लागतो, आणि प्रत्येक तिघांपैकी कोणताही असू शकतो, म्हणून 3 × 3 = 9 जोड्या. ही मोजणी यासाठी महत्त्वाची की A वरचा कोणताही संबंध हा A × A चा कोणताही उपसंच आहे — म्हणून किती संबंध आहेत याविषयीचा प्रत्येक प्रश्न याच संख्येपासून सुरू होतो. (6 पर्यायांचा गुणाकार करण्याऐवजी घटक दुप्पट करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A relation on a set of 4 elements is reflexive. How many pairs must it contain at a minimum?",
          hi: "4 अवयवों के किसी समुच्चय पर कोई संबंध स्वतुल्य है। उसमें कम से कम कितने युग्म होने ही चाहिए?",
          mr: "4 घटकांच्या एका संचावरचा एक संबंध स्वतुल्य आहे. त्यात किमान किती जोड्या असल्याच पाहिजेत?",
        },
        answer: 4,
        wrong: [16, 8, 1],
        checkExpr: "4*1",
        solution: {
          en: "Reflexive means every element is related to itself, so all four pairs (a, a) must be present: 4 × 1 = 4. Nothing else is required — a relation containing exactly those four and nothing more is reflexive, and it happens to be symmetric and transitive as well. (16 counts every pair in the product set.)",
          hi: "स्वतुल्य का अर्थ है हर अवयव स्वयं से संबंधित है, अतः चारों युग्म (a, a) मौजूद होने ही चाहिए: 4 × 1 = 4. और कुछ ज़रूरी नहीं — जिस संबंध में ठीक वही चार हों और कुछ नहीं वह स्वतुल्य है, और संयोगवश सममित तथा संक्रामक भी। (16 गुणन समुच्चय का हर युग्म गिन लेता है।)",
          mr: "स्वतुल्य म्हणजे प्रत्येक घटक स्वतःशी संबंधित आहे, म्हणून चारही जोड्या (a, a) उपस्थित असल्याच पाहिजेत: 4 × 1 = 4. आणखी काहीही आवश्यक नाही — ज्या संबंधात नेमक्या त्याच चार असतील आणि आणखी काही नाही तो स्वतुल्य आहे, आणि योगायोगाने सममित व संक्रामकही. (16 गुणन संचातली प्रत्येक जोडी मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Set A has 2 elements and set B has 3. How many functions are there from A to B?",
          hi: "समुच्चय A में 2 अवयव हैं और समुच्चय B में 3. A से B तक कितने फलन हैं?",
          mr: "संच A मध्ये 2 घटक आहेत आणि संच B मध्ये 3. A पासून B पर्यंत किती फलने आहेत?",
        },
        answer: 9,
        wrong: [6, 8, 5],
        checkExpr: "3*3",
        solution: {
          en: "A function must send each element of A somewhere in B, and the two choices are independent: 3 × 3 = 9. Note the order — it is 3² and not 2³, because the exponent counts the elements of the domain, each of which needs a decision. Getting that the wrong way round is the commonest slip in this chapter. (8 computes 2³ by taking the sets in the wrong order.)",
          hi: "फलन को A के हर अवयव को B में कहीं भेजना ही पड़ता है, और दोनों चुनाव स्वतंत्र हैं: 3 × 3 = 9. क्रम पर ध्यान दो — यह 3² है, 2³ नहीं, क्योंकि घातांक प्रांत के अवयव गिनता है, जिनमें से हर एक को एक निर्णय चाहिए। इसे उलटा कर लेना इस अध्याय की सबसे आम चूक है। (8 समुच्चयों को ग़लत क्रम में लेकर 2³ निकाल देता है।)",
          mr: "फलनाला A च्या प्रत्येक घटकाला B मध्ये कुठेतरी पाठवावेच लागते, आणि दोन्ही निवडी स्वतंत्र आहेत: 3 × 3 = 9. क्रमाकडे लक्ष द्या — हे 3² आहे, 2³ नाही, कारण घातांक प्रांताचे घटक मोजतो, ज्यांपैकी प्रत्येकाला एक निर्णय लागतो. हे उलटे करणे या प्रकरणातली सर्वांत सामान्य चूक आहे. (8 संच चुकीच्या क्रमाने घेऊन 2³ काढते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many relations are there altogether on a set of 3 elements?",
          hi: "3 अवयवों के किसी समुच्चय पर कुल कितने संबंध हैं?",
          mr: "3 घटकांच्या एका संचावर एकूण किती संबंध आहेत?",
        },
        answer: 512,
        wrong: [9, 27, 64],
        checkExpr: "8*64",
        solution: {
          en: "A relation is any subset of A × A, which has 9 pairs, and each pair is either included or not: 2⁹ = 8 × 64 = 512. The reasoning is the subset count applied to a set of pairs rather than a set of elements, which is why the answer is so much larger than anything in the question. (9 quotes the number of pairs rather than the number of subsets of them.)",
          hi: "संबंध A × A का कोई भी उपसमुच्चय है, जिसमें 9 युग्म हैं, और हर युग्म या तो शामिल है या नहीं: 2⁹ = 8 × 64 = 512. तर्क वही उपसमुच्चय गिनती है, बस अवयवों के समुच्चय के बजाय युग्मों के समुच्चय पर लगाई गई, इसीलिए उत्तर प्रश्न की किसी भी चीज़ से इतना बड़ा है। (9 उनके उपसमुच्चयों की संख्या के बजाय युग्मों की संख्या बता देता है।)",
          mr: "संबंध हा A × A चा कोणताही उपसंच आहे, ज्यात 9 जोड्या आहेत, आणि प्रत्येक जोडी एकतर समाविष्ट आहे किंवा नाही: 2⁹ = 8 × 64 = 512. युक्तिवाद तीच उपसंच मोजणी आहे, फक्त घटकांच्या संचाऐवजी जोड्यांच्या संचावर लावलेली, म्हणूनच उत्तर प्रश्नातल्या कोणत्याही गोष्टीहून इतके मोठे आहे. (9 त्यांच्या उपसंचांच्या संख्येऐवजी जोड्यांची संख्या सांगते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many one-one functions are there from a set of 3 elements to a set of 5 elements?",
          hi: "3 अवयवों के समुच्चय से 5 अवयवों के समुच्चय तक कितने एकैकी फलन हैं?",
          mr: "3 घटकांच्या संचापासून 5 घटकांच्या संचापर्यंत किती एकैकी फलने आहेत?",
        },
        answer: 60,
        wrong: [125, 15, 120],
        checkExpr: "5*4*3",
        solution: {
          en: "The first element has 5 possible images, the second has 4 left, the third has 3: 5 × 4 × 3 = 60. One-one is exactly the condition that removes an option at each step, which is why the count is a falling product rather than a power. Compare the 5³ = 125 functions with no such restriction, and the difference is what being one-one costs. (125 counts all functions rather than the injective ones.)",
          hi: "पहले अवयव के 5 संभव प्रतिबिंब हैं, दूसरे के 4 बचे, तीसरे के 3: 5 × 4 × 3 = 60. एकैकी ठीक वही शर्त है जो हर क़दम पर एक विकल्प हटा देती है, इसीलिए गिनती घात नहीं बल्कि घटता गुणनफल है। बिना इस प्रतिबंध वाले 5³ = 125 फलनों से तुलना करो, और अंतर ही वह है जो एकैकी होने की क़ीमत है। (125 अंतःक्षेपी के बजाय सारे फलन गिनता है।)",
          mr: "पहिल्या घटकाला 5 शक्य प्रतिबिंबे आहेत, दुसऱ्याला 4 उरली, तिसऱ्याला 3: 5 × 4 × 3 = 60. एकैकी नेमकी तीच अट आहे जी प्रत्येक पायरीवर एक पर्याय काढते, म्हणूनच मोजणी घात नसून घटता गुणाकार आहे. या निर्बंधाविना असलेल्या 5³ = 125 फलनांशी तुलना करा, आणि फरकच ती किंमत आहे जी एकैकी असण्याची आहे. (125 अंतःक्षेपीऐवजी सर्व फलने मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many functions from a set of 3 elements to a set of 3 elements are NOT one-one?",
          hi: "3 अवयवों के समुच्चय से 3 अवयवों के समुच्चय तक कितने फलन एकैकी नहीं हैं?",
          mr: "3 घटकांच्या संचापासून 3 घटकांच्या संचापर्यंत किती फलने एकैकी नाहीत?",
        },
        answer: 21,
        wrong: [6, 27, 3],
        checkExpr: "27-6",
        solution: {
          en: "There are 3³ = 27 functions in all and 3 × 2 × 1 = 6 of them are one-one, so 27 − 6 = 21 are not. Counting the ones that satisfy a condition and subtracting is the standard move whenever the condition is harder to describe directly than to violate — here \"not one-one\" means two elements share an image, which could happen in several ways, while \"one-one\" is a single clean product. (6 counts the one-one functions instead of the rest.)",
          hi: "कुल 3³ = 27 फलन हैं और उनमें से 3 × 2 × 1 = 6 एकैकी हैं, अतः 27 − 6 = 21 नहीं हैं। जो शर्त पूरी करते हैं उन्हें गिनकर घटाना तब मानक चाल है जब शर्त को सीधे बताने से तोड़ना आसान हो — यहाँ \"एकैकी नहीं\" का अर्थ है दो अवयव एक ही प्रतिबिंब साझा करते हैं, जो कई तरह से हो सकता है, जबकि \"एकैकी\" एक ही साफ़ गुणनफल है। (6 बाक़ी के बजाय एकैकी फलन गिन लेता है।)",
          mr: "एकूण 3³ = 27 फलने आहेत आणि त्यांपैकी 3 × 2 × 1 = 6 एकैकी आहेत, म्हणून 27 − 6 = 21 नाहीत. जी अट पूर्ण करतात त्यांना मोजून वजा करणे तेव्हा प्रमाणित चाल आहे जेव्हा अट थेट सांगण्याहून मोडणे सोपे असेल — इथे \"एकैकी नाही\" चा अर्थ दोन घटक एकच प्रतिबिंब समाईक ठेवतात, जे कित्येक प्रकारे घडू शकते, तर \"एकैकी\" एकच स्वच्छ गुणाकार आहे. (6 बाकीच्यांऐवजी एकैकी फलने मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "How many equivalence relations are there on a set of 3 elements?",
          hi: "3 अवयवों के किसी समुच्चय पर कितने तुल्यता संबंध हैं?",
          mr: "3 घटकांच्या एका संचावर किती तुल्यता संबंध आहेत?",
        },
        answer: 5,
        wrong: [512, 3, 8],
        checkExpr: "2+3",
        solution: {
          en: "2 + 3 = 5. The route to it is worth having: an equivalence relation on a set corresponds exactly to a way of partitioning that set into disjoint blocks, so counting the relations means counting the partitions. For three elements they are: all three together; all three apart; and three ways of pairing two and leaving one out. That correspondence turns an awkward question about pairs into an easy question about grouping. (512 counts all relations, of which almost none are equivalences.)",
          hi: "2 + 3 = 5. वहाँ तक का रास्ता रखने लायक़ है: किसी समुच्चय पर तुल्यता संबंध ठीक उसी समुच्चय को असंयुक्त खंडों में विभाजित करने के किसी तरीक़े से मेल खाता है, अतः संबंध गिनना विभाजन गिनना है। तीन अवयवों के लिए वे हैं: तीनों साथ; तीनों अलग; और दो को जोड़कर एक को बाहर छोड़ने के तीन तरीक़े। वह संगति युग्मों के बारे में एक भद्दे प्रश्न को समूहन के बारे में आसान प्रश्न बना देती है। (512 सारे संबंध गिनता है, जिनमें से लगभग कोई तुल्यता नहीं।)",
          mr: "2 + 3 = 5. तिथवरचा मार्ग ठेवण्याजोगा आहे: एखाद्या संचावरचा तुल्यता संबंध नेमका त्याच संचाला विभक्त गटांत विभागण्याच्या एखाद्या मार्गाशी जुळतो, म्हणून संबंध मोजणे म्हणजे विभाजने मोजणे. तीन घटकांसाठी ती आहेत: तिन्ही एकत्र; तिन्ही वेगळे; आणि दोघांना जोडून एकाला बाहेर सोडण्याचे तीन मार्ग. ती संगती जोड्यांबद्दलच्या एका अवघड प्रश्नाचे गटबंधनाबद्दलच्या सोप्या प्रश्नात रूपांतर करते. (512 सर्व संबंध मोजते, ज्यांपैकी जवळपास एकही तुल्यता नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "If f(x) = x² and g(x) = x + 1, what is (f ∘ g)(2)?",
          hi: "यदि f(x) = x² और g(x) = x + 1 हो, तो (f ∘ g)(2) क्या है?",
          mr: "जर f(x) = x² आणि g(x) = x + 1 असेल, तर (f ∘ g)(2) किती?",
        },
        answer: 9,
        wrong: [5, 4, 6],
        checkExpr: "3*3",
        solution: {
          en: "The inner function runs first: g(2) = 3, then f(3) = 3 × 3 = 9. Reading the composition right to left is the only difficulty, and doing it left to right gives f(2) = 4 then g(4) = 5, which is (g ∘ f)(2) — a different function entirely. That composition is not commutative is exactly what this pair of answers demonstrates. (5 evaluates the composition in the wrong order.)",
          hi: "भीतरी फलन पहले चलता है: g(2) = 3, फिर f(3) = 3 × 3 = 9. संयोजन को दाएँ से बाएँ पढ़ना ही एकमात्र कठिनाई है, और बाएँ से दाएँ करने पर f(2) = 4 फिर g(4) = 5 मिलता है, जो (g ∘ f)(2) है — बिलकुल भिन्न फलन। संयोजन क्रमविनिमेय नहीं है, यही ये दोनों उत्तर दिखा देते हैं। (5 संयोजन को ग़लत क्रम में निकालता है।)",
          mr: "आतले फलन आधी चालते: g(2) = 3, मग f(3) = 3 × 3 = 9. संयोजन उजवीकडून डावीकडे वाचणे हीच एकमेव अडचण आहे, आणि डावीकडून उजवीकडे केल्यास f(2) = 4 मग g(4) = 5 मिळते, जे (g ∘ f)(2) आहे — पूर्णपणे वेगळे फलन. संयोजन क्रमविनिमेय नाही, हेच ही दोन्ही उत्तरे दाखवतात. (5 संयोजन चुकीच्या क्रमाने काढते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "How many onto functions are there from a set of 3 elements to a set of 2 elements?",
          hi: "3 अवयवों के समुच्चय से 2 अवयवों के समुच्चय तक कितने आच्छादक फलन हैं?",
          mr: "3 घटकांच्या संचापासून 2 घटकांच्या संचापर्यंत किती आच्छादक फलने आहेत?",
        },
        answer: 6,
        wrong: [8, 2, 9],
        checkExpr: "8-2",
        solution: {
          en: "There are 2³ = 8 functions altogether. Of these, exactly two fail to be onto: the one sending everything to the first image and the one sending everything to the second. So 8 − 2 = 6. Counting what fails and subtracting is much easier here than counting the successes directly, and it is the standard move whenever a condition is easier to violate than to satisfy. (8 counts all functions without removing the two constant ones.)",
          hi: "कुल 2³ = 8 फलन हैं। इनमें से ठीक दो आच्छादक नहीं: एक जो सब कुछ पहले प्रतिबिंब को भेजता है और एक जो सब कुछ दूसरे को। अतः 8 − 2 = 6. यहाँ जो विफल होता है उसे गिनकर घटाना सीधे सफलताएँ गिनने से कहीं आसान है, और जब भी कोई शर्त पूरी करने से तोड़ना आसान हो तब यही मानक चाल है। (8 दोनों अचर फलन हटाए बिना सारे फलन गिनता है।)",
          mr: "एकूण 2³ = 8 फलने आहेत. यांपैकी नेमकी दोन आच्छादक नाहीत: एक जे सर्व काही पहिल्या प्रतिबिंबाला पाठवते आणि एक जे सर्व काही दुसऱ्याला. म्हणून 8 − 2 = 6. इथे जे अपयशी ठरते ते मोजून वजा करणे थेट यशे मोजण्याहून कितीतरी सोपे आहे, आणि जेव्हाही एखादी अट पूर्ण करण्याहून मोडणे सोपे असेल तेव्हा हीच प्रमाणित चाल आहे. (8 दोन्ही अचल फलने काढल्याविना सर्व फलने मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "If f(x) = 3x − 5, what is f⁻¹(7)?",
          hi: "यदि f(x) = 3x − 5 हो, तो f⁻¹(7) क्या है?",
          mr: "जर f(x) = 3x − 5 असेल, तर f⁻¹(7) किती?",
        },
        answer: 4,
        wrong: [16, 2, 0.25],
        checkExpr: "(7+5)/3",
        solution: {
          en: "Asking for f⁻¹(7) is asking which input gives 7, so solve 3x − 5 = 7: x = (7 + 5)/3 = 4. Check it forwards — 3 × 4 − 5 = 7 — and the answer is proven rather than trusted. Note that f⁻¹ here means the inverse function and not the reciprocal; 1/f(7) would be 1/16, which is why that option is offered. (16 evaluates f(7) instead of inverting it.)",
          hi: "f⁻¹(7) पूछना यह पूछना है कि कौन-सा निवेश 7 देता है, अतः 3x − 5 = 7 हल करो: x = (7 + 5)/3 = 4. आगे की ओर जाँचो — 3 × 4 − 5 = 7 — और उत्तर भरोसे पर नहीं बल्कि सिद्ध होकर मिलता है। ध्यान दो कि यहाँ f⁻¹ का अर्थ प्रतिलोम फलन है, व्युत्क्रम नहीं; 1/f(7) होता 1/16, इसीलिए वह विकल्प दिया गया है। (16 प्रतिलोम निकालने के बजाय f(7) निकाल देता है।)",
          mr: "f⁻¹(7) विचारणे म्हणजे कोणते निविष्ट 7 देते हे विचारणे, म्हणून 3x − 5 = 7 सोडवा: x = (7 + 5)/3 = 4. पुढच्या दिशेने तपासा — 3 × 4 − 5 = 7 — आणि उत्तर भरवशावर नव्हे तर सिद्ध होऊन मिळते. लक्षात घ्या की इथे f⁻¹ चा अर्थ प्रतिलोम फलन आहे, व्यस्त नाही; 1/f(7) असते 1/16, म्हणूनच तो पर्याय दिला आहे. (16 प्रतिलोम काढण्याऐवजी f(7) काढते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "How many bijections are there from a set of 4 elements to itself?",
          hi: "4 अवयवों के किसी समुच्चय से स्वयं उसी तक कितने एकैकी आच्छादक फलन हैं?",
          mr: "4 घटकांच्या एका संचापासून स्वतः त्याच्यापर्यंत किती एकैकी आच्छादक फलने आहेत?",
        },
        answer: 24,
        wrong: [256, 16, 12],
        checkExpr: "4*3*2*1",
        solution: {
          en: "4 × 3 × 2 × 1 = 24. A bijection from a finite set to itself is exactly a rearrangement of its elements, so the count is 4 factorial. Note that on a finite set of the same size, one-one and onto imply each other — if no two elements share an image and there are as many images as elements, every image must be used. That equivalence fails for infinite sets, which is one of the ways infinity behaves unlike anything in this chapter. (256 counts all functions, most of which repeat an image.)",
          hi: "4 × 3 × 2 × 1 = 24. किसी परिमित समुच्चय से स्वयं उसी तक एकैकी आच्छादक फलन ठीक उसके अवयवों की पुनर्व्यवस्था है, अतः गिनती 4 का क्रमगुणित है। ध्यान दो कि समान आकार के परिमित समुच्चय पर एकैकी और आच्छादक एक-दूसरे को निहित करते हैं — यदि कोई दो अवयव प्रतिबिंब साझा न करें और प्रतिबिंब अवयवों जितने ही हों, तो हर प्रतिबिंब काम में आना ही चाहिए। वह तुल्यता अनंत समुच्चयों के लिए विफल हो जाती है, और यह उन तरीक़ों में से एक है जिनसे अनंत इस अध्याय की किसी भी चीज़ जैसा नहीं बरतता। (256 सारे फलन गिनता है, जिनमें से अधिकांश कोई प्रतिबिंब दोहराते हैं।)",
          mr: "4 × 3 × 2 × 1 = 24. एखाद्या सांत संचापासून स्वतः त्याच्यापर्यंत एकैकी आच्छादक फलन म्हणजे नेमकी त्याच्या घटकांची पुनर्रचना, म्हणून मोजणी 4 चा क्रमगुणित आहे. लक्षात घ्या की समान आकाराच्या सांत संचावर एकैकी आणि आच्छादक परस्परांना अनुस्यूत करतात — जर कोणतेही दोन घटक प्रतिबिंब समाईक ठेवत नसतील आणि प्रतिबिंबे घटकांइतकीच असतील, तर प्रत्येक प्रतिबिंब वापरले जावेच लागते. ती तुल्यता अनंत संचांसाठी अपयशी ठरते, आणि हा त्या मार्गांपैकी एक आहे ज्यांनी अनंत या प्रकरणातल्या कोणत्याही गोष्टीसारखे वागत नाही. (256 सर्व फलने मोजते, ज्यांपैकी बहुतांश एखादे प्रतिबिंब पुनरावृत्त करतात.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "How many symmetric relations are there on a set of 3 elements?",
          hi: "3 अवयवों के किसी समुच्चय पर कितने सममित संबंध हैं?",
          mr: "3 घटकांच्या एका संचावर किती सममित संबंध आहेत?",
        },
        answer: 64,
        wrong: [512, 8, 32],
        checkExpr: "8*8",
        solution: {
          en: "Symmetry means (a, b) is present exactly when (b, a) is, so the two pairs of an off-diagonal couple are not decided separately — they are one decision. There are 3 diagonal pairs, each free, and 3 off-diagonal couples, each one decision: 2⁶ = 8 × 8 = 64. The move worth learning is that a constraint does not merely remove options; here it merges them, so the exponent falls from 9 to 6 rather than the total being scaled down. (512 counts all relations, ignoring the constraint.)",
          hi: "सममिति का अर्थ है (a, b) ठीक तब मौजूद है जब (b, a) हो, अतः किसी विकर्णेतर जोड़े के दोनों युग्म अलग-अलग तय नहीं होते — वे एक ही निर्णय हैं। 3 विकर्ण युग्म हैं, हर एक स्वतंत्र, और 3 विकर्णेतर जोड़े, हर एक एक निर्णय: 2⁶ = 8 × 8 = 64. सीखने लायक़ चाल यह कि कोई प्रतिबंध केवल विकल्प हटाता नहीं; यहाँ वह उन्हें मिला देता है, अतः घातांक 9 से 6 पर गिरता है, कुल का पैमाना घटने के बजाय। (512 प्रतिबंध की अनदेखी कर सारे संबंध गिनता है।)",
          mr: "सममिती म्हणजे (a, b) नेमके तेव्हा उपस्थित आहे जेव्हा (b, a) असेल, म्हणून एखाद्या विकर्णेतर जोडप्याच्या दोन्ही जोड्या वेगवेगळ्या ठरत नाहीत — त्या एकच निर्णय आहेत. 3 विकर्ण जोड्या आहेत, प्रत्येक मुक्त, आणि 3 विकर्णेतर जोडपी, प्रत्येक एक निर्णय: 2⁶ = 8 × 8 = 64. शिकण्याजोगी चाल ही की एखादे बंधन केवळ पर्याय काढत नाही; इथे ते त्यांना एकत्र करते, म्हणून घातांक 9 वरून 6 वर घसरतो, एकूणाचे प्रमाण घटण्याऐवजी. (512 बंधनाकडे दुर्लक्ष करून सर्व संबंध मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "How many relations on a set of 3 elements are both reflexive and symmetric?",
          hi: "3 अवयवों के किसी समुच्चय पर कितने संबंध स्वतुल्य और सममित दोनों हैं?",
          mr: "3 घटकांच्या एका संचावर किती संबंध स्वतुल्य आणि सममित दोन्ही आहेत?",
        },
        answer: 8,
        wrong: [64, 512, 5],
        checkExpr: "2*2*2",
        solution: {
          en: "Take the two conditions in turn and see what each one costs. Reflexivity fixes the three diagonal pairs: they must all be present, so there is no decision left there at all. Symmetry ties each off-diagonal pair to its mirror, so the three couples give three decisions rather than six. Nothing is free except those three couples: 2³ = 2 × 2 × 2 = 8. It is worth comparing the whole family. All relations: 2⁹ = 512. Symmetric alone: 2⁶ = 64. Reflexive and symmetric: 2³ = 8. Each condition cuts the exponent rather than the total, because each one removes or merges decisions rather than filtering finished objects. And notice the equivalence relations — 5 — are fewer still, since transitivity is not a condition on individual pairs at all but on triples, which is exactly why it cannot be counted by the same method and has to be handled through partitions instead. (64 imposes symmetry but forgets that reflexivity has already used up the diagonal.)",
          hi: "दोनों शर्तें बारी-बारी लो और देखो कि हर एक की क़ीमत क्या है। स्वतुल्यता तीनों विकर्ण युग्म तय कर देती है: वे सब मौजूद होने ही चाहिए, अतः वहाँ कोई निर्णय बचता ही नहीं। सममिति हर विकर्णेतर युग्म को उसके दर्पण से बाँध देती है, अतः तीन जोड़े छह के बजाय तीन निर्णय देते हैं। उन तीन जोड़ों के सिवा कुछ स्वतंत्र नहीं: 2³ = 2 × 2 × 2 = 8. पूरे कुल की तुलना करना काम का है। सारे संबंध: 2⁹ = 512. केवल सममित: 2⁶ = 64. स्वतुल्य और सममित: 2³ = 8. हर शर्त कुल के बजाय घातांक काटती है, क्योंकि हर एक बने-बनाए वस्तुओं को छानने के बजाय निर्णय हटाती या मिलाती है। और ध्यान दो कि तुल्यता संबंध — 5 — और भी कम हैं, चूँकि संक्रामकता अलग-अलग युग्मों पर शर्त है ही नहीं बल्कि त्रिकों पर, और ठीक इसीलिए उसे इसी विधि से गिना नहीं जा सकता और उसे विभाजनों के रास्ते सँभालना पड़ता है। (64 सममिति लगाता है पर भूल जाता है कि स्वतुल्यता विकर्ण पहले ही ख़र्च कर चुकी है।)",
          mr: "दोन्ही अटी आळीपाळीने घ्या आणि प्रत्येकीची किंमत काय आहे ते पाहा. स्वतुल्यता तिन्ही विकर्ण जोड्या ठरवते: त्या सर्व उपस्थित असल्याच पाहिजेत, म्हणून तिथे कोणताही निर्णय उरतच नाही. सममिती प्रत्येक विकर्णेतर जोडीला तिच्या आरशाशी बांधते, म्हणून तीन जोडपी सहाऐवजी तीन निर्णय देतात. त्या तीन जोडप्यांखेरीज काहीही मुक्त नाही: 2³ = 2 × 2 × 2 = 8. अख्ख्या कुळाची तुलना करणे उपयुक्त आहे. सर्व संबंध: 2⁹ = 512. केवळ सममित: 2⁶ = 64. स्वतुल्य आणि सममित: 2³ = 8. प्रत्येक अट एकूणाऐवजी घातांक कापते, कारण प्रत्येक तयार वस्तू गाळण्याऐवजी निर्णय काढते वा एकत्र करते. आणि लक्षात घ्या की तुल्यता संबंध — 5 — आणखी कमी आहेत, कारण संक्रामकता वेगवेगळ्या जोड्यांवरची अट आहेच नाही तर त्रिकांवरची, आणि नेमके म्हणूनच तिला याच पद्धतीने मोजता येत नाही आणि तिला विभाजनांच्या मार्गाने हाताळावे लागते. (64 सममिती लावते पण विसरते की स्वतुल्यतेने विकर्ण आधीच खर्च केला आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "How many equivalence relations are there on a set of 4 elements?",
          hi: "4 अवयवों के किसी समुच्चय पर कितने तुल्यता संबंध हैं?",
          mr: "4 घटकांच्या एका संचावर किती तुल्यता संबंध आहेत?",
        },
        answer: 15,
        wrong: [24, 5, 16],
        checkExpr: "5+10",
        solution: {
          en: "Count the partitions of a four-element set, since each corresponds to exactly one equivalence relation. Take them by shape. All four in one block: 1 way. Three together and one apart: 4 ways, one for each element left out. Two and two: 3 ways, since choosing the partner of the first element determines the rest. Two together and two apart: 6 ways, one for each pair. All four separate: 1 way. That is 1 + 4 + 3 + 6 + 1 = 5 + 10 = 15. Two things are worth taking from this. First, the correspondence between equivalence relations and partitions is what makes the count tractable at all — attempting it directly by checking which of the 2¹⁶ relations on four elements are reflexive, symmetric and transitive would be hopeless. Second, organising the count by SHAPE rather than by element is what prevents double-counting: each partition is described once, by its block sizes, and the ways of achieving that shape are counted separately. The sequence of these counts — 1, 2, 5, 15, 52 — are the Bell numbers, and they grow faster than any polynomial. (24 gives 4 factorial, which counts rearrangements rather than groupings.)",
          hi: "चार अवयवों के समुच्चय के विभाजन गिनो, चूँकि हर एक ठीक एक तुल्यता संबंध से मेल खाता है। उन्हें आकार से लो। चारों एक खंड में: 1 तरीक़ा। तीन साथ और एक अलग: 4 तरीक़े, हर बाहर छूटे अवयव के लिए एक। दो और दो: 3 तरीक़े, चूँकि पहले अवयव का साथी चुनना बाक़ी तय कर देता है। दो साथ और दो अलग: 6 तरीक़े, हर युग्म के लिए एक। चारों अलग: 1 तरीक़ा। यह हुआ 1 + 4 + 3 + 6 + 1 = 5 + 10 = 15. इससे दो चीज़ें ले जाने लायक़ हैं। पहली, तुल्यता संबंधों और विभाजनों की वह संगति ही गिनती को साध्य बनाती है — चार अवयवों पर 2¹⁶ संबंधों में से कौन स्वतुल्य, सममित और संक्रामक हैं यह जाँचकर सीधे कोशिश करना निराशाजनक होता। दूसरी, गिनती को अवयव से नहीं बल्कि आकार से जमाना ही दोहरी गिनती रोकता है: हर विभाजन एक ही बार वर्णित होता है, अपने खंड आकारों से, और उस आकार को पाने के तरीक़े अलग गिने जाते हैं। इन गिनतियों का अनुक्रम — 1, 2, 5, 15, 52 — बेल संख्याएँ हैं, और वे किसी भी बहुपद से तेज़ बढ़ती हैं। (24 4 का क्रमगुणित देता है, जो समूहन नहीं बल्कि पुनर्व्यवस्थाएँ गिनता है।)",
          mr: "चार घटकांच्या संचाची विभाजने मोजा, कारण प्रत्येक नेमक्या एका तुल्यता संबंधाशी जुळते. त्यांना आकाराने घ्या. चारही एका गटात: 1 मार्ग. तीन एकत्र आणि एक वेगळा: 4 मार्ग, प्रत्येक बाहेर उरलेल्या घटकासाठी एक. दोन आणि दोन: 3 मार्ग, कारण पहिल्या घटकाचा जोडीदार निवडणे बाकीचे ठरवते. दोन एकत्र आणि दोन वेगळे: 6 मार्ग, प्रत्येक जोडीसाठी एक. चारही वेगळे: 1 मार्ग. हे झाले 1 + 4 + 3 + 6 + 1 = 5 + 10 = 15. यातून दोन गोष्टी न्यायच्या आहेत. पहिली, तुल्यता संबंध आणि विभाजनांची तीच संगती मोजणीला साध्य बनवते — चार घटकांवरच्या 2¹⁶ संबंधांपैकी कोणते स्वतुल्य, सममित आणि संक्रामक आहेत हे तपासून थेट प्रयत्न करणे निराशाजनक ठरले असते. दुसरी, मोजणी घटकाने नव्हे तर आकाराने मांडणेच दुहेरी मोजणी रोखते: प्रत्येक विभाजन एकदाच वर्णिले जाते, आपल्या गट आकारांनी, आणि तो आकार मिळवण्याचे मार्ग वेगळे मोजले जातात. या मोजण्यांचा क्रम — 1, 2, 5, 15, 52 — बेल संख्या आहेत, आणि त्या कोणत्याही बहुपदीहून वेगाने वाढतात. (24 4 चा क्रमगुणित देते, जो गटबंधन नव्हे तर पुनर्रचना मोजते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-relations-and-functions",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 1 — Relations and Functions",
      name: "Relations and Functions",
      summary:
        "A mapping classified rather than evaluated: what reflexive, symmetric and transitive each cost when you count how many relations survive them, why an equivalence relation is the same object as a partition, and how composing two functions in the other order gives a different function altogether.",
      position: 1,
      translations: {
        hi: {
          name: "संबंध एवं फलन",
          summary:
            "किसी प्रतिचित्रण का मूल्यांकन नहीं बल्कि वर्गीकरण: जब गिनो कि कितने संबंध बचते हैं तो स्वतुल्य, सममित और संक्रामक हर एक की क़ीमत क्या है, तुल्यता संबंध विभाजन जैसी ही वस्तु क्यों है, और दो फलनों को उलटे क्रम में जोड़ने पर बिलकुल भिन्न फलन कैसे मिलता है।",
        },
        mr: {
          name: "संबंध आणि फलने",
          summary:
            "एखाद्या प्रतिचित्रणाचे मूल्यमापन नव्हे तर वर्गीकरण: किती संबंध टिकतात हे मोजल्यावर स्वतुल्य, सममित आणि संक्रामक प्रत्येकाची किंमत काय आहे, तुल्यता संबंध विभाजनासारखीच वस्तू का आहे, आणि दोन फलने उलट क्रमाने जोडल्यावर पूर्णपणे वेगळे फलन कसे मिळते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 2 — Inverse Trigonometric Functions (choosing one answer of many) */
/* ------------------------------------------------------------------------- */
function inverseTrig12(): TopicFileOut {
  const rand = rng("maths-12-inverse-trigonometric-functions");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the principal value of sin⁻¹(1), in degrees?",
          hi: "sin⁻¹(1) का मुख्य मान, अंशों में, क्या है?",
          mr: "sin⁻¹(1) चे मुख्य मूल्य, अंशांत, किती?",
        },
        answer: 90,
        wrong: [0, 180, 45],
        checkExpr: "90*1",
        solution: {
          en: "sin 90° = 1, and 90° lies in the principal range of sin⁻¹, which runs from −90° to 90°. Infinitely many angles have a sine of 1 — 450°, 810° and so on — so a range has to be fixed by convention or the inverse would not be a function at all. That is the whole reason principal values exist. (0 gives the angle whose sine is 0.)",
          hi: "sin 90° = 1, और 90° sin⁻¹ के मुख्य परास में पड़ता है, जो −90° से 90° तक चलता है। अनंत कोणों की ज्या 1 है — 450°, 810° और आगे — अतः परिपाटी से कोई परास तय करना ही पड़ता है वरना प्रतिलोम फलन ही नहीं होता। मुख्य मानों के होने का पूरा कारण यही है। (0 उस कोण को देता है जिसकी ज्या 0 है।)",
          mr: "sin 90° = 1, आणि 90° हे sin⁻¹ च्या मुख्य व्याप्तीत पडते, जी −90° पासून 90° पर्यंत चालते. अनंत कोनांची ज्या 1 आहे — 450°, 810° आणि पुढे — म्हणून संकेताने एखादी व्याप्ती ठरवावीच लागते नाहीतर प्रतिलोम फलनच होणार नाही. मुख्य मूल्ये असण्याचे अख्खे कारण हेच आहे. (0 तो कोन देते ज्याची ज्या 0 आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The principal range of cos⁻¹ runs from 0° to what upper limit, in degrees?",
          hi: "cos⁻¹ का मुख्य परास 0° से किस ऊपरी सीमा तक चलता है, अंशों में?",
          mr: "cos⁻¹ ची मुख्य व्याप्ती 0° पासून कोणत्या वरच्या मर्यादेपर्यंत चालते, अंशांत?",
        },
        answer: 180,
        wrong: [90, 360, 270],
        checkExpr: "90*2",
        solution: {
          en: "90 × 2 = 180°. The range is chosen so that cosine takes every value from −1 to 1 exactly once across it, which is what makes the inverse single-valued. Note it differs from the range of sin⁻¹: cosine is decreasing on 0° to 180° and sine is increasing on −90° to 90°, and each interval is picked because the function is one-one there. (90 gives the sine range's upper limit instead.)",
          hi: "90 × 2 = 180°. परास ऐसे चुना गया है कि कोज्या उसमें −1 से 1 तक का हर मान ठीक एक बार ले, और यही प्रतिलोम को एकमानी बनाता है। ध्यान दो कि वह sin⁻¹ के परास से भिन्न है: कोज्या 0° से 180° पर घटती है और ज्या −90° से 90° पर बढ़ती है, और हर अंतराल इसलिए चुना गया कि फलन वहाँ एकैकी है। (90 इसके बजाय ज्या परास की ऊपरी सीमा देता है।)",
          mr: "90 × 2 = 180°. व्याप्ती अशी निवडली आहे की कोज्या तिच्यात −1 पासून 1 पर्यंतचे प्रत्येक मूल्य नेमके एकदा घ्यावी, आणि हेच प्रतिलोमाला एकमूल्यी बनवते. लक्षात घ्या की ती sin⁻¹ च्या व्याप्तीहून वेगळी आहे: कोज्या 0° ते 180° वर घटते आणि ज्या −90° ते 90° वर वाढते, आणि प्रत्येक अंतराल यासाठी निवडले की फलन तिथे एकैकी आहे. (90 त्याऐवजी ज्या व्याप्तीची वरची मर्यादा देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the principal value of sin⁻¹(1/2), in degrees?",
          hi: "sin⁻¹(1/2) का मुख्य मान, अंशों में, क्या है?",
          mr: "sin⁻¹(1/2) चे मुख्य मूल्य, अंशांत, किती?",
        },
        answer: 30,
        wrong: [60, 150, 45],
        checkExpr: "60/2",
        solution: {
          en: "60/2 = 30°, since sin 30° = 1/2. The angle 150° also has a sine of 1/2 but lies outside the principal range of −90° to 90°, so it is not the principal value. Confusing 30° with 60° is the standard slip: sin 30° = 1/2 while cos 30° is the larger value, and it is worth fixing which of the pair goes with which function. (60 gives the angle whose cosine is 1/2.)",
          hi: "60/2 = 30°, चूँकि sin 30° = 1/2. कोण 150° की ज्या भी 1/2 है पर वह −90° से 90° के मुख्य परास से बाहर पड़ता है, अतः वह मुख्य मान नहीं। 30° को 60° से गड्डमड्ड करना मानक चूक है: sin 30° = 1/2 जबकि cos 30° बड़ा मान है, और युग्म में से कौन-सा किस फलन के साथ जाता है यह तय कर लेना काम का है। (60 उस कोण को देता है जिसकी कोज्या 1/2 है।)",
          mr: "60/2 = 30°, कारण sin 30° = 1/2. कोन 150° चीही ज्या 1/2 आहे पण तो −90° ते 90° च्या मुख्य व्याप्तीबाहेर पडतो, म्हणून तो मुख्य मूल्य नाही. 30° ची 60° शी गल्लत करणे ही प्रमाणित चूक आहे: sin 30° = 1/2 तर cos 30° हे मोठे मूल्य आहे, आणि जोडीतले कोणते कोणत्या फलनासोबत जाते हे ठरवून घेणे उपयुक्त आहे. (60 तो कोन देते ज्याची कोज्या 1/2 आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the principal value of tan⁻¹(1), in degrees?",
          hi: "tan⁻¹(1) का मुख्य मान, अंशों में, क्या है?",
          mr: "tan⁻¹(1) चे मुख्य मूल्य, अंशांत, किती?",
        },
        answer: 45,
        wrong: [225, 90, 30],
        checkExpr: "90/2",
        solution: {
          en: "90/2 = 45°, since tan 45° = 1. The principal range of tan⁻¹ is −90° to 90°, open at both ends because the tangent is undefined there, so 225° — which also has a tangent of 1 — is excluded. Note the range is an open interval for tan⁻¹ and a closed one for sin⁻¹, and the reason is the behaviour of the function at the endpoints. (225 gives an angle with the same tangent but outside the range.)",
          hi: "90/2 = 45°, चूँकि tan 45° = 1. tan⁻¹ का मुख्य परास −90° से 90° है, दोनों सिरों पर खुला क्योंकि वहाँ स्पर्शज्या अपरिभाषित है, अतः 225° — जिसकी स्पर्शज्या भी 1 है — बाहर है। ध्यान दो कि परास tan⁻¹ के लिए खुला अंतराल है और sin⁻¹ के लिए बंद, और कारण सिरों पर फलन का बरताव है। (225 वही स्पर्शज्या वाला पर परास से बाहर का कोण देता है।)",
          mr: "90/2 = 45°, कारण tan 45° = 1. tan⁻¹ ची मुख्य व्याप्ती −90° ते 90° आहे, दोन्ही टोकांना उघडी कारण तिथे स्पर्शज्या अपरिभाषित आहे, म्हणून 225° — ज्याची स्पर्शज्याही 1 आहे — बाहेर आहे. लक्षात घ्या की व्याप्ती tan⁻¹ साठी उघडे अंतराल आहे आणि sin⁻¹ साठी बंद, आणि कारण टोकांवरचे फलनाचे वर्तन आहे. (225 तीच स्पर्शज्या असलेला पण व्याप्तीबाहेरचा कोन देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "For any valid x, what does sin⁻¹x + cos⁻¹x equal, in degrees?",
          hi: "किसी भी वैध x के लिए sin⁻¹x + cos⁻¹x किसके बराबर है, अंशों में?",
          mr: "कोणत्याही वैध x साठी sin⁻¹x + cos⁻¹x कशाबरोबर आहे, अंशांत?",
        },
        answer: 90,
        wrong: [180, 45, 360],
        checkExpr: "45*2",
        solution: {
          en: "45 × 2 = 90°, and the identity holds for every x from −1 to 1. The reason is that if sin θ = x then cos(90° − θ) = x as well, so the two inverse values are complementary angles. Being able to state a fact that holds for all x, rather than checking one value at a time, is what makes an identity worth having. (180 doubles the correct value.)",
          hi: "45 × 2 = 90°, और यह सर्वसमिका −1 से 1 तक के हर x के लिए टिकती है। कारण यह कि यदि sin θ = x हो तो cos(90° − θ) = x भी होता है, अतः दोनों प्रतिलोम मान पूरक कोण हैं। ऐसा तथ्य कह पाना जो हर x के लिए टिके, बजाय एक-एक मान जाँचने के, यही किसी सर्वसमिका को रखने लायक़ बनाता है। (180 सही मान दुगुना कर देता है।)",
          mr: "45 × 2 = 90°, आणि ही एकात्मता −1 पासून 1 पर्यंतच्या प्रत्येक x साठी टिकते. कारण हे की जर sin θ = x असेल तर cos(90° − θ) = x देखील होते, म्हणून दोन्ही प्रतिलोम मूल्ये पूरक कोन आहेत. असे सत्य सांगू शकणे जे प्रत्येक x साठी टिकेल, एकेक मूल्य तपासण्याऐवजी, हेच एखाद्या एकात्मतेला ठेवण्याजोगे बनवते. (180 बरोबर मूल्य दुप्पट करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the principal value of cos⁻¹(−1), in degrees?",
          hi: "cos⁻¹(−1) का मुख्य मान, अंशों में, क्या है?",
          mr: "cos⁻¹(−1) चे मुख्य मूल्य, अंशांत, किती?",
        },
        answer: 180,
        wrong: [0, 360, 90],
        checkExpr: "90+90",
        solution: {
          en: "90 + 90 = 180°, since cos 180° = −1 and 180° is the top of the principal range. Note that cos⁻¹ of a negative number gives an obtuse angle, whereas sin⁻¹ of a negative number gives a negative angle — the two inverses treat negative inputs quite differently because their ranges sit in different places. (0 gives the angle whose cosine is +1.)",
          hi: "90 + 90 = 180°, चूँकि cos 180° = −1 और 180° मुख्य परास का शीर्ष है। ध्यान दो कि किसी ऋण संख्या का cos⁻¹ अधिक कोण देता है, जबकि किसी ऋण संख्या का sin⁻¹ ऋण कोण देता है — दोनों प्रतिलोम ऋण निवेशों से काफ़ी भिन्न बरताव करते हैं क्योंकि उनके परास भिन्न जगहों पर बैठे हैं। (0 उस कोण को देता है जिसकी कोज्या +1 है।)",
          mr: "90 + 90 = 180°, कारण cos 180° = −1 आणि 180° मुख्य व्याप्तीचा शिखर आहे. लक्षात घ्या की एखाद्या ऋण संख्येचा cos⁻¹ विशाल कोन देतो, तर एखाद्या ऋण संख्येचा sin⁻¹ ऋण कोन देतो — दोन्ही प्रतिलोम ऋण निविष्टांशी बरेच वेगळे वागतात कारण त्यांच्या व्याप्ती वेगळ्या जागी बसल्या आहेत. (0 तो कोन देते ज्याची कोज्या +1 आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the principal value of sin⁻¹(−1/2), in degrees?",
          hi: "sin⁻¹(−1/2) का मुख्य मान, अंशों में, क्या है?",
          mr: "sin⁻¹(−1/2) चे मुख्य मूल्य, अंशांत, किती?",
        },
        answer: -30,
        wrong: [210, 330, 150],
        checkExpr: "0-30",
        solution: {
          en: "0 − 30 = −30°, since sin(−30°) = −1/2 and −30° lies in the principal range. Both 210° and 330° also have a sine of −1/2, and both are outside the range, which is why neither is the principal value. The general rule is worth stating: sin⁻¹(−x) = −sin⁻¹(x), because the range is symmetric about zero. That is not true of cos⁻¹, whose range is not. (210 gives an angle with the right sine but outside the range.)",
          hi: "0 − 30 = −30°, चूँकि sin(−30°) = −1/2 और −30° मुख्य परास में पड़ता है। 210° और 330° दोनों की ज्या भी −1/2 है, और दोनों परास से बाहर हैं, इसीलिए कोई भी मुख्य मान नहीं। सामान्य नियम कहने लायक़ है: sin⁻¹(−x) = −sin⁻¹(x), क्योंकि परास शून्य के परितः सममित है। cos⁻¹ के बारे में यह सच नहीं, जिसका परास नहीं है। (210 सही ज्या वाला पर परास से बाहर का कोण देता है।)",
          mr: "0 − 30 = −30°, कारण sin(−30°) = −1/2 आणि −30° मुख्य व्याप्तीत पडते. 210° आणि 330° दोघांचीही ज्या −1/2 आहे, आणि दोन्ही व्याप्तीबाहेर आहेत, म्हणूनच कोणतेही मुख्य मूल्य नाही. सर्वसाधारण नियम सांगण्याजोगा आहे: sin⁻¹(−x) = −sin⁻¹(x), कारण व्याप्ती शून्याभोवती सममित आहे. cos⁻¹ बाबत हे खरे नाही, जिची व्याप्ती नाही. (210 बरोबर ज्या असलेला पण व्याप्तीबाहेरचा कोन देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the principal value of sec⁻¹(2), in degrees?",
          hi: "sec⁻¹(2) का मुख्य मान, अंशों में, क्या है?",
          mr: "sec⁻¹(2) चे मुख्य मूल्य, अंशांत, किती?",
        },
        answer: 60,
        wrong: [30, 120, 45],
        checkExpr: "120/2",
        solution: {
          en: "120/2 = 60°. Secant is the reciprocal of cosine, so sec θ = 2 means cos θ = 1/2, which gives θ = 60°. Converting to cosine first is almost always the right move with sec⁻¹, because the cosine values are the ones anybody has memorised. Note also that sec⁻¹ is defined only for inputs of absolute value at least 1, since a cosine can never exceed 1 and so its reciprocal can never be smaller. (30 gives the angle whose cosine is 2 minus something, taking the reciprocal on the wrong side.)",
          hi: "120/2 = 60°. छेदज्या कोज्या का व्युत्क्रम है, अतः sec θ = 2 का अर्थ cos θ = 1/2 है, जो θ = 60° देता है। sec⁻¹ के साथ पहले कोज्या में बदलना लगभग हमेशा सही चाल है, क्योंकि कोज्या के मान ही वे हैं जो किसी को याद हैं। यह भी ध्यान दो कि sec⁻¹ केवल उन निवेशों के लिए परिभाषित है जिनका निरपेक्ष मान कम से कम 1 हो, चूँकि कोज्या कभी 1 से अधिक नहीं हो सकती और इसलिए उसका व्युत्क्रम कभी छोटा नहीं हो सकता। (30 व्युत्क्रम को ग़लत ओर लेकर ग़लत कोण देता है।)",
          mr: "120/2 = 60°. छेदज्या ही कोज्येची व्यस्त आहे, म्हणून sec θ = 2 चा अर्थ cos θ = 1/2 आहे, जे θ = 60° देते. sec⁻¹ सोबत आधी कोज्येत बदलणे जवळपास नेहमी योग्य चाल आहे, कारण कोज्येची मूल्येच ती आहेत जी कोणाच्या लक्षात असतात. हेही लक्षात घ्या की sec⁻¹ केवळ त्या निविष्टांसाठी परिभाषित आहे ज्यांचे निरपेक्ष मूल्य किमान 1 असेल, कारण कोज्या कधीही 1 हून अधिक होऊ शकत नाही आणि म्हणून तिची व्यस्त कधीही लहान होऊ शकत नाही. (30 व्यस्त चुकीच्या बाजूने घेऊन चुकीचा कोन देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is sin⁻¹(sin 150°), in degrees?",
          hi: "sin⁻¹(sin 150°), अंशों में, क्या है?",
          mr: "sin⁻¹(sin 150°), अंशांत, किती?",
        },
        answer: 30,
        wrong: [150, -30, 180],
        checkExpr: "180-150",
        solution: {
          en: "180 − 150 = 30°. The tempting answer is 150°, on the grounds that the two operations cancel — but they only cancel when the angle already lies in the principal range, and 150° does not. Work it through: sin 150° = 1/2, and the angle in −90° to 90° whose sine is 1/2 is 30°. So sin⁻¹(sin θ) returns θ only for θ in the principal range, and otherwise returns whatever angle in that range has the same sine. This asymmetry is the whole content of the question. (150 assumes the operations cancel unconditionally.)",
          hi: "180 − 150 = 30°. लुभाने वाला उत्तर 150° है, इस आधार पर कि दोनों संक्रियाएँ कट जाती हैं — पर वे तभी कटती हैं जब कोण पहले से मुख्य परास में हो, और 150° नहीं है। हल करो: sin 150° = 1/2, और −90° से 90° में जिस कोण की ज्या 1/2 है वह 30° है। अतः sin⁻¹(sin θ) केवल उसी θ के लिए θ लौटाता है जो मुख्य परास में हो, और अन्यथा उस परास का वह कोण लौटाता है जिसकी वही ज्या है। यही विषमता प्रश्न का पूरा सार है। (150 मान लेता है कि संक्रियाएँ बिना शर्त कट जाती हैं।)",
          mr: "180 − 150 = 30°. मोहवणारे उत्तर 150° आहे, या आधारावर की दोन्ही क्रिया रद्द होतात — पण त्या तेव्हाच रद्द होतात जेव्हा कोन आधीच मुख्य व्याप्तीत असेल, आणि 150° नाही. सोडवा: sin 150° = 1/2, आणि −90° ते 90° मध्ये ज्या कोनाची ज्या 1/2 आहे तो 30° आहे. म्हणून sin⁻¹(sin θ) केवळ त्याच θ साठी θ परत करते जो मुख्य व्याप्तीत असेल, आणि अन्यथा त्या व्याप्तीतला तो कोन परत करते ज्याची तीच ज्या आहे. हीच विषमता प्रश्नाचा अख्खा सार आहे. (150 गृहीत धरते की क्रिया बिनशर्त रद्द होतात.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "What is cos⁻¹(cos 300°), in degrees?",
          hi: "cos⁻¹(cos 300°), अंशों में, क्या है?",
          mr: "cos⁻¹(cos 300°), अंशांत, किती?",
        },
        answer: 60,
        wrong: [300, -60, 240],
        checkExpr: "360-300",
        solution: {
          en: "360 − 300 = 60°. As before the operations do not simply cancel, because 300° is outside the principal range of 0° to 180°. Since cos 300° = cos 60° = 1/2, and 60° is in the range, that is the answer. Note the rule differs from the sine case: here the reflection is about 360° rather than 180°, because cosine is even and repeats about the horizontal axis. The safe method is always the same — evaluate the inner function, then find the angle in the correct range with that value. (300 assumes cancellation without checking the range.)",
          hi: "360 − 300 = 60°. पहले की तरह संक्रियाएँ बस कट नहीं जातीं, क्योंकि 300° मुख्य परास 0° से 180° के बाहर है। चूँकि cos 300° = cos 60° = 1/2, और 60° परास में है, वही उत्तर है। ध्यान दो कि नियम ज्या वाले मामले से भिन्न है: यहाँ परावर्तन 180° के बजाय 360° के परितः है, क्योंकि कोज्या सम है और क्षैतिज अक्ष के परितः दोहराती है। सुरक्षित विधि हमेशा वही है — भीतरी फलन निकालो, फिर सही परास में उस मान वाला कोण ढूँढ़ो। (300 परास जाँचे बिना कटना मान लेता है।)",
          mr: "360 − 300 = 60°. आधीप्रमाणे क्रिया फक्त रद्द होत नाहीत, कारण 300° मुख्य व्याप्ती 0° ते 180° च्या बाहेर आहे. cos 300° = cos 60° = 1/2 असल्याने, आणि 60° व्याप्तीत असल्याने, तेच उत्तर आहे. लक्षात घ्या की नियम ज्येच्या प्रकरणाहून वेगळा आहे: इथे परावर्तन 180° ऐवजी 360° भोवती आहे, कारण कोज्या सम आहे आणि क्षैतिज अक्षाभोवती पुनरावृत्त होते. सुरक्षित पद्धत नेहमी तीच आहे — आतले फलन काढा, मग योग्य व्याप्तीत त्या मूल्याचा कोन शोधा. (300 व्याप्ती न तपासता रद्द होणे गृहीत धरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "What is 2 sin⁻¹(1/2), in degrees?",
          hi: "2 sin⁻¹(1/2), अंशों में, क्या है?",
          mr: "2 sin⁻¹(1/2), अंशांत, किती?",
        },
        answer: 60,
        wrong: [30, 90, 120],
        checkExpr: "30*2",
        solution: {
          en: "sin⁻¹(1/2) = 30°, so twice it is 30 × 2 = 60°. The point of the question is what it is not: 2 sin⁻¹x is not sin⁻¹(2x), and here sin⁻¹(1) would be 90°, a different answer entirely. There is a genuine double-angle identity, 2 sin⁻¹x = sin⁻¹(2x√(1 − x²)), but it holds only for x between −1/√2 and 1/√2, and its restrictions are exactly the reason a formula of that kind cannot be applied without checking. Multiplying the answer is safe; multiplying the input is not. (90 computes sin⁻¹(1) by doubling inside the function.)",
          hi: "sin⁻¹(1/2) = 30°, अतः उसका दुगुना 30 × 2 = 60° है। प्रश्न का मर्म यह है कि वह क्या नहीं है: 2 sin⁻¹x, sin⁻¹(2x) नहीं है, और यहाँ sin⁻¹(1) होता 90°, बिलकुल भिन्न उत्तर। असली द्विकोण सर्वसमिका है, 2 sin⁻¹x = sin⁻¹(2x√(1 − x²)), पर वह केवल −1/√2 और 1/√2 के बीच x के लिए टिकती है, और उसके प्रतिबंध ही ठीक वह कारण हैं कि उस क़िस्म का सूत्र बिना जाँचे लगाया नहीं जा सकता। उत्तर को गुणा करना सुरक्षित है; निवेश को गुणा करना नहीं। (90 फलन के भीतर दुगुना करके sin⁻¹(1) निकाल देता है।)",
          mr: "sin⁻¹(1/2) = 30°, म्हणून त्याचे दुप्पट 30 × 2 = 60° आहे. प्रश्नाचा गाभा हा की तो काय नाही: 2 sin⁻¹x हे sin⁻¹(2x) नाही, आणि इथे sin⁻¹(1) असते 90°, पूर्णपणे वेगळे उत्तर. खरी द्विकोन एकात्मता आहे, 2 sin⁻¹x = sin⁻¹(2x√(1 − x²)), पण ती केवळ −1/√2 आणि 1/√2 दरम्यानच्या x साठी टिकते, आणि तिचे निर्बंधच नेमके ते कारण आहेत की त्या प्रकारचे सूत्र न तपासता लावता येत नाही. उत्तर गुणणे सुरक्षित आहे; निविष्ट गुणणे नाही. (90 फलनाच्या आत दुप्पट करून sin⁻¹(1) काढते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "What is the principal value of cot⁻¹(−1), in degrees?",
          hi: "cot⁻¹(−1) का मुख्य मान, अंशों में, क्या है?",
          mr: "cot⁻¹(−1) चे मुख्य मूल्य, अंशांत, किती?",
        },
        answer: 135,
        wrong: [-45, 45, 225],
        checkExpr: "180-45",
        solution: {
          en: "180 − 45 = 135°. The principal range of cot⁻¹ is 0° to 180°, like that of cos⁻¹ and unlike that of tan⁻¹, so a negative input gives an obtuse angle rather than a negative one. Answering −45° is the standard error, and it comes from applying the tangent's range to the cotangent because the two functions are reciprocals. They are, but their principal ranges were chosen separately, and the choice for cot⁻¹ avoids a discontinuity at zero that the interval −90° to 90° would introduce. (−45 uses the range belonging to tan⁻¹.)",
          hi: "180 − 45 = 135°. cot⁻¹ का मुख्य परास 0° से 180° है, cos⁻¹ जैसा और tan⁻¹ जैसा नहीं, अतः ऋण निवेश ऋण कोण नहीं बल्कि अधिक कोण देता है। −45° उत्तर देना मानक ग़लती है, और वह स्पर्शज्या का परास कोटिस्पर्शज्या पर लगाने से आती है क्योंकि दोनों फलन व्युत्क्रम हैं। वे हैं, पर उनके मुख्य परास अलग-अलग चुने गए, और cot⁻¹ के लिए वह चुनाव शून्य पर उस असांतत्य से बचाता है जिसे −90° से 90° का अंतराल ले आता। (−45 tan⁻¹ का परास काम में लेता है।)",
          mr: "180 − 45 = 135°. cot⁻¹ ची मुख्य व्याप्ती 0° ते 180° आहे, cos⁻¹ सारखी आणि tan⁻¹ सारखी नाही, म्हणून ऋण निविष्ट ऋण कोन नव्हे तर विशाल कोन देते. −45° उत्तर देणे ही प्रमाणित चूक आहे, आणि ती स्पर्शज्येची व्याप्ती कोटिस्पर्शज्येवर लावण्यातून येते कारण दोन्ही फलने व्यस्त आहेत. ती आहेत, पण त्यांच्या मुख्य व्याप्ती वेगवेगळ्या निवडल्या गेल्या, आणि cot⁻¹ साठी ती निवड शून्यावर त्या असातत्यापासून वाचवते जे −90° ते 90° चे अंतराल आणेल. (−45 tan⁻¹ ची व्याप्ती वापरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "What is tan⁻¹(1) + tan⁻¹(2) + tan⁻¹(3), in degrees?",
          hi: "tan⁻¹(1) + tan⁻¹(2) + tan⁻¹(3), अंशों में, क्या है?",
          mr: "tan⁻¹(1) + tan⁻¹(2) + tan⁻¹(3), अंशांत, किती?",
        },
        answer: 180,
        wrong: [90, 45, 270],
        checkExpr: "90*2",
        solution: {
          en: "90 × 2 = 180°, which is a genuinely surprising result and worth deriving rather than accepting. Add the last two first using tan⁻¹a + tan⁻¹b = tan⁻¹((a + b)/(1 − ab)) — but check the condition, because that formula requires ab < 1 and here 2 × 3 = 6. When ab exceeds 1 the sum has passed 90° and 180° must be added to bring it back into range. So tan⁻¹2 + tan⁻¹3 = 180° + tan⁻¹(5/(1 − 6)) = 180° + tan⁻¹(−1) = 180° − 45° = 135°. Adding tan⁻¹1 = 45° gives 180°. Two lessons. First, an addition formula with a condition attached will give a wrong answer silently if the condition is not checked — the arithmetic still produces a number. Second, the result has a clean interpretation: 1, 2 and 3 are the only positive integers whose product equals their sum, and the three arctangents fit exactly into a straight angle. (90 applies the formula without adjusting for ab > 1.)",
          hi: "90 × 2 = 180°, जो वस्तुतः चौंकाने वाला परिणाम है और स्वीकार करने के बजाय निकालने लायक़। पहले अंतिम दो को tan⁻¹a + tan⁻¹b = tan⁻¹((a + b)/(1 − ab)) से जोड़ो — पर शर्त जाँचो, क्योंकि वह सूत्र ab < 1 माँगता है और यहाँ 2 × 3 = 6 है। जब ab 1 से अधिक हो तो योग 90° पार कर चुका है और उसे परास में लौटाने को 180° जोड़ना पड़ता है। अतः tan⁻¹2 + tan⁻¹3 = 180° + tan⁻¹(5/(1 − 6)) = 180° + tan⁻¹(−1) = 180° − 45° = 135°. tan⁻¹1 = 45° जोड़ने पर 180° मिलता है। दो सीखें। पहली, जिस योग सूत्र के साथ कोई शर्त लगी हो वह शर्त न जाँची जाए तो चुपचाप ग़लत उत्तर दे देगा — गणित फिर भी कोई संख्या पैदा कर देता है। दूसरी, परिणाम की साफ़ व्याख्या है: 1, 2 और 3 ही एकमात्र धन पूर्णांक हैं जिनका गुणनफल उनके योग के बराबर है, और तीनों चापस्पर्शज्याएँ ठीक एक सरल कोण में बैठ जाती हैं। (90 ab > 1 के लिए समायोजन किए बिना सूत्र लगा देता है।)",
          mr: "90 × 2 = 180°, जो खरोखर चकित करणारा निकाल आहे आणि स्वीकारण्याऐवजी काढण्याजोगा. आधी शेवटची दोन tan⁻¹a + tan⁻¹b = tan⁻¹((a + b)/(1 − ab)) ने जोडा — पण अट तपासा, कारण ते सूत्र ab < 1 मागते आणि इथे 2 × 3 = 6 आहे. जेव्हा ab 1 हून अधिक असेल तेव्हा बेरीज 90° ओलांडून गेली आहे आणि तिला व्याप्तीत परत आणायला 180° जोडावे लागते. म्हणून tan⁻¹2 + tan⁻¹3 = 180° + tan⁻¹(5/(1 − 6)) = 180° + tan⁻¹(−1) = 180° − 45° = 135°. tan⁻¹1 = 45° जोडल्यावर 180° मिळते. दोन बोध. पहिला, ज्या बेरीज सूत्राला अट जोडलेली आहे ते अट न तपासल्यास मुकाट्याने चुकीचे उत्तर देईल — गणित तरीही एखादी संख्या निर्माण करते. दुसरा, निकालाची स्वच्छ व्याख्या आहे: 1, 2 आणि 3 हेच एकमेव धन पूर्णांक आहेत ज्यांचा गुणाकार त्यांच्या बेरजेइतका आहे, आणि तिन्ही चापस्पर्शज्या नेमक्या एका सरळ कोनात बसतात. (90 ab > 1 साठी जुळवणी न करता सूत्र लावते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "What is sin⁻¹(3/5) + sin⁻¹(4/5), in degrees?",
          hi: "sin⁻¹(3/5) + sin⁻¹(4/5), अंशों में, क्या है?",
          mr: "sin⁻¹(3/5) + sin⁻¹(4/5), अंशांत, किती?",
        },
        answer: 90,
        wrong: [180, 45, 135],
        checkExpr: "45*2",
        solution: {
          en: "45 × 2 = 90°, and the reason is worth seeing because it makes the calculation unnecessary. Consider a right triangle with legs 3 and 4 and hypotenuse 5. One acute angle has a sine of 3/5; the other has a sine of 4/5. The two acute angles of a right triangle add to 90°, so the sum is 90° without any formula being applied at all. Confirm it algebraically if you like: sin⁻¹(4/5) = cos⁻¹(3/5), since a 3-4-5 triangle makes the sine of one angle the cosine of the other, and sin⁻¹x + cos⁻¹x = 90° for every x. The general moral is that recognising a Pythagorean triple in a problem often replaces a computation with a picture, and a picture is much harder to get wrong. (180 doubles the correct answer, treating each term as if it were 90°.)",
          hi: "45 × 2 = 90°, और कारण देखने लायक़ है क्योंकि वह गणना को अनावश्यक बना देता है। 3 और 4 भुजाओं तथा 5 कर्ण वाले समकोण त्रिभुज पर विचार करो। एक न्यून कोण की ज्या 3/5 है; दूसरे की 4/5. समकोण त्रिभुज के दोनों न्यून कोण जुड़कर 90° होते हैं, अतः योग 90° है और कोई सूत्र लगाया ही नहीं गया। चाहो तो बीजगणित से पुष्टि करो: sin⁻¹(4/5) = cos⁻¹(3/5), चूँकि 3-4-5 त्रिभुज एक कोण की ज्या को दूसरे की कोज्या बना देता है, और हर x के लिए sin⁻¹x + cos⁻¹x = 90°. सामान्य सीख यह कि किसी प्रश्न में पाइथागोरसी त्रिक पहचानना प्रायः गणना की जगह एक चित्र रख देता है, और चित्र में ग़लती करना कहीं कठिन है। (180 सही उत्तर दुगुना कर देता है, हर पद को मानो 90° मानकर।)",
          mr: "45 × 2 = 90°, आणि कारण पाहण्याजोगे आहे कारण ते गणना अनावश्यक बनवते. 3 आणि 4 भुजा आणि 5 कर्ण असलेल्या काटकोन त्रिकोणाचा विचार करा. एका लघुकोनाची ज्या 3/5 आहे; दुसऱ्याची 4/5. काटकोन त्रिकोणाचे दोन्ही लघुकोन मिळून 90° होतात, म्हणून बेरीज 90° आहे आणि कोणतेही सूत्र लावलेच गेले नाही. हवे तर बीजगणिताने खात्री करा: sin⁻¹(4/5) = cos⁻¹(3/5), कारण 3-4-5 त्रिकोण एका कोनाची ज्या दुसऱ्याची कोज्या बनवतो, आणि प्रत्येक x साठी sin⁻¹x + cos⁻¹x = 90°. सर्वसाधारण बोध हा की एखाद्या प्रश्नात पायथागोरसी त्रिक ओळखणे बहुधा गणनेच्या जागी एक चित्र ठेवते, आणि चित्रात चूक करणे कितीतरी कठीण आहे. (180 बरोबर उत्तर दुप्पट करते, प्रत्येक पद जणू 90° मानून.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-inverse-trigonometric-functions",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 2 — Inverse Trigonometric Functions",
      name: "Inverse Trigonometric Functions",
      summary:
        "Undoing a function that repeats for ever, which forces a choice: a range fixed by convention so that infinitely many candidate angles become one, why sin⁻¹(sin θ) is not θ unless θ was already in that range, and why an addition formula with a condition attached will hand you a wrong answer without complaining.",
      position: 2,
      translations: {
        hi: {
          name: "प्रतिलोम त्रिकोणमितीय फलन",
          summary:
            "ऐसे फलन को उलटना जो हमेशा दोहराता है, जो एक चुनाव थोप देता है: परिपाटी से तय किया गया परास ताकि अनंत उम्मीदवार कोण एक हो जाएँ, sin⁻¹(sin θ) तब तक θ क्यों नहीं जब तक θ पहले से उस परास में न हो, और शर्त लगा योग सूत्र बिना शिकायत किए ग़लत उत्तर क्यों थमा देता है।",
        },
        mr: {
          name: "प्रतिलोम त्रिकोणमितीय फलने",
          summary:
            "असे फलन उलटवणे जे कायम पुनरावृत्त होते, जे एक निवड लादते: संकेताने ठरवलेली व्याप्ती जेणेकरून अनंत उमेदवार कोन एक व्हावेत, sin⁻¹(sin θ) हे θ का नाही जोवर θ आधीच त्या व्याप्तीत नसेल, आणि अट जोडलेले बेरीज सूत्र तक्रार न करता चुकीचे उत्तर का देते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 3 — Matrices (an array treated as a single object)                */
/* ------------------------------------------------------------------------- */
function matrices12(): TopicFileOut {
  const rand = rng("maths-12-matrices");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "How many elements does a matrix of order 3 × 4 contain?",
          hi: "3 × 4 कोटि के किसी आव्यूह में कितने अवयव हैं?",
          mr: "3 × 4 कोटीच्या एका मॅट्रिक्समध्ये किती घटक आहेत?",
        },
        answer: 12,
        wrong: [7, 34, 9],
        checkExpr: "3*4",
        solution: {
          en: "3 rows of 4 entries each: 3 × 4 = 12. The convention is rows first and columns second, and keeping that order straight matters far beyond counting — the order of a product depends on it, and reading 3 × 4 as four rows of three would give a different shape for everything downstream. (7 adds the two numbers instead of multiplying them.)",
          hi: "4-4 प्रविष्टियों की 3 पंक्तियाँ: 3 × 4 = 12. परिपाटी पहले पंक्तियाँ और फिर स्तंभ है, और उस क्रम को सीधा रखना गिनती से कहीं आगे मायने रखता है — किसी गुणनफल की कोटि उसी पर निर्भर है, और 3 × 4 को तीन-तीन की चार पंक्तियाँ पढ़ने पर आगे की हर चीज़ के लिए भिन्न आकार मिलता। (7 गुणा करने के बजाय दोनों संख्याएँ जोड़ देता है।)",
          mr: "4-4 नोंदींच्या 3 ओळी: 3 × 4 = 12. संकेत आधी ओळी आणि मग स्तंभ आहे, आणि तो क्रम सरळ ठेवणे मोजणीहून कितीतरी पुढे महत्त्वाचा आहे — एखाद्या गुणाकाराची कोटी त्यावरच अवलंबून आहे, आणि 3 × 4 ला तीन-तीनच्या चार ओळी वाचल्यास पुढच्या प्रत्येक गोष्टीसाठी वेगळा आकार मिळेल. (7 गुणण्याऐवजी दोन्ही संख्या जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A 2 × 3 matrix is multiplied by a 3 × 5 matrix. How many elements does the product have?",
          hi: "किसी 2 × 3 आव्यूह को 3 × 5 आव्यूह से गुणा किया जाता है। गुणनफल में कितने अवयव हैं?",
          mr: "एका 2 × 3 मॅट्रिक्सला 3 × 5 मॅट्रिक्सने गुणले जाते. गुणाकारात किती घटक आहेत?",
        },
        answer: 10,
        wrong: [15, 6, 30],
        checkExpr: "2*5",
        solution: {
          en: "The product takes the rows of the first and the columns of the second, so its order is 2 × 5 and it has 2 × 5 = 10 elements. The inner numbers, both 3, must match for the product to exist at all, and then they vanish from the answer — they say how long each sum is, not how many sums there are. (15 multiplies the wrong pair, using the inner dimensions.)",
          hi: "गुणनफल पहले की पंक्तियाँ और दूसरे के स्तंभ लेता है, अतः उसकी कोटि 2 × 5 है और उसमें 2 × 5 = 10 अवयव हैं। भीतरी संख्याएँ, दोनों 3, गुणनफल के होने के लिए मेल खानी ही चाहिए, और फिर वे उत्तर से ग़ायब हो जाती हैं — वे बताती हैं कि हर योग कितना लंबा है, यह नहीं कि कितने योग हैं। (15 भीतरी विमाएँ काम में लेकर ग़लत जोड़ी का गुणा करता है।)",
          mr: "गुणाकार पहिल्याच्या ओळी आणि दुसऱ्याचे स्तंभ घेतो, म्हणून त्याची कोटी 2 × 5 आहे आणि त्यात 2 × 5 = 10 घटक आहेत. आतल्या संख्या, दोन्ही 3, गुणाकार अस्तित्वात असण्यासाठी जुळल्याच पाहिजेत, आणि मग त्या उत्तरातून नाहीशा होतात — त्या सांगतात की प्रत्येक बेरीज किती लांब आहे, किती बेरजा आहेत हे नाही. (15 आतल्या मिती वापरून चुकीच्या जोडीचा गुणाकार करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "For the matrix [[1, 2], [3, 4]], what is the element a₂₁?",
          hi: "आव्यूह [[1, 2], [3, 4]] के लिए अवयव a₂₁ क्या है?",
          mr: "मॅट्रिक्स [[1, 2], [3, 4]] साठी घटक a₂₁ किती?",
        },
        answer: 3,
        wrong: [2, 4, 1],
        checkExpr: "1+2",
        solution: {
          en: "1 + 2 = 3. The subscript reads row first, column second, so a₂₁ is the entry in row 2, column 1, which is 3. Reading it the other way round gives a₁₂ = 2, and since a matrix is generally not symmetric those two are different numbers — which is precisely why the convention has to be fixed rather than guessed. (2 reads the subscripts in the reverse order.)",
          hi: "1 + 2 = 3. अधोलेख पहले पंक्ति, फिर स्तंभ पढ़ता है, अतः a₂₁ पंक्ति 2, स्तंभ 1 की प्रविष्टि है, जो 3 है। उलटा पढ़ने पर a₁₂ = 2 मिलता है, और चूँकि आव्यूह सामान्यतः सममित नहीं होता, वे दोनों भिन्न संख्याएँ हैं — और ठीक इसीलिए परिपाटी तय करनी पड़ती है, अनुमान से नहीं चलती। (2 अधोलेखों को उलटे क्रम में पढ़ता है।)",
          mr: "1 + 2 = 3. अधोलेख आधी ओळ, मग स्तंभ वाचतो, म्हणून a₂₁ ही ओळ 2, स्तंभ 1 ची नोंद आहे, जी 3 आहे. उलटे वाचल्यास a₁₂ = 2 मिळते, आणि मॅट्रिक्स सामान्यतः सममित नसल्याने त्या दोन्ही वेगळ्या संख्या आहेत — आणि नेमके म्हणूनच संकेत ठरवावा लागतो, अंदाजाने चालत नाही. (2 अधोलेख उलट्या क्रमाने वाचते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many different 2 × 2 matrices can be formed whose entries are each either 0 or 1?",
          hi: "कितने भिन्न 2 × 2 आव्यूह बनाए जा सकते हैं जिनकी हर प्रविष्टि या तो 0 हो या 1?",
          mr: "किती वेगळे 2 × 2 मॅट्रिक्स बनवता येतील ज्यांची प्रत्येक नोंद एकतर 0 असेल किंवा 1?",
        },
        answer: 16,
        wrong: [4, 8, 32],
        checkExpr: "2*8",
        solution: {
          en: "Four positions, two choices each, all independent: 2⁴ = 2 × 8 = 16. The exponent counts the positions and the base counts the options at each, which is the same counting as subsets and as functions — the same structure keeps appearing whenever a fixed number of independent decisions has to be made. (4 counts the positions rather than the arrangements.)",
          hi: "चार स्थान, हर एक पर दो विकल्प, सब स्वतंत्र: 2⁴ = 2 × 8 = 16. घातांक स्थान गिनता है और आधार हर स्थान पर विकल्प, और यह वही गिनती है जो उपसमुच्चयों और फलनों की है — जब भी नियत संख्या में स्वतंत्र निर्णय लेने हों वही संरचना बार-बार प्रकट होती है। (4 व्यवस्थाओं के बजाय स्थान गिनता है।)",
          mr: "चार जागा, प्रत्येकावर दोन पर्याय, सर्व स्वतंत्र: 2⁴ = 2 × 8 = 16. घातांक जागा मोजतो आणि आधार प्रत्येक जागी पर्याय, आणि ही तीच मोजणी आहे जी उपसंचांची आणि फलनांची आहे — जेव्हाही ठराविक संख्येने स्वतंत्र निर्णय घ्यायचे असतील तीच रचना वारंवार प्रकट होते. (4 मांडणींऐवजी जागा मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the trace of the matrix [[2, 5], [7, 4]]?",
          hi: "आव्यूह [[2, 5], [7, 4]] का ट्रेस क्या है?",
          mr: "मॅट्रिक्स [[2, 5], [7, 4]] चा ट्रेस किती?",
        },
        answer: 6,
        wrong: [18, 12, 9],
        checkExpr: "2+4",
        solution: {
          en: "The trace is the sum of the diagonal entries: 2 + 4 = 6. The off-diagonal entries 5 and 7 play no part, which is what makes the trace worth having — it survives many operations that change everything else about a matrix, and a quantity that stays put while the object is transformed is usually telling you something structural. (18 sums all four entries.)",
          hi: "ट्रेस विकर्ण प्रविष्टियों का योग है: 2 + 4 = 6. विकर्णेतर प्रविष्टियाँ 5 और 7 कोई भूमिका नहीं निभातीं, और यही ट्रेस को रखने लायक़ बनाता है — वह बहुत सी ऐसी संक्रियाओं में बचा रहता है जो आव्यूह की बाक़ी हर बात बदल देती हैं, और जो राशि वस्तु के रूपांतरित होते हुए भी जमी रहे वह प्रायः कुछ संरचनात्मक बता रही होती है। (18 चारों प्रविष्टियाँ जोड़ देता है।)",
          mr: "ट्रेस म्हणजे विकर्ण नोंदींची बेरीज: 2 + 4 = 6. विकर्णेतर नोंदी 5 आणि 7 कोणतीही भूमिका बजावत नाहीत, आणि हेच ट्रेसला ठेवण्याजोगे बनवते — तो बऱ्याच अशा क्रियांत टिकतो ज्या मॅट्रिक्सची बाकी प्रत्येक गोष्ट बदलतात, आणि जी राशी वस्तू रूपांतरित होत असतानाही स्थिर राहते ती बहुधा काहीतरी संरचनात्मक सांगत असते. (18 चारही नोंदी जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A matrix has 12 elements. How many different orders are possible for it?",
          hi: "किसी आव्यूह में 12 अवयव हैं। उसके लिए कितनी भिन्न कोटियाँ संभव हैं?",
          mr: "एका मॅट्रिक्समध्ये 12 घटक आहेत. त्याच्यासाठी किती वेगळ्या कोटी शक्य आहेत?",
        },
        answer: 6,
        wrong: [12, 3, 4],
        checkExpr: "3*2",
        solution: {
          en: "Each order corresponds to a factor pair of 12, and since order matters (3 × 4 is a different shape from 4 × 3) the count is the number of divisors: 1, 2, 3, 4, 6, 12 — that is 3 × 2 = 6. Turning a question about matrices into a question about divisors is the whole of the work here. (12 counts the elements rather than the orders.)",
          hi: "हर कोटि 12 के किसी गुणनखंड युग्म से मेल खाती है, और चूँकि क्रम मायने रखता है (3 × 4 का आकार 4 × 3 से भिन्न है) गिनती भाजकों की संख्या है: 1, 2, 3, 4, 6, 12 — यानी 3 × 2 = 6. आव्यूहों के प्रश्न को भाजकों के प्रश्न में बदलना ही यहाँ का पूरा काम है। (12 कोटियों के बजाय अवयव गिनता है।)",
          mr: "प्रत्येक कोटी 12 च्या एखाद्या अवयव जोडीशी जुळते, आणि क्रम महत्त्वाचा असल्याने (3 × 4 चा आकार 4 × 3 हून वेगळा आहे) मोजणी भाजकांची संख्या आहे: 1, 2, 3, 4, 6, 12 — म्हणजे 3 × 2 = 6. मॅट्रिक्सच्या प्रश्नाचे भाजकांच्या प्रश्नात रूपांतर करणे हेच इथले अख्खे काम आहे. (12 कोटींऐवजी घटक मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "For A = [[1, 2], [3, 4]], what is the element in row 1, column 2 of A + Aᵀ?",
          hi: "A = [[1, 2], [3, 4]] के लिए A + Aᵀ की पंक्ति 1, स्तंभ 2 का अवयव क्या है?",
          mr: "A = [[1, 2], [3, 4]] साठी A + Aᵀ च्या ओळ 1, स्तंभ 2 चा घटक किती?",
        },
        answer: 5,
        wrong: [4, 2, 6],
        checkExpr: "2+3",
        solution: {
          en: "The transpose swaps rows with columns, so the (1,2) entry of Aᵀ is the (2,1) entry of A, which is 3. Adding gives 2 + 3 = 5. Notice that the (2,1) entry of the sum is 3 + 2 = 5 as well, so A + Aᵀ is symmetric — and that holds for any square A, which is why this construction is the standard way of producing a symmetric matrix from an arbitrary one. (4 doubles the original entry, forgetting that the transpose brings a different number.)",
          hi: "परिवर्त पंक्तियों को स्तंभों से बदल देता है, अतः Aᵀ की (1,2) प्रविष्टि A की (2,1) प्रविष्टि है, जो 3 है। जोड़ने पर 2 + 3 = 5. ध्यान दो कि योग की (2,1) प्रविष्टि भी 3 + 2 = 5 है, अतः A + Aᵀ सममित है — और यह किसी भी वर्ग A के लिए टिकता है, इसीलिए यह रचना किसी मनमाने आव्यूह से सममित आव्यूह बनाने का मानक तरीक़ा है। (4 मूल प्रविष्टि दुगुनी कर देता है, यह भूलकर कि परिवर्त भिन्न संख्या लाता है।)",
          mr: "परिवर्त ओळींना स्तंभांशी बदलतो, म्हणून Aᵀ ची (1,2) नोंद ही A ची (2,1) नोंद आहे, जी 3 आहे. जोडल्यावर 2 + 3 = 5. लक्षात घ्या की बेरजेची (2,1) नोंदही 3 + 2 = 5 आहे, म्हणून A + Aᵀ सममित आहे — आणि हे कोणत्याही वर्ग A साठी टिकते, म्हणूनच ही रचना कोणत्याही मनमानी मॅट्रिक्सपासून सममित मॅट्रिक्स बनवण्याचा प्रमाणित मार्ग आहे. (4 मूळ नोंद दुप्पट करते, हे विसरून की परिवर्त वेगळी संख्या आणतो.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the value of every diagonal element of a skew-symmetric matrix?",
          hi: "किसी विषम सममित आव्यूह के हर विकर्ण अवयव का मान क्या है?",
          mr: "एखाद्या विषम सममित मॅट्रिक्सच्या प्रत्येक विकर्ण घटकाचे मूल्य किती?",
        },
        answer: 0,
        wrong: [1, -1, 2],
        checkExpr: "5-5",
        solution: {
          en: "5 − 5 = 0, and the argument is short enough to give in full. Skew-symmetric means Aᵀ = −A, so every entry satisfies aⱼᵢ = −aᵢⱼ. On the diagonal i and j are the same, so aᵢᵢ = −aᵢᵢ, which forces 2aᵢᵢ = 0 and hence aᵢᵢ = 0. Nothing was assumed except the definition, which is what makes this a proof rather than an observation. (1 gives the identity matrix's diagonal.)",
          hi: "5 − 5 = 0, और तर्क इतना छोटा है कि पूरा दिया जा सके। विषम सममित का अर्थ है Aᵀ = −A, अतः हर प्रविष्टि aⱼᵢ = −aᵢⱼ को पूरा करती है। विकर्ण पर i और j वही हैं, अतः aᵢᵢ = −aᵢᵢ, जो 2aᵢᵢ = 0 और इसलिए aᵢᵢ = 0 मजबूर कर देता है। परिभाषा के सिवा कुछ माना नहीं गया, और यही इसे प्रेक्षण नहीं बल्कि उपपत्ति बनाता है। (1 तत्समक आव्यूह का विकर्ण देता है।)",
          mr: "5 − 5 = 0, आणि युक्तिवाद इतका लहान आहे की पूर्ण देता येईल. विषम सममित म्हणजे Aᵀ = −A, म्हणून प्रत्येक नोंद aⱼᵢ = −aᵢⱼ पूर्ण करते. विकर्णावर i आणि j तेच आहेत, म्हणून aᵢᵢ = −aᵢᵢ, जे 2aᵢᵢ = 0 आणि म्हणून aᵢᵢ = 0 भाग पाडते. व्याख्येखेरीज काहीही गृहीत धरले गेले नाही, आणि हेच याला निरीक्षण नव्हे तर सिद्धता बनवते. (1 तत्समक मॅट्रिक्सचा विकर्ण देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "How many entries of a 3 × 3 symmetric matrix can be chosen independently?",
          hi: "किसी 3 × 3 सममित आव्यूह की कितनी प्रविष्टियाँ स्वतंत्र रूप से चुनी जा सकती हैं?",
          mr: "एखाद्या 3 × 3 सममित मॅट्रिक्सच्या किती नोंदी स्वतंत्रपणे निवडता येतील?",
        },
        answer: 6,
        wrong: [9, 3, 5],
        checkExpr: "3+3",
        solution: {
          en: "The three diagonal entries are free, and of the six off-diagonal entries only three are free because each fixes its mirror image: 3 + 3 = 6. The same counting appeared in the relations chapter for symmetric relations, and it is the same idea — symmetry does not remove positions, it pairs them up so that two positions become one decision. (9 counts every entry as if it were free.)",
          hi: "तीन विकर्ण प्रविष्टियाँ स्वतंत्र हैं, और छह विकर्णेतर प्रविष्टियों में से केवल तीन स्वतंत्र हैं क्योंकि हर एक अपना दर्पण प्रतिबिंब तय कर देती है: 3 + 3 = 6. वही गिनती संबंध अध्याय में सममित संबंधों के लिए आई थी, और विचार वही है — सममिति स्थान हटाती नहीं, वह उन्हें जोड़ देती है ताकि दो स्थान एक निर्णय बन जाएँ। (9 हर प्रविष्टि को मानो स्वतंत्र गिन लेता है।)",
          mr: "तीन विकर्ण नोंदी मुक्त आहेत, आणि सहा विकर्णेतर नोंदींपैकी केवळ तीन मुक्त आहेत कारण प्रत्येक आपले आरसा प्रतिबिंब ठरवते: 3 + 3 = 6. तीच मोजणी संबंध प्रकरणात सममित संबंधांसाठी आली होती, आणि कल्पना तीच आहे — सममिती जागा काढत नाही, ती त्यांना जोडते जेणेकरून दोन जागा एक निर्णय बनाव्यात. (9 प्रत्येक नोंद जणू मुक्त मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "How many entries of a 3 × 3 skew-symmetric matrix can be chosen independently?",
          hi: "किसी 3 × 3 विषम सममित आव्यूह की कितनी प्रविष्टियाँ स्वतंत्र रूप से चुनी जा सकती हैं?",
          mr: "एखाद्या 3 × 3 विषम सममित मॅट्रिक्सच्या किती नोंदी स्वतंत्रपणे निवडता येतील?",
        },
        answer: 3,
        wrong: [6, 9, 0],
        checkExpr: "6-3",
        solution: {
          en: "6 − 3 = 3. Start from the symmetric count of 6 and remove the three diagonal entries, which are not free at all here — skew-symmetry forces every one of them to be zero. The three off-diagonal couples remain, each a single decision. It is worth noticing that the symmetric and skew-symmetric counts, 6 and 3, add to 9, the number of entries in the whole matrix. That is not a coincidence: every square matrix splits uniquely into a symmetric part and a skew-symmetric part, and the two pieces between them account for exactly the freedom the original had. (6 gives the symmetric count without removing the forced diagonal.)",
          hi: "6 − 3 = 3. सममित की गिनती 6 से शुरू करो और तीन विकर्ण प्रविष्टियाँ हटा दो, जो यहाँ स्वतंत्र हैं ही नहीं — विषम सममिति उनमें से हर एक को शून्य होने पर मजबूर कर देती है। तीन विकर्णेतर जोड़े बचते हैं, हर एक एक निर्णय। ध्यान देने लायक़ है कि सममित और विषम सममित गिनतियाँ, 6 और 3, जुड़कर 9 होती हैं, जो पूरे आव्यूह की प्रविष्टियों की संख्या है। यह संयोग नहीं: हर वर्ग आव्यूह अनन्य रूप से एक सममित और एक विषम सममित भाग में बँट जाता है, और दोनों टुकड़े मिलकर ठीक उतनी स्वतंत्रता का हिसाब देते हैं जितनी मूल के पास थी। (6 मजबूर विकर्ण हटाए बिना सममित गिनती देता है।)",
          mr: "6 − 3 = 3. सममितची मोजणी 6 पासून सुरू करा आणि तीन विकर्ण नोंदी काढा, ज्या इथे मुक्त आहेतच नाही — विषम सममिती त्यांच्यापैकी प्रत्येकाला शून्य होण्यास भाग पाडते. तीन विकर्णेतर जोडपी उरतात, प्रत्येक एक निर्णय. लक्षात घेण्याजोगे आहे की सममित आणि विषम सममित मोजण्या, 6 आणि 3, मिळून 9 होतात, जी अख्ख्या मॅट्रिक्सच्या नोंदींची संख्या आहे. हा योगायोग नाही: प्रत्येक वर्ग मॅट्रिक्स अनन्यपणे एका सममित आणि एका विषम सममित भागात विभागतो, आणि दोन्ही तुकडे मिळून नेमक्या तितक्या स्वातंत्र्याचा हिशेब देतात जितके मूळकडे होते. (6 भाग पाडलेला विकर्ण न काढता सममित मोजणी देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A is a 4 × 7 matrix. How many elements does Aᵀ have?",
          hi: "A एक 4 × 7 आव्यूह है। Aᵀ में कितने अवयव हैं?",
          mr: "A हा 4 × 7 मॅट्रिक्स आहे. Aᵀ मध्ये किती घटक आहेत?",
        },
        answer: 28,
        wrong: [11, 16, 49],
        checkExpr: "4*7",
        solution: {
          en: "The transpose is 7 × 4, so it has 7 × 4 = 28 elements — the same as A, since transposing rearranges entries without creating or destroying any. The order changes and the count does not, which is worth stating explicitly because it is the simplest example of an operation that alters the shape of an object while leaving a quantity invariant. (11 adds the dimensions instead of multiplying them.)",
          hi: "परिवर्त 7 × 4 है, अतः उसमें 7 × 4 = 28 अवयव हैं — A जितने ही, चूँकि परिवर्तन प्रविष्टियों को पुनर्व्यवस्थित करता है, न कोई बनाता है न नष्ट। कोटि बदलती है और गिनती नहीं, और इसे स्पष्ट कहना काम का है क्योंकि यह ऐसी संक्रिया का सबसे सरल उदाहरण है जो किसी वस्तु का आकार बदलती है और कोई राशि अपरिवर्तनीय छोड़ देती है। (11 गुणा करने के बजाय विमाएँ जोड़ देता है।)",
          mr: "परिवर्त 7 × 4 आहे, म्हणून त्यात 7 × 4 = 28 घटक आहेत — A इतकेच, कारण परिवर्तन नोंदी पुनर्रचित करते, कोणतीही बनवत नाही वा नष्ट करत नाही. कोटी बदलते आणि मोजणी नाही, आणि हे स्पष्ट सांगणे उपयुक्त आहे कारण हे अशा क्रियेचे सर्वांत सोपे उदाहरण आहे जी एखाद्या वस्तूचा आकार बदलते आणि एखादी राशी अपरिवर्तनीय सोडते. (11 गुणण्याऐवजी मिती जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A 1 × 3 matrix is multiplied by a 3 × 1 matrix. How many elements does the product have?",
          hi: "किसी 1 × 3 आव्यूह को 3 × 1 आव्यूह से गुणा किया जाता है। गुणनफल में कितने अवयव हैं?",
          mr: "एका 1 × 3 मॅट्रिक्सला 3 × 1 मॅट्रिक्सने गुणले जाते. गुणाकारात किती घटक आहेत?",
        },
        answer: 1,
        wrong: [9, 3, 6],
        checkExpr: "3-2",
        solution: {
          en: "The outer dimensions give the order 1 × 1, so 3 − 2 = 1 element. Reverse the two matrices and the product is 3 × 1 times 1 × 3, an order of 3 × 3 with nine elements. The same two matrices, multiplied in the other order, give results of completely different sizes — which is the sharpest possible demonstration that matrix multiplication is not commutative. It is not that AB and BA differ in value; they may not even be the same shape. (9 gives the product taken in the other order.)",
          hi: "बाहरी विमाएँ 1 × 1 कोटि देती हैं, अतः 3 − 2 = 1 अवयव। दोनों आव्यूह उलट दो और गुणनफल 3 × 1 गुणा 1 × 3 है, यानी नौ अवयवों वाली 3 × 3 कोटि। वही दो आव्यूह, उलटे क्रम में गुणा किए जाने पर, बिलकुल भिन्न आकारों के परिणाम देते हैं — और यह सबसे तीखा संभव प्रदर्शन है कि आव्यूह गुणन क्रमविनिमेय नहीं। बात यह नहीं कि AB और BA मान में भिन्न हैं; वे एक ही आकार के भी नहीं हो सकते। (9 उलटे क्रम में लिया गुणनफल देता है।)",
          mr: "बाहेरच्या मिती 1 × 1 कोटी देतात, म्हणून 3 − 2 = 1 घटक. दोन्ही मॅट्रिक्स उलटा आणि गुणाकार 3 × 1 गुणिले 1 × 3 आहे, म्हणजे नऊ घटकांची 3 × 3 कोटी. तेच दोन मॅट्रिक्स, उलट क्रमाने गुणल्यावर, पूर्णपणे वेगळ्या आकारांचे निकाल देतात — आणि हे सर्वांत तीक्ष्ण शक्य प्रात्यक्षिक आहे की मॅट्रिक्स गुणाकार क्रमविनिमेय नाही. गोष्ट ही नाही की AB आणि BA मूल्यात वेगळी आहेत; ती एकाच आकाराचीही असू शकत नाहीत. (9 उलट क्रमाने घेतलेला गुणाकार देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A is a 3 × 3 matrix in which every entry equals 2. What is the entry in row 1, column 1 of A²?",
          hi: "A एक 3 × 3 आव्यूह है जिसकी हर प्रविष्टि 2 के बराबर है। A² की पंक्ति 1, स्तंभ 1 की प्रविष्टि क्या है?",
          mr: "A हा 3 × 3 मॅट्रिक्स आहे ज्याची प्रत्येक नोंद 2 बरोबर आहे. A² च्या ओळ 1, स्तंभ 1 ची नोंद किती?",
        },
        answer: 12,
        wrong: [4, 6, 36],
        checkExpr: "2*2*3",
        solution: {
          en: "The (1,1) entry of a product is the row 1 of the first matrix dotted with column 1 of the second: 2×2 + 2×2 + 2×2 = 2 × 2 × 3 = 12. The tempting answer is 4, on the assumption that squaring a matrix squares its entries. It does not, and the reason is worth being explicit about: matrix multiplication is defined so that it composes the linear transformations the matrices represent, and composition requires summing over an intermediate index. Squaring entrywise would be a different operation altogether — it exists and is called the Hadamard product — but it does not compose transformations and so does not obey the algebra that makes matrices useful. Note also what the 3 is doing: it is the shared inner dimension, so the same matrix pattern in 4 × 4 would give 16. The size of the matrix enters the answer, which is another thing entrywise squaring would never do. (4 squares the entry instead of forming the sum.)",
          hi: "किसी गुणनफल की (1,1) प्रविष्टि पहले आव्यूह की पंक्ति 1 का दूसरे के स्तंभ 1 से बिंदु गुणन है: 2×2 + 2×2 + 2×2 = 2 × 2 × 3 = 12. लुभाने वाला उत्तर 4 है, इस धारणा पर कि आव्यूह का वर्ग करना उसकी प्रविष्टियों का वर्ग कर देता है। वह नहीं करता, और कारण स्पष्ट कहने लायक़ है: आव्यूह गुणन ऐसे परिभाषित है कि वह उन रैखिक रूपांतरणों का संयोजन करे जिन्हें आव्यूह निरूपित करते हैं, और संयोजन को किसी मध्यवर्ती सूचकांक पर योग चाहिए। प्रविष्टिवार वर्ग करना बिलकुल भिन्न संक्रिया होती — वह है और उसे हैडमार्ड गुणनफल कहते हैं — पर वह रूपांतरणों का संयोजन नहीं करती और इसलिए उस बीजगणित का पालन नहीं करती जो आव्यूहों को काम का बनाता है। यह भी ध्यान दो कि 3 क्या कर रहा है: वह साझी भीतरी विमा है, अतः 4 × 4 में वही आव्यूह प्रतिरूप 16 देता। आव्यूह का आकार उत्तर में आ जाता है, और यह भी ऐसी चीज़ है जो प्रविष्टिवार वर्ग करना कभी नहीं करता। (4 योग बनाने के बजाय प्रविष्टि का वर्ग कर देता है।)",
          mr: "एखाद्या गुणाकाराची (1,1) नोंद म्हणजे पहिल्या मॅट्रिक्सची ओळ 1 दुसऱ्याच्या स्तंभ 1 शी बिंदुगुणित: 2×2 + 2×2 + 2×2 = 2 × 2 × 3 = 12. मोहवणारे उत्तर 4 आहे, या धारणेवर की मॅट्रिक्सचा वर्ग करणे त्याच्या नोंदींचा वर्ग करते. ते करत नाही, आणि कारण स्पष्ट सांगण्याजोगे आहे: मॅट्रिक्स गुणाकार असा परिभाषित आहे की तो त्या रेषीय रूपांतरणांचे संयोजन करावे जी मॅट्रिक्स निरूपित करतात, आणि संयोजनाला एखाद्या मधल्या निर्देशांकावर बेरीज लागते. नोंदवार वर्ग करणे पूर्णपणे वेगळी क्रिया असेल — ती आहे आणि तिला हॅडमार्ड गुणाकार म्हणतात — पण ती रूपांतरणांचे संयोजन करत नाही आणि म्हणून त्या बीजगणिताचे पालन करत नाही जे मॅट्रिक्सना उपयुक्त बनवते. हेही लक्षात घ्या की 3 काय करत आहे: ती समाईक आतली मिती आहे, म्हणून 4 × 4 मध्ये तोच मॅट्रिक्स नमुना 16 देईल. मॅट्रिक्सचा आकार उत्तरात येतो, आणि हीही अशी गोष्ट आहे जी नोंदवार वर्ग करणे कधीच करत नाही. (4 बेरीज बनवण्याऐवजी नोंदीचा वर्ग करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "For A = [[1, 2], [3, 4]] and the identity matrix I of order 2, what is the entry in row 2, column 2 of A × I?",
          hi: "A = [[1, 2], [3, 4]] और कोटि 2 के तत्समक आव्यूह I के लिए, A × I की पंक्ति 2, स्तंभ 2 की प्रविष्टि क्या है?",
          mr: "A = [[1, 2], [3, 4]] आणि कोटी 2 च्या तत्समक मॅट्रिक्स I साठी, A × I च्या ओळ 2, स्तंभ 2 ची नोंद किती?",
        },
        answer: 4,
        wrong: [1, 8, 0],
        checkExpr: "3*0+4*1",
        solution: {
          en: "Row 2 of A is (3, 4) and column 2 of I is (0, 1), so the entry is 3 × 0 + 4 × 1 = 4 — the same as in A. Working one entry through shows what the identity does mechanically: each column of I selects exactly one entry from the row and discards the rest, so the product reproduces A unchanged. That is what it means for I to be an identity, and it is the matrix analogue of multiplying a number by 1. Two things are worth adding. First, unlike almost everything else in this chapter, A × I and I × A both equal A, so the identity commutes with every matrix of the right order — it is one of the very few that does. Second, the identity is what makes an inverse definable at all: A⁻¹ is defined as the matrix with A × A⁻¹ = I, so without a fixed object to be the target of that equation there would be nothing for an inverse to mean. (1 reads the entry from I rather than from the product.)",
          hi: "A की पंक्ति 2 है (3, 4) और I का स्तंभ 2 है (0, 1), अतः प्रविष्टि 3 × 0 + 4 × 1 = 4 है — A जैसी ही। एक प्रविष्टि को हल करके देखना दिखा देता है कि तत्समक यांत्रिक रूप से करता क्या है: I का हर स्तंभ पंक्ति में से ठीक एक प्रविष्टि चुनता है और बाक़ी फेंक देता है, अतः गुणनफल A को अपरिवर्तित दोहरा देता है। I का तत्समक होना यही है, और यह किसी संख्या को 1 से गुणा करने का आव्यूह रूप है। दो बातें जोड़ने लायक़ हैं। पहली, इस अध्याय की लगभग हर दूसरी चीज़ के विपरीत, A × I और I × A दोनों A के बराबर हैं, अतः तत्समक सही कोटि के हर आव्यूह से क्रमविनिमेय है — और ऐसा करने वालों में वह गिने-चुनों में से एक है। दूसरी, तत्समक ही प्रतिलोम को परिभाषित करने योग्य बनाता है: A⁻¹ की परिभाषा वह आव्यूह है जिसके लिए A × A⁻¹ = I, अतः उस समीकरण का लक्ष्य बनने को कोई नियत वस्तु न हो तो प्रतिलोम का कोई अर्थ ही न होता। (1 गुणनफल के बजाय I से प्रविष्टि पढ़ लेता है।)",
          mr: "A ची ओळ 2 आहे (3, 4) आणि I चा स्तंभ 2 आहे (0, 1), म्हणून नोंद 3 × 0 + 4 × 1 = 4 आहे — A सारखीच. एक नोंद सोडवून पाहणे दाखवते की तत्समक यांत्रिकरीत्या काय करतो: I चा प्रत्येक स्तंभ ओळीतून नेमकी एक नोंद निवडतो आणि बाकीच्या फेकतो, म्हणून गुणाकार A ला अपरिवर्तित पुनरावृत्त करतो. I चे तत्समक असणे हेच आहे, आणि हे एखाद्या संख्येला 1 ने गुणण्याचे मॅट्रिक्स रूप आहे. दोन गोष्टी जोडण्याजोग्या आहेत. पहिली, या प्रकरणातल्या जवळपास प्रत्येक इतर गोष्टीच्या उलट, A × I आणि I × A दोन्ही A बरोबर आहेत, म्हणून तत्समक योग्य कोटीच्या प्रत्येक मॅट्रिक्सशी क्रमविनिमेय आहे — आणि असे करणाऱ्यांत तो मोजक्यांपैकी एक आहे. दुसरी, तत्समकच प्रतिलोमाला परिभाषित करण्याजोगे बनवतो: A⁻¹ ची व्याख्या तो मॅट्रिक्स आहे ज्यासाठी A × A⁻¹ = I, म्हणून त्या समीकरणाचे लक्ष्य बनायला कोणतीही ठराविक वस्तू नसती तर प्रतिलोमाला कोणताही अर्थच नसता. (1 गुणाकाराऐवजी I मधून नोंद वाचते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-matrices",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 3 — Matrices",
      name: "Matrices",
      summary:
        "A rectangular array handled as one object: why the order of a product is decided before any entry is worked out, why squaring a matrix is nothing like squaring its entries, and why symmetry does not remove positions but pairs them so that two become a single decision.",
      position: 3,
      translations: {
        hi: {
          name: "आव्यूह",
          summary:
            "किसी आयताकार सरणी को एक ही वस्तु की तरह सँभालना: किसी गुणनफल की कोटि कोई प्रविष्टि निकाले जाने से पहले ही क्यों तय हो जाती है, आव्यूह का वर्ग करना उसकी प्रविष्टियों का वर्ग करने जैसा बिलकुल क्यों नहीं, और सममिति स्थान हटाने के बजाय उन्हें क्यों जोड़ देती है ताकि दो एक ही निर्णय बन जाएँ।",
        },
        mr: {
          name: "मॅट्रिक्स",
          summary:
            "एखादी आयताकार सारणी एकच वस्तू म्हणून हाताळणे: एखाद्या गुणाकाराची कोटी कोणतीही नोंद काढण्याआधीच का ठरते, मॅट्रिक्सचा वर्ग करणे त्याच्या नोंदींचा वर्ग करण्यासारखे मुळीच का नाही, आणि सममिती जागा काढण्याऐवजी त्यांना का जोडते जेणेकरून दोन एकच निर्णय बनाव्यात.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 4 — Determinants (one number that decides a whole system)         */
/* ------------------------------------------------------------------------- */
function determinants12(): TopicFileOut {
  const rand = rng("maths-12-determinants");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the determinant of [[3, 1], [2, 4]]?",
          hi: "[[3, 1], [2, 4]] का सारणिक क्या है?",
          mr: "[[3, 1], [2, 4]] चा निर्धारक किती?",
        },
        answer: 10,
        wrong: [14, 12, 2],
        checkExpr: "3*4-1*2",
        solution: {
          en: "For a 2 × 2 matrix the determinant is the product of the main diagonal minus the product of the other: 3 × 4 − 1 × 2 = 10. The subtraction is the whole of it, and adding instead gives 14 — which is the commonest wrong answer here and the reason the minus sign is worth saying out loud rather than assuming. (14 adds the two products.)",
          hi: "किसी 2 × 2 आव्यूह के लिए सारणिक मुख्य विकर्ण का गुणनफल घटा दूसरे का गुणनफल है: 3 × 4 − 1 × 2 = 10. घटाना ही पूरी बात है, और उसके बजाय जोड़ने पर 14 मिलता है — जो यहाँ का सबसे आम ग़लत उत्तर है और यही कारण है कि ऋण चिह्न को मान लेने के बजाय कह देना चाहिए। (14 दोनों गुणनफल जोड़ देता है।)",
          mr: "एखाद्या 2 × 2 मॅट्रिक्ससाठी निर्धारक म्हणजे मुख्य विकर्णाचा गुणाकार वजा दुसऱ्याचा गुणाकार: 3 × 4 − 1 × 2 = 10. वजाबाकीच अख्खी गोष्ट आहे, आणि त्याऐवजी बेरीज केल्यास 14 मिळते — जे इथले सर्वांत सामान्य चुकीचे उत्तर आहे आणि हेच कारण की ऋण चिन्ह गृहीत धरण्याऐवजी सांगावे. (14 दोन्ही गुणाकार जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the determinant of the 3 × 3 identity matrix?",
          hi: "3 × 3 तत्समक आव्यूह का सारणिक क्या है?",
          mr: "3 × 3 तत्समक मॅट्रिक्सचा निर्धारक किती?",
        },
        answer: 1,
        wrong: [3, 0, 9],
        checkExpr: "1*1",
        solution: {
          en: "1 × 1 = 1. The identity is diagonal with every diagonal entry equal to 1, and the determinant of a diagonal matrix is the product of those entries. The value matters: a determinant of 1 means the transformation preserves area or volume exactly, which is what one would expect of a matrix that changes nothing at all. (3 counts the diagonal entries instead of multiplying them.)",
          hi: "1 × 1 = 1. तत्समक विकर्ण है और उसकी हर विकर्ण प्रविष्टि 1 है, और किसी विकर्ण आव्यूह का सारणिक उन प्रविष्टियों का गुणनफल है। मान मायने रखता है: 1 का सारणिक बताता है कि रूपांतरण क्षेत्रफल या आयतन को ठीक-ठीक बचाए रखता है, और ऐसे आव्यूह से यही अपेक्षा होगी जो कुछ बदलता ही नहीं। (3 विकर्ण प्रविष्टियों का गुणा करने के बजाय उन्हें गिन लेता है।)",
          mr: "1 × 1 = 1. तत्समक विकर्ण आहे आणि त्याची प्रत्येक विकर्ण नोंद 1 आहे, आणि एखाद्या विकर्ण मॅट्रिक्सचा निर्धारक त्या नोंदींचा गुणाकार आहे. मूल्य महत्त्वाचे आहे: 1 चा निर्धारक सांगतो की रूपांतरण क्षेत्रफळ वा घनफळ अचूक टिकवते, आणि अशा मॅट्रिक्सकडून हीच अपेक्षा असेल जो काहीही बदलतच नाही. (3 विकर्ण नोंदींचा गुणाकार करण्याऐवजी त्या मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the determinant of [[5, 0], [0, 3]]?",
          hi: "[[5, 0], [0, 3]] का सारणिक क्या है?",
          mr: "[[5, 0], [0, 3]] चा निर्धारक किती?",
        },
        answer: 15,
        wrong: [8, 0, 2],
        checkExpr: "5*3",
        solution: {
          en: "5 × 3 − 0 × 0 = 15. With a diagonal matrix the second product is zero and only the diagonal contributes, so the determinant is simply the product of the diagonal entries. There is a geometric reading: this matrix stretches by 5 in one direction and 3 in the other, and a unit square becomes a rectangle of area 15. (8 adds the diagonal entries.)",
          hi: "5 × 3 − 0 × 0 = 15. विकर्ण आव्यूह में दूसरा गुणनफल शून्य होता है और केवल विकर्ण योगदान देता है, अतः सारणिक बस विकर्ण प्रविष्टियों का गुणनफल है। एक ज्यामितीय पाठ भी है: यह आव्यूह एक दिशा में 5 और दूसरी में 3 से खींचता है, और इकाई वर्ग 15 क्षेत्रफल का आयत बन जाता है। (8 विकर्ण प्रविष्टियाँ जोड़ देता है।)",
          mr: "5 × 3 − 0 × 0 = 15. विकर्ण मॅट्रिक्समध्ये दुसरा गुणाकार शून्य असतो आणि केवळ विकर्ण योगदान देतो, म्हणून निर्धारक फक्त विकर्ण नोंदींचा गुणाकार आहे. एक भौमितिक वाचनही आहे: हा मॅट्रिक्स एका दिशेने 5 आणि दुसरीत 3 ने ताणतो, आणि एकक चौरस 15 क्षेत्रफळाचा आयत बनतो. (8 विकर्ण नोंदी जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A 2 × 2 matrix has determinant 4. One of its rows is multiplied by 3. What is the new determinant?",
          hi: "किसी 2 × 2 आव्यूह का सारणिक 4 है। उसकी एक पंक्ति को 3 से गुणा किया जाता है। नया सारणिक क्या है?",
          mr: "एका 2 × 2 मॅट्रिक्सचा निर्धारक 4 आहे. त्याची एक ओळ 3 ने गुणली जाते. नवा निर्धारक किती?",
        },
        answer: 12,
        wrong: [4, 36, 7],
        checkExpr: "4*3",
        solution: {
          en: "4 × 3 = 12. Multiplying a single row by a scalar multiplies the whole determinant by that scalar, because every term in the expansion contains exactly one entry from that row. Note carefully that this is one row, not the whole matrix — multiplying every row by 3 would multiply the determinant by 3 twice over, giving 36. (36 scales both rows instead of one.)",
          hi: "4 × 3 = 12. किसी एक पंक्ति को अदिश से गुणा करना पूरे सारणिक को उसी अदिश से गुणा कर देता है, क्योंकि प्रसार के हर पद में उस पंक्ति की ठीक एक प्रविष्टि होती है। ध्यान से देखो कि यह एक पंक्ति है, पूरा आव्यूह नहीं — हर पंक्ति को 3 से गुणा करने पर सारणिक 3 से दो बार गुणा होता और 36 मिलता। (36 एक के बजाय दोनों पंक्तियाँ स्केल कर देता है।)",
          mr: "4 × 3 = 12. एखादी एक ओळ अदिशाने गुणणे अख्ख्या निर्धारकाला त्याच अदिशाने गुणते, कारण विस्ताराच्या प्रत्येक पदात त्या ओळीची नेमकी एक नोंद असते. काळजीपूर्वक पाहा की ही एक ओळ आहे, अख्खा मॅट्रिक्स नाही — प्रत्येक ओळ 3 ने गुणल्यास निर्धारक 3 ने दोनदा गुणला जाईल आणि 36 मिळेल. (36 एकाऐवजी दोन्ही ओळी प्रमाणित करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the determinant of a matrix in which two rows are identical?",
          hi: "ऐसे आव्यूह का सारणिक क्या है जिसकी दो पंक्तियाँ समरूप हैं?",
          mr: "अशा मॅट्रिक्सचा निर्धारक किती ज्याच्या दोन ओळी सारख्या आहेत?",
        },
        answer: 0,
        wrong: [1, 2, -1],
        checkExpr: "7-7",
        solution: {
          en: "7 − 7 = 0. Swapping two rows changes the sign of a determinant; but if the two rows are identical the swap changes nothing at all, so the determinant equals its own negative and must therefore be zero. The geometric reading is just as short: two identical rows means the vectors are not independent, so they span no area at all. (1 gives the identity's value, which has no identical rows.)",
          hi: "7 − 7 = 0. दो पंक्तियाँ बदलने से सारणिक का चिह्न बदल जाता है; पर यदि दोनों पंक्तियाँ समरूप हों तो बदलने से कुछ भी नहीं बदलता, अतः सारणिक अपने ही ऋण के बराबर है और इसलिए शून्य होना ही चाहिए। ज्यामितीय पाठ उतना ही छोटा है: दो समरूप पंक्तियों का अर्थ है सदिश स्वतंत्र नहीं, अतः वे कोई क्षेत्रफल घेरते ही नहीं। (1 तत्समक का मान देता है, जिसमें कोई समरूप पंक्तियाँ नहीं।)",
          mr: "7 − 7 = 0. दोन ओळी बदलल्याने निर्धारकाचे चिन्ह बदलते; पण जर दोन्ही ओळी सारख्या असतील तर बदलण्याने काहीही बदलत नाही, म्हणून निर्धारक स्वतःच्याच ऋणाबरोबर आहे आणि म्हणून शून्य असलाच पाहिजे. भौमितिक वाचन तितकेच लहान आहे: दोन सारख्या ओळींचा अर्थ सदिश स्वतंत्र नाहीत, म्हणून ते कोणतेही क्षेत्रफळ व्यापतच नाहीत. (1 तत्समकाचे मूल्य देते, ज्यात कोणत्याही सारख्या ओळी नाहीत.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the determinant of [[2, 3], [4, 6]]?",
          hi: "[[2, 3], [4, 6]] का सारणिक क्या है?",
          mr: "[[2, 3], [4, 6]] चा निर्धारक किती?",
        },
        answer: 0,
        wrong: [24, 12, 6],
        checkExpr: "2*6-3*4",
        solution: {
          en: "2 × 6 − 3 × 4 = 12 − 12 = 0. The reason is visible before any arithmetic: the second row is exactly twice the first, so the rows are proportional and therefore not independent. A determinant of zero means the matrix has no inverse and the corresponding system of equations has either no solution or infinitely many — never exactly one. Spotting a proportional row saves the calculation entirely. (24 adds the products rather than subtracting.)",
          hi: "2 × 6 − 3 × 4 = 12 − 12 = 0. कारण किसी भी गणित से पहले दिख जाता है: दूसरी पंक्ति ठीक पहली की दुगुनी है, अतः पंक्तियाँ समानुपाती हैं और इसलिए स्वतंत्र नहीं। शून्य सारणिक का अर्थ है कि आव्यूह का कोई प्रतिलोम नहीं और तदनुरूप समीकरण निकाय का या तो कोई हल नहीं या अनंत — कभी ठीक एक नहीं। समानुपाती पंक्ति पहचान लेना पूरी गणना बचा देता है। (24 घटाने के बजाय गुणनफल जोड़ देता है।)",
          mr: "2 × 6 − 3 × 4 = 12 − 12 = 0. कारण कोणत्याही गणितापूर्वी दिसते: दुसरी ओळ नेमकी पहिलीच्या दुप्पट आहे, म्हणून ओळी समानुपाती आहेत आणि म्हणून स्वतंत्र नाहीत. शून्य निर्धारकाचा अर्थ मॅट्रिक्सला कोणताही प्रतिलोम नाही आणि त्याअनुषंगिक समीकरण संचाला एकतर कोणतेही उत्तर नाही वा अनंत — कधीही नेमके एक नाही. समानुपाती ओळ ओळखणे अख्खी गणना वाचवते. (24 वजा करण्याऐवजी गुणाकार जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "What is the area, in square units, of the triangle with vertices (0, 0), (4, 0) and (0, 6)?",
          hi: "शीर्षों (0, 0), (4, 0) और (0, 6) वाले त्रिभुज का क्षेत्रफल, वर्ग इकाइयों में, क्या है?",
          mr: "शिरोबिंदू (0, 0), (4, 0) आणि (0, 6) असलेल्या त्रिकोणाचे क्षेत्रफळ, चौरस एककांत, किती?",
        },
        answer: 12,
        wrong: [24, 10, 6],
        checkExpr: "4*6/2",
        solution: {
          en: "4 × 6 / 2 = 12. The determinant formula for the area of a triangle reduces here to half the base times the height, because two sides lie along the axes. The determinant version is worth knowing because it works for any three points, and because a determinant of zero says the three points are collinear — the triangle has collapsed to a line. That single test for collinearity is what makes the formula more than a shortcut. (24 forgets to halve the product.)",
          hi: "4 × 6 / 2 = 12. त्रिभुज के क्षेत्रफल का सारणिक सूत्र यहाँ आधा आधार गुणा ऊँचाई पर सिमट जाता है, क्योंकि दो भुजाएँ अक्षों के अनुदिश हैं। सारणिक वाला रूप जानने लायक़ है क्योंकि वह किन्हीं भी तीन बिंदुओं के लिए चलता है, और क्योंकि शून्य सारणिक कहता है कि तीनों बिंदु संरेख हैं — त्रिभुज ढहकर रेखा हो गया। संरेखता की वही अकेली जाँच सूत्र को शॉर्टकट से अधिक बनाती है। (24 गुणनफल को आधा करना भूल जाता है।)",
          mr: "4 × 6 / 2 = 12. त्रिकोणाच्या क्षेत्रफळाचे निर्धारक सूत्र इथे अर्धा पाया गुणिले उंची इथवर आक्रसते, कारण दोन भुजा अक्षांच्या दिशेने आहेत. निर्धारक आवृत्ती जाणण्याजोगी आहे कारण ती कोणत्याही तीन बिंदूंसाठी चालते, आणि कारण शून्य निर्धारक सांगतो की तिन्ही बिंदू सरेख आहेत — त्रिकोण कोसळून रेषा झाला. सरेखतेची तीच एकटी चाचणी सूत्राला शॉर्टकटहून अधिक बनवते. (24 गुणाकार निम्मा करायला विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A is a 2 × 2 matrix with |A| = 5. What is |2A|?",
          hi: "A एक 2 × 2 आव्यूह है जिसका |A| = 5 है। |2A| क्या है?",
          mr: "A हा 2 × 2 मॅट्रिक्स आहे ज्याचा |A| = 5 आहे. |2A| किती?",
        },
        answer: 20,
        wrong: [10, 5, 40],
        checkExpr: "5*4",
        solution: {
          en: "Multiplying the whole matrix by 2 multiplies each of its 2 rows by 2, so the determinant is multiplied by 2 twice: 5 × 4 = 20. The general rule is |kA| = kⁿ|A| for an n × n matrix, and the exponent is the size of the matrix rather than anything about k. Answering 10 by scaling the determinant once is the standard error, and it comes from treating the determinant as if it were linear in the matrix, which it is not. (10 multiplies the determinant by 2 only once.)",
          hi: "पूरे आव्यूह को 2 से गुणा करना उसकी 2 पंक्तियों में से हर एक को 2 से गुणा करता है, अतः सारणिक 2 से दो बार गुणा होता है: 5 × 4 = 20. सामान्य नियम n × n आव्यूह के लिए |kA| = kⁿ|A| है, और घातांक आव्यूह का आकार है, k के बारे में कुछ नहीं। सारणिक को एक बार स्केल कर 10 उत्तर देना मानक ग़लती है, और वह सारणिक को आव्यूह में रैखिक मानने से आती है, जो वह नहीं है। (10 सारणिक को 2 से केवल एक बार गुणा करता है।)",
          mr: "अख्खा मॅट्रिक्स 2 ने गुणणे त्याच्या 2 ओळींपैकी प्रत्येकीला 2 ने गुणते, म्हणून निर्धारक 2 ने दोनदा गुणला जातो: 5 × 4 = 20. सर्वसाधारण नियम n × n मॅट्रिक्ससाठी |kA| = kⁿ|A| आहे, आणि घातांक मॅट्रिक्सचा आकार आहे, k बद्दल काहीही नाही. निर्धारक एकदा प्रमाणित करून 10 उत्तर देणे ही प्रमाणित चूक आहे, आणि ती निर्धारकाला मॅट्रिक्समध्ये रेषीय मानण्यातून येते, जो तो नाही. (10 निर्धारकाला 2 ने केवळ एकदा गुणते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A is a 3 × 3 matrix with |A| = 3. What is |adj A|?",
          hi: "A एक 3 × 3 आव्यूह है जिसका |A| = 3 है। |adj A| क्या है?",
          mr: "A हा 3 × 3 मॅट्रिक्स आहे ज्याचा |A| = 3 आहे. |adj A| किती?",
        },
        answer: 9,
        wrong: [3, 27, 1],
        checkExpr: "3*3",
        solution: {
          en: "For an n × n matrix, |adj A| = |A|ⁿ⁻¹, so here it is 3² = 3 × 3 = 9. The rule follows from A × adj A = |A| I: taking determinants of both sides gives |A| × |adj A| = |A|ⁿ, and dividing by |A| leaves the result. Deriving it from that identity is much safer than memorising an exponent, because the identity itself is the one worth carrying. (27 uses the exponent n instead of n − 1.)",
          hi: "किसी n × n आव्यूह के लिए |adj A| = |A|ⁿ⁻¹, अतः यहाँ वह 3² = 3 × 3 = 9 है। नियम A × adj A = |A| I से निकलता है: दोनों ओर का सारणिक लेने पर |A| × |adj A| = |A|ⁿ मिलता है, और |A| से भाग देने पर परिणाम बचता है। उस सर्वसमिका से निकालना किसी घातांक को रटने से कहीं सुरक्षित है, क्योंकि साथ रखने लायक़ स्वयं वही सर्वसमिका है। (27 n − 1 के बजाय घातांक n काम में लेता है।)",
          mr: "एखाद्या n × n मॅट्रिक्ससाठी |adj A| = |A|ⁿ⁻¹, म्हणून इथे तो 3² = 3 × 3 = 9 आहे. नियम A × adj A = |A| I मधून निघतो: दोन्ही बाजूंचा निर्धारक घेतल्यास |A| × |adj A| = |A|ⁿ मिळते, आणि |A| ने भागल्यास निकाल उरतो. त्या एकात्मतेतून काढणे एखादा घातांक पाठ करण्याहून कितीतरी सुरक्षित आहे, कारण सोबत ठेवण्याजोगी स्वतः तीच एकात्मता आहे. (27 n − 1 ऐवजी घातांक n वापरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A is a square matrix with |A| = 4. What is |A⁻¹|?",
          hi: "A एक वर्ग आव्यूह है जिसका |A| = 4 है। |A⁻¹| क्या है?",
          mr: "A हा वर्ग मॅट्रिक्स आहे ज्याचा |A| = 4 आहे. |A⁻¹| किती?",
        },
        answer: 0.25,
        wrong: [4, -4, 16],
        checkExpr: "1/4",
        solution: {
          en: "1/4 = 0.25. Since A × A⁻¹ = I and the determinant of a product is the product of the determinants, |A| × |A⁻¹| = |I| = 1, so |A⁻¹| = 1/|A|. Notice a consequence: if |A| were zero the equation would demand that zero times something equals one, which is impossible — so a matrix with determinant zero has no inverse at all. That is why the determinant is the test for invertibility rather than merely a number associated with the matrix. (4 gives the determinant of A rather than of its inverse.)",
          hi: "1/4 = 0.25. चूँकि A × A⁻¹ = I और किसी गुणनफल का सारणिक सारणिकों का गुणनफल है, |A| × |A⁻¹| = |I| = 1, अतः |A⁻¹| = 1/|A|. एक परिणाम पर ध्यान दो: यदि |A| शून्य होता तो समीकरण माँगता कि शून्य गुणा कुछ एक के बराबर हो, जो असंभव है — अतः शून्य सारणिक वाले आव्यूह का कोई प्रतिलोम है ही नहीं। इसीलिए सारणिक आव्यूह से जुड़ी महज़ एक संख्या न होकर व्युत्क्रमणीयता की जाँच है। (4 प्रतिलोम के बजाय A का सारणिक देता है।)",
          mr: "1/4 = 0.25. A × A⁻¹ = I असल्याने आणि एखाद्या गुणाकाराचा निर्धारक निर्धारकांचा गुणाकार असल्याने, |A| × |A⁻¹| = |I| = 1, म्हणून |A⁻¹| = 1/|A|. एका परिणामाकडे लक्ष द्या: जर |A| शून्य असता तर समीकरण मागेल की शून्य गुणिले काहीतरी एकबरोबर असावे, जे अशक्य आहे — म्हणून शून्य निर्धारक असलेल्या मॅट्रिक्सला कोणताही प्रतिलोम आहेच नाही. म्हणूनच निर्धारक मॅट्रिक्सशी जोडलेली केवळ एक संख्या नसून व्यस्तनीयतेची चाचणी आहे. (4 प्रतिलोमाऐवजी A चा निर्धारक देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A is a 3 × 3 matrix with |A| = 2. What is |2A|?",
          hi: "A एक 3 × 3 आव्यूह है जिसका |A| = 2 है। |2A| क्या है?",
          mr: "A हा 3 × 3 मॅट्रिक्स आहे ज्याचा |A| = 2 आहे. |2A| किती?",
        },
        answer: 16,
        wrong: [4, 6, 8],
        checkExpr: "2*8",
        solution: {
          en: "Each of the 3 rows is multiplied by 2, so the determinant picks up a factor of 2³ = 8: 2 × 8 = 16. Compare the earlier 2 × 2 case, where the same scaling gave a factor of 4 — the exponent tracks the size of the matrix, not the scalar. There is a geometric reading that makes it memorable: doubling every coordinate of a solid doubles each of its three dimensions and so multiplies its volume by eight, and a determinant is exactly a volume scale factor. (4 doubles the determinant once.)",
          hi: "तीनों पंक्तियों में से हर एक 2 से गुणा होती है, अतः सारणिक 2³ = 8 का गुणक उठा लेता है: 2 × 8 = 16. पहले वाले 2 × 2 मामले से तुलना करो, जहाँ उसी स्केलिंग ने 4 का गुणक दिया — घातांक आव्यूह का आकार पकड़ता है, अदिश नहीं। एक ज्यामितीय पाठ इसे यादगार बना देता है: किसी ठोस के हर निर्देशांक को दुगुना करना उसकी तीनों विमाएँ दुगुनी कर देता है और इसलिए उसका आयतन आठ गुना, और सारणिक ठीक आयतन का स्केल गुणक है। (4 सारणिक को एक बार दुगुना कर देता है।)",
          mr: "तिन्ही ओळींपैकी प्रत्येक 2 ने गुणली जाते, म्हणून निर्धारक 2³ = 8 चा गुणक उचलतो: 2 × 8 = 16. आधीच्या 2 × 2 प्रकरणाशी तुलना करा, जिथे त्याच प्रमाणीकरणाने 4 चा गुणक दिला — घातांक मॅट्रिक्सचा आकार पकडतो, अदिश नाही. एक भौमितिक वाचन याला संस्मरणीय बनवते: एखाद्या घनाच्या प्रत्येक निर्देशांकाला दुप्पट करणे त्याच्या तिन्ही मिती दुप्पट करते आणि म्हणून त्याचे घनफळ आठपट, आणि निर्धारक नेमका घनफळाचा प्रमाण गुणक आहे. (4 निर्धारक एकदा दुप्पट करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A is a 3 × 3 matrix with |A| = 5. What is |3A|?",
          hi: "A एक 3 × 3 आव्यूह है जिसका |A| = 5 है। |3A| क्या है?",
          mr: "A हा 3 × 3 मॅट्रिक्स आहे ज्याचा |A| = 5 आहे. |3A| किती?",
        },
        answer: 135,
        wrong: [15, 45, 125],
        checkExpr: "5*27",
        solution: {
          en: "The scalar is cubed because there are 3 rows: 5 × 3³ = 5 × 27 = 135. Getting the two numbers into the right places is the whole exercise — 125 comes from cubing the determinant instead of the scalar, and 15 from scaling only once. The rule |kA| = kⁿ|A| has the scalar raised to the size and the determinant left alone, and a wrong answer here is nearly always the two swapped. (125 cubes the determinant instead of the scalar.)",
          hi: "अदिश का घन इसलिए लिया जाता है कि 3 पंक्तियाँ हैं: 5 × 3³ = 5 × 27 = 135. दोनों संख्याओं को सही जगह पहुँचाना ही पूरा अभ्यास है — 125 अदिश के बजाय सारणिक का घन करने से आता है, और 15 केवल एक बार स्केल करने से। नियम |kA| = kⁿ|A| में अदिश आकार तक उठाया जाता है और सारणिक अछूता छूटता है, और यहाँ का ग़लत उत्तर लगभग हमेशा दोनों की अदला-बदली है। (125 अदिश के बजाय सारणिक का घन कर देता है।)",
          mr: "अदिशाचा घन यासाठी घेतला जातो की 3 ओळी आहेत: 5 × 3³ = 5 × 27 = 135. दोन्ही संख्या योग्य जागी पोहोचवणे हाच अख्खा सराव आहे — 125 अदिशाऐवजी निर्धारकाचा घन करण्यातून येते, आणि 15 केवळ एकदा प्रमाणित करण्यातून. नियम |kA| = kⁿ|A| मध्ये अदिश आकारापर्यंत नेला जातो आणि निर्धारक अस्पर्श उरतो, आणि इथले चुकीचे उत्तर जवळपास नेहमी दोघांची अदलाबदल आहे. (125 अदिशाऐवजी निर्धारकाचा घन करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A is a 3 × 3 matrix with |A| = 2. What is the determinant of A × adj A?",
          hi: "A एक 3 × 3 आव्यूह है जिसका |A| = 2 है। A × adj A का सारणिक क्या है?",
          mr: "A हा 3 × 3 मॅट्रिक्स आहे ज्याचा |A| = 2 आहे. A × adj A चा निर्धारक किती?",
        },
        answer: 8,
        wrong: [2, 4, 16],
        checkExpr: "2*2*2",
        solution: {
          en: "There are two routes and they should agree, which is itself the check. Directly: A × adj A = |A| I = 2I, a diagonal matrix with three 2s down the diagonal, and its determinant is 2 × 2 × 2 = 8. By the multiplication rule: |A| × |adj A| = 2 × 2² = 8. Both give the same answer because |kI| = kⁿ for an n × n matrix, and the exponent is again the size. Note that A × adj A = |A| I is the identity the whole apparatus rests on: dividing both sides by |A| gives A × (adj A / |A|) = I, which is the definition of the inverse and the reason A⁻¹ = adj A / |A|. The formula for the inverse is not a separate fact to memorise; it is this identity rearranged. (2 quotes |A| itself rather than the determinant of the product.)",
          hi: "दो रास्ते हैं और उन्हें मिलना चाहिए, और वही स्वयं जाँच है। सीधे: A × adj A = |A| I = 2I, विकर्ण पर तीन 2 वाला विकर्ण आव्यूह, और उसका सारणिक 2 × 2 × 2 = 8 है। गुणन नियम से: |A| × |adj A| = 2 × 2² = 8. दोनों वही उत्तर देते हैं क्योंकि n × n आव्यूह के लिए |kI| = kⁿ, और घातांक फिर आकार है। ध्यान दो कि A × adj A = |A| I वही सर्वसमिका है जिस पर पूरा तंत्र टिका है: दोनों ओर |A| से भाग देने पर A × (adj A / |A|) = I मिलता है, जो प्रतिलोम की परिभाषा है और यही कारण कि A⁻¹ = adj A / |A|. प्रतिलोम का सूत्र रटने का अलग तथ्य नहीं; वह यही सर्वसमिका पुनर्व्यवस्थित की हुई है। (2 गुणनफल के सारणिक के बजाय स्वयं |A| बता देता है।)",
          mr: "दोन मार्ग आहेत आणि त्यांनी जुळावे, आणि तीच स्वतः तपासणी आहे. थेट: A × adj A = |A| I = 2I, विकर्णावर तीन 2 असलेला विकर्ण मॅट्रिक्स, आणि त्याचा निर्धारक 2 × 2 × 2 = 8 आहे. गुणाकार नियमाने: |A| × |adj A| = 2 × 2² = 8. दोन्ही तेच उत्तर देतात कारण n × n मॅट्रिक्ससाठी |kI| = kⁿ, आणि घातांक पुन्हा आकार आहे. लक्षात घ्या की A × adj A = |A| I हीच ती एकात्मता आहे जिच्यावर अख्खी यंत्रणा टिकली आहे: दोन्ही बाजू |A| ने भागल्यास A × (adj A / |A|) = I मिळते, जी प्रतिलोमाची व्याख्या आहे आणि हेच कारण की A⁻¹ = adj A / |A|. प्रतिलोमाचे सूत्र पाठ करण्याचे वेगळे सत्य नाही; ते हीच एकात्मता पुनर्रचित केलेली आहे. (2 गुणाकाराच्या निर्धारकाऐवजी स्वतः |A| सांगते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A is a 3 × 3 matrix with |A| = 2. What is |adj(adj A)|?",
          hi: "A एक 3 × 3 आव्यूह है जिसका |A| = 2 है। |adj(adj A)| क्या है?",
          mr: "A हा 3 × 3 मॅट्रिक्स आहे ज्याचा |A| = 2 आहे. |adj(adj A)| किती?",
        },
        answer: 16,
        wrong: [4, 8, 64],
        checkExpr: "2*8",
        solution: {
          en: "Apply the adjugate rule twice rather than reaching for a formula. First, |adj A| = |A|ⁿ⁻¹ = 2² = 4. Now adj A is itself a 3 × 3 matrix with determinant 4, so applying the same rule to it gives |adj(adj A)| = 4² = 16, which is 2 × 8. The general result is |A|^((n−1)²), and here (n − 1)² = 4, so 2⁴ = 16 — the same answer, reached by a route that has to be remembered rather than derived. Two habits are worth taking from this. First, when a rule can be applied twice, applying it twice is safer than looking up a compound formula, because each step is one you can already check. Second, notice how fast the exponent grows: at n = 4 the exponent is 9, so the adjugate of the adjugate of a modest matrix has an enormous determinant. Growth like that is a signal that the operation is doing something more drastic than its name suggests. (4 stops after applying the rule once.)",
          hi: "किसी सूत्र तक पहुँचने के बजाय सहखंडज नियम दो बार लगाओ। पहले, |adj A| = |A|ⁿ⁻¹ = 2² = 4. अब adj A स्वयं 4 सारणिक वाला 3 × 3 आव्यूह है, अतः उस पर वही नियम लगाने से |adj(adj A)| = 4² = 16 मिलता है, जो 2 × 8 है। सामान्य परिणाम |A|^((n−1)²) है, और यहाँ (n − 1)² = 4, अतः 2⁴ = 16 — वही उत्तर, ऐसे रास्ते से पहुँचा जिसे निकालने के बजाय याद रखना पड़ता है। इससे दो आदतें लेने लायक़ हैं। पहली, जब कोई नियम दो बार लगाया जा सकता हो, तो उसे दो बार लगाना किसी संयुक्त सूत्र को ढूँढ़ने से सुरक्षित है, क्योंकि हर क़दम वही है जिसे तुम पहले से जाँच सकते हो। दूसरी, ध्यान दो कि घातांक कितनी तेज़ी से बढ़ता है: n = 4 पर घातांक 9 है, अतः किसी मामूली आव्यूह के सहखंडज के सहखंडज का सारणिक विशाल होता है। ऐसी वृद्धि संकेत है कि वह संक्रिया अपने नाम के सुझाव से कहीं अधिक कठोर कुछ कर रही है। (4 नियम एक बार लगाकर रुक जाता है।)",
          mr: "एखाद्या सूत्रापर्यंत पोहोचण्याऐवजी सहखंडज नियम दोनदा लावा. आधी, |adj A| = |A|ⁿ⁻¹ = 2² = 4. आता adj A स्वतः 4 निर्धारक असलेला 3 × 3 मॅट्रिक्स आहे, म्हणून त्यावर तोच नियम लावल्यास |adj(adj A)| = 4² = 16 मिळते, जे 2 × 8 आहे. सर्वसाधारण निकाल |A|^((n−1)²) आहे, आणि इथे (n − 1)² = 4, म्हणून 2⁴ = 16 — तेच उत्तर, अशा मार्गाने पोहोचलेले ज्याला काढण्याऐवजी लक्षात ठेवावे लागते. यातून दोन सवयी घेण्याजोग्या आहेत. पहिली, जेव्हा एखादा नियम दोनदा लावता येईल, तेव्हा तो दोनदा लावणे एखादे संयुक्त सूत्र शोधण्याहून सुरक्षित आहे, कारण प्रत्येक पायरी तीच आहे जी तुम्ही आधीच तपासू शकता. दुसरी, लक्षात घ्या की घातांक किती वेगाने वाढतो: n = 4 वर घातांक 9 आहे, म्हणून एखाद्या माफक मॅट्रिक्सच्या सहखंडजाच्या सहखंडजाचा निर्धारक प्रचंड असतो. अशी वाढ हे संकेत आहे की ती क्रिया आपल्या नावाच्या सुचनेहून कितीतरी अधिक तीव्र काहीतरी करत आहे. (4 नियम एकदा लावून थांबते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-determinants",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 4 — Determinants",
      name: "Determinants",
      summary:
        "One number extracted from a square array that decides whether the whole thing can be undone: why scaling a matrix raises the determinant to the power of its size rather than merely multiplying it, why two proportional rows force the value to zero, and why A × adj A = |A| I is the single identity the formula for an inverse is only a rearrangement of.",
      position: 4,
      translations: {
        hi: {
          name: "सारणिक",
          summary:
            "किसी वर्ग सरणी से निकाली गई एक संख्या जो तय करती है कि पूरी चीज़ उलटी जा सकती है या नहीं: आव्यूह को स्केल करना सारणिक को उसके आकार की घात तक क्यों उठाता है, केवल गुणा क्यों नहीं करता, दो समानुपाती पंक्तियाँ मान को शून्य होने पर क्यों मजबूर करती हैं, और A × adj A = |A| I वह अकेली सर्वसमिका क्यों है जिसकी प्रतिलोम का सूत्र महज़ पुनर्व्यवस्था है।",
        },
        mr: {
          name: "निर्धारक",
          summary:
            "एखाद्या वर्ग सारणीतून काढलेली एक संख्या जी ठरवते की अख्खी गोष्ट उलटवता येईल का: मॅट्रिक्स प्रमाणित करणे निर्धारकाला त्याच्या आकाराच्या घातापर्यंत का नेते, केवळ गुणत का नाही, दोन समानुपाती ओळी मूल्याला शून्य होण्यास का भाग पाडतात, आणि A × adj A = |A| I ही ती एकटी एकात्मता का आहे जिची प्रतिलोमाचे सूत्र केवळ पुनर्रचना आहे.",
        },
      },
    },
    qs,
  );
}


export const G12_MATHS: TopicFileOut[] = [
  relationsFunctions12(),
  inverseTrig12(),
  matrices12(),
  determinants12(),
];
