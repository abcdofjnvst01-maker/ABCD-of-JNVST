-- Migration: 20261003000001_seed_questions.sql
-- Description: Seed initial bilingual JNVST Class 6 questions and passages

-- 1. Seed Language Reading Comprehension Passage
INSERT INTO public.passages (id, title_en, title_hi, content_en, content_hi, language_code)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'The Banyan Tree and Ecosystem',
  'बरगद का पेड़ और हमारा पर्यावरण',
  'The Banyan tree is one of the most magnificent trees in India. It is considered sacred and provides shelter to countless birds, insects, and small mammals. Its aerial roots grow downwards and take root in the soil, giving the impression of multiple trunks supporting a massive green canopy. Village elders often gather beneath its cool shade for discussions, while children play joyfully around its hanging roots.',
  'बरगद का पेड़ भारत के सबसे भव्य और विशाल पेड़ों में से एक है। इसे पवित्र माना जाता है और यह अनगिनत पक्षियों, कीड़ों तथा छोटे जानवरों को आश्रय देता है। इसकी जटाएं (वायवीय जड़ें) नीचे की ओर बढ़ती हैं और मिट्टी में जड़ें जमा लेती हैं, जिससे यह प्रतीत होता है मानो कई तने एक विशाल हरे छत्र को सहारा दे रहे हों। गांव के बड़े-बुजुर्ग अक्सर विचार-विमर्श के लिए इसकी ठंडी छांव में एकत्र होते हैं, जबकि बच्चे इसकी लटकती जड़ों के आसपास आनंद से खेलते हैं।',
  'both'
) ON CONFLICT (id) DO NOTHING;

-- 2. Seed Questions across Mental Ability, Arithmetic, and Language

-- Question 1: Mental Ability - Odd-Man-Out (MAT)
INSERT INTO public.questions (
  id, passage_id, section, topic, mat_category, difficulty, is_pyq, pyq_year, marks, negative_marks,
  question_text_en, question_text_hi, question_image_url, options, correct_option,
  explanation_en, explanation_hi
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  NULL,
  'mental_ability',
  'odd_man_out',
  'odd_man_out',
  'easy',
  true,
  2024,
  1.25,
  0.00,
  'Directions: In the following question, four figures (A), (B), (C) and (D) are given. Three of the figures are similar in some way, while one figure is different. Select the figure which is different.',
  'निर्देश: नीचे दिए गए प्रश्न में चार आकृतियां (A), (B), (C) और (D) दी गई हैं। इनमें से तीन आकृतियां किसी न किसी रूप में एक समान हैं जबकि एक आकृति भिन्न है। उस भिन्न आकृति का चयन कीजिए।',
  NULL,
  '[
    {"key": "A", "text_en": "Triangle with 3 interior dots", "text_hi": "3 आंतरिक बिंदुओं वाला त्रिभुज (3 भुजाएं - 3 बिंदु)", "image_url": null},
    {"key": "B", "text_en": "Square with 4 interior dots", "text_hi": "4 आंतरिक बिंदुओं वाला वर्ग (4 भुजाएं - 4 बिंदु)", "image_url": null},
    {"key": "C", "text_en": "Pentagon with 5 interior dots", "text_hi": "5 आंतरिक बिंदुओं वाला पंचभुज (5 भुजाएं - 5 बिंदु)", "image_url": null},
    {"key": "D", "text_en": "Hexagon with 4 interior dots", "text_hi": "4 आंतरिक बिंदुओं वाला षट्भुज (6 भुजाएं - 4 बिंदु)", "image_url": null}
  ]'::jsonb,
  'D',
  'In figures A, B, and C, the number of interior dots equals the number of sides of the polygon (Triangle=3, Square=4, Pentagon=5). In figure D, the hexagon has 6 sides but only 4 dots.',
  'आकृति A, B और C में आंतरिक बिंदुओं की संख्या बहुभुज की भुजाओं की संख्या के बराबर है (त्रिभुज=3, वर्ग=4, पंचभुज=5)। आकृति D में षट्भुज की 6 भुजाएं हैं किंतु बिंदु केवल 4 हैं, अतः यह भिन्न है।'
) ON CONFLICT (id) DO NOTHING;

-- Question 2: Mental Ability - Mirror Imaging (MAT)
INSERT INTO public.questions (
  id, passage_id, section, topic, mat_category, difficulty, is_pyq, pyq_year, marks, negative_marks,
  question_text_en, question_text_hi, question_image_url, options, correct_option,
  explanation_en, explanation_hi
) VALUES (
  '20000000-0000-0000-0000-000000000002',
  NULL,
  'mental_ability',
  'mirror_imaging',
  'mirror_imaging',
  'medium',
  true,
  2023,
  1.25,
  0.00,
  'Directions: Find the correct mirror image of the given letter combination "JNVST" when the mirror is placed on the right side (XY).',
  'निर्देश: जब दर्पण दाईं ओर (XY) रखा जाता है, तो अक्षर संयोजन "JNVST" का सही दर्पण प्रतिबिम्ब चुनिए।',
  NULL,
  '[
    {"key": "A", "text_en": "Reverse letters with inverted order: T S V N J (mirrored)", "text_hi": "दाएं से बाएं दर्पण रूप: T S V N J (उल्टे अक्षर)", "image_url": null},
    {"key": "B", "text_en": "Same order with mirrored letters: J N V S T", "text_hi": "समान क्रम में दर्पण रूप: J N V S T", "image_url": null},
    {"key": "C", "text_en": "T S N V J (mirrored)", "text_hi": "गलत क्रम: T S N V J", "image_url": null},
    {"key": "D", "text_en": "Upside down inverted: ᒕ И ᴧ S ꓕ", "text_hi": "जल प्रतिबिम्ब (ऊर्ध्वाधर उल्टा)", "image_url": null}
  ]'::jsonb,
  'A',
  'In lateral inversion through a vertical mirror, the rightmost letter (T) becomes the first letter on the left, followed by mirrored S, symmetrical V, mirrored N, and mirrored J.',
  'ऊर्ध्वाधर दर्पण में पार्श्व परिवर्तन (Lateral Inversion) के कारण सबसे दायां अक्षर (T) सबसे पहले दिखाई देता है, और सभी अक्षरों का पार्श्व उल्टा हो जाता है।'
) ON CONFLICT (id) DO NOTHING;

-- Question 3: Arithmetic - Fractional Numbers & BODMAS
INSERT INTO public.questions (
  id, passage_id, section, topic, mat_category, difficulty, is_pyq, pyq_year, marks, negative_marks,
  question_text_en, question_text_hi, question_image_url, options, correct_option,
  explanation_en, explanation_hi
) VALUES (
  '20000000-0000-0000-0000-000000000003',
  NULL,
  'arithmetic',
  'fractional_numbers',
  NULL,
  'medium',
  true,
  2024,
  1.25,
  0.00,
  'Simplify the numerical expression: 3/4 + (5/6 ÷ 2/3) - 1/2',
  'सरल कीजिए: 3/4 + (5/6 ÷ 2/3) - 1/2',
  NULL,
  '[
    {"key": "A", "text_en": "1 1/2 (3/2)", "text_hi": "1 1/2 (3/2)", "image_url": null},
    {"key": "B", "text_en": "1 3/8", "text_hi": "1 3/8", "image_url": null},
    {"key": "C", "text_en": "1 1/4 (5/4)", "text_hi": "1 1/4 (5/4)", "image_url": null},
    {"key": "D", "text_en": "2", "text_hi": "2", "image_url": null}
  ]'::jsonb,
  'A',
  'Step 1: Solve division inside bracket: 5/6 ÷ 2/3 = 5/6 * 3/2 = 15/12 = 5/4. Step 2: Addition & Subtraction: 3/4 + 5/4 - 1/2 = 8/4 - 1/2 = 2 - 1/2 = 3/2 = 1 1/2.',
  'चरण 1: कोष्ठक के अंदर भाग हल करें: 5/6 ÷ 2/3 = 5/6 * 3/2 = 5/4। चरण 2: 3/4 + 5/4 - 1/2 = 8/4 - 1/2 = 2 - 1/2 = 3/2 (1 1/2)।'
) ON CONFLICT (id) DO NOTHING;

-- Question 4: Arithmetic - Profit and Loss
INSERT INTO public.questions (
  id, passage_id, section, topic, mat_category, difficulty, is_pyq, pyq_year, marks, negative_marks,
  question_text_en, question_text_hi, question_image_url, options, correct_option,
  explanation_en, explanation_hi
) VALUES (
  '20000000-0000-0000-0000-000000000004',
  NULL,
  'arithmetic',
  'profit_and_loss',
  NULL,
  'hard',
  true,
  2023,
  1.25,
  0.00,
  'A shopkeeper bought a school bag for ₹400 and spent ₹50 on repairs and transport. If he sells it for ₹540, find his profit percentage.',
  'एक दुकानदार ने एक स्कूल बैग ₹400 में खरीदा और ₹50 उसकी मरम्मत व ढुलाई पर खर्च किए। यदि वह इसे ₹540 में बेचता है, तो उसका लाभ प्रतिशत ज्ञात कीजिए।',
  NULL,
  '[
    {"key": "A", "text_en": "20%", "text_hi": "20%", "image_url": null},
    {"key": "B", "text_en": "25%", "text_hi": "25%", "image_url": null},
    {"key": "C", "text_en": "18%", "text_hi": "18%", "image_url": null},
    {"key": "D", "text_en": "35%", "text_hi": "35%", "image_url": null}
  ]'::jsonb,
  'A',
  'Total Cost Price (CP) = ₹400 + ₹50 = ₹450. Selling Price (SP) = ₹540. Profit = SP - CP = ₹540 - ₹450 = ₹90. Profit % = (Profit / CP) * 100 = (90 / 450) * 100 = 20%.',
  'कुल क्रय मूल्य (CP) = ₹400 + ₹50 = ₹450। विक्रय मूल्य (SP) = ₹540। लाभ = ₹540 - ₹450 = ₹90। लाभ % = (90 / 450) * 100 = 20%।'
) ON CONFLICT (id) DO NOTHING;

-- Question 5: Language - Reading Comprehension (Linked to Passage)
INSERT INTO public.questions (
  id, passage_id, section, topic, mat_category, difficulty, is_pyq, pyq_year, marks, negative_marks,
  question_text_en, question_text_hi, question_image_url, options, correct_option,
  explanation_en, explanation_hi
) VALUES (
  '20000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001',
  'language',
  'reading_comprehension',
  NULL,
  'easy',
  false,
  NULL,
  1.25,
  0.00,
  'According to the passage, why does the Banyan tree appear to have multiple supportive trunks?',
  'गद्यांश के अनुसार, बरगद का पेड़ कई तनों द्वारा सहारा लिए हुए क्यों प्रतीत होता है?',
  NULL,
  '[
    {"key": "A", "text_en": "Because its aerial roots grow downwards and root into the soil", "text_hi": "क्योंकि इसकी वायवीय जड़ें नीचे बढ़कर मिट्टी में जम जाती हैं", "image_url": null},
    {"key": "B", "text_en": "Because multiple seeds were planted close together", "text_hi": "क्योंकि कई बीजों को एक साथ पास-पास बोया गया था", "image_url": null},
    {"key": "C", "text_en": "Because village elders built artificial wooden pillars", "text_hi": "क्योंकि ग्रामीणों ने कृत्रिम खंभे लगाए थे", "image_url": null},
    {"key": "D", "text_en": "Because it sheds all its outer bark every summer", "text_hi": "क्योंकि यह गर्मियों में अपनी छाल गिरा देता है", "image_url": null}
  ]'::jsonb,
  'A',
  'The passage explicitly states that the aerial roots of the Banyan tree grow downwards and root into the soil, creating pillar-like supporting structures.',
  'गद्यांश में स्पष्ट उल्लेख है कि बरगद की वायवीय जड़ें (जटाएं) नीचे बढ़कर मिट्टी में जड़ें जमा लेती हैं, जिससे वे खंभों के समान तने जैसी प्रतीत होती हैं।'
) ON CONFLICT (id) DO NOTHING;
