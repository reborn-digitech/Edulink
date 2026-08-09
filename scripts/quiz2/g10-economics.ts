/**
 * Class 10 Economics — NCERT "Understanding Economic Development", chapter by
 * chapter, through the conceptual engine. What a country is actually trying to
 * achieve and how it would know: an average that hides who got what, sectors
 * counted by what they make and by who is protected, and credit that lifts one
 * borrower and buries another. Every measure is asked what it leaves out.
 *
 * ⚠ hi/mr text is the author's own, pending a native reader.
 */
import type { Chapter } from "./engine";

const SOURCE =
  "EduLink original, written against NCERT Understanding Economic Development (Class 10)";
const LICENCE = "CC-BY-SA-4.0";

export const G10_ECONOMICS: Chapter[] = [
  /* ----------------------------------------------------------------------- */
  /* Chapter 1 — Development                                                 */
  /* ----------------------------------------------------------------------- */
  {
    slug: "economics-10-development",
    subject: "ECONOMICS",
    classLevel: 10,
    chapter: {
      en: "Chapter 1 — Development",
      hi: "अध्याय 1 — विकास",
      mr: "प्रकरण 1 — विकास",
    },
    name: {
      en: "Development",
      hi: "विकास",
      mr: "विकास",
    },
    summary: {
      en: "A word everyone uses and nobody defines the same way: goals that differ by who is asked, an average that says nothing about who received it, a country rich in income and poor in years lived, an index that counts schooling and health beside money, facilities that no salary can buy alone — and a standard that must still be there for the people not yet born.",
      hi: "एक शब्द जिसे सब इस्तेमाल करते और कोई एक-सा परिभाषित नहीं करता: लक्ष्य जो पूछे गए व्यक्ति से बदल जाते, एक औसत जो यह नहीं बताता कि मिला किसे, वह देश जो आय में धनी और जिए वर्षों में निर्धन, वह सूचकांक जो पैसे के साथ पढ़ाई और स्वास्थ्य गिनता, वे सुविधाएँ जो अकेला वेतन नहीं ख़रीद सकता — और वह मानक जो अभी न जन्मे लोगों के लिए भी बचा रहना चाहिए।",
      mr: "एक शब्द जो सर्व वापरतात आणि कोणी सारखा व्याख्यायित करत नाही: कोणाला विचारले त्यानुसार बदलणारी ध्येये, कोणाला मिळाले हे न सांगणारी सरासरी, उत्पन्नात श्रीमंत आणि जगलेल्या वर्षांत गरीब असा देश, पैशाबरोबर शिक्षण व आरोग्य मोजणारा निर्देशांक, एकटा पगार विकत घेऊ न शकणाऱ्या सुविधा — आणि अजून न जन्मलेल्या लोकांसाठीही टिकून राहावे लागणारे मानक.",
    },
    position: 1,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "different-goals",
        name: {
          en: "Different people, different goals",
          hi: "अलग लोग, अलग लक्ष्य",
          mr: "वेगळे लोक, वेगळी ध्येये",
        },
        kind: "idea",
        prompt: {
          en: "A landless labourer wants more days of work and fair wages, a prosperous farmer wants a higher price for his crop, and a girl wants the freedom her brother already has — each calling their own goal development. Which observation is this?",
          hi: "भूमिहीन मज़दूर अधिक काम के दिन और उचित मज़दूरी चाहता है, समृद्ध किसान अपनी फ़सल का ऊँचा दाम, और एक लड़की वह स्वतंत्रता जो उसके भाई को पहले से है — हर एक अपने लक्ष्य को विकास कह रहा। यह कौन-सा प्रेक्षण है?",
          mr: "भूमिहीन मजुराला अधिक कामाचे दिवस आणि रास्त मजुरी हवी, संपन्न शेतकऱ्याला आपल्या पिकाला जास्त भाव, आणि एका मुलीला ते स्वातंत्र्य जे तिच्या भावाला आधीच आहे — प्रत्येक आपल्या ध्येयाला विकास म्हणत. हे कोणते निरीक्षण?",
        },
        statement: {
          en: "Different people have different and sometimes conflicting development goals, because what counts as development depends on a person's situation, and what is development for one may be destruction for another.",
          hi: "अलग-अलग लोगों के विकास-लक्ष्य अलग और कभी-कभी परस्पर विरोधी होते हैं, क्योंकि विकास क्या गिना जाए यह व्यक्ति की स्थिति पर निर्भर है, और जो एक के लिए विकास है वह दूसरे के लिए विनाश हो सकता है।",
          mr: "वेगवेगळ्या लोकांची विकास-ध्येये वेगळी आणि कधीकधी परस्परविरोधी असतात, कारण विकास काय गणावा हे व्यक्तीच्या परिस्थितीवर अवलंबून, आणि जे एकासाठी विकास ते दुसऱ्यासाठी विनाश असू शकते.",
        },
        detail: {
          en: "A dam that brings irrigation to one district is development for the farmers there and the loss of home and land for the villagers whose valley is submerged.",
          hi: "जो बाँध एक ज़िले को सिंचाई देता है वह वहाँ के किसानों के लिए विकास और उन गाँववालों के लिए घर तथा भूमि की हानि है जिनकी घाटी डूब जाती है।",
          mr: "जे धरण एका जिल्ह्याला सिंचन देते ते तिथल्या शेतकऱ्यांसाठी विकास आणि ज्यांचे खोरे बुडते त्या गावकऱ्यांसाठी घर व जमिनीची हानी.",
        },
        extra: {
          en: "This is why development is a matter for public argument rather than a technical question with one right answer computed by experts.",
          hi: "इसीलिए विकास सार्वजनिक बहस का विषय है, न कि ऐसा तकनीकी प्रश्न जिसका एक सही उत्तर विशेषज्ञ गणना से निकाल दें।",
          mr: "म्हणूनच विकास ही सार्वजनिक वादाची बाब आहे, तज्ज्ञांनी गणनेने काढलेले एक बरोबर उत्तर असलेला तांत्रिक प्रश्न नव्हे.",
        },
        pair: {
          left: {
            en: "One person's development, another's loss",
            hi: "एक का विकास, दूसरे की हानि",
            mr: "एकाचा विकास, दुसऱ्याची हानी",
          },
          right: {
            en: "different people, different goals",
            hi: "अलग लोग, अलग लक्ष्य",
            mr: "वेगळे लोक, वेगळी ध्येये",
          },
        },
      },
      {
        id: "per-capita-income",
        name: {
          en: "Per capita income",
          hi: "प्रति व्यक्ति आय",
          mr: "दरडोई उत्पन्न",
        },
        kind: "idea",
        prompt: {
          en: "A country's total income is divided by its population to give one figure that the World Bank uses to sort countries into rich, middle and low income. Which measure is this?",
          hi: "किसी देश की कुल आय को उसकी जनसंख्या से भाग देकर एक आँकड़ा निकाला जाता है जिससे विश्व बैंक देशों को उच्च, मध्यम और निम्न आय में छाँटता है। यह कौन-सा माप है?",
          mr: "एखाद्या देशाचे एकूण उत्पन्न त्याच्या लोकसंख्येने भागून एक आकडा काढला जातो ज्याने जागतिक बँक देशांना उच्च, मध्यम आणि कमी उत्पन्नात विभागते. हे कोणते माप?",
        },
        statement: {
          en: "Per capita income is a country's total income divided by its population, and it is the criterion the World Bank uses to classify countries by income level.",
          hi: "प्रति व्यक्ति आय किसी देश की कुल आय को उसकी जनसंख्या से भाग देने पर मिलती है, और यही कसौटी विश्व बैंक देशों को आय-स्तर से वर्गीकृत करने में लगाता है।",
          mr: "दरडोई उत्पन्न म्हणजे देशाचे एकूण उत्पन्न त्याच्या लोकसंख्येने भागलेले, आणि हीच कसोटी जागतिक बँक देशांना उत्पन्न-पातळीनुसार वर्गीकृत करण्यास वापरते.",
        },
        detail: {
          en: "It is an average, and an average is silent about distribution: the same figure can describe a country where most people are comfortable and one where a few are very rich.",
          hi: "यह औसत है, और औसत वितरण पर चुप रहता है: वही आँकड़ा ऐसे देश का वर्णन कर सकता है जहाँ अधिकांश लोग सुखी हैं और ऐसे का भी जहाँ थोड़े बहुत धनी हैं।",
          mr: "ही सरासरी, आणि सरासरी वाटपाबद्दल मौन: तोच आकडा अशा देशाचे वर्णन करू शकतो जिथे बहुतांश लोक सुखी आणि अशाचेही जिथे थोडे फार श्रीमंत.",
        },
        extra: {
          en: "It also says nothing about what money cannot buy privately — clean air, a safe street, a functioning hospital within reach.",
          hi: "यह उस बारे में भी कुछ नहीं कहता जो पैसा निजी तौर पर नहीं ख़रीद सकता — साफ़ हवा, सुरक्षित गली, पहुँच के भीतर चलता अस्पताल।",
          mr: "ते त्याबद्दलही काही सांगत नाही जे पैसा खासगीरीत्या विकत घेऊ शकत नाही — स्वच्छ हवा, सुरक्षित रस्ता, आवाक्यातले चालणारे रुग्णालय.",
        },
        pair: {
          left: {
            en: "Total income divided by population",
            hi: "कुल आय बटा जनसंख्या",
            mr: "एकूण उत्पन्न भागिले लोकसंख्या",
          },
          right: {
            en: "per capita income",
            hi: "प्रति व्यक्ति आय",
            mr: "दरडोई उत्पन्न",
          },
        },
      },
      {
        id: "non-income-measures",
        name: {
          en: "Non-income measures of development",
          hi: "विकास के आय-रहित माप",
          mr: "विकासाची उत्पन्न-रहित मापे",
        },
        kind: "idea",
        prompt: {
          en: "Kerala has a lower per capita income than several states yet a far lower infant mortality rate and higher literacy — figures that count deaths, years of schooling and years lived rather than rupees. What are these called?",
          hi: "केरल की प्रति व्यक्ति आय कई राज्यों से कम है फिर भी उसकी शिशु मृत्यु दर कहीं कम और साक्षरता ऊँची — ऐसे आँकड़े जो रुपये नहीं बल्कि मृत्यु, पढ़ाई के वर्ष और जिए वर्ष गिनते हैं। ये क्या कहलाते हैं?",
          mr: "केरळचे दरडोई उत्पन्न कित्येक राज्यांहून कमी तरीही त्याचा बालमृत्यू दर कितीतरी कमी आणि साक्षरता उच्च — असे आकडे जे रुपये नव्हे तर मृत्यू, शिक्षणाची वर्षे आणि जगलेली वर्षे मोजतात. यांना काय म्हणतात?",
        },
        statement: {
          en: "Non-income measures of development track infant mortality, literacy, school attendance and life expectancy, because health and education determine what a person can actually do with whatever income they have.",
          hi: "विकास के आय-रहित माप शिशु मृत्यु दर, साक्षरता, विद्यालय उपस्थिति और जीवन प्रत्याशा पर नज़र रखते हैं, क्योंकि स्वास्थ्य तथा शिक्षा तय करते हैं कि व्यक्ति अपनी जो भी आय हो उससे वस्तुतः कर क्या सकता है।",
          mr: "विकासाची उत्पन्न-रहित मापे बालमृत्यू दर, साक्षरता, शाळेतील उपस्थिती आणि आयुर्मान यांवर लक्ष ठेवतात, कारण आरोग्य आणि शिक्षण ठरवतात की व्यक्ती आपल्या जे काही उत्पन्न असेल त्यातून प्रत्यक्षात काय करू शकते.",
        },
        detail: {
          en: "Kerala's record is the standing example: better outcomes on health and schooling than richer states, achieved through public provision rather than higher private incomes.",
          hi: "केरल का रिकॉर्ड खड़ा उदाहरण है: अधिक धनी राज्यों से बेहतर स्वास्थ्य तथा पढ़ाई के परिणाम, जो ऊँची निजी आय से नहीं बल्कि सार्वजनिक व्यवस्था से पाए गए।",
          mr: "केरळचा लौकिक उभे उदाहरण: अधिक श्रीमंत राज्यांहून चांगले आरोग्य व शिक्षणाचे निकाल, जे उच्च खासगी उत्पन्नाने नव्हे तर सार्वजनिक व्यवस्थेने मिळवले.",
        },
        extra: {
          en: "The reasoning runs the other way too: an educated, healthy population earns more, so these are not only ends of development but means to it.",
          hi: "तर्क उल्टी ओर भी चलता है: शिक्षित, स्वस्थ आबादी अधिक कमाती है, अतः ये केवल विकास के लक्ष्य नहीं बल्कि उसके साधन भी हैं।",
          mr: "तर्क उलट दिशेनेही चालतो: शिक्षित, निरोगी लोकसंख्या अधिक कमावते, म्हणून ही केवळ विकासाची ध्येये नव्हेत तर त्याची साधनेही.",
        },
        pair: {
          left: {
            en: "Counting deaths, schooling and years lived",
            hi: "मृत्यु, पढ़ाई और जिए वर्षों की गिनती",
            mr: "मृत्यू, शिक्षण आणि जगलेली वर्षे मोजणे",
          },
          right: {
            en: "non-income measures of development",
            hi: "विकास के आय-रहित माप",
            mr: "विकासाची उत्पन्न-रहित मापे",
          },
        },
      },
      {
        id: "human-development-index",
        name: {
          en: "The Human Development Index",
          hi: "मानव विकास सूचकांक",
          mr: "मानव विकास निर्देशांक",
        },
        kind: "structure",
        prompt: {
          en: "The United Nations ranks countries each year using a combination of income, expected years of schooling and life expectancy, so that a rich country with poor health can rank below a poorer one. Which index is this?",
          hi: "संयुक्त राष्ट्र हर वर्ष देशों को आय, अपेक्षित विद्यालय-वर्षों और जीवन प्रत्याशा के मेल से क्रम देता है, ताकि ख़राब स्वास्थ्य वाला धनी देश किसी कम धनी देश से नीचे रह सके। यह कौन-सा सूचकांक है?",
          mr: "संयुक्त राष्ट्रे दरवर्षी देशांना उत्पन्न, अपेक्षित शालेय वर्षे आणि आयुर्मान यांच्या मिश्रणाने क्रमांक देतात, जेणेकरून वाईट आरोग्य असलेला श्रीमंत देश कमी श्रीमंत देशाहून खाली राहू शकेल. हा कोणता निर्देशांक?",
        },
        statement: {
          en: "The Human Development Index, published by the UNDP, ranks countries using income per person together with education and life expectancy, so that development is measured by what people can be and do, not by money alone.",
          hi: "यूएनडीपी द्वारा प्रकाशित मानव विकास सूचकांक देशों को प्रति व्यक्ति आय के साथ शिक्षा तथा जीवन प्रत्याशा से क्रम देता है, ताकि विकास इससे नापा जाए कि लोग क्या हो और कर सकते हैं, केवल पैसे से नहीं।",
          mr: "यूएनडीपीने प्रकाशित केलेला मानव विकास निर्देशांक देशांना दरडोई उत्पन्नासोबत शिक्षण व आयुर्मानाने क्रमांक देतो, जेणेकरून विकास लोक काय होऊ आणि करू शकतात यावरून मोजला जाईल, केवळ पैशाने नव्हे.",
        },
        detail: {
          en: "The idea behind it is that income is a means and not the end: what matters is the capabilities it buys, which is why health and schooling enter the count directly.",
          hi: "उसके पीछे विचार यह कि आय साधन है, लक्ष्य नहीं: मायने वह क्षमताएँ रखती हैं जो वह ख़रीदती है, इसीलिए स्वास्थ्य और पढ़ाई सीधे गिनती में आते हैं।",
          mr: "त्यामागील कल्पना ही की उत्पन्न हे साधन, ध्येय नव्हे: महत्त्व त्याने विकत घेतलेल्या क्षमतांचे, म्हणूनच आरोग्य व शिक्षण थेट मोजणीत येतात.",
        },
        extra: {
          en: "It still averages across a whole population, so a country can rise on the index while its poorest gain nothing — no single number escapes that limitation.",
          hi: "वह फिर भी पूरी आबादी पर औसत निकालता है, अतः कोई देश सूचकांक पर चढ़ सकता जबकि उसके सबसे निर्धन को कुछ न मिले — कोई एक संख्या उस सीमा से बच नहीं पाती।",
          mr: "तो तरीही अख्ख्या लोकसंख्येवर सरासरी काढतो, म्हणून एखादा देश निर्देशांकावर चढू शकतो तर त्याच्या सर्वांत गरिबांना काहीच मिळणार नाही — कोणतीही एक संख्या त्या मर्यादेतून सुटत नाही.",
        },
        pair: {
          left: {
            en: "Income, schooling and life expectancy combined",
            hi: "आय, पढ़ाई और जीवन प्रत्याशा एक साथ",
            mr: "उत्पन्न, शिक्षण आणि आयुर्मान एकत्र",
          },
          right: {
            en: "the Human Development Index",
            hi: "मानव विकास सूचकांक",
            mr: "मानव विकास निर्देशांक",
          },
        },
      },
      {
        id: "public-facilities",
        name: {
          en: "Public facilities",
          hi: "सार्वजनिक सुविधाएँ",
          mr: "सार्वजनिक सुविधा",
        },
        kind: "idea",
        prompt: {
          en: "A wealthy family can buy a car but not an uncongested road, bottled water but not a clean river, a private tutor but not an educated society — goods that must be provided collectively or not at all. What are these called?",
          hi: "धनी परिवार कार ख़रीद सकता है पर भीड़-रहित सड़क नहीं, बोतलबंद पानी पर साफ़ नदी नहीं, निजी शिक्षक पर शिक्षित समाज नहीं — ऐसी वस्तुएँ जो सामूहिक रूप से ही दी जा सकती हैं या बिलकुल नहीं। ये क्या कहलाती हैं?",
          mr: "श्रीमंत कुटुंब मोटार विकत घेऊ शकते पण गर्दीविना रस्ता नाही, बाटलीबंद पाणी पण स्वच्छ नदी नाही, खासगी शिक्षक पण शिक्षित समाज नाही — अशा वस्तू ज्या सामूहिकरीत्याच पुरवता येतात वा मुळीच नाही. यांना काय म्हणतात?",
        },
        statement: {
          en: "Public facilities are services such as schools, hospitals, roads, water supply and public safety that are best provided collectively, because individual income cannot purchase them and everyone benefits from their existence.",
          hi: "सार्वजनिक सुविधाएँ वे सेवाएँ हैं — विद्यालय, अस्पताल, सड़कें, जलापूर्ति और सार्वजनिक सुरक्षा — जो सामूहिक रूप से देना ही सबसे अच्छा है, क्योंकि व्यक्तिगत आय उन्हें ख़रीद नहीं सकती और उनके होने से सबका लाभ है।",
          mr: "सार्वजनिक सुविधा म्हणजे शाळा, रुग्णालये, रस्ते, पाणीपुरवठा आणि सार्वजनिक सुरक्षा अशा सेवा ज्या सामूहिकरीत्या पुरवणेच सर्वांत योग्य, कारण वैयक्तिक उत्पन्न त्या विकत घेऊ शकत नाही आणि त्या असण्याने सर्वांचा फायदा.",
        },
        detail: {
          en: "This is why a state with modest average income can outperform a richer one on health and literacy: what was spent collectively reached everybody.",
          hi: "इसी से मामूली औसत आय वाला राज्य किसी अधिक धनी से स्वास्थ्य तथा साक्षरता में आगे निकल सकता है: जो सामूहिक रूप से ख़र्च हुआ वह सब तक पहुँचा।",
          mr: "म्हणूनच माफक सरासरी उत्पन्न असलेले राज्य अधिक श्रीमंताहून आरोग्य व साक्षरतेत पुढे जाऊ शकते: जे सामूहिकरीत्या खर्च झाले ते सर्वांपर्यंत पोहोचले.",
        },
        extra: {
          en: "The public distribution system is one such facility, and where it works well people are better nourished regardless of what they earn.",
          hi: "सार्वजनिक वितरण प्रणाली ऐसी ही एक सुविधा है, और जहाँ वह ठीक चलती है वहाँ लोग बेहतर पोषित हैं चाहे वे कितना भी कमाएँ।",
          mr: "सार्वजनिक वितरण व्यवस्था अशीच एक सुविधा, आणि जिथे ती नीट चालते तिथे लोक अधिक चांगले पोषित असतात मग ते कितीही कमावोत.",
        },
        pair: {
          left: {
            en: "Goods no salary can buy on its own",
            hi: "वे वस्तुएँ जो अकेला वेतन नहीं ख़रीद सकता",
            mr: "एकटा पगार विकत घेऊ न शकणाऱ्या वस्तू",
          },
          right: {
            en: "public facilities",
            hi: "सार्वजनिक सुविधाएँ",
            mr: "सार्वजनिक सुविधा",
          },
        },
      },
      {
        id: "sustainability-of-development",
        name: {
          en: "Sustainability of development",
          hi: "विकास की स्थिरता",
          mr: "विकासाची शाश्वतता",
        },
        kind: "idea",
        prompt: {
          en: "Groundwater is being drawn faster than it refills and crude oil will run out within a few generations, so the question is whether today's rate of use leaves anything for those not yet born. Which requirement is this?",
          hi: "भूजल भरने से तेज़ खींचा जा रहा और कच्चा तेल कुछ पीढ़ियों में चुक जाएगा, अतः प्रश्न यह कि आज की उपयोग-दर अभी न जन्मे लोगों के लिए कुछ छोड़ती है या नहीं। यह कौन-सी आवश्यकता है?",
          mr: "भूजल भरण्याहून वेगाने उपसले जात आहे आणि कच्चे तेल काही पिढ्यांत संपेल, म्हणून प्रश्न हा की आजचा वापराचा दर अजून न जन्मलेल्यांसाठी काही ठेवतो का. ही कोणती आवश्यकता?",
        },
        statement: {
          en: "Sustainability requires that development meet present needs without reducing the ability of future generations to meet theirs, so a rate of use that exhausts a resource is not development but borrowing.",
          hi: "स्थिरता माँगती है कि विकास वर्तमान ज़रूरतें ऐसे पूरी करे कि भावी पीढ़ियों की अपनी ज़रूरतें पूरी करने की क्षमता न घटे, अतः जो उपयोग-दर संसाधन चुका दे वह विकास नहीं उधार है।",
          mr: "शाश्वतता मागते की विकासाने वर्तमान गरजा अशा भागवाव्यात की भावी पिढ्यांची स्वतःच्या गरजा भागवण्याची क्षमता घटणार नाही, म्हणून जो वापराचा दर संसाधन संपवतो तो विकास नव्हे तर उसनवारी.",
        },
        detail: {
          en: "The clearest Indian case is groundwater: extraction has exceeded recharge across large parts of the north-west, so a shortage is being manufactured for the next generation.",
          hi: "सबसे स्पष्ट भारतीय प्रकरण भूजल है: उत्तर-पश्चिम के बड़े हिस्सों में निकासी पुनर्भरण से आगे निकल चुकी, अतः अगली पीढ़ी के लिए कमी गढ़ी जा रही है।",
          mr: "सर्वांत स्पष्ट भारतीय प्रकरण भूजल: वायव्येच्या मोठ्या भागांत उपसा पुनर्भरणापुढे गेला आहे, म्हणून पुढच्या पिढीसाठी टंचाई घडवली जात आहे.",
        },
        extra: {
          en: "It is not an argument against using resources but against using them faster than they renew, and against counting the depletion as income.",
          hi: "यह संसाधनों के उपयोग के विरुद्ध तर्क नहीं बल्कि उन्हें नवीकरण से तेज़ इस्तेमाल करने के विरुद्ध है, और उस क्षय को आय गिनने के विरुद्ध।",
          mr: "हा संसाधने वापरण्याविरुद्धचा युक्तिवाद नव्हे तर ती नवीकरणाहून वेगाने वापरण्याविरुद्ध, आणि तो ऱ्हास उत्पन्न म्हणून मोजण्याविरुद्ध.",
        },
        pair: {
          left: {
            en: "Meeting today's needs without spending tomorrow's",
            hi: "कल का ख़र्च किए बिना आज की ज़रूरतें पूरी करना",
            mr: "उद्याचे खर्च न करता आजच्या गरजा भागवणे",
          },
          right: {
            en: "sustainability of development",
            hi: "विकास की स्थिरता",
            mr: "विकासाची शाश्वतता",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Two districts have exactly the same per capita income. In the first, most households earn close to that figure; in the second, a few families earn enormously and the rest earn very little. Explain what the average conceals, and what a planner should look at instead.",
          hi: "दो ज़िलों की प्रति व्यक्ति आय ठीक एक-सी है। पहले में अधिकांश परिवार उसी आँकड़े के आसपास कमाते हैं; दूसरे में कुछ परिवार बहुत अधिक कमाते और शेष बहुत कम। समझाओ औसत क्या छिपाता है, और योजनाकार को इसके बजाय क्या देखना चाहिए।",
          mr: "दोन जिल्ह्यांचे दरडोई उत्पन्न नेमके सारखे. पहिल्यात बहुतांश कुटुंबे त्याच आकड्याजवळ कमावतात; दुसऱ्यात काही कुटुंबे प्रचंड कमावतात आणि उरलेली फार कमी. समजावा सरासरी काय लपवते, आणि नियोजकाने त्याऐवजी काय पाहावे.",
        },
        choices: [
          {
            en: "The average conceals distribution entirely — it is the same figure whether income is spread evenly or concentrated in a few hands, so it says nothing about how most people actually live. A planner should look at how income is shared, and at outcomes money cannot summarise: infant mortality, literacy, school attendance, life expectancy and access to public facilities, since these reveal what has reached ordinary households",
            hi: "औसत वितरण को पूरी तरह छिपाता है — वह वही आँकड़ा है चाहे आय समान रूप से फैली हो या कुछ हाथों में केंद्रित, अतः वह इस बारे में कुछ नहीं कहता कि अधिकांश लोग वस्तुतः कैसे जीते हैं। योजनाकार को देखना चाहिए कि आय बँटी कैसे है, और वे परिणाम जिन्हें पैसा संक्षेप में नहीं कह सकता: शिशु मृत्यु दर, साक्षरता, विद्यालय उपस्थिति, जीवन प्रत्याशा और सार्वजनिक सुविधाओं तक पहुँच, क्योंकि ये बताते हैं कि साधारण घरों तक पहुँचा क्या",
            mr: "सरासरी वाटप पूर्णपणे लपवते — ती तोच आकडा असते मग उत्पन्न समानपणे पसरलेले असो वा काही हातांत केंद्रित, म्हणून ती बहुतांश लोक प्रत्यक्षात कसे जगतात याबद्दल काहीच सांगत नाही. नियोजकाने पाहावे की उत्पन्न कसे वाटले आहे, आणि ते निकाल जे पैसा थोडक्यात सांगू शकत नाही: बालमृत्यू दर, साक्षरता, शाळेतील उपस्थिती, आयुर्मान आणि सार्वजनिक सुविधांपर्यंतचा प्रवेश, कारण हे सांगतात की सामान्य घरांपर्यंत काय पोहोचले",
          },
          {
            en: "Nothing is concealed: two districts with the same average must have identical standards of living",
            hi: "कुछ नहीं छिपता: एक-सी औसत वाले दो ज़िलों का जीवन-स्तर समान ही होगा",
            mr: "काहीही लपत नाही: सारखी सरासरी असलेल्या दोन जिल्ह्यांचे राहणीमान सारखेच असेल",
          },
          {
            en: "The average conceals distribution, and the remedy is to stop measuring anything at all",
            hi: "औसत वितरण छिपाता है, और उपाय यह कि कुछ भी नापना बंद कर दिया जाए",
            mr: "सरासरी वाटप लपवते, आणि उपाय म्हणजे काहीही मोजणे थांबवणे",
          },
          {
            en: "Distribution is irrelevant because health and literacy depend only on total income, never on how it is shared",
            hi: "वितरण अप्रासंगिक है क्योंकि स्वास्थ्य और साक्षरता केवल कुल आय पर निर्भर हैं, कभी इस पर नहीं कि वह बँटी कैसे",
            mr: "वाटप असंबद्ध कारण आरोग्य आणि साक्षरता केवळ एकूण उत्पन्नावर अवलंबून, कधीही ते कसे वाटले यावर नाही",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "An average is a single number produced by throwing away all the information about who received what. Take a village of five households. If each earns ₹10,000 a month, the average is ₹10,000. If four earn ₹500 and the fifth earns ₹48,000, the average is still ₹10,000. The figure is identical; the two villages are not remotely alike. In the first, everyone can eat, send children to school and absorb a bad month. In the second, four families are destitute and one is wealthy, and no policy built on the average would notice. That is the whole of the problem: the mean is not wrong, it simply does not answer the question anyone actually cares about, which is how most people live. This is not a hypothetical defect. It is why per capita income can rise for a decade while malnutrition barely moves, and why two states with similar averages can differ enormously in how long their citizens live. So what should be looked at instead? Two kinds of thing. First, the distribution itself — how income is shared across households, what the poorest fifth receives, how many fall below a poverty line. A planner who knows the average and nothing else is blind to precisely the population most policy is meant to reach. Second, and more importantly, outcomes that money cannot summarise. Infant mortality tells you whether mothers reached medical care. Literacy and school attendance tell you whether children were in classrooms rather than at work. Life expectancy aggregates nutrition, sanitation, medical access and safety into one figure that no household can fake. These are attractive precisely because they cannot be concentrated: one family cannot hold the district's literacy the way it can hold the district's income. If most children are in school, most children are in school — the measure carries distributional information inside it. Kerala is the case the textbook returns to. Its per capita income has been lower than several states with higher averages, and yet its infant mortality is far lower and its literacy far higher. The explanation is not private wealth but public provision: schools, primary health centres and a functioning distribution system reached everybody, including those whose own income could not have bought any of it. That is also the argument for public facilities. A wealthy household can buy a private tutor but cannot buy an educated society; it can buy bottled water but not a clean river; it can buy a car but not an uncongested road. Where these are provided collectively, average income understates development; where they are absent, it overstates it. The general lesson is that a measure should be chosen for what it can reveal, not for what is easy to compute — and that any single number, including the Human Development Index, averages over people and therefore has to be read alongside the distribution it hides. (The wrong answers claim equal averages imply equal lives, abandon measurement altogether, or deny a link between distribution and human outcomes that the Kerala comparison directly contradicts.)",
          hi: "औसत एक ऐसी अकेली संख्या है जो यह सारी सूचना फेंककर बनती है कि किसे क्या मिला। पाँच घरों का गाँव लो। यदि हर एक महीने ₹10,000 कमाए, औसत ₹10,000। यदि चार ₹500 कमाएँ और पाँचवाँ ₹48,000, औसत फिर भी ₹10,000। आँकड़ा समान है; दोनों गाँव दूर-दूर तक एक-से नहीं। पहले में सब खा सकते, बच्चों को विद्यालय भेज सकते और बुरा महीना सह सकते हैं। दूसरे में चार परिवार कंगाल और एक धनी, और औसत पर बनी कोई नीति उसे भाँपेगी नहीं। समस्या पूरी यही है: माध्य ग़लत नहीं, वह बस उस प्रश्न का उत्तर नहीं देता जिसकी वस्तुतः किसी को परवाह है, यानी अधिकांश लोग जीते कैसे हैं। यह काल्पनिक दोष नहीं। इसी से प्रति व्यक्ति आय दशक भर चढ़ सकती जबकि कुपोषण मुश्किल से हिले, और इसी से एक-सी औसत वाले दो राज्य इसमें बहुत भिन्न हो सकते कि उनके नागरिक कितना जीते हैं। तो इसके बजाय देखा क्या जाए? दो तरह की चीज़ें। पहली, वितरण स्वयं — आय घरों में बँटी कैसे है, सबसे निर्धन पाँचवें हिस्से को क्या मिलता, कितने निर्धनता रेखा से नीचे गिरते हैं। जो योजनाकार औसत जानता और कुछ नहीं, वह ठीक उसी आबादी के प्रति अंधा है जिस तक अधिकांश नीति पहुँचनी चाहिए। दूसरी, और अधिक महत्वपूर्ण, वे परिणाम जिन्हें पैसा संक्षेप में नहीं कह सकता। शिशु मृत्यु दर बताती कि माताएँ चिकित्सा तक पहुँचीं या नहीं। साक्षरता और विद्यालय उपस्थिति बतातीं कि बच्चे काम पर थे या कक्षा में। जीवन प्रत्याशा पोषण, स्वच्छता, चिकित्सा-पहुँच और सुरक्षा को एक आँकड़े में जोड़ती है जिसे कोई घर नक़ली नहीं बना सकता। ये ठीक इसलिए आकर्षक हैं कि वे केंद्रित नहीं किए जा सकते: कोई एक परिवार ज़िले की साक्षरता वैसे नहीं थाम सकता जैसे ज़िले की आय थाम लेता है। यदि अधिकांश बच्चे विद्यालय में हैं, तो अधिकांश बच्चे विद्यालय में हैं — माप अपने भीतर वितरण की सूचना ढोता है। केरल वही प्रकरण है जिस पर पाठ्यपुस्तक लौटती है। उसकी प्रति व्यक्ति आय ऊँची औसत वाले कई राज्यों से कम रही है, फिर भी उसकी शिशु मृत्यु दर कहीं कम और साक्षरता कहीं ऊँची। व्याख्या निजी संपत्ति नहीं बल्कि सार्वजनिक व्यवस्था है: विद्यालय, प्राथमिक स्वास्थ्य केंद्र और चलती वितरण प्रणाली सब तक पहुँचे, उन तक भी जिनकी अपनी आय उनमें से कुछ भी नहीं ख़रीद सकती थी। यही सार्वजनिक सुविधाओं का तर्क भी है। धनी घर निजी शिक्षक ख़रीद सकता पर शिक्षित समाज नहीं; बोतलबंद पानी पर साफ़ नदी नहीं; कार पर भीड़-रहित सड़क नहीं। जहाँ ये सामूहिक रूप से दी जाती हैं वहाँ औसत आय विकास को कम बताती है; जहाँ वे नहीं हैं वहाँ बढ़ाकर। सामान्य सबक़ यह कि माप उससे चुना जाना चाहिए जो वह दिखा सके, उससे नहीं जो गणना में आसान हो — और यह कि कोई भी अकेली संख्या, मानव विकास सूचकांक भी, लोगों पर औसत निकालती है और इसलिए उस वितरण के साथ पढ़ी जानी चाहिए जिसे वह छिपाती है। (ग़लत उत्तर दावा करते कि बराबर औसत का अर्थ बराबर जीवन, माप ही छोड़ देते, या वितरण और मानवीय परिणामों के उस संबंध को नकारते जिसका केरल-तुलना सीधे खंडन करती है।)",
          mr: "सरासरी ही अशी एकच संख्या जी कोणाला काय मिळाले याची सर्व माहिती फेकून तयार होते. पाच घरांचे गाव घ्या. प्रत्येक महिन्याला ₹10,000 कमावत असेल, तर सरासरी ₹10,000. चार ₹500 कमावत असतील आणि पाचवा ₹48,000, तरी सरासरी ₹10,000. आकडा सारखा; दोन्ही गावे दूरवरही सारखी नाहीत. पहिल्यात सर्व खाऊ शकतात, मुलांना शाळेत पाठवू शकतात आणि वाईट महिना सोसू शकतात. दुसऱ्यात चार कुटुंबे कफल्लक आणि एक श्रीमंत, आणि सरासरीवर बांधलेले कोणतेही धोरण ते ओळखणार नाही. समस्या अख्खी हीच: मध्य चुकीचा नाही, तो फक्त ज्या प्रश्नाची प्रत्यक्षात कोणाला काळजी त्याचे उत्तर देत नाही, म्हणजे बहुतांश लोक कसे जगतात. हा काल्पनिक दोष नाही. म्हणूनच दरडोई उत्पन्न दशकभर चढू शकते तर कुपोषण जेमतेम हलते, आणि म्हणूनच सारख्या सरासरीची दोन राज्ये त्यांचे नागरिक किती जगतात यात प्रचंड वेगळी असू शकतात. मग त्याऐवजी काय पाहावे? दोन प्रकारच्या गोष्टी. पहिली, वाटप स्वतः — उत्पन्न घरांत कसे वाटले, सर्वांत गरीब पंचमांशाला काय मिळते, किती दारिद्र्यरेषेखाली पडतात. जो नियोजक सरासरी जाणतो आणि दुसरे काही नाही, तो नेमक्या त्याच लोकसंख्येबद्दल आंधळा जिच्यापर्यंत बहुतांश धोरण पोहोचायचे. दुसरी, आणि अधिक महत्त्वाची, ते निकाल जे पैसा थोडक्यात सांगू शकत नाही. बालमृत्यू दर सांगतो की माता वैद्यकीय सेवेपर्यंत पोहोचल्या का. साक्षरता आणि शाळेतील उपस्थिती सांगतात की मुले कामावर होती की वर्गात. आयुर्मान पोषण, स्वच्छता, वैद्यकीय प्रवेश आणि सुरक्षा एका आकड्यात जोडते जो कोणतेही घर बनावट करू शकत नाही. ही नेमकी यासाठी आकर्षक की ती केंद्रित करता येत नाहीत: कोणतेही एक कुटुंब जिल्ह्याची साक्षरता तशी धरू शकत नाही जशी जिल्ह्याचे उत्पन्न धरते. बहुतांश मुले शाळेत असतील, तर बहुतांश मुले शाळेत आहेत — माप स्वतःच्या आत वाटपाची माहिती वाहते. केरळ हेच ते प्रकरण ज्याकडे पाठ्यपुस्तक परतते. त्याचे दरडोई उत्पन्न उच्च सरासरीच्या कित्येक राज्यांहून कमी राहिले, तरीही त्याचा बालमृत्यू दर कितीतरी कमी आणि साक्षरता कितीतरी उच्च. स्पष्टीकरण खासगी संपत्ती नव्हे तर सार्वजनिक व्यवस्था: शाळा, प्राथमिक आरोग्य केंद्रे आणि चालणारी वितरण व्यवस्था सर्वांपर्यंत पोहोचली, त्यांच्यापर्यंतही ज्यांचे स्वतःचे उत्पन्न त्यांतील काहीही विकत घेऊ शकले नसते. हाच सार्वजनिक सुविधांचा युक्तिवादही. श्रीमंत घर खासगी शिक्षक विकत घेऊ शकते पण शिक्षित समाज नाही; बाटलीबंद पाणी पण स्वच्छ नदी नाही; मोटार पण गर्दीविना रस्ता नाही. जिथे ही सामूहिकरीत्या पुरवली जातात तिथे सरासरी उत्पन्न विकास कमी सांगते; जिथे ती नाहीत तिथे वाढवून. सामान्य धडा हा की माप ते काय दाखवू शकते यावरून निवडावे, गणनेत काय सोपे यावरून नाही — आणि हा की कोणतीही एकच संख्या, मानव विकास निर्देशांकही, लोकांवर सरासरी काढते आणि म्हणून ती लपवत असलेल्या वाटपासोबत वाचली जावी. (चुकीची उत्तरे समान सरासरी म्हणजे समान आयुष्ये असा दावा करतात, मोजणेच सोडून देतात, वा केरळ-तुलना थेट खोडत असलेला वाटप व मानवी निकालांतील संबंध नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "A government announces a large dam: it will irrigate a million hectares, generate power for three states, and submerge two hundred villages. Supporters and opponents both call their position development. Explain why this disagreement cannot be settled by economists alone, and what that implies about the word.",
          hi: "सरकार एक बड़े बाँध की घोषणा करती है: वह दस लाख हेक्टेयर सींचेगा, तीन राज्यों को बिजली देगा, और दो सौ गाँव डुबोएगा। समर्थक और विरोधी दोनों अपनी स्थिति को विकास कहते हैं। समझाओ यह असहमति अकेले अर्थशास्त्रियों से क्यों नहीं सुलझ सकती, और इससे उस शब्द के बारे में क्या निकलता है।",
          mr: "सरकार एका मोठ्या धरणाची घोषणा करते: ते दहा लाख हेक्टर सिंचेल, तीन राज्यांना वीज देईल, आणि दोनशे गावे बुडवेल. समर्थक आणि विरोधक दोघेही आपली भूमिका विकास म्हणतात. समजावा ही असहमती एकट्या अर्थतज्ज्ञांकडून का सुटू शकत नाही, आणि यातून त्या शब्दाबद्दल काय निघते.",
        },
        choices: [
          {
            en: "Because the disagreement is not about facts but about whose gain counts and how much. Economists can measure hectares irrigated, power generated and land submerged, but no calculation determines whether the gain to a million farmers justifies the loss of home, land and burial ground for the displaced, or how to weigh a future generation's water against a present community's dispossession. Development therefore names a contested political choice about goals and about who bears the cost, not a technical optimum",
            hi: "क्योंकि असहमति तथ्यों की नहीं बल्कि इसकी है कि किसका लाभ गिना जाए और कितना। अर्थशास्त्री सींचे हेक्टेयर, बनी बिजली और डूबी भूमि नाप सकते हैं, पर कोई गणना यह तय नहीं करती कि दस लाख किसानों का लाभ विस्थापितों के घर, भूमि तथा श्मशान की हानि को उचित ठहराता है या नहीं, न यह कि भावी पीढ़ी के पानी को वर्तमान समुदाय की बेदख़ली के सामने कैसे तौला जाए। अतः विकास लक्ष्यों और लागत कौन ढोए — इस बारे में विवादित राजनीतिक चुनाव का नाम है, तकनीकी इष्टतम का नहीं",
            mr: "कारण असहमती तथ्यांची नव्हे तर कोणाचा फायदा मोजावा आणि किती याची. अर्थतज्ज्ञ सिंचलेले हेक्टर, निर्माण झालेली वीज आणि बुडालेली जमीन मोजू शकतात, पण कोणतीही गणना हे ठरवत नाही की दहा लाख शेतकऱ्यांचा फायदा विस्थापितांच्या घर, जमीन व स्मशानाच्या हानीचे समर्थन करतो का, ना हे की भावी पिढीचे पाणी वर्तमान समुदायाच्या बेदखलीसमोर कसे तोलावे. म्हणून विकास हे ध्येये आणि खर्च कोण वाहतो याबद्दलच्या वादग्रस्त राजकीय निवडीचे नाव, तांत्रिक इष्टतमाचे नाही",
          },
          {
            en: "Because economists have not yet developed the formula, and once they do the question will have a single correct answer",
            hi: "क्योंकि अर्थशास्त्रियों ने अभी सूत्र नहीं बनाया, और बना लेने पर प्रश्न का एक ही सही उत्तर होगा",
            mr: "कारण अर्थतज्ज्ञांनी अजून सूत्र बनवलेले नाही, आणि ते बनवल्यावर प्रश्नाचे एकच बरोबर उत्तर असेल",
          },
          {
            en: "Because development has no meaning whatever, so any use of the word is empty",
            hi: "क्योंकि विकास का कोई अर्थ ही नहीं, अतः उस शब्द का हर प्रयोग खोखला है",
            mr: "कारण विकासाला कोणताही अर्थच नाही, म्हणून त्या शब्दाचा प्रत्येक वापर पोकळ",
          },
          {
            en: "Because the displaced villagers also benefit equally from the dam, so there is in fact no disagreement",
            hi: "क्योंकि विस्थापित गाँववालों को भी बाँध से बराबर लाभ मिलता है, अतः वस्तुतः कोई असहमति है ही नहीं",
            mr: "कारण विस्थापित गावकऱ्यांनाही धरणाचा समान फायदा होतो, म्हणून प्रत्यक्षात कोणतीही असहमती नाहीच",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Notice first what economists can settle, because it is a great deal. They can estimate how many hectares will be irrigated and by how much yields will rise; how much power will be generated and what it will displace; how many people will lose land and what that land is worth at market rates; what the reservoir will cost and how quickly it will silt up. All of this is contestable in the ordinary way — better data can change the answer. But now put the numbers side by side and ask the question that actually divides the two camps: is it right to do this? A million farmers gain assured water. Two hundred villages lose their fields, their houses, the temples and graves of their ancestors, and the social world those places held. To decide whether the first justifies the second, you need a rule for converting one into the other, and there is no such rule that everyone accepts. You can compensate at market value, and the displaced can reply that no price was ever offered for a community. You can say the greater number should prevail, and they can reply that a minority's home is not a resource available to the majority. Both are moral positions, and no additional measurement resolves the disagreement between them, because the disagreement is not about how large the effects are. It is about how they should be weighed, and against whom. This is exactly the point the chapter opens with: different people have different development goals, and what is development for one may be destruction for another. The landless labourer wants work and wages; the large farmer wants a high crop price, which means the labourer's food costs more. An industrialist wants cheap power; the villagers of the valley want their valley. These are not misunderstandings to be cleared up by better information. They are conflicts of interest, and a conflict of interest is settled by politics — by who is consulted, who has a vote, who can be heard in court, and who is present when the decision is made. Three consequences follow, and they run through the whole book. First, procedure matters as much as outcome. If the displaced were never consulted, the decision is defective even if the dam is justified, which is precisely why environmental clearance, public hearing and resettlement requirements became legal obligations after the Narmada agitation. Second, the question of who bears the cost cannot be separated from the question of whether the project is worthwhile, because a project whose benefits go to one region and whose costs fall on another is not the same project as one where both fall together. Third, sustainability adds a third party who cannot speak at all: a future generation whose groundwater or forest is being spent now has no representative in the room, which is why the criterion has to be written into the rules rather than left to negotiation. None of this means development is meaningless — the wrong answer that tempts a clever student. It means development is a normative idea: it necessarily contains a judgement about what a good life requires and whose life counts, and any definition that hides this is smuggling a political choice inside a technical vocabulary. The honest position is to state the goals openly, name who gains and who pays, and then argue — which is what a democracy is for. (The wrong answers await a formula that could not exist even in principle, dismiss a word that names something real, or deny a loss the displaced have documented for decades.)",
          hi: "पहले ध्यान दो कि अर्थशास्त्री क्या तय कर सकते हैं, क्योंकि वह बहुत कुछ है। वे आँक सकते हैं कि कितने हेक्टेयर सींचे जाएँगे और पैदावार कितनी चढ़ेगी; कितनी बिजली बनेगी और वह किसे हटाएगी; कितने लोग भूमि खोएँगे और वह भूमि बाज़ार दर पर कितने की है; जलाशय की लागत क्या और वह कितनी जल्दी गाद से भरेगा। यह सब साधारण ढंग से विवाद-योग्य है — बेहतर आँकड़े उत्तर बदल सकते हैं। पर अब संख्याएँ अगल-बग़ल रखो और वह प्रश्न पूछो जो वस्तुतः दोनों खेमों को बाँटता है: क्या यह करना ठीक है? दस लाख किसानों को निश्चित पानी मिलता है। दो सौ गाँव अपने खेत, अपने घर, अपने पुरखों के मंदिर और क़ब्रें, और वह सामाजिक संसार खोते हैं जो उन जगहों में बसा था। यह तय करने को कि पहला दूसरे को उचित ठहराता है या नहीं, तुम्हें एक को दूसरे में बदलने का नियम चाहिए, और ऐसा कोई नियम नहीं जिसे सब मानें। तुम बाज़ार मूल्य पर मुआवज़ा दे सकते हो, और विस्थापित उत्तर दे सकते हैं कि किसी समुदाय का दाम कभी लगाया ही नहीं गया। तुम कह सकते हो कि बड़ी संख्या की चले, और वे उत्तर दे सकते हैं कि अल्पसंख्यक का घर बहुमत के लिए उपलब्ध संसाधन नहीं। दोनों नैतिक स्थितियाँ हैं, और कोई अतिरिक्त माप उनके बीच की असहमति नहीं सुलझाता, क्योंकि असहमति इस बारे में नहीं कि प्रभाव कितने बड़े हैं। वह इस बारे में है कि उन्हें तौला कैसे जाए, और किसके विरुद्ध। यही वह बिंदु है जिससे अध्याय खुलता है: अलग-अलग लोगों के विकास-लक्ष्य अलग होते हैं, और जो एक के लिए विकास है वह दूसरे के लिए विनाश हो सकता है। भूमिहीन मज़दूर काम और मज़दूरी चाहता है; बड़ा किसान फ़सल का ऊँचा दाम, जिसका अर्थ मज़दूर का भोजन महँगा। उद्योगपति सस्ती बिजली चाहता है; घाटी के गाँववाले अपनी घाटी। ये बेहतर सूचना से दूर हो जाने वाली ग़लतफ़हमियाँ नहीं। ये हितों के टकराव हैं, और हितों का टकराव राजनीति से सुलझता है — इससे कि किससे राय ली गई, किसके पास मत है, कौन अदालत में सुना जा सकता, और निर्णय के समय कौन मौजूद था। तीन परिणाम निकलते हैं, और वे पूरी पुस्तक में चलते हैं। पहला, प्रक्रिया परिणाम जितनी ही मायने रखती है। यदि विस्थापितों से कभी राय ली ही न गई, तो निर्णय दोषपूर्ण है भले बाँध उचित हो, और ठीक इसीलिए नर्मदा आंदोलन के बाद पर्यावरणीय अनापत्ति, जन-सुनवाई तथा पुनर्वास की शर्तें क़ानूनी दायित्व बनीं। दूसरा, लागत कौन ढोए यह प्रश्न इस प्रश्न से अलग नहीं किया जा सकता कि परियोजना योग्य है या नहीं, क्योंकि जिस परियोजना के लाभ एक क्षेत्र को और लागतें दूसरे पर पड़ें वह उससे भिन्न परियोजना है जहाँ दोनों साथ पड़ते हों। तीसरा, स्थिरता एक तीसरा पक्ष जोड़ती है जो बोल ही नहीं सकता: वह भावी पीढ़ी जिसका भूजल या वन अभी ख़र्च हो रहा, कमरे में उसका कोई प्रतिनिधि नहीं, इसीलिए वह कसौटी नियमों में लिखनी पड़ती है, बातचीत पर छोड़ी नहीं जा सकती। इसमें से कुछ भी यह नहीं कहता कि विकास निरर्थक है — वही ग़लत उत्तर जो चतुर छात्र को लुभाता है। इसका अर्थ है कि विकास एक आदर्शमूलक विचार है: उसमें अनिवार्यतः यह निर्णय समाया है कि अच्छे जीवन को क्या चाहिए और किसका जीवन गिना जाए, और जो भी परिभाषा इसे छिपाए वह तकनीकी शब्दावली के भीतर एक राजनीतिक चुनाव तस्करी से भेज रही है। ईमानदार स्थिति यह कि लक्ष्य खुलकर कहे जाएँ, नाम लिया जाए कि लाभ किसे और चुकाता कौन, और फिर बहस हो — लोकतंत्र इसी के लिए है। (ग़लत उत्तर ऐसे सूत्र की प्रतीक्षा करते जो सिद्धांततः भी हो नहीं सकता, ऐसे शब्द को झटकते जो कुछ असली नामित करता, या उस हानि को नकारते जिसे विस्थापितों ने दशकों दर्ज किया है।)",
          mr: "आधी लक्षात घ्या अर्थतज्ज्ञ काय ठरवू शकतात, कारण ते बरेच आहे. ते अंदाजू शकतात की किती हेक्टर सिंचले जातील आणि उत्पादन किती चढेल; किती वीज निर्माण होईल आणि ती कशाला हटवेल; किती लोक जमीन गमावतील आणि ती जमीन बाजारभावाने किती; जलाशयाचा खर्च काय आणि तो किती लवकर गाळाने भरेल. हे सर्व सामान्य पद्धतीने वादयोग्य — चांगली आकडेवारी उत्तर बदलू शकते. पण आता संख्या शेजारीशेजारी ठेवा आणि तो प्रश्न विचारा जो प्रत्यक्षात दोन्ही गटांना विभागतो: हे करणे योग्य आहे का? दहा लाख शेतकऱ्यांना खात्रीशीर पाणी मिळते. दोनशे गावे आपली शेते, आपली घरे, आपल्या पूर्वजांची मंदिरे व समाध्या, आणि त्या जागांत वसलेले सामाजिक जग गमावतात. पहिला दुसऱ्याचे समर्थन करतो का हे ठरवायला तुम्हाला एकाचे दुसऱ्यात रूपांतर करण्याचा नियम लागतो, आणि असा कोणताही नियम नाही जो सर्व मान्य करतील. तुम्ही बाजारमूल्याने मोबदला देऊ शकता, आणि विस्थापित उत्तर देऊ शकतात की कोणत्याही समुदायाची किंमत कधी लावलीच गेली नाही. तुम्ही म्हणू शकता की मोठ्या संख्येचे चालावे, आणि ते उत्तर देऊ शकतात की अल्पसंख्याकाचे घर बहुमतासाठी उपलब्ध संसाधन नाही. दोन्ही नैतिक भूमिका, आणि कोणतेही जादा मोजमाप त्यांच्यातील असहमती सोडवत नाही, कारण असहमती परिणाम किती मोठे याबद्दल नाही. ती ते कसे तोलावेत आणि कोणाविरुद्ध याबद्दल. हाच तो मुद्दा ज्याने प्रकरण उघडते: वेगवेगळ्या लोकांची विकास-ध्येये वेगळी, आणि जे एकासाठी विकास ते दुसऱ्यासाठी विनाश असू शकते. भूमिहीन मजुराला काम आणि मजुरी हवी; मोठ्या शेतकऱ्याला पिकाला जास्त भाव, म्हणजे मजुराचे अन्न महाग. उद्योगपतीला स्वस्त वीज हवी; खोऱ्यातील गावकऱ्यांना आपले खोरे. ही चांगल्या माहितीने दूर होणारी गैरसमजूत नाहीत. ही हितसंघर्ष आहेत, आणि हितसंघर्ष राजकारणाने सुटतो — कोणाला विचारले, कोणाकडे मत आहे, कोण न्यायालयात ऐकला जाऊ शकतो, आणि निर्णयाच्या वेळी कोण हजर होते यावरून. तीन परिणाम निघतात, आणि ते अख्ख्या पुस्तकातून चालतात. पहिला, प्रक्रिया निकालाइतकीच महत्त्वाची. विस्थापितांना कधी विचारलेच नसेल, तर निर्णय सदोष जरी धरण समर्थनीय असले तरी, आणि नेमके म्हणूनच नर्मदा आंदोलनानंतर पर्यावरणीय मंजुरी, जनसुनावणी व पुनर्वसनाच्या अटी कायदेशीर बंधने बनल्या. दुसरा, खर्च कोण वाहतो हा प्रश्न प्रकल्प योग्य आहे का या प्रश्नापासून वेगळा करता येत नाही, कारण ज्या प्रकल्पाचे फायदे एका प्रदेशाला आणि खर्च दुसऱ्यावर पडतात तो असा प्रकल्प नाही जिथे दोन्ही एकत्र पडतात. तिसरा, शाश्वतता एक तिसरा पक्ष जोडते जो बोलूच शकत नाही: ती भावी पिढी जिचे भूजल वा जंगल आता खर्च होत आहे, खोलीत तिचा कोणी प्रतिनिधी नाही, म्हणूनच ती कसोटी नियमांत लिहावी लागते, वाटाघाटीवर सोडता येत नाही. यातील काहीही विकास निरर्थक आहे असे सांगत नाही — तेच चुकीचे उत्तर जे हुशार विद्यार्थ्याला मोहवते. याचा अर्थ विकास ही आदर्शमूलक कल्पना: तिच्यात अपरिहार्यपणे चांगल्या आयुष्याला काय लागते आणि कोणाचे आयुष्य मोजावे हा निवाडा सामावलेला, आणि जी व्याख्या हे लपवते ती तांत्रिक शब्दसंग्रहाच्या आत एक राजकीय निवड चोरून पाठवत आहे. प्रामाणिक भूमिका ही की ध्येये उघड सांगावीत, फायदा कोणाला आणि किंमत कोण मोजतो याचे नाव घ्यावे, आणि मग वाद घालावा — लोकशाही यासाठीच आहे. (चुकीची उत्तरे तत्त्वतःही अस्तित्वात नसू शकणाऱ्या सूत्राची वाट पाहतात, काहीतरी खरे नामित करणारा शब्द झटकतात, वा विस्थापितांनी दशके नोंदवलेली हानी नाकारतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 2 — Sectors of the Indian Economy                               */
  /* ----------------------------------------------------------------------- */
  {
    slug: "economics-10-sectors",
    subject: "ECONOMICS",
    classLevel: 10,
    chapter: {
      en: "Chapter 2 — Sectors of the Indian Economy",
      hi: "अध्याय 2 — भारतीय अर्थव्यवस्था के क्षेत्रक",
      mr: "प्रकरण 2 — भारतीय अर्थव्यवस्थेची क्षेत्रे",
    },
    name: {
      en: "Sectors of the Indian Economy",
      hi: "भारतीय अर्थव्यवस्था के क्षेत्रक",
      mr: "भारतीय अर्थव्यवस्थेची क्षेत्रे",
    },
    summary: {
      en: "The same economy sorted three different ways and each cut telling something the others hide: what is grown, made and served; the one number that counts only final goods; work that is registered against work that is not; the field where five people do three people's job; and the law that promises a hundred days to anyone who asks.",
      hi: "वही अर्थव्यवस्था तीन अलग तरीक़ों से छाँटी और हर कटान वह बताती जो बाक़ी छिपाती हैं: क्या उगाया, बनाया और परोसा गया; वह एक संख्या जो केवल अंतिम वस्तुएँ गिनती; दर्ज काम बनाम बिना दर्ज काम; वह खेत जहाँ पाँच लोग तीन का काम करते; और वह क़ानून जो माँगने वाले किसी को भी सौ दिन का वादा करता।",
      mr: "तीच अर्थव्यवस्था तीन वेगळ्या प्रकारे विभागलेली आणि प्रत्येक छेद ते सांगणारा जे इतर लपवतात: काय पिकवले, बनवले आणि सेवा दिली; ती एक संख्या जी केवळ अंतिम वस्तू मोजते; नोंदलेले काम विरुद्ध न नोंदलेले; ते शेत जिथे पाच माणसे तिघांचे काम करतात; आणि तो कायदा जो मागणाऱ्या कोणालाही शंभर दिवसांचे वचन देतो.",
    },
    position: 2,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "primary-secondary-tertiary",
        name: {
          en: "The primary, secondary and tertiary sectors",
          hi: "प्राथमिक, द्वितीयक और तृतीयक क्षेत्रक",
          mr: "प्राथमिक, द्वितीयक आणि तृतीयक क्षेत्रे",
        },
        kind: "idea",
        prompt: {
          en: "Growing cotton, spinning it into cloth, and carrying that cloth to a shop are three different kinds of activity — one drawing on nature, one transforming a material, one helping the other two. Which classification is this?",
          hi: "कपास उगाना, उसे कातकर कपड़ा बनाना, और वह कपड़ा दुकान तक ले जाना तीन भिन्न तरह की गतिविधियाँ हैं — एक प्रकृति से लेती, एक सामग्री बदलती, एक बाक़ी दो की मदद करती। यह कौन-सा वर्गीकरण है?",
          mr: "कापूस पिकवणे, तो कातून कापड बनवणे, आणि ते कापड दुकानापर्यंत नेणे या तीन वेगळ्या प्रकारच्या क्रिया — एक निसर्गातून घेणारी, एक पदार्थ बदलणारी, एक बाकी दोघांना मदत करणारी. हे कोणते वर्गीकरण?",
        },
        statement: {
          en: "Activities are classified as primary when they draw directly on nature, secondary when they transform natural products into manufactured goods, and tertiary when they provide services that support the other two.",
          hi: "गतिविधियाँ प्राथमिक कहलाती हैं जब वे सीधे प्रकृति से लेती हैं, द्वितीयक जब वे प्राकृतिक उत्पादों को निर्मित वस्तुओं में बदलती हैं, और तृतीयक जब वे ऐसी सेवाएँ देती हैं जो बाक़ी दो को सहारा दें।",
          mr: "क्रिया प्राथमिक म्हटल्या जातात जेव्हा त्या थेट निसर्गातून घेतात, द्वितीयक जेव्हा त्या नैसर्गिक उत्पादांचे उत्पादित वस्तूंत रूपांतर करतात, आणि तृतीयक जेव्हा त्या बाकी दोघांना आधार देणाऱ्या सेवा पुरवतात.",
        },
        detail: {
          en: "The three are not separate economies but stages of one chain: without the crop there is nothing to spin, and without transport there is nothing to sell.",
          hi: "तीनों अलग अर्थव्यवस्थाएँ नहीं बल्कि एक ही शृंखला के चरण हैं: फ़सल बिना कातने को कुछ नहीं, और परिवहन बिना बेचने को कुछ नहीं।",
          mr: "तिन्ही वेगळ्या अर्थव्यवस्था नव्हेत तर एकाच साखळीचे टप्पे: पिकाविना कातायला काही नाही, आणि वाहतुकीविना विकायला काही नाही.",
        },
        extra: {
          en: "In India the tertiary sector now produces the largest share of output while the primary sector still employs the largest share of workers — a mismatch that defines the country's employment problem.",
          hi: "भारत में तृतीयक क्षेत्रक अब उत्पादन का सबसे बड़ा हिस्सा देता है जबकि प्राथमिक क्षेत्रक अब भी सबसे अधिक मज़दूरों को रोज़गार देता — यही बेमेल देश की रोज़गार-समस्या तय करता है।",
          mr: "भारतात तृतीयक क्षेत्र आता उत्पादनाचा सर्वांत मोठा वाटा देते तर प्राथमिक क्षेत्र अजूनही सर्वाधिक कामगारांना रोजगार देते — हीच विसंगती देशाची रोजगार-समस्या ठरवते.",
        },
        pair: {
          left: {
            en: "From nature, transformed, and served",
            hi: "प्रकृति से, बदला हुआ, और परोसा गया",
            mr: "निसर्गातून, बदललेले, आणि सेवा दिलेले",
          },
          right: {
            en: "the primary, secondary and tertiary sectors",
            hi: "प्राथमिक, द्वितीयक और तृतीयक क्षेत्रक",
            mr: "प्राथमिक, द्वितीयक आणि तृतीयक क्षेत्रे",
          },
        },
      },
      {
        id: "gross-domestic-product",
        name: {
          en: "Gross Domestic Product",
          hi: "सकल घरेलू उत्पाद",
          mr: "सकल देशांतर्गत उत्पादन",
        },
        kind: "idea",
        prompt: {
          en: "To measure a year's production without counting the wheat, then the flour, then the bread made from it three times over, only the value of goods reaching the final buyer is added up. Which measure is this?",
          hi: "किसी वर्ष का उत्पादन नापने को — गेहूँ, फिर आटा, फिर उससे बनी रोटी को तीन बार गिने बिना — केवल अंतिम ख़रीदार तक पहुँचती वस्तुओं का मूल्य जोड़ा जाता है। यह कौन-सा माप है?",
          mr: "एखाद्या वर्षाचे उत्पादन मोजायला — गहू, मग पीठ, मग त्यातून बनलेली भाकरी तीनदा न मोजता — केवळ अंतिम खरेदीदारापर्यंत पोहोचणाऱ्या वस्तूंचे मूल्य बेरजेत घेतले जाते. हे कोणते माप?",
        },
        statement: {
          en: "Gross Domestic Product is the total value of all final goods and services produced within a country in a year, counting only final products so that the value of intermediate goods is not added twice.",
          hi: "सकल घरेलू उत्पाद किसी देश में एक वर्ष में उत्पादित सब अंतिम वस्तुओं तथा सेवाओं का कुल मूल्य है, जिसमें केवल अंतिम उत्पाद गिने जाते ताकि मध्यवर्ती वस्तुओं का मूल्य दुबारा न जुड़े।",
          mr: "सकल देशांतर्गत उत्पादन म्हणजे एखाद्या देशात एका वर्षात उत्पादित सर्व अंतिम वस्तू व सेवांचे एकूण मूल्य, ज्यात केवळ अंतिम उत्पादने मोजली जातात जेणेकरून मध्यवर्ती वस्तूंचे मूल्य दुसऱ्यांदा जोडले जाणार नाही.",
        },
        detail: {
          en: "It is measured sector by sector and then added, which is how one can see the tertiary sector's share overtaking the primary sector's over the decades.",
          hi: "यह क्षेत्रक-दर-क्षेत्रक नापा और फिर जोड़ा जाता है, इसी से दिखता है कि दशकों में तृतीयक क्षेत्रक का हिस्सा प्राथमिक से आगे निकला।",
          mr: "ते क्षेत्रागणिक मोजले आणि मग बेरजेत घेतले जाते, म्हणूनच दिसते की दशकांत तृतीयक क्षेत्राचा वाटा प्राथमिकाहून पुढे गेला.",
        },
        extra: {
          en: "It counts what is bought and sold, so unpaid housework does not appear in it, and so a river cleaned adds to it while a river polluted does not subtract.",
          hi: "यह वही गिनता जो ख़रीदा-बेचा जाए, अतः बिना वेतन घरेलू काम उसमें आता ही नहीं, और साफ़ की गई नदी उसमें जुड़ती है जबकि प्रदूषित की गई घटती नहीं।",
          mr: "ते तेच मोजते जे विकत घेतले-विकले जाते, म्हणून बिनपगारी घरकाम त्यात येतच नाही, आणि स्वच्छ केलेली नदी त्यात जोडली जाते तर प्रदूषित केलेली वजा होत नाही.",
        },
        pair: {
          left: {
            en: "Final goods only, counted once",
            hi: "केवल अंतिम वस्तुएँ, एक ही बार गिनी",
            mr: "केवळ अंतिम वस्तू, एकदाच मोजलेल्या",
          },
          right: {
            en: "Gross Domestic Product",
            hi: "सकल घरेलू उत्पाद",
            mr: "सकल देशांतर्गत उत्पादन",
          },
        },
      },
      {
        id: "organised-unorganised",
        name: {
          en: "Organised and unorganised sectors",
          hi: "संगठित और असंगठित क्षेत्रक",
          mr: "संघटित आणि असंघटित क्षेत्रे",
        },
        kind: "idea",
        prompt: {
          en: "One worker has a fixed appointment letter, provident fund, paid leave and hours set by law; another is hired by the day, dismissed without notice and appears in no register. Which division of employment is this?",
          hi: "एक मज़दूर के पास नियत नियुक्ति-पत्र, भविष्य निधि, सवेतन अवकाश और क़ानून से तय घंटे हैं; दूसरा दिहाड़ी पर रखा जाता, बिना सूचना हटाया जाता और किसी रजिस्टर में आता ही नहीं। यह रोज़गार का कौन-सा विभाजन है?",
          mr: "एका कामगाराकडे ठरलेले नियुक्तिपत्र, भविष्यनिर्वाह निधी, पगारी रजा आणि कायद्याने ठरलेले तास; दुसरा रोजंदारीवर ठेवला जातो, सूचनेविना काढला जातो आणि कोणत्याही नोंदवहीत येतच नाही. ही रोजगाराची कोणती विभागणी?",
        },
        statement: {
          en: "The organised sector is registered with the government and its workers have terms of employment protected by law, while the unorganised sector consists of small scattered units where employment is irregular, wages are unregulated and there is little job security.",
          hi: "संगठित क्षेत्रक सरकार के पास पंजीकृत है और उसके मज़दूरों की रोज़गार-शर्तें क़ानून से संरक्षित हैं, जबकि असंगठित क्षेत्रक छोटी बिखरी इकाइयों का है जहाँ रोज़गार अनियमित, मज़दूरी अनियंत्रित और नौकरी की सुरक्षा नाममात्र है।",
          mr: "संघटित क्षेत्र सरकारकडे नोंदणीकृत आणि त्याच्या कामगारांच्या रोजगार-अटी कायद्याने संरक्षित, तर असंघटित क्षेत्र लहान विखुरलेल्या एककांचे जिथे रोजगार अनियमित, मजुरी अनियंत्रित आणि नोकरीची सुरक्षा नगण्य.",
        },
        detail: {
          en: "The great majority of Indian workers are in the unorganised sector, including nearly all farm labourers, construction workers, street vendors and home-based workers.",
          hi: "भारतीय मज़दूरों का बड़ा बहुमत असंगठित क्षेत्रक में है, जिसमें लगभग सब खेत-मज़दूर, निर्माण मज़दूर, फेरीवाले और घर-आधारित मज़दूर शामिल हैं।",
          mr: "भारतीय कामगारांचा मोठा बहुसंख्य भाग असंघटित क्षेत्रात, ज्यात जवळजवळ सर्व शेतमजूर, बांधकाम कामगार, फेरीवाले आणि घरून काम करणारे समाविष्ट.",
        },
        extra: {
          en: "The distinction is about protection rather than the kind of work: a driver employed by a company and one driving the same vehicle on daily hire do identical work under entirely different terms.",
          hi: "भेद काम के प्रकार का नहीं, संरक्षण का है: कंपनी में नियुक्त चालक और वही वाहन दिहाड़ी पर चलाता चालक एक ही काम बिलकुल भिन्न शर्तों पर करते हैं।",
          mr: "भेद कामाच्या प्रकाराचा नव्हे तर संरक्षणाचा: कंपनीत नेमलेला चालक आणि तेच वाहन रोजंदारीवर चालवणारा चालक एकच काम अगदी वेगळ्या अटींवर करतात.",
        },
        pair: {
          left: {
            en: "Registered and protected, or neither",
            hi: "पंजीकृत और संरक्षित, या दोनों नहीं",
            mr: "नोंदणीकृत आणि संरक्षित, वा दोन्ही नाही",
          },
          right: {
            en: "organised and unorganised sectors",
            hi: "संगठित और असंगठित क्षेत्रक",
            mr: "संघटित आणि असंघटित क्षेत्रे",
          },
        },
      },
      {
        id: "underemployment",
        name: {
          en: "Underemployment",
          hi: "अल्प-रोज़गार",
          mr: "अल्प-रोजगार",
        },
        kind: "idea",
        prompt: {
          en: "Five members of a family work all day on a plot that three could manage, and if two left for the city the harvest would be unchanged — everyone appears employed and some are producing nothing. What condition is this?",
          hi: "किसी परिवार के पाँच सदस्य ऐसे खेत पर दिन भर काम करते हैं जिसे तीन सँभाल सकते, और यदि दो शहर चले जाएँ तो फ़सल अपरिवर्तित रहेगी — सब रोज़गार में दिखते हैं और कुछ कुछ भी उत्पादन नहीं कर रहे। यह कौन-सी स्थिति है?",
          mr: "एखाद्या कुटुंबातील पाच सदस्य अशा शेतावर दिवसभर काम करतात जे तिघे सांभाळू शकतील, आणि दोघे शहरात गेले तर पीक तेवढेच राहील — सर्व रोजगारात दिसतात आणि काही काहीही उत्पादन करत नाहीत. ही कोणती स्थिती?",
        },
        statement: {
          en: "Underemployment is a situation in which people appear to be at work but contribute little or nothing to output, so removing some of them would leave production unchanged.",
          hi: "अल्प-रोज़गार वह स्थिति है जिसमें लोग काम पर दिखते हैं पर उत्पादन में कम या कुछ भी योगदान नहीं करते, अतः उनमें से कुछ को हटा देने पर उत्पादन अपरिवर्तित रहेगा।",
          mr: "अल्प-रोजगार म्हणजे ती स्थिती जिच्यात लोक कामावर दिसतात पण उत्पादनात कमी वा काहीच योगदान देत नाहीत, म्हणून त्यांतील काहींना काढल्यास उत्पादन तेवढेच राहील.",
        },
        detail: {
          en: "It is hidden rather than visible: nobody is idle in the ordinary sense, so it does not show up as unemployment in any register.",
          hi: "यह दिखता नहीं, छिपा रहता है: साधारण अर्थ में कोई ख़ाली नहीं बैठा, अतः वह किसी रजिस्टर में बेरोज़गारी के रूप में नहीं आता।",
          mr: "हा दिसत नाही, लपलेला असतो: सामान्य अर्थाने कोणी रिकामा बसलेला नाही, म्हणून तो कोणत्याही नोंदवहीत बेरोजगारी म्हणून येत नाही.",
        },
        extra: {
          en: "It is concentrated in agriculture because a family holding cannot dismiss its own members, and it also appears among casual urban workers who find only a few days of work a month.",
          hi: "यह कृषि में केंद्रित है क्योंकि पारिवारिक जोत अपने ही सदस्यों को हटा नहीं सकती, और उन दिहाड़ी शहरी मज़दूरों में भी दिखता है जिन्हें महीने में कुछ ही दिन काम मिलता है।",
          mr: "हा शेतीत केंद्रित कारण कौटुंबिक शेत स्वतःच्याच सदस्यांना काढू शकत नाही, आणि तो त्या रोजंदारी शहरी कामगारांतही दिसतो ज्यांना महिन्यात काही मोजकेच दिवस काम मिळते.",
        },
        pair: {
          left: {
            en: "At work all day, adding nothing to the harvest",
            hi: "दिन भर काम पर, फ़सल में कुछ न जोड़ते",
            mr: "दिवसभर कामावर, पिकात काहीच न जोडणारे",
          },
          right: {
            en: "underemployment",
            hi: "अल्प-रोज़गार",
            mr: "अल्प-रोजगार",
          },
        },
      },
      {
        id: "employment-guarantee",
        name: {
          en: "The employment guarantee",
          hi: "रोज़गार गारंटी",
          mr: "रोजगार हमी",
        },
        kind: "law",
        prompt: {
          en: "A law entitles every rural household whose adults are willing to do unskilled manual work to a hundred days of wage employment a year, and to an allowance if the work is not provided. Which measure is this?",
          hi: "एक क़ानून हर ग्रामीण परिवार को — जिसके वयस्क अकुशल शारीरिक काम करने को तैयार हों — वर्ष में सौ दिन का मज़दूरी-रोज़गार और काम न दिए जाने पर भत्ता पाने का हक़ देता है। यह कौन-सा उपाय है?",
          mr: "एक कायदा प्रत्येक ग्रामीण कुटुंबाला — ज्याचे प्रौढ अकुशल शारीरिक काम करायला तयार असतील — वर्षात शंभर दिवसांचा मजुरी-रोजगार आणि काम न दिल्यास भत्ता मिळण्याचा हक्क देतो. हा कोणता उपाय?",
        },
        statement: {
          en: "The employment guarantee gives every rural household a legal right to a hundred days of wage work a year, with an unemployment allowance payable if the government fails to provide it.",
          hi: "रोज़गार गारंटी हर ग्रामीण परिवार को वर्ष में सौ दिन के मज़दूरी-काम का क़ानूनी अधिकार देती है, और सरकार न दे सके तो बेरोज़गारी भत्ता देय होता है।",
          mr: "रोजगार हमी प्रत्येक ग्रामीण कुटुंबाला वर्षात शंभर दिवसांच्या मजुरी-कामाचा कायदेशीर हक्क देते, आणि सरकार देऊ शकले नाही तर बेरोजगारी भत्ता देय.",
        },
        detail: {
          en: "It is a right rather than a scheme, which is what makes it different: a household that is refused work can demand the allowance instead of waiting for a programme to reach it.",
          hi: "यह योजना नहीं अधिकार है, यही उसे भिन्न बनाता है: जिस परिवार को काम न मिले वह किसी कार्यक्रम के पहुँचने की प्रतीक्षा करने के बजाय भत्ता माँग सकता है।",
          mr: "ही योजना नव्हे तर हक्क, हेच तिला वेगळे करते: ज्या कुटुंबाला काम नाकारले जाते ते एखाद्या कार्यक्रमाच्या पोहोचण्याची वाट पाहण्याऐवजी भत्ता मागू शकते.",
        },
        extra: {
          en: "The work is chosen to build lasting assets — ponds, canals, roads, plantations — so the wages paid also leave the village something behind.",
          hi: "काम ऐसा चुना जाता जो टिकाऊ परिसंपत्तियाँ बनाए — तालाब, नहरें, सड़कें, वृक्षारोपण — अतः चुकाई मज़दूरी गाँव के पीछे कुछ छोड़ भी जाती है।",
          mr: "काम असे निवडले जाते जे टिकाऊ मालमत्ता घडवेल — तळी, कालवे, रस्ते, वृक्षलागवड — म्हणून दिलेली मजुरी गावामागे काहीतरी ठेवूनही जाते.",
        },
        pair: {
          left: {
            en: "A hundred days claimable as a right",
            hi: "अधिकार के रूप में माँगे जा सकते सौ दिन",
            mr: "हक्क म्हणून मागता येणारे शंभर दिवस",
          },
          right: {
            en: "the employment guarantee",
            hi: "रोज़गार गारंटी",
            mr: "रोजगार हमी",
          },
        },
      },
      {
        id: "public-sector-role",
        name: {
          en: "The public sector's role",
          hi: "सार्वजनिक क्षेत्रक की भूमिका",
          mr: "सार्वजनिक क्षेत्राची भूमिका",
        },
        kind: "idea",
        prompt: {
          en: "Some activities must be provided even where nobody can be charged enough to cover the cost — a village road, a primary school, a vaccine drive, a dam too large for any firm to build. Whose responsibility are these?",
          hi: "कुछ गतिविधियाँ तब भी देनी पड़ती हैं जब किसी से लागत भर वसूला ही न जा सके — गाँव की सड़क, प्राथमिक विद्यालय, टीकाकरण अभियान, किसी भी फ़र्म के बनाने से बड़ा बाँध। ये किसकी ज़िम्मेदारी हैं?",
          mr: "काही क्रिया तेव्हाही पुरवाव्या लागतात जेव्हा कोणाकडून खर्चाइतकेही वसूल करता येत नाही — गावचा रस्ता, प्राथमिक शाळा, लसीकरण मोहीम, कोणत्याही कंपनीला बांधता येणार नाही इतके मोठे धरण. या कोणाची जबाबदारी?",
        },
        statement: {
          en: "The public sector provides goods and services that private firms will not supply because they cannot be sold at a profit, and it supports activities that private producers depend on but could not build for themselves.",
          hi: "सार्वजनिक क्षेत्रक वे वस्तुएँ और सेवाएँ देता है जो निजी फ़र्में इसलिए नहीं देंगी कि उन्हें लाभ पर बेचा नहीं जा सकता, और उन गतिविधियों को सहारा देता है जिन पर निजी उत्पादक निर्भर हैं पर जिन्हें वे स्वयं बना नहीं सकते।",
          mr: "सार्वजनिक क्षेत्र त्या वस्तू व सेवा पुरवते ज्या खासगी कंपन्या यासाठी पुरवणार नाहीत की त्या नफ्यावर विकता येत नाहीत, आणि त्या क्रियांना आधार देते ज्यांवर खासगी उत्पादक अवलंबून पण ज्या ते स्वतः उभारू शकत नाहीत.",
        },
        detail: {
          en: "It also buys crops at a support price and runs the public distribution system, which keeps both farmers' incomes and consumers' food prices from collapsing.",
          hi: "वह समर्थन मूल्य पर फ़सलें भी ख़रीदता और सार्वजनिक वितरण प्रणाली चलाता है, जो किसानों की आय और उपभोक्ताओं के खाद्य दाम दोनों को ढहने से रोकती है।",
          mr: "ते आधारभूत किमतीवर पिकेही खरेदी करते आणि सार्वजनिक वितरण व्यवस्था चालवते, जी शेतकऱ्यांचे उत्पन्न आणि ग्राहकांचे अन्नधान्य भाव दोन्ही कोसळण्यापासून रोखते.",
        },
        extra: {
          en: "The argument is not that the state should produce everything, but that some things will not exist at all unless somebody provides them without expecting to profit.",
          hi: "तर्क यह नहीं कि राज्य सब कुछ बनाए, बल्कि यह कि कुछ चीज़ें होंगी ही नहीं जब तक कोई उन्हें लाभ की आशा बिना न दे।",
          mr: "युक्तिवाद हा नाही की राज्याने सर्व काही बनवावे, तर हा की काही गोष्टी अस्तित्वातच येणार नाहीत जोवर कोणी त्या नफ्याच्या अपेक्षेविना पुरवत नाही.",
        },
        pair: {
          left: {
            en: "What must exist even though it cannot be sold",
            hi: "जो होना ही चाहिए भले बेचा न जा सके",
            mr: "जे असावेच लागते जरी विकता येत नसले",
          },
          right: {
            en: "the public sector's role",
            hi: "सार्वजनिक क्षेत्रक की भूमिका",
            mr: "सार्वजनिक क्षेत्राची भूमिका",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Over the decades the tertiary sector has grown to produce the largest share of India's output, while the primary sector still employs the largest share of its workers. Explain what this mismatch means for the people involved, and why it is treated as a problem rather than a success.",
          hi: "दशकों में तृतीयक क्षेत्रक बढ़कर भारत के उत्पादन का सबसे बड़ा हिस्सा देने लगा, जबकि प्राथमिक क्षेत्रक अब भी उसके सबसे अधिक मज़दूरों को रोज़गार देता है। समझाओ इस बेमेल का उसमें शामिल लोगों के लिए क्या अर्थ है, और उसे सफलता नहीं समस्या क्यों माना जाता।",
          mr: "दशकांत तृतीयक क्षेत्र वाढून भारताच्या उत्पादनाचा सर्वांत मोठा वाटा देऊ लागले, तर प्राथमिक क्षेत्र अजूनही त्याच्या सर्वाधिक कामगारांना रोजगार देते. समजावा या विसंगतीचा त्यात सामील लोकांसाठी काय अर्थ, आणि तिला यश नव्हे तर समस्या का मानले जाते.",
        },
        choices: [
          {
            en: "It means output per worker differs sharply between sectors: a shrinking share of production is being divided among the largest group of workers, so agricultural incomes stay low while service incomes rise. Many of those workers are underemployed — they could leave without reducing the harvest — and the sector has not shed them because industry and organised services have not created enough jobs to absorb them",
            hi: "इसका अर्थ है कि प्रति मज़दूर उत्पादन क्षेत्रकों में तीखा भिन्न है: उत्पादन का सिकुड़ता हिस्सा मज़दूरों के सबसे बड़े समूह में बँट रहा, अतः कृषि-आय कम बनी रहती जबकि सेवा-आय चढ़ती है। उन मज़दूरों में कई अल्प-रोज़गार में हैं — वे जा सकते हैं और फ़सल घटेगी नहीं — और क्षेत्रक ने उन्हें इसलिए नहीं छोड़ा कि उद्योग तथा संगठित सेवाओं ने उन्हें समाने भर नौकरियाँ बनाई ही नहीं",
            mr: "याचा अर्थ प्रति कामगार उत्पादन क्षेत्रांत तीव्र वेगळे: उत्पादनाचा आकुंचणारा वाटा कामगारांच्या सर्वांत मोठ्या गटात वाटला जात आहे, म्हणून शेतीचे उत्पन्न कमी राहते तर सेवांचे उत्पन्न चढते. त्या कामगारांपैकी अनेक अल्प-रोजगारात — ते जाऊ शकतात आणि पीक घटणार नाही — आणि क्षेत्राने त्यांना यासाठी सोडले नाही की उद्योग व संघटित सेवांनी त्यांना सामावण्याइतक्या नोकऱ्या निर्माण केल्याच नाहीत",
          },
          {
            en: "It means agriculture has become the most productive sector per worker, which is why so many remain in it",
            hi: "इसका अर्थ है कि कृषि प्रति मज़दूर सबसे उत्पादक क्षेत्रक बन गई, इसीलिए इतने लोग उसमें बने हुए हैं",
            mr: "याचा अर्थ शेती प्रति कामगार सर्वांत उत्पादक क्षेत्र बनली, म्हणूनच इतके लोक तिच्यात राहिले",
          },
          {
            en: "There is no mismatch: the share of output and the share of employment are identical in every sector",
            hi: "कोई बेमेल नहीं: हर क्षेत्रक में उत्पादन का हिस्सा और रोज़गार का हिस्सा समान हैं",
            mr: "कोणतीही विसंगती नाही: प्रत्येक क्षेत्रात उत्पादनाचा वाटा आणि रोजगाराचा वाटा सारखेच",
          },
          {
            en: "It is simply a success, since a large tertiary sector always means everyone in the country is prosperous",
            hi: "यह बस सफलता है, क्योंकि बड़ा तृतीयक क्षेत्रक सदा यही अर्थ रखता कि देश में सब समृद्ध हैं",
            mr: "ही फक्त यशस्वीता, कारण मोठे तृतीयक क्षेत्र सदैव हाच अर्थ ठेवते की देशात सर्व समृद्ध",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "Put the two numbers side by side and the arithmetic does the explaining. If a sector produces a small share of national output while employing a large share of workers, then output per worker in that sector must be low — that is not an interpretation, it is division. And output per worker is, roughly, what determines what a worker can earn. So a country in this position has most of its people in its least productive activity, which is another way of saying that most of its people are poor. This is why the pattern is read as a problem. In the sequence economists expected, a country's workers move out of agriculture as farming becomes more productive and needs fewer hands, and they are absorbed by manufacturing, which pays better; later, services grow on top of a large industrial base. Britain and much of Europe followed something like that path. India's transition has been incomplete in a specific way: output moved out of agriculture, but workers largely did not. The share of GDP coming from farming fell steadily while the share of workers employed there fell far more slowly, leaving a growing gap. The reason is that manufacturing did not expand fast enough to take them. Industry's share of employment has stayed stubbornly modest, and much of the service growth has been in activities requiring education and skills that a farm labourer does not have — software, finance, communications. The service jobs available to those without qualifications are largely at the other end: street vending, domestic work, small repairs, casual transport, which are themselves often disguised unemployment in urban form, with people working long hours for very little because there is nothing else. What this means for the people involved is now clear. Those who remain in agriculture are frequently underemployed: five members of a household work a plot that three could manage, and if two left, the harvest would not fall. They are not idle, so no unemployment register records them, but their labour is adding almost nothing. Their household income is divided among more people than the land can support, and it does not rise when national output does — which is exactly how a country can post good growth figures while rural distress deepens. Two policy responses follow directly from this diagnosis, and the chapter gives both. The first is to raise productivity and employment within the rural economy itself — irrigation, storage, transport, credit, and processing industries located near the crop, so that the value added to a farm product stays in the district. The second is the employment guarantee: a legal right to a hundred days of wage work, which does not solve the structural problem but puts a floor under households whose own land cannot employ them, and builds ponds, canals and roads that raise future productivity. Neither is a substitute for manufacturing growth; both are responses to the fact that it has not yet arrived at the scale required. (The wrong answers invert the productivity comparison, deny a gap that sectoral GDP and employment data record every year, or treat a large service share as proof of general prosperity when it is compatible with mass low-productivity work.)",
          hi: "दोनों संख्याएँ अगल-बग़ल रखो और अंकगणित स्वयं समझा देता है। यदि कोई क्षेत्रक राष्ट्रीय उत्पादन का छोटा हिस्सा देता है जबकि मज़दूरों का बड़ा हिस्सा रोज़गार में रखता है, तो उस क्षेत्रक में प्रति मज़दूर उत्पादन कम होना ही चाहिए — यह व्याख्या नहीं, भाग है। और प्रति मज़दूर उत्पादन मोटे तौर पर वही है जो तय करता कि मज़दूर कमा क्या सकता। अतः इस स्थिति वाले देश के अधिकांश लोग उसकी सबसे कम उत्पादक गतिविधि में हैं, जो कहने का दूसरा तरीक़ा है कि उसके अधिकांश लोग निर्धन हैं। इसीलिए यह ढर्रा समस्या पढ़ा जाता है। जिस क्रम की अर्थशास्त्री अपेक्षा करते थे उसमें किसी देश के मज़दूर कृषि से बाहर निकलते हैं जैसे-जैसे खेती अधिक उत्पादक होकर कम हाथ माँगती है, और उन्हें विनिर्माण समा लेता है, जो बेहतर देता है; बाद में सेवाएँ बड़े औद्योगिक आधार के ऊपर बढ़ती हैं। ब्रिटेन और यूरोप के अधिकांश ने कुछ ऐसा ही मार्ग लिया। भारत का संक्रमण एक विशिष्ट ढंग से अधूरा रहा: उत्पादन कृषि से बाहर गया, पर मज़दूर बड़े हिस्से में नहीं गए। खेती से आता जीडीपी-हिस्सा लगातार गिरा जबकि वहाँ रोज़गार पाते मज़दूरों का हिस्सा कहीं धीमे गिरा, और खाई बढ़ती गई। कारण यह कि विनिर्माण उन्हें लेने भर तेज़ी से नहीं फैला। रोज़गार में उद्योग का हिस्सा हठपूर्वक मामूली बना रहा, और सेवा-वृद्धि का बड़ा हिस्सा ऐसी गतिविधियों में रहा जिनके लिए शिक्षा और कौशल चाहिए जो खेत-मज़दूर के पास नहीं — सॉफ़्टवेयर, वित्त, संचार। योग्यता-रहित लोगों को उपलब्ध सेवा-नौकरियाँ बड़े हिस्से में दूसरे छोर पर हैं: फेरी, घरेलू काम, छोटी मरम्मत, दिहाड़ी परिवहन, जो स्वयं अक्सर शहरी रूप में छिपी बेरोज़गारी हैं, जहाँ लोग बहुत कम के लिए लंबे घंटे काम करते क्योंकि और कुछ है ही नहीं। इसका उन लोगों के लिए क्या अर्थ है यह अब साफ़ है। जो कृषि में बने रहते वे अक्सर अल्प-रोज़गार में हैं: घर के पाँच सदस्य ऐसे खेत पर काम करते जिसे तीन सँभाल सकते, और दो चले जाएँ तो फ़सल गिरेगी नहीं। वे ख़ाली नहीं, अतः कोई बेरोज़गारी रजिस्टर उन्हें दर्ज नहीं करता, पर उनका श्रम लगभग कुछ नहीं जोड़ रहा। उनके घर की आय भूमि जितने लोगों को सँभाल सकती उससे अधिक में बँटती है, और राष्ट्रीय उत्पादन चढ़ने पर वह चढ़ती नहीं — ठीक इसी तरह कोई देश अच्छे वृद्धि-आँकड़े दर्ज करता है जबकि ग्रामीण संकट गहराता है। इस निदान से दो नीतिगत उत्तर सीधे निकलते हैं, और अध्याय दोनों देता है। पहला, स्वयं ग्रामीण अर्थव्यवस्था के भीतर उत्पादकता और रोज़गार बढ़ाना — सिंचाई, भंडारण, परिवहन, ऋण, और फ़सल के पास स्थित प्रसंस्करण उद्योग, ताकि कृषि-उत्पाद में जुड़ा मूल्य ज़िले में ही रहे। दूसरा, रोज़गार गारंटी: सौ दिन के मज़दूरी-काम का क़ानूनी अधिकार, जो ढाँचागत समस्या हल नहीं करता पर उन घरों के नीचे फ़र्श रख देता जिन्हें अपनी भूमि रोज़गार नहीं दे सकती, और ऐसे तालाब, नहरें तथा सड़कें बनाता जो भावी उत्पादकता बढ़ाती हैं। कोई भी विनिर्माण-वृद्धि का विकल्प नहीं; दोनों इस तथ्य के उत्तर हैं कि वह अभी आवश्यक पैमाने पर आई नहीं। (ग़लत उत्तर उत्पादकता की तुलना उलटते, उस खाई को नकारते जिसे क्षेत्रक-वार जीडीपी और रोज़गार के आँकड़े हर वर्ष दर्ज करते, या बड़े सेवा-हिस्से को सामान्य समृद्धि का प्रमाण मानते जबकि वह व्यापक कम-उत्पादकता वाले काम के साथ भी बैठ जाता है।)",
          mr: "दोन्ही संख्या शेजारीशेजारी ठेवा आणि अंकगणित स्वतःच समजावते. एखादे क्षेत्र राष्ट्रीय उत्पादनाचा लहान वाटा देत असेल तर कामगारांचा मोठा वाटा रोजगारात ठेवत असेल, तर त्या क्षेत्रात प्रति कामगार उत्पादन कमीच असावे लागते — हे भाष्य नव्हे, भागाकार आहे. आणि प्रति कामगार उत्पादन हेच ढोबळमानाने ठरवते की कामगार काय कमावू शकतो. म्हणून या स्थितीतील देशाचे बहुतांश लोक त्याच्या सर्वांत कमी उत्पादक क्रियेत आहेत, जे सांगण्याचा दुसरा मार्ग म्हणजे त्याचे बहुतांश लोक गरीब आहेत. म्हणूनच हे प्रारूप समस्या म्हणून वाचले जाते. अर्थतज्ज्ञांनी अपेक्षिलेल्या क्रमात देशाचे कामगार शेतीतून बाहेर पडतात जसजशी शेती अधिक उत्पादक होऊन कमी हात मागते, आणि त्यांना उत्पादन-उद्योग सामावतो, जो अधिक देतो; नंतर सेवा मोठ्या औद्योगिक पायावर वाढतात. ब्रिटन आणि युरोपच्या बहुतांश भागाने असाच काहीसा मार्ग घेतला. भारताचे संक्रमण एका विशिष्ट प्रकारे अपूर्ण राहिले: उत्पादन शेतीतून बाहेर गेले, पण कामगार मोठ्या प्रमाणात गेले नाहीत. शेतीतून येणारा जीडीपी-वाटा सतत घसरला तर तिथे रोजगार मिळवणाऱ्या कामगारांचा वाटा कितीतरी मंद घसरला, आणि दरी वाढत गेली. कारण हे की उत्पादन-उद्योग त्यांना घेण्याइतक्या वेगाने पसरला नाही. रोजगारातील उद्योगाचा वाटा हट्टाने माफक राहिला, आणि सेवा-वाढीचा मोठा भाग अशा क्रियांत राहिला ज्यांना शिक्षण आणि कौशल्ये लागतात जी शेतमजुराकडे नाहीत — सॉफ्टवेअर, वित्त, दळणवळण. पात्रताविनाच्या लोकांना उपलब्ध सेवा-नोकऱ्या मोठ्या प्रमाणात दुसऱ्या टोकाला: फेरी, घरकाम, छोटी दुरुस्ती, रोजंदारी वाहतूक, ज्या स्वतः अनेकदा शहरी रूपातील लपलेली बेरोजगारी, जिथे लोक फार कमीसाठी लांब तास काम करतात कारण दुसरे काही नाहीच. याचा त्या लोकांसाठी काय अर्थ हे आता स्पष्ट. जे शेतीत राहतात ते अनेकदा अल्प-रोजगारात: घरातील पाच सदस्य अशा शेतावर काम करतात जे तिघे सांभाळू शकतील, आणि दोघे गेले तर पीक घटणार नाही. ते रिकामे नाहीत, म्हणून कोणतीही बेरोजगारी नोंदवही त्यांना नोंदवत नाही, पण त्यांचे श्रम जवळजवळ काहीच जोडत नाही. त्यांच्या घराचे उत्पन्न जमीन जितक्या लोकांना तोलू शकते त्याहून अधिकांत विभागते, आणि राष्ट्रीय उत्पादन चढल्यावर ते चढत नाही — नेमके अशाच प्रकारे एखादा देश चांगले वाढीचे आकडे नोंदवतो तर ग्रामीण संकट खोलावते. या निदानातून दोन धोरणात्मक उत्तरे थेट निघतात, आणि प्रकरण दोन्ही देते. पहिले, स्वतः ग्रामीण अर्थव्यवस्थेच्या आत उत्पादकता आणि रोजगार वाढवणे — सिंचन, साठवण, वाहतूक, कर्ज, आणि पिकाजवळ वसलेले प्रक्रिया उद्योग, जेणेकरून शेती-उत्पादात जोडलेले मूल्य जिल्ह्यातच राहील. दुसरे, रोजगार हमी: शंभर दिवसांच्या मजुरी-कामाचा कायदेशीर हक्क, जो संरचनात्मक समस्या सोडवत नाही पण ज्या घरांना स्वतःची जमीन रोजगार देऊ शकत नाही त्यांच्याखाली जमीन ठेवतो, आणि अशी तळी, कालवे व रस्ते बांधतो जे भविष्यातील उत्पादकता वाढवतात. कोणतेही उत्पादन-वाढीचा पर्याय नाही; दोन्ही या तथ्याची उत्तरे की ती अजून आवश्यक प्रमाणात आलेली नाही. (चुकीची उत्तरे उत्पादकतेची तुलना उलटवतात, क्षेत्रवार जीडीपी आणि रोजगार आकडेवारी दरवर्षी नोंदवत असलेली दरी नाकारतात, वा मोठा सेवा-वाटा सामान्य समृद्धीचा पुरावा मानतात तर तो व्यापक कमी-उत्पादकता कामासोबतही बसतो.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "Two people drive the same model of taxi on the same roads for the same hours. One is employed by a company with a contract, provident fund and paid leave; the other owns nothing but his day and is hired shift by shift. Explain what the difference costs the second driver, and why so much of India's workforce is on his side of the line.",
          hi: "दो लोग एक ही मॉडल की टैक्सी एक ही सड़कों पर एक जितने घंटे चलाते हैं। एक किसी कंपनी में अनुबंध, भविष्य निधि तथा सवेतन अवकाश के साथ नियुक्त है; दूसरे के पास अपने दिन के सिवा कुछ नहीं और वह पाली-दर-पाली रखा जाता है। समझाओ यह अंतर दूसरे चालक को क्या पड़ता है, और भारत की इतनी बड़ी श्रमशक्ति उसकी ओर क्यों है।",
          mr: "दोन माणसे एकाच नमुन्याची टॅक्सी त्याच रस्त्यांवर तितकेच तास चालवतात. एक कंपनीत करार, भविष्यनिर्वाह निधी व पगारी रजेसह नेमलेला; दुसऱ्याकडे स्वतःच्या दिवसाशिवाय काही नाही आणि तो पाळीगणिक ठेवला जातो. समजावा हा फरक दुसऱ्या चालकाला काय पडतो, आणि भारताची इतकी मोठी श्रमशक्ती त्याच्या बाजूला का.",
        },
        choices: [
          {
            en: "The second driver bears every risk himself: an illness, a slow week or an accident costs him his income immediately, he has no pension, no notice period and no legal minimum wage in practice, and no record of employment to show a bank or a landlord. Most Indian workers are on his side because the organised sector never grew large enough to absorb them, and because employers save on exactly those obligations by hiring casually — which is why extending protection, not merely creating jobs, is treated as the policy question",
            hi: "दूसरा चालक हर जोखिम स्वयं ढोता है: बीमारी, धीमा हफ़्ता या दुर्घटना उसकी आय तुरंत छीन लेती है, उसके पास पेंशन नहीं, नोटिस-अवधि नहीं और व्यवहार में कोई क़ानूनी न्यूनतम मज़दूरी नहीं, और बैंक या मकान-मालिक को दिखाने को रोज़गार का कोई अभिलेख नहीं। अधिकांश भारतीय मज़दूर उसकी ओर हैं क्योंकि संगठित क्षेत्रक उन्हें समाने भर कभी बड़ा हुआ ही नहीं, और क्योंकि नियोक्ता दिहाड़ी पर रखकर ठीक उन्हीं दायित्वों की बचत करते हैं — इसी से संरक्षण बढ़ाना, केवल नौकरियाँ बनाना नहीं, नीति का प्रश्न माना जाता है",
            mr: "दुसरा चालक प्रत्येक जोखीम स्वतः वाहतो: आजार, मंद आठवडा वा अपघात त्याचे उत्पन्न तात्काळ हिरावतो, त्याच्याकडे निवृत्तिवेतन नाही, सूचना-कालावधी नाही आणि व्यवहारात कोणतीही कायदेशीर किमान मजुरी नाही, आणि बँकेला वा घरमालकाला दाखवायला रोजगाराची कोणतीही नोंद नाही. बहुतांश भारतीय कामगार त्याच्या बाजूला कारण संघटित क्षेत्र त्यांना सामावण्याइतके कधी मोठे झालेच नाही, आणि कारण मालक रोजंदारीवर ठेवून नेमक्या त्याच जबाबदाऱ्यांची बचत करतात — म्हणूनच संरक्षण वाढवणे, केवळ नोकऱ्या निर्माण करणे नव्हे, धोरणाचा प्रश्न मानला जातो",
          },
          {
            en: "There is no difference of consequence, since both drivers earn the same amount for the same hours",
            hi: "कोई मायने रखता अंतर नहीं, क्योंकि दोनों चालक एक जितने घंटों के लिए एक जितना कमाते हैं",
            mr: "कोणताही महत्त्वाचा फरक नाही, कारण दोन्ही चालक तितक्याच तासांसाठी तितकेच कमावतात",
          },
          {
            en: "The second driver is better off, because workers without contracts are protected more strongly by law",
            hi: "दूसरा चालक बेहतर स्थिति में है, क्योंकि बिना अनुबंध वाले मज़दूरों को क़ानून अधिक मज़बूती से संरक्षित करता है",
            mr: "दुसरा चालक अधिक चांगल्या स्थितीत, कारण कराराविनाच्या कामगारांना कायदा अधिक भक्कम संरक्षण देतो",
          },
          {
            en: "Almost all Indian workers are in the organised sector, so the question describes a rare exception",
            hi: "लगभग सब भारतीय मज़दूर संगठित क्षेत्रक में हैं, अतः प्रश्न किसी दुर्लभ अपवाद का वर्णन करता है",
            mr: "जवळजवळ सर्व भारतीय कामगार संघटित क्षेत्रात आहेत, म्हणून प्रश्न एका दुर्मीळ अपवादाचे वर्णन करतो",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The example is deliberately constructed so that the work is identical. Same vehicle, same roads, same hours, same skill. Everything that differs is contractual, and that is the point: the organised–unorganised division is not about what a person does but about the terms under which they do it. Start with what the second driver lacks. He has no security of employment: he can be told on any morning that he is not needed, with no notice and no severance. He has no protection against a bad week; if fares are thin or the vehicle is off the road, the loss is entirely his. He has no paid leave, so a fever is not a day of rest but a day of lost earnings, and a serious illness can wipe out a family's savings and push it into debt. He has no provident fund or pension, so old age has no floor under it. He is in principle covered by minimum wage law, but with no employer on record and no inspector likely to arrive, the protection exists on paper and not in his week. And there is a compounding effect the chapter does not always spell out: without a payslip or a contract, he cannot document an income, so a bank will not lend to him and a landlord will not rent to him on ordinary terms. He is pushed towards informal credit at high interest — which is where this chapter meets the one on credit. The first driver's contract is not a luxury; it is a transfer of risk. Illness, slack demand and old age are risks that exist in both jobs. In the organised sector the employer and the state absorb a share of them. In the unorganised sector they rest entirely on the person least able to bear them. Now why is most of the Indian workforce on the second driver's side of the line? Two reasons, and both matter. The first is structural: the organised sector — registered factories, large firms, government — simply never expanded fast enough to absorb the workers leaving or wanting to leave agriculture. Manufacturing employment stayed modest, and much of the service growth was in high-skill activities that a school-leaver could not enter. So people went where there was work, and the work available was casual. The second reason is that the arrangement is chosen. Hiring casually rather than permanently saves an employer precisely those obligations — provident fund contributions, notice periods, leave, safety compliance — so a firm that can convert regular posts into contract or daily hire lowers its costs directly. This is why the informal share has stayed high even in periods of good growth, and why some formal employment has been reclassified as contract work. The policy conclusion is therefore not only 'create more jobs'. It is that the terms of the jobs matter as much as their number, because an economy can add employment while adding no security at all. Measures such as registering workers, extending provident fund and insurance to informal workers, enforcing minimum wages, and giving legal recognition to categories like construction and domestic workers are attempts to move the line rather than wait for the sector to grow. The employment guarantee belongs here too: it does not make a household's work organised, but it puts a legally enforceable floor beneath the worst weeks, which is the single thing the second driver most lacks. (The wrong answers deny a difference that leave, pensions and notice periods make concrete, reverse the direction of legal protection, or contradict employment data showing the large majority of Indian workers outside the organised sector.)",
          hi: "उदाहरण जानबूझकर ऐसा बनाया गया कि काम समान हो। वही वाहन, वही सड़कें, वही घंटे, वही कौशल। जो भी भिन्न है वह अनुबंध-संबंधी है, और मर्म यही है: संगठित–असंगठित विभाजन इस बारे में नहीं कि व्यक्ति करता क्या है बल्कि इस बारे में कि वह किन शर्तों पर करता है। दूसरे चालक के पास क्या नहीं, वहाँ से शुरू। उसके पास रोज़गार की सुरक्षा नहीं: किसी भी सुबह उसे कहा जा सकता कि आज ज़रूरत नहीं, न नोटिस न विच्छेद-राशि। उसके पास बुरे हफ़्ते के विरुद्ध संरक्षण नहीं; सवारी कम हो या वाहन बंद हो तो हानि पूरी उसी की। उसके पास सवेतन अवकाश नहीं, अतः बुख़ार आराम का दिन नहीं बल्कि खोई कमाई का दिन है, और गंभीर बीमारी परिवार की बचत मिटाकर उसे क़र्ज़ में धकेल सकती है। उसके पास भविष्य निधि या पेंशन नहीं, अतः बुढ़ापे के नीचे कोई फ़र्श नहीं। सिद्धांततः वह न्यूनतम मज़दूरी क़ानून के दायरे में है, पर अभिलेख में कोई नियोक्ता नहीं और निरीक्षक के आने की कोई संभावना नहीं, अतः संरक्षण काग़ज़ पर है, उसके हफ़्ते में नहीं। और एक जुड़ता प्रभाव है जिसे अध्याय सदा नहीं खोलता: वेतन-पर्ची या अनुबंध बिना वह आय प्रमाणित नहीं कर सकता, अतः बैंक उसे ऋण नहीं देगा और मकान-मालिक साधारण शर्तों पर किराए पर नहीं देगा। वह ऊँचे ब्याज के अनौपचारिक ऋण की ओर धकेला जाता है — और यहीं यह अध्याय ऋण वाले अध्याय से मिलता है। पहले चालक का अनुबंध विलासिता नहीं; वह जोखिम का हस्तांतरण है। बीमारी, माँग की सुस्ती और बुढ़ापा दोनों नौकरियों में मौजूद जोखिम हैं। संगठित क्षेत्रक में नियोक्ता और राज्य उनका एक हिस्सा सोख लेते हैं। असंगठित क्षेत्रक में वे पूरी तरह उसी व्यक्ति पर टिकते हैं जो उन्हें सबसे कम सह सकता। अब भारत की अधिकांश श्रमशक्ति दूसरे चालक की ओर क्यों है? दो कारण, और दोनों मायने रखते हैं। पहला ढाँचागत: संगठित क्षेत्रक — पंजीकृत कारख़ाने, बड़ी फ़र्में, सरकार — कृषि छोड़ते या छोड़ना चाहते मज़दूरों को समाने भर कभी तेज़ी से फैला ही नहीं। विनिर्माण में रोज़गार मामूली रहा, और सेवा-वृद्धि का बड़ा हिस्सा उच्च-कौशल गतिविधियों में था जिनमें कोई स्कूल छोड़ चुका व्यक्ति घुस नहीं सकता था। अतः लोग वहाँ गए जहाँ काम था, और जो काम उपलब्ध था वह दिहाड़ी का था। दूसरा कारण यह कि यह व्यवस्था चुनी जाती है। स्थायी के बजाय दिहाड़ी पर रखना नियोक्ता की ठीक उन्हीं दायित्वों में बचत कराता है — भविष्य निधि अंशदान, नोटिस-अवधि, अवकाश, सुरक्षा-अनुपालन — अतः जो फ़र्म नियमित पद ठेके या दिहाड़ी में बदल सके वह अपनी लागत सीधे घटा लेती है। इसी से अच्छी वृद्धि के दौर में भी अनौपचारिक हिस्सा ऊँचा बना रहा, और इसी से कुछ औपचारिक रोज़गार को ठेका-काम में फिर वर्गीकृत किया गया। अतः नीतिगत निष्कर्ष केवल 'और नौकरियाँ बनाओ' नहीं। यह कि नौकरियों की शर्तें उनकी संख्या जितनी ही मायने रखती हैं, क्योंकि कोई अर्थव्यवस्था रोज़गार जोड़ते हुए सुरक्षा बिलकुल न जोड़ सकती है। मज़दूरों का पंजीकरण, अनौपचारिक मज़दूरों तक भविष्य निधि तथा बीमा बढ़ाना, न्यूनतम मज़दूरी लागू कराना, और निर्माण तथा घरेलू मज़दूरों जैसी श्रेणियों को क़ानूनी मान्यता देना — ये उपाय रेखा को हिलाने के प्रयास हैं, क्षेत्रक के बढ़ने की प्रतीक्षा नहीं। रोज़गार गारंटी भी यहीं आती है: वह किसी घर के काम को संगठित नहीं बनाती, पर सबसे बुरे हफ़्तों के नीचे क़ानूनी रूप से लागू करने योग्य फ़र्श रख देती है, जो वही एक चीज़ है जिसकी दूसरे चालक के पास सबसे अधिक कमी है। (ग़लत उत्तर उस अंतर को नकारते जिसे अवकाश, पेंशन और नोटिस-अवधि ठोस बनाते, क़ानूनी संरक्षण की दिशा उलटते, या उन रोज़गार-आँकड़ों का खंडन करते जो भारतीय मज़दूरों के बड़े बहुमत को संगठित क्षेत्रक के बाहर दिखाते हैं।)",
          mr: "उदाहरण मुद्दाम असे रचले की काम सारखे असावे. तेच वाहन, तेच रस्ते, तेच तास, तेच कौशल्य. जे काही वेगळे ते करारविषयक, आणि मुद्दा हाच: संघटित–असंघटित विभागणी व्यक्ती काय करते याबद्दल नाही तर ती कोणत्या अटींवर करते याबद्दल. दुसऱ्या चालकाकडे काय नाही तिथून सुरू. त्याच्याकडे रोजगाराची सुरक्षा नाही: कोणत्याही सकाळी त्याला सांगता येते की आज गरज नाही, ना सूचना ना नुकसानभरपाई. त्याच्याकडे वाईट आठवड्याविरुद्ध संरक्षण नाही; भाडी कमी असोत वा वाहन बंद असो, तोटा पूर्णपणे त्याचाच. त्याच्याकडे पगारी रजा नाही, म्हणून ताप हा विश्रांतीचा दिवस नव्हे तर गमावलेल्या कमाईचा दिवस, आणि गंभीर आजार कुटुंबाची बचत पुसून त्याला कर्जात ढकलू शकतो. त्याच्याकडे भविष्यनिर्वाह निधी वा निवृत्तिवेतन नाही, म्हणून म्हातारपणाखाली कोणती जमीन नाही. तत्त्वतः तो किमान मजुरी कायद्याच्या कक्षेत आहे, पण नोंदीत कोणता मालक नाही आणि निरीक्षक येण्याची शक्यता नाही, म्हणून संरक्षण कागदावर आहे, त्याच्या आठवड्यात नाही. आणि एक जुळत जाणारा परिणाम आहे जो प्रकरण सदैव उलगडत नाही: पगारपत्रक वा कराराविना तो उत्पन्न दाखवू शकत नाही, म्हणून बँक त्याला कर्ज देणार नाही आणि घरमालक सामान्य अटींवर भाड्याने देणार नाही. तो जास्त व्याजाच्या अनौपचारिक कर्जाकडे ढकलला जातो — आणि इथेच हे प्रकरण कर्जाच्या प्रकरणाला भेटते. पहिल्या चालकाचा करार ही चैन नाही; ते जोखमीचे हस्तांतरण आहे. आजार, मंदावलेली मागणी आणि म्हातारपण या दोन्ही नोकऱ्यांत असलेल्या जोखमी. संघटित क्षेत्रात मालक आणि राज्य त्यांचा एक वाटा शोषतात. असंघटित क्षेत्रात त्या पूर्णपणे त्याच व्यक्तीवर टेकतात जी त्या सर्वांत कमी सोसू शकते. आता भारताची बहुतांश श्रमशक्ती दुसऱ्या चालकाच्या बाजूला का? दोन कारणे, आणि दोन्ही महत्त्वाची. पहिले संरचनात्मक: संघटित क्षेत्र — नोंदणीकृत कारखाने, मोठ्या कंपन्या, सरकार — शेती सोडणाऱ्या वा सोडू इच्छिणाऱ्या कामगारांना सामावण्याइतके कधी वेगाने पसरलेच नाही. उत्पादन-उद्योगातील रोजगार माफक राहिला, आणि सेवा-वाढीचा मोठा भाग उच्च-कौशल्याच्या क्रियांत होता ज्यांत शाळा सोडलेली व्यक्ती शिरू शकत नव्हती. म्हणून लोक तिथे गेले जिथे काम होते, आणि उपलब्ध काम रोजंदारीचे होते. दुसरे कारण हे की ही व्यवस्था निवडली जाते. कायमऐवजी रोजंदारीवर ठेवणे मालकाची नेमक्या त्याच जबाबदाऱ्यांत बचत करते — भविष्यनिर्वाह निधीचे अंशदान, सूचना-कालावधी, रजा, सुरक्षा-पालन — म्हणून जी कंपनी नियमित पदे कंत्राटी वा रोजंदारीत बदलू शकते ती आपला खर्च थेट घटवते. म्हणूनच चांगल्या वाढीच्या काळातही अनौपचारिक वाटा उच्च राहिला, आणि म्हणूनच काही औपचारिक रोजगार कंत्राटी कामात पुन्हा वर्गीकृत झाला. म्हणून धोरणात्मक निष्कर्ष केवळ 'अधिक नोकऱ्या निर्माण करा' नाही. तो हा की नोकऱ्यांच्या अटी त्यांच्या संख्येइतक्याच महत्त्वाच्या, कारण एखादी अर्थव्यवस्था रोजगार जोडत असताना सुरक्षा मुळीच जोडू शकत नाही. कामगारांची नोंदणी, अनौपचारिक कामगारांपर्यंत भविष्यनिर्वाह निधी व विमा वाढवणे, किमान मजुरी राबवणे, आणि बांधकाम व घरकाम कामगारांसारख्या श्रेणींना कायदेशीर मान्यता देणे — हे उपाय रेषा हलवण्याचे प्रयत्न आहेत, क्षेत्र वाढण्याची वाट पाहणे नव्हे. रोजगार हमीही इथेच येते: ती एखाद्या घराचे काम संघटित करत नाही, पण सर्वांत वाईट आठवड्यांखाली कायदेशीररीत्या राबवण्याजोगी जमीन ठेवते, जी तीच एक गोष्ट जिची दुसऱ्या चालकाकडे सर्वाधिक कमतरता. (चुकीची उत्तरे रजा, निवृत्तिवेतन आणि सूचना-कालावधी ठोस करत असलेला फरक नाकारतात, कायदेशीर संरक्षणाची दिशा उलटवतात, वा भारतीय कामगारांचा मोठा बहुसंख्य भाग संघटित क्षेत्राबाहेर दाखवणाऱ्या रोजगार आकडेवारीचे खंडन करतात.)",
        },
      },
    ],
  },
  /* ----------------------------------------------------------------------- */
  /* Chapter 3 — Money and Credit                                            */
  /* ----------------------------------------------------------------------- */
  {
    slug: "economics-10-money-credit",
    subject: "ECONOMICS",
    classLevel: 10,
    chapter: {
      en: "Chapter 3 — Money and Credit",
      hi: "अध्याय 3 — मुद्रा और साख",
      mr: "प्रकरण 3 — पैसा आणि पत",
    },
    name: {
      en: "Money and Credit",
      hi: "मुद्रा और साख",
      mr: "पैसा आणि पत",
    },
    summary: {
      en: "What makes an exchange possible and what makes a loan safe: the impossible matching that money removes, paper worth nothing that everyone accepts, a bank balance that spends like cash, terms that decide whether a loan lifts or buries, two very different lenders — and twenty women who between them can offer what none could offer alone.",
      hi: "किसी विनिमय को संभव क्या बनाता और किसी ऋण को सुरक्षित क्या: वह असंभव मिलान जिसे मुद्रा हटा देती, काग़ज़ जिसका अपना कोई मूल्य नहीं फिर भी सब स्वीकारते, बैंक-शेष जो नक़दी-सा ख़र्च होता, वे शर्तें जो तय करतीं कि ऋण उठाएगा या गाड़ेगा, दो बहुत भिन्न ऋणदाता — और बीस स्त्रियाँ जो मिलकर वह दे सकतीं जो अकेली कोई नहीं दे सकती थी।",
      mr: "एखादी देवाणघेवाण शक्य काय करते आणि एखादे कर्ज सुरक्षित काय: ते अशक्य जुळणे जे पैसा काढून टाकतो, स्वतःचे मोल नसलेला कागद तरीही सर्व स्वीकारतात, रोखीसारखा खर्च होणारा बँक-शिल्लक, कर्ज उचलेल की गाडेल हे ठरवणाऱ्या अटी, दोन खूप वेगळे सावकार — आणि वीस स्त्रिया ज्या मिळून ते देऊ शकतात जे एकटी कोणी देऊ शकली नसती.",
    },
    position: 3,
    source: SOURCE,
    licence: LICENCE,
    facts: [
      {
        id: "double-coincidence",
        name: {
          en: "The double coincidence of wants",
          hi: "आवश्यकताओं का दोहरा संयोग",
          mr: "गरजांचा दुहेरी योगायोग",
        },
        kind: "idea",
        prompt: {
          en: "Without money a shoemaker who wants rice must find not just anyone with rice but someone with rice who happens to want shoes at that very moment. Which requirement of barter is this?",
          hi: "मुद्रा बिना चावल चाहता जूता बनाने वाला केवल किसी चावल वाले को नहीं बल्कि ऐसे चावल वाले को खोजे जो ठीक उसी क्षण जूते चाहता हो। वस्तु-विनिमय की यह कौन-सी आवश्यकता है?",
          mr: "पैशाविना तांदूळ हवा असलेल्या चांभाराला केवळ कोणी तांदूळवाला नव्हे तर असा तांदूळवाला शोधावा लागतो ज्याला नेमक्या त्याच क्षणी जोडे हवे असतील. वस्तुविनिमयाची ही कोणती आवश्यकता?",
        },
        statement: {
          en: "The double coincidence of wants is barter's requirement that each party must want exactly what the other is offering at the same time, and money removes it by splitting an exchange into a sale and a purchase.",
          hi: "आवश्यकताओं का दोहरा संयोग वस्तु-विनिमय की वह आवश्यकता है कि हर पक्ष को ठीक वही चाहिए जो दूसरा उसी समय दे रहा हो, और मुद्रा किसी विनिमय को बिक्री तथा ख़रीद में बाँटकर उसे हटा देती है।",
          mr: "गरजांचा दुहेरी योगायोग म्हणजे वस्तुविनिमयाची ती आवश्यकता की प्रत्येक पक्षाला नेमके तेच हवे जे दुसरा त्याच वेळी देत आहे, आणि पैसा एखाद्या देवाणघेवाणीचे विक्री व खरेदीत विभाजन करून तो काढून टाकतो.",
        },
        detail: {
          en: "Money works as a medium of exchange because everyone accepts it, and everyone accepts it because everyone else does — a convention that holds itself up.",
          hi: "मुद्रा विनिमय के माध्यम के रूप में इसलिए चलती कि उसे सब स्वीकारते हैं, और सब इसलिए स्वीकारते कि बाक़ी सब स्वीकारते हैं — ऐसी परिपाटी जो स्वयं को थामे रहती है।",
          mr: "पैसा देवाणघेवाणीचे माध्यम म्हणून यासाठी चालतो की त्याला सर्व स्वीकारतात, आणि सर्व यासाठी स्वीकारतात की बाकी सर्व स्वीकारतात — अशी प्रथा जी स्वतःला तोलून धरते.",
        },
        extra: {
          en: "Splitting the exchange also lets value be stored: a farmer can sell in October and buy in March, which barter with perishable grain could never allow.",
          hi: "विनिमय के बँटने से मूल्य संचित भी हो सकता: किसान अक्टूबर में बेचकर मार्च में ख़रीद सकता, जिसकी नाशवान अनाज के वस्तु-विनिमय में कभी छूट नहीं थी।",
          mr: "देवाणघेवाण विभागल्याने मूल्य साठवताही येते: शेतकरी ऑक्टोबरात विकून मार्चमध्ये विकत घेऊ शकतो, ज्याची नाशवंत धान्याच्या वस्तुविनिमयात कधीच मुभा नव्हती.",
        },
        pair: {
          left: {
            en: "Each must want exactly what the other offers",
            hi: "हर एक को ठीक वही चाहिए जो दूसरा दे",
            mr: "प्रत्येकाला नेमके तेच हवे जे दुसरा देतो",
          },
          right: {
            en: "the double coincidence of wants",
            hi: "आवश्यकताओं का दोहरा संयोग",
            mr: "गरजांचा दुहेरी योगायोग",
          },
        },
      },
      {
        id: "currency-as-legal-tender",
        name: {
          en: "Currency as legal tender",
          hi: "विधिमान्य मुद्रा",
          mr: "कायदेशीर चलन",
        },
        kind: "idea",
        prompt: {
          en: "A banknote is a piece of printed paper with no gold behind it and no use of its own, yet nobody in the country may lawfully refuse it in settlement of a debt. What makes it acceptable?",
          hi: "बैंक-नोट छपे काग़ज़ का टुकड़ा है जिसके पीछे सोना नहीं और जिसका अपना कोई उपयोग नहीं, फिर भी देश में कोई क़ानूनी रूप से ऋण-भुगतान में उसे मना नहीं कर सकता। उसे स्वीकार्य क्या बनाता है?",
          mr: "बँकनोट हा छापील कागदाचा तुकडा ज्याच्यामागे सोने नाही आणि ज्याचा स्वतःचा कोणता उपयोग नाही, तरीही देशात कोणीही कायदेशीररीत्या कर्जफेडीत तो नाकारू शकत नाही. त्याला स्वीकारार्ह काय बनवते?",
        },
        statement: {
          en: "Modern currency has no value of its own and is not backed by gold; it is accepted because the Reserve Bank issues it on the government's authority and the law makes it legal tender that cannot be refused.",
          hi: "आधुनिक मुद्रा का अपना कोई मूल्य नहीं और वह सोने से समर्थित नहीं; वह इसलिए स्वीकारी जाती कि रिज़र्व बैंक उसे सरकार के प्राधिकार से जारी करता है और क़ानून उसे विधिमान्य मुद्रा बनाता है जिसे मना नहीं किया जा सकता।",
          mr: "आधुनिक चलनाला स्वतःचे मोल नाही आणि ते सोन्याने पाठबळ दिलेले नाही; ते यासाठी स्वीकारले जाते की रिझर्व्ह बँक ते सरकारच्या अधिकाराने जारी करते आणि कायदा त्याला कायदेशीर चलन बनवतो जे नाकारता येत नाही.",
        },
        detail: {
          en: "In India only the Reserve Bank may issue currency notes, and it does so on behalf of the central government.",
          hi: "भारत में केवल रिज़र्व बैंक मुद्रा-नोट जारी कर सकता है, और वह केंद्र सरकार की ओर से ऐसा करता है।",
          mr: "भारतात केवळ रिझर्व्ह बँक चलनी नोटा जारी करू शकते, आणि ती केंद्र सरकारच्या वतीने तसे करते.",
        },
        extra: {
          en: "Its acceptance rests on confidence rather than on metal: the note is a promise, and it works exactly as long as people believe the promise will be honoured.",
          hi: "उसकी स्वीकार्यता धातु पर नहीं, विश्वास पर टिकी: नोट एक वादा है, और वह ठीक तब तक चलता जब तक लोग मानें कि वादा निभाया जाएगा।",
          mr: "त्याची स्वीकारार्हता धातूवर नव्हे तर विश्वासावर टेकलेली: नोट हे एक वचन, आणि ते नेमके तोवर चालते जोवर लोक मानतात की वचन पाळले जाईल.",
        },
        pair: {
          left: {
            en: "Paper worth nothing that nobody may refuse",
            hi: "बेमूल्य काग़ज़ जिसे कोई मना नहीं कर सकता",
            mr: "निर्मूल्य कागद जो कोणीही नाकारू शकत नाही",
          },
          right: {
            en: "currency as legal tender",
            hi: "विधिमान्य मुद्रा",
            mr: "कायदेशीर चलन",
          },
        },
      },
      {
        id: "demand-deposits",
        name: {
          en: "Demand deposits",
          hi: "माँग जमा",
          mr: "मागणी ठेवी",
        },
        kind: "idea",
        prompt: {
          en: "Money left with a bank can be withdrawn whenever the holder asks, and can be transferred to someone else by cheque or a digital instruction without any note changing hands. What are these balances called?",
          hi: "बैंक के पास रखा पैसा जब चाहे धारक माँगे तब निकाला जा सकता, और चेक या डिजिटल निर्देश से किसी और को बिना नोट हाथ बदले हस्तांतरित किया जा सकता। ये शेष क्या कहलाते हैं?",
          mr: "बँकेकडे ठेवलेला पैसा धारक मागेल तेव्हा काढता येतो, आणि धनादेश वा डिजिटल सूचनेने दुसऱ्याला कोणतीही नोट हात न बदलता हस्तांतरित करता येतो. या शिल्लकांना काय म्हणतात?",
        },
        statement: {
          en: "Demand deposits are bank balances repayable on demand, and because they can be transferred by cheque or digital payment they serve the same functions as cash and are counted as money.",
          hi: "माँग जमा वे बैंक-शेष हैं जो माँगने पर देय हैं, और चूँकि उन्हें चेक या डिजिटल भुगतान से हस्तांतरित किया जा सकता, वे नक़दी जैसे ही काम करते और मुद्रा में गिने जाते हैं।",
          mr: "मागणी ठेवी म्हणजे मागणीवर परत देय असणाऱ्या बँक-शिल्लक, आणि त्या धनादेश वा डिजिटल भरणाने हस्तांतरित करता येत असल्याने त्या रोखीसारखीच कामे करतात आणि पैशात मोजल्या जातात.",
        },
        detail: {
          en: "Banks keep only a small fraction of these deposits as cash, because depositors do not all withdraw at once, and lend the rest out.",
          hi: "बैंक इन जमाओं का केवल छोटा अंश नक़दी में रखते हैं, क्योंकि जमाकर्ता सब एक साथ नहीं निकालते, और शेष उधार दे देते हैं।",
          mr: "बँका या ठेवींचा फक्त लहान अंश रोखीत ठेवतात, कारण ठेवीदार सर्व एकाच वेळी काढत नाहीत, आणि उरलेले कर्जाऊ देतात.",
        },
        extra: {
          en: "That lending is where a bank's income comes from: it pays depositors one rate and charges borrowers a higher one, and the difference is its earnings.",
          hi: "वही उधार बैंक की आय का स्रोत है: वह जमाकर्ताओं को एक दर देता और उधार लेने वालों से ऊँची लेता, और अंतर उसकी कमाई है।",
          mr: "तेच कर्ज बँकेच्या उत्पन्नाचा स्रोत: ती ठेवीदारांना एक दर देते आणि कर्जदारांकडून जास्त घेते, आणि फरक तिची कमाई.",
        },
        pair: {
          left: {
            en: "A balance that spends like cash",
            hi: "नक़दी-सा ख़र्च होता शेष",
            mr: "रोखीसारखी खर्च होणारी शिल्लक",
          },
          right: {
            en: "demand deposits",
            hi: "माँग जमा",
            mr: "मागणी ठेवी",
          },
        },
      },
      {
        id: "terms-of-credit",
        name: {
          en: "The terms of credit",
          hi: "ऋण की शर्तें",
          mr: "कर्जाच्या अटी",
        },
        kind: "idea",
        prompt: {
          en: "Every loan agreement fixes an interest rate, may demand security against default, may require a guarantor, and sets how and by when the money must be returned. What are these conditions collectively called?",
          hi: "हर ऋण-अनुबंध ब्याज दर तय करता है, चूक के विरुद्ध ज़मानत माँग सकता, गारंटर की शर्त रख सकता, और तय करता कि पैसा कैसे और कब तक लौटाना है। ये शर्तें मिलकर क्या कहलाती हैं?",
          mr: "प्रत्येक कर्जकरार व्याजदर ठरवतो, थकबाकीविरुद्ध तारण मागू शकतो, जामीनदाराची अट ठेवू शकतो, आणि पैसा कसा व कधीपर्यंत परत करावा हे ठरवतो. या अटी एकत्रितपणे काय म्हणतात?",
        },
        statement: {
          en: "The terms of credit are the interest rate, collateral, documentation and mode of repayment agreed in a loan, and together they decide whether a borrower can realistically repay.",
          hi: "ऋण की शर्तें हैं ब्याज दर, ज़मानत, दस्तावेज़ और चुकौती का ढंग जो ऋण में तय होते, और मिलकर वे तय करती हैं कि उधार लेने वाला यथार्थ रूप से चुका पाएगा या नहीं।",
          mr: "कर्जाच्या अटी म्हणजे व्याजदर, तारण, कागदपत्रे आणि परतफेडीची पद्धत ज्या कर्जात ठरतात, आणि एकत्रितपणे त्या ठरवतात की कर्जदार वास्तवात परतफेड करू शकेल की नाही.",
        },
        detail: {
          en: "Collateral is an asset the lender can seize if the loan is not repaid, and demanding it is exactly what excludes those who own nothing.",
          hi: "ज़मानत वह परिसंपत्ति है जिसे ऋण न चुकने पर ऋणदाता ज़ब्त कर सकता, और उसकी माँग ठीक उन्हीं को बाहर कर देती जिनके पास कुछ नहीं।",
          mr: "तारण म्हणजे ती मालमत्ता जी कर्ज न फिटल्यास सावकार जप्त करू शकतो, आणि तिची मागणी नेमक्या त्यांनाच बाहेर काढते ज्यांच्याकडे काही नाही.",
        },
        extra: {
          en: "The rate alone does not tell you whether a loan is safe: what matters is whether the activity it funds will earn enough, on time, to meet the terms.",
          hi: "अकेली दर नहीं बताती कि ऋण सुरक्षित है या नहीं: मायने यह रखता कि जिस काम को वह वित्तपोषित करता वह शर्तें पूरी करने भर, समय पर, कमाएगा या नहीं।",
          mr: "एकटा दर सांगत नाही की कर्ज सुरक्षित आहे की नाही: महत्त्व याचे की ते ज्या कामाला अर्थपुरवठा करते ते अटी भागवण्याइतके, वेळेवर, कमावेल की नाही.",
        },
        pair: {
          left: {
            en: "Rate, collateral, papers and repayment",
            hi: "दर, ज़मानत, काग़ज़ और चुकौती",
            mr: "दर, तारण, कागदपत्रे आणि परतफेड",
          },
          right: {
            en: "the terms of credit",
            hi: "ऋण की शर्तें",
            mr: "कर्जाच्या अटी",
          },
        },
      },
      {
        id: "formal-informal-credit",
        name: {
          en: "Formal and informal sources of credit",
          hi: "ऋण के औपचारिक और अनौपचारिक स्रोत",
          mr: "कर्जाचे औपचारिक आणि अनौपचारिक स्रोत",
        },
        kind: "idea",
        prompt: {
          en: "Banks and cooperatives lend under rates supervised by the Reserve Bank; moneylenders, traders and employers lend at whatever they choose, with nobody checking. Which division of lenders is this?",
          hi: "बैंक और सहकारी समितियाँ रिज़र्व बैंक की निगरानी वाली दरों पर उधार देती हैं; साहूकार, व्यापारी और नियोक्ता जो चाहें उस पर देते हैं, और कोई जाँचने वाला नहीं। ऋणदाताओं का यह कौन-सा विभाजन है?",
          mr: "बँका आणि सहकारी संस्था रिझर्व्ह बँकेच्या देखरेखीखालील दरांवर कर्ज देतात; सावकार, व्यापारी आणि मालक त्यांना हवे त्यावर देतात, आणि कोणी तपासणारा नाही. सावकारांची ही कोणती विभागणी?",
        },
        statement: {
          en: "Formal sources of credit such as banks and cooperatives are supervised by the Reserve Bank and charge regulated rates, while informal sources such as moneylenders, traders and employers are unsupervised and often charge very high interest.",
          hi: "बैंक और सहकारी समितियों जैसे औपचारिक ऋण-स्रोत रिज़र्व बैंक की निगरानी में हैं और नियंत्रित दरें लेते हैं, जबकि साहूकार, व्यापारी और नियोक्ता जैसे अनौपचारिक स्रोत बिना निगरानी हैं और अक्सर बहुत ऊँचा ब्याज लेते हैं।",
          mr: "बँका आणि सहकारी संस्थांसारखे औपचारिक कर्जस्रोत रिझर्व्ह बँकेच्या देखरेखीत आणि नियंत्रित दर आकारतात, तर सावकार, व्यापारी आणि मालकांसारखे अनौपचारिक स्रोत देखरेखीविना आणि अनेकदा खूप जास्त व्याज आकारतात.",
        },
        detail: {
          en: "The Reserve Bank also requires banks to report how much they lend and to whom, so that credit reaches small borrowers and not only large ones.",
          hi: "रिज़र्व बैंक बैंकों से यह भी माँगता है कि वे बताएँ कितना और किसे उधार दिया, ताकि ऋण छोटे उधारकर्ताओं तक पहुँचे, केवल बड़े तक नहीं।",
          mr: "रिझर्व्ह बँक बँकांकडून हेही मागते की त्यांनी किती आणि कोणाला कर्ज दिले ते कळवावे, जेणेकरून कर्ज लहान कर्जदारांपर्यंत पोहोचेल, केवळ मोठ्यांपर्यंत नाही.",
        },
        extra: {
          en: "The poor still borrow mostly from informal sources, because formal lenders ask for collateral and papers that a landless household cannot produce.",
          hi: "निर्धन आज भी अधिकतर अनौपचारिक स्रोतों से उधार लेते हैं, क्योंकि औपचारिक ऋणदाता ऐसी ज़मानत और काग़ज़ माँगते हैं जो भूमिहीन घर दे नहीं सकता।",
          mr: "गरीब आजही बहुतांश अनौपचारिक स्रोतांकडून कर्ज घेतात, कारण औपचारिक सावकार असे तारण आणि कागदपत्रे मागतात जी भूमिहीन घर देऊ शकत नाही.",
        },
        pair: {
          left: {
            en: "Supervised rates, or whatever the lender chooses",
            hi: "निगरानी वाली दरें, या जो ऋणदाता चाहे",
            mr: "देखरेखीखालचे दर, वा सावकाराला हवे ते",
          },
          right: {
            en: "formal and informal sources of credit",
            hi: "ऋण के औपचारिक और अनौपचारिक स्रोत",
            mr: "कर्जाचे औपचारिक आणि अनौपचारिक स्रोत",
          },
        },
      },
      {
        id: "self-help-groups",
        name: {
          en: "Self-Help Groups",
          hi: "स्वयं सहायता समूह",
          mr: "बचत गट",
        },
        kind: "structure",
        prompt: {
          en: "Fifteen or twenty women in a village save a small sum every week, lend it among themselves at rates they decide, and after some months become eligible to borrow from a bank as a group without individual collateral. What are these called?",
          hi: "गाँव की पंद्रह-बीस स्त्रियाँ हर हफ़्ते थोड़ी बचत करती हैं, आपस में अपनी तय दरों पर उधार देती हैं, और कुछ महीनों बाद बिना व्यक्तिगत ज़मानत समूह के रूप में बैंक से ऋण लेने की पात्र हो जाती हैं। ये क्या कहलाते हैं?",
          mr: "गावातील पंधरा-वीस स्त्रिया दर आठवड्याला थोडी बचत करतात, आपापसात स्वतः ठरवलेल्या दरांवर कर्ज देतात, आणि काही महिन्यांनंतर वैयक्तिक तारणाविना गट म्हणून बँकेकडून कर्ज घेण्यास पात्र होतात. यांना काय म्हणतात?",
        },
        statement: {
          en: "Self-Help Groups pool the small savings of fifteen to twenty members, lend within the group on terms the members set, and after a period of regular saving become eligible for bank loans to the group without individual collateral.",
          hi: "स्वयं सहायता समूह पंद्रह से बीस सदस्यों की छोटी बचत जोड़ते हैं, सदस्यों की तय शर्तों पर समूह के भीतर उधार देते हैं, और नियमित बचत की अवधि के बाद बिना व्यक्तिगत ज़मानत समूह को बैंक-ऋण के पात्र हो जाते हैं।",
          mr: "बचत गट पंधरा ते वीस सदस्यांची लहान बचत एकत्र करतात, सदस्यांनी ठरवलेल्या अटींवर गटाच्या आत कर्ज देतात, आणि नियमित बचतीच्या कालावधीनंतर वैयक्तिक तारणाविना गटाला बँक-कर्जासाठी पात्र होतात.",
        },
        detail: {
          en: "The group replaces collateral with mutual responsibility: members know each other's circumstances and the group itself follows up repayment, so the bank's risk falls.",
          hi: "समूह ज़मानत की जगह पारस्परिक ज़िम्मेदारी रखता है: सदस्य एक-दूसरे की परिस्थिति जानते हैं और समूह स्वयं चुकौती का पीछा करता है, अतः बैंक का जोखिम घटता है।",
          mr: "गट तारणाच्या जागी परस्पर जबाबदारी ठेवतो: सदस्य एकमेकांची परिस्थिती जाणतात आणि गट स्वतः परतफेडीचा पाठपुरावा करतो, म्हणून बँकेची जोखीम घटते.",
        },
        extra: {
          en: "The meetings do more than lending: they are often the first regular occasion on which women in a village discuss money, land, schooling and health together.",
          hi: "बैठकें उधार से अधिक करती हैं: वे अक्सर पहला नियमित अवसर होती हैं जब गाँव की स्त्रियाँ पैसे, ज़मीन, पढ़ाई और स्वास्थ्य पर साथ चर्चा करती हैं।",
          mr: "बैठका कर्जाहून अधिक करतात: त्या अनेकदा पहिला नियमित प्रसंग असतात जेव्हा गावातील स्त्रिया पैसा, जमीन, शिक्षण आणि आरोग्यावर एकत्र चर्चा करतात.",
        },
        pair: {
          left: {
            en: "Collateral replaced by a group's own responsibility",
            hi: "ज़मानत की जगह समूह की अपनी ज़िम्मेदारी",
            mr: "तारणाच्या जागी गटाची स्वतःची जबाबदारी",
          },
          right: {
            en: "Self-Help Groups",
            hi: "स्वयं सहायता समूह",
            mr: "बचत गट",
          },
        },
      },
    ],
    hard: [
      {
        level: 5,
        stem: {
          en: "Two farmers each borrow the same amount at the same interest rate to buy seed and fertiliser. One repays comfortably after a good harvest and borrows again the next year; the other loses the crop to failed rains, borrows more to repay, and ends up selling land. Explain why one loan lifted and the other buried.",
          hi: "दो किसान बीज और उर्वरक ख़रीदने को एक ही ब्याज दर पर एक जितनी राशि उधार लेते हैं। एक अच्छी फ़सल के बाद आराम से चुका देता और अगले वर्ष फिर उधार लेता; दूसरा वर्षा की विफलता में फ़सल खोता, चुकाने को और उधार लेता, और अंततः ज़मीन बेच देता है। समझाओ एक ऋण ने उठाया और दूसरे ने क्यों गाड़ दिया।",
          mr: "दोन शेतकरी बियाणे व खत विकत घ्यायला त्याच व्याजदरावर तितकीच रक्कम कर्जाऊ घेतात. एक चांगल्या पिकानंतर आरामात परतफेड करतो आणि पुढच्या वर्षी पुन्हा कर्ज घेतो; दुसरा पाऊस फसल्याने पीक गमावतो, फेडायला अधिक कर्ज घेतो, आणि अखेर जमीन विकतो. समजावा एका कर्जाने उचलले आणि दुसऱ्याने का गाडले.",
        },
        choices: [
          {
            en: "Because the outcome depends on whether the activity the loan funded earned enough in time, not on the loan itself. Credit converts a future income into money available now, so if that income arrives the loan is a bridge and if it fails the borrower still owes the full amount plus interest. The second farmer then borrowed again merely to repay, which adds interest without adding income — and that is the debt trap, whose real cause is the absence of any cushion against a bad season",
            hi: "क्योंकि परिणाम इस पर निर्भर है कि ऋण ने जिस काम को वित्तपोषित किया वह समय पर पर्याप्त कमाया या नहीं, स्वयं ऋण पर नहीं। साख भावी आय को अभी उपलब्ध पैसे में बदलती है, अतः वह आय आ जाए तो ऋण पुल है और चूक जाए तो उधार लेने वाले पर पूरी राशि तथा ब्याज फिर भी बाक़ी है। दूसरे किसान ने फिर केवल चुकाने को उधार लिया, जो आय जोड़े बिना ब्याज जोड़ता है — और यही ऋण-जाल है, जिसका असली कारण बुरे मौसम के विरुद्ध किसी गद्दी का न होना है",
            mr: "कारण निकाल कर्जाने ज्या कामाला अर्थपुरवठा केला ते वेळेत पुरेसे कमावले की नाही यावर अवलंबून, स्वतः कर्जावर नाही. पत भविष्यातील उत्पन्नाचे आता उपलब्ध पैशात रूपांतर करते, म्हणून ते उत्पन्न आले तर कर्ज पूल आणि फसले तर कर्जदारावर पूर्ण रक्कम व व्याज तरीही बाकी. दुसऱ्या शेतकऱ्याने मग केवळ फेडायला पुन्हा कर्ज घेतले, जे उत्पन्न न जोडता व्याज जोडते — आणि हाच कर्जसापळा, ज्याचे खरे कारण वाईट हंगामाविरुद्ध कोणतीही उशी नसणे",
          },
          {
            en: "Because a higher interest rate was secretly charged to the second farmer, which is the only possible explanation",
            hi: "क्योंकि दूसरे किसान से चुपचाप ऊँची ब्याज दर ली गई, यही एकमात्र संभव व्याख्या है",
            mr: "कारण दुसऱ्या शेतकऱ्याकडून गुपचूप जास्त व्याजदर घेतला गेला, हेच एकमेव शक्य स्पष्टीकरण",
          },
          {
            en: "Because credit is always harmful, so the first farmer must simply have been lucky to survive it",
            hi: "क्योंकि साख सदा हानिकारक है, अतः पहला किसान बस भाग्यशाली रहा होगा कि बच गया",
            mr: "कारण पत सदैव हानिकारक, म्हणून पहिला शेतकरी फक्त नशीबवान ठरला असेल की वाचला",
          },
          {
            en: "Because loans repay themselves automatically, so the second farmer's difficulty could not have occurred",
            hi: "क्योंकि ऋण अपने आप चुक जाते हैं, अतः दूसरे किसान की कठिनाई हो ही नहीं सकती थी",
            mr: "कारण कर्जे आपोआप फिटतात, म्हणून दुसऱ्या शेतकऱ्याची अडचण होऊच शकत नव्हती",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The example is set up so that the loan is identical — same amount, same rate, same purpose — which forces the explanation to lie outside the loan. What credit does is move income across time. A farmer needs seed and fertiliser in June but earns only after the harvest in November, so a loan converts an expected future income into money available now. The whole arrangement rests on a forecast: that the income will actually arrive, and arrive in time. For the first farmer the forecast held. The rains came, the crop was good, the sale covered the loan and the interest with something left over, and he was better off than if he had not borrowed at all — because without the loan he could not have bought inputs and would have harvested less. Credit here did exactly what it is for. For the second farmer the forecast failed, and it failed for a reason entirely outside his control. The rains did not come. But the obligation was not conditional on the rains; he owes the full principal plus interest regardless. This asymmetry is the heart of the matter: the return on the activity is uncertain, and the repayment is certain. Now the crucial next step, which is where a bad year turns into ruin. Having no income, he borrowed again — not to plant anything, but to repay the earlier loan. This is the point at which the arithmetic turns against him permanently. A loan taken to fund an activity may generate the income to repay it; a loan taken to repay a loan generates nothing at all, and simply adds another round of interest to the same debt. Each cycle raises what he owes while his capacity to earn stays where it was or falls. That is the debt trap, and it ends the only way it can: with the sale of whatever he still owns, usually the land, which then removes his ability to earn in future too. Notice what this analysis identifies as the real problem. It is not the interest rate as such — the two farmers paid the same rate. It is the absence of any cushion between a bad season and default. Where that cushion exists, a failed harvest is a setback; where it does not, it is a permanent loss of assets. This is why the policy responses attack the cushion rather than the rate alone: crop insurance, so a failed harvest is compensated; rescheduling of loans in a declared drought, so repayment can wait for the next season; the employment guarantee, which puts wage income under a household when its own land yields nothing; and public procurement at a support price, which reduces the chance that a good harvest is met by a price collapse. It also explains the deeper unfairness the chapter goes on to describe. The poorest borrowers are precisely those with no cushion and no collateral, so formal lenders will not lend to them and they turn to informal sources at high rates — which means the people least able to survive a bad year are also the ones charged most for the loan that will test them. (The wrong answers invent a hidden rate difference, condemn credit as such despite the first farmer's gain, or deny a well-documented sequence of distress borrowing and land sale.)",
          hi: "उदाहरण ऐसे रखा गया कि ऋण समान हो — वही राशि, वही दर, वही प्रयोजन — जो व्याख्या को ऋण से बाहर होने पर मजबूर करता है। साख जो करती है वह आय को समय के आर-पार ले जाना है। किसान को जून में बीज और उर्वरक चाहिए पर कमाई नवंबर की फ़सल के बाद ही, अतः ऋण अपेक्षित भावी आय को अभी उपलब्ध पैसे में बदल देता है। पूरी व्यवस्था एक पूर्वानुमान पर टिकी: कि वह आय सचमुच आएगी, और समय पर आएगी। पहले किसान का पूर्वानुमान टिका। वर्षा आई, फ़सल अच्छी हुई, बिक्री ने ऋण तथा ब्याज ढका और कुछ बचा भी, और वह उससे बेहतर स्थिति में रहा जितना उधार न लेने पर होता — क्योंकि ऋण बिना वह निवेश ख़रीद ही नहीं सकता था और कम काटता। यहाँ साख ने ठीक वही किया जिसके लिए वह है। दूसरे किसान का पूर्वानुमान चूका, और ऐसे कारण से चूका जो पूरी तरह उसके नियंत्रण के बाहर था। वर्षा नहीं आई। पर दायित्व वर्षा पर सशर्त नहीं था; उस पर मूलधन और ब्याज चाहे जो हो, बाक़ी है। यही विषमता मर्म है: गतिविधि का प्रतिफल अनिश्चित है, और चुकौती निश्चित। अब मुख्य अगला चरण, जहाँ बुरा वर्ष बरबादी बन जाता है। आय न होने पर उसने फिर उधार लिया — कुछ बोने को नहीं, बल्कि पहले का ऋण चुकाने को। यही वह बिंदु है जहाँ अंकगणित स्थायी रूप से उसके विरुद्ध मुड़ जाता है। किसी काम को वित्तपोषित करने लिया ऋण उसे चुकाने की आय बना सकता है; ऋण चुकाने को लिया ऋण कुछ भी नहीं बनाता, और उसी क़र्ज़ में ब्याज का एक और चक्र भर जोड़ देता है। हर चक्र उसका देय बढ़ाता है जबकि उसकी कमाने की क्षमता वहीं रहती या घटती है। यही ऋण-जाल है, और वह उसी एक तरीक़े से समाप्त होता जिससे हो सकता: जो कुछ उसके पास बचा है उसकी बिक्री से, आमतौर पर ज़मीन, जो फिर भविष्य में कमाने की उसकी क्षमता भी छीन लेती है। ध्यान दो यह विश्लेषण असली समस्या किसे बताता है। ब्याज दर स्वयं नहीं — दोनों किसानों ने वही दर चुकाई। बुरे मौसम और चूक के बीच किसी गद्दी का न होना। जहाँ वह गद्दी है वहाँ विफल फ़सल एक झटका है; जहाँ नहीं है वहाँ वह परिसंपत्तियों की स्थायी हानि। इसीलिए नीतिगत उत्तर अकेली दर पर नहीं, गद्दी पर हमला करते हैं: फ़सल बीमा, ताकि विफल फ़सल की भरपाई हो; घोषित सूखे में ऋणों की पुनर्निर्धारण, ताकि चुकौती अगले मौसम की प्रतीक्षा कर सके; रोज़गार गारंटी, जो उस घर के नीचे मज़दूरी-आय रखती है जिसकी अपनी भूमि कुछ नहीं देती; और समर्थन मूल्य पर सरकारी ख़रीद, जो इस संभावना को घटाती है कि अच्छी फ़सल के सामने दाम ढह जाएँ। यह उस गहरी अन्यायपूर्णता को भी समझाता है जिसका अध्याय आगे वर्णन करता है। सबसे निर्धन उधारकर्ता ठीक वही हैं जिनके पास न गद्दी है न ज़मानत, अतः औपचारिक ऋणदाता उन्हें नहीं देते और वे ऊँची दरों पर अनौपचारिक स्रोतों की ओर मुड़ते हैं — जिसका अर्थ है कि जो लोग बुरा वर्ष सह पाने में सबसे कम सक्षम हैं उन्हीं से उस ऋण के लिए सबसे अधिक वसूला जाता है जो उन्हें परखेगा। (ग़लत उत्तर छिपा दर-अंतर गढ़ते, पहले किसान के लाभ के बावजूद साख की ही निंदा करते, या संकट-उधारी और भूमि-बिक्री के भली-भाँति दर्ज क्रम को नकारते हैं।)",
          mr: "उदाहरण असे मांडले की कर्ज सारखे असावे — तीच रक्कम, तोच दर, तोच हेतू — जे स्पष्टीकरणाला कर्जाबाहेर असण्यास भाग पाडते. पत जे करते ते उत्पन्न काळाच्या आरपार हलवणे. शेतकऱ्याला जूनमध्ये बियाणे व खत लागते पण कमाई नोव्हेंबरच्या पिकानंतरच, म्हणून कर्ज अपेक्षित भविष्यातील उत्पन्नाचे आता उपलब्ध पैशात रूपांतर करते. अख्खी व्यवस्था एका अंदाजावर टेकलेली: की ते उत्पन्न खरोखर येईल, आणि वेळेत येईल. पहिल्या शेतकऱ्याचा अंदाज टिकला. पाऊस आला, पीक चांगले आले, विक्रीने कर्ज व व्याज झाकले आणि काही उरलेही, आणि तो कर्ज न घेतल्यापेक्षा चांगल्या स्थितीत राहिला — कारण कर्जाविना तो निविष्ठा विकत घेऊच शकला नसता आणि कमी कापले असते. इथे पतीने नेमके तेच केले ज्यासाठी ती आहे. दुसऱ्या शेतकऱ्याचा अंदाज फसला, आणि अशा कारणाने फसला जे पूर्णपणे त्याच्या नियंत्रणाबाहेर होते. पाऊस आला नाही. पण जबाबदारी पावसावर सशर्त नव्हती; त्याच्यावर मुद्दल आणि व्याज काहीही असो, बाकी आहे. हीच विषमता गाभा: क्रियेचा परतावा अनिश्चित, आणि परतफेड निश्चित. आता महत्त्वाची पुढची पायरी, जिथे वाईट वर्ष नाशात बदलते. उत्पन्न नसल्याने त्याने पुन्हा कर्ज घेतले — काही पेरायला नव्हे, तर आधीचे कर्ज फेडायला. हाच तो बिंदू जिथे अंकगणित कायमचे त्याच्याविरुद्ध वळते. एखाद्या कामाला अर्थपुरवठा करायला घेतलेले कर्ज ते फेडण्याचे उत्पन्न घडवू शकते; कर्ज फेडायला घेतलेले कर्ज काहीही घडवत नाही, आणि त्याच कर्जात व्याजाची आणखी एक फेरी भर घालते. प्रत्येक फेरी त्याचे देणे वाढवते तर त्याची कमावण्याची क्षमता तिथेच राहते वा घटते. हाच कर्जसापळा, आणि तो त्याच एका मार्गाने संपतो जो शक्य: त्याच्याकडे जे उरले त्याच्या विक्रीने, सहसा जमीन, जी मग भविष्यात कमावण्याची त्याची क्षमताही हिरावते. लक्षात घ्या हे विश्लेषण खरी समस्या कोणती सांगते. व्याजदर स्वतः नव्हे — दोन्ही शेतकऱ्यांनी तोच दर दिला. वाईट हंगाम आणि थकबाकीदरम्यान कोणतीही उशी नसणे. जिथे ती उशी असते तिथे बुडलेले पीक एक धक्का; जिथे नसते तिथे ते मालमत्तेचे कायमचे नुकसान. म्हणूनच धोरणात्मक उत्तरे एकट्या दरावर नव्हे तर उशीवर हल्ला करतात: पीक विमा, जेणेकरून बुडलेल्या पिकाची भरपाई होईल; जाहीर दुष्काळात कर्जांचे पुनर्नियोजन, जेणेकरून परतफेड पुढच्या हंगामाची वाट पाहू शकेल; रोजगार हमी, जी ज्या घराची स्वतःची जमीन काही देत नाही त्याखाली मजुरी-उत्पन्न ठेवते; आणि आधारभूत किमतीवर शासकीय खरेदी, जी चांगल्या पिकासमोर भाव कोसळण्याची शक्यता घटवते. हे त्या खोल अन्याय्यतेलाही समजावते जिचे प्रकरण पुढे वर्णन करते. सर्वांत गरीब कर्जदार नेमके तेच ज्यांच्याकडे ना उशी ना तारण, म्हणून औपचारिक सावकार त्यांना देत नाहीत आणि ते जास्त दरांवर अनौपचारिक स्रोतांकडे वळतात — म्हणजे जे लोक वाईट वर्ष सोसण्यास सर्वांत कमी सक्षम त्यांच्याकडूनच त्या कर्जासाठी सर्वाधिक वसूल केले जाते जे त्यांची परीक्षा घेणार आहे. (चुकीची उत्तरे लपलेला दर-फरक रचतात, पहिल्या शेतकऱ्याचा फायदा असूनही पतीचीच निंदा करतात, वा संकट-कर्ज आणि जमीन-विक्रीचा नोंदलेला क्रम नाकारतात.)",
        },
      },
      {
        level: 6,
        stem: {
          en: "The poorest borrowers in India pay the highest interest rates, which looks like a straightforward injustice. Explain why lenders behave this way, and how Self-Help Groups manage to lend to exactly those borrowers at far lower rates without collateral.",
          hi: "भारत के सबसे निर्धन उधारकर्ता सबसे ऊँचा ब्याज चुकाते हैं, जो सीधा अन्याय लगता है। समझाओ ऋणदाता ऐसा बरतते क्यों हैं, और स्वयं सहायता समूह ठीक उन्हीं उधारकर्ताओं को बिना ज़मानत कहीं कम दरों पर उधार देने में सफल कैसे होते हैं।",
          mr: "भारतातील सर्वांत गरीब कर्जदार सर्वाधिक व्याज देतात, जे सरळ अन्याय वाटतो. समजावा सावकार असे का वागतात, आणि बचत गट नेमक्या त्याच कर्जदारांना तारणाविना कितीतरी कमी दरांवर कर्ज देण्यात यशस्वी कसे होतात.",
        },
        choices: [
          {
            en: "Formal lenders demand collateral and documents because they cannot otherwise judge or enforce repayment, and a landless household has neither — so it is excluded and must borrow informally, where the lender's own risk and local monopoly push rates very high. A Self-Help Group solves the same problem differently: members know each other's circumstances, the group vouches for and pursues repayment collectively, and a bank lending to the group faces low risk without needing any individual's asset",
            hi: "औपचारिक ऋणदाता ज़मानत और काग़ज़ इसलिए माँगते हैं कि अन्यथा वे चुकौती न आँक सकते न मनवा सकते, और भूमिहीन घर के पास दोनों नहीं — अतः वह बाहर हो जाता और अनौपचारिक रूप से उधार लेता, जहाँ ऋणदाता का अपना जोखिम तथा स्थानीय एकाधिकार दरें बहुत ऊँची कर देते हैं। स्वयं सहायता समूह वही समस्या भिन्न ढंग से हल करता है: सदस्य एक-दूसरे की परिस्थिति जानते हैं, समूह सामूहिक रूप से चुकौती की ज़मानत लेता और उसका पीछा करता है, और समूह को उधार देते बैंक का जोखिम बिना किसी की परिसंपत्ति माँगे कम रहता है",
            mr: "औपचारिक सावकार तारण आणि कागदपत्रे यासाठी मागतात की एरवी ते परतफेडीचा अंदाजही घेऊ शकत नाहीत आणि ती वसूलही करू शकत नाहीत, आणि भूमिहीन घराकडे दोन्ही नाहीत — म्हणून ते वगळले जाते आणि अनौपचारिकरीत्या कर्ज घेते, जिथे सावकाराची स्वतःची जोखीम व स्थानिक मक्तेदारी दर खूप वर नेतात. बचत गट तीच समस्या वेगळ्या प्रकारे सोडवतो: सदस्य एकमेकांची परिस्थिती जाणतात, गट सामूहिकरीत्या परतफेडीची हमी घेतो आणि तिचा पाठपुरावा करतो, आणि गटाला कर्ज देणाऱ्या बँकेला कोणाचीही मालमत्ता न मागता कमी जोखीम",
          },
          {
            en: "Because lenders are required by the Reserve Bank to charge the poor more than the rich",
            hi: "क्योंकि रिज़र्व बैंक ऋणदाताओं से माँगता है कि वे निर्धनों से धनवानों से अधिक लें",
            mr: "कारण रिझर्व्ह बँक सावकारांकडून मागते की त्यांनी गरिबांकडून श्रीमंतांहून अधिक घ्यावे",
          },
          {
            en: "Because poor borrowers prefer high interest rates and would refuse a cheaper loan if offered one",
            hi: "क्योंकि निर्धन उधारकर्ता ऊँची ब्याज दरें पसंद करते हैं और सस्ता ऋण देने पर उसे ठुकरा देंगे",
            mr: "कारण गरीब कर्जदार जास्त व्याजदर पसंत करतात आणि स्वस्त कर्ज दिल्यास ते नाकारतील",
          },
          {
            en: "Because interest rates are identical for everyone in India, so the premise of the question is false",
            hi: "क्योंकि भारत में ब्याज दरें सबके लिए समान हैं, अतः प्रश्न का आधार झूठा है",
            mr: "कारण भारतात व्याजदर सर्वांसाठी सारखेच आहेत, म्हणून प्रश्नाचे गृहीतक खोटे आहे",
          },
        ],
        answerIndex: 0,
        solution: {
          en: "The pattern looks perverse — those least able to pay are charged most — and it is unjust in its effects, but understanding why it happens is what makes it fixable. Begin with the lender's problem. Anyone lending money faces two difficulties: judging in advance whether the borrower will repay, and recovering the money if they do not. A formal lender, a bank, is a large institution dealing with strangers, so it solves both by paperwork. It asks for documents establishing income, and it asks for collateral — land, a house, jewellery, a salary slip — an asset it can seize if repayment fails. This works well enough for a salaried employee or a landowning farmer. Now apply it to a landless labourer working in the unorganised sector, which is where most of India's workers are. He owns no land to pledge. He has no employer on record and no payslip to prove an income. He may have no bank account history at all. From the bank's side there is no way to assess him and no way to enforce against him, so the loan is refused. Note that the refusal is not caused by his poverty as such but by the absence of the instruments the bank uses — and those instruments happen to be exactly what poverty means. So he goes to an informal lender: a village moneylender, a trader who buys his crop, an employer who advances wages. These lenders can lend because they solve the problem differently: they live locally, they know his circumstances, and they can enforce repayment through social pressure, through control of his crop sale, or through his continued employment. But they charge very high rates, for two reasons that must be separated. One is genuine risk — some of these loans really are not repaid, and the rate covers the losses. The other is market power: in a village with one moneylender and no bank branch, the borrower has nowhere else to go, and a lender facing no competition sets the price. The second reason is what makes the outcome exploitative rather than merely expensive. Now the Self-Help Group, and why it works. It attacks the same two difficulties from the other end. Fifteen or twenty women in a village save a small amount every week and lend within the group, at terms they set themselves. Because they live in the same village, they have information no bank could buy — who is reliable, whose harvest failed, who is struggling this month — which solves the assessment problem. Because the loan is made and pursued collectively, and because a member who defaults answers to neighbours she will see every day, repayment is enforced without any asset being seized — which solves the enforcement problem. After a period of regular saving and internal lending, the group has a demonstrated record, and a bank can lend to the group as a whole. The bank's risk is now low, so it can charge a normal rate; the group on-lends to members at rates far below the moneylender's. No collateral changed hands anywhere in the chain. Two things are worth adding. First, the mechanism is not charity but a genuine reduction in risk — the repayment record of these groups has generally been high, which is why banks lend to them commercially. Second, the meetings do more than move money: they are often the first regular occasion on which women in a village discuss savings, land, schooling and health together, and that has effects the loan ledger does not record. The broader point is that exclusion from formal credit is not a fact of nature but a consequence of how lending is organised, and organising it differently changes who can borrow. (The wrong answers invent a regulation requiring higher rates for the poor, attribute a preference for expensive credit to borrowers who consistently switch to cheaper sources when available, or deny a rate gap that every rural credit survey records.)",
          hi: "ढर्रा विकृत लगता है — जो चुकाने में सबसे कम सक्षम उन्हीं से सबसे अधिक लिया जाता — और अपने प्रभावों में वह अन्यायपूर्ण है, पर वह होता क्यों है यह समझना ही उसे सुधार-योग्य बनाता है। ऋणदाता की समस्या से शुरू। पैसा उधार देते किसी के सामने दो कठिनाइयाँ हैं: पहले से आँकना कि उधार लेने वाला चुकाएगा या नहीं, और न चुकाए तो पैसा वसूलना। औपचारिक ऋणदाता, बैंक, अजनबियों से निपटती बड़ी संस्था है, अतः वह दोनों को काग़ज़ी काम से हल करती है। वह आय सिद्ध करते दस्तावेज़ माँगती है, और ज़मानत माँगती है — ज़मीन, मकान, गहने, वेतन-पर्ची — ऐसी परिसंपत्ति जिसे चुकौती चूकने पर वह ज़ब्त कर सके। यह वेतनभोगी कर्मचारी या भूस्वामी किसान के लिए ठीक चलता है। अब इसे असंगठित क्षेत्रक में काम करते भूमिहीन मज़दूर पर लगाओ, जहाँ भारत के अधिकांश मज़दूर हैं। उसके पास गिरवी रखने को भूमि नहीं। अभिलेख में कोई नियोक्ता नहीं और आय सिद्ध करने को कोई वेतन-पर्ची नहीं। शायद कोई बैंक-खाता इतिहास ही न हो। बैंक की ओर से उसे आँकने का कोई उपाय नहीं और उस पर वसूली मनवाने का कोई उपाय नहीं, अतः ऋण मना कर दिया जाता है। ध्यान दो कि यह इनकार उसकी निर्धनता से नहीं बल्कि उन साधनों के अभाव से आता है जिन्हें बैंक इस्तेमाल करती है — और वे साधन संयोग से ठीक वही हैं जिनका न होना निर्धनता है। अतः वह अनौपचारिक ऋणदाता के पास जाता है: गाँव का साहूकार, उसकी फ़सल ख़रीदता व्यापारी, मज़दूरी अग्रिम देता नियोक्ता। ये ऋणदाता उधार दे सकते हैं क्योंकि वे समस्या भिन्न ढंग से हल करते हैं: वे स्थानीय रहते हैं, उसकी परिस्थिति जानते हैं, और सामाजिक दबाव से, उसकी फ़सल-बिक्री पर नियंत्रण से, या उसके जारी रोज़गार से चुकौती मनवा सकते हैं। पर वे बहुत ऊँची दरें लेते हैं, दो कारणों से जिन्हें अलग करना चाहिए। एक असली जोखिम — इनमें से कुछ ऋण सचमुच नहीं चुकते, और दर हानियाँ ढकती है। दूसरा बाज़ार-शक्ति: जिस गाँव में एक साहूकार और कोई बैंक-शाखा नहीं, वहाँ उधार लेने वाले के पास जाने को और कहीं नहीं, और प्रतिस्पर्धा-रहित ऋणदाता दाम तय करता है। दूसरा कारण ही परिणाम को केवल महँगा नहीं, शोषक बनाता है। अब स्वयं सहायता समूह, और वह चलता क्यों है। वह उन्हीं दो कठिनाइयों पर दूसरे सिरे से हमला करता है। गाँव की पंद्रह-बीस स्त्रियाँ हर हफ़्ते थोड़ी बचत करती और समूह के भीतर, अपनी तय शर्तों पर उधार देती हैं। क्योंकि वे एक ही गाँव में रहती हैं, उनके पास ऐसी सूचना है जो कोई बैंक ख़रीद नहीं सकती — कौन भरोसेमंद है, किसकी फ़सल चूकी, कौन इस महीने जूझ रही — जो आकलन की समस्या हल करती है। क्योंकि ऋण सामूहिक रूप से दिया और उसका पीछा किया जाता है, और क्योंकि चूकती सदस्या उन्हीं पड़ोसियों को उत्तर देती है जिन्हें वह हर दिन देखेगी, चुकौती बिना कोई परिसंपत्ति ज़ब्त किए मनवाई जाती है — जो वसूली की समस्या हल करती है। नियमित बचत और आंतरिक उधारी की अवधि के बाद समूह के पास सिद्ध रिकॉर्ड होता है, और बैंक पूरे समूह को उधार दे सकती है। बैंक का जोखिम अब कम है, अतः वह सामान्य दर ले सकती है; समूह सदस्यों को साहूकार की दर से कहीं नीचे आगे उधार देता है। शृंखला में कहीं कोई ज़मानत हाथ नहीं बदली। दो बातें जोड़ने योग्य हैं। पहली, क्रियाविधि दान नहीं बल्कि जोखिम में असली कमी है — इन समूहों का चुकौती-रिकॉर्ड आमतौर पर ऊँचा रहा है, इसीलिए बैंक उन्हें व्यावसायिक रूप से उधार देती हैं। दूसरी, बैठकें पैसा हिलाने से अधिक करती हैं: वे अक्सर पहला नियमित अवसर होती हैं जब गाँव की स्त्रियाँ बचत, ज़मीन, पढ़ाई और स्वास्थ्य पर साथ चर्चा करती हैं, और उसके ऐसे प्रभाव हैं जो ऋण-बही दर्ज नहीं करती। व्यापक बिंदु यह कि औपचारिक ऋण से बहिष्कार प्रकृति का तथ्य नहीं बल्कि इसका परिणाम है कि उधारी संगठित कैसे है, और उसे भिन्न ढंग से संगठित करना बदल देता है कि उधार कौन ले सकता है। (ग़लत उत्तर निर्धनों से ऊँची दर माँगता कोई नियमन गढ़ते, महँगी साख की पसंद उन उधारकर्ताओं पर थोपते जो सस्ता स्रोत उपलब्ध होते ही लगातार उसकी ओर मुड़ते हैं, या उस दर-अंतर को नकारते जिसे हर ग्रामीण ऋण-सर्वेक्षण दर्ज करता है।)",
          mr: "प्रारूप विकृत वाटते — जे फेडण्यास सर्वांत कमी सक्षम त्यांच्याकडूनच सर्वाधिक घेतले जाते — आणि आपल्या परिणामांत ते अन्याय्य आहे, पण ते का घडते हे समजणेच त्याला दुरुस्त करण्याजोगे करते. सावकाराच्या समस्येपासून सुरू. पैसे कर्जाऊ देणाऱ्या कोणासमोर दोन अडचणी: आधीच अंदाजणे की कर्जदार फेडेल की नाही, आणि फेडले नाही तर पैसे वसूल करणे. औपचारिक सावकार, बँक, अनोळखींशी व्यवहार करणारी मोठी संस्था, म्हणून ती दोन्ही कागदपत्रांनी सोडवते. ती उत्पन्न सिद्ध करणारी कागदपत्रे मागते, आणि तारण मागते — जमीन, घर, दागिने, पगारपत्रक — अशी मालमत्ता जी परतफेड फसल्यास ती जप्त करू शकेल. हे पगारदार कर्मचारी वा जमीनदार शेतकऱ्यासाठी पुरेसे चालते. आता ते असंघटित क्षेत्रात काम करणाऱ्या भूमिहीन मजुरावर लावा, जिथे भारतातील बहुतांश कामगार आहेत. त्याच्याकडे गहाण ठेवायला जमीन नाही. नोंदीत कोणता मालक नाही आणि उत्पन्न सिद्ध करायला पगारपत्रक नाही. कदाचित कोणता बँक-खाते इतिहासच नसेल. बँकेच्या बाजूने त्याचा अंदाज घेण्याचा मार्ग नाही आणि त्याच्यावर वसुली करण्याचा मार्ग नाही, म्हणून कर्ज नाकारले जाते. लक्षात घ्या हा नकार त्याच्या गरिबीमुळे नव्हे तर बँक वापरत असलेल्या साधनांच्या अभावामुळे — आणि ती साधने योगायोगाने नेमकी तीच ज्यांचे नसणे म्हणजे गरिबी. म्हणून तो अनौपचारिक सावकाराकडे जातो: गावचा सावकार, त्याचे पीक विकत घेणारा व्यापारी, मजुरी आगाऊ देणारा मालक. हे सावकार कर्ज देऊ शकतात कारण ते समस्या वेगळ्या प्रकारे सोडवतात: ते स्थानिक राहतात, त्याची परिस्थिती जाणतात, आणि सामाजिक दबावाने, त्याच्या पीकविक्रीवरील नियंत्रणाने, वा त्याच्या चालू रोजगाराने परतफेड वसूल करू शकतात. पण ते खूप जास्त दर आकारतात, दोन कारणांनी जी वेगळी करावी लागतात. एक खरी जोखीम — यांतील काही कर्जे खरोखर फिटत नाहीत, आणि दर तोटे झाकतो. दुसरे बाजारशक्ती: ज्या गावात एक सावकार आणि कोणती बँक शाखा नाही, तिथे कर्जदाराकडे जायला दुसरीकडे नाही, आणि स्पर्धेविनाचा सावकार किंमत ठरवतो. दुसरे कारणच निकालाला केवळ महाग नव्हे तर शोषक बनवते. आता बचत गट, आणि तो का चालतो. तो त्याच दोन अडचणींवर दुसऱ्या टोकाकडून हल्ला करतो. गावातील पंधरा-वीस स्त्रिया दर आठवड्याला थोडी बचत करतात आणि गटाच्या आत, स्वतः ठरवलेल्या अटींवर कर्ज देतात. त्या एकाच गावात राहत असल्याने, त्यांच्याकडे अशी माहिती जी कोणतीही बँक विकत घेऊ शकत नाही — कोण विश्वासार्ह, कोणाचे पीक बुडाले, कोण या महिन्यात झगडत आहे — जी अंदाजाची समस्या सोडवते. कर्ज सामूहिकरीत्या दिले आणि त्याचा पाठपुरावा केला जात असल्याने, आणि थकबाकी करणारी सदस्या ज्या शेजाऱ्यांना ती रोज पाहणार त्यांना उत्तर देत असल्याने, परतफेड कोणतीही मालमत्ता जप्त न करता वसूल होते — जी वसुलीची समस्या सोडवते. नियमित बचत आणि अंतर्गत कर्जाच्या कालावधीनंतर गटाकडे सिद्ध लौकिक असतो, आणि बँक अख्ख्या गटाला कर्ज देऊ शकते. बँकेची जोखीम आता कमी, म्हणून ती सामान्य दर आकारू शकते; गट सदस्यांना सावकाराच्या दराहून कितीतरी खाली पुढे कर्ज देतो. साखळीत कुठेही कोणतेही तारण हात बदलले नाही. दोन गोष्टी जोडण्याजोग्या. पहिली, क्रियाविधी दान नव्हे तर जोखमीत खरी घट — या गटांचा परतफेडीचा लौकिक सहसा उच्च राहिला आहे, म्हणूनच बँका त्यांना व्यावसायिकरीत्या कर्ज देतात. दुसरी, बैठका पैसा हलवण्याहून अधिक करतात: त्या अनेकदा पहिला नियमित प्रसंग असतात जेव्हा गावातील स्त्रिया बचत, जमीन, शिक्षण आणि आरोग्यावर एकत्र चर्चा करतात, आणि त्याचे असे परिणाम जे कर्जाची खतावणी नोंदवत नाही. व्यापक मुद्दा हा की औपचारिक कर्जातून वगळणे हे निसर्गाचे तथ्य नव्हे तर कर्जदान कसे संघटित आहे याचा परिणाम, आणि ते वेगळ्या प्रकारे संघटित केल्याने कोण कर्ज घेऊ शकतो हे बदलते. (चुकीची उत्तरे गरिबांकडून जास्त दर मागणारे नियमन रचतात, स्वस्त स्रोत उपलब्ध होताच सातत्याने त्याकडे वळणाऱ्या कर्जदारांवर महाग पतीची आवड लादतात, वा प्रत्येक ग्रामीण कर्ज-सर्वेक्षण नोंदवत असलेली दर-दरी नाकारतात.)",
        },
      },
    ],
  },
];
