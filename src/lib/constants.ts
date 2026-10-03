export const APP_CONFIG = {
  name: "ABCD of JNVST",
  tagline: "Class 6 Navodaya Vidyalaya Entrance Exam Preparation",
  description:
    "Dedicated, structured, and affordable ₹500 preparation platform for Jawahar Navodaya Vidyalaya Selection Test (JNVST) Class 6 aspirants.",
  targetCapacity: 500,
  defaultTargetYear: 2027,
  subscriptionPriceINR: Number(process.env.SUBSCRIPTION_PRICE_INR) || 500,
  defaultSubscriptionDurationDays:
    Number(process.env.DEFAULT_SUBSCRIPTION_DURATION_DAYS) || 365,
  contactEmail: "support@abcdjnvst.in",
  standardExamMarksPerQuestion: 1.25,
  standardNegativeMarksPerQuestion: 0.0,
  fullMockTestQuestionsCount: 80,
  fullMockTestDurationMinutes: 120,
};

export const JNVST_SECTIONS = [
  {
    id: "mental_ability",
    title_en: "Mental Ability Test (MAT)",
    title_hi: "मानसिक योग्यता परीक्षा",
    questionsCount: 40,
    totalMarks: 50,
    timeMinutes: 60,
    color: "teal",
    description:
      "10 non-verbal figure-based categories evaluating reasoning and cognitive skills.",
  },
  {
    id: "arithmetic",
    title_en: "Arithmetic Test",
    title_hi: "अंकगणित परीक्षा",
    questionsCount: 20,
    totalMarks: 25,
    timeMinutes: 30,
    color: "amber",
    description:
      "15 core numerical and mathematical concepts testing calculations and application.",
  },
  {
    id: "language",
    title_en: "Language Test",
    title_hi: "भाषा परीक्षा",
    questionsCount: 20,
    totalMarks: 25,
    timeMinutes: 30,
    color: "indigo",
    description:
      "Reading comprehension passages testing contextual understanding and vocabulary.",
  },
] as const;

export const JNVST_MAT_CATEGORIES = [
  {
    id: "odd_man_out",
    title_en: "Odd-Man-Out",
    title_hi: "असंगत को अलग करना",
    description_en: "Find the figure that differs from the other three figures.",
    description_hi: "चार आकृतियों में से भिन्न आकृति पहचानें।",
  },
  {
    id: "figure_matching",
    title_en: "Figure Matching",
    title_hi: "आकृति मिलान",
    description_en: "Select the figure that exactly matches the problem figure.",
    description_hi: "समस्या आकृति के समान उत्तर आकृति का चयन करें।",
  },
  {
    id: "pattern_completion",
    title_en: "Pattern Completion",
    title_hi: "पैटर्न पूरा करना",
    description_en: "Identify the missing part to complete the overall pattern.",
    description_hi: "अपूर्ण पैटर्न को पूरा करने वाली आकृति चुनें।",
  },
  {
    id: "figure_series_completion",
    title_en: "Figure Series Completion",
    title_hi: "आकृति श्रृंखला पूर्ति",
    description_en: "Determine the subsequent figure following a logical progression.",
    description_hi: "श्रृंखला में अगले क्रम की आकृति चुनें।",
  },
  {
    id: "analogy",
    title_en: "Analogy",
    title_hi: "सादृश्यता",
    description_en: "Find the relationship between figures and apply it to the problem.",
    description_hi: "प्रथम दो आकृतियों के संबंध के आधार पर उत्तर चुनें।",
  },
  {
    id: "geometrical_figure_completion",
    title_en: "Geometrical Figure Completion",
    title_hi: "रेखागणितीय आकृति पूर्ति",
    description_en: "Select the part completing a triangle, square, or circle.",
    description_hi: "त्रिभुज, वर्ग या वृत्त को पूरा करने वाली आकृति चुनें।",
  },
  {
    id: "mirror_imaging",
    title_en: "Mirror Imaging",
    title_hi: "दर्पण प्रतिबिम्ब",
    description_en:
      "Determine the exact mirror reflection when viewed through mirror XY.",
    description_hi: "दर्पण XY के सम्मुख सही प्रतिबिम्ब पहचानें।",
  },
  {
    id: "punched_hole_pattern",
    title_en: "Punched Hole Pattern (Paper Folding)",
    title_hi: "कागज मोड़ना और काटना",
    description_en: "Predict how the folded and cut paper looks when unfolded.",
    description_hi: "कागज को मोड़ने व छेदने के बाद खोलने पर आकृति।",
  },
  {
    id: "space_visualization",
    title_en: "Space Visualization",
    title_hi: "स्थान दृश्य अवलोकन",
    description_en: "Combine cut-out pieces into a single composite figure.",
    description_hi: "अलग-अलग टुकड़ों को जोड़कर बनने वाली आकृति।",
  },
  {
    id: "embedded_figure",
    title_en: "Embedded Figure",
    title_hi: "सन्निहित (छिपी हुई) आकृति",
    description_en: "Locate the hidden problem figure inside one of the options.",
    description_hi: "दी गई समस्या आकृति किस उत्तर आकृति में छिपी है।",
  },
] as const;

export const JNVST_ARITHMETIC_TOPICS = [
  {
    id: "number_and_numeric_system",
    title_en: "Number & Numeric System",
    title_hi: "संख्या और संख्या प्रणाली",
  },
  {
    id: "four_fundamental_operations",
    title_en: "Four Fundamental Operations on Whole Numbers",
    title_hi: "पूर्ण संख्याओं पर चार आधारभूत संक्रियाएं",
  },
  {
    id: "fractional_numbers",
    title_en: "Fractional Numbers & Operations",
    title_hi: "भिन्न संख्याएं और उन पर संक्रियाएं",
  },
  {
    id: "factors_and_multiples",
    title_en: "Factors and Multiples (LCM & HCF)",
    title_hi: "गुणनखंड और गुणज (ल.स. और म.स.)",
  },
  {
    id: "decimals_and_fundamental_operations",
    title_en: "Decimals & Fundamental Operations",
    title_hi: "दशमलव और उन पर आधारभूत संक्रियाएं",
  },
  {
    id: "conversion_of_fractions",
    title_en: "Conversion of Fractions & Decimals",
    title_hi: "भिन्नों का दशमलव में परिवर्तन",
  },
  {
    id: "measurement",
    title_en: "Measurement (Length, Mass, Capacity, Time, Money)",
    title_hi: "मापन (लंबाई, द्रव्यमान, समय, धन)",
  },
  {
    id: "distance_time_and_speed",
    title_en: "Distance, Time and Speed",
    title_hi: "दूरी, समय और गति",
  },
  {
    id: "approximation_of_expressions",
    title_en: "Approximation of Numerical Expressions",
    title_hi: "व्यंजकों का सन्निकटन",
  },
  {
    id: "simplification_of_numerical_expressions",
    title_en: "Simplification (BODMAS Rule)",
    title_hi: "संख्यात्मक व्यंजकों का सरलीकरण (BODMAS)",
  },
  {
    id: "percentage_and_its_applications",
    title_en: "Percentage and its Applications",
    title_hi: "प्रतिशतता और इसके अनुप्रयोग",
  },
  {
    id: "profit_and_loss",
    title_en: "Profit and Loss",
    title_hi: "लाभ और हानि",
  },
  {
    id: "simple_interest",
    title_en: "Simple Interest",
    title_hi: "साधारण ब्याज",
  },
  {
    id: "perimeter_area_and_volume",
    title_en: "Perimeter, Area and Volume",
    title_hi: "परिमाप, क्षेत्रफल और आयतन",
  },
] as const;

export const JNVST_LANGUAGE_TOPICS = [
  {
    id: "reading_comprehension",
    title_en: "Reading Comprehension Passages",
    title_hi: "गद्यांश आधारित प्रश्न",
  },
  {
    id: "contextual_vocabulary",
    title_en: "Contextual Vocabulary & Antonyms",
    title_hi: "शब्दावली और विलोम/समानार्थी शब्द",
  },
  {
    id: "sentence_completion",
    title_en: "Contextual Sentence Completion",
    title_hi: "वाक्य पूर्ति और अर्थ ग्रहण",
  },
] as const;

export const DIFFICULTY_LEVELS = [
  { id: "easy", label: "Easy (बुनियादी)", color: "emerald" },
  { id: "medium", label: "Medium (मध्यम)", color: "amber" },
  { id: "hard", label: "Hard (कठिन / ट्रैप)", color: "rose" },
] as const;

export const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export const GUARDIAN_RELATIONSHIPS = [
  { value: "parent", label: "Parent (Father / Mother)" },
  { value: "guardian", label: "Legal Guardian" },
  { value: "teacher", label: "School Teacher / Mentor" },
  { value: "other", label: "Other" },
] as const;
