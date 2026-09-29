-- Mother tongue and nationality become names from a list (contracts:
-- MOTHER_TONGUES, NATIONALITIES). What was typed before the lists is mapped
-- where it is one of the list's own names, in English, Hindi or Marathi; a
-- word that is none of them is left exactly as it was, shown on the form
-- until somebody picks from the list, and counted as blank by a filing.
UPDATE "PupilRecord" SET "motherTongue" = CASE
    WHEN lower(btrim("motherTongue")) IN ('assamese', 'असमिया', 'आसामी') THEN 'ASSAMESE'
    WHEN lower(btrim("motherTongue")) IN ('bengali', 'बांग्ला', 'बंगाली') THEN 'BENGALI'
    WHEN lower(btrim("motherTongue")) IN ('bodo', 'बोडो') THEN 'BODO'
    WHEN lower(btrim("motherTongue")) IN ('dogri', 'डोगरी') THEN 'DOGRI'
    WHEN lower(btrim("motherTongue")) IN ('english', 'अंग्रेज़ी', 'इंग्रजी') THEN 'ENGLISH'
    WHEN lower(btrim("motherTongue")) IN ('gujarati', 'गुजराती') THEN 'GUJARATI'
    WHEN lower(btrim("motherTongue")) IN ('hindi', 'हिंदी') THEN 'HINDI'
    WHEN lower(btrim("motherTongue")) IN ('kannada', 'कन्नड़', 'कन्नड') THEN 'KANNADA'
    WHEN lower(btrim("motherTongue")) IN ('kashmiri', 'कश्मीरी', 'काश्मिरी') THEN 'KASHMIRI'
    WHEN lower(btrim("motherTongue")) IN ('konkani', 'कोंकणी') THEN 'KONKANI'
    WHEN lower(btrim("motherTongue")) IN ('maithili', 'मैथिली') THEN 'MAITHILI'
    WHEN lower(btrim("motherTongue")) IN ('malayalam', 'मलयालम', 'मल्याळम') THEN 'MALAYALAM'
    WHEN lower(btrim("motherTongue")) IN ('manipuri', 'मणिपुरी') THEN 'MANIPURI'
    WHEN lower(btrim("motherTongue")) IN ('marathi', 'मराठी') THEN 'MARATHI'
    WHEN lower(btrim("motherTongue")) IN ('nepali', 'नेपाली', 'नेपाळी') THEN 'NEPALI'
    WHEN lower(btrim("motherTongue")) IN ('odia', 'ओड़िया', 'ओडिया') THEN 'ODIA'
    WHEN lower(btrim("motherTongue")) IN ('punjabi', 'पंजाबी') THEN 'PUNJABI'
    WHEN lower(btrim("motherTongue")) IN ('sanskrit', 'संस्कृत') THEN 'SANSKRIT'
    WHEN lower(btrim("motherTongue")) IN ('santali', 'संथाली', 'संथाळी') THEN 'SANTALI'
    WHEN lower(btrim("motherTongue")) IN ('sindhi', 'सिंधी') THEN 'SINDHI'
    WHEN lower(btrim("motherTongue")) IN ('tamil', 'तमिल', 'तमिळ') THEN 'TAMIL'
    WHEN lower(btrim("motherTongue")) IN ('telugu', 'तेलुगु', 'तेलुगू') THEN 'TELUGU'
    WHEN lower(btrim("motherTongue")) IN ('urdu', 'उर्दू') THEN 'URDU'
    WHEN lower(btrim("motherTongue")) IN ('hindi', 'हिन्दी') THEN 'HINDI'
    WHEN lower(btrim("motherTongue")) IN ('oriya') THEN 'ODIA'
    WHEN lower(btrim("motherTongue")) IN ('bangla') THEN 'BENGALI'
    ELSE "motherTongue" END
 WHERE "motherTongue" IS NOT NULL;

UPDATE "PupilRecord" SET "nationality" = CASE
    WHEN lower(btrim("nationality")) IN ('indian', 'भारतीय') THEN 'INDIAN'
    WHEN lower(btrim("nationality")) IN ('nepali', 'नेपाली', 'नेपाळी') THEN 'NEPALI'
    WHEN lower(btrim("nationality")) IN ('bhutanese', 'भूटानी', 'भूतानी') THEN 'BHUTANESE'
    WHEN lower(btrim("nationality")) IN ('bangladeshi', 'बांग्लादेशी', 'बांगलादेशी') THEN 'BANGLADESHI'
    WHEN lower(btrim("nationality")) IN ('sri lankan', 'श्रीलंकाई', 'श्रीलंकन') THEN 'SRI_LANKAN'
    WHEN lower(btrim("nationality")) IN ('india', 'bharatiya', 'bhartiya') THEN 'INDIAN'
    ELSE "nationality" END
 WHERE "nationality" IS NOT NULL;

-- A PIN typed with a space in it ("411 001") is the same PIN.
UPDATE "PupilRecord" SET "postalCode" = regexp_replace("postalCode", '\s+', '', 'g')
 WHERE "postalCode" ~ '^[1-9][0-9]{2}\s+[0-9]{3}$';
