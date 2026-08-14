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


/* ------------------------------------------------------------------------- */
/* Chapter 5 — Continuity and Differentiability (where a curve stops behaving) */
/* ------------------------------------------------------------------------- */
function continuityDifferentiability12(): TopicFileOut {
  const rand = rng("maths-12-continuity-and-differentiability");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "For f(x) = x² + 1, what value does f(x) approach as x approaches 2?",
          hi: "f(x) = x² + 1 के लिए, जब x, 2 की ओर बढ़ता है तो f(x) किस मान की ओर बढ़ता है?",
          mr: "f(x) = x² + 1 साठी, x हा 2 कडे जात असताना f(x) कोणत्या मूल्याकडे जातो?",
        },
        answer: 5,
        wrong: [4, 2, 6],
        checkExpr: "2*2+1",
        solution: {
          en: "2² + 1 = 5. For a polynomial the limit is simply the value: substituting is allowed because polynomials are continuous everywhere, and continuity is precisely the permission to substitute. That is worth stating plainly at the start, because the rest of the chapter is about the functions where the permission is withdrawn. (4 forgets the +1.)",
          hi: "2² + 1 = 5. किसी बहुपद के लिए सीमा बस मान ही है: प्रतिस्थापन इसलिए चलता है क्योंकि बहुपद हर जगह संतत हैं, और संततता ठीक-ठीक प्रतिस्थापन की अनुमति ही है। शुरुआत में यह साफ़ कह देना ज़रूरी है, क्योंकि बाक़ी अध्याय उन्हीं फलनों के बारे में है जहाँ यह अनुमति वापस ले ली जाती है। (4 में +1 भूल गया।)",
          mr: "2² + 1 = 5. एखाद्या बहुपदीसाठी सीमा म्हणजे फक्त मूल्यच: प्रतिस्थापन यासाठी चालते कारण बहुपदी सर्वत्र संतत आहेत, आणि संततता म्हणजे नेमकी प्रतिस्थापनाची परवानगीच. सुरुवातीलाच हे स्पष्ट सांगणे आवश्यक आहे, कारण उरलेला अध्याय त्याच फलनांबद्दल आहे जिथे ही परवानगी काढून घेतली जाते. (4 मध्ये +1 विसरले.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the derivative of x⁵ with respect to x, evaluated at x = 1?",
          hi: "x के सापेक्ष x⁵ का अवकलज x = 1 पर कितना है?",
          mr: "x च्या सापेक्ष x⁵ चा अवकलज x = 1 वर किती?",
        },
        answer: 5,
        wrong: [1, 4, 20],
        checkExpr: "5*1",
        solution: {
          en: "The power rule gives 5x⁴, and at x = 1 that is 5 × 1 = 5. Note what the exponent does: it comes down as a multiplier and drops by one. Both halves of that matter, and 4 is the answer of somebody who did the dropping and forgot the multiplying. (20 differentiates a second time.)",
          hi: "घात नियम से 5x⁴ मिलता है, और x = 1 पर वह 5 × 1 = 5 है। ध्यान दो घातांक करता क्या है: वह गुणक बनकर नीचे आता है और एक घट जाता है। इन दोनों आधों का महत्व है, और 4 उसका उत्तर है जिसने घटाना कर लिया और गुणा करना भूल गया। (20 दूसरी बार अवकलन करता है।)",
          mr: "घात नियमाने 5x⁴ मिळते, आणि x = 1 वर ते 5 × 1 = 5 आहे. घातांक काय करतो ते लक्षात घ्या: तो गुणक बनून खाली येतो आणि एकने घटतो. या दोन्ही अर्ध्यांना महत्त्व आहे, आणि 4 हे त्याचे उत्तर आहे ज्याने घटवणे केले आणि गुणणे विसरले. (20 दुसऱ्यांदा अवकलन करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many conditions must hold at a point for a function to be continuous there?",
          hi: "किसी बिंदु पर फलन के संतत होने के लिए कितनी शर्तें पूरी होनी चाहिए?",
          mr: "एखाद्या बिंदूवर फलन संतत असण्यासाठी किती अटी पूर्ण व्हाव्या लागतात?",
        },
        answer: 3,
        wrong: [1, 2, 4],
        checkExpr: "1+1+1",
        solution: {
          en: "Three, and naming them separately is the point: the function must be defined there, the limit must exist there, and the two must be equal. Most students carry only the third, which is why a function with a hole in it — where the limit exists perfectly well and the function simply has no value — catches them out. The conditions are separable, and every discontinuity in this chapter is a case of exactly one of them failing. (1 keeps only the equality.)",
          hi: "तीन, और उन्हें अलग-अलग नाम देना ही बात है: फलन वहाँ परिभाषित हो, सीमा वहाँ अस्तित्व में हो, और दोनों बराबर हों। ज़्यादातर विद्यार्थी केवल तीसरी याद रखते हैं, इसीलिए छेद वाला फलन — जहाँ सीमा बिलकुल मौजूद है और फलन का बस कोई मान ही नहीं — उन्हें पकड़ लेता है। शर्तें अलग-अलग हैं, और इस अध्याय की हर असंततता ठीक इनमें से एक के विफल होने का मामला है। (1 केवल समानता रखता है।)",
          mr: "तीन, आणि त्यांना वेगवेगळी नावे देणे हाच मुद्दा आहे: फलन तिथे परिभाषित असावे, सीमा तिथे अस्तित्वात असावी, आणि दोन्ही समान असावेत. बहुतेक विद्यार्थी फक्त तिसरीच लक्षात ठेवतात, म्हणूनच छिद्र असलेले फलन — जिथे सीमा अगदी उत्तम अस्तित्वात आहे आणि फलनाला केवळ मूल्यच नाही — त्यांना पकडते. अटी वेगळ्या करता येतात, आणि या अध्यायातील प्रत्येक असंतता नेमकी यांपैकी एक अपयशी ठरण्याची घटना आहे. (1 फक्त समानता ठेवते.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 2,
        stem: {
          en: "f(x) = (x² − 9)/(x − 3) is undefined at x = 3. What value would make it continuous there?",
          hi: "f(x) = (x² − 9)/(x − 3), x = 3 पर अपरिभाषित है। वहाँ कौन-सा मान इसे संतत बना देगा?",
          mr: "f(x) = (x² − 9)/(x − 3) हे x = 3 वर अपरिभाषित आहे. तिथे कोणते मूल्य त्याला संतत करेल?",
        },
        answer: 6,
        wrong: [0, 3, 9],
        checkExpr: "3+3",
        solution: {
          en: "Factor the top: (x − 3)(x + 3)/(x − 3) = x + 3 for every x except 3 itself, and x + 3 at 3 is 6. The hole is removable, and that word is doing real work — the limit was there all along and only the value was missing, so supplying it repairs the function completely. Contrast this with 1/x at zero, where no value whatsoever would help because the limit itself does not exist. Removable and non-removable is the first useful division of discontinuities. (0 comes from putting 3 into the original denominator and stopping there.)",
          hi: "ऊपर के गुणनखंड करो: (x − 3)(x + 3)/(x − 3) = x + 3, हर x के लिए सिवाय स्वयं 3 के, और 3 पर x + 3 है 6. छेद हटाने योग्य है, और यह शब्द असली काम कर रहा है — सीमा हमेशा से वहीं थी और केवल मान ग़ायब था, अतः उसे दे देने से फलन पूरी तरह ठीक हो जाता है। इसकी तुलना शून्य पर 1/x से करो, जहाँ कोई भी मान मदद नहीं करेगा क्योंकि सीमा स्वयं अस्तित्व में नहीं। हटाने योग्य और न हटने योग्य असंतततताओं का पहला उपयोगी विभाजन है। (0 मूल हर में 3 रखकर वहीं रुक जाने से आता है।)",
          mr: "वरचे अवयव पाडा: (x − 3)(x + 3)/(x − 3) = x + 3, स्वतः 3 वगळता प्रत्येक x साठी, आणि 3 वर x + 3 म्हणजे 6. छिद्र काढून टाकण्याजोगे आहे, आणि हा शब्द खरे काम करत आहे — सीमा नेहमीच तिथे होती आणि केवळ मूल्यच गहाळ होते, म्हणून ते पुरवल्याने फलन पूर्णपणे दुरुस्त होते. याची तुलना शून्यावरील 1/x शी करा, जिथे कोणतेही मूल्य मदत करणार नाही कारण सीमाच अस्तित्वात नाही. काढण्याजोग्या आणि न काढण्याजोग्या हा असंततांचा पहिला उपयुक्त विभाग आहे. (0 मूळ छेदात 3 ठेवून तिथेच थांबल्याने येते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Using the product rule, what is the derivative of x² · x³ at x = 1?",
          hi: "गुणनफल नियम से x² · x³ का अवकलज x = 1 पर कितना है?",
          mr: "गुणाकार नियम वापरून x² · x³ चा अवकलज x = 1 वर किती?",
        },
        answer: 5,
        wrong: [6, 2, 3],
        checkExpr: "2*1+3*1",
        solution: {
          en: "The product rule gives 2x · x³ + x² · 3x², which at x = 1 is 2 + 3 = 5. Now check it the lazy way: x² · x³ is x⁵, whose derivative is 5x⁴, which is 5 at x = 1. The two agree, and that agreement is the point of the question — a rule that did not reproduce the answer you can get by simplifying first would be a wrong rule. Notice also what the product rule is NOT: 6 is the answer of somebody who multiplied the two derivatives, 2x × 3x², which would give 6x³ and is the single commonest error in the chapter.",
          hi: "गुणनफल नियम से 2x · x³ + x² · 3x² मिलता है, जो x = 1 पर 2 + 3 = 5 है। अब आलसी तरीक़े से जाँचो: x² · x³ है x⁵, जिसका अवकलज 5x⁴ है, जो x = 1 पर 5 है। दोनों सहमत हैं, और यही सहमति प्रश्न का मुद्दा है — जो नियम पहले सरल करके मिलने वाले उत्तर को दोहरा न सके वह ग़लत नियम होगा। यह भी ध्यान दो कि गुणनफल नियम क्या नहीं है: 6 उसका उत्तर है जिसने दोनों अवकलजों को गुणा कर दिया, 2x × 3x², जो 6x³ देता और अध्याय की सबसे आम अकेली ग़लती है।",
          mr: "गुणाकार नियमाने 2x · x³ + x² · 3x² मिळते, जे x = 1 वर 2 + 3 = 5 आहे. आता आळशी मार्गाने तपासा: x² · x³ म्हणजे x⁵, ज्याचा अवकलज 5x⁴ आहे, जो x = 1 वर 5 आहे. दोन्ही सहमत आहेत, आणि हीच सहमती प्रश्नाचा मुद्दा आहे — जो नियम आधी सोपे करून मिळणारे उत्तर पुन्हा देऊ शकत नाही तो चुकीचा नियम असेल. हेही लक्षात घ्या की गुणाकार नियम काय नाही: 6 हे त्याचे उत्तर आहे ज्याने दोन्ही अवकलजांचा गुणाकार केला, 2x × 3x², जे 6x³ देईल आणि अध्यायातील सर्वांत सामान्य एकटी चूक आहे.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "f(x) = |x| is continuous everywhere. At how many points is it NOT differentiable?",
          hi: "f(x) = |x| हर जगह संतत है। यह कितने बिंदुओं पर अवकलनीय नहीं है?",
          mr: "f(x) = |x| सर्वत्र संतत आहे. ते किती बिंदूंवर अवकलनीय नाही?",
        },
        answer: 1,
        wrong: [0, 2, 3],
        checkExpr: "2-1",
        solution: {
          en: "One — the origin, and only the origin. Everywhere else the graph is a straight line with a perfectly good slope of −1 or +1. At zero those two slopes meet and disagree, so the left-hand and right-hand difference quotients approach different numbers and no single derivative exists. This one point is the standing counterexample of the chapter: it shows that continuity does not imply differentiability, because here the function is continuous at exactly the place where it fails to be differentiable. The implication runs one way only. (0 assumes continuity is enough.)",
          hi: "एक — मूलबिंदु, और केवल मूलबिंदु। बाक़ी हर जगह आलेख एक सरल रेखा है जिसकी ढाल पूरी तरह ठीक −1 या +1 है। शून्य पर वे दोनों ढालें मिलती हैं और असहमत होती हैं, अतः बाएँ और दाएँ के अंतर-भागफल अलग-अलग संख्याओं की ओर बढ़ते हैं और कोई एक अवकलज अस्तित्व में नहीं आता। यही एक बिंदु अध्याय का स्थायी प्रतिउदाहरण है: यह दिखाता है कि संततता अवकलनीयता का अर्थ नहीं देती, क्योंकि यहाँ फलन ठीक उसी जगह संतत है जहाँ वह अवकलनीय होने में विफल है। निहितार्थ केवल एक ही दिशा में चलता है। (0 मान लेता है कि संततता काफ़ी है।)",
          mr: "एक — आदिबिंदू, आणि फक्त आदिबिंदूच. इतरत्र सर्वत्र आलेख एक सरळ रेषा आहे जिचा उतार पूर्णपणे व्यवस्थित −1 किंवा +1 आहे. शून्यावर ते दोन उतार भेटतात आणि असहमत होतात, म्हणून डावा आणि उजवा फरक-भागाकार वेगवेगळ्या संख्यांकडे जातात आणि कोणताही एक अवकलज अस्तित्वात येत नाही. हाच एक बिंदू अध्यायाचे कायमचे प्रतिउदाहरण आहे: तो दाखवतो की संततता अवकलनीयतेचा अर्थ देत नाही, कारण इथे फलन नेमके त्याच ठिकाणी संतत आहे जिथे ते अवकलनीय होण्यात अपयशी ठरते. निहितार्थ फक्त एकाच दिशेने चालतो. (0 गृहीत धरते की संततता पुरेशी आहे.)",
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
          en: "f(x) = kx for x ≤ 2 and f(x) = 3x − 2 for x > 2. What value of k makes f continuous at x = 2?",
          hi: "x ≤ 2 के लिए f(x) = kx और x > 2 के लिए f(x) = 3x − 2. k का कौन-सा मान f को x = 2 पर संतत बनाता है?",
          mr: "x ≤ 2 साठी f(x) = kx आणि x > 2 साठी f(x) = 3x − 2. k चे कोणते मूल्य f ला x = 2 वर संतत करते?",
        },
        answer: 2,
        wrong: [1, 3, 4],
        checkExpr: "(3*2-2)/2",
        solution: {
          en: "The two pieces must meet. From the right the limit is 3(2) − 2 = 4; from the left the value is k(2) = 2k; setting 2k = 4 gives k = 2. What makes this question worth doing is the method rather than the answer: a piecewise function is continuous at a join exactly when the two formulas AGREE there, so the condition is an equation, and an equation can be solved for whatever is unknown. That turns continuity from a property one checks into a constraint one imposes, which is how these questions are always set. (3 reads the coefficient off the second piece.)",
          hi: "दोनों टुकड़ों को मिलना चाहिए। दाएँ से सीमा है 3(2) − 2 = 4; बाएँ से मान है k(2) = 2k; 2k = 4 रखने पर k = 2. इस प्रश्न को करने लायक़ उत्तर नहीं, विधि बनाती है: कोई खंडश: फलन जोड़ पर ठीक तभी संतत है जब दोनों सूत्र वहाँ सहमत हों, अतः शर्त एक समीकरण है, और समीकरण को जो भी अज्ञात हो उसके लिए हल किया जा सकता है। इससे संततता जाँची जाने वाली विशेषता से लगाई जाने वाली अड़चन बन जाती है, और ये प्रश्न सदा ऐसे ही पूछे जाते हैं। (3 दूसरे टुकड़े से गुणांक पढ़ लेता है।)",
          mr: "दोन्ही तुकडे भेटले पाहिजेत. उजवीकडून सीमा आहे 3(2) − 2 = 4; डावीकडून मूल्य आहे k(2) = 2k; 2k = 4 ठेवल्यास k = 2. हा प्रश्न करण्याजोगा उत्तराने नव्हे तर पद्धतीने होतो: एखादे खंडशः फलन जोडावर नेमके तेव्हाच संतत असते जेव्हा दोन्ही सूत्रे तिथे सहमत असतात, म्हणून अट एक समीकरण आहे, आणि समीकरण जे काही अज्ञात असेल त्यासाठी सोडवता येते. यामुळे संततता तपासायच्या गुणधर्मापासून लादायच्या बंधनात बदलते, आणि हे प्रश्न नेहमी असेच विचारले जातात. (3 दुसऱ्या तुकड्यातून गुणांक वाचते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "Using the chain rule, what is the derivative of (2x + 1)³ at x = 0?",
          hi: "शृंखला नियम से (2x + 1)³ का अवकलज x = 0 पर कितना है?",
          mr: "साखळी नियम वापरून (2x + 1)³ चा अवकलज x = 0 वर किती?",
        },
        answer: 6,
        wrong: [3, 2, 12],
        checkExpr: "3*1*2",
        solution: {
          en: "Outer derivative times inner derivative: 3(2x + 1)² × 2, which at x = 0 is 3 × 1 × 2 = 6. The factor of 2 is the whole content of the chain rule and the whole of what gets forgotten — 3 is the answer of somebody who differentiated the outside and stopped, as if the inside were simply x. A useful way to feel why the 2 is there: the inner function runs twice as fast as x does, so the outer function is fed its input at double speed, and rates multiply. (12 differentiates twice.)",
          hi: "बाहरी अवकलज गुणा भीतरी अवकलज: 3(2x + 1)² × 2, जो x = 0 पर 3 × 1 × 2 = 6 है। 2 का गुणक शृंखला नियम की पूरी सामग्री है और पूरी तरह वही है जो भुला दिया जाता है — 3 उसका उत्तर है जिसने बाहर का अवकलन किया और रुक गया, मानो भीतर बस x हो। 2 क्यों है यह महसूस करने का एक उपयोगी तरीक़ा: भीतरी फलन x से दुगनी तेज़ चलता है, अतः बाहरी फलन को उसका निवेश दुगनी गति से दिया जाता है, और दरें गुणा होती हैं। (12 दो बार अवकलन करता है।)",
          mr: "बाह्य अवकलज गुणिले आंतरिक अवकलज: 3(2x + 1)² × 2, जे x = 0 वर 3 × 1 × 2 = 6 आहे. 2 चा गुणक साखळी नियमाचा अख्खा आशय आहे आणि नेमके तेच विसरले जाते — 3 हे त्याचे उत्तर आहे ज्याने बाहेरचे अवकलन केले आणि थांबले, जणू आत केवळ x असावा. 2 का आहे हे जाणवण्याचा उपयुक्त मार्ग: आंतरिक फलन x पेक्षा दुप्पट वेगाने चालते, म्हणून बाह्य फलनाला त्याचे निविष्ट दुप्पट वेगाने दिले जाते, आणि दर गुणले जातात. (12 दोनदा अवकलन करते.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 4,
        stem: {
          en: "f(x) = x³ − 3x. Rolle's theorem guarantees a point with zero derivative between the roots x = 0 and x = √3. How many such points does the whole interval [−√3, √3] contain?",
          hi: "f(x) = x³ − 3x. रोल प्रमेय मूलों x = 0 और x = √3 के बीच शून्य अवकलज वाले एक बिंदु की गारंटी देता है। पूरे अंतराल [−√3, √3] में ऐसे कितने बिंदु हैं?",
          mr: "f(x) = x³ − 3x. रोलचे प्रमेय मुळे x = 0 आणि x = √3 यांदरम्यान शून्य अवकलज असलेल्या एका बिंदूची हमी देते. संपूर्ण अंतराल [−√3, √3] मध्ये असे किती बिंदू आहेत?",
        },
        answer: 2,
        wrong: [1, 3, 0],
        checkExpr: "3-1",
        solution: {
          en: "f'(x) = 3x² − 3 = 0 gives x = ±1, so there are 2 of them, one in each half. The point of asking it this way is to separate what Rolle's theorem PROMISES from what is actually there. The theorem is an existence statement: given equal values at two endpoints it guarantees at least one interior point with zero derivative, and it says nothing whatever about how many. Here the honest count is two, and a theorem that promised exactly one would have been false. Existence theorems are cheap to satisfy and easy to over-read, and this chapter is full of them. (1 answers what the theorem promises rather than what the function does.)",
          hi: "f'(x) = 3x² − 3 = 0 से x = ±1 मिलता है, अतः वे 2 हैं, हर आधे में एक। इस तरह पूछने का मक़सद यह अलग करना है कि रोल प्रमेय क्या वादा करता है और असल में है क्या। प्रमेय अस्तित्व का कथन है: दो सिरों पर बराबर मान मिलने पर वह शून्य अवकलज वाले कम से कम एक भीतरी बिंदु की गारंटी देता है, और कितने हैं इस बारे में कुछ नहीं कहता। यहाँ ईमानदार गिनती दो है, और ठीक एक का वादा करने वाला प्रमेय ग़लत होता। अस्तित्व-प्रमेय पूरा करना सस्ता है और उन्हें ज़्यादा पढ़ लेना आसान, और यह अध्याय उनसे भरा है। (1 उत्तर देता है कि प्रमेय क्या वादा करता है, न कि फलन क्या करता है।)",
          mr: "f'(x) = 3x² − 3 = 0 वरून x = ±1 मिळते, म्हणून ते 2 आहेत, प्रत्येक अर्ध्यात एक. अशा प्रकारे विचारण्याचा हेतू हे वेगळे करणे आहे की रोलचे प्रमेय काय वचन देते आणि प्रत्यक्षात काय आहे. प्रमेय अस्तित्वाचे विधान आहे: दोन टोकांवर समान मूल्ये मिळाल्यास ते शून्य अवकलज असलेल्या किमान एका आंतरिक बिंदूची हमी देते, आणि किती आहेत याबद्दल काहीही सांगत नाही. इथे प्रामाणिक मोजणी दोन आहे, आणि नेमक्या एकाचे वचन देणारे प्रमेय चुकीचे ठरले असते. अस्तित्व-प्रमेये पूर्ण करणे स्वस्त आहे आणि ती जास्त वाचणे सोपे, आणि हा अध्याय त्यांनी भरलेला आहे. (1 प्रमेय काय वचन देते ते उत्तर देते, फलन काय करते ते नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "If y = eˣ, the derivative equals the function itself. How many times must y be differentiated before the result differs from y?",
          hi: "यदि y = eˣ, तो अवकलज स्वयं फलन के बराबर है। परिणाम y से भिन्न होने से पहले y का कितनी बार अवकलन करना होगा?",
          mr: "जर y = eˣ, तर अवकलज स्वतः फलनाइतकाच आहे. निकाल y हून वेगळा होण्याआधी y चे किती वेळा अवकलन करावे लागेल?",
        },
        answer: 0,
        wrong: [1, 2, 4],
        checkExpr: "1-1",
        solution: {
          en: "Zero, because it never differs — no number of differentiations changes eˣ, so there is no such count and the honest answer is that the process never gets there. That is a fixed point of the differentiation operator, and it is why e is the base worth defining. Any other exponential aˣ differentiates to aˣ ln a, picking up a constant factor each time; e is precisely the base for which that factor is 1. The number e is not chosen for elegance, then, but for this: it is the unique base at which growth rate and size coincide. (1 answers as though the first derivative were something new.)",
          hi: "शून्य, क्योंकि वह कभी भिन्न होता ही नहीं — कितनी भी बार अवकलन करने से eˣ नहीं बदलता, अतः ऐसी कोई गिनती नहीं और ईमानदार उत्तर यह है कि प्रक्रिया वहाँ पहुँचती ही नहीं। यह अवकलन संकारक का स्थिर बिंदु है, और इसीलिए e परिभाषित करने लायक़ आधार है। कोई भी दूसरा चरघातांकी aˣ अवकलित होकर aˣ ln a बनता है, हर बार एक अचर गुणक उठा लेता है; e ठीक वही आधार है जिसके लिए वह गुणक 1 है। अतः संख्या e सुंदरता के लिए नहीं चुनी गई, बल्कि इसीलिए: यह वह अकेला आधार है जिस पर वृद्धि-दर और आकार एक हो जाते हैं। (1 ऐसे उत्तर देता है मानो पहला अवकलज कुछ नया हो।)",
          mr: "शून्य, कारण तो कधीच वेगळा होत नाही — कितीही वेळा अवकलन केल्याने eˣ बदलत नाही, म्हणून अशी कोणतीही मोजणी नाही आणि प्रामाणिक उत्तर हे आहे की प्रक्रिया तिथवर पोहोचतच नाही. हा अवकलन संकारकाचा स्थिर बिंदू आहे, आणि म्हणूनच e हा परिभाषित करण्याजोगा आधार आहे. इतर कोणतेही घातांकी aˣ अवकलित होऊन aˣ ln a बनते, दरवेळी एक अचल गुणक उचलते; e नेमका तोच आधार आहे ज्यासाठी तो गुणक 1 आहे. म्हणून संख्या e सौंदर्यासाठी निवडलेली नाही, तर यासाठी: तो एकमेव आधार आहे ज्यावर वाढीचा दर आणि आकार एकरूप होतात. (1 असे उत्तर देते जणू पहिला अवकलज काहीतरी नवीन असावा.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 5,
        stem: {
          en: "f(x) = x² sin(1/x) for x ≠ 0 and f(0) = 0. Counting continuity and differentiability at x = 0 as two separate properties, how many of them does f have there?",
          hi: "x ≠ 0 के लिए f(x) = x² sin(1/x) और f(0) = 0. x = 0 पर संततता और अवकलनीयता को दो अलग गुण मानते हुए, f के पास वहाँ इनमें से कितने हैं?",
          mr: "x ≠ 0 साठी f(x) = x² sin(1/x) आणि f(0) = 0. x = 0 वर संततता आणि अवकलनीयता हे दोन वेगळे गुणधर्म मानल्यास, f कडे तिथे यांपैकी किती आहेत?",
        },
        answer: 2,
        wrong: [0, 1, 3],
        checkExpr: "1+1",
        solution: {
          en: "Both, which is the surprise. The sine oscillates infinitely often as x approaches zero and never settles, so one expects trouble; but it is bounded between −1 and 1, and x² crushes anything bounded down to zero. So the limit is 0 = f(0) and the function is continuous. For differentiability, the difference quotient is x² sin(1/x)/x = x sin(1/x), and x crushes the bounded factor again, so the derivative at zero exists and equals 0. Two things are worth taking from this. First, an infinitely wild oscillation is not by itself a barrier — what matters is whether something is shrinking faster than the wildness grows, and squeezing a bounded factor is the standard way to show that. Second, note how close the margin is: with x¹ instead of x² the function is still continuous but the difference quotient becomes sin(1/x), which has no limit, and differentiability fails. One power of x separates the two properties, which is as concrete a demonstration as one could want that they are genuinely different conditions. (1 assumes the oscillation must break one of them.)",
          hi: "दोनों, और यही अचरज है। x के शून्य की ओर बढ़ने पर ज्या अनंत बार दोलन करती है और कभी थमती नहीं, अतः दिक़्क़त की आशंका होती है; पर वह −1 और 1 के बीच परिबद्ध है, और x² किसी भी परिबद्ध चीज़ को कुचलकर शून्य कर देता है। अतः सीमा 0 = f(0) है और फलन संतत है। अवकलनीयता के लिए अंतर-भागफल है x² sin(1/x)/x = x sin(1/x), और x फिर परिबद्ध गुणक को कुचल देता है, अतः शून्य पर अवकलज मौजूद है और 0 के बराबर है। इससे दो बातें लेने लायक़ हैं। पहली, अनंत उन्मत्त दोलन अपने आप में बाधा नहीं है — मायने यह रखता है कि क्या कुछ उस उन्मत्तता से तेज़ी से सिकुड़ रहा है, और परिबद्ध गुणक को दबाना यह दिखाने का मानक तरीक़ा है। दूसरी, ध्यान दो कि हाशिया कितना पतला है: x² की जगह x¹ हो तो फलन तब भी संतत है पर अंतर-भागफल sin(1/x) बन जाता है, जिसकी कोई सीमा नहीं, और अवकलनीयता विफल हो जाती है। x की एक घात दोनों गुणों को अलग करती है, जो इस बात का उतना ही ठोस प्रदर्शन है जितना कोई चाहे कि वे सचमुच अलग शर्तें हैं। (1 मान लेता है कि दोलन को इनमें से एक तोड़ना ही होगा।)",
          mr: "दोन्ही, आणि हेच आश्चर्य आहे. x शून्याकडे जाताना ज्या अनंत वेळा दोलन करते आणि कधीच स्थिरावत नाही, म्हणून अडचणीची शंका येते; पण ती −1 आणि 1 दरम्यान बद्ध आहे, आणि x² कोणत्याही बद्ध गोष्टीला चिरडून शून्य करते. म्हणून सीमा 0 = f(0) आहे आणि फलन संतत आहे. अवकलनीयतेसाठी फरक-भागाकार आहे x² sin(1/x)/x = x sin(1/x), आणि x पुन्हा बद्ध गुणकाला चिरडते, म्हणून शून्यावर अवकलज अस्तित्वात आहे आणि 0 इतका आहे. यातून दोन गोष्टी घेण्याजोग्या आहेत. पहिली, अनंत उन्मत्त दोलन स्वतःच अडथळा नाही — महत्त्वाचे हे की काहीतरी त्या उन्मत्तपणाहून वेगाने आकुंचन पावत आहे का, आणि बद्ध गुणकाला दाबणे हा ते दाखवण्याचा प्रमाण मार्ग आहे. दुसरी, समास किती अरुंद आहे ते लक्षात घ्या: x² ऐवजी x¹ असल्यास फलन तरीही संतत आहे पण फरक-भागाकार sin(1/x) बनतो, ज्याला सीमा नाही, आणि अवकलनीयता अपयशी ठरते. x ची एक घात दोन्ही गुणधर्म वेगळे करते, जे ते खरोखर वेगळ्या अटी आहेत याचे कोणालाही हवे तितके ठोस प्रात्यक्षिक आहे. (1 गृहीत धरते की दोलनाने यांपैकी एक मोडलेच पाहिजे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "The greatest-integer function ⌊x⌋ is discontinuous at every integer. How many points of discontinuity does it have in the interval [0, 5]?",
          hi: "महत्तम पूर्णांक फलन ⌊x⌋ हर पूर्णांक पर असंतत है। अंतराल [0, 5] में इसके कितने असंततता-बिंदु हैं?",
          mr: "महत्तम पूर्णांक फलन ⌊x⌋ प्रत्येक पूर्णांकावर असंतत आहे. अंतराल [0, 5] मध्ये त्याचे किती असंतता-बिंदू आहेत?",
        },
        answer: 5,
        wrong: [6, 4, 3],
        checkExpr: "6-1",
        solution: {
          en: "The integers in [0, 5] number six, but 0 is not a point of discontinuity of the function restricted to this interval: there is nothing to its left inside the interval, the right-hand limit is 0, and that matches the value. So the count is 5 — the integers 1, 2, 3, 4 and 5. This is the whole lesson of the question, and it is not a quibble: continuity at an endpoint is ONE-SIDED, because a limit can only be taken through points where the function is defined. The same function on the whole real line would be discontinuous at 0 too, so the answer changes with the domain even though the formula does not. Domain is part of a function, and questions like this are the reason to say so. (6 counts the integers and forgets that an endpoint is judged from one side only.)",
          hi: "[0, 5] के पूर्णांक छह हैं, पर 0 इस अंतराल तक सीमित फलन का असंततता-बिंदु नहीं है: अंतराल के भीतर उसके बाएँ कुछ है ही नहीं, दायाँ सीमांत 0 है, और वह मान से मेल खाता है। अतः गिनती 5 है — पूर्णांक 1, 2, 3, 4 और 5. यही प्रश्न का पूरा सबक़ है, और यह मीनमेख नहीं: सिरे पर संततता एकपक्षीय होती है, क्योंकि सीमा केवल उन बिंदुओं से होकर ली जा सकती है जहाँ फलन परिभाषित है। वही फलन पूरी वास्तविक रेखा पर 0 पर भी असंतत होता, अतः सूत्र न बदलने पर भी उत्तर प्रांत के साथ बदल जाता है। प्रांत फलन का हिस्सा है, और ऐसे प्रश्न ही यह कहने का कारण हैं। (6 पूर्णांक गिन लेता है और भूल जाता है कि सिरे को केवल एक ओर से आँका जाता है।)",
          mr: "[0, 5] मधील पूर्णांक सहा आहेत, पण 0 हा या अंतरालापुरत्या मर्यादित फलनाचा असंतता-बिंदू नाही: अंतरालाच्या आत त्याच्या डावीकडे काहीच नाही, उजवी सीमा 0 आहे, आणि ती मूल्याशी जुळते. म्हणून मोजणी 5 आहे — पूर्णांक 1, 2, 3, 4 आणि 5. हाच प्रश्नाचा अख्खा धडा आहे, आणि ही कुरबुर नाही: टोकावरील संततता एकबाजूची असते, कारण सीमा केवळ त्याच बिंदूंमधून घेता येते जिथे फलन परिभाषित आहे. तेच फलन संपूर्ण वास्तव रेषेवर 0 वरही असंतत असते, म्हणून सूत्र न बदलताही उत्तर प्रांतासोबत बदलते. प्रांत फलनाचा भाग आहे, आणि असे प्रश्नच हे सांगण्याचे कारण आहेत. (6 पूर्णांक मोजते आणि विसरते की टोक फक्त एका बाजूने तपासले जाते.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 6,
        stem: {
          en: "A function is continuous on [0, 1] but differentiable at no point of it. Of the two implications 'differentiable ⇒ continuous' and 'continuous ⇒ differentiable', how many does such a function disprove?",
          hi: "कोई फलन [0, 1] पर संतत है पर उसके किसी भी बिंदु पर अवकलनीय नहीं। दो निहितार्थों 'अवकलनीय ⇒ संतत' और 'संतत ⇒ अवकलनीय' में से ऐसा फलन कितनों को ग़लत सिद्ध करता है?",
          mr: "एखादे फलन [0, 1] वर संतत आहे पण त्याच्या कोणत्याही बिंदूवर अवकलनीय नाही. 'अवकलनीय ⇒ संतत' आणि 'संतत ⇒ अवकलनीय' या दोन निहितार्थांपैकी असे फलन किती खोटे ठरवते?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        checkExpr: "2-1",
        solution: {
          en: "One — the second, and only the second. The first implication is a theorem and no example can touch it: differentiability at a point requires the difference quotient to converge, and that forces the numerator to zero, which is continuity. What such a function kills is the converse, and it kills it far more thoroughly than |x| does. |x| shows the converse fails at one point out of infinitely many, which leaves open the comfortable reading that non-differentiability is a rare defect at isolated corners. Weierstrass's function, built from an infinite sum of ever-faster, ever-smaller cosine waves, is continuous everywhere and has a corner at every single point — no interval of it, however short, contains a place where a tangent line exists. The historical value of the example is exactly this: for most of the eighteenth century mathematicians treated continuity and differentiability as practically interchangeable, drew their intuitions from curves one can sketch, and the sketchable curves were misleading them. And the deeper point, established later, is that this behaviour is not the exception but the rule — in a precise measure-theoretic sense, ALMOST EVERY continuous function is nowhere differentiable, and the smooth curves of a textbook are the vanishingly rare special cases. The picture in one's head was not merely incomplete; it was inverted. (2 supposes a strong enough counterexample overturns both directions, which no example can do to a proved theorem.)",
          hi: "एक — दूसरा, और केवल दूसरा। पहला निहितार्थ प्रमेय है और कोई उदाहरण उसे छू नहीं सकता: किसी बिंदु पर अवकलनीयता के लिए अंतर-भागफल का अभिसरण चाहिए, और वह अंश को शून्य होने पर मजबूर करता है, जो संततता है। ऐसा फलन जिसे मारता है वह विलोम है, और वह उसे |x| से कहीं अधिक पूरी तरह मारता है। |x| दिखाता है कि विलोम अनंत में से एक बिंदु पर विफल होता है, जिससे यह आरामदेह पाठ खुला रह जाता है कि अनवकलनीयता अलग-थलग कोनों पर एक दुर्लभ दोष है। वाइयरश्ट्रास का फलन, उत्तरोत्तर तेज़ और छोटी कोज्या तरंगों के अनंत योग से बना, हर जगह संतत है और हर एक बिंदु पर उसका कोना है — उसका कोई अंतराल, चाहे कितना छोटा, ऐसी जगह नहीं रखता जहाँ स्पर्शरेखा हो। उदाहरण का ऐतिहासिक मूल्य ठीक यही है: अठारहवीं सदी के अधिकांश समय गणितज्ञ संततता और अवकलनीयता को व्यावहारिक रूप से अदल-बदल मानते रहे, अपनी अंतर्दृष्टि उन वक्रों से लेते रहे जिन्हें खींचा जा सकता है, और खींचे जा सकने वाले वक्र उन्हें भरमा रहे थे। और गहरी बात, जो बाद में स्थापित हुई, यह है कि यह व्यवहार अपवाद नहीं नियम है — एक ठीक-ठीक माप-सैद्धांतिक अर्थ में लगभग हर संतत फलन कहीं भी अवकलनीय नहीं, और पाठ्यपुस्तक के चिकने वक्र लुप्तप्राय दुर्लभ विशेष मामले हैं। दिमाग़ की तस्वीर महज़ अधूरी नहीं थी; वह उलटी थी। (2 मान लेता है कि पर्याप्त सशक्त प्रतिउदाहरण दोनों दिशाएँ पलट देता है, जो कोई उदाहरण किसी सिद्ध प्रमेय के साथ नहीं कर सकता।)",
          mr: "एक — दुसरा, आणि फक्त दुसराच. पहिला निहितार्थ प्रमेय आहे आणि कोणतेही उदाहरण त्याला स्पर्श करू शकत नाही: एखाद्या बिंदूवरील अवकलनीयतेसाठी फरक-भागाकाराचे अभिसरण लागते, आणि ते अंशाला शून्य होण्यास भाग पाडते, जी संततता आहे. असे फलन ज्याला मारते तो व्यत्यास आहे, आणि ते त्याला |x| हून कितीतरी अधिक पूर्णपणे मारते. |x| दाखवते की व्यत्यास अनंतांपैकी एका बिंदूवर अपयशी ठरतो, ज्यामुळे हे सोयीस्कर वाचन खुले राहते की अनवकलनीयता वेगळ्या कोपऱ्यांवरील दुर्मीळ दोष आहे. वायरश्ट्रासचे फलन, उत्तरोत्तर वेगवान आणि लहान कोज्या लहरींच्या अनंत बेरजेतून बनलेले, सर्वत्र संतत आहे आणि प्रत्येक एका बिंदूवर त्याला कोपरा आहे — त्याचे कोणतेही अंतराल, कितीही लहान असो, स्पर्शरेषा असलेली जागा बाळगत नाही. उदाहरणाचे ऐतिहासिक मूल्य नेमके हेच आहे: अठराव्या शतकातील बहुतांश काळ गणितज्ञ संततता आणि अवकलनीयता व्यवहारात अदलाबदल करण्याजोग्या मानत राहिले, आपली अंतर्दृष्टी काढता येणाऱ्या वक्रांतून घेत राहिले, आणि काढता येणारे वक्र त्यांना फसवत होते. आणि नंतर सिद्ध झालेला अधिक खोल मुद्दा हा की हे वर्तन अपवाद नसून नियम आहे — एका नेमक्या माप-सैद्धांतिक अर्थाने जवळजवळ प्रत्येक संतत फलन कुठेही अवकलनीय नाही, आणि पाठ्यपुस्तकातील गुळगुळीत वक्र हे लुप्तप्राय दुर्मीळ विशेष प्रसंग आहेत. डोक्यातले चित्र केवळ अपूर्ण नव्हते; ते उलटे होते. (2 गृहीत धरते की पुरेसे सशक्त प्रतिउदाहरण दोन्ही दिशा उलटवते, जे कोणतेही उदाहरण सिद्ध प्रमेयाशी करू शकत नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "For f(x) = x³ on [−1, 1], the mean value theorem's conclusion holds at c where 3c² = 1. Now consider g(x) = |x| on the same interval, where no such c exists. How many of the theorem's three hypotheses does g fail?",
          hi: "[−1, 1] पर f(x) = x³ के लिए माध्यमान प्रमेय का निष्कर्ष उस c पर लागू होता है जहाँ 3c² = 1. अब उसी अंतराल पर g(x) = |x| लो, जहाँ ऐसा कोई c नहीं है। g प्रमेय की तीन परिकल्पनाओं में से कितनी में विफल होता है?",
          mr: "[−1, 1] वर f(x) = x³ साठी मध्यमान प्रमेयाचा निष्कर्ष त्या c वर लागू होतो जिथे 3c² = 1. आता त्याच अंतरालावर g(x) = |x| घ्या, जिथे असा कोणताही c नाही. g प्रमेयाच्या तीन गृहीतकांपैकी किती अपयशी ठरते?",
        },
        answer: 1,
        wrong: [2, 3, 0],
        checkExpr: "3-2",
        solution: {
          en: "One. The mean value theorem asks for three things: continuity on the closed interval, differentiability on the open interval, and — this is the third, and it is a hypothesis about the interval rather than about the function — that the interval be a genuine one with a < b. g is continuous on [−1, 1] and the interval is fine; what it fails is differentiability on the open interval, because of the corner at 0. Exactly one hypothesis breaks, and the conclusion collapses completely: g(1) = g(−1) = 1, so the required slope is 0, and yet g' is −1 to the left of the origin and +1 to its right and never 0 anywhere. There is a habit worth building here, and it is the reason for asking the question this way round rather than asking what the theorem says. When a theorem's conclusion visibly fails, the useful move is not to doubt the theorem but to go back and find WHICH hypothesis was not met — and the answer is almost always exactly one, sitting at a single point. A theorem is not a general truth with exceptions; it is a contract, and a broken contract has a specific breach. Locating that breach teaches more than the statement does, because it shows what each condition was there to buy: continuity buys the endpoints, differentiability buys the interior, and here the interior is where the price was not paid. (3 supposes that a failed conclusion means every hypothesis failed.)",
          hi: "एक। माध्यमान प्रमेय तीन चीज़ें माँगता है: बंद अंतराल पर संततता, खुले अंतराल पर अवकलनीयता, और — यह तीसरी है, और यह फलन के बजाय अंतराल के बारे में परिकल्पना है — कि अंतराल a < b वाला असली अंतराल हो। g, [−1, 1] पर संतत है और अंतराल ठीक है; वह विफल होता है खुले अंतराल पर अवकलनीयता में, 0 के कोने के कारण। ठीक एक परिकल्पना टूटती है, और निष्कर्ष पूरी तरह ढह जाता है: g(1) = g(−1) = 1, अतः अपेक्षित ढाल 0 है, फिर भी g' मूलबिंदु के बाएँ −1 और दाएँ +1 है और कहीं भी 0 नहीं। यहाँ बनाने लायक़ एक आदत है, और इसी वजह से प्रश्न प्रमेय क्या कहता है के बजाय इस ओर से पूछा गया है। जब किसी प्रमेय का निष्कर्ष खुलकर विफल हो, तो उपयोगी क़दम प्रमेय पर संदेह करना नहीं बल्कि लौटकर यह ढूँढ़ना है कि कौन-सी परिकल्पना पूरी नहीं हुई — और उत्तर लगभग हमेशा ठीक एक होता है, किसी एक बिंदु पर बैठा। प्रमेय अपवादों वाला सामान्य सत्य नहीं; वह अनुबंध है, और टूटे अनुबंध का एक विशिष्ट उल्लंघन होता है। उस उल्लंघन को ढूँढ़ना कथन से अधिक सिखाता है, क्योंकि वह दिखाता है कि हर शर्त किसलिए वहाँ थी: संततता सिरे ख़रीदती है, अवकलनीयता भीतर ख़रीदती है, और यहाँ भीतर ही वह जगह है जहाँ क़ीमत नहीं चुकाई गई। (3 मान लेता है कि विफल निष्कर्ष का अर्थ है हर परिकल्पना विफल हुई।)",
          mr: "एक. मध्यमान प्रमेय तीन गोष्टी मागते: बंद अंतरालावर संततता, खुल्या अंतरालावर अवकलनीयता, आणि — ही तिसरी आहे, आणि हे फलनाऐवजी अंतरालाबद्दलचे गृहीतक आहे — की अंतराल a < b असलेले खरे अंतराल असावे. g हे [−1, 1] वर संतत आहे आणि अंतराल ठीक आहे; ते अपयशी ठरते खुल्या अंतरालावरील अवकलनीयतेत, 0 वरील कोपऱ्यामुळे. नेमके एक गृहीतक मोडते, आणि निष्कर्ष पूर्णपणे कोसळतो: g(1) = g(−1) = 1, म्हणून अपेक्षित उतार 0 आहे, तरीही g' आदिबिंदूच्या डावीकडे −1 आणि उजवीकडे +1 आहे आणि कुठेही 0 नाही. इथे बनवण्याजोगी एक सवय आहे, आणि याच कारणाने प्रश्न प्रमेय काय सांगते याऐवजी या बाजूने विचारला आहे. जेव्हा एखाद्या प्रमेयाचा निष्कर्ष उघडपणे अपयशी ठरतो, तेव्हा उपयुक्त पाऊल प्रमेयावर शंका घेणे नव्हे तर मागे जाऊन कोणते गृहीतक पूर्ण झाले नाही हे शोधणे आहे — आणि उत्तर जवळजवळ नेहमी नेमके एकच असते, एका बिंदूवर बसलेले. प्रमेय हे अपवादांसह असलेले सर्वसाधारण सत्य नाही; तो करार आहे, आणि मोडलेल्या कराराचा एक विशिष्ट भंग असतो. तो भंग शोधणे विधानाहून अधिक शिकवते, कारण ते दाखवते की प्रत्येक अट कशासाठी तिथे होती: संततता टोके विकत घेते, अवकलनीयता आतील भाग विकत घेते, आणि इथे आतील भागच ती जागा आहे जिथे किंमत भरली गेली नाही. (3 गृहीत धरते की अपयशी निष्कर्षाचा अर्थ प्रत्येक गृहीतक अपयशी ठरले.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-continuity-and-differentiability",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 5 — Continuity and Differentiability",
      name: "Continuity and Differentiability",
      summary:
        "Three separable conditions for a curve to have no break in it and a fourth, stronger demand that it have no corner either: why a hole that can be filled is a different kind of failure from one that cannot, why the implication between the two properties runs one way only, and why a single power of x is enough to separate them.",
      position: 5,
      translations: {
        hi: {
          name: "संततता और अवकलनीयता",
          summary:
            "किसी वक्र में टूट न होने की तीन अलग-अलग शर्तें और एक चौथी, कड़ी माँग कि उसमें कोना भी न हो: भरा जा सकने वाला छेद न भरे जा सकने वाले से भिन्न प्रकार की विफलता क्यों है, दोनों गुणों के बीच निहितार्थ केवल एक दिशा में क्यों चलता है, और x की एक घात उन्हें अलग करने के लिए क्यों काफ़ी है।",
        },
        mr: {
          name: "संततता आणि अवकलनीयता",
          summary:
            "एखाद्या वक्रात खंड नसण्याच्या तीन वेगवेगळ्या अटी आणि चौथी, कडक मागणी की त्यात कोपराही नसावा: भरता येणारे छिद्र न भरता येणाऱ्याहून वेगळ्या प्रकारचे अपयश का आहे, दोन्ही गुणधर्मांमधील निहितार्थ फक्त एकाच दिशेने का चालतो, आणि x ची एक घात त्यांना वेगळे करण्यास का पुरेशी आहे.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 6 — Application of Derivatives (a zero slope proves nothing alone) */
/* ------------------------------------------------------------------------- */
function applicationOfDerivatives12(): TopicFileOut {
  const rand = rng("maths-12-application-of-derivatives");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "The side of a square increases at 3 cm per second. At what rate is the perimeter increasing, in cm per second?",
          hi: "किसी वर्ग की भुजा 3 सेमी प्रति सेकंड की दर से बढ़ती है। परिमाप किस दर से बढ़ रहा है, सेमी प्रति सेकंड में?",
          mr: "एखाद्या चौरसाची बाजू दर सेकंदाला 3 सेमी वाढते. परिमिती किती दराने वाढत आहे, सेमी प्रति सेकंदात?",
        },
        answer: 12,
        wrong: [3, 6, 9],
        checkExpr: "4*3",
        solution: {
          en: "The perimeter is 4s, so its rate is 4 times the rate of s: 4 × 3 = 12. The whole of related rates is in that one line — differentiate the relationship between the quantities, and the relationship between their rates comes out. Note that this answer does not depend on how big the square currently is, which is a hint that perimeter is linear in the side; area will not be so obliging. (3 gives the side's own rate.)",
          hi: "परिमाप 4s है, अतः उसकी दर s की दर की 4 गुना है: 4 × 3 = 12. संबंधित दरों की पूरी बात उसी एक पंक्ति में है — राशियों के बीच के संबंध का अवकलन करो, और उनकी दरों के बीच का संबंध निकल आता है। ध्यान दो कि यह उत्तर इस पर निर्भर नहीं कि वर्ग इस समय कितना बड़ा है, जो संकेत है कि परिमाप भुजा में रैखिक है; क्षेत्रफल इतना मेहरबान नहीं होगा। (3 भुजा की अपनी दर देता है।)",
          mr: "परिमिती 4s आहे, म्हणून तिचा दर s च्या दराच्या 4 पट आहे: 4 × 3 = 12. संबंधित दरांची अख्खी गोष्ट त्याच एका ओळीत आहे — राशींमधील संबंधाचे अवकलन करा, आणि त्यांच्या दरांमधील संबंध बाहेर येतो. लक्षात घ्या की हे उत्तर चौरस सध्या किती मोठा आहे यावर अवलंबून नाही, जो संकेत आहे की परिमिती बाजूत रैखिक आहे; क्षेत्रफळ इतके मेहेरबान असणार नाही. (3 बाजूचा स्वतःचा दर देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "For f(x) = x² − 4x + 7, at what value of x does f'(x) equal zero?",
          hi: "f(x) = x² − 4x + 7 के लिए, x के किस मान पर f'(x) शून्य है?",
          mr: "f(x) = x² − 4x + 7 साठी, x च्या कोणत्या मूल्यावर f'(x) शून्य आहे?",
        },
        answer: 2,
        wrong: [4, 0, 7],
        checkExpr: "4/2",
        solution: {
          en: "f'(x) = 2x − 4, and 2x − 4 = 0 gives x = 4/2 = 2. Such a point is called critical or stationary, and both words are chosen carefully: the function has stopped rising and not yet started falling, so this is where a turning point can be. Can be, not must be — that qualification is the whole business of the next few questions. (4 reads the coefficient without dividing.)",
          hi: "f'(x) = 2x − 4, और 2x − 4 = 0 से x = 4/2 = 2. ऐसे बिंदु को क्रांतिक या स्थिर कहते हैं, और दोनों शब्द सोच-समझकर चुने गए हैं: फलन बढ़ना बंद कर चुका है और घटना शुरू नहीं किया, अतः यहीं कोई मोड़-बिंदु हो सकता है। हो सकता है, होना ही चाहिए नहीं — यही शर्त अगले कुछ प्रश्नों का पूरा कारोबार है। (4 गुणांक बिना भाग दिए पढ़ लेता है।)",
          mr: "f'(x) = 2x − 4, आणि 2x − 4 = 0 वरून x = 4/2 = 2. अशा बिंदूला क्रांतिक किंवा स्थिर म्हणतात, आणि दोन्ही शब्द काळजीपूर्वक निवडलेले आहेत: फलनाने वाढणे थांबवले आहे आणि घटणे सुरू केलेले नाही, म्हणून इथेच वळणबिंदू असू शकतो. असू शकतो, असलाच पाहिजे नाही — हीच अट पुढील काही प्रश्नांचा अख्खा व्यवसाय आहे. (4 गुणांक भागाकार न करता वाचते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the slope of the tangent to y = x² at the point (3, 9)?",
          hi: "y = x² की स्पर्शरेखा की ढाल बिंदु (3, 9) पर कितनी है?",
          mr: "y = x² च्या स्पर्शरेषेचा उतार (3, 9) या बिंदूवर किती?",
        },
        answer: 6,
        wrong: [9, 3, 2],
        checkExpr: "2*3",
        solution: {
          en: "dy/dx = 2x, and at x = 3 that is 6. Notice that the y-coordinate played no part: the slope depends on where along the curve you are, which x alone settles, and 9 is the answer of somebody who reached for the nearest available number. The derivative is a function of x, and feeding it anything else is a category mistake worth catching early.",
          hi: "dy/dx = 2x, और x = 3 पर वह 6 है। ध्यान दो कि y-निर्देशांक का कोई हाथ नहीं था: ढाल इस पर निर्भर है कि तुम वक्र पर कहाँ हो, जिसे अकेला x तय करता है, और 9 उसका उत्तर है जिसने पास पड़ी संख्या उठा ली। अवकलज x का फलन है, और उसमें कुछ और डालना कोटि की भूल है जिसे जल्दी पकड़ना ठीक है।",
          mr: "dy/dx = 2x, आणि x = 3 वर ते 6 आहे. लक्षात घ्या की y-निर्देशांकाचा काहीच हात नव्हता: उतार तुम्ही वक्रावर कुठे आहात यावर अवलंबून आहे, जे एकटा x ठरवतो, आणि 9 हे त्याचे उत्तर आहे ज्याने जवळ पडलेली संख्या उचलली. अवकलज हा x चा फलन आहे, आणि त्यात दुसरे काही घालणे ही कोटीची चूक आहे जी लवकर पकडणे बरे.",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 2,
        stem: {
          en: "f(x) = x³ − 3x² + 4. At how many values of x is f'(x) = 0?",
          hi: "f(x) = x³ − 3x² + 4. x के कितने मानों पर f'(x) = 0 है?",
          mr: "f(x) = x³ − 3x² + 4. x च्या किती मूल्यांवर f'(x) = 0 आहे?",
        },
        answer: 2,
        wrong: [1, 3, 0],
        checkExpr: "3-1",
        solution: {
          en: "f'(x) = 3x² − 6x = 3x(x − 2), which vanishes at x = 0 and x = 2 — two points. A cubic's derivative is a quadratic, so it can have at most two roots, and that is the structural reason a cubic can have at most one hill and one valley. Reading the degree of the derivative before solving anything tells you how many candidates to expect, which is a cheap check on your own arithmetic later. (3 answers with the degree of f rather than the count of roots of f'.)",
          hi: "f'(x) = 3x² − 6x = 3x(x − 2), जो x = 0 और x = 2 पर शून्य होता है — दो बिंदु। किसी घन का अवकलज द्विघात है, अतः उसके अधिक से अधिक दो मूल हो सकते हैं, और यही संरचनात्मक कारण है कि किसी घन में अधिक से अधिक एक पहाड़ी और एक घाटी हो सकती है। कुछ भी हल करने से पहले अवकलज की घात पढ़ लेना बताता है कि कितने उम्मीदवारों की आशा रखनी है, जो बाद में अपनी ही गणित पर सस्ती जाँच है। (3 f की घात से उत्तर देता है, f' के मूलों की गिनती से नहीं।)",
          mr: "f'(x) = 3x² − 6x = 3x(x − 2), जे x = 0 आणि x = 2 वर शून्य होते — दोन बिंदू. एखाद्या घनाचा अवकलज द्विघाती आहे, म्हणून त्याला जास्तीत जास्त दोन मुळे असू शकतात, आणि हेच संरचनात्मक कारण आहे की एखाद्या घनात जास्तीत जास्त एक टेकडी आणि एक दरी असू शकते. काहीही सोडवण्याआधी अवकलजाची कोटी वाचणे सांगते की किती उमेदवारांची अपेक्षा ठेवावी, जी नंतर स्वतःच्याच गणितावरची स्वस्त तपासणी आहे. (3 f च्या कोटीने उत्तर देते, f' च्या मुळांच्या मोजणीने नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Two positive numbers add to 20. What is their greatest possible product?",
          hi: "दो धनात्मक संख्याओं का योग 20 है। उनका अधिकतम संभव गुणनफल क्या है?",
          mr: "दोन धन संख्यांची बेरीज 20 आहे. त्यांचा जास्तीत जास्त संभाव्य गुणाकार किती?",
        },
        answer: 100,
        wrong: [96, 99, 20],
        checkExpr: "10*10",
        solution: {
          en: "Write the product as x(20 − x) = 20x − x²; its derivative 20 − 2x vanishes at x = 10, giving 10 × 10 = 100. The equal split wins, and it is worth seeing that this is not a coincidence of the number 20: for any fixed sum the product is largest when the parts are equal, which is the arithmetic-mean–geometric-mean inequality arriving by way of calculus. The nearby answer 96 comes from 8 × 12, which shows how flat the maximum is — a fifth of the way off centre costs only four per cent of the product, and that flatness is itself the practical reason optimisation problems tolerate imprecise inputs.",
          hi: "गुणनफल को x(20 − x) = 20x − x² लिखो; उसका अवकलज 20 − 2x, x = 10 पर शून्य होता है, जिससे 10 × 10 = 100 मिलता है। बराबर बँटवारा जीतता है, और यह देखना ज़रूरी है कि यह संख्या 20 का संयोग नहीं: किसी भी नियत योग के लिए गुणनफल तब सबसे बड़ा होता है जब भाग बराबर हों, जो कलन के रास्ते आती समांतर-माध्य–गुणोत्तर-माध्य असमिका है। पास का उत्तर 96, 8 × 12 से आता है, जो दिखाता है कि अधिकतम कितना चपटा है — केंद्र से पाँचवाँ हिस्सा हटने पर गुणनफल का केवल चार प्रतिशत जाता है, और यही चपटापन वह व्यावहारिक कारण है कि इष्टतमीकरण की समस्याएँ अशुद्ध निवेश सह लेती हैं।",
          mr: "गुणाकार x(20 − x) = 20x − x² असा लिहा; त्याचा अवकलज 20 − 2x हा x = 10 वर शून्य होतो, ज्यातून 10 × 10 = 100 मिळते. समान वाटणी जिंकते, आणि हे पाहणे आवश्यक आहे की हा संख्या 20 चा योगायोग नाही: कोणत्याही निश्चित बेरजेसाठी गुणाकार तेव्हा सर्वांत मोठा असतो जेव्हा भाग समान असतात, जी कलनाच्या मार्गाने येणारी समांतर-मध्य–गुणोत्तर-मध्य असमानता आहे. जवळचे उत्तर 96 हे 8 × 12 मधून येते, जे दाखवते की कमाल किती सपाट आहे — केंद्रापासून पाचवा हिस्सा सरकल्यास गुणाकाराचे केवळ चार टक्के जाते, आणि हाच सपाटपणा ते व्यावहारिक कारण आहे की इष्टतमीकरणाच्या समस्या अचूक नसलेली निविष्टे सहन करतात.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "f(x) = x³ is increasing everywhere, yet f'(0) = 0. At how many points does f have a local maximum or minimum?",
          hi: "f(x) = x³ हर जगह वर्धमान है, फिर भी f'(0) = 0. f के कितने बिंदुओं पर स्थानीय उच्चिष्ठ या निम्निष्ठ है?",
          mr: "f(x) = x³ सर्वत्र वर्धमान आहे, तरीही f'(0) = 0. f ला किती बिंदूंवर स्थानिक कमाल किंवा किमान आहे?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        checkExpr: "1-1",
        solution: {
          en: "None. The derivative 3x² is zero at the origin but positive on both sides of it, so the curve pauses without turning — it flattens, then carries on climbing. This is the counterexample that keeps the chapter honest: a zero derivative is a NECESSARY condition for an interior maximum or minimum and not a sufficient one, so solving f'(x) = 0 produces candidates and never conclusions. A point like this is called a point of inflection, and the practical consequence is that every critical point must afterwards be classified by some test, because the equation that found it cannot tell you what you found. (1 assumes a stationary point must be a turning point.)",
          hi: "कोई नहीं। अवकलज 3x² मूलबिंदु पर शून्य है पर उसके दोनों ओर धनात्मक, अतः वक्र मुड़े बिना ठहरता है — चपटा होता है, फिर चढ़ता चला जाता है। यही प्रतिउदाहरण अध्याय को ईमानदार रखता है: शून्य अवकलज किसी भीतरी उच्चिष्ठ या निम्निष्ठ के लिए आवश्यक शर्त है, पर्याप्त नहीं, अतः f'(x) = 0 हल करने से उम्मीदवार मिलते हैं, निष्कर्ष कभी नहीं। ऐसे बिंदु को नति-परिवर्तन बिंदु कहते हैं, और व्यावहारिक परिणाम यह है कि हर क्रांतिक बिंदु को बाद में किसी परीक्षण से वर्गीकृत करना ही होगा, क्योंकि जिस समीकरण ने उसे ढूँढ़ा वह बता नहीं सकता कि तुमने क्या ढूँढ़ा। (1 मान लेता है कि स्थिर बिंदु मोड़-बिंदु होना ही चाहिए।)",
          mr: "एकही नाही. अवकलज 3x² आदिबिंदूवर शून्य आहे पण त्याच्या दोन्ही बाजूंना धन, म्हणून वक्र न वळता थांबतो — सपाट होतो, मग चढतच राहतो. हेच प्रतिउदाहरण अध्यायाला प्रामाणिक ठेवते: शून्य अवकलज ही आंतरिक कमाल वा किमानसाठी आवश्यक अट आहे, पुरेशी नाही, म्हणून f'(x) = 0 सोडवल्याने उमेदवार मिळतात, निष्कर्ष कधीच नाही. अशा बिंदूला नति-परिवर्तन बिंदू म्हणतात, आणि व्यावहारिक परिणाम हा की प्रत्येक क्रांतिक बिंदू नंतर कोणत्यातरी चाचणीने वर्गीकृत करावाच लागतो, कारण ज्या समीकरणाने तो शोधला ते सांगू शकत नाही की तुम्ही काय शोधले. (1 गृहीत धरते की स्थिर बिंदू वळणबिंदूच असला पाहिजे.)",
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
          en: "A ladder 5 m long leans on a wall. Its foot slides out at 2 m/s when the foot is 3 m from the wall. At what speed, in m/s, is the top sliding down?",
          hi: "5 मी लंबी सीढ़ी दीवार से टिकी है। जब उसका पाँव दीवार से 3 मी दूर है तब पाँव 2 मी/से से बाहर सरकता है। शीर्ष किस चाल से, मी/से में, नीचे सरक रहा है?",
          mr: "5 मी लांब शिडी भिंतीला टेकली आहे. तिचा पाय भिंतीपासून 3 मी असताना पाय 2 मी/से ने बाहेर सरकतो. शिखर किती वेगाने, मी/से मध्ये, खाली सरकत आहे?",
        },
        answer: 1.5,
        wrong: [2, 3, 0.75],
        checkExpr: "3*2/4",
        solution: {
          en: "With x² + y² = 25, differentiating gives 2x(dx/dt) + 2y(dy/dt) = 0, so dy/dt = −x(dx/dt)/y. At x = 3 the height y is 4, and the speed is 3 × 2 / 4 = 1.5 m/s downward. What is worth noticing is that the answer depends on WHERE the ladder is, unlike the square's perimeter earlier — because the relationship here is not linear. Push the position towards x = 5 and y goes to zero, and the formula sends the top's speed to infinity: as the ladder approaches flat, an ordinary push at the bottom produces an unbounded fall at the top. That is a real prediction of the model and also the point at which the model stops describing a ladder, since no real one behaves that way. Knowing where an idealisation breaks is part of using it. (2 copies the foot's speed, which would only be right if the ladder were at 45°.)",
          hi: "x² + y² = 25 के साथ अवकलन करने पर 2x(dx/dt) + 2y(dy/dt) = 0 मिलता है, अतः dy/dt = −x(dx/dt)/y. x = 3 पर ऊँचाई y है 4, और चाल है 3 × 2 / 4 = 1.5 मी/से नीचे की ओर। ध्यान देने लायक़ यह है कि उत्तर इस पर निर्भर है कि सीढ़ी कहाँ है, पहले वाले वर्ग के परिमाप के विपरीत — क्योंकि यहाँ संबंध रैखिक नहीं। स्थिति को x = 5 की ओर धकेलो और y शून्य हो जाता है, और सूत्र शीर्ष की चाल को अनंत भेज देता है: सीढ़ी के चपटे होने के साथ, नीचे का एक साधारण धक्का ऊपर अपरिबद्ध गिरावट पैदा करता है। यह मॉडल की सच्ची भविष्यवाणी है और वही बिंदु भी जहाँ मॉडल सीढ़ी का वर्णन करना छोड़ देता है, क्योंकि कोई असली सीढ़ी ऐसा नहीं करती। कोई आदर्शीकरण कहाँ टूटता है यह जानना उसे बरतने का हिस्सा है। (2 पाँव की चाल नक़ल कर लेता है, जो केवल तब सही होती जब सीढ़ी 45° पर हो।)",
          mr: "x² + y² = 25 सह अवकलन केल्यास 2x(dx/dt) + 2y(dy/dt) = 0 मिळते, म्हणून dy/dt = −x(dx/dt)/y. x = 3 वर उंची y आहे 4, आणि वेग आहे 3 × 2 / 4 = 1.5 मी/से खालच्या दिशेने. लक्षात घेण्याजोगे हे की उत्तर शिडी कुठे आहे यावर अवलंबून आहे, आधीच्या चौरसाच्या परिमितीच्या उलट — कारण इथे संबंध रैखिक नाही. स्थिती x = 5 कडे ढकला आणि y शून्य होतो, आणि सूत्र शिखराचा वेग अनंताकडे पाठवते: शिडी सपाट होत जाताना, खालचा एक साधा धक्का वर अबद्ध पडझड निर्माण करतो. हे प्रतिरूपाचे खरे भाकीत आहे आणि तोच बिंदूही जिथे प्रतिरूप शिडीचे वर्णन करणे थांबवते, कारण कोणतीही खरी शिडी तसे करत नाही. एखादे आदर्शीकरण कुठे मोडते हे जाणणे ते वापरण्याचाच भाग आहे. (2 पायाचा वेग नक्कल करते, जो केवळ शिडी 45° वर असतानाच बरोबर असता.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "f(x) = 2x³ − 9x² + 12x. At x = 1 the second derivative is negative and at x = 2 it is positive. How many local maxima does f have?",
          hi: "f(x) = 2x³ − 9x² + 12x. x = 1 पर द्वितीय अवकलज ऋणात्मक है और x = 2 पर धनात्मक। f के कितने स्थानीय उच्चिष्ठ हैं?",
          mr: "f(x) = 2x³ − 9x² + 12x. x = 1 वर द्वितीय अवकलज ऋण आहे आणि x = 2 वर धन. f ला किती स्थानिक कमाल आहेत?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        checkExpr: "2-1",
        solution: {
          en: "One, at x = 1. The second-derivative test reads the sign directly: negative means the curve is bending downwards there, so a stationary point is the top of a hill; positive means bending upwards, so x = 2 is the bottom of a valley. Both critical points are turning points here, but they are turning points of opposite kinds, and the test is what separates them without any need to evaluate f on either side. That is the test's whole advantage — one substitution instead of two comparisons. (2 counts both critical points as maxima, which is what happens when the sign is not read.)",
          hi: "एक, x = 1 पर। द्वितीय-अवकलज परीक्षण चिह्न सीधे पढ़ लेता है: ऋणात्मक का अर्थ है वक्र वहाँ नीचे की ओर मुड़ रहा है, अतः स्थिर बिंदु पहाड़ी की चोटी है; धनात्मक का अर्थ है ऊपर की ओर मुड़ना, अतः x = 2 घाटी का तल है। यहाँ दोनों क्रांतिक बिंदु मोड़-बिंदु हैं, पर वे विपरीत प्रकार के मोड़-बिंदु हैं, और परीक्षण ही उन्हें अलग करता है, बिना किसी ओर f का मान निकाले। यही परीक्षण का पूरा लाभ है — दो तुलनाओं की जगह एक प्रतिस्थापन। (2 दोनों क्रांतिक बिंदुओं को उच्चिष्ठ गिन लेता है, जो चिह्न न पढ़ने पर होता है।)",
          mr: "एक, x = 1 वर. द्वितीय-अवकलज चाचणी चिन्ह थेट वाचते: ऋण म्हणजे वक्र तिथे खालच्या दिशेने वळत आहे, म्हणून स्थिर बिंदू टेकडीचे शिखर आहे; धन म्हणजे वरच्या दिशेने वळणे, म्हणून x = 2 दरीचा तळ आहे. इथे दोन्ही क्रांतिक बिंदू वळणबिंदू आहेत, पण ते विरुद्ध प्रकारचे वळणबिंदू आहेत, आणि चाचणीच त्यांना वेगळे करते, कोणत्याही बाजूला f चे मूल्य न काढता. हाच चाचणीचा अख्खा फायदा आहे — दोन तुलनांऐवजी एक प्रतिस्थापन. (2 दोन्ही क्रांतिक बिंदू कमाल म्हणून मोजते, जे चिन्ह न वाचल्यास होते.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 4,
        stem: {
          en: "f(x) = x³ on the closed interval [1, 4]. What is the greatest value f attains there?",
          hi: "बंद अंतराल [1, 4] पर f(x) = x³. वहाँ f द्वारा प्राप्त अधिकतम मान क्या है?",
          mr: "बंद अंतराल [1, 4] वर f(x) = x³. तिथे f ने गाठलेले कमाल मूल्य किती?",
        },
        answer: 64,
        wrong: [0, 1, 27],
        checkExpr: "4*4*4",
        solution: {
          en: "4³ = 64, at the right-hand endpoint. Solving f'(x) = 3x² = 0 offers only x = 0, which is not even in the interval, so the method most students reach for first returns nothing at all here — and yet a greatest value plainly exists, because a continuous function on a closed bounded interval always attains one. The lesson is that the candidates for an absolute extremum are the critical points AND the two endpoints, and dropping the endpoints is the commonest way to get these questions wrong. An endpoint maximum has no zero derivative because the function is still climbing when the domain simply stops; the constraint, not the curve, is what ends the rise. (27 evaluates at 3 rather than at the endpoint.)",
          hi: "4³ = 64, दाएँ सिरे पर। f'(x) = 3x² = 0 हल करने से केवल x = 0 मिलता है, जो अंतराल में है ही नहीं, अतः जिस विधि की ओर ज़्यादातर विद्यार्थी पहले बढ़ते हैं वह यहाँ कुछ भी नहीं लौटाती — और फिर भी अधिकतम मान स्पष्ट रूप से मौजूद है, क्योंकि बंद परिबद्ध अंतराल पर संतत फलन सदा एक प्राप्त कर लेता है। सबक़ यह है कि निरपेक्ष चरम के उम्मीदवार क्रांतिक बिंदु और दोनों सिरे हैं, और सिरों को छोड़ देना इन प्रश्नों को ग़लत करने का सबसे आम तरीक़ा है। सिरे के उच्चिष्ठ का अवकलज शून्य नहीं होता क्योंकि फलन तब भी चढ़ रहा होता है जब प्रांत बस ख़त्म हो जाता है; वक्र नहीं, अड़चन ही चढ़ाई को समाप्त करती है। (27, सिरे के बजाय 3 पर मान निकालता है।)",
          mr: "4³ = 64, उजव्या टोकावर. f'(x) = 3x² = 0 सोडवल्याने केवळ x = 0 मिळतो, जो अंतरालात नाहीच, म्हणून बहुतेक विद्यार्थी आधी ज्या पद्धतीकडे वळतात ती इथे काहीच परत देत नाही — आणि तरीही कमाल मूल्य स्पष्टपणे अस्तित्वात आहे, कारण बंद बद्ध अंतरालावरील संतत फलन नेहमी एक गाठतेच. धडा हा की निरपेक्ष टोकाचे उमेदवार क्रांतिक बिंदू आणि दोन्ही टोके आहेत, आणि टोके सोडून देणे हा या प्रश्नांना चुकवण्याचा सर्वांत सामान्य मार्ग आहे. टोकावरील कमालचा अवकलज शून्य नसतो कारण प्रांत केवळ संपतो तेव्हाही फलन चढतच असते; वक्र नव्हे, बंधनच चढाई संपवते. (27 टोकाऐवजी 3 वर मूल्य काढते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A cylindrical tin of volume 128π cm³ is to use the least metal. For the optimal tin, what is the ratio of height to radius?",
          hi: "128π घन सेमी आयतन वाला बेलनाकार डिब्बा सबसे कम धातु से बनाना है। इष्टतम डिब्बे के लिए ऊँचाई और त्रिज्या का अनुपात क्या है?",
          mr: "128π घन सेमी घनफळाचा दंडगोलाकार डबा सर्वांत कमी धातू वापरणारा हवा. इष्टतम डब्यासाठी उंची आणि त्रिज्येचे गुणोत्तर किती?",
        },
        answer: 2,
        wrong: [1, 3, 4],
        checkExpr: "4-2",
        solution: {
          en: "Minimising 2πr² + 2πrh subject to πr²h = 128π leads to h = 2r, so the ratio is 2. The number is worth more than the calculation: the least-metal cylinder is exactly as tall as it is wide, a square when seen in profile, and this holds for EVERY volume — the 128π never survives to the answer. That is the mark of a genuine structural result rather than an arithmetic accident, and it is why checking whether the given data actually appears in the conclusion is a useful habit. It also raises a question the mathematics cannot answer: real tins are conspicuously taller than they are wide, so either manufacturers are wasting metal or the objective is wrong. The objective is wrong. Real cans must be stacked, gripped, printed on and shipped, the top and bottom are cut from thicker stock and joined by a seam that costs more than the sheet does, and minimising surface area alone models none of that. A perfectly correct optimisation of the wrong quantity is a common way to be exactly wrong. (1 guesses a cube-like h = r.)",
          hi: "πr²h = 128π की अड़चन के साथ 2πr² + 2πrh न्यूनतम करने पर h = 2r मिलता है, अतः अनुपात 2 है। संख्या गणना से अधिक क़ीमती है: सबसे कम धातु वाला बेलन ठीक उतना ही ऊँचा है जितना चौड़ा, बग़ल से देखने पर वर्ग, और यह हर आयतन के लिए सही है — 128π उत्तर तक बचता ही नहीं। यही असली संरचनात्मक परिणाम की पहचान है, गणितीय संयोग की नहीं, और इसीलिए यह जाँचना कि दिया गया आँकड़ा निष्कर्ष में सचमुच दिखता है या नहीं, उपयोगी आदत है। यह एक ऐसा प्रश्न भी उठाता है जिसका उत्तर गणित नहीं दे सकता: असली डिब्बे साफ़ तौर पर चौड़ाई से अधिक ऊँचे होते हैं, अतः या तो निर्माता धातु बरबाद कर रहे हैं या उद्देश्य ग़लत है। उद्देश्य ग़लत है। असली डिब्बों को चिनना, पकड़ना, उन पर छापना और भेजना पड़ता है, ऊपर-नीचे के ढक्कन मोटी चादर से कटते हैं और ऐसी सीवन से जुड़ते हैं जो चादर से महँगी पड़ती है, और अकेले पृष्ठीय क्षेत्रफल को न्यूनतम करना इनमें से किसी का भी मॉडल नहीं बनाता। ग़लत राशि का बिलकुल सही इष्टतमीकरण ठीक-ठीक ग़लत होने का आम तरीक़ा है। (1 घन जैसा h = r अनुमान लेता है।)",
          mr: "πr²h = 128π या बंधनासह 2πr² + 2πrh किमान करताना h = 2r मिळते, म्हणून गुणोत्तर 2 आहे. संख्या गणनेहून अधिक मोलाची आहे: सर्वांत कमी धातूचा दंडगोल नेमका जितका रुंद तितकाच उंच आहे, बाजूने पाहिल्यास चौरस, आणि हे प्रत्येक घनफळासाठी खरे आहे — 128π उत्तरापर्यंत टिकतच नाही. हीच खऱ्या संरचनात्मक निकालाची खूण आहे, गणिती योगायोगाची नव्हे, आणि म्हणूनच दिलेला आकडा निष्कर्षात खरोखर दिसतो का हे तपासणे उपयुक्त सवय आहे. हे असाही प्रश्न उभा करते ज्याचे उत्तर गणित देऊ शकत नाही: खरे डबे स्पष्टपणे रुंदीहून अधिक उंच असतात, म्हणून एकतर उत्पादक धातू वाया घालवत आहेत किंवा उद्दिष्ट चुकीचे आहे. उद्दिष्ट चुकीचे आहे. खरे डबे रचावे, धरावे, त्यांवर छापावे आणि पाठवावे लागतात, वरचे-खालचे झाकण जाड पत्र्यातून कापले जातात आणि पत्र्याहून महाग पडणाऱ्या शिवणीने जोडले जातात, आणि एकट्या पृष्ठफळाला किमान करणे यांपैकी कशाचेही प्रतिरूप बनवत नाही. चुकीच्या राशीचे अगदी बरोबर इष्टतमीकरण हा नेमके चुकीचे असण्याचा सामान्य मार्ग आहे. (1 घनासारखा h = r अंदाज घेते.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 5,
        stem: {
          en: "f(x) = x⁴ has f'(0) = 0 and f''(0) = 0. Counting the second-derivative test and the first-derivative test, how many of the two decide what happens at x = 0?",
          hi: "f(x) = x⁴ में f'(0) = 0 और f''(0) = 0. द्वितीय-अवकलज परीक्षण और प्रथम-अवकलज परीक्षण में से, x = 0 पर क्या होता है यह कितने तय कर पाते हैं?",
          mr: "f(x) = x⁴ मध्ये f'(0) = 0 आणि f''(0) = 0. द्वितीय-अवकलज चाचणी आणि प्रथम-अवकलज चाचणी यांपैकी, x = 0 वर काय होते हे किती ठरवू शकतात?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        checkExpr: "2-1",
        solution: {
          en: "One — the first-derivative test, and only that one. The second-derivative test returns zero and zero carries no sign, so the test is silent: it cannot distinguish this minimum from the inflection of x³, where the second derivative is also zero at the origin. The first-derivative test simply looks at the sign of f' on either side, finds negative to the left and positive to the right, and concludes a minimum without difficulty. Two things follow. First, the second-derivative test is faster but strictly weaker, and the case it fails on is exactly the case it was invented to settle — a flat stationary point — which is a common shape for a shortcut to take. Second, notice that a test returning nothing is not a test returning 'no extremum'; students routinely read the zero as a verdict of inflection, which for x⁴ is simply false. Knowing the difference between a test that says no and a test that says nothing is worth more here than either test. (2 assumes both tests always apply.)",
          hi: "एक — प्रथम-अवकलज परीक्षण, और केवल वही। द्वितीय-अवकलज परीक्षण शून्य लौटाता है और शून्य का कोई चिह्न नहीं होता, अतः परीक्षण मौन है: वह इस निम्निष्ठ को x³ के नति-परिवर्तन से अलग नहीं कर सकता, जहाँ मूलबिंदु पर द्वितीय अवकलज भी शून्य है। प्रथम-अवकलज परीक्षण बस दोनों ओर f' का चिह्न देखता है, बाएँ ऋणात्मक और दाएँ धनात्मक पाता है, और बिना कठिनाई निम्निष्ठ निकाल लेता है। दो बातें निकलती हैं। पहली, द्वितीय-अवकलज परीक्षण तेज़ है पर सख़्ती से कमज़ोर, और जिस मामले में वह विफल होता है वही मामला है जिसे तय करने के लिए उसे गढ़ा गया था — चपटा स्थिर बिंदु — जो किसी शॉर्टकट के लिए आम आकार है। दूसरी, ध्यान दो कि कुछ न लौटाने वाला परीक्षण 'कोई चरम नहीं' लौटाने वाला परीक्षण नहीं है; विद्यार्थी अक्सर उस शून्य को नति-परिवर्तन का फ़ैसला पढ़ लेते हैं, जो x⁴ के लिए सरासर ग़लत है। जो परीक्षण ना कहता है और जो कुछ नहीं कहता, उनका फ़र्क़ जानना यहाँ दोनों परीक्षणों से अधिक क़ीमती है। (2 मान लेता है कि दोनों परीक्षण सदा लागू होते हैं।)",
          mr: "एक — प्रथम-अवकलज चाचणी, आणि केवळ तीच. द्वितीय-अवकलज चाचणी शून्य परत करते आणि शून्याला चिन्ह नसते, म्हणून चाचणी मौन आहे: ती या किमानला x³ च्या नति-परिवर्तनापासून वेगळे करू शकत नाही, जिथे आदिबिंदूवर द्वितीय अवकलजही शून्य आहे. प्रथम-अवकलज चाचणी फक्त दोन्ही बाजूंना f' चे चिन्ह पाहते, डावीकडे ऋण आणि उजवीकडे धन आढळते, आणि अडचणीशिवाय किमान ठरवते. दोन गोष्टी निघतात. पहिली, द्वितीय-अवकलज चाचणी वेगवान आहे पण काटेकोरपणे दुर्बल, आणि ज्या प्रसंगात ती अपयशी ठरते तोच प्रसंग आहे जो ठरवण्यासाठी ती घडवली गेली — सपाट स्थिर बिंदू — जो एखाद्या शॉर्टकटसाठी सामान्य आकार आहे. दुसरी, लक्षात घ्या की काहीही परत न करणारी चाचणी ही 'कोणतेही टोक नाही' परत करणारी चाचणी नव्हे; विद्यार्थी नेहमी त्या शून्याला नति-परिवर्तनाचा निकाल वाचतात, जे x⁴ साठी सरळ चुकीचे आहे. जी चाचणी नाही म्हणते आणि जी काहीच म्हणत नाही, त्यांतला फरक जाणणे इथे दोन्ही चाचण्यांहून अधिक मोलाचे आहे. (2 गृहीत धरते की दोन्ही चाचण्या नेहमी लागू होतात.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "The approximation √(25.2) ≈ 5 + 0.2/10 uses the tangent line at x = 25. To how many decimal places does it match the true value 5.019960…?",
          hi: "सन्निकटन √(25.2) ≈ 5 + 0.2/10, x = 25 पर स्पर्शरेखा का उपयोग करता है। यह सही मान 5.019960… से कितने दशमलव स्थानों तक मेल खाता है?",
          mr: "सन्निकटन √(25.2) ≈ 5 + 0.2/10 हे x = 25 वरील स्पर्शरेषा वापरते. ते खऱ्या मूल्य 5.019960… शी किती दशांश स्थळांपर्यंत जुळते?",
        },
        answer: 4,
        wrong: [2, 3, 6],
        checkExpr: "5-1",
        solution: {
          en: "The estimate is 5.02 and the truth is 5.019960…, so they agree to 4 decimal places — 5.0199 against 5.0200 differs only in the fourth. The accuracy is far better than the crudeness of the method suggests, and the reason is the size of the error term rather than any luck. A tangent-line estimate is a Taylor series cut off after the linear term, so its error is governed by the next term, which carries a factor of the step size SQUARED. Here the step is 0.2, so the square is 0.04, and the second derivative of √x at 25 is about −0.0008 — the product is around forty millionths. This is why linearisation earns its keep in practice: halving the step quarters the error, so the method improves quadratically as one gets closer, and near enough is very near indeed. It is also why the same method is useless far from the point of tangency, since the same square that shrinks fast also grows fast. (2 counts the decimals in the written estimate rather than the places that agree.)",
          hi: "अनुमान 5.02 है और सच्चाई 5.019960…, अतः वे 4 दशमलव स्थानों तक सहमत हैं — 5.0199 बनाम 5.0200 केवल चौथे में भिन्न है। शुद्धता विधि के भदेसपन के सुझाव से कहीं बेहतर है, और कारण किसी भाग्य के बजाय त्रुटि-पद का आकार है। स्पर्शरेखा-अनुमान रैखिक पद के बाद काटी गई टेलर श्रेणी है, अतः उसकी त्रुटि अगले पद से शासित होती है, जो क़दम के आकार का वर्ग लिए चलता है। यहाँ क़दम 0.2 है, अतः वर्ग 0.04, और 25 पर √x का द्वितीय अवकलज लगभग −0.0008 — गुणनफल क़रीब चालीस दस-लाखवाँ हिस्सा। इसीलिए रैखिकीकरण व्यवहार में अपनी क़ीमत वसूल करता है: क़दम आधा करने से त्रुटि चौथाई होती है, अतः पास आते-आते विधि वर्ग-गति से सुधरती है, और काफ़ी पास सचमुच बहुत पास होता है। और इसीलिए वही विधि स्पर्श-बिंदु से दूर बेकार है, क्योंकि जो वर्ग तेज़ी से घटता है वही तेज़ी से बढ़ता भी है। (2 सहमत स्थानों के बजाय लिखे अनुमान के दशमलव गिन लेता है।)",
          mr: "अंदाज 5.02 आहे आणि सत्य 5.019960…, म्हणून ते 4 दशांश स्थळांपर्यंत सहमत आहेत — 5.0199 विरुद्ध 5.0200 फक्त चौथ्यात वेगळे आहे. अचूकता पद्धतीच्या ओबडधोबडपणाच्या सूचनेहून कितीतरी चांगली आहे, आणि कारण कोणत्याही नशिबाऐवजी त्रुटी-पदाचा आकार आहे. स्पर्शरेषा-अंदाज हा रैखिक पदानंतर कापलेली टेलर श्रेणी आहे, म्हणून तिची त्रुटी पुढच्या पदाने नियंत्रित होते, जे पावलाच्या आकाराचा वर्ग घेऊन चालते. इथे पाऊल 0.2 आहे, म्हणून वर्ग 0.04, आणि 25 वर √x चा द्वितीय अवकलज सुमारे −0.0008 — गुणाकार जवळपास चाळीस दशलक्षांश. म्हणूनच रैखिकीकरण व्यवहारात आपली किंमत वसूल करते: पाऊल निम्मे केल्याने त्रुटी चतुर्थांश होते, म्हणून जवळ येताना पद्धत वर्ग-गतीने सुधारते, आणि पुरेसे जवळ म्हणजे खरोखरच खूप जवळ. आणि म्हणूनच तीच पद्धत स्पर्श-बिंदूपासून दूर निरुपयोगी आहे, कारण जो वर्ग वेगाने घटतो तोच वेगाने वाढतोही. (2 सहमत स्थळांऐवजी लिहिलेल्या अंदाजातील दशांश मोजते.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 6,
        stem: {
          en: "f(x) = 1/x on the open interval (0, 1) is continuous and has no critical point. How many of the absolute maximum and absolute minimum does it attain there?",
          hi: "खुले अंतराल (0, 1) पर f(x) = 1/x संतत है और उसका कोई क्रांतिक बिंदु नहीं। वह वहाँ निरपेक्ष उच्चिष्ठ और निरपेक्ष निम्निष्ठ में से कितने प्राप्त करता है?",
          mr: "खुल्या अंतराल (0, 1) वर f(x) = 1/x संतत आहे आणि त्याला कोणताही क्रांतिक बिंदू नाही. ते तिथे निरपेक्ष कमाल आणि निरपेक्ष किमान यांपैकी किती गाठते?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        checkExpr: "2-2",
        solution: {
          en: "Neither. As x approaches 0 the function runs off to infinity, so there is no greatest value; as x approaches 1 the function falls towards 1 but never arrives, because 1 itself is not in the interval, so there is no least value either. The extreme value theorem promises both, and it is not violated here — its hypotheses ask for a CLOSED and BOUNDED interval, and (0, 1) is bounded but not closed. Two brackets are the whole difference between a guarantee and nothing at all. What makes this worth an Olympiad-level question is what it says about how existence theorems should be used. It is tempting to treat 'the maximum' as something one can name and then hunt for, and the hunting method — solve f'(x) = 0, compare candidates — quietly assumes the thing exists. Here the hunt finds nothing, and the honest conclusion is not that the search was clumsy but that there was nothing to find. Checking the hypotheses BEFORE searching is what tells the two situations apart, and on a closed interval the same function is perfectly well behaved: on [0.5, 1] it attains 2 and 1 at the two endpoints, neither of them critical points at all. (2 supposes a continuous function on an interval must attain both.)",
          hi: "कोई नहीं। x के 0 की ओर बढ़ने पर फलन अनंत की ओर भाग जाता है, अतः कोई अधिकतम मान नहीं; x के 1 की ओर बढ़ने पर फलन 1 की ओर गिरता है पर पहुँचता कभी नहीं, क्योंकि 1 स्वयं अंतराल में नहीं, अतः न्यूनतम मान भी नहीं। चरम मान प्रमेय दोनों का वादा करता है, और यहाँ उसका उल्लंघन नहीं हुआ — उसकी परिकल्पनाएँ बंद और परिबद्ध अंतराल माँगती हैं, और (0, 1) परिबद्ध है पर बंद नहीं। दो कोष्ठक ही गारंटी और कुछ नहीं के बीच का पूरा फ़र्क़ हैं। इसे ओलंपियाड-स्तर का प्रश्न इसलिए बनाता है कि यह अस्तित्व-प्रमेयों के उपयोग के बारे में क्या कहता है। 'अधिकतम' को ऐसी चीज़ मानने का लोभ होता है जिसे नाम देकर ढूँढ़ा जा सके, और ढूँढ़ने की विधि — f'(x) = 0 हल करो, उम्मीदवारों की तुलना करो — चुपचाप मान लेती है कि वह चीज़ है। यहाँ खोज कुछ नहीं पाती, और ईमानदार निष्कर्ष यह नहीं कि खोज भोंडी थी बल्कि यह कि ढूँढ़ने को कुछ था ही नहीं। खोजने से पहले परिकल्पनाएँ जाँचना ही दोनों स्थितियों को अलग बताता है, और बंद अंतराल पर वही फलन बिलकुल सुव्यवहृत है: [0.5, 1] पर वह दोनों सिरों पर 2 और 1 प्राप्त करता है, और उनमें से कोई भी क्रांतिक बिंदु है ही नहीं। (2 मान लेता है कि अंतराल पर संतत फलन को दोनों प्राप्त करने ही चाहिए।)",
          mr: "एकही नाही. x हा 0 कडे जाताना फलन अनंताकडे पळून जाते, म्हणून कोणतेही कमाल मूल्य नाही; x हा 1 कडे जाताना फलन 1 कडे घसरते पण कधीच पोहोचत नाही, कारण 1 स्वतः अंतरालात नाही, म्हणून किमान मूल्यही नाही. टोकाचे मूल्य प्रमेय दोन्हींचे वचन देते, आणि इथे त्याचे उल्लंघन झालेले नाही — त्याची गृहीतके बंद आणि बद्ध अंतराल मागतात, आणि (0, 1) बद्ध आहे पण बंद नाही. दोन कंसच हमी आणि काहीच नाही यांतला अख्खा फरक आहेत. याला ऑलिंपियाड-स्तराचा प्रश्न यासाठी बनवते की तो अस्तित्व-प्रमेये कशी वापरावीत याबद्दल काय सांगतो. 'कमाल' ला अशी गोष्ट मानण्याचा मोह होतो जिला नाव देऊन शोधता येईल, आणि शोधण्याची पद्धत — f'(x) = 0 सोडवा, उमेदवारांची तुलना करा — गुपचूप गृहीत धरते की ती गोष्ट आहे. इथे शोध काहीच सापडत नाही, आणि प्रामाणिक निष्कर्ष हा नव्हे की शोध ओबडधोबड होता तर हा की शोधण्यासारखे काही होतेच नाही. शोधण्याआधी गृहीतके तपासणेच दोन्ही परिस्थिती वेगळ्या सांगते, आणि बंद अंतरालावर तेच फलन अगदी सुव्यवस्थित आहे: [0.5, 1] वर ते दोन्ही टोकांवर 2 आणि 1 गाठते, आणि त्यांपैकी कोणताही क्रांतिक बिंदू नाहीच. (2 गृहीत धरते की अंतरालावरील संतत फलनाने दोन्ही गाठलेच पाहिजेत.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A rectangle of perimeter 40 is to have the greatest area. Now a second rectangle has fixed area 100 and is to have the least perimeter. How many of the two problems have the SAME rectangle as their answer?",
          hi: "40 परिमाप वाले आयत का क्षेत्रफल अधिकतम करना है। अब दूसरे आयत का क्षेत्रफल 100 नियत है और उसका परिमाप न्यूनतम करना है। दोनों समस्याओं में से कितनों का उत्तर एक ही आयत है?",
          mr: "40 परिमिती असलेल्या आयताचे क्षेत्रफळ कमाल करायचे आहे. आता दुसऱ्या आयताचे क्षेत्रफळ 100 निश्चित आहे आणि त्याची परिमिती किमान करायची आहे. दोन्ही समस्यांपैकी कितींचे उत्तर एकच आयत आहे?",
        },
        answer: 2,
        wrong: [1, 0, 4],
        checkExpr: "1+1",
        solution: {
          en: "Both — each answer is the 10 × 10 square, so the count is 2. Check it: perimeter 40 means half-perimeter 20, and the largest area for a fixed sum of sides is the equal split, 10 × 10 = 100; area 100 with sides x and 100/x has perimeter 2x + 200/x, whose derivative 2 − 200/x² vanishes at x = 10, giving perimeter 40. The two problems are exact duals, and the same square answers both. The reason is worth stating because it generalises far beyond rectangles. Each problem optimises one quantity while holding the other fixed, and their solutions must coincide, for a simple reason: if some rectangle of perimeter 40 had area MORE than 100, then shrinking it slightly would give area exactly 100 with perimeter less than 40, contradicting the second problem's answer — and the argument runs equally well in reverse. So a solution to either is forced to solve the other. This is the isoperimetric duality, and the same swap of objective and constraint relates 'most volume for a given surface' to 'least surface for a given volume', which is why the sphere answers both, and why a soap bubble — minimising surface at fixed volume because surface tension charges by area — arrives at the same shape a mathematician reaches from the opposite direction. (1 supposes that reversing which quantity is fixed must change the answer.)",
          hi: "दोनों — हर उत्तर 10 × 10 का वर्ग है, अतः गिनती 2 है। जाँचो: परिमाप 40 का अर्थ आधा-परिमाप 20, और भुजाओं के नियत योग के लिए सबसे बड़ा क्षेत्रफल बराबर बँटवारे पर है, 10 × 10 = 100; भुजाएँ x और 100/x वाले 100 क्षेत्रफल का परिमाप 2x + 200/x है, जिसका अवकलज 2 − 200/x², x = 10 पर शून्य होता है, और परिमाप 40 देता है। दोनों समस्याएँ ठीक द्वैत हैं, और वही वर्ग दोनों का उत्तर है। कारण कहने लायक़ है क्योंकि वह आयतों से कहीं आगे तक जाता है। हर समस्या एक राशि को इष्टतम करती है और दूसरी को नियत रखती है, और उनके हल एक होने ही चाहिए, सरल कारण से: यदि 40 परिमाप वाले किसी आयत का क्षेत्रफल 100 से अधिक होता, तो उसे थोड़ा सिकोड़ने पर क्षेत्रफल ठीक 100 और परिमाप 40 से कम मिलता, जो दूसरी समस्या के उत्तर का खंडन है — और तर्क उलटी दिशा में भी उतना ही चलता है। अतः किसी एक का हल दूसरे को हल करने पर मजबूर है। यह समपरिमाप द्वैत है, और उद्देश्य तथा अड़चन की वही अदला-बदली 'दिए गए पृष्ठ के लिए सर्वाधिक आयतन' को 'दिए गए आयतन के लिए न्यूनतम पृष्ठ' से जोड़ती है, इसीलिए गोला दोनों का उत्तर है, और इसीलिए साबुन का बुलबुला — नियत आयतन पर पृष्ठ न्यूनतम करता हुआ, क्योंकि पृष्ठ-तनाव क्षेत्रफल से वसूलता है — उसी आकार पर पहुँचता है जिस पर गणितज्ञ उलटी दिशा से पहुँचता है। (1 मान लेता है कि कौन-सी राशि नियत है इसे पलटने से उत्तर बदलना ही चाहिए।)",
          mr: "दोन्ही — प्रत्येक उत्तर 10 × 10 चा चौरस आहे, म्हणून मोजणी 2 आहे. तपासा: परिमिती 40 म्हणजे अर्धी-परिमिती 20, आणि बाजूंच्या निश्चित बेरजेसाठी सर्वांत मोठे क्षेत्रफळ समान वाटणीवर आहे, 10 × 10 = 100; बाजू x आणि 100/x असलेल्या 100 क्षेत्रफळाची परिमिती 2x + 200/x आहे, जिचा अवकलज 2 − 200/x² हा x = 10 वर शून्य होतो, आणि परिमिती 40 देतो. दोन्ही समस्या नेमक्या द्वैत आहेत, आणि तोच चौरस दोन्हींचे उत्तर आहे. कारण सांगण्याजोगे आहे कारण ते आयतांहून कितीतरी पुढे जाते. प्रत्येक समस्या एक राशी इष्टतम करते आणि दुसरी निश्चित ठेवते, आणि त्यांची उत्तरे एकच असलीच पाहिजेत, साध्या कारणाने: जर 40 परिमिती असलेल्या एखाद्या आयताचे क्षेत्रफळ 100 हून अधिक असते, तर तो थोडा आकुंचित केल्यास क्षेत्रफळ नेमके 100 आणि परिमिती 40 हून कमी मिळाली असती, जे दुसऱ्या समस्येच्या उत्तराचे खंडन आहे — आणि युक्तिवाद उलट दिशेनेही तितकाच चालतो. म्हणून कोणत्याही एकाचे उत्तर दुसरे सोडवण्यास भाग पडते. हे समपरिमिती द्वैत आहे, आणि उद्दिष्ट व बंधन यांची तीच अदलाबदल 'दिलेल्या पृष्ठासाठी सर्वाधिक घनफळ' ला 'दिलेल्या घनफळासाठी किमान पृष्ठ' शी जोडते, म्हणूनच गोल दोन्हींचे उत्तर आहे, आणि म्हणूनच साबणाचा बुडबुडा — निश्चित घनफळावर पृष्ठ किमान करत, कारण पृष्ठताण क्षेत्रफळाने वसूल करतो — त्याच आकारावर पोहोचतो ज्यावर गणितज्ञ उलट दिशेने पोहोचतो. (1 गृहीत धरते की कोणती राशी निश्चित आहे हे उलटवल्याने उत्तर बदललेच पाहिजे.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-application-of-derivatives",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 6 — Application of Derivatives",
      name: "Application of Derivatives",
      summary:
        "What a slope of zero does and does not establish: why solving f'(x) = 0 produces candidates rather than answers, why the second-derivative test goes silent on precisely the case it was invented to settle, why a greatest value can sit at an endpoint where nothing is stationary at all, and why an interval missing its brackets may have no greatest value to find.",
      position: 6,
      translations: {
        hi: {
          name: "अवकलजों के अनुप्रयोग",
          summary:
            "शून्य ढाल क्या सिद्ध करती है और क्या नहीं: f'(x) = 0 हल करने से उत्तर नहीं उम्मीदवार क्यों मिलते हैं, द्वितीय-अवकलज परीक्षण ठीक उसी मामले पर मौन क्यों हो जाता है जिसे तय करने को वह गढ़ा गया था, अधिकतम मान ऐसे सिरे पर क्यों बैठ सकता है जहाँ कुछ भी स्थिर नहीं, और कोष्ठक खोने वाले अंतराल में ढूँढ़ने को कोई अधिकतम क्यों न हो।",
        },
        mr: {
          name: "अवकलजांचे उपयोजन",
          summary:
            "शून्य उतार काय सिद्ध करतो आणि काय नाही: f'(x) = 0 सोडवल्याने उत्तरे नव्हे तर उमेदवार का मिळतात, द्वितीय-अवकलज चाचणी नेमक्या त्याच प्रसंगावर मौन का होते जो ठरवण्यासाठी ती घडवली गेली, कमाल मूल्य अशा टोकावर का बसू शकते जिथे काहीच स्थिर नाही, आणि कंस हरवलेल्या अंतरालात शोधण्यासारखी कमाल का नसेल.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 7 — Integrals (an inverse that loses exactly one thing)            */
/* ------------------------------------------------------------------------- */
function integrals12(): TopicFileOut {
  const rand = rng("maths-12-integrals");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "In ∫ xⁿ dx = x^(n+1)/(n+1) + C, what is the new exponent when n = 4?",
          hi: "∫ xⁿ dx = x^(n+1)/(n+1) + C में, n = 4 पर नया घातांक क्या है?",
          mr: "∫ xⁿ dx = x^(n+1)/(n+1) + C मध्ये, n = 4 वर नवा घातांक किती?",
        },
        answer: 5,
        wrong: [3, 4, 20],
        checkExpr: "4+1",
        solution: {
          en: "4 + 1 = 5. Integration raises the exponent where differentiation lowered it, which is the first sign that the two operations undo each other. Note the direction carefully, because 3 is the answer of somebody running the power rule the differentiating way — the two rules look almost identical on the page and differ only in whether you add one or subtract one.",
          hi: "4 + 1 = 5. समाकलन घातांक बढ़ाता है जहाँ अवकलन उसे घटाता था, और यही पहला संकेत है कि दोनों संक्रियाएँ एक-दूसरे को उलटती हैं। दिशा ध्यान से देखो, क्योंकि 3 उसका उत्तर है जो घात नियम को अवकलन की दिशा में चला रहा है — दोनों नियम काग़ज़ पर लगभग एक जैसे दिखते हैं और केवल इसमें भिन्न हैं कि तुम एक जोड़ते हो या घटाते हो।",
          mr: "4 + 1 = 5. समाकलन घातांक वाढवते जिथे अवकलन तो घटवत होते, आणि हाच पहिला संकेत आहे की दोन्ही क्रिया एकमेकांना उलटवतात. दिशा काळजीपूर्वक पाहा, कारण 3 हे त्याचे उत्तर आहे जो घात नियम अवकलनाच्या दिशेने चालवत आहे — दोन्ही नियम कागदावर जवळजवळ सारखेच दिसतात आणि फक्त तुम्ही एक जोडता की वजा करता यात वेगळे आहेत.",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the value of the definite integral of 2x from 0 to 3?",
          hi: "0 से 3 तक 2x के निश्चित समाकल का मान क्या है?",
          mr: "0 ते 3 पर्यंत 2x च्या निश्चित समाकलाचे मूल्य किती?",
        },
        answer: 9,
        wrong: [6, 3, 18],
        checkExpr: "3*3-0",
        solution: {
          en: "An antiderivative of 2x is x², and 3² − 0² = 9. Check it geometrically: the region is a triangle with base 3 and height 6, whose area is 9. The two agree, and that agreement is not a coincidence — it is the fundamental theorem, which is the reason an area can be computed by evaluating an antiderivative twice instead of by adding up infinitely many strips. (6 gives the height of the triangle.)",
          hi: "2x का प्रतिअवकलज x² है, और 3² − 0² = 9. ज्यामितीय रूप से जाँचो: क्षेत्र आधार 3 और ऊँचाई 6 वाला त्रिभुज है, जिसका क्षेत्रफल 9 है। दोनों सहमत हैं, और यह सहमति संयोग नहीं — यह मूल प्रमेय है, जो कारण है कि क्षेत्रफल अनंत पट्टियाँ जोड़ने के बजाय प्रतिअवकलज का दो बार मान निकालकर गणित किया जा सकता है। (6 त्रिभुज की ऊँचाई देता है।)",
          mr: "2x चा प्रतिअवकलज x² आहे, आणि 3² − 0² = 9. भूमितीय रीत्या तपासा: प्रदेश आधार 3 आणि उंची 6 असलेला त्रिकोण आहे, ज्याचे क्षेत्रफळ 9 आहे. दोन्ही सहमत आहेत, आणि ही सहमती योगायोग नाही — हे मूलभूत प्रमेय आहे, जे कारण आहे की क्षेत्रफळ अनंत पट्ट्या जोडण्याऐवजी प्रतिअवकलजाचे दोनदा मूल्य काढून काढता येते. (6 त्रिकोणाची उंची देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Two functions differ by a constant. How many different values can the definite integral of their common derivative between two fixed limits take?",
          hi: "दो फलन एक अचर से भिन्न हैं। दो नियत सीमाओं के बीच उनके साझा अवकलज का निश्चित समाकल कितने भिन्न मान ले सकता है?",
          mr: "दोन फलने एका अचलाने वेगळी आहेत. दोन निश्चित सीमांदरम्यान त्यांच्या समान अवकलजाचे निश्चित समाकल किती वेगवेगळी मूल्ये घेऊ शकते?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        checkExpr: "2-1",
        solution: {
          en: "One. The constant appears at both limits and cancels in the subtraction, so it makes no difference to a definite integral at all. This is the reason C can be dropped without a second thought when limits are present, and it explains the shape of the whole chapter: the constant is real and unavoidable in an indefinite integral, and completely invisible in a definite one. (2 assumes two different antiderivatives must give two different answers.)",
          hi: "एक। अचर दोनों सीमाओं पर आता है और घटाव में कट जाता है, अतः निश्चित समाकल पर उसका कोई फ़र्क़ पड़ता ही नहीं। यही कारण है कि सीमाएँ मौजूद होने पर C को बिना दूसरी सोच के छोड़ा जा सकता है, और इससे पूरे अध्याय का आकार समझ आता है: अनिश्चित समाकल में अचर असली और अनिवार्य है, और निश्चित में पूरी तरह अदृश्य। (2 मान लेता है कि दो अलग प्रतिअवकलज दो अलग उत्तर देंगे।)",
          mr: "एक. अचल दोन्ही सीमांवर येतो आणि वजाबाकीत रद्द होतो, म्हणून निश्चित समाकलावर त्याचा काहीच फरक पडत नाही. हेच कारण आहे की सीमा उपस्थित असताना C ला दुसऱ्या विचाराशिवाय सोडता येते, आणि यातून अख्ख्या अध्यायाचा आकार समजतो: अनिश्चित समाकलात अचल खरा आणि अटळ आहे, आणि निश्चितात पूर्णपणे अदृश्य. (2 गृहीत धरते की दोन वेगळे प्रतिअवकलज दोन वेगळी उत्तरे देतील.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the definite integral of x² from 0 to 3?",
          hi: "0 से 3 तक x² का निश्चित समाकल क्या है?",
          mr: "0 ते 3 पर्यंत x² चे निश्चित समाकल किती?",
        },
        answer: 9,
        wrong: [27, 3, 18],
        checkExpr: "27/3",
        solution: {
          en: "The antiderivative is x³/3, so the value is 27/3 − 0 = 9. Worth noticing: the region sits inside a 3-by-9 rectangle of area 27, and the curve claims exactly a third of it. That fraction is not special to 3 — for any upper limit the parabola takes one-third of its bounding rectangle, which is the geometric content of the exponent rule and something Archimedes established for this very curve two thousand years before anyone wrote an integral sign. (27 forgets to divide by the new exponent.)",
          hi: "प्रतिअवकलज x³/3 है, अतः मान 27/3 − 0 = 9 है। ध्यान देने लायक़: क्षेत्र 27 क्षेत्रफल वाले 3-गुणा-9 आयत के भीतर बैठता है, और वक्र उसका ठीक तिहाई हिस्सा लेता है। वह भिन्न 3 के लिए ख़ास नहीं — किसी भी ऊपरी सीमा के लिए परवलय अपने घेरने वाले आयत का एक-तिहाई लेता है, जो घातांक नियम की ज्यामितीय सामग्री है और जिसे आर्किमिडीज़ ने इसी वक्र के लिए किसी के समाकल-चिह्न लिखने से दो हज़ार साल पहले स्थापित कर दिया था। (27 नए घातांक से भाग देना भूल जाता है।)",
          mr: "प्रतिअवकलज x³/3 आहे, म्हणून मूल्य 27/3 − 0 = 9 आहे. लक्षात घेण्याजोगे: प्रदेश 27 क्षेत्रफळाच्या 3-गुणिले-9 आयताच्या आत बसतो, आणि वक्र त्याचा नेमका तृतीयांश घेतो. तो अपूर्णांक 3 साठी खास नाही — कोणत्याही वरच्या सीमेसाठी वर्तुळखंड आपल्या वेढणाऱ्या आयताचा एक-तृतीयांश घेतो, जो घातांक नियमाचा भूमितीय आशय आहे आणि जो आर्किमिडीजने याच वक्रासाठी कोणी समाकल-चिन्ह लिहिण्याच्या दोन हजार वर्षे आधी प्रस्थापित केला होता. (27 नव्या घातांकाने भागणे विसरते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Using the substitution u = x² + 1, what is the definite integral of 2x/(x² + 1) from 0 to 2, expressed as ln of which number?",
          hi: "प्रतिस्थापन u = x² + 1 से, 0 से 2 तक 2x/(x² + 1) का निश्चित समाकल किस संख्या के ln के रूप में है?",
          mr: "प्रतिस्थापन u = x² + 1 वापरून, 0 ते 2 पर्यंत 2x/(x² + 1) चे निश्चित समाकल कोणत्या संख्येच्या ln स्वरूपात आहे?",
        },
        answer: 5,
        wrong: [4, 2, 1],
        checkExpr: "2*2+1",
        solution: {
          en: "With u = x² + 1 the differential du is 2x dx, which is exactly the numerator, so the integral becomes ∫ du/u = ln u. The limits travel with the substitution: x from 0 to 2 sends u from 1 to 5, and ln 5 − ln 1 = ln 5. Changing the limits rather than substituting back is the more reliable habit, because it removes the step everyone forgets. (4 uses x² alone and leaves the +1 behind.)",
          hi: "u = x² + 1 के साथ अवकल du है 2x dx, जो ठीक अंश है, अतः समाकल ∫ du/u = ln u बन जाता है। सीमाएँ प्रतिस्थापन के साथ यात्रा करती हैं: x का 0 से 2 होना u को 1 से 5 भेजता है, और ln 5 − ln 1 = ln 5. वापस प्रतिस्थापित करने के बजाय सीमाएँ बदल देना अधिक भरोसेमंद आदत है, क्योंकि वह उस क़दम को हटा देती है जिसे हर कोई भूलता है। (4 अकेला x² लेता है और +1 पीछे छोड़ देता है।)",
          mr: "u = x² + 1 सह अवकल du हा 2x dx आहे, जो नेमका अंश आहे, म्हणून समाकल ∫ du/u = ln u बनते. सीमा प्रतिस्थापनासोबत प्रवास करतात: x चे 0 ते 2 होणे u ला 1 ते 5 पाठवते, आणि ln 5 − ln 1 = ln 5. परत प्रतिस्थापित करण्याऐवजी सीमा बदलणे अधिक विश्वासार्ह सवय आहे, कारण ती प्रत्येकजण विसरणारे पाऊल काढून टाकते. (4 एकटा x² घेते आणि +1 मागे सोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the definite integral of sin x from 0 to π?",
          hi: "0 से π तक sin x का निश्चित समाकल क्या है?",
          mr: "0 ते π पर्यंत sin x चे निश्चित समाकल किती?",
        },
        answer: 2,
        wrong: [0, 1, 4],
        checkExpr: "1+1",
        solution: {
          en: "The antiderivative is −cos x, so the value is −cos π + cos 0 = 1 + 1 = 2. The answer is worth remembering for its plainness: a whole arch of a sine wave, a shape with π and transcendence written all over it, encloses an area of exactly 2. Extend the limits to 2π and the answer becomes 0, because the second arch lies below the axis and the integral counts it negatively — which is the first hint that a definite integral is not the same thing as an area. (0 answers the two-arch question by mistake.)",
          hi: "प्रतिअवकलज −cos x है, अतः मान −cos π + cos 0 = 1 + 1 = 2 है। उत्तर अपनी सादगी के लिए याद रखने लायक़ है: ज्या-तरंग का पूरा मेहराब, जिस आकृति पर π और अनतिक्रम्यता लिखी है, ठीक 2 क्षेत्रफल घेरता है। सीमाएँ 2π तक बढ़ाओ और उत्तर 0 हो जाता है, क्योंकि दूसरा मेहराब अक्ष के नीचे है और समाकल उसे ऋणात्मक गिनता है — यही पहला संकेत है कि निश्चित समाकल और क्षेत्रफल एक चीज़ नहीं। (0 ग़लती से दो-मेहराब वाले प्रश्न का उत्तर देता है।)",
          mr: "प्रतिअवकलज −cos x आहे, म्हणून मूल्य −cos π + cos 0 = 1 + 1 = 2 आहे. उत्तर आपल्या साधेपणासाठी लक्षात ठेवण्याजोगे आहे: ज्या-लहरीची अख्खी कमान, ज्या आकृतीवर π आणि अपार्यता लिहिली आहे, नेमके 2 क्षेत्रफळ वेढते. सीमा 2π पर्यंत वाढवा आणि उत्तर 0 होते, कारण दुसरी कमान अक्षाखाली आहे आणि समाकल तिला ऋण मोजते — हाच पहिला संकेत आहे की निश्चित समाकल आणि क्षेत्रफळ एक गोष्ट नाही. (0 चुकून दोन-कमानीच्या प्रश्नाचे उत्तर देते.)",
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
          en: "Using integration by parts, what is the definite integral of x eˣ from 0 to 1, expressed as which number times e minus 1?",
          hi: "खंडश: समाकलन से, 0 से 1 तक x eˣ का निश्चित समाकल कितने गुना e घटा 1 है?",
          mr: "खंडशः समाकलन वापरून, 0 ते 1 पर्यंत x eˣ चे निश्चित समाकल किती पट e वजा 1 आहे?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        checkExpr: "2-1",
        solution: {
          en: "Taking u = x and dv = eˣ dx gives x eˣ − ∫ eˣ dx = x eˣ − eˣ, which between 0 and 1 is (e − e) − (0 − 1) = 1. So the value is 1 × e − 1 in the sense asked, since e − e leaves nothing and the whole answer comes from the lower limit. The choice of which factor to call u is where these succeed or fail: picking u = x means differentiating it to 1 and the remaining integral becomes trivial, whereas picking u = eˣ leaves an integral harder than the one you started with. Parts does not simplify by itself — it trades one integral for another, and the skill is entirely in making the trade favourable. (2 double-counts the boundary term.)",
          hi: "u = x और dv = eˣ dx लेने पर x eˣ − ∫ eˣ dx = x eˣ − eˣ मिलता है, जो 0 और 1 के बीच (e − e) − (0 − 1) = 1 है। अतः पूछे गए अर्थ में मान 1 × e − 1 है, क्योंकि e − e कुछ नहीं छोड़ता और पूरा उत्तर निचली सीमा से आता है। किस गुणक को u कहें यह चुनाव ही वह जगह है जहाँ ये सफल या विफल होते हैं: u = x चुनने का अर्थ है उसे अवकलित करके 1 करना और बचा समाकल तुच्छ हो जाना, जबकि u = eˣ चुनने पर जिससे शुरू किया उससे कठिन समाकल बचता है। खंडश: समाकलन अपने आप सरल नहीं करता — वह एक समाकल के बदले दूसरा देता है, और पूरा कौशल उस सौदे को अनुकूल बनाने में है। (2 सीमा-पद को दो बार गिन लेता है।)",
          mr: "u = x आणि dv = eˣ dx घेतल्यास x eˣ − ∫ eˣ dx = x eˣ − eˣ मिळते, जे 0 आणि 1 दरम्यान (e − e) − (0 − 1) = 1 आहे. म्हणून विचारलेल्या अर्थाने मूल्य 1 × e − 1 आहे, कारण e − e काहीच सोडत नाही आणि अख्खे उत्तर खालच्या सीमेतून येते. कोणत्या गुणकाला u म्हणावे ही निवडच ती जागा आहे जिथे हे यशस्वी वा अपयशी होतात: u = x निवडणे म्हणजे त्याचे अवकलन करून 1 करणे आणि उरलेले समाकल क्षुल्लक होणे, तर u = eˣ निवडल्यास ज्याने सुरुवात केली त्याहून कठीण समाकल उरते. खंडशः समाकलन स्वतःहून सोपे करत नाही — ते एका समाकलाच्या बदल्यात दुसरे देते, आणि अख्खे कौशल तो सौदा अनुकूल करण्यात आहे. (2 सीमा-पद दोनदा मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The definite integral of x³ from −2 to 2 equals which number?",
          hi: "−2 से 2 तक x³ का निश्चित समाकल किस संख्या के बराबर है?",
          mr: "−2 ते 2 पर्यंत x³ चे निश्चित समाकल कोणत्या संख्येइतके आहे?",
        },
        answer: 0,
        wrong: [8, 4, 16],
        checkExpr: "4-4",
        solution: {
          en: "Zero, and the antiderivative confirms it: x⁴/4 evaluated at 2 and at −2 gives 4 − 4 = 0. But the symmetry argument is faster and more useful. x³ is odd, meaning f(−x) = −f(x), so every contribution on the right is matched by an equal and opposite one on the left, and a symmetric interval cancels them all. Spotting oddness before integrating turns this question into no work at all, and the same check saves real effort on integrals that have no elementary antiderivative to fall back on. Note what it does NOT say: the area enclosed is 8, four above the axis and four below. Zero is the integral, not the area. (8 gives the area, which is a different question.)",
          hi: "शून्य, और प्रतिअवकलज इसकी पुष्टि करता है: x⁴/4 का मान 2 और −2 पर 4 − 4 = 0 देता है। पर सममिति का तर्क तेज़ और अधिक उपयोगी है। x³ विषम है, यानी f(−x) = −f(x), अतः दाईं ओर के हर योगदान का बाईं ओर बराबर और विपरीत जोड़ा है, और सममित अंतराल उन सबको काट देता है। समाकलन से पहले विषमता पकड़ लेना इस प्रश्न को शून्य काम में बदल देता है, और वही जाँच ऐसे समाकलों पर असली मेहनत बचाती है जिनके पास लौटने को कोई प्रारंभिक प्रतिअवकलज नहीं। ध्यान दो कि यह क्या नहीं कहता: घिरा क्षेत्रफल 8 है, चार अक्ष के ऊपर और चार नीचे। शून्य समाकल है, क्षेत्रफल नहीं। (8 क्षेत्रफल देता है, जो अलग प्रश्न है।)",
          mr: "शून्य, आणि प्रतिअवकलज याची पुष्टी करतो: x⁴/4 चे मूल्य 2 आणि −2 वर 4 − 4 = 0 देते. पण सममितीचा युक्तिवाद वेगवान आणि अधिक उपयुक्त आहे. x³ विषम आहे, म्हणजे f(−x) = −f(x), म्हणून उजवीकडील प्रत्येक योगदानाला डावीकडे समान आणि विरुद्ध जोडीदार आहे, आणि सममित अंतराल त्या सर्वांना रद्द करते. समाकलनाआधी विषमता ओळखणे या प्रश्नाला शून्य कामात बदलते, आणि तीच तपासणी अशा समाकलांवर खरे कष्ट वाचवते ज्यांना परतण्यासाठी कोणताही प्राथमिक प्रतिअवकलज नाही. लक्षात घ्या की ते काय सांगत नाही: वेढलेले क्षेत्रफळ 8 आहे, चार अक्षाच्या वर आणि चार खाली. शून्य हे समाकल आहे, क्षेत्रफळ नव्हे. (8 क्षेत्रफळ देते, जो वेगळा प्रश्न आहे.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 4,
        stem: {
          en: "The definite integral of cos x from 0 to 2π is 0, and the integral of the same function from 0 to π/2 is 1. How many times does the running integral return to 0 as the upper limit sweeps from 0 to 2π?",
          hi: "0 से 2π तक cos x का निश्चित समाकल 0 है, और उसी फलन का 0 से π/2 तक समाकल 1 है। ऊपरी सीमा के 0 से 2π तक बहने पर चलता समाकल कितनी बार 0 पर लौटता है?",
          mr: "0 ते 2π पर्यंत cos x चे निश्चित समाकल 0 आहे, आणि त्याच फलनाचे 0 ते π/2 पर्यंत समाकल 1 आहे. वरची सीमा 0 ते 2π पर्यंत सरकताना चालते समाकल किती वेळा 0 वर परत येते?",
        },
        answer: 2,
        wrong: [1, 3, 4],
        checkExpr: "3-1",
        solution: {
          en: "Twice — at π and at 2π. The running integral is sin x, which starts at 0, climbs to 1 at π/2, comes back to 0 at π, drops to −1 at 3π/2, and returns to 0 at 2π; the start does not count as a return. What makes this question worth asking is the shift of view it forces. A definite integral with fixed limits is a number, but let the upper limit vary and it becomes a FUNCTION of that limit — and this function's derivative is the original integrand, which is the first fundamental theorem read from the other side. Every question about where the accumulated total peaks or vanishes is then a question about the antiderivative's graph, and here that graph is simply the sine curve one already knows. (1 counts only the endpoint.)",
          hi: "दो बार — π पर और 2π पर। चलता समाकल sin x है, जो 0 से शुरू होता है, π/2 पर 1 तक चढ़ता है, π पर 0 पर लौटता है, 3π/2 पर −1 तक गिरता है, और 2π पर 0 पर लौट आता है; शुरुआत लौटना नहीं गिनी जाती। इस प्रश्न को पूछने लायक़ वह दृष्टि-परिवर्तन बनाता है जो यह थोपता है। नियत सीमाओं वाला निश्चित समाकल एक संख्या है, पर ऊपरी सीमा को बदलने दो और वह उस सीमा का फलन बन जाता है — और इस फलन का अवकलज मूल समाकल्य है, जो प्रथम मूल प्रमेय को दूसरी ओर से पढ़ना है। तब संचित योग कहाँ शिखर छूता है या लुप्त होता है, हर ऐसा प्रश्न प्रतिअवकलज के आलेख का प्रश्न है, और यहाँ वह आलेख बस वही ज्या-वक्र है जिसे तुम पहले से जानते हो। (1 केवल अंतिम बिंदु गिनता है।)",
          mr: "दोनदा — π वर आणि 2π वर. चालते समाकल sin x आहे, जे 0 पासून सुरू होते, π/2 वर 1 पर्यंत चढते, π वर 0 वर परत येते, 3π/2 वर −1 पर्यंत घसरते, आणि 2π वर 0 वर परत येते; सुरुवात परतणे म्हणून मोजली जात नाही. हा प्रश्न विचारण्याजोगा तो दृष्टी-बदल बनवतो जो हा लादतो. निश्चित सीमा असलेले निश्चित समाकल एक संख्या आहे, पण वरची सीमा बदलू द्या आणि ते त्या सीमेचे फलन बनते — आणि या फलनाचा अवकलज मूळ समाकल्य आहे, जे प्रथम मूलभूत प्रमेय दुसऱ्या बाजूने वाचणे आहे. मग संचित बेरीज कुठे शिखर गाठते वा लोपते, असा प्रत्येक प्रश्न प्रतिअवकलजाच्या आलेखाचा प्रश्न आहे, आणि इथे तो आलेख म्हणजे तुम्हाला आधीच माहीत असलेला ज्या-वक्रच आहे. (1 फक्त अंतिम बिंदू मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "The integral of 1/x from 1 to a equals 1 when a = e. Using the property that this integral turns products into sums, what does the integral from 1 to e² equal?",
          hi: "1 से a तक 1/x का समाकल a = e पर 1 के बराबर है। इस गुण से कि यह समाकल गुणनफलों को योगों में बदलता है, 1 से e² तक का समाकल किसके बराबर है?",
          mr: "1 ते a पर्यंत 1/x चे समाकल a = e वर 1 इतके आहे. या गुणधर्माने की हे समाकल गुणाकारांना बेरजांत बदलते, 1 ते e² पर्यंतचे समाकल कशाइतके आहे?",
        },
        answer: 2,
        wrong: [1, 4, 3],
        checkExpr: "1+1",
        solution: {
          en: "2, because the integral from 1 to e² splits at e into the integral from 1 to e plus the integral from e to e², and the second piece equals the first by a scaling argument: substituting x = et maps the interval [e, e²] onto [1, e] and leaves 1/x dx unchanged, since the e cancels between numerator and denominator. So the two pieces are 1 each and the total is 2. That invariance is the entire reason the logarithm exists as a function: 1/x is the one power of x whose integral is unchanged by rescaling, so the area from 1 to a depends on the RATIO a rather than any absolute size, and a quantity that turns multiplication into addition is what a logarithm is. Note that this argument defines ln without ever mentioning exponentials — historically the logarithm was found this way round, as the area under a hyperbola, and only later recognised as the inverse of eˣ. (1 stops after the first half.)",
          hi: "2, क्योंकि 1 से e² तक का समाकल e पर बँटकर 1 से e और e से e² के समाकलों का योग बनता है, और दूसरा टुकड़ा पहले के बराबर है, एक स्केलिंग तर्क से: x = et प्रतिस्थापित करने पर अंतराल [e, e²] का प्रतिबिंब [1, e] बनता है और 1/x dx अपरिवर्तित रहता है, क्योंकि e अंश और हर के बीच कट जाता है। अतः दोनों टुकड़े 1-1 हैं और कुल 2. वही अपरिवर्तनीयता पूरा कारण है कि लघुगणक एक फलन के रूप में मौजूद है: 1/x, x की वह अकेली घात है जिसका समाकल पुनःस्केलन से नहीं बदलता, अतः 1 से a तक का क्षेत्रफल किसी निरपेक्ष आकार के बजाय अनुपात a पर निर्भर है, और गुणा को जोड़ में बदलने वाली राशि ही लघुगणक है। ध्यान दो कि यह तर्क चरघातांकी का उल्लेख किए बिना ln परिभाषित कर देता है — ऐतिहासिक रूप से लघुगणक इसी ओर से मिला था, अतिपरवलय के नीचे के क्षेत्रफल के रूप में, और बाद में ही eˣ का प्रतिलोम पहचाना गया। (1 पहले आधे के बाद रुक जाता है।)",
          mr: "2, कारण 1 ते e² पर्यंतचे समाकल e वर विभागून 1 ते e आणि e ते e² यांच्या समाकलांची बेरीज बनते, आणि दुसरा तुकडा पहिल्याइतका आहे, एका प्रमाणीकरण युक्तिवादाने: x = et प्रतिस्थापित केल्यास अंतराल [e, e²] चे प्रतिबिंब [1, e] बनते आणि 1/x dx अपरिवर्तित राहते, कारण e अंश आणि छेद यांदरम्यान रद्द होतो. म्हणून दोन्ही तुकडे 1-1 आहेत आणि एकूण 2. तीच अपरिवर्तनीयता हे अख्खे कारण आहे की लघुगणक एक फलन म्हणून अस्तित्वात आहे: 1/x ही x ची एकमेव घात आहे जिचे समाकल पुनःप्रमाणीकरणाने बदलत नाही, म्हणून 1 ते a पर्यंतचे क्षेत्रफळ कोणत्याही निरपेक्ष आकाराऐवजी गुणोत्तर a वर अवलंबून आहे, आणि गुणाकाराला बेरजेत बदलणारी राशी म्हणजेच लघुगणक. लक्षात घ्या की हा युक्तिवाद घातांकीचा उल्लेख न करता ln परिभाषित करतो — ऐतिहासिक दृष्ट्या लघुगणक याच बाजूने सापडला होता, अतिवर्तुळखंडाखालील क्षेत्रफळ म्हणून, आणि नंतरच eˣ चा व्यस्त म्हणून ओळखला गेला. (1 पहिल्या अर्ध्यानंतर थांबते.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 5,
        stem: {
          en: "The definite integral of 1/x² from −1 to 1 formally evaluates to −2 by the antiderivative −1/x, yet the function is positive everywhere it is defined. How many of the fundamental theorem's hypotheses does this calculation violate?",
          hi: "−1 से 1 तक 1/x² का निश्चित समाकल प्रतिअवकलज −1/x से औपचारिक रूप से −2 निकलता है, फिर भी फलन जहाँ भी परिभाषित है वहाँ धनात्मक है। यह गणना मूल प्रमेय की कितनी परिकल्पनाओं का उल्लंघन करती है?",
          mr: "−1 ते 1 पर्यंत 1/x² चे निश्चित समाकल प्रतिअवकलज −1/x ने औपचारिकपणे −2 निघते, तरीही फलन जिथे परिभाषित आहे तिथे धन आहे. ही गणना मूलभूत प्रमेयाच्या किती गृहीतकांचे उल्लंघन करते?",
        },
        answer: 1,
        wrong: [0, 2, 3],
        checkExpr: "2-1",
        solution: {
          en: "One. The theorem requires the integrand to be continuous on the closed interval of integration, and 1/x² is undefined at 0, which sits squarely inside [−1, 1]. That single failure is enough to make the whole computation meaningless, and the answer it produces is not merely inaccurate but impossible: a positive function cannot enclose a negative area. Two lessons come out of this, and the second is the important one. The first is the obvious warning to check continuity before applying the theorem. The second is subtler: the absurd sign is what makes the error DETECTABLE. Had the false answer come out positive — as it does for some similar integrals — nothing on the page would have looked wrong, and the mistake would have passed. A wrong method that produces plausible output is far more dangerous than one that produces nonsense, and the habit worth building is checking a result against something known independently of the method that produced it. Here the independent fact is a sign, which costs nothing to check. (0 accepts the formal manipulation because every symbol was moved correctly.)",
          hi: "एक। प्रमेय माँगता है कि समाकल्य समाकलन के बंद अंतराल पर संतत हो, और 1/x², 0 पर अपरिभाषित है, जो [−1, 1] के ठीक भीतर बैठा है। वह अकेली विफलता पूरी गणना को निरर्थक करने के लिए काफ़ी है, और वह जो उत्तर देती है वह महज़ अशुद्ध नहीं बल्कि असंभव है: धनात्मक फलन ऋणात्मक क्षेत्रफल नहीं घेर सकता। इससे दो सबक़ निकलते हैं, और दूसरा ही महत्वपूर्ण है। पहला स्पष्ट चेतावनी है कि प्रमेय लगाने से पहले संततता जाँचो। दूसरा सूक्ष्म है: बेतुका चिह्न ही त्रुटि को पकड़ने योग्य बनाता है। यदि झूठा उत्तर धनात्मक निकला होता — जैसा कुछ मिलते-जुलते समाकलों में होता है — तो काग़ज़ पर कुछ भी ग़लत न दिखता, और भूल निकल जाती। जो ग़लत विधि विश्वसनीय परिणाम देती है वह बकवास देने वाली से कहीं अधिक ख़तरनाक है, और बनाने लायक़ आदत यह है कि परिणाम को उस विधि से स्वतंत्र किसी ज्ञात चीज़ के विरुद्ध जाँचो जिसने उसे पैदा किया। यहाँ स्वतंत्र तथ्य एक चिह्न है, जिसे जाँचने में कुछ नहीं लगता। (0 औपचारिक हेरफेर स्वीकार कर लेता है क्योंकि हर चिह्न ठीक से हिलाया गया था।)",
          mr: "एक. प्रमेय मागते की समाकल्य समाकलनाच्या बंद अंतरालावर संतत असावा, आणि 1/x² हे 0 वर अपरिभाषित आहे, जो [−1, 1] च्या नेमक्या आत बसला आहे. ते एकटे अपयश अख्खी गणना निरर्थक करण्यास पुरेसे आहे, आणि ती जे उत्तर देते ते केवळ चुकीचे नव्हे तर अशक्य आहे: धन फलन ऋण क्षेत्रफळ वेढू शकत नाही. यातून दोन धडे निघतात, आणि दुसराच महत्त्वाचा आहे. पहिला स्पष्ट इशारा आहे की प्रमेय लावण्याआधी संततता तपासा. दुसरा सूक्ष्म आहे: विसंगत चिन्हच त्रुटीला पकडण्याजोगे बनवते. जर खोटे उत्तर धन निघाले असते — जसे काही सारख्या समाकलांत होते — तर कागदावर काहीच चुकीचे दिसले नसते, आणि चूक निसटली असती. जी चुकीची पद्धत विश्वसनीय निकाल देते ती मूर्खपणा देणाऱ्याहून कितीतरी अधिक धोकादायक आहे, आणि बनवण्याजोगी सवय ही की निकालाला त्याला निर्माण करणाऱ्या पद्धतीपासून स्वतंत्र अशा ज्ञात गोष्टीविरुद्ध तपासा. इथे स्वतंत्र तथ्य एक चिन्ह आहे, जे तपासायला काहीच लागत नाही. (0 औपचारिक हाताळणी स्वीकारते कारण प्रत्येक चिन्ह बरोबर हलवले गेले होते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Of the four functions eˣ, sin x, 1/x and e^(−x²), how many have an antiderivative expressible in elementary functions?",
          hi: "चार फलनों eˣ, sin x, 1/x और e^(−x²) में से कितनों का प्रतिअवकलज प्रारंभिक फलनों में व्यक्त किया जा सकता है?",
          mr: "eˣ, sin x, 1/x आणि e^(−x²) या चार फलनांपैकी कितींचा प्रतिअवकलज प्राथमिक फलनांत व्यक्त करता येतो?",
        },
        answer: 3,
        wrong: [4, 2, 1],
        checkExpr: "4-1",
        solution: {
          en: "Three — the first three give eˣ, −cos x and ln|x|, and e^(−x²) does not. That last one is not a gap in anyone's technique. Liouville proved in the 1830s that no finite combination of powers, roots, exponentials, logarithms and trigonometric functions differentiates to e^(−x²), so the search is not merely hard, it is provably hopeless. This is worth dwelling on because of the asymmetry it exposes between the two operations of the calculus. Differentiation is an algorithm: every elementary function has an elementary derivative, and the rules compose mechanically, so a machine can do it and a student can always finish. Integration has no such guarantee — the elementary functions are simply not closed under it, and the ones that escape are not exotic. e^(−x²) is the normal distribution, the single most-used curve in all of statistics, and every probability table ever printed exists precisely because its integral cannot be written down and has to be computed numerically instead. The tables are not a convenience; they are a consequence of a theorem. (4 assumes that a function elementary enough to write must have an antiderivative one can write.)",
          hi: "तीन — पहले तीन eˣ, −cos x और ln|x| देते हैं, और e^(−x²) नहीं देता। वह आख़िरी किसी की तकनीक की कमी नहीं है। लियूविल ने 1830 के दशक में सिद्ध किया कि घातों, मूलों, चरघातांकियों, लघुगणकों और त्रिकोणमितीय फलनों का कोई परिमित संयोजन अवकलित होकर e^(−x²) नहीं बनता, अतः खोज महज़ कठिन नहीं, प्रमाणित रूप से निष्फल है। इस पर ठहरना ज़रूरी है क्योंकि यह कलन की दो संक्रियाओं के बीच की असममिति उजागर करता है। अवकलन एक कलनविधि है: हर प्रारंभिक फलन का प्रारंभिक अवकलज है, और नियम यंत्रवत जुड़ते हैं, अतः मशीन कर सकती है और विद्यार्थी सदा पूरा कर सकता है। समाकलन में ऐसी कोई गारंटी नहीं — प्रारंभिक फलन उसके अंतर्गत बस बंद नहीं हैं, और जो बच निकलते हैं वे विचित्र नहीं हैं। e^(−x²) प्रसामान्य बंटन है, समस्त सांख्यिकी का सबसे अधिक बरता जाने वाला अकेला वक्र, और अब तक छपी हर प्रायिकता सारणी ठीक इसीलिए मौजूद है कि उसका समाकल लिखा नहीं जा सकता और उसे संख्यात्मक रूप से गणित करना पड़ता है। सारणियाँ सुविधा नहीं; वे एक प्रमेय का परिणाम हैं। (4 मान लेता है कि लिखने लायक़ प्रारंभिक फलन का प्रतिअवकलज भी लिखा जा सकेगा।)",
          mr: "तीन — पहिली तीन eˣ, −cos x आणि ln|x| देतात, आणि e^(−x²) देत नाही. ते शेवटचे कोणाच्या तंत्रातील उणीव नाही. लिउव्हिलने 1830 च्या दशकात सिद्ध केले की घात, मुळे, घातांकी, लघुगणक आणि त्रिकोणमितीय फलनांचे कोणतेही सांत संयोजन अवकलित होऊन e^(−x²) बनत नाही, म्हणून शोध केवळ कठीण नव्हे, सिद्धपणे निष्फळ आहे. यावर थांबणे आवश्यक आहे कारण हे कलनाच्या दोन क्रियांमधील असममिती उघड करते. अवकलन ही कलनविधी आहे: प्रत्येक प्राथमिक फलनाचा प्राथमिक अवकलज आहे, आणि नियम यांत्रिकपणे जोडले जातात, म्हणून यंत्र करू शकते आणि विद्यार्थी नेहमी पूर्ण करू शकतो. समाकलनात अशी कोणतीही हमी नाही — प्राथमिक फलने त्याखाली केवळ बंद नाहीत, आणि जी निसटतात ती विचित्र नाहीत. e^(−x²) हे प्रसामान्य वितरण आहे, अख्ख्या संख्याशास्त्रातील सर्वाधिक वापरला जाणारा एकटा वक्र, आणि आजवर छापलेली प्रत्येक संभाव्यता सारणी नेमके यासाठीच अस्तित्वात आहे की तिचे समाकल लिहिता येत नाही आणि ते संख्यात्मक रीत्या काढावे लागते. सारण्या सोय नाहीत; त्या एका प्रमेयाचा परिणाम आहेत. (4 गृहीत धरते की लिहिण्याजोग्या प्राथमिक फलनाचा प्रतिअवकलजही लिहिता येईल.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 6,
        stem: {
          en: "Dirichlet's function is 1 at every rational and 0 at every irrational. Counting the Riemann integral and the Lebesgue integral, in how many of the two senses is it integrable on [0, 1]?",
          hi: "डिरिख़्ले का फलन हर परिमेय पर 1 और हर अपरिमेय पर 0 है। रीमान समाकल और लेब्ज़ेग समाकल गिनते हुए, [0, 1] पर वह दोनों में से कितने अर्थों में समाकलनीय है?",
          mr: "डिरिक्लेचे फलन प्रत्येक परिमेयावर 1 आणि प्रत्येक अपरिमेयावर 0 आहे. रीमान समाकल आणि लेबेग समाकल मोजता, [0, 1] वर ते दोहोंपैकी किती अर्थांनी समाकलनीय आहे?",
        },
        answer: 1,
        wrong: [0, 2, 3],
        checkExpr: "2-1",
        solution: {
          en: "One — Lebesgue, not Riemann. The Riemann construction slices the DOMAIN into intervals and asks what the function does on each, but every interval however short contains both rationals and irrationals, so the upper sums are all 1 and the lower sums all 0 and they never meet. The Lebesgue construction slices the RANGE instead and asks how much domain is sent to each value, which turns the problem into a question of measure: the rationals are countable and therefore have measure zero, the irrationals have measure one, and the integral is 1 × 0 + 0 × 1 = 0. Two things are worth taking from this. The first is that the failure was never about the function being strange — the function is completely specified and takes only two values — but about the METHOD asking the wrong question of it. Slicing the domain assumes nearby inputs give nearby outputs, which is exactly what this function refuses. The second is a caution about what integrability means. It is not a property of a function alone; it is a property of a function together with a theory of integration, and the same object can be integrable in one and not in another. Riemann's theory is not wrong, it is narrower, and the twentieth century's reason for building Lebesgue's was that limits of Riemann-integrable functions kept escaping the class — a set closed under the operations one actually performs is worth more than an intuitive definition. (0 assumes that failing the integral one has been taught means failing to be integrable.)",
          hi: "एक — लेब्ज़ेग, रीमान नहीं। रीमान की रचना प्रांत को अंतरालों में काटती है और पूछती है कि हर एक पर फलन क्या करता है, पर हर अंतराल चाहे कितना छोटा हो, परिमेय और अपरिमेय दोनों रखता है, अतः ऊपरी योग सब 1 और निचले योग सब 0 हैं और वे कभी मिलते नहीं। लेब्ज़ेग की रचना इसके बजाय परिसर को काटती है और पूछती है कि हर मान पर कितना प्रांत भेजा जाता है, जो समस्या को माप के प्रश्न में बदल देती है: परिमेय गणनीय हैं और इसलिए उनका माप शून्य है, अपरिमेय का माप एक है, और समाकल है 1 × 0 + 0 × 1 = 0. इससे दो बातें लेने लायक़ हैं। पहली, विफलता कभी फलन के विचित्र होने के बारे में थी ही नहीं — फलन पूरी तरह निर्दिष्ट है और केवल दो मान लेता है — बल्कि विधि के उससे ग़लत प्रश्न पूछने के बारे में। प्रांत काटना मान लेता है कि पास के निवेश पास के निर्गम देते हैं, और यही वह फलन इनकार करता है। दूसरी, समाकलनीयता के अर्थ पर एक चेतावनी। वह अकेले फलन का गुण नहीं; वह फलन और समाकलन के किसी सिद्धांत का साझा गुण है, और वही वस्तु एक में समाकलनीय हो सकती है और दूसरे में नहीं। रीमान का सिद्धांत ग़लत नहीं, संकरा है, और बीसवीं सदी के पास लेब्ज़ेग का सिद्धांत बनाने का कारण यह था कि रीमान-समाकलनीय फलनों की सीमाएँ उस वर्ग से बाहर भागती रहती थीं — जिन संक्रियाओं को तुम सचमुच करते हो उनके अंतर्गत बंद समुच्चय किसी सहज परिभाषा से अधिक क़ीमती है। (0 मान लेता है कि जो समाकल पढ़ाया गया है उसमें विफल होना समाकलनीय न होना है।)",
          mr: "एक — लेबेग, रीमान नव्हे. रीमानची रचना प्रांताला अंतरालांत कापते आणि विचारते की प्रत्येकावर फलन काय करते, पण प्रत्येक अंतराल कितीही लहान असो, परिमेय आणि अपरिमेय दोन्ही बाळगते, म्हणून वरच्या बेरजा सर्व 1 आणि खालच्या सर्व 0 आहेत आणि त्या कधीच भेटत नाहीत. लेबेगची रचना त्याऐवजी परिसर कापते आणि विचारते की प्रत्येक मूल्याकडे किती प्रांत पाठवला जातो, जे समस्येला मापाच्या प्रश्नात बदलते: परिमेय गणनीय आहेत आणि म्हणून त्यांचे माप शून्य आहे, अपरिमेयांचे माप एक आहे, आणि समाकल आहे 1 × 0 + 0 × 1 = 0. यातून दोन गोष्टी घेण्याजोग्या आहेत. पहिली, अपयश कधीच फलन विचित्र असण्याबद्दल नव्हतेच — फलन पूर्णपणे निर्दिष्ट आहे आणि केवळ दोन मूल्ये घेते — तर पद्धतीने त्याला चुकीचा प्रश्न विचारण्याबद्दल होते. प्रांत कापणे गृहीत धरते की जवळची निविष्टे जवळची निर्गते देतात, आणि नेमके तेच हे फलन नाकारते. दुसरी, समाकलनीयतेच्या अर्थाबद्दलचा इशारा. तो एकट्या फलनाचा गुणधर्म नाही; तो फलन आणि समाकलनाच्या एखाद्या सिद्धांताचा संयुक्त गुणधर्म आहे, आणि तीच वस्तू एकात समाकलनीय असू शकते आणि दुसऱ्यात नाही. रीमानचा सिद्धांत चुकीचा नाही, अरुंद आहे, आणि विसाव्या शतकाकडे लेबेगचा बांधण्याचे कारण हे होते की रीमान-समाकलनीय फलनांच्या सीमा त्या वर्गातून पळत राहत होत्या — तुम्ही प्रत्यक्षात ज्या क्रिया करता त्यांखाली बंद असलेला संच कोणत्याही सहज व्याख्येहून अधिक मोलाचा आहे. (0 गृहीत धरते की शिकवलेल्या समाकलात अपयशी ठरणे म्हणजे समाकलनीय नसणे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "∫₀^∞ (sin x)/x dx converges to π/2, but ∫₀^∞ |sin x|/x dx diverges. Of the two integrals, how many converge absolutely?",
          hi: "∫₀^∞ (sin x)/x dx, π/2 पर अभिसरित होता है, पर ∫₀^∞ |sin x|/x dx अपसरित होता है। दोनों समाकलों में से कितने निरपेक्ष रूप से अभिसरित होते हैं?",
          mr: "∫₀^∞ (sin x)/x dx हे π/2 वर अभिसरित होते, पण ∫₀^∞ |sin x|/x dx अपसरित होते. दोन्ही समाकलांपैकी किती निरपेक्षपणे अभिसरित होतात?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        checkExpr: "1-1",
        solution: {
          en: "Neither, which is the trap. Absolute convergence means the integral of the ABSOLUTE VALUE converges, and the question tells you outright that it does not — so the first integral converges only conditionally, and the second does not converge at all and therefore cannot converge absolutely either. The count is 0. The mechanism is worth seeing. Over each successive arch of the sine the contribution is roughly 2/(nπ) in size and alternating in sign. The alternating series converges, because consecutive terms very nearly cancel; the series of magnitudes is essentially the harmonic series, which diverges, because 1/n shrinks but never fast enough. So the whole convergence rests on cancellation rather than on smallness, and that is a structurally different and far more fragile thing. The fragility is not academic: for an absolutely convergent integral the order of summation is irrelevant, whereas a conditionally convergent one can be made to approach ANY value whatever by rearranging the pieces, which is Riemann's rearrangement theorem in its integral guise. So π/2 is not simply 'the' value of the first integral; it is the value obtained by accumulating the arches in their natural left-to-right order, and that qualification, which is silent and invisible in every absolutely convergent case, is here carrying the entire answer. (1 reads 'converges' and 'converges absolutely' as the same claim.)",
          hi: "कोई नहीं, और यही जाल है। निरपेक्ष अभिसरण का अर्थ है कि निरपेक्ष मान का समाकल अभिसरित हो, और प्रश्न सीधे बता देता है कि वह नहीं होता — अतः पहला समाकल केवल सशर्त अभिसरित है, और दूसरा अभिसरित होता ही नहीं और इसलिए निरपेक्ष रूप से भी नहीं हो सकता। गिनती 0 है। क्रियाविधि देखने लायक़ है। ज्या के हर क्रमिक मेहराब पर योगदान का आकार मोटे तौर पर 2/(nπ) है और चिह्न बदलता रहता है। एकांतर श्रेणी अभिसरित होती है, क्योंकि क्रमागत पद लगभग पूरी तरह कट जाते हैं; परिमाणों की श्रेणी मूलतः हरात्मक श्रेणी है, जो अपसरित होती है, क्योंकि 1/n सिकुड़ता तो है पर कभी काफ़ी तेज़ी से नहीं। अतः पूरा अभिसरण छोटेपन पर नहीं, कटने पर टिका है, और यह संरचनात्मक रूप से भिन्न और कहीं अधिक नाज़ुक चीज़ है। नाज़ुकपन अकादमिक नहीं: निरपेक्ष अभिसारी समाकल के लिए जोड़ने का क्रम अप्रासंगिक है, जबकि सशर्त अभिसारी को टुकड़े फिर से क्रमबद्ध करके किसी भी मान के पास पहुँचाया जा सकता है, जो समाकल रूप में रीमान का पुनर्व्यवस्था प्रमेय है। अतः π/2 पहले समाकल का बस 'वह' मान नहीं है; वह मेहराबों को उनके स्वाभाविक बाएँ-से-दाएँ क्रम में संचित करने से मिला मान है, और वह शर्त, जो हर निरपेक्ष अभिसारी मामले में मौन और अदृश्य रहती है, यहाँ पूरा उत्तर ढो रही है। (1 'अभिसरित' और 'निरपेक्ष रूप से अभिसरित' को एक ही दावा पढ़ लेता है।)",
          mr: "एकही नाही, आणि हाच सापळा आहे. निरपेक्ष अभिसरण म्हणजे निरपेक्ष मूल्याचे समाकल अभिसरित होणे, आणि प्रश्न थेट सांगतो की ते होत नाही — म्हणून पहिले समाकल केवळ सशर्त अभिसरित आहे, आणि दुसरे अभिसरित होतच नाही आणि म्हणून निरपेक्षपणेही होऊ शकत नाही. मोजणी 0 आहे. कार्यपद्धती पाहण्याजोगी आहे. ज्येच्या प्रत्येक क्रमिक कमानीवर योगदानाचा आकार ढोबळमानाने 2/(nπ) आहे आणि चिन्ह बदलत राहते. एकांतर श्रेणी अभिसरित होते, कारण क्रमागत पदे जवळजवळ पूर्णपणे रद्द होतात; परिमाणांची श्रेणी मूलतः हरात्मक श्रेणी आहे, जी अपसरित होते, कारण 1/n आकुंचन पावते खरे पण कधीच पुरेशा वेगाने नाही. म्हणून अख्खे अभिसरण लहानपणावर नव्हे, रद्द होण्यावर टिकले आहे, आणि ही संरचनात्मक दृष्ट्या वेगळी आणि कितीतरी अधिक नाजूक गोष्ट आहे. नाजूकपणा शैक्षणिक नाही: निरपेक्ष अभिसारी समाकलासाठी बेरजेचा क्रम अप्रस्तुत आहे, तर सशर्त अभिसारीला तुकडे पुन्हा क्रमबद्ध करून कोणत्याही मूल्याजवळ नेता येते, जे समाकल रूपातील रीमानचे पुनर्रचना प्रमेय आहे. म्हणून π/2 हे पहिल्या समाकलाचे केवळ 'ते' मूल्य नाही; ते कमानी त्यांच्या नैसर्गिक डावीकडून-उजवीकडे क्रमाने संचित करून मिळालेले मूल्य आहे, आणि ती अट, जी प्रत्येक निरपेक्ष अभिसारी प्रसंगात मौन आणि अदृश्य राहते, इथे अख्खे उत्तर वाहत आहे. (1 'अभिसरित' आणि 'निरपेक्षपणे अभिसरित' यांना एकच दावा वाचते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-integrals",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 7 — Integrals",
      name: "Integrals",
      summary:
        "An inverse of differentiation that loses exactly one thing and recovers it at both limits: why the constant is unavoidable in one kind of integral and invisible in the other, why a running total is itself a function whose derivative is where it started, why an area under a hyperbola turns products into sums, and why one perfectly ordinary curve has no antiderivative that can be written down at all.",
      position: 7,
      translations: {
        hi: {
          name: "समाकल",
          summary:
            "अवकलन का ऐसा प्रतिलोम जो ठीक एक चीज़ खोता है और दोनों सीमाओं पर उसे वापस पा लेता है: अचर एक प्रकार के समाकल में अनिवार्य और दूसरे में अदृश्य क्यों है, चलता योग स्वयं ऐसा फलन क्यों है जिसका अवकलज वहीं है जहाँ से वह चला था, अतिपरवलय के नीचे का क्षेत्रफल गुणनफलों को योगों में क्यों बदलता है, और एक बिलकुल साधारण वक्र का ऐसा कोई प्रतिअवकलज क्यों नहीं जिसे लिखा जा सके।",
        },
        mr: {
          name: "समाकले",
          summary:
            "अवकलनाचा असा व्यस्त जो नेमकी एक गोष्ट गमावतो आणि दोन्ही सीमांवर ती परत मिळवतो: अचल एका प्रकारच्या समाकलात अटळ आणि दुसऱ्यात अदृश्य का आहे, चालती बेरीज स्वतः असे फलन का आहे ज्याचा अवकलज जिथून ती निघाली तिथेच आहे, अतिवर्तुळखंडाखालील क्षेत्रफळ गुणाकारांना बेरजांत का बदलते, आणि एका अगदी साधारण वक्राचा असा कोणताही प्रतिअवकलज का नाही जो लिहिता येईल.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 8 — Application of Integrals (an integral is not an area)          */
/* ------------------------------------------------------------------------- */
function applicationOfIntegrals12(): TopicFileOut {
  const rand = rng("maths-12-application-of-integrals");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the area under y = 4 from x = 0 to x = 3?",
          hi: "y = 4 के नीचे x = 0 से x = 3 तक क्षेत्रफल कितना है?",
          mr: "y = 4 च्या खाली x = 0 ते x = 3 पर्यंत क्षेत्रफळ किती?",
        },
        answer: 12,
        wrong: [7, 4, 3],
        checkExpr: "4*3",
        solution: {
          en: "It is a rectangle of height 4 and width 3, so the area is 12 — and the integral of the constant 4 from 0 to 3 gives 4x evaluated across, which is 12 too. Starting with a case one can check by eye is the point: every later formula in this chapter has to agree with the rectangle, and any that does not is being applied wrongly. (7 adds the height and width instead of multiplying.)",
          hi: "यह ऊँचाई 4 और चौड़ाई 3 का आयत है, अतः क्षेत्रफल 12 है — और अचर 4 का 0 से 3 तक समाकल 4x का मान देता है, जो 12 ही है। जिसे आँख से जाँचा जा सके ऐसे मामले से शुरू करना ही मुद्दा है: इस अध्याय के हर आगे के सूत्र को आयत से सहमत होना ही है, और जो नहीं होता वह ग़लत लगाया जा रहा है। (7 ऊँचाई और चौड़ाई को गुणा करने के बजाय जोड़ देता है।)",
          mr: "हा उंची 4 आणि रुंदी 3 चा आयत आहे, म्हणून क्षेत्रफळ 12 आहे — आणि अचल 4 चे 0 ते 3 पर्यंतचे समाकल 4x चे मूल्य देते, जे 12 च आहे. डोळ्याने तपासता येईल अशा प्रसंगापासून सुरुवात करणे हाच मुद्दा आहे: या अध्यायातील पुढील प्रत्येक सूत्राला आयताशी सहमत व्हावेच लागते, आणि जे होत नाही ते चुकीचे लावले जात आहे. (7 उंची आणि रुंदीचा गुणाकार करण्याऐवजी बेरीज करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the area of the region bounded by y = x, the x-axis, and x = 4?",
          hi: "y = x, x-अक्ष और x = 4 से घिरे क्षेत्र का क्षेत्रफल क्या है?",
          mr: "y = x, x-अक्ष आणि x = 4 यांनी वेढलेल्या प्रदेशाचे क्षेत्रफळ किती?",
        },
        answer: 8,
        wrong: [16, 4, 2],
        checkExpr: "4*4/2",
        solution: {
          en: "A right triangle with both legs 4, so half of 16, which is 8 — and integrating x from 0 to 4 gives x²/2 = 8. Again the geometry and the calculus agree, and it is worth doing these checks while they are still possible, because the curves get harder very soon and then only the integral is available. (16 gives the enclosing square.)",
          hi: "दोनों भुजाएँ 4 वाला समकोण त्रिभुज, अतः 16 का आधा, जो 8 है — और x का 0 से 4 तक समाकलन x²/2 = 8 देता है। फिर ज्यामिति और कलन सहमत हैं, और ये जाँचें तब तक करते रहना ठीक है जब तक संभव हैं, क्योंकि वक्र बहुत जल्द कठिन हो जाते हैं और फिर केवल समाकल ही उपलब्ध रहता है। (16 घेरने वाला वर्ग देता है।)",
          mr: "दोन्ही बाजू 4 असलेला काटकोन त्रिकोण, म्हणून 16 चा अर्धा, जो 8 आहे — आणि x चे 0 ते 4 पर्यंत समाकलन x²/2 = 8 देते. पुन्हा भूमिती आणि कलन सहमत आहेत, आणि या तपासण्या शक्य असेपर्यंत करत राहणे बरे, कारण वक्र फार लवकर कठीण होतात आणि मग केवळ समाकलच उपलब्ध राहते. (16 वेढणारा चौरस देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "A circle of radius 3 has area 9π. What is the area of one quadrant of it, as a multiple of π?",
          hi: "3 त्रिज्या वाले वृत्त का क्षेत्रफल 9π है। उसके एक चतुर्थांश का क्षेत्रफल π के कितने गुना है?",
          mr: "3 त्रिज्येच्या वर्तुळाचे क्षेत्रफळ 9π आहे. त्याच्या एका चतुर्थांशाचे क्षेत्रफळ π च्या किती पट?",
        },
        answer: 2.25,
        wrong: [3, 4.5, 1.5],
        checkExpr: "9/4",
        solution: {
          en: "9/4 = 2.25. A quadrant is a quarter of the whole by symmetry, and no integration is needed. That matters because the quarter-circle IS the integral of √(9 − x²) from 0 to 3, which is a genuinely awkward integral requiring a trigonometric substitution — and here symmetry has evaluated it for free. Looking for a symmetry before reaching for a technique is the cheapest habit in the chapter. (4.5 halves the circle rather than quartering it.)",
          hi: "9/4 = 2.25. सममिति से चतुर्थांश पूरे का चौथाई है, और किसी समाकलन की ज़रूरत नहीं। यह मायने रखता है क्योंकि चौथाई वृत्त 0 से 3 तक √(9 − x²) का समाकल ही है, जो सचमुच बेढंगा समाकल है और त्रिकोणमितीय प्रतिस्थापन माँगता है — और यहाँ सममिति ने उसे मुफ़्त में हल कर दिया। किसी तकनीक की ओर बढ़ने से पहले सममिति ढूँढ़ना अध्याय की सबसे सस्ती आदत है। (4.5 वृत्त को चौथाई करने के बजाय आधा करता है।)",
          mr: "9/4 = 2.25. सममितीने चतुर्थांश हा अख्ख्याचा चौथा भाग आहे, आणि कोणत्याही समाकलनाची गरज नाही. हे महत्त्वाचे आहे कारण चतुर्थांश वर्तुळ म्हणजे 0 ते 3 पर्यंत √(9 − x²) चे समाकलच आहे, जे खरोखर बेढब समाकल आहे आणि त्रिकोणमितीय प्रतिस्थापन मागते — आणि इथे सममितीने ते फुकटात सोडवले. एखाद्या तंत्राकडे वळण्याआधी सममिती शोधणे ही अध्यायातील सर्वांत स्वस्त सवय आहे. (4.5 वर्तुळाला चतुर्थांश करण्याऐवजी अर्धे करते.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the area between y = x² and y = x from x = 0 to x = 1, as a fraction with denominator 6?",
          hi: "x = 0 से x = 1 तक y = x² और y = x के बीच का क्षेत्रफल 6 हर वाली भिन्न के रूप में क्या है?",
          mr: "x = 0 ते x = 1 पर्यंत y = x² आणि y = x यांमधील क्षेत्रफळ 6 छेद असलेल्या अपूर्णांक स्वरूपात किती?",
        },
        answer: 1,
        wrong: [2, 3, 5],
        checkExpr: "3-2",
        solution: {
          en: "Integrating the difference x − x² gives x²/2 − x³/3, which at 1 is 1/2 − 1/3 = 1/6, so the numerator is 1. The method is the one to carry forward: for a region between two curves, integrate the upper minus the lower, and the answer comes out directly with no separate areas to subtract afterwards. Getting the order wrong gives −1/6, and a negative area is the signal that the two were swapped. (3 answers with the numerator of one of the two halves.)",
          hi: "अंतर x − x² का समाकलन x²/2 − x³/3 देता है, जो 1 पर 1/2 − 1/3 = 1/6 है, अतः अंश 1 है। यही विधि आगे ले जाने लायक़ है: दो वक्रों के बीच के क्षेत्र के लिए ऊपर वाले में से नीचे वाला घटाकर समाकलन करो, और उत्तर सीधा निकल आता है, बाद में घटाने को अलग क्षेत्रफल नहीं बचते। क्रम ग़लत करने पर −1/6 मिलता है, और ऋणात्मक क्षेत्रफल ही संकेत है कि दोनों उलट गए। (3 दोनों आधों में से एक का अंश उत्तर देता है।)",
          mr: "फरक x − x² चे समाकलन x²/2 − x³/3 देते, जे 1 वर 1/2 − 1/3 = 1/6 आहे, म्हणून अंश 1 आहे. हीच पद्धत पुढे न्यायला हवी: दोन वक्रांमधील प्रदेशासाठी वरचा वजा खालचा असे समाकलन करा, आणि उत्तर थेट निघते, नंतर वजा करण्यासाठी वेगळी क्षेत्रफळे उरत नाहीत. क्रम चुकल्यास −1/6 मिळते, आणि ऋण क्षेत्रफळ हाच संकेत आहे की दोन्ही उलटले. (3 दोन अर्ध्यांपैकी एकाचा अंश उत्तर देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The integral of x³ from −1 to 1 is 0. What is the AREA enclosed between the curve and the x-axis over that interval, as a fraction with denominator 2?",
          hi: "−1 से 1 तक x³ का समाकल 0 है। उस अंतराल पर वक्र और x-अक्ष के बीच घिरा क्षेत्रफल 2 हर वाली भिन्न के रूप में क्या है?",
          mr: "−1 ते 1 पर्यंत x³ चे समाकल 0 आहे. त्या अंतरालावर वक्र आणि x-अक्ष यांमध्ये वेढलेले क्षेत्रफळ 2 छेद असलेल्या अपूर्णांक स्वरूपात किती?",
        },
        answer: 1,
        wrong: [0, 2, 4],
        checkExpr: "2-1",
        solution: {
          en: "Each half contributes 1/4, so the total area is 1/2 and the numerator is 1. The integral is 0 because the left half lies below the axis and is counted negatively; the area is not, because area has no sign. This is the single most important distinction in the chapter and the one most often skipped: an integral is a SIGNED accumulation, and to get an area you must split at every crossing of the axis and add the magnitudes. Whenever an area question returns zero or a negative number, the splitting was not done. (0 hands back the integral instead of the area.)",
          hi: "हर आधा 1/4 का योगदान देता है, अतः कुल क्षेत्रफल 1/2 और अंश 1 है। समाकल 0 है क्योंकि बायाँ आधा अक्ष के नीचे है और ऋणात्मक गिना जाता है; क्षेत्रफल नहीं, क्योंकि क्षेत्रफल का कोई चिह्न नहीं होता। यह अध्याय का सबसे महत्वपूर्ण अकेला भेद है और सबसे अधिक छोड़ा जाने वाला भी: समाकल चिह्न-सहित संचय है, और क्षेत्रफल पाने के लिए अक्ष के हर पार-बिंदु पर बाँटकर परिमाण जोड़ने होंगे। जब भी क्षेत्रफल का प्रश्न शून्य या ऋणात्मक संख्या लौटाए, बँटवारा किया ही नहीं गया। (0 क्षेत्रफल के बजाय समाकल लौटा देता है।)",
          mr: "प्रत्येक अर्धा 1/4 चे योगदान देतो, म्हणून एकूण क्षेत्रफळ 1/2 आणि अंश 1 आहे. समाकल 0 आहे कारण डावा अर्धा अक्षाखाली आहे आणि ऋण मोजला जातो; क्षेत्रफळ नाही, कारण क्षेत्रफळाला चिन्ह नसते. हा अध्यायातील सर्वांत महत्त्वाचा एकटा भेद आहे आणि सर्वाधिक वगळला जाणाराही: समाकल हा चिन्ह-सहित संचय आहे, आणि क्षेत्रफळ मिळवण्यासाठी अक्षाच्या प्रत्येक छेदनबिंदूवर विभागून परिमाणे जोडावी लागतात. जेव्हा जेव्हा क्षेत्रफळाचा प्रश्न शून्य वा ऋण संख्या परत करतो, तेव्हा विभागणी झालीच नाही. (0 क्षेत्रफळाऐवजी समाकल परत करते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The parabola y = x² and the line y = 4 meet at two points. How far apart are those points?",
          hi: "परवलय y = x² और रेखा y = 4 दो बिंदुओं पर मिलते हैं। वे बिंदु कितनी दूर हैं?",
          mr: "वर्तुळखंड y = x² आणि रेषा y = 4 दोन बिंदूंवर भेटतात. ते बिंदू किती अंतरावर आहेत?",
        },
        answer: 4,
        wrong: [2, 8, 16],
        checkExpr: "2+2",
        solution: {
          en: "x² = 4 gives x = ±2, so the points are (−2, 4) and (2, 4), a distance of 4 apart. Finding the intersections FIRST is the step that makes an area problem well posed, because those x-values are the limits of the integral and nothing can be set up without them. Questions that hand you the limits are doing this work for you; questions that describe a region in words are not, and forgetting to find them is the reason such problems stall before any integration begins. (2 gives one root rather than the gap between them.)",
          hi: "x² = 4 से x = ±2 मिलता है, अतः बिंदु (−2, 4) और (2, 4) हैं, जिनके बीच दूरी 4 है। पहले प्रतिच्छेद ढूँढ़ना ही वह क़दम है जो क्षेत्रफल की समस्या को सुगठित बनाता है, क्योंकि वही x-मान समाकल की सीमाएँ हैं और उनके बिना कुछ खड़ा नहीं किया जा सकता। जो प्रश्न सीमाएँ थमा देते हैं वे यह काम तुम्हारे लिए कर रहे हैं; जो प्रश्न क्षेत्र को शब्दों में बताते हैं वे नहीं, और उन्हें ढूँढ़ना भूल जाना ही कारण है कि ऐसी समस्याएँ किसी समाकलन के शुरू होने से पहले ही अटक जाती हैं। (2 उनके बीच के अंतर के बजाय एक मूल देता है।)",
          mr: "x² = 4 वरून x = ±2 मिळते, म्हणून बिंदू (−2, 4) आणि (2, 4) आहेत, ज्यांमधील अंतर 4 आहे. आधी छेदनबिंदू शोधणे हेच ते पाऊल आहे जे क्षेत्रफळाच्या समस्येला सुसंगत बनवते, कारण तीच x-मूल्ये समाकलाच्या सीमा आहेत आणि त्यांच्याशिवाय काहीच उभे करता येत नाही. जे प्रश्न सीमा देऊन टाकतात ते हे काम तुमच्यासाठी करत आहेत; जे प्रश्न प्रदेशाचे शब्दांत वर्णन करतात ते नाहीत, आणि ते शोधणे विसरणे हेच कारण आहे की अशा समस्या कोणतेही समाकलन सुरू होण्याआधीच अडकतात. (2 त्यांमधील अंतराऐवजी एक मूळ देते.)",
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
          en: "The region between y = x² and y = 4 has area 32/3. What is the numerator?",
          hi: "y = x² और y = 4 के बीच के क्षेत्र का क्षेत्रफल 32/3 है। अंश क्या है?",
          mr: "y = x² आणि y = 4 यांमधील प्रदेशाचे क्षेत्रफळ 32/3 आहे. अंश किती?",
        },
        answer: 32,
        wrong: [16, 8, 64],
        checkExpr: "16+16",
        solution: {
          en: "Integrating 4 − x² from −2 to 2 gives 4x − x³/3, and evaluating gives (8 − 8/3) − (−8 + 8/3) = 32/3, so the numerator is 32. Worth checking against the bounding rectangle, which is 4 wide and 4 tall with area 16: the region takes two-thirds of it, the complement being the third that the parabola claimed in the previous chapter. The two fractions must add to one, and noticing that they do is a free check on an answer that is otherwise easy to get wrong by a factor of 2. (16 gives the rectangle instead of the region.)",
          hi: "−2 से 2 तक 4 − x² का समाकलन 4x − x³/3 देता है, और मान निकालने पर (8 − 8/3) − (−8 + 8/3) = 32/3, अतः अंश 32 है। घेरने वाले आयत के विरुद्ध जाँचने लायक़, जो 4 चौड़ा और 4 ऊँचा है और जिसका क्षेत्रफल 16 है: क्षेत्र उसका दो-तिहाई लेता है, और पूरक वही तिहाई है जो परवलय ने पिछले अध्याय में लिया था। दोनों भिन्नों का योग एक होना ही चाहिए, और यह देख लेना उस उत्तर पर मुफ़्त जाँच है जिसे वरना 2 के गुणक से ग़लत करना आसान है। (16 क्षेत्र के बजाय आयत देता है।)",
          mr: "−2 ते 2 पर्यंत 4 − x² चे समाकलन 4x − x³/3 देते, आणि मूल्य काढल्यास (8 − 8/3) − (−8 + 8/3) = 32/3, म्हणून अंश 32 आहे. वेढणाऱ्या आयताविरुद्ध तपासण्याजोगे, जो 4 रुंद आणि 4 उंच आहे आणि ज्याचे क्षेत्रफळ 16 आहे: प्रदेश त्याचा दोन-तृतीयांश घेतो, आणि पूरक तोच तृतीयांश आहे जो वर्तुळखंडाने मागील अध्यायात घेतला होता. दोन्ही अपूर्णांकांची बेरीज एक असलीच पाहिजे, आणि हे पाहून घेणे त्या उत्तरावर फुकट तपासणी आहे जे अन्यथा 2 च्या गुणकाने चुकवणे सोपे आहे. (16 प्रदेशाऐवजी आयत देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The area enclosed by the ellipse x²/16 + y²/9 = 1 is kπ. What is k?",
          hi: "दीर्घवृत्त x²/16 + y²/9 = 1 से घिरा क्षेत्रफल kπ है। k क्या है?",
          mr: "दीर्घवर्तुळ x²/16 + y²/9 = 1 ने वेढलेले क्षेत्रफळ kπ आहे. k किती?",
        },
        answer: 12,
        wrong: [16, 9, 25],
        checkExpr: "4*3",
        solution: {
          en: "12, since the area of an ellipse is πab with a = 4 and b = 3. The result is worth understanding rather than memorising: an ellipse is a circle stretched by a factor of 4 in one direction and 3 in the other, and stretching multiplies areas by the stretch factors, so a unit circle of area π becomes 4 × 3 × π. That argument needs no integration and generalises immediately — the same reasoning gives the volume of an ellipsoid from that of a sphere. Note also the check: setting a = b = r recovers πr², as any correct formula must. (25 adds the two denominators.)",
          hi: "12, क्योंकि दीर्घवृत्त का क्षेत्रफल πab है जिसमें a = 4 और b = 3. परिणाम रटने के बजाय समझने लायक़ है: दीर्घवृत्त वह वृत्त है जो एक दिशा में 4 और दूसरी में 3 के गुणक से खींचा गया है, और खींचना क्षेत्रफलों को खिंचाव-गुणकों से गुणा करता है, अतः π क्षेत्रफल वाला इकाई वृत्त 4 × 3 × π बन जाता है। उस तर्क को किसी समाकलन की ज़रूरत नहीं और वह तुरंत सामान्यीकृत होता है — वही तर्क गोले से दीर्घवृत्ताभ का आयतन दे देता है। जाँच भी ध्यान दो: a = b = r रखने पर πr² लौट आता है, जैसा किसी सही सूत्र को लौटाना ही चाहिए। (25 दोनों हर जोड़ देता है।)",
          mr: "12, कारण दीर्घवर्तुळाचे क्षेत्रफळ πab आहे ज्यात a = 4 आणि b = 3. निकाल पाठ करण्याऐवजी समजण्याजोगा आहे: दीर्घवर्तुळ म्हणजे एका दिशेने 4 आणि दुसऱ्या दिशेने 3 च्या गुणकाने ताणलेले वर्तुळ, आणि ताणणे क्षेत्रफळांना ताण-गुणकांनी गुणते, म्हणून π क्षेत्रफळाचे एकक वर्तुळ 4 × 3 × π बनते. त्या युक्तिवादाला कोणत्याही समाकलनाची गरज नाही आणि तो लगेच सर्वसाधारण होतो — तोच युक्तिवाद गोलावरून दीर्घगोलाचे घनफळ देतो. तपासणीही लक्षात घ्या: a = b = r ठेवल्यास πr² परत येते, जसे कोणत्याही बरोबर सूत्राने परत करावेच. (25 दोन्ही छेद जोडते.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 4,
        stem: {
          en: "The area between y = sin x and the x-axis from 0 to 2π is 4, while the integral over the same range is 0. At how many interior points must the interval be split to get the area?",
          hi: "0 से 2π तक y = sin x और x-अक्ष के बीच क्षेत्रफल 4 है, जबकि उसी परास पर समाकल 0 है। क्षेत्रफल पाने के लिए अंतराल को कितने भीतरी बिंदुओं पर बाँटना होगा?",
          mr: "0 ते 2π पर्यंत y = sin x आणि x-अक्ष यांमधील क्षेत्रफळ 4 आहे, तर त्याच पल्ल्यावरील समाकल 0 आहे. क्षेत्रफळ मिळवण्यासाठी अंतराल किती आंतरिक बिंदूंवर विभागावे लागेल?",
        },
        answer: 1,
        wrong: [2, 3, 0],
        checkExpr: "2-1",
        solution: {
          en: "One — at π, and only there. Sine vanishes at 0, π and 2π, but 0 and 2π are the endpoints and do not divide anything; only π is interior, and it separates the arch above the axis from the arch below. Each arch has area 2 and the total is 4, while the signed integral cancels them to 0. The general rule follows directly and is worth stating: the number of splits is the number of ZEROS STRICTLY INSIDE the interval, which is one fewer than the number of sign regions. Counting the endpoints as split points is the standard way to produce an over-split answer, and it is harmless arithmetically but a sign the rule has not been understood. (2 counts a zero at each end of the range as well.)",
          hi: "एक — π पर, और केवल वहीं। ज्या 0, π और 2π पर शून्य होती है, पर 0 और 2π सिरे हैं और कुछ बाँटते नहीं; केवल π भीतरी है, और वह अक्ष के ऊपर के मेहराब को नीचे के मेहराब से अलग करता है। हर मेहराब का क्षेत्रफल 2 है और कुल 4, जबकि चिह्न-सहित समाकल उन्हें काटकर 0 कर देता है। सामान्य नियम सीधे निकलता है और कहने लायक़ है: बँटवारों की संख्या अंतराल के ठीक भीतर के शून्यों की संख्या है, जो चिह्न-क्षेत्रों की संख्या से एक कम है। सिरों को बँटवारा-बिंदु गिनना अधिक-बँटा उत्तर पैदा करने का मानक तरीक़ा है, और वह गणित की दृष्टि से हानिरहित है पर संकेत है कि नियम समझा नहीं गया। (2 परास के हर सिरे पर भी एक शून्य गिन लेता है।)",
          mr: "एक — π वर, आणि फक्त तिथेच. ज्या 0, π आणि 2π वर शून्य होते, पण 0 आणि 2π ही टोके आहेत आणि काहीच विभागत नाहीत; फक्त π आंतरिक आहे, आणि तो अक्षावरील कमानीला खालच्या कमानीपासून वेगळा करतो. प्रत्येक कमानीचे क्षेत्रफळ 2 आहे आणि एकूण 4, तर चिन्ह-सहित समाकल त्यांना रद्द करून 0 करते. सर्वसाधारण नियम थेट निघतो आणि सांगण्याजोगा आहे: विभागण्यांची संख्या ही अंतरालाच्या नेमक्या आत असलेल्या शून्यांची संख्या आहे, जी चिन्ह-प्रदेशांच्या संख्येहून एकने कमी आहे. टोके विभाजन-बिंदू मोजणे हा जास्त-विभागलेले उत्तर तयार करण्याचा प्रमाण मार्ग आहे, आणि तो गणिती दृष्ट्या निरुपद्रवी आहे पण संकेत आहे की नियम समजलेला नाही. (2 पल्ल्याच्या प्रत्येक टोकावरही एक शून्य मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A region is bounded by y = x² and y = 2 − x². Integrating with respect to x needs one integral; integrating with respect to y needs how many?",
          hi: "कोई क्षेत्र y = x² और y = 2 − x² से घिरा है। x के सापेक्ष समाकलन में एक समाकल लगता है; y के सापेक्ष कितने लगते हैं?",
          mr: "एक प्रदेश y = x² आणि y = 2 − x² यांनी वेढलेला आहे. x च्या सापेक्ष समाकलनास एक समाकल लागते; y च्या सापेक्ष किती लागतात?",
        },
        answer: 2,
        wrong: [1, 3, 4],
        checkExpr: "1+1",
        solution: {
          en: "Two. Slicing vertically, every strip runs from the lower parabola up to the upper one, so a single integral of (2 − x²) − x² from −1 to 1 does the whole job. Slicing horizontally is worse, because the left and right boundaries CHANGE at y = 1 where the two curves cross: below that height both edges come from y = x², above it both come from y = 2 − x², so the region must be done in two pieces and the answers added. The lesson is that choosing the variable of integration is a real decision with a real cost, and the right question to ask before starting is whether a strip in the chosen direction meets the same pair of boundaries all the way across. When it does not, the region splits — and one integral has quietly become two. (1 assumes the two directions are always interchangeable.)",
          hi: "दो। ऊर्ध्वाधर काटने पर हर पट्टी नीचे वाले परवलय से ऊपर वाले तक जाती है, अतः −1 से 1 तक (2 − x²) − x² का अकेला समाकल पूरा काम कर देता है। क्षैतिज काटना बदतर है, क्योंकि बाईं और दाईं सीमाएँ y = 1 पर बदल जाती हैं जहाँ दोनों वक्र मिलते हैं: उस ऊँचाई से नीचे दोनों किनारे y = x² से आते हैं, ऊपर दोनों y = 2 − x² से, अतः क्षेत्र को दो टुकड़ों में करना होगा और उत्तर जोड़ने होंगे। सबक़ यह है कि समाकलन का चर चुनना असली लागत वाला असली निर्णय है, और शुरू करने से पहले पूछने लायक़ सही प्रश्न यह है कि क्या चुनी दिशा में पट्टी पूरे रास्ते उसी सीमा-युग्म से मिलती है। जब नहीं मिलती, क्षेत्र बँट जाता है — और एक समाकल चुपचाप दो हो चुका होता है। (1 मान लेता है कि दोनों दिशाएँ सदा अदल-बदल हैं।)",
          mr: "दोन. उभे कापल्यास प्रत्येक पट्टी खालच्या वर्तुळखंडापासून वरच्यापर्यंत जाते, म्हणून −1 ते 1 पर्यंत (2 − x²) − x² चे एकटे समाकल अख्खे काम करते. आडवे कापणे वाईट आहे, कारण डाव्या आणि उजव्या सीमा y = 1 वर बदलतात जिथे दोन्ही वक्र भेटतात: त्या उंचीखाली दोन्ही कडा y = x² मधून येतात, वर दोन्ही y = 2 − x² मधून, म्हणून प्रदेश दोन तुकड्यांत करावा लागेल आणि उत्तरे जोडावी लागतील. धडा हा की समाकलनाचा चल निवडणे हा खऱ्या किंमतीचा खरा निर्णय आहे, आणि सुरू करण्याआधी विचारण्याजोगा योग्य प्रश्न हा की निवडलेल्या दिशेतील पट्टी अख्ख्या वाटेवर त्याच सीमा-जोडीला भेटते का. जेव्हा भेटत नाही, तेव्हा प्रदेश विभागतो — आणि एक समाकल गुपचूप दोन झालेले असते. (1 गृहीत धरते की दोन्ही दिशा नेहमी अदलाबदल करण्याजोग्या आहेत.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 5,
        stem: {
          en: "The region under y = 1/x from x = 1 to infinity has infinite area, yet spinning it about the x-axis gives a solid of volume π. Of area and volume, how many are finite?",
          hi: "x = 1 से अनंत तक y = 1/x के नीचे के क्षेत्र का क्षेत्रफल अनंत है, फिर भी उसे x-अक्ष के परितः घुमाने पर π आयतन वाला ठोस बनता है। क्षेत्रफल और आयतन में से कितने परिमित हैं?",
          mr: "x = 1 ते अनंतापर्यंत y = 1/x खालील प्रदेशाचे क्षेत्रफळ अनंत आहे, तरीही तो x-अक्षाभोवती फिरवल्यास π घनफळाचा घन बनतो. क्षेत्रफळ आणि घनफळ यांपैकी किती सांत आहेत?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        checkExpr: "2-1",
        solution: {
          en: "One — the volume. The area is the integral of 1/x, which grows like ln x and runs away to infinity; the volume is π times the integral of 1/x², which converges to π because the square shrinks fast enough. The whole difference is one power of x, and it lands on either side of the boundary that separates convergence from divergence. This solid is Torricelli's trumpet, and the paradox usually stated about it is that filling it takes π units of paint while painting its surface would take infinitely many, which sounds like a contradiction — pour the paint in and the inside is coated. The resolution is that the two 'paints' are not the same thing. A volume of paint fills a region; a coat of paint is a layer of FIXED THICKNESS, and no such layer fits inside a trumpet whose radius eventually falls below that thickness. The infinite quantity is the surface area, and area is what a physical coat charges by. So the paradox is not about infinity at all but about an equivocation between two measurements, which is worth noticing because most paradoxes involving infinity turn out to have that same shape. (2 supposes that a finite volume forces a finite area.)",
          hi: "एक — आयतन। क्षेत्रफल 1/x का समाकल है, जो ln x की तरह बढ़ता है और अनंत की ओर भाग जाता है; आयतन π गुना 1/x² का समाकल है, जो π पर अभिसरित होता है क्योंकि वर्ग काफ़ी तेज़ी से सिकुड़ता है। पूरा फ़र्क़ x की एक घात का है, और वह अभिसरण को अपसरण से अलग करने वाली सीमा के दोनों ओर गिरता है। यह ठोस टोरिचेली का तुरही है, और उसके बारे में आम तौर पर बताया जाने वाला विरोधाभास यह है कि उसे भरने में π इकाई रंग लगता है जबकि उसकी सतह रंगने में अनंत लगेगा, जो विरोधाभास लगता है — रंग उड़ेल दो और भीतर पुत जाता है। समाधान यह है कि दोनों 'रंग' एक चीज़ नहीं हैं। रंग का आयतन क्षेत्र भरता है; रंग की परत नियत मोटाई की तह है, और ऐसी कोई तह उस तुरही के भीतर नहीं समाती जिसकी त्रिज्या आख़िरकार उस मोटाई से नीचे गिर जाती है। अनंत राशि पृष्ठीय क्षेत्रफल है, और भौतिक परत क्षेत्रफल से ही वसूलती है। अतः विरोधाभास अनंतता के बारे में है ही नहीं बल्कि दो मापों के बीच शब्द-छल के बारे में है, जो ध्यान देने लायक़ है क्योंकि अनंतता वाले अधिकांश विरोधाभासों का यही आकार निकलता है। (2 मान लेता है कि परिमित आयतन परिमित क्षेत्रफल पर मजबूर करता है।)",
          mr: "एक — घनफळ. क्षेत्रफळ हे 1/x चे समाकल आहे, जे ln x सारखे वाढते आणि अनंताकडे पळून जाते; घनफळ π पट 1/x² चे समाकल आहे, जे π वर अभिसरित होते कारण वर्ग पुरेशा वेगाने आकुंचन पावतो. अख्खा फरक x च्या एका घातीचा आहे, आणि तो अभिसरणाला अपसरणापासून वेगळे करणाऱ्या सीमेच्या दोन्ही बाजूंना पडतो. हा घन टॉरिचेलीचा कर्णा आहे, आणि त्याबद्दल सर्वसाधारणपणे सांगितला जाणारा विरोधाभास हा की तो भरण्यास π एकक रंग लागतो तर त्याचा पृष्ठभाग रंगवण्यास अनंत लागेल, जे विरोधाभास वाटते — रंग ओतून टाका आणि आत पुतले जाते. निराकरण हे की दोन्ही 'रंग' एक गोष्ट नाहीत. रंगाचे घनफळ प्रदेश भरते; रंगाचा थर हा निश्चित जाडीचा स्तर आहे, आणि असा कोणताही स्तर त्या कर्ण्यात मावत नाही ज्याची त्रिज्या शेवटी त्या जाडीखाली घसरते. अनंत राशी पृष्ठफळ आहे, आणि भौतिक थर क्षेत्रफळानेच वसूल करतो. म्हणून विरोधाभास अनंततेबद्दल नाहीच तर दोन मापांमधील शब्दच्छलाबद्दल आहे, जे लक्षात घेण्याजोगे आहे कारण अनंतता असलेल्या बहुतांश विरोधाभासांचा हाच आकार निघतो. (2 गृहीत धरते की सांत घनफळ सांत क्षेत्रफळावर भाग पाडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A curve crosses the x-axis at x = 1 and x = 3 inside the interval [0, 4]. To compute the area between the curve and the axis, how many separate integrals must be evaluated?",
          hi: "कोई वक्र अंतराल [0, 4] के भीतर x = 1 और x = 3 पर x-अक्ष को पार करता है। वक्र और अक्ष के बीच क्षेत्रफल निकालने के लिए कितने अलग समाकलों का मान निकालना होगा?",
          mr: "एक वक्र अंतराल [0, 4] च्या आत x = 1 आणि x = 3 वर x-अक्ष ओलांडतो. वक्र आणि अक्ष यांमधील क्षेत्रफळ काढण्यासाठी किती वेगळ्या समाकलांचे मूल्य काढावे लागेल?",
        },
        answer: 3,
        wrong: [2, 4, 1],
        checkExpr: "2+1",
        solution: {
          en: "Three: over [0, 1], [1, 3] and [3, 4]. Two interior crossings cut the interval into three pieces, and on each piece the function keeps one sign, so each piece can be integrated and its magnitude taken. The counting rule is worth stating cleanly, because it is the one people get wrong: n interior zeros give n + 1 regions, not n. That is the same off-by-one as fenceposts and fence panels, and it appears here in a form where getting it wrong loses a whole piece of area silently — the arithmetic still completes, the answer is simply too small, and nothing on the page indicates a problem. Note also what does NOT count. A zero where the curve touches the axis and turns back without crossing, such as x² at the origin, is not a sign change and needs no split; only genuine crossings matter. So the honest rule is not 'split at every root' but 'split at every root where the sign actually changes', and telling those apart requires looking at the factor's multiplicity rather than just its existence. (2 counts the crossings instead of the regions they create.)",
          hi: "तीन: [0, 1], [1, 3] और [3, 4] पर। दो भीतरी पार-बिंदु अंतराल को तीन टुकड़ों में काटते हैं, और हर टुकड़े पर फलन एक ही चिह्न रखता है, अतः हर टुकड़े का समाकलन करके उसका परिमाण लिया जा सकता है। गिनती का नियम साफ़ कहने लायक़ है, क्योंकि यही वह है जिसे लोग ग़लत करते हैं: n भीतरी शून्य n + 1 क्षेत्र देते हैं, n नहीं। यह वही एक-कम-एक-ज़्यादा है जो खंभों और बाड़ के पल्लों में होता है, और यहाँ ऐसे रूप में आता है जहाँ ग़लत करने पर क्षेत्रफल का पूरा एक टुकड़ा चुपचाप खो जाता है — गणित फिर भी पूरा होता है, उत्तर बस बहुत छोटा होता है, और काग़ज़ पर कुछ भी दिक़्क़त नहीं दिखाता। यह भी ध्यान दो कि क्या नहीं गिना जाता। ऐसा शून्य जहाँ वक्र अक्ष को छूकर बिना पार किए लौट आता है, जैसे मूलबिंदु पर x², चिह्न-परिवर्तन नहीं है और उसे बँटवारे की ज़रूरत नहीं; केवल असली पार-बिंदु मायने रखते हैं। अतः ईमानदार नियम 'हर मूल पर बाँटो' नहीं बल्कि 'हर ऐसे मूल पर बाँटो जहाँ चिह्न सचमुच बदलता है' है, और उन्हें अलग बताने के लिए गुणक के केवल होने के बजाय उसकी बहुलता देखनी पड़ती है। (2 पार-बिंदु गिन लेता है, न कि उनसे बने क्षेत्र।)",
          mr: "तीन: [0, 1], [1, 3] आणि [3, 4] वर. दोन आंतरिक छेदनबिंदू अंतरालाला तीन तुकड्यांत कापतात, आणि प्रत्येक तुकड्यावर फलन एकच चिन्ह ठेवते, म्हणून प्रत्येक तुकड्याचे समाकलन करून त्याचे परिमाण घेता येते. मोजणीचा नियम स्वच्छ सांगण्याजोगा आहे, कारण हाच तो आहे जो लोक चुकवतात: n आंतरिक शून्ये n + 1 प्रदेश देतात, n नव्हे. हा तोच एक-कमी-एक-जास्त आहे जो खांब आणि कुंपणाच्या फळ्यांत होतो, आणि इथे अशा रूपात येतो जिथे चुकल्यास क्षेत्रफळाचा अख्खा एक तुकडा गुपचूप हरवतो — गणित तरीही पूर्ण होते, उत्तर फक्त फार लहान असते, आणि कागदावर काहीच अडचण दाखवत नाही. हेही लक्षात घ्या की काय मोजले जात नाही. असे शून्य जिथे वक्र अक्षाला स्पर्श करून न ओलांडता परत येतो, जसे आदिबिंदूवरील x², हे चिन्ह-बदल नाही आणि त्याला विभागणीची गरज नाही; केवळ खरे छेदनबिंदूच महत्त्वाचे. म्हणून प्रामाणिक नियम 'प्रत्येक मुळावर विभागा' नव्हे तर 'प्रत्येक अशा मुळावर विभागा जिथे चिन्ह खरोखर बदलते' असा आहे, आणि ते वेगळे सांगण्यासाठी गुणकाच्या केवळ असण्याऐवजी त्याची बहुलता पाहावी लागते. (2 छेदनबिंदू मोजते, त्यांनी बनवलेले प्रदेश नव्हे.)",
        },
      },
      rand,
    ),
  );

  qs.push(
    numQ(
      {
        level: 6,
        stem: {
          en: "Archimedes found the area of a parabolic segment to be 4/3 of an inscribed triangle, and the area under y = x² from 0 to a is a third of its bounding rectangle. Of these two results, how many depend on the value of a?",
          hi: "आर्किमिडीज़ ने परवलयीय खंड का क्षेत्रफल अंतर्लिखित त्रिभुज का 4/3 पाया, और 0 से a तक y = x² के नीचे का क्षेत्रफल उसके घेरने वाले आयत का तिहाई है। इन दो परिणामों में से कितने a के मान पर निर्भर हैं?",
          mr: "आर्किमिडीजने वर्तुळखंडीय खंडाचे क्षेत्रफळ अंतर्लिखित त्रिकोणाच्या 4/3 इतके शोधले, आणि 0 ते a पर्यंत y = x² खालील क्षेत्रफळ त्याच्या वेढणाऱ्या आयताचा तृतीयांश आहे. या दोन निकालांपैकी किती a च्या मूल्यावर अवलंबून आहेत?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        checkExpr: "1-1",
        solution: {
          en: "Neither. Both are ratios, and both hold for every parabola and every choice of a — the specific numbers cancel out of each statement entirely. That invariance is what makes them theorems rather than calculations, and it is the reason Archimedes could establish his by exhaustion, summing an infinite geometric series of triangles two thousand years before the integral sign existed: a ratio is stable enough to be pinned down by squeezing it between bounds, whereas an absolute area is not. There is a second point worth making about what the calculus actually contributed. It did not find results the Greeks could not reach; Archimedes had the parabola, the sphere, the spiral, and his method was rigorous. What it supplied was UNIFORMITY. Each of his results required its own ingenious construction, invented afresh for that curve, and there was no way to know in advance whether the next curve would yield to any construction at all. The fundamental theorem replaced ingenuity with procedure, so that the area under x², x³ and x⁷ come from one rule applied three times rather than three separate strokes of genius. That is a smaller claim than 'calculus discovered these areas' and a much more accurate one — and it explains why the eighteenth century could suddenly compute so much more than the third century BC, without being populated by better mathematicians. (2 supposes that a formula containing a letter must depend on it.)",
          hi: "कोई नहीं। दोनों अनुपात हैं, और दोनों हर परवलय और a के हर चुनाव के लिए सही हैं — विशिष्ट संख्याएँ हर कथन से पूरी तरह कट जाती हैं। वही अपरिवर्तनीयता उन्हें गणना नहीं प्रमेय बनाती है, और यही कारण है कि आर्किमिडीज़ अपना परिणाम निःशेषण से स्थापित कर सका, समाकल-चिह्न के अस्तित्व से दो हज़ार साल पहले त्रिभुजों की अनंत गुणोत्तर श्रेणी जोड़कर: अनुपात इतना स्थिर होता है कि उसे सीमाओं के बीच दबाकर पकड़ा जा सके, जबकि निरपेक्ष क्षेत्रफल नहीं। कलन ने असल में क्या दिया, इस बारे में दूसरी बात भी कहने लायक़ है। उसने ऐसे परिणाम नहीं खोजे जिन तक यूनानी न पहुँच सकते हों; आर्किमिडीज़ के पास परवलय, गोला, सर्पिल सब थे, और उसकी विधि कठोर थी। उसने जो दिया वह एकरूपता थी। उसके हर परिणाम को अपनी ही सरल-चतुर रचना चाहिए थी, उसी वक्र के लिए नए सिरे से गढ़ी गई, और पहले से जानने का कोई तरीक़ा नहीं था कि अगला वक्र किसी रचना के आगे झुकेगा भी या नहीं। मूल प्रमेय ने चतुराई की जगह प्रक्रिया रख दी, ताकि x², x³ और x⁷ के नीचे के क्षेत्रफल प्रतिभा के तीन अलग प्रहारों के बजाय एक नियम को तीन बार लगाने से आएँ। यह 'कलन ने ये क्षेत्रफल खोजे' से छोटा दावा है और कहीं अधिक सटीक — और यह समझाता है कि अठारहवीं सदी अचानक तीसरी सदी ईसा पूर्व से इतना अधिक कैसे गणित कर सकी, बिना बेहतर गणितज्ञों से भरे हुए। (2 मान लेता है कि जिस सूत्र में अक्षर है वह उस पर निर्भर होगा ही।)",
          mr: "एकही नाही. दोन्ही गुणोत्तरे आहेत, आणि दोन्ही प्रत्येक वर्तुळखंडासाठी आणि a च्या प्रत्येक निवडीसाठी खरी आहेत — विशिष्ट संख्या प्रत्येक विधानातून पूर्णपणे रद्द होतात. तीच अपरिवर्तनीयता त्यांना गणना नव्हे तर प्रमेये बनवते, आणि हेच कारण आहे की आर्किमिडीज आपला निकाल निःशेषणाने प्रस्थापित करू शकला, समाकल-चिन्ह अस्तित्वात येण्याच्या दोन हजार वर्षे आधी त्रिकोणांची अनंत गुणोत्तर श्रेणी बेरीज करून: गुणोत्तर इतके स्थिर असते की त्याला सीमांदरम्यान दाबून पकडता येते, तर निरपेक्ष क्षेत्रफळ नाही. कलनाने प्रत्यक्षात काय दिले याबद्दल दुसरा मुद्दाही सांगण्याजोगा आहे. त्याने असे निकाल शोधले नाहीत जिथवर ग्रीक पोहोचू शकले नसते; आर्किमिडीजकडे वर्तुळखंड, गोल, सर्पिल सर्व होते, आणि त्याची पद्धत काटेकोर होती. त्याने जे पुरवले ते एकरूपता होती. त्याच्या प्रत्येक निकालाला स्वतःची चतुर रचना लागत होती, त्याच वक्रासाठी नव्याने घडवलेली, आणि पुढचा वक्र कोणत्याही रचनेपुढे नमेल का हे आधी जाणण्याचा मार्ग नव्हता. मूलभूत प्रमेयाने चातुर्याच्या जागी प्रक्रिया ठेवली, जेणेकरून x², x³ आणि x⁷ खालील क्षेत्रफळे प्रतिभेच्या तीन वेगळ्या फटक्यांऐवजी एक नियम तीनदा लावून यावीत. हा 'कलनाने ही क्षेत्रफळे शोधली' हून लहान दावा आहे आणि कितीतरी अधिक अचूक — आणि हे स्पष्ट करते की अठरावे शतक अचानक तिसऱ्या शतक ईसापूर्वहून इतके अधिक कसे काढू शकले, अधिक चांगल्या गणितज्ञांनी न भरता. (2 गृहीत धरते की ज्या सूत्रात अक्षर आहे ते त्यावर अवलंबून असलेच पाहिजे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "The area between two curves can be found by integrating with respect to x or with respect to y, and the two must agree. For a region whose boundary is a single closed curve, how many of these two methods can fail to be set up as one integral?",
          hi: "दो वक्रों के बीच का क्षेत्रफल x के सापेक्ष या y के सापेक्ष समाकलन से निकाला जा सकता है, और दोनों को सहमत होना चाहिए। ऐसे क्षेत्र के लिए जिसकी सीमा एक बंद वक्र है, इन दो विधियों में से कितनी एक ही समाकल के रूप में खड़ी न हो पाने में विफल हो सकती हैं?",
          mr: "दोन वक्रांमधील क्षेत्रफळ x च्या सापेक्ष किंवा y च्या सापेक्ष समाकलनाने काढता येते, आणि दोन्ही सहमत असावी लागतात. ज्या प्रदेशाची सीमा एकच बंद वक्र आहे, त्यासाठी या दोन पद्धतींपैकी किती एकाच समाकल म्हणून उभ्या न राहण्यात अपयशी ठरू शकतात?",
        },
        answer: 2,
        wrong: [1, 0, 3],
        checkExpr: "1+1",
        solution: {
          en: "Both can, and a crescent-shaped region is the standard witness: a horizontal strip can meet the boundary in four places rather than two, and so can a vertical one, so neither direction gives a single clean integral and both require splitting. The count is 2. What this is really about is that 'integrate top minus bottom' is not a definition of area but a CONVENIENCE that assumes something about the region — namely that a line in the chosen direction meets the boundary exactly twice. Regions satisfying that are called simple in the relevant direction, and a great many are not simple in either. The general answer is not to keep splitting but to change what is being integrated. Green's theorem converts the area of any region enclosed by a simple closed curve into a single integral ALONG THE BOUNDARY, computed by walking once around it: half the integral of x dy − y dx traversed anticlockwise, no strips and no cases. That is the same reasoning a planimeter uses — a mechanical instrument that measures the area of any shape on a map by being traced once around its edge, without ever knowing what the shape is. It is worth seeing that this is not a harder method reserved for hard cases but a genuinely different idea: the strip methods reconstruct the interior from slices, while the boundary method never enters the interior at all. When a technique starts demanding cases, the useful question is usually not how to enumerate them but what the technique assumed that the problem is refusing to grant. (1 supposes that at least one direction always works.)",
          hi: "दोनों हो सकती हैं, और अर्धचंद्राकार क्षेत्र मानक गवाह है: क्षैतिज पट्टी सीमा से दो के बजाय चार जगह मिल सकती है, और ऊर्ध्वाधर भी, अतः कोई दिशा एक साफ़ समाकल नहीं देती और दोनों बँटवारा माँगती हैं। गिनती 2 है। यह असल में इस बारे में है कि 'ऊपर घटा नीचे समाकलन करो' क्षेत्रफल की परिभाषा नहीं बल्कि सुविधा है जो क्षेत्र के बारे में कुछ मान लेती है — यानी कि चुनी दिशा की रेखा सीमा से ठीक दो बार मिलती है। जो क्षेत्र यह पूरा करते हैं उन्हें उस दिशा में सरल कहते हैं, और बहुत सारे किसी भी दिशा में सरल नहीं। सामान्य उत्तर बाँटते रहना नहीं बल्कि यह बदल देना है कि समाकलित क्या हो रहा है। ग्रीन का प्रमेय किसी भी सरल बंद वक्र से घिरे क्षेत्र के क्षेत्रफल को सीमा के अनुदिश एक अकेले समाकल में बदल देता है, जिसे उसके चारों ओर एक बार चलकर निकाला जाता है: वामावर्त घूमते हुए x dy − y dx के समाकल का आधा, न पट्टियाँ न मामले। यही तर्क क्षेत्रफलमापी बरतता है — एक यांत्रिक उपकरण जो नक़्शे पर किसी भी आकृति का क्षेत्रफल उसके किनारे के चारों ओर एक बार चलाकर माप लेता है, बिना कभी जाने कि आकृति क्या है। यह देखना ज़रूरी है कि यह कठिन मामलों के लिए रखी गई कठिन विधि नहीं बल्कि सचमुच अलग विचार है: पट्टी-विधियाँ भीतर को टुकड़ों से पुनर्निर्मित करती हैं, जबकि सीमा-विधि भीतर घुसती ही नहीं। जब कोई तकनीक मामले माँगने लगे, तो उपयोगी प्रश्न आम तौर पर यह नहीं कि उन्हें कैसे गिनें बल्कि यह कि तकनीक ने क्या मान लिया था जिसे समस्या देने से इनकार कर रही है। (1 मान लेता है कि कम से कम एक दिशा सदा चलती है।)",
          mr: "दोन्ही ठरू शकतात, आणि अर्धचंद्राकृती प्रदेश हा प्रमाण साक्षीदार आहे: आडवी पट्टी सीमेला दोनऐवजी चार ठिकाणी भेटू शकते, आणि उभीही, म्हणून कोणतीही दिशा एक स्वच्छ समाकल देत नाही आणि दोन्ही विभागणी मागतात. मोजणी 2 आहे. हे प्रत्यक्षात याबद्दल आहे की 'वरचा वजा खालचा समाकलन करा' ही क्षेत्रफळाची व्याख्या नसून सोय आहे जी प्रदेशाबद्दल काहीतरी गृहीत धरते — म्हणजे निवडलेल्या दिशेतील रेषा सीमेला नेमकी दोनदा भेटते. जे प्रदेश हे पूर्ण करतात त्यांना त्या दिशेत सरळ म्हणतात, आणि पुष्कळ कोणत्याच दिशेत सरळ नाहीत. सर्वसाधारण उत्तर विभागत राहणे नव्हे तर समाकलित काय होत आहे ते बदलणे आहे. ग्रीनचे प्रमेय कोणत्याही सरळ बंद वक्राने वेढलेल्या प्रदेशाचे क्षेत्रफळ सीमेच्या बाजूने एका एकट्या समाकलात बदलते, जे तिच्याभोवती एकदा चालून काढले जाते: घड्याळाच्या उलट फिरत x dy − y dx च्या समाकलाचा अर्धा, ना पट्ट्या ना प्रसंग. हाच युक्तिवाद क्षेत्रफळमापी वापरतो — एक यांत्रिक उपकरण जे नकाशावरील कोणत्याही आकृतीचे क्षेत्रफळ तिच्या कडेभोवती एकदा फिरवून मोजते, आकृती काय आहे हे कधीही न जाणता. हे पाहणे आवश्यक आहे की ही कठीण प्रसंगांसाठी राखलेली कठीण पद्धत नसून खरोखर वेगळी कल्पना आहे: पट्टी-पद्धती आतील भाग तुकड्यांतून पुन्हा उभारतात, तर सीमा-पद्धत आत शिरतच नाही. जेव्हा एखादे तंत्र प्रसंग मागू लागते, तेव्हा उपयुक्त प्रश्न सर्वसाधारणपणे ते कसे मोजावेत हा नसून तंत्राने काय गृहीत धरले होते जे समस्या देण्यास नकार देत आहे हा असतो. (1 गृहीत धरते की किमान एक दिशा नेहमी चालते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-application-of-integrals",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 8 — Application of Integrals",
      name: "Application of Integrals",
      summary:
        "The chapter where an integral and an area stop being the same thing: why a curve dipping below the axis must be split at every crossing and why n crossings make n + 1 pieces, why choosing to slice vertically or horizontally is a decision with a cost, why a shape of infinite area can enclose a finite volume, and why 'upper minus lower' is a convenience that some regions simply refuse.",
      position: 8,
      translations: {
        hi: {
          name: "समाकलों के अनुप्रयोग",
          summary:
            "वह अध्याय जहाँ समाकल और क्षेत्रफल एक चीज़ होना छोड़ देते हैं: अक्ष के नीचे डुबकी लगाते वक्र को हर पार-बिंदु पर क्यों बाँटना होगा और n पार-बिंदु n + 1 टुकड़े क्यों बनाते हैं, ऊर्ध्वाधर या क्षैतिज काटने का चुनाव लागत वाला निर्णय क्यों है, अनंत क्षेत्रफल वाली आकृति परिमित आयतन क्यों घेर सकती है, और 'ऊपर घटा नीचे' वह सुविधा क्यों है जिसे कुछ क्षेत्र सीधे नकार देते हैं।",
        },
        mr: {
          name: "समाकलांचे उपयोजन",
          summary:
            "तो अध्याय जिथे समाकल आणि क्षेत्रफळ एक गोष्ट असणे थांबवतात: अक्षाखाली बुडी मारणारा वक्र प्रत्येक छेदनबिंदूवर का विभागावा लागतो आणि n छेदनबिंदू n + 1 तुकडे का बनवतात, उभे की आडवे कापायचे ही निवड किंमत असलेला निर्णय का आहे, अनंत क्षेत्रफळाची आकृती सांत घनफळ का वेढू शकते, आणि 'वरचा वजा खालचा' ही सोय काही प्रदेश सरळ का नाकारतात.",
        },
      },
    },
    qs,
  );
}

/*C9*/

export const G12_MATHS: TopicFileOut[] = [
  relationsFunctions12(),
  inverseTrig12(),
  matrices12(),
  determinants12(),
  continuityDifferentiability12(),
  applicationOfDerivatives12(),
  integrals12(),
  applicationOfIntegrals12(),
  /*X9*/
];
