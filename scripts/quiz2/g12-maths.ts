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

/* ------------------------------------------------------------------------- */
/* Chapter 9 — Differential Equations (an equation whose unknown is a curve)  */
/* ------------------------------------------------------------------------- */
function differentialEquations12(): TopicFileOut {
  const rand = rng("maths-12-differential-equations");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the order of the equation d²y/dx² + 3 dy/dx + y = 0?",
          hi: "समीकरण d²y/dx² + 3 dy/dx + y = 0 की कोटि क्या है?",
          mr: "समीकरण d²y/dx² + 3 dy/dx + y = 0 ची कोटी किती?",
        },
        answer: 2,
        wrong: [1, 3, 0],
        checkExpr: "1+1",
        solution: {
          en: "The order is the order of the HIGHEST derivative present, which here is the second, so the answer is 2. The 3 sitting in front of dy/dx is a coefficient and has nothing to do with it — order counts differentiations, not numbers. (3 reads the coefficient instead.)",
          hi: "कोटि उपस्थित उच्चतम अवकलज की कोटि है, जो यहाँ द्वितीय है, अतः उत्तर 2 है। dy/dx के आगे बैठा 3 गुणांक है और उससे उसका कोई लेना-देना नहीं — कोटि अवकलन गिनती है, संख्याएँ नहीं। (3 गुणांक पढ़ लेता है।)",
          mr: "कोटी ही उपस्थित सर्वोच्च अवकलजाची कोटी आहे, जी इथे द्वितीय आहे, म्हणून उत्तर 2 आहे. dy/dx समोर बसलेला 3 गुणांक आहे आणि त्याचा याच्याशी काहीच संबंध नाही — कोटी अवकलने मोजते, संख्या नव्हे. (3 गुणांक वाचते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many arbitrary constants does the general solution of a third-order differential equation contain?",
          hi: "तृतीय कोटि के अवकल समीकरण के व्यापक हल में कितने स्वेच्छ अचर होते हैं?",
          mr: "तृतीय कोटीच्या अवकल समीकरणाच्या व्यापक उत्तरात किती स्वैर अचल असतात?",
        },
        answer: 3,
        wrong: [1, 2, 6],
        checkExpr: "1+2",
        solution: {
          en: "Three — one for each integration needed to undo three derivatives. The count is not a convention: each time you integrate you lose a constant, so recovering the function from its third derivative loses three, and the general solution is a whole family of curves rather than a single one. It follows that pinning down one member needs exactly three extra conditions, which is why initial-value problems come with as many conditions as the order. (1 gives the constant of a single integration.)",
          hi: "तीन — तीन अवकलजों को उलटने के लिए ज़रूरी हर समाकलन के लिए एक। यह गिनती परिपाटी नहीं: हर बार समाकलन करने पर एक अचर खो जाता है, अतः किसी फलन को उसके तृतीय अवकलज से वापस पाने में तीन खोते हैं, और व्यापक हल एक वक्र नहीं बल्कि वक्रों का पूरा कुल है। इससे निकलता है कि उस कुल के एक सदस्य को तय करने के लिए ठीक तीन अतिरिक्त शर्तें चाहिए, इसीलिए प्रारंभिक-मान समस्याएँ कोटि जितनी शर्तों के साथ आती हैं। (1 एक अकेले समाकलन का अचर देता है।)",
          mr: "तीन — तीन अवकलज उलटवण्यासाठी लागणाऱ्या प्रत्येक समाकलनासाठी एक. ही मोजणी संकेत नाही: प्रत्येक वेळी समाकलन केल्यावर एक अचल हरवतो, म्हणून एखादे फलन त्याच्या तृतीय अवकलजापासून परत मिळवताना तीन हरवतात, आणि व्यापक उत्तर एक वक्र नसून वक्रांचे अख्खे कुळ आहे. यातून निघते की त्या कुळातील एक सदस्य निश्चित करण्यास नेमक्या तीन अतिरिक्त अटी लागतात, म्हणूनच प्रारंभिक-मूल्य समस्या कोटीइतक्या अटींसह येतात. (1 एका एकट्या समाकलनाचा अचल देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "If dy/dx = 4, what is the slope of every solution curve?",
          hi: "यदि dy/dx = 4, तो हर हल-वक्र की ढाल क्या है?",
          mr: "जर dy/dx = 4, तर प्रत्येक उत्तर-वक्राचा उतार किती?",
        },
        answer: 4,
        wrong: [0, 1, 8],
        checkExpr: "2*2",
        solution: {
          en: "4, everywhere. The solutions are the lines y = 4x + C, a family of parallel lines differing only in where they cross the axis. This is the smallest possible example of the whole subject's shape: a differential equation describes the slope at every point without naming any particular curve, and the curves that obey it form a family filling the plane. (0 answers as though a constant right-hand side meant a constant y.)",
          hi: "4, हर जगह। हल हैं रेखाएँ y = 4x + C, समांतर रेखाओं का कुल जो केवल इसमें भिन्न है कि वे अक्ष को कहाँ काटती हैं। यह पूरे विषय के आकार का सबसे छोटा संभव उदाहरण है: अवकल समीकरण हर बिंदु पर ढाल बताता है बिना किसी विशेष वक्र का नाम लिए, और उसका पालन करने वाले वक्र समतल भरता एक कुल बनाते हैं। (0 ऐसे उत्तर देता है मानो अचर दायाँ पक्ष अचर y का अर्थ हो।)",
          mr: "4, सर्वत्र. उत्तरे आहेत रेषा y = 4x + C, समांतर रेषांचे कुळ जे केवळ त्या अक्षाला कुठे कापतात यात वेगळे आहे. हे अख्ख्या विषयाच्या आकाराचे सर्वांत लहान शक्य उदाहरण आहे: अवकल समीकरण प्रत्येक बिंदूवर उतार सांगते कोणत्याही विशिष्ट वक्राचे नाव न घेता, आणि त्याचे पालन करणारे वक्र प्रतल भरणारे कुळ बनवतात. (0 असे उत्तर देते जणू अचल उजवी बाजू म्हणजे अचल y असावा.)",
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
          en: "Solving dy/dx = 2x with y = 5 when x = 0 gives y = x² + C. What is C?",
          hi: "x = 0 पर y = 5 के साथ dy/dx = 2x हल करने पर y = x² + C मिलता है। C क्या है?",
          mr: "x = 0 वर y = 5 सह dy/dx = 2x सोडवल्यास y = x² + C मिळते. C किती?",
        },
        answer: 5,
        wrong: [0, 2, 25],
        checkExpr: "5-0",
        solution: {
          en: "At x = 0 the x² term vanishes, so y = C, and the condition y = 5 gives C = 5. The initial condition is what selects one curve out of the infinite family, and this is the whole two-step shape of every problem in the chapter: integrate to get the family, then substitute to pick the member. Skipping the second step leaves an answer with a letter in it, which is a general solution and not the particular one asked for. (0 forgets that C is what the condition determines.)",
          hi: "x = 0 पर x² पद लुप्त हो जाता है, अतः y = C, और शर्त y = 5 से C = 5. प्रारंभिक शर्त ही अनंत कुल में से एक वक्र चुनती है, और यही अध्याय की हर समस्या का पूरा दो-क़दमी आकार है: समाकलन करके कुल पाओ, फिर प्रतिस्थापित करके सदस्य चुनो। दूसरा क़दम छोड़ने पर ऐसा उत्तर बचता है जिसमें अक्षर है, जो व्यापक हल है, पूछा गया विशिष्ट नहीं। (0 भूल जाता है कि शर्त C को ही तय करती है।)",
          mr: "x = 0 वर x² पद लोप पावते, म्हणून y = C, आणि अट y = 5 वरून C = 5. प्रारंभिक अट अनंत कुळातून एक वक्र निवडते, आणि हाच अध्यायातील प्रत्येक समस्येचा अख्खा दोन-पावली आकार आहे: समाकलन करून कुळ मिळवा, मग प्रतिस्थापित करून सदस्य निवडा. दुसरे पाऊल वगळल्यास अक्षर असलेले उत्तर उरते, जे व्यापक उत्तर आहे, विचारलेले विशिष्ट नाही. (0 विसरते की अट C च ठरवते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "For the separable equation dy/y = 3 dx, the solution is y = A e^(kx). What is k?",
          hi: "वियोज्य समीकरण dy/y = 3 dx का हल y = A e^(kx) है। k क्या है?",
          mr: "वियोज्य समीकरण dy/y = 3 dx चे उत्तर y = A e^(kx) आहे. k किती?",
        },
        answer: 3,
        wrong: [1, 0, 9],
        checkExpr: "9/3",
        solution: {
          en: "Integrating both sides gives ln y = 3x + c, so y = A e^(3x) and k = 3. Note what the equation was saying before any solving happened: dy/y is the FRACTIONAL change in y, so the equation states that y grows by a fixed proportion of itself per unit of x — and the exponential is the only function that does. Every population model, every compound-interest calculation and every radioactive decay in the syllabus is this one equation with a different letter for 3. (1 answers with the coefficient of dx as though it were unchanged.)",
          hi: "दोनों पक्षों का समाकलन करने पर ln y = 3x + c मिलता है, अतः y = A e^(3x) और k = 3. ध्यान दो कि हल करने से पहले समीकरण कह क्या रहा था: dy/y, y का भिन्नात्मक परिवर्तन है, अतः समीकरण कहता है कि y, x की प्रति इकाई अपने ही एक नियत अनुपात से बढ़ता है — और ऐसा करने वाला अकेला फलन चरघातांकी है। पाठ्यक्रम का हर जनसंख्या मॉडल, हर चक्रवृद्धि ब्याज की गणना और हर रेडियोधर्मी क्षय यही एक समीकरण है, 3 की जगह अलग अक्षर के साथ। (1 dx के गुणांक से उत्तर देता है मानो वह अपरिवर्तित हो।)",
          mr: "दोन्ही बाजूंचे समाकलन केल्यास ln y = 3x + c मिळते, म्हणून y = A e^(3x) आणि k = 3. लक्षात घ्या की सोडवण्याआधी समीकरण काय सांगत होते: dy/y हा y चा अपूर्णांकीय बदल आहे, म्हणून समीकरण सांगते की y हा x च्या प्रति एककाला स्वतःच्याच एका निश्चित प्रमाणाने वाढतो — आणि तसे करणारे एकमेव फलन घातांकी आहे. अभ्यासक्रमातील प्रत्येक लोकसंख्या प्रतिरूप, प्रत्येक चक्रवाढ व्याजाची गणना आणि प्रत्येक किरणोत्सारी क्षय हेच एक समीकरण आहे, 3 च्या जागी वेगळे अक्षर घेऊन. (1 dx च्या गुणांकाने उत्तर देते जणू तो अपरिवर्तित असावा.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many of these are solutions of dy/dx = y: y = eˣ, y = 3eˣ, y = eˣ + 1?",
          hi: "इनमें से कितने dy/dx = y के हल हैं: y = eˣ, y = 3eˣ, y = eˣ + 1?",
          mr: "यांपैकी किती dy/dx = y ची उत्तरे आहेत: y = eˣ, y = 3eˣ, y = eˣ + 1?",
        },
        answer: 2,
        wrong: [3, 1, 0],
        checkExpr: "3-1",
        solution: {
          en: "Two. The first two work — differentiating 3eˣ gives 3eˣ, which is y again. The third fails: its derivative is eˣ but y is eˣ + 1, and those are not equal. This is worth doing because it shows where the arbitrary constant is allowed to sit. For this equation the family is y = A eˣ, with the constant MULTIPLYING; adding a constant instead breaks it. Which position the constant takes is decided by the equation, not by habit, and the reflex of writing '+ C' at the end is exactly what goes wrong here. (3 assumes any modification of a solution is a solution.)",
          hi: "दो। पहले दो चलते हैं — 3eˣ का अवकलन 3eˣ देता है, जो फिर y ही है। तीसरा विफल है: उसका अवकलज eˣ है पर y है eˣ + 1, और वे बराबर नहीं। यह करने लायक़ है क्योंकि यह दिखाता है कि स्वेच्छ अचर को कहाँ बैठने की अनुमति है। इस समीकरण के लिए कुल y = A eˣ है, जिसमें अचर गुणा कर रहा है; उसके बजाय अचर जोड़ने पर वह टूट जाता है। अचर कौन-सी जगह लेता है यह समीकरण तय करता है, आदत नहीं, और अंत में '+ C' लिख देने की प्रतिवर्ती आदत ही यहाँ ग़लत जाती है। (3 मान लेता है कि हल का कोई भी फेरबदल हल होगा।)",
          mr: "दोन. पहिली दोन चालतात — 3eˣ चे अवकलन 3eˣ देते, जे पुन्हा y च आहे. तिसरे अपयशी आहे: त्याचा अवकलज eˣ आहे पण y आहे eˣ + 1, आणि ते समान नाहीत. हे करण्याजोगे आहे कारण ते दाखवते की स्वैर अचलाला कुठे बसण्याची परवानगी आहे. या समीकरणासाठी कुळ y = A eˣ आहे, ज्यात अचल गुणत आहे; त्याऐवजी अचल जोडल्यास ते मोडते. अचल कोणती जागा घेतो हे समीकरण ठरवते, सवय नव्हे, आणि शेवटी '+ C' लिहून टाकण्याची प्रतिक्षिप्त सवयच इथे चुकते. (3 गृहीत धरते की उत्तराचा कोणताही फेरफार उत्तर असेल.)",
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
          en: "For the linear equation dy/dx + 2y = 6, the integrating factor is e^(kx). What is k?",
          hi: "रैखिक समीकरण dy/dx + 2y = 6 के लिए समाकलन गुणक e^(kx) है। k क्या है?",
          mr: "रैखिक समीकरण dy/dx + 2y = 6 साठी समाकलन गुणक e^(kx) आहे. k किती?",
        },
        answer: 2,
        wrong: [6, 3, 1],
        checkExpr: "6/3",
        solution: {
          en: "k = 2, the coefficient of y, so the factor is e^(2x). Why it works is the part worth carrying: multiplying through gives e^(2x) dy/dx + 2e^(2x) y, and that is exactly the derivative of the product e^(2x) y by the product rule. So the integrating factor is not a trick pulled from nowhere — it is whatever function makes the left-hand side collapse into a single derivative, after which both sides can simply be integrated. Recognising the product rule running backwards is the whole method. (6 reads the right-hand side.)",
          hi: "k = 2, y का गुणांक, अतः गुणक e^(2x) है। यह क्यों चलता है वही हिस्सा साथ ले जाने लायक़ है: पूरे में गुणा करने पर e^(2x) dy/dx + 2e^(2x) y मिलता है, और गुणनफल नियम से वह ठीक गुणनफल e^(2x) y का अवकलज है। अतः समाकलन गुणक कहीं से खींची गई चाल नहीं — वह वही फलन है जो बाएँ पक्ष को एक अकेले अवकलज में ढहा देता है, जिसके बाद दोनों पक्षों का बस समाकलन किया जा सकता है। गुणनफल नियम को उलटा चलते पहचानना ही पूरी विधि है। (6 दायाँ पक्ष पढ़ लेता है।)",
          mr: "k = 2, y चा गुणांक, म्हणून गुणक e^(2x) आहे. हे का चालते तोच भाग सोबत न्यायला हवा: अख्ख्यात गुणल्यास e^(2x) dy/dx + 2e^(2x) y मिळते, आणि गुणाकार नियमाने तो नेमका गुणाकार e^(2x) y चा अवकलज आहे. म्हणून समाकलन गुणक कुठूनतरी ओढलेली युक्ती नाही — तो तेच फलन आहे जे डावी बाजू एका एकट्या अवकलजात कोसळवते, ज्यानंतर दोन्ही बाजूंचे फक्त समाकलन करता येते. गुणाकार नियम उलटा चालताना ओळखणे हीच अख्खी पद्धत आहे. (6 उजवी बाजू वाचते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A quantity halves every 5 years. After how many years is one-eighth of it left?",
          hi: "कोई राशि हर 5 वर्ष में आधी हो जाती है। कितने वर्षों बाद उसका आठवाँ हिस्सा बचता है?",
          mr: "एखादी राशी दर 5 वर्षांनी निम्मी होते. किती वर्षांनंतर तिचा आठवा हिस्सा उरतो?",
        },
        answer: 15,
        wrong: [40, 20, 10],
        checkExpr: "5*3",
        solution: {
          en: "One-eighth is a half three times over, so 3 × 5 = 15 years. The tempting wrong answer is 40, from reasoning that eight times as small should take eight times as long — but decay is multiplicative, not additive, so the right question is how many HALVINGS make an eighth, and the answer is three because 2³ = 8. This is the practical content of the exponential solution: equal times give equal RATIOS rather than equal differences, which is also why half-life is a meaningful constant while 'the time to lose 10 grams' is not. (40 multiplies the time by the factor instead of counting halvings.)",
          hi: "आठवाँ हिस्सा तीन बार आधा होना है, अतः 3 × 5 = 15 वर्ष। लुभावना ग़लत उत्तर 40 है, इस तर्क से कि आठ गुना छोटा होने में आठ गुना समय लगना चाहिए — पर क्षय गुणात्मक है, योगात्मक नहीं, अतः सही प्रश्न यह है कि कितने आधे होने आठवाँ बनाते हैं, और उत्तर तीन है क्योंकि 2³ = 8. यही चरघातांकी हल की व्यावहारिक सामग्री है: बराबर समय बराबर अनुपात देते हैं, बराबर अंतर नहीं, और इसीलिए अर्ध-आयु सार्थक अचर है जबकि '10 ग्राम खोने का समय' नहीं। (40 आधे होने गिनने के बजाय समय को गुणक से गुणा कर देता है।)",
          mr: "आठवा हिस्सा म्हणजे तीनदा निम्मे होणे, म्हणून 3 × 5 = 15 वर्षे. मोहक चुकीचे उत्तर 40 आहे, या युक्तिवादाने की आठपट लहान होण्यास आठपट वेळ लागावा — पण क्षय गुणाकारी आहे, बेरजी नाही, म्हणून योग्य प्रश्न हा की किती निम्मे होणी आठवा हिस्सा बनवतात, आणि उत्तर तीन आहे कारण 2³ = 8. हाच घातांकी उत्तराचा व्यावहारिक आशय आहे: समान वेळ समान गुणोत्तरे देतात, समान फरक नव्हे, आणि म्हणूनच अर्ध-आयुष्य अर्थपूर्ण अचल आहे तर '10 ग्रॅम गमावण्याचा वेळ' नाही. (40 निम्मे होणी मोजण्याऐवजी वेळेला गुणकाने गुणते.)",
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
          en: "Of the equations (dy/dx)² + y = 0, sin(dy/dx) = x and d²y/dx² + y = 0, for how many is the DEGREE defined?",
          hi: "समीकरणों (dy/dx)² + y = 0, sin(dy/dx) = x और d²y/dx² + y = 0 में से कितनों की घात परिभाषित है?",
          mr: "(dy/dx)² + y = 0, sin(dy/dx) = x आणि d²y/dx² + y = 0 या समीकरणांपैकी कितींची कोटी परिभाषित आहे?",
        },
        answer: 2,
        wrong: [3, 1, 0],
        checkExpr: "3-1",
        solution: {
          en: "Two — the first and the third. Degree is the power of the highest derivative, and it is defined ONLY when the equation is polynomial in the derivatives: the first has degree 2 and the third degree 1. The middle one buries dy/dx inside a sine, which is not a polynomial in it at any power, so the equation simply has no degree — not degree zero, and not degree one, but no degree at all. The distinction is worth insisting on because 'undefined' and 'zero' are constantly confused, and here the difference is between a quantity that does not apply and a quantity that happens to be small. Order, by contrast, survives all three: every one of them is first or second order, because counting differentiations never needs the equation to be polynomial in anything. (3 assumes every equation has a degree because every equation has an order.)",
          hi: "दो — पहला और तीसरा। घात उच्चतम अवकलज की घात है, और वह केवल तभी परिभाषित है जब समीकरण अवकलजों में बहुपदीय हो: पहले की घात 2 है और तीसरे की 1. बीच वाला dy/dx को ज्या के भीतर दबा देता है, जो किसी भी घात पर उसमें बहुपद नहीं, अतः उस समीकरण की कोई घात है ही नहीं — शून्य घात नहीं, एक घात नहीं, बल्कि कोई घात नहीं। इस भेद पर ज़ोर देना ज़रूरी है क्योंकि 'अपरिभाषित' और 'शून्य' लगातार गड्डमड्ड होते हैं, और यहाँ फ़र्क़ उस राशि के बीच है जो लागू ही नहीं होती और उस राशि के बीच जो संयोग से छोटी है। कोटि, इसके विपरीत, तीनों में बची रहती है: उनमें से हर एक प्रथम या द्वितीय कोटि का है, क्योंकि अवकलन गिनने के लिए समीकरण का किसी में बहुपदीय होना कभी ज़रूरी नहीं। (3 मान लेता है कि हर समीकरण की घात है क्योंकि हर समीकरण की कोटि है।)",
          mr: "दोन — पहिले आणि तिसरे. कोटी ही सर्वोच्च अवकलजाची घात आहे, आणि ती केवळ तेव्हाच परिभाषित आहे जेव्हा समीकरण अवकलजांत बहुपदीय असेल: पहिल्याची कोटी 2 आहे आणि तिसऱ्याची 1. मधले dy/dx ला ज्येच्या आत दडवते, जे कोणत्याही घातीवर त्यात बहुपद नाही, म्हणून त्या समीकरणाला कोटीच नाही — शून्य कोटी नाही, एक कोटी नाही, तर कोटीच नाही. या भेदावर आग्रह धरणे आवश्यक आहे कारण 'अपरिभाषित' आणि 'शून्य' सतत गोंधळले जातात, आणि इथे फरक अशा राशीत आहे जी लागूच होत नाही आणि अशा राशीत जी योगायोगाने लहान आहे. कोटी, याउलट, तिन्हींत टिकते: त्यांपैकी प्रत्येक प्रथम वा द्वितीय कोटीचे आहे, कारण अवकलने मोजण्यासाठी समीकरण कशातही बहुपदीय असणे कधीच आवश्यक नाही. (3 गृहीत धरते की प्रत्येक समीकरणाला कोटी आहे कारण प्रत्येक समीकरणाला क्रम आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A population obeys dP/dt = 0.02P. Starting at 1000, roughly how many years pass before it reaches 8000, given that it doubles every 35 years?",
          hi: "कोई जनसंख्या dP/dt = 0.02P मानती है। 1000 से शुरू होकर 8000 तक पहुँचने में मोटे तौर पर कितने वर्ष लगते हैं, यह देखते हुए कि वह हर 35 वर्ष में दुगनी होती है?",
          mr: "एक लोकसंख्या dP/dt = 0.02P पाळते. 1000 पासून सुरू होऊन 8000 पर्यंत पोहोचण्यास ढोबळमानाने किती वर्षे लागतात, हे पाहता की ती दर 35 वर्षांनी दुप्पट होते?",
        },
        answer: 105,
        wrong: [280, 70, 140],
        checkExpr: "35*3",
        solution: {
          en: "8000 is 1000 doubled three times, so 3 × 35 = 105 years. What is worth pressing on is what the model claims beyond this. Run it another 350 years and the population is over eight million from the same thousand; run it a few centuries more and it exceeds the mass of the Earth. The arithmetic is impeccable and the conclusion is nonsense, and the fault is not in the solving but in the equation, which says the growth rate is proportional to the population and NOTHING ELSE — no food, no space, no competition. The standard repair is the logistic equation dP/dt = kP(1 − P/M), which behaves like this one while P is small and flattens as P nears the carrying capacity M. The general habit is the point: an unbounded prediction from a model is not a discovery, it is the model announcing the edge of its own validity. (280 multiplies by the growth ratio 8 instead of counting three doublings.)",
          hi: "8000, 1000 का तीन बार दुगना है, अतः 3 × 35 = 105 वर्ष। दबाव डालने लायक़ यह है कि मॉडल इससे आगे क्या दावा करता है। इसे और 350 वर्ष चलाओ और वही एक हज़ार अस्सी लाख से ऊपर हो जाता है; कुछ सदियाँ और चलाओ और वह पृथ्वी के द्रव्यमान से आगे निकल जाता है। गणित निर्दोष है और निष्कर्ष बकवास, और दोष हल करने में नहीं बल्कि समीकरण में है, जो कहता है कि वृद्धि-दर जनसंख्या के समानुपाती है और और कुछ नहीं — न भोजन, न जगह, न प्रतिस्पर्धा। मानक मरम्मत लॉजिस्टिक समीकरण dP/dt = kP(1 − P/M) है, जो P के छोटे रहने तक इसी की तरह बरतता है और P के धारण-क्षमता M के पास आते ही चपटा हो जाता है। सामान्य आदत ही मुद्दा है: किसी मॉडल की अपरिबद्ध भविष्यवाणी खोज नहीं, वह मॉडल का अपनी ही वैधता की सीमा घोषित करना है। (280 तीन दुगने गिनने के बजाय वृद्धि-अनुपात 8 से गुणा कर देता है।)",
          mr: "8000 म्हणजे 1000 चे तीनदा दुप्पट, म्हणून 3 × 35 = 105 वर्षे. दाब देण्याजोगे हे की प्रतिरूप यापुढे काय दावा करते. ते आणखी 350 वर्षे चालवा आणि तेच एक हजार ऐंशी लाखांहून वर जाते; आणखी काही शतके चालवा आणि ते पृथ्वीच्या वस्तुमानाहून पुढे जाते. गणित निर्दोष आहे आणि निष्कर्ष मूर्खपणा, आणि दोष सोडवण्यात नसून समीकरणात आहे, जे सांगते की वाढीचा दर लोकसंख्येच्या समप्रमाणात आहे आणि दुसरे काहीच नाही — ना अन्न, ना जागा, ना स्पर्धा. प्रमाण दुरुस्ती लॉजिस्टिक समीकरण dP/dt = kP(1 − P/M) आहे, जे P लहान असेपर्यंत याच्यासारखे वागते आणि P धारणक्षमता M जवळ येताच सपाट होते. सर्वसाधारण सवय हाच मुद्दा आहे: एखाद्या प्रतिरूपाचे अबद्ध भाकीत ही शोध नव्हे, ते प्रतिरूपाने स्वतःच्याच वैधतेची सीमा जाहीर करणे आहे. (280 तीन दुप्पट मोजण्याऐवजी वाढ-गुणोत्तर 8 ने गुणते.)",
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
          en: "dy/dx = y^(2/3) with y(0) = 0 has the solutions y = 0 and y = (x/3)³. How many solutions pass through the origin?",
          hi: "y(0) = 0 के साथ dy/dx = y^(2/3) के हल y = 0 और y = (x/3)³ हैं। मूलबिंदु से कितने हल गुज़रते हैं?",
          mr: "y(0) = 0 सह dy/dx = y^(2/3) ची उत्तरे y = 0 आणि y = (x/3)³ आहेत. आदिबिंदूतून किती उत्तरे जातात?",
        },
        answer: 2,
        wrong: [1, 0, 3],
        checkExpr: "1+1",
        solution: {
          en: "Two, at least — and in fact infinitely many, since one can sit on y = 0 for any length of time and then depart along a shifted cubic. The question counts the two the stem names, but the failure they demonstrate is the important thing. An initial condition is supposed to pick out ONE curve, and every problem in this chapter has quietly relied on that. Here it does not, and the reason is precise: the existence-and-uniqueness theorem requires the right-hand side to be not merely continuous but Lipschitz in y, and y^(2/3) has an infinite slope at y = 0, so it fails that condition at exactly the point the initial condition names. Two consequences follow. First, uniqueness is a theorem with hypotheses rather than a property of differential equations as such, and the hypotheses are about the equation, not about how carefully one solves it. Second, this is not merely pathological: the same equation describes a leaking tank, and the non-uniqueness is physically honest — from an empty tank, you cannot tell how long it has been empty, so the past is genuinely not determined by the present. A model that forgets its own history is not a broken model; it is a model whose forward direction works and whose backward direction does not. (1 assumes an initial condition always determines a unique solution.)",
          hi: "कम से कम दो — और असल में अनंत, क्योंकि कोई भी y = 0 पर मनचाहे समय तक बैठकर फिर खिसके हुए घन के साथ रवाना हो सकता है। प्रश्न उन दो को गिनता है जिन्हें कथन नाम देता है, पर वे जो विफलता दिखाते हैं वही महत्वपूर्ण है। प्रारंभिक शर्त से अपेक्षा है कि वह एक वक्र चुने, और इस अध्याय की हर समस्या चुपचाप उसी पर टिकी रही है। यहाँ वह नहीं चुनती, और कारण ठीक-ठीक है: अस्तित्व-और-अद्वितीयता प्रमेय माँगता है कि दायाँ पक्ष केवल संतत नहीं बल्कि y में लिप्शित्ज़ हो, और y^(2/3) की y = 0 पर अनंत ढाल है, अतः वह ठीक उसी बिंदु पर उस शर्त में विफल है जिसे प्रारंभिक शर्त नाम देती है। दो परिणाम निकलते हैं। पहला, अद्वितीयता अवकल समीकरणों का गुण नहीं बल्कि परिकल्पनाओं वाला प्रमेय है, और परिकल्पनाएँ समीकरण के बारे में हैं, इस बारे में नहीं कि कोई कितने ध्यान से हल करता है। दूसरा, यह महज़ विकृति नहीं: वही समीकरण रिसती टंकी का वर्णन करता है, और अनद्वितीयता भौतिक रूप से ईमानदार है — ख़ाली टंकी से तुम बता नहीं सकते कि वह कब से ख़ाली है, अतः अतीत सचमुच वर्तमान से तय नहीं होता। अपना इतिहास भूलने वाला मॉडल टूटा मॉडल नहीं; वह ऐसा मॉडल है जिसकी आगे की दिशा चलती है और पीछे की नहीं। (1 मान लेता है कि प्रारंभिक शर्त सदा अद्वितीय हल तय करती है।)",
          mr: "किमान दोन — आणि प्रत्यक्षात अनंत, कारण कोणीही y = 0 वर हवा तितका वेळ बसून मग सरकलेल्या घनासोबत निघू शकतो. प्रश्न विधानाने नाव दिलेली ती दोन मोजतो, पण ती जे अपयश दाखवतात तेच महत्त्वाचे आहे. प्रारंभिक अटीकडून अपेक्षा आहे की तिने एक वक्र निवडावा, आणि या अध्यायातील प्रत्येक समस्या गुपचूप त्यावरच टिकली आहे. इथे ती निवडत नाही, आणि कारण नेमके आहे: अस्तित्व-आणि-अद्वितीयता प्रमेय मागते की उजवी बाजू केवळ संतत नव्हे तर y मध्ये लिप्शित्झ असावी, आणि y^(2/3) चा y = 0 वर अनंत उतार आहे, म्हणून ते नेमक्या त्याच बिंदूवर त्या अटीत अपयशी आहे जिला प्रारंभिक अट नाव देते. दोन परिणाम निघतात. पहिला, अद्वितीयता हा अवकल समीकरणांचा गुणधर्म नसून गृहीतके असलेले प्रमेय आहे, आणि गृहीतके समीकरणाबद्दल आहेत, कोणी किती काळजीपूर्वक सोडवतो याबद्दल नाहीत. दुसरा, हे केवळ विकृती नाही: तेच समीकरण गळणाऱ्या टाकीचे वर्णन करते, आणि अनद्वितीयता भौतिक दृष्ट्या प्रामाणिक आहे — रिकाम्या टाकीवरून तुम्ही सांगू शकत नाही की ती किती काळ रिकामी आहे, म्हणून भूतकाळ खरोखर वर्तमानाने ठरत नाही. स्वतःचा इतिहास विसरणारे प्रतिरूप मोडलेले प्रतिरूप नाही; ते असे प्रतिरूप आहे ज्याची पुढची दिशा चालते आणि मागची नाही. (1 गृहीत धरते की प्रारंभिक अट नेहमी अद्वितीय उत्तर ठरवते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "The family y = Ax² is described by the differential equation x dy/dx = 2y. How many arbitrary constants does that equation's general solution contain?",
          hi: "कुल y = Ax² का वर्णन अवकल समीकरण x dy/dx = 2y करता है। उस समीकरण के व्यापक हल में कितने स्वेच्छ अचर हैं?",
          mr: "कुळ y = Ax² चे वर्णन अवकल समीकरण x dy/dx = 2y करते. त्या समीकरणाच्या व्यापक उत्तरात किती स्वैर अचल आहेत?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        checkExpr: "2-1",
        solution: {
          en: "One, matching the single A in the family — and that match is the whole content of the question. Forming a differential equation from a family and solving one to get a family are inverse operations, and the count of constants is what has to line up between them. The procedure follows directly: to eliminate n constants you differentiate n times and use the resulting equations to remove them, which is why a family with one parameter yields a first-order equation and a family with two yields a second-order one. Here, differentiating y = Ax² gives dy/dx = 2Ax, and dividing to cancel A leaves x dy/dx = 2y with no A anywhere. Note what the elimination has achieved: the equation describes the family WITHOUT naming the parameter, which is exactly what makes it useful in physics — one writes down the local rule a system obeys, and the constants that the rule cannot determine are precisely the ones an experiment has to supply. (2 supposes that a second-degree curve needs a second-order equation, confusing the degree of x with the order of differentiation.)",
          hi: "एक, कुल के अकेले A से मेल खाता — और वही मेल प्रश्न की पूरी सामग्री है। किसी कुल से अवकल समीकरण बनाना और किसी समीकरण को हल करके कुल पाना प्रतिलोम संक्रियाएँ हैं, और अचरों की गिनती ही वह है जिसे उनके बीच मिलना है। प्रक्रिया सीधे निकलती है: n अचर हटाने के लिए n बार अवकलन करो और मिलने वाले समीकरणों से उन्हें निकाल दो, इसीलिए एक प्राचल वाला कुल प्रथम कोटि का समीकरण देता है और दो प्राचल वाला द्वितीय कोटि का। यहाँ, y = Ax² का अवकलन dy/dx = 2Ax देता है, और A काटने के लिए भाग देने पर x dy/dx = 2y बचता है, जिसमें A कहीं नहीं। ध्यान दो कि उन्मूलन ने क्या हासिल किया: समीकरण कुल का वर्णन प्राचल का नाम लिए बिना करता है, और ठीक यही उसे भौतिकी में उपयोगी बनाता है — कोई वह स्थानीय नियम लिख देता है जिसे तंत्र मानता है, और जिन अचरों को नियम तय नहीं कर सकता वे ठीक वही हैं जो प्रयोग को देने पड़ते हैं। (2 मान लेता है कि द्वितीय घात के वक्र को द्वितीय कोटि का समीकरण चाहिए, x की घात को अवकलन की कोटि से गड्डमड्ड करते हुए।)",
          mr: "एक, कुळातील एकट्या A शी जुळणारा — आणि तीच जुळणी प्रश्नाचा अख्खा आशय आहे. एखाद्या कुळातून अवकल समीकरण बनवणे आणि एखादे समीकरण सोडवून कुळ मिळवणे या व्यस्त क्रिया आहेत, आणि अचलांची मोजणी हीच त्यांच्यात जुळावी लागते. प्रक्रिया थेट निघते: n अचल काढण्यासाठी n वेळा अवकलन करा आणि मिळणाऱ्या समीकरणांतून ते काढून टाका, म्हणूनच एक प्राचल असलेले कुळ प्रथम कोटीचे समीकरण देते आणि दोन प्राचल असलेले द्वितीय कोटीचे. इथे, y = Ax² चे अवकलन dy/dx = 2Ax देते, आणि A रद्द करण्यासाठी भागल्यास x dy/dx = 2y उरते, ज्यात A कुठेच नाही. लक्षात घ्या की निर्मूलनाने काय साधले: समीकरण कुळाचे वर्णन प्राचलाचे नाव न घेता करते, आणि नेमके तेच त्याला भौतिकशास्त्रात उपयुक्त बनवते — कोणी तो स्थानिक नियम लिहून टाकतो जो प्रणाली पाळते, आणि जे अचल नियम ठरवू शकत नाही ते नेमके तेच आहेत जे प्रयोगाला पुरवावे लागतात. (2 गृहीत धरते की द्वितीय घातीच्या वक्राला द्वितीय कोटीचे समीकरण लागते, x ची घात अवकलनाच्या कोटीशी गोंधळवत.)",
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
          en: "dy/dx = 1 + y² with y(0) = 0 has solution y = tan x. The right-hand side is defined and smooth for every real y. On the interval [0, 2], for how many values of x does the solution exist?",
          hi: "y(0) = 0 के साथ dy/dx = 1 + y² का हल y = tan x है। दायाँ पक्ष हर वास्तविक y के लिए परिभाषित और चिकना है। अंतराल [0, 2] पर x के कितने मानों के लिए हल अस्तित्व में है?",
          mr: "y(0) = 0 सह dy/dx = 1 + y² चे उत्तर y = tan x आहे. उजवी बाजू प्रत्येक वास्तव y साठी परिभाषित आणि गुळगुळीत आहे. अंतराल [0, 2] वर x च्या किती मूल्यांसाठी उत्तर अस्तित्वात आहे?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        checkExpr: "1-1",
        solution: {
          en: "None — not for all of them, which is what the question asks. tan x blows up at π/2 ≈ 1.571, which lies inside [0, 2], so no solution exists on the whole interval and the count of intervals of that description is 0. The situation is worth sitting with, because everything about the equation looks benign. The right-hand side 1 + y² is a polynomial: continuous everywhere, differentiable everywhere, Lipschitz on every bounded region. The existence-and-uniqueness theorem applies in full and promises a unique solution — but only LOCALLY, on some interval around the starting point, and it never says how long that interval is. Here it is π/2 wide and then the solution is simply gone, having run off to infinity in finite x. This is called blow-up in finite time, and the mechanism is a feedback that strengthens itself: the larger y becomes the faster it grows, because the growth rate depends on y², so the escape accelerates and completes in bounded time rather than approaching infinity asymptotically. Two things follow. The first is a correction to a natural but wrong reading of the theorem — 'the solution exists' does not mean 'the solution exists for as long as you like', and the two are routinely conflated because in the tidy examples they coincide. The second is that nothing in the equation's appearance warns of this. One cannot tell by inspection how far a solution will reach; that is a separate question requiring separate work, and equations of exactly this shape describe real runaway processes, from certain chemical reactions to structural collapse, where the finite-time singularity is the physically meaningful prediction and not an artefact. (1 assumes that a well-behaved right-hand side guarantees a solution everywhere.)",
          hi: "कोई नहीं — उन सब के लिए नहीं, और प्रश्न यही पूछता है। tan x, π/2 ≈ 1.571 पर फट जाता है, जो [0, 2] के भीतर है, अतः पूरे अंतराल पर कोई हल नहीं है और उस वर्णन वाले अंतरालों की गिनती 0 है। इस स्थिति के साथ ठहरना ज़रूरी है, क्योंकि समीकरण के बारे में सब कुछ सौम्य दिखता है। दायाँ पक्ष 1 + y² बहुपद है: हर जगह संतत, हर जगह अवकलनीय, हर परिबद्ध क्षेत्र पर लिप्शित्ज़। अस्तित्व-और-अद्वितीयता प्रमेय पूरी तरह लागू होता है और अद्वितीय हल का वादा करता है — पर केवल स्थानीय रूप से, शुरुआती बिंदु के आसपास किसी अंतराल पर, और वह कभी नहीं कहता कि वह अंतराल कितना लंबा है। यहाँ वह π/2 चौड़ा है और फिर हल बस चला गया, परिमित x में अनंत की ओर भाग जाकर। इसे परिमित समय में विस्फोट कहते हैं, और क्रियाविधि है ख़ुद को मज़बूत करती प्रतिपुष्टि: y जितना बड़ा होता जाए उतना तेज़ बढ़ता है, क्योंकि वृद्धि-दर y² पर निर्भर है, अतः पलायन त्वरित होता है और अनंत की ओर स्पर्शोन्मुख पहुँचने के बजाय परिबद्ध समय में पूरा हो जाता है। दो बातें निकलती हैं। पहली, प्रमेय के एक स्वाभाविक पर ग़लत पाठ का सुधार — 'हल अस्तित्व में है' का अर्थ 'हल जितनी देर तुम चाहो उतनी देर अस्तित्व में है' नहीं, और दोनों नियमित रूप से मिला दिए जाते हैं क्योंकि सुथरे उदाहरणों में वे एक हो जाते हैं। दूसरी, समीकरण की शक्ल में कुछ भी इसकी चेतावनी नहीं देता। देखकर नहीं बताया जा सकता कि हल कहाँ तक पहुँचेगा; वह अलग प्रश्न है जिसे अलग काम चाहिए, और ठीक इसी आकार के समीकरण असली अनियंत्रित प्रक्रियाओं का वर्णन करते हैं, कुछ रासायनिक अभिक्रियाओं से लेकर संरचनात्मक ढहान तक, जहाँ परिमित-समय की विचित्रता भौतिक रूप से सार्थक भविष्यवाणी है, कोई कृत्रिम उपज नहीं। (1 मान लेता है कि सुव्यवहृत दायाँ पक्ष हर जगह हल की गारंटी देता है।)",
          mr: "एकही नाही — त्या सर्वांसाठी नाही, आणि प्रश्न हेच विचारतो. tan x हा π/2 ≈ 1.571 वर फुटतो, जो [0, 2] च्या आत आहे, म्हणून अख्ख्या अंतरालावर कोणतेही उत्तर नाही आणि त्या वर्णनाच्या अंतरालांची मोजणी 0 आहे. या परिस्थितीसोबत थांबणे आवश्यक आहे, कारण समीकरणाबद्दल सर्वकाही सौम्य दिसते. उजवी बाजू 1 + y² बहुपदी आहे: सर्वत्र संतत, सर्वत्र अवकलनीय, प्रत्येक बद्ध प्रदेशावर लिप्शित्झ. अस्तित्व-आणि-अद्वितीयता प्रमेय पूर्णपणे लागू होते आणि अद्वितीय उत्तराचे वचन देते — पण केवळ स्थानिकरीत्या, सुरुवातीच्या बिंदूभोवती एखाद्या अंतरालावर, आणि ते कधीच सांगत नाही की ते अंतराल किती लांब आहे. इथे ते π/2 रुंद आहे आणि मग उत्तर फक्त निघून गेले, सांत x मध्ये अनंताकडे पळून जाऊन. याला सांत काळात स्फोट म्हणतात, आणि कार्यपद्धती आहे स्वतःला बळकट करणारी प्रतिपुष्टी: y जितका मोठा होईल तितका वेगाने वाढतो, कारण वाढीचा दर y² वर अवलंबून आहे, म्हणून पलायन त्वरित होते आणि अनंताकडे अनंतस्पर्शी पोहोचण्याऐवजी बद्ध काळात पूर्ण होते. दोन गोष्टी निघतात. पहिली, प्रमेयाच्या एका नैसर्गिक पण चुकीच्या वाचनाची दुरुस्ती — 'उत्तर अस्तित्वात आहे' चा अर्थ 'उत्तर तुम्हाला हवे तितका वेळ अस्तित्वात आहे' नव्हे, आणि दोन्ही नियमितपणे एकत्र केले जातात कारण नीटनेटक्या उदाहरणांत ते एकरूप होतात. दुसरी, समीकरणाच्या रूपात काहीही याचा इशारा देत नाही. पाहून सांगता येत नाही की उत्तर कुठवर पोहोचेल; तो वेगळा प्रश्न आहे ज्याला वेगळे काम लागते, आणि नेमक्या याच आकाराची समीकरणे खऱ्या अनियंत्रित प्रक्रियांचे वर्णन करतात, काही रासायनिक अभिक्रियांपासून संरचनात्मक कोसळण्यापर्यंत, जिथे सांत-काळाची विचित्रता भौतिक दृष्ट्या अर्थपूर्ण भाकीत आहे, कोणतीही कृत्रिम निर्मिती नाही. (1 गृहीत धरते की सुव्यवस्थित उजवी बाजू सर्वत्र उत्तराची हमी देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Of the equations dy/dx = y, dy/dx = y + x and dy/dx = y², how many have the property that the sum of any two solutions is also a solution?",
          hi: "समीकरणों dy/dx = y, dy/dx = y + x और dy/dx = y² में से कितनों में यह गुण है कि किन्हीं दो हलों का योग भी हल है?",
          mr: "dy/dx = y, dy/dx = y + x आणि dy/dx = y² या समीकरणांपैकी कितींत हा गुणधर्म आहे की कोणत्याही दोन उत्तरांची बेरीज हेही उत्तर आहे?",
        },
        answer: 1,
        wrong: [2, 3, 0],
        checkExpr: "2-1",
        solution: {
          en: "One — the first, and only the first. Check each. For dy/dx = y, if u and v are solutions then (u + v)' = u' + v' = u + v, so the sum works. For dy/dx = y + x, the sum gives (u + v)' = u + v + 2x, but a solution would need u + v + x, so it fails by exactly the x that got counted twice. For dy/dx = y², the sum gives u² + v² whereas a solution needs (u + v)², and those differ by 2uv. So only the homogeneous linear equation has the property, and each failure fails in its own instructive way. This is the principle of superposition, and it is the reason linear differential equations are the ones physics can actually solve. When it holds, the solution set is a VECTOR SPACE: find enough independent solutions and every other one is a combination of them, which is what makes the whole apparatus of characteristic equations, complementary functions and Fourier series work at all. Notice that the second equation fails only because of the x — its homogeneous part is fine, which is why the standard method splits such an equation into a complementary function plus one particular solution, superposing within the homogeneous part and bolting the rest on separately. The third failure is different in kind and cannot be patched: nonlinearity destroys superposition outright, there is no decomposition to retreat to, and this is the honest reason turbulence, weather and the three-body problem resist solution while circuits and springs do not. The dividing line in the subject is not difficulty of arithmetic but whether solutions may be added. (2 counts the affine equation as linear, which it is in name but not in the sense superposition requires.)",
          hi: "एक — पहला, और केवल पहला। हर एक जाँचो। dy/dx = y के लिए, यदि u और v हल हैं तो (u + v)' = u' + v' = u + v, अतः योग चलता है। dy/dx = y + x के लिए, योग देता है (u + v)' = u + v + 2x, पर हल को u + v + x चाहिए, अतः वह ठीक उसी x से विफल है जो दो बार गिन लिया गया। dy/dx = y² के लिए, योग देता है u² + v² जबकि हल को (u + v)² चाहिए, और वे 2uv से भिन्न हैं। अतः केवल समघातीय रैखिक समीकरण में यह गुण है, और हर विफलता अपने ही शिक्षाप्रद ढंग से विफल होती है। यह अध्यारोपण का सिद्धांत है, और यही कारण है कि रैखिक अवकल समीकरण वही हैं जिन्हें भौतिकी सचमुच हल कर पाती है। जब यह लागू हो, हल-समुच्चय एक सदिश समष्टि होता है: पर्याप्त स्वतंत्र हल ढूँढ़ो और हर दूसरा उनका संयोजन है, और यही अभिलाक्षणिक समीकरणों, पूरक फलनों और फ़ूरिये श्रेणी के पूरे तंत्र को चलाता है। ध्यान दो कि दूसरा समीकरण केवल x के कारण विफल होता है — उसका समघातीय भाग ठीक है, इसीलिए मानक विधि ऐसे समीकरण को पूरक फलन और एक विशिष्ट हल में बाँट देती है, समघातीय भाग के भीतर अध्यारोपण करती है और बाक़ी को अलग से जोड़ देती है। तीसरी विफलता क़िस्म में भिन्न है और उसकी मरम्मत नहीं हो सकती: अरैखिकता अध्यारोपण को सीधे नष्ट कर देती है, पीछे हटने को कोई विघटन नहीं, और यही ईमानदार कारण है कि प्रक्षोभ, मौसम और त्रि-पिंड समस्या हल का विरोध करते हैं जबकि परिपथ और स्प्रिंग नहीं। विषय की विभाजक रेखा गणित की कठिनाई नहीं बल्कि यह है कि हलों को जोड़ा जा सकता है या नहीं। (2 सजातीय-नहीं रैखिक समीकरण को रैखिक गिन लेता है, जो वह नाम से है पर उस अर्थ में नहीं जो अध्यारोपण माँगता है।)",
          mr: "एक — पहिले, आणि फक्त पहिलेच. प्रत्येक तपासा. dy/dx = y साठी, जर u आणि v उत्तरे असतील तर (u + v)' = u' + v' = u + v, म्हणून बेरीज चालते. dy/dx = y + x साठी, बेरीज देते (u + v)' = u + v + 2x, पण उत्तराला u + v + x लागेल, म्हणून ते नेमक्या त्याच x ने अपयशी आहे जो दोनदा मोजला गेला. dy/dx = y² साठी, बेरीज देते u² + v² तर उत्तराला (u + v)² लागते, आणि ते 2uv ने वेगळे आहेत. म्हणून केवळ समघाती रैखिक समीकरणात हा गुणधर्म आहे, आणि प्रत्येक अपयश स्वतःच्याच बोधप्रद पद्धतीने अपयशी होते. हे अध्यारोपणाचे तत्त्व आहे, आणि हेच कारण आहे की रैखिक अवकल समीकरणे तीच आहेत जी भौतिकशास्त्र खरोखर सोडवू शकते. जेव्हा हे लागू होते, उत्तर-संच एक सदिश अवकाश असतो: पुरेशी स्वतंत्र उत्तरे शोधा आणि इतर प्रत्येक त्यांचे संयोजन आहे, आणि हेच अभिलाक्षणिक समीकरणे, पूरक फलने आणि फूरिये श्रेणी यांचे अख्खे यंत्र चालवते. लक्षात घ्या की दुसरे समीकरण केवळ x मुळे अपयशी होते — त्याचा समघाती भाग ठीक आहे, म्हणूनच प्रमाण पद्धत असे समीकरण पूरक फलन आणि एक विशिष्ट उत्तर यांत विभागते, समघाती भागाच्या आत अध्यारोपण करते आणि उरलेले वेगळे जोडते. तिसरे अपयश प्रकारात वेगळे आहे आणि त्याची दुरुस्ती होऊ शकत नाही: अरैखिकता अध्यारोपणाला थेट नष्ट करते, मागे हटण्यासाठी कोणतेही विघटन नाही, आणि हेच प्रामाणिक कारण आहे की क्षोभ, हवामान आणि त्रि-पिंड समस्या उत्तराला विरोध करतात तर परिपथ आणि स्प्रिंग नाहीत. विषयातील विभाजक रेषा गणिताची अवघडता नसून उत्तरे जोडता येतात का ही आहे. (2 सजातीय-नसलेल्या रैखिक समीकरणाला रैखिक मोजते, जे ते नावाने आहे पण अध्यारोपण मागत असलेल्या अर्थाने नाही.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-differential-equations",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 9 — Differential Equations",
      name: "Differential Equations",
      summary:
        "An equation whose unknown is a whole curve rather than a number: why the count of arbitrary constants must match the order, why degree is undefined rather than zero when a derivative sits inside a sine, why an initial condition usually picks one solution and occasionally picks infinitely many, why a perfectly well-behaved equation can lose its solution at a finite x, and why only the linear ones let two solutions be added.",
      position: 9,
      translations: {
        hi: {
          name: "अवकल समीकरण",
          summary:
            "ऐसा समीकरण जिसका अज्ञात कोई संख्या नहीं बल्कि पूरा वक्र है: स्वेच्छ अचरों की गिनती कोटि से क्यों मिलनी चाहिए, अवकलज के ज्या के भीतर बैठने पर घात शून्य क्यों नहीं बल्कि अपरिभाषित होती है, प्रारंभिक शर्त आम तौर पर एक हल क्यों चुनती है और कभी-कभी अनंत, बिलकुल सुव्यवहृत समीकरण अपना हल किसी परिमित x पर क्यों खो सकता है, और केवल रैखिक समीकरण ही दो हलों को जोड़ने क्यों देते हैं।",
        },
        mr: {
          name: "अवकल समीकरणे",
          summary:
            "असे समीकरण ज्याचा अज्ञात संख्या नसून अख्खा वक्र आहे: स्वैर अचलांची मोजणी कोटीशी का जुळावी लागते, अवकलज ज्येच्या आत बसल्यास कोटी शून्य नव्हे तर अपरिभाषित का असते, प्रारंभिक अट सर्वसाधारणपणे एक उत्तर का निवडते आणि कधीकधी अनंत, अगदी सुव्यवस्थित समीकरण आपले उत्तर एखाद्या सांत x वर का गमावू शकते, आणि केवळ रैखिक समीकरणेच दोन उत्तरे जोडू का देतात.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 10 — Vector Algebra (two products that detect opposite things)     */
/* ------------------------------------------------------------------------- */
function vectorAlgebra12(): TopicFileOut {
  const rand = rng("maths-12-vector-algebra");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the magnitude of the vector 3i + 4j?",
          hi: "सदिश 3i + 4j का परिमाण क्या है?",
          mr: "सदिश 3i + 4j चे परिमाण किती?",
        },
        answer: 5,
        wrong: [7, 12, 25],
        checkExpr: "25^0.5",
        solution: {
          en: "√(3² + 4²) = √25 = 5. Magnitude is Pythagoras applied to the components, and 7 is the answer of somebody who added them — which would be the distance walked along the axes rather than the straight-line length. The whole reason for using vectors is that the straight line and the walk are different things. (25 stops before taking the root.)",
          hi: "√(3² + 4²) = √25 = 5. परिमाण घटकों पर लगाया गया पाइथागोरस है, और 7 उसका उत्तर है जिसने उन्हें जोड़ दिया — जो अक्षों के साथ चली गई दूरी होती, सरल-रेखीय लंबाई नहीं। सदिश बरतने का पूरा कारण ही यह है कि सरल रेखा और चाल अलग चीज़ें हैं। (25 मूल लेने से पहले रुक जाता है।)",
          mr: "√(3² + 4²) = √25 = 5. परिमाण म्हणजे घटकांवर लावलेला पायथागोरस, आणि 7 हे त्याचे उत्तर आहे ज्याने ते जोडले — जे अक्षांसोबत चाललेले अंतर असते, सरळ-रेषीय लांबी नव्हे. सदिश वापरण्याचे अख्खे कारणच हे आहे की सरळ रेषा आणि चाल वेगळ्या गोष्टी आहेत. (25 मूळ घेण्याआधी थांबते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "What is the dot product of i + 2j and 3i + 4j?",
          hi: "i + 2j और 3i + 4j का अदिश गुणनफल क्या है?",
          mr: "i + 2j आणि 3i + 4j यांचा अदिश गुणाकार किती?",
        },
        answer: 11,
        wrong: [7, 10, 3],
        checkExpr: "1*3+2*4",
        solution: {
          en: "1 × 3 + 2 × 4 = 3 + 8 = 11. Multiply matching components and add. Note that the result is a plain number with no direction attached, which is why it is called the scalar product — two vectors have gone in and something of a different kind has come out. (7 multiplies the first components and adds the second, mixing the two operations.)",
          hi: "1 × 3 + 2 × 4 = 3 + 8 = 11. मेल खाते घटक गुणा करो और जोड़ो। ध्यान दो कि परिणाम बिना किसी दिशा वाली सादी संख्या है, इसीलिए उसे अदिश गुणनफल कहते हैं — दो सदिश भीतर गए और भिन्न क़िस्म की चीज़ बाहर आई। (7 पहले घटकों को गुणा करता है और दूसरों को जोड़ देता है, दोनों संक्रियाएँ मिला देते हुए।)",
          mr: "1 × 3 + 2 × 4 = 3 + 8 = 11. जुळणारे घटक गुणा आणि जोडा. लक्षात घ्या की निकाल कोणतीही दिशा नसलेली साधी संख्या आहे, म्हणूनच त्याला अदिश गुणाकार म्हणतात — दोन सदिश आत गेले आणि वेगळ्या प्रकारची गोष्ट बाहेर आली. (7 पहिले घटक गुणते आणि दुसरे जोडते, दोन्ही क्रिया मिसळत.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many components does a vector in three-dimensional space have?",
          hi: "त्रिविमीय समष्टि में किसी सदिश के कितने घटक होते हैं?",
          mr: "त्रिमितीय अवकाशातील एका सदिशाचे किती घटक असतात?",
        },
        answer: 3,
        wrong: [2, 1, 6],
        checkExpr: "1+2",
        solution: {
          en: "Three — one along each of i, j and k. The count of components is the dimension of the space and nothing to do with the vector's own length, which is a single number however many components produced it. Keeping those two apart is the first step: 3i + 4j has three characters, two components and magnitude 5. (6 counts the symbols rather than the directions.)",
          hi: "तीन — i, j और k हर एक के साथ एक। घटकों की गिनती समष्टि की विमा है और सदिश की अपनी लंबाई से उसका कोई लेना-देना नहीं, जो चाहे कितने भी घटकों से बनी हो एक अकेली संख्या है। इन दोनों को अलग रखना पहला क़दम है: 3i + 4j में तीन चिह्न हैं, दो घटक और परिमाण 5. (6 दिशाओं के बजाय संकेत गिन लेता है।)",
          mr: "तीन — i, j आणि k प्रत्येकासोबत एक. घटकांची मोजणी ही अवकाशाची मिती आहे आणि सदिशाच्या स्वतःच्या लांबीशी तिचा काहीच संबंध नाही, जी कितीही घटकांतून बनलेली असो एकच संख्या आहे. या दोघांना वेगळे ठेवणे हे पहिले पाऊल आहे: 3i + 4j मध्ये तीन चिन्हे आहेत, दोन घटक आणि परिमाण 5. (6 दिशांऐवजी चिन्हे मोजते.)",
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
          en: "Two vectors are perpendicular. What is their dot product?",
          hi: "दो सदिश लंबवत हैं। उनका अदिश गुणनफल क्या है?",
          mr: "दोन सदिश लंब आहेत. त्यांचा अदिश गुणाकार किती?",
        },
        answer: 0,
        wrong: [1, 2, 90],
        checkExpr: "1-1",
        solution: {
          en: "Zero, because a·b = |a||b| cos θ and cos 90° = 0. This is the dot product's real job: it is a detector of perpendicularity, and it answers the question with a single number rather than with any construction. The 90 on offer is the angle, not the product, and reaching for it is the standard confusion between what was asked about and what was asked for. (90 gives the angle in degrees.)",
          hi: "शून्य, क्योंकि a·b = |a||b| cos θ और cos 90° = 0. यही अदिश गुणनफल का असली काम है: वह लंबवतता का संसूचक है, और प्रश्न का उत्तर किसी रचना से नहीं बल्कि एक अकेली संख्या से देता है। पेश किया गया 90 कोण है, गुणनफल नहीं, और उसकी ओर बढ़ना उस मानक भ्रम का हिस्सा है कि किस बारे में पूछा गया और क्या पूछा गया। (90 डिग्री में कोण देता है।)",
          mr: "शून्य, कारण a·b = |a||b| cos θ आणि cos 90° = 0. हेच अदिश गुणाकाराचे खरे काम आहे: तो लंबतेचा संसूचक आहे, आणि प्रश्नाचे उत्तर कोणत्याही रचनेने नव्हे तर एका एकट्या संख्येने देतो. दिलेला 90 हा कोन आहे, गुणाकार नव्हे, आणि त्याकडे वळणे हा कशाबद्दल विचारले आणि काय विचारले या प्रमाण गोंधळाचा भाग आहे. (90 अंशांत कोन देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "The cross product of two parallel vectors has what magnitude?",
          hi: "दो समांतर सदिशों के सदिश गुणनफल का परिमाण क्या है?",
          mr: "दोन समांतर सदिशांच्या सदिश गुणाकाराचे परिमाण किती?",
        },
        answer: 0,
        wrong: [1, 2, 180],
        checkExpr: "2-2",
        solution: {
          en: "Zero, since |a × b| = |a||b| sin θ and sin 0° = 0. Put beside the previous question this is the pattern worth holding: BOTH products vanish, and they vanish in opposite circumstances. The dot product is zero when the vectors are perpendicular; the cross product is zero when they are parallel. So a vanishing product tells you something definite, but which thing depends entirely on which product you computed, and mixing them up inverts the conclusion. (180 gives an angle again.)",
          hi: "शून्य, क्योंकि |a × b| = |a||b| sin θ और sin 0° = 0. पिछले प्रश्न के साथ रखकर यही वह पैटर्न है जो पकड़ने लायक़ है: दोनों गुणनफल लुप्त होते हैं, और वे विपरीत परिस्थितियों में लुप्त होते हैं। अदिश गुणनफल तब शून्य है जब सदिश लंबवत हों; सदिश गुणनफल तब शून्य है जब वे समांतर हों। अतः लुप्त होता गुणनफल कुछ निश्चित बताता है, पर कौन-सी बात यह पूरी तरह इस पर निर्भर है कि तुमने कौन-सा गुणनफल निकाला, और उन्हें मिला देने से निष्कर्ष उलट जाता है। (180 फिर कोण देता है।)",
          mr: "शून्य, कारण |a × b| = |a||b| sin θ आणि sin 0° = 0. मागील प्रश्नासोबत ठेवल्यास हाच तो साचा आहे जो धरण्याजोगा आहे: दोन्ही गुणाकार लोप पावतात, आणि ते विरुद्ध परिस्थितीत लोप पावतात. अदिश गुणाकार तेव्हा शून्य आहे जेव्हा सदिश लंब असतील; सदिश गुणाकार तेव्हा शून्य आहे जेव्हा ते समांतर असतील. म्हणून लोप पावणारा गुणाकार काहीतरी निश्चित सांगतो, पण कोणती गोष्ट हे पूर्णपणे तुम्ही कोणता गुणाकार काढला यावर अवलंबून आहे, आणि ते मिसळल्याने निष्कर्ष उलटतो. (180 पुन्हा कोन देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A unit vector has what magnitude?",
          hi: "एकक सदिश का परिमाण क्या है?",
          mr: "एकक सदिशाचे परिमाण किती?",
        },
        answer: 1,
        wrong: [0, 3, 2],
        checkExpr: "2-1",
        solution: {
          en: "1, by definition — that is what the word 'unit' is doing. Dividing any non-zero vector by its own magnitude produces one, which is how a direction gets separated from a length. That separation is worth naming: a vector carries two pieces of information, and the unit vector is the half of it that survives when the size is thrown away. (0 confuses the unit vector with the zero vector, which is the one vector that has no direction at all.)",
          hi: "1, परिभाषा से — 'एकक' शब्द यही कर रहा है। किसी भी अशून्य सदिश को उसके अपने परिमाण से भाग देने पर एक बनता है, और इसी तरह दिशा लंबाई से अलग होती है। उस अलगाव को नाम देना ज़रूरी है: सदिश दो जानकारियाँ ढोता है, और एकक सदिश उसका वह आधा है जो आकार फेंक देने पर बचता है। (0 एकक सदिश को शून्य सदिश से गड्डमड्ड करता है, जो वह अकेला सदिश है जिसकी कोई दिशा ही नहीं।)",
          mr: "1, व्याख्येनुसार — 'एकक' हा शब्द हेच करत आहे. कोणत्याही अशून्य सदिशाला त्याच्या स्वतःच्या परिमाणाने भागल्यास एक बनतो, आणि याच रीतीने दिशा लांबीपासून वेगळी होते. त्या वेगळेपणाला नाव देणे आवश्यक आहे: सदिश दोन माहिती वाहतो, आणि एकक सदिश हा त्याचा तो अर्धा भाग आहे जो आकार फेकून दिल्यावर उरतो. (0 एकक सदिशाला शून्य सदिशाशी गोंधळवते, जो तो एकमेव सदिश आहे ज्याला दिशाच नाही.)",
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
          en: "What is the magnitude of the cross product of i and j?",
          hi: "i और j के सदिश गुणनफल का परिमाण क्या है?",
          mr: "i आणि j यांच्या सदिश गुणाकाराचे परिमाण किती?",
        },
        answer: 1,
        wrong: [0, 2, 3],
        checkExpr: "1*1",
        solution: {
          en: "1 — the product is k, which is a unit vector. The magnitude 1 × 1 × sin 90° = 1 is also the area of the square the two vectors span, and that is the geometric meaning worth carrying: the length of a cross product is the AREA of the parallelogram built on the two vectors. So a cross product encodes an area in its size and an orientation in its direction, which is a lot of information for one object and the reason it exists. (0 confuses this with the parallel case.)",
          hi: "1 — गुणनफल k है, जो एकक सदिश है। परिमाण 1 × 1 × sin 90° = 1 उस वर्ग का क्षेत्रफल भी है जिसे दोनों सदिश फैलाते हैं, और यही ज्यामितीय अर्थ साथ ले जाने लायक़ है: सदिश गुणनफल की लंबाई दोनों सदिशों पर बने समांतर चतुर्भुज का क्षेत्रफल है। अतः सदिश गुणनफल अपने आकार में क्षेत्रफल और अपनी दिशा में अभिविन्यास संजोता है, जो एक वस्तु के लिए काफ़ी जानकारी है और उसके होने का कारण। (0 इसे समांतर वाले मामले से गड्डमड्ड करता है।)",
          mr: "1 — गुणाकार k आहे, जो एकक सदिश आहे. परिमाण 1 × 1 × sin 90° = 1 हे त्या चौरसाचे क्षेत्रफळही आहे जो दोन्ही सदिश पसरवतात, आणि हाच भूमितीय अर्थ सोबत न्यायला हवा: सदिश गुणाकाराची लांबी म्हणजे दोन्ही सदिशांवर बांधलेल्या समांतरभुज चौकोनाचे क्षेत्रफळ. म्हणून सदिश गुणाकार आपल्या आकारात क्षेत्रफळ आणि आपल्या दिशेत अभिमुखता साठवतो, जी एका वस्तूसाठी पुष्कळ माहिती आहे आणि त्याच्या असण्याचे कारण. (0 याला समांतर प्रसंगाशी गोंधळवते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The projection of a on b is (a·b)/|b|. For a = 3i + 4j and b = i, what is it?",
          hi: "b पर a का प्रक्षेप (a·b)/|b| है। a = 3i + 4j और b = i के लिए वह क्या है?",
          mr: "b वर a चा प्रक्षेप (a·b)/|b| आहे. a = 3i + 4j आणि b = i साठी तो किती?",
        },
        answer: 3,
        wrong: [4, 5, 7],
        checkExpr: "3/1",
        solution: {
          en: "a·b = 3 and |b| = 1, so the projection is 3 — which is exactly a's i-component, as it must be, since projecting onto i is asking how far along i the vector reaches. The check is worth doing because it shows what the dot product is really measuring: how much of one vector lies along another. Perpendicularity giving zero then stops being a formula and becomes obvious — none of a perpendicular vector lies along you. (5 gives the magnitude of a, which is its full length rather than its shadow.)",
          hi: "a·b = 3 और |b| = 1, अतः प्रक्षेप 3 है — जो ठीक a का i-घटक है, और होना ही चाहिए, क्योंकि i पर प्रक्षेपण यही पूछना है कि सदिश i के साथ कितनी दूर पहुँचता है। यह जाँच करने लायक़ है क्योंकि वह दिखाती है कि अदिश गुणनफल असल में क्या माप रहा है: एक सदिश का कितना हिस्सा दूसरे के साथ पड़ा है। तब लंबवतता का शून्य देना सूत्र नहीं रह जाता, स्पष्ट हो जाता है — लंबवत सदिश का कोई हिस्सा तुम्हारे साथ पड़ा ही नहीं। (5, a का परिमाण देता है, जो उसकी छाया नहीं बल्कि पूरी लंबाई है।)",
          mr: "a·b = 3 आणि |b| = 1, म्हणून प्रक्षेप 3 आहे — जो नेमका a चा i-घटक आहे, आणि असावाच लागतो, कारण i वर प्रक्षेपण म्हणजे सदिश i सोबत किती दूर पोहोचतो हेच विचारणे. ही तपासणी करण्याजोगी आहे कारण ती दाखवते की अदिश गुणाकार प्रत्यक्षात काय मोजत आहे: एका सदिशाचा किती भाग दुसऱ्यासोबत पडला आहे. मग लंबतेने शून्य देणे हे सूत्र राहत नाही, स्पष्ट होते — लंब सदिशाचा कोणताही भाग तुमच्यासोबत पडलेलाच नाही. (5 हे a चे परिमाण देते, जी त्याची सावली नसून पूर्ण लांबी आहे.)",
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
          en: "For vectors a and b, how many of a × b and b × a have the same direction?",
          hi: "सदिश a और b के लिए, a × b और b × a में से कितनों की दिशा एक ही है?",
          mr: "सदिश a आणि b साठी, a × b आणि b × a यांपैकी कितींची दिशा एकच आहे?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        checkExpr: "2-2",
        solution: {
          en: "Neither shares the other's direction — they point exactly opposite ways, so the count of matching directions is 0. The cross product is anticommutative: a × b = −(b × a). This is a genuine break from the arithmetic students arrive with, where order never mattered for multiplication, and it is not an inconvenience but the point. The direction has to encode which vector came first, because a plane has two sides and something must decide which one the product points out of. The right-hand rule is the convention that decides it, and 'convention' is the honest word — the physics is unchanged by choosing the other hand, provided one chooses consistently everywhere. (2 assumes multiplication commutes, which it does for the dot product and not for this one.)",
          hi: "कोई भी दूसरे की दिशा साझा नहीं करता — वे ठीक विपरीत दिशाओं में इंगित करते हैं, अतः मेल खाती दिशाओं की गिनती 0 है। सदिश गुणनफल प्रति-क्रमविनिमेय है: a × b = −(b × a). यह उस गणित से असली टूट है जिसके साथ विद्यार्थी आते हैं, जहाँ गुणा के लिए क्रम कभी मायने नहीं रखता था, और यह असुविधा नहीं बल्कि मुद्दा है। दिशा को यह संजोना ही है कि कौन-सा सदिश पहले आया, क्योंकि समतल के दो पहलू हैं और किसी को तय करना होगा कि गुणनफल किस ओर से निकलता है। दक्षिण-हस्त नियम वह परिपाटी है जो इसे तय करती है, और 'परिपाटी' ईमानदार शब्द है — दूसरा हाथ चुनने से भौतिकी नहीं बदलती, बशर्ते हर जगह एक-सा चुना जाए। (2 मान लेता है कि गुणा क्रमविनिमेय है, जो अदिश गुणनफल के लिए है और इसके लिए नहीं।)",
          mr: "एकही दुसऱ्याची दिशा सामायिक करत नाही — ते नेमक्या विरुद्ध दिशांना निर्देश करतात, म्हणून जुळणाऱ्या दिशांची मोजणी 0 आहे. सदिश गुणाकार प्रति-क्रमविनिमेय आहे: a × b = −(b × a). हा त्या गणितापासूनचा खरा भंग आहे ज्यासोबत विद्यार्थी येतात, जिथे गुणाकारासाठी क्रम कधीच महत्त्वाचा नव्हता, आणि ही गैरसोय नसून मुद्दा आहे. दिशेला हे साठवावेच लागते की कोणता सदिश आधी आला, कारण प्रतलाला दोन बाजू आहेत आणि कोणालातरी ठरवावे लागते की गुणाकार कोणत्या बाजूने बाहेर पडतो. उजव्या-हाताचा नियम ती संकेतरीत आहे जी हे ठरवते, आणि 'संकेतरीत' हा प्रामाणिक शब्द आहे — दुसरा हात निवडल्याने भौतिकशास्त्र बदलत नाही, जोवर सर्वत्र एकसारखे निवडले जाते. (2 गृहीत धरते की गुणाकार क्रमविनिमेय आहे, जो अदिश गुणाकारासाठी आहे आणि यासाठी नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "Three vectors have a scalar triple product of 0. How many independent directions do they span?",
          hi: "तीन सदिशों का अदिश त्रिक गुणनफल 0 है। वे कितनी स्वतंत्र दिशाएँ फैलाते हैं?",
          mr: "तीन सदिशांचा अदिश त्रिक गुणाकार 0 आहे. ते किती स्वतंत्र दिशा पसरवतात?",
        },
        answer: 2,
        wrong: [3, 1, 0],
        checkExpr: "3-1",
        solution: {
          en: "At most 2. The scalar triple product a·(b × c) is the VOLUME of the parallelepiped the three vectors build, so a value of zero means that solid is flat — the three vectors lie in a common plane, and a plane has two independent directions. The word for this is coplanar, and the test is a single number rather than any construction, which is what makes it useful. Note how the two products are working together here: the cross product produces a vector perpendicular to b and c, and dotting a with it asks how far a escapes their plane. Zero means a does not escape at all. Reading a compound expression by asking what each operation contributes is a more reliable habit than memorising the compound as a formula. (3 answers with the number of vectors rather than the dimensions they span.)",
          hi: "अधिक से अधिक 2. अदिश त्रिक गुणनफल a·(b × c) उस समांतर षट्फलक का आयतन है जिसे तीनों सदिश बनाते हैं, अतः शून्य मान का अर्थ है वह ठोस चपटा है — तीनों सदिश एक साझा समतल में हैं, और समतल में दो स्वतंत्र दिशाएँ होती हैं। इसका शब्द समतलीय है, और परीक्षण किसी रचना के बजाय एक अकेली संख्या है, यही उसे उपयोगी बनाता है। ध्यान दो कि यहाँ दोनों गुणनफल कैसे साथ काम कर रहे हैं: सदिश गुणनफल b और c के लंबवत सदिश बनाता है, और उससे a का अदिश गुणनफल पूछता है कि a उनके समतल से कितनी दूर निकलता है। शून्य का अर्थ है a निकलता ही नहीं। किसी संयुक्त व्यंजक को यह पूछकर पढ़ना कि हर संक्रिया क्या योगदान देती है, संयुक्त को सूत्र की तरह रटने से अधिक भरोसेमंद आदत है। (3 सदिशों की संख्या से उत्तर देता है, उनके फैलाए विमाओं से नहीं।)",
          mr: "जास्तीत जास्त 2. अदिश त्रिक गुणाकार a·(b × c) हा त्या समांतरषट्फलकाचे घनफळ आहे जो तिन्ही सदिश बांधतात, म्हणून शून्य मूल्याचा अर्थ तो घन सपाट आहे — तिन्ही सदिश एका सामायिक प्रतलात आहेत, आणि प्रतलात दोन स्वतंत्र दिशा असतात. याचा शब्द समप्रतलीय आहे, आणि चाचणी कोणत्याही रचनेऐवजी एकच संख्या आहे, हेच तिला उपयुक्त बनवते. लक्षात घ्या की इथे दोन्ही गुणाकार कसे एकत्र काम करत आहेत: सदिश गुणाकार b आणि c ला लंब असा सदिश बनवतो, आणि त्याच्याशी a चा अदिश गुणाकार विचारतो की a त्यांच्या प्रतलातून किती दूर निसटतो. शून्य म्हणजे a निसटतच नाही. एखादे संयुक्त पदावली प्रत्येक क्रिया काय योगदान देते हे विचारून वाचणे, संयुक्ताला सूत्रासारखे पाठ करण्याहून अधिक विश्वासार्ह सवय आहे. (3 सदिशांच्या संख्येने उत्तर देते, त्यांनी पसरवलेल्या मितींनी नाही.)",
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
          en: "For a = i, b = i and c = j, compare (a × b) × c with a × (b × c). How many of these two expressions are non-zero?",
          hi: "a = i, b = i और c = j के लिए, (a × b) × c की तुलना a × (b × c) से करो। इन दोनों व्यंजकों में से कितने अशून्य हैं?",
          mr: "a = i, b = i आणि c = j साठी, (a × b) × c ची तुलना a × (b × c) शी करा. या दोन पदावलींपैकी किती अशून्य आहेत?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        checkExpr: "2-1",
        solution: {
          en: "One. Work them out. a × b is i × i = 0, so the first expression is 0 × j = 0. For the second, b × c is i × j = k, and a × k is i × k = −j, which is not zero. So the two bracketings give different answers, and the cross product is NOT associative. This is a sharper break than the anticommutativity of the previous question, because anticommutativity at least follows a rule — swap and negate — whereas the failure of associativity means the brackets are load-bearing and cannot be dropped. Nothing in ordinary algebra prepares one for this: addition and multiplication of numbers, composition of functions and multiplication of matrices are all associative, so it is easy to write a × b × c without noticing that the expression is meaningless. Two further remarks. First, there is a replacement — the vector triple product expansion a × (b × c) = b(a·c) − c(a·b) — and it is worth reading as an admission: the answer must be expressed by moving the brackets explicitly, because there is no bracket-free form. Second, the deeper reason is that a bilinear product of vectors returning a vector exists in only a very few dimensions at all, three among them, and the three-dimensional one buys its existence at the price of associativity. It is not a defect in the definition; it is what was available. (2 assumes both bracketings must give the same non-zero answer.)",
          hi: "एक। उन्हें निकालो। a × b है i × i = 0, अतः पहला व्यंजक 0 × j = 0 है। दूसरे के लिए, b × c है i × j = k, और a × k है i × k = −j, जो शून्य नहीं। अतः दोनों कोष्ठकीकरण भिन्न उत्तर देते हैं, और सदिश गुणनफल साहचर्य नहीं है। यह पिछले प्रश्न की प्रति-क्रमविनिमेयता से तीखी टूट है, क्योंकि प्रति-क्रमविनिमेयता कम से कम एक नियम मानती है — बदलो और ऋण करो — जबकि साहचर्य की विफलता का अर्थ है कि कोष्ठक भार उठा रहे हैं और उन्हें गिराया नहीं जा सकता। साधारण बीजगणित में कुछ भी इसके लिए तैयार नहीं करता: संख्याओं का जोड़ और गुणा, फलनों का संयोजन और आव्यूहों का गुणा सब साहचर्य हैं, अतः a × b × c लिख देना आसान है बिना यह देखे कि व्यंजक निरर्थक है। दो और टिप्पणियाँ। पहली, एक विकल्प है — सदिश त्रिक गुणनफल का प्रसार a × (b × c) = b(a·c) − c(a·b) — और उसे स्वीकारोक्ति की तरह पढ़ना ठीक है: उत्तर को कोष्ठक स्पष्ट रूप से हिलाकर ही व्यक्त करना होगा, क्योंकि कोष्ठक-रहित रूप है ही नहीं। दूसरी, गहरा कारण यह है कि सदिश लौटाने वाला सदिशों का द्विरैखिक गुणनफल बहुत ही थोड़ी विमाओं में अस्तित्व में है, तीन उनमें से एक, और त्रिविमीय वाला अपना अस्तित्व साहचर्य की क़ीमत पर ख़रीदता है। यह परिभाषा का दोष नहीं; यही उपलब्ध था। (2 मान लेता है कि दोनों कोष्ठकीकरण एक ही अशून्य उत्तर देंगे।)",
          mr: "एक. ते काढा. a × b म्हणजे i × i = 0, म्हणून पहिली पदावली 0 × j = 0 आहे. दुसरीसाठी, b × c म्हणजे i × j = k, आणि a × k म्हणजे i × k = −j, जो शून्य नाही. म्हणून दोन्ही कंसीकरणे वेगळी उत्तरे देतात, आणि सदिश गुणाकार साहचर्य नाही. हा मागील प्रश्नाच्या प्रति-क्रमविनिमेयतेहून तीक्ष्ण भंग आहे, कारण प्रति-क्रमविनिमेयता किमान एक नियम पाळते — अदलाबदल करा आणि ऋण करा — तर साहचर्याच्या अपयशाचा अर्थ हा की कंस भार उचलत आहेत आणि ते टाकता येत नाहीत. साध्या बीजगणितात काहीही यासाठी तयार करत नाही: संख्यांची बेरीज आणि गुणाकार, फलनांचे संयोजन आणि मॅट्रिक्सचा गुणाकार सर्व साहचर्य आहेत, म्हणून a × b × c लिहून टाकणे सोपे आहे, पदावली निरर्थक आहे हे न पाहता. आणखी दोन टिप्पण्या. पहिली, एक पर्याय आहे — सदिश त्रिक गुणाकाराचा विस्तार a × (b × c) = b(a·c) − c(a·b) — आणि तो कबुलीजबाबासारखा वाचणे बरे: उत्तर कंस स्पष्टपणे हलवूनच व्यक्त करावे लागते, कारण कंस-विरहित रूप नाहीच. दुसरी, अधिक खोल कारण हे की सदिश परत करणारा सदिशांचा द्विरैखिक गुणाकार अगदी थोड्याच मितींत अस्तित्वात आहे, तीन त्यांतील एक, आणि त्रिमितीय तो आपले अस्तित्व साहचर्याच्या किमतीवर विकत घेतो. हा व्याख्येतील दोष नाही; हेच उपलब्ध होते. (2 गृहीत धरते की दोन्ही कंसीकरणे एकच अशून्य उत्तर देतील.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "For any vectors a and b, |a·b| ≤ |a||b|. For a = 3i and b = 4i, by how much does |a||b| exceed |a·b|?",
          hi: "किन्हीं सदिशों a और b के लिए, |a·b| ≤ |a||b|. a = 3i और b = 4i के लिए, |a||b|, |a·b| से कितना अधिक है?",
          mr: "कोणत्याही सदिश a आणि b साठी, |a·b| ≤ |a||b|. a = 3i आणि b = 4i साठी, |a||b| हा |a·b| हून किती अधिक आहे?",
        },
        answer: 0,
        wrong: [12, 1, 7],
        checkExpr: "12-12",
        solution: {
          en: "By nothing — both sides are 12, so the excess is 0. This is the Cauchy–Schwarz inequality, and the case worth studying is precisely the one where it becomes an equality. Since a·b = |a||b| cos θ, the two sides differ by the factor cos θ, so they coincide exactly when cos θ = ±1, which means the vectors are PARALLEL. That is the general statement: equality holds if and only if one vector is a scalar multiple of the other, and here b is 4/3 of a. Two things make this worth an advanced question. First, an inequality's equality case is usually where its content lies — the inequality alone says the dot product cannot be too large, but the equality case says exactly what 'too large' means and when the bound is attained, and optimisation problems are almost always solved by finding that case. Second, the inequality holds far beyond arrows in space: it is true in any inner product space, so the same statement bounds integrals of products of functions, and covariances of random variables, and in that last setting it is precisely the statement that a correlation coefficient cannot exceed 1 in absolute value. One inequality, three subjects, and the equality case in each says the same thing — that one quantity is a fixed multiple of the other. (12 gives the common value of both sides rather than the difference between them.)",
          hi: "कुछ भी नहीं — दोनों पक्ष 12 हैं, अतः अधिकता 0 है। यह कोशी–श्वार्ट्ज़ असमिका है, और अध्ययन लायक़ मामला ठीक वही है जहाँ वह समता बन जाती है। चूँकि a·b = |a||b| cos θ, दोनों पक्ष cos θ के गुणक से भिन्न हैं, अतः वे ठीक तभी एक होते हैं जब cos θ = ±1, यानी सदिश समांतर हों। सामान्य कथन यही है: समता तभी और केवल तभी है जब एक सदिश दूसरे का अदिश गुणज हो, और यहाँ b, a का 4/3 है। दो बातें इसे उन्नत प्रश्न बनाती हैं। पहली, किसी असमिका का समता-मामला आम तौर पर वहीं है जहाँ उसकी सामग्री है — अकेली असमिका कहती है कि अदिश गुणनफल बहुत बड़ा नहीं हो सकता, पर समता-मामला ठीक-ठीक बताता है कि 'बहुत बड़ा' का अर्थ क्या है और सीमा कब छुई जाती है, और इष्टतमीकरण की समस्याएँ लगभग हमेशा उसी मामले को ढूँढ़कर हल होती हैं। दूसरी, असमिका समष्टि के तीरों से कहीं आगे लागू है: वह किसी भी अंतःगुणन समष्टि में सच है, अतः वही कथन फलनों के गुणनफलों के समाकलों को, और यादृच्छिक चरों के सहप्रसरणों को बाँधता है, और उस अंतिम परिवेश में वह ठीक यह कथन है कि सहसंबंध गुणांक निरपेक्ष मान में 1 से आगे नहीं जा सकता। एक असमिका, तीन विषय, और हर एक में समता-मामला वही बात कहता है — कि एक राशि दूसरी की नियत गुणज है। (12 उनके बीच के अंतर के बजाय दोनों पक्षों का साझा मान देता है।)",
          mr: "काहीच नाही — दोन्ही बाजू 12 आहेत, म्हणून अधिक्य 0 आहे. ही कोशी–श्वार्ट्झ असमानता आहे, आणि अभ्यासण्याजोगा प्रसंग नेमका तोच आहे जिथे ती समानता बनते. कारण a·b = |a||b| cos θ, दोन्ही बाजू cos θ या गुणकाने वेगळ्या आहेत, म्हणून त्या नेमक्या तेव्हाच एकरूप होतात जेव्हा cos θ = ±1, म्हणजे सदिश समांतर असतील. सर्वसाधारण विधान हेच आहे: समानता तेव्हाच आणि केवळ तेव्हाच आहे जेव्हा एक सदिश दुसऱ्याचा अदिश गुणज असेल, आणि इथे b हा a चा 4/3 आहे. दोन गोष्टी याला प्रगत प्रश्न बनवतात. पहिली, एखाद्या असमानतेचा समानता-प्रसंग सर्वसाधारणपणे तिथेच असतो जिथे तिचा आशय आहे — एकटी असमानता सांगते की अदिश गुणाकार फार मोठा असू शकत नाही, पण समानता-प्रसंग नेमके सांगतो की 'फार मोठा' म्हणजे काय आणि सीमा कधी गाठली जाते, आणि इष्टतमीकरणाच्या समस्या जवळजवळ नेहमी तोच प्रसंग शोधून सुटतात. दुसरी, असमानता अवकाशातील बाणांहून कितीतरी पुढे लागू आहे: ती कोणत्याही अंतर्गुणन अवकाशात खरी आहे, म्हणून तेच विधान फलनांच्या गुणाकारांच्या समाकलांना, आणि यादृच्छिक चलांच्या सहप्रसरणांना बांधते, आणि त्या शेवटच्या संदर्भात ते नेमके हे विधान आहे की सहसंबंध गुणांक निरपेक्ष मूल्यात 1 हून पुढे जाऊ शकत नाही. एक असमानता, तीन विषय, आणि प्रत्येकात समानता-प्रसंग तेच सांगतो — की एक राशी दुसरीची निश्चित गुणज आहे. (12 त्यांमधील फरकाऐवजी दोन्ही बाजूंचे सामायिक मूल्य देते.)",
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
          en: "The cross product needs a rule for which side of a plane the result points to. Reflecting the whole configuration in a mirror reverses that side without changing either input vector's mirror image consistently. Of |a|, a·b and a × b, how many are unchanged in sign by such a reflection?",
          hi: "सदिश गुणनफल को यह नियम चाहिए कि परिणाम समतल के किस ओर इंगित करे। पूरी व्यवस्था को दर्पण में परावर्तित करने पर वह ओर पलट जाती है, बिना किसी निवेश सदिश के दर्पण-प्रतिबिंब को संगत रूप से बदले। |a|, a·b और a × b में से कितने ऐसे परावर्तन से चिह्न में अपरिवर्तित रहते हैं?",
          mr: "सदिश गुणाकाराला हा नियम लागतो की निकाल प्रतलाच्या कोणत्या बाजूला निर्देश करावा. अख्खी मांडणी आरशात परावर्तित केल्यास ती बाजू उलटते, कोणत्याही निविष्ट सदिशाचे आरसा-प्रतिबिंब सुसंगतपणे न बदलता. |a|, a·b आणि a × b यांपैकी किती अशा परावर्तनाने चिन्हात अपरिवर्तित राहतात?",
        },
        answer: 2,
        wrong: [3, 1, 0],
        checkExpr: "3-1",
        solution: {
          en: "Two — the magnitude and the dot product. A length cannot change sign at all, and the dot product is built from products of matching components, each of which picks up two sign flips that cancel. The cross product is the exception: its components are built from MISMATCHED pairs, so the flips do not cancel, and the mirror image of a × b is minus what one would get by crossing the mirror images. Quantities behaving this way are called pseudovectors or axial vectors, and the distinction is not a curiosity of notation. Angular momentum, torque and the magnetic field are all defined by cross products and are all pseudovectors, and the practical consequence is that their direction is not a fact about the world but a fact about the handedness convention one adopted — swap to a left-handed rule and every one of them reverses while every physical prediction stays identical, because they always appear in the final answer in pairs or in further cross products, and the two convention-dependent signs cancel. There is a real lesson in that about reading formulas. A quantity that flips when the convention flips cannot by itself be measurable; whatever is measurable must be built from it in a way that is convention-blind. So the honest question to ask of the direction of a magnetic field is not which way it really points but what it is contracted with before anything observable is computed — and the answer is always something that restores the balance. (3 assumes that reflecting a configuration cannot change any derived quantity's sign, which is true of everything here except the one object built from a handedness rule.)",
          hi: "दो — परिमाण और अदिश गुणनफल। लंबाई का चिह्न बदल ही नहीं सकता, और अदिश गुणनफल मेल खाते घटकों के गुणनफलों से बना है, जिनमें से हर एक दो चिह्न-पलट उठाता है जो कट जाते हैं। सदिश गुणनफल अपवाद है: उसके घटक बेमेल जोड़ों से बने हैं, अतः पलट कटते नहीं, और a × b का दर्पण-प्रतिबिंब उससे ऋणात्मक है जो दर्पण-प्रतिबिंबों का गुणनफल लेने पर मिलता। ऐसा बरतने वाली राशियों को छद्म-सदिश या अक्षीय सदिश कहते हैं, और यह भेद संकेतन की जिज्ञासा नहीं। कोणीय संवेग, बल-आघूर्ण और चुंबकीय क्षेत्र सब सदिश गुणनफलों से परिभाषित हैं और सब छद्म-सदिश हैं, और व्यावहारिक परिणाम यह है कि उनकी दिशा संसार का तथ्य नहीं बल्कि अपनाई गई हस्तता-परिपाटी का तथ्य है — वाम-हस्त नियम पर जाओ और उनमें से हर एक पलट जाता है जबकि हर भौतिक भविष्यवाणी वैसी ही रहती है, क्योंकि वे अंतिम उत्तर में सदा जोड़ों में या आगे के सदिश गुणनफलों में आते हैं, और दोनों परिपाटी-निर्भर चिह्न कट जाते हैं। सूत्र पढ़ने के बारे में उसमें असली सबक़ है। जो राशि परिपाटी पलटने पर पलट जाए वह अपने आप मापनीय नहीं हो सकती; जो मापनीय है उसे उससे ऐसे बनाया गया होगा जो परिपाटी-अंधा हो। अतः चुंबकीय क्षेत्र की दिशा से पूछने लायक़ ईमानदार प्रश्न यह नहीं कि वह सचमुच किधर इंगित करती है बल्कि यह कि कुछ प्रेक्षणीय गणित होने से पहले उसे किससे संकुचित किया जाता है — और उत्तर सदा वह चीज़ है जो संतुलन बहाल कर देती है। (3 मान लेता है कि किसी व्यवस्था को परावर्तित करने से किसी व्युत्पन्न राशि का चिह्न नहीं बदल सकता, जो यहाँ हर चीज़ के लिए सच है सिवाय उस अकेली वस्तु के जो हस्तता-नियम से बनी है।)",
          mr: "दोन — परिमाण आणि अदिश गुणाकार. लांबीचे चिन्ह बदलूच शकत नाही, आणि अदिश गुणाकार जुळणाऱ्या घटकांच्या गुणाकारांतून बनला आहे, ज्यांपैकी प्रत्येक दोन चिन्ह-उलटी उचलतो जी रद्द होतात. सदिश गुणाकार अपवाद आहे: त्याचे घटक न जुळणाऱ्या जोड्यांतून बनले आहेत, म्हणून उलटी रद्द होत नाहीत, आणि a × b चे आरसा-प्रतिबिंब त्याहून ऋण आहे जे आरसा-प्रतिबिंबांचा गुणाकार घेतल्यास मिळाले असते. अशा वागणाऱ्या राशींना छद्म-सदिश किंवा अक्षीय सदिश म्हणतात, आणि हा भेद चिन्हांकनाची उत्सुकता नाही. कोनीय संवेग, बलआघूर्ण आणि चुंबकीय क्षेत्र सर्व सदिश गुणाकारांनी परिभाषित आहेत आणि सर्व छद्म-सदिश आहेत, आणि व्यावहारिक परिणाम हा की त्यांची दिशा जगाबद्दलचे तथ्य नसून स्वीकारलेल्या हस्तता-संकेतरीतीबद्दलचे तथ्य आहे — डाव्या-हाताच्या नियमावर जा आणि त्यांपैकी प्रत्येक उलटतो तर प्रत्येक भौतिक भाकीत तसेच राहते, कारण ते अंतिम उत्तरात नेहमी जोड्यांत वा पुढील सदिश गुणाकारांत येतात, आणि दोन्ही संकेतरीत-अवलंबी चिन्हे रद्द होतात. सूत्रे वाचण्याबद्दल त्यात खरा धडा आहे. जी राशी संकेतरीत उलटल्यावर उलटते ती स्वतःहून मापनीय असू शकत नाही; जे मापनीय आहे ते तिच्यातून अशा प्रकारे बांधलेले असावे जो संकेतरीत-आंधळा असेल. म्हणून चुंबकीय क्षेत्राच्या दिशेला विचारण्याजोगा प्रामाणिक प्रश्न हा नाही की ती खरोखर कोणीकडे निर्देश करते तर हा की काही निरीक्षणीय काढले जाण्याआधी तिला कशाशी संकुचित केले जाते — आणि उत्तर नेहमी ती गोष्ट आहे जी संतुलन पुन्हा प्रस्थापित करते. (3 गृहीत धरते की एखादी मांडणी परावर्तित केल्याने कोणत्याही व्युत्पन्न राशीचे चिन्ह बदलू शकत नाही, जे इथे प्रत्येक गोष्टीसाठी खरे आहे त्या एकट्या वस्तूखेरीज जी हस्तता-नियमातून बनली आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "Of the two products, the dot product generalises to every dimension while the cross product as defined here does not. In how many dimensions above one does a cross product of two vectors returning a vector of the same kind exist?",
          hi: "दोनों गुणनफलों में से, अदिश गुणनफल हर विमा तक सामान्यीकृत होता है जबकि यहाँ परिभाषित सदिश गुणनफल नहीं। एक से ऊपर कितनी विमाओं में दो सदिशों का ऐसा सदिश गुणनफल है जो उसी क़िस्म का सदिश लौटाता हो?",
          mr: "दोन गुणाकारांपैकी, अदिश गुणाकार प्रत्येक मितीत सर्वसाधारण होतो तर इथे परिभाषित सदिश गुणाकार होत नाही. एकाहून वर किती मितींत दोन सदिशांचा असा सदिश गुणाकार अस्तित्वात आहे जो त्याच प्रकारचा सदिश परत करतो?",
        },
        answer: 2,
        wrong: [1, 3, 4],
        checkExpr: "1+1",
        solution: {
          en: "Two — dimension 3 and dimension 7, and nothing else. That is a startling fact and it is worth taking seriously rather than as trivia, because the natural expectation is that a construction this useful should exist everywhere, and the natural explanation for its absence — that nobody has found the right formula yet — is wrong. The requirements are modest: the product should be bilinear, perpendicular to both inputs, and have magnitude equal to the area of the parallelogram spanned. Those conditions turn out to force a division algebra structure on the space one dimension up, and division algebras over the reals exist in dimensions 1, 2, 4 and 8 only — the reals, the complex numbers, the quaternions and the octonions — which leaves cross products in dimensions 0, 1, 3 and 7, of which only 3 and 7 are non-trivial. So the answer is 2. Three lessons come out of this. The first is that our three-dimensional cross product is a coincidence of the dimension we happen to inhabit, not a general feature of geometry, and every formula in physics that uses one is therefore quietly three-dimensional in a way that dot-product formulas are not. The second is that the seven-dimensional version, though it exists, loses even more structure — it satisfies no Jacobi identity, so it is not even a Lie algebra — which shows that 'exists' and 'is useful' are separate questions. The third is methodological and the most transferable: when something fails to generalise, the informative move is to ask what structure it was secretly using. Here the answer was a division algebra hiding one dimension up, and finding it explains not only the failure but the exact list of exceptions. A negative result that produces a complete list is worth more than a positive result about one case. (1 supposes three dimensions are the unique home of the construction, which is the expected answer and is one short.)",
          hi: "दो — विमा 3 और विमा 7, और कुछ नहीं। यह चौंकाने वाला तथ्य है और उसे सामान्य ज्ञान के बजाय गंभीरता से लेना ज़रूरी है, क्योंकि स्वाभाविक अपेक्षा यह है कि इतनी उपयोगी रचना हर जगह होनी चाहिए, और उसकी अनुपस्थिति की स्वाभाविक व्याख्या — कि अभी किसी को सही सूत्र नहीं मिला — ग़लत है। माँगें मामूली हैं: गुणनफल द्विरैखिक हो, दोनों निवेशों के लंबवत हो, और उसका परिमाण फैलाए गए समांतर चतुर्भुज के क्षेत्रफल के बराबर हो। वे शर्तें एक विमा ऊपर की समष्टि पर भाग-बीजगणित की संरचना थोप देती हैं, और वास्तविकों पर भाग-बीजगणित केवल विमाओं 1, 2, 4 और 8 में हैं — वास्तविक, सम्मिश्र, चतुष्टय और अष्टक — जिससे सदिश गुणनफल विमाओं 0, 1, 3 और 7 में बचते हैं, जिनमें से केवल 3 और 7 अतुच्छ हैं। अतः उत्तर 2 है। इससे तीन सबक़ निकलते हैं। पहला, हमारा त्रिविमीय सदिश गुणनफल उस विमा का संयोग है जिसमें हम संयोग से रहते हैं, ज्यामिति का सामान्य लक्षण नहीं, और इसलिए भौतिकी का हर सूत्र जो उसे बरतता है चुपचाप त्रिविमीय है, उस तरह से जैसे अदिश-गुणनफल के सूत्र नहीं हैं। दूसरा, सात-विमीय संस्करण, हालाँकि मौजूद है, और भी अधिक संरचना खोता है — वह कोई याकोबी सर्वसमिका नहीं मानता, अतः वह ली बीजगणित तक नहीं — जो दिखाता है कि 'मौजूद है' और 'उपयोगी है' अलग प्रश्न हैं। तीसरा पद्धतिगत है और सबसे अधिक हस्तांतरणीय: जब कुछ सामान्यीकृत होने में विफल हो, तो जानकारी देने वाला क़दम यह पूछना है कि वह चुपके से किस संरचना का उपयोग कर रहा था। यहाँ उत्तर एक विमा ऊपर छिपा भाग-बीजगणित था, और उसे ढूँढ़ना न केवल विफलता बल्कि अपवादों की ठीक सूची भी समझा देता है। पूरी सूची देने वाला ऋणात्मक परिणाम एक मामले के बारे में धनात्मक परिणाम से अधिक क़ीमती है। (1 मान लेता है कि तीन विमाएँ ही रचना का अकेला घर हैं, जो अपेक्षित उत्तर है और एक कम है।)",
          mr: "दोन — मिती 3 आणि मिती 7, आणि दुसरे काहीच नाही. हे चकित करणारे तथ्य आहे आणि त्याला सामान्यज्ञानाऐवजी गांभीर्याने घेणे आवश्यक आहे, कारण नैसर्गिक अपेक्षा ही की इतकी उपयुक्त रचना सर्वत्र असावी, आणि तिच्या अनुपस्थितीचे नैसर्गिक स्पष्टीकरण — की अजून कोणाला योग्य सूत्र सापडलेले नाही — चुकीचे आहे. मागण्या माफक आहेत: गुणाकार द्विरैखिक असावा, दोन्ही निविष्टांना लंब असावा, आणि त्याचे परिमाण पसरवलेल्या समांतरभुज चौकोनाच्या क्षेत्रफळाइतके असावे. त्या अटी एक मिती वरच्या अवकाशावर भाग-बीजगणिताची रचना लादतात, आणि वास्तवांवर भाग-बीजगणिते केवळ मिती 1, 2, 4 आणि 8 मध्ये आहेत — वास्तव, संमिश्र, चतुष्क आणि अष्टक — ज्यामुळे सदिश गुणाकार मिती 0, 1, 3 आणि 7 मध्ये उरतात, ज्यांपैकी केवळ 3 आणि 7 अतुच्छ आहेत. म्हणून उत्तर 2 आहे. यातून तीन धडे निघतात. पहिला, आपला त्रिमितीय सदिश गुणाकार हा आपण योगायोगाने वसत असलेल्या मितीचा योगायोग आहे, भूमितीचे सर्वसाधारण वैशिष्ट्य नव्हे, आणि म्हणून भौतिकशास्त्राचे प्रत्येक सूत्र जे तो वापरते ते गुपचूप त्रिमितीय आहे, ज्या रीतीने अदिश-गुणाकाराची सूत्रे नाहीत. दुसरा, सात-मितीय आवृत्ती, जरी अस्तित्वात असली तरी, आणखी अधिक रचना गमावते — ती कोणतीही याकोबी एकात्मता पाळत नाही, म्हणून ती ली बीजगणितसुद्धा नाही — जे दाखवते की 'अस्तित्वात आहे' आणि 'उपयुक्त आहे' हे वेगळे प्रश्न आहेत. तिसरा पद्धतीविषयक आहे आणि सर्वाधिक हस्तांतरणीय: जेव्हा काही सर्वसाधारण होण्यात अपयशी ठरते, तेव्हा माहिती देणारे पाऊल हे विचारणे आहे की ते गुपचूप कोणती रचना वापरत होते. इथे उत्तर एक मिती वर लपलेले भाग-बीजगणित होते, आणि ते शोधणे केवळ अपयशच नव्हे तर अपवादांची नेमकी यादीही स्पष्ट करते. संपूर्ण यादी देणारा ऋण निकाल एका प्रसंगाबद्दलच्या धन निकालाहून अधिक मोलाचा आहे. (1 गृहीत धरते की तीन मिती हेच रचनेचे एकमेव घर आहे, जे अपेक्षित उत्तर आहे आणि एकने कमी आहे.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-vector-algebra",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 10 — Vector Algebra",
      name: "Vector Algebra",
      summary:
        "Two products built from the same pair of arrows that detect opposite things: why one vanishes on perpendicular vectors and the other on parallel ones, why the second refuses both the commutativity and the associativity that all earlier multiplication had, why its direction is a convention rather than a fact, and why it exists in only two dimensions above one while the first exists in all of them.",
      position: 10,
      translations: {
        hi: {
          name: "सदिश बीजगणित",
          summary:
            "एक ही तीरों की जोड़ी से बने दो गुणनफल जो विपरीत चीज़ें भाँपते हैं: एक लंबवत सदिशों पर और दूसरा समांतर सदिशों पर क्यों लुप्त होता है, दूसरा वह क्रमविनिमेयता और साहचर्य दोनों क्यों नकारता है जो पहले के हर गुणा में थे, उसकी दिशा तथ्य के बजाय परिपाटी क्यों है, और वह एक से ऊपर केवल दो विमाओं में क्यों है जबकि पहला उन सब में।",
        },
        mr: {
          name: "सदिश बीजगणित",
          summary:
            "एकाच बाणांच्या जोडीतून बनलेले दोन गुणाकार जे विरुद्ध गोष्टी ओळखतात: एक लंब सदिशांवर आणि दुसरा समांतर सदिशांवर का लोप पावतो, दुसरा ती क्रमविनिमेयता आणि साहचर्य दोन्ही का नाकारतो जी आधीच्या प्रत्येक गुणाकारात होती, त्याची दिशा तथ्याऐवजी संकेतरीत का आहे, आणि तो एकाहून वर केवळ दोन मितींत का आहे तर पहिला त्या सर्वांत.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 11 — Three Dimensional Geometry (a third way for lines to relate)  */
/* ------------------------------------------------------------------------- */
function threeDimensionalGeometry12(): TopicFileOut {
  const rand = rng("maths-12-three-dimensional-geometry");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A line has direction ratios 1, 2, 2. What is the length of that direction vector?",
          hi: "किसी रेखा के दिक्-अनुपात 1, 2, 2 हैं। उस दिक्-सदिश की लंबाई क्या है?",
          mr: "एका रेषेचे दिक्-गुणोत्तर 1, 2, 2 आहेत. त्या दिक्-सदिशाची लांबी किती?",
        },
        answer: 3,
        wrong: [5, 4, 9],
        checkExpr: "9^0.5",
        solution: {
          en: "√(1 + 4 + 4) = √9 = 3. Pythagoras extends to three dimensions with a third square added and nothing else changed, which is the first sign that most of two-dimensional geometry survives the extra axis intact. Direction ratios are not unique — 2, 4, 4 describes the same direction — and dividing by this length is what turns them into direction cosines. (5 adds the ratios.)",
          hi: "√(1 + 4 + 4) = √9 = 3. पाइथागोरस तीन विमाओं तक फैलता है, एक तीसरा वर्ग जुड़ता है और कुछ नहीं बदलता, और यही पहला संकेत है कि द्विविमीय ज्यामिति का अधिकांश अतिरिक्त अक्ष के बाद भी सही-सलामत बचता है। दिक्-अनुपात अद्वितीय नहीं — 2, 4, 4 वही दिशा बताता है — और इस लंबाई से भाग देना ही उन्हें दिक्-कोसाइन बनाता है। (5 अनुपात जोड़ देता है।)",
          mr: "√(1 + 4 + 4) = √9 = 3. पायथागोरस तीन मितींपर्यंत पसरतो, तिसरा वर्ग जोडला जातो आणि दुसरे काही बदलत नाही, आणि हाच पहिला संकेत आहे की द्विमितीय भूमितीचा बहुतांश भाग अतिरिक्त अक्षानंतरही अबाधित टिकतो. दिक्-गुणोत्तरे अद्वितीय नाहीत — 2, 4, 4 तीच दिशा सांगते — आणि या लांबीने भागणेच त्यांना दिक्-कोज्या बनवते. (5 गुणोत्तरे जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "For any line, l² + m² + n² equals what, where l, m, n are its direction cosines?",
          hi: "किसी भी रेखा के लिए l² + m² + n² किसके बराबर है, जहाँ l, m, n उसके दिक्-कोसाइन हैं?",
          mr: "कोणत्याही रेषेसाठी l² + m² + n² कशाइतके आहे, जिथे l, m, n हे तिचे दिक्-कोज्या आहेत?",
        },
        answer: 1,
        wrong: [0, 3, 2],
        checkExpr: "3-2",
        solution: {
          en: "1, always. Direction cosines are the components of a UNIT vector along the line, so the sum of their squares is the square of its length, which is 1. This is the standard sanity check in the chapter: any three numbers offered as direction cosines whose squares do not add to 1 are direction ratios that have not been normalised yet. (3 counts the cosines instead of summing their squares.)",
          hi: "1, हमेशा। दिक्-कोसाइन रेखा के साथ किसी एकक सदिश के घटक हैं, अतः उनके वर्गों का योग उसकी लंबाई का वर्ग है, जो 1 है। यही अध्याय की मानक जाँच है: दिक्-कोसाइन के रूप में पेश की गई कोई भी तीन संख्याएँ जिनके वर्ग 1 नहीं जुड़ते, वे ऐसे दिक्-अनुपात हैं जिन्हें अभी सामान्यीकृत नहीं किया गया। (3 उनके वर्गों को जोड़ने के बजाय कोसाइन गिन लेता है।)",
          mr: "1, नेहमी. दिक्-कोज्या हे रेषेसोबतच्या एका एकक सदिशाचे घटक आहेत, म्हणून त्यांच्या वर्गांची बेरीज त्याच्या लांबीचा वर्ग आहे, जो 1 आहे. हीच अध्यायातील प्रमाण तपासणी आहे: दिक्-कोज्या म्हणून दिलेल्या कोणत्याही तीन संख्या ज्यांचे वर्ग 1 होत नाहीत, ती अशी दिक्-गुणोत्तरे आहेत जी अजून प्रमाणित केलेली नाहीत. (3 त्यांचे वर्ग बेरीज करण्याऐवजी कोज्या मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "How many coordinates are needed to locate a point in space?",
          hi: "समष्टि में किसी बिंदु को स्थित करने के लिए कितने निर्देशांक चाहिए?",
          mr: "अवकाशात एखादा बिंदू निश्चित करण्यास किती निर्देशांक लागतात?",
        },
        answer: 3,
        wrong: [2, 1, 4],
        checkExpr: "2+1",
        solution: {
          en: "Three. Counting how many numbers an object needs is a habit worth starting here, because it will do real work later: a point needs three, a plane's equation needs four coefficients of which only three are independent, and a line — surprisingly — needs four. Getting into the habit of counting parameters is how one predicts in advance whether a problem has enough conditions to have a unique answer. (2 counts the plane instead of space.)",
          hi: "तीन। किसी वस्तु को कितनी संख्याएँ चाहिए यह गिनना यहीं से शुरू करने लायक़ आदत है, क्योंकि आगे वह असली काम करेगी: बिंदु को तीन चाहिए, समतल के समीकरण को चार गुणांक चाहिए जिनमें से केवल तीन स्वतंत्र हैं, और रेखा को — आश्चर्यजनक रूप से — चार। प्राचल गिनने की आदत डालना ही वह तरीक़ा है जिससे पहले से भाँपा जाता है कि किसी समस्या में अद्वितीय उत्तर के लिए पर्याप्त शर्तें हैं या नहीं। (2 समष्टि के बजाय समतल गिन लेता है।)",
          mr: "तीन. एखाद्या वस्तूला किती संख्या लागतात हे मोजणे ही इथूनच सुरू करण्याजोगी सवय आहे, कारण पुढे ती खरे काम करेल: बिंदूला तीन लागतात, प्रतलाच्या समीकरणाला चार गुणांक लागतात ज्यांपैकी केवळ तीन स्वतंत्र आहेत, आणि रेषेला — आश्चर्यकारकरीत्या — चार. प्राचल मोजण्याची सवय लावणे हाच तो मार्ग आहे ज्याने आधीच ओळखता येते की एखाद्या समस्येत अद्वितीय उत्तरासाठी पुरेशा अटी आहेत का. (2 अवकाशाऐवजी प्रतल मोजते.)",
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
          en: "The plane 2x + 3y + 6z = 7 has a normal vector. What is that vector's magnitude?",
          hi: "समतल 2x + 3y + 6z = 7 का एक अभिलंब सदिश है। उस सदिश का परिमाण क्या है?",
          mr: "प्रतल 2x + 3y + 6z = 7 चा एक अभिलंब सदिश आहे. त्या सदिशाचे परिमाण किती?",
        },
        answer: 7,
        wrong: [11, 49, 6],
        checkExpr: "49^0.5",
        solution: {
          en: "The coefficients 2, 3, 6 ARE the normal vector, and √(4 + 9 + 36) = √49 = 7. That the coefficients give the normal is the single most useful fact about the plane equation, and it makes several later formulas obvious rather than memorised — the angle between two planes is the angle between their normals, and two planes are parallel exactly when their coefficient triples are proportional. Note the 7 on the right-hand side is a coincidence here and plays no part; changing it slides the plane without turning it. (11 adds the coefficients.)",
          hi: "गुणांक 2, 3, 6 ही अभिलंब सदिश हैं, और √(4 + 9 + 36) = √49 = 7. गुणांकों का अभिलंब देना समतल-समीकरण के बारे में सबसे उपयोगी अकेला तथ्य है, और वह आगे के कई सूत्रों को रटा हुआ नहीं बल्कि स्पष्ट बना देता है — दो समतलों के बीच का कोण उनके अभिलंबों के बीच का कोण है, और दो समतल ठीक तभी समांतर हैं जब उनके गुणांक-त्रिक समानुपाती हों। ध्यान दो कि दाईं ओर का 7 यहाँ संयोग है और उसका कोई हाथ नहीं; उसे बदलने पर समतल बिना मुड़े सरक जाता है। (11 गुणांक जोड़ देता है।)",
          mr: "गुणांक 2, 3, 6 हेच अभिलंब सदिश आहेत, आणि √(4 + 9 + 36) = √49 = 7. गुणांकांनी अभिलंब देणे हे प्रतल-समीकरणाबद्दलचे सर्वांत उपयुक्त एकटे तथ्य आहे, आणि ते पुढील अनेक सूत्रे पाठ केलेली नव्हे तर स्पष्ट बनवते — दोन प्रतलांमधील कोन म्हणजे त्यांच्या अभिलंबांमधील कोन, आणि दोन प्रतले नेमकी तेव्हाच समांतर आहेत जेव्हा त्यांची गुणांक-त्रिके समानुपाती असतील. लक्षात घ्या की उजवीकडचा 7 इथे योगायोग आहे आणि त्याचा काहीच हात नाही; तो बदलल्यास प्रतल न वळता सरकते. (11 गुणांक जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Two lines in space have direction vectors i + j and 2i + 2j. How many directions do they have between them?",
          hi: "समष्टि में दो रेखाओं के दिक्-सदिश i + j और 2i + 2j हैं। उनके बीच कितनी दिशाएँ हैं?",
          mr: "अवकाशातील दोन रेषांचे दिक्-सदिश i + j आणि 2i + 2j आहेत. त्यांच्यात किती दिशा आहेत?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        checkExpr: "2-1",
        solution: {
          en: "One. The second vector is exactly twice the first, so the two lines point the same way and the count of distinct directions is 1. Note carefully what this does and does not settle: the lines are parallel, but that says nothing about whether they coincide, since two parallel lines may sit anywhere in space relative to one another. Direction is one question, position is another, and every classification in this chapter needs both answered. (2 counts the vectors rather than the directions.)",
          hi: "एक। दूसरा सदिश ठीक पहले का दुगना है, अतः दोनों रेखाएँ एक ही ओर इंगित करती हैं और भिन्न दिशाओं की गिनती 1 है। ध्यान से देखो कि यह क्या तय करता है और क्या नहीं: रेखाएँ समांतर हैं, पर इससे यह कुछ नहीं कहा गया कि वे संपाती हैं या नहीं, क्योंकि दो समांतर रेखाएँ एक-दूसरे के सापेक्ष समष्टि में कहीं भी बैठ सकती हैं। दिशा एक प्रश्न है, स्थिति दूसरा, और इस अध्याय के हर वर्गीकरण को दोनों के उत्तर चाहिए। (2 दिशाओं के बजाय सदिश गिन लेता है।)",
          mr: "एक. दुसरा सदिश नेमका पहिल्याच्या दुप्पट आहे, म्हणून दोन्ही रेषा एकाच दिशेला निर्देश करतात आणि भिन्न दिशांची मोजणी 1 आहे. काळजीपूर्वक पाहा की हे काय ठरवते आणि काय नाही: रेषा समांतर आहेत, पण त्यातून त्या एकरूप आहेत का याबद्दल काहीच सांगितले नाही, कारण दोन समांतर रेषा एकमेकींच्या सापेक्ष अवकाशात कुठेही बसू शकतात. दिशा हा एक प्रश्न आहे, स्थान दुसरा, आणि या अध्यायातील प्रत्येक वर्गीकरणाला दोन्हींची उत्तरे लागतात. (2 दिशांऐवजी सदिश मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "What is the distance from the origin to the point (1, 2, 2)?",
          hi: "मूलबिंदु से बिंदु (1, 2, 2) तक की दूरी क्या है?",
          mr: "आदिबिंदूपासून बिंदू (1, 2, 2) पर्यंतचे अंतर किती?",
        },
        answer: 3,
        wrong: [5, 4, 6],
        checkExpr: "9^0.5",
        solution: {
          en: "√(1 + 4 + 4) = 3. The three-dimensional distance formula is the two-dimensional one with a third term, and the reason is worth seeing once: apply Pythagoras in the base plane to get √(1 + 4), then apply it again in the vertical triangle whose legs are that result and the height 2. Two applications of a two-dimensional theorem give the three-dimensional one, and the same trick extends to any number of dimensions. (5 adds the coordinates.)",
          hi: "√(1 + 4 + 4) = 3. त्रिविमीय दूरी-सूत्र वही द्विविमीय है जिसमें एक तीसरा पद जुड़ा, और कारण एक बार देख लेना ज़रूरी है: आधार-समतल में पाइथागोरस लगाकर √(1 + 4) पाओ, फिर उस ऊर्ध्वाधर त्रिभुज में दोबारा लगाओ जिसकी भुजाएँ वह परिणाम और ऊँचाई 2 हैं। द्विविमीय प्रमेय के दो प्रयोग त्रिविमीय दे देते हैं, और वही चाल कितनी भी विमाओं तक फैलती है। (5 निर्देशांक जोड़ देता है।)",
          mr: "√(1 + 4 + 4) = 3. त्रिमितीय अंतर-सूत्र म्हणजे तेच द्विमितीय ज्यात तिसरे पद जोडले, आणि कारण एकदा पाहणे आवश्यक आहे: आधार-प्रतलात पायथागोरस लावून √(1 + 4) मिळवा, मग त्या उभ्या त्रिकोणात पुन्हा लावा ज्याच्या बाजू तो निकाल आणि उंची 2 आहेत. द्विमितीय प्रमेयाचे दोन उपयोग त्रिमितीय देतात, आणि तीच युक्ती कितीही मितींपर्यंत पसरते. (5 निर्देशांक जोडते.)",
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
          en: "Two lines in space are neither parallel nor intersecting. How many points do they have in common?",
          hi: "समष्टि में दो रेखाएँ न समांतर हैं न प्रतिच्छेदी। उनमें कितने बिंदु साझा हैं?",
          mr: "अवकाशातील दोन रेषा ना समांतर आहेत ना छेदणाऱ्या. त्यांच्यात किती बिंदू सामायिक आहेत?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        checkExpr: "1-1",
        solution: {
          en: "None — such lines are called skew, and they are the genuinely new thing this chapter brings. In a plane, two lines that are not parallel MUST meet; there is nowhere else for them to go. In space there is somewhere else: one line can pass over the other at a different height, sharing no point and pointing in a different direction. Two straight edges of a room's ceiling and floor, running crosswise, are skew. The implication is that the two-dimensional classification of a pair of lines — parallel or intersecting — is incomplete in three dimensions, and forgetting the third case is how one ends up trying to solve for an intersection point that does not exist. (1 assumes non-parallel lines must meet, which is a two-dimensional habit.)",
          hi: "कोई नहीं — ऐसी रेखाओं को विषमतलीय कहते हैं, और वे इस अध्याय की सचमुच नई चीज़ हैं। किसी समतल में, दो रेखाएँ जो समांतर नहीं हैं उन्हें मिलना ही होगा; उनके जाने को और कोई जगह नहीं। समष्टि में और जगह है: एक रेखा दूसरी के ऊपर से भिन्न ऊँचाई पर गुज़र सकती है, कोई बिंदु साझा न करते हुए और भिन्न दिशा में इंगित करते हुए। किसी कमरे की छत और फ़र्श के दो सीधे किनारे, आड़े-तिरछे चलते हुए, विषमतलीय हैं। निहितार्थ यह है कि रेखाओं की जोड़ी का द्विविमीय वर्गीकरण — समांतर या प्रतिच्छेदी — तीन विमाओं में अधूरा है, और तीसरा मामला भूल जाना ही वह तरीक़ा है जिससे कोई ऐसे प्रतिच्छेद-बिंदु के लिए हल करने बैठ जाता है जो है ही नहीं। (1 मान लेता है कि असमांतर रेखाओं को मिलना ही होगा, जो द्विविमीय आदत है।)",
          mr: "एकही नाही — अशा रेषांना विषमप्रतलीय म्हणतात, आणि त्या या अध्यायाची खरोखर नवी गोष्ट आहेत. एखाद्या प्रतलात, ज्या दोन रेषा समांतर नाहीत त्यांना भेटावेच लागते; त्यांना जाण्यासाठी दुसरी जागा नाही. अवकाशात दुसरी जागा आहे: एक रेषा दुसरीच्या वरून वेगळ्या उंचीवर जाऊ शकते, कोणताही बिंदू सामायिक न करता आणि वेगळ्या दिशेला निर्देश करत. एखाद्या खोलीच्या छताच्या आणि जमिनीच्या दोन सरळ कडा, आडव्या चालत, विषमप्रतलीय आहेत. निहितार्थ हा की रेषांच्या जोडीचे द्विमितीय वर्गीकरण — समांतर वा छेदणाऱ्या — तीन मितींत अपूर्ण आहे, आणि तिसरा प्रसंग विसरणे हाच तो मार्ग आहे ज्याने कोणी अस्तित्वातच नसलेल्या छेदनबिंदूसाठी सोडवायला बसतो. (1 गृहीत धरते की असमांतर रेषांना भेटावेच लागते, जी द्विमितीय सवय आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "The angle between two planes with normals i and j is how many degrees?",
          hi: "अभिलंब i और j वाले दो समतलों के बीच का कोण कितने अंश है?",
          mr: "अभिलंब i आणि j असलेल्या दोन प्रतलांमधील कोन किती अंश आहे?",
        },
        answer: 90,
        wrong: [0, 45, 180],
        checkExpr: "45*2",
        solution: {
          en: "90 degrees, since the normals are perpendicular and the angle between two planes is defined as the angle between their normals. That definition is worth pausing on, because it is a choice and not an inevitability: two planes meet along a line, and one could imagine measuring the opening between them in some other way. Using the normals works because it reduces a question about two-dimensional surfaces to a question about two arrows, which the dot product already answers. Reducing a hard object to a vector that determines it is the recurring move of the whole chapter — planes become normals, lines become direction vectors. (0 answers as though perpendicular normals meant coincident planes.)",
          hi: "90 अंश, क्योंकि अभिलंब लंबवत हैं और दो समतलों के बीच का कोण उनके अभिलंबों के बीच के कोण से परिभाषित है। उस परिभाषा पर ठहरना ज़रूरी है, क्योंकि वह चुनाव है, अनिवार्यता नहीं: दो समतल एक रेखा के अनुदिश मिलते हैं, और कोई उनके बीच की खुलावट किसी और तरीक़े से मापने की कल्पना कर सकता है। अभिलंब बरतना इसलिए चलता है क्योंकि वह द्विविमीय पृष्ठों के प्रश्न को दो तीरों के प्रश्न में घटा देता है, जिसका उत्तर अदिश गुणनफल पहले से देता है। किसी कठिन वस्तु को उसे तय करने वाले सदिश तक घटाना पूरे अध्याय की बार-बार दोहराई जाने वाली चाल है — समतल अभिलंब बन जाते हैं, रेखाएँ दिक्-सदिश। (0 ऐसे उत्तर देता है मानो लंबवत अभिलंबों का अर्थ संपाती समतल हो।)",
          mr: "90 अंश, कारण अभिलंब लंब आहेत आणि दोन प्रतलांमधील कोन त्यांच्या अभिलंबांमधील कोनाने परिभाषित आहे. त्या व्याख्येवर थांबणे आवश्यक आहे, कारण ती निवड आहे, अपरिहार्यता नाही: दोन प्रतले एका रेषेच्या बाजूने भेटतात, आणि कोणी त्यांच्यातील उघड दुसऱ्या मार्गाने मोजण्याची कल्पना करू शकतो. अभिलंब वापरणे यासाठी चालते कारण ते द्विमितीय पृष्ठांचा प्रश्न दोन बाणांच्या प्रश्नात घटवते, ज्याचे उत्तर अदिश गुणाकार आधीच देतो. एखाद्या कठीण वस्तूला ती ठरवणाऱ्या सदिशापर्यंत घटवणे ही अख्ख्या अध्यायाची वारंवार येणारी चाल आहे — प्रतले अभिलंब बनतात, रेषा दिक्-सदिश. (0 असे उत्तर देते जणू लंब अभिलंबांचा अर्थ एकरूप प्रतले असावा.)",
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
          en: "How many ways can two distinct lines in three-dimensional space be related to each other?",
          hi: "त्रिविमीय समष्टि में दो भिन्न रेखाएँ एक-दूसरे से कितने प्रकार से संबंधित हो सकती हैं?",
          mr: "त्रिमितीय अवकाशात दोन भिन्न रेषा एकमेकींशी किती प्रकारे संबंधित असू शकतात?",
        },
        answer: 3,
        wrong: [2, 4, 1],
        checkExpr: "2+1",
        solution: {
          en: "Three: parallel, intersecting, or skew. The count is the point, because in a plane the answer is 2, and the extra case is exactly what the third dimension buys. It is worth seeing why these three exhaust the possibilities. Ask two questions: do the lines share a direction, and do they share a point? Sharing a direction and a point means they coincide, which the word 'distinct' excludes. Sharing a direction but no point is parallel. Sharing a point but not a direction is intersecting. Sharing neither is skew — and in a plane this last case is empty, because two lines with different directions in a plane are forced to meet. So the classification is a two-by-two table with one cell excluded by the question and one cell that only three dimensions can fill. Building the table rather than recalling the list is what makes the count reliable. (2 gives the two-dimensional answer.)",
          hi: "तीन: समांतर, प्रतिच्छेदी, या विषमतलीय। गिनती ही मुद्दा है, क्योंकि समतल में उत्तर 2 है, और अतिरिक्त मामला ठीक वही है जो तीसरी विमा ख़रीदती है। यह देखना ज़रूरी है कि ये तीन संभावनाओं को क्यों चुका देते हैं। दो प्रश्न पूछो: क्या रेखाएँ दिशा साझा करती हैं, और क्या वे बिंदु साझा करती हैं? दिशा और बिंदु दोनों साझा करने का अर्थ है वे संपाती हैं, जिसे 'भिन्न' शब्द बाहर कर देता है। दिशा साझा पर बिंदु नहीं, यह समांतर है। बिंदु साझा पर दिशा नहीं, यह प्रतिच्छेदी है। कुछ भी साझा नहीं, यह विषमतलीय है — और समतल में यह आख़िरी मामला ख़ाली है, क्योंकि समतल में भिन्न दिशाओं वाली दो रेखाएँ मिलने को मजबूर हैं। अतः वर्गीकरण दो-गुणा-दो की सारणी है जिसका एक ख़ाना प्रश्न ने बाहर किया और एक ख़ाना केवल तीन विमाएँ भर सकती हैं। सूची याद करने के बजाय सारणी बनाना ही गिनती को भरोसेमंद बनाता है। (2 द्विविमीय उत्तर देता है।)",
          mr: "तीन: समांतर, छेदणाऱ्या, किंवा विषमप्रतलीय. मोजणीच मुद्दा आहे, कारण प्रतलात उत्तर 2 आहे, आणि अतिरिक्त प्रसंग नेमका तोच आहे जो तिसरी मिती विकत घेते. हे पाहणे आवश्यक आहे की या तिघांनी शक्यता का संपतात. दोन प्रश्न विचारा: रेषा दिशा सामायिक करतात का, आणि त्या बिंदू सामायिक करतात का? दिशा आणि बिंदू दोन्ही सामायिक करणे म्हणजे त्या एकरूप आहेत, ज्याला 'भिन्न' हा शब्द वगळतो. दिशा सामायिक पण बिंदू नाही, हे समांतर आहे. बिंदू सामायिक पण दिशा नाही, हे छेदणारे आहे. काहीच सामायिक नाही, हे विषमप्रतलीय आहे — आणि प्रतलात हा शेवटचा प्रसंग रिकामा आहे, कारण प्रतलात वेगळ्या दिशांच्या दोन रेषा भेटण्यास भाग पडतात. म्हणून वर्गीकरण दोन-गुणिले-दोन तक्ता आहे ज्याचा एक कप्पा प्रश्नाने वगळला आणि एक कप्पा केवळ तीन मिती भरू शकतात. यादी आठवण्याऐवजी तक्ता बांधणेच मोजणी विश्वासार्ह बनवते. (2 द्विमितीय उत्तर देते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A plane is fixed by three coefficients and a constant, but scaling the whole equation changes nothing. How many independent numbers determine a plane in space?",
          hi: "कोई समतल तीन गुणांकों और एक अचर से तय होता है, पर पूरे समीकरण को स्केल करने से कुछ नहीं बदलता। समष्टि में समतल को कितनी स्वतंत्र संख्याएँ तय करती हैं?",
          mr: "एखादे प्रतल तीन गुणांक आणि एका अचलाने ठरते, पण अख्खे समीकरण प्रमाणित केल्याने काहीच बदलत नाही. अवकाशात प्रतल किती स्वतंत्र संख्या ठरवतात?",
        },
        answer: 3,
        wrong: [4, 2, 1],
        checkExpr: "4-1",
        solution: {
          en: "Three. The equation ax + by + cz = d has four numbers in it, but multiplying every one of them by 5 describes exactly the same plane, so one degree of freedom is spent on a scaling that carries no geometric information. Dividing it out leaves 3. The check that this is right: three non-collinear points determine a plane, and three is what we counted. The counting habit is doing real work now, and it generalises — a line in space needs 4, which surprises most people, since a line seems simpler than a plane. The reason is that a line is the intersection of two planes, costing 3 + 3 = 6, minus the 2 degrees of freedom in sliding each plane around that same line without changing it. Whenever a description has more parameters than the object has freedom, the surplus is a redundancy in the description rather than a property of the object, and finding it is how one knows the description is not minimal. (4 counts the coefficients without noticing the scaling.)",
          hi: "तीन। समीकरण ax + by + cz = d में चार संख्याएँ हैं, पर उनमें से हर एक को 5 से गुणा करने पर ठीक वही समतल बनता है, अतः एक स्वातंत्र्य-कोटि ऐसे स्केलन पर ख़र्च होती है जो कोई ज्यामितीय जानकारी नहीं ढोता। उसे भाग देकर निकालने पर 3 बचते हैं। यह सही है इसकी जाँच: तीन असंरेख बिंदु समतल तय करते हैं, और तीन ही हमने गिना। गिनने की आदत अब असली काम कर रही है, और वह सामान्यीकृत होती है — समष्टि में रेखा को 4 चाहिए, जो ज़्यादातर लोगों को चौंकाता है, क्योंकि रेखा समतल से सरल लगती है। कारण यह है कि रेखा दो समतलों का प्रतिच्छेद है, जिसकी लागत 3 + 3 = 6 है, घटा वे 2 स्वातंत्र्य-कोटियाँ जो हर समतल को उसी रेखा के चारों ओर बिना बदले घुमाने में हैं। जब भी किसी वर्णन में वस्तु की स्वतंत्रता से अधिक प्राचल हों, अतिरिक्त वस्तु का गुण नहीं बल्कि वर्णन की अतिरेकता है, और उसे ढूँढ़ना ही वह तरीक़ा है जिससे पता चलता है कि वर्णन न्यूनतम नहीं। (4 स्केलन को देखे बिना गुणांक गिन लेता है।)",
          mr: "तीन. समीकरण ax + by + cz = d मध्ये चार संख्या आहेत, पण त्यांपैकी प्रत्येकीला 5 ने गुणल्यास नेमके तेच प्रतल बनते, म्हणून एक स्वातंत्र्य-कोटी अशा प्रमाणीकरणावर खर्च होते जे कोणतीही भूमितीय माहिती वाहत नाही. ते भागून काढल्यास 3 उरतात. हे बरोबर आहे याची तपासणी: तीन असंरेख बिंदू प्रतल ठरवतात, आणि तीनच आपण मोजले. मोजण्याची सवय आता खरे काम करत आहे, आणि ती सर्वसाधारण होते — अवकाशातील रेषेला 4 लागतात, जे बहुतेकांना चकित करते, कारण रेषा प्रतलाहून सोपी वाटते. कारण हे की रेषा दोन प्रतलांचा छेद आहे, ज्याची किंमत 3 + 3 = 6 आहे, वजा त्या 2 स्वातंत्र्य-कोटी ज्या प्रत्येक प्रतलाला त्याच रेषेभोवती न बदलता फिरवण्यात आहेत. जेव्हा जेव्हा एखाद्या वर्णनात वस्तूच्या स्वातंत्र्याहून अधिक प्राचल असतील, अधिक्य ही वस्तूचा गुणधर्म नसून वर्णनाची अतिरेकता आहे, आणि ती शोधणे हाच तो मार्ग आहे ज्याने कळते की वर्णन किमान नाही. (4 प्रमाणीकरण न पाहता गुणांक मोजते.)",
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
          en: "Two skew lines have direction vectors i and j, and the vector joining a point on one to a point on the other is 5k. What is the shortest distance between them?",
          hi: "दो विषमतलीय रेखाओं के दिक्-सदिश i और j हैं, और एक पर के बिंदु को दूसरी पर के बिंदु से जोड़ने वाला सदिश 5k है। उनके बीच न्यूनतम दूरी क्या है?",
          mr: "दोन विषमप्रतलीय रेषांचे दिक्-सदिश i आणि j आहेत, आणि एकीवरील बिंदूला दुसरीवरील बिंदूशी जोडणारा सदिश 5k आहे. त्यांमधील किमान अंतर किती?",
        },
        answer: 5,
        wrong: [0, 10, 25],
        checkExpr: "5*1",
        solution: {
          en: "5. The common perpendicular direction is i × j = k, a unit vector, and the shortest distance is the projection of the joining vector onto it: 5k·k = 5. The formula |(b − a)·(d₁ × d₂)| / |d₁ × d₂| is doing exactly this, and reading it as a projection rather than memorising it makes it hard to misapply. What deserves attention is why the shortest distance is achieved along the common perpendicular at all. Take any segment joining a point of one line to a point of the other and decompose it into a part along the common perpendicular and a part in the plane perpendicular to it. The first part is the SAME for every such segment, because sliding along either line moves you only within directions the perpendicular ignores; the second part varies and can be made zero. So the length is a fixed quantity plus something non-negative, and it is smallest when that something vanishes. That argument — split a varying quantity into a fixed piece and a controllable piece — is the general shape of a great many minimisation proofs, and it never requires calculus. (0 assumes lines that never meet must be able to get arbitrarily close, which is true of some skew pairs and not of these.)",
          hi: "5. साझा लंब की दिशा i × j = k है, एक एकक सदिश, और न्यूनतम दूरी उस पर जोड़ने वाले सदिश का प्रक्षेप है: 5k·k = 5. सूत्र |(b − a)·(d₁ × d₂)| / |d₁ × d₂| ठीक यही कर रहा है, और उसे रटने के बजाय प्रक्षेप की तरह पढ़ना उसे ग़लत लगाना कठिन बना देता है। ध्यान देने लायक़ यह है कि न्यूनतम दूरी साझा लंब के अनुदिश ही क्यों मिलती है। एक रेखा के बिंदु को दूसरी के बिंदु से जोड़ता कोई भी खंड लो और उसे साझा लंब के अनुदिश एक हिस्से और उसके लंबवत समतल में एक हिस्से में विघटित करो। पहला हिस्सा हर ऐसे खंड के लिए वही है, क्योंकि किसी भी रेखा के अनुदिश सरकने से तुम केवल उन दिशाओं में हिलते हो जिन्हें वह लंब अनदेखा करता है; दूसरा हिस्सा बदलता है और शून्य किया जा सकता है। अतः लंबाई एक नियत राशि जोड़ कुछ अऋणात्मक है, और वह तब सबसे छोटी है जब वह कुछ लुप्त हो जाए। वह तर्क — बदलती राशि को नियत टुकड़े और नियंत्रणीय टुकड़े में बाँटो — बहुत सारी न्यूनीकरण-उपपत्तियों का सामान्य आकार है, और उसे कभी कलन नहीं चाहिए। (0 मान लेता है कि कभी न मिलने वाली रेखाएँ मनचाहे पास आ सकती होंगी, जो कुछ विषमतलीय जोड़ों के लिए सच है और इनके लिए नहीं।)",
          mr: "5. सामायिक लंबाची दिशा i × j = k आहे, एक एकक सदिश, आणि किमान अंतर म्हणजे त्यावर जोडणाऱ्या सदिशाचा प्रक्षेप: 5k·k = 5. सूत्र |(b − a)·(d₁ × d₂)| / |d₁ × d₂| नेमके हेच करत आहे, आणि ते पाठ करण्याऐवजी प्रक्षेपासारखे वाचणे ते चुकीचे लावणे कठीण बनवते. लक्ष देण्याजोगे हे की किमान अंतर सामायिक लंबाच्या बाजूनेच का मिळते. एका रेषेवरील बिंदूला दुसरीवरील बिंदूशी जोडणारा कोणताही खंड घ्या आणि त्याला सामायिक लंबाच्या बाजूने एक भाग आणि त्याला लंब प्रतलात एक भाग असे विभागा. पहिला भाग प्रत्येक अशा खंडासाठी तोच आहे, कारण कोणत्याही रेषेच्या बाजूने सरकल्याने तुम्ही केवळ त्या दिशांत हलता ज्यांना तो लंब दुर्लक्षतो; दुसरा भाग बदलतो आणि शून्य करता येतो. म्हणून लांबी एक निश्चित राशी अधिक काहीतरी अऋण आहे, आणि ती तेव्हा सर्वांत लहान आहे जेव्हा ते काहीतरी लोप पावेल. तो युक्तिवाद — बदलती राशी निश्चित तुकडा आणि नियंत्रणीय तुकडा यांत विभागा — पुष्कळ किमानीकरण-सिद्धतांचा सर्वसाधारण आकार आहे, आणि त्याला कधीच कलन लागत नाही. (0 गृहीत धरते की कधीच न भेटणाऱ्या रेषा हव्या तितक्या जवळ येऊ शकत असतील, जे काही विषमप्रतलीय जोड्यांसाठी खरे आहे आणि यांच्यासाठी नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "Two planes in space are not parallel. Their intersection is a set of points. What is its dimension?",
          hi: "समष्टि में दो समतल समांतर नहीं हैं। उनका प्रतिच्छेद बिंदुओं का एक समुच्चय है। उसकी विमा क्या है?",
          mr: "अवकाशातील दोन प्रतले समांतर नाहीत. त्यांचा छेद हा बिंदूंचा संच आहे. त्याची मिती किती?",
        },
        answer: 1,
        wrong: [0, 2, 3],
        checkExpr: "3-2",
        solution: {
          en: "One — the intersection is a line. The counting argument gives it immediately: space has dimension 3, each plane equation imposes one constraint, and two independent constraints leave 3 − 2 = 1. This is worth doing carefully because the same counting predicts every case in the chapter and does so before any algebra. Three independent planes leave 3 − 3 = 0, a single point, which is why a system of three linear equations in three unknowns usually has exactly one solution. Four planes leave −1, which is not a dimension at all and is the counting's way of saying the system is over-determined and generically has no solution. And the word 'independent' is where the exceptions live: two parallel planes impose constraints that are not independent, the count of 1 does not apply, and the intersection is either empty or a whole plane. So the arithmetic is reliable exactly when the constraints are in general position, and every degenerate case in linear algebra is a failure of that assumption rather than a failure of the counting. Knowing which of the two you are looking at is most of the skill. (0 answers with the three-plane case.)",
          hi: "एक — प्रतिच्छेद एक रेखा है। गिनती का तर्क उसे तुरंत दे देता है: समष्टि की विमा 3 है, हर समतल-समीकरण एक अड़चन लगाता है, और दो स्वतंत्र अड़चनें 3 − 2 = 1 छोड़ती हैं। यह ध्यान से करने लायक़ है क्योंकि वही गिनती अध्याय के हर मामले की भविष्यवाणी करती है और किसी बीजगणित से पहले करती है। तीन स्वतंत्र समतल 3 − 3 = 0 छोड़ते हैं, एक अकेला बिंदु, इसीलिए तीन अज्ञातों में तीन रैखिक समीकरणों के तंत्र का आम तौर पर ठीक एक हल होता है। चार समतल −1 छोड़ते हैं, जो विमा है ही नहीं और गिनती का यह कहने का तरीक़ा है कि तंत्र अति-निर्धारित है और सामान्यतः उसका कोई हल नहीं। और 'स्वतंत्र' शब्द वहीं है जहाँ अपवाद रहते हैं: दो समांतर समतल ऐसी अड़चनें लगाते हैं जो स्वतंत्र नहीं, 1 की गिनती लागू नहीं होती, और प्रतिच्छेद या तो रिक्त है या पूरा समतल। अतः गणित ठीक तभी भरोसेमंद है जब अड़चनें सामान्य स्थिति में हों, और रैखिक बीजगणित का हर अपभ्रष्ट मामला गिनती की विफलता नहीं बल्कि उस मान्यता की विफलता है। इन दोनों में से किसे देख रहे हो यह जानना ही अधिकांश कौशल है। (0 तीन-समतल वाले मामले से उत्तर देता है।)",
          mr: "एक — छेद ही एक रेषा आहे. मोजणीचा युक्तिवाद ते लगेच देतो: अवकाशाची मिती 3 आहे, प्रत्येक प्रतल-समीकरण एक बंधन लादते, आणि दोन स्वतंत्र बंधने 3 − 2 = 1 सोडतात. हे काळजीपूर्वक करण्याजोगे आहे कारण तीच मोजणी अध्यायातील प्रत्येक प्रसंगाचे भाकीत करते आणि कोणत्याही बीजगणिताआधी करते. तीन स्वतंत्र प्रतले 3 − 3 = 0 सोडतात, एकच बिंदू, म्हणूनच तीन अज्ञातांतील तीन रैखिक समीकरणांच्या प्रणालीचे सर्वसाधारणपणे नेमके एक उत्तर असते. चार प्रतले −1 सोडतात, जी मितीच नाही आणि मोजणीचा हे सांगण्याचा मार्ग आहे की प्रणाली अति-निर्धारित आहे आणि सामान्यतः तिला उत्तर नाही. आणि 'स्वतंत्र' हा शब्द तिथेच आहे जिथे अपवाद राहतात: दोन समांतर प्रतले अशी बंधने लादतात जी स्वतंत्र नाहीत, 1 ची मोजणी लागू होत नाही, आणि छेद एकतर रिकामा आहे किंवा अख्खे प्रतल. म्हणून गणित नेमके तेव्हाच विश्वासार्ह आहे जेव्हा बंधने सर्वसाधारण स्थितीत असतील, आणि रैखिक बीजगणितातील प्रत्येक अपभ्रष्ट प्रसंग मोजणीचे अपयश नसून त्या गृहीतकाचे अपयश आहे. या दोहोंपैकी कशाकडे पाहत आहात हे जाणणे हेच बहुतांश कौशल्य आहे. (0 तीन-प्रतल प्रसंगाने उत्तर देते.)",
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
          en: "In a plane, two lines that are not parallel must intersect. In space they need not. Of dimensions 2, 3 and 4, in how many can two lines be skew?",
          hi: "किसी समतल में, दो रेखाएँ जो समांतर नहीं हैं उन्हें प्रतिच्छेद करना ही होगा। समष्टि में ज़रूरी नहीं। विमाओं 2, 3 और 4 में से कितनों में दो रेखाएँ विषमतलीय हो सकती हैं?",
          mr: "एखाद्या प्रतलात, ज्या दोन रेषा समांतर नाहीत त्यांना छेदावेच लागते. अवकाशात गरज नाही. मिती 2, 3 आणि 4 यांपैकी कितींत दोन रेषा विषमप्रतलीय असू शकतात?",
        },
        answer: 2,
        wrong: [1, 3, 0],
        checkExpr: "3-1",
        solution: {
          en: "Two — dimensions 3 and 4, and every dimension above. Only the plane forces non-parallel lines to meet, and the reason is a dimension count that is worth doing rather than asserting. A line in n-dimensional space is determined by a point and a direction, and asking two lines to intersect imposes conditions: the joining vector between chosen points must lie in the plane spanned by the two directions. That is n − 2 conditions, since a 2-dimensional span inside n dimensions leaves n − 2 directions to escape through. In the plane, n − 2 = 0 — there are no conditions to satisfy, so intersection is automatic and skewness is impossible. In space, n − 2 = 1, a single condition, which a randomly chosen pair of lines will fail; skew is therefore the GENERIC case and intersecting is the coincidence, which inverts the intuition most students bring from the plane. In four dimensions there are two conditions and skewness is more generic still. Three things follow that are worth carrying beyond this chapter. First, 'generic' and 'familiar' are different: intersecting lines feel like the normal case only because we learn geometry on paper. Second, counting conditions predicts behaviour in dimensions one cannot picture, which is the only reliable tool once visualisation runs out. Third, the plane is the exception rather than the template — a great deal of geometric intuition is really two-dimensional intuition, and the useful discipline is to notice which facts were theorems and which were accidents of n = 2. (1 supposes skewness is peculiar to three dimensions, reading the familiar case as the only one.)",
          hi: "दो — विमाएँ 3 और 4, और उससे ऊपर की हर विमा। केवल समतल असमांतर रेखाओं को मिलने पर मजबूर करता है, और कारण एक विमा-गणना है जिसे दावा करने के बजाय कर लेना बेहतर है। n-विमीय समष्टि में रेखा एक बिंदु और एक दिशा से तय होती है, और दो रेखाओं से प्रतिच्छेद माँगना शर्तें लगाता है: चुने गए बिंदुओं के बीच जोड़ने वाला सदिश दोनों दिशाओं से फैलाए समतल में होना चाहिए। वे n − 2 शर्तें हैं, क्योंकि n विमाओं के भीतर 2-विमीय फैलाव निकल भागने को n − 2 दिशाएँ छोड़ता है। समतल में, n − 2 = 0 — पूरी करने को कोई शर्त नहीं, अतः प्रतिच्छेद स्वतः है और विषमतलीयता असंभव। समष्टि में, n − 2 = 1, एक अकेली शर्त, जिसमें यादृच्छिक रूप से चुनी रेखाओं की जोड़ी विफल रहेगी; अतः विषमतलीय होना सामान्य मामला है और प्रतिच्छेद करना संयोग, जो उस अंतर्ज्ञान को उलट देता है जो अधिकांश विद्यार्थी समतल से लाते हैं। चार विमाओं में दो शर्तें हैं और विषमतलीयता और भी अधिक सामान्य। इस अध्याय से आगे ले जाने लायक़ तीन बातें निकलती हैं। पहली, 'सामान्य' और 'परिचित' अलग हैं: प्रतिच्छेदी रेखाएँ केवल इसलिए साधारण मामला लगती हैं क्योंकि हम ज्यामिति काग़ज़ पर सीखते हैं। दूसरी, शर्तें गिनना उन विमाओं में व्यवहार की भविष्यवाणी करता है जिनकी तस्वीर नहीं बनाई जा सकती, और दृश्यीकरण चुक जाने पर वही अकेला भरोसेमंद औज़ार है। तीसरी, समतल आदर्श नहीं बल्कि अपवाद है — बहुत सारा ज्यामितीय अंतर्ज्ञान असल में द्विविमीय अंतर्ज्ञान है, और उपयोगी अनुशासन यह देखना है कि कौन-से तथ्य प्रमेय थे और कौन-से n = 2 के संयोग। (1 मान लेता है कि विषमतलीयता तीन विमाओं की ख़ासियत है, परिचित मामले को अकेला मामला पढ़ते हुए।)",
          mr: "दोन — मिती 3 आणि 4, आणि त्यावरील प्रत्येक मिती. केवळ प्रतल असमांतर रेषांना भेटण्यास भाग पाडते, आणि कारण एक मिती-गणना आहे जी दावा करण्याऐवजी करून घेणे बरे. n-मितीय अवकाशात रेषा एका बिंदू आणि एका दिशेने ठरते, आणि दोन रेषांकडून छेद मागणे अटी लादते: निवडलेल्या बिंदूंमधील जोडणारा सदिश दोन्ही दिशांनी पसरवलेल्या प्रतलात असावा लागतो. त्या n − 2 अटी आहेत, कारण n मितींच्या आत 2-मितीय पसारा निसटण्यासाठी n − 2 दिशा सोडतो. प्रतलात, n − 2 = 0 — पूर्ण करण्यास कोणतीही अट नाही, म्हणून छेद आपोआप आहे आणि विषमप्रतलता अशक्य. अवकाशात, n − 2 = 1, एकच अट, जिच्यात यादृच्छिकपणे निवडलेली रेषांची जोडी अपयशी ठरेल; म्हणून विषमप्रतलीय असणे हा सर्वसाधारण प्रसंग आहे आणि छेदणे हा योगायोग, जे बहुतेक विद्यार्थी प्रतलातून आणतात ती अंतर्दृष्टी उलटवते. चार मितींत दोन अटी आहेत आणि विषमप्रतलता आणखी अधिक सर्वसाधारण. या अध्यायापुढे न्यायला हव्या अशा तीन गोष्टी निघतात. पहिली, 'सर्वसाधारण' आणि 'परिचित' वेगळे आहेत: छेदणाऱ्या रेषा केवळ यासाठी सामान्य प्रसंग वाटतात कारण आपण भूमिती कागदावर शिकतो. दुसरी, अटी मोजणे ज्या मितींचे चित्र काढता येत नाही त्यांतील वर्तनाचे भाकीत करते, आणि दृश्यीकरण संपल्यावर तेच एकमेव विश्वासार्ह साधन आहे. तिसरी, प्रतल हे आदर्श नसून अपवाद आहे — पुष्कळशी भूमितीय अंतर्दृष्टी प्रत्यक्षात द्विमितीय अंतर्दृष्टी आहे, आणि उपयुक्त शिस्त हे पाहणे आहे की कोणती तथ्ये प्रमेये होती आणि कोणती n = 2 चे योगायोग. (1 गृहीत धरते की विषमप्रतलता तीन मितींची खासियत आहे, परिचित प्रसंगाला एकमेव प्रसंग वाचत.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "The distance from a point to a plane uses the plane's normal, and the distance between skew lines uses the cross product of their directions. Of these two formulas, how many still make sense if the normal or the cross product is the zero vector?",
          hi: "किसी बिंदु से समतल तक की दूरी समतल के अभिलंब का उपयोग करती है, और विषमतलीय रेखाओं के बीच की दूरी उनकी दिशाओं के सदिश गुणनफल का। इन दो सूत्रों में से यदि अभिलंब या सदिश गुणनफल शून्य सदिश हो तो कितने अब भी अर्थपूर्ण रहते हैं?",
          mr: "एखाद्या बिंदूपासून प्रतलापर्यंतचे अंतर प्रतलाचा अभिलंब वापरते, आणि विषमप्रतलीय रेषांमधील अंतर त्यांच्या दिशांचा सदिश गुणाकार. या दोन सूत्रांपैकी अभिलंब वा सदिश गुणाकार शून्य सदिश असल्यास किती अजूनही अर्थपूर्ण राहतात?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        checkExpr: "2-2",
        solution: {
          en: "Neither. Both formulas divide by the magnitude of that vector, so a zero vector makes each expression undefined — and in both cases the undefinedness is honest rather than a technical annoyance, because the geometric situation has genuinely changed. If a plane's coefficients are all zero, the equation reads 0 = d, which describes either everything or nothing and is not a plane at all, so asking for a distance to it is asking about an object that does not exist. If two lines' directions have zero cross product, the lines are parallel, and parallel lines are not skew — the shortest-distance formula was derived for a common perpendicular direction that in this case is not unique, since infinitely many directions are perpendicular to both. The right answer for parallel lines exists and is perfectly well defined, but it needs a different formula, one that projects the joining vector perpendicular to the shared direction. So the count is 0, and there are two lessons in that. First, a formula's domain is part of the formula, and the places where it divides by zero are usually the places where the configuration degenerates into a different case rather than places where the mathematics fails. Second, and more practically: when a derivation produces a division, it is worth asking straight away what the divisor becoming zero would MEAN, because the answer names the exceptional case the formula quietly excluded, and that case will otherwise be discovered at the worst possible moment. Reading a formula for what it cannot handle is a faster route to understanding it than reading it for what it computes. (2 assumes that a formula written in full generality applies in full generality.)",
          hi: "कोई नहीं। दोनों सूत्र उस सदिश के परिमाण से भाग देते हैं, अतः शून्य सदिश हर व्यंजक को अपरिभाषित कर देता है — और दोनों मामलों में अपरिभाषितता तकनीकी झंझट नहीं बल्कि ईमानदार है, क्योंकि ज्यामितीय स्थिति सचमुच बदल गई है। यदि समतल के गुणांक सब शून्य हों, तो समीकरण 0 = d पढ़ता है, जो या तो सब कुछ बताता है या कुछ नहीं और समतल है ही नहीं, अतः उससे दूरी पूछना ऐसी वस्तु के बारे में पूछना है जो मौजूद नहीं। यदि दो रेखाओं की दिशाओं का सदिश गुणनफल शून्य हो, तो रेखाएँ समांतर हैं, और समांतर रेखाएँ विषमतलीय नहीं — न्यूनतम-दूरी सूत्र ऐसी साझा लंब दिशा के लिए निकाला गया था जो इस मामले में अद्वितीय नहीं, क्योंकि अनंत दिशाएँ दोनों के लंबवत हैं। समांतर रेखाओं का सही उत्तर मौजूद है और बिलकुल सुपरिभाषित है, पर उसे भिन्न सूत्र चाहिए, ऐसा जो जोड़ने वाले सदिश को साझा दिशा के लंबवत प्रक्षेपित करे। अतः गिनती 0 है, और उसमें दो सबक़ हैं। पहला, किसी सूत्र का प्रांत सूत्र का हिस्सा है, और जहाँ वह शून्य से भाग देता है वे आम तौर पर वे जगहें हैं जहाँ विन्यास किसी भिन्न मामले में अपभ्रष्ट हो जाता है, न कि वे जगहें जहाँ गणित विफल होता है। दूसरा, और अधिक व्यावहारिक: जब कोई व्युत्पत्ति भाग पैदा करे, तो तुरंत यह पूछना ठीक है कि भाजक का शून्य होना क्या अर्थ रखेगा, क्योंकि उत्तर उस अपवादी मामले का नाम लेता है जिसे सूत्र ने चुपचाप बाहर रखा, और वह मामला वरना सबसे बुरे संभव क्षण में खोजा जाएगा। किसी सूत्र को इसके लिए पढ़ना कि वह क्या नहीं सँभाल सकता, उसे समझने का उससे तेज़ रास्ता है कि वह क्या गणित करता है। (2 मान लेता है कि पूरी व्यापकता में लिखा सूत्र पूरी व्यापकता में लागू होता है।)",
          mr: "एकही नाही. दोन्ही सूत्रे त्या सदिशाच्या परिमाणाने भागतात, म्हणून शून्य सदिश प्रत्येक पदावली अपरिभाषित करतो — आणि दोन्ही प्रसंगांत अपरिभाषितता ही तांत्रिक कटकट नसून प्रामाणिक आहे, कारण भूमितीय परिस्थिती खरोखर बदलली आहे. जर प्रतलाचे गुणांक सर्व शून्य असतील, तर समीकरण 0 = d वाचते, जे एकतर सर्वकाही सांगते वा काहीच नाही आणि प्रतल नाहीच, म्हणून त्यापासूनचे अंतर विचारणे म्हणजे अस्तित्वात नसलेल्या वस्तूबद्दल विचारणे. जर दोन रेषांच्या दिशांचा सदिश गुणाकार शून्य असेल, तर रेषा समांतर आहेत, आणि समांतर रेषा विषमप्रतलीय नाहीत — किमान-अंतर सूत्र अशा सामायिक लंब दिशेसाठी काढले होते जी या प्रसंगात अद्वितीय नाही, कारण अनंत दिशा दोन्हींना लंब आहेत. समांतर रेषांचे बरोबर उत्तर अस्तित्वात आहे आणि अगदी सुपरिभाषित आहे, पण त्याला वेगळे सूत्र लागते, असे जे जोडणाऱ्या सदिशाला सामायिक दिशेला लंब प्रक्षेपित करेल. म्हणून मोजणी 0 आहे, आणि त्यात दोन धडे आहेत. पहिला, एखाद्या सूत्राचा प्रांत हा सूत्राचा भाग आहे, आणि जिथे ते शून्याने भागते त्या सर्वसाधारणपणे त्या जागा आहेत जिथे मांडणी वेगळ्या प्रसंगात अपभ्रष्ट होते, गणित अपयशी होणाऱ्या जागा नव्हे. दुसरा, आणि अधिक व्यावहारिक: जेव्हा एखादी व्युत्पत्ती भागाकार निर्माण करते, तेव्हा लगेच हे विचारणे बरे की भाजक शून्य होणे काय अर्थ ठेवेल, कारण उत्तर त्या अपवादात्मक प्रसंगाचे नाव घेते जो सूत्राने गुपचूप वगळला, आणि तो प्रसंग अन्यथा सर्वांत वाईट शक्य क्षणी सापडेल. एखादे सूत्र ते काय हाताळू शकत नाही यासाठी वाचणे, ते काय काढते यासाठी वाचण्याहून ते समजण्याचा वेगवान मार्ग आहे. (2 गृहीत धरते की पूर्ण व्यापकतेत लिहिलेले सूत्र पूर्ण व्यापकतेत लागू होते.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-three-dimensional-geometry",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 11 — Three Dimensional Geometry",
      name: "Three Dimensional Geometry",
      summary:
        "What the third axis adds and what it takes away: why two lines that are not parallel are no longer forced to meet, why the new case is the ordinary one and intersecting is the coincidence, why counting conditions predicts a line needs four numbers and a plane only three, and why the places these formulas divide by zero are the places the geometry has quietly become a different problem.",
      position: 11,
      translations: {
        hi: {
          name: "त्रिविमीय ज्यामिति",
          summary:
            "तीसरा अक्ष क्या जोड़ता है और क्या छीन लेता है: असमांतर दो रेखाएँ अब मिलने को मजबूर क्यों नहीं, नया मामला ही साधारण क्यों है और प्रतिच्छेद करना संयोग, शर्तें गिनना यह क्यों बताता है कि रेखा को चार संख्याएँ चाहिए और समतल को केवल तीन, और ये सूत्र जहाँ शून्य से भाग देते हैं वहीं ज्यामिति चुपचाप भिन्न समस्या क्यों बन चुकी होती है।",
        },
        mr: {
          name: "त्रिमितीय भूमिती",
          summary:
            "तिसरा अक्ष काय जोडतो आणि काय काढून घेतो: असमांतर दोन रेषा आता भेटण्यास भाग का पडत नाहीत, नवा प्रसंगच सामान्य का आहे आणि छेदणे योगायोग, अटी मोजणे हे का सांगते की रेषेला चार संख्या लागतात आणि प्रतलाला केवळ तीन, आणि ही सूत्रे जिथे शून्याने भागतात तिथेच भूमिती गुपचूप वेगळी समस्या का बनलेली असते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 12 — Linear Programming (why finitely many corners are enough)     */
/* ------------------------------------------------------------------------- */
function linearProgramming12(): TopicFileOut {
  const rand = rng("maths-12-linear-programming");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "Maximise Z = 3x + 2y at the corner point (4, 1). What is Z there?",
          hi: "कोने के बिंदु (4, 1) पर Z = 3x + 2y का मान क्या है?",
          mr: "कोपऱ्याच्या बिंदू (4, 1) वर Z = 3x + 2y चे मूल्य किती?",
        },
        answer: 14,
        wrong: [5, 12, 7],
        checkExpr: "3*4+2*1",
        solution: {
          en: "3(4) + 2(1) = 12 + 2 = 14. Evaluating the objective at a point is the whole arithmetic of this chapter; everything else is deciding WHICH points to evaluate it at. (5 adds the coordinates and ignores the coefficients.)",
          hi: "3(4) + 2(1) = 12 + 2 = 14. किसी बिंदु पर उद्देश्य-फलन का मान निकालना इस अध्याय का पूरा गणित है; बाक़ी सब यह तय करना है कि उसे किन बिंदुओं पर निकालें। (5 निर्देशांक जोड़ देता है और गुणांक अनदेखे करता है।)",
          mr: "3(4) + 2(1) = 12 + 2 = 14. एखाद्या बिंदूवर उद्दिष्ट-फलनाचे मूल्य काढणे हे या अध्यायाचे अख्खे गणित आहे; बाकी सर्व हे ठरवणे आहे की ते कोणत्या बिंदूंवर काढावे. (5 निर्देशांक जोडते आणि गुणांक दुर्लक्षते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "The constraints x ≥ 0, y ≥ 0, x + y ≤ 4 make a triangle. How many corner points does it have?",
          hi: "अड़चनें x ≥ 0, y ≥ 0, x + y ≤ 4 एक त्रिभुज बनाती हैं। उसके कितने कोने-बिंदु हैं?",
          mr: "बंधने x ≥ 0, y ≥ 0, x + y ≤ 4 एक त्रिकोण बनवतात. त्याचे किती कोपरा-बिंदू आहेत?",
        },
        answer: 3,
        wrong: [4, 2, 6],
        checkExpr: "4-1",
        solution: {
          en: "Three — (0, 0), (4, 0) and (0, 4). Each corner is where two of the boundary lines cross, and three constraints in general position give three crossings inside the region. Counting the corners before doing any evaluation tells you how much work the problem is, which is a useful thing to know before starting. (4 counts the constraints, forgetting that one of the three pairwise crossings can lie outside.)",
          hi: "तीन — (0, 0), (4, 0) और (0, 4). हर कोना वहाँ है जहाँ दो सीमा-रेखाएँ कटती हैं, और सामान्य स्थिति में तीन अड़चनें क्षेत्र के भीतर तीन कटान देती हैं। कोई मान निकालने से पहले कोने गिन लेना बताता है कि समस्या में कितना काम है, और शुरू करने से पहले यह जानना उपयोगी है। (4 अड़चनें गिन लेता है, यह भूलकर कि तीनों जोड़ीदार कटानों में से एक बाहर पड़ सकती है।)",
          mr: "तीन — (0, 0), (4, 0) आणि (0, 4). प्रत्येक कोपरा तिथे आहे जिथे दोन सीमा-रेषा छेदतात, आणि सर्वसाधारण स्थितीत तीन बंधने प्रदेशाच्या आत तीन छेद देतात. कोणतेही मूल्य काढण्याआधी कोपरे मोजणे सांगते की समस्येत किती काम आहे, आणि सुरू करण्याआधी हे जाणणे उपयुक्त आहे. (4 बंधने मोजते, हे विसरून की तिन्ही जोडीदार छेदांपैकी एक बाहेर पडू शकतो.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "In a linear programming problem, the objective function has what highest power of the variables?",
          hi: "किसी रैखिक प्रोग्रामन समस्या में उद्देश्य-फलन में चरों की उच्चतम घात क्या होती है?",
          mr: "एखाद्या रैखिक प्रोग्रामिंग समस्येत उद्दिष्ट-फलनात चलांची सर्वोच्च घात किती असते?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        checkExpr: "2-1",
        solution: {
          en: "1 — that is what 'linear' means, and it is the assumption everything else in the chapter rests on. No squares, no products of variables, no reciprocals. It is a strong restriction and it buys something remarkable in return: the guarantee that the optimum sits at a corner, which is what makes the method finite. Lose linearity and lose the guarantee. (2 assumes 'programming' implies something quadratic.)",
          hi: "1 — 'रैखिक' का यही अर्थ है, और यही वह मान्यता है जिस पर अध्याय की बाक़ी हर चीज़ टिकी है। न वर्ग, न चरों के गुणनफल, न व्युत्क्रम। यह कड़ी पाबंदी है और बदले में कुछ उल्लेखनीय ख़रीदती है: यह गारंटी कि इष्टतम किसी कोने पर बैठता है, जो विधि को परिमित बनाता है। रैखिकता खोओ और गारंटी खो दो। (2 मान लेता है कि 'प्रोग्रामन' किसी द्विघात चीज़ का संकेत है।)",
          mr: "1 — 'रैखिक' चा हाच अर्थ आहे, आणि हेच ते गृहीतक आहे ज्यावर अध्यायातील उरलेली प्रत्येक गोष्ट टिकली आहे. ना वर्ग, ना चलांचे गुणाकार, ना व्यस्त. हे कडक बंधन आहे आणि बदल्यात काहीतरी उल्लेखनीय विकत घेते: ही हमी की इष्टतम एखाद्या कोपऱ्यावर बसतो, जे पद्धत सांत बनवते. रैखिकता गमवा आणि हमी गमवा. (2 गृहीत धरते की 'प्रोग्रामिंग' म्हणजे काहीतरी द्विघाती.)",
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
          en: "Z = x + y is evaluated at (0, 0), (4, 0) and (0, 4). What is its maximum among these?",
          hi: "Z = x + y का मान (0, 0), (4, 0) और (0, 4) पर निकाला जाता है। इनमें उसका अधिकतम क्या है?",
          mr: "Z = x + y चे मूल्य (0, 0), (4, 0) आणि (0, 4) वर काढले जाते. यांत त्याची कमाल किती?",
        },
        answer: 4,
        wrong: [0, 8, 2],
        checkExpr: "4+0",
        solution: {
          en: "The values are 0, 4 and 4, so the maximum is 4 — attained at TWO different corners. That tie is worth noticing rather than passing over: when the objective's slope matches the slope of a boundary edge, every point along that whole edge gives the same value, so the optimum is not a single point but a segment. The corner-point method still finds the right VALUE, which is what was asked, but a problem answered with 'the optimum is at (4, 0)' would be reporting one of infinitely many optimal points as though it were the only one. (8 adds the two corner values.)",
          hi: "मान हैं 0, 4 और 4, अतः अधिकतम 4 है — दो अलग कोनों पर प्राप्त। उस बराबरी को टाल देने के बजाय देख लेना ज़रूरी है: जब उद्देश्य की ढाल किसी सीमा-किनारे की ढाल से मेल खाती है, तो उस पूरे किनारे का हर बिंदु वही मान देता है, अतः इष्टतम एक बिंदु नहीं बल्कि एक खंड है। कोने-बिंदु विधि तब भी सही मान ढूँढ़ लेती है, जो पूछा गया था, पर 'इष्टतम (4, 0) पर है' कहकर दिया गया उत्तर अनंत इष्टतम बिंदुओं में से एक को ऐसे बता रहा होगा मानो वही अकेला हो। (8 दोनों कोनों के मान जोड़ देता है।)",
          mr: "मूल्ये आहेत 0, 4 आणि 4, म्हणून कमाल 4 आहे — दोन वेगळ्या कोपऱ्यांवर गाठलेली. ती बरोबरी टाळण्याऐवजी पाहणे आवश्यक आहे: जेव्हा उद्दिष्टाचा उतार एखाद्या सीमा-कडेच्या उताराशी जुळतो, तेव्हा त्या अख्ख्या कडेचा प्रत्येक बिंदू तेच मूल्य देतो, म्हणून इष्टतम एक बिंदू नसून एक खंड आहे. कोपरा-बिंदू पद्धत तरीही बरोबर मूल्य शोधते, जे विचारले होते, पण 'इष्टतम (4, 0) वर आहे' असे उत्तर अनंत इष्टतम बिंदूंपैकी एकाला असे सांगत असेल जणू तोच एकमेव असावा. (8 दोन्ही कोपऱ्यांची मूल्ये जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "How many corner points does the feasible region x ≥ 0, y ≥ 0, x ≤ 3, y ≤ 2 have?",
          hi: "सुसंगत क्षेत्र x ≥ 0, y ≥ 0, x ≤ 3, y ≤ 2 के कितने कोने-बिंदु हैं?",
          mr: "सुसंगत प्रदेश x ≥ 0, y ≥ 0, x ≤ 3, y ≤ 2 चे किती कोपरा-बिंदू आहेत?",
        },
        answer: 4,
        wrong: [3, 2, 6],
        checkExpr: "2*2",
        solution: {
          en: "Four — it is a rectangle with corners (0, 0), (3, 0), (3, 2) and (0, 2). Note that four constraints gave four corners here while three constraints gave three earlier; the pattern holds when the region is bounded and no constraint is redundant. A constraint that never touches the boundary of the final region adds no corner and could have been left out, which is worth checking for, because such constraints are common in problems written from a word description. (3 counts a triangle, which is the shape the previous question had.)",
          hi: "चार — यह आयत है जिसके कोने (0, 0), (3, 0), (3, 2) और (0, 2) हैं। ध्यान दो कि यहाँ चार अड़चनों ने चार कोने दिए जबकि पहले तीन अड़चनों ने तीन; यह पैटर्न तब चलता है जब क्षेत्र परिबद्ध हो और कोई अड़चन अतिरेक न हो। जो अड़चन अंतिम क्षेत्र की सीमा को कभी छूती ही नहीं वह कोई कोना नहीं जोड़ती और उसे छोड़ा जा सकता था, और यह जाँचने लायक़ है, क्योंकि शब्द-वर्णन से लिखी समस्याओं में ऐसी अड़चनें आम हैं। (3 त्रिभुज गिन लेता है, जो पिछले प्रश्न की आकृति थी।)",
          mr: "चार — हा आयत आहे ज्याचे कोपरे (0, 0), (3, 0), (3, 2) आणि (0, 2) आहेत. लक्षात घ्या की इथे चार बंधनांनी चार कोपरे दिले तर आधी तीन बंधनांनी तीन; हा साचा तेव्हा चालतो जेव्हा प्रदेश बद्ध असेल आणि कोणतेही बंधन अतिरेकी नसेल. जे बंधन अंतिम प्रदेशाच्या सीमेला कधी स्पर्शच करत नाही ते कोणताही कोपरा जोडत नाही आणि ते वगळता आले असते, आणि हे तपासण्याजोगे आहे, कारण शब्द-वर्णनातून लिहिलेल्या समस्यांत अशी बंधने सामान्य आहेत. (3 त्रिकोण मोजते, जी मागील प्रश्नाची आकृती होती.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "A feasible region is empty. How many optimal solutions does the problem have?",
          hi: "कोई सुसंगत क्षेत्र रिक्त है। समस्या के कितने इष्टतम हल हैं?",
          mr: "एखादा सुसंगत प्रदेश रिकामा आहे. समस्येची किती इष्टतम उत्तरे आहेत?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        checkExpr: "1-1",
        solution: {
          en: "None. If no point satisfies all the constraints at once, there is nothing to optimise over and the problem is called infeasible. This is one of two ways a linear programme can fail to have an answer, and the two are worth keeping apart from the start: infeasible means the constraints contradict each other, while unbounded means they permit the objective to grow without limit. Both return no optimum, but for opposite reasons — too many restrictions against too few. (1 assumes every problem has an answer.)",
          hi: "कोई नहीं। यदि कोई बिंदु एक साथ सभी अड़चनें पूरी नहीं करता, तो इष्टतम करने को कुछ है ही नहीं और समस्या को असुसंगत कहते हैं। यह उन दो तरीक़ों में से एक है जिनसे किसी रैखिक कार्यक्रम का उत्तर नहीं होता, और दोनों को शुरू से अलग रखना ज़रूरी है: असुसंगत का अर्थ है अड़चनें एक-दूसरे का खंडन करती हैं, जबकि अपरिबद्ध का अर्थ है वे उद्देश्य को बिना सीमा बढ़ने देती हैं। दोनों कोई इष्टतम नहीं लौटाते, पर विपरीत कारणों से — बहुत अधिक पाबंदियाँ बनाम बहुत कम। (1 मान लेता है कि हर समस्या का उत्तर होता है।)",
          mr: "एकही नाही. जर कोणताही बिंदू एकाच वेळी सर्व बंधने पूर्ण करत नसेल, तर इष्टतम करण्यास काहीच नाही आणि समस्येला असुसंगत म्हणतात. हा त्या दोन मार्गांपैकी एक आहे ज्यांनी एखाद्या रैखिक कार्यक्रमाला उत्तर नसते, आणि दोन्ही सुरुवातीपासून वेगळे ठेवणे आवश्यक आहे: असुसंगत म्हणजे बंधने एकमेकांचे खंडन करतात, तर अबद्ध म्हणजे ती उद्दिष्टाला मर्यादेशिवाय वाढू देतात. दोन्ही कोणतेही इष्टतम परत करत नाहीत, पण विरुद्ध कारणांनी — फार जास्त निर्बंध विरुद्ध फार कमी. (1 गृहीत धरते की प्रत्येक समस्येला उत्तर असते.)",
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
          en: "Maximise Z = 5x + 3y over the corners (0, 0), (4, 0), (2, 3) and (0, 5). What is the maximum?",
          hi: "कोनों (0, 0), (4, 0), (2, 3) और (0, 5) पर Z = 5x + 3y अधिकतम करो। अधिकतम क्या है?",
          mr: "कोपरे (0, 0), (4, 0), (2, 3) आणि (0, 5) यांवर Z = 5x + 3y कमाल करा. कमाल किती?",
        },
        answer: 20,
        wrong: [19, 15, 25],
        checkExpr: "5*4+3*0",
        solution: {
          en: "The values are 0, 20, 19 and 15, so the maximum is 20 at (4, 0). Two things are worth taking from the numbers. First, the winner is a corner where one variable is zero, which is common and often surprises people expecting a balanced answer — linear objectives reward pushing hard in one direction rather than compromising. Second, 19 at (2, 3) is very close, and in a real problem that closeness matters: it means the optimum is not robust, and a small change in the coefficients could move it to a different corner entirely. Reporting only the winner throws away that information. (19 picks the interior-looking corner, which is the natural guess and here the runner-up.)",
          hi: "मान हैं 0, 20, 19 और 15, अतः अधिकतम 20 है, (4, 0) पर। संख्याओं से दो बातें लेने लायक़ हैं। पहली, विजेता वह कोना है जहाँ एक चर शून्य है, जो आम है और अक्सर उन्हें चौंकाता है जो संतुलित उत्तर की अपेक्षा करते हैं — रैखिक उद्देश्य समझौते के बजाय एक दिशा में ज़ोर से धकेलने का इनाम देते हैं। दूसरी, (2, 3) पर 19 बहुत पास है, और असली समस्या में वह नज़दीकी मायने रखती है: उसका अर्थ है इष्टतम मज़बूत नहीं, और गुणांकों में छोटा-सा बदलाव उसे पूरी तरह किसी दूसरे कोने पर ले जा सकता है। केवल विजेता बताना उस जानकारी को फेंक देता है। (19 भीतर-सा दिखने वाला कोना चुन लेता है, जो स्वाभाविक अनुमान है और यहाँ उपविजेता।)",
          mr: "मूल्ये आहेत 0, 20, 19 आणि 15, म्हणून कमाल 20 आहे, (4, 0) वर. संख्यांतून दोन गोष्टी घेण्याजोग्या आहेत. पहिली, विजेता तो कोपरा आहे जिथे एक चल शून्य आहे, जे सामान्य आहे आणि बऱ्याचदा संतुलित उत्तराची अपेक्षा करणाऱ्यांना चकित करते — रैखिक उद्दिष्टे तडजोडीऐवजी एका दिशेने जोरात ढकलण्याचे बक्षीस देतात. दुसरी, (2, 3) वरील 19 फार जवळ आहे, आणि खऱ्या समस्येत ती जवळीक महत्त्वाची आहे: तिचा अर्थ इष्टतम भक्कम नाही, आणि गुणांकांतील छोटासा बदल त्याला पूर्णपणे दुसऱ्या कोपऱ्यावर नेऊ शकतो. केवळ विजेता सांगणे ती माहिती फेकून देते. (19 आतल्यासारखा दिसणारा कोपरा निवडते, जो नैसर्गिक अंदाज आहे आणि इथे उपविजेता.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A feasible region is unbounded above and Z = x + y is to be maximised. How many maximum values does Z have?",
          hi: "कोई सुसंगत क्षेत्र ऊपर की ओर अपरिबद्ध है और Z = x + y अधिकतम करना है। Z के कितने अधिकतम मान हैं?",
          mr: "एखादा सुसंगत प्रदेश वरच्या दिशेने अबद्ध आहे आणि Z = x + y कमाल करायचे आहे. Z ची किती कमाल मूल्ये आहेत?",
        },
        answer: 0,
        wrong: [1, 2, 4],
        checkExpr: "2-2",
        solution: {
          en: "None. If the region runs off to infinity in a direction where x + y keeps growing, no point is the largest — for any candidate there is always a feasible point further out with a bigger value. The corner-point method would happily return the largest of the corner values, and it would be WRONG, which makes this the most dangerous failure in the chapter: the procedure produces an answer that looks like every other answer. The safeguard is a separate check, done before trusting the corner comparison — see whether the region is bounded, and if it is not, test whether the open half-plane Z > (best corner value) has any feasible point in it. Note also that the same unbounded region might have a perfectly good MINIMUM; unboundedness in one direction says nothing about the other. (1 trusts the corner-point method without checking that its hypothesis holds.)",
          hi: "कोई नहीं। यदि क्षेत्र ऐसी दिशा में अनंत तक भागता है जहाँ x + y बढ़ता रहता है, तो कोई बिंदु सबसे बड़ा नहीं — किसी भी उम्मीदवार के लिए सदा और आगे कोई सुसंगत बिंदु होगा जिसका मान बड़ा है। कोने-बिंदु विधि ख़ुशी-ख़ुशी कोनों के मानों में सबसे बड़ा लौटा देगी, और वह ग़लत होगा, जो इसे अध्याय की सबसे ख़तरनाक विफलता बनाता है: प्रक्रिया ऐसा उत्तर पैदा करती है जो हर दूसरे उत्तर जैसा दिखता है। सुरक्षा एक अलग जाँच है, जो कोनों की तुलना पर भरोसा करने से पहले की जाए — देखो कि क्षेत्र परिबद्ध है या नहीं, और यदि नहीं, तो जाँचो कि खुले अर्धसमतल Z > (सर्वोत्तम कोने का मान) में कोई सुसंगत बिंदु है या नहीं। यह भी ध्यान दो कि उसी अपरिबद्ध क्षेत्र का बिलकुल ठीक न्यूनतम हो सकता है; एक दिशा में अपरिबद्धता दूसरी के बारे में कुछ नहीं कहती। (1 यह जाँचे बिना कोने-बिंदु विधि पर भरोसा कर लेता है कि उसकी परिकल्पना लागू है या नहीं।)",
          mr: "एकही नाही. जर प्रदेश अशा दिशेने अनंतापर्यंत पळत असेल जिथे x + y वाढतच राहते, तर कोणताही बिंदू सर्वांत मोठा नाही — कोणत्याही उमेदवारासाठी नेहमी आणखी पुढे एखादा सुसंगत बिंदू असेल ज्याचे मूल्य मोठे आहे. कोपरा-बिंदू पद्धत आनंदाने कोपऱ्यांच्या मूल्यांतील सर्वांत मोठे परत करेल, आणि ते चुकीचे असेल, जे याला अध्यायातील सर्वांत धोकादायक अपयश बनवते: प्रक्रिया असे उत्तर तयार करते जे इतर प्रत्येक उत्तरासारखे दिसते. सुरक्षा ही एक वेगळी तपासणी आहे, जी कोपऱ्यांच्या तुलनेवर विश्वास ठेवण्याआधी करावी — पाहा की प्रदेश बद्ध आहे का, आणि नसल्यास तपासा की खुल्या अर्धप्रतल Z > (सर्वोत्तम कोपऱ्याचे मूल्य) मध्ये कोणताही सुसंगत बिंदू आहे का. हेही लक्षात घ्या की त्याच अबद्ध प्रदेशाची अगदी व्यवस्थित किमान असू शकते; एका दिशेतील अबद्धता दुसरीबद्दल काहीच सांगत नाही. (1 त्याचे गृहीतक लागू आहे का हे न तपासता कोपरा-बिंदू पद्धतीवर विश्वास ठेवते.)",
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
          en: "A feasible region is a convex polygon with 6 corners. To find the maximum of a linear objective, how many points must be tested?",
          hi: "कोई सुसंगत क्षेत्र 6 कोनों वाला उत्तल बहुभुज है। किसी रैखिक उद्देश्य का अधिकतम ढूँढ़ने के लिए कितने बिंदुओं की जाँच करनी होगी?",
          mr: "एखादा सुसंगत प्रदेश 6 कोपरे असलेला बहिर्वक्र बहुभुज आहे. एखाद्या रैखिक उद्दिष्टाची कमाल शोधण्यास किती बिंदू तपासावे लागतील?",
        },
        answer: 6,
        wrong: [12, 3, 1],
        checkExpr: "3*2",
        solution: {
          en: "Six — the corners, and nothing else. The corner-point theorem is what makes this possible, and its content is that an infinite search has been reduced to a finite one. Why it is true is worth seeing rather than accepting. A linear objective's level sets are parallel straight lines, and maximising means sliding that family as far as it will go while still touching the region. The last contact is at a corner, or along a whole edge if the slopes happen to match — but an edge has corners at both ends, so a corner always achieves the maximum even when it is not the only point that does. What rules out an interior point is that from any interior point one can step in the direction the objective increases and stay inside, so no interior point can be best. That last argument uses linearity twice and convexity once, and if either fails so does the theorem. (12 counts the edges as well, which the theorem never asks for.)",
          hi: "छह — कोने, और कुछ नहीं। कोने-बिंदु प्रमेय ही इसे संभव बनाता है, और उसकी सामग्री यह है कि अनंत खोज परिमित खोज में घटा दी गई है। वह सच क्यों है यह मान लेने के बजाय देख लेना ज़रूरी है। किसी रैखिक उद्देश्य के स्तर-समुच्चय समांतर सरल रेखाएँ हैं, और अधिकतम करने का अर्थ है उस कुल को जहाँ तक जा सके सरकाना, क्षेत्र को छूते हुए। आख़िरी संपर्क किसी कोने पर होता है, या पूरे किनारे के अनुदिश यदि ढालें संयोग से मेल खा जाएँ — पर किनारे के दोनों सिरों पर कोने हैं, अतः कोई कोना सदा अधिकतम प्राप्त करता है, तब भी जब वह ऐसा करने वाला अकेला बिंदु न हो। भीतरी बिंदु को जो नकारता है वह यह है कि किसी भी भीतरी बिंदु से उस दिशा में क़दम रखा जा सकता है जहाँ उद्देश्य बढ़ता है और भीतर ही रहा जा सकता है, अतः कोई भीतरी बिंदु सर्वोत्तम नहीं हो सकता। वह आख़िरी तर्क रैखिकता दो बार और उत्तलता एक बार बरतता है, और इनमें से कोई विफल हो तो प्रमेय भी। (12 किनारे भी गिन लेता है, जो प्रमेय कभी नहीं माँगता।)",
          mr: "सहा — कोपरे, आणि दुसरे काहीच नाही. कोपरा-बिंदू प्रमेयच हे शक्य करते, आणि त्याचा आशय हा की अनंत शोध सांत शोधात घटवला गेला आहे. ते खरे का आहे हे स्वीकारण्याऐवजी पाहणे आवश्यक आहे. एखाद्या रैखिक उद्दिष्टाचे स्तर-संच समांतर सरळ रेषा आहेत, आणि कमाल करणे म्हणजे ते कुळ जिथवर जाईल तिथवर सरकवणे, प्रदेशाला स्पर्श करत. शेवटचा संपर्क एखाद्या कोपऱ्यावर होतो, किंवा अख्ख्या कडेच्या बाजूने जर उतार योगायोगाने जुळले — पण कडेच्या दोन्ही टोकांवर कोपरे आहेत, म्हणून एखादा कोपरा नेहमी कमाल गाठतो, तेव्हाही जेव्हा तो तसे करणारा एकमेव बिंदू नसतो. आंतरिक बिंदूला जे नाकारते ते हे की कोणत्याही आंतरिक बिंदूपासून उद्दिष्ट वाढणाऱ्या दिशेने पाऊल टाकता येते आणि आतच राहता येते, म्हणून कोणताही आंतरिक बिंदू सर्वोत्तम असू शकत नाही. तो शेवटचा युक्तिवाद रैखिकता दोनदा आणि बहिर्वक्रता एकदा वापरतो, आणि यांपैकी काही अपयशी ठरल्यास प्रमेयही. (12 कडाही मोजते, जे प्रमेय कधीच मागत नाही.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A factory makes chairs at profit 4 and tables at profit 6, with 24 hours of labour available; a chair takes 2 hours, a table 4. Ignoring all other limits, what is the greatest profit?",
          hi: "कोई कारख़ाना 4 लाभ पर कुर्सियाँ और 6 लाभ पर मेज़ें बनाता है, 24 घंटे श्रम उपलब्ध है; कुर्सी में 2 घंटे, मेज़ में 4. बाक़ी सब सीमाएँ अनदेखी करते हुए, अधिकतम लाभ क्या है?",
          mr: "एक कारखाना 4 नफ्यावर खुर्च्या आणि 6 नफ्यावर टेबले बनवतो, 24 तास श्रम उपलब्ध आहे; खुर्चीला 2 तास, टेबलाला 4. इतर सर्व मर्यादा दुर्लक्षून, कमाल नफा किती?",
        },
        answer: 48,
        wrong: [36, 42, 24],
        checkExpr: "4*12",
        solution: {
          en: "Chairs return 4 profit per 2 hours, so 2 per hour; tables return 6 per 4 hours, so 1.5 per hour. Chairs are strictly better per hour, so all 24 hours go to chairs: 12 chairs at profit 4 gives 48. Note that no diagram was needed. With a single constraint the problem collapses to comparing profit-per-unit-of-scarce-resource, and the winner takes everything. That ratio is the shadow price idea in embryo, and it explains why real linear programmes so often produce lopsided answers: unless two activities have exactly equal returns on the binding resource, one of them is strictly better and the optimum sits at an extreme. The word 'ignoring all other limits' is carrying weight here — add a market that will only absorb 8 chairs and the answer changes completely, which is why the interesting part of these problems is always which constraints were left out. (36 makes 6 tables, the higher per-item profit, which is the trap.)",
          hi: "कुर्सियाँ 2 घंटे में 4 लाभ देती हैं, यानी 2 प्रति घंटा; मेज़ें 4 घंटे में 6, यानी 1.5 प्रति घंटा। कुर्सियाँ प्रति घंटा सख़्ती से बेहतर हैं, अतः पूरे 24 घंटे कुर्सियों को: 4 लाभ पर 12 कुर्सियाँ देती हैं 48. ध्यान दो कि किसी आरेख की ज़रूरत नहीं पड़ी। एक अकेली अड़चन के साथ समस्या दुर्लभ संसाधन की प्रति इकाई लाभ की तुलना में ढह जाती है, और विजेता सब कुछ ले जाता है। वह अनुपात छाया-मूल्य के विचार का भ्रूण है, और वह समझाता है कि असली रैखिक कार्यक्रम इतनी बार एकतरफ़ा उत्तर क्यों देते हैं: जब तक दो गतिविधियों का बाध्यकारी संसाधन पर ठीक बराबर प्रतिफल न हो, उनमें से एक सख़्ती से बेहतर है और इष्टतम किसी छोर पर बैठता है। 'बाक़ी सब सीमाएँ अनदेखी करते हुए' यहाँ भार उठा रहा है — ऐसा बाज़ार जोड़ो जो केवल 8 कुर्सियाँ खपाएगा और उत्तर पूरी तरह बदल जाता है, इसीलिए इन समस्याओं का दिलचस्प हिस्सा सदा यह है कि कौन-सी अड़चनें छोड़ी गईं। (36, 6 मेज़ें बनाता है, प्रति-वस्तु ऊँचा लाभ, जो जाल है।)",
          mr: "खुर्च्या 2 तासांत 4 नफा देतात, म्हणजे 2 प्रति तास; टेबले 4 तासांत 6, म्हणजे 1.5 प्रति तास. खुर्च्या प्रति तास काटेकोरपणे चांगल्या आहेत, म्हणून अख्खे 24 तास खुर्च्यांना: 4 नफ्यावर 12 खुर्च्या देतात 48. लक्षात घ्या की कोणत्याही आकृतीची गरज पडली नाही. एकाच बंधनासह समस्या दुर्मीळ संसाधनाच्या प्रति एकक नफ्याच्या तुलनेत कोसळते, आणि विजेता सर्वकाही घेतो. ते गुणोत्तर छाया-किमतीच्या कल्पनेचा गर्भ आहे, आणि ते स्पष्ट करते की खरे रैखिक कार्यक्रम इतक्या वेळा एकतर्फी उत्तरे का देतात: जोवर दोन क्रियांचा बंधनकारक संसाधनावर नेमका समान परतावा नसेल, तोवर त्यांपैकी एक काटेकोरपणे चांगली आहे आणि इष्टतम एखाद्या टोकावर बसतो. 'इतर सर्व मर्यादा दुर्लक्षून' हे इथे भार उचलत आहे — अशी बाजारपेठ जोडा जी केवळ 8 खुर्च्या खपवेल आणि उत्तर पूर्णपणे बदलते, म्हणूनच या समस्यांचा रोचक भाग नेहमी हा असतो की कोणती बंधने वगळली गेली. (36 हे 6 टेबले बनवते, प्रति-वस्तू जास्त नफा, जो सापळा आहे.)",
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
          en: "The corner-point theorem holds for linear objectives on convex regions. Of the two hypotheses 'objective is linear' and 'region is convex', how many can be dropped and leave the theorem true?",
          hi: "कोने-बिंदु प्रमेय उत्तल क्षेत्रों पर रैखिक उद्देश्यों के लिए लागू है। दो परिकल्पनाओं 'उद्देश्य रैखिक है' और 'क्षेत्र उत्तल है' में से कितनी छोड़ी जा सकती हैं और प्रमेय फिर भी सच रहे?",
          mr: "कोपरा-बिंदू प्रमेय बहिर्वक्र प्रदेशांवरील रैखिक उद्दिष्टांसाठी लागू आहे. 'उद्दिष्ट रैखिक आहे' आणि 'प्रदेश बहिर्वक्र आहे' या दोन गृहीतकांपैकी किती वगळता येतील आणि प्रमेय तरीही खरे राहील?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        checkExpr: "2-2",
        solution: {
          en: "Neither can be dropped, and it is instructive that each fails in a different way. Drop linearity: maximise x² + y² over the square with corners (0,0), (1,0), (1,1), (0,1) and the corner-point method still happens to work, but maximise −(x − 0.5)² − (y − 0.5)² over the same square and the maximum is at the CENTRE, an interior point no corner search would ever visit. Non-linear objectives can peak anywhere. Drop convexity: take an L-shaped region and a linear objective, and the corners still contain the maximum — because the argument that an interior point can always be improved used only linearity. But convexity was doing other work: without it the feasible set can be disconnected, so a local search that climbs to a corner can settle in the wrong component entirely, and the corner-point theorem's guarantee that testing all corners suffices survives only if one really does test ALL of them, which for a non-convex region can be a much larger and less obvious list. So the count is 0. The general lesson is about how to read a theorem's hypotheses: they are not decoration, and the way to understand what each buys is to remove it and see precisely which step of the proof stops working. Here linearity buys 'no interior maximum' and convexity buys 'the corners are few and the region is one piece', and losing either loses a different guarantee. (1 assumes one hypothesis must be redundant because the other seems to do most of the work.)",
          hi: "कोई नहीं छोड़ी जा सकती, और शिक्षाप्रद यह है कि हर एक भिन्न ढंग से विफल होती है। रैखिकता छोड़ो: कोनों (0,0), (1,0), (1,1), (0,1) वाले वर्ग पर x² + y² अधिकतम करो और कोने-बिंदु विधि संयोग से तब भी चलती है, पर उसी वर्ग पर −(x − 0.5)² − (y − 0.5)² अधिकतम करो और अधिकतम केंद्र पर है, ऐसा भीतरी बिंदु जिस पर कोई कोना-खोज कभी नहीं जाती। अरैखिक उद्देश्य कहीं भी शिखर छू सकते हैं। उत्तलता छोड़ो: L-आकार का क्षेत्र और रैखिक उद्देश्य लो, और कोनों में अधिकतम तब भी है — क्योंकि यह तर्क कि भीतरी बिंदु को सदा सुधारा जा सकता है केवल रैखिकता बरतता था। पर उत्तलता और काम कर रही थी: उसके बिना सुसंगत समुच्चय असंबद्ध हो सकता है, अतः किसी कोने तक चढ़ती स्थानीय खोज पूरी तरह ग़लत घटक में जा बैठ सकती है, और यह गारंटी कि सब कोने जाँचना काफ़ी है केवल तभी बचती है जब सचमुच सब जाँचे जाएँ, जो अनुत्तल क्षेत्र के लिए कहीं बड़ी और कम स्पष्ट सूची हो सकती है। अतः गिनती 0 है। सामान्य सबक़ यह है कि किसी प्रमेय की परिकल्पनाएँ कैसे पढ़ी जाएँ: वे सजावट नहीं, और हर एक क्या ख़रीदती है यह समझने का तरीक़ा उसे हटाकर देखना है कि उपपत्ति का कौन-सा क़दम ठीक-ठीक चलना बंद कर देता है। यहाँ रैखिकता 'कोई भीतरी अधिकतम नहीं' ख़रीदती है और उत्तलता 'कोने थोड़े हैं और क्षेत्र एक टुकड़ा है', और किसी एक को खोने पर भिन्न गारंटी खोती है। (1 मान लेता है कि एक परिकल्पना अतिरेक होगी क्योंकि दूसरी अधिकांश काम करती दिखती है।)",
          mr: "एकही वगळता येत नाही, आणि बोधप्रद हे की प्रत्येक वेगळ्या प्रकारे अपयशी होते. रैखिकता वगळा: कोपरे (0,0), (1,0), (1,1), (0,1) असलेल्या चौरसावर x² + y² कमाल करा आणि कोपरा-बिंदू पद्धत योगायोगाने तरीही चालते, पण त्याच चौरसावर −(x − 0.5)² − (y − 0.5)² कमाल करा आणि कमाल केंद्रावर आहे, असा आंतरिक बिंदू ज्यावर कोणताही कोपरा-शोध कधीच जात नाही. अरैखिक उद्दिष्टे कुठेही शिखर गाठू शकतात. बहिर्वक्रता वगळा: L-आकाराचा प्रदेश आणि रैखिक उद्दिष्ट घ्या, आणि कोपऱ्यांत कमाल तरीही आहे — कारण आंतरिक बिंदू नेहमी सुधारता येतो हा युक्तिवाद केवळ रैखिकता वापरत होता. पण बहिर्वक्रता दुसरे काम करत होती: तिच्याशिवाय सुसंगत संच असंबद्ध असू शकतो, म्हणून एखाद्या कोपऱ्यापर्यंत चढणारा स्थानिक शोध पूर्णपणे चुकीच्या घटकात स्थिरावू शकतो, आणि सर्व कोपरे तपासणे पुरेसे आहे ही हमी केवळ तेव्हाच टिकते जेव्हा खरोखर सर्व तपासले जातील, जी अबहिर्वक्र प्रदेशासाठी कितीतरी मोठी आणि कमी स्पष्ट यादी असू शकते. म्हणून मोजणी 0 आहे. सर्वसाधारण धडा हा की एखाद्या प्रमेयाची गृहीतके कशी वाचावीत: ती सजावट नाहीत, आणि प्रत्येक काय विकत घेते हे समजण्याचा मार्ग ते काढून पाहणे आहे की सिद्धतेचे कोणते पाऊल नेमके चालणे थांबवते. इथे रैखिकता 'कोणतीही आंतरिक कमाल नाही' विकत घेते आणि बहिर्वक्रता 'कोपरे थोडे आहेत आणि प्रदेश एक तुकडा आहे', आणि कोणतेही एक गमावल्यास वेगळी हमी हरवते. (1 गृहीत धरते की एक गृहीतक अतिरेकी असेल कारण दुसरे बहुतांश काम करताना दिसते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A linear programme has 3 variables and 5 constraints. Corner points come from solving 3 constraints at a time. At most how many such combinations are there?",
          hi: "किसी रैखिक कार्यक्रम में 3 चर और 5 अड़चनें हैं। कोने-बिंदु एक बार में 3 अड़चनें हल करने से आते हैं। ऐसे अधिक से अधिक कितने संयोजन हैं?",
          mr: "एका रैखिक कार्यक्रमात 3 चल आणि 5 बंधने आहेत. कोपरा-बिंदू एका वेळी 3 बंधने सोडवण्यातून येतात. असे जास्तीत जास्त किती संयोग आहेत?",
        },
        answer: 10,
        wrong: [15, 8, 125],
        checkExpr: "10*1",
        solution: {
          en: "Choosing 3 from 5 gives 10 combinations. Not all of them yield a feasible corner — some triples of planes fail to meet in a single point, and some meet at points that violate the other two constraints — so 10 is an upper bound rather than a count. What makes this worth an advanced question is what the number does as the problem grows. Choosing n from m grows combinatorially: 10 variables and 20 constraints give 184,756 candidate corners, and a realistic industrial problem with hundreds of variables has more corners than there are atoms in the observable universe. So the corner-point method, which is a complete and correct algorithm, is completely unusable at scale — and that gap between correct and usable is one of the most important distinctions in applied mathematics. The resolution is the simplex method, which does not enumerate corners but WALKS between neighbouring ones, always in a direction that improves the objective, and so visits a tiny fraction of them. It is worth noticing what made that possible: convexity guarantees there are no local maxima to get stuck in, so improving locally is safe and a greedy walk cannot be trapped. The theorem that made enumeration valid is the same theorem that makes enumeration unnecessary. (15 computes 5 × 3, treating the choice as a product.)",
          hi: "5 में से 3 चुनने पर 10 संयोजन बनते हैं। उनमें से सब सुसंगत कोना नहीं देते — समतलों के कुछ त्रिक एक बिंदु पर मिलने में विफल रहते हैं, और कुछ ऐसे बिंदुओं पर मिलते हैं जो बाक़ी दो अड़चनों का उल्लंघन करते हैं — अतः 10 गिनती नहीं बल्कि ऊपरी सीमा है। इसे उन्नत प्रश्न वह बनाता है जो यह संख्या समस्या के बड़े होने पर करती है। m में से n चुनना संयोजनात्मक रूप से बढ़ता है: 10 चर और 20 अड़चनें 184,756 उम्मीदवार कोने देती हैं, और सैकड़ों चरों वाली यथार्थ औद्योगिक समस्या में प्रेक्षणीय ब्रह्मांड के परमाणुओं से अधिक कोने होते हैं। अतः कोने-बिंदु विधि, जो पूर्ण और सही कलनविधि है, बड़े पैमाने पर पूरी तरह अनुपयोगी है — और सही तथा उपयोगी के बीच की वह खाई अनुप्रयुक्त गणित के सबसे महत्वपूर्ण भेदों में से एक है। समाधान सिंप्लेक्स विधि है, जो कोने गिनती नहीं बल्कि पड़ोसी कोनों के बीच चलती है, सदा उस दिशा में जो उद्देश्य सुधारे, और इसलिए उनके बहुत छोटे अंश पर ही जाती है। ध्यान देने लायक़ यह है कि उसे किसने संभव बनाया: उत्तलता गारंटी देती है कि फँसने को कोई स्थानीय अधिकतम नहीं, अतः स्थानीय रूप से सुधारना सुरक्षित है और लोभी चाल फँस नहीं सकती। जिस प्रमेय ने गणना को वैध बनाया वही प्रमेय गणना को अनावश्यक बना देता है। (15, 5 × 3 गणित करता है, चुनाव को गुणनफल मानते हुए।)",
          mr: "5 पैकी 3 निवडल्यास 10 संयोग बनतात. त्यांपैकी सर्व सुसंगत कोपरा देत नाहीत — प्रतलांची काही त्रिके एका बिंदूवर भेटण्यात अपयशी ठरतात, आणि काही अशा बिंदूंवर भेटतात जे उरलेल्या दोन बंधनांचे उल्लंघन करतात — म्हणून 10 ही मोजणी नसून वरची सीमा आहे. याला प्रगत प्रश्न ते बनवते जे ही संख्या समस्या मोठी होताना करते. m पैकी n निवडणे संयोगात्मकरीत्या वाढते: 10 चल आणि 20 बंधने 184,756 उमेदवार कोपरे देतात, आणि शेकडो चल असलेल्या वास्तववादी औद्योगिक समस्येत निरीक्षणीय विश्वातील अणूंहून अधिक कोपरे असतात. म्हणून कोपरा-बिंदू पद्धत, जी पूर्ण आणि बरोबर कलनविधी आहे, मोठ्या प्रमाणावर पूर्णपणे निरुपयोगी आहे — आणि बरोबर आणि वापरण्याजोगे यांतील ती दरी उपयोजित गणितातील सर्वांत महत्त्वाच्या भेदांपैकी एक आहे. निराकरण म्हणजे सिंप्लेक्स पद्धत, जी कोपरे मोजत नाही तर शेजारच्या कोपऱ्यांदरम्यान चालते, नेहमी उद्दिष्ट सुधारणाऱ्या दिशेने, आणि म्हणून त्यांच्या अगदी लहान अंशावरच जाते. लक्षात घेण्याजोगे हे की ते कशाने शक्य केले: बहिर्वक्रता हमी देते की अडकण्यासाठी कोणतीही स्थानिक कमाल नाही, म्हणून स्थानिकरीत्या सुधारणे सुरक्षित आहे आणि लोभी चाल अडकू शकत नाही. ज्या प्रमेयाने मोजणी वैध केली तेच प्रमेय मोजणी अनावश्यक करते. (15 हे 5 × 3 काढते, निवडीला गुणाकार मानत.)",
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
          en: "A factory's optimal plan calls for 7.5 machines. Rounding to 8 exceeds the budget and rounding to 7 is feasible but not optimal among whole numbers. Of the linear programme's optimum and the true integer optimum, how many are found by rounding?",
          hi: "किसी कारख़ाने की इष्टतम योजना 7.5 मशीनें माँगती है। 8 पर पूर्णांकित करने से बजट पार हो जाता है और 7 पर करने से सुसंगत तो है पर पूर्ण संख्याओं में इष्टतम नहीं। रैखिक कार्यक्रम के इष्टतम और सच्चे पूर्णांक इष्टतम में से कितने पूर्णांकन से मिलते हैं?",
          mr: "एका कारखान्याची इष्टतम योजना 7.5 यंत्रे मागते. 8 वर पूर्णांकित केल्यास अंदाजपत्रक ओलांडते आणि 7 वर केल्यास सुसंगत आहे पण पूर्ण संख्यांत इष्टतम नाही. रैखिक कार्यक्रमाची इष्टतम आणि खरी पूर्णांक इष्टतम यांपैकी किती पूर्णांकनाने सापडतात?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        checkExpr: "1-1",
        solution: {
          en: "Neither. The linear programme's optimum is 7.5 itself and rounding destroys it rather than finding it; the integer optimum is stated not to be 7, and 8 is infeasible, so it lies somewhere rounding never looks — at a different combination of the OTHER variables entirely. The count is 0. This is the honest limit of the whole chapter and it is worth stating plainly, because the standard classroom problems quietly avoid it by choosing numbers that come out whole. Adding the requirement that variables be integers changes the problem's character completely. The feasible set stops being a convex polygon and becomes a scatter of isolated lattice points; the corner-point theorem no longer applies, because the optimum need not be at a corner of anything; and the simplex method's guarantee, which rested on being able to move continuously in an improving direction, is gone, since one cannot move a little bit. Integer linear programming is in fact NP-hard, while ordinary linear programming is solvable in polynomial time — the two problems look almost identical on the page and sit on opposite sides of the sharpest known divide in computational complexity. Two things follow that are worth carrying well beyond this syllabus. First, the rounding instinct is not merely inaccurate but structurally wrong: the continuous optimum's location carries no reliable information about where the discrete one is, and it can be arbitrarily far away. Second, a constraint that sounds like a technicality — 'you cannot buy half a machine' — can be the single most expensive thing in the model. Which requirements are cheap and which are catastrophic is not visible from how they are phrased. (1 supposes the linear optimum at least is recovered by rounding, when rounding moves away from it.)",
          hi: "कोई नहीं। रैखिक कार्यक्रम का इष्टतम स्वयं 7.5 है और पूर्णांकन उसे ढूँढ़ने के बजाय नष्ट कर देता है; पूर्णांक इष्टतम के बारे में कहा गया है कि वह 7 नहीं, और 8 असुसंगत है, अतः वह वहाँ है जहाँ पूर्णांकन कभी देखता ही नहीं — पूरी तरह दूसरे चरों के किसी भिन्न संयोजन पर। गिनती 0 है। यह पूरे अध्याय की ईमानदार सीमा है और उसे साफ़ कह देना ज़रूरी है, क्योंकि मानक कक्षा-समस्याएँ ऐसी संख्याएँ चुनकर चुपचाप इससे बच जाती हैं जो पूरी निकलती हैं। चरों के पूर्णांक होने की माँग जोड़ना समस्या का चरित्र पूरी तरह बदल देता है। सुसंगत समुच्चय उत्तल बहुभुज होना छोड़कर अलग-थलग जालक-बिंदुओं का बिखराव बन जाता है; कोने-बिंदु प्रमेय अब लागू नहीं, क्योंकि इष्टतम को किसी भी चीज़ के कोने पर होना ज़रूरी नहीं; और सिंप्लेक्स विधि की गारंटी, जो सुधार की दिशा में संतत हिल सकने पर टिकी थी, चली गई, क्योंकि थोड़ा-सा हिला नहीं जा सकता। पूर्णांक रैखिक प्रोग्रामन असल में NP-कठिन है, जबकि साधारण रैखिक प्रोग्रामन बहुपद समय में हल हो जाता है — दोनों समस्याएँ काग़ज़ पर लगभग एक जैसी दिखती हैं और अभिकलनात्मक जटिलता की सबसे तीखी ज्ञात विभाजक रेखा के विपरीत पक्षों पर बैठती हैं। इस पाठ्यक्रम से कहीं आगे ले जाने लायक़ दो बातें निकलती हैं। पहली, पूर्णांकन की सहज-वृत्ति महज़ अशुद्ध नहीं बल्कि संरचनात्मक रूप से ग़लत है: संतत इष्टतम की जगह इस बारे में कोई भरोसेमंद जानकारी नहीं ढोती कि विविक्त वाला कहाँ है, और वह मनचाहे दूर हो सकता है। दूसरी, जो अड़चन तकनीकी बारीक़ी लगती है — 'तुम आधी मशीन नहीं ख़रीद सकते' — वह मॉडल की सबसे महँगी अकेली चीज़ हो सकती है। कौन-सी माँगें सस्ती हैं और कौन-सी विनाशकारी, यह उनके कहे जाने के ढंग से नहीं दिखता। (1 मान लेता है कि कम से कम रैखिक इष्टतम पूर्णांकन से वापस मिल जाता है, जबकि पूर्णांकन उससे दूर ले जाता है।)",
          mr: "एकही नाही. रैखिक कार्यक्रमाची इष्टतम स्वतः 7.5 आहे आणि पूर्णांकन ती शोधण्याऐवजी नष्ट करते; पूर्णांक इष्टतमबद्दल सांगितले आहे की ती 7 नाही, आणि 8 असुसंगत आहे, म्हणून ती तिथे आहे जिथे पूर्णांकन कधीच पाहत नाही — पूर्णपणे इतर चलांच्या वेगळ्या संयोगावर. मोजणी 0 आहे. ही अख्ख्या अध्यायाची प्रामाणिक मर्यादा आहे आणि ती स्पष्ट सांगणे आवश्यक आहे, कारण प्रमाण वर्ग-समस्या पूर्ण निघणाऱ्या संख्या निवडून गुपचूप हिच्यापासून वाचतात. चल पूर्णांक असावेत ही मागणी जोडणे समस्येचे चरित्र पूर्णपणे बदलते. सुसंगत संच बहिर्वक्र बहुभुज असणे थांबवून वेगळ्या जालक-बिंदूंचा विखार बनतो; कोपरा-बिंदू प्रमेय आता लागू नाही, कारण इष्टतम कशाच्याही कोपऱ्यावर असणे आवश्यक नाही; आणि सिंप्लेक्स पद्धतीची हमी, जी सुधारणाऱ्या दिशेने संततपणे हलू शकण्यावर टिकली होती, गेली, कारण थोडेसे हलता येत नाही. पूर्णांक रैखिक प्रोग्रामिंग प्रत्यक्षात NP-कठीण आहे, तर साधे रैखिक प्रोग्रामिंग बहुपदी काळात सुटते — दोन्ही समस्या कागदावर जवळजवळ सारख्याच दिसतात आणि अभिकलनात्मक गुंतागुंतीच्या सर्वांत तीक्ष्ण ज्ञात विभाजक रेषेच्या विरुद्ध बाजूंना बसतात. या अभ्यासक्रमापुढे कितीतरी न्यायला हव्या अशा दोन गोष्टी निघतात. पहिली, पूर्णांकनाची सहजप्रवृत्ती केवळ चुकीची नसून संरचनात्मक दृष्ट्या चुकीची आहे: संतत इष्टतमची जागा विविक्त कुठे आहे याबद्दल कोणतीही विश्वासार्ह माहिती वाहत नाही, आणि ती हवी तितकी दूर असू शकते. दुसरी, जे बंधन तांत्रिक बारकावा वाटते — 'तुम्ही अर्धे यंत्र विकत घेऊ शकत नाही' — ते प्रतिरूपातील सर्वांत महाग एकटी गोष्ट असू शकते. कोणत्या मागण्या स्वस्त आहेत आणि कोणत्या विनाशकारी, हे त्या कशा मांडल्या यावरून दिसत नाही. (1 गृहीत धरते की किमान रैखिक इष्टतम पूर्णांकनाने परत मिळते, तर पूर्णांकन तिच्यापासून दूर नेते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A maximisation problem has an unbounded feasible region and no maximum. Of its maximum and its minimum, how many are guaranteed not to exist?",
          hi: "किसी अधिकतमीकरण समस्या का सुसंगत क्षेत्र अपरिबद्ध है और कोई अधिकतम नहीं। उसके अधिकतम और न्यूनतम में से कितनों का अस्तित्व न होना निश्चित है?",
          mr: "एखाद्या कमालीकरण समस्येचा सुसंगत प्रदेश अबद्ध आहे आणि कोणतीही कमाल नाही. तिच्या कमाल आणि किमान यांपैकी कितींचे अस्तित्व नसणे निश्चित आहे?",
        },
        answer: 1,
        wrong: [2, 0, 3],
        checkExpr: "2-1",
        solution: {
          en: "One — only the maximum. That the region is unbounded says the feasible set extends forever in some direction, and that the maximum fails to exist says the objective increases without limit along one of those directions. Neither statement constrains the other end. The region x ≥ 0, y ≥ 0 with objective x + y has no maximum and a perfectly good minimum of 0 at the origin, so unboundedness in a region is entirely compatible with the objective being bounded below. The count is therefore 1, and the general principle is that boundedness of the FEASIBLE SET and boundedness of the OBJECTIVE ON that set are different properties, related but not equivalent. A bounded region forces both to exist; an unbounded region forces neither, and each must be checked separately in the direction being asked about. There is a further subtlety worth naming, because it is the one that catches people who have understood everything so far. An unbounded region does not even guarantee that the maximum fails — take the same quarter-plane with objective −x − y, which is bounded above by 0 and attains it, so the region runs to infinity in directions where the objective is running away downwards and the maximum exists comfortably. So the correct statement has three parts, not one: the maximum exists if the region is bounded, OR if the objective decreases along every unbounded direction of the region; and it fails only when some unbounded direction increases it. Checking 'is the region bounded' is a cheap sufficient test, and treating it as necessary as well is the error. Reading a sufficient condition as though it were a characterisation is among the most common ways of being confidently wrong in mathematics, and this chapter offers a particularly clean example of it. (2 assumes that an unbounded region breaks both ends at once.)",
          hi: "एक — केवल अधिकतम। क्षेत्र का अपरिबद्ध होना कहता है कि सुसंगत समुच्चय किसी दिशा में सदा को फैला है, और अधिकतम का न होना कहता है कि उन्हीं दिशाओं में से किसी एक के अनुदिश उद्देश्य बिना सीमा बढ़ता है। कोई भी कथन दूसरे सिरे को नहीं बाँधता। क्षेत्र x ≥ 0, y ≥ 0 और उद्देश्य x + y का कोई अधिकतम नहीं और मूलबिंदु पर बिलकुल ठीक 0 का न्यूनतम है, अतः क्षेत्र की अपरिबद्धता उद्देश्य के नीचे से परिबद्ध होने के पूरी तरह अनुकूल है। अतः गिनती 1 है, और सामान्य सिद्धांत यह है कि सुसंगत समुच्चय की परिबद्धता और उस समुच्चय पर उद्देश्य की परिबद्धता भिन्न गुण हैं, संबंधित पर समतुल्य नहीं। परिबद्ध क्षेत्र दोनों को होने पर मजबूर करता है; अपरिबद्ध क्षेत्र किसी को नहीं, और जिस दिशा के बारे में पूछा गया है उसमें हर एक अलग से जाँचना होगा। एक और बारीक़ी नाम देने लायक़ है, क्योंकि वही उन्हें पकड़ती है जो अब तक सब समझ चुके हैं। अपरिबद्ध क्षेत्र यह गारंटी तक नहीं देता कि अधिकतम विफल होगा — वही चतुर्थांश-समतल उद्देश्य −x − y के साथ लो, जो ऊपर से 0 से परिबद्ध है और उसे प्राप्त भी करता है, अतः क्षेत्र उन दिशाओं में अनंत तक भागता है जहाँ उद्देश्य नीचे की ओर भाग रहा है और अधिकतम आराम से मौजूद है। अतः सही कथन के तीन हिस्से हैं, एक नहीं: अधिकतम है यदि क्षेत्र परिबद्ध हो, या यदि उद्देश्य क्षेत्र की हर अपरिबद्ध दिशा के अनुदिश घटता हो; और वह केवल तब विफल है जब कोई अपरिबद्ध दिशा उसे बढ़ाए। 'क्या क्षेत्र परिबद्ध है' जाँचना सस्ता पर्याप्त परीक्षण है, और उसे आवश्यक भी मान लेना ही भूल है। किसी पर्याप्त शर्त को ऐसे पढ़ना मानो वह अभिलक्षण हो, गणित में आत्मविश्वास से ग़लत होने के सबसे आम तरीक़ों में है, और यह अध्याय उसका ख़ासा साफ़ उदाहरण देता है। (2 मान लेता है कि अपरिबद्ध क्षेत्र दोनों सिरे एक साथ तोड़ देता है।)",
          mr: "एक — केवळ कमाल. प्रदेश अबद्ध असणे सांगते की सुसंगत संच एखाद्या दिशेने कायमचा पसरला आहे, आणि कमाल नसणे सांगते की त्याच दिशांपैकी एकीच्या बाजूने उद्दिष्ट मर्यादेशिवाय वाढते. कोणतेही विधान दुसऱ्या टोकाला बांधत नाही. प्रदेश x ≥ 0, y ≥ 0 आणि उद्दिष्ट x + y यांना कोणतीही कमाल नाही आणि आदिबिंदूवर अगदी व्यवस्थित 0 ची किमान आहे, म्हणून प्रदेशाची अबद्धता उद्दिष्ट खालून बद्ध असण्याशी पूर्णपणे सुसंगत आहे. म्हणून मोजणी 1 आहे, आणि सर्वसाधारण तत्त्व हे की सुसंगत संचाची बद्धता आणि त्या संचावर उद्दिष्टाची बद्धता हे वेगळे गुणधर्म आहेत, संबंधित पण समतुल्य नाहीत. बद्ध प्रदेश दोन्ही असण्यास भाग पाडतो; अबद्ध प्रदेश कोणालाच नाही, आणि ज्या दिशेबद्दल विचारले आहे तिच्यात प्रत्येक वेगळे तपासावे लागेल. आणखी एक सूक्ष्मता नाव देण्याजोगी आहे, कारण तीच त्यांना पकडते ज्यांनी आतापर्यंत सर्व समजून घेतले आहे. अबद्ध प्रदेश ही हमीसुद्धा देत नाही की कमाल अपयशी ठरेल — तेच चतुर्थांश-प्रतल उद्दिष्ट −x − y सोबत घ्या, जे वरून 0 ने बद्ध आहे आणि ते गाठतेही, म्हणून प्रदेश त्या दिशांत अनंतापर्यंत पळतो जिथे उद्दिष्ट खालच्या दिशेने पळत आहे आणि कमाल आरामात अस्तित्वात आहे. म्हणून बरोबर विधानाचे तीन भाग आहेत, एक नव्हे: कमाल आहे जर प्रदेश बद्ध असेल, किंवा जर उद्दिष्ट प्रदेशाच्या प्रत्येक अबद्ध दिशेच्या बाजूने घटत असेल; आणि ती केवळ तेव्हा अपयशी आहे जेव्हा एखादी अबद्ध दिशा तिला वाढवेल. 'प्रदेश बद्ध आहे का' तपासणे ही स्वस्त पुरेशी चाचणी आहे, आणि तिला आवश्यकही मानणे हीच चूक आहे. एखादी पुरेशी अट अशी वाचणे जणू ती वैशिष्ट्यनिर्धारण असावी, हे गणितात आत्मविश्वासाने चुकीचे असण्याच्या सर्वांत सामान्य मार्गांपैकी आहे, आणि हा अध्याय त्याचे विशेष स्वच्छ उदाहरण देतो. (2 गृहीत धरते की अबद्ध प्रदेश दोन्ही टोके एकाच वेळी मोडतो.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-linear-programming",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 12 — Linear Programming",
      name: "Linear Programming",
      summary:
        "Why an infinite search can be finished by testing finitely many corners, and what that guarantee is bought with: why linearity and convexity are both load-bearing and fail in different ways, why an unbounded region makes the method return a confident wrong answer, why the number of corners makes the honest method unusable at real scale, and why requiring whole numbers changes the problem into a different and far harder one.",
      position: 12,
      translations: {
        hi: {
          name: "रैखिक प्रोग्रामन",
          summary:
            "अनंत खोज परिमित कोनों की जाँच से क्यों पूरी हो जाती है, और वह गारंटी किस क़ीमत पर ख़रीदी गई: रैखिकता और उत्तलता दोनों भार क्यों उठा रही हैं और भिन्न ढंग से विफल क्यों होती हैं, अपरिबद्ध क्षेत्र विधि से आत्मविश्वास भरा ग़लत उत्तर क्यों दिलवाता है, कोनों की संख्या असली पैमाने पर ईमानदार विधि को अनुपयोगी क्यों बना देती है, और पूर्ण संख्याओं की माँग समस्या को भिन्न और कहीं कठिन क्यों बना देती है।",
        },
        mr: {
          name: "रैखिक प्रोग्रामिंग",
          summary:
            "अनंत शोध सांत कोपरे तपासून का पूर्ण होतो, आणि ती हमी कोणत्या किमतीवर विकत घेतली: रैखिकता आणि बहिर्वक्रता दोन्ही भार का उचलत आहेत आणि वेगळ्या प्रकारे का अपयशी होतात, अबद्ध प्रदेश पद्धतीकडून आत्मविश्वासाने भरलेले चुकीचे उत्तर का देववतो, कोपऱ्यांची संख्या खऱ्या प्रमाणावर प्रामाणिक पद्धत निरुपयोगी का करते, आणि पूर्ण संख्यांची मागणी समस्येला वेगळी आणि कितीतरी कठीण का बनवते.",
        },
      },
    },
    qs,
  );
}

/* ------------------------------------------------------------------------- */
/* Chapter 13 — Probability (what a condition does to a chance)               */
/* ------------------------------------------------------------------------- */
function probability12(): TopicFileOut {
  const rand = rng("maths-12-probability");
  const qs: OutQuestion[] = [];

  qs.push(
    numQ(
      {
        level: 1,
        stem: {
          en: "A fair die is rolled. Out of 6 outcomes, how many are even?",
          hi: "एक न्यायसंगत पासा फेंका जाता है। 6 परिणामों में से कितने सम हैं?",
          mr: "एक न्याय्य फासा टाकला जातो. 6 निकालांपैकी किती सम आहेत?",
        },
        answer: 3,
        wrong: [2, 4, 6],
        checkExpr: "6/2",
        solution: {
          en: "2, 4 and 6 — three of them, so the probability of an even roll is 3/6 = 1/2. Counting favourable outcomes out of equally likely ones is the whole of elementary probability, and everything later in the chapter is about what happens when the outcomes are NOT equally likely or when information arrives that changes the count. (2 counts the digits 2 and 4 and forgets 6 is even.)",
          hi: "2, 4 और 6 — उनमें तीन, अतः सम आने की प्रायिकता 3/6 = 1/2 है। समसंभाव्य परिणामों में से अनुकूल परिणाम गिनना प्रारंभिक प्रायिकता की पूरी बात है, और अध्याय में आगे सब कुछ इस बारे में है कि क्या होता है जब परिणाम समसंभाव्य न हों या जब ऐसी जानकारी आ जाए जो गिनती बदल दे। (2, अंक 2 और 4 गिन लेता है और भूल जाता है कि 6 सम है।)",
          mr: "2, 4 आणि 6 — त्यांतील तीन, म्हणून सम येण्याची संभाव्यता 3/6 = 1/2 आहे. समसंभाव्य निकालांतून अनुकूल निकाल मोजणे ही प्राथमिक संभाव्यतेची अख्खी गोष्ट आहे, आणि अध्यायात पुढे सर्वकाही याबद्दल आहे की काय होते जेव्हा निकाल समसंभाव्य नसतील किंवा जेव्हा मोजणी बदलणारी माहिती येईल. (2 अंक 2 आणि 4 मोजते आणि विसरते की 6 सम आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "Two fair coins are tossed. How many outcomes are in the sample space?",
          hi: "दो न्यायसंगत सिक्के उछाले जाते हैं। प्रतिदर्श समष्टि में कितने परिणाम हैं?",
          mr: "दोन न्याय्य नाणी उडवली जातात. नमुना अवकाशात किती निकाल आहेत?",
        },
        answer: 4,
        wrong: [2, 3, 8],
        checkExpr: "2*2",
        solution: {
          en: "Four: HH, HT, TH and TT. Note that HT and TH are DIFFERENT outcomes even though both give one head — the coins are distinguishable even when they look alike, and treating 'one head' as a single outcome is what produces the wrong answer 3. That error has a distinguished history: it is what d'Alembert got wrong in the eighteenth century, and it is still the commonest mistake in the chapter. (3 counts the possible numbers of heads rather than the outcomes.)",
          hi: "चार: HH, HT, TH और TT. ध्यान दो कि HT और TH अलग परिणाम हैं, भले दोनों एक चित देते हों — सिक्के एक जैसे दिखने पर भी अलग पहचाने जा सकते हैं, और 'एक चित' को अकेला परिणाम मानना ही ग़लत उत्तर 3 पैदा करता है। उस भूल का प्रतिष्ठित इतिहास है: अठारहवीं सदी में द'अलंबेयर से यही ग़लती हुई थी, और वह आज भी अध्याय की सबसे आम भूल है। (3 परिणामों के बजाय चितों की संभव संख्याएँ गिन लेता है।)",
          mr: "चार: HH, HT, TH आणि TT. लक्षात घ्या की HT आणि TH हे वेगळे निकाल आहेत, जरी दोन्ही एक छापा देत असले तरी — नाणी सारखी दिसली तरी वेगळी ओळखता येतात, आणि 'एक छापा' ला एकच निकाल मानणेच चुकीचे उत्तर 3 निर्माण करते. त्या चुकीला प्रतिष्ठित इतिहास आहे: अठराव्या शतकात द'अलंबेरची हीच चूक झाली होती, आणि ती आजही अध्यायातील सर्वांत सामान्य चूक आहे. (3 निकालांऐवजी छाप्यांच्या शक्य संख्या मोजते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 1,
        stem: {
          en: "An event is certain. Its probability is what number?",
          hi: "कोई घटना निश्चित है। उसकी प्रायिकता कौन-सी संख्या है?",
          mr: "एखादी घटना निश्चित आहे. तिची संभाव्यता कोणती संख्या आहे?",
        },
        answer: 1,
        wrong: [0, 100, 2],
        checkExpr: "2-1",
        solution: {
          en: "1. Probability runs from 0 to 1, with 0 for impossible and 1 for certain, and every number in between is a degree of belief or a long-run frequency depending on which interpretation one takes. The 100 on offer is a percentage, which is the same information wearing different clothes; mixing the two scales in one calculation is a reliable way to produce an answer a hundred times too big. (100 gives the percentage.)",
          hi: "1. प्रायिकता 0 से 1 तक चलती है, 0 असंभव के लिए और 1 निश्चित के लिए, और बीच की हर संख्या विश्वास की मात्रा है या दीर्घकालिक बारंबारता, इस पर निर्भर कि कौन-सी व्याख्या ली जाए। पेश किया गया 100 प्रतिशत है, जो वही जानकारी है अलग कपड़ों में; एक ही गणना में दोनों पैमाने मिला देना सौ गुना बड़ा उत्तर पैदा करने का भरोसेमंद तरीक़ा है। (100 प्रतिशत देता है।)",
          mr: "1. संभाव्यता 0 ते 1 पर्यंत चालते, 0 अशक्यासाठी आणि 1 निश्चितासाठी, आणि मधली प्रत्येक संख्या विश्वासाची मात्रा आहे वा दीर्घकालीन वारंवारता, कोणते अर्थनिर्वचन घेतले यावर अवलंबून. दिलेला 100 हा टक्केवारी आहे, जी तीच माहिती वेगळ्या कपड्यांत आहे; एकाच गणनेत दोन्ही मापे मिसळणे हा शंभरपट मोठे उत्तर तयार करण्याचा विश्वासार्ह मार्ग आहे. (100 टक्केवारी देते.)",
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
          en: "A die shows an even number. Given that, out of how many outcomes is a 6 now being chosen?",
          hi: "पासे पर सम संख्या आई। यह देखते हुए, अब 6 कितने परिणामों में से चुना जा रहा है?",
          mr: "फाशावर सम संख्या आली. हे पाहता, आता 6 किती निकालांतून निवडला जात आहे?",
        },
        answer: 3,
        wrong: [6, 2, 1],
        checkExpr: "6/2",
        solution: {
          en: "Three — the condition has thrown away 1, 3 and 5, so the sample space is now {2, 4, 6} and P(6 | even) = 1/3 rather than 1/6. That is the whole mechanism of conditional probability: information does not change the die, it SHRINKS the sample space, and the probability rises because the same single favourable outcome is now competing against fewer rivals. Seeing conditioning as a reduction of the space rather than as a formula makes most of the later questions answerable by counting. (6 keeps the original space and ignores the condition.)",
          hi: "तीन — शर्त ने 1, 3 और 5 फेंक दिए, अतः प्रतिदर्श समष्टि अब {2, 4, 6} है और P(6 | सम) = 1/3 है, 1/6 नहीं। यही सशर्त प्रायिकता की पूरी क्रियाविधि है: जानकारी पासे को नहीं बदलती, वह प्रतिदर्श समष्टि को सिकोड़ देती है, और प्रायिकता इसलिए बढ़ती है क्योंकि वही एक अनुकूल परिणाम अब कम प्रतिद्वंद्वियों से भिड़ रहा है। सशर्तन को सूत्र के बजाय समष्टि के संकुचन की तरह देखना आगे के अधिकांश प्रश्नों को गिनती से उत्तर देने लायक़ बना देता है। (6 मूल समष्टि रखता है और शर्त अनदेखी करता है।)",
          mr: "तीन — अटीने 1, 3 आणि 5 फेकून दिले, म्हणून नमुना अवकाश आता {2, 4, 6} आहे आणि P(6 | सम) = 1/3 आहे, 1/6 नव्हे. हीच सशर्त संभाव्यतेची अख्खी कार्यपद्धती आहे: माहिती फाशाला बदलत नाही, ती नमुना अवकाश आकुंचित करते, आणि संभाव्यता यासाठी वाढते कारण तोच एक अनुकूल निकाल आता कमी प्रतिस्पर्ध्यांशी भिडत आहे. सशर्तीकरणाला सूत्राऐवजी अवकाशाचे आकुंचन म्हणून पाहणे पुढील बहुतांश प्रश्न मोजणीने उत्तरण्याजोगे बनवते. (6 मूळ अवकाश ठेवते आणि अट दुर्लक्षते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Two independent events have probabilities 1/2 and 1/3. What is the denominator of the probability that both occur?",
          hi: "दो स्वतंत्र घटनाओं की प्रायिकताएँ 1/2 और 1/3 हैं। दोनों के घटने की प्रायिकता का हर क्या है?",
          mr: "दोन स्वतंत्र घटनांच्या संभाव्यता 1/2 आणि 1/3 आहेत. दोन्ही घडण्याच्या संभाव्यतेचा छेद किती?",
        },
        answer: 6,
        wrong: [5, 3, 2],
        checkExpr: "2*3",
        solution: {
          en: "Independence means the probabilities multiply: (1/2)(1/3) = 1/6, so the denominator is 6. Note that 5 is the answer of somebody who added the fractions, which would be the rule for MUTUALLY EXCLUSIVE events and not for independent ones — the two words sound similar and describe opposite situations, which the next question takes up directly. (5 adds the denominators.)",
          hi: "स्वतंत्रता का अर्थ है प्रायिकताएँ गुणा होती हैं: (1/2)(1/3) = 1/6, अतः हर 6 है। ध्यान दो कि 5 उसका उत्तर है जिसने भिन्न जोड़ दीं, जो परस्पर अपवर्जी घटनाओं का नियम होता, स्वतंत्र घटनाओं का नहीं — दोनों शब्द एक जैसे सुनाई देते हैं और विपरीत स्थितियाँ बताते हैं, जिसे अगला प्रश्न सीधे उठाता है। (5 हर जोड़ देता है।)",
          mr: "स्वातंत्र्याचा अर्थ संभाव्यता गुणल्या जातात: (1/2)(1/3) = 1/6, म्हणून छेद 6 आहे. लक्षात घ्या की 5 हे त्याचे उत्तर आहे ज्याने अपूर्णांक जोडले, जो परस्पर अपवर्जक घटनांचा नियम असता, स्वतंत्र घटनांचा नव्हे — दोन्ही शब्द सारखे ऐकू येतात आणि विरुद्ध परिस्थिती सांगतात, जे पुढचा प्रश्न थेट उचलतो. (5 छेद जोडते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 2,
        stem: {
          en: "Two events with non-zero probability are mutually exclusive. How many of them can be independent of the other?",
          hi: "अशून्य प्रायिकता वाली दो घटनाएँ परस्पर अपवर्जी हैं। उनमें से कितनी दूसरी से स्वतंत्र हो सकती हैं?",
          mr: "अशून्य संभाव्यता असलेल्या दोन घटना परस्पर अपवर्जक आहेत. त्यांपैकी किती दुसरीपासून स्वतंत्र असू शकतात?",
        },
        answer: 0,
        wrong: [1, 2, 3],
        checkExpr: "1-1",
        solution: {
          en: "Neither — mutually exclusive events with non-zero probability are necessarily DEPENDENT, which is the opposite of what the similar-sounding names suggest. The argument is short. If A and B cannot both happen, then P(A and B) = 0. If they were independent, P(A and B) would equal P(A)P(B), which is a product of two non-zero numbers and therefore non-zero. The two statements contradict each other, so independence is impossible. The intuition behind the algebra is worth stating: learning that A happened tells you B definitely did NOT, and that is a very large amount of information — the most, in fact, that one event can give about another. Independence means learning nothing; exclusivity means learning everything. They are not merely different, they are at opposite ends of the same scale. (1 supposes the relation might hold one way and not the other, but independence is symmetric.)",
          hi: "कोई नहीं — अशून्य प्रायिकता वाली परस्पर अपवर्जी घटनाएँ अनिवार्यतः परतंत्र हैं, जो उन एक-से सुनाई देते नामों के सुझाव के उलट है। तर्क छोटा है। यदि A और B दोनों नहीं हो सकते, तो P(A और B) = 0. यदि वे स्वतंत्र होतीं, तो P(A और B) बराबर होता P(A)P(B) के, जो दो अशून्य संख्याओं का गुणनफल है और इसलिए अशून्य। दोनों कथन एक-दूसरे का खंडन करते हैं, अतः स्वतंत्रता असंभव है। बीजगणित के पीछे का अंतर्ज्ञान कहने लायक़ है: यह जानना कि A हुआ, तुम्हें बता देता है कि B निश्चित रूप से नहीं हुआ, और वह बहुत बड़ी मात्रा में जानकारी है — असल में सबसे ज़्यादा, जितनी एक घटना दूसरी के बारे में दे सकती है। स्वतंत्रता का अर्थ है कुछ न जानना; अपवर्जिता का अर्थ है सब जान जाना। वे महज़ भिन्न नहीं, वे एक ही पैमाने के विपरीत सिरों पर हैं। (1 मान लेता है कि संबंध एक ओर हो सकता है और दूसरी ओर नहीं, पर स्वतंत्रता सममित है।)",
          mr: "एकही नाही — अशून्य संभाव्यता असलेल्या परस्पर अपवर्जक घटना अपरिहार्यपणे परावलंबी आहेत, जे त्या सारख्या ऐकू येणाऱ्या नावांच्या सूचनेच्या उलट आहे. युक्तिवाद छोटा आहे. जर A आणि B दोन्ही घडू शकत नसतील, तर P(A आणि B) = 0. जर त्या स्वतंत्र असत्या, तर P(A आणि B) हे P(A)P(B) इतके असते, जो दोन अशून्य संख्यांचा गुणाकार आहे आणि म्हणून अशून्य. दोन्ही विधाने एकमेकांचे खंडन करतात, म्हणून स्वातंत्र्य अशक्य आहे. बीजगणिताच्या मागची अंतर्दृष्टी सांगण्याजोगी आहे: A घडले हे जाणणे तुम्हाला सांगते की B निश्चितपणे घडले नाही, आणि ती फार मोठ्या प्रमाणातील माहिती आहे — प्रत्यक्षात सर्वाधिक, जितकी एक घटना दुसरीबद्दल देऊ शकते. स्वातंत्र्य म्हणजे काहीच न कळणे; अपवर्जकता म्हणजे सर्व कळणे. त्या केवळ वेगळ्या नाहीत, त्या एकाच मापाच्या विरुद्ध टोकांवर आहेत. (1 गृहीत धरते की संबंध एका बाजूने असू शकतो आणि दुसऱ्या बाजूने नाही, पण स्वातंत्र्य सममित आहे.)",
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
          en: "A bag has 3 red and 2 blue balls. Two are drawn without replacement. Out of how many balls is the second drawn?",
          hi: "किसी थैले में 3 लाल और 2 नीली गेंदें हैं। बिना लौटाए दो निकाली जाती हैं। दूसरी कितनी गेंदों में से निकाली जाती है?",
          mr: "एका पिशवीत 3 लाल आणि 2 निळे चेंडू आहेत. परत न ठेवता दोन काढले जातात. दुसरा किती चेंडूंतून काढला जातो?",
        },
        answer: 4,
        wrong: [5, 3, 2],
        checkExpr: "5-1",
        solution: {
          en: "Four, since one ball has already gone. 'Without replacement' is the phrase that makes the two draws dependent: the second draw's probabilities depend on what the first produced, so the sample space has changed between them. With replacement the count would stay 5 and the draws would be independent. This one phrase is the difference between multiplying unchanged probabilities and having to condition, and it is worth reading for deliberately in every word problem, because it is usually the only place the dependence is announced. (5 keeps the original count.)",
          hi: "चार, क्योंकि एक गेंद पहले ही जा चुकी। 'बिना लौटाए' वही वाक्यांश है जो दोनों निकालों को परतंत्र बनाता है: दूसरे निकाल की प्रायिकताएँ इस पर निर्भर हैं कि पहले ने क्या दिया, अतः उनके बीच प्रतिदर्श समष्टि बदल गई है। लौटाने के साथ गिनती 5 ही रहती और निकाल स्वतंत्र होते। यह एक वाक्यांश अपरिवर्तित प्रायिकताएँ गुणा करने और सशर्तन करने के बीच का फ़र्क़ है, और हर शब्द-समस्या में उसे जान-बूझकर ढूँढ़ना ठीक है, क्योंकि आम तौर पर वही अकेली जगह है जहाँ परतंत्रता की घोषणा होती है। (5 मूल गिनती रखता है।)",
          mr: "चार, कारण एक चेंडू आधीच गेला आहे. 'परत न ठेवता' हाच तो वाक्यांश आहे जो दोन्ही काढण्यांना परावलंबी बनवतो: दुसऱ्या काढण्याच्या संभाव्यता पहिल्याने काय दिले यावर अवलंबून आहेत, म्हणून त्यांच्यादरम्यान नमुना अवकाश बदलला आहे. परत ठेवल्यास मोजणी 5 च राहिली असती आणि काढणी स्वतंत्र असती. हा एक वाक्यांश अपरिवर्तित संभाव्यता गुणणे आणि सशर्तीकरण करावे लागणे यांतील फरक आहे, आणि प्रत्येक शब्द-समस्येत तो मुद्दाम शोधणे बरे, कारण सर्वसाधारणपणे तीच एकमेव जागा आहे जिथे परावलंबित्वाची घोषणा होते. (5 मूळ मोजणी ठेवते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 3,
        stem: {
          en: "A coin is tossed 5 times. In how many of the 32 outcomes are all tosses heads?",
          hi: "एक सिक्का 5 बार उछाला जाता है। 32 परिणामों में से कितनों में सभी उछाल चित हैं?",
          mr: "एक नाणे 5 वेळा उडवले जाते. 32 निकालांपैकी कितींत सर्व उडवण्या छापा आहेत?",
        },
        answer: 1,
        wrong: [5, 2, 32],
        checkExpr: "2-1",
        solution: {
          en: "One — HHHHH, and only that. So the probability is 1/32, which is the same as (1/2)⁵ as independence would give. Worth noticing: this single outcome is exactly as likely as any other single outcome, including HTHTH, which feels far more ordinary. What makes 'all heads' feel special is not its own probability but that it belongs to a description satisfied by only one arrangement, while 'some mixture' is satisfied by thirty. Confusing the probability of an OUTCOME with the probability of a DESCRIPTION is behind most misjudged coincidences, in this chapter and outside it. (5 counts the tosses.)",
          hi: "एक — HHHHH, और बस वही। अतः प्रायिकता 1/32 है, जो वही है जो स्वतंत्रता से (1/2)⁵ देती। ध्यान देने लायक़: यह अकेला परिणाम किसी भी दूसरे अकेले परिणाम जितना ही संभावित है, HTHTH सहित, जो कहीं अधिक साधारण लगता है। 'सब चित' को ख़ास उसकी अपनी प्रायिकता नहीं बनाती बल्कि यह कि वह ऐसे वर्णन से जुड़ा है जिसे केवल एक विन्यास पूरा करता है, जबकि 'कोई मिश्रण' को तीस पूरा करते हैं। किसी परिणाम की प्रायिकता को किसी वर्णन की प्रायिकता से गड्डमड्ड करना अधिकांश ग़लत आँके गए संयोगों के पीछे है, इस अध्याय में और उसके बाहर भी। (5 उछाल गिन लेता है।)",
          mr: "एक — HHHHH, आणि फक्त तोच. म्हणून संभाव्यता 1/32 आहे, जी स्वातंत्र्याने (1/2)⁵ देईल तीच आहे. लक्षात घेण्याजोगे: हा एकटा निकाल इतर कोणत्याही एकट्या निकालाइतकाच संभाव्य आहे, HTHTH सह, जो कितीतरी अधिक सामान्य वाटतो. 'सर्व छापे' ला खास त्याची स्वतःची संभाव्यता बनवत नाही तर हे की तो अशा वर्णनाशी जोडलेला आहे जे केवळ एक मांडणी पूर्ण करते, तर 'काहीतरी मिश्रण' तीस पूर्ण करतात. एखाद्या निकालाची संभाव्यता एखाद्या वर्णनाच्या संभाव्यतेशी गोंधळवणे हे बहुतांश चुकीच्या मोजलेल्या योगायोगांमागे आहे, या अध्यायात आणि त्याबाहेरही. (5 उडवण्या मोजते.)",
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
          en: "In 10,000 people, 100 have a disease. A test is 99% accurate both ways. How many healthy people test positive?",
          hi: "10,000 लोगों में 100 को कोई रोग है। कोई जाँच दोनों ओर से 99% सटीक है। कितने स्वस्थ लोगों की जाँच धनात्मक आती है?",
          mr: "10,000 लोकांत 100 जणांना एक रोग आहे. एक चाचणी दोन्ही बाजूंनी 99% अचूक आहे. किती निरोगी लोकांची चाचणी धन येते?",
        },
        answer: 99,
        wrong: [1, 100, 9900],
        checkExpr: "9900*0.01",
        solution: {
          en: "9,900 people are healthy and 1% of them test positive falsely: 9,900 × 0.01 = 99. Set that beside the true positives: of the 100 who are ill, 99 test positive. So 198 people test positive in total and only 99 of them are actually ill — a positive result means a 50% chance of disease, not 99%. This is base-rate neglect, and the reason the intuition fails is that the test's accuracy is applied to a much larger pool of healthy people than sick ones, so a small error rate on a big group matches a large success rate on a small one. The arithmetic is easiest to trust when done in whole people rather than percentages, which is why the question is posed with a population. (1 applies the 1% to the 100 ill people instead of the 9,900 healthy ones.)",
          hi: "9,900 लोग स्वस्थ हैं और उनमें से 1% की जाँच झूठी धनात्मक आती है: 9,900 × 0.01 = 99. उसे सच्ची धनात्मकों के साथ रखो: जो 100 बीमार हैं उनमें से 99 की जाँच धनात्मक आती है। अतः कुल 198 लोगों की जाँच धनात्मक आती है और उनमें से केवल 99 सचमुच बीमार हैं — धनात्मक परिणाम का अर्थ है रोग की 50% संभावना, 99% नहीं। यह आधार-दर की उपेक्षा है, और अंतर्ज्ञान इसलिए विफल होता है क्योंकि जाँच की सटीकता बीमारों की तुलना में कहीं बड़े स्वस्थ लोगों के समूह पर लगती है, अतः बड़े समूह पर छोटी त्रुटि-दर छोटे समूह पर बड़ी सफलता-दर के बराबर आ जाती है। गणित पर भरोसा तब सबसे आसान है जब वह प्रतिशत के बजाय पूरे लोगों में किया जाए, इसीलिए प्रश्न जनसंख्या के साथ पूछा गया है। (1, 1% को 9,900 स्वस्थों के बजाय 100 बीमारों पर लगा देता है।)",
          mr: "9,900 लोक निरोगी आहेत आणि त्यांपैकी 1% ची चाचणी खोटी धन येते: 9,900 × 0.01 = 99. ते खऱ्या धनांसोबत ठेवा: जे 100 आजारी आहेत त्यांपैकी 99 ची चाचणी धन येते. म्हणून एकूण 198 लोकांची चाचणी धन येते आणि त्यांपैकी केवळ 99 खरोखर आजारी आहेत — धन निकालाचा अर्थ रोगाची 50% शक्यता, 99% नव्हे. ही आधार-दराची उपेक्षा आहे, आणि अंतर्दृष्टी यासाठी अपयशी होते कारण चाचणीची अचूकता आजाऱ्यांहून कितीतरी मोठ्या निरोगी लोकांच्या गटावर लागते, म्हणून मोठ्या गटावरील लहान त्रुटी-दर लहान गटावरील मोठ्या यश-दराइतकी येते. गणितावर विश्वास तेव्हा सर्वांत सोपा आहे जेव्हा ते टक्केवारीऐवजी पूर्ण माणसांत केले जाईल, म्हणूनच प्रश्न लोकसंख्येसह विचारला आहे. (1 हे 1% ला 9,900 निरोग्यांऐवजी 100 आजाऱ्यांवर लावते.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 4,
        stem: {
          en: "A family has two children, at least one a girl. Of the outcomes GG, GB, BG and BB, how many remain possible?",
          hi: "किसी परिवार में दो बच्चे हैं, कम से कम एक लड़की। परिणामों GG, GB, BG और BB में से कितने संभव बचते हैं?",
          mr: "एका कुटुंबात दोन मुले आहेत, किमान एक मुलगी. निकाल GG, GB, BG आणि BB यांपैकी किती शक्य उरतात?",
        },
        answer: 3,
        wrong: [2, 4, 1],
        checkExpr: "4-1",
        solution: {
          en: "Three — only BB is ruled out. So the probability that both are girls is 1/3, not 1/2, and this is one of the most reliably counter-intuitive results in elementary probability. The reason the intuitive 1/2 is wrong is that 'at least one is a girl' does not identify WHICH child is the girl, so it eliminates one outcome rather than fixing one child's sex. Compare the different condition 'the elder is a girl': that eliminates two outcomes, BG and BB, leaving GG and GB, and the answer really is 1/2. The two conditions sound almost identical in English and shrink the sample space by different amounts, which is the whole lesson. Conditional probability is sensitive to exactly what was learned, and a slightly different piece of information about the same family gives a genuinely different answer. (2 assumes the condition fixes one child and leaves the other free.)",
          hi: "तीन — केवल BB बाहर होता है। अतः दोनों के लड़की होने की प्रायिकता 1/3 है, 1/2 नहीं, और यह प्रारंभिक प्रायिकता के सबसे भरोसेमंद ढंग से अंतर्ज्ञान-विरोधी परिणामों में से एक है। सहज 1/2 इसलिए ग़लत है कि 'कम से कम एक लड़की है' यह नहीं बताता कि कौन-सा बच्चा लड़की है, अतः वह किसी एक बच्चे का लिंग तय करने के बजाय एक परिणाम हटाता है। भिन्न शर्त 'बड़ी लड़की है' से तुलना करो: वह दो परिणाम हटाती है, BG और BB, GG और GB छोड़ते हुए, और उत्तर सचमुच 1/2 है। दोनों शर्तें अंग्रेज़ी में लगभग एक जैसी सुनाई देती हैं और प्रतिदर्श समष्टि को अलग-अलग मात्रा में सिकोड़ती हैं, और यही पूरा सबक़ है। सशर्त प्रायिकता ठीक इस पर संवेदनशील है कि क्या जाना गया, और उसी परिवार के बारे में थोड़ी भिन्न जानकारी सचमुच भिन्न उत्तर देती है। (2 मान लेता है कि शर्त एक बच्चा तय कर देती है और दूसरा मुक्त छोड़ती है।)",
          mr: "तीन — केवळ BB वगळला जातो. म्हणून दोन्ही मुली असण्याची संभाव्यता 1/3 आहे, 1/2 नव्हे, आणि हा प्राथमिक संभाव्यतेतील सर्वांत विश्वासार्हपणे अंतर्दृष्टी-विरोधी निकालांपैकी एक आहे. सहज 1/2 यासाठी चुकीचे आहे की 'किमान एक मुलगी आहे' हे सांगत नाही की कोणते मूल मुलगी आहे, म्हणून ते एका मुलाचे लिंग निश्चित करण्याऐवजी एक निकाल काढून टाकते. वेगळ्या अटीशी तुलना करा 'मोठी मुलगी आहे': ती दोन निकाल काढते, BG आणि BB, GG आणि GB सोडत, आणि उत्तर खरोखर 1/2 आहे. दोन्ही अटी इंग्रजीत जवळजवळ सारख्याच ऐकू येतात आणि नमुना अवकाश वेगवेगळ्या प्रमाणात आकुंचित करतात, आणि हाच अख्खा धडा आहे. सशर्त संभाव्यता नेमके काय कळले यावर संवेदनशील आहे, आणि त्याच कुटुंबाबद्दलची थोडी वेगळी माहिती खरोखर वेगळे उत्तर देते. (2 गृहीत धरते की अट एक मूल निश्चित करते आणि दुसरे मोकळे सोडते.)",
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
          en: "Toss two fair coins. Let A be 'first is heads', B 'second is heads', C 'the two match'. How many of the three pairs among A, B, C are independent?",
          hi: "दो न्यायसंगत सिक्के उछालो। A हो 'पहला चित', B 'दूसरा चित', C 'दोनों एक जैसे'. A, B, C में से तीन जोड़ों में कितनी स्वतंत्र हैं?",
          mr: "दोन न्याय्य नाणी उडवा. A म्हणजे 'पहिला छापा', B 'दुसरा छापा', C 'दोन्ही सारखे'. A, B, C यांतील तीन जोड्यांपैकी किती स्वतंत्र आहेत?",
        },
        answer: 3,
        wrong: [2, 1, 0],
        checkExpr: "1+2",
        solution: {
          en: "All three. Each event has probability 1/2, and each pair intersects in exactly one of the four outcomes, giving 1/4 = (1/2)(1/2) every time. So A, B and C are PAIRWISE independent. Now look at all three together: A and B both happening forces HH, which certainly matches, so P(C | A and B) = 1, not 1/2. The three events are not mutually independent, and the count of independent pairs is 3 while the triple fails. That gap is the point of the example, and it is the standard counterexample showing that mutual independence is strictly stronger than pairwise independence — checking every pair is not enough, and one must check every subset. The practical consequence is real rather than pedantic. Statistical procedures that assume independence usually need the mutual kind, while the evidence one can gather easily is pairwise: correlations are computed two variables at a time. So a set of measurements can look independent in every scatterplot and still contain a joint dependence that no pair reveals, and this is precisely how models built from pairwise correlations underestimate the chance of everything failing at once. (2 supposes that one pair must fail if the triple does.)",
          hi: "तीनों। हर घटना की प्रायिकता 1/2 है, और हर जोड़ा चार परिणामों में से ठीक एक में मिलता है, जिससे हर बार 1/4 = (1/2)(1/2) मिलता है। अतः A, B और C जोड़ीदार स्वतंत्र हैं। अब तीनों को एक साथ देखो: A और B दोनों का होना HH पर मजबूर करता है, जो निश्चित रूप से मेल खाता है, अतः P(C | A और B) = 1 है, 1/2 नहीं। तीनों घटनाएँ परस्पर स्वतंत्र नहीं हैं, और स्वतंत्र जोड़ों की गिनती 3 है जबकि त्रिक विफल है। वही अंतर उदाहरण का मुद्दा है, और यह मानक प्रतिउदाहरण है जो दिखाता है कि परस्पर स्वतंत्रता जोड़ीदार स्वतंत्रता से सख़्ती से मज़बूत है — हर जोड़ा जाँचना काफ़ी नहीं, हर उपसमुच्चय जाँचना होगा। व्यावहारिक परिणाम विद्वता-प्रदर्शन नहीं बल्कि असली है। स्वतंत्रता मान लेने वाली सांख्यिकीय प्रक्रियाओं को आम तौर पर परस्पर वाली चाहिए, जबकि जो साक्ष्य आसानी से जुटाया जा सकता है वह जोड़ीदार है: सहसंबंध एक बार में दो चरों पर निकाले जाते हैं। अतः मापों का कोई समुच्चय हर प्रकीर्ण-आलेख में स्वतंत्र दिख सकता है और फिर भी ऐसी संयुक्त परतंत्रता रख सकता है जिसे कोई जोड़ा उजागर नहीं करता, और ठीक इसी तरह जोड़ीदार सहसंबंधों से बने मॉडल सब कुछ एक साथ विफल होने की संभावना को कम आँकते हैं। (2 मान लेता है कि त्रिक विफल हो तो कोई जोड़ा भी विफल होना चाहिए।)",
          mr: "तिन्ही. प्रत्येक घटनेची संभाव्यता 1/2 आहे, आणि प्रत्येक जोडी चार निकालांपैकी नेमक्या एकात भेटते, ज्यातून दरवेळी 1/4 = (1/2)(1/2) मिळते. म्हणून A, B आणि C जोडीदार स्वतंत्र आहेत. आता तिन्ही एकत्र पाहा: A आणि B दोन्ही घडणे HH वर भाग पाडते, जे निश्चितपणे जुळते, म्हणून P(C | A आणि B) = 1 आहे, 1/2 नव्हे. तिन्ही घटना परस्पर स्वतंत्र नाहीत, आणि स्वतंत्र जोड्यांची मोजणी 3 आहे तर त्रिक अपयशी आहे. तीच दरी उदाहरणाचा मुद्दा आहे, आणि हे प्रमाण प्रतिउदाहरण आहे जे दाखवते की परस्पर स्वातंत्र्य जोडीदार स्वातंत्र्याहून काटेकोरपणे बळकट आहे — प्रत्येक जोडी तपासणे पुरेसे नाही, प्रत्येक उपसंच तपासावा लागेल. व्यावहारिक परिणाम पांडित्यप्रदर्शन नसून खरा आहे. स्वातंत्र्य गृहीत धरणाऱ्या संख्याशास्त्रीय प्रक्रियांना सर्वसाधारणपणे परस्पर प्रकार लागतो, तर जो पुरावा सहज गोळा करता येतो तो जोडीदार आहे: सहसंबंध एका वेळी दोन चलांवर काढले जातात. म्हणून मापांचा एखादा संच प्रत्येक विखार-आलेखात स्वतंत्र दिसू शकतो आणि तरीही असे संयुक्त परावलंबित्व बाळगू शकतो जे कोणतीही जोडी उघड करत नाही, आणि नेमक्या याच रीतीने जोडीदार सहसंबंधांतून बांधलेली प्रतिरूपे सर्वकाही एकाच वेळी अपयशी होण्याची शक्यता कमी लेखतात. (2 गृहीत धरते की त्रिक अपयशी झाल्यास एखादी जोडीही अपयशी असावी.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 5,
        stem: {
          en: "A random variable takes value 0 with probability 0.9 and 100 with probability 0.1. What is its mean?",
          hi: "कोई यादृच्छिक चर 0.9 प्रायिकता से मान 0 और 0.1 प्रायिकता से 100 लेता है। उसका माध्य क्या है?",
          mr: "एक यादृच्छिक चल 0.9 संभाव्यतेने मूल्य 0 आणि 0.1 संभाव्यतेने 100 घेतो. त्याचा मध्य किती?",
        },
        answer: 10,
        wrong: [50, 100, 0],
        checkExpr: "0.9*0+0.1*100",
        solution: {
          en: "0.9 × 0 + 0.1 × 100 = 10. Note what the answer is not: 10 is a value this variable NEVER takes, since its only outcomes are 0 and 100. That is worth sitting with, because 'mean' invites the reading 'typical', and here nothing is typical of 10 at all. The expectation is a weighted balance point, not a representative case, and for a lopsided distribution the two come apart completely. The practical form of this is everywhere. An insurance policy has an expected payout that no individual policy ever pays; an average of 2.4 children describes no family. Reporting a mean without a spread hides exactly the information that matters here — the variance of this variable is 900, so its standard deviation is 30, three times the mean itself, which is the number that would tell a reader the mean is not describing a typical outcome. (50 averages the two values without weighting them by their probabilities.)",
          hi: "0.9 × 0 + 0.1 × 100 = 10. ध्यान दो कि उत्तर क्या नहीं है: 10 ऐसा मान है जो यह चर कभी लेता ही नहीं, क्योंकि उसके परिणाम केवल 0 और 100 हैं। इस पर ठहरना ज़रूरी है, क्योंकि 'माध्य' 'विशिष्ट' पढ़ने का न्योता देता है, और यहाँ 10 का कुछ भी विशिष्ट नहीं। प्रत्याशा भारित संतुलन-बिंदु है, प्रतिनिधि मामला नहीं, और एकतरफ़ा बंटन के लिए दोनों पूरी तरह अलग हो जाते हैं। इसका व्यावहारिक रूप हर जगह है। किसी बीमा पॉलिसी का प्रत्याशित भुगतान वह है जो कोई एक पॉलिसी कभी नहीं चुकाती; औसतन 2.4 बच्चे किसी परिवार का वर्णन नहीं करते। फैलाव के बिना माध्य बताना ठीक वही जानकारी छिपाता है जो यहाँ मायने रखती है — इस चर का प्रसरण 900 है, अतः उसका मानक विचलन 30 है, माध्य से तीन गुना, और यही वह संख्या है जो पाठक को बताती कि माध्य किसी विशिष्ट परिणाम का वर्णन नहीं कर रहा। (50 दोनों मानों का औसत लेता है, उन्हें उनकी प्रायिकताओं से भारित किए बिना।)",
          mr: "0.9 × 0 + 0.1 × 100 = 10. लक्षात घ्या की उत्तर काय नाही: 10 हे असे मूल्य आहे जे हा चल कधीच घेत नाही, कारण त्याचे निकाल केवळ 0 आणि 100 आहेत. यावर थांबणे आवश्यक आहे, कारण 'मध्य' हा 'ठराविक' असे वाचण्याचे निमंत्रण देतो, आणि इथे 10 चे काहीच ठराविक नाही. अपेक्षा हा भारित संतुलन-बिंदू आहे, प्रातिनिधिक प्रसंग नव्हे, आणि एकतर्फी वितरणासाठी दोन्ही पूर्णपणे वेगळे होतात. याचे व्यावहारिक रूप सर्वत्र आहे. एखाद्या विमा पॉलिसीचा अपेक्षित परतावा असा आहे जो कोणतीही एक पॉलिसी कधीच देत नाही; सरासरी 2.4 मुले कोणत्याही कुटुंबाचे वर्णन करत नाहीत. पसाऱ्याविना मध्य सांगणे नेमकी तीच माहिती लपवते जी इथे महत्त्वाची आहे — या चलाचे प्रसरण 900 आहे, म्हणून त्याचे प्रमाण विचलन 30 आहे, मध्याच्या तिप्पट, आणि हीच ती संख्या आहे जी वाचकाला सांगेल की मध्य कोणत्याही ठराविक निकालाचे वर्णन करत नाही. (50 दोन्ही मूल्यांची सरासरी घेते, त्यांना त्यांच्या संभाव्यतांनी भारित न करता.)",
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
          en: "A rare disease affects 1 in 10,000. A 99%-accurate test comes back positive. Rounded to the nearest whole per cent, what is the chance the person actually has it?",
          hi: "कोई दुर्लभ रोग 10,000 में 1 को होता है। 99% सटीक जाँच धनात्मक आती है। निकटतम पूर्ण प्रतिशत तक, व्यक्ति को सचमुच रोग होने की संभावना क्या है?",
          mr: "एक दुर्मीळ रोग 10,000 मध्ये 1 ला होतो. 99% अचूक चाचणी धन येते. जवळच्या पूर्ण टक्क्यापर्यंत, व्यक्तीला खरोखर रोग असण्याची शक्यता किती?",
        },
        answer: 1,
        wrong: [99, 50, 10],
        checkExpr: "2-1",
        solution: {
          en: "About 1 per cent. Take a million people: 100 have the disease and 99 of them test positive; 999,900 are healthy and 1% of those — 9,999 — test positive falsely. So 10,098 positives, of whom 99 are ill: 99/10,098 ≈ 0.98%, which rounds to 1. The test is 99% accurate and a positive result still leaves the person 99% likely to be healthy, which sounds like a contradiction and is not. The confusion is between two different conditional probabilities: P(positive | ill) is 0.99, and P(ill | positive) is 0.0098. These are not the same quantity, and Bayes' theorem is precisely the machinery for converting one into the other — the conversion factor being the base rate, which is what the intuition silently ignores. Two consequences are worth stating. First, this inversion error has a name outside mathematics: in a courtroom it is the prosecutor's fallacy, where the probability of the evidence given innocence is presented as the probability of innocence given the evidence, and people have been convicted on it. Second, the practical response is not to distrust tests but to understand what screening does. Testing a whole population for a rare condition generates false positives that swamp the true ones, which is why medicine screens targeted groups where the base rate is higher, and why a positive screen is followed by a second, different test rather than by a diagnosis. The second test works not because it is more accurate but because after the first result the base rate is no longer 1 in 10,000 — it is about 1 in 100, and the same arithmetic then lands somewhere quite different. (99 reports the test's accuracy as though it were the answer, which is the error the question is built around.)",
          hi: "क़रीब 1 प्रतिशत। दस लाख लोग लो: 100 को रोग है और उनमें से 99 की जाँच धनात्मक आती है; 999,900 स्वस्थ हैं और उनमें से 1% — 9,999 — की जाँच झूठी धनात्मक आती है। अतः 10,098 धनात्मक, जिनमें 99 बीमार हैं: 99/10,098 ≈ 0.98%, जो 1 पर पूर्णांकित होता है। जाँच 99% सटीक है और धनात्मक परिणाम के बाद भी व्यक्ति के स्वस्थ होने की संभावना 99% है, जो विरोधाभास लगता है और है नहीं। भ्रम दो भिन्न सशर्त प्रायिकताओं के बीच है: P(धनात्मक | बीमार) 0.99 है, और P(बीमार | धनात्मक) 0.0098. ये एक राशि नहीं हैं, और बेज़ प्रमेय ठीक वही यंत्र है जो एक को दूसरे में बदलता है — रूपांतरण-गुणक है आधार-दर, जिसे अंतर्ज्ञान चुपचाप अनदेखा करता है। दो परिणाम कहने लायक़ हैं। पहला, इस उलटाव की भूल का गणित के बाहर एक नाम है: अदालत में वह अभियोजक का तर्कदोष है, जहाँ निर्दोषता मानकर साक्ष्य की प्रायिकता को साक्ष्य मानकर निर्दोषता की प्रायिकता की तरह पेश किया जाता है, और इस पर लोगों को दोषी ठहराया गया है। दूसरा, व्यावहारिक जवाब जाँचों पर अविश्वास करना नहीं बल्कि यह समझना है कि जन-जाँच करती क्या है। किसी दुर्लभ स्थिति के लिए पूरी जनसंख्या की जाँच ऐसे झूठे धनात्मक पैदा करती है जो सच्चों को डुबो देते हैं, इसीलिए चिकित्सा उन लक्षित समूहों की जाँच करती है जहाँ आधार-दर ऊँची है, और इसीलिए धनात्मक जन-जाँच के बाद निदान नहीं बल्कि दूसरी, भिन्न जाँच आती है। दूसरी जाँच इसलिए नहीं चलती कि वह अधिक सटीक है बल्कि इसलिए कि पहले परिणाम के बाद आधार-दर अब 10,000 में 1 नहीं — वह क़रीब 100 में 1 है, और वही गणित तब कहीं और जाकर उतरता है। (99 जाँच की सटीकता को ऐसे बताता है मानो वही उत्तर हो, और प्रश्न उसी भूल के इर्द-गिर्द बना है।)",
          mr: "सुमारे 1 टक्का. दहा लाख लोक घ्या: 100 जणांना रोग आहे आणि त्यांपैकी 99 ची चाचणी धन येते; 999,900 निरोगी आहेत आणि त्यांपैकी 1% — 9,999 — ची चाचणी खोटी धन येते. म्हणून 10,098 धन, ज्यांत 99 आजारी आहेत: 99/10,098 ≈ 0.98%, जे 1 वर पूर्णांकित होते. चाचणी 99% अचूक आहे आणि धन निकालानंतरही व्यक्ती निरोगी असण्याची शक्यता 99% आहे, जे विरोधाभास वाटते आणि नाही. गोंधळ दोन वेगळ्या सशर्त संभाव्यतांमध्ये आहे: P(धन | आजारी) 0.99 आहे, आणि P(आजारी | धन) 0.0098. या एक राशी नाहीत, आणि बेजचे प्रमेय नेमके तेच यंत्र आहे जे एकाला दुसऱ्यात बदलते — रूपांतरण-गुणक आहे आधार-दर, ज्याला अंतर्दृष्टी गुपचूप दुर्लक्षते. दोन परिणाम सांगण्याजोगे आहेत. पहिला, या उलटवण्याच्या चुकीला गणिताबाहेर एक नाव आहे: न्यायालयात तो अभियोक्त्याचा तर्कदोष आहे, जिथे निर्दोषत्व गृहीत धरून पुराव्याची संभाव्यता ही पुरावा गृहीत धरून निर्दोषत्वाची संभाव्यता म्हणून मांडली जाते, आणि यावर लोकांना दोषी ठरवले गेले आहे. दुसरा, व्यावहारिक प्रतिसाद चाचण्यांवर अविश्वास ठेवणे नव्हे तर जन-तपासणी काय करते हे समजून घेणे. एखाद्या दुर्मीळ स्थितीसाठी अख्ख्या लोकसंख्येची चाचणी असे खोटे धन तयार करते जे खऱ्यांना बुडवतात, म्हणूनच वैद्यक त्या लक्ष्यित गटांची तपासणी करते जिथे आधार-दर जास्त आहे, आणि म्हणूनच धन जन-तपासणीनंतर निदान नव्हे तर दुसरी, वेगळी चाचणी येते. दुसरी चाचणी यासाठी चालत नाही की ती अधिक अचूक आहे तर यासाठी की पहिल्या निकालानंतर आधार-दर आता 10,000 मध्ये 1 नाही — तो सुमारे 100 मध्ये 1 आहे, आणि तेच गणित मग कुठेतरी वेगळे जाऊन उतरते. (99 चाचणीची अचूकता अशी सांगते जणू तेच उत्तर असावे, आणि प्रश्न त्याच चुकीभोवती बांधलेला आहे.)",
        },
      },
      rand,
    ),
    numQ(
      {
        level: 6,
        stem: {
          en: "A treatment helps 70% of men and 70% of women, while a rival helps 80% of each. Pooling all patients, the rival can appear worse overall. Of the two group results and the pooled result, how many can point the same way as each other while the third disagrees?",
          hi: "कोई उपचार 70% पुरुषों और 70% स्त्रियों की मदद करता है, जबकि प्रतिद्वंद्वी हर एक के 80% की। सभी रोगियों को मिला देने पर प्रतिद्वंद्वी कुल मिलाकर बदतर दिख सकता है। दोनों समूह-परिणामों और मिले हुए परिणाम में से कितने एक ही ओर इशारा कर सकते हैं जबकि तीसरा असहमत हो?",
          mr: "एक उपचार 70% पुरुषांना आणि 70% स्त्रियांना मदत करतो, तर प्रतिस्पर्धी प्रत्येकाच्या 80% ला. सर्व रुग्ण एकत्र केल्यास प्रतिस्पर्धी एकूणात वाईट दिसू शकतो. दोन गट-निकाल आणि एकत्रित निकाल यांपैकी किती एकाच दिशेला निर्देश करू शकतात तर तिसरा असहमत असेल?",
        },
        answer: 2,
        wrong: [3, 1, 0],
        checkExpr: "3-1",
        solution: {
          en: "Two — the two group results agree with each other and the pooled result contradicts both. This is Simpson's paradox, and the numbers really do work. Suppose the rival is given mostly to a group that does badly anyway: 80 of 100 men helped by the rival but only 10 women out of 900 given it are counted, against the first treatment given to 900 men and 100 women. The group rates favour the rival everywhere, and the pooled totals favour the first treatment, because the two treatments were given to differently-composed populations and the pooling silently compares men mostly against women. Nothing is wrong with any of the three numbers. What is wrong is the assumption that a pooled rate answers the same question the group rates answer. The group comparison asks 'given a patient of known sex, which treatment is better', and the pooled comparison asks 'given a patient drawn from these particular treatment groups, which did better' — and the second question's answer depends on how the groups were assembled, which is not a fact about the treatments at all. Three things follow. First, the reversal is not a rare curiosity: it appears in university admissions data, in mortality statistics and in batting averages, and it is one of the main reasons observational studies mislead. Second, the resolution is never statistical but causal — one must know WHY the groups differ in composition before deciding which table to believe, and that knowledge does not come from the numbers. Third, the practical safeguard is randomisation, which works precisely because it makes the treatment groups similar in every respect including the ones nobody thought to measure, so that pooling and stratifying can no longer disagree. (3 supposes all three results can be made to disagree with one another, but two of them are group rates that here agree by construction.)",
          hi: "दो — दोनों समूह-परिणाम आपस में सहमत हैं और मिला हुआ परिणाम दोनों का खंडन करता है। यह सिम्पसन का विरोधाभास है, और संख्याएँ सचमुच काम करती हैं। मान लो प्रतिद्वंद्वी ज़्यादातर उस समूह को दिया गया जिसका हाल वैसे भी बुरा है: प्रतिद्वंद्वी से 100 में 80 पुरुष मदद पाते हैं पर उसे दी गई 900 में केवल 10 स्त्रियाँ गिनी जाती हैं, बनाम पहला उपचार जो 900 पुरुषों और 100 स्त्रियों को दिया गया। समूह-दरें हर जगह प्रतिद्वंद्वी के पक्ष में हैं, और मिले हुए कुल पहले उपचार के पक्ष में, क्योंकि दोनों उपचार भिन्न बनावट वाली जनसंख्याओं को दिए गए और मिलाना चुपचाप ज़्यादातर पुरुषों की तुलना स्त्रियों से कर देता है। तीनों संख्याओं में कुछ भी ग़लत नहीं। ग़लत यह मान्यता है कि मिली हुई दर वही प्रश्न उत्तरित करती है जो समूह-दरें करती हैं। समूह-तुलना पूछती है 'ज्ञात लिंग के रोगी के लिए कौन-सा उपचार बेहतर है', और मिली हुई तुलना पूछती है 'इन ख़ास उपचार-समूहों से खींचे गए रोगी के लिए किसने बेहतर किया' — और दूसरे प्रश्न का उत्तर इस पर निर्भर है कि समूह कैसे जुटाए गए, जो उपचारों का तथ्य है ही नहीं। तीन बातें निकलती हैं। पहली, यह पलटाव दुर्लभ जिज्ञासा नहीं: वह विश्वविद्यालय प्रवेश के आँकड़ों में, मृत्यु-दर की सांख्यिकी में और बल्लेबाज़ी औसतों में दिखता है, और प्रेक्षणात्मक अध्ययनों के भरमाने के मुख्य कारणों में से एक है। दूसरी, समाधान कभी सांख्यिकीय नहीं बल्कि कारणात्मक होता है — यह जानना ही होगा कि समूहों की बनावट क्यों भिन्न है, तब तय हो कि किस सारणी पर भरोसा करें, और वह ज्ञान संख्याओं से नहीं आता। तीसरी, व्यावहारिक सुरक्षा यादृच्छिकीकरण है, जो ठीक इसलिए चलता है कि वह उपचार-समूहों को हर पहलू में एक-सा बना देता है, उन पहलुओं में भी जिन्हें मापने की किसी ने सोची ही नहीं, ताकि मिलाना और स्तरित करना फिर असहमत न हो सकें। (3 मान लेता है कि तीनों परिणामों को आपस में असहमत किया जा सकता है, पर उनमें से दो समूह-दरें हैं जो यहाँ रचना से ही सहमत हैं।)",
          mr: "दोन — दोन गट-निकाल आपसात सहमत आहेत आणि एकत्रित निकाल दोघांचेही खंडन करतो. हा सिम्पसनचा विरोधाभास आहे, आणि संख्या खरोखर काम करतात. समजा प्रतिस्पर्धी बहुतांश त्या गटाला दिला गेला ज्याची अवस्था तशीही वाईट आहे: प्रतिस्पर्ध्याकडून 100 पैकी 80 पुरुष मदत मिळवतात पण त्याला दिलेल्या 900 पैकी केवळ 10 स्त्रिया मोजल्या जातात, विरुद्ध पहिला उपचार जो 900 पुरुष आणि 100 स्त्रियांना दिला गेला. गट-दर सर्वत्र प्रतिस्पर्ध्याच्या बाजूने आहेत, आणि एकत्रित एकूण पहिल्या उपचाराच्या बाजूने, कारण दोन्ही उपचार वेगळ्या रचनेच्या लोकसंख्यांना दिले गेले आणि एकत्र करणे गुपचूप बहुतांश पुरुषांची तुलना स्त्रियांशी करते. तिन्ही संख्यांत काहीच चूक नाही. चूक हे गृहीतक आहे की एकत्रित दर तोच प्रश्न उत्तरतो जो गट-दर उत्तरतात. गट-तुलना विचारते 'ज्ञात लिंगाच्या रुग्णासाठी कोणता उपचार चांगला आहे', आणि एकत्रित तुलना विचारते 'या विशिष्ट उपचार-गटांतून काढलेल्या रुग्णासाठी कोणी चांगले केले' — आणि दुसऱ्या प्रश्नाचे उत्तर गट कसे जमवले यावर अवलंबून आहे, जे उपचारांबद्दलचे तथ्य नाहीच. तीन गोष्टी निघतात. पहिली, हे उलटणे दुर्मीळ उत्सुकता नाही: ते विद्यापीठ प्रवेशाच्या आकडेवारीत, मृत्यू-दराच्या संख्याशास्त्रात आणि फलंदाजीच्या सरासरींत दिसते, आणि निरीक्षणात्मक अभ्यास फसवण्याच्या मुख्य कारणांपैकी एक आहे. दुसरी, निराकरण कधीच संख्याशास्त्रीय नसून कारणात्मक असते — गटांची रचना का वेगळी आहे हे जाणावेच लागते, मग ठरवावे की कोणत्या तक्त्यावर विश्वास ठेवावा, आणि ते ज्ञान संख्यांतून येत नाही. तिसरी, व्यावहारिक सुरक्षा म्हणजे यादृच्छिकीकरण, जे नेमके यासाठी चालते की ते उपचार-गट प्रत्येक बाबतीत सारखे करते, त्या बाबींतही ज्या मोजण्याचा कोणी विचारच केला नाही, जेणेकरून एकत्र करणे आणि स्तरित करणे पुन्हा असहमत होऊ शकणार नाहीत. (3 गृहीत धरते की तिन्ही निकाल आपसात असहमत करता येतील, पण त्यांपैकी दोन गट-दर आहेत जे इथे रचनेनेच सहमत आहेत.)",
        },
      },
      rand,
    ),
  );

  return topic(
    {
      slug: "maths-12-probability",
      subject: "MATHS",
      classLevel: 12,
      chapter: "Chapter 13 — Probability",
      name: "Probability",
      summary:
        "What a piece of information does to a chance, and how easily the wrong information is used: why mutually exclusive events with real probability are the most dependent events there are, why 'at least one is a girl' and 'the elder is a girl' shrink the sample space differently, why checking every pair is not the same as checking every subset, and why a 99% accurate test can leave someone 99% likely to be healthy.",
      position: 13,
      translations: {
        hi: {
          name: "प्रायिकता",
          summary:
            "कोई जानकारी किसी संभावना के साथ क्या करती है, और ग़लत जानकारी कितनी आसानी से बरती जाती है: असली प्रायिकता वाली परस्पर अपवर्जी घटनाएँ सबसे अधिक परतंत्र क्यों हैं, 'कम से कम एक लड़की है' और 'बड़ी लड़की है' प्रतिदर्श समष्टि को अलग-अलग क्यों सिकोड़ते हैं, हर जोड़ा जाँचना हर उपसमुच्चय जाँचने जैसा क्यों नहीं, और 99% सटीक जाँच के बाद भी किसी के स्वस्थ होने की संभावना 99% क्यों रह सकती है।",
        },
        mr: {
          name: "संभाव्यता",
          summary:
            "एखादी माहिती एखाद्या शक्यतेचे काय करते, आणि चुकीची माहिती किती सहज वापरली जाते: खरी संभाव्यता असलेल्या परस्पर अपवर्जक घटना सर्वाधिक परावलंबी का आहेत, 'किमान एक मुलगी आहे' आणि 'मोठी मुलगी आहे' नमुना अवकाश वेगवेगळ्या प्रकारे का आकुंचित करतात, प्रत्येक जोडी तपासणे प्रत्येक उपसंच तपासण्यासारखे का नाही, आणि 99% अचूक चाचणीनंतरही कोणी निरोगी असण्याची शक्यता 99% का राहू शकते.",
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
  continuityDifferentiability12(),
  applicationOfDerivatives12(),
  integrals12(),
  applicationOfIntegrals12(),
  differentialEquations12(),
  vectorAlgebra12(),
  threeDimensionalGeometry12(),
  linearProgramming12(),
  probability12(),
];
